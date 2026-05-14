import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AkisLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>

        <ol className="relative space-y-4 border-l-2 border-dashed border-[var(--border)] pl-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden="true"
                className="bg-muted absolute -left-[33px] top-2 size-3 rounded-full"
              />
              <div className="border-border bg-background rounded-xl border p-4">
                <div className="mb-3 flex items-start gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="size-8 rounded-full" />
                </div>
                <div className="flex items-center gap-3 rounded-lg p-2">
                  <Skeleton className="size-14 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Container>
  );
}
