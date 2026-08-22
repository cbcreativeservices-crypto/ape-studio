import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, List, CTARow } from "@/components/content";

export const metadata: Metadata = {
  title: "Credentials",
  description:
    "Pro Audio Training Academy credentials are a verifiable record of completed educational work — how they are earned, verified, and what they do and do not represent.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Credentials"
        title="A verifiable record of completed work"
        lede="An Academy credential documents educational work you have completed — earned by meeting defined requirements, and verifiable by anyone you share it with."
        screen="achievements"
      />

      <Section title="How they’re earned">
        <p>
          Each credential has a defined set of topics and assessments that must
          be completed. When you satisfy those requirements through the Academy,
          the credential is awarded to your account and recorded.
        </p>
        <p>
          An included credential is part of your{" "}
          <Link href="/membership">membership</Link> — not an extra charge. It’s
          part of the educational experience, not a product sold back to you.
        </p>
        <p>
          Credentials are named for the program of study they document. The work
          they cover includes subjects such as Foundations of Sound, Signal
          Processing, and Studio Recording.
        </p>
      </Section>

      <Section title="How they’re verified">
        <p>
          Every credential can be confirmed from its code or QR code on this
          site. Verification shows the holder’s name and the credentials they
          hold — and nothing else. No other personal information is disclosed.
        </p>
        <List
          items={[
            "Members share a verification code or QR code.",
            "Anyone can enter it here to confirm the credential is genuine and current.",
            "The result shows the holder and the credential(s) earned, with dates.",
          ]}
        />
      </Section>

      <Section title="What an Academy credential represents">
        <p>
          It represents completion of a defined body of educational work in
          professional audio — evidence that the holder has studied and been
          assessed on that material.
        </p>
      </Section>

      <Section title="What it does not represent">
        <p>An Academy educational credential is not:</p>
        <List
          items={[
            "a government license",
            "a professional license",
            "an accredited academic degree",
            "a substitute for professional experience",
          ]}
        />
        <p>
          It should be understood as a record of educational achievement, and
          evaluated alongside experience, practical ability, and other
          qualifications appropriate to a given role.
        </p>
      </Section>

      <CTARow
        primary={{ href: "/verify", label: "Verify a Credential" }}
        secondary={{ href: "/employers", label: "For employers" }}
      />
    </div>
  );
}
