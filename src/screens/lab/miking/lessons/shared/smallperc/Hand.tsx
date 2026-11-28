/**
 * SMALL-PERCUSSION FAMILY — a HAND, drawn. The pose is hands.ts (pure,
 * tested), its forms handForm.ts (pure, tested); this paints them, in the
 * scene's millimetres.
 *
 * FIGURE REALISM PASS, SECOND WAVE (2026-11-23). The owner on the hand-drum
 * hands (2026-11-22, an iPhone shot of the Bongos hand): "look how ugly and
 * poorly shown current human figures are"; then, on the kit drummer, "Hands
 * pass" and "Drummer passes" (2026-11-23). These hands are now painted the way
 * the approved drummer hands are (figureV2/paint.tsx, AuthoredHand):
 *   • ONE FINGER = ONE SHAPE ("i see 9 fingers"): each digit one form, its
 *     root melting into the palm; the separation from its neighbor a soft
 *     cast shadow and one fine edge only where it lies over it;
 *   • skin that models the form with soft light: the hand's one light (no
 *     seam between parts), each form's own cylinder light across its axis, a
 *     soft lit edge; no near-black outline round everything, the silhouette
 *     only a shade darker than the skin;
 *   • knuckle and crease hints kept quiet, a nail only where a nail faces the
 *     viewer (painted with its own digit, so a hidden finger's nail is hidden);
 *   • forearm, wrist and hand ONE tapering form ("check for hand transition to
 *     wrist and arm"): the forearm narrows to the hand's own wrist width and
 *     runs under the palm, no ball at the wrist, no step;
 *   • a sleeve's end is opaque cloth over the forearm ("there is a transparent
 *     circle in the sleeve"): the forearm goes INTO the sleeve (painted under
 *     it), the cuff's rolled near rim lies in front of the wrist and casts a
 *     soft shadow on it; nothing see-through.
 * The skin and sleeve are the approved figure's materials (figureV2/palette).
 *
 * Paths are built once per hand placement (useMemo); nothing moves (D8).
 */
import { useMemo, type ReactNode } from 'react';
import { BlurMask, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { FIGURE_SKIN, NAIL as FIGURE_NAIL } from '../players/PlayerFigure';
import { AnatomicalHand } from '../hand/anatomy/AnatomicalHand';
import type { HandSkeleton, HandView, V3 } from '../players/handModel.ts';
import { LIGHT } from '../figureV2/geom.ts';
import { MAT } from '../figureV2/palette.ts';
import { handForm, WEB, type HandForm } from './handForm.ts';
import { placePt, type HandGeo, type Placement, type Pt } from './hands.ts';

/** The shared figure skin (owner 2026-10-08, HF1), for art that paints its own
 *  small figure parts from this module (the player figure, the egg and clave
 *  sound pages). SKIN_RIM is its contour. The posed hand below wears the
 *  approved figure's skin (figureV2 MAT.skin), the same tone family, richer. */
export const SKIN = FIGURE_SKIN.ramp;
export const SKIN_RIM = FIGURE_SKIN.edge;
/** The nails: the shared figure's own nail tone (art fix round 3, 2026-10-16 —
 *  the skin's near-white rim tone read as white dots on the fingertips at
 *  phone size). */
const NAIL = FIGURE_NAIL.fill;
/** A shirt sleeve (dark slate), lit from the upper left. */
export const SLEEVE = ['#5d6b82', '#3f4b5f', '#262e3b'];
export const SLEEVE_RIM = '#141820';

const SK = MAT.skin;
const SHIRT = MAT.shirt;
/** The hand's one light (as the approved hand): mostly from above. */
const HAND_LIGHT = ['#cfb19b', SK.form[1], SK.form[2], '#7f5d4c'];
const HAND_POS = [0, 0.35, 0.75, 1];
/** Warmer, redder skin at the knuckles and the fingertips (the approved hand's). */
const WARM = '#b8665a';
const SHADOW = '#2a160e';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const union = (a: SkPath, b: SkPath) => Skia.Path.MakeFromOp(a, b, PathOp.Union) ?? a;
const minus = (a: SkPath, b: SkPath) => Skia.Path.MakeFromOp(a, b, PathOp.Difference) ?? a;

/** A smooth closed outline through points (Catmull-Rom as cubics, each handle
 *  no longer than half its segment, so a long side meeting a round tip never
 *  flicks past it) — the approved figure's own smoothing. */
function smoothClosed(raw: readonly Pt[], tension = 0.5): SkPath {
  const p = make();
  const pts = raw.filter((q, i) => {
    const r = raw[(i + raw.length - 1) % raw.length];
    return Math.hypot(q[0] - r[0], q[1] - r[1]) > 0.05;
  });
  const n = pts.length;
  if (n < 3) return p;
  const at = (i: number) => pts[(i + n) % n];
  const k = tension / 3;
  const handle = (du: number, dv: number, seg: number) => {
    const l = Math.hypot(du, dv) * k;
    return l > seg * 0.5 && l > 0 ? (seg * 0.5) / l : 1;
  };
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const a = handle(p2[0] - p0[0], p2[1] - p0[1], seg);
    const b = handle(p3[0] - p1[0], p3[1] - p1[1], seg);
    p.cubicTo(p1[0] + (p2[0] - p0[0]) * k * a, p1[1] + (p2[1] - p0[1]) * k * a, p2[0] - (p3[0] - p1[0]) * k * b, p2[1] - (p3[1] - p1[1]) * k * b, p2[0], p2[1]);
  }
  p.close();
  return p;
}

