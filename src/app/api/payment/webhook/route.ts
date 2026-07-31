import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_PURCHASES, TABLE_TAB_FILES } from '@/lib/constants';
import { query } from '@/lib/db';
import { getRobokassaConfig, verifyRobokassaHash } from '@/lib/robokassa';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RobokassaNotification {
  outSum: string;
  invId: string;
  signature: string;
  purchaseId?: string;
}

function getField(params: URLSearchParams, ...names: string[]) {
  for (const name of names) {
    const value = params.get(name);
    if (value) return value;
  }
  return '';
}

function parseNotification(params: URLSearchParams): RobokassaNotification | null {
  const notification = {
    outSum: getField(params, 'OutSum', 'outSum'),
    invId: getField(params, 'InvId', 'InvID', 'invId'),
    signature: getField(params, 'SignatureValue', 'signatureValue'),
    purchaseId: getField(params, 'Shp_purchase_id'),
  };

  return notification.outSum && notification.invId && notification.signature ? notification : null;
}

async function processNotification(req: NextRequest) {
  let params: URLSearchParams;
  try {
    params =
      req.method === 'GET'
        ? req.nextUrl.searchParams
        : new URLSearchParams(await req.text());
  } catch (error) {
    console.error('[payment/webhook] Failed to parse notification:', error);
    return new NextResponse('bad request', { status: 400 });
  }

  const notification = parseNotification(params);
  if (!notification) {
    return new NextResponse('missing parameters', { status: 400 });
  }

  let password2: string;
  try {
    password2 = getRobokassaConfig().password2;
  } catch (error) {
    console.error('[payment/webhook]', error);
    return new NextResponse('configuration error', { status: 500 });
  }

  const signatureSource = notification.purchaseId
    ? `${notification.outSum}:${notification.invId}:${password2}:Shp_purchase_id=${notification.purchaseId}`
    : `${notification.outSum}:${notification.invId}:${password2}`;
  if (!verifyRobokassaHash(signatureSource, notification.signature)) {
    console.error('[payment/webhook] Invalid Robokassa signature');
    return new NextResponse('invalid signature', { status: 403 });
  }

  const purchaseResult = await query(
    `SELECT p.id, p.amount, p.payment_id, c.email
     FROM purchases p
     JOIN customers c ON c.id = p.customer_id
     WHERE p.payment_id = $1`,
    [notification.invId],
  );
  const purchase = purchaseResult.rows[0] as
    | { id: string; amount: number; payment_id: string | null; email: string }
    | undefined;

  if (
    !purchase ||
    (notification.purchaseId && purchase.id !== notification.purchaseId) ||
    purchase.payment_id !== notification.invId ||
    Number(notification.outSum) !== Number(purchase.amount)
  ) {
    console.error('[payment/webhook] Purchase data mismatch', {
      purchaseId: notification.purchaseId ?? purchase?.id,
      invId: notification.invId,
    });
    return new NextResponse('payment mismatch', { status: 400 });
  }

  const result = await handlePaymentSucceeded(purchase.id, purchase.email);
  if (!result.ok) return result;

  return new NextResponse(`OK${notification.invId}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  return processNotification(req);
}

export async function GET(req: NextRequest) {
  return processNotification(req);
}

async function handlePaymentSucceeded(purchaseId: string, customerEmail: string) {
  const { data: existingPurchase } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('status, resend_email_id')
    .eq('id', purchaseId)
    .single();

  if (existingPurchase?.status === 'succeeded' && existingPurchase.resend_email_id) {
    console.log('[webhook] Purchase already processed, skipping:', purchaseId);
    return NextResponse.json({ ok: true });
  }

  // Change the status atomically so repeated Robokassa callbacks do not increment counters twice.
  const statusResult = await query(
    `UPDATE purchases
     SET status = 'succeeded'
     WHERE id = $1 AND status <> 'succeeded'
     RETURNING id`,
    [purchaseId],
  );
  const isFirstSuccessfulCallback = statusResult.rowCount === 1;

  // 2. Get purchase with tab_ids
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('tab_id, tab_ids')
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

  if (isFirstSuccessfulCallback) {
    for (const tab of tabs) {
      const tabId = (tab as { id: string }).id;
      await query(
        `UPDATE "${TABLE_TABS}" SET "purchase_count" = "purchase_count" + 1 WHERE "id" = $1`,
        [tabId],
      );
    }
  }

  const tabsWithTitles = tabs as Array<{
    id: string;
    title_ru: string;
    files: Record<string, string>;
  }>;

  let attachments: { filename: string; content: string }[] = [];
  try {
    attachments = await buildZipAttachments(tabsWithTitles);
  } catch (zipError) {
    console.error('[webhook] ZIP build error:', zipError);
  }

  const { data: latestPurchase } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('resend_email_id')
    .eq('id', purchaseId)
    .single();

  if (latestPurchase?.resend_email_id) {
    console.log('[webhook] Email already sent, skipping:', purchaseId);
    return NextResponse.json({ ok: true });
  }

  const tabTitles = tabsWithTitles.map((t) => t.title_ru).join(', ');
  const emailId = await sendEmail({ to: customerEmail, tabTitles, attachments });

  const updateData: { resend_email_id?: string; email_status?: string } = {};
  if (emailId) {
    updateData.resend_email_id = emailId;
    updateData.email_status = 'sent';
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

    // Get file data from DB
    const fileNamesResult = await supabaseAdmin
      .from(TABLE_TAB_FILES)
      .select('format, filename, data')
      .eq('tab_id', tab.id);

    const fileRecords = fileNamesResult.data as Array<{
      format: string;
      filename: string;
      data: string | Buffer | null;
    }>;

    for (const [format, exists] of Object.entries(files)) {
      if (!exists) continue;

      const fileRecord = fileRecords?.find((f) => f.format === format);
      if (!fileRecord) continue;

      let fileData: Buffer;

      // MP3 files are stored in filesystem, others in database
      if (format === 'mp3') {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', 'audio', `${tab.id}.mp3`);
        if (!fs.existsSync(filePath)) {
          console.error(`[webhook] MP3 file not found: ${filePath}`);
          continue;
        }
        fileData = await fs.promises.readFile(filePath);
      } else if (fileRecord.data) {
        // Read from database (bytea)
        if (typeof fileRecord.data === 'string') {
          const hexString = fileRecord.data.replace(/^\\x/, '');
          fileData = Buffer.from(hexString, 'hex');
        } else if (Buffer.isBuffer(fileRecord.data)) {
          fileData = fileRecord.data;
        } else {
          console.error(`[webhook] Invalid data for ${tab.id}/${format}`);
          continue;
        }
      } else {
        console.error(`[webhook] No data for ${tab.id}/${format}`);
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
