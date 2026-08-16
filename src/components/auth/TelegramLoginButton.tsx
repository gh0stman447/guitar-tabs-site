'use client';

import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  allows_write_to_pm?: boolean;
  hash: string;
}

interface TelegramLoginApi {
  auth(
    options: { bot_id: string; lang?: string; request_access?: 'write' },
    callback: (data: TelegramAuthData | false) => void,
  ): void;
}

declare global {
  interface Window {
    Telegram?: { Login?: TelegramLoginApi };
  }
}

let telegramScriptPromise: Promise<void> | null = null;
let telegramScriptAttempt = 0;
const TELEGRAM_SCRIPT_TIMEOUT_MS = 8_000;

function resetTelegramScript() {
  telegramScriptAttempt += 1;
  telegramScriptPromise = null;
  document.querySelector<HTMLScriptElement>('script[data-oleg-telegram-login]')?.remove();
}

function loadTelegramScript() {
  if (window.Telegram?.Login) return Promise.resolve();
  if (telegramScriptPromise) return telegramScriptPromise;

  const attempt = ++telegramScriptAttempt;
  telegramScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-oleg-telegram-login]');
    const script = existing ?? document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Telegram Login Widget timed out'));
    }, TELEGRAM_SCRIPT_TIMEOUT_MS);
    const cleanup = () => {
      window.clearTimeout(timeout);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
    const handleLoad = () => {
      cleanup();
      if (window.Telegram?.Login) resolve();
      else reject(new Error('Telegram Login Widget API is unavailable'));
    };
    const handleError = () => {
      cleanup();
      reject(new Error('Unable to load Telegram Login Widget'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.dataset.olegTelegramLogin = 'true';
      document.head.appendChild(script);
    }
  }).catch((error) => {
    if (attempt === telegramScriptAttempt) resetTelegramScript();
    throw error;
  });

  return telegramScriptPromise;
}

interface TelegramLoginButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  children: ReactNode;
}

export function TelegramLoginButton({ children, disabled, ...props }: TelegramLoginButtonProps) {
  const locale = useLocale();
  const t = useTranslations('auth.errors');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Загружаем виджет заранее, но не показываем ошибку без действия пользователя.
    void loadTelegramScript().catch(() => undefined);

    return () => {
      // Если окно закрыли во время зависшей загрузки, следующему открытию нужна
      // новая попытка, а не сохранённый незавершённый Promise.
      if (!window.Telegram?.Login) resetTelegramScript();
    };
  }, []);

  async function authenticate() {
    setLoadError(false);

    // Успешная загрузка script сама по себе недостаточна: проверяем наличие API
    // виджета непосредственно в момент пользовательского клика.
    if (!window.Telegram?.Login) {
      setLoadError(true);
      resetTelegramScript();
      void loadTelegramScript()
        .then(() => setLoadError(false))
        .catch(() => setLoadError(true));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/telegram/start?locale=${locale}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Telegram auth unavailable');
      const payload = (await response.json()) as { botId?: string; state?: string };
      if (!payload.botId || !payload.state) throw new Error('Invalid Telegram auth configuration');

      window.Telegram.Login.auth(
        { bot_id: payload.botId, lang: locale, request_access: 'write' },
        (authData) => {
        if (!authData) {
          setLoading(false);
          return;
        }
        const callbackUrl = new URL('/api/auth/telegram/callback', window.location.origin);
        Object.entries(authData).forEach(([key, value]) => callbackUrl.searchParams.set(key, String(value)));
        callbackUrl.searchParams.set('state', payload.state as string);
        window.location.assign(callbackUrl);
        },
      );
      setLoading(false);
    } catch (error) {
      console.error('[telegram/login]', error);
      setLoading(false);
      setLoadError(true);
    }
  }

  return (
    <>
      <Button type='button' disabled={disabled || loading} onClick={() => void authenticate()} {...props}>
        {loading && <LoaderCircle className='animate-spin' />}
        {children}
      </Button>
      {loadError && (
        <p role='alert' className='mt-2 text-center text-xs leading-relaxed text-destructive'>
          {t('telegramUnavailable')}
        </p>
      )}
    </>
  );
}
