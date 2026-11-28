/**
 * FIGURE V2 FOR react-native-svg SCREENS (wave 7 of D78, 2026-11-24): the
 * approved cast drawn where a lab draws with SVG, not Skia (Room Design's side
 * view, Sound Systems' performers, Stage Plot's performer and choir).
 *
 * The geometry is the SAME plan the Skia figure paints — sidePlan.ts and
 * topPerson.ts (pure: no React, no Skia) on the same poses and cast members —
 * so the two cannot drift; this file only paints the plan the way the Skia
 * LITE level does (lite.tsx: each mass one gradient in its material, no blur;
 * the head in its own light; the hand's one light): the outlines through the
 * same Catmull-Rom curve as paths.ts `smoothClosed` / `smoothOpen` (same
 * tension, same handle limit, same repeated-point filter), the same `across`
 * gradient axis as paint.tsx, the same materials from the cast's look.
 * Where the Skia version cuts one path with another (the belt to the shirt) a
 * clip does the same here; unions are drawn as their parts in one gradient.
 */
import { useId, useMemo, type ReactElement } from 'react';
import { ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import type { PlayerPose, Pt } from '../../screens/lab/miking/lessons/shared/players/playerPose.ts';
import { LIGHT, dot, lerp, perp, sub, unit } from '../../screens/lab/miking/lessons/shared/figureV2/geom.ts';
import { sidePlan, type ArmPlan, type Ellipse, type SidePlan } from '../../screens/lab/miking/lessons/shared/figureV2/sidePlan.ts';
import { standingAbovePose } from '../../screens/lab/miking/lessons/shared/figureV2/markerPose.ts';
import { frontPlan, FRONT_STANDING, type FrontPlan } from '../../screens/lab/miking/lessons/shared/figureV2/frontPlan.ts';
import { personTopPlan } from '../../screens/lab/miking/lessons/shared/figureV2/topPerson.ts';
import { SOLE, type Material } from '../../screens/lab/miking/lessons/shared/figureV2/palette.ts';
import { catmullInto, svgPathSink } from './headIconGeometry';
import { type CastMember } from '../../screens/lab/miking/lessons/shared/figureV2/cast';
import type { TopPlan } from '../../screens/lab/miking/lessons/shared/figureV2/topPlan.ts';

type Poly = readonly Pt[];
const f = (n: number) => `${Math.round(n * 100) / 100}`;

/* ── who stands where a screen places people itself ── */

/** (markerPose.ts) people a screen places by number take the cast in turn; a learner's object keeps its person. */
export { CAST_IN_TURN, castInTurn, castForKey } from '../../screens/lab/miking/lessons/shared/figureV2/markerPose.ts';

/* ── the curves (paths.ts smoothClosed / smoothOpen / ellipsePath, as SVG) ── */

/** paths.ts `smoothClosed`, as an SVG `d`. */
export function dClosed(raw: Poly, tension = 0.5): string {
  const points = raw.filter((q, i) => {
    const r = raw[(i + raw.length - 1) % raw.length];
    return Math.hypot(q.u - r.u, q.v - r.v) > 0.05;
  });
  const n = points.length;
  if (n < 3) return '';
  const at = (i: number) => points[(i + n) % n];
  const k = tension / 3;
  const handle = (du: number, dv: number, seg: number) => {
    const l = Math.hypot(du, dv) * k;
    const m = seg * 0.5;
    return l > m && l > 0 ? m / l : 1;
  };
  let d = `M${f(points[0].u)} ${f(points[0].v)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const seg = Math.hypot(p2.u - p1.u, p2.v - p1.v);
    const a = handle(p2.u - p0.u, p2.v - p0.v, seg);
    const b = handle(p3.u - p1.u, p3.v - p1.v, seg);
    d += `C${f(p1.u + (p2.u - p0.u) * k * a)} ${f(p1.v + (p2.v - p0.v) * k * a)} ${f(p2.u - (p3.u - p1.u) * k * b)} ${f(p2.v - (p3.v - p1.v) * k * b)} ${f(p2.u)} ${f(p2.v)}`;
  }
  return `${d}Z`;
}

/** paths.ts `smoothOpen`, as an SVG `d`. */
export function dOpen(points: Poly): string {
  const n = points.length;
  if (!n) return '';
  const at = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(points[0].u)} ${f(points[0].v)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += `C${f(p1.u + (p2.u - p0.u) / 6)} ${f(p1.v + (p2.v - p0.v) / 6)} ${f(p2.u - (p3.u - p1.u) / 6)} ${f(p2.v - (p3.v - p1.v) / 6)} ${f(p2.u)} ${f(p2.v)}`;
  }
  return d;
}

/** paths.ts `ellipsePath`, as an SVG `d`. */
export function dEllipse(e: Ellipse): string {
  const c = Math.cos(e.rot);
  const s = Math.sin(e.rot);
  const at = (x: number, y: number) => `${f(e.c.u + x * c - y * s)} ${f(e.c.v + x * s + y * c)}`;
  const deg = (e.rot * 180) / Math.PI;
  return `M${at(e.rx, 0)}A${f(e.rx)} ${f(e.ry)} ${f(deg)} 1 1 ${at(-e.rx, 0)}A${f(e.rx)} ${f(e.ry)} ${f(deg)} 1 1 ${at(e.rx, 0)}Z`;
}

/** paint.tsx `across`: the gradient's axis square to a mass's own axis, its lit end toward the light. */
function across(a: Pt, b: Pt, w: number): [Pt, Pt] {
  let n = perp(unit(sub(b, a)));
  if (dot(n, LIGHT) < 0) n = { u: -n.u, v: -n.v };
  const m = lerp(a, b, 0.5);
  return [
    { u: m.u + n.u * w, v: m.v + n.v * w },
    { u: m.u - n.u * w, v: m.v - n.v * w },
  ];
}

const boxOf = (ps: readonly Poly[]) => {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const q of ps)
    for (const p of q) {
      u0 = Math.min(u0, p.u);
      v0 = Math.min(v0, p.v);
      u1 = Math.max(u1, p.u);
      v1 = Math.max(v1, p.v);
    }
  return { u0, v0, u1, v1, c: { u: (u0 + u1) / 2, v: (v0 + v1) / 2 } };
};

/* ── the paint: one gradient per mass, collected as defs ── */

type Paint = { defs: ReactElement[]; lin: (mat: Material, axis: readonly [Pt, Pt], w: number) => string; round: (mat: Material, c: Pt, r: number) => string; ramp: (colors: readonly string[], pos: readonly number[] | null, s: Pt, e: Pt) => string };

function paintOf(uid: string): Paint {
  const defs: ReactElement[] = [];
  let n = 0;
  const stops = (colors: readonly string[], pos: readonly number[] | null) => colors.map((c, i) => <Stop key={i} offset={pos ? pos[i] : colors.length > 1 ? i / (colors.length - 1) : 0} stopColor={c} />);
  const ramp = (colors: readonly string[], pos: readonly number[] | null, s: Pt, e: Pt) => {
    const id = `${uid}g${n++}`;
    defs.push(
      <LinearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={s.u} y1={s.v} x2={e.u} y2={e.v}>
        {stops(colors, pos)}
      </LinearGradient>,
    );
    return `url(#${id})`;
  };
  return {
    defs,
    ramp,
    lin: (mat, axis, w) => {
      const [s, e] = across(axis[0], axis[1], w);
      return ramp(mat.form, mat.pos, s, e);
    },
    round: (mat, c, r) => {
      const id = `${uid}g${n++}`;
      const cx = c.u + LIGHT.u * r * 0.45;
      const cy = c.v + LIGHT.v * r * 0.45;
      defs.push(
        <RadialGradient key={id} id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} fx={cx} fy={cy} r={r * 1.55}>
          {stops(mat.form, mat.pos)}
        </RadialGradient>,
      );
      return `url(#${id})`;
    },
  };
}

