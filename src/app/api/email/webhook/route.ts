import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_PURCHASES } from '@/lib/constants';

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

  console.log('📧 [email-webhook] Received event:', type, 'emailId:', emailId);

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
      console.log('📧 [email-webhook] Unknown event type:', type);
      return NextResponse.json({ ok: true });
  }

  // Only upgrade status, never downgrade
  const { data: purchase, error: fetchError } = await supabaseAdmin
    .from(TABLE_PURCHASES)
    .select('email_status')
    .eq('resend_email_id', emailId)
    .single();

  console.log('📧 [email-webhook] Purchase lookup:', purchase ? 'found' : 'not found', fetchError);

  if (!purchase) return NextResponse.json({ ok: true });

  const currentPriority = STATUS_PRIORITY[purchase.email_status ?? ''] ?? 0;
  const newPriority = STATUS_PRIORITY[newStatus] ?? 0;

  console.log('📧 [email-webhook] Priority check:', currentPriority, '->', newPriority, newPriority > currentPriority ? '(upgrade)' : '(no upgrade)');

  if (newPriority > currentPriority) {
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from(TABLE_PURCHASES)
      .update({ email_status: newStatus })
      .eq('resend_email_id', emailId);

    if (updateError) {
      console.error('📧 [email-webhook] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('📧 [email-webhook] Update success:', updateResult);
  }

  return NextResponse.json({ ok: true });
}
