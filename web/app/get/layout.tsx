import type { Metadata } from "next";
import type { ReactNode } from "react";

// Metadata for the client "Get the App" page (client components can't export
// metadata directly — a co-located server layout supplies it). Owner SEO pass.
export const metadata: Metadata = {
  title: "Get the App",
  description:
    "Download Pro Audio Training Academy — structured professional audio training on your phone, with credentials you can verify online.",
  // Its own link preview: url and title are /get's (SEO finish 2026-11-14).
  openGraph: {
    type: "website",
    siteName: "Pro Audio Training Academy",
    url: "/get",
    title: "Get the App · Pro Audio Training Academy",
    description:
      "Download Pro Audio Training Academy — structured professional audio training with verifiable credentials.",
    images: [{ url: "/og/og-home.png", width: 1200, height: 630, alt: "Pro Audio Training Academy app: the whole craft of audio, right in your pocket" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get the App · Pro Audio Training Academy",
    description:
      "Download Pro Audio Training Academy — structured professional audio training with verifiable credentials.",
    images: ["/og/og-home.png"],
  },
  alternates: { canonical: "/get" },
};

export default function GetLayout({ children }: { children: ReactNode }) {
  return children;
}
