'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
import { Search, ChevronUp, ChevronDown, Gift, X } from 'lucide-react';
import type { Tab } from '@/types';
import { TabCard, TabCardSkeleton } from '@/components/shared/TabCard';
import { supabase } from '@/lib/supabase';
import { usePreviewBlock } from '@/context/PreviewBlockContext';
import {
  TABLE_TABS,
  DISCOUNT_TIER_1_MIN,
  DISCOUNT_TIER_1_RATE,
  DISCOUNT_TIER_2_MIN,
  DISCOUNT_TIER_2_RATE,
} from '@/lib/constants';

type SortKey = 'title' | 'difficulty' | 'price' | 'popular' | 'date';

export function TabsSection() {
  const t = useTranslations('tabs');
  const locale = useLocale();
  const isTouch = useIsTouch();
  const headerDuration = isTouch ? 0.5 / 1.5 : 0.5;
  const cardDuration = 0.2;
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const [asc, setAsc] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const { flippingTabId } = usePreviewBlock();

  useEffect(() => {
    supabase
      .from(TABLE_TABS)
      .select('*')
      .eq('is_published', true)
      .then(({ data }) => {
        if (data) setTabs(data as Tab[]);
        setLoading(false);
      });
  }, []);

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'popular', label: t('sortPopular') },
    { value: 'date', label: t('sortDate') },
    { value: 'title', label: t('sortTitle') },
    { value: 'difficulty', label: t('sortDifficulty') },
    ...(!freeOnly ? [{ value: 'price' as const, label: t('sortPrice') }] : []),
  ];

  const isDirty = search !== '' || sort !== 'popular' || asc || freeOnly;

  function reset() {
    setSearch('');
    setSort('popular');
    setAsc(false);
    setFreeOnly(false);
  }

  function handleSort(key: SortKey) {
    if (sort === key) {
      setAsc((v) => !v);
    } else {
      setSort(key);
      setAsc(false);
    }
  }

  function handleFreeOnlyChange() {
    setFreeOnly((current) => {
      const next = !current;
      if (next && sort === 'price') {
        setSort('popular');
        setAsc(false);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchingSearch = q
      ? tabs.filter(
          (tab) => tab.title_ru.toLowerCase().includes(q) || tab.title_en.toLowerCase().includes(q),
        )
      : [...tabs];
    const result = freeOnly ? matchingSearch.filter((tab) => tab.price <= 0) : matchingSearch;
    const dir = asc ? 1 : -1;

    result.sort((a, b) => {
      if (sort === 'title') return dir * a.title_ru.localeCompare(b.title_ru, 'ru');
      if (sort === 'difficulty') return dir * (parseInt(a.difficulty) - parseInt(b.difficulty));
      if (sort === 'price') return dir * (a.price - b.price);
      if (sort === 'date') {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dir * (aDate - bDate);
      }
      if (sort === 'popular') {
        const aPopularity = a.price <= 0 ? (a.download_count ?? 0) : (a.purchase_count ?? 0);
        const bPopularity = b.price <= 0 ? (b.download_count ?? 0) : (b.purchase_count ?? 0);
        return dir * (aPopularity - bPopularity);
      }
      return 0;
    });

    return result;
  }, [tabs, search, sort, asc, freeOnly]);

  const paidTabsCount = tabs.filter((tab) => tab.price > 0).length;

  return (
    <section id='tabs' className='py-12 sm:py-24'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: headerDuration }}
          className='text-center mb-12'
        >
          <span className='text-primary text-sm font-medium tracking-widest uppercase'>
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
          transition={{ duration: headerDuration * 0.8, delay: 0.15 }}
          className='flex flex-col gap-3 mb-8'
        >
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className='w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'
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
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground bg-background'
                  }`}
                >
                  {opt.label}
                  {active &&
                    (asc ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />)}
                </button>
              );
            })}

            <button
              type='button'
              aria-pressed={freeOnly}
              onClick={handleFreeOnlyChange}
              className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                freeOnly
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-foreground bg-background'
              }`}
            >
              <Gift className='h-3 w-3' />
              {t('freeOnly')}
            </button>

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

        {/* Discount promo */}
        {!loading && paidTabsCount >= DISCOUNT_TIER_2_MIN && (
          <p className='text-xs text-muted-foreground/60 mb-6'>
            {locale === 'en'
              ? `🎸 Buy ${DISCOUNT_TIER_1_MIN} tabs — get ${DISCOUNT_TIER_1_RATE * 100}% off, buy ${DISCOUNT_TIER_2_MIN} or more — get ${DISCOUNT_TIER_2_RATE * 100}% off`
              : `🎸 При покупке от ${DISCOUNT_TIER_1_MIN} табов — скидка ${DISCOUNT_TIER_1_RATE * 100}%, при покупке ${DISCOUNT_TIER_2_MIN} и более — скидка ${DISCOUNT_TIER_2_RATE * 100}%`}
          </p>
        )}
        {!loading &&
          paidTabsCount >= DISCOUNT_TIER_1_MIN &&
          paidTabsCount < DISCOUNT_TIER_2_MIN && (
          <p className='text-xs text-muted-foreground/60 mb-6'>
            {locale === 'en'
              ? `🎸 Buy ${DISCOUNT_TIER_1_MIN} tabs — get ${DISCOUNT_TIER_1_RATE * 100}% off`
              : `🎸 При покупке от ${DISCOUNT_TIER_1_MIN} табов — скидка ${DISCOUNT_TIER_1_RATE * 100}%`}
          </p>
        )}

        {/* Results count */}
        {(search || freeOnly) && (
          <p className='text-sm text-muted-foreground mb-6'>
            {filtered.length === 0 ? t('notFound') : t('found', { count: filtered.length })}
          </p>
        )}

        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 xl:gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <TabCardSkeleton key={i} showDetails />
            ))}
          </div>
        ) : tabs.length === 0 ? (
          <p className='text-center text-muted-foreground py-12'>{t('empty')}</p>
        ) : filtered.length === 0 ? (
          <p className='text-center text-muted-foreground py-12'>{t('notFound')}</p>
        ) : isTouch ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 xl:gap-6'>
            {filtered.map((tab) => (
              <div
                key={tab.id}
                style={{
                  zIndex: flippingTabId === `catalog-${tab.id}` ? 100 : 0,
                }}
              >
                <TabCard
                  tab={tab}
                  locale={locale}
                  buyLabel={t('buy')}
                  showDetails
                  index={filtered.indexOf(tab)}
                  tooltipPrefix='catalog'
                  sectionPrefix='catalog'
                  disableAnimations={isTouch}
                />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 xl:gap-6'
          >
            <AnimatePresence>
              {filtered.map((tab) => (
                <motion.div
                  key={tab.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: cardDuration }}
                  style={{
                    zIndex: flippingTabId === `catalog-${tab.id}` ? 100 : 0,
                  }}
                >
                  <TabCard
                    tab={tab}
                    locale={locale}
                    buyLabel={t('buy')}
                    showDetails
                    index={filtered.indexOf(tab)}
                    tooltipPrefix='catalog'
                    sectionPrefix='catalog'
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
