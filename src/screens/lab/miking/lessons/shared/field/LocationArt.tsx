/**
 * THE LOCATION KIT — the look (charter §2 layer 3). Lab 6 group 6 (F09);
 * shared with Lab 7's boom and body-mic lessons. Real objects, lit from the
 * upper left, in the engine's two views (side: u = x, v = y; top: u = x,
 * v = z — frame V, mm). Static: nothing moves by itself (D8).
 *
 *   CameraRig      a video camera on a fluid head and tripod — the lens
 *                  toward −x, the body, the viewfinder, the handle; legs to
 *                  the floor.
 *   FrameLines     the camera's frame as dashed lines from the lens (its top
 *                  and bottom edges from the side, its left and right edges
 *                  from above) over a faint shot area, and the HEADROOM band
 *                  above the talker's head where a boom shows in the picture.
 *   BoomOperator   a person standing outside the frame, both hands up on the
 *                  pole's end (the shared figure, FigureHead).
 *   Counter        a kitchen counter (worktop, cabinet doors), a set of keys
 *                  on it and a ceramic jar that hides a planted mic.
 *   PowerLineArt   the overhead line: from above, a timber pole and its
 *                  conductors; from the side, the 3 m (10 ft) keep-out's edge
 *                  (the conductors themselves are above the drawing).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Paint, Path, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId, Vec3 } from '../../../engine/model/types.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { pt, type PlayerPose } from '../players/playerPose.ts';
import { frameBottomY, frameHalfWidthAt, frameTopY, POWER_LINE_CLEARANCE, type CameraFrame, type OverheadLine } from './location.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const METAL = ['#8a8f99', '#4a4e57', '#24262c', '#121317'];

/* ── CAMERA ON A TRIPOD ── */

export type CameraSpec = { box: { min: Vec3; max: Vec3 }; lens: Vec3; floor: number; spread: number };

function buildCamera(view: ViewId, c: CameraSpec) {
  const { min, max } = c.box;
  const body = make();
  const lens = make();
  const glass = make();
  const finder = make();
  const handle = make();
  const legs = make();
  const lower = make();
  const clamps = make();
  const spreader = make();
  const pan = make();
  const head = make();
  const vMin = view === 'side' ? min.y : min.z;
  const vMax = view === 'side' ? max.y : max.z;
  const lensEnd = min.x;
  const bodyX0 = min.x + 90;
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(bodyX0, vMin + 20, max.x - bodyX0, vMax - vMin - 20), 14, 14));
  const lr = Math.min(48, (vMax - vMin) * 0.34);
  const lc = view === 'side' ? c.lens.y : c.lens.z;
  lens.addRRect(Skia.RRectXY(Skia.XYWHRect(lensEnd, lc - lr, bodyX0 - lensEnd + 6, lr * 2), 8, 8));
  glass.addOval(Skia.XYWHRect(lensEnd - 4, lc - lr * 0.86, 10, lr * 1.72));
  if (view === 'side') {
    finder.addRRect(Skia.RRectXY(Skia.XYWHRect(max.x - 70, vMin - 4, 90, 44), 8, 8));
    handle.moveTo(bodyX0 + 30, vMin + 20);
    handle.cubicTo(bodyX0 + 40, vMin - 34, max.x - 60, vMin - 34, max.x - 50, vMin + 20);
    // The fluid head (a 75 mm bowl) with its pan bar back toward the
    // operator, and a video tripod's legs to the floor (art pass 2026-10-10 —
    // they were three bare lines): twin-tube upper sections, single lower
    // sections, a mid-level spreader, rubber feet. Drawing defaults of the class.
    const hx = (bodyX0 + max.x) / 2;
    head.addRRect(Skia.RRectXY(Skia.XYWHRect(hx - 60, vMax, 120, 46), 10, 10));
    head.addRRect(Skia.RRectXY(Skia.XYWHRect(hx - 52, vMax + 46, 104, 34), 14, 14)); // the bowl
    pan.moveTo(hx + 50, vMax + 22);
    pan.lineTo(hx + 300, vMax + 150);
    const top = vMax + 80;
    const mid = top + (c.floor - top) * 0.55;
    for (const dx of [-c.spread * 0.55, c.spread * 0.12, c.spread * 0.5]) {
      const at = (t: number) => ({ x: hx + dx * t, y: top + (c.floor - top) * t });
      const L = Math.hypot(dx, c.floor - top) || 1;
      const nx = (c.floor - top) / L;
      const ny = -dx / L;
      for (const sd of [-1, 1]) {
        legs.moveTo(hx + nx * 16 * sd, top + ny * 16 * sd);
        const q = at(0.55);
        legs.lineTo(q.x + nx * 16 * sd, q.y + ny * 16 * sd);
      }
      const q0 = at(0.55);
      const q1 = at(0.97);
      lower.moveTo(q0.x, q0.y);
      lower.lineTo(q1.x, q1.y);
      clamps.addRRect(Skia.RRectXY(Skia.XYWHRect(q0.x - 26, q0.y - 18, 52, 36), 6, 6));
      clamps.addRRect(Skia.RRectXY(Skia.XYWHRect(q1.x - 18, q1.y - 6, 36, c.floor - q1.y + 6), 8, 8));
      spreader.moveTo(hx, mid - 40);
      const sp = at(0.45);
      spreader.lineTo(sp.x, sp.y);
    }
  } else {
    finder.addRRect(Skia.RRectXY(Skia.XYWHRect(max.x - 70, vMax - 6, 60, 40), 8, 8));
    // The legs spread from the head under the camera's body (clash sweep
    // 2026-10-10: they were centred on z = 0, so a camera set to one side —
    // B03's — stood off its own tripod).
    const hx = (bodyX0 + max.x) / 2;
    const hz = (vMin + vMax) / 2;
    for (let i = 0; i < 3; i++) {
      const a = Math.PI + (i * 2 * Math.PI) / 3;
      legs.moveTo(hx, hz);
      legs.lineTo(hx + Math.cos(a) * c.spread, hz + Math.sin(a) * c.spread);
    }
  }
  return { body, lens, glass, finder, handle, legs, lower, clamps, spreader, pan, head };
}

