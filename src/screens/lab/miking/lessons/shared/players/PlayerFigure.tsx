/**
 * THE SHARED PLAYER — the drawing (owner art pass 2026-10-05: "the player
 * figure is crude"; clarity pass 2026-10-05: "a flat grey mannequin"). A
 * respectful, neutral, adult figure at TRUE size, drawn from a PlayerPose
 * (playerPose.ts) in the view's millimetres, at the app's illustration
 * standard:
 *   • body masses built as smooth silhouettes — a long-sleeved shirt (collar,
 *     placket, cuffs, a belt), trousers, leather shoes — each limb a tapered
 *     form joined into ONE outline (path union), never tubes and circles;
 *   • FORM from an upper-left light: a gradient across each mass, a crisp lit
 *     crescent on its upper-left edge (the rim light), a soft core shadow on
 *     its lower-right edge, a darker contour; a soft contact shadow where it
 *     rests and where the near arm lies over the instrument;
 *   • clothing FOLDS suggested simply: creases at the inside of each elbow and
 *     knee, a pull fold along each sleeve, the drape from the armpits to the
 *     belt — each a dark crease with a lit edge beside it;
 *   • hands with fingers: knuckles and the gaps between fingers drawn, a
 *     picking hand round a pick, a fretting hand's fingers arched over the
 *     board onto the strings (thumb behind the neck), a hand on a steel bar, a
 *     fist round a stick, a hand curved down onto keys;
 *   • the head drawn AS PART OF THE FIGURE (owner 2026-10-06: the separate
 *     line-art head icon looked "too dissimilar and disjunct"): one skin-tone
 *     mass — skull, ears and the neck into the collar — with the same light,
 *     rim, core shadow and contour as the hands; neutral, no face; an adult
 *     head ≈ 1/7.5 of the standing height (BODY.headH 228 mm) — front, profile
 *     (mirrored for the facing) and from above;
 *   • a muted palette (neighbours recede, charter §6): nothing competes with
 *     the instrument, the zones or the mic.
 *
 * THREE VIEWS: 'front' (face-on), 'above' (plan) and 'side' (profile: the R
 * joints are the near side, the L joints the far side, drawn darker).
 *
 * TWO LAYERS, so the instrument sits between them:
 *   <PlayerBehind/>   legs, torso, head, the far arm;
 *   <PlayerInFront/>  the near arm and the hands.
 * Nothing moves (D8). Paths are built once per pose (cached by the pose
 * object) — the pose comes from the instrument's model, so the hands stay
 * inside the keep-outs the mic is stopped by. The drawing never changes a
 * joint: the same pose, better drawn.
 *
 * API (for any lesson): build a PlayerPose, then
 *   <PlayerBehind pose={pose} />  …the instrument…  <PlayerInFront pose={pose} />
 * Art that builds its own body geometry (the bowed family's 3-D figure, the
 * lute players) paints it with the same look through <FigureMass/> and
 * <FigureHead/>.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { BODY, dist, lerp, poseHit, pt, type Hand, type PlayerPose, type Pt } from './playerPose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

/* ── palette: muted; light from the upper left ── */

export type FigureTone = 'shirt' | 'trousers' | 'skin' | 'shoe' | 'seat';
type ToneDef = { ramp: string[]; rim: string; core: string; edge: string; rimW: number; coreW: number };
/** The shirt: a deep, muted slate blue. Trousers: charcoal. Shoes: dark
 *  leather. Skin: a soft, warm neutral (one muted mid tone, no complexion
 *  singled out). A seat: dark upholstery. */
export const FIGURE_TONES: Record<FigureTone, ToneDef> = {
  shirt: { ramp: ['#76839e', '#55617b', '#3a4357', '#262c3a'], rim: '#c3cde2', core: '#0f121a', edge: '#12151c', rimW: 7, coreW: 30 },
  trousers: { ramp: ['#585c66', '#3c3f47', '#272a30', '#17191d'], rim: '#9aa0ab', core: '#08090b', edge: '#0d0e11', rimW: 7, coreW: 34 },
  skin: { ramp: ['#c3ab98', '#a28977', '#7d6656', '#5a4639'], rim: '#ecdccd', core: '#2b1f18', edge: '#2a201a', rimW: 4.5, coreW: 16 },
  shoe: { ramp: ['#5a4030', '#3a281c', '#22170f', '#120c08'], rim: '#a58a72', core: '#050302', edge: '#070504', rimW: 4, coreW: 14 },
  seat: { ramp: ['#4a4c55', '#2e3036', '#1b1c21', '#0f1013'], rim: '#8d929d', core: '#050506', edge: '#08080a', rimW: 5, coreW: 20 },
};
const SHIRT_LINE = '#161a24';
const CHROME = ['#f2f4f8', '#b9bec8', '#6b707b', '#d4d8df'];
const PICK = ['#7a3a1a', '#4a200c'];

/* ── geometry helpers (build time only) ── */

/** A tapered limb: the hull of two circles (a, ra) and (b, rb). */
function capsule(a: Pt, b: Pt, ra: number, rb: number): SkPath {
  const p = make();
  const d = dist(a, b);
  if (d <= Math.abs(ra - rb) + 0.5) {
    const big = ra >= rb ? { c: a, r: ra } : { c: b, r: rb };
    p.addCircle(big.c.u, big.c.v, big.r);
    return p;
  }
  const th = Math.atan2(b.v - a.v, b.u - a.u);
  const ph = Math.acos((ra - rb) / d);
  const deg = 180 / Math.PI;
  const P = (c: Pt, r: number, ang: number) => [c.u + r * Math.cos(ang), c.v + r * Math.sin(ang)] as const;
  const a1 = P(a, ra, th + ph);
  const b1 = P(b, rb, th + ph);
  const a2 = P(a, ra, th - ph);
  p.moveTo(a1[0], a1[1]);
  p.lineTo(b1[0], b1[1]);
  p.arcToOval(Skia.XYWHRect(b.u - rb, b.v - rb, rb * 2, rb * 2), (th + ph) * deg, -2 * ph * deg, false);
  p.lineTo(a2[0], a2[1]);
  p.arcToOval(Skia.XYWHRect(a.u - ra, a.v - ra, ra * 2, ra * 2), (th - ph) * deg, -(360 - 2 * ph * deg), false);
  p.close();
  return p;
}

/** A chain of tapered segments through joints with radii, as one outline. */
export function limb(pts: Pt[], rs: number[]): SkPath {
  let out: SkPath | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = capsule(pts[i], pts[i + 1], rs[i], rs[i + 1]);
    out = out ? Skia.Path.MakeFromOp(out, c, PathOp.Union) ?? out : c;
  }
  return out ?? make();
}

function union(...ps: (SkPath | null)[]): SkPath {
  let out: SkPath | null = null;
  for (const p of ps) {
    if (!p) continue;
    out = out ? Skia.Path.MakeFromOp(out, p, PathOp.Union) ?? out : p;
  }
  return out ?? make();
}

