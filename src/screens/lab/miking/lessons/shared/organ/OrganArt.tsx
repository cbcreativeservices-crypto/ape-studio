/**
 * THE PIPE ORGAN, drawn (Lab 3's A12) — a STYLISED instrument in its room,
 * never a particular organ, from the lesson's model (a12Organ/model.ts):
 *
 *   OrganFacade   from the nave (u = z, v = y): the oak case, the Pedal
 *                 towers, the Great's flat of pipes in the middle, the
 *                 Swell's shutters above, the Positive low in front — every
 *                 pipe a burnished tin body with its mouth and its conical
 *                 foot, lit from the upper left
 *   OrganSide     the nave cut along its length (u = x, v = y): the case in
 *                 profile, the console, the pews, the PA on the arch and the
 *                 congregation in a SERVICE
 *   OrganTop      the nave from above (u = x, v = z): the case and its tower
 *                 tops, the console, the pews in rows, the aisles kept clear
 *   NavePlan      the whole room (the setting page): the rear gallery and
 *                 its antiphonal division, the exits and the wheelchair route
 * Static (D8): it changes only on a tap or a switch.
 */
import type { ReactElement } from 'react';
import { BlurMask, Circle, DashPathEffect, FillType, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { CASE, CONSOLE, DIVISIONS, GALLERY, NAVE, ORGAN, PA, pewXs, type DivisionId } from '../../a12Organ/model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
export const HIGHLIGHT = '#ffc64d';
const OAK = ['#8a5a32', '#6a4223', '#4a2c16', '#2c190b'];
const TIN = ['#f4f6f9', '#cfd5de', '#9aa3b1', '#6b7380', '#c3cad4'];
/** Burnished tin across a round pipe, lit from the upper left: a dark limb,
 *  the bright streak left of centre, the body falling off to the right with
 *  a little bounce light at the far edge. */
const TIN_BODY = ['#59606b', '#c9cfd8', '#f7f9fc', '#b7bfca', '#7a828f', '#454b55', '#6b7380'];
const TIN_FOOT = ['#4a505a', '#a9b1bc', '#dfe4ea', '#98a1ad', '#646c78', '#383d45', '#565d68'];
const TIN_POS = [0, 0.14, 0.3, 0.5, 0.74, 0.92, 1];
/** Aged gilding on carved pipe shades (duller than the cornice fillets). */
const GILT = ['#e2c67e', '#b08734', '#7a5a1c', '#a27c2e', '#5a4112'];
const GOLD = ['#fff0c2', '#e7c26a', '#b48a32', '#6e5218'];
const PEW = ['#7a4e2c', '#5a361c', '#3a210f'];

function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

/*
 * REAL PROPORTIONS the pipes are drawn to (code comment only, never shown):
 * a façade principal (open metal flue). Mouth width ≈ ¼ of the circumference
 * (≈ 0.79 D, ≈ 0.68 D as seen once the lips are flatted); cut-up (mouth
 * height) ≈ ¼ of the mouth width; a pointed "bay-leaf" upper lip ≈ 0.9 D
 * tall above the mouth, a shallower lower lip on the foot; the foot a cone
 * from the languid down to a toe ≈ 0.2 D, standing in the toe board (the
 * impost / pipe rack). An 8′ principal's low C: body ≈ 2.4 m × Ø 150; a
 * 16′'s ≈ 4.9 m × Ø 250–300; façade feet ≈ 0.4–1.2 m. Pipes in a flat stand
 * ≈ 30–60 mm apart, mouths in a line, tops on the flat's curve.
 */
type PipePaths = { body: SkPath; foot: SkPath; upper: SkPath; mouth: SkPath; lower: SkPath; sheen: SkPath; topRim: SkPath; toe: SkPath };
const pipeCache = new Map<string, PipePaths>();
function pipePaths(u: number, w: number, top: number, mouth: number, toe: number): PipePaths {
  const key = `${u}:${w}:${top}:${mouth}:${toe}`;
  const hit = pipeCache.get(key);
  if (hit) return hit;
  const mw = 0.68 * w;
  const cut = 0.25 * mw;
  const body = rr(u - w / 2, top, u + w / 2, mouth, w * 0.05);
  const foot = make();
  foot.moveTo(u - w / 2, mouth);
  foot.lineTo(u + w / 2, mouth);
  foot.cubicTo(u + w * 0.42, mouth + (toe - mouth) * 0.25, u + w * 0.14, toe - (toe - mouth) * 0.2, u + w * 0.1, toe);
  foot.lineTo(u - w * 0.1, toe);
  foot.cubicTo(u - w * 0.14, toe - (toe - mouth) * 0.2, u - w * 0.42, mouth + (toe - mouth) * 0.25, u - w / 2, mouth);
  foot.close();
  // The upper lip: a flatted, pointed (bay-leaf) area over the mouth.
  const m0 = mouth - cut;
  const upper = make();
  upper.moveTo(u - mw / 2, m0);
  upper.cubicTo(u - mw / 2, m0 - 0.42 * w, u - 0.1 * w, m0 - 0.72 * w, u, m0 - 0.92 * w);
  upper.cubicTo(u + 0.1 * w, m0 - 0.72 * w, u + mw / 2, m0 - 0.42 * w, u + mw / 2, m0);
  upper.close();
  const mouthP = make();
  mouthP.addRect(Skia.XYWHRect(u - mw / 2, m0, mw, cut));
  // The lower lip: a shallower flat on the top of the foot.
  const lower = make();
  lower.moveTo(u - mw / 2, mouth);
  lower.cubicTo(u - mw / 2, mouth + 0.22 * w, u - 0.12 * w, mouth + 0.38 * w, u, mouth + 0.46 * w);
  lower.cubicTo(u + 0.12 * w, mouth + 0.38 * w, u + mw / 2, mouth + 0.22 * w, u + mw / 2, mouth);
  lower.close();
  // The burnished tin's specular streak, left of centre (light upper left).
  const sheen = make();
  sheen.addRRect(Skia.RRectXY(Skia.XYWHRect(u - w * 0.3, top + w * 0.25, w * 0.09, m0 - 0.95 * w - top - w * 0.3), w * 0.04, w * 0.04));
  const topRim = make();
  topRim.moveTo(u - w / 2 + w * 0.05, top + w * 0.03);
  topRim.lineTo(u + w / 2 - w * 0.05, top + w * 0.03);
  const toeP = make();
  toeP.addOval(Skia.XYWHRect(u - w * 0.16, toe - w * 0.05, w * 0.32, w * 0.1));
  const out = { body, foot, upper, mouth: mouthP, lower, sheen, topRim, toe: toeP };
  pipeCache.set(key, out);
  return out;
}

/** One flue pipe from the front: body from its top down to the mouth, the
 *  mouth (a dark cut-up under a pointed upper lip), the lower lip and the
 *  conical foot to the toe. */
function PipeFront({ u, w, top, mouth, toe }: { u: number; w: number; top: number; mouth: number; toe: number }): ReactElement {
  const p = pipePaths(u, w, top, mouth, toe);
  return (
    <Group>
      <Path path={p.foot}>
        <LinearGradient start={vec(u - w / 2, 0)} end={vec(u + w / 2, 0)} colors={TIN_FOOT} positions={TIN_POS} />
      </Path>
      <Path path={p.body}>
        <LinearGradient start={vec(u - w / 2, 0)} end={vec(u + w / 2, 0)} colors={TIN_BODY} positions={TIN_POS} />
      </Path>
      <Path path={p.sheen} color="#ffffff" opacity={0.55} />
      <Path path={p.upper}>
        <LinearGradient start={vec(0, mouth - w)} end={vec(0, mouth)} colors={['#eef1f5', '#b4bcc7', '#7c8592']} />
      </Path>
      <Path path={p.upper} style="stroke" strokeWidth={w * 0.025} color="#3a4049" opacity={0.8} />
      <Path path={p.lower}>
        <LinearGradient start={vec(0, mouth)} end={vec(0, mouth + w * 0.46)} colors={['#59606b', '#8d96a2']} />
      </Path>
      <Path path={p.lower} style="stroke" strokeWidth={w * 0.02} color="#2c3138" opacity={0.7} />
      <Path path={p.mouth} color="#07080a" />
      <Path path={p.topRim} style="stroke" strokeWidth={w * 0.05} color="#3a4049" opacity={0.7} />
      <Path path={p.body} style="stroke" strokeWidth={w * 0.025} color="#2c3138" opacity={0.75} />
      <Path path={p.foot} style="stroke" strokeWidth={w * 0.02} color="#2c3138" opacity={0.6} />
      <Path path={p.toe} color="#120b06" opacity={0.85} />
    </Group>
  );
}

/** A flat's pipe tops: on an arch (sine) from the edge to the middle. */
function flatPipes(z0: number, z1: number, n: number, topMid: number, topEdge: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const u = z0 + (z1 - z0) * t;
    const k = 1 - Math.abs(2 * t - 1);
    return { u, top: topEdge + (topMid - topEdge) * Math.sin((k * Math.PI) / 2) };
  });
}

