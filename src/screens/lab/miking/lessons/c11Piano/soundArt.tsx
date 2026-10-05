/**
 * C11 PIANO — HOW IT SOUNDS, drawn (LESSON_JOURNEY §6 stage 2, §7 strings).
 * A close cutaway of ONE note's action (the shared piano family's anchors),
 * under an EXPLANATORY OVERLAY, in millimetres (frame K): the grand's action
 * from the curved side, or the upright's, cut at the keyboard's middle.
 *
 *   ① the key goes down: the action throws the hammer, the damper lifts;
 *   ② the hammer strikes the strings and at once falls back (the attack);
 *   ③ the strings vibrate; through the bridge they drive the soundboard;
 *   ④ the soundboard moves the air — the sound leaves (direction only);
 *   ⑤ the key comes up: the damper falls back and the note stops.
 *
 * Every moving part follows ONE value, `reveal` (1 … 5, stepped, or played
 * ONCE by the page — no loop, D8): the key turns about its balance point,
 * the hammer shank about its flange, the damper slides, the string bows in
 * its lowest shape between the agraffe and the bridge (drawn as the two
 * extremes it swings between), the soundboard bows below.
 *
 * HONESTY (simplifications register): every motion is drawn MANY times
 * larger than it is; the action is simplified (no wippen, jack or repetition
 * spring is named); the string is the ideal one; arrows show the ORDER of
 * events and their direction, never a speed, a pressure or a level. The
 * lowest shape only — the next page shows the others.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { VariantId } from '../../engine/model/types.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { KEY_TOP_Y } from '../shared/piano/pianoSpec.ts';
import { PIANO_PALETTE } from '../shared/piano/PianoArt';
import { GB, SETUP, UP, type PianoVariant } from './model.ts';

const P = PIANO_PALETTE;
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';
type SkPath = ReturnType<typeof Skia.Path.Make>;

/** The grand's note drawn: A4 (key 49) — its strings run from the agraffe to the long bridge. */
const A4 = GB.strings[48];
const G = {
  agraffe: A4.a[0],
  bridge: A4.b[0],
  keyFront: GB.xKey,
  keyBack: -120,
  balance: -300,
  flange: { x: -150, y: 78 },
  headRest: { x: 0, y: 55 },
  board: 90,
};
/** Exaggerations (mm): the string's swing, the board's bow, the key's dip. */
const STRING_AMP = 26;
const BOARD_AMP = 14;
const KEY_DIP_DEG = 2.4;
const HAMMER_LIFT_DEG = 11.4;
const DAMPER_LIFT = 26;

export const GRAND_SOUND_BOX = { u0: -560, u1: G.bridge + 120, v0: -300, v1: 230 };
export const UPRIGHT_SOUND_BOX = { u0: -620, u1: 330, v0: -540, v1: 250 };

const clamp01 = (x: number) => {
  'worklet';
  return Math.max(0, Math.min(1, x));
};
/** The timeline (reveal r in 1 … 5): key down, hammer, damper, string, board. */
function keyDown(r: number) {
  'worklet';
  return r < 4.5 ? 1 : 1 - clamp01((r - 4.5) * 2);
}
function hammerUp(r: number) {
  'worklet';
  if (r < 2) return 0.55 + 0.45 * clamp01(r - 1);
  if (r < 3) return 1 - 0.85 * clamp01((r - 2) * 1.6);
  if (r < 4.5) return 0.15;
  return 0.15 * (1 - clamp01((r - 4.5) * 2));
}
function stringAmp(r: number) {
  'worklet';
  if (r < 2) return 0;
  if (r < 4.5) return clamp01((r - 2) * 3);
  return 1 - clamp01((r - 4.5) * 2);
}
function boardAmp(r: number) {
  'worklet';
  if (r < 2.7) return 0;
  if (r < 4.5) return clamp01((r - 2.7) * 3);
  return 1 - clamp01((r - 4.5) * 2);
}

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head = 14) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}
function arcs(p: SkPath, cx: number, cy: number, radii: number[], a0: number, a1: number) {
  for (const r of radii) p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), a0, a1 - a0);
}
const rr = (x0: number, y0: number, x1: number, y1: number, r: number) => {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
};

