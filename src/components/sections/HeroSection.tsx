'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { useIsTouch } from '@/hooks/useIsTouch';
import { NOTES } from '@/lib/notes';

const floatingNotes = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  symbol: NOTES[i % NOTES.length],
  left: `${5 + (i * 97) / 17}%`,
  duration: 8 + (i % 5) * 2.5,
  delay: -(i * 1.1),
  size: 20 + (i % 4) * 10,
  opacity: 0.18 + (i % 3) * 0.08,
}));

export function HeroSection() {
  const t = useTranslations('hero');
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const isMobile = useIsTouch();

  const blobY1 = useTransform(scrollYProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '-40%']);
  const blobY2 = useTransform(scrollYProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '-20%']);
  const notesY = useTransform(scrollYProgress, [0, 1], ['0%', '-60%']);
  const contentY = useTransform(scrollYProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], isMobile ? [1, 1] : [1, 0]);

  return (
    <section
      ref={ref}
      data-no-particles
      className='relative min-h-screen flex items-center justify-center overflow-hidden'
    >
      <div className='absolute inset-0 bg-gradient-to-br from-amber-50/50 via-background to-background dark:from-amber-950/10 dark:via-background dark:to-background' />
      <motion.div
        style={{ y: blobY1 }}
        className='absolute top-1/4 right-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl'
      />
      <motion.div
        style={{ y: blobY2 }}
        className='absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl'
      />

      <div className='absolute inset-0 pointer-events-none'>
        <motion.div
          style={{ y: notesY, display: isMobile ? 'none' : undefined }}
          className='absolute inset-0 pointer-events-none'
        >
          {floatingNotes.map((note) => (
            <motion.span
              key={note.id}
              className='absolute bottom-0 select-none text-amber-500'
              style={{ left: note.left, fontSize: note.size, opacity: note.opacity }}
              animate={{ y: '-110vh', rotate: [0, 15, -10, 5, 0] }}
              initial={{ y: '110vh' }}
              transition={{
                duration: note.duration,
                delay: note.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {note.symbol}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        style={{ y: contentY, opacity }}
        className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className='inline-block text-amber-500 text-sm font-medium tracking-widest uppercase mb-4'>
            {t('badge')}
          </span>
          <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight'>
            {t('title')}
            <br />
            <span className='text-amber-500'>{t('titleAccent')}</span>
          </h1>
          <p className='text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10'>
            {t('description')}
          </p>
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
        </motion.div>
      </motion.div>

      <motion.div
        className='absolute bottom-8 left-1/2 -translate-x-1/2'
        animate={isMobile ? {} : { y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ArrowDown className='h-5 w-5 text-muted-foreground' />
      </motion.div>
    </section>
  );
}
