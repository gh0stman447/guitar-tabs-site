'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Music, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isAdminAuthed } from '@/lib/admin-auth';
import { Field, inputCls, DropZone, FORMAT_ACCEPT } from '@/components/admin/AdminFormFields';
import type { Tab } from '@/types';
import { FORMATS } from '@/types';

export default function EditTabPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const tabId = params.id as string;

  const [tab, setTab] = useState<Tab | null>(null);
  const [loadingTab, setLoadingTab] = useState(true);

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

  useEffect(() => {
    if (!isAdminAuthed()) {
      router.replace('/');
      return;
    }
    supabase
      .from('guitar-tabs')
      .select('*')
      .eq('id', tabId)
      .single()
      .then(({ data }) => {
        if (data) {
          const t = data as Tab;
          setTab(t);
          setTitleRu(t.title_ru);
          setTitleEn(t.title_en);
          setDescRu(t.description_ru ?? '');
          setDescEn(t.description_en ?? '');
          setDifficulty(t.difficulty);
          setPrice(String(t.price));
          setYoutubeUrl(t.youtube_url ?? '');
        }
        setLoadingTab(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  if (typeof document !== 'undefined' && !isAdminAuthed()) return null;

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
    formData.append('price', price);
    formData.append('youtube_url', youtubeUrl);
    formData.append('existing_files', JSON.stringify(tab?.files ?? {}));
    if (photo) formData.append('photo', photo);
    for (const [fmt, file] of Object.entries(files)) {
      if (file) formData.append(fmt, file);
    }

    try {
      const res = await fetch('/api/admin/update-tab', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: 'Таб обновлён!' });
        // Refresh tab data
        const { data: updated } = await supabase
          .from('guitar-tabs')
          .select('*')
          .eq('id', tabId)
          .single();
        if (updated) setTab(updated as Tab);
        setFiles({});
        setPhoto(null);
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
      <Header />
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

              <Field label='Фото обложки'>
                <DropZone
                  label='Выберите изображение'
                  accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                  file={photo}
                  onFile={setPhoto}
                  existingLabel={tab.photo_url ? 'Есть обложка' : undefined}
                />
              </Field>

              <div className='flex flex-col gap-2'>
                <p className='text-sm font-medium'>Файлы табов</p>
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
                        existingLabel={
                          tab.files[fmt] ? tab.files[fmt]!.split('/').pop() : undefined
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
                type='submit'
                disabled={loading}
                className='w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer'
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
