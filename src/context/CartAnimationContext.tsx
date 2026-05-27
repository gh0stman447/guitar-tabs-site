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
  reverse?: boolean; // true = fly from cart to card (small image grows), false = fly to cart (card shrinks)
  cartWidth?: number; // stored cart button width for reverse animation
}

interface CartAnimationContextValue {
  flyToCart: (fromRect: DOMRect, sourceEl: HTMLElement) => void;
  flyFromCart: (toRect: DOMRect, sourceEl: HTMLElement) => void;
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
    if (typeof window === 'undefined') return;

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

    // Remove all tooltip elements and data-tooltip-id attributes from clone
    clone.querySelectorAll('[data-tooltip-id]').forEach((el) => {
      el.removeAttribute('data-tooltip-id');
      el.removeAttribute('data-tooltip-content');
      el.removeAttribute('data-tooltip-place');
    });
    clone.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());
    clone.querySelectorAll('.react-tooltip').forEach((el) => el.remove());

    const particle: FlyingParticle = {
      id: nextId++,
      fromRect,
      cloneEl: clone,
      targetX,
      targetY,
    };

    setParticles((prev) => [...prev, particle]);
  }, []);

  const flyFromCart = useCallback((toRect: DOMRect, sourceEl: HTMLElement) => {
    if (typeof window === 'undefined') return;

    let startX: number;
    let startY: number;
    const thumbSize = 48; // fixed thumbnail size

    if (cartButtonRef.current) {
      const btnRect = cartButtonRef.current.getBoundingClientRect();
      // Start from the TOP of the cart button (not center)
      startX = btnRect.left + btnRect.width / 2;
      startY = btnRect.top + 10; // slightly below top edge
    } else {
      startX = window.innerWidth - 88;
      startY = window.innerHeight - 100;
    }

    // Clone the whole card and scale it down with CSS transform
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.margin = '0';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.transformOrigin = 'center center';
    clone.style.transition = 'none';
    clone.style.animation = 'none';
    // Keep original size but we'll scale it down in the animation
    clone.style.width = toRect.width + 'px';
    clone.style.height = toRect.height + 'px';

    // Remove all tooltip elements and data-tooltip-id attributes from clone
    clone.querySelectorAll('[data-tooltip-id]').forEach((el) => {
      el.removeAttribute('data-tooltip-id');
      el.removeAttribute('data-tooltip-content');
      el.removeAttribute('data-tooltip-place');
    });
    clone.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());
    clone.querySelectorAll('.react-tooltip').forEach((el) => el.remove());

    const particle: FlyingParticle = {
      id: nextId++,
      fromRect: toRect,
      cloneEl: clone,
      targetX: startX,
      targetY: startY,
      reverse: true,
      cartWidth: thumbSize,
    };

    setParticles((prev) => [...prev, particle]);
  }, []);

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <CartAnimationContext.Provider value={{ flyToCart, flyFromCart, setCartButtonRef }}>
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
  const { fromRect, cloneEl, targetX, targetY, reverse, cartWidth } = particle;

  // For flyToCart: card flies from source to cart (shrinks)
  // For flyFromCart: small card thumbnail flies from cart down screen

  if (reverse) {
    // Fly FROM cart DOWN the screen in an arc - mini card version
    // Calculate scale to make card fit in thumbSize
    const originalWidth = fromRect.width;
    const targetThumbSize = cartWidth || 48;
    const startScale = targetThumbSize / originalWidth;
    const endScale = startScale * 1.3; // slightly larger at end

    // Start from cart button position
    const animStartX = targetX;
    const animStartY = targetY;

    // Fly down and to the left, off screen
    const animEndX = animStartX - 100; // move left a bit
    const animEndY = animStartY + 200; // fly down below cart

    // Arc: go UP first, then curve down
    const arcHeight = 120; // arc going upward initially
    const arcMidX = animStartX - 50; // move left during arc
    const arcMidY = animStartY - arcHeight;

    return (
      <motion.div
        initial={{ x: animStartX, y: animStartY, scale: startScale, opacity: 1, rotate: 0 }}
        animate={{
          x: [animStartX, arcMidX, animEndX],
          y: [animStartY, arcMidY, animEndY],
          scale: [startScale, startScale * 0.9, endScale],
          opacity: [1, 1, 0],
          rotate: [0, -15, -30],
        }}
        transition={{
          duration: 0.7,
          ease: [0.25, 0.46, 0.45, 0.94],
          times: [0, 0.4, 1],
        }}
        onAnimationComplete={onComplete}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          transformOrigin: 'center center',
        }}
        dangerouslySetInnerHTML={{ __html: cloneEl.outerHTML }}
      />
    );
  } else {
    // Fly TO cart - full card that shrinks into cart
    const startX = fromRect.left;
    const startY = fromRect.top;
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
}

export function useCartAnimation() {
  const ctx = useContext(CartAnimationContext);
  if (!ctx) throw new Error('useCartAnimation must be used within CartAnimationProvider');
  return ctx;
}
