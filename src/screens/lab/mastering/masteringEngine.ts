/**
 * Mastering Lab — the PURE ENGINE (owner build order 2026-10-01).
 *
 * Everything the lab measures, matches or draws comes from here, so the
 * rules are unit-tested without Metro (test/masteringLab*.test.ts):
 *
 *  • The programme is the house 8-track session (mixing/audio/mixAudio.ts,
 *    the Ear-Training precedent): a REAL offline render, never a fake. The
 *    "delivered mix" below is a plain static balance of it — the thing a
 *    mastering engineer receives.
 *  • A mastering chain in miniature: a tilt EQ (broad tonal shaping), a
 *    stereo-linked peak LIMITER with input drive and a ceiling, a width
 *    control. Every stage is real sample maths on the rendered stereo buffer.
 *  • Measurement: sample peak, a TRUE-PEAK estimate (4× oversampled), an
 *    integrated-loudness ESTIMATE (K-weighted, gated — the ITU-R BS.1770
 *    procedure in miniature, from mixing/engine/advanced.ts) and PLR.
 *  • MATCHED-LEVEL LISTENING: the rule that "louder" is never mistaken for
 *    "better". Every version in a comparison group is turned DOWN to the
 *    loudness of the quietest member — attenuation only, so a match can never
 *    clip — and the gain is the difference of the two LUFS estimates.
 *
 * HONESTY: estimates for teaching, through an uncalibrated phone output.
 * Never certified metering. The screens say so (badge + AccuracyNote).
 */
import { SR, applyBiquad, rbj, type Mono, type Stereo } from '../../../features/ear/earDsp.ts';
import { loudnessLufsEstimate, truePeakDbEstimate } from '../mixing/engine/advanced.ts';
import type { MixSettings } from '../mixing/audio/mixAudio.ts';

/* ── the delivered mix ───────────────────────────────────────────────────── */

/** The static balance the "client" delivered — a sensible mix, nothing
 *  pushed. Faders in dB, pans −100..100 (the mixing lab's own units). */
export const DELIVERED_MIX: MixSettings = {
  kick: { faderDb: 0, pan: 0 },
  snare: { faderDb: -2, pan: 4 },
  perc: { faderDb: -9, pan: 35 },
  bass: { faderDb: -1, pan: 0 },
  gtr: { faderDb: -6, pan: -40 },
  keys: { faderDb: -8, pan: 30 },
  lead: { faderDb: -3, pan: 0 },
  bgv: { faderDb: -10, pan: -25 },
};

/** The master bus trim of the delivered mix. At 0 dB the static balance
 *  above measures about −4 dBFS sample peak / −19 LUFS / PLR 15 (pinned by
 *  test/masteringLabEngine.test.ts) — a mix with headroom, the thing a
 *  mastering engineer is handed. */
export const DELIVERED_TRIM_DB = 0;

/* ── chain stages ────────────────────────────────────────────────────────── */

const db2lin = (db: number) => Math.pow(10, db / 20);
export const linToDb = (lin: number) => 20 * Math.log10(Math.max(lin, 1e-9));

export function applyGain(s: Stereo, db: number): Stereo {
  const g = db2lin(db);
  const n = s.l.length;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    l[i] = s.l[i] * g;
    r[i] = s.r[i] * g;
  }
  return { l, r };
}

/**
 * A TILT EQ: the broad tonal move a mastering engineer reaches for first.
 * +tilt brightens (low shelf down, high shelf up by the same amount);
 * −tilt warms. Two RBJ shelves per channel, hinge at ~700 Hz.
 */
export function tiltEq(s: Stereo, tiltDb: number): Stereo {
  if (!tiltDb) return s;
  const lo = rbj(200, 0.7, -tiltDb / 2, 'lowshelf');
  const hi = rbj(2500, 0.7, tiltDb / 2, 'highshelf');
  const run = (x: Mono) => applyBiquad(applyBiquad(x, lo), hi);
  return { l: run(s.l), r: run(s.r) };
}

/** M/S width on the summed bus (0 = mono, 1 = as mixed, >1 wider). */
export function stereoWidth(s: Stereo, w: number): Stereo {
  if (w === 1) return s;
  const n = s.l.length;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const k = Math.max(0, w);
  for (let i = 0; i < n; i++) {
    const m = (s.l[i] + s.r[i]) / 2;
    const sd = ((s.l[i] - s.r[i]) / 2) * k;
    l[i] = m + sd;
    r[i] = m - sd;
  }
  return { l, r };
}

