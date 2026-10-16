/**
 * The Modular Synth Lab's spectrum math (lab-art fix 2026-10-16) — pure, so
 * the node tests pin it against the engine (modules/ape-dsp/ios/core/Modular.hpp).
 */

/** Harmonic n's amplitude for the VCO shape (0 saw · 1 square · 2 triangle ·
 *  3 sine), fundamental = 1 — the textbook Fourier series of each wave. */
export function harmonicAmp(shape: number, n: number): number {
  if (shape === 3) return n === 1 ? 1 : 0;
  if (shape === 0) return 1 / n;
  if (n % 2 === 0) return 0;
  return shape === 1 ? 1 / n : 1 / (n * n);
}

/** The engine's 2-pole state-variable low-pass at f (the analog prototype of
 *  its ZDF filter): damping k = 2 − 1.6·res, |H| = 1/√((1 − x²)² + (k·x)²),
 *  x = f / cutoff. At the cutoff |H| = 1/k: −6 dB with no resonance, +8 dB at max. */
export function svfLowpassMag(f: number, cutoff: number, res: number): number {
  const x = f / cutoff;
  const k = 2 - 1.6 * Math.max(0, Math.min(1, res));
  return 1 / Math.sqrt((1 - x * x) ** 2 + (k * x) ** 2);
}
