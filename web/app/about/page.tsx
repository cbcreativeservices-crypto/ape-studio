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

      <Section>
        <p>
          Pro Audio Training Academy was created to close that gap — to organize
          the field into a structured educational system where terms connect to
          the principles around them, concepts build in a deliberate order, and
          the knowledge you gain is something you can apply and document.
        </p>
        <p>
          All of the learning happens in the Pro Audio Training Academy app for
          iPhone, iPad and Android.
        </p>
      </Section>

      <Section title="Our mission">
        <p>
          To give anyone serious about sound a thorough foundation for the work —
          technical knowledge, safety awareness and an understanding of
          professional conduct — so hands-on training counts, at a cost that
          doesn’t decide who gets to begin.
        </p>
      </Section>

      <Section title="Knowledge first, so hands-on time counts">
        <p>
          Nothing replaces working with real equipment: apprenticeships,
          internships and practice build abilities that only
          come from doing. But instruction from even an exceptional professional
          has limited value when a beginner can’t name the equipment or follow
          what the controls do.
        </p>
        <p>
          The Academy teaches what things are, what they do and how they work —
          equipment, controls, terminology and the relationships between them —
          so learners can follow instruction, ask useful questions and understand
          what they’re watching. Access to equipment, studios and supervised
          practice is uneven, even within some schools. A learner can build that
          foundation while seeking those opportunities, and make better use of
          them when they arrive.
        </p>
      </Section>

      <Section title="Safety from the start">
        <p>
          Everyone who works in audio should understand how their actions can
          affect their own safety and the safety of the people around them. No
          one should cause harm because their education never made them aware of
          a hazard or taught them to recognize the limits of what they know.
        </p>
        <p>
          That includes electricity. Audio professionals use powered equipment
          every day, so basic electrical and grounding awareness belongs in
          everyone’s foundation — with the emphasis on informed, responsible
          behavior and on recognizing when a situation needs a qualified
          professional. Hearing protection is taught alongside them.
        </p>
      </Section>

      <Section title="How you work matters as much as what you know">
        <p>
          Being ready for work means more than technical knowledge. It is also
          how someone communicates, cooperates and conducts themselves — with
          reliability and respect. Experience with work-based learning shows how
          much these employment skills matter, and how rarely education gives
          them the attention they deserve.
        </p>
        <p>
          Respectful teamwork improves the work itself. Teams that know how to
          collaborate accomplish more, avoid unnecessary friction and use their
          time well. The Academy’s curriculum includes workplace skills, crew
          roles and show communication so learners arrive with a foundation an
          employer can build on, rather than teach from the beginning.
        </p>
      </Section>

      <Section title="Cost shouldn’t decide who enters the field">
        <p>
          Comprehensive, in-person audio education can carry a high price. That
          makes entry easiest for people with financial resources, or those
          willing to take on substantial debt — and it means capable people may
          never find out what they could do with sound.
        </p>
        <p>
          The Academy exists to lower that barrier: to make serious foundational
          education accessible to people who otherwise couldn’t afford it, so
          overlooked talent has a chance to discover its abilities, develop them,
          and go as far in the profession as it can.
        </p>
      </Section>

      <Section title="Audio is bigger than the studio">
        <p>
          Recording engineers, producers and live sound technicians are at the
          heart of the field — and they are not the whole of it. Many people work
          seriously with sound under very different job titles, capturing,
          measuring, analyzing, reproducing or interpreting it:
        </p>
        <List
          items={[
            "broadcast and media production",
            "recording birds, wildlife and natural soundscapes",
            "recording and analyzing sound for scientific research and publication",
            "graduate-level acoustical research, bioacoustics and acoustic imaging",
            "audio forensics",
            "developing microphones and other audio technology",
          ]}
        />
        <p>
          What they share is purposeful use, critical evaluation, technical
          understanding and care for the quality of the work. The same body of
          knowledge belongs to serious enthusiasts who study, modify, repair and
          critically evaluate equipment — consumer audio, circuit boards,
          electronics and vacuum tubes — often in considerable depth.
        </p>
        <p>
          Acoustics, electronics, recording, measurement, vibration and harmonics
          are connected, and a question about reflections off a studio wall can lead
          straight into how scientists, designers and investigators use the same
          principles. The Academy teaches the field as one connected body of
          knowledge, so learners discover those connections — and career paths
          they didn’t know existed.{" "}
          <a href="/academy" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            What the Academy covers →
          </a>
        </p>
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
