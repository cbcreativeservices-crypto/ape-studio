/**
 * Spl3dGauge — the SPL REFERENCE GAUGE as an ISOMETRIC 3D segmented ring
 * (owner 2026-08-19, from a stock-render reference; rev 2 after first look):
 * ~13 extruded blocks tilted into an ellipse fill with the live level.
 *
 * rev 2 (owner):
 *  - Callouts are HAND-PLACED per mode (explicit positions) so STUDIO, SPL and
 *    OPTIMAL each balance — the generic column stack didn't fit all three.
 *  - Canvas cropped to the content (viewBox 1000×500) — no dead band below.
 *  - Walls are REAL connected geometry (outer band + inner band + end caps
 *    joined to the face), depth 20 — the old offset-copy trick detached at the
 *    ring's sides and read as a floating shadow.
 *
 * Zone bands ported from the flat SplDialView (unified 2026-07-30): GREEN to
 * 84, YELLOW 85–94, ORANGE 95–99, RED 100+; STUDIO greys below 60 and golds
 * the 79–85 sweet spot; SPL uses yellow 85–90, orange CONCERT 90–96, red 96+.
 * react-native-svg only — renders on any client.
 */
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../theme/tokens';

export type DialMode3d = 'studio' | 'spl' | 'optimal';

/* ── Geometry (viewBox 1000 × 500 — cropped to content) ─────────────── */
const VB_W = 1000;
const VB_H = 500;
export const GAUGE_ASPECT = VB_H / VB_W;
const CX = 500;
const CY = 300; // ring centre
const RX = 268; // outer ellipse x-radius
const RY = 126; // outer ellipse y-radius (isometric tilt ≈ 0.47)
const K_IN = 0.7; // inner radius ratio (ring thickness)
const DEPTH = 20; // extrusion depth — shallow, walls hug the faces (rev 2)
const ANG = 122; // gauge half-span: scale runs −122° … +122°, gap at bottom
const SEGS = 13;
const GAP_DEG = 2.2;
const S_MIN = 50;
const S_MAX = 100;

const theta = (s: number) => -ANG + ((Math.min(S_MAX, Math.max(S_MIN, s)) - S_MIN) / (S_MAX - S_MIN)) * 2 * ANG;
const ept = (deg: number, k = 1) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + RX * k * Math.sin(a), y: CY - RY * k * Math.cos(a) };
};

const STEPS = 6;
function arcPts(a1: number, a2: number, k: number): { x: number; y: number }[] {
  return Array.from({ length: STEPS + 1 }, (_, i) => ept(a1 + ((a2 - a1) * i) / STEPS, k));
}
const P = (p: { x: number; y: number }, dy = 0) => `${p.x.toFixed(1)} ${(p.y + dy).toFixed(1)}`;

/** Top face: annular sector on the tilted ellipse. */
function facePath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  const inn = arcPts(a1, a2, K_IN);
  return (
    `M${P(o[0])}` +
    o.slice(1).map((p) => `L${P(p)}`).join('') +
    inn.slice().reverse().map((p) => `L${P(p)}`).join('L').replace(/^L?/, 'L') +
    'Z'
  );
}

/** REAL wall geometry (rev 2): outer band + inner band + both end caps, all
 *  attached to the face outline — one multi-subpath fill per segment. */
function wallPath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  const inn = arcPts(a1, a2, K_IN);
  const band = (pts: { x: number; y: number }[]) =>
    `M${P(pts[0])}` +
    pts.slice(1).map((p) => `L${P(p)}`).join('') +
    pts.slice().reverse().map((p) => `L${P(p, DEPTH)}`).join('') +
    'Z';
  const cap = (po: { x: number; y: number }, pi: { x: number; y: number }) =>
    `M${P(po)}L${P(pi)}L${P(pi, DEPTH)}L${P(po, DEPTH)}Z`;
  return band(o) + band(inn) + cap(o[0], inn[0]) + cap(o[STEPS], inn[STEPS]);
}

/* ── Zones (ported from SplDialView) ────────────────────────────────── */
const F_GREY = '#a9adb5';
const F_GREEN = '#3fae52';
const F_GOLD = '#dfaf35';
const F_YELLOW = '#e5c23c';
const F_ORANGE = '#e8842a';
const F_RED = '#d93a2b';
const F_UNLIT = '#c6c9ce';
const W_UNLIT = '#9a9ea5';

