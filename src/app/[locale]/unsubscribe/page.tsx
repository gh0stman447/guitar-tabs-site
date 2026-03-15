import Link from 'next/link';
import { MailX } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';

export default async function UnsubscribePage({
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
            <div className='w-20 h-20 rounded-full bg-muted flex items-center justify-center'>
              <MailX className='h-10 w-10 text-muted-foreground' />
            </div>
          </div>

          <div className='space-y-2'>
            <h1 className='text-2xl font-bold'>
              {isRu ? 'Вы отписались' : 'Unsubscribed'}
            </h1>
            <p className='text-muted-foreground'>
              {isRu
                ? 'Вы больше не будете получать письма о новых табах.'
                : 'You will no longer receive emails about new tabs.'}
            </p>
          </div>

          <Button asChild className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8'>
            <Link href={`/${locale}`}>{isRu ? 'Вернуться на сайт' : 'Back to site'}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
