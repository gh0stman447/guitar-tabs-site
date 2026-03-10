'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Loader2, EyeOff, Pencil } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Tab } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function PublishedPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ru';

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [confirmTab, setConfirmTab] = useState<Tab | null>(null);

  useEffect(() => {
    if (!document.cookie.includes('admin_session=')) {
      router.replace('/');
      return;
    }
    supabase
      .from('guitar-tabs')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setTabs(data as Tab[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unpublish(id: string) {
    setUnpublishing(id);
    const res = await fetch('/api/admin/unpublish-tab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setTabs((prev) => prev.filter((t) => t.id !== id));
    setUnpublishing(null);
  }

  if (typeof document !== 'undefined' && !document.cookie.includes('admin_session=')) return null;

  return (
    <div className='min-h-screen bg-secondary/20'>
      <Header />
      <div className='max-w-4xl mx-auto px-4 pt-24 pb-12'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold'>Опубликованные</h1>
            <p className='text-sm text-muted-foreground'>Табы, доступные пользователям</p>
          </div>
        </div>

        {loading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : tabs.length === 0 ? (
          <div className='text-center py-20 text-muted-foreground'>Нет опубликованных табов</div>
        ) : (
          <div className='flex flex-col gap-4'>
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className='bg-background rounded-2xl border border-border p-4 flex items-center gap-4'
              >
                {tab.photo_url ? (
                  <img
                    src={tab.photo_url}
                    alt=''
                    className='w-16 h-16 rounded-lg object-cover shrink-0'
                  />
                ) : (
                  <div className='w-16 h-16 rounded-lg bg-secondary shrink-0' />
                )}
                <div className='flex-1 min-w-0'>
                  <p className='font-semibold truncate'>{tab.title_ru}</p>
                  <p className='text-sm text-muted-foreground truncate'>{tab.title_en}</p>
                  <div className='flex items-center gap-3 mt-1'>
                    <span className='text-xs text-amber-500'>{tab.difficulty}</span>
                    <span className='text-xs text-muted-foreground'>{tab.price} ₽</span>
                    <span className='text-xs text-muted-foreground'>
                      {Object.keys(tab.files).join(', ').toUpperCase()}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {tab.purchase_count ?? 0} покупок
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <Link
                    href={`/${locale}/admin/edit/${tab.id}`}
                    className='flex items-center gap-1.5 border border-border hover:border-amber-400 hover:text-amber-500 text-muted-foreground rounded-full px-4 py-1.5 text-sm font-medium transition-colors'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                    Изменить
                  </Link>
                  <button
                    onClick={() => setConfirmTab(tab)}
                    disabled={unpublishing === tab.id}
                    className='flex items-center gap-1.5 border border-border hover:border-red-400 hover:text-red-500 disabled:opacity-60 text-muted-foreground rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer'
                  >
                    {unpublishing === tab.id ? (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      <EyeOff className='h-3.5 w-3.5' />
                    )}
                    Снять
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!confirmTab}
        onOpenChange={(open) => {
          if (!open) setConfirmTab(null);
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Снять с публикации?</DialogTitle>
            <DialogDescription>
              <strong>{confirmTab?.title_ru}</strong> станет недоступен пользователям и переместится
              в черновики.
            </DialogDescription>
          </DialogHeader>
          <div className='flex gap-3 justify-end mt-2'>
            <Button variant='outline' className='rounded-full' onClick={() => setConfirmTab(null)}>
              Отмена
            </Button>
            <Button
              className='rounded-full bg-red-500 hover:bg-red-600 text-white'
              onClick={() => {
                if (confirmTab) unpublish(confirmTab.id);
                setConfirmTab(null);
              }}
            >
              Снять
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
