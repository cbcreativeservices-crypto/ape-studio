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

/* ── one version through the chain ───────────────────────────────────────── */

export type MasterProcess = {
  /** Broad tonal lean, dB (+ brighter, − warmer). */
  tiltDb?: number;
  /** M/S width multiplier (1 = as mixed). */
  width?: number;
  /** Drive into the limiter, dB. */
  driveDb?: number;
  /** Limiter ceiling, dBFS (sample peak). Omit = no limiter. */
  ceilingDb?: number;
  /** Plain output trim, dB (after everything). */
  trimDb?: number;
};

/** PEAK SAFETY (safety review 2026-10-01, finding 12): any drive or trim
 *  ABOVE unity without an explicit ceiling runs through the lab's own
 *  limiter at this ceiling — a soft, programme-dependent clamp, never a hard
 *  clip. A version that only attenuates, or that already has a ceiling,
 *  passes untouched. */
export const SAFETY_CEILING_DB = -0.3;

/** True when a process would raise level with nothing holding the peaks. */
export function needsSafetyCeiling(p: MasterProcess): boolean {
  return p.ceilingDb == null && ((p.driveDb ?? 0) > 0 || (p.trimDb ?? 0) > 0);
}

/** One version of the master through the chain: tilt → width → drive →
 *  limiter → trim → (safety ceiling). Pure. */
export function renderVersion(base: Stereo, p: MasterProcess): { out: Stereo; grDb: number[]; maxGrDb: number } {
  let s = base;
  if (p.tiltDb) s = tiltEq(s, p.tiltDb);
  if (p.width != null && p.width !== 1) s = stereoWidth(s, p.width);
  let grDb: number[] = [];
  let maxGrDb = 0;
  if (p.ceilingDb != null) {
    const lim = peakLimiter(s, p.driveDb ?? 0, p.ceilingDb);
    s = lim.out;
    grDb = lim.grDb;
    maxGrDb = lim.maxGrDb;
  } else if (p.driveDb) {
    s = applyGain(s, p.driveDb);
  }
  if (p.trimDb) s = applyGain(s, p.trimDb);
  if (needsSafetyCeiling(p)) {
    const lim = peakLimiter(s, 0, SAFETY_CEILING_DB);
    s = lim.out;
    grDb = lim.grDb;
    maxGrDb = lim.maxGrDb;
  }
  return { out: s, grDb, maxGrDb };
}

/** THE AUTO-REPLAY RULE (safety review 2026-10-01, finding 1b): after a
 *  fader or MATCH change, the version that was sounding replays by itself
 *  ONLY while matched-level listening is on. Unmatched, LOUDER is 7–11 LU
 *  louder than the mix, so a fader nudge must never restart it unannounced:
 *  the transport stops and waits for a press. Pure. */
export function autoReplayAllowed(matched: boolean, again: string | null): string | null {
  return matched ? again : null;
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
  // A soft-saturating curve of the level difference: the ISO 226 contours
  // bunch together at 50 Hz, so the apparent bass shift is steep near the
  // reference (about −5.3 dB at 65, −6.4 at 55) and flattens above it
  // (about +2.5 at 90). The treble shift is a smaller version of the same.
  const bassDb = Math.max(-12, Math.min(6, 7 * Math.tanh(d * 0.55)));
  const trebleDb = Math.max(-4, Math.min(2, 1.5 * Math.tanh(d * 0.55)));
  return { bassDb: Number(bassDb.toFixed(2)), trebleDb: Number(trebleDb.toFixed(2)) };
}

/** The NIOSH recommended exposure limit: 85 dBA over 8 hours, halving for
 *  every 3 dB above (88 → 4 h, 91 → 2 h, 94 → 1 h, 97 → 30 min, 100 →
 *  15 min). Below 85 the daily limit is "8 h+" — a full working day. */
export const NIOSH_LIMIT_DBA = 85;
export function dailyLimitHours(levelDbSpl: number): number {
  return 8 * Math.pow(2, (NIOSH_LIMIT_DBA - levelDbSpl) / 3);
}
/** The DAILY LIMIT readout: "8 h+" below the action level; hours, then
 *  minutes, above it. */
export function dailyLimitLabel(levelDbSpl: number): string {
  if (levelDbSpl < NIOSH_LIMIT_DBA) return '8 h+';
  const h = dailyLimitHours(levelDbSpl);
  if (h >= 1) return `${Math.abs(h - Math.round(h)) < 0.05 ? h.toFixed(0) : h.toFixed(1)} h`;
  return `${Math.max(1, Math.round(h * 60))} min`;
}

