/**
 * meter/skiaGate — availability gates for the Visual Audio Analysis Lab's two
 * Skia renderers (owner spec 2026-07-29: HIGHEST-RESOLUTION displays — the
 * waterfall and the classic VU face are the flagship visuals). Reuses the ONE
 * probe in foundations/skiaGate; ONLY vizMeters/vizSpectral import Skia, each
 * loaded solely through its inline-require gate (§1.7 honest fallback).
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

export type VizMetersModule = typeof import('./vizMeters');
export type VizSpectralModule = typeof import('./vizSpectral');

export function requireVizMeters(): VizMetersModule | null {
  if (!skiaAvailable) return null;
  return require('./vizMeters') as VizMetersModule;
}
export function requireVizSpectral(): VizSpectralModule | null {
  if (!skiaAvailable) return null;
  return require('./vizSpectral') as VizSpectralModule;
}
