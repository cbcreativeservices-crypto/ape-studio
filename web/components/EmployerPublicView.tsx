"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  EMPLOYER_PAGE_BADGE,
  fetchEmployerPage,
  verifiedSinceLabel,
  websiteLabel,
  type EmployerPageOutcome,
} from "@/lib/employerPage";

/**
 * A verified employer's or instructor's public page (must-do H5).
 *
 * Shows only what the server's public call returns: the name, the kind, the
 * verified date, the website and the "about" line. Same three faces as the
 * member page (/u): loading, temporarily unavailable, and not found. An
 * unverified, revoked, unknown or malformed link is "not found" — this page
 * never draws a badge the account has not earned.
 */
export default function EmployerPublicView({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<EmployerPageOutcome | null>(null);

  useEffect(() => {
    let alive = true;
    setOutcome(null);
    fetchEmployerPage(token).then((o) => {
      if (alive) setOutcome(o);
    });
    return () => {
      alive = false;
    };
  }, [token]);

  if (outcome === null) return <p className="mt-8 text-text-muted">Loading page…</p>;

  if (outcome.status === "error") {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <p className="text-foreground">This page is temporarily unavailable.</p>
        <p className="mt-2 text-sm text-text-sub">Please try again in a moment.</p>
      </div>
    );
  }

  if (outcome.status === "notFound") {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
          Profile not available
        </p>
        <p className="mt-2 text-sm text-text-sub">
          This page is not published, or the link is incorrect.
        </p>
        <div className="mt-4">
          <Link
            href="/verify"
            className="text-sm text-amber underline underline-offset-2 hover:text-amber-deep"
          >
            Verify a credential instead
          </Link>
        </div>
      </div>
    );
  }

  const p = outcome.page;
  const since = verifiedSinceLabel(p.verifiedAt);

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-3xl font-semibold text-foreground">{p.name}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className="inline-flex items-center gap-2 rounded-md border border-green/40 bg-green/5 px-2.5 py-1"
            aria-label={`${EMPLOYER_PAGE_BADGE[p.kind]}. Pro Audio Training Academy checked this account.`}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: "#37e05f22", color: "#37e05f" }}
              aria-hidden
            >
              ✓
            </span>
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-green">
              {EMPLOYER_PAGE_BADGE[p.kind]}
            </span>
          </span>
          {since ? <span className="text-sm text-text-muted">{since}</span> : null}
        </div>

        {p.website ? (
          <p className="mt-5 text-sm">
            <a
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber underline underline-offset-2 hover:text-amber-deep"
            >
              {websiteLabel(p.website)}
            </a>
          </p>
        ) : null}

        {p.about ? (
          <p className="mt-5 max-w-prose whitespace-pre-line text-sm leading-relaxed text-text-sub">
            {p.about}
          </p>
        ) : null}
      </div>

      <p className="mt-6 max-w-prose text-xs text-text-muted">
        {p.kind === "instructor"
          ? "Pro Audio Training Academy checked this instructor before they could contact members. "
          : "Pro Audio Training Academy checked this organization before it could contact members. "}
        Members are contacted only through the app, and email addresses are never shown to either
        side.
      </p>
    </div>
  );
}
