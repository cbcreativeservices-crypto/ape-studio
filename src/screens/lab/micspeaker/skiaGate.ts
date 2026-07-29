/**
 * micspeaker/skiaGate — availability gate for the Mic & Speaker labs' Skia
 * visuals (owner 2026-07-29). Reuses the ONE probe in foundations/skiaGate
 * (probing twice is pointless — same native lib); only ./viz imports Skia,
 * and it is ONLY loaded through requireMsViz() (inline-require, evaluated on
 * first call), so pre-Skia clients never touch it and render the honest
 * "needs the new dev build" card instead (§1.7).
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

/** The mic/speaker Skia viz module, or null on pre-Skia clients. Typed via
 *  `typeof import` (erased at runtime — never triggers an eager load). */
export type MsVizModule = typeof import('./viz');

export function requireMsViz(): MsVizModule | null {
  if (!skiaAvailable) return null;
  return require('./viz') as MsVizModule;
}
