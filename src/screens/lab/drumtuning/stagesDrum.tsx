/**
 * Drum Tuning Lab — the DRUM drawings pinned on the rack glass. Width-driven
 * SVG in 360-unit design space, so FULL SCREEN zooms the whole picture (SVG
 * text scales with its viewBox). Every label ≥ 11 units, which is ≥ 9 pt on
 * a 390-wide phone (the Amp lab's measured 0.88 ratio).
 *
 * VISUAL STANDARD (owner): real objects, never primitives — a shell with
 * plies and a bearing edge, a hoop with claws, lug casings with rods and a
 * drum key, a coated head, snare wires on a strainer, a kick with a pedal,
 * beater and port. Vector only; no image files.
 *
 * The TENSION MAP around the lugs is coloured on the app-wide EVEN field
 * ramp (features/tools/levelColor FIELD_STOPS, the one 2-D fields use), so
 * 25 ¢ low and 25 ¢ high are equally visible steps: blue = lower than the
 * mean, yellow = even, red = higher. The meter ramp's wide green plateau
 * would hide a low lug. The map is the evenness picture every rod turn
 * changes.
 *
 * IN SYNC WITH THE SOUND (owner): ▶ TAP ripples at the tap point and lights
 * that lug while the tap sounds; ▶ STRIKE brightens the head's centre and
 * fades it with the hit's MEASURED envelope. Both ride the playback
 * SharedValue per frame — never React state per frame.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { fieldLevelColor, levelColor } from '../../../features/tools/levelColor';
import { DRUMS, lugAngle, lugCents, textBoost, tinyFit, type DrumKind, type HeadState } from './drumEngine';
import { Collar, DrumSvgDefs, ExteriorDrum, HW, HoopCut, HoopFar, LugCut, RodCut, StickSvg, WallCut } from './drumSvgParts';

export { STAR_ORDER } from './drumEngine';

export const W = 360;
/** Smallest label in design units (≈ 9.7 pt on a 390-wide phone). */
export const FONT = 11;
export const F2 = 12.5;
export const FONT_S = 10.5;

/** The meter ramp stays for LEVEL (the wave columns); exported here so the
 *  stage files share one import. */
export { levelColor };

/** What a playing stage needs to move with the sound: the clip position
 *  (0..1, a SharedValue advanced per frame) and the measured RMS envelope
 *  of the buffer in dB (10 ms blocks), so brightness follows loudness. */
export type SoundSync = { progress: SharedValue<number>; playing: boolean; envDb?: number[] | null };

/** Linear amplitude of the envelope at clip position p (0..1); 0 when the
 *  clip is not sounding. Worklet-safe arithmetic only. */
function envAmpAt(env: number[], p: number): number {
  'worklet';
  if (!env.length) return 0;
  const i = Math.min(env.length - 1, Math.max(0, Math.floor(p * env.length)));
  return Math.pow(10, env[i] / 20);
}

export const ink = {
  bg: '#0b0b0e',
  shell: '#5a3b22',
  shellLight: '#8a5a33',
  shellDark: '#3a2414',
  ply: '#2b1a0e',
  metal: '#b9bcc4',
  metalDark: '#6f737c',
  metalLight: '#e4e6ea',
  head: '#e9e4d2',
  headReso: '#d9dfe6',
  stroke: colors.steelBorder,
  text: colors.textSecondary,
  dim: colors.textMuted,
  amber: colors.amber,
  cyan: colors.cyan,
  green: colors.green,
  red: colors.red,
};

/** The map tint for a lug's deviation (cents) on the EVEN field ramp:
 *  −60 → blue, 0 → yellow (even), +60 → red; equal cents = equal colour
 *  steps either side, so a low lug is as visible as a high one. */
export const MAP_RANGE_CENTS = 60;
export const mapTint = (cents: number): string => fieldLevelColor(Math.max(0, Math.min(1, 0.5 + cents / (2 * MAP_RANGE_CENTS))));
/** A wedge with no information yet (the map hidden until the learner has
 *  listened): neutral grey. */
export const MAP_HIDDEN = '#3a3a40';

/* ── shared top-view primitives ──────────────────────────────────────────── */