/** A flat of pipes: tops on a curve (arched or V), mouths on a line, every
 *  toe standing in a moulded toe board (the pipes never float). */
function Flat({ z0, z1, n, mouth, toe, topMid, topEdge, w }: { z0: number; z1: number; n: number; mouth: number; toe: number; topMid: number; topEdge: number; w: number }): ReactElement {
  const pipes = flatPipes(z0, z1, n, topMid, topEdge);
  const a = Math.min(z0, z1) - w * 0.75;
  const b = Math.max(z0, z1) + w * 0.75;
  const board = rr(a, toe - w * 0.04, b, toe + w * 0.55, w * 0.06);
  const lip = rr(a - w * 0.12, toe - w * 0.1, b + w * 0.12, toe + w * 0.06, w * 0.04);
  return (
    <Group>
      {pipes.map((q, i) => (
        <PipeFront key={i} u={q.u} w={w} top={q.top} mouth={mouth} toe={toe} />
      ))}
      <Path path={board}>
        <LinearGradient start={vec(0, toe)} end={vec(0, toe + w * 0.55)} colors={[OAK[1], OAK[2], OAK[3]]} />
      </Path>
      <Path path={lip}>
        <LinearGradient start={vec(0, toe - w * 0.1)} end={vec(0, toe + w * 0.06)} colors={GOLD} />
      </Path>
    </Group>
  );
}

/** Gilded, pierced pipe shades: the carved fretwork filling the space
 *  between a flat's pipe tops and the cornice above it. */
function PipeShade({ z0, z1, n, topMid, topEdge, ceil, w }: { z0: number; z1: number; n: number; topMid: number; topEdge: number; ceil: number; w: number }): ReactElement | null {
  const pipes = flatPipes(z0, z1, n, topMid, topEdge);
  // Its lower edge follows the tops a hand's width clear, dropping into a
  // point between neighbouring pipes (the carver's usual finish).
  const g = w * 0.3;
  const ps = [...pipes].sort((a, b) => a.u - b.u);
  const shade = make();
  shade.moveTo(ps[0].u - w / 2, ceil);
  shade.lineTo(ps[0].u - w / 2, ps[0].top - g);
  ps.forEach((q, i) => {
    shade.lineTo(q.u - w * 0.3, q.top - g);
    shade.lineTo(q.u + w * 0.3, q.top - g);
    const nx = ps[i + 1];
    if (nx) shade.lineTo((q.u + nx.u) / 2, Math.max(q.top, nx.top) - g * 0.2);
  });
  const last = ps[ps.length - 1];
  shade.lineTo(last.u + w / 2, last.top - g);
  shade.lineTo(last.u + w / 2, ceil);
  shade.close();
  // Piercings: staggered rows of small leaf openings (carved fretwork).
  const holes = make();
  const lo = Math.max(...pipes.map((q) => q.top));
  let row = 0;
  for (let y = ceil + w * 0.45; y < lo; y += w * 0.62, row++) {
    for (let z = Math.min(z0, z1) - w * 0.5 + (row % 2) * w * 0.32; z <= Math.max(z0, z1) + w * 0.5; z += w * 0.64) {
      holes.addOval(Skia.XYWHRect(z - w * 0.11, y - w * 0.21, w * 0.22, w * 0.42));
    }
  }
  const fret = make();
  fret.addPath(shade);
  fret.addPath(holes);
  fret.setFillType(FillType.EvenOdd);
  return (
    <Group clip={shade}>
      <Path path={fret}>
        <LinearGradient start={vec(Math.min(z0, z1), ceil)} end={vec(Math.max(z0, z1), lo)} colors={GILT} />
      </Path>
      <Path path={holes} style="stroke" strokeWidth={w * 0.04} color="#3a2a0c" opacity={0.7} />
      <Path path={shade} style="stroke" strokeWidth={w * 0.08} color="#3a2a0c" opacity={0.8} />
    </Group>
  );
}

