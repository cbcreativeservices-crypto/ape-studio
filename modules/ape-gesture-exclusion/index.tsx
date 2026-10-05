/**
 * ape-gesture-exclusion — JS side of the Android system-gesture exclusion
 * module (2026-10-04; owner on a gesture-nav Pixel 7 Pro: grabbing a lab
 * fader at either end "wants to scroll (swipe gesture) to next screen").
 *
 * <GestureExclusionZone /> is a LEAF laid over a drag surface (absolute fill,
 * pointerEvents "none") inside the surface's own view. On Android 10+ the
 * native view asks the system to exclude its bounds from the back gesture
 * (View.setSystemGestureExclusionRects), so a drag that starts at the very
 * edge stays in the app.
 *
 * ⚠️ 200 dp PER EDGE: Android honours at most 200 dp of exclusion height per
 * screen edge. The native view clamps its rect to `maxHeightDp` (≤ 200,
 * centred), and a screen's zones must sum to ≤ 200 dp: the dock lane (48 dp)
 * plus a stage band (STAGE_BAND_DP = 140) = 188 dp.
 *
 * DEGRADES TO NOTHING: on iOS (the module is Android-only — the iOS edge
 * swipe-back is already off on every lab route), on web, and on every build
 * made before this module shipped (the current store builds), the native
 * module is absent and the zone renders null. The gate is
 * requireOptionalNativeModule, the house pattern (ape-dsp, ape-optical): it
 * returns null instead of throwing, and the view manager is only looked up
 * once the module is known to exist. Never crashes, never a red box.
 *
 * ⚠️ NATIVE: adding this module changes the Android runtime fingerprint; it
 * ships in the next build, not over the air.
 */
import { Platform, StyleSheet, type ViewProps } from 'react-native';
import { requireNativeViewManager, requireOptionalNativeModule } from 'expo-modules-core';
import type { ComponentType } from 'react';

/** The dock lane's exclusion height is its own (48 dp); a stage takes this
 *  band so lane + stage stay inside Android's 200 dp per-edge cap. */
export const STAGE_BAND_DP = 140;

type NativeProps = ViewProps & { active?: boolean; maxHeightDp?: number };

type ExclusionNative = { moduleVersion(): number };

const native: ExclusionNative | null = Platform.OS === 'android' ? requireOptionalNativeModule<ExclusionNative>('ApeGestureExclusion') : null;

let NativeZone: ComponentType<NativeProps> | null | undefined;
function nativeZone(): ComponentType<NativeProps> | null {
  if (NativeZone !== undefined) return NativeZone;
  if (!native) return (NativeZone = null);
  try {
    NativeZone = requireNativeViewManager<NativeProps>('ApeGestureExclusion');
  } catch {
    NativeZone = null;
  }
  return NativeZone;
}

/** True when this build carries the native module (Android 10+ only acts). */
export function isAvailable(): boolean {
  return nativeZone() != null;
}

export function moduleVersion(): number {
  try {
    return native ? native.moduleVersion() : 0;
  } catch {
    return 0;
  }
}

/**
 * Lay this inside a drag surface (any position: it fills its parent). It
 * excludes the parent's bounds — clamped to `maxHeightDp`, centred — from the
 * system back gesture while `active`.
 */
export function GestureExclusionZone({ active = true, maxHeightDp = 200 }: { active?: boolean; maxHeightDp?: number }) {
  const Zone = nativeZone();
  if (!Zone) return null;
  return <Zone pointerEvents="none" style={StyleSheet.absoluteFill} active={active} maxHeightDp={maxHeightDp} />;
}
