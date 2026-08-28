import type { Metadata } from "next";
import { PageHero, Section, List } from "@/components/content";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "How Pro Audio Training Academy approaches website accessibility, known limits, and how to request help. We are working toward WCAG 2.2 AA; we have not completed an audit.",
};

const EMAIL = "info@proaudiotrainingacademy.com";
const ACCESS_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Accessibility")}`;

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Accessibility"
        title="We want this site to be usable"
        lede="Pro Audio Training Academy is working toward Web Content Accessibility Guidelines (WCAG) 2.2 Level AA for this website. We have not completed an audit, and we do not claim conformance."
      />

      <Section title="What this page covers">
        <p>
          This statement is about the companion website. Learning happens
          primarily in the mobile app, which follows Apple and Google
          accessibility guidance on each device.
        </p>
        <p>
          We treat accessibility as ongoing work — evaluation, fixes, and
          feedback — not a one-time badge.
        </p>
      </Section>

      <Section title="What we already do">
        <List
          items={[
            "Pages declare English (lang=en) and include a skip-to-content link.",
            "Focusable controls use a visible focus ring.",
            "The header marks the current page and traps keyboard focus in the mobile menu.",
            "The home-page screen tour can be paused, is hidden from assistive technology as a duplicate strip, and does not autoplay video when the system prefers reduced motion.",
          ]}
        />
      </Section>

      <Section title="Known limits">
        <List
          items={[
            "This website is in English only.",
            "We have not completed a WCAG 2.2 AA audit, so we do not claim that every page meets that level.",
            "Some images and looping screen recordings are decorative; others still need better text alternatives as we replace temporary captures.",
            "Older legal pages are long. We will keep improving structure and headings over time.",
          ]}
        />
        <p>
          A longer commitment, including the POUR principles, is in the{" "}
          <a href="/terms#apxJ">Terms of Service, Appendix J</a>. That
          appendix does not create a guarantee of perfect accessibility.
        </p>
      </Section>

      <Section title="Request help or report a barrier">
        <p>
          If you cannot use a page or feature, email{" "}
          <a href={ACCESS_MAIL}>{EMAIL}</a> with the page address, what you
          were trying to do, and the assistive technology or browser you
          use if you know it. We aim to reply within 3–5 business days.
        </p>
      </Section>

      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-4 sm:flex-row sm:px-6">
        <a
          href={ACCESS_MAIL}
          className="rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Email accessibility
        </a>
        <Link
          href="/contact"
          className="rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
