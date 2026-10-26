import type { Metadata } from "next";
import { PageHero } from "@/components/content";
import InstructorDashboard from "@/components/InstructorDashboard";

export const metadata: Metadata = {
  title: "Your students",
  description: "Progress shared with you by your Pro Audio Training Academy students.",
  // One instructor's class: nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="For Instructors"
        title="Your students"
        lede="Progress your students chose to share with you: topics, quiz scores, labs, final exams and credentials."
      />
      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <InstructorDashboard />
      </div>
    </div>
  );
}
