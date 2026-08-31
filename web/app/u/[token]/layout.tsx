import type { Metadata } from "next";
import type { ReactNode } from "react";

// §8.1: public community profiles are noindex, nofollow at launch. The page is
// shareable by link on purpose; it is not meant to be findable by search
// engines, and a search-engine copy would outlive any unpublish or deletion.
export const metadata: Metadata = {
  title: "Academy Member Profile",
  robots: { index: false, follow: false },
};

export default function CommunityProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
