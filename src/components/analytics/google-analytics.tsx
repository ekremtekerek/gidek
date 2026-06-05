import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js) — `next/script` ile `afterInteractive`
 * stratejisinde yüklenir; hidrasyonu bloklamaz. Ölçüm ID'si env'den okunur,
 * tanımsızsa hiçbir şey render edilmez (build/preview ortamlarında gürültü yok).
 */
export function GoogleAnalytics() {
  const measurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-RFJ0QJNSNL';

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
