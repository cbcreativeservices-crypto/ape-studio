import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import LegalPage from "@/components/LegalPage";
import { loadLegal } from "@/lib/legal";

export const metadata: Metadata = pageMeta({
  path: "/privacy",
  title: "Privacy Policy",
  description:
    "How Pro Audio Training Academy collects, uses, protects, and retains information across its Services.",
});

export default function Page() {
  const { html, meta } = loadLegal("privacy");
  return (
    <LegalPage
      meta={meta}
      html={html}
      lead={
        <>
          <strong>Privacy is a right, not an option.</strong> You came here
          to study audio, not to be studied.
        </>
      }
    />
  );
}
