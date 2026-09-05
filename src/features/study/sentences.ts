/**
 * Sentence tools for the practice methods — dependency-free so the SAME rules
 * run in the app AND in the Node audit harness (`scripts/study-text-audit.mjs`)
 * and its tests. Moved out of `study/api.ts` 2026-09-05 (study-method text
 * audit); behaviour of the four original functions is unchanged.
 *
 * Booth 2026-07-08: fill-in-blank and matching present ONE randomly-chosen
 * sentence of a definition per showing, so students learn to spot meaning
 * anywhere in a definition instead of pattern-matching the first sentence.
 * Flashcards still show everything. (Quiz stems are server-authored.)
 */

export function splitSentences(text: string): string[] {
  if (!text) return [];
  // Protect periods that are NOT sentence enders, then split. Without this,
  // periods inside citations (1910.28, 1926.501), decimals/constants (16.61),
  // and abbreviations (OSHA 1910.95) shattered definitions into fragments like
  // "28) and 6 feet in construction (1926." (Booth 2026-08-21).
  const DOT = '@@D@@'; // sentinel for a protected (non-ending) period
  let t = text;
  // digit.digit — decimals & regulatory citations
  for (let i = 0; i < 4; i++) t = t.replace(/(\d)\.(\d)/g, `$1${DOT}$2`);
  // known abbreviations that carry a trailing period
  t = t.replace(
    /\b(U\.S|e\.g|i\.e|No|vs|approx|Inc|Fig|Eq|Ch|Sec|cf|al|Dr|Mr|Ms|St)\./gi,
    (m) => m.replace(/\./g, DOT),
  );
  const parts = t
    // ender + whitespace + capital/quote/paren, OR a missing-space join
    // ("...ends.Next..."). Never breaks inside a number, citation, or abbrev.
    .split(/(?<=[.!?])\s+(?=[A-Z0-9("'])|(?<=[a-z][.!?])(?=[A-Z])/)
    .map((s) => s.split(DOT).join('.').trim())
    .filter(Boolean)
    // Guardrail: drop shattered fragments (too short, or starting mid-token).
    .filter((s) => s.length >= 15 && /^[A-Z0-9"'(]/.test(s));
  return parts.length > 0 ? parts : [text.trim()];
}

export function randomSentence(text: string): string {
  const parts = splitSentences(text);
  return parts[Math.floor(Math.random() * parts.length)];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Regexes that detect the term leaking into its own definition text: the base
 *  name (parenthetical stripped, space/hyphen tolerant, optional plural) and
 *  any parenthetical abbreviation (e.g. "(XLR)"). — the ORIGINAL rule. */
export function termLeakPatterns(term: string): RegExp[] {
  const out: RegExp[] = [];
  const add = (phrase: string) => {
    const p = phrase.trim();
    if (p.length < 2) return;
    const esc = escapeRe(p).replace(/[\s-]+/g, '[\\s-]+');
    out.push(new RegExp(`\\b${esc}(s|es)?\\b`, 'gi'));
  };
  add(term.replace(/\s*\([^)]*\)\s*$/, '')); // base name
  const paren = term.match(/\(([^)]+)\)\s*$/);
  if (paren) add(paren[1]); // abbreviation
  return out;
}

/**
 * Sentence choice for MATCHING (Booth 2026-07-16): exactly ONE sentence, and
 * it must NOT contain the term it pairs with — same word, abbreviation, or
 * spelling (a leaked term made boards trivially solvable). Preference:
 * a random non-leaking sentence; if every sentence leaks, the shortest one is
 * used with the term masked out as "___". — the ORIGINAL rule.
 */
export function matchingSentence(term: string, definition: string): string {
  const parts = splitSentences(definition);
  const pats = termLeakPatterns(term);
  const clean = parts.filter((p) => !pats.some((re) => (re.lastIndex = 0) || re.test(p)));
  if (clean.length > 0) return clean[Math.floor(Math.random() * clean.length)];
  const shortest = [...parts].sort((a, b) => a.length - b.length)[0] ?? definition;
  return pats.reduce((s, re) => ((re.lastIndex = 0), s.replace(re, '___')), shortest);
}

/* ------------------------------------------------------------------------ */
/* Improved leak detection (study-method text audit, owner rule 2026-09-05): */
/* the term, its WORD VARIANTS (bounce / bouncing / bounced), and any        */
/* significant WORD of a multi-word answer ("power" when the blank is        */
/* "phantom power"). Used by the audit harness for measurement, and by the   */
/* app once the audit's fixes land.                                          */
/* ------------------------------------------------------------------------ */

/** Words too generic to count as a partial-answer leak on their own. */
const PARTIAL_STOPWORDS = new Set([
  'the', 'and', 'of', 'for', 'in', 'on', 'to', 'with', 'a', 'an', 'or', 'by', 'at', 'from',
  'audio', 'sound', 'signal', 'system', 'systems', 'level', 'levels', 'type', 'types',
  'device', 'devices', 'unit', 'units', 'mode', 'control', 'controls', 'output', 'input',
  'effect', 'effects', 'digital', 'analog', 'analogue', 'pro', 'professional', 'basic',
]);

/** A conservative root for inflection matching: strip one common suffix when
 *  what remains is still ≥ 3 letters ("bouncing"→"bounc", "phases"→"phas",
 *  "mixing"→"mix", "bus" stays "bus"). */
export function wordRoot(word: string): string {
  const w = word.toLowerCase();
  for (const suf of ['ations', 'ation', 'izing', 'ising', 'ings', 'ing', 'ied', 'ies', 'ors', 'or', 'ers', 'er', 'ed', 'es', 's', 'ly', 'al', 'y', 'e']) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
  }
  return w;
}

/** Inflections a root may carry and still be "the same word". */
const INFLECTIONS = '(?:e|s|es|ed|ing|er|ers|or|ors|ion|ions|ation|ations|ly|al|y|ies|ied)?';

export type LeakKind = 'exact' | 'abbreviation' | 'variant' | 'partial';
export type LeakPattern = { re: RegExp; kind: LeakKind; word: string };

export function leakPatternsV2(term: string): LeakPattern[] {
  const out: LeakPattern[] = [];
  const base = term.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (base.length >= 2) {
    const esc = escapeRe(base).replace(/[\s-]+/g, '[\\s-]+');
    out.push({ re: new RegExp(`\\b${esc}(?:s|es)?\\b`, 'gi'), kind: 'exact', word: base });
  }
  const paren = term.match(/\(([^)]+)\)\s*$/);
  if (paren && paren[1].trim().length >= 2) {
    out.push({ re: new RegExp(`\\b${escapeRe(paren[1].trim())}\\b`, 'g'), kind: 'abbreviation', word: paren[1].trim() });
  }
  const words = base.split(/[\s-]+/).filter((w) => /^[A-Za-z][A-Za-z'’]*$/.test(w));
  const significant = words.filter((w) => w.length >= 4 && !PARTIAL_STOPWORDS.has(w.toLowerCase()));
  for (const w of significant) {
    const root = wordRoot(w);
    // VARIANT: the word's inflections (bounce → bouncing). For a single-word
    // term this is the whole story; for a multi-word term it also catches
    // "powered" for "phantom power".
    out.push({ re: new RegExp(`\\b${escapeRe(root)}${INFLECTIONS}\\b`, 'gi'), kind: words.length > 1 ? 'partial' : 'variant', word: w });
  }
  return out;
}

export type LeakHit = { kind: LeakKind; word: string; match: string };

/** Every leak of `term` inside `sentence` under the improved rule. The exact
 *  term counts as a hit too (callers decide whether that's the intended blank). */
export function findLeaks(term: string, sentence: string): LeakHit[] {
  const hits: LeakHit[] = [];
  for (const p of leakPatternsV2(term)) {
    p.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(sentence)) !== null) {
      hits.push({ kind: p.kind, word: p.word, match: m[0] });
      if (m[0].length === 0) p.re.lastIndex++;
    }
  }
  return hits;
}

/** Leaks OTHER than the exact term itself (the ones a blank does not hide). */
export function findSecondaryLeaks(term: string, sentence: string): LeakHit[] {
  return findLeaks(term, sentence).filter((h) => h.kind !== 'exact');
}

export const BLANK = '______';

/** Mask every leak (exact, abbreviation, variant, partial) as a blank. */
export function maskLeaks(term: string, sentence: string, mask: string = BLANK): string {
  let s = sentence;
  for (const p of leakPatternsV2(term)) {
    p.re.lastIndex = 0;
    s = s.replace(p.re, mask);
  }
  // Collapse runs of adjacent blanks ("______ ______") into one.
  return s.replace(new RegExp(`(${escapeRe(mask)})(\\s+${escapeRe(mask)})+`, 'g'), '$1');
}

/**
 * Sentence choice for FILL-IN-THE-BLANK (improved rule). Preference order:
 *   1. a sentence that contains the exact term (so the blank is real) and has
 *      NO other leak → mask the term;
 *   2. a sentence that contains the exact term but also leaks a variant /
 *      partial → mask everything (all blanks stand for the same answer);
 *   3. no sentence contains the term → a sentence with no leaks (masked just
 *      in case), and `hasBlank: false` so the screen can add a trailing blank
 *      ("… describes ______") instead of showing a blank-less question.
 * Returns the ORIGINAL sentence too, for the screen's own rendering.
 */
export function fibSentence(term: string, definition: string): { sentence: string; masked: string; hasBlank: boolean } {
  const parts = splitSentences(definition);
  const exactRe = leakPatternsV2(term).find((p) => p.kind === 'exact')?.re;
  const withTerm = exactRe ? parts.filter((p) => ((exactRe.lastIndex = 0), exactRe.test(p))) : [];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  if (withTerm.length > 0) {
    const clean = withTerm.filter((p) => findSecondaryLeaks(term, p).length === 0);
    const chosen = pick(clean.length > 0 ? clean : withTerm);
    return { sentence: chosen, masked: maskLeaks(term, chosen), hasBlank: true };
  }
  const noLeak = parts.filter((p) => findLeaks(term, p).length === 0);
  const chosen = pick(noLeak.length > 0 ? noLeak : [[...parts].sort((a, b) => a.length - b.length)[0] ?? definition]);
  return { sentence: chosen, masked: maskLeaks(term, chosen), hasBlank: false };
}

export type MatchingClue = { clue: string; masked: boolean; partialsLeft: number; othersLeft: number };

/**
 * MATCHING clue with the improved rule, TIERED so clues stay readable:
 *   1. never an exact / abbreviation / word-VARIANT leak (those solve the pair);
 *   2. among those, the fewest PARTIAL words of a multi-word answer (a lone
 *      common word rarely solves a 4-pair board, and masking every one would
 *      blank half the clue);
 *   3. then the fewest OTHER topic terms named in the clue (`avoidTerms`) — a
 *      clue that names a different pair's answer misleads;
 *   4. only if EVERY sentence has a hard leak: the best one, masked as "___".
 */
export function matchingClueV2(term: string, definition: string, avoidTerms: string[] = []): MatchingClue {
  const parts = splitSentences(definition);
  const tl = term.toLowerCase();
  const others = avoidTerms
    .map((t) => t.replace(/\s*\([^)]*\)\s*$/, '').trim())
    .filter((t) => t.length >= 3 && t.toLowerCase() !== tl)
    .map((t) => new RegExp(`\\b${escapeRe(t)}\\b`, 'i'));
  const scored = parts.map((s) => {
    const leaks = findLeaks(term, s);
    return {
      s,
      hard: leaks.filter((h) => h.kind !== 'partial').length,
      partial: leaks.filter((h) => h.kind === 'partial').length,
      others: others.filter((re) => re.test(s)).length,
    };
  });
  const noHard = scored.filter((x) => x.hard === 0);
  const pool = noHard.length > 0 ? noHard : scored;
  const minP = Math.min(...pool.map((x) => x.partial));
  const p1 = pool.filter((x) => x.partial === minP);
  const minO = Math.min(...p1.map((x) => x.others));
  const p2 = p1.filter((x) => x.others === minO);
  const chosen = p2[Math.floor(Math.random() * p2.length)] ?? { s: definition, hard: 1, partial: 0, others: 0 };
  if (chosen.hard > 0) return { clue: maskLeaks(term, chosen.s, '___'), masked: true, partialsLeft: 0, othersLeft: chosen.others };
  return { clue: chosen.s, masked: false, partialsLeft: chosen.partial, othersLeft: chosen.others };
}

export function matchingSentenceV2(term: string, definition: string, avoidTerms: string[] = []): string {
  return matchingClueV2(term, definition, avoidTerms).clue;
}
