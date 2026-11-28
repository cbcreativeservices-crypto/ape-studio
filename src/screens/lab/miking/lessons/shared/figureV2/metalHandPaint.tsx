/**
 * FIGURE V2 — THE METAL FAMILY'S AUTHORED HANDS: ONE PAINTER (2026-11-25, family batch "metal"). Every hand of the
 * suspended-metal lessons that is drawn as authored 2-D art (figureV2/metalHand*.tsx) is a list of hand-placed
 * pieces in millimetres; this file paints them the way the approved hands are painted (malletHandBack.tsx,
 * poleHandFront.tsx): one skin light across the whole hand (the same span on every piece: no seam), soft form
 * lights and shades, a thin soft outline, a quiet nail on each digit whose nail faces the eye, creases that fade.
 *
 * A piece is painted in one of two layers, so a hand can WRAP what it holds: 'back' (the palm and whatever lies
 * beyond the held thing) is painted before the instrument, 'front' (the fingers and the thumb that come round in
 * front of it) after it. The forearm runs on past the wrist into the player's sleeve (the lesson clips it out of
 * the sleeve, so the cuff stays over the wrist).
 *
 * Frame of every art: mm, +x right, +y DOWN, the light from the upper left (geom LIGHT); turned and mirrored on
 * the page, the light is carried back into the art's frame (a mirrored hand is RE-LIT, never just flipped).
 */
