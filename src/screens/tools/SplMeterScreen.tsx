/**
 * SplMeterScreen — SPL Reference Meter, LIVE (engine build 2026-07-23; spec
 * APE_AUDIO_TOOLS_SPEC_2026_07_23.md §9: View 1 live meter + View 2 session
 * logging). Weighted metering (A/C/Z × Fast/Slow) from the native ape-dsp
 * meter frame via the shared useDspEngine hook, PEAK / PEAK HOLD with reset,
 * and a Leq session log that saves to the Measurement Library (Phase 2, §7).
 *
 * Integrity (§1.7/§5/§6):
 *  - Nothing is simulated — readouts render ONLY from a real meter frame while
 *    capture is running; every other state is EngineGate or the START card.
 *  - Every value is dBFS and labeled "dBFS · uncalibrated approximate". No
 *    number is ever presented as dB SPL (calibration does not exist yet).
 *  - Peak may legitimately exceed 0 dBFS (finding F1) — shown honestly in red,
 *    never clamped.
 *  - Capture starts only on the explicit START press; the hook stops capture
 *    on unmount (§18: no DSP behind a closed screen).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { GlassButton } from '../../components/GlassButton';
import { requireVizMeters, type VizMetersModule } from '../lab/meter/skiaGate';
import { CollapsibleSection } from '../lab/LabShell';
import type { LiveMeterDrive, PeakHoldMode } from '../lab/meter/vizMeters';
import { meterWarningFlags, useDspEngine, useToolAutoStart } from '../../features/tools/engine/useDspEngine';
import { useRafFrameLoop } from '../../features/tools/engine/useRafFrameLoop';
import { setSplCalibration, useSplCalibration } from '../../features/tools/measure/calibrationStore';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO, type SplLogPayload, type WarningFlag } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { EngineGate } from './EngineGate';
import { MIC_LIMITS, toolByKey } from './toolsData';
import { ApeDsp, type MeterFrame } from '../../../modules/ape-dsp';
import { useToolHelp, HelpHead, DisplayGuideButton } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SplMeter'>;

type Weighting = SplLogPayload['weighting']; // 'A' | 'C' | 'Z'
type MeterResponse = SplLogPayload['response']; // 'fast' | 'slow'

const WEIGHTINGS: Weighting[] = ['A', 'C', 'Z'];
const RESPONSES: MeterResponse[] = ['fast', 'slow'];

/** The selected weighting × response reading from a real meter frame. */
function selectedLevelDb(m: MeterFrame, w: Weighting, r: MeterResponse): number {
  if (w === 'A') return r === 'fast' ? m.aFastDb : m.aSlowDb;
  if (w === 'C') return r === 'fast' ? m.cFastDb : m.cSlowDb;
  return r === 'fast' ? m.zFastDb : m.zSlowDb;
}

/** dB display: one decimal, honest "+" above 0 dBFS (F1), em-dash for silence
 *  (-Infinity from the engine before any signal). */
