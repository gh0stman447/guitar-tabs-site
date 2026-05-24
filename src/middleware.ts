import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle /admin (no locale) - redirect to /ru/admin or home
  if (pathname === '/admin') {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (sessionCookie) {
      // Admin - redirect to home page
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
    // Not authenticated - redirect to login page with default locale
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = '/ru/admin';
    return NextResponse.redirect(redirectUrl);
  }

  // For all other routes, apply i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
};
