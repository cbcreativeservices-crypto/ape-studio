/**
 * djTime — the DJ Systems Lab's musical clock: BPM, beats, bars, phrases,
 * the beatgrid, tempo (pitch) and deck transport math. Pure TypeScript, no
 * React Native, so test/djTime.test.ts reaches it directly.
 *
 * UNITS (one rule for the whole lab):
 *   - TRACK TIME is seconds of the source file (what the overview waveform
 *     spans). A deck's transport position is always track time.
 *   - A BEAT is counted on a GRID: beat k sits at `firstBeatSec + k × 60 / bpm`.
 *     Beat 0 is bar 1 beat 1. Bars are 4 beats (4/4 time, the only metre the
 *     practice tracks use). Phrases are 8 bars here (the tracks are built in
 *     8-bar phrases, grouped 16 for the long sections).
 *   - PITCH is the tempo fader in percent; playback RATE = 1 + pitch / 100.
 *     Stage 1 has no key lock, so the rate changes speed AND pitch together,
 *     exactly as a turntable or a player with key lock off does.
 *
 * TWO GRIDS per track: the TRUE grid (where the music's beats really are —
 * the synthesiser placed them) and the ANALYSED grid (what the DJ software
 * thinks — usually the same, deliberately wrong for the Screen 11 lessons).
 * Sync, quantize, loops and beat jump all use the ANALYSED grid, the way a
 * real program does; the ear hears the TRUE beats. That difference is the
 * lesson.
 */

export const BEATS_PER_BAR = 4;
export const BARS_PER_PHRASE = 8;
export const BEATS_PER_PHRASE = BEATS_PER_BAR * BARS_PER_PHRASE;

/** The tempo fader's range in this model (a common default on players). */
export const PITCH_RANGE_PCT = 8;

export type Grid = {
  bpm: number;
  /** Track time (s) of beat 0 = bar 1 beat 1. */
  firstBeatSec: number;
};

export const secPerBeat = (bpm: number): number => 60 / bpm;

/** Beat number (fractional) at track time `t` on `grid`. */
export function beatAt(grid: Grid, t: number): number {
  return ((t - grid.firstBeatSec) * grid.bpm) / 60;
}

/** Track time of beat `b` on `grid`. */
export function timeOfBeat(grid: Grid, b: number): number {
  return grid.firstBeatSec + (b * 60) / grid.bpm;
}

/** Bar number, 1-based (beat 0 → bar 1). Negative beats are the lead-in (bar 0). */
export function barOf(beat: number): number {
  return Math.floor(beat / BEATS_PER_BAR) + 1;
}

