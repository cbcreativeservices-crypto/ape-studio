import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, List } from "@/components/content";

export const metadata: Metadata = {
  title: "Institutions & Teams",
  description:
    "Bulk and multi-seat licensing for schools, studios, and industry on Pro Audio Training Academy. Unique login codes available now; custom institutional tools are planned.",
};

const EMAIL = "info@proaudiotrainingacademy.com";
const QUOTE_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Institution licensing quote")}`;
const UPDATES_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Institutional tier updates")}`;

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Institutions & Teams"
        title="Licensing for Schools, Studios, and Industry"
        lede="Educational and industry institutions can license Pro Audio Training Academy for their students, staff, or teams at a discount. Whether you're outfitting a classroom, a training program, or an entire department, we'll get you the right number of seats."
      />

      <Section title="Available now">
        <List
          items={[
            <>
              <strong>Bulk & multi-seat discounts.</strong> Educational and
              industry institutions receive discounted pricing on multi-license
              (site) orders. The more seats you need, the better the rate.
            </>,
            <>
              <strong>How it works today.</strong> You buy your seats from us
              directly. We issue a set of unique login code numbers — one per
              seat. Each of your users enters their assigned code when they
              create an account, which activates their access.
            </>,
            <>
              <strong>Get a quote.</strong> Tell us how many seats you need and
              we’ll send pricing. Contact{" "}
              <a href={QUOTE_MAIL}>{EMAIL}</a>.
            </>,
          ]}
        />
        <a
          href={QUOTE_MAIL}
          className="mt-2 inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Get a quote
        </a>
      </Section>

      <Section title="Coming soon — the Institutional tier (planned)">
        <List
          items={[
            <>
              <strong>Custom topics</strong> — build a topic from only the terms
              you want your learners studying.
            </>,
            <>
              <strong>Custom certificates</strong> — choose exactly which topics
              count toward a certificate you issue.
            </>,
            <>
              <strong>Custom courses & programs</strong> — assemble courses and
              full programs tailored to your curriculum.
            </>,
            <>
              <strong>Custom database & app configuration</strong> — a
              configuration shaped to your institution’s needs.
            </>,
            <>
              <strong>User management</strong> — add, organize, and manage your
              learners.
            </>,
            <>
              <strong>Progress tracking & analytics</strong> — follow each user’s
              progress and see reporting across your cohort.
            </>,
          ]}
        />
        <p>
          Interested as it comes online? Email{" "}
          <a href={UPDATES_MAIL}>{EMAIL}</a> and we’ll keep you posted.
        </p>
      </Section>

      <p className="mx-auto max-w-3xl px-4 text-sm text-text-muted sm:px-6">
        Need to check a credential instead?{" "}
        <Link
          href="/employers"
          className="text-amber underline underline-offset-2 hover:text-amber-deep"
        >
          For employers
        </Link>
        .
      </p>
    </div>
  );
}
