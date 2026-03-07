'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

export function HeroSection() {
  const t = useTranslations('hero');

  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-background dark:from-amber-950/20 dark:via-background dark:to-background' />
      <div className='absolute top-1/4 right-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl' />
      <div className='absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-300/5 rounded-full blur-3xl' />

      <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
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
              onClick={() => document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('ctaTabs')}
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='h-12 px-8 rounded-full'
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('ctaAbout')}
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        className='absolute bottom-8 left-1/2 -translate-x-1/2'
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ArrowDown className='h-5 w-5 text-muted-foreground' />
      </motion.div>
    </section>
  );
}
