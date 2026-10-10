/**
 * micArt — recognizable microphone illustrations for the Microphone Selection
 * Lab (visual standards 2026-07-29: real objects get real drawings — layered
 * shapes, gradients for form, upper-left light, rim highlights; never a bare
 * rect/circle stand-in). All mics are FICTIONAL designs — no brand likenesses.
 *
 * Every drawing lives in a normalized 100×150 space and is scaled to the
 * requested size, so one set of coordinates serves cards, chips and the
 * challenge list. Static geometry only — no animation. (Art pass 2026-10-10:
 * every kind is drawn to a real mic of its class, its proportions noted.)
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// expo-image (perf hunt 2026-10-03): memory + disk cache and off-thread decode,
// so a photo seen once paints at once on every later page and lightbox.
import { Image } from 'expo-image';
import { useLightboxSide } from '../labPhoto';
import { Modal } from '../../../components/DimModal';
import { Canvas, Circle, Group, Line, LinearGradient, Oval, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { CondenserMic as SharedLdcMic, HandheldMic } from '../../../features/lab/micDrawings';
import type { MicKind } from './micSelectData';
import { allMicImageUrls, micImageUrl } from './micImages';

const BODY_LO = '#15161b';
const RIM = 'rgba(255,255,255,0.35)';

// The two mic types the owner named (2026-08-28) draw from the SHARED canonical
// art in features/lab/micDrawings.tsx, so the catalogue entry and the Mic
// Principles scenes are the same illustration. Geometry is placed to match the
// silhouettes these two used to have inside the 100×150 design space.
function DynamicMic() {
  return <HandheldMic x={50} y={30} angleDeg={0} grilleR={26} bodyLen={93} />;
}

function LdcMic() {
  return (
    <>
      {/* shock-ring hint, kept: it reads as a studio mount in the catalogue. */}
      <Oval x={18} y={126} width={64} height={16} color={BODY_LO} />
      <SharedLdcMic x={50} y={46} headR={24} bodyLen={62} />
    </>
  );
}

/*
 * The other ten kinds (art pass 2026-10-10): each drawn to a real mic of its
 * CLASS, its real proportions written above it (mm), scaled into the 100 × 150
 * design space (`mm` = design units per mm). Capsule end UP, cable end down.
 */

/** A vertical body of revolution from (y, radius) stations: a side silhouette. */
function lathe(cx: number, stations: readonly (readonly [number, number])[]) {
  const p = Skia.Path.Make();
  stations.forEach(([y, r], i) => (i ? p.lineTo(cx + r, y) : p.moveTo(cx + r, y)));
  for (let i = stations.length - 1; i >= 0; i--) p.lineTo(cx - stations[i][1], stations[i][0]);
  p.close();
  return p;
}
/** Horizontal metal sheen across a vertical body (light from the upper left). */
function Sheen({ x0, x1, dark = false }: { x0: number; x1: number; dark?: boolean }) {
  return <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={dark ? ['#4a4e57', '#2a2c32', '#141519', '#0b0b0d'] : ['#9aa0ab', '#e6e9ee', '#8a909b', '#3a3d45']} positions={[0, 0.3, 0.62, 1]} />;
}
/** A fine wire-mesh cross-hatch clipped to a path. */
function MeshOver({ clip, x0, y0, x1, y1, step = 2.4, color = '#1b1c20', opacity = 0.5 }: { clip: ReturnType<typeof Skia.Path.Make>; x0: number; y0: number; x1: number; y1: number; step?: number; color?: string; opacity?: number }) {
  const m = Skia.Path.Make();
  for (let x = x0 - (y1 - y0); x < x1; x += step) {
    m.moveTo(x, y1);
    m.lineTo(x + (y1 - y0), y0);
    m.moveTo(x, y0);
    m.lineTo(x + (y1 - y0), y1);
  }
  return (
    <Group clip={clip}>
      <Path path={m} style="stroke" strokeWidth={0.5} color={color} opacity={opacity} />
    </Group>
  );
}
/** The XLR end: a slightly narrower ring, the connector's dark socket insert. */
function XlrTail({ cx, y, r }: { cx: number; y: number; r: number }) {
  return (
    <>
      <RoundedRect x={cx - r} y={y} width={2 * r} height={r * 0.9} r={1.2}>
        <Sheen x0={cx - r} x1={cx + r} dark />
      </RoundedRect>
      <Oval x={cx - r * 0.8} y={y + r * 0.62} width={r * 1.6} height={r * 0.5} color="#050506" />
    </>
  );
}

