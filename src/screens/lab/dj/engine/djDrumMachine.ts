/**
 * djDrumMachine — the hybrid rig's percussion part (screen 22): WHEN the
 * drum machine plays (from its clock) and WHAT it sounds like (a short
 * synthesised percussion pattern). Pure; pinned by test/djEvent.test.ts.
 *
 * TIME. A drum machine on EXTERNAL clock counts the leader's beats: MIDI
 * clock is 24 ticks per quarter note, so its tempo IS the leader's, tick for
 * tick, and it stops when the clock stops. Clock carries TEMPO, not the bar:
 * where its bar 1 falls is set by when it STARTS. On INTERNAL clock it runs
 * at its own tempo, and a few tenths of a BPM away from the track drift out
 * audibly within a few bars.
 *
 * SOUND. 16 steps a bar: a shaker on every sixteenth, a rim on the off
 * beats, two congas. Each hit is a small synthesised clip (seeded noise,
 * decaying sines), cached; a render places them at their real times.
 */
import { trueGrid } from './djMusic.ts';
import { SR, rng } from './djDsp.ts';
import { clockArrives, counterBpm, type DrumMachine } from '../model/djEvent.ts';
import { beatAt, rateOf, timeOfBeat } from '../model/djTime.ts';
import type { Booth, DeckState } from '../model/djModel.ts';

export type HitKind = 'shaker' | 'rim' | 'congaLo' | 'congaHi';
export type Hit = { t: number; kind: HitKind; gain: number; step: number };

/** The pattern: per sixteenth step 0…15, which hits play. */
export const PATTERN: readonly { step: number; kind: HitKind; gain: number }[] = [
  ...Array.from({ length: 16 }, (_, s) => ({ step: s, kind: 'shaker' as HitKind, gain: s % 4 === 2 ? 0.55 : s % 2 === 0 ? 0.32 : 0.22 })),
  { step: 3, kind: 'rim', gain: 0.5 }, { step: 7, kind: 'rim', gain: 0.45 }, { step: 11, kind: 'rim', gain: 0.5 }, { step: 14, kind: 'rim', gain: 0.4 },
  { step: 0, kind: 'congaLo', gain: 0.8 }, { step: 6, kind: 'congaLo', gain: 0.6 }, { step: 10, kind: 'congaLo', gain: 0.7 },
  { step: 4, kind: 'congaHi', gain: 0.6 }, { step: 12, kind: 'congaHi', gain: 0.55 }, { step: 15, kind: 'congaHi', gain: 0.45 },
];

/** The deck whose beat counter the mixer's CLOCK switch follows. */
const leaderDeck = (b: Booth, dm: DrumMachine): DeckState | null => (dm.clockSrc === 'OFF' ? null : dm.clockSrc === 1 ? b.decks.A : b.decks.B);

/** The leader's TRUE beat at booth time t (a playing deck, no loop). */
export function leaderBeat(b: Booth, t: number): number | null {
  const dm = b.ev?.dm;
  if (!dm) return null;
  const d = leaderDeck(b, dm);
  if (!d || !d.track || !d.playing) return null;
  const pos = d.posSec + Math.max(0, t - d.at) * rateOf(d.pitch);
  return beatAt(trueGrid(d.track), pos);
}

/** Booth time of the leader's TRUE beat `beat`. */
function leaderTimeOfBeat(d: DeckState, beat: number): number {
  const trackT = timeOfBeat(trueGrid(d.track!), beat);
  return d.at + (trackT - d.posSec) / rateOf(d.pitch);
}

/** Is the drum machine sounding (started, and with a clock to follow)? */
export function dmRunning(b: Booth): boolean {
  const dm = b.ev?.dm;
  if (!dm || dm.startedAt == null) return false;
  if (dm.sync === 'INT') return true;
  return clockArrives(b) && leaderBeat(b, dm.startedAt) != null;
}

