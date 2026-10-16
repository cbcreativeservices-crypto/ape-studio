/**
 * THE PLAYER IN PROFILE — a standing adult seen from the side, facing +u
 * (toward the audience and the mic), drawn at TRUE size in the view's
 * millimetres. Lab 3's free reeds need it: a harmonica is held at the mouth
 * and an accordion is worn on the chest, so the placement scene's SIDE view
 * sees the player from their right. The shared player (players/
 * PlayerFigure.tsx) draws the front and the view from above; this is its
 * profile, in the same manner and palette (the owner's art pass,
 * 2026-10-05):
 *   • body masses as smooth silhouettes — a long-sleeved shirt, trousers,
 *     shoes — each limb a tapered form joined into one outline;
 *   • light from the upper left: a form gradient, a rim light on the lit
 *     edge, a darker contour, a soft contact shadow on the floor;
 *   • the head: the SHARED figure head (PlayerFigure headProfile + FigureHead
 *     — head fix 2026-10-08), one skin silhouette in profile joined to the
 *     collar by its neck, neutral, no face;
 *   • a muted palette: nothing competes with the instrument, the zones or
 *     the mic.
 * TWO LAYERS, so the instrument sits between them: <ProfileBehind/> (the far
 * arm and leg, the body, the head) and <ProfileFront/> (the near arm). The
 * HANDS are the lesson's (a cupped pair round a harmonica, fingers on a
 * keyboard), drawn after the near arm. Nothing moves (D8); paths are built
 * once per pose.
 */
