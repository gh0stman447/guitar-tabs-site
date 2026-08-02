import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/components/shared/StatusPage';

export default async function ResubscribedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRu = locale === 'ru';

  return (
    <>
      <StatusPage
        icon={<MailCheck className='h-7 w-7' />}
        eyebrow={isRu ? 'Рассылка' : 'Newsletter'}
        title={isRu ? 'Вы снова подписаны!' : 'Resubscribed!'}
        description={isRu ? 'Вы снова будете получать письма о новых табах.' : 'You will receive emails about new tabs again.'}
      >
          <Button asChild className='rounded-md px-8'>
            <Link href={`/${locale}`}>{isRu ? 'Вернуться на сайт' : 'Back to site'}</Link>
          </Button>
      </StatusPage>
      <Footer />
    </>
  );
}
