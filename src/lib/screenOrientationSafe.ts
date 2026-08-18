/**
 * Safe, optional access to expo-screen-orientation.
 *
 * The native module (`ExpoScreenOrientation`) is ABSENT on any dev client built
 * before the package was added. The JS wrapper calls `requireNativeModule` at
 * module-eval, so simply loading it throws SYNCHRONOUSLY. A dynamic
 * `import('expo-screen-orientation').catch()` does NOT reliably catch that
 * synchronous throw under Metro — on-device it surfaced as an uncaught error
 * ("Cannot find native module 'ExpoScreenOrientation'"). A `require` inside
 * try/catch DOES catch it. We require once, cache the result (null when the
 * native module is unavailable), and callers no-op safely until a build bundles
 * it. Every method call is additionally wrapped so a runtime rejection can't
 * bubble either.
 */
type ScreenOrientationModule = typeof import('expo-screen-orientation');

let cached: ScreenOrientationModule | null | undefined;

/** The expo-screen-orientation module, or null if its native module is absent. */
export function getScreenOrientation(): ScreenOrientationModule | null {
  if (cached !== undefined) return cached;
  try {
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
