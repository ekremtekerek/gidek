import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryForm } from '@/components/admin/category-form';
import { getServiceClient } from '@/lib/db/service';

export const metadata: Metadata = {
  title: 'Yeni kategori · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .order('name', { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/categories"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kategoriler
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Yeni kategori</h1>
      </header>
      <CategoryForm parents={data ?? []} />
    </div>
  );
}