function Oak({ path, u0, v0, u1, v1 }: { path: SkPath; u0: number; v0: number; u1: number; v1: number }): ReactElement {
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={OAK} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={22} color="#1e1108" opacity={0.85} />
    </Group>
  );
}

/** An oak frame (stiles and rails `t` wide) round a dark recess: the case's
 *  open front, where the pipes stand in front of the shadowed interior. */
function OakFrame({ z0, v0, z1, v1, t }: { z0: number; v0: number; z1: number; v1: number; t: number }): ReactElement {
  const outer = rr(z0, v0, z1, v1, 24);
  const recess = rr(z0 + t, v0 + t, z1 - t, v1, 10);
  return (
    <Group>
      <Oak path={outer} u0={z0} v0={v0} u1={z1} v1={v1} />
      <Path path={recess}>
        <LinearGradient start={vec(z0, v0)} end={vec(z1, v1)} colors={['#1c120a', '#120b06', '#080503']} />
      </Path>
      {/* the frame's inner edge: lit on the left stile, shadowed on the right */}
      <Path path={(() => { const p = make(); p.moveTo(z0 + t, v1); p.lineTo(z0 + t, v0 + t); p.lineTo(z1 - t, v0 + t); return p; })()} style="stroke" strokeWidth={t * 0.12} color="#000" opacity={0.6} />
      <Path path={(() => { const p = make(); p.moveTo(z0 + t * 0.12, v1); p.lineTo(z0 + t * 0.12, v0 + t * 0.12); return p; })()} style="stroke" strokeWidth={t * 0.08} color="#c8925a" opacity={0.45} />
    </Group>
  );
}

/** A moulded cornice ending at `v` (its top): bed moulding, gilded frieze
 *  fillet and an overhanging crown, about 260 mm tall. */
function Cornice({ z0, z1, v }: { z0: number; z1: number; v: number }): ReactElement {
  return (
    <Group>
      <Path path={rr(z0 - 50, v - 90, z1 + 50, v, 10)}>
        <LinearGradient start={vec(0, v - 90)} end={vec(0, v)} colors={[OAK[0], OAK[2], OAK[3]]} />
      </Path>
      <Path path={rr(z0 - 85, v - 160, z1 + 85, v - 90, 10)}>
        <LinearGradient start={vec(0, v - 160)} end={vec(0, v - 90)} colors={GOLD} />
      </Path>
      <Path path={rr(z0 - 120, v - 260, z1 + 120, v - 160, 18)}>
        <LinearGradient start={vec(0, v - 260)} end={vec(0, v - 160)} colors={['#a8743f', OAK[1], OAK[3]]} />
      </Path>
      <Path path={(() => { const p = make(); p.moveTo(z0 - 110, v - 255); p.lineTo(z1 + 110, v - 255); return p; })()} style="stroke" strokeWidth={14} color="#f3d9a0" opacity={0.55} />
    </Group>
  );
}

/** Raised panels on the case base (frame-and-panel joinery). */
function BasePanels({ z0, z1, v0, v1, n }: { z0: number; z1: number; v0: number; v1: number; n: number }): ReactElement {
  const panels = make();
  const bevel = make();
  const gap = 90;
  const pw = (z1 - z0 - gap * (n + 1)) / n;
  for (let i = 0; i < n; i++) {
    const a = z0 + gap + i * (pw + gap);
    panels.addRRect(Skia.RRectXY(Skia.XYWHRect(a, v0 + gap, pw, v1 - v0 - 2 * gap), 14, 14));
    bevel.addRRect(Skia.RRectXY(Skia.XYWHRect(a + 40, v0 + gap + 40, pw - 80, v1 - v0 - 2 * gap - 80), 10, 10));
  }
  return (
    <Group>
      <Path path={panels} style="stroke" strokeWidth={16} color="#1e1108" opacity={0.8} />
      <Path path={bevel} style="stroke" strokeWidth={10} color="#b07a46" opacity={0.4} />
    </Group>
  );
}

/** The case from the nave (u = z, v = y).
 *  REAL DIMENSIONS (a stylised mid-size case, the model's drawing defaults):
 *  case 8000 wide × 10000 high × 2500 deep; Pedal towers 1400 wide with five
 *  16′-class principals (Ø 230, bodies to ≈ 8 m); the Great's flat of 13
 *  (Ø 190) on the impost; a Positive of 11 (Ø 130) low in front; the Swell
 *  box 3800 × 2700 with horizontal shutters ≈ 200 deep on ≈ 230 centres. */
