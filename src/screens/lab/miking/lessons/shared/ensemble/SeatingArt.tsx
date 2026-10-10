/**
 * THE SEATING DRAWINGS (frame S) — every Lab 5 ensemble in three views:
 *
 *   <SeatingPlan/>     from above, the conductor's view (u = x, v = z)
 *   <SeatingFront/>    from the hall (u = x, v = y)
 *   <SeatingSection/>  cut along the centre line, from the conductor's right
 *                      (u = −z, v = y): the players within SECTION_SLICE of
 *                      the centre line
 *
 * Each player is an illustrated person at true size (the house figure: the
 * head is a skin-tone mass of the figure — FigureHead — never a separate
 * icon), on a chair or standing, with the real instrument in its playing
 * position: the bowed family from its own outline (bowedSpec.outline), the
 * winds and brass as their bodies and bells, timpani from Lab 1's timpano,
 * the grand piano, the harp; chairs, music stands, risers, the podium and the
 * conductor. Light from the upper left: a gradient for form, a lit rim, a
 * core shadow, a contour — batched by MATERIAL (one path per material per
 * depth layer) so a 50-player orchestra stays a few dozen draws.
 *
 * Static (D8): built once per seating and view, cached. `hi`: one section
 * lit (the rest dimmed) and outlined in amber — never colour alone (an
 * outline marks it too).
 */
import { useMemo, type ReactElement } from 'react';
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { FigureHead, FigureMass, headAbove, headFront, headProfile, limb } from '../players/PlayerFigure';
import { pt } from '../players/playerPose.ts';
import { outline, BOWED, fbHalf, fingerboardZ, halfWidth, stationsOf, stringYs, stringZ, type BowedSpec } from '../bowed/bowedSpec.ts';
import { TimpanoSide, TimpanoTop } from '../concert/TimpaniArt';
import { DrumPlan, CymbalPlan, CymbalSide, DrumExterior, SnareStandSide } from '../drums/DrumArt';
import { CONCERT_BD_36x16, CONCERT_SNARE_14x65 } from '../drums/concertSpec.ts';
import { DEG, planDir, uv, type StageView } from './frameS.ts';
import { DIMS, headTop, isVoice, sectionBox, BASS_DRUM_STATION, TIMPANI_SET, type Gear, type Seat, type Seating } from './seating.ts';
// Group 4: the band players and the stage gear (drawn into these batches) —
// the drum kit (one kind for groups 4 and 5) is Lab 1's shared kit, whole.
import { BAND_KINDS, bandElevInstrument, bandElevWhole, bandGearElev, bandGearPlan, bandPlanInstrument, bandPlanWhole, gearBehind, type BandTools } from './BandArt';
// group 5 (sections): the mallet rows, the congas — reused, never redrawn from scratch.
import { KIND, STAND_LIFT } from './seating.ts';
import { isNatural, ROWS } from '../mallets/malletSpec.ts';
import { CONGA_DIMS } from '../../m04aCongas/model.ts';
// group 2: the voices' sizes (a child is the adult figure at its scale).
import { VOX } from './seatingVoices.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const IN = 25.4;
/** The section view shows the players within this distance of the centre line (mm). */
export const SECTION_SLICE = 1700;
/** The timpani set round its player (seating.ts TIMPANI_SET; pure, so the labels share it). */
const TIMP = TIMPANI_SET;
/** A grand piano's drawn size (mm): the piano family's ≈ 2.1 m grand, 1.5 m wide. */
export const GRAND = { L: 2100, W: 1500 } as const;

/* ── materials (upper-left light; the house palette) ── */
type Mat = { ramp: string[]; rim: string; core: string; edge: string; rimW: number; coreW: number };
const MATS = {
  /** A bowed instrument's ribs seen from above at a grazing angle (art pass 2026-10-10): the varnish, in shade.
   *  FIRST, so the fingerboard and the pegbox paint over it. */
  rib: { ramp: ['#8a4a1e', '#5a2a0e', '#381806', '#1c0b03'], rim: '#c98a52', core: '#0e0501', edge: '#140702', rimW: 3, coreW: 10 },
  varnish: { ramp: ['#e8a860', '#b86a2a', '#7a3a12', '#3d1a06'], rim: '#ffd9a0', core: '#1a0a02', edge: '#2a1206', rimW: 6, coreW: 22 },
  ebony: { ramp: ['#3a332e', '#1d1815', '#0c0a08', '#050403'], rim: '#8a7d70', core: '#000', edge: '#000', rimW: 3, coreW: 8 },
  brass: { ramp: ['#fff1b8', '#e8c25c', '#a87a1e', '#5e3e0a'], rim: '#fffbe0', core: '#2e1e04', edge: '#3a2806', rimW: 5, coreW: 18 },
  silver: { ramp: ['#ffffff', '#cfd4dc', '#8a909c', '#4a4e57'], rim: '#ffffff', core: '#1c1e22', edge: '#2a2c32', rimW: 3, coreW: 8 },
  blackwood: { ramp: ['#4a4a52', '#26262c', '#101013', '#050506'], rim: '#9a9aa6', core: '#000', edge: '#000', rimW: 3, coreW: 10 },
  maple: { ramp: ['#e0a060', '#a0582a', '#5e2c10', '#2e1406'], rim: '#ffd0a0', core: '#140802', edge: '#1e0c04', rimW: 4, coreW: 14 },
  chair: { ramp: ['#4a4c55', '#2e3036', '#1b1c21', '#0f1013'], rim: '#8d929d', core: '#050506', edge: '#08080a', rimW: 5, coreW: 20 },
  steel: { ramp: ['#6a6e78', '#4a4e57', '#2a2c32', '#16171b'], rim: '#a8adb8', core: '#050506', edge: '#0b0c0f', rimW: 3, coreW: 8 },
  riser: { ramp: ['#4a3826', '#3a2c1e', '#2a1f15', '#1c140d'], rim: '#8a6a48', core: '#0a0704', edge: '#120c07', rimW: 10, coreW: 40 },
  harpGold: { ramp: ['#fff0c0', '#e0b860', '#9a7020', '#4a3208'], rim: '#fffbe8', core: '#2a1a02', edge: '#3a2604', rimW: 5, coreW: 16 },
  piano: { ramp: ['#4a4c54', '#1e1f24', '#0b0b0d', '#030304'], rim: '#9a9eaa', core: '#000', edge: '#000', rimW: 6, coreW: 24 },
  // Group 4 (BandArt.tsx): amp and wedge vinyl, grille cloth, a sunburst
  // guitar, a cherry bass, the keyboard's keys.
  tolex: { ramp: ['#3c3e45', '#25262b', '#16171a', '#0b0b0d'], rim: '#80848f', core: '#000', edge: '#050506', rimW: 5, coreW: 18 },
  cloth: { ramp: ['#8a8170', '#5e5748', '#3a352b', '#221f19'], rim: '#c9bfa6', core: '#0e0c09', edge: '#1a1712', rimW: 3, coreW: 10 },
  sunburst: { ramp: ['#f0b25a', '#c4561c', '#6e1e0a', '#260803'], rim: '#ffd9a0', core: '#120402', edge: '#1c0703', rimW: 5, coreW: 18 },
  cherry: { ramp: ['#e06a6a', '#a2222a', '#5a0c12', '#2a0507'], rim: '#ffc0c0', core: '#140203', edge: '#1e0406', rimW: 5, coreW: 18 },
  ivory: { ramp: ['#ffffff', '#eeeae0', '#cfc9bb', '#9e9889'], rim: '#ffffff', core: '#5e594d', edge: '#4a463c', rimW: 2, coreW: 6 },
  /** group 5: a rawhide drum head (the hand-drum family's RAWHIDE tones). */
  hide: { ramp: ['#f6e9cc', '#e6cf9e', '#c9a874', '#8e7046'], rim: '#fffaf0', core: '#5a4428', edge: '#5e4626', rimW: 4, coreW: 14 },
} satisfies Record<string, Mat>;
type MatId = keyof typeof MATS;
type FigTone = 'shirt' | 'trousers' | 'skin' | 'shoe' | 'seat';

const lookCache = new WeakMap<SkPath, { rim: SkPath; core: SkPath }>();
function lookOf(path: SkPath, m: Mat) {
  const hit = lookCache.get(path);
  if (hit) return hit;
  const shifted = (dx: number, dy: number) => {
    const q = path.copy();
    q.offset(dx, dy);
    return q;
  };
  const look = { rim: Skia.Path.MakeFromOp(path, shifted(m.rimW * 0.8, m.rimW), PathOp.Difference) ?? make(), core: Skia.Path.MakeFromOp(path, shifted(-m.coreW * 0.75, -m.coreW), PathOp.Difference) ?? make() };
  lookCache.set(path, look);
  return look;
}

/** One material mass: gradient, core shadow, lit rim, contour. */
function Mass({ path, mat, contour = 2 }: { path: SkPath; mat: MatId; contour?: number }) {
  const m = MATS[mat];
  const look = lookOf(path, m);
  const b = path.getBounds();
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={m.ramp} positions={[0, 0.38, 0.72, 1]} />
      </Path>
      <Group clip={path}>
        <Path path={look.core} color={m.core} opacity={0.5}>
          <BlurMask blur={m.coreW * 0.45} style="normal" />
        </Path>
      </Group>
      <Path path={look.rim} color={m.rim} opacity={0.55} />
      <Path path={path} style="stroke" strokeWidth={contour} color={m.edge} opacity={0.9} />
    </Group>
  );
}

/* ── a BATCH: one path per material, per depth layer ── */
type Batch = {
  fig: Record<FigTone, SkPath>;
  mat: Record<MatId, SkPath>;
  /** Thin strokes: bow hair and sticks, music-stand legs, chair legs, strings. */
  hair: SkPath;
  stick: SkPath;
  legs: SkPath;
  desks: SkPath;
  /** Dark openings (bells seen into, f-holes). */
  holes: SkPath;
  /** Items drawn by their own components (timpani, the snare, a cymbal, the piano). */
  extra: { key: string; el: ReactElement }[];
};
function newBatch(): Batch {
  return {
    fig: { shirt: make(), trousers: make(), skin: make(), shoe: make(), seat: make() },
    mat: Object.fromEntries((Object.keys(MATS) as MatId[]).map((k) => [k, make()])) as Record<MatId, SkPath>,
    hair: make(),
    stick: make(),
    legs: make(),
    desks: make(),
    holes: make(),
    extra: [],
  };
}

/** Add a part to a figure mass as a UNION (figure review 2026-10-08): with
 *  addPath, a torso and the shoulder oval drawn in opposite directions
 *  cancelled where they overlapped — a hole over the chest that read as a
 *  coat hanger and a long neck. */
function addFig(b: Batch, tone: FigTone, q: SkPath): void {
  b.fig[tone] = Skia.Path.MakeFromOp(b.fig[tone], q, PathOp.Union) ?? b.fig[tone];
}

