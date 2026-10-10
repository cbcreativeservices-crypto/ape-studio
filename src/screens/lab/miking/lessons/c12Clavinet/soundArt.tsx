/**
 * C12 CLAVINET — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2).
 *
 * KEY TO SIGNAL (one key, one string, cut open; HOH-D6 p.5 — corrected from
 * the old lesson's "a hammer presses a string against a pickup-facing
 * surface", CORRECTIONS_LOG C12-01): ① the key goes down and the tangent
 * (a small plunger) rises; ② it presses the string onto the ANVIL; ③ the
 * string rings between the anvil and the bridge; ④ the PICKUPS at that end
 * turn its motion into a small voltage, out to the amp; ⑤ the key comes up,
 * the tangent drops, and the yarn-wound part of the string mutes it.
 *
 * SIGNAL PATH ("Where it leaves"): the clavinet makes almost no sound in
 * the air — its sound leaves as a SIGNAL. The chain drawn as real objects:
 * clavinet → pedals → amp → speaker → mic → console, and a direct (DI) tap
 * before or after the pedals.
 *
 * HONESTY: one string drawn straight and NOT to scale; motion drawn many
 * times larger; the pickups drawn as two bars (the leaflet: "Magnetic
 * pick-ups are situated at the other end of the string"). One value,
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
const PIN = 60;
const ANVIL = 280;
const BRIDGE = 940;
const SY = 200; // the string at rest
const TRAVEL = 36;
const LIFT = 24; // the string pressed up onto the anvil (drawn larger)
const PIVOT = 170;
const KEY_Y = 330;
const SWING = 26;
const BOX = { u0: 0, u1: 1010, v0: 40, v1: 430 };

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};
/** The tangent's travel (0 at rest … 1 pressed onto the anvil). */
const tangentT = (r: number) => {
  'worklet';
  return r < 2 ? clamp01(r - 1) : r < 4.5 ? 1 : clamp01(1 - (r - 4.5) * 2.5);
};
const swingS = (r: number) => {
  'worklet';
  return r < 2.5 ? 0 : r < 4.5 ? clamp01((r - 2.5) * 3) : clamp01(1 - (r - 4.5) * 4);
};

function stringPath(r: number, sign: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const t = tangentT(r);
  const top = SY + 12 - (TRAVEL * t);
  const yc = Math.min(SY, top);
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
function keyPath(r: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const t = tangentT(r);
  const d = TRAVEL * t;
  // A seesaw about the pivot: the front goes down, the tangent's end goes up.
  p.moveTo(PIN - 20, KEY_Y + d * ((PIVOT - PIN + 20) / (ANVIL - PIVOT)));
  p.lineTo(ANVIL + 30, KEY_Y - d * ((ANVIL + 30 - PIVOT) / (ANVIL - PIVOT)));
  // The tangent: a post from the key up toward the string.
  p.moveTo(ANVIL, KEY_Y - d);
  p.lineTo(ANVIL, SY + 12 - d);
  return p;
}

/** The tangent's rubber tip, riding on top of the tangent post. */
function tipPath(r: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const d = TRAVEL * tangentT(r);
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(ANVIL - 10, SY + 12 - d, 20, 9), 3, 3));
  return p;
}

