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
import { useSamplingActive } from '../features/intro/onboardingSampling';

export const MAX_OPENS = 5;

/** Storage keys, exported so a dev reset can clear exactly these.
 *  Pillar B expansion (plan §3, 2026-09-13): the app-wide budget is 5–8 tips
 *  total, one interruption at a time — add a key only against a real
 *  discoverability risk (see plan §11 inventory), never per screen by habit. */
export const COACH_KEYS = {
  glossary: 'ape:coach:glossary',
  flashcards: 'ape:coach:flashcards',
  dashboardJog: 'ape:coach:dashjog', // the jog dial IS the topic selector — invisible until held
  toolsHub: 'ape:coach:toolshub', // live tile displays don't read as buttons
  splSettings: 'ape:coach:splsettings', // bezel keys hide RANGE/WEIGHTING/RESPONSE/HOLD
  labControls: 'ape:coach:labcontrols', // lab controls are draggable, not just diagrams
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
  // The first-run sampler loop also hushes coach marks while sampling (§2.1).
  // BOTH hooks must run every render — assign separately, never `a() || b()`
  // (short-circuit skips the 2nd hook and tears the tree; see popupSuppressStore).
  const overlaysSuppressed = useOverlaysSuppressed();
  const sampling = useSamplingActive();
  const suppressed = overlaysSuppressed || sampling;

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
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        opens.current = raw ? Number(raw) || 0 : 0;
        if (opens.current < MAX_OPENS) setVisible(true); // else: retired
      } catch {
        /* unreadable storage → treat the hint as retired rather than reject */
      }
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
        // count this open
        void AsyncStorage.setItem(storageKey, String(opens.current + 1)).catch(() => {});
      }
    }
  }, [visible, dismissAfter, storageKey]);

  /**
   * Retire the hint PERMANENTLY, right now — for a hint whose lesson is
   * learned the first time the user does the thing, so repeating it is noise
   * (owner 2026-09-20, the Tools hub: "after user has tapped a tool 1 time
   * (ever) never show it").
   *
   * Unlike `registerAction` this does NOT require the hint to be visible.
   * A user who opened a tool while Low-Light Production Mode was hushing
   * overlays has still learned that the display is the way in; the hint has
   * nothing left to teach them, and popping up later would be the app
   * forgetting what it watched them do.
   */
  const retire = useCallback(() => {
    if (qualified.current) return;
    qualified.current = true;
    setVisible(false);
    if (devBypass('alwaysShowIntros')) return; // dev: never dirty the real counter
    void AsyncStorage.setItem(storageKey, String(MAX_OPENS)).catch(() => {});
  }, [storageKey]);

  return { visible: visible && !suppressed, registerAction, retire };
}
