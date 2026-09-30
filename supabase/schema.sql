-- PHYSENG — Supabase schema for accounts and Terms acceptance.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).

-- 1. Public profile for each auth user -------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text,
  role               text check (role is null or role in ('', 'student', 'teacher', 'engineer', 'other')),
  terms_version      text not null,
  terms_accepted_at  timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read and update only their own profile. Inserts happen through the trigger below.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 2. Create the profile at sign-up, recording Terms acceptance --------------------------------
-- The client sends terms_version / terms_accepted_at in the sign-up metadata; sign-up is refused
-- if they are missing, so no account can exist without accepting the Terms.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_version', '') = '' then
    raise exception 'Terms of Service must be accepted to create an account';
  end if;
  insert into public.profiles (id, display_name, role, terms_version, terms_accepted_at)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'role', ''),
    new.raw_user_meta_data ->> 'terms_version',
    coalesce((new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz, now())
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile in step when the user edits their name or re-accepts updated Terms.
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles set
    display_name      = coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), display_name),
    role              = coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), role),
    terms_version     = coalesce(new.raw_user_meta_data ->> 'terms_version', terms_version),
    terms_accepted_at = coalesce((new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz, terms_accepted_at),
    updated_at        = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

-- 3. Self-service account deletion (right to erasure) ------------------------------------------
-- Callable only by a signed-in user, and only deletes that user. Profile rows cascade.
create or replace function public.delete_user()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
