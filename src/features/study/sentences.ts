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
/* the term (each of its "A / B" alias names), its abbreviation, its WORD    */
/* VARIANTS (bounce / bouncing / bounced), and any significant WORD of a     */
/* multi-word answer ("power" when the blank is "phantom power").            */
/*                                                                          */
/* What gets HIDDEN is decided against the options on screen (readers 1+2): */
/* a word shared with another option tells nothing apart and stays; a word  */
/* only the answer has is hidden. Only the FIRST hidden span is the answer   */
/* blank; further hidden words become "…" so one answer never has to fill   */
/* five gaps. A whole hyphenated compound is hidden, never half of it.      */
/* ------------------------------------------------------------------------ */

/** Words too generic to count as a partial-answer leak on their own. */
const PARTIAL_STOPWORDS = new Set([
  'the', 'and', 'of', 'for', 'in', 'on', 'to', 'with', 'a', 'an', 'or', 'by', 'at', 'from',
  'audio', 'sound', 'signal', 'system', 'systems', 'level', 'levels', 'type', 'types',
  'device', 'devices', 'unit', 'units', 'mode', 'control', 'controls', 'output', 'input',
  'effect', 'effects', 'digital', 'analog', 'analogue', 'pro', 'professional', 'basic',
  'era', 'use', 'per', 'via', 'non', 'off', 'out', 'all', 'one', 'two',
]);

/** A conservative root for inflection matching: strip one common suffix when
 *  what remains is still ≥ 4 letters ("bouncing"→"bounc", "phases"→"phas",
 *  "note" stays "note" — a 3-letter root like "not" matched the word "not",
 *  which put a blank over "not" in a Ghost-Note question, reader 2026-09-05). */
export function wordRoot(word: string): string {
  const w = word.toLowerCase();
  for (const suf of ['ations', 'ation', 'izing', 'ising', 'ings', 'ing', 'ied', 'ies', 'ors', 'or', 'ers', 'er', 'ed', 'es', 's', 'ly', 'al', 'y', 'e']) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  }
  return w;
}

/** "Lip Sync / AV Sync" names two things; each alias is an exact match. The
 *  trailing parenthetical (abbreviation) is handled separately. */
function termAliases(term: string): string[] {
  const base = term.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return base.split(/\s*\/\s*/).map((s) => s.trim()).filter((s) => s.length >= 2);
}

/** The words of a term that can give it away on their own (≥ 3 letters, not a
 *  generic audio word). */
