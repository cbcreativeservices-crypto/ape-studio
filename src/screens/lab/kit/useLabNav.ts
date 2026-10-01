/**
 * useLabNav — the ONE hook behind the shared lab navigation strip
 * (owner 2026-09-30; words and rules in labNav.ts, drawing in LabNavBar.tsx).
 *
 * The hook NEVER persists anything. Persistence, guest rules, stop-on-leave
 * and credit all stay in each host's own `go` / `finish` — the hook only
 * decides WHICH of them to call, and when:
 *
 *   START    → go(0)                       (from the end screen: leaves it)
 *   PREV     → go(i - 1)                   (from the end screen: unEnd())
 *   NEXT     → beforeAdvance?(i) → go(i + 1)
 *   FINISH   → beforeAdvance?(i) → finish()
 *   CONTENTS → jump(i) = go(i)             (beforeAdvance is NOT run)
 *   WHAT'S LEFT (contents footer) → finish()
 *
 * `beforeAdvance` returning 'consumed' means the host handled the tap itself
 * (a myth interstitial, a check that wants one more answer): nothing moves.
 * It is never a wall — the host must always offer a way on.
 *
 * Sub-step mode (`sub`): PREV/NEXT walk the steps of the current unit and
 * roll over to the previous/next unit at the boundaries through
 * `onRollPrev` / `onRollNext` (default: go(i ∓ 1)).
 *
 * One 400 ms tap lock covers START, PREV, NEXT, FINISH and CONTENTS jumps.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { createTapLock, navView, type NavView } from './labNav';

export type LabNavUnit = {
  id: string;
  title: string;
  /** Done / credited — drawn as ✓ in CONTENTS. */
  done?: boolean;
  /** An assessment rather than a unit: numbered CHECK in CONTENTS. */
  kind?: 'unit' | 'check';
};

export type LabNavSub = {
  index: number;
  count: number;
  titles: readonly string[];
  go: (step: number) => void;
  /** NEXT on the last step (not the last unit). Default: go(index + 1). */
  onRollNext?: () => void;
  /** PREV on the first step (not the first unit). Default: go(index - 1). */
  onRollPrev?: () => void;
};

export type LabNavOptions = {
  units: readonly LabNavUnit[];
  /** 0-based current unit; -1 = the intro (only with `intro: true`). */
  index: number;
  /** The end screen is showing in place of a unit. */
  ending: boolean;
  /** Show unit `i` (the host also clears its own `ending`). */
  go: (i: number) => void;
  /** Runs on NEXT / FINISH only, never on a CONTENTS jump. */
  beforeAdvance?: (from: number) => void | 'consumed';
  /** Open the end screen in place (the host sets `ending` true). */
  finish: () => void;
  /** Leave the end screen back to the last unit (the host sets `ending` false). */
  unEnd: () => void;
  sub?: LabNavSub;
  /** Optional CONTENTS footer: a practice reset. Must never remove credit. */
  reset?: { label: string; run: () => void };
  /** The lab has an INTRO before unit 1 at index -1. */
  intro?: boolean;
};

export type LabNav = {
  view: NavView;
  units: readonly LabNavUnit[];
  index: number;
  ending: boolean;
  start: () => void;
  prev: () => void;
  next: () => void;
  /** CONTENTS jump to unit `i`. */
  jump: (i: number) => void;
  /** CONTENTS → WHAT'S LEFT. */
  openEnd: () => void;
  contentsOpen: boolean;
  setContentsOpen: (open: boolean) => void;
  /** Title of what NEXT opens, or null when NEXT is FINISH / on the end screen. */
  nextTitle: string | null;
  reset?: { label: string; run: () => void };
};

export function useLabNav(o: LabNavOptions): LabNav {
  const { units, index, ending, go, beforeAdvance, finish, unEnd, sub, reset, intro } = o;
  const count = units.length;
  const last = count - 1;
  const lock = useRef(createTapLock(400)).current;
  const [contentsOpen, setContentsOpen] = useState(false);

  const view = useMemo(
    () => navView(index, count, ending, sub ? { i: sub.index, count: sub.count } : undefined, intro),
    [index, count, ending, sub, intro],
  );

  const leaveEnd = useCallback(() => {
    if (ending) unEnd();
  }, [ending, unEnd]);

  const start = useCallback(() => {
    if (lock()) return;
    setContentsOpen(false);
    if (!ending && index <= 0 && (!sub || sub.index <= 0)) return;
    leaveEnd();
    go(0);
  }, [lock, ending, index, sub, leaveEnd, go]);

  const prev = useCallback(() => {
    if (lock()) return;
    setContentsOpen(false);
    if (ending) {
      unEnd();
      return;
    }
    if (sub && sub.index > 0) {
      sub.go(sub.index - 1);
      return;
    }
    if (index > 0) {
      if (sub?.onRollPrev) sub.onRollPrev();
      else go(index - 1);
      return;
    }
    if (intro && index === 0) go(-1);
    // index 0 without an intro: PREV is dimmed; nothing to do.
  }, [lock, ending, sub, index, intro, unEnd, go]);

  const next = useCallback(() => {
    if (lock()) return;
    setContentsOpen(false);
    if (ending) return; // the slot is empty on the end screen
    if (sub && sub.index < sub.count - 1) {
      sub.go(sub.index + 1);
      return;
    }
    if (beforeAdvance?.(index) === 'consumed') return;
    if (index >= last) {
      finish();
      return;
    }
    if (sub?.onRollNext && index >= 0) sub.onRollNext();
    else go(index + 1);
  }, [lock, ending, sub, beforeAdvance, index, last, finish, go]);

  const jump = useCallback(
    (i: number) => {
      if (lock()) return;
      setContentsOpen(false);
      leaveEnd();
      go(Math.max(0, Math.min(last, i)));
    },
    [lock, leaveEnd, go, last],
  );

  const openEnd = useCallback(() => {
    if (lock()) return;
    setContentsOpen(false);
    finish();
  }, [lock, finish]);

  const nextTitle = useMemo(() => {
    if (ending) return null;
    if (sub && sub.index < sub.count - 1) return sub.titles[sub.index + 1] ?? null;
    if (index < 0) return units[0]?.title ?? null;
    return index < last ? units[index + 1].title : null;
  }, [ending, sub, index, last, units]);

  return useMemo(
    () => ({ view, units, index, ending, start, prev, next, jump, openEnd, contentsOpen, setContentsOpen, nextTitle, reset }),
    [view, units, index, ending, start, prev, next, jump, openEnd, contentsOpen, nextTitle, reset],
  );
}
