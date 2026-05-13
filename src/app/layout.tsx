import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { ToastBridge } from '@/components/layout/toast-bridge';
import { ConsentBanner } from '@/components/legal/consent-banner';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { RegisterSW } from '@/components/pwa/register-sw';
import { RefCapture } from '@/components/referral/ref-capture';
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
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
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
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
      </body>
    </html>
  );
}
