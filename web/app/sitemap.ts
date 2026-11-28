import type { MetadataRoute } from "next";
import { GATE_ENABLED } from "@/lib/gate";

const SITE = "https://www.proaudiotrainingacademy.com";

// /connect is a private invitation page — never list it.
const PATHS = [
  "/",
  "/academy",
  "/curriculum",
  "/career-finder",
  "/membership",
  "/credentials",
  "/verify",
  "/get",
  "/about",
  "/founder",
  "/standards",
  "/employers",
  "/institutions",
  "/contact",
  "/support",
  "/privacy",
  "/terms",
  "/ai",
  "/accessibility",
  "/delete-account",
];

// Every path above also sets alternates.canonical to itself (SEO 2026-11-14).
// lastModified = build time; changeFrequency/priority are left out because
// Google ignores them.
const BUILT_AT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  if (GATE_ENABLED) return [];
  return PATHS.map((path) => ({
    url: `${SITE}${path === "/" ? "" : path}`,
    lastModified: BUILT_AT,
  }));
}
