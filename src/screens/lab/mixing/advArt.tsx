/**
 * Advanced Mixing — the teaching drawings, part 1: the GEAR and the ROUTING
 * (art fix 2026-10-16, after the lab-art grading: "20 modules with one
 * diagram … groups/VCAs, parallel, M/S, phase, depth and mix-bus are taught
 * in text; plain rounded boxes and grey Bezier wires; no console, bus or VCA
 * drawn as gear").
 *
 * Everything here is drawn as the mixer the learner will sit at: channel
 * strips face-on (insert slots at the top, pan pot, a long-throw fader on the
 * console taper — the same `faderDbToFrac` the Beginning lab's GearFader
 * uses — and the scribble tape at the BOTTOM with the channel name), group
 * and VCA strips with their conventional cap colours (grey channel, blue
 * group, yellow VCA, green return, red master), a compressor faceplate whose
 * knobs sit at the page's REAL settings, and nearfield monitors at their real
 * 1 : 1.6 cabinet ratio. Every cable is its own stroke with square turns;
 * wires into one bus land on their own pins in parallel lanes, never merged
 * (feedback_cables_traceable).
 *
 * Drawings are 340 wide and render ≥ 0.97 px per unit on a 390-wide phone,
 * so the 10-unit floor below keeps every word ≥ 9.7 pt. Names live on the
 * gear's own legends (tape, insert slot) — where the real desk prints them —
 * and every other label sits beside the object, never on it.
 *
 * Each drawing that has a page control takes that control's state as a prop
 * and redraws from it (a picked A/B variant, a pulled fader, an opened card):
 * nothing here is decoration.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { faderDbToFrac } from '../kit/gear';

/** Drawing width in viewBox units (see the header for the text floor). */
export const ART_W = 340;
/** The smallest word on any drawing (viewBox units → ≥ 9.7 pt on a phone). */
export const FS = 10;

export const ART = {
  bg: '#0e1015',
  panel: '#1b1d23',
  panelEdge: '#30343c',
  groove: '#07080a',
  tick: '#6c707a',
  ink: '#a6a6ad',
  inkDim: '#6f737d',
  wire: '#9aa3b5',
  wireDim: '#3d4452',
  tape: '#d9d3c2',
  tapeInk: '#17171a',
  amber: colors.amber,
  green: colors.green,
  cyan: colors.cyanBright,
  red: '#ff5f4e',
  control: '#c9a640',
} as const;

const CAP = { ch: '#8d9099', bus: '#3e6fb8', master: '#c4372a', ret: '#2f8f63', vca: '#d0a030' } as const;
export type CapKind = keyof typeof CAP;

/* ── frame + text ────────────────────────────────────────────────────────── */

export function ArtFrame({ h, a11y, children, w = ART_W }: { h: number; a11y: string; children: ReactNode; w?: number }) {
  return (
    <View style={styles.frame} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" viewBox={`0 0 ${w} ${h}`} style={{ aspectRatio: w / h }}>
        <Rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={10} fill={ART.bg} stroke={colors.hairline} strokeWidth={1} />
        {children}
      </Svg>
    </View>
  );
}

export function T({
  x,
  y,
  children,
  size = FS,
  color = ART.ink,
  anchor = 'middle',
  font = fonts.oswaldMedium,
  ls = 0.6,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  font?: string;
  ls?: number;
}) {
  return (
    <SvgText x={x} y={y} fontSize={Math.max(FS, size)} fill={color} fontFamily={font} textAnchor={anchor} letterSpacing={ls}>
      {children}
    </SvgText>
  );
}

/* ── wires ───────────────────────────────────────────────────────────────── */

type Pt = { x: number; y: number };

/** A cable as a wiring drawing runs it: square turns eased by a small bend. */
export function sqPath(pts: readonly Pt[], r = 4): string {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const c = pts[i];
    const b = pts[i + 1];
    const lin = Math.hypot(c.x - a.x, c.y - a.y);
    const lout = Math.hypot(b.x - c.x, b.y - c.y);
    const rr = Math.min(r, lin / 2, lout / 2);
    if (rr <= 0) continue;
    d += ` L ${c.x - ((c.x - a.x) / lin) * rr} ${c.y - ((c.y - a.y) / lin) * rr} Q ${c.x} ${c.y} ${c.x + ((b.x - c.x) / lout) * rr} ${c.y + ((b.y - c.y) / lout) * rr}`;
  }
  const z = pts[pts.length - 1];
  return `${d} L ${z.x} ${z.y}`;
}

