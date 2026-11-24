/**
 * FIGURE V2 — A FIST ROUND THE BOOM POLE, DRAWN FROM ANY SIDE (builder "FrontBoom2", 2026-11-24, after the
 * independent review: "the hand is a flat featureless skin paddle with the pole drawn across its front"; "a mitten
 * lump sitting on top of the pole").
 *
 * The hand is the APPROVED 3-D power grip (heldHands.gripModel, unchanged: the pole in the palm, the four fingers
 * round its far edge, the thumb round its near edge the other way). The mic hand's own painter (heldHandV2, frozen)
 * unites each layer into one silhouette — right for a handle seen side-on, the views it was approved in. A boom pole
 * is seen mostly ALONG its length (from the side the pole comes toward the viewer), and there the united layers read
 * as one block. So here each finger is its own form, painted in true depth order:
 *   1. what lies behind the pole (seen from where the viewer is, at each finger's own cross-section), farthest first;
 *   2. the pole's piece inside the fist;
 *   3. what lies in front of it, farthest first — each finger one form (its bones in one layer one smooth chain), the
 *      palm one form with the wrist growing out of the cuff, the thumb one form growing out of its mound;
 *   4. (BoomV2) the pole's piece coming out of the fist toward the viewer.
 * A finger's line is drawn only where it leaves the palm (inside the palm only a soft seam): fingers are told apart
 * by their own edges and by the gaps at their tips; the knuckles stay low swells on the back (BoomV2.KnuckleRow).
 */
import { Fragment, type ReactNode } from 'react';
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { Blur, useFigureScale } from './detail';
import { LIGHT, hull, limbOutline, type Pt } from './geom.ts';
import { Form } from './paint';
import { smoothClosed, unionOf, type SkPath } from './paths.ts';
import { axisU, type L3, type PlacedGrip } from './heldHands.ts';
import { useLook } from './look';

type Item = { key: string; path: SkPath; axis: [Pt, Pt]; w: number; depth: number; layer: 'behind' | 'front'; kind: 'palm' | 'digit' | 'bed'; /** the run that grows out of the palm at the knuckle */ grows?: boolean };

const cache = new WeakMap<PlacedGrip, { items: Item[]; palm: SkPath; all: SkPath }>();

