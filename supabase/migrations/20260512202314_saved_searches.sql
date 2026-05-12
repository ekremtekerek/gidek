-- ============================================================================
-- saved_searches — kullanıcının "bunu kaydet" dediği AI prompt'ları.
-- /profil/aramalar listeler, ?q= ile tekrar tetikler. RLS sadece sahibine.
-- ============================================================================

create table public.saved_searches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  query       text not null check (char_length(query) between 3 and 300),
  created_at  timestamptz not null default now()
);

create index saved_searches_user_idx
  on public.saved_searches (user_id, created_at desc);

-- Aynı kullanıcı aynı query'yi (case-insensitive) iki kere kaydedemesin.
create unique index saved_searches_uniq_query
  on public.saved_searches (user_id, lower(query));

-- RLS ---------------------------------------------------------------------
alter table public.saved_searches enable row level security;

create policy "Users can read their own saved searches"
  on public.saved_searches for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own saved searches"
  on public.saved_searches for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own saved searches"
  on public.saved_searches for delete
  to authenticated
  using (user_id = auth.uid());
