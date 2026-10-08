/**
 * SPEECH IN SPORT — the look (charter §2 layer 3). Lab 7b group 1 (B09
 * commentators, B10 sideline interviews, B11 athletes, coaches and
 * officials). Real objects lit from the upper left, in the engine's two views
 * (side: u = x, v = y; top: u = x, v = z — frame V, mm) and, for the body-
 * worn layout, from the FRONT (u = −z, v = y). Static (D8).
 *
 *   StandingTalker  the shared player figure standing (standing.ts) at any
 *                   lip point, facing ±x — the open mouth in profile,
 *                   closed headphones or a commentary headset, an arm folded
 *                   away when the engine draws it holding a mic.
 *   BoothWindow     the commentary position's window (its frame and glass)
 *                   or an open-air rail, toward the field.
 *   PlayAreaHatch   the play area's edge: a hatched keep-out band with its
 *                   touchline — nobody steps into it for a better angle.
 *   Backdrop        a post-event interview backdrop (a plain board on feet;
 *                   no logos).
 *   CrowdStand      the near crowd as a few rows of seats, drawn in plan or
 *                   in section (where the noise comes from).
 *   BodyPack, BodyChain  the wireless pack at the small of the back, the
 *                   cable with its strain-relief loop, the antenna hanging
 *                   straight (never coiled).
 *   KeepOutRegion   a hatched "never mount here" region (a helmet, pads).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, PathOp, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { Shape3, Vec3, ViewId } from '../../../engine/model/types.ts';
import { FigureMass, PlayerBehind, PlayerInFront, figureCovers, handShape } from '../players/PlayerFigure';
import { Headphones, OnTalker, talkerPose } from './BroadcastArt';
import { frontUV, standPoses, type Stander } from './standing.ts';
import type { Talker } from './talkerPose.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { EAR, EAR_HALF, HEAD_C, HEAD_R, VOICE_DIMS } from '../voice/voiceSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';

function mouthPath(): SkPath {
  const p = make();
  p.moveTo(1.5, -2.5);
  p.cubicTo(-4, -4.5, -11, -3.5, -14, 0);
  p.cubicTo(-11, 3.5, -4, 4.5, 1.5, 2.5);
  p.close();
  return p;
}
const MOUTH = mouthPath();

const poseCache = new Map<string, { side: PlayerPose; top: PlayerPose }>();
/** The standing poses of a talker (cached). */
export function standingPoses(t: Stander, opts: { headless?: boolean; arm?: 'R' | 'L' } = {}): { side: PlayerPose; top: PlayerPose } {
  const key = `${t.lip.x}:${t.lip.y}:${t.lip.z}:${t.facing}:${opts.headless ? 1 : 0}:${opts.arm ?? ''}`;
  let p = poseCache.get(key);
  if (!p) {
    p = standPoses(t, opts);
    poseCache.set(key, p);
  }
  return p;
}

/** The hand an arm-folded figure keeps (PlayerInFront draws both hands or
 *  none): drawn on its own, in the figure's turn. */
function KeptHand({ pose, arm }: { pose: PlayerPose; arm: 'R' | 'L' }) {
  const h = useMemo(() => handShape(arm === 'R' ? pose.handL : pose.handR), [pose, arm]);
  const turn = pose.view === 'above' && pose.facing !== undefined ? [{ translateX: pose.neck.u }, { translateY: pose.neck.v }, { rotate: pose.facing - Math.PI / 2 }, { translateX: -pose.neck.u }, { translateY: -pose.neck.v }] : undefined;
  return (
    <Group transform={turn}>
      <FigureMass path={h.path} tone="skin" />
    </Group>
  );
}

/** A standing talker. `arm`: that arm is folded away (the engine draws it
 *  holding a mic); `phones`: closed headphones; `dim`: drawn behind. */