/** The fist's forms, for a grip as placed (`toPage`: a point of the hand's own frame to the page). */
export function fistForms(g: PlacedGrip, toPage: (l: L3) => Pt) {
  const hit = cache.get(g);
  if (hit) return hit;
  const m = g.model;
  const v = g.view.toward;
  const depth = (p: L3) => p.u * v.u + p.w * v.w + p.n * v.n;
  // (seen mostly ALONG the pole — from the side — the pole's inside piece lies hidden in the fist: every form is in
  // front of it, in true depth; the piece beyond the fist's near end comes over them all. Seen across the pole, the
  // fingers lie behind or in front of it at their own cross-section.)
  const endView = Math.abs(v.w) > 0.55;
  const layerOf = (p: L3): 'behind' | 'front' => (endView || (p.u - axisU(m, p.w)) * v.u + p.n * v.n >= 0 ? 'front' : 'behind');
  const mid = (a: L3, b: L3): L3 => ({ u: (a.u + b.u) / 2, w: (a.w + b.w) / 2, n: (a.n + b.n) / 2 });
  // the palm with the wrist (heldHands' own palm outline: the hull of its spheres, the wrist from the cuff, the web)
  const palmPart = g.parts.find((p) => p.name === 'palm')!;
  // (FrontBoom3, coordinator 2026-11-24: "the thumb side is a flat rectangular block") the palm's hull drawn with its
  // corners well rounded — the back of a closed hand is a rounded form, never a box
  const palm = unionOf(...palmPart.pieces.map((p) => smoothClosed(p, 0.85)));
  const palmC: L3 = { u: -30, w: 0, n: m.R + 1 + 13.5 };
  const items: Item[] = [{ key: 'palm', path: palm, axis: palmPart.axis, w: 40, depth: depth(palmC), layer: endView || v.n > 0.15 ? 'front' : layerOf(palmC), kind: 'palm' }];
  // (the back of the hand turned toward the viewer covers the pole that lies in its palm: the palm is in front)
  // each digit: its bones in one layer as one chain
  const digit = (name: string, pts: L3[], r: number[]) => {
    let run: { pts: L3[]; r: number[]; layer: 'behind' | 'front' } | null = null;
    const runs: { pts: L3[]; r: number[]; layer: 'behind' | 'front' }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const lay = layerOf(mid(pts[i], pts[i + 1]));
      if (run && run.layer === lay) {
        run.pts.push(pts[i + 1]);
        run.r.push(r[i + 1]);
      } else {
        if (run) runs.push(run);
        run = { pts: [pts[i], pts[i + 1]], r: [r[i], r[i + 1]], layer: lay };
      }
    }
    if (run) runs.push(run);
    runs.forEach((q, j) => {
      const P2 = q.pts.map(toPage);
      // (a run that starts inside the palm at the knuckle grows out of it: no round cap there)
      const out = limbOutline(P2, q.r, { crook: 0.8, capStart: !(j === 0) });
      const c = q.pts.reduce((a, p) => ({ u: a.u + p.u / q.pts.length, w: a.w + p.w / q.pts.length, n: a.n + p.n / q.pts.length }), { u: 0, w: 0, n: 0 });
      items.push({ key: `${name}${j}`, path: smoothClosed(out, 0.5), axis: [P2[0], P2[P2.length - 1]], w: q.r[0] + 2, depth: depth(c), layer: q.layer, kind: 'digit', grows: j === 0 });
    });
  };
  // the fingers lie closed against each other: between each two neighbours, where their bones lie in one layer, the
  // skin between them (darker, set back), so nothing behind shows through between two fingers
  for (let i = 0; i < m.fingers.length - 1; i++) {
    const A = m.fingers[i];
    const B = m.fingers[i + 1];
    for (let k = 0; k < A.pts.length - 1; k++) {
      const la = layerOf(mid(A.pts[k], A.pts[k + 1]));
      if (la !== layerOf(mid(B.pts[k], B.pts[k + 1]))) continue;
      const ring = (p: L3, r: number) => Array.from({ length: 12 }, (_, j) => {
        const c = toPage(p);
        return { u: c.u + r * Math.cos((j * Math.PI) / 6), v: c.v + r * Math.sin((j * Math.PI) / 6) };
      });
      const pts = [...ring(A.pts[k], A.r[k] * 0.8), ...ring(A.pts[k + 1], A.r[k + 1] * 0.8), ...ring(B.pts[k], B.r[k] * 0.8), ...ring(B.pts[k + 1], B.r[k + 1] * 0.8)];
      items.push({ key: `bed${i}${k}`, path: smoothClosed(hull(pts), 0.5), axis: [toPage(A.pts[k]), toPage(A.pts[k + 1])], w: 12, depth: Math.min(depth(mid(A.pts[k], A.pts[k + 1])), depth(mid(B.pts[k], B.pts[k + 1]))) - 1, layer: la, kind: 'bed' });
    }
  }
  m.fingers.forEach((f) => digit(f.name, f.pts, f.r));
  digit('thumb', m.thumb.pts, m.thumb.r);
  // (the skin between the fingers lies under every finger of its layer: drawn just before the farthest of them)
  for (const k of ['behind', 'front'] as const) {
    const ds = items.filter((i) => i.kind === 'digit' && i.layer === k).map((i) => i.depth);
    if (ds.length) for (const i of items) if (i.kind === 'bed' && i.layer === k) i.depth = Math.min(...ds) - 0.5;
  }
  const all = unionOf(...items.filter((i) => i.kind !== 'bed').map((i) => i.path));
  const out = { items, palm, all };
  cache.set(g, out);
  return out;
}

