import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const error = requireAdminSession(req);
  if (error) return error;
  return NextResponse.json({ ok: true });
}
