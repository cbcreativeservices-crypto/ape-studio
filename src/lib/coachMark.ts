/**
 * useCoachMark — app-wide onboarding hint that self-retires (Booth 2026-07-08,
 * revised 07-09).
 *
 * Rule (per screen, app-wide — NOT per topic):
 *  - Shows on open while the screen has fewer than MAX_OPENS (5) QUALIFYING
 *    opens recorded.
 *  - A "qualifying open" is one where the user actually COMPLETES the taught
 *    action `dismissAfter` times in that session. Opening the screen and
 *    leaving early (without completing) does NOT count — the hint returns next
 *    time and no progress toward retirement is made.
 *  - Once completed on 5 separate opens, the hint is retired permanently.
 *
 * So the persisted counter only increments the moment the requirement is met,
 * and only once per session.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devBypass } from '../config/devMode';
import { useOverlaysSuppressed } from '../features/dev/popupSuppressStore';

export const MAX_OPENS = 5;

/** Storage keys, exported so a dev reset can clear exactly these. */
export const COACH_KEYS = {
  glossary: 'ape:coach:glossary',
  flashcards: 'ape:coach:flashcards',
} as const;

export async function resetCoachMarks(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(COACH_KEYS));
}

export function useCoachMark(storageKey: string, dismissAfter: number) {
  const [visible, setVisible] = useState(false);
  const actions = useRef(0);
  const qualified = useRef(false); // this session already counted
  const opens = useRef(0);
  const started = useRef(false);
  // Suppression: never enter the visible state when the dev kill-switch is on
  // OR Low-Light Production Mode is engaged — wins over DEV_BYPASS.alwaysShowIntros.
  const suppressed = useOverlaysSuppressed();

  useEffect(() => {
    if (started.current) return; // once per mount
    if (suppressed) return; // suppressed → never show (untouched on toggle-off; re-entry re-decides)
    started.current = true;
    // DEV BYPASS (Booth 2026-07-18): first-time experience on EVERY entry —
    // show regardless of the persisted retire counter (counter untouched).
    // Restore = devMode.ts → alwaysShowIntros:false.
    if (devBypass('alwaysShowIntros')) {
      setVisible(true);
      return;
    }
    (async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      opens.current = raw ? Number(raw) || 0 : 0;
      if (opens.current < MAX_OPENS) setVisible(true); // else: retired
    })();
  }, [storageKey, suppressed]);

  /**
   * Call when the user completes one unit of the taught action (a full
   * flashcard round-trip, or a glossary expand). On the `dismissAfter`-th call
   * this session, the hint hides AND this open is recorded as qualifying.
   */
  const registerAction = useCallback(() => {
    if (!visible || qualified.current) return;
    actions.current += 1;
    if (actions.current >= dismissAfter) {
      qualified.current = true;
      setVisible(false);
      // Dev bypass: never advance the retire counter (real counts stay clean).
      if (!devBypass('alwaysShowIntros')) {
        void AsyncStorage.setItem(storageKey, String(opens.current + 1)); // count this open
      }
    }
  }, [visible, dismissAfter, storageKey]);

  return { visible: visible && !suppressed, registerAction };
}
