/**
 * cymatics/skiaGate — the lab's Skia availability gate (foundations idiom):
 * ONLY vizPlate.tsx imports '@shopify/react-native-skia', and it is loaded
 * solely through requireVizPlate() so a pre-Skia client renders the honest
 * "needs the new build" card instead of crashing (§1.7).
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

export type VizPlateModule = typeof import('./vizPlate');

export function requireVizPlate(): VizPlateModule | null {
  if (!skiaAvailable) return null;
  return require('./vizPlate') as VizPlateModule;
}
