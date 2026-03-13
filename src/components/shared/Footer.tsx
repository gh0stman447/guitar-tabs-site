'use client';

import { Guitar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const { locale } = useParams<{ locale: string }>();

  return (
    <footer className='border-t border-border py-8 mt-16'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <span>{t('name')}</span>
        </div>
        <div className='flex flex-col sm:flex-row items-center gap-3'>
          <span>{t('inn')}</span>
          <Link
            href={`/${locale}/legal`}
            target='_blank'
            className='hover:text-foreground transition-colors underline underline-offset-4'
          >
            {t('legal')}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            target='_blank'
            className='hover:text-foreground transition-colors underline underline-offset-4'
          >
            Политика конфиденциальности
          </Link>
          <span>
            © {new Date().getFullYear()} {t('rights')}
          </span>
        </div>
      </div>
    </footer>
  );
}
