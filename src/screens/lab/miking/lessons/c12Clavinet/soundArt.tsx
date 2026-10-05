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
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';

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

type Built = Record<string, SkPath>;
let seqCache: Built | null = null;
function seqPaths(): Built {
  if (seqCache) return seqCache;
  const o: Built = {};
  o.case = make();
  o.case.addRRect(Skia.RRectXY(Skia.XYWHRect(20, 120, 970, 270), 18, 18));
  o.yarn = make();
  for (let x = 100; x < ANVIL - 20; x += 14) {
    o.yarn.moveTo(x, SY - 12);
    o.yarn.lineTo(x + 10, SY + 12);
  }
  o.anvil = make();
  o.anvil.addRect(Skia.XYWHRect(ANVIL - 14, SY - LIFT - 46, 28, 46));
  o.anvilBar = make();
  o.anvilBar.addRect(Skia.XYWHRect(ANVIL - 70, SY - LIFT - 62, 140, 16));
  o.pin = make();
  o.pin.addCircle(PIN, SY, 14);
  o.bridge = make();
  o.bridge.moveTo(BRIDGE - 18, SY + 30);
  o.bridge.lineTo(BRIDGE, SY);
  o.bridge.lineTo(BRIDGE + 18, SY + 30);
  o.bridge.close();
  o.pickups = make();
  for (const x of [770, 850]) o.pickups.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 26, SY + 22, 52, 46), 8, 8));
  o.pivot = make();
  o.pivot.moveTo(PIVOT - 18, KEY_Y + 26);
  o.pivot.lineTo(PIVOT, KEY_Y + 4);
  o.pivot.lineTo(PIVOT + 18, KEY_Y + 26);
  o.pivot.close();
  o.cable = make();
  o.cable.moveTo(850, SY + 68);
  o.cable.cubicTo(860, 330, 940, 330, 985, 330);
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

