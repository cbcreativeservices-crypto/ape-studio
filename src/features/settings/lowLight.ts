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

/** Fraction of black laid over the app when ON (100% − 25% brightness). */
export const LOW_LIGHT_DIM = 0.75;

let on = false;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getLowLight(): boolean {
  return on;
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    on = raw === '1';
  } catch {
    // absent/corrupt → stays off
  }
  hydrated = true;
  emit();
}

export function setLowLight(next: boolean): void {
  if (on === next) return;
  on = next;
  void AsyncStorage.setItem(KEY, next ? '1' : '0');
  emit();
}

export function toggleLowLight(): void {
  setLowLight(!on);
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
