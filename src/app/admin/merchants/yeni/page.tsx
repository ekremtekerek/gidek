import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MerchantForm } from '@/components/admin/merchant-form';

export const metadata: Metadata = {
  title: 'Yeni işletme · Admin',
  robots: { index: false, follow: false },
};

export default function NewMerchantPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight">Yeni işletme</h1>
      </header>
      <MerchantForm />
    </div>
  );
}
