import { Footer } from '@/components/shared/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { CatalogSections } from '@/components/sections/CatalogSections';
import { ContactsSection } from '@/components/sections/ContactsSection';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { TABLE_TABS, SITE_URL } from '@/lib/constants';
import type { Tab } from '@/types';
import { query } from '@/lib/db';
import { unstable_cache } from 'next/cache';

const getPublishedTabs = unstable_cache(
  async () => {
    const result = await query(
      `SELECT tabs.id, tabs.created_at, tabs.title_ru, tabs.title_en,
              tabs.difficulty, tabs.price, tabs.description_ru, tabs.description_en,
              tabs.photo_url, tabs.files, tabs.purchase_count, tabs.characteristics,
              (SELECT COUNT(*)::int FROM tab_downloads downloads WHERE downloads.tab_id = tabs.id) AS download_count
       FROM "${TABLE_TABS}" tabs
       WHERE tabs.is_published = true
       ORDER BY tabs.purchase_count DESC, tabs.created_at DESC`,
    );
    return result.rows.map((row) => ({
      ...row,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    })) as Tab[];
  },
  ['published-tabs'],
  { revalidate: 60, tags: ['published-tabs'] },
);

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const tabs = await getPublishedTabs();

  const itemListSchema = tabs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: locale === 'ru' ? 'Гитарные табы' : 'Guitar Tabs',
        url: `https://www.olegguitar.com`,
        numberOfItems: tabs.length,
        itemListElement: tabs.map((tab, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            '@id': `${SITE_URL}/#tab-${tab.id}`,
            name: locale === 'ru' ? tab.title_ru : tab.title_en,
            description: locale === 'ru' ? tab.description_ru : tab.description_en,
            image: tab.photo_url || undefined,
            category: 'Guitar Tablature',
            offers: {
              '@type': 'Offer',
              price: tab.price,
              priceCurrency: 'RUB',
              availability: 'https://schema.org/InStock',
              url: `https://www.olegguitar.com`,
              seller: {
                '@type': 'Person',
                name: 'Oleg',
              },
            },
          },
        })),
      }
    : null;

  return (
    <>
      {itemListSchema && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <main>
        <HeroSection />
        <CatalogSections tabs={tabs} />
        <AboutSection />
        <ContactsSection />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
