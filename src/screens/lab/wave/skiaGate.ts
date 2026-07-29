/**
 * wave/skiaGate — availability gate for the Wave Physics Lab's Skia renderer.
 * Reuses the ONE probe in foundations/skiaGate; ONLY vizWave.tsx imports Skia,
 * loaded solely through requireWaveViz() so pre-Skia clients render the honest
 * card (§1.7) while readouts (pure waveEngine math) keep working.
 */
import { skiaAvailable } from '../foundations/skiaGate';

export { skiaAvailable };

export type WaveVizModule = typeof import('./vizWave');

export function requireWaveViz(): WaveVizModule | null {
  if (!skiaAvailable) return null;
  return require('./vizWave') as WaveVizModule;
}
