/**
 * svgArt — the Cable Dressing & Installation Lab's DRAWING KIT for the scenes
 * (react-native-svg). Owner 2026-09-26: the scene drawings were "primitive,
 * poor quality, lines too thick, resolution not fine enough, amateurish" — so
 * poor they blocked publishing the lab. This kit is the fix, shared by every
 * stage so the whole lab draws like one hand.
 *
 * WHY SVG, NOT THE SKIA KIT (cableArt.tsx): the scenes are SVG — their taps,
 * their draw-in motion (motion.tsx) and their FULL SCREEN all ride on SVG
 * viewBoxes, and an SVG viewBox scales EVERY part (strokes, radii, text) with
 * the zoom step (D35 rule 4) for free. So the Skia kit's ideas are ported here
 * rather than its canvases embedded: the same Catmull-Rom spline, the same
 * light-placed specular ribbon, the same tonal stack across a jacket.
 *
 * ── HOW A CABLE IS DRAWN ────────────────────────────────────────────────────
 * Five layers, dark to light: a soft contact shadow, the jacket edge (core
 * shadow), the jacket body, a bounce rim on the side away from the light and a
 * specular stripe placed BY THE LIGHT (upper-left) — so the highlight travels
 * round a bend instead of snapping across it. Diameter is geometry: pass the
 * cable's real OD in the drawing's own units (D39 — true proportions).
 *
 * ── HARDWARE IS DESIGNED IN MILLIMETRES ────────────────────────────────────
 * Every object below is authored in mm about its own origin and placed with
 * `k` = drawing units per mm. So an XLR is 19 mm across and a cable tie strap
 * is 4.8 mm wide in every scene, whatever the scene's scale — the drawing can
 * never quietly turn a 4.8 mm tie into a 20 mm belt.
 *
 * ── RULES ──────────────────────────────────────────────────────────────────
 *  • Gradient / clip ids are unique PER INSTANCE (useUid) — the inline figure
 *    and its FULL SCREEN copy are both mounted, and a duplicate id resolves to
 *    whichever copy the browser met first (motion.tsx's tile-06 failure).
 *  • Static geometry only; motion stays in motion.tsx. The one exception is the
 *    optional `progress` on SvgCable, which drives the lab's DRAW language
 *    (the cable installs itself) through primitive props only.
 *  • Generic hardware only — no brand likenesses, no trade dress.
 */
import { useId, useMemo } from 'react';
import {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useAnimatedProps, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { fonts } from '../../../theme/tokens';
import { CI_JACKET, lightRibbon, polyPath, ribbon, shade, spline, tint, type Pt } from './cableArt';
import { APath } from './motion';

export { shade, tint, spline, type Pt };

/* ══ palette ═══════════════════════════════════════════════════════════════ */

/** Jacket colours. The class tints are the lab's training colours (the
 *  workbench legend); `black`/`grey` are what most real audio cable looks like. */
export const JACKET = {
  ...CI_JACKET,
  black: '#2a2c31',
  grey: '#5d6068',
  blue: '#2d5f9e',
  orange: '#c4692a',
  yellow: '#c9a52c',
  white: '#c9cbd0',
} as const;
export type JacketKey = keyof typeof JACKET;
export function jacketHex(j: JacketKey | string) {
  return (JACKET as Record<string, string>)[j] ?? j;
}

export const METAL = { hi: '#c4c9d2', mid: '#80868f', lo: '#3b3f46', edge: '#1d1f24' };
export const ZINC = { hi: '#d3d7dc', mid: '#9ba1a8', lo: '#5d636b', edge: '#2d3036' };
export const NYLON = { hi: '#f1efe6', mid: '#d4d0c2', lo: '#9d998b', edge: '#5f5c52' };
export const NYLON_BLACK = { hi: '#6a6c72', mid: '#34363b', lo: '#1c1d21', edge: '#0c0c0e' };
export const INK = {
  label: '#d9dbe0',
  sub: '#9a9ca4',
  good: '#4fdc86',
  bad: '#ff7a68',
  warn: '#ffc64d',
  info: '#6cc7ff',
};

/* ══ ids ═══════════════════════════════════════════════════════════════════ */

/** A per-instance id prefix safe for SVG url(#…) references. */
export function useUid(): string {
  const raw = useId();
  return useMemo(() => 'ci' + raw.replace(/[^a-zA-Z0-9]/g, ''), [raw]);
}

/* ══ geometry ══════════════════════════════════════════════════════════════ */

function normals(poly: Pt[]): Pt[] {
  const n: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[Math.max(0, i - 1)];
    const b = poly[Math.min(poly.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    n.push({ x: -dy / len, y: dx / len });
  }
  return n;
}

export function polyLength(poly: Pt[]) {
  let s = 0;
  for (let i = 1; i < poly.length; i++) s += Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y);
  return s;
}

/** Point + unit tangent at fraction t (0..1) of a polyline's length. */
export function pointAt(poly: Pt[], t: number): { p: Pt; tan: Pt } {
  const total = polyLength(poly);
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1];
    const b = poly[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (target <= seg || i === poly.length - 1) {
      const f = seg > 0 ? Math.min(1, target / seg) : 0;
      const len = seg || 1;
      return { p: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }, tan: { x: (b.x - a.x) / len, y: (b.y - a.y) / len } };
    }
    target -= seg;
  }
  return { p: poly[poly.length - 1], tan: { x: 1, y: 0 } };
}

export function angleOf(tan: Pt) {
  return (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
}

/** A drooping run between two points (a free span always sags). */
export function sagPoints(a: Pt, b: Pt, sag: number, n = 6): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + Math.sin(Math.PI * t) * sag });
  }
  return out;
}

/* ══ CABLE ═════════════════════════════════════════════════════════════════ */

export type CableGeo = {
  poly: Pt[];
  line: string;
  len: number;
  shadow: string;
  spec: string;
  fine: string;
  bounce: string;
};

