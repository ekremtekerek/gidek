import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook — runtime'a göre uygun Sentry config'i çağırır.
 * sentry.server.config.ts ve sentry.edge.config.ts side-effect ile init eder.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

/**
 * Server-side error'ları Sentry'e iletir. Next.js dökümünde önerilen pattern.
 */
export const onRequestError = Sentry.captureRequestError;
