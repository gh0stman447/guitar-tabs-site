'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, Mail, MailPlus, MailWarning, Send, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { useUserAuth } from '@/context/UserAuthContext';

export function AccountSettingsClient() {
  const t = useTranslations('account');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading, refresh } = useUserAuth();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'error' | 'exists'>('idle');
  const [mergeStatus, setMergeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mergeError, setMergeError] = useState<'expired' | 'unauthorized' | 'generic'>('generic');
  const [showTelegramSwitchHelp, setShowTelegramSwitchHelp] = useState(false);
  const telegramEnabled = process.env.NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED === 'true';
  const telegramStatus = searchParams.get('telegram');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth');
  }, [isLoading, router, user]);

  async function resendVerification() {
    if (!user?.email) return;
    setVerificationStatus('loading');
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, locale }),
    });
    setVerificationStatus(response.ok ? 'sent' : 'error');
  }

  async function addEmail() {
    const email = newEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      setEmailStatus('error');
      return;
    }
    setEmailStatus('loading');
    const response = await fetch('/api/account/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale }),
    });
    const payload = (await response.json()) as { error?: string; emailSent?: boolean };
    if (!response.ok) {
      setEmailStatus(payload.error === 'email_exists' ? 'exists' : 'error');
      return;
    }
    setVerificationStatus(payload.emailSent === false ? 'error' : 'sent');
    setEmailStatus('idle');
    await refresh();
  }

  async function mergeTelegramAccount() {
    setMergeStatus('loading');
    const response = await fetch('/api/account/merge-telegram', { method: 'POST' });
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      setMergeStatus('success');
      await refresh();
      return;
    }
    setMergeError(
      payload.error === 'unauthorized'
        ? 'unauthorized'
        : payload.error === 'merge_expired'
          ? 'expired'
          : 'generic',
    );
    setMergeStatus('error');
  }

  if (isLoading) return <LoaderCircle className='h-8 w-8 animate-spin text-primary' />;
  if (!user) return null;

  return (
    <div className='w-full max-w-3xl'>
      <Link href={`/${locale}/account`} className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'>
        <ArrowLeft className='h-4 w-4' /> {t('backToAccount')}
      </Link>
      <span className='mt-7 block text-xs font-semibold uppercase tracking-[0.22em] text-primary'>{t('settingsBadge')}</span>
      <h1 className='mt-2 text-3xl font-bold sm:text-4xl'>{t('settingsTitle')}</h1>
      <p className='mt-2 text-muted-foreground'>{t('settingsDescription')}</p>

      {user.email && !user.emailVerified && (
        <section className='mt-7 flex flex-col gap-4 rounded-[1.5rem] border border-amber-500/45 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <MailWarning className='mt-0.5 h-5 w-5 shrink-0 text-amber-500' />
            <div>
              <h2 className='font-semibold'>{t('verifyTitle')}</h2>
              <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{t('verifyDescription', { email: user.email })}</p>
              {verificationStatus === 'sent' && <p className='mt-2 text-sm text-primary'>{t('verificationSent')}</p>}
              {verificationStatus === 'error' && <p className='mt-2 text-sm text-destructive'>{t('verificationError')}</p>}
            </div>
          </div>
          <Button variant='outline' className='shrink-0' disabled={verificationStatus === 'loading' || verificationStatus === 'sent'} onClick={() => void resendVerification()}>
            {verificationStatus === 'loading' && <LoaderCircle className='animate-spin' />}
            {t('resendVerification')}
          </Button>
        </section>
      )}

      <div className='mt-6 grid gap-5'>
        <section className='rounded-[1.5rem] border border-border/60 bg-card/75 p-6'>
          <div className='flex items-center gap-3 text-primary'><Mail className='h-5 w-5' /><h2 className='font-semibold'>{t('email')}</h2></div>
          {user.email ? (
            <>
              <p className='mt-4 font-medium'>{user.email}</p>
              <p className='mt-2 flex items-center gap-2 text-sm text-muted-foreground'><ShieldCheck className='h-4 w-4 text-primary' />{user.emailVerified ? t('verified') : t('notVerified')}</p>
            </>
          ) : (
            <div className='mt-4'>
              <p className='text-sm leading-relaxed text-muted-foreground'>{t('addEmailDescription')}</p>
              <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
                <input
                  type='email'
                  value={newEmail}
                  onChange={(event) => { setNewEmail(event.target.value); setEmailStatus('idle'); }}
                  placeholder='you@example.com'
                  className='auth-input min-w-0 flex-1'
                  aria-label={t('email')}
                />
                <Button
                  type='button'
                  variant='outline'
                  disabled={emailStatus === 'loading' || !newEmail.trim()}
                  onClick={() => void addEmail()}
                >
                  {emailStatus === 'loading' ? <LoaderCircle className='animate-spin' /> : <MailPlus />}
                  {t('addEmail')}
                </Button>
              </div>
              {emailStatus === 'error' && <p className='mt-2 text-sm text-destructive'>{t('invalidEmail')}</p>}
              {emailStatus === 'exists' && <p className='mt-2 text-sm text-destructive'>{t('emailAlreadyUsed')}</p>}
            </div>
          )}
        </section>

        <section className='rounded-[1.5rem] border border-border/60 bg-card/75 p-6'>
          <div className='flex items-center gap-3'><Send className='h-5 w-5 text-[#229ED9]' /><h2 className='font-semibold'>{t('telegramTitle')}</h2></div>
          <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
            {user.telegramConnected ? t('telegramConnectedDescription') : t('telegramDescription')}
          </p>
          {(telegramStatus === 'connected' || user.telegramConnected) && (
            <p className='mt-3 flex items-center gap-2 text-sm text-primary'>
              <ShieldCheck className='h-4 w-4' /> {t('telegramConnected')}
            </p>
          )}
          {telegramStatus === 'merge-required' && mergeStatus === 'idle' && (
            <div className='mt-4 rounded-xl bg-primary/10 p-4'>
              <p className='text-sm leading-relaxed'>{t('telegramMergeDescription')}</p>
              <Button className='mt-3 w-full' onClick={() => void mergeTelegramAccount()}>{t('mergeAccounts')}</Button>
            </div>
          )}
          {mergeStatus === 'loading' && <p className='mt-3 text-sm text-muted-foreground'>{t('merging')}</p>}
          {mergeStatus === 'success' && <p className='mt-3 text-sm text-primary'>{t('mergeSuccess')}</p>}
          {mergeStatus === 'error' && (
            <p className='mt-3 text-sm text-destructive'>
              {mergeError === 'unauthorized'
                ? t('mergeUnauthorized')
                : mergeError === 'expired'
                  ? t('mergeExpired')
                  : t('mergeError')}
            </p>
          )}
          {telegramEnabled && (
            <div className='mt-5 flex flex-col items-start gap-3'>
              {!user.telegramConnected && telegramStatus !== 'merge-required' && (
              <TelegramLoginButton variant='outline' className='w-full sm:w-auto'>
                {t('connectTelegram')}
              </TelegramLoginButton>
              )}
              <button
                type='button'
                onClick={() => setShowTelegramSwitchHelp((value) => !value)}
                className='inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
              >
                {t('switchTelegramAccount')}
              </button>
              {showTelegramSwitchHelp && (
                <p className='max-w-xl rounded-xl bg-muted/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground'>
                  {t('switchTelegramInstructions')}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
