/**
 * SkinnedVu — the photoreal VU meter face (vu_skin_spl.png, kept with its metal
 * border + corner screws) with the printed gauge scale, PEAK lamp, and needle
 * drawn on top to match the owner's reference face (owner 2026-08-19):
 *   numbers 20 10 7 5 3 0 3 5 with − / + ends, black on the left → red from 0,
 *   ticks hanging off the arc, "PEAK" + lamp top-right.
 * react-native-svg only (no Skia); the needle rotates via Reanimated off the
 * live rms SharedValue. The geometry + scale are exported so the ToolsHub SPL
 * tile shares the exact same face.
 */
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text as RVText, View } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Image as SvgImage, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import type { LiveMeterDrive } from '../lab/meter/vizMeters';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VU_SKIN = require('../../../assets/tool-strips/vu_skin_spl.png');
export const SKIN_VB = '0 0 1586 992';
export const VU_MAX = Math.pow(10, 6 / 20); // +6 dB rel 0 VU (needle peg / arc end)

// Skin geometry (measured from vu_skin_spl.png, 1586×992): the needle pivots at
// the bottom-centre dome; a shallow arc sweeps the upper glowing face.
export const SKIN_PIVOT = { x: 795, y: 802 };
const R_ARC = 470;
const R_MAJ_IN = 434; // major tick inner (outer at R_ARC → 36 long)
const R_MIN_IN = 449; // minor tick inner (21 long)
const R_NUM = 524; // numbers sit ABOVE (outside) the arc
export const SKIN_NEEDLE_L = 452;

// Voltage-linear needle deflection (real VU physics) tuned to the reference:
// −20 lands left, 0 near top-centre, +5 to the right, ± ends past them.
const ANG_MIN = -48;
const ANG_MAX = 48;
/** angle (deg from vertical, + = right) for a linear voltage `v` (1.0 = 0 VU).
 *  A worklet so useAnimatedStyle can call it on the UI thread AND the scale
 *  builder can call it on the JS thread (constants inlined for worklet safety). */
export function vuAngle(v: number): number {
  'worklet';
  const x = -46.8 + 47.7 * v;
  return x < -48 ? -48 : x > 48 ? 48 : x;
}
const vuDbAngle = (dbv: number) => vuAngle(Math.pow(10, dbv / 20));
export const skinPt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: SKIN_PIVOT.x + r * Math.sin(a), y: SKIN_PIVOT.y - r * Math.cos(a) };
};

// PEAK lamp (top-right of the face) — unlit ring drawn in the scale; the lit
// glow is an overlay so it can pulse with the signal.
export const SKIN_LAMP = { x: 1262, y: 250, r: 30 };
const PEAK_LAMP_DBFS = -3; // lamp fires when the true peak crosses −3 dBFS

const INK = '#241606'; // dark scale ink on the cream face
const INK_RED = '#b3231a';

type Mark = { db: number; label?: string };
const MARKS: ReadonlyArray<Mark> = [
  { db: -20, label: '20' }, { db: -15 }, { db: -10, label: '10' },
  { db: -7, label: '7' }, { db: -6 }, { db: -5, label: '5' }, { db: -4 },
  { db: -3, label: '3' }, { db: -2 }, { db: -1 },
  { db: 0, label: '0' }, { db: 1 }, { db: 2 }, { db: 3, label: '3' }, { db: 4 }, { db: 5, label: '5' },
];

/** The printed gauge scale (arc + ticks + numbers + PEAK) — constant. */
export const SPL_SCALE = (() => {
  const els: ReactNode[] = [];
  // Arc line — black from the − end to 0, red from 0 to the + end.
  const pEndL = skinPt(ANG_MIN + 1, R_ARC);
  const p0 = skinPt(vuDbAngle(0), R_ARC);
  const pEndR = skinPt(ANG_MAX - 2, R_ARC);
  els.push(<Path key="arcK" d={`M${pEndL.x.toFixed(1)} ${pEndL.y.toFixed(1)}A${R_ARC} ${R_ARC} 0 0 1 ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`} fill="none" stroke={INK} strokeWidth={6} />);
  els.push(<Path key="arcR" d={`M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A${R_ARC} ${R_ARC} 0 0 1 ${pEndR.x.toFixed(1)} ${pEndR.y.toFixed(1)}`} fill="none" stroke={INK_RED} strokeWidth={7} />);
  // Ticks + numbers.
  MARKS.forEach((m) => {
    const a = vuDbAngle(m.db);
    const major = !!m.label;
    const pi = skinPt(a, major ? R_MAJ_IN : R_MIN_IN);
    const po = skinPt(a, R_ARC);
    const col = m.db >= 0 ? INK_RED : INK;
    els.push(<Line key={`t${m.db}`} x1={pi.x} y1={pi.y} x2={po.x} y2={po.y} stroke={col} strokeWidth={major ? 7 : 4} />);
    if (m.label) {
      const pn = skinPt(a, R_NUM);
      els.push(
        <SvgText key={`n${m.db}`} x={pn.x} y={pn.y + 22} fill={col} fontFamily={fonts.oswaldSemiBold} fontSize={62} textAnchor="middle">
          {m.label}
        </SvgText>,
      );
    }
  });
  // − / + end symbols.
  const pMinus = skinPt(ANG_MIN, R_NUM - 6);
  const pPlus = skinPt(ANG_MAX, R_NUM - 6);
  els.push(<SvgText key="sMinus" x={pMinus.x} y={pMinus.y + 24} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={68} textAnchor="middle">−</SvgText>);
  els.push(<SvgText key="sPlus" x={pPlus.x} y={pPlus.y + 24} fill={INK_RED} fontFamily={fonts.oswaldSemiBold} fontSize={68} textAnchor="middle">+</SvgText>);
  // PEAK label + unlit lamp ring (top-right).
  els.push(<SvgText key="peak" x={SKIN_LAMP.x - 66} y={SKIN_LAMP.y + 16} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={44} textAnchor="end">PEAK</SvgText>);
  els.push(<Circle key="lampBg" cx={SKIN_LAMP.x} cy={SKIN_LAMP.y} r={SKIN_LAMP.r} fill="#2a1408" stroke="#5a3a1c" strokeWidth={4} />);
  return <G>{els}</G>;
})();

