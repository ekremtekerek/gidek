import { notFound } from 'next/navigation';
import { DealForm } from '@/components/admin/deal-form';
import { getServiceClient } from '@/lib/db/service';

type Params = { id: string };

export default async function AdminDealEditPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: deal } = await supabase
    .from('deals')
    .select(
      'id, slug, title, subtitle, description, merchant_id, cover_image, original_price, discounted_price, city, district, venue_name, duration_minutes, valid_from, valid_until, max_per_user, tags, audience, highlights, is_active, is_featured, published_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (!deal) notFound();

  const [merchantsRes, dealCatsRes] = await Promise.all([
    supabase.from('merchants').select('id, name, city').eq('is_active', true).order('name'),
    supabase.from('deal_categories').select('category:categories(slug)').eq('deal_id', deal.id),
  ]);

  // Supabase typings collapse junction relationships into arrays; cast then
  // pull the single related category out.
  type DealCategoryRow = { category: { slug: string } | { slug: string }[] | null };
  const categoryRows = (dealCatsRes.data ?? []) as unknown as DealCategoryRow[];
  const categories = categoryRows
    .flatMap((row) => (Array.isArray(row.category) ? row.category : row.category ? [row.category] : []))
    .map((c) => c.slug)
    .filter((s): s is string => Boolean(s));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Yönetim
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fırsatı düzenle</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kaydedildiğinde embedding güncellenir, AI önerileri içeriği yeniden değerlendirir.
        </p>
      </header>

      <DealForm
        merchants={merchantsRes.data ?? []}
        initial={{
          id: deal.id,
          slug: deal.slug,
          title: deal.title,
          subtitle: deal.subtitle,
          description: deal.description,
          merchant_id: deal.merchant_id,
          categories,
          cover_image: deal.cover_image,
          original_price: Number(deal.original_price),
          discounted_price: Number(deal.discounted_price),
          city: deal.city,
          district: deal.district,
          venue_name: deal.venue_name,
          duration_minutes: deal.duration_minutes,
          valid_from: deal.valid_from,
          valid_until: deal.valid_until,
          max_per_user: deal.max_per_user,
          tags: deal.tags ?? [],
          audience: deal.audience ?? [],
          highlights: deal.highlights ?? [],
          is_active: deal.is_active,
          is_featured: deal.is_featured,
          published_at: deal.published_at,
        }}
      />
    </div>
  );
}
