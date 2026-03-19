'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useIsTouch } from '@/hooks/useIsTouch';
import { Header } from '@/components/shared/Header';
import { Loader2, EyeOff, Pencil } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TABLE_TABS } from '@/lib/constants';
import { useAdmin } from '@/context/AdminContext';
import { TabCard } from '@/components/shared/TabCard/TabCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import type { Tab } from '@/types';

export default function PublishedPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ru';

  const { isAdmin: authed } = useAdmin();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [confirmTab, setConfirmTab] = useState<Tab | null>(null);
  const isTouch = useIsTouch();

  useEffect(() => {
    if (!authed) return;
    supabase
      .from(TABLE_TABS)
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setTabs(data as Tab[]);
        setLoading(false);
      });
  }, [authed]);

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

  if (!authed) return null;

  return (
    <div className='min-h-screen bg-secondary/20'>
      <Header />
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12'>
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
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {tabs.map((tab, i) => (
              <TabCard
                key={tab.id}
                tab={tab}
                locale={locale}
                buyLabel=''
                index={i}
                purchasesLabel={`${tab.purchase_count ?? 0} покупок`}
                adminActions={
                  <div className='flex items-center gap-1.5'>
                    <Link
                      data-tooltip-id={`pub-edit-${tab.id}`}
                      data-tooltip-content='Изменить'
                      href={`/${locale}/admin/edit/${tab.id}`}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${isTouch ? 'border-amber-400 text-amber-500' : 'border-border text-muted-foreground hover:border-amber-400 hover:text-amber-500'}`}
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </Link>
                    <ReactTooltip
                      id={`pub-edit-${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={isTouch ? 0 : 350}
                    />
                    <button
                      data-tooltip-id={`pub-hide-${tab.id}`}
                      data-tooltip-content='Снять с публикации'
                      onClick={() => setConfirmTab(tab)}
                      disabled={unpublishing === tab.id}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border disabled:opacity-60 transition-colors cursor-pointer ${isTouch ? 'border-red-400 text-red-500' : 'border-border text-muted-foreground hover:border-red-400 hover:text-red-500'}`}
                    >
                      {unpublishing === tab.id ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <EyeOff className='h-3.5 w-3.5' />
                      )}
                    </button>
                    <ReactTooltip
                      id={`pub-hide-${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={isTouch ? 0 : 350}
                    />
                  </div>
                }
              />
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