export function OrganFacade({ hi = null }: { hi?: string | null }): ReactElement {
  const H = CASE.zHalf;
  const P = DIVISIONS.pedal;
  const G = DIVISIONS.great;
  const S = DIVISIONS.swell;
  const Q = DIVISIONS.positive;
  // The Swell's shutters: horizontal louvres, each a board turned a little
  // open (its lit top edge, its face, the dark gap under it), on pivots.
  const shutters = make();
  const shutterEdges = make();
  const gaps = make();
  const pivots = make();
  for (let y = S.y0 + 220; y < S.y1 - 140; y += 230) {
    shutters.addRRect(Skia.RRectXY(Skia.XYWHRect(S.z0 + 170, y, S.z1 - S.z0 - 340, 170), 12, 12));
    shutterEdges.moveTo(S.z0 + 180, y + 10);
    shutterEdges.lineTo(S.z1 - 180, y + 10);
    gaps.addRect(Skia.XYWHRect(S.z0 + 170, y + 170, S.z1 - S.z0 - 340, 60));
    for (const z of [S.z0 + 230, S.z1 - 230]) pivots.addCircle(z, y + 85, 26);
  }
  const glow = (id: string, p: SkPath) => (hi === id ? <Path path={p} style="stroke" strokeWidth={90} color={HIGHLIGHT} opacity={0.85} /> : null);
  return (
    <Group>
      <Path path={rr(-H - 200, -10300, H + 200, 60, 60)} color="#000" opacity={0.45}>
        <BlurMask blur={160} style="normal" />
      </Path>
      {/* the Swell's box above, its shutters */}
      <Oak path={rr(S.z0, S.y0, S.z1, S.y1, 30)} u0={S.z0} v0={S.y0} u1={S.z1} v1={S.y1} />
      <Path path={gaps} color="#0a0603" />
      <Path path={shutters}>
        <LinearGradient start={vec(0, S.y0)} end={vec(0, S.y1)} colors={['#7a5230', '#5a3a1e', '#3a2410']} />
      </Path>
      <Path path={shutterEdges} style="stroke" strokeWidth={16} color="#d6a66a" opacity={0.45} />
      <Path path={shutters} style="stroke" strokeWidth={10} color="#1e1108" opacity={0.8} />
      <Path path={pivots} color="#b48a32" />
      {glow('org.swell', rr(S.z0, S.y0, S.z1, S.y1, 30))}
      {/* the case: the panelled base, the towers' and the bay's open frames */}
      <Oak path={rr(-H, -900, H, 0, 20)} u0={-H} v0={-900} u1={H} v1={0} />
      <BasePanels z0={-H} z1={H} v0={-900} v1={0} n={8} />
      {[-1, 1].map((s) => (
        <OakFrame key={`t${s}`} z0={Math.min(s * P.z0, s * P.z1)} v0={-10000} z1={Math.max(s * P.z0, s * P.z1)} v1={-900} t={120} />
      ))}
      <OakFrame z0={-P.z0 + 40} v0={-6900} z1={P.z0 - 40} v1={-900} t={140} />
      {/* the Pedal towers' pipes and their shades */}
      {[-1, 1].map((s) => (
        <Group key={`p${s}`}>
          <PipeShade z0={s * (P.z0 + 220)} z1={s * (P.z1 - 220)} n={5} topMid={-9700} topEdge={-8600} ceil={-9880} w={230} />
          <Flat z0={s * (P.z0 + 220)} z1={s * (P.z1 - 220)} n={5} mouth={-1700} toe={-1000} topMid={-9700} topEdge={-8600} w={230} />
        </Group>
      ))}
      {/* the Great's flat on the impost, its shade under the cornice */}
      <PipeShade z0={G.z0 + 120} z1={G.z1 - 120} n={13} topMid={-6600} topEdge={-5300} ceil={-6760} w={190} />
      <Flat z0={G.z0 + 120} z1={G.z1 - 120} n={13} mouth={-3500} toe={-3050} topMid={-6600} topEdge={-5300} w={190} />
      {/* the Positive low in front, in its own small case */}
      <OakFrame z0={Q.z0} v0={Q.y0} z1={Q.z1} v1={Q.y1 + 60} t={110} />
      <PipeShade z0={Q.z0 + 160} z1={Q.z1 - 160} n={11} topMid={-2750} topEdge={-2350} ceil={-2790} w={130} />
      <Flat z0={Q.z0 + 160} z1={Q.z1 - 160} n={11} mouth={-1350} toe={-1050} topMid={-2750} topEdge={-2350} w={130} />
      <Cornice z0={Q.z0 + 40} z1={Q.z1 - 40} v={Q.y0 + 120} />
      {/* moulded cornices and tower crowns */}
      {[-1, 1].map((s) => (
        <Cornice key={`c${s}`} z0={Math.min(s * P.z0, s * P.z1)} z1={Math.max(s * P.z0, s * P.z1)} v={-10000} />
      ))}
      <Cornice z0={-P.z0 + 40} z1={P.z0 - 40} v={-6900} />
      {glow('org.pedal', rr(P.z0, -10000, P.z1, -900, 40))}
      {glow('org.pedal', rr(-P.z1, -10000, -P.z0, -900, 40))}
      {glow('org.great', rr(G.z0, G.y0, G.z1, G.y1, 40))}
      {glow('org.positive', rr(Q.z0, Q.y0, Q.z1, Q.y1, 30))}
      {hi === 'org.case' ? <Path path={rr(-H - 60, -10350, H + 60, 40, 80)} style="stroke" strokeWidth={90} color={HIGHLIGHT} opacity={0.85} /> : null}
    </Group>
  );
}

/*
 * THE CONSOLE (a detached three-manual drawknob console; code comment only):
 * ≈ 1300–1900 wide × 1000–1200 deep × 1300 high to the cheek tops; three
 * 61-note manuals (C–C, 36 naturals, 25 sharps: 846 mm wide at the
 * standard 23.5 mm natural pitch), each ≈ 140 mm of playing surface, stepped
 * ≈ 65 mm up and ≈ 70 mm back; the lowest manual's top ≈ 780 mm above the
 * pedal naturals; a 32-note concave, radiating pedalboard (C–G, 19
 * naturals, 13 sharps) ≈ 1230 wide, its naturals ≈ 690 long, running under
 * the bench; stop jambs with drawknobs either side; the bench ≈ 380 deep,
 * its seat ≈ 640 above the floor. The organist faces the case (−x).
 */
