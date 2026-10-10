/**
 * THE BROADCAST DESK KIT — the look (charter §2 layer 3). Lab 7 group 1
 * (B01, B07, B06); shared with groups 2 and 3. Real objects, lit from the
 * upper left, in the engine's two views (side: u = x, v = y; top: u = x,
 * v = z — frame V, mm). Static: nothing moves by itself (D8).
 *
 *   SeatedTalker   the shared player figure seated (talkerPose.ts), facing
 *                  +x or −x, with the open mouth in profile and, optionally,
 *                  closed-back headphones; `headless` leaves the head off
 *                  for a step that draws it turned (TurnedHeadTop / Side).
 *   StudioChair    a studio chair: cushioned seat, backrest, gas column,
 *                  five-star base on casters.
 *   Desk           a desk or table top on slim legs (or a skirted panel
 *                  table: `skirt`), a laminate top with its edge.
 *   ArmClamp       a desk spring arm's clamp on the desk edge and its riser
 *                  post (the arm itself is the engine's: geometry/arm.ts).
 *   GooseBase      a gooseneck's weighted round base with its mute key and
 *                  LED ring.
 *   Laptop, Script a laptop facing the talker; a few sheets of script.
 *   Lectern        a lectern: column, slanted reading top, gooseneck socket.
 *   ScriptStand    a music stand holding a script, its desk tilted.
 *   PaSpeaker      a loudspeaker cabinet on a pole stand.
 *   AcousticPanels soft panels on a booth wall (illustrated; no numbers).
 */
import { useMemo, type ReactNode } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId, Vec3 } from '../../../engine/model/types.ts';
import { FigureHead, PlayerBehind, PlayerInFront, figureCovers, headAbove, headProfile } from '../players/PlayerFigure';
import { pt, type PlayerPose } from '../players/playerPose.ts';
import { EAR, EAR_HALF, HEAD_C, HEAD_R } from '../voice/voiceSpec.ts';
import { NECK_B, SEATED_FLOOR, SEATED_SIDE, SEATED_TOP, SEAT_Y, TURN_PIVOT, onTalker, poseOnTalker, type Talker } from './talkerPose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const DEG = Math.PI / 180;
const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);

/** Frame-V art drawn on a talker: moved to their lips and, facing −x,
 *  mirrored (side) or turned half round (top). */
export function OnTalker({ view, t, children }: { view: ViewId; t: Talker; children: ReactNode }) {
  const tf = view === 'side' ? [{ translateX: t.lip.x }, { translateY: t.lip.y }, { scaleX: t.facing }] : [{ translateX: t.lip.x }, { translateY: t.lip.z }, { scaleX: t.facing }, { scaleY: t.facing }];
  return <Group transform={tf}>{children}</Group>;
}

/* ── the seated talker ── */

const SIDE_HEADLESS: PlayerPose = { ...SEATED_SIDE, head: { ...SEATED_SIDE.head, r: 1 } };
const TOP_HEADLESS: PlayerPose = { ...SEATED_TOP, head: { ...SEATED_TOP.head, r: 1 } };
const poseCache = new Map<string, PlayerPose>();
/** The talker's pose in a view (cached per talker). */
export function talkerPose(view: ViewId, t: Talker, headless = false): PlayerPose {
  const key = `${view}:${t.lip.x}:${t.lip.y}:${t.lip.z}:${t.facing}:${headless ? 1 : 0}`;
  let p = poseCache.get(key);
  if (!p) {
    p = poseOnTalker(view === 'side' ? (headless ? SIDE_HEADLESS : SEATED_SIDE) : headless ? TOP_HEADLESS : SEATED_TOP, t);
    poseCache.set(key, p);
  }
  return p;
}

function mouthPath(): SkPath {
  const p = make();
  p.moveTo(1.5, -2.5);
  p.cubicTo(-4, -4.5, -11, -3.5, -14, 0);
  p.cubicTo(-11, 3.5, -4, 4.5, 1.5, 2.5);
  p.close();
  return p;
}
const MOUTH = mouthPath();

function phonesPaths(view: ViewId) {
  const cup = make();
  const band = make();
  if (view === 'side') {
    cup.addRRect(Skia.RRectXY(Skia.XYWHRect(EAR.x - 40, EAR.y - 52, 80, 104), 34, 38));
    band.moveTo(EAR.x + 4, EAR.y - 50);
    band.cubicTo(EAR.x + 10, EAR.y - 100, HEAD_C.x - 24, HEAD_C.y - HEAD_R - 12, HEAD_C.x - 6, HEAD_C.y - HEAD_R - 14);
  } else {
    for (const s of [-1, 1]) cup.addRRect(Skia.RRectXY(Skia.XYWHRect(HEAD_C.x - 46, s * (EAR_HALF + 12) - 20, 88, 40), 30, 20));
    band.moveTo(HEAD_C.x - 8, -(EAR_HALF + 14));
    band.cubicTo(HEAD_C.x - 2, -40, HEAD_C.x - 2, 40, HEAD_C.x - 8, EAR_HALF + 14);
  }
  return { cup, band };
}
const PHONES = { side: phonesPaths('side'), top: phonesPaths('top') };

/** Closed-back headphones on a talker's head (frame V). */
export function Headphones({ view }: { view: ViewId }) {
  const p = PHONES[view];
  const b = p.cup.getBounds();
  return (
    <Group>
      <Path path={p.band} style="stroke" strokeWidth={16} strokeCap="round" color="#0a0b0d" />
      <Path path={p.band} style="stroke" strokeWidth={11} strokeCap="round" color="#3a3d45" />
      <Path path={p.cup}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#4b4f59', '#2a2d34', '#15161a', '#0a0b0d']} positions={[0, 0.35, 0.7, 1]} />
      </Path>
      <Path path={p.cup} style="stroke" strokeWidth={2.4} color="#050506" />
      <Group transform={[{ translateX: -1.4 }, { translateY: -1.8 }]}>
        <Path path={p.cup} style="stroke" strokeWidth={1.4} color="#c9ced8" opacity={0.4} />
      </Group>
    </Group>
  );
}

/** A seated talker. `part`: 'lower' draws the legs only (from above, under
 *  the desk), 'upper' the rest; default both. */
export function SeatedTalker({ view, t, phones = false, headless = false, part = 'all', dim = 1 }: { view: ViewId; t: Talker; phones?: boolean; headless?: boolean; part?: 'all' | 'lower' | 'upper'; dim?: number }) {
  const pose = talkerPose(view, t, headless);
  if (part === 'lower') return <PlayerBehind pose={pose} part="legs" dim={dim} />;
  return (
    <Group opacity={dim}>
      <PlayerBehind pose={pose} part={view === 'top' ? (part === 'all' ? 'all' : 'upper') : 'all'} />
      <PlayerInFront pose={pose} hands />
      {view === 'side' && !headless ? (
        <OnTalker view={view} t={t}>
          <Path path={MOUTH} color="#24170f" opacity={0.92} />
        </OnTalker>
      ) : null}
      {phones && !headless ? (
        <OnTalker view={view} t={t}>
          <Headphones view={view} />
        </OnTalker>
      ) : null}
    </Group>
  );
}

/** The head drawn turned about its centre (talkerPose.TURN_PIVOT): from above
 *  by the yaw, from the side by the pitch (+ up). Frame V; wrap in OnTalker. */
