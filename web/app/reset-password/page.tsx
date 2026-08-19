"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The recovery link establishes a session (detectSessionInUrl). Confirm one
  // exists before allowing a password change.
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError("Couldn't update your password. The link may have expired — request a new one.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
        Set a new password
      </h1>

      {!ready ? (
        <p className="mt-4 text-sm text-text-sub">
          Open the reset link from your email to set a new password. If you
          arrived here directly, request a new link from the sign-in page.
        </p>
      ) : done ? (
        <p role="status" className="mt-6 rounded-md border border-green/40 bg-green/10 px-3 py-2 text-sm text-foreground">
          Password updated. Taking you to your dashboard…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="pw" className="block text-sm font-medium text-text-sub">
              New password
            </label>
            <input
              id="pw"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground outline-none focus:border-amber"
            />
          </div>
          <div>
            <label htmlFor="pw2" className="block text-sm font-medium text-text-sub">
              Confirm new password
            </label>
            <input
              id="pw2"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground outline-none focus:border-amber"
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-foreground">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
