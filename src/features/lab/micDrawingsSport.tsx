/**
 * SPEECH-IN-SPORT MICROPHONES for the Miking Labs — Lab 7b group 1 (B09
 * commentators, B10 sideline interviews, B11 athletes, coaches and
 * officials). Same conventions as micDrawings.tsx (which switches to these
 * through MikingMicArt): LOCAL coordinates, the mic's FRONT at the origin,
 * its body toward +y; `r` the radius, `len` the length front to tail.
 *
 * Illustrations, never glyphs (house rule): layered gradients lit from the
 * upper left, a rim light on the lit edge, a contour, a soft lift shadow.
 * Generic — no maker's likeness, no badge, no logo on the flag.
 *
 *   HeadsetBoomCapsule  a close-talk headset boom's end: the dynamic capsule
 *                       in a charcoal foam ball, a short chrome collar, the
 *                       boom's tip leaving it (the boom itself is the
 *                       engine's drawn arm, from the ear pivot).
 *   LipRibbonMic        a lip-guarded ribbon commentator's mic: a curved
 *                       GUARD BAR at the front (it rests on the upper lip),
 *                       the ribbon's slotted head behind it, a long handle
 *                       with its switch, the cable boot at the tail.
 *   MicFlag             the cube a handheld interview mic carries under its
 *                       grille (the camera sees it): plain faces, no logo —
 *                       drawn over the vocal handheld (micDrawings
 *                       'flagHandheld').
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';

type SkPathT = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const LIT = (r: number) => ({ start: vec(r, 0), end: vec(-r, 0) });

/* ── the headset boom's capsule ── */

function buildHeadsetCapsule(r: number, len: number) {
  const ball: SkPathT = make();
  ball.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, Math.min(len * 0.78, r * 2.2)), r * 0.95, r * 0.95));
  const bl = Math.min(len * 0.78, r * 2.2);
  const pores: SkPathT = make();
  const step = Math.max(0.9, r * 0.22);
  let row = 0;
  for (let y = step * 0.7; y < bl - step * 0.4; y += step * 0.86, row++) {
    for (let x = -r + step * (row % 2 ? 0.5 : 1); x < r - step * 0.4; x += step) {
      const q = Math.max(0.2, r * 0.05);
      pores.addOval(Skia.XYWHRect(x - q, y - q, q * 2, q * 2));
    }
  }
  const collar: SkPathT = make();
  collar.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.46, bl - r * 0.1, r * 0.92, Math.max(r * 0.4, len - bl)), r * 0.16, r * 0.16));
  const shadow: SkPathT = make();
  shadow.addPath(ball);
  shadow.addPath(collar);
  return { ball, pores, collar, shadow, bl };
}

/** A close-talk headset boom's capsule in its foam ball. */
export function HeadsetBoomCapsule({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildHeadsetCapsule(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.3, r * 0.06);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.12 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.25} style="normal" />
        </Path>
      </Group>
      <Path path={p.collar}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#eef1f6', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.ball}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5b5f66', '#383b41', '#1f2125', '#111214']} positions={[0, 0.3, 0.68, 1]} />
      </Path>
      <Group clip={p.ball}>
        <Path path={p.pores} color="#0a0a0c" opacity={0.6} />
        <Circle cx={r * 0.35} cy={p.bl * 0.3} r={r * 0.6} color="#ffffff" opacity={0.12}>
          <BlurMask blur={r * 0.4} style="normal" />
        </Circle>
      </Group>
      <Path path={p.ball} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.ball} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.28} />
    </Group>
  );
}

/* ── the lip ribbon ── */

