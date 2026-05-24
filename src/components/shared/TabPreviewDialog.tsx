'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Tab } from '@/types';

interface TabPreviewDialogProps {
  tab: Tab;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy?: () => void;
}

export function TabPreviewDialog({
  tab,
  locale,
  open,
  onOpenChange,
  onBuy,
}: TabPreviewDialogProps) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<import('pdfjs-dist/types/src/display/api').PDFPageProxy | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userScrolledRef = useRef(false);
  const [loading, setLoading] = useState(true);

  function renderPage(containerWidth: number) {
    const page = pageRef.current;
    const canvas = canvasRef.current;
    if (!page || !canvas) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: 1 });
    const scale = (containerWidth / viewport.width) * dpr;
    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${scaledViewport.height / dpr}px`;
    const ctx = canvas.getContext('2d')!;
    page.render({ canvasContext: ctx, viewport: scaledViewport });
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const response = await fetch(`/api/tabs/${tab.id}/preview?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          onOpenChange(false);
          toast.error(
            locale === 'en'
              ? 'Failed to load preview. Try again.'
              : 'Не удалось загрузить превью. Попробуйте ещё раз.',
          );
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        if (cancelled) return;

        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas not available');

        pageRef.current = page;
        renderPage(canvas.parentElement?.clientWidth ?? 600);
      } catch (e) {
        console.error('[TabPreview] render error:', e);
        if (!cancelled) {
          onOpenChange(false);
          toast.error(
            locale === 'en'
              ? 'Failed to load preview. Try again.'
              : 'Не удалось загрузить превью. Попробуйте ещё раз.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      pageRef.current = null;
    };
  }, [open, tab.id, locale, onOpenChange]);

  useEffect(() => {
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;

    userScrolledRef.current = false;

    function onUserScroll() {
      userScrolledRef.current = true;
      stopAutoScroll();
    }

    function stopAutoScroll() {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
      el?.removeEventListener('wheel', onUserScroll);
      el?.removeEventListener('touchstart', onUserScroll);
    }

    el.addEventListener('wheel', onUserScroll, { passive: true });
    el.addEventListener('touchstart', onUserScroll, { passive: true });

    const startDelay = setTimeout(() => {
      if (userScrolledRef.current) return;
      autoScrollRef.current = setInterval(() => {
        if (!el || userScrolledRef.current) {
          stopAutoScroll();
          return;
        }
        el.scrollBy({ top: 1, behavior: 'instant' });
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          stopAutoScroll();
        }
      }, 10);
    }, 1000);

    return () => {
      clearTimeout(startDelay);
      stopAutoScroll();
    };
  }, [loading]);

  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        renderPage(canvas.parentElement?.clientWidth ?? 600);
      }, 150);
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-2xl w-full p-0 gap-0 overflow-hidden flex flex-col'
        style={{ maxHeight: '90dvh' }}
        showCloseButton={false}
      >
        <DialogHeader
          style={{ backgroundColor: isDark ? undefined : 'rgba(68,77,86,0.1)' }}
          className='px-6 pt-4 pb-4 flex flex-row items-center justify-between shrink-0'
        >
          <DialogTitle className='text-base font-semibold'>{title}</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className='rounded-full w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer'
          >
            <X className='h-4 w-4' />
          </button>
        </DialogHeader>

        {/* Канвас — скролл если не помещается */}
        <div
          ref={scrollRef}
          className='overflow-y-auto overflow-x-hidden min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--color-zinc-400)_transparent] dark:[scrollbar-color:var(--color-zinc-600)_transparent]'
        >
          <div
            className='relative'
            style={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              aspectRatio: loading ? '1 / 1.414' : undefined,
            }}
          >
            {/* Спиннер поверх canvas пока грузится */}
            {loading && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-amber-500' />
              </div>
            )}

            {/* Canvas — всегда в DOM чтобы ref работал */}
            <div
              className='relative transition-opacity duration-500'
              style={{ opacity: loading ? 0 : 1 }}
            >
              <canvas ref={canvasRef} className='w-full block' />

              <div
                className='absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-8 gap-1.5 pointer-events-none'
                style={{ height: '55%' }}
              >
                <p className='text-sm font-medium text-zinc-800'>
                  {locale === 'en' ? 'First page only' : 'Только первая страница'}
                </p>
                {onBuy ? (
                  <p className='text-xs text-zinc-600'>
                    <button
                      className='text-amber-500 pointer-events-auto cursor-pointer hover:scale-105 transition-transform inline-block'
                      onClick={() => {
                        onOpenChange(false);
                        onBuy();
                      }}
                    >
                      {locale === 'en' ? 'Buy the tab' : 'Купите таб'}
                    </button>
                    {locale === 'en' ? ' to get the full file' : ', чтобы получить полный файл'}
                  </p>
                ) : (
                  <p className='text-xs text-zinc-600'>
                    {locale === 'en'
                      ? 'Buy the tab to get the full file'
                      : 'Купите таб, чтобы получить полный файл'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
