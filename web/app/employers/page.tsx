import type { Metadata } from "next";
import { PageHero, Section, List, CTARow } from "@/components/content";
import VerifyForm from "@/components/VerifyForm";

export const metadata: Metadata = {
  title: "For Employers & Instructors",
  description:
    "Employers and audio instructors: verify a Pro Audio Training Academy credential and see what it represents. Enter a credential code to confirm it is genuine and current.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="For Employers & Instructors"
        title="Verify a credential"
        lede="Confirm that a candidate’s — or a student’s — Pro Audio Training Academy credential is genuine and current, and understand what it does and doesn’t tell you."
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-text-sub">
            Enter a verification code
          </p>
          <VerifyForm />
          <p className="mt-4 text-xs text-text-muted">
            You can also scan the holder’s QR code with a phone camera to open
            their verification directly.
          </p>
        </div>

        {/* Verifying is only half of what an employer wants. Owner 2026-09-18:
            tell them they can CONTACT, and what that takes. */}
        <div className="mt-6 rounded-xl border border-amber/40 bg-amber/5 p-6 sm:p-8">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
            Want to reach the person, not just check the certificate?
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Verified employers and instructors can contact members directly through the app. We never publish a
            member’s email or phone number — you send a request, and they decide whether to reply.
            It takes an Academy account and the app; if your work email is at your company’s own
            domain (or your school&rsquo;s), verification is immediate.
          </p>
          <a
            href="/employers/apply"
            className="mt-5 inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
          >
            Apply for an employer or instructor account
          </a>
        </div>
      </div>

      {/* What Academy training means for an employer — owner scope brief
          2026-11-01. Facts from the live award rules: every credential
          requires the four core topics (award_standing_requirements) plus its
          specialty topics; a quiz topic opens only after its study activities
          are complete; quizzes are up to 30 questions, 10 minutes, at most two
          wrong; Audio Fundamentals is completed through its 15 labs; then a
          final exam to the same standard. Other lab requirements are NOT
          claimed (enforcement is off until store approval). Claims KNOWLEDGE,
          never skills (owner rule 2026-10-28). */}
      <Section id="training" title="What Academy training means for your team">
        <p>
          The Academy prepares people to <strong>begin</strong> hands-on
          training, so more of the time you spend with them goes into your work
          rather than the basics. A graduate arrives knowing the terminology,
          the types of equipment and the principles of their specialty — what
          things are, what they do and how they work — ready to follow your
          instruction, ask useful questions and understand what they are
          watching.
        </p>
        <p>
          What they still need is what only you can give: time on your
          equipment, in your venue or studio, under your supervision. Academy
          training is built to make that time count, not to replace it.
        </p>
      </Section>

      <Section title="What every graduate has studied">
        <p>
          Every Academy credential — whatever its specialty — requires the same
          four core topics, because they are the foundation of working safely and
          working well with others:
        </p>
        <List
          items={[
            <>
              <strong>Pro Audio Safety</strong> — how their actions affect their
              own safety and the safety of the people around them, and how to
              recognize the limits of what they know.
            </>,
            <>
              <strong>Grounding &amp; Electrical</strong> — electrical and
              grounding awareness for powered equipment, with the emphasis on
              responsible behavior and on knowing when a situation needs a
              qualified professional.
            </>,
            <>
              <strong>Audio Fundamentals</strong> — the physics of sound, signal
              and level that everything else is built on.
            </>,
            <>
              <strong>Workplace Skills</strong> — communication, cooperation,
              reliability, respect and professional conduct on a team.
            </>,
          ]}
        />
        <p>
          We believe workplace conduct deserves far more attention than
          education usually gives it. People should enter the workplace with a
          foundation in working together, so you can build on it rather than
          teach it from the beginning.
        </p>
      </Section>

      <Section title="How a credential is earned">
        <p>
          An Academy credential verifies completion of defined educational
          requirements in professional audio — evidence that the holder has
          studied and been assessed on that material. Each credential requires
          the four core topics plus the topics of its specialty.
        </p>
        <List
          items={[
            "A topic’s quiz opens only after every study activity in that topic is complete.",
            "Each topic quiz has up to 30 questions and a 10-minute limit. A pass allows no more than two wrong answers.",
            "Audio Fundamentals is completed through 15 interactive labs in the app.",
            "The final examination is drawn from all the required topics, to the same standard. The credential is conferred only when it is passed.",
          ]}
        />
        <p>
          A <strong>Specialization Certificate</strong> documents a focused area
          of professional practice. A{" "}
          <strong>Professional Certificate Program</strong> documents a broader
          course of study across a complete professional role, such as live
          sound, studio recording, broadcast or forensic audio. Every
          verification result includes the credential catalog, with the topics
          each credential requires.
        </p>
      </Section>

      <Section title="How to interpret it">
        <p>
          A credential confirms educational completion — not that someone is
          qualified for every situation a role may involve. Evaluate it
          alongside the other factors appropriate to the position:
        </p>
        <List
          items={[
            "hands-on experience",
            "practical ability",
            "prior education and training",
            "references",
            "the specific requirements of the role",
          ]}
        />
        <p>
          Verification tells you the credential is real and current, and what it
          covers. The hiring judgment remains yours. For instructors, it confirms
          the student met the certificate’s requirements; your own grading
          remains yours.
        </p>
      </Section>

      <Section title="The thinking behind it">
        <p>
          The Academy exists to make a serious foundation in audio — knowledge,
          safety awareness and an understanding of professional conduct —
          affordable to anyone serious about sound. That widens the pool of
          capable people who reach you, including talent a costly educational
          path might have kept out of the field.{" "}
          <a href="/about" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            Read the Academy’s mission →
          </a>
        </p>
      </Section>

      <Section title="For instructors and schools">
        <p>
          Teaching audio? You can use Academy certificates as course work. Assign
          a certificate to your students, then ask each student for their
          verification code or QR code when it’s due. This page confirms which
          certificates they have completed and when.
        </p>
        <p>
          You see completion only — never their progress, quiz scores, or
          personal details. No account is needed to check.
        </p>
      </Section>

      <Section title="Sponsoring or training your team">
        <p>
          If you want to fund training for your staff rather than verify an
          existing credential, that’s handled through institutional and bulk
          licensing.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/verify", label: "Verify a Credential" }}
        secondary={{ href: "/institutions", label: "Institutions & Teams" }}
      />
    </div>
  );
}
