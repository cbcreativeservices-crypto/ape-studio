/**
 * VenueView — the lab's signature plot: a top-down venue with the stage
 * across the top, the audience below, the loudspeakers' coverage drawn as
 * light beams, and the audience floor tinted by the app's amplitude heat
 * ramp. Every mode draws its system on this one plot.
 *
 * Pure react-native-svg. Illustrated gear from gearArt; coverage from the
 * feature's conceptual model (badged ILLUSTRATIVE wherever the field shows).
 *
 * Interaction is tap-only (WCAG 2.5.7: no drag as the only path): tap a slot
 * to place, tap gear to select or inspect, tap a cable to remove it. Hit
 * targets are transparent circles (`fill="transparent"` — `none` does not
 * receive presses in react-native-svg).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { heatColor } from '../../../../features/tools/levelColor';
import { SLOTS, slotDef } from '../../../../features/soundsystems/system';
import { beamPolygon, fieldValue, type Beam } from '../../../../features/soundsystems/coverage';
import type { Link, Placed, SignalLevel, SlotId } from '../../../../features/soundsystems/types';
import { gearSpec } from '../../../../features/soundsystems/gear';
import { GearInSvg, INK, type GlyphKind } from './gearArt';

export const PLOT_W = 360;
export const PLOT_H = 330;
const AUD_TOP = 150;
const AUD_BOTTOM = 318;

export type PlotBeam = Beam & { color: string; label?: string };

export type VenueViewProps = {
  placed?: readonly Placed[];
  links?: readonly Link[];
  /** Coverage beams to draw and to build the floor field from. */
  beams?: readonly PlotBeam[];
  /** Tint the audience floor by summed coverage. */
  field?: boolean;
  /** Empty slots to offer as targets (drawn as dotted rings). */
  targets?: readonly SlotId[];
  selectedId?: string | null;
  /** Ids that a trace found live (lit) vs silent (dimmed). */
  liveIds?: ReadonlySet<string>;
  onTapSlot?: (slot: SlotId) => void;
  onTapPlaced?: (id: string) => void;
  onTapLink?: (link: Link) => void;
  /** Extra overlay, drawn last (timing rings, callouts). */
  overlay?: React.ReactNode;
  /** Honesty micro-badge text shown over the plot. */
  badge?: string;
  caption?: string;
  /** Accessible description of the whole plot. */
  a11y: string;
};

const LEVEL_COLOR: Record<SignalLevel, string> = {
  acoustic: '#8a8b93',
  mic: colors.greenBright,
  instrument: '#9ad36a',
  line: colors.amber,
  speaker: '#ff7a5c',
  digital: INK.blue,
  wireless: '#7fd4ff',
  };

function slotXY(slot: SlotId) {
  const s = slotDef(slot);
  return { x: s.x, y: s.y };
}

