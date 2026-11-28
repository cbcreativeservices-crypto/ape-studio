/**
 * The Bias section's transfer curve and zone word (Vacuum Tube Lab › Bias),
 * pure so a node test can run them (owner 2026-11-25, audit B7).
 *
 * The curve was a soft tanh that never reached zero or full current, so the
 * "CUTOFF: the bottom of the swing flatlines" word flipped at 22 % while the
 * drawn wave only squashed. A real tube CUTS OFF: below the cutoff grid
 * voltage no plate current flows at all, and at the top the current stops
 * rising (saturation). The curve keeps its old tanh middle (rescaled by
 * under 5 %) and now has those two hard ends, placed so the word and the
 * wave agree: the ZONE reads CUTOFF exactly when the bottom of the ±DRIVE
 * swing dips past cutoff (a flat stretch at zero current appears in the
 * output wave), SATURATION exactly when the top passes saturation (a flat
 * top), and CORRECT while neither end is flat. The thresholds stay 22 % and
 * 80 %, as before.
 */
/** The input swing around the operating point (grid drive, 0..1 units). */
export const TUBE_BIAS_DRIVE = 0.15;
/** Grid drive below which no plate current flows. */
export const TUBE_V_CUTOFF = 0.07;
/** Grid drive above which the plate current is at its ceiling. */
export const TUBE_V_SAT = 0.95;

/** Normalized transfer curve: grid drive 0..1 → plate current 0..1, exactly
 *  0 at and below cutoff, exactly 1 at and above saturation. Worklet-safe
 *  (the literals are the constants above). */
export function plateCurrent01(v01: number): number {
  'worklet';
  const v = v01 < 0.07 ? 0.07 : v01 > 0.95 ? 0.95 : v01;
  const t0 = Math.tanh(4.2 * (0.07 - 0.52));
  const t1 = Math.tanh(4.2 * (0.95 - 0.52));
  return (Math.tanh(4.2 * (v - 0.52)) - t0) / (t1 - t0);
}

export type BiasZone = 'cutoff' | 'linear' | 'saturation';

/** The zone word for an operating point: where the swing's ends land. */
export function biasZone(b: number): BiasZone {
  // 1e-9: float sums (0.8 + 0.15) must not move the 22 % / 80 % edges.
  if (b - TUBE_BIAS_DRIVE < TUBE_V_CUTOFF - 1e-9) return 'cutoff';
  if (b + TUBE_BIAS_DRIVE > TUBE_V_SAT + 1e-9) return 'saturation';
  return 'linear';
}