/**
 * The phase of a running EXT drum machine against the leader: how far (in
 * beats) its bar 1 sits from the leader's nearest bar line (−2 … +2; 0 = on
 * the one), and from the nearest beat (−0.5 … +0.5). null on INT or when
 * it is not following.
 */
export function dmPhase(b: Booth): { barBeats: number; beat: number } | null {
  const dm = b.ev?.dm;
  if (!dm || dm.startedAt == null || dm.sync !== 'EXT' || !clockArrives(b)) return null;
  const lb = leaderBeat(b, dm.startedAt);
  if (lb == null) return null;
  const wrap = (x: number, m: number) => ((((x + m / 2) % m) + m) % m) - m / 2;
  return { barBeats: wrap(lb, 4), beat: wrap(lb, 1) };
}

/** The booth time of the leader's next bar line after t (an ARMED start). */
export function nextLeaderBar(b: Booth, t: number): number | null {
  const dm = b.ev?.dm;
  if (!dm) return null;
  const d = leaderDeck(b, dm);
  const lb = leaderBeat(b, t);
  if (!d || lb == null) return null;
  const next = Math.ceil((lb + 1e-6) / 4) * 4;
  return leaderTimeOfBeat(d, next);
}

/** Every hit in booth time [t0, t1). */
export function dmHits(b: Booth, t0: number, t1: number): Hit[] {
  const dm = b.ev?.dm;
  if (!dm || dm.startedAt == null) return [];
  const ts = dm.startedAt;
  const out: Hit[] = [];
  if (dm.sync === 'INT') {
    const spb = 60 / dm.intBpm;
    const s0 = Math.max(0, Math.floor(((t0 - ts) / spb) * 4) - 1);
    const s1 = Math.ceil(((t1 - ts) / spb) * 4) + 1;
    for (let s = s0; s <= s1; s++) {
      const t = ts + (s / 4) * spb;
      if (t < t0 || t >= t1 || t < ts) continue;
      for (const p of PATTERN) if (p.step === s % 16) out.push({ t, kind: p.kind, gain: p.gain, step: s % 16 });
    }
    return out;
  }
  if (!clockArrives(b)) return out;
  const d = leaderDeck(b, dm);
  const lbStart = leaderBeat(b, ts);
  const lbNow0 = leaderBeat(b, Math.max(t0, ts));
  const lbNow1 = leaderBeat(b, t1);
  if (!d || lbStart == null || lbNow0 == null || lbNow1 == null) return out;
  // it counts the leader's beats from where it started
  const s0 = Math.max(0, Math.floor((lbNow0 - lbStart) * 4) - 1);
  const s1 = Math.ceil((lbNow1 - lbStart) * 4) + 1;
  for (let s = s0; s <= s1; s++) {
    const t = leaderTimeOfBeat(d, lbStart + s / 4);
    if (t < t0 || t >= t1 || t < ts) continue;
    for (const p of PATTERN) if (p.step === s % 16) out.push({ t, kind: p.kind, gain: p.gain, step: s % 16 });
  }
  return out;
}

/** The drum machine's step (0…15) sounding at booth time t, or null. */
export function dmStepAt(b: Booth, t: number): number | null {
  const dm = b.ev?.dm;
  if (!dm || dm.startedAt == null || t < dm.startedAt) return null;
  if (dm.sync === 'INT') return Math.floor(((t - dm.startedAt) / (60 / dm.intBpm)) * 4) % 16;
  const a = leaderBeat(b, dm.startedAt);
  const c = leaderBeat(b, t);
  if (a == null || c == null || !clockArrives(b)) return null;
  return Math.floor((c - a) * 4) % 16;
}

/* ── sounds ───────────────────────────────────────────────────────────── */

const clips: Partial<Record<HitKind, Float32Array>> = {};

