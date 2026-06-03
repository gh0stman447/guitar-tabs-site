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
