import type { Metadata } from "next";
import { PageHero, Section, BrandLine, List, CTARow } from "@/components/content";
import { PageAtmosphere } from "@/components/Atmosphere";
import { PHILOSOPHY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "The Academy",
  description:
    "What Pro Audio Training Academy is: structured professional audio education combining terminology, curriculum, references, study, assessment, progress, and credentials.",
};

export default function Page() {
  return (
    <div className="relative pb-16">
      <PageAtmosphere src="/atmospheres/hall.png" tone="amber" opacity={0.8} />
      <div className="relative z-10 pt-4 md:pt-8">
      <PageHero
        eyebrow="The Academy"
        title="What Pro Audio Training Academy is"
        lede="A structured educational system for professional audio — built to organize an enormous, interconnected body of knowledge into something you can learn, apply, and document."
        screen="home"
      />

      <Section>
        <p>Pro Audio Training Academy brings together, in one coherent system:</p>
        <List
          items={[
            "professional audio terminology",
            "a structured curriculum",
            "technical reference material",
            "interactive learning",
            "study activities",
            "assessments",
            "progress tracking",
            "educational credentials",
          ]}
        />
        <p>
          The mobile app is the primary learning environment. This website is the
          companion — for understanding the Academy, managing your account and
          membership, tracking progress and credentials, verifying credentials,
          institutional information, and member references.
        </p>
      </Section>

      <BrandLine>{PHILOSOPHY}</BrandLine>

      <Section>
        <p>
          Terminology alone is not enough. A definition tells you <strong>what</strong>{" "}
          something is; real understanding also needs the rest. Wherever it
          makes sense, the Academy connects a term to:
        </p>
        <List
          items={[
            <>
              <strong>why</strong> the concept matters
            </>,
            <>
              <strong>how</strong> it behaves
            </>,
            <>how equipment or systems use it</>,
            <>what professionals need to recognize</>,
            <>how concepts relate to one another</>,
          ]}
        />
        <p>
          The goal is enough understanding that you can apply the knowledge in
          real audio work — not memorized definitions in isolation.
        </p>
      </Section>

      <Section title="What the Academy is — and isn’t">
        <p>
          The Academy is a serious way to learn, organize, apply, and document
          professional audio knowledge. It is not a replacement for hands-on
          professional experience. It gives you the structured understanding
          that makes experience more useful, and a verifiable record of the
          educational work you complete.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/get", label: "Get the app" }}
        secondary={{ href: "/credentials", label: "About credentials" }}
      />
      </div>
    </div>
  );
}
