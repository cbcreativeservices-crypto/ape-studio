/**
 * FIGURE V2 — THE PAINT FOR THE BRASS AND LOW BRASS FAMILY'S AUTHORED HANDS (owner 2026-11-25, "batches by family").
 *
 * Every hand of the family is AUTHORED 2-D ART in its own file (figureV2/brassHand<Name>.tsx): hand-placed points in
 * millimetres, drawn as smooth closed cubic curves, exactly as the approved hands (poleHandFront.tsx, malletHandBack.tsx)
 * are — the same paint: one skin light across the whole hand (upper left), soft form lights and shadows clipped to the
 * hand, a thin soft outline round the one silhouette, very few thin lines, quiet nails. No 3-D model.
 *
 * A drawing is authored IN ITS LESSON'S PICTURE: the frame is the page's own (u right, v down, mm), its origin on the
 * centre of the figure's cuff rim (the sleeve's mouth), so the hand grows out of the sleeve where the lesson's arm ends.
 * `fore` is the forearm's direction (elbow → wrist) in that picture. Placed in another picture of the same hold (the
 * flugelhorn's, the bass trombone's) it is only TURNED about the cuff (never scaled or sheared).
 *
 * Paint order inside a drawing: the body (the one silhouette) → its soft lights and shades → its lines → the pieces
 * (nearer parts painted again over it: the thumb, a finger lying over its neighbour) → the nails → the outline. The
 * skin behind the cuff's rim is never painted (the figure's own sleeve takes the wrist).
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { FigureLook, useLook } from './look';
import { ellipsePath, op, smoothClosed, smoothOpen, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';
import type { CastMember } from './cast.ts';

/** A quiet nail: its centre, its length along `rot` (radians, page), its width across. `k` (0..1): how much of it faces
 *  the viewer (1 full face; a nail seen from its side is narrower and quieter). */
export type Nail = { c: Pt; len: number; w: number; rot: number; k?: number };

export type BrassHandArt = {
  /** The forearm's direction in the authored picture (elbow → wrist, page, unit). */
  fore: Pt;
  /** (option) how far back from the cuff's rim the skin is kept off the sleeve (mm; default 500 — the whole forearm).
   *  A hand that folds back IN FRONT of its own forearm in the picture (seen from its back, the fingers coming down
   *  past the cuff) keeps only a short band behind the rim. */
  cutLen?: number;
  /** The one silhouette: wrist (from just inside the cuff) → round the whole hand → back into the cuff. */
  body: Poly;
  /** Parts joined INTO the one silhouette (a spread finger growing out of the hand): no outline of their own — the
   *  outline runs round the whole. */
  union?: Poly[];
  /** Nearer parts painted again over the body in the same skin (each its own closed outline, softly outlined). */
  pieces?: Poly[];
  /** Soft single lines (a finger's edge where it lies against its neighbour, fading toward the hand). Each line is
   *  drawn strong at its first point and fades to nothing at its last. */
  lines?: Poly[];
  /** Short creases at a bend (clear at the first point, fading). */
  creases?: Poly[];
  nails?: Nail[];
  /** Broad soft lights (rim colour), form shades (deep), the knuckles' and bends' small lights. */
  broad?: Ellipse[];
  lights?: Ellipse[];
  darks?: Ellipse[];
  /** Low swells (the big knuckles seen from the back): a very soft light, never a spot. */
  swells?: Ellipse[];
  /** Broad soft shades (the hollow of a palm, a side turning away): very soft, never a blotch. */
  shades?: Ellipse[];
  /** (optional) where the drawing is painted again IN FRONT of the instrument (a fingertip coming round a casing):
   *  closed regions, page frame. */
  front?: Poly[];
};

const many = (ps: SkPath[]): SkPath => {
  const p = Skia.Path.Make();
  for (const q of ps) p.addPath(q);
  return p;
};

