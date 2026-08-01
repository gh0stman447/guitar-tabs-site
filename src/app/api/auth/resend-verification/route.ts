import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/auth-email';
import { consumeAuthAttempt } from '@/lib/auth-rate-limit';
import { createRawToken, getRequestIp, hashToken, normalizeEmail } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { email?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const email = normalizeEmail(body.email ?? '');
  const key = `verify:${getRequestIp(req) ?? 'unknown'}:${email}`;
  if (!consumeAuthAttempt(key, 3, 60 * 60 * 1000)) return NextResponse.json({ ok: true });

  const result = await query(
    `SELECT id, name, email FROM users
     WHERE lower(email) = $1 AND email_verified_at IS NULL AND merged_into_user_id IS NULL
     LIMIT 1`,
    [email],
  );

  const user = result.rows[0] as { id: string; name: string; email: string } | undefined;
  if (user) {
    await query(
      `UPDATE user_auth_tokens SET used_at = now()
       WHERE user_id = $1 AND purpose = 'verify_email' AND used_at IS NULL`,
      [user.id],
    );

    const token = createRawToken();
    await query(
      `INSERT INTO user_auth_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, 'verify_email', $2, now() + interval '24 hours')`,
      [user.id, hashToken(token)],
    );

    try {
      await sendAuthEmail({
        to: user.email,
        name: user.name,
        locale: body.locale === 'en' ? 'en' : 'ru',
        type: 'verify',
        token,
      });
    } catch (error) {
      console.error('[auth/resend-verification] Failed to send email:', error);
    }
  }
  return NextResponse.json({ ok: true });
}
