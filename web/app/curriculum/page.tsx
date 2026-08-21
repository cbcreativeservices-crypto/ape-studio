import type { Metadata } from "next";
import { PageHero, Section, BrandLine, List, CTARow } from "@/components/content";
import { KNOWLEDGE } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Curriculum Development",
  description:
    "How Pro Audio Training Academy organizes professional audio into terms, topics, subjects, and programs — with prerequisites, technical review, assessment, and updates.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Curriculum Development"
        title="How the curriculum is built"
        lede="Professional audio is a large, interconnected field. The Academy organizes it into a structure you can move through deliberately — from fundamentals to advanced work."
      />

      <Section title="How it’s organized">
        <p>The curriculum connects professional audio across four levels:</p>
        <p className="font-mono text-foreground">
          Terms &rarr; Topics &rarr; Subjects &rarr; Programs / Credentials
        </p>
        <List
          items={[
            <>
              <strong>Terms</strong> — the individual concepts, components, and
              calculations, each explained with what it is, why it matters, and
              how it’s used.
            </>,
            <>
              <strong>Topics</strong> — related terms grouped into a unit of
              study, the level at which progress is tracked and credentials are
              awarded.
            </>,
            <>
              <strong>Subjects &amp; fields</strong> — topics grouped into the
              larger areas of professional audio.
            </>,
            <>
              <strong>Programs &amp; credentials</strong> — defined sets of
              topics that, once completed, result in a verifiable credential.
            </>,
          ]}
        />
      </Section>

      <Section title="Progression and prerequisites">
        <p>
          Topics are sequenced so that foundational knowledge comes before the
          material that depends on it. Where a topic assumes earlier
          understanding, that prerequisite is part of the structure rather than
          an afterthought — so you build on solid ground and the relationships
          between concepts stay visible.
        </p>
      </Section>

      <BrandLine>{KNOWLEDGE}</BrandLine>

      <Section title="Assessment and finding gaps">
        <p>
          The Academy is not only for complete beginners. Many learners already
          know parts of the field well. Assessment is designed to help you
          recognize what you already understand, surface the gaps, strengthen
          weak areas, and decide what to study next — then document that
          progress toward credentials.
        </p>
      </Section>

      <Section title="Technical accuracy, review, and updates">
        <p>
          Curriculum content is developed for technical accuracy and reviewed on
          its merits. Review is currently led by the Academy’s Curriculum
          Director; as the Academy grows, outside and peer review will expand.
        </p>
        <p>
          The material draws on established technical references, recognized
          industry standards and best practices, manufacturer and equipment
          documentation, and decades of professional practice in the field.
        </p>
        <p>
          Where corrections are needed, they are made and the material is
          updated — both as issues are found and through periodic review as the
          field and best practices evolve. Learners can flag anything that looks
          wrong or unclear through the feedback and suggestion links found
          throughout the app.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/academy", label: "About the Academy" }}
        secondary={{ href: "/standards", label: "Educational standards" }}
      />
    </div>
  );
}
