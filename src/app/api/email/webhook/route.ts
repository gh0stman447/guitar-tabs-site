import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TABLE_PURCHASES, TABLE_NEWSLETTER_LOGS } from '@/lib/constants';

// Resend event priority: opened > delivered > bounced > sent
const STATUS_PRIORITY: Record<string, number> = {
  sent: 1,
  bounced: 2,
  delivered: 3,
  opened: 4,
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type as string;
  const emailId = body.data?.email_id as string | undefined;

  console.log('[webhook] Received event:', { type, emailId });

  if (!emailId) return NextResponse.json({ ok: true });

  let newStatus: string | null = null;

  switch (type) {
    case 'email.delivered':
      newStatus = 'delivered';
      break;
    case 'email.opened':
      newStatus = 'opened';
      break;
    case 'email.bounced':
      newStatus = 'bounced';
      break;
    default:
      return NextResponse.json({ ok: true });
  }

  console.log('[webhook] New status:', newStatus);

  // Try to find in purchases first
  const purchaseResult = await query(
    `SELECT email_status FROM "${TABLE_PURCHASES}" WHERE resend_email_id = $1`,
    [emailId],
  );
  const purchase = purchaseResult.rows[0] || null;

  if (purchase) {
    const currentPriority = STATUS_PRIORITY[purchase.email_status ?? ''] ?? 0;
    const newPriority = STATUS_PRIORITY[newStatus] ?? 0;

    console.log('[webhook] purchases:', { currentPriority, newPriority, emailId });

    if (newPriority > currentPriority) {
      let timestampField: string | null = null;
      if (newStatus === 'delivered') timestampField = 'delivered_at';
      else if (newStatus === 'opened') timestampField = 'opened_at';
      // For 'bounced' - just update status without timestamp

      if (timestampField) {
        const sql = `UPDATE "${TABLE_PURCHASES}" SET email_status = $1, "${timestampField}" = NOW() WHERE resend_email_id = $2`;
        console.log('[webhook] Executing update:', sql);
        await query(sql, [newStatus, emailId]);
      } else {
        const sql = `UPDATE "${TABLE_PURCHASES}" SET email_status = $1 WHERE resend_email_id = $2`;
        console.log('[webhook] Executing update:', sql);
        await query(sql, [newStatus, emailId]);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Try newsletter_logs
  const newsletterResult = await query(
    `SELECT status FROM "${TABLE_NEWSLETTER_LOGS}" WHERE resend_email_id = $1`,
    [emailId],
  );
  const newsletter = newsletterResult.rows[0] || null;

  if (newsletter) {
    const currentPriority = STATUS_PRIORITY[newsletter.status ?? ''] ?? 0;
    const newPriority = STATUS_PRIORITY[newStatus] ?? 0;

    console.log('[webhook] newsletter_logs:', { currentPriority, newPriority, emailId });

    if (newPriority > currentPriority) {
      let timestampField: string | null = null;
      if (newStatus === 'delivered') timestampField = 'delivered_at';
      else if (newStatus === 'opened') timestampField = 'opened_at';
      // For 'bounced' - just update status without timestamp

      if (timestampField) {
        const sql = `UPDATE "${TABLE_NEWSLETTER_LOGS}" SET status = $1, "${timestampField}" = NOW() WHERE resend_email_id = $2`;
        console.log('[webhook] Executing update:', sql);
        await query(sql, [newStatus, emailId]);
      } else {
        const sql = `UPDATE "${TABLE_NEWSLETTER_LOGS}" SET status = $1 WHERE resend_email_id = $2`;
        console.log('[webhook] Executing update:', sql);
        await query(sql, [newStatus, emailId]);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
