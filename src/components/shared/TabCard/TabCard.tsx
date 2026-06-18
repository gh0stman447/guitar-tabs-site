'use client';

import { useState, useRef } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useIsTouch } from '@/hooks/useIsTouch';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, ShoppingCart, Check, Trash2, Eye, Headphones } from 'lucide-react';
import { MarqueeText } from '@/components/shared/MarqueeText';
import { BuyDialog } from '@/components/shared/BuyDialog';
import { TabPreviewDialog } from '@/components/shared/TabPreviewDialog';
import { AudioPlayerDialog } from '@/components/shared/AudioPlayerDialog';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
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
  index?: number;
  showRank?: boolean;
  purchasesLabel?: string;
  showDetails?: boolean;
  adminActions?: React.ReactNode;
  tooltipPrefix?: string;
  disableAnimations?: boolean;
}

export function TabCard({
  tab,
  locale,
  buyLabel,
  showRank,
  adminActions,
  purchasesLabel,
  showDetails = true,
  tooltipPrefix = '',
}: TabCardProps) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const isTouch = useIsTouch();
  const tp = tooltipPrefix ? `${tooltipPrefix}-` : '';
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem, removeItem, hasItem } = useCart();
  const inCart = hasItem(tab.id);
  const [cartHovered, setCartHovered] = useState(false);

  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;

  function handlePreviewClick() {
    setPreviewOpen(true);
  }

  return (
    <>
      <div ref={cardRef}>
        <Card className={`overflow-hidden h-full flex flex-col relative border-border`}>
          {showRank && (
            <div className='absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full'>
              #1
            </div>
          )}

          <div className='aspect-video relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900'>
            {tab.photo_url ? (
              <Image
                key={tab.id}
                src={tab.photo_url}
                alt={title}
                fill
                draggable={false}
                className='object-cover pointer-events-none'
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
              />
              <span
                data-tooltip-id={`diff-${tp}${tab.id}`}
                data-tooltip-content='Уровень сложности'
                className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full cursor-default ${getDifficultyColor(tab.difficulty)}`}
              >
                {tab.difficulty}
              </span>
              <ReactTooltip
                id={`diff-${tp}${tab.id}`}
                place='top'
                opacity={1}
                delayShow={isTouch ? 0 : 350}
                style={{ fontSize: 13 }}
              />
            </div>

            {purchasesLabel && <p className='text-xs text-muted-foreground'>{purchasesLabel}</p>}

            {showDetails && (
              <>
                <MarqueeText
                  text={description}
                  className='text-sm text-muted-foreground flex-1 leading-relaxed'
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
                {tab.files.pdf && (
                  <>
                    <Button
                      data-tooltip-id={`prev-${tp}${tab.id}`}
                      data-tooltip-content={locale === 'en' ? 'Preview' : 'Превью'}
                      size='sm'
                      variant='outline'
                      className={`rounded-full w-9 h-9 p-0 shrink-0 transition-colors bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent ${isTouch ? 'border-border text-foreground' : 'hover:border-amber-500 hover:text-amber-500'}`}
                      onClick={handlePreviewClick}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <ReactTooltip
                      id={`prev-${tp}${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={350}
                    />
                  </>
                )}
                {tab.youtube_url && (
                  <>
                    <a
                      data-tooltip-id={`yt-${tp}${tab.id}`}
                      data-tooltip-content={
                        locale === 'en' ? 'Watch arrangement video' : 'Смотреть видео аранжировки'
                      }
                      href={tab.youtube_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors cursor-pointer ${isTouch ? 'border-red-500 text-red-500' : 'border-border text-muted-foreground dark:text-foreground hover:border-red-500 hover:text-red-500'}`}
                      aria-label={locale === 'en' ? 'Watch on YouTube' : 'Смотреть на YouTube'}
                    >
                      <YouTubeIcon />
                    </a>
                    <ReactTooltip
                      id={`yt-${tp}${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={isTouch ? 0 : 350}
                    />
                  </>
                )}
                {!adminActions && (
                  <>
                    <Button
                      data-tooltip-id={`cart-${tp}${tab.id}`}
                      data-tooltip-content={
                        inCart
                          ? locale === 'en'
                            ? 'Remove from cart'
                            : 'Убрать из корзины'
                          : locale === 'en'
                            ? 'Add to cart'
                            : 'В корзину'
                      }
                      size='sm'
                      variant='outline'
                      className={`rounded-full w-9 h-9 p-0 shrink-0 ${
                        inCart
                          ? cartHovered
                            ? 'border-red-500 text-red-500'
                            : 'border-amber-500 text-amber-500'
                          : 'border-amber-500 text-amber-500 hover:border-amber-500 hover:text-amber-500'
                      }`}
                      onClick={() => {
                        if (inCart) {
                          removeItem(tab.id);
                          toast(title, {
                            description:
                              locale === 'en' ? 'Removed from cart' : 'Убрано из корзины',
                            icon: '🗑️',
                          });
                        } else {
                          addItem(tab);
                          toast(title, {
                            description: locale === 'en' ? 'Added to cart' : 'Добавлено в корзину',
                            icon: '🛒',
                          });
                        }
                      }}
                      onMouseEnter={() => setCartHovered(true)}
                      onMouseLeave={() => setCartHovered(false)}
                    >
                      {inCart ? (
                        cartHovered ? (
                          <Trash2 className='h-4 w-4' />
                        ) : (
                          <Check className='h-4 w-4' />
                        )
                      ) : (
                        <ShoppingCart className='h-4 w-4' />
                      )}
                    </Button>
                    <ReactTooltip
                      id={`cart-${tp}${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={isTouch ? 0 : 350}
                    />
                  </>
                )}
                {tab.files.mp3 && (
                  <>
                    <Button
                      data-tooltip-id={`audio-${tp}${tab.id}`}
                      data-tooltip-content={locale === 'en' ? 'Listen to audio' : 'Слушать аудио'}
                      size='sm'
                      variant='outline'
                      className={`rounded-full w-9 h-9 p-0 shrink-0 transition-colors bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent ${isTouch ? 'border-border text-foreground' : 'hover:border-amber-500 hover:text-amber-500'}`}
                      onClick={() => setAudioOpen(true)}
                    >
                      <Headphones className='h-4 w-4' />
                    </Button>
                    <ReactTooltip
                      id={`audio-${tp}${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={350}
                    />
                  </>
                )}
                {adminActions && <div className='flex gap-2'>{adminActions}</div>}
              </div>
            </div>

            {/* Buy button - full width, below price and action buttons (only for non-admin) */}
            {!adminActions && (
              <Button
                size='sm'
                className='w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full'
                onClick={() => setBuyOpen(true)}
              >
                {buyLabel}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <BuyDialog tab={tab} locale={locale} open={buyOpen} onOpenChange={setBuyOpen} />
      <TabPreviewDialog
        tab={tab}
        locale={locale}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onBuy={() => setBuyOpen(true)}
      />
      <AudioPlayerDialog tab={tab} locale={locale} open={audioOpen} onOpenChange={setAudioOpen} />
    </>
  );
}
