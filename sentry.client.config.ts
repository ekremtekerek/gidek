import * as Sentry from '@sentry/nextjs';

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';

/**
 * Tarayıcı Sentry SDK. DSN yoksa enabled=false → tüm Sentry çağrıları no-op
 * olur. Bu sayede yerel/dev'de "Sentry DSN missing" gürültüsü oluşmaz; prod'a
 * DSN düşünce otomatik aktive olur.
 */
Sentry.init({
  dsn: DSN || undefined,
  enabled: Boolean(DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
  // Sample %10 transaction'da yeterli — bütçeyi koru.
  tracesSampleRate: 0.1,
  // Hata patlamasında kullanıcı oturumunu kaydet (replay yok, sadece breadcrumbs).
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  debug: false,
});
