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
 *   • the head in the house LINE-ART spec, in profile: one uniform stroke,
 *     bald, brow, nose, lips, chin and ear — NO eye;
 *   • a muted palette: nothing competes with the instrument, the zones or
 *     the mic.
 * TWO LAYERS, so the instrument sits between them: <ProfileBehind/> (the far
 * arm and leg, the body, the head) and <ProfileFront/> (the near arm). The
 * HANDS are the lesson's (a cupped pair round a harmonica, fingers on a
 * keyboard), drawn after the near arm. Nothing moves (D8); paths are built
 * once per pose.
 */
import { BlurMask, Group, LinearGradient, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';

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
export const SKIN = ['#8a8f98', '#6e737c', '#52565e'];
export const SKIN_RIM = '#b3b8c1';
export const SKIN_EDGE = '#24272d';
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

/** The profile head (house line-art spec), facing +u, centred on c. */
function headProfile(c: Pt, r: number): { line: SkPath; fill: SkPath } {
  const k = r / 110;
  const P = (x: number, y: number) => pt(c.u + x * k, c.v + y * k);
  const outline = [P(-8, -112), P(46, -100), P(74, -64), P(80, -34), P(82, -22), P(99, 4), P(97, 12), P(83, 20), P(86, 33), P(80, 41), P(85, 50), P(77, 72), P(54, 92), P(40, 104), P(-48, 110), P(-70, 72), P(-94, 22), P(-96, -38), P(-64, -94)];
  const skull = smooth(outline, 0.42);
  const line = make();
  line.addPath(skull);
  // The ear: an outer helix and an inner fold, behind the jaw.
  line.addPath(curve([P(-4, -10), P(-24, -14), P(-30, 12), P(-20, 36), P(-4, 36)]));
  line.addPath(curve([P(-12, 2), P(-18, 14), P(-10, 26)]));
  // The brow, the nostril, the lips' line, the jaw.
  line.addPath(curve([P(52, -40), P(66, -44), P(78, -38)]));
  line.addPath(curve([P(84, 10), P(78, 13), P(76, 7)]));
  line.addPath(curve([P(83, 41), P(74, 43), P(66, 42)]));
  line.addPath(curve([P(10, 66), P(36, 84), P(54, 92)]));
  return { line, fill: skull };
}

type Mass = { path: SkPath; ramp: string[]; rim: string; edge: string; box: { u0: number; v0: number; u1: number; v1: number } };
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
  const armFar = limb([pt(s.u + 10, s.v + 4), p.elbowFar, p.wristFar], [48, 40, 31]);
  const armNear = limb([pt(s.u, s.v + 6), p.elbowNear, p.wristNear], [52, 42, 32]);
  const deltoid = capsule(pt(s.u - 6, s.v - 10), pt(s.u + 4, s.v + 40), 58, 52);
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
  lines.addPath(cuff(p.wristNear, p.elbowNear));
  const shadow = make();
  shadow.addOval(Skia.XYWHRect(h.u - 260, p.floor - 20, 600, 40));
  let strap: SkPath | null = null;
  if (p.strapTo) {
    strap = curve([pt(s.u - 30, s.v - 40), pt((s.u + p.strapTo.u) / 2 + 30, (s.v + p.strapTo.v) / 2), p.strapTo]);
  }
  return {
    far: [mass(legFar, TROUSER, TROUSER_RIM), mass(armFar, SHIRT_FAR, SHIRT_RIM)],
    body: [mass(union(pelvis, legNear), TROUSER, TROUSER_RIM), mass(union(torso, deltoid), SHIRT, SHIRT_RIM)],
    near: [mass(armNear, SHIRT, SHIRT_RIM)],
    shoes: [
      { path: shoe(p.ankleFar, p.floor), far: true },
      { path: shoe(p.ankleNear, p.floor), far: false },
    ],
    lines,
    // The head joined to the collar by its neck: one skin mass (FigureHead's rule).
    head: (() => {
      const h = headProfile(p.head.c, p.head.r);
      const k = p.head.r / 110;
      return { line: h.line, fill: union(h.fill, capsule(pt(p.head.c.u - 6 * k, p.head.c.v + 70 * k), pt(p.neck.u, p.neck.v - 10), 44 * k, 50 * k)) };
    })(),
    shadow,
    strap,
  };
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
export function MassArt({ path, ramp, rim, edge }: { path: SkPath; ramp: string[]; rim: string; edge: string }) {
  const b = path.getBounds();
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={ramp} />
      </Path>
      <Group clip={path}>
        <Path path={path} style="stroke" strokeWidth={9} opacity={0.5}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.55, b.y + b.height * 0.55)} colors={[rim, 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
      <Path path={path} style="stroke" strokeWidth={2.4} color={edge} opacity={0.9} />
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
          <Path path={b.strap} style="stroke" strokeWidth={46} strokeCap="round" color="#141519" opacity={0.95} />
          <Path path={b.strap} style="stroke" strokeWidth={40} strokeCap="round">
            <LinearGradient start={vec(pose.shoulder.u - 60, pose.shoulder.v)} end={vec(pose.shoulder.u + 60, pose.shoulder.v + 300)} colors={['#5a3a22', '#3c2615', '#24170c']} />
          </Path>
        </>
      ) : null}
      {/* The head as part of the figure (owner 2026-10-06: no separate
          line-art head icon) — the same lit skin mass as the hands. */}
      <SkinArt path={b.head.fill} />
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
