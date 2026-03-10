'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Tab } from '@/types';

interface BuyDialogProps {
  tab: Tab;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testMode?: boolean;
}

export function BuyDialog({ tab, locale, open, onOpenChange, testMode }: BuyDialogProps) {
  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = locale === 'en' ? tab.title_en : tab.title_ru;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError(locale === 'en' ? 'Please accept the terms' : 'Примите условия оферты');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab_id: tab.id, firstname, email, test: testMode ?? false }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? (locale === 'en' ? 'Something went wrong' : 'Что-то пошло не так'));
        return;
      }

      // Redirect to YooKassa payment page
      window.location.href = data.confirmation_url;
    } catch {
      setError(locale === 'en' ? 'Network error, try again' : 'Ошибка сети, попробуйте снова');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {locale === 'en' ? 'Purchase' : 'Оформление заказа'}
          </DialogTitle>
          <DialogDescription>
            {title} — <span className="font-semibold text-foreground">{tab.price} ₽</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {locale === 'en' ? 'First name' : 'Имя'}
            </label>
            <input
              type="text"
              required
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              placeholder={locale === 'en' ? 'Your name' : 'Ваше имя'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={locale === 'en' ? 'your@email.com' : 'ваш@email.com'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'en'
                ? 'Files will be sent to this email after payment'
                : 'На этот email придут файлы после оплаты'}
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              {locale === 'en' ? (
                <>I accept the <Link href={`/${locale}/legal`} target="_blank" className="text-amber-500 hover:underline">terms of the public offer</Link></>
              ) : (
                <>Я принимаю условия <Link href={`/${locale}/legal`} target="_blank" className="text-amber-500 hover:underline">публичной оферты</Link></>
              )}
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />{locale === 'en' ? 'Redirecting...' : 'Переход...'}</>
            ) : (
              locale === 'en' ? `Pay ${tab.price} ₽` : `Оплатить ${tab.price} ₽`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
