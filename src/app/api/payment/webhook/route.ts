import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  // YooKassa sends event object
  const event = body.event as string;
  const payment = body.object;

  if (event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true });
  }

  const purchaseId = payment?.metadata?.purchase_id as string | undefined;
  const customerEmail = payment?.metadata?.customer_email as string | undefined;

  if (!purchaseId || !customerEmail) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  // 1. Update purchase status
  const { error: updateError } = await supabaseAdmin
    .from('purchases')
    .update({ status: 'succeeded' })
    .eq('id', purchaseId);

  if (updateError) {
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  // 2. Get purchase with tab files
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from('purchases')
    .select('tab_id, customers(firstname)')
    .eq('id', purchaseId)
    .single();

  if (!purchaseError && purchase) {
    const { data: currentTab } = await supabaseAdmin
      .from('guitar-tabs')
      .select('purchase_count')
      .eq('id', purchase.tab_id)
      .single();
    if (currentTab) {
      await supabaseAdmin
        .from('guitar-tabs')
        .update({ purchase_count: (currentTab.purchase_count ?? 0) + 1 })
        .eq('id', purchase.tab_id);
    }
  }

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  const { data: tab, error: tabError } = await supabaseAdmin
    .from('guitar-tabs')
    .select('title_ru, files')
    .eq('id', purchase.tab_id)
    .single();

  if (tabError || !tab) {
    return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
  }

  // 3. Generate signed URLs for each file
  const files = tab.files as Record<string, string>;
  const signedUrls: Record<string, string> = {};

  console.log('Files from DB:', JSON.stringify(files));

  for (const [format, path] of Object.entries(files)) {
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from('tab-files')
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

    console.log(`Signed URL for ${format} (${path}):`, signed?.signedUrl ?? signError);

    if (signed?.signedUrl) {
      signedUrls[format] = signed.signedUrl;
    }
  }

  console.log('signedUrls result:', JSON.stringify(signedUrls));

  // 4. Send email
  await sendEmail({
    to: customerEmail,
    tabTitle: tab.title_ru,
    signedUrls,
  });

  return NextResponse.json({ ok: true });
}

async function sendEmail({
  to,
  tabTitle,
  signedUrls,
}: {
  to: string;
  tabTitle: string;
  signedUrls: Record<string, string>;
}) {
  const emailService = process.env.EMAIL_SERVICE; // 'resend' | 'smtp'

  if (!emailService) {
    // Dev mode: just log
    console.log('📧 Would send email to:', to, 'Files:', signedUrls);
    return;
  }

  if (emailService === 'resend') {
    const linksHtml = Object.entries(signedUrls)
      .map(([fmt, url]) => `<a href="${url}" style="color:#f59e0b">${fmt.toUpperCase()}</a>`)
      .join(' &nbsp;|&nbsp; ');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to,
        subject: `Ваш таб: ${tabTitle}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#f59e0b">Спасибо за покупку!</h2>
            <p>Ваш таб <strong>${tabTitle}</strong> готов к скачиванию:</p>
            <p style="margin:24px 0">${linksHtml}</p>
            <p style="color:#888;font-size:13px">Ссылки действительны 7 дней.<br>
            Есть вопросы? Пишите в Telegram: <a href="https://t.me/MalyginOleg">@MalyginOleg</a></p>
          </div>
        `,
      }),
    });
  }
}