/** A nail's outline: a rounded oblong (superellipse). */
export function nailPoly(n: Nail): Poly {
  const out: Poly = [];
  const co = Math.cos(n.rot);
  const si = Math.sin(n.rot);
  const w = n.w * (n.k ?? 1);
  for (let j = 0; j < 20; j++) {
    const t = (Math.PI * 2 * j) / 20;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const a = (n.len / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), 0.75);
    const b = (w / 2) * Math.sign(st) * Math.pow(Math.abs(st), 0.75);
    out.push(P(n.c.u + a * co - b * si, n.c.v + a * si + b * co));
  }
  return out;
}

/**
 * A digit's outline from its centre line (authored points base → tip, page mm) and its half-widths there: the two
 * sides and a rounded end (a finger seen from its back or side). The base end stays open-square inside the hand (it is
 * joined into the silhouette with `union`, never outlined on its own).
 */
export function digitPoly(c: readonly Pt[], hw: readonly number[]): Poly {
  const n = c.length;
  const nrm = (i: number): Pt => {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b.u - a.u, b.v - a.v) || 1;
    return P(-(b.v - a.v) / l, (b.u - a.u) / l);
  };
  const left: Poly = [];
  const right: Poly = [];
  for (let i = 0; i < n; i++) {
    const m = nrm(i);
    left.push(P(c[i].u + m.u * hw[i], c[i].v + m.v * hw[i]));
    right.push(P(c[i].u - m.u * hw[i], c[i].v - m.v * hw[i]));
  }
  // the rounded end: a half circle round the last point
  const t = c[n - 1];
  const s = c[n - 2];
  const l = Math.hypot(t.u - s.u, t.v - s.v) || 1;
  const d = P((t.u - s.u) / l, (t.v - s.v) / l);
  const r = hw[n - 1];
  const m = nrm(n - 1);
  const cap: Poly = [];
  for (let k = 1; k < 6; k++) {
    const a = (Math.PI * k) / 6;
    cap.push(P(t.u + m.u * r * Math.cos(a) + d.u * r * Math.sin(a), t.v + m.v * r * Math.cos(a) + d.v * r * Math.sin(a)));
  }
  return [...left, ...cap, ...right.reverse()];
}

/** Where the skin may be painted: everywhere but over the figure's sleeve — the band behind the cuff's rim, as wide as
 *  the cuff (65 mm), running back toward the elbow. (A hand turned back past its own cuff in the picture — the wrist
 *  bent and seen from above — keeps every part beside the sleeve.) */
function handSide(fore: Pt, L = 500): SkPath {
  const n = Math.hypot(fore.u, fore.v) || 1;
  const f = P(fore.u / n, fore.v / n);
  const s = P(-f.v, f.u);
  const W = 34;
  const sleeve = [P(s.u * W, s.v * W), P(s.u * W - f.u * L, s.v * W - f.v * L), P(-s.u * W - f.u * L, -s.v * W - f.v * L), P(-s.u * W, -s.v * W)];
  const p = Skia.Path.Make();
  p.moveTo(sleeve[0].u, sleeve[0].v);
  for (let i = 1; i < 4; i++) p.lineTo(sleeve[i].u, sleeve[i].v);
  p.close();
  const all = Skia.Path.Make();
  all.addRect(Skia.XYWHRect(-600, -600, 1200, 1200));
  return op(all, p, PathOp.Difference);
}