/* ── geometry helpers (build time) ── */
type P2 = { u: number; v: number };
const P = (u: number, v: number): P2 => ({ u, v });
/** A path-op result as a WINDING path (ops may return even-odd; batch paths fill by winding). */
function asWinding(p: SkPath | null): SkPath {
  if (!p) return make();
  return p.makeAsWinding() ?? p;
}
function capsule(a: P2, b: P2, r: number): SkPath {
  return limb([pt(a.u, a.v), pt(b.u, b.v)], [r, r]);
}
function taper(a: P2, b: P2, ra: number, rb: number): SkPath {
  return limb([pt(a.u, a.v), pt(b.u, b.v)], [ra, rb]);
}
function ellipse(c: P2, rx: number, ry: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(c.u - rx, c.v - ry, rx * 2, ry * 2));
  return p;
}
function rr(x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function poly(pts: readonly P2[]): SkPath {
  const p = make();
  pts.forEach((q, i) => (i === 0 ? p.moveTo(q.u, q.v) : p.lineTo(q.u, q.v)));
  p.close();
  return p;
}
function line(p: SkPath, a: P2, b: P2): SkPath {
  p.moveTo(a.u, a.v);
  p.lineTo(b.u, b.v);
  return p;
}
/** A bell's flare from a narrow end to a wide mouth (a trapezoid with a curved mouth). */
function flare(a: P2, b: P2, ra: number, rb: number): SkPath {
  const L = Math.hypot(b.u - a.u, b.v - a.v) || 1;
  const nx = -(b.v - a.v) / L;
  const ny = (b.u - a.u) / L;
  const p = make();
  p.moveTo(a.u + nx * ra, a.v + ny * ra);
  p.quadTo((a.u + b.u) / 2 + nx * ra * 1.4, (a.v + b.v) / 2 + ny * ra * 1.4, b.u + nx * rb, b.v + ny * rb);
  p.lineTo(b.u - nx * rb, b.v - ny * rb);
  p.quadTo((a.u + b.u) / 2 - nx * ra * 1.4, (a.v + b.v) / 2 - ny * ra * 1.4, a.u - nx * ra, a.v - ny * ra);
  p.close();
  return p;
}
/** A bowed instrument's outline as a path: its body axis from `tail` toward
 *  `dir` (unit, in the view), scaled `k` along the axis (foreshortening) and
 *  `w` across. */
function bodyPath(spec: BowedSpec, tail: P2, dir: P2, k = 1, w = 1): SkPath {
  const pts = outline(spec, 40);
  const x0 = pts[0][0];
  const nx = -dir.v;
  const ny = dir.u;
  return poly(pts.map(([x, y]) => P(tail.u + dir.u * (x - x0) * k + nx * y * w, tail.v + dir.v * (x - x0) * k + ny * y * w)));
}
const bodyLen = (s: BowedSpec) => s.body.mm;
const neckLen = (s: BowedSpec) => s.overall.mm - s.body.mm;

/** Add a path (in a seat's local plan frame: x = the player's right, y =
 *  BACK; the player faces −y) to a batch path, placed at the seat. */
function placer(s: Seat) {
  const F = (s.face * Math.PI) / 180;
  // A child is the adult figure at its scale (group 2; drawn from above only).
  const k = s.kind === 'child' ? VOX.child.scale : 1;
  const m = Skia.Matrix().translate(s.p.x, s.p.z).rotate(F).scale(k, k);
  return (into: SkPath, local: SkPath) => {
    const q = local.copy();
    q.transform(m);
    into.addPath(q);
  };
}
/** A local plan point (x right, y back) of a seat, in plan (u, v). */
function toPlan(s: Seat, x: number, y: number): P2 {
  const F = (s.face * Math.PI) / 180;
  return P(s.p.x + x * Math.cos(F) - y * Math.sin(F), s.p.z + x * Math.sin(F) + y * Math.cos(F));
}

/**
 * A CELLO or DOUBLE BASS from above, as it is held: upright, its axis leaning
 * back toward the player by `tilt` from vertical (art pass 2026-10-10 — the
 * old drawing was the body outline alone, squashed, and read as a blob).
 *
 * Real sizes (bowedSpec, frame B): cello body 755 × 439 mm, ribs 120, string
 * 690, bridge 90 high × 90 wide, endpin 300; double bass body 1162 × 700 mm,
 * ribs 220, string 1115, bridge 160 × 160, endpin 250. Tilt from vertical: a
 * seated cello about 25°, a standing bass about 20° (drawing default).
 *
 * The projection is the real one: a point at frame-B (x, y, z) lands at
 *   tail + dir·(x − tailX)·sin(tilt) + side·y − dir·z·cos(tilt)
 * (x along the axis climbs toward the player; z out of the top leans away),
 * so from above you see the top foreshortened, the RIBS of the upper bouts
 * as a band on the player's side (the back sits rib-depth behind the top),
 * and the fingerboard, the bridge and the strings standing off the top.
 * The highest string is on the player's right. Returns the key points the
 * arms reach for, in the seat's local frame (x right, y back).
 */
function uprightPlan(b: Batch, put: (into: SkPath, local: SkPath) => void, spec: BowedSpec, tail: P2, lean: P2, tiltDeg: number) {
  const st = stationsOf(spec);
  const L = Math.hypot(lean.u, lean.v) || 1;
  const dir = P(lean.u / L, lean.v / L);
  const side = P(dir.v, -dir.u); // +y (the highest string) → the player's right
  const sn = Math.sin(tiltDeg * DEG);
  const cs = Math.cos(tiltDeg * DEG);
  const at = (x: number, y: number, z = 0): P2 => {
    const a = (x - st.tailX) * sn - z * cs;
    return P(tail.u + dir.u * a + side.u * y, tail.v + dir.v * a + side.v * y);
  };
  const shape = (pts: readonly (readonly [number, number])[], z = 0, push = 0) =>
    poly(pts.map(([x, y]) => {
      const q = at(x, y, z);
      return P(q.u + dir.u * push, q.v + dir.v * push);
    }));
  const rim = outline(spec);
  const top = shape(rim);
  // The ribs: the body swept from the top back to the back plate (rib depth
  // toward the player, which is depth / sin(tilt) along frame-B x), minus the
  // top — only the shoulders' ribs show. The sweep's half-width is the running
  // maximum of the body's half-width over that shift (no stacked outlines).
  const D = (spec.rib.mm * cs) / Math.max(0.05, sn);
  const M = 240;
  const x0 = st.tailX;
  const x1 = st.neckX + D;
  const step = (x1 - x0) / M;
  const hw = Array.from({ length: M + 1 }, (_, j) => halfWidth(spec, x0 + j * step));
  const win = Math.ceil(D / step);
  const sw = hw.map((_, j) => {
    let m = 0;
    for (let k = Math.max(0, j - win); k <= j; k++) m = Math.max(m, hw[k]);
    return m;
  });
  const sweptPts: [number, number][] = [...sw.map((w, j) => [x0 + j * step, -w] as [number, number]), ...[...sw].reverse().map((w, j) => [x0 + (M - j) * step, w] as [number, number])];
  const ribs = asWinding(Skia.Path.MakeFromOp(shape(sweptPts), top, PathOp.Difference));
  put(b.mat.rib, ribs);
  put(b.mat.varnish, top);
  // The f-holes: a slit between two round eyes, each side of the bridge.
  const [f0, f1] = spec.fholeX;
  for (const sy of [-1, 1]) {
    const y = sy * spec.fholeY.mm;
    const slit = spec.lower.mm * 0.012;
    put(b.holes, poly([at(f0, y - slit), at(f1, y - slit * 0.6), at(f1, y + slit * 0.6), at(f0, y + slit)]));
    put(b.holes, ellipse(at(f0, y + sy * slit), slit * 1.6, slit * 1.6));
    put(b.holes, ellipse(at(f1, y - sy * slit), slit * 1.4, slit * 1.4));
  }
  // The tailpiece (ebony), narrow at the saddle, wide under the strings.
  const [t0, t1] = spec.tailpiece;
  const tz0 = stringZ(spec, t0) * 0.6;
  const tz1 = stringZ(spec, t1) - spec.bridgeH.mm * 0.08;
  const tw0 = spec.bridgeW.mm * 0.16;
  const tw1 = spec.bridgeW.mm * 0.34;
  put(b.mat.ebony, poly([at(t0, -tw0, tz0), at(t1, -tw1, tz1), at(t1 + 12, 0, tz1), at(t1, tw1, tz1), at(t0, tw0, tz0)]));
  // The bridge: its feet on the top, its crown under the strings (pale maple).
  const bw = spec.bridgeW.mm / 2;
  const bh = spec.bridgeH.mm;
  // Near-vertical, it is seen almost face-on from above: the feet, the waist,
  // the shoulders and the arched crown (a drawing of the usual outline).
  const bridge: [number, number][] = [
    [-0.92, 0], [-0.62, 0], [-0.5, 0.2], [-0.26, 0.24], [0, 0.26], [0.26, 0.24], [0.5, 0.2], [0.62, 0], [0.92, 0],
    [0.88, 0.12], [0.56, 0.42], [0.74, 0.7], [0.66, 0.86], [0.4, 0.96], [0, 1], [-0.4, 0.96], [-0.66, 0.86], [-0.74, 0.7], [-0.56, 0.42], [-0.88, 0.12],
  ];
  put(b.mat.hide, poly(bridge.map(([y, z]) => at(0, y * bw, z * bh))));
  put(b.holes, ellipse(at(0, 0, bh * 0.6), bw * 0.1, bh * 0.08 * cs));
  // The fingerboard (ebony), from its free end to the nut, under the strings.
  const fb: P2[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const x = st.fbEndX + ((st.nutX - st.fbEndX) * i) / n;
    fb.push(at(x, -fbHalf(spec, x), fingerboardZ(spec, x)));
  }
  for (let i = n; i >= 0; i--) {
    const x = st.fbEndX + ((st.nutX - st.fbEndX) * i) / n;
    fb.push(at(x, fbHalf(spec, x), fingerboardZ(spec, x)));
  }
  put(b.mat.ebony, poly(fb));
  // The pegbox and the scroll (varnish), past the nut; the pegs (cello:
  // ebony, two each side) or the bass's machine heads (a brass plate each
  // side, two keys each).
  const zn = fingerboardZ(spec, st.nutX);
  const scrollD = spec.upper.mm * 0.19;
  const pb0 = st.nutX + 10;
  const pb1 = st.scrollX - scrollD * 0.8;
  const pbw = spec.fbNut.mm * 0.62;
  put(b.mat.varnish, poly([at(pb0, -pbw, zn), at(pb1, -pbw * 0.9, zn), at(pb1, pbw * 0.9, zn), at(pb0, pbw, zn)]));
  put(b.holes, poly([at(pb0 + 20, -pbw * 0.45, zn), at(pb1 - 10, -pbw * 0.4, zn), at(pb1 - 10, pbw * 0.4, zn), at(pb0 + 20, pbw * 0.45, zn)]));
  put(b.mat.varnish, ellipse(at(st.scrollX - scrollD * 0.5, 0, zn), scrollD * 0.42, scrollD * 0.5));
  put(b.holes, ellipse(at(st.scrollX - scrollD * 0.5, 0, zn), scrollD * 0.12, scrollD * 0.14));
  const bass = spec.id === 'bass';
  for (const [i, sy] of [[0, -1], [1, 1], [2, -1], [3, 1]] as const) {
    const x = pb0 + (pb1 - pb0) * (bass ? [0.3, 0.3, 0.72, 0.72][i] : [0.22, 0.42, 0.62, 0.82][i]);
    const out = bass ? spec.fbNut.mm * 1.7 : spec.fbNut.mm * 1.9;
    if (bass) put(b.mat.brass, poly([at(pb0 + (pb1 - pb0) * 0.12, sy * pbw, zn), at(pb0 + (pb1 - pb0) * 0.9, sy * pbw, zn), at(pb0 + (pb1 - pb0) * 0.9, sy * (pbw + 10), zn), at(pb0 + (pb1 - pb0) * 0.12, sy * (pbw + 10), zn)]));
    put(bass ? b.mat.silver : b.mat.ebony, capsule(at(x, sy * pbw, zn), at(x, sy * (pbw + out), zn), bass ? 7 : 9));
    put(bass ? b.mat.silver : b.mat.ebony, ellipse(at(x, sy * (pbw + out), zn), bass ? 16 : 14, bass ? 22 : 18));
  }
  // The four strings: the tailpiece, over the bridge, to the nut.
  for (let i = 0; i < 4; i++) {
    const yt = stringYs(spec, t1)[i];
    const yb = stringYs(spec, 0)[i];
    const yn = stringYs(spec, st.nutX)[i];
    const s0 = at(t1, yt * 0.9, tz1);
    const s1 = at(0, yb, bh);
    const s2 = at(st.nutX, yn, stringZ(spec, st.nutX));
    const p = make();
    p.moveTo(s0.u, s0.v);
    p.lineTo(s1.u, s1.v);
    p.lineTo(s2.u, s2.v);
    put(b.hair, p);
  }
  // The endpin: the axis continued below the tail block to the floor.
  const pin = spec.endpin?.mm ?? 0;
  const e0 = at(st.tailX, 0, -spec.rib.mm / 2);
  const e1 = P(e0.u - dir.u * pin * sn, e0.v - dir.v * pin * sn);
  put(b.mat.ebony, ellipse(e0, 20, 20));
  put(b.mat.steel, capsule(e0, e1, bass ? 8 : 6));
  return {
    /** The left hand on the fingerboard (about 260 mm below the nut). */
    lh: at(st.nutX - 260, -fbHalf(spec, st.nutX - 260) * 0.4, fingerboardZ(spec, st.nutX - 260)),
    /** The bow's contact point (between the bridge and the fingerboard's end). */
    contact: at(st.contactX, 0, stringZ(spec, st.contactX)),
    /** The plucking point (over the fingerboard's free end). */
    pluck: at(st.fbEndX + 40, 0, stringZ(spec, st.fbEndX + 40)),
  };
}

/** The grand's case outline from above as points (x across, + = treble;
 *  a = ahead of the keyboard's front edge), mm: the front, the treble side's
 *  straight run, the knee, the long concave bentside, the convex tail round
 *  to the straight spine. One outline for the plan and the elevations. */
export const GRAND_OUTLINE: readonly (readonly [number, number])[] = (() => {
  const W = GRAND.W;
  const L = GRAND.L;
  const pts: [number, number][] = [[-W / 2, 0], [W / 2, 0], [W / 2, L * 0.25]];
  const quad = (p0: readonly number[], c: readonly number[], p1: readonly number[]) => {
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const m = 1 - t;
      pts.push([m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1]]);
    }
  };
  const cubic = (p0: readonly number[], c1: readonly number[], c2: readonly number[], p1: readonly number[]) => {
    for (let i = 1; i <= 20; i++) {
      const t = i / 20;
      const m = 1 - t;
      const w = [m * m * m, 3 * m * m * t, 3 * m * t * t, t * t * t];
      pts.push([w[0] * p0[0] + w[1] * c1[0] + w[2] * c2[0] + w[3] * p1[0], w[0] * p0[1] + w[1] * c1[1] + w[2] * c2[1] + w[3] * p1[1]]);
    }
  };
  quad([W / 2, L * 0.25], [W / 2, L * 0.305], [W * 0.44, L * 0.362]);
  cubic([W * 0.44, L * 0.362], [W * 0.28, L * 0.515], [-W * 0.06, L * 0.72], [-W * 0.12, L * 0.88]);
  cubic([-W * 0.12, L * 0.88], [-W * 0.163, L * 1.0], [-W * 0.5, L * 1.0], [-W / 2, L * 0.9]);
  return pts;
})();
/** The grand's lid on full stick: opened 45° about the spine (drawing default). */
export const GRAND_LID_DEG = 45;

/**
 * A 2.1 m GRAND PIANO from above, in a seat's local frame (x = the player's
 * right, y back; the keyboard's front edge at y = −330, the case ahead of it).
 * Art pass 2026-10-10 — real sizes of the class: case 2110 × 1480 mm; 88 keys
 * over 1225 mm (52 naturals at 23.5 mm), naturals visible 150 mm, sharps 95 mm
 * at the back; cheeks 128 mm each side; rim 60 mm; the music desk 900 mm wide.
 * The outline: the straight spine (bass), a short straight treble side, the
 * long CONCAVE bentside, the convex tail. The lid is hinged on the spine and
 * open on full stick (45°), so from above it covers the bass side
 * (its width × cos 45°) and the plate, the strings and the soundboard show
 * on the treble side (the music desk taken off, as on a concert stage).
 * Built once.
 */
