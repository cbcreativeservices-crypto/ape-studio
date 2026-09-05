/**
 * AmpRig — the lab's central synchronized visualization (build spec Part 2 §1):
 * input waveform · device currents · output waveform · supply energy flow ·
 * load/speaker · relative heat · illustrative efficiency · fault state.
 *
 * One playhead sweeps all waveform panels together, so cause and effect stay
 * visibly synchronized. Everything animated is driven by ONE Animated loop
 * (native driver, transforms only) — waveform paths are computed once per
 * parameter change, never per frame.
 *
 * Reduced motion (settings toggle OR OS): the loop is replaced by a STEP
 * control that moves the playhead a quarter cycle at a time.
 *
 * The rig is a CONCEPTUAL teaching display and says so on its face. The input
 * and output traces carry the app-wide AMPLITUDE COLOUR STANDARD (owner
 * 2026-09-05, `features/tools/levelColor`): MIDI-0 blue at the mid line,
 * climbing green → yellow → orange → red at ±full scale — and full scale on the
 * output panel IS the rail, so a clipped peak is red because it is at the
 * rail, with the heavier fault overlay on top. Cyan/green stay the lab's
 * LABEL colours for "input"/"output" (legends, diagram arrows), not trace paint.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Polyline, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { WAVE_LEVEL_STOPS, levelColor } from '../../../features/tools/levelColor';
import { animationsAllowed } from '../../../features/settings/a11y';
import { cycleRms } from '../../../features/amp/ampModel';
import { AMP_COLORS } from './kit';

const W = 340;
const PANEL_H = 58;
const Y_MAX = 1.15;

/** y for a signal value on a panel of height h (same mapping everywhere). */
const yFor = (v: number, h: number, yMax = Y_MAX) => h / 2 - (v / yMax) * (h / 2 - 4);