const polar = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A${r1} ${r1} 0 ${large} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L${p2.x.toFixed(1)} ${p2.y.toFixed(1)} A${r0} ${r0} 0 ${large} 0 ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} Z`;
}

/** Hoop, lug casings, rods and rod heads for N lugs around (cx, cy, R).
 *  `lift` raises the hoop and rod heads off the shell (the SEAT step's
 *  exploded view: the head and hoop float above the edge, rods started by
 *  hand, nothing pulled down yet). */
function Hardware({ cx, cy, R, lugs, selected, loose, dimRods, lift = 0, bst = 1 }: { cx: number; cy: number; R: number; lugs: number; selected?: number | null; loose?: number | null; dimRods?: boolean; lift?: number; bst?: number }) {
  const items: ReactNode[] = [];
  const fs = FONT * bst;
  for (let i = 0; i < lugs; i++) {
    const a = lugAngle(i, lugs);
    const deg = (a * 180) / Math.PI + 90;
    const isLoose = loose === i;
    const c = polar(cx, cy, R + 27 + (isLoose ? 4 : 0), a);
    const rodIn = polar(cx, cy, R + 7 + lift, a);
    const rodOut = polar(cx, cy, R + 19 + (isLoose ? 4 : 0), a);
    const head = polar(cx, cy, R + 7 + lift, a);
    const sel = selected === i;
    items.push(
      <G key={i}>
        {/* tension rod */}
        <Line x1={rodIn.x} y1={rodIn.y} x2={rodOut.x} y2={rodOut.y} stroke={dimRods ? ink.metalDark : ink.metal} strokeWidth={2.4} />
        {isLoose ? <Line x1={polar(cx, cy, R + 11, a).x} y1={polar(cx, cy, R + 11, a).y} x2={polar(cx, cy, R + 15, a).x} y2={polar(cx, cy, R + 15, a).y} stroke={ink.red} strokeWidth={3} /> : null}
        {/* lug casing, numbered (the number stays upright; the selected lug's casing is lit) */}
        <G transform={`translate(${c.x},${c.y}) rotate(${deg})`}>
          <Rect x={-7} y={-9} width={14} height={18} rx={4} fill={sel ? ink.amber : 'url(#lugGrad)'} stroke={sel ? '#8a6200' : ink.metalDark} strokeWidth={0.8} />
        </G>
        <SvgText x={c.x} y={c.y + 4} fontSize={fs} fill="#101013" textAnchor="middle" fontFamily={fonts.barlowSemiBold}>{i + 1}</SvgText>
        {/* rod head on the hoop: a washer under a square key head with its slot */}
        <G transform={`translate(${head.x},${head.y}) rotate(${deg})`}>
          <Circle cx={0} cy={0} r={5.2} fill={ink.metalDark} opacity={0.9} />
          <Rect x={-4} y={-3.5} width={8} height={7} rx={1} fill={sel ? ink.amber : ink.metalLight} stroke={ink.metalDark} strokeWidth={0.7} />
          <Line x1={-2.4} y1={0} x2={2.4} y2={0} stroke={sel ? '#6a4a00' : ink.metalDark} strokeWidth={0.8} />
        </G>
      </G>,
    );
  }
  return (
    <G>
      <Defs>
        <LinearGradient id="lugGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={ink.metalDark} />
          <Stop offset="0.5" stopColor={ink.metalLight} />
          <Stop offset="1" stopColor={ink.metalDark} />
        </LinearGradient>
        <RadialGradient id="headGrad" cx="0.42" cy="0.38" r="0.7">
          <Stop offset="0" stopColor="#f6f2e4" />
          <Stop offset="0.7" stopColor={ink.head} />
          <Stop offset="1" stopColor="#cfc8b2" />
        </RadialGradient>
        <RadialGradient id="resoGrad" cx="0.42" cy="0.38" r="0.7">
          <Stop offset="0" stopColor="#eef2f6" />
          <Stop offset="0.7" stopColor={ink.headReso} />
          <Stop offset="1" stopColor="#aeb6c0" />
        </RadialGradient>
      </Defs>
      {/* hoop: a triple-flanged ring, its shadow on the shell's edge */}
      <Circle cx={cx} cy={cy} r={R + 5 + lift} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={3} />
      <Circle cx={cx} cy={cy} r={R + 10 + lift} fill="none" stroke={ink.metal} strokeWidth={7} />
      <Circle cx={cx} cy={cy} r={R + 13 + lift} fill="none" stroke={ink.metalLight} strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={R + 7 + lift} fill="none" stroke={ink.metalDark} strokeWidth={1} />
      {items}
    </G>
  );
}

/** A drum key seated on lug `i`, with a turn arrow when `turns` ≠ 0. */
function DrumKey({ cx, cy, R, lugs, i, turns, bst = 1 }: { cx: number; cy: number; R: number; lugs: number; i: number; turns: number; bst?: number }) {
  const f2 = F2 * bst;
  const a = lugAngle(i, lugs);
  const deg = (a * 180) / Math.PI + 90;
  const at = polar(cx, cy, R + 7, a);
  const arrow = turns > 0.01 ? '↻' : turns < -0.01 ? '↺' : '';
  return (
    <G transform={`translate(${at.x},${at.y}) rotate(${deg})`}>
      {/* socket over the rod head, shaft outward, T handle */}
      <Rect x={-5.5} y={-5.5} width={11} height={11} rx={2} fill="none" stroke={ink.amber} strokeWidth={1.6} />
      <Rect x={-2} y={-24} width={4} height={19} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.6} />
      <Rect x={-12} y={-29} width={24} height={6} rx={3} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.6} />
      {arrow ? <SvgText x={16} y={-14} fontSize={f2} fill={ink.amber} fontFamily={fonts.barlowMedium} transform="rotate(0)">{arrow}</SvgText> : null}
    </G>
  );
}

export type DrumFaults = { worn?: boolean; loose?: number | null; debris?: number | null; uneven?: boolean };

export const TOP_H = 250;
export const TOP_ASPECT = W / TOP_H;

/** Where the learner is LOOKING on the inspection page: a dashed amber ring
 *  follows INSPECT, and a fault is drawn only once its spot has been looked
 *  at (the chapter decides what `faults` to pass). */
export type LookAt = 'head' | 'edge' | 'map' | number | null;

/**
 * The drum from above: hoop, lugs, rods, head — with the tension map
 * around the lugs, a drum key on the selected rod, the tap point, and the
 * optional inspection faults. `tapSync` ripples the tap point and lights the
 * lug while a tap sounds; `strikeSync` brightens the head's centre and fades
 * it with the measured envelope while a strike sounds.
 */
export function DrumTopStage({ width, height, drum, head, which = 'batter', selected = null, showMap = true, tap = null, tapAll = false, faults, title, order, orderStep, hitCentre, tapSync, strikeSync, look = null, scaleBySize = false, exploded = false, legend, keyTurn }: {
  width: number;
  height: number;
  drum: DrumKind;
  head: HeadState;
  which?: 'batter' | 'reso';
  selected?: number | null;
  /** true = the colour map; false = no wedges; 'hidden' = grey wedges (the
   *  map exists but is not revealed yet — the learner has to listen first). */
  showMap?: boolean | 'hidden';
  /** Lug index to mark with the stick tip (an inch in from the rim). */
  tap?: number | null;
  tapAll?: boolean;
  faults?: DrumFaults;
  title?: string;
  /** Star-pattern order to draw as arrows (lug indices), up to `orderStep`. */
  order?: readonly number[];
  orderStep?: number;
  /** A stick hit near the centre (the PLAY step). */
  hitCentre?: boolean;
  tapSync?: SoundSync;
  strikeSync?: SoundSync;
  look?: LookAt;
  /** Draw the drum at a radius that follows its diameter (the IDENTIFY page,
   *  whose lesson is size). */
  scaleBySize?: boolean;
  /** The SEAT step: the hoop and rod heads lifted off the shell. */
  exploded?: boolean;
  /** Legend text under the map (defaults to the cents scale). */
  legend?: string;
  /** The turn the key's arrow shows. Defaults to the head's own offset on
   *  the selected rod; a practice page whose offsets are HIDDEN passes this
   *  run's move instead, so the arrow never leaks the answer. */
  keyTurn?: number;
}) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const spec = DRUMS[drum];
  const lugs = spec.lugs;
  const cx = 180;
  // The drum sits a touch below centre so the drum key's T-handle on the top
  // rod (cy − R − 36) clears the title line at the top-left, even with the
  // short-phone font boost widening the title; the bottom lug casing
  // (cy + R + 36) stays inside the 250-unit frame.
  const cy = 131;
  const R = scaleBySize ? Math.round(66 * Math.sqrt(spec.diameterIn / 16)) : 80;
  const lift = exploded ? 9 : 0;
  const cents = lugCents(head);
  const halfA = (Math.PI / lugs) * 0.72;
  const steps = order && orderStep != null ? order.slice(0, Math.max(0, Math.min(order.length, orderStep + 1))) : [];
  const s = width / W;
  // Sound sync: a shared zero stands in when a page has no sound on this
  // stage, so the hooks run unconditionally.
  const zero = useSharedValue(0);
  const tp = tapSync?.progress ?? zero;
  const tapOn = !!tapSync?.playing;
  const sp = strikeSync?.progress ?? zero;
  const strikeOn = !!strikeSync?.playing;
  const env = strikeSync?.envDb ?? [];
  const tapLug = tap != null ? tap : selected;
  const tapPt = tapLug != null ? polar(cx, cy, R - 11, lugAngle(tapLug, lugs)) : null;
  const ringStyle = useAnimatedStyle(() => {
    const p = tp.value;
    const r = (9 + 26 * p) * s;
    return {
      opacity: tapOn ? Math.max(0, 1 - p) * 0.95 : 0,
      width: 2 * r,
      height: 2 * r,
      borderRadius: r,
      left: (tapPt?.x ?? 0) * s - r,
      top: (tapPt?.y ?? 0) * s - r,
    };
  });
  const glowStyle = useAnimatedStyle(() => ({
    opacity: strikeOn ? envAmpAt(env, sp.value) * 0.55 : 0,
  }));
  const glowR = R * 0.62 * s;
  const lookPt = typeof look === 'number' ? polar(cx, cy, R + 27, lugAngle(look, lugs)) : null;
  return (
    <View style={{ width, height }}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${TOP_H}`}>
      <Rect x={0} y={0} width={W} height={TOP_H} fill={ink.bg} />
      <Hardware cx={cx} cy={cy} R={R} lugs={lugs} selected={selected} loose={faults?.loose ?? null} lift={lift} bst={bst} />
      {/* the head on its bearing edge */}
      <Circle cx={cx} cy={cy} r={R + 3} fill={ink.shellDark} />
      <Circle cx={cx} cy={cy} r={R + (exploded ? 4 : 0)} fill={which === 'batter' ? 'url(#headGrad)' : 'url(#resoGrad)'} stroke="#b8b09a" strokeWidth={0.8} opacity={exploded ? 0.92 : 1} />
      {exploded ? <Circle cx={cx} cy={cy} r={R + 3} fill="none" stroke={ink.amber} strokeWidth={1} strokeDasharray="4,3" /> : null}
      {/* collar / coating rings */}
      <Circle cx={cx} cy={cy} r={R - 4} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={R * 0.45} fill="none" stroke="rgba(0,0,0,.05)" strokeWidth={6} />
      {faults?.worn ? (
        <G>
          <Ellipse cx={cx - 10} cy={cy + 8} rx={26} ry={16} fill="rgba(90,80,60,.28)" />
          <Ellipse cx={cx + 18} cy={cy - 14} rx={12} ry={8} fill="rgba(90,80,60,.22)" />
          <Ellipse cx={cx - 4} cy={cy + 2} rx={7} ry={4.5} fill="rgba(40,30,20,.35)" />
          <SvgText x={cx - 4} y={cy + 36} fontSize={fs} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>scuffed coating · dent</SvgText>
        </G>
      ) : null}
      {faults?.debris != null ? (
        <G>
          {[0, 1, 2, 3].map((k) => {
            const p = polar(cx, cy, R - 3 - (k % 2) * 3, faults.debris! + (k - 1.5) * 0.05);
            return <Circle key={k} cx={p.x} cy={p.y} r={1.4} fill="#6b5a3a" />;
          })}
        </G>
      ) : null}
      {/* the tension map: a wedge at each lug, inside the rim */}
      {showMap
        ? cents.map((c, i) => {
            const a = lugAngle(i, lugs);
            const lit = tapOn && tapLug === i;
            return <Path key={i} d={arcPath(cx, cy, R - 17, R - 4, a - halfA, a + halfA)} fill={showMap === 'hidden' ? MAP_HIDDEN : mapTint(c)} opacity={lit ? 1 : 0.82} stroke={lit ? colors.textPrimary : 'none'} strokeWidth={lit ? 1.2 : 0} />;
          })
        : null}
      {/* star-pattern arrows */}
      {steps.length > 1
        ? steps.slice(1).map((lug, k) => {
            const from = polar(cx, cy, R - 24, lugAngle(steps[k], lugs));
            const to = polar(cx, cy, R - 24, lugAngle(lug, lugs));
            return <Line key={k} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={ink.amber} strokeWidth={1.4} opacity={0.35 + (0.65 * (k + 1)) / steps.length} />;
          })
        : null}
      {steps.map((lug, k) => {
        const p = polar(cx, cy, R - 24, lugAngle(lug, lugs));
        const cur = k === steps.length - 1;
        return (
          <G key={k}>
            <Circle cx={p.x} cy={p.y} r={8} fill={cur ? ink.amber : '#1b1a12'} stroke={ink.amber} strokeWidth={1} />
            <SvgText x={p.x} y={p.y + 4} fontSize={fs} fill={cur ? '#000' : ink.amber} textAnchor="middle" fontFamily={fonts.mono}>{k + 1}</SvgText>
          </G>
        );
      })}
      {/* tap points: an inch in from the rim */}
      {(tapAll ? Array.from({ length: lugs }, (_, i) => i) : tap != null ? [tap] : []).map((i) => {
        const p = polar(cx, cy, R - 11, lugAngle(i, lugs));
        return (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={4.5} fill={colors.textPrimary} stroke="#000" strokeWidth={0.8} />
            <Circle cx={p.x} cy={p.y} r={9} fill="none" stroke={colors.textPrimary} strokeWidth={0.8} opacity={0.6} />
          </G>
        );
      })}
      {hitCentre ? (
        <G>
          <Circle cx={cx + 14} cy={cy - 10} r={7} fill={colors.textPrimary} stroke="#000" strokeWidth={0.8} />
          <Line x1={cx + 20} y1={cy - 16} x2={cx + 70} y2={cy - 66} stroke="#c9a06a" strokeWidth={4} strokeLinecap="round" />
        </G>
      ) : null}
      {selected != null && !exploded ? <DrumKey cx={cx} cy={cy} R={R} lugs={lugs} i={selected} turns={keyTurn ?? head.turns[selected] ?? 0} bst={bst} /> : null}
      {/* LOOKING HERE: the inspection ring */}
      {look === 'head' ? <Circle cx={cx} cy={cy} r={R * 0.55} fill="none" stroke={ink.amber} strokeWidth={1.4} strokeDasharray="5,3" /> : null}
      {look === 'edge' ? <Circle cx={cx} cy={cy} r={R + 1} fill="none" stroke={ink.amber} strokeWidth={1.6} strokeDasharray="5,3" /> : null}
      {look === 'map' ? <Circle cx={cx} cy={cy} r={R - 10} fill="none" stroke={ink.amber} strokeWidth={1.4} strokeDasharray="5,3" /> : null}
      {lookPt ? <Circle cx={lookPt.x} cy={lookPt.y} r={16} fill="none" stroke={ink.amber} strokeWidth={1.6} strokeDasharray="5,3" /> : null}
      {/* legend */}
      {tiny ? null : <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{(title ?? `${spec.name} · ${which === 'batter' ? 'BATTER' : 'RESONANT'} HEAD`).toUpperCase()}</SvgText>}
      {showMap === true ? (
        <G>
          <Rect x={6} y={TOP_H - 20} width={66} height={6} fill="url(#mapLegend)" />
          <Defs>
            <LinearGradient id="mapLegend" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={mapTint(-MAP_RANGE_CENTS)} />
              <Stop offset="0.25" stopColor={mapTint(-MAP_RANGE_CENTS / 2)} />
              <Stop offset="0.5" stopColor={mapTint(0)} />
              <Stop offset="0.75" stopColor={mapTint(MAP_RANGE_CENTS / 2)} />
              <Stop offset="1" stopColor={mapTint(MAP_RANGE_CENTS)} />
            </LinearGradient>
          </Defs>
          {tiny ? null : <SvgText x={6} y={TOP_H - 4} fontSize={fsS} fill={ink.dim} fontFamily={fonts.barlowMedium}>{legend ?? `−${MAP_RANGE_CENTS} ¢ · even · +${MAP_RANGE_CENTS} ¢`}</SvgText>}
        </G>
      ) : showMap === 'hidden' && !tiny ? (
        <SvgText x={6} y={TOP_H - 4} fontSize={fsS} fill={ink.dim} fontFamily={fonts.barlowMedium}>{legend ?? 'map hidden — listen first'}</SvgText>
      ) : null}
      {(tap != null || tapAll) && !tiny ? <SvgText x={W - 6} y={TOP_H - 4} fontSize={fsS} fill={ink.dim} textAnchor="end" fontFamily={fonts.barlowMedium}>● tap point</SvgText> : null}
    </Svg>
    {/* the strike: the head's centre brightens and fades with the measured envelope */}
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: cx * s - glowR, top: cy * s - glowR, width: 2 * glowR, height: 2 * glowR, borderRadius: glowR, backgroundColor: '#fff8e6' }, glowStyle]} />
    {/* the tap: a ring spreads from the tap point and fades with the tap */}
    {tapPt ? <Animated.View pointerEvents="none" style={[{ position: 'absolute', borderWidth: Math.max(1, 2 * s), borderColor: ink.amber }, ringStyle]} /> : null}
    </View>
  );
}