/* ══════════════════════════════════ GRAND ═══════════════════════════════════ */

let grandBuilt: null | Record<string, SkPath> = null;
function grandStatic(): Record<string, SkPath> {
  if (grandBuilt) return grandBuilt;
  const o: Record<string, SkPath> = {};
  o.board = rr(-140, G.board, G.bridge + 140, G.board + 10, 2);
  o.ribs = Skia.Path.Make();
  for (let x = -60; x < G.bridge + 120; x += 120) o.ribs.addRRect(Skia.RRectXY(Skia.XYWHRect(x, G.board + 10, 28, 26), 6, 6));
  o.bridge = rr(G.bridge - 18, 4, G.bridge + 18, G.board, 4);
  o.bridgePin = rr(G.bridge - 4, -10, G.bridge + 4, 4, 2);
  o.plate = rr(-210, -6, G.agraffe + 30, 26, 6);
  o.capo = rr(-210, -36, G.agraffe + 14, -2, 8);
  o.agraffe = rr(G.agraffe - 10, -18, G.agraffe + 6, 10, 3);
  o.pinBlock = rr(-330, 2, -150, 140, 6);
  o.pins = Skia.Path.Make();
  for (let x = -320; x <= -190; x += 26) o.pins.addRRect(Skia.RRectXY(Skia.XYWHRect(x, -44, 9, 46), 2, 2));
  o.keybed = rr(G.keyFront + 20, 160, 40, 188, 3);
  o.balanceRail = rr(G.balance - 14, 132, G.balance + 14, 160, 3);
  o.rail = rr(-300, 100, -40, 116, 4);
  o.flangeRail = rr(-176, 64, -140, 92, 5);
  o.fallboard = rr(-360, -96, -330, KEY_TOP_Y - 2, 6);
  o.rest = Skia.Path.Make();
  o.rest.moveTo(G.agraffe, 0);
  o.rest.lineTo(G.bridge, 0);
  // Key (a lever about its balance point), drawn about the pivot.
  o.key = rr(G.keyFront - G.balance, KEY_TOP_Y - 132, G.keyBack - G.balance, KEY_TOP_Y + 24 - 132, 3);
  o.keyTop = rr(G.keyFront - G.balance, KEY_TOP_Y - 132, G.keyFront - G.balance + 150, KEY_TOP_Y + 6 - 132, 2);
  o.capstan = rr(-175 - G.balance, KEY_TOP_Y - 18 - 132, -160 - G.balance, KEY_TOP_Y - 132, 2);
  // Hammer (shank + felt head) drawn about its flange.
  const fx = G.flange.x;
  const fy = G.flange.y;
  o.shank = Skia.Path.Make();
  o.shank.moveTo(0, 0);
  o.shank.lineTo(G.headRest.x - fx, G.headRest.y - fy);
  o.head = Skia.Path.Make();
  const hx = G.headRest.x - fx;
  const hy = G.headRest.y - fy;
  o.head.moveTo(hx - 24, hy + 22);
  o.head.quadTo(hx - 26, hy - 18, hx, hy - 25);
  o.head.quadTo(hx + 26, hy - 18, hx + 24, hy + 22);
  o.head.close();
  o.molding = rr(hx - 12, hy + 14, hx + 12, hy + 34, 3);
  // Damper (block + felt), drawn at rest on the strings.
  o.damperBlock = rr(20, -100, 92, -40, 6);
  o.damperFelt = rr(26, -40, 86, -3, 5);
  o.damperWire = Skia.Path.Make();
  o.damperWire.moveTo(56, -40);
  o.damperWire.lineTo(56, 120);
  // Overlay arrows.
  o.press = Skia.Path.Make();
  arrow(o.press, G.keyFront + 70, KEY_TOP_Y - 110, G.keyFront + 70, KEY_TOP_Y - 22, 16);
  o.rise = Skia.Path.Make();
  arrow(o.rise, -40, 120, -40, 40, 14);
  o.lift = Skia.Path.Make();
  arrow(o.lift, 108, -60, 108, -130, 14);
  o.rebound = Skia.Path.Make();
  arrow(o.rebound, 34, 10, 34, 70, 14);
  o.strike = Skia.Path.Make();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    o.strike.moveTo(Math.cos(a) * 14, -8 + Math.sin(a) * 14);
    o.strike.lineTo(Math.cos(a) * 30, -8 + Math.sin(a) * 30);
  }
  o.toBridge = Skia.Path.Make();
  arrow(o.toBridge, (G.agraffe + G.bridge) / 2 + 60, -50, G.bridge - 30, -18, 14);
  o.toBoard = Skia.Path.Make();
  arrow(o.toBoard, G.bridge + 30, 30, G.bridge + 30, G.board - 6, 14);
  o.airUp = Skia.Path.Make();
  arcs(o.airUp, G.bridge - 60, G.board, [170, 230, 290], 228, 312);
  o.airDown = Skia.Path.Make();
  arcs(o.airDown, G.bridge - 60, G.board + 20, [70, 115], 50, 130);
  o.release = Skia.Path.Make();
  arrow(o.release, G.keyFront + 70, KEY_TOP_Y - 20, G.keyFront + 70, KEY_TOP_Y - 110, 16);
  o.damperDown = Skia.Path.Make();
  arrow(o.damperDown, 108, -150, 108, -60, 14);
  grandBuilt = o;
  return o;
}