/** An open smooth curve through points (ends held). */
function smoothOpen(pts: readonly Pt[]): SkPath {
  const p = make();
  const n = pts.length;
  if (n < 2) return p;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    p.cubicTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  return p;
}

/** The lit edge of a form: the form less itself moved away from the light. */
function rimOf(path: SkPath, w: number): SkPath {
  const q = path.copy();
  q.offset(-LIGHT.u * w, -LIGHT.v * w);
  return minus(path, q);
}

function ellipse(c: Pt, rx: number, ry: number, rotDeg: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(-rx, -ry, rx * 2, ry * 2));
  const m = Skia.Matrix();
  m.translate(c[0], c[1]);
  m.rotate((rotDeg * Math.PI) / 180);
  p.transform(m);
  return p;
}

/** The ends of a gradient ACROSS the axis a→b, `w` each side, from the side
 *  that faces the light to the side away from it. */
function across(a: Pt, b: Pt, w: number): [Pt, Pt] {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let n: Pt = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  if (n[0] * LIGHT.u + n[1] * LIGHT.v < 0) n = [-n[0], -n[1]];
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return [
    [m[0] + n[0] * w, m[1] + n[1] * w],
    [m[0] - n[0] * w, m[1] - n[1] * w],
  ];
}

type BuiltPart = {
  name: string;
  kind: 'palm' | 'digit';
  path: SkPath;
  edge: SkPath | null;
  rim: SkPath;
  axis: [Pt, Pt];
  r: number;
  nail: SkPath | null;
  creases: SkPath | null;
  /** A finger seen from the back of the hand: where its own light may show
   *  (`soft`, from just past the knuckle, painted blurred so it begins
   *  softly) and where its lit edge may (`rimClip`, from the web on). */
  grow: { soft: SkPath; rimClip: SkPath } | null;
  /** The soft patch of palm over a digit's root (and its blur). */
  root: SkPath | null;
  rootBlur: number;
};

type Forearm = { from: Pt; w: number; sleeve?: number };
/** A sleeve's end: its center and half-width (the cloth's outer edge). */
type Cuff = { c: Pt; r: number };

