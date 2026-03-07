'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Music, Guitar, Headphones } from 'lucide-react';

export function AboutSection() {
  const t = useTranslations('about');

  const facts = [
    { icon: Guitar, label: t('fact1Label'), desc: t('fact1Desc') },
    { icon: Music, label: t('fact2Label'), desc: t('fact2Desc') },
    { icon: Headphones, label: t('fact3Label'), desc: t('fact3Desc') },
  ];

  return (
    <section id='about' className='py-24 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='grid md:grid-cols-2 gap-12 items-center'>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className='relative'
          >
            <div className='aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800/30 relative'>
              <Image src='/me.jpg' alt='Олег Малыгин' fill className='object-cover' priority />
            </div>
            <div className='absolute -bottom-4 -right-4 w-32 h-32 bg-amber-400/10 rounded-2xl -z-10' />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>
              {t('badge')}
            </span>
            <h2 className='text-3xl sm:text-4xl font-bold mt-2 mb-6'>{t('title')}</h2>
            <p className='text-muted-foreground leading-relaxed mb-6'>{t('text1')}</p>
            <p className='text-muted-foreground leading-relaxed mb-8'>{t('text2')}</p>

            <div className='flex flex-col gap-3'>
              {facts.map(({ icon: Icon, label, desc }) => (
                <div key={label} className='flex items-center gap-4 p-4 rounded-xl bg-secondary'>
                  <div className='shrink-0 w-9 h-9 rounded-lg bg-background flex items-center justify-center'>
                    <Icon className='h-5 w-5 text-amber-500' />
                  </div>
                  <div className='min-w-0'>
                    <div className='font-medium text-sm'>{label}</div>
                    <div className='text-xs text-muted-foreground mt-0.5'>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
