import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookingDetailLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="mx-auto max-w-2xl flex flex-col gap-4">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-40 rounded-md" />
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </div>
    </Container>
  );
}
