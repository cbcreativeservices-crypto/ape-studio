"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCommunityProfile, type CommunityOutcome } from "@/lib/community";

/**
 * A member's public Audio Community Directory profile.
 *
 * Everything shown here was chosen by the member. Nothing is inferred, nothing
 * is ranked, and there is no view count, no online status and no activity
 * history — this is a professional listing, not a social profile.
 *
 * Self-reported details and verified credentials are visually separated,
 * because conflating them would let a self-written specialty borrow the
 * authority of an earned certificate (spec §4.6).
 */
export default function CommunityProfileView({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<CommunityOutcome | null>(null);

  useEffect(() => {
    let alive = true;
    setOutcome(null);
    fetchCommunityProfile(token).then((o) => {
      if (alive) setOutcome(o);
    });
    return () => {
      alive = false;
    };
  }, [token]);

  if (outcome === null) return <p className="mt-8 text-text-muted">Loading profile…</p>;

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
          This community profile is not published, or the link is incorrect. Members can unpublish
          at any time.
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

  const { profile: p, credentials } = outcome;
  const list = (v: string[] | null) => (v ?? []).filter(Boolean);
  const workPref =
    p.work_pref === "remote" ? "Remote" : p.work_pref === "local" ? "Local / in person" : p.work_pref === "either" ? "Remote or local" : null;

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm text-text-sub">Pro Audio Training Academy member</p>
        <h2 className="font-display text-3xl font-semibold text-foreground">{p.display_name}</h2>
        {p.primary_area ? (
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">
            {p.primary_area}
          </p>
        ) : null}

        {p.about ? (
          <p className="mt-5 max-w-prose text-sm leading-relaxed text-text-sub">{p.about}</p>
        ) : null}

        {list(p.specialties).length > 0 ? (
          <>
            <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">
              Specialties
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {list(p.specialties).map((t) => (
                <li key={t} className="rounded-md border border-border px-2.5 py-1 text-xs text-text-sub">
                  {t}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {list(p.roles).length > 0 ? (
          <>
            <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-text-muted">
              How they&rsquo;re involved
            </h3>
            <p className="mt-1 text-sm text-text-sub">{list(p.roles).join(" · ")}</p>
          </>
        ) : null}

        {p.country_code || p.region || workPref || list(p.languages).length ? (
          <p className="mt-6 text-sm text-text-muted">
            {[p.region, p.country_code, workPref, list(p.languages).join(", ") || null]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        ) : null}
      </div>

      {credentials.length > 0 ? (
        <div className="mt-6 rounded-xl border border-green/40 bg-green/5 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: "#37e05f22", color: "#37e05f" }}
              aria-hidden
            >
              ✓
            </span>
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-green">
              Verified credentials
            </p>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {credentials.map((c, i) => (
              <li key={`${c.credential_name}-${i}`} className="py-4">
                <p className="font-display text-lg font-semibold text-foreground">{c.credential_name}</p>
                <p className="mt-1 text-sm text-text-sub">
                  <span className="uppercase tracking-wide text-text-muted">{c.credential_type}</span>
                  {c.level_or_tier ? <> · {c.level_or_tier}</> : null}
                  {c.earned_at ? <> · Earned {new Date(c.earned_at).toLocaleDateString()}</> : null}
                </p>
                {c.verify_token ? (
                  <Link
                    href={`/registry/${c.verify_token}`}
                    className="mt-1 inline-block text-sm text-amber underline underline-offset-2 hover:text-amber-deep"
                  >
                    Verify this credential
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {p.contact_enabled ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-text-sub">
            This member is open to being contacted through Pro Audio Training Academy
            {list(p.open_to).length ? ` about ${list(p.open_to).join(", ").toLowerCase()}` : ""}.
            Contact requests are sent from inside the app — email addresses are never shown to
            either side.
          </p>
        </div>
      ) : null}

      {/* §4.6 — the line that keeps self-reported detail from borrowing the
          authority of an earned credential. */}
      <p className="mt-6 max-w-prose text-xs text-text-muted">
        Profile details are provided by the member. Pro Audio Training Academy credentials are
        independently verifiable.
      </p>
    </div>
  );
}
