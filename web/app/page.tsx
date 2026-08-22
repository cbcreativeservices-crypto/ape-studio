import Image from "next/image";
import Link from "next/link";
import { TAGLINE, KNOWLEDGE } from "@/lib/brand";
import { AppScreen } from "@/components/AppScreen";
import { AppScreenMarquee } from "@/components/AppScreenMarquee";
import {
  FEATURED_SCREEN_IDS,
  HERO_SCREEN_IDS,
  getAppScreen,
} from "@/lib/app-screens";

export default function Home() {
  return (
    <div className="relative">
      <div className="home-atmosphere" aria-hidden />
      <div className="relative z-[1]">
      {/* 1 — HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 45% at 82% 0%, rgba(47,155,255,0.056), transparent 68%), radial-gradient(40% 35% at 50% 0%, rgba(255,198,77,0.038), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-0 text-center sm:px-6 sm:pt-10">
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground sm:text-xl">
            Pro Audio Training Academy
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-2xl font-semibold uppercase leading-tight tracking-wide text-foreground sm:text-4xl">
            {TAGLINE}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-text-sub sm:text-lg">
            A structured way to learn professional audio — and a credential you
            can show.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get"
              className="w-full rounded-md bg-amber px-6 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep sm:w-auto"
            >
              Get the app
            </Link>
            <Link
              href="/academy"
              className="w-full rounded-md border border-border px-6 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber sm:w-auto"
            >
              Explore the Academy
            </Link>
          </div>
        </div>
        <AppScreenMarquee ids={HERO_SCREEN_IDS} />
      </section>

      {/* 2 — KNOWLEDGE GAPS */}
      <Band tint>
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
          <div className="text-center md:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
              Knowledge
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-wide text-foreground sm:text-3xl">
              You already know some of it.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-display text-lg font-semibold tracking-wide text-foreground md:mx-0">
              {KNOWLEDGE}
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-text-sub md:mx-0">
              Professional audio knowledge is rarely acquired in a neat, linear
              order. Most people know some areas well and have gaps in others. The
              Academy helps you see both.
            </p>
            <Link
              href="/curriculum"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-border px-8 py-3 font-display text-base font-semibold tracking-wide text-foreground transition-colors hover:border-amber hover:text-amber sm:w-auto"
            >
              Explore the curriculum
            </Link>
          </div>
          <AppScreen
            screen={getAppScreen("study")}
            size="md"
            className="shrink-0"
          />
        </div>
      </Band>

      {/* 3 — WHAT YOU CAN DO */}
      <Band>
        <SectionHead
          eyebrow="What you can do"
          title="A complete way to learn audio"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DO.map((d) => (
            <div key={d.title} className="rounded-lg border border-border bg-surface/80 p-4 backdrop-blur-[2px]">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md font-display text-sm font-bold"
                style={{ backgroundColor: `${d.tint}22`, color: d.tint }}
                aria-hidden
              >
                {d.badge}
              </div>
              <h3 className="mt-2 font-display text-base font-semibold uppercase tracking-wide text-foreground">
                {d.title}
              </h3>
              <p className="mt-1 text-sm text-text-sub">{d.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* 3 — GLOSSARY */}
      <section className="relative overflow-hidden border-b border-border">
        <Image
          src="/glossary-bg.png"
          alt=""
          fill
          className="object-cover object-[100%_68%]"
          sizes="100vw"
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/50"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-start md:gap-8">
          <div className="max-w-xl text-center md:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
              Glossary
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
              Look up terms, then go deeper
            </h2>
            <p className="mt-2 text-text-sub">
              Glossary, technical references, diagrams, and specifications.
            </p>
          </div>
          <AppScreen
            screen={getAppScreen("home")}
            size="md"
            className="shrink-0"
          />
        </div>
      </section>

      {/* 6 — APP PREVIEW */}
      <Band tint id="in-the-app">
        <SectionHead
          eyebrow="In the app"
          title="Where the learning happens"
          lede="The mobile app is the primary learning environment — explore the curriculum, study each concept, and practice what you learn."
        />
        <div className="mx-auto mt-5 grid max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURED_SCREEN_IDS.map((id) => (
            <AppScreen key={id} screen={getAppScreen(id)} size="md" caption />
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-text-muted">
          Interactive studying lives in the mobile app. Create your account there,
          then sign in here to track progress and verify credentials.
        </p>
        <div className="mt-5 text-center">
          <Link
            href="/get"
            className="inline-flex rounded-md bg-amber px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
          >
            Get the app
          </Link>
        </div>
      </Band>

      {/* 6 — MEMBERSHIP */}
      <Band compact>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-xl font-semibold uppercase tracking-wide text-foreground sm:text-2xl">
            One membership. Not a series of extra charges.
          </p>
            <p className="mt-2 text-text-sub">
              Education, tools, assessments, and eligible credentials are included —
              not a new fee every time you finish a topic or earn a credential.
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/get"
                className="rounded-md bg-amber px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
              >
                Get the app
              </Link>
              <Link
                href="/membership"
                className="text-sm font-semibold text-amber hover:text-amber-deep"
              >
                How membership works
              </Link>
            </div>
        </div>
      </Band>

      {/* 7 — CREDIBILITY + CREDENTIALS */}
      <Band tint>
        <div className="grid items-start gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <SectionHead
              align="left"
              eyebrow="A serious educational system"
              title="Built to be trusted"
            />
            <div className="mt-4 grid gap-2">
              {CREDIBILITY.map((c) => (
                <div key={c} className="flex items-start gap-3 rounded-md border border-border bg-surface/75 px-3 py-2.5 backdrop-blur-[2px]">
                  <span aria-hidden className="mt-0.5 text-amber">
                    ✓
                  </span>
                  <span className="text-sm text-text-sub">{c}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Founded by Professor Channing “Cháno” Booth, who has taught
              professional audio at San Diego Miramar College for 28 years and
              spent four decades in the field.{" "}
              <Link href="/founder" className="text-amber underline underline-offset-2 hover:text-amber-deep">
                About the founder
              </Link>
              . Read our{" "}
              <Link href="/standards" className="text-amber underline underline-offset-2 hover:text-amber-deep">
                educational standards
              </Link>
              .
            </p>
          </div>
          <div>
            <SectionHead
              align="left"
              eyebrow="Credentials"
              title="Earn it. Prove it."
              lede="Finish the requirements, and the credential is yours — anyone can confirm it from a code. Verification shows your name and the credential. Nothing else."
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/credentials"
                className="rounded-md border border-border px-5 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
              >
                About credentials
              </Link>
              <Link
                href="/verify"
                className="rounded-md border border-border px-5 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
              >
                Verify a Credential
              </Link>
            </div>
            <AppScreen
              screen={getAppScreen("quiz")}
              size="sm"
              className="mt-5 md:mx-0"
            />
          </div>
        </div>
      </Band>

      {/* 8 — GET THE APP */}
      <Band>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
            Start in the app
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-wide text-foreground">
            Create your account. Start learning.
          </h2>
          <p className="mt-2 text-text-sub">
            Membership is available inside the Pro Audio Training Academy app.
            Store listings will appear here when they go live.
          </p>
          <Link
            href="/get"
            className="mt-5 inline-flex rounded-md bg-amber px-8 py-3 font-display text-base font-semibold tracking-wide text-background transition-colors hover:bg-amber-deep"
          >
            Get the app
          </Link>
          <p className="mt-6 text-sm text-text-muted">
            Confirm a candidate’s credential?{" "}
            <Link href="/verify" className="text-amber underline underline-offset-2 hover:text-amber-deep">
              Verify a credential
            </Link>
            . Training a team?{" "}
            <Link href="/institutions" className="text-amber underline underline-offset-2 hover:text-amber-deep">
              For institutions
            </Link>
            .
          </p>
        </div>
      </Band>
      </div>
    </div>
  );
}

/* ---------- section helpers ---------- */

function Band({
  children,
  tint,
  id,
  compact,
}: {
  children: React.ReactNode;
  tint?: boolean;
  id?: string;
  compact?: boolean;
}) {
  return (
    <section
      id={id}
      className={`border-b border-border ${
        tint ? "bg-[rgba(21,21,21,0.35)]" : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto max-w-6xl px-4 sm:px-6 ${compact ? "py-8" : "py-10"}`}
      >
        {children}
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  lede,
  align = "center",
  className = "",
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-3xl text-center" : ""} ${className}`}>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">{eyebrow}</p>
      <h2 className="mt-1.5 font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h2>
      {lede ? <p className="mt-2 text-text-sub">{lede}</p> : null}
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

const CREDIBILITY: string[] = [
  "Curriculum developed from professional and educational experience",
  "Defined educational standards",
  "Structured assessments",
  "Transparent credential requirements",
  "Independent credential verification",
];