function ConsoleSide({ x0, x1, h }: { x0: number; x1: number; h: number }): ReactElement {
  // The near cheek (the console's side panel), cut back under the keydesk
  // for the knees, its front edge carrying the manuals' key fronts.
  const kd = x1 - 360; // the keydesk's back (manuals between kd and x1)
  const cheek = make();
  cheek.moveTo(x0, 0);
  cheek.lineTo(x0, -h);
  cheek.lineTo(kd - 40, -h);
  cheek.quadTo(kd + 60, -h, kd + 120, -h + 120);
  cheek.lineTo(x1, -1000);
  cheek.lineTo(x1, -760);
  cheek.lineTo(kd + 40, -700);
  cheek.lineTo(kd - 60, -160);
  cheek.lineTo(kd - 60, 0);
  cheek.close();
  // The three manuals' fronts (natural key lips) at the cheek's front edge.
  const keys = make();
  for (let i = 0; i < 3; i++) keys.addRRect(Skia.RRectXY(Skia.XYWHRect(x1 - 70 * i - 150, -805 - 65 * i, 150, 22), 4, 4));
  const sharps = make();
  for (let i = 0; i < 3; i++) sharps.addRRect(Skia.RRectXY(Skia.XYWHRect(x1 - 70 * i - 150, -823 - 65 * i, 95, 16), 3, 3));
  // The music desk leaning back over the top manual.
  const desk = make();
  desk.moveTo(kd - 30, -980);
  desk.lineTo(kd + 30, -980);
  desk.lineTo(kd - 30, -1300);
  desk.lineTo(kd - 70, -1300);
  desk.close();
  // The pedalboard at the floor: its frame, a natural and a sharp in profile
  // rising toward the back (the pedals run back under the keydesk).
  const pedalFrame = rr(kd - 420, -70, x1 + 160, 0, 8);
  const pedal = make();
  pedal.moveTo(kd - 380, -70);
  pedal.lineTo(x1 + 140, -96);
  pedal.lineTo(x1 + 140, -120);
  pedal.lineTo(kd - 380, -100);
  pedal.close();
  const sharp = rr(kd - 60, -160, kd + 120, -100, 10);
  // The bench, behind the pedalboard: seat, apron and legs.
  const bx = x1 + 260;
  const bench = rr(bx, -660, bx + 380, -600, 10);
  const benchLegs = make();
  benchLegs.addRect(Skia.XYWHRect(bx + 20, -600, 50, 600));
  benchLegs.addRect(Skia.XYWHRect(bx + 310, -600, 50, 600));
  benchLegs.addRect(Skia.XYWHRect(bx + 20, -600, 340, 70));
  return (
    <Group>
      <Path path={pedalFrame} color="#2a1a0c" />
      <Path path={pedal}>
        <LinearGradient start={vec(kd, -120)} end={vec(kd, -70)} colors={['#c7a07a', '#7a5432']} />
      </Path>
      <Path path={sharp} color="#14100c" />
      <Path path={cheek}>
        <LinearGradient start={vec(x0, -h)} end={vec(x1, 0)} colors={OAK} />
      </Path>
      {/* a sunk panel on the cheek, and its lit upper-left edge */}
      <Path path={rr(x0 + 90, -h + 110, kd - 160, -260, 16)} style="stroke" strokeWidth={16} color="#1e1108" opacity={0.7} />
      <Path path={(() => { const p = make(); p.moveTo(x0 + 12, -10); p.lineTo(x0 + 12, -h + 12); p.lineTo(kd - 40, -h + 12); return p; })()} style="stroke" strokeWidth={14} color="#d6a66a" opacity={0.45} />
      <Path path={keys} color="#f1ede2" />
      <Path path={sharps} color="#121214" />
      <Path path={desk}>
        <LinearGradient start={vec(kd - 70, -1300)} end={vec(kd + 30, -980)} colors={[OAK[0], OAK[2]]} />
      </Path>
      <Path path={cheek} style="stroke" strokeWidth={18} color="#1e1108" />
      <Path path={benchLegs} color="#3a2410" />
      <Path path={bench}>
        <LinearGradient start={vec(bx, -660)} end={vec(bx + 380, -600)} colors={[OAK[0], OAK[2]]} />
      </Path>
    </Group>
  );
}

type ConsoleTopPaths = Record<'roof' | 'jambs' | 'knobs' | 'knobRims' | 'naturals' | 'naturalEdges' | 'sharpsK' | 'desk' | 'pedals' | 'pedalSharps' | 'bench', SkPath>;
let consoleTopBuilt: ConsoleTopPaths | null = null;
/** The console from above (u = x, v = z): the roof, the stop jambs with their
 *  drawknobs, three stepped 61-note manuals, the music desk, the radiating
 *  pedalboard's ends showing past the key fronts, and the bench. */
function consoleTop(): ConsoleTopPaths {
  if (consoleTopBuilt) return consoleTopBuilt;
  const { x0, x1, z0, z1 } = CONSOLE;
  const kd = x1 - 360;
  const zc = (z0 + z1) / 2;
  const KW = 846; // 61 notes: 36 naturals × 23.5
  const NW = KW / 36;
  const roof = rr(x0, z0, kd, z1, 40);
  const jambs = make();
  jambs.addRRect(Skia.RRectXY(Skia.XYWHRect(kd - 20, z0, x1 - kd + 20, zc - KW / 2 - z0 - 10), 20, 20));
  jambs.addRRect(Skia.RRectXY(Skia.XYWHRect(kd - 20, zc + KW / 2 + 10, x1 - kd + 20, z1 - zc - KW / 2 - 10), 20, 20));
  const knobs = make();
  const knobRims = make();
  for (const [a, b] of [[z0 + 30, zc - KW / 2 - 40], [zc + KW / 2 + 40, z1 - 30]] as const) {
    for (let x = kd + 30; x < x1 - 40; x += 62) {
      for (let z = a + 28; z <= b - 28; z += 64) {
        knobs.addCircle(x, z, 20);
        knobRims.addCircle(x, z, 24);
      }
    }
  }
  const naturals = make();
  const naturalEdges = make();
  const sharpsK = make();
  // Three manuals, the lowest nearest the organist (+x): each shows ≈ 70 mm
  // of its keys past the one above it; the top one its full 140.
  for (let m = 0; m < 3; m++) {
    const xf = x1 - 30 - m * 70; // key fronts
    const len = m === 2 ? 140 : 70;
    for (let i = 0; i < 36; i++) {
      const z = zc - KW / 2 + i * NW;
      naturals.addRect(Skia.XYWHRect(xf - len, z + 0.5, len, NW - 1));
      naturalEdges.moveTo(xf - len, z);
      naturalEdges.lineTo(xf, z);
    }
    if (m === 2) {
      for (let i = 0; i < 35; i++) {
        if ([0, 1, 3, 4, 5].includes(i % 7)) {
          const zb = zc - KW / 2 + (i + 1) * NW;
          sharpsK.addRRect(Skia.RRectXY(Skia.XYWHRect(xf - len, zb - 6.5, 85, 13), 2, 2));
        }
      }
    } else {
      // Only the sharps' front ends show under the manual above.
      for (let i = 0; i < 35; i++) {
        if ([0, 1, 3, 4, 5].includes(i % 7)) {
          const zb = zc - KW / 2 + (i + 1) * NW;
          sharpsK.addRect(Skia.XYWHRect(xf - len, zb - 6.5, 15, 13));
        }
      }
    }
  }
  const desk = rr(kd - 90, zc - 520, kd - 10, zc + 520, 12);
  // The pedalboard: 19 naturals RADIATING — they converge toward a point
  // ≈ 2.6 m out toward the organist and fan out toward the console, so the
  // feet reach the outer notes; their ends show past the key fronts; 13
  // sharps toward the console end.
  const pedals = make();
  const pedalSharps = make();
  const PW = 1230;
  const ax = x1 + 2600;
  const xb = x1 - 200;
  const xe = x1 + 220;
  const k = (ax - xe) / (ax - xb);
  for (let i = 0; i < 19; i++) {
    const zb = zc - PW / 2 + (i + 0.5) * (PW / 19);
    const ze = zc + (zb - zc) * k;
    const p = make();
    p.moveTo(xb, zb - 22);
    p.lineTo(xe, ze - 20);
    p.lineTo(xe, ze + 20);
    p.lineTo(xb, zb + 22);
    p.close();
    pedals.addPath(p);
  }
  for (let i = 0; i < 18; i++) {
    if ([0, 1, 3, 4, 5].includes(i % 7)) {
      const z = zc - PW / 2 + (i + 1) * (PW / 19);
      pedalSharps.addRRect(Skia.RRectXY(Skia.XYWHRect(x1 - 120, z - 16, 150, 32), 8, 8));
    }
  }
  const bench = rr(x1 + 260, zc - 650, x1 + 640, zc + 650, 30);
  consoleTopBuilt = { roof, jambs, knobs, knobRims, naturals, naturalEdges, sharpsK, desk, pedals, pedalSharps, bench };
  return consoleTopBuilt;
}

