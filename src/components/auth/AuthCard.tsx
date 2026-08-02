'use client';

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Mail, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { useUserAuth } from '@/context/UserAuthContext';
import { cn } from '@/lib/utils';
import {
  getPasswordValidationError,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/lib/password-policy';

type Mode = 'login' | 'register';
type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'consent', string>>;

export function AuthCard({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useUserAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const telegramEnabled = process.env.NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED === 'true';
  const telegramStatus = searchParams.get('telegram');
  const hasRequiredValues =
    Boolean(email.trim() && password) &&
    (mode === 'login' || Boolean(name.trim() && consent));

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError('');
    setMessage('');
    setCanResend(false);
    setFieldErrors({});
  }

  function validateFields() {
    const nextErrors: FieldErrors = {};
    const normalizedEmail = email.trim();
    if (mode === 'register' && (name.trim().length < 2 || name.trim().length > 80)) {
      nextErrors.name = t('errors.invalidName');
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      nextErrors.email = t('errors.invalidEmail');
    }
    if (
      mode === 'register'
        ? getPasswordValidationError(password) !== null
        : !password || password.length > MAX_PASSWORD_LENGTH
    ) {
      nextErrors.password = t('errors.invalidPassword');
    }
    if (mode === 'register' && !consent) {
      nextErrors.consent = t('errors.consentRequired');
    }
    return nextErrors;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateField(field: keyof FieldErrors) {
    const nextErrors = validateFields();
    setFieldErrors((current) => ({ ...current, [field]: nextErrors[field] }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setCanResend(false);

    const nextErrors = validateFields();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, consent, locale }),
      });
      const responseText = await response.text();
      let payload: { error?: string } = {};
      if (responseText) {
        try {
          payload = JSON.parse(responseText) as { error?: string };
        } catch {
          payload = { error: 'auth_unavailable' };
        }
      }
      if (!response.ok) {
        const errorCode = payload.error;
        if (errorCode === 'invalid_name') {
          setFieldErrors({ name: errorText(errorCode) });
        } else if (errorCode === 'invalid_email' || errorCode === 'email_exists' || errorCode === 'email_not_verified') {
          setFieldErrors({ email: errorText(errorCode) });
        } else if (errorCode === 'invalid_password' || errorCode === 'invalid_credentials') {
          setFieldErrors({ password: errorText(errorCode) });
        } else if (errorCode === 'consent_required') {
          setFieldErrors({ consent: errorText(errorCode) });
        } else {
          setError(errorText(errorCode));
        }
        setCanResend(payload.error === 'email_not_verified' || payload.error === 'email_exists');
        return;
      }
      await refresh();
      if (onSuccess) onSuccess();
      else router.replace('/account');
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    setIsSubmitting(true);
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale }),
    }).catch(() => undefined);
    setMessage(t('verificationResent'));
    setError('');
    setCanResend(false);
    setIsSubmitting(false);
  }

  function errorText(code?: string) {
    const knownErrors: Record<string, string> = {
      invalid_name: t('errors.invalidName'),
      invalid_email: t('errors.invalidEmail'),
      invalid_password: t('errors.invalidPassword'),
      consent_required: t('errors.consentRequired'),
      email_exists: t('errors.emailExists'),
      invalid_credentials: t('errors.invalidCredentials'),
      email_not_verified: t('errors.emailNotVerified'),
      too_many_requests: t('errors.tooManyRequests'),
      email_send_failed: t('errors.emailSendFailed'),
      auth_unavailable: t('errors.authUnavailable'),
    };
    return knownErrors[code ?? ''] ?? t('errors.generic');
  }

  return (
    <div className='w-full max-w-[30rem] rounded-[1.375rem] border border-border/70 bg-card px-3.5 py-2.5 shadow-[0_24px_80px_hsl(var(--foreground)/0.12)] sm:rounded-[1.75rem] sm:px-7 sm:py-3'>
      <div className='mb-4 sm:mb-5'>
        <span className='text-xs font-semibold uppercase tracking-[0.22em] text-primary'>
          OlegGuitar
        </span>
        <h1 className='mt-1.5 text-[1.4rem] font-bold leading-tight sm:mt-2 sm:text-[2.125rem]'>{t('title')}</h1>
        <p className='mt-1.5 text-[13px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm'>{t('description')}</p>
      </div>

      {telegramEnabled ? (
        <>
          <TelegramLoginButton variant='outline' className='h-11 w-full disabled:pointer-events-auto disabled:cursor-not-allowed'>
            <Send className='text-[#229ED9]' />{t('telegram')}
          </TelegramLoginButton>
          <p className='mt-1.5 text-center text-[10px] leading-relaxed text-muted-foreground sm:mt-2'>
            {t('telegramConsentPrefix')}{' '}
            <Link href='/privacy' prefetch={false} target='_blank' className='cursor-pointer underline underline-offset-2 hover:text-foreground'>
              {t('privacy')}
            </Link>
          </p>
        </>
      ) : (
        <Button type='button' variant='outline' className='h-11 w-full disabled:pointer-events-auto disabled:cursor-not-allowed' disabled>
          <Send className='text-[#229ED9]' />{t('telegramSoon')}
        </Button>
      )}
      {telegramStatus === 'failed' && <p className='mt-3 text-sm text-destructive'>{t('errors.telegramFailed')}</p>}

      <div className='my-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground sm:my-5 sm:gap-4 sm:text-xs'>
        <span className='h-px flex-1 bg-border' />
        {t('orEmail')}
        <span className='h-px flex-1 bg-border' />
      </div>

      <div className='grid grid-cols-2 rounded-xl bg-muted/60 p-1'>
        {(['login', 'register'] as const).map((item) => (
          <button
            key={item}
            type='button'
            onClick={() => changeMode(item)}
            className={cn(
              'h-10 cursor-pointer rounded-lg text-sm font-medium transition-colors',
              mode === item
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(item)}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className='mt-4 space-y-3 sm:mt-5 sm:space-y-3.5'>
        {mode === 'register' && (
          <Field label={t('name')} error={fieldErrors.name}>
            <input
              value={name}
              onChange={(event) => { setName(event.target.value); clearFieldError('name'); }}
              onBlur={() => validateField('name')}
              autoComplete='name'
              placeholder={t('namePlaceholder')}
              className={cn('auth-input', fieldErrors.name && 'border-destructive focus:border-destructive focus:ring-destructive/15')}
              aria-invalid={Boolean(fieldErrors.name)}
              required
            />
          </Field>
        )}
        <Field label={t('email')} error={fieldErrors.email}>
          <div className='group relative'>
            <Mail className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary', fieldErrors.email && 'text-destructive group-focus-within:text-destructive')} />
            <input
              type='email'
              value={email}
              onChange={(event) => { setEmail(event.target.value); clearFieldError('email'); }}
              onBlur={() => validateField('email')}
              autoComplete='email'
              autoCapitalize='none'
              autoCorrect='off'
              spellCheck={false}
              inputMode='email'
              placeholder='you@example.com'
              className={cn('auth-input pl-11', fieldErrors.email && 'border-destructive focus:border-destructive focus:ring-destructive/15')}
              aria-invalid={Boolean(fieldErrors.email)}
              required
            />
          </div>
        </Field>
        <Field label={t('password')} error={fieldErrors.password}>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => { setPassword(event.target.value); clearFieldError('password'); }}
              onBlur={() => validateField('password')}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder={t('passwordPlaceholder')}
              className={cn('auth-input pr-12', fieldErrors.password && 'border-destructive focus:border-destructive focus:ring-destructive/15')}
              aria-invalid={Boolean(fieldErrors.password)}
              minLength={mode === 'register' ? MIN_PASSWORD_LENGTH : 1}
              maxLength={MAX_PASSWORD_LENGTH}
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword((value) => !value)}
              className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              aria-label={t('showPassword')}
            >
              {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
          </div>
          {mode === 'register' && !fieldErrors.password && (
            <p className='text-[11px] font-normal normal-case leading-snug tracking-normal text-muted-foreground sm:text-xs'>
              {t('passwordHint')}
            </p>
          )}
        </Field>

        {mode === 'register' ? (
          <div>
            <label className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-1.5 text-[10px] leading-relaxed text-muted-foreground transition-colors sm:gap-3 sm:p-2', fieldErrors.consent && 'border-destructive/60 bg-destructive/5')}>
              <input
                type='checkbox'
                checked={consent}
                onChange={(event) => { setConsent(event.target.checked); clearFieldError('consent'); }}
                onBlur={() => validateField('consent')}
                className='h-4 w-4 shrink-0 cursor-pointer accent-primary'
                aria-invalid={Boolean(fieldErrors.consent)}
                required
              />
              <span>
                {t('consentPrefix')}{' '}
                <Link href='/privacy' prefetch={false} target='_blank' className='cursor-pointer text-primary underline-offset-4 hover:underline'>
                  {t('privacy')}
                </Link>
              </span>
            </label>
            {fieldErrors.consent && <p className='mt-1.5 text-xs text-destructive'>{fieldErrors.consent}</p>}
          </div>
        ) : (
          <div className='text-right'>
            <Link href='/forgot-password' prefetch={false} className='cursor-pointer text-sm text-primary hover:underline'>
              {t('forgotPassword')}
            </Link>
          </div>
        )}

        {error && <p className='rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive'>{error}</p>}
        {canResend && (
          <button type='button' onClick={() => void resendVerification()} className='cursor-pointer text-sm text-primary hover:underline'>
            {t('resendVerification')}
          </button>
        )}
        {message && <p className='rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary'>{message}</p>}

        <Button type='submit' size='lg' className='h-11 w-full disabled:pointer-events-auto disabled:cursor-not-allowed' disabled={isSubmitting || !hasRequiredValues}>
          {isSubmitting && <LoaderCircle className='animate-spin' />}
          {mode === 'login' ? t('submitLogin') : t('submitRegister')}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className='block space-y-1.5 sm:space-y-2'>
      <span className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
        {label}
      </span>
      {children}
      {error && <span className='block text-xs font-normal normal-case tracking-normal text-destructive'>{error}</span>}
    </label>
  );
}
