import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.json();

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

  // 2. Get purchase
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
    .select('title_ru, title_en, files')
    .eq('id', purchase.tab_id)
    .single();

  if (tabError || !tab) {
    return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
  }

  // 3. Download files from Storage and prepare attachments
  const files = tab.files as Record<string, string>;
  const attachments: { filename: string; content: string }[] = [];

  for (const [format, path] of Object.entries(files)) {
    const { data, error } = await supabaseAdmin.storage
      .from('tab-files')
      .download(path);

    if (error || !data) {
      console.error(`Failed to download ${format} (${path}):`, error);
      continue;
    }

    const buffer = await data.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const filename = path.split('/').pop() ?? `tab.${format}`;

    attachments.push({ filename, content: base64 });
  }

  // 4. Send email with attachments
  await sendEmail({
    to: customerEmail,
    tabTitle: tab.title_ru,
    attachments,
  });

  return NextResponse.json({ ok: true });
}

async function sendEmail({
  to,
  tabTitle,
  attachments,
}: {
  to: string;
  tabTitle: string;
  attachments: { filename: string; content: string }[];
}) {
  const emailService = process.env.EMAIL_SERVICE;

  if (!emailService) {
    console.log('📧 Would send email to:', to, 'Attachments:', attachments.map(a => a.filename));
    return;
  }

  if (emailService === 'resend') {
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
            <p>Ваш таб <strong>${tabTitle}</strong> готов к скачиванию.</p>
            <p>Файлы прикреплены к этому письму.</p>
            <p style="color:#888;font-size:13px">Есть вопросы? Пишите в Telegram: <a href="https://t.me/MalyginOleg">@MalyginOleg</a></p>
          </div>
        `,
        attachments: attachments.map(({ filename, content }) => ({
          filename,
          content,
        })),
      }),
    });
  }
}
