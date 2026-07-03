# Voice Beyond Time — Web MVP

A digital legacy preservation platform. Preserve your voice, letters, photos, and
documents, and release them to the people you love on a date or a life milestone.

MVP scope (per the concept doc, Section 28): real accounts, Legacy Circle, the Vault
(voice recording / uploads / written letters), guided prompts, milestone- and date-based
scheduled release, and a Timeline. AI Assistant, Guardian, voice cloning, and Executor
tools are later phases.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** — Auth (email/password), Postgres (row-level security), and Storage
  (private `vault` bucket) for media.
- Voice recording via the browser's `MediaRecorder` API.

## Setup — do this once (about 5 minutes)

### 1. Create a Supabase project
Go to supabase.com → New project. Wait for it to finish provisioning.

### 2. Run the schema
In Supabase → **SQL Editor** → New query → paste the contents of
[`supabase/schema.sql`](./supabase/schema.sql) → **Run**. This creates the tables,
row-level-security policies, the private `vault` storage bucket, and a trigger that
creates a profile row on sign-up.

### 3. Add your keys
Copy `.env.example` to `.env.local` and fill in the two values from Supabase →
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is meant to be public; row-level security is what protects the data.

### 4. (Optional) Turn off email confirmation for faster testing
Supabase → **Authentication → Providers → Email** → toggle **Confirm email** off. With it
off, sign-up logs you straight in. With it on, sign-up sends a confirmation link and the
app shows a "check your email" screen (this uses Supabase's built-in email, which is
rate-limited; wire your own SMTP for volume).

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Build check:

```bash
npm run build && npm start
```

If the env vars are missing, the app shows a setup notice instead of crashing.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. vercel.com → Add New → Project → import the repo.
3. In the project's **Settings → Environment Variables**, add the same two
   `NEXT_PUBLIC_SUPABASE_*` values. Deploy.

Voice recording needs HTTPS; Vercel provides it (and `localhost` counts as secure in dev).

## How auth + data flow works

- `middleware.ts` refreshes the Supabase session cookie on navigation.
- `lib/supabase/client.ts` exposes a singleton browser client (returns `null` if env is
  unset, which drives the setup notice).
- `lib/store.tsx` is the single data layer every screen uses. It loads the signed-in
  user's rows, generates 1-hour signed URLs for media, and performs all create/update/
  delete against Supabase. Media is uploaded to `vault/<user_id>/<uuid>.<ext>`.
- Auth pages: `/signup`, `/signin`. New users land in `/onboarding`, then `/dashboard`.

## Project structure

```
app/
  page.tsx                Landing
  (auth)/signin, signup   Email/password auth
  onboarding/             Name → Legacy Circle → first message
  (app)/                  Authenticated shell + dashboard/vault/messenger/timeline/circle/settings
components/               brand, ui, recorder, add-content-modal, auth-shell, setup-notice
lib/
  types.ts                Data model
  store.tsx               Supabase-backed store (auth + CRUD + storage)
  supabase/client.ts      Browser client
  prompts.ts, media.ts    Prompt library + media/format helpers
middleware.ts             Session refresh
supabase/schema.sql       Tables, RLS, storage bucket + policies
```

## Testing checklist

1. Sign up → land in onboarding → add your name, a couple of people, record/write a first message.
2. Dashboard shows counts; Vault shows the memory (audio should play back).
3. Add a photo/document in Vault (uploads to Storage).
4. Messenger: schedule a message to a milestone or date; mark one delivered.
5. Timeline shows past items and a future scheduled release.
6. Sign out (Settings), sign back in — everything persists.
7. In Supabase → Table editor, confirm rows appear only for your user; Storage → `vault`
   shows files under your user-id folder.
