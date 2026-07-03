"use client";

import { Logo } from "./brand";
import { Card } from "./ui";

export function SetupNotice() {
  return (
    <main className="min-h-screen bg-parchment">
      <header className="mx-auto flex max-w-2xl items-center px-6 py-6">
        <Logo />
      </header>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Card className="p-6">
          <h1 className="font-display text-2xl text-ink">Connect Supabase to continue</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/70">
            This build stores accounts, memories, and media in your Supabase project. Add
            your project URL and anon key, then reload.
          </p>
          <ol className="mt-5 space-y-2 text-[15px] text-ink/80">
            <li>1. Create a project at supabase.com and run the SQL in <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">supabase/schema.sql</code>.</li>
            <li>2. Add these to <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">.env.local</code> (and to your Vercel project&apos;s environment variables):</li>
          </ol>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-parchment">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="mt-4 text-sm text-sage">
            Both keys are in Supabase under Project Settings → API. The anon key is safe to
            expose; row-level security protects the data.
          </p>
        </Card>
      </div>
    </main>
  );
}