export function cableGeo(points: Pt[], d: number, perSeg = 14, splineIt = true): CableGeo {
  const poly = splineIt ? spline(points, perSeg) : points;
  return {
    poly,
    line: polyPath(poly),
    len: polyLength(poly),
    shadow: polyPath(poly.map((p) => ({ x: p.x + d * 0.2, y: p.y + d * 0.38 }))),
    spec: lightRibbon(poly, d * 0.15, d * 0.24),
    fine: lightRibbon(poly, d * 0.045, d * 0.28),
    bounce: lightRibbon(poly, d * 0.07, -d * 0.36),
  };
}

export type SvgCableProps = {
  /** Waypoints (splined) — or pass `geo` precomputed. */
  points?: Pt[];
  geo?: CableGeo;
  /** Outside diameter in drawing units. */
  d: number;
  jacket?: JacketKey | string;
  shadow?: boolean;
  /** Rubber / fabric jackets: duller sheen. */
  matte?: boolean;
  opacity?: number;
  /** 0..1 installed fraction (the DRAW language). Omit = fully installed. */
  progress?: SharedValue<number>;
};

/** One jacketed cable (see the header for the five-layer stack). */
export function SvgCable({ points, geo: g0, d, jacket = 'black', shadow = true, matte = false, opacity = 1, progress }: SvgCableProps) {
  const base = jacketHex(jacket);
  const geo = useMemo(() => g0 ?? cableGeo(points ?? [], d), [g0, points, d]);
  if (!geo.line) return null;
  const len = geo.len + d * 2;
  const stroke = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const specOp = matte ? 0.32 : 0.6;
  return (
    <G opacity={opacity}>
      {shadow ? (
        <>
          <DashPath pv={progress} len={len} d={geo.shadow} stroke="rgba(0,0,0,0.2)" strokeWidth={d * 1.7} {...stroke} />
          <DashPath pv={progress} len={len} d={geo.shadow} stroke="rgba(0,0,0,0.36)" strokeWidth={d * 0.95} {...stroke} />
        </>
      ) : null}
      <DashPath pv={progress} len={len} d={geo.line} stroke={shade(base, 0.62)} strokeWidth={d} {...stroke} />
      <DashPath pv={progress} len={len} d={geo.line} stroke={base} strokeWidth={d * 0.78} {...stroke} />
      {geo.bounce ? <FadePath pv={progress} d={geo.bounce} fill={shade(base, 0.4)} op={0.5} /> : null}
      {geo.spec ? <FadePath pv={progress} d={geo.spec} fill={tint(base, matte ? 0.3 : 0.55)} op={specOp} /> : null}
      {geo.fine ? <FadePath pv={progress} d={geo.fine} fill="#ffffff" op={matte ? 0.16 : 0.45} /> : null}
    </G>
  );
}

type PathLike = {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  strokeLinecap?: 'round' | 'butt' | 'square';
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
  opacity?: number;
};

/** A stroke that installs itself when `pv` (0..1) is given; static otherwise. */
export function DashPath({ pv, len, ...p }: PathLike & { pv?: SharedValue<number>; len: number }) {
  const own = useSharedValue(1);
  const v = pv ?? own;
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - v.value) }));
  if (!pv) return <Path {...p} />;
  return <APath {...p} strokeDasharray={len} strokeDashoffset={len * (1 - v.value)} animatedProps={ap} />;
}

/** A fill that fades up as an install completes (sheen lags the leading edge). */
function FadePath({ pv, op, ...p }: PathLike & { pv?: SharedValue<number>; op: number }) {
  const own = useSharedValue(1);
  const v = pv ?? own;
  const ap = useAnimatedProps(() => ({ opacity: op * Math.max(0, Math.min(1, (v.value - 0.82) / 0.18)) }));
  if (!pv) return <Path {...p} opacity={op} />;
  return <APath {...p} opacity={0} animatedProps={ap} />;
}

/** A straight cable along x from x0 to x1 at y — the cheap, common case. */
export function StraightCable({ x0, x1, y, d, jacket = 'black', shadow = true, matte }: { x0: number; x1: number; y: number; d: number; jacket?: JacketKey | string; shadow?: boolean; matte?: boolean }) {
  const pts = useMemo(() => [{ x: x0, y }, { x: (x0 + x1) / 2, y }, { x: x1, y }], [x0, x1, y]);
  return <SvgCable points={pts} d={d} jacket={jacket} shadow={shadow} matte={matte} />;
}

/* ══ shared small parts ════════════════════════════════════════════════════ */

/** Pan-head machine screw, seen head-on (Phillips). r in drawing units. */
export function Screw({ x, y, r, tone = METAL }: { x: number; y: number; r: number; tone?: typeof METAL }) {
  const id = useUid();
  return (
    <G>
      <Defs>
        <RadialGradient id={`${id}s`} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor={tone.hi} />
          <Stop offset="0.55" stopColor={tone.mid} />
          <Stop offset="1" stopColor={tone.lo} />
        </RadialGradient>
      </Defs>
      <Circle cx={x + r * 0.15} cy={y + r * 0.22} r={r} fill="rgba(0,0,0,0.45)" />
      <Circle cx={x} cy={y} r={r} fill={`url(#${id}s)`} stroke={tone.edge} strokeWidth={r * 0.14} />
      <Path d={`M${x - r * 0.55} ${y} H${x + r * 0.55} M${x} ${y - r * 0.55} V${y + r * 0.55}`} stroke={tone.edge} strokeWidth={r * 0.26} strokeLinecap="round" />
    </G>
  );
}

/** A pill-backed callout. `size` is the font size in drawing units. */
export function Callout({
  x,
  y,
  text,
  color = INK.label,
  size = 10,
  anchor = 'middle',
  bg = 'rgba(10,11,14,0.86)',
  border,
  font = fonts.oswaldSemiBold,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  bg?: string | null;
  border?: string;
  font?: string;
}) {
  const w = text.length * size * 0.56 + size * 0.9;
  const h = size * 1.45;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const tx = anchor === 'middle' ? x : anchor === 'end' ? x - size * 0.45 : x + size * 0.45;
  return (
    <G>
      {bg ? <Rect x={left} y={y - h * 0.72} width={w} height={h} rx={h * 0.3} fill={bg} stroke={border ?? 'none'} strokeWidth={size * 0.08} /> : null}
      <SvgText x={tx} y={y + size * 0.02} fontFamily={font} fontSize={size} fill={color} textAnchor={anchor} letterSpacing={size * 0.06}>
        {text}
      </SvgText>
    </G>
  );
}

