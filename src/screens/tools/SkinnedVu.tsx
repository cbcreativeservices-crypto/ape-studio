/**
 * SkinnedVu — the photoreal VU meter face (vu_skin_spl.png, with its metal
 * border + corner screws) with the printed gauge scale, PEAK lamp, and needle
 * drawn on top to match the owner's reference face (owner 2026-08-19 rev 2).
 *
 * Geometry is MEASURED from the reference, not formula-guessed: the scale arc's
 * centre sits far BELOW the meter (≈(775,1300) in the skin's 1586×992 space,
 * number ring r≈1020 — verified by circle-fitting the reference's printed
 * numbers). That deep centre is what gives the shallow professional arc, the
 * outward-fanning ticks, numbers rotated to the arc normal, and the long
 * needle throw. Deflection is voltage-linear on the black side and compressed
 * on the red side, exactly like the reference.
 *
 * react-native-svg only (no Skia); the needle rotates via Reanimated off the
 * live rms SharedValue. Geometry + scale are exported so the ToolsHub SPL tile
 * shares the identical face.
 */
import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Image as SvgImage, Line, Path, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../theme/tokens';
import { SKIN_VB, VU_FACE } from './vuGeometry';
import { VuGlass } from './VuGlass';
import type { LiveMeterDrive } from '../lab/meter/vizMeters';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VU_SKIN = require('../../../assets/tool-strips/vu_skin_spl.png');
export const VU_MAX = Math.pow(10, 6 / 20); // integrator ceiling (+6 dB rel 0 VU)

/* ── Scale geometry (skin space, 1586×992) ──────────────────────────── */
// The needle pivots at the VISIBLE DOME, and the scale is centred on that same
// point — a real fixed axle. (An arc centred far below looked shallow but made
// the needle slide across the bottom border instead of pivoting.) The scale
// therefore spans a WIDE angle about the dome, exactly like a real VU face.
export const VU_CTR = { x: 795, y: 803 }; // the dome — the FIXED needle pivot
// Radii (owner 2026-08-19 rev4): arc apex ≈ y278 — halfway between the old
// jammed-at-top (y228) and the too-low rev3 (y328). R_NUM − R_MAJ = 60 keeps
// the numbers well clear of the ticks. The − / + ends are pushed to ±52° so
// they no longer collide with the −20 / +5 numbers.
const R_LINE = 429; // the arc baseline the ticks rise from
const R_MAJ = 465; // major tick tops
const R_MIN = 449; // minor tick tops
const R_ZERO = 477; // the 0 tick is extra tall
const R_NUM = 525; // number centres (60 clear of the major ticks)
const ANG_END_L = -52; // the − end (11° past −20 at −41° — clear of the number)
const ANG_END_R = 52; // the + end (9° past +5 at +43°)
export const VU_NEEDLE_TIP = 475; // needle tip radius (reaches the tick line)
// Secondary SPL scale (owner 2026-09-01): printed INSIDE the arc baseline, the
// way a real dual-scale meter prints its second row — so it reads as part of
// the face, never as an overlay on top of it.
const R_SPL = 366; // the SPL number row
// The caption sits in the face's LOWER-LEFT dead zone. The needle only ever
// sweeps −48°…+46°, so at −74° nothing crosses it, and it stays clear of the
// number row (which would otherwise read as one string with the −20 value).
const A_SPL_CAP = -74;
const R_SPL_CAP = 330;

// SKIN_VB + VU_FACE live in the leaf module vuGeometry so VuGlass can read the
// face rect without importing this file back (require cycle → Hermes threw
// "Cannot access 'VU_FACE' before initialization"). Re-exported here so every
// existing importer keeps working unchanged.
export { SKIN_VB, VU_FACE };

/* ── Deflection about the dome: voltage-linear black side, compressed red ── */
// θ(v=0)=−48° (rest, just left of −20) … θ(v=1 / 0 VU)=+22°; red side 4.2°/dB
// to +5 → +43°, capped at the + end. Matches the reference face's angular
// positions to within a degree.
export function vuAngle(v: number): number {
  'worklet';
  const t = v < 0 ? 0 : v;
  if (t <= 1) return -48 + 70 * t;
  const db = (20 * Math.log(t)) / Math.LN10;
  const a = 22 + 4.2 * db;
  return a > 46 ? 46 : a;
}
const vuDbAngle = (dbv: number) => vuAngle(Math.pow(10, dbv / 20));
export const skinPt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: VU_CTR.x + r * Math.sin(a), y: VU_CTR.y - r * Math.cos(a) };
};

