'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, Music, Lock, X } from 'lucide-react';
import { Header } from '@/components/shared/Header';

const FORMATS = ['pdf', 'gp5', 'gpx', 'mp3'] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-shadow placeholder:text-muted-foreground";

function DropZone({ label, accept, file, onFile }: {
  label: string;
  accept: Record<string, string[]>;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) onFile(accepted[0]); }, [onFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple: false });
  return (
    <div
      {...getRootProps()}
      className={`flex items-center gap-3 cursor-pointer rounded-lg border border-dashed px-4 py-3 transition-colors ${isDragActive ? 'border-amber-400 bg-amber-500/5' : 'border-border hover:border-amber-400'}`}
    >
      <input {...getInputProps()} />
      <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground truncate flex-1">
        {file ? file.name : (isDragActive ? 'Отпустите файл...' : label)}
      </span>
      {file && (
        <button type="button" onClick={e => { e.stopPropagation(); onFile(null); }} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const FORMAT_ACCEPT: Record<typeof FORMATS[number], Record<string, string[]>> = {
  pdf: { 'application/pdf': ['.pdf'] },
  gp5: { 'application/octet-stream': ['.gp5'] },
  gpx: { 'application/octet-stream': ['.gpx'] },
  mp3: { 'audio/mpeg': ['.mp3'] },
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (document.cookie.includes('admin_session=')) setAuthed(true);
  }, []);
  const [authError, setAuthError] = useState(false);

  const [titleRu, setTitleRu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [difficulty, setDifficulty] = useState('5');
  const [price, setPrice] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [files, setFiles] = useState<Partial<Record<typeof FORMATS[number], File>>>({});

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function tryAuth() {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-lg p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold">Админ-панель</h1>
            <p className="text-sm text-muted-foreground">Введите пароль для входа</p>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(false); }}
              onKeyDown={e => e.key === 'Enter' && tryAuth()}
              className={`${inputCls} ${authError ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {authError && <p className="text-sm text-red-500">Неверный пароль</p>}
            <button
              onClick={tryAuth}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full py-2 text-sm font-medium transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    );
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
        setTitleRu(''); setTitleEn(''); setDescRu(''); setDescEn('');
        setPrice(''); setYoutubeUrl(''); setPhoto(null); setFiles({});
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
    <div className="min-h-screen bg-secondary/20">
      <Header isAdminPanelHeader />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 pt-24">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Music className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Добавить таб</h1>
            <p className="text-sm text-muted-foreground">Заполните данные и загрузите файлы</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-background rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <Field label="Название (рус)">
              <input required placeholder="Название на русском" value={titleRu} onChange={e => setTitleRu(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Название (eng)">
              <input required placeholder="Title in English" value={titleEn} onChange={e => setTitleEn(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Описание (рус)">
              <textarea placeholder="Описание на русском" value={descRu} onChange={e => setDescRu(e.target.value)} className={inputCls} rows={3} />
            </Field>
            <Field label="Описание (eng)">
              <textarea placeholder="Description in English" value={descEn} onChange={e => setDescEn(e.target.value)} className={inputCls} rows={3} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Цена (₽)">
              <input required type="number" placeholder="499" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Сложность (1–10)">
              <input required type="number" min="1" max="10" placeholder="5" value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="YouTube URL (необязательно)">
            <input placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Фото обложки (необязательно)">
            <DropZone
              label="Выберите изображение"
              accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
              file={photo}
              onFile={setPhoto}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Файлы табов <span className="text-muted-foreground font-normal">(хотя бы один)</span></p>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map(fmt => (
                <div key={fmt} className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-bold text-amber-600 uppercase">{fmt}</span>
                  <DropZone
                    label="Выбрать файл"
                    accept={FORMAT_ACCEPT[fmt]}
                    file={files[fmt] ?? null}
                    onFile={f => setFiles(prev => f ? { ...prev, [fmt]: f } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== fmt)))}
                  />
                </div>
              ))}
            </div>
          </div>

          {result && (
            <div className={`rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Загрузка...</> : 'Создать таб'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
