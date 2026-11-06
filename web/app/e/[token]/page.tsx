"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import EmployerPublicView from "@/components/EmployerPublicView";

/**
 * Public page of a verified employer or instructor — /e/<public_token>
 * (must-do H5, owner GO 2026-10-29). The counterpart of the member page
 * /u/<token>. The link is shared from the app; tokens cannot be listed.
 */
export default function Page() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Pro Registry
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
          Verified Account
        </h1>
        <Link
          href="/verify"
          className="shrink-0 text-sm text-text-muted underline underline-offset-2 hover:text-amber"
        >
          Verify a credential
        </Link>
      </div>

      <EmployerPublicView token={token} />
    </div>
  );
}