type Built = {
  form: HandForm;
  parts: BuiltPart[];
  hand: SkPath;
  box: { x: number; y: number; width: number; height: number };
  lights: SkPath;
  darks: SkPath;
  warm: SkPath;
  tendons: SkPath;
  sleeve: null | {
    path: SkPath;
    rim: SkPath;
    axis: [Pt, Pt];
    w: number;
    rimLine: SkPath;
    seam: SkPath;
    shadow: SkPath;
  };
  s: number;
};

/** The forearm into the wrist: one tapering form, its sides landing on the
 *  hand's own wrist edges and running on under the palm (no step, no ball). */
function forearmSkin(F: HandForm, pl: Placement, forearm: Forearm) {
  const s = pl.scale ?? 1;
  const at = (p: Pt) => placePt(p, pl);
  const wa = at(F.wrist[0]);
  const wb = at(F.wrist[1]);
  const wc: Pt = [(wa[0] + wb[0]) / 2, (wa[1] + wb[1]) / 2];
  const rw = Math.hypot(wa[0] - wb[0], wa[1] - wb[1]) / 2;
  const L = Math.hypot(wc[0] - forearm.from[0], wc[1] - forearm.from[1]) || 1;
  const d: Pt = [(wc[0] - forearm.from[0]) / L, (wc[1] - forearm.from[1]) / L];
  const n: Pt = [-d[1], d[0]];
  // (which wrist edge is on the +n side)
  const [wp, wm] = (wa[0] - wc[0]) * n[0] + (wa[1] - wc[1]) * n[1] > 0 ? [wa, wb] : [wb, wa];
  // toward the elbow the forearm widens gently (≈ 12 % in its last 8 cm)
  const widen = (t: number) => rw * (1 + 0.12 * Math.min(1, (L * (1 - t)) / 80));
  const side = (sg: 1 | -1): Pt[] =>
    [0, 0.4, 0.75].map((t) => {
      const r = widen(t);
      return [forearm.from[0] + d[0] * L * t + n[0] * r * sg, forearm.from[1] + d[1] * L * t + n[1] * r * sg] as Pt;
    });
  const hx: Pt = [Math.cos((pl.angle * Math.PI) / 180) * s, Math.sin((pl.angle * Math.PI) / 180) * s];
  const into = (p: Pt): Pt => [p[0] + hx[0] * 16, p[1] + hx[1] * 16];
  const back: Pt = [forearm.from[0] - d[0] * 10, forearm.from[1] - d[1] * 10];
  return { path: smoothClosed([back, ...side(1), wp, into(wp), into(wm), wm, ...side(-1).reverse()], 0.5), d, n, wc, rw };
}

function rootOf(fade: [Pt, Pt] | null): { root: SkPath | null; rootBlur: number } {
  if (!fade) return { root: null, rootBlur: 0 };
  const r = Math.hypot(fade[1][0] - fade[0][0], fade[1][1] - fade[0][1]);
  const p = make();
  p.addCircle(fade[0][0], fade[0][1], r * 0.85);
  return { root: p, rootBlur: Math.max(1, r * 0.55) };
}

/** The half of the picture past a line across a finger (`d` mm beyond its
 *  knuckle `a` along `dir`, local), as a large quad placed in the view. */
function bandAt(pl: Placement) {
  return (a: Pt, dir: Pt, d: number): SkPath => {
    const n: Pt = [-dir[1], dir[0]];
    const q = (u: number, v: number) => placePt([a[0] + dir[0] * u + n[0] * v, a[1] + dir[1] * u + n[1] * v], pl);
    const p = make();
    const c = [q(d, -40), q(d + 260, -40), q(d + 260, 40), q(d, 40)];
    p.moveTo(c[0][0], c[0][1]);
    for (const k of c.slice(1)) p.lineTo(k[0], k[1]);
    p.close();
    return p;
  };
}

