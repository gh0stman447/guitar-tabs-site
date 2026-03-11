'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { FORMATS } from '@/types';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-foreground'>{label}</label>
      {children}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-shadow placeholder:text-muted-foreground';

export const FORMAT_ACCEPT: Record<(typeof FORMATS)[number], Record<string, string[]>> = {
  pdf: { 'application/pdf': ['.pdf'] },
  gp5: { 'application/octet-stream': ['.gp5'] },
  gpx: { 'application/octet-stream': ['.gpx'] },
  mp3: { 'audio/mpeg': ['.mp3'] },
};

export function DropZone({
  label,
  accept,
  file,
  onFile,
  existingLabel,
}: {
  label: string;
  accept: Record<string, string[]>;
  file: File | null;
  onFile: (f: File | null) => void;
  existingLabel?: string;
}) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  const displayLabel = file
    ? file.name
    : isDragActive
      ? 'Отпустите файл...'
      : existingLabel
        ? `✓ ${existingLabel} (заменить)`
        : label;

  return (
    <div
      {...getRootProps()}
      className={`flex items-center gap-3 cursor-pointer rounded-lg border border-dashed px-4 py-3 transition-colors ${
        isDragActive
          ? 'border-amber-400 bg-amber-500/5'
          : existingLabel && !file
            ? 'border-green-500/50 hover:border-amber-400'
            : 'border-border hover:border-amber-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className='h-4 w-4 text-muted-foreground shrink-0' />
      <span
        className={`text-sm truncate flex-1 ${existingLabel && !file ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
      >
        {displayLabel}
      </span>
      {file && (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onFile(null);
          }}
          className='text-muted-foreground hover:text-foreground shrink-0'
        >
          <X className='h-3.5 w-3.5' />
        </button>
      )}
    </div>
  );
}
