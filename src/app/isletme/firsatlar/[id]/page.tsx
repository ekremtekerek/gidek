import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { MerchantDealForm } from '@/components/merchant/merchant-deal-form';
import { Badge } from '@/components/ui/badge';
import { getServiceClient } from '@/lib/db/service';
import { requireMerchant } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';

export default async function EditMerchantDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { merchantId } = await requireMerchant();

  const supabase = getServiceClient();
  const { data: deal } = await supabase
    .from('deals')
    .select(
      `id, slug, title, subtitle, description, cover_image, images,
       original_price, discounted_price, city, district, venue_name,
       duration_minutes, valid_from, valid_until, max_per_user,
       tags, audience, highlights, is_active, published_at, merchant_id,
       deal_categories ( category:categories ( slug ) )`,
    )
    .eq('id', id)
    .maybeSingle();

  if (!deal || deal.merchant_id !== merchantId) notFound();

  const categories = (deal.deal_categories ?? [])
    .map((dc) => {
      const cat = dc.category as { slug: string } | { slug: string }[] | null;
      const c = Array.isArray(cat) ? cat[0] : cat;
      return c?.slug;
    })
    .filter((s): s is string => Boolean(s));

  const isPublished = Boolean(deal.published_at && deal.is_active);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/isletme/firsatlar"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Fırsatlarım
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {deal.title}
          </h1>
          {isPublished ? (
            <Badge variant="success" size="md" className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" aria-hidden="true" />
              Yayında
            </Badge>
          ) : (
            <Badge variant="warning" size="md" className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              Onay bekliyor
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{deal.slug}</p>
      </header>
      <MerchantDealForm
        initial={{
          id: deal.id,
          title: deal.title,
          subtitle: deal.subtitle,
          description: deal.description,
          categories,
          cover_image: deal.cover_image,
          images: deal.images ?? [],
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
        }}
      />
    </div>
  );
}
