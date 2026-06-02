import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TABLE_CUSTOMERS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse('Неверная ссылка', { status: 400 });
  }

  try {
    // Обновляем статус рассылки через прямой SQL запрос
    await query(
      `UPDATE "${TABLE_CUSTOMERS}" SET newsletter = false WHERE email = $1`,
      [email]
    );
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return new NextResponse('Ошибка сервера', { status: 500 });
  }

  // Determine locale from Accept-Language header
  const acceptLang = req.headers.get('accept-language') || '';
  const locale = acceptLang.startsWith('en') ? 'en' : 'ru';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  return NextResponse.redirect(new URL(`/${locale}/unsubscribe?email=${encodeURIComponent(email)}`, siteUrl));
}
