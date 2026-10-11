/**
 * C12 CLAVINET — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2).
 *
 * KEY TO SIGNAL (one key, one string, cut open; HOH-D6 p.5 — corrected from
 * the old lesson's "a hammer presses a string against a pickup-facing
 * surface", CORRECTIONS_LOG C12-01; the action re-drawn 2026-10-10 for audit
 * rows F0338–F0340): ① the key, pivoted at its BACK, goes down, and the
 * tangent (a hard-rubber tip in a holder UNDER the key) presses down onto the
 * string; ② it presses the string DOWN onto the ANVIL beneath it; ③ the
 * string rings between the anvil and the bridge; ④ the PICKUPS — one below
 * the strings, one above them — turn its motion into a small voltage, out to
 * the amp; ⑤ the key comes up, the tangent lifts off, and the yarn woven round
 * the string's short end mutes it.
 *
 * SIGNAL PATH ("Where it leaves"): the clavinet makes almost no sound in
 * the air — its sound leaves as a SIGNAL. The chain drawn as real objects:
 * clavinet → pedals → amp → speaker → mic → console, and a direct (DI) tap
 * before or after the pedals.
 *
 * HONESTY: one key and its string in one section (a real string runs
 * diagonally under the keys); the parts at about true proportion, but the
 * string's thickness and every motion drawn many times larger; the pickups
 * drawn in section, one under and one over the string. One value,
 * `reveal` (1 … 5), drives every part; nothing loops (D8).
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { ChainIcon } from '../shared/speakers/chainIcons';

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
const DIMC = '#4a4d55';
type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

/* ── key to signal ── */
/*
 * One key and its string, cut open, seen from the player's right (the player
 * on the left). TRUE PROPORTIONS for the parts, ≈ 2.2 units per mm (code
 * comment only; typical sizes, not a measured drawing of one instrument):
 * the case ≈ 440 deep × 140 high; the key ≈ 245 long and 14 thick, pivoted on
 * a pin at its BACK end (≈ 240 from the front) with a return spring just in
 * front of the pivot — a lever with the tangent between the finger and the
 * pivot, so the tangent travels ≈ 0.6 × the key front; under the key a metal
 * holder grips the hard-rubber TANGENT (≈ 7 wide), just above the string;
 * under the string, the steel ANVIL stud on its rail; the string runs from
 * the tuning pin at the front, through the YARN weave, over the anvil, to the
 * bridge at the back (sounding length here ≈ 300; real ones run ≈ 120–700
 * across the 60 notes); the two pickups (bar coils in epoxy, ≈ 12 × 22 in
 * section) — one BELOW the strings toward the middle of the sounding length,
 * one ABOVE them close to the bridge.
 * Drawn LARGER than life: the string's thickness, the tangent's travel
 * (≈ 9 mm drawn), the gap to the anvil and the string's swing.
 */
const KX = 2.2; // units per mm
const X0 = 20; // the case's front face
const mm = (v: number) => X0 + v * KX;
const FLOOR = 388; // the inside of the case bottom
const up = (v: number) => FLOOR - v * KX; // height above the case bottom, mm → v
const PIN = mm(30);
const ANVIL = mm(105);
const BRIDGE = mm(410);
const PX = mm(240); // the key's pivot pin
const KEY_FRONT = mm(8);
const KEY_BACK = mm(252);
const KEY_TOP = up(110);
const KEY_BOT = KEY_TOP + 14 * KX;
const PY = KEY_TOP + 7 * KX; // the pivot pin, mid-thickness
const SY = up(70); // the string at rest
const SR = 2.25; // the string's drawn half-thickness
const GAP = 6; // tangent tip → string at rest (drawn larger)
const TT = 20; // the tangent's travel at the anvil (drawn larger)
const DROP = TT - GAP; // how far the tangent presses the string down
const ANVIL_TOP = SY + DROP + SR;
const SWING = 8; // the string's swing (drawn larger; real: a fraction of a mm)
const PU_LO = mm(290); // the pickup below the strings
const PU_HI = mm(385); // the pickup above the strings
const SPRING_X = mm(220);
const JACK = { x: 983, y: 345 };
const BOX = { u0: 0, u1: 1010, v0: 40, v1: 440 };

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};
/** The tangent's travel (0 at rest … 1 pressing the string onto the anvil). */
const tangentT = (r: number) => {
  'worklet';
  return r < 2 ? clamp01(r - 1) : r < 4.5 ? 1 : clamp01(1 - (r - 4.5) * 2.5);
};
const swingS = (r: number) => {
  'worklet';
  return r < 2.5 ? 0 : r < 4.5 ? clamp01((r - 2.5) * 3) : clamp01(1 - (r - 4.5) * 4);
};
/** How far the string is pressed down at the anvil (0 … DROP). */
const pressD = (r: number) => {
  'worklet';
  return Math.max(0, Math.min(DROP, TT * tangentT(r) - GAP));
};

