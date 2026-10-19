/**
 * djStems — the decks' STEMS (Stage 2, Screen 15; research DJ20). Pure
 * TypeScript; pinned by test/djStage2Stems.test.ts.
 *
 * ORIGINAL STEMS. This lab's music is BUILT from four parts (engine/djMusic:
 * drums, bass, chords, lead — called MELODY here), so a deck can play from
 * the real parts: ORIGINAL STEMS, exactly the multitrack. All four at full
 * level sum to the track itself: Night Ferry bit for bit (its master is
 * linear), Glass Harbour through the same master stage (its soft clip runs on
 * the sum). They are never called the output of a separation algorithm.
 *
 * SEPARATED (SIMULATED). A real stem separator has only the finished mix and
 * must GUESS which part each sound belongs to; where parts overlap in
 * frequency and time it guesses wrong — LEAKAGE (a ghost of the melody left
 * in the chords, hi-hats in the melody stem, kick in the bass) and ARTIFACTS
 * (a watery, warbling edge as the guess changes from moment to moment). The
 * lab IMITATES that, labelled as a simulation: each part is split at 200 Hz
 * (a complementary low-pass / high-pass pair, which sums back exactly), and
 * each band is shared between the four output stems by a fixed LEAKAGE
 * MATRIX whose columns sum to 1 — plus a random wobble of the melody's own
 * share every 21 ms (the artifact). Because every column sums to 1, the four
 * separated stems still add up to the whole track; muting one leaves its
 * ghost behind and takes a little of the others with it. This is a prepared
 * imitation of typical errors, NOT a separation algorithm.
 */
import { SR, biquadInPlace, bqState, rng } from './djDsp.ts';
import { rbj } from '../../../../features/ear/earDsp.ts';
import { STEM_IDS, assembleRaw, masterCurve, rawPeakOf, trackSeconds, type StemId, type StereoBuf, type TrackId } from './djMusic.ts';
import type { StemGains } from '../model/djModel.ts';

export const STEM_WORDS: Record<StemId, string> = { drums: 'DRUMS', bass: 'BASS', chords: 'CHORDS', lead: 'MELODY' };
export const ALL_STEMS: StemGains = { drums: 1, bass: 1, chords: 1, lead: 1 };
export const STEM_SPLIT_HZ = 200;

/** Leakage matrices [output stem][source stem], each column summing to 1 —
 *  the LOW band (below 200 Hz) and the HIGH band. Order: drums, bass,
 *  chords, lead (MELODY). */
export const LEAK_LOW: readonly (readonly number[])[] = [
  [0.82, 0.12, 0.02, 0.0],
  [0.16, 0.86, 0.18, 0.02],
  [0.01, 0.02, 0.78, 0.08],
  [0.01, 0.0, 0.02, 0.9],
];
export const LEAK_HIGH: readonly (readonly number[])[] = [
  [0.86, 0.03, 0.03, 0.02],
  [0.01, 0.85, 0.02, 0.01],
  [0.05, 0.1, 0.8, 0.11],
  [0.08, 0.02, 0.15, 0.86],
];
/** The melody's own share wobbles by up to this much (the artifact). */
export const WOBBLE = 0.08;
export const WOBBLE_BLOCK = 1024;

/** The melody's share of itself in block `blk` (deterministic per track
 *  time, so it is continuous across chunks). */
export function leadShareAt(blk: number, band: 'low' | 'high'): number {
  const base = band === 'low' ? LEAK_LOW[3][3] : LEAK_HIGH[3][3];
  const r = rng((0x5eed + Math.imul(blk, 2654435761)) >>> 0)();
  return Math.max(0.5, Math.min(0.98, base + WOBBLE * (r * 2 - 1)));
}

/** The matrix for one block: the melody column's own share wobbles and the
 *  difference goes to (or comes from) the chords, so the column still sums to 1. */
