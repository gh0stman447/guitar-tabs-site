'use client';

import { useTheme } from 'next-themes';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
import { cn } from '@/lib/utils';

const subscribeToHydration = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme } = useTheme();
  const locale = useLocale();
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  if (!mounted) return <div className='w-9 h-9' />;

  const isDark = theme === 'dark';
  const isRu = locale === 'ru';
  const animatedIcon = (
    <span className='relative flex h-[18px] w-[18px] items-center justify-center'>
      <AnimatePresence initial={false} mode='sync'>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          className='absolute inset-0 flex items-center justify-center'
          initial={
            prefersReducedMotion
              ? false
              : {
                  opacity: 0.35,
                  rotate: isDark ? 140 : -140,
                  scale: 0.6,
                  filter: 'blur(1px)',
                }
          }
          animate={{ opacity: 1, rotate: 0, scale: 1, filter: 'blur(0px)' }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0.35,
                  rotate: isDark ? -140 : 140,
                  scale: 0.6,
                  filter: 'blur(1px)',
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
          }
        >
          {isDark ? <Sun className='h-[18px] w-[18px]' /> : <Moon className='h-[18px] w-[18px]' />}
        </motion.span>
      </AnimatePresence>
    </span>
  );

  const handleThemeChange = () => {
    const nextTheme = isDark ? 'light' : 'dark';

    window.dispatchEvent(
      new CustomEvent('theme-change', {
        detail: { theme: nextTheme },
      }),
    );
  };

  if (isTouch) {
    return (
      <Button
        variant='ghost'
        size='icon'
        onClick={handleThemeChange}
        aria-label='Переключить тему'
        className={className}
      >
        {animatedIcon}
      </Button>
    );
  }

  return (
    <>
      <Button
        data-tooltip-id='theme-toggle'
        data-tooltip-content={isDark ? (isRu ? 'Светлая тема' : 'Light mode') : (isRu ? 'Тёмная тема' : 'Dark mode')}
        variant='ghost'
        size='icon'
        onClick={handleThemeChange}
        aria-label='Переключить тему'
        className={cn(className)}
      >
        {animatedIcon}
      </Button>
      <ReactTooltip
        id='theme-toggle'
        place='bottom'
        opacity={1}
        delayShow={350}
        style={{ fontSize: 13 }}
      />
    </>
  );
}
