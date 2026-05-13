import { DealGridSkeleton } from '@/components/feedback/deal-grid-skeleton';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PastDealsLoading() {
  return (
    <Container className="pt-8 pb-16 sm:pt-12">
      <Skeleton className="mb-3 h-9 w-64" />
      <Skeleton className="mb-8 h-5 w-full max-w-2xl" />
      <DealGridSkeleton />
    </Container>
  );
}
