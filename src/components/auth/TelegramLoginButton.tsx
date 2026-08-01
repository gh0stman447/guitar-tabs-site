'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
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

function loadTelegramScript() {
  if (window.Telegram?.Login) return Promise.resolve();
  if (telegramScriptPromise) return telegramScriptPromise;

  telegramScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-oleg-telegram-login]');
    const script = existing ?? document.createElement('script');
    const handleLoad = () => resolve();
    const handleError = () => reject(new Error('Unable to load Telegram Login Widget'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.dataset.olegTelegramLogin = 'true';
      document.head.appendChild(script);
    }
  });

  return telegramScriptPromise;
}

interface TelegramLoginButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  children: ReactNode;
}

export function TelegramLoginButton({ children, disabled, ...props }: TelegramLoginButtonProps) {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  async function authenticate() {
    setLoading(true);
    try {
      const [response] = await Promise.all([
        fetch(`/api/auth/telegram/start?locale=${locale}`, { cache: 'no-store' }),
        loadTelegramScript(),
      ]);
      if (!response.ok || !window.Telegram?.Login) throw new Error('Telegram auth unavailable');
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
    } catch (error) {
      console.error('[telegram/login]', error);
      setLoading(false);
      const prefix = locale === 'en' ? '/en' : '';
      window.location.assign(`${prefix}/auth?telegram=failed`);
    }
  }

  return (
    <Button type='button' disabled={disabled || loading} onClick={() => void authenticate()} {...props}>
      {loading && <LoaderCircle className='animate-spin' />}
      {children}
    </Button>
  );
}