/** Hearing-safety reading for a monitoring level: the lab never encourages
 *  loud monitoring. Boundaries follow the NIOSH recommended exposure limit
 *  (85 dBA over 8 h, 3 dB exchange rate): 'sensible' stays UNDER the limit
 *  (≤ 83), 'hot' brackets it (84–88, where the daily clock is already
 *  running), 'unsafe' is 89 and up (2 h or less a day). A C-weighted music
 *  reading is a few dB higher than the A-weighted one the limit is quoted
 *  in, so this scale errs on the safe side. */
export function monitoringAdvice(levelDbSpl: number): { tone: 'low' | 'sensible' | 'hot' | 'unsafe'; note: string } {
  if (levelDbSpl < 70) return { tone: 'low', note: 'Quiet: a useful check for what survives at low level — but make tonal decisions at your reference level, because a quiet listen reads thin.' };
  if (levelDbSpl <= 83) return { tone: 'sensible', note: 'A sensible, repeatable working level, under the daily exposure limit: comparisons mean something and a full day is survivable.' };
  if (levelDbSpl <= 88) return { tone: 'hot', note: 'Hot: at 85 dBA the recommended daily limit is 8 hours; every 3 dB above halves it. Everything sounds bigger here and fatigue sets in within the hour. Turn it down for decisions.' };
  return { tone: 'unsafe', note: 'Unsafe for working: two hours or less a day at this level, and the hearing damage risk rises quickly. Nothing in mastering needs this level.' };
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
export type PathGrade = 'empty' | 'fail' | 'minimal' | 'complete';

export function checkMonitorPath(chain: readonly PathDevice[]): { ok: boolean; grade: PathGrade; jobs: number; reason: string; notes: string[] } {
  const notes: string[] = [];
  const idx = (d: PathDevice) => chain.indexOf(d);
  const has = (d: PathDevice) => idx(d) >= 0;
  if (chain.length === 0) return { ok: false, grade: 'empty', jobs: 0, reason: 'Nothing connected yet.', notes: ['Nothing connected yet. Start where the audio starts: the playback software.'] };
  if (chain[0] !== 'daw') notes.push('The chain starts at the DAW or playback software — that is where the file is read.');
  if (!has('passive') && !has('active')) notes.push('No loudspeakers yet: nothing turns the signal back into sound.');
  if (has('passive') && has('active')) notes.push('Pick one loudspeaker type for this path.');
  if (has('passive') && !has('amp')) notes.push('Passive monitors need a power amplifier before them.');
  if (has('active') && has('amp')) notes.push('Active monitors already contain their amplifiers — an external power amp in front of them is wrong (and risks damage).');
  if (has('dac') && idx('dac') < idx('daw')) notes.push('Conversion comes after playback, not before.');
  if (has('monitorCtl') && has('dac') && idx('monitorCtl') < idx('dac')) notes.push('An analog monitor controller sits after the converter — it controls the analog level to the speakers. A digital controller converts inside itself; an EXTERNAL converter after the controller is the wrong order.');
  if (has('amp') && has('monitorCtl') && idx('amp') < idx('monitorCtl')) notes.push('Level control belongs before the power amplifier.');
  const spk = has('passive') ? idx('passive') : idx('active');
  if (spk >= 0 && spk !== chain.length - 1) notes.push('The loudspeakers are the end of the chain.');
  if (has('amp') && has('passive') && idx('amp') > idx('passive')) notes.push('The amplifier drives the speakers, so it comes before them.');
  if (!has('monitorCtl')) notes.push('No monitor controller: level is being set somewhere else (a DAW fader or an interface knob). It works, but a repeatable, calibrated listening level is harder to keep.');
  if (!has('dac') && has('monitorCtl')) notes.push('No separate converter: fine if the controller or interface converts internally — many do.');
  if (!has('dac') && !has('monitorCtl')) notes.push('No converter and no controller: the interface is doing both jobs and the level is a software fader. Minimal, not complete.');
  const soft = (n: string) => n.startsWith('No monitor controller') || n.startsWith('No separate converter') || n.startsWith('No converter and no controller');
  const works = notes.every(soft) && (has('passive') || has('active')) && chain[0] === 'daw';
  // The five JOBS: playback, conversion, level, amplification, air. An
  // active monitor covers amplification; a controller counts as the level
  // job (and may convert inside itself).
  const jobs = (has('daw') ? 1 : 0) + (has('dac') || has('monitorCtl') ? 1 : 0) + (has('monitorCtl') ? 1 : 0) + (has('amp') || has('active') ? 1 : 0) + (has('passive') || has('active') ? 1 : 0);
  // COMPLETE needs the level job covered by a controller and ≥ 4 jobs; a
  // chain that works without one is MINIMAL (level set in software).
  const grade: PathGrade = !works ? 'fail' : jobs >= 4 && has('monitorCtl') ? 'complete' : 'minimal';
  const reason = grade === 'complete'
    ? (has('dac') ? 'Every job in order — real systems vary in how boxes share them.' : 'Every job covered — the controller converts inside itself.')
    : grade === 'minimal'
      ? 'Works, but no controller: level set in software, nothing calibrated.'
      : (notes.find((n) => !soft(n)) ?? notes[0] ?? '');
  return { ok: works, grade, jobs, reason, notes };
}

/* ── sequencing (Module 8) ───────────────────────────────────────────────── */

export type SeqTrack = { id: string; title: string; seconds: number; lufs: number; fadeOutSec: number };

export type SeqBlock = { id: string; startSec: number; endSec: number; title: string; lufs: number; fadeOutSec: number };

/** A crossfade in this lab overlaps neighbours by this much (the gap reads
 *  "XF" and is drawn as 0 — the next track starts inside the fade-out). */
export const XF_OVERLAP_SEC = 2;

/** Lay an ordered set of tracks on a timeline with `gapSec` between them, or
 *  — with `crossfade` — overlapping by XF_OVERLAP_SEC (gap 0). */
export function layoutSequence(order: readonly SeqTrack[], gapSec: number, crossfade = false): { blocks: SeqBlock[]; totalSec: number } {
  let t = 0;
  const blocks: SeqBlock[] = [];
  const step = crossfade ? -XF_OVERLAP_SEC : Math.max(0, gapSec);
  for (let i = 0; i < order.length; i++) {
    const tr = order[i];
    blocks.push({ id: tr.id, title: tr.title, startSec: t, endSec: t + tr.seconds, lufs: tr.lufs, fadeOutSec: tr.fadeOutSec });
    t += tr.seconds + (i < order.length - 1 ? step : 0);
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

/* ───────────────────────── the 9 pt floor on a short phone ─────────────── */

/** The rack's glass heights (rack/rackTypes STAGE_HEIGHTS) and its short-
 *  viewport rule, mirrored here so the legibility maths is node-testable:
 *  under 700 pt tall an L glass becomes M and an M glass becomes S. */
export const GLASS_HEIGHTS = { S: 160, M: 200, L: 250 } as const;
export function glassHeightFor(size: 'S' | 'M' | 'L', winH: number): number {
  const eff = winH < 700 ? (size === 'L' ? 'M' : 'S') : size;
  return GLASS_HEIGHTS[eff];
}

/** The width a 360-unit drawing of `aspect` (w ÷ h) is drawn at inside a
 *  glass of (winW × glassH): the rack's frame (10 + 1 each side), the
 *  StageFit pad (6), then the widest box of the drawing's shape that fits. */
export function drawnWidth(aspect: number, winW: number, glassH: number, pad = 6): number {
  const w = winW - 22;
  const h = glassH - 2;
  return Math.max(40, Math.min(Math.max(40, w - pad * 2), Math.max(40, h - pad * 2) * aspect));
}

/**
 * A height-limited drawing on a SHORT phone (iPhone SE: 375 × 667 — the
 * glass drops a size) can be fitted under 1 : 1, and a design-unit label of
 * `minUnits` then renders under the 9 pt floor (owner 2026-09-25: "9 pt
 * minimum"). The boost is the factor the drawing's fonts (and their wrap
 * widths) must grow by so the smallest label is exactly 9 pt — 1 wherever the
 * drawing is at or above 1 : 1 (a tall phone, FULL SCREEN), so nothing
 * changes there.
 */
export function fitFontBoost(width: number, designW: number, minUnits: number, floorPt = 9): number {
  const k = width / designW;
  if (!(k > 0) || k >= 1) return 1;
  return Math.max(1, floorPt / (minUnits * k));
}
