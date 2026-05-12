import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/utils/site-config';

/**
 * PWA manifest — yüklenebilir uygulama meta'sı. Next 16 metadata API ile
 * /manifest.webmanifest URL'inde otomatik servis edilir. Layout'un
 * metadata'sına ayrıca eklemeye gerek yok.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    lang: 'tr',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    categories: ['lifestyle', 'travel', 'food'],
  };
}
