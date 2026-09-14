import type { Metadata } from "next";
import type { ReactNode } from "react";

// Internal engineering tool — noindex. Access is gated by the server-checked
// upload code (the lab-upload edge function), not by page visibility.
export const metadata: Metadata = {
  title: "Lab Audio Uploader",
  robots: { index: false, follow: false },
};

export default function LabUploadLayout({ children }: { children: ReactNode }) {
  return children;
}
