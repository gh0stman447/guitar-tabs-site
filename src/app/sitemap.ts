import type { MetadataRoute } from 'next';

const BASE = 'https://www.olegguitar.com';

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
