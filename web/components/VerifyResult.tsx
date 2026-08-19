"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { verifyCode, type VerifyOutcome } from "@/lib/verify";
import VerifyForm from "./VerifyForm";

export default function VerifyResult({ code }: { code: string }) {
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);

  useEffect(() => {
    let alive = true;
    setOutcome(null);
    verifyCode(code).then((o) => {
      if (alive) setOutcome(o);
    });
    return () => {
      alive = false;
    };
  }, [code]);

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
      <div className="mt-8">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
            No match found
          </p>
          <p className="mt-2 text-sm text-text-sub">
            We couldn&rsquo;t find a credential for code{" "}
            <span className="font-mono text-foreground">{code}</span>. Check the
            code and try again.
          </p>
        </div>
        <div className="mt-6">
          <p className="text-sm text-text-muted">Verify a different code:</p>
          <VerifyForm />
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
      <div className="mt-6">
        <Link href="/verify" className="text-sm text-amber underline underline-offset-2 hover:text-amber-deep">
          Verify another credential
        </Link>
      </div>
    </div>
  );
}
