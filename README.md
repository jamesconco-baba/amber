# Amber — Web MVP

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

### 3b. Enable the AI layer (Legacy Assistant, Guardian, Books)
Run [`supabase/migration_ai.sql`](./supabase/migration_ai.sql) in the SQL Editor (adds
per-item AI consent + an interaction log). Then add your Anthropic key to `.env.local`
and to Vercel's environment variables:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get one at console.anthropic.com. The key is used only server-side (in `/api/assistant`
and `/api/books`) and is never exposed to the browser. Without it, the AI screens show a
friendly "connect the AI" notice and the rest of the app works normally. The assistant
uses `claude-sonnet-5` and answers strictly from content you've marked for AI use.

### 3c. Enable the Family Tree
Run [`supabase/migration_family.sql`](./supabase/migration_family.sql) in the SQL Editor
(adds the `family_members` table with row-level security). The Family Tree and the
"By theme" grouping in Memories then work end to end. Memories&apos; "By person" and "By
time" views need no migration and work immediately.

### 4. Email verification (recommended for production)

The app has the routes to handle confirmation links (`/auth/confirm` for the token-hash
flow, `/auth/callback` for the code flow). You need to configure Supabase so the emails
actually send and the links point at those routes.

**a. Use a real email provider (fixes the "email rate limit exceeded" error).**
Supabase's built-in email is dev-only and caps at a few messages per hour. Set up custom
SMTP — Resend works well:
- Supabase → **Project Settings → Authentication → SMTP Settings** → enable custom SMTP.
- Host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key,
  sender = a verified address on your domain (e.g. `hello@theamberapp.com`).
- In Resend, verify `theamberapp.com` and add the **SPF** and **DKIM** DNS records it gives
  you, or confirmation emails will land in spam.
- Then raise the cap: Supabase → **Authentication → Rate Limits** → increase the
  email-sending limit (it defaults to a low number).

**b. Point the confirmation link at the app.**
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://theamberapp.com`
- **Redirect URLs**: add `https://theamberapp.com/auth/callback`,
  `https://theamberapp.com/auth/confirm`, and (for local dev) the same two on
  `http://localhost:3000`.

**c. Update the confirmation email template.**
Supabase → **Authentication → Email Templates → Confirm signup** → change the link so it
uses the token hash and lands on the confirm route:

```
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding">Confirm your email</a>
```

Keep email confirmation **on** (Authentication → Providers → Email → Confirm email). New
users then get a link, click it, and land in onboarding with an active session. The
sign-up screen also offers a "Resend confirmation email" button.

*For quick local testing only,* you can toggle Confirm email off to skip the email step —
just remember to turn it back on for production.

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
   `NEXT_PUBLIC_SUPABASE_*` values (and `ANTHROPIC_API_KEY`). Deploy.
4. Add your custom domain **theamberapp.com** in Vercel → Settings → Domains.
5. In Supabase → **Authentication → URL Configuration**, set the **Site URL** to
   `https://theamberapp.com` and add it to **Redirect URLs**, so confirmation and
   auth links resolve to the live site.

Voice recording needs HTTPS; Vercel provides it (and `localhost` counts as secure in dev).

## How auth + data flow works

- `middleware.ts` refreshes the Supabase session cookie on navigation.
- `lib/supabase/client.ts` exposes a singleton browser client (returns `null` if env is
  unset, which drives the setup notice).
- `lib/store.tsx` is the single data layer every screen uses. It loads the signed-in
  user's rows, generates 1-hour signed URLs for media, and performs all create/update/
  delete against Supabase. Media is uploaded to `vault/<user_id>/<uuid>.<ext>`.
- Auth pages: `/signup`, `/signin`. New users land in `/onboarding`, then `/dashboard`.
- Email confirmation links are handled by two Route Handlers: `/auth/confirm` verifies the
  token hash (`verifyOtp`) and `/auth/callback` exchanges a code (`exchangeCodeForSession`).
  Both set the session cookie and redirect to `/onboarding`.

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

## Build stages beyond MVP

The full functional breakdown of every module/feature/function in the concept doc is in
[`docs/FUNCTIONAL_BUILD_SPEC.md`](./docs/FUNCTIONAL_BUILD_SPEC.md), with a build sequence.

**Stage 1 — Inheritance & Reconciliation (now included).** Adds the Executor & Inheritance
module: recipients with redundant contacts + stewards, age floors, executors, life-event
verification with a 14-day grace period, dispute/cancel, an audit log, and claim-invitation
links (with a `/claim/[token]` landing). To enable it, run
[`supabase/schema-inheritance.sql`](./supabase/schema-inheritance.sql) in your Supabase SQL
Editor (after the original `schema.sql`). The complete target schema for the whole platform
is in [`supabase/schema-full.sql`](./supabase/schema-full.sql) for reference.
