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

/*
 * THE GRAND ACTION, one note, drawn to a real grand's proportions (code
 * comment only, mm; strings at y = 0, y down): key ≈ 560 long overall
 * (front to the back end under the damper underlever), 23 thick, its
 * balance point ≈ 270 behind the front; key top ≈ 160 below the strings;
 * the key dips ≈ 10 at the front (drawn larger). Hammer shank ≈ 125 from
 * its flange to the head; head ≈ 55 tall with its wooden molding; blow
 * distance (crown to string at rest) ≈ 47; at the strike the shank lies
 * about level. Wippen ≈ 145 long on its rail, the jack under the shank's
 * knuckle; the capstan on the key under the wippen heel. The pin block
 * (laminated maple ≈ 40 thick) under the plate in front of the action,
 * tuning pins ≈ 50 proud; the agraffe on the plate; the speaking length from
 * the agraffe to the bridge (≈ 50 tall here on a soundboard ≈ 9 thick, ribs
 * under it, the belly rail at its front edge); the damper head ≈ 60 × 46
 * with its felt wedge on the strings, its wire down through the guide rail
 * to the underlever over the key's back end.
 */
/** The grand's note drawn: A4 (key 49) — its strings run from the agraffe to the long bridge. */
const A4 = GB.strings[48];
/** This close-up's own key height below the strings (the scene's frame K
 *  squeezes it; the close-up gives the action its real room). */
const KY = 160;
const G = {
  agraffe: A4.a[0],
  bridge: A4.b[0],
  keyFront: GB.xKey,
  keyBack: 100,
  balance: -200,
  /** The hammer flange; at the strike the shank lies level, the crown at (0, 0). */
  flange: { x: -125, y: 55 },
  board: 55,
};
/** Exaggerations (mm): the string's swing, the board's bow, the key's dip. */
const STRING_AMP = 26;
const BOARD_AMP = 14;
const KEY_DIP_DEG = 2.4;
/** The hammer at rest, turned down from the strike about its flange: ≈ 21°
 *  puts the crown ≈ 47 under the strings (the blow distance). */
const HAMMER_REST_DEG = 21;
const DAMPER_LIFT = 26;

