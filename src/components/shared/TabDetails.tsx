'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRef, useState, useSyncExternalStore } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Download,
  Eye,
  FileText,
  Gauge,
  Headphones,
  MonitorSmartphone,
  Music,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FreeDownloadMenu } from '@/components/shared/FreeDownloadMenu';
import { useCart } from '@/context/CartContext';
import { useCartAnimation } from '@/context/CartAnimationContext';
import { usePreviewBlock } from '@/context/PreviewBlockContext';
import type { Tab } from '@/types';
import { TabCharacteristics } from '@/components/shared/TabCharacteristics';
import { useIsTouch } from '@/hooks/useIsTouch';

const BuyDialog = dynamic(
  () => import('@/components/shared/BuyDialog').then((module) => module.BuyDialog),
  { ssr: false },
);
const TabPreviewDialog = dynamic(
  () => import('@/components/shared/TabPreviewDialog').then((module) => module.TabPreviewDialog),
  { ssr: false },
);
const AudioPlayerDialog = dynamic(
  () => import('@/components/shared/AudioPlayerDialog').then((module) => module.AudioPlayerDialog),
  { ssr: false },
);

const subscribeToHydration = () => () => {};

const COPY = {
  ru: {
    back: 'Назад к каталогу',
    arrangement: 'Авторская аранжировка',
    created: 'Добавлено',
    difficulty: 'Сложность',
    formats: 'В наборе',
    free: 'Бесплатно',
    buy: 'Купить',
    freeDownload: 'Скачать бесплатно',
    addToCart: 'В корзину',
    inCart: 'В корзине',
    addedToCart: 'Добавлено в корзину',
    removedFromCart: 'Убрано из корзины',
    preview: 'Открыть превью',
    audio: 'Послушать',
    video: 'Смотреть видео',
    includedTitle: 'Что входит в набор',
    includedDescription:
      'Материалы подготовлены для самостоятельных занятий: бесплатные можно скачать сразу, платные доступны после оплаты.',
    filesTitle: 'Все материалы в одном наборе',
    filesText:
      'Получите файлы Guitar Pro для занятий и PDF-версию, которую удобно открыть или распечатать.',
    filesTextWithAudio:
      'Получите файлы Guitar Pro для занятий, PDF-версию для просмотра или печати и MP3-версию исполнения для прослушивания.',
    devicesTitle: 'Занимайтесь в удобном формате',
    devicesText:
      'Разбирайте аранжировку в Guitar Pro, следите за табулатурой на экране или играйте по распечатанным нотам.',
    foreverTitle: 'Скачайте и сохраните',
    foreverText:
      'Полученные материалы останутся у вас — возвращайтесь к аранжировке, когда захотите.',
    checkedTitle: 'Проверено на практике',
    checkedText:
      'Аранжировка написана вручную и проверена на гитаре, чтобы по ней было удобно заниматься.',
    securePayment: 'Надёжная оплата',
    fastDelivery: 'Быстрая доставка',
    note: 'Материалы предназначены для личного некоммерческого использования.',
  },
  en: {
    back: 'Back to catalog',
    arrangement: 'Original arrangement',
    created: 'Added',
    difficulty: 'Difficulty',
    formats: 'Included',
    free: 'Free',
    buy: 'Buy',
    freeDownload: 'Download for free',
    addToCart: 'Add to cart',
    inCart: 'In cart',
    addedToCart: 'Added to cart',
    removedFromCart: 'Removed from cart',
    preview: 'Open preview',
    audio: 'Listen',
    video: 'Watch video',
    includedTitle: 'What is included',
    includedDescription:
      'The materials are prepared for self-study: free tabs can be downloaded immediately, while paid tabs become available after payment.',
    filesTitle: 'All materials in one set',
    filesText:
      'Get Guitar Pro files for practice and a PDF version that is easy to open or print.',
    filesTextWithAudio:
      'Get Guitar Pro files for practice, a PDF version to view or print, and an MP3 performance recording to listen to.',
    devicesTitle: 'Practice the way that suits you',
    devicesText:
      'Study the arrangement in Guitar Pro, follow the tab on screen, or play from printed sheets.',
    foreverTitle: 'Download and keep',
    foreverText:
      'The downloaded materials stay with you, so you can return to the arrangement whenever you like.',
    checkedTitle: 'Tested in practice',
    checkedText:
      'The arrangement is written by hand and checked on guitar to make it comfortable to learn.',
    securePayment: 'Secure payment',
    fastDelivery: 'Fast delivery',
    note: 'The materials are intended for personal, non-commercial use.',
  },
} as const;

