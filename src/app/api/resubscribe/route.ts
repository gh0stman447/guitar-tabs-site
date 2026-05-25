import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { TABLE_CUSTOMERS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse('Неверная ссылка', { status: 400 });
  }

  await db.from(TABLE_CUSTOMERS).update({ newsletter: true }).eq('email', email);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.redirect(new URL('/resubscribed', siteUrl));
}
