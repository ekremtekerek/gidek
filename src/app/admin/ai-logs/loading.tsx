import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAiLogsLoading() {
  return (
    <Container className="py-8">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    </Container>
  );
}
