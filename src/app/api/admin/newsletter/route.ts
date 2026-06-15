import { NextRequest, NextResponse } from 'next/server';
import db, { query } from '@/lib/db';
import { TABLE_CUSTOMERS, TABLE_NEWSLETTER_LOGS, SITE_URL } from '@/lib/constants';
import { validateAdminSession } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get('admin_session')?.value;
  if (!adminSession || !validateAdminSession(adminSession)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subject, text, tabTitle, tabUrl, tabImage } = await req.json();

  if (!subject || !text || !tabTitle || !tabUrl) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
  }

  const { data: customers, error } = await db.from(TABLE_CUSTOMERS).select('email, firstname').eq('newsletter', true);

  if (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  if (!customers || customers.length === 0) {
    return NextResponse.json({ error: 'Нет подписчиков' }, { status: 400 });
  }

  // deduplicate by email
  const seen = new Set<string>();
  const unique = (customers as Array<{ email: string; firstname: string }>).filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  });

  const emails = unique.map((c) => ({
    from: 'OlegGuitar <noreply@olegguitar.com>',
    to: c.email,
    subject,
    html: buildEmailHtml({
      firstname: c.firstname,
      email: c.email,
      text,
      tabTitle,
      tabUrl,
      tabImage,
    }),
  }));

  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(emails),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message || 'Ошибка Resend' }, { status: 500 });
  }

  const data = await res.json();
  console.log('[newsletter] Resend response:', JSON.stringify(data, null, 2));

  // Save email IDs to newsletter_logs
  // Resend batch API returns [{ id: '...' }, { id: '...' }] in same order as emails array
  const emailData = Array.isArray(data?.data) ? data.data : [];
  console.log('[newsletter] Email data to save:', emailData.length);

  if (emailData.length) {
    for (let i = 0; i < emailData.length; i++) {
      const item = emailData[i];
      const recipient = emails[i];
      if (recipient && item.id) {
        console.log('[newsletter] Inserting log for:', recipient.to, item.id);
        await query(
          `INSERT INTO "${TABLE_NEWSLETTER_LOGS}" (email, resend_email_id, subject, status)
           VALUES ($1, $2, $3, $4)`,
          [recipient.to, item.id, subject, 'sent'],
        );
      }
    }
  }

  return NextResponse.json({ ok: true, sent: unique.length });
}

function buildEmailHtml({
  firstname,
  email,
  text,
  tabTitle,
  tabUrl,
  tabImage,
}: {
  firstname: string;
  email: string;
  text: string;
  tabTitle: string;
  tabUrl: string;
  tabImage?: string;
}) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tabTitle}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          ${
            tabImage
              ? `
          <tr>
            <td style="padding-bottom:24px;">
              <img src="${tabImage}" alt="${tabTitle}" width="600"
                style="width:100%;border-radius:12px;display:block;" />
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td style="padding-bottom:8px;">
              <p style="margin:0;font-size:16px;color:#cccccc;">Привет, ${firstname}!</p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">
                Новый таб — ${tabTitle}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#cccccc;white-space:pre-line;">${text}</p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:40px;" align="center">
              <a href="${tabUrl}"
                style="display:inline-block;padding:14px 32px;background:#ffffff;color:#0f0f0f;
                    font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">
                Смотреть таб →
              </a>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid #222;padding-top:24px;">
              <p style="margin:0;font-size:13px;color:#666666;text-align:center;">
                Вы получили это письмо, потому что подписались на обновления при покупке.<br/>
                <a href="${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}"
                  style="color:#888888;">Отписаться</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
