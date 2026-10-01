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
 * The TENSION MAP around the lugs is coloured on the app-wide amplitude
 * ramp (features/tools/levelColor): blue = lower than the mean, red =
 * higher. The map is the evenness picture every rod turn changes.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor } from '../../../features/tools/levelColor';
import { DRUMS, lugAngle, lugCents, type DrumKind, type HeadState } from './drumEngine';

export { STAR_ORDER } from './drumEngine';

export const W = 360;
/** Smallest label in design units (≈ 9.7 pt on a 390-wide phone). */
export const FONT = 11;
export const F2 = 12.5;
export const FONT_S = 10.5;

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

/** The map tint for a lug's deviation (cents): −60 → blue, 0 → mid, +60 → red. */
export const mapTint = (cents: number): string => levelColor(Math.max(0, Math.min(1, 0.5 + cents / 120)));

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

/** Hoop, lug casings, rods and rod heads for N lugs around (cx, cy, R). */
function Hardware({ cx, cy, R, lugs, selected, loose, dimRods }: { cx: number; cy: number; R: number; lugs: number; selected?: number | null; loose?: number | null; dimRods?: boolean }) {
  const items: ReactNode[] = [];
  for (let i = 0; i < lugs; i++) {
    const a = lugAngle(i, lugs);
    const deg = (a * 180) / Math.PI + 90;
    const isLoose = loose === i;
    const c = polar(cx, cy, R + 27 + (isLoose ? 4 : 0), a);
    const rodIn = polar(cx, cy, R + 7, a);
    const rodOut = polar(cx, cy, R + 19 + (isLoose ? 4 : 0), a);
    const head = polar(cx, cy, R + 7, a);
    const sel = selected === i;
    items.push(
      <G key={i}>
        {/* tension rod */}
        <Line x1={rodIn.x} y1={rodIn.y} x2={rodOut.x} y2={rodOut.y} stroke={dimRods ? ink.metalDark : ink.metal} strokeWidth={2.4} />
        {isLoose ? <Line x1={polar(cx, cy, R + 11, a).x} y1={polar(cx, cy, R + 11, a).y} x2={polar(cx, cy, R + 15, a).x} y2={polar(cx, cy, R + 15, a).y} stroke={ink.red} strokeWidth={3} /> : null}
        {/* lug casing */}
        <G transform={`translate(${c.x},${c.y}) rotate(${deg})`}>
          <Rect x={-7} y={-9} width={14} height={18} rx={4} fill="url(#lugGrad)" stroke={ink.metalDark} strokeWidth={0.8} />
          <Circle cx={0} cy={0} r={1.6} fill={ink.metalDark} />
        </G>
        {/* claw / rod head on the hoop */}
        <G transform={`translate(${head.x},${head.y}) rotate(${deg})`}>
          <Rect x={-4} y={-3.5} width={8} height={7} rx={1} fill={sel ? ink.amber : ink.metalLight} stroke={ink.metalDark} strokeWidth={0.7} />
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
      {/* hoop: a triple-flanged ring */}
      <Circle cx={cx} cy={cy} r={R + 10} fill="none" stroke={ink.metal} strokeWidth={7} />
      <Circle cx={cx} cy={cy} r={R + 13} fill="none" stroke={ink.metalLight} strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={R + 7} fill="none" stroke={ink.metalDark} strokeWidth={1} />
      {items}
    </G>
  );
}

/** A drum key seated on lug `i`, with a turn arrow when `turns` ≠ 0. */
function DrumKey({ cx, cy, R, lugs, i, turns }: { cx: number; cy: number; R: number; lugs: number; i: number; turns: number }) {
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
      {arrow ? <SvgText x={16} y={-14} fontSize={F2} fill={ink.amber} fontFamily={fonts.barlowMedium} transform="rotate(0)">{arrow}</SvgText> : null}
    </G>
  );
}

export type DrumFaults = { worn?: boolean; loose?: number | null; debris?: number | null; uneven?: boolean };

export const TOP_H = 250;
export const TOP_ASPECT = W / TOP_H;

/**
 * The drum from above: hoop, lugs, rods, head — with the tension map
 * around the lugs, a drum key on the selected rod, the tap point, and the
 * optional inspection faults.
 */
