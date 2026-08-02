'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
import { TrendingUp } from 'lucide-react';
import { TabCard } from '@/components/shared/TabCard';
import { usePreviewBlock } from '@/context/PreviewBlockContext';
import type { Tab } from '@/types';

export function BestsellerSection({ initialTabs }: { initialTabs: Tab[] }) {
  const t = useTranslations('bestseller');
  const locale = useLocale();
  const isTouch = useIsTouch();
  const duration = isTouch ? 0.5 / 1.5 : 0.5;
  const cardDuration = isTouch ? 0.7 / 1.5 : 0.7;
  const topTabs = initialTabs
    .filter((tab) => (tab.purchase_count ?? 0) > 0)
    .sort((a, b) => (b.purchase_count ?? 0) - (a.purchase_count ?? 0))
    .slice(0, 3);
  const { flippingTabId } = usePreviewBlock();

  if (topTabs.length === 0) return null;

  return (
    <section className='section-warm py-12 sm:py-24'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration }}
          className='text-center mb-12'
        >
          <div className='flex items-center justify-center gap-2 mb-2'>
            <TrendingUp className='h-4 w-4 text-primary' />
            <span className='text-primary text-sm font-medium tracking-widest uppercase'>
              {t('badge')}
            </span>
          </div>
          <h2 className='text-3xl sm:text-4xl font-bold'>{t('title')}</h2>
        </motion.div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {topTabs.map((tab, i) => (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: cardDuration,
                  delay: i * 0.1,
                }}
                style={{
                  zIndex: flippingTabId === `bestseller-${tab.id}` ? 100 : 0,
                }}
              >
                <TabCard
                  tab={tab}
                  index={i}
                  locale={locale}
                  buyLabel={t('buy')}
                  showRank={i === 0}
                  purchasesLabel={t('purchases', { count: tab.purchase_count })}
                  showDetails={false}
                  tooltipPrefix='bestseller'
                  sectionPrefix='bestseller'
                  disableAnimations={isTouch}
                />
              </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