export function TurnedHeadTop({ yawDeg }: { yawDeg: number }) {
  const head = useMemo(() => headAbove(pt(SEATED_TOP.head.c.u, SEATED_TOP.head.c.v), SEATED_TOP.head.r), []);
  const a = yawDeg * DEG;
  return (
    <Group transform={[{ translateX: TURN_PIVOT.x }, { translateY: 0 }, { rotate: a - Math.PI / 2 }, { translateX: -SEATED_TOP.head.c.u }, { translateY: -SEATED_TOP.head.c.v }]}>
      <FigureHead fill={head.fill} />
    </Group>
  );
}
export function TurnedHeadSide({ pitchDeg, phones = false }: { pitchDeg: number; phones?: boolean }) {
  const head = useMemo(() => headProfile(pt(HEAD_C.x, HEAD_C.y), HEAD_R, NECK_B.y, 1), []);
  return (
    <Group transform={[{ translateX: TURN_PIVOT.x }, { translateY: TURN_PIVOT.y }, { rotate: -pitchDeg * DEG }, { translateX: -TURN_PIVOT.x }, { translateY: -TURN_PIVOT.y }]}>
      <FigureHead fill={head.fill} />
      <Path path={MOUTH} color="#24170f" opacity={0.92} />
      {phones ? <Headphones view="side" /> : null}
    </Group>
  );
}

/** Whether the drawn talker covers (u, v) — for labels (an 'above' pose is
 *  authored unturned round its neck: the point is turned back first). */
export function talkerCovers(view: ViewId, t: Talker, u: number, v: number, tol: number): boolean {
  const pose = talkerPose(view, t);
  if (view === 'side') return figureCovers(pose, u, v, tol);
  const a = -((pose.facing ?? 0) - Math.PI / 2);
  const du = u - pose.neck.u;
  const dv = v - pose.neck.v;
  return figureCovers(pose, pose.neck.u + du * Math.cos(a) - dv * Math.sin(a), pose.neck.v + du * Math.sin(a) + dv * Math.cos(a), tol);
}

/* ── the chair ── */

function chairPaths(view: ViewId) {
  const n = NECK_B;
  const seat = make();
  const back = make();
  const column = make();
  const base = make();
  const wheels: { u: number; v: number }[] = [];
  if (view === 'side') {
    seat.addRRect(Skia.RRectXY(Skia.XYWHRect(n.x - 190, SEAT_Y - 6, 460, 74), 30, 30));
    back.addRRect(Skia.RRectXY(Skia.XYWHRect(n.x - 250, SEAT_Y - 560, 80, 470), 34, 34));
    // The backrest's support from the seat.
    column.addRect(Skia.XYWHRect(n.x - 222, SEAT_Y - 100, 26, 110));
    column.addRRect(Skia.RRectXY(Skia.XYWHRect(n.x + 12, SEAT_Y + 66, 34, SEATED_FLOOR - SEAT_Y - 150), 10, 10));
    const by = SEATED_FLOOR - 70;
    base.moveTo(n.x + 29 - 280, by + 18);
    base.lineTo(n.x + 29, by - 14);
    base.lineTo(n.x + 29 + 280, by + 18);
    for (const dx of [-268, 268]) wheels.push({ u: n.x + 29 + dx, v: SEATED_FLOOR - 32 });
  } else {
    seat.addRRect(Skia.RRectXY(Skia.XYWHRect(n.x - 190, -230, 460, 460), 70, 70));
    back.addRRect(Skia.RRectXY(Skia.XYWHRect(n.x - 270, -240, 80, 480), 36, 36));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      base.moveTo(n.x + 40, 0);
      base.lineTo(n.x + 40 + Math.cos(a) * 300, Math.sin(a) * 300);
      wheels.push({ u: n.x + 40 + Math.cos(a) * 300, v: Math.sin(a) * 300 });
    }
  }
  return { seat, back, column, base, wheels };
}
const CHAIR = { side: chairPaths('side'), top: chairPaths('top') };

/** A studio chair under a talker (frame V; drawn on the talker). */
export function StudioChair({ view, t }: { view: ViewId; t: Talker }) {
  const p = CHAIR[view];
  const sb = p.seat.getBounds();
  const bb = p.back.getBounds();
  return (
    <OnTalker view={view} t={t}>
      <Path path={p.base} style="stroke" strokeWidth={30} strokeCap="round" strokeJoin="round" color="#0b0c0f" />
      <Path path={p.base} style="stroke" strokeWidth={22} strokeCap="round" strokeJoin="round" color="#3a3d45" />
      {p.wheels.map((w, i) => (
        <Circle key={i} cx={w.u} cy={w.v} r={30} color="#15161a" />
      ))}
      <Path path={p.column}>
        <LinearGradient start={vec(sb.x, 0)} end={vec(sb.x + 60, 0)} colors={['#c3c8d1', '#6b707a', '#2a2c32']} />
      </Path>
      <Path path={p.back}>
        <LinearGradient start={vec(bb.x, bb.y)} end={vec(bb.x + bb.width, bb.y + bb.height)} colors={['#4a4d55', '#2a2c32', '#141519']} />
      </Path>
      <Path path={p.back} style="stroke" strokeWidth={3} color="#08080a" />
      <Path path={p.seat}>
        <LinearGradient start={vec(sb.x, sb.y)} end={vec(sb.x + sb.width * 0.3, sb.y + sb.height)} colors={['#4f525a', '#2b2d33', '#16171b']} />
      </Path>
      <Path path={p.seat} style="stroke" strokeWidth={3} color="#08080a" />
      <Group transform={[{ translateX: -2 }, { translateY: -2.5 }]}>
        <Path path={p.seat} style="stroke" strokeWidth={2} color="#c9ced8" opacity={0.25} />
      </Group>
    </OnTalker>
  );
}

/* ── the desk or table ── */

export type DeskBox = { min: Vec3; max: Vec3 };
const LAMINATE = ['#6b5a49', '#4d3f33', '#2f261f'];

function deskPaths(view: ViewId, d: DeskBox, floor: number, skirt: boolean) {
  const top = make();
  const edge = make();
  const legs = make();
  const drape = make();
  if (view === 'side') {
    top.addRRect(Skia.RRectXY(Skia.XYWHRect(d.min.x, d.min.y, d.max.x - d.min.x, d.max.y - d.min.y), 6, 6));
    edge.moveTo(d.min.x + 6, d.min.y + 3);
    edge.lineTo(d.max.x - 6, d.min.y + 3);
    if (skirt) drape.addRect(Skia.XYWHRect(d.max.x - 14, d.max.y, 14, floor - d.max.y - 30));
    for (const x of [d.min.x + 50, d.max.x - 70]) legs.addRRect(Skia.RRectXY(Skia.XYWHRect(x, d.max.y, 22, floor - d.max.y), 6, 6));
  } else {
    top.addRRect(Skia.RRectXY(Skia.XYWHRect(d.min.x, d.min.z, d.max.x - d.min.x, d.max.z - d.min.z), 14, 14));
    edge.addRRect(Skia.RRectXY(Skia.XYWHRect(d.min.x + 8, d.min.z + 8, d.max.x - d.min.x - 16, d.max.z - d.min.z - 16), 10, 10));
    if (skirt) drape.addRect(Skia.XYWHRect(d.max.x - 10, d.min.z, 22, d.max.z - d.min.z));
  }
  return { top, edge, legs, drape };
}

