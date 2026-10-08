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
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
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

/** The clamp on the desk's edge and the riser post up to the arm's grip. */
export function ArmClamp({ view, grip, deskTop, thick = 30 }: { view: ViewId; grip: Vec3; deskTop: number; thick?: number }) {
  const p = useMemo(() => {
    const post = make();
    const clamp = make();
    const screw = make();
    const gu = grip.x;
    const gv = vOf(view, grip);
    if (view === 'side') {
      post.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 11, gv, 22, deskTop - gv), 6, 6));
      clamp.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 34, deskTop - 22, 68, 22), 5, 5));
      clamp.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 34, deskTop + thick, 68, 18), 5, 5));
      clamp.addRect(Skia.XYWHRect(gu + 20, deskTop - 22, 14, thick + 40));
      screw.moveTo(gu - 10, deskTop + thick + 18);
      screw.lineTo(gu - 10, deskTop + thick + 74);
    } else {
      clamp.addRRect(Skia.RRectXY(Skia.XYWHRect(gu - 34, gv - 34, 68, 68), 8, 8));
      post.addOval(Skia.XYWHRect(gu - 13, gv - 13, 26, 26));
    }
    return { post, clamp, screw };
  }, [view, grip.x, grip.y, grip.z, deskTop, thick]); // eslint-disable-line react-hooks/exhaustive-deps
  const gu = grip.x;
  return (
    <Group>
      <Path path={p.screw} style="stroke" strokeWidth={8} strokeCap="round" color="#5b5f69" />
      <Path path={p.clamp}>
        <LinearGradient start={vec(gu - 34, 0)} end={vec(gu + 34, 0)} colors={['#4f535c', '#26282e', '#0d0e11']} />
      </Path>
      <Path path={p.clamp} style="stroke" strokeWidth={2} color="#060607" />
      <Path path={p.post}>
        <LinearGradient start={vec(gu - 12, 0)} end={vec(gu + 12, 0)} colors={['#d4d8e0', '#7c818b', '#2a2c32']} />
      </Path>
      <Path path={p.post} style="stroke" strokeWidth={1.6} color="#060607" />
    </Group>
  );
}

/** A gooseneck's weighted base on the table: a low round puck with a mute key
 *  and its LED ring (`on`: green when the mic is open, red when muted). */
