import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, List } from "@/components/content";

export const metadata: Metadata = {
  title: "Institutions & Teams",
  description:
    "Bulk and multi-seat licensing for schools, studios, and industry on Pro Audio Training Academy. Discounted seats with unique login codes for your learners.",
};

const EMAIL = "info@proaudiotrainingacademy.com";
const QUOTE_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Institution licensing quote")}`;

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
              <strong>Institutions only.</strong> Access codes are issued to
              institutions for their own students, staff, or members — they are
              not sold to individuals. Individuals get a membership in the app:{" "}
              <Link href="/get">see how to get it</Link>.
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


      <p className="mx-auto max-w-3xl px-4 text-sm text-text-muted sm:px-6">
        Need to check a credential instead?{" "}
        <Link
          href="/employers"
          className="text-amber underline underline-offset-2 hover:text-amber-deep"
        >
          For employers &amp; instructors
        </Link>
        .
      </p>
    </div>
  );
}
