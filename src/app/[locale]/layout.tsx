import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { CartProvider } from '@/context/CartContext';
import { CartAnimationProvider } from '@/context/CartAnimationContext';
import { ThemedToaster } from '@/components/shared/ThemedToaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { NoteParticles } from '@/components/shared/NoteParticles';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const META = {
  ru: {
    title: 'Гитарные табы — Олег Малыгин',
    description: 'Авторские гитарные табы и аранжировки для гитары. Купить ноты и табулатуры.',
  },
  en: {
    title: 'Guitar Tabs — Oleg Malygin',
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
            <CartProvider>
              <CartAnimationProvider>
                <ScrollProgress />
                {children}
                <FloatingCart />
                <NoteParticles />
                <ThemedToaster />
              </CartAnimationProvider>
            </CartProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