const NEEDLE = '#1a1206';

export type SkinnedVuProps = {
  width: number;
  height: number;
  live: LiveMeterDrive;
  /** dBFS that reads 0 VU (SPL screen: RANGE − offset). */
  live0Db: number;
  running?: boolean;
  /** 'contain' shows the whole skinned unit (border + screws); 'cover' fills. */
  fit?: 'contain' | 'cover';
  cornerReadouts?: { maxText?: string; levelText?: string; rangeText?: string };
};

/** The skinned analogue VU. The needle integrates the live rms on the UI thread
 *  (rise tc 0.20 s, fall 0.45 s) and rotates via useAnimatedStyle; the PEAK
 *  lamp glows when the true peak crosses −3 dBFS. */
export function SkinnedVu({ width, height, live, live0Db, running = true, fit = 'contain', cornerReadouts }: SkinnedVuProps) {
  const vuVal = useSharedValue(0);
  const lampT = useSharedValue(0);

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.064, (frame.timeSincePreviousFrame ?? 16.7) / 1000);
    const rms = running ? live.rmsDb.value : -120;
    const target = rms === rms && rms > -119 ? Math.min(VU_MAX * 1.04, Math.pow(10, (rms - live0Db) / 20)) : 0;
    const tc = target > vuVal.value ? 0.2 : 0.45;
    vuVal.value = vuVal.value + (target - vuVal.value) * (1 - Math.exp(-dt / tc));
    const pk = running ? live.peakDb.value : -120;
    if (pk === pk && pk >= PEAK_LAMP_DBFS) lampT.value = 1;
    else lampT.value = Math.max(0, lampT.value - dt / 0.6);
  }, true);

  const needleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${vuAngle(vuVal.value)}deg` }] }));
  const lampStyle = useAnimatedStyle(() => ({ opacity: lampT.value }));

  // Map the skin's 1586×992 space onto the width×height box the SAME way the
  // <Svg preserveAspectRatio> does, so the RN overlays line up with the SVG.
  const par = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
  const scale = fit === 'cover' ? Math.max(width / 1586, height / 992) : Math.min(width / 1586, height / 992);
  const offX = (width - 1586 * scale) / 2;
  const offY = (height - 992 * scale) / 2;
  const pivX = offX + SKIN_PIVOT.x * scale;
  const pivY = offY + SKIN_PIVOT.y * scale;
  const needleLen = SKIN_NEEDLE_L * scale;
  const needleW = Math.max(2, 7 * scale);
  const capOuter = Math.max(6, 30 * scale);
  const capInner = Math.max(3, 12 * scale);
  const lampD = SKIN_LAMP.r * 2 * scale;
  const lampX = offX + SKIN_LAMP.x * scale;
  const lampY = offY + SKIN_LAMP.y * scale;

  const readouts = useMemo(
    () => cornerReadouts,
    [cornerReadouts?.maxText, cornerReadouts?.levelText, cornerReadouts?.rangeText],
  );

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={SKIN_VB} preserveAspectRatio={par}>
        <SvgImage href={VU_SKIN} x={0} y={0} width={1586} height={992} preserveAspectRatio="xMidYMid slice" />
        {SPL_SCALE}
      </Svg>
      {/* PEAK lamp lit glow. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: lampX - lampD / 2,
            top: lampY - lampD / 2,
            width: lampD,
            height: lampD,
            borderRadius: lampD / 2,
            backgroundColor: '#ff5b3a',
          },
          lampStyle,
        ]}
      />
      {/* Needle — a box centred on the pivot; the blade fills its top half so
          the box rotates about the pivot. */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: pivX - needleW / 2, top: pivY - needleLen, width: needleW, height: needleLen * 2 },
          needleStyle,
        ]}
      >
        <View style={{ width: '100%', height: needleLen, borderRadius: needleW, backgroundColor: NEEDLE }} />
      </Animated.View>
      {/* Pivot post / cap over the dome. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: pivX - capOuter / 2, top: pivY - capOuter / 2, width: capOuter, height: capOuter, borderRadius: capOuter / 2, backgroundColor: '#120c03' }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: pivX - capInner / 2, top: pivY - capInner / 2, width: capInner, height: capInner, borderRadius: capInner / 2, backgroundColor: '#4a3618' }} />
      {readouts && (
        <>
          {!!readouts.maxText && <RVText style={[rStyles.readout, rStyles.tl]}>{readouts.maxText}</RVText>}
          {!!readouts.levelText && <RVText style={[rStyles.readout, rStyles.tr]}>{readouts.levelText}</RVText>}
          {!!readouts.rangeText && <RVText style={[rStyles.readout, rStyles.bl]}>{readouts.rangeText}</RVText>}
        </>
      )}
    </View>
  );
}

const rStyles = StyleSheet.create({
  readout: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.amber,
    opacity: 0.9,
  },
  tl: { top: 6, left: 8 },
  tr: { top: 6, right: 8, textAlign: 'right' },
  bl: { bottom: 6, left: 8 },
});
