export function TabCardSkeleton({ showDetails = true }: { showDetails?: boolean }) {
  return (
    <div className='rounded-xl border border-border bg-card overflow-hidden flex flex-col animate-pulse'>
      {/* Image */}
      <div className='aspect-video bg-muted/60 dark:bg-zinc-700/60' />

      <div className='p-5 flex flex-col flex-1 gap-3'>
        {/* Title + difficulty */}
        <div className='flex items-center justify-between gap-2'>
          <div className='h-4 bg-muted/60 dark:bg-zinc-700/60 rounded w-3/5' />
          <div className='h-6 w-10 bg-muted/60 dark:bg-zinc-700/60 rounded-full shrink-0' />
        </div>

        {showDetails ? (
          <>
            {/* Description */}
            <div className='flex flex-col gap-1.5 flex-1'>
              <div className='h-3 bg-muted/60 dark:bg-zinc-700/60 rounded w-full' />
              <div className='h-3 bg-muted/60 dark:bg-zinc-700/60 rounded w-4/5' />
            </div>
            {/* Formats */}
            <div className='flex gap-1'>
              <div className='h-5 w-10 bg-muted/60 dark:bg-zinc-700/60 rounded' />
              <div className='h-5 w-12 bg-muted/60 dark:bg-zinc-700/60 rounded' />
            </div>
          </>
        ) : (
          <div className='h-3 bg-muted/60 dark:bg-zinc-700/60 rounded w-2/5' />
        )}

        {/* Price + button */}
        <div className='flex items-center justify-between pt-3 border-t border-border mt-auto'>
          <div className='h-6 w-16 bg-muted/60 dark:bg-zinc-700/60 rounded' />
          <div className='h-8 w-24 bg-muted/60 dark:bg-zinc-700/60 rounded-full' />
        </div>
      </div>
    </div>
  );
}
