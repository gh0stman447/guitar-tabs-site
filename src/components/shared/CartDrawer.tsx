'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Trash2, Music, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { CheckoutForm } from '@/components/shared/CheckoutForm';
import type { Tab } from '@/types';
import { DISCOUNT_TIER_1_MIN, DISCOUNT_TIER_1_RATE, DISCOUNT_TIER_2_MIN, DISCOUNT_TIER_2_RATE, TABLE_TABS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export function CartDrawer({ open, onOpenChange, locale }: CartDrawerProps) {
  const { items, removeItem, clearCart, subtotal, discountRate, discount, total, testMode } =
    useCart();
  const ru = locale !== 'en';
  const [publishedCount, setPublishedCount] = useState(0);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        showCloseButton={false}
        aria-describedby={undefined}
        className='w-full sm:max-w-md flex flex-col p-0'
      >
        <SheetTitle className='sr-only'>{ru ? 'Корзина' : 'Cart'}</SheetTitle>

        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5 text-amber-500' />
            <span className='font-semibold text-base'>{ru ? 'Корзина' : 'Cart'}</span>
            {items.length > 0 && (
              <span className='text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-medium'>
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors cursor-pointer'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='flex flex-col flex-1 overflow-y-auto'>
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground px-6'>
              <ShoppingCart className='h-12 w-12 opacity-20' />
              <p className='text-sm'>{ru ? 'Корзина пуста' : 'Cart is empty'}</p>
            </div>
          ) : (
            <>
              {/* Items list */}
              <div className='flex flex-col gap-0 divide-y divide-border'>
                {items.map((tab) => (
                  <CartItem
                    key={tab.id}
                    tab={tab}
                    locale={locale}
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

              {/* Discount hint */}
              {items.length === DISCOUNT_TIER_1_MIN - 1 && publishedCount >= DISCOUNT_TIER_1_MIN && (
                <div className='mx-6 my-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400'>
                  {ru
                    ? `Добавь ещё 1 таб и получи скидку ${DISCOUNT_TIER_1_RATE * 100}% 🎸`
                    : `Add 1 more tab and get ${DISCOUNT_TIER_1_RATE * 100}% off 🎸`}
                </div>
              )}
              {items.length === DISCOUNT_TIER_2_MIN - 1 && publishedCount >= DISCOUNT_TIER_2_MIN && (
                <div className='mx-6 my-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400'>
                  {ru
                    ? `Добавь ещё 1 таб, и скидка вырастет до ${DISCOUNT_TIER_2_RATE * 100}% 🎸`
                    : `Add 1 more tab and discount grows to ${DISCOUNT_TIER_2_RATE * 100}% 🎸`}
                </div>
              )}

              {/* Total */}
              <div className='flex flex-col gap-1 px-6 py-4 border-t border-border mt-auto'>
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
                  <span className='text-xl font-bold'>{total} ₽</span>
                </div>
              </div>

              {/* Form */}
              <div className='px-6 pb-6 flex flex-col gap-4'>
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CartItem({ tab, locale, onRemove }: { tab: Tab; locale: string; onRemove: () => void }) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;

  return (
    <div className='flex items-center gap-3 px-6 py-4'>
      <div className='relative w-14 h-14 rounded-md overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900 shrink-0'>
        {tab.photo_url ? (
          <Image src={tab.photo_url} alt={title} fill className='object-cover' sizes='56px' />
        ) : (
          <div className='flex items-center justify-center w-full h-full'>
            <Music className='h-6 w-6 text-amber-400' strokeWidth={1} />
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{title}</p>
        <p className='text-sm text-amber-500 font-semibold'>{tab.price} ₽</p>
      </div>
      <button
        onClick={onRemove}
        className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shrink-0'
      >
        <Trash2 className='h-4 w-4' />
      </button>
    </div>
  );
}
