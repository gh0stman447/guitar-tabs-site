import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSession,
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const { blocked, remaining } = checkRateLimit(ip);
  if (blocked) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
      { status: 429 },
    );
  }

  const { password } = await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    recordFailedAttempt(ip);
    return NextResponse.json(
      { error: `Неверный пароль. Осталось попыток: ${remaining - 1}` },
      { status: 401 },
    );
  }

  resetAttempts(ip);
  const token = createAdminSession();

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return res;
}
