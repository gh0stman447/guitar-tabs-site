'use client';

import { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 15 });

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <motion.div
      style={{ scaleX }}
      className='fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
    />
  );
}