let GRAND_PLAN: { body: SkPath; board: SkPath; plate: SkPath; cutouts: SkPath; strings: SkPath; whites: SkPath; blacks: SkPath } | null = null;
export function grandPlan() {
  if (GRAND_PLAN) return GRAND_PLAN;
  const W = GRAND.W;
  const L = GRAND.L;
  const y0 = -330;
  const f = (x: number, ahead: number) => P(x, y0 - ahead);
  const outlineAt = (k: number) => {
    // k: inset toward the inside (mm), applied by scaling about the case's middle.
    const sx = (W / 2 - k) / (W / 2);
    const sa = (L - 2 * k) / L;
    return poly(GRAND_OUTLINE.map(([x, a]) => f(x * sx, k + a * sa)));
  };
  const outer = outlineAt(0);
  const inner = outlineAt(60);
  const plate = outlineAt(110);
  // The soundboard shows as a margin round the plate (spruce under varnish).
  const board = Skia.Path.MakeFromOp(inner, plate, PathOp.Difference) ?? make();
  // The plate's openings (dark): three bays between the struts.
  const cutouts = make();
  // (Only the bays on the treble side: the open lid hides the rest.)
  for (const [x, a0, a1, w] of [
    [W * 0.37, L * 0.19, L * 0.29, 100],
    [W * 0.24, L * 0.36, L * 0.5, 110],
  ] as const) {
    const q0 = f(x - w / 2, a0);
    const q1 = f(x + w / 2, a1);
    cutouts.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(q0.u, q1.u), Math.min(q0.v, q1.v), Math.abs(q1.u - q0.u), Math.abs(q1.v - q0.v)), w / 2, w / 2));
  }
  // The lid on full stick: the closed lid's outline squeezed toward the spine.
  const tilt = Math.cos(GRAND_LID_DEG * DEG);
  const lid = outer.copy();
  lid.transform(Skia.Matrix().translate(-W / 2, 0).scale(tilt, 1).translate(W / 2, 0));
  const lidEdge = -W / 2 + W * tilt;
  // The front flap folds back onto the lid: nothing of the lid ahead of the fallboard.
  const lidOpen = Skia.Path.MakeFromOp(lid, rr(-W, y0 - 250, W, y0 - L - 100, 0), PathOp.Intersect) ?? lid;
  // The strings, front to back over the plate, where the lid does not hide
  // them: each runs from behind the dampers to where it meets the plate's edge.
  const strings = make();
  for (let x = lidEdge + 40; x < W / 2 - 130; x += 36) {
    const q0 = f(x, 420);
    let a = 420;
    while (a < L && plate.contains(f(x - (a - 420) * 0.04, a + 40).u, f(x - (a - 420) * 0.04, a + 40).v)) a += 20;
    const q1 = f(x - (a - 420) * 0.04, a);
    strings.moveTo(q0.u, q0.v);
    strings.lineTo(q1.u, q1.v);
  }
  // The case: the rim ring, the cheeks and the key slip round the keys, the
  // fallboard, the music desk and the open lid — all piano black.
  const keysW = 1225;
  const keyBed = rr(-keysW / 2, y0 + 1, keysW / 2, y0 - 150, 2);
  let body = Skia.Path.MakeFromOp(outer, inner, PathOp.Difference) ?? make();
  const front = rr(-W / 2, y0, W / 2, y0 - 250, 6); // cheeks + fallboard
  body = Skia.Path.MakeFromOp(body, front, PathOp.Union) ?? body;
  body = Skia.Path.MakeFromOp(body, keyBed, PathOp.Difference) ?? body;
  body = Skia.Path.MakeFromOp(body, lidOpen, PathOp.Union) ?? body;
  // The keys: 52 naturals, the sharps in twos and threes (A0 to C8).
  const whites = rr(-keysW / 2, y0, keysW / 2, y0 - 150, 2);
  const blacks = make();
  const wk = keysW / 52;
  // Natural index i from A0: the note names A B C D E F G repeating; a sharp
  // follows every natural except B and E, and not after the last C.
  for (let i = 0; i < 51; i++) {
    const name = 'ABCDEFG'[i % 7];
    if (name === 'B' || name === 'E') continue;
    const x = -keysW / 2 + (i + 1) * wk;
    blacks.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 6.5, y0 - 150, 13, 95), 2, 2));
  }
  const lines = make();
  for (let i = 1; i < 52; i++) {
    const x = -keysW / 2 + i * wk;
    lines.addRect(Skia.XYWHRect(x - 0.8, y0 - 150, 1.6, 150));
  }
  blacks.addPath(lines);
  // As WINDING paths: a batch path takes an empty-path addPath's fill type, so
  // an even-odd ring added after another seat's part would fill its hole.
  GRAND_PLAN = { body: asWinding(body), board: asWinding(board), plate, cutouts, strings, whites, blacks };
  return GRAND_PLAN;
}

/* ═══════════════════ the CONCERT BASS DRUM (art pass 2026-10-10) ═══════════════════
 * 36 × 16 in (914 × 406 mm, concertSpec CONCERT_BD_36x16): wood hoops 32 mm
 * wide and 14 thick, 12 tension rods a head, calf-white heads; on a tilting
 * stand (a yoke either side of the shell on a castored base), its centre about
 * 760 mm up. The heads face the player's left and right. Before this pass the
 * plan was a varnished slab and the elevation had the head and the shell
 * swapped (a 400 × 914 box where the head faces the viewer). */
const BD = { R: CONCERT_BD_36x16.d.mm / 2, D: CONCERT_BD_36x16.depth.mm, hoopH: CONCERT_BD_36x16.hoop.h.mm, hoopT: CONCERT_BD_36x16.hoop.t.mm, rods: CONCERT_BD_36x16.rods.n.mm, cy: BASS_DRUM_STATION.up } as const;
const BD_SHELL = ['#2a160a', '#7a4a20', '#d9a766', '#c48f52', '#7a4a20', '#2a160a'];
const BD_HOOP = ['#3a220e', '#b8803f', '#6e4219', '#2f1b0a'];
const BD_POS = [0, 0.12, 0.3, 0.55, 0.85, 1];
const CHROME_RAMP = ['#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];

/** From above, in the seat's local frame (x right, y back), its centre at (0, cy). */
function BassDrumPlan({ cy }: { cy: number }) {
  const g = useMemo(() => {
    const { R, D, hoopH, hoopT } = BD;
    const shell = rr(-D / 2, cy - R, D / 2, cy + R, 6);
    const hoops = make();
    for (const sx of [-1, 1]) hoops.addPath(rr(sx * (D / 2 + 8), cy - R - hoopT - 3, sx * (D / 2 + 8 - hoopH), cy + R + hoopT + 3, 6));
    // The rods on the upper half, seen from above: each from its hoop claw in
    // along the shell to its lug (a rod at angle θ lies at y = −(R + 22)·cos θ).
    const rods = make();
    const lugs = make();
    for (let i = 0; i < BD.rods; i++) {
      const th = ((i + 0.5) / BD.rods) * Math.PI * 2;
      if (Math.sin(th) < 0.15) continue; // the lower half is under the shell
      const y = cy - (R + 22) * Math.cos(th);
      for (const sx of [-1, 1]) {
        rods.moveTo(sx * (D / 2 - 10), y);
        rods.lineTo(sx * (D / 2 - 120), y);
        lugs.addPath(rr(sx * (D / 2 - 120), y - 9, sx * (D / 2 - 160), y + 9, 4));
      }
    }
    // The stand: the yoke arms either side of the shell, the base rails, four casters.
    const frame = make();
    for (const sy of [-1, 1]) frame.addPath(rr(-40, cy + sy * (R + 30), 40, cy + sy * (R + 70), 10));
    frame.addPath(rr(-300, cy - R - 60, -260, cy + R + 60, 10));
    frame.addPath(rr(260, cy - R - 60, 300, cy + R + 60, 10));
    const casters = make();
    for (const x of [-280, 280]) for (const sy of [-1, 1]) casters.addCircle(x, cy + sy * (R + 70), 34);
    return { shell, hoops, rods, lugs, frame, casters };
  }, [cy]);
  const { R, D } = BD;
  return (
    <Group>
      <Path path={g.frame} color="#4a4e57" />
      <Path path={g.casters} color="#1b1c21" />
      <Group transform={[{ translateX: 30 }, { translateY: 40 }]}>
        <Path path={g.shell} color="#000" opacity={0.45}>
          <BlurMask blur={30} style="normal" />
        </Path>
      </Group>
      {/* The shell as a lit cylinder: its axis across, so the light runs along it. */}
      <Path path={g.shell}>
        <LinearGradient start={vec(0, cy - R)} end={vec(0, cy + R)} colors={BD_SHELL} positions={BD_POS} />
      </Path>
      <Path path={g.shell} style="stroke" strokeWidth={4} color="#140b05" />
      <Path path={g.rods} style="stroke" strokeWidth={12} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={5} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.lugs}>
        <LinearGradient start={vec(-D / 2, 0)} end={vec(D / 2, 0)} colors={CHROME_RAMP} />
      </Path>
      <Path path={g.hoops}>
        <LinearGradient start={vec(0, cy - R)} end={vec(0, cy + R)} colors={BD_HOOP} />
      </Path>
      <Path path={g.hoops} style="stroke" strokeWidth={3} color="#1a0e05" />
    </Group>
  );
}

/** In elevation at (cu, floorV): `a` = how much of the drum's axis lies along
 *  the view's u (±1 = side-on, the shell; 0 = a head facing the viewer). */
function BassDrumElev({ cu, floorV, a }: { cu: number; floorV: number; a: number }) {
  const g = useMemo(() => {
    const { R, D, hoopH, hoopT } = BD;
    const cv = floorV - BD.cy;
    const k = Math.sqrt(Math.max(0, 1 - a * a)) + 0.01; // a head's width factor
    const h = (D / 2) * Math.abs(a);
    const rH = R + hoopT + 3;
    const near = P(cu + h, cv);
    const shell = Skia.Path.MakeFromOp(rr(cu - h, cv - R, cu + h, cv + R, 2), ellipse(near, R * k, R), PathOp.Union) ?? make();
    const head = ellipse(near, R * k, R);
    const hoop = Skia.Path.MakeFromOp(ellipse(near, rH * k, rH), ellipse(near, (R - 6) * k, R - 6), PathOp.Difference) ?? make();
    const farHoop = rr(cu - h - (hoopH * Math.abs(a)) / 2 - 4, cv - rH, cu - h + (hoopH * Math.abs(a)) / 2 + 4, cv + rH, 4);
    // The rods round the near head (claw to lug), and along the shell's top and bottom when side-on.
    const rods = make();
    if (k > 0.25) {
      for (let i = 0; i < BD.rods; i++) {
        const th = ((i + 0.5) / BD.rods) * Math.PI * 2;
        const x = Math.cos(th);
        const y = Math.sin(th);
        rods.moveTo(near.u + x * (rH + 4) * k, cv + y * (rH + 4));
        rods.lineTo(near.u - Math.abs(a) * 120 + x * (rH + 18) * k, cv + y * (rH + 18));
      }
    }
    if (Math.abs(a) > 0.3) {
      for (const sy of [-1, 1]) {
        for (const sx of [-1, 1]) {
          rods.moveTo(cu + sx * h, cv + sy * (R + 22));
          rods.lineTo(cu + sx * (h - 120 * Math.abs(a)), cv + sy * (R + 22));
        }
      }
    }
    // The stand: the yoke uprights either side of the shell (across the axis),
    // the pivot hubs at the centre, the base and its casters.
    const w = (R + 50) * k + 40;
    const stand = make();
    for (const sx of [-1, 1]) {
      stand.moveTo(cu + sx * w, floorV - 70);
      stand.lineTo(cu + sx * w, cv);
    }
    stand.moveTo(cu - w - 120, floorV - 70);
    stand.lineTo(cu + w + 120, floorV - 70);
    const hubs = make();
    for (const sx of [-1, 1]) hubs.addCircle(cu + sx * w, cv, 26);
    const casters = make();
    for (const sx of [-1, 1]) casters.addCircle(cu + sx * (w + 100), floorV - 34, 34);
    return { shell, head, hoop, farHoop, rods, stand, hubs, casters, cv };
  }, [cu, floorV, a]);
  const { R } = BD;
  return (
    <Group>
      <Path path={g.stand} style="stroke" strokeWidth={34} strokeCap="round" color="#2a2c32" />
      <Path path={g.stand} style="stroke" strokeWidth={22} strokeCap="round" color="#8a8f99" />
      <Path path={g.casters} color="#1b1c21" />
      <Path path={g.farHoop}>
        <LinearGradient start={vec(cu, g.cv - R)} end={vec(cu, g.cv + R)} colors={BD_HOOP} />
      </Path>
      <Path path={g.shell}>
        <LinearGradient start={vec(cu, g.cv - R)} end={vec(cu, g.cv + R)} colors={BD_SHELL} positions={BD_POS} />
      </Path>
      <Path path={g.head}>
        <RadialGradient c={vec(cu - R * 0.3, g.cv - R * 0.35)} r={R * 1.5} colors={['#fbf8f0', '#e6dcc6', '#b8ab90']} />
      </Path>
      <Path path={g.rods} style="stroke" strokeWidth={12} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={5} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.hoop}>
        <LinearGradient start={vec(cu - R, g.cv - R)} end={vec(cu + R, g.cv + R)} colors={BD_HOOP} />
      </Path>
      <Path path={g.hoop} style="stroke" strokeWidth={3} color="#1a0e05" />
      <Path path={g.hubs} color="#16171b" />
    </Group>
  );
}

/**
 * The 2.1 m GRAND from above as a standalone drawing (round 2, 2026-10-10:
 * exported for reuse — e.g. the bowed lessons' setting plan). Frame, mm:
 * x = the pianist's right (the treble side; the spine at x = −750), y toward
 * the pianist; the keyboard's front edge at y = 0, the case running AHEAD to
 * y = −2110. The lid is open on full stick. Place it with a Group transform
 * (translate to the keyboard's front edge, rotate to the pianist's facing).
 * The same paths as the stage drawings (grandPlan), the same materials.
 */
export function GrandPianoTop() {
  const g = grandPlan();
  return (
    <Group transform={[{ translateY: 330 }]}>
      <Mass path={g.board} mat="maple" />
      <Mass path={g.plate} mat="brass" />
      <Path path={g.cutouts} color="#0a0705" opacity={0.85} />
      <Path path={g.strings} style="stroke" strokeWidth={5} strokeCap="round" color="#efe6cc" opacity={0.9} />
      <Mass path={g.body} mat="piano" />
      <Mass path={g.whites} mat="ivory" />
      <Path path={g.blacks} color="#0a0705" opacity={0.85} />
    </Group>
  );
}

/** Group 4: the path builders BandArt.tsx draws with. */
const BAND_TOOLS: BandTools = { P, capsule, taper, ellipse, rr, poly, line, flare };

/* ═══════════════════ PLAN (from above) ═══════════════════ */

/** A SINGER from above (group 2): standing, the head forward over the
 *  shoulders (frame V's lips sit `lipAhead` in front of the seat point, under
 *  the face), the hands free — or, for a chorister and a child, a music
 *  folder held open in front of the chest. */