function build(g: HandGeo, pl: Placement, forearm: Forearm | undefined, sleevePath: SkPath | null, cuffIn: Cuff | null): Built {
  const F = handForm(g);
  const s = pl.scale ?? 1;
  const at = (p: Pt) => placePt(p, pl);
  const arm = forearm ? forearmSkin(F, pl, forearm) : null;
  const thenar = smoothClosed(F.thenar.map(at), 0.5);
  const band = bandAt(pl);
  const parts: BuiltPart[] = F.parts.map((p) => {
    let path = smoothClosed(p.outline.map(at), p.kind === 'palm' ? 0.45 : 0.5);
    // THE PALM is one form with the thumb's root and the forearm: one light, no seam at the wrist.
    if (p.kind === 'palm') {
      // (seen from above the thumb's root is UNDER the back of the hand: not part of its form)
      if (F.view === 'side') path = union(path, thenar);
      if (arm) path = union(path, arm.path);
    }
    let creases: SkPath | null = null;
    if (p.creases.length) {
      creases = make();
      for (const c of p.creases) creases.addPath(smoothOpen(c.map(at)));
    }
    return {
      name: p.name,
      kind: p.kind,
      path,
      edge: p.edge.length > 2 ? smoothOpen(p.edge.map(at)) : null,
      rim: rimOf(path, 2.4 * s),
      axis: [at(p.axis[0]), at(p.axis[1])],
      r: p.r * s,
      nail: p.nail ? smoothClosed(p.nail.map(at), 0.5) : null,
      creases,
      ...rootOf(p.fade ? [at(p.fade[0]), at(p.fade[1])] : null),
      grow: p.grow ? { soft: band(p.grow.at, p.grow.dir, 3), rimClip: band(p.grow.at, p.grow.dir, WEB) } : null,
    };
  });
  // SEEN FROM ABOVE, the back of the hand and its four fingers are ONE form
  // (owner review 2026-11-23: "four sausages stuck onto a palm"): the palm's
  // paint runs on into every finger; each finger's own light begins past the
  // knuckle row, and no edge rounds a finger's root.
  if (F.view === 'back') {
    const palm = parts.find((q) => q.kind === 'palm')!;
    for (const q of parts) if (q.grow) palm.path = union(palm.path, q.path);
    palm.rim = rimOf(palm.path, 2.4 * s);
  }
  let hand = parts[0].path;
  for (const p of parts.slice(1)) hand = union(hand, p.path);
  // The lights, darks and warm spots (one path each: one blur each).
  const rot = (deg: number) => pl.angle + (pl.mirror ? -deg : deg);
  const lights = make();
  for (const l of F.lights) lights.addPath(ellipse(at(l.c), l.rx * s, l.ry * s, rot((l.rot * 180) / Math.PI)));
  const darks = make();
  for (const l of F.darks) darks.addPath(ellipse(at(l.c), l.rx * s, l.ry * s, rot((l.rot * 180) / Math.PI)));
  const warm = make();
  for (const w of F.warm) {
    const c = at(w.c);
    warm.addCircle(c[0], c[1], w.r * s);
  }
  const tendons = make();
  for (const t of F.tendons) tendons.addPath(smoothOpen(t.map(at)));

  // THE SLEEVE: given (the figure's arm, shoulder to cuff), or a sleeve tube
  // on the forearm's far part (`sleeve` mm of it). Its end is the cuff's near
  // rim, a gentle convex edge of opaque cloth lying in front of the wrist.
  let sleeve: Built['sleeve'] = null;
  if (forearm && arm) {
    const { d, n } = arm;
    let path: SkPath | null = sleevePath;
    let cuff: Cuff | null = cuffIn;
    const sl = forearm.sleeve ?? 0;
    if (!path && sl > 0) {
      const c: Pt = [forearm.from[0] + d[0] * sl, forearm.from[1] + d[1] * sl];
      const r0 = (forearm.w + 14) / 2;
      const r1 = (forearm.w + 10) / 2;
      const o = (p: Pt, r: number, sg: number): Pt => [p[0] + n[0] * r * sg, p[1] + n[1] * r * sg];
      const b0: Pt = [forearm.from[0] - d[0] * 30, forearm.from[1] - d[1] * 30];
      path = smoothClosed([o(b0, r0, 1), o(c, r1, 1), o(c, r1, -1), o(b0, r0, -1)], 0.5);
      cuff = { c, r: r1 };
    }
    if (path && cuff) {
      const c = cuff.c;
      const r = cuff.r;
      const bow = r * 0.14;
      // (from one side of the cuff to the other, bowing toward the hand by `bw`, `back0` behind the end)
      const arc = (back0: number, bw: number, k = 0.97): Pt[] => {
        const out: Pt[] = [];
        for (let j = 0; j <= 8; j++) {
          const a = (Math.PI * j) / 8;
          out.push([c[0] - d[0] * back0 + n[0] * Math.cos(a) * r * k + d[0] * Math.sin(a) * bw, c[1] - d[1] * back0 + n[1] * Math.cos(a) * r * k + d[1] * Math.sin(a) * bw]);
        }
        return out;
      };
      // the convex end, made part of the sleeve (a cut sleeve's square end, rounded over)
      const capPts = arc(0, bow, 1).reverse();
      const cap = smoothClosed([[c[0] - d[0] * 8 + n[0] * r, c[1] - d[1] * 8 + n[1] * r], ...capPts, [c[0] - d[0] * 8 - n[0] * r, c[1] - d[1] * 8 - n[1] * r]], 0.5);
      path = union(path, cap);
      sleeve = {
        path,
        rim: rimOf(path, 5),
        axis: [forearm.from, arm.wc],
        w: r * 1.15,
        rimLine: smoothOpen(arc(1.8, bow)),
        seam: smoothOpen(arc(10, bow * 0.85)),
        shadow: smoothOpen(arc(-3, bow * 1.1)),
      };
    }
  }
  const b = hand.getBounds();
  return { form: F, parts, hand, box: { x: b.x, y: b.y, width: b.width, height: b.height }, lights, darks, warm, tendons, sleeve, s };
}

