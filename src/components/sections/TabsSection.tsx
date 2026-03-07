'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Tab } from '@/types';
import { MarqueeText } from '@/components/shared/MarqueeText';

const MOCK_TABS: Tab[] = [
  {
    id: '1',
    title_ru: 'Ария — Герой асфальта',
    title_en: 'Aria — Asphalt Hero',
    difficulty: '7/10',
    price: 299,
    description_ru: 'Классическая баллада с красивыми арпеджио и выразительными соло.',
    description_en: 'Classic ballad with beautiful arpeggios and expressive solos.',
    photo_url: '',
    files: { pdf: '', gp5: '', gpx: '' },
    purchase_count: 42,
  },
  {
    id: '2',
    title_ru: 'Кино — Звезда по имени Солнце',
    title_en: 'Kino — Star Called the Sun',
    difficulty: '4/10',
    price: 199,
    description_ru: 'Культовая композиция в авторской обработке для соло-гитары.',
    description_en: 'Iconic composition arranged for solo guitar.',
    photo_url: '',
    files: { pdf: '', gpx: '', mp3: '' },
    purchase_count: 87,
  },
  {
    id: '3',
    title_ru: 'Metallica — Nothing Else Matters',
    title_en: 'Metallica — Nothing Else Matters',
    difficulty: '6/10',
    price: 349,
    description_ru: 'Полная аранжировка акустической версии с intro и всеми частями.',
    description_en: 'Full arrangement of the acoustic version with intro and all sections.',
    photo_url: '',
    files: { pdf: '', gp5: '', gpx: '', mp3: '' },
    purchase_count: 64,
  },
  {
    id: '4',
    title_ru: 'Гражданская оборона — Всё идёт по плану',
    title_en: 'Grazhdanskaya Oborona — Everything Goes as Planned',
    difficulty: '3/10',
    price: 149,
    description_ru: 'Простая и атмосферная аранжировка для начинающих гитаристов.',
    description_en: 'Simple and atmospheric arrangement for beginner guitarists.',
    photo_url: '',
    files: { pdf: '' },
    purchase_count: 31,
  },
  {
    id: '5',
    title_ru: 'Pink Floyd — Wish You Were Here',
    title_en: 'Pink Floyd — Wish You Were Here',
    difficulty: '5/10',
    price: 299,
    description_ru: 'Легендарное intro и полная аранжировка с характерным звучанием.',
    description_en: 'Legendary intro and full arrangement with the signature sound.',
    photo_url: '',
    files: { pdf: '', gp5: '', mp3: '' },
    purchase_count: 55,
  },
  {
    id: '6',
    title_ru: 'Сплин — Романс',
    title_en: 'Splin — Romance',
    difficulty: '5/10',
    price: 249,
    description_ru: 'Нежная романтичная пьеса с классическими гармониями.',
    description_en: 'Tender romantic piece with classic harmonies.',
    photo_url: '',
    files: { pdf: '', gpx: '' },
    purchase_count: 28,
  },
];

export { MOCK_TABS };

type SortKey = 'title' | 'difficulty' | 'price' | 'popular';

function getDifficultyColor(difficulty: string) {
  const num = parseInt(difficulty);
  if (num <= 3) return 'border border-green-500 text-green-600 dark:text-green-400 bg-green-500/10';
  if (num <= 6) return 'border border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10';
  return 'border border-red-500 text-red-600 dark:text-red-400 bg-red-500/10';
}


function TabCard({ tab, buyLabel, locale }: { tab: Tab; buyLabel: string; locale: string }) {
  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Card className='overflow-hidden h-full flex flex-col border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors'>
        <div className='aspect-video bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900 flex items-center justify-center'>
          <Music className='h-12 w-12 text-amber-400' strokeWidth={1} />
        </div>

        <CardContent className='p-5 flex flex-col flex-1 gap-3'>
          <div className='flex items-start justify-between gap-2'>
            <MarqueeText
              text={title}
              className='font-semibold text-base leading-tight flex-1 min-w-0'
              isHovered={hovered}
            />
            <span
              className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(tab.difficulty)}`}
            >
              {tab.difficulty}
            </span>
          </div>

          <MarqueeText
            text={description}
            className='text-sm text-muted-foreground flex-1 leading-relaxed'
            isHovered={hovered}
          />

          <div className='flex flex-wrap gap-1'>
            {(Object.keys(tab.files) as Array<keyof typeof tab.files>).map((fmt) => (
              <span
                key={fmt}
                className='text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono uppercase'
              >
                {fmt}
              </span>
            ))}
          </div>

          <div className='flex items-center justify-between mt-auto pt-3 border-t border-border'>
            <span className='text-lg font-bold'>{tab.price} ₽</span>
            <Button
              size='sm'
              className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5'
            >
              {buyLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TabsSection() {
  const t = useTranslations('tabs');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const [asc, setAsc] = useState(false);

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
      ? MOCK_TABS.filter(
          (t) => t.title_ru.toLowerCase().includes(q) || t.title_en.toLowerCase().includes(q),
        )
      : [...MOCK_TABS];
    const dir = asc ? 1 : -1;

    result.sort((a, b) => {
      if (sort === 'title') return dir * a.title_ru.localeCompare(b.title_ru, 'ru');
      if (sort === 'difficulty') return dir * (parseInt(a.difficulty) - parseInt(b.difficulty));
      if (sort === 'price') return dir * (a.price - b.price);
      if (sort === 'popular') return dir * (a.purchase_count - b.purchase_count);
      return 0;
    });

    return result;
  }, [search, sort, asc]);

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
        <div className='flex flex-col gap-3 mb-8'>
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
        </div>

        {/* Results count */}
        {search && (
          <p className='text-sm text-muted-foreground mb-6'>
            {filtered.length === 0 ? t('notFound') : t('found', { count: filtered.length })}
          </p>
        )}

        <motion.div layout className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          <AnimatePresence mode='popLayout'>
            {filtered.map((tab) => (
              <TabCard key={tab.id} tab={tab} buyLabel={t('buy')} locale={locale} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