export function CameraRig({ view, spec }: { view: ViewId; spec: CameraSpec }) {
  const p = useMemo(() => buildCamera(view, spec), [view, spec]);
  const b = p.body.getBounds();
  return (
    <Group>
      <Path path={p.spreader} style="stroke" strokeWidth={12} strokeCap="round" color="#2a2c32" />
      <Path path={p.lower} style="stroke" strokeWidth={22} strokeCap="round" color="#0b0c0f" />
      <Path path={p.lower} style="stroke" strokeWidth={14} strokeCap="round" color="#3d4049" />
      <Path path={p.legs} style="stroke" strokeWidth={view === 'side' ? 20 : 26} strokeCap="round" color="#0b0c0f" />
      <Path path={p.legs} style="stroke" strokeWidth={view === 'side' ? 13 : 18} strokeCap="round" color="#4a4e57" />
      <Group transform={[{ translateX: -2 }, { translateY: -2 }]}>
        <Path path={p.legs} style="stroke" strokeWidth={4} strokeCap="round" color="#c9ced8" opacity={0.35} />
      </Group>
      <Path path={p.clamps} color="#16171b" />
      <Path path={p.pan} style="stroke" strokeWidth={24} strokeCap="round" color="#0b0c0f" />
      <Path path={p.pan} style="stroke" strokeWidth={16} strokeCap="round" color="#3d4049" />
      <Path path={p.head}>
        <LinearGradient start={vec(b.x, b.y + b.height)} end={vec(b.x, b.y + b.height + 50)} colors={['#4a4e57', '#15161a']} />
      </Path>
      <Group transform={[{ translateX: -8 }, { translateY: 10 }]}>
        <Path path={p.body} color="#000" opacity={0.45}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      <Path path={p.handle} style="stroke" strokeWidth={16} strokeCap="round" color="#121317" />
      <Path path={p.body}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width * 0.4, b.y + b.height)} colors={METAL} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.finder} color="#1b1c20" />
      <Path path={p.lens}>
        <LinearGradient start={vec(0, b.y)} end={vec(0, b.y + b.height)} colors={['#5b5f69', '#1d1e23', '#0a0b0d']} />
      </Path>
      <Path path={p.glass}>
        <LinearGradient start={vec(0, b.y)} end={vec(0, b.y + b.height)} colors={['#6fa8ff', '#1d3a66', '#0b1426']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={2.4} color="#08080a" />
      <Group transform={[{ translateX: -1.6 }, { translateY: -2 }]}>
        <Path path={p.body} style="stroke" strokeWidth={1.6} color="#d4d8e0" opacity={0.35} />
      </Group>
    </Group>
  );
}

