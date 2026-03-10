'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCartAnimation } from '@/context/CartAnimationContext';
import { CartDrawer } from './CartDrawer';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

export function FloatingCart() {
  const locale = useLocale();
  const { count, total } = useCart();
  const { setCartButtonRef } = useCartAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [bump, setBump] = useState(false);

  // Register button DOM element so CartAnimationContext knows the exact target position
  useEffect(() => {
    setCartButtonRef(buttonRef.current);
    return () => setCartButtonRef(null);
  }, [setCartButtonRef]);

  // Show only when there's at least 1 item
  useEffect(() => {
    setVisible(count > 0);
  }, [count]);

  // Bump animation on count change
  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  const ru = locale !== 'en';

  return (
    <>
      <div
        className={cn(
          'hidden md:block fixed bottom-25 right-6 z-40 transition-all duration-500',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none',
        )}
      >
        <button
          ref={buttonRef}
          onClick={() => setOpen(true)}
          className={cn(
            'group relative flex items-center gap-3 rounded-2xl px-4 py-3',
            'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
            'hover:bg-amber-600 hover:shadow-amber-500/50 hover:shadow-xl',
            'active:scale-95 transition-all duration-200 cursor-pointer',
            bump && 'scale-110',
          )}
        >
          {/* Glow ring */}
          <span className='absolute inset-0 rounded-2xl ring-2 ring-amber-400/40 animate-pulse pointer-events-none' />

          <div className='relative'>
            <ShoppingCart className='h-5 w-5' />
            <span className='absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-white text-amber-500 text-[10px] font-bold leading-none'>
              {count}
            </span>
          </div>

          <div className='flex flex-col items-start leading-tight'>
            <span className='text-xs font-medium opacity-80'>{ru ? 'Корзина' : 'Cart'}</span>
            <span className='text-sm font-bold'>{total} ₽</span>
          </div>
        </button>
      </div>

      <CartDrawer open={open} onOpenChange={setOpen} locale={locale} />
    </>
  );
}
