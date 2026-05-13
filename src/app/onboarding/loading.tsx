import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingLoading() {
  return (
    <Container className="py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-11 w-40 rounded-md self-end" />
      </div>
    </Container>
  );
}
