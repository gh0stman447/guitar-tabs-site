import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/ru`,
      lastModified: new Date(),
      alternates: {
        languages: {
          ru: `${BASE}/ru`,
          en: `${BASE}/en`,
        },
      },
    },
  ];
}
