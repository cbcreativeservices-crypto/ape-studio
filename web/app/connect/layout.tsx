import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./connect.css";

export const metadata: Metadata = {
  title: "We met",
  description: "A personal welcome from the Pro Audio Training Academy.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Pro Audio Training Academy",
    description: "A personal welcome.",
    url: "https://www.proaudiotrainingacademy.com/connect",
  },
};

export default function ConnectLayout({ children }: { children: ReactNode }) {
  return children;
}
