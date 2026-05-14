import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function CuzdanLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-80" />
        </div>

        <Skeleton className="mb-3 h-3 w-40" />
        <ul className="mb-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <div className="border-border bg-background rounded-xl border p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-10 w-full rounded-md" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
