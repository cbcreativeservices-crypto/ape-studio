import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the Pro Audio Training Academy team for account help, credential questions, press, and partnerships.",
};

const EMAIL = "info@proaudiotrainingacademy.com";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Get in touch
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
        Contact
      </h1>
      <p className="mt-4 max-w-2xl text-text-sub">
        For account help, bug reports, general questions, press, and
        partnerships, email us. We aim to reply within 3&ndash;5 business days.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-text-sub">
          Email
        </p>
        <a
          href={`mailto:${EMAIL}`}
          className="mt-2 inline-block font-mono text-lg text-amber underline underline-offset-2 hover:text-amber-deep"
        >
          {EMAIL}
        </a>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/support"
          className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-amber"
        >
          <p className="font-display text-base font-semibold uppercase tracking-wide text-foreground">
            Support &amp; FAQ
          </p>
          <p className="mt-1 text-sm text-text-sub">
            Account resets, data deletion, reporting content errors, and more.
          </p>
        </Link>
        <Link
          href="/institutions"
          className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-amber"
        >
          <p className="font-display text-base font-semibold uppercase tracking-wide text-foreground">
            Institutions &amp; Teams
          </p>
          <p className="mt-1 text-sm text-text-sub">
            Bulk and multi-seat licensing for schools, studios, and industry.
            Unique login codes are available now.
          </p>
        </Link>
        <Link
          href="/accessibility"
          className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-amber"
        >
          <p className="font-display text-base font-semibold uppercase tracking-wide text-foreground">
            Accessibility
          </p>
          <p className="mt-1 text-sm text-text-sub">
            Report a barrier or ask for help using this website.
          </p>
        </Link>
        <Link
          href="/ai"
          className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-amber"
        >
          <p className="font-display text-base font-semibold uppercase tracking-wide text-foreground">
            How we use AI
          </p>
          <p className="mt-1 text-sm text-text-sub">
            Internal drafting only today. Human review before anything is published.
          </p>
        </Link>
      </div>
    </div>
  );
}