/* ── the cutaway (Chapter 1) ─────────────────────────────────────────────── */

export type DrumPart = 'batter' | 'reso' | 'shell' | 'edge' | 'hoop' | 'rods' | 'lugs' | 'air';

export const PARTS: readonly { id: DrumPart; label: string; short: string; role: string }[] = [
  { id: 'batter', label: 'Batter head', short: 'BATTER', role: 'The head you strike. Its tension sets the pitch you hear first; its evenness sets how clean the note is.' },
  { id: 'reso', label: 'Resonant head', short: 'RESO', role: 'Not struck — moved by the air the batter pushes. It shapes sustain, the sense of pitch and the bend.' },
  { id: 'shell', label: 'Shell', short: 'SHELL', role: 'Holds the heads apart and encloses the air. Its material and depth colour the sound — along with everything else here, never alone.' },
  { id: 'edge', label: 'Bearing edges', short: 'EDGE', role: 'The shaped rims the heads sit on. The profile sets how much head touches shell — contact, sustain, ease of tuning.' },
  { id: 'hoop', label: 'Hoops', short: 'HOOP', role: 'Press the head down onto the bearing edge evenly all the way round. A bent hoop cannot.' },
  { id: 'rods', label: 'Tension rods', short: 'RODS', role: 'Pull the hoop down. Each rod sets the tension near it; together they set the pitch.' },
  { id: 'lugs', label: 'Lugs', short: 'LUGS', role: 'The threaded casings on the shell the rods screw into. Worn inserts and missing washers let tuning drift.' },
  { id: 'air', label: 'Air inside', short: 'AIR', role: 'Couples the two heads: when the batter moves in, the air pushes the resonant head. The relationship between the heads lives here.' },
];

export const ANAT_H = 200;
export const ANAT_ASPECT = W / ANAT_H;

/** A tom in side cutaway: two heads, the shell with its plies, bearing edges,
 *  hoops, rods, lugs, and the air between — the highlighted part glows. */