function termWords(term: string): string[] {
  const out: string[] = [];
  for (const alias of termAliases(term)) {
    for (const w of alias.split(/[\s-]+/)) {
      if (/^[A-Za-z][A-Za-z'’]*$/.test(w) && w.length >= 3 && !PARTIAL_STOPWORDS.has(w.toLowerCase()) && !out.includes(w)) out.push(w);
    }
  }
  return out;
}

/** Roots of a term's significant words. Shared roots between two options mean
 *  the word does NOT tell them apart. */
export function significantRoots(term: string): Set<string> {
  return new Set(termWords(term).map(wordRoot));
}

/** Inflections a root may carry and still be "the same word". */
const INFLECTIONS = '(?:e|s|es|ed|ing|er|ers|or|ors|ion|ions|ation|ations|ly|al|y|ies|ied)?';

export type LeakKind = 'exact' | 'abbreviation' | 'variant' | 'partial';
export type LeakPattern = { re: RegExp; kind: LeakKind; word: string };

const spaceTolerant = (phrase: string) => escapeRe(phrase).replace(/[\s-]+/g, '[\\s-]+');

export function leakPatternsV2(term: string): LeakPattern[] {
  const out: LeakPattern[] = [];
  const aliases = termAliases(term);
  for (const alias of aliases) {
    out.push({ re: new RegExp(`\\b${spaceTolerant(alias)}(?:s|es)?\\b`, 'gi'), kind: 'exact', word: alias });
  }
  const paren = term.match(/\(([^)]+)\)\s*$/);
  if (paren && paren[1].trim().length >= 2) {
    out.push({ re: new RegExp(`\\b${escapeRe(paren[1].trim())}\\b`, 'g'), kind: 'abbreviation', word: paren[1].trim() });
  }
  const singleWord = aliases.every((a) => a.split(/[\s-]+/).length === 1);
  for (const w of termWords(term)) {
    const root = wordRoot(w);
    // "dip" → "dipping": allow the doubled final consonant before an inflection.
    const last = root.slice(-1);
    const dbl = /[bdgklmnprstvz]/.test(last) ? `(?:${last})?` : '';
    // VARIANT: the word's inflections (bounce → bouncing). For a single-word
    // term this is the whole story; for a multi-word term it also catches
    // "powered" for "phantom power".
    out.push({ re: new RegExp(`\\b${escapeRe(root)}${dbl}${INFLECTIONS}\\b`, 'gi'), kind: singleWord ? 'variant' : 'partial', word: w });
    // A visible PREFIX of a long answer word gives it away too ("in alt" for
    // "in altissimo", reader 3 2026-09-05): prefixes of 3 … len-4 letters.
    if (w.length >= 7) {
      const prefixes: string[] = [];
      for (let len = w.length - 4; len >= 3; len--) {
        const pre = w.slice(0, len).toLowerCase();
        if (!PARTIAL_STOPWORDS.has(pre)) prefixes.push(escapeRe(pre));
      }
      if (prefixes.length) out.push({ re: new RegExp(`\\b(?:${prefixes.join('|')})\\b`, 'gi'), kind: singleWord ? 'variant' : 'partial', word: w });
    }
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
/** A hidden word that is NOT the answer blank (a repeat of an answer word, or
 *  another option's name): shown as an ellipsis so one answer never has to
 *  fill several gaps. */
export const GAP = '…';

const PRONOUN_START = /^(it|its|this|these|those|their|they|the term|such)\b/i;
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Span = { start: number; end: number; kind: LeakKind | 'other' };

/** Regexes that say "this other option is NAMED here": each alias in full, or
 *  a multi-word alias minus its last word ("sample-and-hold" names
 *  "Sample-and-hold circuit"; reader 2 2026-09-05). */
function namePatterns(term: string): RegExp[] {
  const out: RegExp[] = [];
  for (const alias of termAliases(term)) {
    if (alias.length >= 3) out.push(new RegExp(`\\b${spaceTolerant(alias)}(?:s|es)?\\b`, 'gi'));
    // Head must itself be ≥ 2 words ("sample and hold", "high impedance"): a
    // lone "Tape" or "Drum" is a shared word, not a name.
    const words = alias.split(/[\s-]+/);
    if (words.length >= 3) {
      const head = words.slice(0, -1).join(' ');
      out.push(new RegExp(`\\b${spaceTolerant(head)}\\b`, 'gi'));
    }
  }
  return out;
}

export function isNamedIn(term: string, sentence: string): boolean {
  return namePatterns(term).some((re) => ((re.lastIndex = 0), re.test(sentence)));
}

function mergeSpans(sentence: string, spans: Span[]): Span[] {
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Span[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end + 1 && /^\s*$/.test(sentence.slice(last.end, s.start))) {
      last.end = Math.max(last.end, s.end);
      if (s.kind === 'exact') last.kind = 'exact';
    } else merged.push({ ...s });
  }
  return merged;
}

/**
 * Spans of `sentence` that would give `term` away among `otherTerms` (the
 * options / board terms actually on screen), plus spans that NAME one of the
 * other options. A partial word shared with another option is not a span.
 * Variant/partial matches are widened to the whole hyphenated compound.
 */
export function leakSpans(term: string, sentence: string, otherTerms: string[] = []): Span[] {
  const tl = term.trim().toLowerCase();
  const others = otherTerms.filter((t) => t.trim().toLowerCase() !== tl);
  const shared = new Set<string>();
  for (const t of others) for (const r of significantRoots(t)) shared.add(r);
  const spans: Span[] = [];
  for (const p of leakPatternsV2(term)) {
    if (p.kind === 'partial' && shared.has(wordRoot(p.word))) continue;
    p.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.re.exec(sentence)) !== null) {
      if (m[0].length === 0) { p.re.lastIndex++; continue; }
      // Widen across hyphens so a compound is hidden whole ("long-play" for
      // "Standard-play tape"), never "long-______".
      let start = m.index;
      let end = m.index + m[0].length;
      while (start > 0 && /[\w-]/.test(sentence[start - 1])) start--;
      while (end < sentence.length && /[\w-]/.test(sentence[end])) end++;
      spans.push({ start, end, kind: p.kind });
    }
  }
  for (const o of others) {
    for (const re of namePatterns(o)) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentence)) !== null) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        spans.push({ start: m.index, end: m.index + m[0].length, kind: 'other' });
      }
    }
  }
  return mergeSpans(sentence, spans);
}

