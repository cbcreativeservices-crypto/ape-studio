import type { Metadata } from "next";
import type { ReactNode } from "react";

// Metadata for the client "Get the App" page (client components can't export
// metadata directly — a co-located server layout supplies it). Owner SEO pass.
export const metadata: Metadata = {
  title: "Get the App",
  description:
    "Download Pro Audio Training Academy — structured professional audio training on your phone, with credentials you can verify online.",
  openGraph: {
    title: "Get the App · Pro Audio Training Academy",
    description:
      "Download Pro Audio Training Academy — structured professional audio training with verifiable credentials.",
  },
};

export default function GetLayout({ children }: { children: ReactNode }) {
  return children;
}