/*
 * One key and its string, cut open — what the parts are, drawn as the real
 * parts (not to scale along the string; the sounding length of a real one
 * runs ≈ 120–700 mm across the 60 notes): the tuning pin in its wooden pin
 * block; the band of yarn woven round the string's short end; the steel
 * anvil rail with its hardened edge just above the string; the key on its
 * balance rail with the tangent post and its rubber tip (Ø ≈ 8) at the back;
 * the two pickups (≈ 60 × 50 in section: a steel pole blade on a wound coil,
 * in a moulded housing) under the far end of the string, on their rail; the
 * bridge and the hitch pin; the output jack in the case's end. The case:
 * wooden walls, a lid on top, the keybed below.
 */
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
  o.case = rr(20, 100, 970, 292, 16);
  o.inside = rr(34, 114, 942, 262, 8);
  o.pinBlock = rr(30, 166, 64, 72, 6);
  o.pin = rr(54, 150, 12, 64, 3);
  o.pinTop = rr(52, 144, 16, 11, 2);
  o.pinWind = make();
  for (const y of [194, 199, 204]) o.pinWind.addOval(Skia.XYWHRect(PIN - 8, y - 2, 16, 4));
  o.yarnBand = rr(104, SY - 11, 152, 22, 6);
  o.yarn = make();
  for (let x = 106; x < ANVIL - 32; x += 11) o.yarn.addOval(Skia.XYWHRect(x, SY - 10, 9, 20));
  o.anvilBar = rr(ANVIL - 70, SY - LIFT - 62, 140, 16, 3);
  o.anvil = make();
  o.anvil.moveTo(ANVIL - 14, SY - LIFT - 46);
  o.anvil.lineTo(ANVIL + 14, SY - LIFT - 46);
  o.anvil.lineTo(ANVIL + 4, SY - LIFT);
  o.anvil.lineTo(ANVIL - 4, SY - LIFT);
  o.anvil.close();
  // the bridge (wood, a brass saddle) and the string's tail to its hitch pin
  o.bridge = rr(BRIDGE - 20, SY + 6, 40, 56, 4);
  o.saddle = make();
  o.saddle.moveTo(BRIDGE - 10, SY + 7);
  o.saddle.lineTo(BRIDGE, SY);
  o.saddle.lineTo(BRIDGE + 10, SY + 7);
  o.saddle.close();
  o.tail = make();
  o.tail.moveTo(BRIDGE, SY);
  o.tail.lineTo(962, SY + 10);
  o.hitch = make();
  o.hitch.addCircle(962, SY + 12, 5);
  // the two pickups under the far end, on their rail
  o.puRail = rr(728, SY + 72, 164, 14, 3);
  o.pickups = make();
  o.poles = make();
  o.coils = make();
  for (const x of [770, 850]) {
    o.pickups.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 30, SY + 22, 60, 50), 7, 7));
    o.poles.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 26, SY + 22, 52, 6), 2, 2));
    o.coils.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 21, SY + 32, 42, 30), 3, 3));
  }
  o.winding = make();
  for (const x of [770, 850])
    for (let i = 1; i < 8; i++) {
      o.winding.moveTo(x - 21 + (42 * i) / 8, SY + 33);
      o.winding.lineTo(x - 21 + (42 * i) / 8 + 1, SY + 61);
    }
  // the balance rail under the key
  o.pivot = rr(PIVOT - 16, KEY_Y + 9, 32, 30, 3);
  o.felt = rr(PIVOT - 9, KEY_Y + 6, 18, 4, 1);
  o.cable = make();
  o.cable.moveTo(850, SY + 72);
  o.cable.cubicTo(860, 330, 940, 330, 970, 330);
  o.jack = make();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    if (i === 0) o.jack.moveTo(976 + 9 * Math.cos(a), 330 + 9 * Math.sin(a));
    else o.jack.lineTo(976 + 9 * Math.cos(a), 330 + 9 * Math.sin(a));
  }
  o.jack.close();
  o.push = make();
  o.push.moveTo(PIN - 10, KEY_Y - 70);
  o.push.lineTo(PIN - 10, KEY_Y - 22);
  o.push.moveTo(PIN - 26, KEY_Y - 44);
  o.push.lineTo(PIN - 10, KEY_Y - 22);
  o.push.lineTo(PIN + 6, KEY_Y - 44);
  o.out = make();
  o.out.moveTo(880, 330);
  o.out.lineTo(985, 330);
  o.out.moveTo(960, 314);
  o.out.lineTo(985, 330);
  o.out.lineTo(960, 346);
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
  const key = useDerivedValue(() => keyPath(reveal.value));
  const tip = useDerivedValue(() => tipPath(reveal.value));
  const pushOn = useDerivedValue(() => (reveal.value < 2.2 ? 1 : 0.25));
  const pickOn = useDerivedValue(() => (reveal.value >= 3.6 && reveal.value < 4.8 ? 1 : 0));
  const muteOn = useDerivedValue(() => clamp01((reveal.value - 4.5) * 2));
  const labels: StaticLabel[] = [];
  const at = { u: BOX.u0 + 30, v: BOX.v0 + 10 };
  if (shown === 1) labels.push({ id: 'e1', text: '① KEY DOWN · THE TANGENT RISES', short: '① TANGENT RISES', ...at, align: 'left', tone: 'amber' });
  if (shown === 2) labels.push({ id: 'e2', text: '② IT PRESSES THE STRING ONTO THE ANVIL', short: '② ONTO THE ANVIL', ...at, align: 'left', tone: 'amber' });
  if (shown === 3) labels.push({ id: 'e3', text: '③ THE STRING RINGS, ANVIL TO BRIDGE', short: '③ IT RINGS', ...at, align: 'left', tone: 'blue' });
  if (shown === 4) labels.push({ id: 'e4', text: '④ THE PICKUPS MAKE A SMALL VOLTAGE', short: '④ A SIGNAL', ...at, align: 'left', tone: 'blue' });
  if (shown === 5) labels.push({ id: 'e5', text: '⑤ KEY UP · THE YARN MUTES IT', short: '⑤ MUTED', ...at, align: 'left', tone: 'amber' });
  labels.push(
    { id: 'anvil', text: 'ANVIL', u: ANVIL + 84, v: SY - LIFT - 52, align: 'left' },
    { id: 'yarn', text: 'YARN', u: 180, v: SY + 40, align: 'center', tone: 'muted' },
    { id: 'tangent', text: 'TANGENT', u: ANVIL + 30, v: 285, align: 'left', tone: 'muted' },
    { id: 'key', text: 'KEY', u: PIN + 20, v: KEY_Y + 50, align: 'center', tone: 'muted' },
    { id: 'pick', text: 'PICKUPS', u: 810, v: SY + 100, align: 'center' },
    { id: 'bridge', text: 'BRIDGE', u: BRIDGE, v: SY - 50, align: 'center', tone: 'muted' },
    { id: 'out', text: 'TO THE AMP', u: 990, v: 375, align: 'right', tone: 'amber' },
    { id: 'big', text: 'NOT TO SCALE · MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: 600, v: BOX.v1 - 20, align: 'center', tone: 'illustrative' },
  );
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* the case cut open: wooden walls, the lid above, the keybed below; the dim inside */}
          <Path path={o.case}>
            <LinearGradient start={vec(20, 100)} end={vec(990, 392)} colors={['#5a3a20', '#3e2814', '#24160b']} />
          </Path>
          <Path path={o.inside}>
            <LinearGradient start={vec(0, 114)} end={vec(0, 376)} colors={['#1d1714', '#15110e', '#0c0a08']} />
          </Path>
          <Path path={o.case} style="stroke" strokeWidth={2} color="#08080a" />
          {/* the pin block and the tuning pin, the string wound round it */}
          <Path path={o.pinBlock}>
            <LinearGradient start={vec(30, 166)} end={vec(94, 238)} colors={WOOD} />
          </Path>
          <Path path={o.pin}>
            <LinearGradient start={vec(54, 0)} end={vec(66, 0)} colors={STEEL} />
          </Path>
          <Path path={o.pinTop}>
            <LinearGradient start={vec(52, 0)} end={vec(68, 0)} colors={STEEL} />
          </Path>
          <Path path={o.pinWind} style="stroke" strokeWidth={1.6} color="#c9ccd3" />
          {/* the anvil rail and its edge */}
          <Path path={o.anvilBar}>
            <LinearGradient start={vec(0, SY - LIFT - 62)} end={vec(0, SY - LIFT - 46)} colors={STEEL} />
          </Path>
          <Path path={o.anvil}>
            <LinearGradient start={vec(ANVIL - 14, 0)} end={vec(ANVIL + 14, 0)} colors={['#d9dde3', '#8d939d', '#565b63']} />
          </Path>
          <Path path={o.anvil} style="stroke" strokeWidth={1.2} color="#08080a" opacity={0.6} />
          {/* the pickups on their rail */}
          <Path path={o.puRail}>
            <LinearGradient start={vec(0, SY + 72)} end={vec(0, SY + 86)} colors={WOOD} />
          </Path>
          <Path path={o.pickups}>
            <LinearGradient start={vec(740, SY + 22)} end={vec(880, SY + 72)} colors={['#3d4048', '#1d1e22', '#0b0b0d']} />
          </Path>
          <Path path={o.coils}>
            <LinearGradient start={vec(0, SY + 32)} end={vec(0, SY + 62)} colors={['#c27a3a', '#8a4a1a', '#4a2408']} />
          </Path>
          <Path path={o.winding} style="stroke" strokeWidth={0.8} color="#3a1a06" opacity={0.7} />
          <Path path={o.poles}>
            <LinearGradient start={vec(0, SY + 22)} end={vec(0, SY + 28)} colors={STEEL} />
          </Path>
          <Path path={o.cable} style="stroke" strokeWidth={6} color="#2a2b30" />
          <Path path={o.jack}>
            <LinearGradient start={vec(968, 322)} end={vec(984, 338)} colors={STEEL} />
          </Path>
          <Group opacity={pickOn}>
            <Path path={o.pickups} style="stroke" strokeWidth={6} color={BLUE} />
            <Path path={o.cable} style="stroke" strokeWidth={8} color={AMBER} />
            <Path path={o.out} style="stroke" strokeWidth={8} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          {/* the bridge, its saddle, the hitch pin */}
          <Path path={o.bridge}>
            <LinearGradient start={vec(BRIDGE - 20, 0)} end={vec(BRIDGE + 20, 0)} colors={WOOD} />
          </Path>
          <Path path={o.saddle} color="#c7a466" />
          <Path path={o.tail} style="stroke" strokeWidth={3} color="#9aa0ab" />
          <Path path={o.hitch} color="#c9ccd3" />
          {/* the balance rail and the key with its tangent post and rubber tip */}
          <Path path={o.pivot}>
            <LinearGradient start={vec(PIVOT - 16, 0)} end={vec(PIVOT + 16, 0)} colors={WOOD} />
          </Path>
          <Path path={o.felt} color="#8e2f28" />
          <Path path={key} style="stroke" strokeWidth={15} strokeCap="butt" color="#2b170a" />
          <Path path={key} style="stroke" strokeWidth={11} strokeCap="butt" color="#e8e2d0" />
          <Path path={tip} color="#3a3b41" />
          <Path path={tip} style="stroke" strokeWidth={2} color="#08080a" />
          {/* the string (steel): its other extreme drawn as a ghost; blue while it rings */}
          <Group opacity={sBOn}>
            <Path path={sB} style="stroke" strokeWidth={3} color={BLUE}>
              <DashPathEffect intervals={[10, 8]} />
            </Path>
          </Group>
          <Path path={sA} style="stroke" strokeWidth={4.5} color="#c9ccd3" />
          <Group opacity={ringOn}>
            <Path path={sA} style="stroke" strokeWidth={4.5} color={BLUE} />
          </Group>
          {/* the yarn woven round the string's short end */}
          <Path path={o.yarnBand} color="#6a1f19" opacity={0.55} />
          <Path path={o.yarn} style="stroke" strokeWidth={3.4} color="#b8483c" />
          <Group opacity={muteOn}>
            <Path path={o.yarn} style="stroke" strokeWidth={6} color={AMBER} />
          </Group>
          <Path path={o.pinWind} style="stroke" strokeWidth={1.6} color="#e6e9ef" />
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