/** One cable, its own stroke, arrowhead at the destination. */
export function Wire({ pts, color = ART.wire, dashed, width = 1.5, arrow = true }: { pts: readonly Pt[]; color?: string; dashed?: boolean; width?: number; arrow?: boolean }) {
  const z = pts[pts.length - 1];
  const p = pts[pts.length - 2];
  const len = Math.max(1, Math.hypot(z.x - p.x, z.y - p.y));
  const ux = (z.x - p.x) / len;
  const uy = (z.y - p.y) / len;
  const hx = z.x - ux * 4.2;
  const hy = z.y - uy * 4.2;
  const body = arrow ? [...pts.slice(0, -1), { x: hx, y: hy }] : pts;
  return (
    <G>
      <Path d={sqPath(body)} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dashed ? '3 2.5' : undefined} strokeLinecap="round" strokeLinejoin="round" />
      {arrow ? <Polygon points={`${z.x},${z.y} ${hx - uy * 2.8},${hy + ux * 2.8} ${hx + uy * 2.8},${hy - ux * 2.8}`} fill={color} /> : null}
    </G>
  );
}

/* ── small parts ─────────────────────────────────────────────────────────── */

/** A 270° pot: `frac` 0..1 → −135°…+135° from 12 o'clock. */
export function Knob({ cx, cy, r, frac, cap = '#6a7385', detent, dim }: { cx: number; cy: number; r: number; frac: number; cap?: string; detent?: boolean; dim?: boolean }) {
  const ticks: ReactNode[] = [];
  for (let k = 0; k <= 10; k++) {
    const a = ((-135 + 27 * k) * Math.PI) / 180;
    const big = k === 0 || k === 10 || (detent && k === 5);
    ticks.push(<Line key={k} x1={cx + Math.sin(a) * (r + 1.2)} y1={cy - Math.cos(a) * (r + 1.2)} x2={cx + Math.sin(a) * (r + (big ? 3 : 2.2))} y2={cy - Math.cos(a) * (r + (big ? 3 : 2.2))} stroke={big && detent && k === 5 ? '#b8bcc6' : ART.tick} strokeWidth={0.6} />);
  }
  const a = ((-135 + 270 * Math.max(0, Math.min(1, frac))) * Math.PI) / 180;
  return (
    <G opacity={dim ? 0.45 : 1}>
      {ticks}
      <Circle cx={cx} cy={cy + 0.7} r={r} fill="#000" opacity={0.45} />
      <Circle cx={cx} cy={cy} r={r} fill="#24272e" stroke="#050506" strokeWidth={0.6} />
      <Circle cx={cx} cy={cy} r={r * 0.58} fill={cap} />
      <Circle cx={cx - r * 0.2} cy={cy - r * 0.22} r={r * 0.24} fill="#fff" opacity={0.12} />
      <Line x1={cx + Math.sin(a) * r * 0.18} y1={cy - Math.cos(a) * r * 0.18} x2={cx + Math.sin(a) * r * 0.92} y2={cy - Math.cos(a) * r * 0.92} stroke="#f4f4f6" strokeWidth={Math.max(1, r * 0.16)} strokeLinecap="round" />
    </G>
  );
}

/** A square console button; `lit` colours it. */
export function Btn({ x, y, s = 6, lit }: { x: number; y: number; s?: number; lit?: string | null }) {
  return (
    <G>
      {lit ? <Rect x={x - 1.2} y={y - 1.2} width={s + 2.4} height={s + 2.4} rx={1.6} fill={lit} opacity={0.22} /> : null}
      <Rect x={x} y={y} width={s} height={s} rx={1} fill={lit ?? '#2a2d34'} stroke="#060607" strokeWidth={0.4} />
      <Rect x={x + 0.7} y={y + 0.5} width={s - 1.4} height={1.1} rx={0.5} fill="#fff" opacity={0.15} />
    </G>
  );
}

