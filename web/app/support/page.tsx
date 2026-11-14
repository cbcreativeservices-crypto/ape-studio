import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import LegalPage from "@/components/LegalPage";
import { loadLegal } from "@/lib/legal";

export const metadata: Metadata = pageMeta({
  path: "/support",
  title: "Support",
  description:
    "Get help with your Pro Audio Training Academy account, credentials, and the mobile app.",
});

export default function Page() {
  const { html, meta } = loadLegal("support");
  return <LegalPage meta={meta} html={html} />;
}
