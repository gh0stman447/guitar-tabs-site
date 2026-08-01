import { NextRequest, NextResponse } from 'next/server';
import { authError, hashPassword, hashToken, validatePassword } from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return authError('invalid_request');
  }
  const token = body.token ?? '';
  const password = body.password ?? '';
  if (!token) return authError('invalid_token');
  if (!validatePassword(password)) return authError('invalid_password');

  const tokenResult = await query(
    `UPDATE user_auth_tokens
     SET used_at = now()
     WHERE token_hash = $1
       AND purpose = 'reset_password'
       AND used_at IS NULL
       AND expires_at > now()
     RETURNING user_id`,
    [hashToken(token)],
  );
  const userId = tokenResult.rows[0]?.user_id as string | undefined;

  if (!userId) return authError('invalid_token');

  const passwordHash = await hashPassword(password);
  const userResult = await query(
    `UPDATE users
     SET password_hash = $1,
         email_verified_at = COALESCE(email_verified_at, now()),
         updated_at = now()
     WHERE id = $2
     RETURNING id, email, merged_into_user_id`,
    [passwordHash, userId],
  );

  const user = userResult.rows[0] as {
    id: string;
    email: string;
    merged_into_user_id: string | null;
  };

  const accountId = user.merged_into_user_id ?? user.id;

  await query(
    `UPDATE customers SET user_id = $1
     WHERE lower(email) = lower($2) AND (user_id IS NULL OR user_id = $1)`,
    [accountId, user.email],
  );

  await query(
    `DELETE FROM user_sessions
     WHERE user_id = $1 OR user_id = (SELECT merged_into_user_id FROM users WHERE id = $1)`,
    [userId],
  );

  return NextResponse.json({ ok: true });
}
