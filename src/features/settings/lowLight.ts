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
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

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
let hydrating: Promise<void> | null = null;
/**
 * The last storage read THREW (wave 2, 2026-10-02). A read that fails is not
 * "the mode is off": the user may well have it on, in a dark room, mid-show.
 * The hand-rolled hydrate swallowed the error, called the store hydrated with
 * the mode OFF, and so let every auto-appearing overlay through. Now a failed
 * read leaves the store UNHYDRATED (the next mount reads again), the mode keeps
 * its last known value, and overlay suppression treats "could not be read" as
 * suppressed (`isLowLightUnreadable`, `useLowLightSuppresses`). The dim wash is
 * NOT painted on a guess — dimming an app nobody switched on would be its own
 * surprise; only the auto-appearing overlays hold back.
 */
let readFailed = false;
/** Bumped by `resetLowLight` (the account wipe): a read that was out when the
 *  wipe ran lands nowhere, rather than restoring the departing user's mode. */
let lowLightGen = 0;
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

/** The stored mode could not be read: overlays must hold back as if it were on. */
export function isLowLightUnreadable(): boolean {
  return readFailed;
}

/**
 * Forget the mode — the account-wipe entry point.
 *
 * Low-Light Production Mode dims the app and suppresses every auto-appearing
 * overlay in it, safety notices included. `on` is module state and the stored
 * key is swept, so without this the next person on the device inherited a
 * silenced, dimmed app they never switched on and could not obviously explain
 * (2026-09-17). Re-hydrates to the correct new-user default of OFF.
 */
export function resetLowLight(): void {
  lowLightGen += 1;
  on = false;
  touchedAt = 0;
  hydrated = false;
  hydrating = null;
  readFailed = false;
  gatePending = false;
  tapTimes = [];
  emit();
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  const gen = lowLightGen;
  hydrating = (async () => {
    let raw: string | null;
    let atRaw: string | null;
    try {
      raw = await AsyncStorage.getItem(KEY);
      atRaw = await AsyncStorage.getItem(KEY_AT);
    } catch {
      if (gen !== lowLightGen) return;
      // READ failed: stay unhydrated (the next mount reads again), keep the
      // last known mode, and tell the overlays to hold back.
      readFailed = true;
      hydrating = null;
      emit();
      return;
    }
    if (gen !== lowLightGen) return;
    hydrating = null;
    readFailed = false;
    // The user switched the mode while the read was out: their choice is the
    // value now (and was written) — the older stored copy must not undo it.
    if (hydrated) return;
    // absent/garbled → off
    on = raw === '1';
    touchedAt = atRaw ? parseInt(atRaw, 10) || 0 : 0;
    hydrated = true;
    // Cold-launch expiry: if it was left on past the window, revert now.
    checkLowLightExpiry();
    emit();
  })();
  return hydrating;
}

export function setLowLight(next: boolean): void {
  // An explicit choice is a KNOWN value, whatever the last read did.
  readFailed = false;
  hydrated = true;
  if (on === next) {
    emit();
    return;
  }
  on = next;
  touchedAt = next ? Date.now() : 0;
  // The user's switch, refused by the device: told (owner 2026-10-03) — the
  // notice is shared and shows once for the pair. Never across the wipe.
  const gen = lowLightGen;
  const reportRefused = () => {
    if (gen === lowLightGen) reportUnhandledSaveFailure();
  };
  void AsyncStorage.setItem(KEY, next ? '1' : '0').catch(() => reportRefused());
  void AsyncStorage.setItem(KEY_AT, String(touchedAt)).catch(() => reportRefused());
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
  // Silent on purpose: the app's own "last touched" clock, not the user's change.
  void AsyncStorage.setItem(KEY_AT, String(touchedAt)).catch(() => {});
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

/* ---- activation notice: hold the wash until the user has read it ---------
 * The on-enable popup explains what the mode does. Dimming the screen (and the
 * popup) while it is still being READ makes the explanation hard to read and
 * commits the user before they have agreed — so the wash waits for PROCEED
 * (owner 2026-08-31). The mode itself is already ON during this window; only
 * the visual dim is deferred, so CANCEL simply turns the mode back off.
 */
let gatePending = false;

export function setLowLightGatePending(v: boolean): void {
  if (gatePending === v) return;
  gatePending = v;
  emit();
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

/**
 * Whether auto-appearing overlays must hold back for Low-Light: the mode is on,
 * OR its stored value could not be read (the user may have it on). Read by
 * `useOverlaysSuppressed`; the toggle row keeps `useLowLight`.
 */
export function useLowLightSuppresses(): boolean {
  const [snap, setSnap] = useState(on || readFailed);
  useEffect(() => {
    const l = () => setSnap(on || readFailed);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

/**
 * Whether the DIM WASH should be painted right now — which is not the same
 * question as whether the mode is on. Every LowLightDim reads this, so the
 * activation notice is legible and the screen darkens only once the user has
 * pressed PROCEED. The toggle row keeps using useLowLight(), so it shows ON
 * immediately.
 */
export function useLowLightDim(): boolean {
  const [snap, setSnap] = useState(on && !gatePending);
  useEffect(() => {
    const l = () => setSnap(on && !gatePending);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
