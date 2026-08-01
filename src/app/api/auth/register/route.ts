import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/auth-email';
import { consumeAuthAttempt } from '@/lib/auth-rate-limit';
import {
  PERSONAL_DATA_CONSENT_VERSION,
  authError,
  createRawToken,
  createUserSession,
  getRequestIp,
  hashPassword,
  hashToken,
  normalizeEmail,
  setUserSessionCookie,
  validatePassword,
} from '@/lib/customer-auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    consent?: boolean;
    locale?: string;
  };
  try {
    body = await req.json();
  } catch {
    return authError('invalid_request');
  }

  const name = body.name?.trim() ?? '';
  const email = normalizeEmail(body.email ?? '');
  const password = body.password ?? '';
  const locale = body.locale === 'en' ? 'en' : 'ru';
  if (name.length < 2 || name.length > 80) return authError('invalid_name');
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return authError('invalid_email');
  if (!validatePassword(password)) return authError('invalid_password');
  if (body.consent !== true) return authError('consent_required');
  const rateLimitKey = `register:${getRequestIp(req) ?? 'unknown'}:${email}`;
  if (!consumeAuthAttempt(rateLimitKey, 5, 60 * 60 * 1000)) {
    return authError('too_many_requests', 429);
  }

  const existing = await query('SELECT id FROM users WHERE lower(email) = $1 LIMIT 1', [email]);

  if (existing.rowCount) return authError('email_exists', 409);

  const passwordHash = await hashPassword(password);
  const userResult = await query(
    `INSERT INTO users
       (name, email, password_hash, personal_data_consent_at, personal_data_consent_version)
     VALUES ($1, $2, $3, now(), $4)
     RETURNING id`,
    [name, email, passwordHash, PERSONAL_DATA_CONSENT_VERSION],
  );

  const userId = userResult.rows[0].id as string;
  await query(
    `INSERT INTO user_identities (user_id, provider, provider_user_id)
     VALUES ($1, 'email', $2)`,
    [userId, email],
  );

  const token = createRawToken();
  await query(
    `INSERT INTO user_auth_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, 'verify_email', $2, now() + interval '24 hours')`,
    [userId, hashToken(token)],
  );

  let emailSent = true;
  try {
    await sendAuthEmail({ to: email, name, locale, type: 'verify', token });
  } catch (error) {
    console.error('[auth/register] Failed to send verification email:', error);
    emailSent = false;
  }

  const sessionToken = await createUserSession(userId, req);
  const response = NextResponse.json({
    user: { id: userId, name, email, emailVerified: false },
    emailSent,
  });
  setUserSessionCookie(response, sessionToken);
  return response;
}
