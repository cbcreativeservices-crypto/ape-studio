/**
 * cymatics/liquidMotion — how the Liquid Studio's drawn surface moves, kept
 * pure (worklet-safe) so node tests run it as written (fix-next CYM, audit
 * rows 12 and 14). vizLiquid.tsx draws with these; nothing here is React.
 */
import type { Stage } from './faraday';

export const STAGE_CODE: Record<Stage, number> = { flat: 0, damped: 0, sloshing: 1, ripples: 1, onset: 2, stable: 2, transition: 3, mixed: 4, unstable: 5, chaotic: 6, splash: 7 };

/** Stage → (wA, wB) blend weights at strobed response phase t and raw time tr. */
export function weightsW(stage: number, blend: number, t: number, tr: number): [number, number] {
  'worklet';
  const w = Math.cos(2 * Math.PI * t);
  if (stage <= 2) return [w, 0];
  if (stage === 3) return [w * (1 - blend), w * blend];
  if (stage === 4) {
    const b = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.18 * tr);
    return [w * (1 - b), w * b];
  }
  if (stage === 5) return [Math.cos(2 * Math.PI * t), Math.sin(2 * Math.PI * t)];
  return [w * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.7 * tr)), Math.cos(2 * Math.PI * t + 1.2) * (0.6 + 0.4 * Math.cos(2 * Math.PI * 0.9 * tr))];
}

/**
 * The surface's phase, in its own cycles, from the strobed clock (counted in
 * HALF-drive cycles: the platform bobs at 2 × clock). Above the Faraday
 * threshold the surface answers at HALF the drive, so it runs at the clock;
 * below it (flat, sloshing, edge ripples: `subharmonic` false) it rides the
 * platform at the DRIVE rate, twice the clock, as RESP's "f" says (audit row
 * 12: it used to move at half the platform rate there too).
 */
export function surfaceCycles(clockCycles: number, subharmonic: boolean): number {
  'worklet';
  return subharmonic ? clockCycles : 2 * clockCycles;
}

/**
 * How strongly the CONTOURS view draws its lines, 0..1, from the standing-wave
 * envelope (audit row 14): the contours are normalised so every ring reaches
 * its level, which made them draw at full strength at any SHAKE. Faded by the
 * same envelope the 3D relief uses, a still surface draws no lines and a
 * full pattern draws them solid. (0.55 is the 3D view's own full-relief point.)
 */
export function contourOpacity(envelope: number): number {
  const e = envelope !== envelope ? 0 : envelope;
  return Math.max(0, Math.min(1, e / 0.55));
}

/** The field the CONTOURS trace: the drawn surface at its crest (A and B blended by the stage, as the image is). */
export function crestField(gridA: Float32Array, gridB: Float32Array, stage: number, blend: number): Float32Array {
  const [wA, wB] = weightsW(stage, blend, 0, 0);
  if (wB === 0 && wA === 1) return gridA;
  const out = new Float32Array(gridA.length);
  for (let i = 0; i < gridA.length; i++) {
    const a = gridA[i];
    const b = gridB[i];
    out[i] = a !== a ? NaN : wA * a + wB * (b !== b ? 0 : b);
  }
  return out;
}
