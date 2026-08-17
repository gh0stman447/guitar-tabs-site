'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckoutForm } from '@/components/shared/CheckoutForm';
import type { Tab } from '@/types';
import { submitPaymentRedirect } from '@/lib/submit-payment';

interface BuyDialogProps {
  tab: Tab;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testMode?: boolean;
}

export function BuyDialog({ tab, locale, open, onOpenChange, testMode }: BuyDialogProps) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;

  async function handleSubmit({
    firstname,
    email,
    newsletter,
  }: {
    firstname: string;
    email: string;
    newsletter: boolean;
  }) {
    const res = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tab_id: tab.id,
        firstname,
        email,
        newsletter,
        locale,
        test: testMode ?? false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? (locale === 'en' ? 'Something went wrong' : 'Что-то пошло не так'));
    }

    submitPaymentRedirect(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{locale === 'en' ? 'Purchase' : 'Оформление заказа'}</DialogTitle>
          <DialogDescription>
            {title} — <span className='font-semibold text-foreground'>{tab.price} ₽</span>
          </DialogDescription>
        </DialogHeader>

        <CheckoutForm
          key={open ? 'open' : 'closed'}
          locale={locale}
          price={tab.price}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
