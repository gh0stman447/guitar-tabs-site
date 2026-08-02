'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Download, Loader2, X } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsTouch } from '@/hooks/useIsTouch';
import { useDelayedRender } from '@/hooks/useDelayedRender';
import type { Tab } from '@/types';
import { motion } from 'framer-motion';
import { reachGoal } from '@/lib/yandex-metrika';

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
  const isTouch = useIsTouch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<import('pdfjs-dist/types/src/display/api').PDFPageProxy | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userScrolledRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const tooltipsReady = useDelayedRender(0, open);

  // Yandex Metrika: view tab preview
  useEffect(() => {
    if (open) {
      reachGoal('view_tab', {
        tab_id: tab.id,
        title,
      });
    }
  }, [open, tab.id, title]);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress(0);

    // Animate progress from 0 to 100%
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 100);

    try {
      const response = await fetch(`/api/tabs/${tab.id}/preview?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to download');
      const blob = await response.blob();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = title.replace(/\s+/g, '_');
      a.download = `${safeTitle}_preview.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 500);
    } catch (e) {
      clearInterval(progressInterval);
      setDownloading(false);
      setDownloadProgress(0);
      console.error('[TabPreview] download error:', e);
      toast.error(
        locale === 'en'
          ? 'Failed to download preview. Try again.'
          : 'Не удалось скачать превью. Попробуйте ещё раз.',
      );
    }
  }

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
        className='max-w-2xl w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden flex flex-col'
        style={{ maxHeight: '90dvh' }}
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader
          style={{ backgroundColor: isDark ? undefined : 'rgba(68,77,86,0.1)' }}
          className='flex-row! items-center justify-between gap-2 px-6 pb-4 pt-4 text-left! shrink-0'
        >
          <DialogTitle className='min-w-0 flex-1 truncate text-left! text-sm font-medium sm:text-base sm:font-semibold'>
            {title}
          </DialogTitle>
          {!isTouch ? (
            <div className='flex items-center gap-1'>
              <div className='relative'>
                <button
                  data-tooltip-id='preview-download'
                  data-tooltip-content={locale === 'en' ? 'Download preview' : 'Скачать превью'}
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`rounded-full w-7 h-7 flex items-center justify-center transition-colors ${
                    downloading
                      ? 'text-amber-500 cursor-not-allowed'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary dark:hover:text-primary-foreground cursor-pointer'
                  }`}
                >
                  <Download className={`h-4 w-4 ${downloading ? 'opacity-50' : ''}`} />
                </button>
                {/* Circular progress */}
                {downloading && (
                  <svg
                    className='absolute inset-0 w-7 h-7 -rotate-90 pointer-events-none'
                    viewBox='0 0 28 28'
                  >
                    <circle
                      cx='14'
                      cy='14'
                      r='12'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='text-zinc-200 dark:text-zinc-700'
                    />
                    <motion.circle
                      cx='14'
                      cy='14'
                      r='12'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      className='text-amber-500'
                      strokeDasharray={75.4}
                      strokeDashoffset={75.4}
                      animate={{
                        strokeDashoffset: 75.4 - (downloadProgress / 100) * 75.4,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  </svg>
                )}
              </div>
              {tooltipsReady && !downloading && (
                <ReactTooltip
                  id='preview-download'
                  place='bottom'
                  opacity={1}
                  delayShow={350}
                  style={{ fontSize: 13 }}
                />
              )}
              <button
                data-tooltip-id='preview-close'
                data-tooltip-content={locale === 'en' ? 'Close' : 'Закрыть'}
                onClick={() => onOpenChange(false)}
                className='rounded-full w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer'
              >
                <X className='h-4 w-4' />
              </button>
              <ReactTooltip
                id='preview-close'
                place='bottom'
                opacity={1}
                delayShow={350}
                style={{ fontSize: 13 }}
              />
            </div>
          ) : (
            <div className='flex items-center gap-1'>
              <div className='relative'>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`rounded-full w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
                    downloading
                      ? 'text-amber-500'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <Download className={`h-4 w-4 ${downloading ? 'opacity-50' : ''}`} />
                </button>
                {/* Circular progress */}
                {downloading && (
                  <svg
                    className='absolute inset-0 w-7 h-7 -rotate-90 pointer-events-none'
                    viewBox='0 0 28 28'
                  >
                    <circle
                      cx='14'
                      cy='14'
                      r='12'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      className='text-zinc-200 dark:text-zinc-700'
                    />
                    <motion.circle
                      cx='14'
                      cy='14'
                      r='12'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      className='text-amber-500'
                      strokeDasharray={75.4}
                      strokeDashoffset={75.4}
                      animate={{
                        strokeDashoffset: 75.4 - (downloadProgress / 100) * 75.4,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  </svg>
                )}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className='rounded-full w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          )}
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
