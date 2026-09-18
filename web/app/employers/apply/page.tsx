import type { Metadata } from "next";
import { PageHero, Section, List } from "@/components/content";
import EmployerApplyForm from "@/components/EmployerApplyForm";

export const metadata: Metadata = {
  title: "Apply for an employer account",
  description:
    "Verified employers can contact Academy members directly about work. Apply with your company details and work email.",
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="For Employers"
        title="Apply for an employer account"
        lede="Verifying a credential tells you it is genuine. An employer account lets you do the next thing — reach the person who earned it."
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <EmployerApplyForm />
        </div>
      </div>

      <Section title="How it works">
        <List
          items={[
            "Apply here with your company website and your work email.",
            "If your email is at your company's own domain and the site checks out, you are verified straight away. If not, a person reviews it — you will hear by email.",
            "Once verified, open the app: choose the areas and roles you are interested in, and contact members directly.",
          ]}
        />
      </Section>

      <Section title="Why there is a check at all">
        <p>
          Members put their real name and their verified credentials on a public profile. They
          agreed to that so professionals could find them — not so anyone at all could message
          them. The check is what lets us tell a member that the company contacting them is a real
          company, and it is why the badge on your messages means something.
        </p>
      </Section>

      <Section title="What contacting a member is, and is not">
        <List
          items={[
            "You send a request naming what it is about — and only from the options that member said they are open to.",
            "They accept, decline, or block. Nothing becomes a conversation until they accept.",
            "We never give out a member's email or phone number. The conversation stays in the app unless they choose to share more.",
            "Verification can be withdrawn. A badge is not permanent, and misuse removes it.",
          ]}
        />
      </Section>
    </div>
  );
}
