import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDealsLoading() {
  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
      <Skeleton className="mb-4 h-10 w-full rounded-md" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </Container>
  );
}
