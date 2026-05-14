import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CouponForm } from '@/components/admin/coupon-form';
import { getServiceClient } from '@/lib/db/service';

export const metadata: Metadata = {
  title: 'Kupon düzenle · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getServiceClient();
  const { data: current } = await supabase
    .from('coupons')
    .select(
      'id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_until, is_active',
    )
    .eq('id', id)
    .maybeSingle();

  if (!current) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/coupons"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kuponlar
        </Link>
        <h1 className="font-mono text-2xl font-semibold tracking-wider sm:text-3xl">
          {current.code}
        </h1>
      </header>
      <CouponForm initial={current} />
    </div>
  );
}
