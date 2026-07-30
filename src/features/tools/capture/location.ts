/**
 * location — GPS backend for the Measurement Snapshot (owner 2026-07-29), via
 * the official `expo-location` accessed through the optional-require gate so
 * the app compiles/bundles before the package is installed + a new build ships.
 *
 * Honesty: `isAvailable()` is false until expo-location is installed AND the
 * native module is in the running build — callers keep the "coming with a
 * future release" state until then, never crash.
 */
import { optionalModule } from './optionalModule';

type LocationLib = {
  requestForegroundPermissionsAsync(): Promise<{ status: string; canAskAgain?: boolean }>;
  getForegroundPermissionsAsync(): Promise<{ status: string; canAskAgain?: boolean }>;
  getCurrentPositionAsync(opts?: { accuracy?: number }): Promise<{
    coords: { latitude: number; longitude: number; accuracy: number | null; altitude: number | null };
    timestamp: number;
  }>;
  Accuracy?: { Balanced?: number; High?: number };
};

let cached: LocationLib | null | undefined;
function lib(): LocationLib | null {
  if (cached === undefined) cached = optionalModule<LocationLib>('expo-location');
  return cached;
}

export type GeoFix = { latitude: number; longitude: number; accuracyM: number | null; timestamp: number };

export function isAvailable(): boolean {
  return lib() != null;
}

/** Request the OS foreground-location permission. Maps to the app's flow
 *  result vocabulary ('granted' | 'denied' | 'blocked'). */
export async function requestPermission(): Promise<'granted' | 'denied' | 'blocked'> {
  const L = lib();
  if (!L) return 'blocked';
  const res = await L.requestForegroundPermissionsAsync();
  if (res.status === 'granted') return 'granted';
  return res.canAskAgain === false ? 'blocked' : 'denied';
}

export async function currentStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const L = lib();
  if (!L) return 'undetermined';
  const res = await L.getForegroundPermissionsAsync();
  return res.status === 'granted' ? 'granted' : res.status === 'denied' ? 'denied' : 'undetermined';
}

/** Read a single fix. Assumes permission already granted (call the flow first).
 *  Returns null if unavailable or the read fails. */
export async function getFix(): Promise<GeoFix | null> {
  const L = lib();
  if (!L) return null;
  try {
    const pos = await L.getCurrentPositionAsync({ accuracy: L.Accuracy?.Balanced });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracyM: pos.coords.accuracy,
      timestamp: pos.timestamp,
    };
  } catch {
    return null;
  }
}
