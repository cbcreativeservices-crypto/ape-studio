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
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${TOP_H}`}>
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
  const x0 = 92;
  const x1 = 292;
  const yT = 40;
  const yB = 160;
  const hi = (p: DrumPart) => (part === p ? ink.amber : null);
  const glow = (p: DrumPart, el: ReactNode) => (part === p ? <G>{el}</G> : <G opacity={0.9}>{el}</G>);
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${ANAT_H}`}>
      <Rect x={0} y={0} width={W} height={ANAT_H} fill={ink.bg} />
      <Defs>
        <LinearGradient id="shellG" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={ink.shellDark} />
          <Stop offset="0.5" stopColor={ink.shellLight} />
          <Stop offset="1" stopColor={ink.shellDark} />
        </LinearGradient>
      </Defs>
      {/* air */}
      {glow('air', (
        <G>
          <Rect x={x0 + 8} y={yT + 6} width={x1 - x0 - 16} height={yB - yT - 12} fill={part === 'air' ? 'rgba(91,176,255,.18)' : 'rgba(91,176,255,.05)'} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => (
            <Circle key={k} cx={x0 + 24 + (k % 6) * 36} cy={yT + 30 + Math.floor(k / 6) * 60 + (k % 2) * 14} r={1.6} fill={part === 'air' ? ink.cyan : '#2a3a4a'} />
          ))}
          <SvgText x={(x0 + x1) / 2} y={(yT + yB) / 2 + 4} fontSize={fs} fill={hi('air') ?? ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>enclosed air</SvgText>
        </G>
      ))}
      {/* shell walls with plies */}
      {glow('shell', (
        <G>
          <Rect x={x0} y={yT + 4} width={9} height={yB - yT - 8} fill="url(#shellG)" stroke={hi('shell') ?? ink.shellDark} strokeWidth={hi('shell') ? 1.6 : 0.6} />
          <Rect x={x1 - 9} y={yT + 4} width={9} height={yB - yT - 8} fill="url(#shellG)" stroke={hi('shell') ?? ink.shellDark} strokeWidth={hi('shell') ? 1.6 : 0.6} />
          {[2, 4, 6].map((d) => (
            <G key={d}>
              <Line x1={x0 + d} y1={yT + 5} x2={x0 + d} y2={yB - 5} stroke={ink.ply} strokeWidth={0.5} />
              <Line x1={x1 - d} y1={yT + 5} x2={x1 - d} y2={yB - 5} stroke={ink.ply} strokeWidth={0.5} />
            </G>
          ))}
        </G>
      ))}
      {/* bearing edges: the 45° cuts at each end of each wall */}
      {glow('edge', (
        <G>
          {[[x0, yT + 4, 1], [x1 - 9, yT + 4, -1], [x0, yB - 4, 1], [x1 - 9, yB - 4, -1]].map(([x, y, s], k) => {
            const top = k < 2;
            const pts = top ? `${x},${y} ${x + 9},${y} ${x + (s > 0 ? 7 : 2)},${y - 5}` : `${x},${y} ${x + 9},${y} ${x + (s > 0 ? 7 : 2)},${y + 5}`;
            return <Polygon key={k} points={pts} fill={hi('edge') ?? ink.shellLight} stroke={hi('edge') ?? ink.shellDark} strokeWidth={0.6} />;
          })}
        </G>
      ))}
      {/* heads */}
      {glow('batter', <Rect x={x0 - 6} y={yT - 3} width={x1 - x0 + 12} height={3} fill={hi('batter') ?? ink.head} />)}
      {glow('reso', <Rect x={x0 - 6} y={yB} width={x1 - x0 + 12} height={3} fill={hi('reso') ?? ink.headReso} />)}
      {/* hoops */}
      {glow('hoop', (
        <G>
          <Rect x={x0 - 12} y={yT - 8} width={8} height={14} rx={1} fill={hi('hoop') ?? ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
          <Rect x={x1 + 4} y={yT - 8} width={8} height={14} rx={1} fill={hi('hoop') ?? ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
          <Rect x={x0 - 12} y={yB - 6} width={8} height={14} rx={1} fill={hi('hoop') ?? ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
          <Rect x={x1 + 4} y={yB - 6} width={8} height={14} rx={1} fill={hi('hoop') ?? ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
        </G>
      ))}
      {/* rods + lugs */}
      {glow('rods', (
        <G>
          {[x0 - 8, x1 + 8].map((x) => (
            <G key={x}>
              <Line x1={x} y1={yT - 12} x2={x} y2={yT + 40} stroke={hi('rods') ?? ink.metal} strokeWidth={2.2} />
              <Rect x={x - 4} y={yT - 16} width={8} height={5} fill={hi('rods') ?? ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
              <Line x1={x} y1={yB + 12} x2={x} y2={yB - 40} stroke={hi('rods') ?? ink.metal} strokeWidth={2.2} />
              <Rect x={x - 4} y={yB + 11} width={8} height={5} fill={hi('rods') ?? ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
            </G>
          ))}
        </G>
      ))}
      {glow('lugs', (
        <G>
          {[x0 - 8, x1 + 8].map((x) => (
            <Rect key={x} x={x - 6} y={(yT + yB) / 2 - 22} width={12} height={44} rx={4} fill={hi('lugs') ?? 'url(#lugGradA)'} stroke={ink.metalDark} strokeWidth={0.7} />
          ))}
          <Defs>
            <LinearGradient id="lugGradA" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={ink.metalDark} />
              <Stop offset="0.5" stopColor={ink.metalLight} />
              <Stop offset="1" stopColor={ink.metalDark} />
            </LinearGradient>
          </Defs>
        </G>
      ))}
      {/* stick */}
      <Line x1={x1 - 60} y1={yT - 40} x2={x1 - 20} y2={yT - 8} stroke="#c9a06a" strokeWidth={4} strokeLinecap="round" />
      <Circle cx={x1 - 18} cy={yT - 6} r={4} fill="#e9dcc0" />
      {/* labels */}
      <SvgText x={x0 - 16} y={yT - 10} fontSize={fs} fill={hi('batter') ?? ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>batter head</SvgText>
      <SvgText x={x0 - 16} y={yB + 8} fontSize={fs} fill={hi('reso') ?? ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>resonant head</SvgText>
      <SvgText x={x1 + 18} y={(yT + yB) / 2 + 4} fontSize={fs} fill={hi('lugs') ?? ink.text} fontFamily={fonts.barlowMedium}>lug</SvgText>
      <SvgText x={x1 + 18} y={yT + 30} fontSize={fs} fill={hi('rods') ?? ink.text} fontFamily={fonts.barlowMedium}>rod</SvgText>
      <SvgText x={x1 + 18} y={yT - 2} fontSize={fs} fill={hi('hoop') ?? ink.text} fontFamily={fonts.barlowMedium}>hoop</SvgText>
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
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${EDGE_H}`}>
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
      {/* the head film draped over the edge, its collar down the outside */}
      <Path d={`M${wallX - 30} ${topY + 2} L${wallX + wallW + 20} ${topY + 2}`} stroke={ink.head} strokeWidth={3} strokeLinecap="round" />
      <Path d={`M${wallX - 30} ${topY + 2} Q${wallX - 44} ${topY + 2} ${wallX - 44} ${topY + 16} L${wallX - 44} ${topY + 34}`} stroke={ink.head} strokeWidth={3} fill="none" />
      {/* hoop pulling the collar down, a rod and the lug */}
      <Rect x={wallX - 56} y={topY + 20} width={14} height={16} rx={2} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
      <Line x1={wallX - 49} y1={topY + 36} x2={wallX - 49} y2={botY - 30} stroke={ink.metal} strokeWidth={2.4} />
      <Rect x={wallX - 53} y={topY + 14} width={8} height={5} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
      <Rect x={wallX - 56} y={botY - 44} width={14} height={30} rx={4} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.6} />
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

/** The snare from the side: shell, both hoops, rods and lugs, the snare
 *  wires under the bottom head on their strainer and butt plate. The lever
 *  and the wire-to-head gap follow the strainer setting; the stick's angle
 *  follows the STROKE; the ladder shows where the batter and the snare-side
 *  head sit; the batter glows with the hit. */
export function SnareStage({ width, height, strainer, snareSideCents, playing, batterHz, strike = 0.7, sync }: { width: number; height: number; strainer: number; snareSideCents: number; playing?: boolean; batterHz?: number; strike?: number; sync?: SoundSync }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const x0 = 60;
  const x1 = 300;
  const yT = 44;
  const yB = 128;
  const s = Math.max(0, Math.min(1, strainer));
  const gap = 10 - 8 * s; // wires float at 0, pressed in at 1
  const lever = -60 + 70 * s; // throw-off lever angle
  const sc = width / W;
  const stickA = -12 - 48 * Math.max(0, Math.min(1, strike)); // a ghost note barely lifts the stick; a rimshot comes from high up
  const snareHz = batterHz != null ? batterHz * Math.pow(2, snareSideCents / 1200) : null;
  return (
    <View style={{ width, height }}>
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${SNARE_H}`}>
      <Rect x={0} y={0} width={W} height={SNARE_H} fill={ink.bg} />
      <Defs>
        <LinearGradient id="snShell" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#cfd3da" />
          <Stop offset="0.5" stopColor="#8d929b" />
          <Stop offset="1" stopColor="#5d6168" />
        </LinearGradient>
      </Defs>
      {/* shell (a metal snare) */}
      <Rect x={x0} y={yT + 4} width={x1 - x0} height={yB - yT - 8} fill="url(#snShell)" stroke={ink.metalDark} strokeWidth={0.8} />
      {/* heads */}
      <Rect x={x0 - 6} y={yT - 3} width={x1 - x0 + 12} height={3} fill={ink.head} />
      <Rect x={x0 - 6} y={yB} width={x1 - x0 + 12} height={2.4} fill={ink.headReso} />
      {/* the stick: its height above the head follows the STROKE */}
      <G transform={`translate(${(x0 + x1) / 2 + 30},${yT - 6}) rotate(${stickA})`}>
        <Line x1={0} y1={0} x2={78} y2={0} stroke="#c9a06a" strokeWidth={4} strokeLinecap="round" />
        <Circle cx={-2} cy={0} r={4} fill="#e9dcc0" />
      </G>
      {/* the pitch ladder */}
      {batterHz != null && snareHz != null ? <PitchLadder x={W - 22} top={yT + 6} bot={yB + 40} lo={120} hi={700} ticks={[{ hz: batterHz, label: 'B', color: ink.cyan }, { hz: snareHz, label: 'S', color: ink.green }]} bst={bst} /> : null}
      {/* hoops, rods, lugs */}
      {[x0 + 20, x0 + 80, x0 + 140, x0 + 200].map((x) => (
        <G key={x}>
          <Rect x={x - 4} y={yT - 8} width={8} height={12} rx={1} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.5} />
          <Line x1={x} y1={yT + 4} x2={x} y2={yT + 30} stroke={ink.metal} strokeWidth={2} />
          <Rect x={x - 6} y={(yT + yB) / 2 - 14} width={12} height={28} rx={3} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.6} />
          <Line x1={x} y1={yB - 4} x2={x} y2={yB - 30} stroke={ink.metal} strokeWidth={2} />
          <Rect x={x - 4} y={yB - 4} width={8} height={12} rx={1} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.5} />
        </G>
      ))}
      {/* snare wires: coiled strands under the bottom head, between strainer and butt */}
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Path key={k} d={`M${x0 + 26} ${yB + 4 + gap + k * 1.6} Q${(x0 + x1) / 2} ${yB + 4 + gap + k * 1.6 + (playing ? 3 : 0)} ${x1 - 26} ${yB + 4 + gap + k * 1.6}`} stroke={ink.metalLight} strokeWidth={0.9} fill="none" opacity={0.9 - k * 0.08} />
      ))}
      {/* strainer (throw-off) on the left, butt plate on the right */}
      <Rect x={x0 - 2} y={yB + 2} width={22} height={30} rx={3} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.7} />
      <Circle cx={x0 + 9} cy={yB + 24} r={4} fill={ink.metalDark} />
      <G transform={`translate(${x0 + 9},${yB + 24}) rotate(${lever})`}>
        <Rect x={-2.5} y={-26} width={5} height={26} rx={2} fill={ink.amber} />
      </G>
      <Rect x={x1 - 20} y={yB + 2} width={22} height={22} rx={3} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.7} />
      {/* labels */}
      <SvgText x={x0 - 10} y={yT - 8} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>batter</SvgText>
      <SvgText x={x1 - 24} y={yB + 50} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>snare-side head</SvgText>
      <SvgText x={x0 + 100} y={yB + 26 + gap} fontSize={fs} fill={ink.metalLight} fontFamily={fonts.barlowMedium}>wires</SvgText>
      <SvgText x={x0 + 30} y={yB + 48} fontSize={fs} fill={ink.amber} fontFamily={fonts.barlowMedium}>strainer · {s < 0.1 ? 'OFF' : s < 0.4 ? 'loose' : s < 0.7 ? 'medium' : 'tight (choke)'}</SvgText>
      <SvgText x={x1 - 8} y={yB + 36} fontSize={fs} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>butt plate</SvgText>
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

