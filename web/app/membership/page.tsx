import type { Metadata } from "next";
import { PageHero, Section, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "The membership philosophy behind Pro Audio Training Academy: making professional audio education accessible, with one membership instead of a series of extra charges.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Membership"
        title="Professional audio education should be within reach"
        lede="Access to professional audio education should not depend on how much equipment someone owns, where they live, or how much they can afford to spend on training."
      />

      <Section>
        <p>
          Professional audio can be an expensive field to enter. Equipment,
          software, facilities, formal education, and hands-on opportunities are
          not equally available to everyone. Pro Audio Training Academy was
          created in part to help lower that barrier.
        </p>
        <p>
          Our goal is to make serious professional audio education, technical
          reference material, skill development, and employment preparation
          accessible to people at many different stages of their careers and
          from many different circumstances.
        </p>
      </Section>

      <Section title="One membership. Not a series of extra charges.">
        <p>
          We do not believe learners should have to pay another fee every time
          they complete a topic, earn an eligible certificate, access another
          learning tool, or reach another milestone.
        </p>
        <p>
          Membership is intended to provide access to the educational resources
          included with that membership rather than turning every achievement
          into another purchase.
        </p>
        <p>
          When a member completes the requirements for an included Pro Audio
          Training Academy credential, the credential is part of that
          educational experience — not an additional product we sell back to the
          learner.
        </p>
      </Section>

      <Section title="Learn more. Become more prepared.">
        <p>The purpose of Pro Audio Training Academy is straightforward:</p>
        <p>
          Help more people learn audio, strengthen their technical knowledge,
          prepare for employment, improve the work they already do, and gain
          access to knowledge they may not otherwise have had.
        </p>
        <p>
          We want the Academy to help reduce some of the financial and
          educational barriers that can make professional audio difficult to
          enter. A learner’s opportunity to develop their knowledge should not be
          determined solely by their ability to purchase expensive equipment,
          attend a particular school, or repeatedly pay for individual pieces of
          education. Our membership approach is designed around that principle.
        </p>
      </Section>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-sm text-text-muted">
          Membership is available in the Pro Audio Training Academy mobile app.
        </p>
      </div>

      <CTARow
        primary={{ href: "/academy", label: "About the Academy" }}
        secondary={{ href: "/credentials", label: "About credentials" }}
      />
    </div>
  );
}
