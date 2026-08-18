/**
 * Safe, optional access to expo-screen-orientation.
 *
 * The native module (`ExpoScreenOrientation`) is ABSENT on any dev client built
 * before the package was added, and the JS wrapper calls `requireNativeModule`
 * at module-eval — so even `require('expo-screen-orientation')` inside try/catch
 * proved unreliable under Metro/Hermes (it still surfaced "Cannot find native
 * module 'ExpoScreenOrientation'" and crashed at boot). The robust fix:
 * `requireOptionalNativeModule` returns null (NEVER throws) when the native side
 * is missing, so we probe with it FIRST and only require the JS wrapper when the
 * native module is actually present. Callers no-op safely until a build bundles
 * it. Every method call is additionally wrapped.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

type ScreenOrientationModule = typeof import('expo-screen-orientation');

let cached: ScreenOrientationModule | null | undefined;

/** The expo-screen-orientation module, or null if its native module is absent. */
export function getScreenOrientation(): ScreenOrientationModule | null {
  if (cached !== undefined) return cached;
  try {
    // Probe the NATIVE module without throwing; only load the JS wrapper if present.
    if (requireOptionalNativeModule('ExpoScreenOrientation') == null) {
      cached = null;
      return cached;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-screen-orientation') as ScreenOrientationModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** Lock the device to upright portrait. No-op (and never throws) when the native
 *  module is absent. */
export function lockPortrait(): void {
  const so = getScreenOrientation();
  if (!so) return;
  try {
    so.lockAsync(so.OrientationLock.PORTRAIT_UP).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Force landscape (either side). No-op (and never throws) when the native
 *  module is absent. */
export function lockLandscape(): void {
  const so = getScreenOrientation();
  if (!so) return;
  try {
    so.lockAsync(so.OrientationLock.LANDSCAPE).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Allow the device to rotate freely. No-op (and never throws) when the native
 *  module is absent. */
export function unlockOrientation(): void {
  const so = getScreenOrientation();
  if (!so) return;
  try {
    so.unlockAsync().catch(() => {});
  } catch {
    /* ignore */
  }
}