/** A desk or table top (a box: its top face at min.y) on slim legs; a
 *  panel table with a cloth skirt on its audience side (`skirt`, +x). */
export function Desk({ view, box, floor, skirt = false }: { view: ViewId; box: DeskBox; floor: number; skirt?: boolean }) {
  const p = useMemo(() => deskPaths(view, box, floor, skirt), [view, box, floor, skirt]);
  const b = p.top.getBounds();
  return (
    <Group>
      {view === 'top' ? (
        <Group transform={[{ translateX: -10 }, { translateY: 14 }]}>
          <Path path={p.top} color="#000" opacity={0.4}>
            <BlurMask blur={16} style="normal" />
          </Path>
        </Group>
      ) : null}
      <Path path={p.legs}>
        <LinearGradient start={vec(b.x, 0)} end={vec(b.x + 40, 0)} colors={['#9ba0aa', '#4a4e57', '#1b1c21']} />
      </Path>
      <Path path={p.drape}>
        <LinearGradient start={vec(b.x + b.width - 20, 0)} end={vec(b.x + b.width + 20, 0)} colors={['#2b2f3a', '#161922']} />
      </Path>
      <Path path={p.top}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.35, b.y + b.height)} colors={LAMINATE} />
      </Path>
      <Path path={p.edge} style="stroke" strokeWidth={view === 'side' ? 3 : 2.2} color="#b59a7c" opacity={0.45} />
      <Path path={p.top} style="stroke" strokeWidth={2.6} color="#0c0a08" />
    </Group>
  );
}

/* ── a desk arm's clamp and riser ── */

/*
 * A broadcast desk arm's edge clamp (real dimensions, mm — a drawing default
 * for the class): a steel C-clamp, its top jaw a plate 64 × 54 × 12 on the
 * desk, its spine 12 thick down the OUTSIDE of the desk's edge, its lower jaw
 * 20 mm under the desk carrying an M10 screw with a Ø 36 pressure pad up
 * against the desk and a Ø 40 knurled knob below; the riser socket a Ø 22
 * tube up to the arm's pivot (the grip) with a set-screw knob. `edge` is the
 * side the desk's edge faces (−1: toward −x, the near edge; +1: the far edge).
 */
export function ArmClamp({ view, grip, deskTop, thick = 30, edge = -1, on = 'front' }: { view: ViewId; grip: Vec3; deskTop: number; thick?: number; edge?: 1 | -1; /** Which desk edge it grips: the front edge (jaws along x) or a SIDE edge (jaws along z; `edge` −1 = the −z side). */ on?: 'front' | 'side' }) {
  const p = useMemo(() => {
    const post = make();
    const steel = make();
    const screw = make();
    const knob = make();
    const pad = make();
    const gu = grip.x;
    const gv = vOf(view, grip);
    const e = edge;
    // The clamp's outer face (the spine) sits 14 mm beyond the desk's edge.
    const xs = gu + e * 34; // the spine's outer face
    const xi = gu - e * 30; // the jaws' inner end
    const lo = Math.min(xs, xi);
    const jaw = Math.abs(xs - xi);
    if (on === 'side') {
      // Clamped on a SIDE edge: the jaws run along z. From the side we see the
      // spine face-on; from above, the C reaches in from the side edge.
      const under = deskTop + thick;
      if (view === 'side') {
        post.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 11, gv, 22, deskTop - 12 - gv), 5, 5));
        steel.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 27, deskTop - 12, 54, under + 32 - (deskTop - 12)), 4, 4));
        pad.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 27, deskTop - 12, 54, 12), 3, 3));
        screw.moveTo(gu, under + 32);
        screw.lineTo(gu, under + 56);
        knob.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 20, under + 52, 40, 16), 5, 5));
        knob.addRRect(Skia.RRectXY(Skia.XYWHRect(gu + 11, gv + (deskTop - gv) * 0.45, 14, 12), 3, 3));
      } else {
        const zs = gv + e * 34;
        const zi = gv - e * 30;
        const lz = Math.min(zs, zi);
        steel.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 27, lz, 54, Math.abs(zs - zi)), 6, 6));
        pad.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 27, e < 0 ? lz : zs - 12, 54, 12), 3, 3));
        post.addCircle(gu, gv, 11);
        knob.addRRect(Skia.RRectXY(Skia.XYWHRect(gu + 11, gv - 5, 12, 10), 2, 2));
      }
      return { post, steel, screw, knob, pad };
    }
    if (view === 'side') {
      const under = deskTop + thick;
      post.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 11, gv, 22, deskTop - 12 - gv), 5, 5));
      // Top jaw, spine, lower jaw: one C.
      steel.moveTo(xi, deskTop - 12);
      steel.lineTo(xs, deskTop - 12);
      steel.lineTo(xs, under + 32);
      steel.lineTo(xi, under + 32);
      steel.lineTo(xi, under + 20);
      steel.lineTo(xs - e * 12, under + 20);
      steel.lineTo(xs - e * 12, deskTop);
      steel.lineTo(xi, deskTop);
      steel.close();
      // The screw up through the lower jaw to the pad; the knob under it.
      const sx = gu - e * 6;
      screw.moveTo(sx, under + 6);
      screw.lineTo(sx, under + 56);
      pad.addRRect(Skia.RRectXY(Skia.XYWHRect(sx - 18, under, 36, 7), 2, 2));
      knob.addRRect(Skia.RRectXY(Skia.XYWHRect(sx - 20, under + 52, 40, 16), 5, 5));
      // The riser's set-screw knob, part way up.
      knob.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - e * 11 - (e < 0 ? 0 : 14), gv + (deskTop - gv) * 0.45, 14, 12), 3, 3));
    } else {
      steel.addRRect(Skia.RRectXY(Skia.XYWHRect(lo, gv - 27, jaw, 54), 6, 6));
      // The spine's top, beyond the desk's edge, a shade darker.
      pad.addRRect(Skia.RRectXY(Skia.XYWHRect(e < 0 ? lo : xs - 12, gv - 27, 12, 54), 3, 3));
      post.addCircle(gu, gv, 11);
      knob.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 5, gv + 11, 10, 12), 2, 2));
    }
    return { post, steel, screw, knob, pad };
  }, [view, grip.x, grip.y, grip.z, deskTop, thick, edge, on]); // eslint-disable-line react-hooks/exhaustive-deps
  const gu = grip.x;
  return (
    <Group>
      <Path path={p.screw} style="stroke" strokeWidth={10} strokeCap="butt" color="#0b0c0f" />
      <Path path={p.screw} style="stroke" strokeWidth={7} strokeCap="butt" color="#8a8f99" />
      <Path path={p.steel}>
        <LinearGradient start={vec(gu - 40, 0)} end={vec(gu + 40, 0)} colors={['#4f535c', '#26282e', '#0d0e11']} />
      </Path>
      <Path path={p.steel} style="stroke" strokeWidth={1.8} color="#060607" />
      <Path path={p.pad} color={view === 'side' ? '#1b1c21' : '#15161a'} />
      <Path path={p.pad} style="stroke" strokeWidth={1.2} color="#060607" />
      <Path path={p.post}>
        <LinearGradient start={vec(gu - 12, 0)} end={vec(gu + 12, 0)} colors={['#d4d8e0', '#7c818b', '#2a2c32']} />
      </Path>
      <Path path={p.post} style="stroke" strokeWidth={1.6} color="#060607" />
      <Path path={p.knob}>
        <LinearGradient start={vec(gu - 20, 0)} end={vec(gu + 20, 0)} colors={['#5a5e68', '#202227']} />
      </Path>
      <Path path={p.knob} style="stroke" strokeWidth={1.4} color="#060607" />
      <Group transform={[{ translateX: -1 }, { translateY: -1.2 }]}>
        <Path path={p.steel} style="stroke" strokeWidth={1} color="#c9ced8" opacity={0.3} />
      </Group>
    </Group>
  );
}