function planVoice(b: Batch, s: Seat) {
  const put = placer(s);
  for (const sx of [-1, 1]) put(b.fig.shoe, ellipse(P(sx * 100, -70), 48, 72));
  put(b.fig.shirt, ellipse(P(0, 4), 222, 112));
  if (s.kind === 'singer') {
    // The arms hang at the sides: from above, only the tops of the upper arms.
    for (const sx of [-1, 1]) put(b.fig.shirt, ellipse(P(sx * 206, 10), 50, 64));
  } else {
    for (const sx of [-1, 1]) {
      put(b.fig.shirt, limb([pt(sx * 180, -8), pt(sx * 186, -130), pt(sx * 150, -232)], [58, 48, 40]));
      put(b.fig.skin, ellipse(P(sx * 146, -248), 38, 44));
    }
    // The folder, open, tipped toward the singer (black covers, pale pages between).
    put(b.mat.ebony, rr(-182, -338, 182, -236, 12));
    put(b.hair, line(make(), P(0, -334), P(0, -240)));
  }
  const h = headAbove(pt(0, 0), 104);
  const q = h.fill.copy();
  q.transform(Skia.Matrix().translate(0, -37).rotate(Math.PI));
  put(b.fig.skin, q);
}

function planSeat(b: Batch, s: Seat) {
  // Group 4: the drum kit draws itself, its drummer included.
  if (bandPlanWhole(b, s)) return;
  // group 2: a singer (group 4's lead vocal is the same kind).
  if (isVoice(s.kind)) {
    planVoice(b, s);
    return;
  }
  const put = placer(s);
  const standing = s.posture === 'standing';
  const k = s.kind;
  // Chair (seated players; a pianist's bench). A drum kit never gets here:
  // bandPlanWhole draws the kit with its drummer.
  if (!standing && k !== 'conductor') {
    put(b.fig.seat, rr(-215, -210, 215, 220, 60));
    put(b.fig.seat, rr(-205, 205, 205, 255, 22));
  }
  // Legs: thighs forward to the knees (seated); feet (standing).
  if (!standing && k !== 'conductor') {
    for (const sx of [-1, 1]) {
      put(b.fig.trousers, taper(P(sx * 100, -20), P(sx * 112, -350), 80, 68));
      put(b.fig.shoe, ellipse(P(sx * 120, -430), 52, 70));
    }
  } else {
    for (const sx of [-1, 1]) put(b.fig.shoe, ellipse(P(sx * 110, -90), 50, 72));
  }
  // Shoulders and torso from above.
  put(b.fig.shirt, ellipse(P(0, 40), 228, 118));
  // Arms and the instrument, by kind (local: x right, y back, forward −y).
  const arm = (pts: P2[]) => put(b.fig.shirt, limb(pts.map((q) => pt(q.u, q.v)), pts.map((_, i) => (i === 0 ? 60 : i === pts.length - 1 ? 40 : 50))));
  const hand = (c: P2) => put(b.fig.skin, ellipse(c, 42, 50));
  const LS = P(-185, 30);
  const RS = P(185, 30);
  switch (k) {
    case 'violin':
    case 'viola': {
      const spec = BOWED[k];
      const dir = P(-Math.sin(38 * DEG), -Math.cos(38 * DEG));
      const tail = P(-60, -10);
      put(b.mat.varnish, bodyPath(spec, tail, dir));
      const nb = P(tail.u + dir.u * bodyLen(spec), tail.v + dir.v * bodyLen(spec));
      const scroll = P(nb.u + dir.u * neckLen(spec), nb.v + dir.v * neckLen(spec));
      put(b.mat.ebony, capsule(nb, scroll, 14));
      put(b.mat.varnish, ellipse(scroll, 24, 24));
      const bridge = P(tail.u + dir.u * 150, tail.v + dir.v * 150);
      arm([LS, P(-300, -210), P(scroll.u + 40, scroll.v + 60)]);
      hand(P(scroll.u + 30, scroll.v + 50));
      // The bow: from the right hand across the strings near the bridge.
      const hR = P(170, -250);
      arm([RS, P(280, -130), hR]);
      hand(hR);
      const ang = Math.atan2(bridge.v - hR.v, bridge.u - hR.u);
      const tip = P(hR.u + Math.cos(ang) * spec.bow.mm, hR.v + Math.sin(ang) * spec.bow.mm);
      put(b.stick, line(make(), hR, tip));
      put(b.hair, line(make(), P(hR.u + 8, hR.v + 14), P(tip.u + 6, tip.v + 12)));
      break;
    }
    case 'cello': {
      // Between the knees, leaning back about 25°, the neck passing the
      // player's left ear; the bow crosses the strings at the contact point.
      const { lh, contact } = uprightPlan(b, put, BOWED.cello, P(20, -470), P(-0.3, 1), 25);
      arm([LS, P(-250, -100), P(lh.u - 30, lh.v + 10)]);
      hand(P(lh.u - 20, lh.v));
      const hR = P(330, -330);
      arm([RS, P(300, -120), hR]);
      hand(hR);
      const bl = Math.hypot(contact.u - hR.u, contact.v - hR.v) || 1;
      const tip = P(hR.u + ((contact.u - hR.u) / bl) * BOWED.cello.bow.mm, hR.v + ((contact.v - hR.v) / bl) * BOWED.cello.bow.mm);
      put(b.stick, line(make(), hR, tip));
      put(b.hair, line(make(), P(hR.u, hR.v - 12), P(tip.u, tip.v - 12)));
      break;
    }
    case 'bass': {
      // Upright at the player's left front, leaning back about 20°, the
      // scroll beside the head; the right hand plucks over the fingerboard's end.
      const { lh, pluck } = uprightPlan(b, put, BOWED.bass, P(-120, -600), P(-0.15, 1), 20);
      arm([LS, P(-250, -80), P(lh.u - 30, lh.v + 10)]);
      hand(P(lh.u - 20, lh.v));
      const hR = P(pluck.u + 70, pluck.v + 40);
      arm([RS, P(200, -200), hR]);
      hand(hR);
      break;
    }
    case 'flute': {
      const a = P(-60, -130);
      const e = P(560, -170);
      put(b.mat.silver, capsule(a, e, 10));
      arm([LS, P(-120, -230), P(40, -150)]);
      hand(P(40, -150));
      arm([RS, P(330, -60), P(380, -170)]);
      hand(P(380, -170));
      break;
    }
    case 'oboe':
    case 'clarinet': {
      const end = P(0, -630);
      put(b.mat.blackwood, capsule(P(0, -120), P(0, end.v + 40), 15));
      put(b.mat.blackwood, flare(P(0, end.v + 60), end, 16, k === 'clarinet' ? 33 : 24));
      if (k === 'clarinet') put(b.holes, ellipse(end, 20, 20));
      arm([LS, P(-150, -200), P(-10, -270)]);
      hand(P(-5, -270));
      arm([RS, P(150, -280), P(10, -450)]);
      hand(P(5, -450));
      break;
    }
    case 'bassoon': {
      put(b.mat.maple, capsule(P(170, -160), P(-200, 70), 30));
      put(b.mat.maple, ellipse(P(-215, 80), 34, 34));
      put(b.holes, ellipse(P(-215, 80), 20, 20));
      put(b.mat.silver, capsule(P(20, -120), P(140, -170), 5));
      arm([LS, P(-210, -80), P(-90, -60)]);
      hand(P(-90, -60));
      arm([RS, P(230, -120), P(150, -170)]);
      hand(P(150, -170));
      break;
    }
    case 'horn': {
      // A double horn from above (art pass 2026-10-10): its coil (about
      // 340 mm across) stands upright at the player's right, so from above it
      // is edge-on — 125 mm thick with its wraps; the four rotary valves on
      // its inner side under the left hand; the leadpipe from the lips; the
      // bell (Ø 305) back and to the right, its mouth turned away.
      put(b.mat.brass, ellipse(P(170, -110), 62, 172));
      put(b.mat.brass, capsule(P(-10, -95), P(125, -255), 9));
      put(b.mat.brass, flare(P(205, -10), P(255, 120), 40, 152));
      put(b.holes, ellipse(P(257, 122), 112, 38));
      for (const y of [-180, -140, -100, -60]) put(b.mat.silver, ellipse(P(104, y), 19, 17));
      for (const y of [-250, -200, -30, 20]) put(b.hair, line(make(), P(130, y), P(212, y + 6)));
      arm([LS, P(-120, -200), P(90, -190)]);
      hand(P(90, -190));
      arm([RS, P(300, -20), P(250, 90)]);
      hand(P(250, 90));
      break;
    }
    case 'trumpet': {
      put(b.mat.brass, rr(-35, -470, 35, -140, 18));
      put(b.mat.brass, flare(P(0, -440), P(0, -580), 24, 62));
      for (const vy of [-250, -290, -330]) put(b.mat.silver, ellipse(P(30, vy), 14, 14));
      arm([LS, P(-170, -190), P(-30, -300)]);
      hand(P(-30, -300));
      arm([RS, P(170, -200), P(40, -290)]);
      hand(P(40, -290));
      break;
    }
    case 'trombone': {
      put(b.mat.brass, rr(-26, -900, 26, -140, 14));
      put(b.mat.brass, flare(P(-70, -200), P(-75, -520), 22, 110));
      arm([LS, P(-180, -200), P(-60, -230)]);
      hand(P(-60, -230));
      arm([RS, P(220, -260), P(30, -560)]);
      hand(P(30, -560));
      break;
    }
    case 'tuba': {
      put(b.mat.brass, ellipse(P(0, -200), 170, 135));
      put(b.mat.brass, ellipse(P(70, -120), 215, 215));
      put(b.holes, ellipse(P(70, -120), 170, 170));
      arm([LS, P(-200, -130), P(-110, -240)]);
      hand(P(-110, -240));
      arm([RS, P(230, -140), P(150, -270)]);
      hand(P(150, -270));
      break;
    }
    case 'harp': {
      put(b.mat.harpGold, poly([P(-40, -420), P(80, -440), P(170, 20), P(130, 40)]));
      put(b.mat.harpGold, capsule(P(-300, -470), P(-190, -60), 34));
      put(b.mat.harpGold, capsule(P(-190, -60), P(150, 30), 26));
      for (let i = 0; i < 9; i++) put(b.hair, line(make(), P(-250 + i * 30, -420 + i * 40), P(10 + i * 15, -440 + i * 45)));
      arm([LS, P(-250, -150), P(-140, -280)]);
      hand(P(-140, -280));
      arm([RS, P(260, -120), P(60, -300)]);
      hand(P(60, -300));
      break;
    }
    case 'celesta': {
      // A 5-octave celesta (C to C, 61 keys: 36 naturals over 846 mm) from
      // above: the cabinet 1000 × 480 mm, its keyboard shelf toward the player.
      put(b.mat.piano, rr(-500, -810, 500, -330, 24));
      put(b.mat.ivory, rr(-423, -460, 423, -335, 2));
      for (let i = 0; i < 35; i++) {
        const name = 'CDEFGAB'[i % 7];
        const x = -423 + (i + 1) * 23.5;
        put(b.holes, rr(x - 0.8, -460, x + 0.8, -335, 0));
        if (name !== 'E' && name !== 'B') put(b.holes, rr(x - 6.5, -460, x + 6.5, -375, 2));
      }
      arm([LS, P(-200, -170), P(-160, -290)]);
      arm([RS, P(200, -170), P(160, -290)]);
      hand(P(-160, -290));
      hand(P(160, -290));
      break;
    }
    case 'piano': {
      // A grand from above, as the pianist sits at it (grandPlan): the spine
      // on the player's left (the bass), the bentside on the right, the
      // keyboard across the front, the lid open on full stick toward the right.
      const g = grandPlan();
      put(b.mat.maple, g.board);
      put(b.mat.brass, g.plate);
      put(b.holes, g.cutouts);
      put(b.hair, g.strings);
      put(b.mat.piano, g.body);
      put(b.mat.ivory, g.whites);
      put(b.holes, g.blacks);
      arm([LS, P(-200, -170), P(-170, -390)]);
      arm([RS, P(200, -170), P(170, -390)]);
      hand(P(-170, -390));
      hand(P(170, -390));
      break;
    }
    case 'timpani': {
      const drums = TIMP;
      for (const [i, dr] of drums.entries()) {
        const c = toPlan(s, Math.sin(dr.a * DEG) * 720, -Math.cos(dr.a * DEG) * 720);
        const pedalA = Math.atan2(s.p.z - c.v, s.p.x - c.u);
        b.extra.push({ key: `tp:${s.id}:${i}`, el: <Group key={`tp:${s.id}:${i}`} transform={[{ translateX: c.u }, { translateY: c.v }]}><TimpanoTop R={dr.d / 2} pedalA={pedalA} /></Group> });
      }
      arm([LS, P(-260, -180), P(-200, -380)]);
      arm([RS, P(260, -180), P(200, -380)]);
      hand(P(-200, -380));
      hand(P(200, -380));
      put(b.stick, line(make(), P(-200, -380), P(-260, -600)));
      put(b.stick, line(make(), P(200, -380), P(260, -600)));
      break;
    }
    case 'percussion': {
      const second = /\.2$/.test(s.id);
      if (!second) {
        // A concert bass drum on its tilting stand (BassDrumPlan): the heads
        // face the player's left and right; the beater toward the right head.
        b.extra.push({ key: `bd:${s.id}`, el: <Group key={`bd:${s.id}`} transform={[{ translateX: s.p.x }, { translateY: s.p.z }, { rotate: (s.face * Math.PI) / 180 }]}><BassDrumPlan cy={-BASS_DRUM_STATION.ahead} /></Group> });
        arm([LS, P(-220, -160), P(-150, -260)]);
        arm([RS, P(240, -200), P(180, -320)]);
        hand(P(180, -320));
        // A beater: a 380 mm shaft, a fleece head about 80 mm across.
        put(b.stick, line(make(), P(180, -320), P(230, -560)));
        put(b.mat.hide, ellipse(P(236, -590), 40, 46));
      } else {
        const c = toPlan(s, -120, -480);
        b.extra.push({ key: `sn:${s.id}`, el: <Group key={`sn:${s.id}`} transform={[{ translateX: c.u }, { translateY: c.v }]}><DrumPlan drum={{ spec: CONCERT_SNARE_14x65, c: { x: 0, y: 0, z: 0 }, tiltDeg: 0 }} /></Group> });
        const cy = toPlan(s, 420, -420);
        b.extra.push({ key: `cy:${s.id}`, el: <CymbalPlan key={`cy:${s.id}`} cx={cy.u} cz={cy.v} d={18 * IN} tiltDeg={0} dim={0.9} /> });
        arm([LS, P(-220, -160), P(-140, -330)]);
        arm([RS, P(220, -160), P(80, -330)]);
        hand(P(-140, -330));
        hand(P(80, -330));
      }
      break;
    }
    /* ── group 5 (sections): the saxes, the rhythm section, the percussion stations ── */
    case 'sax':
    case 'bariSax': {
      // The body hangs at the player's right, the bell turned up and forward.
      const big = k === 'bariSax';
      const top = P(20, -170);
      const bow = P(big ? 210 : 165, big ? -330 : -290);
      put(b.mat.silver, capsule(P(0, -100), top, 8));
      put(b.mat.brass, taper(top, bow, big ? 34 : 22, big ? 56 : 36));
      const bell = P(bow.u + (big ? 40 : 30), bow.v - (big ? 50 : 40));
      put(b.mat.brass, ellipse(bell, big ? 100 : 68, big ? 86 : 58));
      put(b.holes, ellipse(bell, big ? 74 : 48, big ? 62 : 40));
      if (big) put(b.mat.brass, ellipse(P(-40, -120), 46, 40));
      const h1 = P(top.u + (bow.u - top.u) * 0.25, top.v + (bow.v - top.v) * 0.25);
      const h2 = P(top.u + (bow.u - top.u) * 0.7, top.v + (bow.v - top.v) * 0.7);
      arm([LS, P(-150, -170), h1]);
      hand(h1);
      arm([RS, P(270, -120), h2]);
      hand(h2);
      break;
    }
    case 'guitar': {
      // An archtop on the lap, its neck to the player's left; the amp on the
      // floor at the player's right, its speaker facing forward.
      put(b.mat.varnish, ellipse(P(60, -210), 190, 120));
      put(b.mat.silver, rr(20, -250, 100, -170, 8));
      put(b.mat.ebony, capsule(P(-110, -230), P(-560, -170), 20));
      arm([LS, P(-260, -200), P(-440, -190)]);
      hand(P(-440, -190));
      arm([RS, P(230, -150), P(100, -220)]);
      hand(P(100, -220));
      put(b.mat.piano, rr(190, -605, 750, -335, 30));
      put(b.desks, rr(220, -620, 720, -590, 6));
      put(b.legs, line(make(), P(160, -160), P(300, -335)));
      break;
    }
    case 'marimba':
    case 'vibraphone': {
      // The keyboard across the player, the LOW end on the player's left; the
      // naturals near the player, the accidentals behind them (Lab 2's ROWS).
      const row = k === 'marimba' ? ROWS.marimba43 : ROWS.vibe;
      const L = row.Lframe.mm;
      const y0 = -220;
      const depth = (x: number) => row.Dlow.mm + ((row.Dhigh.mm - row.Dlow.mm) * (x + L / 2)) / L;
      // The frame under the bars (painted before the bars: the desks layer).
      put(b.desks, poly([P(-L / 2, y0), P(L / 2, y0), P(L / 2, y0 - row.Dhigh.mm), P(-L / 2, y0 - row.Dlow.mm)]));
      const nat: number[] = [];
      for (let key = row.lowKey; key <= row.highKey; key++) if (isNatural(key)) nat.push(key);
      const pitch = (L - 120) / nat.length;
      const bar = k === 'marimba' ? b.mat.varnish : b.mat.silver;
      nat.forEach((key, i) => {
        const x = -L / 2 + 60 + (i + 0.5) * pitch;
        const D = depth(x);
        const len = D * 0.42;
        put(bar, rr(x - pitch * 0.42, y0 - 30 - len, x + pitch * 0.42, y0 - 30, 6));
        if (key < row.highKey && !isNatural(key + 1)) put(bar, rr(x + pitch * 0.5 - pitch * 0.38, y0 - D + 30, x + pitch * 0.5 + pitch * 0.38, y0 - D + 30 + len * 0.9, 6));
      });
      arm([LS, P(-230, -180), P(-210, -320)]);
      arm([RS, P(230, -180), P(210, -320)]);
      hand(P(-210, -320));
      hand(P(210, -320));
      for (const sx of [-1, 1]) {
        put(b.stick, line(make(), P(sx * 210, -320), P(sx * 290, -470)));
        put(b.holes, ellipse(P(sx * 290, -470), 24, 24));
      }
      break;
    }
    case 'congas': {
      // A conga (left) and a tumba (right) in front of the player (M04a's sizes).
      for (const [x, d] of [
        [-170, CONGA_DIMS.congaD.mm],
        [170, CONGA_DIMS.tumbaD.mm],
      ] as const) {
        put(b.mat.steel, ellipse(P(x, -380), d / 2 + 10, d / 2 + 10));
        put(b.mat.hide, ellipse(P(x, -380), d / 2, d / 2));
      }
      arm([LS, P(-230, -170), P(-170, -360)]);
      arm([RS, P(230, -170), P(170, -360)]);
      hand(P(-170, -360));
      hand(P(170, -360));
      break;
    }
    case 'perctable': {
      // A padded table of small percussion, a cymbal on its stand at the right.
      put(b.mat.chair, rr(-450, -650, 450, -200, 30));
      put(b.mat.varnish, ellipse(P(-250, -440), 125, 125));
      put(b.holes, ellipse(P(-250, -440), 95, 95));
      for (let i = 0; i < 8; i++) put(b.mat.silver, ellipse(P(-250 + Math.cos((i * Math.PI) / 4) * 110, -440 + Math.sin((i * Math.PI) / 4) * 110), 16, 16));
      put(b.mat.maple, capsule(P(40, -540), P(170, -490), 26));
      put(b.mat.maple, rr(-60, -360, 90, -300, 10));
      put(b.hair, poly([P(200, -300), P(340, -300), P(270, -420)]));
      const cy = toPlan(s, 650, -380);
      b.extra.push({ key: `pcy:${s.id}`, el: <CymbalPlan key={`pcy:${s.id}`} cx={cy.u} cz={cy.v} d={18 * IN} tiltDeg={0} dim={0.88} /> });
      arm([LS, P(-220, -170), P(-160, -330)]);
      arm([RS, P(220, -170), P(140, -330)]);
      hand(P(-160, -330));
      hand(P(140, -330));
      break;
    }
    case 'conductor': {
      arm([LS, P(-300, -150), P(-280, -380)]);
      arm([RS, P(300, -150), P(260, -420)]);
      hand(P(-280, -380));
      hand(P(260, -420));
      put(b.stick, line(make(), P(260, -420), P(330, -720)));
      break;
    }
    default:
      // Group 4: the band players' instruments (BandArt.tsx).
      if (BAND_KINDS.has(k)) bandPlanInstrument(b, s, { ...BAND_TOOLS, put, arm, hand, LS, RS });
  }
  // The head from above (the nose toward the front: rotated half a turn).
  const h = headAbove(pt(0, 0), 104);
  const q = h.fill.copy();
  q.transform(Skia.Matrix().translate(0, 20).rotate(Math.PI));
  put(b.fig.skin, q);
}

