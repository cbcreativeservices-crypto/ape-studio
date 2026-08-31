"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import CommunityProfileView from "@/components/CommunityProfileView";

/**
 * Public Audio Community Directory profile — /u/<public_token>.
 *
 * Separate from /registry/<qr_token>, which verifies CREDENTIALS and is
 * permanent. This page exists only while the member chooses to publish it.
 */
export default function Page() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Audio Community Directory
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
          Member Profile
        </h1>
        <Link
          href="/verify"
          className="shrink-0 text-sm text-text-muted underline underline-offset-2 hover:text-amber"
        >
          Verify a credential
        </Link>
      </div>

      <CommunityProfileView token={token} />
    </div>
  );
}