export function matrixAt(blk: number, band: 'low' | 'high'): number[][] {
  const M = (band === 'low' ? LEAK_LOW : LEAK_HIGH).map((r) => r.slice());
  const s = leadShareAt(blk, band);
  const d = s - M[3][3];
  M[3][3] = s;
  M[2][3] -= d;
  return M;
}

const LP = rbj(STEM_SPLIT_HZ, Math.SQRT1_2, 0, 'lowpass');

/** The four SIMULATED separated stems (pre-master) from the four true parts. */
export function separateAll(raw: Record<StemId, StereoBuf>, t0: number, n: number): Record<StemId, StereoBuf> {
  const bands = STEM_IDS.map((s) => {
    const b = raw[s];
    const lowL = b.l.slice();
    const lowR = b.r.slice();
    biquadInPlace(lowL, LP, bqState());
    biquadInPlace(lowR, LP, bqState());
    const hiL = new Float32Array(n);
    const hiR = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      hiL[i] = b.l[i] - lowL[i];
      hiR[i] = b.r[i] - lowR[i];
    }
    return { lowL, lowR, hiL, hiR };
  });
  const out = Object.fromEntries(STEM_IDS.map((s) => [s, { l: new Float32Array(n), r: new Float32Array(n) }])) as Record<StemId, StereoBuf>;
  const base = Math.round(t0 * SR);
  for (let i0 = 0; i0 < n; ) {
    const blk = Math.floor((base + i0) / WOBBLE_BLOCK);
    const i1 = Math.min(n, (blk + 1) * WOBBLE_BLOCK - base);
    const ML = matrixAt(blk, 'low');
    const MH = matrixAt(blk, 'high');
    STEM_IDS.forEach((so, i) => {
      const o = out[so];
      for (let j = 0; j < 4; j++) {
        const kl = ML[i][j];
        const kh = MH[i][j];
        if (kl === 0 && kh === 0) continue;
        const bj = bands[j];
        for (let x = i0; x < i1; x++) {
          o.l[x] += bj.lowL[x] * kl + bj.hiL[x] * kh;
          o.r[x] += bj.lowR[x] * kl + bj.hiR[x] * kh;
        }
      }
    });
    i0 = Math.max(i1, i0 + 1);
  }
  return out;
}

/** The melody's GHOST (dB re the melody alone) in a separated mix with these
 *  gains: Σ_i g_i·M_i,melody, averaged over the bands and the blocks. */
export function melodyGhostDb(gains: StemGains, t0: number, n: number): number {
  const g = STEM_IDS.map((s) => gains[s]);
  const base = Math.round(t0 * SR);
  let s = 0;
  let c = 0;
  for (let blk = Math.floor(base / WOBBLE_BLOCK); blk * WOBBLE_BLOCK < base + n; blk++) {
    const ML = matrixAt(blk, 'low');
    const MH = matrixAt(blk, 'high');
    const lo = g.reduce((a, gi, i) => a + gi * ML[i][3], 0);
    const hi = g.reduce((a, gi, i) => a + gi * MH[i][3], 0);
    s += (lo + hi) / 2;
    c++;
  }
  return 20 * Math.log10(Math.max(1e-6, s / Math.max(1, c)));
}

/**
 * Track time [t0, t0 + n/SR) of `id` at the native rate, played from its
 * stems with `gains` — ORIGINAL or the SIMULATED separation — through the
 * track's own master stage.
 */
export function stemWindow(id: TrackId, t0: number, n: number, gains: StemGains, source: 'ORIGINAL' | 'SEPARATED'): StereoBuf {
  const raw = assembleRaw(id, t0, n, true).stems!;
  const parts = source === 'ORIGINAL' ? raw : separateAll(raw, t0, n);
  const f = masterCurve(id, rawPeakOf(id) ?? 1);
  const sum = { l: new Float32Array(n), r: new Float32Array(n) };
  for (const s of STEM_IDS) {
    const g = gains[s];
    if (g === 0) continue;
    const b = parts[s];
    for (let i = 0; i < n; i++) {
      sum.l[i] += b.l[i] * g;
      sum.r[i] += b.r[i] * g;
    }
  }
  for (let i = 0; i < n; i++) {
    sum.l[i] = f(sum.l[i]);
    sum.r[i] = f(sum.r[i]);
  }
  return sum;
}

