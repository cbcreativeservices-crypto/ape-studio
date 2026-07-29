/**
 * tube/skiaGate — availability gate for the Vacuum Tube lab's Skia visuals
 * (owner 2026-07-29). Reuses the ONE probe in foundations/skiaGate; only
 * ./viz imports Skia, loaded solely through requireTubeViz() (inline-require)
 * so pre-Skia clients never touch it and render the honest card (§1.7).
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

export type TubeVizModule = typeof import('./viz');

export function requireTubeViz(): TubeVizModule | null {
  if (!skiaAvailable) return null;
  return require('./viz') as TubeVizModule;
}
