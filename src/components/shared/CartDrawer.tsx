'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Trash, Trash2, Music, ShoppingCart } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useIsTouch } from '@/hooks/useIsTouch';
import { useDelayedRender } from '@/hooks/useDelayedRender';
import { useOrientation } from '@/hooks/useOrientation';
import { toast } from 'sonner';
import { CheckoutForm } from '@/components/shared/CheckoutForm';
import type { Tab } from '@/types';
import {
  DISCOUNT_TIER_1_MIN,
  DISCOUNT_TIER_1_RATE,
  DISCOUNT_TIER_2_MIN,
  DISCOUNT_TIER_2_RATE,
  TABLE_TABS,
} from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

function useAnimatedNumber(targetValue: number) {
  const motionValue = useMotionValue(targetValue);
  const springValue = useSpring(motionValue, {
    stiffness: 300,
    damping: 30,
  });
  const animatedValue = useTransform(springValue, (value) => Math.round(value));

  useEffect(() => {
    motionValue.set(targetValue);
  }, [motionValue, targetValue]);

  return animatedValue;
}

function AnimatedNumber({ value, disabled }: { value: number; disabled?: boolean }) {
  if (disabled) {
    return <span>{value}</span>;
  }
  return (
    <motion.span initial={false} animate={{ opacity: 1 }}>
      {value}
    </motion.span>
  );
}