import { useMemo, type ReactNode } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur, FigureScale } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, smoothClosed, smoothOpen, type SkPath } from './paths';
import { LIGHT, P, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';
import { nailPoly, type MetalHandArt, type MetalLayer } from './metalHandArt.ts';

export type { MetalHandArt, MetalLayer } from './metalHandArt.ts';

/* ── the light carried into the art's frame ── */

function lightIn(rot: number, mirror: boolean): Pt {
  const m = mirror ? -1 : 1;
  const co = Math.cos(rot);
  const si = Math.sin(rot);
  // page → art: undo the rotation, then the mirror
  const u = LIGHT.u * co + LIGHT.v * si;
  const v = -LIGHT.u * si + LIGHT.v * co;
  return P(u * m, v);
}
function relit(es: readonly Ellipse[] | undefined, L: Pt, sign: 1 | -1, k = 0.35): Ellipse[] {
  if (!es) return [];
  return es.map((e) => {
    const r = Math.min(e.rx, e.ry) * k * sign;
    return { ...e, c: P(e.c.u + r * (L.u - LIGHT.u), e.c.v + r * (L.v - LIGHT.v)) };
  });
}
const many = (ps: SkPath[]): SkPath => {
  const p = Skia.Path.Make();
  for (const q of ps) p.addPath(q);
  return p;
};
function rimL(path: SkPath, w: number, L: Pt): SkPath {
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

/** Soft lights and shades by size: each group blurred in proportion to its forms (a broad form, a broad blur). */
function bySize(es: Ellipse[]): { path: SkPath; blur: number }[] {
  const small = es.filter((e) => Math.min(e.rx, e.ry) < 4);
  const mid = es.filter((e) => Math.min(e.rx, e.ry) >= 4 && Math.min(e.rx, e.ry) < 9);
  const big = es.filter((e) => Math.min(e.rx, e.ry) >= 9);
  return [
    { path: many(small.map(ellipsePath)), blur: 1.3 },
    { path: many(mid.map(ellipsePath)), blur: 3 },
    { path: many(big.map(ellipsePath)), blur: 6 },
  ];
}

type BuiltPiece = { name: string; layer: MetalLayer; path: SkPath; rim: SkPath; turn: SkPath; lights: { path: SkPath; blur: number }[]; darks: { path: SkPath; blur: number }[]; stroke: boolean; quiet: SkPath | null; nails: SkPath[]; gloss: SkPath[]; creases: { path: SkPath; a: Pt; b: Pt; w: number }[] };

function build(art: MetalHandArt, L: Pt): BuiltPiece[] {
  return art.pieces.map((pc) => {
    const path = smoothClosed(pc.outline);
    const nails = art.nails.filter((n) => n.piece === pc.name);
    return {
      name: pc.name,
      layer: pc.layer,
      path,
      rim: rimL(path, 1.6, L),
      turn: rimL(path, 2.2, P(-L.u, -L.v)),
      lights: bySize(relit(pc.lights, L, 1)),
      darks: bySize(relit(pc.darks, L, -1)),
      stroke: pc.stroke ?? true,
      quiet: pc.quiet && pc.quiet.length ? many(pc.quiet.map(ellipsePath)) : null,
      nails: nails.map((n) => smoothClosed(nailPoly(n.c, n.len, n.w, n.rot))),
      gloss: nails.map((n) => ellipsePath({ c: P(n.c.u + L.u * n.w * 0.12, n.c.v + L.v * n.w * 0.12), rx: n.len * 0.26, ry: n.w * 0.2, rot: n.rot })),
      creases: art.creases.filter((c) => c.piece === pc.name).map((c) => ({ path: smoothOpen(c.pts), a: c.pts[0], b: c.pts[c.pts.length - 1], w: c.w ?? 0.7 })),
    };
  });
}

function PiecePaint({ B, art, L }: { B: BuiltPiece; art: MetalHandArt; L: Pt }) {
  const { HAND, MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  const n = Math.hypot(L.u, L.v) || 1;
  const c = art.fill.c;
  const R = art.fill.r;
  return (
    <Group>
      <Path path={B.path}>
        <LinearGradient start={vec(c.u + (L.u / n) * R, c.v + (L.v / n) * R)} end={vec(c.u - (L.u / n) * R, c.v - (L.v / n) * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Group clip={B.path}>
        {B.lights.map((g, i) => (
          <Path key={`l${i}`} path={g.path} color={SKIN.rim} opacity={0.24}>
            <Blur mm={g.blur} />
          </Path>
        ))}
        {B.darks.map((g, i) => (
          <Path key={`d${i}`} path={g.path} color={SKIN.deep} opacity={0.26}>
            <Blur mm={g.blur} />
          </Path>
        ))}
        <Path path={B.turn} color={SKIN.deep} opacity={0.2}>
          <Blur mm={0.9} />
        </Path>
        <Path path={B.rim} color={SKIN.rim} opacity={0.24}>
          <Blur mm={0.9} />
        </Path>
        {B.creases.map((k, i) => (
          <Path key={`k${i}`} path={k.path} style="stroke" strokeWidth={k.w} strokeCap="round">
            <LinearGradient start={vec(k.a.u, k.a.v)} end={vec(k.b.u, k.b.v)} colors={[`${SKIN.edge}a0`, `${SKIN.edge}50`, `${SKIN.edge}00`]} positions={[0, 0.5, 1]} />
            <Blur mm={0.25} />
          </Path>
        ))}
        {B.nails.map((p, i) => (
          <Group key={`n${i}`}>
            <Path path={p} color={NAIL.fill} opacity={0.62}>
              <Blur mm={0.3} />
            </Path>
            <Path path={p} style="stroke" strokeWidth={0.45} color={SKIN.edge} opacity={0.55} />
            <Path path={B.gloss[i]} color="#fff6ee" opacity={0.22}>
              <Blur mm={0.5} />
            </Path>
          </Group>
        ))}
      </Group>
      {B.stroke ? (
        B.quiet ? (
          <Group clip={B.quiet} invertClip>
            <Path path={B.path} style="stroke" strokeWidth={0.8} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
          </Group>
        ) : (
          <Path path={B.path} style="stroke" strokeWidth={0.8} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
        )
      ) : null}
    </Group>
  );
}

export type MetalHandProps = {
  art: MetalHandArt;
  /** where the art's anchor goes (page mm) */
  x: number;
  y: number;
  rot?: number;
  /** the other hand: the mirror image, re-lit */
  mirror?: boolean;
  /** pt (or page units) per mm; 1 inside a lesson's mm frame */
  s?: number;
  /** which layer to paint ('all': both, the back first) */
  layer?: MetalLayer | 'all';
  /** the cast member (absent: the look already given round it) */
  who?: CastMember;
  /** (study pages) a figure scale of its own */
  ownScale?: boolean;
};

/** One authored metal-family hand, its anchor at (x, y). */
export function MetalHand({ art, x, y, rot = 0, mirror = false, s = 1, layer = 'all', who, ownScale = false }: MetalHandProps) {
  const L = useMemo(() => lightIn(rot, mirror), [rot, mirror]);
  const B = useMemo(() => build(art, L), [art, L]);
  const shown = B.filter((b) => layer === 'all' || b.layer === layer);
  const ordered = layer === 'all' ? [...shown.filter((b) => b.layer === 'back'), ...shown.filter((b) => b.layer === 'front')] : shown;
  // (the art's anchor at the origin: metalArtToPage places the same way)
  let paint: ReactNode = (
    <Group transform={[{ translateX: -art.anchor.u }, { translateY: -art.anchor.v }]}>
      {ordered.map((b) => (
        <PiecePaint key={b.name} B={b} art={art} L={L} />
      ))}
    </Group>
  );
  if (who) paint = <FigureLook look={who.look}>{paint}</FigureLook>;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: rot }, { scale: s }, ...(mirror ? [{ scaleX: -1 }] : [])]}>
      {ownScale ? <FigureScale ptPerMm={s}>{paint}</FigureScale> : paint}
    </Group>
  );
}