/** The fist round the pole: the parts behind it, `pole` (the piece inside the fist), the parts in front. */
export function BoomFist({ g, toPage, pole }: { g: PlacedGrip; toPage: (l: L3) => Pt; pole: ReactNode }) {
  const { MAT, HAND } = useLook();
  const lite = useFigureScale().level === 'lite';
  const F = fistForms(g, toPage);
  const by = (k: 'behind' | 'front') => F.items.filter((i) => i.layer === k).sort((a, b) => a.depth - b.depth);
  const draw = (i: Item) => {
    if (i.kind === 'bed')
      return (
        <Group key={i.key}>
          <Path path={i.path}>
            <LinearGradient start={vec(i.axis[0].u, i.axis[0].v)} end={vec(i.axis[1].u, i.axis[1].v)} colors={[HAND[1], HAND[2]]} />
          </Path>
          <Path path={i.path} color={MAT.skin.deep} opacity={0.28} />
        </Group>
      );
    if (lite) {
      const b = i.path.getBounds();
      const c = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
      return (
        <Group key={i.key}>
          <Path path={i.path}>
            <LinearGradient start={vec(c.u + LIGHT.u * 40, c.v + LIGHT.v * 40)} end={vec(c.u - LIGHT.u * 40, c.v - LIGHT.v * 40)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          {i.kind === 'digit' ? (
            <Group clip={F.palm} invertClip>
              <Path path={i.path} style="stroke" strokeWidth={1.4} color={MAT.skin.edge} opacity={0.5} />
            </Group>
          ) : (
            <Path path={i.path} style="stroke" strokeWidth={1.4} color={MAT.skin.edge} opacity={0.5} />
          )}
        </Group>
      );
    }
    return (
      <Group key={i.key}>
        {i.kind === 'digit' ? (
          // (a finger's soft shadow on what lies under it)
          <Group clip={F.all}>
            <Group transform={[{ translateX: -LIGHT.u * 2.2 }, { translateY: -LIGHT.v * 2.2 }]}>
              <Path path={i.path} color="#2a160e" opacity={0.32}>
                <Blur mm={2.2} />
              </Path>
            </Group>
          </Group>
        ) : null}
        {/* (FrontBoom3, coordinator 2026-11-24: "a finger drawn as a closed outline with a hole") every form is a
            SOLID form with no hard line of its own inside the hand — only a soft seam where it lies on another; each
            layer's one outline is drawn once round the layer (below) */}
        <Form path={i.path} mat={MAT.skin} axis={i.axis} w={i.w} rim={i.kind === 'palm' ? 5 : 3} edge={0} />
        <Group clip={F.all}>
          <Path path={i.path} style="stroke" strokeWidth={2.2} color={MAT.skin.deep} opacity={i.kind === 'palm' ? 0.1 : 0.22}>
            <Blur mm={1.1} />
          </Path>
        </Group>
      </Group>
    );
  };
  const outline = (k: 'behind' | 'front') => {
    const ps = F.items.filter((i) => i.layer === k && i.kind !== 'bed').map((i) => i.path);
    return ps.length && !lite ? <Path path={unionOf(...ps)} style="stroke" strokeWidth={1.1} strokeJoin="round" color={MAT.skin.edge} opacity={0.55} /> : null;
  };
  return (
    <Group>
      {by('behind').map((i) => (
        <Fragment key={i.key}>{draw(i)}</Fragment>
      ))}
      {outline('behind')}
      <Group clip={F.all}>{pole}</Group>
      {by('front').map((i) => (
        <Fragment key={i.key}>{draw(i)}</Fragment>
      ))}
      {outline('front')}
    </Group>
  );
}

/** The fist's whole outline (the pole drawn whole outside it). */
export const fistSilhouette = (g: PlacedGrip, toPage: (l: L3) => Pt): SkPath => fistForms(g, toPage).all;
