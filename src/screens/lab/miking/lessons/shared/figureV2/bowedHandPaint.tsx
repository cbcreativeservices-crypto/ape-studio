/**
 * FIGURE V2 — THE PAINTER FOR THE BOWED FAMILY'S AUTHORED HANDS (2026-11-25, "batches by family"). The bowed hands
 * (violin, viola, cello, double bass: bowedHand*.tsx) are AUTHORED 2-D ART as the approved pole and mallet hands
 * (poleHandFront.tsx, malletHandBack.tsx): hand-placed points in millimetres drawn as smooth closed curves, the cast
 * member's own skin light (one fixed span shared by every piece: one skin, no seam), soft form lights and shades, a
 * few thin soft lines that fade, one thin soft outline round the whole silhouette (never round a single finger where
 * it meets the hand), and clear nails on the side they lie on. No 3-D model.
 *
 * Each drawing is authored in its lesson's own CUFF FRAME: the origin at the centre of the sleeve's cuff, +x along the
 * forearm out of the cuff toward the hand, +y a quarter turn clockwise from it on the page (so with the forearm
 * pointing right, +y is DOWN the page). It has two layers: `behind` (what lies beyond the thing held: the thumb under
 * a bow's stick, the palm and thumb behind a neck) and `front`. The scene paints the held thing (stick, neck) between
 * them; standing alone (the review sheet) the drawing paints a stand-in for it.
 */
import type { ReactNode } from 'react';
import { Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { Blur } from './detail';
import { useLook } from './look';
import { ellipsePath, op, smoothClosed, smoothOpen, unionOf, type SkPath } from './paths';
import { LIGHT, P, type Poly, type Pt } from './geom.ts';
import type { Ellipse } from './sidePlan.ts';

/** A soft light (`+`) or shade (`-`) on a piece: an ellipse and its strength. */
export type BHSoft = { e: Ellipse; o: number };
/** A thin line inside the hand (a crease, a finger's edge over its neighbour): strongest at its first point, fading to
 *  nothing at its last unless `even`. */
export type BHLine = { pts: Poly; w?: number; o?: number; even?: boolean };
/** A nail: a rounded oblong `len` along `rot` (rad), `w` across, centre `c`. */
export type BHNail = { c: Pt; len: number; w: number; rot: number };
/** One closed form of the hand (the hand's body, one finger, the thumb). */
export type BHPiece = {
  id: string;
  outline: Poly;
  tension?: number;
  lights?: BHSoft[];
  darks?: BHSoft[];
  nails?: BHNail[];
  /** A farther digit a value step down (0–1: how much of the skin's deep tone over it). */
  dim?: number;
  /** (default: every piece but the hand's body) its edge drawn where it lies over an earlier digit of its layer — a
   *  nearer finger's edge over the one behind it; never where it meets the hand's body. */
  edgeOver?: boolean;
};
/** The thing held, as the sheet draws it alone: a bow's stick (a round rod `r`) or a neck (a band `r` half-wide). */
export type BHHeld = { kind: 'stick' | 'neck' | 'board'; a: Pt; b: Pt; r: number };

export type BowedHandArt = {
  /** Plain words: what this drawing is. */
  title: string;
  behind: BHPiece[];
  front: BHPiece[];
  /** Lines over each layer (clipped to it). */
  behindLines?: BHLine[];
  frontLines?: BHLine[];
  /** The hand's soft shadow on what it holds, painted just before the front layer (page-sized blur). */
  cast?: BHSoft[];
  /** The point on the held thing the drawing is placed by (cuff frame), and the held thing for the sheet. */
  grip: Pt;
  held: BHHeld[];
  /** The skin light's span (centre and half-length along the light). */
  span: { c: Pt; R: number };
};

const many = (es: readonly Ellipse[]): SkPath => {
  const p = Skia.Path.Make();
  for (const e of es) p.addPath(ellipsePath(e));
  return p;
};

/** A rounded oblong (a nail seen at an angle). */
export function nailPoly(n: BHNail): Poly {
  const out: Poly = [];
  const co = Math.cos(n.rot);
  const si = Math.sin(n.rot);
  for (let j = 0; j < 20; j++) {
    const t = (Math.PI * 2 * j) / 20;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const a = (n.len / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), 0.7);
    const b = (n.w / 2) * Math.sign(st) * Math.pow(Math.abs(st), 0.7);
    out.push(P(n.c.u + a * co - b * si, n.c.v + a * si + b * co));
  }
  return out;
}

