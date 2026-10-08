/**
 * DOWNMIX, M/S WIDTH AND THE DELIVERY CARD — Lab 7 part 2, group 3
 * (lab7-g6; docs/labs/miking/crowd_complete/GEOMETRY_PROPOSAL.md §2, §4).
 * Pure; tested (test/mikingLab7SportsG3.test.ts). Every number here is a
 * LABELLED EXAMPLE on screen ("use your broadcaster's"):
 *
 *   • the practice mono trial M = (L + R) / 2 (B17 L181): a source in the
 *     centre keeps its level, a source in one channel only drops 6 dB, an
 *     uncorrelated diffuse bed (applause) about 3 dB — why the mono check is
 *     a listening check, not a formula;
 *   • the 3/2 → stereo example L′ = L + 0.7071 C + 0.7071 LS (B17 L182, the
 *     standard −3 dB coefficient; the recommendation itself is internal);
 *   • the M/S matrix L = M + kS, R = M − kS, so (L + R) / 2 = M whatever k
 *     is (B17 L102 — algebra): Mid a forward cardioid, Side a figure-8 whose
 *     positive lobe faces LEFT;
 *   • ONE delivery card: −23 LUFS integrated, ±1 LU where live work makes the
 *     target impractical, −1 dBTP maximum true peak (B17 L185; Medium) — one
 *     delivery specification, "use your broadcaster's"; input peaks (dBFS at
 *     a converter) are kept apart from program loudness (LUFS).
 */
import { gain } from '../../../engine/physics/polar.ts';
import { DEG } from './venuePlan.ts';

/** The standard −3 dB downmix coefficient (√½). */
export const ITU_K = 0.7071;
export const DELIVERY = { lufs: -23, liveLu: 1, dBTP: -1 } as const;

const db = (x: number): number => 20 * Math.log10(Math.max(1e-9, Math.abs(x)));

/** A source heard in L and R with linear gains gL, gR: its level in the
 *  mono sum M = (L+R)/2, against its level in the louder channel (dB).
 *  `correlated` false: a diffuse bed (the two channels add in power). */
export function monoChangeDb(gL: number, gR: number, correlated = true): number {
  const ref = Math.max(Math.abs(gL), Math.abs(gR));
  const m = correlated ? (gL + gR) / 2 : Math.sqrt(gL * gL + gR * gR) / 2;
  return db(m) - db(ref);
}

/** 3/2 → stereo, the example coefficients: one channel's share in L′ (dB). */
export const downmixShareDb = (k = ITU_K): number => db(k);

/* ── M/S ── */

/** Mid (a forward cardioid) and Side (a figure-8, + lobe to the LEFT) for a
 *  source θ degrees off the front (+ = left), in the horizontal plane. */
export function msPick(thetaDeg: number): { M: number; S: number } {
  return { M: gain('cardioid', thetaDeg), S: Math.sin(thetaDeg * DEG) };
}
/** The decoded channels at width k: L = M + kS, R = M − kS. */
export function msDecode(thetaDeg: number, k: number): { L: number; R: number; mono: number } {
  const { M, S } = msPick(thetaDeg);
  const L = M + k * S;
  const R = M - k * S;
  return { L, R, mono: (L + R) / 2 };
}
/** How much louder the source is in L than in R (dB; + = left). */
export function msBalanceDb(thetaDeg: number, k: number): number {
  const { L, R } = msDecode(thetaDeg, k);
  return db(L) - db(R);
}
/** The Side level against the Mid that a width k means (dB). */
export const sideDb = (k: number): number => (k <= 0 ? -Infinity : 20 * Math.log10(k));
/** The width steps the panel offers (k). */
export const K_STEPS = [0, 0.25, 0.5, 0.75, 1, 1.5] as const;

/* ── the downmix demo: three sources, two formats ── */

export type MonoSource = { id: string; label: string; short: string; gL: number; gR: number; correlated: boolean };
export const MONO_SOURCES: readonly MonoSource[] = [
  { id: 'centre', label: 'Speech in the centre (equal in L and R)', short: 'CENTRE', gL: 1, gR: 1, correlated: true },
  { id: 'side', label: 'A cheer in the left channel only', short: 'ONE SIDE', gL: 1, gR: 0, correlated: true },
  { id: 'diffuse', label: 'Diffuse applause (different in L and R)', short: 'DIFFUSE', gL: 1, gR: 1, correlated: false },
];