/** A 2-way nearfield monitor, cabinet 1 : 1.6 (the 180 × 290 mm class). */
export function Monitor({ x, y, w }: { x: number; y: number; w: number }) {
  const h = w * 1.6;
  const cx = x + w / 2;
  return (
    <G>
      <Rect x={x + 1} y={y + 1.5} width={w} height={h} rx={w * 0.08} fill="#000" opacity={0.45} />
      <Rect x={x} y={y} width={w} height={h} rx={w * 0.08} fill="#22252b" stroke="#060607" strokeWidth={0.7} />
      <Line x1={x + 1.5} y1={y + 1.4} x2={x + w - 1.5} y2={y + 1.4} stroke="#fff" strokeWidth={0.5} opacity={0.1} />
      <Circle cx={cx} cy={y + h * 0.22} r={w * 0.15} fill="#0b0c0e" stroke="#4a4e57" strokeWidth={0.6} />
      <Circle cx={cx} cy={y + h * 0.22} r={w * 0.06} fill="#8b8f97" opacity={0.7} />
      <Circle cx={cx} cy={y + h * 0.62} r={w * 0.37} fill="#0b0c0e" stroke="#4a4e57" strokeWidth={0.7} />
      <Circle cx={cx} cy={y + h * 0.62} r={w * 0.29} fill="#2b2e35" />
      <Circle cx={cx} cy={y + h * 0.62} r={w * 0.1} fill="#3a3d44" />
    </G>
  );
}

