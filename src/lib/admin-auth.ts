import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory session store (survives until server restart)
const sessions = new Set<string>();

// Rate limiting: IP → { count, resetAt }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function createAdminSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.add(token);
  return token;
}

export function validateAdminSession(token: string): boolean {
  return sessions.has(token);
}

export function deleteAdminSession(token: string): void {
  sessions.delete(token);
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
  if (!token || !validateAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function isAdminAuthed(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('admin_session=');
}
