import { HandFist, Sparkles } from 'lucide-react';
import { GiClamp, GiGuitarHead, GiHandGrip } from 'react-icons/gi';
import { MdTouchApp } from 'react-icons/md';
import { getTabCharacteristicLabels } from '@/lib/tab-characteristics';
import type { TabCharacteristics as Characteristics } from '@/types';

export function TabCharacteristics({
  value,
  locale,
  compact = false,
}: {
  value?: Characteristics;
  locale: string;
  compact?: boolean;
}) {
  if (!value) return null;

  const labels = getTabCharacteristicLabels(value, locale);
  const techniqueLabels = labels.filter((item) => item.kind === 'technique');
  const setupLabels = labels.filter((item) => item.kind !== 'technique');
  const visibleLabels = compact ? [...techniqueLabels.slice(0, 1), ...setupLabels] : labels;

  return (
    <div className='flex flex-wrap gap-1.5'>
      {visibleLabels.map((item) => (
        <span
          key={item.key}
          className={`inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/[0.06] font-medium text-foreground/75 ${
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1.5 text-xs'
          }`}
        >
          {item.key === 'percussion' ? (
            <HandFist className='h-3 w-3 text-primary' />
          ) : item.key === 'harmonics' ? (
            <Sparkles className='h-3 w-3 text-primary' />
          ) : item.key === 'barre' ? (
            <GiHandGrip className='h-3.5 w-3.5 text-primary' />
          ) : item.key === 'tapping' ? (
            <MdTouchApp className='h-3.5 w-3.5 text-primary' />
          ) : item.kind === 'tuning' ? (
            <GiGuitarHead className='h-3.5 w-3.5 text-primary' />
          ) : (
            <GiClamp className='h-3.5 w-3.5 text-primary' />
          )}
          {item.label}
        </span>
      ))}
      {compact && labels.length > visibleLabels.length && (
        <span className='rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
          +{labels.length - visibleLabels.length}
        </span>
      )}
    </div>
  );
}
