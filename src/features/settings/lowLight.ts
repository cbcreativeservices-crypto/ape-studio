/**
 * lowLight — a GLOBAL "low light mode" toggle (user request 2026-07-18).
 *
 * When ON, the app's OUTPUT is dimmed by laying a black wash over every screen
 * (NOT the device brightness — the technician can still set their phone
 * brightness independently; this only cuts how much light the screen throws in
 * a dark theater/studio). A persistent red line at the top of every screen
 * marks the mode as active. Device-local, persisted, and reactive — the same
 * tiny external-store pattern as features/flags/flaggedStore.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:lowLight';
const KEY_AT = 'ape:lowLightAt';

/** Fraction of black laid over the app when ON (owner 2026-08-01: 0.50). */
export const LOW_LIGHT_DIM = 0.5;

/** Auto-revert to full brightness after this long UNTOUCHED (owner 2026-07-30):
 *  the clock refreshes each time the app is opened/foregrounded while low-light
 *  is on; leave the app alone this long and it turns itself back off. */
export const LOW_LIGHT_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

let on = false;
let touchedAt = 0;
let hydrated = false;
const listeners = new Set<() => void>();
// Fires ONLY when the mode is switched ON by an explicit setLowLight(true) — the
// user toggling it — NOT when async hydration restores a persisted-on state on
// cold launch. The on-enable popup subscribes here so it never shows on relaunch.
const activationListeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Subscribe to explicit user activations of the mode. Returns an unsubscribe. */
export function onLowLightActivated(cb: () => void): () => void {
  activationListeners.add(cb);
  return () => {
    activationListeners.delete(cb);
  };
}

export function getLowLight(): boolean {
  return on;
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    on = raw === '1';
    const atRaw = await AsyncStorage.getItem(KEY_AT);
    touchedAt = atRaw ? parseInt(atRaw, 10) || 0 : 0;
  } catch {
    // absent/corrupt → stays off
  }
  hydrated = true;
  // Cold-launch expiry: if it was left on past the window, revert now.
  checkLowLightExpiry();
  emit();
}

export function setLowLight(next: boolean): void {
  if (on === next) return;
  on = next;
  touchedAt = next ? Date.now() : 0;
  void AsyncStorage.setItem(KEY, next ? '1' : '0');
  void AsyncStorage.setItem(KEY_AT, String(touchedAt));
  emit();
  // Explicit activation (user turned it ON) → notify the on-enable popup. Async
  // hydration restores `on` directly (not via this function), so a persisted-on
  // cold launch never fires this.
  if (next) activationListeners.forEach((l) => l());
}

/** Refresh the "last touched" clock (owner 2026-07-30: reset on last user
 *  INPUT, not on app open). Called from the root touch-capture on every touch
 *  while low-light is on. Throttled to once a minute — minute granularity is
 *  plenty for a 12h window and avoids an AsyncStorage write per touch. */
export function touchLowLight(): void {
  if (!on) return;
  const now = Date.now();
  if (now - touchedAt < 60_000) return;
  touchedAt = now;
  void AsyncStorage.setItem(KEY_AT, String(touchedAt));
}

/** If low-light has been untouched past the expiry window, turn it back off.
 *  Safe to call on hydrate and on every foreground. */
export function checkLowLightExpiry(): void {
  if (on && touchedAt > 0 && Date.now() - touchedAt > LOW_LIGHT_EXPIRY_MS) {
    setLowLight(false);
  }
}

export function toggleLowLight(): void {
  setLowLight(!on);
}

// ---- 6-tap emergency cancel (owner 2026-08-01) ----------------------------
// In Low-Light Production Mode nothing else appears on screen, so the escape
// hatch is a gesture: tap the screen quickly SIX times in a row to cancel the
// mode immediately. Called from the app-root touch capture on every touch-down.
const CANCEL_TAPS = 6;
const CANCEL_WINDOW_MS = 3000; // all six within this rolling window
let tapTimes: number[] = [];

export function registerLowLightTap(): void {
  if (!on) {
    if (tapTimes.length) tapTimes = [];
    return;
  }
  const now = Date.now();
  tapTimes.push(now);
  // Keep only the taps still inside the rolling window.
  while (tapTimes.length && now - tapTimes[0] > CANCEL_WINDOW_MS) tapTimes.shift();
  if (tapTimes.length >= CANCEL_TAPS) {
    tapTimes = [];
    setLowLight(false);
  }
}

/** Live subscription — re-renders the caller whenever the mode flips. */
export function useLowLight(): boolean {
  const [snap, setSnap] = useState(on);
  useEffect(() => {
    const l = () => setSnap(on);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