/*
 * A conference gooseneck's weighted desk base (real dimensions, mm — a
 * drawing default for the class): Ø 140 × 30 tall, a 6 mm chamfer round its
 * top, a Ø 26 × 6 socket collar in the middle where the gooseneck screws in,
 * a 30 × 14 mute key on the talker's side with its LED ring (green open, red
 * muted), a rubber skirt at the bottom.
 */
/** A gooseneck's weighted base on the table: a low round puck with a mute key
 *  and its LED ring (`on`: green when the mic is open, red when muted). */
export function GooseBase({ view, at, on = true }: { view: ViewId; at: Vec3; on?: boolean }) {
  const u = at.x;
  const v = vOf(view, at);
  const p = useMemo(() => {
    const body = make();
    const top = make();
    const key = make();
    const collar = make();
    const skirt = make();
    if (view === 'side') {
      // A low drum with a chamfered top, sitting on the desk 30 mm below `at`.
      body.moveTo(u - 70, v + 30);
      body.lineTo(u - 70, v + 8);
      body.lineTo(u - 62, v + 2);
      body.lineTo(u + 62, v + 2);
      body.lineTo(u + 70, v + 8);
      body.lineTo(u + 70, v + 30);
      body.close();
      top.moveTo(u - 62, v + 2.5);
      top.lineTo(u + 62, v + 2.5);
      skirt.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 70, v + 26, 140, 4), 1.5, 1.5));
      collar.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 13, v - 4, 26, 7), 2, 2));
      key.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 60, v - 1, 30, 4), 1.5, 1.5));
    } else {
      body.addCircle(u, v, 70);
      top.addCircle(u, v, 63);
      collar.addCircle(u, v, 13);
      // The key on the talker's side (−x).
      key.addRRect(Skia.RRectXY(Skia.XYWHRect(u - 56, v - 15, 14, 30), 4, 4));
    }
    return { body, top, key, collar, skirt };
  }, [view, u, v]);
  const led = on ? '#5bff85' : '#ff5a48';
  return (
    <Group>
      <Path path={p.body}>
        <LinearGradient start={vec(u - 70, v - 70)} end={vec(u + 70, v + 70)} colors={['#5a5e67', '#2a2c32', '#111215']} />
      </Path>
      <Path path={p.skirt} color="#0b0c0f" />
      <Path path={p.top} style="stroke" strokeWidth={1.4} color="#c9ced8" opacity={0.35} />
      <Path path={p.body} style="stroke" strokeWidth={2} color="#060607" />
      <Path path={p.collar}>
        <LinearGradient start={vec(u - 13, v - 13)} end={vec(u + 13, v + 13)} colors={['#d4d8e0', '#7c818b', '#2a2c32']} />
      </Path>
      <Path path={p.collar} style="stroke" strokeWidth={1.2} color="#060607" />
      <Path path={p.key} color="#1c1d22" />
      <Path path={p.key} style="stroke" strokeWidth={2.5} color={led} opacity={0.95} />
    </Group>
  );
}

/* ── things on the desk ── */

/*
 * A 13–14-inch laptop (real dimensions, mm — a drawing default for the class):
 * footprint 322 × 222 (w × d, the defaults 330 × 230 keep the old box), base
 * 11 mm at the hinge tapering to 8 mm at the front, on 2 mm rubber feet; lid
 * 5 mm thick, 215 mm from hinge to top edge, opened to about 110° (20° back
 * from upright); keyboard well about 280 × 110 mm, six key rows at a 19 mm
 * pitch; trackpad about 115 × 70 mm, centred in the palm rest. No logo.
 */
const LAP = { baseRear: 11, baseFront: 8, feet: 2, lid: 5, lidLen: 215, openDeg: 20, keyPitch: 19, keyRows: 6, padW: 115, padD: 70 } as const;

/** A laptop: from the side its base on the desk and its lid opened toward −x
 *  (the screen facing a talker on the −x side) — `toward` −1 for one on +x. */
