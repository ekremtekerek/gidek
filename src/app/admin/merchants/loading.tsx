import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMerchantsLoading() {
  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </Container>
  );
}
