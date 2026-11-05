/**
 * ScreenGuide — the "explain this screen" content for one lab screen (owner
 * 2026-10-31: "What each lab screen really needs is an explanation of what
 * the screen is showing and what the user is interacting with … the missing
 * 'I still don't get this screen' helper").
 *
 * Five sections, always in this order, each 3–5 short bullets:
 *   seeing  — WHAT YOU'RE SEEING: the display, by its on-screen names.
 *   control — WHAT YOU CONTROL: every dock control and drag, with its range.
 *   changes — WHAT CHANGES — AND WHY: cause → effect, with the physics.
 *   teaches — WHAT THIS TEACHES: the knowledge (never "you'll master…").
 *   tryThis — TRY THIS: 2–3 concrete experiments and what to watch for.
 *
 * Pure data, no React: tests import the content files directly.
 */
export type ScreenGuide = {
  seeing: string[];
  control: string[];
  changes: string[];
  teaches: string[];
  tryThis: string[];
};

export type ScreenGuideSectionKey = keyof ScreenGuide;

/**
 * Section order + headings + WHERE each step sits (owner 2026-10-31: one
 * section per step, and the area being read about stays visible):
 *   seeing / changes / teaches → 'low': the display + readouts stay bright,
 *     the card fills the space below them;
 *   control → 'high': the dock stays bright and live, the card sits above it;
 *   tryThis → 'strip': a non-blocking strip just above the dock, one
 *     experiment at a time, display and dock both usable.
 * `keep` names the screen areas the step talks about (placement.ts).
 */
export const SCREEN_GUIDE_SECTIONS: readonly {
  key: ScreenGuideSectionKey;
  title: string;
  place: 'low' | 'high' | 'strip';
  keep: readonly ('display' | 'dock')[];
}[] = [
  { key: 'seeing', title: 'WHAT YOU’RE SEEING', place: 'low', keep: ['display'] },
  { key: 'control', title: 'WHAT YOU CONTROL', place: 'high', keep: ['dock'] },
  { key: 'changes', title: 'WHAT CHANGES — AND WHY', place: 'low', keep: ['display'] },
  { key: 'teaches', title: 'WHAT THIS TEACHES', place: 'low', keep: ['display'] },
  { key: 'tryThis', title: 'TRY THIS', place: 'strip', keep: ['display', 'dock'] },
];

/** The step label: its number and its name, never a count of the total
 *  (owner rule: no "N of total"). */
export function screenGuideStepLabel(i: number): string {
  return `${i + 1} · ${SCREEN_GUIDE_SECTIONS[i].title}`;
}

/** Character budgets that keep a step on one screen of a 375×812 phone with
 *  no scrolling (the bottom card has ~11 lines of 13 pt text under a Rack
 *  Unit's display at 410 characters; the top card, over the display, about
 *  twice that; one TRY THIS experiment is 3–4 lines in the strip). Pinned by
 *  the test. */
export const SCREEN_GUIDE_BUDGET = { low: 410, high: 700, tryItem: 200 } as const;

/**
 * Owner 2026-11-05: the lab help buttons and their hint are OFF for launch. The
 * guides are written but do not meet the student-voice standard yet (D52). Turn
 * this on after launch, once they do. Every guide file stays in place.
 */
export const SCREEN_GUIDES_ON = false;

/** The header key's accessible label (one wording everywhere). */
export const SCREEN_GUIDE_KEY_LABEL = 'Explain this screen';

/** The one-time hint's words. */
export const SCREEN_GUIDE_HINT_TEXT = 'New: tap ⓘ to have this screen explained';
