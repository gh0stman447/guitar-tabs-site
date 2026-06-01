'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIsTouch } from '@/hooks/useIsTouch';
import { Header } from '@/components/shared/Header';
import { Loader2, ShoppingCart, CheckCircle2, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TABLE_TABS } from '@/lib/constants';
import { useAdmin } from '@/context/AdminContext';
import { TabCard } from '@/components/shared/TabCard/TabCard';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { LoadingPage } from '@/components/shared/LoadingPage';
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

export default function DraftsPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'ru';
  const router = useRouter();

  const { isAdmin: authed, isLoading } = useAdmin();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmTab, setConfirmTab] = useState<Tab | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tab | null>(null);
  const { addItem, removeItem, hasItem, setTestMode } = useCart();
  const isTouch = useIsTouch();

  useEffect(() => {
    setTestMode(true);
    return () => setTestMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!authed) {
      toast.error('Требуется авторизация');
      router.push(`/${locale}`);
      return;
    }
    supabase
      .from(TABLE_TABS)
      .select('*')
      .eq('is_published', false)
      .then(({ data }) => {
        if (data) setTabs(data as Tab[]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, isLoading, router, locale]);

  async function deleteTab(id: string) {
    setDeleting(id);
    const res = await fetch('/api/admin/delete-tab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setTabs((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  }

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

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!authed) return null;

  return (
    <div className='min-h-screen bg-secondary/20'>
      <Header />
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-bold'>Черновики</h1>
            <p className='text-sm text-muted-foreground'>Табы, ожидающие публикации</p>
          </div>
        </div>

        {loading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : tabs.length === 0 ? (
          <div className='text-center py-20 text-muted-foreground'>Нет черновиков</div>
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
                disableAnimations
                adminActions={
                  <div className='flex items-center gap-1.5'>
                    <Link
                      data-tooltip-id={`dft-edit-${tab.id}`}
                      data-tooltip-content='Изменить'
                      href={`/${locale}/admin/edit/${tab.id}`}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${isTouch ? 'border-amber-400 text-amber-500' : 'border-border text-muted-foreground hover:border-amber-400 hover:text-amber-500'}`}
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </Link>
                    <ReactTooltip
                      id={`dft-edit-${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={isTouch ? 0 : 350}
                    />
                    <button
                      data-tooltip-id={`dft-cart-${tab.id}`}
                      data-tooltip-content={hasItem(tab.id) ? 'Убрать из корзины' : 'В корзину'}
                      onClick={() => {
                        if (hasItem(tab.id)) {
                          removeItem(tab.id);
                          toast(tab.title_ru, { description: 'Убрано из корзины', icon: '🗑️' });
                        } else {
                          addItem(tab);
                          toast(tab.title_ru, { description: 'Добавлено в корзину', icon: '🛒' });
                        }
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors cursor-pointer ${
                        hasItem(tab.id)
                          ? 'border-amber-500 text-amber-500 bg-amber-500/10 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10'
                          : isTouch
                            ? 'border-amber-400 text-amber-500'
                            : 'border-border text-muted-foreground hover:border-amber-400 hover:text-foreground'
                      }`}
                    >
                      {hasItem(tab.id) ? (
                        <Trash2 className='h-3.5 w-3.5' />
                      ) : (
                        <ShoppingCart className='h-3.5 w-3.5' />
                      )}
                    </button>
                    <ReactTooltip
                      id={`dft-cart-${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={350}
                    />
                    <button
                      data-tooltip-id={`dft-del-${tab.id}`}
                      data-tooltip-content='Удалить'
                      onClick={() => setConfirmDelete(tab)}
                      disabled={deleting === tab.id}
                      className={`flex items-center justify-center w-8 h-8 rounded-full border disabled:opacity-60 transition-colors ${deleting === tab.id ? 'cursor-not-allowed' : 'cursor-pointer'} ${isTouch ? 'border-red-400 text-red-500' : 'border-border text-muted-foreground hover:border-red-400 hover:text-red-500'}`}
                    >
                      {deleting === tab.id ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <Trash2 className='h-3.5 w-3.5' />
                      )}
                    </button>
                    <ReactTooltip
                      id={`dft-del-${tab.id}`}
                      place='top'
                      hidden={isTouch}
                      opacity={1}
                      delayShow={isTouch ? 0 : 350}
                    />
                    <button
                      data-tooltip-id={`dft-pub-${tab.id}`}
                      data-tooltip-content={tab.files.pdf ? 'Опубликовать' : 'Нельзя опубликовать: нет PDF файла'}
                      onClick={() => setConfirmTab(tab)}
                      disabled={publishing === tab.id || !tab.files.pdf}
                      className={`flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white transition-colors ${publishing === tab.id || !tab.files.pdf ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {publishing === tab.id ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <CheckCircle2 className='h-3.5 w-3.5' />
                      )}
                    </button>
                    <ReactTooltip
                      id={`dft-pub-${tab.id}`}
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
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Удалить таб?</DialogTitle>
            <DialogDescription>
              <strong>{confirmDelete?.title_ru}</strong> будет удалён навсегда вместе с файлами. Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className='flex gap-3 justify-end mt-2'>
            <Button
              variant='outline'
              className='rounded-full'
              onClick={() => setConfirmDelete(null)}
            >
              Отмена
            </Button>
            <Button
              className='rounded-full bg-red-500 hover:bg-red-600 text-white'
              onClick={() => {
                if (confirmDelete) deleteTab(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmTab}
        onOpenChange={(open) => {
          if (!open) setConfirmTab(null);
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Опубликовать таб?</DialogTitle>
            <DialogDescription>
              <strong>{confirmTab?.title_ru}</strong> станет виден всем пользователям. Это действие
              нельзя отменить отсюда.
            </DialogDescription>
          </DialogHeader>
          <div className='flex gap-3 justify-end mt-2'>
            <Button variant='outline' className='rounded-full' onClick={() => setConfirmTab(null)}>
              Отмена
            </Button>
            <Button
              className='rounded-full bg-amber-500 hover:bg-amber-600 text-white'
              onClick={() => {
                if (confirmTab) publish(confirmTab.id);
                setConfirmTab(null);
              }}
            >
              Опубликовать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