export type LimiterResult = {
  out: Stereo;
  /** Gain reduction (dB, ≥ 0) at the columns of the display, max-held. */
  grDb: number[];
  /** Deepest gain reduction seen (dB, ≥ 0). */
  maxGrDb: number;
};

/**
 * A stereo-linked PEAK LIMITER: drive the input, hold the output under the
 * ceiling. Instant attack (the gain computer sees the sample it acts on), a
 * programme-dependent release, and the same gain on both channels so the
 * image never shifts. No look-ahead — a true-peak meter still catches what
 * a sample-peak ceiling lets through between samples, which is exactly the
 * lesson Module 6 draws.
 */
export function peakLimiter(s: Stereo, driveDb: number, ceilingDb: number, releaseMs = 80, columns = 160): LimiterResult {
  const n = s.l.length;
  const g0 = db2lin(driveDb);
  const ceil = db2lin(ceilingDb);
  const rel = Math.exp(-1 / ((releaseMs / 1000) * SR));
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const grDb = new Array<number>(columns).fill(0);
  let env = 0;
  let maxGr = 0;
  for (let i = 0; i < n; i++) {
    const a = s.l[i] * g0;
    const b = s.r[i] * g0;
    const pk = Math.max(Math.abs(a), Math.abs(b));
    env = pk > env ? pk : env * rel;
    const g = env > ceil ? ceil / env : 1;
    l[i] = a * g;
    r[i] = b * g;
    if (g < 1) {
      const gr = -linToDb(g);
      if (gr > maxGr) maxGr = gr;
      const c = Math.min(columns - 1, Math.floor((i / n) * columns));
      if (gr > grDb[c]) grDb[c] = gr;
    }
  }
  return { out: { l, r }, grDb, maxGrDb: maxGr };
}

/* ── measurement ─────────────────────────────────────────────────────────── */

export type Measure = {
  /** Sample peak, dBFS. */
  peakDb: number;
  /** True-peak ESTIMATE, dBTP (4× oversampled). */
  truePeakDb: number;
  /** Integrated loudness ESTIMATE, LUFS (K-weighted, gated). */
  lufs: number;
  /** Peak-to-loudness ratio, dB (true peak − integrated loudness) — a plain
   *  "how much headroom over the average" number the lab uses for dynamics. */
  plr: number;
  rmsDb: number;
};

export function samplePeakDb(s: Stereo): number {
  let p = 0;
  for (let i = 0; i < s.l.length; i++) {
    const a = Math.abs(s.l[i]);
    const b = Math.abs(s.r[i]);
    if (a > p) p = a;
    if (b > p) p = b;
  }
  return linToDb(p);
}

export function rmsDbOf(s: Stereo): number {
  let sum = 0;
  const n = s.l.length;
  for (let i = 0; i < n; i++) sum += s.l[i] * s.l[i] + s.r[i] * s.r[i];
  return 10 * Math.log10(Math.max(sum / (2 * Math.max(1, n)), 1e-18));
}

export function measure(s: Stereo): Measure {
  const peakDb = samplePeakDb(s);
  const truePeakDb = truePeakDbEstimate(s);
  const lufs = loudnessLufsEstimate(s);
  return { peakDb, truePeakDb, lufs, plr: truePeakDb - lufs, rmsDb: rmsDbOf(s) };
}

/* ── matched-level listening ─────────────────────────────────────────────── */

/**
 * THE MATCHED-LEVEL RULE. Given the loudness of every version in a comparison
 * group, return the gain (dB, ≤ 0) each must play at so they all sit at the
 * loudness of the QUIETEST one. Attenuation only: a boost could clip the
 * louder version's peaks and the learner would be judging distortion, not the
 * decision. The gain is simply quietest − this, in LU (= dB).
 */
export function matchedGains(lufsById: Record<string, number>): Record<string, number> {
  const vals = Object.values(lufsById).filter((v) => Number.isFinite(v));
  if (vals.length === 0) return Object.fromEntries(Object.keys(lufsById).map((k) => [k, 0]));
  const quietest = Math.min(...vals);
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(lufsById)) out[id] = Number.isFinite(v) ? Math.min(0, quietest - v) : 0;
  return out;
}

/* ── the display picture ─────────────────────────────────────────────────── */

