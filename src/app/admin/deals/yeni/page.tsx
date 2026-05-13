import { DealForm } from '@/components/admin/deal-form';
import { getServiceClient } from '@/lib/db/service';

export default async function AdminDealCreatePage() {
  const supabase = getServiceClient();
  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, name, city, district')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Yönetim
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Yeni fırsat</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kaydettiğinde embedding otomatik üretilir (Gemini key gerekir).
        </p>
      </header>
      <DealForm merchants={merchants ?? []} />
    </div>
  );
}
