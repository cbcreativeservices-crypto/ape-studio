/**
 * Spl3dGauge — the SPL REFERENCE GAUGE as an ISOMETRIC 3D segmented ring.
 * rev 8 (owner 2026-08-19): scale numerals moved ONTO the tiles; each segment
 * rebuilt to read as one solid extruded block (no outline seams, gradient
 * walls); callouts enlarged + pushed to the card edges; hero subtitle sits
 * below its title. 6-zone scale: GREY below · GREEN approaching · GOLD target
 * (bright/reflective while the level is IN it, plain gold once exceeded) ·
 * YELLOW just over · ORANGE higher · RED 100+. The live "current range" readout
 * names the band the level is in. (Animated gold shimmer is a follow-up.)
 * react-native-svg only — renders on any client.
 */
import { memo, useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../theme/tokens';

export type DialMode3d = 'studio' | 'spl' | 'optimal';

/* ── Geometry (viewBox 1000 × 500) ──────────────────────────────────── */
const VB_W = 1000;
const VB_H = 500;
export const GAUGE_ASPECT = VB_H / VB_W;
const CX = 500;
const CY = 296;
const RX = 268;
const RY = 128;
const K_IN = 0.68;
const K_MID = (1 + K_IN) / 2; // face mid-radius (numerals ride here)
const DEPTH = 30;
const ANG = 122;
const SEGS = 13;
const GAP_DEG = 2.4;
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
 *  'L' — a stray join('L') once made 'LL' tokens that crash iOS's SVG parser. */
function facePath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  const inn = arcPts(a1, a2, K_IN).reverse();
  return `M${P(o[0])}` + o.slice(1).map((p) => `L${P(p)}`).join('') + inn.map((p) => `L${P(p)}`).join('') + 'Z';
}
function outerArcPath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  return `M${P(o[0])}` + o.slice(1).map((p) => `L${P(p)}`).join('');
}
/** Wall as ONE filled solid: down the far side of the outer arc, back along the
 *  inner arc — a single silhouette so the block reads as one extruded object. */
function wallPath(a1: number, a2: number): string {
  const o = arcPts(a1, a2, 1);
  const inn = arcPts(a1, a2, K_IN);
  const band = (pts: { x: number; y: number }[]) =>
    `M${P(pts[0])}` + pts.slice(1).map((p) => `L${P(p)}`).join('') + pts.slice().reverse().map((p) => `L${P(p, DEPTH)}`).join('') + 'Z';
  const cap = (po: { x: number; y: number }, pi: { x: number; y: number }) => `M${P(po)}L${P(pi)}L${P(pi, DEPTH)}L${P(po, DEPTH)}Z`;
  return band(o) + band(inn) + cap(o[0], inn[0]) + cap(o[STEPS], inn[STEPS]);
}

/* ── Palette (rev 8 — 6-zone) ───────────────────────────────────────── */
type ZoneKey = 'grey' | 'green' | 'gold' | 'yellow' | 'orange' | 'red';
const ZONE_HEX: Record<ZoneKey, string> = {
  grey: '#7b818b',
  green: '#34c06b',
  gold: '#e0b13a', // plain gold (target band once exceeded)
  yellow: '#efd23f',
  orange: '#f0863a',
  red: '#e23b2c',
};

function zoneKey(s: number, mode: DialMode3d): ZoneKey {
  if (mode === 'studio') {
    if (s < 60) return 'grey';
    if (s < 76) return 'green';
    if (s < 85) return 'gold';
    if (s < 92) return 'yellow';
    if (s < 100) return 'orange';
    return 'red';
  }
  if (mode === 'spl') {
    if (s < 55) return 'grey';
    if (s < 88) return 'green';
    if (s < 97) return 'orange';
    return 'red';
  }
  // optimal — REFERENCE + SHOW are both gold targets
  if (s < 60) return 'grey';
  if (s < 79) return 'green';
  if (s < 94) return 'gold';
  if (s < 97) return 'yellow';
  if (s < 100) return 'orange';
  return 'red';
}