function ConsoleTop(): ReactElement {
  const c = consoleTop();
  const { x0, x1, z0, z1 } = CONSOLE;
  return (
    <Group>
      <Path path={c.pedals}>
        <LinearGradient start={vec(x1, 0)} end={vec(x1 + 220, 0)} colors={['#7a5432', '#c7a07a']} />
      </Path>
      <Path path={c.pedals} style="stroke" strokeWidth={8} color="#2a1a0c" />
      <Path path={c.pedalSharps} color="#14100c" />
      <Path path={c.roof}>
        <LinearGradient start={vec(x0, z0)} end={vec(x1, z1)} colors={OAK} />
      </Path>
      <Path path={c.roof} style="stroke" strokeWidth={20} color="#1e1108" />
      <Path path={c.jambs}>
        <LinearGradient start={vec(x0, z0)} end={vec(x1, z1)} colors={[OAK[1], OAK[2]]} />
      </Path>
      <Path path={c.knobRims} color="#1a120b" />
      <Path path={c.knobs}>
        <LinearGradient start={vec(0, z0)} end={vec(0, z1)} colors={['#fbf6e8', '#d8cdb2']} />
      </Path>
      <Path path={c.naturals}>
        <LinearGradient start={vec(x1 - 200, 0)} end={vec(x1, 0)} colors={['#d8d1bf', '#fbf8f0']} />
      </Path>
      <Path path={c.naturalEdges} style="stroke" strokeWidth={2} color="#6d6656" />
      <Path path={c.sharpsK} color="#121214" />
      <Path path={c.desk}>
        <LinearGradient start={vec(0, z0)} end={vec(0, z1)} colors={[OAK[0], OAK[2]]} />
      </Path>
      <Path path={c.bench}>
        <LinearGradient start={vec(x1 + 260, z0)} end={vec(x1 + 640, z1)} colors={[OAK[0], OAK[2], OAK[3]]} />
      </Path>
      <Path path={c.bench} style="stroke" strokeWidth={16} color="#1e1108" />
    </Group>
  );
}

/** The case cut along the nave's centre line (u = x, v = y): the panelled
 *  base and impost, the back and roof, the Great's middle pipe on its
 *  chest with a smaller one behind it, the Positive in front, the Swell box
 *  with its shutters facing the nave, the cornices. (The Pedal towers stand
 *  off the centre line, so the cut does not show them.) */
function CaseSection(): ReactElement {
  const { x0, x1, top } = CASE;
  const shell = make();
  shell.moveTo(x0, 0);
  shell.lineTo(x0, top);
  shell.lineTo(x1 + 150, top);
  shell.lineTo(x1 + 150, top + 260);
  shell.lineTo(x1, top + 260);
  shell.lineTo(x1, -900);
  shell.lineTo(x1 + 150, -900);
  shell.lineTo(x1 + 150, 0);
  shell.close();
  const inside = rr(x0 + 120, top + 260, x1 - 20, -1020, 10);
  const swell = rr(-2300, DIVISIONS.swell.y0, -500, DIVISIONS.swell.y1, 20);
  const louvres = make();
  for (let y = DIVISIONS.swell.y0 + 200; y < DIVISIONS.swell.y1 - 150; y += 230) {
    louvres.moveTo(-560, y);
    louvres.lineTo(-440, y + 150);
  }
  const chest = rr(-1100, -3050, -20, -2700, 10);
  const posCase = rr(-520, -2900, -10, -900, 16);
  const panels = make();
  for (let x = x0 + 120; x < x1 - 200; x += 820) panels.addRRect(Skia.RRectXY(Skia.XYWHRect(x, -800, 700, 700), 12, 12));
  return (
    <Group>
      <Path path={shell}>
        <LinearGradient start={vec(x0, top)} end={vec(x1, 0)} colors={OAK} />
      </Path>
      <Path path={inside}>
        <LinearGradient start={vec(x0, top)} end={vec(x1, 0)} colors={['#1c120a', '#0c0805']} />
      </Path>
      <Oak path={swell} u0={-2300} v0={DIVISIONS.swell.y0} u1={-500} v1={DIVISIONS.swell.y1} />
      <Path path={louvres} style="stroke" strokeWidth={40} strokeCap="round" color="#7a5230" />
      <Path path={chest} color="#3a2410" />
      <PipeSide x={-120} w={190} top={-6600} mouth={-3500} toe={-3050} />
      <PipeSide x={-560} w={150} top={-5900} mouth={-3500} toe={-3050} />
      <Oak path={posCase} u0={-520} v0={-2900} u1={-10} v1={-900} />
      <PipeSide x={-80} w={130} top={-2750} mouth={-1350} toe={-1050} />
      <Path path={panels} style="stroke" strokeWidth={16} color="#1e1108" opacity={0.7} />
      <Path path={shell} style="stroke" strokeWidth={30} color="#1e1108" />
    </Group>
  );
}

/** A flue pipe in profile, its mouth facing the nave (+x): the body, the
 *  flatted upper lip and the cut-up on the near edge, the conical foot. */
function PipeSide({ x, w, top, mouth, toe }: { x: number; w: number; top: number; mouth: number; toe: number }): ReactElement {
  const body = rr(x - w / 2, top, x + w / 2, mouth, w * 0.05);
  const foot = make();
  foot.moveTo(x - w / 2, mouth);
  foot.lineTo(x + w / 2, mouth);
  foot.lineTo(x + w * 0.1, toe);
  foot.lineTo(x - w * 0.1, toe);
  foot.close();
  const lip = make();
  lip.moveTo(x + w / 2, mouth - 0.17 * w - 0.9 * w);
  lip.lineTo(x + w * 0.36, mouth - 0.17 * w);
  lip.lineTo(x + w / 2, mouth - 0.17 * w);
  lip.close();
  const cut = make();
  cut.addRect(Skia.XYWHRect(x + w * 0.36, mouth - 0.17 * w, w * 0.14, 0.17 * w));
  return (
    <Group>
      <Path path={foot}>
        <LinearGradient start={vec(x - w / 2, 0)} end={vec(x + w / 2, 0)} colors={TIN_FOOT} positions={TIN_POS} />
      </Path>
      <Path path={body}>
        <LinearGradient start={vec(x - w / 2, 0)} end={vec(x + w / 2, 0)} colors={TIN_BODY} positions={TIN_POS} />
      </Path>
      <Path path={lip} color="#8d96a2" />
      <Path path={cut} color="#07080a" />
      <Path path={body} style="stroke" strokeWidth={w * 0.03} color="#2c3138" opacity={0.75} />
    </Group>
  );
}