// END-ADDRESS studio condenser (medium diaphragm): a Ø 42 mesh head, 46 long
// with a domed top, over a Ø 34 × 120 nickel body, a ring at the joint, the
// XLR end; 170 overall. mm = 0.8.
function CondenserMic() {
  const k = 0.8;
  const cx = 50;
  const top = 8;
  const Rh = 21 * k;
  const R = 17 * k;
  const hL = 46 * k;
  const head = Skia.Path.Make();
  head.moveTo(cx - Rh, top + hL);
  head.lineTo(cx - Rh, top + Rh * 0.55);
  head.cubicTo(cx - Rh, top - 2, cx + Rh, top - 2, cx + Rh, top + Rh * 0.55);
  head.lineTo(cx + Rh, top + hL);
  head.close();
  const body = lathe(cx, [[top + hL, R], [top + hL + 110 * k, R], [top + hL + 120 * k, R * 0.9]]);
  return (
    <>
      <Path path={body}>
        <Sheen x0={cx - R} x1={cx + R} />
      </Path>
      <Path path={head}>
        <LinearGradient start={vec(cx - Rh, 0)} end={vec(cx + Rh, 0)} colors={['#8a909b', '#dfe3e9', '#7d828c', '#2a2c32']} positions={[0, 0.3, 0.62, 1]} />
      </Path>
      <MeshOver clip={head} x0={cx - Rh} y0={top - 2} x1={cx + Rh} y1={top + hL} step={2.2} color="#16171b" opacity={0.55} />
      <Path path={head} style="stroke" strokeWidth={0.8} color="#3a3d45" />
      <RoundedRect x={cx - Rh} y={top + hL - 2} width={2 * Rh} height={5} r={1.5}>
        <Sheen x0={cx - Rh} x1={cx + Rh} dark />
      </RoundedRect>
      <Line p1={vec(cx - R * 0.5, top + hL + 8)} p2={vec(cx - R * 0.5, top + hL + 112 * k)} color={RIM} strokeWidth={1} opacity={0.45} />
      <XlrTail cx={cx} y={top + hL + 120 * k} r={R * 0.9} />
    </>
  );
}

