/**
 * M01 KICK DRUM — the look (charter §2 layer 3). Drawn ONLY from the anchors
 * in geometry.ts, in MILLIMETRES of the view's (u, v) plane: side u = x,
 * v = y; top u = x, v = z. The scene puts it under one transform, so the
 * drawing, the labels and the hit areas stay aligned at every zoom.
 *
 * Both views are CUTAWAYS (the near half removed: the side view is cut at
 * z = 0, the top view at y = 0), so a mic inside the drum is seen. What the
 * cut leaves is drawn the way a section drawing shows it:
 *   • CUT FACES (shell wall, hoop) — the 8 plies of a 7 mm shell (TAMA-SSC)
 *     and the hoop's end grain, brightest, with a lacquer gloss on the outside;
 *   • the FAR HALF seen through the cut — the shell's inner surface (its
 *     grain lines bunch toward the edges, the way a cylinder foreshortens) and
 *     the far half of each hoop, edge-on, darker;
 *   • the offset PORT, which lies off both cut planes, PROJECTED onto the
 *     head line as an opening in the front-head film (portOpening) — a hole
 *     IN the head where the boom passes, never a shape beyond the head plane.
 *
 * ART PASS (2026-10-04, polish): gradients for form, light from the upper
 * left, rim highlights and soft contact shadows; a strict stroke hierarchy
 * (cut faces 1.6, edges 1, detail 0.6 mm-equivalents). Rules kept:
 *   • nothing here moves (D8) — every path is built ONCE per view and cached
 *     at module scope (`built`), no per-render allocation;
 *   • parts whose geometry is unknown (pedal, beater, port
 *     position, floor, spurs) stay where the model puts them and stay tagged
 *     ILLUSTRATIVE by the labels;
 *   • HARDWARE: Yamaha's RBB-2218 lists 10 tuning bolts (YMH-RC; read as per
 *     head, owner-confirmed 2026-10-04) and the rod PHASE is a placeholder. A cutaway
 *     shows only the rods at its silhouette (2 per head in each view; the
 *     others are behind the far wall or removed with the near half), so they
 *     are drawn at the silhouette and the count is stated in a label —
 *     ILLUSTRATIVE positions, sourced count. Claw hooks: the purpose is
 *     sourced (TAMA-SSC, YMH-HUB), the count is not (one per rod, convention).
 *   • NOT drawn: a beater patch (no source), a port reinforcement ring (its
 *     width is UNKNOWN), any brand mark.
 *   • Head films are drawn ≈ 5 mm thick so they read at phone size (real
 *     film is a fraction of a millimetre): a line weight, not a dimension.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { KICK_ANCHORS, KICK_GEOM as G, portOpening, silhouetteRods } from './geometry.ts';

const PORT = KICK_ANCHORS['bd.port.center'];

type SkPath = ReturnType<typeof Skia.Path.Make>;

/* ── palette (house tokens + material ramps, light from the upper left) ── */
const AMBER = '#ffc64d';
const INK = '#08080a';
/** Ply cut face: alternating birch/maple tones across the 7 mm wall. */
const PLY = ['#4a2a12', '#b98548', '#d9a766', '#9c6631', '#c48f52', '#8a5426', '#5c3417'];
const PLY_LINE = '#2b170a';
/** Natural lacquer on the outer veneer (a cosmetic finish, not a sourced colour). */
const LACQUER_GLOSS = '#ffe2ae';
/** Hoop: end grain on the cut, long grain on the far half. */
const HOOP_CUT = ['#3a220e', '#9a6430', '#c48a4c', '#7a4a20', '#2f1b0a'];
const HOOP_FAR = ['#1d1108', '#4a2c13', '#5e3a1b', '#2a180b'];
/** The far inner wall of the shell (seen through the cut). */
const CAVITY = ['#0a0806', '#241910', '#33251a', '#2a1e14', '#140e09', '#070605'];
const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];
const CHROME_DARK = '#2a2c32';
const HEAD_COATED = ['#fbf8f0', '#ece5d5', '#d6ccb7'];
const HEAD_EBONY = ['#4a5060', '#272b33', '#15171c'];
const FELT = ['#fffaf0', '#e7dfcb', '#a99f88'];
const FABRIC = ['#5d6a84', '#414b60', '#2a313f'];
const FLOOR = ['#202128', '#141519', '#0b0b0e'];
const HIDDEN = '#b3bccd';

/* ── path helpers (build-time only) ── */
const make = () => Skia.Path.Make();
function rect(p: SkPath, x0: number, y0: number, x1: number, y1: number) {
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
}
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number) {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number) {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}

/* ── the hardware at a rod's silhouette (claw, T-rod, lug), both ends ── */
type Hardware = { claws: SkPath; tees: SkPath; rods: SkPath; rodsHi: SkPath; lugsTop: SkPath; lugsBot: SkPath; nuts: SkPath };

