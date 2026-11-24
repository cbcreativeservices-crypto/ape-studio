/**
 * FIGURE V2 — THE HAND ROUND A HAND-HELD MIC, DRAWN (wave 3; the grip:
 * heldHands.ts). The grip's parts in two layers — what lies behind the handle,
 * the mic, what lies in front of it — each in the approved hands' own language
 * (paint.tsx ArtPart, the same numbers): the person's one hand light from
 * above, the form turning across its axis, a soft lit rim, a digit's soft cast
 * shadow on what lies under it; then the part's own soft swells of light, its
 * darks, the gaps between the fingers (thin wedges, widest at the tips), a
 * faint thumb nail; one soft line round each layer's silhouette; the thumb's
 * own line, open where it grows out of the palm. Lite (lesson sizes): one fill
 * per part, the gaps and the line.
 */
import { Fragment, type ReactNode } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { Blur, useFigureScale } from './detail';
import { LIGHT } from './geom.ts';
import { across } from './paint';
import { ellipsePath, rimOf, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths.ts';
import type { GripPart, PlacedGrip } from './heldHands.ts';
import { useLook } from './look';

type PartPaths = { src: GripPart; path: SkPath; edge: SkPath | null; gaps: SkPath; lights: SkPath[]; darks: SkPath[]; nails: SkPath[] };
type GripPaths = { parts: Map<GripPart, PartPaths>; layer: Record<'behind' | 'front', SkPath | null>; all: SkPath };

const cache = new WeakMap<PlacedGrip, GripPaths>();
function gripPaths(h: PlacedGrip): GripPaths {
  const hit = cache.get(h);
  if (hit) return hit;
  const parts = new Map<GripPart, PartPaths>();
  for (const q of h.parts) {
    const gaps = Skia.Path.Make();
    // (a gap is a plain thin wedge: straight sides, so its fine end never balls up into a dot)
    for (const g of q.gaps) {
      g.forEach((pt, i) => (i ? gaps.lineTo(pt.u, pt.v) : gaps.moveTo(pt.u, pt.v)));
      gaps.close();
    }
    parts.set(q, {
      src: q,
      path: unionOf(...q.pieces.map((p) => smoothClosed(p, q.kind === 'digit' ? 0.5 : 0.45))),
      edge: q.edge ? smoothOpen(q.edge) : null,
      gaps,
      lights: q.lights.map(ellipsePath),
      darks: q.darks.map(ellipsePath),
      nails: q.nails.map((n) => smoothClosed(n, 0.5)),
    });
  }
  const of = (k: 'behind' | 'front') => {
    const ps = h.parts.filter((p) => p.layer === k).map((p) => parts.get(p)!.path);
    return ps.length ? unionOf(...ps) : null;
  };
  const layer = { behind: of('behind'), front: of('front') };
  const out: GripPaths = { parts, layer, all: unionOf(...[...parts.values()].map((p) => p.path)) };
  cache.set(h, out);
  return out;
}

/** One part, ArtPart's own numbers. */
function Part({ p, box, within }: { p: PartPaths; box: { x: number; y: number; width: number; height: number }; within: SkPath }) {
  const { MAT, HAND } = useLook();
  const SKIN = MAT.skin;
  const q = p.src;
  const m = { u: box.x + box.width / 2, v: box.y + box.height / 2 };
  const Ld = { u: -0.32, v: -0.95 };
  const R = 56;
  const [s0, e0] = across(q.axis[0], q.axis[1], q.w);
  return (
    <Group>
      {q.kind === 'digit' ? (
        <Group clip={within}>
          <Group transform={[{ translateX: -LIGHT.u * 2.6 }, { translateY: -LIGHT.v * 2.6 }]}>
            <Path path={p.path} color="#2a160e" opacity={0.5}>
              <Blur mm={2.6} />
            </Path>
          </Group>
        </Group>
      ) : null}
      <Path path={p.path}>
        <LinearGradient start={vec(m.u + Ld.u * R, m.v + Ld.v * R)} end={vec(m.u - Ld.u * R, m.v - Ld.v * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Group clip={p.path}>
        <Path path={p.path}>
          <LinearGradient start={vec(s0.u, s0.v)} end={vec(e0.u, e0.v)} colors={q.kind === 'digit' ? ['rgba(255,238,226,0.26)', 'rgba(255,238,226,0.05)', 'rgba(52,26,16,0.2)', 'rgba(52,26,16,0.46)'] : ['rgba(255,238,226,0.22)', 'rgba(255,238,226,0.04)', 'rgba(52,26,16,0.16)', 'rgba(52,26,16,0.42)']} positions={[0, 0.3, 0.7, 1]} />
        </Path>
        <Path path={rimOf(p.path, 2.4)} color={SKIN.rim} opacity={0.3}>
          <Blur mm={1.2} />
        </Path>
        {p.lights.map((l, i) => (
          <Path key={`l${i}`} path={l} color={SKIN.rim} opacity={0.26}>
            <Blur mm={4} />
          </Path>
        ))}
        {p.darks.map((l, i) => (
          <Path key={`d${i}`} path={l} color={SKIN.deep} opacity={0.3}>
            <Blur mm={5} />
          </Path>
        ))}
        <Path path={p.gaps} color={SKIN.deep} opacity={0.6}>
          <Blur mm={0.6} />
        </Path>
        {p.nails.map((n, i) => (
          <Path key={`n${i}`} path={n} color="#f3ddd0" opacity={0.12} />
        ))}
      </Group>
      {p.edge ? <Path path={p.edge} style="stroke" strokeWidth={1.1} strokeJoin="round" strokeCap="round" color={SKIN.edge} opacity={0.55} /> : null}
    </Group>
  );
}

/** The hand round its mic: the parts behind the handle, the mic, the parts in front. */
export function HeldHand({ h, mic }: { h: PlacedGrip; mic: ReactNode }) {
  const { MAT, HAND } = useLook();
  const SKIN = MAT.skin;
  const lite = useFigureScale().level === 'lite';
  const G = gripPaths(h);
  const b = G.all.getBounds();
  const box = { x: b.x, y: b.y, width: b.width, height: b.height };
  const draw = (q: GripPart) => {
    const p = G.parts.get(q)!;
    if (lite) {
      const m = { u: box.x + box.width / 2, v: box.y + box.height / 2 };
      return (
        <Group>
          <Path path={p.path}>
            <LinearGradient start={vec(m.u - 0.32 * 56, m.v - 0.95 * 56)} end={vec(m.u + 0.32 * 56, m.v + 0.95 * 56)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          <Group clip={p.path}>
            <Path path={p.gaps} color={SKIN.deep} opacity={0.5} />
          </Group>
          {p.edge ? <Path path={p.edge} style="stroke" strokeWidth={1} strokeCap="round" color={SKIN.edge} opacity={0.4} /> : null}
        </Group>
      );
    }
    return <Part p={p} box={box} within={G.layer[q.layer] ?? G.all} />;
  };
  const line = (k: 'behind' | 'front') => {
    const l = G.layer[k];
    return l ? <Path path={l} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} /> : null;
  };
  return (
    <Group>
      {h.order.map((k, i) => (
        <Fragment key={i}>{k === 'MIC' ? <Fragment>{line('behind')}{mic}</Fragment> : draw(k)}</Fragment>
      ))}
      {line('front')}
    </Group>
  );
}