export function AnatomyStage({ width, height, part }: { width: number; height: number; part: DrumPart }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const f2 = F2 * bst;
  // The 12 × 8 in rack tom (drumEngine DRUMS.rack) cut through its axis, at
  // k = 0.62 units/mm: Ø 304.8 → 189 units, depth 203.2 → 126 units; a
  // 6-ply 5.6 mm maple shell; hardware at true size (drumSvgParts HW).
  const k = 0.62;
  const R = (12 * 25.4) / 2;
  const D = 8 * 25.4;
  const tSh = 5.6;
  const cx = 192;
  const x0 = cx - R * k;
  const x1 = cx + R * k;
  const yT = 38;
  const yB = yT + D * k;
  const xi0 = x0 + tSh * k;
  const xi1 = x1 - tSh * k;
  const hi = (p: DrumPart) => (part === p ? ink.amber : null);
  const glow = (p: DrumPart, el: ReactNode) => (part === p ? <G>{el}</G> : <G opacity={0.9}>{el}</G>);
  const corners = ([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([side, s]) => ({ xShell: side < 0 ? x0 : x1, yHead: s > 0 ? yT : yB, side, s, k }));
  // The far inner wall's grain, bunching toward the silhouettes.
  const grain = Array.from({ length: 11 }, (_, i) => cx + (xi1 - cx) * Math.cos((Math.PI * (i + 1)) / 12));
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${ANAT_H}`}>
      <Rect x={0} y={0} width={W} height={ANAT_H} fill={ink.bg} />
      <DrumSvgDefs />
      {/* the far inner wall seen through the cut */}
      <Rect x={xi0} y={yT} width={xi1 - xi0} height={yB - yT} fill="url(#dtCavityX)" />
      {grain.map((x) => <Line key={x} x1={x} y1={yT + 2} x2={x} y2={yB - 2} stroke="#4a3220" strokeWidth={0.45} opacity={0.6} />)}
      <Rect x={xi0} y={yT} width={xi1 - xi0} height={14} fill="#000" opacity={0.35} />
      {/* air */}
      {glow('air', (
        <G>
          <Rect x={xi0 + 2} y={yT + 3} width={xi1 - xi0 - 4} height={yB - yT - 6} fill={part === 'air' ? 'rgba(91,176,255,.18)' : 'rgba(91,176,255,.05)'} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
            <Circle key={n} cx={xi0 + 22 + (n % 6) * 30} cy={yT + 30 + Math.floor(n / 6) * 60 + (n % 2) * 14} r={1.6} fill={part === 'air' ? ink.cyan : '#2a3a4a'} />
          ))}
          <SvgText x={cx} y={(yT + yB) / 2 + 4} fontSize={fs} fill={hi('air') ?? ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>enclosed air</SvgText>
        </G>
      ))}
      {/* the far halves of both hoops, edge-on beyond the heads */}
      {glow('hoop', (
        <G>
          <HoopFar x0={x0 + 3 * k} x1={x1 - 3 * k} yHead={yT} s={1} k={k} fill={hi('hoop') ?? 'url(#dtChrome)'} />
          <HoopFar x0={x0 + 3 * k} x1={x1 - 3 * k} yHead={yB} s={-1} k={k} fill={hi('hoop') ?? 'url(#dtChrome)'} />
        </G>
      ))}
      {/* heads: the films across the edge peaks, collars down the outside */}
      {glow('batter', (
        <G>
          <Line x1={x0 + 1.7 * k} y1={yT} x2={x1 - 1.7 * k} y2={yT} stroke={hi('batter') ?? '#efe8d8'} strokeWidth={2} />
          <Collar pl={corners[0]} peakU={-1.7} color={hi('batter') ?? '#efe8d8'} />
          <Collar pl={corners[1]} peakU={-1.7} color={hi('batter') ?? '#efe8d8'} />
        </G>
      ))}
      {glow('reso', (
        <G>
          <Line x1={x0 + 1.7 * k} y1={yB} x2={x1 - 1.7 * k} y2={yB} stroke={hi('reso') ?? '#cfd8e2'} strokeWidth={2} />
          <Collar pl={corners[2]} peakU={-1.7} color={hi('reso') ?? '#cfd8e2'} />
          <Collar pl={corners[3]} peakU={-1.7} color={hi('reso') ?? '#cfd8e2'} />
        </G>
      ))}
      {/* the shell wall cut through: plies; the 45° bearing edges */}
      {glow('shell', (
        <G>
          {[corners[0], corners[1]].map((pl, i) => (
            <WallCut key={i} pl={pl} D={D} t={tSh} plies={6} fill={hi('shell') ?? 'url(#dtPly)'} edgeFill={hi('edge') ?? undefined} />
          ))}
        </G>
      ))}
      {/* lugs on the shell, rods from the hoop ears into them */}
      {glow('lugs', <G>{corners.map((pl, i) => <LugCut key={i} pl={pl} tShell={tSh} fill={hi('lugs') ?? undefined} />)}</G>)}
      {glow('rods', <G>{corners.map((pl, i) => <RodCut key={i} pl={pl} vEnd={HW.lugTop + 2} color={hi('rods') ?? undefined} />)}</G>)}
      {glow('hoop', <G>{corners.map((pl, i) => <HoopCut key={i} pl={pl} fill={hi('hoop') ?? undefined} />)}</G>)}
      {/* a stick at the batter, its tip bead on the head */}
      <StickSvg x={x1 - 44} y={yT - 3} deg={-36} len={150} k={k} />
      {/* labels */}
      <SvgText x={x0 - 16} y={yT - 10} fontSize={fs} fill={hi('batter') ?? ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>batter head</SvgText>
      <SvgText x={x0 - 16} y={yB + 8} fontSize={fs} fill={hi('reso') ?? ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>resonant head</SvgText>
      <SvgText x={x1 + 20} y={yT + 30} fontSize={fs} fill={hi('lugs') ?? ink.text} fontFamily={fonts.barlowMedium}>lug</SvgText>
      <SvgText x={x1 + 20} y={yT + 13} fontSize={fs} fill={hi('rods') ?? ink.text} fontFamily={fonts.barlowMedium}>rod</SvgText>
      <SvgText x={x1 + 20} y={yT - 3} fontSize={fs} fill={hi('hoop') ?? ink.text} fontFamily={fonts.barlowMedium}>hoop</SvgText>
      <SvgText x={x0 + 14} y={yT + 18} fontSize={fs} fill={hi('edge') ?? ink.text} fontFamily={fonts.barlowMedium}>bearing edge</SvgText>
      <SvgText x={x0 + 14} y={yB - 14} fontSize={fs} fill={hi('shell') ?? ink.text} fontFamily={fonts.barlowMedium}>shell</SvgText>
      {tiny ? null : <SvgText x={W / 2} y={ANAT_H - 6} fontSize={f2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{PARTS.find((p) => p.id === part)?.label.toUpperCase()}</SvgText>}
    </Svg>
  );
}

/* ── the bearing edge close-up (Chapter 1, lesson 3) ─────────────────────── */

export type EdgeProfile = 'single45' | 'double45' | 'round' | 'vintage';

export const EDGES: readonly { id: EdgeProfile; label: string; short: string; contact: string; tends: string }[] = [
  { id: 'single45', label: 'Single 45°, sharp peak', short: '45° SHARP', contact: 'Smallest contact — the head touches a thin line.', tends: 'Tends toward a bright, open, long-sustaining sound; the head seats precisely but shows every flaw in the edge.' },
  { id: 'double45', label: 'Double 45°, peak slightly inboard', short: '45° DOUBLE', contact: 'Small contact with a short outer slope.', tends: 'A common modern profile: clear attack, long sustain, easy seating.' },
  { id: 'round', label: 'Rounded (round-over)', short: 'ROUNDED', contact: 'More head in contact with the shell.', tends: 'Tends toward a warmer, shorter, fatter sound — more head energy goes into the shell, less rings on.' },
  { id: 'vintage', label: 'Vintage: shallow slope, wide round', short: 'VINTAGE', contact: 'The most contact of the four.', tends: 'The vintage-style edge: warm, short, forgiving of a slightly uneven head.' },
];

export const EDGE_H = 180;
export const EDGE_ASPECT = W / EDGE_H;

export function EdgeStage({ width, height, profile }: { width: number; height: number; profile: EdgeProfile }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const f2 = F2 * bst;
  const wallX = 150;
  const wallW = 70;
  const topY = 70;
  const botY = EDGE_H - 10;
  // Edge profile, drawn on the top of the wall: left = outside of the shell.
  let edge: string;
  let contactW: number;
  switch (profile) {
    case 'single45':
      edge = `M${wallX} ${topY + 34} L${wallX + wallW - 6} ${topY} L${wallX + wallW} ${topY + 3}`;
      contactW = 4;
      break;
    case 'double45':
      edge = `M${wallX} ${topY + 30} L${wallX + 48} ${topY} L${wallX + wallW} ${topY + 14}`;
      contactW = 6;
      break;
    case 'round':
      edge = `M${wallX} ${topY + 28} Q${wallX + 10} ${topY + 2} ${wallX + 34} ${topY} Q${wallX + 60} ${topY + 2} ${wallX + wallW} ${topY + 20}`;
      contactW = 22;
      break;
    default:
      edge = `M${wallX} ${topY + 22} Q${wallX + 18} ${topY + 2} ${wallX + 36} ${topY} Q${wallX + 58} ${topY + 2} ${wallX + wallW} ${topY + 16}`;
      contactW = 34;
  }
  const peakX = profile === 'single45' ? wallX + wallW - 6 : profile === 'double45' ? wallX + 48 : wallX + 35;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${EDGE_H}`}>
      <Rect x={0} y={0} width={W} height={EDGE_H} fill={ink.bg} />
      <Defs>
        <LinearGradient id="wallG" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={ink.shellDark} />
          <Stop offset="0.5" stopColor={ink.shellLight} />
          <Stop offset="1" stopColor={ink.shellDark} />
        </LinearGradient>
      </Defs>
      {/* the shell wall, cut across, with its plies */}
      <Path d={`${edge} L${wallX + wallW} ${botY} L${wallX} ${botY} Z`} fill="url(#wallG)" stroke={ink.shellDark} strokeWidth={0.8} />
      {[10, 20, 30, 40, 50, 60].map((d) => (
        <Line key={d} x1={wallX + d} y1={topY + 36} x2={wallX + d} y2={botY - 2} stroke={ink.ply} strokeWidth={0.5} />
      ))}
      {/* The hardware beside the wall, in true ORDER though not to the wall's
          scale (clash sweep 2026-10-10: the lug floated off the shell and the
          flesh hoop sat on top of the hoop). Real parts: a 7 mm wall; the head's
          collar 2–3 mm outside the shell; the flesh hoop at the collar's foot;
          the hoop's shelf pressing DOWN on the flesh hoop, its rim standing
          above the head; a 5.5 mm rod from the hoop's ear into the lug; the lug
          screwed to the shell's outer face through the wall. */}
      {/* the head film over the edge, its collar down the outside of the
          shell to the flesh hoop */}
      <Path d={`M${wallX - 10} ${topY + 2} L${wallX + wallW + 20} ${topY + 2}`} stroke={ink.head} strokeWidth={3} strokeLinecap="round" />
      <Path d={`M${wallX - 10} ${topY + 2} Q${wallX - 16} ${topY + 2} ${wallX - 16} ${topY + 9} L${wallX - 16} ${topY + 26}`} stroke={ink.head} strokeWidth={3} fill="none" />
      <Rect x={wallX - 21} y={topY + 24} width={10} height={9} rx={2.5} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
      {/* the hoop: rim above the head, its wall outside the flesh hoop, the
          shelf bearing on the flesh hoop, the ear out at its foot */}
      <Path
        d={`M${wallX - 36} ${topY - 5} Q${wallX - 34} ${topY - 10} ${wallX - 28} ${topY - 9} L${wallX - 25} ${topY - 9} L${wallX - 25} ${topY + 20} L${wallX - 15} ${topY + 20} L${wallX - 15} ${topY + 24} L${wallX - 25} ${topY + 24} L${wallX - 25} ${topY + 40} L${wallX - 29} ${topY + 40} L${wallX - 29} ${topY - 5} Z`}
        fill={ink.metal}
        stroke={ink.metalDark}
        strokeWidth={0.6}
      />
      <Rect x={wallX - 50} y={topY + 38} width={25} height={7} rx={2} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
      {/* the rod: its square head on a washer on the ear, down into the lug */}
      <Line x1={wallX - 39} y1={topY + 45} x2={wallX - 39} y2={botY - 46} stroke={ink.metal} strokeWidth={2.4} />
      <Rect x={wallX - 44} y={topY + 35} width={10} height={3} rx={1} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
      <Rect x={wallX - 42.5} y={topY + 28} width={7} height={7} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
      {/* the lug: its body round the rod's nut, its base screwed flat to the
          shell's outer face (a gasket between), the screw through the wall */}
      <Rect x={wallX - 33} y={botY - 46} width={33} height={28} rx={3} fill={ink.metalDark} stroke={ink.metalDark} strokeWidth={0.6} />
      <Rect x={wallX - 48} y={botY - 50} width={18} height={36} rx={5} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
      <Line x1={wallX - 2} y1={botY - 45} x2={wallX - 2} y2={botY - 19} stroke="#151517" strokeWidth={2.5} />
      <Line x1={wallX - 14} y1={botY - 32} x2={wallX + wallW} y2={botY - 32} stroke={ink.metalDark} strokeWidth={1.6} />
      <Rect x={wallX + wallW} y={botY - 36} width={3} height={8} rx={1} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.4} />
      {/* contact zone */}
      <Line x1={peakX - contactW / 2} y1={topY + 4.5} x2={peakX + contactW / 2} y2={topY + 4.5} stroke={ink.amber} strokeWidth={2.5} />
      <SvgText x={peakX} y={topY - 8} fontSize={fs} fill={ink.amber} textAnchor="middle" fontFamily={fonts.barlowMedium}>contact</SvgText>
      <SvgText x={wallX + wallW + 26} y={topY + 6} fontSize={fs} fill={ink.text} fontFamily={fonts.barlowMedium}>head (inside)</SvgText>
      <SvgText x={wallX + wallW + 26} y={topY + 60} fontSize={fs} fill={ink.text} fontFamily={fonts.barlowMedium}>shell wall</SvgText>
      <SvgText x={wallX - 60} y={botY - 50} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>rod</SvgText>
      <SvgText x={wallX - 60} y={topY + 32} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>hoop</SvgText>
      <SvgText x={wallX - 60} y={botY - 24} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>lug</SvgText>
      {tiny ? null : <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>BEARING EDGE · CROSS-SECTION</SvgText>}
      {tiny ? null : <SvgText x={W / 2} y={EDGE_H - 2} fontSize={f2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{EDGES.find((e) => e.id === profile)?.label.toUpperCase()}</SvgText>}
    </Svg>
  );
}

