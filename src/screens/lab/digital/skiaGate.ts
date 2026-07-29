/**
 * digital/skiaGate — availability gates for the Digital Audio Sampling &
 * Conversion Lab's Skia visuals (owner spec 2026-07-29). Reuses the ONE probe
 * in foundations/skiaGate; ONLY the four viz modules below import Skia, each
 * loaded solely through its inline-require gate so pre-Skia clients never
 * touch them and render the honest card (§1.7).
 *
 * One viz module per module-pair (same split as the module files):
 *   vizSignal — Module 1 Analog Signal + Module 2 Sampling/Aliasing
 *   vizQuant  — Module 3 Quantization/Dither + Module 4 Binary
 *   vizChain  — Module 5 ADC chain + Module 6 Processing/Float
 *   vizDac    — Module 7 Reconstruction/ISP + Module 8 Errors
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

export type VizSignalModule = typeof import('./vizSignal');
export type VizQuantModule = typeof import('./vizQuant');
export type VizChainModule = typeof import('./vizChain');
export type VizDacModule = typeof import('./vizDac');

export function requireVizSignal(): VizSignalModule | null {
  if (!skiaAvailable) return null;
  return require('./vizSignal') as VizSignalModule;
}
export function requireVizQuant(): VizQuantModule | null {
  if (!skiaAvailable) return null;
  return require('./vizQuant') as VizQuantModule;
}
export function requireVizChain(): VizChainModule | null {
  if (!skiaAvailable) return null;
  return require('./vizChain') as VizChainModule;
}
export function requireVizDac(): VizDacModule | null {
  if (!skiaAvailable) return null;
  return require('./vizDac') as VizDacModule;
}