function buildHardware(view: ViewId): Hardware {
  const h: Hardware = { claws: make(), tees: make(), rods: make(), rodsHi: make(), lugsTop: make(), lugsBot: make(), nuts: make() };
  const ho = G.hoopOut;
  const hi = G.hoopIn;
  const rRod = ho + 10; // the rod clears the hoop's outside
  // Each rod sits 18° off the view's silhouette, behind the cut: it projects
  // at ρ·|cos 18°| (0.95 ρ), not at ρ — drawn at ρ, the bottom lugs, rods and
  // claws ran ~15 mm through the floor the drum stands on (clash sweep
  // 2026-10-10). This is also why no lug sits at bottom centre on a real kick.
  const sides = new Map<1 | -1, number>();
  for (const r of silhouetteRods(view)) {
    const a = (r.phi * Math.PI) / 180;
    sides.set(r.sgn, Math.abs(view === 'side' ? Math.cos(a) : Math.sin(a)));
  }
  for (const [sgn, k] of sides) {
    const v = (rho: number) => sgn * rho * k;
    for (const end of [0, 1] as const) {
      // Batter end as drawn; the front end mirrored about the drum's middle.
      const X = (x: number) => (end === 0 ? x : G.L - x);
      const outer = G.hoopX.batter[0]; // the hoop's player-side face (−19)
      // CLAW: a strap over the hoop, a lip pressing its outer face, an ear for the rod.
      rrect(h.claws, X(outer - 4), v(ho + 1), X(4), v(ho + 5), 1.5);
      rect(h.claws, X(outer - 4), v(hi + 3), X(outer), v(ho + 5));
      rrect(h.claws, X(outer - 4), v(ho + 5), X(outer + 7), v(ho + 15), 2);
      // T-ROD: handle outside the claw, rod to the lug.
      rrect(h.tees, X(outer - 16), v(rRod - 7), X(outer - 9), v(rRod + 7), 2);
      seg(h.rods, X(outer - 10), v(rRod), X(52), v(rRod));
      seg(h.rodsHi, X(outer - 10), v(rRod) - sgn * 1.1, X(52), v(rRod) - sgn * 1.1);
      // LUG on the shell (position along the shell illustrative).
      rrect(sgn < 0 ? h.lugsTop : h.lugsBot, X(44), v(G.R), X(76), v(G.R + 24), 7);
      oval(h.nuts, X(48), v(rRod), 3.2, 3.2);
    }
  }
  return h;
}

/* ── everything static, per view ── */
type Built = ReturnType<typeof buildSide> | ReturnType<typeof buildTop>;
const built: Partial<Record<ViewId, Built>> = {};

function shellParts(view: ViewId) {
  const { R, L, rIn } = G;
  const hb = G.hoopX.batter;
  const hr = G.hoopX.reso;
  // Cut faces of the wall (top and bottom of the section), one path each.
  const wallTop = rect(make(), 0, -R, L, -rIn);
  const wallBot = rect(make(), 0, rIn, L, R);
  // Ply seams: 8 plies → 7 seams per wall.
  const plyLines = make();
  for (let i = 1; i < 8; i++) {
    const t = (G.tShell * i) / 8;
    seg(plyLines, 0, -R + t, L, -R + t);
    seg(plyLines, 0, R - t, L, R - t);
  }
  // The outer lacquer gloss and the inner edge.
  const gloss = seg(seg(make(), 0, -R + 0.6, L, -R + 0.6), 0, R - 0.6, L, R - 0.6);
  const innerEdge = seg(seg(make(), 0, -rIn, L, -rIn), 0, rIn, L, rIn);
  const outerEdge = seg(seg(make(), 0, -R, L, -R), 0, R, L, R);
  // The far inner wall, seen through the cut: grain lines at y = rIn·cos θ.
  const cavity = rect(make(), 0, -rIn, L, rIn);
  const grain = make();
  const N = 14;
  for (let k = 1; k < N; k++) {
    const y = rIn * Math.cos((Math.PI * k) / N);
    seg(grain, 0, y, L, y);
  }
  const endShadeB = rect(make(), 0, -rIn, 46, rIn);
  const endShadeR = rect(make(), L - 46, -rIn, L, rIn);
  // Hoops: the far half edge-on (outside the shell), and the two cut faces.
  const hoopFar = make();
  rect(hoopFar, hb[0], -G.hoopIn, 0, G.hoopIn);
  rect(hoopFar, L, -G.hoopIn, hr[1], G.hoopIn);
  const hoopCut = make();
  for (const [x0, x1] of [hb, hr]) {
    rrect(hoopCut, x0, -G.hoopOut, x1, -G.hoopIn, 2.5);
    rrect(hoopCut, x0, G.hoopIn, x1, G.hoopOut, 2.5);
  }
  // Heads: films (drawn ≈ 5 mm), the batter coated, the front ebony.
  const batter = rect(make(), -2.5, -R - 2, 2.5, R + 2);
  const front = rect(make(), L - 2.5, -R - 2, L + 2.5, R + 2);
  const frontSheen = seg(make(), L - 1.6, -R, L - 1.6, R);
  // PORTED front head: the same film with an OPENING where the port is — a
  // hole IN the head, projected onto the head line (portOpening), never a
  // disc beyond it. Its rim is drawn across the film's thickness.
  const po = portOpening(view);
  const frontPorted = rect(rect(make(), L - 2.5, -R - 2, L + 2.5, po.lo), L - 2.5, po.hi, L + 2.5, R + 2);
  const frontSheenPorted = seg(seg(make(), L - 1.6, -R, L - 1.6, po.lo), L - 1.6, po.hi, L - 1.6, R);
  const portRim = seg(seg(make(), L - 7, po.lo, L + 7, po.lo), L - 7, po.hi, L + 7, po.hi);
  const hw = buildHardware(view);
  return { wallTop, wallBot, plyLines, gloss, innerEdge, outerEdge, cavity, grain, endShadeB, endShadeR, hoopFar, hoopCut, batter, front, frontSheen, frontPorted, frontSheenPorted, portRim, hw };
}

