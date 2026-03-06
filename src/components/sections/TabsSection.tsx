'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import type { Tab } from '@/types';

const MOCK_TABS: Tab[] = [
  {
    id: '1',
    title: 'Ария — Герой асфальта',
    difficulty: '7/10',
    price: 299,
    description: 'Классическая баллада с красивыми арпеджио и выразительными соло.',
    photo_url: '',
    pdf_url: '',
    purchase_count: 42,
  },
  {
    id: '2',
    title: 'Кино — Звезда по имени Солнце',
    difficulty: '4/10',
    price: 199,
    description: 'Культовая композиция в авторской обработке для соло-гитары.',
    photo_url: '',
    pdf_url: '',
    purchase_count: 87,
  },
  {
    id: '3',
    title: 'Metallica — Nothing Else Matters',
    difficulty: '6/10',
    price: 349,
    description: 'Полная аранжировка акустической версии с intro и всеми частями.',
    photo_url: '',
    pdf_url: '',
    purchase_count: 64,
  },
  {
    id: '4',
    title: 'Гражданская оборона — Всё идёт по плану',
    difficulty: '3/10',
    price: 149,
    description: 'Простая и атмосферная аранжировка для начинающих гитаристов.',
    photo_url: '',
    pdf_url: '',
    purchase_count: 31,
  },
  {
    id: '5',
    title: 'Pink Floyd — Wish You Were Here',
    difficulty: '5/10',
    price: 299,
    description: 'Легендарное intro и полная аранжировка с характерным звучанием.',
    photo_url: '',
    pdf_url: '',
    purchase_count: 55,
  },
  {
    id: '6',
    title: 'Сплин — Романс',
    difficulty: '5/10',
    price: 249,
    description: 'Нежная романтичная пьеса с классическими гармониями.',
    photo_url: '',
    pdf_url: '',
    purchase_count: 28,
  },
];

export { MOCK_TABS };

function getDifficultyColor(difficulty: string) {
  const num = parseInt(difficulty);
  if (num <= 3) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (num <= 6) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

function TabCard({ tab }: { tab: Tab }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className='overflow-hidden h-full flex flex-col border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors'>
        {/* Photo */}
        <div className='aspect-video bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900 flex items-center justify-center'>
          <Music className='h-12 w-12 text-amber-400' strokeWidth={1} />
        </div>

        <CardContent className='p-5 flex flex-col flex-1 gap-3'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='font-semibold text-base leading-tight'>{tab.title}</h3>
            <span
              className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(tab.difficulty)}`}
            >
              {tab.difficulty}
            </span>
          </div>

          <p className='text-sm text-muted-foreground flex-1 leading-relaxed'>{tab.description}</p>

          <div className='flex items-center justify-between mt-auto pt-3 border-t border-border'>
            <span className='text-lg font-bold'>{tab.price} ₽</span>
            <Button
              size='sm'
              className='bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5'
            >
              Купить
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TabsSection() {
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
            Каталог
          </span>
          <h2 className='text-3xl sm:text-4xl font-bold mt-2'>Все табы</h2>
          <p className='text-muted-foreground mt-3 max-w-xl mx-auto'>
            После оплаты таб придёт на твою почту в формате PDF
          </p>
        </motion.div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {MOCK_TABS.map((tab, i) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <TabCard tab={tab} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