export function StandingTalker({ view, t, phones = false, headless = false, arm, dim = 1 }: { view: ViewId; t: Stander; phones?: boolean; headless?: boolean; arm?: 'R' | 'L'; dim?: number }) {
  const poses = standingPoses(t, { headless, arm });
  const pose = view === 'side' ? poses.side : poses.top;
  return (
    <Group opacity={dim}>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} hands={view === 'side' && !arm} />
      {arm && view === 'side' ? <KeptHand pose={pose} arm={arm} /> : null}
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

/** A SEATED talker whose right arm holds a mic (the engine draws that arm
 *  from the shoulder): the right arm folded into the shoulder, the left hand
 *  kept on the desk. `part` as SeatedTalker's. */
export function SeatedHolding({ view, t, phones = false, part = 'all' }: { view: ViewId; t: Talker; phones?: boolean; part?: 'all' | 'lower' | 'upper' }) {
  const base = talkerPose(view, t);
  const pose: PlayerPose = { ...base, elbowR: base.shoulderR, handR: { ...base.handR, wrist: base.shoulderR } };
  if (part === 'lower') return <PlayerBehind pose={pose} part="legs" />;
  return (
    <Group>
      <PlayerBehind pose={pose} part={view === 'top' ? (part === 'all' ? 'all' : 'upper') : 'all'} />
      <PlayerInFront pose={pose} hands={false} />
      <KeptHand pose={pose} arm="R" />
      {view === 'side' ? (
        <OnTalker view={view} t={t}>
          <Path path={MOUTH} color="#24170f" opacity={0.92} />
        </OnTalker>
      ) : null}
      {phones ? (
        <OnTalker view={view} t={t}>
          <Headphones view={view} />
        </OnTalker>
      ) : null}
    </Group>
  );
}

/** Whether the drawn standing talker covers (u, v) (labels keep off it). */
export function standingCovers(view: ViewId, t: Stander, u: number, v: number, tol: number, arm?: 'R' | 'L'): boolean {
  const poses = standingPoses(t, { arm });
  if (view === 'side') return figureCovers(poses.side, u, v, tol);
  const pose = poses.top;
  const a = -((pose.facing ?? 0) - Math.PI / 2);
  const du = u - pose.neck.u;
  const dv = v - pose.neck.v;
  return figureCovers(pose, pose.neck.u + du * Math.cos(a) - dv * Math.sin(a), pose.neck.v + du * Math.sin(a) + dv * Math.cos(a), tol);
}

/* ── the booth window / the open rail ── */

/** The commentary position's front: a window (frame, glass, a sill) — or,
 *  `open`, a rail with nothing between the talker and the stadium. `x` the
 *  front's plane, from `z0` to `z1`, between heights `y0` (top) and `y1`. */
export function BoothWindow({ view, x, y0, y1, z0, z1, open = false }: { view: ViewId; x: number; y0: number; y1: number; z0: number; z1: number; open?: boolean }) {
  const p = useMemo(() => {
    const frame = make();
    const glass = make();
    const sill = make();
    if (view === 'side') {
      if (open) {
        frame.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 20, y1 - 380, 40, 380), 10, 10));
        sill.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 40, y1 - 400, 80, 36), 12, 12));
      } else {
        frame.addRect(Skia.XYWHRect(x - 24, y0, 48, y1 - y0));
        glass.addRect(Skia.XYWHRect(x - 10, y0 + 30, 20, y1 - y0 - 330));
        sill.addRect(Skia.XYWHRect(x - 60, y1 - 300, 120, 40));
      }
    } else {
      frame.addRect(Skia.XYWHRect(x - 24, z0, 48, z1 - z0));
      if (!open) glass.addRect(Skia.XYWHRect(x - 10, z0 + 60, 20, z1 - z0 - 120));
    }
    return { frame, glass, sill };
  }, [view, x, y0, y1, z0, z1, open]);
  return (
    <Group>
      <Path path={p.glass} color="#8fbcff" opacity={0.28} />
      <Path path={p.frame}>
        <LinearGradient start={vec(x - 30, 0)} end={vec(x + 30, 0)} colors={['#7d828c', '#3a3d45', '#1b1c21']} />
      </Path>
      <Path path={p.sill} color="#3a3d45" />
      <Path path={p.frame} style="stroke" strokeWidth={2.4} color="#060607" />
    </Group>
  );
}

/* ── the play area's edge ── */

/** The play area beyond a touchline at x = `x` (plan) — a hatched keep-out
 *  band `depth` deep (signed: negative = the play area toward −x), the
 *  touchline drawn white. In section: the field's surface. */
export function PlayAreaHatch({ view, x, depth, z0, z1, floor }: { view: ViewId; x: number; depth: number; z0: number; z1: number; floor: number }) {
  const p = useMemo(() => {
    const band = make();
    const hatch = make();
    const line = make();
    const x0 = Math.min(x, x + depth);
    const d = Math.abs(depth);
    if (view === 'top') {
      band.addRect(Skia.XYWHRect(x0, z0, d, z1 - z0));
      for (let k = z0 - d; k < z1; k += 120) {
        hatch.moveTo(x0, k);
        hatch.lineTo(x0 + d, k + d);
      }
      line.moveTo(x, z0);
      line.lineTo(x, z1);
    } else {
      band.addRect(Skia.XYWHRect(x0, floor - 30, d, 30));
      line.moveTo(x, floor - 30);
      line.lineTo(x, floor);
    }
    return { band, hatch, line };
  }, [view, x, depth, z0, z1, floor]);
  return (
    <Group>
      <Path path={p.band} color="#2f6b3a" opacity={0.55} />
      <Group clip={p.band}>
        <Path path={p.hatch} style="stroke" strokeWidth={8} color="#ff6b5e" opacity={0.35} />
      </Group>
      <Path path={p.line} style="stroke" strokeWidth={14} color="#f2f4f8" opacity={0.9} />
    </Group>
  );
}