/** Thin leader line with a dot on the object end. */
export function Leader({ x1, y1, x2, y2, color = INK.sub, w = 0.8 }: { x1: number; y1: number; x2: number; y2: number; color?: string; w?: number }) {
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} />
      <Circle cx={x1} cy={y1} r={w * 1.7} fill={color} />
    </G>
  );
}

/** A tick / cross verdict badge (drawn, never an emoji). */
export function VerdictBadge({ x, y, r, good }: { x: number; y: number; r: number; good: boolean }) {
  const c = good ? INK.good : INK.bad;
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="rgba(10,11,14,0.9)" stroke={c} strokeWidth={r * 0.14} />
      {good ? (
        <Path d={`M${x - r * 0.45} ${y + r * 0.02} L${x - r * 0.1} ${y + r * 0.36} L${x + r * 0.5} ${y - r * 0.34}`} stroke={c} strokeWidth={r * 0.22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d={`M${x - r * 0.38} ${y - r * 0.38} L${x + r * 0.38} ${y + r * 0.38} M${x + r * 0.38} ${y - r * 0.38} L${x - r * 0.38} ${y + r * 0.38}`} stroke={c} strokeWidth={r * 0.22} strokeLinecap="round" />
      )}
    </G>
  );
}

/* ══ TIES & WRAPS (side-on, authored in mm) ════════════════════════════════ */

/**
 * A cable tie seen from the side, cinched across a bundle that runs left-right.
 * Origin = bundle centre; `halfH` is half the bundle height IN MM where the tie
 * sits. Strap 4.8 mm (a standard 4.8 × 200 mm tie). The head (≈ 8 × 10 mm) sits
 * proud of the bundle with the tail cut flush — the professional finish.
 * `bite` 0..1 draws the strap sunk into a crushed jacket (over-tightening).
 */
export function CableTie({
  x,
  y,
  k,
  halfH,
  strap = 4.8,
  black = false,
  headAt = 'top',
  bite = 0,
  tail = 'flush',
}: {
  x: number;
  y: number;
  k: number;
  halfH: number;
  strap?: number;
  black?: boolean;
  headAt?: 'top' | 'bottom';
  bite?: number;
  tail?: 'flush' | 'long';
}) {
  const id = useUid();
  const t = black ? NYLON_BLACK : NYLON;
  const dir = headAt === 'top' ? -1 : 1;
  const bow = strap * 0.55;
  const H = halfH * (1 - bite * 0.18);
  const hw = strap / 2;
  // band: from top to bottom, bowing toward the viewer (+x a touch)
  const band = `M${-hw} ${-H} C${-hw + bow} ${-H * 0.4} ${-hw + bow} ${H * 0.4} ${-hw} ${H} L${hw} ${H} C${hw + bow} ${H * 0.4} ${hw + bow} ${-H * 0.4} ${hw} ${-H} Z`;
  const teeth: string[] = [];
  const n = Math.max(4, Math.round((2 * H) / 1.6));
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const yy = -H + f * 2 * H;
    const bx = Math.sin(f * Math.PI) * bow * 0.75;
    teeth.push(`M${-hw * 0.72 + bx} ${yy} H${hw * 0.72 + bx}`);
  }
  const headW = strap * 1.75;
  const headH = strap * 2.1;
  const hy = dir * (H + headH * 0.42);
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Defs>
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={t.lo} />
          <Stop offset="0.35" stopColor={t.hi} />
          <Stop offset="0.7" stopColor={t.mid} />
          <Stop offset="1" stopColor={t.lo} />
        </LinearGradient>
        <LinearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.hi} />
          <Stop offset="0.5" stopColor={t.mid} />
          <Stop offset="1" stopColor={t.lo} />
        </LinearGradient>
      </Defs>
      {/* shadow of the band on the bundle */}
      <Path d={band} fill="rgba(0,0,0,0.45)" transform={`translate(${strap * 0.35} ${strap * 0.2})`} />
      {bite > 0 ? (
        // the jacket bulging either side of a strap that has sunk in
        <>
          <Path d={`M${-hw - 0.6} ${-H} Q${-hw - 2.2 * bite} 0 ${-hw - 0.6} ${H}`} stroke="rgba(0,0,0,0.55)" strokeWidth={1.2} fill="none" />
          <Path d={`M${hw + 0.6} ${-H} Q${hw + 2.6 * bite} 0 ${hw + 0.6} ${H}`} stroke="rgba(0,0,0,0.55)" strokeWidth={1.2} fill="none" />
        </>
      ) : null}
      <Path d={band} fill={`url(#${id}b)`} stroke={t.edge} strokeWidth={0.35} />
      <Path d={teeth.join('')} stroke={t.lo} strokeWidth={0.32} opacity={0.9} />
      {/* ratchet head */}
      <G transform={`translate(0 ${hy})`}>
        <Rect x={-headW / 2 + 0.5} y={-headH / 2 + 0.7} width={headW} height={headH} rx={1.1} fill="rgba(0,0,0,0.5)" />
        <Rect x={-headW / 2} y={-headH / 2} width={headW} height={headH} rx={1.1} fill={`url(#${id}h)`} stroke={t.edge} strokeWidth={0.35} />
        <Rect x={-strap * 0.46} y={-headH / 2 + 1.3} width={strap * 0.92} height={headH - 2.6} rx={0.5} fill={black ? '#0b0b0d' : '#6d6a60'} />
        <Rect x={-strap * 0.46} y={dir < 0 ? headH / 2 - 2.9 : -headH / 2 + 1.3} width={strap * 0.92} height={1.1} fill={t.mid} />
        <Line x1={-headW / 2 + 0.6} y1={-headH / 2 + 0.45} x2={headW / 2 - 0.6} y2={-headH / 2 + 0.45} stroke="rgba(255,255,255,0.55)" strokeWidth={0.35} />
      </G>
      {tail === 'long' ? (
        <Path
          d={`M${-hw * 0.8} ${hy + dir * headH * 0.5} C${-hw} ${hy + dir * 14} ${6} ${hy + dir * 22} ${18} ${hy + dir * 26} L${19.5} ${hy + dir * 22.5} C${8} ${hy + dir * 18} ${hw} ${hy + dir * 12} ${hw * 0.8} ${hy + dir * headH * 0.5} Z`}
          fill={t.mid}
          stroke={t.edge}
          strokeWidth={0.35}
        />
      ) : null}
    </G>
  );
}

