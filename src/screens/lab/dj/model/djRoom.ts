/**
 * djRoom — THE ROOM the event screens (19–24) share: a plan of a small club,
 * the speakers in it, and how loud each one is anywhere on the plan. Pure
 * TypeScript, no React Native; pinned by test/djEvent.test.ts. Documented in
 * docs/labs/dj/MODEL.md §15 (Stage 2b); sources in SOURCES.md (F40–F46, F55, F57).
 *
 * THE PLAN (metres, seen from above): x runs across the room (0 = the
 * middle; +x is the DJ's LEFT hand as they face the crowd), y runs from the
 * back wall (0) into the room. The DJ stands behind the booth table, facing
 * the crowd (+y). PA L stands at HOUSE LEFT — the audience's left, so −x,
 * the DJ's RIGHT (second audio review 2026-10-18 #2): in live sound "left"
 * is named from the audience, so the room hears the stereo image the right
 * way round. Which side is LEFT is the venue's call; many club systems run
 * mono. (The booth MONITORS are the DJ's own: monitor L on the DJ's left.)
 *
 *   back wall  y = 0
 *   DJ         (0, 0.8)            table y 1.1 … 1.8, x ±1.1
 *   monitors   (±1.25, 1.3), aimed at the DJ
 *   PA tops    real staging spots (see PLACEMENTS), 2.2 m up on stands
 *   floor      y 3.2 … 11, x ±6.4  (the floor centre (0, 7))
 *
 * COVERAGE IS REAL PHYSICS, SIMPLIFIED IN TWO STATED WAYS:
 *   1. A loudspeaker's NOMINAL coverage angle is its −6 dB angle: a 90°
 *      top is 6 dB down 45° off its axis. Outside that, level falls
 *      steeply — this model uses −6·(θ/θ½)² dB (−24 dB at 90° for a 90°
 *      box), then a floor of −24 … −28 dB behind it. That is the mid-band
 *      shape of a typical waveguide top (1–4 kHz); real boxes differ.
 *   2. Subwoofers are NEAR-OMNI: 20·log10(1 − 0.25·(1 − cos θ)) — 0 dB in
 *      front, about −6 dB straight behind.
 *   Distance: inverse square (−6 dB per doubling), from 1 m, in plan (the
 *   stand height and the room's reflections are not modelled). Several
 *   sources add as POWER (uncorrelated), which is the honest average for
 *   program music in a room. Bass from several subs adds COHERENTLY (in
 *   step +6 dB, out of step a deep null): the levels use the average, and
 *   the bass map draws the coherent sum at 60 Hz (`subsCoherentAt`) so the
 *   loud and quiet stripes of spaced subs show (audio review #12, visual
 *   review #16).
 *
 * LEVELS are a stated MODEL, never a measurement: each top makes
 * TOP_DBA_1M at 1 m on its axis when it is fed REF_FEED_DBFS average; the
 * booth monitors make MON_DBA_1M the same way. Everything else follows from
 * the feed the render actually measures.
 */

export type V2 = { x: number; y: number };

export const ROOM = {
  w: 14,
  d: 11.6,
  dj: { x: 0, y: 0.8 },
  table: { x: -1.1, y: 1.1, w: 2.2, d: 0.7 },
  /** Where the decks and the turntable sit on the table. */
  decks: { x: 0, y: 1.45 },
  floor: { x0: -6.4, x1: 6.4, y0: 3.2, y1: 11 },
  floorCentre: { x: 0, y: 7 },
  monitors: { L: { x: 1.25, y: 1.3 }, R: { x: -1.25, y: 1.3 } },
} as const;

/** The average feed (dBFS RMS) the levels below are quoted at. */
export const REF_FEED_DBFS = -20;
/** Each PA top at 1 m on axis, fed REF_FEED_DBFS, venue gain 0 dB (model). */
export const TOP_DBA_1M = 108;
/** Each booth monitor at 1 m on axis, fed REF_FEED_DBFS (model). */
export const MON_DBA_1M = 92;
/** Nominal horizontal coverage of the tops and the monitors (−6 dB angle,
 *  full width). */
export const TOP_COVERAGE_DEG = 90;
export const MON_COVERAGE_DEG = 90;

export type Placement = 'CORNERS' | 'STRAIGHT' | 'BEHIND';
export type SubPlace = 'TOPS' | 'BOOTH';

export type Speaker = { id: string; at: V2; aim: V2; kind: 'top' | 'sub' | 'monitor'; coverageDeg: number };

