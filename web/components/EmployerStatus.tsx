"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

/**
 * "Where is my application?"
 *
 * An applicant who hears nothing assumes they were rejected, so this page
 * exists to say which of the three things is true. It reads
 * `employer_application_mine()`, which is RLS-scoped to the caller — there is
 * no way to look up somebody else's.
 *
 * The QUEUE REASONS are shown to the applicant, not just to the reviewer. A
 * studio owner told only "under review" cannot act; told "your work email is
 * not at your company domain" they either wait knowing why, or re-apply from
 * the right address. Nothing in those reasons reveals how to defeat the check —
 * they are the same facts the applicant already knows about themselves.
 */

type App = {
  id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  company_name: string;
  review_note: string | null;
  checks: Record<string, unknown> | null;
  created_at: string;
  reviewed_at: string | null;
};

export default function EmployerStatus() {
  const [state, setState] = useState<"loading" | "signed-out" | "none" | "ok" | "error">("loading");
  const [app, setApp] = useState<App | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data: sess } = await sb.auth.getSession();
        if (!sess.session) {
          if (alive) setState("signed-out");
          return;
        }
        const { data, error } = await sb.rpc("employer_application_mine");
        if (!alive) return;
        if (error) {
          setState("error");
          return;
        }
        const row = (Array.isArray(data) ? data[0] : data) as App | undefined;
        if (!row) {
          setState("none");
          return;
        }
        setApp(row);
        setState("ok");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state === "loading") return <p className="text-sm text-text-muted">Loading…</p>;

  if (state === "signed-out") {
    return (
      <p className="text-sm text-text-muted">
        <a href="/login" className="text-amber underline underline-offset-2">Sign in</a> to see your
        application.
      </p>
    );
  }

  if (state === "error") {
    return (
      <p className="text-sm text-text-muted">
        Couldn&rsquo;t load your application just now — this is not a decision, only a connection
        problem. Try again shortly.
      </p>
    );
  }

  if (state === "none" || !app) {
    return (
      <div>
        <p className="text-sm text-text-muted">You haven&rsquo;t applied yet.</p>
        <a
          href="/employers/apply"
          className="mt-4 inline-block rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background hover:bg-amber-deep"
        >
          Apply for an employer account
        </a>
      </div>
    );
  }

  const reasons = (app.checks?.queue_reasons as string[] | undefined) ?? [];

  const headline =
    app.status === "approved"
      ? "Verified"
      : app.status === "rejected"
        ? "Not approved"
        : app.status === "withdrawn"
          ? "Withdrawn"
          : "Under review";

  const body =
    app.status === "approved"
      ? "Your employer account is active. Open the app to choose what you are looking for and to contact members."
      : app.status === "rejected"
        ? "We could not verify this application."
        : app.status === "withdrawn"
          ? "This application was withdrawn."
          : "A person is looking at your application. You will hear by email — nothing more is needed from you.";

  return (
    <div>
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">{headline}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">{app.company_name}</h2>
      <p className="mt-3 text-sm text-text-muted">{body}</p>

      {app.review_note ? (
        <p className="mt-3 rounded-md border border-border bg-background px-4 py-3 text-sm">
          {app.review_note}
        </p>
      ) : null}

      {app.status === "pending" && reasons.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">Why it needs a look:</p>
          <ul className="ml-5 mt-1 list-disc space-y-1 text-sm text-text-muted">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {app.status === "approved" ? (
        <a
          href="/get"
          className="mt-5 inline-block rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background hover:bg-amber-deep"
        >
          Get the app
        </a>
      ) : null}

      <p className="mt-6 font-mono text-xs text-text-muted">
        Reference APP-{app.id.slice(0, 8)}
      </p>
    </div>
  );
}
