import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

  // 2. Get purchase with tab_ids (and fallback to tab_id for old purchases)
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from('purchases')
    .select('tab_id, tab_ids, customers(firstname)')
    .eq('id', purchaseId)
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  // Resolve list of tab ids
  const tabIds: string[] =
    (purchase.tab_ids as string[] | null) ?? (purchase.tab_id ? [purchase.tab_id as string] : []);

  // 3. Get all tabs
  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from('guitar-tabs')
    .select('id, title_ru, title_en, files, purchase_count')
    .in('id', tabIds);

  if (tabsError || !tabs) {
    return NextResponse.json({ error: 'Tabs not found' }, { status: 404 });
  }

  // 4. Increment purchase_count for each tab
  for (const tab of tabs) {
    await supabaseAdmin
      .from('guitar-tabs')
      .update({ purchase_count: (tab.purchase_count ?? 0) + 1 })
      .eq('id', tab.id);
  }

  // 5. Build zip archive(s)
  // 1 tab → one zip with files at root
  // 2+ tabs → one zip with a subfolder per tab
  const zip = new JSZip();
  const multiTab = tabs.length > 1;

  for (const tab of tabs) {
    const files = tab.files as Record<string, string>;
    const folder = multiTab ? zip.folder(tab.title_ru.replace(/[/\\?%*:|"<>]/g, '_'))! : zip;

    for (const [format, path] of Object.entries(files)) {
      const { data, error } = await supabaseAdmin.storage.from('tab-files').download(path);

      if (error || !data) {
        console.error(`Failed to download ${format} (${path}):`, error);
        continue;
      }

      const buffer = await data.arrayBuffer();
      const filename = path.split('/').pop() ?? `tab.${format}`;
      folder.file(filename, buffer);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const zipBase64 = zipBuffer.toString('base64');
  const zipFilename =
    tabs.length === 1
      ? `${tabs[0].title_ru.replace(/[/\\?%*:|"<>]/g, '_')}.zip`
      : 'guitar-tabs.zip';

  const attachments = [{ filename: zipFilename, content: zipBase64 }];

  // 6. Send email with zip attachment
  const tabTitles = tabs.map((t) => t.title_ru).join(', ');

  await sendEmail({
    to: customerEmail,
    tabTitles,
    attachments,
  });

  return NextResponse.json({ ok: true });
}

async function sendEmail({
  to,
  tabTitles,
  attachments,
}: {
  to: string;
  tabTitles: string;
  attachments: { filename: string; content: string }[];
}) {
  const emailService = process.env.EMAIL_SERVICE;

  if (!emailService) {
    console.log(
      '📧 Would send email to:',
      to,
      'Attachments:',
      attachments.map((a) => a.filename),
    );
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
        from: 'noreply@olegguitar.com',
        to,
        subject: `Ваши табы: ${tabTitles}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#f59e0b">Спасибо за покупку!</h2>
            <p>Ваши табы готовы к скачиванию:</p>
            <p><strong>${tabTitles}</strong></p>
            <p>Все файлы прикреплены к этому письму.</p>
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