/* ── the post-event backdrop ── */

/** A plain backdrop board on two feet behind a talker (no logos). */
export function Backdrop({ view, x, z0, z1, h, floor }: { view: ViewId; x: number; z0: number; z1: number; h: number; floor: number }) {
  const p = useMemo(() => {
    const board = make();
    const feet = make();
    if (view === 'side') {
      board.addRect(Skia.XYWHRect(x - 20, floor - h, 40, h - 40));
      feet.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 220, floor - 40, 440, 40), 10, 10));
    } else {
      board.addRect(Skia.XYWHRect(x - 20, z0, 40, z1 - z0));
      feet.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 220, z0 + 60, 440, 60), 10, 10));
      feet.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 220, z1 - 120, 440, 60), 10, 10));
    }
    return { board, feet };
  }, [view, x, z0, z1, h, floor]);
  const b = p.board.getBounds();
  return (
    <Group>
      <Path path={p.feet} color="#1b1c21" />
      <Path path={p.board}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#3d4a66', '#26304a', '#161c2c']} />
      </Path>
      <Path path={p.board} style="stroke" strokeWidth={2.4} color="#060607" />
    </Group>
  );
}

/* ── the crowd ── */

/** A few rows of stadium seats with heads (where the crowd noise comes
 *  from): in plan, rows along z from `x0` outward by `dx`; in section, a
 *  rake rising away. Muted: it is the background. */
export function CrowdStand({ view, x0, dx, z0, z1, floor, rows = 4 }: { view: ViewId; x0: number; dx: number; z0: number; z1: number; floor: number; rows?: number }) {
  const p = useMemo(() => {
    const seats = make();
    const heads = make();
    const sgn = Math.sign(dx) || 1;
    const step = Math.abs(dx) / rows;
    for (let r = 0; r < rows; r++) {
      const x = x0 + sgn * (r + 0.5) * step;
      if (view === 'top') {
        seats.addRRect(Skia.RRectXY(Skia.XYWHRect(x - step * 0.3, z0, step * 0.6, z1 - z0), 18, 18));
        for (let z = z0 + 220; z < z1 - 100; z += 480) heads.addCircle(x, z + (r % 2) * 240, 95);
      } else {
        const rise = r * 420;
        seats.addRect(Skia.XYWHRect(x - step * 0.45, floor - 450 - rise, step * 0.9, 450 + rise));
        heads.addCircle(x, floor - 450 - rise - 520, 110);
      }
    }
    return { seats, heads };
  }, [view, x0, dx, z0, z1, floor, rows]);
  return (
    <Group opacity={0.55}>
      <Path path={p.seats} color="#2a2d34" />
      <Path path={p.heads} color="#5d6573" />
      <Path path={p.seats} style="stroke" strokeWidth={3} color="#0b0c0f" />
    </Group>
  );
}

/* ── the body-worn chain ── */

/** A wireless bodypack (a small rounded box) at `at`, seen in a view. */
export function BodyPack({ u, v, w = 70, h = 96 }: { u: number; v: number; w?: number; h?: number }) {
  return (
    <Group>
      <RoundedRect x={u - w / 2 + 4} y={v - h / 2 + 6} width={w} height={h} r={12} color="#000" opacity={0.4}>
        <BlurMask blur={8} style="normal" />
      </RoundedRect>
      <RoundedRect x={u - w / 2} y={v - h / 2} width={w} height={h} r={12}>
        <LinearGradient start={vec(u - w / 2, v - h / 2)} end={vec(u + w / 2, v + h / 2)} colors={['#6d727d', '#3a3d45', '#16171b']} />
      </RoundedRect>
      <RoundedRect x={u - w / 2} y={v - h / 2} width={w} height={h} r={12} style="stroke" strokeWidth={2.4} color="#060607" />
      <Circle cx={u + w * 0.22} cy={v - h * 0.32} r={5} color="#5bff85" opacity={0.85} />
    </Group>
  );
}