/** The lit edge of a mass for the light L. */
function rimL(path: SkPath, w: number, L: Pt): SkPath {
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

/** The paths of a drawing (pure Skia, memoised by the caller). `uncut`: the whole drawing, nothing kept off the
 *  sleeve (a drawing shown alone). */
export function buildBrassHand(a: BrassHandArt, uncut = false) {
  const keep = uncut ? null : handSide(a.fore, a.cutLen);
  const cut = (p: SkPath) => (keep ? op(p, keep, PathOp.Intersect) : p);
  const whole = (a.union ?? []).reduce((acc, q) => op(acc, smoothClosed(q), PathOp.Union), smoothClosed(a.body));
  const body = cut(whole);
  const pieces = (a.pieces ?? []).map((q) => cut(smoothClosed(q)));
  const all = pieces.reduce((acc, p) => op(acc, p, PathOp.Union), body);
  // the drawing's own bounds: the skin light spans them
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const q of a.body) {
    u0 = Math.min(u0, q.u);
    v0 = Math.min(v0, q.v);
    u1 = Math.max(u1, q.u);
    v1 = Math.max(v1, q.v);
  }
  const c = P((u0 + u1) / 2, (v0 + v1) / 2);
  const R = Math.max(40, Math.hypot(u1 - u0, v1 - v0) * 0.55);
  let front: SkPath | null = null;
  if (a.front?.length) front = many(a.front.map((q) => smoothClosed(q, 0.3)));
  return {
    body,
    all,
    pieces,
    rim: rimL(all, 2, LIGHT),
    shade: rimL(all, 2.4, P(-LIGHT.u, -LIGHT.v)),
    lines: (a.lines ?? []).map((q) => ({ path: smoothOpen(q), a: q[0], b: q[q.length - 1] })),
    creases: (a.creases ?? []).map((q) => ({ path: smoothOpen(q), a: q[0], b: q[q.length - 1] })),
    nails: (a.nails ?? []).map((n) => ({ path: smoothClosed(nailPoly(n)), gloss: ellipsePath({ c: P(n.c.u + LIGHT.u * n.w * 0.18 * (n.k ?? 1), n.c.v + LIGHT.v * n.w * 0.18 * (n.k ?? 1)), rx: n.len * 0.26, ry: n.w * 0.16 * (n.k ?? 1), rot: n.rot }), k: n.k ?? 1 })),
    broad: many((a.broad ?? []).map(ellipsePath)),
    lights: many((a.lights ?? []).map(ellipsePath)),
    darks: many((a.darks ?? []).map(ellipsePath)),
    swells: many((a.swells ?? []).map(ellipsePath)),
    shades: many((a.shades ?? []).map(ellipsePath)),
    front,
    c,
    R,
  };
}
type Built = ReturnType<typeof buildBrassHand>;

