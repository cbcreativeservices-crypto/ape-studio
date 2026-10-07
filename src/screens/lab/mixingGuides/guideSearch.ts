/**
 * The hub's quick filter (pure, node-tested): a style matches when every word
 * typed appears in its title, its "mix priority" line or its origin, ignoring
 * case, accents and punctuation — "hip hop" finds "Hip-Hop / Rap", "variete"
 * finds "French Variété / Chanson", "brazil" finds Sertanejo, Brazilian Funk
 * and MPB.
 */
import type { MixingGuideEntry } from './data/index';

/** Lower case, accents off, anything that is not a letter or digit → space. */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The guides that match `query`, in index order. An empty query is all of them. */
export function filterGuides<T extends Pick<MixingGuideEntry, 'title' | 'line' | 'origin'>>(entries: readonly T[], query: string): T[] {
  const words = foldText(query).split(' ').filter(Boolean);
  if (words.length === 0) return [...entries];
  return entries.filter((e) => {
    // Title words also match joined ("hiphop", "kpop", "lofi").
    const title = foldText(e.title);
    const hay = ` ${title} ${title.replace(/ /g, '')} ${foldText(e.line)} ${foldText(e.origin)} `;
    return words.every((w) => hay.includes(w));
  });
}

/** "12 of 50 read" — the hub's count line. */
export function readCountLine(read: number, total: number): string {
  return `${read} of ${total} read`;
}
