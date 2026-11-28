/**
 * FIGURE V2 — THE JACKET, DRAWN (wave 3 of D78, piece 2; the plan:
 * jacketPlan.ts). Wool cloth in the person's own jacket tone (cast.ts
 * look.JACKET), lit as the shirt is (the torso's one light, the sleeve's own
 * cylinder light fading in below the shoulder and again below the elbow), in
 * the figure's depth order (personV2 passes each piece to its place):
 *   far sleeve (a value step down, behind the body) → … → the shirt, its
 *   collar → THE BODY (its soft shadow on the shirt in the V, the cloth, the
 *   lapel and collar turned back with their cut edge and notch, the fold's
 *   rolled edge, the button, a pocket line at full detail) → the near arm →
 *   THE NEAR SLEEVE (ending short of the shirt's cuff, its rim and its soft
 *   shadow on the cuff).
 * Lite (lesson sizes): the same masses, one gradient each, the lapel's face
 * and cut edge, the collar's notch and the button kept — so it reads as a
 * jacket, not a stripe. Every path built once per plan.
 */
import type { ReactNode } from 'react';
import { ColorMatrix, Group, LinearGradient, Mask, Paint, Path, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { LIGHT, lerp, type Pt } from './geom.ts';
import type { Material } from './palette.ts';
import { Folds, Form, Soft, across } from './paint';
import { ellipsePath, op, smoothClosed, smoothOpen, type SkPath } from './paths.ts';
import { PathOp } from '@shopify/react-native-skia';
import type { JacketSidePlan, JacketSleevePlan, JacketTopPlan } from './jacketPlan.ts';
import { useLook } from './look';

/** A jacket tone when a look has none (a dark neutral navy). */
export const JACKET_DEFAULT: Material = { form: ['#5f6a86', '#48526c', '#353d53', '#1f2435', '#2b3246'], pos: [0, 0.2, 0.52, 0.8, 1], rim: '#9aa6c0', edge: '#0b0d14', deep: '#080a10' };

const useJacket = (): Material => useLook().JACKET ?? JACKET_DEFAULT;

const dim = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);
/** The far side's value step (as FigureV2Side.FAR_DIM). */
export const JACKET_FAR = dim(0.74);

/* ── paths ── */

export type SleevePaths = { outline: SkPath; endRim: SkPath; folds: SkPath; armhole: SkPath | null; endShade: SkPath };
export type JacketSidePaths = { body: SkPath; face: SkPath; cutEdge: SkPath; fold: SkPath; notch: SkPath; button: SkPath; pocket: SkPath; hem: SkPath; folds: SkPath; near: SleevePaths; far: SleevePaths; nearShadow: SkPath };

const many = (ps: readonly Pt[][]) => {
  const p = smoothClosed(ps[0] ?? [], 0.5);
  for (let i = 1; i < ps.length; i++) p.addPath(smoothClosed(ps[i], 0.5));
  return p;
};

function sleevePaths(s: JacketSleevePlan): SleevePaths {
  return {
    outline: smoothClosed(s.outline, 0.4),
    endRim: smoothOpen(s.endRim),
    folds: many(s.folds),
    armhole: null,
    endShade: ellipsePath({ c: { u: s.end.u + s.df.u * 7, v: s.end.v + s.df.v * 7 }, rx: 7, ry: s.endR * 0.95, rot: Math.atan2(s.df.v, s.df.u) }),
  };
}

const sideCache = new WeakMap<JacketSidePlan, JacketSidePaths>();
export function jacketSidePaths(J: JacketSidePlan): JacketSidePaths {
  const hit = sideCache.get(J);
  if (hit) return hit;
  const body = smoothClosed(J.body, 0.45);
  const near = sleevePaths(J.sleeves.near);
  const shadow = near.outline.copy();
  shadow.offset(-LIGHT.u * 22, -LIGHT.v * 22);
  const out: JacketSidePaths = {
    body,
    face: op(smoothClosed(J.face, 0.4), body, PathOp.Intersect),
    cutEdge: smoothOpen(J.cutEdge),
    fold: smoothOpen(J.fold),
    notch: smoothClosed(J.notch, 0.2),
    button: ellipsePath(J.button),
    pocket: smoothOpen(J.pocket),
    hem: smoothOpen(J.hem),
    folds: many(J.folds),
    near,
    far: sleevePaths(J.sleeves.far),
    nearShadow: op(shadow, body, PathOp.Intersect),
  };
  sideCache.set(J, out);
  return out;
}

