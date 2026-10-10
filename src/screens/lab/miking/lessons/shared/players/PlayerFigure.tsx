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
 *   • clothing: shirt and sleeves by their shading alone — no stroked folds
 *     (owner 2026-10-10: crease lines on the arm read as welts); a soft crease
 *     below each knee only;
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
/** THE figure skin (owner 2026-10-08, HF1): the one tone FigureHead wears —
 *  and so every hand, arm and neck drawn on a figure with that head (art that
 *  paints its own limbs: smallperc/cajón hands, low brass, sax, free reed).
 *  A head and its hands never differ. */
export const FIGURE_SKIN = FIGURE_TONES.skin;
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
export function FigureMass({ path, tone, far = false, contour = 2.2, quiet = null }: { path: SkPath; tone: FigureTone; far?: boolean; contour?: number; quiet?: SkPath | null }) {
  const t = FIGURE_TONES[tone];
  const look = useMemo(() => lookOf(path, tone), [path, tone]);
  const b = useMemo(() => path.getBounds(), [path]);
  // `quiet`: where this mass melts into the one behind it (the near arm's top
  // inside the shoulder) — no rim light and no contour there, so the sleeve
  // grows out of the shoulder instead of sitting on it as a knob (owner 2026-10-10).
  const keep = useMemo(() => {
    if (!quiet) return null;
    const r = make();
    r.addRect(Skia.XYWHRect(b.x - 50, b.y - 50, b.width + 100, b.height + 100));
    return Skia.Path.MakeFromOp(r, quiet, PathOp.Difference) ?? null;
  }, [quiet, b]);
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
      {/* The lit edge as a soft glow inside the outline — a crisp strip read
          as a line (a "welt") along sleeves (owner 2026-10-10). */}
      <Group clip={keep ? (Skia.Path.MakeFromOp(path, keep, PathOp.Intersect) ?? path) : path}>
        <Path path={look.rim} opacity={0.55}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.7, b.y + b.height * 0.7)} colors={[t.rim, 'rgba(255,255,255,0)']} />
          <BlurMask blur={t.rimW * 0.9} style="normal" />
        </Path>
      </Group>
      {far ? <Path path={path} color="#000" opacity={0.3} /> : null}
      <Group clip={keep ?? undefined}>
        <Path path={path} style="stroke" strokeWidth={contour} color={t.edge} opacity={0.95} />
      </Group>
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
  const face = [P(-70, -78), P(-80, -44), P(-83, -30), P(-76, -20), P(-84, -6), P(-94, 10), P(-104, 26), P(-92, 33), P(-83, 34), P(-88, 44), P(-81, 52), P(-87, 60), P(-77, 68), P(-81, 80), P(-70, 92), P(-52, 98), P(-36, 100)];
  const line = make();
  line.addPath(curve(back));
  line.addPath(curve(face));
  // The jaw: from under the chin back and up toward the ear.
  line.addPath(curve([P(-36, 100), P(-4, 92), P(22, 76), P(30, 52)]));
  // The neck column.
  const nb = (neckV - c.v) / k;
  line.addPath(curve([P(-34, 100), P(-36, (100 + nb) / 2), P(-30, nb)]));
  line.addPath(curve([P(58, 90), P(66, (90 + nb) / 2), P(78, nb)]));
  // The ear: an outer helix oval and a small inner fold.
  line.addPath(smooth([P(18, -14), P(40, -18), P(50, 6), P(44, 34), P(24, 40), P(16, 18)], 0.6));
  line.addPath(curve([P(28, -2), P(38, 6), P(34, 22), P(26, 24)]));
  // The brow stroke above the notch.
  line.addPath(curve([P(-76, -30), P(-60, -36), P(-44, -32)]));
  // The neck leans forward from the collar to the skull and joins it behind
  // the jaw (under the ear), never as a stalk under the chin.
  const fill = union(smooth([...back, ...face.slice(1), P(-4, 96)], 0.5), capsule(P(12, 84), P(24, nb - 6), 50 * k, 56 * k));
  return { line, fill };
}

