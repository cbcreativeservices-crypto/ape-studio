/**
 * ChainMeter — the gain-structure chain from microphone to loudspeaker as a
 * row of meters, one per stage, the way a systems technician reads it: each
 * meter bounces with programme, a peak indicator holds the top, the stage's
 * clip point is the red line above, the accumulated noise floor is the grey
 * haze rising from below, and the first stage that clips flashes its CLIP
 * indicator. Amplitude is drawn on the app-wide velocity ramp.
 *
 * Controls are tap steppers under each adjustable stage — the visible
 * non-drag path, WCAG 2.5.7 — sized so one tap visibly moves the bar
 * (preamp ±6 dB, everything else ±3 dB).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { LOUDNESS_STOPS, levelColorForDb } from '../../../../features/tools/levelColor';
import { GAIN_STAGES, type GainNode, type GainSettings, type GainStageId } from '../../../../features/soundsystems/operate';
import { GearGlyph, type GlyphKind } from './gearArt';
import { usePeakHold, useProgrammeLevel } from './motion';

const ARect = Animated.createAnimatedComponent(Rect);
const ACircle = Animated.createAnimatedComponent(Circle);

const MIN_DBU = -70;
const MAX_DBU = 26;
const H = 176;
const TOP = 20;
const BOTTOM = H - 12;
/** How far below the peak the programme dips between hits, dB. */
const SWING_DB = 16;

const yOf = (dbu: number) => BOTTOM - ((Math.max(MIN_DBU, Math.min(MAX_DBU, dbu)) - MIN_DBU) / (MAX_DBU - MIN_DBU)) * (BOTTOM - TOP);

const STAGE_GLYPH: Record<GainStageId, GlyphKind> = {
  source: 'vocalMic',
  preamp: 'stagebox',
  fader: 'console',
  main: 'console',
  procIn: 'processor',
  procOut: 'processor',
  amp: 'amp',
  speaker: 'passiveSpeaker',
};

const SHORT_LABEL: Record<GainStageId, string> = {
  source: 'SOURCE',
  preamp: 'PREAMP',
  fader: 'FADER',
  main: 'MAIN',
  procIn: 'PROC IN',
  procOut: 'PROC OUT',
  amp: 'AMP',
  speaker: 'SPEAKER',
};

const STEP: Record<GainStageId, number> = { source: 0, preamp: 6, fader: 3, main: 3, procIn: 3, procOut: 3, amp: 3, speaker: 0 };

