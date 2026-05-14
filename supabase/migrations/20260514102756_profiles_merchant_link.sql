-- Merchant self-service portal — bir kullanıcının yönettiği işletme.
--
-- V1 ölçeğinde 1 user → 1 merchant ilişkisi yeterli. Aynı işletmeyi birden
-- fazla kişi yönetmek istersek ileride merchant_owners (N:M) tablosuna
-- geçiririz.

alter table public.profiles
  add column if not exists merchant_id uuid references public.merchants(id) on delete set null;

create index if not exists profiles_merchant_idx on public.profiles (merchant_id)
  where merchant_id is not null;

-- deals tablosuna RLS — kendi merchant'ının deal'lerini okuyabilsin (henüz
-- yayınlanmamış olsa bile). Mevcut public select policy aktif+yayında
-- olanları açıyor; bu yenisi pending durumda olanları da merchant'a açar.
drop policy if exists deals_select_own_merchant on public.deals;
create policy deals_select_own_merchant on public.deals
  for select to authenticated
  using (
    merchant_id in (
      select merchant_id from public.profiles
       where id = (select auth.uid())
         and merchant_id is not null
    )
  );

-- INSERT — merchant kendi merchant_id'sine deal başvurusu yapabilsin.
-- "Pending" işareti: is_active=false + published_at=null. Bunları client
-- tarafında zorlayacak action katmanı.
drop policy if exists deals_insert_own_merchant on public.deals;
create policy deals_insert_own_merchant on public.deals
  for insert to authenticated
  with check (
    merchant_id in (
      select merchant_id from public.profiles
       where id = (select auth.uid())
         and merchant_id is not null
    )
  );

-- UPDATE — merchant kendi deal'ini güncelleyebilir AMA published_at,
-- is_active, is_featured gibi yayın kontrolünü değiştirmesini istemiyoruz.
-- Action katmanı (server) yalnız güvenli alanları geçirir; RLS sadece
-- sahiplik kontrolü yapar.
drop policy if exists deals_update_own_merchant on public.deals;
create policy deals_update_own_merchant on public.deals
  for update to authenticated
  using (
    merchant_id in (
      select merchant_id from public.profiles
       where id = (select auth.uid())
         and merchant_id is not null
    )
  )
  with check (
    merchant_id in (
      select merchant_id from public.profiles
       where id = (select auth.uid())
         and merchant_id is not null
    )
  );
