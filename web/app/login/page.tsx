"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("That email and password didn't match. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Enter your email above first, then choose “Forgot password.”");
      return;
    }
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        setError("Couldn't send the reset email. Please try again shortly.");
        return;
      }
      setNotice("If that email has an account, a password reset link is on its way.");
    } catch {
      setError("Couldn't send the reset email. Please try again shortly.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
        Member Sign In
      </h1>
      <p className="mt-3 text-sm text-text-sub">
        Sign in to see your progress and credentials. Accounts are created in the
        Pro Audio Training Academy mobile app.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-sub">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground outline-none focus:border-amber"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-sub">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground outline-none focus:border-amber"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-foreground">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-md border border-green/40 bg-green/10 px-3 py-2 text-sm text-foreground">
            {notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onForgot}
          className="text-text-muted underline underline-offset-2 hover:text-amber"
        >
          Forgot password?
        </button>
        <Link href="/contact" className="text-text-muted underline underline-offset-2 hover:text-amber">
          Need help?
        </Link>
      </div>
    </div>
  );
}
