import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Tube Reference",
  description:
    "A secured reference library of vacuum tube diagrams and specifications for Pro Audio Training Academy members.",
};

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Members only"
      title="Tube Reference"
      body="A secured library of vacuum tube diagrams and specifications, available to Academy members on any screen."
      note="Sign-in-gated access to the reference library is coming soon."
    />
  );
}
