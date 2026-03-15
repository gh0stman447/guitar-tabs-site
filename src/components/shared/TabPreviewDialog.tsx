'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Tab } from '@/types';

interface TabPreviewDialogProps {
  tab: Tab;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotFound?: () => void;
}

export function TabPreviewDialog({ tab, locale, open, onOpenChange, onNotFound }: TabPreviewDialogProps) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const response = await fetch(`/api/tabs/${tab.id}/preview?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          onNotFound?.();
          onOpenChange(false);
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

        const containerWidth = canvas.parentElement?.clientWidth ?? 600;
        const dpr = Math.max(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth / viewport.width) * dpr;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${scaledViewport.height / dpr}px`;

        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      } catch (e) {
        console.error('[TabPreview] render error:', e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [open, tab.id, onNotFound, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl w-full p-0 overflow-hidden'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <DialogTitle className='text-base font-semibold'>{title}</DialogTitle>
        </DialogHeader>

        {/* Wrapper с A4-пропорцией — окно не скачет пока грузится */}
        <div className='relative w-full' style={{ aspectRatio: '1 / 1.414' }}>
          {/* Спиннер */}
          {loading && (
            <div className='absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900'>
              <Loader2 className='h-8 w-8 animate-spin text-amber-500' />
            </div>
          )}

          {/* Ошибка */}
          {error && !loading && (
            <div className='absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-zinc-100 dark:bg-zinc-900'>
              Не удалось загрузить превью
            </div>
          )}

          {/* Canvas — всегда в DOM чтобы ref работал */}
          <div className={`absolute inset-0 ${loading || error ? 'invisible' : ''}`}>
            <canvas ref={canvasRef} className='w-full block' />

            {/* Градиент-блюр нижней половины */}
            <div
              className='absolute inset-x-0 bottom-0 pointer-events-none dark:hidden'
              style={{
                height: '75%',
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(250,250,250,0.7) 35%, rgba(255,255,255,1) 65%)',
              }}
            />
            <div
              className='absolute inset-x-0 bottom-0 pointer-events-none hidden dark:block'
              style={{
                height: '75%',
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(24,24,27,0.7) 35%, rgba(24,24,27,0.99) 65%)',
              }}
            />

            {/* Текст поверх блюра */}
            <div
              className='absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-8 gap-1.5 pointer-events-none'
              style={{ height: '55%' }}
            >
              <p className='text-sm font-medium text-foreground/80'>Только первая страница</p>
              <p className='text-xs text-muted-foreground'>
                Купите таб, чтобы получить полный файл
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