/* ── snare side view (Chapter 5) ─────────────────────────────────────────── */

export const SNARE_H = 200;
export const SNARE_ASPECT = W / SNARE_H;

/** A small two-tick pitch ladder beside a shell: where the batter and the
 *  other head sit, so the BATTER and SNARE SIDE / front-head faders move
 *  something on the glass. Log scale over [lo, hi] Hz. */
function PitchLadder({ x, top, bot, lo, hi, ticks, bst = 1 }: { x: number; top: number; bot: number; lo: number; hi: number; ticks: { hz: number; label: string; color: string }[]; bst?: number }) {
  const fsS = FONT_S * bst;
  const yOf = (hz: number) => bot - (Math.log2(Math.max(lo, Math.min(hi, hz)) / lo) / Math.log2(hi / lo)) * (bot - top);
  return (
    <G>
      <Line x1={x} y1={top} x2={x} y2={bot} stroke={ink.stroke} strokeWidth={1} />
      <SvgText x={x} y={top - 5} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>pitch</SvgText>
      {ticks.map((t) => (
        <G key={t.label}>
          <Line x1={x - 6} y1={yOf(t.hz)} x2={x + 6} y2={yOf(t.hz)} stroke={t.color} strokeWidth={2} />
          <SvgText x={x + 9} y={yOf(t.hz) + 4} fontSize={fsS} fill={t.color} fontFamily={fonts.mono}>{t.label}</SvgText>
        </G>
      ))}
    </G>
  );
}

/** The head's edge-on glow while the drum sounds: a soft bar over the head
 *  line whose opacity follows the measured envelope. */
function HeadGlow({ x, y, w, h, sync, s }: { x: number; y: number; w: number; h: number; sync?: SoundSync; s: number }) {
  const zero = useSharedValue(0);
  const p = sync?.progress ?? zero;
  const on = !!sync?.playing;
  const env = sync?.envDb ?? [];
  const style = useAnimatedStyle(() => ({ opacity: on ? envAmpAt(env, p.value) * 0.7 : 0 }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x * s, top: y * s, width: w * s, height: h * s, borderRadius: 3 * s, backgroundColor: '#fff3c4' }, style]} />;
}

/** The snare from the side, CUT through its axis: the steel shell with its
 *  centre bead and rolled edges, both heads, the hoops, lugs and rods at the
 *  silhouettes, and the 20-strand wires under the snare-side head on their
 *  straps to the strainer (player's side, left) and the butt plate. The
 *  lever and the wire-to-head gap follow the strainer setting; the stick's
 *  angle follows the STROKE; the ladder shows where the batter and the
 *  snare-side head sit; the batter glows with the hit. */
