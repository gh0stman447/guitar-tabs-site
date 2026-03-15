'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { motion, useAnimation } from 'framer-motion';
import { useIsTouch } from '@/hooks/useIsTouch';

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
  const [overflows, setOverflows] = useState(false);
  const isTouch = useIsTouch();
  const controls = useAnimation();
  const tooltipId = useId();

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

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className ?? ''}`}>
      <span ref={measureRef} className='absolute whitespace-nowrap invisible pointer-events-none'>
        {text}
      </span>

      {isTouch && overflows ? (
        <>
          <button
            data-tooltip-id={tooltipId}
            data-tooltip-content={text}
            className='block w-full text-left truncate cursor-pointer'
          >
            {text}
          </button>
          <ReactTooltip id={tooltipId} place='top' positionStrategy='fixed' openOnClick />
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