function tracePoints(data: Float32Array, h: number, yMax = Y_MAX): string {
  const pts: string[] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W;
    pts.push(`${x.toFixed(1)},${yFor(data[i], h, yMax).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Contiguous |v| ≥ limit segments, drawn as the warning overlay. */
function clippedSegments(data: Float32Array, limit: number, h: number, yMax = Y_MAX): string[] {
  const segs: string[] = [];
  let cur: string[] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    if (Math.abs(data[i]) >= limit * 0.999) {
      const x = (i / (n - 1)) * W;
      cur.push(`${x.toFixed(1)},${yFor(data[i], h, yMax).toFixed(1)}`);
    } else if (cur.length) {
      segs.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length > 1) segs.push(cur.join(' '));
  return segs.filter((s) => s.includes(' '));
}

function WavePanel({
  title, children, h = PANEL_H,
}: { title: string; children: React.ReactNode; h?: number }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <Svg width="100%" height={h} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={h} fill="#0a0a0c" />
        <Line x1={0} y1={h / 2} x2={W} y2={h / 2} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
        {children}
      </Svg>
    </View>
  );
}

/**
 * Amplitude-ramp gradient for a zero-centred trace, mapped to ±`fullScale` in
 * PANEL pixels (userSpaceOnUse) so the colour reads TRUE level: MIDI-0 blue at
 * the mid line, red exactly at ±full scale — the rail, on the output panel.
 */
function WaveGradient({ id, fullScale, h = PANEL_H }: { id: string; fullScale: number; h?: number }) {
  return (
    <Defs>
      <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={yFor(fullScale, h)} x2={0} y2={yFor(-fullScale, h)}>
        {WAVE_LEVEL_STOPS.map((s) => (
          <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </LinearGradient>
    </Defs>
  );
}

/** A ± pair of horizontal reference lines (rails). */
function RailPair({ at, stroke, dash, width = 1 }: { at: number; stroke: string; dash?: string; width?: number }) {
  return (
    <>
      <Line x1={0} y1={yFor(at, PANEL_H)} x2={W} y2={yFor(at, PANEL_H)} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
      <Line x1={0} y1={yFor(-at, PANEL_H)} x2={W} y2={yFor(-at, PANEL_H)} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
    </>
  );
}

export type RigTrace = { data: Float32Array; color: string; dash?: string; width?: number; label: string };

export type AmpRigProps = {
  input?: Float32Array;
  /** Positive/negative device currents (gold solid / purple dashed). */
  devices?: { iPos: Float32Array; iNeg: Float32Array };
  output?: Float32Array;
  /** Output rail level (same units as output); at/above it draws warning red. */
  clipAt?: number;
  /** Nominal (idle) rail level, drawn as a faint reference OUTSIDE `clipAt`
   *  when the working rails have sagged below it — so "the rail lines moved
   *  inward" is something the learner can actually see. */
  nominalRailAt?: number;
  /** Extra overlay traces on the OUTPUT panel (carrier, PWM, recovered…). */
  extraOut?: RigTrace[];
  /** Extra overlay traces on the INPUT panel. */
  extraIn?: RigTrace[];
  /** 0..1 — conceptual supply-energy draw rate. */
  supplyFlow: number;
  /** 0..1 — relative heat (normalized teaching value). */
  heat: number;
  /** % — labeled illustrative; null hides the bar. */
  efficiencyPct?: number | null;
  speaker?: boolean;
  faulted?: boolean;
  /** Hide the supply / heat / efficiency / load row — for diagnosis pictures
   *  where those meters would be decoys, not information. */
  hideStatus?: boolean;
  /** One-sentence accessible summary of the current state. */
  a11ySummary: string;
  deviceTitle?: string;
  outputTitle?: string;
};

export function AmpRig(p: AmpRigProps) {
  const motion = animationsAllowed();
  const [running, setRunning] = useState(true);
  const [slow, setSlow] = useState(false);
  const [stepPhase, setStepPhase] = useState(0); // reduced-motion playhead ⅛s
  const phase = useRef(new Animated.Value(0)).current;
  const [panelW, setPanelW] = useState(W);

  useEffect(() => {
    if (!motion || !running) return;
    phase.setValue(0);
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: slow ? 6000 : 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, running, slow, phase]);

  const outLevel = p.output ? cycleRms(p.output) : 0;
  // Gradient ids must be unique per rig — several rigs can share one screen
  // (and on web every SVG shares one document), and their rails can differ.
  const gid = useRef(`amprig${Math.floor(Math.random() * 1e9).toString(36)}`).current;
  const playX = useMemo(
    () => (motion ? phase.interpolate({ inputRange: [0, 1], outputRange: [0, panelW] }) : new Animated.Value((stepPhase / 8) * panelW)),
    [motion, phase, panelW, stepPhase],
  );

  // Heat is NOT amplitude: blue (cool) → green → yellow → red (dangerously
  // hot) is the kit's fault language, and the word beside it says the same.
  const heatWord = p.heat < 0.35 ? 'cool' : p.heat < 0.6 ? 'warm' : p.heat < 0.8 ? 'hot' : 'DANGER';
  const heatColor =
    p.heat < 0.35 ? '#3f6fae' : p.heat < 0.6 ? '#3fae52' : p.heat < 0.8 ? '#e8c341' : '#ff5f4e';

  const showNominal = p.clipAt != null && p.nominalRailAt != null && p.nominalRailAt > p.clipAt + 0.01;
  const legendTraces = [...(p.extraIn ?? []), ...(p.extraOut ?? [])];

  return (
    <View style={styles.rig}>
      {/* The waveform stack is ONE accessible graphic with the summary as its
          label — a screen reader hears the state once, not three panels of
          silent SVG plus a duplicate note. */}
      <View
        onLayout={(e) => setPanelW(e.nativeEvent.layout.width)}
        style={{ gap: 6 }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={p.a11ySummary}
      >
        {p.input ? (
          <WavePanel title="INPUT (signal)">
            <WaveGradient id={`${gid}in`} fullScale={1} />
            <Polyline points={tracePoints(p.input, PANEL_H)} fill="none" stroke={`url(#${gid}in)`} strokeWidth={1.6} />
            {p.extraIn?.map((t) => (
              <Polyline key={t.label} points={tracePoints(t.data, PANEL_H)} fill="none" stroke={t.color} strokeWidth={t.width ?? 1.2} strokeDasharray={t.dash} />
            ))}
          </WavePanel>
        ) : null}
        {p.devices ? (
          <WavePanel title={p.deviceTitle ?? 'DEVICE CURRENTS (+ gold solid · − purple dashed)'}>
            <Polyline points={tracePoints(p.devices.iPos, PANEL_H, 1.6)} fill="none" stroke={AMP_COLORS.pos} strokeWidth={1.6} />
            <Polyline points={tracePoints(p.devices.iNeg, PANEL_H, 1.6)} fill="none" stroke={AMP_COLORS.neg} strokeWidth={1.6} strokeDasharray="5,3" />
          </WavePanel>
        ) : null}
        {p.output ? (
          <WavePanel title={p.outputTitle ?? 'OUTPUT (to load)'}>
            {showNominal ? <RailPair at={p.nominalRailAt!} stroke="rgba(255,255,255,0.18)" dash="2,5" /> : null}
            {p.clipAt != null ? <RailPair at={p.clipAt} stroke="rgba(255,75,58,0.45)" dash="4,4" /> : null}
            <WaveGradient id={`${gid}out`} fullScale={p.clipAt ?? 1} />
            <Polyline points={tracePoints(p.output, PANEL_H)} fill="none" stroke={`url(#${gid}out)`} strokeWidth={2} />
            {p.clipAt != null
              ? clippedSegments(p.output, p.clipAt, PANEL_H).map((s, i) => (
                  <Polyline key={i} points={s} fill="none" stroke={AMP_COLORS.fault} strokeWidth={2.6} />
                ))
              : null}
            {p.extraOut?.map((t) => (
              <Polyline key={t.label} points={tracePoints(t.data, PANEL_H)} fill="none" stroke={t.color} strokeWidth={t.width ?? 1.2} strokeDasharray={t.dash} />
            ))}
          </WavePanel>
        ) : null}
        {/* the shared playhead */}
        <Animated.View
          pointerEvents="none"
          style={[styles.playhead, { transform: [{ translateX: playX }] }]}
        />
      </View>

      {legendTraces.length || showNominal || (p.clipAt != null && p.output) ? (
        <View style={styles.legendRow}>
          {p.clipAt != null && p.output ? <Text style={[styles.legend, { color: colors.red }]}>┄ rail limit</Text> : null}
          {showNominal ? <Text style={[styles.legend, { color: colors.textSub }]}>┄ nominal rail (idle)</Text> : null}
          {legendTraces.map((t) => (
            <Text key={t.label} style={[styles.legend, { color: t.color }]}>{t.dash ? '┄' : '▬'} {t.label}</Text>
          ))}
        </View>
      ) : null}

      {/* status row: supply energy · heat · efficiency · speaker */}
      {!p.hideStatus ? (
        <View style={styles.statusRow}>
          <View style={styles.statusCell}>
            <Text style={styles.statusLabel}>SUPPLY ENERGY</Text>
            <EnergyFlow flow={p.supplyFlow} motion={motion && running} />
            <Text style={styles.statusSub}>relative draw</Text>
          </View>
          <View style={styles.statusCell} accessible accessibilityLabel={`Relative heat ${Math.round(p.heat * 100)} percent, ${heatWord}. Normalized teaching value, not a temperature.`}>
            <Text style={styles.statusLabel}>HEAT</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(p.heat * 100)}%`, backgroundColor: heatColor }]} />
            </View>
            <Text style={styles.statusSub}>{heatWord} · relative</Text>
          </View>
          {p.efficiencyPct != null ? (
            <View style={styles.statusCell} accessible accessibilityLabel={`Illustrative efficiency ${Math.round(p.efficiencyPct)} percent at this level.`}>
              <Text style={styles.statusLabel}>EFFICIENCY</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round(Math.min(100, Math.max(0, p.efficiencyPct)))}%`, backgroundColor: colors.green }]} />
              </View>
              <Text style={styles.statusSub}>{Math.round(p.efficiencyPct)}% · illustrative</Text>
            </View>
          ) : null}
          {p.speaker ? <SpeakerGlyph level={outLevel} motion={motion && running} /> : null}
        </View>
      ) : null}

      {/* transport */}
      <View style={styles.transportRow}>
        {motion ? (
          <>
            <Pressable style={styles.tBtn} hitSlop={{ top: 6, bottom: 6 }} onPress={() => setRunning(!running)} accessibilityRole="button" accessibilityLabel={running ? 'Pause animation' : 'Play animation'}>
              <Text style={styles.tBtnText}>{running ? '⏸ PAUSE' : '▶ PLAY'}</Text>
            </Pressable>
            <Pressable style={[styles.tBtn, slow && styles.tBtnOn]} hitSlop={{ top: 6, bottom: 6 }} onPress={() => setSlow(!slow)} accessibilityRole="button" accessibilityState={{ selected: slow }} accessibilityLabel="Slow motion">
              <Text style={[styles.tBtnText, slow && { color: colors.green }]}>SLOW</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.tBtn} hitSlop={{ top: 6, bottom: 6 }} onPress={() => setStepPhase((s) => (s + 2) % 9)} accessibilityRole="button" accessibilityLabel="Step through the cycle">
            <Text style={styles.tBtnText}>STEP ¼ CYCLE</Text>
          </Pressable>
        )}
        {p.faulted ? <Text style={styles.faultTag} accessibilityRole="text">⚠ FAULT</Text> : null}
      </View>

      <Text style={styles.conceptNote}>
        Conceptual visualization — not a component-level circuit simulation.
      </Text>
    </View>
  );
}