function pillowSide(): SkPath {
  const { x0, x1, top, bottom } = G.pillow;
  const p = make();
  // A cushion inside the model's box: soft ends, a gently uneven top.
  p.moveTo(x0 + 12, bottom);
  p.cubicTo(x0 + 2, bottom - 8, x0 + 2, top + 34, x0 + 20, top + 14);
  p.cubicTo(x0 + 60, top + 1, x0 + 112, top + 10, (x0 + x1) / 2, top + 5);
  p.cubicTo(x1 - 100, top + 1, x1 - 46, top + 4, x1 - 16, top + 16);
  p.cubicTo(x1 - 2, top + 32, x1 - 2, bottom - 10, x1 - 12, bottom);
  p.close();
  return p;
}

/*
 * THE PEDAL (side), drawn at true size around the model's own anchors (the
 * axle, the strike, the footboard box — geometry.ts; never moved here).
 * REAL DIMENSIONS used for the parts the model leaves to the drawing (a
 * single chain-drive pedal; drawing reference, nothing shown to the learner):
 *   base plate 6 mm thick running forward to a hoop clamp at the batter hoop
 *   (a jaw ≈ 14 × 27 mm with a T-screw); heel plate hinged to a footboard
 *   ≈ 75 mm wide with grip ribs; a cast frame upright ≈ 34 mm wide at the
 *   base tapering to ≈ 22 mm at the bearing, with a window; a 40 mm sprocket
 *   on the axle and a chain from the footboard toe over it; a Ø 16 mm return
 *   spring on the player's side of the frame, its crank on the axle; a
 *   Ø 9.5 mm shaft with a memory-lock collar; a felt beater 60 × 60 mm (the
 *   model's head size), its face flat to the head at the strike.
 */
function pedalSideParts() {
  const b = G.beater;
  const yF = G.yFloor;
  const ax = b.axle.x;
  const ay = b.axle.y;
  const head = { x: ax + b.len * Math.cos(b.strikeAngle), y: ay + b.len * Math.sin(b.strikeAngle) };
  const rest = { x: ax + b.len * Math.cos(b.restAngle), y: ay + b.len * Math.sin(b.restAngle) };
  const { x0, x1, top } = G.pedal;
  const hoopFace = G.hoopX.batter[0];
  // Base plate from the heel to the hoop clamp.
  const base = rrect(make(), x0 - 6, yF - 7, hoopFace - 1, yF, 2);
  const board = make();
  board.moveTo(x0 + 2, yF - 9);
  board.lineTo(x1 - 32, top);
  board.quadTo(x1 - 22, top - 2, x1 - 18, top + 8);
  board.lineTo(x0 + 10, yF - 1);
  board.close();
  // Grip ribs across the footboard.
  const ribs = make();
  const dx = x1 - 32 - (x0 + 2);
  const dy = top - (yF - 9);
  const ln = Math.hypot(dx, dy);
  const ux = dx / ln;
  const uy = dy / ln;
  for (let t = 40; t < ln - 30; t += 22) {
    const px = x0 + 2 + ux * t;
    const py = yF - 9 + uy * t;
    seg(ribs, px - uy * 1.5, py + ux * 1.5, px + uy * 7, py - ux * 7);
  }
  // The cast frame upright, tapering to the bearing, and its window.
  const frame = make();
  frame.moveTo(ax - 17, yF - 7);
  frame.lineTo(ax - 11, ay + 6);
  frame.quadTo(ax, ay - 4, ax + 11, ay + 6);
  frame.lineTo(ax + 17, yF - 7);
  frame.close();
  const frameWindow = make();
  frameWindow.moveTo(ax - 8, yF - 22);
  frameWindow.lineTo(ax - 5, ay + 34);
  frameWindow.quadTo(ax, ay + 28, ax + 5, ay + 34);
  frameWindow.lineTo(ax + 8, yF - 22);
  frameWindow.close();
  // The return spring on the player's side, and its crank from the axle.
  const spring = make();
  const sx = ax - 27;
  const sTop = ay + 30;
  const sBot = yF - 26;
  const turns = 9;
  spring.moveTo(sx, sBot);
  for (let i = 1; i <= turns * 2; i++) spring.lineTo(sx + (i % 2 ? -7 : 7), sBot + ((sTop - sBot) * i) / (turns * 2));
  const springRod = seg(seg(make(), sx, sTop, sx, sTop - 8), sx, sBot, sx, yF - 7);
  const crank = seg(make(), ax, ay, sx, sTop - 8);
  // The sprocket on the axle, the chain from the toe over its top.
  const sprocket = oval(make(), ax, ay, 20, 20);
  const chain = make();
  chain.moveTo(x1 - 24, top + 4);
  chain.lineTo(ax + 20, ay);
  chain.addArc(Skia.XYWHRect(ax - 20, ay - 20, 40, 40), 0, -100);
  // The hoop clamp at the front of the base, its T-screw.
  const clamp = rrect(make(), hoopFace - 15, yF - 34, hoopFace - 1, yF - 6, 3);
  const clampScrew = seg(make(), hoopFace - 8, yF - 34, hoopFace - 8, yF - 54);
  const clampKnob = rrect(make(), hoopFace - 20, yF - 60, hoopFace + 4, yF - 53, 3);
  // Shaft, collar and the felt beater at the strike: its face flat to the head.
  const shaft = seg(make(), ax, ay, head.x, head.y);
  const shaftRest = seg(make(), ax, ay, rest.x, rest.y);
  const k = 0.7;
  const collar = { x: ax + (head.x - ax) * k, y: ay + (head.y - ay) * k };
  const R = b.headR;
  const beater = rrect(make(), head.x - R, head.y - R, head.x + R, head.y + R, R * 0.38);
  const beaterLit = seg(make(), head.x - R + 4, head.y - R + 9, head.x - R + 4, head.y + R - 9);
  // Where the shaft enters the felt (its lower edge): a ferrule.
  const tEnter = R / Math.max(1e-6, ay - head.y);
  const ferrule = { x: head.x + (ax - head.x) * tEnter, y: head.y + R };
  // The swing: the beater's path from rest to the strike, about the axle.
  const swing = make();
  swing.addArc(Skia.XYWHRect(ax - b.len, ay - b.len, 2 * b.len, 2 * b.len), (b.restAngle * 180) / Math.PI, ((b.strikeAngle - b.restAngle) * 180) / Math.PI);
  return { head, rest, base, board, ribs, frame, frameWindow, spring, springRod, crank, sprocket, chain, clamp, clampScrew, clampKnob, shaft, shaftRest, collar, beater, beaterLit, ferrule, swing };
}

