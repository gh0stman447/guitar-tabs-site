'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Music } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { Field, inputCls, DropZone, FORMAT_ACCEPT } from '@/components/admin/AdminFormFields';
import { FORMATS } from '@/types';
import { useAdmin } from '@/context/AdminContext';
import { toast } from 'sonner';
import { LoadingPage } from '@/components/shared/LoadingPage';
import { Tooltip as ReactTooltip } from 'react-tooltip';

export default function CreateTabPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const { isAdmin: authed, isLoading } = useAdmin();
  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [difficulty, setDifficulty] = useState('5/10');
  const [price, setPrice] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [files, setFiles] = useState<Partial<Record<(typeof FORMATS)[number], File>>>({});

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Проверка обязательных полей
  const hasTitles = titleRu.trim() && titleEn.trim();
  const hasPrice = price.trim();
  const hasDifficulty = difficulty.trim();
  const hasAtLeastOneFile = Object.keys(files).length > 0;
  const allRequiredFilled = hasTitles && hasPrice && hasDifficulty && hasAtLeastOneFile;
  const isSubmitDisabled = loading || !allRequiredFilled;

  // Формируем сообщение о незаполненных обязательных полях
  const missingFields: string[] = [];
  if (!titleRu.trim()) missingFields.push('Название (рус)');
  if (!titleEn.trim()) missingFields.push('Название (eng)');
  if (!price.trim()) missingFields.push('Цена');
  if (!difficulty.trim()) missingFields.push('Сложность');
  if (!hasAtLeastOneFile) missingFields.push('Файл таба (PDF/GP5/GPX/MP3)');

  useEffect(() => {
    if (!isLoading && !authed) {
      toast.error('Требуется авторизация');
      router.push(`/${locale}`);
    }
  }, [authed, isLoading, router, locale]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!authed) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('title_ru', titleRu);
    formData.append('title_en', titleEn);
    formData.append('description_ru', descRu);
    formData.append('description_en', descEn);
    formData.append('difficulty', difficulty);
    formData.append('price', price);
    formData.append('youtube_url', youtubeUrl);
    if (photo) formData.append('photo', photo);
    for (const [fmt, file] of Object.entries(files)) {
      if (file) formData.append(fmt, file);
    }

    try {
      const res = await fetch('/api/admin/upload-tab', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Таб создан! ID: ${data.id}` });
        setTitleRu('');
        setTitleEn('');
        setDescRu('');
        setDescEn('');
        setPrice('');
        setYoutubeUrl('');
        setPhoto(null);
        setFiles({});
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
              <Music className='h-5 w-5 text-amber-500' />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>Добавить таб</h1>
              <p className='text-sm text-muted-foreground'>Заполните данные и загрузите файлы</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className='bg-background rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-5'
          >
            <div className='grid grid-cols-2 gap-4'>
              <Field label='Название (рус)'>
                <input
                  required
                  placeholder='Название на русском'
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label='Название (eng)'>
                <input
                  required
                  placeholder='Title in English'
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <Field label='Описание (рус)'>
                <textarea
                  placeholder='Описание на русском'
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                  className={inputCls}
                  rows={3}
                />
              </Field>
              <Field label='Описание (eng)'>
                <textarea
                  placeholder='Description in English'
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className={inputCls}
                  rows={3}
                />
              </Field>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <Field label='Цена (₽)'>
                <input
                  required
                  type='number'
                  placeholder='499'
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label='Сложность'>
                <select
                  required
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={inputCls}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={`${n}/10`}>
                      {n}/10
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label='YouTube URL (необязательно)'>
              <input
                placeholder='https://youtube.com/watch?v=...'
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label='Фото обложки (необязательно)'>
              <DropZone
                label='Выберите изображение'
                accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                file={photo}
                onFile={setPhoto}
              />
            </Field>

            <div className='flex flex-col gap-2'>
              <p className='text-sm font-medium'>
                Файлы табов{' '}
                <span className='text-muted-foreground font-normal'>(хотя бы один)</span>
              </p>
              <div className='grid grid-cols-2 gap-3'>
                {FORMATS.map((fmt) => (
                  <div key={fmt} className='flex flex-col gap-1'>
                    <span className='text-xs font-mono font-bold text-amber-600 uppercase'>
                      {fmt}
                    </span>
                    <DropZone
                      label='Выбрать файл'
                      accept={FORMAT_ACCEPT[fmt]}
                      file={files[fmt] ?? null}
                      onFile={(f) =>
                        setFiles((prev) =>
                          f
                            ? { ...prev, [fmt]: f }
                            : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== fmt)),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {result && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}
              >
                {result.message}
                {result.ok && (
                  <Link
                    href='/ru/admin/drafts'
                    className='ml-2 underline underline-offset-2 font-medium'
                  >
                    Перейти в черновики →
                  </Link>
                )}
              </div>
            )}

            <button
              data-tooltip-id={allRequiredFilled ? undefined : 'submit-disabled-tooltip'}
              data-tooltip-content={allRequiredFilled ? undefined : `Заполните все обязательные поля: ${missingFields.join(', ')}`}
              type='submit'
              disabled={isSubmitDisabled}
              className={`w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isSubmitDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Загрузка...
                </>
              ) : (
                'Создать таб'
              )}
            </button>
            <ReactTooltip
              id='submit-disabled-tooltip'
              place='top'
              hidden={Boolean(allRequiredFilled || loading)}
              opacity={1}
              delayShow={500}
              style={{ fontSize: 13, maxWidth: 300, textAlign: 'center' }}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
