'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
import { Music, Guitar } from 'lucide-react';

export function AboutSection() {
  const t = useTranslations('about');
  const isTouch = useIsTouch();
  const duration = isTouch ? 0.6 / 1.5 : 0.6;

  const facts = [
    { icon: Guitar, label: t('fact1Label'), desc: t('fact1Desc') },
    { icon: Music, label: t('fact2Label'), desc: t('fact2Desc') },
  ];

  return (
    <section
      id='about'
      className='py-12 sm:py-24 overflow-hidden'
      style={{ backgroundColor: 'var(--bestseller-bg)' }}
    >
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid md:grid-cols-2 gap-12 items-center'>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration }}
            className='relative'
          >
            <div className='aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800/30 relative'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src='/me.jpg'
                alt='Олег Малыгин'
                className='object-cover pointer-events-none'
                draggable={false}
              />
            </div>
            <div className='absolute -bottom-4 -right-4 w-32 h-32 bg-amber-400/10 rounded-2xl -z-10' />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration, delay: 0.1 }}
          >
            <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>
              {t('badge')}
            </span>
            <h2 className='text-3xl sm:text-4xl font-bold mt-2 mb-6'>{t('title')}</h2>
            <p className='text-muted-foreground leading-relaxed mb-2 sm:mb-6'>{t('text1')}</p>
            <p className='text-muted-foreground leading-relaxed mb-2 sm:mb-6'>{t('text2')}</p>
            <p className='text-muted-foreground leading-relaxed mb-6 sm:mb-8'>{t('text3')}</p>

            <div className='flex flex-col gap-3'>
              {facts.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration * 0.7, delay: 0.1 + i * 0.1 }}
                  whileHover={{
                    scale: 1.02,
                    x: 0,
                    transition: { duration: 0.2 },
                  }}
                  className='flex items-center gap-4 p-4 rounded-xl border border-border cursor-pointer transition-shadow hover:shadow-lg'
                  style={{ backgroundColor: 'hsl(var(--background))' }}
                >
                  <motion.div
                    className='shrink-0 w-9 h-9 rounded-lg flex items-center justify-center'
                    style={{ backgroundColor: 'hsl(var(--secondary))' }}
                    whileHover={{
                      scale: 1.1,
                      transition: { duration: 0.3 },
                    }}
                  >
                    <Icon className='h-5 w-5 text-amber-500' />
                  </motion.div>
                  <div className='min-w-0'>
                    <div className='font-medium text-sm'>{label}</div>
                    <div className='text-xs text-muted-foreground mt-0.5'>{desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
