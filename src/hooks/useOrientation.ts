'use client';

import { useEffect, useState } from 'react';

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Современный способ (большая поддержка)
      if (window.screen.orientation) {
        setIsLandscape(window.screen.orientation.type.includes('landscape'));
      }
      // Fallback для старых браузеров
      else {
        setIsLandscape(window.innerWidth > window.innerHeight);
      }
    };

    checkOrientation();

    // Слушаем изменение ориентации
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return isLandscape;
}
