import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_PURCHASES, TABLE_TAB_FILES } from '@/lib/constants';
import { query } from '@/lib/db';

interface YookassaPayment {
  id?: string;
  status?: string;
  metadata?: {
    purchase_id?: string;
    customer_email?: string;
  };
}

/**
 * Запрос чека на российский сервер (Мой Налог)
 */
async function createReceipt(amount: number, customerName: string): Promise<string | null> {
  const proxyUrl = process.env.NALOG_PROXY_URL;
  const proxyKey = process.env.NALOG_PROXY_KEY;
  const testMode = process.env.NALOG_PROXY_TEST_MODE === 'true';

  if (testMode) {
    console.log('🧪 Test mode: skipping receipt creation');
    return null;
  }

  if (!proxyUrl || !proxyKey) {
    console.warn('⚠️ NALOG_PROXY_URL or NALOG_PROXY_KEY not configured, skipping receipt');
    return null;
  }

  try {
    const res = await fetch(`${proxyUrl}/create_receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': proxyKey,
      },
      body: JSON.stringify({
        amount: amount,
        name: customerName || 'Покупатель',
      }),
    });

    if (!res.ok) {
      console.error(`❌ Receipt API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (data.status === 'success' && data.url) {
      console.log('✅ Receipt created:', data.url);
      return data.url;
    } else {
      console.error('❌ Receipt error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Receipt request failed:', error);
    return null;
  }
}

async function verifyWithYookassa(paymentId: string, test: boolean): Promise<boolean> {
  const shopId = test ? process.env.YUKASSA_TEST_SHOP_ID : process.env.YUKASSA_SHOP_ID;
  const secretKey = test ? process.env.YUKASSA_TEST_SECRET_KEY : process.env.YUKASSA_SECRET_KEY;

  // Для тестовых платежей или если ключи не настроены - пропускаем верификацию
  if (test || !shopId || !secretKey) {
    console.log('⚠️ [webhook] Skipping verification (test mode or no credentials)');
    return true;
  }

  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    },
  });

  if (!res.ok) {
    console.error('❌ [webhook] YooKassa API error:', res.status, await res.text());
    return false;
  }
  const data = await res.json();
  console.log('✅ [webhook] YooKassa verification:', data.status);
  return data.status === 'succeeded';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  console.log('🔔 [webhook] Received webhook request');
  console.log('🔔 [webhook] Raw body:', rawBody);
  console.log('🔔 [webhook] Headers:', JSON.stringify(Object.fromEntries(req.headers)));

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error('❌ [webhook] Failed to parse body:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event as string;
  const payment = body.object as YookassaPayment;

  console.log('🔔 [webhook] Event:', event);
  console.log('🔔 [webhook] Payment:', JSON.stringify(payment));

  if (event === 'payment.succeeded') {
    if (!payment?.id) {
      console.error('❌ [webhook] Missing payment id');
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }
    const isTest = !!body.object?.test;
    console.log('🔔 [webhook] Test mode:', isTest);
    const verified = await verifyWithYookassa(payment.id, isTest);
    if (!verified) {
      console.error('❌ [webhook] Payment verification failed');
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 403 });
    }
    console.log('✅ [webhook] Payment verified');
  }

  switch (event) {
    case 'payment.succeeded':
      return handlePaymentSucceeded(payment);
    case 'payment.canceled':
      return handlePaymentCanceled(payment);
    default:
      console.log('⚠️ [webhook] Unknown event:', event);
      return NextResponse.json({ ok: true });
  }
}

