import type { Metadata } from "next";
import type { ReactNode } from "react";

// Metadata for the client Tube Reference pages (/tubes and /tubes/[id] inherit
// this). A public, SEO-valuable content area. Owner SEO pass.
export const metadata: Metadata = {
  title: "Tube Reference",
  description:
    "A visual reference of vacuum tubes used in professional audio — pinouts, characteristics, and roles, from the Pro Audio Training Academy.",
  openGraph: {
    title: "Tube Reference · Pro Audio Training Academy",
    description:
      "A visual reference of vacuum tubes used in professional audio — pinouts, characteristics, and roles.",
  },
};

export default function TubesLayout({ children }: { children: ReactNode }) {
  return children;
}