function buildSide() {
  const yF = G.yFloor;
  const floor = rect(make(), -3000, yF, 4000, yF + 600);
  const floorEdge = seg(make(), -3000, yF, 4000, yF);
  const drumShadow = oval(make(), G.L / 2, yF + 2, G.L / 2 + 50, 9);
  const pedalShadow = oval(make(), (G.pedal.x0 + G.pedal.x1) / 2, yF + 1, (G.pedal.x1 - G.pedal.x0) / 2 + 20, 6);
  return { kind: 'side' as const, floor, floorEdge, drumShadow, pedalShadow, pillow: pillowSide(), pillowSeam: seg(make(), G.pillow.x0 + 26, (G.pillow.top + G.pillow.bottom) / 2 + 6, G.pillow.x1 - 26, (G.pillow.top + G.pillow.bottom) / 2 + 6), ped: pedalSideParts(), ...shellParts('side') };
}

function buildTop() {
  const { x0, x1, halfW } = G.pillow;
  const pillow = make();
  // Seen from above (it lies below the cut): a cushion with rounded corners.
  pillow.moveTo(x0 + 26, -halfW + 4);
  pillow.cubicTo((x0 + x1) / 2, -halfW - 0, (x0 + x1) / 2, -halfW + 2, x1 - 24, -halfW + 6);
  pillow.cubicTo(x1 - 2, -halfW + 14, x1 - 2, halfW - 14, x1 - 24, halfW - 6);
  pillow.cubicTo((x0 + x1) / 2, halfW - 2, (x0 + x1) / 2, halfW, x0 + 26, halfW - 4);
  pillow.cubicTo(x0 + 2, halfW - 16, x0 + 2, -halfW + 16, x0 + 26, -halfW + 4);
  pillow.close();
  const pillowSeam = seg(make(), x0 + 30, 0, x1 - 30, 0);
  const shadow = rrect(make(), G.hoopX.batter[0] + 8, -G.hoopOut + 10, G.hoopX.reso[1] + 8, G.hoopOut + 10, 30);
  // Spurs (count sourced; mount, angle and length ILLUSTRATIVE).
  const spurLegs = make();
  const spurBrackets = make();
  const spurFeet = make();
  for (const s of G.spurs) {
    seg(spurLegs, s.top.x, s.top.z, s.foot.x, s.foot.z);
    rrect(spurBrackets, s.top.x - 16, s.side * G.R, s.top.x + 16, s.side * (G.R + 14), 4);
    oval(spurFeet, s.foot.x, s.foot.z, 11, 11);
  }
  // Pedal in plan.
  const { x0: px0, x1: px1 } = G.pedal;
  const board = rrect(make(), px0, -45, px1, 45, 10);
  const ribs = make();
  for (let x = px0 + 30; x < px1 - 20; x += 22) seg(ribs, x, -34, x, 34);
  const ax = G.beater.axle.x;
  const axleBar = seg(make(), ax, -54, ax, 54);
  const shaft = seg(make(), ax, 0, -2 * G.beater.headR, 0);
  const beaterHead = rrect(make(), -2 * G.beater.headR, -G.beater.headR, 0, G.beater.headR, 9);
  return { kind: 'top' as const, pillow, pillowSeam, shadow, spurLegs, spurBrackets, spurFeet, board, ribs, axleBar, shaft, beaterHead, ...shellParts('top') };
}

