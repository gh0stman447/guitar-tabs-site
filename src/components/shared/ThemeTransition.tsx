'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

type ThemeChangeEvent = CustomEvent<{ theme: 'light' | 'dark' }>;

type ViewTransition = {
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => ViewTransition;
};

export function ThemeTransition() {
  const { setTheme } = useTheme();
  const isTransitioning = useRef(false);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const { theme } = (event as ThemeChangeEvent).detail;
      const documentWithTransition = document as DocumentWithViewTransition;
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      const isTouchViewport = window.matchMedia('(hover: none), (pointer: coarse)').matches;

      if (
        isTransitioning.current ||
        prefersReducedMotion ||
        isTouchViewport ||
        !documentWithTransition.startViewTransition
      ) {
        setTheme(theme);
        return;
      }

      isTransitioning.current = true;
      document.documentElement.dataset.themeTransition = 'active';

      const transition = documentWithTransition.startViewTransition(() => {
        setTheme(theme);
      });

      transition.finished.finally(() => {
        isTransitioning.current = false;
        delete document.documentElement.dataset.themeTransition;
      });
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, [setTheme]);

  return null;
}
