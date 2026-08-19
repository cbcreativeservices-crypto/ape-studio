import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Member Dashboard",
  description:
    "Sign in to see your progress and continue your Pro Audio Training Academy studies in the mobile app.",
};

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Members"
      title="Member Dashboard"
      body="Sign in to see your progress and jump back into study and testing in the mobile app right where you left off."
      note="Member sign-in and the accessible dashboard are coming soon."
    />
  );
}
