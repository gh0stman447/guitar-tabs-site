export function TabCardSkeleton({ showDetails = true }: { showDetails?: boolean }) {
  return (
    <div className='w-full max-w-[22rem] mx-auto sm:max-w-none rounded-xl border border-border bg-card overflow-hidden flex flex-col animate-pulse'>
      <div className='relative aspect-video bg-muted/60 dark:bg-zinc-700/60'>
        <div className='absolute right-4 top-4 h-7 w-16 rotate-[-2deg] rounded-[48%_58%_46%_62%] bg-muted dark:bg-zinc-600' />
      </div>

      <div className='p-4 sm:p-5 flex flex-col flex-1 gap-2.5 sm:gap-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='h-4 w-3/5 rounded bg-muted/60 dark:bg-zinc-700/60' />
          <div className='h-5 w-9 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
        </div>
        <div
          className={`h-3 rounded bg-muted/60 dark:bg-zinc-700/60 ${
            showDetails ? 'w-2/5' : 'w-1/3'
          }`}
        />
        <div className='h-px bg-border mt-auto' />
        <div className='grid grid-cols-[2rem_1fr_1fr] gap-2'>
          <div className='h-8 w-8 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
          <div className='h-8 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
          <div className='h-8 rounded-full bg-muted/60 dark:bg-zinc-700/60' />
        </div>
      </div>
    </div>
  );
}