export function ClavinetSequence({ w, h, reveal, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const o = seqPaths();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const sA = useDerivedValue(() => stringPath(reveal.value, 1));
  const sB = useDerivedValue(() => stringPath(reveal.value, -1));
  const sBOn = useDerivedValue(() => (swingS(reveal.value) > 0.02 ? 0.5 : 0));
  const key = useDerivedValue(() => keyPath(reveal.value));
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
          <Path path={o.case}>
            <LinearGradient start={vec(20, 120)} end={vec(990, 390)} colors={['#2b2622', '#1f1b18', '#151210']} />
          </Path>
          <Path path={o.anvilBar} color="#8d939d" />
          <Path path={o.anvil}>
            <LinearGradient start={vec(ANVIL - 14, 0)} end={vec(ANVIL + 14, 0)} colors={['#d9dde3', '#8d939d', '#565b63']} />
          </Path>
          <Path path={o.pickups}>
            <LinearGradient start={vec(740, SY + 22)} end={vec(880, SY + 68)} colors={['#3d4048', '#23252b']} />
          </Path>
          <Group opacity={pickOn}>
            <Path path={o.pickups} style="stroke" strokeWidth={8} color={BLUE} />
            <Path path={o.cable} style="stroke" strokeWidth={8} color={AMBER} />
            <Path path={o.out} style="stroke" strokeWidth={8} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Path path={o.pin} color="#b9bec6" />
          <Path path={o.bridge} color="#c7a466" />
          <Path path={o.pivot} color="#6a6e77" />
          <Path path={key} style="stroke" strokeWidth={12} strokeCap="round" color="#e8e2d0" />
          <Group opacity={sBOn}>
            <Path path={sB} style="stroke" strokeWidth={5} color={BLUE} />
          </Group>
          <Path path={sA} style="stroke" strokeWidth={7} color={BLUE} />
          <Path path={o.yarn} style="stroke" strokeWidth={6} color="#a3443a" />
          <Group opacity={muteOn}>
            <Path path={o.yarn} style="stroke" strokeWidth={10} color={AMBER} />
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
let pathCache: Built | null = null;
function pathPaths(): Built {
  if (pathCache) return pathCache;
  const o: Built = {};
  // The clavinet: a case with its keyboard along the front.
  o.clav = make();
  o.clav.addRRect(Skia.RRectXY(Skia.XYWHRect(30, 80, 250, 80), 12, 12));
  o.clavKeys = make();
  o.clavBlack = make();
  for (let i = 0; i < 14; i++) o.clavKeys.addRect(Skia.XYWHRect(42 + i * 16.5, 120, 15, 32));
  for (let i = 0; i < 13; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) o.clavBlack.addRect(Skia.XYWHRect(42 + (i + 0.7) * 16.5, 120, 10, 19));
  // A pedal: a stompbox with two knobs and a footswitch.
  o.pedal = make();
  o.pedal.addRRect(Skia.RRectXY(Skia.XYWHRect(350, 90, 100, 80), 10, 10));
  o.pedalKnobs = make();
  o.pedalKnobs.addCircle(377, 110, 9);
  o.pedalKnobs.addCircle(423, 110, 9);
  o.pedalKnobs.addCircle(400, 148, 12);
  // The amp: a combo with its grille and the speaker behind it.
  o.amp = make();
  o.amp.addRRect(Skia.RRectXY(Skia.XYWHRect(540, 40, 190, 170), 12, 12));
  o.ampCloth = make();
  o.ampCloth.addRect(Skia.XYWHRect(552, 78, 166, 120));
  o.ampSpk = make();
  o.ampSpk.addCircle(635, 138, 50);
  o.ampDust = make();
  o.ampDust.addCircle(635, 138, 15);
  o.ampPanel = make();
  o.ampPanel.addRect(Skia.XYWHRect(552, 50, 166, 20));
  // The mic: an instrument dynamic pointing back at the speaker.
  o.mic = make();
  o.mic.addRRect(Skia.RRectXY(Skia.XYWHRect(822, 120, 110, 30), 10, 10));
  o.micHead = make();
  o.micHead.addCircle(812, 135, 19);
  o.stand = make();
  o.stand.moveTo(930, 135);
  o.stand.lineTo(960, 135);
  o.stand.lineTo(960, 300);
  // The console: a strip of channels with faders.
  o.console = make();
  o.console.addRRect(Skia.RRectXY(Skia.XYWHRect(690, 400, 280, 140), 14, 14));
  o.faders = make();
  for (let i = 0; i < 6; i++) {
    o.faders.addRect(Skia.XYWHRect(718 + i * 42, 430, 6, 90));
    o.faders.addRRect(Skia.RRectXY(Skia.XYWHRect(708 + i * 42, 470 - (i % 3) * 14, 26, 16), 3, 3));
  }
  // The DI box (drawn at either tap).
  for (const [k, x] of [
    ['diPre', 270],
    ['diPost', 450],
  ] as const) {
    o[k] = make();
    o[k].addRRect(Skia.RRectXY(Skia.XYWHRect(x, 300, 110, 64), 10, 10));
    o[`${k}Jack`] = make();
    o[`${k}Jack`].addCircle(x + 26, 332, 9);
    o[`${k}Jack`].addCircle(x + 84, 332, 12);
  }
  // Cables and air.
  o.c1 = make();
  o.c1.moveTo(280, 120);
  o.c1.lineTo(350, 128);
  o.c2 = make();
  o.c2.moveTo(450, 128);
  o.c2.lineTo(540, 128);
  o.air = make();
  for (const r of [40, 75, 110]) o.air.addArc(Skia.XYWHRect(680 - r, 138 - r, 2 * r, 2 * r), -28, 56);
  o.micOut = make();
  o.micOut.moveTo(960, 300);
  o.micOut.lineTo(960, 400);
  o.tapPre = make();
  o.tapPre.moveTo(315, 124);
  o.tapPre.lineTo(325, 300);
  o.tapPost = make();
  o.tapPost.moveTo(495, 128);
  o.tapPost.lineTo(505, 300);
  o.diPreOut = make();
  o.diPreOut.moveTo(380, 340);
  o.diPreOut.cubicTo(520, 340, 560, 470, 690, 470);
  o.diPostOut = make();
  o.diPostOut.moveTo(560, 340);
  o.diPostOut.cubicTo(620, 340, 630, 460, 690, 460);
  pathCache = o;
  return o;
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
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={o.c1} style="stroke" strokeWidth={9} strokeCap="round" color={c1} />
          <Path path={o.c2} style="stroke" strokeWidth={9} strokeCap="round" color={c2} />
          <Path path={o.clav}>
            <LinearGradient start={vec(30, 80)} end={vec(280, 160)} colors={['#5a4c40', '#3a3029', '#241e1a']} />
          </Path>
          <Path path={o.clavKeys} color="#ece8de" />
          <Path path={o.clavBlack} color="#1a1a1c" />
          <Group opacity={pre ? 0.45 : 1}>
            <Path path={o.pedal}>
              <LinearGradient start={vec(350, 90)} end={vec(450, 170)} colors={['#e0594a', '#a3352a']} />
            </Path>
            <Path path={o.pedalKnobs} color="#e8e2d0" />
          </Group>
          <Group opacity={ampLit ? 1 : 0.4}>
            <Path path={o.amp}>
              <LinearGradient start={vec(540, 40)} end={vec(730, 210)} colors={['#3a3b42', '#24252b', '#141519']} />
            </Path>
            <Path path={o.ampCloth} color="#9a865f" />
            <Path path={o.ampSpk} color="#3a342e" opacity={0.75} />
            <Path path={o.ampDust} color="#26221f" />
            <Path path={o.ampPanel} color="#d7d9dd" />
          </Group>
          {mic ? (
            <Path path={o.air} style="stroke" strokeWidth={7} color={AIR}>
              <DashPathEffect intervals={[18, 12]} />
            </Path>
          ) : null}
          <Group opacity={mic ? 1 : 0.35}>
            <Path path={o.stand} style="stroke" strokeWidth={8} color="#6a6e77" />
            <Path path={o.mic}>
              <LinearGradient start={vec(822, 120)} end={vec(932, 150)} colors={['#4a4e57', '#2a2c32']} />
            </Path>
            <Path path={o.micHead}>
              <LinearGradient start={vec(793, 116)} end={vec(831, 154)} colors={['#c9ced6', '#7d838c']} />
            </Path>
            <Path path={o.micOut} style="stroke" strokeWidth={9} strokeCap="round" color={mic ? BLUE : DIMC} />
          </Group>
          {di ? (
            <Group>
              <Path path={pre ? o.tapPre : o.tapPost} style="stroke" strokeWidth={9} strokeCap="round" color={BLUE} />
              <Path path={pre ? o.diPre : o.diPost}>
                <LinearGradient start={vec(pre ? 270 : 450, 300)} end={vec(pre ? 380 : 560, 364)} colors={['#8d939d', '#565b63']} />
              </Path>
              <Path path={pre ? o.diPreJack : o.diPostJack} color="#1d1e22" />
              <Path path={pre ? o.diPreOut : o.diPostOut} style="stroke" strokeWidth={9} strokeCap="round" color={BLUE} />
            </Group>
          ) : null}
          <Path path={o.console}>
            <LinearGradient start={vec(690, 400)} end={vec(970, 540)} colors={['#3d4048', '#23252b']} />
          </Path>
          <Path path={o.faders} color="#9aa0ab" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
