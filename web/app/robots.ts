import type { MetadataRoute } from "next";
import { GATE_ENABLED } from "@/lib/gate";

const SITE = "https://www.proaudiotrainingacademy.com";

export default function robots(): MetadataRoute.Robots {
  if (GATE_ENABLED) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
