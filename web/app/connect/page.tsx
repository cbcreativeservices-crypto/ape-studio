import type { ReactNode } from "react";
import Image from "next/image";
import { RoomField } from "@/components/Atmosphere";
import { AppScreen } from "@/components/AppScreen";
import { getAppScreen } from "@/lib/app-screens";
import logoMark from "@/public/logo-mark.png";
import ConnectForm from "@/components/connect/ConnectForm";
import { normalizeConnectFrom } from "@/lib/connect";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const from = normalizeConnectFrom(params.from);

  return (
    <div className="connect relative">
      <RoomField />

      <div className="relative z-10 mx-auto max-w-lg px-5 pb-28 pt-12 sm:px-6 sm:pt-16">
        <header className="connect-letterhead">
          <Image
            src={logoMark}
            alt=""
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-sm"
          />
          <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-text-muted">
            Pro Audio Training Academy
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-wide text-foreground sm:text-5xl">
            We met.
          </h1>
          <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-text-sub">
            You were handed this address in person. It’s written for schools,
            studios, and employers — and for anyone else I thought should
            have it.
          </p>
        </header>

        <hr className="connect-rule" />

        <Section title="What this is">
          <p>
            The Academy is structured professional audio education, and a
            credential members can show. People study in the mobile app.
            You license seats. Employers verify what a credential means.
          </p>
        </Section>

        <Section title="The classroom">
          <p>
            A seat is a learner in that room — terminology, labs, assessment,
            and a record they can prove.
          </p>
          <div className="mt-8 flex justify-center sm:justify-start">
            <AppScreen screen={getAppScreen("home")} size="md" />
          </div>
        </Section>

        <Section title="What you can license">
          <div className="connect-sheet mt-2">
            <div className="connect-sheet-row">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-amber">
                Now
              </p>
              <p>
                Site licenses, bought from us. Unique login codes, one per seat,
                issued to the institution for its own people — not sold to
                individuals. Discounted for education and industry — the
                more seats, the better the rate.
              </p>
            </div>
            <div className="connect-sheet-row">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                Coming
              </p>
              <p>
                Custom topics, certificates, courses, and app configuration
                shaped to your program, plus cohort reporting. Not for sale
                yet.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Write to me" id="write">
          <p>
            I’m Channing Booth. I read these myself.
          </p>
          <ConnectForm from={from} />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  const headingId = `connect-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="connect-section" id={id} aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-display text-xl font-semibold tracking-wide text-foreground"
      >
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-[0.98rem] leading-relaxed text-text-sub">
        {children}
      </div>
    </section>
  );
}