export type Overview = {
  /** Per column: the most positive and most negative sample (−1..1), on the
   *  REAL time base (column c spans seconds c/columns × duration). */
  hi: number[];
  lo: number[];
  /** Per column: |peak| as a 0..1 level fraction for the colour ramp. */
  level: number[];
  seconds: number;
};

/** Min/max overview of the mono fold (L+R)/2 — the waveform the stage draws. */
export function overview(s: Stereo, columns = 160): Overview {
  const n = s.l.length;
  const hi = new Array<number>(columns).fill(0);
  const lo = new Array<number>(columns).fill(0);
  const level = new Array<number>(columns).fill(0);
  for (let c = 0; c < columns; c++) {
    const a = Math.floor((c / columns) * n);
    const b = Math.max(a + 1, Math.floor(((c + 1) / columns) * n));
    let mx = -Infinity;
    let mn = Infinity;
    for (let i = a; i < b; i++) {
      const v = (s.l[i] + s.r[i]) / 2;
      if (v > mx) mx = v;
      if (v < mn) mn = v;
    }
    hi[c] = Math.max(-1, Math.min(1, mx));
    lo[c] = Math.max(-1, Math.min(1, mn));
    level[c] = Math.min(1, Math.max(Math.abs(mx), Math.abs(mn)));
  }
  return { hi, lo, level, seconds: n / SR };
}

/* ── monitoring level (Module 3) ─────────────────────────────────────────── */

/**
 * How much the ear's sensitivity to the bass and the treble changes with
 * monitoring level, relative to a reference listening level — the reason a
 * mastering room keeps ONE sensible level for comparisons. A simplified
 * equal-loudness picture (ISO 226-style contours flatten as level rises):
 * at low levels the bass reads weaker than it is, so a tonal judgement made
 * quietly is biased bright-and-thin; at high levels the opposite. Pure
 * illustration maths, labelled MODEL on screen.
 *
 * Returns the apparent shift (dB) of the 50 Hz region and the 10 kHz region
 * relative to 1 kHz, for a monitoring level in dB SPL (C-weighted, slow).
 */
export function perceivedBalanceShift(levelDbSpl: number, referenceDbSpl = 83): { bassDb: number; trebleDb: number } {
  const d = (levelDbSpl - referenceDbSpl) / 10; // decades of 10 dB
  // Contours bunch together at low frequency: roughly 1 dB of apparent bass
  // per 2 dB of level near the reference, flattening above it.
  const bassDb = Math.max(-12, Math.min(6, 4 * Math.tanh(d * 0.9)));
  const trebleDb = Math.max(-4, Math.min(2, 1.2 * Math.tanh(d * 0.9)));
  return { bassDb: Number(bassDb.toFixed(2)), trebleDb: Number(trebleDb.toFixed(2)) };
}

/** Hearing-safety reading for a monitoring level: the lab never encourages
 *  loud monitoring. Boundaries follow the NIOSH recommended exposure limit
 *  (85 dBA over 8 h, 3 dB exchange rate) — a sensible mastering session sits
 *  well under it. */
export function monitoringAdvice(levelDbSpl: number): { tone: 'low' | 'sensible' | 'hot' | 'unsafe'; note: string } {
  if (levelDbSpl < 70) return { tone: 'low', note: 'Quiet: fine for checking, but tonal judgements made this quietly read thin. Compare at your usual level.' };
  if (levelDbSpl <= 85) return { tone: 'sensible', note: 'A sensible, repeatable working level: comparisons mean something and a full day is survivable.' };
  if (levelDbSpl <= 92) return { tone: 'hot', note: 'Hot: everything sounds bigger, fatigue sets in within the hour, and the exposure clock is running. Turn it down for decisions.' };
  return { tone: 'unsafe', note: 'Unsafe for working: hearing damage risk rises quickly here. Nothing in mastering needs this level.' };
}

/* ── monitoring path (Module 3) ──────────────────────────────────────────── */

export type PathDevice = 'daw' | 'dac' | 'monitorCtl' | 'amp' | 'passive' | 'active';

export const PATH_DEVICE_NAMES: Record<PathDevice, string> = {
  daw: 'DAW / playback',
  dac: 'D/A converter',
  monitorCtl: 'Monitor controller',
  amp: 'Power amplifier',
  passive: 'Passive monitors',
  active: 'Active (powered) monitors',
};

