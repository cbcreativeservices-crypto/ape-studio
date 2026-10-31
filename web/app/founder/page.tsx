import type { Metadata } from "next";
import { PageHero, Section, List, BrandLine, CTARow } from "@/components/content";

/*
 * Founder page — rewritten 2026-10-31 from the owner's CV (Downloads/C_Booth_CV.pdf).
 * Every fact here is from that CV or the owner's own words; nothing is inferred.
 * Owner rulings: Miramar tenure as "since 1999" (stays true every year); name the
 * partner organisations as worded on the CV, but not the individual contact.
 */
export const metadata: Metadata = {
  title: "Founder",
  description:
    "Professor Channing “Cháno” Booth — Founder & Curriculum Director of Pro Audio Training Academy. Berklee-trained pianist and composer, Professor of Music and Audio Production and Engineering at San Diego Miramar College since 1999, and four decades in professional audio.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Founder &amp; Curriculum Director"
        title="Professor Channing “Cháno” Booth"
        lede="Berklee-trained musician, college professor of audio production and engineering since 1999, and four decades in professional audio. The Academy is his life’s work, brought together in one place and opened to everyone."
      />

      <Section>
        <p>
          Professor Channing “Cháno” Booth has spent his career where music,
          engineering, and teaching meet. He has run the stage and the studio,
          led a college audio program, and performed at the piano for audiences
          across Southern California and Baja California. Pro Audio Training
          Academy is the work of that whole career, and he is its Founder and
          Curriculum Director.
        </p>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">At a glance</p>
          <ul className="mt-3 space-y-2 text-sm text-text-sub">
            <li>
              <strong>Master of Music</strong>, Jazz Studies (Composition Emphasis):
              Boston Conservatory / Berklee College of Music, 1997
            </li>
            <li>
              <strong>Bachelor of Music</strong>, dual major in Piano Performance and
              Jazz Composition: Berklee College of Music, 1995
            </li>
            <li>
              <strong>Professor of Music and Audio Production and Engineering</strong>,
              San Diego Miramar College, faculty since 1999
            </li>
            <li>
              <strong>Coordinator</strong> of the college’s Audio Production and
              Engineering program
            </li>
            <li>
              <strong>Four decades</strong> in live sound, studio recording, and
              production
            </li>
            <li>
              <strong>Member</strong>, Audio Engineering Society
            </li>
          </ul>
        </div>
      </Section>

      <Section title="Education">
        <p>
          Professor Booth earned his Bachelor of Music at Berklee College of Music
          in 1995, with a dual major in Piano Performance and Jazz Composition,
          and his Master of Music in Jazz Studies, with an emphasis in
          composition, at Boston Conservatory / Berklee College of Music in 1997.
        </p>
      </Section>

      <Section title="Teaching and program leadership">
        <p>
          Since 1999 he has taught at San Diego Miramar College, where he is
          Professor of Music and Audio Production and Engineering, and the
          coordinator and lead faculty member of the Audio Production and
          Engineering program. He teaches face-to-face and online, connecting
          music theory, performance, and listening to the science of sound and
          musical perception, often demonstrating at the piano in class.
        </p>
        <List
          items={[
            "Leads the Audio Production and Engineering program, with scheduling, studio operations, and a faculty team",
            "Runs the program’s industry advisory board, bringing working professionals into curriculum decisions",
            "Plans equipment acquisition, from technical evaluation and vendor coordination to budget and integration",
            "Author of Audio 201: Sound Reinforcement Systems, first offered in Fall 2025",
            "Writes the annual program reviews for the college’s music and audio programs, and has served on the Academic Senate",
          ]}
        />
      </Section>

      <Section title="Studios and facilities">
        <p>
          He is responsible for the college’s instructional recording studio and
          audio laboratories: a recording complex with a control room and
          multiple isolation booths, a 24-workstation computer music lab, and a
          mixing and mastering suite. He designs the signal integration and
          cabling, installs and maintains the equipment, and keeps the systems
          running for every class that uses them.
        </p>
      </Section>

      <Section title="Professional audio">
        <p>
          Across four decades of live sound, studio recording, and production,
          he has worked behind the boards in the control room and in front of
          the mic. He has produced audio systems and events, including front of
          house, monitors, and rigging, and served as a live sound and
          installation consultant and technician for Harvard University and the
          Boston Museum of Science.
        </p>
      </Section>

      <Section title="In the industry">
        <List
          items={[
            "Industry collaboration with Yamaha Corporation of America",
            "Professional relationships with Greene Music, Rarefied Recording, and Studio West",
            "Member of the Audio Engineering Society; conference development committee member, moderator, and session facilitator for the AES DEI Conference, Breaking Barriers in Audio (2025)",
            "About ten years of attendance at the NAMM Show",
            "Faculty Association of California Community Colleges; affiliated with IATSE through events and professional networking",
          ]}
        />
      </Section>

      <Section title="At the piano">
        <p>
          The piano is his first instrument and his main talent. A specialist
          in jazz, Latin jazz, and salsa, he performs throughout Southern
          California and Baja California, with about 150 public performances in
          the past three years, as pianist with Afrotruko, a 13-piece salsa
          ensemble, and with Perla Negra, a Cuban jazz piano trio. Over his
          career he has played clubs, theaters, arenas, music festivals, and
          international jazz festivals.
        </p>
      </Section>

      <Section title="Recognition">
        <List
          items={[
            "Certificate of Recognition, African and African-American Studies Research Center, University of California San Diego (2024)",
            "Certificate of Recognition, Empirical Labs Audio Educator Advisory Group (2024)",
          ]}
        />
      </Section>

      <BrandLine>A life’s work in audio, built for everyone.</BrandLine>

      <Section title="Why the Academy">
        <p>
          Everything Professor Booth has learned on stage, in the studio, at the
          piano, and in the classroom is in the Academy: the glossary, structured
          training, hands-on labs, work-based learning and employment readiness,
          and professional audio safety, brought together in one system.
        </p>
        <p>
          It is his passion piece. Training of this depth has usually been
          available only to the few who can afford a private audio school. The
          Academy exists to give that same depth to anyone who wants to learn.
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
