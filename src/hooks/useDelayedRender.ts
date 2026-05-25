'use client';

import { useEffect, useState, useRef } from 'react';

export function useDelayedRender(delay = 50, trigger = true) {
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!trigger) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      queueMicrotask(() => setReady(false));
      return;
    }

    timerRef.current = setTimeout(() => {
      setReady(true);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [trigger, delay]);

  return ready;
}