export function GooseBase({ view, at, on = true }: { view: ViewId; at: Vec3; on?: boolean }) {
  const u = at.x;
  const v = vOf(view, at);
  const p = useMemo(() => {
    const body = make();
    const key = make();
    if (view === 'side') {
      body.moveTo(u - 70, v + 34);
      body.cubicTo(u - 66, v + 4, u - 40, v, u, v);
      body.cubicTo(u + 40, v, u + 66, v + 4, u + 70, v + 34);
      body.close();
      key.addRRect(Skia.RRectXY(Skia.XYWHRect(u + 22, v + 4, 30, 10), 3, 3));
    } else {
      body.addOval(Skia.XYWHRect(u - 70, v - 70, 140, 140));
      key.addRRect(Skia.RRectXY(Skia.XYWHRect(u + 20, v - 18, 34, 36), 6, 6));
    }
    return { body, key };
  }, [view, u, v]);
  const led = on ? '#5bff85' : '#ff5a48';
  return (
    <Group>
      <Path path={p.body}>
        <LinearGradient start={vec(u - 70, v - 70)} end={vec(u + 70, v + 70)} colors={['#5a5e67', '#2a2c32', '#111215']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={2} color="#060607" />
      <Path path={p.key} color="#1c1d22" />
      <Path path={p.key} style="stroke" strokeWidth={2.5} color={led} opacity={0.95} />
    </Group>
  );
}

/* ── things on the desk ── */

/** A laptop: from the side its base on the desk and its screen tilted back
 *  toward −x (facing a talker on the −x side) — `toward` −1 for one on +x. */
export function Laptop({ view, at, toward = 1, w = 330, d = 230 }: { view: ViewId; at: Vec3; toward?: 1 | -1; w?: number; d?: number }) {
  const p = useMemo(() => {
    const base = make();
    const screen = make();
    const lid = make();
    if (view === 'side') {
      const x0 = at.x - d / 2;
      base.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, at.y - 16, d, 16), 4, 4));
      const hx = toward > 0 ? x0 + d : x0;
      const tip = { u: hx + toward * 60, v: at.y - 16 - 210 };
      screen.moveTo(hx, at.y - 16);
      screen.lineTo(tip.u, tip.v);
      lid.moveTo(hx + toward * 6, at.y - 16);
      lid.lineTo(tip.u + toward * 6, tip.v);
    } else {
      base.addRRect(Skia.RRectXY(Skia.XYWHRect(at.x - d / 2, at.z - w / 2, d, w), 10, 10));
      const hx = toward > 0 ? at.x + d / 2 : at.x - d / 2;
      screen.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(hx, hx + toward * 64), at.z - w / 2, 64, w), 6, 6));
    }
    return { base, screen, lid };
  }, [view, at.x, at.y, at.z, toward, w, d]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = p.base.getBounds();
  return (
    <Group>
      <Path path={p.base}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#b9bec8', '#6f747e', '#33363d']} />
      </Path>
      <Path path={p.base} style="stroke" strokeWidth={2} color="#0b0c0f" />
      {view === 'side' ? (
        <>
          <Path path={p.lid} style="stroke" strokeWidth={12} strokeCap="round" color="#8a8f99" />
          <Path path={p.screen} style="stroke" strokeWidth={8} strokeCap="round" color="#1d3a66" />
        </>
      ) : (
        <>
          <Path path={p.screen}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#9aa0ab', '#4a4e57']} />
          </Path>
          <Path path={p.screen} style="stroke" strokeWidth={2} color="#0b0c0f" />
        </>
      )}
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

/** A lectern (its reading top sloping down toward the presenter on −x). */
export function Lectern({ view, s }: { view: ViewId; s: LecternSpec }) {
  const p = useMemo(() => {
    const body = make();
    const desk = make();
    const lip = make();
    if (view === 'side') {
      body.moveTo(s.x0 + 30, s.top + 40);
      body.lineTo(s.x1 - 20, s.top + 20);
      body.lineTo(s.x1 + 10, s.floor);
      body.lineTo(s.x0 + 10, s.floor);
      body.close();
      desk.moveTo(s.x0 - 10, s.top + 60);
      desk.lineTo(s.x1 + 10, s.top);
      desk.lineTo(s.x1 + 10, s.top + 28);
      desk.lineTo(s.x0 - 10, s.top + 88);
      desk.close();
      lip.moveTo(s.x0 - 12, s.top + 50);
      lip.lineTo(s.x0 - 12, s.top + 92);
    } else {
      body.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0, s.z - s.halfW, s.x1 - s.x0, s.halfW * 2), 18, 18));
      desk.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x0 + 14, s.z - s.halfW + 14, s.x1 - s.x0 - 28, s.halfW * 2 - 28), 10, 10));
    }
    return { body, desk, lip };
  }, [view, s]);
  const b = p.body.getBounds();
  return (
    <Group>
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height * 0.4)} colors={['#6b5a49', '#4a3c30', '#2a211b']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={2.6} color="#0c0a08" />
      <Path path={p.desk}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + 90)} colors={['#8a7560', '#5a4a3b']} />
      </Path>
      <Path path={p.desk} style="stroke" strokeWidth={2.2} color="#0c0a08" />
      <Path path={p.lip} style="stroke" strokeWidth={8} strokeCap="round" color="#2a211b" />
      <Circle cx={s.socket.x} cy={vOf(view, s.socket)} r={16} color="#16171b" />
      <Circle cx={s.socket.x} cy={vOf(view, s.socket)} r={16} style="stroke" strokeWidth={2} color="#8a8f99" />
    </Group>
  );
}

/* ── a script or music stand (B07: the reader's script) ── */

export type StandSpec = { c: Vec3; tiltDeg: number; w: number; h: number; floor: number };

/** A music stand holding a script: the desk tilted back `tiltDeg` from
 *  upright toward +x (its face to the reader on −x), its column to a tripod. */
