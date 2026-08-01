import Image from 'next/image';
import Link from 'next/link';

export function BrandLogo({ locale, priority = false }: { locale: string; priority?: boolean }) {
  return (
    <Link
      href={locale === 'en' ? '/en' : '/'}
      aria-label='OlegGuitar'
      className='flex w-fit items-center gap-0 select-none'
    >
      <Image
        src='/generated/logo_.png'
        alt=''
        width={60}
        height={60}
        priority={priority}
        className='h-12 w-12 shrink-0 object-contain sm:h-[3.75rem] sm:w-[3.75rem]'
      />
      <div className='flex min-w-0 flex-col items-center overflow-visible'>
        <span className='inline-block whitespace-nowrap bg-gradient-to-r from-[#7f422f] via-[#b9683d] to-[#d8954d] bg-clip-text px-1 pb-1 text-[1.5rem] leading-[1.25] tracking-[-0.04em] text-transparent drop-shadow-[0_2px_1px_rgba(67,32,21,0.18)] [-webkit-text-stroke:0.12px_#75402e] [font-family:var(--font-brand)] sm:text-[1.85rem] dark:from-[#ebbd77] dark:via-[#d9884e] dark:to-[#bb5f42] dark:[-webkit-text-stroke:0.12px_#884832]'>
          OlegGuitar
        </span>
        <span className='whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-[0.2em] text-muted-foreground sm:text-[9px] sm:tracking-[0.24em]'>
          {locale === 'en' ? 'Guitar tabs' : 'Гитарные табы'}
        </span>
      </div>
    </Link>
  );
}