/** The key turns about its back pivot: the front and the tangent go DOWN. */
function keyRot(r: number) {
  'worklet';
  const d = TT * tangentT(r);
  const sn = -d / (PX - ANVIL);
  return { sn, cs: Math.sqrt(1 - sn * sn) };
}
function poly(pts: number[], r: number): SkPath {
  'worklet';
  const { sn, cs } = keyRot(r);
  const p = Skia.Path.Make();
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - PX;
    const dy = pts[i + 1] - PY;
    const x = PX + dx * cs - dy * sn;
    const y = PY + dx * sn + dy * cs;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.close();
  return p;
}
/** The key's wooden body (it moves as one piece with the tangent). */
function keyBodyPath(r: number): SkPath {
  'worklet';
  return poly([KEY_FRONT, KEY_TOP + 6, KEY_BACK, KEY_TOP + 6, KEY_BACK, KEY_BOT, KEY_FRONT, KEY_BOT], r);
}
/** The key's white top over its playing part. */
function keyCapPath(r: number): SkPath {
  'worklet';
  return poly([KEY_FRONT - 2, KEY_TOP, mm(150), KEY_TOP, mm(150), KEY_TOP + 6, KEY_FRONT - 2, KEY_TOP + 7], r);
}
/** The metal holder screwed under the key. */
function holderPath(r: number): SkPath {
  'worklet';
  const b = SY - SR - GAP - 16;
  return poly([ANVIL - 10, KEY_BOT, ANVIL + 10, KEY_BOT, ANVIL + 10, b + 6, ANVIL + 8, b + 6, ANVIL + 8, b, ANVIL - 8, b, ANVIL - 8, b + 6, ANVIL - 10, b + 6], r);
}
/** The hard-rubber tangent in the holder's jaws; its tip just above the string. */
function padPath(r: number): SkPath {
  'worklet';
  const t = SY - SR - GAP;
  return poly([ANVIL - 7, t - 18, ANVIL + 7, t - 18, ANVIL + 7, t - 3, ANVIL + 4, t, ANVIL - 4, t, ANVIL - 7, t - 3], r);
}
/** The return spring between the key frame and the key, just in front of the pivot. */
function springPath(r: number): SkPath {
  'worklet';
  const { sn, cs } = keyRot(r);
  const top = PY + (SPRING_X - PX) * sn + (KEY_BOT - PY) * cs;
  const bot = KEY_BOT + 22;
  const p = Skia.Path.Make();
  const n = 7;
  p.moveTo(SPRING_X, bot);
  for (let i = 1; i < n; i++) p.lineTo(SPRING_X + (i % 2 ? -6 : 6), bot + ((top - bot) * i) / n);
  p.lineTo(SPRING_X, top);
  return p;
}

function stringPath(r: number, sign: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const yc = SY + pressD(r);
  const s = swingS(r) * sign;
  p.moveTo(PIN, SY);
  p.lineTo(ANVIL, yc);
  const n = 40;
  for (let j = 1; j <= n; j++) {
    const f = j / n;
    const x = ANVIL + (BRIDGE - ANVIL) * f;
    const y = yc + (SY - yc) * f - SWING * s * Math.sin(Math.PI * f);
    p.lineTo(x, y);
  }
  return p;
}
/** The yarn woven round the string's short end: it rides with the string. */
function yarnPath(r: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const yc = SY + pressD(r);
  for (let x = mm(40); x < mm(95); x += 9) {
    const y = SY + ((yc - SY) * (x + 4 - PIN)) / (ANVIL - PIN);
    p.addOval(Skia.XYWHRect(x, y - 9, 8, 18));
  }
  return p;
}

