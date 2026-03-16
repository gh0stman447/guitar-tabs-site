import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_CUSTOMERS, TABLE_PURCHASES, BUCKET_TAB_FILES } from '@/lib/constants';

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

  // Validate files exist in storage
  for (const tab of tabs) {
    const files = tab.files as Record<string, string>;
    for (const [format, path] of Object.entries(files)) {
      const { error: downloadError } = await supabaseAdmin.storage
        .from(BUCKET_TAB_FILES)
        .download(path);
      if (downloadError) {
        console.error(`File missing for format ${format}: ${path}`);
        return NextResponse.json(
          { error: 'Файлы таба временно недоступны. Попробуйте позже или свяжитесь со мной.' },
          { status: 500 },
        );
      }
    }
  }

  const subtotal = tabs.reduce((sum, t) => sum + t.price, 0);
  const discountRate = ids.length >= 3 ? 0.15 : ids.length >= 2 ? 0.1 : 0;
  const totalAmount = subtotal - Math.round(subtotal * discountRate);

  // 2. Upsert customer
  const { data: customer, error: customerError } = await supabaseAdmin
    .from(TABLE_CUSTOMERS)
    .upsert({ firstname, email, newsletter: newsletter ?? false }, { onConflict: 'email' })
    .select('id')
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Ошибка создания покупателя' }, { status: 500 });
  }

  // 3. Create pending purchase
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .insert({
      customer_id: customer.id,
      tab_ids: ids,
      amount: totalAmount,
      status: 'pending',
    })
    .select('id')
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Ошибка создания заказа' }, { status: 500 });
  }

  // 4. Create YooKassa payment
  const shopId = test ? process.env.YUKASSA_TEST_SHOP_ID : process.env.YUKASSA_SHOP_ID;
  const secretKey = test ? process.env.YUKASSA_TEST_SECRET_KEY : process.env.YUKASSA_SECRET_KEY;
  const appUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

  if (!shopId || !secretKey) {
    return NextResponse.json({
      confirmation_url: `${appUrl}/payment-stub?purchase_id=${purchase.id}`,
    });
  }

  const idempotenceKey = purchase.id;
  const description =
    tabs.length === 1
      ? `Гитарный таб #${tabs[0].id} (${(tabs[0] as { title_ru: string }).title_ru})`
      : `Гитарные табы (${tabs.length} шт.): ${(tabs as { title_ru: string }[]).map((t) => t.title_ru).join(', ')}`;

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
  await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ payment_id: payment.id })
    .eq('id', purchase.id);

  return NextResponse.json({
    confirmation_url: payment.confirmation.confirmation_url,
  });
}