type Band = { hi: number; name: string; zone: ZoneKey };
const BANDS: Record<DialMode3d, Band[]> = {
  studio: [
    { hi: 60, name: 'BELOW MONITORING', zone: 'grey' },
    { hi: 76, name: 'EDITING LEVEL', zone: 'green' },
    { hi: 85, name: 'CRITICAL BALANCING', zone: 'gold' },
    { hi: 92, name: 'IMPACT CHECK', zone: 'yellow' },
    { hi: 100, name: 'TOO LOUD', zone: 'orange' },
    { hi: Infinity, name: 'OVER — UNSAFE', zone: 'red' },
  ],
  spl: [
    { hi: 55, name: 'QUIET', zone: 'grey' },
    { hi: 72, name: 'CONVERSATION', zone: 'green' },
    { hi: 88, name: 'STUDIO LISTENING', zone: 'green' },
    { hi: 97, name: 'CONCERT', zone: 'orange' },
    { hi: Infinity, name: '100+ dB — UNSAFE', zone: 'red' },
  ],
  optimal: [
    { hi: 60, name: 'AMBIENT', zone: 'grey' },
    { hi: 79, name: 'PROGRAM', zone: 'green' },
    { hi: 85, name: 'REFERENCE', zone: 'gold' },
    { hi: 94, name: 'SHOW', zone: 'gold' },
    { hi: 97, name: 'HIGH', zone: 'yellow' },
    { hi: 100, name: 'LIMIT', zone: 'orange' },
    { hi: Infinity, name: '100+ dB LAeq', zone: 'red' },
  ],
};
function activeBand(level: number, mode: DialMode3d): Band {
  const bands = BANDS[mode];
  return bands.find((b) => level < b.hi) ?? bands[bands.length - 1];
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${((c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0')}`;
}

/* ── Graphite inks + callout colours (one per zone) ─────────────────── */
const INK = '#e8e9ec';
const INK_DIM = '#9498a0';
const INK_FAINT = '#787c85';
const C_GREY = '#aab0b8';
const C_GREEN = '#4fd07f';
const C_GOLD = '#f2ca55';
const C_YELLOW = '#f0dd5a';
const C_ORANGE = '#f0863a';
const C_RED = '#ff5a48';

type Anchor = 'start' | 'end' | 'middle';
type CalloutDef = { spl: number; color: string; t1: string; t2: string };
type Placed = CalloutDef & { tx: number; ty: number; a: Anchor; fs: number; ang: number };
const LX = 178; // LEFT column right edge
const RX_COL = 816; // RIGHT column left edge
const SIDE_MAXW = 178; // usable label width in a side margin
const CALLOUTS: Record<DialMode3d, CalloutDef[]> = {
  studio: [
    { spl: 62, color: C_GREEN, t1: 'BACKGROUND', t2: '60–65 dB SPL' },
    { spl: 72, color: C_GREEN, t1: 'GENERAL EDITING', t2: '70–75 dB SPL' },
    { spl: 79, color: C_GOLD, t1: 'CRITICAL BALANCING', t2: '76–84 dB SPL' },
    { spl: 90, color: C_YELLOW, t1: 'IMPACT CHECK', t2: '85–95 dB SPL' },
  ],
  spl: [
    { spl: 60, color: C_GREEN, t1: 'CONVERSATION', t2: '~60 dBA' },
    { spl: 79, color: C_GREEN, t1: 'STUDIO LISTENING', t2: '~79 dBC' },
    { spl: 93, color: C_ORANGE, t1: 'CONCERT', t2: '90–96 dB' },
    { spl: 100, color: C_RED, t1: '100+ dB', t2: 'UNSAFE >15 MIN' },
  ],
  optimal: [
    { spl: 50, color: C_GREY, t1: 'AMBIENT', t2: '40–59 dBA' },
    { spl: 69, color: C_GREEN, t1: 'PROGRAM', t2: '60–78 dBA' },
    { spl: 81, color: C_GOLD, t1: 'REFERENCE', t2: '79–84 dBA' },
    { spl: 89, color: C_GOLD, t1: 'SHOW', t2: '85–93 dBA' },
    { spl: 95, color: C_YELLOW, t1: 'HIGH', t2: '94–96 dBA' },
    { spl: 98, color: C_ORANGE, t1: 'LIMIT', t2: '97–99 dBA' },
    { spl: 100, color: C_RED, t1: '100+ dB LAeq', t2: 'WHO 15-MIN' },
  ],
};

/** Auto-layout (rev 10 — owner: place ranges HIGHER, next to the wheel, so
 *  leaders run straight out from the anchor without sharp kinks or grazing
 *  under the tiles). Each range's label sits just OUTSIDE the wheel AT ITS OWN
 *  ANGLE (radial), so the leader is a short near-radial line. Near-top ranges
 *  (|angle|<22°) go to a short top row above the apex; everything else hugs the
 *  left/right of the wheel, ordered by angle and de-overlapped just enough to
 *  not touch. Long labels auto-shrink. */
const LABEL_K = 1.24; // label sits at this radius (just outside the tiles)
function fitFs(t1: string) {
  return Math.max(15, Math.min(21, Math.floor(SIDE_MAXW / (t1.length * 0.56))));
}
function layoutMode(mode: DialMode3d): Placed[] {
  const items = CALLOUTS[mode].map((c) => ({ ...c, ang: theta(c.spl) }));
  const top = items.filter((c) => Math.abs(c.ang) < 22).sort((a, b) => a.ang - b.ang);
  const left = items.filter((c) => c.ang <= -22).sort((a, b) => a.ang - b.ang);
  const right = items.filter((c) => c.ang >= 22).sort((a, b) => a.ang - b.ang);
  const out: Placed[] = [];
  // Top row: above the apex, spread by angle (a lone one nudged off dead-centre).
  const nt = top.length;
  top.forEach((c, i) => {
    const tx = nt === 1 ? CX + 66 : CX + (i - (nt - 1) / 2) * 236;
    out.push({ ...c, tx, ty: 118, a: 'middle', fs: fitFs(c.t1) });
  });
  // Sides: radial, hugging the wheel, de-overlapped downward.
  const placeSide = (arr: (CalloutDef & { ang: number })[], a: Anchor) => {
    let py = -Infinity;
    arr.forEach((c) => {
      const lp = ept(c.ang, LABEL_K);
      const ty = Math.max(lp.y, py + 44);
      py = ty;
      out.push({ ...c, tx: lp.x, ty, a, fs: fitFs(c.t1) });
    });
  };
  placeSide(left, 'end');
  placeSide(right, 'start');
  return out;
}
const LAID_OUT: Record<DialMode3d, Placed[]> = {
  studio: layoutMode('studio'),
  spl: layoutMode('spl'),
  optimal: layoutMode('optimal'),
};
const TITLES: Record<DialMode3d, [string, string | null]> = {
  studio: ['STUDIO REFERENCE MONITORING LEVELS', null],
  spl: ['SPL REFERENCE SOUNDS', null],
  optimal: ['OPTIMAL REFERENCE LISTENING', 'dBA · LAeq WHERE NOTED'],
};

/** Straight leader from the anchor (just outside the tile) to the label's inner
 *  point (rev 10). Because the label sits radially outward from the anchor, the
 *  line is near-radial — no sharp kink, and it never runs under the tiles. */
function leaderPath(spl: number, tx: number, ty: number): { d: string; ax: number; ay: number } {
  const A = ept(theta(spl), 1.05);
  return { d: `M${P(A)}L${tx.toFixed(1)} ${(ty - 6).toFixed(1)}`, ax: A.x, ay: A.y };
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
    const by = VB_H - 34;
    els.push(<Rect key="badgebg" x={CX - 116} y={by} width={232} height={22} rx={11} fill="#00000038" stroke="#5a4a1e" strokeWidth={1} />);
    els.push(
      <SvgText key="badge" x={CX} y={by + 16} fill="#c59b3a" fontFamily={fonts.oswaldSemiBold} fontSize={14} letterSpacing={1.6} textAnchor="middle">
        ESTIMATED · UNCALIBRATED
      </SvgText>,
    );
  }
  // Callouts — auto-laid-out ranges (rev 9): angle-ordered side columns, never
  // centre-locked, leaders never cross; light-grey subtitle below the title.
  LAID_OUT[mode].forEach((c) => {
    const L = leaderPath(c.spl, c.tx, c.ty);
    els.push(<Path key={`l${c.spl}`} d={L.d} fill="none" stroke={c.color} strokeWidth={1.3} opacity={0.6} />);
    els.push(<Circle key={`d${c.spl}`} cx={L.ax} cy={L.ay} r={2.8} fill={c.color} />);
    els.push(
      <SvgText key={`t${c.spl}`} x={c.tx} y={c.ty} fill={c.color} fontFamily={fonts.oswaldSemiBold} fontSize={c.fs} letterSpacing={0.3} textAnchor={c.a}>
        {c.t1}
      </SvgText>,
    );
    els.push(
      <SvgText key={`s${c.spl}`} x={c.tx} y={c.ty + 19} fill={INK_FAINT} fontFamily={fonts.oswaldSemiBold} fontSize={13.5} textAnchor={c.a}>
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

/* ── Scale numerals, seated ON the tiles (rev 8) — dark digit + light halo so
 *  they read on any zone colour, lit or dim. Drawn AFTER the faces. */
const NUMERALS = (() => {
  const els: ReactNode[] = [];
  [40, 50, 60, 70, 80, 90, 100].forEach((s) => {
    const p = ept(theta(s), K_MID);
    els.push(<SvgText key={`nh${s}`} x={p.x} y={p.y + 7} fill="none" stroke="#eef0f3" strokeWidth={3.4} opacity={0.7} fontFamily={fonts.oswaldSemiBold} fontSize={20} textAnchor="middle">{s}</SvgText>);
    els.push(<SvgText key={`n${s}`} x={p.x} y={p.y + 7} fill="#16181c" fontFamily={fonts.oswaldSemiBold} fontSize={20} textAnchor="middle">{s}</SvgText>);
  });
  return <G>{els}</G>;
})();

/* ── Segments (precomputed) ─────────────────────────────────────────── */
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

export const Spl3dGauge = memo(({ width, mode, level, calibrated, centerText, centerColor }: Spl3dGaugeProps) => {
  const height = Math.round(width * GAUGE_ASPECT);
  const lit = level == null ? 0 : Math.max(0, Math.min(SEGS, Math.floor(((level - S_MIN) / (S_MAX - S_MIN)) * SEGS + 0.5)));
  const uid = 'g' + useId().replace(/:/g, '');
  const zg = (k: ZoneKey) => `${uid}-${k}`;
  const band = level == null ? null : activeBand(level, mode);
  // The gold target shines only while the level is INSIDE a gold band.
  const goldActive = band?.zone === 'gold';

  const walls: ReactNode[] = [];
  const faces: ReactNode[] = [];
  SEG_DEFS.forEach((sd, i) => {
    const isLit = i < lit;
    const isTop = isLit && i === lit - 1;
    const key = zoneKey(sd.midSpl, mode);
    const base = ZONE_HEX[key];
    if (isLit) {
      const wf = 0.34 + 0.16 * sd.cosMid; // directional: top bright, front dark
      walls.push(<Path key={`w${i}`} d={sd.wallD} fill={shade(base, wf)} />);
      // Gold face: reflective while active, plain top-lit once exceeded.
      const faceFill = key === 'gold' ? `url(#${uid}-${goldActive ? 'goldshine' : 'gold'})` : `url(#${zg(key)})`;
      faces.push(<Path key={`f${i}`} d={sd.faceD} fill={faceFill} />);
      // Every lit tile gets a fine bright top-outer bevel (the block's lit edge).
      faces.push(<Path key={`b${i}`} d={sd.outerD} fill="none" stroke={shade(base, isTop ? 1.6 : 1.32)} strokeWidth={isTop ? 2.4 : 1.1} strokeLinecap="round" opacity={isTop ? 1 : 0.8} />);
    } else {
      const wf = 0.16 + 0.06 * sd.cosMid;
      walls.push(<Path key={`w${i}`} d={sd.wallD} fill={shade(base, wf)} />);
      faces.push(<Path key={`f${i}`} d={sd.faceD} fill={shade(base, 0.34)} />);
    }
  });

  const numColor = band ? ZONE_HEX[band.zone] : centerColor ?? INK;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id={`${uid}-plate`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2b2e33" />
            <Stop offset="1" stopColor="#1b1d21" />
          </LinearGradient>
          <RadialGradient id={`${uid}-well`} cx="0.5" cy="0.46" r="0.62">
            <Stop offset="0" stopColor="#101215" />
            <Stop offset="1" stopColor="#212429" />
          </RadialGradient>
          <RadialGradient id={`${uid}-lcd`} cx="0.5" cy="0.42" r="0.7">
            <Stop offset="0" stopColor="#1a1d21" />
            <Stop offset="1" stopColor="#0b0c0e" />
          </RadialGradient>
          {/* Per-zone top-face gradients (lit-from-above). */}
          {(Object.keys(ZONE_HEX) as ZoneKey[]).map((k) => (
            <LinearGradient key={k} id={zg(k)} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={shade(ZONE_HEX[k], 1.24)} />
              <Stop offset="0.5" stopColor={ZONE_HEX[k]} />
              <Stop offset="1" stopColor={shade(ZONE_HEX[k], 0.84)} />
            </LinearGradient>
          ))}
          {/* Reflective gold — a diagonal specular band for the active target. */}
          <LinearGradient id={`${uid}-goldshine`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9a6f16" />
            <Stop offset="0.34" stopColor="#f7dd8b" />
            <Stop offset="0.5" stopColor="#fff6d6" />
            <Stop offset="0.66" stopColor="#f2ca55" />
            <Stop offset="1" stopColor="#8c6412" />
          </LinearGradient>
        </Defs>

        {/* Graphite faceplate + machined rim + bevel edge. */}
        <Rect x={4} y={4} width={VB_W - 8} height={VB_H - 8} rx={26} fill={`url(#${uid}-plate)`} stroke="#0c0d0f" strokeWidth={1.5} />
        <Rect x={5.5} y={5.5} width={VB_W - 11} height={VB_H - 11} rx={24} fill="none" stroke="#494d55" strokeWidth={1} opacity={0.6} />

        {/* Recessed well + contact shadow. */}
        <Ellipse cx={CX} cy={CY + 6} rx={RX + 16} ry={RY + 14} fill={`url(#${uid}-well)`} />
        <Ellipse cx={CX} cy={CY + DEPTH + 6} rx={RX * 1.02} ry={RY * 0.52} fill="#000000" opacity={0.28} />

        {CHROME[`${mode}${calibrated ? 1 : 0}`]}

        {/* Extruded ring, then the numerals seated on the tiles. */}
        {walls}
        {faces}
        {NUMERALS}

        {/* Centre LCD + live readouts. */}
        <Ellipse cx={CX} cy={CY} rx={RX * 0.6} ry={RY * 0.6} fill={`url(#${uid}-lcd)`} stroke="#000000" strokeWidth={1} />
        <Ellipse cx={CX} cy={CY - RY * 0.32} rx={RX * 0.44} ry={RY * 0.16} fill="#ffffff" opacity={0.05} />
        <SvgText x={CX} y={CY + 22} fill={numColor} fontFamily={fonts.mono} fontSize={84} textAnchor="middle">
          {centerText}
        </SvgText>
        <SvgText x={CX} y={CY + 50} fill={INK_DIM} fontFamily={fonts.oswaldSemiBold} fontSize={15} letterSpacing={2.5} textAnchor="middle">
          dB SPL · AVG
        </SvgText>
        {band && (
          <SvgText x={CX} y={CY + 100} fill={ZONE_HEX[band.zone]} fontFamily={fonts.oswaldSemiBold} fontSize={33} letterSpacing={1.2} textAnchor="middle">
            {band.name}
          </SvgText>
        )}
      </Svg>
    </View>
  );
});
Spl3dGauge.displayName = 'Spl3dGauge';
