/**
 * ChainMeter — the gain-structure chain from microphone to loudspeaker as a
 * row of meters, one per stage, the way a systems technician reads it: each
 * meter bounces with programme, a peak indicator holds the top, the stage's
 * clip point is the red line above, the accumulated noise floor is the grey
 * haze rising from below, and the first stage that clips flashes its CLIP
 * indicator. Amplitude is drawn on the app-wide velocity ramp.
 *
 * Two faces of the same drawing (Rack Unit pass, 2026-09-25):
 *   ChainMeterStage — the display alone (equipment, meters, stage labels and
 *                     readouts), sized by the glass; the stage being adjusted
 *                     wears an amber underline. Its controls live in the dock.
 *   ChainMeter      — the document form: the display over tap steppers under
 *                     each adjustable stage (WCAG 2.5.7), sized so one tap
 *                     visibly moves the bar (preamp ±6 dB, everything else ±3).
 */
import { memo } from 'react';
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
const CELL_W = 44;

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

export const SHORT_LABEL: Record<GainStageId, string> = {
  source: 'SOURCE',
  preamp: 'PREAMP',
  fader: 'FADER',
  main: 'MAIN',
  procIn: 'PROC IN',
  procOut: 'PROC OUT',
  amp: 'AMP',
  speaker: 'SPEAKER',
};

export const STEP: Record<GainStageId, number> = { source: 0, preamp: 6, fader: 3, main: 3, procIn: 3, procOut: 3, amp: 3, speaker: 0 };

/* ── the drawing ─────────────────────────────────────────────────────────── */