export type HandProps = {
  geo: HandGeo;
  pl: Placement;
  /** The forearm, from the elbow side (view mm) to the wrist (pl.at); a
   *  `sleeve` (mm) covers its far part. */
  forearm?: Forearm;
  /** A sleeve drawn by the caller's figure (shoulder to cuff), painted over
   *  the forearm's far part with its cuff (`cuff`) in front of the wrist. */
  sleevePath?: SkPath | null;
  cuff?: Cuff | null;
  /** The held object, drawn between the fingers behind it and the nearest
   *  finger (or behind the whole hand with heldBehind). */
  held?: ReactNode;
  heldBehind?: boolean;
  /** The thumb on the FAR side of the hand (seen from the little-finger
   *  side): drawn behind the palm, mostly hidden. */
  farThumb?: boolean;
  opacity?: number;
  /** The contour weight (× the default): lighter for a hand drawn large in a
   *  close-up, so its outline stays faint. */
  edge?: number;
};

/** The hand's one light (a fixed span round the hand's center, mostly from
 *  above), shared by every form of the hand: no seam between them. */
function handLight(b: Built) {
  const m: Pt = [b.box.x + b.box.width / 2, b.box.y + b.box.height / 2];
  // (its span the hand's own size: a long, sloping hand is not dark at its low end)
  const R = Math.max(70 * b.s, 0.5 * Math.hypot(b.box.width, b.box.height));
  const Ld = { u: -0.32, v: -0.95 };
  return <LinearGradient start={vec(m[0] + Ld.u * R, m[1] + Ld.v * R)} end={vec(m[0] - Ld.u * R, m[1] - Ld.v * R)} colors={HAND_LIGHT} positions={HAND_POS} />;
}