/* ── PEAK lamp (top-right of the face, per the reference) ───────────── */
export const SKIN_LAMP = { x: 1258, y: 236, r: 34 };
const PEAK_LAMP_DBFS = -3;

const INK = '#241606'; // scale ink on the cream face
const INK_RED = '#b3231a';

/** Major marks: measured/derived angles via the deflection law. */
const MAJORS: ReadonlyArray<{ db: number; label: string }> = [
  { db: -20, label: '20' }, { db: -10, label: '10' }, { db: -7, label: '7' },
  { db: -5, label: '5' }, { db: -3, label: '3' }, { db: 0, label: '0' },
  { db: 3, label: '3' }, { db: 5, label: '5' },
];
/** Minor ticks at ANGULAR subdivisions of each gap (how the reference face
 *  spaces them — evenly within a gap, not at dB positions). */
function minorAngles(): number[] {
  const a = (db: number) => vuDbAngle(db);
  const between = (lo: number, hi: number, n: number) =>
    Array.from({ length: n }, (_, i) => lo + ((i + 1) * (hi - lo)) / (n + 1));
  return [
    ...between(a(-20), a(-10), 2),
    ...between(a(-10), a(-7), 1),
    ...between(a(-7), a(-5), 1),
    ...between(a(-5), a(-3), 1),
    ...between(a(-3), a(0), 3),
    ...between(a(0), a(3), 2),
    ...between(a(3), a(5), 1),
    ...between(a(5), ANG_END_R, 1),
  ];
}