/** The string's outline at `a` mm (its lowest shape between agraffe and bridge). */
function stringPath(a: number, x0: number, x1: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = x0 + (x1 - x0) * s;
    const y = -a * Math.sin(Math.PI * s);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
function boardPath(a: number, x0: number, x1: number, y: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const n = 32;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = x0 + (x1 - x0) * s;
    const yy = y - a * Math.sin(Math.PI * s);
    if (i === 0) p.moveTo(x, yy);
    else p.lineTo(x, yy);
  }
  return p;
}

export type StrikeSequenceProps = { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string };

export function PianoStrikeSequence(props: StrikeSequenceProps) {
  const s = SETUP[(props.variant as PianoVariant) in SETUP ? (props.variant as PianoVariant) : 'grand'];
  return s.kind === 'grand' ? <GrandSequence {...props} /> : <UprightSequence {...props} />;
}

function GrandSequence({ w, h, reveal, shown, accessibilityLabel }: StrikeSequenceProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', GRAND_SOUND_BOX, w, h, 6), [w, h]);
  const o = grandStatic();
  const DEG = Math.PI / 180;
  const keyXf = useDerivedValue(() => [{ translateX: G.balance }, { translateY: 132 }, { rotate: -KEY_DIP_DEG * DEG * keyDown(reveal.value) }]);
  const hamXf = useDerivedValue(() => [{ translateX: G.flange.x }, { translateY: G.flange.y }, { rotate: -HAMMER_LIFT_DEG * DEG * hammerUp(reveal.value) }]);
  const damXf = useDerivedValue(() => {
    const r = reveal.value;
    const lift = r < 4.5 ? 1 : 1 - clamp01((r - 4.5) * 2);
    return [{ translateY: -DAMPER_LIFT * lift }];
  });
  const sA = useDerivedValue(() => stringPath(STRING_AMP * stringAmp(reveal.value), G.agraffe, G.bridge));
  const sB = useDerivedValue(() => stringPath(-STRING_AMP * stringAmp(reveal.value), G.agraffe, G.bridge));
  const sOn = useDerivedValue(() => stringAmp(reveal.value));
  const bd = useDerivedValue(() => boardPath(BOARD_AMP * boardAmp(reveal.value), -120, G.bridge + 120, G.board));
  const bOn = useDerivedValue(() => boardAmp(reveal.value));
  const op = (i: number) => {
    'worklet';
    const on = clamp01(reveal.value - i);
    return on * (reveal.value >= i + 1.98 ? 0.35 : 1);
  };
  const o1 = useDerivedValue(() => (reveal.value < 4.5 ? op(0) : 0));
  const o2 = useDerivedValue(() => (reveal.value < 4.5 ? op(1) : 0));
  const o3 = useDerivedValue(() => (reveal.value < 4.5 ? op(2) : 0));
  const o4 = useDerivedValue(() => (reveal.value < 4.6 ? clamp01(reveal.value - 3) : 0.3));
  const o5 = useDerivedValue(() => clamp01((reveal.value - 4.5) * 2));

  const labels: StaticLabel[] = [
    { id: 'key', text: 'KEY', u: G.keyFront + 40, v: KEY_TOP_Y + 52, align: 'center', tone: 'muted' },
    { id: 'str', text: 'STRING', u: (G.agraffe + G.bridge) / 2, v: -48, align: 'center', tone: 'muted' },
    { id: 'brd', text: 'SOUNDBOARD', short: 'BOARD', u: G.bridge - 120, v: G.board + 58, align: 'center', tone: 'muted' },
    { id: 'hm', text: 'HAMMER', u: -60, v: 150, align: 'center', tone: 'muted' },
    { id: 'dm', text: 'DAMPER', u: 130, v: -135, align: 'left', tone: 'muted' },
  ];
  if (shown === 1) labels.push({ id: 'e1', text: '① KEY DOWN · DAMPER UP', short: '① KEY DOWN', u: G.keyFront + 20, v: -230, align: 'left', tone: 'amber' });
  if (shown === 2) labels.push({ id: 'e2', text: '② STRIKE · FALLS BACK', short: '② STRIKE', u: -200, v: -230, align: 'left', tone: 'amber' });
  if (shown === 3) labels.push({ id: 'e3', text: '③ STRING → BRIDGE → BOARD', short: '③ TO THE BOARD', u: -80, v: -230, align: 'left', tone: 'blue' });
  if (shown === 4) labels.push({ id: 'e4', text: '④ THE BOARD MOVES THE AIR', short: '④ AIR', u: -80, v: -230, align: 'left', tone: 'blue' });
  if (shown === 5) labels.push({ id: 'e5', text: '⑤ KEY UP · DAMPER DOWN', short: '⑤ KEY UP', u: G.keyFront + 20, v: -230, align: 'left', tone: 'amber' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: GRAND_SOUND_BOX.u1 - 10, v: GRAND_SOUND_BOX.v1 - 16, align: 'right', tone: 'illustrative' });

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* the fixed parts */}
          <Path path={o.ribs} color="#8a6a3a" />
          <Path path={o.board}>
            <LinearGradient start={vec(0, G.board)} end={vec(0, G.board + 10)} colors={[...P.SPRUCE]} />
          </Path>
          <Path path={o.bridge}>
            <LinearGradient start={vec(G.bridge - 18, 0)} end={vec(G.bridge + 18, 0)} colors={[...P.MAPLE]} />
          </Path>
          <Path path={o.plate}>
            <LinearGradient start={vec(0, -6)} end={vec(0, 26)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          <Path path={o.pinBlock}>
            <LinearGradient start={vec(-330, 0)} end={vec(-150, 140)} colors={['#a77e48', '#6d4a22']} />
          </Path>
          <Path path={o.capo}>
            <LinearGradient start={vec(0, -36)} end={vec(0, -2)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          <Path path={o.pins}>
            <LinearGradient start={vec(-320, 0)} end={vec(-190, 0)} colors={['#eef1f6', '#7a7f8a']} />
          </Path>
          <Path path={o.agraffe} color="#c9a24a" />
          <Path path={o.keybed} color="#3a2a18" />
          <Path path={o.balanceRail} color="#5a4020" />
          <Path path={o.rail} color="#52565f" />
          <Path path={o.fallboard}>
            <LinearGradient start={vec(-360, -96)} end={vec(-330, KEY_TOP_Y)} colors={['#4a4c55', '#141418']} />
          </Path>
          {/* the string: rest line, then its two extremes while it rings */}
          <Path path={o.rest} style="stroke" strokeWidth={2.5} color="#8a8f99" opacity={0.7}>
            <DashPathEffect intervals={[10, 8]} />
          </Path>
          <Group opacity={sOn}>
            <Path path={sB} style="stroke" strokeWidth={3} color={BLUE} opacity={0.45} />
            <Path path={sA} style="stroke" strokeWidth={4.5} color={BLUE} />
          </Group>
          <Path path={o.rest} style="stroke" strokeWidth={3} color={P.STEEL} opacity={0.9} />
          <Path path={o.bridgePin} color="#4b4f58" />
          {/* the soundboard's bow */}
          <Group opacity={bOn}>
            <Path path={bd} style="stroke" strokeWidth={5} color={BLUE} />
          </Group>
          {/* the key, about its balance point */}
          <Group transform={keyXf}>
            <Path path={o.key}>
              <LinearGradient start={vec(0, KEY_TOP_Y - 132)} end={vec(0, KEY_TOP_Y - 108)} colors={['#d8c79f', '#9c855a']} />
            </Path>
            <Path path={o.keyTop} color={P.IVORY[0]} />
            <Path path={o.capstan} color="#c9a24a" />
          </Group>
          {/* the hammer, about its flange */}
          <Path path={o.flangeRail} color="#52565f" />
          <Group transform={hamXf}>
            <Path path={o.shank} style="stroke" strokeWidth={8} strokeCap="round" color="#b89260" />
            <Path path={o.molding} color="#8a6a3a" />
            <Path path={o.head}>
              <LinearGradient start={vec(-150 - 24, -48)} end={vec(-150 + 24, 0)} colors={['#fbf6e8', P.FELT, '#b9ad92']} />
            </Path>
            <Path path={o.head} style="stroke" strokeWidth={2} color="#5a5040" opacity={0.7} />
          </Group>
          {/* the damper, lifted by the key */}
          <Group transform={damXf}>
            <Path path={o.damperWire} style="stroke" strokeWidth={3} color="#9aa0ab" />
            <Path path={o.damperBlock}>
              <LinearGradient start={vec(20, -100)} end={vec(92, -40)} colors={['#6a5844', '#3a2f24']} />
            </Path>
            <Path path={o.damperFelt} color={P.FELT_DARK} />
          </Group>
          {/* the overlay: order and direction, never speed or amount */}
          <Group opacity={o1}>
            <Path path={o.press} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Path path={o.rise} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Path path={o.lift} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o2}>
            <Path path={o.strike} style="stroke" strokeWidth={5} color={AMBER} strokeCap="round" />
            <Path path={o.rebound} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o3}>
            <Path path={o.toBridge} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" />
            <Path path={o.toBoard} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o4}>
            <Path path={o.airUp} style="stroke" strokeWidth={5} color={AIR}>
              <DashPathEffect intervals={[20, 12]} />
            </Path>
            <Path path={o.airDown} style="stroke" strokeWidth={5} color={AIR}>
              <DashPathEffect intervals={[16, 10]} />
            </Path>
          </Group>
          <Group opacity={o5}>
            <Path path={o.release} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Path path={o.damperDown} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ═════════════════════════════════ UPRIGHT ══════════════════════════════════ */

