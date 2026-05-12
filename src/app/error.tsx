'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary. Beklenmedik bir runtime/render hatasında Next bu
 * componenti gösterir; reset() prop'u sayfayı yeniden render etmeyi dener.
 * Production'da error.message'i kullanıcıya göstermeyiz — generic mesaj.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('App error boundary caught:', error);
    }
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <Container className="py-12 sm:py-20">
      <EmptyState
        icon={AlertTriangle}
        title="Bir şeyler ters gitti"
        description={
          isDev
            ? `Geliştirme modunda: ${error.message}`
            : "Üzgünüz, bir hata oluştu. Tekrar denemeyi deneyebilir veya ana sayfaya dönebilirsin."
        }
        secondaryAction={{ label: 'Ana sayfaya dön', href: '/' }}
        fullPage
      />
      <div className="flex justify-center -mt-4">
        <Button type="button" variant="primary" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Tekrar dene
        </Button>
      </div>
      {error.digest ? (
        <p className="text-muted-foreground mt-4 text-center text-xs">
          Hata kodu: <code className="bg-muted rounded px-1.5 py-0.5">{error.digest}</code>
        </p>
      ) : null}
    </Container>
  );
}