/** A cable between two devices: a shallow curve, never a straight wire. */
function cablePath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  // bow the curve to the side, proportional to length, so parallel runs separate
  const bow = Math.min(22, len * 0.18);
  const cx = mx - (dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function VenueView(p: VenueViewProps) {
  const placed = p.placed ?? [];
  const links = p.links ?? [];
  const beams = p.beams ?? [];
  const byId = useMemo(() => new Map(placed.map((x) => [x.id, x])), [placed]);

  // The floor field: a coarse grid of tinted cells over the audience area.
  const cells = useMemo(() => {
    if (!p.field || beams.length === 0) return [];
    const cols = 24;
    const rows = 12;
    const cw = (PLOT_W - 16) / cols;
    const ch = (AUD_BOTTOM - AUD_TOP) / rows;
    const out: { x: number; y: number; w: number; h: number; c: string; o: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 8 + c * cw;
        const y = AUD_TOP + r * ch;
        const v = fieldValue(beams, x + cw / 2, y + ch / 2);
        out.push({ x, y, w: cw + 0.6, h: ch + 0.6, c: heatColor(v), o: 0.22 + v * 0.5 });
      }
    }
    return out;
  }, [beams, p.field]);

  const occupied = new Set(placed.map((x) => x.slot));

  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={p.a11y}>
      <Svg width="100%" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} style={{ aspectRatio: PLOT_W / PLOT_H }}>
        <Defs>
          <LinearGradient id="vv-stage" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1c2130" />
            <Stop offset="1" stopColor="#11141c" />
          </LinearGradient>
          <LinearGradient id="vv-floor" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0f1116" />
            <Stop offset="1" stopColor="#0a0b0e" />
          </LinearGradient>
          <LinearGradient id="vv-beam" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* the room */}
        <Rect x={0} y={0} width={PLOT_W} height={PLOT_H} rx={12} fill="url(#vv-floor)" />
        <Rect x={0.5} y={0.5} width={PLOT_W - 1} height={PLOT_H - 1} rx={12} fill="none" stroke={colors.hairline} />
        {/* audience floor field */}
        {cells.map((c, i) => (
          <Rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.c} opacity={c.o} />
        ))}
        {/* seating rows, faint */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Line key={i} x1={20} y1={AUD_TOP + 12 + i * 24} x2={PLOT_W - 20} y2={AUD_TOP + 12 + i * 24} stroke="#ffffff" strokeWidth={0.6} opacity={0.05} />
        ))}
        {/* the stage */}
        <Path d="M 22 10 L 338 10 L 346 112 L 14 112 Z" fill="url(#vv-stage)" stroke="#2a3040" strokeWidth={1} />
        <Path d="M 22.5 10.5 L 337.5 10.5" stroke="#fff" strokeWidth={0.8} opacity={0.1} />
        <Rect x={14} y={112} width={332} height={3} fill="#0a0b0e" />
        <SvgText x={180} y={122} fontSize={7} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={2}>STAGE LIP</SvgText>
        <SvgText x={180} y={PLOT_H - 6} fontSize={7} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={2}>BACK OF ROOM</SvgText>
        <SvgText x={28} y={158} fontSize={6.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1.5}>RACKS</SvgText>

        {/* coverage beams as light */}
        {beams.map((b, i) => {
          const pts = beamPolygon(b, b.coverDeg >= 360 ? 90 : 180);
          const d = pts.map((q) => `${q.x},${q.y}`).join(' ');
          return (
            <G key={i}>
              <Polygon points={d} fill={b.color} opacity={0.13} />
              <Polygon points={d} fill="none" stroke={b.color} strokeWidth={0.8} opacity={0.5} strokeDasharray={b.coverDeg >= 360 ? '2 3' : undefined} />
            </G>
          );
        })}

        {/* cables */}
        {links.map((l) => {
          const a = byId.get(l.from);
          const b = byId.get(l.to);
          if (!a || !b) return null;
          const pa = slotXY(a.slot);
          const pb = slotXY(b.slot);
          const live = !p.liveIds || p.liveIds.has(b.id);
          const col = LEVEL_COLOR[l.level];
          const d = cablePath(pa, pb);
          return (
            <G key={`${l.from}-${l.to}`}>
              <Path d={d} stroke="#000" strokeWidth={3.6} fill="none" opacity={0.45} />
              <Path d={d} stroke={col} strokeWidth={2} fill="none" opacity={live ? 0.95 : 0.35} strokeDasharray={l.level === 'wireless' ? '3 4' : undefined} strokeLinecap="round" />
              {live && l.level !== 'wireless' ? <Path d={d} stroke="#fff" strokeWidth={0.6} fill="none" opacity={0.35} /> : null}
              {p.onTapLink ? <Path d={d} stroke="transparent" strokeWidth={14} fill="none" onPress={() => p.onTapLink?.(l)} accessibilityLabel={`Cable from ${gearSpec(a.kind).name} to ${gearSpec(b.kind).name}, ${l.level} level — tap to remove`} /> : null}
            </G>
          );
        })}

        {/* target slots */}
        {(p.targets ?? []).map((s) => {
          if (occupied.has(s)) return null;
          const { x, y } = slotXY(s);
          const def = slotDef(s);
          return (
            <G key={s}>
              <Circle cx={x} cy={y} r={13} fill={colors.amber} opacity={0.08} />
              <Circle cx={x} cy={y} r={13} fill="none" stroke={colors.amber} strokeWidth={1} strokeDasharray="3 3" opacity={0.85} />
              <SvgText x={x} y={y + 22} fontSize={6} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle">{def.label.toUpperCase()}</SvgText>
              <Circle cx={x} cy={y} r={18} fill="transparent" onPress={() => p.onTapSlot?.(s)} accessibilityLabel={`Place at ${def.label}`} />
            </G>
          );
        })}

        {/* every other empty slot: a quiet marker so the plot reads as a plan */}
        {SLOTS.filter((s) => !occupied.has(s.id) && !(p.targets ?? []).includes(s.id)).map((s) => (
          <Circle key={s.id} cx={s.x} cy={s.y} r={2} fill="#2a2e38" />
        ))}

        {/* placed gear */}
        {placed.map((x) => {
          const { x: px, y: py } = slotXY(x.slot);
          const live = !p.liveIds || p.liveIds.has(x.id) || !gearSpec(x.kind).radiates;
          const sel = p.selectedId === x.id;
          return (
            <G key={x.id}>
              <GearInSvg kind={x.kind as GlyphKind} id={`vv-${x.id}`} x={px} y={py} size={sel ? 44 : 38} dim={!live} highlight={sel ? colors.cyanBright : undefined} />
              <Circle cx={px} cy={py} r={22} fill="transparent" onPress={() => p.onTapPlaced?.(x.id)} accessibilityLabel={`${gearSpec(x.kind).name} at ${slotDef(x.slot).label}${sel ? ', selected' : ''}${gearSpec(x.kind).radiates ? (live ? ', live' : ', silent') : ''}`} />
            </G>
          );
        })}

        {p.overlay}
      </Svg>
      {p.badge ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{p.badge}</Text>
        </View>
      ) : null}
      {p.caption ? <Text style={styles.caption}>{p.caption}</Text> : null}
    </View>
  );
}

/** Legend row for cable colours — paired with words, never colour alone. */
export function CableLegend({ levels }: { levels: readonly SignalLevel[] }) {
  const words: Record<SignalLevel, string> = {
    acoustic: 'air',
    mic: 'mic level',
    instrument: 'instrument',
    line: 'line level',
    speaker: 'SPEAKER LEVEL',
    digital: 'network',
    wireless: 'radio',
  };
  return (
    <View style={styles.legend} accessibilityRole="list">
      {levels.map((l) => (
        <View key={l} style={styles.legendItem} accessible accessibilityLabel={`${words[l]} cable`}>
          <View style={[styles.swatch, { backgroundColor: LEVEL_COLOR[l] }]} />
          <Text style={styles.legendText}>{words[l]}</Text>
        </View>
      ))}
    </View>
  );
}

export const CABLE_COLORS = LEVEL_COLOR;

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 6 },
  badge: { position: 'absolute', top: 8, right: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', backgroundColor: 'rgba(12,12,14,.85)', paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 8.5, letterSpacing: 1.2 },
  caption: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 14, height: 4, borderRadius: 2 },
  legendText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.8 },
});
