import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { GATE_ENABLED } from "@/lib/gate";
import { TAGLINE } from "@/lib/brand";

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
  "Learn the Craft. Earn the Credential. Structured professional audio education in the app — credentials you can verify here.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pro Audio Training Academy",
    template: "%s · Pro Audio Training Academy",
  },
  description: DESCRIPTION,
  applicationName: "Pro Audio Training Academy",
  keywords: [
    "pro audio training",
    "professional audio education",
    "audio engineering course",
    "credential verification",
    "tube reference",
  ],
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
    images: [{ url: "/logo-hero.png", alt: "Pro Audio Training Academy" }],
  },
  twitter: {
    card: "summary",
    title: "Pro Audio Training Academy",
    description: DESCRIPTION,
    images: ["/logo-hero.png"],
  },
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Pro Audio Training Academy",
  url: SITE_URL,
  description: DESCRIPTION,
  slogan: TAGLINE,
  email: "info@proaudiotrainingacademy.com",
  logo: `${SITE_URL}/logo-hero.png`,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-amber focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

