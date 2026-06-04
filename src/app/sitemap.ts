import type { MetadataRoute } from 'next';
import { listActiveCategorySlugs } from '@/lib/db/queries/categories';
import { listPublishedDealSlugs } from '@/lib/db/queries/deals';
import { listPublishedMerchantSlugs } from '@/lib/db/queries/merchants';
import { SITE } from '@/lib/utils/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorySlugs, dealSlugs, merchantSlugs] = await Promise.all([
    listActiveCategorySlugs(),
    listPublishedDealSlugs(),
    listPublishedMerchantSlugs(),
  ]);
  const now = new Date();

  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    {
      url: `${SITE.url}/sss`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    ...categorySlugs.map((slug) => ({
      url: `${SITE.url}/k/${slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...merchantSlugs.map((slug) => ({
      url: `${SITE.url}/m/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...dealSlugs.map((slug) => ({
      url: `${SITE.url}/f/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
