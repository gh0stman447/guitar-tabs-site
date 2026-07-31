'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Music, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TABLE_TABS } from '@/lib/constants';
import { useAdmin } from '@/context/AdminContext';
import { toast } from 'sonner';
import { Field, inputCls, DropZone, FORMAT_ACCEPT } from '@/components/admin/AdminFormFields';
import { LoadingPage } from '@/components/shared/LoadingPage';
import type { Tab } from '@/types';
import { FORMATS } from '@/types';
import { Tooltip as ReactTooltip } from 'react-tooltip';

export default function EditTabPage() {
  const params = useParams();
  const locale = params.locale as string;
  const tabId = params.id as string;
  const router = useRouter();

  const { isAdmin: authed, isLoading } = useAdmin();
  const [tab, setTab] = useState<Tab | null>(null);
  const [loadingTab, setLoadingTab] = useState(true);

  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [difficulty, setDifficulty] = useState('5/10');
  const [isPaid, setIsPaid] = useState(true);
  const [price, setPrice] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);
  const [files, setFiles] = useState<Partial<Record<(typeof FORMATS)[number], File>>>({});
  const [deletedFormats, setDeletedFormats] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<Record<string, string>>({}); // fmt -> filename

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Проверка обязательных полей для редактирования
  const hasTitles = titleRu.trim() && titleEn.trim();
  const hasPrice = !isPaid || (price.trim() !== '' && Number(price) > 0);
  const hasDifficulty = difficulty.trim();
  // Считаем файлы: существующие минус удалённые плюс новые
  const existingFilesCount = tab
    ? (Object.keys(tab.files) as Array<keyof typeof tab.files>).filter(
        (fmt) => tab.files[fmt] && !deletedFormats.includes(fmt),
      ).length
    : 0;
  const newFilesCount = Object.keys(files).length;
  const hasAtLeastOneFile = existingFilesCount > 0 || newFilesCount > 0;
  const allRequiredFilled = hasTitles && hasPrice && hasDifficulty && hasAtLeastOneFile;
  const isSubmitDisabled = loading || loadingTab || !allRequiredFilled;

  // Формируем сообщение о незаполненных обязательных полях
  const missingFields: string[] = [];
  if (!titleRu.trim()) missingFields.push('Название (рус)');
  if (!titleEn.trim()) missingFields.push('Название (eng)');
  if (isPaid && !hasPrice) missingFields.push('Цена больше 0');
  if (!difficulty.trim()) missingFields.push('Сложность');
  if (!hasAtLeastOneFile) missingFields.push('Файл таба (PDF/GP5/GPX/MP3)');

  useEffect(() => {
    if (isLoading) return;
    if (!authed) {
      toast.error('Требуется авторизация');
      router.push(`/${locale}`);
      return;
    }
    Promise.all([
      supabase.from(TABLE_TABS).select('*').eq('id', tabId).single(),
      fetch(`/api/files/${tabId}/list`)
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([{ data }, fileNames]) => {
      if (data) {
        const t = data as Tab;
        setTab(t);
        setTitleRu(t.title_ru);
        setTitleEn(t.title_en);
        setDescRu(t.description_ru ?? '');
        setDescEn(t.description_en ?? '');
        setDifficulty(t.difficulty);
        setIsPaid(t.price > 0);
        setPrice(String(t.price));
        setYoutubeUrl(t.youtube_url ?? '');
        // Build fileNames map from tab.files (which formats exist)
        const names: Record<string, string> = {};
        for (const [fmt, exists] of Object.entries(t.files || {})) {
          if (exists) {
            // Find filename from fileNames array
            const f = (fileNames as Array<{ format: string; filename: string }>).find(
              (item) => item.format === fmt,
            );
            if (f) names[fmt] = f.filename;
          }
        }
        setFileNames(names);
      }
      setLoadingTab(false);
    });
  }, [authed, isLoading, tabId, router, locale]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!authed) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('id', tabId);
    formData.append('title_ru', titleRu);
    formData.append('title_en', titleEn);
    formData.append('description_ru', descRu);
    formData.append('description_en', descEn);
    formData.append('difficulty', difficulty);
    formData.append('is_free', String(!isPaid));
    formData.append('price', isPaid ? price : '0');
    formData.append('youtube_url', youtubeUrl);
    formData.append('existing_files', JSON.stringify(tab?.files ?? {}));
    formData.append('formats_to_delete', JSON.stringify(deletedFormats));
    formData.append('delete_photo', String(deletePhoto));
    if (photo) formData.append('photo', photo);
    for (const [fmt, file] of Object.entries(files)) {
      if (file) formData.append(fmt, file);
    }

    try {
      const res = await fetch('/api/admin/update-tab', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: 'Таб обновлён!' });
        // Refresh tab data and file names
        Promise.all([
          supabase.from(TABLE_TABS).select('*').eq('id', tabId).single(),
          fetch(`/api/files/${tabId}/list`)
            .then((r) => r.json())
            .catch(() => []),
        ]).then(([{ data: updatedTab }, fileNamesData]) => {
          if (updatedTab) {
            setTab(updatedTab as Tab);
            // Build fileNames map
            const names: Record<string, string> = {};
            for (const [fmt, exists] of Object.entries((updatedTab as Tab).files || {})) {
              if (exists) {
                const f = (fileNamesData as Array<{ format: string; filename: string }>).find(
                  (item) => item.format === fmt,
                );
                if (f) names[fmt] = f.filename;
              }
            }
            setFileNames(names);
          }
        });
        setFiles({});
        setPhoto(null);
        setDeletedFormats([]);
      } else {
        setResult({ ok: false, message: data.error });
      }
    } catch {
      setResult({ ok: false, message: 'Сетевая ошибка' });
    } finally {
      setLoading(false);
    }
  }

  const isPublished = !!(tab as unknown as { is_published?: boolean })?.is_published;
  const backHref = isPublished ? `/${locale}/admin/published` : `/${locale}/admin/drafts`;

  return (
    <div className='min-h-screen bg-secondary/20'>
      <div className='min-h-[calc(100vh-4rem)] py-10 px-4 pt-24'>
        <div className='w-full max-w-2xl mx-auto'>
          <div className='flex items-center gap-3 mb-8'>
            <Link
              href={backHref}
              className='flex items-center justify-center w-9 h-9 rounded-full border border-border hover:border-amber-500 text-muted-foreground hover:text-foreground transition-colors'
            >
              <ArrowLeft className='h-4 w-4' />
            </Link>
            <div className='w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center'>
              <Music className='h-5 w-5 text-amber-500' />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>Редактировать таб</h1>
              <p className='text-sm text-muted-foreground'>
                {isPublished ? 'Опубликован' : 'Черновик'}
              </p>
            </div>
          </div>

          {loadingTab ? (
            <div className='flex justify-center py-20'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : !tab ? (
            <div className='text-center py-20 text-muted-foreground'>Таб не найден</div>
          ) : (
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

              <Field label='Тип таба'>
                <div className='grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1'>
                  <button
                    type='button'
                    aria-pressed={isPaid}
                    onClick={() => setIsPaid(true)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isPaid
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Платный
                  </button>
                  <button
                    type='button'
                    aria-pressed={!isPaid}
                    onClick={() => {
                      setIsPaid(false);
                      setFiles((current) =>
                        Object.fromEntries(
                          Object.entries(current).filter(([format]) => format !== 'mp3'),
                        ),
                      );
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      !isPaid
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Бесплатный
                  </button>
                </div>
              </Field>

              <div className={`grid gap-4 ${isPaid ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {isPaid && (
                  <Field label='Цена (₽)'>
                    <input
                      required
                      min='1'
                      type='number'
                      placeholder='499'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                )}
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

              <Field label='Фото обложки'>
                <div className='flex items-end gap-3'>
                  <div className='flex-1'>
                    <DropZone
                      label='Выберите изображение'
                      accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                      file={photo}
                      onFile={setPhoto}
                      existingLabel={tab.photo_url && !deletePhoto ? 'Есть обложка' : undefined}
                    />
                  </div>
                  {tab.photo_url && !deletePhoto && (
                    <button
                      type='button'
                      onClick={() => setDeletePhoto(true)}
                      className='flex items-center justify-center w-10 h-10 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer mb-1'
                      title='Удалить обложку'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {deletePhoto && (
                  <p className='text-xs text-amber-500 mt-1'>
                    Обложка будет удалена после сохранения
                  </p>
                )}
              </Field>

              <div className='flex flex-col gap-2'>
                <p className='text-sm font-medium'>Файлы табов</p>
                <div className='grid grid-cols-2 gap-3'>
                  {FORMATS.filter((fmt) => isPaid || fmt !== 'mp3').map((fmt) => (
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
                        existingLabel={
                          tab.files[fmt] && !deletedFormats.includes(fmt)
                            ? fileNames[fmt]
                            : undefined
                        }
                        onDeleteExisting={
                          tab.files[fmt] && !deletedFormats.includes(fmt)
                            ? () => setDeletedFormats((prev) => [...prev, fmt])
                            : undefined
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
                </div>
              )}

              <button
                data-tooltip-id={allRequiredFilled ? undefined : 'submit-disabled-tooltip'}
                data-tooltip-content={
                  allRequiredFilled
                    ? undefined
                    : `Заполните все обязательные поля: ${missingFields.join(', ')}`
                }
                type='submit'
                disabled={isSubmitDisabled}
                className={`w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isSubmitDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить изменения'
                )}
              </button>
              <ReactTooltip
                id='submit-disabled-tooltip'
                place='top'
                hidden={Boolean(allRequiredFilled || loading || loadingTab)}
                opacity={1}
                delayShow={500}
                style={{ fontSize: 13, maxWidth: 300, textAlign: 'center' }}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
