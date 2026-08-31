"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lookupRegistry, type RegistryOutcome } from "@/lib/verify";

/**
 * RegistryResult — the public page behind a member's QR token (users.qr_token).
 *
 * It shows only what the member opted in to publish: their registry name, the
 * work areas they picked, their About-you line, and their non-revoked
 * credentials. Never their email, their progress, or the private name the app
 * greets them by. Everything here is gated server-side on
 * users.show_in_registry — switching the listing off deletes the published
 * copy, so this page goes back to "no match" rather than merely hiding.
 */
export default function RegistryResult({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<RegistryOutcome | null>(null);

  useEffect(() => {
    let alive = true;
    setOutcome(null);
    lookupRegistry(token).then((o) => {
      if (alive) setOutcome(o);
    });
    return () => {
      alive = false;
    };
  }, [token]);

  if (outcome === null) {
    return <p className="mt-8 text-text-muted">Checking credential…</p>;
  }

  if (outcome.status === "error") {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <p className="text-foreground">Verification is temporarily unavailable.</p>
        <p className="mt-2 text-sm text-text-sub">Please try again in a moment.</p>
      </div>
    );
  }

  if (outcome.status === "notFound") {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
          No match found
        </p>
        <p className="mt-2 text-sm text-text-sub">
          This code doesn&rsquo;t match a listed Academy member. If you scanned a
          member&rsquo;s QR, ask them to confirm their account is set up and their
          Registry listing is switched on.
        </p>
        <div className="mt-4">
          <Link href="/verify" className="text-sm text-amber underline underline-offset-2 hover:text-amber-deep">
            Verify by code instead
          </Link>
        </div>
      </div>
    );
  }

  const { profile, credentials } = outcome;
  // A member can be listed before they have earned anything. Keying the whole
  // page on credentials made that person look like a bad token, so the profile
  // renders either way and only the CREDENTIALS block claims verification.
  const interests = (profile.interests ?? []).filter(Boolean);

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm text-text-sub">Academy member</p>
        <p className="font-display text-2xl font-semibold text-foreground">
          {profile.holder_label}
        </p>
        {profile.primary_interest ? (
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-amber">
            {profile.primary_interest}
          </p>
        ) : null}

        {profile.bio ? (
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-text-sub">{profile.bio}</p>
        ) : null}

        {interests.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {interests.map((t) => (
              <li
                key={t}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-text-sub"
              >
                {t}
              </li>
            ))}
          </ul>
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
              <li key={i} className="py-4">
                <p className="font-display text-lg font-semibold text-foreground">
                  {c.credential_name}
                </p>
                <p className="mt-1 text-sm text-text-sub">
                  <span className="uppercase tracking-wide text-text-muted">
                    {c.credential_type}
                  </span>
                  {c.level_or_tier ? <> · {c.level_or_tier}</> : null}
                  {c.track ? <> · {c.track}</> : null}
                </p>
                {c.earned_at ? (
                  <time className="font-mono text-xs text-text-muted" dateTime={c.earned_at}>
                    Earned {new Date(c.earned_at).toLocaleDateString()}
                  </time>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-text-sub">
            This member hasn&rsquo;t earned an Academy certificate yet.
          </p>
        </div>
      )}

      {/* The old wording — "no personal information beyond the name shown is
          disclosed" — stopped being true the moment work areas and an About-you
          line could publish. It says what is actually here now. */}
      <p className="mt-6 max-w-prose text-xs text-text-muted">
        This page is published voluntarily by the member and shows only what they
        chose to share. Credentials are issued by Pro Audio Training Academy and
        reflect the holder&rsquo;s status at the time of this check. Contact
        details are never published. A member can remove this page at any time.
      </p>
    </div>
  );
}
