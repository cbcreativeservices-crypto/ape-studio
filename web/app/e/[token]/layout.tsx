import type { Metadata } from "next";
import type { ReactNode } from "react";

// Must-do H5: like a member's /u page, an employer's or instructor's public
// page is shareable by link and kept out of search engines (noindex, nofollow).
// A search-engine copy would outlive a revoked account.
export const metadata: Metadata = {
  title: "Verified Employer or Instructor",
  robots: { index: false, follow: false },
};

export default function EmployerPublicLayout({ children }: { children: ReactNode }) {
  return children;
}