/**
 * Hook-and-loop (Velcro-type) wrap, side-on, 19 mm wide, with its overlapping
 * tab. Fabric: matte, a nap texture, no ratchet head. Origin = bundle centre.
 */
export function HookLoopWrap({
  x,
  y,
  k,
  halfH,
  width = 19,
  color = '#23262b',
}: {
  x: number;
  y: number;
  k: number;
  halfH: number;
  width?: number;
  color?: string;
}) {
  const id = useUid();
  const hw = width / 2;
  const H = halfH + 0.8;
  const bow = 2.2;
  const band = `M${-hw} ${-H} C${-hw + bow} ${-H * 0.4} ${-hw + bow} ${H * 0.4} ${-hw} ${H} L${hw} ${H} C${hw + bow} ${H * 0.4} ${hw + bow} ${-H * 0.4} ${hw} ${-H} Z`;
  const nap: string[] = [];
  for (let yy = -H + 1.2; yy < H - 0.6; yy += 1.5) {
    for (let xx = -hw + 1; xx < hw - 0.5; xx += 2.1) {
      const off = ((Math.round(yy * 3) % 2) + 2) % 2 ? 1 : 0;
      nap.push(`M${xx + off} ${yy} l0.7 0.5`);
    }
  }
  return (
    <G transform={`translate(${x} ${y}) scale(${k})`}>
      <Defs>
        <LinearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(color, 0.45)} />
          <Stop offset="0.4" stopColor={tint(color, 0.16)} />
          <Stop offset="1" stopColor={shade(color, 0.35)} />
        </LinearGradient>
      </Defs>
      <Path d={band} fill="rgba(0,0,0,0.45)" transform="translate(1.2 0.9)" />
      <Path d={band} fill={`url(#${id}v)`} stroke={shade(color, 0.7)} strokeWidth={0.4} />
      <Path d={nap.join('')} stroke={tint(color, 0.3)} strokeWidth={0.35} opacity={0.55} />
      {/* the overlapping tab end, stitched */}
      <Rect x={-hw - 0.4} y={-H - 3.4} width={width * 0.62} height={5.4} rx={1.2} fill={tint(color, 0.08)} stroke={shade(color, 0.7)} strokeWidth={0.4} />
      <Line x1={-hw + 1} y1={-H - 0.9} x2={-hw + width * 0.55} y2={-H - 0.9} stroke={tint(color, 0.35)} strokeWidth={0.3} strokeDasharray="1 0.8" />
    </G>
  );
}

/* ══ CONNECTORS (side-on, mm; cable enters from the LEFT at the origin) ═════ */

export type ConnKind = 'xlrF' | 'xlrM' | 'trs' | 'rj45' | 'speakon' | 'iec' | 'bnc' | 'lc' | 'powercon';

/**
 * A cable-mount connector with its strain-relief boot. Real proportions:
 * XLR 19 mm Ø × ~62 mm incl. boot; RJ45 11.7 × 14 mm body; ¼" TRS 6.35 mm
 * shaft; NL4-type 32 mm Ø; IEC C13 ~ 22 × 30 mm; BNC 14 mm Ø; LC 6 × 14 mm.
 */
export function Connector({
  kind,
  x,
  y,
  k,
  angle = 0,
  jacket = 'black',
}: {
  kind: ConnKind;
  x: number;
  y: number;
  k: number;
  angle?: number;
  jacket?: JacketKey | string;
}) {
  const id = useUid();
  const base = jacketHex(jacket);
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${k})`}>
      <Defs>
        <LinearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={METAL.hi} />
          <Stop offset="0.35" stopColor="#eef1f5" />
          <Stop offset="0.6" stopColor={METAL.mid} />
          <Stop offset="1" stopColor={METAL.lo} />
        </LinearGradient>
        <LinearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5a5d64" />
          <Stop offset="0.3" stopColor="#3a3c42" />
          <Stop offset="1" stopColor="#141518" />
        </LinearGradient>
        <LinearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tint(base, 0.3)} />
          <Stop offset="0.35" stopColor={base} />
          <Stop offset="1" stopColor={shade(base, 0.55)} />
        </LinearGradient>
      </Defs>
      {/* contact shadow */}
      <Rect x={2} y={-7} width={kind === 'rj45' || kind === 'lc' ? 30 : kind === 'trs' ? 64 : 62} height={14} rx={5} fill="rgba(0,0,0,0.35)" transform="translate(1.4 2.4)" />
      {kind === 'rj45' || kind === 'lc' ? null : <Boot id={id} len={20} r0={3.4} r1={6.2} />}
      {kind === 'xlrF' || kind === 'xlrM' ? <Xlr id={id} female={kind === 'xlrF'} /> : null}
      {kind === 'trs' ? <Trs id={id} /> : null}
      {kind === 'rj45' ? <Rj45 id={id} /> : null}
      {kind === 'speakon' || kind === 'powercon' ? <Twist id={id} blue={kind === 'powercon'} /> : null}
      {kind === 'iec' ? <Iec id={id} /> : null}
      {kind === 'bnc' ? <Bnc id={id} /> : null}
      {kind === 'lc' ? <Lc id={id} /> : null}
    </G>
  );
}

function Boot({ id, len, r0, r1 }: { id: string; len: number; r0: number; r1: number }) {
  const ribs: string[] = [];
  for (let i = 1; i < 6; i++) {
    const x = (len * i) / 6.2;
    const r = r0 + ((r1 - r0) * i) / 6;
    ribs.push(`M${x} ${-r} V${r}`);
  }
  return (
    <G>
      <Path d={`M0 ${-r0} L${len} ${-r1} L${len} ${r1} L0 ${r0} Z`} fill={`url(#${id}d)`} stroke="#0c0d0f" strokeWidth={0.4} />
      <Path d={ribs.join('')} stroke="#0e0f12" strokeWidth={0.7} opacity={0.8} />
      <Path d={`M0.5 ${-r0 + 0.5} L${len - 0.5} ${-r1 + 0.6}`} stroke="rgba(255,255,255,0.28)" strokeWidth={0.5} />
    </G>
  );
}

