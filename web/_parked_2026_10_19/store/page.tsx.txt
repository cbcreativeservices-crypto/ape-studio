import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Store",
  description:
    "The Pro Audio Training Academy store is coming soon.",
};

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Store"
      title="Coming soon"
      body="The Academy store is being prepared. Check back here when it opens."
    />
  );
}
