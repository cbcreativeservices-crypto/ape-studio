import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, List } from "@/components/content";

export const metadata: Metadata = {
  title: "For Institutions",
  description:
    "Licensing and custom training for schools, employers, and education programs on Pro Audio Training Academy — structured curriculum, learner progress, and credentialing.",
};

const EMAIL = "info@proaudiotrainingacademy.com";

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="For Institutions"
        title="Licensing & custom training"
        lede="For schools, companies, and programs that train people on audio — a structured curriculum, progress you can follow, and credentials you can verify."
      />

      <Section title="What organizations can do">
        <p>
          Schools, colleges, companies, production teams, AV departments, houses
          of worship, and other programs that train people on audio.
        </p>
        <List
          items={[
            "put people through a structured, assessed audio curriculum",
            "follow learner progress",
            "have completed work recognized with verifiable credentials",
            "sponsor learners so their people study at a supported rate",
          ]}
        />
      </Section>

      <Section title="Available now — sponsor your learners">
        <p>
          Organizations can fund training for their people using redemption
          codes. You receive a batch of codes; each learner enters a code at
          sign-up in the mobile app, which links their account to your
          organization and applies the sponsored or discounted access. As they
          complete work, their credentials can be verified here.
        </p>
        <p>
          To set this up, tell us about your organization and how many learners
          you want to support, and we’ll follow up with codes and setup.
        </p>
        <a
          href={`mailto:${EMAIL}?subject=Institution%20licensing%20inquiry`}
          className="mt-2 inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Request codes
        </a>
      </Section>

      <Section title="Custom training systems">
        <p>
          For organizations with specific training needs, the Academy can work
          with you on tailored training built on the same curriculum, references,
          assessment, and credentialing. If you’re interested in a custom
          program, get in touch and we’ll discuss what fits.
        </p>
      </Section>

      <Section title="Planned — institutional administration">
        <p>
          Administrative capabilities for institutions — managing instructors and
          learners, classes and seats, and progress reporting — are planned for a
          future release. They are described here as planned, not available today,
          so there’s no confusion about what exists now.
        </p>
      </Section>

      <p className="mx-auto max-w-3xl px-4 text-sm text-text-muted sm:px-6">
        Need to check a credential instead?{" "}
        <Link href="/employers" className="text-amber underline underline-offset-2 hover:text-amber-deep">
          For employers
        </Link>
        .
      </p>
    </div>
  );
}