function zoneColor(s: number, mode: DialMode3d): string {
  if (mode === 'studio') {
    if (s < 60) return F_GREY;
    if (s < 79) return F_GREEN;
    if (s < 85) return F_GOLD;
    if (s < 95) return F_YELLOW;
    if (s < 100) return F_ORANGE;
    return F_RED;
  }
  if (mode === 'spl') {
    if (s < 85) return F_GREEN;
    if (s < 90) return F_YELLOW;
    if (s < 96) return F_ORANGE;
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
  return `#${((c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0')}`;
}

/* ── Per-mode chrome: titles + HAND-PLACED callouts (rev 2) ─────────── */
const Z_GREEN = '#1f7a34';
const Z_AMBER_TXT = '#8a6508';
const Z_ORANGE = '#c9631a';
const Z_RED = '#b3271e';
const GOLD_INK = '#d4a017';
const INK = '#26282d';
const INK_DIM = '#5c6066';

type Anchor = 'start' | 'end' | 'middle';
type Callout = { spl: number; color: string; big?: boolean; t1: string; t2: string; tx: number; ty: number; a: Anchor };
// Positions hand-balanced per mode around the 1000×500 canvas (ring occupies
// x 232–768, y 174–446): LEFT labels end-aligned, RIGHT start-aligned.
const CALLOUTS: Record<DialMode3d, Callout[]> = {
  studio: [
    { spl: 72, color: Z_GREEN, t1: 'GENERAL EDITING', t2: '70–75 dB SPL', tx: 252, ty: 128, a: 'end' },
    { spl: 62, color: Z_GREEN, t1: 'BACKGROUND · DETAIL', t2: '60–65 dB SPL', tx: 212, ty: 236, a: 'end' },
    { spl: 79, color: GOLD_INK, big: true, t1: 'CRITICAL BALANCING', t2: '76dB–84dB', tx: 664, ty: 116, a: 'middle' },
    { spl: 90, color: Z_AMBER_TXT, t1: 'IMPACT CHECK', t2: '85–95 dB SPL · brief', tx: 788, ty: 210, a: 'start' },
  ],
  spl: [
    { spl: 60, color: Z_GREEN, t1: 'CONVERSATION', t2: '~60 dBA', tx: 224, ty: 194, a: 'end' },
    { spl: 79, color: Z_GREEN, t1: 'STUDIO LISTENING', t2: '~79 dBC', tx: 590, ty: 118, a: 'middle' },
    { spl: 93, color: Z_ORANGE, t1: 'CONCERT', t2: '90dB–96dB', tx: 788, ty: 168, a: 'start' },
    { spl: 100, color: Z_RED, t1: '100+ dB', t2: 'UNSAFE >15 MIN/DAY', tx: 788, ty: 300, a: 'start' },
  ],
  optimal: [
    { spl: 69, color: Z_GREEN, t1: 'PROGRAM', t2: '60–78 dBA', tx: 240, ty: 140, a: 'end' },
    { spl: 50, color: Z_GREEN, t1: 'AMBIENT', t2: '40–59 dBA', tx: 200, ty: 316, a: 'end' },
    { spl: 81, color: Z_GREEN, t1: 'REFERENCE', t2: '79–84 dBA', tx: 560, ty: 114, a: 'middle' },
    { spl: 89, color: Z_AMBER_TXT, t1: 'SHOW', t2: '85–93 dBA', tx: 792, ty: 138, a: 'start' },
    { spl: 95, color: Z_ORANGE, t1: 'HIGH', t2: '94–96 dBA', tx: 792, ty: 216, a: 'start' },
    { spl: 98, color: Z_RED, t1: 'LIMIT', t2: '97–99 dBA', tx: 792, ty: 294, a: 'start' },
    { spl: 100, color: Z_RED, t1: '100+ dB LAeq', t2: 'WHO 15-MIN LIMIT', tx: 792, ty: 372, a: 'start' },
  ],
};
const TITLES: Record<DialMode3d, [string, string | null]> = {
  studio: ['STUDIO REFERENCE MONITORING LEVELS', null],
  spl: ['SPL REFERENCE SOUNDS', null],
  optimal: ['OPTIMAL REFERENCE LISTENING', 'dBA · LAeq WHERE NOTED'],
};

function chrome(mode: DialMode3d, calibrated: boolean): ReactNode {
  const [t1, t2] = TITLES[mode];
  const els: ReactNode[] = [];
  els.push(<Rect key="plate" x={4} y={4} width={VB_W - 8} height={VB_H - 8} rx={26} fill="#d2d3d6" />);
  els.push(
    <SvgText key="t1" x={CX} y={44} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={28} letterSpacing={2} textAnchor="middle">
      {t1}
    </SvgText>,
  );
  if (t2) {
    els.push(
      <SvgText key="t2" x={CX} y={68} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={20} textAnchor="middle">
        {t2}
      </SvgText>,
    );
  }
  if (!calibrated) {
    els.push(
      <SvgText key="badge" x={CX} y={t2 ? 90 : 68} fill={Z_RED} fontFamily={fonts.oswaldSemiBold} fontSize={18} letterSpacing={1.5} textAnchor="middle">
        ESTIMATED · UNCALIBRATED
      </SvgText>,
    );
  }
  // Scale numbers ring the tilted ellipse, outside the blocks. The offset is
  // position-aware (rev 2): numbers over the ring's top sit ABOVE the blocks,
  // side numbers sit level, and the 50/100 ends sit BELOW their walls — the
  // flat +depth offset was hiding 70/80 behind the top blocks.
  [50, 60, 70, 80, 90, 100].forEach((s) => {
    const a = theta(s);
    const cosA = Math.cos((a * Math.PI) / 180);
    // Side numerals (60/90) tuck close to the ring so they never collide with
    // the side callout columns; top/bottom numerals sit farther out.
    const p = ept(a, cosA > 0.6 || cosA < 0 ? 1.15 : 1.06);
    const dy = cosA > 0.6 ? -6 : cosA < 0 ? DEPTH + 26 : 14;
    els.push(
      <SvgText key={`n${s}`} x={p.x} y={p.y + dy} fill={s >= 100 ? Z_RED : INK} fontFamily={fonts.oswaldSemiBold} fontSize={25} textAnchor="middle">
        {s}
      </SvgText>,
    );
  });
  // Hand-placed callouts with anchor rings + leader lines.
  CALLOUTS[mode].forEach((c) => {
    const ap = ept(theta(c.spl), 1.02);
    els.push(<Circle key={`d${c.spl}`} cx={ap.x} cy={ap.y} r={7} fill="none" stroke={c.color} strokeWidth={3.5} />);
    els.push(<Line key={`l${c.spl}`} x1={ap.x} y1={ap.y} x2={c.tx} y2={c.ty + 6} stroke={c.color} strokeWidth={2.5} opacity={0.7} />);
    els.push(
      <SvgText key={`t${c.spl}`} x={c.tx} y={c.ty} fill={c.color} fontFamily={fonts.oswaldSemiBold} fontSize={c.big ? 32 : 26} letterSpacing={0.5} textAnchor={c.a}>
        {c.t1}
      </SvgText>,
    );
    els.push(
      <SvgText key={`s${c.spl}`} x={c.tx} y={c.ty + 24} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={20} textAnchor={c.a}>
        {c.t2}
      </SvgText>,
    );
  });
  return <G>{els}</G>;
}
const CHROME: Record<string, ReactNode> = {};
(['studio', 'spl', 'optimal'] as const).forEach((m) => {
  CHROME[`${m}1`] = chrome(m, true);
  CHROME[`${m}0`] = chrome(m, false);
});

/* ── Segments (precomputed) ─────────────────────────────────────────── */
const SEG_DEFS = (() => {
  const out: { faceD: string; wallD: string; midSpl: number }[] = [];
  const spanDeg = (2 * ANG) / SEGS;
  for (let i = 0; i < SEGS; i++) {
    const a1 = -ANG + i * spanDeg + GAP_DEG / 2;
    const a2 = -ANG + (i + 1) * spanDeg - GAP_DEG / 2;
    const midSpl = S_MIN + ((i + 0.5) / SEGS) * (S_MAX - S_MIN);
    out.push({ faceD: facePath(a1, a2), wallD: wallPath(a1, a2), midSpl });
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
  const lit = level == null ? 0 : Math.max(0, Math.min(SEGS, Math.floor(((level - S_MIN) / (S_MAX - S_MIN)) * SEGS + 0.5)));

  const walls: ReactNode[] = [];
  const faces: ReactNode[] = [];
  SEG_DEFS.forEach((sd, i) => {
    const isLit = i < lit;
    const isTop = isLit && i === lit - 1;
    const face = isLit ? zoneColor(sd.midSpl, mode) : F_UNLIT;
    walls.push(<Path key={`w${i}`} d={sd.wallD} fill={isLit ? shade(face, 0.55) : W_UNLIT} />);
    if (isTop) faces.push(<Path key={`g${i}`} d={sd.faceD} fill={face} opacity={0.5} transform="translate(0,-3)" />);
    faces.push(
      <Path key={`f${i}`} d={sd.faceD} fill={isTop ? shade(face, 1.18) : face} stroke={isLit ? shade(face, 0.75) : '#aeb1b7'} strokeWidth={1.5} />,
    );
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {CHROME[`${mode}${calibrated ? 1 : 0}`]}
        {/* Extruded ring: walls first, then top faces (the ring never
            self-overlaps at this tilt, so painter's order is safe). */}
        {walls}
        {faces}
        {/* Centre readout, inside the ring hole. */}
        <SvgText x={CX} y={CY + 20} fill={centerColor ?? INK} fontFamily={fonts.mono} fontSize={86} textAnchor="middle">
          {centerText}
        </SvgText>
        <SvgText x={CX} y={CY + 54} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={22} letterSpacing={1.5} textAnchor="middle">
          dB SPL · AVG
        </SvgText>
      </Svg>
    </View>
  );
});
Spl3dGauge.displayName = 'Spl3dGauge';