/** The bass drum from the side. The beater's resting angle follows BEATER;
 *  on ▶ STRIKE it swings into the batter in the first 60 ms of the clip and
 *  the batter glows with the measured envelope; the ladder tick shows where
 *  BATTER sits. */
export function KickStage({ width, height, front, damping, strike, batterHz, sync }: { width: number; height: number; front: 'open' | 'ported' | 'removed'; damping: number; strike: number; batterHz?: number; sync?: SoundSync }) {
  // The 9 pt floor on a short phone (drumEngine.textBoost): 1 at or above 1 : 1.
  const bst = textBoost(width);
  const tiny = tinyFit(width);
  const fs = FONT * bst;
  const fsS = FONT_S * bst;
  const x0 = 70; // front head (audience side)
  const x1 = 250; // batter side
  const yT = 28;
  // The head labels sit at yB + 20 and the caption at KICK_H − 6: the shell
  // ends here so the two never share a line.
  const yB = 160;
  const d = Math.max(0, Math.min(1, damping));
  const pillowW = 30 + 70 * d;
  const beaterA = -20 - 30 * strike;
  const sc = width / W;
  const zero = useSharedValue(0);
  const p = sync?.progress ?? zero;
  const on = !!sync?.playing;
  // The swing: the beater travels to the head over the attack and comes back.
  const swingStyle = useAnimatedStyle(() => {
    const t = p.value;
    const k = on && t < 0.06 ? 1 - t / 0.06 : 0;
    return { transform: [{ translateX: -k * 22 * sc }, { translateY: k * 6 * sc }] };
  });
  const beater = (
    <G transform={`translate(${x1 + 30},${yB - 70}) rotate(${beaterA})`}>
      <Line x1={0} y1={0} x2={0} y2={-56 + 10} stroke={ink.metalLight} strokeWidth={2.4} />
      <Circle cx={0} cy={-56 + 6} r={9} fill="#8a7a63" stroke="#5a4e3f" strokeWidth={0.8} />
    </G>
  );
  return (
    <View style={{ width, height }}>
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${KICK_H}`}>
      <Rect x={0} y={0} width={W} height={KICK_H} fill={ink.bg} />
      <Defs>
        <LinearGradient id="kShell" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ink.shellLight} />
          <Stop offset="0.5" stopColor={ink.shell} />
          <Stop offset="1" stopColor={ink.shellDark} />
        </LinearGradient>
      </Defs>
      {/* shell on its spurs */}
      <Rect x={x0} y={yT + 4} width={x1 - x0} height={yB - yT - 8} fill="url(#kShell)" stroke={ink.shellDark} strokeWidth={0.8} />
      <Line x1={x0 + 20} y1={yB - 4} x2={x0 + 6} y2={yB + 16} stroke={ink.metal} strokeWidth={2.5} />
      <Line x1={x1 - 20} y1={yB - 4} x2={x1 - 6} y2={yB + 16} stroke={ink.metal} strokeWidth={2.5} />
      {/* pillow inside, against the batter */}
      {d > 0.02 ? <Rect x={x1 - 8 - pillowW} y={yB - 46} width={pillowW} height={38} rx={10} fill="#d8d2c4" opacity={0.9} /> : null}
      {d > 0.02 ? <SvgText x={x1 - 8 - pillowW / 2} y={yB - 24} fontSize={fs} fill="#4a4538" textAnchor="middle" fontFamily={fonts.barlowMedium}>pillow</SvgText> : null}
      {/* batter head + hoop */}
      <Rect x={x1} y={yT - 4} width={4} height={yB - yT + 8} fill={ink.head} />
      {[yT - 2, (yT + yB) / 2, yB + 2].map((y) => (
        <G key={y}>
          <Rect x={x1 + 4} y={y - 4} width={10} height={8} rx={1} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.5} />
          <Line x1={x1 - 4} y1={y} x2={x1 - 30} y2={y} stroke={ink.metal} strokeWidth={2} />
        </G>
      ))}
      {/* front head: open / ported / removed */}
      {front !== 'removed' ? <Rect x={x0 - 4} y={yT - 4} width={4} height={yB - yT + 8} fill="#1c1c1f" stroke="#444" strokeWidth={0.6} /> : null}
      {front === 'ported' ? <Ellipse cx={x0 - 2} cy={yB - 36} rx={3} ry={14} fill={ink.bg} stroke={ink.amber} strokeWidth={1} /> : null}
      {front === 'ported' ? <SvgText x={x0 - 12} y={yB - 56} fontSize={fs} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>port</SvgText> : null}
      {[yT - 2, (yT + yB) / 2, yB + 2].map((y) => (front !== 'removed' ? (
        <G key={y}>
          <Rect x={x0 - 14} y={y - 4} width={10} height={8} rx={1} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.5} />
          <Line x1={x0 + 4} y1={y} x2={x0 + 30} y2={y} stroke={ink.metal} strokeWidth={2} />
        </G>
      ) : null))}
      {/* pedal; the beater is drawn in the overlay so it can swing */}
      <Rect x={x1 + 18} y={yB + 10} width={70} height={6} rx={2} fill={ink.metalDark} />
      <Path d={`M${x1 + 30} ${yB + 10} L${x1 + 80} ${yB - 2}`} stroke={ink.metal} strokeWidth={3} />
      <Line x1={x1 + 30} y1={yB + 10} x2={x1 + 30} y2={yB - 70} stroke={ink.metal} strokeWidth={3} />
      {/* the pitch ladder on the batter side */}
      {batterHz != null ? <PitchLadder x={W - 30} top={yT + 14} bot={yB - 30} lo={40} hi={110} ticks={[{ hz: batterHz, label: `${batterHz.toFixed(0)}`, color: ink.cyan }]} bst={bst} /> : null}
      {/* labels */}
      <SvgText x={x1 + 2} y={yB + 21} fontSize={fs} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>batter</SvgText>
      <SvgText x={x0 - 2} y={yB + 21} fontSize={fs} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>{front === 'removed' ? 'front head off' : 'front head'}</SvgText>
      <SvgText x={x1 + 60} y={yB - 80} fontSize={fs} fill={ink.text} fontFamily={fonts.barlowMedium}>beater</SvgText>
      {tiny ? null : <SvgText x={6} y={14} fontSize={fs} fill={ink.amber} fontFamily={fonts.oswaldMedium}>22" BASS DRUM · SIDE VIEW</SvgText>}
      {tiny ? null : <SvgText x={W / 2} y={KICK_H - 6} fontSize={fsS} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>{front === 'open' ? 'closed front head: full coupling, longest note' : front === 'ported' ? 'ported: less coupling, faster decay, a mic path' : 'no front head: the batter alone, shortest note'}</SvgText>}
    </Svg>
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height }, swingStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${W} ${KICK_H}`}>{beater}</Svg>
    </Animated.View>
    <HeadGlow x={x1 - 2} y={yT - 4} w={8} h={yB - yT + 8} sync={sync} s={sc} />
    </View>
  );
}

