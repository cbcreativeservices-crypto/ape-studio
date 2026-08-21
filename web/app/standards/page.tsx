import type { Metadata } from "next";
import { PageHero, Section, List } from "@/components/content";

export const metadata: Metadata = {
  title: "Educational Standards",
  description:
    "Pro Audio Training Academy’s approach to technical accuracy, editorial independence, sourcing, corrections, and credential standards.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Educational Standards"
        title="Standards & independence"
        lede="How the Academy approaches accuracy, independence, and the integrity of what it teaches and certifies."
      />

      <Section title="Editorial independence">
        <p>
          Educational content is developed on its technical merits. It is not
          determined by paid placement or sponsorship influence. What the Academy
          teaches is chosen because it is accurate and useful to learn — not
          because a manufacturer, advertiser, or other party paid for it to be
          included.
        </p>
      </Section>

      <Section title="Technical accuracy">
        <p>
          Curriculum content is developed for technical correctness and is
          reviewed for accuracy. The aim is material a working professional would
          recognize as correct and current.
        </p>
      </Section>

      <Section title="Sourcing, review, corrections & updates">
        <List
          items={[
            "Content is grounded in established technical references, recognized industry standards and best practices, manufacturer documentation, and decades of professional practice.",
            "Review is led by the Academy’s Curriculum Director, with outside and peer review planned to expand as the Academy grows.",
            "Anyone can flag something that looks wrong or unclear through the feedback and suggestion links found throughout the app; when an issue is confirmed, it is corrected.",
            "Material is updated both as issues are found and through periodic review, as the field and best practices evolve.",
          ]}
        />
      </Section>

      <Section title="Credential standards">
        <p>
          Credentials reflect defined requirements. A credential is awarded only
          when its requirements are met, and it represents completion of
          educational work — a standard the Academy keeps consistent so that
          verification means the same thing every time.
        </p>
      </Section>
    </div>
  );
}
