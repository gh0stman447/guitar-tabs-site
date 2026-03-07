'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Music } from 'lucide-react';
import { MarqueeText } from '@/components/shared/MarqueeText';
import type { Tab } from '@/types';

function getDifficultyColor(difficulty: string) {
  const num = parseInt(difficulty);
  if (num <= 3) return 'border border-green-500 text-green-600 dark:text-green-400 bg-green-500/10';
  if (num <= 6) return 'border border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10';
  return 'border border-red-500 text-red-600 dark:text-red-400 bg-red-500/10';
}

const YouTubeIcon = () => (
  <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
    <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
  </svg>
);

interface TabCardProps {
  tab: Tab;
  locale: string;
  buyLabel: string;
  /** Анимация: задержка по индексу (для бестселлера) или layout (для каталога) */
  index?: number;
  /** Показать бейдж #1 */
  showRank?: boolean;
  /** Текст покупок под заголовком (для бестселлера) */
  purchasesLabel?: string;
  /** Показать форматы файлов и описание (для каталога) */
  showDetails?: boolean;
}

export function TabCard({
  tab,
  locale,
  buyLabel,
  index,
  showRank,
  purchasesLabel,
  showDetails = true,
}: TabCardProps) {
  const [hovered, setHovered] = useState(false);
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;

  const motionProps =
    index !== undefined
      ? {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { duration: 0.4, delay: index * 0.1 },
        }
      : {
          layout: true,
          initial: { opacity: 0, scale: 0.96 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.96 },
          transition: { duration: 0.2 },
        };

  return (
    <motion.div
      {...(motionProps as React.ComponentProps<typeof motion.div>)}
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Card className='overflow-hidden h-full flex flex-col border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors relative'>
        {showRank && (
          <div className='absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full'>
            #1
          </div>
        )}

        <div className='aspect-video relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900'>
          {tab.photo_url ? (
            <Image
              src={tab.photo_url}
              alt={title}
              fill
              className='object-cover'
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            />
          ) : (
            <div className='flex items-center justify-center w-full h-full'>
              <Music className='h-12 w-12 text-amber-400' strokeWidth={1} />
            </div>
          )}
        </div>

        <CardContent className='p-5 flex flex-col flex-1 gap-3'>
          <div className='flex items-start justify-between gap-2'>
            <MarqueeText
              text={title}
              className='font-semibold text-base leading-tight flex-1 min-w-0'
              isHovered={hovered}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full cursor-default ${getDifficultyColor(tab.difficulty)}`}
                >
                  {tab.difficulty}
                </span>
              </TooltipTrigger>
              <TooltipContent>Сложность: {tab.difficulty}</TooltipContent>
            </Tooltip>
          </div>

          {purchasesLabel && (
            <p className='text-xs text-muted-foreground'>{purchasesLabel}</p>
          )}

          {showDetails && (
            <>
              <MarqueeText
                text={description}
                className='text-sm text-muted-foreground flex-1 leading-relaxed'
                isHovered={hovered}
              />
              <div className='flex flex-wrap gap-1'>
                {(Object.keys(tab.files) as Array<keyof typeof tab.files>).map((fmt) => (
                  <span
                    key={fmt}
                    className='text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono uppercase'
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className='flex items-center justify-between mt-auto pt-3 border-t border-border'>
            <span className='text-lg font-bold'>{tab.price} ₽</span>
            <div className='flex items-center gap-2'>
              {tab.youtube_url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={tab.youtube_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer'
                      aria-label='Смотреть на YouTube'
                    >
                      <YouTubeIcon />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Смотреть видео аранжировки</TooltipContent>
                </Tooltip>
              )}
              <Button
                size='sm'
                className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5'
              >
                {buyLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
