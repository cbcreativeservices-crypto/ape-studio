/**
 * Sound Systems Lab — the venue plot's conceptual coverage model.
 *
 * ILLUSTRATIVE, and badged as such on every plot that draws it: a loudspeaker
 * covers a wedge of its nominal horizontal angle, rolls off smoothly outside
 * it, and loses level with distance as a free-field point source (inverse
 * square). Subwoofers radiate in every direction. Sources sum as power. This
 * is the same family of model the Speaker Placement & Coverage lab draws its
 * heat map from — deliberately, so a learner who has seen that lab reads this
 * plot without re-learning it. It is not an SPL prediction and never
 * carries a dB scale.
 */

export type Beam = {
  x: number;
  y: number;
  /** 0 = straight down the plot (into the audience); positive = toward +x. */
  aimDeg: number;
  /** Horizontal coverage angle; 360 = omnidirectional (a subwoofer). */
  coverDeg: number;
  /** Relative level, 1 = a main. Fills and delays are quieter. */
  gain?: number;
};

/** Smooth pattern edge: 1 inside the nominal wedge, then a continuous
 *  −3 dB-per-8° roll-off with a floor so the back of a cabinet is not silent. */
function edge(offDeg: number, halfDeg: number): number {
  const over = offDeg - halfDeg;
  if (over <= 0) return 1;
  return Math.max(0.05, Math.pow(0.5, over / 8));
}

/** Relative level (linear, power-like) from one beam at a plot point. */
export function beamLevel(b: Beam, px: number, py: number, refDist = 60): number {
  const vx = px - b.x;
  const vy = py - b.y;
  const d = Math.max(10, Math.hypot(vx, vy));
  let pattern = 1;
  if (b.coverDeg < 360) {
    const th = (b.aimDeg * Math.PI) / 180;
    const ax = Math.sin(th);
    const ay = Math.cos(th);
    const cosA = (vx * ax + vy * ay) / d;
    const ang = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
    pattern = edge(ang, b.coverDeg / 2);
  }
  return (b.gain ?? 1) * pattern * Math.pow(refDist / d, 2);
}

/** Summed level from every beam, as a 0..1 heat value on a log-ish scale so
 *  the field reads as a gradient rather than a spotlight. */
export function fieldValue(beams: readonly Beam[], px: number, py: number): number {
  if (beams.length === 0) return 0;
  const sum = beams.reduce((s, b) => s + beamLevel(b, px, py), 0);
  // 10·log10 over ~30 "dB" of range, mapped to 0..1.
  const db = 10 * Math.log10(Math.max(1e-6, sum));
  return Math.max(0, Math.min(1, (db + 22) / 30));
}

/** The polygon of a beam's nominal wedge, for the plot's light-beam overlay. */
export function beamPolygon(b: Beam, radius: number, steps = 12): { x: number; y: number }[] {
  if (b.coverDeg >= 360) {
    return Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
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

/** Where two beams both cover a point strongly enough to interfere — the
 *  overlap zone the comb-filter lesson points at. */
export function overlapValue(a: Beam, b: Beam, px: number, py: number): number {
  const la = beamLevel(a, px, py);
  const lb = beamLevel(b, px, py);
  const lo = Math.min(la, lb);
  const hi = Math.max(la, lb);
  if (hi <= 0) return 0;
  // Strong overlap = both present within ~6 dB of each other and loud enough.
  const balance = lo / hi;
  return balance > 0.25 ? balance * Math.min(1, hi * 2) : 0;
}