/** A smooth closed outline through points (Catmull-Rom as cubics). */
function smooth(points: Pt[], tension = 0.5): SkPath {
  const p = make();
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  p.moveTo(points[0].u, points[0].v);
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 3;
    p.cubicTo(p1.u + (p2.u - p0.u) * k, p1.v + (p2.v - p0.v) * k, p2.u - (p3.u - p1.u) * k, p2.v - (p3.v - p1.v) * k, p2.u, p2.v);
  }
  p.close();
  return p;
}

/** An open smooth stroke through points (Catmull-Rom, ends held). */
function curve(points: Pt[]): SkPath {
  const p = make();
  p.moveTo(points[0].u, points[0].v);
  if (points.length === 2) {
    p.lineTo(points[1].u, points[1].v);
    return p;
  }
  const n = points.length;
  const at = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = 1 / 6;
    p.cubicTo(p1.u + (p2.u - p0.u) * k, p1.v + (p2.v - p0.v) * k, p2.u - (p3.u - p1.u) * k, p2.v - (p3.v - p1.v) * k, p2.u, p2.v);
  }
  return p;
}

/** A point in a hand's own frame (x along the hand from the wrist, y across). */
const local = (h: Hand) => {
  const c = Math.cos(h.dir);
  const s = Math.sin(h.dir);
  return (x: number, y: number): Pt => pt(h.wrist.u + x * c - y * s, h.wrist.v + x * s + y * c);
};

/** A crease across a limb at `at`, perpendicular to the a→b direction. */
function crease(a: Pt, b: Pt, at: number, half: number, bow: number): SkPath {
  const c = lerp(a, b, at);
  const th = Math.atan2(b.v - a.v, b.u - a.u);
  const nx = -Math.sin(th);
  const ny = Math.cos(th);
  const tx = Math.cos(th);
  const ty = Math.sin(th);
  return curve([pt(c.u - nx * half, c.v - ny * half), pt(c.u + tx * bow, c.v + ty * bow), pt(c.u + nx * half, c.v + ny * half)]);
}

/* ── the look of one mass: crescents built once per path ── */

type Look = { rim: SkPath; core: SkPath };
const lookCache = new WeakMap<SkPath, Map<string, Look>>();
/** The lit crescent (upper left) and the core-shadow crescent (lower right)
 *  of a mass: the path minus itself shifted along the light. */
function lookOf(path: SkPath, tone: FigureTone): Look {
  let byTone = lookCache.get(path);
  if (!byTone) {
    byTone = new Map();
    lookCache.set(path, byTone);
  }
  const hit = byTone.get(tone);
  if (hit) return hit;
  const t = FIGURE_TONES[tone];
  const shifted = (dx: number, dy: number) => {
    const q = path.copy();
    q.offset(dx, dy);
    return q;
  };
  const rim = Skia.Path.MakeFromOp(path, shifted(t.rimW * 0.8, t.rimW), PathOp.Difference) ?? make();
  const core = Skia.Path.MakeFromOp(path, shifted(-t.coreW * 0.75, -t.coreW), PathOp.Difference) ?? make();
  const look = { rim, core };
  byTone.set(tone, look);
  return look;
}

/**
 * One body mass at the house figure standard: the tone's gradient for form,
 * the core shadow (soft, lower right), the lit rim (crisp, upper left), the
 * contour. `far`: the far limb in a profile, a little darker. Shared with the
 * art that builds its own figure geometry (bowed, lutes).
 */
export function FigureMass({ path, tone, far = false, contour = 2.2 }: { path: SkPath; tone: FigureTone; far?: boolean; contour?: number }) {
  const t = FIGURE_TONES[tone];
  const look = useMemo(() => lookOf(path, tone), [path, tone]);
  const b = useMemo(() => path.getBounds(), [path]);
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={t.ramp} positions={[0, 0.38, 0.72, 1]} />
      </Path>
      <Group clip={path}>
        <Path path={look.core} color={t.core} opacity={0.55}>
          <BlurMask blur={t.coreW * 0.45} style="normal" />
        </Path>
      </Group>
      <Path path={look.rim} opacity={0.7}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.7, b.y + b.height * 0.7)} colors={[t.rim, 'rgba(255,255,255,0)']} />
      </Path>
      {far ? <Path path={path} color="#000" opacity={0.3} /> : null}
      <Path path={path} style="stroke" strokeWidth={contour} color={t.edge} opacity={0.95} />
    </Group>
  );
}

/** Creases: a dark fold line with a lit edge just above-left of it. */
function Folds({ path, light, width = 2.6, clip }: { path: SkPath; light: string; width?: number; clip?: SkPath }) {
  return (
    <Group clip={clip}>
      <Group transform={[{ translateX: -1.6 }, { translateY: -2.2 }]}>
        <Path path={path} style="stroke" strokeWidth={width * 0.7} strokeCap="round" color={light} opacity={0.32} />
      </Group>
      <Path path={path} style="stroke" strokeWidth={width} strokeCap="round" color={SHIRT_LINE} opacity={0.62} />
    </Group>
  );
}

/* ── heads (house line-art spec) ── */

export type HeadPaths = { line: SkPath; fill: SkPath };

/** The front-view head, centred on c, height ≈ 2r; the neck down to neckV. */
export function headFront(c: Pt, r: number, neckV: number): HeadPaths {
  const k = r / 110;
  const P = (x: number, y: number) => pt(c.u + x * k, c.v + y * k);
  const right = [P(0, -118), P(52, -108), P(77, -70), P(81, -26), P(77, 8), P(71, 42), P(58, 75), P(34, 99), P(0, 108)];
  const outline = [...right, ...right.slice(1, -1).reverse().map((q) => pt(2 * c.u - q.u, q.v))];
  const skull = smooth(outline, 0.55);
  const line = make();
  line.addPath(skull);
  // The neck: a thick, squared column from the jaw to the collar.
  const nb = (neckV - c.v) / k;
  line.addPath(curve([P(-44, 82), P(-47, nb * 0.6), P(-52, nb)]));
  line.addPath(curve([P(44, 82), P(47, nb * 0.6), P(52, nb)]));
  // Ears: an outer helix and a small inner fold, each side.
  for (const s of [-1, 1]) {
    line.addPath(curve([P(s * 78, -6), P(s * 94, -4), P(s * 95, 22), P(s * 86, 44), P(s * 74, 46)]));
    line.addPath(curve([P(s * 84, 6), P(s * 88, 20), P(s * 82, 30)]));
    // Brows.
    line.addPath(curve([P(s * 14, -16), P(s * 30, -24), P(s * 50, -16)]));
    // Nose: a bridge line each side to a small nostril curl.
    line.addPath(curve([P(s * 7, -6), P(s * 9, 18), P(s * 11, 30)]));
    line.addPath(curve([P(s * 4, 38), P(s * 13, 38), P(s * 15, 31)]));
  }
  // Mouth: two strokes.
  line.addPath(curve([P(-22, 60), P(0, 56), P(22, 60)]));
  line.addPath(curve([P(-11, 69), P(0, 73), P(11, 69)]));
  // The silhouette the figure draws (FigureHead): the skull, both ears and the
  // neck down into the collar, one outline.
  const ears = [-1, 1].map((s) => smooth([P(s * 70, -10), P(s * 90, -8), P(s * 96, 14), P(s * 88, 40), P(s * 70, 44)], 0.6));
  const fill = union(skull, ...ears, capsule(P(0, 80), P(0, nb - 6), 46 * k, 50 * k));
  return { line, fill };
}

