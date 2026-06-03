import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <Skeleton className="aspect-[4/3] rounded-lg" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-32 w-full" />
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </aside>
      </div>
    </Container>
  );
}
