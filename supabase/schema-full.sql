-- Amber — FULL PLATFORM SCHEMA (reference)
-- Covers every entity in the concept document's data model (§21), expanded with the
-- recipient/steward reconciliation model. This is the target schema for the whole
-- platform. For the current build stage, run schema-inheritance.sql (a subset).
--
-- Legend of what the current app uses today vs. future stages is in
-- docs/FUNCTIONAL_BUILD_SPEC.md.

-- ============================ CORE (already live) ============================

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text,
  role        text not null default 'creator',   -- creator | beneficiary | executor | advisor
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Recipients (the concept doc's beneficiaries, owned by the creator). A message binds
-- to this record, not to an account — so you can write to a one-year-old today.
create table if not exists public.beneficiaries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,  -- creator
  name          text not null,
  relationship  text,
  email         text,
  birthday      date,
  age_floor     integer,        -- nothing releases before this age
  claimed_by    uuid references auth.users on delete set null,  -- set when beneficiary claims
  created_at    timestamptz not null default now()
);

create table if not exists public.content_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  type            text not null,               -- voice|video|photo|document|letter|journal
  title           text not null,
  note            text,
  transcript      text,
  tags            text[] not null default '{}',
  category        text,
  beneficiary_ids uuid[] not null default '{}',
  prompt_id       text,
  ai_consent      boolean not null default false,  -- opt-in per item for AI (§13 Consent)
  archived        boolean not null default false,
  media_path      text,
  media_mime      text,
  media_filename  text,
  media_duration  integer,
  created_at      timestamptz not null default now()
);

create table if not exists public.scheduled_messages (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  content_id     uuid references public.content_items on delete set null,
  title          text not null,
  note           text,
  beneficiary_id uuid references public.beneficiaries on delete set null,
  trigger        text not null,                -- immediate | date | milestone | life_event
  release_date   date,
  milestone      text,
  status         text not null default 'scheduled', -- draft|scheduled|delivered|sealed
  created_at     timestamptz not null default now()
);

-- ==================== INHERITANCE & RECONCILIATION (this stage) ==============

-- Redundant ways to reach a recipient across decades.
create table if not exists public.recipient_contacts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  beneficiary_id uuid not null references public.beneficiaries on delete cascade,
  kind           text not null,                -- email | phone
  value          text not null,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now()
);

-- A trusted adult who helps a message find the recipient if channels go stale.
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

-- Executors confirm life-event triggers and oversee release.
create table if not exists public.executors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,  -- creator
  name         text not null,
  relationship text,
  email        text,
  status       text not null default 'invited',  -- invited | active
  created_at   timestamptz not null default now()
);

-- A party asserts a milestone/life event occurred; enters a grace period before release.
create table if not exists public.verification_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,  -- creator
  beneficiary_id uuid references public.beneficiaries on delete set null,
  trigger_kind   text not null,                -- milestone | life_event
  description    text,
  raised_by      text,                         -- creator | executor | steward | system
  status         text not null default 'pending', -- pending|grace|confirmed|disputed|released|cancelled
  grace_until    timestamptz,
  created_at     timestamptz not null default now()
);

-- Immutable-ish log of inheritance actions (audit trail, §17 Executor dashboard).
create table if not exists public.release_audit (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  event_id   uuid references public.verification_events on delete set null,
  message_id uuid references public.scheduled_messages on delete set null,
  action     text not null,
  actor      text,
  created_at timestamptz not null default now()
);

-- Time-limited invite handed to a beneficiary at delivery time (Journey B).
create table if not exists public.claim_tokens (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,  -- creator
  beneficiary_id uuid not null references public.beneficiaries on delete cascade,
  token          text not null unique,
  expires_at     timestamptz,
  claimed_at     timestamptz,
  created_at     timestamptz not null default now()
);

-- ==================== FUTURE STAGES (defined; build later) ===================

create table if not exists public.family_tree_nodes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null,
  birth_year   integer,
  death_year   integer,
  bio          text,
  linked_content_ids uuid[] not null default '{}',
  created_at   timestamptz not null default now()
);

create table if not exists public.family_tree_edges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  from_node  uuid not null references public.family_tree_nodes on delete cascade,
  to_node    uuid not null references public.family_tree_nodes on delete cascade,
  kind       text not null,                    -- parent | spouse | child | sibling
  created_at timestamptz not null default now()
);

create table if not exists public.ai_interaction_logs (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users on delete cascade,  -- content owner
  beneficiary_id         uuid references public.beneficiaries on delete set null,
  query                  text,
  response               text,
  sources_used           uuid[] not null default '{}',
  guardian_review_status text,                 -- passed | softened | blocked
  created_at             timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id    uuid primary key references auth.users on delete cascade,
  plan       text not null default 'starter',  -- starter | family | legacy_plus | advisor
  status     text not null default 'active',
  updated_at timestamptz not null default now()
);

-- ============================ RLS (owner-scoped) =============================
-- Every table is private to its owner (user_id / id). Beneficiary read-access to
-- RELEASED content is granted through the claim/reconciliation flow at the app layer
-- plus targeted policies added when the beneficiary view ships.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','beneficiaries','content_items','scheduled_messages',
    'recipient_contacts','stewards','executors','verification_events',
    'release_audit','claim_tokens','family_tree_nodes','family_tree_edges',
    'ai_interaction_logs','subscriptions'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- profiles / subscriptions keyed by id
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "subs_owner" on public.subscriptions;
create policy "subs_owner" on public.subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- everything else keyed by user_id
do $$
declare t text;
begin
  foreach t in array array[
    'beneficiaries','content_items','scheduled_messages','recipient_contacts',
    'stewards','executors','verification_events','release_audit','claim_tokens',
    'family_tree_nodes','family_tree_edges','ai_interaction_logs'
  ] loop
    execute format('drop policy if exists "%s_owner" on public.%I;', t, t);
    execute format(
      'create policy "%s_owner" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t, t);
  end loop;
end $$;
