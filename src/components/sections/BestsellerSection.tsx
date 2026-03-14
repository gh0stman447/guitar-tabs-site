'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { TabCard } from '@/components/shared/TabCard';
import { TabCardSkeleton } from '@/components/shared/TabCard/TabCardSkeleton';
import { supabase } from '@/lib/supabase';
import type { Tab } from '@/types';

export function BestsellerSection() {
  const t = useTranslations('bestseller');
  const locale = useLocale();
  const [topTabs, setTopTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('guitar-tabs')
      .select('*')
      .eq('is_published', true)
      .order('purchase_count', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) {
          const withPurchases = data.filter((t) => (t.purchase_count ?? 0) > 0);
          setTopTabs(withPurchases as Tab[]);
        }
        setLoading(false);
      });
  }, []);

  if (!loading && topTabs.length === 0) return null;

  return (
    <section className='py-24 px-4 sm:px-6 lg:px-8 bg-secondary/40'>
      <div className='max-w-6xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='text-center mb-12'
        >
          <div className='flex items-center justify-center gap-2 mb-2'>
            <TrendingUp className='h-4 w-4 text-amber-500' />
            <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>
              {t('badge')}
            </span>
          </div>
          <h2 className='text-3xl sm:text-4xl font-bold'>{t('title')}</h2>
        </motion.div>

        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 3 }).map((_, i) => (
              <TabCardSkeleton key={i} showDetails={false} />
            ))}
          </div>
        ) : topTabs.length === 0 ? (
          <p className='text-center text-muted-foreground py-12'>{t('empty')}</p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {topTabs.map((tab, i) => (
              <TabCard
                key={tab.id}
                tab={tab}
                index={i}
                locale={locale}
                buyLabel={t('buy')}
                showRank={i === 0}
                purchasesLabel={t('purchases', { count: tab.purchase_count })}
                showDetails={false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
