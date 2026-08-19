/**
 * Spl3dGauge — the SPL REFERENCE GAUGE as an ISOMETRIC 3D segmented ring
 * (owner 2026-08-19, from a stock-render reference): the flat dial's 270°
 * arc becomes ~14 extruded blocks tilted into an ellipse, showing top faces
 * and side walls. Segments FILL with the live level (grey → green → gold →
 * yellow → orange → red per mode); unreached blocks stay dim. All the flat
 * dial's information is kept, restyled: the 50–100 scale numbers, the per-mode
 * zone callouts with leader lines, the mode title, the ESTIMATED badge, and
 * the big centre dB SPL readout.
 *
 * react-native-svg only (no Skia — unlike the old SplDialView this renders on
 * any client). The 3D is a classic 2.5D extrude: each segment paints a dark
 * translated-down copy (the wall — it peeks below the outer edge on front
 * segments and below the inner edge on back segments, which is exactly the
 * correct silhouette) and its coloured top face above.
 *
 * Zone bands ported from SplDialView (vizMeters, owner 2026-07-30 unified
 * bands): GREEN to 84, YELLOW 85–94, ORANGE 95–99, RED 100+; STUDIO greys
 * below 60 and golds the 79–85 sweet spot; SPL mode uses yellow 85–90,
 * orange CONCERT 90–96, red from 96.
 */
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../theme/tokens';

export type DialMode3d = 'studio' | 'spl' | 'optimal';

/* ── Geometry (viewBox 1000 × 640) ──────────────────────────────────── */
const VB_W = 1000;
const VB_H = 640;
export const GAUGE_ASPECT = VB_H / VB_W; // height = width × this
const CX = 500;
const CY = 342; // ring centre
const RX = 268; // outer ellipse x-radius
const RY = 128; // outer ellipse y-radius (isometric tilt ≈ 0.48)
const K_IN = 0.7; // inner radius ratio (ring thickness)
const DEPTH = 38; // extrusion depth (screen-space down)
const ANG = 122; // gauge half-span: scale runs −122° … +122°, gap at bottom
const SEGS = 13; // segments across 50…100 dB
const GAP_DEG = 2.2; // gap between segments
const S_MIN = 50;
const S_MAX = 100;

const theta = (s: number) => -ANG + ((Math.min(S_MAX, Math.max(S_MIN, s)) - S_MIN) / (S_MAX - S_MIN)) * 2 * ANG;
const ept = (deg: number, k = 1) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + RX * k * Math.sin(a), y: CY - RY * k * Math.cos(a) };
};

