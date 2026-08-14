interface AuthEmailOptions {
  to: string;
  name: string;
  locale: 'ru' | 'en';
  type: 'verify' | 'reset';
  token: string;
}

const BRAND_NAME = 'OlegGuitar';
const EMAIL_FROM = `${BRAND_NAME} <${SITE_EMAIL}>`;

export async function sendAuthEmail({ to, name, locale, type, token }: AuthEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const baseUrl = SITE_URL;
  const localePrefix = locale === 'en' ? '/en' : '';
  const path = type === 'verify' ? 'verify-email' : 'reset-password';
  const url = `${baseUrl}${localePrefix}/${path}?token=${encodeURIComponent(token)}`;
  const isRu = locale === 'ru';
  const subject =
    type === 'verify'
      ? isRu
        ? `Подтвердите email — ${BRAND_NAME}`
        : `Confirm your email — ${BRAND_NAME}`
      : isRu
        ? `Восстановление пароля — ${BRAND_NAME}`
        : `Reset your password — ${BRAND_NAME}`;
  const action =
    type === 'verify'
      ? isRu
        ? 'Подтвердить email'
        : 'Confirm email'
      : isRu
        ? 'Создать новый пароль'
        : 'Create a new password';
  const intro =
    type === 'verify'
      ? isRu
        ? 'Подтвердите адрес почты, чтобы завершить создание аккаунта.'
        : 'Confirm your email address to finish creating your account.'
      : isRu
        ? 'Вы запросили восстановление пароля. Ссылка действует один час.'
        : 'You requested a password reset. This link is valid for one hour.';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#241d1a">
        <h1 style="font-size:24px">${BRAND_NAME}</h1>
        <p>${isRu ? 'Привет' : 'Hi'}, ${escapeHtml(name)}!</p>
        <p>${intro}</p>
        <p style="margin:28px 0"><a href="${url}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:#d07352;color:#fff;text-decoration:none;font-weight:600">${action}</a></p>
        <p style="font-size:13px;color:#756d69">${isRu ? 'Если это были не вы, просто проигнорируйте письмо.' : 'If this was not you, you can safely ignore this email.'}</p>
      </div>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend request failed: ${response.status}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}
import { SITE_EMAIL, SITE_URL } from '@/lib/constants';
