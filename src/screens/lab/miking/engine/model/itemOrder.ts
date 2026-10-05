/**
 * Miking Labs — the PRESENTATION order of a check's options (pure; node-
 * testable). Every lesson authors the correct option first; the cards show
 * them in this order instead.
 *
 * Review Lab 1 (2026-10-05): the order used to be seeded by the item id
 * alone, and ids repeat across lessons ("q.6", "s.mono"), so the same item in
 * every lesson put its answer in the same slot. The seed now mixes the id
 * and the options (which differ per lesson), and the shuffle draws from the
 * generator's high bits (a 32-bit LCG's low bits cycle). `test/mikingItemBalance.test.ts`
 * pins that no slot holds the answer in more than half of the items.
 */
export function hashText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A stable permutation of 0..n-1 for a seed (Fisher–Yates on an LCG's high bits). */
export function shuffled(n: number, seed: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((s / 4294967296) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Orderable = { id: string; options: readonly string[] };

/** The order a check's options are shown in: indices into `options`. */
export function optionOrder(item: Orderable): number[] {
  const seed = hashText(`${item.id}\u0001${item.options.join('\u0001')}`);
  return shuffled(item.options.length, seed);
}

/** The slot (0-based, as shown) the correct option lands in. */
export function shownSlotOf(item: Orderable & { correct: string }): number {
  return optionOrder(item).indexOf(item.options.indexOf(item.correct));
}