function planStand(b: Batch, s: Seat) {
  if (!s.stand) return;
  const F = (s.face * Math.PI) / 180;
  const m = Skia.Matrix().translate(s.stand.x, s.stand.z).rotate(F);
  const desk = rr(-250, -18, 250, 18, 8);
  desk.transform(m);
  b.desks.addPath(desk);
  for (let i = 0; i < 3; i++) {
    const a = F + Math.PI / 2 + (i * 2 * Math.PI) / 3;
    b.legs.moveTo(s.stand.x, s.stand.z);
    b.legs.lineTo(s.stand.x + Math.cos(a) * 230, s.stand.z + Math.sin(a) * 230);
  }
}

/* ═══════════════════ FRONT (from the hall) and SECTION ═══════════════════ */

/** One player seen from the hall (front) or from the conductor's right
 *  (section), on a riser at its height. The body is drawn square to the
 *  viewer (front: facing the hall; section: in profile toward the
 *  conductor); the instrument follows the player's real facing (its local
 *  right and forward projected into the view). */
function elevSeat(b: Batch, s: Seat, view: 'front' | 'section') {
  // Children are drawn from above only (E06, the lead ruling): never a
  // figure in elevation — SeatingView marks their area instead.
  if (s.kind === 'child') return;
  // Group 4: the drum kit from the side draws itself, its drummer included.
  if (bandElevWhole(b, s, view)) return;
  const o = uv(view, s.p);
  const g = o.v; // the floor (riser top) as screen v
  const standing = s.posture === 'standing' || s.kind === 'conductor';
  const k = s.kind;
  const front = view === 'front';
  const F = s.face * DEG;
  // The player's right (cos F, 0, sin F) and forward (sin F, 0, −cos F) along the view's u.
  const rightU = front ? Math.cos(F) : -Math.sin(F);
  const fwdU = front ? Math.sin(F) : Math.cos(F);
  /** A point `right` mm to the player's right, `fwd` ahead (u only). */
  const X = (right: number, fwd: number) => o.u + right * rightU + fwd * fwdU;
  /** …and `up` mm above the floor. */
  const Q = (right: number, fwd: number, up: number) => P(X(right, fwd), g - up);
  /** A local 3-D direction (right, up, forward) on screen, and its foreshortening. */
  const dirOf = (r: number, up: number, f: number) => {
    const du = r * rightU + f * fwdU;
    const dv = -up;
    const L = Math.hypot(du, dv) || 1;
    return { d: P(du / L, dv / L), k: L / (Math.hypot(r, up, f) || 1) };
  };
  /** How square-on a face that points the player's way is to this view. */
  const faceOn = Math.max(0.3, front ? Math.abs(Math.cos(F)) : Math.abs(Math.sin(F)));
  const sh = standing ? 1450 : DIMS.seatedShoulder;
  const hipUp = standing ? 920 : DIMS.chairSeat + 40;
  // group 5: an instrument usually played seated, played standing (big-band trumpets), sits higher.
  const lift = standing && KIND[k].posture === 'seated' ? STAND_LIFT : 0;
  // The chair (a drummer's throne: a round seat on a post — group 5).
  if (k === 'drumkit') {
    addFig(b, 'seat', rr(o.u - 175, g - DIMS.chairSeat - 40, o.u + 175, g - DIMS.chairSeat + 20, 30));
    line(b.legs, P(o.u, g - DIMS.chairSeat), P(o.u, g - 120));
    line(b.legs, P(o.u, g - 120), P(o.u - 220, g));
    line(b.legs, P(o.u, g - 120), P(o.u + 220, g));
  } else if (!standing) {
    const w = front ? 210 : 230;
    addFig(b, 'seat', rr(o.u - w, g - DIMS.chairSeat - 30, o.u + w, g - DIMS.chairSeat + 10, 12));
    if (front) addFig(b, 'seat', rr(o.u - 200, g - 900, o.u + 200, g - DIMS.chairSeat - 20, 30));
    else addFig(b, 'seat', rr(X(0, -230) - 25, g - 900, X(0, -230) + 25, g - DIMS.chairSeat, 12));
    line(b.legs, P(o.u - w + 20, g - DIMS.chairSeat), P(o.u - w + 10, g));
    line(b.legs, P(o.u + w - 20, g - DIMS.chairSeat), P(o.u + w - 10, g));
  }
  // The legs.
  if (standing) {
    for (const sx of [-1, 1]) {
      const xx = front ? o.u + sx * 95 : o.u + sx * 18;
      addFig(b, 'trousers', taper(P(xx, g - hipUp), P(xx + (front ? sx * 12 : 0), g - 90), 82, 58));
      addFig(b, 'shoe', ellipse(P(front ? xx + sx * 12 : o.u + Math.sign(fwdU || 1) * 60, g - 35), front ? 55 : 120, 38));
    }
  } else if (front) {
    for (const sx of [-1, 1]) {
      addFig(b, 'trousers', taper(P(o.u + sx * 105, g - hipUp), P(o.u + sx * 115, g - 520), 84, 72));
      addFig(b, 'trousers', taper(P(o.u + sx * 115, g - 520), P(o.u + sx * 125, g - 90), 66, 52));
      addFig(b, 'shoe', ellipse(P(o.u + sx * 128, g - 35), 58, 38));
    }
  } else {
    const fs = Math.sign(fwdU || -1);
    const knee = P(o.u + fs * 400, g - 520);
    addFig(b, 'trousers', taper(P(o.u, g - hipUp), knee, 86, 70));
    addFig(b, 'trousers', taper(knee, P(knee.u + fs * 20, g - 90), 64, 52));
    addFig(b, 'shoe', ellipse(P(knee.u + fs * 90, g - 35), 125, 38));
  }
  // The torso and shoulders.
  if (front) addFig(b, 'shirt', poly([P(o.u - 160, g - hipUp + 30), P(o.u + 160, g - hipUp + 30), P(o.u + 215, g - sh), P(o.u - 215, g - sh)]));
  else addFig(b, 'shirt', poly([P(o.u - 120, g - hipUp + 30), P(o.u + 120, g - hipUp + 30), P(o.u + 115, g - sh), P(o.u - 115, g - sh)]));
  addFig(b, 'shirt', ellipse(P(o.u, g - sh), front ? 225 : 125, 70));
  const arm = (pts: P2[]) => addFig(b, 'shirt', limb(pts.map((q) => pt(q.u, q.v)), pts.map((_, i) => (i === 0 ? 58 : i === pts.length - 1 ? 40 : 48))));
  const hand = (c: P2) => addFig(b, 'skin', ellipse(c, 42, 48));
  const shL = Q(-200, 0, sh - 40);
  const shR = Q(200, 0, sh - 40);
  /** A part that hides the head and hands behind it (a bell seen end-on). */
  let before: SkPath | null = null;
  switch (k) {
    case 'violin':
    case 'viola': {
      const spec = BOWED[k];
      const tail = Q(-60, 40, 1060);
      const { d, k: kf } = dirOf(-Math.sin(38 * DEG), 0.12, Math.cos(38 * DEG));
      b.mat.varnish.addPath(bodyPath(spec, tail, d, kf, 0.5));
      const nb = P(tail.u + d.u * bodyLen(spec) * kf, tail.v + d.v * bodyLen(spec) * kf);
      const sc = P(nb.u + d.u * neckLen(spec) * kf, nb.v + d.v * neckLen(spec) * kf);
      b.mat.ebony.addPath(capsule(nb, sc, 12));
      arm([shL, Q(-280, 220, 860), sc]);
      hand(sc);
      const hR = Q(240, 230, 980);
      arm([shR, Q(300, 60, 880), hR]);
      hand(hR);
      const br = P(tail.u + d.u * 150 * kf, tail.v + d.v * 150 * kf);
      line(b.stick, hR, P(hR.u + (br.u - hR.u) * 2.4, hR.v + (br.v - hR.v) * 2.4));
      break;
    }
    case 'cello':
    case 'bass': {
      const spec = BOWED[k];
      const tail = Q(k === 'bass' ? -120 : 0, k === 'bass' ? 260 : 330, k === 'cello' ? 120 : 160);
      const { d, k: kf } = dirOf(-0.05, 0.94, -0.33);
      b.mat.varnish.addPath(bodyPath(spec, tail, d, kf, faceOn));
      const nb = P(tail.u + d.u * bodyLen(spec) * kf, tail.v + d.v * bodyLen(spec) * kf);
      const sc = P(nb.u + d.u * neckLen(spec) * kf, nb.v + d.v * neckLen(spec) * kf);
      b.mat.ebony.addPath(capsule(nb, sc, k === 'cello' ? 18 : 24));
      b.mat.varnish.addPath(ellipse(sc, 30, 34));
      line(b.stick, tail, P(tail.u, g));
      if (faceOn > 0.6) {
        const mid = P(tail.u + d.u * bodyLen(spec) * kf * 0.45, tail.v + d.v * bodyLen(spec) * kf * 0.45);
        for (const sx of [-1, 1]) b.holes.addPath(ellipse(P(mid.u + sx * spec.fholeY.mm * faceOn, mid.v), 9, spec.body.mm * 0.08));
      }
      const lh = P(nb.u + d.u * 120, nb.v + d.v * 120);
      arm([shL, P((shL.u + lh.u) / 2, (shL.v + lh.v) / 2 + 60), lh]);
      hand(lh);
      const hR = Q(330, 260, k === 'cello' ? 540 : 820);
      arm([shR, Q(330, 100, 760), hR]);
      hand(hR);
      line(b.stick, hR, Q(-380, 300, k === 'cello' ? 520 : 800));
      break;
    }
    case 'flute': {
      b.mat.silver.addPath(capsule(Q(-40, 120, 1180), Q(600, 160, 1190), 10));
      arm([shL, Q(-60, 200, 950), Q(40, 140, 1170)]);
      arm([shR, Q(330, 80, 920), Q(380, 160, 1180)]);
      hand(Q(40, 140, 1170));
      hand(Q(380, 160, 1180));
      break;
    }
    case 'oboe':
    case 'clarinet': {
      const top = Q(0, 120, 1150);
      const end = Q(0, 520, 640);
      b.mat.blackwood.addPath(capsule(top, end, 15));
      b.mat.blackwood.addPath(flare(P(top.u + (end.u - top.u) * 0.86, top.v + (end.v - top.v) * 0.86), end, 16, k === 'clarinet' ? 34 : 25));
      const h1 = P(top.u + (end.u - top.u) * 0.25, top.v + (end.v - top.v) * 0.25);
      const h2 = P(top.u + (end.u - top.u) * 0.6, top.v + (end.v - top.v) * 0.6);
      arm([shL, Q(-150, 160, 900), h1]);
      arm([shR, Q(160, 200, 820), h2]);
      hand(h1);
      hand(h2);
      break;
    }
    case 'bassoon': {
      const boot = Q(160, 160, 520);
      const bell = Q(-180, 40, 1740);
      b.mat.maple.addPath(capsule(boot, bell, 32));
      b.mat.maple.addPath(rr(bell.u - 36, bell.v - 30, bell.u + 36, bell.v + 30, 14));
      b.mat.silver.addPath(capsule(Q(30, 130, 1160), Q(130, 150, 1080), 5));
      const h1 = P(boot.u + (bell.u - boot.u) * 0.55, boot.v + (bell.v - boot.v) * 0.55);
      const h2 = P(boot.u + (bell.u - boot.u) * 0.2, boot.v + (bell.v - boot.v) * 0.2);
      arm([shL, Q(-200, 120, 900), h1]);
      arm([shR, Q(240, 120, 760), h2]);
      hand(h1);
      hand(h2);
      break;
    }
    case 'horn': {
      const c = Q(220, 40, 820);
      b.mat.brass.addPath(ellipse(c, 170 * Math.max(0.5, faceOn) + 10, 175));
      b.holes.addPath(ellipse(c, 90 * Math.max(0.5, faceOn), 95));
      b.mat.brass.addPath(flare(P(c.u, c.v + 60), Q(260, -220, 760), 40, 150));
      arm([shR, Q(300, 0, 800), Q(260, -120, 760)]);
      arm([shL, Q(-80, 160, 860), Q(120, 80, 960)]);
      hand(Q(120, 80, 960));
      break;
    }
    case 'trumpet':
    case 'trombone': {
      const tb = k === 'trombone';
      const mouth = Q(tb ? -60 : 0, 110, 1150 + lift);
      const bellAt = Q(tb ? -80 : 0, tb ? 520 : 560, 1120 + lift);
      const { d, k: kf } = dirOf(0, 0, 1);
      if (kf < 0.35) {
        // The bell toward the viewer, seen end-on.
        const R = tb ? 110 : 62;
        b.mat.brass.addPath(ellipse(bellAt, R, R));
        b.holes.addPath(ellipse(bellAt, R * 0.72, R * 0.72));
        // The bell is IN FRONT of the face (art pass 2026-10-10): the head and
        // the hands are painted last, so the bell's disc is cut out of them below.
        before = ellipse(bellAt, R, R);
        if (tb) {
          const sc = Q(-10, 900, 1080 + lift);
          before = Skia.Path.MakeFromOp(before, rr(sc.u - 62, sc.v - 16, sc.u + 62, sc.v + 16, 16), PathOp.Union) ?? before;
        }
        // The slide, also pointing at the viewer: its end crook seen end-on —
        // the two tubes (about 100 mm apart) joined by the bow, under the mouth.
        if (tb) {
          const sc = Q(-10, 900, 1080 + lift);
          b.mat.brass.addPath(rr(sc.u - 62, sc.v - 16, sc.u + 62, sc.v + 16, 16));
          b.holes.addPath(ellipse(P(sc.u - 48, sc.v), 7, 7));
          b.holes.addPath(ellipse(P(sc.u + 48, sc.v), 7, 7));
        }
      } else {
        const L = tb ? 900 : 470;
        b.mat.brass.addPath(capsule(mouth, P(mouth.u + d.u * L * kf, mouth.v + 20), tb ? 16 : 18));
        b.mat.brass.addPath(flare(P(mouth.u + d.u * (tb ? 200 : 300) * kf, mouth.v + 6), P(mouth.u + d.u * (tb ? 420 : 470) * kf, mouth.v + 6), 20, tb ? 110 : 62));
      }
      arm([shL, Q(-170, 150, 1000 + lift), Q(-30, 280, 1130 + lift)]);
      arm([shR, Q(170, 150, 980 + lift), Q(30, tb ? 560 : 280, 1110 + lift)]);
      hand(Q(-30, 280, 1130 + lift));
      hand(Q(30, tb ? 560 : 280, 1110 + lift));
      break;
    }
    case 'tuba': {
      b.mat.brass.addPath(ellipse(Q(0, 120, 900), 190, 300));
      b.mat.brass.addPath(flare(Q(40, 120, 1100), Q(70, 120, 1500), 70, 215));
      arm([shL, Q(-220, 120, 860), Q(-120, 200, 1000)]);
      arm([shR, Q(230, 120, 860), Q(140, 200, 1060)]);
      hand(Q(-120, 200, 1000));
      hand(Q(140, 200, 1060));
      break;
    }
    case 'harp': {
      const base = Q(60, 300, 60);
      const top = Q(150, -20, 1780);
      const col = Q(-300, 460, 60);
      const colTop = P(col.u, g - 1780);
      b.mat.harpGold.addPath(taper(base, top, 110, 50));
      b.mat.harpGold.addPath(capsule(col, colTop, 34));
      b.mat.harpGold.addPath(capsule(colTop, top, 30));
      for (let i = 1; i < 10; i++) {
        const t = i / 10;
        line(b.hair, P(base.u + (top.u - base.u) * t, base.v + (top.v - base.v) * t), P(colTop.u + (top.u - colTop.u) * t, colTop.v + (top.v - colTop.v) * t));
      }
      arm([shL, Q(-200, 200, 950), Q(-100, 300, 1100)]);
      arm([shR, Q(220, 160, 900), Q(80, 260, 1000)]);
      hand(Q(-100, 300, 1100));
      hand(Q(80, 260, 1000));
      break;
    }
    case 'piano': {
      // The grand in elevation (art pass 2026-10-10), every part projected
      // from its real place (GRAND_OUTLINE, a = ahead of the keys' front at
      // 330 mm before the player): the rim 640–1000 mm high (an extruded
      // outline is a band in any elevation), the lid on full stick about the
      // spine, its prop, three legs on casters (two under the cheeks, one
      // under the tail), the pedal lyre with three pedals, the key slip.
      // How far the piano lies toward the viewer from its player (+1: we see
      // the tail end, the player behind it; −1: we see the keys, the player in front).
      const toward = front ? -Math.cos(F) : Math.sin(F);
      const RIM0 = 640;
      const RIM1 = 1000;
      const A0 = 330;
      const us = GRAND_OUTLINE.map(([x, a]) => X(x, A0 + a));
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      b.mat.piano.addPath(rr(u0, g - RIM1, u1, g - RIM0, 14));
      // The lid: the outline (behind the fallboard) turned up about the spine.
      const c = Math.cos(GRAND_LID_DEG * DEG);
      const sl = Math.sin(GRAND_LID_DEG * DEG);
      const lidPts = GRAND_OUTLINE.map(([x, a]) => {
        const d = x + GRAND.W / 2;
        return Q(-GRAND.W / 2 + d * c, A0 + Math.max(a, 250), RIM1 + 20 + d * sl);
      });
      // The lid is a 30 mm slab: its outline swept through its thickness (so
      // seen end-on, from the tail or the keys, it still reads as a board).
      const th = { r: -30 * sl, up: 30 * c };
      const o0 = Q(0, 0, 0);
      const o1 = Q(th.r, 0, th.up);
      const T = P(o1.u - o0.u, o1.v - o0.v);
      const lidUnder = poly(lidPts);
      let lid = Skia.Path.MakeFromOp(lidUnder, poly(lidPts.map((q) => P(q.u + T.u, q.v + T.v))), PathOp.Union) ?? lidUnder;
      for (let i = 0; i < lidPts.length; i++) {
        const a = lidPts[i];
        const z = lidPts[(i + 1) % lidPts.length];
        lid = Skia.Path.MakeFromOp(lid, poly([a, z, P(z.u + T.u, z.v + T.v), P(a.u + T.u, a.v + T.v)]), PathOp.Union) ?? lid;
      }
      b.mat.piano.addPath(asWinding(lid));
      // The prop: from the bentside rim up to the lid's underside.
      const propA = GRAND.L * 0.5;
      const propD = 1000;
      line(b.stick, Q(GRAND.W * 0.24, A0 + propA, RIM1), Q(-GRAND.W / 2 + propD * c, A0 + propA, RIM1 + propD * sl));
      // The legs (a tapered column each, a caster under it).
      for (const [x, a] of [
        [-GRAND.W / 2 + 90, 120],
        [GRAND.W / 2 - 90, 120],
        [-GRAND.W * 0.22, GRAND.L * 0.86],
      ] as const) {
        const q = X(x, A0 + a);
        b.mat.piano.addPath(poly([P(q - 60, g - RIM0), P(q + 60, g - RIM0), P(q + 42, g - 90), P(q - 42, g - 90)]));
        b.mat.brass.addPath(rr(q - 46, g - 100, q + 46, g - 70, 6));
        b.mat.steel.addPath(ellipse(P(q, g - 36), 36, 36));
      }
      // The pedal lyre under the middle of the keybed, its pedals toward the player.
      const ly = X(0, A0 + 230);
      b.mat.piano.addPath(rr(ly - 70, g - RIM0, ly + 70, g - 560, 10));
      b.mat.piano.addPath(poly([P(ly - 60, g - 560), P(ly + 60, g - 560), P(ly + 30, g - 130), P(ly - 30, g - 130)]));
      b.mat.piano.addPath(rr(ly - 110, g - 150, ly + 110, g - 60, 12));
      for (const x of [-60, 0, 60]) b.mat.brass.addPath(capsule(Q(x, 230, 95), Q(x, 130, 80), 14));
      // The key slip and the key fronts along the front edge (seen where the view shows it).
      if (toward < -0.3) {
        const k0 = X(-612, A0);
        const k1 = X(612, A0);
        b.mat.ivory.addPath(rr(Math.min(k0, k1), g - 745, Math.max(k0, k1), g - 715, 3));
      }
      arm([shL, Q(-120, 120, 800), Q(-170, 360, 760)]);
      arm([shR, Q(120, 120, 800), Q(170, 360, 760)]);
      // (Seen from the tail, the hands are behind the case: not drawn over it.)
      if (toward < 0.3) {
        hand(Q(-170, 360, 760));
        hand(Q(170, 360, 760));
      }
      break;
    }
    case 'celesta': {
      // A celesta: a cabinet like a small upright, 1000 wide × 480 deep ×
      // 1080 high (drawing default for the 5-octave class), the keyboard
      // shelf at 720 mm toward the player, two front legs and a pedal.
      const us = [X(-500, 330), X(500, 330), X(-500, 810), X(500, 810)];
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      b.mat.piano.addPath(rr(u0, g - 1080, u1, g - 680, 16));
      const back = [X(-500, 480), X(500, 480), X(-500, 810), X(500, 810)];
      b.mat.piano.addPath(rr(Math.min(...back), g - 680, Math.max(...back), g - 140, 10));
      const kq = [X(-430, 330), X(430, 330), X(-430, 480), X(430, 480)];
      b.mat.ivory.addPath(rr(Math.min(...kq), g - 735, Math.max(...kq), g - 705, 3));
      for (const x of [-440, 440]) {
        const q = X(x, 360);
        b.mat.piano.addPath(poly([P(q - 40, g - 680), P(q + 40, g - 680), P(q + 30, g - 40), P(q - 30, g - 40)]));
      }
      b.mat.brass.addPath(capsule(Q(0, 470, 90), Q(0, 380, 80), 14));
      arm([shL, Q(-120, 120, 800), Q(-150, 360, 750)]);
      arm([shR, Q(120, 120, 800), Q(150, 360, 750)]);
      hand(Q(-150, 360, 750));
      hand(Q(150, 360, 750));
      break;
    }
    case 'timpani': {
      TIMP.forEach((dr, i) => {
        const c = toPlan(s, Math.sin(dr.a * DEG) * 720, -Math.cos(dr.a * DEG) * 720);
        const at = uv(view, { x: c.u, y: s.p.y, z: c.v });
        b.extra.push({ key: `tp:${s.id}:${i}:${view}`, el: <Group key={`tp:${s.id}:${i}:${view}`} transform={[{ translateX: at.u }]}><TimpanoSide R={dr.d / 2} headY={g - 820} floorY={g} /></Group> });
      });
      arm([shL, Q(-260, 60, 1150), Q(-200, 380, 1000)]);
      arm([shR, Q(260, 60, 1150), Q(200, 380, 1000)]);
      hand(Q(-200, 380, 1000));
      hand(Q(200, 380, 1000));
      break;
    }
    case 'percussion': {
      if (!/\.2$/.test(s.id)) {
        // A concert bass drum on its stand (BassDrumElev): its axis is the
        // player's left–right, so side-on to a view where that runs along u.
        const c = Q(0, BASS_DRUM_STATION.ahead, 0);
        b.extra.push({ key: `bd:${s.id}:${view}`, el: <BassDrumElev key={`bd:${s.id}:${view}`} cu={c.u} floorV={g} a={rightU} /> });
      } else {
        // The concert snare (14 × 6½ in) on its stand, its batter head at
        // 820 mm; an 18 in suspended cymbal on a straight stand at 1150 mm.
        const sn = X(-120, 480);
        const top = g - 820;
        const D = CONCERT_SNARE_14x65.depth.mm;
        b.extra.push({ key: `sn:${s.id}:${view}`, el: <Group key={`sn:${s.id}:${view}`}><SnareStandSide cx={sn} basketY={top + D + 14} hoopR={CONCERT_SNARE_14x65.d.mm / 2} floorY={g} armsDeg={[20, 160, 270]} /><Group transform={[{ translateX: sn }, { translateY: top }]}><DrumExterior spec={CONCERT_SNARE_14x65} /></Group></Group> });
        const cy = Q(420, 420, 1150);
        line(b.legs, P(cy.u, cy.v + 30), P(cy.u, g - 120));
        line(b.legs, P(cy.u, g - 120), P(cy.u - 220, g));
        line(b.legs, P(cy.u, g - 120), P(cy.u + 220, g));
        b.extra.push({ key: `scy:${s.id}:${view}`, el: <CymbalSide key={`scy:${s.id}:${view}`} cx={cy.u} cy={cy.v} d={18 * IN} tiltDeg={0} /> });
      }
      arm([shL, Q(-220, 60, 1100), Q(-140, 330, 950)]);
      arm([shR, Q(220, 60, 1100), Q(80, 330, 950)]);
      hand(Q(-140, 330, 950));
      hand(Q(80, 330, 950));
      break;
    }
    /* ── group 5 (sections) ── */
    case 'sax':
    case 'bariSax': {
      // The neck from the mouth, the body down the player's right to the
      // bow, the bell turned up and forward (the baritone's bow near the floor).
      const big = k === 'bariSax';
      const mouth = Q(0, 110, 1140 + lift);
      const top = Q(30, 170, (big ? 1090 : 1060) + lift);
      const bow = Q(big ? 150 : 120, big ? 240 : 210, (big ? 270 : 560) + lift);
      b.mat.silver.addPath(capsule(mouth, top, 9));
      b.mat.brass.addPath(taper(top, bow, big ? 34 : 22, big ? 56 : 36));
      b.mat.brass.addPath(ellipse(bow, big ? 62 : 42, big ? 52 : 36));
      // The bell (art pass 2026-10-10: the flare ended in a flat edge and read
      // as a yellow triangle): alto bell Ø 120 mm, baritone Ø 230, opening up
      // and forward; its rim drawn as the ellipse its circle makes in this view.
      const bl = { r: big ? 230 : 190, f: big ? 330 : 300, up: (big ? 640 : 780) + lift };
      const bw = { r: big ? 150 : 120, f: big ? 240 : 210, up: (big ? 270 : 560) + lift };
      const bellEnd = Q(bl.r, bl.f, bl.up);
      const RB = big ? 115 : 60;
      b.mat.brass.addPath(flare(bow, bellEnd, big ? 50 : 34, RB));
      {
        const ax = { r: bl.r - bw.r, f: bl.f - bw.f, up: bl.up - bw.up };
        const L3 = Math.hypot(ax.r, ax.f, ax.up) || 1;
        const toward = front ? ax.r * Math.sin(F) - ax.f * Math.cos(F) : ax.r * Math.cos(F) + ax.f * Math.sin(F);
        const du = ax.r * rightU + ax.f * fwdU;
        const ang = Math.atan2(-ax.up, du);
        const minor = Math.max(8, (RB * Math.abs(toward)) / L3 + RB * 0.18);
        const rim = make();
        rim.addOval(Skia.XYWHRect(-minor, -RB, minor * 2, RB * 2));
        const hole = make();
        hole.addOval(Skia.XYWHRect(-minor * 0.78, -RB * 0.84, minor * 1.56, RB * 1.68));
        const m = Skia.Matrix().translate(bellEnd.u, bellEnd.v).rotate(ang);
        rim.transform(m);
        hole.transform(m);
        b.mat.brass.addPath(rim);
        b.holes.addPath(hole);
      }
      if (big) b.mat.brass.addPath(ellipse(Q(-20, 150, 1180 + lift), 50, 44));
      for (const t of [0.3, 0.45, 0.6, 0.75]) b.mat.silver.addPath(ellipse(P(top.u + (bow.u - top.u) * t, top.v + (bow.v - top.v) * t), 11, 11));
      const h1 = P(top.u + (bow.u - top.u) * 0.22, top.v + (bow.v - top.v) * 0.22);
      const h2 = P(top.u + (bow.u - top.u) * 0.62, top.v + (bow.v - top.v) * 0.62);
      arm([shL, Q(-160, 150, 950 + lift), h1]);
      arm([shR, Q(260, 100, 820 + lift), h2]);
      hand(h1);
      hand(h2);
      break;
    }
    case 'guitar': {
      // The guitar on the lap, the neck rising to the left; the amp on the
      // floor at the player's right, its speaker toward the player's front.
      b.mat.varnish.addPath(ellipse(Q(60, 170, 700), 190 * faceOn, 210));
      b.mat.ebony.addPath(capsule(Q(-100, 180, 760), Q(-560, 170, 930), 18));
      arm([shL, Q(-300, 160, 820), Q(-440, 175, 880)]);
      arm([shR, Q(240, 120, 800), Q(90, 180, 700)]);
      hand(Q(-440, 175, 880));
      hand(Q(90, 180, 700));
      const us = [X(190, 335), X(750, 335), X(190, 605), X(750, 605)];
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      b.mat.piano.addPath(rr(u0, g - 540, u1, g - 10, 24));
      if (Math.abs(fwdU) < 0.6) b.holes.addPath(ellipse(Q(470, 605, 300), 130 * Math.max(0.35, Math.abs(rightU)), 130));
      line(b.legs, Q(60, 170, 600), Q(240, 335, 120));
      break;
    }
    // The drum kit (one kind for groups 4 and 5) is drawn by BandArt.tsx
    // (the switch's default): Lab 1's kit from the hall, KitSide in section.
    case 'marimba':
    case 'vibraphone': {
      // The keyboard along the player's right–left, the bars at their own
      // height (Lab 2's ROWS); the resonators hang under them, longest at the
      // low end (the player's left); a frame end and wheels at each end.
      const row = k === 'marimba' ? ROWS.marimba43 : ROWS.vibe;
      const L = row.Lframe.mm;
      const hb = row.hBars.mm;
      const us = [X(-L / 2, 220), X(L / 2, 220), X(-L / 2, 220 + row.Dlow.mm), X(L / 2, 220 + row.Dhigh.mm)];
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      (k === 'marimba' ? b.mat.varnish : b.mat.silver).addPath(rr(u0, g - hb - 26, u1, g - hb + 14, 10));
      if (Math.abs(rightU) > 0.35) {
        const n = 14;
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1);
          const x = -L / 2 + 70 + t * (L - 140);
          const u = X(x, 220 + (row.Dlow.mm + (row.Dhigh.mm - row.Dlow.mm) * t) * 0.45);
          const len = (k === 'marimba' ? 720 : 520) * Math.pow(1 - t, 0.8) + 140;
          (k === 'marimba' ? b.mat.steel : b.mat.brass).addPath(rr(u - 20, g - hb + 14, u + 20, g - hb + 14 + len, 8));
        }
      } else b.mat.steel.addPath(rr(u0 + 40, g - hb + 14, u1 - 40, g - hb + 120, 10));
      for (const sx of [-1, 1]) {
        const u = X(sx * (L / 2 - 50), 220 + (sx < 0 ? row.Dlow.mm : row.Dhigh.mm) / 2);
        line(b.legs, P(u, g - hb + 14), P(u, g - 40));
        addFig(b, 'shoe', ellipse(P(u, g - 30), 34, 30));
      }
      if (k === 'vibraphone') line(b.legs, Q(-250, 260, 120), Q(250, 260, 120));
      const hy = hb + 140;
      arm([shL, Q(-240, 120, 1150), Q(-220, 300, hy)]);
      arm([shR, Q(240, 120, 1150), Q(220, 300, hy)]);
      hand(Q(-220, 300, hy));
      hand(Q(220, 300, hy));
      for (const sx of [-1, 1]) {
        line(b.stick, Q(sx * 220, 300, hy), Q(sx * 300, 460, hb + 30));
        b.holes.addPath(ellipse(Q(sx * 300, 460, hb + 30), 24, 24));
      }
      break;
    }
    case 'congas': {
      // A conga and a tumba, 30 in tall (M04a), the heads under the hands.
      const H = CONGA_DIMS.height.mm;
      for (const [x, d] of [
        [-170, CONGA_DIMS.congaD.mm],
        [170, CONGA_DIMS.tumbaD.mm],
      ] as const) {
        const R = d / 2;
        const u = X(x, 380);
        b.mat.varnish.addPath(poly([P(u - R, g - H), P(u + R, g - H), P(u + R * 1.1, g - H * 0.6), P(u + R * 0.8, g), P(u - R * 0.8, g), P(u - R * 1.1, g - H * 0.6)]));
        b.mat.steel.addPath(rr(u - R - 8, g - H - 14, u + R + 8, g - H + 10, 6));
        b.mat.hide.addPath(ellipse(P(u, g - H - 6), R, 14));
      }
      arm([shL, Q(-230, 160, 1000), Q(-170, 330, H + 60)]);
      arm([shR, Q(230, 160, 1000), Q(170, 330, H + 60)]);
      hand(Q(-170, 330, H + 60));
      hand(Q(170, 330, H + 60));
      break;
    }
    case 'perctable': {
      // A padded table of small percussion; a cymbal on its stand at the right.
      const us = [X(-450, 200), X(450, 200), X(-450, 650), X(450, 650)];
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      b.mat.chair.addPath(rr(u0, g - 880, u1, g - 840, 10));
      line(b.legs, P(u0 + 40, g - 840), P(u0 + 40, g));
      line(b.legs, P(u1 - 40, g - 840), P(u1 - 40, g));
      b.mat.varnish.addPath(ellipse(Q(-250, 440, 905), 125, 26));
      b.mat.maple.addPath(capsule(Q(40, 540, 900), Q(170, 490, 915), 26));
      const tri = Q(270, 330, 1020);
      line(b.hair, P(tri.u - 75, tri.v + 130), P(tri.u + 75, tri.v + 130));
      line(b.hair, P(tri.u - 75, tri.v + 130), P(tri.u, tri.v));
      line(b.hair, P(tri.u + 75, tri.v + 130), P(tri.u, tri.v));
      const cy = Q(650, 380, 1150);
      b.mat.brass.addPath(ellipse(cy, 229, 12));
      line(b.legs, cy, P(cy.u, g));
      arm([shL, Q(-220, 160, 1060), Q(-160, 330, 940)]);
      arm([shR, Q(220, 160, 1060), Q(140, 330, 940)]);
      hand(Q(-160, 330, 940));
      hand(Q(140, 330, 940));
      break;
    }
    /* ── group 2 (voices; group 4's lead vocal is the same `singer`) ── */
    case 'singer': {
      // Hands free, arms at the sides (group 2).
      arm([shL, Q(-232, 10, 1150), Q(-244, 30, 870)]);
      arm([shR, Q(232, 10, 1150), Q(244, 30, 870)]);
      hand(Q(-246, 34, 830));
      hand(Q(246, 34, 830));
      break;
    }
    case 'chorister': {
      // A music folder held open in front of the chest (group 2).
      arm([shL, Q(-215, 60, 1120), Q(-150, 250, 1220)]);
      arm([shR, Q(215, 60, 1120), Q(150, 250, 1220)]);
      if (Math.abs(rightU) > 0.3) b.mat.ebony.addPath(poly([Q(-175, 255, 1160), Q(175, 255, 1160), Q(175, 300, 1390), Q(-175, 300, 1390)]));
      else b.mat.ebony.addPath(capsule(Q(0, 250, 1160), Q(0, 310, 1390), 14));
      hand(Q(-150, 250, 1220));
      hand(Q(150, 250, 1220));
      break;
    }
    case 'conductor': {
      arm([shL, Q(-330, 120, 1350), Q(-380, 260, 1560)]);
      arm([shR, Q(330, 120, 1350), Q(360, 260, 1600)]);
      hand(Q(-380, 260, 1560));
      hand(Q(360, 260, 1600));
      line(b.stick, Q(360, 260, 1600), Q(470, 520, 1900));
      break;
    }
    default:
      // Group 4: the band players' instruments (BandArt.tsx).
      if (BAND_KINDS.has(k)) bandElevInstrument(b, s, view, { ...BAND_TOOLS, Q, X, arm, hand, shL, shR, g, o, front, rightU, fwdU });
  }
  const headC = P(o.u, g - ((standing ? DIMS.standingHead : DIMS.seatedHead) - 113));
  // The neck ends at the collar (figure review 2026-10-08: drawn over the
  // shirt down to below the shoulder line, it read as a stretched neck).
  const NECK_V = g - sh - 55;
  const head = front ? headFront(pt(headC.u, headC.v), 104, NECK_V) : headProfile(pt(headC.u, headC.v), 104, NECK_V, fwdU >= 0 ? 1 : -1);
  addFig(b, 'skin', head.fill);
  if (before) b.fig.skin = Skia.Path.MakeFromOp(b.fig.skin, before, PathOp.Difference) ?? b.fig.skin;
}

