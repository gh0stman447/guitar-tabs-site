import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { tab_id, firstname, email } = await req.json();

  if (!tab_id || !firstname || !email) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
  }

  // 1. Get tab price and files
  const { data: tab, error: tabError } = await supabaseAdmin
    .from('guitar-tabs')
    .select('id, price, files')
    .eq('id', tab_id)
    .single();

  if (tabError || !tab) {
    return NextResponse.json({ error: 'Таб не найден' }, { status: 404 });
  }

  // Validate files exist in storage
  const files = tab.files as Record<string, string>;
  for (const [format, path] of Object.entries(files)) {
    const { error: downloadError } = await supabaseAdmin.storage
      .from('tab-files')
      .download(path);
    if (downloadError) {
      console.error(`File missing for format ${format}: ${path}`);
      return NextResponse.json({ error: 'Файлы таба временно недоступны. Попробуйте позже или свяжитесь с нами.' }, { status: 500 });
    }
  }

  // 2. Upsert customer
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .upsert({ firstname, email }, { onConflict: 'email' })
    .select('id')
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: 'Ошибка создания покупателя' }, { status: 500 });
  }

  // 3. Create pending purchase
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from('purchases')
    .insert({
      customer_id: customer.id,
      tab_id: tab.id,
      amount: tab.price,
      status: 'pending',
    })
    .select('id')
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Ошибка создания заказа' }, { status: 500 });
  }

  // 4. Create YooKassa payment
  const shopId = process.env.YUKASSA_SHOP_ID;
  const secretKey = process.env.YUKASSA_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!shopId || !secretKey) {
    // Dev mode: return fake URL
    return NextResponse.json({
      confirmation_url: `${appUrl}/payment-stub?purchase_id=${purchase.id}`,
    });
  }

  const idempotenceKey = purchase.id;

  const yukassaRes = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: {
        value: tab.price.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${appUrl}/ru/payment/success?purchase_id=${purchase.id}`,
      },
      description: `Гитарный таб #${tab.id}`,
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
  await supabaseAdmin.from('purchases').update({ payment_id: payment.id }).eq('id', purchase.id);

  return NextResponse.json({
    confirmation_url: payment.confirmation.confirmation_url,
  });
}
