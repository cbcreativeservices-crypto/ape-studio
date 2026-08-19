import type { Metadata } from "next";
import { PageHero, Section, List, CTARow } from "@/components/content";
import VerifyForm from "@/components/VerifyForm";

export const metadata: Metadata = {
  title: "For Employers",
  description:
    "Verify a Pro Audio Training Academy credential and understand what it represents. Enter a credential code to confirm it is genuine and current.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="For Employers"
        title="Verify a credential"
        lede="Confirm that a candidate’s Pro Audio Training Academy credential is genuine and current — and understand what it does and doesn’t tell you."
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-text-sub">
            Enter a verification code
          </p>
          <VerifyForm />
          <p className="mt-4 text-xs text-text-muted">
            You can also scan the holder’s QR code with a phone camera to open
            their verification directly.
          </p>
        </div>
      </div>

      <Section title="What a credential represents">
        <p>
          An Academy credential verifies completion of defined educational
          requirements in professional audio. It is evidence that the holder has
          studied and been assessed on that material.
        </p>
      </Section>

      <Section title="How to interpret it">
        <p>
          A credential confirms educational completion — not that someone is
          qualified for every situation a role may involve. Evaluate it
          alongside the other factors appropriate to the position:
        </p>
        <List
          items={[
            "hands-on experience",
            "practical ability",
            "prior education and training",
            "references",
            "the specific requirements of the role",
          ]}
        />
        <p>
          Verification tells you the credential is real and current, and what it
          covers. The hiring judgment remains yours.
        </p>
      </Section>

      <Section title="Sponsoring or training your team">
        <p>
          If you want to fund training for your staff rather than verify an
          existing credential, that’s handled through licensing and custom
          training for organizations.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/verify", label: "Verify a Credential" }}
        secondary={{ href: "/institutions", label: "Licensing & custom training" }}
      />
    </div>
  );
}
