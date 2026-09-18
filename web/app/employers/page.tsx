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

        {/* Verifying is only half of what an employer wants. Owner 2026-09-18:
            tell them they can CONTACT, and what that takes. */}
        <div className="mt-6 rounded-xl border border-amber/40 bg-amber/5 p-6 sm:p-8">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
            Want to reach the person, not just check the certificate?
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Verified employers can contact members directly through the app. We never publish a
            member’s email or phone number — you send a request, and they decide whether to reply.
            It takes an Academy account and the app; if your work email is at your company’s own
            domain, verification is immediate.
          </p>
          <a
            href="/employers/apply"
            className="mt-5 inline-block rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
          >
            Apply for an employer account
          </a>
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
          existing credential, that’s handled through institutional and bulk
          licensing.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/verify", label: "Verify a Credential" }}
        secondary={{ href: "/institutions", label: "Institutions & Teams" }}
      />
    </div>
  );
}
