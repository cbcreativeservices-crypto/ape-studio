import Image from "next/image";
import Link from "next/link";
import { TAGLINE, KNOWLEDGE } from "@/lib/brand";
import logoHero from "@/public/logo-hero.png";

export default function Home() {
  return (
    <>
      {/* 1 — HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(255,198,77,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Image
            src={logoHero}
            alt="Pro Audio Training Academy"
            width={160}
            height={160}
            priority
            className="mx-auto h-28 w-28 sm:h-36 sm:w-36"
          />
          <p className="mt-6 font-display text-2xl font-semibold uppercase tracking-wide text-foreground sm:text-3xl">
            Pro Audio Training Academy
          </p>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-amber">
            Professional Audio Education
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-semibold uppercase leading-tight tracking-wide text-foreground sm:text-6xl">
            {TAGLINE}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-text-sub">
            Learn professional audio through a structured curriculum, technical
            references, interactive practice, and assessments — and earn
            credentials you can prove.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/academy"
              className="w-full rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep sm:w-auto"
            >
              Explore the Academy
            </Link>
            <Link
              href="#how-it-works"
              className="w-full rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber sm:w-auto"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* 2 — WHAT YOU CAN DO */}
      <Band>
        <SectionHead
          eyebrow="What you can do"
          title="A complete way to learn audio"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DO.map((d) => (
            <div key={d.title} className="rounded-lg border border-border bg-surface p-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md font-display text-base font-bold"
                style={{ backgroundColor: `${d.tint}22`, color: d.tint }}
                aria-hidden
              >
                {d.badge}
              </div>
              <h3 className="mt-3 font-display text-base font-semibold uppercase tracking-wide text-foreground">
                {d.title}
              </h3>
              <p className="mt-1.5 text-sm text-text-sub">{d.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* 3 — APP PREVIEW */}
      <Band tint>
        <SectionHead
          eyebrow="In the app"
          title="Where the learning happens"
          lede="The mobile app is the primary learning environment — explore the curriculum, study each concept, and practice what you learn."
        />
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
          {SCREENS.map((s) => (
            <PhoneFrame key={s.step} step={s.step} title={s.title} body={s.body} tint={s.tint} />
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-text-muted">
          Interactive studying lives in the mobile app. Sign in on this site to
          track progress and continue where you left off.
        </p>
      </Band>

      {/* 4 — WHAT YOU CAN LEARN */}
      <Band>
        <SectionHead
          eyebrow="What you can learn"
          title="From fundamentals to specialized work"
          lede="A structured curriculum spanning the breadth of professional audio. A few of the areas covered:"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SUBJECTS.map((s) => (
            <div
              key={s}
              className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-sub"
            >
              {s}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/curriculum" className="text-sm font-semibold text-amber hover:text-amber-deep">
            Explore the curriculum &rarr;
          </Link>
        </div>
      </Band>

      {/* 5 — FIND YOUR KNOWLEDGE GAPS */}
      <Band tint>
        <h2 className="mx-auto max-w-3xl text-center font-display text-2xl font-semibold uppercase tracking-wide text-foreground sm:text-3xl">
          {KNOWLEDGE}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-text-sub">
          Professional audio knowledge is rarely acquired in a neat, linear
          order. Most people know some areas well and have gaps in others. The
          Academy helps you see both.
        </p>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { k: "What you already know", tint: "#37e05f" },
            { k: "Where your gaps are", tint: "#ff8a1e" },
            { k: "What to learn next", tint: "#2f9bff" },
          ].map((x, i) => (
            <div key={x.k} className="rounded-lg border border-border bg-surface p-5 text-center">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: x.tint }}
              >
                {i + 1}
              </span>
              <p className="mt-2 font-display text-base font-semibold uppercase tracking-wide text-foreground">
                {x.k}
              </p>
            </div>
          ))}
        </div>
      </Band>

      {/* 6 — HOW LEARNING WORKS */}
      <Band id="how-it-works">
        <SectionHead
          eyebrow="How learning works"
          title="Study, practice, prove"
        />
        <ol className="mx-auto mt-8 flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-stretch">
          {FLOW.map((f, i) => (
            <li key={f} className="flex flex-1 items-center gap-3">
              <div className="flex-1 rounded-lg border border-border bg-surface px-4 py-4 text-center">
                <span className="font-mono text-xs text-text-muted">Step {i + 1}</span>
                <p className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                  {f}
                </p>
              </div>
              {i < FLOW.length - 1 ? (
                <span aria-hidden className="hidden text-text-muted sm:inline">
                  &rarr;
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Band>

      {/* 7 — MEMBERSHIP PHILOSOPHY */}
      <Band tint>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
            One membership. Not a series of extra charges.
          </p>
          <p className="mt-4 text-text-sub">
            Education, tools, assessments, and eligible credentials are included —
            not a new fee every time you finish a topic or earn a credential.
          </p>
          <Link
            href="/membership"
            className="mt-5 inline-block text-sm font-semibold text-amber hover:text-amber-deep"
          >
            How membership works &rarr;
          </Link>
        </div>
      </Band>

      {/* 8 — CREDIBILITY */}
      <Band>
        <SectionHead
          eyebrow="A serious educational system"
          title="Built to be trusted"
        />
        <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          {CREDIBILITY.map((c) => (
            <div key={c} className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3">
              <span aria-hidden className="mt-0.5 text-amber">
                ✓
              </span>
              <span className="text-sm text-text-sub">{c}</span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-4xl text-center text-sm text-text-muted">
          Read more about our{" "}
          <Link href="/standards" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            educational standards
          </Link>{" "}
          and{" "}
          <Link href="/about" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            the Academy
          </Link>
          .
        </div>
      </Band>

      {/* 9 — CREDENTIALS */}
      <Band tint>
        <SectionHead
          eyebrow="Credentials"
          title="Earn it. Prove it."
          lede="Complete a credential’s defined requirements and it’s awarded to your account — a verifiable record anyone can confirm from a code or QR code, with no personal information beyond your name disclosed."
        />
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/credentials"
            className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
          >
            About credentials
          </Link>
          <Link
            href="/verify"
            className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
          >
            Verify a Credential
          </Link>
        </div>
      </Band>

      {/* 10 — EMPLOYERS / INSTITUTIONS */}
      <Band>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-foreground">
              For employers
            </h2>
            <p className="mt-2 text-sm text-text-sub">
              Confirm a candidate’s Academy credential and understand what it
              represents.
            </p>
            <Link href="/employers" className="mt-4 inline-block text-sm font-semibold text-amber hover:text-amber-deep">
              For employers &rarr;
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-foreground">
              For institutions
            </h2>
            <p className="mt-2 text-sm text-text-sub">
              Licensing and custom training for schools, employers, and education
              programs, with credentialing and learner progress.
            </p>
            <Link href="/institutions" className="mt-4 inline-block text-sm font-semibold text-amber hover:text-amber-deep">
              For institutions &rarr;
            </Link>
          </div>
        </div>
      </Band>

      {/* 11 — FINAL CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground sm:text-3xl">
            Start learning the craft
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-sub">
            Explore how the Academy is structured, what you’ll learn, and how
            credentials work.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/academy"
              className="w-full rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep sm:w-auto"
            >
              Explore the Academy
            </Link>
            <Link
              href="/curriculum"
              className="w-full rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber sm:w-auto"
            >
              See the curriculum
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- section helpers ---------- */

function Band({
  children,
  tint,
  id,
}: {
  children: React.ReactNode;
  tint?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`border-b border-border ${tint ? "bg-surface" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">{children}</div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">{eyebrow}</p>
      <h2 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide text-foreground sm:text-3xl">
        {title}
      </h2>
      {lede ? <p className="mt-4 text-text-sub">{lede}</p> : null}
    </div>
  );
}

function PhoneFrame({
  step,
  title,
  body,
  tint,
}: {
  step: string;
  title: string;
  body: string;
  tint: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <div className="rounded-[1.75rem] border border-border bg-background p-2 shadow-xl">
        <div
          className="flex aspect-[9/16] flex-col items-center justify-center rounded-[1.35rem] p-5 text-center"
          style={{
            background: `radial-gradient(120% 80% at 50% 0%, ${tint}22, transparent 70%)`,
          }}
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em]" style={{ color: tint }}>
            {step}
          </span>
          <p className="mt-3 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
            {title}
          </p>
          <p className="mt-2 text-xs text-text-sub">{body}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- content ---------- */

const DO: { badge: string; title: string; body: string; tint: string }[] = [
  { badge: "1", title: "Learn", body: "Structured professional audio curriculum, fundamentals through specialized areas.", tint: "#ffc64d" },
  { badge: "2", title: "Reference", body: "Glossary, technical references, diagrams, and specifications.", tint: "#2f9bff" },
  { badge: "3", title: "Practice", body: "Interactive labs, tools, flashcards, and exercises.", tint: "#37e05f" },
  { badge: "4", title: "Assess", body: "Quizzes and progress tracking that show what you know.", tint: "#b45bff" },
  { badge: "5", title: "Earn", body: "Educational credentials with independent verification.", tint: "#ff8a1e" },
];

const SCREENS: { step: string; title: string; body: string; tint: string }[] = [
  { step: "Explore", title: "Explore", body: "Browse subjects and find where to start.", tint: "#2f9bff" },
  { step: "Learn", title: "Learn", body: "Study each concept — the what, why, and how.", tint: "#ffc64d" },
  { step: "Practice", title: "Practice", body: "Labs, flashcards, and exercises.", tint: "#37e05f" },
];

const SUBJECTS: string[] = [
  "Audio Fundamentals",
  "Microphones",
  "Recording",
  "Mixing",
  "Live Sound",
  "Loudspeakers",
  "Acoustics & Measurement",
  "Signal Processing",
  "Connectivity",
  "Audio Systems",
  "Electronic Music",
  "Career & Professional Skills",
];

const FLOW: string[] = ["Learn", "Practice", "Assess", "Progress", "Credential"];

const CREDIBILITY: string[] = [
  "Curriculum developed from professional and educational experience",
  "Defined educational standards",
  "Structured assessments",
  "Transparent credential requirements",
  "Independent credential verification",
];