/**
 * An authoring aid for a finger seen from its side: the outline round a bent axis (root → middle joint → end joint →
 * tip), `r` its half-width at each point. At each bend the outer side swells a little (the joint) and the inner side
 * draws in (the crease); the tip is a rounded pad, the root left open inside the hand (the piece starts and ends
 * there, hidden). The drawing's own points, never a projected model.
 */
export function digitOutline(axis: readonly Pt[], r: readonly number[], o: { swell?: number; padAt?: number } = {}): Poly {
  const n = axis.length;
  const sw = o.swell ?? 0.1;
  const nrm = (i: number): Pt => {
    const a = axis[Math.max(0, i - 1)];
    const b = axis[Math.min(n - 1, i + 1)];
    const d = P(b.u - a.u, b.v - a.v);
    const l = Math.hypot(d.u, d.v) || 1;
    return P(-d.v / l, d.u / l);
  };
  // which way each inner joint bends (+1: its outer side is the left offset)
  const bend = (i: number): number => {
    if (i <= 0 || i >= n - 1) return 0;
    const a = axis[i - 1];
    const b = axis[i];
    const c = axis[i + 1];
    const cr = (b.u - a.u) * (c.v - b.v) - (b.v - a.v) * (c.u - b.u);
    return cr > 0 ? -1 : 1;
  };
  const left: Poly = [];
  const right: Poly = [];
  for (let i = 0; i < n; i++) {
    const m = nrm(i);
    const k = bend(i);
    const rl = r[i] * (k === 1 ? 1 + sw : k === -1 ? 1 - sw : 1);
    const rr = r[i] * (k === -1 ? 1 + sw : k === 1 ? 1 - sw : 1);
    left.push(P(axis[i].u + m.u * rl, axis[i].v + m.v * rl));
    right.push(P(axis[i].u - m.u * rr, axis[i].v - m.v * rr));
  }
  // the rounded pad round the tip
  const t = axis[n - 1];
  const p = axis[n - 2];
  const dl = Math.hypot(t.u - p.u, t.v - p.v) || 1;
  const d = P((t.u - p.u) / dl, (t.v - p.v) / dl);
  const m = P(-d.v, d.u);
  const rt = r[n - 1];
  const cap: Poly = [];
  for (let j = 1; j < 6; j++) {
    const a = Math.PI / 2 - (Math.PI * j) / 6;
    cap.push(P(t.u + d.u * rt * Math.cos(a) * (o.padAt ?? 1) + m.u * rt * Math.sin(a), t.v + d.v * rt * Math.cos(a) * (o.padAt ?? 1) + m.v * rt * Math.sin(a)));
  }
  return [...left, ...cap, ...right.reverse()];
}

/** The light carried into the drawing's frame for a placement turned `rot` (rad) on the page, mirrored or not. */
export function localLight(rot: number, mirror = false): Pt {
  const co = Math.cos(-rot);
  const si = Math.sin(-rot);
  const u = LIGHT.u * co - LIGHT.v * si;
  const v = LIGHT.u * si + LIGHT.v * co;
  return P(mirror ? -u : u, v);
}

/** The lit edge of a mass for the light L. */
function rimL(path: SkPath, w: number, L: Pt): SkPath {
  const q = path.copy();
  q.offset(-L.u * w, -L.v * w);
  return op(path, q, PathOp.Difference);
}

