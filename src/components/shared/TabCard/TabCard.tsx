'use client';

import { useState, useRef } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useIsTouch } from '@/hooks/useIsTouch';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, ShoppingCart, Check, Trash2, Eye } from 'lucide-react';
import { MarqueeText } from '@/components/shared/MarqueeText';
import { BuyDialog } from '@/components/shared/BuyDialog';
import { TabPreviewDialog } from '@/components/shared/TabPreviewDialog';
import { useCart } from '@/context/CartContext';
import { useCartAnimation } from '@/context/CartAnimationContext';
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
  /** Анимация: задержка по индексу (для бестселлера) или layout (для каталога) */
  index?: number;
  /** Показать бейдж #1 */
  showRank?: boolean;
  /** Текст покупок под заголовком (для бестселлера) */
  purchasesLabel?: string;
  /** Показать форматы файлов и описание (для каталога) */
  showDetails?: boolean;
  /** Кнопки админа вместо кнопки "Купить" */
  adminActions?: React.ReactNode;
  /** Префикс для уникальности id тултипов (если компонент используется в нескольких секциях) */
  tooltipPrefix?: string;
}

export function TabCard({
  tab,
  locale,
  buyLabel,
  index,
  showRank,
  adminActions,
  purchasesLabel,
  showDetails = true,
  tooltipPrefix = '',
}: TabCardProps) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAvailable, setPreviewAvailable] = useState(!!tab.files.pdf);
  const isTouch = useIsTouch();
  const tp = tooltipPrefix ? `${tooltipPrefix}-` : '';
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem, removeItem, hasItem } = useCart();
  const { flyToCart } = useCartAnimation();
  const inCart = hasItem(tab.id);
  const [cartHovered, setCartHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isTouch) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    if (isTouch) return;
    mouseX.set(0);
    mouseY.set(0);
  }
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;

  const motionProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay: (index ?? 0) * 0.1 },
  };

  return (
    <>
      <div style={{ perspective: 1000 }}>
        <motion.div
          ref={cardRef}
          {...(motionProps as React.ComponentProps<typeof motion.div>)}
          style={isTouch ? {} : { rotateX, rotateY }}
          whileHover={isTouch ? {} : { y: -4 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
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
                  {previewAvailable && (
                    <>
                      <Button
                        data-tooltip-id={`prev-${tp}${tab.id}`}
                        data-tooltip-content={locale === 'en' ? 'Preview' : 'Превью'}
                        size='sm'
                        variant='outline'
                        className={`rounded-full w-9 h-9 p-0 shrink-0 transition-colors bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent ${isTouch ? 'border-border text-foreground' : 'hover:border-amber-500 hover:text-amber-500'}`}
                        onClick={() => setPreviewOpen(true)}
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
                        data-tooltip-content='Смотреть видео аранжировки'
                        href={tab.youtube_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors cursor-pointer ${isTouch ? 'border-red-500 text-red-500' : 'border-border text-muted-foreground dark:text-foreground hover:border-red-500 hover:text-red-500'}`}
                        aria-label='Смотреть на YouTube'
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
                        className={`rounded-full w-9 h-9 p-0 shrink-0 transition-colors bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent ${
                          inCart
                            ? cartHovered
                              ? 'border-red-500 text-red-500'
                              : 'border-amber-500 text-amber-500'
                            : isTouch
                              ? 'border-amber-500 text-amber-500'
                              : 'hover:border-amber-500 hover:text-amber-500'
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
                              description:
                                locale === 'en' ? 'Added to cart' : 'Добавлено в корзину',
                              icon: '🛒',
                            });
                            const el = cardRef.current;
                            if (el) flyToCart(el.getBoundingClientRect(), el);
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
                  {adminActions ?? (
                    <Button
                      size='sm'
                      className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5'
                      onClick={() => setBuyOpen(true)}
                    >
                      {buyLabel}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <BuyDialog tab={tab} locale={locale} open={buyOpen} onOpenChange={setBuyOpen} />
      <TabPreviewDialog
        tab={tab}
        locale={locale}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNotFound={() => setPreviewAvailable(false)}
      />
    </>
  );
}
