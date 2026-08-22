import type { Metadata } from "next";
import type { ReactNode } from "react";

// Utility page — noindex. Owner SEO pass.
export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