export function CartDrawer({ open, onOpenChange, locale }: CartDrawerProps) {
  const { items, removeItem, clearCart, subtotal, discountRate, discount, total, testMode } =
    useCart();
  const ru = locale !== 'en';
  const isTouch = useIsTouch();
  const isLandscape = useOrientation();
  const [publishedCount, setPublishedCount] = useState(0);
  const tooltipsReady = useDelayedRender(0, open);
  const animatedTotal = useAnimatedNumber(total);
  const displayTotal = isTouch ? total : animatedTotal.get();

  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 768,
  );

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLandscapeMobile = isTouch && isLandscape;
  // Если высота меньше 760px - скроллим всю корзину, а не список товаров
  const isSmallHeight = viewportHeight < 760;

  useEffect(() => {
    supabase
      .from(TABLE_TABS)
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .then(({ count }) => setPublishedCount(count ?? 0));
  }, []);

  useEffect(() => {
    if (open && items.length === 0) {
      onOpenChange(false);
    }
  }, [items.length, open, onOpenChange]);

  // Блокировка скролла body при открытой горизонтальной корзине
  useEffect(() => {
    if (isLandscapeMobile && open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLandscapeMobile, open]);

  async function handleSubmit({
    firstname,
    email,
    newsletter,
  }: {
    firstname: string;
    email: string;
    newsletter: boolean;
  }) {
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tab_ids: items.map((t) => t.id),
        firstname,
        email,
        newsletter,
        test: testMode ?? false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? (ru ? 'Что-то пошло не так' : 'Something went wrong'));
    }

    clearCart();
    window.location.href = data.confirmation_url;
  }

  const renderContent = () => (
    <>
      {/* Header - одинаковый для всех */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-border shrink-0'>
        <div className='flex items-center gap-2'>
          <ShoppingCart className='h-5 w-5 text-primary' />
          <span className='font-semibold text-base'>{ru ? 'Корзина' : 'Cart'}</span>
          {items.length > 0 && (
            <span className='text-xs bg-white text-primary rounded-full px-2 py-0.5 font-semibold shadow-sm'>
              {items.length}
            </span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {items.length > 0 && (
            <button
              data-tooltip-id={!isTouch ? 'cart-clear-tooltip' : undefined}
              data-tooltip-content={ru ? 'Очистить корзину' : 'Clear cart'}
              onClick={() => {
                clearCart();
                toast(ru ? 'Корзина очищена' : 'Cart cleared', { icon: '🗑️' });
              }}
              className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer'
            >
              <Trash className='h-4 w-4' />
            </button>
          )}
          <button
            data-tooltip-id={!isTouch ? 'cart-close' : undefined}
            data-tooltip-content={ru ? 'Закрыть корзину' : 'Close cart'}
            onClick={() => onOpenChange(false)}
            className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors cursor-pointer'
          >
            <X className='h-4 w-4' />
          </button>
          {!isTouch && tooltipsReady && (
            <>
              <ReactTooltip id='cart-clear-tooltip' place='bottom' opacity={1} delayShow={350} />
              <ReactTooltip id='cart-close' place='bottom' opacity={1} delayShow={350} />
            </>
          )}
        </div>
      </div>

      {/* Основной контент - адаптивная сетка */}
      <div
        className={cn(
          'flex-1 min-h-0',
          isLandscapeMobile && items.length > 0 ? 'flex flex-row' : 'flex flex-col',
          isSmallHeight && 'overflow-y-auto',
        )}
      >
        {/* Список товаров */}
        <div
          className={cn(
            isSmallHeight ? 'overflow-visible' : 'overflow-y-auto',
            'flex-1',
            'min-w-0',
            isLandscapeMobile && 'overflow-auto',
          )}
        >
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6'>
              <ShoppingCart className='h-12 w-12 opacity-20' />
              <p className='text-sm'>{ru ? 'Корзина пуста' : 'Cart is empty'}</p>
            </div>
          ) : (
            <>
              <div className='flex flex-col divide-y divide-border'>
                {items.map((tab) => (
                  <CartItem
                    key={tab.id}
                    tab={tab}
                    locale={locale}
                    isTouch={isTouch}
                    onRemove={() => {
                      const title = locale === 'en' ? tab.title_en : tab.title_ru;
                      removeItem(tab.id);
                      toast(title, {
                        description: locale === 'en' ? 'Removed from cart' : 'Убрано из корзины',
                        icon: '🗑️',
                      });
                    }}
                  />
                ))}
              </div>

              {/* Discount hints */}
              <AnimatePresence mode='wait'>
                {items.length === DISCOUNT_TIER_1_MIN - 1 &&
                  publishedCount >= DISCOUNT_TIER_1_MIN && (
                    <motion.div
                      key={`tier1-${items.length}`}
                      initial={{ opacity: 0, scale: isTouch ? 1 : 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: isTouch ? 1 : 0.8 }}
                      transition={{ duration: isTouch ? 0 : 0.25 }}
                      className='mx-6 my-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm text-primary'
                    >
                      {ru
                        ? `Добавь ещё 1 таб и получи скидку ${DISCOUNT_TIER_1_RATE * 100}% 🎸`
                        : `Add 1 more tab and get ${DISCOUNT_TIER_1_RATE * 100}% off 🎸`}
                    </motion.div>
                  )}
                {items.length === DISCOUNT_TIER_2_MIN - 1 &&
                  publishedCount >= DISCOUNT_TIER_2_MIN && (
                    <motion.div
                      key={`tier2-${items.length}`}
                      initial={{ opacity: 0, scale: isTouch ? 1 : 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: isTouch ? 1 : 0.8 }}
                      transition={{ duration: isTouch ? 0 : 0.25 }}
                      className='mx-6 my-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm text-primary'
                    >
                      {ru
                        ? `Добавь ещё 1 таб, и скидка вырастет до ${DISCOUNT_TIER_2_RATE * 100}% 🎸`
                        : `Add 1 more tab and discount grows to ${DISCOUNT_TIER_2_RATE * 100}% 🎸`}
                    </motion.div>
                  )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Форма и итоги - адаптивная панель */}
        {items.length > 0 && (
          <div
            className={cn(
              'shrink-0 overflow-y-auto',
              isLandscapeMobile
                ? 'w-1/2 min-w-0 border-l border-border h-full'
                : 'border-t border-border',
            )}
          >
            <div
              className={cn(
                'flex flex-col gap-1 px-6 py-4',
                isLandscapeMobile && 'border-b border-border',
              )}
            >
              {discount > 0 && (
                <>
                  <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <span>{ru ? 'Сумма' : 'Subtotal'}</span>
                    <span>{subtotal} ₽</span>
                  </div>
                  <div className='flex items-center justify-between text-sm text-green-600 dark:text-green-400'>
                    <span>
                      {ru ? `Скидка ${discountRate * 100}%` : `Discount ${discountRate * 100}%`}
                    </span>
                    <span>−{discount} ₽</span>
                  </div>
                </>
              )}
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>{ru ? 'Итого' : 'Total'}</span>
                <span className='text-xl font-bold tabular-nums'>
                  <AnimatedNumber value={displayTotal} disabled={isTouch} /> ₽
                </span>
              </div>
            </div>

            <div
              className={cn(
                'px-6 pb-6 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0',
                isLandscapeMobile && 'pt-4',
              )}
            >
              <p className='text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest'>
                {ru ? 'Данные для отправки' : 'Your details'}
              </p>
              <CheckoutForm
                key={open ? 'open' : 'closed'}
                locale={locale}
                price={total}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Горизонтальный режим — используем отдельный контейнер (Sheet не умеет в fullscreen без костылей)
  if (isLandscapeMobile && open) {
    return <div className='fixed inset-0 z-50 bg-background flex flex-col'>{renderContent()}</div>;
  }

  // Вертикальный режим — используем Sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        showCloseButton={false}
        aria-describedby={undefined}
        className={cn(
          'w-full sm:max-w-md flex flex-col p-0',
          isSmallHeight ? 'h-auto max-h-full' : 'h-full overflow-hidden',
        )}
      >
        <SheetTitle className='sr-only'>{ru ? 'Корзина' : 'Cart'}</SheetTitle>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}

function CartItem({
  tab,
  locale,
  onRemove,
  isTouch,
}: {
  tab: Tab;
  locale: string;
  onRemove: () => void;
  isTouch: boolean;
}) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const tooltipId = `cart-item-remove-${tab.id}`;

  return (
    <>
      <motion.div
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className='flex items-center gap-3 px-6 py-4'
      >
        <div className='relative w-14 h-14 rounded-md overflow-hidden bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/50 dark:to-zinc-800 shrink-0'>
          {tab.photo_url ? (
            <Image
              src={tab.photo_url}
              alt={title}
              fill
              className='object-cover'
              sizes='56px'
              draggable={false}
              unoptimized
            />
          ) : (
            <div className='flex items-center justify-center w-full h-full'>
              <Music className='h-6 w-6 text-amber-400' strokeWidth={1} />
            </div>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium truncate'>{title}</p>
          <p className='text-sm text-primary dark:text-white font-semibold'>{tab.price} ₽</p>
        </div>
        {!isTouch && (
          <>
            <button
              data-tooltip-id={tooltipId}
              data-tooltip-content={locale === 'en' ? 'Remove from cart' : 'Убрать из корзины'}
              onClick={onRemove}
              className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shrink-0'
            >
              <Trash2 className='h-4 w-4' />
            </button>
            <ReactTooltip id={tooltipId} place='bottom' opacity={1} delayShow={350} />
          </>
        )}
        {isTouch && (
          <button
            onClick={onRemove}
            className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shrink-0'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        )}
      </motion.div>
    </>
  );
}
