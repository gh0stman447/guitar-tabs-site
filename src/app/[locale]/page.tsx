import { Footer } from '@/components/shared/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { BestsellerSection } from '@/components/sections/BestsellerSection';
import { TabsSection } from '@/components/sections/TabsSection';
import { ContactsSection } from '@/components/sections/ContactsSection';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, SITE_URL } from '@/lib/constants';
import type { Tab } from '@/types';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const { data: tabs } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, title_ru, title_en, description_ru, description_en, price, photo_url, difficulty')
    .eq('is_published', true);

  const itemListSchema = tabs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: locale === 'ru' ? 'Гитарные табы' : 'Guitar Tabs',
        url: `https://www.olegguitar.com`,
        numberOfItems: tabs.length,
        itemListElement: (tabs as Tab[]).map((tab, index) => ({
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
        <BestsellerSection />
        <TabsSection />
        <AboutSection />
        <ContactsSection />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
