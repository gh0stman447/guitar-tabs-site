'use client';

import { useTheme } from 'next-themes';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const isTouch = useIsTouch();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className='w-9 h-9' />;

  const isDark = theme === 'dark';
  const isRu = locale === 'ru';

  if (isTouch) {
    return (
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label='Переключить тему'
      >
        {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
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
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label='Переключить тему'
      >
        {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
      </Button>
      <ReactTooltip id='theme-toggle' place='bottom' opacity={1} delayShow={350} />
    </>
  );
}
