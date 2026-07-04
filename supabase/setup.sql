-- =====================================================================
-- Amber — COMPLETE DATABASE SETUP (single file)
-- =====================================================================
-- Paste this whole file into the Supabase SQL Editor and Run it once.
-- It creates every table, security policy, storage bucket, and column
-- the app needs, in the correct order. Everything is idempotent, so it
-- is safe to re-run at any time without losing data.
--
-- Sections:
--   1. Base schema (profiles, beneficiaries, content, messages, storage)
--   2. Inheritance & reconciliation (recipients, stewards, executors, audit)
--   3. AI layer (per-item consent + interaction log)
--   4. Family tree
--   5. Profile photos, member details & consent
--   6. Multiple attachments per memory
-- =====================================================================


-- =====================================================================
-- SECTION 1 — BASE SCHEMA
-- =====================================================================
-- Amber — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where practical).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text,
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.beneficiaries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  name          text not null,
  relationship  text,
  email         text,
  birthday      date,
  created_at    timestamptz not null default now()
);

create table if not exists public.content_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  type            text not null,               -- voice | video | photo | document | letter
  title           text not null,
  note            text,
  transcript      text,
  tags            text[] not null default '{}',
  beneficiary_ids uuid[] not null default '{}',
  prompt_id       text,
  media_path      text,                        -- path in the 'vault' storage bucket
  media_mime      text,
  media_filename  text,
  media_duration  integer,
  created_at      timestamptz not null default now()
);

create table if not exists public.scheduled_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  content_id    uuid references public.content_items on delete set null,
  title         text not null,
  note          text,
  beneficiary_id uuid references public.beneficiaries on delete set null,
  trigger       text not null,                 -- immediate | date | milestone
  release_date  date,
  milestone     text,
  status        text not null default 'scheduled', -- draft | scheduled | delivered
  created_at    timestamptz not null default now()
);

create index if not exists idx_beneficiaries_user on public.beneficiaries(user_id);
create index if not exists idx_content_user on public.content_items(user_id);
create index if not exists idx_messages_user on public.scheduled_messages(user_id);

-- ---------------------------------------------------------------------------
-- Row-level security: every row is private to its owner
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.beneficiaries     enable row level security;
alter table public.content_items     enable row level security;
alter table public.scheduled_messages enable row level security;

-- profiles keyed by the auth user id
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "beneficiaries_owner" on public.beneficiaries;
create policy "beneficiaries_owner" on public.beneficiaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "content_owner" on public.content_items;
create policy "content_owner" on public.content_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages_owner" on public.scheduled_messages;
create policy "messages_owner" on public.scheduled_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for media (private) + per-user folder policies
-- Files are stored under: vault/<user_id>/<uuid>.<ext>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

drop policy if exists "vault_read_own" on storage.objects;
create policy "vault_read_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vault_insert_own" on storage.objects;
create policy "vault_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vault_update_own" on storage.objects;
create policy "vault_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vault_delete_own" on storage.objects;
create policy "vault_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Auto-create an empty profile row when a user signs up (optional convenience)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- SECTION 2 — INHERITANCE & RECONCILIATION
-- =====================================================================
-- Amber — Inheritance & Reconciliation stage migration
-- Run this AFTER the original supabase/schema.sql. Adds the recipient/steward model,
-- executors, verification events, audit log, and claim tokens. Safe to re-run.

alter table public.profiles          add column if not exists role text not null default 'creator';
alter table public.beneficiaries     add column if not exists age_floor integer;
alter table public.beneficiaries     add column if not exists claimed_by uuid references auth.users on delete set null;

create table if not exists public.recipient_contacts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries on delete cascade,
  kind           text not null,
  value          text not null,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.stewards (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries on delete cascade,
  name           text not null,
  relationship   text,
  email          text,
  phone          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.executors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  relationship text,
  email        text,
  status       text not null default 'invited',
  created_at   timestamptz not null default now()
);