function MeterSvg({ chain, programme, peak, highlight, w }: { chain: GainNode[]; programme: SharedValue<number>; peak: SharedValue<number>; highlight?: GainStageId | null; w?: number }) {
  const n = chain.length;
  const W = n * CELL_W + 8;
  const firstClip = chain.find((c) => c.clipped && !c.inheritedClip);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Gain chain: ${chain.map((c) => `${c.label} ${Math.round(c.levelDbu)} dBu${c.clipped ? ', clipping' : ''}`).join('; ')}`}>
      <Svg width={w ?? '100%'} viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }}>
        <Defs>
          {/* ONE ramp for every bar, in scale space: red at the top of the dBu
              axis, blue 60 dB below it and beneath — a bar's colour is its
              absolute level, never its own height (loudness colour standard). */}
          <LinearGradient id="cm-ramp" gradientUnits="userSpaceOnUse" x1={0} y1={yOf(MAX_DBU)} x2={0} y2={yOf(MAX_DBU - 60)}>
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
          <StageMeter key={node.id} node={node} i={i} programme={programme} peak={peak} flash={firstClip?.id === node.id} lit={highlight === node.id} />
        ))}
      </Svg>
    </View>
  );
}

function GlyphRow({ chain, size }: { chain: GainNode[]; size: number }) {
  return (
    <View style={styles.row}>
      {chain.map((node) => (
        <View key={node.id} style={styles.cell}>
          <GearGlyph kind={STAGE_GLYPH[node.id]} size={size} />
        </View>
      ))}
    </View>
  );
}

/** The equipment row never changes with the settings — only the stage ids
 *  and the glyph size pick it — so it is skipped on every lane step. Each
 *  glyph is its own <Svg> with seven gradients; re-rendering the eight of
 *  them cost ~150 DOM attribute writes a step (web harness, 2026-09-25). */
const GlyphRowMemo = memo(GlyphRow, (a, b) => a.size === b.size && a.chain.length === b.chain.length && a.chain.every((n, i) => n.id === b.chain[i].id));

/** Stage labels + dBu readouts, optionally with the tap steppers. */
function LabelRow({ chain, settings, onChange, highlight }: { chain: GainNode[]; settings?: GainSettings; onChange?: (id: GainStageId, db: number) => void; highlight?: GainStageId | null }) {
  return (
    <View style={styles.row}>
      {chain.map((node) => {
        const spec = GAIN_STAGES.find((s) => s.id === node.id)!;
        const step = STEP[node.id];
        const v = settings?.[node.id] ?? spec.unity;
        const lit = highlight === node.id;
        return (
          <View key={node.id} style={styles.cell}>
            <Text style={[styles.label, lit && { color: colors.amber }]} numberOfLines={1}>{SHORT_LABEL[node.id]}</Text>
            <Text style={[styles.dbu, { color: node.clipped ? colors.red : levelColorForDb(node.levelDbu, -40, 20) }]}>{Math.round(node.levelDbu)}</Text>
            {onChange && settings ? (
              step > 0 ? (
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
              )
            ) : step > 0 ? (
              <Text style={[styles.val, v !== spec.unity && { color: colors.amber }]} numberOfLines={1}>
                {v > 0 ? '+' : ''}
                {v}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** The legend under the meters — colours and marks paired with words. */
export function ChainMeterKey() {
  return (
    <View style={styles.key} accessibilityRole="list">
      <Text style={[styles.keyItem, { color: colors.red }]}>● CLIP LED · flashes on the first stage that clips (↑ = inherited from upstream)</Text>
      <Text style={styles.keyItem}>⌐ bracket · headroom in dB, the model’s peak to the clip line</Text>
      <Text style={styles.keyItem}>▮ white tick · peak hold on the programme</Text>
      <Text style={styles.keyItem}>- - - dashed line · NOMINAL +4 dBu ≡ −18 dBFS on the console’s meters</Text>
      <Text style={[styles.keyItem, { color: colors.amberLabel }]}>SIMULATED PROGRAMME</Text>
    </View>
  );
}

/** The display alone, sized by the glass: equipment over its meter, the
 *  labels and control values under it, the adjusted stage underlined. */
export function ChainMeterStage({ chain, settings, w, h, running = true, highlight }: { chain: GainNode[]; settings: GainSettings; w: number; h: number; running?: boolean; highlight?: GainStageId | null }) {
  const programme = useProgrammeLevel(running);
  const peak = usePeakHold(programme);
  const n = chain.length;
  const W = n * CELL_W + 8;
  const glyph = Math.round(Math.min(34, Math.max(22, h * 0.15)));
  const labelH = 34;
  const svgH = Math.max(60, h - glyph - labelH - 14);
  const fitW = Math.max(120, Math.min(w - 12, svgH * (W / H)));
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: fitW, gap: 3 }}>
        <GlyphRowMemo chain={chain} size={glyph} />
        <MeterSvg chain={chain} programme={programme} peak={peak} highlight={highlight} />
        <LabelRow chain={chain} settings={settings} highlight={highlight} />
      </View>
    </View>
  );
}

/** The document form: display, tap steppers and the legend. */
export function ChainMeter({ chain, settings, onChange, running = true }: { chain: GainNode[]; settings: GainSettings; onChange: (id: GainStageId, db: number) => void; running?: boolean }) {
  const programme = useProgrammeLevel(running);
  const peak = usePeakHold(programme);
  return (
    <View style={styles.wrap}>
      <GlyphRowMemo chain={chain} size={30} />
      <MeterSvg chain={chain} programme={programme} peak={peak} />
      <LabelRow chain={chain} settings={settings} onChange={onChange} />
      <ChainMeterKey />
    </View>
  );
}

function StageMeter({ node, i, programme, peak, flash, lit }: { node: GainNode; i: number; programme: SharedValue<number>; peak: SharedValue<number>; flash: boolean; lit: boolean }) {
  const spec = GAIN_STAGES[i];
  const cellW = CELL_W;
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
      <Rect x={x} y={TOP} width={w} height={BOTTOM - TOP} rx={3} fill="#050609" stroke={lit ? colors.amber : '#1f2229'} strokeWidth={lit ? 1 : 0.6} />
      {/* accumulated noise: the haze from the floor */}
      <Rect x={x + 1} y={yNoise} width={w - 2} height={Math.max(0, BOTTOM - yNoise)} fill="#5a5f6a" opacity={0.45} />
      {/* the signal, painted by the shared ramp (absolute level → colour) */}
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
      {/* the stage under the learner's thumb */}
      {lit ? <Rect x={x} y={BOTTOM + 3} width={w} height={2.5} rx={1} fill={colors.amber} /> : null}
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