// Electret CAPSULE (the "engine" itself), magnified: Ø 9.7 × 4.5 mm can, the
// felt-covered port on its face, two solder pads and leads at the back. mm = 6.
function ElectretMic() {
  const k = 6;
  const cx = 50;
  const cy = 52;
  const R = 4.85 * k;
  const ry = R * 0.42; // the face, seen at an angle
  const h = 4.5 * k;
  const can = Skia.Path.Make();
  can.addRect(Skia.XYWHRect(cx - R, cy, 2 * R, h));
  const leads = Skia.Path.Make();
  leads.moveTo(cx - 9, cy + h + ry * 0.6);
  leads.cubicTo(cx - 12, cy + h + 30, cx - 22, cy + h + 40, cx - 18, 146);
  const leads2 = Skia.Path.Make();
  leads2.moveTo(cx + 9, cy + h + ry * 0.6);
  leads2.cubicTo(cx + 12, cy + h + 30, cx + 20, cy + h + 42, cx + 14, 146);
  return (
    <>
      <Path path={leads} style="stroke" strokeWidth={2.4} color="#b03a2e" />
      <Path path={leads2} style="stroke" strokeWidth={2.4} color="#1c1d22" />
      {/* the can's back edge, its side, its rolled front lip and the face */}
      <Oval x={cx - R} y={cy + h - ry} width={2 * R} height={2 * ry} color="#3a3d45" />
      <Path path={can}>
        <Sheen x0={cx - R} x1={cx + R} />
      </Path>
      <Oval x={cx - R} y={cy - ry} width={2 * R} height={2 * ry}>
        <LinearGradient start={vec(cx - R, cy - ry)} end={vec(cx + R, cy + ry)} colors={['#e6e9ee', '#9aa0ab', '#5a5e68']} />
      </Oval>
      <Oval x={cx - R * 0.78} y={cy - ry * 0.78} width={2 * R * 0.78} height={2 * ry * 0.78} color="#16171b" />
      <Oval x={cx - R * 0.78} y={cy - ry * 0.78} width={2 * R * 0.78} height={2 * ry * 0.78} color="#2a2c32" style="stroke" strokeWidth={1} />
      {/* solder pads under the can (seen at its lower rim) */}
      <Circle cx={cx - 9} cy={cy + h + ry * 0.55} r={2.6} color="#d9c49a" />
      <Circle cx={cx + 9} cy={cy + h + ry * 0.55} r={2.6} color="#d9c49a" />
    </>
  );
}

// Side-address RIBBON (figure-8): a pill-shaped body 64 W × 200 H with a
// slotted two-layer grille window both sides, the corrugated ribbon between
// its magnet pole pieces, a U-yoke with side knobs, XLR at the base. mm = 0.68.
function RibbonMic() {
  const k = 0.68;
  const cx = 50;
  const W = 64 * k;
  const H = 168 * k;
  const y0 = 8;
  const body = Skia.Path.Make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - W / 2, y0, W, H), W / 2, W / 2));
  const win = Skia.Path.Make();
  win.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - W / 2 + 5, y0 + 8, W - 10, H - 30), W / 2 - 5, W / 2 - 5));
  const ribbon = Skia.Path.Make();
  for (let y = y0 + 14; y < y0 + H - 28; y += 3) {
    ribbon.moveTo(cx - 2.2, y);
    ribbon.lineTo(cx + 2.2, y + 1.5);
  }
  const yoke = Skia.Path.Make();
  yoke.moveTo(cx - W / 2 - 6, y0 + H * 0.5);
  yoke.lineTo(cx - W / 2 - 6, y0 + H + 10);
  yoke.lineTo(cx + W / 2 + 6, y0 + H + 10);
  yoke.lineTo(cx + W / 2 + 6, y0 + H * 0.5);
  return (
    <>
      <Path path={yoke} style="stroke" strokeWidth={4} strokeJoin="round" color="#2a2c32" />
      <RoundedRect x={cx - 5} y={y0 + H + 8} width={10} height={20} r={2}>
        <Sheen x0={cx - 5} x1={cx + 5} dark />
      </RoundedRect>
      <Path path={body}>
        <Sheen x0={cx - W / 2} x1={cx + W / 2} dark />
      </Path>
      <Path path={win} color="#0b0b0d" />
      {/* magnet pole pieces either side of the ribbon */}
      <RoundedRect x={cx - 12} y={y0 + 12} width={7} height={H - 38} r={2}>
        <Sheen x0={cx - 12} x1={cx - 5} />
      </RoundedRect>
      <RoundedRect x={cx + 5} y={y0 + 12} width={7} height={H - 38} r={2}>
        <Sheen x0={cx + 5} x1={cx + 12} />
      </RoundedRect>
      <Path path={ribbon} style="stroke" strokeWidth={0.9} color="#d9c49a" />
      <MeshOver clip={win} x0={cx - W / 2} y0={y0} x1={cx + W / 2} y1={y0 + H} step={3} color="#8a909b" opacity={0.35} />
      <Path path={win} style="stroke" strokeWidth={1.4} color="#5a5e68" />
      {/* the yoke's locking knobs */}
      <Circle cx={cx - W / 2 - 6} cy={y0 + H * 0.5} r={5} color="#16171b" />
      <Circle cx={cx + W / 2 + 6} cy={y0 + H * 0.5} r={5} color="#16171b" />
      <Circle cx={cx - W / 2 - 6} cy={y0 + H * 0.5} r={5} style="stroke" strokeWidth={1} color="#8a909b" />
      <Circle cx={cx + W / 2 + 6} cy={y0 + H * 0.5} r={5} style="stroke" strokeWidth={1} color="#8a909b" />
    </>
  );
}

