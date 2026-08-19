import type { ReactNode } from "react";
import Link from "next/link";

/** Standard page header: eyebrow + title + optional lede. */
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">{eyebrow}</p>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
        {title}
      </h1>
      {lede ? <p className="mt-5 text-lg text-text-sub">{lede}</p> : null}
    </div>
  );
}

/** A titled content section (prose-ish, dark theme). */
export function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {title ? (
        <h2 className="mb-3 border-t border-border pt-8 font-display text-xl font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h2>
      ) : null}
      <div className="space-y-4 text-text-sub [&_a]:text-amber [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-amber-deep [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

/** A brand messaging line rendered as a pull-quote (used at most once per page). */
export function BrandLine({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-3xl px-4 py-6 text-center font-display text-xl font-semibold uppercase tracking-wide text-foreground sm:px-6 sm:text-2xl">
      {children}
    </p>
  );
}

/** A restrained "being finalized" note (used where owner-specific facts are pending). */
export function PendingNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
      {children}
    </div>
  );
}

/** Bulleted list, themed. */
export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2 marker:text-text-muted">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/** Primary / secondary CTA buttons. */
export function CTARow({
  primary,
  secondary,
}: {
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-4 sm:flex-row sm:px-6">
      {primary ? (
        <Link
          href={primary.href}
          className="rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          {primary.label}
        </Link>
      ) : null}
      {secondary ? (
        <Link
          href={secondary.href}
          className="rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
        >
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}