type Built = Record<string, SkPath>;
let seqCache: Built | null = null;
function seqPaths(): Built {
  if (seqCache) return seqCache;
  const o: Built = {};
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    const p = make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r));
    return p;
  };
  // The case cut open: the bottom, the low front rail under the keys, the
  // back wall, and the lid over the back part (the keys stand in front of it).
  o.inside = rr(X0 + 4, 104, 960, FLOOR - 104, 6);
  o.walls = make();
  o.walls.addRRect(Skia.RRectXY(Skia.XYWHRect(X0, FLOOR, 968, 16), 4, 4));
  o.walls.addRRect(Skia.RRectXY(Skia.XYWHRect(X0, up(42), 18, FLOOR - up(42) + 8), 4, 4));
  o.walls.addRRect(Skia.RRectXY(Skia.XYWHRect(970, 92, 18, FLOOR - 84), 4, 4));
  o.walls.addRRect(Skia.RRectXY(Skia.XYWHRect(mm(155), 92, 988 - mm(155), 18), 4, 4));
  // the pin block and the tuning pin, the string wound round it
  o.pinBlock = rr(PIN - 22, SY + 4, 44, FLOOR - SY - 4, 4);
  o.pin = rr(PIN - 6, SY - 16, 12, 34, 3);
  o.pinTop = rr(PIN - 8, SY - 20, 16, 7, 2);
  o.pinWind = make();
  for (const y of [SY - 6, SY - 1, SY + 4]) o.pinWind.addOval(Skia.XYWHRect(PIN - 8, y - 2, 16, 4));
  // the anvil: a hardened steel stud on its rail, on a wooden support
  o.anvilSup = rr(ANVIL - 15, ANVIL_TOP + 30, 30, FLOOR - ANVIL_TOP - 30, 3);
  o.anvilRail = rr(ANVIL - 26, ANVIL_TOP + 16, 52, 14, 3);
  o.anvil = make();
  o.anvil.moveTo(ANVIL - 9, ANVIL_TOP + 16);
  o.anvil.lineTo(ANVIL - 5, ANVIL_TOP + 2);
  o.anvil.quadTo(ANVIL, ANVIL_TOP - 1.5, ANVIL + 5, ANVIL_TOP + 2);
  o.anvil.lineTo(ANVIL + 9, ANVIL_TOP + 16);
  o.anvil.close();
  // the key frame's back rail, the pivot bracket and pin
  o.keyRail = rr(SPRING_X - 14, KEY_BOT + 22, PX - SPRING_X + 40, 22, 3);
  o.bracket = rr(PX - 6, PY - 2, 12, KEY_BOT + 24 - PY, 2);
  o.pivotPin = make();
  o.pivotPin.addCircle(PX, PY, 5);
  // the bridge (wood, a steel saddle) and the string's tail to its hitch pin
  o.bridge = rr(BRIDGE - 12, SY + SR, 24, FLOOR - SY - SR, 3);
  o.saddle = make();
  o.saddle.moveTo(BRIDGE - 8, SY + SR + 5);
  o.saddle.lineTo(BRIDGE, SY + SR - 1);
  o.saddle.lineTo(BRIDGE + 8, SY + SR + 5);
  o.saddle.close();
  o.tail = make();
  o.tail.moveTo(BRIDGE, SY);
  o.tail.lineTo(BRIDGE + 30, SY + 12);
  o.hitchBlock = rr(BRIDGE + 14, SY + 14, 26, FLOOR - SY - 14, 3);
  o.hitch = make();
  o.hitch.addCircle(BRIDGE + 30, SY + 14, 4.5);
  // the two pickups: below the string toward the middle, above it near the bridge
  const PW = 12 * KX;
  const PH = 22 * KX;
  const loTop = SY + 16;
  const hiBot = SY - 10;
  o.pickups = make();
  o.pickups.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_LO - PW / 2, loTop, PW, PH), 5, 5));
  o.pickups.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_HI - PW / 2, hiBot - PH, PW, PH), 5, 5));
  o.coils = make();
  o.coils.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_LO - PW / 2 + 5, loTop + 9, PW - 10, PH - 14), 2, 2));
  o.coils.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_HI - PW / 2 + 5, hiBot - PH + 5, PW - 10, PH - 14), 2, 2));
  o.winding = make();
  for (const [x, y0] of [[PU_LO, loTop + 9], [PU_HI, hiBot - PH + 5]] as const)
    for (let i = 1; i < 9; i++) {
      o.winding.moveTo(x - PW / 2 + 5, y0 + ((PH - 14) * i) / 9);
      o.winding.lineTo(x + PW / 2 - 5, y0 + ((PH - 14) * i) / 9 + 1);
    }
  // the pole blades, each on the face toward the string
  o.poles = make();
  o.poles.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_LO - PW / 2 + 2, loTop, PW - 4, 5), 1.5, 1.5));
  o.poles.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_HI - PW / 2 + 2, hiBot - 5, PW - 4, 5), 1.5, 1.5));
  o.puMounts = make();
  o.puMounts.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_LO - 22, loTop + PH, 44, 8), 2, 2));
  o.puMounts.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_LO - 7, loTop + PH + 8, 14, FLOOR - loTop - PH - 8), 2, 2));
  o.puMounts.addRRect(Skia.RRectXY(Skia.XYWHRect(PU_HI - 22, hiBot - PH - 8, 970 - PU_HI + 22, 8), 2, 2));
  // the leads to the output jack in the back wall
  o.leads = make();
  o.leads.moveTo(PU_LO + 11, loTop + PH + 8);
  o.leads.lineTo(PU_LO + 11, FLOOR - 22);
  o.leads.quadTo(PU_LO + 11, FLOOR - 10, PU_LO + 24, FLOOR - 10);
  o.leads.lineTo(950, FLOOR - 10);
  o.leads.quadTo(966, FLOOR - 10, 966, JACK.y + 14);
  o.leads.quadTo(966, JACK.y, JACK.x - 12, JACK.y);
  o.leads.moveTo(PU_HI + PW / 2, hiBot - PH + 10);
  o.leads.cubicTo(950, hiBot - PH + 10, 966, hiBot - PH + 20, 966, 240);
  o.leads.lineTo(966, JACK.y - 12);
  o.leads.quadTo(966, JACK.y, JACK.x - 12, JACK.y);
  o.jack = make();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    if (i === 0) o.jack.moveTo(JACK.x + 8 * Math.cos(a), JACK.y + 8 * Math.sin(a));
    else o.jack.lineTo(JACK.x + 8 * Math.cos(a), JACK.y + 8 * Math.sin(a));
  }
  o.jack.close();
  // the finger's push on the key front
  const fx = KEY_FRONT + 26;
  o.push = make();
  o.push.moveTo(fx, KEY_TOP - 54);
  o.push.lineTo(fx, KEY_TOP - 10);
  o.push.moveTo(fx - 15, KEY_TOP - 30);
  o.push.lineTo(fx, KEY_TOP - 10);
  o.push.lineTo(fx + 15, KEY_TOP - 30);
  o.out = make();
  o.out.moveTo(JACK.x - 40, JACK.y);
  o.out.lineTo(1004, JACK.y);
  o.out.moveTo(982, JACK.y - 15);
  o.out.lineTo(1004, JACK.y);
  o.out.lineTo(982, JACK.y + 15);
  seqCache = o;
  return o;
}

