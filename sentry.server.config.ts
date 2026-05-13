import * as Sentry from '@sentry/nextjs';

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';

/**
 * Server-side (Node runtime) Sentry SDK. DSN yoksa no-op.
 */
Sentry.init({
  dsn: DSN || undefined,
  enabled: Boolean(DSN),
  environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
});