/** The chain drawn in a projection `uv`: the cable through its loop to the
 *  pack, the antenna straight down from it. */
export function BodyChain({ uv, chain, showPack = true }: { uv: (p: Vec3) => { u: number; v: number }; chain: { cable: Vec3[]; loop: Vec3; pack: Vec3; antenna: [Vec3, Vec3] }; showPack?: boolean }) {
  const p = useMemo(() => {
    const c = make();
    const pts = chain.cable.map(uv);
    c.moveTo(pts[0].u, pts[0].v);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      c.quadTo(a.u + (b.u - a.u) * 0.5 + 18, a.v + (b.v - a.v) * 0.5, b.u, b.v);
    }
    const lp = uv(chain.loop);
    const loop = make();
    loop.addCircle(lp.u, lp.v, 26);
    const a0 = uv(chain.antenna[0]);
    const a1 = uv(chain.antenna[1]);
    const ant = make();
    ant.moveTo(a0.u, a0.v);
    ant.lineTo(a1.u, a1.v);
    return { c, loop, ant };
  }, [uv, chain]);
  const pk = uv(chain.pack);
  return (
    <Group>
      <Path path={p.c} style="stroke" strokeWidth={9} strokeCap="round" color="#060607" />
      <Path path={p.c} style="stroke" strokeWidth={5} strokeCap="round" color="#3a3d45" />
      <Path path={p.loop} style="stroke" strokeWidth={6} color="#3a3d45" />
      <Path path={p.ant} style="stroke" strokeWidth={6} strokeCap="round" color="#0b0c0f" />
      <Path path={p.ant} style="stroke" strokeWidth={3} strokeCap="round" color="#8a8f99" />
      {showPack ? <BodyPack u={pk.u} v={pk.v} /> : null}
    </Group>
  );
}

/* ── a keep-out region ── */

function regionPath(shape: Shape3, uv: (p: Vec3) => { u: number; v: number }): SkPath {
  const p = make();
  if (shape.kind === 'capsule') {
    const a = uv(shape.a);
    const b = uv(shape.b);
    const r = shape.r;
    if (Math.hypot(b.u - a.u, b.v - a.v) < 1) p.addCircle(a.u, a.v, r);
    else {
      p.addCircle(a.u, a.v, r);
      p.addCircle(b.u, b.v, r);
      const ang = Math.atan2(b.v - a.v, b.u - a.u) + Math.PI / 2;
      p.moveTo(a.u + Math.cos(ang) * r, a.v + Math.sin(ang) * r);
      p.lineTo(b.u + Math.cos(ang) * r, b.v + Math.sin(ang) * r);
      p.lineTo(b.u - Math.cos(ang) * r, b.v - Math.sin(ang) * r);
      p.lineTo(a.u - Math.cos(ang) * r, a.v - Math.sin(ang) * r);
      p.close();
    }
  } else if (shape.kind === 'box') {
    const corners = [shape.min, shape.max, { x: shape.min.x, y: shape.max.y, z: shape.max.z }, { x: shape.max.x, y: shape.min.y, z: shape.min.z }].map(uv);
    const u0 = Math.min(...corners.map((c) => c.u));
    const u1 = Math.max(...corners.map((c) => c.u));
    const v0 = Math.min(...corners.map((c) => c.v));
    const v1 = Math.max(...corners.map((c) => c.v));
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(u0, v0, u1 - u0, v1 - v0), 30, 30));
  }
  return Skia.Path.MakeFromOp(p, make(), PathOp.Union) ?? p;
}

/** A hatched "never mount here" region, projected by `uv`. */
export function KeepOutRegion({ shape, uv }: { shape: Shape3; uv: (p: Vec3) => { u: number; v: number } }) {
  const p = useMemo(() => {
    const region = regionPath(shape, uv);
    const b = region.getBounds();
    const hatch = make();
    for (let k = b.x - b.height; k < b.x + b.width; k += 36) {
      hatch.moveTo(k, b.y + b.height);
      hatch.lineTo(k + b.height, b.y);
    }
    return { region, hatch };
  }, [shape, uv]);
  return (
    <Group>
      <Path path={p.region} color="#ff6b5e" opacity={0.12} />
      <Group clip={p.region}>
        <Path path={p.hatch} style="stroke" strokeWidth={5} color="#ff6b5e" opacity={0.55} />
      </Group>
      <Path path={p.region} style="stroke" strokeWidth={4} color="#ff6b5e" opacity={0.85}>
        <DashPathEffect intervals={[14, 9]} />
      </Path>
    </Group>
  );
}

