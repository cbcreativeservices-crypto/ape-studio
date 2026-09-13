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
    // /connect is unlisted via its noindex meta, NOT a robots disallow: a
    // disallow line would advertise the private path in world-readable
    // robots.txt and stop crawlers from ever reading the noindex.
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
