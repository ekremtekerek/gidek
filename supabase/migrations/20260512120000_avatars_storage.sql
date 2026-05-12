-- ============================================================================
-- Avatars storage bucket — public read, owner-only write
-- ============================================================================

-- Public bucket so avatar URLs are accessible without auth tokens.
-- file_size_limit and allowed_mime_types enforced server-side regardless
-- of any client UI checks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Idempotent policy creation (drop-if-exists then create) so re-runs are safe.

-- 1) Anyone can SELECT objects in the bucket — that's what makes it "public".
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- 2) An authenticated user can upload into a folder named after their own id.
--    storage.foldername(name) parses 'userId/avatar.png' -> ['userId', 'avatar.png'].
drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3) Same constraint for UPDATE (used by upsert paths).
drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4) DELETE — let users clear their own avatar.
drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
