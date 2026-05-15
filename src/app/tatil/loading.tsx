import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function TatilLoading() {
  return (
    <>
      <div className="from-sky-600 via-cyan-500 to-teal-400 bg-gradient-to-br py-16 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
            <Skeleton className="h-6 w-32 rounded-full bg-white/30" />
            <Skeleton className="h-12 w-80 rounded bg-white/30" />
            <Skeleton className="h-5 w-96 rounded bg-white/30" />
            <Skeleton className="mt-4 h-14 w-full max-w-2xl rounded-full bg-white" />
          </div>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
          ))}
        </div>
      </Container>
    </>
  );
}
