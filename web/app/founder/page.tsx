import type { Metadata } from "next";
import { PageHero, Section, BrandLine, CTARow } from "@/components/content";

/*
 * Founder page (owner 2026-10-31). A short story, not a CV: the owner's CV
 * (Downloads/C_Booth_CV.pdf) was written for work; this page "says less, yet says
 * more". AUDIO comes first — four decades in professional audio, teaching it since
 * 1999 and running a state-certified college program — then education and life
 * experience; music is shown, but second (owner: "for the app, it is my audio
 * teaching experience, my education, and my life experiences").
 * Facts come only from the CV and the owner's own words (first paid audio job at
 * 11, recording at 12, first paid gig at 13, composing/producing at 15, performed
 * across the US and worldwide, painter, professional photographer, state-certified
 * program). Owner rulings: title is Program Director and Lead Faculty (NOT
 * coordinator); Miramar as "since 1999"; partners may be named, never an
 * individual contact. The full original resume is still to come (must-do D36).
 */
export const metadata: Metadata = {
  title: "Founder",
  description:
    "Professor Channing “Cháno” Booth — Founder & Curriculum Director of Pro Audio Training Academy. Four decades in professional audio, teaching it since 1999 as Program Director of a state-certified college audio program, and Berklee-trained.",
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
          Four decades in professional audio · Member, Audio Engineering Society
          <br />
          Berklee College of Music · B.M. 1995, M.M. 1997
        </p>
        <p>
          Cháno Booth has worked in audio since he was a child: he ran sound for
          pay at 11 and was recording at 12. Four decades on, he has done nearly
          every job the field has to offer: front of house and monitors, the
          recording studio and the control room, system design, rigging and
          installation, and live sound and installation consulting for Harvard
          University and the Boston Museum of Science.
        </p>
      </Section>

      <Section title="Teaching audio since 1999">
        <p>
          For more than a quarter of a century he has taught audio at San Diego
          Miramar College, where he is Professor, Program Director and Lead
          Faculty of the college’s state-certified Audio Production and
          Engineering program. He built and runs its recording studios and
          labs, wrote its course in sound reinforcement systems, and keeps the
          program tied to the working industry through its advisory board and
          partners such as Yamaha Corporation of America. In 2024 he was
          recognized by UC San Diego and by the Empirical Labs Audio Educator
          Advisory Group.
        </p>
        <p>
          Generations of students have learned the craft from him, and the
          Academy carries the same teaching to anyone, anywhere.
        </p>
      </Section>

      <Section title="The musician">
        <p>
          His ear was trained at the piano. He earned his Bachelor of Music at
          Berklee College of Music in 1995 and his Master of Music in 1997, has
          performed across the United States and around the world, and still
          plays regularly with Afrotruko, a 13-piece salsa orchestra, and Perla
          Negra, a Cuban jazz piano trio. Composing and producing since 15, he
          knows what it is to be on both sides of the glass.
        </p>
      </Section>

      <Section title="Where it all connects">
        <p>
          His curiosity has never stopped at the mixing desk: physics and
          acoustics, psychology and ethnomusicology, history and the humanities,
          painting, professional photography, and the culinary arts. In building
          the Academy he found that it all connects: the physics of a vibrating
          string, the way we hear, the culture a rhythm carries, and the craft of
          the people who capture it.
        </p>
      </Section>

      <BrandLine>A life’s work in audio, built for everyone.</BrandLine>

      <Section title="Why the Academy">
        <p>
          The Academy is his passion piece: everything he has learned in the
          classroom, the studio, on stage, and at the piano, in one place.
          Training of this depth has usually been reserved for the few who can
          afford a private school. He built the Academy so that anyone who wants
          to learn gets the chance, and so that no one is priced out of a
          career, or the joy, that audio offers.
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
