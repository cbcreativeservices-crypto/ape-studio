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
          requires three core topics and the Audio Fundamentals labs
          (award_standing_requirements; owner 2026-11-01: Audio Fundamentals
          are the required labs for everyone, NOT a topic) plus its specialty
          topics; a quiz topic opens only after its study activities are
          complete; quizzes are 30 questions (owner 2026-11-01: never "up to"), 10 minutes, at most two
          wrong; then a
          final exam to the same standard. Other lab requirements are NOT
          claimed (enforcement is off until store approval). Claims KNOWLEDGE,
          never skills (owner rule 2026-10-28). */}
      <Section id="training" title="What Academy training means for your team">
        <p>
          Academy graduates bring a strong foundation and are ready to continue
          their training with you. They know the terminology, the equipment and
          the principles of their specialty, so from the first day they can
          follow your instruction, ask good questions and understand what
          they’re seeing.
        </p>
        <p>
          That means your time with them goes further. You can focus on your
          equipment, your workflow and your standards, building on what they
          already know.
        </p>
      </Section>

      <Section title="What every graduate has studied">
        <p>Whatever their specialty, every graduate has completed the same foundation:</p>
        <List
          items={[
            <>
              <strong>Pro Audio Safety</strong> — how their actions affect their
              own safety and others’, and how to recognize the limits of what
              they know.
            </>,
            <>
              <strong>Grounding &amp; Electrical</strong> — awareness around
              powered equipment, and knowing when a situation needs a qualified
              professional.
            </>,
            <>
              <strong>Workplace Skills</strong> — communication, cooperation,
              reliability and respect on a team.
            </>,
            <>
              <strong>Audio Fundamentals labs</strong> — 15 interactive labs on
              how sound, signal and level work.
            </>,
          ]}
        />
        <p>
          We believe working well with others deserves more attention than
          education usually gives it, so you can build on that foundation
          instead of teaching it from the beginning.
        </p>
      </Section>

      <Section title="How a credential is earned">
        <p>
          Each credential requires that foundation plus the topics of its
          specialty.
        </p>
        <List
          items={[
            "Every topic ends in a quiz: 30 questions in 10 minutes, with no more than two wrong. It opens only after all of the topic’s study is done.",
            "A final exam covers every required topic, to the same standard. The credential is awarded only when it is passed.",
          ]}
        />
        <p>
          A <strong>Specialization Certificate</strong> covers a focused area. A{" "}
          <strong>Professional Certificate Program</strong> covers a complete
          professional role, such as live sound, studio recording, broadcast or
          forensic audio. Every verification result lists the topics the
          credential requires.
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
          The Academy exists so that cost doesn’t decide who gets this
          foundation. That widens the pool of capable people who reach you,
          including talent an expensive education might have kept out of the
          field.{" "}
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
