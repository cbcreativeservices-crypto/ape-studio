/**
 * Sound Systems Lab — the venue plot's coverage model.
 *
 * ILLUSTRATIVE, and badged as such on every plot that draws it — but shaped
 * like the real thing, because a technician must recognise what they will
 * meet in the field (owner standard 2026-09-26):
 *
 *   • A loudspeaker's NOMINAL horizontal coverage angle is its −6 dB angle:
 *     on axis is the reference, the edge of the wedge is 6 dB down.
 *   • Outside the nominal angle the level keeps FALLING, and fast — with the
 *     square of the off-axis angle for a horn at mid/high frequencies —
 *     until the rear floor. Nothing "leaks" sideways at a level that reads.
 *   • A point source (a stack, a pole-mounted box, a cluster) loses 6 dB per
 *     doubling of distance; a flown line array, illustratively, loses 3 dB
 *     per doubling in its near field — which is why it throws.
 *   • A FLOWN rig has a near-field hole beneath it: the vertical pattern
 *     fires over the front rows. That hole is the reason front fills exist,
 *     so the model draws it.
 *   • Subwoofers radiate all round at low frequencies; a cardioid or
 *     end-fire sub array rejects to the rear by 12–24 dB.
 *   • Several sources sum as POWER (uncorrelated): two mains overlapping down
 *     the centre add about 3 dB there, not 6.
 *
 * Levels are in dB relative to a source ON AXIS AT ITS THROW DISTANCE (the
 * distance it was chosen to cover). The floor field maps +12 dB (too hot,
 * red) through 0 dB (in the window, yellow-green) and −6 dB (the nominal
 * edge, green) to −20 dB and below (dark: not covered).
 */

export type BeamPattern = 'horn' | 'omni' | 'cardioid' | 'endfire';
export type BeamRig = 'stack' | 'flown' | 'pole';
export type BeamSpread = 'point' | 'line';

export type Beam = {
  x: number;
  y: number;
  /** 0 = straight down the plot (into the audience); positive = toward +x
   *  (house right, the performer's left). */
  aimDeg: number;
  /** Nominal (−6 dB) horizontal coverage angle; 360 = omnidirectional. */
  coverDeg: number;
  /** Relative POWER gain, 1 = a main. Fills and delays are quieter. */
  gain?: number;
  /** On-axis reference distance, plot units: 0 dB there. A main covers to
   *  the back of a room; a front fill covers the first rows. */
  throw?: number;
  /** Point source (−6 dB/doubling) or a flown line array (−3 dB/doubling). */
  spread?: BeamSpread;
  /** Flown rigs fire over the front rows — the near-field hole. */
  rig?: BeamRig;
  /** Horn = a top cabinet; the others are subwoofer arrangements. */
  pattern?: BeamPattern;
};

export const REAR_FLOOR_DB = 24;
export const DEFAULT_THROW = 120;
/** One cabinet depth: level is never computed nearer than this. */
const MIN_DIST = 18;

/** Attenuation off axis, dB (positive = quieter), for a given pattern.
 *  Horn: exactly 6 dB down at the nominal edge, then with the square of the
 *  angle to the rear floor. Cardioid subs: −6 at 90°, floor behind.
 *  End-fire: −12 at 90°, floor behind. Omni: nothing. */
export function patternDb(pattern: BeamPattern, offDeg: number, coverDeg: number): number {
  const th = Math.abs(offDeg);
  switch (pattern) {
    case 'omni':
      return 0;
    case 'cardioid':
      return Math.min(REAR_FLOOR_DB, -20 * Math.log10(Math.max(1e-6, (1 + Math.cos((th * Math.PI) / 180)) / 2)));
    case 'endfire':
      return Math.min(REAR_FLOOR_DB, -40 * Math.log10(Math.max(1e-6, (1 + Math.cos((th * Math.PI) / 180)) / 2)));
    default: {
      if (coverDeg >= 360) return 0;
      const half = Math.max(1, coverDeg / 2);
      const ratio = th / half;
      return Math.min(REAR_FLOOR_DB, 6 * ratio * ratio);
    }
  }
}

/** Horn attenuation off axis — the top cabinet case, kept as its own name
 *  because most of the lab's beams are tops. */
export function offAxisDb(offDeg: number, coverDeg: number): number {
  return patternDb('horn', offDeg, coverDeg);
}

