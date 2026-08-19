/**
 * Spl3dGauge — the SPL REFERENCE GAUGE as an ISOMETRIC 3D segmented ring.
 * rev 6 (owner 2026-08-19, full designer-critique pass): graphite faceplate,
 * ring recessed into a dark well, lit top faces gradient-lit with a bright
 * leading edge, directional wall shading + deeper extrusion + contact shadow,
 * refined palette (gold vs yellow separated), elbowed leaders that clear the
 * blocks, quieted numerals, and a recessed LCD panel behind the centre readout.
 *
 * Zone bands (unified 2026-07-30): STUDIO grey<60, green<79, GOLD 79–85 sweet
 * spot, yellow<95, orange<100, red; SPL green<85, yellow<90, orange CONCERT
 * <96, red; OPTIMAL green<85, yellow<95, orange<100, red.
 * react-native-svg only — renders on any client.
 */
import { memo, useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { fonts } from '../../theme/tokens';

export type DialMode3d = 'studio' | 'spl' | 'optimal';

/* ── Geometry (viewBox 1000 × 500 — cropped to content) ─────────────── */
const VB_W = 1000;
const VB_H = 500;
export const GAUGE_ASPECT = VB_H / VB_W;
const CX = 500;
const CY = 296; // ring centre
const RX = 268; // outer ellipse x-radius
const RY = 128; // outer ellipse y-radius (isometric tilt ≈ 0.48)
const K_IN = 0.7; // inner radius ratio (ring thickness)
const DEPTH = 30; // extrusion depth — deepened rev 6 for real mass
const ANG = 122; // gauge half-span: scale runs −122° … +122°, gap at bottom
const SEGS = 13;
const GAP_DEG = 2.6;
const S_MIN = 36;
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

/** Top face: annular sector on the tilted ellipse. Every point carries its own
 *  'L' command — a stray join('L') here once produced 'LL' tokens, which the
 *  iOS native SVG path parser hard-crashes on (2026-08-19). Keep joins ''. */
function facePath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  const inn = arcPts(a1, a2, K_IN).reverse();
  return `M${P(o[0])}` + o.slice(1).map((p) => `L${P(p)}`).join('') + inn.map((p) => `L${P(p)}`).join('') + 'Z';
}

/** The outer top edge only — re-stroked bright on the leading lit block. */
function outerArcPath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  return `M${P(o[0])}` + o.slice(1).map((p) => `L${P(p)}`).join('');
}

/** REAL wall geometry: outer band + inner band + both end caps, all attached to
 *  the face outline — one multi-subpath fill per segment. */
function wallPath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  const inn = arcPts(a1, a2, K_IN);
  const band = (pts: { x: number; y: number }[]) =>
    `M${P(pts[0])}` + pts.slice(1).map((p) => `L${P(p)}`).join('') + pts.slice().reverse().map((p) => `L${P(p, DEPTH)}`).join('') + 'Z';
  const cap = (po: { x: number; y: number }, pi: { x: number; y: number }) => `M${P(po)}L${P(pi)}L${P(pi, DEPTH)}L${P(po, DEPTH)}Z`;
  return band(o) + band(inn) + cap(o[0], inn[0]) + cap(o[STEPS], inn[STEPS]);
}

/* ── Palette (rev 6 — graphite theme, separated gold/yellow) ─────────── */
type ZoneKey = 'grey' | 'green' | 'gold' | 'yellow' | 'orange' | 'red';
const ZONE_HEX: Record<ZoneKey, string> = {
  grey: '#767b84', // studio "below monitoring" — lit but neutral
  green: '#34c06b',
  gold: '#e8b93a', // sweet spot — warm, distinct from yellow
  yellow: '#f2d641', // caution — brighter/greener than gold
  orange: '#f0863a',
  red: '#e23b2c',
};
const UNLIT_FACE = '#34373d'; // "off" — dark, dead, reads as empty channel
const UNLIT_WALL = '#212327';
const UNLIT_STROKE = '#3f434a';

