import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
export { validatePassword } from '@/lib/password-policy';

export const USER_SESSION_COOKIE = 'user_session';
export const PERSONAL_DATA_CONSENT_VERSION = '2026-08-01';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  telegramConnected: boolean;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
  return `scrypt:${SCRYPT_OPTIONS.N}:${SCRYPT_OPTIONS.r}:${SCRYPT_OPTIONS.p}:${salt.toString('base64url')}:${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(':');
  if (parts[0] !== 'scrypt') return false;
  const isParameterized = parts.length === 6;
  const saltValue = isParameterized ? parts[4] : parts[1];
  const keyValue = isParameterized ? parts[5] : parts[2];
  if (!saltValue || !keyValue) return false;
  const options = isParameterized
    ? { N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]), maxmem: 256 * 1024 * 1024 }
    : undefined;

  const salt = Buffer.from(saltValue, 'base64url');
  const expectedKey = Buffer.from(keyValue, 'base64url');
  const actualKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, expectedKey.length, options ?? {}, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

  return expectedKey.length === actualKey.length && crypto.timingSafeEqual(expectedKey, actualKey);
}

export function createRawToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRequestIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}

export async function createUserSession(userId: string, req: NextRequest) {
  const token = createRawToken();
  await query(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, now() + ($3 * interval '1 second'), $4, $5)`,
    [
      userId,
      hashToken(token),
      SESSION_TTL_SECONDS,
      getRequestIp(req),
      req.headers.get('user-agent'),
    ],
  );
  return token;
}

export function setUserSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export async function deleteUserSession(token?: string) {
  if (!token) return;
  await query('DELETE FROM user_sessions WHERE token_hash = $1', [hashToken(token)]);
}

export function clearUserSessionCookie(response: NextResponse) {
  response.cookies.set(USER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await query(
    `SELECT u.id, u.name, u.email, u.email_verified_at,
            EXISTS (
              SELECT 1 FROM user_identities identity
              WHERE identity.user_id = u.id AND identity.provider = 'telegram'
            ) AS telegram_connected
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > now()
       AND u.merged_into_user_id IS NULL
     LIMIT 1`,
    [hashToken(token)],
  );
  const user = result.rows[0] as
    | {
        id: string;
        name: string;
        email: string | null;
        email_verified_at: Date | null;
        telegram_connected: boolean;
      }
    | undefined;
  if (!user) return null;

  void query(
    `UPDATE user_sessions SET last_used_at = now()
     WHERE token_hash = $1 AND last_used_at < now() - interval '15 minutes'`,
    [hashToken(token)],
  ).catch(() => undefined);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.email_verified_at),
    telegramConnected: user.telegram_connected,
  };
}

export function authError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
