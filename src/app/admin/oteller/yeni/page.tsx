import { HotelForm } from '@/components/admin/hotel-form';
import { getServiceClient } from '@/lib/db/service';

export const metadata = {
  title: 'Yeni otel · Admin',
  robots: { index: false, follow: false },
};

export default async function AdminHotelNewPage() {
  const supabase = getServiceClient();
  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, name, city, district')
    .eq('is_active', true)
    .order('name')
    .limit(500);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Oteller &amp; Tatil
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Yeni otel / tatil paketi
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Otel meta, oda tipleri ve politikalar ile birlikte tam detaylı oluştur.
        </p>
      </header>
      <HotelForm merchants={(merchants ?? []) as never[]} />
    </div>
  );
}
