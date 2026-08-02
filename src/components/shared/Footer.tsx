'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BrandLogo } from '@/components/shared/BrandLogo';

export function Footer() {
  const t = useTranslations('footer');
  const { locale } = useParams<{ locale: string }>();

  return (
    <footer className='border-t border-border/60 py-7 sm:py-8'>
      <div className='mx-auto flex max-w-7xl flex-col items-center gap-7 px-4 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:text-left lg:px-8'>
        <BrandLogo locale={locale} />

        <div className='flex flex-col items-center gap-3 text-sm text-muted-foreground md:items-end md:text-right'>
          <nav className='flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-end'>
            <Link
              href={`/${locale}/legal`}
              prefetch={false}
              target='_blank'
              className='transition-colors hover:text-foreground'
            >
              {t('legal')}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              prefetch={false}
              target='_blank'
              className='transition-colors hover:text-foreground'
            >
              {t('privacy')}
            </Link>
          </nav>
          <p className='text-xs leading-relaxed'>{t('details')}</p>
          <span className='text-xs'>
            © {new Date().getFullYear()} {t('rights')}
          </span>
        </div>
      </div>
    </footer>
  );
}
