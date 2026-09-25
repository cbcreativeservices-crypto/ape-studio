/**
 * SystemDiagram — the signal thread: source → listener as a row of
 * illustrated stations joined by an amber marching line. The lab's other
 * signature (chapter 1's tap-to-inspect flow, the troubleshooting bench's
 * probe rail).
 *
 * Stations lay out in a serpentine (five per row, the second row running
 * back) so nine stations fit a phone width without a horizontal scroll and
 * the thread still reads left-to-right, top-to-bottom, as signal does.
 * Pure react-native-svg; the flow animates with the Cable Install motion kit
 * (reduced motion → a static dashed line, identical end state).
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { APath, useFlow } from '../../cableinstall/motion';
import { GearInSvg, INK, type GlyphKind } from './gearArt';

export type DiagramState = 'ok' | 'none' | 'hot' | 'clip' | 'flag' | 'unknown';

export type DiagramStation = {
  id: string;
  kind: GlyphKind;
  label: string;
  /** Reading colour; 'unknown' = not yet probed (troubleshoot bench). */
  state?: DiagramState;
  /** A short value under the label (a meter reading, a level). */
  value?: string;
};

const STATE_COLOR: Record<DiagramState, string> = {
  ok: colors.greenBright,
  none: '#5a5f6a',
  hot: colors.amber,
  clip: colors.red,
  flag: colors.orange,
  unknown: '#3a3f4a',
};

const COLS = 5;
const CELL_W = 68;
const ROW_H = 92;
const GLYPH = 40;

function positionOf(i: number): { x: number; y: number } {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  const c = row % 2 === 0 ? col : COLS - 1 - col;
  return { x: 14 + c * CELL_W + CELL_W / 2, y: 30 + row * ROW_H };
}

export function SystemDiagram({
  stations,
  selectedId,
  onTap,
  flowing = true,
  /** Signal stops AFTER this index (fault bench): later links go dark. */
  breakAfter,
  a11y,
}: {
  stations: readonly DiagramStation[];
  selectedId?: string | null;
  onTap?: (id: string) => void;
  flowing?: boolean;
  breakAfter?: number | null;
  a11y: string;
}) {
  const rows = Math.ceil(stations.length / COLS);
  const W = 14 * 2 + CELL_W * Math.min(COLS, stations.length);
  const H = 30 + (rows - 1) * ROW_H + 62;
  const flow = useFlow({ run: flowing, speed: 900, dash: 5, gap: 7 });

  // One continuous thread through every station, in order.
  const thread = stations.map((_, i) => positionOf(i));
  const segs = thread.slice(1).map((b, i) => {
    const a = thread[i];
    // serpentine turn: curve down to the next row
    if (Math.abs(b.y - a.y) > 1) {
      const dir = b.x > a.x ? 1 : -1;
      return { d: `M ${a.x} ${a.y} C ${a.x + 34 * -dir * -1} ${a.y} ${b.x} ${a.y + 12} ${b.x} ${b.y}`, i };
    }
    return { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, i };
  });

  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }}>
        <Rect x={0} y={0} width={W} height={H} rx={12} fill="#0e1015" stroke={colors.hairline} strokeWidth={0.8} />
        {/* the thread: a dark bed, then the live amber march */}
        {segs.map((s) => {
          const dead = breakAfter != null && s.i >= breakAfter;
          return (
            <G key={s.i}>
              <Path d={s.d} stroke="#05060a" strokeWidth={5} fill="none" strokeLinecap="round" />
              {dead ? (
                <Path d={s.d} stroke="#3a3f4a" strokeWidth={1.6} fill="none" strokeDasharray="2 5" strokeLinecap="round" />
              ) : (
                <>
                  <Path d={s.d} stroke={colors.amber} strokeWidth={1.4} fill="none" opacity={0.35} strokeLinecap="round" />
                  <APath d={s.d} stroke={colors.amber} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeDasharray={flow.dashArray} animatedProps={flow.animatedProps} />
                </>
              )}
            </G>
          );
        })}
        {stations.map((st, i) => {
          const { x, y } = positionOf(i);
          const sel = selectedId === st.id;
          const state = st.state ?? 'ok';
          const ring = STATE_COLOR[state];
          return (
            <G key={st.id}>
              <Circle cx={x} cy={y} r={27} fill="#12151c" stroke={sel ? colors.cyanBright : ring} strokeWidth={sel ? 2 : 1.2} opacity={state === 'unknown' ? 0.7 : 1} />
              {state !== 'unknown' && state !== 'ok' ? <Circle cx={x} cy={y} r={27} fill={ring} opacity={0.1} /> : null}
              <GearInSvg kind={st.kind} id={`sd-${st.id}`} x={x} y={y} size={GLYPH} dim={state === 'none'} />
              {/* reading dot */}
              <Circle cx={x + 20} cy={y - 20} r={4.5} fill={state === 'unknown' ? '#1a1d24' : ring} stroke="#000" strokeWidth={0.6} />
              {state === 'unknown' ? <SvgText x={x + 20} y={y - 17.6} fontSize={6.5} fill={INK.metalHi} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">?</SvgText> : null}
              <SvgText x={x} y={y + 38} fontSize={7.5} fill={sel ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>
                {st.label.toUpperCase()}
              </SvgText>
              {st.value ? (
                <SvgText x={x} y={y + 48} fontSize={7} fill={ring} fontFamily={fonts.mono} textAnchor="middle">
                  {st.value}
                </SvgText>
              ) : null}
              {onTap ? (
                <Circle
                  cx={x}
                  cy={y + 8}
                  r={32}
                  fill="transparent"
                  onPress={() => onTap(st.id)}
                  accessibilityLabel={`${st.label}${state === 'unknown' ? ', not probed — tap to probe' : `, reads ${state === 'ok' ? 'healthy' : state === 'none' ? 'no signal' : state}`}${st.value ? `, ${st.value}` : ''}`}
                />
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/** The reading key under a bench — colours paired with words. */
export function ReadingKey() {
  const rows: { s: DiagramState; w: string }[] = [
    { s: 'ok', w: 'healthy' },
    { s: 'none', w: 'no signal' },
    { s: 'hot', w: 'hot' },
    { s: 'clip', w: 'clipping' },
    { s: 'flag', w: 'wrong / flagged' },
    { s: 'unknown', w: 'not probed' },
  ];
  return (
    <View style={styles.key} accessibilityRole="list">
      {rows.map((r) => (
        <View key={r.s} style={styles.keyItem} accessible accessibilityLabel={`${r.w} reading`}>
          <View style={[styles.dot, { backgroundColor: STATE_COLOR[r.s] }]} />
          <Text style={styles.keyText}>{r.w}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  key: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 0.5, borderColor: '#000' },
  keyText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.8 },
});
