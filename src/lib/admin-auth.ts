import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Rate limiting: IP → { count, resetAt }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// JWT-like simple token for stateless session (works everywhere)
function signToken(data: { exp: number }): string {
  const secret = process.env.ADMIN_PASSWORD || 'default-secret';
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  // Replace URL-unsafe chars
  return `${payload}.${signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`;
}

function verifyToken(token: string): { valid: boolean; expired?: boolean } {
  try {
    const secret = process.env.ADMIN_PASSWORD || 'default-secret';
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return { valid: false };

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    if (signature !== expectedSignature) return { valid: false };

    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (data.exp < Date.now()) return { valid: false, expired: true };

    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export function createAdminSession(): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return signToken({ exp });
}

export function validateAdminSession(token: string): boolean {
  const result = verifyToken(token);
  return result.valid;
}

export function deleteAdminSession(): void {
  // Nothing to do - stateless token
}

export function checkRateLimit(ip: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { blocked: true, remaining: 0 };
  }

  return { blocked: false, remaining: MAX_ATTEMPTS - entry.count };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + BLOCK_DURATION_MS });
  } else {
    entry.count += 1;
  }
}

export function resetAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function requireAdminSession(req: NextRequest): NextResponse | null {
  const token = req.cookies.get('admin_session')?.value;

  if (!token) {
    console.log('[admin-auth] requireAdminSession: no token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isValid = validateAdminSession(token);
    console.log('[admin-auth] requireAdminSession:', {
      hasToken: true,
      tokenPrefix: token.substring(0, 8),
      isValid,
    });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (err) {
    console.error('[admin-auth] requireAdminSession error:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export function isAdminAuthed(): boolean {
  if (typeof document === 'undefined') return false;

  const match = document.cookie.match(/admin_session=([^;]+)/);
  if (!match) return false;

  const token = match[1];

  // Client-side validation: check token format and expiration
  // Note: Full HMAC verification is done on the server side
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;

    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    if (!data.exp) return false;

    // Check expiration
    return data.exp > Date.now();
  } catch {
    return false;
  }
}
