'use client';

import { useState, useLayoutEffect } from 'react';

export function useIsTouch() {
  // Initialize with false (SSR-safe)
  const [isTouch, setIsTouch] = useState(false);

  // Use layout effect to avoid cascading renders warning
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => {
    // Комбинированная проверка touch-устройств
    // 1. pointer: coarse — грубый указатель (палец)
    // 2. maxTouchPoints >= 1 — поддержка мультитача
    // 3. 'ontouchstart' in window — наличие touch API
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      window.navigator.maxTouchPoints >= 1 ||
      ('ontouchstart' in window);

    setIsTouch(isTouchDevice);
  }, []);

  return isTouch;
}