const WOOD = ['#9c6631', '#6e431f', '#3e230e'];
const STEEL = ['#e6e9ef', '#9aa0ab', '#4a4e57'];

export function ClavinetSequence({ w, h, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const o = seqPaths();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const sA = useDerivedValue(() => stringPath(reveal.value, 1));
  const sB = useDerivedValue(() => stringPath(reveal.value, -1));
  const sBOn = useDerivedValue(() => (swingS(reveal.value) > 0.02 ? 0.5 : 0));
  const ringOn = useDerivedValue(() => (swingS(reveal.value) > 0.02 ? 0.9 : 0));
  const keyBody = useDerivedValue(() => keyBodyPath(reveal.value));
  const keyCap = useDerivedValue(() => keyCapPath(reveal.value));
  const holder = useDerivedValue(() => holderPath(reveal.value));
  const pad = useDerivedValue(() => padPath(reveal.value));
  const spring = useDerivedValue(() => springPath(reveal.value));
  const yarn = useDerivedValue(() => yarnPath(reveal.value));
  const pushOn = useDerivedValue(() => (reveal.value < 2.2 ? 1 : 0.25));
  const pickOn = useDerivedValue(() => (reveal.value >= 3.6 && reveal.value < 4.8 ? 1 : 0));
  const muteOn = useDerivedValue(() => clamp01((reveal.value - 4.5) * 2));
  const labels: StaticLabel[] = [];
  const at = { u: BOX.u0 + 30, v: BOX.v0 + 12 };
  if (shown === 1) labels.push({ id: 'e1', text: '① KEY DOWN · THE TANGENT PRESSES DOWN', short: '① TANGENT DOWN', ...at, align: 'left', tone: 'amber' });
  if (shown === 2) labels.push({ id: 'e2', text: '② IT PRESSES THE STRING ONTO THE ANVIL', short: '② ONTO THE ANVIL', ...at, align: 'left', tone: 'amber' });
  if (shown === 3) labels.push({ id: 'e3', text: '③ THE STRING RINGS, ANVIL TO BRIDGE', short: '③ IT RINGS', ...at, align: 'left', tone: 'blue' });
  if (shown === 4) labels.push({ id: 'e4', text: '④ THE PICKUPS MAKE A SMALL VOLTAGE', short: '④ A SIGNAL', ...at, align: 'left', tone: 'blue' });
  if (shown === 5) labels.push({ id: 'e5', text: '⑤ KEY UP · THE YARN MUTES IT', short: '⑤ MUTED', ...at, align: 'left', tone: 'amber' });
  labels.push(
    { id: 'key', text: 'KEY', u: KEY_FRONT + 90, v: KEY_TOP - 24, align: 'center', tone: 'muted' },
    { id: 'tangent', text: 'TANGENT', u: ANVIL + 22, v: SY - 20, align: 'left', tone: 'muted' },
    { id: 'anvil', text: 'ANVIL', u: ANVIL + 34, v: ANVIL_TOP + 22, align: 'left' },
    { id: 'yarn', text: 'YARN', u: mm(68), v: SY + 42, align: 'center', tone: 'muted' },
    { id: 'puHi', text: 'PICKUP · ABOVE', short: 'PICKUP', u: PU_HI - 30, v: SY - 46, align: 'right' },
    { id: 'puLo', text: 'PICKUP · BELOW', short: 'PICKUP', u: PU_LO + 24, v: SY + 52, align: 'left' },
    { id: 'bridge', text: 'BRIDGE', u: BRIDGE - 20, v: SY + 102, align: 'right', tone: 'muted' },
    { id: 'out', text: 'TO THE AMP', u: 1004, v: JACK.y + 34, align: 'right', tone: 'amber' },
    { id: 'big', text: 'NOT TO SCALE · MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 520, v: BOX.v1 - 14, align: 'center', tone: 'illustrative' },
  );
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* the case cut open: the dim inside, then its wooden walls, bottom and lid */}
          <Path path={o.inside}>
            <LinearGradient start={vec(0, 104)} end={vec(0, FLOOR)} colors={['#1d1714', '#15110e', '#0c0a08']} />
          </Path>
          <Path path={o.walls}>
            <LinearGradient start={vec(20, 92)} end={vec(990, 404)} colors={['#5a3a20', '#3e2814', '#24160b']} />
          </Path>
          <Path path={o.walls} style="stroke" strokeWidth={2} color="#08080a" />
          {/* the pin block and the tuning pin, the string wound round it */}
          <Path path={o.pinBlock}>
            <LinearGradient start={vec(PIN - 22, 0)} end={vec(PIN + 22, 0)} colors={WOOD} />
          </Path>
          <Path path={o.pin}>
            <LinearGradient start={vec(PIN - 6, 0)} end={vec(PIN + 6, 0)} colors={STEEL} />
          </Path>
          <Path path={o.pinTop}>
            <LinearGradient start={vec(PIN - 8, 0)} end={vec(PIN + 8, 0)} colors={STEEL} />
          </Path>
          {/* the anvil under the string: its wooden support, its rail, its hardened stud */}
          <Path path={o.anvilSup}>
            <LinearGradient start={vec(ANVIL - 15, 0)} end={vec(ANVIL + 15, 0)} colors={WOOD} />
          </Path>
          <Path path={o.anvilRail}>
            <LinearGradient start={vec(0, ANVIL_TOP + 16)} end={vec(0, ANVIL_TOP + 30)} colors={STEEL} />
          </Path>
          <Path path={o.anvil}>
            <LinearGradient start={vec(ANVIL - 9, 0)} end={vec(ANVIL + 9, 0)} colors={['#d9dde3', '#8d939d', '#565b63']} />
          </Path>
          <Path path={o.anvil} style="stroke" strokeWidth={1.2} color="#08080a" opacity={0.6} />
          {/* the pickups: their mounts, epoxy housings, coils and pole blades */}
          <Path path={o.puMounts}>
            <LinearGradient start={vec(0, 140)} end={vec(0, FLOOR)} colors={STEEL} />
          </Path>
          <Path path={o.pickups}>
            <LinearGradient start={vec(PU_LO - 20, 150)} end={vec(PU_HI + 20, 320)} colors={['#3d4048', '#1d1e22', '#0b0b0d']} />
          </Path>
          <Path path={o.coils}>
            <LinearGradient start={vec(0, 150)} end={vec(0, 320)} colors={['#c27a3a', '#8a4a1a', '#4a2408']} />
          </Path>
          <Path path={o.winding} style="stroke" strokeWidth={0.8} color="#3a1a06" opacity={0.7} />
          <Path path={o.poles}>
            <LinearGradient start={vec(0, SY - 16)} end={vec(0, SY + 21)} colors={STEEL} />
          </Path>
          <Path path={o.leads} style="stroke" strokeWidth={5} color="#2a2b30" />
          <Path path={o.jack}>
            <LinearGradient start={vec(JACK.x - 8, JACK.y - 8)} end={vec(JACK.x + 8, JACK.y + 8)} colors={STEEL} />
          </Path>
          <Group opacity={pickOn}>
            <Path path={o.pickups} style="stroke" strokeWidth={5} color={BLUE} />
            <Path path={o.leads} style="stroke" strokeWidth={7} color={AMBER} />
          </Group>
          {/* the bridge, its saddle, the hitch pin */}
          <Path path={o.bridge}>
            <LinearGradient start={vec(BRIDGE - 12, 0)} end={vec(BRIDGE + 12, 0)} colors={WOOD} />
          </Path>
          <Path path={o.hitchBlock}>
            <LinearGradient start={vec(BRIDGE + 14, 0)} end={vec(BRIDGE + 40, 0)} colors={WOOD} />
          </Path>
          <Path path={o.saddle} color="#c9ccd3" />
          <Path path={o.tail} style="stroke" strokeWidth={3} color="#9aa0ab" />
          <Path path={o.hitch} color="#c9ccd3" />
          {/* the key frame's back rail, the return spring, the pivot bracket */}
          <Path path={o.keyRail}>
            <LinearGradient start={vec(0, KEY_BOT + 22)} end={vec(0, KEY_BOT + 44)} colors={WOOD} />
          </Path>
          <Path path={spring} style="stroke" strokeWidth={2.4} color="#c9ccd3" strokeJoin="round" />
          <Path path={o.bracket}>
            <LinearGradient start={vec(PX - 6, 0)} end={vec(PX + 6, 0)} colors={STEEL} />
          </Path>
          {/* the string (steel): its other extreme drawn as a ghost; blue while it rings */}
          <Group opacity={sBOn}>
            <Path path={sB} style="stroke" strokeWidth={3} color={BLUE}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          </Group>
          <Path path={sA} style="stroke" strokeWidth={SR * 2} color="#c9ccd3" />
          <Group opacity={ringOn}>
            <Path path={sA} style="stroke" strokeWidth={SR * 2} color={BLUE} />
          </Group>
          <Path path={o.pinWind} style="stroke" strokeWidth={1.6} color="#e6e9ef" />
          {/* the yarn woven round the string's short end */}
          <Path path={yarn} style="stroke" strokeWidth={3.4} color="#b8483c" />
          <Group opacity={muteOn}>
            <Path path={yarn} style="stroke" strokeWidth={6} color={AMBER} />
          </Group>
          {/* the key on its pivot pin, the holder and the rubber tangent under it */}
          <Path path={holder}>
            <LinearGradient start={vec(ANVIL - 10, 0)} end={vec(ANVIL + 10, 0)} colors={STEEL} />
          </Path>
          <Path path={pad} color="#2e2f35" />
          <Path path={pad} style="stroke" strokeWidth={1.5} color="#08080a" />
          <Path path={keyBody}>
            <LinearGradient start={vec(0, KEY_TOP)} end={vec(0, KEY_BOT)} colors={['#b07a44', '#8a5a2c', '#5e3a18']} />
          </Path>
          <Path path={keyBody} style="stroke" strokeWidth={1.5} color="#1a0e05" />
          <Path path={keyCap}>
            <LinearGradient start={vec(0, KEY_TOP)} end={vec(0, KEY_TOP + 7)} colors={['#fbfbf8', '#e6e3dc', '#b9b6ad']} />
          </Path>
          <Path path={o.pivotPin} color="#e6e9ef" />
          <Path path={o.pivotPin} style="stroke" strokeWidth={1.2} color="#08080a" />
          <Group opacity={pickOn}>
            <Path path={o.out} style="stroke" strokeWidth={8} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={pushOn}>
            <Path path={o.push} style="stroke" strokeWidth={8} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ── the signal path ── */
const PBOX = { u0: 0, u1: 1000, v0: 0, v1: 600 };

/*
 * THE CLAVINET from the player's side, as a node of the signal path — REAL
 * DIMENSIONS (mm), code comment only: case ≈ 1000 W × 440 D × 140 H (lid
 * closed), wood covered in black vinyl, the lid a little proud of the case;
 * 60 keys F to E: 35 white keys (≈ 23 wide, 805 across) and 25 black, between
 * end blocks; at the bass end of the lid's front the pickup and filter
 * rocker switches (4) and the mute slider; the ¼ in output at the right end.
 * The view: the top foreshortened × 0.5 above the front face. Each other node
 * is the shared signal-chain drawing (chainIcons.tsx), each true to itself.
 */
function ClavIcon({ S }: { S: number }) {
  const W = 1000;
  const D = 440;
  const depth = D * 0.5;
  const front = 70;
  const k = Math.min(S / W, (0.62 * S) / (depth + front));
  const x0 = -W / 2;
  const y0 = -(depth + front) / 2;
  const whites = 35;
  const end = 60;
  const kw = (W - 2 * end - 75) / whites;
  const kx0 = x0 + end + 75; // the keys start right of the control panel
  const keyD = 150 * 0.5;
  const yKeys = y0 + depth - keyD;
  const hw = 0.6 / k;
  const caseP = make();
  caseP.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, y0, W, depth + front), 14, 14));
  const lid = make();
  lid.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 8, y0 + 4, W - 16, depth - keyD - 16), 10, 10));
  const lines = make();
  for (let i = 1; i < whites; i++) {
    lines.moveTo(kx0 + i * kw, yKeys);
    lines.lineTo(kx0 + i * kw, yKeys + keyD + front * 0.42);
  }
  const blacks = make();
  for (let i = 0; i < whites - 1; i++) {
    // the lowest key is an F (3 with C = 0); a black key follows C, D, F, G and A
    const n = (i + 3) % 7;
    if (![0, 1, 3, 4, 5].includes(n)) continue;
    blacks.addRRect(Skia.RRectXY(Skia.XYWHRect(kx0 + (i + 1) * kw - kw * 0.3, yKeys, kw * 0.6, keyD * 0.62), 0.6, 0.6));
  }
  const rockers = make();
  for (let i = 0; i < 4; i++) rockers.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 24 + i * 26, yKeys + 6, 18, 30), 3, 3));
  const slider = make();
  slider.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 24, yKeys + 46, 100, 8), 3, 3));
  return (
    <Group transform={[{ scale: k }]}>
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 10, y0 + depth + front - 14, W - 20, 24), 12, 12)); return p; })()} color="#000" opacity={0.5}>
        <BlurMask blur={2.5 / k} style="normal" />
      </Path>
      <Path path={caseP}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + W, y0 + depth + front)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
      </Path>
      <Path path={caseP} style="stroke" strokeWidth={hw} color="#08080a" />
      <Path path={lid}>
        <LinearGradient start={vec(0, y0)} end={vec(0, yKeys)} colors={['#5a3a20', '#3e2814', '#24160b']} />
      </Path>
      <Path path={lid} style="stroke" strokeWidth={hw * 0.8} color="#8a6a48" opacity={0.6} />
      {/* the control panel at the bass end: four rocker switches and the mute slider */}
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + end - 46, yKeys, 156, keyD + front * 0.42), 4, 4)); return p; })()} color="#16171b" />
      <Path path={rockers}>
        <LinearGradient start={vec(0, yKeys + 6)} end={vec(0, yKeys + 36)} colors={['#f2f4f8', '#a6acb7', '#4a4e57']} />
      </Path>
      <Path path={slider} color="#050506" />
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0 + 60, yKeys + 42, 16, 16), 2, 2)); return p; })()} color="#c9ced7" />
      {/* the keys */}
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(kx0, yKeys, whites * kw, keyD + front * 0.42), 2, 2)); return p; })()}>
        <LinearGradient start={vec(0, yKeys)} end={vec(0, yKeys + keyD + front * 0.42)} colors={['#fbfbf8', '#e6e3dc', '#b9b6ad']} />
      </Path>
      <Path path={lines} style="stroke" strokeWidth={0.28 / k} color="#7d796f" />
      <Path path={blacks} color="#0d0d10" />
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, y0 + depth + front * 0.42, W, front * 0.58), 8, 8)); return p; })()}>
        <LinearGradient start={vec(0, y0 + depth)} end={vec(0, y0 + depth + front)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
      </Path>
      {/* the output jack in the treble end */}
      <Path path={(() => { const p = make(); p.addCircle(x0 + W - 4, y0 + depth + front * 0.7, 14); return p; })()} color="#c9ced7" />
      <Path path={(() => { const p = make(); p.addCircle(x0 + W - 4, y0 + depth + front * 0.7, 7); return p; })()} color="#050506" />
    </Group>
  );
}