/* ── THE FRAME ── */

/** The frame's lines (side: top and bottom edges; top: left and right) from
 *  the lens to `farX`, the shot area, and the headroom band above the head. */
export function FrameLines({ view, frame, farX, headTopY, show = 'all' }: { view: ViewId; frame: CameraFrame; farX: number; headTopY: number; show?: 'all' | 'lines' }) {
  const p = useMemo(() => {
    const L = frame.lens;
    const edges = make();
    const area = make();
    const band = make();
    if (view === 'side') {
      edges.moveTo(L.x, L.y);
      edges.lineTo(farX, frameTopY(frame, farX));
      edges.moveTo(L.x, L.y);
      edges.lineTo(farX, frameBottomY(frame, farX));
      area.moveTo(L.x, L.y);
      area.lineTo(farX, frameTopY(frame, farX));
      area.lineTo(farX, frameBottomY(frame, farX));
      area.close();
      // The headroom: between the ray to the head's top and the frame's top edge.
      const ht = (x: number) => L.y + (headTopY - L.y) * ((L.x - x) / L.x);
      band.moveTo(L.x - 400, frameTopY(frame, L.x - 400));
      band.lineTo(farX, frameTopY(frame, farX));
      band.lineTo(farX, ht(farX));
      band.lineTo(L.x - 400, ht(L.x - 400));
      band.close();
    } else {
      edges.moveTo(L.x, L.z);
      edges.lineTo(farX, L.z - frameHalfWidthAt(frame, farX));
      edges.moveTo(L.x, L.z);
      edges.lineTo(farX, L.z + frameHalfWidthAt(frame, farX));
      area.moveTo(L.x, L.z);
      area.lineTo(farX, L.z - frameHalfWidthAt(frame, farX));
      area.lineTo(farX, L.z + frameHalfWidthAt(frame, farX));
      area.close();
    }
    return { edges, area, band };
  }, [view, frame, farX, headTopY]);
  return (
    <Group>
      {show === 'all' ? <Path path={p.area} color="#e8eaee" opacity={0.035} /> : null}
      {show === 'all' && view === 'side' ? <Path path={p.band} color={RED} opacity={0.09} /> : null}
      <Path path={p.edges} style="stroke" strokeWidth={5} color="#e8eaee" opacity={0.55}>
        <DashPathEffect intervals={[26, 16]} />
      </Path>
    </Group>
  );
}

/* ── THE BOOM OPERATOR ── */

/** The operator in profile (facing −x, toward the talker) and from above, both
 *  hands up on the pole's end at `grip`. A drawing default (the shared figure). */