create table if not exists public.verification_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  beneficiary_id uuid references public.beneficiaries on delete set null,
  trigger_kind   text not null,
  description    text,
  raised_by      text,
  status         text not null default 'pending',
  grace_until    timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.release_audit (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  event_id   uuid references public.verification_events on delete set null,
  message_id uuid references public.scheduled_messages on delete set null,
  action     text not null,
  actor      text,
  created_at timestamptz not null default now()
);

create table if not exists public.claim_tokens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries on delete cascade,
  token          text not null unique,
  expires_at     timestamptz,
  claimed_at     timestamptz,
  created_at     timestamptz not null default now()
);

-- RLS
alter table public.recipient_contacts  enable row level security;
alter table public.stewards            enable row level security;
alter table public.executors           enable row level security;
alter table public.verification_events enable row level security;
alter table public.release_audit       enable row level security;
alter table public.claim_tokens        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'recipient_contacts','stewards','executors','verification_events','release_audit','claim_tokens'
  ] loop
    execute format('drop policy if exists "%s_owner" on public.%I;', t, t);
    execute format(
      'create policy "%s_owner" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t, t);
  end loop;
end $$;


-- =====================================================================
-- SECTION 3 — AI LAYER
-- =====================================================================
-- Amber — AI layer migration
-- Run in Supabase SQL Editor after schema.sql. Adds per-item AI consent.

alter table public.content_items
  add column if not exists ai_consent boolean not null default true;

-- (Optional) log of AI interactions, per the concept doc's AIInteractionLog entity.
create table if not exists public.ai_interactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  role              text not null default 'creator',   -- who asked (creator preview / beneficiary)
  query             text not null,
  answer            text,
  source_ids        uuid[] not null default '{}',
  guardian_status   text,                               -- approved | softened | blocked
  guardian_reason   text,
  created_at        timestamptz not null default now()
);

alter table public.ai_interactions enable row level security;
drop policy if exists "ai_interactions_owner" on public.ai_interactions;
create policy "ai_interactions_owner" on public.ai_interactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- =====================================================================
-- SECTION 4 — FAMILY TREE
-- =====================================================================
-- Amber — Family Tree migration
-- Run in Supabase SQL Editor after schema.sql.

create table if not exists public.family_members (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  relationship   text,
  parent_id      uuid references public.family_members on delete set null,
  partner_name   text,
  birth_year     text,
  death_year     text,
  note           text,
  beneficiary_id uuid references public.beneficiaries on delete set null,
  content_ids    uuid[] not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists idx_family_user on public.family_members(user_id);

alter table public.family_members enable row level security;
drop policy if exists "family_owner" on public.family_members;
create policy "family_owner" on public.family_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- =====================================================================
-- SECTION 5 — PROFILE PHOTOS, MEMBER DETAILS & CONSENT
-- =====================================================================
-- Amber — profile photos, member details, and consent
-- Run in the Supabase SQL Editor after the earlier migrations.

alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists consent_at  timestamptz;

alter table public.beneficiaries
  add column if not exists avatar_path text,
  add column if not exists notes       text;


-- =====================================================================
-- SECTION 6 — MULTIPLE ATTACHMENTS PER MEMORY
-- =====================================================================
-- Amber — multiple attachments per memory
-- Run in the Supabase SQL Editor. Adds a jsonb array of attachments to each memory.
-- Existing single-file memories keep working: the app falls back to the old
-- media_path columns when this array is empty.

alter table public.content_items
  add column if not exists media jsonb not null default '[]'::jsonb;

-- Backfill existing single-file rows into the new array (safe to run once).
update public.content_items
set media = jsonb_build_array(
      jsonb_build_object(
        'path', media_path,
        'mime', coalesce(media_mime, 'application/octet-stream'),
        'filename', media_filename,
        'duration', media_duration,
        'kind', type
      )
    )
where media_path is not null
  and (media is null or jsonb_array_length(media) = 0);