/* ── FROM ABOVE: a standing cast member (topPerson.ts), painted as TopLite's upper body ── */

/** The standing 'above' pose (figureV2/markerPose.ts: the neck at the origin, facing +y, down the plan). */
export const abovePose = standingAbovePose;

/** The person's plan from above, as the Skia PersonTopV2 builds it. */
export const aboveSvgPlan = (who: CastMember, narrow = false): TopPlan => personTopPlan(abovePose(narrow), who, {});

/**
 * A standing cast member FROM ABOVE (the drop-in for FigureAboveSvg): at (x, y), `pxPerMm` caller units
 * per mm, turned by `facingDeg` (0 = facing +y, toward the house). `halo`: a light rim round the
 * shoulders for a plan where the person is only a few px across.
 */
export function PersonAboveSvg({ x, y, pxPerMm, who, facingDeg = 0, dim = 1, halo, build = 'standard' }: { x: number; y: number; pxPerMm: number; who: CastMember; facingDeg?: number; dim?: number; halo?: string; build?: 'standard' | 'narrow' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const narrow = build === 'narrow';
  const art = useMemo(() => {
    const plan = aboveSvgPlan(who, narrow);
    const L = who.look;
    const P = paintOf(`pa${uid}`);
    const hc = plan.head.c;
    const torso = dClosed(plan.torso, 0.5);
    const body = (
      <G>
        <Path d={torso} fill={P.lin(L.MAT.shirt, plan.torsoAxis, 120)} />
        <Path d={torso} fill="none" stroke={L.MAT.shirt.edge} strokeWidth={1} opacity={0.5} />
        <Path d={dClosed(plan.head.skull, 0.55)} fill={P.round(L.HEAD_SKIN, hc, 110)} />
        {plan.head.ears.map((e, i) => (
          <Path key={i} d={dOpen(e)} fill="none" stroke={L.HEAD_SKIN.form[2]} strokeWidth={9} strokeLinecap="round" />
        ))}
        <Path d={dClosed(plan.head.nose, 0.5)} fill={P.round(L.HEAD_SKIN, hc, 110)} />
        <Path d={dClosed(plan.head.hair, 0.5)} fill={P.ramp([L.MAT.hair.form[1], L.MAT.hair.form[2], L.MAT.hair.form[3]], null, { u: hc.u + LIGHT.u * 110, v: hc.v + LIGHT.v * 110 }, { u: hc.u - LIGHT.u * 110, v: hc.v - LIGHT.v * 110 })} />
      </G>
    );
    return { torso, body, defs: P.defs };
  }, [who, narrow, uid]);
  const haloW = (narrow ? 1.0 : 1.4) / pxPerMm;
  return (
    <G transform={`translate(${x} ${y}) rotate(${facingDeg}) scale(${pxPerMm})`} opacity={dim}>
      <Defs>{art.defs}</Defs>
      {/* contact shadow, offset down-right (light from the upper left), as before */}
      <Path d={art.torso} fill="#000" opacity={0.4} transform="translate(22 30)" />
      {halo ? <Path d={art.torso} fill="none" stroke={halo} strokeWidth={haloW} strokeLinejoin="round" opacity={0.85} /> : null}
      {art.body}
    </G>
  );
}

/* ── IN PROFILE, SEATED ON A CHAIR (Room Design's listener) ── */

/** The seated pose (the broadcast talker's seated body, measured from its hip): the floor at v = 0, the
 *  hip over u = 0, the seat top `S` mm up; the forearms along the thighs, the hands resting on them. */
const seatedPoses = new Map<number, PlayerPose>();
const SHIN = 530; // knee joint to the sole (the talker's: a 470 seat, the foot 40 ahead of the knee)
const UPPER_ARM = 300;
const FOREARM = 252;
function elbowFor(s: Pt, w: Pt): Pt {
  // two-bone reach, the elbow hanging back and down
  const d = Math.min(Math.hypot(w.u - s.u, w.v - s.v), UPPER_ARM + FOREARM - 1);
  const a = (UPPER_ARM * UPPER_ARM - FOREARM * FOREARM + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - a * a));
  const ex = (w.u - s.u) / d;
  const ey = (w.v - s.v) / d;
  const m = { u: s.u + ex * a, v: s.v + ey * a };
  const c1 = { u: m.u - ey * h, v: m.v + ex * h };
  const c2 = { u: m.u + ey * h, v: m.v - ex * h };
  return c1.u < c2.u ? c1 : c2;
}
export function seatedSidePose(S: number): PlayerPose {
  const key = Math.round(S / 5) * 5;
  const hit = seatedPoses.get(key);
  if (hit) return hit;
  const hipV = -(key + 72);
  const H = (u: number, v: number): Pt => ({ u, v: hipV + v });
  // a low seat: the knees rise (the thigh tilts up, its length kept) so the shins stay near upright —
  // never the feet slid far forward
  const hipH = key + 72;
  const kneeAt = (len: number, dv: number): Pt => {
    const rise = Math.max(0, SHIN - (hipH - dv));
    return rise > 0 ? { u: Math.sqrt(Math.max(0, len * len - rise * rise)), v: -SHIN } : H(len, dv);
  };
  const kneeR = kneeAt(446, 12);
  const kneeL = kneeAt(428, 6);
  const onThigh = (k: Pt, t: number, up: number): Pt => {
    const hp = H(0, 0);
    const a = { u: hp.u + (k.u - hp.u) * t, v: hp.v + (k.v - hp.v) * t };
    const d = unit(sub(k, hp));
    return { u: a.u + d.v * up, v: a.v - d.u * up };
  };
  const footOf = (k: Pt, ahead: number): Pt => {
    const kh = -k.v; // the knee's height over the floor
    if (kh <= SHIN) return { u: k.u + ahead + Math.sqrt(Math.max(0, SHIN * SHIN - kh * kh)), v: 0 };
    return { u: k.u + ahead, v: -(kh - SHIN) }; // a high seat: the foot on the chair's footrest
  };
  const sR = H(12, -472);
  const sL = H(-2, -482);
  const wR = onThigh(kneeR, 0.53, 90);
  const wL = onThigh(kneeL, 0.5, 92);
  const pose: PlayerPose = {
    view: 'side',
    posture: 'seated',
    facing: 1,
    head: { c: H(34, -702), r: 110 },
    neck: H(16, -554),
    shoulderR: sR,
    shoulderL: sL,
    elbowR: elbowFor(sR, wR),
    elbowL: elbowFor(sL, wL),
    handR: { wrist: wR, dir: Math.atan2(kneeR.v - hipV, kneeR.u) + 0.04, kind: 'rest' },
    handL: { wrist: wL, dir: Math.atan2(kneeL.v - hipV, kneeL.u) + 0.04, kind: 'rest' },
    hipR: H(6, 2),
    hipL: H(-6, -2),
    kneeR,
    kneeL,
    footR: footOf(kneeR, 40),
    footL: footOf(kneeL, 28),
    floor: 0,
  };
  seatedPoses.set(key, pose);
  return pose;
}

