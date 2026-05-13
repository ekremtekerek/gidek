import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  /** Kaç card iskeleti render edilecek. */
  count?: number;
}

/**
 * Deal listesi sayfalarında ortak fallback — listings ve arşiv aynı görsel
 * ritmi paylaşsın diye buradan beslenir. Sayfanın gerçek DealCard grid'i
 * 1/2/3/4 sütun verdiği için aynı responsive sınıflar kullanılır.
 */
export function DealGridSkeleton({ count = 12 }: Props) {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