function Xlr({ id, female }: { id: string; female: boolean }) {
  // body Ø19 from x=20 to x=56; front shell to x=62
  return (
    <G>
      <Rect x={19} y={-9.5} width={37} height={19} rx={2.6} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.45} />
      {/* knurl / grip ring behind the boot */}
      <Path d={[0, 1, 2, 3, 4, 5].map((i) => `M${21 + i * 1.3} -9 V9`).join('')} stroke={METAL.lo} strokeWidth={0.35} opacity={0.7} />
      {/* shell split line */}
      <Line x1={44} y1={-9.4} x2={44} y2={9.4} stroke={METAL.edge} strokeWidth={0.4} />
      {female ? (
        <>
          {/* latch button — only the FEMALE cable connector has it */}
          <Rect x={46} y={-11.2} width={6} height={2.4} rx={1} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.35} />
          <Rect x={56} y={-9.2} width={2.4} height={18.4} rx={0.8} fill={METAL.lo} stroke={METAL.edge} strokeWidth={0.35} />
        </>
      ) : (
        <>
          {/* male: the shell sleeve and its key slot */}
          <Rect x={56} y={-8.6} width={7} height={17.2} rx={0.8} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.4} />
          <Rect x={58} y={-8.8} width={5} height={1.6} fill={METAL.edge} />
        </>
      )}
      <Path d="M20 -8.2 H55" stroke="rgba(255,255,255,0.7)" strokeWidth={0.55} />
    </G>
  );
}

function Trs({ id }: { id: string }) {
  return (
    <G>
      <Rect x={19} y={-7} width={24} height={14} rx={2.4} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.45} />
      <Path d={[0, 1, 2, 3, 4, 5, 6].map((i) => `M${21 + i * 1.4} -6.6 V6.6`).join('')} stroke={METAL.lo} strokeWidth={0.35} opacity={0.6} />
      <Rect x={43} y={-4.6} width={3} height={9.2} rx={0.6} fill="#1a1b1f" />
      {/* 6.35 mm shaft: sleeve, ring, tip, with the two black insulators */}
      <Rect x={46} y={-3.17} width={13} height={6.35} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.35} />
      <Rect x={59} y={-3.17} width={1.6} height={6.35} fill="#15161a" />
      <Rect x={60.6} y={-3.17} width={4.2} height={6.35} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.35} />
      <Rect x={64.8} y={-3.17} width={1.6} height={6.35} fill="#15161a" />
      <Path d="M66.4 -3.17 H68.2 Q70.6 -3.17 70.6 0 Q70.6 3.17 68.2 3.17 H66.4 Z" fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.35} />
      <Path d="M20 -5.8 H42" stroke="rgba(255,255,255,0.7)" strokeWidth={0.5} />
    </G>
  );
}

function Rj45({ id }: { id: string }) {
  // snagless boot 0..12, clear body 12..33 (11.7 mm tall), latch on top
  return (
    <G>
      <Path d="M0 -3.2 L10 -5.4 L13 -6.6 L13 6.6 L10 5.4 L0 3.2 Z" fill={`url(#${id}k)`} stroke="rgba(0,0,0,0.6)" strokeWidth={0.35} />
      <Path d="M13 -7.2 C9 -9 6 -9.6 3.4 -9.6" stroke={`url(#${id}k)`} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Rect x={13} y={-5.85} width={20} height={11.7} rx={1} fill="rgba(210,225,235,0.28)" stroke="rgba(220,235,245,0.75)" strokeWidth={0.4} />
      {/* conductors visible through the clear body, then the 8 gold contacts */}
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} x1={13.5} y1={-3 + i * 2} x2={27} y2={-3 + i * 2} stroke={['#e8a23c', '#4fae55', '#3a78c8', '#b56a34'][i]} strokeWidth={0.8} />
      ))}
      <Rect x={27.5} y={-4.8} width={5} height={9.6} fill="#c9a13c" opacity={0.9} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Line key={i} x1={27.5} y1={-4 + i * 1.33} x2={32.5} y2={-4 + i * 1.33} stroke="#7a5c18" strokeWidth={0.25} />
      ))}
      <Path d="M16 -5.85 L30 -5.85 L31.5 -9 L18 -9 Z" fill="rgba(210,225,235,0.35)" stroke="rgba(220,235,245,0.7)" strokeWidth={0.35} />
      <Line x1={14} y1={-5.2} x2={32} y2={-5.2} stroke="rgba(255,255,255,0.55)" strokeWidth={0.4} />
    </G>
  );
}

function Twist({ id, blue }: { id: string; blue: boolean }) {
  const body = blue ? '#1d3e63' : '#1c1d21';
  return (
    <G>
      <Rect x={19} y={-13} width={30} height={26} rx={5} fill={body} stroke="#0a0a0c" strokeWidth={0.5} />
      <Rect x={20} y={-12} width={28} height={9} rx={4} fill="rgba(255,255,255,0.1)" />
      {/* twist-lock collar with grip ribs */}
      <Rect x={49} y={-16} width={13} height={32} rx={3} fill={`url(#${id}d)`} stroke="#0a0a0c" strokeWidth={0.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Line key={i} x1={51 + i * 2.2} y1={-15.5} x2={51 + i * 2.2} y2={15.5} stroke="#0c0c0e" strokeWidth={0.6} />
      ))}
      <Rect x={62} y={-11} width={4} height={22} rx={1.2} fill={blue ? '#2c5a8c' : '#2c2e33'} />
    </G>
  );
}