export function Laptop({ view, at, toward = 1, w = 330, d = 230 }: { view: ViewId; at: Vec3; toward?: 1 | -1; w?: number; d?: number }) {
  const p = useMemo(() => {
    const base = make();
    const lid = make();
    const glass = make();
    const keys = make();
    const pad = make();
    const feet = make();
    const hinge = make();
    const t = toward;
    const lean = LAP.openDeg * DEG;
    if (view === 'side') {
      const x0 = at.x - d / 2;
      const hx = t > 0 ? x0 + d : x0; // the hinge edge (away from the talker)
      const fx = t > 0 ? x0 : x0 + d; // the front edge (the talker's side)
      const yb = at.y - LAP.feet;
      // The base: a wedge, thicker at the hinge, its front edge rounded.
      base.moveTo(fx + t * 6, yb);
      base.lineTo(hx - t * 4, yb);
      base.quadTo(hx, yb, hx, yb - 4);
      base.lineTo(hx, yb - LAP.baseRear);
      base.lineTo(fx + t * 5, yb - LAP.baseFront);
      base.quadTo(fx, yb - LAP.baseFront, fx, yb - LAP.baseFront / 2);
      base.quadTo(fx, yb, fx + t * 6, yb);
      base.close();
      for (const x of [fx + t * 26, hx - t * 26]) feet.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 9, at.y - LAP.feet - 0.5, 18, LAP.feet + 0.5), 1, 1));
      // The lid: a 5 mm slab from the hinge, leaning back away from the talker.
      const ux = t * Math.sin(lean);
      const uy = -Math.cos(lean);
      const nx = t * Math.cos(lean); // the lid's back (away from the talker)
      const ny = Math.sin(lean);
      const h0 = { x: hx - t * 3, y: yb - LAP.baseRear + 1 };
      const h1 = { x: h0.x + ux * LAP.lidLen, y: h0.y + uy * LAP.lidLen };
      lid.moveTo(h0.x, h0.y);
      lid.lineTo(h1.x, h1.y);
      lid.quadTo(h1.x + nx * LAP.lid * 0.5 + ux * 2, h1.y + ny * LAP.lid * 0.5 + uy * 2, h1.x + nx * LAP.lid, h1.y + ny * LAP.lid);
      lid.lineTo(h0.x + nx * LAP.lid, h0.y + ny * LAP.lid);
      lid.close();
      // The display glass on the talker's face of the lid (its bezel left bare).
      glass.moveTo(h0.x + ux * 14 - nx * 0.6, h0.y + uy * 14 - ny * 0.6);
      glass.lineTo(h0.x + ux * (LAP.lidLen - 9) - nx * 0.6, h0.y + uy * (LAP.lidLen - 9) - ny * 0.6);
      hinge.addCircle(hx - t * 3, yb - LAP.baseRear + 3, 4.5);
    } else {
      const x0 = at.x - d / 2;
      base.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, at.z - w / 2, d, w), 12, 12));
      const hx = t > 0 ? at.x + d / 2 : at.x - d / 2;
      // The lid seen from above: its back, leaning out past the hinge.
      const reach = LAP.lidLen * Math.sin(lean) + LAP.lid;
      lid.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(hx, hx + t * reach), at.z - w / 2 + 1, reach, w - 2), 5, 5));
      hinge.moveTo(hx, at.z - w / 2 + 30);
      hinge.lineTo(hx, at.z + w / 2 - 30);
      // The keyboard: six rows of keys next to the hinge; the trackpad at the front.
      const kw = Math.min(280, w - 40);
      const cols = Math.round(kw / LAP.keyPitch);
      const kx0 = hx - t * 14;
      for (let r = 0; r < LAP.keyRows; r++) {
        const xr = kx0 - t * (r + 0.5) * LAP.keyPitch;
        const isSpace = r === LAP.keyRows - 1;
        for (let c = 0; c < cols; c++) {
          const zc = at.z - kw / 2 + (c + 0.5) * (kw / cols);
          if (isSpace && c > cols * 0.3 && c < cols * 0.68) continue;
          keys.addRRect(Skia.RRectXY(Skia.XYWHRect(xr - 7.5, zc - 7.5, 15, 15), 2.5, 2.5));
        }
        if (isSpace) keys.addRRect(Skia.RRectXY(Skia.XYWHRect(xr - 7.5, at.z - kw * 0.19, 15, kw * 0.38), 2.5, 2.5));
      }
      const px0 = t > 0 ? x0 + 14 : at.x + d / 2 - 14 - LAP.padD;
      pad.addRRect(Skia.RRectXY(Skia.XYWHRect(px0, at.z - LAP.padW / 2, LAP.padD, LAP.padW), 7, 7));
    }
    return { base, lid, glass, keys, pad, feet, hinge };
  }, [view, at.x, at.y, at.z, toward, w, d]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = p.base.getBounds();
  const l = p.lid.getBounds();
  const ALU = ['#d3d7de', '#a4a9b2', '#6c717b', '#3f434b'];
  return (
    <Group>
      {view === 'top' ? (
        <Group transform={[{ translateX: -5 }, { translateY: 7 }]}>
          <Path path={p.base} color="#000" opacity={0.35}>
            <BlurMask blur={7} style="normal" />
          </Path>
        </Group>
      ) : null}
      <Path path={p.feet} color="#0b0c0f" />
      <Path path={p.lid}>
        <LinearGradient start={vec(l.x, l.y)} end={vec(l.x + l.width, l.y + l.height)} colors={ALU} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.lid} style="stroke" strokeWidth={1.4} color="#0b0c0f" />
      <Path path={p.base}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={ALU} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      {view === 'top' ? (
        <>
          <Path path={p.keys} color="#16171b" />
          <Group transform={[{ translateX: -0.6 }, { translateY: -0.8 }]}>
            <Path path={p.keys} style="stroke" strokeWidth={0.8} color="#7d828c" opacity={0.55} />
          </Group>
          <Path path={p.pad} color="#9da2ab" />
          <Path path={p.pad} style="stroke" strokeWidth={1.2} color="#5b5f68" />
          <Path path={p.hinge} style="stroke" strokeWidth={5} strokeCap="round" color="#2a2c31" />
        </>
      ) : (
        <>
          <Path path={p.glass} style="stroke" strokeWidth={2.2} strokeCap="butt" color="#2c5a96" />
          <Path path={p.hinge} color="#2a2c31" />
        </>
      )}
      <Path path={p.base} style="stroke" strokeWidth={1.4} color="#0b0c0f" />
      <Group transform={[{ translateX: -0.8 }, { translateY: -1 }]}>
        <Path path={view === 'side' ? p.base : p.lid} style="stroke" strokeWidth={0.9} color="#eef1f5" opacity={0.35} />
      </Group>
    </Group>
  );
}

/** A few sheets of script on the desk (from above: offset pages with lines). */
export function Script({ view, at, turn = 0 }: { view: ViewId; at: Vec3; turn?: number }) {
  const p = useMemo(() => {
    const sheets = make();
    const lines = make();
    if (view === 'side') {
      sheets.addRect(Skia.XYWHRect(at.x - 105, at.y - 5, 210, 5));
    } else {
      for (const [dx, dz] of [
        [6, 8],
        [0, 0],
      ]) sheets.addRRect(Skia.RRectXY(Skia.XYWHRect(at.x - 105 + dx, at.z - 148 + dz, 210, 297), 4, 4));
      for (let k = 0; k < 9; k++) {
        lines.moveTo(at.x - 80 + k * 18, at.z - 120);
        lines.lineTo(at.x - 80 + k * 18, at.z + 100 - (k % 3) * 30);
      }
    }
    return { sheets, lines };
  }, [view, at.x, at.y, at.z]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Group transform={turn ? [{ translateX: at.x }, { translateY: vOf(view, at) }, { rotate: turn }, { translateX: -at.x }, { translateY: -vOf(view, at) }] : []}>
      <Path path={p.sheets} color="#e9e6dc" />
      <Path path={p.sheets} style="stroke" strokeWidth={1.6} color="#8d8a80" />
      <Path path={p.lines} style="stroke" strokeWidth={2} color="#8d8a80" opacity={0.6} />
    </Group>
  );
}

/* ── the lectern ── */

export type LecternSpec = { x0: number; x1: number; top: number; z: number; halfW: number; floor: number; socket: Vec3 };

/*
 * A lectern (real dimensions, mm — a drawing default for the class, B06's
 * spec): a reading top 450 deep × 560 wide, 25 mm thick, sloping down toward
 * the presenter, with a 40 mm book ledge on its low (presenter's) edge; a
 * cabinet body set in under it, its front panel toward the audience; a plinth
 * 60 mm tall, a little wider than the body; the gooseneck socket in the top.
 */
