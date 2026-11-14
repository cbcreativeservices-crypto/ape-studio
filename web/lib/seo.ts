import type { Metadata } from "next";

/**
 * Page metadata for a sitemap page (SEO finish 2026-11-14; owner: "Yes, each
 * page its own" link preview). From the page's own title and description it
 * sets the canonical, plus an Open Graph and Twitter card whose url and title
 * are that page's, not the home page's. The image is the page's own link
 * preview when one exists in public/og, otherwise the shared og-home.png.
 *
 * A page's openGraph/twitter replace the root layout's (Next merges metadata
 * per top-level key), so every field a card needs is set here.
 */
const SITE_NAME = "Pro Audio Training Academy";

export function pageMeta({
  path,
  title,
  description,
  image = "/og/og-home.png",
}: {
  /** The page's own path, e.g. "/founder" (resolved against metadataBase). */
  path: string;
  /** The short title; the root template adds " · Pro Audio Training Academy". */
  title: string;
  description: string;
  /** A 1200×630 link-preview image under public/og. */
  image?: string;
}): Metadata {
  const fullTitle = `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
