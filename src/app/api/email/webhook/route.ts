import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TABLE_PURCHASES, TABLE_NEWSLETTER_LOGS } from '@/lib/constants';

// Resend event priority: opened > delivered > sent
const STATUS_PRIORITY: Record<string, number> = {
  sent: 1,
  delivered: 2,
  opened: 3,
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type as string;
  const emailId = body.data?.email_id as string | undefined;

  if (!emailId) return NextResponse.json({ ok: true });

  let newStatus: string | null = null;

  switch (type) {
    case 'email.delivered':
      newStatus = 'delivered';
      break;
    case 'email.opened':
      newStatus = 'opened';
      break;
    default:
      return NextResponse.json({ ok: true });
  }

  // Try to find in purchases first
  const purchaseResult = await query(
    `SELECT email_status FROM "${TABLE_PURCHASES}" WHERE resend_email_id = $1`,
    [emailId],
  );
  const purchase = purchaseResult.rows[0] || null;

  if (purchase) {
    const currentPriority = STATUS_PRIORITY[purchase.email_status ?? ''] ?? 0;
    const newPriority = STATUS_PRIORITY[newStatus] ?? 0;

    if (newPriority > currentPriority) {
      await query(
        `UPDATE "${TABLE_PURCHASES}" SET email_status = $1 WHERE resend_email_id = $2`,
        [newStatus, emailId],
      );
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

    if (newPriority > currentPriority) {
      await query(
        `UPDATE "${TABLE_NEWSLETTER_LOGS}" SET status = $1 WHERE resend_email_id = $2`,
        [newStatus, emailId],
      );
    }
  }

  return NextResponse.json({ ok: true });
}