/*
 * PEWS, empty (owner rule: an audience is drawn as its empty seats, never as
 * people — art pass 2026-10-10 round 2; the service's congregation used to be
 * stick figures with circle heads). Real dimensions (mm), a common oak pew:
 * seat 450 high and 430 deep, the back rising to a rail 900 high, a book
 * rack on the back of each pew (for the row behind) and a kneeler under it,
 * end panels 50 thick; rows on the model's pitch (pewXs, 1000 — a drawing
 * default within the usual 900–1000), ≈ 600 of pew per sitter.
 */
/** A pew seen from the side: its END PANEL (which hides the seat and back),
 *  front edge at x, the sitter facing the organ (−x); the book rack and the
 *  kneeler behind it serve the next row. */
function pewProfile(x: number): { panel: SkPath; inset: SkPath; rack: SkPath; kneeler: SkPath } {
  const panel = make();
  panel.moveTo(x - 20, 0);
  panel.lineTo(x - 20, -560);
  panel.cubicTo(x - 20, -640, x + 40, -660, x + 120, -650);
  panel.lineTo(x + 470, -880);
  panel.cubicTo(x + 500, -930, x + 560, -930, x + 570, -890);
  panel.lineTo(x + 570, 0);
  panel.close();
  const inset = make();
  inset.moveTo(x + 40, -60);
  inset.lineTo(x + 40, -540);
  inset.lineTo(x + 470, -780);
  inset.lineTo(x + 510, -780);
  inset.lineTo(x + 510, -60);
  inset.close();
  const rack = rr(x + 570, -800, x + 650, -700, 10);
  const kneeler = rr(x + 600, -170, x + 840, -90, 20);
  return { panel, inset, rack, kneeler };
}

export function OrganSide({ variant, hi = null }: { variant: string; hi?: string | null }): ReactElement {
  const service = variant === 'service';
  const pews = make();
  const insets = make();
  const racks = make();
  const kneelers = make();
  for (const x of pewXs()) {
    const q = pewProfile(x);
    pews.addPath(q.panel);
    insets.addPath(q.inset);
    racks.addPath(q.rack);
    kneelers.addPath(q.kneeler);
  }
  const caseProfile = make();
  caseProfile.moveTo(CASE.x0, 0);
  caseProfile.lineTo(CASE.x0, CASE.top);
  caseProfile.lineTo(CASE.x1 + 150, CASE.top);
  caseProfile.lineTo(CASE.x1 + 150, CASE.top + 300);
  caseProfile.lineTo(CASE.x1, CASE.top + 300);
  caseProfile.lineTo(CASE.x1, 0);
  caseProfile.close();
  const floor = rr(-3000, 0, NAVE.x1, 300, 0);
  return (
    <Group>
      <Path path={floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 300)} colors={['#3a3530', '#1c1a17']} />
      </Path>
      <CaseSection />
      {hi === 'org.case' ? <Path path={caseProfile} style="stroke" strokeWidth={110} color={HIGHLIGHT} opacity={0.8} /> : null}
      <ConsoleSide x0={CONSOLE.x0} x1={CONSOLE.x1} h={CONSOLE.h} />
      <Path path={pews}>
        <LinearGradient start={vec(0, -950)} end={vec(0, 0)} colors={PEW} />
      </Path>
      <Path path={pews} style="stroke" strokeWidth={14} color="#1e1108" opacity={0.8} />
      <Path path={insets} style="stroke" strokeWidth={10} color="#2a170a" opacity={0.6} />
      <Path path={racks} color="#4a2c15" />
      <Path path={kneelers} color="#5a2a2a" />
      {service ? (
        <Group>
          <Path path={rr(PA.x - 150, -PA.h1, PA.x + 150, -PA.h0, 40)}>
            <LinearGradient start={vec(PA.x - 150, 0)} end={vec(PA.x + 150, 0)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
          </Path>
          <Path path={rr(PA.x - 150, -PA.h1, PA.x + 150, -PA.h0, 40)} style="stroke" strokeWidth={20} color="#8a8f9c" />
        </Group>
      ) : null}
    </Group>
  );
}