// SMALL-DIAPHRAGM ("pencil") condenser: Ø 21 × 125 mm; the capsule head 24
// long with its side slots and top mesh, a thin ring, the body, XLR. mm = 1.1.
function SdcMic() {
  const k = 1.1;
  const cx = 50;
  const top = 4;
  const R = 10.5 * k;
  const head = lathe(cx, [[top, R - 2.5], [top + 2.5, R], [top + 24 * k, R]]);
  const body = lathe(cx, [[top + 24 * k, R], [top + 120 * k, R * 0.96]]);
  const slots = Skia.Path.Make();
  for (let i = 0; i < 3; i++) slots.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - R * 0.7 + i * R * 0.5, top + 10 * k, R * 0.32, 11 * k), 1.5, 1.5));
  return (
    <>
      <Path path={body}>
        <Sheen x0={cx - R} x1={cx + R} />
      </Path>
      <Path path={head}>
        <Sheen x0={cx - R} x1={cx + R} />
      </Path>
      <Path path={slots} color="#16171b" />
      <MeshOver clip={lathe(cx, [[top, R - 2.5], [top + 5, R]])} x0={cx - R} y0={top} x1={cx + R} y1={top + 5} step={1.8} />
      <RoundedRect x={cx - R - 0.5} y={top + 24 * k - 1.5} width={2 * R + 1} height={3} r={1} color="#2a2c32" />
      <Line p1={vec(cx - R * 0.5, top + 30 * k)} p2={vec(cx - R * 0.5, top + 114 * k)} color={RIM} strokeWidth={1} opacity={0.4} />
      <XlrTail cx={cx} y={top + 120 * k} r={R * 0.96} />
    </>
  );
}

// LAVALIER, magnified: a Ø 5 × 12 mm capsule with its mesh cap, held in a
// tie-clip (≈ 30 mm), the Ø 1.6 mm cable looping down. mm = 2.6.
function LavMic() {
  const k = 2.6;
  const cx = 44;
  const top = 18;
  const R = 2.5 * k;
  const cap = lathe(cx, [[top, R - 1.5], [top + 1.5, R], [top + 12 * k, R]]);
  const clip = Skia.Path.Make();
  clip.moveTo(cx + R, top + 16);
  clip.lineTo(cx + R + 30, top + 8);
  clip.lineTo(cx + R + 34, top + 14);
  clip.lineTo(cx + R + 6, top + 26);
  clip.close();
  const jaw = Skia.Path.Make();
  jaw.moveTo(cx + R, top + 24);
  jaw.lineTo(cx + R + 36, top + 30);
  jaw.lineTo(cx + R + 34, top + 36);
  jaw.lineTo(cx + R, top + 30);
  jaw.close();
  const cable = Skia.Path.Make();
  cable.moveTo(cx, top + 12 * k);
  cable.cubicTo(cx, top + 70, cx + 26, top + 70, cx + 18, top + 96);
  cable.cubicTo(cx + 12, top + 116, cx - 10, 128, cx - 4, 146);
  return (
    <>
      <Path path={cable} style="stroke" strokeWidth={2.2} color="#1c1d22" />
      <Path path={jaw}>
        <LinearGradient start={vec(cx, top + 24)} end={vec(cx + 36, top + 36)} colors={['#4a4e57', '#16171b']} />
      </Path>
      <Path path={clip}>
        <LinearGradient start={vec(cx, top + 8)} end={vec(cx + 34, top + 26)} colors={['#5a5e68', '#22242a']} />
      </Path>
      <Path path={cap}>
        <Sheen x0={cx - R} x1={cx + R} dark />
      </Path>
      <MeshOver clip={lathe(cx, [[top, R - 1.5], [top + 7, R]])} x0={cx - R} y0={top} x1={cx + R} y1={top + 7} step={1.4} color="#8a909b" opacity={0.6} />
      <Line p1={vec(cx - R * 0.45, top + 9)} p2={vec(cx - R * 0.45, top + 12 * k - 2)} color={RIM} strokeWidth={0.8} opacity={0.5} />
    </>
  );
}

