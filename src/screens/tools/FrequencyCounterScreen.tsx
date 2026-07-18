/**
 * FrequencyCounterScreen — the Hz / Frequency Counter tool (user request
 * 2026-07-18). Three modes:
 *   Sound       — mic estimate of a steady tone's frequency (needs the engine)
 *   Light Pulse — camera estimate of a flicker rate (needs the engine + more
 *                 device testing; shipped later per the recommendation)
 *   Tap         — tap along with a repeating event; frequency/tempo computed
 *                 purely from tap TIMING, so it needs no mic/camera/DSP and is
 *                 LIVE now (built first, as recommended).
 *
 * Integrity: Sound and Light show an honest "measurement engine in development"
 * state — no simulated meters (tools spec §1.7). Tap shows REAL values derived
 * from the user's own taps, so it is not a fake meter.
 *
 * Results (Tap): frequency (Hz), events/sec, period (ms), BPM, stability, and
 * the min/max readings, with Reset + Hold controls.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { ENGINE_NOTE } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FrequencyCounter'>;

type Mode = 'sound' | 'light' | 'tap';

/** Required disclaimer, shown on the tool (user-provided 2026-07-18). */
const DISCLAIMER =
  'Measurements are estimates based on your device’s microphone, camera, sensors, and processing ' +
  'capabilities. This tool is intended for education and general troubleshooting, not calibrated ' +
  'laboratory measurement.';

const MODES: { key: Mode; name: string; blurb: string }[] = [
  { key: 'sound', name: 'Sound', blurb: 'Use the microphone to estimate the frequency of a steady sound.' },
  { key: 'light', name: 'Light Pulse', blurb: 'Use the camera to estimate the repetition rate of a flashing or flickering light.' },
  { key: 'tap', name: 'Tap', blurb: 'Tap along with a repeating sound, light, or event to calculate its frequency and tempo.' },
];

// A long pause starts a fresh measurement; only the most recent taps average in.
const TAP_RESET_GAP_MS = 2500;
const MAX_TAPS = 16;

type TapStats = {
  freq: number; // Hz
  periodMs: number;
  bpm: number;
  eventsPerSec: number;
  intervals: number;
  stabilityPct: number | null;
  stabilityLabel: string | null;
  minFreq: number | null;
  maxFreq: number | null;
};

function computeTapStats(taps: number[]): TapStats | null {
  if (taps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean <= 0) return null;
  const freq = 1000 / mean;

  // Stability + min/max need at least two intervals to be meaningful.
  let stabilityPct: number | null = null;
  let stabilityLabel: string | null = null;
  let minFreq: number | null = null;
  let maxFreq: number | null = null;
  if (intervals.length >= 2) {
    const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    stabilityPct = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
    stabilityLabel = cv < 0.03 ? 'Very stable' : cv < 0.08 ? 'Stable' : cv < 0.15 ? 'Fair' : 'Unstable';
    // Longest interval → lowest freq; shortest → highest.
    minFreq = 1000 / Math.max(...intervals);
    maxFreq = 1000 / Math.min(...intervals);
  }

  return {
    freq,
    periodMs: mean,
    bpm: 60000 / mean,
    eventsPerSec: freq,
    intervals: intervals.length,
    stabilityPct,
    stabilityLabel,
    minFreq,
    maxFreq,
  };
}

const fmtHz = (hz: number) => (hz < 10 ? hz.toFixed(2) : hz.toFixed(1));

function StatCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function EngineInDev({ extra }: { extra?: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>MEASUREMENT ENGINE — IN DEVELOPMENT</Text>
      <Text style={styles.statusBody}>{ENGINE_NOTE}</Text>
      {extra ? <Text style={styles.statusBody}>{extra}</Text> : null}
    </View>
  );
}

function ModeSelect({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <>
      <Text style={styles.intro}>
        Count how often something repeats — as frequency, period, and tempo. Choose a mode:
      </Text>
      {MODES.map((m) => (
        <Pressable
          key={m.key}
          style={styles.modeBtn}
          onPress={() => onPick(m.key)}
          accessibilityRole="button"
          accessibilityLabel={m.name}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.modeName}>{m.name}</Text>
            <Text style={styles.modeBlurb}>{m.blurb}</Text>
          </View>
          <Text style={styles.modeChevron}>›</Text>
        </Pressable>
      ))}
      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </>
  );
}