/** A lectern (its reading top sloping down toward the presenter on −x). */
export function Lectern({ view, s }: { view: ViewId; s: LecternSpec }) {
  const p = useMemo(() => {
    const body = make();
    const desk = make();
    const lip = make();
    const plinth = make();
    const panel = make();
    if (view === 'side') {
      // The cabinet: its presenter side set back under the ledge, its
      // audience side flush with the top's high edge.
      body.moveTo(s.x0 + 40, s.top + 78);
      body.lineTo(s.x1 - 6, s.top + 22);
      body.lineTo(s.x1 - 14, s.floor - 60);
      body.lineTo(s.x0 + 52, s.floor - 60);
      body.close();
      // A raised panel on the cabinet's side.
      panel.moveTo(s.x0 + 82, s.top + 120);
      panel.lineTo(s.x1 - 50, s.top + 80);
      panel.lineTo(s.x1 - 56, s.floor - 120);
      panel.lineTo(s.x0 + 92, s.floor - 120);
      panel.close();
      plinth.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0 + 34, s.floor - 60, s.x1 - s.x0 - 34, 60), 6, 6));
      // The reading top: a 25 mm slab from the low edge (x0) to the high edge (x1).
      desk.moveTo(s.x0 - 10, s.top + 60);
      desk.lineTo(s.x1 + 10, s.top);
      desk.lineTo(s.x1 + 10, s.top + 25);
      desk.lineTo(s.x0 - 10, s.top + 85);
      desk.close();
      // The book ledge standing up at the low edge.
      lip.moveTo(s.x0 - 14, s.top + 22);
      lip.lineTo(s.x0 - 14, s.top + 88);
    } else {
      plinth.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0 + 30, s.z - s.halfW + 30, s.x1 - s.x0 - 30, s.halfW * 2 - 60), 14, 14));
      body.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0 - 10, s.z - s.halfW, s.x1 - s.x0 + 20, s.halfW * 2), 12, 12));
      desk.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0 + 6, s.z - s.halfW + 14, s.x1 - s.x0 - 12, s.halfW * 2 - 28), 8, 8));
      lip.moveTo(s.x0 - 8, s.z - s.halfW + 12);
      lip.lineTo(s.x0 - 8, s.z + s.halfW - 12);
    }
    return { body, desk, lip, plinth, panel };
  }, [view, s]);
  const b = p.body.getBounds();
  return (
    <Group>
      <Path path={p.plinth} color="#1d1813" />
      <Path path={p.plinth} style="stroke" strokeWidth={2} color="#0c0a08" />
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height * 0.4)} colors={['#6b5a49', '#4a3c30', '#2a211b']} />
      </Path>
      <Path path={p.panel} style="stroke" strokeWidth={3} color="#2a211b" opacity={0.9} />
      <Group transform={[{ translateX: -2 }, { translateY: -2 }]}>
        <Path path={p.panel} style="stroke" strokeWidth={1.4} color="#a68d73" opacity={0.35} />
      </Group>
      <Path path={p.body} style="stroke" strokeWidth={2.6} color="#0c0a08" />
      <Path path={p.desk}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + 90)} colors={['#8a7560', '#5a4a3b']} />
      </Path>
      <Path path={p.desk} style="stroke" strokeWidth={2.2} color="#0c0a08" />
      <Group transform={[{ translateX: -1.5 }, { translateY: -2 }]}>
        <Path path={p.desk} style="stroke" strokeWidth={1.2} color="#e2cfb6" opacity={0.3} />
      </Group>
      <Path path={p.lip} style="stroke" strokeWidth={9} strokeCap="round" color="#2a211b" />
      <Path path={p.lip} style="stroke" strokeWidth={4} strokeCap="round" color="#6b5a49" />
      <Circle cx={s.socket.x} cy={vOf(view, s.socket)} r={16} color="#16171b" />
      <Circle cx={s.socket.x} cy={vOf(view, s.socket)} r={16} style="stroke" strokeWidth={2} color="#8a8f99" />
      <Circle cx={s.socket.x} cy={vOf(view, s.socket)} r={7} color="#050506" />
    </Group>
  );
}

/* ── a script or music stand (B07: the reader's script) ── */

export type StandSpec = { c: Vec3; tiltDeg: number; w: number; h: number; floor: number };

/*
 * A folding music stand holding a script (real dimensions, mm — a drawing
 * default for the class): a steel desk 500 × 300 (B07's spec), 10 mm thick,
 * a 35 mm ledge with a 15 mm lip along its bottom edge; two A4 sheets (210 ×
 * 297) side by side on it; the desk on a tilt bracket at the back of its
 * middle; a Ø 12 inner tube in a Ø 20 outer tube with a thumb-screw collar;
 * three Ø 10 legs hinged at a hub 330 mm up, feet on a 300 mm radius — one
 * toward the reader, two back at ±60° (from the side: one 300 mm toward the
 * reader, the two back ones overlapping 150 mm behind).
 */
const MSTAND = { thick: 10, ledge: 35, lip: 15, inner: 12, outer: 20, leg: 10, hub: 330, footR: 300, paperW: 420, paperH: 297 } as const;

/** A music stand holding a script: the desk tilted back `tiltDeg` from
 *  upright toward +x (its face to the reader on −x), its column to a tripod. */
export function ScriptStand({ view, s }: { view: ViewId; s: StandSpec }) {
  const p = useMemo(() => {
    const desk = make();
    const paper = make();
    const tubeIn = make();
    const tubeOut = make();
    const legs = make();
    const metal = make();
    const a = s.tiltDeg * DEG;
    const ux = Math.sin(a); // up the slope
    const uy = -Math.cos(a);
    const nx = -Math.cos(a); // the face's normal, toward the reader
    const ny = -Math.sin(a);
    const colX = s.c.x + 20;
    const hub = s.floor - MSTAND.hub;
    if (view === 'side') {
      const B = { x: s.c.x - (ux * s.h) / 2, y: s.c.y - (uy * s.h) / 2 }; // the bottom edge (face side)
      const T = { x: s.c.x + (ux * s.h) / 2, y: s.c.y + (uy * s.h) / 2 }; // the top edge
      const k = MSTAND.thick;
      // The desk slab, its ledge and lip folded out along the bottom.
      desk.moveTo(T.x, T.y);
      desk.lineTo(B.x, B.y);
      desk.lineTo(B.x + nx * MSTAND.ledge, B.y + ny * MSTAND.ledge);
      desk.lineTo(B.x + nx * MSTAND.ledge + ux * MSTAND.lip, B.y + ny * MSTAND.ledge + uy * MSTAND.lip);
      desk.lineTo(B.x + nx * (MSTAND.ledge - 4) + ux * MSTAND.lip, B.y + ny * (MSTAND.ledge - 4) + uy * MSTAND.lip);
      desk.lineTo(B.x + nx * (MSTAND.ledge - 4) - ux * 4, B.y + ny * (MSTAND.ledge - 4) - uy * 4);
      desk.lineTo(B.x - nx * k - ux * 4, B.y - ny * k - uy * 4);
      desk.lineTo(T.x - nx * k, T.y - ny * k);
      desk.close();
      // The script on the face, standing on the ledge, 297 mm up the slope.
      const P0 = { x: B.x + nx * 2.5, y: B.y + ny * 2.5 };
      const L = Math.min(MSTAND.paperH, s.h - 2);
      paper.moveTo(P0.x, P0.y);
      paper.lineTo(P0.x + ux * L, P0.y + uy * L);
      // The tilt bracket from the desk's back to the column's top.
      const back = { x: s.c.x - nx * k, y: s.c.y - ny * k };
      const colTop = s.c.y + 40;
      metal.addCircle(colX, colTop, 9);
      metal.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(back.x, colX) - 4, Math.min(back.y, colTop) - 4, Math.abs(colX - back.x) + 8, Math.abs(colTop - back.y) + 8), 4, 4));
      const collar = colTop + (hub - colTop) * 0.45;
      tubeIn.moveTo(colX, colTop);
      tubeIn.lineTo(colX, collar);
      tubeOut.moveTo(colX, collar);
      tubeOut.lineTo(colX, hub);
      metal.addRRect(Skia.RRectXY(Skia.XYWHRect(colX - 14, collar - 8, 28, 18), 4, 4));
      metal.addRRect(Skia.RRectXY(Skia.XYWHRect(colX + 12, collar - 5, 18, 10), 4, 4));
      metal.addRRect(Skia.RRectXY(Skia.XYWHRect(colX - 16, hub - 12, 32, 30), 5, 5));
      for (const fx of [-MSTAND.footR, MSTAND.footR * Math.cos(60 * DEG)]) {
        legs.moveTo(colX, hub + 10);
        legs.lineTo(colX + fx, s.floor - 4);
      }
    } else {
      const dd = Math.sin(a) * s.h; // the desk's depth seen from above
      const x0 = s.c.x - dd / 2;
      desk.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 - Math.cos(a) * MSTAND.ledge, s.c.z - s.w / 2, Math.max(16, dd) + Math.cos(a) * MSTAND.ledge, s.w), 6, 6));
      const pd = Math.sin(a) * Math.min(MSTAND.paperH, s.h);
      paper.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 2, s.c.z - MSTAND.paperW / 2, Math.max(8, pd - 4), MSTAND.paperW / 2 - 2), 2, 2));
      paper.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 2, s.c.z + 2, Math.max(8, pd - 4), MSTAND.paperW / 2 - 2), 2, 2));
      // The ledge's lip along the reader's edge.
      metal.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 - Math.cos(a) * MSTAND.ledge, s.c.z - s.w / 2 + 4, 6, s.w - 8), 2, 2));
      for (const deg of [180, 60, -60]) {
        const t = deg * DEG;
        legs.moveTo(colX, s.c.z);
        legs.lineTo(colX + Math.cos(t) * MSTAND.footR, s.c.z + Math.sin(t) * MSTAND.footR);
      }
    }
    return { desk, paper, tubeIn, tubeOut, legs, metal };
  }, [view, s]);
  const b = p.desk.getBounds();
  return (
    <Group>
      <Path path={p.legs} style="stroke" strokeWidth={MSTAND.leg + 5} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={MSTAND.leg} strokeCap="round" color="#4a4e57" />
      <Path path={p.tubeOut} style="stroke" strokeWidth={MSTAND.outer + 4} color="#0b0c0f" />
      <Path path={p.tubeOut} style="stroke" strokeWidth={MSTAND.outer} color="#3d4049" />
      <Path path={p.tubeIn} style="stroke" strokeWidth={MSTAND.inner + 4} color="#0b0c0f" />
      <Path path={p.tubeIn} style="stroke" strokeWidth={MSTAND.inner} color="#8a8f99" />
      <Path path={p.metal} color="#2a2c32" />
      <Path path={p.metal} style="stroke" strokeWidth={1.6} color="#060607" />
      <Path path={p.desk}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#4a4e57', '#2a2c32', '#15161a']} />
      </Path>
      <Path path={p.desk} style="stroke" strokeWidth={2} color="#060607" />
      {view === 'side' ? <Path path={p.paper} style="stroke" strokeWidth={4} strokeCap="butt" color="#e9e6dc" /> : <Path path={p.paper} color="#e9e6dc" />}
      {view === 'top' ? <Path path={p.paper} style="stroke" strokeWidth={1.4} color="#8d8a80" /> : null}
    </Group>
  );
}

