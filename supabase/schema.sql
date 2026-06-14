-- ============================================================================
-- Biks.ai — Supabase Postgres schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query) once.
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles — one row per auth user. Holds plan + trial start date.
--    App.tsx reads `plan` and `trial_started_at` from here.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  plan             text        not null default 'trial',     -- 'trial' | 'paid'
  trial_started_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Heal drift if an older `profiles` table already existed: `create table if not
-- exists` above is a no-op when the table is present, so add any missing column
-- explicitly. (A missing `email` column makes the signup trigger below fail with
-- "Database error saving new user".)
alter table public.profiles add column if not exists email            text;
alter table public.profiles add column if not exists plan             text        not null default 'trial';
alter table public.profiles add column if not exists trial_started_at timestamptz not null default now();
alter table public.profiles add column if not exists created_at       timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. histories — saved analyses / leads / kits, scoped to the signed-in user.
--    history.ts inserts { kind, title, data }; user_id is filled automatically
--    from the caller's auth.uid().
-- ----------------------------------------------------------------------------
create table if not exists public.histories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text        not null check (kind in ('analysis', 'leads', 'kit')),
  title      text        not null default '',
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.histories enable row level security;

drop policy if exists histories_select_own on public.histories;
create policy histories_select_own on public.histories
  for select using (auth.uid() = user_id);

drop policy if exists histories_insert_own on public.histories;
create policy histories_insert_own on public.histories
  for insert with check (auth.uid() = user_id);

drop policy if exists histories_delete_own on public.histories;
create policy histories_delete_own on public.histories
  for delete using (auth.uid() = user_id);

create index if not exists histories_user_created_idx
  on public.histories (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Auto-provision a profile row whenever a new user signs up.
--    Runs as SECURITY DEFINER so it can write across the auth → public boundary.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
