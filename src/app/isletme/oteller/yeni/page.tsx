import { saveHotelAsMerchantAction } from '@/app/isletme/oteller/actions';
import { HotelForm } from '@/components/admin/hotel-form';
import { getServiceClient } from '@/lib/db/service';
import { requireMerchant } from '@/lib/security/auth';

export const metadata = {
  title: 'Yeni otel · İşletme',
  robots: { index: false, follow: false },
};

export default async function MerchantHotelNewPage() {
  const { merchantId } = await requireMerchant();
  const supabase = getServiceClient();
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, name, city, district')
    .eq('id', merchantId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          İşletme paneli
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Yeni otel / tatil paketi
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Otel meta, oda tipleri ve politikalar ile detaylı oluştur — kaydedince hemen yayında.
        </p>
      </header>
      <HotelForm
        merchants={merchant ? [merchant] : []}
        action={saveHotelAsMerchantAction}
        lockedMerchantId={merchantId}
      />
    </div>
  );
}