/** Annular-sector path on the tilted ellipse from angle a1→a2 (degrees). */
function segPath(a1: number, a2: number, dy = 0): string {
  const steps = 6;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = ept(a1 + ((a2 - a1) * i) / steps, 1);
    pts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${(p.y + dy).toFixed(1)}`);
  }
  for (let i = steps; i >= 0; i--) {
    const p = ept(a1 + ((a2 - a1) * i) / steps, K_IN);
    pts.push(`L${p.x.toFixed(1)} ${(p.y + dy).toFixed(1)}`);
  }
  return pts.join('') + 'Z';
}

/* ── Zones (ported from SplDialView) ────────────────────────────────── */
const F_GREY = '#a9adb5';
const F_GREEN = '#3fae52';
const F_GOLD = '#dfaf35';
const F_YELLOW = '#e5c23c';
const F_ORANGE = '#e8842a';
const F_RED = '#d93a2b';
const F_UNLIT = '#c6c9ce'; // reference-style light grey blocks
const W_UNLIT = '#94989f';

function zoneColor(s: number, mode: DialMode3d): string {
  if (mode === 'studio') {
    if (s < 60) return F_GREY;
    if (s < 79) return F_GREEN;
    if (s < 85) return F_GOLD; // the 79–85 monitoring sweet spot
    if (s < 95) return F_YELLOW;
    if (s < 100) return F_ORANGE;
    return F_RED;
  }
  if (mode === 'spl') {
    if (s < 85) return F_GREEN;
    if (s < 90) return F_YELLOW;
    if (s < 96) return F_ORANGE; // CONCERT emphasis band
    return F_RED;
  }
  if (s < 85) return F_GREEN;
  if (s < 95) return F_YELLOW;
  if (s < 100) return F_ORANGE;
  return F_RED;
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* ── Per-mode chrome: title + zone callouts (ported label sets) ─────── */
const Z_GREEN = '#1f7a34';
const Z_AMBER_TXT = '#8a6508';
const Z_ORANGE = '#c9631a';
const Z_RED = '#b3271e';
const GOLD_INK = '#d4a017';
const INK = '#26282d';
const INK_DIM = '#5c6066';

type Callout = { spl: number; color: string; big?: boolean; t1: string; t2: string };
const CALLOUTS: Record<DialMode3d, Callout[]> = {
  studio: [
    { spl: 62, color: Z_GREEN, t1: 'BACKGROUND · DETAIL', t2: '60–65 dB SPL' },
    { spl: 72, color: Z_GREEN, t1: 'GENERAL EDITING', t2: '70–75 dB SPL' },
    { spl: 79, color: GOLD_INK, big: true, t1: 'CRITICAL BALANCING', t2: '76dB–84dB' },
    { spl: 90, color: Z_AMBER_TXT, t1: 'IMPACT CHECK', t2: '85–95 dB SPL · brief' },
  ],
  spl: [
    { spl: 60, color: Z_GREEN, t1: 'CONVERSATION', t2: '~60 dBA' },
    { spl: 79, color: Z_GREEN, t1: 'STUDIO LISTENING', t2: '~79 dBC' },
    { spl: 93, color: Z_ORANGE, t1: 'CONCERT', t2: '90dB–96dB' },
    { spl: 100, color: Z_RED, t1: '100+ dB', t2: 'UNSAFE >15 MIN/DAY' },
  ],
  optimal: [
    { spl: 50, color: Z_GREEN, t1: 'AMBIENT', t2: '40–59 dBA' },
    { spl: 69, color: Z_GREEN, t1: 'PROGRAM', t2: '60–78 dBA' },
    { spl: 81, color: Z_GREEN, t1: 'REFERENCE', t2: '79–84 dBA' },
    { spl: 89, color: Z_AMBER_TXT, t1: 'SHOW', t2: '85–93 dBA' },
    { spl: 95, color: Z_ORANGE, t1: 'HIGH', t2: '94–96 dBA' },
    { spl: 98, color: Z_RED, t1: 'LIMIT', t2: '97–99 dBA' },
    { spl: 100, color: Z_RED, t1: '100+ dB LAeq', t2: 'WHO 15-MIN LIMIT' },
  ],
};
const TITLES: Record<DialMode3d, [string, string | null]> = {
  studio: ['STUDIO REFERENCE MONITORING LEVELS', null],
  spl: ['SPL REFERENCE SOUNDS', null],
  optimal: ['OPTIMAL REFERENCE LISTENING', 'dBA · LAeq WHERE NOTED'],
};

/** Callout layout: three disjoint columns (the flat dial's collision rule).
 *  LEFT (right-aligned), RIGHT (left-aligned), CENTER above the ring. */
function calloutLayer(mode: DialMode3d): ReactNode {
  const items = CALLOUTS[mode];
  const left = items.filter((c) => theta(c.spl) < -20);
  const center = items.filter((c) => Math.abs(theta(c.spl)) <= 20);
  const right = items.filter((c) => theta(c.spl) > 20);
  const els: ReactNode[] = [];
  const draw = (c: Callout, tx: number, ty: number, anchor: 'start' | 'end' | 'middle') => {
    const a = theta(c.spl);
    const ap = ept(a, 1.02); // leader anchor on the outer edge
    els.push(<Circle key={`d${c.spl}`} cx={ap.x} cy={ap.y} r={7} fill="none" stroke={c.color} strokeWidth={3.5} />);
    els.push(<Line key={`l${c.spl}`} x1={ap.x} y1={ap.y} x2={tx} y2={ty + 8} stroke={c.color} strokeWidth={2.5} opacity={0.75} />);
    els.push(
      <SvgText key={`t${c.spl}`} x={tx} y={ty} fill={c.color} fontFamily={fonts.oswaldSemiBold} fontSize={c.big ? 34 : 27} letterSpacing={0.5} textAnchor={anchor}>
        {c.t1}
      </SvgText>,
    );
    els.push(
      <SvgText key={`s${c.spl}`} x={tx} y={ty + 26} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={21} textAnchor={anchor}>
        {c.t2}
      </SvgText>,
    );
  };
  // Columns stack top→bottom in anchor order; rows sized to clear each other.
  const stack = (col: Callout[], tx: number, anchor: 'start' | 'end', y0: number, step: number) => {
    [...col].sort((a, b) => ept(theta(a.spl), 1).y - ept(theta(b.spl), 1).y).forEach((c, i) => draw(c, tx, y0 + i * step, anchor));
  };
  stack(left, 236, 'end', 168, 88);
  stack(right, 764, 'start', 168, 88);
  center.forEach((c, i) => draw(c, CX + (i - (center.length - 1) / 2) * 250, 128, 'middle'));
  return <G>{els}</G>;
}

/* ── Static per-mode chrome (plate, titles, scale numbers, callouts) ── */
function chrome(mode: DialMode3d, calibrated: boolean): ReactNode {
  const [t1, t2] = TITLES[mode];
  return (
    <G>
      <Rect x={4} y={4} width={VB_W - 8} height={VB_H - 8} rx={26} fill="#d2d3d6" />
      <SvgText x={CX} y={54} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={30} letterSpacing={2} textAnchor="middle">
        {t1}
      </SvgText>
      {t2 && (
        <SvgText x={CX} y={82} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={22} textAnchor="middle">
          {t2}
        </SvgText>
      )}
      {!calibrated && (
        <SvgText x={CX} y={t2 ? 106 : 82} fill={Z_RED} fontFamily={fonts.oswaldSemiBold} fontSize={20} letterSpacing={1.5} textAnchor="middle">
          ESTIMATED · UNCALIBRATED
        </SvgText>
      )}
      {/* Scale numbers ring the tilted ellipse, outside the blocks. */}
      {[50, 60, 70, 80, 90, 100].map((s) => {
        const p = ept(theta(s), 1.14);
        return (
          <SvgText key={s} x={p.x} y={p.y + DEPTH * 0.55 + 9} fill={s >= 100 ? Z_RED : INK} fontFamily={fonts.oswaldSemiBold} fontSize={26} textAnchor="middle">
            {s}
          </SvgText>
        );
      })}
      {calloutLayer(mode)}
    </G>
  );
}
const CHROME: Record<string, ReactNode> = {};
(['studio', 'spl', 'optimal'] as const).forEach((m) => {
  CHROME[`${m}1`] = chrome(m, true);
  CHROME[`${m}0`] = chrome(m, false);
});

/* ── Segment definitions (precomputed paths + values) ───────────────── */
const SEG_DEFS = (() => {
  const out: { faceD: string; wallD: string; midSpl: number }[] = [];
  const spanDeg = (2 * ANG) / SEGS;
  for (let i = 0; i < SEGS; i++) {
    const a1 = -ANG + i * spanDeg + GAP_DEG / 2;
    const a2 = -ANG + (i + 1) * spanDeg - GAP_DEG / 2;
    const midSpl = S_MIN + ((i + 0.5) / SEGS) * (S_MAX - S_MIN);
    out.push({ faceD: segPath(a1, a2), wallD: segPath(a1, a2, DEPTH), midSpl });
  }
  return out;
})();

export type Spl3dGaugeProps = {
  width: number;
  mode: DialMode3d;
  /** Smoothed estimated dB SPL (the flat dial's zone-EMA value); null = off. */
  level: number | null;
  calibrated: boolean;
  centerText: string;
  centerColor?: string;
};

/** The isometric segmented SPL gauge. Segments light up to the live level;
 *  the topmost lit block glows so the fill edge reads at a glance. */
export const Spl3dGauge = memo(({ width, mode, level, calibrated, centerText, centerColor }: Spl3dGaugeProps) => {
  const height = Math.round(width * GAUGE_ASPECT);
  // How many blocks are lit: each block lights once the level reaches its span.
  const lit = level == null ? 0 : Math.max(0, Math.min(SEGS, Math.floor(((level - S_MIN) / (S_MAX - S_MIN)) * SEGS + 0.5)));

  const walls: ReactNode[] = [];
  const faces: ReactNode[] = [];
  SEG_DEFS.forEach((sd, i) => {
    const isLit = i < lit;
    const isTop = isLit && i === lit - 1;
    const face = isLit ? zoneColor(sd.midSpl, mode) : F_UNLIT;
    const wall = isLit ? shade(face, 0.52) : W_UNLIT;
    walls.push(<Path key={`w${i}`} d={sd.wallD} fill={wall} />);
    // A soft glow plate under the topmost lit block so the fill edge pops.
    if (isTop) faces.push(<Path key={`g${i}`} d={sd.faceD} fill={face} opacity={0.5} transform="translate(0,-4)" />);
    faces.push(
      <Path key={`f${i}`} d={sd.faceD} fill={isTop ? shade(face, 1.18) : face} stroke={isLit ? shade(face, 0.75) : '#aeb1b7'} strokeWidth={1.5} />,
    );
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {CHROME[`${mode}${calibrated ? 1 : 0}`]}
        {/* Extruded ring: all walls first, then all top faces (the ring never
            self-overlaps at this tilt, so painter's order is safe). */}
        {walls}
        {faces}
        {/* Centre readout, inside the ring hole. */}
        <SvgText x={CX} y={CY + 22} fill={centerColor ?? INK} fontFamily={fonts.mono} fontSize={92} textAnchor="middle">
          {centerText}
        </SvgText>
        <SvgText x={CX} y={CY + 56} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={23} letterSpacing={1.5} textAnchor="middle">
          dB SPL · AVG
        </SvgText>
      </Svg>
    </View>
  );
});
Spl3dGauge.displayName = 'Spl3dGauge';
