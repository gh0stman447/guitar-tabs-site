'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useUserAuth } from '@/context/UserAuthContext';
import {
  getPasswordValidationError,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/lib/password-policy';
import { cn } from '@/lib/utils';

export function VerifyEmailCard() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useUserAuth();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );

  useEffect(() => {
    if (!token) return;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        await refresh();
        setStatus('success');
        redirectTimer = setTimeout(() => router.replace('/account'), 900);
      })
      .catch(() => setStatus('error'));
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [token, refresh, router]);

  return (
    <SimpleCard>
      {status === 'loading' && <LoaderCircle className='mx-auto h-10 w-10 animate-spin text-primary' />}
      {status === 'success' && <CheckCircle2 className='mx-auto h-10 w-10 text-primary' />}
      <h1 className='mt-5 text-2xl font-bold'>
        {status === 'loading'
          ? t('verifying')
          : status === 'success'
            ? t('verified')
            : t('invalidLink')}
      </h1>
      {status === 'error' && (
        <Button asChild className='mt-6'>
          <Link href='/auth'>{t('backToLogin')}</Link>
        </Button>
      )}
    </SimpleCard>
  );
}

export function ForgotPasswordCard() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim()) && email.trim().length <= 254;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!emailValid) return;
    setLoading(true);
    setRequestError(false);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (!response.ok) throw new Error('Request failed');
      setSent(true);
    } catch {
      setRequestError(true);
    }
    setLoading(false);
  }

  return (
    <SimpleCard>
      <h1 className='text-2xl font-bold'>{t('forgotTitle')}</h1>
      <p className='mt-2 text-sm text-muted-foreground'>{t('forgotDescription')}</p>
      {sent ? (
        <p className='mt-6 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary'>{t('resetSent')}</p>
      ) : (
        <form onSubmit={submit} noValidate className='mt-6 space-y-4'>
          <input
            type='email'
            value={email}
            onChange={(e) => { setEmail(e.target.value); setRequestError(false); }}
            onBlur={() => setTouched(true)}
            className={cn('auth-input', touched && !emailValid && 'border-destructive')}
            aria-invalid={touched && !emailValid}
            placeholder='you@example.com'
            required
          />
          {touched && !emailValid && <p className='text-left text-sm text-destructive'>{t('errors.invalidEmail')}</p>}
          {requestError && <p className='text-left text-sm text-destructive'>{t('errors.generic')}</p>}
          <Button className='h-11 w-full' disabled={loading || !emailValid}>
            {loading && <LoaderCircle className='animate-spin' />}
            {t('sendReset')}
          </Button>
        </form>
      )}
      <Link href='/auth' className='mt-5 inline-block text-sm text-primary hover:underline'>{t('backToLogin')}</Link>
    </SimpleCard>
  );
}

export function ResetPasswordCard() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<'password' | 'link' | ''>('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (getPasswordValidationError(password)) {
      setError('password');
      return;
    }
    setLoading(true);
    setError('');
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.get('token'), password }),
    });
    if (response.ok) router.replace('/auth');
    else setError('link');
    setLoading(false);
  }

  return (
    <SimpleCard>
      <h1 className='text-2xl font-bold'>{t('resetTitle')}</h1>
      <p className='mt-2 text-sm text-muted-foreground'>{t('resetDescription')}</p>
      <form onSubmit={submit} noValidate className='mt-6 space-y-4'>
        <input type='password' value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className={cn('auth-input', error === 'password' && 'border-destructive')} aria-invalid={error === 'password'} minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} placeholder={t('passwordPlaceholder')} required />
        {error === 'password' && <p className='text-left text-sm text-destructive'>{t('errors.invalidPassword')}</p>}
        {error === 'link' && <p className='text-sm text-destructive'>{t('invalidLink')}</p>}
        <Button className='h-11 w-full' disabled={loading || !password}>
          {loading && <LoaderCircle className='animate-spin' />}
          {t('savePassword')}
        </Button>
      </form>
    </SimpleCard>
  );
}

function SimpleCard({ children }: { children: React.ReactNode }) {
  return <div className='w-full max-w-md rounded-[2rem] border border-border/60 bg-card/90 p-7 text-center shadow-xl backdrop-blur-xl'>{children}</div>;
}