function buildLipRibbon(r: number, len: number) {
  // The guard: a curved bar across the front (it rests on the upper lip),
  // on two short struts back to the head. Its depth is a drawing default.
  const gd = Math.min(len * 0.28, r * 2.8);
  const guard: SkPathT = make();
  guard.moveTo(-r * 1.05, gd * 0.18);
  guard.cubicTo(-r * 0.6, -gd * 0.06, r * 0.6, -gd * 0.06, r * 1.05, gd * 0.18);
  const struts: SkPathT = make();
  for (const s of [-1, 1]) {
    struts.moveTo(s * r * 1.0, gd * 0.16);
    struts.lineTo(s * r * 0.9, gd);
  }
  // The head: a squared slotted housing round the ribbon.
  const hh = Math.min(len * 0.3, r * 3);
  const head: SkPathT = make();
  head.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, gd, r * 2, hh), r * 0.3, r * 0.3));
  const slots: SkPathT = make();
  const n = 7;
  for (let k = 0; k < n; k++) {
    const x = -r * 0.72 + (k * (r * 1.44)) / (n - 1);
    slots.moveTo(x, gd + hh * 0.14);
    slots.lineTo(x, gd + hh * 0.86);
  }
  const ribbon: SkPathT = make();
  ribbon.addRect(Skia.XYWHRect(-r * 0.08, gd + hh * 0.1, r * 0.16, hh * 0.8));
  // The handle: tapering to the cable boot.
  const y0 = gd + hh;
  const handle: SkPathT = make();
  handle.moveTo(-r * 0.62, y0);
  handle.lineTo(r * 0.62, y0);
  handle.lineTo(r * 0.5, len - r * 0.5);
  handle.quadTo(0, len + r * 0.1, -r * 0.5, len - r * 0.5);
  handle.close();
  const sw: SkPathT = make();
  sw.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.2, y0 + (len - y0) * 0.22, r * 0.4, (len - y0) * 0.14), r * 0.1, r * 0.1));
  const shadow: SkPathT = make();
  shadow.addPath(head);
  shadow.addPath(handle);
  return { guard, struts, head, slots, ribbon, handle, sw, shadow, gd };
}

/** A lip-guarded ribbon commentator's mic, the guard bar at the front. */
export function LipRibbonMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildLipRibbon(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.04);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.1 }, { translateY: r * 0.1 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.2} style="normal" />
        </Path>
      </Group>
      <Path path={p.handle}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#6d727d', '#3d414a', '#22242a', '#101114']} positions={[0, 0.3, 0.66, 1]} />
      </Path>
      <Path path={p.sw}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c9ced8', '#6b707b', '#2a2c32']} />
      </Path>
      <Path path={p.head}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9ea3ad', '#5e626c', '#2f3238', '#17181c']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Group clip={p.head}>
        <Path path={p.ribbon} color="#b9912f" opacity={0.45} />
        <Path path={p.slots} style="stroke" strokeWidth={Math.max(0.6, r * 0.09)} strokeCap="round" color="#0b0c0f" opacity={0.85} />
      </Group>
      <Path path={p.struts} style="stroke" strokeWidth={Math.max(0.8, r * 0.12)} strokeCap="round" color="#2a2c32" />
      <Path path={p.guard} style="stroke" strokeWidth={Math.max(1.4, r * 0.2)} strokeCap="round" color="#0b0c0f" />
      <Path path={p.guard} style="stroke" strokeWidth={Math.max(0.9, r * 0.12)} strokeCap="round" color="#c9ced8" />
      <Path path={p.head} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.handle} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.head} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.25} />
    </Group>
  );
}

/* ── the mic flag ── */

/** The flag cube under a handheld's grille (`r` the grille's radius, the
 *  front at the origin): seen square-on, its top face lit, plain faces. */
export function MicFlag({ r }: { r: number }) {
  const p = useMemo(() => {
    const s = r * 2.5;
    const y0 = r * 2.25;
    const face = make();
    face.addRRect(Skia.RRectXY(Skia.XYWHRect(-s / 2, y0, s, s), r * 0.16, r * 0.16));
    const top = make();
    top.moveTo(-s / 2 + r * 0.1, y0);
    top.lineTo(-s / 2 + r * 0.42, y0 - r * 0.34);
    top.lineTo(s / 2 + r * 0.32, y0 - r * 0.34);
    top.lineTo(s / 2, y0 + r * 0.05);
    top.close();
    const panel = make();
    panel.addRRect(Skia.RRectXY(Skia.XYWHRect(-s * 0.36, y0 + s * 0.14, s * 0.72, s * 0.72), r * 0.1, r * 0.1));
    return { face, top, panel, s, y0 };
  }, [r]);
  const hair = Math.max(0.35, r * 0.05);
  return (
    <Group>
      <Path path={p.top}>
        <LinearGradient start={vec(0, p.y0 - r * 0.4)} end={vec(0, p.y0)} colors={['#3a63a8', '#24427a']} />
      </Path>
      <Path path={p.face}>
        <LinearGradient start={vec(-p.s / 2, p.y0)} end={vec(p.s / 2, p.y0 + p.s)} colors={['#2f5596', '#1e3a6e', '#132748']} />
      </Path>
      <Path path={p.panel} color="#f2f4f8" opacity={0.18} />
      <Path path={p.face} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.top} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.8} />
    </Group>
  );
}