const coverCache = new WeakMap<SkPath, WeakMap<SkPath, SkPath>>();
/** The shirt's upper sleeve inside the jacket's body (memoised per pair of paths). */
export function coverOf(shirtUpper: SkPath, body: SkPath): SkPath {
  let m = coverCache.get(body);
  if (!m) {
    m = new WeakMap();
    coverCache.set(body, m);
  }
  let c = m.get(shirtUpper);
  if (!c) {
    c = op(shirtUpper, body, PathOp.Intersect);
    m.set(shirtUpper, c);
  }
  return c;
}

export type JacketTopPaths = { slab: SkPath; lapels: SkPath; collar: SkPath; near: SleevePaths | null; far: SleevePaths | null };
const topCache = new WeakMap<JacketTopPlan, JacketTopPaths>();
export function jacketTopPaths(J: JacketTopPlan): JacketTopPaths {
  const hit = topCache.get(J);
  if (hit) return hit;
  const out: JacketTopPaths = {
    slab: smoothClosed(J.slab, 0.4),
    lapels: many(J.lapels),
    collar: smoothClosed(J.collar, 0.4),
    near: J.sleeves ? sleevePaths(J.sleeves.near) : null,
    far: J.sleeves ? sleevePaths(J.sleeves.far) : null,
  };
  topCache.set(J, out);
  return out;
}

/* ── the cloth's light ── */

/** The jacket's own light on the torso (the form across its axis and the fall-off), on any path. */
function ClothLight({ path, axis, box, mat }: { path: SkPath; axis: [Pt, Pt]; box: { x: number; y: number; width: number; height: number }; mat: Material }) {
  const [s, e] = across(axis[0], axis[1], 125);
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={mat.form} positions={mat.pos} />
      </Path>
      <Path path={path}>
        <LinearGradient start={vec(box.x, box.y)} end={vec(box.x + box.width, box.y + box.height)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)']} />
      </Path>
    </Group>
  );
}

const boxOf = (p: SkPath) => {
  const b = p.getBounds();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
};

/* ── full detail ── */

/** THE BODY, side view: over the shirt and its collar. `shirt`: the shirt's path (the V's shadow falls on it). */
export function JacketSideBody({ J, shirt, pocket = true }: { J: JacketSidePlan; shirt: SkPath; pocket?: boolean }) {
  const M = useJacket();
  const P = jacketSidePaths(J);
  const box = boxOf(P.body);
  return (
    <Group>
      {/* the jacket's soft shadow on the shirt showing in the V */}
      <Group clip={shirt}>
        <Group transform={[{ translateX: -LIGHT.u * 5 }, { translateY: -LIGHT.v * 5 }]}>
          <Path path={P.body} color="#000" opacity={0.42}>
            <Blur mm={3} />
          </Path>
        </Group>
      </Group>
      <ClothLight path={P.body} axis={J.axis} box={box} mat={M} />
      <Group clip={P.body}>
        {/* the near sleeve's shadow on the body (the arm moved away from the light) */}
        <Soft path={P.nearShadow} color={M.deep} opacity={0.4} blur={12} />
        <Folds path={P.folds} mat={M} opacity={0.5} />
        {/* the lapel and collar turned back: they stand a little off the body (a thin shadow under the cut
            edge) and face up toward the light a little more */}
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={P.face} color={M.deep} opacity={0.5}>
            <Blur mm={2.2} />
          </Path>
        </Group>
        <ClothLight path={P.face} axis={J.axis} box={box} mat={M} />
        <Path path={P.face} color={M.rim} opacity={0.13} />
        <Path path={P.cutEdge} style="stroke" strokeWidth={1.2} strokeJoin="round" strokeCap="round" color={M.edge} opacity={0.75} />
        <Path path={P.notch} color={M.deep} opacity={0.9} />
        {/* the fold's rolled edge, lit along its thickness */}
        <Group transform={[{ translateX: LIGHT.u * 1.8 }, { translateY: LIGHT.v * 1.8 }]}>
          <Path path={P.fold} style="stroke" strokeWidth={2.6} strokeCap="round" color={M.rim} opacity={0.26}>
            <Blur mm={0.8} />
          </Path>
        </Group>
        {pocket ? (
          <Group>
            <Path path={P.pocket} style="stroke" strokeWidth={1.6} strokeCap="round" color={M.deep} opacity={0.6} />
            <Group transform={[{ translateX: LIGHT.u * 1.4 }, { translateY: LIGHT.v * 1.4 }]}>
              <Path path={P.pocket} style="stroke" strokeWidth={1} strokeCap="round" color={M.rim} opacity={0.22} />
            </Group>
          </Group>
        ) : null}
        {/* the hem's turned edge */}
        <Group transform={[{ translateX: LIGHT.u * 2 }, { translateY: LIGHT.v * 2 }]}>
          <Path path={P.hem} style="stroke" strokeWidth={2} strokeCap="round" color={M.rim} opacity={0.14} />
        </Group>
      </Group>
      {/* the button, seen edge-on at the front: a small dark form, a glint on its lit side */}
      <Path path={P.button} color="#121317" />
      <Group transform={[{ translateX: LIGHT.u * 1.2 }, { translateY: LIGHT.v * 1.6 }, { scale: 1 }]}>
        <Path path={P.button} style="stroke" strokeWidth={0.7} color={M.rim} opacity={0.3} />
      </Group>
      <Path path={P.body} style="stroke" strokeWidth={1} strokeJoin="round" color={M.edge} opacity={0.6} />
      {/* the fold's own edge over the shirt (the V's side) */}
      <Path path={P.fold} style="stroke" strokeWidth={1.1} strokeCap="round" color={M.edge} opacity={0.6} />
    </Group>
  );
}