export function OrganTop({ variant, hi = null, whole = false }: { variant: string; hi?: string | null; whole?: boolean }): ReactElement {
  const service = variant === 'service';
  const H = CASE.zHalf;
  const caseTop = rr(CASE.x0, -H, CASE.x1, H, 60);
  // Open pipes from above: a tin ring round a dark bore, at the façade's
  // own positions (the same flats as OrganFacade).
  const rims = make();
  const bores = make();
  const ring = (x: number, z: number, d: number) => {
    rims.addCircle(x, z, d / 2);
    bores.addCircle(x, z, d / 2 - d * 0.16);
  };
  const Pd = DIVISIONS.pedal;
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) ring(-140, s * (Pd.z0 + 220 + (i * (Pd.z1 - Pd.z0 - 440)) / 4), 230);
  for (let i = 0; i < 13; i++) ring(-120, DIVISIONS.great.z0 + 120 + (i * (DIVISIONS.great.z1 - DIVISIONS.great.z0 - 240)) / 12, 190);
  // (The Positive stands below the Great inside the case front: hidden from above.)
  const swellBox = rr(-2300, DIVISIONS.swell.z0, -500, DIVISIONS.swell.z1, 40);
  const swellRoof = make();
  for (let z = DIVISIONS.swell.z0 + 200; z < DIVISIONS.swell.z1 - 100; z += 300) {
    swellRoof.moveTo(-2200, z);
    swellRoof.lineTo(-600, z);
  }
  const crowns = make();
  for (const s of [-1, 1]) crowns.addRRect(Skia.RRectXY(Skia.XYWHRect(-420, Math.min(s * Pd.z0, s * Pd.z1) - 120, 570, Pd.z1 - Pd.z0 + 240), 30, 30));
  const pews = make();
  const zs: [number, number][] = [
    [-ORGAN.sideZ.mm, -ORGAN.aisleZ1.mm],
    [-ORGAN.aisleZ0.mm, ORGAN.aisleZ0.mm],
    [ORGAN.aisleZ1.mm, ORGAN.sideZ.mm],
  ];
  // From above: the seat (430 deep), the back rail and book rack behind it,
  // an end panel at each end — empty (owner rule: never people).
  const backs = make();
  const ends = make();
  for (const x of pewXs())
    for (const [a, b] of zs) {
      pews.addRRect(Skia.RRectXY(Skia.XYWHRect(x, a + 60, 430, b - a - 120), 20, 20));
      backs.addRect(Skia.XYWHRect(x + 430, a + 60, 60, b - a - 120));
      backs.addRect(Skia.XYWHRect(x + 500, a + 90, 70, b - a - 180));
      ends.addRect(Skia.XYWHRect(x - 20, a + 40, 590, 50));
      ends.addRect(Skia.XYWHRect(x - 20, b - 90, 590, 50));
    }
  const aisles = make();
  for (const s of [-1, 1]) aisles.addRect(Skia.XYWHRect(6000, Math.min(s * ORGAN.aisleZ0.mm, s * ORGAN.aisleZ1.mm), NAVE.x1 - 6000, ORGAN.aisleZ1.mm - ORGAN.aisleZ0.mm));
  const passages = make();
  for (const s of [-1, 1]) passages.addRect(Skia.XYWHRect(0, Math.min(s * ORGAN.sideZ.mm, s * NAVE.zHalf), NAVE.x1, NAVE.zHalf - ORGAN.sideZ.mm));
  const walls = make();
  walls.addRect(Skia.XYWHRect(-3000, -NAVE.zHalf - 300, NAVE.x1 + 3000, 300));
  walls.addRect(Skia.XYWHRect(-3000, NAVE.zHalf, NAVE.x1 + 3000, 300));
  if (whole) walls.addRect(Skia.XYWHRect(NAVE.x1, -NAVE.zHalf - 300, 300, NAVE.zHalf * 2 + 600));
  return (
    <Group>
      <Path path={rr(-3000, -NAVE.zHalf, whole ? NAVE.x1 : NAVE.x1, NAVE.zHalf, 0)} color="#16171b" />
      <Path path={aisles} color="#24262c" />
      <Path path={aisles} style="stroke" strokeWidth={40} color="#6fa8ff" opacity={0.35}>
        <DashPathEffect intervals={[300, 200]} />
      </Path>
      <Path path={passages} color="#24262c" />
      <Path path={walls} color="#4a4d56" />
      <Path path={pews}>
        <LinearGradient start={vec(0, -NAVE.zHalf)} end={vec(0, NAVE.zHalf)} colors={PEW} />
      </Path>
      <Path path={backs} color="#3a210f" />
      <Path path={ends} color="#2a170a" />
      <Path path={caseTop} color="#000" opacity={0.5} transform={[{ translateX: 120 }, { translateY: 160 }]}>
        <BlurMask blur={120} style="normal" />
      </Path>
      <Path path={caseTop}>
        <LinearGradient start={vec(CASE.x0, -H)} end={vec(0, H)} colors={OAK} />
      </Path>
      <Path path={swellBox}>
        <LinearGradient start={vec(-2300, DIVISIONS.swell.z0)} end={vec(-500, DIVISIONS.swell.z1)} colors={[OAK[1], OAK[2], OAK[3]]} />
      </Path>
      <Path path={swellRoof} style="stroke" strokeWidth={24} color="#1e1108" opacity={0.6} />
      <Path path={swellBox} style="stroke" strokeWidth={24} color="#1e1108" />
      <Path path={crowns}>
        <LinearGradient start={vec(-420, -4000)} end={vec(150, 4000)} colors={['#a8743f', OAK[1], OAK[3]]} />
      </Path>
      <Path path={crowns} style="stroke" strokeWidth={22} color="#e7c26a" opacity={0.6} />
      <Path path={rims}>
        <LinearGradient start={vec(-400, -4000)} end={vec(100, 4000)} colors={TIN} />
      </Path>
      <Path path={bores}>
        <LinearGradient start={vec(-300, -4000)} end={vec(0, 4000)} colors={['#07080a', '#2a2e35']} />
      </Path>
      <Path path={caseTop} style="stroke" strokeWidth={30} color="#1e1108" />
      {hi === 'org.case' ? <Path path={caseTop} style="stroke" strokeWidth={120} color={HIGHLIGHT} opacity={0.8} /> : null}
      <ConsoleTop />
      {hi === 'org.console' ? <Path path={rr(CONSOLE.x0 - 150, CONSOLE.z0 - 150, CONSOLE.x1 + 150, CONSOLE.z1 + 150, 80)} style="stroke" strokeWidth={100} color={HIGHLIGHT} /> : null}
      {service
        ? [-1, 1].map((s) => (
            <Group key={s}>
              <Path path={rr(PA.x - 150, s * PA.z - 150, PA.x + 150, s * PA.z + 150, 40)} color="#1d1e22" />
              <Path path={rr(PA.x - 150, s * PA.z - 150, PA.x + 150, s * PA.z + 150, 40)} style="stroke" strokeWidth={30} color="#c8ccd4" />
            </Group>
          ))
        : null}
      {whole ? (
        <Group>
          <Path path={rr(GALLERY.x0, -NAVE.zHalf, GALLERY.x1, NAVE.zHalf, 0)} color="#2a2118" opacity={0.75} />
          <Path path={rr(GALLERY.x0 + 600, -1500, GALLERY.x0 + 1500, 1500, 60)}>
            <LinearGradient start={vec(GALLERY.x0, -1500)} end={vec(GALLERY.x1, 1500)} colors={OAK} />
          </Path>
          {Array.from({ length: 7 }, (_, i) => <Circle key={i} cx={GALLERY.x0 + 900} cy={-1200 + i * 400} r={110} color={TIN[1]} />)}
          {hi === 'antiphonal' ? <Path path={rr(GALLERY.x0 + 450, -1700, GALLERY.x0 + 1650, 1700, 80)} style="stroke" strokeWidth={110} color={HIGHLIGHT} /> : null}
        </Group>
      ) : null}
    </Group>
  );
}

/** Divisions' anchors for the arrivals picture (front view u = z, v = y). */
export const DIVISION_IDS: readonly DivisionId[] = ['great', 'swell', 'pedal', 'positive'];
