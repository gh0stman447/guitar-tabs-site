'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const { locale } = useParams<{ locale: string }>();

  return (
    <footer className='border-t border-border/60 py-7 sm:py-8'>
      <div className='mx-auto flex max-w-7xl flex-col gap-7 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8'>
        <Link
          href={locale === 'en' ? '/en' : '/'}
          className='flex w-fit items-center gap-1.5 select-none'
        >
          <Image
            src='/generated/logo_.png'
            alt='OlegGuitar'
            width={64}
            height={64}
            className='h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16'
          />
          <div className='flex flex-col items-center'>
            <span className='bg-gradient-to-r from-[#7f422f] via-[#b9683d] to-[#d8954d] bg-clip-text px-1 pb-1 text-[1.65rem] leading-none tracking-[-0.04em] text-transparent drop-shadow-[0_2px_1px_rgba(67,32,21,0.16)] [-webkit-text-stroke:0.12px_#75402e] [font-family:var(--font-brand)] sm:text-[1.85rem] dark:from-[#ebbd77] dark:via-[#d9884e] dark:to-[#bb5f42] dark:[-webkit-text-stroke:0.12px_#884832]'>
              OlegGuitar
            </span>
            <span className='text-[8px] font-semibold uppercase leading-none tracking-[0.22em] text-muted-foreground sm:text-[9px]'>
              {t('subtitle')}
            </span>
          </div>
        </Link>

        <div className='flex flex-col gap-3 text-sm text-muted-foreground lg:items-end'>
          <nav className='flex flex-wrap gap-x-5 gap-y-2'>
            <Link
              href={`/${locale}/legal`}
              target='_blank'
              className='transition-colors hover:text-foreground'
            >
              {t('legal')}
            </Link>
            <Link
              href={`/${locale}/privacy`}
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
