'use client';

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface FlyingParticle {
  id: number;
  fromRect: DOMRect;
  cloneEl: HTMLElement;
  targetX: number;
  targetY: number;
}

interface CartAnimationContextValue {
  flyToCart: (fromRect: DOMRect, sourceEl: HTMLElement) => void;
  setCartButtonRef: (el: HTMLButtonElement | null) => void;
}

const CartAnimationContext = createContext<CartAnimationContextValue | null>(null);

let nextId = 0;

export function CartAnimationProvider({ children }: { children: ReactNode }) {
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const [particles, setParticles] = useState<FlyingParticle[]>([]);

  const setCartButtonRef = useCallback((el: HTMLButtonElement | null) => {
    cartButtonRef.current = el;
  }, []);

  const flyToCart = useCallback((fromRect: DOMRect, sourceEl: HTMLElement) => {
    if (typeof window === 'undefined' || window.matchMedia('(hover: none)').matches) return;

    let targetX: number;
    let targetY: number;

    if (cartButtonRef.current) {
      const btnRect = cartButtonRef.current.getBoundingClientRect();
      targetX = btnRect.left + btnRect.width / 2;
      targetY = btnRect.top + btnRect.height / 2;
    } else {
      targetX = window.innerWidth - 88;
      targetY = window.innerHeight - 100;
    }

    // Clone the card element visually
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.width = `${fromRect.width}px`;
    clone.style.height = `${fromRect.height}px`;
    clone.style.margin = '0';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.transformOrigin = 'top left';
    // Remove hover/interactive effects
    clone.style.transition = 'none';
    clone.style.animation = 'none';

    const particle: FlyingParticle = {
      id: nextId++,
      fromRect,
      cloneEl: clone,
      targetX,
      targetY,
    };

    setParticles((prev) => [...prev, particle]);
  }, []);

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <CartAnimationContext.Provider value={{ flyToCart, setCartButtonRef }}>
      {children}
      {typeof window !== 'undefined' &&
        particles.length > 0 &&
        createPortal(
          <>
            {particles.map((particle) => (
              <FlyingParticleComponent
                key={particle.id}
                particle={particle}
                onComplete={() => removeParticle(particle.id)}
              />
            ))}
          </>,
          document.body,
        )}
    </CartAnimationContext.Provider>
  );
}

function FlyingParticleComponent({
  particle,
  onComplete,
}: {
  particle: FlyingParticle;
  onComplete: () => void;
}) {
  const { fromRect, cloneEl, targetX, targetY } = particle;

  const startX = fromRect.left;
  const startY = fromRect.top;

  // Target: center of FloatingCart button, offset by half card size scaled down
  const finalScale = 0.15;
  const endX = targetX - (fromRect.width * finalScale) / 2;
  const endY = targetY - (fromRect.height * finalScale) / 2;

  const arcMidY = startY - 120;
  const arcMidX = startX + (endX - startX) * 0.35;

  return (
    <motion.div
      initial={{ x: startX, y: startY, scale: 1, opacity: 1, rotate: 0 }}
      animate={{
        x: [startX, arcMidX, endX],
        y: [startY, arcMidY, endY],
        scale: [1, 0.7, finalScale],
        opacity: [1, 1, 0],
        rotate: [0, -5, 0],
      }}
      transition={{
        duration: 0.65,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.45, 1],
      }}
      onAnimationComplete={onComplete}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: fromRect.width,
        height: fromRect.height,
        pointerEvents: 'none',
        zIndex: 9999,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transformOrigin: 'top left',
      }}
      dangerouslySetInnerHTML={{ __html: cloneEl.outerHTML }}
    />
  );
}

export function useCartAnimation() {
  const ctx = useContext(CartAnimationContext);
  if (!ctx) throw new Error('useCartAnimation must be used within CartAnimationProvider');
  return ctx;
}
