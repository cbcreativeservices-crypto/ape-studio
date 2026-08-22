import type { Metadata } from "next";
import type { ReactNode } from "react";

// Authenticated preview surface — noindex. Owner SEO pass.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
