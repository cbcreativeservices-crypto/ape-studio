/**
 * Research and learn more — the URLs only (no React Native, so tests load it).
 * See researchLinks.ts for the rules.
 */
const WIKI_ARTICLE = /^https:\/\/en\.wikipedia\.org\/wiki\/[^?\s]+$/;

/** The stored article URL, or null when absent / not an English Wikipedia article. */
export function safeWikipediaUrl(stored: unknown): string | null {
  return typeof stored === 'string' && WIKI_ARTICLE.test(stored.trim()) ? stored.trim() : null;
}

export function wikipediaUrlFor(term: string, stored?: unknown): string {
  return (
    safeWikipediaUrl(stored) ??
    `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(term.trim())}`
  );
}

export function googleUrlFor(term: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${term.trim()} audio`)}`;
}

/** View images (owner 2026-10-24): Google Images for the term, SafeSearch ON
 *  (`safe=active`) — a learning app's link must not land on explicit results. */
export function googleImagesUrlFor(term: string): string {
  return `https://www.google.com/search?tbm=isch&safe=active&q=${encodeURIComponent(`${term.trim()} audio`)}`;
}
