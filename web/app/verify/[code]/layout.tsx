import type { Metadata } from "next";
import type { ReactNode } from "react";

// A specific code's verification result — noindex (per-lookup page). The public
// /verify landing stays indexable. Owner SEO pass.
export const metadata: Metadata = {
  title: "Verify a Credential",
  robots: { index: false, follow: false },
};

export default function VerifyCodeLayout({ children }: { children: ReactNode }) {
  return children;
}
