"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";

/**
 * Signed-in account deletion on the website (plan of record:
 * Downloads/2026-10-15_EXIT_FLOW_BUILD_PLAN.md, Step 4).
 *
 * Flow: confirm the certificate choice (nothing preselected) → re-enter the
 * password → delete_my_account(p_keep_credentials) → sign out on this browser.
 *
 * ⛔ delete_my_account(p_keep_credentials boolean) is NOT live yet (Comp A
 * brief 2026-10-15, item 7). Only the no-argument version exists. This
 * component is rendered only when WEB_DELETE_ENABLED is true in
 * app/delete-account/page.tsx; do not switch that on until Comp A confirms
 * the overload in docs/CROSS_SESSION_HANDOFF.md.
 *
 * The web otherwise never writes tables; this RPC is the one exception and it
 * runs as the signed-in user (RLS / SECURITY DEFINER on the server side).
 */

const EMAIL = "info@proaudiotrainingacademy.com";

type Choice = "delete_all" | "keep_record";

type State =
  | { phase: "loading" }
  | { phase: "signedOut" }
  | {
      phase: "ready";
      email: string;
      firstName: string | null;
      /** null = we could not read it, so the choice is shown to be safe. */
      hasCredentials: boolean | null;
    }
  | { phase: "done"; firstName: string | null };

export default function DeleteAccountForm() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [choice, setChoice] = useState<Choice | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user || !user.email) {
          if (!cancelled) setState({ phase: "signedOut" });
          return;
        }

        // First name for the closing thank-you. Filtered on auth_id, never
        // left to RLS alone (admins match every row — see lib/dashboard.ts).
        let firstName: string | null = null;
        try {
          const { data: row } = await supabase
            .from("users")
            .select("first_name")
            .eq("auth_id", user.id)
            .single();
          firstName = (row?.first_name as string | null) ?? null;
        } catch {
          firstName = null;
        }

        // Earned, non-revoked credentials. A failed read is NOT "none": the
        // choice is then shown so nobody loses a record by our mistake.
        let hasCredentials: boolean | null = null;
        try {
          const { data: awards, error: awErr } = await supabase
            .from("credential_awards")
            .select("id")
            .is("revoked_at", null)
            .limit(1);
          if (!awErr) hasCredentials = (awards ?? []).length > 0;
        } catch {
          hasCredentials = null;
        }

        if (!cancelled) {
          setState({ phase: "ready", email: user.email, firstName, hasCredentials });
        }
      } catch {
        if (!cancelled) setState({ phase: "signedOut" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.phase === "done") doneHeading.current?.focus();
  }, [state.phase]);

  if (state.phase === "loading") {
    return (
      <p role="status" className="text-sm text-text-muted">
        Checking whether you are signed in…
      </p>
    );
  }

  if (state.phase === "signedOut") {
    return (
      // INVENTED copy (signed-out prompt).
      <p>
        You are not signed in on this website.{" "}
        <Link href="/login">Sign in</Link>, then come back to this page to
        delete your account here. You can also use the app or email us, as
        described below.
      </p>
    );
  }

  if (state.phase === "done") {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-5">
        <h3
          ref={doneHeading}
          tabIndex={-1}
          className="text-lg font-semibold text-foreground focus:outline-none"
        >
          Your account has been deleted
        </h3>
        {/* INVENTED copy (thank-you line; the exit document's D3 wording is not on the web yet). */}
        <p className="mt-2">
          {state.firstName ? `Thank you, ${state.firstName}.` : "Thank you."} You
          have been signed out on this browser.
        </p>
      </div>
    );
  }

  const ready = state;
  const showChoice = ready.hasCredentials !== false;
  const canSubmit = !busy && password.length > 0 && (!showChoice || choice !== null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    const supabase = getSupabaseBrowser();
    try {
      // Password re-entry: proves the person at the keyboard owns the account.
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: ready.email,
        password,
      });
      if (authErr) {
        // INVENTED copy.
        setError("That password didn't match. Nothing was deleted. Please try again.");
        return;
      }

      const keep = showChoice ? choice === "keep_record" : false;
      const { error: rpcErr } = await supabase.rpc("delete_my_account", {
        p_keep_credentials: keep,
      });
      if (rpcErr) {
        // INVENTED copy.
        setError(
          `We could not confirm that your account was deleted. Please try again, or email ${EMAIL} with the subject "Delete my account".`,
        );
        return;
      }

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // The account is gone; a failed sign-out only leaves a dead local token.
      }
      setPassword("");
      setState({ phase: "done", firstName: ready.firstName });
    } catch {
      // INVENTED copy.
      setError(
        `Something went wrong and we could not confirm the deletion. Please try again, or email ${EMAIL}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* INVENTED copy (signed-in-as line). */}
      <p>
        You are signed in as <strong>{ready.email}</strong>.
      </p>

      {showChoice ? (
        <fieldset className="space-y-3">
          <legend className="mb-2 font-semibold text-foreground">
            Your certificates
          </legend>
          {/* Wording: plan of record, Step 3 · D1 (owner decisions 2026-10-15). */}
          <label className="flex cursor-pointer gap-3 rounded-md border border-border bg-surface px-4 py-3 has-[:checked]:border-amber">
            <input
              type="radio"
              name="certificates"
              value="delete_all"
              checked={choice === "delete_all"}
              onChange={() => setChoice("delete_all")}
              className="mt-1 h-4 w-4 shrink-0 accent-amber"
            />
            <span>
              <strong>Delete everything.</strong> We will no longer be able to
              confirm that you earned any certificate.
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-md border border-border bg-surface px-4 py-3 has-[:checked]:border-amber">
            <input
              type="radio"
              name="certificates"
              value="keep_record"
              checked={choice === "keep_record"}
              onChange={() => setChoice("keep_record")}
              className="mt-1 h-4 w-4 shrink-0 accent-amber"
            />
            <span>
              <strong>Keep a verification record.</strong> Your name,
              certificate title, date earned and verification code stay so
              employers can still confirm it. Everything else is deleted. You
              can ask us to remove it at any time.
            </span>
          </label>
        </fieldset>
      ) : null}

      <div>
        <label htmlFor="delete-password" className="block font-semibold text-foreground">
          Enter your password to confirm
        </label>
        <input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="delete-warning"
          className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-foreground focus:border-amber"
        />
      </div>

      {/* Wording: plan of record, Step 3 · D2. */}
      <p id="delete-warning" className="text-sm">
        Deleting your account does not cancel an Apple or Google subscription.
        Cancel it with Apple or Google to stop future renewal. Deletion happens
        right away and cannot be undone.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-foreground"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-11 w-full rounded-md bg-red px-4 py-2.5 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {busy ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
