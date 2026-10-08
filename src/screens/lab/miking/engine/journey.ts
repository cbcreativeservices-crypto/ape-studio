/**
 * THE LESSON JOURNEY — the rules every Miking lesson follows
 * (docs/labs/miking/LESSON_JOURNEY.md). Pure; tested in node.
 *
 * Owner restructure 2026-10-06: "The labs need to be about miking … how to
 * mic it well and how to approach miking." The journey is now:
 *
 *   STAGES        six teaching stages over the eight pages, in order:
 *                 MEET IT (where the sound comes from) → STARTING SETUPS (real
 *                 mic setups drawn on the instrument) → microphones → the
 *                 Placement Studio → advanced → practice. "Where it sits" is
 *                 gone; its mic decisions live in STARTING SETUPS.
 *   FOUNDATIONS   MEET IT + STARTING SETUPS: what the instrument is, where its
 *                 sound leaves, and the setups to start from — seen before a
 *                 mic is operated.
 *   pageGate      'open' or 'foundations'. Navigation is NEVER gated (owner
 *                 2026-09-20): a gated page shows the Foundations card in place
 *                 of its ACTIVITY, with one-tap ways to meet them.
 *   gradeQuickCheck  the experienced path's honest check: ≥ 5 of 6 on the first
 *                 pick AND every critical (safety) item right. Passing it banks
 *                 NOTHING — credit comes only from each page's own requirement.
 */
import type { DiagnosticItem, PageId, SourcePageId } from './model/types.ts';
import { PAGE_IDS } from './model/types.ts';

export type StageId = 'meet' | 'setups' | 'mics' | 'placement' | 'advanced' | 'practice';
export type Stage = { id: StageId; title: string; line: string; pages: readonly PageId[] };

export const STAGES: readonly Stage[] = [
  { id: 'meet', title: 'Meet it — where the sound comes from', line: 'What you are miking, in brief, and where the sound leaves.', pages: ['meet'] },
  { id: 'setups', title: 'Starting setups', line: 'Real mic setups, drawn where the mic goes: one mic, two mics, close and farther back.', pages: ['setups'] },
  { id: 'mics', title: 'Microphones', line: 'Choose by pattern, power, size and mount — seen where the mic goes.', pages: ['microphone'] },
  { id: 'placement', title: 'Placement Studio', line: 'Start from a setup, then move the mic and see what changes.', pages: ['placement'] },
  { id: 'advanced', title: 'Advanced', line: 'Studio or live, two microphones, troubleshooting.', pages: ['context', 'twoMic', 'troubleshoot'] },
  { id: 'practice', title: 'Practice', line: 'Set up in order, choose and justify a setup, a mixed review.', pages: ['practice'] },
];

export const FOUNDATION_PAGES: readonly PageId[] = ['meet', 'setups'];

/**
 * The journey page a piece of lesson data belongs to: the three source pages
 * the 2026-10-04/05 lessons were written in map to the page built from them
 * (instrument + sound → MEET IT; setting → STARTING SETUPS). Pure.
 */
export function journeyPageOf(p: SourcePageId): PageId {
  if (p === 'instrument' || p === 'sound') return 'meet';
  if (p === 'setting') return 'setups';
  return p;
}

/** The standard line (owner 2026-10-06), word for word in every lesson, on
 *  MEET IT, STARTING SETUPS and the Placement Studio. */
export const STANDARD_LINE = 'These are suggested starting points, not rules. Put the mic up, listen, move it, and adjust — your ears and the room decide.';

/**
 * The START step's opening paragraph, the same for every lesson (owner
 * restructure 2026-10-06): it names the journey as it now is — where the
 * sound leaves, the starting setups drawn on the instrument, the microphones,
 * the Placement Studio — and never the old "how it makes its sound, and where
 * it sits". `thing`: the lesson's word for the instrument ("drum", "guitar
 * and its amp"); `plural`: a lesson about several (the hand-drum pairs).
 */
export function journeyIntro(noun: { one: string; many: string; person?: boolean }, thing?: string, plural = false): string {
  const a = /^[aeiou]/i.test(noun.one) ? 'an' : 'a';
  if (noun.person) {
    // A person is never "it" (Lab 7b review 2026-10-08): their voice, them.
    const who = `the ${thing ?? noun.one}`;
    return `This lesson is about putting a microphone on ${a} ${noun.one}. First, in brief, ${who} and where their voice leaves — the places a mic can hear them best. Then real starting setups drawn on ${who}, the microphones, and the Placement Studio, where you move the mic yourself. Nothing here makes a sound: the lab is silent and shows the physics instead.`;
  }
  const what = plural ? `microphones on ${noun.many}` : `a microphone on ${a} ${noun.one}`;
  const itself = plural ? `the ${thing ?? noun.many} themselves` : `the ${thing ?? noun.one} itself`;
  const its = plural ? 'their' : 'its';
  const it = plural ? 'them' : 'it';
  return `This lesson is about putting ${what}. First, in brief, ${itself} and where ${its} sound leaves — the places a mic can hear ${it} best. Then real starting setups drawn on ${it}, the microphones, and the Placement Studio, where you move the mic yourself. Nothing here makes a sound: the lab is silent and shows the physics instead.`;
}

/** Pages that print the standard line under their goal. */
export const STANDARD_LINE_PAGES: readonly PageId[] = ['meet', 'setups', 'placement'];

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

/** Grade the quick check from the FIRST pick per item. `misses` are journey
 *  pages (an item written for a source page counts for the page built from it). */
export function gradeQuickCheck(items: readonly DiagnosticItem[], picks: Readonly<Record<string, string>>): QuickCheckResult {
  let right = 0;
  let criticalOk = true;
  const misses: PageId[] = [];
  for (const it of items) {
    const ok = picks[it.id] === it.correct;
    if (ok) right += 1;
    else {
      if (it.critical) criticalOk = false;
      const page = journeyPageOf(it.covers);
      if (!misses.includes(page)) misses.push(page);
    }
  }
  const answered = items.every((it) => it.id in picks);
  return { right, total: items.length, pass: answered && criticalOk && right >= Math.min(QUICK_CHECK_PASS, items.length), misses: PAGE_IDS.filter((p) => misses.includes(p)) };
}

/** Problems with a lesson's quick check (validated with the lesson, on the
 *  check the learner meets: engine/restructure.quickCheckOf). */
export function validateQuickCheck(items: readonly DiagnosticItem[]): string[] {
  const out: string[] = [];
  if (items.length !== QUICK_CHECK_SIZE) out.push(`quick check has ${items.length} items, not ${QUICK_CHECK_SIZE}`);
  if (!items.some((i) => i.critical)) out.push('quick check has no critical (safety) item');
  const ids = new Set<string>();
  for (const it of items) {
    if (ids.has(it.id)) out.push(`quick check: duplicate id ${it.id}`);
    ids.add(it.id);
    if (!isFoundation(journeyPageOf(it.covers))) out.push(`quick check ${it.id}: covers ${it.covers}, not a foundation page`);
    if (!it.options.includes(it.correct)) out.push(`quick check ${it.id}: correct is not an option`);
    for (const o of it.options) if (o !== it.correct && !it.why[o]) out.push(`quick check ${it.id}: no explanation for "${o}"`);
  }
  for (const f of FOUNDATION_PAGES) if (!items.some((i) => journeyPageOf(i.covers) === f)) out.push(`quick check: nothing covers ${f}`);
  return out;
}
