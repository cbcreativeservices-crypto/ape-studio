/**
 * popupSuppressStore — dev master kill-switch for ALL in-app popups/overlays
 * (screen intros, app welcome/commitment, learning intro sheets, coach marks).
 *
 * Toggled from the dev menu (DevVisualIndex → "Suppress all popups"). SEPARATE
 * from DEV_BYPASS.alwaysShowIntros: suppression WINS — when it's on, nothing
 * shows even if alwaysShowIntros is forcing intros on every entry.
 *
 * Tiny hand-rolled external store (same pattern as flaggedStore): module-level
 * boolean + listeners, hydrated once from AsyncStorage, persisted on change.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLowLight, useLowLight } from '../settings/lowLight';

const STORAGE_KEY = 'ape:devSuppressPopups';

let suppressed = false;
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) suppressed = raw === '1';
      } catch {
        // corrupt/absent → keep default (false)
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

// Kick off hydration on first import so the flag is warm before any popup asks.
void hydrate();

/** Current value (sync). Triggers hydration if it hasn't happened yet. */
export function arePopupsSuppressed(): boolean {
  void hydrate();
  return suppressed;
}

export function setPopupsSuppressed(v: boolean): void {
  if (suppressed === v) return;
  suppressed = v;
  void AsyncStorage.setItem(STORAGE_KEY, v ? '1' : '0');
  emit();
}

/** Live view — re-renders on any change (and once hydration completes). */
export function usePopupsSuppressed(): boolean {
  const [snap, setSnap] = useState<boolean>(suppressed);
  useEffect(() => {
    const l = () => setSnap(suppressed);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

// ---- Combined overlay suppression (owner 2026-08-01) ----------------------
// Overlays/popups must NOT auto-appear when EITHER the dev kill-switch is on OR
// Low-Light Production Mode is engaged (in production mode nothing may flash on
// screen). These are SEPARATE from the raw dev flag on purpose — the dev menu's
// toggle keeps reading `usePopupsSuppressed` so it shows its OWN state, while
// every auto-overlay reads these combined helpers.
export function areOverlaysSuppressed(): boolean {
  return arePopupsSuppressed() || getLowLight();
}

/** Live combined view — true when popups are dev-suppressed OR low-light
 *  production mode is on. */
export function useOverlaysSuppressed(): boolean {
  return usePopupsSuppressed() || useLowLight();
}