/** Off-axis angle, degrees, from the beam's aim to a plot point. */
export function offAxisDeg(b: Beam, px: number, py: number): number {
  const vx = px - b.x;
  const vy = py - b.y;
  const d = Math.max(1e-6, Math.hypot(vx, vy));
  const th = (b.aimDeg * Math.PI) / 180;
  const cosA = (vx * Math.sin(th) + vy * Math.cos(th)) / d;
  return (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Level from one beam at a plot point, dB relative to on-axis at its throw. */
export function beamLevelDb(b: Beam, px: number, py: number): number {
  const d = Math.max(MIN_DIST, Math.hypot(px - b.x, py - b.y));
  const throwD = b.throw ?? DEFAULT_THROW;
  const gainDb = 10 * Math.log10(Math.max(1e-6, b.gain ?? 1));
  const pattern = b.pattern ?? (b.coverDeg >= 360 ? 'omni' : 'horn');
  const patDb = patternDb(pattern, offAxisDeg(b, px, py), b.coverDeg);
  const distDb = (b.spread === 'line' ? 10 : 20) * Math.log10(d / throwD);
  // The near-field hole under a flown rig: −18 dB at the cabinet, gone by ~64 units.
  const shadowDb = b.rig === 'flown' ? 18 * (1 - smoothstep(22, 64, d)) : 0;
  return gainDb - patDb - distDb - shadowDb;
}

/** Power-summed level of every beam at a point, dB. −Infinity when empty. */
export function fieldDb(beams: readonly Beam[], px: number, py: number): number {
  if (beams.length === 0) return -Infinity;
  const p = beams.reduce((s, b) => s + Math.pow(10, beamLevelDb(b, px, py) / 10), 0);
  return 10 * Math.log10(Math.max(1e-12, p));
}

/** The floor field's window: +12 dB → 1 (red, too hot); 0 dB → 0.63 (in the
 *  window); −6 → 0.44 (green, the nominal edge); −12 → 0.25 (blue);
 *  −20 and below → 0 (dark, not covered). */
export const FIELD_TOP_DB = 12;
export const FIELD_BOTTOM_DB = -20;

export function fieldValue(beams: readonly Beam[], px: number, py: number): number {
  const db = fieldDb(beams, px, py);
  if (!Number.isFinite(db)) return 0;
  return Math.max(0, Math.min(1, (db - FIELD_BOTTOM_DB) / (FIELD_TOP_DB - FIELD_BOTTOM_DB)));
}

/** The nominal (−6 dB) wedge as a polygon (a circle for omni). */
export function beamPolygon(b: Beam, radius: number, steps = 14): { x: number; y: number }[] {
  if (b.coverDeg >= 360) {
    return Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return { x: b.x + Math.sin(a) * radius * 0.55, y: b.y + Math.cos(a) * radius * 0.55 };
    });
  }
  const half = (b.coverDeg / 2) * (Math.PI / 180);
  const aim = (b.aimDeg * Math.PI) / 180;
  const pts = [{ x: b.x, y: b.y }];
  for (let i = 0; i <= steps; i++) {
    const a = aim - half + (i / steps) * half * 2;
    pts.push({ x: b.x + Math.sin(a) * radius, y: b.y + Math.cos(a) * radius });
  }
  return pts;
}

/** A polar outline of a sub arrangement's pattern, radius by level. */
export function patternOutline(b: Beam, radius: number, samples = 36): { x: number; y: number }[] {
  const pattern = b.pattern ?? 'omni';
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < samples; i++) {
    const deg = (i / samples) * 360;
    const r = radius * Math.pow(10, -patternDb(pattern, deg, 360) / 20);
    const a = ((b.aimDeg + deg) * Math.PI) / 180;
    out.push({ x: b.x + Math.sin(a) * r, y: b.y + Math.cos(a) * r });
  }
  return out;
}

/** Where two beams both arrive within 6 dB of each other and the louder is
 *  above −12 dB — the seam where the same signal from two places interferes. */
export function overlapValue(a: Beam, b: Beam, px: number, py: number): number {
  const la = beamLevelDb(a, px, py);
  const lb = beamLevelDb(b, px, py);
  const hi = Math.max(la, lb);
  const diff = Math.abs(la - lb);
  if (hi < -12 || diff > 6) return 0;
  return 1 - diff / 6;
}
