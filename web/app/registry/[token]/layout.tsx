import type { Metadata } from "next";
import type { ReactNode } from "react";

// Per-user credential lookup pages must NOT be indexed (they resolve an
// individual's token). Owner SEO pass.
export const metadata: Metadata = {
  title: "Credential Verification",
  robots: { index: false, follow: false },
};

export default function RegistryLayout({ children }: { children: ReactNode }) {
  return children;
}
