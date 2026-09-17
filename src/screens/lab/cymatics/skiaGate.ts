/**
 * cymatics/skiaGate — the lab's Skia availability gate (foundations idiom):
 * ONLY the viz*.tsx files import '@shopify/react-native-skia', and each is
 * loaded solely through its requireViz*() so a pre-Skia client renders the honest
 * "needs the new build" card instead of crashing (§1.7).
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

export type VizPlateModule = typeof import('./vizPlate');
export type VizLiquidModule = typeof import('./vizLiquid');
export type VizMembraneModule = typeof import('./vizMembrane');

export function requireVizPlate(): VizPlateModule | null {
  if (!skiaAvailable) return null;
  return require('./vizPlate') as VizPlateModule;
}
export function requireVizLiquid(): VizLiquidModule | null {
  if (!skiaAvailable) return null;
  return require('./vizLiquid') as VizLiquidModule;
}
export function requireVizMembrane(): VizMembraneModule | null {
  if (!skiaAvailable) return null;
  return require('./vizMembrane') as VizMembraneModule;
}
