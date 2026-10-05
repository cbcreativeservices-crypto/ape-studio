/**
 * THE LESSON JOURNEY — the rules every Miking lesson follows
 * (docs/labs/miking/LESSON_JOURNEY.md). Pure; tested in node.
 *
 *   STAGES        seven teaching stages over the nine pages, in order (the
 *                 Sources stage left the lesson: owner ruling 2026-10-04).
 *   FOUNDATIONS   orient + how it sounds + the setting: understood before any
 *                 mic is operated (owner 2026-10-04: "an understanding of the
 *                 instrument, the sounds, the layout, then finally the miking").
 *   pageGate      'open' or 'foundations'. Navigation is NEVER gated (owner
 *                 2026-09-20): a gated page shows the Foundations card in place
 *                 of its ACTIVITY, with one-tap ways to meet them.
 *   gradeQuickCheck  the experienced path's honest check: ≥ 5 of 6 on the first
 *                 pick AND every critical (safety) item right. Passing it banks
 *                 NOTHING — credit comes only from each page's own requirement.
 */
import type { DiagnosticItem, PageId } from './model/types.ts';
import { PAGE_IDS } from './model/types.ts';

export type StageId = 'orient' | 'sound' | 'setting' | 'mics' | 'placement' | 'advanced' | 'practice';
export type Stage = { id: StageId; title: string; line: string; pages: readonly PageId[] };

export const STAGES: readonly Stage[] = [
  { id: 'orient', title: 'Meet the instrument', line: 'What it is, where it is used, and its parts. Explore — no tasks.', pages: ['instrument'] },
  { id: 'sound', title: 'How it sounds', line: 'How a strike becomes sound, and where the sound leaves — shown, never played.', pages: ['sound'] },
  { id: 'setting', title: 'Where it sits', line: 'Its neighbours, the player’s space, a stage and a studio.', pages: ['setting'] },
  { id: 'mics', title: 'Microphones', line: 'Choose by pattern, power, size and mount — for this source.', pages: ['microphone'] },
  { id: 'placement', title: 'Placement', line: 'Where we recommend you begin, then you place the mic.', pages: ['placement'] },
  { id: 'advanced', title: 'Advanced', line: 'Studio or live, two microphones, troubleshooting.', pages: ['context', 'twoMic', 'troubleshoot'] },
  { id: 'practice', title: 'Practice', line: 'Set up in order, choose and justify a setup, a mixed review.', pages: ['practice'] },
];

export const FOUNDATION_PAGES: readonly PageId[] = ['instrument', 'sound', 'setting'];

export type LearnerPath = 'new' | 'experienced';
/** The quick check's result for one practice run. */
export type QuickCheckResult = { right: number; total: number; pass: boolean; misses: PageId[] };

export const QUICK_CHECK_SIZE = 6;
export const QUICK_CHECK_PASS = 5;

export function stageOf(page: PageId): Stage {
  return STAGES.find((s) => s.pages.includes(page)) ?? STAGES[STAGES.length - 1];
}

export const isFoundation = (page: PageId): boolean => FOUNDATION_PAGES.includes(page);

/** Foundations are met when each foundation page has met its requirement
 *  (stored credit, or met on screen this session) — or the quick check was
 *  passed in this practice run. */
export function foundationsMet(met: ReadonlySet<PageId>, quickCheckPassed: boolean): boolean {
  return quickCheckPassed || FOUNDATION_PAGES.every((p) => met.has(p));
}

/** The foundation pages still to meet (empty when met). */
export function foundationsLeft(met: ReadonlySet<PageId>): PageId[] {
  return FOUNDATION_PAGES.filter((p) => !met.has(p));
}

/** Is a page's ACTIVITY open? Navigation itself is never gated. */
export function pageGate(page: PageId, met: ReadonlySet<PageId>, quickCheckPassed: boolean): 'open' | 'foundations' {
  if (isFoundation(page)) return 'open';
  return foundationsMet(met, quickCheckPassed) ? 'open' : 'foundations';
}

/** Grade the quick check from the FIRST pick per item. */
export function gradeQuickCheck(items: readonly DiagnosticItem[], picks: Readonly<Record<string, string>>): QuickCheckResult {
  let right = 0;
  let criticalOk = true;
  const misses: PageId[] = [];
  for (const it of items) {
    const ok = picks[it.id] === it.correct;
    if (ok) right += 1;
    else {
      if (it.critical) criticalOk = false;
      if (!misses.includes(it.covers)) misses.push(it.covers);
    }
  }
  const answered = items.every((it) => it.id in picks);
  return { right, total: items.length, pass: answered && criticalOk && right >= Math.min(QUICK_CHECK_PASS, items.length), misses: PAGE_IDS.filter((p) => misses.includes(p)) };
}

/** Problems with a lesson's quick check (validated with the lesson). */
export function validateQuickCheck(items: readonly DiagnosticItem[]): string[] {
  const out: string[] = [];
  if (items.length !== QUICK_CHECK_SIZE) out.push(`quick check has ${items.length} items, not ${QUICK_CHECK_SIZE}`);
  if (!items.some((i) => i.critical)) out.push('quick check has no critical (safety) item');
  const ids = new Set<string>();
  for (const it of items) {
    if (ids.has(it.id)) out.push(`quick check: duplicate id ${it.id}`);
    ids.add(it.id);
    if (!isFoundation(it.covers)) out.push(`quick check ${it.id}: covers ${it.covers}, not a foundation page`);
    if (!it.options.includes(it.correct)) out.push(`quick check ${it.id}: correct is not an option`);
    for (const o of it.options) if (o !== it.correct && !it.why[o]) out.push(`quick check ${it.id}: no explanation for "${o}"`);
  }
  for (const f of FOUNDATION_PAGES) if (!items.some((i) => i.covers === f)) out.push(`quick check: nothing covers ${f}`);
  return out;
}
