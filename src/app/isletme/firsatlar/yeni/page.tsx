import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MerchantDealForm } from '@/components/merchant/merchant-deal-form';
import { getMerchantInfo } from '@/lib/db/queries/merchant-portal';
import { requireMerchant } from '@/lib/security/auth';

export default async function NewMerchantDealPage() {
  const { merchantId } = await requireMerchant();
  const info = await getMerchantInfo(merchantId);
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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Yeni fırsat başvurusu
        </h1>
      </header>
      <MerchantDealForm
        defaultCity={info?.city ?? undefined}
        defaultDistrict={info?.district ?? undefined}
      />
    </div>
  );
}
