import type { MetadataRoute } from "next";
import { GATE_ENABLED } from "@/lib/gate";

const SITE = "https://www.proaudiotrainingacademy.com";

const PATHS = [
  "/",
  "/academy",
  "/curriculum",
  "/membership",
  "/credentials",
  "/verify",
  "/tubes",
  "/get",
  "/store",
  "/about",
  "/founder",
  "/standards",
  "/employers",
  "/institutions",
  "/contact",
  "/support",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (GATE_ENABLED) return [];
  return PATHS.map((path) => ({
    url: `${SITE}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
