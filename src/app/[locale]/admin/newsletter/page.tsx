'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Mail, Send } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/admin-auth';
import { SITE_URL } from '@/lib/constants';
import { Field, inputCls } from '@/components/admin/AdminFormFields';

export default function NewsletterPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
  }, []);

  const [subject, setSubject] = useState('');
  const [tabTitle, setTabTitle] = useState('');
  const [tabUrl, setTabUrl] = useState(SITE_URL);
  const [tabImage, setTabImage] = useState('');
  const [text, setText] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!authed) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-secondary/30'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4'>Нет доступа</p>
          <Link href={`/${locale}/admin`} className='text-amber-500 underline'>
            Войти в админку
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, tabTitle, tabUrl, tabImage: tabImage || undefined, text }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Отправлено ${data.sent} подписчикам` });
        setSubject('');
        setTabTitle('');
        setTabUrl('');
        setTabImage('');
        setText('');
      } else {
        setResult({ ok: false, message: data.error });
      }
    } catch {
      setResult({ ok: false, message: 'Сетевая ошибка' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-secondary/20'>
      <Header />
      <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 pt-24'>
        <div className='w-full max-w-2xl'>
          <div className='flex items-center gap-3 mb-8'>
            <div className='w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center'>
              <Mail className='h-5 w-5 text-amber-500' />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>Рассылка</h1>
              <p className='text-sm text-muted-foreground'>Отправить письмо всем подписчикам</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className='bg-background rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-5'
          >
            <Field label='Тема письма'>
              <input
                required
                placeholder='Введите тему письма'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label='Название таба'>
              <input
                required
                placeholder='Введите название таба'
                value={tabTitle}
                onChange={(e) => setTabTitle(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label='Ссылка на таб'>
              <input
                required
                placeholder='https://olegguitar.com/ru/tabs/...'
                value={tabUrl}
                onChange={(e) => setTabUrl(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label='Ссылка на фото (необязательно)'>
              <input
                placeholder='https://...'
                value={tabImage}
                onChange={(e) => setTabImage(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label='Текст письма'>
              <textarea
                required
                placeholder='Привет! Добавил новый разбор...'
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={inputCls}
                rows={5}
              />
            </Field>

            {result && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}
              >
                {result.message}
              </div>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className='h-4 w-4' />
                  Отправить рассылку
                </>
              )}
            </button>
          </form>

          <div className='mt-4 text-center'>
            <Link
              href={`/${locale}/admin/published`}
              className='text-sm text-muted-foreground hover:text-foreground'
            >
              ← Назад к табам
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
