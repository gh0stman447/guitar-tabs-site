import { NextRequest, NextResponse } from 'next/server';
import { sendAuthEmail } from '@/lib/auth-email';
import {
  authError,
  createRawToken,
  getUserFromRequest,
  hashToken,
  normalizeEmail,
} from '@/lib/customer-auth';
import { transaction } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return authError('unauthorized', 401);
  if (user.email) return authError('email_already_set', 409);

  let body: { email?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return authError('invalid_request');
  }

  const email = normalizeEmail(body.email ?? '');
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return authError('invalid_email');
  }

  const verificationToken = createRawToken();
  try {
    await transaction(async (client) => {
      const existing = await client.query(
        `SELECT id FROM users
         WHERE lower(email) = $1 AND merged_into_user_id IS NULL
         LIMIT 1`,
        [email],
      );
      if (existing.rowCount) throw new Error('email_exists');

      const updated = await client.query(
        `UPDATE users
         SET email = $1, email_verified_at = NULL, updated_at = now()
         WHERE id = $2 AND email IS NULL AND merged_into_user_id IS NULL
         RETURNING id`,
        [email, user.id],
      );
      if (!updated.rowCount) throw new Error('email_already_set');

      await client.query(
        `INSERT INTO user_identities (user_id, provider, provider_user_id)
         VALUES ($1, 'email', $2)`,
        [user.id, email],
      );
      await client.query(
        `INSERT INTO user_auth_tokens (user_id, purpose, token_hash, expires_at)
         VALUES ($1, 'verify_email', $2, now() + interval '24 hours')`,
        [user.id, hashToken(verificationToken)],
      );
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'email_exists') return authError('email_exists', 409);
    if (message === 'email_already_set') return authError('email_already_set', 409);
    if ((error as { code?: string }).code === '23505') return authError('email_exists', 409);
    console.error('[account/email]', error);
    return authError('auth_unavailable', 503);
  }

  let emailSent = true;
  try {
    await sendAuthEmail({
      to: email,
      name: user.name,
      locale: body.locale === 'en' ? 'en' : 'ru',
      type: 'verify',
      token: verificationToken,
    });
  } catch (error) {
    console.error('[account/email] Failed to send verification email:', error);
    emailSent = false;
  }

  return NextResponse.json({ email, emailSent });
}