function getBuilt(view: ViewId): Built {
  return (built[view] ??= view === 'side' ? buildSide() : buildTop());
}

/* ── the drawing ── */

export function KickArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const g = getBuilt(view);
  const ported = variant === 'ported';
  const { R, L, rIn } = G;
  const hw = g.hw;
  return (
    <Group>
      {g.kind === 'side' ? (
        <>
          {/* FLOOR (its height is a placeholder): a dark slab, a lit edge, contact shadows. */}
          <Path path={g.floor}>
            <LinearGradient start={vec(0, G.yFloor)} end={vec(0, G.yFloor + 60)} colors={FLOOR} />
          </Path>
          <Path path={g.drumShadow} color="#000" opacity={0.7}>
            <BlurMask blur={8} style="normal" />
          </Path>
          <Path path={g.pedalShadow} color="#000" opacity={0.6}>
            <BlurMask blur={6} style="normal" />
          </Path>
          <Path path={g.floorEdge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
        </>
      ) : (
        <Path path={g.shadow} color="#000" opacity={0.55}>
          <BlurMask blur={14} style="normal" />
        </Path>
      )}

      {/* FAR HALF of each hoop, edge-on (long grain, in shadow). */}
      <Path path={g.hoopFar}>
        <LinearGradient start={vec(G.hoopX.batter[0], 0)} end={vec(G.hoopX.batter[1], 0)} colors={HOOP_FAR} />
      </Path>
      <Path path={g.hoopFar} style="stroke" strokeWidth={1} color={INK} opacity={0.8} />

      {/* The far inner wall through the cut: warm, dim, lit from the upper left. */}
      <Path path={g.cavity}>
        <LinearGradient start={vec(0, -rIn)} end={vec(0, rIn)} colors={CAVITY} positions={[0, 0.16, 0.38, 0.62, 0.86, 1]} />
      </Path>
      <Path path={g.cavity}>
        <RadialGradient c={vec(L * 0.3, -rIn * 0.45)} r={L * 0.95} colors={['rgba(255,214,160,0.08)', 'rgba(255,214,160,0)']} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={0.9} color="#d9a766" opacity={0.12} />
      <Path path={g.endShadeB}>
        <LinearGradient start={vec(0, 0)} end={vec(46, 0)} colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']} />
      </Path>
      <Path path={g.endShadeR}>
        <LinearGradient start={vec(L, 0)} end={vec(L - 46, 0)} colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']} />
      </Path>

      {/* PILLOW: solid in the side cut; seen from above (below the cut) in plan, dimmer. */}
      {g.kind === 'side' ? (
        <>
          <Path path={g.pillow}>
            <LinearGradient start={vec(0, G.pillow.top)} end={vec(0, G.pillow.bottom)} colors={FABRIC} />
          </Path>
          <Path path={g.pillow}>
            <RadialGradient c={vec(G.pillow.x0 + 70, G.pillow.top + 20)} r={170} colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']} />
          </Path>
          <Path path={g.pillowSeam} style="stroke" strokeWidth={1.4} color="#c9d2e4" opacity={0.35}>
            <DashPathEffect intervals={[7, 6]} />
          </Path>
          <Path path={g.pillow} style="stroke" strokeWidth={1.2} color="#141821" opacity={0.9} />
        </>
      ) : (
        <Group opacity={0.32}>
          <Path path={g.pillow}>
            <LinearGradient start={vec(0, -G.pillow.halfW)} end={vec(0, G.pillow.halfW)} colors={FABRIC} />
          </Path>
          <Path path={g.pillow}>
            <RadialGradient c={vec(G.pillow.x0 + 60, -G.pillow.halfW + 50)} r={220} colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']} />
          </Path>
          <Path path={g.pillowSeam} style="stroke" strokeWidth={1.4} color="#c9d2e4" opacity={0.3}>
            <DashPathEffect intervals={[7, 6]} />
          </Path>
          <Path path={g.pillow} style="stroke" strokeWidth={1.2} color="#141821" />
        </Group>
      )}

      {/* SHELL cut faces: 8 plies, the lacquer gloss outside, the inner edge. */}
      <Path path={g.wallTop}>
        <LinearGradient start={vec(0, -R)} end={vec(0, -rIn)} colors={PLY} />
      </Path>
      <Path path={g.wallBot}>
        <LinearGradient start={vec(0, R)} end={vec(0, rIn)} colors={PLY} />
      </Path>
      <Path path={g.plyLines} style="stroke" strokeWidth={0.35} color={PLY_LINE} opacity={0.75} />
      <Path path={g.outerEdge} style="stroke" strokeWidth={1.4} color="#140b05" />
      <Path path={g.gloss} style="stroke" strokeWidth={1.1} color={LACQUER_GLOSS} opacity={0.6} />
      <Path path={g.innerEdge} style="stroke" strokeWidth={1} color={INK} opacity={0.9} />

      {/* HEADS: the coated batter film; the ebony front film with a sheen. */}
      <Path path={g.batter}>
        <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={HEAD_COATED} />
      </Path>
      <Path path={ported ? g.frontPorted : g.front}>
        <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={HEAD_EBONY} />
      </Path>
      <Path path={ported ? g.frontSheenPorted : g.frontSheen} style="stroke" strokeWidth={1.2} color="#c3cbdb" opacity={0.75} />
      <Path path={ported ? g.frontPorted : g.front} style="stroke" strokeWidth={0.8} color="#8d97ab" opacity={0.6} />

      {/* HOOP cut faces (end grain), lit edge on top. */}
      <Path path={g.hoopCut}>
        <LinearGradient start={vec(G.hoopX.batter[0], 0)} end={vec(G.hoopX.batter[1], 0)} colors={HOOP_CUT} />
      </Path>
      <Path path={g.hoopCut} style="stroke" strokeWidth={1} color={INK} />

      {/* HARDWARE at the silhouette: lugs, T-rods, claw hooks (count: label). */}
      <Path path={hw.lugsTop}>
        <LinearGradient start={vec(0, -R - 24)} end={vec(0, -R)} colors={CHROME} />
      </Path>
      <Path path={hw.lugsBot}>
        <LinearGradient start={vec(0, R)} end={vec(0, R + 24)} colors={CHROME} />
      </Path>
      <Path path={hw.lugsTop} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={hw.lugsBot} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={hw.rods} style="stroke" strokeWidth={4.2} strokeCap="round" color={CHROME_DARK} />
      <Path path={hw.rodsHi} style="stroke" strokeWidth={1.4} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={hw.nuts} color="#9aa0ab" />
      <Path path={hw.claws}>
        <LinearGradient start={vec(G.hoopX.batter[0] - 6, -G.hoopOut - 16)} end={vec(G.hoopX.batter[0] + 10, -G.hoopIn)} colors={['#f2f4f8', '#8f949f', '#3a3d45']} />
      </Path>
      <Path path={hw.claws} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={hw.tees} color="#c6cad4" />
      <Path path={hw.tees} style="stroke" strokeWidth={0.8} color={INK} />

      {/* PORT: the opening's rim across the head film (the gap itself is
          the film left undrawn above). */}
      {ported ? <Path path={g.portRim} style="stroke" strokeWidth={2.4} strokeCap="round" color={HIDDEN} opacity={0.95} /> : null}

      {g.kind === 'top' ? (
        <>
          {/* SPURS (count sourced; geometry ILLUSTRATIVE): bracket, leg, rubber foot. */}
          <Path path={g.spurBrackets}>
            <LinearGradient start={vec(0, -R - 14)} end={vec(0, R + 14)} colors={CHROME} />
          </Path>
          <Path path={g.spurLegs} style="stroke" strokeWidth={17} strokeCap="round" color={INK} opacity={0.9} />
          <Path path={g.spurLegs} style="stroke" strokeWidth={13} strokeCap="round" color="#7d828d" />
          <Path path={g.spurLegs} style="stroke" strokeWidth={4} strokeCap="round" color="#eef1f6" opacity={0.6} />
          <Path path={g.spurFeet} color="#17181c" />
          <Path path={g.spurFeet} style="stroke" strokeWidth={2} color="#555a64" />

          {/* PEDAL in plan (ILLUSTRATIVE). */}
          <Path path={g.board}>
            <LinearGradient start={vec(G.pedal.x0, -45)} end={vec(G.pedal.x1, 45)} colors={['#6b707b', '#3a3d45', '#22242a']} />
          </Path>
          <Path path={g.ribs} style="stroke" strokeWidth={2} color="#15161a" opacity={0.7} />
          <Path path={g.board} style="stroke" strokeWidth={1.2} color={INK} />
          <Path path={g.axleBar} style="stroke" strokeWidth={9} strokeCap="round" color={CHROME_DARK} />
          <Path path={g.axleBar} style="stroke" strokeWidth={3} strokeCap="round" color="#c6cad4" opacity={0.7} />
          <Path path={g.shaft} style="stroke" strokeWidth={6} strokeCap="round" color={CHROME_DARK} />
          <Path path={g.shaft} style="stroke" strokeWidth={2} strokeCap="round" color="#e4e7ed" opacity={0.8} />
          <Path path={g.beaterHead}>
            <LinearGradient start={vec(-2 * G.beater.headR, -G.beater.headR)} end={vec(0, G.beater.headR)} colors={FELT} />
          </Path>
          <Path path={g.beaterHead} style="stroke" strokeWidth={1.2} color="#6e6655" />
        </>
      ) : (
        <SidePedal ped={g.ped} />
      )}

      {/* The beater line: where the beater meets the head, parallel to the axis
          (a readout REFERENCE — kept crisp, never under an effect). */}
      <Line p1={vec(0, view === 'side' ? G.strikeY : 0)} p2={vec(L, view === 'side' ? G.strikeY : 0)} color={AMBER} strokeWidth={1.6} opacity={0.6}>
        <DashPathEffect intervals={[16, 10]} />
      </Line>
    </Group>
  );
}