/** The head from above: the cranium, the ears, the nose's tip toward +v. */
export function headAbove(c: Pt, r: number): HeadPaths {
  const k = r / 110;
  const P = (x: number, y: number) => pt(c.u + x * k, c.v + y * k);
  const skull = smooth([P(0, -98), P(62, -80), P(80, -10), P(70, 60), P(36, 92), P(0, 98), P(-36, 92), P(-70, 60), P(-80, -10), P(-62, -80)], 0.55);
  const line = make();
  line.addPath(skull);
  for (const s of [-1, 1]) line.addPath(curve([P(s * 76, -12), P(s * 86, -4), P(s * 88, 14), P(s * 78, 24)]));
  line.addPath(curve([P(-12, 92), P(0, 114), P(12, 92)]));
  // Seen from above: the cranium, the ears and the tip of the nose. The ears
  // (owner 2026-10-10: they stood out as lobes wider than the skull) lie
  // close to the skull: ≈ 8 mm out, ≈ 35 mm long, angled a little back.
  const ears = [-1, 1].map((s) => smooth([P(s * 72, -14), P(s * 86, -6), P(s * 88, 14), P(s * 76, 24)], 0.6));
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

/**
 * THE HAND (figure polish 2026-10-10, owner: "high-end drawings everywhere …
 * my peers are my critics" — the old hands were flat mittens). Built from
 * the adult hand's real parts, in its own frame (x along the hand from the
 * wrist crease, y across; −y the thumb side):
 *   • adult hand ≈ 180 mm wrist crease → middle fingertip (≈ 0.79 of the
 *     228 mm head), palm ≈ 100 mm, breadth across the knuckles ≈ 84 mm;
 *   • four fingers, each three phalanges ≈ 45 / 28 / 22 % of its length —
 *     index 70, middle 78, ring 73, little 57 mm — ≈ 22 mm wide at the base,
 *     tapering to ≈ 16 mm at the tip; the knuckles (MCP) on an arc, the
 *     middle finger's furthest out;
 *   • the thumb from the base of the palm (its metacarpal inside the thenar
 *     mass), two phalanges, ≈ 22 mm wide;
 *   • the wrist ≈ 56 mm wide, narrower than the cuff it leaves.
 * Each kind poses those parts round what it holds: a relaxed open hand
 * (back), a fist round a pick or a stick, fingers arched over a fingerboard,
 * fingers curved down onto keys, a hand over a steel bar.
 */
const FINGERS = [
  // knuckle (x, y), splay (rad), phalanges (mm), radii base → tip (mm)
  { x: 95, y: -27, a: -0.07, seg: [32, 20, 16], r: [11.0, 10.2, 9.2, 8.0] },
  { x: 100, y: -8.5, a: -0.02, seg: [35, 22, 18], r: [11.4, 10.6, 9.6, 8.3] },
  { x: 97, y: 9.5, a: 0.04, seg: [33, 21, 17], r: [10.8, 10.0, 9.0, 7.9] },
  { x: 88, y: 26, a: 0.12, seg: [26, 16, 13], r: [9.6, 8.9, 8.0, 7.0] },
] as const;
/** The proximal phalanx of each finger in a fist (mm). */
const FIST_LEN = [33, 36, 34, 28] as const;

/** A digit through joints from (x0, y0) in the hand frame: each phalanx
 *  turned by its bend; returns the outline and the joints. */
function digit(L: (x: number, y: number) => Pt, x0: number, y0: number, a0: number, seg: readonly number[], bends: readonly number[], r: readonly number[]) {
  let x = x0;
  let y = y0;
  let a = a0;
  const joints: Pt[] = [L(x, y)];
  for (let i = 0; i < seg.length; i++) {
    a += bends[i] ?? 0;
    x += Math.cos(a) * seg[i];
    y += Math.sin(a) * seg[i];
    joints.push(L(x, y));
  }
  return { path: limb(joints, [...r]), joints };
}

/** The wrist leaving the cuff: a short tapered column into the palm. */
function wristOf(L: (x: number, y: number) => Pt): SkPath {
  return capsule(L(-22, 0), L(26, 0), 26, 30);
}

/** A hand (in its own frame), as one outline plus its knuckle and finger
 *  lines; `pick` adds a pick's tip. Exported for art with its own figure. */
export function handShape(h: Hand): HandShape {
  const L = local(h);
  const W = BODY.handW / 2;
  const lines = make();
  if (h.kind === 'pick' || h.kind === 'grip') {
    // A loose FIST seen from its back: the palm, the four proximal phalanges
    // running forward to a row of rounded middle knuckles (the rest of each
    // finger folded under, its middle phalanx peeking below), the thumb along
    // the top pressing the pick against the side of the index finger (or
    // wrapped round the stick).
    const palm = smooth([L(-6, -27), L(36, -36), L(78, -40), L(96, -36), L(102, -10), L(100, 14), L(92, 34), L(62, 38), L(24, 32), L(-6, 26)], 0.55);
    const fist = FINGERS.map((f, i) => capsule(L(f.x - 4, f.y), L(f.x - 4 + FIST_LEN[i], f.y + f.a * FIST_LEN[i] * 0.4), f.r[0], f.r[0] + 0.6));
    const folded = FINGERS.map((f, i) => capsule(L(f.x + FIST_LEN[i] - 6, f.y + 7), L(f.x + FIST_LEN[i] - 22, f.y + 11), f.r[0] - 1.4, f.r[0] - 2));
    const thumb = digit(L, 16, -30, -0.5, [40, 30, 24], [0, 0.42, 0.12], [15, 13, 11.5, 9.6]);
    // The gaps between the knuckles of the curled fingers.
    for (let i = 0; i < 3; i++) {
      const f0 = FINGERS[i];
      const f1 = FINGERS[i + 1];
      const y = (f0.y + f1.y) / 2;
      lines.addPath(curve([L(f0.x + 6, y), L(f0.x + 30, y + 1)]));
    }
    // The knuckle row (MCP) across the back, and each middle knuckle's crease.
    lines.addPath(curve([L(92, -36), L(99, -9), L(96, 12), L(86, 32)]));
    FINGERS.forEach((f, i) => {
      const x = f.x + FIST_LEN[i];
      lines.addPath(curve([L(x - 8, f.y - f.r[0] * 0.55), L(x - 3, f.y), L(x - 8, f.y + f.r[0] * 0.55)]));
    });
    // The thumb's joint crease and its nail.
    const tj = thumb.joints;
    lines.addPath(crease(tj[1], tj[2], 0.92, 9, 2));
    lines.addPath(crease(tj[2], tj[3], 0.62, 6, -1.5));
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
    return { path: union(wristOf(L), palm, ...folded, ...fist, thumb.path), lines, pick, bar: null, thumbBehind: null };
  }
  if (h.kind === 'fret' && h.board) {
    // Seen from the front: the heel of the palm below the neck, the fingers
    // rising from a knuckle row ≈ 21 mm apart and FANNING to their frets,
    // each curled — the knuckle below the board's edge, the middle joint over
    // the edge, the tip down on its string; the thumb's tip shows over the top
    // edge (it is behind the neck).
    const bd = h.board;
    const lowEdge = bd.v + bd.half;
    const tips = bd.tips;
    const tipVs = [-0.3, 0.05, 0.32, -0.08].map((t) => bd.v + t * bd.half);
    const knuckleV = lowEdge + 18;
    const lo = Math.min(...tips);
    const hi = Math.max(...tips);
    const cu = (lo + hi) / 2 + 4;
    const dirU = Math.sign(tips[tips.length - 1] - tips[0]) || 1;
    const ku = tips.map((_, i) => cu + (i - 1.5) * 21 * dirU);
    const kLo = Math.min(...ku);
    const kHi = Math.max(...ku);
    const w = h.wrist;
    const palm = smooth(
      [
        pt(w.u - 26, w.v - 2),
        pt(kLo - 14, knuckleV + 30),
        pt(kLo - 8, knuckleV + 2),
        pt(cu, knuckleV - 6),
        pt(kHi + 8, knuckleV + 2),
        pt(kHi + 16, knuckleV + 30),
        pt(w.u + 26, w.v - 2),
        pt(w.u, w.v + 4),
      ],
      0.55,
    );
    const wrist = capsule(w, lerp(w, pt(cu, knuckleV + 20), 0.45), 26, 30);
    const fingers = tips.map((tu, i) => {
      const k = pt(ku[i], knuckleV);
      const mid = pt(lerp(k, pt(tu, 0), 0.62).u, lowEdge + 1);
      const tip = pt(tu, tipVs[i]);
      const f = FINGERS[i] ?? FINGERS[3];
      // The middle joint's crease and the nail's edge at the tip.
      lines.addPath(crease(k, mid, 0.85, f.r[1] * 0.75, 2));
      lines.addPath(crease(mid, tip, 0.78, f.r[2] * 0.6, -1.5));
      return limb([k, mid, tip], [f.r[0], f.r[1], f.r[3] + 0.2]);
    });
    // The knuckle row across the back of the hand.
    lines.addPath(curve([pt(kLo - 6, knuckleV + 12), pt(cu, knuckleV + 6), pt(kHi + 8, knuckleV + 12)]));
    const tu = (tips[0] + tips[1]) / 2 + 10;
    const thumb = capsule(pt(tu - 8, bd.v - bd.half + 6), pt(tu + 6, bd.v - bd.half - 16), 11.5, 10);
    return { path: union(wrist, palm, ...fingers), lines, pick: null, bar: null, thumbBehind: thumb };
  }
  if (h.kind === 'bar' && h.board) {
    // A steel bar across the strings, the hand resting over it, three fingers
    // curled down in front (the fourth behind them).
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
    const palm = limb([h.wrist, lerp(h.wrist, centre, 0.55), centre], [27, 36, 38]);
    const fingersEnd = h.board.half > 20 ? pt(bu + 46, bv + 22) : pt(bu + 32, bv + 6);
    const root = pt(centre.u + 16, centre.v - 6);
    const fingers = [-12, 0, 12].map((o) => {
      const a = pt(root.u, root.v + o);
      const b = pt(fingersEnd.u, fingersEnd.v + o * 0.8);
      return limb([a, lerp(a, b, 0.55), b], [10, 9, 7.5]);
    });
    lines.addPath(crease(root, fingersEnd, 0.55, 16, 2));
    return { path: union(palm, ...fingers), lines, pick: null, bar, thumbBehind: null };
  }
  if (h.kind === 'keys' || h.kind === 'wrap') {
    // Seen from the side: the back of the hand arched over the keys, the
    // fingers curving down at each joint to the key tops (three show, each a
    // little behind the last), the thumb along the near edge. 'wrap': the
    // same fingers curled round a neck or a tube, the thumb behind it. The
    // fingers always curl toward the floor, whichever way the hand points.
    const flip = Math.cos(h.dir) >= 0 ? 1 : -1;
    const K = (x: number, y: number) => L(x, y * flip);
    const palm = smooth([K(-10, -24), K(40, -32), K(92, -26), K(108, -10), K(104, 12), K(60, 22), K(-10, 20)], 0.55);
    const fingers = [
      { dx: 0, dy: 0, k: 1 },
      { dx: -6, dy: -5, k: 0.94 },
      { dx: -13, dy: -9, k: 0.8 },
    ].map((o, i) => {
      const d = digit(K, 98 + o.dx, -12 + o.dy, -0.05, [34 * o.k, 22 * o.k, 17 * o.k], [0.28, 0.6, 0.42], [10, 9.2, 8.2, 7]);
      if (i === 0) {
        lines.addPath(crease(d.joints[0], d.joints[1], 0.95, 8, 2));
        lines.addPath(crease(d.joints[1], d.joints[2], 0.95, 7, 2));
        lines.addPath(crease(d.joints[2], d.joints[3], 0.6, 5, -1.5));
      }
      return d.path;
    });
    lines.addPath(curve([K(96, -24), K(104, -10)]));
    if (h.kind === 'wrap') return { path: union(wristOf(K), palm, ...fingers), lines, pick: null, bar: null, thumbBehind: null };
    const thumb = digit(K, 18, 10, 0.32, [40, 28, 20], [0, -0.2, 0.25], [14, 12, 10.5, 9]);
    return { path: union(wristOf(K), palm, ...fingers, thumb.path), lines, pick: null, bar: null, thumbBehind: null };
  }
  // 'above' / 'rest': the relaxed hand seen from its back — the palm, four
  // fingers lying nearly together (a hair of space between them), slightly
  // fanned, the thumb apart along the side.
  const palm = smooth([L(-6, -26), L(36, -35), L(74, -40), L(95, -37), L(101, -10), L(98, 12), L(88, 33), L(60, 37), L(22, 31), L(-6, 25)], 0.55);
  const fingers = FINGERS.map((f) => digit(L, f.x - 6, f.y, f.a, [f.seg[0] + 6, f.seg[1], f.seg[2]], [0, 0.03, 0.03], f.r));
  const thumb = digit(L, 18, -28, -0.4, [40, 30, 24], [0, 0.24, 0.1], [15.5, 13.5, 11.5, 9.6]);
  // The knuckle row and each finger's two joint creases; the thumb's crease.
  lines.addPath(curve([L(90, -36), L(98, -9), L(95, 11), L(85, 32)]));
  for (const d of fingers) {
    lines.addPath(crease(d.joints[1], d.joints[2], 0.06, 5.5, 1.5));
    lines.addPath(crease(d.joints[2], d.joints[3], 0.08, 4.5, 1.2));
  }
  lines.addPath(crease(thumb.joints[2], thumb.joints[3], 0.06, 7, 1.5));
  return { path: union(wristOf(L), palm, ...fingers.map((d) => d.path), thumb.path), lines, pick: null, bar: null, thumbBehind: null };
}

/* ── the parts ── */

type Mass = { path: SkPath; tone: FigureTone; far?: boolean; quiet?: SkPath | null };

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

/**
 * A SLEEVED ARM (figure polish 2026-10-10: the old arm was one capsule per
 * bone — a tube with round caps, the same thickness shoulder to wrist). Adult
 * arm in a shirt sleeve: upper arm ≈ 94 mm across at the deltoid/biceps,
 * ≈ 76 mm at the elbow, the forearm ≈ 80 mm just below the elbow (the
 * muscle bellies), ≈ 62 mm at the cuff; the sleeve ends FLAT at the cuff,
 * square to the forearm, and the hand's narrower wrist leaves it. `root`:
 * where the upper arm starts (the shoulder joint, or a little under it so
 * no cap rises above the shoulder line); `cap`: a deltoid mass joined to it.
 */
function sleeveArm(root: Pt, e: Pt, w: Pt, cap: SkPath | null = null): SkPath {
  const upper = limb([root, lerp(root, e, 0.3), e], [44, 43, 38]); // straight taper — a biceps swell read as a bulge (owner 2026-10-10)
  const fore = limb([e, lerp(e, w, 0.26), w], [38, 37, 31]); // smooth taper — a swell below the elbow read as a welt (owner 2026-10-10)
  const arm = union(cap, upper, fore);
  // The cuff: everything past the wrist, square to the forearm, cut away.
  const th = Math.atan2(w.v - e.v, w.u - e.u);
  const tx = Math.cos(th);
  const ty = Math.sin(th);
  const nx = -ty;
  const ny = tx;
  const cut = make();
  const at = (a: number, b: number) => pt(w.u + tx * a + nx * b, w.v + ty * a + ny * b);
  const c0 = at(2, -120);
  const c1 = at(2, 120);
  const c2 = at(200, 120);
  const c3 = at(200, -120);
  cut.moveTo(c0.u, c0.v);
  cut.lineTo(c1.u, c1.v);
  cut.lineTo(c2.u, c2.v);
  cut.lineTo(c3.u, c3.v);
  cut.close();
  return Skia.Path.MakeFromOp(arm, cut, PathOp.Difference) ?? arm;
}

/** The cuff's seam: a line across the sleeve 36 mm up from its end. */
function cuffSeam(e: Pt, w: Pt): SkPath {
  const L = Math.max(1, dist(e, w));
  return crease(e, w, Math.max(0, 1 - 36 / L), 31, 2);
}

/** Sleeve folds: none drawn (owner 2026-10-10 — stroked creases on the
 *  sleeve read as welts on the arm); the sleeve's form comes from its shading. */
function sleeveFolds(_s: Pt, _e: Pt, _w: Pt): SkPath {
  return make();
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
  // The shirt's body (figure polish 2026-10-10): the trapezius sloping
  // ≈ 17° from the side of the neck down to the point of the shoulder, the
  // deltoid rounding over the joint (the shoulder's outer contour ≈ 234 mm
  // from the midline: an adult's ≈ 470 mm across the deltoids), the side of
  // the chest under the arm, the waist, the hem over the hips.
  const S = (s: Pt, o: number) => (x: number, y: number) => pt(s.u + o * x, s.v + y);
  const R = S(sR, -1);
  const Lf = S(sL, 1);
  const torso = smooth(
    [
      pt(n.u - 54, n.v - 46),
      R(-70, -50),
      R(8, -38),
      R(46, 4),
      R(40, 80),
      R(-14, 170),
      pt(n.u - BODY.waistHalf, waistV),
      pt(pose.hipR.u - 62, hipV + 8),
      pt(n.u, hipV + 30),
      pt(pose.hipL.u + 62, hipV + 8),
      pt(n.u + BODY.waistHalf, waistV),
      Lf(-14, 170),
      Lf(40, 80),
      Lf(46, 4),
      Lf(8, -38),
      Lf(-70, -50),
      pt(n.u + 54, n.v - 46),
      pt(n.u, n.v + 14),
    ],
    0.5,
  );
  // Each arm hangs from its DELTOID — a cap that follows the shoulder's own
  // outline (so no round tube end rises over the shoulder line) with the
  // sleeve's set-in seam on its inner side — then a tapered sleeve.
  const deltoid = (P: (x: number, y: number) => Pt) => smooth([P(-66, -48), P(8, -37), P(45, 4), P(43, 70), P(-4, 96), P(-40, 30)], 0.5);
  // The fretting arm (behind the neck).
  const armL = sleeveArm(pt(sL.u, sL.v + 12), pose.elbowL, pose.handL.wrist, deltoid(Lf));
  // The picking arm (over the body).
  const armR = sleeveArm(pt(sR.u, sR.v + 12), pose.elbowR, pose.handR.wrist, deltoid(R));
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
  const linesFront = make();
  void cuff; // no cuff seam stroke (owner 2026-10-10: read as a welt)
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
    // (no drape fold strokes — owner 2026-10-10: lines beside the arm read as welts)
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
  // The shoulders and back from above (owner 2026-10-10: it read as a
  // pointed lens): a ROUNDED RECTANGLE ≈ 456 mm across the deltoids and
  // ≈ 236 mm deep — the back nearly flat across the shoulder blades, the
  // deltoids rounded at the sides, the chest a little fuller than the back
  // (forward, +v).
  const torso = smooth(
    [
      pt(n.u, n.v - 112), // the upper back, behind the neck
      pt(sR.u + 70, n.v - 108),
      pt(sR.u + 10, sR.v - 88),
      pt(sR.u - 34, sR.v - 50),
      pt(sR.u - 40, sR.v + 4), // the deltoid
      pt(sR.u - 30, sR.v + 52),
      pt(sR.u + 14, sR.v + 84),
      pt(n.u - 90, n.v + 116), // the chest
      pt(n.u, n.v + 124),
      pt(n.u + 90, n.v + 116),
      pt(sL.u - 14, sL.v + 84),
      pt(sL.u + 30, sL.v + 52),
      pt(sL.u + 40, sL.v + 4),
      pt(sL.u + 34, sL.v - 50),
      pt(sL.u - 10, sL.v - 88),
      pt(sL.u - 70, n.v - 108),
    ],
    0.5,
  );
  // An arm HANGING at the side is seen end-on from above: it is under the
  // shoulder's own rounded deltoid (the torso outline), so nothing more is
  // drawn (owner review 2026-10-10: the cut sleeve end of a foreshortened arm
  // stuck out as a pointed wing, then as a separate ball). A reaching arm is
  // the sleeve.
  const aboveArm = (s0: Pt, e: Pt, w: Pt) => (dist(s0, w) < 150 && dist(s0, e) < 150 ? make() : sleeveArm(s0, e, w));
  const armL = aboveArm(sL, pose.elbowL, pose.handL.wrist);
  const armR = aboveArm(pt(sR.u + 8, sR.v + 10), pose.elbowR, pose.handR.wrist);
  const seated = pose.posture !== 'standing';
  const thighs = seated ? union(limb([pose.hipR, pose.kneeR], [BODY.thighR, BODY.kneeR + 2]), limb([pose.hipL, pose.kneeL], [BODY.thighR, BODY.kneeR + 2])) : null;
  // Shoes from above (owner 2026-10-10: they pointed BACKWARD): the same
  // shoe as the profile's (buildSide: the foot point at the ball of the foot,
  // the heel 96 mm behind it, the toe 150 mm ahead) — the heel just behind
  // the ankle, the toe forward (+v, the way the body faces), ≈ 100 mm wide at
  // the ball, the toe a little narrower.
  // The toes turn out a little (≈ 8° each), as a relaxed stance does.
  const shoes = [pose.footR, pose.footL].map((f, i) => {
    const th = i === 0 ? 0.14 : -0.14; // R (−u) outward toward −u, L toward +u
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const P = (du: number, dv: number) => pt(f.u + du * c - dv * sn, f.v + du * sn + dv * c);
    return smooth([P(-34, -96), P(34, -96), P(46, -20), P(48, 60), P(34, 128), P(0, 150), P(-34, 128), P(-48, 60), P(-46, -20)], 0.5);
  });
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
    // OWNER 2026-10-10: a STANDING person from above shows no feet — the
    // head and shoulders read as the person. A foot is drawn only where it
    // truly shows beyond the body: a stride, a lean, a seated player's feet
    // out past the knees (the foot well clear of the neck, > 260 mm).
    shoes: shoes.filter((_, i) => dist(i === 0 ? pose.footR : pose.footL, n) > 260).map((path) => ({ path, tone: 'shoe' as const })),
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
      // THE BACK — a healthy adult's (owner 2026-10-10: the old line bulged
      // into a hump behind the shoulders and cut in hard at the waist): from
      // the nape the back runs nearly straight down the thoracic spine, the
      // shoulder blade adding only a shallow convex curve, then a gentle
      // lumbar hollow into the seat. Offsets behind the hip → neck axis (mm).
      along(-0.06, -112), // the seat (under the trousers)
      along(0.24, -90), // the small of the back (the lumbar hollow)
      along(0.45, -98),
      along(0.7, -100), // the shoulder blade
      along(0.9, -82),
      along(1.02, -52), // the nape
    ],
    0.5,
  );
  const seated = pose.posture !== 'standing';
  const ankle = (foot: Pt) => pt(foot.u - f * 40, foot.v - 70);
  const leg = (h: Pt, k: Pt, foot: Pt) => limb([h, k, ankle(foot)], [BODY.thighR, seated ? BODY.kneeR : BODY.kneeR - 4, BODY.ankleR]);
  const legFar = leg(pose.hipL, pose.kneeL, pose.footL);
  // The PELVIS in the trousers (figure review 2026-10-08, owner on F04: the
  // shirt hung below the hips as a bulge and the seat read as a belly): the
  // shirt is tucked in at the belt, and below it one trouser mass — a FLAT
  // front no further forward than the thigh, the seat behind, the crotch
  // under — joined to the near leg, so the hips read the way the face looks.
  const pelvis = smooth([along(0.15, 92), along(0.02, 88), along(-0.1, 80), along(-0.17, 20), along(-0.16, -64), along(-0.06, -106), along(0.06, -112), along(0.15, -100)], 0.5);
  const legNear = union(pelvis, leg(pose.hipR, pose.kneeR, pose.footR));
  // Shoes in profile: the heel behind the ankle, the toe forward.
  const shoe = (foot: Pt) => smooth([pt(foot.u - f * 96, foot.v - 2), pt(foot.u - f * 100, foot.v - 64), pt(foot.u - f * 44, foot.v - 92), pt(foot.u + f * 40, foot.v - 62), pt(foot.u + f * 140, foot.v - 34), pt(foot.u + f * 150, foot.v - 4)], 0.45);
  // The arms: tapered sleeves from each shoulder, cut square at the cuff.
  const armFar = sleeveArm(pose.shoulderL, pose.elbowL, pose.handL.wrist);
  // The near arm hangs from its DELTOID: in profile the shoulder is ≈ 110 mm
  // deep front to back over the joint, so the sleeve's cap is a teardrop
  // along the upper arm — broad over the joint, tapering to the arm's own
  // width ≈ 110 mm down (where the deltoid inserts) — never a tube's round
  // end; it is kept inside the shirt's outline, so it never rises over the
  // shoulder line.
  const armAx = Math.atan2(pose.elbowR.v - sh.v, pose.elbowR.u - sh.u);
  const A = (al: number, ac: number) => pt(sh.u + Math.cos(armAx) * al - Math.sin(armAx) * ac, sh.v + Math.sin(armAx) * al + Math.cos(armAx) * ac);
  const deltoidRaw = smooth([A(-44, 0), A(-30, 40), A(10, 45), A(70, 44), A(112, 43), A(112, -43), A(70, -44), A(10, -45), A(-30, -40)], 0.5); // no wider than the sleeve — a swell here read as a bulge (owner 2026-10-10)
  const deltoid = Skia.Path.MakeFromOp(deltoidRaw, torso, PathOp.Intersect) ?? deltoidRaw;
  const armNear = sleeveArm(sh, pose.elbowR, pose.handR.wrist, deltoid);
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
  // The shirt is tucked in: nothing of it below the belt.
  const tuck = (() => {
    const q = make();
    const a = along(0.12, 400);
    const b = along(0.12, -400);
    const c = along(-3, -400);
    const d = along(-3, 400);
    q.moveTo(a.u, a.v);
    q.lineTo(b.u, b.v);
    q.lineTo(c.u, c.v);
    q.lineTo(d.u, d.v);
    q.close();
    return q;
  })();
  const shirt = Skia.Path.MakeFromOp(torso, tuck, PathOp.Difference) ?? torso;
  const linesFront = make();
  const cuffAt = lerp(pose.handR.wrist, pose.elbowR, 40 / Math.max(40, dist(pose.handR.wrist, pose.elbowR)));
  void cuffAt; // no cuff seam stroke (owner 2026-10-10: read as a welt)
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
    { path: legNear, tone: 'trousers' },
    { path: shirt, tone: 'shirt' },
  ];
  // The sleeve's top inside the shoulder melts into the shirt (no knob).
  const shoulderQuiet = (() => {
    const d = make();
    d.addCircle(sh.u, sh.v, 80);
    return Skia.Path.MakeFromOp(d, torso, PathOp.Intersect);
  })();
  const front: Mass[] = [
    { path: armNear, tone: 'shirt', quiet: shoulderQuiet },
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
      // (no drape fold strokes — owner 2026-10-10: lines beside the arm read as welts)
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
      {/* From above the feet are UNDER the body (owner review 2026-10-10): every
          shoe is painted first, so only its toe cap shows past the chest. */}
      {(legs ? b.shoes : [])
        .filter((s) => s.far || pose.view === 'above')
        .map((s, i) => (
          <FigureMass key={`shoeF${i}`} path={s.path} tone={s.tone} far={s.far} />
        ))}
      {b.behind.map((m, i) => ((isLeg(m.tone) ? legs : upper) ? <FigureMass key={`b${i}`} path={m.path} tone={m.tone} far={m.far} /> : null))}
      {(legs ? b.shoes : [])
        .filter((s) => !s.far && pose.view !== 'above')
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
          <FigureMass path={m.path} tone={m.tone} far={m.far} quiet={m.quiet} />
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