const U = {
  keyFront: UP.xKey,
  balance: -420,
  keyBack: -220,
  hy: UP.hammerY,
  board: UP.soundboard.x0,
  sTop: UP.hammerY - 340,
  sBot: UP.hammerY + 380,
};

let upBuilt: null | Record<string, SkPath> = null;
function uprightStatic(): Record<string, SkPath> {
  if (upBuilt) return upBuilt;
  const o: Record<string, SkPath> = {};
  const hy = U.hy;
  o.board = rr(U.board, U.sTop - 40, U.board + 12, U.sBot + 40, 2);
  o.ribs = Skia.Path.Make();
  for (let y = U.sTop; y < U.sBot; y += 110) o.ribs.addRRect(Skia.RRectXY(Skia.XYWHRect(U.board + 12, y, 24, 28), 6, 6));
  o.bridge = rr(6, U.sTop + 120, U.board, U.sBot - 40, 4);
  o.posts = rr(U.board + 36, U.sTop - 40, 100, U.sBot + 40, 4);
  o.rest = Skia.Path.Make();
  o.rest.moveTo(0, U.sTop);
  o.rest.lineTo(0, U.sBot);
  o.keybed = rr(U.keyFront + 30, UP.keybedY, -200, UP.keybedY + 30, 3);
  o.balanceRail = rr(U.balance - 14, KEY_TOP_Y + 24, U.balance + 14, UP.keybedY, 3);
  o.panel = rr(UP.panel.x - UP.panel.t, U.sTop - 40, UP.panel.x, KEY_TOP_Y - 80, 4);
  o.key = rr(U.keyFront - U.balance, -24, U.keyBack - U.balance, 0, 3);
  o.keyTop = rr(U.keyFront - U.balance, -24, U.keyFront - U.balance + 150, -18, 2);
  // Hammer about its butt flange (below and in front of the strike point).
  const fx = -150;
  const fy = hy + 160;
  o.shank = Skia.Path.Make();
  o.shank.moveTo(0, 0);
  o.shank.lineTo(-34 - fx, hy - fy);
  o.head = Skia.Path.Make();
  o.head.moveTo(-66 - fx, hy - 26 - fy);
  o.head.quadTo(-8 - fx, hy - 30 - fy, -3 - fx, hy - fy);
  o.head.quadTo(-8 - fx, hy + 30 - fy, -66 - fx, hy + 26 - fy);
  o.head.close();
  o.butt = rr(-30, -24, 30, 24, 8);
  o.damper = rr(-34, hy - 150, -4, hy - 84, 5);
  // The sticker from the key's back up to the action, and the damper's lever.
  o.sticker = Skia.Path.Make();
  o.sticker.moveTo(U.keyBack - 20, KEY_TOP_Y - 4);
  o.sticker.lineTo(-150, hy + 196);
  o.damperLever = Skia.Path.Make();
  o.damperLever.moveTo(-30, hy - 100);
  o.damperLever.lineTo(-130, hy + 30);
  o.press = Skia.Path.Make();
  arrow(o.press, U.keyFront + 70, KEY_TOP_Y - 110, U.keyFront + 70, KEY_TOP_Y - 22, 16);
  o.swing = Skia.Path.Make();
  arrow(o.swing, -130, hy + 40, -60, hy + 40, 14);
  o.lift = Skia.Path.Make();
  arrow(o.lift, -20, hy - 170, -80, hy - 170, 14);
  o.strike = Skia.Path.Make();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    o.strike.moveTo(-4 + Math.cos(a) * 14, hy + Math.sin(a) * 14);
    o.strike.lineTo(-4 + Math.cos(a) * 30, hy + Math.sin(a) * 30);
  }
  o.rebound = Skia.Path.Make();
  arrow(o.rebound, -20, hy + 50, -90, hy + 50, 14);
  o.toBoard = Skia.Path.Make();
  arrow(o.toBoard, 16, hy + 150, U.board - 4, hy + 150, 12);
  o.airBack = Skia.Path.Make();
  arcs(o.airBack, 60, hy + 40, [110, 160, 210], -40, 40);
  o.airUp = Skia.Path.Make();
  arcs(o.airUp, -40, U.sTop - 20, [70, 110], 240, 300);
  o.release = Skia.Path.Make();
  arrow(o.release, U.keyFront + 70, KEY_TOP_Y - 20, U.keyFront + 70, KEY_TOP_Y - 110, 16);
  o.damperBack = Skia.Path.Make();
  arrow(o.damperBack, -80, hy - 170, -20, hy - 170, 14);
  upBuilt = o;
  return o;
}

