'use client';

import { useEffect, useState } from 'react';
import { FileMusic, LoaderCircle, LogOut, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useUserAuth } from '@/context/UserAuthContext';

export function AccountPageClient() {
  const t = useTranslations('account');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading, logout } = useUserAuth();
  const [purchases, setPurchases] = useState<Array<{
    id: string;
    created_at: string;
    amount: number;
    tabs: Array<{ id: string; title_ru: string; title_en: string }>;
  }> | null>(null);

  useEffect(() => {
    if (!user?.emailVerified) return;
    fetch('/api/account/purchases', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => setPurchases(payload.purchases ?? []))
      .catch(() => setPurchases([]));
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth');
  }, [isLoading, router, user]);

  if (isLoading) return <LoaderCircle className='h-8 w-8 animate-spin text-primary' />;
  if (!user) return null;

  return (
    <div className='w-full max-w-4xl'>
      <span className='text-xs font-semibold uppercase tracking-[0.22em] text-primary'>{t('badge')}</span>
      <div className='mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold sm:text-4xl'>{t('hello', { name: user.name })}</h1>
          <p className='mt-2 text-muted-foreground'>{t('description')}</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link href={`/${locale}/account/settings`}><Settings /> {t('settings')}</Link>
          </Button>
          <Button variant='outline' onClick={async () => { await logout(); router.replace('/'); }}>
            <LogOut /> {t('logout')}
          </Button>
        </div>
      </div>

      {(!user.email || !user.emailVerified) && (
        <Link
          href={`/${locale}/account/settings`}
          className='mt-7 block rounded-[1.25rem] border border-amber-500/45 bg-amber-500/10 px-5 py-4 text-sm transition-colors hover:bg-amber-500/15'
        >
          <span className='font-semibold'>{user.email ? t('emailNeedsVerification') : t('emailMissing')}</span>{' '}
          <span className='text-muted-foreground'>{user.email ? t('openSettings') : t('addEmailInSettings')}</span>
        </Link>
      )}

      <section className='mt-7 rounded-[1.5rem] border border-border/60 bg-card/75 p-6'>
        <h2 className='font-semibold'>{t('purchases')}</h2>
        {!user.email || !user.emailVerified ? (
          <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>{user.email ? t('verifyToSeePurchases') : t('addEmailToSeePurchases')}</p>
        ) : purchases === null ? (
          <LoaderCircle className='mt-5 h-5 w-5 animate-spin text-primary' />
        ) : purchases.length === 0 ? (
          <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>{t('noPurchases')}</p>
        ) : (
          <div className='mt-5 grid gap-3 sm:grid-cols-2'>
            {purchases.flatMap((purchase) =>
              purchase.tabs.map((tab) => (
                <Link
                  key={`${purchase.id}-${tab.id}`}
                  href={`/${locale}/tabs/${tab.id}`}
                  className='flex items-center gap-3 rounded-xl border border-border/60 bg-background/45 p-4 transition-colors hover:bg-muted/60'
                >
                  <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'><FileMusic className='h-5 w-5' /></span>
                  <span className='min-w-0'>
                    <span className='block truncate font-medium'>{locale === 'en' ? tab.title_en : tab.title_ru}</span>
                    <span className='text-xs text-muted-foreground'>{new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ru').format(new Date(purchase.created_at))}</span>
                  </span>
                </Link>
              )),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
