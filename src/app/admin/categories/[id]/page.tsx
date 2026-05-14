import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CategoryForm } from '@/components/admin/category-form';
import { getServiceClient } from '@/lib/db/service';

export const metadata: Metadata = {
  title: 'Kategori düzenle · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = getServiceClient();
  const [{ data: current }, { data: all }] = await Promise.all([
    supabase
      .from('categories')
      .select(
        'id, slug, name, parent_id, icon, sort_order, description, meta_title, meta_description, is_active',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .order('name', { ascending: true }),
  ]);

  if (!current) notFound();

  // Mevcut kayıt ve onun alt-ağacı parent seçeneklerinden çıkarılır
  // (döngü oluşmasın). Şimdilik tek seviye derinlik varsayıyoruz; daha
  // derinleşirse recursive filtre eklenir.
  const parents = (all ?? []).filter((c) => c.id !== current.id);

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
        <h1 className="text-3xl font-semibold tracking-tight">{current.name}</h1>
        <p className="text-muted-foreground text-sm">{current.slug}</p>
      </header>
      <CategoryForm initial={current} parents={parents} />
    </div>
  );
}
