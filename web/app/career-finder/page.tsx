import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import CareerFinderApp from "@/components/careerfinder/CareerFinderApp";

/**
 * The free Audio Career Finder on the website (owner 2026-11-19: "a separate
 * page with a unique link on the website also running and allowing anyone free
 * to use the career finder"). Same questions, scoring, families, titles and
 * approved wording as the app: the logic and data are copied from src/ by
 * scripts/sync-career-finder-web.mjs and pinned by
 * test/webCareerFinder_20261119.test.ts. No sign-in; answers stay in the
 * visitor's own browser (localStorage) and are never sent anywhere.
 */
export const metadata: Metadata = pageMeta({
  path: "/career-finder",
  title: "Audio Career Finder",
  description:
    "Free audio career finder: rate 28 activities and see which of 42 audio career families, across 1,896 job titles, draw most on what you would enjoy. No account needed.",
});

export default function Page() {
  return (
    <div className="pb-16">
      <CareerFinderApp />
    </div>
  );
}