// HEADWORN: an ear-hook (fits behind the ear) with the thin boom (≈ 110 mm)
// curving forward to a Ø 5 mm capsule under a small foam windscreen at the
// mouth; the cable down from the ear piece. No head drawn. mm = 0.62.
function HeadwornMic() {
  const hook = Skia.Path.Make();
  hook.moveTo(70, 30);
  hook.cubicTo(88, 26, 92, 60, 82, 82);
  hook.cubicTo(78, 92, 70, 96, 66, 92);
  const boom = Skia.Path.Make();
  boom.moveTo(70, 36);
  boom.cubicTo(52, 48, 34, 74, 26, 104);
  const cable = Skia.Path.Make();
  cable.moveTo(80, 86);
  cable.cubicTo(84, 110, 74, 126, 78, 146);
  return (
    <>
      <Path path={cable} style="stroke" strokeWidth={2} color="#1c1d22" />
      <Path path={hook} style="stroke" strokeWidth={5.5} strokeCap="round" color="#2a2c32" />
      <Path path={hook} style="stroke" strokeWidth={1.2} strokeCap="round" color={RIM} opacity={0.45} />
      {/* the ear piece where the boom pivots */}
      <RoundedRect x={64} y={26} width={14} height={18} r={6}>
        <LinearGradient start={vec(64, 26)} end={vec(78, 44)} colors={['#5a5e68', '#16171b']} />
      </RoundedRect>
      <Path path={boom} style="stroke" strokeWidth={2.6} strokeCap="round" color="#3a3d45" />
      <Path path={boom} style="stroke" strokeWidth={0.8} strokeCap="round" color={RIM} opacity={0.5} />
      {/* the capsule under its foam windscreen */}
      <Oval x={18} y={100} width={14} height={11} color="#1b1c20" />
      <Oval x={20} y={102} width={6} height={4} color="#3a3d45" opacity={0.8} />
    </>
  );
}

// SHOTGUN (interference tube): Ø 21 × 250 mm; the slotted tube over the
// front two-thirds under its fine mesh, the capsule section, the body, XLR.
// mm = 0.56.
function ShotgunMic() {
  const k = 0.56;
  const cx = 50;
  const top = 3;
  const R = 10.5 * k * 1.4; // drawn a touch wider so the slots read; proportions ~ 1 : 9
  const tubeL = 165 * k;
  const tube = lathe(cx, [[top, R - 1], [top + 1.5, R], [top + tubeL, R]]);
  const body = lathe(cx, [[top + tubeL, R], [top + 250 * k, R * 0.96]]);
  const slots = Skia.Path.Make();
  for (let i = 0; i < 9; i++) slots.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - R * 0.45, top + 6 + i * (tubeL - 12) / 9, R * 0.9, (tubeL - 12) / 9 - 3), 1.2, 1.2));
  return (
    <>
      <Path path={body}>
        <Sheen x0={cx - R} x1={cx + R} dark />
      </Path>
      <Path path={tube}>
        <Sheen x0={cx - R} x1={cx + R} dark />
      </Path>
      <Path path={slots} color="#050506" />
      <MeshOver clip={slots} x0={cx - R} y0={top} x1={cx + R} y1={top + tubeL} step={1.6} color="#6a6f7a" opacity={0.6} />
      <RoundedRect x={cx - R - 0.4} y={top + tubeL - 1.5} width={2 * R + 0.8} height={3} r={1} color="#5a5e68" />
      <Line p1={vec(cx - R * 0.6, top + 4)} p2={vec(cx - R * 0.6, top + 240 * k)} color={RIM} strokeWidth={0.8} opacity={0.35} />
      <XlrTail cx={cx} y={top + 250 * k} r={R * 0.96} />
    </>
  );
}