/** The seated plan (the hands at rest on the thighs, palm down: the desk hand, restFlat). */
export const seatedSidePlan = (S: number, who: CastMember): SidePlan => sidePlan(seatedSidePose(S), { head: who.head, restR: 'restFlat', restL: 'restFlat', seatV: -Math.round(S / 5) * 5, body: who.body });

/** The ear's center in a plan. */
export const earOf = (plan: SidePlan): Pt => boxOf([plan.head.ear]).c;

/** The seat height (mm) that puts the person's ear `earMm` over the floor (clamped as before: 200–900). */
export function seatForEarV2(earMm: number, who: CastMember): number {
  const ref = 470;
  const e = -earOf(seatedSidePlan(ref, who)).v - ref; // the ear over the seat
  return Math.max(200, Math.min(900, earMm - e));
}

/** One arm, lite (lite.tsx ArmLite), with its hand (HandLite). */
function armLite(a: ArmPlan, L: CastMember['look'], P: Paint, key: string): ReactElement {
  const upper = <Path d={dClosed(a.upper)} fill={P.lin(L.MAT.shirt, a.upperAxis, 46)} />;
  const foreFill = P.lin(L.MAT.shirt, a.foreAxis, 38);
  const fore = (
    <G>
      <Path d={dClosed(a.foreSleeve)} fill={foreFill} />
      {a.mouth ? <Path d={dClosed(a.cuff)} fill={foreFill} /> : null}
    </G>
  );
  const inside = a.opening.toViewer && a.opening.rimFar ? <Path d={dEllipse(a.opening.e)} fill="#1d222c" /> : null;
  let hand: ReactElement | null = null;
  const h = a.placed;
  if (h) {
    // (artPaths: the visible wrist is the hand's first part, except on a flat hand that carries its forearm on)
    const flat = h.art.view === 'restFlat' || h.art.view === 'restFlatThumb' || h.art.view === 'restTop';
    const parts = [...(a.away || flat ? [] : [{ d: dClosed(a.wristSkin, 0.5), layer: 'back', poly: a.wristSkin, edge: null as Poly | null }]), ...h.parts.map((q) => ({ d: dClosed(q.placed, q.kind === 'palm' ? 0.45 : 0.5), layer: q.layer, poly: q.placed, edge: q.placedEdge }))];
    const b = boxOf(parts.map((q) => q.poly));
    const R = 56;
    const skin = P.ramp(L.HAND, [0, 0.35, 0.75, 1], { u: b.c.u - 0.32 * R, v: b.c.v - 0.95 * R }, { u: b.c.u + 0.32 * R, v: b.c.v + 0.95 * R });
    const ordered = [...parts.filter((q) => q.layer === 'back'), ...parts.filter((q) => q.layer === 'front')];
    hand = (
      <G>
        {/* the hand's one outline round the whole (the parts' strokes under their fills: only the outside half shows) */}
        {parts.map((q, i) => (
          <Path key={`o${i}`} d={q.d} fill="none" stroke={L.MAT.skin.edge} strokeWidth={1.8} opacity={0.5} />
        ))}
        {ordered.map((q, i) => (
          <Path key={`p${i}`} d={q.d} fill={skin} />
        ))}
        {h.gaps && h.gaps.length ? h.gaps.map((g, i) => <Path key={`g${i}`} d={dClosed(g)} fill={L.MAT.skin.deep} opacity={0.5} />) : null}
        {parts.map((q, i) => (q.edge ? <Path key={`e${i}`} d={dOpen(q.edge)} fill="none" stroke={L.MAT.skin.edge} strokeWidth={1} strokeLinecap="round" opacity={0.4} /> : null))}
      </G>
    );
  }
  const near = a.mouth ? <Path d={dOpen(a.opening.rimNear)} fill="none" stroke={L.MAT.shirt.form[1]} strokeWidth={7} strokeLinecap="round" /> : <Path d={dClosed(a.cuff, 0.3)} fill={P.lin(L.MAT.shirt, a.foreAxis, 38)} />;
  return a.away ? (
    <G key={key}>
      {inside}
      {hand}
      {fore}
      {near}
      {upper}
    </G>
  ) : (
    <G key={key}>
      {upper}
      {fore}
      {inside}
      {hand}
      {near}
    </G>
  );
}

