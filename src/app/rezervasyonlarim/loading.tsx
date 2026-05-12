import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReservationsLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-2 h-9 w-56" />
      <Skeleton className="mb-6 h-5 w-32" />
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="border-border bg-background flex items-center gap-4 rounded-xl border p-4"
          >
            <Skeleton className="aspect-square size-20 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-9 w-20" />
          </li>
        ))}
      </ul>
    </Container>
  );
}