/* ── a loudspeaker on a pole ── */

/*
 * A loudspeaker on a pole (real dimensions, mm — drawing defaults for the
 * class). The default box is a 10–12-inch two-way PA cabinet: 560 tall ×
 * 360 wide × 340 deep, its sides tapering about 30 mm top and bottom toward
 * the back, a perforated steel grille wrapping the front 14 mm, a recessed
 * grip in the top, a 35 mm pole cup in the bottom. The stand: a Ø 35 mm top
 * tube in a Ø 38 mm base tube with its clamp knob, three Ø 25 mm legs hinged
 * at a hub collar 600 mm up, their feet on a circle of 560 mm radius (one leg
 * straight back, two forward at ±60° — from the side, one leg 560 mm back and
 * the two forward ones overlapping 280 mm forward), braced from a lower
 * collar 230 mm up to each leg's middle.
 * Without a pole (`pole` false) the cabinet is flown: a rigging bracket on
 * its top and two drop lines up to the pick-up points.
 * A box under 400 mm tall is drawn as a nearfield studio monitor instead
 * (B07's desk monitor, 260 × 160 × 200): a straight-sided box, a thick
 * front baffle, no grip, no pole cup, on a small isolation pad.
 */
const POLE = { top: 35, base: 38, leg: 25, hub: 600, brace: 230, footR: 560 } as const;

/** A PA or monitor cabinet: its front (the grille) facing `faces` (±x) on a
 *  pole to a tripod (side), or the cabinet from above. `c`: the cabinet's
 *  centre; `h`, `d` its height and depth. */
