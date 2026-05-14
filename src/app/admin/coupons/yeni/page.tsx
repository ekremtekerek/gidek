import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CouponForm } from '@/components/admin/coupon-form';

export const metadata: Metadata = {
  title: 'Yeni kupon · Admin',
  robots: { index: false, follow: false },
};

export default function NewCouponPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight">Yeni kupon</h1>
      </header>
      <CouponForm />
    </div>
  );
}
