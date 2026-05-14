import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function CarkLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <Skeleton className="h-4 w-32" />
      <div className="mx-auto mt-4 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <Skeleton className="hidden h-[520px] rounded-2xl lg:block" />

        <div className="min-w-0">
          <div className="mb-8 flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div className="flex flex-col items-center">
            <Skeleton className="size-[320px] rounded-full" />
            <Skeleton className="mt-6 h-12 w-44 rounded-md" />
          </div>
        </div>
      </div>
    </Container>
  );
}
