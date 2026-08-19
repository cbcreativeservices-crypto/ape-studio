"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizeCode } from "@/lib/verify";

export default function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = normalizeCode(code);
    if (clean) router.push(`/verify/${clean}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <label htmlFor="code" className="sr-only">
        Credential verification code
      </label>
      <input
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter verification code"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="flex-1 rounded-md border border-border bg-surface px-4 py-3 font-mono uppercase tracking-widest text-foreground outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-text-muted focus:border-amber"
      />
      <button
        type="submit"
        className="rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
      >
        Verify
      </button>
    </form>
  );
}