function makeClip(kind: HitKind): Float32Array {
  const r = rng(kind.length * 977 + 13);
  if (kind === 'shaker') {
    const n = Math.round(0.05 * SR);
    const y = new Float32Array(n);
    let hp = 0;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const w = r() * 2 - 1;
      hp = 0.82 * (hp + w - prev);
      prev = w;
      const env = Math.min(1, i / (0.004 * SR)) * Math.exp(-i / (0.014 * SR));
      y[i] = hp * env * 0.5;
    }
    return y;
  }
  if (kind === 'rim') {
    const n = Math.round(0.06 * SR);
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      y[i] = (Math.sin(2 * Math.PI * 1720 * t) * 0.7 + Math.sin(2 * Math.PI * 820 * t) * 0.3 + (r() * 2 - 1) * 0.25 * Math.exp(-t / 0.002)) * Math.exp(-t / 0.012);
    }
    return y;
  }
  // congas: a struck membrane — a decaying sine with a small pitch drop
  const f0 = kind === 'congaLo' ? 205 : 318;
  const n = Math.round(0.32 * SR);
  const y = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f0 * (1 + 0.12 * Math.exp(-t / 0.018));
    ph += (2 * Math.PI * f) / SR;
    y[i] = (Math.sin(ph) + 0.18 * Math.sin(2.7 * ph)) * Math.exp(-t / (kind === 'congaLo' ? 0.11 : 0.08)) * Math.min(1, i / 24) + (r() * 2 - 1) * 0.2 * Math.exp(-t / 0.003);
  }
  return y;
}

const clipOf = (k: HitKind): Float32Array => (clips[k] ??= makeClip(k));

/** Peak of the pattern's mix at the drum machine's output (line level). */
export const DM_LEVEL = 0.5;

/** The drum machine's line output for booth time [t0, t0 + n/SR): stereo
 *  (shaker a little left, rim a little right, congas centred). */
export function dmSignal(b: Booth, t0: number, n: number): { l: Float32Array; r: Float32Array } {
  const l = new Float32Array(n);
  const rr = new Float32Array(n);
  const hits = dmHits(b, t0 - 0.35, t0 + n / SR);
  for (const h of hits) {
    const c = clipOf(h.kind);
    const at = Math.round((h.t - t0) * SR);
    const pan = h.kind === 'shaker' ? -0.3 : h.kind === 'rim' ? 0.3 : 0;
    const gl = h.gain * DM_LEVEL * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    const gr = h.gain * DM_LEVEL * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
    for (let i = Math.max(0, -at); i < c.length && at + i < n; i++) {
      l[at + i] += c[i] * gl;
      rr[at + i] += c[i] * gr;
    }
  }
  return { l, r: rr };
}

/** The leader's tempo as the drum machine would show it. */
export function leaderBpm(b: Booth): number | null {
  const dm = b.ev?.dm;
  if (!dm || dm.clockSrc === 'OFF') return null;
  return counterBpm(b, dm.clockSrc);
}


/** For the drawing: the drum machine's own beat as a straight line in booth
 *  time from `t` (its beat count there and its tempo) — null when it is not
 *  sounding. Re-taken whenever the booth changes. */
export function dmBeatLine(b: Booth, t: number): { t0: number; beat0: number; bpm: number } | null {
  const dm = b.ev?.dm;
  if (!dm || dm.startedAt == null || !dmRunning(b)) return null;
  if (dm.sync === 'INT') return { t0: t, beat0: ((t - dm.startedAt) * dm.intBpm) / 60, bpm: dm.intBpm };
  const a = leaderBeat(b, dm.startedAt);
  const c = leaderBeat(b, t);
  const bpm = leaderBpm(b);
  if (a == null || c == null || bpm == null) return null;
  return { t0: t, beat0: c - a, bpm };
}

/** The leader's own beat as a straight line from `t` (the clock the cable
 *  carries) — null when no clock arrives. */
export function leaderBeatLine(b: Booth, t: number): { t0: number; beat0: number; bpm: number } | null {
  if (!clockArrives(b)) return null;
  const c = leaderBeat(b, t);
  const bpm = leaderBpm(b);
  if (c == null || bpm == null) return null;
  return { t0: t, beat0: c, bpm };
}
