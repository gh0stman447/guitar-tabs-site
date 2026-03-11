import { NextRequest, NextResponse } from 'next/server';

export function requireAdminSession(req: NextRequest): NextResponse | null {
  const session = req.cookies.get('admin_session')?.value;
  if (session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function isAdminAuthed(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('admin_session=');
}
