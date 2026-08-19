"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";
import {
  fetchDashboardSummary,
  type DashboardSummary,
  type Tier,
} from "@/lib/dashboard";

type State =
  | { phase: "loading" }
  | { phase: "signedOut" }
  | { phase: "error"; message: string }
  | { phase: "ready"; data: DashboardSummary };

const TIER_LABEL: Record<Tier, string> = {
  academy: "Academy member",
  free: "Free account",
  lapsed: "Membership lapsed",
  anonymous: "Guest",
};
const TIER_TINT: Record<Tier, string> = {
  academy: "#ffc64d",
  free: "#2f9bff",
  lapsed: "#ff8a1e",
  anonymous: "#8a8b93",
};

const APP_DEEPLINK = process.env.NEXT_PUBLIC_APP_DEEPLINK || "";

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "loading" });

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState({ phase: "signedOut" });
      return;
    }
    try {
      const summary = await fetchDashboardSummary();
      setState({ phase: "ready", data: summary });
    } catch (e) {
      const msg =
        e instanceof Error && e.message === "user_not_found"
          ? "We couldn't find your member profile. Create your account in the mobile app first, then sign in here."
          : "Something went wrong loading your dashboard. Please try again.";
      setState({ phase: "error", message: msg });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setState({ phase: "signedOut" });
    router.refresh();
  }

  if (state.phase === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <p className="text-text-muted">Loading your dashboard…</p>
      </div>
    );
  }

  if (state.phase === "signedOut") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
          Member Dashboard
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-text-sub">
          Sign in to see your progress and credentials.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
          Member Dashboard
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-text-sub">{state.message}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={load}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-amber hover:text-amber"
          >
            Try again
          </button>
          <button
            onClick={signOut}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text-sub hover:border-amber hover:text-amber"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const d = state.data;
  const pct = d.totalTopics > 0 ? Math.round((d.completeTopics / d.totalTopics) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
            {d.displayName ? `Welcome back, ${d.displayName}` : "Welcome back"}
          </h1>
          <span
            className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ borderColor: `${TIER_TINT[d.tier]}66`, color: TIER_TINT[d.tier] }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_TINT[d.tier] }} />
            {TIER_LABEL[d.tier]}
          </span>
        </div>
        <button
          onClick={signOut}
          className="self-start rounded-md border border-border px-4 py-2 text-sm font-semibold text-text-sub transition-colors hover:border-amber hover:text-amber"
        >
          Sign out
        </button>
      </div>

      {/* Keep working */}
      <section className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
          Keep working
        </h2>
        {d.upNext ? (
          <p className="mt-2 text-text-sub">
            Up next: <span className="text-foreground">{d.upNext.topicName}</span>{" "}
            <span className="text-text-muted">· {d.upNext.courseName}</span>
          </p>
        ) : d.totalTopics > 0 ? (
          <p className="mt-2 text-text-sub">
            You&rsquo;ve completed every enrolled topic. Nicely done.
          </p>
        ) : (
          <p className="mt-2 text-text-sub">
            You&rsquo;re not enrolled in any topics yet. Open the app to get started.
          </p>
        )}
        <div className="mt-5">
          {APP_DEEPLINK ? (
            <a
              href={APP_DEEPLINK}
              className="inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
            >
              Continue in the app
            </a>
          ) : (
            <p className="text-sm text-text-muted">
              Continue in the Pro Audio Training Academy app to pick up where you
              left off — your progress is synced to your account.
            </p>
          )}
        </div>
      </section>

      {/* Progress */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
            Progress
          </h2>
          <p className="font-mono text-sm text-text-sub">
            {d.completeTopics}/{d.totalTopics} topics
          </p>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-raised"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall topic completion"
        >
          <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
        </div>

        {d.courses.length > 0 ? (
          <ul className="mt-6 space-y-4">
            {d.courses.map((c) => {
              const cpct = c.total > 0 ? Math.round((c.complete / c.total) * 100) : 0;
              const tint = c.colorHex || "#ffc64d";
              return (
                <li key={c.courseId}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground">{c.name}</span>
                    <span className="font-mono text-text-muted">
                      {c.complete}/{c.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                    <div className="h-full rounded-full" style={{ width: `${cpct}%`, backgroundColor: tint }} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-text-muted">No enrolled courses yet.</p>
        )}
      </section>

      {/* Credentials */}
      <section className="mt-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
          Credentials
        </h2>
        {d.credentials.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {d.credentials.map((cr) => (
              <li key={cr.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-foreground">{cr.name}</p>
                  <p className="text-xs uppercase tracking-wide text-text-muted">{cr.type}</p>
                </div>
                {cr.earnedAt ? (
                  <time className="font-mono text-xs text-text-muted" dateTime={cr.earnedAt}>
                    {new Date(cr.earnedAt).toLocaleDateString()}
                  </time>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-muted">
            No credentials yet. Earn certificates and program credentials by
            completing topics and final exams in the app — they&rsquo;ll appear here
            and can be verified from your{" "}
            <Link href="/verify" className="text-amber underline underline-offset-2 hover:text-amber-deep">
              verification page
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
