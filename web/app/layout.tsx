import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { GATE_ENABLED } from "@/lib/gate";
import { TAGLINE } from "@/lib/brand";
import { APP_LINKS_LIVE, APP_STORE_URL, PLAY_STORE_URL } from "@/lib/appstore";

// The numeric App Store id, read from APP_STORE_URL (".../app/id6813607582").
const APP_STORE_ID = /\/id(\d+)/.exec(APP_STORE_URL)?.[1];

// Self-hosted brand fonts (woff2 in ./fonts, sourced from @fontsource).
// Self-hosting avoids build-time/runtime requests to Google Fonts.
const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "./fonts/oswald-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/oswald-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/oswald-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/oswald-700.woff2", weight: "700", style: "normal" },
  ],
});

const body = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "./fonts/barlow-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/barlow-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-700.woff2", weight: "700", style: "normal" },
  ],
});

const mono = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    { path: "./fonts/share-tech-mono-400.woff2", weight: "400", style: "normal" },
  ],
});

const SITE_URL = "https://www.proaudiotrainingacademy.com";

const DESCRIPTION =
  "The Whole Craft of Audio. Right in Your Pocket. Everything you'd search for across books, videos and forums, in one place you carry everywhere — with credentials you can verify here.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pro Audio Training Academy",
    template: "%s · Pro Audio Training Academy",
  },
  description: DESCRIPTION,
  applicationName: "Pro Audio Training Academy",
  // Safari on iPhone shows Apple's "Open / Get" banner (SEO part D, 2026-11-14).
  ...(APP_LINKS_LIVE && APP_STORE_ID
    ? { other: { "apple-itunes-app": `app-id=${APP_STORE_ID}` } }
    : {}),
  robots: GATE_ENABLED
    ? { index: false, follow: false }
    : { index: true, follow: true },
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-hero.png",
  },
  openGraph: {
    type: "website",
    siteName: "Pro Audio Training Academy",
    title: "Pro Audio Training Academy",
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og/og-home.png", width: 1200, height: 630, alt: "Pro Audio Training Academy app: the whole craft of audio, right in your pocket" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Audio Training Academy",
    description: DESCRIPTION,
    images: ["/og/og-home.png"],
  },
};

// One schema.org @graph (SEO part B, owner-approved 2026-10-21, rebuilt
// 2026-11-14). Every Person fact is stated on /founder. The MobileApplication
// node appears only while the store links are live.
const ORG_ID = `${SITE_URL}/#organization`;
const PERSON_ID = `${SITE_URL}/founder#person`;

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": ORG_ID,
      name: "Pro Audio Training Academy",
      legalName: "Pro Audio Training Academy LLC",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-hero.png`,
      description: DESCRIPTION,
      slogan: TAGLINE,
      email: "info@proaudiotrainingacademy.com",
      founder: { "@id": PERSON_ID },
      sameAs: [
        "https://www.facebook.com/profile.php?id=61591525156755",
        "https://www.instagram.com/proaudiotrainingacademy/",
        "https://www.youtube.com/channel/UCgyT9oaRJvYLKAc-_cHuZ5A",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Pro Audio Training Academy",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Channing Booth",
      alternateName: "Cháno Booth",
      honorificPrefix: "Professor",
      jobTitle: "Founder & Curriculum Director",
      url: `${SITE_URL}/founder`,
      worksFor: { "@id": ORG_ID },
      affiliation: { "@type": "CollegeOrUniversity", name: "San Diego Miramar College" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Berklee College of Music" },
      // "Jazz piano" from the 2026-10-21 spec is left out: /founder does not
      // state it (the live page wins; noted in docs/web/SEO_FINISH_2026_11_14_REPORT.md).
      knowsAbout: ["Audio engineering", "Live sound", "Studio recording", "Audio education"],
    },
    ...(APP_LINKS_LIVE
      ? [
          {
            "@type": "MobileApplication",
            "@id": `${SITE_URL}/#app`,
            name: "Pro Audio Training Academy",
            operatingSystem: "iOS, Android",
            applicationCategory: "EducationalApplication",
            publisher: { "@id": ORG_ID },
            // The download is free; membership is an in-app purchase.
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
            sameAs: [APP_STORE_URL, PLAY_STORE_URL],
          },
        ]
      : []),
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-amber focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

