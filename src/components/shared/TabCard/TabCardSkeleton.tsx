export function TabCardSkeleton({ showDetails = true }: { showDetails?: boolean }) {
  return (
    <div className='mx-auto flex w-full max-w-[22rem] animate-pulse flex-col overflow-hidden rounded-xl border border-border bg-card sm:max-w-none'>
      <div className='relative aspect-video bg-muted/60 dark:bg-zinc-700/60'>
        <div className='absolute right-4 top-4 h-8 w-[4.5rem] rotate-[-2deg] rounded-lg bg-muted dark:bg-zinc-600' />
      </div>

      <div className='flex flex-1 flex-col gap-2.5 p-4 sm:gap-3 sm:p-5'>
        <div className='flex items-start justify-between gap-2'>
          <div className='h-4 w-3/5 rounded-sm bg-muted/60 dark:bg-zinc-700/60' />
          <div className='h-5 w-9 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
        </div>

        <div className='flex items-center justify-between gap-3'>
          <div
            className={`h-2.5 rounded-sm bg-muted/60 dark:bg-zinc-700/60 ${
              showDetails ? 'w-2/5' : 'w-1/3'
            }`}
          />
          <div className='h-2.5 w-1/4 rounded-sm bg-muted/60 dark:bg-zinc-700/60' />
        </div>

        <div className='mt-auto h-px bg-border' />
        <div className='grid grid-cols-[2rem_1fr_1fr] gap-2'>
          <div className='h-8 w-8 rounded-md bg-muted/60 dark:bg-zinc-700/60' />
          <div className='h-8 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
          <div className='h-8 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
        </div>
      </div>
    </div>
  );
}