export function operatorPoses(feet: Vec3, grip: Vec3): { side: PlayerPose; top: PlayerPose } {
  const floor = feet.y;
  const hx = feet.x + 10;
  const headC = pt(hx, floor - 1750 + 114);
  const neck = pt(hx + 18, headC.v + 172);
  // The arms reach UP to the pole (figure polish 2026-10-10: the near elbow
  // sat under the chin, so the forearm crossed the face): a two-bone arm
  // (upper 300, forearm 265 mm) from each shoulder to its wrist, the elbow
  // raised BESIDE and behind the head — the way an operator holds a boom
  // overhead — so the face stays clear.
  const upElbow = (s: ReturnType<typeof pt>, w: ReturnType<typeof pt>): ReturnType<typeof pt> => {
    const A = 300;
    const B = 265;
    const dx = w.u - s.u;
    const dy = w.v - s.v;
    const d = Math.min(A + B - 1, Math.max(Math.abs(A - B) + 1, Math.hypot(dx, dy)));
    const ux = dx / (Math.hypot(dx, dy) || 1);
    const uy = dy / (Math.hypot(dx, dy) || 1);
    const x = (A * A - B * B + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, A * A - x * x));
    // The perpendicular that points up and back (away from the face, +u here).
    let px = -uy;
    let py = ux;
    if (px < 0) {
      px = -px;
      py = -py;
    }
    return pt(s.u + ux * x + px * h, s.v + uy * x + py * h);
  };
  const shR = pt(neck.u + 4, neck.v + 58);
  const shL = pt(neck.u + 18, neck.v + 48);
  const wrR = pt(grip.x + 20, grip.y + 34);
  const wrL = pt(grip.x + 150, grip.y + 120);
  const side: PlayerPose = {
    view: 'side',
    posture: 'standing',
    facing: -1,
    head: { c: headC, r: 114 },
    neck,
    shoulderR: shR,
    shoulderL: shL,
    elbowR: upElbow(shR, wrR),
    elbowL: upElbow(shL, wrL),
    handR: { wrist: wrR, dir: -Math.PI / 2 - 0.9, kind: 'grip' },
    handL: { wrist: wrL, dir: -Math.PI / 2 - 0.9, kind: 'grip' },
    hipR: pt(neck.u + 14, neck.v + 530),
    hipL: pt(neck.u + 24, neck.v + 524),
    kneeR: pt(neck.u - 4, neck.v + 980),
    kneeL: pt(neck.u + 30, neck.v + 974),
    footR: pt(neck.u - 22, floor),
    footL: pt(neck.u + 20, floor),
    floor,
  };
  // From above: the chest toward the talker (the origin); the arms forward to the grip.
  const fx = -feet.x;
  const fz = -feet.z;
  const facing = Math.atan2(fz, fx);
  const n = pt(feet.x, feet.z);
  const a = facing - Math.PI / 2;
  // local (right, fwd) → world: the pose is authored chest toward +v, turned by `facing`.
  const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
  const toLocal = (wx: number, wz: number) => {
    const dx = wx - n.u;
    const dz = wz - n.v;
    const x = dx * Math.cos(-a) - dz * Math.sin(-a);
    const y = dx * Math.sin(-a) + dz * Math.cos(-a);
    return { right: -x, fwd: y };
  };
  const g = toLocal(grip.x, grip.z);
  const top: PlayerPose = {
    view: 'above',
    posture: 'standing',
    facing,
    head: { c: L(0, 18), r: 114 },
    neck: n,
    shoulderR: L(176, -6),
    shoulderL: L(-176, -6),
    elbowR: L(g.right * 0.4 + 120, g.fwd * 0.45),
    elbowL: L(g.right * 0.4 - 100, g.fwd * 0.4),
    handR: { wrist: L(g.right + 10, g.fwd - 30), dir: Math.PI / 2, kind: 'grip' },
    handL: { wrist: L(g.right - 40, g.fwd - 160), dir: Math.PI / 2, kind: 'grip' },
    hipR: L(106, -6),
    hipL: L(-106, -6),
    kneeR: L(110, 6),
    kneeL: L(-110, 6),
    footR: L(104, 70),
    footL: L(-104, 70),
    floor: null,
  };
  return { side, top };
}

/** The operator, and the pole's rear end behind the front hand (`stub`: the
 *  grip and the pole's far end) — the part of the pole the hands hold; the
 *  mic's side of it is drawn by the scene, from the mic to the grip. */
