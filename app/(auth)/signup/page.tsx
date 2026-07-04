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
  const [resent, setResent] = useState(false);
  const [consent, setConsent] = useState(false);

  const emailRedirect = () =>
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/onboarding` : undefined;

  const submit = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn't configured yet. Add your project keys to .env.local.");
      return;
    }
    setBusy(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: emailRedirect() },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If the project requires email confirmation, there's no session yet.
    if (data.session) router.push("/onboarding");
    else setCheckEmail(true);
  };

  const resend = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setError("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: emailRedirect() },
    });
    if (error) setError(error.message);
    else {
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    }
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
      {checkEmail && (
        <div className="space-y-4">
          <div className="rounded-xl2 border border-ink/10 bg-parchment/60 p-4 text-[15px] leading-relaxed text-ink/75">
            Open the link in that email to confirm your account. It may take a minute to
            arrive — and do check your spam folder.
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <Button variant="outline" onClick={resend} className="w-full">
            {resent ? "Sent again — check your inbox" : "Resend confirmation email"}
          </Button>
        </div>
      )}

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
          <label className="flex items-start gap-2.5 text-sm text-ink/75">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#BE873B]"
            />
            <span>
              I agree that Amber may collect and securely store my personal data to provide the
              service, and I accept the{" "}
              <Link href="/legal/terms" className="text-clay hover:underline" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="text-clay hover:underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <Button
            onClick={submit}
            disabled={busy || !email.trim() || password.length < 6 || !consent}
            className="w-full"
          >
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
