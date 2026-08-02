'use client';

import type { Tab } from '@/types';
import { BestsellerSection } from '@/components/sections/BestsellerSection';
import { TabsSection } from '@/components/sections/TabsSection';

export function CatalogSections({ tabs }: { tabs: Tab[] }) {
  return (
    <>
      <BestsellerSection initialTabs={tabs} />
      <TabsSection initialTabs={tabs} />
    </>
  );
}
