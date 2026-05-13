import { Container } from '@/components/ui/container';
import { GidekLoader } from '@/components/feedback/gidek-loader';

/**
 * Global loading fallback — RSC akışı sırasında en üst Suspense fallback.
 * Sayfa kendine has bir loading.tsx tanımlamışsa o öncelik kazanır.
 */
export default function Loading() {
  return (
    <Container className="py-16 sm:py-24">
      <GidekLoader fullPage />
    </Container>
  );
}
