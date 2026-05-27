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
async function createReceipt(amount: number, customerName: string, purchaseId: string): Promise<string | null> {
  const proxyUrl = process.env.NALOG_PROXY_URL;
  const proxyKey = process.env.NALOG_PROXY_KEY;

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
        purchase_id: purchaseId,  // Уникальный идентификатор для чека
      }),
    });

    if (!res.ok) {
      console.error(`❌ Receipt API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (data.status === 'success' && data.url) {
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
  return data.status === 'succeeded';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error('[webhook] Failed to parse body:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event as string;
  const payment = body.object as YookassaPayment;

  if (event === 'payment.succeeded') {
    if (!payment?.id) {
      console.error('[webhook] Missing payment id');
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }
    const isTest = !!body.object?.test;
    const verified = await verifyWithYookassa(payment.id, isTest);
    if (!verified) {
      console.error('[webhook] Payment verification failed');
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 403 });
    }
  }

  switch (event) {
    case 'payment.succeeded':
      return handlePaymentSucceeded(payment);
    case 'payment.canceled':
      return handlePaymentCanceled(payment);
    default:
      return NextResponse.json({ ok: true });
  }
}

async function handlePaymentCanceled(payment: YookassaPayment) {
  const purchaseId = payment?.metadata?.purchase_id;
  if (!purchaseId) return NextResponse.json({ ok: true });

  const { error: updateError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ status: 'canceled' })
    .eq('id', purchaseId);

  if (updateError) {
    console.error('[webhook] payment.canceled UPDATE ERROR:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handlePaymentSucceeded(payment: YookassaPayment) {
  const purchaseId = payment?.metadata?.purchase_id;
  const customerEmail = payment?.metadata?.customer_email;

  if (!purchaseId || !customerEmail) {
    console.error('[webhook] Missing metadata:', { purchaseId, customerEmail });
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  // 0. Idempotency check - skip if already processed
  const { data: existingPurchase } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('status, resend_email_id')
    .eq('id', purchaseId)
    .single();

  if (existingPurchase?.status === 'succeeded' && existingPurchase.resend_email_id) {
    console.log('[webhook] Purchase already processed, skipping:', purchaseId);
    return NextResponse.json({ ok: true });
  }

  // 1. Update purchase status
  const { error: updateError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ status: 'succeeded' })
    .eq('id', purchaseId);

  if (updateError) {
    console.error('[webhook] DB update error:', updateError);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  // 2. Get purchase with tab_ids
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('tab_id, tab_ids, amount, customer_id')
    .eq('id', purchaseId)
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  const tabIds: string[] =
    (purchase.tab_ids as string[] | null) ?? (purchase.tab_id ? [purchase.tab_id as string] : []);

  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, title_ru, title_en, files, purchase_count')
    .in('id', tabIds);

  if (tabsError || !tabs) {
    return NextResponse.json({ error: 'Tabs not found' }, { status: 404 });
  }

  // 3. Increment purchase_count using direct SQL
  for (const tab of tabs) {
    const tabId = (tab as { id: string }).id;
    await query(
      `UPDATE "${TABLE_TABS}" SET "purchase_count" = "purchase_count" + 1 WHERE "id" = $1`,
      [tabId],
    );
  }

  // 4. Generate receipt via RU proxy
  const tabsWithTitles = tabs as Array<{
    id: string;
    title_ru: string;
    files: Record<string, string>;
  }>;
  const serviceName =
    tabsWithTitles.length === 1
      ? tabsWithTitles[0].title_ru
      : `Гитарные табы (${tabsWithTitles.length} шт.)`;
  const receiptUrl = await createReceipt(purchase.amount, serviceName, purchaseId);

  // 5. Build zip archive
  let attachments: { filename: string; content: string }[] = [];
  try {
    attachments = await buildZipAttachments(tabsWithTitles);
  } catch (zipError) {
    console.error('[webhook] ZIP build error:', zipError);
  }

  // 6. Idempotency check (race condition protection)
  const { data: latestPurchase } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('resend_email_id')
    .eq('id', purchaseId)
    .single();

  if (latestPurchase?.resend_email_id) {
    console.log('[webhook] Email already sent, skipping:', purchaseId);
    return NextResponse.json({ ok: true });
  }

  // 7. Send email
  const tabTitles = tabsWithTitles.map((t) => t.title_ru).join(', ');
  const emailId = await sendEmail({ to: customerEmail, tabTitles, attachments, receiptUrl });

  // 7. Save email tracking and receipt URL
  const updateData: { resend_email_id?: string; email_status?: string; receipt_url?: string } = {};
  if (emailId) {
    updateData.resend_email_id = emailId;
    updateData.email_status = 'sent';
  }
  if (receiptUrl) {
    updateData.receipt_url = receiptUrl;
  }

  if (Object.keys(updateData).length > 0) {
    const { error: saveError } = await supabaseAdmin
      .from(TABLE_PURCHASES)
      .update(updateData)
      .eq('id', purchaseId);

    if (saveError) {
      console.error('[webhook] Failed to save tracking:', saveError);
    }
  }

  return NextResponse.json({ ok: true });
}

async function buildZipAttachments(
  tabs: { id: string; title_ru: string; files: unknown }[],
): Promise<{ filename: string; content: string }[]> {
  const zip = new JSZip();
  const multiTab = tabs.length > 1;

  for (const tab of tabs) {
    const files = tab.files as Record<string, boolean>;
    const folder = multiTab ? zip.folder(tab.title_ru.replace(/[/\\?%*:|"<>]/g, '_'))! : zip;

    const fileNamesResult = await supabaseAdmin
      .from(TABLE_TAB_FILES)
      .select('format, filename, content_type, data')
      .eq('tab_id', tab.id);

    const fileRecords = fileNamesResult.data as Array<{
      format: string;
      filename: string;
      content_type: string;
      data: string | Buffer;
    }>;

    for (const [format, exists] of Object.entries(files)) {
      if (!exists) continue;

      const fileRecord = fileRecords?.find((f) => f.format === format);
      if (!fileRecord) continue;

      let fileData: Buffer;
      if (typeof fileRecord.data === 'string') {
        const hexString = fileRecord.data.replace(/^\\\\x/, '');
        fileData = Buffer.from(hexString, 'hex');
      } else if (Buffer.isBuffer(fileRecord.data)) {
        fileData = fileRecord.data;
      } else {
        continue;
      }

      const filename = fileRecord.filename ?? `tab.${format}`;
      folder.file(filename, fileData);
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
