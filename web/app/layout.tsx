import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pro Audio Training Academy",
    template: "%s · Pro Audio Training Academy",
  },
  description:
    "Professional audio education and certification. Verify Academy credentials, browse the tube reference, and access your member dashboard.",
  applicationName: "Pro Audio Training Academy",
  keywords: [
    "pro audio training",
    "audio certification",
    "audio engineering course",
    "credential verification",
    "tube reference",
  ],
  openGraph: {
    type: "website",
    siteName: "Pro Audio Training Academy",
    title: "Pro Audio Training Academy",
    description:
      "Professional audio education and certification. Verify credentials, browse the tube reference, and access your member dashboard.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "Pro Audio Training Academy",
    description:
      "Professional audio education and certification. Verify credentials and access your member dashboard.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
