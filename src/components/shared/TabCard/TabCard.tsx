'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Check, Download, Music, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarqueeText } from '@/components/shared/MarqueeText';
import { FreeDownloadMenu } from '@/components/shared/FreeDownloadMenu';
import { useCart } from '@/context/CartContext';
import { useCartAnimation } from '@/context/CartAnimationContext';
import { useIsTouch } from '@/hooks/useIsTouch';
import type { Tab } from '@/types';

const BuyDialog = dynamic(
  () => import('@/components/shared/BuyDialog').then((module) => module.BuyDialog),
  { ssr: false },
);

function getDifficultyColor(difficulty: string) {
  const num = parseInt(difficulty);
  if (num <= 3) return 'border-green-500 text-green-700 dark:text-green-300 bg-green-100/90 dark:bg-green-950/80';
  if (num <= 6) return 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80';
  return 'border-red-500 text-red-700 dark:text-red-300 bg-red-100/90 dark:bg-red-950/80';
}

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
  sectionPrefix?: string;
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
  disableAnimations = false,
}: TabCardProps) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [cartHovered, setCartHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const animationsDisabled = disableAnimations || isTouch;
  const { addItem, removeItem, hasItem } = useCart();
  const { flyToCart, flyFromCart } = useCartAnimation();
  const inCart = hasItem(tab.id);
  const tp = tooltipPrefix ? `${tooltipPrefix}-` : '';
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;
  const formats = (Object.entries(tab.files) as Array<[keyof typeof tab.files, boolean | undefined]>)
    .filter(([, available]) => available)
    .map(([format]) => format.toUpperCase());
  const isFree = tab.price <= 0;
  const showDownloadCount = isFree && typeof tab.download_count === 'number';
  const activityLabel = isFree
    ? showDownloadCount
      ? locale === 'en'
        ? `Downloads: ${tab.download_count}`
        : `Скачиваний: ${tab.download_count}`
      : null
    : purchasesLabel ??
      (locale === 'en'
        ? `Purchases: ${tab.purchase_count ?? 0}`
        : `Покупок: ${tab.purchase_count ?? 0}`);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (animationsDisabled) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    if (animationsDisabled) return;
    mouseX.set(0);
    mouseY.set(0);
  }

  function handleCartClick() {
    const element = cardRef.current;

    if (inCart) {
      removeItem(tab.id);
      toast(title, {
        description: locale === 'en' ? 'Removed from cart' : 'Убрано из корзины',
        icon: '🗑️',
      });
      if (!animationsDisabled && element) {
        flyFromCart(element.getBoundingClientRect(), element);
      }
      return;
    }

    addItem(tab);
    toast(title, {
      description: locale === 'en' ? 'Added to cart' : 'Добавлено в корзину',
      icon: '🛒',
    });
    if (!animationsDisabled && element) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 650);
      flyToCart(element.getBoundingClientRect(), element);
    }
  }

  return (
    <>
      <div
        className='w-full max-w-[22rem] mx-auto sm:max-w-none'
        style={animationsDisabled ? undefined : { perspective: 1000 }}
      >
        <motion.div
          ref={cardRef}
          className={animationsDisabled ? 'touch-pan-y' : undefined}
          style={animationsDisabled ? undefined : { rotateX, rotateY }}
          whileHover={animationsDisabled ? undefined : { y: -4 }}
          onMouseMove={animationsDisabled ? undefined : handleMouseMove}
          onMouseLeave={animationsDisabled ? undefined : handleMouseLeave}
        >
          <Card
            className={`overflow-hidden h-full flex flex-col gap-0 py-0 relative transition-[border-color,box-shadow] duration-500 ${
              justAdded && !adminActions
                ? 'border-amber-500/70 shadow-[0_0_18px_4px_rgba(245,158,11,0.48)]'
                : inCart && !adminActions
                  ? 'border-amber-500/45 shadow-[0_0_14px_2px_rgba(245,158,11,0.24)]'
                  : 'border-border hover:border-primary/45'
            }`}
          >
            <div
              className='protected-image aspect-video relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900'
              onContextMenu={(event) => event.preventDefault()}
            >
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
              <div
                aria-hidden
                className='absolute inset-0 z-[5]'
                onContextMenu={(event) => event.preventDefault()}
              />

              {showRank && (
                <div className='absolute top-3 left-3 z-10 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground shadow-sm'>
                  #1
                </div>
              )}

              {!adminActions && (
                <div className='absolute right-4 top-4 z-10 isolate rotate-[-2deg]'>
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 120 44'
                    preserveAspectRatio='none'
                    className='pointer-events-none absolute -inset-x-5 -inset-y-3 -z-10 h-[calc(100%+1.5rem)] w-[calc(100%+2.5rem)] overflow-visible text-amber-500'
                  >
                    <path
                      d='M8 12 C30 11 52 7 83 8'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='9'
                      strokeLinecap='round'
                    />
                    <path
                      d='M18 21 C42 14 72 11 108 13'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='10'
                      strokeLinecap='round'
                    />
                    <path
                      d='M11 31 C39 24 69 19 101 22'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='10'
                      strokeLinecap='round'
                    />
                    <path
                      d='M28 38 C52 31 76 28 111 29'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='8'
                      strokeLinecap='round'
                    />
                  </svg>
                  <span className='relative inline-block -translate-y-1 whitespace-nowrap text-base font-black tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45),0_0_7px_rgba(255,255,255,0.38)]'>
                    {isFree ? (locale === 'en' ? 'Free' : 'Бесплатно') : `${tab.price} ₽`}
                  </span>
                </div>
              )}

            </div>

            <CardContent className='p-4 sm:p-5 flex flex-col flex-1 gap-2.5 sm:gap-3'>
              <div className='flex items-start justify-between gap-2'>
                <MarqueeText
                  text={title}
                  className='font-semibold text-sm sm:text-base leading-tight flex-1 min-w-0'
                />
                <span
                  data-tooltip-id={`diff-${tp}${tab.id}`}
                  data-tooltip-content={locale === 'en' ? 'Difficulty level' : 'Уровень сложности'}
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold cursor-default ${getDifficultyColor(tab.difficulty)}`}
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
              {adminActions && showDetails ? (
                <>
                  <MarqueeText
                    text={description}
                    className='text-[13px] sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed'
                  />
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex flex-wrap gap-1.5'>
                      {formats.map((format) => (
                        <span
                          key={format}
                          className='rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground/70'
                        >
                          {format}
                        </span>
                      ))}
                    </div>
                    {activityLabel && (
                      <p className='flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground'>
                        {isFree ? (
                          <Download className='h-3 w-3' />
                        ) : (
                          <ShoppingBag className='h-3 w-3' />
                        )}
                        {activityLabel}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className='flex items-center justify-between gap-2'>
                  <p className='min-w-0 text-[11px] font-medium tracking-[0.12em] text-muted-foreground'>
                    {formats.join(' · ')}
                  </p>
                  {activityLabel && (
                    <p className='flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground'>
                      {isFree ? (
                        <Download className='h-3 w-3' />
                      ) : (
                        <ShoppingBag className='h-3 w-3' />
                      )}
                      {activityLabel}
                    </p>
                  )}
                </div>
              )}

              <div className='h-px bg-border mt-auto' />

              {adminActions ? (
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-base sm:text-lg font-bold'>
                    {isFree ? (locale === 'en' ? 'Free' : 'Бесплатно') : `${tab.price} ₽`}
                  </span>
                  <div className='flex gap-2'>{adminActions}</div>
                </div>
              ) : (
                <div
                  className={`grid gap-2 ${
                    isFree ? 'grid-cols-2' : 'grid-cols-[2rem_1fr_1fr]'
                  }`}
                >
                  {!isFree && (
                    <>
                      <button
                        type='button'
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
                        aria-label={
                          inCart
                            ? locale === 'en'
                              ? 'Remove from cart'
                              : 'Убрать из корзины'
                            : locale === 'en'
                              ? 'Add to cart'
                              : 'Добавить в корзину'
                        }
                        className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition-all cursor-pointer ${
                          inCart
                            ? cartHovered
                              ? 'border-red-500 bg-red-500/10 text-red-500'
                              : 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                        } ${justAdded ? 'ring-2 ring-primary/30' : ''}`}
                        onClick={handleCartClick}
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
                      </button>
                      <ReactTooltip
                        id={`cart-${tp}${tab.id}`}
                        place='top'
                        hidden={isTouch}
                        opacity={1}
                        delayShow={350}
                      />
                    </>
                  )}
                  <Button
                    asChild
                    size='sm'
                    variant='outline'
                    className='w-full rounded-full bg-transparent hover:bg-muted/70'
                  >
                    <Link href={`/${locale}/tabs/${tab.id}`} prefetch={false}>
                      {locale === 'en' ? 'Details' : 'Подробнее'}
                    </Link>
                  </Button>
                  {isFree ? (
                    <FreeDownloadMenu tab={tab} locale={locale} compact />
                  ) : (
                    <Button
                      size='sm'
                      className='w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
                      onClick={() => setBuyOpen(true)}
                    >
                      {buyLabel}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!adminActions && !isFree && buyOpen && (
        <BuyDialog tab={tab} locale={locale} open={buyOpen} onOpenChange={setBuyOpen} />
      )}
    </>
  );
}