/**
 * The PROFILE head (house spec: authored facing LEFT, mirrored for a right-
 * facing figure): a full cranium wide at the back, a gentle forehead, a small
 * brow notch, a straight bridge to a defined tip with the nostril undercut,
 * the lips, a chin tucking under, the jaw sweeping back and up to the ear, a
 * thick squared neck column, one ear mid-skull. `facing` +1 = toward +u.
 */
export function headProfile(c: Pt, r: number, neckV: number, facing: number): HeadPaths {
  const k = r / 110;
  const s = facing >= 0 ? -1 : 1; // authored facing −u
  const P = (x: number, y: number) => pt(c.u + s * x * k, c.v + y * k);
  // The silhouette from the nape over the crown to the chin (open: the neck
  // closes it).
  const back = [P(58, 96), P(84, 66), P(102, 18), P(100, -36), P(80, -86), P(40, -114), P(-6, -120), P(-46, -106), P(-70, -78)];
  const face = [P(-70, -78), P(-80, -44), P(-82, -30), P(-77, -21), P(-83, -9), P(-92, 8), P(-102, 24), P(-90, 32), P(-82, 33), P(-85, 45), P(-80, 52), P(-84, 60), P(-76, 70), P(-72, 84), P(-60, 94), P(-40, 98)];
  const line = make();
  line.addPath(curve(back));
  line.addPath(curve(face));
  // The jaw: from under the chin back and up toward the ear.
  line.addPath(curve([P(-40, 98), P(-4, 92), P(22, 76), P(30, 52)]));
  // The neck column.
  const nb = (neckV - c.v) / k;
  line.addPath(curve([P(-38, 98), P(-42, (98 + nb) / 2), P(-48, nb)]));
  line.addPath(curve([P(58, 96), P(62, (96 + nb) / 2), P(68, nb)]));
  // The ear: an outer helix oval and a small inner fold.
  line.addPath(smooth([P(18, -14), P(40, -18), P(50, 6), P(44, 34), P(24, 40), P(16, 18)], 0.6));
  line.addPath(curve([P(28, -2), P(38, 6), P(34, 22), P(26, 24)]));
  // The brow stroke above the notch.
  line.addPath(curve([P(-76, -30), P(-60, -36), P(-44, -32)]));
  const fill = union(smooth([...back, ...face.slice(1), P(-4, 96)], 0.5), capsule(P(10, 96), P(10, nb - 6), 52 * k, 58 * k));
  return { line, fill };
}

/** The head from above: the cranium, the ears, the nose's tip toward +v. */
export function headAbove(c: Pt, r: number): HeadPaths {
  const k = r / 110;
  const P = (x: number, y: number) => pt(c.u + x * k, c.v + y * k);
  const skull = smooth([P(0, -98), P(62, -80), P(80, -10), P(70, 60), P(36, 92), P(0, 98), P(-36, 92), P(-70, 60), P(-80, -10), P(-62, -80)], 0.55);
  const line = make();
  line.addPath(skull);
  for (const s of [-1, 1]) line.addPath(curve([P(s * 78, -14), P(s * 94, 0), P(s * 92, 22), P(s * 76, 30)]));
  line.addPath(curve([P(-12, 92), P(0, 114), P(12, 92)]));
  // Seen from above: the cranium, the ears and the tip of the nose.
  const ears = [-1, 1].map((s) => smooth([P(s * 72, -16), P(s * 92, -6), P(s * 94, 18), P(s * 78, 30)], 0.6));
  const nose = smooth([P(-12, 88), P(0, 114), P(12, 88)], 0.5);
  return { line, fill: union(skull, ...ears, nose) };
}

/**
 * The figure's HEAD, drawn as part of the same figure (owner 2026-10-06, on
 * the Pixel: "on human figures do not replace the head with the separate head
 * icon, they look too dissimilar and disjunct"). The head's silhouette — the
 * skull, the ears and the neck that joins it to the collar, one outline — is
 * one more body MASS in the skin tone: the same gradient, rim light, core
 * shadow and contour as the hands, so it reads as the same person. No face is
 * drawn (a neutral figure); a profile reads by its silhouette. The house
 * line-art head icon (reference_head_icon_spec) stays for avatars, not here.
 */
export function FigureHead({ fill }: { fill: SkPath }) {
  return <FigureMass path={fill} tone="skin" contour={2.6} />;
}

/* ── hands ── */

type HandShape = { path: SkPath; lines: SkPath; pick: SkPath | null; bar: SkPath | null; thumbBehind: SkPath | null };

/** A hand (in its own frame), as one outline plus its knuckle and finger
 *  lines; `pick` adds a pick's tip. Exported for art with its own figure. */
