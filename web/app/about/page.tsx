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
          The Academy was founded by Professor Channing “Cháno” Booth, who has
          taught professional audio at San Diego Miramar College for 28 years and
          brings four decades of experience in live audio, studio recording, and
          production — alongside a performing career as a professional jazz
          pianist.
        </p>
        <p>
          <a href="/founder" className="text-amber underline underline-offset-2 hover:text-amber-deep">
            Read more about the founder →
          </a>
        </p>
      </Section>

      <CTARow
        primary={{ href: "/get", label: "Get the app" }}
        secondary={{ href: "/standards", label: "Educational standards" }}
      />
    </div>
  );
}
