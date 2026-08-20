import type { Metadata } from "next";
import { PageHero, Section, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Pro Audio Training Academy exists: to organize the interconnected terminology and technical knowledge of professional audio into a structured educational system.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="About"
        title="Why the Academy exists"
        lede="Professional audio contains an enormous amount of interconnected terminology and technical knowledge. Finding an isolated piece of information is easy. Understanding how the pieces fit together is much harder."
        screen="home"
      />

      <Section>
        <p>
          Pro Audio Training Academy was created to close that gap — to organize
          the field into a structured educational system where terms connect to
          the principles around them, concepts build in a deliberate order, and
          the knowledge you gain is something you can apply and document.
        </p>
        <p>
          The mobile app is where the learning happens. This site supports it —
          explaining the Academy, holding accounts and credentials, and letting
          those credentials be verified.
        </p>
      </Section>

      <Section title="Founder">
        <p>
          The Academy is led by a founder with professional audio experience
          that informs the curriculum’s direction and standards.
        </p>
        <p className="text-sm text-text-muted">
          A fuller founder profile is being finalized for publication.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/academy", label: "About the Academy" }}
        secondary={{ href: "/standards", label: "Educational standards" }}
      />
    </div>
  );
}
