import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function SavedSearchesLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </Container>
  );
}
