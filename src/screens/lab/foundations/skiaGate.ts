/**
 * skiaGate — availability probe for @shopify/react-native-skia (Foundations of
 * Sound, owner 2026-07-26). Skia is a NATIVE module: clients built before it
 * was added (≤ v7 build 958ed016) don't have the native lib, and importing it
 * there throws. The probe try/requires ONCE; screens gate on `skiaAvailable`
 * and lazy-require the viz module only when true — pre-Skia clients render the
 * honest "needs the new dev build" card instead (§1.7: degrade, never crash,
 * never simulate).
 *
 * IMPORTANT: only viz.tsx imports '@shopify/react-native-skia' directly, and
 * viz.tsx is ONLY loaded via requireViz() below (inline-require — evaluated on
 * first call, never at bundle eval), so no import path touches Skia before the
 * probe has passed.
 */

let available = false;
try {
  // Probe: throws on clients without the native lib.
  require('@shopify/react-native-skia');
  available = true;
} catch {
  available = false;
}

export const skiaAvailable = available;

/** The Skia viz module, or null on pre-Skia clients. Typed via `typeof import`
 *  (erased at runtime — never triggers an eager load). */
export type VizModule = typeof import('./viz');

export function requireViz(): VizModule | null {
  if (!available) return null;
  return require('./viz') as VizModule;
}
