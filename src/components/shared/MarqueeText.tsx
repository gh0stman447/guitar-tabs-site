'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimation } from 'framer-motion';

export function MarqueeText({
  text,
  className,
  isHovered,
}: {
  text: string;
  className?: string;
  isHovered?: boolean;
}) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [isTouch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(hover: none)').matches : false,
  );
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, width: 0 });
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
  );
  const controls = useAnimation();

  useEffect(() => {
    const measure = measureRef.current;
    const container = containerRef.current;
    if (!measure || !container) return;

    const check = () => setOverflows(measure.scrollWidth > container.clientWidth);
    check();

    const ro = new ResizeObserver(check);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text]);

  useEffect(() => {
    if (isTouch || !overflows) return;
    if (isHovered) {
      controls.start({
        x: '-50%',
        transition: { duration: 5, ease: 'linear', repeat: Infinity, repeatType: 'loop' },
      });
    } else {
      controls.stop();
      controls.set({ x: 0 });
    }
  }, [isHovered, overflows, isTouch, controls]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!tooltipOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setTooltipOpen(false);
      }
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [tooltipOpen]);

  function handleTap() {
    if (!tooltipOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setTooltipOpen((v) => !v);
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className ?? ''}`}>
      <span ref={measureRef} className='absolute whitespace-nowrap invisible pointer-events-none'>
        {text}
      </span>

      {isTouch && overflows ? (
        <>
          <button
            ref={buttonRef}
            className='block w-full text-left truncate cursor-pointer'
            onClick={handleTap}
          >
            {text}
          </button>
          {tooltipOpen &&
            createPortal(
              <div
                style={{
                  position: 'absolute',
                  top: tooltipPos.top - 8,
                  left: tooltipPos.left,
                  width: tooltipPos.width,
                  transform: 'translateY(-100%)',
                  zIndex: 9999,
                }}
                className={`px-3 py-2 rounded-lg text-xs shadow-xl border whitespace-normal ${isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-200'}`}
              >
                {text}
              </div>,
              document.body,
            )}
        </>
      ) : overflows && !isTouch ? (
        <motion.span className='block whitespace-nowrap' animate={controls} initial={{ x: 0 }}>
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </motion.span>
      ) : (
        <span className='block truncate'>{text}</span>
      )}
    </div>
  );
}
