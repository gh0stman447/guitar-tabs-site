'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { useIsTouch } from '@/hooks/useIsTouch';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const t = useTranslations('hero');
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsTouch();

  // Compact mode for small screens in landscape
  const isCompact = isMobile;

  return (
    <section
      ref={ref}
      data-no-particles
      className='relative min-h-screen flex items-center justify-center'
    >
      <div className='absolute inset-0 bg-gradient-to-br from-amber-50/50 via-background to-background dark:from-amber-950/10 dark:via-background dark:to-background' />

      {/* Static blobs instead of animated */}
      <div className='absolute top-1/4 right-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl' />
      <div className='absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl' />

      {/* Static notes - no animation */}
      {!isMobile && (
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          {Array.from({ length: 18 }, (_, i) => {
            const NOTES = ['♪', '♫', '♬', '♩'];
            const symbol = NOTES[i % NOTES.length];
            const left = `${5 + (i * 97) / 17}%`;
            const size = 20 + (i % 4) * 10;
            const opacity = 0.18 + (i % 3) * 0.08;
            return (
              <span
                key={i}
                className='absolute bottom-0 select-none text-amber-500'
                style={{ left, fontSize: size, opacity }}
              >
                {symbol}
              </span>
            );
          })}
        </div>
      )}

      <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <div>
          <span
            className={cn(
              'inline-block text-amber-500 font-medium tracking-widest uppercase mb-4',
              isCompact ? 'text-xs' : 'text-sm',
            )}
          >
            {t('badge')}
          </span>
          <h1
            className={cn(
              'font-bold tracking-tight leading-tight mb-6',
              isCompact ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl lg:text-7xl',
            )}
          >
            {t('title')}
            <br />
            <span className='text-amber-500'>{t('titleAccent')}</span>
          </h1>
          <p
            className={cn(
              'text-muted-foreground max-w-2xl mx-auto',
              isCompact ? 'mb-0 text-sm' : 'text-lg sm:text-xl mb-10',
            )}
          >
            {t('description')}
          </p>
          {!isCompact && (
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Button
                size='lg'
                className='bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 h-12 rounded-full'
                onClick={() =>
                  document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {t('ctaTabs')}
              </Button>
              <Button
                variant='outline'
                size='lg'
                className='h-12 px-8 rounded-full'
                onClick={() =>
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {t('ctaAbout')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Static arrow */}
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2'>
        <ArrowDown className='h-5 w-5 text-muted-foreground' />
      </div>
    </section>
  );
}