/** A headset on a head with its boom to the corner of the mouth, for the
 *  body-worn layout's own drawing (frame V; 'front': u = −z, v = y). The
 *  placement scene draws the boom itself (the engine's clip arm). */
export function HeadsetOnHead({ view }: { view: 'front' | 'side' }) {
  const p = useMemo(() => {
    const band = make();
    const cups = make();
    const boom = make();
    if (view === 'front') {
      band.moveTo(-EAR_HALF - 6, EAR.y - 40);
      band.cubicTo(-EAR_HALF + 10, HEAD_C.y - HEAD_R - 40, EAR_HALF - 10, HEAD_C.y - HEAD_R - 40, EAR_HALF + 6, EAR.y - 40);
      for (const s of [-1, 1]) cups.addRRect(Skia.RRectXY(Skia.XYWHRect(s * (EAR_HALF + 14) - 22, EAR.y - 50, 44, 100), 18, 18));
      boom.moveTo(-EAR_HALF - 14, EAR.y + 20);
      boom.quadTo(-EAR_HALF - 10, 30, -VOICE_DIMS.headsetSide.mm, 0);
    } else {
      cups.addRRect(Skia.RRectXY(Skia.XYWHRect(EAR.x - 40, EAR.y - 52, 80, 104), 34, 38));
      band.moveTo(EAR.x + 4, EAR.y - 50);
      band.cubicTo(EAR.x + 10, EAR.y - 100, HEAD_C.x - 24, HEAD_C.y - HEAD_R - 12, HEAD_C.x - 6, HEAD_C.y - HEAD_R - 14);
      boom.moveTo(EAR.x + 20, EAR.y + 30);
      boom.quadTo(EAR.x + 60, 40, VOICE_DIMS.headsetFwd.mm, 0);
    }
    return { band, cups, boom };
  }, [view]);
  const tip = view === 'front' ? { u: -VOICE_DIMS.headsetSide.mm, v: 0 } : { u: VOICE_DIMS.headsetFwd.mm, v: 0 };
  return (
    <Group>
      <Path path={p.band} style="stroke" strokeWidth={16} strokeCap="round" color="#0a0b0d" />
      <Path path={p.band} style="stroke" strokeWidth={11} strokeCap="round" color="#3a3d45" />
      <Path path={p.cups} color="#2a2d34" />
      <Path path={p.cups} style="stroke" strokeWidth={2.4} color="#050506" />
      <Path path={p.boom} style="stroke" strokeWidth={8} strokeCap="round" color="#0b0c0f" />
      <Path path={p.boom} style="stroke" strokeWidth={5} strokeCap="round" color="#4d515b" />
      <Circle cx={tip.u} cy={tip.v} r={12} color="#26282e" />
      <Circle cx={tip.u} cy={tip.v} r={12} style="stroke" strokeWidth={2} color="#08080a" />
    </Group>
  );
}

/** A small amber ring at a place (a mic's place on the body). */
export function PlaceRing({ u, v, r = 30 }: { u: number; v: number; r?: number }) {
  return (
    <Group>
      <Circle cx={u} cy={v} r={r} color={AMBER} opacity={0.2} />
      <Circle cx={u} cy={v} r={r} style="stroke" strokeWidth={4} color={AMBER} />
    </Group>
  );
}

/** An arrow (a direction: the crowd, the PA, the wind, the field) from `a`
 *  toward `b`, in the view's own units. */
export function DirArrow({ a, b, color = '#8fbcff', w = 10 }: { a: { u: number; v: number }; b: { u: number; v: number }; color?: string; w?: number }) {
  const p = useMemo(() => {
    const q = make();
    q.moveTo(a.u, a.v);
    q.lineTo(b.u, b.v);
    const ang = Math.atan2(b.v - a.v, b.u - a.u);
    const hl = w * 5;
    const head = make();
    head.moveTo(b.u + Math.cos(ang) * hl * 0.4, b.v + Math.sin(ang) * hl * 0.4);
    head.lineTo(b.u + Math.cos(ang + 2.5) * hl, b.v + Math.sin(ang + 2.5) * hl);
    head.lineTo(b.u + Math.cos(ang - 2.5) * hl, b.v + Math.sin(ang - 2.5) * hl);
    head.close();
    return { q, head };
  }, [a.u, a.v, b.u, b.v, w]);
  return (
    <Group>
      <Path path={p.q} style="stroke" strokeWidth={w} strokeCap="round" color={color} opacity={0.85}>
        <DashPathEffect intervals={[w * 3, w * 2]} />
      </Path>
      <Path path={p.head} color={color} opacity={0.9} />
    </Group>
  );
}

export { frontUV };
