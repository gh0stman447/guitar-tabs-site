import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, TABLE_PURCHASES, BUCKET_TAB_FILES } from '@/lib/constants';

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
  а;
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

  if (!shopId || !secretKey) return true; // dev mode, skip verification

  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    },
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.status === 'succeeded';
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = body.event as string;
  const payment = body.object as YookassaPayment;

  if (event === 'payment.succeeded') {
    if (!payment?.id) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }
    const isTest = !!body.object?.test;
    const verified = await verifyWithYookassa(payment.id, isTest);
    if (!verified) {
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
  console.log(
    '[webhook] payment.canceled purchaseId:',
    purchaseId,
    'metadata:',
    JSON.stringify(payment?.metadata),
  );
  if (!purchaseId) return NextResponse.json({ ok: true });

  await supabaseAdmin.from(TABLE_PURCHASES).update({ status: 'canceled' }).eq('id', purchaseId);

  return NextResponse.json({ ok: true });
}

async function handlePaymentSucceeded(payment: YookassaPayment) {
  const purchaseId = payment?.metadata?.purchase_id;
  const customerEmail = payment?.metadata?.customer_email;

  if (!purchaseId || !customerEmail) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  // 1. Update purchase status
  const { error: updateError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .update({ status: 'succeeded' })
    .eq('id', purchaseId);

  if (updateError) {
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  // 2. Get purchase with tab_ids
  const { data: purchase, error: purchaseError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('tab_id, tab_ids, amount, customers(firstname)')
    .eq('id', purchaseId)
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  const tabIds: string[] =
    (purchase.tab_ids as string[] | null) ?? (purchase.tab_id ? [purchase.tab_id as string] : []);

  // 3. Get all tabs
  const { data: tabs, error: tabsError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, title_ru, title_en, files, purchase_count')
    .in('id', tabIds);

  if (tabsError || !tabs) {
    return NextResponse.json({ error: 'Tabs not found' }, { status: 404 });
  }

  // 4. Increment purchase_count for each tab
  for (const tab of tabs) {
    await supabaseAdmin
      .from(TABLE_TABS)
      .update({ purchase_count: (tab.purchase_count ?? 0) + 1 })
      .eq('id', tab.id);
  }

  // 5. Generate receipt via RU proxy (перед отправкой email)
  const customers = purchase.customers as unknown as { firstname: string }[] | null;
  const customerName = customers?.[0]?.firstname || 'Покупатель';
  const receiptUrl = await createReceipt(purchase.amount, customerName);

  // 6. Build zip archive
  const attachments = await buildZipAttachments(tabs);

  // 7. Send email с чеком
  const tabTitles = tabs.map((t) => t.title_ru).join(', ');
  const emailId = await sendEmail({ to: customerEmail, tabTitles, attachments, receiptUrl });

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
    await supabaseAdmin.from(TABLE_PURCHASES).update(updateData).eq('id', purchaseId);
  }

  return NextResponse.json({ ok: true });
}

async function buildZipAttachments(
  tabs: { id: string; title_ru: string; files: unknown }[],
): Promise<{ filename: string; content: string }[]> {
  const zip = new JSZip();
  const multiTab = tabs.length > 1;

  for (const tab of tabs) {
    const files = tab.files as Record<string, string>;
    const folder = multiTab ? zip.folder(tab.title_ru.replace(/[/\\?%*:|"<>]/g, '_'))! : zip;

    for (const [format, path] of Object.entries(files)) {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET_TAB_FILES).download(path);

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
