import type { Metadata } from "next";
import { PageHero, Section, List, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "How we use AI",
  description:
    "How Pro Audio Training Academy uses artificial intelligence today: internal drafting only, human review before publish, and no learner personal information sent to generative AI systems.",
};

const EMAIL = "info@proaudiotrainingacademy.com";

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="How we use AI"
        title="Internal help. Human judgment."
        lede="This website does not use a chatbot or an AI tutor. Where we use artificial intelligence, it is to assist our own work — and a person still decides what gets published."
      />

      <Section title="What we use AI for today">
        <p>
          Artificial intelligence and similar tools may help us draft text,
          organize information, produce preliminary illustrations, spot
          inconsistencies, or speed up production. That is internal
          development work.
        </p>
        <p>
          Artificial intelligence does not independently approve or publish
          Academy educational content. Glossary entries, lessons, quizzes,
          diagrams, and other instructional materials are reviewed by a
          person before they are released.
        </p>
      </Section>

      <Section title="What we do not do today">
        <List
          items={[
            "This website does not include a user-facing AI assistant.",
            "We do not send learner personal information to external generative AI systems.",
            "AI does not grade you, award credentials, or decide whether a credential is valid.",
          ]}
        />
      </Section>

      <Section title="If that changes">
        <p>
          If we introduce a user-facing AI feature that processes your
          content or personal information, we will say so clearly in the
          product, label it as AI, and update the Privacy Policy before
          that feature launches.
        </p>
        <p>
          The full governance language lives in the{" "}
          <a href="/privacy#artificial-intelligence">
            Privacy Policy, Artificial Intelligence and Educational Integrity
          </a>
          .
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Email{" "}
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent("How we use AI")}`}
          >
            {EMAIL}
          </a>
          .
        </p>
      </Section>

      <CTARow
        primary={{ href: "/privacy#artificial-intelligence", label: "Privacy Policy" }}
        secondary={{ href: "/accessibility", label: "Accessibility" }}
      />
    </div>
  );
}