function SidePedal({ ped }: { ped: ReturnType<typeof pedalSideParts> }) {
  const b = G.beater;
  const ax = b.axle.x;
  const ay = b.axle.y;
  const restTurn = b.restAngle - b.strikeAngle;
  return (
    <>
      {/* Base plate to the hoop clamp; heel hinge; footboard with grip ribs. */}
      <Path path={ped.base}>
        <LinearGradient start={vec(0, G.yFloor - 7)} end={vec(0, G.yFloor)} colors={['#5b5f69', '#202227']} />
      </Path>
      <Path path={ped.clamp}>
        <LinearGradient start={vec(G.hoopX.batter[0] - 15, 0)} end={vec(G.hoopX.batter[0], 0)} colors={CHROME} />
      </Path>
      <Path path={ped.clamp} style="stroke" strokeWidth={1} color={INK} />
      <Path path={ped.clampScrew} style="stroke" strokeWidth={5} strokeCap="round" color={CHROME_DARK} />
      <Path path={ped.clampScrew} style="stroke" strokeWidth={2} strokeCap="round" color="#c6cad4" />
      <Path path={ped.clampKnob} color="#1b1c21" />
      <Path path={ped.clampKnob} style="stroke" strokeWidth={1} color="#6c717c" />
      <Path path={ped.board}>
        <LinearGradient start={vec(G.pedal.x0, G.yFloor)} end={vec(G.pedal.x1, G.pedal.top)} colors={['#1f2126', '#6b707b', '#30323a']} />
      </Path>
      <Path path={ped.ribs} style="stroke" strokeWidth={2} strokeCap="round" color="#0f1013" opacity={0.75} />
      <Path path={ped.board} style="stroke" strokeWidth={1.2} color={INK} />
      <Circle cx={G.pedal.x0 + 8} cy={G.yFloor - 9} r={6} color="#9aa0ab" />

      {/* The return spring and its crank (player's side of the frame). */}
      <Path path={ped.springRod} style="stroke" strokeWidth={3} strokeCap="round" color="#8a8f99" />
      <Path path={ped.spring} style="stroke" strokeWidth={2.2} strokeJoin="round" color="#c6cad4" />
      <Path path={ped.crank} style="stroke" strokeWidth={6} strokeCap="round" color={CHROME_DARK} />
      <Path path={ped.crank} style="stroke" strokeWidth={2.4} strokeCap="round" color="#9aa0ab" />

      {/* The cast frame upright and its window. */}
      <Path path={ped.frame}>
        <LinearGradient start={vec(ax - 17, 0)} end={vec(ax + 17, 0)} colors={CHROME} />
      </Path>
      <Path path={ped.frameWindow} color="#121317" />
      <Path path={ped.frame} style="stroke" strokeWidth={1} color={INK} />

      {/* Sprocket on the axle; the chain from the footboard toe over it. */}
      <Path path={ped.sprocket} color="#1b1c21" />
      <Path path={ped.sprocket} style="stroke" strokeWidth={2} color="#6c717c">
        <DashPathEffect intervals={[3, 2.2]} />
      </Path>
      <Path path={ped.chain} style="stroke" strokeWidth={5} color="#2a2c32" />
      <Path path={ped.chain} style="stroke" strokeWidth={3.5} strokeCap="round" color="#a2a7b1">
        <DashPathEffect intervals={[4, 3]} />
      </Path>
      <Circle cx={ax} cy={ay} r={7}>
        <RadialGradient c={vec(ax - 2, ay - 2)} r={8} colors={['#f2f4f8', '#7d828d']} />
      </Circle>

      {/* The swing and the rest position, as an outline (the same beater, turned back about the axle). */}
      <Path path={ped.swing} style="stroke" strokeWidth={1.4} color="#c6cad4" opacity={0.45}>
        <DashPathEffect intervals={[6, 6]} />
      </Path>
      <Group transform={[{ translateX: ax }, { translateY: ay }, { rotate: restTurn }, { translateX: -ax }, { translateY: -ay }]} opacity={0.4}>
        <Path path={ped.shaft} style="stroke" strokeWidth={2} strokeCap="round" color="#c6cad4">
          <DashPathEffect intervals={[6, 5]} />
        </Path>
        <Path path={ped.beater} style="stroke" strokeWidth={1.6} color="#e7dfcb">
          <DashPathEffect intervals={[6, 5]} />
        </Path>
      </Group>

      {/* Shaft, memory-lock collar and the felt beater at the strike. */}
      <Path path={ped.shaft} style="stroke" strokeWidth={6.5} strokeCap="round" color={CHROME_DARK} />
      <Path path={ped.shaft} style="stroke" strokeWidth={2.2} strokeCap="round" color="#e4e7ed" opacity={0.85} />
      <Circle cx={ped.collar.x} cy={ped.collar.y} r={7} color="#26282e" />
      <Circle cx={ped.collar.x} cy={ped.collar.y} r={7} style="stroke" strokeWidth={1.2} color="#8a8f99" />
      <Path path={ped.beater}>
        <RadialGradient c={vec(ped.head.x - b.headR * 0.4, ped.head.y - b.headR * 0.45)} r={b.headR * 1.7} colors={FELT} />
      </Path>
      <Path path={ped.beaterLit} style="stroke" strokeWidth={2} strokeCap="round" color="#ffffff" opacity={0.6} />
      <Path path={ped.beater} style="stroke" strokeWidth={1.2} color="#6e6655" />
      <Circle cx={ped.ferrule.x} cy={ped.ferrule.y} r={5} color="#4a4e57" />
    </>
  );
}

