import { NextRequest, NextResponse } from 'next/server';
import { consumeAuthAttempt, clearAuthAttempts } from '@/lib/auth-rate-limit';
import {
  authError,
  createUserSession,
  getRequestIp,
  normalizeEmail,
  setUserSessionCookie,
  verifyPassword,
} from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };

  try {
    body = await req.json();
  } catch {
    return authError('invalid_request');
  }
  const email = normalizeEmail(body.email ?? '');
  const password = body.password ?? '';

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return authError('invalid_email');
  if (!password || password.length > 128) return authError('invalid_password');

  const rateLimitKey = `login:${getRequestIp(req) ?? 'unknown'}:${email}`;

  if (!consumeAuthAttempt(rateLimitKey)) return authError('too_many_requests', 429);

  let result;

  try {
    result = await query(
      `SELECT account.id, account.name, account.email,
              credential.password_hash, credential.email_verified_at
       FROM users credential
       JOIN users account ON account.id = COALESCE(credential.merged_into_user_id, credential.id)
       WHERE lower(credential.email) = $1
       LIMIT 1`,
      [email],
    );
  } catch (error) {
    console.error('[auth/login] Database error:', error);
    return authError('auth_unavailable', 503);
  }

  const user = result.rows[0] as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string | null;
        email_verified_at: Date | null;
      }
    | undefined;

  if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return authError('invalid_credentials', 401);
  }

  clearAuthAttempts(rateLimitKey);
  const token = await createUserSession(user.id, req);
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.email_verified_at),
    },
  });

  setUserSessionCookie(response, token);
  return response;
}