function Iec({ id }: { id: string }) {
  return (
    <G>
      <Rect x={19} y={-11} width={18} height={22} rx={3} fill={`url(#${id}d)`} stroke="#0a0a0c" strokeWidth={0.5} />
      <Path d="M37 -11 H48 L50 -8 V8 L48 11 H37 Z" fill={`url(#${id}d)`} stroke="#0a0a0c" strokeWidth={0.5} />
      <Path d="M20 -9.6 H47" stroke="rgba(255,255,255,0.22)" strokeWidth={0.6} />
    </G>
  );
}

function Bnc({ id }: { id: string }) {
  return (
    <G>
      <Rect x={19} y={-5} width={12} height={10} rx={1.5} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.4} />
      <Rect x={31} y={-7} width={14} height={14} rx={1.5} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.4} />
      <Path d={[0, 1, 2, 3, 4].map((i) => `M${33 + i * 2.4} -6.6 V6.6`).join('')} stroke={METAL.lo} strokeWidth={0.4} />
      <Rect x={45} y={-5.5} width={6} height={11} fill={`url(#${id}m)`} stroke={METAL.edge} strokeWidth={0.4} />
    </G>
  );
}

function Lc({ id }: { id: string }) {
  return (
    <G>
      <Path d="M0 -1.8 L8 -3 L8 3 L0 1.8 Z" fill="#6b4ea3" stroke="#2b1f45" strokeWidth={0.3} />
      <Rect x={8} y={-3.2} width={14} height={6.4} rx={0.8} fill="#e9e6f2" stroke="#8b86a0" strokeWidth={0.35} />
      <Path d="M10 -3.2 L19 -3.2 L20.5 -6 L11.5 -6 Z" fill="#dcd8e8" stroke="#8b86a0" strokeWidth={0.3} />
      <Rect x={22} y={-1.25} width={4} height={2.5} fill="#f4f4f6" stroke="#9a9aa4" strokeWidth={0.25} />
      <Path d={`M9 -2.6 H21`} stroke={`url(#${id}m)`} strokeWidth={0.3} />
    </G>
  );
}

/* ══ LABELS ════════════════════════════════════════════════════════════════ */

/**
 * A self-laminating wrap-around label on a cable, side-on: the printed white
 * patch with its ID, the clear laminate tail wrapped over it. Origin = the
 * cable centre; `d` the cable OD (mm); text sized in mm (min readable).
 */
export function WrapLabel({
  x,
  y,
  k,
  d,
  text,
  angle = 0,
  w = 26,
}: {
  x: number;
  y: number;
  k: number;
  d: number;
  text: string;
  angle?: number;
  w?: number;
}) {
  const h = d + 3.4;
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${k})`}>
      <Rect x={-w / 2 + 0.6} y={-h / 2 + 0.9} width={w} height={h} rx={1.2} fill="rgba(0,0,0,0.45)" />
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={1.2} fill="#eceae3" stroke="#8d8a80" strokeWidth={0.3} />
      <Rect x={-w / 2} y={-h / 2} width={w} height={h * 0.28} rx={1.2} fill="rgba(255,255,255,0.65)" />
      <Rect x={-w / 2} y={h / 2 - h * 0.22} width={w} height={h * 0.22} fill="rgba(0,0,0,0.12)" />
      {Math.min(h * 0.62, 7.5) * k >= 9 ? (
        <SvgText x={0} y={h * 0.2} fontFamily={fonts.mono} fontSize={Math.min(h * 0.62, 7.5)} fill="#17181b" textAnchor="middle">
          {text}
        </SvgText>
      ) : (
        // At true scale the printed ID is smaller than the 9 pt floor, so it is
        // drawn as print (bars), never as unreadable words; scenes name it in a
        // callout when the ID matters.
        <Path
          d={`M${-w * 0.36} ${-h * 0.12} h${w * 0.3} M${-w * 0.02} ${-h * 0.12} h${w * 0.36} M${-w * 0.36} ${h * 0.16} h${w * 0.5}`}
          stroke="#1c1d21"
          strokeWidth={h * 0.14}
        />
      )}
    </G>
  );
}

/* ══ SURFACES ══════════════════════════════════════════════════════════════ */

/** Powder-coated steel panel (equipment rear / rack door) with an edge bevel. */
export function PanelSurface({ x, y, w, h, color = '#26282d', rx = 1.5 }: { x: number; y: number; w: number; h: number; color?: string; rx?: number }) {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}p`} x1="0" y1="0" x2="0.35" y2="1">
          <Stop offset="0" stopColor={tint(color, 0.1)} />
          <Stop offset="1" stopColor={shade(color, 0.3)} />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${id}p)`} stroke={shade(color, 0.6)} strokeWidth={0.6} />
      <Line x1={x + rx} y1={y + 0.6} x2={x + w - rx} y2={y + 0.6} stroke="rgba(255,255,255,0.14)" strokeWidth={0.6} />
    </G>
  );
}

/**
 * A perforated vent field (round holes on a staggered pitch), with an optional
 * heat glow behind it. mm-authored hole Ø 3, pitch 5.
 */
export function VentField({ x, y, w, h, k, hot = 0 }: { x: number; y: number; w: number; h: number; k: number; hot?: number }) {
  const id = useUid();
  const holes: string[] = [];
  const pitch = 5 * k;
  const r = 1.5 * k;
  let row = 0;
  for (let yy = y + pitch * 0.6; yy < y + h - r; yy += pitch * 0.866) {
    const off = row % 2 ? pitch / 2 : 0;
    for (let xx = x + pitch * 0.6 + off; xx < x + w - r; xx += pitch) {
      holes.push(`M${xx - r} ${yy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`);
    }
    row++;
  }
  return (
    <G>
      <Defs>
        <RadialGradient id={`${id}g`} cx="50%" cy="50%" r="60%">
          <Stop offset="0" stopColor="#ff6a3d" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#ff6a3d" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} rx={1.2} fill="#121316" stroke="#07080a" strokeWidth={0.5} />
      <Path d={holes.join('')} fill="#050506" />
      {hot > 0 ? <Rect x={x} y={y} width={w} height={h} fill={`url(#${id}g)`} opacity={hot} /> : null}
      <Path d={holes.join('')} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3 * k} />
    </G>
  );
}

