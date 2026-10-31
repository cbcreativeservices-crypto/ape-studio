import type { Metadata } from "next";
import { PageHero, Section, BrandLine, CTARow } from "@/components/content";

/*
 * Founder page (owner 2026-10-31). Short and authoritative: "say less, yet say
 * more" — not a CV. AUDIO and teaching come first, then education and life
 * experience; music is shown, but second.
 * Facts come only from the owner's CV (Downloads/C_Booth_CV.pdf) and own words.
 * Owner rulings: lead with "Channing", never "Cháno" (the title keeps the nickname
 * in quotes); degrees always "Dual BA and MA"; Program Director and Lead Faculty
 * (NEVER coordinator) of a state-certified program, "since 1999"; partners may be
 * named, never an individual contact; do NOT name the groups he plays with.
 * The full original resume is still to come (must-do D36).
 */
export const metadata: Metadata = {
  title: "Founder",
  description:
    "Professor Channing “Cháno” Booth — Founder & Curriculum Director of Pro Audio Training Academy. Four decades in professional audio, teaching it since 1999 as Program Director of a state-certified college audio program; Dual BA and MA, Berklee College of Music.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Founder &amp; Curriculum Director"
        title="Professor Channing “Cháno” Booth"
        lede="Four decades in professional audio. Teaching it since 1999. A lifetime of experience, brought together in one place and opened to everyone."
      />

      <Section>
        <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.15em] text-text-muted">
          Program Director &amp; Lead Faculty, Audio Production and Engineering · San Diego Miramar College · since 1999
          <br />
          Dual BA and MA · Berklee College of Music · Member, Audio Engineering Society
        </p>
        <p>
          Channing Booth’s career in audio began at age 11, when he was hired to
          run sound for a school production. In the four decades since, he has
          done nearly every job the field
          offers, from front of house and monitors to the studio, system design,
          and installation, including consulting for Harvard University and the
          Boston Museum of Science.
        </p>
        <p>
          Since 1999 he has taught audio at San Diego Miramar College, as
          Professor, Program Director and Lead Faculty of its state-certified
          Audio Production and Engineering program. He built the program,
          created several of its eight courses and edits and reviews the
          curriculum of the rest, designed the
          campus’s state-of-the-art studio and facility where he now teaches,
          and keeps the program tied to the industry through partners such as
          Yamaha Corporation of America.
        </p>
        <p>
          He knows audio from the inside because he builds it: ribbon
          microphones, guitar amplifiers, diffusers, and instruments of wood and
          metal. He services everything from electronics to Hammond organs and
          Rhodes pianos, and tunes and repairs pianos.
        </p>
        <p>
          At Berklee he studied far beyond music: alongside his degrees he took
          audio courses and spent long hours recording in the college’s studios.
          A Berklee-trained musician and a lifelong polymath, he has performed
          across the United States and around the world. His curiosity runs from physics and acoustics to
          psychology, ethnomusicology, history, painting, and photography, and in
          the Academy he found that all of it connects.
        </p>
      </Section>

      <BrandLine>A life’s work in audio, built for everyone.</BrandLine>

      <Section title="Why the Academy">
        <p>
          The Academy is his passion piece: everything he has learned in the
          classroom, the studio, and on stage, in one place. Training of this
          depth has usually been reserved for the few who can afford it. He built
          the Academy so that anyone who wants to learn gets the chance, and no
          one is priced out of a career, or the joy, that audio offers.
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
        primary={{ href: "/get", label: "Get the app" }}
        secondary={{ href: "/curriculum", label: "Curriculum development" }}
      />
    </div>
  );
}