/* ── stem overviews (the lanes: real min/max of each part) ────────────── */

/** `rms` (ADDITIVE, visual review 2 #8): each column's RMS, so a stem lane
 *  draws the house waveform stack — peak envelope over an RMS core. */
export type StemOverview = { colSec: number; hi: Record<StemId, Float32Array>; lo: Record<StemId, Float32Array>; rms: Record<StemId, Float32Array>; seconds: number };
export const STEM_COLS_PER_SEC = 32;
const overviewCache = new Map<string, StemOverview>();

/**
 * Each part's min/max per column across the whole track (mono fold, at the
 * master's linear gain) — ORIGINAL, or the SIMULATED separation's four output
 * stems. `breath` keeps a phone's JS thread free between chunks.
 */
export async function stemOverview(id: TrackId, source: 'ORIGINAL' | 'SEPARATED', breath?: () => Promise<void>): Promise<StemOverview> {
  const key = `${id}:${source}`;
  const hit = overviewCache.get(key);
  if (hit) return hit;
  const total = trackSeconds(id);
  const cols = Math.ceil(total * STEM_COLS_PER_SEC);
  const hi = Object.fromEntries(STEM_IDS.map((s) => [s, new Float32Array(cols)])) as Record<StemId, Float32Array>;
  const lo = Object.fromEntries(STEM_IDS.map((s) => [s, new Float32Array(cols)])) as Record<StemId, Float32Array>;
  const sq = Object.fromEntries(STEM_IDS.map((s) => [s, new Float64Array(cols)])) as Record<StemId, Float64Array>;
  const cnt = new Float64Array(cols);
  const f = masterCurve(id, rawPeakOf(id) ?? 1);
  const lin = f(1e-4) / 1e-4;
  const chunk = 2;
  const perCol = SR / STEM_COLS_PER_SEC;
  for (let t0 = 0; t0 < total; t0 += chunk) {
    const n = Math.min(Math.round(chunk * SR), Math.round((total - t0) * SR));
    if (n <= 0) break;
    const raw = assembleRaw(id, t0, n, true).stems!;
    const parts = source === 'ORIGINAL' ? raw : separateAll(raw, t0, n);
    const base = Math.round(t0 * SR);
    for (let i = 0; i < n; i++) cnt[Math.min(cols - 1, Math.floor((base + i) / perCol))] += 1;
    for (const s of STEM_IDS) {
      const buf = parts[s];
      const H = hi[s];
      const L = lo[s];
      const Q = sq[s];
      for (let i = 0; i < n; i++) {
        const m = ((buf.l[i] + buf.r[i]) / 2) * lin;
        const c = Math.min(cols - 1, Math.floor((base + i) / perCol));
        if (m > H[c]) H[c] = m;
        if (m < L[c]) L[c] = m;
        Q[c] += m * m;
      }
    }
    if (breath) await breath();
  }
  const rms = Object.fromEntries(STEM_IDS.map((s) => [s, Float32Array.from(sq[s], (v, c) => Math.sqrt(v / Math.max(1, cnt[c])))])) as Record<StemId, Float32Array>;
  const o = { colSec: 1 / STEM_COLS_PER_SEC, hi, lo, rms, seconds: total };
  overviewCache.set(key, o);
  return o;
}

export function stemOverviewCached(id: TrackId, source: 'ORIGINAL' | 'SEPARATED'): StemOverview | null {
  return overviewCache.get(`${id}:${source}`) ?? null;
}
