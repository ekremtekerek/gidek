-- ============================================================================
-- reviews — kullanıcı yorum + puanları. deals.rating_avg / rating_count
-- bu tablodan beslenir; her insert/update/delete'te trigger ile güncellenir.
-- ============================================================================

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references public.deals(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  display_name  text not null check (char_length(display_name) between 2 and 50),
  rating        integer not null check (rating between 1 and 5),
  body          text not null check (char_length(body) between 5 and 1000),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index reviews_deal_active_idx
  on public.reviews (deal_id, created_at desc)
  where is_active;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- RLS ---------------------------------------------------------------------
alter table public.reviews enable row level security;

create policy "Active reviews are readable"
  on public.reviews for select
  using (is_active);

create policy "Authenticated users can insert their own reviews"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own reviews"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Rating aggregate trigger -------------------------------------------------
create or replace function public.refresh_deal_rating(deal_uuid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avg numeric(3, 2);
  v_count integer;
begin
  select
    round(avg(rating)::numeric, 2),
    count(*)
  into v_avg, v_count
  from public.reviews
  where deal_id = deal_uuid and is_active;

  update public.deals
  set rating_avg = v_avg,
      rating_count = coalesce(v_count, 0)
  where id = deal_uuid;
end;
$$;

revoke all on function public.refresh_deal_rating(uuid) from public;

create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.refresh_deal_rating(old.deal_id);
    return old;
  else
    perform public.refresh_deal_rating(new.deal_id);
    if (tg_op = 'UPDATE' and old.deal_id is distinct from new.deal_id) then
      perform public.refresh_deal_rating(old.deal_id);
    end if;
    return new;
  end if;
end;
$$;

create trigger reviews_after_insert
  after insert on public.reviews
  for each row execute function public.reviews_after_change();

create trigger reviews_after_update
  after update on public.reviews
  for each row execute function public.reviews_after_change();

create trigger reviews_after_delete
  after delete on public.reviews
  for each row execute function public.reviews_after_change();
