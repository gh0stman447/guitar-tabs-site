import Link from 'next/link';
import { MailX } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/shared/StatusPage';

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  const { email } = await searchParams;
  const isRu = locale === 'ru';

  const resubscribeUrl = email
    ? `/api/resubscribe?email=${encodeURIComponent(email)}`
    : `/${locale}`;

  return (
    <>
      <StatusPage
        icon={<MailX className='h-7 w-7' />}
        eyebrow={isRu ? 'Рассылка' : 'Newsletter'}
        title={isRu ? 'Вы отписались' : 'Unsubscribed'}
        description={isRu ? 'Вы больше не будете получать письма о новых табах.' : 'You will no longer receive emails about new tabs.'}
      >
          <div className='space-y-3'>
            <Button
              asChild
              className='w-full rounded-md px-8'
            >
              <Link href={`/${locale}`}>{isRu ? 'Вернуться на сайт' : 'Back to site'}</Link>
            </Button>

            {email && (
              <Button asChild variant='outline' className='w-full rounded-md px-8'>
                <Link href={resubscribeUrl} prefetch={false}>
                  {isRu ? 'Подписаться заново' : 'Resubscribe'}
                </Link>
              </Button>
            )}
          </div>
      </StatusPage>
      <Footer />
    </>
  );
}