type BuiltLayer = { pieces: { path: SkPath; lights: SkPath; darks: SkPath; lo: number; dO: number; nails: SkPath[]; dim: number; dimPath: SkPath; over: SkPath | null }[]; union: SkPath; lines: { path: SkPath; a: Pt; b: Pt; w: number; o: number; even: boolean }[] };

const layerCache = new WeakMap<BHPiece[], BuiltLayer>();
function buildLayer(ps: BHPiece[], lines: BHLine[] = []): BuiltLayer {
  const hit = layerCache.get(ps);
  if (hit) return hit;
  const paths = ps.map((p) => smoothClosed(p.outline, p.tension ?? 0.5));
  const bi = ps.findIndex((p) => p.id === 'body');
  const pieces = ps.map((p, i) => {
    const path = paths[i];
    const lo = p.lights?.[0]?.o ?? 0.28;
    const dO = p.darks?.[0]?.o ?? 0.3;
    // (where this digit lies over an earlier digit of its layer — never the hand's body)
    const earlier = ps.slice(0, i).map((q, j) => (q.id === 'body' ? null : paths[j])).filter((q): q is SkPath => !!q);
    const wantOver = p.edgeOver ?? p.id !== 'body';
    const over = wantOver && earlier.length ? unionOf(...earlier) : null;
    return { path, lights: many((p.lights ?? []).map((s) => s.e)), darks: many((p.darks ?? []).map((s) => s.e)), lo, dO, nails: (p.nails ?? []).map((n) => smoothClosed(nailPoly(n))), dim: p.dim ?? 0, dimPath: bi >= 0 && bi !== i ? op(path, paths[bi], PathOp.Difference) : path, over };
  });
  const union = pieces.length ? unionOf(...pieces.map((p) => p.path)) : Skia.Path.Make();
  const built: BuiltLayer = { pieces, union, lines: lines.map((l) => ({ path: smoothOpen(l.pts), a: l.pts[0], b: l.pts[l.pts.length - 1], w: l.w ?? 0.8, o: l.o ?? 0.75, even: !!l.even })) };
  layerCache.set(ps, built);
  return built;
}