export function handShape(h: Hand): HandShape {
  const L = local(h);
  const W = BODY.handW / 2;
  const lines = make();
  if (h.kind === 'pick' || h.kind === 'grip') {
    // A loose fist: the palm, the curled fingers' knuckles, the thumb along
    // the top (holding the pick against the side of the index finger, or
    // wrapped round a stick).
    const palm = smooth([L(0, -W * 0.72), L(60, -W * 0.95), L(98, -W * 0.82), L(112, -W * 0.2), L(108, W * 0.55), L(82, W * 0.92), L(36, W * 0.86), L(0, W * 0.7)], 0.6);
    const ys = [-0.62, -0.2, 0.22, 0.6];
    const knuckles = ys.map((y, i) => capsule(L(96 - i * 3, y * W), L(118 - i * 6, y * W * 1.02), 13, 12));
    const thumb = capsule(L(38, -W * 0.9), L(104, -W * 0.98), 15, 12);
    // The gaps between the curled fingers, and the knuckle line.
    for (let i = 0; i < 3; i++) {
      const y = ((ys[i] + ys[i + 1]) / 2) * W;
      lines.addPath(curve([L(100 - i * 3, y), L(118 - i * 5, y * 1.02)]));
    }
    lines.addPath(curve([L(84, -W * 0.7), L(90, 0), L(80, W * 0.78)]));
    // The thumb's crease.
    lines.addPath(curve([L(60, -W * 0.82), L(74, -W * 0.92)]));
    let pick: SkPath | null = null;
    if (h.kind === 'pick') {
      const tip = L(122, -W * 1.08);
      pick = make();
      const a = L(110, -W * 1.2);
      const b = L(114, -W * 0.76);
      pick.moveTo(a.u, a.v);
      pick.lineTo(b.u, b.v);
      pick.lineTo(tip.u + Math.cos(h.dir) * 14, tip.v + Math.sin(h.dir) * 14);
      pick.close();
    }
    return { path: union(palm, thumb, ...knuckles), lines, pick, bar: null, thumbBehind: null };
  }
  if (h.kind === 'fret' && h.board) {
    // The back of the hand below the neck, the fingers arching over the
    // board's edge onto the strings just behind four frets; the thumb's tip
    // shows over the top edge (it is behind the neck).
    const bd = h.board;
    const lowEdge = bd.v + bd.half;
    const tips = bd.tips;
    // Fingertips on the strings (index on a middle string, the others
    // spread across), each finger curled: knuckle below the board's edge, the
    // middle joint over the edge, the tip down onto its string.
    const tipVs = [-0.3, 0.05, 0.32, -0.08].map((t) => bd.v + t * bd.half);
    const knuckleV = lowEdge + 16;
    const lo = Math.min(...tips);
    const hi = Math.max(...tips);
    const palm = smooth(
      [
        pt(h.wrist.u - 34, h.wrist.v + 4),
        pt(lo - 6, knuckleV + 30),
        pt(lo - 2, knuckleV + 2),
        pt((lo + hi) / 2, knuckleV - 6),
        pt(hi + 4, knuckleV),
        pt(hi + 14, knuckleV + 26),
        pt(h.wrist.u + 30, h.wrist.v - 2),
      ],
      0.55,
    );
    const fingers = tips.map((tu, i) => {
      const ku = tu + 4 + (i - 1.5) * 1.5;
      const k = pt(ku, knuckleV);
      const mid = pt(tu + 3, lowEdge + 1);
      const tip = pt(tu, tipVs[i]);
      const r = i === 3 ? 6.4 : 7.4;
      // The middle joint's crease and the nail's edge at the tip.
      lines.addPath(crease(k, mid, 0.85, r * 0.8, 2));
      lines.addPath(crease(mid, tip, 0.78, r * 0.55, -1.5));
      return limb([k, mid, tip], [r + 1.6, r + 0.4, r - 0.8]);
    });
    // The knuckle row across the back of the hand.
    lines.addPath(curve([pt(lo - 4, knuckleV + 10), pt((lo + hi) / 2, knuckleV + 4), pt(hi + 8, knuckleV + 10)]));
    const tu = (tips[0] + tips[1]) / 2 + 10;
    const thumb = capsule(pt(tu - 8, bd.v - bd.half + 6), pt(tu + 6, bd.v - bd.half - 14), 11, 10);
    return { path: union(palm, ...fingers), lines, pick: null, bar: null, thumbBehind: thumb };
  }
  if (h.kind === 'bar' && h.board) {
    // A steel bar across the strings, the hand resting over it, the fingers
    // curled down in front.
    const bu = h.board.tips[0];
    const bv = h.board.v;
    const bar =
      h.board.half > 20
        ? capsule(pt(bu, bv - h.board.half), pt(bu, bv + h.board.half), 11, 11)
        : (() => {
            const p = make();
            p.addCircle(bu, bv, h.board.half);
            return p;
          })();
    const centre = h.board.half > 20 ? pt(bu + 8, bv - 2) : pt(bu, bv - 34);
    const palm = limb([h.wrist, lerp(h.wrist, centre, 0.55), centre], [31, 38, 36]);
    const fingersEnd = h.board.half > 20 ? pt(bu + 48, bv + 24) : pt(bu + 34, bv + 6);
    const fingers = limb([pt(centre.u + 18, centre.v - 6), fingersEnd], [17, 13]);
    lines.addPath(crease(pt(centre.u + 18, centre.v - 6), fingersEnd, 0.35, 12, 2));
    lines.addPath(crease(pt(centre.u + 18, centre.v - 6), fingersEnd, 0.7, 10, 2));
    return { path: union(palm, fingers), lines, pick: null, bar, thumbBehind: null };
  }
  if (h.kind === 'keys') {
    // Seen from the side: the back of the hand arched over the keys, the
    // fingers curving down to the key tops, the thumb along the near edge.
    const palm = smooth([L(0, -W * 0.42), L(56, -W * 0.62), L(104, -W * 0.5), L(118, -W * 0.05), L(100, W * 0.42), L(48, W * 0.48), L(0, W * 0.4)], 0.6);
    const fingers = limb([L(100, -W * 0.3), L(146, -W * 0.05), L(170, W * 0.5)], [17, 14, 11]);
    lines.addPath(crease(L(100, -W * 0.3), L(146, -W * 0.05), 0.15, 13, 2));
    lines.addPath(crease(L(146, -W * 0.05), L(170, W * 0.5), 0.1, 11, 2));
    const thumb = capsule(L(30, W * 0.3), L(96, W * 0.62), 14, 11);
    return { path: union(palm, fingers, thumb), lines, pick: null, bar: null, thumbBehind: null };
  }
  // 'above' / 'rest': the hand seen from its back, fingers together.
  const palm = smooth([L(0, -W * 0.62), L(70, -W * 0.92), L(118, -W * 0.7), L(150, -W * 0.25), L(152, W * 0.28), L(122, W * 0.72), L(66, W * 0.9), L(0, W * 0.64)], 0.6);
  const thumb = capsule(L(30, -W * 0.8), L(82, -W * 1.18), 15, 12);
  // The gaps between the four fingers and the knuckle row.
  for (const y of [-0.42, 0.02, 0.44]) lines.addPath(curve([L(112, y * W * 0.9), L(150, y * W * 0.62)]));
  lines.addPath(curve([L(100, -W * 0.74), L(108, 0), L(100, W * 0.74)]));
  return { path: union(palm, thumb), lines, pick: null, bar: null, thumbBehind: null };
}

/* ── the parts ── */

type Mass = { path: SkPath; tone: FigureTone; far?: boolean };

type Built = {
  behind: Mass[];
  front: Mass[];
  shoes: Mass[];
  foldsBehind: { path: SkPath; light: string; clip?: SkPath }[];
  foldsFront: { path: SkPath; light: string }[];
  handLines: SkPath;
  shirtLines: SkPath;
  shirtLinesFront: SkPath;
  buttons: Pt[];
  belt: SkPath | null;
  head: HeadPaths;
  bars: { path: SkPath; box: { u0: number; v0: number; u1: number; v1: number } }[];
  pick: SkPath | null;
  shadow: SkPath | null;
  strap: SkPath | null;
};

const boxOf = (p: SkPath) => {
  const b = p.getBounds();
  return { u0: b.x, v0: b.y, u1: b.x + b.width, v1: b.y + b.height };
};

