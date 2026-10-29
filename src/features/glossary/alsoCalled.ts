/**
 * "Also called" — a glossary card's other names (owner decision 2026-10-29;
 * Comp A spec COMP_A_TO_CCODE_ALSO_CALLED_SPEC_2026-10-29).
 *
 * About 3,065 cards repeat another card in the same topic under a different
 * name ("Band-stop filter" and "Band-reject equalizer" beside "Band-reject
 * filter"). Comp A merges each pair into ONE card and keeps the retired names
 * in `glossary.also_called` (text[], never NULL, never equal to the card's own
 * term; appended last to glossary_browse_v / glossary_study_v, not gated).
 * The learner must still meet every name, so the app:
 *   • shows "Also called: A, B" on the card (hidden when there are none);
 *   • finds the card when a search matches one of them ("matches: A");
 *   • opens the card from a cross-link that names one of them — a term match
 *     always beats an alias match.
 *
 * Pure: no React, no Supabase — testable in node.
 */

/** One shared empty list. The corpus has ~31,000 rows and almost none carry
 *  another name, so an empty array per row would be memory for nothing. */
export const NO_NAMES: readonly string[] = Object.freeze([]);

/**
 * The `also_called` value from whatever holds it: a server row, a device cache
 * written before the column existed (missing / NULL), or the JSON text the
 * SQLite copy stores. Anything that is not a list of names reads as none.
 */
export function alsoCalledList(raw: unknown): readonly string[] {
  let v = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return NO_NAMES;
    }
  }
  if (!Array.isArray(v)) return NO_NAMES;
  const out = v.filter((s): s is string => typeof s === 'string' && s.trim() !== '').map((s) => s.trim());
  return out.length ? out : NO_NAMES;
}

/** Lower-cased once when the corpus loads, like `termLower` (search runs per keystroke). */
export function lowerNames(names: readonly string[]): readonly string[] {
  return names.length ? names.map((s) => s.toLowerCase()) : NO_NAMES;
}

/** The card line, or null — and then the line is not drawn at all. */
export function formatAlsoCalled(names: readonly string[] | null | undefined): string | null {
  const list = alsoCalledList(names);
  return list.length ? `Also called: ${list.join(', ')}` : null;
}

/** The search-result subtitle when the hit came from another name. */
export function aliasMatchLabel(alias: string): string {
  return `matches: ${alias}`;
}

/**
 * Search: a card ranks by its term OR any other name, whichever is better
 * (lower `rank` = better, 99 = no match). `alias` is the name that won, and
 * only when it ranks STRICTLY better than the term — on a tie the card's real
 * term is the match and no subtitle shows. `termRank` is the caller's own rank
 * of the term (the Glossary's `searchRank`), passed in so the term path stays
 * exactly what it was.
 */
export function matchTermOrAlias(
  termRank: number,
  names: readonly string[] | undefined,
  namesLower: readonly string[] | undefined,
  q: string,
  rank: (lower: string, q: string) => number,
): { rank: number; alias: string | null } {
  let best = termRank;
  let alias: string | null = null;
  if (names && namesLower) {
    for (let i = 0; i < namesLower.length; i++) {
      const r = rank(namesLower[i], q);
      if (r < best) {
        best = r;
        alias = names[i];
      }
    }
  }
  return { rank: best, alias };
}

// ---- Cross-links -----------------------------------------------------------

/** The cross-link key: case-folded, curly apostrophes straightened, spaces collapsed. */
export const normPhrase = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/** "Gain (amplifier)" → "Gain": a trailing "(tag)" is not part of the name. */
export const stripTag = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '');

export type NameIndex = {
  /** normalized full term → its id */
  exact: Map<string, string>;
  /** normalized term with its "(tag)" stripped → every sense's id */
  base: Map<string, string[]>;
  /** normalized other name (as written, and with its "(tag)" stripped) → ids */
  alias: Map<string, string[]>;
};

/** File one card's other names into the alias map. */
export function indexAliases(alias: Map<string, string[]>, id: string, names: readonly string[]): void {
  for (const n of names) {
    for (const key of new Set([normPhrase(n), normPhrase(stripTag(n))])) {
      if (!key) continue;
      const list = alias.get(key);
      if (!list) alias.set(key, [id]);
      else if (!list.includes(id)) list.push(id);
    }
  }
}

/** An already-normalized phrase from prose: a term first (exact, then base
 *  name → all senses), another name only when no term has it. */
export function lookupPhrase(phrase: string, index: NameIndex): string[] | undefined {
  if (index.exact.has(phrase)) return [index.exact.get(phrase)!];
  return index.base.get(phrase) ?? index.alias.get(phrase);
}

/**
 * A related-term / link NAME → card id(s), case-insensitively. Every term
 * match (the name as written, then with its "(tag)" stripped) is tried before
 * any other-name match, so a card's real term always wins. [] = no card.
 */
export function resolveLinkName(name: string, index: NameIndex): string[] {
  const full = normPhrase(name);
  const bare = normPhrase(stripTag(name));
  const term = (k: string) => (index.exact.has(k) ? [index.exact.get(k)!] : index.base.get(k));
  return term(full) ?? term(bare) ?? index.alias.get(full) ?? index.alias.get(bare) ?? [];
}

/**
 * Flashcards' in-deck links: lower-cased name → card. Every term is filed
 * before any other name, so another card's alias never takes a term's place.
 */
export function deckNameIndex<T extends { term: string; also_called?: readonly string[] | null }>(
  items: readonly T[],
): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) m.set(it.term.toLowerCase(), it);
  for (const it of items) {
    for (const n of it.also_called ?? NO_NAMES) {
      const k = n.trim().toLowerCase();
      if (k && !m.has(k)) m.set(k, it);
    }
  }
  return m;
}

/**
 * The by-name popup (labs, calculators, Start Here) looks names up on the
 * server. `ilike` folds case for `term`, but array containment does not, so
 * the alias read asks for the usual spellings of the name — as written, lower,
 * UPPER, Sentence case and Title Case — with and without its "(tag)".
 * `pickAliasRow` then confirms the match case-insensitively on the device.
 */
export function aliasLookupVariants(name: string): string[] {
  const out = new Set<string>();
  for (const base of [name.trim(), stripTag(name).trim()]) {
    if (!base) continue;
    const lower = base.toLowerCase();
    out.add(base);
    out.add(lower);
    out.add(base.toUpperCase());
    out.add(lower.charAt(0).toUpperCase() + lower.slice(1));
    out.add(lower.replace(/(^|[\s-])(\S)/g, (_m, sep: string, c: string) => sep + c.toUpperCase()));
  }
  return [...out];
}

/** The first row whose other names contain `name` (case-insensitive, "(tag)" stripped). */
export function pickAliasRow<T extends { also_called?: unknown }>(rows: readonly T[] | null | undefined, name: string): T | undefined {
  const keys = new Set([normPhrase(name), normPhrase(stripTag(name))]);
  return (rows ?? []).find((r) =>
    alsoCalledList(r.also_called).some((n) => keys.has(normPhrase(n)) || keys.has(normPhrase(stripTag(n)))),
  );
}

/** A PostgREST array literal element: quoted, so a name with a comma, brace or
 *  quote cannot break the `ov.{…}` filter. */
export function arrayLiteralItem(s: string): string {
  return `"${s.replace(/["\\]/g, '\\$&')}"`;
}