export function BoomOperator({ view, poses, dim = 0.82, stub }: { view: ViewId; poses: { side: PlayerPose; top: PlayerPose }; dim?: number; stub?: { a: Vec3; b: Vec3 } }) {
  const pose = view === 'side' ? poses.side : poses.top;
  const pole = useMemo(() => {
    const p = make();
    if (stub) {
      p.moveTo(stub.a.x, view === 'side' ? stub.a.y : stub.a.z);
      p.lineTo(stub.b.x, view === 'side' ? stub.b.y : stub.b.z);
    }
    return p;
  }, [stub, view]);
  // The whole operator is faded as ONE layer (clash sweep 2026-10-10: each
  // part faded on its own let the far arm and the torso show through the
  // near arm and the head).
  return (
    <Group layer={<Paint opacity={dim} />}>
      <PlayerBehind pose={pose} />
      {stub ? (
        <>
          <Path path={pole} style="stroke" strokeWidth={36} strokeCap="round" color="#0b0c0f" />
          <Path path={pole} style="stroke" strokeWidth={32} strokeCap="round" color="#3a3d45" />
          <Group transform={[{ translateX: -1.5 }, { translateY: -2 }]}>
            <Path path={pole} style="stroke" strokeWidth={7} strokeCap="round" color="#d4d8e0" opacity={0.45} />
          </Group>
        </>
      ) : null}
      <PlayerInFront pose={pose} />
    </Group>
  );
}

/* ── THE COUNTER, THE KEYS, THE JAR ── */

export function Counter({ view, box, keys, jar }: { view: ViewId; box: { min: Vec3; max: Vec3 }; keys: Vec3; jar: Vec3 }) {
  const p = useMemo(() => {
    const top = make();
    const cab = make();
    const doors = make();
    const keyP = make();
    const ring = make();
    const jarP = make();
    if (view === 'side') {
      top.addRRect(Skia.RRectXY(Skia.XYWHRect(box.min.x - 20, box.min.y, box.max.x - box.min.x + 40, 40), 6, 6));
      cab.addRect(Skia.XYWHRect(box.min.x, box.min.y + 40, box.max.x - box.min.x, box.max.y - box.min.y - 40 - 80));
      cab.addRect(Skia.XYWHRect(box.min.x + 30, box.max.y - 80, box.max.x - box.min.x - 60, 80));
      const mid = (box.min.x + box.max.x) / 2;
      doors.moveTo(mid, box.min.y + 60);
      doors.lineTo(mid, box.max.y - 100);
      doors.moveTo(mid - 40, box.min.y + 300);
      doors.lineTo(mid - 40, box.min.y + 380);
      doors.moveTo(mid + 40, box.min.y + 300);
      doors.lineTo(mid + 40, box.min.y + 380);
      // The keys lying on the worktop: the ring and two keys.
      ring.addOval(Skia.XYWHRect(keys.x - 26, keys.y - 4, 34, 8));
      keyP.addRRect(Skia.RRectXY(Skia.XYWHRect(keys.x + 4, keys.y - 5, 56, 6), 2, 2));
      keyP.addRRect(Skia.RRectXY(Skia.XYWHRect(keys.x - 70, keys.y - 4, 48, 5), 2, 2));
      // The jar beside the planted mic (it hides the mic from the camera).
      jarP.moveTo(jar.x - 40, jar.y);
      jarP.cubicTo(jar.x - 52, jar.y - 60, jar.x - 46, jar.y - 120, jar.x - 30, jar.y - 132);
      jarP.lineTo(jar.x + 30, jar.y - 132);
      jarP.cubicTo(jar.x + 46, jar.y - 120, jar.x + 52, jar.y - 60, jar.x + 40, jar.y);
      jarP.close();
    } else {
      top.addRRect(Skia.RRectXY(Skia.XYWHRect(box.min.x - 20, box.min.z, box.max.x - box.min.x + 40, box.max.z - box.min.z), 10, 10));
      ring.addCircle(keys.x - 10, keys.z, 17);
      keyP.addRRect(Skia.RRectXY(Skia.XYWHRect(keys.x + 4, keys.z - 8, 58, 14), 4, 4));
      keyP.addRRect(Skia.RRectXY(Skia.XYWHRect(keys.x - 30, keys.z + 12, 14, 52), 4, 4));
      jarP.addCircle(jar.x, jar.z, 46);
    }
    return { top, cab, doors, keyP, ring, jarP };
  }, [view, box, keys, jar]);
  const b = p.top.getBounds();
  return (
    <Group>
      {view === 'side' ? (
        <>
          <Path path={p.cab}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + 900)} colors={['#4a3a2c', '#33281f', '#1e1712']} />
          </Path>
          <Path path={p.doors} style="stroke" strokeWidth={3} color="#140f0b" opacity={0.85} />
          <Path path={p.cab} style="stroke" strokeWidth={2.4} color="#0d0a07" />
        </>
      ) : null}
      <Path path={p.top}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#d9d4cb', '#a8a197', '#6f6a62']} />
      </Path>
      <Path path={p.top} style="stroke" strokeWidth={2.4} color="#2a2724" />
      <Group transform={[{ translateX: -1.5 }, { translateY: -1.5 }]}>
        <Path path={p.top} style="stroke" strokeWidth={1.4} color="#ffffff" opacity={0.3} />
      </Group>
      <Path path={p.jarP}>
        <LinearGradient start={vec(b.x + b.width * 0.7, b.y - 140)} end={vec(b.x + b.width, b.y)} colors={['#9fb7c9', '#5c7488', '#2e3c48']} />
      </Path>
      <Path path={p.jarP} style="stroke" strokeWidth={2} color="#15191d" />
      <Path path={p.ring} style="stroke" strokeWidth={4} color="#c9a24a" />
      <Path path={p.keyP}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x, b.y + 20)} colors={['#f1e2a8', '#c9a24a', '#7a5f22']} />
      </Path>
      <Path path={p.keyP} style="stroke" strokeWidth={1.4} color="#3a2c10" />
    </Group>
  );
}

