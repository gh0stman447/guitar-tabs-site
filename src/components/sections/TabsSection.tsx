'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
import { Search, ChevronUp, ChevronDown, ArrowUpDown, Gift, Guitar, X } from 'lucide-react';
import { TAB_TECHNIQUES, TAB_TUNINGS, type Tab, type TabTechnique, type TabTuning } from '@/types';
import { TabCard } from '@/components/shared/TabCard';
import { usePreviewBlock } from '@/context/PreviewBlockContext';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { normalizeTabCharacteristics } from '@/lib/tab-characteristics';
import {
  DISCOUNT_TIER_1_MIN,
  DISCOUNT_TIER_1_RATE,
  DISCOUNT_TIER_2_MIN,
  DISCOUNT_TIER_2_RATE,
} from '@/lib/constants';

type SortKey = 'title' | 'difficulty' | 'price' | 'popular' | 'date';
type TuningFilter = 'all' | TabTuning;
type CapoFilter = 'all' | 'without' | 'with';

export function TabsSection({ initialTabs }: { initialTabs: Tab[] }) {
  const t = useTranslations('tabs');
  const locale = useLocale();
  const isTouch = useIsTouch();
  const headerDuration = isTouch ? 0.5 / 1.5 : 0.5;
  const cardDuration = 0.2;
  const tabs = initialTabs;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('popular');
  const [asc, setAsc] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [techniques, setTechniques] = useState<TabTechnique[]>([]);
  const [tuning, setTuning] = useState<TuningFilter>('all');
  const [capo, setCapo] = useState<CapoFilter>('all');
  const { flippingTabId } = usePreviewBlock();

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'popular', label: t('sortPopular') },
    { value: 'date', label: t('sortDate') },
    { value: 'title', label: t('sortTitle') },
    { value: 'difficulty', label: t('sortDifficulty') },
    ...(!freeOnly ? [{ value: 'price' as const, label: t('sortPrice') }] : []),
  ];
  const activeSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label;

  const characteristicsFilterCount = techniques.length + Number(tuning !== 'all') + Number(capo !== 'all');
  const isDirty =
    search !== '' ||
    sort !== 'popular' ||
    asc ||
    freeOnly ||
    characteristicsFilterCount > 0;

  function reset() {
    setSearch('');
    setSort('popular');
    setAsc(false);
    setFreeOnly(false);
    setTechniques([]);
    setTuning('all');
    setCapo('all');
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
    const matchingPrice = freeOnly
      ? matchingSearch.filter((tab) => tab.price <= 0)
      : matchingSearch;
    const result = matchingPrice.filter((tab) => {
      const characteristics = normalizeTabCharacteristics(tab.characteristics);
      const matchesTechniques = techniques.every((technique) =>
        characteristics.techniques.includes(technique),
      );
      const matchesTuning = tuning === 'all' || characteristics.tuning === tuning;
      const matchesCapo =
        capo === 'all' ||
        (capo === 'without' && characteristics.capo === 0) ||
        (capo === 'with' && characteristics.capo > 0);
      return matchesTechniques && matchesTuning && matchesCapo;
    });
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
  }, [tabs, search, sort, asc, freeOnly, techniques, tuning, capo]);

  const techniqueLabels: Record<TabTechnique, string> = {
    barre: t('techniqueBarre'),
    percussion: t('techniquePercussion'),
    harmonics: t('techniqueHarmonics'),
    tapping: t('techniqueTapping'),
  };
  const tuningLabels: Record<TabTuning, string> = {
    standard: t('tuningStandard'),
    drop_d: 'Drop D',
    nonstandard: t('tuningNonstandard'),
    custom: t('tuningCustom'),
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className='flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/70 cursor-pointer'
                >
                  <ArrowUpDown className='h-3.5 w-3.5 text-muted-foreground' />
                  <span>
                    {t('sortLabel')}: {activeSortLabel}
                  </span>
                  {characteristicsFilterCount > 0 && (
                    <span className='flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground'>
                      {characteristicsFilterCount}
                    </span>
                  )}
                  {asc ? (
                    <ChevronUp className='h-3 w-3 text-muted-foreground' />
                  ) : (
                    <ChevronDown className='h-3 w-3 text-muted-foreground' />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='min-w-60'>
                <DropdownMenuLabel className='text-xs text-muted-foreground'>
                  {t('sortLabel')}
                </DropdownMenuLabel>
                {SORT_OPTIONS.map((option) => {
                  const active = sort === option.value;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() => handleSort(option.value)}
                      className={
                        active
                          ? 'bg-muted/70 font-medium hover:bg-muted focus:bg-muted focus:text-foreground'
                          : 'hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground'
                      }
                    >
                      <span>{option.label}</span>
                      {active &&
                        (asc ? (
                          <ChevronUp className='ml-auto h-3.5 w-3.5' />
                        ) : (
                          <ChevronDown className='ml-auto h-3.5 w-3.5' />
                        ))}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className='text-xs text-muted-foreground'>
                  {t('characteristics')}
                </DropdownMenuLabel>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className='focus:bg-muted/70 data-[state=open]:bg-muted/70 data-[state=open]:text-foreground'>
                    {t('techniques')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className='min-w-48 border-border bg-background text-foreground'>
                    {TAB_TECHNIQUES.map((technique) => (
                      <DropdownMenuCheckboxItem
                        key={technique}
                        checked={techniques.includes(technique)}
                        className='focus:bg-muted/70 focus:text-foreground'
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={(checked) =>
                          setTechniques((current) =>
                            checked
                              ? [...current, technique]
                              : current.filter((item) => item !== technique),
                          )
                        }
                      >
                        {techniqueLabels[technique]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className='focus:bg-muted/70 data-[state=open]:bg-muted/70 data-[state=open]:text-foreground'>
                    {t('tuning')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className='min-w-52 border-border bg-background text-foreground'>
                    <DropdownMenuRadioGroup
                      value={tuning}
                      onValueChange={(value) => setTuning(value as TuningFilter)}
                    >
                      <DropdownMenuRadioItem
                        value='all'
                        className='focus:bg-muted/70 focus:text-foreground'
                      >
                        {t('all')}
                      </DropdownMenuRadioItem>
                      {TAB_TUNINGS.filter((value) => value !== 'custom').map((value) => (
                        <DropdownMenuRadioItem
                          key={value}
                          value={value}
                          className='focus:bg-muted/70 focus:text-foreground'
                        >
                          {tuningLabels[value]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className='focus:bg-muted/70 data-[state=open]:bg-muted/70 data-[state=open]:text-foreground'>
                    {t('capo')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className='max-h-72 min-w-48 overflow-y-auto border-border bg-background text-foreground'>
                    <DropdownMenuRadioGroup
                      value={capo}
                      onValueChange={(value) => setCapo(value as CapoFilter)}
                    >
                      <DropdownMenuRadioItem
                        value='all'
                        className='focus:bg-muted/70 focus:text-foreground'
                      >
                        {t('all')}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value='without'
                        className='focus:bg-muted/70 focus:text-foreground'
                      >
                        {t('withoutCapo')}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value='with'
                        className='focus:bg-muted/70 focus:text-foreground'
                      >
                        {t('withCapo')}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type='button'
              aria-pressed={freeOnly}
              onClick={handleFreeOnlyChange}
              className={`flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
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
                  className='flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium border border-border text-muted-foreground hover:border-red-400 hover:text-red-500 bg-background transition-colors cursor-pointer'
                >
                  <X className='h-3 w-3' />
                  {t('reset')}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Discount promo */}
        {paidTabsCount >= DISCOUNT_TIER_2_MIN && (
          <p className='text-xs text-muted-foreground/60 mb-6'>
            {locale === 'en'
              ? `🎸 Buy ${DISCOUNT_TIER_1_MIN} tabs — get ${DISCOUNT_TIER_1_RATE * 100}% off, buy ${DISCOUNT_TIER_2_MIN} or more — get ${DISCOUNT_TIER_2_RATE * 100}% off`
              : `🎸 При покупке от ${DISCOUNT_TIER_1_MIN} табов — скидка ${DISCOUNT_TIER_1_RATE * 100}%, при покупке ${DISCOUNT_TIER_2_MIN} и более — скидка ${DISCOUNT_TIER_2_RATE * 100}%`}
          </p>
        )}
        {paidTabsCount >= DISCOUNT_TIER_1_MIN &&
          paidTabsCount < DISCOUNT_TIER_2_MIN && (
          <p className='text-xs text-muted-foreground/60 mb-6'>
            {locale === 'en'
              ? `🎸 Buy ${DISCOUNT_TIER_1_MIN} tabs — get ${DISCOUNT_TIER_1_RATE * 100}% off`
              : `🎸 При покупке от ${DISCOUNT_TIER_1_MIN} табов — скидка ${DISCOUNT_TIER_1_RATE * 100}%`}
          </p>
        )}

        {/* Results count */}
        {(search || freeOnly || characteristicsFilterCount > 0) && filtered.length > 0 && (
          <p className='text-sm text-muted-foreground mb-6'>
            {t('found', { count: filtered.length })}
          </p>
        )}

        {tabs.length === 0 ? (
          <div className='flex flex-col items-center py-14 text-center sm:py-20'>
            <div className='relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <span className='absolute -right-1 top-1 h-2 w-2 rounded-full bg-primary/35' />
              <span className='absolute -right-3 top-5 h-1.5 w-1.5 rounded-full bg-primary/20' />
              <Guitar className='h-7 w-7 -rotate-12' strokeWidth={1.7} />
            </div>
            <h3 className='text-xl font-semibold text-foreground'>{t('empty')}</h3>
            <p className='mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground'>
              {t('emptyHint')}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center py-14 text-center sm:py-20'>
            <div className='relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <span className='absolute -right-1 top-1 h-2 w-2 rounded-full bg-primary/35' />
              <span className='absolute -right-3 top-5 h-1.5 w-1.5 rounded-full bg-primary/20' />
              <Guitar className='h-7 w-7 -rotate-12' strokeWidth={1.7} />
            </div>
            <h3 className='text-xl font-semibold text-foreground'>{t('notFound')}</h3>
            <p className='mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground'>
              {t('notFoundHint')}
            </p>
            <button
              type='button'
              onClick={reset}
              className='mt-5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70'
            >
              {t('resetSearch')}
            </button>
          </div>
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
