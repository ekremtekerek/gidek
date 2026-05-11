import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/utils/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profil', '/rezervasyonlarim', '/favorilerim'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