/* ── the kit ladder (Chapter 6) ──────────────────────────────────────────── */

export const KIT_H = 210;
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
  const drum = (x: number, w: number, h: number, label: string, hz: number, legs: boolean) => {
    const y = 150 - h;
    return (
      <G>
        <Rect x={x} y={y} width={w} height={h} fill="url(#tomShell)" stroke={ink.shellDark} strokeWidth={0.8} />
        <Rect x={x - 3} y={y - 3} width={w + 6} height={3} fill={ink.head} />
        <Rect x={x - 3} y={y + h} width={w + 6} height={3} fill={ink.headReso} />
        {[0.15, 0.5, 0.85].map((f) => (
          <G key={f}>
            <Rect x={x + w * f - 4} y={y + h / 2 - 9} width={8} height={18} rx={3} fill={ink.metalLight} stroke={ink.metalDark} strokeWidth={0.5} />
            <Line x1={x + w * f} y1={y - 2} x2={x + w * f} y2={y + 18} stroke={ink.metal} strokeWidth={1.6} />
            <Line x1={x + w * f} y1={y + h + 2} x2={x + w * f} y2={y + h - 18} stroke={ink.metal} strokeWidth={1.6} />
          </G>
        ))}
        {legs ? [x + 6, x + w - 6].map((xx) => <Line key={xx} x1={xx} y1={y + h} x2={xx} y2={y + h + 22} stroke={ink.metal} strokeWidth={2.4} />) : null}
        <SvgText x={x + w / 2} y={y - 10} fontSize={fs} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>{label}</SvgText>
        <SvgText x={x + w / 2} y={y + h + (legs ? 34 : 16)} fontSize={f2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.mono}>{hz.toFixed(0)} Hz</SvgText>
      </G>
    );
  };
  return (
    <View style={{ width, height }}>
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${KIT_H}`}>
      <Rect x={0} y={0} width={W} height={KIT_H} fill={ink.bg} />
      <Defs>
        <LinearGradient id="tomShell" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ink.shellLight} />
          <Stop offset="0.5" stopColor={ink.shell} />
          <Stop offset="1" stopColor={ink.shellDark} />
        </LinearGradient>
      </Defs>
      {drum(22, 64, 44, '12" rack tom', rackHz, false)}
      {drum(112, 84, 84, '16" floor tom', floorHz, true)}
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
    {/* the sounding tom's head glows with the hit (rack: x 22 w 64 h 44; floor: x 112 w 84 h 84; tops at 150 − h) */}
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 19 * sc, top: (150 - 44 - 4) * sc, width: 70 * sc, height: 6 * sc, borderRadius: 3 * sc, backgroundColor: '#fff3c4' }, rackGlow]} />
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 109 * sc, top: (150 - 84 - 4) * sc, width: 90 * sc, height: 6 * sc, borderRadius: 3 * sc, backgroundColor: '#fff3c4' }, floorGlow]} />
    </View>
  );
}
