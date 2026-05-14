-- Public profil + favori paylaşım.
-- Kullanıcı kendi profilini opt-in olarak public yapabilir; benzersiz bir
-- public_slug üzerinden /u/<slug> URL'inden açılır. is_public=false ise
-- slug atanmış olsa bile sayfa görünmez.

alter table public.profiles
  add column if not exists is_public boolean not null default false,
  add column if not exists public_slug text;

create unique index if not exists profiles_public_slug_unique
  on public.profiles (lower(public_slug))
  where public_slug is not null;

-- Public profil için anonim okuma — yalnız is_public = true profillerin
-- temel alanları (display_name, avatar, slug). E-posta/telefon vb. paylaşma.
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select to anon, authenticated
  using (is_public = true and public_slug is not null);

-- Favoritelerin public görünmesi için — yalnız sahibi public profil ise.
-- (favorites RLS bugün only owner; public profilde service-role kullanılır
-- /u/ sayfasında, böylece bu policy gerekmez. Yine de ileride client-side
-- okumak istersek diye yorum bırakıyoruz.)
