import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/shared/StatusPage';

export default async function PaymentCanceledPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRu = locale === 'ru';

  return (
    <>
      <StatusPage
        icon={<XCircle className='h-7 w-7' />}
        eyebrow={isRu ? 'Оплата' : 'Payment'}
        title={isRu ? 'Оплата отменена' : 'Payment canceled'}
        description={isRu ? 'Заказ не оплачен. Можно вернуться в каталог и попробовать ещё раз.' : 'The order was not paid. You can return to the catalog and try again.'}
      >
          <div className='flex flex-col justify-center gap-3 sm:flex-row'>
            <Button asChild variant='outline' className='rounded-md px-6'>
              <Link href={`/${locale}`}>
                {isRu ? 'Вернуться на сайт' : 'Back to site'}
              </Link>
            </Button>
            <Button asChild className='rounded-md px-6'>
              <Link href={`/${locale}/#tabs`}>
                {isRu ? 'В каталог' : 'To catalog'}
              </Link>
            </Button>
          </div>
      </StatusPage>
      <Footer />
    </>
  );
}
