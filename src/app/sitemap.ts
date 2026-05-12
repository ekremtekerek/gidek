import type { MetadataRoute } from 'next';
import { listActiveCategorySlugs } from '@/lib/db/queries/categories';
import { listPublishedDealSlugs } from '@/lib/db/queries/deals';
import { SITE } from '@/lib/utils/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorySlugs, dealSlugs] = await Promise.all([
    listActiveCategorySlugs(),
    listPublishedDealSlugs(),
  ]);
  const now = new Date();

  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    ...categorySlugs.map((slug) => ({
      url: `${SITE.url}/k/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...dealSlugs.map((slug) => ({
      url: `${SITE.url}/f/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
