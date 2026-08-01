'use client';

import { useState, useSyncExternalStore } from 'react';
import { Archive, ChevronDown, FileText, Loader2, Music2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tab } from '@/types';

let activeDownloadKey: string | null = null;
const downloadListeners = new Set<() => void>();

function subscribeToDownloads(listener: () => void) {
  downloadListeners.add(listener);
  return () => downloadListeners.delete(listener);
}

function getActiveDownloadKey() {
  return activeDownloadKey;
}

function getServerDownloadKey() {
  return null;
}

function beginDownload(key: string) {
  if (activeDownloadKey !== null) return false;

  activeDownloadKey = key;
  downloadListeners.forEach((listener) => listener());
  return true;
}

function endDownload(key: string) {
  if (activeDownloadKey !== key) return;

  activeDownloadKey = null;
  downloadListeners.forEach((listener) => listener());
}

function getDownloadFilename(response: Response, fallback: string) {
  const disposition = response.headers.get('Content-Disposition');
  const encodedFilename = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainFilename = disposition?.match(/filename="?([^";]+)"?/i)?.[1];

  if (encodedFilename) {
    try {
      return decodeURIComponent(encodedFilename);
    } catch {
      return fallback;
    }
  }

  return plainFilename || fallback;
}

export function FreeDownloadMenu({
  tab,
  locale,
  compact = false,
}: {
  tab: Tab;
  locale: string;
  compact?: boolean;
}) {
  const ru = locale !== 'en';
  const guitarProFormat = tab.files.gpx ? 'gpx' : tab.files.gp5 ? 'gp5' : null;
  const [open, setOpen] = useState(false);
  const activeKey = useSyncExternalStore(
    subscribeToDownloads,
    getActiveDownloadKey,
    getServerDownloadKey,
  );
  const isDownloading = activeKey !== null;
  const isCurrentTabDownloading = activeKey?.startsWith(`${tab.id}:`) ?? false;

  const download = async (format?: 'pdf' | 'gp5' | 'gpx') => {
    const key = `${tab.id}:${format ?? 'zip'}`;
    if (!beginDownload(key)) return;

    setOpen(false);

    try {
      const query = format ? `?format=${format}` : '';
      const response = await fetch(`/api/tabs/${tab.id}/download${query}`);

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const fallbackFilename = `guitar-tab-${tab.id}.${format ?? 'zip'}`;
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = getDownloadFilename(response, fallbackFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error('[free-tab-download] Download failed:', error);
      toast.error(
        ru
          ? 'Не удалось скачать файл. Попробуйте ещё раз.'
          : 'Could not download the file. Please try again.',
      );
    } finally {
      endDownload(key);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          size={compact ? 'sm' : 'default'}
          className={`w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 ${isCurrentTabDownloading ? 'disabled:opacity-100' : ''}`}
          disabled={isDownloading}
          aria-busy={isCurrentTabDownloading}
        >
          {isCurrentTabDownloading
            ? ru
              ? compact
                ? 'Загрузка…'
                : 'Скачивание…'
              : compact
                ? 'Loading…'
                : 'Downloading…'
            : ru
              ? 'Скачать'
              : 'Download'}
          {isCurrentTabDownloading ? (
            <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
          ) : (
            <ChevronDown className='h-4 w-4' aria-hidden='true' />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-56 rounded-xl border-border bg-background p-1.5 shadow-xl'
      >
        {guitarProFormat && (
          <DropdownMenuItem
            className='rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground cursor-pointer'
            disabled={isDownloading}
            onSelect={() => void download(guitarProFormat)}
          >
            <Music2 className='h-5 w-5' />
            Guitar Pro (.{guitarProFormat})
          </DropdownMenuItem>
        )}
        {tab.files.pdf && (
          <DropdownMenuItem
            className='rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground cursor-pointer'
            disabled={isDownloading}
            onSelect={() => void download('pdf')}
          >
            <FileText className='h-5 w-5' />
            PDF
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className='rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground cursor-pointer'
          disabled={isDownloading}
          onSelect={() => void download()}
        >
          <Archive className='h-5 w-5' />
          {ru ? 'Архив (ZIP)' : 'Archive (ZIP)'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
