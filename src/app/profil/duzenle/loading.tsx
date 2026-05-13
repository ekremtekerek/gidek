import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProfileLoading() {
  return (
    <Container className="py-8 sm:py-10">
      <Skeleton className="mb-2 h-7 w-48" />
      <Skeleton className="mb-8 h-5 w-full max-w-md" />
      <div className="flex flex-col gap-5 max-w-lg">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
    </Container>
  );
}
