/**
 * SkinnedVu — the photoreal VU meter face (vu_skin_spl.png) with ONLY the
 * needle, pivot cap, and the printed gauge scale (arc + ticks + dB numbers)
 * drawn on top (owner 2026-08-19). react-native-svg only (no Skia), so it
 * renders on any client; the needle is driven at frame rate by Reanimated off
 * the live rms SharedValue. Used by both the SPL Meter screen's VU meters and
 * the ToolsHub SPL tile (which shares the geometry + scale exported here).
 */
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text as RVText, View } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import Svg, { G, Image as SvgImage, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import type { LiveMeterDrive } from '../lab/meter/vizMeters';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VU_SKIN = require('../../../assets/tool-strips/vu_skin_spl.png');
export const SKIN_VB = '0 0 1586 992';
export const VU_MAX = Math.pow(10, 3 / 20); // +3 dB rel 0 VU (integrator ceiling)

// Skin geometry (measured from vu_skin_spl.png, 1586×992): the needle pivots at
// the bottom-centre dome; the scale arc sweeps the glowing face above it.
export const SKIN_PIVOT = { x: 795, y: 802 };
export const SKIN_R_ARC = 585;
export const SKIN_R_MAJ_IN = 544;
export const SKIN_R_MIN_IN = 564;
export const SKIN_R_NUM = 630;
export const SKIN_NEEDLE_L = 560;
/** 0 VU sits at ~71% of the sweep — the standard VU face proportion. */
export const VU_ZERO_FRAC = 0.71;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export const vuValAngle = (vuVal: number) => -62 + 124 * clamp(VU_ZERO_FRAC * vuVal, 0, 1.02);
const vuDbAngle = (dbv: number) => vuValAngle(Math.pow(10, dbv / 20));
export const skinPt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: SKIN_PIVOT.x + r * Math.sin(a), y: SKIN_PIVOT.y - r * Math.cos(a) };
};

const SPL_TICKS: ReadonlyArray<{ db: number; major: boolean }> = [
  { db: -20, major: true }, { db: -10, major: true }, { db: -7, major: false },
  { db: -5, major: true }, { db: -3, major: true }, { db: -2, major: false },
  { db: -1, major: false }, { db: 0, major: true }, { db: 1, major: false },
  { db: 2, major: false }, { db: 3, major: true },
];
const SPL_INK = '#2a1a08'; // dark scale ink on the cream face
const SPL_INK_RED = '#b3231a';

/** The printed gauge scale (arc + ticks + numbers) — constant, built once. */
export const SPL_SCALE = (() => {
  const els: ReactNode[] = [];
  const pL = skinPt(vuDbAngle(-20), SKIN_R_ARC);
  const p0 = skinPt(vuDbAngle(0), SKIN_R_ARC);
  const pR = skinPt(vuDbAngle(3), SKIN_R_ARC);
  els.push(
    <Path key="arc" d={`M${pL.x.toFixed(1)} ${pL.y.toFixed(1)}A${SKIN_R_ARC} ${SKIN_R_ARC} 0 0 1 ${pR.x.toFixed(1)} ${pR.y.toFixed(1)}`} fill="none" stroke={SPL_INK} strokeWidth={5} />,
  );
  els.push(
    <Path key="arcRed" d={`M${p0.x.toFixed(1)} ${p0.y.toFixed(1)}A${SKIN_R_ARC} ${SKIN_R_ARC} 0 0 1 ${pR.x.toFixed(1)} ${pR.y.toFixed(1)}`} fill="none" stroke={SPL_INK_RED} strokeWidth={11} />,
  );
  SPL_TICKS.forEach((t) => {
    const a = vuDbAngle(t.db);
    const pi = skinPt(a, t.major ? SKIN_R_MAJ_IN : SKIN_R_MIN_IN);
    const po = skinPt(a, SKIN_R_ARC);
    const col = t.db >= 0 ? SPL_INK_RED : SPL_INK;
    els.push(<Line key={`t${t.db}`} x1={pi.x} y1={pi.y} x2={po.x} y2={po.y} stroke={col} strokeWidth={t.major ? 7 : 4} />);
    if (t.major) {
      const pn = skinPt(a, SKIN_R_NUM);
      els.push(
        <SvgText key={`n${t.db}`} x={pn.x} y={pn.y + 18} fill={col} fontFamily={fonts.oswaldSemiBold} fontSize={52} textAnchor="middle">
          {t.db > 0 ? `+${t.db}` : `${t.db}`}
        </SvgText>,
      );
    }
  });
  return <G>{els}</G>;
})();

export type SkinnedVuProps = {
  width: number;
  height: number;
  live: LiveMeterDrive;
  /** dBFS that reads 0 VU (SPL screen: RANGE − offset). */
  live0Db: number;
  running?: boolean;
  /** 'contain' shows the whole skinned unit (frame + face); 'cover' fills. */
  fit?: 'contain' | 'cover';
  cornerReadouts?: { maxText?: string; levelText?: string; rangeText?: string };
};

/** The skinned analogue VU. The needle integrates the live rms on the UI thread
 *  (rise tc 0.20 s, fall 0.45 s) so it stays smooth at frame rate. The scale +
 *  skin are static SVG; the needle is a Reanimated View rotating about the
 *  pivot (the proven native-driver rotation — no animated SVG props). */
export function SkinnedVu({ width, height, live, live0Db, running = true, fit = 'contain', cornerReadouts }: SkinnedVuProps) {
  const vuVal = useSharedValue(0);

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.064, (frame.timeSincePreviousFrame ?? 16.7) / 1000);
    const rms = running ? live.rmsDb.value : -120;
    const target = rms === rms && rms > -119 ? Math.min(VU_MAX * 1.06, Math.pow(10, (rms - live0Db) / 20)) : 0;
    const tc = target > vuVal.value ? 0.2 : 0.45;
    vuVal.value = vuVal.value + (target - vuVal.value) * (1 - Math.exp(-dt / tc));
  }, true);

  const needleStyle = useAnimatedStyle(() => {
    const f = Math.max(0, Math.min(1.02, VU_ZERO_FRAC * vuVal.value));
    return { transform: [{ rotate: `${-62 + 124 * f}deg` }] };
  });

  // Map the skin's 1586×992 space onto the width×height box the SAME way the
  // <Svg preserveAspectRatio> does, so the RN needle overlay lines up with the
  // SVG-drawn pivot and scale.
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
      {/* Needle — a box centred on the pivot; the blade fills its top half so
          the box rotates about the pivot. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: pivX - needleW / 2,
            top: pivY - needleLen,
            width: needleW,
            height: needleLen * 2,
          },
          needleStyle,
        ]}
      >
        <View style={{ width: '100%', height: needleLen, borderRadius: needleW, backgroundColor: '#171004' }} />
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

// Tiny corner readout text (kept from the old VU so no info is lost).
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
