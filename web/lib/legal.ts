import { readFileSync } from "node:fs";
import path from "node:path";

export type LegalMeta = { title: string; updated: string };

const CONTENT_DIR = path.join(process.cwd(), "content", "legal");

/**
 * Load a legal document partial (exact ported HTML body) and its metadata.
 * Content is read at build time in a Server Component and rendered statically.
 */
export function loadLegal(slug: "privacy" | "terms" | "support"): {
  html: string;
  meta: LegalMeta;
} {
  const html = readFileSync(path.join(CONTENT_DIR, `${slug}.html`), "utf-8");
  const manifest = JSON.parse(
    readFileSync(path.join(CONTENT_DIR, "_meta.json"), "utf-8"),
  ) as Record<string, LegalMeta>;
  return { html, meta: manifest[slug] };
}
