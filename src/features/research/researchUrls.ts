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

/**
 * The search phrase for Google / Scholar / Images: the server's per-term
 * `search_query` (Comp B's context, e.g. "phantom power microphone") when it is
 * a plain phrase, otherwise the term + "audio" so a general search stays on
 * topic. Never a URL, never control characters, never longer than 120.
 */
export function searchPhraseFor(term: string, stored?: unknown): string {
  if (typeof stored === 'string') {
    const q = stored.trim();
    if (q.length >= 2 && q.length <= 120 && !/[\u0000-\u001f]|:\/\//.test(q)) return q;
  }
  return `${term.trim()} audio`;
}

export function googleUrlFor(term: string, stored?: unknown): string {
  return `https://www.google.com/search?q=${encodeURIComponent(searchPhraseFor(term, stored))}`;
}

/** Google Scholar (owner 2026-10-24): papers and research on the term. */
export function googleScholarUrlFor(term: string, stored?: unknown): string {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(searchPhraseFor(term, stored))}`;
}

/** View images (owner 2026-10-24): Google Images for the term, SafeSearch ON
 *  (`safe=active`) — a learning app's link must not land on explicit results. */
export function googleImagesUrlFor(term: string, stored?: unknown): string {
  return `https://www.google.com/search?tbm=isch&safe=active&q=${encodeURIComponent(searchPhraseFor(term, stored))}`;
}