/** Where each node sits on the path (PBOX units) and its box side S. */
const NODE = {
  clav: { u: 150, v: 128, S: 250 },
  pedals: { u: 400, v: 128, S: 110 },
  amp: { u: 630, v: 122, S: 170 },
  mic: { u: 872, v: 128, S: 120 },
  desk: { u: 830, v: 470, S: 210 },
  diPre: { u: 325, v: 332, S: 100 },
  diPost: { u: 505, v: 332, S: 100 },
} as const;

let pathCache: Built | null = null;
function pathPaths(): Built {
  if (pathCache) return pathCache;
  const o: Built = {};
  // Cables and air.
  o.c1 = make();
  o.c1.moveTo(276, 159);
  o.c1.cubicTo(306, 162, 318, 140, 346, 132);
  o.c2 = make();
  o.c2.moveTo(456, 132);
  o.c2.lineTo(546, 132);
  o.air = make();
  for (const r of [40, 70, 100]) o.air.addArc(Skia.XYWHRect(690 - r, 122 - r, 2 * r, 2 * r), -28, 56);
  o.micOut = make();
  o.micOut.moveTo(930, 150);
  o.micOut.cubicTo(960, 200, 960, 330, 935, 404);
  o.tapPre = make();
  o.tapPre.moveTo(318, 145);
  o.tapPre.lineTo(318, 290);
  o.tapPost = make();
  o.tapPost.moveTo(500, 132);
  o.tapPost.lineTo(500, 290);
  o.diPreOut = make();
  o.diPreOut.moveTo(372, 340);
  o.diPreOut.cubicTo(520, 340, 560, 470, 726, 470);
  o.diPostOut = make();
  o.diPostOut.moveTo(552, 340);
  o.diPostOut.cubicTo(620, 340, 640, 460, 726, 460);
  pathCache = o;
  return o;
}

