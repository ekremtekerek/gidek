import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function MerchantLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <Skeleton className="mb-5 h-5 w-48" />
      <Skeleton className="mb-8 h-32 w-full rounded-2xl" />
      <div className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <Skeleton className="mb-5 h-8 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </Container>
  );
}