/**
 * Checks a monitoring chain the learner assembled. The lesson is the ORDER
 * (software → conversion → level control → amplification → loudspeaker) and
 * that real systems vary: a powered monitor contains its own amplifier, so
 * an external power amp before it is a mistake, and a passive monitor needs
 * one. A controller with a built-in DAC is a legitimate variant, so the DAC
 * may be absent when the controller is present (noted, not failed).
 */
export function checkMonitorPath(chain: readonly PathDevice[]): { ok: boolean; notes: string[] } {
  const notes: string[] = [];
  const idx = (d: PathDevice) => chain.indexOf(d);
  const has = (d: PathDevice) => idx(d) >= 0;
  if (chain.length === 0) return { ok: false, notes: ['Nothing connected yet. Start where the audio starts: the playback software.'] };
  if (chain[0] !== 'daw') notes.push('The chain starts at the DAW or playback software — that is where the file is read.');
  if (!has('passive') && !has('active')) notes.push('No loudspeakers yet: nothing turns the signal back into sound.');
  if (has('passive') && has('active')) notes.push('Pick one loudspeaker type for this path.');
  if (has('passive') && !has('amp')) notes.push('Passive monitors need a power amplifier before them.');
  if (has('active') && has('amp')) notes.push('Active monitors already contain their amplifiers — an external power amp in front of them is wrong (and risks damage).');
  if (has('dac') && idx('dac') < idx('daw')) notes.push('Conversion comes after playback, not before.');
  if (has('monitorCtl') && has('dac') && idx('monitorCtl') < idx('dac')) notes.push('The monitor controller sits after the converter — it controls the analog level to the speakers.');
  if (has('amp') && has('monitorCtl') && idx('amp') < idx('monitorCtl')) notes.push('Level control belongs before the power amplifier.');
  const spk = has('passive') ? idx('passive') : idx('active');
  if (spk >= 0 && spk !== chain.length - 1) notes.push('The loudspeakers are the end of the chain.');
  if (has('amp') && has('passive') && idx('amp') > idx('passive')) notes.push('The amplifier drives the speakers, so it comes before them.');
  if (!has('monitorCtl')) notes.push('No monitor controller: level is being set somewhere else (a DAW fader or an interface knob). It works, but a repeatable, calibrated listening level is harder to keep.');
  if (!has('dac') && has('monitorCtl')) notes.push('No separate converter: fine if the controller or interface converts internally — many do.');
  const ok = notes.every((n) => n.startsWith('No monitor controller') || n.startsWith('No separate converter'));
  return { ok: ok && (has('passive') || has('active')) && chain[0] === 'daw', notes };
}

/* ── sequencing (Module 8) ───────────────────────────────────────────────── */

export type SeqTrack = { id: string; title: string; seconds: number; lufs: number; fadeOutSec: number };

export type SeqBlock = { id: string; startSec: number; endSec: number; title: string; lufs: number; fadeOutSec: number };

/** Lay an ordered set of tracks on a timeline with `gapSec` between them. */
export function layoutSequence(order: readonly SeqTrack[], gapSec: number): { blocks: SeqBlock[]; totalSec: number } {
  let t = 0;
  const blocks: SeqBlock[] = [];
  for (let i = 0; i < order.length; i++) {
    const tr = order[i];
    blocks.push({ id: tr.id, title: tr.title, startSec: t, endSec: t + tr.seconds, lufs: tr.lufs, fadeOutSec: tr.fadeOutSec });
    t += tr.seconds + (i < order.length - 1 ? gapSec : 0);
  }
  return { blocks, totalSec: t };
}

/** Largest loudness step between consecutive tracks (LU) — the consistency
 *  number a sequencing pass is trying to keep small, or deliberate. */
export function maxLoudnessStep(order: readonly SeqTrack[]): number {
  let m = 0;
  for (let i = 1; i < order.length; i++) m = Math.max(m, Math.abs(order[i].lufs - order[i - 1].lufs));
  return m;
}

/** Red Book audio CD facts (IEC 60908): 16-bit, 44.1 kHz, 2 channels. */
export const CD_RED_BOOK = { bitDepth: 16, sampleRateHz: 44100, channels: 2 } as const;

/** Playing time of a Red Book CD, minutes — the 74-minute figure most
 *  references quote (80-minute discs exist, outside the original tolerance). */
export const CD_PLAY_MINUTES = 74;

/** Bytes of a WAV at a given format — what a delivery brief can predict. */
export function wavBytes(seconds: number, sampleRateHz: number, bitDepth: number, channels: number): number {
  return Math.round(seconds * sampleRateHz * (bitDepth / 8) * channels);
}