function vStringPath(a: number, y0: number, y1: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const y = y0 + (y1 - y0) * s;
    const x = -a * Math.sin(Math.PI * s);
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
function vBoardPath(a: number, y0: number, y1: number, x: number): SkPath {
  'worklet';
  const p = Skia.Path.Make();
  const n = 32;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const y = y0 + (y1 - y0) * s;
    const xx = x + a * Math.sin(Math.PI * s);
    if (i === 0) p.moveTo(xx, y);
    else p.lineTo(xx, y);
  }
  return p;
}

function UprightSequence({ w, h, reveal, shown, accessibilityLabel }: StrikeSequenceProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', UPRIGHT_SOUND_BOX, w, h, 6), [w, h]);
  const o = uprightStatic();
  const DEG = Math.PI / 180;
  const hy = U.hy;
  const keyXf = useDerivedValue(() => [{ translateX: U.balance }, { translateY: KEY_TOP_Y + 24 }, { rotate: -KEY_DIP_DEG * DEG * keyDown(reveal.value) }]);
  // The hammer swings toward the strings (+x) about its butt: drawn at the
  // strike, turned back from it by the rest of its travel.
  const hamXf = useDerivedValue(() => [{ translateX: -150 }, { translateY: hy + 160 }, { rotate: -14 * DEG * (1 - hammerUp(reveal.value)) }]);
  const damXf = useDerivedValue(() => {
    const r = reveal.value;
    const lift = r < 4.5 ? 1 : 1 - clamp01((r - 4.5) * 2);
    return [{ translateX: -DAMPER_LIFT * lift }];
  });
  const sA = useDerivedValue(() => vStringPath(STRING_AMP * stringAmp(reveal.value), U.sTop, U.sBot));
  const sB = useDerivedValue(() => vStringPath(-STRING_AMP * stringAmp(reveal.value), U.sTop, U.sBot));
  const sOn = useDerivedValue(() => stringAmp(reveal.value));
  const bd = useDerivedValue(() => vBoardPath(BOARD_AMP * boardAmp(reveal.value), U.sTop - 40, U.sBot + 40, U.board + 12));
  const bOn = useDerivedValue(() => boardAmp(reveal.value));
  const op = (i: number) => {
    'worklet';
    const on = clamp01(reveal.value - i);
    return on * (reveal.value >= i + 1.98 ? 0.35 : 1);
  };
  const o1 = useDerivedValue(() => (reveal.value < 4.5 ? op(0) : 0));
  const o2 = useDerivedValue(() => (reveal.value < 4.5 ? op(1) : 0));
  const o3 = useDerivedValue(() => (reveal.value < 4.5 ? op(2) : 0));
  const o4 = useDerivedValue(() => (reveal.value < 4.6 ? clamp01(reveal.value - 3) : 0.3));
  const o5 = useDerivedValue(() => clamp01((reveal.value - 4.5) * 2));

  const labels: StaticLabel[] = [
    { id: 'key', text: 'KEY', u: U.keyFront + 60, v: KEY_TOP_Y + 52, align: 'center', tone: 'muted' },
    { id: 'str', text: 'STRING', u: -16, v: U.sTop + 40, align: 'right', tone: 'muted' },
    { id: 'brd', text: 'SOUNDBOARD', short: 'BOARD', u: UPRIGHT_SOUND_BOX.u1 - 8, v: U.sTop + 40, align: 'right', tone: 'muted' },
    { id: 'hm', text: 'HAMMER', u: -150, v: hy - 50, align: 'center', tone: 'muted' },
    { id: 'dm', text: 'DAMPER', u: -60, v: hy - 200, align: 'right', tone: 'muted' },
  ];
  if (shown === 1) labels.push({ id: 'e1', text: '① KEY DOWN · DAMPER OFF', short: '① KEY DOWN', u: U.keyFront + 10, v: -470, align: 'left', tone: 'amber' });
  if (shown === 2) labels.push({ id: 'e2', text: '② STRIKE · FALLS BACK', short: '② STRIKE', u: U.keyFront + 10, v: -470, align: 'left', tone: 'amber' });
  if (shown === 3) labels.push({ id: 'e3', text: '③ STRING → BRIDGE → BOARD', short: '③ TO THE BOARD', u: U.keyFront + 10, v: -470, align: 'left', tone: 'blue' });
  if (shown === 4) labels.push({ id: 'e4', text: '④ OUT AT THE BACK · UP', short: '④ AIR', u: U.keyFront + 10, v: -470, align: 'left', tone: 'blue' });
  if (shown === 5) labels.push({ id: 'e5', text: '⑤ KEY UP · DAMPER BACK', short: '⑤ KEY UP', u: U.keyFront + 10, v: -470, align: 'left', tone: 'amber' });
  labels.push({ id: 'ex', text: 'MOTION DRAWN LARGER', short: 'DRAWN LARGER', u: UPRIGHT_SOUND_BOX.u1 - 10, v: UPRIGHT_SOUND_BOX.v1 - 16, align: 'right', tone: 'illustrative' });

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Path path={o.posts}>
            <LinearGradient start={vec(U.board + 36, 0)} end={vec(100, 0)} colors={['#8a6a3a', '#5a4020']} />
          </Path>
          <Path path={o.ribs} color="#8a6a3a" />
          <Path path={o.board}>
            <LinearGradient start={vec(U.board, 0)} end={vec(U.board + 12, 0)} colors={[...P.SPRUCE]} />
          </Path>
          <Path path={o.bridge}>
            <LinearGradient start={vec(6, 0)} end={vec(U.board, 0)} colors={[...P.MAPLE]} />
          </Path>
          <Path path={o.keybed} color="#3a2a18" />
          <Path path={o.balanceRail} color="#5a4020" />
          <Path path={o.panel} opacity={0.35}>
            <LinearGradient start={vec(UP.panel.x - 18, 0)} end={vec(UP.panel.x, 0)} colors={['#4a4c55', '#141418']} />
          </Path>
          <Path path={o.rest} style="stroke" strokeWidth={2.5} color="#8a8f99" opacity={0.7}>
            <DashPathEffect intervals={[10, 8]} />
          </Path>
          <Group opacity={sOn}>
            <Path path={sB} style="stroke" strokeWidth={3} color={BLUE} opacity={0.45} />
            <Path path={sA} style="stroke" strokeWidth={4.5} color={BLUE} />
          </Group>
          <Path path={o.rest} style="stroke" strokeWidth={3} color={P.STEEL} opacity={0.9} />
          <Group opacity={bOn}>
            <Path path={bd} style="stroke" strokeWidth={5} color={BLUE} />
          </Group>
          <Path path={o.sticker} style="stroke" strokeWidth={10} strokeCap="round" color="#8a6a3a" />
          <Group transform={damXf}>
            <Path path={o.damperLever} style="stroke" strokeWidth={5} strokeCap="round" color="#b89260" />
          </Group>
          <Group transform={keyXf}>
            <Path path={o.key}>
              <LinearGradient start={vec(0, -24)} end={vec(0, 0)} colors={['#d8c79f', '#9c855a']} />
            </Path>
            <Path path={o.keyTop} color={P.IVORY[0]} />
          </Group>
          <Group transform={hamXf}>
            <Path path={o.shank} style="stroke" strokeWidth={8} strokeCap="round" color="#b89260" />
            <Path path={o.butt} color="#7a5a34" />
            <Path path={o.head}>
              <LinearGradient start={vec(-72 + 150, -30 - 160)} end={vec(-8 + 150, 30 - 160)} colors={['#fbf6e8', P.FELT, '#b9ad92']} />
            </Path>
            <Path path={o.head} style="stroke" strokeWidth={2} color="#5a5040" opacity={0.7} />
          </Group>
          <Group transform={damXf}>
            <Path path={o.damper}>
              <LinearGradient start={vec(-34, 0)} end={vec(-4, 0)} colors={['#6a5844', '#3a2f24']} />
            </Path>
          </Group>
          <Group opacity={o1}>
            <Path path={o.press} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Path path={o.swing} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Path path={o.lift} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o2}>
            <Path path={o.strike} style="stroke" strokeWidth={5} color={AMBER} strokeCap="round" />
            <Path path={o.rebound} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o3}>
            <Path path={o.toBoard} style="stroke" strokeWidth={6} color={BLUE} strokeCap="round" strokeJoin="round" />
          </Group>
          <Group opacity={o4}>
            <Path path={o.airBack} style="stroke" strokeWidth={5} color={AIR}>
              <DashPathEffect intervals={[20, 12]} />
            </Path>
            <Path path={o.airUp} style="stroke" strokeWidth={5} color={AIR}>
              <DashPathEffect intervals={[16, 10]} />
            </Path>
          </Group>
          <Group opacity={o5}>
            <Path path={o.release} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
            <Path path={o.damperBack} style="stroke" strokeWidth={6} color={AMBER} strokeCap="round" strokeJoin="round" />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