/** A shared chain icon placed at a node, drawn in screen pixels (so its hairlines hold). */
function At({ xf, n, dim = 1, children }: { xf: { ox: number; oy: number; s: number }; n: { u: number; v: number }; dim?: number; children: ReactNode }) {
  return (
    <Group opacity={dim} transform={[{ translateX: xf.ox + n.u * xf.s }, { translateY: xf.oy + n.v * xf.s }]}>
      {children}
    </Group>
  );
}

export function ClavinetPath({ w, h, option, accessibilityLabel }: { w: number; h: number; variant: VariantId; option: string; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const o = pathPaths();
  const xf = useMemo(() => fitXform('side', PBOX, w, h, 6), [w, h]);
  const mic = option === 'mic' || option === 'both';
  const pre = option === 'pre';
  const di = option !== 'mic';
  const c1 = AMBER;
  // Before the pedals, the DI takes the signal and the pedals and amp are not captured.
  const c2 = pre ? DIMC : AMBER;
  const ampLit = mic;
  const labels: StaticLabel[] = [
    { id: 'clav', text: 'CLAVINET', u: 155, v: 52, align: 'center', tone: 'amber' },
    { id: 'pedals', text: 'PEDALS', u: 400, v: 200, align: 'center', tone: pre ? 'muted' : 'amber' },
    { id: 'amp', text: 'AMP · SPEAKER', short: 'AMP', u: 635, v: 22, align: 'center', tone: ampLit ? 'amber' : 'muted' },
    { id: 'mic', text: 'MIC', u: 870, v: 92, align: 'center', tone: mic ? 'blue' : 'muted' },
    { id: 'console', text: 'CONSOLE · INTERFACE', short: 'CONSOLE', u: 830, v: 572, align: 'center' },
    { id: 'warn', text: 'CLAVINET OUTPUT → DI OR LINE INPUT · NO MIC INPUT, NO PHANTOM', short: 'OUTPUT → DI · NO PHANTOM', u: 20, v: 590, align: 'left', tone: 'amber' },
  ];
  if (di) labels.push({ id: 'di', text: pre ? 'DI · BEFORE THE PEDALS' : 'DI · AFTER THE PEDALS', short: pre ? 'DI · PRE' : 'DI · POST', u: pre ? 325 : 505, v: 395, align: 'center', tone: 'blue' });
  if (mic) labels.push({ id: 'air', text: 'IN THE AIR', u: 760, v: 230, align: 'center', tone: 'blue' });
  if (option === 'both') labels.push({ id: 'mono', text: 'ALIGN THE TWO IN MONO', short: 'MONO CHECK', u: 20, v: 470, align: 'left', tone: 'blue' });
  const s = xf.s;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        {/* the cables and the air, in the path's own units */}
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: s }]}>
          <Path path={o.c1} style="stroke" strokeWidth={8} strokeCap="round" color={c1} />
          <Path path={o.c2} style="stroke" strokeWidth={8} strokeCap="round" color={c2} />
          {mic ? (
            <Path path={o.air} style="stroke" strokeWidth={7} color={AIR}>
              <DashPathEffect intervals={[18, 12]} />
            </Path>
          ) : null}
          <Path path={o.micOut} style="stroke" strokeWidth={8} strokeCap="round" color={mic ? BLUE : DIMC} opacity={mic ? 1 : 0.5} />
          {di ? (
            <>
              <Path path={pre ? o.tapPre : o.tapPost} style="stroke" strokeWidth={8} strokeCap="round" color={BLUE} />
              <Path path={pre ? o.diPreOut : o.diPostOut} style="stroke" strokeWidth={8} strokeCap="round" color={BLUE} />
            </>
          ) : null}
        </Group>
        {/* the real objects, each drawn true to itself (screen pixels) */}
        <At xf={xf} n={NODE.clav}>
          <ClavIcon S={NODE.clav.S * s} />
        </At>
        <At xf={xf} n={NODE.pedals} dim={pre ? 0.45 : 1}>
          <ChainIcon art="pedals" S={NODE.pedals.S * s} />
        </At>
        <At xf={xf} n={NODE.amp} dim={ampLit ? 1 : 0.4}>
          <ChainIcon art="combo" S={NODE.amp.S * s} />
        </At>
        <At xf={xf} n={NODE.mic} dim={mic ? 1 : 0.35}>
          <ChainIcon art="mic" S={NODE.mic.S * s} />
        </At>
        {di ? (
          <At xf={xf} n={pre ? NODE.diPre : NODE.diPost}>
            <ChainIcon art="di" S={NODE.diPre.S * s} />
          </At>
        ) : null}
        <At xf={xf} n={NODE.desk}>
          <ChainIcon art="desk" S={NODE.desk.S * s} />
        </At>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
