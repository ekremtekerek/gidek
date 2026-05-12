-- ============================================================================
-- conversations + messages — AI sohbet kalıcılığı. Kullanıcı geçmiş sohbete
-- dönebilir, ya yeni baştan başlayabilir. Title ilk user mesajından üretilir,
-- updated_at her yeni mesajda ileri çekilir (en taze konuşmalar üstte).
-- ============================================================================

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index conversations_user_idx
  on public.conversations (user_id, updated_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.conversation_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  parts           jsonb not null,
  created_at      timestamptz not null default now()
);

create index conversation_messages_conv_idx
  on public.conversation_messages (conversation_id, created_at asc);

-- RLS ---------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy "Users read own conversations"
  on public.conversations for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own conversations"
  on public.conversations for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own conversations"
  on public.conversations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own conversations"
  on public.conversations for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Users read messages of own conversations"
  on public.conversation_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users insert messages into own conversations"
  on public.conversation_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "Users delete messages of own conversations"
  on public.conversation_messages for delete
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
