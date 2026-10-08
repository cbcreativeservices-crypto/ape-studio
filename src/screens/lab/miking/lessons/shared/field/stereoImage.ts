/**
 * THE STEREO IMAGE READOUT (Lab 6 group 2; foley_perspective/
 * GEOMETRY_PROPOSAL.md §3–§4, field_ambience/GEOMETRY_PROPOSAL.md §7): where
 * a source tends to land between the speakers for a pair from Lab 5's
 * stereo-array tool (stereoArray.ts, unchanged). Pure; tested
 * (test/mikingLab6Field.test.ts). F05, F06, F08.
 *
 *   X/Y    LEVEL only: the two cardioids' gains at their arrival angles
 *          (polar.gain); the capsules are together, so no time difference
 *          and no comb in mono.
 *   M/S    decoded: L = (M + k·S)/√2, R = (M − k·S)/√2 (DPA-STEREO), the
 *          Side a figure-8 facing the array's LEFT (its signed gain), k the
 *          width set in the matrix; the mono sum L + R = √2·M — the Side
 *          cancels, the Mid remains.
 *   ORTF   LEVEL and TIME: the two cardioids' gains and distances, and the
 *   A/B    arrival-time difference between the capsules (stereoArray.dtLR);
 *          summed to mono, that time difference makes a comb whose first
 *          notch is at 1 / (2·|Δt|).
 *   MONO   one mic: no left or right at all.
 *
 * The IMAGE POSITION drawn from them is a SIMPLIFIED PICTURE: it adds the
 * level difference over FULL_SIDE_DB and the time difference over
 * FULL_SIDE_MS and clamps at the speakers (drawing defaults, logged as an
 * owner-review item — no source gives one mapping for every pair and room).
 * A real image depends on the speakers, the room and the listener; the
 * readouts it is drawn from (dB and ms) are the model's.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { gain } from '../../../engine/physics/polar.ts';
import { notchesHz } from '../../../engine/physics/twoMic.ts';
import { dtLR, type Capsule } from '../ensemble/stereoArray.ts';

/** The level difference (dB) drawn as a source fully at one speaker: a DRAWING DEFAULT. */
export const FULL_SIDE_DB = 15;
/** The time difference (ms) drawn as a source fully at one speaker: a DRAWING DEFAULT. */
export const FULL_SIDE_MS = 1.1;

export type ImageReading = {
  /** Each channel's level (dB, relative: 0 dB = one on-axis capsule at 1 m). */
  lDb: number;
  rDb: number;
  /** L − R (dB): + = louder on the left. */
  levelDiffDb: number;
  /** R − L arrival (ms): + = the right capsule hears it later (it leans left). */
  dtMs: number;
  /** −1 = at the left speaker … +1 = at the right speaker (the simplified picture). */
  pos: number;
  /** The mono sum's first comb notch (Hz), when the capsules are apart; null otherwise. */
  monoNotchHz: number | null;
  kind: 'level' | 'levelTime' | 'ms' | 'mono';
};

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const angleDeg = (a: Vec3, b: Vec3) => {
  const c = (a.x * b.x + a.y * b.y + a.z * b.z) / ((len(a) || 1) * (len(b) || 1));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
};
const db = (a: number) => 20 * Math.log10(Math.max(1e-6, Math.abs(a)));

/** One capsule's signed pickup of a point source (its pattern × 1/r, r in metres). */
export function capsuleAmp(c: Capsule, src: Vec3): number {
  const d = sub(src, c.p);
  const r = Math.max(1, len(d)) / 1000;
  return gain(c.pattern, angleDeg(c.dir, d)) / r;
}

/** The simplified image position from a level and a time difference. */
export function imagePos(levelDiffDb: number, dtMs: number): number {
  return Math.max(-1, Math.min(1, -levelDiffDb / FULL_SIDE_DB - dtMs / FULL_SIDE_MS));
}

/** The first notch of the mono sum for a time difference (Hz), or null. */
export function monoNotch(dtMs: number): number | null {
  if (Math.abs(dtMs) < 1e-4) return null;
  return notchesHz(dtMs, 1, 1e9, 1)[0] ?? null;
}

/**
 * The image of a source for an array's capsules. `sideDb`: the M/S width
 * (the Side's level against the Mid, dB). A single capsule routed to both
 * sides is MONO: no image at all (pos 0).
 */
export function imageOf(caps: readonly Capsule[], src: Vec3, opts: { sideDb?: number } = {}): ImageReading {
  const M = caps.find((c) => c.route === 'M');
  const S = caps.find((c) => c.route === 'S');
  if (M && S) {
    const k = Math.pow(10, (opts.sideDb ?? 0) / 20);
    const m = capsuleAmp(M, src);
    const s = capsuleAmp(S, src);
    const L = (m + k * s) / Math.SQRT2;
    const R = (m - k * s) / Math.SQRT2;
    const d = db(L) - db(R);
    return { lDb: db(L), rDb: db(R), levelDiffDb: d, dtMs: 0, pos: imagePos(d, 0), monoNotchHz: null, kind: 'ms' };
  }
  const Lc = caps.find((c) => c.route === 'L');
  const Rc = caps.find((c) => c.route === 'R');
  if (!Lc || !Rc) {
    const one = caps[0];
    const a = one ? db(capsuleAmp(one, src)) : -120;
    return { lDb: a, rDb: a, levelDiffDb: 0, dtMs: 0, pos: 0, monoNotchHz: null, kind: 'mono' };
  }
  const lDb = db(capsuleAmp(Lc, src));
  const rDb = db(capsuleAmp(Rc, src));
  const dt = dtLR(caps, src);
  const apart = len(sub(Lc.p, Rc.p)) > 60;
  const levelDiffDb = lDb - rDb;
  return { lDb, rDb, levelDiffDb, dtMs: apart ? dt : 0, pos: imagePos(levelDiffDb, apart ? dt : 0), monoNotchHz: apart ? monoNotch(dt) : null, kind: apart ? 'levelTime' : 'level' };
}

/** The mono sum in words, for a pair and the reading. */
export function monoWords(r: ImageReading): string {
  if (r.kind === 'mono') return 'One mic: mono already — no left or right to fold.';
  if (r.kind === 'ms') return 'Summed to mono the Side cancels and the Mid remains: the centre holds.';
  if (r.kind === 'level') return 'The capsules are together: summed to mono, no time difference and no comb.';
  const n = r.monoNotchHz;
  if (n == null) return 'Straight ahead the two arrive together: no comb in mono for this source.';
  return `Summed to mono, this source’s time difference puts the first notch near ${n >= 1000 ? `${(n / 1000).toFixed(1)} kHz` : `${Math.round(n)} Hz`} — listen for the low end and transients in mono.`;
}

/** Where the image sits, in a bezel's few letters. */
export function imageShort(pos: number): string {
  const a = Math.abs(pos);
  if (a < 0.08) return 'MIDDLE';
  const side = pos < 0 ? 'L' : 'R';
  return a >= 0.98 ? `AT ${side}` : a >= 0.55 ? `WELL ${side}` : `SLIGHT ${side}`;
}

/** Where the image sits, in words. */
export function imageWords(pos: number): string {
  const a = Math.abs(pos);
  if (a < 0.08) return 'in the middle';
  const side = pos < 0 ? 'left' : 'right';
  return a >= 0.98 ? `at the ${side} speaker` : a >= 0.55 ? `well to the ${side}` : `a little to the ${side}`;
}
