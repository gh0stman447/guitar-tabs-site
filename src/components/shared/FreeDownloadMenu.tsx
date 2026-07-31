'use client';

import { Archive, ChevronDown, FileText, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tab } from '@/types';

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          size={compact ? 'sm' : 'default'}
          className='w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
        >
          {ru ? 'Скачать' : 'Download'}
          <ChevronDown className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-56 rounded-xl border-border bg-background p-1.5 shadow-xl'
      >
        {guitarProFormat && (
          <DropdownMenuItem
            asChild
            className='rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground cursor-pointer'
          >
            <a href={`/api/tabs/${tab.id}/download?format=${guitarProFormat}`} download>
              <Music2 className='h-5 w-5' />
              Guitar Pro (.{guitarProFormat})
            </a>
          </DropdownMenuItem>
        )}
        {tab.files.pdf && (
          <DropdownMenuItem
            asChild
            className='rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground cursor-pointer'
          >
            <a href={`/api/tabs/${tab.id}/download?format=pdf`} download>
              <FileText className='h-5 w-5' />
              PDF
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          asChild
          className='rounded-lg px-3 py-2.5 text-sm hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground cursor-pointer'
        >
          <a href={`/api/tabs/${tab.id}/download`} download>
            <Archive className='h-5 w-5' />
            {ru ? 'Архив (ZIP)' : 'Archive (ZIP)'}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
