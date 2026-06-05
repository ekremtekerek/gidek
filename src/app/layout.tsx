import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { ToastBridge } from '@/components/layout/toast-bridge';
import { ConsentBanner } from '@/components/legal/consent-banner';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { RegisterSW } from '@/components/pwa/register-sw';
import { RefCapture } from '@/components/referral/ref-capture';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/lib/utils/site-config';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  verification: { google: '4TOTnHPaVdnPVwDPDjD_hoYuM3roOzizBxwsZUYjNFU' },
};

export const viewport: Viewport = {
  // Marka varsayılanı aydınlık olduğu için mobil adres çubuğu / status bar
  // rengini de beyaz tutuyoruz (PWA standalone ve tarayıcı sekmesinde tutarlı).
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  sameAs: [SITE.social.instagram, SITE.social.x],
};

/**
 * WebSite şeması + SearchAction — Google'ın "sitelinks search box" rich
 * sonucu için bunu okur (URL altında bir arama kutusu gösterir). Bizim arama
 * URL'imiz: /firsatlar?q=<query>.
 */
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  alternateName: `${SITE.name}.net`,
  url: SITE.url,
  description: SITE.description,
  inLanguage: 'tr-TR',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.url}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

/**
 * No-flash tema scripti — paint öncesi çalışır, localStorage'ten seçimi
 * okuyup <html>'e .light / .dark sınıfı ekler.
 *
 * Marka varsayılanı AYDINLIK: kayıtlı seçim yoksa (yeni ziyaretçi — özellikle
 * sistemi karanlık olan mobil) .light eklenir; site sistem teması dark olsa
 * bile beyaz açılır (webdeki masaüstü görünümüyle aynı). Sadece kullanıcı
 * toggle ile 'dark' ya da 'auto' seçerse farklı davranır:
 *   'dark' → .dark, 'auto' → hiç class (prefers-color-scheme devreye girer).
 */
const themeBootstrapScript = `
try {
  var v = localStorage.getItem('gidek-theme');
  if (v === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (v !== 'auto') {
    document.documentElement.classList.add('light');
  }
} catch (e) {
  document.documentElement.classList.add('light');
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning — themeBootstrapScript paint öncesi <html>'e
    // .light / .dark sınıfı ekler. Server bu sınıfı bilmediği için React
    // hidrasyonunda className uyuşmazlığı uyarısı çıkar; bilinçli yapılan
    // bir mismatch olduğu için bayrağı koyuyoruz (Next.js önerisi).
    <html
      lang="tr"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect — kritik 3rd party origin'lere DNS+TLS handshake'i
            erkenden başlatır. LCP'yi etkileyen ana asset host'larına. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://events.mapbox.com" />
        <link rel="dns-prefetch" href="https://api.tiles.mapbox.com" />
        <link rel="dns-prefetch" href="https://picsum.photos" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <a
          href="#main-content"
          className="bg-foreground text-background sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          İçeriğe atla
        </a>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Header />
        <main id="main-content" className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <ScrollToTop />
        <Toaster position="top-center" richColors closeButton />
        {/* Reads ?toast= query params from server-action redirects.
            useSearchParams requires a Suspense boundary in Next.js 15+. */}
        <Suspense fallback={null}>
          <ToastBridge />
        </Suspense>
        <ConsentBanner />
        <InstallPrompt />
        <RegisterSW />
        <Suspense fallback={null}>
          <RefCapture />
        </Suspense>
        <JsonLd data={orgJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
