/**
 * StudioBayView — the 8-pair studio bay overview (§16/§17). A wide faceplate
 * with two rows and eight numbered columns; tapping a column selects that
 * vertical pair (the page renders the standard PatchPairView for it below —
 * one pair at a time, exactly the "master one pair, then zoom out" pedagogy).
 *
 * `showNormals` reveals the invisible internal connections (§17) with the
 * lab's ONE flow grammar — the normals MARCH (they are carrying the studio's
 * live audio; a static dash would mean "idle" three pages of grammar ago) —
 * while the thru processor pairs show a conspicuous ABSENCE (a THRU tag, not
 * a whisper): the two teaching states of the zero-cables page. Patched
 * columns show a gold cord stub at the plugged jack.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import type { StudioPair } from '../engine/scenariosB';
import { FlowPath, PB, useFlowPhase } from './PatchPairView';

const W = 340;
const H = 108;
const ROW_TOP = 38;
const ROW_BOT = 78;
const X0 = 34; // first column center
const STEP = 39; // column spacing

export type BayPlugs = Record<number, { top?: boolean; bottom?: boolean } | undefined>;

export function StudioBayView({
  pairs, selected, onSelect, showNormals, plugs = {}, reduceMotion = false,
}: {
  pairs: StudioPair[];
  selected?: number | null;
  onSelect?: (n: number) => void;
  /** Reveal the internal normals (§17's "show all invisible connections"). */
  showNormals?: boolean;
  /** Per-pair front-jack cords to draw (gold stubs). */
  plugs?: BayPlugs;
  reduceMotion?: boolean;
}) {
  const phase = useFlowPhase(!!showNormals, reduceMotion);
  const a11y =
    `Studio patchbay, eight vertical pairs. ` +
    pairs
      .map((p) => `Pair ${p.n}: ${p.sourceLabel} over ${p.destLabel}, ${p.config === 'thru' ? 'thru' : 'half-normal'}.`)
      .join(' ') +
    (showNormals ? ' Internal normals shown flowing on pairs one to six; the processor pairs are thru — no internal connection.' : '');
  return (
    <View style={styles.wrap}>
      <View style={{ width: '100%' }}>
        <Svg accessible accessibilityRole="image" accessibilityLabel={a11y} width="100%" height={undefined} viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }}>
          <Rect x={0} y={4} width={W} height={H - 8} rx={7} fill={PB.panel} stroke={PB.panelEdge} />
          <Circle cx={12} cy={H / 2} r={2.4} fill="#3a3b41" />
          <Circle cx={W - 12} cy={H / 2} r={2.4} fill="#3a3b41" />
          <SvgText x={16} y={19} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>STUDIO BAY</SvgText>
          {pairs.map((p, i) => {
            const cx = X0 + i * STEP;
            const isSel = selected === p.n;
            const plug = plugs[p.n] ?? {};
            return (
              <G key={p.n}>
                {/* selection outline stops clear of both the jack and the
                    numeral (design pass: it used to strike through "01") */}
                {isSel ? <Rect x={cx - 15} y={22} width={30} height={68} rx={8} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} /> : null}
                {/* the internal zone between the rows */}
                {showNormals ? (
                  p.config === 'thru' ? (
                    <SvgText x={cx} y={(ROW_TOP + ROW_BOT) / 2 + 3} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>THRU</SvgText>
                  ) : (
                    <FlowPath d={`M ${cx} ${ROW_TOP + 8} L ${cx} ${ROW_BOT - 8}`} flowing phase={phase} reduceMotion={reduceMotion} width={2.2} />
                  )
                ) : null}
                {/* jacks */}
                <Circle cx={cx} cy={ROW_TOP} r={7} fill="#0a0a0c" stroke={plug.top ? PB.cord : isSel ? '#6a6b73' : '#3a3b41'} strokeWidth={plug.top ? 2 : 1.3} />
                <Circle cx={cx} cy={ROW_TOP} r={2.6} fill={plug.top ? PB.cord : '#151519'} />
                <Circle cx={cx} cy={ROW_BOT} r={7} fill="#0a0a0c" stroke={plug.bottom ? PB.cord : isSel ? '#6a6b73' : '#3a3b41'} strokeWidth={plug.bottom ? 2 : 1.3} />
                <Circle cx={cx} cy={ROW_BOT} r={2.6} fill={plug.bottom ? PB.cord : '#151519'} />
                {/* cord stubs */}
                {plug.top ? <Line x1={cx + 5} y1={ROW_TOP + 5} x2={cx + 13} y2={ROW_TOP + 14} stroke={PB.cord} strokeWidth={2.2} strokeLinecap="round" /> : null}
                {plug.bottom ? <Line x1={cx + 5} y1={ROW_BOT + 5} x2={cx + 13} y2={ROW_BOT + 14} stroke={PB.cord} strokeWidth={2.2} strokeLinecap="round" /> : null}
                <SvgText x={cx} y={H - 6} fontSize={9} fill={isSel ? colors.cyanBright : colors.textMuted} textAnchor="middle" fontFamily={fonts.mono}>
                  {String(p.n).padStart(2, '0')}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        {/* column tap overlays — siblings of the Svg (SR-reachable). */}
        {onSelect ? (
          <View style={styles.tapRow} pointerEvents="box-none">
            {pairs.map((p, i) => (
              <Pressable
                key={p.n}
                onPress={() => onSelect(p.n)}
                style={[styles.colTap, { left: `${((X0 + i * STEP - STEP / 2) / W) * 100}%`, width: `${(STEP / W) * 100}%` }]}
                accessibilityRole="button"
                accessibilityLabel={`Select pair ${p.n}: ${p.sourceLabel} over ${p.destLabel}`}
                accessibilityState={{ selected: selected === p.n }}
                aria-selected={selected === p.n}
              />
            ))}
          </View>
        ) : null}
      </View>
      {/* Row legend as real text (the SVG header stays short + readable). */}
      <Text style={styles.legend}>TOP ROW = SOURCES · BOTTOM ROW = DESTINATIONS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0d0d10', padding: 8, gap: 5 },
  tapRow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  colTap: { position: 'absolute', top: 0, height: '100%', minHeight: 44 },
  legend: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
});