export const GRAND_SOUND_BOX = { u0: -560, u1: G.bridge + 120, v0: -300, v1: 280 };
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
  const B = G.board;
  // Soundboard (from the belly rail back), its ribs, the bridge and pin.
  o.board = rr(130, B, G.bridge + 140, B + 9, 2);
  o.ribs = Skia.Path.Make();
  for (let x = 190; x < G.bridge + 120; x += 115) o.ribs.addRRect(Skia.RRectXY(Skia.XYWHRect(x, B + 9, 24, 22), 5, 5));
  o.bellyRail = rr(110, B - 14, 150, B + 90, 4);
  o.bridge = rr(G.bridge - 16, 3, G.bridge + 16, B, 4);
  o.bridgeCap = rr(G.bridge - 16, 3, G.bridge + 16, 9, 2);
  o.bridgePin = rr(G.bridge - 4, -9, G.bridge + 4, 4, 2);
  // The plate over the pin block, the agraffe, the tuning pins.
  o.pinBlock = rr(-335, 24, -165, 64, 4);
  o.pinGrain = Skia.Path.Make();
  for (const y of [32, 40, 48, 56]) {
    o.pinGrain.moveTo(-330, y);
    o.pinGrain.lineTo(-170, y);
  }
  o.plate = rr(-345, 8, G.agraffe + 34, 24, 5);
  o.agraffe = rr(G.agraffe - 9, -16, G.agraffe + 9, 10, 3);
  o.pins = Skia.Path.Make();
  for (let x = -320; x <= -200; x += 30) o.pins.addRRect(Skia.RRectXY(Skia.XYWHRect(x, -46, 10, 70), 2, 2));
  o.coils = Skia.Path.Make();
  for (let x = -320; x <= -200; x += 30) o.coils.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 2, -34, 14, 10), 3, 3));
  // The string's front length: from its tuning pin over the agraffe.
  o.front = Skia.Path.Make();
  o.front.moveTo(-215, -29);
  o.front.lineTo(G.agraffe, 0);
  // Key frame: the keybed, the front, balance and back rails, the key slip.
  o.keybed = rr(G.keyFront + 10, KY + 50, G.keyBack + 40, KY + 78, 3);
  o.balanceRail = rr(G.balance - 16, KY + 24, G.balance + 16, KY + 50, 3);
  o.frontRail = rr(G.keyFront + 18, KY + 30, G.keyFront + 48, KY + 50, 3);
  o.backRail = rr(G.keyBack - 50, KY + 26, G.keyBack, KY + 50, 3);
  o.slip = rr(G.keyFront - 22, KY - 22, G.keyFront - 4, KY + 78, 4);
  o.fallboard = rr(-372, -60, -350, KY - 26, 6);
  o.rest = Skia.Path.Make();
  o.rest.moveTo(G.agraffe, 0);
  o.rest.lineTo(G.bridge, 0);
  // Key (a lever about its balance point), drawn about the pivot: the key
  // stick, its ivory top, the capstan under the wippen heel.
  const kx = (x: number) => x - G.balance;
  o.key = rr(kx(G.keyFront), -24, kx(G.keyBack), 0, 3);
  o.keyTop = rr(kx(G.keyFront), -24, kx(G.keyFront + 150), -20, 2);
  o.capstan = rr(kx(-118), -46, kx(-102), -24, 2);
  // The action (fixed here; simplified): the bracket, the wippen on its
  // rail with the jack, the hammer flange rail, the hammer rest rail.
  o.bracket = Skia.Path.Make();
  o.bracket.moveTo(-232, KY + 22);
  o.bracket.lineTo(-218, 70);
  o.bracket.lineTo(-150, 66);
  o.bracket.lineTo(-146, 80);
  o.bracket.lineTo(-206, 86);
  o.bracket.lineTo(-216, KY + 22);
  o.bracket.close();
  o.wippenRail = rr(-222, 108, -190, 136, 3);
  o.wippen = Skia.Path.Make();
  o.wippen.moveTo(-200, 118);
  o.wippen.lineTo(-62, 104);
  o.wippen.lineTo(-58, 116);
  o.wippen.lineTo(-104, 124);
  o.wippen.lineTo(-104, 136);
  o.wippen.lineTo(-120, 136);
  o.wippen.lineTo(-122, 126);
  o.wippen.lineTo(-198, 132);
  o.wippen.close();
  o.jack = rr(-98, 70, -88, 108, 2);
  o.repLever = rr(-150, 96, -64, 103, 2);
  o.flangeRail = rr(-142, 50, -110, 92, 4);
  o.restRail = rr(-60, 86, -18, 98, 4);
  // Hammer drawn about its flange AT THE STRIKE (shank level, crown on the
  // string), turned down to rest by the transform.
  const fx = G.flange.x;
  const fy = G.flange.y;
  o.shank = Skia.Path.Make();
  o.shank.moveTo(0, 0);
  o.shank.lineTo(-fx - 8, 0);
  o.knuckle = Skia.Path.Make();
  o.knuckle.addOval(Skia.XYWHRect(22, 2, 18, 11));
  const hx = -fx;
  const hy = -fy;
  // The head: a felt egg (under-felt showing at its shoulders) on a wooden
  // molding, its crown at (0, 0) world.
  o.head = Skia.Path.Make();
  o.head.moveTo(hx - 13, hy + 40);
  o.head.cubicTo(hx - 16, hy + 20, hx - 9, hy + 2, hx, hy);
  o.head.cubicTo(hx + 9, hy + 2, hx + 16, hy + 20, hx + 13, hy + 40);
  o.head.close();
  o.underfelt = Skia.Path.Make();
  o.underfelt.moveTo(hx - 9, hy + 40);
  o.underfelt.cubicTo(hx - 11, hy + 24, hx - 6, hy + 10, hx, hy + 8);
  o.underfelt.cubicTo(hx + 6, hy + 10, hx + 11, hy + 24, hx + 9, hy + 40);
  o.underfelt.close();
  o.molding = rr(hx - 9, hy + 38, hx + 9, hy + 56, 3);
  // Damper: head block (grain), felt wedge on the strings, its wire down
  // through the guide rail to the underlever over the key's back end.
  o.damperBlock = rr(25, -78, 85, -32, 5);
  o.damperGrain = Skia.Path.Make();
  for (const y of [-66, -54, -42]) {
    o.damperGrain.moveTo(30, y);
    o.damperGrain.lineTo(80, y);
  }
  o.damperFelt = Skia.Path.Make();
  o.damperFelt.moveTo(30, -32);
  o.damperFelt.lineTo(80, -32);
  o.damperFelt.lineTo(72, -2);
  o.damperFelt.lineTo(38, -2);
  o.damperFelt.close();
  o.damperWire = Skia.Path.Make();
  o.damperWire.moveTo(55, -32);
  o.damperWire.lineTo(55, KY - 26);
  o.guideRail = rr(36, 64, 96, 80, 3);
  o.underlever = rr(30, KY - 30, G.keyBack + 10, KY - 18, 4);
  o.underFlange = rr(G.keyBack - 6, KY - 46, G.keyBack + 22, KY - 14, 3);
  // Overlay arrows.
  o.press = Skia.Path.Make();
  arrow(o.press, G.keyFront + 70, KY - 110, G.keyFront + 70, KY - 30, 16);
  o.rise = Skia.Path.Make();
  arrow(o.rise, 38, 120, 38, 62, 14);
  o.lift = Skia.Path.Make();
  arrow(o.lift, 104, -50, 104, -125, 14);
  o.rebound = Skia.Path.Make();
  arrow(o.rebound, 34, 6, 34, 64, 14);
  o.strike = Skia.Path.Make();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    o.strike.moveTo(Math.cos(a) * 14, -8 + Math.sin(a) * 14);
    o.strike.lineTo(Math.cos(a) * 30, -8 + Math.sin(a) * 30);
  }
  o.toBridge = Skia.Path.Make();
  arrow(o.toBridge, (G.agraffe + G.bridge) / 2 + 60, -50, G.bridge - 30, -18, 14);
  o.toBoard = Skia.Path.Make();
  arrow(o.toBoard, G.bridge + 36, 2, G.bridge + 36, G.board - 4, 12);
  o.airUp = Skia.Path.Make();
  arcs(o.airUp, G.bridge - 60, G.board, [170, 230, 290], 228, 312);
  o.airDown = Skia.Path.Make();
  arcs(o.airDown, G.bridge - 60, G.board + 20, [70, 115], 50, 130);
  o.release = Skia.Path.Make();
  arrow(o.release, G.keyFront + 70, KY - 30, G.keyFront + 70, KY - 110, 16);
  o.damperDown = Skia.Path.Make();
  arrow(o.damperDown, 104, -140, 104, -60, 14);
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
  const keyXf = useDerivedValue(() => [{ translateX: G.balance }, { translateY: KY + 24 }, { rotate: -KEY_DIP_DEG * DEG * keyDown(reveal.value) }]);
  const hamXf = useDerivedValue(() => [{ translateX: G.flange.x }, { translateY: G.flange.y }, { rotate: HAMMER_REST_DEG * DEG * (1 - hammerUp(reveal.value)) }]);
  const damXf = useDerivedValue(() => {
    const r = reveal.value;
    const lift = r < 4.5 ? 1 : 1 - clamp01((r - 4.5) * 2);
    return [{ translateY: -DAMPER_LIFT * lift }];
  });
  const sA = useDerivedValue(() => stringPath(STRING_AMP * stringAmp(reveal.value), G.agraffe, G.bridge));
  const sB = useDerivedValue(() => stringPath(-STRING_AMP * stringAmp(reveal.value), G.agraffe, G.bridge));
  const sOn = useDerivedValue(() => stringAmp(reveal.value));
  const bd = useDerivedValue(() => boardPath(BOARD_AMP * boardAmp(reveal.value), 150, G.bridge + 130, G.board));
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
    { id: 'key', text: 'KEY', u: G.keyFront + 75, v: KY + 104, align: 'center', tone: 'muted' },
    { id: 'str', text: 'STRING', u: (G.agraffe + G.bridge) / 2, v: -48, align: 'center', tone: 'muted' },
    { id: 'brd', text: 'SOUNDBOARD', short: 'BOARD', u: G.bridge - 120, v: G.board + 70, align: 'center', tone: 'muted' },
    { id: 'hm', text: 'HAMMER', u: 18, v: 112, align: 'left', tone: 'muted' },
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
          {/* the fixed parts: soundboard, ribs, belly rail, bridge */}
          <Path path={o.ribs} color="#8a6a3a" />
          <Path path={o.bellyRail}>
            <LinearGradient start={vec(110, 0)} end={vec(150, 0)} colors={['#a77e48', '#6d4a22']} />
          </Path>
          <Path path={o.board}>
            <LinearGradient start={vec(0, G.board)} end={vec(0, G.board + 9)} colors={[...P.SPRUCE]} />
          </Path>
          <Path path={o.bridge}>
            <LinearGradient start={vec(G.bridge - 16, 0)} end={vec(G.bridge + 16, 0)} colors={[...P.MAPLE]} />
          </Path>
          <Path path={o.bridgeCap} color="#3a2a18" opacity={0.55} />
          {/* the key frame and the action's fixed rails */}
          <Path path={o.keybed}>
            <LinearGradient start={vec(0, KY + 50)} end={vec(0, KY + 78)} colors={['#5a4026', '#3a2a18']} />
          </Path>
          <Path path={o.frontRail} color="#6d4a22" />
          <Path path={o.balanceRail} color="#6d4a22" />
          <Path path={o.backRail} color="#6d4a22" />
          <Path path={o.bracket}>
            <LinearGradient start={vec(-232, 0)} end={vec(-146, 0)} colors={['#8a8f99', '#4a4e57']} />
          </Path>
          <Path path={o.wippenRail} color="#6d4a22" />
          <Path path={o.flangeRail}>
            <LinearGradient start={vec(-142, 0)} end={vec(-110, 0)} colors={['#a77e48', '#6d4a22']} />
          </Path>
          <Path path={o.restRail} color="#4a3a2a" />
          {/* the pin block, the plate, the agraffe, the tuning pins */}
          <Path path={o.pinBlock}>
            <LinearGradient start={vec(0, 24)} end={vec(0, 64)} colors={['#c39a5e', '#8a6430', '#6d4a22']} />
          </Path>
          <Path path={o.pinGrain} style="stroke" strokeWidth={1.5} color="#4a3016" opacity={0.6} />
          <Path path={o.plate}>
            <LinearGradient start={vec(0, 8)} end={vec(0, 24)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          <Path path={o.pins}>
            <LinearGradient start={vec(-320, 0)} end={vec(-190, 0)} colors={['#eef1f6', '#7a7f8a']} />
          </Path>
          <Path path={o.coils} color="#b9bec8" />
          <Path path={o.front} style="stroke" strokeWidth={2.5} color={P.STEEL} opacity={0.85} />
          <Path path={o.agraffe}>
            <LinearGradient start={vec(G.agraffe - 9, 0)} end={vec(G.agraffe + 9, 0)} colors={['#f3d98d', '#a37a2a']} />
          </Path>
          <Path path={o.fallboard}>
            <LinearGradient start={vec(-372, -60)} end={vec(-350, KY)} colors={['#4a4c55', '#141418']} />
          </Path>
          <Path path={o.guideRail} color="#5a4026" />
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
          {/* the wippen and jack (fixed, simplified) */}
          <Path path={o.wippen}>
            <LinearGradient start={vec(0, 104)} end={vec(0, 136)} colors={['#c39a5e', '#8a6430']} />
          </Path>
          <Path path={o.repLever} color="#d8b57a" />
          <Path path={o.jack} color="#a77e48" />
          {/* the key, about its balance point */}
          <Group transform={keyXf}>
            <Path path={o.key}>
              <LinearGradient start={vec(0, -24)} end={vec(0, 0)} colors={['#e2cfa0', '#b89a64', '#8a6e42']} />
            </Path>
            <Path path={o.keyTop} color={P.IVORY[0]} />
            <Path path={o.capstan}>
              <LinearGradient start={vec(-118 - G.balance, 0)} end={vec(-102 - G.balance, 0)} colors={['#f3d98d', '#a37a2a']} />
            </Path>
          </Group>
          <Path path={o.slip}>
            <LinearGradient start={vec(G.keyFront - 22, 0)} end={vec(G.keyFront - 4, 0)} colors={['#3e4048', '#0c0c0f']} />
          </Path>
          {/* the hammer, about its flange */}
          <Group transform={hamXf}>
            <Path path={o.shank} style="stroke" strokeWidth={9} strokeCap="round" color="#c9a26a" />
            <Path path={o.shank} style="stroke" strokeWidth={2.5} strokeCap="round" color="#f0d9a8" opacity={0.7} />
            <Path path={o.knuckle} color="#e9e1cd" />
            <Path path={o.molding}>
              <LinearGradient start={vec(-G.flange.x - 9, 0)} end={vec(-G.flange.x + 9, 0)} colors={['#c39a5e', '#7a5a34']} />
            </Path>
            <Path path={o.head}>
              <LinearGradient start={vec(-G.flange.x - 16, -G.flange.y)} end={vec(-G.flange.x + 16, -G.flange.y + 40)} colors={['#fbf6e8', P.FELT, '#b9ad92']} />
            </Path>
            <Path path={o.underfelt} color="#c9b98f" opacity={0.55} />
            <Path path={o.head} style="stroke" strokeWidth={2} color="#5a5040" opacity={0.7} />
          </Group>
          {/* the damper, lifted by the key through its underlever */}
          <Group transform={damXf}>
            <Path path={o.underFlange} color="#6d4a22" />
            <Path path={o.underlever}>
              <LinearGradient start={vec(0, KY - 30)} end={vec(0, KY - 18)} colors={['#c39a5e', '#8a6430']} />
            </Path>
            <Path path={o.damperWire} style="stroke" strokeWidth={3} color="#c8ccd4" />
            <Path path={o.damperBlock}>
              <LinearGradient start={vec(25, -78)} end={vec(85, -32)} colors={['#8a6a44', '#5a4026', '#3a2a18']} />
            </Path>
            <Path path={o.damperGrain} style="stroke" strokeWidth={1.5} color="#2a1e10" opacity={0.5} />
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
  balance: -350,
  keyBack: -110,
  hy: UP.hammerY,
  board: UP.soundboard.x0,
  /** The pressure bar (the speaking length's top): the strike near the top. */
  sTop: UP.hammerY - 80,
  sBot: UP.hammerY + 380,
};

