import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_CUSTOMERS, TABLE_PURCHASES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { tab_id, tab_ids, firstname, email: rawEmail, newsletter, test } = await req.json();
  const email = rawEmail?.trim().toLowerCase();

  // Support both single tab_id and array tab_ids
  const ids: string[] = tab_ids ?? (tab_id ? [tab_id] : []);

  if (!ids.length || !firstname || !email) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
  }

  // 1. Get tabs
  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, price, files, title_ru')
    .in('id', ids);

  if (tabsError || !tabs || tabs.length !== ids.length) {
    return NextResponse.json({ error: 'Один или несколько табов не найдены' }, { status: 404 });
  }

  const tabsData = tabs as Array<{
    id: string;
    files: Record<string, boolean>;
    price: number;
    title_ru: string;
  }>;

  // Validate files exist in tab_files table
  for (const tab of tabsData) {
    const listUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/files/${tab.id}/list`;
    const result = await fetch(listUrl);
    const fileNames = (await result.json()) as { format: string; filename: string }[];

    for (const [format, exists] of Object.entries(tab.files)) {
      if (!exists) continue;
      const fileExists = fileNames.some((f) => f.format === format);
      if (!fileExists) {
        console.error(`[payment/create] File missing for format ${format} in tab ${tab.id}`);
        return NextResponse.json(
          { error: 'Файлы таба временно недоступны. Попробуйте позже или свяжитесь со мной.' },
          { status: 500 },
        );
      }
    }
  }

  const subtotal = tabsData.reduce((sum, t) => sum + t.price, 0);
  const discountRate = ids.length >= 3 ? 0.15 : ids.length >= 2 ? 0.1 : 0;
  const totalAmount = subtotal - Math.round(subtotal * discountRate);

  // 2. Upsert customer
  const { data: customer, error: customerError } = await supabaseAdmin
    .from(TABLE_CUSTOMERS)
    .upsert({ firstname, email, newsletter: newsletter ?? false }, { onConflict: 'email' })
    .select('id')
    .single();

  if (customerError || !customer) {
    console.error('[payment/create] Customer error:', customerError);
    return NextResponse.json({ error: 'Ошибка создания покупателя' }, { status: 500 });
  }

  // 3. Create pending purchase
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

  // 4. Create YooKassa payment
  const shopId = test ? process.env.YUKASSA_TEST_SHOP_ID : process.env.YUKASSA_SHOP_ID;
  const secretKey = test ? process.env.YUKASSA_TEST_SECRET_KEY : process.env.YUKASSA_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  if (!shopId || !secretKey) {
    return NextResponse.json({
      confirmation_url: `${appUrl}/payment-stub?purchase_id=${purchase.id}`,
    });
  }

  const idempotenceKey = purchase.id;
  const description =
    tabsData.length === 1
      ? `Гитарный таб #${tabsData[0].id} (${tabsData[0].title_ru})`
      : `Гитарные табы (${tabsData.length} шт.): ${tabsData.map((t) => t.title_ru).join(', ')}`;

  const yukassaRes = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: {
        value: totalAmount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${appUrl}/ru/payment/success?purchase_id=${purchase.id}`,
      },
      cancellation_details: {
        cancel_url: `${appUrl}/ru/payment/canceled`,
      },
      description,
      metadata: {
        purchase_id: purchase.id,
        customer_email: email,
      },
      capture: true,
    }),
  });

  const payment = await yukassaRes.json();

  if (!yukassaRes.ok) {
    return NextResponse.json({ error: 'Ошибка платёжной системы' }, { status: 500 });
  }

  // 5. Save payment_id to purchase
  const { error: paymentIdError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ payment_id: payment.id })
    .eq('id', purchase.id);

  if (paymentIdError) {
    console.error('[payment/create] Failed to save payment_id:', paymentIdError);
  }

  return NextResponse.json({
    confirmation_url: payment.confirmation.confirmation_url,
  });
}