function elevStand(b: Batch, s: Seat, view: 'front' | 'section') {
  if (!s.stand) return;
  const o = uv(view, s.stand);
  const g = o.v;
  if (view === 'front') b.desks.addPath(rr(o.u - 250, g - 1180, o.u + 250, g - 1060, 8));
  else b.desks.addPath(poly([P(o.u - 30, g - 1200), P(o.u + 30, g - 1200), P(o.u + 60, g - 1040), P(o.u, g - 1040)]));
  line(b.legs, P(o.u, g - 1060), P(o.u, g - 120));
  line(b.legs, P(o.u, g - 120), P(o.u - 200, g));
  line(b.legs, P(o.u, g - 120), P(o.u + 200, g));
}

/* ═══════════════════ painting a batch ═══════════════════ */
function PaintBatch({ b }: { b: Batch }) {
  return (
    <Group>
      <Path path={b.legs} style="stroke" strokeWidth={16} strokeCap="round" color="#0b0c0f" />
      <Path path={b.legs} style="stroke" strokeWidth={10} strokeCap="round" color="#4d515b" />
      <FigureMass path={b.fig.seat} tone="seat" />
      <Path path={b.desks}>
        <LinearGradient start={vec(-6000, -8000)} end={vec(6000, 2000)} colors={['#4a4e57', '#2a2c32', '#16171b']} />
      </Path>
      <Path path={b.desks} style="stroke" strokeWidth={4} color="#70747f" opacity={0.8} />
      <FigureMass path={b.fig.trousers} tone="trousers" />
      <FigureMass path={b.fig.shoe} tone="shoe" />
      <FigureMass path={b.fig.shirt} tone="shirt" />
      {(Object.keys(MATS) as MatId[]).map((m) => (m === 'riser' ? null : <Mass key={m} path={b.mat[m]} mat={m} />))}
      <Path path={b.holes} color="#0a0705" opacity={0.85} />
      <Path path={b.stick} style="stroke" strokeWidth={12} strokeCap="round" color="#3a2010" />
      <Path path={b.hair} style="stroke" strokeWidth={5} strokeCap="round" color="#efe6cc" opacity={0.9} />
      {b.extra.map((e) => e.el)}
      <FigureHead fill={b.fig.skin} />
    </Group>
  );
}

