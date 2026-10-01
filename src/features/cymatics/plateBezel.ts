/**
 * plateBezel — the Chladni studio's bezel words, sized for a 390-pt phone
 * (TestFlight build 32 pass, "make sure all of the controls actually show up
 * visibly"). The bezel strip is ~335 pt for four cells; the full mode labels
 * ("(4,0) + (0,4)", "2 diameters · 1 circle", "10 nodal lines") and the word
 * APPROACHING were cut to an ellipsis on the default plate. The full words
 * stay in the well caption under the display; the bezel carries the compact
 * form. BezelReadouts' own fit rule (mono 13.5 pt ≈ 0.6 em, 16 pt padding)
 * decides the rest, so the same numbers are pinned in the test.
 */
import type { ResonanceState } from './plateModes';

/** Mode label for the bezel: same mode, fewest characters. A disc mode
 *  becomes the standard (diameters, circles) pair — Rossing's (m, n). */
export function bezelModeLabel(label: string): string {
  const disc = label.match(/^(\d+) diameters? · (\d+) circles?$/);
  if (disc) return `(${disc[1]},${disc[2]})`;
  const lines = label.match(/^(\d+) nodal lines?$/);
  if (lines) return `${lines[1]} line${lines[1] === '1' ? '' : 's'}`;
  return label.replace(/\s*([+−-])\s*/g, '$1');
}

/** Resonance state word for the bezel. APPROACHING (11 characters) is the
 *  one word that cannot fit a quarter of the strip; NEAR says the same. */
export const BEZEL_RES_WORD: Record<ResonanceState, string> = {
  below: 'BELOW',
  approaching: 'NEAR',
  at: 'AT',
  between: 'BETWEEN',
};

/** Cell weights: DRIVE · RESPONSE · MODE · RES. Flex shares only the space
 *  left after each cell's 16 pt padding (+ 1 pt divider), so the weights are
 *  the inner widths the longest values need at 390 wide: "1.00 kHz" 65 ·
 *  the RESPONSE key 55 · "(4,0)+(0,4)" 89 · BETWEEN 57 (of 267 pt). */
export const PLATE_BEZEL_FLEX = { drive: 1, response: 0.854, mode: 1.377, res: 0.877 } as const;