function zoneKey(s: number, mode: DialMode3d): ZoneKey {
  if (mode === 'studio') {
    if (s < 60) return 'grey';
    if (s < 79) return 'green';
    if (s < 85) return 'gold';
    if (s < 95) return 'yellow';
    if (s < 100) return 'orange';
    return 'red';
  }
  if (mode === 'spl') {
    if (s < 85) return 'green';
    if (s < 90) return 'yellow';
    if (s < 96) return 'orange';
    return 'red';
  }
  if (s < 85) return 'green';
  if (s < 95) return 'yellow';
  if (s < 100) return 'orange';
  return 'red';
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${((c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0')}`;
}

/* ── Graphite theme inks ────────────────────────────────────────────── */
const INK = '#e8e9ec';
const INK_DIM = '#9498a0';
const INK_FAINT = '#6c707a';
// Callout inks — vivid on graphite.
const C_GREEN = '#4fd07f';
const C_AMBER = '#e8b93a';
const C_ORANGE = '#f0863a';
const C_RED = '#ff5a48';
const C_GOLD = '#f0c64a';

/* ── Per-mode chrome: titles + callouts ─────────────────────────────── */
type Anchor = 'start' | 'end' | 'middle';
type Callout = { spl: number; color: string; big?: boolean; t1: string; t2: string; tx: number; ty: number; a: Anchor };
const LX = 196; // LEFT column right edge (anchor 'end')
const RX_COL = 808; // RIGHT column left edge (anchor 'start')
const CALLOUTS: Record<DialMode3d, Callout[]> = {
  studio: [
    { spl: 79, color: C_GOLD, big: true, t1: 'CRITICAL BALANCING', t2: '76dB–84dB', tx: CX, ty: 90, a: 'middle' },
    { spl: 62, color: C_GREEN, t1: 'BACKGROUND · DETAIL', t2: '60–65 dB SPL', tx: LX, ty: 250, a: 'end' },
    { spl: 72, color: C_GREEN, t1: 'GENERAL EDITING', t2: '70–75 dB SPL', tx: RX_COL, ty: 156, a: 'start' },
    { spl: 90, color: C_AMBER, t1: 'IMPACT CHECK', t2: '85–95 dB SPL · brief', tx: RX_COL, ty: 320, a: 'start' },
  ],
  spl: [
    { spl: 79, color: C_GREEN, big: true, t1: 'STUDIO LISTENING', t2: '~79 dBC', tx: CX, ty: 90, a: 'middle' },
    { spl: 60, color: C_GREEN, t1: 'CONVERSATION', t2: '~60 dBA', tx: LX, ty: 250, a: 'end' },
    { spl: 93, color: C_ORANGE, t1: 'CONCERT', t2: '90dB–96dB', tx: RX_COL, ty: 168, a: 'start' },
    { spl: 100, color: C_RED, t1: '100+ dB', t2: 'UNSAFE >15 MIN/DAY', tx: RX_COL, ty: 320, a: 'start' },
  ],
  optimal: [
    { spl: 69, color: C_GREEN, big: true, t1: 'PROGRAM', t2: '60–78 dBA', tx: CX, ty: 96, a: 'middle' },
    { spl: 50, color: C_GREEN, t1: 'AMBIENT', t2: '40–59 dBA', tx: LX, ty: 250, a: 'end' },
    { spl: 81, color: C_GREEN, t1: 'REFERENCE', t2: '79–84 dBA', tx: RX_COL, ty: 138, a: 'start' },
    { spl: 89, color: C_AMBER, t1: 'SHOW', t2: '85–93 dBA', tx: RX_COL, ty: 208, a: 'start' },
    { spl: 95, color: C_ORANGE, t1: 'HIGH', t2: '94–96 dBA', tx: RX_COL, ty: 278, a: 'start' },
    { spl: 98, color: C_RED, t1: 'LIMIT', t2: '97–99 dBA', tx: RX_COL, ty: 348, a: 'start' },
    { spl: 100, color: C_RED, t1: '100+ dB LAeq', t2: 'WHO 15-MIN LIMIT', tx: RX_COL, ty: 418, a: 'start' },
  ],
};
const TITLES: Record<DialMode3d, [string, string | null]> = {
  studio: ['STUDIO REFERENCE MONITORING LEVELS', null],
  spl: ['SPL REFERENCE SOUNDS', null],
  optimal: ['OPTIMAL REFERENCE LISTENING', 'dBA · LAeq WHERE NOTED'],
};

/** Elbowed leader: a short radial stub off the anchor (clearing the top face),
 *  then a straight run to the label — so no leader crosses a coloured block. */
function leaderPath(spl: number, tx: number, ty: number, hero: boolean): { d: string; ax: number; ay: number } {
  const A = ept(theta(spl), 1.06);
  let nx = A.x - CX;
  let ny = A.y - CY;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;
  const stub = hero ? { x: A.x, y: A.y - 26 } : { x: A.x + nx * 20, y: A.y + ny * 20 };
  return { d: `M${P(A)}L${P(stub)}L${tx.toFixed(1)} ${(ty + 4).toFixed(1)}`, ax: A.x, ay: A.y };
}

function chrome(mode: DialMode3d, calibrated: boolean): ReactNode {
  const [t1, t2] = TITLES[mode];
  const els: ReactNode[] = [];
  els.push(
    <SvgText key="t1" x={CX} y={44} fill={INK} fontFamily={fonts.oswaldSemiBold} fontSize={27} letterSpacing={2} textAnchor="middle">
      {t1}
    </SvgText>,
  );
  if (t2) {
    els.push(
      <SvgText key="t2" x={CX} y={67} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={18} textAnchor="middle">
        {t2}
      </SvgText>,
    );
  }
  if (!calibrated) {
    // Neutral amber status pill — parked at the BOTTOM of the card (rev 6.1) so
    // it never competes with the hero callout for the top-centre space.
    const by = VB_H - 34;
    els.push(<Rect key="badgebg" x={CX - 116} y={by} width={232} height={22} rx={11} fill="#00000038" stroke="#5a4a1e" strokeWidth={1} />);
    els.push(
      <SvgText key="badge" x={CX} y={by + 16} fill="#c59b3a" fontFamily={fonts.oswaldSemiBold} fontSize={14} letterSpacing={1.6} textAnchor="middle">
        ESTIMATED · UNCALIBRATED
      </SvgText>,
    );
  }
  // Scale numerals — quieted (rev 6): 20px, dim ink, receding. Three even bands
  // just outside the blocks: TOP above apex, SIDES in the ring↔column gap,
  // BOTTOM clear of the front wall.
  [40, 50, 60, 70, 80, 90, 100].forEach((s) => {
    const a = theta(s);
    const cosA = Math.cos((a * Math.PI) / 180);
    const p = ept(a, cosA > 0.55 ? 1.17 : cosA < -0.15 ? 1.15 : 1.1);
    const dy = cosA > 0.55 ? -3 : cosA < -0.15 ? DEPTH + 16 : 8;
    els.push(
      <SvgText key={`n${s}`} x={p.x} y={p.y + dy} fill={s >= 100 ? C_RED : INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={20} textAnchor="middle">
        {s}
      </SvgText>,
    );
  });
  // Callouts with a fine hairline elbow leader + small anchor dot.
  CALLOUTS[mode].forEach((c) => {
    const L = leaderPath(c.spl, c.tx, c.ty, c.a === 'middle');
    els.push(<Path key={`l${c.spl}`} d={L.d} fill="none" stroke={c.color} strokeWidth={1.3} opacity={0.6} />);
    els.push(<Circle key={`d${c.spl}`} cx={L.ax} cy={L.ay} r={2.6} fill={c.color} />);
    els.push(
      <SvgText key={`t${c.spl}`} x={c.tx} y={c.ty} fill={c.color} fontFamily={fonts.oswaldSemiBold} fontSize={c.big ? 23 : 16} letterSpacing={0.4} textAnchor={c.a}>
        {c.t1}
      </SvgText>,
    );
    els.push(
      <SvgText key={`s${c.spl}`} x={c.tx} y={c.ty + (c.big ? 20 : 18)} fill={INK_FAINT} fontFamily={fonts.oswaldSemiBold} fontSize={c.big ? 14 : 12.5} textAnchor={c.a}>
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

/* ── Segments (precomputed geometry + mid angle) ────────────────────── */
const SEG_DEFS = (() => {
  const out: { faceD: string; wallD: string; outerD: string; midSpl: number; cosMid: number }[] = [];
  const spanDeg = (2 * ANG) / SEGS;
  for (let i = 0; i < SEGS; i++) {
    const a1 = -ANG + i * spanDeg + GAP_DEG / 2;
    const a2 = -ANG + (i + 1) * spanDeg - GAP_DEG / 2;
    const midSpl = S_MIN + ((i + 0.5) / SEGS) * (S_MAX - S_MIN);
    const midDeg = (a1 + a2) / 2;
    out.push({ faceD: facePath(a1, a2), wallD: wallPath(a1, a2), outerD: outerArcPath(a1, a2), midSpl, cosMid: Math.cos((midDeg * Math.PI) / 180) });
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

/** The isometric segmented SPL gauge on a graphite instrument face. */
export const Spl3dGauge = memo(({ width, mode, level, calibrated, centerText, centerColor }: Spl3dGaugeProps) => {
  const height = Math.round(width * GAUGE_ASPECT);
  const lit = level == null ? 0 : Math.max(0, Math.min(SEGS, Math.floor(((level - S_MIN) / (S_MAX - S_MIN)) * SEGS + 0.5)));
  const uid = 'g' + useId().replace(/:/g, '');
  const zg = (k: ZoneKey) => `${uid}-${k}`;

  const walls: ReactNode[] = [];
  const faces: ReactNode[] = [];
  SEG_DEFS.forEach((sd, i) => {
    const isLit = i < lit;
    const isTop = isLit && i === lit - 1;
    if (isLit) {
      const key = zoneKey(sd.midSpl, mode);
      const base = ZONE_HEX[key];
      // Directional wall shading: top segments catch light, front ends are dark.
      const wf = 0.46 + 0.18 * sd.cosMid;
      walls.push(<Path key={`w${i}`} d={sd.wallD} fill={shade(base, wf)} />);
      faces.push(
        <Path key={`f${i}`} d={sd.faceD} fill={`url(#${zg(key)})`} stroke={shade(base, 0.7)} strokeWidth={0.75} />,
      );
      // Leading lit block — bright top edge so the fill front reads at a glance.
      if (isTop) {
        faces.push(<Path key={`fh${i}`} d={sd.faceD} fill={shade(base, 1.25)} opacity={0.5} />);
        faces.push(<Path key={`fe${i}`} d={sd.outerD} fill="none" stroke={shade(base, 1.55)} strokeWidth={2.2} strokeLinecap="round" />);
      }
    } else {
      walls.push(<Path key={`w${i}`} d={sd.wallD} fill={UNLIT_WALL} />);
      faces.push(<Path key={`f${i}`} d={sd.faceD} fill={UNLIT_FACE} stroke={UNLIT_STROKE} strokeWidth={0.75} />);
    }
  });

  const numColor = centerColor ?? INK;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          {/* Graphite faceplate — top-lit brushed metal. */}
          <LinearGradient id={`${uid}-plate`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2b2e33" />
            <Stop offset="1" stopColor="#1b1d21" />
          </LinearGradient>
          {/* Recessed well the ring sits in. */}
          <RadialGradient id={`${uid}-well`} cx="0.5" cy="0.46" r="0.62">
            <Stop offset="0" stopColor="#101215" />
            <Stop offset="1" stopColor="#212429" />
          </RadialGradient>
          {/* Centre LCD glass. */}
          <RadialGradient id={`${uid}-lcd`} cx="0.5" cy="0.42" r="0.7">
            <Stop offset="0" stopColor="#1a1d21" />
            <Stop offset="1" stopColor="#0b0c0e" />
          </RadialGradient>
          {/* Per-zone top-face gradients (lit-from-above sheen). */}
          {(Object.keys(ZONE_HEX) as ZoneKey[]).map((k) => (
            <LinearGradient key={k} id={zg(k)} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={shade(ZONE_HEX[k], 1.22)} />
              <Stop offset="0.5" stopColor={ZONE_HEX[k]} />
              <Stop offset="1" stopColor={shade(ZONE_HEX[k], 0.86)} />
            </LinearGradient>
          ))}
        </Defs>

        {/* Faceplate + machined rim + beveled edges. */}
        <Rect x={4} y={4} width={VB_W - 8} height={VB_H - 8} rx={26} fill={`url(#${uid}-plate)`} stroke="#0c0d0f" strokeWidth={1.5} />
        <Rect x={5.5} y={5.5} width={VB_W - 11} height={VB_H - 11} rx={24} fill="none" stroke="#494d55" strokeWidth={1} opacity={0.6} />

        {/* Recessed well + soft contact shadow that seats the ring. */}
        <Ellipse cx={CX} cy={CY + 6} rx={RX + 16} ry={RY + 14} fill={`url(#${uid}-well)`} />
        <Ellipse cx={CX} cy={CY + DEPTH + 6} rx={RX * 1.02} ry={RY * 0.52} fill="#000000" opacity={0.28} />

        {/* Chrome (title, badge, numerals, callouts) — behind the ring so the
            ring's near wall can overlap the bottom numerals cleanly. */}
        {CHROME[`${mode}${calibrated ? 1 : 0}`]}

        {/* Extruded ring: walls first, then top faces. */}
        {walls}
        {faces}

        {/* Centre LCD panel + faint top sheen, then the live readout. */}
        <Ellipse cx={CX} cy={CY} rx={RX * 0.6} ry={RY * 0.6} fill={`url(#${uid}-lcd)`} stroke="#000000" strokeWidth={1} />
        <Ellipse cx={CX} cy={CY - RY * 0.32} rx={RX * 0.44} ry={RY * 0.16} fill="#ffffff" opacity={0.05} />
        <SvgText x={CX} y={CY + 22} fill={numColor} fontFamily={fonts.mono} fontSize={84} textAnchor="middle">
          {centerText}
        </SvgText>
        <SvgText x={CX} y={CY + 50} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={15} letterSpacing={2.5} textAnchor="middle">
          dB SPL · AVG
        </SvgText>
      </Svg>
    </View>
  );
});
Spl3dGauge.displayName = 'Spl3dGauge';
