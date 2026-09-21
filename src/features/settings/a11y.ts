/**
 * MOTION RUNTIME (owner 2026-08-30: "wire in all the accessibility logic";
 * narrowed 2026-08-31).
 *
 * This module once carried a font scale, a high-contrast flag and a
 * colour-blind mode as well. All three are gone: text size and contrast defer
 * to the phone (RN scales every Text with the OS setting already), and the
 * amplitude ramp cannot be re-visualised for colour blindness because the ramp
 * carries meaning. What remained had ZERO call sites outside a dev preview —
 * a runtime nothing consulted is worse than no runtime, because it reads as
 * wired. Motion is the one control the app genuinely owns, so that is all this
 * module now holds.
 *
 * Design follows the existing `hapticsEnabled()` idiom in store.ts:
 *  - a MODULE-LEVEL mirror so non-React code (engines, one-off helpers) can
 *    read a value synchronously with no async hop, and
 *  - a subscription so React components re-render the moment it changes.
 */
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { LocalSettings } from './store';

export type A11yState = {
  reduceAnimations: boolean;
};

const DEFAULT: A11yState = {
  reduceAnimations: false,
};

let state: A11yState = DEFAULT;
const listeners = new Set<() => void>();

/** Synchronous read for non-React code. */
export function a11y(): A11yState {
  return state;
}

/** Fed by saveLocalSettings/loadLocalSettings — never called directly by UI. */
export function applyA11yFromSettings(s: LocalSettings): void {
  // Cheap identity check: re-notifying on every settings save (haptics, mic,
  // notification times) would re-render the whole tree for nothing.
  if (s.reduceAnimations === state.reduceAnimations) return;
  state = { reduceAnimations: s.reduceAnimations };
  listeners.forEach((l) => l());
}

/** Account switch — drop back to defaults with the rest of the device state. */
export function resetA11y(): void {
  state = DEFAULT;
  listeners.forEach((l) => l());
}

/**
 * OS-level "reduce motion" (iOS Settings > Accessibility > Motion, Android
 * "Remove animations"). Someone who has asked the whole PHONE to stop
 * animating should not have to find our toggle as well, so the two are ORed:
 * either one silences motion. Read once at boot and kept current by the OS
 * change event.
 */
let osReduceMotion = false;
void AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => {
    osReduceMotion = !!v;
    listeners.forEach((l) => l());
  })
  .catch(() => {
    /* older platforms simply do not report it */
  });
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
  osReduceMotion = !!v;
  listeners.forEach((l) => l());
});

/**
 * ── IS A SCREEN READER ON? (2026-09-18, pass 5 · W18) ────────────────────────
 *
 * The study methods auto-advance on timers — 3000 ms in Scenarios, 950 ms in
 * Fill in the Blank, HIGHLIGHT_MS in the quiz and exam. Those numbers are how
 * long a SIGHTED learner needs to register a colour. They are not how long
 * VoiceOver or TalkBack needs to speak a sentence, and in Scenarios the
 * sentence is the entire lesson: the explanation of what you got wrong is cut
 * off mid-word by the next question.
 *
 * Same shape as osReduceMotion above: seeded once, kept current by the OS
 * event, read synchronously by callers.
 */
let osScreenReader = false;
void AccessibilityInfo.isScreenReaderEnabled?.()
  .then((v) => {
    osScreenReader = !!v;
    listeners.forEach((l) => l());
  })
  .catch(() => {
    /* older platforms simply do not report it */
  });
AccessibilityInfo.addEventListener?.('screenReaderChanged', (v: boolean) => {
  osScreenReader = !!v;
  listeners.forEach((l) => l());
});

/**
 * True when VoiceOver/TalkBack is on.
 *
 * Callers use this to HOLD an auto-advance, so only use it where the learner
 * has a manual way onward — otherwise holding strands them.
 */
export function screenReaderOn(): boolean {
  return osScreenReader;
}

/** Should this animation run at all? Honours the app toggle AND the OS. */
export function animationsAllowed(): boolean {
  return !state.reduceAnimations && !osReduceMotion;
}

/**
 * Subscribe to motion changes.
 *
 * ⛔ THE SECOND HALF OF THE DOCBLOCK ABOVE, WHICH WAS MISSING
 * (owner 2026-09-20 bug pass). This module promised "a subscription so React
 * components re-render the moment it changes" and notified `listeners` in six
 * places — but nothing was ever ADDED to that set, because no subscribe was
 * exported. Every one of those notifications was a no-op, and all 28 importers
 * took only the synchronous readers.
 *
 * So "Reduce animations" did nothing to anything already on screen. Settings
 * is a MODAL: the screen behind it stays mounted, so turning the setting on
 * and closing left every running loop running. Seven switch lamps on the
 * Dashboard kept flickering at a user who had just asked the app to stop
 * moving — the exact thing the setting exists to prevent.
 */
export function subscribeA11y(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Reactive `animationsAllowed()` — re-renders when the app toggle or the OS
 *  flag changes. Decorative loops should use THIS, not the plain reader, or
 *  they will not notice the setting until they remount. */
export function useAnimationsAllowed(): boolean {
  return useSyncExternalStore(subscribeA11y, animationsAllowed, animationsAllowed);
}

/** True when the phone (not the app) asked for reduced motion — lets Settings
 *  explain why the control looks forced on. */
export function osReduceMotionOn(): boolean {
  return osReduceMotion;
}
