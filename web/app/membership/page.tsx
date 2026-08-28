import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "One membership for Pro Audio Training Academy: education, tools, assessments, and eligible credentials — available in the mobile app.",
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
          they complete a topic, earn an included credential, access another
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

      <Section title="What’s included">
        <p>
          Education, tools, assessments, and eligible credentials are part of
          membership. Plans and prices are in the app.
        </p>
      </Section>

      <Section title="Institutions & teams">
        <p>
          Educational and industry institutions get discounts on bulk/multi-seat
          orders. Buy seats directly and we issue unique login codes — one per
          user — to activate each account. Custom topics, certificates,
          programs, and analytics are coming soon for the Institutional tier.
        </p>
        <p>
          <Link href="/institutions">Licensing for schools, studios, and industry</Link>
          {" · "}
          <a href="mailto:info@proaudiotrainingacademy.com?subject=Institution%20licensing%20quote">
            info@proaudiotrainingacademy.com
          </a>
        </p>
      </Section>

      <CTARow
        primary={{ href: "/get", label: "Get the app" }}
        secondary={{ href: "/credentials", label: "About credentials" }}
      />
    </div>
  );
}
