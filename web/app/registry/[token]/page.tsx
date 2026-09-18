"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import RegistryResult from "@/components/RegistryResult";
import ContactThisMember from "@/components/ContactThisMember";

/**
 * Academy Registry credential lookup — the target of every member's QR code
 * (encodes /registry/<qr_token>). Mirrors the /verify/[code] page but resolves
 * the opaque per-user token via public_verify_by_token.
 */
export default function Page() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : (params.token ?? "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Academy Registry
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
          Credential Verification
        </h1>
        <Link href="/verify" className="shrink-0 text-sm text-text-muted underline underline-offset-2 hover:text-amber">
          Verify by code
        </Link>
      </div>

      <RegistryResult token={token} />

      {/* The verification page used to end here, and so did the conversation:
          the app never publishes a member's contact details, so a hiring
          manager who had just confirmed a credential had nowhere to go
          (owner 2026-09-18: "tell them to contact, not just confirm"). */}
      <ContactThisMember />
    </div>
  );
}
