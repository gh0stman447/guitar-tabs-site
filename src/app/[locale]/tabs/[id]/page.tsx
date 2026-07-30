import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/shared/Footer';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { TabDetails } from '@/components/shared/TabDetails';
import { query } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import type { Tab } from '@/types';

export const dynamic = 'force-dynamic';

const getTab = cache(async (id: string): Promise<Tab | null> => {
  const result = await query(
    `SELECT
       tabs.*,
       (
         SELECT COUNT(*)::int
         FROM tab_downloads AS downloads
         WHERE downloads.tab_id = tabs.id
       ) AS download_count
     FROM "guitar-tabs" AS tabs
     WHERE tabs.id = $1 AND tabs.is_published = true
     LIMIT 1`,
    [id],
  );
  return (result.rows[0] as Tab | undefined) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const tab = await getTab(id);

  if (!tab) {
    return {};
  }

  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;
  const url = `${SITE_URL}/${locale}/tabs/${tab.id}`;

  return {
    title: `${title} | OlegGuitar`,
    description,
    alternates: {
      canonical: url,
      languages: {
        ru: `${SITE_URL}/ru/tabs/${tab.id}`,
        en: `${SITE_URL}/en/tabs/${tab.id}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: tab.photo_url ? [{ url: tab.photo_url, alt: title }] : undefined,
    },
  };
}

export default async function TabPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tab = await getTab(id);

  if (!tab) {
    notFound();
  }

  const title = locale === 'en' ? tab.title_en : tab.title_ru;
  const description = locale === 'en' ? tab.description_en : tab.description_ru;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    image: tab.photo_url || undefined,
    category: 'Guitar Tablature',
    offers: {
      '@type': 'Offer',
      price: tab.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/${locale}/tabs/${tab.id}`,
    },
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <TabDetails tab={tab} locale={locale} />
      <Footer />
      <ScrollToTop />
    </>
  );
}
