import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentLoading() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-xl flex flex-col gap-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    </Container>
  );
}