const SHIRT_LIGHT = FIGURE_TONES.shirt.rim;
const TROUSER_LIGHT = FIGURE_TONES.trousers.rim;

/** Several open strokes as one path (never a PathOp: those fill). */
function joined(...ps: SkPath[]): SkPath {
  const p = make();
  for (const q of ps) p.addPath(q);
  return p;
}

/** Sleeve folds for one arm, kept few and soft: one crease at the inside
 *  of the elbow, one pull fold down the forearm from it. */
function sleeveFolds(_s: Pt, e: Pt, w: Pt): SkPath {
  const p = make();
  p.addPath(crease(e, w, 0.08, BODY.elbowR * 0.42, 4));
  const th = Math.atan2(w.v - e.v, w.u - e.u);
  const off = BODY.elbowR * 0.18;
  const a = lerp(e, w, 0.16);
  const b = lerp(e, w, 0.42);
  p.addPath(curve([pt(a.u - Math.sin(th) * off, a.v + Math.cos(th) * off), pt(b.u - Math.sin(th) * off * 0.3, b.v + Math.cos(th) * off * 0.3)]));
  return p;
}

/** Trouser folds for one leg: a soft crease below the knee, a short one down
 *  the shin. */
function legFolds(_h: Pt, k: Pt, a: Pt): SkPath {
  const p = make();
  p.addPath(crease(k, a, 0.16, BODY.kneeR * 0.45, 6));
  p.addPath(curve([lerp(k, a, 0.34), lerp(k, a, 0.66)]));
  return p;
}