/* ═══════════════════ the stage under the players ═══════════════════ */
function stageFloor(s: Seating): SkPath {
  const st = s.stage;
  return rr(st.x0, st.z0, st.x1, st.z1, 260);
}
function risersPlan(s: Seating): SkPath {
  const p = make();
  for (const r of s.risers) p.addPath(rr(r.x0, r.z0, r.x1, r.z1, 40));
  return p;
}

type Built = { layers: Batch[]; hiBatch: Batch | null };
const cache = new Map<string, Built>();

function build(s: Seating, view: StageView, hi: string | null): Built {
  const k = `${s.id}|${view}|${hi ?? ''}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const seats = [...s.seats, ...(s.conductor ? [s.conductor] : [])].filter((q) => view !== 'section' || Math.abs(q.p.x) <= SECTION_SLICE || q.kind === 'conductor');
  // Group 4: the stage gear is painted with the players, by depth (in the
  // section only what is near the centre line, like the players).
  const gear = (s.gear ?? []).filter((g) => view !== 'section' || Math.abs(g.p.x) <= SECTION_SLICE);
  type Item = { seat: Seat; gear?: undefined } | { gear: Gear; seat?: undefined };
  const items: Item[] = [...seats.map((q) => ({ seat: q })), ...gear.map((g) => ({ gear: g }))];
  const at = (it: Item) => (it.seat ? it.seat.p : it.gear!.p);
  // From above, the gear lies under the players; from the hall and the
  // side, everything far to near (a wedge or DI box a touch nearer).
  const depth = (it: Item) => (view === 'plan' ? (it.gear ? -1e9 : -at(it).y) : (view === 'front' ? at(it).z : at(it).x) + (it.gear && !gearBehind(it.gear) ? 1 : 0));
  const sorted = [...items].sort((a, b) => depth(a) - depth(b));
  const layers: Batch[] = [];
  // Plan: one layer (nothing overlaps from above but the stands); the
  // elevations: a layer per ~600 mm of depth, painted far to near.
  const step = view === 'plan' ? Infinity : 600;
  let cur: Batch | null = null;
  let curD = -Infinity;
  const paint = (into: Batch, it: Item) => {
    if (it.gear) {
      if (view === 'plan') bandGearPlan(into, it.gear, BAND_TOOLS);
      else bandGearElev(into, it.gear, view, BAND_TOOLS);
      return;
    }
    const q = it.seat!;
    if (view === 'plan') {
      planStand(into, q);
      planSeat(into, q);
    } else {
      elevStand(into, q, view);
      elevSeat(into, q, view);
    }
  };
  for (const it of sorted) {
    if (!cur || depth(it) - curD > step) {
      cur = newBatch();
      curD = depth(it);
      layers.push(cur);
    }
    paint(cur, it);
  }
  let hiBatch: Batch | null = null;
  if (hi) {
    hiBatch = newBatch();
    for (const it of sorted.filter((x) => (x.seat ? x.seat.section === hi || (hi === 'cond' && x.seat.kind === 'conductor') : x.gear!.section === hi))) paint(hiBatch, it);
  }
  const out = { layers, hiBatch };
  cache.set(k, out);
  return out;
}

/** The section's outline in a view (amber, a rounded box): never colour alone. */
export function sectionOutline(s: Seating, sectionId: string, view: StageView): SkPath {
  if (sectionId === 'cond' && s.podium) {
    const P0 = s.podium;
    const a = uv(view, { x: P0.c.x - P0.w / 2 - 150, y: -2000, z: P0.c.z - P0.d / 2 - 150 });
    const b = uv(view, { x: P0.c.x + P0.w / 2 + 150, y: 80, z: P0.c.z + P0.d / 2 + 150 });
    return rr(a.u, a.v, b.u, b.v, 120);
  }
  const bx = sectionBox(s, sectionId, 60);
  if (view === 'plan') {
    // The union of a disc round each player: the section's real shape.
    let out: SkPath | null = null;
    for (const q of s.seats.filter((x) => x.section === sectionId)) {
      const c = ellipse(P(q.p.x, q.p.z), 470, 470);
      out = out ? Skia.Path.MakeFromOp(out, c, PathOp.Union) ?? out : c;
    }
    // Group 4: a player's amp is part of the section on a stage plot.
    for (const g of (s.gear ?? []).filter((x) => x.section === sectionId && (x.kind === 'combo' || x.kind === 'bassRig'))) {
      const c = ellipse(P(g.p.x, g.p.z), 520, 520);
      out = out ? Skia.Path.MakeFromOp(out, c, PathOp.Union) ?? out : c;
    }
    return out ?? make();
  }
  const a = uv(view, bx.min);
  const b = uv(view, bx.max);
  return rr(Math.min(a.u, b.u), Math.min(a.v, b.v), Math.max(a.u, b.u), Math.max(a.v, b.v), 120);
}

/** The whole seating in one view (Skia elements in mm of the view's (u, v)). */
export function SeatingView({ seating, view, hi = null }: { seating: Seating; view: StageView; hi?: string | null }) {
  const g = useMemo(() => build(seating, view, hi), [seating, view, hi]);
  const floor = useMemo(() => (view === 'plan' ? stageFloor(seating) : null), [seating, view]);
  const risers = useMemo(() => {
    if (view === 'plan') return risersPlan(seating);
    const p = make();
    for (const r of seating.risers) {
      if (view === 'section' && (r.x0 > SECTION_SLICE || r.x1 < -SECTION_SLICE)) continue;
      const a = uv(view, { x: r.x0, y: -r.h, z: r.z0 });
      const b = uv(view, { x: r.x1, y: 0, z: r.z1 });
      p.addPath(rr(Math.min(a.u, b.u), Math.min(a.v, b.v), Math.max(a.u, b.u), Math.max(a.v, b.v), 14));
    }
    return p;
  }, [seating, view]);
  const podium = useMemo(() => {
    const P0 = seating.podium;
    if (!P0) return null;
    const a = uv(view, { x: P0.c.x - P0.w / 2, y: -P0.h, z: P0.c.z - P0.d / 2 });
    const b = uv(view, { x: P0.c.x + P0.w / 2, y: 0, z: P0.c.z + P0.d / 2 });
    return rr(Math.min(a.u, b.u), Math.min(a.v, b.v), Math.max(a.u, b.u), Math.max(a.v, b.v), view === 'plan' ? 60 : 10);
  }, [seating, view]);
  // group 2: a choir riser's back rail (WENGER-SIG: 42 in above the top
  // step), and — in elevation — the area where children stand, marked
  // instead of drawn (E06 shows children from above only).
  const rails = useMemo(() => {
    const p = make();
    for (const r of seating.risers) {
      if (!r.rail) continue;
      if (view === 'plan') {
        line(p, P(r.x0, r.z0 + 20), P(r.x1, r.z0 + 20));
        continue;
      }
      if (view === 'section' && (r.x0 > SECTION_SLICE || r.x1 < -SECTION_SLICE)) continue;
      const top = -(r.h + r.rail);
      if (view === 'front') {
        line(p, P(r.x0, top), P(r.x1, top));
        for (let x = r.x0; x <= r.x1 + 1; x += (r.x1 - r.x0) / Math.max(1, Math.round((r.x1 - r.x0) / 900))) line(p, P(x, top), P(x, -r.h));
      } else {
        const u = -r.z0 - 20;
        line(p, P(u, top), P(u, -r.h));
        line(p, P(u, top), P(u - 60, top));
      }
    }
    return p;
  }, [seating, view]);
  const kids = useMemo(() => {
    if (view === 'plan') return null;
    const cs = seating.seats.filter((q) => q.kind === 'child' && (view !== 'section' || Math.abs(q.p.x) <= SECTION_SLICE));
    if (!cs.length) return null;
    const us = cs.map((q) => uv(view, q.p).u);
    const top = Math.max(...cs.map((q) => headTop(q)));
    const floorV = Math.max(...cs.map((q) => uv(view, q.p).v));
    return rr(Math.min(...us) - 260, -top, Math.max(...us) + 260, floorV, 60);
  }, [seating, view]);
  const outline = useMemo(() => (hi ? sectionOutline(seating, hi, view) : null), [seating, hi, view]);
  const st = seating.stage;
  const veil = useMemo(() => {
    if (view === 'plan') return rr(st.x0 - 2000, st.z0 - 2000, st.x1 + 2000, st.z1 + 6000, 0);
    const a = uv(view, { x: st.x0 - 2000, y: -6000, z: st.z0 - 2000 });
    const b = uv(view, { x: st.x1 + 2000, y: 500, z: st.z1 + 6000 });
    return rr(Math.min(a.u, b.u), Math.min(a.v, b.v), Math.max(a.u, b.u), Math.max(a.v, b.v), 0);
  }, [view, st.x0, st.x1, st.z0, st.z1]);
  return (
    <Group>
      {floor ? (
        <Path path={floor}>
          <LinearGradient start={vec(st.x0, st.z0)} end={vec(st.x1, st.z1)} colors={['#2a2018', '#1e1711', '#15100c']} />
        </Path>
      ) : null}
      <Mass path={risers} mat="riser" contour={6} />
      <Path path={rails} style="stroke" strokeWidth={30} strokeCap="round" color="#0b0c0f" />
      <Path path={rails} style="stroke" strokeWidth={18} strokeCap="round" color="#8d929d" />
      {kids ? (
        <>
          <Path path={kids} color="#6fa8ff" opacity={0.1} />
          <Path path={kids} style="stroke" strokeWidth={14} color="#6fa8ff" opacity={0.55}>
            <DashPathEffect intervals={[60, 40]} />
          </Path>
        </>
      ) : null}
      {podium ? <Mass path={podium} mat="riser" contour={6} /> : null}
      {g.layers.map((b, i) => (
        <PaintBatch key={i} b={b} />
      ))}
      {hi && g.hiBatch ? (
        <>
          <Path path={veil} color="#05060a" opacity={0.42} />
          <PaintBatch b={g.hiBatch} />
        </>
      ) : null}
      {outline ? <Path path={outline} style="stroke" strokeWidth={view === 'plan' ? 40 : 34} color={AMBER} opacity={0.95} /> : null}
    </Group>
  );
}

/** The floor line (front and section): the stage boards' edge. */
export function floorLine(s: Seating, view: StageView): { u0: number; u1: number } {
  const st = s.stage;
  if (view === 'front') return { u0: st.x0, u1: st.x1 };
  return { u0: -st.z1, u1: -st.z0 };
}

/** Where a seat's head is in a view (labels keep off it). */
export function headAt(q: Seat, view: StageView): { u: number; v: number } {
  const o = uv(view, q.p);
  return view === 'plan' ? o : { u: o.u, v: o.v - headTop(q) + 113 };
}
