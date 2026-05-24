import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_PURCHASES, TABLE_CUSTOMERS, TABLE_TAB_FILES } from '@/lib/constants';
import { query } from '@/lib/db';

/**
 * Симуляция успешной оплаты для локальной разработки
 * Обновляет статус заказа, отправляет email, инкрементирует purchase_count
 */
export async function POST(req: NextRequest) {
  const { purchase_id } = await req.json();

  if (!purchase_id) {
    return NextResponse.json({ error: 'Missing purchase_id' }, { status: 400 });
  }

  console.log('🧪 [simulate] Starting simulated payment for purchase:', purchase_id);

  // 1. Get purchase
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('tab_id, tab_ids, amount, customer_id')
    .eq('id', purchase_id)
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  // 2. Update purchase status to succeeded
  const { error: updateError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ status: 'succeeded' })
    .eq('id', purchase_id);

  if (updateError) {
    console.error('🧪 [simulate] Update status error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log('🧪 [simulate] Status updated to succeeded');

  // 3. Get tabs - properly handle JSONB tab_ids
  let tabIds: string[] = [];

  if (purchase.tab_ids) {
    // tab_ids is JSONB - parse it safely
    try {
      const parsed = JSON.parse(JSON.stringify(purchase.tab_ids));
      if (Array.isArray(parsed)) {
        tabIds = parsed.filter((id): id is string => typeof id === 'string');
      } else if (typeof parsed === 'string') {
        tabIds = [parsed];
      }
    } catch (e) {
      console.error('🧪 [simulate] Failed to parse tab_ids:', e);
    }
    console.log('🧪 [simulate] tab_ids from JSONB:', tabIds);
  }

  // Fallback to tab_id for single tab purchases
  if (tabIds.length === 0 && purchase.tab_id) {
    tabIds = [purchase.tab_id as string];
    console.log('🧪 [simulate] Using tab_id fallback:', tabIds);
  }

  if (tabIds.length === 0) {
    console.error('🧪 [simulate] No tab IDs found in purchase');
    return NextResponse.json({ error: 'No tabs in purchase' }, { status: 400 });
  }

  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, title_ru, title_en, files, price')
    .in('id', tabIds);

  if (tabsError) {
    console.error('🧪 [simulate] Tabs query error:', tabsError);
    return NextResponse.json({ error: 'Failed to fetch tabs' }, { status: 500 });
  }

  if (!tabs || tabs.length === 0) {
    console.error('🧪 [simulate] No tabs found for IDs:', tabIds);
    return NextResponse.json({ error: 'Tabs not found' }, { status: 404 });
  }

  console.log('🧪 [simulate] Found tabs:', tabs.length);

  // 4. Increment purchase_count using direct SQL to avoid column quoting issues
  for (const tab of tabs) {
    const tabId = (tab as { id: string }).id;
    console.log(`🧪 [simulate] Incrementing purchase_count for tab ${tabId}`);

    // Use direct SQL with proper column quoting
    await query(
      `UPDATE "${TABLE_TABS}" SET "purchase_count" = "purchase_count" + 1 WHERE "id" = $1`,
      [tabId],
    );
  }

  console.log('🧪 [simulate] Purchase count incremented');

  // 5. Get customer email
  console.log('🧪 [simulate] Looking up customer:', purchase.customer_id);

  const { data: customer, error: customerError } = await supabaseAdmin
    .from(TABLE_CUSTOMERS)
    .select('email')
    .eq('id', purchase.customer_id)
    .single();

  if (customerError) {
    console.error('🧪 [simulate] Customer lookup error:', customerError);
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  if (!customer?.email) {
    console.error('🧪 [simulate] Customer has no email:', customer);
    return NextResponse.json({ error: 'Customer email not found' }, { status: 404 });
  }

  console.log('🧪 [simulate] Customer email:', customer.email);

  // 6. Build ZIP
  const attachments = await buildZipAttachments(
    tabs as Array<{ id: string; title_ru: string; files: Record<string, boolean> }>,
  );

  // 7. Send email
  const tabTitles = (tabs as Array<{ title_ru: string }>).map((t) => t.title_ru).join(', ');
  console.log('📧 [simulate] Sending email to:', customer.email, 'with tabs:', tabTitles);

  let emailId: string | null = null;
  try {
    emailId = await sendEmail({
      to: customer.email,
      tabTitles,
      attachments,
      receiptUrl: null,
    });
    console.log('📧 [simulate] Email result:', emailId ?? 'no email service configured');
  } catch (emailError) {
    console.error('📧 [simulate] Email error:', emailError);
  }

  // 8. Save email tracking
  if (emailId) {
    const { error: emailUpdateError } = await supabaseAdmin
      .from(TABLE_PURCHASES)
      .update({ resend_email_id: emailId, email_status: 'sent' })
      .eq('id', purchase_id);

    if (emailUpdateError) {
      console.error('🧪 [simulate] Error saving email tracking:', emailUpdateError);
    } else {
      console.log('🧪 [simulate] Email tracking saved');
    }
  }

  console.log('🧪 [simulate] Done!');

  return NextResponse.json({ ok: true, emailId });
}

async function buildZipAttachments(
  tabs: { id: string; title_ru: string; files: Record<string, boolean> }[],
): Promise<{ filename: string; content: string }[]> {
  const zip = new JSZip();
  const multiTab = tabs.length > 1;

  for (const tab of tabs) {
    const folder = multiTab
      ? zip.folder(tab.title_ru.replace(/[/\\?%*:|"<>]/g, '_'))!
      : zip;

    const fileNamesResult = await supabaseAdmin
      .from(TABLE_TAB_FILES)
      .select('format, filename, data')
      .eq('tab_id', tab.id);

    const fileRecords = fileNamesResult.data as Array<{
      format: string;
      filename: string;
      data: string | Buffer;
    }>;

    for (const [format, exists] of Object.entries(tab.files)) {
      if (!exists) continue;

      const fileRecord = fileRecords?.find((f) => f.format === format);
      if (!fileRecord) continue;

      let fileData: Buffer;
      if (typeof fileRecord.data === 'string') {
        const hexString = fileRecord.data.replace(/^\\x/, '');
        fileData = Buffer.from(hexString, 'hex');
      } else if (Buffer.isBuffer(fileRecord.data)) {
        fileData = fileRecord.data;
      } else {
        continue;
      }

      folder.file(fileRecord.filename ?? `tab.${format}`, fileData);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const zipFilename =
    tabs.length === 1
      ? `${tabs[0].title_ru.replace(/[/\\?%*:|"<>]/g, '_')}.zip`
      : 'guitar-tabs.zip';

  return [{ filename: zipFilename, content: zipBuffer.toString('base64') }];
}

async function sendEmail({
  to,
  tabTitles,
  attachments,
  receiptUrl,
}: {
  to: string;
  tabTitles: string;
  attachments: { filename: string; content: string }[];
  receiptUrl?: string | null;
}): Promise<string | null> {
  const emailService = process.env.EMAIL_SERVICE;

  if (!emailService) {
    console.log('📧 [simulate] Would send email to:', to);
    return null;
  }

  if (emailService === 'resend') {
    const receiptHtml = receiptUrl
      ? `<p style="margin-top:20px;padding-top:20px;border-top:1px solid #eee">
           <a href="${receiptUrl}" style="color:#f59e0b;text-decoration:none">
             🧾 Чек на оплату
           </a>
         </p>`
      : '';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'OlegGuitar <noreply@olegguitar.com>',
        to,
        subject: `Ваши табы: ${tabTitles}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0;text-align:left">
            <h2 style="color:#f59e0b">Спасибо за покупку!</h2>
            <p>Ваши табы готовы к скачиванию:</p>
            <p><strong>${tabTitles}</strong></p>
            <p>Все файлы прикреплены к этому письму.</p>
            ${receiptHtml}
            <p style="color:#888;font-size:13px;margin-top:20px">
              Есть вопросы? Пишите в Telegram: <a href="https://t.me/MalyginOleg">@MalyginOleg</a>
            </p>
          </div>
        `,
        attachments: attachments.map(({ filename, content }) => ({ filename, content })),
      }),
    });

    const data = await res.json();
    return data?.id ?? null;
  }

  return null;
}
