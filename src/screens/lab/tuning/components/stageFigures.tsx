/**
 * Stage figures shared by the rack chapters (2026-09-30): the fifth spiral
 * (ch.6) and the deviation-from-equal chart (ch.11), each an SVG with a fixed
 * viewBox that fills its box at its own shape — on the glass, in full screen
 * (text scales with the viewBox, nothing is re-authored) and in an
 * ExpandableFigure in the well. Both used to live inside their chapter files.
 */
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import {
  buildPythagoreanFifthChain, deviationFromEqualCents, frac, PYTHAGOREAN_COMMA, type TuningSystem,
} from '../../../../features/tuning/tuningMath';
import { ROLE } from './primitives';

const CHAIN = buildPythagoreanFifthChain(frac(1, 1), 12);

/* ── the fifth spiral (ch.6) ─────────────────────────────────────────────── */

/** 340 × 200: wide enough that the glass (L) draws it at full width — the
 *  old 340 × 240 shape fitted by HEIGHT and shrank its 9 pt labels under the
 *  phone floor. Every label is 10 in the viewBox (≥ 9 pt at any fit ≥ 0.9). */
export const SPIRAL_W = 340;
export const SPIRAL_H = 200;

/** Which end of the gap is sounding (review 2026-09-30): the HEAR tray's
 *  pick rings the C dot, the B♯ dot, or both — so a play key changes the
 *  picture, not only the SOUND cell. */
export type SpiralHighlight = 'C' | 'B♯' | 'both' | null;

export function Spiral({ fit = true, highlight = null }: { fit?: boolean; highlight?: SpiralHighlight }) {
  // Geometry: the outermost point (B♯, index 12) must stay INSIDE the viewBox
  // — r0 = 58 and 2.6 per fifth put it at r = 89.2, inside cy ± 100 with its
  // 6-px dot clear of the edge.
  const cx = 170, cy = 100, r0 = 58;
  const pts = CHAIN.map((s) => {
    const ang = (s.index / 12) * 2 * Math.PI - Math.PI / 2;
    // A spiral: the radius grows a little each fifth so the path never overlays itself;
    // the final point lands at the same angle as C but visibly outside it.
    const r = r0 + s.index * 2.6;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), s };
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const first = pts[0], last = pts[12];
  return (
    <View style={{ width: '100%' }} accessible accessibilityRole="image" accessibilityLabel={`Fifth spiral: twelve fifths return to C's direction but land outside it — B sharp sits ${PYTHAGOREAN_COMMA.cents.toFixed(2)} cents above C.`}>
      <Svg width="100%" height={fit ? undefined : SPIRAL_H} style={fit ? { aspectRatio: SPIRAL_W / SPIRAL_H } : undefined} viewBox={`0 0 ${SPIRAL_W} ${SPIRAL_H}`}>
        <Path d={d} fill="none" stroke={colors.textSub} strokeWidth={1.4} />
        {pts.map((p) => (
          <Svg key={p.s.index}>
            <Circle cx={p.x} cy={p.y} r={p.s.index === 0 || p.s.index === 12 ? 6 : 3.5} fill={p.s.index === 12 ? ROLE.error : p.s.index === 0 ? ROLE.exact : colors.textSecondary} />
            <SvgText x={p.x + (p.x > cx ? 9 : -9)} y={p.y + 3.5} fontSize={10} fill={p.s.index === 12 ? ROLE.error : colors.textSecondary} textAnchor={p.x > cx ? 'start' : 'end'} fontFamily={fonts.oswaldMedium}>{p.s.spelling}</SvgText>
          </Svg>
        ))}
        {/* the measurement bracket between expected and actual */}
        <Line x1={first.x} y1={first.y - 8} x2={last.x} y2={last.y + 8} stroke={ROLE.error} strokeWidth={1.5} strokeDasharray="3,2" />
        {highlight === 'C' || highlight === 'both' ? <Circle cx={first.x} cy={first.y} r={11} fill="none" stroke={ROLE.exact} strokeWidth={2} /> : null}
        {highlight === 'B♯' || highlight === 'both' ? <Circle cx={last.x} cy={last.y} r={11} fill="none" stroke={ROLE.error} strokeWidth={2} /> : null}
        <SvgText x={cx} y={cy - 4} fontSize={11} fill={ROLE.error} textAnchor="middle" fontFamily={fonts.oswaldMedium}>gap: {PYTHAGOREAN_COMMA.cents.toFixed(2)} ¢</SvgText>
        <SvgText x={cx} y={cy + 11} fontSize={10} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>EXPECTED C · ACTUAL B♯</SvgText>
        <SvgText x={cx} y={cy + 25} fontSize={10} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PYTHAGOREAN COMMA</SvgText>
      </Svg>
    </View>
  );
}

