"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, inputClass } from "@/components/ui";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn't configured yet. Add your project keys to .env.local.");
      return;
    }
    setBusy(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If the project requires email confirmation, there's no session yet.
    if (data.session) router.push("/onboarding");
    else setCheckEmail(true);
  };

  return (
    <AuthShell
      title={checkEmail ? "Check your email" : "Start preserving"}
      subtitle={
        checkEmail
          ? `We sent a confirmation link to ${email}. Open it, then sign in.`
          : "Create your account. It takes a moment."
      }
      footer={
        checkEmail ? (
          <Link href="/signin" className="text-clay hover:underline">
            Back to sign in
          </Link>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="text-clay hover:underline">
              Sign in
            </Link>
          </>
        )
      }
    >
      {!checkEmail && (
        <div className="space-y-4">
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </Field>
          <Field label="Password" hint="At least 6 characters.">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
            />
          </Field>
          {error && <p className="text-sm text-clay">{error}</p>}
          <Button
            onClick={submit}
            disabled={busy || !email.trim() || password.length < 6}
            className="w-full"
          >
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
