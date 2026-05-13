import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <aside className="border-border bg-background flex flex-col gap-4 rounded-xl border p-5 sm:p-6">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-32" />
        </aside>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-40 rounded-md" />
        </div>
      </div>
    </Container>
  );
}
