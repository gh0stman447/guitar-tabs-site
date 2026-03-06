'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Tab } from '@/types';

const MOCK_TABS: Tab[] = [
  {
    id: '1',
    title: 'Ария — Герой асфальта',
    difficulty: '7/10',
    price: 299,
    description: 'Классическая баллада с красивыми арпеджио и выразительными соло.',
    photo_url: '',
    files: { pdf: '', gp5: '', gpx: '' },
    purchase_count: 42,
  },
  {
    id: '2',
    title: 'Кино — Звезда по имени Солнце',
    difficulty: '4/10',
    price: 199,
    description: 'Культовая композиция в авторской обработке для соло-гитары.',
    photo_url: '',
    files: { pdf: '', gpx: '', mp3: '' },
    purchase_count: 87,
  },
  {
    id: '3',
    title: 'Metallica — Nothing Else Matters',
    difficulty: '6/10',
    price: 349,
    description: 'Полная аранжировка акустической версии с intro и всеми частями.',
    photo_url: '',
    files: { pdf: '', gp5: '', gpx: '', mp3: '' },
    purchase_count: 64,
  },
  {
    id: '4',
    title: 'Гражданская оборона — Всё идёт по плану',
    difficulty: '3/10',
    price: 149,
    description: 'Простая и атмосферная аранжировка для начинающих гитаристов.',
    photo_url: '',
    files: { pdf: '' },
    purchase_count: 31,
  },
  {
    id: '5',
    title: 'Pink Floyd — Wish You Were Here',
    difficulty: '5/10',
    price: 299,
    description: 'Легендарное intro и полная аранжировка с характерным звучанием.',
    photo_url: '',
    files: { pdf: '', gp5: '', mp3: '' },
    purchase_count: 55,
  },
  {
    id: '6',
    title: 'Сплин — Романс',
    difficulty: '5/10',
    price: 249,
    description: 'Нежная романтичная пьеса с классическими гармониями.',
    photo_url: '',
    files: { pdf: '', gpx: '' },
    purchase_count: 28,
  },
];

export { MOCK_TABS };

type SortKey = 'title' | 'difficulty' | 'price' | 'popular';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Популярность' },
  { value: 'title', label: 'Название' },
  { value: 'difficulty', label: 'Сложность' },
  { value: 'price', label: 'Цена' },
];

function getDifficultyColor(difficulty: string) {
  const num = parseInt(difficulty);
  if (num <= 3) return 'border border-green-500 text-green-600 dark:text-green-400';
  if (num <= 6) return 'border border-amber-500 text-amber-600 dark:text-amber-400';
  return 'border border-red-500 text-red-600 dark:text-red-400';
}

function TabCard({ tab }: { tab: Tab }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4 }}
    >
      <Card className='overflow-hidden h-full flex flex-col border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors'>
        <div className='aspect-video bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900 flex items-center justify-center'>
          <Music className='h-12 w-12 text-amber-400' strokeWidth={1} />
        </div>

        <CardContent className='p-5 flex flex-col flex-1 gap-3'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='font-semibold text-base leading-tight'>{tab.title}</h3>
            <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(tab.difficulty)}`}>
              {tab.difficulty}
            </span>
          </div>

          <p className='text-sm text-muted-foreground flex-1 leading-relaxed'>{tab.description}</p>

          <div className='flex flex-wrap gap-1'>
            {(Object.keys(tab.files) as Array<keyof typeof tab.files>).map((fmt) => (
              <span key={fmt} className='text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono uppercase'>
                {fmt}
              </span>
            ))}
          </div>

          <div className='flex items-center justify-between mt-auto pt-3 border-t border-border'>
            <span className='text-lg font-bold'>{tab.price} ₽</span>
            <Button size='sm' className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5'>
              Купить
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TabsSection() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const [asc, setAsc] = useState(false);

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
    const result = q ? MOCK_TABS.filter((t) => t.title.toLowerCase().includes(q)) : [...MOCK_TABS];
    const dir = asc ? 1 : -1;

    result.sort((a, b) => {
      if (sort === 'title') return dir * a.title.localeCompare(b.title, 'ru');
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
          <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>Каталог</span>
          <h2 className='text-3xl sm:text-4xl font-bold mt-2'>Все табы</h2>
          <p className='text-muted-foreground mt-3 max-w-xl mx-auto'>
            После оплаты таб придёт на твою почту в выбранных форматах
          </p>
        </motion.div>

        {/* Search + Sort */}
        <div className='flex flex-col gap-3 mb-8'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Поиск по названию...'
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
                  className={`flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-border text-muted-foreground hover:border-amber-500 hover:text-foreground bg-background'
                  }`}
                >
                  {opt.label}
                  {active && (asc ? <ChevronUp className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />)}
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
                  className='flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium border border-border text-muted-foreground hover:border-red-400 hover:text-red-500 bg-background transition-colors'
                >
                  <X className='h-3 w-3' />
                  Сбросить
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results count */}
        {search && (
          <p className='text-sm text-muted-foreground mb-6'>
            {filtered.length === 0 ? 'Ничего не найдено' : `Найдено: ${filtered.length}`}
          </p>
        )}

        <motion.div layout className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          <AnimatePresence mode='popLayout'>
            {filtered.map((tab) => (
              <TabCard key={tab.id} tab={tab} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