function TapMode() {
  const [taps, setTaps] = useState<number[]>([]);
  const [held, setHeld] = useState(false);

  const onTap = useCallback(() => {
    if (held) return;
    const now = Date.now();
    setTaps((prev) => {
      if (prev.length && now - prev[prev.length - 1] > TAP_RESET_GAP_MS) return [now];
      const next = [...prev, now];
      return next.length > MAX_TAPS ? next.slice(next.length - MAX_TAPS) : next;
    });
  }, [held]);

  const stats = useMemo(() => computeTapStats(taps), [taps]);
  const reset = useCallback(() => {
    setTaps([]);
    setHeld(false);
  }, []);

  return (
    <>
      {/* Big frequency readout. */}
      <View style={styles.readout}>
        <Text style={styles.readoutValue}>{stats ? fmtHz(stats.freq) : '—'}</Text>
        <Text style={styles.readoutUnit}>Hz</Text>
      </View>

      {/* Tap target. */}
      <Pressable
        style={[styles.tapPad, held && styles.tapPadHeld]}
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel="Tap"
      >
        <Text style={styles.tapPadText}>{held ? 'HELD' : taps.length < 2 ? 'TAP IN TIME' : 'TAP'}</Text>
        <Text style={styles.tapPadHint}>
          {held ? 'Release Hold to resume' : 'Keep a steady beat — pausing starts over'}
        </Text>
      </Pressable>

      {/* Results grid. */}
      <View style={styles.statGrid}>
        <StatCell label="EVENTS / SEC" value={stats ? fmtHz(stats.eventsPerSec) : '—'} />
        <StatCell label="PERIOD" value={stats ? Math.round(stats.periodMs).toString() : '—'} unit="ms" />
        <StatCell label="BPM" value={stats ? Math.round(stats.bpm).toString() : '—'} />
        <StatCell
          label="STABILITY"
          value={stats?.stabilityLabel ?? '—'}
          unit={stats?.stabilityPct != null ? `${stats.stabilityPct}%` : undefined}
        />
        <StatCell label="MIN" value={stats?.minFreq != null ? fmtHz(stats.minFreq) : '—'} unit={stats?.minFreq != null ? 'Hz' : undefined} />
        <StatCell label="MAX" value={stats?.maxFreq != null ? fmtHz(stats.maxFreq) : '—'} unit={stats?.maxFreq != null ? 'Hz' : undefined} />
      </View>

      {/* Reset + Hold controls. */}
      <View style={styles.controls}>
        <Pressable style={styles.ctrlBtn} onPress={reset} accessibilityRole="button" accessibilityLabel="Reset">
          <Text style={styles.ctrlText}>RESET</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, held && styles.ctrlBtnActive]}
          onPress={() => setHeld((h) => !h)}
          accessibilityRole="button"
          accessibilityState={{ selected: held }}
          accessibilityLabel={held ? 'Release hold' : 'Hold'}
        >
          <Text style={[styles.ctrlText, held && styles.ctrlTextActive]}>{held ? 'HOLD ●' : 'HOLD'}</Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </>
  );
}

export function FrequencyCounterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode | null>(null);

  const goBack = () => (mode ? setMode(null) : navigation.goBack());
  const modeMeta = MODES.find((m) => m.key === mode) ?? null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backBtnText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>FREQUENCY COUNTER</Text>
          <Text style={styles.subtitle}>{modeMeta ? modeMeta.name : 'Hz Counter'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {mode == null ? (
          <ModeSelect onPick={setMode} />
        ) : mode === 'tap' ? (
          <TapMode />
        ) : (
          // Sound + Light Pulse: honest in-development state (need the engine).
          <>
            <Text style={styles.intro}>{modeMeta?.blurb}</Text>
            <EngineInDev
              extra={
                mode === 'light'
                  ? 'The camera light-pulse mode also needs careful per-device testing: rolling-shutter and frame-rate limits cap what a phone camera can resolve, and fast flicker can alias to the wrong rate. It ships after that testing.'
                  : undefined
              }
            />
            <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10 },
  backBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: '#161616',
  },
  backBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Mode selection buttons — large.
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(95,217,196,.5)',
    backgroundColor: '#12181a',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  modeName: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.4, color: colors.textPrimary },
  modeBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 3 },
  modeChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 26, color: '#5fd9c4' },

  // Big readout.
  readout: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginTop: 4 },
  readoutValue: { fontFamily: fonts.oswaldBold, fontSize: 64, color: '#5fd9c4', letterSpacing: 1 },
  readoutUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.amberLabel },

  // Tap target.
  tapPad: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(95,217,196,.55)',
    backgroundColor: '#10171a',
    paddingVertical: 34,
    alignItems: 'center',
    gap: 6,
  },
  tapPadHeld: { borderColor: 'rgba(255,180,0,.6)', backgroundColor: '#1a1409' },
  tapPadText: { fontFamily: fonts.oswaldBold, fontSize: 26, letterSpacing: 2, color: colors.textPrimary },
  tapPadHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },

  // Results grid — 3 across.
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  statValue: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary },
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },

  controls: { flexDirection: 'row', gap: 12 },
  ctrlBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctrlBtnActive: { borderColor: 'rgba(255,180,0,.65)', backgroundColor: '#1a1409' },
  ctrlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  ctrlTextActive: { color: colors.amber },

  // In-development card (Sound / Light).
  statusCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 14,
    gap: 8,
  },
  statusTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  statusBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  disclaimer: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 6,
  },
});
