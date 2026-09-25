/**
 * ChainMeter — the gain-structure chain from microphone to loudspeaker as a
 * row of vertical meters, one per stage, each with its own clip line and the
 * accumulated noise floor rising underneath. Amplitude is drawn on the
 * app-wide velocity ramp (blue quiet → red loud); the clip line is the only
 * red that is not a level.
 *
 * Controls are tap steppers (±2 dB) under each adjustable stage — the
 * visible non-drag path — with the value announced for assistive tech.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { LOUDNESS_STOPS, levelColorForDb } from '../../../../features/tools/levelColor';
import { GAIN_STAGES, type GainNode, type GainSettings, type GainStageId } from '../../../../features/soundsystems/operate';

const MIN_DBU = -70;
const MAX_DBU = 26;
const H = 150;
const TOP = 10;
const BOTTOM = H - 22;

const yOf = (dbu: number) => BOTTOM - ((Math.max(MIN_DBU, Math.min(MAX_DBU, dbu)) - MIN_DBU) / (MAX_DBU - MIN_DBU)) * (BOTTOM - TOP);

export function ChainMeter({ chain, settings, onChange }: { chain: GainNode[]; settings: GainSettings; onChange: (id: GainStageId, db: number) => void }) {
  const n = chain.length;
  const cellW = 44;
  const W = n * cellW + 8;
  return (
    <View style={styles.wrap}>
      <View accessible accessibilityRole="image" accessibilityLabel={`Gain chain: ${chain.map((c) => `${c.label} ${Math.round(c.levelDbu)} dBu${c.clipped ? ', clipping' : ''}`).join('; ')}`}>
        <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }}>
          <Defs>
            <LinearGradient id="cm-ramp" x1="0" y1="0" x2="0" y2="1">
              {LOUDNESS_STOPS.map((s) => (
                <Stop key={s.pos} offset={s.pos} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} rx={10} fill="#0b0c10" stroke={colors.hairline} strokeWidth={0.8} />
          {/* nominal +4 dBu reference across the chain */}
          <Line x1={4} y1={yOf(4)} x2={W - 4} y2={yOf(4)} stroke={colors.textMuted} strokeWidth={0.6} strokeDasharray="2 3" />
          <SvgText x={W - 6} y={yOf(4) - 2} fontSize={6} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.mono}>+4 dBu</SvgText>
          {chain.map((node, i) => {
            const spec = GAIN_STAGES[i];
            const x = 4 + i * cellW + 8;
            const w = cellW - 16;
            const yLevel = yOf(node.levelDbu);
            const yNoise = yOf(node.levelDbu - node.snrDb);
            const yClip = yOf(spec.clipDbu);
            return (
              <Svg key={node.id}>
                {/* well */}
                <Rect x={x} y={TOP} width={w} height={BOTTOM - TOP} rx={3} fill="#050609" stroke="#1f2229" strokeWidth={0.6} />
                {/* accumulated noise, a grey haze from the bottom */}
                <Rect x={x + 1} y={yNoise} width={w - 2} height={BOTTOM - yNoise} fill="#5a5f6a" opacity={0.35} />
                {/* signal, painted by the ramp keyed to the whole scale so colour tracks true level */}
                <Rect x={x + 3} y={yLevel} width={w - 6} height={BOTTOM - yLevel} rx={1.5} fill="url(#cm-ramp)" opacity={node.clipped ? 0.55 : 0.95} />
                {/* clip line */}
                <Line x1={x} y1={yClip} x2={x + w} y2={yClip} stroke={colors.red} strokeWidth={1.2} />
                {node.clipped ? <Rect x={x + 1} y={TOP + 1} width={w - 2} height={6} fill={colors.red} opacity={node.inheritedClip ? 0.5 : 1} /> : null}
                <SvgText x={x + w / 2} y={H - 12} fontSize={5.6} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>
                  {spec.label.toUpperCase().replace(' (VOCAL MIC)', '')}
                </SvgText>
                <SvgText x={x + w / 2} y={H - 4} fontSize={6.2} fill={node.clipped ? colors.red : levelColorForDb(node.levelDbu, -40, 20)} textAnchor="middle" fontFamily={fonts.mono}>
                  {Math.round(node.levelDbu)}
                </SvgText>
              </Svg>
            );
          })}
        </Svg>
      </View>
      <View style={styles.controls}>
        {chain.map((node, i) => {
          const spec = GAIN_STAGES[i];
          const adjustable = spec.min != null;
          const v = settings[node.id] ?? spec.unity;
          return (
            <View key={node.id} style={styles.ctl}>
              {adjustable ? (
                <>
                  <Pressable style={styles.nudge} onPress={() => onChange(node.id, Math.min(spec.max ?? 0, v + 2))} accessibilityRole="button" accessibilityLabel={`${spec.label} up 2 dB, now ${v} dB`}>
                    <Text style={styles.nudgeGlyph}>▲</Text>
                  </Pressable>
                  <Text style={[styles.val, v !== spec.unity && { color: colors.amber }]} accessible accessibilityRole="adjustable" accessibilityLabel={spec.label} accessibilityValue={{ text: `${v} dB` }} aria-valuenow={v} aria-valuemin={spec.min ?? 0} aria-valuemax={spec.max ?? 0}>
                    {v > 0 ? '+' : ''}
                    {v}
                  </Text>
                  <Pressable style={styles.nudge} onPress={() => onChange(node.id, Math.max(spec.min ?? 0, v - 2))} accessibilityRole="button" accessibilityLabel={`${spec.label} down 2 dB, now ${v} dB`}>
                    <Text style={styles.nudgeGlyph}>▼</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.fixed}>—</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 4 },
  controls: { flexDirection: 'row', paddingHorizontal: 4 },
  ctl: { flex: 1, alignItems: 'center', gap: 1 },
  nudge: { minHeight: 26, minWidth: 34, alignItems: 'center', justifyContent: 'center' },
  nudgeGlyph: { color: '#8b8b95', fontSize: 10 },
  val: { color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 11 },
  fixed: { color: '#3a3f4a', fontFamily: fonts.mono, fontSize: 11, paddingVertical: 20 },
});