// BOUNDARY (plate type): a low plate ≈ 110 × 80 × 18 mm, the capsule's slot
// at its front lip, flush with the surface; three-quarter view, its cable out
// of the back. mm = 0.7.
function BoundaryMic() {
  const plate = Skia.Path.Make();
  plate.moveTo(14, 100);
  plate.lineTo(86, 100);
  plate.lineTo(74, 74);
  plate.lineTo(26, 74);
  plate.close();
  const lip = Skia.Path.Make();
  lip.moveTo(14, 100);
  lip.lineTo(86, 100);
  lip.lineTo(86, 106);
  lip.lineTo(14, 106);
  lip.close();
  const cable = Skia.Path.Make();
  cable.moveTo(50, 74);
  cable.cubicTo(50, 50, 72, 44, 80, 20);
  return (
    <>
      {/* the surface it rests on */}
      <Oval x={2} y={96} width={96} height={24} color="#1b1c20" opacity={0.8} />
      <Path path={cable} style="stroke" strokeWidth={2.6} color="#1c1d22" />
      <Path path={plate}>
        <LinearGradient start={vec(26, 74)} end={vec(86, 100)} colors={['#6a6f7a', '#3a3d45', '#1b1c20']} />
      </Path>
      <Path path={lip}>
        <LinearGradient start={vec(0, 100)} end={vec(0, 106)} colors={['#3a3d45', '#16171b']} />
      </Path>
      {/* the capsule's grille slot at the front lip */}
      <RoundedRect x={36} y={92} width={28} height={6} r={3} color="#0b0b0d" />
      <RoundedRect x={36} y={92} width={28} height={6} r={3} color="#8a909b" style="stroke" strokeWidth={0.8} />
      <Line p1={vec(27, 75)} p2={vec(73, 75)} color={RIM} strokeWidth={1} opacity={0.5} />
    </>
  );
}

// MEASUREMENT: a ½ in (Ø 13.2) capsule with its protective grid on a slim
// tapering preamp body Ø 20 × 190 mm, the XLR end. mm = 0.7.
function MeasurementMic() {
  const k = 0.7;
  const cx = 50;
  const top = 4;
  const rc = 6.6 * k * 1.2;
  const R = 10 * k * 1.2;
  const cap = lathe(cx, [[top, rc - 1], [top + 1, rc], [top + 14 * k, rc]]);
  const body = lathe(cx, [[top + 14 * k, rc], [top + 30 * k, R], [top + 190 * k, R]]);
  return (
    <>
      <Path path={body}>
        <Sheen x0={cx - R} x1={cx + R} />
      </Path>
      <Path path={cap}>
        <Sheen x0={cx - rc} x1={cx + rc} />
      </Path>
      {/* the protective grid's slots round the capsule */}
      {[0, 1, 2].map((i) => (
        <RoundedRect key={i} x={cx - rc * 0.75 + i * rc * 0.55} y={top + 3} width={rc * 0.3} height={14 * k - 5} r={0.8} color="#16171b" />
      ))}
      <RoundedRect x={cx - R - 0.4} y={top + 60 * k} width={2 * R + 0.8} height={2.4} r={1} color="#5a5e68" />
      <Line p1={vec(cx - R * 0.5, top + 32 * k)} p2={vec(cx - R * 0.5, top + 184 * k)} color={RIM} strokeWidth={0.9} opacity={0.4} />
      <XlrTail cx={cx} y={top + 190 * k} r={R} />
    </>
  );
}

