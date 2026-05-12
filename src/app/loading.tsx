import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Global yükleme — RSC akışı sırasında en üst Suspense fallback. Sayfa
 * kendine has bir loading.tsx tanımlamışsa o öncelik kazanır.
 */
export default function Loading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}

function DealCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  );
}