export function ChainMeter({ chain, settings, onChange, running = true }: { chain: GainNode[]; settings: GainSettings; onChange: (id: GainStageId, db: number) => void; running?: boolean }) {
  const n = chain.length;
  const cellW = 44;
  const W = n * cellW + 8;
  const programme = useProgrammeLevel(running);
  const peak = usePeakHold(programme);
  const firstClip = chain.find((c) => c.clipped && !c.inheritedClip);
  return (
    <View style={styles.wrap}>
      {/* the equipment above its meter */}
      <View style={styles.row}>
        {chain.map((node) => (
          <View key={node.id} style={styles.cell}>
            <GearGlyph kind={STAGE_GLYPH[node.id]} size={30} />
          </View>
        ))}
      </View>
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
          {/* nominal +4 dBu across the chain */}
          <Line x1={4} y1={yOf(4)} x2={W - 4} y2={yOf(4)} stroke={colors.textMuted} strokeWidth={0.6} strokeDasharray="2 3" />
          <SvgText x={6} y={H - 3} fontSize={6} fill="#6a6f7a" textAnchor="start" fontFamily={fonts.oswaldMedium} letterSpacing={1}>GREY HAZE = NOISE FLOOR</SvgText>
          {chain.map((node, i) => (
            <StageMeter key={node.id} node={node} i={i} cellW={cellW} programme={programme} peak={peak} flash={firstClip?.id === node.id} />
          ))}
        </Svg>
      </View>
      {/* labels, readouts and the steppers */}
      <View style={styles.row}>
        {chain.map((node) => {
          const spec = GAIN_STAGES.find((s) => s.id === node.id)!;
          const step = STEP[node.id];
          const v = settings[node.id] ?? spec.unity;
          return (
            <View key={node.id} style={styles.cell}>
              <Text style={styles.label} numberOfLines={1}>{SHORT_LABEL[node.id]}</Text>
              <Text style={[styles.dbu, { color: node.clipped ? colors.red : levelColorForDb(node.levelDbu, -40, 20) }]}>{Math.round(node.levelDbu)}</Text>
              {step > 0 ? (
                <>
                  <Pressable style={styles.nudge} onPress={() => onChange(node.id, Math.min(spec.max ?? 0, v + step))} accessibilityRole="button" accessibilityLabel={`${spec.label} up ${step} dB, now ${v} dB`}>
                    <Text style={styles.nudgeGlyph}>▲</Text>
                  </Pressable>
                  <Text style={[styles.val, v !== spec.unity && { color: colors.amber }]} accessible accessibilityRole="adjustable" accessibilityLabel={spec.label} accessibilityValue={{ text: `${v} dB` }} aria-valuenow={v} aria-valuemin={spec.min ?? 0} aria-valuemax={spec.max ?? 0}>
                    {v > 0 ? '+' : ''}
                    {v}
                  </Text>
                  <Pressable style={styles.nudge} onPress={() => onChange(node.id, Math.max(spec.min ?? 0, v - step))} accessibilityRole="button" accessibilityLabel={`${spec.label} down ${step} dB, now ${v} dB`}>
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
      <View style={styles.key} accessibilityRole="list">
        <Text style={[styles.keyItem, { color: colors.red }]}>● CLIP LED · flashes on the first stage that clips (↑ = inherited from upstream)</Text>
        <Text style={styles.keyItem}>⌐ bracket · headroom in dB, the model’s peak to the clip line</Text>
        <Text style={styles.keyItem}>▮ white tick · peak hold on the programme</Text>
        <Text style={styles.keyItem}>- - - dashed line · NOMINAL +4 dBu ≡ −18 dBFS on the console’s meters</Text>
        <Text style={[styles.keyItem, { color: colors.amberLabel }]}>SIMULATED PROGRAMME</Text>
      </View>
    </View>
  );
}

function StageMeter({ node, i, cellW, programme, peak, flash }: { node: GainNode; i: number; cellW: number; programme: SharedValue<number>; peak: SharedValue<number>; flash: boolean }) {
  const spec = GAIN_STAGES[i];
  const x = 4 + i * cellW + 8;
  const w = cellW - 16;
  const yPeakStatic = yOf(node.levelDbu);
  const yNoise = yOf(node.levelDbu - node.snrDb);
  const yClip = yOf(spec.clipDbu);
  const pxPerDb = (BOTTOM - TOP) / (MAX_DBU - MIN_DBU);
  // The bar rides the programme: it reaches the stage's peak on a hit and
  // dips SWING_DB between hits. Clipped stages sit flattened at their rail.
  const bar = useAnimatedProps(() => {
    const dip = (1 - programme.value) * SWING_DB * pxPerDb;
    const y = Math.min(BOTTOM - 1, yPeakStatic + dip);
    return { y, height: Math.max(1, BOTTOM - y) };
  });
  const hold = useDerivedValue(() => {
    const dip = (1 - peak.value) * SWING_DB * pxPerDb;
    return Math.min(BOTTOM - 2, yPeakStatic + dip);
  });
  const holdProps = useAnimatedProps(() => ({ y: hold.value - 1 }));
  const clipProps = useAnimatedProps(() => ({ opacity: flash ? (programme.value > 0.82 ? 1 : 0.25) : node.clipped ? 0.45 : 0 }));
  return (
    <>
      <Rect x={x} y={TOP} width={w} height={BOTTOM - TOP} rx={3} fill="#050609" stroke="#1f2229" strokeWidth={0.6} />
      {/* accumulated noise: the haze from the floor */}
      <Rect x={x + 1} y={yNoise} width={w - 2} height={Math.max(0, BOTTOM - yNoise)} fill="#5a5f6a" opacity={0.45} />
      {/* the signal, painted by the ramp keyed to the whole scale */}
      <ARect x={x + 3} y={yPeakStatic} width={w - 6} height={BOTTOM - yPeakStatic} rx={1.5} fill="url(#cm-ramp)" opacity={node.clipped ? 0.6 : 0.95} animatedProps={bar} />
      {/* peak hold */}
      <ARect x={x + 3} y={yPeakStatic - 1} width={w - 6} height={2} fill="#fff" opacity={0.85} animatedProps={holdProps} />
      {/* clip line, the CLIP LED above the well, the headroom bracket */}
      <Line x1={x} y1={yClip} x2={x + w} y2={yClip} stroke={colors.red} strokeWidth={1.2} />
      <ACircle cx={x + w - 5} cy={TOP - 6} r={2.6} fill={colors.red} stroke="#000" strokeWidth={0.5} opacity={0} animatedProps={clipProps} />
      <Circle cx={x + w - 5} cy={TOP - 6} r={2.6} fill="none" stroke={node.clipped ? colors.red : '#2a2d33'} strokeWidth={0.6} />
      {node.inheritedClip ? <SvgText x={x + w - 12} y={TOP - 3.5} fontSize={6} fill={colors.red} textAnchor="middle" fontFamily={fonts.oswaldSemiBold}>↑</SvgText> : null}
      {!node.clipped && node.headroomDb > 2 ? (
        <>
          <Line x1={x + 1.5} y1={yClip} x2={x + 1.5} y2={yPeakStatic} stroke={colors.textMuted} strokeWidth={0.6} />
          <Line x1={x} y1={yClip} x2={x + 3} y2={yClip} stroke={colors.textMuted} strokeWidth={0.6} />
          <Line x1={x} y1={yPeakStatic} x2={x + 3} y2={yPeakStatic} stroke={colors.textMuted} strokeWidth={0.6} />
          <SvgText x={x + 4} y={(yClip + yPeakStatic) / 2 + 2} fontSize={5.5} fill={colors.textMuted} fontFamily={fonts.mono}>{`${Math.round(node.headroomDb)}`}</SvgText>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 4 },
  row: { flexDirection: 'row', paddingHorizontal: 4 },
  cell: { flex: 1, alignItems: 'center', gap: 1 },
  label: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 0.6 },
  dbu: { fontFamily: fonts.mono, fontSize: 11 },
  nudge: { minHeight: 26, minWidth: 34, alignItems: 'center', justifyContent: 'center' },
  nudgeGlyph: { color: '#8b8b95', fontSize: 10 },
  val: { color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 11 },
  fixed: { color: '#3a3f4a', fontFamily: fonts.mono, fontSize: 11, paddingVertical: 20 },
  key: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 4 },
  keyItem: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.6 },
});
