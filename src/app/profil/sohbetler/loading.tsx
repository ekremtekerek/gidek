import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConversationsLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </Container>
  );
}
