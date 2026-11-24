/**
 * FIGURE V2 — AN ARM WHOSE FIST IS CLOSED ROUND SOMETHING (builder "Foley3",
 * 2026-11-24): the boom operator's pole (F02, F08) and the jacket's gathered
 * shoulder (F02). The same drawing as the wave-4 boom operator's arm
 * (BoomV2.BoomArmArt — approved pieces only, that file another builder's and
 * these pieces not exported from it, so copied here unchanged):
 *   • the approved sleeve (FigureV2Side.Arm, or ArmLite at lesson sizes);
 *   • the approved 3-D power grip (heldHandV2.HeldHand: what it holds painted
 *     between the hand's parts behind it and in front of it — the fingers
 *     round one side, the thumb round the other);
 *   • the knuckle row where the back of the hand faces the viewer (one low
 *     broad band of light along the knuckles inside the one edge — softened
 *     from BoomV2's four ovals, which read as a row of bumps at 3× — the
 *     shallow valleys, the creases opening from the tips);
 *   • THE SLEEVE GROWS OUT OF THE SHOULDER: drawn only on the arm's side of a
 *     line across the shoulder, its root fading into the shirt over its first
 *     few cm — one cloth form, no ball at the shoulder.
 */
import type { ReactNode } from 'react';
import { ColorMatrix, Group, LinearGradient, Paint, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Arm, FAR_DIM, FAR_SKIN_DIM, type Torso } from '../figureV2/FigureV2Side';
import { ArmLite } from '../figureV2/lite';
import { armPaths, type SkPath } from '../figureV2/paths.ts';
import type { ArmPlan } from '../figureV2/sidePlan.ts';
import { Blur, levelOf, useFigureScale } from '../figureV2/detail';
import { useLook } from '../figureV2/look';
import { HeldHand, gripSilhouette } from '../figureV2/heldHandV2';

/** (for a lesson's own held piece: the fist's outline, so the lesson never reaches the held-hand renderers) */
export { gripSilhouette };
import type { BoomArmPlan } from '../figureV2/BoomV2';
import type { BoomHandPlan } from '../figureV2/boomGrip.ts';
import type { Pt } from '../figureV2/geom.ts';
import { placeGrip, type PlacedGrip, type V3 } from '../figureV2/heldHands.ts';

const dimLayer = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

/** A metal pole piece (≈ 30 mm), its lit edge (BoomV2.PoleSeg). */
export function PoleSegV2({ a, b, proj }: { a: V3; b: V3; proj: (p: V3) => Pt }) {
  const p = Skia.Path.Make();
  const A = proj(a);
  const B = proj(b);
  p.moveTo(A.u, A.v);
  p.lineTo(B.u, B.v);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={33} strokeCap="round" color="#0b0c0f" />
      <Path path={p} style="stroke" strokeWidth={29} strokeCap="round" color="#3a3d45" />
      <Group transform={[{ translateX: -1.5 }, { translateY: -2 }]}>
        <Path path={p} style="stroke" strokeWidth={6} strokeCap="round" color="#d4d8e0" opacity={0.45} />
      </Group>
    </Group>
  );
}

/** The knuckle row on the back of a power-grip fist (BoomV2.KnuckleRow; Foley3: the swells drawn as ONE broad
 *  soft band of light along the knuckles, rising and falling gently, never four separate round spots — at 3× the
 *  four ovals read as a row of equal bumps). */