/* ── deviation from equal temperament (ch.11) ────────────────────────────── */

export const CHART_W = 340;
export const CHART_H = 150;

export function DeviationChart({ system, selected, onSelect, fit = true }: { system: TuningSystem; selected: number; onSelect: (i: number) => void; fit?: boolean }) {
  const W = CHART_W, H = CHART_H, zeroY = 66, scale = 2.2; // px per cent
  const notes = system.notes;
  const summary = `Deviation from equal temperament: ${notes.map((n) => `${n.spelling} ${deviationFromEqualCents(n) >= 0 ? '+' : ''}${deviationFromEqualCents(n).toFixed(2)} cents`).join(', ')}.`;
  return (
    <View style={{ width: '100%' }} accessible accessibilityLabel={summary}>
      <Svg width="100%" height={fit ? undefined : H} style={fit ? { aspectRatio: W / H } : undefined} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={fit ? 'xMidYMid meet' : 'none'}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Line x1={10} y1={zeroY} x2={W - 10} y2={zeroY} stroke={colors.textSub} strokeWidth={1.2} />
        {/* 9.5 in the viewBox (review 2026-09-30): on a 375-wide phone under
            700 pt tall the M glass drops to S and this 340 × 150 chart fits
            by HEIGHT at ×0.974 — a 9 was 8.8 pt on the glass. */}
        {/* Top right, clear of every bar (the largest positive deviation here
            is +9.78 ¢, 21 px): beside the axis it ran into D's "+3.9" label. */}
        <SvgText x={W - 12} y={14} fontSize={9.5} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.oswaldMedium}>0 ¢ = EQUAL TEMPERAMENT</SvgText>
        <SvgText x={12} y={14} fontSize={9.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>+ HIGHER</SvgText>
        <SvgText x={12} y={zeroY + 13} fontSize={9.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>− LOWER</SvgText>
        {notes.map((n, i) => {
          const dev = deviationFromEqualCents(n);
          const x = 40 + i * 38;
          const h = Math.min(50, Math.abs(dev) * scale);
          // Descriptive distance: green exact, gold within 10 ¢, orange beyond. Never red.
          const role = Math.abs(dev) < 0.05 ? 'exact' : Math.abs(dev) < 10 ? 'near' : 'far';
          return (
            <Svg key={i} onPress={() => onSelect(i)}>
              {/* A full-height hit lane per note: the bar alone (18 × 2 px for an exact note) was too small to tap. */}
              <Rect x={x - 18} y={16} width={36} height={H - 24} fill="transparent" />
              <Rect x={x - 9} y={dev >= 0 ? zeroY - h : zeroY} width={18} height={Math.max(2, h)} fill={ROLE[role]} opacity={i === selected ? 1 : 0.6} stroke={i === selected ? ROLE.active : 'none'} />
              <SvgText x={x} y={H - 8} fontSize={9.5} fill={i === selected ? ROLE.active : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{n.spelling}</SvgText>
              <SvgText x={x} y={dev >= 0 ? zeroY - h - 4 : zeroY + h + 11} fontSize={9.5} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{Math.abs(dev) < 0.05 ? '0' : `${dev > 0 ? '+' : ''}${dev.toFixed(1)}`}</SvgText>
            </Svg>
          );
        })}
      </Svg>
    </View>
  );
}
