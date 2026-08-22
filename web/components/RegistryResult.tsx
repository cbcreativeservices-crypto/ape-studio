"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { verifyByToken, type VerifyOutcome } from "@/lib/verify";

/**
 * RegistryResult — resolves an Academy Registry QR token (users.qr_token) to the
 * holder's public credentials. Mirrors VerifyResult's states but is keyed on the
 * opaque token from the scanned QR (no manual "try another code" form).
 */
export default function RegistryResult({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);

  useEffect(() => {
    let alive = true;
    setOutcome(null);
    verifyByToken(token).then((o) => {
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
          This code doesn&rsquo;t match an active Academy credential. If you scanned
          a member&rsquo;s QR, ask them to confirm their account is set up.
        </p>
        <div className="mt-4">
          <Link href="/verify" className="text-sm text-amber underline underline-offset-2 hover:text-amber-deep">
            Verify by code instead
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-green/40 bg-green/5 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: "#37e05f22", color: "#37e05f" }}
            aria-hidden
          >
            ✓
          </span>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-green">
            Verified
          </p>
        </div>
        <p className="mt-4 text-sm text-text-sub">Credentials held by</p>
        <p className="font-display text-2xl font-semibold text-foreground">
          {outcome.holder}
        </p>

        <ul className="mt-6 divide-y divide-border">
          {outcome.credentials.map((c, i) => (
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

      <p className="mt-6 text-xs text-text-muted">
        Credentials are issued by Pro Audio Training Academy and reflect the
        holder&rsquo;s status at the time of this check. No personal information
        beyond the name shown is disclosed.
      </p>
    </div>
  );
}