async function handlePaymentCanceled(payment: YookassaPayment) {
  const purchaseId = payment?.metadata?.purchase_id;
  console.log(
    '💰 [webhook] payment.canceled purchaseId:',
    purchaseId,
    'metadata:',
    JSON.stringify(payment?.metadata),
  );
  if (!purchaseId) return NextResponse.json({ ok: true });

  const { data: updateResult, error: updateError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ status: 'canceled' })
    .eq('id', purchaseId);

  if (updateError) {
    console.error('💰 [webhook] payment.canceled UPDATE ERROR:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log('💰 [webhook] payment.canceled UPDATE SUCCESS:', updateResult);
  return NextResponse.json({ ok: true });
}

async function handlePaymentSucceeded(payment: YookassaPayment) {
  const purchaseId = payment?.metadata?.purchase_id;
  const customerEmail = payment?.metadata?.customer_email;

  console.log(
    '💰 [webhook] handlePaymentSucceeded START - purchaseId:',
    purchaseId,
    'email:',
    customerEmail,
  );

  if (!purchaseId || !customerEmail) {
    console.error(
      '❌ [webhook] Missing metadata - purchaseId:',
      purchaseId,
      'email:',
      customerEmail,
    );
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  // 1. Update purchase status
  console.log('💰 [webhook] Step 1: Updating purchase status...');
  console.log('💰 [webhook] Step 1: TABLE_PURCHASES =', TABLE_PURCHASES);
  console.log('💰 [webhook] Step 1: purchaseId =', purchaseId);

  try {
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from(TABLE_PURCHASES)
      .update({ status: 'succeeded' })
      .eq('id', purchaseId);

    console.log('💰 [webhook] Step 1 result:', {
      updateData,
      updateError: updateError ? JSON.stringify(updateError) : 'OK',
    });

    if (updateError) {
      return NextResponse.json(
        { error: 'DB update failed: ' + JSON.stringify(updateError) },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error('💰 [webhook] Step 1 EXCEPTION:', e);
    return NextResponse.json({ error: 'DB update exception: ' + String(e) }, { status: 500 });
  }

  // 2. Get purchase with tab_ids
  console.log('💰 [webhook] Step 2: Fetching purchase...');
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('tab_id, tab_ids, amount, customer_id')
    .eq('id', purchaseId)
    .single();

  console.log(
    '💰 [webhook] Step 2 result:',
    purchaseError ? 'ERROR: ' + JSON.stringify(purchaseError) : 'OK, purchase:',
    purchase?.id,
  );

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  const tabIds: string[] =
    (purchase.tab_ids as string[] | null) ?? (purchase.tab_id ? [purchase.tab_id as string] : []);

  console.log('💰 [webhook] Step 3: Fetching tabs, tabIds:', tabIds);
  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, title_ru, title_en, files, purchase_count')
    .in('id', tabIds);

  console.log(
    '💰 [webhook] Step 3 result:',
    tabsError ? 'ERROR: ' + JSON.stringify(tabsError) : 'OK, tabs count:',
    tabs?.length,
  );

  if (tabsError || !tabs) {
    return NextResponse.json({ error: 'Tabs not found' }, { status: 404 });
  }

  // 4. Increment purchase_count using direct SQL
  console.log('💰 [webhook] Step 4: Incrementing purchase_count...');
  for (const tab of tabs) {
    const tabId = (tab as { id: string }).id;
    console.log(`💰 [webhook] Step 4: Incrementing for tab ${tabId}`);
    await query(
      `UPDATE "${TABLE_TABS}" SET "purchase_count" = "purchase_count" + 1 WHERE "id" = $1`,
      [tabId],
    );
  }
  console.log('💰 [webhook] Step 4: Done');

  // 5. Generate receipt via RU proxy (перед отправкой email)
  console.log('💰 [webhook] Step 5: Creating receipt for amount:', purchase.amount);
  const tabsWithTitles = tabs as Array<{
    id: string;
    title_ru: string;
    files: Record<string, string>;
  }>;
  const serviceName =
    tabsWithTitles.length === 1
      ? tabsWithTitles[0].title_ru
      : `Гитарные табы (${tabsWithTitles.length} шт.)`;
  const receiptUrl = await createReceipt(purchase.amount, serviceName);
  console.log('💰 [webhook] Step 5 result: Receipt URL:', receiptUrl);

  // 6. Build zip archive
  console.log('💰 [webhook] Step 6: Building ZIP archive for', tabsWithTitles.length, 'tabs');
  console.log(
    '💰 [webhook] Step 6: Tab IDs:',
    tabsWithTitles.map((t) => t.id),
  );
  let attachments: { filename: string; content: string }[] = [];
  try {
    console.log('💰 [webhook] Step 6: Calling buildZipAttachments...');
    attachments = await buildZipAttachments(tabsWithTitles);
    console.log(
      '💰 [webhook] Step 6 result: ZIP attachments:',
      attachments.map((a) => a.filename),
    );
  } catch (zipError) {
    console.error('💰 [webhook] Step 6 ERROR:', zipError);
    console.error(
      '💰 [webhook] Step 6 ERROR stack:',
      zipError instanceof Error ? zipError.stack : 'no stack',
    );
    // Continue without ZIP if it fails
  }

  // 7. Send email с чеком
  console.log('💰 [webhook] Step 7: Sending email to:', customerEmail);
  console.log('💰 [webhook] Step 7: attachments length:', attachments.length);
  const tabTitles = tabsWithTitles.map((t) => t.title_ru).join(', ');
  const emailId = await sendEmail({ to: customerEmail, tabTitles, attachments, receiptUrl });
  console.log(
    '💰 [webhook] Step 7 result: Email',
    emailId ? 'sent with ID: ' + emailId : 'not sent (no EMAIL_SERVICE or error)',
  );

  // 8. Save email tracking info и ссылку на чек
  const updateData: { resend_email_id?: string; email_status?: string; receipt_url?: string } = {};
  if (emailId) {
    updateData.resend_email_id = emailId;
    updateData.email_status = 'sent';
  }
  if (receiptUrl) {
    updateData.receipt_url = receiptUrl;
  }

  if (Object.keys(updateData).length > 0) {
    console.log('💰 [webhook] Step 8: Saving email tracking and receipt URL:', updateData);
    const { data: saveResult, error: saveError } = await supabaseAdmin
      .from(TABLE_PURCHASES)
      .update(updateData)
      .eq('id', purchaseId);

    if (saveError) {
      console.error('💰 [webhook] Step 8 SAVE ERROR:', saveError);
    } else {
      console.log('💰 [webhook] Step 8 SAVE SUCCESS:', saveResult);
    }
  }

  return NextResponse.json({ ok: true });
}

async function buildZipAttachments(
  tabs: { id: string; title_ru: string; files: unknown }[],
): Promise<{ filename: string; content: string }[]> {
  console.log('[buildZipAttachments] Starting with', tabs.length, 'tabs');
  const zip = new JSZip();
  const multiTab = tabs.length > 1;

  for (const tab of tabs) {
    console.log('[buildZipAttachments] Processing tab:', tab.id, tab.title_ru);
    const files = tab.files as Record<string, boolean>;
    console.log('[buildZipAttachments] Files to process:', files);
    const folder = multiTab ? zip.folder(tab.title_ru.replace(/[/\\?%*:|"<>]/g, '_'))! : zip;

    // Get file data directly from database
    const fileNamesResult = await supabaseAdmin
      .from(TABLE_TAB_FILES)
      .select('format, filename, content_type, data')
      .eq('tab_id', tab.id);

    console.log('[buildZipAttachments] File records from DB:', fileNamesResult.data?.length || 0);

    const fileRecords = fileNamesResult.data as Array<{
      format: string;
      filename: string;
      content_type: string;
      data: string | Buffer;
    }>;

    for (const [format, exists] of Object.entries(files)) {
      if (!exists) continue;

      const fileRecord = fileRecords?.find((f) => f.format === format);
      if (!fileRecord) {
        console.error(`File not found for format ${format} in tab ${tab.id}`);
        continue;
      }

      console.log(
        '[buildZipAttachments] Found file:',
        format,
        fileRecord.filename,
        'data type:',
        typeof fileRecord.data,
      );

      // Convert hex/escape format from PostgreSQL to Buffer
      let fileData: Buffer;
      if (typeof fileRecord.data === 'string') {
        // PostgreSQL returns bytea as \\x followed by hex
        const hexString = fileRecord.data.replace(/^\\\\x/, '');
        fileData = Buffer.from(hexString, 'hex');
        console.log('[buildZipAttachments] Converted from hex, size:', fileData.length);
      } else if (Buffer.isBuffer(fileRecord.data)) {
        fileData = fileRecord.data;
        console.log('[buildZipAttachments] Already buffer, size:', fileData.length);
      } else {
        console.error('[buildZipAttachments] Unknown data type:', typeof fileRecord.data);
        continue;
      }

      // Find filename from fileRecords
      const filename = fileRecord.filename ?? `tab.${format}`;
      folder.file(filename, fileData);
      console.log('[buildZipAttachments] Added to zip:', filename);
    }
  }

  console.log('[buildZipAttachments] Generating ZIP...');
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  console.log('[buildZipAttachments] ZIP size:', zipBuffer.length);
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
    console.log(
      '📧 Would send email to:',
      to,
      'Receipt:',
      receiptUrl,
      'Attachments:',
      attachments.map((a) => a.filename),
    );
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
