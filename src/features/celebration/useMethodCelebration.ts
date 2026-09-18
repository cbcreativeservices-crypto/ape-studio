/**
 * useMethodCelebration — raise the step/stage notices from the ONE place that
 * already knows, authoritatively, whether a study method is finished.
 *
 * ── WHY HERE AND NOT IN THE FOUR STUDY SCREENS ───────────────────────────────
 *
 * The obvious wiring is to fire "flashcard deck complete" from FlashcardsScreen
 * as the last card turns. It is also the wrong place, for three reasons:
 *
 *  1. Those four screens do not agree on what "complete" means. Flashcards
 *     completes when every term has been SEEN; matching and fill-in-blank need
 *     each item CORRECT twice; scenarios has an exemption for empty topics.
 *     The Dashboard's `methodPct` already resolves all of that — including the
 *     smoothing that stopped 99.5% rounding up into a passed gate. Wiring the
 *     screens would mean reimplementing that logic four times and having it
 *     drift from the gate it is supposed to mirror.
 *
 *  2. A per-board completion is not a topic completion. Matching finishes a
 *     BOARD many times per topic; celebrating there would fire repeatedly.
 *
 *  3. Four edits into four large, working screens is four chances to break
 *     something that currently works, for a notice.
 *
 * THE TRADE-OFF, stated plainly: the notice appears when the learner returns to
 * the Dashboard rather than on the final card. That reads well — you finish the
 * deck, come back, and the rack tells you it is done — but it is a beat later
 * than the spec imagined.
 *
 * ── WHY THIS TAKES NO ARGUMENTS AND RETURNS A PICKER ─────────────────────────
 *
 * Because the Dashboard computes `methodPct` AFTER two early returns (loading,
 * and error/no-topic). A hook called down there runs on some renders and not
 * others, and React tears the tree down with "Rendered more hooks than during
 * the previous render" — which is exactly what happened on the first attempt,
 * caught in the browser.
 *
 * So the hooks live here, called UNCONDITIONALLY at the top of the component,
 * and `pick()` is an ordinary function called later with the values once they
 * exist. Same rule the popupSuppressStore comment records for
 * `useOverlaysSuppressed`: never let a hook sit behind a condition.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CelebrationEvent, CelebrationId } from './types';
import { hasLoaded, loadCelebrationsSeen, markSeen, wasSeen } from './celebrationSeen';

/** Method key → the celebration raised when it reaches 100%. */
const METHOD_CELEBRATION: Record<string, CelebrationId> = {
  flashcards: 'flashcards-complete',
  matching: 'matching-complete',
  fill_in_blank: 'fill-blank-complete',
  scenarios: 'scenarios-complete',
};

/** Rack order, so two completions arrive in the order they were earned. */
const METHOD_ORDER = ['flashcards', 'fill_in_blank', 'matching', 'scenarios'] as const;

export type MethodProgress = {
  topicId: string;
  topicName: string;
  /** Method key → 0..100, UNROUNDED (the honest gate value). */
  pct: Record<string, number>;
  /** True when every method before the quiz is complete. */
  allMethodsComplete: boolean;
};

export type MethodCelebration = {
  /**
   * The one celebration to show right now, or null.
   *
   * At most ONE even when several methods completed while the user was away —
   * three notices stacked on a dashboard is clutter, and the rest are raised on
   * the next visit.
   */
  pick: (progress: MethodProgress | null) => CelebrationEvent | null;
  /** Mark the given celebration shown, so it never returns. */
  dismiss: (progress: MethodProgress, event: CelebrationEvent) => void;
};

export function useMethodCelebration(): MethodCelebration {
  const [, setReady] = useState(false);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  // The record must be read before anything is decided: `wasSeen` answers false
  // for everything until it resolves, and acting on that would congratulate the
  // user for every topic they have ever finished, on every cold start.
  useEffect(() => {
    let alive = true;
    void loadCelebrationsSeen().then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const pick = useCallback(
    (progress: MethodProgress | null): CelebrationEvent | null => {
      if (!progress || !hasLoaded()) return null;
      const { topicId, topicName, pct, allMethodsComplete } = progress;

      const offer = (id: CelebrationId): CelebrationEvent | null => {
        if (wasSeen(topicId, id)) return null;
        if (dismissed.has(`${topicId}:${id}`)) return null;
        return { id, values: { topic_name: topicName } };
      };

      for (const key of METHOD_ORDER) {
        const id = METHOD_CELEBRATION[key];
        if (!id || (pct[key] ?? 0) < 100) continue;
        const e = offer(id);
        if (e) return e;
      }
      // Everything before the quiz is done — the gate has opened.
      return allMethodsComplete ? offer('final-quiz-unlocked') : null;
    },
    [dismissed],
  );

  const dismiss = useCallback((progress: MethodProgress, event: CelebrationEvent) => {
    markSeen(progress.topicId, event.id);
    setDismissed((prev) => new Set(prev).add(`${progress.topicId}:${event.id}`));
  }, []);

  return { pick, dismiss };
}
