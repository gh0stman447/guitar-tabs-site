'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useIsTouch } from '@/hooks/useIsTouch';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const isTouch = useIsTouch();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence initial={!isTouch}>
      {visible && (
        <motion.button
          initial={isTouch ? false : { opacity: 0, scale: 0.8 }}
          animate={isTouch ? undefined : { opacity: 1, scale: 1 }}
          exit={isTouch ? undefined : { opacity: 0, scale: 0.8 }}
          transition={{ duration: isTouch ? 0 : 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-colors cursor-pointer'
          aria-label='Наверх'
        >
          <ArrowUp className='h-4 w-4' />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