/** Real staging positions for the tops. */
export const PLACEMENTS: Record<Placement, { label: string; tops: { L: Speaker; R: Speaker }; blurb: string }> = {
  CORNERS: {
    label: 'FRONT CORNERS',
    blurb: 'On stands at the front corners of the stage, just in front of the booth line, each aimed in at the middle of the floor.',
    tops: {
      L: { id: 'topL', at: { x: -4.6, y: 2.6 }, aim: { x: 0, y: 7 }, kind: 'top', coverageDeg: TOP_COVERAGE_DEG },
      R: { id: 'topR', at: { x: 4.6, y: 2.6 }, aim: { x: 0, y: 7 }, kind: 'top', coverageDeg: TOP_COVERAGE_DEG },
    },
  },
  STRAIGHT: {
    label: 'CORNERS, STRAIGHT',
    blurb: 'The same stands, but aimed straight down the room instead of in toward the floor.',
    tops: {
      L: { id: 'topL', at: { x: -4.6, y: 2.6 }, aim: { x: -4.6, y: 9 }, kind: 'top', coverageDeg: TOP_COVERAGE_DEG },
      R: { id: 'topR', at: { x: 4.6, y: 2.6 }, aim: { x: 4.6, y: 9 }, kind: 'top', coverageDeg: TOP_COVERAGE_DEG },
    },
  },
  BEHIND: {
    label: 'BEHIND THE DJ',
    blurb: 'Against the back wall either side of the DJ, aimed out over the booth at the floor.',
    tops: {
      L: { id: 'topL', at: { x: -0.9, y: 0.3 }, aim: { x: -0.9, y: 7 }, kind: 'top', coverageDeg: TOP_COVERAGE_DEG },
      R: { id: 'topR', at: { x: 0.9, y: 0.3 }, aim: { x: 0.9, y: 7 }, kind: 'top', coverageDeg: TOP_COVERAGE_DEG },
    },
  },
};

export const SUB_PLACES: Record<SubPlace, { label: string; subs: Speaker[] }> = {
  TOPS: {
    label: 'UNDER THE TOPS',
    subs: [
      { id: 'subL', at: { x: -4.6, y: 2.45 }, aim: { x: -4.6, y: 9 }, kind: 'sub', coverageDeg: 360 },
      { id: 'subR', at: { x: 4.6, y: 2.45 }, aim: { x: 4.6, y: 9 }, kind: 'sub', coverageDeg: 360 },
    ],
  },
  BOOTH: {
    label: 'UNDER THE BOOTH',
    subs: [{ id: 'subC', at: { x: 0, y: 1.6 }, aim: { x: 0, y: 9 }, kind: 'sub', coverageDeg: 360 }],
  },
};

export const MONITORS: { L: Speaker; R: Speaker } = {
  L: { id: 'monL', at: ROOM.monitors.L, aim: ROOM.dj, kind: 'monitor', coverageDeg: MON_COVERAGE_DEG },
  R: { id: 'monR', at: ROOM.monitors.R, aim: ROOM.dj, kind: 'monitor', coverageDeg: MON_COVERAGE_DEG },
};

/* ── geometry ─────────────────────────────────────────────────────────── */

const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
const len = (v: V2): number => Math.hypot(v.x, v.y);

/** The angle (degrees, 0 … 180) between where `s` points and the direction
 *  to `p`. */
export function offAxisDeg(s: Speaker, p: V2): number {
  const a = sub(s.aim, s.at);
  const d = sub(p, s.at);
  const la = len(a);
  const ld = len(d);
  if (la < 1e-9 || ld < 1e-9) return 0;
  const c = Math.max(-1, Math.min(1, (a.x * d.x + a.y * d.y) / (la * ld)));
  return (Math.acos(c) * 180) / Math.PI;
}

/** A top's (or monitor's) directivity, dB, at θ off axis: −6 dB at half the
 *  nominal angle, −6·(θ/θ½)² inside ±90°, then −24 … −28 dB behind. */
export function topDirectivityDb(thetaDeg: number, coverageDeg = TOP_COVERAGE_DEG): number {
  const half = coverageDeg / 2;
  const t = Math.abs(thetaDeg);
  const at90 = -6 * (90 / half) ** 2;
  if (t <= 90) return Math.max(at90, -6 * (t / half) ** 2);
  return at90 - 4 * ((t - 90) / 90);
}

/** A subwoofer's directivity, dB: near-omni, about −6 dB straight behind. */
export function subDirectivityDb(thetaDeg: number): number {
  const c = Math.cos((thetaDeg * Math.PI) / 180);
  return 20 * Math.log10(1 - 0.25 * (1 - c));
}

/** Inverse square from 1 m (clamped at 0.5 m so a point on the box is finite). */
export const distanceDb = (m: number): number => -20 * Math.log10(Math.max(0.5, m));

/** Level change (dB) at `p` from source `s`, relative to its 1 m on-axis level. */
export function relLevelDb(s: Speaker, p: V2): number {
  const th = offAxisDeg(s, p);
  const d = s.kind === 'sub' ? subDirectivityDb(th) : topDirectivityDb(th, s.coverageDeg);
  return d + distanceDb(len(sub(p, s.at)));
}

