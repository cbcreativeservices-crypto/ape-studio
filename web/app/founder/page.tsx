import type { Metadata } from "next";
import { PageHero, Section, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "Founder",
  description:
    "Professor Channing “Cháno” Booth — Founder & Curriculum Director of Pro Audio Training Academy: audio educator, engineer, and professional jazz pianist with four decades in the field.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Founder &amp; Curriculum Director"
        title="Professor Channing “Cháno” Booth"
        lede="Four decades in professional audio — behind the boards, in front of the mic, and in the classroom."
      />

      <Section>
        <p>
          Professor Channing “Cháno” Booth has spent his career at the meeting
          point of teaching, engineering, and performance. He is the Founder and
          Curriculum Director of Pro Audio Training Academy.
        </p>
      </Section>

      <Section title="Teaching">
        <p>
          Professor Booth has taught Professional Audio at San Diego Miramar
          College for 28 years. He earned his BA and MA at Berklee College of
          Music.
        </p>
      </Section>

      <Section title="Professional audio">
        <p>
          Across 40 years of live audio, studio recording, and production, he
          has worked behind the boards in the control room and in front of the
          mic. He has produced audio systems and events — front of house,
          monitors, rigging, and more — and served as a live sound and
          installation consultant and technician for Harvard University and the
          Boston Museum of Science.
        </p>
      </Section>

      <Section title="Performer">
        <p>
          The piano is his main talent. As a professional pianist, Cháno has
          performed in clubs, theaters, arenas, music festivals, and
          international jazz festivals — a performing career that runs alongside
          his work in engineering and education.
        </p>
      </Section>

      <Section title="Why the Academy">
        <p>
          The Academy brings together the many worlds of audio — a glossary,
          structured training, work-based learning and employment readiness, and
          professional audio safety for everyone — into one system. For Cháno it
          is a culmination of a life’s work, drawing the strands of a long career
          into something he can offer broadly.
        </p>
        <blockquote className="border-l-2 border-amber pl-4 text-foreground">
          <p>
            “Working at a community college, I saw how — even at that level —
            audio education can be unaffordable, and how hard it is to reach this
            field without a minimum chance to learn. So rather than build on the
            high-cost private model, I built the Academy around the public good.”
          </p>
        </blockquote>
        <p className="text-sm text-text-muted">
          That principle shapes how the Academy is priced and structured. You can
          read more of it on the{" "}
          <a href="/membership" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            membership
          </a>{" "}
          page.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/academy", label: "About the Academy" }}
        secondary={{ href: "/curriculum", label: "Curriculum development" }}
      />
    </div>
  );
}