/** Beat within the bar, 1..4. */
export function beatInBar(beat: number): number {
  const b = Math.floor(beat);
  return (((b % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR) + 1;
}

/** Phrase number, 1-based (8-bar phrases). */
export function phraseOf(beat: number): number {
  return Math.floor(beat / BEATS_PER_PHRASE) + 1;
}

/** Bar within the phrase, 1..8. */
export function barInPhrase(beat: number): number {
  const bar = Math.floor(beat / BEATS_PER_BAR);
  return (((bar % BARS_PER_PHRASE) + BARS_PER_PHRASE) % BARS_PER_PHRASE) + 1;
}

/** "17.3" — bar.beat, the way a player's display counts. */
export function formatBarBeat(beat: number): string {
  if (beat < 0) return '0.0';
  return `${barOf(beat)}.${beatInBar(beat)}`;
}

/** Beats to the next phrase start (0 when exactly on one). */
export function beatsToNextPhrase(beat: number): number {
  const r = ((beat % BEATS_PER_PHRASE) + BEATS_PER_PHRASE) % BEATS_PER_PHRASE;
  return r === 0 ? 0 : BEATS_PER_PHRASE - r;
}

/* ── tempo ─────────────────────────────────────────────────────────────── */

export function clampPitch(pct: number, range = PITCH_RANGE_PCT): number {
  return Math.max(-range, Math.min(range, pct));
}

/** Playback rate for a tempo-fader setting. */
export const rateOf = (pitchPct: number): number => 1 + pitchPct / 100;

/** The BPM a deck actually plays at. */
export const playedBpm = (bpm: number, pitchPct: number): number => bpm * rateOf(pitchPct);

/** The tempo-fader setting that makes `bpm` play at `targetBpm`. */
export const pitchFor = (bpm: number, targetBpm: number): number => (targetBpm / bpm - 1) * 100;

/** Speed change in semitones (no key lock): 12 × log2(rate). */
export const semitonesOf = (pitchPct: number): number => 12 * Math.log2(rateOf(pitchPct));

/** How fast two decks drift apart, in beats per second (positive = A ahead). */
export function driftBeatsPerSec(bpmA: number, pitchA: number, bpmB: number, pitchB: number): number {
  return (playedBpm(bpmA, pitchA) - playedBpm(bpmB, pitchB)) / 60;
}

/** Seconds until two decks drift a quarter beat apart (an audible flam) —
 *  Infinity when the tempos match exactly. */
export function secondsToQuarterBeat(bpmA: number, pitchA: number, bpmB: number, pitchB: number): number {
  const d = Math.abs(driftBeatsPerSec(bpmA, pitchA, bpmB, pitchB));
  return d < 1e-9 ? Infinity : 0.25 / d;
}

/**
 * Beat-phase offset between two beat counts, wrapped to (−0.5, +0.5] beat.
 * Positive = A is AHEAD of B. This is what a beat offset (as opposed to a
 * tempo drift) is: the tempos can match exactly and the kicks still flam.
 */
export function phaseOffset(beatA: number, beatB: number): number {
  let d = (beatA - beatB) % 1;
  if (d > 0.5) d -= 1;
  if (d <= -0.5) d += 1;
  return d;
}

/* ── quantize, loops, beat jump (all on the ANALYSED grid) ────────────── */

/** Snap a beat number to the nearest multiple of `step` beats. */
export function quantizeBeat(beat: number, step = 1): number {
  return Math.round(beat / step) * step;
}

/** Snap a track time to the analysed grid. */
export function quantizeTime(grid: Grid, t: number, step = 1): number {
  return timeOfBeat(grid, quantizeBeat(beatAt(grid, t), step));
}

/** The loop lengths the lab offers, in beats (manual loops aside). */
export const LOOP_BEATS = [1, 2, 4, 8, 16] as const;

/** A loop's length in TRACK seconds on the analysed grid. */
export const loopTrackSec = (grid: Grid, beats: number): number => (beats * 60) / grid.bpm;

/** A loop's length in REAL seconds at the played tempo. */
export const loopRealSec = (grid: Grid, beats: number, pitchPct: number): number => loopTrackSec(grid, beats) / rateOf(pitchPct);

/** Beat jump: move the position by `beats` on the analysed grid. */
export const beatJump = (grid: Grid, t: number, beats: number): number => t + (beats * 60) / grid.bpm;

export type Loop = { startSec: number; lengthSec: number };

/**
 * The deck's track time after `dtReal` seconds of playback from `t0`, at
 * `pitchPct`, inside `loop` when one is active (a loop wraps once the
 * position reaches its end; a position that starts before the loop simply
 * runs into it).
 */
export function advance(t0: number, dtReal: number, pitchPct: number, loop?: Loop | null): number {
  const t = t0 + dtReal * rateOf(pitchPct);
  if (!loop || loop.lengthSec <= 0) return t;
  const end = loop.startSec + loop.lengthSec;
  if (t0 >= end || t < end) return t;
  return loop.startSec + ((t - loop.startSec) % loop.lengthSec);
}

/* ── BPM analysis cases (Screen 11) ───────────────────────────────────── */

/** Half / double BPM: the readings an analyser can land on for one tempo. */
export const bpmMultiples = (bpm: number): { half: number; same: number; double: number } => ({ half: bpm / 2, same: bpm, double: bpm * 2 });

/**
 * SYNC in this model: match the follower's PLAYED tempo to the leader's,
 * using the ANALYSED BPMs, choosing ×½ / ×1 / ×2 so the needed fader stays
 * inside the tempo range (many programs do this; some do not). Returns the
 * follower's new pitch, or null when no multiple fits the range.
 */
export function syncPitch(leaderBpm: number, leaderPitch: number, followerBpm: number, range = PITCH_RANGE_PCT): number | null {
  const target = playedBpm(leaderBpm, leaderPitch);
  let best: number | null = null;
  for (const m of [1, 0.5, 2]) {
    const p = pitchFor(followerBpm * m, target);
    if (Math.abs(p) <= range + 1e-9 && (best == null || Math.abs(p) < Math.abs(best))) best = p;
  }
  return best;
}

/**
 * SYNC's phase step: the follower's new track time so its ANALYSED beat
 * phase equals the leader's ANALYSED beat phase (the nearest such time).
 */
export function syncPhaseTime(leaderGrid: Grid, leaderT: number, followerGrid: Grid, followerT: number): number {
  const lb = beatAt(leaderGrid, leaderT);
  const fb = beatAt(followerGrid, followerT);
  const off = phaseOffset(fb, lb); // + = follower ahead
  return timeOfBeat(followerGrid, fb - off);
}

/** mm:ss.t for a time readout. */
export function formatClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
}
