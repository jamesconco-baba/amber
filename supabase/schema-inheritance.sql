-- Voice Beyond Time — Inheritance & Reconciliation stage migration
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