/* ══ RACK HARDWARE ═════════════════════════════════════════════════════════ */

/**
 * Rear-rack LACING BAR, seen from behind the rack: a 6 mm round steel rod on
 * two offset brackets that screw into the rack rails. Cables are dressed along
 * it and retained with hook-and-loop. (x0..x1, y) = the rod centreline.
 */
export function LacingBar({ x0, x1, y, k }: { x0: number; x1: number; y: number; k: number }) {
  const id = useUid();
  const r = 3 * k;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ZINC.hi} />
          <Stop offset="0.4" stopColor="#f3f5f7" />
          <Stop offset="0.7" stopColor={ZINC.mid} />
          <Stop offset="1" stopColor={ZINC.lo} />
        </LinearGradient>
      </Defs>
      {[x0, x1].map((bx, i) => (
        <G key={i}>
          <Path
            d={`M${bx - 5 * k} ${y - 26 * k} h${10 * k} v${20 * k} l${-2 * k} ${6 * k} h${-6 * k} l${-2 * k} ${-6 * k} Z`}
            fill={`url(#${id}r)`}
            stroke={ZINC.edge}
            strokeWidth={0.5 * k}
          />
          <Screw x={bx} y={y - 20 * k} r={2.6 * k} tone={ZINC} />
        </G>
      ))}
      <Rect x={x0 - 4 * k} y={y - r + 0.9 * k} width={x1 - x0 + 8 * k} height={2 * r} rx={r} fill="rgba(0,0,0,0.4)" transform={`translate(${1.2 * k} ${1.8 * k})`} />
      <Rect x={x0 - 4 * k} y={y - r} width={x1 - x0 + 8 * k} height={2 * r} rx={r} fill={`url(#${id}r)`} stroke={ZINC.edge} strokeWidth={0.4 * k} />
    </G>
  );
}

/**
 * Panel-mount receptacle, seen head-on: a D-series flange (26 × 31 mm) with
 * two fixing screws. `kind` picks the insert: XLR female (3 sockets + latch
 * slot), XLR male (3 pins in a shell), RJ45 (etherCON-style), NL4 (twist).
 */