export function DrumTopStage({ width, height, drum, head, which = 'batter', selected = null, showMap = true, tap = null, tapAll = false, faults, title, order, orderStep, hitCentre }: {
  width: number;
  height: number;
  drum: DrumKind;
  head: HeadState;
  which?: 'batter' | 'reso';
  selected?: number | null;
  showMap?: boolean;
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
}) {
  const spec = DRUMS[drum];
  const lugs = spec.lugs;
  const cx = 180;
  const cy = 125;
  const R = 84;
  const cents = lugCents(head);
  const halfA = (Math.PI / lugs) * 0.72;
  const steps = order && orderStep != null ? order.slice(0, Math.max(0, Math.min(order.length, orderStep + 1))) : [];
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${W} ${TOP_H}`}>
      <Rect x={0} y={0} width={W} height={TOP_H} fill={ink.bg} />
      <Hardware cx={cx} cy={cy} R={R} lugs={lugs} selected={selected} loose={faults?.loose ?? null} />
      {/* the head on its bearing edge */}
      <Circle cx={cx} cy={cy} r={R + 3} fill={ink.shellDark} />
      <Circle cx={cx} cy={cy} r={R} fill={which === 'batter' ? 'url(#headGrad)' : 'url(#resoGrad)'} stroke="#b8b09a" strokeWidth={0.8} />
      {/* collar / coating rings */}
      <Circle cx={cx} cy={cy} r={R - 4} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={R * 0.45} fill="none" stroke="rgba(0,0,0,.05)" strokeWidth={6} />
      {faults?.worn ? (
        <G>
          <Ellipse cx={cx - 10} cy={cy + 8} rx={26} ry={16} fill="rgba(90,80,60,.28)" />
          <Ellipse cx={cx + 18} cy={cy - 14} rx={12} ry={8} fill="rgba(90,80,60,.22)" />
          <Ellipse cx={cx - 4} cy={cy + 2} rx={7} ry={4.5} fill="rgba(40,30,20,.35)" />
          <SvgText x={cx - 4} y={cy + 36} fontSize={FONT} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>scuffed coating · dent</SvgText>
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
            return <Path key={i} d={arcPath(cx, cy, R - 17, R - 4, a - halfA, a + halfA)} fill={mapTint(c)} opacity={0.82} />;
          })
        : null}
      {/* lug numbers */}
      {Array.from({ length: lugs }, (_, i) => {
        const p = polar(cx, cy, R + 45, lugAngle(i, lugs));
        return (
          <SvgText key={i} x={p.x} y={p.y + 4} fontSize={FONT} fill={selected === i ? ink.amber : ink.dim} textAnchor="middle" fontFamily={fonts.mono}>
            {i + 1}
          </SvgText>
        );
      })}
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
            <SvgText x={p.x} y={p.y + 4} fontSize={FONT} fill={cur ? '#000' : ink.amber} textAnchor="middle" fontFamily={fonts.mono}>{k + 1}</SvgText>
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
      {selected != null ? <DrumKey cx={cx} cy={cy} R={R} lugs={lugs} i={selected} turns={head.turns[selected] ?? 0} /> : null}
      {/* legend */}
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.amber} fontFamily={fonts.oswaldMedium}>{(title ?? `${spec.name} · ${which === 'batter' ? 'BATTER' : 'RESONANT'} HEAD`).toUpperCase()}</SvgText>
      {showMap ? (
        <G>
          <Rect x={6} y={TOP_H - 20} width={60} height={6} fill="url(#mapLegend)" />
          <Defs>
            <LinearGradient id="mapLegend" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={mapTint(-60)} />
              <Stop offset="0.5" stopColor={mapTint(0)} />
              <Stop offset="1" stopColor={mapTint(60)} />
            </LinearGradient>
          </Defs>
          <SvgText x={6} y={TOP_H - 4} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.barlowMedium}>low · even · high (map, cents)</SvgText>
        </G>
      ) : null}
      {tap != null || tapAll ? <SvgText x={W - 6} y={TOP_H - 4} fontSize={FONT_S} fill={ink.dim} textAnchor="end" fontFamily={fonts.barlowMedium}>● tap point, 1" in from the rim</SvgText> : null}
    </Svg>
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
          <SvgText x={(x0 + x1) / 2} y={(yT + yB) / 2 + 4} fontSize={FONT} fill={hi('air') ?? ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>enclosed air</SvgText>
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
      <SvgText x={x0 - 16} y={yT - 10} fontSize={FONT} fill={hi('batter') ?? ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>batter head</SvgText>
      <SvgText x={x0 - 16} y={yB + 8} fontSize={FONT} fill={hi('reso') ?? ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>resonant head</SvgText>
      <SvgText x={x1 + 18} y={(yT + yB) / 2 + 4} fontSize={FONT} fill={hi('lugs') ?? ink.text} fontFamily={fonts.barlowMedium}>lug</SvgText>
      <SvgText x={x1 + 18} y={yT + 30} fontSize={FONT} fill={hi('rods') ?? ink.text} fontFamily={fonts.barlowMedium}>rod</SvgText>
      <SvgText x={x1 + 18} y={yT - 2} fontSize={FONT} fill={hi('hoop') ?? ink.text} fontFamily={fonts.barlowMedium}>hoop</SvgText>
      <SvgText x={x0 + 14} y={yT + 18} fontSize={FONT} fill={hi('edge') ?? ink.text} fontFamily={fonts.barlowMedium}>bearing edge</SvgText>
      <SvgText x={x0 + 14} y={(yT + yB) / 2 - 30} fontSize={FONT} fill={hi('shell') ?? ink.text} fontFamily={fonts.barlowMedium}>shell</SvgText>
      <SvgText x={W / 2} y={ANAT_H - 6} fontSize={F2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{PARTS.find((p) => p.id === part)?.label.toUpperCase()}</SvgText>
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
      <SvgText x={peakX} y={topY - 8} fontSize={FONT} fill={ink.amber} textAnchor="middle" fontFamily={fonts.barlowMedium}>contact</SvgText>
      <SvgText x={wallX + wallW + 26} y={topY + 6} fontSize={FONT} fill={ink.text} fontFamily={fonts.barlowMedium}>head (inside)</SvgText>
      <SvgText x={wallX + wallW + 26} y={topY + 60} fontSize={FONT} fill={ink.text} fontFamily={fonts.barlowMedium}>shell wall</SvgText>
      <SvgText x={wallX - 60} y={botY - 50} fontSize={FONT} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>rod</SvgText>
      <SvgText x={wallX - 60} y={topY + 32} fontSize={FONT} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>hoop</SvgText>
      <SvgText x={wallX - 60} y={botY - 24} fontSize={FONT} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>lug</SvgText>
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.amber} fontFamily={fonts.oswaldMedium}>BEARING EDGE · CROSS-SECTION</SvgText>
      <SvgText x={W / 2} y={EDGE_H - 2} fontSize={F2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{EDGES.find((e) => e.id === profile)?.label.toUpperCase()}</SvgText>
    </Svg>
  );
}

/* ── snare side view (Chapter 5) ─────────────────────────────────────────── */

export const SNARE_H = 200;
export const SNARE_ASPECT = W / SNARE_H;

/** The snare from the side: shell, both hoops, rods and lugs, the snare
 *  wires under the bottom head on their strainer and butt plate. The lever
 *  and the wire-to-head gap follow the strainer setting. */
export function SnareStage({ width, height, strainer, snareSideCents, playing }: { width: number; height: number; strainer: number; snareSideCents: number; playing?: boolean }) {
  const x0 = 60;
  const x1 = 300;
  const yT = 44;
  const yB = 128;
  const s = Math.max(0, Math.min(1, strainer));
  const gap = 10 - 8 * s; // wires float at 0, pressed in at 1
  const lever = -60 + 70 * s; // throw-off lever angle
  return (
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
      <SvgText x={x0 - 10} y={yT - 8} fontSize={FONT} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>batter</SvgText>
      <SvgText x={x1 + 10} y={yB + 2} fontSize={FONT} fill={ink.text} fontFamily={fonts.barlowMedium}>snare-side head</SvgText>
      <SvgText x={x1 + 10} y={yB + 26 + gap} fontSize={FONT} fill={ink.metalLight} fontFamily={fonts.barlowMedium}>wires</SvgText>
      <SvgText x={x0 + 30} y={yB + 48} fontSize={FONT} fill={ink.amber} fontFamily={fonts.barlowMedium}>strainer · {s < 0.1 ? 'OFF' : s < 0.4 ? 'loose' : s < 0.7 ? 'medium' : 'tight (choke)'}</SvgText>
      <SvgText x={x1 - 8} y={yB + 36} fontSize={FONT} fill={ink.text} textAnchor="end" fontFamily={fonts.barlowMedium}>butt plate</SvgText>
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.amber} fontFamily={fonts.oswaldMedium}>14" SNARE · SIDE VIEW</SvgText>
      <SvgText x={W - 6} y={14} fontSize={FONT} fill={ink.cyan} textAnchor="end" fontFamily={fonts.mono}>snare side {snareSideCents >= 0 ? '+' : ''}{snareSideCents.toFixed(0)} ¢ vs batter</SvgText>
      <SvgText x={W / 2} y={SNARE_H - 6} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>the wires answer to the snare-side head; the strainer sets how easily</SvgText>
    </Svg>
  );
}

/* ── kick side view (Chapter 5) ──────────────────────────────────────────── */

export const KICK_H = 200;
export const KICK_ASPECT = W / KICK_H;

export function KickStage({ width, height, front, damping, strike }: { width: number; height: number; front: 'open' | 'ported' | 'removed'; damping: number; strike: number }) {
  const x0 = 70; // front head (audience side)
  const x1 = 250; // batter side
  const yT = 28;
  const yB = 168;
  const d = Math.max(0, Math.min(1, damping));
  const pillowW = 30 + 70 * d;
  const beaterA = -20 - 30 * strike;
  return (
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
      {d > 0.02 ? <SvgText x={x1 - 8 - pillowW / 2} y={yB - 24} fontSize={FONT} fill="#4a4538" textAnchor="middle" fontFamily={fonts.barlowMedium}>pillow</SvgText> : null}
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
      {front === 'ported' ? <SvgText x={x0 - 12} y={yB - 56} fontSize={FONT} fill={ink.amber} textAnchor="end" fontFamily={fonts.barlowMedium}>port</SvgText> : null}
      {[yT - 2, (yT + yB) / 2, yB + 2].map((y) => (front !== 'removed' ? (
        <G key={y}>
          <Rect x={x0 - 14} y={y - 4} width={10} height={8} rx={1} fill={ink.metal} stroke={ink.metalDark} strokeWidth={0.5} />
          <Line x1={x0 + 4} y1={y} x2={x0 + 30} y2={y} stroke={ink.metal} strokeWidth={2} />
        </G>
      ) : null))}
      {/* pedal + beater */}
      <Rect x={x1 + 18} y={yB + 10} width={70} height={6} rx={2} fill={ink.metalDark} />
      <Path d={`M${x1 + 30} ${yB + 10} L${x1 + 80} ${yB - 2}`} stroke={ink.metal} strokeWidth={3} />
      <Line x1={x1 + 30} y1={yB + 10} x2={x1 + 30} y2={yB - 70} stroke={ink.metal} strokeWidth={3} />
      <G transform={`translate(${x1 + 30},${yB - 70}) rotate(${beaterA})`}>
        <Line x1={0} y1={0} x2={0} y2={-56 + 10} stroke={ink.metalLight} strokeWidth={2.4} />
        <Circle cx={0} cy={-56 + 6} r={9} fill="#8a7a63" stroke="#5a4e3f" strokeWidth={0.8} />
      </G>
      {/* labels */}
      <SvgText x={x1 + 2} y={yB + 30} fontSize={FONT} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>batter</SvgText>
      <SvgText x={x0 - 2} y={yB + 30} fontSize={FONT} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>{front === 'removed' ? 'front head off' : 'front head'}</SvgText>
      <SvgText x={x1 + 60} y={yB - 80} fontSize={FONT} fill={ink.text} fontFamily={fonts.barlowMedium}>beater</SvgText>
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.amber} fontFamily={fonts.oswaldMedium}>22" BASS DRUM · SIDE VIEW</SvgText>
      <SvgText x={W / 2} y={KICK_H - 6} fontSize={FONT_S} fill={ink.dim} textAnchor="middle" fontFamily={fonts.barlowMedium}>{front === 'open' ? 'closed front head: full coupling, longest note' : front === 'ported' ? 'ported: less coupling, faster decay, a mic path' : 'no front head: the batter alone, shortest note'}</SvgText>
    </Svg>
  );
}

/* ── the kit ladder (Chapter 6) ──────────────────────────────────────────── */

export const KIT_H = 210;
export const KIT_ASPECT = W / KIT_H;

/** Rack and floor tom side by side with a semitone ladder: each drum's useful
 *  band, its current fundamental, and the interval between them. */
export function KitStage({ width, height, rackHz, floorHz, verdict }: { width: number; height: number; rackHz: number; floorHz: number; verdict: 'distinct' | 'close' | 'unbalanced' }) {
  const lx = 232; // ladder x
  const top = 26;
  const bot = KIT_H - 26;
  const loHz = 70;
  const hiHz = 320;
  const yOf = (hz: number) => bot - ((Math.log2(hz / loHz) / Math.log2(hiHz / loHz)) * (bot - top));
  const tint = verdict === 'distinct' ? ink.green : verdict === 'close' ? ink.amber : ink.red;
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
        <SvgText x={x + w / 2} y={y - 10} fontSize={FONT} fill={ink.text} textAnchor="middle" fontFamily={fonts.barlowMedium}>{label}</SvgText>
        <SvgText x={x + w / 2} y={y + h + (legs ? 34 : 16)} fontSize={F2} fill={ink.amber} textAnchor="middle" fontFamily={fonts.mono}>{hz.toFixed(0)} Hz</SvgText>
      </G>
    );
  };
  return (
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
          <SvgText x={lx + 8} y={yOf(hz) + 4} fontSize={FONT_S} fill={ink.dim} fontFamily={fonts.mono}>{hz}</SvgText>
        </G>
      ))}
      {/* useful bands */}
      <Rect x={lx - 18} y={yOf(DRUMS.rack.usefulHz[1])} width={10} height={yOf(DRUMS.rack.usefulHz[0]) - yOf(DRUMS.rack.usefulHz[1])} fill="rgba(91,176,255,.25)" />
      <Rect x={lx - 32} y={yOf(DRUMS.floor.usefulHz[1])} width={10} height={yOf(DRUMS.floor.usefulHz[0]) - yOf(DRUMS.floor.usefulHz[1])} fill="rgba(55,224,95,.22)" />
      <SvgText x={lx - 13} y={yOf(DRUMS.rack.usefulHz[1]) - 4} fontSize={FONT_S} fill={ink.cyan} textAnchor="middle" fontFamily={fonts.barlowMedium}>rack</SvgText>
      <SvgText x={lx - 27} y={yOf(DRUMS.floor.usefulHz[0]) + 12} fontSize={FONT_S} fill={ink.green} textAnchor="middle" fontFamily={fonts.barlowMedium}>floor</SvgText>
      {/* markers + interval bracket */}
      <Circle cx={lx} cy={yOf(rackHz)} r={4.5} fill={ink.cyan} />
      <Circle cx={lx} cy={yOf(floorHz)} r={4.5} fill={ink.green} />
      <Line x1={lx + 40} y1={yOf(rackHz)} x2={lx + 40} y2={yOf(floorHz)} stroke={tint} strokeWidth={2} />
      <Line x1={lx + 36} y1={yOf(rackHz)} x2={lx + 44} y2={yOf(rackHz)} stroke={tint} strokeWidth={2} />
      <Line x1={lx + 36} y1={yOf(floorHz)} x2={lx + 44} y2={yOf(floorHz)} stroke={tint} strokeWidth={2} />
      <SvgText x={lx + 48} y={(yOf(rackHz) + yOf(floorHz)) / 2 + 4} fontSize={F2} fill={tint} fontFamily={fonts.mono}>{Math.abs(12 * Math.log2(rackHz / floorHz)).toFixed(1)} st</SvgText>
      <SvgText x={6} y={14} fontSize={FONT} fill={ink.amber} fontFamily={fonts.oswaldMedium}>THE TOM RANGE · FUNDAMENTALS</SvgText>
      <SvgText x={W - 6} y={KIT_H - 6} fontSize={FONT} fill={tint} textAnchor="end" fontFamily={fonts.oswaldMedium}>{verdict.toUpperCase()}</SvgText>
    </Svg>
  );
}
