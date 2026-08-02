import type { ReactNode } from 'react';

export function StatusPage({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className='relative flex min-h-[calc(100svh-8rem)] items-center justify-center overflow-hidden px-4 pb-16 pt-28 sm:px-6'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,hsl(var(--primary)/0.13),transparent_28rem)]' />
      <section className='relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-6 text-center shadow-[0_24px_80px_hsl(var(--foreground)/0.08)] backdrop-blur-xl sm:p-10'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          {icon}
        </div>
        <p className='mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary'>{eyebrow}</p>
        <h1 className='mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>{title}</h1>
        <p className='mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base'>
          {description}
        </p>
        <div className='mt-7'>{children}</div>
      </section>
    </main>
  );
}
