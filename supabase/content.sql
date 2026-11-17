-- Editable site content (used by the public page and /admin/content.html)
-- Run once in: Supabase Dashboard -> SQL Editor -> paste -> Run
-- Safe to run more than once.

create table if not exists public.site_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public read site content" on public.site_content;
create policy "Public read site content"
  on public.site_content for select to anon, authenticated using (true);

drop policy if exists "Auth write site content" on public.site_content;
create policy "Auth write site content"
  on public.site_content for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------------
-- Storage bucket for photos uploaded from the admin
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read site images" on storage.objects;
create policy "Public read site images"
  on storage.objects for select to public using (bucket_id = 'site-images');

drop policy if exists "Auth upload site images" on storage.objects;
create policy "Auth upload site images"
  on storage.objects for insert to authenticated with check (bucket_id = 'site-images');

drop policy if exists "Auth update site images" on storage.objects;
create policy "Auth update site images"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-images') with check (bucket_id = 'site-images');

drop policy if exists "Auth delete site images" on storage.objects;
create policy "Auth delete site images"
  on storage.objects for delete to authenticated using (bucket_id = 'site-images');
