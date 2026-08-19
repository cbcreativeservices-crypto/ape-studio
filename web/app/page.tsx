import Link from "next/link";
import { TAGLINE, KNOWLEDGE } from "@/lib/brand";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(255,198,77,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
            Professional Audio Education
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold uppercase leading-tight tracking-wide text-foreground sm:text-6xl">
            {TAGLINE}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-sub">
            Pro Audio Training Academy combines structured professional audio
            education with practical learning tools, technical references, and
            verifiable educational credentials.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/academy"
              className="w-full rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep sm:w-auto"
            >
              Explore the Academy
            </Link>
            <Link
              href="/verify"
              className="w-full rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber sm:w-auto"
            >
              Verify a Credential
            </Link>
          </div>
        </div>
      </section>

      {/* App / website relationship */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-text-sub">
          The mobile app is the primary learning environment — where you study,
          practice, and complete assessments. This site is the companion: it
          explains the Academy, holds your account and membership, tracks your
          progress and credentials, verifies credentials for employers, carries
          information for institutions, and hosts member references such as the
          Vacuum Tube Reference.
        </p>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-lg border border-border bg-surface p-6 transition-colors hover:border-amber"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md font-display text-lg font-bold"
                style={{ backgroundColor: `${p.tint}22`, color: p.tint }}
                aria-hidden
              >
                {p.badge}
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                {p.title}
              </h2>
              <p className="mt-2 text-sm text-text-sub">{p.body}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-amber transition-transform group-hover:translate-x-0.5">
                {p.cta} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Knowledge / progress */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground sm:text-3xl">
          {KNOWLEDGE}
        </h2>
        <p className="mt-5 text-text-sub">
          Professional audio knowledge is rarely acquired in a neat, linear
          order. Most people know some areas well and have gaps in others. The
          Academy gives you a structured way to recognize what you already
          understand, find the gaps, and decide what to study next — without
          assuming everyone starts from the same place.
        </p>
      </section>

      {/* Employers & institutions */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-foreground">
              For employers
            </h2>
            <p className="mt-2 text-sm text-text-sub">
              Confirm an Academy credential and understand what it represents —
              a verifiable record of completed educational work.
            </p>
            <Link
              href="/employers"
              className="mt-4 inline-block text-sm font-semibold text-amber hover:text-amber-deep"
            >
              For employers &rarr;
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-foreground">
              For institutions
            </h2>
            <p className="mt-2 text-sm text-text-sub">
              Licensing and custom training for schools, employers, and
              education programs, with credentialing and learner progress.
            </p>
            <Link
              href="/institutions"
              className="mt-4 inline-block text-sm font-semibold text-amber hover:text-amber-deep"
            >
              For institutions &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const PILLARS: {
  href: string;
  badge: string;
  title: string;
  body: string;
  cta: string;
  tint: string;
}[] = [
  {
    href: "/credentials",
    badge: "✓",
    title: "Credentials",
    body: "Verifiable records of completed educational work — how they’re earned, what they show, and what they mean.",
    cta: "About credentials",
    tint: "#37e05f",
  },
  {
    href: "/tubes",
    badge: "▤",
    title: "Tube Reference",
    body: "A secured library of vacuum tube spec cards for Academy members, available on any screen.",
    cta: "Browse tubes",
    tint: "#2f9bff",
  },
  {
    href: "/dashboard",
    badge: "▸",
    title: "Your Academy",
    body: "Sign in to see your membership, progress, and credentials, and continue learning in the app.",
    cta: "Member sign in",
    tint: "#ffc64d",
  },
];
