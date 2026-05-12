import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MerchantForm } from '@/components/admin/merchant-form';
import { getServiceClient } from '@/lib/db/service';

export const metadata: Metadata = {
  title: 'İşletme düzenle · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Params = { id: string };

export default async function EditMerchantPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('merchants')
    .select(
      'id, slug, name, description, phone, email, website, address, city, district, lat, lng, logo_url, is_active, is_verified',
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) notFound();

  const initial = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    phone: data.phone,
    email: data.email,
    website: data.website,
    address: data.address,
    city: data.city,
    district: data.district,
    lat: data.lat !== null ? Number(data.lat) : null,
    lng: data.lng !== null ? Number(data.lng) : null,
    logo_url: data.logo_url,
    is_active: data.is_active,
    is_verified: data.is_verified,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/merchants"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          İşletmeler
        </Link>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{data.name}</h1>
          <Link
            href={`/m/${data.slug}`}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            sitedeki sayfa →
          </Link>
        </div>
      </header>
      <MerchantForm initial={initial} />
    </div>
  );
}