function EnergyFlow({ flow, motion }: { flow: number; motion: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion || flow <= 0.02) return;
    t.setValue(0);
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: Math.max(350, 2000 - flow * 1600),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, flow, t]);
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  return (
    <View style={styles.energyTrack} accessible accessibilityLabel={`Supply energy draw ${Math.round(flow * 100)} percent, relative`}>
      <Animated.Text
        style={[styles.energyArrows, { opacity: 0.25 + flow * 0.75, transform: [{ translateX: motion && flow > 0.02 ? tx : 0 }] }]}
        numberOfLines={1}
      >
        {'▸ ▸ ▸ ▸ ▸ ▸ ▸ ▸ ▸ ▸'}
      </Animated.Text>
    </View>
  );
}

function SpeakerGlyph({ level, motion }: { level: number; motion: boolean }) {
  const s = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion || level < 0.02) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(s, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(s, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, level, s]);
  const scale = s.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + Math.min(0.2, level * 0.35)] });
  return (
    <View style={styles.statusCell} accessible accessibilityLabel={`Loudspeaker output level ${Math.round(Math.min(1, level * Math.SQRT2) * 100)} percent of full, relative`}>
      <Text style={styles.statusLabel}>LOAD</Text>
      <Animated.View style={{ transform: [{ scale }], alignSelf: 'center' }}>
        <Svg width={34} height={30} viewBox="0 0 34 30">
          <Path d="M4 11 h8 l9 -8 v24 l-9 -8 h-8 z" fill="#26262b" stroke={colors.textMuted} strokeWidth={1.2} />
          {/* cone-motion arc takes the LEVEL's colour (amplitude standard) */}
          <Path d="M25 9 a9 9 0 0 1 0 12" fill="none" stroke={levelColor(Math.min(1, level * Math.SQRT2))} strokeWidth={1.8} opacity={0.35 + Math.min(0.65, level)} />
        </Svg>
      </Animated.View>
      <Text style={styles.statusSub}>cone motion · relative</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rig: { gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#0e0e10', padding: 10 },
  panel: { gap: 2 },
  panelTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.2 },
  playhead: { position: 'absolute', top: 14, bottom: 0, left: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.35)' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legend: { fontFamily: fonts.barlowMedium, fontSize: 11 },
  statusRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statusCell: { flex: 1, minWidth: 72, gap: 3 },
  statusLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.2 },
  statusSub: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 10.5 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  barFill: { height: '100%' },
  energyTrack: { height: 16, overflow: 'hidden', borderRadius: 4 },
  energyArrows: { color: AMP_COLORS.supply, fontSize: 11, letterSpacing: 1 },
  transportRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tBtn: {
    minHeight: 34, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315',
  },
  tBtnOn: { borderColor: colors.green },
  tBtnText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  faultTag: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, marginLeft: 'auto' },
  conceptNote: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 11 },
});