/** Closed-back studio headphones, side-on (the cue destination). */
export function Headphones({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const r = s * 0.42;
  return (
    <G>
      <Path d={`M ${cx - r} ${cy} A ${r} ${r * 1.05} 0 0 1 ${cx + r} ${cy}`} stroke="#3a3e46" strokeWidth={s * 0.09} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx - r} ${cy} A ${r} ${r * 1.05} 0 0 1 ${cx + r} ${cy}`} stroke="#5d646d" strokeWidth={s * 0.03} fill="none" />
      {[-1, 1].map((k) => (
        <G key={k}>
          <Rect x={cx + k * r - s * 0.13} y={cy - s * 0.02} width={s * 0.26} height={s * 0.42} rx={s * 0.11} fill="#1f2228" stroke="#060607" strokeWidth={0.6} />
          <Rect x={cx + k * r - s * 0.07} y={cy + s * 0.04} width={s * 0.14} height={s * 0.3} rx={s * 0.06} fill="#2c3038" />
        </G>
      ))}
    </G>
  );
}

/* ── the channel strip ───────────────────────────────────────────────────── */

export type StripProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The scribble-tape name. */
  name: string;
  /** Fader position (dB, console taper; −60 = −∞). */
  db: number;
  cap?: CapKind;
  /** Insert slots, top-down: a plug-in name, or null for an empty slot. */
  inserts?: readonly (string | null)[];
  /** The insert slot(s) lit as "in use" (index or indices). */
  insertOn?: number | readonly number[] | null;
  /** VCA-assign badge (e.g. "1"), or undefined for none. */
  vca?: string;
  /** Effective position a VCA is imposing (drawn as a dashed ghost cap). */
  ghostDb?: number | null;
  /** Aux send knobs (frac 0..1, cap colour), drawn above the pan pot. */
  sends?: readonly { frac: number; cap: string; lit?: boolean }[];
  /** SOLO-SAFE / SAFE lit (a return exempt from solo). */
  safe?: boolean;
  pan?: number | null;
  /** Highlight ring (a colour) — the strip the drawing is about. */
  hl?: string | null;
  dim?: boolean;
};

/** One channel strip, face-on — a DAW mixer channel and a console channel
 *  share this anatomy: inserts, sends, pan, fader, name tape. */
export function Strip(p: StripProps) {
  const { x, y, w, h, name } = p;
  const cap = CAP[p.cap ?? 'ch'];
  const parts: ReactNode[] = [];
  let cy = y + 5;
  const lit: readonly number[] = p.insertOn == null ? [] : typeof p.insertOn === 'number' ? [p.insertOn] : p.insertOn;
  (p.inserts ?? []).forEach((ins, k) => {
    const on = lit.includes(k) && ins != null;
    parts.push(
      <G key={`i${k}`}>
        <Rect x={x + 3} y={cy} width={w - 6} height={13} rx={2} fill={on ? '#2a2210' : ART.groove} stroke={on ? ART.amber : '#24272e'} strokeWidth={on ? 0.9 : 0.6} />
        {ins ? (
          <T x={x + w / 2} y={cy + 10} color={on ? ART.amber : ART.inkDim} size={FS} ls={0.3}>
            {ins}
          </T>
        ) : null}
      </G>,
    );
    cy += 15;
  });
  if (p.vca !== undefined) {
    parts.push(
      <G key="vca">
        <Rect x={x + 3} y={cy} width={w - 6} height={13} rx={2} fill="#2a2410" stroke={ART.control} strokeWidth={0.8} />
        <T x={x + w / 2} y={cy + 10} color={ART.control} ls={0.3}>
          {`VCA ${p.vca}`}
        </T>
      </G>,
    );
    cy += 15;
  }
  (p.sends ?? []).forEach((s, k) => {
    parts.push(<Knob key={`s${k}`} cx={x + w / 2} cy={cy + 6.5} r={4.6} frac={s.frac} cap={s.cap} />);
    cy += 15;
  });
  if (p.pan !== null) {
    const pan = p.pan ?? 0;
    parts.push(<Knob key="pan" cx={x + w / 2} cy={cy + 6.5} r={4.6} frac={0.5 + pan / 200} cap="#4a4f5a" detent />);
    cy += 15;
  }
  if (p.safe !== undefined) {
    parts.push(<Btn key="safe" x={x + w / 2 - 3} y={cy + 1} lit={p.safe ? ART.cyan : null} />);
    cy += 10;
  }
  const tapeH = 14;
  const ty = y + h - tapeH - 3;
  const fy0 = cy + 5;
  const fy1 = ty - 6;
  const fx = x + w * 0.6;
  const len = Math.max(8, fy1 - fy0);
  const yAt = (d: number) => fy1 - faderDbToFrac(d) * len;
  const capY = yAt(p.db);
  return (
    <G opacity={p.dim ? 0.45 : 1}>
      {p.hl ? <Rect x={x - 2.5} y={y - 2.5} width={w + 5} height={h + 5} rx={5} fill="none" stroke={p.hl} strokeWidth={1.3} /> : null}
      <Rect x={x + 1} y={y + 1.5} width={w} height={h} rx={3} fill="#000" opacity={0.4} />
      <Rect x={x} y={y} width={w} height={h} rx={3} fill={ART.panel} stroke={ART.panelEdge} strokeWidth={0.8} />
      <Line x1={x + 2} y1={y + 1.2} x2={x + w - 2} y2={y + 1.2} stroke="#fff" strokeWidth={0.5} opacity={0.08} />
      {parts}
      {/* fader: scale, groove, cap (unity emphasised) */}
      {[12, 0, -10, -20, -40].map((t) => (
        <Line key={t} x1={fx - 9} y1={yAt(t)} x2={fx - (t === 0 ? 4 : 5.5)} y2={yAt(t)} stroke={t === 0 ? '#b8bcc6' : ART.tick} strokeWidth={t === 0 ? 0.9 : 0.6} />
      ))}
      <Rect x={fx - 1.3} y={fy0} width={2.6} height={len} rx={1.3} fill={ART.groove} stroke="#1c1e23" strokeWidth={0.5} />
      {p.ghostDb != null ? <Rect x={fx - 7} y={yAt(p.ghostDb) - 3.6} width={14} height={7.2} rx={1.3} fill={ART.control} opacity={0.45} stroke={ART.control} strokeWidth={0.9} /> : null}
      <Rect x={fx - 7} y={capY - 3.6 + 1} width={14} height={7.2} rx={1.3} fill="#000" opacity={0.5} />
      <Rect x={fx - 7} y={capY - 3.6} width={14} height={7.2} rx={1.3} fill={cap} stroke="#0b0b0d" strokeWidth={0.5} />
      <Rect x={fx - 7} y={capY - 3.6} width={14} height={2} rx={1} fill="#fff" opacity={0.16} />
      <Line x1={fx - 6} y1={capY} x2={fx + 6} y2={capY} stroke="#f4f4f6" strokeWidth={0.8} />
      {/* scribble tape, at the bottom where desks put it */}
      <Rect x={x + 2} y={ty} width={w - 4} height={tapeH} rx={1.2} fill={ART.tape} />
      <T x={x + w / 2} y={ty + 10.6} color={ART.tapeInk} font={fonts.oswaldSemiBold} ls={0.4}>
        {name}
      </T>
    </G>
  );
}

/** Pins: where a strip's audio enters (top centre) and leaves (bottom centre). */
export const inPin = (s: { x: number; y: number; w: number }, dx = 0) => ({ x: s.x + s.w / 2 + dx, y: s.y });
export const outPin = (s: { x: number; y: number; w: number; h: number }) => ({ x: s.x + s.w / 2, y: s.y + s.h });

/* ── the compressor faceplate ────────────────────────────────────────────── */

export type CompSettings = { thresholdDb: number; ratio: number; attackMs: number; releaseMs: number };

const logFrac = (v: number, lo: number, hi: number) => Math.log(v / lo) / Math.log(hi / lo);
const fmtMs = (ms: number) => (ms < 10 ? `${ms} ms` : `${Math.round(ms)} ms`);

/** A compressor's front panel with its four knobs at the REAL settings the
 *  page renders with (threshold −60…0 dB, ratio 1…20 log, attack 0.1…100 ms
 *  log, release 10…2000 ms log), the value written under each knob. When
 *  `settings` is null the unit is BYPASSED (dark, the bypass button lit).
 *  `keyIn` lights the external sidechain (KEY) input and names its source. */
export function CompFace({ x, y, w, settings, keyIn, title = 'COMPRESSOR' }: { x: number; y: number; w: number; settings: CompSettings | null; keyIn?: string | null; title?: string }) {
  const on = settings != null;
  const s = settings ?? { thresholdDb: 0, ratio: 1, attackMs: 10, releaseMs: 100 };
  const cells = [
    { name: 'THRESH', frac: (s.thresholdDb + 60) / 60, val: on ? `${s.thresholdDb} dB` : '—' },
    { name: 'RATIO', frac: logFrac(s.ratio, 1, 20), val: on ? `${s.ratio}:1` : '—' },
    { name: 'ATTACK', frac: logFrac(s.attackMs, 0.1, 100), val: on ? fmtMs(s.attackMs) : '—' },
    { name: 'RELEASE', frac: logFrac(s.releaseMs, 10, 2000), val: on ? fmtMs(s.releaseMs) : '—' },
  ];
  const h = 66;
  const cw = (w - 44) / 4;
  return (
    <G>
      <Rect x={x + 1} y={y + 1.5} width={w} height={h} rx={4} fill="#000" opacity={0.45} />
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={on ? '#1d1f25' : '#15161a'} stroke={on ? '#4a4e57' : '#2a2d33'} strokeWidth={0.8} />
      {/* rack ears' screw holes */}
      <Circle cx={x + 6} cy={y + 8} r={1.6} fill="#0b0c0e" stroke="#3a3e46" strokeWidth={0.5} />
      <Circle cx={x + 6} cy={y + h - 8} r={1.6} fill="#0b0c0e" stroke="#3a3e46" strokeWidth={0.5} />
      <Circle cx={x + w - 6} cy={y + 8} r={1.6} fill="#0b0c0e" stroke="#3a3e46" strokeWidth={0.5} />
      <Circle cx={x + w - 6} cy={y + h - 8} r={1.6} fill="#0b0c0e" stroke="#3a3e46" strokeWidth={0.5} />
      {cells.map((c, k) => {
        const cx = x + 14 + cw * k + cw / 2;
        return (
          <G key={c.name}>
            <Knob cx={cx} cy={y + 20} r={8.5} frac={c.frac} cap={on ? '#b8892b' : '#3c3a33'} dim={!on} />
            <T x={cx} y={y + 44} color={on ? ART.ink : ART.inkDim} ls={0.5}>
              {c.name}
            </T>
            <T x={cx} y={y + 57} color={on ? ART.amber : ART.inkDim} font={fonts.mono} ls={0}>
              {c.val}
            </T>
          </G>
        );
      })}
      {/* bypass (lit = bypassed) and the external key input, legends below */}
      <Btn x={x + w - 22} y={y + 9} s={7} lit={on ? null : ART.red} />
      <T x={x + w - 18.5} y={y + 28} color={on ? ART.inkDim : ART.red} ls={0.3}>
        BYP
      </T>
      <Btn x={x + w - 22} y={y + 37} s={7} lit={keyIn ? ART.cyan : null} />
      <T x={x + w - 18.5} y={y + 56} color={keyIn ? ART.cyan : ART.inkDim} ls={0.3}>
        KEY
      </T>
      <T x={x + w / 2} y={y - 5} color={ART.ink} ls={1.2}>
        {on ? title : `${title} — BYPASSED`}
      </T>
    </G>
  );
}

const styles = StyleSheet.create({
  frame: { marginTop: 2 },
});
