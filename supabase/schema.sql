-- Behzaad Qureshi - CRM schema (Supabase / PostgreSQL)
-- Run in: Supabase Dashboard -> SQL Editor -> paste -> Run

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- Profiles: one row per auth user (id = auth.users/id)
-- ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Leads (public contact / enquiry captures)
-- ------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text not null,
  message text not null,
  source text not null default 'contact',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'follow_up', 'converted', 'lost')),
  assigned_to uuid references public.profiles (id) on delete set null,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Notes / activity per lead
-- ------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  body text not null,
  author text,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  actor text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Tags
-- ------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.lead_tags (
  lead_id uuid not null references public.leads (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (lead_id, tag_id)
);

-- ------------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------------
create index idx_leads_status_created on public.leads (status, created_at desc);
create index idx_leads_created on public.leads (created_at desc);
create index idx_leads_phone on public.leads (phone);
create index idx_leads_email on public.leads (email);

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.lead_tags enable row level security;
alter table public.activity_log enable row level security;
alter table public.profiles enable row level security;

-- Public: anyone (incl. honeypot-filtered spam) can create a lead.
create policy "Public insert leads"
  on public.leads for insert to anon with check (true);

-- Authenticated (admin / staff): full access via Supabase Auth JWT.
create policy "Authenticated full access leads"
  on public.leads for all to authenticated using (true) with check (true);

create policy "Authenticated full access notes"
  on public.notes for all to authenticated using (true) with check (true);

create policy "Authenticated full access tags"
  on public.tags for all to authenticated using (true) with check (true);

create policy "Authenticated full access lead_tags"
  on public.lead_tags for all to authenticated using (true) with check (true);

create policy "Authenticated full access activity_log"
  on public.activity_log for all to authenticated using (true) with check (true);

create policy "Authenticated read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
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
