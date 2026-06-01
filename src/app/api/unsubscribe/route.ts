import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { TABLE_CUSTOMERS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse('Неверная ссылка', { status: 400 });
  }

  console.log('[unsubscribe] Processing email:', email);

  // Сначала проверяем, существует ли customer
  const customer = await db
    .from(TABLE_CUSTOMERS)
    .select('id, newsletter')
    .eq('email', email)
    .single();

  console.log('[unsubscribe] Customer before update:', JSON.stringify(customer));

  if (!customer.data) {
    console.error('[unsubscribe] Customer not found:', email);
    return new NextResponse('Email не найден', { status: 404 });
  }

  // Обновляем статус рассылки
  const result = await db
    .from(TABLE_CUSTOMERS)
    .update({ newsletter: false })
    .eq('email', email);

  console.log('[unsubscribe] Update result:', JSON.stringify(result));

  // Determine locale from Accept-Language header
  const acceptLang = req.headers.get('accept-language') || '';
  const locale = acceptLang.startsWith('en') ? 'en' : 'ru';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.redirect(new URL(`/${locale}/unsubscribe?email=${encodeURIComponent(email)}`, siteUrl));
}
