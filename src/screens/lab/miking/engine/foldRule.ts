/**
 * LONG STEPS: BEGINNER CORE FIRST (owner decision 5, 2026-11-14: "Keep ALL
 * content. Put the beginner part first and fold the depth under 'Go deeper
 * ▾'."). One rule in the shared lesson engine, so it applies to every Miking
 * lesson: a step whose words run past FOLD_OVER_WORDS keeps its opening
 * (the step's own lines, and the first items of its longest LIST of reading
 * cards up to CORE_WORDS), and folds the rest of that list under "Go deeper
 * ▾". Nothing is removed and nothing changes order; only a list of parallel
 * reading cards is ever folded (never a single note, a check, a prediction
 * or a task: the caller says which items are reading cards).
 *
 * Pure (no React Native), so the tests reach it directly.
 */

export const FOLD_OVER_WORDS = 400;
export const CORE_WORDS = 250;

const SKIP = new Set(['style', 'key', 'ref', 'quote', 'src', 'prov', 'source', 'accessibilityLabel', 'a11y', 'labelFor']);

/** The words a learner reads in a piece of content: strings in children and
 *  props, data passed as props one level deep, never functions. */
export function wordsOf(node: unknown, depth = 0): number {
  if (node == null || typeof node === 'boolean' || depth > 14) return 0;
  if (typeof node === 'string') return node.split(/\s+/).filter(Boolean).length;
  if (typeof node === 'number') return 1;
  if (Array.isArray(node)) return node.reduce((a: number, n) => a + wordsOf(n, depth + 1), 0);
  if (typeof node !== 'object') return 0;
  const o = node as Record<string, unknown>;
  if (o.props && typeof o.props === 'object') {
    const p = o.props as Record<string, unknown>;
    let n = 0;
    for (const k of Object.keys(p)) if (!SKIP.has(k) && typeof p[k] !== 'function') n += wordsOf(p[k], depth + 1);
    return n;
  }
  let n = 0;
  for (const k of Object.keys(o)) {
    if (SKIP.has(k)) continue;
    const v = o[k];
    if (typeof v === 'string') n += wordsOf(v);
  }
  return n;
}

export type FoldPlan = { list: number; keep: number; folded: number; words: number };

/** Where to fold a step's top-level children, or null when it reads short
 *  enough or has no list of reading cards to fold. `isReading` says whether
 *  an item is a reading card (never interactive). */
export function planFold(children: readonly unknown[], isReading: (item: unknown) => boolean, over = FOLD_OVER_WORDS, core = CORE_WORDS): FoldPlan | null {
  const total = wordsOf(children);
  if (total <= over) return null;
  let best = -1;
  let bestWords = 0;
  children.forEach((c, i) => {
    if (!Array.isArray(c) || c.length < 2 || !c.every(isReading)) return;
    const w = wordsOf(c);
    if (w > bestWords) {
      best = i;
      bestWords = w;
    }
  });
  if (best < 0) return null;
  const list = children[best] as unknown[];
  const before = wordsOf(children.slice(0, best));
  let keep = 0;
  let used = before;
  while (keep < list.length && (keep === 0 || used + wordsOf(list[keep]) <= core)) {
    used += wordsOf(list[keep]);
    keep++;
  }
  if (keep >= list.length) return null;
  return { list: best, keep, folded: list.length - keep, words: wordsOf(list.slice(keep)) };
}
