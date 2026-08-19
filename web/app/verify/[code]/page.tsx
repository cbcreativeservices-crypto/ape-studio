"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import VerifyResult from "@/components/VerifyResult";
import { normalizeCode } from "@/lib/verify";

export default function Page() {
  const params = useParams<{ code: string }>();
  const raw = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = normalizeCode(raw ?? "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Credential verification
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
          Verify a Credential
        </h1>
        <Link href="/verify" className="shrink-0 text-sm text-text-muted underline underline-offset-2 hover:text-amber">
          New check
        </Link>
      </div>
      <p className="mt-3 font-mono text-sm text-text-sub">
        Code: <span className="text-foreground">{code || "—"}</span>
      </p>

      <VerifyResult code={code} />
    </div>
  );
}
