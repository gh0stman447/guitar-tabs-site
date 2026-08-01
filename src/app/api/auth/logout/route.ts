import { NextRequest, NextResponse } from 'next/server';
import {
  USER_SESSION_COOKIE,
  clearUserSessionCookie,
  deleteUserSession,
} from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  await deleteUserSession(req.cookies.get(USER_SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  clearUserSessionCookie(response);
  return response;
}
