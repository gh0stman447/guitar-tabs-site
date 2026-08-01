import { NextRequest, NextResponse } from 'next/server';
import { createRawToken } from '@/lib/customer-auth';
import { getTelegramConfig } from '@/lib/telegram-auth';

const OAUTH_COOKIE_TTL = 10 * 60;

export async function GET(req: NextRequest) {
  try {
    const config = getTelegramConfig();
    const state = createRawToken();
    const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ru';

    const response = NextResponse.json({ botId: config.botId, state });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: OAUTH_COOKIE_TTL,
      path: '/',
    };
    response.cookies.set('telegram_oauth_state', state, cookieOptions);
    response.cookies.set('telegram_oauth_locale', locale, cookieOptions);
    return response;
  } catch (error) {
    console.error('[auth/telegram/start]', error);
    return NextResponse.json({ error: 'telegram_not_configured' }, { status: 503 });
  }
}
