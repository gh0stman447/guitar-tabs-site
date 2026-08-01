import { NextRequest, NextResponse } from 'next/server';
import {
  authError,
  createUserSession,
  hashToken,
  setUserSessionCookie,
} from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let token = '';
  try {
    token = String((await req.json()).token ?? '');
  } catch {
    return authError('invalid_request');
  }
  if (!token) return authError('invalid_token');

  const tokenResult = await query(
    `UPDATE user_auth_tokens
     SET used_at = now()
     WHERE token_hash = $1
       AND purpose = 'verify_email'
       AND used_at IS NULL
       AND expires_at > now()
     RETURNING user_id`,
    [hashToken(token)],
  );
  const userId = tokenResult.rows[0]?.user_id as string | undefined;
  if (!userId) return authError('invalid_token', 400);

  const userResult = await query(
    `UPDATE users
     SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
     WHERE id = $1
     RETURNING id, name, email`,
    [userId],
  );
  const user = userResult.rows[0] as { id: string; name: string; email: string };
  const canonicalResult = await query(
    `SELECT account.id, account.name, account.email
     FROM users source
     JOIN users account ON account.id = COALESCE(source.merged_into_user_id, source.id)
     WHERE source.id = $1`,
    [userId],
  );
  const account = canonicalResult.rows[0] as { id: string; name: string; email: string };
  await query(
    `UPDATE customers
     SET user_id = $1
     WHERE lower(email) = lower($2) AND (user_id IS NULL OR user_id = $1)`,
    [account.id, user.email],
  );

  const sessionToken = await createUserSession(account.id, req);
  const response = NextResponse.json({
    user: { id: account.id, name: account.name, email: account.email, emailVerified: true },
  });
  setUserSessionCookie(response, sessionToken);
  return response;
}
