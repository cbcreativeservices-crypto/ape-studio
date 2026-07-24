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
