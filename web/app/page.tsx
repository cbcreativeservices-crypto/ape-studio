import Link from "next/link";

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
            Learn the craft. Earn the credential.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-sub">
            Pro Audio Training Academy delivers structured, tested audio
            training in the mobile app. This companion site is where credentials
            are verified, references are kept, and members pick up where they
            left off.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/verify"
              className="w-full rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep sm:w-auto"
            >
              Verify a Credential
            </Link>
            <Link
              href="/dashboard"
              className="w-full rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber sm:w-auto"
            >
              Member Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
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

      {/* Institutions strip */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
              Training teams &amp; institutions
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-sub">
              Schools and employers can sponsor learners with redemption codes
              used at sign-up in the mobile app. Verify earned credentials here,
              publicly and privately.
            </p>
          </div>
          <Link
            href="/institutions"
            className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
          >
            For Institutions
          </Link>
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
    href: "/verify",
    badge: "✓",
    title: "Verify a Credential",
    body: "Employers and members confirm an Academy certificate or program credential from its QR code or code — no personal data exposed.",
    cta: "Open verifier",
    tint: "#37e05f",
  },
  {
    href: "/tubes",
    badge: "▤",
    title: "Tube Reference",
    body: "A secured reference library of vacuum tube diagrams and specifications for members, available on any screen.",
    cta: "Browse tubes",
    tint: "#2f9bff",
  },
  {
    href: "/dashboard",
    badge: "▸",
    title: "Keep Working",
    body: "Sign in to see your progress and jump back into study and testing in the mobile app right where you left off.",
    cta: "Member sign in",
    tint: "#ffc64d",
  },
];
