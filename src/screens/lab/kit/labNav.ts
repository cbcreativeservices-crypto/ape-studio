/**
 * labNav — the pure half of the SHARED LAB NAVIGATION (owner 2026-09-30).
 *
 *   Owner: "Many of the labs have different ways of going forward and
 *   backwards… make the navigation through labs very recognizable and shared
 *   between labs — next, previous, exit back to a menu."
 *
 * This file decides WHAT the strip shows; LabNavBar.tsx only draws it and
 * useLabNav.ts only wires the taps. Kept React-free so every edge case is
 * unit-tested without Metro (test/labNav.test.ts), exactly like labEnd.ts.
 *
 * The strip, left to right:   [⏮] [‹ PREV]  MODULE / 3 / 8 ▾  [NEXT ›]
 *   • ⏮ and ‹ PREV dim on the first unit (never hidden, never removed);
 *   • the readout is a BUTTON that opens CONTENTS; it reads INTRO before the
 *     first unit and WHAT'S LEFT on the end screen;
 *   • NEXT › becomes FINISH › on the last unit and is NEVER disabled or held
 *     (labs never block navigation). On the end screen its slot is empty.
 *
 * Positions: `i` is the 0-based unit index. `i === -1` is the INTRO (a host
 * that has one passes `intro: true` so PREV can return to it from unit 1).
 * Sub-step mode (`sub`) reads "MODULE 3 · STEP 2 / 4".
 */

export const NAV = {
  prev: '‹ PREV',
  next: 'NEXT ›',
  finish: 'FINISH ›',
  whatsLeft: "WHAT'S LEFT",
  intro: 'INTRO',
} as const;

/** The noun for a lab's top-level unit is ALWAYS "MODULE"; a unit's own
 *  sub-units are "STEP". Nothing else (no PAGE, SECTION, PART…). */
export type NavNoun = 'MODULE' | 'STEP';

export type NavView = {
  /** ⏮ is live (not dimmed). */
  startOn: boolean;
  /** ‹ PREV is live (not dimmed). */
  prevOn: boolean;
  /** The right-hand label, or null on the end screen (slot kept, empty). */
  nextLabel: typeof NAV.next | typeof NAV.finish | null;
  /** The readout's top line ("MODULE", "MODULE 3 · STEP"); '' on the end screen. */
  noun: string;
  /** The readout's bottom line ("3 / 8", "INTRO", "WHAT'S LEFT"). */
  pos: string;
  /** Screen-reader labels. */
  a11y: { start: string; prev: string; next: string; pos: string };
};

export type NavSub = { i: number; count: number };

/**
 * What the strip shows at unit `i` of `count`.
 * @param ending  the end screen (WHAT'S LEFT) is showing in place of a unit
 * @param sub     sub-step mode: the step position inside unit `i`
 * @param intro   the lab has an INTRO before unit 1 (position -1)
 */
export function navView(i: number, count: number, ending: boolean, sub?: NavSub, intro?: boolean): NavView {
  const last = Math.max(0, count - 1);
  const onIntro = i < 0;
  const onLast = !onIntro && i >= last;
  const subLast = sub ? sub.i >= sub.count - 1 : true;
  const subFirst = sub ? sub.i <= 0 : true;

  if (ending) {
    return {
      startOn: count > 0,
      prevOn: true,
      nextLabel: null,
      noun: '',
      pos: NAV.whatsLeft,
      a11y: {
        start: 'Back to the first module',
        prev: 'Back to the last module',
        next: '',
        pos: "What's left. Opens the contents",
      },
    };
  }

  if (onIntro) {
    return {
      startOn: false,
      prevOn: false,
      nextLabel: count > 0 ? NAV.next : NAV.finish,
      noun: 'MODULE',
      pos: NAV.intro,
      a11y: {
        start: 'Back to the first module',
        prev: 'Previous module',
        next: count > 0 ? 'Next module' : "Finish the lab and see what's left",
        pos: `Introduction, before module 1 of ${count}. Opens the contents`,
      },
    };
  }

  const prevOn = i > 0 || !subFirst || (!!intro && i === 0);
  const isFinish = onLast && subLast;
  const nextLabel = isFinish ? NAV.finish : NAV.next;
  const nextA11y = isFinish
    ? "Finish the lab and see what's left"
    : sub && !subLast
      ? 'Next step'
      : 'Next module';
  const prevA11y = sub && !subFirst ? 'Previous step' : i === 0 && intro ? 'Back to the introduction' : 'Previous module';

  if (sub) {
    return {
      startOn: i > 0,
      prevOn,
      nextLabel,
      noun: `MODULE ${i + 1} · STEP`,
      pos: `${sub.i + 1} / ${sub.count}`,
      a11y: {
        start: 'Back to the first module',
        prev: prevA11y,
        next: nextA11y,
        pos: `Module ${i + 1} of ${count}, step ${sub.i + 1} of ${sub.count}. Opens the contents`,
      },
    };
  }

  return {
    startOn: i > 0,
    prevOn,
    nextLabel,
    noun: 'MODULE',
    pos: `${i + 1} / ${count}`,
    a11y: {
      start: 'Back to the first module',
      prev: prevA11y,
      next: nextA11y,
      pos: `Module ${i + 1} of ${count}. Opens the contents`,
    },
  };
}

/**
 * ONE tap lock for START / PREV / NEXT / FINISH / CONTENTS jumps. Returns a
 * function that answers TRUE when the tap must be IGNORED (another nav tap
 * landed within `ms`). Bug hunt 2026-09-30: the second tap of a double-tap on
 * NEXT at the second-last module landed after the re-render, where NEXT was
 * already FINISH, and skipped the last module.
 *
 *   const locked = createTapLock();
 *   const next = () => { if (locked()) return; … };
 */
export function createTapLock(ms = 400, now: () => number = Date.now): () => boolean {
  let at = -Infinity;
  return () => {
    const t = now();
    if (t - at < ms) return true;
    at = t;
    return false;
  };
}

/** The in-flow button's words: "NEXT: <title> ›", or FINISH on the last unit. */
export function nextButtonLabel(nextTitle: string | null): string {
  return nextTitle ? `NEXT: ${nextTitle.toUpperCase()} ›` : 'FINISH · SEE WHAT’S LEFT ›';
}