function buildFront(pose: PlayerPose): Built {
  const n = pose.neck;
  const sR = pose.shoulderR;
  const sL = pose.shoulderL;
  const hipV = (pose.hipR.v + pose.hipL.v) / 2;
  const waistV = n.v + (hipV - n.v) * 0.68;
  // The shirt's body: shoulders sloping from the collar, rounded deltoids,
  // a chest tapering to the waist, the hem over the hips.
  const torso = smooth(
    [
      pt(n.u - 50, n.v - 6),
      pt(sR.u + 40, sR.v - 24),
      pt(sR.u - 26, sR.v + 8),
      pt(sR.u - 34, sR.v + 70),
      pt(sR.u + 14, sR.v + 170),
      pt(n.u - BODY.waistHalf, waistV),
      pt(pose.hipR.u - 62, hipV + 8),
      pt(n.u, hipV + 30),
      pt(pose.hipL.u + 62, hipV + 8),
      pt(n.u + BODY.waistHalf, waistV),
      pt(sL.u - 14, sL.v + 170),
      pt(sL.u + 34, sL.v + 70),
      pt(sL.u + 26, sL.v + 8),
      pt(sL.u - 40, sL.v - 24),
      pt(n.u + 50, n.v - 6),
      pt(n.u, n.v + 14),
    ],
    0.5,
  );
  // The fretting arm (behind the neck): upper arm and forearm, one sleeve.
  const armL = limb([sL, pose.elbowL, pose.handL.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  // The picking arm (over the body).
  const armR = limb([pt(sR.u + 6, sR.v + 6), pose.elbowR, pose.handR.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  // Legs: thighs toward the viewer (seated: the lap and the knees), shins
  // down to the shoes.
  const seated = pose.posture !== 'standing';
  const ankle = (f: Pt) => pt(f.u, f.v - 74);
  const legR = seated ? limb([pose.hipR, pose.kneeR, ankle(pose.footR)], [BODY.thighR, BODY.kneeR, BODY.ankleR]) : limb([pose.hipR, pose.kneeR, ankle(pose.footR)], [BODY.thighR, BODY.kneeR - 4, BODY.ankleR]);
  const legL = seated ? limb([pose.hipL, pose.kneeL, ankle(pose.footL)], [BODY.thighR, BODY.kneeR, BODY.ankleR]) : limb([pose.hipL, pose.kneeL, ankle(pose.footL)], [BODY.thighR, BODY.kneeR - 4, BODY.ankleR]);
  const pelvis = smooth([pt(pose.hipR.u - 70, hipV - 40), pt(pose.hipL.u + 70, hipV - 40), pt(pose.hipL.u + 74, hipV + 30), pt(n.u, hipV + 56), pt(pose.hipR.u - 74, hipV + 30)], 0.5);
  const trousers = union(pelvis, legR, legL);
  const shoes = [pose.footR, pose.footL].map((f, i) => {
    const s = i === 0 ? -1 : 1;
    return smooth([pt(f.u - 52, f.v - 4), pt(f.u - 46, f.v - 62), pt(f.u, f.v - 80), pt(f.u + 46, f.v - 62), pt(f.u + 54 + s * 6, f.v - 4)], 0.45);
  });
  // Shirt details: the collar, the placket and its buttons, the cuffs.
  const lines = make();
  lines.addPath(curve([pt(n.u - 50, n.v - 6), pt(n.u - 20, n.v + 30), pt(n.u, n.v + 44)]));
  lines.addPath(curve([pt(n.u + 50, n.v - 6), pt(n.u + 20, n.v + 30), pt(n.u, n.v + 44)]));
  lines.addPath(curve([pt(n.u, n.v + 44), pt(n.u + 2, waistV), pt(n.u, hipV + 24)]));
  const buttons = [0.22, 0.5, 0.78].map((t) => pt(n.u + 7, n.v + 60 + (hipV - n.v - 60) * t));
  const cuff = (w: Pt, e: Pt) => {
    const t = 40 / Math.max(40, dist(w, e));
    const c = lerp(w, e, t);
    const a = Math.atan2(e.v - w.v, e.u - w.u) + Math.PI / 2;
    const r = BODY.wristR + 6;
    return curve([pt(c.u - Math.cos(a) * r, c.v - Math.sin(a) * r), pt(c.u + Math.cos(a) * r, c.v + Math.sin(a) * r)]);
  };
  lines.addPath(cuff(pose.handL.wrist, pose.elbowL));
  const linesFront = make();
  linesFront.addPath(cuff(pose.handR.wrist, pose.elbowR));
  // The drape: from under each arm toward the belt.
  const drape = make();
  drape.addPath(curve([pt(sR.u - 20, sR.v + 150), pt(sR.u + 34, waistV - 70), pt(n.u - 70, waistV - 8)]));
  drape.addPath(curve([pt(sL.u + 20, sL.v + 150), pt(sL.u - 34, waistV - 70), pt(n.u + 70, waistV - 8)]));
  drape.addPath(curve([pt(n.u - 40, n.v + 90), pt(n.u - 60, n.v + 160)]));
  // The belt across the waist (the shirt tucked in), over the hips.
  const beltV = hipV - 38;
  const beltBand = make();
  beltBand.addRect(Skia.XYWHRect(pose.hipR.u - 120, beltV - 16, pose.hipL.u - pose.hipR.u + 240, 32));
  const belt = Skia.Path.MakeFromOp(beltBand, torso, PathOp.Intersect) ?? beltBand;
  // The shirt is tucked in: below the belt the trousers show.
  const below = make();
  below.addRect(Skia.XYWHRect(pose.hipR.u - 400, beltV + 12, pose.hipL.u - pose.hipR.u + 800, 600));
  const shirt = Skia.Path.MakeFromOp(torso, below, PathOp.Difference) ?? torso;
  const head = headFront(pose.head.c, pose.head.r, n.v);
  const hR = handShape(pose.handR);
  const hL = handShape(pose.handL);
  const handLines = make();
  handLines.addPath(hR.lines);
  handLines.addPath(hL.lines);
  const behind: Mass[] = [
    { path: trousers, tone: 'trousers' },
    { path: shirt, tone: 'shirt' },
    { path: armL, tone: 'shirt' },
  ];
  if (hL.thumbBehind) behind.push({ path: hL.thumbBehind, tone: 'skin' });
  const front: Mass[] = [
    { path: armR, tone: 'shirt' },
    { path: hR.path, tone: 'skin' },
    { path: hL.path, tone: 'skin' },
  ];
  const bars = [hR.bar, hL.bar].filter((b): b is SkPath => !!b).map((b) => ({ path: b, box: boxOf(b) }));
  // A standing player's strap: from behind the left shoulder down across the
  // chest to the strap button by the neck.
  let strap: SkPath | null = null;
  if (pose.strapTo) {
    const a = pt(sL.u - 46, sL.v - 18);
    const b = pose.strapTo;
    const m = pt((a.u + b.u) / 2 + 26, (a.v + b.v) / 2);
    strap = make();
    strap.addPath(curve([a, m, b]));
  }
  // A soft shadow under the seated player (the chair is not drawn).
  const shadow =
    pose.floor !== null
      ? (() => {
          const p = make();
          p.addOval(Skia.XYWHRect(n.u - 300, pose.floor! - 22, 600, 44));
          return p;
        })()
      : null;
  const foldsBehind = [
    { path: joined(legFolds(pose.hipR, pose.kneeR, ankle(pose.footR)), legFolds(pose.hipL, pose.kneeL, ankle(pose.footL))), light: TROUSER_LIGHT, clip: trousers },
    { path: drape, light: SHIRT_LIGHT, clip: shirt },
    { path: sleeveFolds(sL, pose.elbowL, pose.handL.wrist), light: SHIRT_LIGHT, clip: armL },
  ];
  const foldsFront = [{ path: sleeveFolds(sR, pose.elbowR, pose.handR.wrist), light: SHIRT_LIGHT }];
  return {
    behind,
    front,
    shoes: shoes.map((path) => ({ path, tone: 'shoe' as const })),
    foldsBehind,
    foldsFront,
    handLines,
    shirtLines: lines,
    shirtLinesFront: linesFront,
    buttons,
    belt,
    head,
    bars,
    pick: hR.pick,
    shadow,
    strap,
  };
}

function buildAbove(pose: PlayerPose): Built {
  const n = pose.neck;
  const sR = pose.shoulderR;
  const sL = pose.shoulderL;
  // The shoulders and back from above: a broad rounded girdle, the chest
  // forward (+v), the shoulder blades behind.
  const torso = smooth(
    [
      pt(sR.u - 40, sR.v - 6),
      pt(sR.u - 10, sR.v - 62),
      pt(n.u - 90, n.v - 112),
      pt(n.u + 90, n.v - 112),
      pt(sL.u + 10, sL.v - 62),
      pt(sL.u + 40, sL.v - 6),
      pt(sL.u + 4, sL.v + 56),
      pt(n.u + 120, n.v + 108),
      pt(n.u, n.v + 122),
      pt(n.u - 120, n.v + 108),
      pt(sR.u - 4, sR.v + 56),
    ],
    0.5,
  );
  const armL = limb([sL, pose.elbowL, pose.handL.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  const armR = limb([pt(sR.u + 8, sR.v + 10), pose.elbowR, pose.handR.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  const seated = pose.posture !== 'standing';
  const thighs = seated ? union(limb([pose.hipR, pose.kneeR], [BODY.thighR, BODY.kneeR + 2]), limb([pose.hipL, pose.kneeL], [BODY.thighR, BODY.kneeR + 2])) : null;
  const shoes = [pose.footR, pose.footL].map((f) => smooth([pt(f.u - 44, f.v - 150), pt(f.u + 44, f.v - 150), pt(f.u + 50, f.v - 40), pt(f.u + 30, f.v + 14), pt(f.u - 30, f.v + 14), pt(f.u - 50, f.v - 40)], 0.5));
  const head = headAbove(pose.head.c, pose.head.r);
  const hR = handShape(pose.handR);
  const hL = handShape(pose.handL);
  const handLines = make();
  handLines.addPath(hR.lines);
  handLines.addPath(hL.lines);
  const behind: Mass[] = [];
  if (thighs) behind.push({ path: thighs, tone: 'trousers' });
  behind.push({ path: torso, tone: 'shirt' }, { path: armL, tone: 'shirt' });
  const front: Mass[] = [
    { path: armR, tone: 'shirt' },
    { path: hR.path, tone: 'skin' },
    { path: hL.path, tone: 'skin' },
  ];
  const bars = [hR.bar, hL.bar].filter((b): b is SkPath => !!b).map((b) => ({ path: b, box: boxOf(b) }));
  const lines = make();
  // The collar seen from above, round the base of the neck; the shoulder
  // seams and the shoulder blades' fold.
  lines.addPath(curve([pt(n.u - 70, n.v - 10), pt(n.u, n.v + 34), pt(n.u + 70, n.v - 10)]));
  const blades = make();
  blades.addPath(curve([pt(n.u - 120, n.v - 70), pt(n.u - 40, n.v - 96), pt(n.u + 40, n.v - 96), pt(n.u + 120, n.v - 70)]));
  return {
    behind,
    front,
    shoes: seated ? [] : shoes.map((path) => ({ path, tone: 'shoe' as const })),
    foldsBehind: [
      { path: blades, light: SHIRT_LIGHT, clip: torso },
      { path: sleeveFolds(sL, pose.elbowL, pose.handL.wrist), light: SHIRT_LIGHT, clip: armL },
    ],
    foldsFront: [{ path: sleeveFolds(sR, pose.elbowR, pose.handR.wrist), light: SHIRT_LIGHT }],
    handLines,
    shirtLines: lines,
    shirtLinesFront: make(),
    buttons: [],
    belt: null,
    head,
    bars,
    pick: null,
    shadow: null,
    strap: null,
  };
}

/**
 * THE PROFILE (added 2026-10-05: the pianist, the drummer). R joints are the
 * near side, L the far side (drawn a little darker, behind the body). The
 * torso is built round the hip→neck line with a chest forward and a back
 * behind it; a seated figure's thighs run forward from the hips.
 */
function buildSide(pose: PlayerPose): Built {
  const f = pose.facing ?? 1;
  const n = pose.neck;
  const hip = lerp(pose.hipR, pose.hipL, 0.5);
  // The torso's axis (hip → neck) and its forward normal (toward `facing`).
  const ax = Math.atan2(n.v - hip.v, n.u - hip.u);
  let nu = -Math.sin(ax);
  let nv = Math.cos(ax);
  if (Math.sign(nu || f) !== Math.sign(f)) {
    nu = -nu;
    nv = -nv;
  }
  const along = (t: number, fwd: number) => {
    const c = lerp(hip, n, t);
    return pt(c.u + nu * fwd, c.v + nv * fwd);
  };
  const sh = pose.shoulderR;
  const torso = smooth(
    [
      along(1.02, 46), // the front of the collar
      along(0.86, 104), // the chest
      along(0.6, 112),
      along(0.32, 96), // the belly
      along(0.06, 104), // the lap's front at the hip
      along(-0.1, 40),
      along(-0.06, -128), // the seat
      along(0.24, -118), // the small of the back
      along(0.62, -120), // the shoulder blade
      along(0.9, -92),
      along(1.02, -48), // the nape
    ],
    0.5,
  );
  const seated = pose.posture !== 'standing';
  const ankle = (foot: Pt) => pt(foot.u - f * 40, foot.v - 70);
  const leg = (h: Pt, k: Pt, foot: Pt) => limb([h, k, ankle(foot)], [BODY.thighR, seated ? BODY.kneeR : BODY.kneeR - 4, BODY.ankleR]);
  const legFar = leg(pose.hipL, pose.kneeL, pose.footL);
  const legNear = leg(pose.hipR, pose.kneeR, pose.footR);
  // Shoes in profile: the heel behind the ankle, the toe forward.
  const shoe = (foot: Pt) => smooth([pt(foot.u - f * 96, foot.v - 2), pt(foot.u - f * 100, foot.v - 64), pt(foot.u - f * 44, foot.v - 92), pt(foot.u + f * 40, foot.v - 62), pt(foot.u + f * 140, foot.v - 34), pt(foot.u + f * 150, foot.v - 4)], 0.45);
  const armFar = limb([pose.shoulderL, pose.elbowL, pose.handL.wrist], [BODY.upperArmR - 2, BODY.elbowR, BODY.wristR + 2]);
  const armNear = limb([sh, pose.elbowR, pose.handR.wrist], [BODY.upperArmR, BODY.elbowR, BODY.wristR + 2]);
  const head = headProfile(pose.head.c, pose.head.r, n.v + 10, f);
  const hR = handShape(pose.handR);
  const hL = handShape(pose.handL);
  // Only the near hand's knuckles show (the far hand is behind the body).
  const handLines = hR.lines;
  // Details: the collar, the belt at the waist, the cuff of the near arm.
  const lines = make();
  lines.addPath(curve([along(1.04, -40), along(0.98, 10), along(1.0, 50)]));
  const b0 = along(0.12, 130);
  const b1 = along(0.12, -150);
  const beltPath = (() => {
    const th = Math.atan2(b1.v - b0.v, b1.u - b0.u);
    const ox = -Math.sin(th) * 16;
    const oy = Math.cos(th) * 16;
    const p = make();
    p.moveTo(b0.u + ox, b0.v + oy);
    p.lineTo(b1.u + ox, b1.v + oy);
    p.lineTo(b1.u - ox, b1.v - oy);
    p.lineTo(b0.u - ox, b0.v - oy);
    p.close();
    return Skia.Path.MakeFromOp(p, torso, PathOp.Intersect) ?? p;
  })();
  const linesFront = make();
  const cuffAt = lerp(pose.handR.wrist, pose.elbowR, 40 / Math.max(40, dist(pose.handR.wrist, pose.elbowR)));
  linesFront.addPath(crease(pose.elbowR, pose.handR.wrist, dist(pose.elbowR, cuffAt) / Math.max(1, dist(pose.elbowR, pose.handR.wrist)), BODY.wristR + 6, 3));
  // The drape: from under the arm to the belt, and the chest's fold.
  const drape = make();
  drape.addPath(curve([along(0.78, -40), along(0.5, -10), along(0.2, 20)]));
  drape.addPath(curve([along(0.8, 70), along(0.62, 90)]));
  const shadow =
    pose.floor !== null
      ? (() => {
          const p = make();
          const c = lerp(pose.footR, pose.footL, 0.5);
          p.addOval(Skia.XYWHRect(Math.min(hip.u, c.u) - 160, pose.floor! - 20, Math.abs(c.u - hip.u) + 420, 40));
          return p;
        })()
      : null;
  const behind: Mass[] = [
    { path: legFar, tone: 'trousers', far: true },
    { path: armFar, tone: 'shirt', far: true },
    { path: hL.path, tone: 'skin', far: true },
    { path: torso, tone: 'shirt' },
    { path: legNear, tone: 'trousers' },
  ];
  const front: Mass[] = [
    { path: armNear, tone: 'shirt' },
    { path: hR.path, tone: 'skin' },
  ];
  return {
    behind,
    front,
    shoes: [
      // Barefoot on the floor: the same foot, in skin.
      { path: shoe(pose.footL), tone: pose.posture === 'floor' ? 'skin' : 'shoe', far: true },
      { path: shoe(pose.footR), tone: pose.posture === 'floor' ? 'skin' : 'shoe' },
    ],
    foldsBehind: [
      { path: drape, light: SHIRT_LIGHT, clip: torso },
      { path: legFolds(pose.hipR, pose.kneeR, ankle(pose.footR)), light: TROUSER_LIGHT, clip: legNear },
    ],
    foldsFront: [{ path: sleeveFolds(sh, pose.elbowR, pose.handR.wrist), light: SHIRT_LIGHT }],
    handLines,
    shirtLines: lines,
    shirtLinesFront: linesFront,
    buttons: [],
    belt: beltPath,
    head,
    bars: [],
    pick: hR.pick,
    shadow,
    strap: null,
  };
}

const cache = new WeakMap<PlayerPose, Built>();
function built(pose: PlayerPose): Built {
  let b = cache.get(pose);
  if (!b) {
    b = pose.view === 'front' ? buildFront(pose) : pose.view === 'side' ? buildSide(pose) : buildAbove(pose);
    cache.set(pose, b);
  }
  return b;
}

/**
 * Whether the DRAWN figure covers (u, v), within `tol` mm: the very paths the
 * figure paints (torso, arms, legs, hands, shoes, head) — for the part labels,
 * which keep off the player (engine/scene/artLabels.ts, LessonArt.figureAt).
 * Where Skia's paths cannot answer (the node tests' stand-in), the pose's
 * capsules do (playerPose.poseHit).
 */
export function figureCovers(pose: PlayerPose, u: number, v: number, tol = 0): boolean {
  const b = built(pose);
  const paths = [...b.behind, ...b.front, ...b.shoes].map((m) => m.path).concat(b.head.fill);
  if (typeof paths[0]?.contains !== 'function') return poseHit(pose, u, v, tol);
  const pts = tol > 0 ? [pt(u, v), pt(u - tol, v), pt(u + tol, v), pt(u, v - tol), pt(u, v + tol)] : [pt(u, v)];
  for (const q of pts) for (const p of paths) if (p.contains(q.u, q.v)) return true;
  return false;
}

function Bar({ b }: { b: Built['bars'][number] }) {
  return (
    <Group>
      <Path path={b.path}>
        <LinearGradient start={vec(b.box.u0, b.box.v0)} end={vec(b.box.u1, b.box.v1)} colors={CHROME} />
      </Path>
      <Path path={b.path} style="stroke" strokeWidth={1.4} color="#5d626d" />
    </Group>
  );
}

/** An 'above' pose with a `facing`: turned about the neck so the chest faces
 *  that way (the pose is authored chest toward +v). */
function aboveTurn(pose: PlayerPose) {
  if (pose.view !== 'above' || pose.facing === undefined) return undefined;
  const a = pose.facing - Math.PI / 2;
  return [{ translateX: pose.neck.u }, { translateY: pose.neck.v }, { rotate: a }, { translateX: -pose.neck.u }, { translateY: -pose.neck.v }];
}

/** The player BEHIND the instrument: legs, torso, head, the far arm.
 *  `part` splits it for art that layers by height (a drummer from above: the
 *  legs under the drums, the body over them): 'legs' (trousers, shoes and
 *  the shadow) or 'upper' (the rest); default both. */
export function PlayerBehind({ pose, dim = 1, part = 'all' }: { pose: PlayerPose; dim?: number; part?: 'all' | 'legs' | 'upper' }) {
  const b = built(pose);
  const legs = part !== 'upper';
  const upper = part !== 'legs';
  const isLeg = (tone: FigureTone) => tone === 'trousers' || tone === 'shoe';
  return (
    <Group opacity={dim} transform={aboveTurn(pose)}>
      {legs && b.shadow ? (
        <Path path={b.shadow} color="#000" opacity={0.45}>
          <BlurMask blur={14} style="normal" />
        </Path>
      ) : null}
      {(legs ? b.shoes : [])
        .filter((s) => s.far)
        .map((s, i) => (
          <FigureMass key={`shoeF${i}`} path={s.path} tone={s.tone} far />
        ))}
      {b.behind.map((m, i) => ((isLeg(m.tone) ? legs : upper) ? <FigureMass key={`b${i}`} path={m.path} tone={m.tone} far={m.far} /> : null))}
      {(legs ? b.shoes : [])
        .filter((s) => !s.far)
        .map((s, i) => (
          <FigureMass key={`shoe${i}`} path={s.path} tone={s.tone} />
        ))}
      {b.foldsBehind.map((fo, i) => ((fo.light === TROUSER_LIGHT ? legs : upper) ? <Folds key={`fb${i}`} path={fo.path} light={fo.light} clip={fo.clip} /> : null))}
      {upper ? (
        <>
      <Path path={b.shirtLines} style="stroke" strokeWidth={2.4} strokeCap="round" color={SHIRT_LINE} opacity={0.9} />
      {b.belt ? (
        <>
          <Path path={b.belt}>
            <LinearGradient start={vec(b.belt.getBounds().x, b.belt.getBounds().y)} end={vec(b.belt.getBounds().x, b.belt.getBounds().y + b.belt.getBounds().height)} colors={['#3a2a20', '#1e150f']} />
          </Path>
          <Path path={b.belt} style="stroke" strokeWidth={1.6} color="#0b0806" />
        </>
      ) : null}
      {b.buttons.map((q, i) => (
        <Circle key={`btn${i}`} cx={q.u} cy={q.v} r={4} color="#a7b0c2" opacity={0.85} />
      ))}
      {b.strap ? (
        <>
          <Path path={b.strap} style="stroke" strokeWidth={46} strokeCap="round" color="#141519" opacity={0.95} />
          <Path path={b.strap} style="stroke" strokeWidth={40} strokeCap="round">
            <LinearGradient start={vec(pose.shoulderL.u - 60, pose.shoulderL.v)} end={vec(pose.shoulderL.u + 60, pose.shoulderL.v + 200)} colors={['#6a4528', '#3c2615', '#24170c']} />
          </Path>
          <Path path={b.strap} style="stroke" strokeWidth={2} strokeCap="round" color="#a07850" opacity={0.5} />
        </>
      ) : null}
      {/* the head: house line art over a quiet translucent interior */}
      <FigureHead fill={b.head.fill} />
        </>
      ) : null}
    </Group>
  );
}

/** The player IN FRONT of the instrument: the near arm and the hands.
 *  `hands={false}` (added 2026-10-07 for a standing singer seen from above,
 *  arms hanging: the hands are under the shoulders, out of sight) draws the
 *  near arm only. */
export function PlayerInFront({ pose, dim = 1, hands = true }: { pose: PlayerPose; dim?: number; hands?: boolean }) {
  const b = built(pose);
  const front = hands ? b.front : b.front.filter((m) => m.tone !== 'skin');
  return (
    <Group opacity={dim} transform={aboveTurn(pose)}>
      {b.bars.map((q, i) => (
        <Bar key={`bar${i}`} b={q} />
      ))}
      {front.map((m, i) => (
        <Group key={`f${i}`}>
          {i === 0 ? (
            // The near arm's soft shadow on the instrument under it.
            <Path path={m.path} color="#000" opacity={0.35} transform={[{ translateX: 8 }, { translateY: 12 }]}>
              <BlurMask blur={12} style="normal" />
            </Path>
          ) : null}
          <FigureMass path={m.path} tone={m.tone} far={m.far} />
          {i === 0
            ? b.foldsFront.map((fo, j) => (
                <Folds key={`ff${j}`} path={fo.path} light={fo.light} clip={m.path} />
              ))
            : null}
        </Group>
      ))}
      <Path path={b.shirtLinesFront} style="stroke" strokeWidth={2.4} strokeCap="round" color={SHIRT_LINE} opacity={0.9} />
      {hands ? <Path path={b.handLines} style="stroke" strokeWidth={1.8} strokeCap="round" color={FIGURE_TONES.skin.edge} opacity={0.7} /> : null}
      {hands && b.pick ? (
        <Path path={b.pick}>
          <LinearGradient start={vec(b.pick.getBounds().x, b.pick.getBounds().y)} end={vec(b.pick.getBounds().x + 20, b.pick.getBounds().y + 20)} colors={PICK} />
        </Path>
      ) : null}
    </Group>
  );
}
