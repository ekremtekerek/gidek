-- AI yorum özetleri cache'i — her deal için tek özet, yorum sayısı
-- değişince stale sayılır ve yenilenir. Per-deal generation maliyetini
-- minimal tutar.

create table public.review_summaries (
  deal_id              uuid primary key references public.deals(id) on delete cascade,
  summary              text not null,
  positive_themes      text[] not null default '{}',
  caution_notes        text[] not null default '{}',
  review_count_at_gen  integer not null check (review_count_at_gen >= 0),
  rating_avg_at_gen    numeric(3,2),
  generated_at         timestamptz not null default now()
);

create index review_summaries_generated_idx on public.review_summaries (generated_at desc);

-- RLS — herkes okuyabilir (public deal sayfasında görünür). Yazma ve
-- güncelleme yalnız service_role üzerinden (RPC yok, server tarafı
-- doğrudan upsert).
alter table public.review_summaries enable row level security;

create policy review_summaries_select_public on public.review_summaries
  for select to anon, authenticated
  using (true);

-- (no insert/update/delete policy → service_role only)
