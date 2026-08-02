import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { PurchaseTracker } from './PurchaseTracker';
import { LOCAL_DEV_URL } from '@/lib/constants';
import { StatusPage } from '@/components/shared/StatusPage';

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
      <StatusPage
        icon={<CheckCircle2 className='h-7 w-7' />}
        eyebrow={isRu ? 'Заказ готов' : 'Order ready'}
        title={isRu ? 'Оплата прошла успешно!' : 'Payment successful!'}
        description={isRu ? 'Файлы отправлены на ваш email. Проверьте папки «Входящие» и «Спам».' : 'Files have been sent to your email. Check your Inbox and Spam folders.'}
      >
          <div className='rounded-xl bg-muted/55 p-4 text-sm text-muted-foreground'>
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

          <Button asChild className='mt-5 rounded-md px-8'>
            <Link href={`/${locale}`}>{isRu ? 'Вернуться на сайт' : 'Back to site'}</Link>
          </Button>
      </StatusPage>
      <Footer />
    </>
  );
}