/** The hand's one skin light across the whole drawing (every piece shares it: no seam). */
function Fill({ path, B }: { path: SkPath; B: Built }) {
  const { HAND } = useLook();
  return (
    <Path path={path}>
      <LinearGradient start={vec(B.c.u + LIGHT.u * B.R, B.c.v + LIGHT.v * B.R)} end={vec(B.c.u - LIGHT.u * B.R, B.c.v - LIGHT.v * B.R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

function Skin({ B }: { B: Built }) {
  const { MAT, NAIL } = useLook();
  const SKIN = MAT.skin;
  return (
    <Group>
      <Fill path={B.body} B={B} />
      <Group clip={B.all}>
        <Path path={B.broad} color={SKIN.rim} opacity={0.14}>
          <Blur mm={5} />
        </Path>
        <Path path={B.swells} color={SKIN.rim} opacity={0.2}>
          <Blur mm={2.8} />
        </Path>
        <Path path={B.shades} color={SKIN.deep} opacity={0.2}>
          <Blur mm={5} />
        </Path>
        <Path path={B.lights} color={SKIN.rim} opacity={0.28}>
          <Blur mm={1.5} />
        </Path>
        <Path path={B.darks} color={SKIN.deep} opacity={0.3}>
          <Blur mm={1.5} />
        </Path>
        <Path path={B.shade} color={SKIN.deep} opacity={0.22}>
          <Blur mm={1} />
        </Path>
        {B.creases.map((c, i) => (
          <Path key={`c${i}`} path={c.path} style="stroke" strokeWidth={0.75} strokeCap="round">
            <LinearGradient start={vec(c.a.u, c.a.v)} end={vec(c.b.u, c.b.v)} colors={[SKIN.edge, `${SKIN.edge}70`, `${SKIN.edge}00`]} positions={[0, 0.45, 1]} />
            <Blur mm={0.25} />
          </Path>
        ))}
        {B.lines.map((c, i) => (
          <Path key={`l${i}`} path={c.path} style="stroke" strokeWidth={0.8} strokeCap="round">
            <LinearGradient start={vec(c.a.u, c.a.v)} end={vec(c.b.u, c.b.v)} colors={[SKIN.edge, `${SKIN.edge}a0`, `${SKIN.edge}00`]} positions={[0, 0.6, 1]} />
            <Blur mm={0.2} />
          </Path>
        ))}
      </Group>
      {/* the nearer pieces: the same skin light, their own soft shade where they turn away, a soft outline */}
      {B.pieces.map((p, i) => (
        <Group key={`p${i}`}>
          <Fill path={p} B={B} />
          <Group clip={p}>
            <Path path={B.broad} color={SKIN.rim} opacity={0.14}>
              <Blur mm={5} />
            </Path>
            <Path path={B.lights} color={SKIN.rim} opacity={0.28}>
              <Blur mm={1.5} />
            </Path>
            <Path path={B.darks} color={SKIN.deep} opacity={0.3}>
              <Blur mm={1.5} />
            </Path>
            <Path path={rimL(p, 2, LIGHT)} color={SKIN.rim} opacity={0.26}>
              <Blur mm={1} />
            </Path>
            <Path path={rimL(p, 2.2, P(-LIGHT.u, -LIGHT.v))} color={SKIN.deep} opacity={0.24}>
              <Blur mm={1} />
            </Path>
          </Group>
          <Path path={p} style="stroke" strokeWidth={0.7} strokeJoin="round" color={SKIN.edge} opacity={0.34} />
        </Group>
      ))}
      <Group clip={B.all}>
        <Path path={B.rim} color={SKIN.rim} opacity={0.26}>
          <Blur mm={1} />
        </Path>
        {/* the nails: a slightly lighter rounded shape near the tip, a faint soft edge, a small gloss */}
        {B.nails.map((n, i) => (
          <Group key={`n${i}`}>
            <Path path={n.path} color={NAIL.fill} opacity={0.32 + 0.22 * n.k} />
            <Path path={n.path} style="stroke" strokeWidth={0.5} color={NAIL.edge} opacity={0.5}>
              <Blur mm={0.15} />
            </Path>
            <Path path={n.gloss} color="#fff6ee" opacity={0.22}>
              <Blur mm={0.6} />
            </Path>
          </Group>
        ))}
      </Group>
      {/* the thin soft outline round the one silhouette */}
      <Path path={B.body} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SKIN.edge} opacity={0.5} />
    </Group>
  );
}

export type BrassHandProps = {
  art: BrassHandArt;
  /** The figure's cuff rim centre on the page (mm). */
  at: Pt;
  /** Turned about the cuff (radians; 0 = as authored). */
  rot?: number;
  /** The cast member (absent: the look already given round it). */
  who?: CastMember;
  /** 'all' (default), or only the parts IN FRONT of the instrument (art.front). */
  part?: 'all' | 'front';
  /** (a drawing shown alone) the whole drawing, nothing kept off a sleeve. */
  uncut?: boolean;
};

/** One authored hand on the page. */
export function BrassHand({ art, at, rot = 0, who, part = 'all', uncut = false }: BrassHandProps) {
  const B = useMemo(() => buildBrassHand(art, uncut), [art, uncut]);
  if (part === 'front' && !B.front) return null;
  const skin = <Skin B={B} />;
  const body = part === 'front' && B.front ? <Group clip={B.front}>{skin}</Group> : skin;
  return <Group transform={[{ translateX: at.u }, { translateY: at.v }, { rotate: rot }]}>{who ? <FigureLook look={who.look}>{body}</FigureLook> : body}</Group>;
}

/** The turn that lays a drawing authored with forearm `artFore` along a picture's forearm `fore` (radians). */
export function brassHandRot(artFore: Pt, fore: Pt): number {
  let d = Math.atan2(fore.v, fore.u) - Math.atan2(artFore.v, artFore.u);
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
