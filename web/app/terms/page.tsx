import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { loadLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The User Agreement governing access to and use of Pro Audio Training Academy Services.",
};

export default function Page() {
  const { html, meta } = loadLegal("terms");
  return <LegalPage meta={meta} html={html} />;
}