/** A SLEEVE (side or above): the body's light at the shoulder, the arm's own light fading in down the
 *  upper arm and again below the elbow; its folds; its end's rim and its soft shadow on the shirt's cuff
 *  (`cuff`). Its outline only where it is the silhouette (`body`). */
export function JacketSleeve({ s, P, axis, bodyBox, body, cuff, behind, cover }: { s: JacketSleevePlan; P: SleevePaths; axis: [Pt, Pt]; bodyBox: { x: number; y: number; width: number; height: number }; body: SkPath; cuff?: SkPath | null; /** the far sleeve passing behind the body: the body's soft occlusion shadow on it */ behind?: { dx: number }; /** the shirt's own sleeve where it lies over the jacket's body (painted after it): covered again with the
   *  jacket's body cloth, in the body's own light, so no shirt shows round the jacket's shoulder */ cover?: SkPath | null }) {
  const M = useJacket();
  const f0 = lerp(s.root, s.elbow, 0.1);
  const f1 = lerp(s.root, s.elbow, 0.55);
  const e0 = lerp(s.elbow, s.root, 0.12);
  const e1 = lerp(s.elbow, s.end, 0.3);
  const fade = (a: Pt, b: Pt) => (
    <Path path={P.outline}>
      <LinearGradient start={vec(a.u, a.v)} end={vec(b.u, b.v)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']} />
    </Path>
  );
  return (
    <Group>
      {cover ? <ClothLight path={cover} axis={axis} box={bodyBox} mat={M} /> : null}
      {cuff ? (
        <Group clip={cuff}>
          <Path path={P.endShade} color="#000" opacity={0.4}>
            <Blur mm={2.6} />
          </Path>
        </Group>
      ) : null}
      <ClothLight path={P.outline} axis={axis} box={bodyBox} mat={M} />
      <Mask mode="alpha" mask={fade(f0, f1)}>
        <Form path={P.outline} mat={M} axis={s.upperAxis} w={52} rim={6} edge={0} />
      </Mask>
      <Mask mode="alpha" mask={fade(e0, e1)}>
        <Form path={P.outline} mat={M} axis={s.foreAxis} w={44} rim={5} edge={0} />
      </Mask>
      <Group clip={P.outline}>
        <Folds path={P.folds} mat={M} opacity={0.55} />
        {behind ? (
          <Group transform={[{ translateX: behind.dx }]}>
            <Soft path={body} color={M.deep} opacity={0.5} blur={8} />
          </Group>
        ) : null}
      </Group>
      {/* the end: the cloth's rim, lit along its thickness */}
      <Path path={P.endRim} style="stroke" strokeWidth={3} strokeCap="round" color={M.rim} opacity={0.18}>
        <Blur mm={0.7} />
      </Path>
      <Path path={P.endRim} style="stroke" strokeWidth={1.2} strokeCap="round" color={M.edge} opacity={0.8} />
      <Group clip={body} invertClip>
        <Path path={P.outline} style="stroke" strokeWidth={1} strokeJoin="round" color={M.edge} opacity={0.55} />
      </Group>
    </Group>
  );
}

/** From above: the slab (the shoulders squarer), the lapels as a V with the shirt showing in it, the
 *  collar round the neck (painted before the head). */
export function JacketTopBody({ J }: { J: JacketTopPlan }) {
  const M = useJacket();
  const P = jacketTopPaths(J);
  const box = boxOf(P.slab);
  return (
    <Group>
      <ClothLight path={P.slab} axis={J.axis} box={box} mat={M} />
      <Group clip={P.slab}>
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={P.lapels} color={M.deep} opacity={0.5}>
            <Blur mm={2.2} />
          </Path>
        </Group>
      </Group>
      <ClothLight path={P.lapels} axis={J.axis} box={box} mat={M} />
      <Path path={P.lapels} color={M.rim} opacity={0.13} />
      <Path path={P.lapels} style="stroke" strokeWidth={1.1} strokeJoin="round" color={M.edge} opacity={0.7} />
      <Form path={P.collar} mat={M} round={{ c: lerp(J.axis[0], J.axis[1], 0.47), r: 100 }} rim={3} edge={1} />
      <Path path={P.slab} style="stroke" strokeWidth={1} strokeJoin="round" color={M.edge} opacity={0.6} />
    </Group>
  );
}

/* ── lite (lesson sizes) ── */

function MLite({ path, mat, axis, w }: { path: SkPath; mat: Material; axis: [Pt, Pt]; w: number }) {
  const [s, e] = across(axis[0], axis[1], w);
  return (
    <Path path={path}>
      <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={mat.form} positions={mat.pos} />
    </Path>
  );
}

export function JacketSideBodyLite({ J }: { J: JacketSidePlan }) {
  const M = useJacket();
  const P = jacketSidePaths(J);
  return (
    <Group>
      <MLite path={P.body} mat={M} axis={J.axis} w={125} />
      <Path path={P.face} color={M.rim} opacity={0.16} />
      <Path path={P.cutEdge} style="stroke" strokeWidth={1.4} strokeJoin="round" color={M.edge} opacity={0.8} />
      <Path path={P.notch} color={M.deep} />
      <Path path={P.button} color="#15161a" />
      <Path path={P.body} style="stroke" strokeWidth={1} strokeJoin="round" color={M.edge} opacity={0.6} />
    </Group>
  );
}

export function JacketSleeveLite({ s, P, cover, axis }: { s: JacketSleevePlan; P: SleevePaths; /** (as JacketSleeve) */ cover?: SkPath | null; axis?: [Pt, Pt] }) {
  const M = useJacket();
  return (
    <Group>
      {cover && axis ? <MLite path={cover} mat={M} axis={axis} w={125} /> : null}
      <MLite path={P.outline} mat={M} axis={s.foreAxis} w={44} />
      <Path path={P.endRim} style="stroke" strokeWidth={1.2} strokeCap="round" color={M.edge} opacity={0.8} />
    </Group>
  );
}

export function JacketTopBodyLite({ J }: { J: JacketTopPlan }) {
  const M = useJacket();
  const P = jacketTopPaths(J);
  return (
    <Group>
      <MLite path={P.slab} mat={M} axis={J.axis} w={125} />
      <Path path={P.lapels} color={M.rim} opacity={0.16} />
      <Path path={P.lapels} style="stroke" strokeWidth={1.2} color={M.edge} opacity={0.75} />
      <MLite path={P.collar} mat={M} axis={J.axis} w={125} />
      <Path path={P.slab} style="stroke" strokeWidth={1} color={M.edge} opacity={0.6} />
    </Group>
  );
}

/** (the far sleeve in its value step) */
export function Far({ children }: { children: ReactNode }) {
  return <Group layer={JACKET_FAR}>{children}</Group>;
}
