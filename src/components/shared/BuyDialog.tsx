'use client';

import { useState, useEffect } from 'react';
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

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function validate(firstname: string, email: string, agreed: boolean, locale: string) {
  const errors: { firstname?: string; email?: string; agreed?: string } = {};
  const ru = locale !== 'en';

  if (!firstname.trim())
    errors.firstname = ru ? 'Введите имя' : 'Enter your name';
  else if (firstname.trim().length < 2)
    errors.firstname = ru ? 'Имя слишком короткое' : 'Name is too short';

  if (!email.trim())
    errors.email = ru ? 'Введите email' : 'Enter your email';
  else if (!EMAIL_RE.test(email))
    errors.email = ru ? 'Некорректный email' : 'Invalid email';

  if (!agreed)
    errors.agreed = ru ? 'Примите условия оферты' : 'Please accept the terms';

  return errors;
}

export function BuyDialog({ tab, locale, open, onOpenChange, testMode }: BuyDialogProps) {
  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState<{ firstname?: boolean; email?: boolean }>({});

  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const errors = validate(firstname, email, agreed, locale);

  useEffect(() => {
    if (!open) {
      setFirstname('');
      setEmail('');
      setAgreed(false);
      setSubmitError('');
      setTouched({});
    }
  }, [open]);

  function blur(field: 'firstname' | 'email') {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstname: true, email: true });

    if (Object.keys(errors).length > 0) return;

    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab_id: tab.id, firstname, email, test: testMode ?? false }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? (locale === 'en' ? 'Something went wrong' : 'Что-то пошло не так'));
        return;
      }

      window.location.href = data.confirmation_url;
    } catch {
      setSubmitError(locale === 'en' ? 'Network error, try again' : 'Ошибка сети, попробуйте снова');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (field: 'firstname' | 'email') =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 transition-shadow ${
      touched[field] && errors[field]
        ? 'border-red-500 focus:ring-red-500/30'
        : 'border-input focus:ring-amber-500/30 focus:border-amber-500'
    }`;

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
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              onBlur={() => blur('firstname')}
              placeholder={locale === 'en' ? 'Your name' : 'Ваше имя'}
              className={inputCls('firstname')}
            />
            {touched.firstname && errors.firstname && (
              <p className="text-xs text-red-500">{errors.firstname}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => blur('email')}
              placeholder={locale === 'en' ? 'your@email.com' : 'ваш@email.com'}
              className={inputCls('email')}
            />
            {touched.email && errors.email ? (
              <p className="text-xs text-red-500">{errors.email}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {locale === 'en'
                  ? 'Files will be sent to this email after payment'
                  : 'На этот email придут файлы после оплаты'}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
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
            {errors.agreed && touched.firstname && (
              <p className="text-xs text-red-500">{errors.agreed}</p>
            )}
          </div>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

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
