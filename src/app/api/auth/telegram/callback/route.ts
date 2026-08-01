import { NextRequest, NextResponse } from 'next/server';
import {
  PERSONAL_DATA_CONSENT_VERSION,
  createRawToken,
  createUserSession,
  getUserFromRequest,
  hashToken,
  setUserSessionCookie,
} from '@/lib/customer-auth';
import { query, transaction } from '@/lib/db';
import { verifyTelegramAuthData } from '@/lib/telegram-auth';

function publicOrigin(req: NextRequest) {
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol =
    forwardedProto === 'https' || forwardedProto === 'http'
      ? forwardedProto
      : req.nextUrl.protocol.replace(':', '');

  if (host && /^[a-z\d.-]+(?::\d+)?$/i.test(host)) return `${protocol}://${host}`;
  return req.nextUrl.origin;
}

function pageUrl(req: NextRequest, path: string) {
  return new URL(path, publicOrigin(req));
}

function authPage(req: NextRequest, locale: string, queryString: string) {
  const prefix = locale === 'en' ? '/en' : '';
  return pageUrl(req, `${prefix}/auth${queryString}`);
}

export async function GET(req: NextRequest) {
  const locale = req.cookies.get('telegram_oauth_locale')?.value === 'en' ? 'en' : 'ru';
  const state = req.nextUrl.searchParams.get('state');
  const expectedState = req.cookies.get('telegram_oauth_state')?.value;
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(authPage(req, locale, '?telegram=failed'));
  }

  try {
    const telegramUser = verifyTelegramAuthData(req.nextUrl.searchParams);
    const currentUser = await getUserFromRequest(req);
    const identityResult = await query(
      `SELECT user_id FROM user_identities
       WHERE provider = 'telegram' AND provider_user_id = $1 LIMIT 1`,
      [telegramUser.id],
    );
    const identityUserId = identityResult.rows[0]?.user_id as string | undefined;

    if (currentUser) {
      if (identityUserId && identityUserId !== currentUser.id) {
        const mergeToken = createRawToken();

        await query(
          `INSERT INTO account_merge_attempts
             (token_hash, target_user_id, source_user_id, expires_at)
           VALUES ($1, $2, $3, now() + interval '15 minutes')`,
          [hashToken(mergeToken), currentUser.id, identityUserId],
        );

        const prefix = locale === 'en' ? '/en' : '';
        const response = NextResponse.redirect(
          pageUrl(req, `${prefix}/account/settings?telegram=merge-required`),
        );

        response.cookies.set('account_merge_pending', mergeToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60,
          path: '/',
        });
        return response;
      }

      if (!identityUserId) {
        await query(
          `INSERT INTO user_identities
             (user_id, provider, provider_user_id, provider_username)
           VALUES ($1, 'telegram', $2, $3)`,
          [currentUser.id, telegramUser.id, telegramUser.username ?? null],
        );
      }
      const prefix = locale === 'en' ? '/en' : '';
      return NextResponse.redirect(pageUrl(req, `${prefix}/account/settings?telegram=connected`));
    }

    if (identityUserId) {
      const sessionToken = await createUserSession(identityUserId, req);
      const prefix = locale === 'en' ? '/en' : '';
      const response = NextResponse.redirect(pageUrl(req, `${prefix}/`));
      setUserSessionCookie(response, sessionToken);
      return response;
    }

    const userId = await transaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users
           (name, email, personal_data_consent_at, personal_data_consent_version)
         VALUES ($1, NULL, now(), $2)
         RETURNING id`,
        [telegramUser.name, PERSONAL_DATA_CONSENT_VERSION],
      );

      const createdUserId = userResult.rows[0].id as string;
      await client.query(
        `INSERT INTO user_identities
           (user_id, provider, provider_user_id, provider_username)
         VALUES ($1, 'telegram', $2, $3)`,
        [createdUserId, telegramUser.id, telegramUser.username ?? null],
      );
      return createdUserId;
    });

    const sessionToken = await createUserSession(userId, req);
    const prefix = locale === 'en' ? '/en' : '';
    const response = NextResponse.redirect(pageUrl(req, `${prefix}/`));
    setUserSessionCookie(response, sessionToken);

    return response;
  } catch (error) {
    console.error('[auth/telegram/callback]', error);
    return NextResponse.redirect(authPage(req, locale, '?telegram=failed'));
  }
}