export function KnuckleRowV2({ hp }: { hp: BoomHandPlan }) {
  const { MAT } = useLook();
  const v = hp.grip.view.toward;
  if (v.n < 0.15) return null;
  const ks = hp.grip.model.knuckles;
  const sil = gripSilhouette(hp.grip);
  const swell = Skia.Path.Make();
  const valley = Skia.Path.Make();
  const cs = ks.map((k) => hp.toPage({ u: k.c.u - 2, w: k.c.w, n: k.c.n + 6 }));
  cs.forEach((c, i) => {
    if (i === 0) swell.moveTo(c.u, c.v);
    else swell.quadTo(cs[i - 1].u, cs[i - 1].v, (cs[i - 1].u + c.u) / 2, (cs[i - 1].v + c.v) / 2);
    if (i === cs.length - 1) swell.lineTo(c.u, c.v);
  });
  ks.forEach((k, i) => {
    if (i < ks.length - 1) {
      const n = ks[i + 1];
      const m = hp.toPage({ u: (k.c.u + n.c.u) / 2 - 6, w: (k.c.w + n.c.w) / 2, n: (k.c.n + n.c.n) / 2 + 8 });
      valley.addOval(Skia.XYWHRect(m.u - 2.5, m.v - 5, 5, 10));
    }
  });
  const v3 = hp.grip.view.toward;
  const fs = hp.grip.model.fingers;
  const tilt = hp.grip.model.tilt;
  const crease = Skia.Path.Make();
  const creaseTip = Skia.Path.Make();
  for (let i = 0; i < fs.length - 1; i++) {
    const a = fs[i];
    const b = fs[i + 1];
    const seam = a.pts.map((p, j) => {
      const q = b.pts[j];
      const w = (p.w + q.w) / 2;
      const ru = (p.u + q.u) / 2 - w * tilt;
      const rn = (p.n + q.n) / 2;
      const rl = Math.hypot(ru, rn) || 1;
      const r = (a.r[j] + b.r[j]) / 2;
      const s = { u: w * tilt + (ru / rl) * (rl + r * 0.6), w, n: (rn / rl) * (rl + r * 0.6) };
      return { s, faces: (ru / rl) * v3.u + (rn / rl) * v3.n > 0.12 };
    });
    let end = -1;
    for (let j = seam.length - 1; j >= 0; j--)
      if (seam[j].faces) {
        end = j;
        break;
      }
    if (end < 1) continue;
    let start = end;
    while (start > 0 && seam[start - 1].faces) start--;
    if (start === end) continue;
    const P = seam.slice(start, end + 1).map((x) => hp.toPage(x.s));
    crease.moveTo(P[P.length - 1].u, P[P.length - 1].v);
    for (let j = P.length - 2; j >= 0; j--) crease.lineTo(P[j].u, P[j].v);
    const t0 = P[P.length - 1];
    const t1 = P[P.length - 2];
    creaseTip.moveTo(t0.u, t0.v);
    creaseTip.lineTo(t0.u + (t1.u - t0.u) * 0.45, t0.v + (t1.v - t0.v) * 0.45);
  }
  return (
    <Group clip={sil}>
      <Path path={swell} style="stroke" strokeWidth={13} strokeCap="round" strokeJoin="round" color={MAT.skin.rim} opacity={0.26}>
        <Blur mm={3.2} />
      </Path>
      <Path path={valley} color={MAT.skin.deep} opacity={0.18}>
        <Blur mm={2} />
      </Path>
      <Path path={crease} style="stroke" strokeWidth={1.3} strokeCap="round" strokeJoin="round" color={MAT.skin.deep} opacity={0.3}>
        <Blur mm={0.6} />
      </Path>
      <Path path={creaseTip} style="stroke" strokeWidth={2.2} strokeCap="round" color={MAT.skin.deep} opacity={0.34}>
        <Blur mm={0.7} />
      </Path>
    </Group>
  );
}

/**
 * (review 2026-11-24: a fist seen from its fingers' side read as "a mitten lump with three dimple marks") The
 * fingers told apart where they face the viewer: a soft crease along each seam between neighbouring fingers, from
 * the tip (or the bend round the pole) back along the visible stretch — lines, never dots; inside the fist.
 */
export function FingerCreasesV2({ hp, sil }: { hp: BoomHandPlan; sil: SkPath }) {
  const { MAT } = useLook();
  const v3 = hp.grip.view.toward;
  const fs = hp.grip.model.fingers;
  const tilt = hp.grip.model.tilt;
  const crease = Skia.Path.Make();
  for (let i = 0; i < fs.length - 1; i++) {
    const a = fs[i];
    const b = fs[i + 1];
    const seam = a.pts.map((p, j) => {
      const q = b.pts[j];
      const w = (p.w + q.w) / 2;
      const ru = (p.u + q.u) / 2 - w * tilt;
      const rn = (p.n + q.n) / 2;
      const rl = Math.hypot(ru, rn) || 1;
      const r = (a.r[j] + b.r[j]) / 2;
      const s = { u: w * tilt + (ru / rl) * (rl + r * 0.7), w, n: (rn / rl) * (rl + r * 0.7) };
      return { s, faces: (ru / rl) * v3.u + (rn / rl) * v3.n > 0.35 };
    });
    let end = -1;
    for (let j = seam.length - 1; j >= 0; j--)
      if (seam[j].faces) {
        end = j;
        break;
      }
    if (end < 1) continue;
    // (the visible stretch nearest the tips, back along the finger while it runs on the same way on the page —
    // a seam that folds back on itself in the view, seen end-on round the curl, stops there: never a zigzag)
    const P = [hp.toPage(seam[end].s), hp.toPage(seam[end - 1].s)];
    for (let j = end - 2; j >= 0 && seam[j].faces; j--) {
      const q = hp.toPage(seam[j].s);
      const a = P[P.length - 2];
      const b = P[P.length - 1];
      const d1 = { u: b.u - a.u, v: b.v - a.v };
      const d2 = { u: q.u - b.u, v: q.v - b.v };
      const c = (d1.u * d2.u + d1.v * d2.v) / ((Math.hypot(d1.u, d1.v) || 1) * (Math.hypot(d2.u, d2.v) || 1));
      if (c < 0.6) break;
      P.push(q);
    }
    // (a seam seen almost end-on draws no crease: a dot or a tick would read as a dimple)
    let len = 0;
    for (let j = 1; j < P.length; j++) len += Math.hypot(P[j].u - P[j - 1].u, P[j].v - P[j - 1].v);
    if (len < 14) continue;
    crease.moveTo(P[0].u, P[0].v);
    for (let j = 1; j < P.length; j++) crease.lineTo(P[j].u, P[j].v);
  }
  return (
    <Group clip={sil}>
      <Path path={crease} style="stroke" strokeWidth={1.4} strokeCap="round" strokeJoin="round" color={MAT.skin.deep} opacity={0.34}>
        <Blur mm={0.7} />
      </Path>
    </Group>
  );
}