/** The plan painted in profile (lite.tsx SideLite): the far leg and arm a value step down, then the near
 *  shoe and trousers, the neck and head, the shirt, belt and collar, the near arm. */
function sideLite(plan: SidePlan, who: CastMember, P: Paint, uid: string): ReactElement {
  const L = who.look;
  const Lg = plan.legs;
  const h = plan.head;
  const c = { u: (h.box.u0 + h.box.u1) / 2, v: (h.box.v0 + h.box.v1) / 2 };
  const R = (h.box.u1 - h.box.u0) / 2;
  const shoe = (s: SidePlan['shoes']['near']) => (
    <G>
      <Path d={dClosed(s.upper, 0.35)} fill={P.lin(L.MAT.leather, [s.heel, s.toe], 40)} />
      <Path d={dClosed(s.sole, 0.2)} fill={SOLE.bottom} />
    </G>
  );
  const legFar = P.lin(L.CLOTH, Lg.far.thighAxis, 70);
  const legNear = P.lin(L.CLOTH, Lg.near.thighAxis, 70);
  const torsoAxis: [Pt, Pt] = [plan.hip, plan.neck];
  const shirtD = dClosed(plan.shirt, 0.5);
  const seatD = dClosed(plan.seat, 0.5);
  // the far side, a value step down (lite FAR: × 0.74): its shapes again in black at 26 % as one layer
  const farShapes = [plan.shoes.far.upper, plan.shoes.far.sole, Lg.far.outline, Lg.far.lower, plan.arms.far.upper, plan.arms.far.foreSleeve, plan.arms.far.cuff, ...(plan.arms.far.placed ? plan.arms.far.placed.parts.map((q) => q.placed) : [])];
  const tucked = plan.dress?.tucked !== false;
  return (
    <G>
      <Defs>
        <ClipPath id={`${uid}cs`}>
          <Path d={shirtD} />
          <Path d={seatD} />
        </ClipPath>
        <ClipPath id={`${uid}ch`}>
          <Path d={shirtD} />
        </ClipPath>
      </Defs>
      {shoe(plan.shoes.far)}
      <Path d={dClosed(Lg.far.outline, 0.5)} fill={legFar} />
      <Path d={dClosed(Lg.far.lower, 0.4)} fill={legFar} />
      {armLite(plan.arms.far, L, P, 'far')}
      <G opacity={0.26}>
        {farShapes.map((q, i) => (
          <Path key={i} d={dClosed(q, 0.5)} fill="#000" />
        ))}
      </G>
      {shoe(plan.shoes.near)}
      <Path d={seatD} fill={legNear} />
      <Path d={dClosed(Lg.near.outline, 0.5)} fill={legNear} />
      <Path d={dClosed(Lg.near.lower, 0.4)} fill={legNear} />
      {/* the head */}
      <Path d={dClosed(h.neck, 0.5)} fill={P.round(L.HEAD_SKIN, c, R)} />
      <Path d={dClosed(h.skull, 0.5)} fill={P.round(L.HEAD_SKIN, c, R)} />
      <Path d={dClosed(h.eye, 0.45)} fill="#d6c8bd" opacity={0.62} />
      <Path d={dClosed(h.lid, 0.4)} fill={L.MAT.hair.edge} opacity={0.82} />
      <Path d={dClosed(h.brow, 0.5)} fill={L.MAT.hair.form[2]} opacity={0.78} />
      <Path d={dClosed(h.lips, 0.5)} fill={L.LIP} opacity={0.42} />
      {plan.dress ? <Path d={dClosed(h.lips, 0.5)} fill="#3a2016" opacity={0.2} /> : null}
      <Path d={dOpen(h.mouth)} fill="none" stroke={L.MAT.skin.deep} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <Path d={dClosed(h.hair, 0.45)} fill={P.ramp([L.MAT.hair.form[1], L.MAT.hair.form[2], L.MAT.hair.form[3]], null, { u: c.u + LIGHT.u * R, v: c.v + LIGHT.v * R }, { u: c.u - LIGHT.u * R, v: c.v - LIGHT.v * R })} />
      {h.earShows ? <Path d={dClosed(h.ear, 0.55)} fill={P.round(L.HEAD_SKIN, c, R)} /> : null}
      {/* the shirt, belt and collar */}
      <Path d={shirtD} fill={P.lin(L.MAT.shirt, torsoAxis, 120)} />
      <Path d={shirtD} fill="none" stroke={L.MAT.shirt.edge} strokeWidth={1} opacity={0.5} />
      {tucked ? (
        <G>
          <G clipPath={`url(#${uid}cs)`}>
            <Path d={dClosed(plan.belt, 0.35)} fill="#33251c" />
            <Path d={dClosed(plan.buckle, 0.2)} fill="#8b9099" />
          </G>
          <G clipPath={`url(#${uid}ch)`}>
            <Path d={dClosed(plan.blouse, 0.4)} fill={P.lin(L.MAT.shirt, torsoAxis, 120)} />
          </G>
        </G>
      ) : null}
      <Path d={dClosed(plan.collar, 0.5)} fill={P.lin(L.MAT.shirt, torsoAxis, 70)} />
      {armLite(plan.arms.near, L, P, 'near')}
    </G>
  );
}