/** One form of the hand: its cast shadow on what lies under it (the
 *  separation from its neighbor), the hand's one light, its own cylinder
 *  light, a soft lit edge, its creases and nail, and one fine edge where it
 *  lies over another form; the palm's paint laid softly over a digit's root,
 *  so it grows out of the palm. A side view's far fingers (`front` false) are only the mass
 *  behind the nearest finger: the hand's light a step down, their nails. */
/** The palm's own cylinder light across its axis. */
function palmOverlay(palm: BuiltPart) {
  const [s0, e0] = across(palm.axis[0], palm.axis[1], palm.r * 1.1);
  return <LinearGradient start={vec(s0[0], s0[1])} end={vec(e0[0], e0[1])} colors={['rgba(255,238,226,0.20)', 'rgba(255,238,226,0.04)', 'rgba(52,26,16,0.14)', 'rgba(52,26,16,0.34)']} positions={[0, 0.3, 0.7, 1]} />;
}

function PartPaint({ p, b, edgeK, front, palm }: { p: BuiltPart; b: Built; edgeK: number; front: boolean; palm: BuiltPart | null }) {
  const s = b.s;
  const digit = p.kind === 'digit';
  const [s0, e0] = across(p.axis[0], p.axis[1], digit ? p.r * 1.05 : p.r * 1.1);
  const nail = p.nail ? (
    <Group>
      <Path path={p.nail} color={NAIL} opacity={0.22} />
      <Group transform={[{ translateX: -LIGHT.u * 1.1 * s }, { translateY: -LIGHT.v * 1.1 * s }]}>
        <Path path={p.nail} style="stroke" strokeWidth={0.9 * s} color={SK.deep} opacity={0.16} />
      </Group>
      <Path path={p.nail} style="stroke" strokeWidth={0.5 * s} color={SK.edge} opacity={0.16} />
    </Group>
  ) : null;
  if (!front)
    return (
      <Group>
        <Path path={p.path}>{handLight(b)}</Path>
        <Group clip={p.path}>
          <Path path={p.path} color={SHADOW} opacity={0.12} />
          {nail}
        </Group>
      </Group>
    );
  const fingerLight = <LinearGradient start={vec(s0[0], s0[1])} end={vec(e0[0], e0[1])} colors={['rgba(255,238,226,0.30)', 'rgba(255,238,226,0.06)', 'rgba(52,26,16,0.22)', 'rgba(52,26,16,0.5)']} positions={[0, 0.3, 0.7, 1]} />;
  const body = p.grow && palm ? (
    // a finger seen from the back of the hand: the palm's own paint first (no
    // seam), its own cylinder light only past the knuckle, coming in softly
    <Group>
      <Path path={p.path}>{handLight(b)}</Path>
      <Group clip={p.path}>
        <Path path={p.path}>{palmOverlay(palm)}</Path>
        <Path path={p.grow.soft}>
          {fingerLight}
          <BlurMask blur={5 * s} style="normal" />
        </Path>
        <Group clip={p.grow.rimClip}>
          <Path path={p.rim} color={SK.rim} opacity={0.3}>
            <BlurMask blur={1.2 * s} style="normal" />
          </Path>
        </Group>
        {p.creases ? (
          <>
            <Path path={p.creases} style="stroke" strokeWidth={2.2 * s} strokeCap="round" color={SK.deep} opacity={0.12} />
            <Path path={p.creases} style="stroke" strokeWidth={0.7 * s} strokeCap="round" color={SK.edge} opacity={0.22} />
          </>
        ) : null}
        {nail}
      </Group>
      {p.edge ? <Path path={p.edge} style="stroke" strokeWidth={1.1 * edgeK * s} strokeJoin="round" strokeCap="round" color={SK.edge} opacity={0.5} /> : null}
    </Group>
  ) : (
    <Group>
      <Path path={p.path}>{handLight(b)}</Path>
      <Group clip={p.path}>
        <Path path={p.path}>
          {digit ? <LinearGradient start={vec(s0[0], s0[1])} end={vec(e0[0], e0[1])} colors={['rgba(255,238,226,0.30)', 'rgba(255,238,226,0.06)', 'rgba(52,26,16,0.22)', 'rgba(52,26,16,0.5)']} positions={[0, 0.3, 0.7, 1]} /> : palmOverlay(p)}
        </Path>
        <Path path={p.rim} color={SK.rim} opacity={0.3}>
          <BlurMask blur={1.2 * s} style="normal" />
        </Path>
        {p.creases ? (
          <>
            <Path path={p.creases} style="stroke" strokeWidth={2.2 * s} strokeCap="round" color={SK.deep} opacity={0.14} />
            <Path path={p.creases} style="stroke" strokeWidth={0.7 * s} strokeCap="round" color={SK.edge} opacity={0.26} />
          </>
        ) : null}
        {nail}
      </Group>
      {digit && p.edge ? <Path path={p.edge} style="stroke" strokeWidth={1.1 * edgeK * s} strokeJoin="round" strokeCap="round" color={SK.edge} opacity={0.5} /> : null}
    </Group>
  );
  return (
    <Group>
      {p.edge ? (
        <Group clip={b.hand}>
          <Group transform={[{ translateX: -LIGHT.u * 2.4 * s }, { translateY: -LIGHT.v * 2.4 * s }]}>
            <Path path={p.edge} style="stroke" strokeWidth={4.5 * s} strokeCap="round" color={SHADOW} opacity={digit ? 0.48 : 0.32}>
              <BlurMask blur={2.4 * s} style="normal" />
            </Path>
          </Group>
        </Group>
      ) : null}
      {body}
      {p.root && palm ? (
        // THE ROOT: the palm's own paint again, soft-edged, over the digit's
        // root, so the digit grows out of the palm (no plugged-on end)
        <Group clip={p.path}>
          <Path path={p.root}>
            {handLight(b)}
            <BlurMask blur={p.rootBlur} style="normal" />
          </Path>
          <Path path={p.root}>
            {palmOverlay(palm)}
            <BlurMask blur={p.rootBlur} style="normal" />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

export function Hand({ geo, pl, forearm, sleevePath = null, cuff = null, held, heldBehind, farThumb, opacity = 1, edge = 1 }: HandProps) {
  const b = useMemo(() => build(geo, pl, forearm, sleevePath, cuff), [geo, pl, forearm, sleevePath, cuff]);
  const s = b.s;
  const side = b.form.view === 'side';
  // Paint order: far to near; a far thumb goes behind the palm.
  const parts = b.parts;
  const thumb = parts.find((p) => p.name === 'thumb');
  const rest = parts.filter((p) => p !== thumb);
  const palmAt = rest.findIndex((p) => p.kind === 'palm');
  const ordered = farThumb && thumb ? [...rest.slice(0, palmAt), thumb, ...rest.slice(palmAt)] : parts;
  // the held object: just before the nearest finger
  const nearAt = side ? palmAt + 1 : ordered.length - 1;
  const sl = b.sleeve;
  const palm = parts.find((p) => p.kind === 'palm') ?? null;
  return (
    <Group opacity={opacity}>
      {heldBehind ? held : null}
      {ordered.map((p, i) => (
        <Group key={p.name}>
          {!heldBehind && held && i === nearAt ? held : null}
          {/* (a side view's far fingers lie over nothing of the hand: no cast shadow or edge of their own; the silhouette's edge is theirs) */}
          <PartPaint p={p} b={b} edgeK={edge} front={!(side && i < palmAt)} palm={palm} />
          {p.kind === 'palm' && sl ? (
            // the cuff's soft shadow on the wrist, just past its rim
            <Group clip={p.path}>
              <Path path={sl.shadow} style="stroke" strokeWidth={7 * s} strokeCap="round" color={SHADOW} opacity={0.5}>
                <BlurMask blur={3 * s} style="normal" />
              </Path>
            </Group>
          ) : null}
        </Group>
      ))}
      <Group clip={b.hand}>
        <Path path={b.lights} color={SK.rim} opacity={0.2}>
          <BlurMask blur={4 * s} style="normal" />
        </Path>
        <Path path={b.darks} color={SK.deep} opacity={0.26}>
          <BlurMask blur={5 * s} style="normal" />
        </Path>
        <Path path={b.warm} color={WARM} opacity={0.18}>
          <BlurMask blur={3 * s} style="normal" />
        </Path>
        <Path path={b.tendons} style="stroke" strokeWidth={3 * s} strokeCap="round" color={SK.rim} opacity={0.16}>
          <BlurMask blur={1.6 * s} style="normal" />
        </Path>
      </Group>
      {/* the silhouette's edge: only a shade darker than the skin */}
      <Path path={b.hand} style="stroke" strokeWidth={0.9 * edge * s} strokeJoin="round" color={SK.edge} opacity={0.5} />
      {sl ? (
        <Group>
          {/* THE SLEEVE over the forearm's far part: opaque cloth lit across the arm,
              its cuff's rolled near rim and seam (nothing see-through) */}
          <Path path={sl.path}>
            <LinearGradient start={vec(across(sl.axis[0], sl.axis[1], sl.w)[0][0], across(sl.axis[0], sl.axis[1], sl.w)[0][1])} end={vec(across(sl.axis[0], sl.axis[1], sl.w)[1][0], across(sl.axis[0], sl.axis[1], sl.w)[1][1])} colors={SHIRT.form} positions={SHIRT.pos} />
          </Path>
          <Group clip={sl.path}>
            <Path path={sl.rim} color={SHIRT.rim} opacity={0.3}>
              <BlurMask blur={1.6} style="normal" />
            </Path>
            <Path path={sl.seam} style="stroke" strokeWidth={1.2} strokeCap="round" color={SHIRT.deep} opacity={0.45} />
            <Path path={sl.rimLine} style="stroke" strokeWidth={4} strokeCap="round" color={SHIRT.rim} opacity={0.22}>
              <BlurMask blur={0.8} style="normal" />
            </Path>
          </Group>
          <Path path={sl.path} style="stroke" strokeWidth={1} strokeJoin="round" color={SHIRT.edge} opacity={0.6} />
        </Group>
      ) : null}
    </Group>
  );
}

/* ── THE POSED HAND (figure pass 3) ── */

/** Frame H seen from the player's right (u = x, v = y, toward the viewer +z) and from above (u = x, v = z, toward the viewer up). */
export const SIDE_VIEW: HandView = (p) => ({ u: p.x, v: p.y, d: p.z });
export const TOP_VIEW: HandView = (p) => ({ u: p.x, v: p.z, d: -p.y });

/**
 * A hand posed bone by bone (players/handModel.ts; percGrip.ts) drawn at the
 * house standard (PlayerFigure.drawHand3): tapered bones, palm, thenar, the
 * bare wrist along the forearm (`fore`: its picture angle), knuckle creases,
 * nails. `cut`: the plane through what the hand holds — `part` 'behind'
 * paints what lies behind it (before the object), 'front' the rest.
 */
export function Hand3({ sk, view, fore, cut, part = 'all' }: { sk: HandSkeleton; view: HandView; fore?: number; cut?: { p: V3; n: V3 }; part?: 'all' | 'behind' | 'front' }) {
  // Hands redesign 2026-10-24: the one anatomical Miking hand (hand/anatomy) —
  // each finger its own lit form, the palm mass with its knuckle heads, the
  // oval wrist, nails and creases — in place of the single flat silhouette.
  return <AnatomicalHand sk={sk} view={view} fore={fore} cut={cut} part={part} />;
}