import { BlurMask, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { armPath, drawHand3, FIGURE_SKIN, FigureHead, FigureMass, headProfile as figureHeadProfile, intoCollar, Nails } from '../players/PlayerFigure';
import type { HandSkeleton, HandView, V3 } from '../players/handModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
export type Pt = { u: number; v: number };
const pt = (u: number, v: number): Pt => ({ u, v });

/* ── the shared player's palette (players/PlayerFigure.tsx) ── */
export const SHIRT = ['#5d687e', '#465064', '#2f3645'];
export const SHIRT_FAR = ['#4a5366', '#363e4f', '#232937'];
export const SHIRT_RIM = '#9aa6bd';
export const SHIRT_EDGE = '#171a21';
export const TROUSER = ['#41454f', '#2d3038', '#1b1d22'];
export const TROUSER_RIM = '#767c89';
/** The hands wear the SHARED figure skin, the head's tone (owner
 *  2026-10-08, HF1 — they were a grey neutral). */
export const SKIN = FIGURE_SKIN.ramp;
export const SKIN_RIM = FIGURE_SKIN.rim;
export const SKIN_EDGE = FIGURE_SKIN.edge;
/** The far hand, a step darker in the same tone. */
export const SKIN_FAR = FIGURE_SKIN.ramp.slice(1);
const SHOE = ['#34353b', '#18191d', '#0b0b0d'];

/** A standing player in profile (facing +u). Every joint is a drawing
 *  default: no source gives a player's geometry. */
export type ProfilePose = {
  head: { c: Pt; r: number };
  /** The base of the neck. */
  neck: Pt;
  /** The near (visible) shoulder; the far one is hidden behind the body. */
  shoulder: Pt;
  elbowNear: Pt;
  wristNear: Pt;
  elbowFar: Pt;
  wristFar: Pt;
  hip: Pt;
  kneeNear: Pt;
  ankleNear: Pt;
  kneeFar: Pt;
  ankleFar: Pt;
  floor: number;
  /** A strap over the shoulder down to this point (an accordion's). */
  strapTo?: Pt | null;
};

/* ── geometry helpers (build time only) ── */
const dist = (a: Pt, b: Pt) => Math.hypot(b.u - a.u, b.v - a.v);

/** A tapered limb segment: the hull of two circles. */
export function capsule(a: Pt, b: Pt, ra: number, rb: number): SkPath {
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

export function union(...ps: (SkPath | null)[]): SkPath {
  let out: SkPath | null = null;
  for (const p of ps) {
    if (!p) continue;
    out = out ? Skia.Path.MakeFromOp(out, p, PathOp.Union) ?? out : p;
  }
  return out ?? make();
}

/** A chain of tapered segments as one outline. */
export function limb(pts: Pt[], rs: number[]): SkPath {
  let out: SkPath | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const c = capsule(pts[i], pts[i + 1], rs[i], rs[i + 1]);
    out = out ? Skia.Path.MakeFromOp(out, c, PathOp.Union) ?? out : c;
  }
  return out ?? make();
}

/** A smooth closed outline through points (Catmull-Rom as cubics). */
export function smooth(points: Pt[], tension = 0.5): SkPath {
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

/** An open smooth stroke through points. */
export function curve(points: Pt[]): SkPath {
  const p = make();
  p.moveTo(points[0].u, points[0].v);
  if (points.length === 2) {
    p.lineTo(points[1].u, points[1].v);
    return p;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const nx = points[i + 1];
    const m = i === points.length - 2 ? nx : pt((points[i].u + nx.u) / 2, (points[i].v + nx.v) / 2);
    p.quadTo(points[i].u, points[i].v, m.u, m.v);
  }
  return p;
}

type Box = { u0: number; v0: number; u1: number; v1: number };
/** `light`: the box the form gradient spans (default the mass's own) — the
 *  near sleeve takes the shirt body's, so the cloth reads as one garment.
 *  `root`: a disc where the contour stops (the sleeve's root melting into the
 *  shirt at the shoulder: no outline round a plugged-in tube). */
type Mass = { path: SkPath; ramp: string[]; rim: string; edge: string; box: Box; light?: Box; root?: SkPath | null; soft?: SkPath | null; seam?: SkPath | null };
const boxOf = (p: SkPath) => {
  const b = p.getBounds();
  return { u0: b.x, v0: b.y, u1: b.x + b.width, v1: b.y + b.height };
};
const mass = (path: SkPath, ramp: string[], rim: string, edge = SHIRT_EDGE): Mass => ({ path, ramp, rim, edge, box: boxOf(path) });

type Built = { far: Mass[]; body: Mass[]; near: Mass[]; shoes: { path: SkPath; far: boolean }[]; lines: SkPath; head: { line: SkPath; fill: SkPath }; shadow: SkPath; strap: SkPath | null };

function shoe(a: Pt, floor: number): SkPath {
  // A shoe in profile, toe toward +u: heel, the instep rising to the ankle.
  return smooth([pt(a.u - 70, floor - 4), pt(a.u - 66, a.v + 10), pt(a.u - 10, a.v - 6), pt(a.u + 70, floor - 44), pt(a.u + 150, floor - 26), pt(a.u + 156, floor - 4)], 0.45);
}

function build(p: ProfilePose): Built {
  const n = p.neck;
  const s = p.shoulder;
  const h = p.hip;
  // The shirt's body in profile: the nape, the upper back, the lower back
  // and the seat behind; the chest, the waist and the hip in front.
  const torso = smooth(
    [
      pt(n.u - 46, n.v - 10),
      pt(n.u + 34, n.v - 6),
      pt(n.u + 92, n.v + 70),
      pt(n.u + 104, n.v + 180),
      pt(n.u + 82, n.v + 300),
      pt(h.u + 86, h.v - 80),
      pt(h.u + 90, h.v - 30),
      pt(h.u - 92, h.v - 24),
      pt(h.u - 98, h.v - 90),
      pt(n.u - 92, n.v + 300),
      pt(n.u - 112, n.v + 160),
      pt(n.u - 92, n.v + 50),
    ],
    0.5,
  );
  // The trousers: the seat and the hips from the belt down, and the legs.
  const pelvis = smooth([pt(h.u + 88, h.v - 60), pt(h.u + 96, h.v + 30), pt(h.u + 60, h.v + 80), pt(h.u - 70, h.v + 70), pt(h.u - 104, h.v + 10), pt(h.u - 96, h.v - 64)], 0.5);
  const legNear = limb([pt(h.u + 6, h.v + 10), p.kneeNear, p.ankleNear], [90, 62, 40]);
  const legFar = limb([pt(h.u - 6, h.v + 10), p.kneeFar, p.ankleFar], [86, 58, 38]);
  // The arms (owner 2026-10-10): the shared anatomical arm — the elbow's
  // point and crook, the forearm's swell, the cuff short of the wrist.
  const armFar = armPath(pt(s.u + 10, s.v + 4), p.elbowFar, p.wristFar);
  const armNear = armPath(pt(s.u, s.v + 6), p.elbowNear, p.wristNear);
  const deltoid = capsule(pt(s.u - 6, s.v - 10), pt(s.u + 4, s.v + 40), 58, 52);
  // The near sleeve's root melts into the shirt: no contour over the deltoid
  // (the shirt body's outline is the shoulder line), and the body's light.
  const root = make();
  root.addCircle(s.u, s.v + 18, 66);
  const lines = make();
  // The collar and the placket, a cuff on each arm.
  lines.addPath(curve([pt(n.u - 40, n.v - 4), pt(n.u + 6, n.v + 20), pt(n.u + 40, n.v - 2)]));
  lines.addPath(curve([pt(n.u + 60, n.v + 40), pt(n.u + 88, n.v + 160), pt(n.u + 78, n.v + 300)]));
  const cuff = (w: Pt, e: Pt) => {
    const t = 42 / Math.max(42, dist(w, e));
    const c = pt(w.u + (e.u - w.u) * t, w.v + (e.v - w.v) * t);
    const a = Math.atan2(e.v - w.v, e.u - w.u) + Math.PI / 2;
    const r = 38;
    return curve([pt(c.u - Math.cos(a) * r, c.v - Math.sin(a) * r), pt(c.u + Math.cos(a) * r, c.v + Math.sin(a) * r)]);
  };
  void cuff; // no cuff seam stroke (owner 2026-10-10: a line across the sleeve read as a welt)
  const shadow = make();
  shadow.addOval(Skia.XYWHRect(h.u - 260, p.floor - 20, 600, 40));
  // The shoulder strap (an accordion's, figure pass 2 2026-10-15): from the
  // instrument's top corner UP the front of the chest, OVER the top of the
  // shoulder (lying on the trapezius, not floating above it) and DOWN the
  // back toward the waist, where it runs to the instrument's bottom corner
  // behind the body. One band of webbing ≈ 40 mm wide, its edges stroked.
  let strap: SkPath | null = null;
  if (p.strapTo) {
    const t = p.strapTo;
    strap = curve([t, pt(s.u + 52, s.v - 8), pt(s.u + 10, s.v - 44), pt(s.u - 50, s.v - 36), pt(n.u - 100, n.v + 120), pt(n.u - 94, n.v + 300)]);
  }
  return {
    far: [mass(legFar, TROUSER, TROUSER_RIM), mass(armFar, SHIRT_FAR, SHIRT_RIM)],
    body: [mass(union(pelvis, legNear), TROUSER, TROUSER_RIM), mass(union(torso, deltoid), SHIRT, SHIRT_RIM)],
    near: [{ ...mass(armNear, SHIRT, SHIRT_RIM), light: boxOf(union(torso, deltoid)), root, soft: torso, seam: sewnIn(s, p.elbowNear) }],
    shoes: [
      { path: shoe(p.ankleFar, p.floor), far: true },
      { path: shoe(p.ankleNear, p.floor), far: false },
    ],
    lines,
    // The head joined to the collar by its neck: the SHARED figure head
    // (PlayerFigure headProfile, facing +u), one skin silhouette.
    // …and stopped at the shirt's outline, so the neck goes into the collar (pass 2026-10-15).
    head: intoCollar(figureHeadProfile(p.head.c, p.head.r, p.neck.v - 10, 1), torso),
    shadow,
    strap,
  };
}

/**
 * ONE GARMENT (figure pass 3, owner 2026-10-15: "shoulder transitions from
 * shirt sleeves to the shirt body look very unnatural and plug …
 * interchangeable limbs"): the near sleeve is SEWN into the shirt — a faint
 * armhole seam round the deltoid's cap (an arch over the shoulder joint, its
 * feet toward the armpit) and two soft folds where the cloth gathers under
 * the arm, on the arm's front. Painted inside the sleeve only.
 */
function sewnIn(s: Pt, e: Pt): SkPath {
  const ax = Math.atan2(e.v - s.v, e.u - s.u);
  const A = (al: number, ac: number) => pt(s.u + Math.cos(ax) * al - Math.sin(ax) * ac, s.v + Math.sin(ax) * al + Math.cos(ax) * ac);
  const out = make();
  out.addPath(curve([A(34, -50), A(-4, -46), A(-30, -24), A(-36, 0), A(-30, 24), A(-4, 46), A(34, 50)]));
  // The folds: on the side of the arm toward the chest (+u, the way the figure faces).
  const f = -Math.sin(ax) >= 0 ? 1 : -1;
  out.addPath(curve([A(40, 46 * f), A(90, 34 * f), A(140, 26 * f)]));
  out.addPath(curve([A(64, 50 * f), A(120, 42 * f)]));
  return out;
}

const cache = new WeakMap<ProfilePose, Built>();
function built(p: ProfilePose): Built {
  let b = cache.get(p);
  if (!b) {
    b = build(p);
    cache.set(p, b);
  }
  return b;
}

/** One body mass: form gradient, a rim light on the upper-left edge, contour. */
export function MassArt({ path, ramp, rim, edge, light, root, soft, seam }: { path: SkPath; ramp: string[]; rim: string; edge: string; light?: Box; root?: SkPath | null; soft?: SkPath | null; seam?: SkPath | null }) {
  const pb = path.getBounds();
  const b = light ? { x: light.u0, y: light.v0, width: light.u1 - light.u0, height: light.v1 - light.v0 } : pb;
  const contour = (
    <>
      <Group clip={path}>
        <Path path={path} style="stroke" strokeWidth={9} opacity={0.5}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.55, b.y + b.height * 0.55)} colors={[rim, 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
      <Path path={path} style="stroke" strokeWidth={2.4} color={edge} opacity={0.9} />
    </>
  );
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={ramp} />
      </Path>
      {soft ? (
        // Over the shirt body (`soft`): no rim and only a soft fold for its
        // edge — the sleeve over the shirt, not a tube on it; the full
        // contour stays on the figure's silhouette (figure pass 3).
        <Group clip={root ?? undefined} invertClip={!!root}>
          <Group clip={soft} invertClip>
            {contour}
          </Group>
          <Group clip={soft}>
            <Path path={path} style="stroke" strokeWidth={1.6} color={edge} opacity={0.36} />
          </Group>
        </Group>
      ) : root ? (
        <Group clip={root} invertClip>
          {contour}
        </Group>
      ) : (
        contour
      )}
      {seam ? (
        <Group clip={path}>
          <Group transform={[{ translateX: -1.2 }, { translateY: -1.6 }]}>
            <Path path={seam} style="stroke" strokeWidth={1.1} strokeCap="round" color={rim} opacity={0.22} />
          </Group>
          <Path path={seam} style="stroke" strokeWidth={1.4} strokeCap="round" color={edge} opacity={0.4} />
        </Group>
      ) : null}
    </Group>
  );
}

/** The player BEHIND the instrument: shadow, the far arm and leg, the body, the head. */
export function ProfileBehind({ pose, dim = 1 }: { pose: ProfilePose; dim?: number }) {
  const b = built(pose);
  // The trousers mass is the torso + near leg; drawn first, then the shirt over it.
  return (
    <Group opacity={dim}>
      <Path path={b.shadow} color="#000" opacity={0.45}>
        <BlurMask blur={16} style="normal" />
      </Path>
      {b.shoes.filter((s) => s.far).map((s, i) => (
        <ShoeArt key={`sf${i}`} path={s.path} far />
      ))}
      {b.far.map((m, i) => (
        <MassArt key={`f${i}`} {...m} />
      ))}
      {b.body.map((m, i) => (
        <MassArt key={`b${i}`} {...m} />
      ))}
      {b.shoes.filter((s) => !s.far).map((s, i) => (
        <ShoeArt key={`sn${i}`} path={s.path} />
      ))}
      <Path path={b.lines} style="stroke" strokeWidth={2.2} strokeCap="round" color="#252a35" opacity={0.9} />
      {b.strap ? (
        <>
          <Path path={b.strap} style="stroke" strokeWidth={44} strokeCap="butt" color="#141519" opacity={0.95} />
          <Path path={b.strap} style="stroke" strokeWidth={39} strokeCap="butt">
            <LinearGradient start={vec(pose.shoulder.u - 60, pose.shoulder.v - 60)} end={vec(pose.shoulder.u + 60, pose.shoulder.v + 300)} colors={['#6a4528', '#3c2615', '#24170c']} />
          </Path>
        </>
      ) : null}
      {/* The head as part of the figure (owner 2026-10-06: no separate
          line-art head icon) — the shared FigureHead skin mass (head fix
          2026-10-08). */}
      <FigureHead fill={b.head.fill} />
    </Group>
  );
}

/** The player IN FRONT of the instrument: the near arm (the hands are the lesson's). */
export function ProfileFront({ pose, dim = 1 }: { pose: ProfilePose; dim?: number }) {
  const b = built(pose);
  return (
    <Group opacity={dim}>
      {b.near.map((m, i) => (
        <Group key={`n${i}`}>
          <Path path={m.path} color="#000" opacity={0.3} transform={[{ translateX: 8 }, { translateY: 12 }]}>
            <BlurMask blur={12} style="normal" />
          </Path>
          <MassArt {...m} />
        </Group>
      ))}
    </Group>
  );
}

function ShoeArt({ path, far = false }: { path: SkPath; far?: boolean }) {
  const b = path.getBounds();
  return (
    <Group opacity={far ? 0.8 : 1}>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={SHOE} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={2} color="#55585f" opacity={0.7} />
    </Group>
  );
}

/** A hand-skin mass (for the lessons' own hands). */
export function SkinArt({ path }: { path: SkPath }) {
  return <MassArt path={path} ramp={SKIN} rim={SKIN_RIM} edge={SKIN_EDGE} />;
}

/**
 * A hand posed bone by bone (players/handModel.ts; freeReedHands.ts) drawn at
 * the house standard (PlayerFigure.drawHand3): tapered bones, palm, thenar,
 * the bare wrist along the forearm (`fore`: its picture angle;
 * `foreshortened` when the forearm reaches toward the viewer), knuckle
 * creases, nails. `cut` splits it at what it holds: `part` 'behind' paints
 * what lies beyond, 'front' the rest.
 */
export function Hand3Art({ sk, view, fore, foreshortened, cut, part = 'all', far = false }: { sk: HandSkeleton; view: HandView; fore?: number; foreshortened?: boolean; cut?: { p: V3; n: V3 }; part?: 'all' | 'behind' | 'front'; far?: boolean }) {
  const d = useMemo(() => drawHand3(sk, view, { fore, foreshortened, cut }), [sk, view, fore, foreshortened, cut]);
  return (
    <Group>
      {part !== 'front' && d.behind ? <FigureMass path={d.behind} tone="skin" contour={1.8} far={far} /> : null}
      {part !== 'behind' ? (
        <>
          <FigureMass path={d.path} tone="skin" contour={1.8} far={far} />
          <Path path={d.lines} style="stroke" strokeWidth={1.7} strokeCap="round" color={FIGURE_SKIN.edge} opacity={0.7} />
          <Nails path={d.nails} />
        </>
      ) : null}
    </Group>
  );
}
