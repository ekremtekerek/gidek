import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Affiliate kaynağı — firsatbufirsat.com deal görselleri.
      { protocol: 'https', hostname: 'cdn.firsatbufirsat.com' },
    ],
  },
  async redirects() {
    return [
      // Old /kesfet entry-points (hero CTA, chips, shared links) now land
      // straight on the homepage where the chat lives. Query strings (e.g.
      // ?q=Cumartesi+akşam) are preserved by Next.js, and ChatContainer
      // picks them up to auto-send the first message.
      { source: '/kesfet', destination: '/', permanent: false },
      // Affiliate pivotu: eski mock rezervasyon/ödeme akışı kaldırıldı. Eski
      // linkler artık affiliate köprü sayfasına yönlenir (slug korunur).
      { source: '/rezervasyon/:slug', destination: '/git/:slug', permanent: false },
    ];
  },
};

/**
 * Sentry wrapper — source map upload + tunneling + auto-instrumentation.
 * SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN env'leri yoksa SDK runtime'da
 * no-op kalır (DSN da yok); wrap yine de güvenle çalışır.
 */
const withSentry = (cfg: NextConfig): NextConfig =>
  withSentryConfig(cfg, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Build log'unu sessizleştir; warning'ler yine konsola gelir.
    silent: true,
    // Sentry CDN'i bypass etmek için bizden tünel — adblocker'lar engellemesin.
    tunnelRoute: '/monitoring',
  });

export default withSentry(withBundleAnalyzer(nextConfig));
