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
/**
 * The short card shown when a lab screen opens (owner 2026-11-08, D52: "no
 * real intro to what is going on or being learned"). Two lines, student voice:
 *   learning — what this screen is about (knowledge, ≤ 30 words);
 *   start    — the first thing to do and what to watch (≤ 40 words).
 */
export type ScreenIntro = { learning: string; start: string };

/** Word caps for the intro card (Comp B return 2026-11-08). */
export const SCREEN_INTRO_WORDS = { learning: 30, start: 40 } as const;

/** The intro card's words (student voice). */
export const SCREEN_INTRO_TEXT = {
  learning: 'WHAT YOU’RE LEARNING',
  start: 'WHERE TO START',
  explain: 'EXPLAIN THIS SCREEN',
  dismiss: 'GOT IT',
  /** The guide's first step leads back to the card with this. */
  reopen: '‹ INTRO',
} as const;

/**
 * The intro's "seen" id: a short hash of its two lines, so every screen that
 * shows a guide gets its own once-per-device card with no per-screen id
 * (owner 2026-11-08). Rewording an intro gives it a new id, so a student sees
 * the new wording once. FNV-1a 32-bit, base 36 — pure, no React.
 */
export function screenIntroId(intro: ScreenIntro): string {
  const s = `${intro.learning}|${intro.start}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `i${h.toString(36)}`;
}

export type ScreenGuide = {
  /** Optional while the Guided Lessons return is being loaded; the guide test
   *  then requires it on every screen. */
  intro?: ScreenIntro;
  seeing: string[];
  control: string[];
  changes: string[];
  teaches: string[];
  tryThis: string[];
};

/** The five stepped sections (the intro card is not a step). */
export type ScreenGuideSectionKey = Exclude<keyof ScreenGuide, 'intro'>;

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
 * The lab help switch. Off for launch (owner 2026-11-05, D52: the guides did
 * not yet meet the student-voice standard); back ON 2026-11-08 (HOLD 2 = YES,
 * must-do D52) together with the intro card. While off, the ⓘ key, its hint
 * and the intro card all draw nothing; every guide file stays in place.
 */
export const SCREEN_GUIDES_ON = true;

/** The header key's accessible label (one wording everywhere). */
export const SCREEN_GUIDE_KEY_LABEL = 'Explain this screen';

/** The one-time hint's words. */
export const SCREEN_GUIDE_HINT_TEXT = 'New: tap ⓘ to have this screen explained';
