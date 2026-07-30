import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { PurchaseTracker } from './PurchaseTracker';
import { LOCAL_DEV_URL } from '@/lib/constants';

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ purchase_id?: string }>;
}) {
  const { locale } = await params;
  const { purchase_id } = await searchParams;

  if (!purchase_id) {
    redirect(`/${locale}`);
  }

  // Fetch purchase from API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? LOCAL_DEV_URL}/api/purchases/${purchase_id}`,
    {
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    redirect(`/${locale}`);
  }

  const purchase = await res.json();

  if (purchase.status !== 'succeeded') {
    redirect(`/${locale}`);
  }

  const isRu = locale === 'ru';

  return (
    <>
      <PurchaseTracker purchase={purchase} locale={locale} />
      <main className='min-h-screen flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center'>
              <CheckCircle2 className='h-10 w-10 text-green-500' />
            </div>
          </div>

          <div className='space-y-2'>
            <h1 className='text-2xl font-bold'>
              {isRu ? 'Оплата прошла успешно!' : 'Payment successful!'}
            </h1>
            <p className='text-muted-foreground'>
              {isRu
                ? 'Файлы отправлены на ваш email. Проверьте папку «Входящие» или «Спам».'
                : 'Files have been sent to your email. Check your Inbox or Spam folder.'}
            </p>
          </div>

          <div className='rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground'>
            {isRu
              ? 'Если письмо не пришло в течение 15 минут — напишите в Telegram'
              : "If you didn't receive the email within 15 minutes, contact us on Telegram"}{' '}
            <a
              href='https://t.me/MalyginOleg'
              target='_blank'
              rel='noopener noreferrer'
              className='text-amber-500 hover:underline'
            >
              @MalyginOleg
            </a>
          </div>

          <Button asChild className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8'>
            <Link href={`/${locale}`}>{isRu ? 'Вернуться на сайт' : 'Back to site'}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
