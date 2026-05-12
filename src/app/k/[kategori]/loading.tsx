import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-2 h-5 w-32" />
      <Skeleton className="mb-6 h-9 w-64" />
      <Skeleton className="mb-6 h-12 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        ))}
      </div>
    </Container>
  );
}
