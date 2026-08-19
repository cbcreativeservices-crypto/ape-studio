import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Institutions",
  description:
    "Schools and employers can sponsor learners on Pro Audio Training Academy with redemption codes and verify earned credentials.",
};

const EMAIL = "info@proaudiotrainingacademy.com";

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "1",
    title: "Request codes",
    body: "Contact us with how many learners you want to sponsor and your program details. We issue a batch of redemption codes for your organization.",
  },
  {
    n: "2",
    title: "Learners redeem in the app",
    body: "Your people enter the code in the extra code area at sign-up in the mobile app. That links their account to your organization and applies the sponsored access.",
  },
  {
    n: "3",
    title: "Verify credentials here",
    body: "As learners earn certificates and program credentials, confirm them on this site from a QR code or credential code — no personal data exposed.",
  },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Training teams &amp; institutions
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-5xl">
        Sponsor learners. Verify results.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-text-sub">
        Pro Audio Training Academy lets schools and employers fund training for
        their people. You purchase and distribute redemption codes; learners
        redeem them in the mobile app to unlock sponsored or discounted access.
        Earned credentials can be verified here at any time.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-lg border border-border bg-surface p-6">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md font-display text-lg font-bold"
              style={{ backgroundColor: "#2f9bff22", color: "#2f9bff" }}
              aria-hidden
            >
              {s.n}
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
              {s.title}
            </h2>
            <p className="mt-2 text-sm text-text-sub">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-foreground">
          Talk to us about sponsoring learners
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-sub">
          Tell us about your organization and how many learners you want to
          support. We&rsquo;ll follow up with code pricing and setup. A dedicated
          inquiry form is coming soon; for now, email works well.
        </p>
        <a
          href={`mailto:${EMAIL}?subject=Institution%20inquiry`}
          className="mt-5 inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Email {EMAIL}
        </a>
      </div>

      <p className="mt-8 text-sm text-text-muted">
        Already have credentials to check?{" "}
        <Link href="/verify" className="text-amber underline underline-offset-2 hover:text-amber-deep">
          Verify a credential
        </Link>
        .
      </p>
    </div>
  );
}