/** The one skin light every piece shares (the approved hands': one fixed span). */
function Fill({ path, span, L }: { path: SkPath; span: { c: Pt; R: number }; L: Pt }) {
  const { HAND } = useLook();
  const n = Math.hypot(L.u, L.v) || 1;
  const { c, R } = span;
  return (
    <Path path={path}>
      <LinearGradient start={vec(c.u + (L.u / n) * R, c.v + (L.v / n) * R)} end={vec(c.u - (L.u / n) * R, c.v - (L.v / n) * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

/** One layer of a drawing, in its own frame (the caller places it). `L`: the light in the drawing's frame. */
export function BowedHandLayer({ art, part, L = LIGHT }: { art: BowedHandArt; part: 'behind' | 'front'; L?: Pt }) {
  const { MAT, NAIL } = useLook();
  const SK = MAT.skin;
  const ps = part === 'behind' ? art.behind : art.front;
  if (!ps.length) return null;
  const B = buildLayer(ps, part === 'behind' ? art.behindLines : art.frontLines);
  const rim = rimL(B.union, 2, L);
  return (
    <Group>
      {B.pieces.map((p, i) => (
        <Group key={i}>
          <Fill path={p.path} span={art.span} L={L} />
          <Group clip={p.path}>
            <Path path={p.lights} color={SK.rim} opacity={p.lo}>
              <Blur mm={2} />
            </Path>
            <Path path={p.darks} color={SK.deep} opacity={p.dO}>
              <Blur mm={1.8} />
            </Path>
            {/* (a farther digit a step deeper — only past the hand's body, fading in softly where it leaves it) */}
            {p.dim > 0 ? (
              <Path path={p.dimPath} color={SK.deep} opacity={p.dim}>
                <Blur mm={2} />
              </Path>
            ) : null}
            {p.nails.map((nl, j) => (
              <Group key={j}>
                <Path path={nl} color={NAIL.fill} opacity={0.62}>
                  <Blur mm={0.3} />
                </Path>
                <Path path={nl} style="stroke" strokeWidth={0.55} color={SK.edge} opacity={0.45} />
              </Group>
            ))}
          </Group>
          {p.over ? (
            <Group clip={p.over}>
              <Path path={p.path} style="stroke" strokeWidth={0.8} strokeJoin="round" color={SK.edge} opacity={0.55}>
                <Blur mm={0.2} />
              </Path>
            </Group>
          ) : null}
        </Group>
      ))}
      <Group clip={B.union}>
        {B.lines.map((l, i) => (
          <Path key={i} path={l.path} style="stroke" strokeWidth={l.w} strokeCap="round" opacity={l.o} color={SK.edge}>
            {l.even ? null : <LinearGradient start={vec(l.a.u, l.a.v)} end={vec(l.b.u, l.b.v)} colors={[SK.edge, `${SK.edge}00`]} positions={[0, 1]} />}
            <Blur mm={0.25} />
          </Path>
        ))}
        <Path path={rim} color={SK.rim} opacity={0.24}>
          <Blur mm={1} />
        </Path>
      </Group>
      <Path path={B.union} style="stroke" strokeWidth={0.9} strokeJoin="round" color={SK.edge} opacity={0.5} />
    </Group>
  );
}

/** The hand's soft shadow on what it holds (drawing frame). */
export function BowedHandCast({ art }: { art: BowedHandArt }) {
  if (!art.cast?.length) return null;
  return (
    <Path path={many(art.cast.map((s) => s.e))} color="#1a0d06" opacity={art.cast[0].o}>
      <Blur mm={2.4} />
    </Path>
  );
}

/** A stand-in for the held thing (the review sheet only: in a lesson the scene paints the real one). */
export function BowedHeld({ art }: { art: BowedHandArt }) {
  return (
    <Group>
      {art.held.map((h, i) => {
        const d = P(h.b.u - h.a.u, h.b.v - h.a.v);
        const n = Math.hypot(d.u, d.v) || 1;
        const x = P((-d.v / n) * h.r, (d.u / n) * h.r);
        const band = Skia.Path.Make();
        band.moveTo(h.a.u + x.u, h.a.v + x.v);
        band.lineTo(h.b.u + x.u, h.b.v + x.v);
        band.lineTo(h.b.u - x.u, h.b.v - x.v);
        band.lineTo(h.a.u - x.u, h.a.v - x.v);
        band.close();
        const cols = h.kind === 'stick' ? ['#e2a070', '#8a3c14', '#3a1604'] : h.kind === 'board' ? ['#45403b', '#1b1917', '#090808'] : ['#e3a052', '#b8621f', '#4a1d06'];
        return (
          <Group key={i}>
            <Path path={band}>
              <LinearGradient start={vec(h.a.u + x.u, h.a.v + x.v)} end={vec(h.a.u - x.u, h.a.v - x.v)} colors={cols} />
            </Path>
            <Path path={band} style="stroke" strokeWidth={0.6} color="#07070a" opacity={0.7} />
          </Group>
        );
      })}
    </Group>
  );
}

/** The whole drawing alone (the review sheet): behind, the held thing, the hand's shadow on it, front. */
export function BowedHandAlone({ art, L = LIGHT, children }: { art: BowedHandArt; L?: Pt; children?: ReactNode }) {
  return (
    <Group>
      <BowedHandLayer art={art} part="behind" L={L} />
      <BowedHeld art={art} />
      {children}
      <BowedHandCast art={art} />
      <BowedHandLayer art={art} part="front" L={L} />
    </Group>
  );
}