/** The chair's two masses exactly as figureBodySvg's (its 'seat' tone: a 4-stop ramp across the box,
 *  the same Catmull-Rom outline, the same contour). Not a figure: unchanged in look. */
const SEAT_RAMP = ['#4a4c55', '#2e3036', '#1b1c21', '#0f1013'];
function ChairMass({ id, pts, w }: { id: string; pts: readonly (readonly [number, number])[]; w: number }) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const sink = svgPathSink();
  catmullInto(sink, pts, 1, true, 0.5);
  return (
    <G>
      <Defs>
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={Math.min(...xs)} y1={Math.min(...ys)} x2={Math.max(...xs)} y2={Math.max(...ys)}>
          {SEAT_RAMP.map((c, i) => (
            <Stop key={i} offset={[0, 0.38, 0.72, 1][i]} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <Path d={sink.d()} fill={`url(#${id})`} stroke="#08080a" strokeWidth={w} strokeLinejoin="round" />
    </G>
  );
}

/**
 * A seated cast member in PROFILE on a chair, at true size, placed by the EAR (the drop-in for
 * FigureSeatedSideSvg): the ear at (`earX`, `earY`), the floor at `floorY`, `px` caller units per mm,
 * `facing` −1 = the face toward −x. The seat follows the ear's height (as before); the forearms rest along
 * the thighs, the hands on them; the chair as before.
 */
export function PersonSeatedSideSvg({ earX, earY, floorY, px, who, facing = 1 }: { earX: number; earY: number; floorY: number; px: number; who: CastMember; facing?: 1 | -1 }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const earMm = (floorY - earY) / px;
  const S = Math.round(seatForEarV2(earMm, who) / 5) * 5;
  const art = useMemo(() => {
    const plan = seatedSidePlan(S, who);
    const P = paintOf(`ps${uid}`);
    const body = sideLite(plan, who, P, `ps${uid}`);
    return { ear: earOf(plan), body, defs: P.defs, foot: plan.shoes.near, knee: seatedSidePose(S).kneeR };
  }, [S, who, uid]);
  const seatTop = -S;
  // (the contour as the old figure's: about 0.8 px whatever the scale, at least 2.2 mm)
  const w = Math.max(0.8 / px, 2.2);
  const soleY = art.foot.sole.reduce((m, p) => Math.max(m, p.v), -Infinity);
  const footrest = soleY < -4;
  const toe = art.foot.sole.reduce((m, p) => Math.max(m, p.u), -Infinity);
  // the chair (as before: a 460 seat 30 thick, the backrest behind the back, two legs; a footrest when high)
  const chair = (
    <G>
      <Path d={`M-200 ${seatTop + 30} L-200 0 M200 ${seatTop + 30} L200 0`} stroke="#1b1c21" strokeWidth={26} strokeLinecap="round" />
      <Path d={`M-200 ${seatTop + 30} L-200 0 M200 ${seatTop + 30} L200 0`} stroke="#4a4c55" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
      {footrest ? <Path d={`M-200 ${soleY + 14} L${toe + 20} ${soleY + 14}`} stroke="#2e3036" strokeWidth={22} strokeLinecap="round" /> : null}
      <ChairMass id={`${uid}bk`} pts={[[-262, seatTop - 430], [-226, seatTop - 440], [-214, seatTop + 6], [-250, seatTop + 10]]} w={w} />
      <ChairMass id={`${uid}st`} pts={[[-236, seatTop], [236, seatTop - 4], [240, seatTop + 30], [-236, seatTop + 32]]} w={w} />
    </G>
  );
  return (
    <G transform={`translate(${earX} ${earY}) scale(${px * facing} ${px}) translate(${-art.ear.u} ${-art.ear.v})`}>
      <Defs>{art.defs}</Defs>
      {chair}
      {art.body}
    </G>
  );
}

/* ── FROM THE FRONT, STANDING (the EQ lab's camera analogy, Cable Install's person for scale) ── */

/** The cast member's front plan (figureV2/frontPlan.ts on the standing pose: the same plan the Skia
 *  PersonFrontV2 paints, FigureV2Front.tsx's personFrontPlan options). */
const frontPlans = new Map<string, FrontPlan>();
export function frontSvgPlan(who: CastMember): FrontPlan {
  const hit = frontPlans.get(who.id);
  if (hit) return hit;
  const F = frontPlan(FRONT_STANDING, { head: who.head, body: who.body, woman: who.woman });
  frontPlans.set(who.id, F);
  return F;
}

/** The front figure's crown (the top of the hair) and its floor, mm in its own frame. */
export function frontSvgExtents(who: CastMember): { top: number; floor: number } {
  const F = frontSvgPlan(who);
  return { top: Math.min(...F.head.skull.map((p) => p.v), ...F.head.hair.map((p) => p.v)), floor: FRONT_STANDING.floor ?? 1550 };
}

/** The front plan painted as FigureV2Front.tsx's LITE level (FigureV2FrontLite with HeadFrontLite). */
function frontLite(F: FrontPlan, who: CastMember, P: Paint, uid: string): ReactElement {
  const L = who.look;
  const ax = F.axis;
  const h = F.head;
  const R = h.r * 0.72;
  const shirtD = dClosed(F.shirt, 0.45);
  const seatD = dClosed(F.seat, 0.45);
  const legFill = P.lin(L.CLOTH, ax, 190);
  // the skull's inner rim (the head's sides turning away): the skull less itself scaled 0.86 × 0.93 about its box's center
  const sb = boxOf([h.skull]);
  const inner = h.skull.map((q) => ({ u: sb.c.u + (q.u - sb.c.u) * 0.86, v: sb.c.v + (q.v - sb.c.v) * 0.93 }));
  const hand = (a: FrontPlan['arms'][number], i: number) => {
    const parts = a.hand.parts.map((q) => ({ d: dClosed(q.placed, q.kind === 'palm' ? 0.45 : 0.5), poly: q.placed, edge: q.placedEdge }));
    const b = boxOf(parts.map((q) => q.poly));
    const skin = P.ramp(L.HAND, [0, 0.35, 0.75, 1], { u: b.c.u - 0.32 * 56, v: b.c.v - 0.95 * 56 }, { u: b.c.u + 0.32 * 56, v: b.c.v + 0.95 * 56 });
    return (
      <G key={`h${i}`}>
        {parts.map((q, j) => (
          <Path key={`o${j}`} d={q.d} fill="none" stroke={L.MAT.skin.edge} strokeWidth={1.8} opacity={0.5} />
        ))}
        {parts.map((q, j) => (
          <Path key={`p${j}`} d={q.d} fill={skin} />
        ))}
        {a.hand.gaps && a.hand.gaps.length ? a.hand.gaps.map((g, j) => <Path key={`g${j}`} d={dClosed(g)} fill={L.MAT.skin.deep} opacity={0.5} />) : null}
        {parts.map((q, j) => (q.edge ? <Path key={`e${j}`} d={dOpen(q.edge)} fill="none" stroke={L.MAT.skin.edge} strokeWidth={1} strokeLinecap="round" opacity={0.4} /> : null))}
      </G>
    );
  };
  return (
    <G>
      <Defs>
        <ClipPath id={`${uid}fcs`}>
          <Path d={shirtD} />
          <Path d={seatD} />
        </ClipPath>
        <ClipPath id={`${uid}fch`}>
          <Path d={shirtD} />
        </ClipPath>
      </Defs>
      {F.shoes.map((sh, i) => (
        <G key={`s${i}`}>
          <Path d={dClosed(sh.upper, 0.4)} fill={P.lin(L.MAT.leather, sh.axis, 30)} />
          <Path d={dClosed(sh.sole, 0.2)} fill={SOLE.bottom} />
        </G>
      ))}
      <Path d={seatD} fill={legFill} />
      {F.legs.map((l, i) => (
        <Path key={`l${i}`} d={dClosed(l.outline, 0.45)} fill={legFill} />
      ))}
      <Path d={dClosed(h.neck, 0.5)} fill={P.round(L.HEAD_SKIN, h.c, R)} />
      <Path d={shirtD} fill={P.lin(L.MAT.shirt, ax, 190)} />
      <Path d={shirtD} fill="none" stroke={L.MAT.shirt.edge} strokeWidth={1} opacity={0.5} />
      {F.placket ? <Path d={dOpen(F.placket)} fill="none" stroke={L.MAT.shirt.deep} strokeWidth={1.4} opacity={0.4} /> : null}
      {F.belt ? (
        <G clipPath={`url(#${uid}fcs)`}>
          <Path d={dClosed(F.belt, 0.3)} fill="#33251c" />
        </G>
      ) : null}
      {F.buckle ? <Path d={dClosed(F.buckle, 0.15)} fill="none" stroke="#8b9099" strokeWidth={4} /> : null}
      {F.blouse ? (
        <G clipPath={`url(#${uid}fch)`}>
          <Path d={dClosed(F.blouse, 0.4)} fill={P.lin(L.MAT.shirt, ax, 190)} />
        </G>
      ) : null}
      {F.collar.map((c, i) => (
        <Path key={`c${i}`} d={dClosed(c, 0.5)} fill={P.lin(L.MAT.shirt, ax, 80)} />
      ))}
      {/* the head (HeadFrontLite) */}
      {h.ears.map((e, i) => (
        <Path key={`e${i}`} d={dClosed(e, 0.55)} fill={P.round(L.HEAD_SKIN, h.c, R)} />
      ))}
      <Path d={dClosed(h.skull, 0.5)} fill={P.round(L.HEAD_SKIN, h.c, R)} />
      <Path d={dClosed(h.noseShade, 0.5)} fill={L.MAT.skin.deep} opacity={0.18} />
      <Path d={dClosed(h.skull, 0.5) + dClosed(inner, 0.5)} fill={L.MAT.skin.deep} fillRule="evenodd" opacity={0.14} />
      {h.sockets.map((e, i) => (
        <Path key={`so${i}`} d={dEllipse(e)} fill={L.MAT.skin.deep} opacity={0.14} />
      ))}
      {h.eyes.map((e, i) => (
        <Path key={`y${i}`} d={dClosed(e, 0.45)} fill="#d6c8bd" opacity={0.6} />
      ))}
      {h.irises.map((e, i) => (
        <Path key={`i${i}`} d={dEllipse(e)} fill="#2c1d16" opacity={0.85} />
      ))}
      {h.lids.map((e, i) => (
        <Path key={`li${i}`} d={dClosed(e, 0.4)} fill={L.MAT.hair.edge} opacity={0.85} />
      ))}
      {h.brows.map((e, i) => (
        <Path key={`b${i}`} d={dClosed(e, 0.5)} fill={L.MAT.hair.form[2]} opacity={0.8} />
      ))}
      <Path d={dClosed(h.upperLip, 0.4)} fill={L.LIP} opacity={0.5} />
      <Path d={dClosed(h.lowerLip, 0.45)} fill={L.LIP} opacity={0.4} />
      <Path d={dOpen(h.mouth)} fill="none" stroke={L.MAT.skin.deep} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <Path d={dClosed(h.hair, 0.45)} fill={P.ramp([L.MAT.hair.form[1], L.MAT.hair.form[2], L.MAT.hair.form[3]], null, { u: h.c.u + LIGHT.u * h.r, v: h.c.v + LIGHT.v * h.r }, { u: h.c.u - LIGHT.u * h.r, v: h.c.v - LIGHT.v * h.r })} />
      {/* the arms: one sleeve, the hand, the cuff */}
      {F.arms.map((a, i) => (
        <G key={`a${i}`}>
          <Path d={dClosed(a.sleeve, 0.45)} fill={P.lin(L.MAT.shirt, a.upperAxis, 44)} />
          {hand(a, i)}
          <Path d={dClosed(a.cuff, 0.3)} fill={P.lin(L.MAT.shirt, a.foreAxis, 34)} />
        </G>
      ))}
    </G>
  );
}

/**
 * A cast member STANDING, FROM THE FRONT, in SVG: the feet's center at (`cx`, `floorY`), drawn `heightMm`
 * tall (crown to floor: the old figure's own height, so every proportion the learner compares stays) at
 * `px` caller units per mm. The drop-in for FigureStandingFrontSvg / PersonScale.
 */
export function PersonFrontSvg({ cx, floorY, px, who, heightMm = 1745, shadow = true }: { cx: number; floorY: number; px: number; who: CastMember; heightMm?: number; shadow?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const art = useMemo(() => {
    const F = frontSvgPlan(who);
    const P = paintOf(`pf${uid}`);
    const body = frontLite(F, who, P, `pf${uid}`);
    return { body, defs: P.defs };
  }, [who, uid]);
  const e = frontSvgExtents(who);
  const k = (heightMm / (e.floor - e.top)) * px;
  return (
    <G transform={`translate(${cx} ${floorY}) scale(${k}) translate(0 ${-e.floor})`}>
      <Defs>{art.defs}</Defs>
      {shadow ? <Path d={dEllipse({ c: { u: 0, v: e.floor }, rx: 200, ry: 22, rot: 0 })} fill="#000" opacity={0.45} /> : null}
      {art.body}
    </G>
  );
}
