/**
 * ape-age-signal — the store's age signal, for the Texas App Store
 * Accountability Act (SB 2420) age gates (owner go 2026-11-27, 1.0.1).
 *
 * iOS: Apple's Declared Age Range framework (AgeRangeService). Android: the
 * Google Play Age Signals API (com.google.android.play:age-signals). Both
 * native halves answer with a small plain map (the RAW answer); the mapping
 * to adult / teen / child / unknown is pure JS in
 * src/features/age/storeAgeMap.ts so every case is unit-tested.
 *
 * Gate contract (as ape-optical / ape-dsp): `isAvailable()` is FALSE on web,
 * in Expo Go and on every binary built before this module shipped. The app
 * then reads 'unknown', which keeps today's self-confirmation exactly.
 *
 * ⚠️ NATIVE: this module changes the native fingerprint. It ships only in a
 * store build, never in an OTA update.
 *
 * PRIVACY (Sec. 121.055): the native halves ask only for the age RANGE, never
 * the install id, and return nothing else. Nothing here writes to storage or
 * the network. The JS side keeps the band in memory for the session only.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

type AgeSignalNative = {
  moduleVersion(): number;
  /** Resolves (never rejects) with the platform's raw answer. */
  requestAgeSignal(): Promise<Record<string, unknown>>;
};

const native = requireOptionalNativeModule<AgeSignalNative>('ApeAgeSignal');

export function isAvailable(): boolean {
  return native != null;
}

export function moduleVersion(): number {
  return native ? native.moduleVersion() : 0;
}

/** The raw answer, or null when the module is not in this binary. */
export async function requestAgeSignal(): Promise<Record<string, unknown> | null> {
  if (!native) return null;
  return native.requestAgeSignal();
}
