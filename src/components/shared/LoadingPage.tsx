import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';

export function LoadingPage() {
  return (
    <>
      <main className='min-h-screen flex items-center justify-center px-4'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-8 w-8 animate-spin text-amber-500' />
        </div>
      </main>
      <Footer />
    </>
  );
}