/** Power sum of levels (dB). */
export function powerSum(dbs: readonly number[]): number {
  let s = 0;
  for (const d of dbs) if (d > -200) s += Math.pow(10, d / 10);
  return s > 0 ? 10 * Math.log10(s) : -Infinity;
}

/** The tops' level (dBA) at `p` for a feed of `feedDbfs` average, the venue
 *  gain and a placement. */
export function topsDbaAt(p: V2, place: Placement, feedDbfs: number, venueGainDb = 0): number {
  const t = PLACEMENTS[place].tops;
  const base = TOP_DBA_1M + (feedDbfs - REF_FEED_DBFS) + venueGainDb;
  return powerSum([base + relLevelDb(t.L, p), base + relLevelDb(t.R, p)]);
}

/** The booth monitors' level (dBA) at `p` for a booth feed of `boothDbfs`. */
export function monitorsDbaAt(p: V2, boothDbfs: number): number {
  const base = MON_DBA_1M + (boothDbfs - REF_FEED_DBFS);
  return powerSum([base + relLevelDb(MONITORS.L, p), base + relLevelDb(MONITORS.R, p)]);
}

/** Relative sub level (dB re the loudest point of the floor grid) — the
 *  bass map. */
export function subsRelAt(p: V2, place: SubPlace): number {
  return powerSum(SUB_PLACES[place].subs.map((s) => relLevelDb(s, p)));
}

/** The speed of sound (m/s) and the bass map's frequency (Hz). */
export const SOUND_MS = 343;
export const BASS_MAP_HZ = 60;

/** The subs' COHERENT sum at `p` (dB re one sub at 1 m on axis), at `hz`:
 *  each sub's pressure with its distance's phase, added as waves — in step
 *  they build (+6 dB for two), out of step they cancel (a deep null). Same mono feed, same polarity, no delay. */
export function subsCoherentAt(p: V2, place: SubPlace, hz: number = BASS_MAP_HZ): number {
  const k = (2 * Math.PI * hz) / SOUND_MS;
  let re = 0;
  let im = 0;
  for (const s of SUB_PLACES[place].subs) {
    const r = Math.max(0.5, len(sub(p, s.at)));
    const a = Math.pow(10, relLevelDb(s, p) / 20);
    re += a * Math.cos(-k * r);
    im += a * Math.sin(-k * r);
  }
  const m = Math.hypot(re, im);
  return 20 * Math.log10(Math.max(m, 1e-4));
}

/** A coverage grid over the whole plan (for the heat map): rows × cols of
 *  dB values, cell centres. */
export function coverageGrid(cols: number, rows: number, at: (p: V2) => number): { cols: number; rows: number; x0: number; y0: number; cw: number; ch: number; db: Float32Array } {
  const x0 = -ROOM.w / 2;
  const y0 = 0;
  const cw = ROOM.w / cols;
  const ch = ROOM.d / rows;
  const db = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) db[j * cols + i] = at({ x: x0 + (i + 0.5) * cw, y: y0 + (j + 0.5) * ch });
  return { cols, rows, x0, y0, cw, ch, db };
}

/** The floor's evenness for a placement: the spread (max − min, dB) of the
 *  tops over a grid of floor points, and the level at the floor centre. */
export function floorStats(place: Placement): { centre: number; min: number; max: number; spread: number } {
  const f = ROOM.floor;
  let mn = Infinity;
  let mx = -Infinity;
  for (let x = f.x0 + 0.4; x <= f.x1 - 0.4 + 1e-9; x += 1.0) {
    for (let y = f.y0 + 0.4; y <= f.y1 + 1e-9; y += 1.0) {
      const v = topsDbaAt({ x, y }, place, REF_FEED_DBFS);
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
  }
  const centre = topsDbaAt(ROOM.floorCentre, place, REF_FEED_DBFS);
  return { centre, min: mn, max: mx, spread: mx - mn };
}

/* ── the microphone's pickup (cardioid) ───────────────────────────────── */

/** A cardioid's pickup (dB) at φ off its axis: 20·log10((1 + cos φ) / 2),
 *  floored at −25 dB (no real capsule's rear null is perfect). */
export function cardioidDb(phiDeg: number): number {
  const g = (1 + Math.cos((phiDeg * Math.PI) / 180)) / 2;
  return Math.max(-25, 20 * Math.log10(Math.max(1e-6, g)));
}

/** The angle (deg) between the mic's axis (`axis`, a direction) and the
 *  direction from the mic at `m` to the speaker at `s`. */
export function micAngleDeg(m: V2, axis: V2, s: V2): number {
  const d = sub(s, m);
  const la = len(axis);
  const ld = len(d);
  if (la < 1e-9 || ld < 1e-9) return 0;
  const c = Math.max(-1, Math.min(1, (axis.x * d.x + axis.y * d.y) / (la * ld)));
  return (Math.acos(c) * 180) / Math.PI;
}