/** The sleeve's root at the shoulder (BoomV2.shoulderRoot, unchanged). */
const ROOT_FADE = 34;
function shoulderRoot(a: ArmPlan, t: Torso): { clip: SkPath; behindOff: SkPath; plane: SkPath; from: Pt; to: Pt } {
  const s = a.shoulder;
  const ux = a.elbow.u - s.u;
  const uy = a.elbow.v - s.v;
  const L = Math.hypot(ux, uy) || 1;
  const du = { u: ux / L, v: uy / L };
  const n = { u: -du.v, v: du.u };
  const back = 6;
  const far = 5000;
  const o = { u: s.u - du.u * back, v: s.v - du.v * back };
  const half = Skia.Path.Make();
  half.moveTo(o.u + n.u * far, o.v + n.v * far);
  half.lineTo(o.u + n.u * far + du.u * far, o.v + n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far + du.u * far, o.v - n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far, o.v - n.v * far);
  half.close();
  const plane = Skia.Path.Make();
  plane.addRect(Skia.XYWHRect(s.u - far, s.v - far, 2 * far, 2 * far));
  const behind = Skia.Path.MakeFromOp(plane, half, PathOp.Difference) ?? Skia.Path.Make();
  return {
    clip: Skia.Path.MakeFromOp(half, t.body, PathOp.Union) ?? half,
    behindOff: Skia.Path.MakeFromOp(behind, t.body, PathOp.Difference) ?? behind,
    plane,
    from: o,
    to: { u: o.u + du.u * ROOT_FADE, v: o.v + du.v * ROOT_FADE },
  };
}

/**
 * (review 2026-11-24: the boom's front hand "a mitten lump on the pole with three dimple marks", the rear "a block
 * with a row of knuckle bumps", the jacket's fists "mittens") The same 3-D grip placed again in the ARM views' own
 * manner (heldHands placeGrip `back`, as the conductor's baton hand and the players' hands): the knuckles low broad
 * swells in the one edge, the fingers told apart by creases opening from the tips — no separate knuckle ovals.
 * Built in the hand's own frame (u wrist → knuckles, w toward the thumb, n palm → back), drawn through the plan's
 * own page map, so the hand stays exactly where it was.
 */
const regripCache = new WeakMap<BoomHandPlan, PlacedGrip>();
export function armViewGrip(hp: BoomHandPlan, opening: Pt): PlacedGrip {
  const hit = regripCache.get(hp);
  if (hit) return hit;
  const g = hp.grip;
  const b = g.frame.beta;
  const t = g.view.toward;
  // (gripFrame rebuilds U = x, W = y and N = W × U = −z from these: the model's n is the frame's −z)
  const fr = { f: { x: 1, y: 0, z: 0 }, h: { x: Math.sin(b), y: Math.cos(b), z: 0 }, d: { x: 0, y: 0, z: -1 } };
  const out = placeGrip({ x: 0, y: 0, z: 0 }, fr, { x: t.u, y: t.w, z: -t.n }, (p) => hp.toPage({ u: p.x, w: p.y, n: -p.z }), g.model.R, { wristFrom2: opening, back: true });
  regripCache.set(hp, out);
  return out;
}

/** One arm with its fist round what it holds (`held`, painted between the hand's back and front parts). */
export function GripArmV2({ ap, torso, held }: { ap: BoomArmPlan; torso: Torso; held: ReactNode }) {
  const v = useFigureScale();
  const lite = levelOf({ ptPerMm: v.ptPerMm ?? null, level: v.level }) === 'lite';
  const P = armPaths(ap.arm, (p) => ({ u: p.x, v: p.y, d: p.z }));
  const { e, out } = ap.arm.opening;
  const grip = armViewGrip(ap.hand, { u: e.c.u + out.u * 2, v: e.c.v + out.v * 2 });
  const hand = (
    <Group>
      <HeldHand h={grip} mic={held} />
      {lite ? null : <FingerCreasesV2 hp={ap.hand} sil={gripSilhouette(grip)} />}
    </Group>
  );
  const root = shoulderRoot(ap.arm, torso);
  if (lite)
    return (
      <Group layer={ap.far ? dimLayer(FAR_DIM) : undefined} clip={root.clip}>
        <ArmLite a={ap.arm} P={P} stick={hand} />
      </Group>
    );
  return (
    <Group layer={<Paint />}>
      <Arm a={ap.arm} P={P} t={torso} stick={hand} cloth={ap.far ? dimLayer(FAR_DIM) : undefined} skin={ap.far ? dimLayer(FAR_SKIN_DIM) : undefined} />
      <Path path={root.behindOff} color="black" blendMode="dstOut" />
      <Group clip={torso.body}>
        <Path path={root.plane} blendMode="dstOut">
          <LinearGradient start={vec(root.from.u, root.from.v)} end={vec(root.to.u, root.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
    </Group>
  );
}
