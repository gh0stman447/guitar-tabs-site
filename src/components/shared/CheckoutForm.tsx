'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function validate(firstname: string, email: string, agreed: boolean, ru: boolean) {
  const errors: { firstname?: string; email?: string; agreed?: string } = {};

  if (!firstname.trim()) errors.firstname = ru ? 'Введите имя' : 'Enter your name';
  else if (firstname.trim().length < 2)
    errors.firstname = ru ? 'Имя слишком короткое' : 'Name is too short';

  if (!email.trim()) errors.email = ru ? 'Введите email' : 'Enter your email';
  else if (!EMAIL_RE.test(email)) errors.email = ru ? 'Некорректный email' : 'Invalid email';

  if (!agreed) errors.agreed = ru ? 'Примите условия оферты' : 'Please accept the terms';

  return errors;
}

interface CheckoutFormProps {
  locale: string;
  price: number;
  onSubmit: (data: { firstname: string; email: string; newsletter: boolean }) => Promise<void>;
}

export function CheckoutForm({ locale, price, onSubmit }: CheckoutFormProps) {
  const ru = locale !== 'en';

  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(firstname, email, agreed, ru);

  const inputCls = (hasError: boolean) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 transition-shadow ${
      submitted && hasError
        ? 'border-red-500 focus:ring-red-500/30'
        : 'border-input focus:ring-amber-500/30 focus:border-amber-500'
    }`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    setSubmitError('');
    setLoading(true);
    try {
      await onSubmit({ firstname, email, newsletter });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : ru
            ? 'Ошибка сети, попробуйте снова'
            : 'Network error, try again',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='checkout-firstname' className='text-sm font-medium'>
          {ru ? 'Имя' : 'First name'}
        </label>
        <input
          id='checkout-firstname'
          name='firstname'
          type='text'
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          placeholder={ru ? 'Ваше имя' : 'Your name'}
          className={inputCls(!!errors.firstname)}
        />
        {submitted && errors.firstname && (
          <p className='text-xs text-red-500'>{errors.firstname}</p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='checkout-email' className='text-sm font-medium'>
          Email
        </label>
        <input
          id='checkout-email'
          name='email'
          type='text'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={ru ? 'ваш@email.com' : 'your@email.com'}
          className={inputCls(!!errors.email)}
        />
        {submitted && errors.email ? (
          <p className='text-xs text-red-500'>{errors.email}</p>
        ) : (
          <p className='text-xs text-muted-foreground'>
            {ru
              ? 'На этот email придут файлы после оплаты'
              : 'Files will be sent to this email after payment'}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label
          htmlFor='checkout-agreed'
          className='flex items-start gap-2.5 cursor-pointer min-w-0'
        >
          <input
            id='checkout-agreed'
            name='agreed'
            type='checkbox'
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className='mt-0.5 h-4 w-4 shrink-0 accent-amber-500 min-w-5'
          />
          <span className='text-sm text-muted-foreground leading-relaxed'>
            {ru ? (
              <>
                Я принимаю условия{' '}
                <Link
                  href={`/${locale}/legal`}
                  target='_blank'
                  className='text-amber-500 hover:underline'
                >
                  публичной оферты
                </Link>{' '}
                и{' '}
                <Link
                  href={`/${locale}/privacy`}
                  target='_blank'
                  className='text-amber-500 hover:underline'
                >
                  политику конфиденциальности
                </Link>
              </>
            ) : (
              <>
                I accept the{' '}
                <Link
                  href={`/${locale}/legal`}
                  target='_blank'
                  className='text-amber-500 hover:underline'
                >
                  terms of the public offer
                </Link>{' '}
                and{' '}
                <Link
                  href={`/${locale}/privacy`}
                  target='_blank'
                  className='text-amber-500 hover:underline'
                >
                  privacy policy
                </Link>
              </>
            )}
          </span>
        </label>
        {errors.agreed && submitted && <p className='text-xs text-red-500'>{errors.agreed}</p>}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label
          htmlFor='checkout-newsletter'
          className='flex items-start gap-2.5 cursor-pointer min-w-0'
        >
          <input
            id='checkout-newsletter'
            name='newsletter'
            type='checkbox'
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className='mt-0.5 h-4 w-4 shrink-0 accent-amber-500 min-w-5'
          />
          <span className='text-sm text-muted-foreground leading-relaxed'>
            {ru
              ? 'Хочу получать новости о новых табах и скидках (необязательно)'
              : 'I want to receive news about new tabs and discounts (optional)'}
          </span>
        </label>
      </div>

      {submitError && <p className='text-sm text-red-500'>{submitError}</p>}

      <p className='text-xs text-muted-foreground text-center'>
        {ru ? (
          <>
            Находитесь не в РФ?{' '}
            <a
              href='https://t.me/MalyginOleg'
              target='_blank'
              rel='noopener noreferrer'
              className='text-amber-500 hover:underline'
            >
              Напишите в Telegram
            </a>
            {' '}— подберем удобный способ оплаты
          </>
        ) : (
          <>
            Outside Russia?{' '}
            <a
              href='https://t.me/MalyginOleg'
              target='_blank'
              rel='noopener noreferrer'
              className='text-amber-500 hover:underline'
            >
              Write us on Telegram
            </a>
            {' '}— we&apos;ll sort out a payment method
          </>
        )}
      </p>

      <Button
        type='submit'
        disabled={loading}
        className='w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full'
      >
        {loading ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin mr-2' />
            {ru ? 'Переход...' : 'Redirecting...'}
          </>
        ) : ru ? (
          `Оплатить ${price} ₽`
        ) : (
          `Pay ${price} ₽`
        )}
      </Button>
    </form>
  );
}
