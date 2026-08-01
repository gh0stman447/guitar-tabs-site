import crypto from 'crypto';

const TELEGRAM_AUTH_MAX_AGE_SECONDS = 10 * 60;
const SIGNED_FIELDS = [
  'allows_write_to_pm',
  'auth_date',
  'first_name',
  'id',
  'last_name',
  'photo_url',
  'username',
] as const;

export interface TelegramAuthUser {
  id: string;
  name: string;
  username?: string;
}

export function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const botId = botToken?.split(':', 1)[0];

  if (!botToken || !botId || !/^\d+$/.test(botId)) {
    throw new Error('Telegram Login Widget is not configured');
  }

  return { botToken, botId };
}

export function verifyTelegramAuthData(params: URLSearchParams): TelegramAuthUser {
  const { botToken } = getTelegramConfig();
  const hash = params.get('hash');
  const id = params.get('id');
  const authDateRaw = params.get('auth_date');

  if (!hash || !/^[a-f\d]{64}$/i.test(hash) || !id || !/^\d+$/.test(id) || !authDateRaw) {
    throw new Error('Incomplete Telegram auth data');
  }

  const authDate = Number(authDateRaw);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(authDate) || authDate > now + 60 || now - authDate > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
    throw new Error('Expired Telegram auth data');
  }

  const dataCheckString = SIGNED_FIELDS
    .flatMap((key) => {
      const value = params.get(key);
      return value === null ? [] : [`${key}=${value}`];
    })
    .sort()
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest();
  const receivedHash = Buffer.from(hash, 'hex');

  if (receivedHash.length !== expectedHash.length || !crypto.timingSafeEqual(receivedHash, expectedHash)) {
    throw new Error('Invalid Telegram auth signature');
  }

  const firstName = params.get('first_name')?.trim() ?? '';
  const lastName = params.get('last_name')?.trim() ?? '';
  const username = params.get('username')?.trim() || undefined;

  return {
    id,
    name: [firstName, lastName].filter(Boolean).join(' ') || username || 'Telegram user',
    username,
  };
}
