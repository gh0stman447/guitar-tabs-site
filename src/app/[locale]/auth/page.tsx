import { Suspense } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';

export default function AuthPage() {
  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-16 pt-32 sm:px-6'>
      <div className='pointer-events-none absolute left-[12%] top-[24%] h-64 w-64 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute bottom-[12%] right-[8%] h-72 w-72 rounded-full bg-amber/10 blur-3xl' />
      <Suspense><AuthCard /></Suspense>
    </main>
  );
}