/** The printed gauge scale — constant, built once. */
export const SPL_SCALE = (() => {
  const els: ReactNode[] = [];
  const arc = (a1: number, a2: number, r: number) => {
    const p1 = skinPt(a1, r);
    const p2 = skinPt(a2, r);
    return `M${p1.x.toFixed(1)} ${p1.y.toFixed(1)}A${r} ${r} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  };
  const a0 = vuDbAngle(0);
  // Arc baseline: black − → 0, thick red 0 → +.
  els.push(<Path key="arcK" d={arc(ANG_END_L, a0, R_LINE)} fill="none" stroke={INK} strokeWidth={7} />);
  els.push(<Path key="arcR" d={arc(a0, ANG_END_R, R_LINE)} fill="none" stroke={INK_RED} strokeWidth={13} />);
  // Major ticks + rotated numbers.
  MAJORS.forEach((m) => {
    const a = vuDbAngle(m.db);
    const red = m.db >= 0;
    const col = red ? INK_RED : INK;
    const pi = skinPt(a, R_LINE);
    const po = skinPt(a, m.db === 0 ? R_ZERO : R_MAJ);
    els.push(<Line key={`M${m.db}`} x1={pi.x} y1={pi.y} x2={po.x} y2={po.y} stroke={col} strokeWidth={m.db === 0 ? 10 : 8} />);
    const pn = skinPt(a, R_NUM);
    els.push(
      <SvgText
        key={`N${m.db}`}
        x={pn.x}
        y={pn.y + 20}
        fill={col}
        fontFamily={fonts.oswaldSemiBold}
        fontSize={58}
        textAnchor="middle"
        transform={`rotate(${a.toFixed(1)} ${pn.x.toFixed(1)} ${pn.y.toFixed(1)})`}
      >
        {m.label}
      </SvgText>,
    );
  });
  // Minor ticks.
  minorAngles().forEach((a, i) => {
    const pi = skinPt(a, R_LINE);
    const po = skinPt(a, R_MIN);
    const col = a >= a0 ? INK_RED : INK;
    els.push(<Line key={`m${i}`} x1={pi.x} y1={pi.y} x2={po.x} y2={po.y} stroke={col} strokeWidth={5} />);
  });
  // − / + end symbols, just above the arc ends.
  const pMinus = skinPt(ANG_END_L, R_NUM - 18);
  const pPlus = skinPt(ANG_END_R, R_NUM - 18);
  els.push(
    <SvgText key="sM" x={pMinus.x} y={pMinus.y + 22} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={66} textAnchor="middle" transform={`rotate(${ANG_END_L} ${pMinus.x.toFixed(1)} ${pMinus.y.toFixed(1)})`}>
      −
    </SvgText>,
  );
  els.push(
    <SvgText key="sP" x={pPlus.x} y={pPlus.y + 22} fill={INK_RED} fontFamily={fonts.oswaldSemiBold} fontSize={66} textAnchor="middle" transform={`rotate(${ANG_END_R} ${pPlus.x.toFixed(1)} ${pPlus.y.toFixed(1)})`}>
      +
    </SvgText>,
  );
  // PEAK label + RED lamp (always red; unlit = dark red, off). The bright,
  // illuminated clip state is drawn on top by the renderer.
  els.push(<SvgText key="pk" x={SKIN_LAMP.x - 62} y={SKIN_LAMP.y + 20} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={58} letterSpacing={4} textAnchor="end">PEAK</SvgText>);
  els.push(<Circle key="pkSocket" cx={SKIN_LAMP.x} cy={SKIN_LAMP.y} r={SKIN_LAMP.r + 5} fill="#241207" />);
  els.push(<Circle key="pkBg" cx={SKIN_LAMP.x} cy={SKIN_LAMP.y} r={SKIN_LAMP.r} fill="#6e1409" />);
  els.push(<Circle key="pkHi" cx={SKIN_LAMP.x - 9} cy={SKIN_LAMP.y - 9} r={SKIN_LAMP.r * 0.42} fill="#9c2a1a" opacity={0.7} />);
  return <G>{els}</G>;
})();

const NEEDLE = '#1a1206';

/**
 * The SPL REFERENCE ROW (owner 2026-09-01): what the VU scale is actually set
 * to. 0 VU is printed with the dB SPL it represents, and −20 VU with its own
 * value (ref − 20), so the meter always declares its reference instead of
 * leaving "0 VU" abstract.
 *
 * Marked (EST) because the SPL here is an ESTIMATE from an uncalibrated phone
 * microphone — the numbers are a reference scale, never a calibrated reading.
 * Returns null when there is no reference to state.
 */
function splRefScale(ref0: number | null | undefined): ReactNode {
  if (ref0 == null || !Number.isFinite(ref0)) return null;
  const els: ReactNode[] = [];
  const mark = (db: number, value: number) => {
    const a = vuDbAngle(db);
    const p = skinPt(a, R_SPL);
    els.push(
      <SvgText
        key={`spl${db}`}
        x={p.x}
        y={p.y + 14}
        fill={INK}
        opacity={0.62}
        fontFamily={fonts.oswaldSemiBold}
        fontSize={40}
        textAnchor="middle"
        transform={`rotate(${a.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
      >
        {Math.round(value)}
      </SvgText>,
    );
  };
  mark(-20, ref0 - 20);
  mark(0, ref0);
  const cap = skinPt(A_SPL_CAP, R_SPL_CAP);
  els.push(
    <SvgText
      key="splCap"
      x={cap.x}
      y={cap.y + 10}
      fill={INK}
      opacity={0.52}
      fontFamily={fonts.oswaldSemiBold}
      fontSize={26}
      letterSpacing={2}
      textAnchor="middle"
    >
      dB SPL (EST)
    </SvgText>,
  );
  return <G>{els}</G>;
}

/** A centred circle box (left/top/size/radius) for the lit-lamp overlays. */
function lampGlowBox(cx: number, cy: number, d: number) {
  return { left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: d / 2 };
}

export type SkinnedVuProps = {
  width: number;
  height: number;
  live: LiveMeterDrive;
  /** dBFS that reads 0 VU (SPL screen: RANGE − offset). */
  live0Db: number;
  /** ESTIMATED dB SPL that 0 VU represents (the RANGE reference). Printed on
   *  the face as a secondary scale with its −20 VU counterpart. */
  ref0Spl?: number | null;
  /** Draw the glass pane in code, over everything (owner "Plan B"
   *  2026-09-01). Leave OFF for a skin whose artwork already contains glass —
   *  the current vu_skin_spl.png does — and switch ON for an open-faced plate.
   *  See VuGlass for the tuning dials. */
  glass?: boolean;
  running?: boolean;
  /** 'contain' shows the whole skinned unit (border + screws); 'cover' fills. */
  fit?: 'contain' | 'cover';
};

/** The skinned analogue VU. The needle integrates the live rms on the UI thread
 *  (rise tc 0.20 s, fall 0.45 s) and rotates about the DEEP scale centre via
 *  useAnimatedStyle, clipped to the face window; the PEAK lamp lights when the
 *  true peak crosses −3 dBFS. */
export function SkinnedVu({ width, height, live, live0Db, ref0Spl, glass = false, running = true, fit = 'contain' }: SkinnedVuProps) {
  const vuVal = useSharedValue(0);
  const vuVel = useSharedValue(0);
  const lampT = useSharedValue(0);

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16.7) / 1000);
    // Target deflection: the RMS level as a VOLTAGE RATIO about the 0-VU
    // reference (live0Db). v=1 is exactly 0 VU — so the needle reads the truth.
    const rms = running ? live.rmsDb.value : -120;
    const target = rms === rms && rms > -119 ? Math.min(1.995, Math.pow(10, (rms - live0Db) / 20)) : 0;
    // TRUE VU ballistic (ANSI C16.5 / IEC 60268-17): a symmetric 2nd-order
    // movement — 99% of a step in ~300 ms with ~1.5% overshoot — NOT an
    // asymmetric envelope. W/Z tuned to spec; semi-implicit Euler is stable at
    // our frame dt (dt·W < 1). Same law rising and falling, like a real meter.
    const W = 16; // rad/s natural frequency
    const Z = 0.72; // damping ratio → 1.5% overshoot, 99% by ~300 ms (spec)
    const acc = W * W * (target - vuVal.value) - 2 * Z * W * vuVel.value;
    vuVel.value = vuVel.value + acc * dt;
    vuVal.value = Math.max(0, vuVal.value + vuVel.value * dt);
    const pk = running ? live.peakDb.value : -120;
    if (pk === pk && pk >= -3) lampT.value = 1;
    else lampT.value = Math.max(0, lampT.value - dt / 0.6);
  }, true);

  const needleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${vuAngle(vuVal.value)}deg` }] }));
  const lampStyle = useAnimatedStyle(() => ({ opacity: lampT.value }));

  // Map the skin's 1586×992 space onto the width×height box the SAME way the
  // <Svg preserveAspectRatio> does, so RN overlays line up with the SVG.
  const par = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
  const scale = fit === 'cover' ? Math.max(width / 1586, height / 992) : Math.min(width / 1586, height / 992);
  const offX = (width - 1586 * scale) / 2;
  const offY = (height - 992 * scale) / 2;
  const toX = (x: number) => offX + x * scale;
  const toY = (y: number) => offY + y * scale;
  // Needle pivot = the dome, in pt space. The blade box is centred on the pivot
  // and the blade fills its TOP half from the pivot to the tip, so it rotates
  // about a FIXED axle (a small inner gap lets the dome graphic show).
  const pivX = toX(VU_CTR.x);
  const pivY = toY(VU_CTR.y);
  const tipLen = VU_NEEDLE_TIP * scale;
  const bladeLen = tipLen - 12 * scale;
  const needleW = Math.max(2, 8 * scale);
  // Face clip window in pt space (relative to the widget box).
  const clip = { left: toX(VU_FACE.x), top: toY(VU_FACE.y), width: VU_FACE.w * scale, height: VU_FACE.h * scale };
  const lampD = SKIN_LAMP.r * 2 * scale;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={SKIN_VB} preserveAspectRatio={par}>
        <SvgImage href={VU_SKIN} x={0} y={0} width={1586} height={992} preserveAspectRatio="xMidYMid slice" />
        {SPL_SCALE}
        {splRefScale(ref0Spl)}
      </Svg>
      {/* PEAK lamp — illuminated clip state: a bright red core filling the lens
          and a hot centre, so it reads like a real lamp lit from inside. Both
          fade in together with the clip.

          NO GLOW OUTSIDE THE LENS (owner 2026-09-01): this used to add a halo
          2.1× the lens diameter bleeding onto the meter face, which read as
          artificial next to the photoreal skin. A real panel lamp lights its
          own lens; it does not wash the faceplate around it. Every lit layer
          below is bounded by the lens. */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', ...lampGlowBox(toX(SKIN_LAMP.x), toY(SKIN_LAMP.y), lampD), backgroundColor: '#ff5a34' }, lampStyle]} />
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', ...lampGlowBox(toX(SKIN_LAMP.x) - 6 * scale, toY(SKIN_LAMP.y) - 6 * scale, lampD * 0.5), backgroundColor: '#ffe6ac' }, lampStyle]} />
      {/* Needle — clipped to the face window; the blade rotates about the deep
          scale centre far below the widget, exactly like the real movement. */}
      <View pointerEvents="none" style={{ position: 'absolute', ...clip, overflow: 'hidden' }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: pivX - clip.left - needleW / 2,
              top: pivY - clip.top - tipLen,
              width: needleW,
              height: tipLen * 2,
            },
            needleStyle,
          ]}
        >
          <View style={{ width: '100%', height: bladeLen, borderRadius: needleW, backgroundColor: NEEDLE }} />
        </Animated.View>
      </View>
      {/* The glass pane goes LAST — that is where a pane physically is: in
          front of the scale, the lamp and the needle (owner "Plan B"
          2026-09-01). Off by default; see the `glass` prop. */}
      {glass ? <VuGlass width={width} height={height} par={par} /> : null}
    </View>
  );
}
