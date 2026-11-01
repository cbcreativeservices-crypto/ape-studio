import type { Metadata } from "next";
import { PageHero, Section, List, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "The mission behind Pro Audio Training Academy: a serious foundation in professional audio — knowledge, safety and professional conduct — at a cost that doesn’t decide who can begin.",
};

// Mission and organizational thinking — from the owner's scope brief
// (2026-11-01). Copy claims KNOWLEDGE, never skills (owner rule 2026-10-28):
// the app is a learning app, hands-on training happens with an employer,
// school, internship or apprenticeship.
export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="About"
        title="Why the Academy exists"
        lede="Professional audio contains an enormous amount of interconnected terminology and technical knowledge. Finding an isolated piece of information is easy. Understanding how the pieces fit together is much harder."
      />

      <Section title="Our mission">
        <p className="font-display text-xl font-semibold leading-snug text-foreground">
          The best hands-on training begins before anyone touches the
          equipment.
        </p>
        <p>
          A learner who can’t yet name the gear in front of them, or say what
          its controls do, misses much of what even an exceptional mentor shows.
          That’s where Pro Audio Training Academy begins. For anyone who works
          with sound, or wants to, we teach three things: how sound and
          equipment work, how to stay safe and keep others safe, and how to work
          well as part of a team.
        </p>
      </Section>

      <Section title="What we believe">
        <List
          items={[
            <>
              <strong>Hands-on access is uneven.</strong> Equipment, studios and
              supervised practice aren’t open to everyone, even in some schools.
              Learners can build the foundation while they seek those chances,
              and make better use of them when they come.
            </>,
            <>
              <strong>Safety from the start.</strong> Everyone should understand
              how their actions affect their own safety and others’ — including
              electrical and grounding awareness, hearing protection, and knowing
              when to call a qualified professional.
            </>,
            <>
              <strong>How you work matters.</strong> Communication, cooperation,
              reliability and respect are part of being ready for work, and
              education rarely gives them the attention they deserve.
            </>,
            <>
              <strong>Cost shouldn’t decide who begins.</strong> Talent for sound
              is everywhere, but in-person audio education can be expensive.
              Lowering that barrier gives capable people a chance to find out
              what they can do.
            </>,
            <>
              <strong>Audio is bigger than the studio.</strong> Serious work with
              sound happens in broadcast, nature and wildlife recording,
              scientific research, bioacoustics, acoustic imaging, forensics,
              audio technology, and on the workbench of anyone who repairs,
              modifies or evaluates electronics, consumer audio and vacuum-tube
              equipment. It is one connected field, and learners discover careers
              they didn’t know existed.{" "}
              <a href="/academy" className="text-amber underline underline-offset-2 hover:text-amber-deep">
                What the Academy covers →
              </a>
            </>,
          ]}
        />
      </Section>

      <Section title="Founder">
        <p>
          The Academy was founded by Professor Channing “Cháno” Booth, who has
          taught professional audio at San Diego Miramar College since 1999 and
          brings four decades of experience in live audio, studio recording, and
          production — alongside a performing career as a professional salsa and
          Latin-jazz pianist.
        </p>
        <p>
          <a href="/founder" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            Read more about the founder →
          </a>
        </p>
      </Section>

      <CTARow
        primary={{ href: "/get", label: "Get the app" }}
        secondary={{ href: "/employers", label: "For employers" }}
      />
    </div>
  );
}
