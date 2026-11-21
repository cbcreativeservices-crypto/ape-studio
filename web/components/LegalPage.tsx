import type { ReactNode } from "react";
import type { LegalMeta } from "@/lib/legal";

export default function LegalPage({
  meta,
  html,
  lead,
}: {
  meta: LegalMeta;
  html: string;
  /** Optional preface above the version line. Not part of the policy text. */
  lead?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
        {meta.title}
      </h1>
      {lead ? (
        <p className="mt-4 text-lg leading-relaxed text-foreground">{lead}</p>
      ) : null}
      <p
        className="mt-3 text-sm text-text-muted"
        dangerouslySetInnerHTML={{ __html: meta.updated }}
      />
      <div
        className="legal-prose mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