export function PaSpeaker({ view, c, faces, h = 560, d = 340, w = 360, floor, pole = true }: { view: ViewId; c: Vec3; faces: 1 | -1; h?: number; d?: number; w?: number; floor: number; pole?: boolean }) {
  const monitor = h < 400;
  const p = useMemo(() => {
    const cab = make();
    const grille = make();
    const perf = make();
    const recess = make();
    const metal = make();
    const tubeTop = make();
    const tubeBase = make();
    const legs = make();
    const braces = make();
    const f = faces;
    const fx = c.x + (f * d) / 2;
    const bx = c.x - (f * d) / 2;
    const taper = monitor ? 0 : 30;
    if (view === 'side') {
      const yT = c.y - h / 2;
      const yB = c.y + h / 2;
      const r = monitor ? 10 : 18;
      // The side panel: the front full height, the back `taper` shorter top and bottom.
      cab.moveTo(fx, yT + r);
      cab.quadTo(fx, yT, fx - f * r, yT);
      cab.lineTo(bx + f * r, yT + taper * ((d - r) / d));
      cab.quadTo(bx, yT + taper, bx, yT + taper + r);
      cab.lineTo(bx, yB - taper - r);
      cab.quadTo(bx, yB - taper, bx + f * r, yB - taper * ((d - r) / d));
      cab.lineTo(fx - f * r, yB);
      cab.quadTo(fx, yB, fx, yB - r);
      cab.close();
      // The grille's (or the baffle's) edge along the front.
      const gw = monitor ? 22 : 14;
      grille.addRRect(Skia.RRectXY(Skia.XYWHRect(f > 0 ? fx - gw : fx, yT + 3, gw, h - 6), 4, 4));
      if (!monitor) {
        for (let y = yT + 16; y < yB - 10; y += 14) perf.addCircle(fx - (f * gw) / 2, y, 2.6);
        // The grip recessed in the top, near the balance point; the pole cup
        // underneath; rubber feet on the bottom's slope.
        recess.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - 70, yT + 10, 140, 34), 14, 14));
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - 26, yB - taper * 0.5 - 8, 52, 14), 4, 4));
        const bottomAt = (x: number) => yB - (taper * Math.abs(x - fx)) / d;
        for (const x of [c.x + f * d * 0.32, c.x - f * d * 0.32]) metal.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 16, bottomAt(x) - 1, 32, 8), 3, 3));
      } else {
        // The monitor's isolation pad under it.
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(bx, fx) + 12, yB, d - 24, 20), 5, 5));
      }
      if (!pole && !monitor) {
        // Flown (a cluster): its rigging bracket on the top and two steel
        // drop lines up to the pick-up points (drawn 350 mm, the rest beyond).
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - d * 0.4, yT - 14, d * 0.8, 16), 4, 4));
        for (const x of [c.x - d * 0.3, c.x + d * 0.3]) {
          braces.moveTo(x, yT - 14);
          braces.lineTo(x, yT - 360);
        }
      }
      if (pole && !monitor) {
        const cup = yB - taper * 0.5;
        const hub = floor - POLE.hub;
        const knob = cup + (hub - cup) * 0.42;
        tubeTop.moveTo(c.x, cup);
        tubeTop.lineTo(c.x, knob);
        tubeBase.moveTo(c.x, knob - 10);
        tubeBase.lineTo(c.x, floor - POLE.brace + 40);
        // The clamp knob at the joint, the hub collar, the brace collar.
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - 30, knob - 14, 60, 30), 8, 8));
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x + f * 22 - 10, knob - 8, 34, 18), 7, 7));
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - 34, hub - 22, 68, 44), 8, 8));
        metal.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - 30, floor - POLE.brace - 16, 60, 32), 7, 7));
        // Three legs, one straight back and two forward at ±60° (from the side:
        // one to the back, the two forward ones on top of each other), each
        // braced at its middle from the lower collar.
        for (const fxo of [-f * POLE.footR, f * POLE.footR * Math.cos(60 * DEG)]) {
          const foot = c.x + fxo;
          legs.moveTo(c.x + Math.sign(fxo) * 14, hub + 10);
          legs.lineTo(foot, floor - 8);
          braces.moveTo(c.x, floor - POLE.brace);
          braces.lineTo(c.x + fxo * 0.5, hub + 10 + (floor - 18 - hub) * 0.5);
        }
      }
    } else {
      const zL = c.z - w / 2;
      const zR = c.z + w / 2;
      const t = monitor ? 0 : 40;
      cab.moveTo(fx, zL + 14);
      cab.quadTo(fx, zL, fx - f * 14, zL);
      cab.lineTo(bx + f * 14, zL + t);
      cab.quadTo(bx, zL + t, bx, zL + t + 14);
      cab.lineTo(bx, zR - t - 14);
      cab.quadTo(bx, zR - t, bx + f * 14, zR - t);
      cab.lineTo(fx - f * 14, zR);
      cab.quadTo(fx, zR, fx, zR - 14);
      cab.close();
      const gw = monitor ? 22 : 14;
      grille.addRRect(Skia.RRectXY(Skia.XYWHRect(f > 0 ? fx - gw : fx, zL + 3, gw, w - 6), 4, 4));
      if (!monitor) {
        for (let z = zL + 16; z < zR - 10; z += 14) perf.addCircle(fx - (f * gw) / 2, z, 2.6);
        recess.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x - 34 - f * 10, c.z - 70, 68, 140), 20, 20));
        if (pole) {
          // The stand's three legs from above: one straight back, two forward at ±60°.
          for (const a of [180, 60, -60]) {
            const ang = a * DEG + (f > 0 ? 0 : Math.PI);
            legs.moveTo(c.x, c.z);
            legs.lineTo(c.x + Math.cos(ang) * POLE.footR, c.z + Math.sin(ang) * POLE.footR);
          }
        }
      }
    }
    return { cab, grille, perf, recess, metal, tubeTop, tubeBase, legs, braces };
  }, [view, c.x, c.y, c.z, faces, h, d, w, floor, pole, monitor]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = p.cab.getBounds();
  return (
    <Group>
      <Path path={p.braces} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={p.braces} style="stroke" strokeWidth={9} strokeCap="round" color="#3d4049" />
      <Path path={p.legs} style="stroke" strokeWidth={POLE.leg + 6} strokeCap="round" color="#0b0c0f" opacity={view === 'top' ? 0.8 : 1} />
      <Path path={p.legs} style="stroke" strokeWidth={POLE.leg} strokeCap="round" color="#4a4e57" opacity={view === 'top' ? 0.8 : 1} />
      <Path path={p.tubeBase} style="stroke" strokeWidth={POLE.base + 5} strokeCap="butt" color="#0b0c0f" />
      <Path path={p.tubeBase} style="stroke" strokeWidth={POLE.base}>
        <LinearGradient start={vec(c.x - POLE.base / 2, 0)} end={vec(c.x + POLE.base / 2, 0)} colors={['#6a6e78', '#2d3036', '#141519']} />
      </Path>
      <Path path={p.tubeTop} style="stroke" strokeWidth={POLE.top + 4} strokeCap="butt" color="#0b0c0f" />
      <Path path={p.tubeTop} style="stroke" strokeWidth={POLE.top}>
        <LinearGradient start={vec(c.x - POLE.top / 2, 0)} end={vec(c.x + POLE.top / 2, 0)} colors={['#c3c8d1', '#7c818b', '#2f3238']} />
      </Path>
      <Path path={p.cab}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#44474f', '#24262b', '#121316', '#08090b']} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.recess} color="#08090b" opacity={0.9} />
      <Path path={p.grille}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={monitor ? ['#2c2e34', '#121317'] : ['#5a5e68', '#2a2c32', '#15161a']} />
      </Path>
      <Path path={p.perf} color="#060607" opacity={0.85} />
      <Path path={p.metal}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#8a8f99', '#3d4049', '#1b1c21']} />
      </Path>
      <Path path={p.metal} style="stroke" strokeWidth={1.6} color="#050506" />
      <Path path={p.cab} style="stroke" strokeWidth={2.6} color="#050506" />
      <Group transform={[{ translateX: -1.6 }, { translateY: -2 }]}>
        <Path path={p.cab} style="stroke" strokeWidth={1.4} color="#c9ced8" opacity={0.3} />
      </Group>
    </Group>
  );
}

/* ── a booth wall's soft panels (B07) ── */

/** Soft acoustic panels on a wall at x = `x` (behind the reader, side view:
 *  a row of fabric panels; from above, the wall's thickness). Illustrated
 *  only: no absorption numbers. */
export function AcousticPanels({ view, x, y0, y1, z0, z1 }: { view: ViewId; x: number; y0: number; y1: number; z0: number; z1: number }) {
  const p = useMemo(() => {
    const wall = make();
    const panels = make();
    if (view === 'side') {
      wall.addRect(Skia.XYWHRect(x - 40, y0 - 60, 40, y1 - y0 + 120));
      for (let k = 0; k < 3; k++) panels.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y0 + k * ((y1 - y0) / 3) + 10, 60, (y1 - y0) / 3 - 20), 12, 12));
    } else {
      wall.addRect(Skia.XYWHRect(x - 40, z0, 40, z1 - z0));
      panels.addRRect(Skia.RRectXY(Skia.XYWHRect(x, z0 + 60, 60, z1 - z0 - 120), 12, 12));
    }
    return { wall, panels };
  }, [view, x, y0, y1, z0, z1]);
  return (
    <Group>
      <Path path={p.wall} color="#20232a" />
      <Path path={p.panels}>
        <LinearGradient start={vec(x, y0)} end={vec(x + 60, y1)} colors={['#4b5568', '#323a49', '#222834']} />
      </Path>
      <Path path={p.panels} style="stroke" strokeWidth={2.4} color="#0e1117" />
    </Group>
  );
}

/** A talker's place on the plan in words (for screen readers). */
export function talkerWhere(t: Talker): string {
  return t.facing > 0 ? 'facing right' : 'facing left';
}
/** Re-export for lessons: a frame-V point on a talker. */
export { onTalker };
