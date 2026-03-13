'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, Loader2, Music, ShoppingCart } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import type { Tab } from '@/types';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function validate(firstname: string, email: string, agreed: boolean, locale: string) {
  const errors: { firstname?: string; email?: string; agreed?: string } = {};
  const ru = locale !== 'en';

  if (!firstname.trim()) errors.firstname = ru ? 'Введите имя' : 'Enter your name';
  else if (firstname.trim().length < 2)
    errors.firstname = ru ? 'Имя слишком короткое' : 'Name is too short';

  if (!email.trim()) errors.email = ru ? 'Введите email' : 'Enter your email';
  else if (!EMAIL_RE.test(email)) errors.email = ru ? 'Некорректный email' : 'Invalid email';

  if (!agreed) errors.agreed = ru ? 'Примите условия оферты' : 'Please accept the terms';

  return errors;
}

const inputCls = (touched: boolean, hasError: boolean) =>
  `w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 transition-shadow ${
    touched && hasError
      ? 'border-red-500 focus:ring-red-500/30'
      : 'border-input focus:ring-amber-500/30 focus:border-amber-500'
  }`;

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

export function CartDrawer({ open, onOpenChange, locale }: CartDrawerProps) {
  const { items, removeItem, clearCart, subtotal, discountRate, discount, total, testMode } =
    useCart();
  const ru = locale !== 'en';

  const [firstname, setFirstname] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(firstname, email, agreed, locale);

  useEffect(() => {
    if (!open) {
      setFirstname('');
      setEmail('');
      setAgreed(false);
      setNewsletter(false);
      setSubmitError('');
      setSubmitted(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && items.length === 0) {
      onOpenChange(false);
    }
  }, [items.length, open, onOpenChange]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    setSubmitError('');
    setLoading(true);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tab_ids: items.map((t) => t.id),
          firstname,
          email,
          newsletter,
          test: testMode ?? false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? (ru ? 'Что-то пошло не так' : 'Something went wrong'));
        return;
      }

      clearCart();
      window.location.href = data.confirmation_url;
    } catch {
      setSubmitError(ru ? 'Ошибка сети, попробуйте снова' : 'Network error, try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        showCloseButton={false}
        aria-describedby={undefined}
        className='w-full sm:max-w-md flex flex-col p-0'
      >
        <SheetTitle className='sr-only'>{ru ? 'Корзина' : 'Cart'}</SheetTitle>

        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5 text-amber-500' />
            <span className='font-semibold text-base'>{ru ? 'Корзина' : 'Cart'}</span>
            {items.length > 0 && (
              <span className='text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-medium'>
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors cursor-pointer'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='flex flex-col flex-1 overflow-y-auto'>
          {items.length === 0 ? (
            <div className='flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground px-6'>
              <ShoppingCart className='h-12 w-12 opacity-20' />
              <p className='text-sm'>{ru ? 'Корзина пуста' : 'Cart is empty'}</p>
            </div>
          ) : (
            <>
              {/* Items list */}
              <div className='flex flex-col gap-0 divide-y divide-border'>
                {items.map((tab) => (
                  <CartItem
                    key={tab.id}
                    tab={tab}
                    locale={locale}
                    onRemove={() => {
                      const title = locale === 'en' ? tab.title_en : tab.title_ru;
                      removeItem(tab.id);
                      toast(title, {
                        description: locale === 'en' ? 'Removed from cart' : 'Убрано из корзины',
                        icon: '🗑️',
                      });
                    }}
                  />
                ))}
              </div>

              {/* Discount hint */}
              {items.length === 1 && (
                <div className='mx-6 my-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400'>
                  {ru
                    ? 'Добавь ещё 1 таб и получи скидку 10% 🎸'
                    : 'Add 1 more tab and get 10% off 🎸'}
                </div>
              )}
              {items.length === 2 && (
                <div className='mx-6 my-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400'>
                  {ru
                    ? 'Добавь ещё 1 таб, и скидка вырастет до 15% 🎸'
                    : 'Add 1 more tab and discount grows to 15% 🎸'}
                </div>
              )}

              {/* Total */}
              <div className='flex flex-col gap-1 px-6 py-4 border-t border-border mt-auto'>
                {discount > 0 && (
                  <>
                    <div className='flex items-center justify-between text-sm text-muted-foreground'>
                      <span>{ru ? 'Сумма' : 'Subtotal'}</span>
                      <span>{subtotal} ₽</span>
                    </div>
                    <div className='flex items-center justify-between text-sm text-green-600 dark:text-green-400'>
                      <span>
                        {ru ? `Скидка ${discountRate * 100}%` : `Discount ${discountRate * 100}%`}
                      </span>
                      <span>−{discount} ₽</span>
                    </div>
                  </>
                )}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>{ru ? 'Итого' : 'Total'}</span>
                  <span className='text-xl font-bold'>{total} ₽</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className='flex flex-col gap-4 px-6 pb-6'>
                <p className='text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest'>
                  {ru ? 'Данные для отправки' : 'Your details'}
                </p>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium'>{ru ? 'Имя' : 'First name'}</label>
                  <input
                    type='text'
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    placeholder={ru ? 'Ваше имя' : 'Your name'}
                    className={inputCls(submitted, !!errors.firstname)}
                  />
                  {submitted && errors.firstname && (
                    <p className='text-xs text-red-500'>{errors.firstname}</p>
                  )}
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium'>Email</label>
                  <input
                    type='text'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={ru ? 'ваш@email.com' : 'your@email.com'}
                    className={inputCls(submitted, !!errors.email)}
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
                  <label className='flex items-start gap-2.5 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className='mt-0.5 h-4 w-4 shrink-0 accent-amber-500'
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
                  {errors.agreed && submitted && (
                    <p className='text-xs text-red-500'>{errors.agreed}</p>
                  )}
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='flex items-start gap-2.5 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className='mt-0.5 h-4 w-4 shrink-0 accent-amber-500'
                    />
                    <span className='text-sm text-muted-foreground leading-relaxed'>
                      {ru
                        ? 'Хочу получать новости о новых табах и скидках (необязательно)'
                        : 'I want to receive news about new tabs and discounts (optional)'}
                    </span>
                  </label>
                </div>

                {submitError && <p className='text-sm text-red-500'>{submitError}</p>}

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
                    `Оплатить ${total} ₽`
                  ) : (
                    `Pay ${total} ₽`
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CartItem({ tab, locale, onRemove }: { tab: Tab; locale: string; onRemove: () => void }) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;

  return (
    <div className='flex items-center gap-3 px-6 py-4'>
      <div className='relative w-14 h-14 rounded-md overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900 shrink-0'>
        {tab.photo_url ? (
          <Image src={tab.photo_url} alt={title} fill className='object-cover' sizes='56px' />
        ) : (
          <div className='flex items-center justify-center w-full h-full'>
            <Music className='h-6 w-6 text-amber-400' strokeWidth={1} />
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>{title}</p>
        <p className='text-sm text-amber-500 font-semibold'>{tab.price} ₽</p>
      </div>
      <button
        onClick={onRemove}
        className='flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shrink-0'
      >
        <Trash2 className='h-4 w-4' />
      </button>
    </div>
  );
}
