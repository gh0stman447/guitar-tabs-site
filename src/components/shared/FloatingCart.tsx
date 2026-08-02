'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useMotionValue, useSpring, useTransform, useAnimation } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCartAnimation } from '@/context/CartAnimationContext';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useIsTouch } from '@/hooks/useIsTouch';

const CartDrawer = dynamic(
  () => import('./CartDrawer').then((module) => module.CartDrawer),
  { ssr: false },
);

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

export function FloatingCart() {
  const locale = useLocale();
  const { count, total } = useCart();
  const { setCartButtonRef } = useCartAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const isTouch = useIsTouch();
  const animatedTotal = useAnimatedNumber(total);
  const [displayTotal, setDisplayTotal] = useState(total);

  // Анимация bump
  const controls = useAnimation();

  // Обновляем отображаемую сумму из animatedTotal
  useEffect(() => {
    const unsubscribe = animatedTotal.on('change', (value) => {
      setDisplayTotal(value);
    });
    return unsubscribe;
  }, [animatedTotal]);

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
    controls.start({
      scale: [1, 1.6, 1],
      transition: { duration: 0.3, ease: 'easeOut' },
    });
  }, [count, controls]);

  const ru = locale !== 'en';

  return (
    <>
      <motion.div
        className={cn(
          'fixed bottom-25 right-6 z-40 transition-all duration-500',
          isTouch && 'hidden',
        )}
        initial={false}
        animate={visible ? 'visible' : 'hidden'}
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: 25, opacity: 0 },
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <motion.button
          ref={buttonRef}
          onClick={() => setOpen(true)}
          className={cn(
            'group relative flex items-center gap-3 rounded-2xl px-4 py-3',
            'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
            'hover:bg-primary/90 hover:shadow-primary/40 hover:shadow-xl',
            'active:scale-95 transition-all duration-200 cursor-pointer',
          )}
          initial={{ scale: 1 }}
          animate={controls}
        >
          {/* Glow ring */}
          <motion.span
            className='absolute inset-0 rounded-2xl ring-2 ring-primary-foreground/25 pointer-events-none'
            animate={count > 0 ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.4 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className='relative'
            key={count}
            initial={{ rotate: 0, scale: 1 }}
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.4 }}
          >
            <ShoppingCart className='h-5 w-5' />
            <span className='absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-md bg-foreground px-1 text-[10px] font-bold leading-none text-background shadow-sm'>
              {count}
            </span>
          </motion.div>

          <div className='flex flex-col items-start leading-tight'>
            <span className='text-xs font-medium opacity-80'>{ru ? 'Корзина' : 'Cart'}</span>
            <motion.span
              className='text-sm font-bold tabular-nums'
              animate={total !== displayTotal ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {displayTotal} ₽
            </motion.span>
          </div>
        </motion.button>
      </motion.div>

      {open && <CartDrawer open onOpenChange={setOpen} locale={locale} />}
    </>
  );
}