/* ── labels and taps (mm, from the same anchors) ── */
// The scenes' label type (it carries `at` / `point` / `alts` for leaders).
export type { ArtLabel };

export function kickLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = [
    // Moved names point back at their parts (clash sweep 2026-10-10: the
    // batter's leader ended in empty glass; PILLOW sat on the rest beater).
    { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 14, v: -G.hoopOut - 46, align: 'right', at: { u: 0, v: -G.R * 0.6 } },
    // Right-aligned to the front hoop: the top-right corner is the inset's.
    { id: 'reso', text: variant === 'ported' ? 'FRONT HEAD (PORTED)' : 'FRONT HEAD (INTACT)', short: 'FRONT', u: G.L + 30, v: -G.hoopOut - 46, align: 'right' },
  ];
  if (view === 'side') {
    out.push({ id: 'beater', text: 'PEDAL', short: 'PEDAL', u: -230, v: -170, align: 'center', tone: 'illustrative', at: { u: G.beater.axle.x, v: G.beater.axle.y }, alts: [{ u: -330, v: G.yFloor - 150, align: 'center' }] });
    out.push({ id: 'pillow', text: 'PILLOW', u: 150, v: G.pillow.top + 50, align: 'center', tone: 'muted', at: { u: G.L * 0.55, v: (G.pillow.top + G.pillow.bottom) / 2 }, alts: [{ u: G.L * 0.55, v: G.yFloor + 40, align: 'center' }, { u: G.L + 40, v: G.pillow.top - 20, align: 'left' }] });
    out.push({ id: 'floor', text: 'FLOOR', short: 'FLOOR', u: 895, v: G.yFloor - 24, align: 'right', tone: 'illustrative' });
  } else {
    out.push({ id: 'pedal', text: 'PEDAL', short: 'PEDAL', u: -230, v: 110, align: 'center', tone: 'illustrative' });
    // Low on the cushion: the mic zones sit over its middle.
    out.push({ id: 'pillow', text: 'PILLOW (BELOW)', short: 'PILLOW', u: 150, v: G.pillow.halfW - 40, align: 'center', tone: 'muted', at: { u: G.L * 0.5, v: 0 }, alts: [{ u: G.L + 40, v: -G.R * 0.35, align: 'left' }] });
    out.push({ id: 'player', text: '← PLAYER', u: -300, v: -170, align: 'center', tone: 'muted', point: { u: -6000, v: -170 } });
    // The hardware's sourced COUNT, said in words (the cut shows only 2 per head).
    out.push({ id: 'rods', text: '10 RODS PER HEAD', short: '10 RODS/HEAD', u: G.spurs[1].top.x + 40, v: G.hoopOut + 46, align: 'left', tone: 'illustrative', at: { u: G.L - 60, v: G.R * 0.95 + 12 } });
    out.push({ id: 'spur', text: 'SPURS', short: 'SPURS', u: G.spurs[1].foot.x + 30, v: G.spurs[1].foot.z + 2, align: 'left', tone: 'illustrative' });
  }
  if (variant === 'ported') out.push({ id: 'port', text: 'PORT', short: 'PORT', u: G.L + 30, v: (view === 'side' ? PORT.y : PORT.z) + G.portR + 40, align: 'left', tone: 'illustrative' });
  return out;
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function kickHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const pc = view === 'side' ? PORT.y : PORT.z;
  if (variant === 'ported' && Math.abs(u - G.L) <= tol && Math.abs(v - pc) <= G.portR + tol) return 'kick.port';
  if (Math.abs(u - G.L) <= tol && Math.abs(v) <= G.R + tol) return 'kick.reso';
  if (Math.abs(u) <= tol && Math.abs(v) <= G.R + tol) return 'kick.batter';
  if (view === 'side') {
    if (u >= -G.beater.headR * 2 - tol && u <= tol && Math.abs(v - G.strikeY) <= G.beater.headR + tol) return 'kick.beater';
    if (u >= G.pillow.x0 && u <= G.pillow.x1 && v >= G.pillow.top - tol && v <= G.pillow.bottom) return 'kick.pillow';
    if (u >= G.pedal.x0 - tol && u <= G.pedal.x1 + tol && v >= G.beater.axle.y - tol && v <= G.yFloor + tol) return 'kick.pedal';
  } else {
    if (u >= G.pedal.x0 - tol && u <= tol && Math.abs(v) <= 45 + tol) return 'kick.pedal';
    if (u >= G.pillow.x0 && u <= G.pillow.x1 && Math.abs(v) <= G.pillow.halfW) return 'kick.pillow';
  }
  if (u >= 0 && u <= G.L && Math.abs(v) <= G.R + tol) return 'kick.shell';
  return null;
}