export function TabDetails({ tab, locale }: { tab: Tab; locale: string }) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFlying, setPreviewFlying] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const mediaCardRef = useRef<HTMLDivElement>(null);
  const previewDestinationRef = useRef({ x: 0, y: 0 });
  const previewControls = useAnimation();
  const isTouch = useIsTouch();
  const { addItem, removeItem, hasItem } = useCart();
  const { flyToCart, flyFromCart } = useCartAnimation();
  const { isPreviewBlocking, startPreviewBlock, endPreviewBlock } = usePreviewBlock();
  const language = locale === 'en' ? 'en' : 'ru';
  const copy = COPY[language];
  const title = language === 'en' ? tab.title_en : tab.title_ru;
  const description = language === 'en' ? tab.description_en : tab.description_ru;
  const isFree = tab.price <= 0;
  const inCart = hasItem(tab.id);
  const mediaFormats = [
    (tab.files.gp5 || tab.files.gpx) && {
      key: 'guitar-pro',
      mark: 'GP',
      label: 'Guitar Pro',
    },
    tab.files.pdf && { key: 'pdf', mark: 'PDF', label: 'PDF' },
    tab.files.mp3 && { key: 'mp3', mark: 'MP3', label: 'MP3' },
  ].filter((format): format is { key: string; mark: string; label: string } => Boolean(format));
  const createdAt = tab.created_at ? new Date(tab.created_at) : null;
  const createdDate =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Europe/Moscow',
        }).format(createdAt)
      : null;

  async function handlePreviewOpen() {
    if (previewOpen) return;
    if (isTouch) {
      setPreviewOpen(true);
      return;
    }

    const element = mediaCardRef.current;
    if (!element || previewFlying || isPreviewBlocking) return;
    const rect = element.getBoundingClientRect();
    const centerX = window.innerWidth / 2 - rect.left - rect.width / 2;
    const centerY = window.innerHeight / 2 - rect.top - rect.height / 2;
    previewDestinationRef.current = { x: centerX, y: centerY };
    startPreviewBlock(`details-${tab.id}`);
    setPreviewFlying(true);

    await previewControls.start({
      x: centerX,
      y: centerY,
      rotateY: 180,
      scale: 2.5,
      opacity: [1, 1, 0],
      filter: ['blur(0px)', 'blur(1px)', 'blur(10px)'],
      transition: { duration: 0.55, ease: 'easeInOut' },
    });
    setPreviewOpen(true);
    setPreviewFlying(false);
    previewControls.set({
      x: centerX,
      y: centerY,
      rotateY: 180,
      scale: 2.5,
      opacity: 0,
      filter: 'blur(10px)',
    });
  }

  async function handlePreviewChange(open: boolean) {
    if (isTouch || open) {
      setPreviewOpen(open);
      return;
    }

    setPreviewOpen(false);
    setPreviewFlying(true);
    const { x, y } = previewDestinationRef.current;
    previewControls.set({
      x,
      y,
      rotateY: 180,
      scale: 2.5,
      opacity: 0,
      filter: 'blur(10px)',
    });
    await previewControls.start({
      x: 0,
      y: 0,
      rotateY: 0,
      scale: 1,
      opacity: [0, 1, 1],
      filter: ['blur(10px)', 'blur(1px)', 'blur(0px)'],
      transition: { duration: 0.6, ease: 'easeInOut' },
    });
    previewControls.set({ x: 0, y: 0, rotateY: 0, scale: 1, opacity: 1, filter: 'blur(0px)' });
    setPreviewFlying(false);
    endPreviewBlock();
  }

  function animateCart(reverse: boolean) {
    if (isTouch) return;
    const element = mediaCardRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (reverse) flyFromCart(rect, element);
    else flyToCart(rect, element);
  }

  return (
    <>
      <main className='min-h-screen pt-28 sm:pt-32'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <Link
            href={`/${locale}#tabs`}
            className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6'
          >
            <ArrowLeft className='h-4 w-4' />
            {copy.back}
          </Link>

          <section className='grid lg:grid-cols-[1.08fr_0.92fr] gap-6 lg:gap-10 items-start'>
            <motion.div
              ref={mediaCardRef}
              animate={previewControls}
              className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm'
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
                position: 'relative',
                zIndex: previewFlying ? 99999 : 0,
              }}
            >
              <div
                className='protected-image relative aspect-video bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900'
                onContextMenu={(event) => event.preventDefault()}
              >
                {tab.photo_url ? (
                  <Image
                    src={tab.photo_url}
                    alt={title}
                    fill
                    priority
                    draggable={false}
                    className='object-cover'
                    sizes='(max-width: 1024px) 100vw, 58vw'
                  />
                ) : (
                  <div className='flex h-full items-center justify-center'>
                    <Music className='h-16 w-16 text-amber-400' strokeWidth={1} />
                  </div>
                )}
                <div
                  aria-hidden
                  className='absolute inset-0 z-[1]'
                  onContextMenu={(event) => event.preventDefault()}
                />
                {mediaFormats.length > 0 && (
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 z-[2]'>
                    <div className='absolute inset-x-0 bottom-0 h-28 bg-zinc-950/65 backdrop-blur-[3px] [mask-image:linear-gradient(to_top,black_60%,transparent)] sm:h-32' />
                    <div className='relative flex items-start justify-center gap-5 px-4 pb-3 pt-8 sm:gap-7 sm:pb-4 sm:pt-10'>
                      {mediaFormats.map((format) => (
                        <div
                          key={format.key}
                          className='flex min-w-14 flex-col items-center gap-1.5 text-center'
                        >
                          <div className='media-format-circle flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900/65 text-xs font-bold tracking-wide text-primary backdrop-blur-md sm:h-12 sm:w-12'>
                            {format.key === 'pdf' ? (
                              <FileText className='h-4 w-4' />
                            ) : format.key === 'mp3' ? (
                              <Headphones className='h-4 w-4' />
                            ) : (
                              format.mark
                            )}
                          </div>
                          <span className='text-[11px] font-semibold text-white/75 drop-shadow-sm sm:text-xs'>
                            {format.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {((!isFree && tab.files.pdf) || tab.files.mp3 || tab.youtube_url) && (
                <div className='flex flex-wrap gap-2 border-t border-border/60 p-4 sm:p-5'>
                  {!isFree && tab.files.pdf && (
                    <Button
                      variant='outline'
                      className='rounded-full bg-transparent'
                      onClick={handlePreviewOpen}
                      disabled={!hydrated || previewFlying}
                      aria-busy={!hydrated}
                    >
                      <Eye className='h-4 w-4' />
                      {copy.preview}
                    </Button>
                  )}
                  {tab.files.mp3 && (
                    <Button
                      variant='outline'
                      className='rounded-full bg-transparent'
                      onClick={() => setAudioOpen(true)}
                      disabled={!hydrated}
                      aria-busy={!hydrated}
                    >
                      <Headphones className='h-4 w-4' />
                      {copy.audio}
                    </Button>
                  )}
                  {tab.youtube_url && (
                    <Button asChild variant='outline' className='rounded-full bg-transparent'>
                      <a href={tab.youtube_url} target='_blank' rel='noopener noreferrer'>
                        <FaYoutube className='h-4 w-4' />
                        {copy.video}
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </motion.div>

            <div className='lg:sticky lg:top-28'>
              <span className='text-primary text-sm font-medium tracking-widest uppercase'>
                {copy.arrangement}
              </span>
              <h1 className='mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold'>{title}</h1>
              <p className='mt-4 text-muted-foreground leading-relaxed'>{description}</p>

              <div className='mt-6 flex flex-wrap gap-2'>
                <span className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm'>
                  <Gauge className='h-4 w-4 text-primary' />
                  {copy.difficulty}: <b>{tab.difficulty}</b>
                </span>
                {isFree && typeof tab.download_count === 'number' && (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm'>
                    <Download className='h-4 w-4 text-primary' />
                    {language === 'en'
                      ? `Downloads: ${tab.download_count}`
                      : `Скачиваний: ${tab.download_count}`}
                  </span>
                )}
                {!isFree && (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm'>
                    <ShoppingBag className='h-4 w-4 text-primary' />
                    {language === 'en'
                      ? `Purchases: ${tab.purchase_count ?? 0}`
                      : `Покупок: ${tab.purchase_count ?? 0}`}
                    </span>
                )}
                {createdDate && (
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm'>
                    <CalendarDays className='h-4 w-4 text-primary' />
                    {copy.created}: {createdDate}
                  </span>
                )}
              </div>

              {tab.characteristics && (
                <div className='mt-4'>
                  <TabCharacteristics value={tab.characteristics} locale={locale} />
                </div>
              )}

              <div className='mt-7 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm'>
                <p className='text-xs font-medium uppercase tracking-widest text-muted-foreground'>
                  {copy.formats}
                </p>
                <div className='mt-2 flex items-end justify-between gap-4'>
                  <span className='text-3xl font-bold text-foreground'>
                    {isFree ? copy.free : `${tab.price} ₽`}
                  </span>
                </div>
                {isFree ? (
                  <div className='mt-5'>
                    <FreeDownloadMenu tab={tab} locale={locale} />
                  </div>
                ) : (
                  <div className='mt-5 grid grid-cols-2 gap-2'>
                    <Button
                      variant='outline'
                      className={
                        inCart
                          ? 'rounded-full border-primary text-primary hover:bg-primary/10'
                          : 'rounded-full bg-transparent hover:border-primary hover:text-primary'
                      }
                      onClick={() => {
                        if (inCart) {
                          removeItem(tab.id);
                          toast(title, { description: copy.removedFromCart, icon: '🗑️' });
                          animateCart(true);
                        } else {
                          addItem(tab);
                          toast(title, { description: copy.addedToCart, icon: '🛒' });
                          animateCart(false);
                        }
                      }}
                    >
                      {inCart ? <Check className='h-4 w-4' /> : <ShoppingCart className='h-4 w-4' />}
                      {inCart ? copy.inCart : copy.addToCart}
                    </Button>
                    <Button
                      className='rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
                      onClick={() => setBuyOpen(true)}
                    >
                      {copy.buy}
                    </Button>
                  </div>
                )}
                {!isFree && (
                  <div className='mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4'>
                    <div className='flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground'>
                      <ShieldCheck className='h-4 w-4 shrink-0 text-primary' />
                      <span>{copy.securePayment}</span>
                    </div>
                    <div className='flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground'>
                      <Zap className='h-4 w-4 shrink-0 text-primary' />
                      <span>{copy.fastDelivery}</span>
                    </div>
                  </div>
                )}
                <p className='mt-3 text-center text-xs text-muted-foreground'>{copy.note}</p>
              </div>
            </div>
          </section>

          <section className='pt-14 pb-8 sm:pt-20 sm:pb-12'>
            <div className='max-w-2xl'>
              <span className='text-primary text-sm font-medium tracking-widest uppercase'>
                {copy.formats}
              </span>
              <h2 className='mt-2 text-2xl sm:text-3xl font-bold'>{copy.includedTitle}</h2>
              <p className='mt-3 text-muted-foreground'>{copy.includedDescription}</p>
            </div>

            <div className='mt-8 grid sm:grid-cols-2 gap-4'>
              {[
                {
                  icon: FileText,
                  title: copy.filesTitle,
                  text: tab.files.mp3 ? copy.filesTextWithAudio : copy.filesText,
                },
                { icon: MonitorSmartphone, title: copy.devicesTitle, text: copy.devicesText },
                { icon: BadgeCheck, title: copy.foreverTitle, text: copy.foreverText },
                { icon: Music, title: copy.checkedTitle, text: copy.checkedText },
              ].map(({ icon: Icon, title: featureTitle, text }) => (
                <article
                  key={featureTitle}
                  className='rounded-2xl border border-border bg-card p-5 sm:p-6'
                >
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <h3 className='mt-4 text-lg font-semibold'>{featureTitle}</h3>
                  <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      {!isFree && buyOpen && (
        <BuyDialog
          tab={tab}
          locale={locale}
          open={buyOpen}
          onOpenChange={setBuyOpen}
        />
      )}
      {!isFree && previewOpen && (
        <TabPreviewDialog
          tab={tab}
          locale={locale}
          open={previewOpen}
          onOpenChange={handlePreviewChange}
          onBuy={() => setBuyOpen(true)}
        />
      )}
      {audioOpen && (
        <AudioPlayerDialog
          tab={tab}
          locale={locale}
          open
          onOpenChange={setAudioOpen}
        />
      )}
    </>
  );
}
