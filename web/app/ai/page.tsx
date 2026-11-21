import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { PageHero, Section, List, CTARow } from "@/components/content";

export const metadata: Metadata = pageMeta({
  path: "/ai",
  title: "How we use AI",
  description:
    "How Pro Audio Training Academy uses artificial intelligence today: internal drafting only, human review before publish, and no learner personal information sent to generative AI systems.",
});

const EMAIL = "info@proaudiotrainingacademy.com";

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="How we use AI"
        title="Human judgment first"
        lede="We use artificial intelligence as a behind-the-scenes production tool. A person reviews and approves everything we publish."
      />

      <Section title="How we use AI">
        <p>
          Artificial intelligence tools help our team draft text, organize
          information, create illustrations and check for inconsistencies.
        </p>
        <p>
          Artificial intelligence does not independently approve or publish
          Academy educational content. Glossary entries, lessons, quizzes,
          diagrams, and other instructional materials are reviewed by a
          person before they are released.
        </p>
      </Section>

      <Section title="Forum moderation">
        <p>
          The Audio Community forum uses an AI moderator to help keep
          hateful and harmful content from being posted. When a member
          posts, edits or reports a post, our server sends the text to
          Anthropic&apos;s Claude service to check it against the community
          rules. Your name, username and email address are not sent. Only a
          person can suspend or ban an account. Details are in the{" "}
          <a href="/privacy#forum-moderation">Privacy Policy, Section 11.2</a>
          .
        </p>
      </Section>

      <Section title="What AI does not do">
        <List
          items={[
            "There is no AI chatbot or AI tutor on this website.",
            "Apart from forum moderation, we do not send learner personal information to external generative AI systems.",
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
