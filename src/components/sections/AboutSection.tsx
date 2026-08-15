'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
import { Music, Guitar } from 'lucide-react';

export function AboutSection() {
  const t = useTranslations('about');
  const isTouch = useIsTouch();
  const duration = isTouch ? 0.6 / 1.5 : 0.6;
  const yearsOfExperience = Math.max(5, 5 + new Date().getFullYear() - 2026);

  const facts = [
    {
      icon: Guitar,
      label: t('fact1Label'),
      desc: t('fact1Desc', { count: yearsOfExperience }),
    },
    { icon: Music, label: t('fact2Label'), desc: t('fact2Desc') },
  ];

  const details = [
    { number: '01', title: t('detail1Title'), text: t('detail1Text') },
    { number: '02', title: t('detail2Title'), text: t('detail2Text') },
    { number: '03', title: t('detail3Title'), text: t('detail3Text') },
    { number: '04', title: t('detail4Title'), text: t('detail4Text') },
  ];

  return (
    <section id='about' className='section-soft py-12 sm:py-24 overflow-hidden'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid md:grid-cols-2 gap-12 items-center'>
          <motion.div
            initial={isTouch ? false : { opacity: 0, x: -30 }}
            whileInView={isTouch ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration }}
            className='relative'
          >
            <div className='group relative isolate mx-auto flex h-[31rem] max-w-md items-end justify-center sm:h-[38rem]'>
              <div className='absolute left-1/2 top-1/2 h-[72%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-3xl' />
              <Image
                src='/generated/me.png'
                alt='Олег Малыгин'
                width={1066}
                height={1600}
                sizes='(max-width: 767px) calc(100vw - 2rem), 448px'
                className='relative z-10 h-full w-full origin-center scale-[1.01] object-contain object-bottom pointer-events-none select-none transition-transform duration-700 ease-out will-change-transform [@media(hover:hover)]:group-hover:scale-[1.1] motion-reduce:transition-none motion-reduce:[@media(hover:hover)]:group-hover:scale-[1.01]'
                draggable={false}
              />
            </div>
          </motion.div>

          <motion.div
            initial={isTouch ? false : { opacity: 0, x: 30 }}
            whileInView={isTouch ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration, delay: 0.1 }}
          >
            <span className='text-primary text-sm font-medium tracking-widest uppercase'>
              {t('badge')}
            </span>
            <h2 className='mt-2 mb-5 text-3xl font-bold sm:text-4xl'>
              {t('titleIntro')}{' '}
              <span className='relative isolate inline-block -rotate-1 px-2 text-primary'>
                <span className='absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.62em] -skew-x-12 rounded-[45%_55%_48%_52%] bg-gradient-to-r from-primary/10 via-primary/25 to-amber-400/15' />
                <span className='relative'>{t('titleName')}</span>
                <span className='absolute -bottom-1 left-[18%] h-0.5 w-[68%] -rotate-2 rounded-full bg-gradient-to-r from-primary/25 via-primary to-amber-400/35' />
              </span>
            </h2>
            <div className='mb-6 text-muted-foreground'>
              <p className='leading-relaxed'>{t('text1')}</p>
            </div>

            <div className='relative mb-7 ml-1 space-y-1 before:absolute before:bottom-5 before:left-[1.15rem] before:top-5 before:w-px before:bg-gradient-to-b before:from-primary/70 before:via-primary/25 before:to-transparent'>
              {details.map(({ number, title, text }, index) => (
                <motion.div
                  key={number}
                  initial={isTouch ? false : { opacity: 0, x: 16 }}
                  whileInView={isTouch ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration * 0.65, delay: 0.08 + index * 0.07 }}
                  className='group relative flex gap-4 rounded-2xl px-1 py-3 transition-colors duration-300 [@media(hover:hover)]:hover:bg-background/45'
                >
                  <span className='relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-background text-[10px] font-bold tracking-wider text-primary shadow-[0_4px_14px_hsl(var(--primary)/0.1)] dark:bg-card'>
                    {number}
                  </span>
                  <div className='min-w-0 pt-0.5'>
                    <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
                    <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className='flex flex-col gap-2.5'>
              {facts.map(({ icon: Icon, label, desc }, i) => (
                <motion.article
                  key={label}
                  initial={isTouch ? false : { opacity: 0, x: 20 }}
                  whileInView={isTouch ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration * 0.7, delay: 0.1 + i * 0.1 }}
                  className='relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border/60 bg-background/55 p-4 shadow-sm backdrop-blur-sm dark:bg-card/55'
                >
                  <span className='absolute inset-y-3 left-0 w-0.5 rounded-full bg-gradient-to-b from-primary/30 via-primary to-amber-400/40' />
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary'>
                    <Icon className='h-[1.125rem] w-[1.125rem]' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-sm font-semibold text-foreground'>{label}</div>
                    <div className='mt-1 text-xs leading-relaxed text-muted-foreground'>{desc}</div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
