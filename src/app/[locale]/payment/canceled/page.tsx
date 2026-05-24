import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';

export default async function PaymentCanceledPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRu = locale === 'ru';

  return (
    <>
      <Header />
      <main className='min-h-screen flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center'>
              <XCircle className='h-10 w-10 text-red-500' />
            </div>
          </div>

          <div className='space-y-2'>
            <h1 className='text-2xl font-bold'>
              {isRu ? 'Оплата отменена' : 'Payment canceled'}
            </h1>
            <p className='text-muted-foreground'>
              {isRu
                ? 'Вы можете вернуться в каталог и попробовать снова'
                : 'You can return to the catalog and try again'}
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button asChild variant='outline' className='rounded-full px-6'>
              <Link href={`/${locale}`}>
                {isRu ? 'Вернуться на сайт' : 'Back to site'}
              </Link>
            </Button>
            <Button asChild className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6'>
              <Link href={`/${locale}/#tabs`}>
                {isRu ? 'В каталог' : 'To catalog'}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
