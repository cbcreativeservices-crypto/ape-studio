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
import { BlurMask, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { FigureHead, FigureMass, headAbove, headFront, headProfile, limb } from '../players/PlayerFigure';
import { pt } from '../players/playerPose.ts';
import { outline, BOWED, type BowedSpec } from '../bowed/bowedSpec.ts';
import { TimpanoSide, TimpanoTop } from '../concert/TimpaniArt';
import { DrumPlan, CymbalPlan } from '../drums/DrumArt';
import { CONCERT_SNARE_14x65 } from '../drums/concertSpec.ts';
import { DEG, planDir, uv, type StageView } from './frameS.ts';
import { DIMS, headTop, sectionBox, type Gear, type Seat, type Seating } from './seating.ts';
// Group 4: the band players and the stage gear (drawn into these batches).
import { BAND_KINDS, bandElevInstrument, bandElevWhole, bandGearElev, bandGearPlan, bandPlanInstrument, bandPlanWhole, gearBehind, type BandTools } from './BandArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const IN = 25.4;
/** The section view shows the players within this distance of the centre line (mm). */
export const SECTION_SLICE = 1700;
/** The timpani set round its player: head diameters (in, the concert lessons'
 *  sizes) low to high, left to right, on an arc 720 mm out (drawing default). */
const TIMP = [
  { d: 32 * IN, a: -58 },
  { d: 29 * IN, a: -19 },
  { d: 26 * IN, a: 19 },
  { d: 23 * IN, a: 55 },
] as const;
/** A grand piano's drawn size (mm): the piano family's ≈ 2.1 m grand, 1.5 m wide. */
const GRAND = { L: 2100, W: 1500 } as const;

/* ── materials (upper-left light; the house palette) ── */
type Mat = { ramp: string[]; rim: string; core: string; edge: string; rimW: number; coreW: number };
const MATS = {
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

/* ── geometry helpers (build time) ── */
type P2 = { u: number; v: number };
const P = (u: number, v: number): P2 => ({ u, v });
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
  const m = Skia.Matrix().translate(s.p.x, s.p.z).rotate(F);
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

/** Group 4: the path builders BandArt.tsx draws with. */
const BAND_TOOLS: BandTools = { P, capsule, taper, ellipse, rr, poly, line, flare };

/* ═══════════════════ PLAN (from above) ═══════════════════ */

function planSeat(b: Batch, s: Seat) {
  // Group 4: the drum kit draws itself, its drummer included.
  if (bandPlanWhole(b, s)) return;
  const put = placer(s);
  const standing = s.posture === 'standing';
  const k = s.kind;
  // Chair (seated players; a pianist's bench).
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
      const spec = BOWED.cello;
      // Leaning back between the knees: the body foreshortened along y.
      const tail = P(10, -520);
      const dir = P(-0.12, 0.99);
      put(b.mat.varnish, bodyPath(spec, tail, dir, 0.42, 1));
      const nb = P(tail.u + dir.u * bodyLen(spec) * 0.42, tail.v + dir.v * bodyLen(spec) * 0.42);
      const scroll = P(nb.u + dir.u * neckLen(spec) * 0.42, nb.v + dir.v * neckLen(spec) * 0.42);
      put(b.mat.ebony, capsule(nb, scroll, 22));
      put(b.stick, line(make(), tail, P(tail.u + 30, tail.v - 230)));
      arm([LS, P(-250, -100), P(scroll.u - 40, scroll.v - 30)]);
      hand(P(scroll.u - 40, scroll.v - 40));
      const hR = P(330, -330);
      arm([RS, P(300, -120), hR]);
      hand(hR);
      put(b.stick, line(make(), hR, P(hR.u - 720, hR.v - 40)));
      put(b.hair, line(make(), P(hR.u, hR.v - 12), P(hR.u - 715, hR.v - 52)));
      break;
    }
    case 'bass': {
      const spec = BOWED.bass;
      const tail = P(-120, -560);
      const dir = P(-0.05, 0.99);
      put(b.mat.varnish, bodyPath(spec, tail, dir, 0.28, 1));
      const nb = P(tail.u + dir.u * bodyLen(spec) * 0.28, tail.v + dir.v * bodyLen(spec) * 0.28);
      const scroll = P(nb.u + dir.u * neckLen(spec) * 0.28, nb.v + dir.v * neckLen(spec) * 0.28);
      put(b.mat.ebony, capsule(nb, scroll, 26));
      arm([LS, P(-240, -60), P(scroll.u - 30, scroll.v - 20)]);
      hand(P(scroll.u - 30, scroll.v - 30));
      const hR = P(160, -420);
      arm([RS, P(260, -160), hR]);
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
      put(b.mat.brass, ellipse(P(170, -110), 88, 185));
      put(b.mat.brass, flare(P(210, -10), P(260, 120), 40, 150));
      put(b.holes, ellipse(P(262, 122), 110, 40));
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
      put(b.mat.piano, rr(-500, -760, 500, -250, 30));
      put(b.desks, rr(-470, -300, 470, -255, 8));
      arm([LS, P(-200, -170), P(-160, -290)]);
      arm([RS, P(200, -170), P(160, -290)]);
      hand(P(-160, -290));
      hand(P(160, -290));
      break;
    }
    case 'piano': {
      // A grand from above, as the pianist sits at it: the long straight
      // side on the left (the bass), the curved bentside on the right, the
      // keyboard across the front; the lid open on its hinge along the
      // straight side, so it opens toward the right.
      const { L, W } = GRAND;
      const y0 = -330;
      const f = (x: number, ahead: number) => P(x, y0 - ahead);
      const caseP = make();
      const a = f(-W / 2, 0);
      caseP.moveTo(a.u, a.v);
      const q = (x1: number, f1: number, x2: number, f2: number, x3: number, f3: number) => {
        const p1 = f(x1, f1);
        const p2 = f(x2, f2);
        const p3 = f(x3, f3);
        caseP.cubicTo(p1.u, p1.v, p2.u, p2.v, p3.u, p3.v);
      };
      const t = f(-W / 2, L * 0.95);
      caseP.lineTo(t.u, t.v);
      q(-W / 2, L * 1.01, -W * 0.18, L * 1.01, -W * 0.02, L * 0.93);
      q(W * 0.18, L * 0.82, W * 0.5, L * 0.66, W / 2, L * 0.42);
      const r0 = f(W / 2, 0);
      caseP.lineTo(r0.u, r0.v);
      caseP.close();
      put(b.mat.piano, caseP);
      // The raised lid's edge (seen from above), the plate under it, the keys.
      put(b.hair, line(make(), f(-W / 2 + 40, L * 0.9), f(W * 0.62, L * 0.35)));
      put(b.mat.brass, ellipse(P(-W * 0.08, y0 - L * 0.48), W * 0.3, L * 0.3));
      put(b.desks, rr(-W / 2 + 30, y0 + 5, W / 2 - 30, y0 - 150, 8));
      arm([LS, P(-200, -160), P(-160, -300)]);
      arm([RS, P(200, -160), P(160, -300)]);
      hand(P(-160, -300));
      hand(P(160, -300));
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
        // A concert bass drum on its stand: the heads face left and right.
        put(b.mat.varnish, rr(-200, -1080, 200, -170, 20));
        put(b.mat.steel, rr(-230, -1100, -195, -150, 10));
        put(b.mat.steel, rr(195, -1100, 230, -150, 10));
        arm([LS, P(-220, -160), P(-150, -260)]);
        arm([RS, P(240, -200), P(180, -320)]);
        hand(P(180, -320));
        put(b.stick, line(make(), P(180, -320), P(210, -620)));
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
  // The chair.
  if (!standing) {
    const w = front ? 210 : 230;
    b.fig.seat.addPath(rr(o.u - w, g - DIMS.chairSeat - 30, o.u + w, g - DIMS.chairSeat + 10, 12));
    if (front) b.fig.seat.addPath(rr(o.u - 200, g - 900, o.u + 200, g - DIMS.chairSeat - 20, 30));
    else b.fig.seat.addPath(rr(X(0, -230) - 25, g - 900, X(0, -230) + 25, g - DIMS.chairSeat, 12));
    line(b.legs, P(o.u - w + 20, g - DIMS.chairSeat), P(o.u - w + 10, g));
    line(b.legs, P(o.u + w - 20, g - DIMS.chairSeat), P(o.u + w - 10, g));
  }
  // The legs.
  if (standing) {
    for (const sx of [-1, 1]) {
      const xx = front ? o.u + sx * 95 : o.u + sx * 18;
      b.fig.trousers.addPath(taper(P(xx, g - hipUp), P(xx + (front ? sx * 12 : 0), g - 90), 82, 58));
      b.fig.shoe.addPath(ellipse(P(front ? xx + sx * 12 : o.u + Math.sign(fwdU || 1) * 60, g - 35), front ? 55 : 120, 38));
    }
  } else if (front) {
    for (const sx of [-1, 1]) {
      b.fig.trousers.addPath(taper(P(o.u + sx * 105, g - hipUp), P(o.u + sx * 115, g - 520), 84, 72));
      b.fig.trousers.addPath(taper(P(o.u + sx * 115, g - 520), P(o.u + sx * 125, g - 90), 66, 52));
      b.fig.shoe.addPath(ellipse(P(o.u + sx * 128, g - 35), 58, 38));
    }
  } else {
    const fs = Math.sign(fwdU || -1);
    const knee = P(o.u + fs * 400, g - 520);
    b.fig.trousers.addPath(taper(P(o.u, g - hipUp), knee, 86, 70));
    b.fig.trousers.addPath(taper(knee, P(knee.u + fs * 20, g - 90), 64, 52));
    b.fig.shoe.addPath(ellipse(P(knee.u + fs * 90, g - 35), 125, 38));
  }
  // The torso and shoulders.
  if (front) b.fig.shirt.addPath(poly([P(o.u - 160, g - hipUp + 30), P(o.u + 160, g - hipUp + 30), P(o.u + 215, g - sh), P(o.u - 215, g - sh)]));
  else b.fig.shirt.addPath(poly([P(o.u - 120, g - hipUp + 30), P(o.u + 120, g - hipUp + 30), P(o.u + 115, g - sh), P(o.u - 115, g - sh)]));
  b.fig.shirt.addPath(ellipse(P(o.u, g - sh), front ? 225 : 125, 70));
  const arm = (pts: P2[]) => b.fig.shirt.addPath(limb(pts.map((q) => pt(q.u, q.v)), pts.map((_, i) => (i === 0 ? 58 : i === pts.length - 1 ? 40 : 48))));
  const hand = (c: P2) => b.fig.skin.addPath(ellipse(c, 42, 48));
  const shL = Q(-200, 0, sh - 40);
  const shR = Q(200, 0, sh - 40);
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
      const mouth = Q(tb ? -60 : 0, 110, 1150);
      const bellAt = Q(tb ? -80 : 0, tb ? 520 : 560, 1120);
      const { d, k: kf } = dirOf(0, 0, 1);
      if (kf < 0.35) {
        // The bell toward the viewer, seen end-on.
        const R = tb ? 110 : 62;
        b.mat.brass.addPath(ellipse(bellAt, R, R));
        b.holes.addPath(ellipse(bellAt, R * 0.72, R * 0.72));
        if (tb) b.mat.brass.addPath(rr(X(20, 0) - 14, g - 1120, X(20, 0) + 14, g - 760, 8));
      } else {
        const L = tb ? 900 : 470;
        b.mat.brass.addPath(capsule(mouth, P(mouth.u + d.u * L * kf, mouth.v + 20), tb ? 16 : 18));
        b.mat.brass.addPath(flare(P(mouth.u + d.u * (tb ? 200 : 300) * kf, mouth.v + 6), P(mouth.u + d.u * (tb ? 420 : 470) * kf, mouth.v + 6), 20, tb ? 110 : 62));
      }
      arm([shL, Q(-170, 150, 1000), Q(-30, 280, 1130)]);
      arm([shR, Q(170, 150, 980), Q(30, tb ? 560 : 280, 1110)]);
      hand(Q(-30, 280, 1130));
      hand(Q(30, tb ? 560 : 280, 1110));
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
    case 'piano':
    case 'celesta': {
      // The case ahead of the player: its length along the player's forward
      // axis, its width across — drawn as the box it fills in this view.
      const L = k === 'piano' ? GRAND.L : 480;
      const W = k === 'piano' ? GRAND.W : 1000;
      const us = [X(-W / 2, 330), X(W / 2, 330), X(-W / 2, 330 + L), X(W / 2, 330 + L)];
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      b.mat.piano.addPath(rr(u0, g - 1000, u1, g - 700, 20));
      line(b.legs, P(u0 + 80, g - 700), P(u0 + 80, g));
      line(b.legs, P(u1 - 80, g - 700), P(u1 - 80, g));
      if (k === 'piano') b.mat.piano.addPath(poly([P(u0 + 40, g - 1000), P(u1 - 60, g - 1000), P(u0 + (u1 - u0) * 0.7, g - 1620)]));
      arm([shL, Q(-120, 120, 800), Q(-150, 330, 760)]);
      arm([shR, Q(120, 120, 800), Q(150, 330, 760)]);
      hand(Q(-150, 330, 760));
      hand(Q(150, 330, 760));
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
        // A concert bass drum: its heads face the player's left and right.
        const c = Q(0, 620, 760);
        if (Math.abs(rightU) < 0.5) b.mat.varnish.addPath(rr(c.u - 200, c.v - 457, c.u + 200, c.v + 457, 30));
        else b.mat.varnish.addPath(ellipse(c, 457, 457));
        b.mat.steel.addPath(rr(c.u - 30, g - 300, c.u + 30, g, 8));
      } else {
        const sn = Q(-120, 480, 800);
        b.mat.steel.addPath(rr(sn.u - 180, sn.v - 40, sn.u + 180, sn.v + 40, 10));
        line(b.legs, P(sn.u, sn.v + 40), P(sn.u, g));
        const cy = Q(420, 420, 1150);
        b.mat.brass.addPath(rr(cy.u - 230, cy.v - 8, cy.u + 230, cy.v + 8, 6));
        line(b.legs, P(cy.u, cy.v), P(cy.u, g));
      }
      arm([shL, Q(-220, 60, 1100), Q(-140, 330, 950)]);
      arm([shR, Q(220, 60, 1100), Q(80, 330, 950)]);
      hand(Q(-140, 330, 950));
      hand(Q(80, 330, 950));
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
  const head = front ? headFront(pt(headC.u, headC.v), 104, g - sh + 30) : headProfile(pt(headC.u, headC.v), 104, g - sh + 30, fwdU >= 0 ? 1 : -1);
  b.fig.skin.addPath(head.fill);
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