/*
 * THE UPRIGHT ACTION, one note (code comment only, mm; strings in the plane
 * x = 0, the hammer striking from the pianist's side): key ≈ 360 long here,
 * 23 thick, on the key frame's front, balance and back rails; the capstan
 * at its back end under the wippen; the wippen on its flange with the jack
 * up to the hammer butt; the butt flange on the main (centre) rail ≈ 150
 * below the strike; shank ≈ 150, the head ≈ 50 deep × 55 tall on its
 * molding; blow distance ≈ 40–45 (14° about the flange, drawn so); the
 * hammer (rest) rail in front of the shanks. UNDER-DAMPERS, as on a modern
 * upright: the damper head (block ≈ 20 deep with its felt) presses the
 * strings BELOW the strike point; its lever is pivoted on the main rail and
 * worked from the wippen (its spoon not drawn). The strings run from the tuning pins
 * in the pin block over the pressure bar, past the strike near their top
 * end, down to the bridge on the soundboard at the back.
 */
let upBuilt: null | Record<string, SkPath> = null;
function uprightStatic(): Record<string, SkPath> {
  if (upBuilt) return upBuilt;
  const o: Record<string, SkPath> = {};
  const hy = U.hy;
  const K = KEY_TOP_Y;
  // The back: soundboard, ribs, back posts; the bridge at the string's foot.
  o.board = rr(U.board, U.sTop - 120, U.board + 12, U.sBot + 60, 2);
  o.ribs = Skia.Path.Make();
  for (let y = U.sTop - 80; y < U.sBot + 40; y += 110) o.ribs.addRRect(Skia.RRectXY(Skia.XYWHRect(U.board + 12, y, 22, 26), 5, 5));
  o.posts = rr(U.board + 36, U.sTop - 140, 100, U.sBot + 80, 4);
  o.bridge = rr(4, U.sBot - 50, U.board, U.sBot + 30, 4);
  o.bridgePin = rr(-6, U.sBot - 4, 6, U.sBot + 4, 2);
  // The plate's bars behind the strings, the pin block and the pins above,
  // the pressure bar where the speaking length begins.
  o.plate = rr(5, U.sTop - 150, 18, U.sTop + 40, 4);
  o.plateLow = rr(5, U.sBot + 20, 18, U.sBot + 70, 4);
  o.pinBlock = rr(-40, U.sTop - 230, 5, U.sTop - 40, 4);
  o.pins = Skia.Path.Make();
  for (const y of [U.sTop - 200, U.sTop - 160, U.sTop - 120]) o.pins.addRRect(Skia.RRectXY(Skia.XYWHRect(-78, y, 40, 9), 2, 2));
  o.pressureBar = rr(-26, U.sTop - 20, -2, U.sTop + 6, 4);
  o.front = Skia.Path.Make();
  o.front.moveTo(-40, U.sTop - 150);
  o.front.lineTo(0, U.sTop);
  o.rest = Skia.Path.Make();
  o.rest.moveTo(0, U.sTop);
  o.rest.lineTo(0, U.sBot);
  // The key frame on the keybed; the upper front panel (faint).
  o.keybed = rr(U.keyFront + 30, K + 64, U.keyBack + 40, K + 94, 3);
  o.frame = rr(U.keyFront + 40, K + 46, U.keyBack + 30, K + 64, 2);
  o.balanceRail = rr(U.balance - 15, K + 24, U.balance + 15, K + 46, 3);
  o.frontRail = rr(U.keyFront + 40, K + 30, U.keyFront + 68, K + 46, 3);
  o.backRail = rr(U.keyBack - 34, K + 30, U.keyBack, K + 46, 3);
  o.slip = rr(U.keyFront - 18, K - 20, U.keyFront - 2, K + 94, 4);
  o.panel = rr(UP.panel.x - UP.panel.t, U.sTop - 200, UP.panel.x, K - 80, 4);
  // Key about its balance point: stick, ivory top, capstan at the back.
  const kx = (x: number) => x - U.balance;
  o.key = rr(kx(U.keyFront), -24, kx(U.keyBack), 0, 3);
  o.keyTop = rr(kx(U.keyFront), -24, kx(U.keyFront + 150), -20, 2);
  o.capstan = rr(kx(U.keyBack - 34), -46, kx(U.keyBack - 18), -24, 2);
  // The action's fixed parts: brackets, the main rail, the wippen and jack,
  // the hammer rest rail.
  o.bracket = Skia.Path.Make();
  o.bracket.addRRect(Skia.RRectXY(Skia.XYWHRect(-184, hy - 40, 16, K - 8 - (hy - 40)), 3, 3));
  o.bracket.addRRect(Skia.RRectXY(Skia.XYWHRect(-184, -32, 60, 14), 3, 3));
  o.mainRail = rr(-130, -44, -96, 2, 5);
  o.wippen = Skia.Path.Make();
  o.wippen.moveTo(-150, 30);
  o.wippen.lineTo(-52, 14);
  o.wippen.lineTo(-50, 26);
  o.wippen.lineTo(-126, 38);
  o.wippen.lineTo(-150, 40);
  o.wippen.close();
  o.wippenFlange = rr(-162, 24, -142, 46, 3);
  o.jack = rr(-88, 4, -78, 22, 2);
  o.restRail = rr(-88, hy + 74, -66, hy + 98, 4);
  o.bridle = Skia.Path.Make();
  o.bridle.moveTo(-110, 28);
  o.bridle.quadTo(-118, 6, -96, -10);
  // Hammer drawn AT THE STRIKE about its butt flange (-70, hy + 150): the
  // butt, the shank leaning toward the strings, the head with its molding,
  // the crown on the string at (0, hy).
  const FX = -70;
  const FY = hy + 150;
  o.butt = rr(-26, -22, 26, 26, 10);
  o.buttFelt = rr(-30, 8, -18, 26, 3);
  o.shank = Skia.Path.Make();
  o.shank.moveTo(0, 0);
  o.shank.lineTo(-44 - FX, hy + 8 - FY);
  o.molding = rr(-58 - FX, hy - 16 - FY, -38 - FX, hy + 22 - FY, 4);
  o.head = Skia.Path.Make();
  o.head.moveTo(-44 - FX, hy - 28 - FY);
  o.head.cubicTo(-18 - FX, hy - 30 - FY, -2 - FX, hy - 14 - FY, 0 - FX, hy - FY);
  o.head.cubicTo(-2 - FX, hy + 14 - FY, -18 - FX, hy + 30 - FY, -44 - FX, hy + 28 - FY);
  o.head.close();
  o.underfelt = Skia.Path.Make();
  o.underfelt.moveTo(-40 - FX, hy - 22 - FY);
  o.underfelt.cubicTo(-20 - FX, hy - 22 - FY, -8 - FX, hy - 10 - FY, -6 - FX, hy - FY);
  o.underfelt.cubicTo(-8 - FX, hy + 10 - FY, -20 - FX, hy + 22 - FY, -40 - FX, hy + 22 - FY);
  o.underfelt.close();
  // The under-damper: head block and felt on the strings below the strike,
  // its lever down to the main rail.
  o.damper = rr(-30, hy + 52, -10, hy + 118, 4);
  o.damperFelt = rr(-10, hy + 56, 0, hy + 114, 3);
  o.damperLever = Skia.Path.Make();
  o.damperLever.moveTo(-22, hy + 118);
  o.damperLever.lineTo(-40, 18);
  o.damperFlange = rr(-50, 10, -30, 32, 3);
  // Overlay arrows.
  o.press = Skia.Path.Make();
  arrow(o.press, U.keyFront + 70, K - 110, U.keyFront + 70, K - 30, 16);
  o.swing = Skia.Path.Make();
  arrow(o.swing, -150, hy - 44, -80, hy - 44, 14);
  o.lift = Skia.Path.Make();
  arrow(o.lift, 24, hy + 135, -44, hy + 135, 14);
  o.strike = Skia.Path.Make();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    o.strike.moveTo(4 + Math.cos(a) * 14, hy + Math.sin(a) * 14);
    o.strike.lineTo(4 + Math.cos(a) * 30, hy + Math.sin(a) * 30);
  }
  o.rebound = Skia.Path.Make();
  arrow(o.rebound, -30, hy - 78, -100, hy - 78, 14);
  o.toBoard = Skia.Path.Make();
  arrow(o.toBoard, 16, U.sBot - 70, U.board - 4, U.sBot - 70, 12);
  o.airBack = Skia.Path.Make();
  arcs(o.airBack, 60, hy + 160, [110, 160, 210], -40, 40);
  o.airUp = Skia.Path.Make();
  arcs(o.airUp, -40, U.sTop - 240, [70, 110], 240, 300);
  o.release = Skia.Path.Make();
  arrow(o.release, U.keyFront + 70, K - 30, U.keyFront + 70, K - 110, 16);
  o.damperBack = Skia.Path.Make();
  arrow(o.damperBack, -44, hy + 135, 24, hy + 135, 14);
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
  // The hammer swings toward the strings (+x) about its butt flange: drawn
  // at the strike, turned back from it by the rest of its travel.
  const hamXf = useDerivedValue(() => [{ translateX: -70 }, { translateY: hy + 150 }, { rotate: -14 * DEG * (1 - hammerUp(reveal.value)) }]);
  const damXf = useDerivedValue(() => {
    const r = reveal.value;
    const lift = r < 4.5 ? 1 : 1 - clamp01((r - 4.5) * 2);
    return [{ translateX: -DAMPER_LIFT * lift }];
  });
  const sA = useDerivedValue(() => vStringPath(STRING_AMP * stringAmp(reveal.value), U.sTop, U.sBot));
  const sB = useDerivedValue(() => vStringPath(-STRING_AMP * stringAmp(reveal.value), U.sTop, U.sBot));
  const sOn = useDerivedValue(() => stringAmp(reveal.value));
  const bd = useDerivedValue(() => vBoardPath(BOARD_AMP * boardAmp(reveal.value), U.sTop - 120, U.sBot + 60, U.board + 12));
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
    { id: 'key', text: 'KEY', u: U.keyFront + 75, v: KEY_TOP_Y + 120, align: 'center', tone: 'muted' },
    { id: 'str', text: 'STRING', u: -16, v: U.sBot - 120, align: 'right', tone: 'muted' },
    { id: 'brd', text: 'SOUNDBOARD', short: 'BOARD', u: UPRIGHT_SOUND_BOX.u1 - 8, v: U.sTop + 40, align: 'right', tone: 'muted' },
    { id: 'hm', text: 'HAMMER', u: -140, v: hy - 110, align: 'center', tone: 'muted' },
    { id: 'dm', text: 'DAMPER', u: -40, v: hy + 85, align: 'right', tone: 'muted' },
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
          {/* the back: posts, ribs, soundboard, the plate's bars, the bridge */}
          <Path path={o.posts}>
            <LinearGradient start={vec(U.board + 36, 0)} end={vec(100, 0)} colors={['#8a6a3a', '#5a4020']} />
          </Path>
          <Path path={o.ribs} color="#8a6a3a" />
          <Path path={o.board}>
            <LinearGradient start={vec(U.board, 0)} end={vec(U.board + 12, 0)} colors={[...P.SPRUCE]} />
          </Path>
          <Path path={o.plate}>
            <LinearGradient start={vec(5, 0)} end={vec(18, 0)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          <Path path={o.plateLow}>
            <LinearGradient start={vec(5, 0)} end={vec(18, 0)} colors={[...P.GOLD]} positions={[0, 0.35, 0.75, 1]} />
          </Path>
          <Path path={o.bridge}>
            <LinearGradient start={vec(4, 0)} end={vec(U.board, 0)} colors={[...P.MAPLE]} />
          </Path>
          {/* the pin block, the tuning pins, the pressure bar */}
          <Path path={o.pinBlock}>
            <LinearGradient start={vec(-40, 0)} end={vec(5, 0)} colors={['#c39a5e', '#8a6430', '#6d4a22']} />
          </Path>
          <Path path={o.pins}>
            <LinearGradient start={vec(0, U.sTop - 200)} end={vec(0, U.sTop - 110)} colors={['#eef1f6', '#7a7f8a']} />
          </Path>
          <Path path={o.front} style="stroke" strokeWidth={2.5} color={P.STEEL} opacity={0.85} />
          <Path path={o.pressureBar}>
            <LinearGradient start={vec(-26, 0)} end={vec(-2, 0)} colors={['#f3d98d', '#a37a2a']} />
          </Path>
          {/* key frame, keybed, the faint upper panel in front */}
          <Path path={o.keybed}>
            <LinearGradient start={vec(0, KEY_TOP_Y + 64)} end={vec(0, KEY_TOP_Y + 94)} colors={['#5a4026', '#3a2a18']} />
          </Path>
          <Path path={o.frame} color="#6d4a22" />
          <Path path={o.frontRail} color="#6d4a22" />
          <Path path={o.balanceRail} color="#6d4a22" />
          <Path path={o.backRail} color="#6d4a22" />
          <Path path={o.panel} opacity={0.3}>
            <LinearGradient start={vec(UP.panel.x - 18, 0)} end={vec(UP.panel.x, 0)} colors={['#4a4c55', '#141418']} />
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
          <Group opacity={bOn}>
            <Path path={bd} style="stroke" strokeWidth={5} color={BLUE} />
          </Group>
          {/* the action's fixed parts */}
          <Path path={o.bracket}>
            <LinearGradient start={vec(-184, 0)} end={vec(-124, 0)} colors={['#8a8f99', '#4a4e57']} />
          </Path>
          <Path path={o.mainRail}>
            <LinearGradient start={vec(-130, 0)} end={vec(-96, 0)} colors={['#a77e48', '#6d4a22']} />
          </Path>
          <Path path={o.restRail} color="#4a3a2a" />
          <Path path={o.wippenFlange} color="#6d4a22" />
          <Path path={o.wippen}>
            <LinearGradient start={vec(0, 14)} end={vec(0, 40)} colors={['#c39a5e', '#8a6430']} />
          </Path>
          <Path path={o.jack} color="#a77e48" />
          <Path path={o.bridle} style="stroke" strokeWidth={2.5} color="#e9e1cd" opacity={0.8} />
          {/* the key, about its balance point */}
          <Group transform={keyXf}>
            <Path path={o.key}>
              <LinearGradient start={vec(0, -24)} end={vec(0, 0)} colors={['#e2cfa0', '#b89a64', '#8a6e42']} />
            </Path>
            <Path path={o.keyTop} color={P.IVORY[0]} />
            <Path path={o.capstan}>
              <LinearGradient start={vec(U.keyBack - 34 - U.balance, 0)} end={vec(U.keyBack - 18 - U.balance, 0)} colors={['#f3d98d', '#a37a2a']} />
            </Path>
          </Group>
          <Path path={o.slip}>
            <LinearGradient start={vec(U.keyFront - 18, 0)} end={vec(U.keyFront - 2, 0)} colors={['#3e4048', '#0c0c0f']} />
          </Path>
          {/* the under-damper, pulled off the strings by the key */}
          <Path path={o.damperFlange} color="#6d4a22" />
          <Group transform={damXf}>
            <Path path={o.damperLever} style="stroke" strokeWidth={6} strokeCap="round" color="#c9a26a" />
            <Path path={o.damper}>
              <LinearGradient start={vec(-30, 0)} end={vec(-10, 0)} colors={['#8a6a44', '#5a4026']} />
            </Path>
            <Path path={o.damperFelt} color={P.FELT_DARK} />
          </Group>
          {/* the hammer, about its butt flange */}
          <Group transform={hamXf}>
            <Path path={o.shank} style="stroke" strokeWidth={9} strokeCap="round" color="#c9a26a" />
            <Path path={o.shank} style="stroke" strokeWidth={2.5} strokeCap="round" color="#f0d9a8" opacity={0.7} />
            <Path path={o.butt}>
              <LinearGradient start={vec(-26, -22)} end={vec(26, 26)} colors={['#a77e48', '#6d4a22']} />
            </Path>
            <Path path={o.buttFelt} color="#e9e1cd" />
            <Path path={o.molding}>
              <LinearGradient start={vec(0, -190)} end={vec(0, -150)} colors={['#c39a5e', '#7a5a34']} />
            </Path>
            <Path path={o.head}>
              <LinearGradient start={vec(26, -180)} end={vec(70, -120)} colors={['#fbf6e8', P.FELT, '#b9ad92']} />
            </Path>
            <Path path={o.underfelt} color="#c9b98f" opacity={0.5} />
            <Path path={o.head} style="stroke" strokeWidth={2} color="#5a5040" opacity={0.7} />
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
