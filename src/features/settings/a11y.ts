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

/** Should this animation run at all? Honours the app toggle AND the OS. */
export function animationsAllowed(): boolean {
  return !state.reduceAnimations && !osReduceMotion;
}

/** True when the phone (not the app) asked for reduced motion — lets Settings
 *  explain why the control looks forced on. */
export function osReduceMotionOn(): boolean {
  return osReduceMotion;
}
