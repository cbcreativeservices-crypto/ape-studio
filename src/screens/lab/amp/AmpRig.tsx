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
 * The rig is a CONCEPTUAL teaching display and says so on its face.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Polyline, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { animationsAllowed } from '../../../features/settings/a11y';
import { cycleRms } from '../../../features/amp/ampModel';
import { AMP_COLORS } from './kit';

const W = 340;
const PANEL_H = 58;

function tracePoints(data: Float32Array, h: number, yMax = 1.15): string {
  const pts: string[] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W;
    const y = h / 2 - (data[i] / yMax) * (h / 2 - 4);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Contiguous |v| ≥ limit segments, drawn as the warning overlay. */
function clippedSegments(data: Float32Array, limit: number, h: number, yMax = 1.15): string[] {
  const segs: string[] = [];
  let cur: string[] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    if (Math.abs(data[i]) >= limit * 0.999) {
      const x = (i / (n - 1)) * W;
      const y = h / 2 - (data[i] / yMax) * (h / 2 - 4);
      cur.push(`${x.toFixed(1)},${y.toFixed(1)}`);
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

export type AmpRigProps = {
  input?: Float32Array;
  /** Positive/negative device currents (gold solid / purple dashed). */
  devices?: { iPos: Float32Array; iNeg: Float32Array };
  output?: Float32Array;
  /** Output rail level (same units as output); at/above it draws warning red. */
  clipAt?: number;
  /** Extra overlay traces on the OUTPUT panel (carrier, PWM, recovered…). */
  extraOut?: { data: Float32Array; color: string; dash?: string; width?: number; label: string }[];
  /** Extra overlay traces on the INPUT panel. */
  extraIn?: { data: Float32Array; color: string; dash?: string; width?: number; label: string }[];
  /** 0..1 — conceptual supply-energy draw rate. */
  supplyFlow: number;
  /** 0..1 — relative heat (normalized teaching value). */
  heat: number;
  /** % — labeled illustrative; null hides the bar. */
  efficiencyPct?: number | null;
  speaker?: boolean;
  faulted?: boolean;
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
  const playX = motion
    ? phase.interpolate({ inputRange: [0, 1], outputRange: [0, panelW] })
    : new Animated.Value((stepPhase / 8) * panelW);

  const heatColor =
    p.heat < 0.35 ? '#3f6fae' : p.heat < 0.6 ? '#3fae52' : p.heat < 0.8 ? '#e8c341' : '#ff5f4e';

  return (
    <View style={styles.rig}>
      <View onLayout={(e) => setPanelW(e.nativeEvent.layout.width)} style={{ gap: 6 }}>
        {p.input ? (
          <WavePanel title="INPUT (signal)">
            <Polyline points={tracePoints(p.input, PANEL_H)} fill="none" stroke={AMP_COLORS.input} strokeWidth={1.4} />
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
            {p.clipAt != null ? (
              <>
                <Line x1={0} y1={PANEL_H / 2 - (p.clipAt / 1.15) * (PANEL_H / 2 - 4)} x2={W} y2={PANEL_H / 2 - (p.clipAt / 1.15) * (PANEL_H / 2 - 4)} stroke="rgba(255,75,58,0.45)" strokeDasharray="4,4" />
                <Line x1={0} y1={PANEL_H / 2 + (p.clipAt / 1.15) * (PANEL_H / 2 - 4)} x2={W} y2={PANEL_H / 2 + (p.clipAt / 1.15) * (PANEL_H / 2 - 4)} stroke="rgba(255,75,58,0.45)" strokeDasharray="4,4" />
              </>
            ) : null}
            <Polyline points={tracePoints(p.output, PANEL_H)} fill="none" stroke={AMP_COLORS.output} strokeWidth={2} />
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

      {p.extraOut?.length ? (
        <View style={styles.legendRow}>
          {p.extraOut.map((t) => (
            <Text key={t.label} style={[styles.legend, { color: t.color }]}>▬ {t.label}</Text>
          ))}
        </View>
      ) : null}

      {/* status row: supply energy · heat · efficiency · speaker */}
      <View style={styles.statusRow}>
        <View style={styles.statusCell}>
          <Text style={styles.statusLabel}>SUPPLY ENERGY</Text>
          <EnergyFlow flow={p.supplyFlow} motion={motion && running} />
          <Text style={styles.statusSub}>relative draw</Text>
        </View>
        <View style={styles.statusCell}>
          <Text style={styles.statusLabel}>HEAT</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(p.heat * 100)}%`, backgroundColor: heatColor }]} />
          </View>
          <Text style={styles.statusSub}>relative · normalized</Text>
        </View>
        {p.efficiencyPct != null ? (
          <View style={styles.statusCell}>
            <Text style={styles.statusLabel}>EFFICIENCY</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.round(Math.min(100, p.efficiencyPct))}%`, backgroundColor: colors.green }]} />
            </View>
            <Text style={styles.statusSub}>{Math.round(p.efficiencyPct)}% · illustrative</Text>
          </View>
        ) : null}
        {p.speaker ? <SpeakerGlyph level={outLevel} motion={motion && running} /> : null}
      </View>

      {/* transport */}
      <View style={styles.transportRow}>
        {motion ? (
          <>
            <Pressable style={styles.tBtn} onPress={() => setRunning(!running)} accessibilityRole="button" accessibilityLabel={running ? 'Pause animation' : 'Play animation'}>
              <Text style={styles.tBtnText}>{running ? '⏸ PAUSE' : '▶ PLAY'}</Text>
            </Pressable>
            <Pressable style={[styles.tBtn, slow && styles.tBtnOn]} onPress={() => setSlow(!slow)} accessibilityRole="button" accessibilityState={{ selected: slow }} accessibilityLabel="Slow motion">
              <Text style={[styles.tBtnText, slow && { color: colors.green }]}>SLOW</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.tBtn} onPress={() => setStepPhase((s) => (s + 2) % 9)} accessibilityRole="button" accessibilityLabel="Step through the cycle">
            <Text style={styles.tBtnText}>STEP ¼ CYCLE</Text>
          </Pressable>
        )}
        {p.faulted ? <Text style={styles.faultTag}>⚠ FAULT</Text> : null}
      </View>

      <Text style={styles.conceptNote} accessibilityLabel={p.a11ySummary}>
        Conceptual visualization — not a component-level circuit simulation.
      </Text>
      <Text style={styles.srOnly} accessibilityRole="text">{p.a11ySummary}</Text>
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
    <View style={styles.energyTrack} accessibilityLabel={`Supply energy draw ${Math.round(flow * 100)} percent, relative`}>
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
    <View style={styles.statusCell} accessibilityLabel={`Loudspeaker output level ${Math.round(level * 141)} percent of full, relative`}>
      <Text style={styles.statusLabel}>LOAD</Text>
      <Animated.View style={{ transform: [{ scale }], alignSelf: 'center' }}>
        <Svg width={34} height={30} viewBox="0 0 34 30">
          <Path d="M4 11 h8 l9 -8 v24 l-9 -8 h-8 z" fill="#26262b" stroke={colors.textMuted} strokeWidth={1.2} />
          <Path d="M25 9 a9 9 0 0 1 0 12" fill="none" stroke={AMP_COLORS.output} strokeWidth={1.6} opacity={0.3 + level} />
        </Svg>
      </Animated.View>
      <Text style={styles.statusSub}>cone motion · relative</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rig: { gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#0e0e10', padding: 10 },
  panel: { gap: 2 },
  panelTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.2 },
  playhead: { position: 'absolute', top: 14, bottom: 0, left: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.35)' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legend: { fontFamily: fonts.barlowMedium, fontSize: 10.5 },
  statusRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statusCell: { flex: 1, minWidth: 72, gap: 3 },
  statusLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1.2 },
  statusSub: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 9.5 },
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
  conceptNote: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 10 },
  srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