/* ── THE OVERHEAD POWER LINE ── */

export function PowerLineArt({ view, line, box }: { view: ViewId; line: OverheadLine; box: { u0: number; u1: number; v0: number; v1: number } }) {
  const p = useMemo(() => {
    const keep = make();
    const wires = make();
    const pole = make();
    const R = POWER_LINE_CLEARANCE.mm;
    if (view === 'side') {
      // The conductors run across the view (along z): seen end-on, above the
      // drawing. Their 3 m keep-out's edge is the circle round them.
      keep.addCircle(line.a.x, line.a.y, R);
    } else {
      for (const dx of [-260, 0, 260]) {
        wires.moveTo(line.a.x + dx, Math.max(box.v0 - 200, line.a.z));
        wires.lineTo(line.a.x + dx, Math.min(box.v1 + 200, line.b.z));
      }
      // A timber pole and its crossarm at the near end of the drawing.
      const pz = box.v0 + 160;
      pole.addCircle(line.a.x, pz, 70);
      pole.addRRect(Skia.RRectXY(Skia.XYWHRect(line.a.x - 380, pz - 22, 760, 44), 8, 8));
    }
    return { keep, wires, pole };
  }, [view, line, box]);
  return (
    <Group>
      {view === 'side' ? (
        <>
          <Path path={p.keep} color={RED} opacity={0.08} />
          <Path path={p.keep} style="stroke" strokeWidth={7} color={RED} opacity={0.85}>
            <DashPathEffect intervals={[30, 18]} />
          </Path>
        </>
      ) : (
        <>
          <Path path={p.wires} style="stroke" strokeWidth={9} color="#0b0c0f" />
          <Path path={p.wires} style="stroke" strokeWidth={5} color="#7a7f88" />
          <Path path={p.pole}>
            <LinearGradient start={vec(line.a.x - 380, box.v0)} end={vec(line.a.x + 380, box.v0 + 320)} colors={['#8a6a48', '#5c4430', '#33261a']} />
          </Path>
          <Path path={p.pole} style="stroke" strokeWidth={2.4} color="#1a120b" />
        </>
      )}
    </Group>
  );
}

/** A small amber mark (the practical action's place, a start point). */
export function SpotMark({ u, v, r = 22 }: { u: number; v: number; r?: number }) {
  return (
    <Group>
      <Circle cx={u} cy={v} r={r} color={AMBER} opacity={0.18} />
      <Circle cx={u} cy={v} r={r} style="stroke" strokeWidth={3} color={AMBER} opacity={0.9} />
    </Group>
  );
}
