'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { BuyDialog } from '@/components/shared/BuyDialog';
import { Loader2, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import type { Tab } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function DraftsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ru';

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [testTab, setTestTab] = useState<Tab | null>(null);

  useEffect(() => {
    if (!document.cookie.includes('admin_session=')) {
      router.replace('/');
      return;
    }
    supabase
      .from('guitar-tabs')
      .select('*')
      .eq('is_published', false)
      .then(({ data }) => {
        if (data) setTabs(data as Tab[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function publish(id: string) {
    setPublishing(id);
    const res = await fetch('/api/admin/publish-tab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setTabs((prev) => prev.filter((t) => t.id !== id));
    setPublishing(null);
  }

  if (typeof document !== 'undefined' && !document.cookie.includes('admin_session=')) return null;

  return (
    <div className='min-h-screen bg-secondary/20'>
      <Header isAdminPanelHeader />
      <div className='max-w-4xl mx-auto px-4 pt-24 pb-12'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold'>Черновики</h1>
            <p className='text-sm text-muted-foreground'>Табы, ожидающие публикации</p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/admin`)}
            className='text-sm text-amber-500 hover:text-amber-400 transition-colors cursor-pointer'
          >
            Добавить таб
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : tabs.length === 0 ? (
          <div className='text-center py-20 text-muted-foreground'>Нет черновиков</div>
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
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <button
                    onClick={() => setTestTab(tab)}
                    className='flex items-center gap-1.5 border border-border hover:border-amber-400 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                  >
                    <ShoppingCart className='h-3.5 w-3.5' />
                    Тест оплаты
                  </button>
                  <button
                    onClick={() => publish(tab.id)}
                    disabled={publishing === tab.id}
                    className='flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer'
                  >
                    {publishing === tab.id ? (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      <CheckCircle2 className='h-3.5 w-3.5' />
                    )}
                    Опубликовать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {testTab && (
        <BuyDialog
          tab={testTab}
          locale={locale}
          open={!!testTab}
          onOpenChange={(open) => {
            if (!open) setTestTab(null);
          }}
          testMode
        />
      )}
    </div>
  );
}
