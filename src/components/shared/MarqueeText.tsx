'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useIsTouch } from '@/hooks/useIsTouch';

export function MarqueeText({ text, className }: { text: string; className?: string }) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const isTouch = useIsTouch();
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

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className ?? ''}`}>
      <span ref={measureRef} className='absolute whitespace-nowrap invisible pointer-events-none'>
        {text}
      </span>

      {overflows ? (
        <>
          <button
            data-tooltip-id={tooltipId}
            data-tooltip-content={text}
            className='block w-full text-left truncate cursor-default'
          >
            {text}
          </button>
          <ReactTooltip
            id={tooltipId}
            place='top'
            positionStrategy='fixed'
            openOnClick={isTouch}
            opacity={1}
            delayShow={isTouch ? 0 : 350}
            style={{ maxWidth: 280, whiteSpace: 'normal', wordBreak: 'break-word' }}
          />
        </>
      ) : (
        <span className='block truncate'>{text}</span>
      )}
    </div>
  );
}
