'use client';

import { Download } from 'lucide-react';

export function DocumentDownloadButton({ locale }: { locale: string }) {
  const label = locale === 'en' ? 'Download PDF' : 'Скачать PDF';

  return (
    <button
      type='button'
      onClick={() => window.print()}
      className='document-download inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted'
    >
      <Download className='h-4 w-4' aria-hidden='true' />
      {label}
    </button>
  );
}