const fmtDb = (v: number) => (Number.isFinite(v) ? (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : '—');

const fmtElapsed = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Wall-seconds one phase-clock loop represents inside the VU popup — the
 *  clock runs at 1/VU_LOOP Hz so the ballistics integrate real time. */
const VU_LOOP = 4;

/** Uncalibrated dBFS → dB-SPL estimate: 0 dBFS ≈ this many dB SPL on a typical
 *  phone mic (they clip acoustically ~100–120 dB SPL). Single source so the
 *  dial, zone-color EMA and readouts all agree. Only a starting point — field
 *  calibration overrides it. */
const NOMINAL_OFFSET = 100;

/** TOP hero (mounted only while the popup is open AND the viz gate passed): the
 *  classic wide horizontal VU — the relative meter around the RANGE reference.
 *  `live0Db` is driven to (RANGE − splOffset) so a measured SPL == RANGE parks
 *  the needle at 0 VU; MAX + the current level are printed inside the glass. */
function VuTopMeter({
  viz,
  live,
  vuW,
  vuH,
  live0Db,
  maxText,
  levelText,
  rangeText,
  brackets,
  peakHold,
}: {
  viz: VizMetersModule;
  live: LiveMeterDrive;
  vuW: number;
  vuH: number;
  live0Db: number;
  maxText: string;
  levelText: string;
  rangeText: string;
  brackets: { lowText: string; highText: string; mid10Text?: string; mid5Text?: string };
  peakHold: PeakHoldMode;
}) {
  const phase = viz.usePhaseClock(true, 1 / VU_LOOP);
  return (
    <viz.VuMeterView
      width={vuW}
      height={vuH}
      phase={phase}
      live={live}
      showPeakLed
      loopSeconds={VU_LOOP}
      live0Db={live0Db}
      cornerReadouts={{ maxText, levelText, rangeText }}
      scaleBrackets={brackets}
      peakHold={peakHold}
    />
  );
}

/** Tall LED PEAK/AVERAGE meter down the RIGHT side (owner 2026-07-30): spans
 *  from the top of the VU all the way down past the controls, ending above the
 *  circle meter. Its own phase clock; reads the same live SharedValues. */
function SideLed({
  viz,
  live,
  ledW,
  ledH,
  holdMode,
  splOffset,
  weightingLabel,
}: {
  viz: VizMetersModule;
  live: LiveMeterDrive;
  ledW: number;
  ledH: number;
  holdMode: PeakHoldMode;
  splOffset: number;
  weightingLabel: string;
}) {
  const phase = viz.usePhaseClock(true, 1 / VU_LOOP);
  if (ledH <= 0) return <View style={{ width: ledW }} />;
  return (
    <viz.PeakAvgMeterView
      width={ledW}
      height={ledH}
      phase={phase}
      live={live}
      loopSeconds={VU_LOOP}
      holdMode={holdMode}
      splOffset={splOffset}
      weightingLabel={weightingLabel}
    />
  );
}

/** BELOW the VU (owner 2026-07-30): LEFT the round "Noise'o'Meter" dB-SPL gauge
 *  (colored loudness arc + control-room sweet-spot band + ballistic needle),
 *  RIGHT the thin live LED meter (PEAK + AVERAGE with a user peak-hold). Both
 *  are driven by the SAME polled RMS/peak SharedValues off one shared clock. */
function VuHero({
  viz,
  live,
  dialW,
  dialH,
  splOffset,
  calibrated,
  dialMode,
  onDialMode,
  onModeHelp,
  centerText,
  centerColor,
  sweetSpot,
  onToggle,
}: {
  viz: VizMetersModule;
  live: LiveMeterDrive;
  dialW: number;
  dialH: number;
  splOffset: number;
  calibrated: boolean;
  dialMode: DialMode;
  onDialMode: (m: DialMode) => void;
  onModeHelp: () => void;
  centerText: string;
  centerColor?: string;
  sweetSpot: boolean;
  /** Tap the dial (not the mode chips) to toggle the meter START/STOP. */
  onToggle?: () => void;
}) {
  const phase = viz.usePhaseClock(true, 1 / VU_LOOP);
  return (
    // SPL gauge — its OWN full-width row so labels sit outside the arc. The
    // STUDIO/SPL chooser is pinned to the TOP-LEFT corner of the container
    // (owner 2026-07-30); the LED shares the top row with the VU. Tapping the
    // dial toggles START/STOP; the corner mode chips render OVER this Pressable
    // and keep their own taps (owner 2026-07-31).
    <View style={{ width: dialW, alignSelf: 'center', height: dialH }}>
      <Pressable onPress={onToggle} accessibilityRole={onToggle ? 'button' : undefined}>
      <viz.SplDialView
        width={dialW}
        height={dialH}
        phase={phase}
        live={live}
        splOffset={splOffset}
        calibrated={calibrated}
        labelMode={dialMode}
        loopSeconds={VU_LOOP}
        centerText={centerText}
        centerColor={centerColor}
        sweetSpot={sweetSpot}
      />
      </Pressable>
      <View style={styles.dialModeCorner}>
        {(['studio', 'spl', 'optimal'] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.dialModeChip, dialMode === m && styles.chipSelected]}
            onPress={() => onDialMode(m)}
            onLongPress={onModeHelp}
            delayLongPress={260}
            accessibilityRole="button"
            accessibilityState={{ selected: dialMode === m }}
            accessibilityLabel={
              m === 'studio' ? 'Studio labels' : m === 'spl' ? 'SPL reference labels' : 'Optimal reference listening labels'
            }
          >
            <Text style={[styles.dialModeChipText, dialMode === m && styles.chipTextSelected]}>
              {m.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** RANGE — the environmental SPL that reads 0 VU. The VU shows the signal
 *  RELATIVE to this reference (current SPL − RANGE), so RANGE centres the meter
 *  on the room's noise level. Default 100 dB. AUTO (below) tracks ambient. */
const RANGE_VALUES = [40, 60, 80, 90, 100] as const;

// Circle-gauge zone palette (matches SplDialView's darkened arc colors) — used to
// tint the live centre readout so the number turns the colour of the zone it sits
// in as the level moves (owner 2026-07-30).
const ZONE = { green: '#1f7a34', amber: '#b8860b', orange: '#c9631a', red: '#b3271e', dim: '#6b7078' } as const;
type DialMode = 'studio' | 'spl' | 'optimal';
// Unified level→zone mapping (owner 2026-07-30): GRAY below the green start,
// GREEN up to 84, YELLOW 85–94, ORANGE 95–99, RED 100+. The green START differs
// by mode — STUDIO wants a monitored 60 dB floor; SPL/OPTIMAL start green at 40.
function splZoneColor(spl: number, mode: DialMode): string {
  const greenStart = mode === 'studio' ? 60 : 40;
  if (spl < greenStart) return ZONE.dim;
  if (spl <= 84) return ZONE.green;
  if (spl <= 94) return ZONE.amber;
  if (spl <= 99) return ZONE.orange;
  return ZONE.red;
}

/** Peak-hold linger options for the LED meter's user setting. */
const HOLD_MODES: PeakHoldMode[] = ['off', '1s', '3s', 'inf'];
const holdLabel = (m: PeakHoldMode) => (m === 'off' ? 'OFF' : m === 'inf' ? '∞' : m);

/** Plain-RN mini-VU fallback for pre-Skia clients (cream face, red zone,
 *  tilted needle) — the opener must read as a tiny VU even without Skia. */
function VuGlyphFallback() {
  return (
    <View style={styles.vuGlyphFace}>
      <View style={styles.vuGlyphArc} />
      <View style={styles.vuGlyphRed} />
      <View style={styles.vuGlyphNeedle} />
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  compact,
  bigGlyph,
  tint = 'amber',
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  /** Render the label larger (e.g. the ∞ peak-hold glyph, too small otherwise). */
  bigGlyph?: boolean;
  /** Selected accent (owner 2026-07-30): amber is the house accent; RESPONSE uses
   *  green (FAST) / purple (SLOW). Replaces the off-system orange. */
  tint?: 'amber' | 'green' | 'purple';
  accessibilityLabel?: string;
}) {
  const selStyle =
    tint === 'green' ? styles.chipSelGreen : tint === 'purple' ? styles.chipSelPurple : styles.chipSelected;
  const selText =
    tint === 'green' ? styles.chipTextGreen : tint === 'purple' ? styles.chipTextPurple : styles.chipTextSelected;
  return (
    <Pressable
      style={[styles.chip, compact && styles.chipCompact, selected && selStyle]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text
        style={[
          styles.chipText,
          compact && styles.chipTextCompact,
          bigGlyph && styles.chipTextGlyph,
          selected && selText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** LiveWarnings (owner 2026-07-30): the amber quality warnings, moved to the
 *  BOTTOM. A NEW warning fires one brief haptic pulse and FLASHES prominently for
 *  5 s, then drops into the steady accumulated list below it. Every flag that has
 *  ever appeared stays in the list (deduped) even if its condition later clears. */
function LiveWarnings({ flags }: { flags: WarningFlag[] }) {
  const [seen, setSeen] = useState<WarningFlag[]>([]);
  const [flashing, setFlashing] = useState<Set<WarningFlag>>(new Set());
  const seenRef = useRef<Set<WarningFlag>>(new Set());
  const timers = useRef<Map<WarningFlag, ReturnType<typeof setTimeout>>>(new Map());
  const flash = useRef(new Animated.Value(1)).current;

  const flagsKey = flags.join(',');
  useEffect(() => {
    for (const f of flags) {
      if (seenRef.current.has(f)) continue;
      seenRef.current.add(f);
      setSeen((prev) => [...prev, f]);
      setFlashing((prev) => new Set(prev).add(f));
      if (hapticsEnabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      const t = setTimeout(() => {
        setFlashing((prev) => {
          const n = new Set(prev);
          n.delete(f);
          return n;
        });
        timers.current.delete(f);
      }, 5000);
      timers.current.set(f, t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagsKey]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  // Pulse the flash opacity while any warning is in its 5 s window.
  const flashing0 = flashing.size > 0;
  useEffect(() => {
    if (!flashing0) {
      flash.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 0.3, duration: 420, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flashing0, flash]);

  if (seen.length === 0) return null;
  const active = seen.filter((f) => flashing.has(f));
  const steady = seen.filter((f) => !flashing.has(f));
  return (
    <View style={styles.warnArea}>
      {active.map((f) => (
        <Animated.Text key={f} style={[styles.warnFlash, { opacity: flash }]}>
          ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
        </Animated.Text>
      ))}
      {steady.length > 0 ? (
        <View style={styles.warnList}>
          {steady.map((f) => (
            <Text key={f} style={styles.liveWarn}>
              ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function SplMeterScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('spl');
  const insets = useSafeAreaInsets();
  const tool = toolByKey('spl');
  // Lifecycle-only engine (responsiveness fix 2026-07-30): we do NOT let the
  // engine poll frames into React state — that 15 Hz whole-screen re-render was
  // backing up the JS thread and adding a ~1 s "slapback" lag to the meters.
  // Instead we drive the live meters DIRECTLY off ApeDsp.getMeterFrame() each
  // animation frame into SharedValues (UI thread), and update the TEXT readouts
  // on a slow throttle. See the rAF loop below.
  const { state, start, stop, lastError, resetPeakHold, resetLeq } = useDspEngine({}, {});

  // Auto-resume within the SPL ecosystem (owner 2026-07-30): the engine tears
  // the mic down on blur for privacy (useDspEngine), so navigating to the
  // calculators / saved measurements / VU and back would otherwise re-show the
  // START card. We remember the user's INTENT to run and silently re-arm the
  // meter on refocus — the mic is still off while away, just restored on return.
  // A deliberate STOP clears the intent, so it is also the "end my session" act.
  const wantRunning = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  // micPaused (owner 2026-07-30): STOP must ONLY stop the mic — it is NOT a
  // navigation/exit button. Previously STOP dropped state to 'idle', which
  // collapsed the whole tool back to its START card (it read as "kicked out to
  // the menu"). Now a manual STOP sets micPaused so the tool UI STAYS visible
  // (frozen, readouts dashed) and the same button flips to START to re-arm.
  const [micPaused, setMicPaused] = useState(false);
  const startMeter = useCallback(() => {
    wantRunning.current = true;
    // Do NOT clear micPaused here (routing-flash fix 2026-07-30): if we cleared
    // it now, then during the 'starting' transition micPaused=false AND
    // running=false → the meter UI would collapse to the START/landing card for
    // a frame (the "flash" the owner saw) before 'running'. Keep the meter up by
    // leaving micPaused set; it's cleared only once we are actually running.
    void start();
  }, [start]);
  const stopMeter = useCallback(() => {
    wantRunning.current = false;
    setMicPaused(true);
    stop();
  }, [stop]);
  useFocusEffect(
    useCallback(() => {
      if (wantRunning.current && stateRef.current === 'idle') void start();
    }, [start]),
  );

  // Open straight into the live meter — no redundant START screen (owner
  // 2026-08-01). Fires once; a deliberate STOP still holds the tool on-screen.
  useToolAutoStart(state, startMeter);

  const [weighting, setWeighting] = useState<Weighting>('A');
  const [response, setResponse] = useState<MeterResponse>('fast');
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  // Field calibration (ruling R1, 2026-07-23): a single DEVICE-LOCAL offset
  // maps dBFS → displayed dB SPL. Calibrated stays APPROXIMATE — this is a
  // field calibration against the user's reference, not an IEC instrument.
  const cal = useSplCalibration();
  const offset = cal?.offsetDb ?? null;
  const [calibrating, setCalibrating] = useState(false);
  // Draft offset while the calibrate panel is open. 100 dB is only a starting
  // point (0 dBFS ≈ 100–120 dB SPL on typical phone mics) — the user matches
  // their reference meter.
  const [draftOffset, setDraftOffset] = useState(100);
  const unitLabel = offset != null ? 'dB SPL · field-calibrated (approximate)' : 'dBFS · uncalibrated approximate';
  /** Level shown to the user: calibrated when an offset exists, else raw dBFS. */
  const shown = (rawDb: number, withDraft = false) =>
    rawDb + (withDraft ? draftOffset : (offset ?? 0));

  const running = state === 'running';
  // Show the tool's meter UI while running OR while manually paused (mic off but
  // still IN the tool) — never collapse to the START card on a manual STOP.
  const showMeter = running || micPaused;
  // Clear the paused flag only when capture is truly running — so the meter UI
  // never drops to the landing card during the 'starting' transition (routing
  // flash fix 2026-07-30).
  useEffect(() => {
    if (running) setMicPaused(false);
  }, [running]);
  // TEXT readouts come from a THROTTLED snapshot of the live frame (~10 Hz) —
  // plenty for reading numbers, and far cheaper than re-rendering the whole
  // screen every native tick. The needles/LED do NOT use this (they read the
  // SharedValues driven by the rAF loop). Stale frames after STOP are cleared.
  const [displayMeter, setDisplayMeter] = useState<MeterFrame | null>(null);
  const meter = running ? displayMeter : null;
  // Note: meterWarningFlags raises 'uncalibrated_input' only for OS-PROCESSED
  // input (measurement mode not honored) — that stays a warning even when
  // field-calibrated, because it undermines the calibration itself.
  const flags = meterWarningFlags(meter);

  // ── Full-screen VU popup (owner directive 2026-07-29) ─────────────────────
  // Skia meters load ONLY through the meter gate (§1.7 honest fallback).
  const viz = useMemo(() => requireVizMeters(), []);
  const [vuOpen, setVuOpen] = useState(false);
  // User setting for the LED meter's peak-hold cap linger (owner 2026-07-30).
  const [holdMode, setHoldMode] = useState<PeakHoldMode>('1s');
  // RANGE (owner 2026-07-30): the environmental SPL that reads 0 VU. The wide VU
  // at the top shows the signal RELATIVE to this (current SPL − RANGE).
  const [rangeDb, setRangeDb] = useState(60);
  // AUTO range (owner 2026-07-30): when on, the 0-VU reference tracks a slow EMA
  // of the measured SPL so the needle stays on-scale and visibly swinging around
  // centre. Manual chips turn it off. autoRangeDb is the rounded auto reference.
  const [rangeAuto, setRangeAuto] = useState(false);
  const [autoRangeDb, setAutoRangeDb] = useState(80);
  const splEmaRef = useRef<number | null>(null);
  // 3-second averaged SPL that drives the gauge ZONE COLOR only (owner
  // 2026-08-05) — the number stays live, but its color is smoothed so it does
  // not flash when the level hovers at a color-change threshold.
  const zoneEmaRef = useRef<number | null>(null);
  const [zoneSpl, setZoneSpl] = useState<number | null>(null);
  // Circle-meter label mode (owner 2026-07-30): STUDIO (control-room sweet-spot)
  // vs SPL (reference sounds). The node point rides the same arc in both.
  const [dialMode, setDialMode] = useState<DialMode>('studio');
  // Collapsible circle-meter (owner 2026-07-30): minimize the gauge to bring the
  // session log + calibration higher on the screen.
  const [gaugeOpen, setGaugeOpen] = useState(true);
  const { width: winW } = useWindowDimensions();
  // TOP area (owner 2026-07-30): a LEFT column holds the VU plus the RANGE /
  // WEIGHTING / PEAK-HOLD controls; a thin TALL LED meter runs down the RIGHT,
  // spanning the full height of that column (top of the VU → just above the
  // circle meter). The LED height is measured from the left column via onLayout.
  const LED_GAP = 10;
  // Wider (owner 2026-07-30) to fit the left-side AVG (purple) + PEAK (white)
  // readouts beside the bar, the SPL scale to 110, and the red over-100 frame.
  const ledW = 104;
  const leftColW = winW - 32 - LED_GAP - ledW;
  const vuW = leftColW; // the VU fills the left column width
  const vuH = Math.round(vuW * 0.56);
  const [leftColH, setLeftColH] = useState(0);
  // Below the top area: the SPL gauge gets its OWN FULL-WIDTH row so its callout
  // labels sit OUTSIDE the arc with leader lines.
  const dialW = winW - 32;
  const dialH = Math.round(dialW * 0.92);
  // Live meter drive (responsiveness fix 2026-07-30): two SharedValues the Skia
  // meters chase on the UI thread. RMS = the selected weighting × response level;
  // peak = the raw peak (F1: may exceed 0 dBFS, never clamped). −120 = silence.
  const liveRmsDb = useSharedValue(-120);
  const livePeakDb = useSharedValue(-120);
  // Current control values read by the rAF loop WITHOUT re-subscribing it.
  const weightingRef = useRef(weighting);
  weightingRef.current = weighting;
  const responseRef = useRef(response);
  responseRef.current = response;
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  // The critical loop: while running, read the native meter frame DIRECTLY (a
  // synchronous JSI call — the native analysis thread refreshes it every ~50 ms)
  // every animation frame and push it straight into the SharedValues. This keeps
  // the needles/LED on the UI thread's fast path — NO React state, NO whole-screen
  // re-render — which is what removes the ~1 s "slapback" lag. A slow throttle
  // (~10 Hz) mirrors the frame into `displayMeter` for the TEXT readouts only.
  const lastTextRef = useRef(0);
  useRafFrameLoop(running, (now) => {
    const m = ApeDsp.getMeterFrame();
    if (!m) return;
    const lvl = selectedLevelDb(m, weightingRef.current, responseRef.current);
    liveRmsDb.value = Number.isFinite(lvl) ? lvl : -120;
    livePeakDb.value = Number.isFinite(m.peakDb) ? m.peakDb : -120;
    // AUTO-RANGE feed: a smoothed EMA of the estimated SPL so the auto 0-VU
    // reference tracks ambient (keeps the needle on-scale and moving).
    if (Number.isFinite(lvl)) {
      const splNow = lvl + (offsetRef.current ?? NOMINAL_OFFSET);
      splEmaRef.current =
        splEmaRef.current == null ? splNow : splEmaRef.current + (splNow - splEmaRef.current) * 0.15;
    }
    // Throttle the text-driving state to ~20 Hz (owner 2026-08-05: snappier
    // numbers — matches the native ~50 ms frame refresh, so no faster is useful).
    if (now - lastTextRef.current >= 50) {
      const dtText = now - lastTextRef.current;
      lastTextRef.current = now;
      setDisplayMeter(m);
      // 3-second EMA of the estimated SPL → the gauge zone COLOR (not the number).
      if (Number.isFinite(lvl)) {
        const s = lvl + (offsetRef.current ?? NOMINAL_OFFSET);
        const a = Math.min(1, dtText / 3000);
        zoneEmaRef.current = zoneEmaRef.current == null ? s : zoneEmaRef.current + (s - zoneEmaRef.current) * a;
        setZoneSpl(Math.round(zoneEmaRef.current));
      }
    }
  });
  // Rest the needles when not capturing (paused / idle / blurred).
  useEffect(() => {
    if (!running) {
      liveRmsDb.value = -120;
      livePeakDb.value = -120;
      zoneEmaRef.current = null;
      setZoneSpl(null);
    }
  }, [running, liveRmsDb, livePeakDb]);

  // AUTO range recompute — reads the smoothed EMA a few times a second and parks
  // the 0-VU reference 10 dB ABOVE the current level, so the live signal sits
  // mid-scale (~−10 VU) and keeps swinging. Rounded to 5 dB with a small
  // hysteresis so it re-settles without hunting. Only while AUTO + live.
  useEffect(() => {
    if (!rangeAuto || !running) return;
    const id = setInterval(() => {
      const ema = splEmaRef.current;
      if (ema == null) return;
      const target = Math.max(20, Math.min(130, Math.round((ema + 10) / 5) * 5));
      setAutoRangeDb((prev) => (Math.abs(prev - target) >= 5 ? target : prev));
    }, 300);
    return () => clearInterval(id);
  }, [rangeAuto, running]);
  const live = useMemo<LiveMeterDrive>(() => ({ rmsDb: liveRmsDb, peakDb: livePeakDb }), [liveRmsDb, livePeakDb]);

  // ── Dial mapping + corner readouts (single source: the screen's shown()/unit
  // math, so the needle's SPL position matches every number elsewhere) ────────
  // splOffset = the field-calibration offset, or a nominal 100 dB estimate when
  // uncalibrated (0 dBFS ≈ 100 dB SPL on a typical phone mic). calibrated=false
  // badges the dial ESTIMATED — never a certified SPL reading (§1.7).
  const splOffset = offset ?? NOMINAL_OFFSET;
  const calibrated = offset != null;
  // VU RANGE wiring (owner 2026-07-30, corrected): the RANGE value is the SPL that
  // reads 0 VU (the selected number sits AT the 0 mark); the −20 mark is 20 dB
  // below it. So RANGE 80 shows 80 dB at 0 and 60 dB at −20. The dBFS that reads
  // 0 VU is RANGE − splOffset. In AUTO the reference is the slow-tracked ambient.
  const rangeRef = rangeAuto ? autoRangeDb : rangeDb; // SPL that reads 0 VU
  // While AUTO is active, faintly light the numeric button nearest the value AUTO
  // has currently chosen (owner 2026-07-30) — shows what AUTO picked at a glance.
  const autoNearest = RANGE_VALUES.reduce(
    (a, b) => (Math.abs(b - autoRangeDb) < Math.abs(a - autoRangeDb) ? b : a),
    RANGE_VALUES[0] as number,
  );
  const vuLive0 = rangeRef - splOffset;
  // Printed TOP-LEFT on the VU face (owner 2026-07-30): the weighting + response
  // in use (the RANGE now lives in the blue in-arc brackets and the chip row).
  const vuRangeText = `${weighting} · ${response === 'fast' ? 'FAST' : 'SLOW'}`;
  // SPL bracket printed inside the arc (BLUE — the 0 value equals the blue RANGE
  // button): low number at −20 (= RANGE − 20), high at 0 (= RANGE).
  const vuBrackets = {
    lowText: `${rangeRef - 20}`,
    mid10Text: `${rangeRef - 10}`,
    mid5Text: `${rangeRef - 5}`,
    highText: `${rangeRef}`,
  };
  // VU corner readouts (printed inside the glass) — BUGFIX 2026-07-30: these must
  // show the ESTIMATED dB SPL (level + splOffset), the SAME number the needle,
  // the blue brackets, and the circle centre use. Previously they printed raw
  // dBFS (e.g. −67), which disagreed with the needle and read like "67 dB" next
  // to a 40 dB room. estSpl() converts a dBFS reading to the SPL estimate.
  const estSpl = (dbfs: number) => (Number.isFinite(dbfs) ? (dbfs + splOffset).toFixed(1) : '—');
  const vuMaxText = meter ? estSpl(meter.peakHoldDb) : '—';
  const vuLevelText = meter ? estSpl(selectedLevelDb(meter, weighting, response)) : '—';
  // Live SPL number for the CENTER of the circle gauge — the ESTIMATED dB SPL
  // (level + splOffset) so it matches the node's position on the dial's scale —
  // plus its zone colour so the number turns the colour of the arc zone it's in.
  const dialSpl = meter ? Math.round(selectedLevelDb(meter, weighting, response) + splOffset) : null;
  const dialCenterText = dialSpl != null ? `${dialSpl}` : '—';
  // COLOR from the 3-second average (owner 2026-08-05) — the number is live but
  // its zone color is smoothed so it doesn't flash at a threshold.
  const colorSpl = zoneSpl ?? dialSpl;
  const dialCenterColor = colorSpl != null ? splZoneColor(colorSpl, dialMode) : undefined;
  // Control-room sweet spot (owner 2026-07-30): in STUDIO mode only, a live level
  // in the 79–85 dB monitoring band lights the glowing gold frame around the
  // gauge (matches the dial's gold sweet-spot band). Never in SPL/OPTIMAL.
  const inSweetSpot = dialMode === 'studio' && colorSpl != null && colorSpl >= 79 && colorSpl <= 85;

  /** SAVE LOG → Saved Measurement Library (spec §7; payload = SplLogPayload). */
  const onSaveLog = useCallback(() => {
    // Read the FRESHEST frame directly at save time (no polled React state now).
    const m = state === 'running' ? ApeDsp.getMeterFrame() : null;
    if (!m) return;
    const saveFlags = meterWarningFlags(m);
    // Without a field calibration the record is explicitly uncalibrated
    // (spec §9 required warning). With one (ruling R1), the record carries
    // calibration_status 'calibrated' + the disclosed offset instead.
    if (offset == null && !saveFlags.includes('uncalibrated_input'))
      saveFlags.push('uncalibrated_input');
    // The engine logs Leq(A) and Leq(Z) only — a C-weighted selection stores
    // the unweighted Leq(Z) as its average (documented honest fallback).
    // Values are stored AS DISPLAYED: dB SPL when field-calibrated, else dBFS
    // (compare mode already warns on calibrated-vs-uncalibrated pairs).
    const avgDb = shown(weighting === 'A' ? m.leqADb : m.leqZDb);
    const unit = offset != null ? 'dB SPL' : 'dBFS';
    const payload: SplLogPayload = {
      kind: 'spl_log',
      weighting,
      response,
      durationSec: m.elapsedSec,
      timeline: [], // timeline capture ships with a later engine pass
      timelineStepSec: 0,
      peakDb: shown(m.peakHoldDb),
      avgDb,
    };
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'spl',
      created_at: new Date().toISOString(),
      title: `SPL Log — Leq(${weighting === 'A' ? 'A' : 'Z'}) ${fmtDb(avgDb)} ${unit} · ${fmtElapsed(m.elapsedSec)}`,
      notes: '',
      input_device: 'phone microphone',
      calibration_status: offset != null ? 'calibrated' : 'uncalibrated',
      sample_rate: null, // info polling is out of scope for this screen
      measurement_settings:
        offset != null
          ? { weighting, response, cal_offset_db: offset, cal_set_at: cal?.setAt ?? null }
          : { weighting, response },
      quality_state: evaluateQuality(saveFlags),
      warning_flags: saveFlags,
      data_payload: payload,
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, weighting, response, offset, cal]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
          {tool.subtitle ? <Text style={styles.subtitle}>{tool.subtitle}</Text> : null}
        </View>
        <AccuracyNote compact detail="This tool runs on your phone’s UNCALIBRATED microphone and audio path — read it as RELATIVE (dBFS), for learning. For accurate, absolute measurements use a calibrated SPL meter, measurement mic, or a dedicated instrument." />
        {/* Mini-VU opener → the full-screen VU popup (owner 2026-07-29). Larger
            + enclosed in a framed container (owner 2026-07-30). */}
        <Pressable
          style={styles.vuOpenBtn}
          onPress={() => setVuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open full-screen VU meter"
        >
          <View style={styles.vuOpenFrame}>
            {viz ? <viz.VuGlyph size={58} /> : <VuGlyphFallback />}
          </View>
          <Text style={styles.vuOpenLabel}>VU View</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready states: absent / spike / denied / error. */}
        <EngineGate state={state} lastError={lastError} />

        {/* Opens straight into the live meter (auto-start). */}
        {!micPaused && (state === 'idle' || state === 'starting') && (
          <Text style={styles.intro}>Starting the meter…</Text>
        )}

        {showMeter && (
          <>
            {/* Weighting × response selection (spec §9 required controls). */}
            <View style={styles.chipsRow}>
              <View style={styles.chipGroup}>
                <HelpHead title="WEIGHTING" onHelp={() => help('weighting')} style={styles.chipGroupLabel} />
                <View style={styles.chipSet}>
                  {WEIGHTINGS.map((w) => (
                    <Chip key={w} label={w} selected={weighting === w} onPress={() => setWeighting(w)} />
                  ))}
                </View>
              </View>
              <View style={styles.chipGroup}>
                <HelpHead title="RESPONSE" onHelp={() => help('response')} style={styles.chipGroupLabel} />
                <View style={styles.chipSet}>
                  {RESPONSES.map((r) => (
                    <Chip
                      key={r}
                      label={r.toUpperCase()}
                      tint={r === 'fast' ? 'green' : 'purple'}
                      selected={response === r}
                      onPress={() => setResponse(r)}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Big live readout of the selected weighting × response. Tapping the
                display toggles the meter START/STOP (owner 2026-07-31). */}
            <Pressable
              style={styles.readoutCard}
              onPress={running ? stopMeter : startMeter}
              accessibilityRole="button"
              accessibilityLabel={running ? 'Tap to stop the meter' : 'Tap to start the meter'}
            >
              <Text style={styles.readoutEyebrow}>
                {`L${weighting}${response === 'fast' ? 'F' : 'S'} · ${weighting}-WEIGHTED · ${response.toUpperCase()}`}
              </Text>
              <Text style={styles.readoutValue}>
                {meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response))) : '—'}
              </Text>
              <Text style={styles.readoutSub}>{unitLabel}</Text>
            </Pressable>
            <DisplayGuideButton onPress={helpAll} />

            {/* PEAK / PEAK HOLD — may exceed 0 dBFS (F1): red at ≥ 0, never clamped. */}
            <View style={styles.peakRow}>
              {/* Peak cells stay RAW dBFS always — they are digital-headroom
                  indicators; the ≥0 dBFS hot state is about the converter
                  ceiling, not acoustic level (F1). */}
              <Pressable style={styles.peakCell} onLongPress={() => help('peak')} delayLongPress={260}>
                <Text style={styles.cellLabel}>PEAK (dBFS)</Text>
                {/* Peak text readouts are always red (owner 2026-07-31); the ≥0
                    dBFS ceiling still escalates to the hot state. */}
                <Text style={[styles.cellValue, styles.cellValueMax, meter != null && meter.peakDb >= 0 && styles.cellValueHot]}>
                  {meter ? fmtDb(meter.peakDb) : '—'}
                </Text>
              </Pressable>
              <Pressable style={styles.peakCell} onLongPress={() => help('peak_hold')} delayLongPress={260}>
                <Text style={styles.cellLabel}>PEAK HOLD (dBFS)</Text>
                {/* MAX / peak-hold reading in red (owner 2026-07-30). */}
                <Text style={[styles.cellValue, styles.cellValueMax]}>
                  {meter ? fmtDb(meter.peakHoldDb) : '—'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.ctrlBtnSmall}
                onPress={resetPeakHold}
                accessibilityRole="button"
                accessibilityLabel="Reset peak hold"
              >
                <Text style={styles.ctrlText}>RESET{'\n'}PEAK</Text>
              </Pressable>
            </View>

            {/* Session log (spec §9 View 2): Leq + elapsed + reset/save. */}
            <View style={styles.logCard}>
              <HelpHead title="SESSION LOG" onHelp={() => help('session_log')} style={styles.sectionHead} />
              <Pressable onLongPress={() => help('session_log')} delayLongPress={260}>
              <View style={styles.logRow}>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>Leq(A)</Text>
                  <Text style={styles.cellValue}>{meter ? fmtDb(shown(meter.leqADb)) : '—'}</Text>
                </View>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>Leq(Z)</Text>
                  <Text style={styles.cellValue}>{meter ? fmtDb(shown(meter.leqZDb)) : '—'}</Text>
                </View>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>ELAPSED</Text>
                  <Text style={styles.cellValue}>{meter ? fmtElapsed(meter.elapsedSec) : '—'}</Text>
                </View>
              </View>
              </Pressable>
              <Text style={styles.logNote}>
                Leq = equivalent continuous level over the session · {unitLabel}
              </Text>
              <View style={styles.controls}>
                <Pressable style={styles.ctrlBtn} onPress={resetLeq} accessibilityRole="button" accessibilityLabel="Reset log">
                  <Text style={styles.ctrlText}>RESET LOG</Text>
                </Pressable>
                <Pressable
                  style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !meter && styles.ctrlBtnDisabled]}
                  onPress={onSaveLog}
                  disabled={!meter}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !meter }}
                  accessibilityLabel="Save log"
                >
                  <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
                    {justSaved ? 'SAVED ✓' : 'SAVE LOG'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* STOP — ABOVE calibration (owner 2026-07-30). Only turns the mic OFF
                and STAYS in the tool; flips to START to re-arm. */}
            {running ? (
              <GlassButton label="STOP · MIC OFF" tint="gold" onPress={stopMeter} />
            ) : (
              <GlassButton label="START · MIC ON" tint="gold" onPress={startMeter} />
            )}

            {/* Field calibration (ruling R1, 2026-07-23): device-local offset,
                matched against the user's reference meter. Moved BELOW the
                session log (owner 2026-07-30) — it's a setup step, so it sits
                under the live readouts and log the user works with. */}
            <View style={styles.calCard}>
              <View style={styles.calHeadRow}>
                <HelpHead title="CALIBRATION" onHelp={() => help('calibration')} style={styles.sectionHead} />
                <Text style={[styles.calStatus, offset != null && styles.calStatusOn]}>
                  {offset != null ? `FIELD-CALIBRATED · +${offset.toFixed(1)} dB` : 'UNCALIBRATED'}
                </Text>
              </View>
              {!calibrating ? (
                <View style={styles.controls}>
                  <Pressable
                    style={styles.ctrlBtn}
                    onPress={() => {
                      setDraftOffset(offset ?? 100);
                      setCalibrating(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Calibrate against a reference meter"
                  >
                    <Text style={styles.ctrlText}>{offset != null ? 'RE-CALIBRATE' : 'CALIBRATE'}</Text>
                  </Pressable>
                  {offset != null && (
                    <Pressable
                      style={styles.ctrlBtn}
                      onPress={() => setSplCalibration(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Clear calibration"
                    >
                      <Text style={styles.ctrlText}>CLEAR</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  <Text style={styles.calHint}>
                    Play steady pink noise and adjust until this reading matches your reference
                    sound-level meter (same weighting and response on both).
                  </Text>
                  <Text style={styles.calDraftValue}>
                    {meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response), true)) : '—'}
                    <Text style={styles.calDraftUnit}>  dB SPL (candidate)</Text>
                  </Text>
                  <View style={styles.controls}>
                    {[-5, -0.5, +0.5, +5].map((step) => (
                      <Pressable
                        key={step}
                        style={styles.ctrlBtn}
                        onPress={() => setDraftOffset((d) => Math.round((d + step) * 2) / 2)}
                        accessibilityRole="button"
                        accessibilityLabel={`Adjust ${step > 0 ? 'up' : 'down'} ${Math.abs(step)} dB`}
                      >
                        <Text style={styles.ctrlText}>{step > 0 ? `+${step}` : step}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.controls}>
                    <Pressable
                      style={styles.ctrlBtn}
                      onPress={() => setCalibrating(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel calibration"
                    >
                      <Text style={styles.ctrlText}>CANCEL</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.ctrlBtn, styles.ctrlBtnSaved]}
                      onPress={() => {
                        setSplCalibration(draftOffset);
                        setCalibrating(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Set calibration"
                    >
                      <Text style={[styles.ctrlText, styles.ctrlTextSaved]}>SET</Text>
                    </Pressable>
                  </View>
                </>
              )}
              <Text style={styles.calNote}>
                Field calibration is stored on this device only and stays approximate — it is not a
                certified instrument calibration.
              </Text>
            </View>

          </>
        )}

        {(state === 'idle' || running) && (
          <Pressable
            onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'spl' })}
            accessibilityRole="button"
            accessibilityLabel="View saved measurements"
          >
            <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
          </Pressable>
        )}

        {/* Shared phone-mic honesty copy (spec §1.4) — collapsible footer
            (owner 2026-08-05). */}
        <CollapsibleSection title="PHONE-MIC LIMITS" startOpen={false}>
          <Text style={styles.bullet}>
            {'•  '}
            {MIC_LIMITS[0]}
          </Text>
          <Text style={styles.bullet}>
            {'•  '}
            {MIC_LIMITS[4]}
          </Text>
        </CollapsibleSection>

        {/* Amber warnings, at the very BOTTOM (owner 2026-07-30). */}
        <LiveWarnings flags={flags} />
      </ScrollView>

      {/* ── Full-screen VU popup: live meters + mirrored readouts/controls ──
          Same state, same handlers — the meter keeps running; nothing here is
          a second copy of the measurement. ✕ (top right) closes. */}
      <Modal
        visible={vuOpen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVuOpen(false)}
      >
        <View style={[styles.vuModalRoot, { paddingTop: insets.top + 8 }]}>
          <View style={styles.vuModalHead}>
            <Text style={styles.vuModalTitle}>{`${tool.name.toUpperCase()} · VU`}</Text>
            <Pressable
              onPress={() => setVuOpen(false)}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.vuClose}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.vuScroll}>
            <EngineGate state={state} lastError={lastError} />

            {!micPaused && (state === 'idle' || state === 'starting') && (
              <>
                <Text style={styles.intro}>
                  The microphone is off. Start the meter to drive the VU — capture runs only while
                  the meter runs. You stay on this screen; tap START to turn the mic back on.
                </Text>
                <GlassButton
                  label={state === 'starting' ? 'STARTING…' : 'START METER'}
                  tint="gold"
                  disabled={state === 'starting'}
                  onPress={startMeter}
                />
              </>
            )}

            {showMeter && (
              <>
                {/* 2 — TOP AREA (owner 2026-07-30): LEFT column = VU + RANGE +
                    WEIGHTING + PEAK HOLD (compact); a thin TALL LED runs down the
                    RIGHT, spanning the column height (measured via onLayout) so it
                    reaches from the top of the VU to just above the circle meter. */}
                <View style={styles.topRow}>
                  <View
                    style={[styles.topLeftCol, { width: leftColW }]}
                    onLayout={(e) => setLeftColH(Math.round(e.nativeEvent.layout.height))}
                  >
                    {viz ? (
                      <VuTopMeter
                        viz={viz}
                        live={live}
                        vuW={vuW}
                        vuH={vuH}
                        live0Db={vuLive0}
                        maxText={vuMaxText}
                        levelText={vuLevelText}
                        rangeText={vuRangeText}
                        brackets={vuBrackets}
                        peakHold={holdMode}
                      />
                    ) : (
                      /* Honest gate for pre-Skia clients (§1.7): readouts stay live. */
                      <View style={styles.vuUnavailCard}>
                        <Text style={styles.vuUnavailTitle}>VU METER NEEDS THE NEW DEV BUILD</Text>
                        <Text style={styles.vuUnavailBody}>
                          This dev client predates the graphics engine the meters render on. The
                          digital readouts below are fully live — install the newest dev build to see
                          the needles.
                        </Text>
                      </View>
                    )}
                    {/* 3 — RANGE selector (blue chips) — horizontal scroll. */}
                    <View style={styles.chipGroup}>
                      <HelpHead title={`RANGE · ${rangeRef} dB @0 VU${rangeAuto ? ' (AUTO)' : ''}`} onHelp={() => help('range')} style={styles.chipGroupLabel} />
                  {/* Single horizontal scroll row (owner 2026-07-30) — the values
                      no longer wrap to two rows. */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rangeScroll}
                  >
                    {RANGE_VALUES.map((v) => {
                      const sel = !rangeAuto && rangeDb === v;
                      const autoHint = rangeAuto && v === autoNearest;
                      return (
                        <Pressable
                          key={v}
                          style={[styles.rangeChip, autoHint && styles.rangeChipAutoHint, sel && styles.rangeChipSelected]}
                          onPress={() => {
                            setRangeAuto(false);
                            setRangeDb(v);
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: sel }}
                          accessibilityLabel={autoHint ? `Range ${v} dB (chosen by AUTO)` : `Range ${v} dB`}
                        >
                          <Text style={[styles.rangeChipText, autoHint && styles.rangeChipTextAutoHint, sel && styles.rangeChipTextSelected]}>
                            {v}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      style={[styles.rangeChip, styles.rangeChipAuto, rangeAuto && styles.rangeChipSelected]}
                      onPress={() => setRangeAuto(true)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: rangeAuto }}
                      accessibilityLabel="Auto range"
                    >
                      <Text style={[styles.rangeChipText, rangeAuto && styles.rangeChipTextSelected]}>AUTO</Text>
                    </Pressable>
                  </ScrollView>
                </View>

                    {/* WEIGHTING × RESPONSE — compact to fit the left column. */}
                    <View style={styles.chipsRow}>
                      <View style={styles.chipGroup}>
                        <HelpHead title="WEIGHTING" onHelp={() => help('weighting')} style={styles.chipGroupLabel} />
                        <View style={styles.chipSetWrap}>
                          {WEIGHTINGS.map((w) => (
                            <Chip key={w} label={w} compact selected={weighting === w} onPress={() => setWeighting(w)} />
                          ))}
                        </View>
                      </View>
                      <View style={styles.chipGroup}>
                        <HelpHead title="RESPONSE" onHelp={() => help('response')} style={styles.chipGroupLabel} />
                        <View style={styles.chipSetWrap}>
                          {RESPONSES.map((r) => (
                            <Chip
                              key={r}
                              label={r.toUpperCase()}
                              tint={r === 'fast' ? 'green' : 'purple'}
                              compact
                              selected={response === r}
                              onPress={() => setResponse(r)}
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    {/* PEAK HOLD (compact) + RESET. */}
                    <View style={styles.chipGroup}>
                      <HelpHead title="PEAK HOLD" onHelp={() => help('peak_hold')} style={styles.chipGroupLabel} />
                      <View style={styles.chipSetWrap}>
                        {HOLD_MODES.map((m) => (
                          <Chip
                            key={m}
                            label={holdLabel(m)}
                            accessibilityLabel={m === 'inf' ? 'Infinite peak hold' : `Peak hold ${holdLabel(m)}`}
                            bigGlyph={m === 'inf'}
                            compact
                            selected={holdMode === m}
                            onPress={() => setHoldMode(m)}
                          />
                        ))}
                        <Pressable
                          style={[styles.ctrlBtn, styles.holdResetBtnSm]}
                          onPress={resetPeakHold}
                          accessibilityRole="button"
                          accessibilityLabel="Reset peak hold"
                        >
                          <Text style={styles.ctrlTextSm}>RESET</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  {viz ? (
                    <SideLed viz={viz} live={live} ledW={ledW} ledH={leftColH} holdMode={holdMode} splOffset={splOffset} weightingLabel={weighting} />
                  ) : null}
                </View>

                {/* 4 — The round SPL gauge — COLLAPSIBLE (owner 2026-07-30) so the
                    session log + calibration can sit higher when it's minimized. */}
                <Pressable
                  style={styles.gaugeToggle}
                  onPress={() => setGaugeOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: gaugeOpen }}
                  accessibilityLabel={gaugeOpen ? 'Collapse SPL gauge' : 'Expand SPL gauge'}
                >
                  <Text style={styles.gaugeToggleText}>SPL REFERENCE GAUGE</Text>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => help('gauge')}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="About the SPL reference gauge"
                  >
                    <Text style={styles.gaugeToggleInfo}>ⓘ</Text>
                  </Pressable>
                  <Text style={styles.gaugeToggleChevron}>{gaugeOpen ? '▾' : '▸'}</Text>
                </Pressable>
                {gaugeOpen && viz ? (
                  <VuHero
                    viz={viz}
                    live={live}
                    dialW={dialW}
                    dialH={dialH}
                    splOffset={splOffset}
                    calibrated={calibrated}
                    dialMode={dialMode}
                    onDialMode={setDialMode}
                    onModeHelp={() => help('mode')}
                    centerText={dialCenterText}
                    centerColor={dialCenterColor}
                    sweetSpot={inSweetSpot}
                    onToggle={running ? stopMeter : startMeter}
                  />
                ) : null}

                {/* 7 — Mirrored session log + save (same handlers) — COMPACT in
                    the VU popup (owner 2026-07-30: smaller readout + buttons). */}
                <View style={[styles.logCard, styles.logCardSm]}>
                  <HelpHead title="SESSION LOG" onHelp={() => help('session_log')} style={styles.sectionHeadSm} />
                  <View style={styles.logRow}>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>Leq(A)</Text>
                      <Text style={styles.cellValueSm}>{meter ? fmtDb(shown(meter.leqADb)) : '—'}</Text>
                    </View>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>Leq(Z)</Text>
                      <Text style={styles.cellValueSm}>{meter ? fmtDb(shown(meter.leqZDb)) : '—'}</Text>
                    </View>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>ELAPSED</Text>
                      <Text style={styles.cellValueSm}>{meter ? fmtElapsed(meter.elapsedSec) : '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.controls}>
                    <Pressable
                      style={[styles.ctrlBtn, styles.ctrlBtnSm]}
                      onPress={resetLeq}
                      accessibilityRole="button"
                      accessibilityLabel="Reset log"
                    >
                      <Text style={styles.ctrlTextSm}>RESET LOG</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.ctrlBtn, styles.ctrlBtnSm, justSaved && styles.ctrlBtnSaved, !meter && styles.ctrlBtnDisabled]}
                      onPress={onSaveLog}
                      disabled={!meter}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !meter }}
                      accessibilityLabel="Save log"
                    >
                      <Text style={[styles.ctrlTextSm, justSaved && styles.ctrlTextSaved]}>
                        {justSaved ? 'SAVED ✓' : 'SAVE LOG'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* STOP — moved ABOVE calibration / below the session log (owner
                    2026-07-30). Turns the mic OFF but STAYS in the VU screen; the
                    same control flips to START to turn the mic back on. */}
                {running ? (
                  <GlassButton label="STOP · MIC OFF" tint="gold" onPress={stopMeter} />
                ) : (
                  <GlassButton label="START · MIC ON" tint="gold" onPress={startMeter} />
                )}

                {/* 8 — Field calibration (ruling R1) — same store as the screen, so
                    the gauge's SPL scale updates the instant it is set/cleared. */}
                <View style={styles.calCard}>
                  <View style={styles.calHeadRow}>
                    <HelpHead title="CALIBRATION" onHelp={() => help('calibration')} style={styles.sectionHead} />
                    <Text style={[styles.calStatus, offset != null && styles.calStatusOn]}>
                      {offset != null ? `FIELD-CALIBRATED · +${offset.toFixed(1)} dB` : 'UNCALIBRATED'}
                    </Text>
                  </View>
                  {!calibrating ? (
                    <View style={styles.controls}>
                      <Pressable
                        style={styles.ctrlBtn}
                        onPress={() => {
                          setDraftOffset(offset ?? 100);
                          setCalibrating(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Calibrate against a reference meter"
                      >
                        <Text style={styles.ctrlText}>{offset != null ? 'RE-CALIBRATE' : 'CALIBRATE'}</Text>
                      </Pressable>
                      {offset != null && (
                        <Pressable
                          style={styles.ctrlBtn}
                          onPress={() => setSplCalibration(null)}
                          accessibilityRole="button"
                          accessibilityLabel="Clear calibration"
                        >
                          <Text style={styles.ctrlText}>CLEAR</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <>
                      <Text style={styles.calHint}>
                        Play steady pink noise and adjust until this reading matches your reference
                        sound-level meter (same weighting and response on both).
                      </Text>
                      <Text style={styles.calDraftValue}>
                        {meter ? fmtDb(shown(selectedLevelDb(meter, weighting, response), true)) : '—'}
                        <Text style={styles.calDraftUnit}>  dB SPL (candidate)</Text>
                      </Text>
                      <View style={styles.controls}>
                        {[-5, -0.5, +0.5, +5].map((step) => (
                          <Pressable
                            key={step}
                            style={styles.ctrlBtn}
                            onPress={() => setDraftOffset((d) => Math.round((d + step) * 2) / 2)}
                            accessibilityRole="button"
                            accessibilityLabel={`Adjust ${step > 0 ? 'up' : 'down'} ${Math.abs(step)} dB`}
                          >
                            <Text style={styles.ctrlText}>{step > 0 ? `+${step}` : step}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={styles.controls}>
                        <Pressable
                          style={styles.ctrlBtn}
                          onPress={() => setCalibrating(false)}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel calibration"
                        >
                          <Text style={styles.ctrlText}>CANCEL</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.ctrlBtn, styles.ctrlBtnSaved]}
                          onPress={() => {
                            setSplCalibration(draftOffset);
                            setCalibrating(false);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Set calibration"
                        >
                          <Text style={[styles.ctrlText, styles.ctrlTextSaved]}>SET</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                  <Text style={styles.calNote}>
                    Field calibration is stored on this device only and stays approximate — it is
                    not a certified instrument calibration.
                  </Text>
                </View>

                {/* 9 — Control-room legend, now COLLAPSIBLE (owner 2026-08-05) and
                    updated to match the CURRENT gauge zones (STUDIO green 60–85 with
                    the gold 79–85 sweet-spot band; SPL/OPTIMAL green to 85, yellow
                    85–90, orange 90–96, red 96+). */}
                <CollapsibleSection title="CONTROL-ROOM MONITORING · dB SPL (C-WEIGHTED)" startOpen={false} onHelp={() => help('control_room')}>
                  <Text style={styles.roomLegendBody}>
                    In STUDIO mode the gauge stays GREEN across the whole monitoring range and lights a
                    glowing GOLD sweet-spot band at 79–85 dB(C) — the calibrated mixing level. The
                    room-size ticks sit at 79 (small rooms, under ~1,500 ft³ / 42 m³, and most critical
                    balance / music mixing), 82 (medium) and 85 (large) — the Holman / SMPTE-THX
                    references. Lower levels are common too: 70–75 for general editing and long
                    sessions, 60–65 for detailed or background work, with brief 85–95 checks for
                    impact, punch and low-frequency energy.
                  </Text>
                  <Text style={styles.roomLegendBody}>
                    In SPL / OPTIMAL mode the arc reads as a loudness scale: GREEN up to ~85, YELLOW
                    85–90, ORANGE 90–96 and RED from 96 — the point where sustained levels get into
                    hearing-risk territory. The center number turns the color of the zone it sits in
                    (averaged over ~3 s so it does not flicker at a boundary).
                  </Text>
                  <Text style={styles.roomLegendBody}>
                    Calibration uses C-weighting, not A: it is flatter and represents music's
                    low-frequency energy. A-weighting is for hearing-risk, not monitoring. These
                    targets are a reference guide, not a guarantee.
                  </Text>
                </CollapsibleSection>

                {/* VU honesty badge — moved to the BOTTOM (owner 2026-08-05). */}
                {showMeter && (
                  <Text style={styles.vuBadge}>
                    {calibrated
                      ? `VU: RELATIVE · ${rangeRef} dB at 0 → ${rangeRef - 20} dB at −20 (${rangeAuto ? 'AUTO' : 'RANGE'}). GAUGE: dB SPL · FIELD-CALIBRATED (APPROXIMATE) — the 79/82/85 dB(C) mix band is a reference, not a guarantee`
                      : `VU: RELATIVE · ${rangeRef} dB at 0 → ${rangeRef - 20} dB at −20 (${rangeAuto ? 'AUTO · ESTIMATED' : 'RANGE · ESTIMATED'} environment). GAUGE: ESTIMATED · UNCALIBRATED — SPL numbers are an estimate; calibrate against a real SPL meter for true readings`}
                  </Text>
                )}

                {/* Amber warnings at the bottom — flash 5 s + haptic, then list. */}
                <LiveWarnings flags={flags} />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Weighting / response chips.
  chipsRow: { flexDirection: 'row', gap: 10 },
  chipGroup: { flex: 1, gap: 6 },
  chipGroupLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  chipSet: { flexDirection: 'row', gap: 8 },
  // Compact chip set — wraps within the narrow left control column.
  chipSetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 10,
    alignItems: 'center',
  },
  // Smaller, non-stretching chip for the compacted left-column controls.
  chipCompact: { flex: 0, paddingVertical: 6, paddingHorizontal: 11, minWidth: 34 },
  // House accent is AMBER (owner 2026-07-30 — orange was off-system).
  chipSelected: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  chipSelGreen: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0c2012' },
  chipSelPurple: { borderColor: 'rgba(180,91,255,.7)', backgroundColor: '#1a1024' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSecondary },
  chipTextCompact: { fontSize: 11.5, letterSpacing: 0.6 },
  // Bigger glyph (the ∞ peak-hold symbol is illegible at chip size otherwise).
  chipTextGlyph: { fontSize: 19, lineHeight: 20 },
  chipTextSelected: { color: colors.amber },
  chipTextGreen: { color: colors.green },
  chipTextPurple: { color: colors.purple },

  // Big readout card.
  readoutCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  readoutEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  readoutValue: { fontFamily: fonts.mono, fontSize: 58, color: colors.textPrimary, letterSpacing: 1 },
  readoutSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber },

  // Peak row.
  peakRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  peakCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  cellLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  cellValue: { fontFamily: fonts.mono, fontSize: 20, color: colors.textPrimary },
  cellValueHot: { color: colors.red },
  cellValueMax: { color: '#e0362b' },

  // Session log card.
  logCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
    gap: 10,
  },
  // Compact session log (VU popup) — smaller padding, values, and buttons.
  logCardSm: { padding: 10, gap: 7 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8, color: colors.amberLabel },
  sectionHeadSm: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.5, color: colors.amberLabel },
  cellValueSm: { fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary },
  logRow: { flexDirection: 'row', gap: 10 },
  logCell: { flex: 1, gap: 4 },
  logNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  // Controls (house ctrl-button style).
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
  ctrlBtnSm: { paddingVertical: 8 },
  ctrlBtnSmall: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ctrlTextSaved: { color: '#5bff85' },
  ctrlTextSm: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: colors.textSecondary, textAlign: 'center' },

  // Live quality warning line (spec §6) — house amber warning style.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },
  // Warnings area at the BOTTOM (owner 2026-07-30): a new warning flashes here 5 s
  // then settles into the steady accumulated list.
  warnArea: { gap: 8 },
  warnFlash: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: 0.3,
    color: colors.amber,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.7)',
    backgroundColor: 'rgba(255,198,77,.12)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  warnList: { gap: 4 },

  // Field-calibration card (ruling R1, 2026-07-23).
  calCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
    gap: 10,
  },
  calHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  calStatus: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },
  calStatusOn: { color: '#5bff85' },
  calHint: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  calDraftValue: { fontFamily: fonts.mono, fontSize: 30, color: colors.textPrimary, textAlign: 'center' },
  calDraftUnit: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber },
  calNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },

  micLimits: { gap: 6, marginTop: 6 },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  // Mini-VU opener (header, right-aligned) + plain-RN fallback glyph.
  vuOpenBtn: { marginLeft: 'auto', alignItems: 'center', gap: 2, paddingHorizontal: 2, paddingVertical: 2 },
  vuOpenFrame: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#44454c',
    backgroundColor: '#0e0e11',
    padding: 5,
  },
  vuOpenLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.6, color: colors.textSub },
  vuGlyphFace: {
    width: 38,
    height: 30,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1b1c22',
    backgroundColor: '#f0e0b4',
    overflow: 'hidden',
  },
  vuGlyphArc: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 6,
    height: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 2,
    borderColor: '#2b2317',
  },
  vuGlyphRed: { position: 'absolute', right: 5, top: 4, width: 8, height: 4, backgroundColor: '#c9382e', transform: [{ rotate: '24deg' }] },
  vuGlyphNeedle: {
    position: 'absolute',
    left: 16,
    bottom: 2,
    width: 2,
    height: 20,
    backgroundColor: '#17130c',
    transform: [{ rotate: '14deg' }],
  },

  // Full-screen VU popup.
  vuModalRoot: { flex: 1, backgroundColor: '#0c0c0f' },
  vuModalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  vuModalTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.textPrimary },
  vuClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSecondary, padding: 4 },
  vuScroll: { padding: 16, paddingBottom: 40, gap: 14, alignItems: 'stretch' },
  // Below-the-VU row: round SPL gauge (left) + thin LED meter (right).
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', justifyContent: 'center' },
  // Top area: LEFT control column + tall LED down the right.
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  topLeftCol: { gap: 12 },
  holdResetBtn: { flex: 0, paddingHorizontal: 16, justifyContent: 'center' },
  holdResetBtnSm: { flex: 0, paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center' },

  // RANGE selector — stepped values in a single horizontal scroll row. BLUE
  // (owner 2026-07-30) to tie them to the blue −20/0 bracket on the VU face:
  // the selected value IS the number shown at 0 VU.
  rangeScroll: { flexDirection: 'row', gap: 4, paddingRight: 2 },
  rangeChip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2f5fbf',
    backgroundColor: '#101a2e',
    paddingVertical: 7,
    width: 37,
    alignItems: 'center',
  },
  rangeChipText: { fontFamily: fonts.mono, fontSize: 12, color: '#7fa8ff' },
  rangeChipSelected: { borderColor: '#5d97ff', backgroundColor: '#20407e' },
  // AUTO landed on this value (owner 2026-07-30): a LIGHT "lit up" hint — a faint
  // light-blue fill + BRIGHTER text (not a darker container).
  rangeChipAutoHint: { borderColor: 'rgba(157,188,255,.5)', backgroundColor: 'rgba(157,188,255,.14)' },
  rangeChipTextAutoHint: { color: '#dfe9ff' },
  rangeChipTextSelected: { color: '#e4edff' },
  rangeChipAuto: { width: 46 },
  rangeNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted },

  // Collapsible SPL-gauge toggle bar.
  gaugeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b2b31',
    backgroundColor: '#141416',
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  gaugeToggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSecondary },
  gaugeToggleChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSub, marginLeft: 10 },
  gaugeToggleInfo: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amberLabel },

  // STUDIO / SPL chooser — pinned to the TOP-LEFT corner of the circle meter.
  dialModeCorner: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', gap: 6, zIndex: 2 },
  dialModeChip: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dialModeChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },

  // Control-room legend under the gauge.
  roomLegend: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
    gap: 8,
  },
  roomLegendHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.amberLabel },
  roomLegendBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  vuBadge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9,
    letterSpacing: 1,
    lineHeight: 14,
    color: '#c2c6ce',
  },
  vuUnavailCard: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
  },
  vuUnavailTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.textSecondary },
  vuUnavailBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
});