// CONTACT: a piezo disc pickup — a Ø 27 mm brass disc with its Ø 20 mm
// ceramic element and the electrode on top, two leads soldered on, seen at
// an angle; the cable away. mm = 2.6.
function ContactMic() {
  const k = 2.6;
  const cx = 50;
  const cy = 60;
  const R = 13.5 * k;
  const r = 10 * k;
  const t = 0.38; // the disc's tilt (ellipse ratio)
  const red = Skia.Path.Make();
  red.moveTo(cx - 6, cy - 2);
  red.cubicTo(cx + 10, cy + 30, cx + 30, cy + 40, cx + 24, 146);
  const black = Skia.Path.Make();
  black.moveTo(cx + R * 0.82, cy + 4);
  black.cubicTo(cx + R + 10, cy + 30, cx + 34, cy + 50, cx + 30, 146);
  return (
    <>
      <Oval x={cx - R} y={cy - R * t + 3} width={2 * R} height={2 * R * t} color="#4a3510" />
      <Oval x={cx - R} y={cy - R * t} width={2 * R} height={2 * R * t}>
        <LinearGradient start={vec(cx - R, cy - R * t)} end={vec(cx + R, cy + R * t)} colors={['#f2d58a', '#c9a24a', '#7a5a1c']} />
      </Oval>
      <Oval x={cx - r} y={cy - r * t} width={2 * r} height={2 * r * t}>
        <LinearGradient start={vec(cx - r, cy - r * t)} end={vec(cx + r, cy + r * t)} colors={['#f4f6fa', '#c3c8d0', '#8a909b']} />
      </Oval>
      <Oval x={cx - r} y={cy - r * t} width={2 * r} height={2 * r * t} style="stroke" strokeWidth={0.8} color="#6a6f7a" />
      <Path path={red} style="stroke" strokeWidth={2.2} color="#b03a2e" />
      <Path path={black} style="stroke" strokeWidth={2.2} color="#1c1d22" />
      <Circle cx={cx - 6} cy={cy - 2} r={3} color="#c8ccd4" />
      <Circle cx={cx + R * 0.82} cy={cy + 4} r={3} color="#c8ccd4" />
    </>
  );
}

const DRAWINGS: Record<MicKind, () => React.JSX.Element> = {
  dynamic: DynamicMic,
  condenser: CondenserMic,
  electret: ElectretMic,
  ribbon: RibbonMic,
  ldc: LdcMic,
  sdc: SdcMic,
  lav: LavMic,
  headworn: HeadwornMic,
  shotgun: ShotgunMic,
  boundary: BoundaryMic,
  measurement: MeasurementMic,
  contact: ContactMic,
};

/** One microphone illustration, scaled from the 100×150 design space. */
export function MicArt({ kind, w = 56, h = 84 }: { kind: MicKind; w?: number; h?: number }) {
  const Draw = DRAWINGS[kind];
  return (
    <Canvas style={{ width: w, height: h }}>
      <Group transform={[{ scaleX: w / 100 }, { scaleY: h / 150 }]}>
        <Draw />
      </Group>
    </Canvas>
  );
}

// ── Tap-to-enlarge photo lightbox (owner 2026-08-18) ─────────────────────────
// One shared fullscreen modal for the whole lab. Wrap the lab screen in
// <MicPhotoLightbox> once; every MicVisual then opens the big photo on tap.
const LightboxCtx = createContext<((kind: MicKind) => void) | null>(null);

