import type { Metadata } from "next";
import { PageHero, Section, PendingNote, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "Founder",
  description:
    "About the founder of Pro Audio Training Academy and the professional audio experience behind the curriculum.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Founder"
        title="Founder"
        lede="The professional audio experience behind the Academy’s curriculum and standards."
      />

      <Section>
        <PendingNote>
          The founder profile — professional background, experience, and the
          expertise that shapes the curriculum — is being finalized for
          publication here. Only verified credentials and professional history
          will be included.
        </PendingNote>
      </Section>

      <CTARow
        primary={{ href: "/about", label: "About the Academy" }}
        secondary={{ href: "/curriculum", label: "Curriculum development" }}
      />
    </div>
  );
}
