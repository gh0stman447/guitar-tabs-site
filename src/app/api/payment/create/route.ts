import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_CUSTOMERS, TABLE_PURCHASES, LOCAL_DEV_URL } from '@/lib/constants';
import { query } from '@/lib/db';
import { createRobokassaHash, getRobokassaConfig } from '@/lib/robokassa';
import { getUserFromRequest, normalizeEmail } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CheckoutTab {
  id: string;
  files: Record<string, boolean>;
  price: number;
  title_ru: string;
}

function distributeTotal(tabs: CheckoutTab[], total: number) {
  const subtotal = tabs.reduce((sum, tab) => sum + tab.price, 0);
  let distributed = 0;

  return tabs.map((tab, index) => {
    const sum =
      index === tabs.length - 1
        ? total - distributed
        : Math.round((tab.price / subtotal) * total);
    distributed += sum;
    return { tab, sum };
  });
}

function encodeReceipt(value: unknown) {
  return encodeURIComponent(JSON.stringify(value)).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export async function POST(req: NextRequest) {
  const { tab_id, tab_ids, firstname, email: rawEmail, newsletter, locale: rawLocale } =
    await req.json();
  const email = normalizeEmail(String(rawEmail ?? ''));
  const locale = rawLocale === 'en' ? 'en' : 'ru';
  const ids = [...new Set<string>(tab_ids ?? (tab_id ? [tab_id] : []))];

  if (!ids.length || !firstname?.trim() || !email) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
  }

  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, price, files, title_ru, is_published')
    .in('id', ids);

  if (tabsError || !tabs || tabs.length !== ids.length) {
    return NextResponse.json({ error: 'Один или несколько табов не найдены' }, { status: 404 });
  }

  const tabsData = tabs as Array<CheckoutTab & { is_published: boolean }>;
  if (tabsData.some((tab) => !tab.is_published || tab.price <= 0)) {
    return NextResponse.json({ error: 'Заказ содержит недоступный товар' }, { status: 400 });
  }

  for (const tab of tabsData) {
    const fileResult = await query('SELECT format FROM tab_files WHERE tab_id = $1', [tab.id]);
    const formats = new Set(fileResult.rows.map((file: { format: string }) => file.format));

    for (const [format, exists] of Object.entries(tab.files)) {
      if (exists && !formats.has(format)) {
        console.error(`[payment/create] File missing for format ${format} in tab ${tab.id}`);
        return NextResponse.json(
          { error: 'Файлы таба временно недоступны. Попробуйте позже или свяжитесь со мной.' },
          { status: 500 },
        );
      }
    }
  }

  const subtotal = tabsData.reduce((sum, tab) => sum + tab.price, 0);
  const discountRate = ids.length >= 3 ? 0.15 : ids.length >= 2 ? 0.1 : 0;
  const totalAmount = subtotal - Math.round(subtotal * discountRate);

  const { data: customer, error: customerError } = await supabaseAdmin
    .from(TABLE_CUSTOMERS)
    .upsert(
      { firstname: firstname.trim(), email, newsletter: newsletter ?? false },
      { onConflict: 'email' },
    )
    .select('id')
    .single();

  if (customerError || !customer) {
    console.error('[payment/create] Customer error:', customerError);
    return NextResponse.json({ error: 'Ошибка создания покупателя' }, { status: 500 });
  }

  const authenticatedUser = await getUserFromRequest(req);
  if (
    authenticatedUser?.email &&
    authenticatedUser.emailVerified &&
    normalizeEmail(authenticatedUser.email) === email
  ) {
    await query(
      `UPDATE customers SET user_id = $1
       WHERE id = $2 AND (user_id IS NULL OR user_id = $1)`,
      [authenticatedUser.id, customer.id],
    );
  }

  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .insert({
      customer_id: customer.id,
      tab_ids: JSON.stringify(ids),
      amount: totalAmount,
      status: 'pending',
    })
    .select('id')
    .single();

  if (purchaseError || !purchase) {
    console.error('[payment/create] Purchase error:', purchaseError);
    return NextResponse.json({ error: 'Ошибка создания заказа' }, { status: 500 });
  }

  let config;
  try {
    config = getRobokassaConfig();
  } catch (error) {
    console.error('[payment/create]', error);
    return NextResponse.json(
      { error: 'Robokassa не настроена. Проверьте переменные окружения ROBOKASSA_*' },
      { status: 500 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? LOCAL_DEV_URL).replace(/\/$/, '');
  const invId = `${Date.now()}${randomInt(100, 1000)}`;
  const outSum = totalAmount.toFixed(2);
  const successUrl = `${appUrl}/${locale}/payment/success?purchase_id=${purchase.id}`;
  const failUrl = `${appUrl}/${locale}/payment/canceled`;
  const encodedSuccessUrl = encodeURIComponent(successUrl);
  const encodedFailUrl = encodeURIComponent(failUrl);
  const receipt = encodeReceipt({
    items: distributeTotal(tabsData, totalAmount).map(({ tab, sum }) => ({
      name: tab.title_ru.slice(0, 128),
      quantity: 1,
      sum,
      payment_method: 'full_payment',
      payment_object: process.env.ROBOKASSA_PAYMENT_OBJECT ?? 'service',
      tax: 'none',
    })),
  });
  const shpPurchase = `Shp_purchase_id=${purchase.id}`;
  const signatureSource = config.isTest
    ? [config.merchantLogin, outSum, invId, config.password1].join(':')
    : [
        config.merchantLogin,
        outSum,
        invId,
        receipt,
        encodedSuccessUrl,
        'GET',
        encodedFailUrl,
        'GET',
        config.password1,
        shpPurchase,
      ].join(':');

  const { error: paymentIdError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ payment_id: invId })
    .eq('id', purchase.id);

  if (paymentIdError) {
    console.error('[payment/create] Failed to save Robokassa InvId:', paymentIdError);
    return NextResponse.json({ error: 'Ошибка сохранения платежа' }, { status: 500 });
  }

  const paymentFields: Record<string, string> = {
    MerchantLogin: config.merchantLogin,
    OutSum: outSum,
    InvId: invId,
    Description:
      tabsData.length === 1
        ? `Гитарный таб: ${tabsData[0].title_ru}`.slice(0, 100)
        : `Гитарные табы (${tabsData.length} шт.)`,
    SignatureValue: createRobokassaHash(signatureSource),
    Email: email,
    Culture: locale,
    IsTest: config.isTest ? '1' : '0',
  };

  if (!config.isTest) {
    Object.assign(paymentFields, {
      Receipt: receipt,
      SuccessUrl2: successUrl,
      SuccessUrl2Method: 'GET',
      FailUrl2: failUrl,
      FailUrl2Method: 'GET',
      Shp_purchase_id: purchase.id,
    });
  }

  return NextResponse.json({
    confirmation_url: 'https://auth.robokassa.ru/Merchant/Index.aspx',
    payment_method: 'POST',
    payment_fields: paymentFields,
  });
}
