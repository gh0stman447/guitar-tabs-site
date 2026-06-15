import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { CartProvider } from '@/context/CartContext';
import { CartAnimationProvider } from '@/context/CartAnimationContext';
import { PreviewBlockProvider } from '@/context/PreviewBlockContext';
import { AdminProvider } from '@/context/AdminContext';
import { ThemedToaster } from '@/components/shared/ThemedToaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { NoteParticles } from '@/components/shared/NoteParticles';
import '../globals.css';

const META = {
  ru: {
    title: 'Табы | OlegGuitar',
    description: 'Авторские гитарные табы и аранжировки для гитары. Купить ноты и табулатуры.',
  },
  en: {
    title: 'Tabs | OlegGuitar',
    description: 'Original guitar tabs and arrangements. Buy sheet music and guitar tablatures.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = META[locale as 'ru' | 'en'] ?? META.ru;
  const url = `https://www.olegguitar.com/${locale}`;

  return {
    title: meta.title,
    description: meta.description,
    icons: {
      icon: '/icon.svg',
      apple: '/icon.svg',
    },
    alternates: {
      canonical: url,
      languages: {
        ru: 'https://www.olegguitar.com/ru',
        en: 'https://www.olegguitar.com/en',
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: 'OlegGuitar',
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ru' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OlegGuitar',
    url: 'https://www.olegguitar.com',
    inLanguage: locale === 'ru' ? 'ru-RU' : 'en-US',
    description:
      locale === 'ru'
        ? 'Авторские гитарные табы и аранжировки для гитары'
        : 'Original guitar tabs and arrangements',
    author: {
      '@type': 'Person',
      name: 'Oleg',
      url: 'https://www.olegguitar.com',
      knowsAbout: ['Guitar', 'Music Arrangement', 'Guitar Tablature'],
    },
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Yandex Metrika counter - only in production */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID && (
          <>
            <script
              type='text/javascript'
              dangerouslySetInnerHTML={{
                __html: `
                  (function(m,e,t,r,i,k,a){
                      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                      m[i].l=1*new Date();
                      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                  })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}', 'ym');

                  ym(${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
                `,
              }}
            />
            <noscript>
              <div>
                <img
                  src={`https://mc.yandex.ru/watch/${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}`}
                  style={{ position: 'absolute', left: '-9999px' }}
                  alt=''
                />
              </div>
            </noscript>
          </>
        )}
        {/* /Yandex Metrika counter */}
      </head>
      <body className='antialiased'>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute='class' defaultTheme='dark'>
            <AdminProvider>
              <CartProvider>
                <CartAnimationProvider>
                  <PreviewBlockProvider>
                    <ScrollProgress />
                    {children}
                    <FloatingCart />
                    <NoteParticles />
                    <ThemedToaster />
                  </PreviewBlockProvider>
                </CartAnimationProvider>
              </CartProvider>
            </AdminProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
