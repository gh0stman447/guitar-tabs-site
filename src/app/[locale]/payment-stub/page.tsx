'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { LoadingPage } from '@/components/shared/LoadingPage';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function PaymentStubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchase_id = searchParams?.get('purchase_id');
  const locale = searchParams?.get('locale') || 'ru';

  const [purchase, setPurchase] = useState<{ id: string; status: string; amount: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isRu = locale === 'ru';

  useEffect(() => {
    // Block in production
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      toast.error('Доступно только на localhost');
      router.push('/');
      return;
    }

    if (!purchase_id) {
      router.push('/');
      return;
    }

    // Fetch purchase info
    fetch(`/api/purchases/${purchase_id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setPurchase(data);
        setFetching(false);
      })
      .catch((err) => {
        console.error(err);
        setFetching(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase_id, router]);

  async function handleSimulatePayment() {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_id }),
      });

      if (res.ok) {
        // Redirect to success page
        router.push(`/${locale}/payment/success?purchase_id=${purchase_id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка оплаты');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ошибка симуляции оплаты');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <LoadingPage />;
  }

  return (
    <>
      <Header />
      <main className='min-h-screen flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center space-y-6'>
          <div className='flex justify-center'>
            <div className='w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center'>
              <CheckCircle2 className='h-10 w-10 text-amber-500' />
            </div>
          </div>

          <div className='space-y-2'>
            <h1 className='text-2xl font-bold'>
              {isRu ? 'Тестовый режим оплаты' : 'Test Payment Mode'}
            </h1>
            <p className='text-muted-foreground'>
              {isRu
                ? 'YooKassa не подключена. Подтвердите оплату вручную для тестирования.'
                : 'YooKassa is not configured. Confirm payment manually for testing.'}
            </p>
          </div>

          {purchase && (
            <div className='rounded-xl border border-border bg-muted/30 p-4 text-sm text-left space-y-2'>
              <p>
                <strong>Purchase ID:</strong> {purchase.id}
              </p>
              <p>
                <strong>Status:</strong> {purchase.status}
              </p>
              <p>
                <strong>Amount:</strong> {purchase.amount} RUB
              </p>
            </div>
          )}

          <div className='space-y-4'>
            <Button
              onClick={handleSimulatePayment}
              disabled={loading}
              className='bg-green-500 hover:bg-green-600 text-white rounded-full px-8 w-full'
            >
              {loading
                ? isRu
                  ? 'Обработка...'
                  : 'Processing...'
                : isRu
                  ? '✅ Подтвердить оплату'
                  : '✅ Confirm Payment'}
            </Button>

            <Button
              asChild
              variant='outline'
              className='border-border text-muted-foreground hover:border-amber-500 hover:text-foreground rounded-full px-8 w-full'
            >
              <Link href={`/${locale}`}>{isRu ? 'Вернуться на сайт' : 'Back to site'}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
