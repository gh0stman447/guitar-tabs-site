'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Tab } from '@/types';
import { TabCard, TabCardSkeleton } from '@/components/shared/TabCard';
import { supabase } from '@/lib/supabase';

type SortKey = 'title' | 'difficulty' | 'price' | 'popular';

export function TabsSection() {
  const t = useTranslations('tabs');
  const locale = useLocale();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const [asc, setAsc] = useState(false);

  useEffect(() => {
    supabase
      .from('guitar-tabs')
      .select('*')
      .eq('is_published', true)
      .then(({ data }) => {
        if (data) setTabs(data as Tab[]);
        setLoading(false);
      });
  }, []);

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'popular', label: t('sortPopular') },
    { value: 'title', label: t('sortTitle') },
    { value: 'difficulty', label: t('sortDifficulty') },
    { value: 'price', label: t('sortPrice') },
  ];

  const isDirty = search !== '' || sort !== 'popular' || asc;

  function reset() {
    setSearch('');
    setSort('popular');
    setAsc(false);
  }

  function handleSort(key: SortKey) {
    if (sort === key) {
      setAsc((v) => !v);
    } else {
      setSort(key);
      setAsc(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = q
      ? tabs.filter(
          (tab) => tab.title_ru.toLowerCase().includes(q) || tab.title_en.toLowerCase().includes(q),
        )
      : [...tabs];
    const dir = asc ? 1 : -1;

    result.sort((a, b) => {
      if (sort === 'title') return dir * a.title_ru.localeCompare(b.title_ru, 'ru');
      if (sort === 'difficulty') return dir * (parseInt(a.difficulty) - parseInt(b.difficulty));
      if (sort === 'price') return dir * (a.price - b.price);
      if (sort === 'popular') return dir * (a.purchase_count - b.purchase_count);
      return 0;
    });

    return result;
  }, [tabs, search, sort, asc]);

  return (
    <section id='tabs' className='py-24 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-6xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='text-center mb-12'
        >
          <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>
            {t('badge')}
          </span>
          <h2 className='text-3xl sm:text-4xl font-bold mt-2'>{t('title')}</h2>
          <p className='text-muted-foreground mt-3 max-w-xl mx-auto'>{t('description')}</p>
        </motion.div>

        {/* Search + Sort */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className='flex flex-col gap-3 mb-8'
        >
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className='w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors'
            />
          </div>

          <div className='flex flex-wrap gap-2'>
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSort(opt.value)}
                  className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-border text-muted-foreground hover:border-amber-500 hover:text-foreground bg-background'
                  }`}
                >
                  {opt.label}
                  {active &&
                    (asc ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />)}
                </button>
              );
            })}

            <AnimatePresence>
              {isDirty && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={reset}
                  className='flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium border border-border text-muted-foreground hover:border-red-400 hover:text-red-500 bg-background transition-colors cursor-pointer'
                >
                  <X className='h-3 w-3' />
                  {t('reset')}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results count */}
        {search && (
          <p className='text-sm text-muted-foreground mb-6'>
            {filtered.length === 0 ? t('notFound') : t('found', { count: filtered.length })}
          </p>
        )}

        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <TabCardSkeleton key={i} showDetails />
            ))}
          </div>
        ) : filtered.length === 0 && !search ? (
          <p className='text-center text-muted-foreground py-12'>{t('empty')}</p>
        ) : (
          <motion.div layout className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            <AnimatePresence mode='popLayout'>
              {filtered.map((tab, i) => (
                <TabCard key={tab.id} tab={tab} locale={locale} buyLabel={t('buy')} showDetails index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
