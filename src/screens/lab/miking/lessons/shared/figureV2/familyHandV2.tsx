/**
 * FIGURE V2 — A POSED 3-D HAND, DRAWN (wave 5 of D78; the parts:
 * familyHand.ts). The approved hands' own paint (heldHandV2 / paint.tsx
 * ArtPart, the same numbers): the person's one hand light from above, each
 * form turning across its axis, a soft lit rim, a digit's soft cast shadow on
 * what lies under it, the knuckles' low swells, faint nails; one soft line
 * round each layer's silhouette and each part's own line where it lies over
 * the hand. Lite (lesson sizes): one fill per part, the parts' lines and the
 * silhouette line. `layer` draws one layer alone (behind / in front of what
 * the hand holds).
 */
import { Fragment } from 'react';
import { Group, LinearGradient, Paint, Path, Skia, vec } from '@shopify/react-native-skia';
import { Blur, useFigureScale } from './detail';
import { LIGHT } from './geom.ts';
import { across } from './paint';
import { ellipsePath, rimOf, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths.ts';
import type { FamHand, FamLayer, FamPart } from './familyHand.ts';
import { useLook } from './look';

type PartPaths = { src: FamPart; path: SkPath };
type HandPaths = { parts: PartPaths[]; layer: Record<FamLayer, SkPath | null>; all: SkPath; edges: Record<FamLayer, SkPath>; creases: { layer: FamLayer; w: number; path: SkPath }[]; nails: Record<FamLayer, SkPath>; lights: { layer: FamLayer; path: SkPath }[] };

const cache = new WeakMap<FamHand, HandPaths>();
/** The hand's Skia paths (built once per hand). */
export function familyHandPaths(h: FamHand): HandPaths {
  const hit = cache.get(h);
  if (hit) return hit;
  const parts = h.parts.map((p) => ({ src: p, path: unionOf(...p.pieces.map((q) => smoothClosed(q, p.kind === 'digit' ? 0.5 : 0.45))) }));
  const of = (l: FamLayer) => {
    const ps = parts.filter((p) => p.src.layer === l).map((p) => p.path);
    return ps.length ? unionOf(...ps) : null;
  };
  const many = (l: FamLayer, src: { layer: FamLayer; pts: { u: number; v: number }[] }[], closed: boolean) => {
    const p = smoothOpen([]);
    for (const e of src) if (e.layer === l) p.addPath(closed ? smoothClosed(e.pts, 0.5) : smoothOpen(e.pts));
    return p;
  };
  const layer = { behind: of('behind'), front: of('front') };
  const out: HandPaths = {
    parts,
    layer,
    all: unionOf(...parts.map((p) => p.path)),
    edges: { behind: many('behind', h.edges, false), front: many('front', h.edges, false) },
    creases: h.creases.map((c) => ({ layer: c.layer, w: c.w, path: smoothOpen(c.pts) })),
    nails: { behind: many('behind', h.nails, true), front: many('front', h.nails, true) },
    lights: h.lights.map((l) => ({ layer: l.layer, path: ellipsePath(l.e) })),
  };
  cache.set(h, out);
  return out;
}

/** The silhouette of a layer (or the whole hand). */
export function familyHandSilhouette(h: FamHand, layer?: FamLayer): SkPath | null {
  const G = familyHandPaths(h);
  return layer ? G.layer[layer] : G.all;
}

type Lit = { g0: [{ u: number; v: number }, { u: number; v: number }]; palm: [{ u: number; v: number }, { u: number; v: number }] | null };
const PALM_LIGHT = ['rgba(255,238,226,0.18)', 'rgba(255,238,226,0.03)', 'rgba(52,26,16,0.12)', 'rgba(52,26,16,0.32)'];

/**
 * One digit. Its base is the layer's OWN fill and palm light (the same gradients, the same numbers), so a finger
 * over the back of the hand never shows a step, a seam or a bounded pale patch: only its own soft turn across its
 * axis, its soft cast shadow and its line tell it from what lies under it — and near its root (where it grows out
 * of the hand) even those fade out along the finger, so the knuckles and the back of the hand stay one skin.
 */
function Part({ p, lit, within, full }: { p: PartPaths; lit: Lit; within: SkPath; full: boolean }) {
  const { HAND } = useLook();
  const q = p.src;
  if (q.kind !== 'digit') return null;
  const base = (
    <Group>
      <Path path={p.path}>
        <LinearGradient start={vec(lit.g0[0].u, lit.g0[0].v)} end={vec(lit.g0[1].u, lit.g0[1].v)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      {full && lit.palm ? (
        <Path path={p.path}>
          <LinearGradient start={vec(lit.palm[0].u, lit.palm[0].v)} end={vec(lit.palm[1].u, lit.palm[1].v)} colors={PALM_LIGHT} positions={[0, 0.3, 0.7, 1]} />
        </Path>
      ) : null}
    </Group>
  );
  if (!full) return base;
  const [s0, e0] = across(q.axis[0], q.axis[1], q.w);
  const own = (
    <Group>
      <Group clip={within}>
        <Group transform={[{ translateX: -LIGHT.u * 2.6 }, { translateY: -LIGHT.v * 2.6 }]}>
          <Path path={p.path} color="#2a160e" opacity={0.4}>
            <Blur mm={2.6} />
          </Path>
        </Group>
      </Group>
      {base}
      <Group clip={p.path}>
        <Path path={p.path}>
          <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={['rgba(255,238,226,0.16)', 'rgba(255,238,226,0.03)', 'rgba(52,26,16,0.1)', 'rgba(52,26,16,0.26)']} positions={[0, 0.3, 0.7, 1]} />
        </Path>
        {/* (the end bone sloping away from the viewer turns out of the light: a soft shade from the end joint to
            the tip — the curl reads as a form going away, never a stubby flat lobe) */}
        {q.tipAway ? (
          <Path path={p.path}>
            <LinearGradient start={vec(q.tipAway.from.u, q.tipAway.from.v)} end={vec(q.tipAway.to.u, q.tipAway.to.v)} colors={['rgba(52,26,16,0)', `rgba(52,26,16,${(0.3 * q.tipAway.k).toFixed(3)})`]} />
          </Path>
        ) : null}
      </Group>
    </Group>
  );
  if (!q.root || !q.rootLen) return own;
  // (the root: the digit's own shadow, light and base fade out toward where it grows from the hand)
  const r0 = q.root;
  const d = unitOf(q.axis[1].u - q.axis[0].u, q.axis[1].v - q.axis[0].v);
  const L = q.rootLen * 0.6 + q.w * 0.25;
  const zone = Skia.Path.Make();
  zone.addCircle(r0.u, r0.v, L + q.w);
  return (
    <Group layer={<Paint />}>
      {own}
      <Path path={zone} blendMode="dstOut">
        <LinearGradient start={vec(r0.u - d.u * 2, r0.v - d.v * 2)} end={vec(r0.u + d.u * L, r0.v + d.v * L)} colors={['black', 'rgba(0,0,0,0)']} />
      </Path>
    </Group>
  );
}

const unitOf = (u: number, v: number) => {
  const l = Math.hypot(u, v) || 1;
  return { u: u / l, v: v / l };
};

/** The hand, one layer or both. `far`: nothing extra (the caller dims the far side). */
export function FamilyHandV2({ h, layer }: { h: FamHand; layer?: FamLayer }) {
  const { MAT } = useLook();
  const SKIN = MAT.skin;
  const full = useFigureScale().level === 'full';
  const G = familyHandPaths(h);
  const b = G.all.getBounds();
  const layers: FamLayer[] = layer ? [layer] : ['behind', 'front'];
  const { HAND } = useLook();
  // (the palm's light: across its own axis, as wide as the palm)
  const P0 = G.parts.find((p) => p.src.kind !== 'digit')?.src;
  const palm = P0 ? across(P0.axis[0], P0.axis[1], P0.w) : null;
  const lit: Lit = { g0: [{ u: b.x + b.width * 0.34, v: b.y }, { u: b.x + b.width * 0.66, v: b.y + b.height }], palm };
  return (
    <Group>
      {layers.map((l) => {
        const sil = G.layer[l];
        if (!sil) return null;
        return (
          <Fragment key={l}>
            {/* the whole layer one fill (palm, knuckles, thumb's mound, wrist and fingers' roots joined), lit across
                the hand's own axis */}
            <Path path={sil}>
              <LinearGradient start={vec(b.x + b.width * 0.34, b.y)} end={vec(b.x + b.width * 0.66, b.y + b.height)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
            </Path>
            {full && palm ? (
              <Group clip={sil}>
                <Path path={sil}>
                  <LinearGradient start={vec(palm[0].u, palm[0].v)} end={vec(palm[1].u, palm[1].v)} colors={PALM_LIGHT} positions={[0, 0.3, 0.7, 1]} />
                </Path>
              </Group>
            ) : null}
            {G.parts
              .filter((p) => p.src.layer === l)
              .map((p, i) => (
                <Part key={i} p={p} lit={lit} within={sil} full={full} />
              ))}
            {full ? (
              <Group clip={sil}>
                {G.lights
                  .filter((x) => x.layer === l)
                  .map((x, i) => (
                    <Path key={i} path={x.path} color={SKIN.rim} opacity={0.1}>
                      <Blur mm={5} />
                    </Path>
                  ))}
                <Path path={G.nails[l]} color={SKIN.rim} opacity={0.08} />
              </Group>
            ) : null}
            <Group clip={sil}>
              {G.creases
                .filter((c) => c.layer === l)
                .map((c, i) => (
                  <Path key={`c${i}`} path={c.path} style="stroke" strokeWidth={full ? 1.4 : 1.1} strokeCap="round" color={SKIN.deep} opacity={(full ? 0.5 : 0.4) * c.w} />
                ))}
            </Group>
            <Path path={G.edges[l]} style="stroke" strokeWidth={full ? 1.1 : 0.9} strokeJoin="round" strokeCap="round" color={SKIN.edge} opacity={full ? 0.52 : 0.4} />
            {full ? (
              <Group clip={sil}>
                <Path path={rimOf(sil, 2.4)} color={SKIN.rim} opacity={0.26}>
                  <Blur mm={1.2} />
                </Path>
              </Group>
            ) : null}
            <Path path={sil} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
          </Fragment>
        );
      })}
    </Group>
  );
}
