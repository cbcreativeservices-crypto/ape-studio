import type { Metadata } from "next";
import { PageHero } from "@/components/content";
import EmployerStatus from "@/components/EmployerStatus";

export const metadata: Metadata = {
  title: "Your employer account",
  description: "The status of your Pro Audio Training Academy employer verification.",
  // Nothing here should be indexed: it is one person's application status.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="For Employers"
        title="Your employer account"
        lede="Where your verification stands, and what to do next."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <EmployerStatus />
        </div>
      </div>
    </div>
  );
}