/** Render the spans: the answer span (the exact term if present, else the
 *  first leak) as `first`, everything else as `rest`; then drop a parenthetical
 *  glued to a hidden span ("______ (Ms)", "______ (also called …)" restate
 *  the answer) and collapse runs of hidden spans. */
function applySpans(sentence: string, spans: Span[], first: string, rest: string, answerOnlyExact: boolean = false): string {
  if (spans.length === 0) return sentence;
  const exactIdx = spans.findIndex((s) => s.kind === 'exact');
  const leakIdx = spans.findIndex((s) => s.kind !== 'other');
  // FIB (answerOnlyExact): the answer blank sits ONLY on the exact term. A
  // hidden WORD of the answer promoted to the blank read as if one word were
  // wanted ("so it fits the ______," for "Music editing", reader 3) — those
  // stay "…" and the screen appends the trailing blank instead.
  const firstIdx = exactIdx >= 0 ? exactIdx : answerOnlyExact ? -1 : leakIdx;
  let out = '';
  let pos = 0;
  spans.forEach((s, i) => {
    out += sentence.slice(pos, s.start) + (i === firstIdx ? first : rest);
    pos = s.end;
  });
  out += sentence.slice(pos);
  const f = escapeRe(first);
  const r = escapeRe(rest);
  out = out.replace(new RegExp(`(${f}|${r})\\s*\\([^()]{1,80}\\)`, 'g'), '$1');
  out = out.replace(new RegExp(`(${f}|${r})(\\s+(?:${f}|${r}))+`, 'g'), '$1');
  return out;
}

/** Hide what gives `term` away among `otherTerms`: answer span as `mask`,
 *  further hidden words as `rest`. */
export function maskLeaksFor(term: string, sentence: string, otherTerms: string[] = [], mask: string = BLANK, rest: string = GAP, answerOnlyExact: boolean = false): string {
  return applySpans(sentence, leakSpans(term, sentence, otherTerms), mask, rest, answerOnlyExact);
}

/** Mask every leak (exact, abbreviation, variant, partial) — no options known. */
export function maskLeaks(term: string, sentence: string, mask: string = BLANK): string {
  return maskLeaksFor(term, sentence, [], mask, GAP);
}

/**
 * Distractors for a fill-in-the-blank question. Preference: terms that SHARE
 * a word with the answer (so a visible "tape" no longer singles the answer
 * out), then unrelated terms, and only as a last resort a term that is named
 * in the text. Never the same text as the answer (duplicate rows).
 */
/** "Overtone" and "Overtones" are the same answer: same words in the same
 *  order, ignoring inflection, case and punctuation (259 such pairs in the
 *  corpus, reader 3 2026-09-05). */
export function termKey(term: string): string {
  return term.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(wordRoot).join(' ');
}

export function pickDistractors(term: string, candidates: string[], text: string, n: number = 3): string[] {
  const tl = term.trim().toLowerCase();
  const tk = termKey(term);
  const roots = significantRoots(term);
  const uniq = [...new Set(candidates.map((c) => c.trim()))].filter((c) => c && c.toLowerCase() !== tl && termKey(c) !== tk);
  const shares = (c: string) => [...significantRoots(c)].some((r) => roots.has(r));
  const kin = shuffleArr(uniq.filter((c) => !isNamedIn(c, text) && shares(c)));
  const rest = shuffleArr(uniq.filter((c) => !isNamedIn(c, text) && !shares(c)));
  const named = shuffleArr(uniq.filter((c) => isNamedIn(c, text)));
  return [...kin, ...rest, ...named].slice(0, n);
}