export function SnareStage({ width, height, strainer, snareSideCents, playing, batterHz, strike = 0.7, sync }: { width: number; height: number; strainer: number; snareSideCents: number; playing?: boolean; batterHz?: number; strike?: number; sync?: SoundSync }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  // 14 × 5.5 in (355.6 × 139.7 mm) at k = 0.675 units/mm: 240 × 94 units.
  // Steel shell 1.0 mm; wires 330 mm long (13 in), 20 strands, 75 mm wide;
  // strainer body ≈ 22 × 56 mm with a 48 mm lever; butt plate ≈ 15 × 34 mm.
  const x0 = 60;
  const x1 = 300;
  const cx = (x0 + x1) / 2;
  const k = (x1 - x0) / 355.6;
  const D = 139.7;
  const yT = 44;
  const yB = yT + D * k;
  const tSh = 1.0;
  const s = Math.max(0, Math.min(1, strainer));
  const on = Math.min(1, s / 0.1);
  // Wires drop ≈ 8 mm when thrown off and lie ≈ 1 mm under the head when tight.
  const gap = (1 + 7 * (1 - s)) * k;
  const lever = -110 * (1 - on); // ON: the lever up along the body; OFF: swung out and down
  const knobOut = (2 + 6 * (1 - s)) * k; // the tension knob backs out as the wires loosen
  const sc = width / W;
  const stickA = -12 - 48 * Math.max(0, Math.min(1, strike)); // a ghost note barely lifts the stick; a rimshot comes from high up
  const snareHz = batterHz != null ? batterHz * Math.pow(2, snareSideCents / 1200) : null;
  const corners = ([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([side, sg]) => ({ xShell: side < 0 ? x0 : x1, yHead: sg > 0 ? yT : yB, side, s: sg, k }));
  const xi0 = x0 + tSh * k;
  const xi1 = x1 - tSh * k;
  const yBead = yT + (D / 2) * k;
  // The wire set: end plates at ±165 mm, strands under the head.
  const wx0 = cx - 165 * k;
  const wx1 = cx + 165 * k;
  const wy = yB + gap;
  const sag = playing ? 2.4 : 0;
  // Strainer (left silhouette, outward = −x): body, knob, lever pivot.
  const sx = (u: number) => x0 - u * k;
  const sy = (v: number) => yT + v * k;
  const pivot = { x: sx(25), y: sy(84) };
  const strap = (xs: number, ys: number, xe: number) => `M${xs} ${ys} L${xs} ${yB + 12.5 * k} Q${xs} ${yB + 14 * k} ${xs + Math.sign(xe - xs) * 3} ${yB + 14 * k} L${xe} ${wy + 1}`;
  return (
    <View style={{ width, height }}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${SNARE_H}`}>
      <Rect x={0} y={0} width={W} height={SNARE_H} fill={ink.bg} />
      <DrumSvgDefs />
      {/* the far inner wall of the steel shell, its bead a groove across */}
      <Rect x={xi0} y={yT} width={xi1 - xi0} height={yB - yT} fill="url(#dtCavitySteel)" />
      <Line x1={xi0} y1={yBead - 2.6} x2={xi1} y2={yBead - 2.6} stroke="#1a1b1f" strokeWidth={1} />
      <Line x1={xi0} y1={yBead + 2.2} x2={xi1} y2={yBead + 2.2} stroke="#8d939e" strokeWidth={0.6} opacity={0.7} />
      <Rect x={xi0} y={yT} width={xi1 - xi0} height={10} fill="#000" opacity={0.3} />
      {/* far halves of both hoops, beyond the heads */}
      <HoopFar x0={x0 + 3 * k} x1={x1 - 3 * k} yHead={yT} s={1} k={k} />
      <HoopFar x0={x0 + 3 * k} x1={x1 - 3 * k} yHead={yB} s={-1} k={k} />
      {/* heads: coated batter, thin clear snare-side head */}
      <Line x1={x0 + 0.8} y1={yT} x2={x1 - 0.8} y2={yT} stroke={ink.head} strokeWidth={2} />
      <Line x1={x0 + 0.8} y1={yB} x2={x1 - 0.8} y2={yB} stroke={ink.headReso} strokeWidth={1.4} />
      {corners.map((pl, i) => <Collar key={i} pl={pl} peakU={-0.4} color={i < 2 ? ink.head : ink.headReso} />)}
      {/* the steel wall cut through: rolled edges top and bottom, the bead */}
      {([-1, 1] as const).map((side) => {
        const xo = side < 0 ? x0 : x1;
        const xin = xo - side * 1.2;
        const bead = side * 2 * k;
        const d = `M${xin} ${yT + 1.6} L${xin} ${yBead - 4} L${xo + bead} ${yBead - 2} L${xo + bead} ${yBead + 2} L${xin} ${yBead + 4} L${xin} ${yB - 1.6} L${xo} ${yB - 1.6} L${xo} ${yBead + 3} L${xo + bead} ${yBead + 1.4} L${xo + bead} ${yBead - 1.4} L${xo} ${yBead - 3} L${xo} ${yT + 1.6} Z`;
        return (
          <G key={side}>
            <Path d={d} fill="#c6cad3" stroke="#3a3d44" strokeWidth={0.4} />
            <Circle cx={xo + side * 0.4} cy={yT + 1.2} r={1.4} fill="#d9dde5" stroke="#3a3d44" strokeWidth={0.4} />
            <Circle cx={xo + side * 0.4} cy={yB - 1.2} r={1.4} fill="#d9dde5" stroke="#3a3d44" strokeWidth={0.4} />
          </G>
        );
      })}
      {/* lugs (they sit either side of the strainer and the butt on the shell) */}
      {corners.map((pl, i) => <LugCut key={i} pl={pl} tShell={tSh} />)}
      {corners.map((pl, i) => <RodCut key={i} pl={pl} vEnd={HW.lugTop + 2} />)}
      {corners.map((pl, i) => <HoopCut key={i} pl={pl} />)}
      {/* the strainer (throw-off): mounting plate, body, tension knob, lever */}
      <Rect x={sx(3)} y={sy(30)} width={3 * k} height={65 * k} rx={1} fill="#4a4e57" />
      <Path d={`M${sx(3)} ${sy(36)} L${sx(22)} ${sy(38)} Q${sx(25)} ${sy(39)} ${sx(25)} ${sy(43)} L${sx(25)} ${sy(88)} Q${sx(25)} ${sy(92)} ${sx(21)} ${sy(92)} L${sx(3)} ${sy(92)} Z`} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.5} />
      <Rect x={sx(16.5)} y={sy(36) - knobOut} width={5 * k} height={knobOut + 1} fill="#9aa0ab" />
      <Rect x={sx(21)} y={sy(36) - knobOut - 10 * k} width={14 * k} height={10 * k} rx={2 * k} fill="#1d1e22" stroke="#5d616c" strokeWidth={0.5} />
      <G transform={`translate(${pivot.x},${pivot.y}) rotate(${lever})`}>
        <Rect x={-3.5 * k} y={-48 * k} width={7 * k} height={48 * k} rx={3.5 * k} fill={ink.amber} stroke="#7a5a00" strokeWidth={0.4} />
      </G>
      <Circle cx={pivot.x} cy={pivot.y} r={2.4} fill="#2a2c32" stroke="#c8ccd4" strokeWidth={0.5} />
      {/* the butt plate (right silhouette) */}
      <Rect x={x1} y={yT + (D - 50) * k} width={3 * k} height={40 * k} rx={1} fill="#4a4e57" />
      <Rect x={x1 + 3 * k} y={yT + (D - 48) * k} width={15 * k} height={34 * k} rx={2.5 * k} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.5} />
      {/* straps from the strainer's slide and the butt plate, under the hoop, to the wire end plates */}
      <Path d={strap(sx(12), sy(92), wx0)} stroke="#1c1c20" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
      <Path d={strap(x1 + 10 * k, yT + (D - 14) * k, wx1)} stroke="#1c1c20" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
      {/* the wires: coiled strands seen side-on, an end plate at each end */}
      {[0, 1, 2, 3].map((n) => (
        <Path key={n} d={`M${wx0 + 3} ${wy + 0.6 + n * 0.75} Q${cx} ${wy + 0.6 + n * 0.75 + sag} ${wx1 - 3} ${wy + 0.6 + n * 0.75}`} stroke={n % 2 ? '#8d939e' : ink.metalLight} strokeWidth={0.8} fill="none" strokeDasharray={n % 2 ? '1.2 0.6' : undefined} opacity={0.95} />
      ))}
      <Rect x={wx0 - 2} y={wy - 0.4} width={6} height={4} rx={0.8} fill="#b9bdc6" stroke="#2a2c32" strokeWidth={0.4} />
      <Rect x={wx1 - 4} y={wy - 0.4} width={6} height={4} rx={0.8} fill="#b9bdc6" stroke="#2a2c32" strokeWidth={0.4} />
      {/* the stick: its height above the head follows the STROKE */}
      <StickSvg x={cx + 30} y={yT - 1 - (HW.beadD * k) / 2} deg={stickA} len={170} k={k} />
      {/* the pitch ladder */}
      {batterHz != null && snareHz != null ? <PitchLadder x={W - 22} top={yT + 6} bot={168} lo={120} hi={700} ticks={[{ hz: batterHz, label: 'B', color: ink.cyan }, { hz: snareHz, label: 'S', color: ink.green }]} bst={bst} /> : null}
      {/* labels */}
      <SvgText x={x0 - 10} y={yT - 8} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>batter</SvgText>
      <SvgText x={x1 - 24} y={178} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>snare-side head</SvgText>
      <SvgText x={cx} y={wy + 15} fontSize={fs} fill={ink.metalLight} textAnchor="middle" fontFamily={fonts.barlowMedium}>wires</SvgText>
      <SvgText x={34} y={178} fontSize={fs} fill={ink.amber} fontFamily={fonts.barlowMedium}>strainer · {s < 0.1 ? 'OFF' : s < 0.4 ? 'loose' : s < 0.7 ? 'medium' : 'tight (choke)'}</SvgText>
      <SvgText x={x1 + 6} y={162} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>butt plate</SvgText>
      {tiny ? null : <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>14" SNARE · SIDE VIEW</SvgText>}
      {tiny ? null : <SvgText x={W - 6} y={14} fontSize={fs} fill={ink.cyan} textAnchor="end" fontFamily={fonts.mono}>S {snareSideCents >= 0 ? '+' : ''}{snareSideCents.toFixed(0)} ¢ vs B</SvgText>}
      {tiny ? null : <SvgText x={W / 2 - 20} y={SNARE_H - 6} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>wires follow the snare-side head · stick = stroke</SvgText>}
    </Svg>
    <HeadGlow x={x0 - 6} y={yT - 5} w={x1 - x0 + 12} h={7} sync={sync} s={sc} />
    </View>
  );
}

/* ── kick side view (Chapter 5) ──────────────────────────────────────────── */

export const KICK_H = 200;
export const KICK_ASPECT = W / KICK_H;

/** The bass drum from the side, CUT through its axis: the 8-ply shell's
 *  walls, the coated batter (right, the player's side) and the ebony front
 *  head with its port, wood hoops with claws and T-rods, the pillow against
 *  the batter, and the pedal clamped to the batter hoop. The beater rests
 *  back by the STRIKE setting and, on ▶ STRIKE, swings about the pedal's
 *  axle into the batter in the first 60 ms of the clip; the batter glows
 *  with the measured envelope; the ladder tick shows where BATTER sits. */
export function KickStage({ width, height, front, damping, strike, batterHz, sync }: { width: number; height: number; front: 'open' | 'ported' | 'removed'; damping: number; strike: number; batterHz?: number; sync?: SoundSync }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  // 22 × 16 in (558.8 × 406.4 mm) at k = 0.25 units/mm: 140 × 102 units.
  // 8-ply 7 mm shell; wood hoops 25 × 8 mm standing 19 mm past the head;
  // claws + T-rods, 8 per head; 5 in (127 mm) offset port. Pedal: base
  // ≈ 120 mm, footboard + heel ≈ 250 mm, toe ≈ 110 mm up at rest, axle
  // ≈ 175 mm above the floor and ≈ 88 mm behind the head, felt beater Ø 65 ×
  // 50 mm meeting the head 1.5 in above centre. Pillow ≈ 110 mm thick.
  const k = 0.25;
  const R = 279.4;
  const D = 406.4;
  const tSh = 7;
  const x0 = 110; // front head (audience side)
  const x1 = x0 + D * k; // batter side
  const floorY = 172;
  const hoopOut = R + 3 + 8;
  const cy = floorY - 2 - hoopOut * k; // the hoops clear the floor by ≈ 8 mm on the spurs
  const yT = cy - R * k;
  const yB = cy + R * k;
  const d = Math.max(0, Math.min(1, damping));
  const pillowLen = (0.17 + 0.39 * d) * D;
  const pillowH = 110;
  const restDeg = 20 + 30 * Math.max(0, Math.min(1, strike));
  const sc = width / W;
  const zero = useSharedValue(0);
  const p = sync?.progress ?? zero;
  const on = !!sync?.playing;
  // Upright local frame (the shared parts' frame: batter head at y = 0,
  // walls at x = ±R), turned so the batter faces the pedal: screen =
  // (x1 − y, cy + x).
  const local = `translate(${x1},${cy}) rotate(90)`;
  const corners = ([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([side, sg]) => ({ xShell: side * R * k, yHead: sg > 0 ? 0 : D * k, side, s: sg, k }));
  const port = { a: 6, b: 6 + 127 * k }; // the port's span on the front head, local x (screen y below centre)
  // Pedal geometry (screen).
  const ax = x1 + 22;
  const ay = floorY - 175 * k;
  const strikeY = cy - 38 * k;
  const bw = 50 * k; // beater length along the strike
  const bh = 65 * k; // beater diameter
  const bc = { x: x1 + bw / 2, y: strikeY };
  const toe = { x: x1 + 26, y: floorY - 110 * k };
  const heel = { x: x1 + 82, y: floorY - 2 };
  const ux = (heel.x - toe.x) / Math.hypot(heel.x - toe.x, heel.y - toe.y);
  const uy = (heel.y - toe.y) / Math.hypot(heel.x - toe.x, heel.y - toe.y);
  // The swing: at the strike the beater is at the head; it falls back to rest
  // over the attack — one rotation about the axle (the pivot), never a slide.
  const swingStyle = useAnimatedStyle(() => {
    const t = p.value;
    const kk = on && t < 0.06 ? 1 - t / 0.06 : 0;
    const px = ax * sc - width / 2;
    const py = ay * sc - height / 2;
    return { transform: [{ translateX: px }, { translateY: py }, { rotate: `${-restDeg * kk}deg` }, { translateX: -px }, { translateY: -py }] };
  });
  const beater = (
    <G transform={`rotate(${restDeg}, ${ax}, ${ay})`}>
      <Line x1={ax} y1={ay} x2={bc.x} y2={bc.y + bh / 2 - 1} stroke="#2a2c32" strokeWidth={3.2} strokeLinecap="round" />
      <Line x1={ax} y1={ay} x2={bc.x} y2={bc.y + bh / 2 - 1} stroke="#c8ccd4" strokeWidth={1.8} strokeLinecap="round" />
      {/* the memory-lock collar on the shaft */}
      <Rect x={ax + (bc.x - ax) * 0.55 - 2} y={ay + (bc.y - ay) * 0.55 - 1.4} width={4} height={2.8} rx={0.6} fill="#5d616c" />
      <Rect x={bc.x - bw / 2} y={bc.y - bh / 2} width={bw} height={bh} rx={3} fill="url(#dtFelt)" stroke="#6e6655" strokeWidth={0.5} />
      <Line x1={bc.x - bw / 2 + 1.2} y1={bc.y - bh / 2 + 2} x2={bc.x - bw / 2 + 1.2} y2={bc.y + bh / 2 - 2} stroke="#fffaf0" strokeWidth={0.6} opacity={0.7} />
    </G>
  );
  return (
    <View style={{ width, height }}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${KICK_H}`}>
      <Rect x={0} y={0} width={W} height={KICK_H} fill={ink.bg} />
      <DrumSvgDefs />
      {/* the floor and the drum's soft contact shadow */}
      <Rect x={60} y={floorY} width={250} height={1.2} fill="#2a2c32" />
      <Ellipse cx={(x0 + x1) / 2} cy={floorY + 1} rx={D * k * 0.62} ry={2.4} fill="#000" opacity={0.55} />
      {/* the far spur: its foot ahead of the front hoop */}
      <Line x1={x0 + 30} y1={cy + 10} x2={x0 - 16} y2={floorY - 1} stroke="#2a2c32" strokeWidth={3.4} strokeLinecap="round" />
      <Line x1={x0 + 30} y1={cy + 10} x2={x0 - 16} y2={floorY - 1} stroke="#a3a8b2" strokeWidth={2} strokeLinecap="round" />
      <Rect x={x0 - 19} y={floorY - 2.4} width={6} height={2.4} rx={1} fill="#141518" />
      <G transform={local}>
        {/* the far inner wall seen through the cut, grain along the axis */}
        <Rect x={-(R - tSh) * k} y={0} width={2 * (R - tSh) * k} height={D * k} fill="url(#dtCavityX)" />
        {[0.2, 0.42, 0.62, 0.79, 0.92].flatMap((f) => [f, -f]).map((f) => <Line key={f} x1={f * (R - tSh) * k} y1={1} x2={f * (R - tSh) * k} y2={D * k - 1} stroke="#4a3220" strokeWidth={0.45} opacity={0.55} />)}
        {/* the pillow on the bottom of the shell, against the batter head */}
        {d > 0.02 ? (
          <G>
            <Rect x={(R - tSh - pillowH) * k} y={0.8} width={pillowH * k} height={pillowLen * k} rx={6} fill="url(#dtPillow)" stroke="#8a8270" strokeWidth={0.5} />
            <Line x1={(R - tSh - pillowH / 2) * k} y1={6} x2={(R - tSh - pillowH / 2) * k} y2={pillowLen * k - 6} stroke="#9a917c" strokeWidth={0.6} strokeDasharray="2 2" />
          </G>
        ) : null}
        {/* the far halves of the wood hoops, beyond the heads */}
        <Rect x={-(R + 3) * k} y={-19 * k} width={2 * (R + 3) * k} height={19 * k} fill="url(#dtWood)" opacity={0.45} />
        {front !== 'removed' ? <Rect x={-(R + 3) * k} y={D * k} width={2 * (R + 3) * k} height={19 * k} fill="url(#dtWood)" opacity={0.45} /> : null}
        {/* heads: coated batter; ebony front head, ported or whole */}
        <Line x1={-R * k + 0.6} y1={0} x2={R * k - 0.6} y2={0} stroke={ink.head} strokeWidth={1.8} />
        {front !== 'removed' ? (
          <G>
            {front === 'ported' ? (
              <G>
                <Line x1={-R * k + 0.6} y1={D * k} x2={port.a} y2={D * k} stroke="#2b2f38" strokeWidth={1.8} />
                <Line x1={port.b} y1={D * k} x2={R * k - 0.6} y2={D * k} stroke="#2b2f38" strokeWidth={1.8} />
                {/* the port's reinforcing ring, cut */}
                <Rect x={port.a - 0.8} y={D * k - 1.6} width={1.6} height={3.2} fill={ink.amber} />
                <Rect x={port.b - 0.8} y={D * k - 1.6} width={1.6} height={3.2} fill={ink.amber} />
              </G>
            ) : (
              <Line x1={-R * k + 0.6} y1={D * k} x2={R * k - 0.6} y2={D * k} stroke="#2b2f38" strokeWidth={1.8} />
            )}
          </G>
        ) : null}
        {corners.map((pl, i) => (i < 2 || front !== 'removed' ? <Collar key={i} pl={pl} peakU={-2.1} color={i < 2 ? ink.head : '#2b2f38'} /> : null))}
        {/* the 8-ply wall, cut, its 45° bearing edges */}
        {[corners[0], corners[1]].map((pl, i) => <WallCut key={i} pl={pl} D={D} t={tSh} plies={8} />)}
        {/* lugs, T-rods on claws, and the wood hoops' cut faces */}
        {corners.map((pl, i) => (i < 2 || front !== 'removed' ? (
          <G key={i}>
            <LugCut pl={pl} v0={46} len={30} tShell={tSh} />
            <KickClawRod pl={pl} />
          </G>
        ) : <LugCut key={i} pl={pl} v0={46} len={30} tShell={tSh} />))}
      </G>
      {/* the pedal: base and hoop clamp, frame post with its spring, axle and sprocket, chain, footboard */}
      <Rect x={x1 + 0.5} y={floorY - 2.2} width={32} height={2.2} rx={0.6} fill="#3a3d45" />
      <Path d={`M${x1 + 0.5} ${floorY - 2.2} L${x1 + 0.5} ${floorY - 5} L${x1 + 7} ${floorY - 5} L${x1 + 7} ${floorY - 2.2} Z`} fill="#6b707b" stroke="#1a1b1f" strokeWidth={0.4} />
      <Rect x={ax - 1.8} y={ay} width={3.6} height={floorY - 2.2 - ay} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.4} />
      <Path d={`M${ax + 2.2} ${floorY - 18} ${Array.from({ length: 6 }, (_, i) => `L${ax + (i % 2 ? 2.2 : 5)} ${floorY - 18 - (i + 1) * 2}`).join(' ')}`} stroke="#9aa0ab" strokeWidth={0.8} fill="none" />
      <Path d={`M${toe.x} ${toe.y} L${heel.x} ${heel.y} L${heel.x - uy * 2.2} ${heel.y + ux * 2.2 - 0.4} L${toe.x - uy * 2.2} ${toe.y + ux * 2.2} Z`} fill="url(#dtFoot)" stroke="#111215" strokeWidth={0.5} />
      {Array.from({ length: 9 }, (_, i) => {
        const t = 8 + i * 6;
        return <Line key={i} x1={toe.x + ux * t} y1={toe.y + uy * t} x2={toe.x + ux * t + uy * 1.6} y2={toe.y + uy * t - ux * 1.6} stroke="#111215" strokeWidth={0.6} opacity={0.7} />;
      })}
      <Rect x={heel.x - 10} y={floorY - 2.4} width={14} height={2.4} rx={0.8} fill="#2a2c32" />
      <Circle cx={heel.x - 1} cy={heel.y - 0.6} r={1.6} fill="#9aa0ab" />
      <Line x1={toe.x + 0.6} y1={toe.y} x2={ax + 5} y2={ay + 1} stroke="#2a2c32" strokeWidth={2.4} />
      <Line x1={toe.x + 0.6} y1={toe.y} x2={ax + 5} y2={ay + 1} stroke="#a2a7b1" strokeWidth={1.4} strokeDasharray="1.2 0.8" />
      <Circle cx={ax} cy={ay} r={5.2} fill="#1b1c21" stroke="#6c717c" strokeWidth={0.6} />
      <Circle cx={ax} cy={ay} r={1.8} fill="#d9dde5" />
      {/* the pitch ladder on the batter side */}
      {batterHz != null ? <PitchLadder x={W - 30} top={yT + 14} bot={yB - 30} lo={40} hi={110} ticks={[{ hz: batterHz, label: `${batterHz.toFixed(0)}`, color: ink.cyan }]} bst={bst} /> : null}
      {/* labels */}
      {d > 0.02 ? <SvgText x={x1 - (pillowLen * k) / 2} y={cy + (R - tSh - pillowH / 2) * k + 4} fontSize={fs} fill="#3a3528" textAnchor="middle" fontFamily={fonts.barlowMedium}>pillow</SvgText> : null}
      {front === 'ported' ? <SvgText x={x0 - 22} y={cy + (port.a + port.b) / 2 + 4} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>port</SvgText> : null}
      <SvgText x={x1 + 2} y={floorY + 12} fontSize={fs} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>batter</SvgText>
      <SvgText x={x0 - 2} y={floorY + 12} fontSize={fs} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>{front === 'removed' ? 'front head off' : 'front head'}</SvgText>
      <SvgText x={x1 + 52} y={ay - 42} fontSize={fs} fill={ink.text} fontFamily={fonts.barlowMedium}>beater</SvgText>
      {tiny ? null : <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>22" BASS DRUM · SIDE VIEW</SvgText>}
      {tiny ? null : <SvgText x={W / 2} y={KICK_H - 6} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>{front === 'open' ? 'closed front head: full coupling, longest note' : front === 'ported' ? 'ported: less coupling, faster decay, a mic path' : 'no front head: the batter alone, shortest note'}</SvgText>}
    </Svg>
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height }, swingStyle]}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${KICK_H}`}>
        <DrumSvgDefs />
        {beater}
      </Svg>
    </Animated.View>
    <HeadGlow x={x1 - 2} y={yT - 4} w={8} h={yB - yT + 8} sync={sync} s={sc} />
    </View>
  );
}

/** A kick's wood hoop cut at one silhouette (25 mm wide, 8 mm thick, 19 mm
 *  past the head), its claw hooked over the outer edge, and the T-rod from
 *  the claw to the lug (upright local frame, as the shared parts). */
function KickClawRod({ pl }: { pl: { xShell: number; yHead: number; side: -1 | 1; s: 1 | -1; k: number } }) {
  const X = (u: number) => pl.xShell + pl.side * u * pl.k;
  const Y = (v: number) => pl.yHead + pl.s * v * pl.k;
  const rect = (u0: number, u1: number, v0: number, v1: number) => ({ x: Math.min(X(u0), X(u1)), y: Math.min(Y(v0), Y(v1)), width: Math.abs(X(u1) - X(u0)), height: Math.abs(Y(v1) - Y(v0)) });
  const claw = `M${X(10)} ${Y(-17)} L${X(10)} ${Y(-21.5)} L${X(19)} ${Y(-21.5)} L${X(19)} ${Y(-4)} L${X(16.5)} ${Y(-4)} L${X(16.5)} ${Y(-19)} L${X(12)} ${Y(-19)} L${X(12)} ${Y(-17)} Z`;
  return (
    <G>
      {/* the T-rod: from the claw along the shell into the lug */}
      <Rect {...rect(12.3, 17.7, -26, 48)} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.3} />
      {/* the T handle above the claw */}
      <Rect {...rect(5, 25, -31, -26)} rx={1} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.3} />
      {/* the wood hoop, cut */}
      <Rect {...rect(3, 11, -19, 6)} rx={0.6} fill="url(#dtPly)" stroke="#140b05" strokeWidth={0.4} />
      <Path d={claw} fill="#b9bdc6" stroke="#2a2c32" strokeWidth={0.4} />
    </G>
  );
}

/* ── the kit ladder (Chapter 6) ──────────────────────────────────────────── */

export const KIT_H = 210;
/** Kit-ladder drawing scale: design units per mm (both toms true to size). */
const KIT_K = 0.21;
export const KIT_ASPECT = W / KIT_H;

/** Which tom is sounding, for the glow: `both` plays the rack for the first
 *  `switchAt` fraction of the clip, then the floor. */
export type KitSounding = { which: 'rack' | 'floor' | 'both'; switchAt: number } | null;

/** Rack and floor tom side by side with a semitone ladder: each drum's useful
 *  band, its current fundamental, and the interval between them. The
 *  sounding tom's head glows with the hit. */
export function KitStage({ width, height, rackHz, floorHz, verdict, sounding, sync }: { width: number; height: number; rackHz: number; floorHz: number; verdict: 'distinct' | 'close' | 'unbalanced'; sounding?: KitSounding; sync?: SoundSync }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const f2 = F2 * bst;
  const lx = 232; // ladder x
  const top = 26;
  const bot = KIT_H - 26;
  const loHz = 70;
  const hiHz = 320;
  const yOf = (hz: number) => bot - ((Math.log2(hz / loHz) / Math.log2(hiHz / loHz)) * (bot - top));
  const tint = verdict === 'distinct' ? ink.green : verdict === 'close' ? ink.amber : ink.red;
  const sc = width / W;
  const zero = useSharedValue(0);
  const p = sync?.progress ?? zero;
  const on = !!sync?.playing && !!sounding;
  const env = sync?.envDb ?? [];
  const which = sounding?.which ?? 'both';
  const switchAt = sounding?.switchAt ?? 0.5;
  const rackGlow = useAnimatedStyle(() => {
    const t = p.value;
    const lit = which === 'rack' || (which === 'both' && t < switchAt);
    return { opacity: on && lit ? envAmpAt(env, t) * 0.75 : 0 };
  });
  const floorGlow = useAnimatedStyle(() => {
    const t = p.value;
    const lit = which === 'floor' || (which === 'both' && t >= switchAt);
    return { opacity: on && lit ? envAmpAt(env, t) * 0.75 : 0 };
  });
  // True scale for both toms (k = 0.21 units/mm): the 12 × 8 in rack tom
  // (6 lugs a head, on its L-arm) and the 16 × 16 in floor tom (8 lugs, three
  // legs), heads at y = 150 − depth.
  const drum = (cx: number, dIn: number, depthIn: number, label: string, hz: number, legs: boolean) => {
    const h = depthIn * 25.4 * KIT_K;
    const y = 150 - h;
    return (
      <G>
        <ExteriorDrum cx={cx} yHead={y} dIn={dIn} depthIn={depthIn} k={KIT_K} lugs={legs ? 8 : 6} phaseDeg={legs ? 22.5 : 30} legs={legs ? 3 : 0} mount={legs ? null : { from: [-70, depthIn * 25.4 * 0.45], to: [-176, depthIn * 25.4 + 30], floorV: depthIn * 25.4 + 104 }} />
        <SvgText x={cx} y={y - 10} fontSize={fs} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>{label}</SvgText>
        <SvgText x={cx} y={y + h + (legs ? 34 : 16)} fontSize={f2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.mono}>{hz.toFixed(0)} Hz</SvgText>
      </G>
    );
  };
  return (
    <View style={{ width, height }}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${W} ${KIT_H}`}>
      <Rect x={0} y={0} width={W} height={KIT_H} fill={ink.bg} />
      <DrumSvgDefs />
      {drum(54, 12, 8, '12" rack tom', rackHz, false)}
      {drum(143, 16, 16, '16" floor tom', floorHz, true)}
      {/* the ladder */}
      <Line x1={lx} y1={top} x2={lx} y2={bot} stroke={ink.stroke} strokeWidth={1} />
      {[80, 100, 130, 160, 200, 250, 300].map((hz) => (
        <G key={hz}>
          <Line x1={lx - 4} y1={yOf(hz)} x2={lx + 4} y2={yOf(hz)} stroke={ink.dim} strokeWidth={1} />
          <SvgText x={lx + 8} y={yOf(hz) + 4} fontSize={fsS} fill={ink.dim} fontFamily={fonts.mono}>{hz}</SvgText>
        </G>
      ))}
      {/* useful bands */}
      <Rect x={lx - 18} y={yOf(DRUMS.rack.usefulHz[1])} width={10} height={yOf(DRUMS.rack.usefulHz[0]) - yOf(DRUMS.rack.usefulHz[1])} fill="rgba(91,176,255,.25)" />
      <Rect x={lx - 32} y={yOf(DRUMS.floor.usefulHz[1])} width={10} height={yOf(DRUMS.floor.usefulHz[0]) - yOf(DRUMS.floor.usefulHz[1])} fill="rgba(55,224,95,.22)" />
      <SvgText x={lx - 13} y={yOf(DRUMS.rack.usefulHz[1]) - 4} fontSize={fsS} fill={ink.cyan} textAnchor="middle" fontFamily={fonts.barlowMedium}>rack</SvgText>
      <SvgText x={lx - 27} y={yOf(DRUMS.floor.usefulHz[0]) + 12} fontSize={fsS} fill={ink.green} textAnchor="middle" fontFamily={fonts.barlowMedium}>floor</SvgText>
      {/* markers + interval bracket */}
      <Circle cx={lx} cy={yOf(rackHz)} r={4.5} fill={ink.cyan} />
      <Circle cx={lx} cy={yOf(floorHz)} r={4.5} fill={ink.green} />
      <Line x1={lx + 40} y1={yOf(rackHz)} x2={lx + 40} y2={yOf(floorHz)} stroke={tint} strokeWidth={2} />
      <Line x1={lx + 36} y1={yOf(rackHz)} x2={lx + 44} y2={yOf(rackHz)} stroke={tint} strokeWidth={2} />
      <Line x1={lx + 36} y1={yOf(floorHz)} x2={lx + 44} y2={yOf(floorHz)} stroke={tint} strokeWidth={2} />
      <SvgText x={lx + 48} y={(yOf(rackHz) + yOf(floorHz)) / 2 + 4} fontSize={f2} fill={tint} fontFamily={fonts.mono}>{Math.abs(12 * Math.log2(rackHz / floorHz)).toFixed(1)} st</SvgText>
      {tiny ? null : <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>THE TOM RANGE · FUNDAMENTALS</SvgText>}
      <SvgText x={W - 6} y={KIT_H - 6} fontSize={fs} fill={tint} textAnchor="end" fontFamily={fonts.oswaldMedium}>{verdict.toUpperCase()}</SvgText>
    </Svg>
    {/* the sounding tom's head glows with the hit (rack: centre 54, Ø 64; floor: centre 143, Ø 85; heads at 150 − depth) */}
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 19 * sc, top: (150 - 8 * 25.4 * KIT_K - 3) * sc, width: 70 * sc, height: 6 * sc, borderRadius: 3 * sc, backgroundColor: '#fff3c4' }, rackGlow]} />
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (143 - 8 * 25.4 * KIT_K - 3) * sc, top: (150 - 16 * 25.4 * KIT_K - 3) * sc, width: (16 * 25.4 * KIT_K + 6) * sc, height: 6 * sc, borderRadius: 3 * sc, backgroundColor: '#fff3c4' }, floorGlow]} />
    </View>
  );
}
