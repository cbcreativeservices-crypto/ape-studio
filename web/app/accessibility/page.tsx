import type { Metadata } from "next";
import { PageHero, Section, List } from "@/components/content";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Pro Audio Training Academy is committed to making audio education usable by everyone. Learn how we design for accessibility and how to get help.",
};

const EMAIL = "info@proaudiotrainingacademy.com";
const ACCESS_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Accessibility")}`;

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Accessibility"
        title="Audio education for everyone"
        lede="Pro Audio Training Academy is committed to making our website and app usable by as many people as possible, including people who use assistive technology."
      />

      <Section title="Our standard">
        <p>
          We design this website to the Web Content Accessibility Guidelines
          (WCAG) 2.2, Level AA, and we review new pages against that standard
          as we build them. Learning happens mainly in the Pro Audio Training
          Academy app, which uses the accessibility features built into iPhone,
          iPad and Android devices.
        </p>
      </Section>

      <Section title="What you can expect">
        <List
          items={[
            "Keyboard access: you can move through every page with a keyboard, and a “Skip to content” link takes you straight past the menu.",
            "Clear focus: the item you are on is always outlined so you can see where you are.",
            "Easy navigation: the menu shows which page you are on and works with a keyboard on phones and tablets.",
            "Motion control: the home-page screen tour can be paused, and videos do not play automatically if your device is set to reduce motion.",
            "Screen reader friendly: pages are marked as English so screen readers use the right voice.",
          ]}
        />
      </Section>

      <Section title="Ongoing improvement">
        <p>
          Accessibility is part of how we work, not a one-time project. We are
          adding more descriptive text to images and improving the layout of
          our longer legal pages. The website is currently available in
          English. Our full accessibility commitment is in the{" "}
          <a href="/terms#apxJ">Terms of Service, Appendix J</a>.
        </p>
      </Section>

      <Section title="Need help?">
        <p>
          If anything on our website or in the app is hard to use, we want to
          know. Email <a href={ACCESS_MAIL}>{EMAIL}</a> and tell us the page,
          what you were trying to do, and the device or assistive technology
          you use. We reply within 3–5 business days and can provide
          information in another format on request.
        </p>
        <p>Last reviewed: October 2026.</p>
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