export function ScriptStand({ view, s }: { view: ViewId; s: StandSpec }) {
  const p = useMemo(() => {
    const desk = make();
    const paper = make();
    const column = make();
    const a = s.tiltDeg * DEG;
    if (view === 'side') {
      const dx = Math.sin(a) * (s.h / 2);
      const dy = Math.cos(a) * (s.h / 2);
      desk.moveTo(s.c.x - dx, s.c.y + dy);
      desk.lineTo(s.c.x + dx, s.c.y - dy);
      paper.moveTo(s.c.x - dx - 8, s.c.y + dy - 30);
      paper.lineTo(s.c.x + dx - 8, s.c.y - dy - 10);
      column.moveTo(s.c.x + 20, s.c.y + dy * 0.6);
      column.lineTo(s.c.x + 20, s.floor - 40);
      column.moveTo(s.c.x + 20, s.floor - 120);
      column.lineTo(s.c.x - 200, s.floor);
      column.moveTo(s.c.x + 20, s.floor - 120);
      column.lineTo(s.c.x + 220, s.floor);
    } else {
      const dd = Math.sin(a) * s.h;
      desk.addRRect(Skia.RRectXY(Skia.XYWHRect(s.c.x - dd / 2, s.c.z - s.w / 2, Math.max(16, dd), s.w), 6, 6));
      paper.addRRect(Skia.RRectXY(Skia.XYWHRect(s.c.x - dd / 2 + 4, s.c.z - s.w / 2 + 24, Math.max(10, dd - 8), s.w - 48), 4, 4));
      for (let i = 0; i < 3; i++) {
        const t = Math.PI / 2 + (i * 2 * Math.PI) / 3;
        column.moveTo(s.c.x + 20, s.c.z);
        column.lineTo(s.c.x + 20 + Math.cos(t) * 230, s.c.z + Math.sin(t) * 230);
      }
    }
    return { desk, paper, column };
  }, [view, s]);
  return (
    <Group>
      <Path path={p.column} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={p.column} style="stroke" strokeWidth={9} strokeCap="round" color="#4a4e57" />
      {view === 'side' ? (
        <>
          <Path path={p.desk} style="stroke" strokeWidth={14} strokeCap="round" color="#2a2c32" />
          <Path path={p.paper} style="stroke" strokeWidth={4} strokeCap="round" color="#e9e6dc" />
        </>
      ) : (
        <>
          <Path path={p.desk} color="#2a2c32" />
          <Path path={p.paper} color="#e9e6dc" />
          <Path path={p.desk} style="stroke" strokeWidth={2} color="#0b0c0f" />
        </>
      )}
    </Group>
  );
}

/* ── a loudspeaker on a pole ── */

/** A PA or monitor cabinet: its front (the grille) facing `faces` (±x) on a
 *  pole to a tripod (side), or the cabinet from above. `c`: the cabinet's
 *  centre; `h`, `d` its height and depth. */
export function PaSpeaker({ view, c, faces, h = 560, d = 340, w = 360, floor, pole = true }: { view: ViewId; c: Vec3; faces: 1 | -1; h?: number; d?: number; w?: number; floor: number; pole?: boolean }) {
  const p = useMemo(() => {
    const cab = make();
    const grille = make();
    const legs = make();
    const fx = c.x + (faces * d) / 2;
    if (view === 'side') {
      cab.moveTo(c.x - faces * (d / 2), c.y - h / 2 + 30);
      cab.lineTo(fx, c.y - h / 2);
      cab.lineTo(fx, c.y + h / 2);
      cab.lineTo(c.x - faces * (d / 2), c.y + h / 2 - 30);
      cab.close();
      grille.addRect(Skia.XYWHRect(faces > 0 ? fx - 14 : fx, c.y - h / 2 + 6, 14, h - 12));
      if (pole) {
        legs.moveTo(c.x, c.y + h / 2);
        legs.lineTo(c.x, floor - 200);
        legs.moveTo(c.x, floor - 200);
        legs.lineTo(c.x - 320, floor);
        legs.moveTo(c.x, floor - 200);
        legs.lineTo(c.x + 320, floor);
      }
    } else {
      cab.moveTo(c.x - faces * (d / 2), c.z - w / 2 + 40);
      cab.lineTo(fx, c.z - w / 2);
      cab.lineTo(fx, c.z + w / 2);
      cab.lineTo(c.x - faces * (d / 2), c.z + w / 2 - 40);
      cab.close();
      grille.addRect(Skia.XYWHRect(faces > 0 ? fx - 14 : fx, c.z - w / 2 + 6, 14, w - 12));
    }
    return { cab, grille, legs };
  }, [view, c.x, c.y, c.z, faces, h, d, w, floor, pole]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = p.cab.getBounds();
  return (
    <Group>
      <Path path={p.legs} style="stroke" strokeWidth={22} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={14} strokeCap="round" color="#3d4049" />
      <Path path={p.cab}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#3a3d45', '#1d1e23', '#0b0c0f']} />
      </Path>
      <Path path={p.grille}>
        <RadialGradient c={vec(b.x + b.width / 2, b.y + b.height / 2)} r={Math.max(b.width, b.height) / 2} colors={['#4a4e57', '#15161a']} />
      </Path>
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