export type FibQuestion = { sentence: string; masked: string; hasBlank: boolean; distractors: string[] };

/**
 * One fill-in-the-blank question. `candidates` = the other terms of the topic
 * (the screen and the audit harness pass the same thing).
 * Sentence ranking: the fewest EXTRA gaps beyond the answer blank (a clean
 * describing sentence with a trailing blank beats a naming sentence that
 * needs three gaps), then a sentence that names the term, then one that does
 * not open with a dangling "It / This / The term". hasBlank:false = no blank
 * in the masked text → the screen appends one.
 */
export function fibSentence(term: string, definition: string, candidates: string[] = [], n: number = 3): FibQuestion {
  const parts = splitSentences(definition);
  const pool = parts.length > 0 ? parts : [definition];
  const distractors = pickDistractors(term, candidates, definition, n);
  const exactRes = leakPatternsV2(term).filter((p) => p.kind === 'exact').map((p) => p.re);
  const scored = pool.map((s) => {
    const spans = leakSpans(term, s, distractors);
    const hasExact = exactRes.some((re) => ((re.lastIndex = 0), re.test(s)));
    return { s, extra: spans.length - (hasExact ? 1 : 0), exact: hasExact ? 0 : 1, p: PRONOUN_START.test(s.trim()) ? 1 : 0 };
  });
  scored.sort((a, b) => a.extra - b.extra || a.exact - b.exact || a.p - b.p);
  const top = scored[0];
  const ties = scored.filter((x) => x.extra === top.extra && x.exact === top.exact && x.p === top.p);
  const chosen = ties[Math.floor(Math.random() * ties.length)].s;
  const masked = maskLeaksFor(term, chosen, distractors, BLANK, GAP, true);
  return { sentence: chosen, masked, hasBlank: masked.includes(BLANK), distractors };
}

export type MatchingClue = { clue: string; masked: boolean; partialsLeft: number; othersLeft: number };

/**
 * MATCHING clue against the board's four terms:
 *   1. never an exact / abbreviation / word-VARIANT leak (those solve the pair);
 *   2. the fewest gaps (words only this pair has, and other pairs' names);
 *   3. the fewest OTHER board terms mentioned; 4. no pronoun opener.
 * Words shared with other board terms stay readable ("drum" on a board of
 * drum terms tells nothing apart). First gap "___", further gaps "…".
 */
export function matchingClueV2(term: string, definition: string, boardTerms: string[] = []): MatchingClue {
  const parts = splitSentences(definition);
  const tl = term.trim().toLowerCase();
  const others = boardTerms.filter((t) => t.trim().toLowerCase() !== tl);
  if (parts.length === 0) return { clue: definition, masked: false, partialsLeft: 0, othersLeft: 0 };
  const scored = parts.map((s) => {
    const spans = leakSpans(term, s, others);
    return {
      s,
      spans,
      hard: findLeaks(term, s).filter((h) => h.kind !== 'partial').length > 0 ? 1 : 0,
      gaps: spans.length,
      others: others.filter((o) => isNamedIn(o, s)).length,
      p: PRONOUN_START.test(s.trim()) ? 1 : 0,
    };
  });
  scored.sort((a, b) => a.hard - b.hard || a.gaps - b.gaps || a.others - b.others || a.p - b.p);
  const top = scored[0];
  const ties = scored.filter((x) => x.hard === top.hard && x.gaps === top.gaps && x.others === top.others && x.p === top.p);
  const chosen = ties[Math.floor(Math.random() * ties.length)];
  const clue = applySpans(chosen.s, chosen.spans, '___', GAP);
  const partialsLeft = findLeaks(term, clue).filter((h) => h.kind === 'partial').length;
  return { clue, masked: clue !== chosen.s, partialsLeft, othersLeft: chosen.others };
}

export function matchingSentenceV2(term: string, definition: string, boardTerms: string[] = []): string {
  return matchingClueV2(term, definition, boardTerms).clue;
}
