/**
 * ACCESSIBILITY RUNTIME (owner 2026-08-30: "wire in all the accessibility
 * logic actions").
 *
 * Four of the five accessibility controls in Settings were decorative — the
 * values were stored and read back into their own chips, but nothing in the
 * app ever consulted them. Only `haptics` was genuinely wired. This module is
 * the single place the rest of the app asks "what has the user chosen?".
 *
 * Design follows the existing `hapticsEnabled()` idiom in store.ts:
 *  - a MODULE-LEVEL mirror so non-React code (engines, one-off helpers) can
 *    read a value synchronously with no async hop, and
 *  - a subscription so React components re-render the moment it changes.
 *
 * `useA11y()` is the hook everything should use. It is deliberately tiny:
 * a font SCALE, a boolean, and a colour mapper.
 */
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { ColorBlindMode, FontSize, LocalSettings } from './store';

export type A11yState = {
  /** Chosen base size in points (13 / 16 / 19 / 24). */
  fontSize: FontSize;
  /** Multiplier against the app's design baseline — 1 at the default 16. */
  fontScale: number;
  highContrast: boolean;
  colorBlind: ColorBlindMode;
  reduceAnimations: boolean;
};

/** The size every StyleSheet in the app was authored against. */
export const BASE_FONT_SIZE = 16;

const DEFAULT: A11yState = {
  fontSize: 16,
  fontScale: 1,
  highContrast: false,
  colorBlind: 'off',
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
  const next: A11yState = {
    fontSize: s.fontSize,
    fontScale: s.fontSize / BASE_FONT_SIZE,
    highContrast: s.highContrast,
    colorBlind: s.colorBlind,
    reduceAnimations: s.reduceAnimations,
  };
  // Cheap identity check: re-notifying on every settings save (haptics, mic,
  // notification times) would re-render the whole tree for nothing.
  if (
    next.fontSize === state.fontSize &&
    next.highContrast === state.highContrast &&
    next.colorBlind === state.colorBlind &&
    next.reduceAnimations === state.reduceAnimations
  ) {
    return;
  }
  state = next;
  listeners.forEach((l) => l());
}

/** Account switch — drop back to defaults with the rest of the device state. */
export function resetA11y(): void {
  state = DEFAULT;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** React entry point. Re-renders the caller whenever accessibility changes. */
export function useA11y(): A11yState {
  return useSyncExternalStore(subscribe, a11y, a11y);
}

/**
 * Scale a font size authored against the 16 pt baseline.
 *
 * Clamped so the largest setting cannot break dense layouts: meters, bezel
 * readouts and axis labels have to stay inside fixed-height instrument
 * chrome. Small chrome text scales further than large display text so the
 * ratio between them stays sane at the extremes.
 */
export function scaleFont(size: number, scale = state.fontScale): number {
  if (scale === 1) return size;
  const eased = 1 + (scale - 1) * (size >= 24 ? 0.45 : size >= 18 ? 0.7 : 1);
  return Math.round(size * eased * 10) / 10;
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