export function MicPhotoLightbox({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<MicKind | null>(null);
  const lbSide = useLightboxSide();
  // Warm all twelve mic photos once the lab opens (perf hunt 2026-10-03):
  // each type card and detail panel used to fetch its photo on first show,
  // so stepping through the mic types painted empty tiles first.
  useEffect(() => {
    Image.prefetch(allMicImageUrls(), 'memory-disk').catch(() => {});
  }, []);
  const url = kind ? micImageUrl(kind) : null;
  return (
    <LightboxCtx.Provider value={setKind}>
      {children}
      <Modal accessibilityViewIsModal visible={!!url} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setKind(null)}>
        {/* ONE element that names the photo AND closes it — the image was a
            second element nested inside this one, unreachable on iOS
            (APE-STUDIO-W/R/S nested-element sweep, 2026-10-08). */}
        <Pressable
          style={styles.lbBackdrop}
          onPress={() => setKind(null)}
          accessibilityRole="button"
          accessibilityLabel={`${kind ? `${kind} microphone reference image` : 'Microphone reference image'}. Tap to close.`}
          onAccessibilityEscape={() => setKind(null)}
        >
          <View style={[styles.lbCard, { width: lbSide, height: lbSide }]}>
            {url ? (
              <Image
                accessible={false}
                source={{ uri: url }}
                style={styles.lbImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
            ) : null}
          </View>
          <View style={styles.lbClose} pointerEvents="none">
            <Text style={styles.lbCloseX}>✕</Text>
          </View>
        </Pressable>
      </Modal>
    </LightboxCtx.Provider>
  );
}

/** Mic visual = the real reference PHOTO when the kind has one (owner 2026-08-17,
 *  Option A), on a light tile so the seamless-white product shot reads cleanly
 *  against the dark lab UI. TAP to enlarge in the shared lightbox (owner
 *  2026-08-18) — a ⤢ hint marks it zoomable. Falls back to the code-drawn MicArt
 *  illustration if the kind is unmapped or the image fails to load — never a blank. */
export function MicVisual({
  kind,
  w = 56,
  h = 84,
  zoomable = true,
}: {
  kind: MicKind;
  w?: number;
  h?: number;
  /**
   * Set false when this photo sits INSIDE another button. The tile wraps itself
   * in its own Pressable to open the lightbox; nested inside the mic-type grid
   * cards that produced twelve <button>-in-<button> pairs on one screen —
   * invalid on web, and a screen reader could not reach either action cleanly.
   * A 44×66 thumbnail is too small to hold a second target anyway; the lightbox
   * stays reachable from the full-size photo in the detail panel.
   */
  zoomable?: boolean;
}) {
  const url = micImageUrl(kind);
  const ctxOpen = useContext(LightboxCtx);
  const open = zoomable ? ctxOpen : null;
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <MicArt kind={kind} w={w} h={h} />;
  const tile = (
    <View style={[styles.photoTile, { width: w, height: h }]}>
      <Image accessible
        source={{ uri: url }}
        style={styles.photo}
        contentFit="contain"
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
        accessibilityLabel={`${kind} microphone photo`}
      />
      {open && w >= 40 ? (
        <View style={styles.zoomBadge} pointerEvents="none">
          <Text style={styles.zoomIcon}>⤢</Text>
        </View>
      ) : null}
    </View>
  );
  if (!open) return tile;
  return (
    <Pressable onPress={() => open(kind)} accessibilityRole="button" accessibilityLabel={`Enlarge ${kind} microphone photo`}>
      {tile}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Light product-card tile — the bucket photos are on seamless white, so a
  // white/near-white rounded tile makes that read as intentional on the dark UI.
  photoTile: { backgroundColor: '#f4f4f5', borderRadius: 7, overflow: 'hidden', padding: 3 },
  photo: { width: '100%', height: '100%' },
  // Small "tap to enlarge" hint, bottom-right of the photo.
  zoomBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: { color: '#fff', fontSize: 10, lineHeight: 12 },
  // Fullscreen lightbox.
  lbBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  lbCard: { backgroundColor: '#f4f4f5', borderRadius: 14, overflow: 'hidden', padding: 10 },
  lbImage: { width: '100%', height: '100%' },
  lbClose: { position: 'absolute', top: 44, right: 22 },
  lbCloseX: { color: '#fff', fontSize: 26, fontWeight: '700' },
});