export function PanelJack({ x, y, k, kind = 'xlrF', occupied = false }: { x: number; y: number; k: number; kind?: 'xlrF' | 'xlrM' | 'rj45' | 'nl4'; occupied?: boolean }) {
  const id = useUid();
  const W = 26 * k;
  const H = 31 * k;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#4a4d54" />
          <Stop offset="1" stopColor="#1b1c20" />
        </LinearGradient>
        <RadialGradient id={`${id}c`} cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#2a2c31" />
          <Stop offset="1" stopColor="#060607" />
        </RadialGradient>
      </Defs>
      <Rect x={x - W / 2} y={y - H / 2} width={W} height={H} rx={2 * k} fill={`url(#${id}f)`} stroke="#0b0b0d" strokeWidth={0.5 * k} />
      <Screw x={x - 9.5 * k} y={y - 12 * k} r={1.6 * k} />
      <Screw x={x + 9.5 * k} y={y + 12 * k} r={1.6 * k} />
      <Circle cx={x} cy={y} r={11.8 * k} fill={`url(#${id}c)`} stroke="#6e727a" strokeWidth={0.6 * k} />
      {occupied ? null : kind === 'xlrF' ? (
        <G>
          <Rect x={x - 2 * k} y={y - 12.2 * k} width={4 * k} height={3.2 * k} fill="#0a0a0b" />
          {[
            [-3.5, 1.8],
            [3.5, 1.8],
            [0, -3.2],
          ].map(([dx, dy], i) => (
            <Circle key={i} cx={x + dx * k} cy={y + dy * k} r={1.25 * k} fill="#020203" stroke="#8d8a7e" strokeWidth={0.35 * k} />
          ))}
        </G>
      ) : kind === 'xlrM' ? (
        <G>
          {[
            [-3.5, 1.8],
            [3.5, 1.8],
            [0, -3.2],
          ].map(([dx, dy], i) => (
            <Circle key={i} cx={x + dx * k} cy={y + dy * k} r={0.8 * k} fill="#d9c47a" />
          ))}
        </G>
      ) : kind === 'rj45' ? (
        <G>
          <Rect x={x - 6 * k} y={y - 4.5 * k} width={12 * k} height={9 * k} rx={0.6 * k} fill="#030304" stroke="#7b7f86" strokeWidth={0.35 * k} />
          <Rect x={x - 2.2 * k} y={y + 4.5 * k} width={4.4 * k} height={1.6 * k} fill="#030304" />
          <Path d={[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${x - 4.4 * k + i * 1.26 * k} ${y - 4 * k} v${2.4 * k}`).join('')} stroke="#c9a13c" strokeWidth={0.45 * k} />
        </G>
      ) : (
        <G>
          <Circle cx={x} cy={y} r={6.5 * k} fill="#111" stroke="#50535a" strokeWidth={0.4 * k} />
          <Path d={`M${x - 1.4 * k} ${y - 6.5 * k} h${2.8 * k} v${3 * k} h${-2.8 * k} Z`} fill="#030304" />
        </G>
      )}
    </G>
  );
}

/** A floor, seen in low 3/4 view: concrete with a soft perspective gradient. */
export function FloorBand({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const id = useUid();
  const flecks: string[] = [];
  for (let i = 0; i < Math.round(w / 6); i++) {
    const fx = x + ((i * 37) % w);
    const fy = y + 2 + ((i * 53) % Math.max(1, h - 4));
    flecks.push(`M${fx} ${fy} h${0.8 + (i % 3) * 0.4}`);
  }
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a1b1f" />
          <Stop offset="1" stopColor="#2c2d32" />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} fill={`url(#${id}f)`} />
      <Path d={flecks.join('')} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} />
      <Line x1={x} y1={y} x2={x + w} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
    </G>
  );
}

/** Soft elliptical drop shadow — for anything resting on a surface. */
export function DropShadow({ cx, cy, rx, ry, opacity = 0.5 }: { cx: number; cy: number; rx: number; ry: number; opacity?: number }) {
  const id = useUid();
  return (
    <G>
      <Defs>
        <RadialGradient id={`${id}s`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000" stopOpacity={opacity} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}s)`} />
    </G>
  );
}

/**
 * A rack mounting rail (EIA-310): 15.9 mm wide steel with 9.5 mm square holes
 * at the universal pattern — 6.35 / 22.2 / 38.1 mm within each 44.45 mm U.
 * (x, y0..y1) = the rail's left edge and extent; `uTop` = y of a U boundary.
 */
export function RackRail({ x, y0, y1, k, uTop }: { x: number; y0: number; y1: number; k: number; uTop?: number }) {
  const id = useUid();
  const w = 15.9 * k;
  const U = 44.45 * k;
  const start = uTop ?? y0;
  const holes: string[] = [];
  const s = 9.5 * k;
  for (let u = Math.floor((y0 - start) / U) - 1; start + u * U < y1; u++) {
    for (const off of [6.35, 22.225, 38.1]) {
      const cy = start + u * U + off * k;
      if (cy - s / 2 < y0 || cy + s / 2 > y1) continue;
      holes.push(`M${x + w / 2 - s / 2} ${cy - s / 2} h${s} v${s} h${-s} Z`);
    }
  }
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#50545b" />
          <Stop offset="0.3" stopColor="#8d929a" />
          <Stop offset="0.7" stopColor="#5d6168" />
          <Stop offset="1" stopColor="#2a2d32" />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y0} width={w} height={y1 - y0} fill={`url(#${id}r)`} stroke="#15171a" strokeWidth={0.5 * k} />
      <Path d={holes.join('')} fill="#08090b" stroke="rgba(255,255,255,0.18)" strokeWidth={0.4 * k} />
    </G>
  );
}

/**
 * The REAR of a rack device: powder-coated panel, top/bottom chassis lip, and
 * four corner screws. Contents (jacks, vents, inlets) are drawn by the caller.
 */
export function DeviceRear({ x, y, w, h, k, color = '#2b2d33' }: { x: number; y: number; w: number; h: number; k: number; color?: string }) {
  return (
    <G>
      <Rect x={x + 1.2 * k} y={y + 2.4 * k} width={w} height={h} rx={1.2 * k} fill="rgba(0,0,0,0.5)" />
      <PanelSurface x={x} y={y} w={w} h={h} color={color} rx={1.2 * k} />
      <Line x1={x} y1={y + 3 * k} x2={x + w} y2={y + 3 * k} stroke="rgba(0,0,0,0.5)" strokeWidth={0.6 * k} />
      <Line x1={x} y1={y + h - 3 * k} x2={x + w} y2={y + h - 3 * k} stroke="rgba(0,0,0,0.5)" strokeWidth={0.6 * k} />
      <Screw x={x + 6 * k} y={y + 8 * k} r={2.2 * k} />
      <Screw x={x + w - 6 * k} y={y + 8 * k} r={2.2 * k} />
      <Screw x={x + 6 * k} y={y + h - 8 * k} r={2.2 * k} />
      <Screw x={x + w - 6 * k} y={y + h - 8 * k} r={2.2 * k} />
    </G>
  );
}

/**
 * A cable-mount plug seen from BEHIND (the rear-of-rack view): the metal
 * barrel end, the ribbed strain-relief boot, and the cable leaving its centre.
 * Draw the cable to (x, y) FIRST, then this on top. Ø in mm.
 */
export function PlugRearView({ x, y, k, dia = 19, kind = 'xlr' }: { x: number; y: number; k: number; dia?: number; kind?: 'xlr' | 'iec' }) {
  const id = useUid();
  const R = (dia / 2) * k;
  return (
    <G>
      <Defs>
        <RadialGradient id={`${id}b`} cx="38%" cy="30%" r="75%">
          <Stop offset="0" stopColor={kind === 'xlr' ? '#eef1f4' : '#4a4c52'} />
          <Stop offset="0.55" stopColor={kind === 'xlr' ? METAL.mid : '#26272c'} />
          <Stop offset="1" stopColor={kind === 'xlr' ? METAL.lo : '#0e0e10'} />
        </RadialGradient>
      </Defs>
      <Circle cx={x + 0.8 * k} cy={y + 1.6 * k} r={R} fill="rgba(0,0,0,0.5)" />
      {kind === 'xlr' ? (
        <Circle cx={x} cy={y} r={R} fill={`url(#${id}b)`} stroke={METAL.edge} strokeWidth={0.5 * k} />
      ) : (
        <Rect x={x - R} y={y - R * 1.2} width={2 * R} height={2.4 * R} rx={2.5 * k} fill={`url(#${id}b)`} stroke="#050506" strokeWidth={0.5 * k} />
      )}
      <Circle cx={x} cy={y} r={R * 0.62} fill="#1b1c20" stroke="#050506" strokeWidth={0.4 * k} />
      <Circle cx={x} cy={y} r={R * 0.46} fill="none" stroke="#2e3036" strokeWidth={0.7 * k} />
      <Circle cx={x} cy={y} r={R * 0.3} fill="none" stroke="#2e3036" strokeWidth={0.7 * k} />
    </G>
  );
}
