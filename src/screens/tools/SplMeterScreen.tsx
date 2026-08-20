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
 *  - LEVEL readouts show ESTIMATED dB SPL / dBA / dBC (owner 2026-08-12: an SPL
 *    meter must read positive dB SPL, not negative dBFS). Estimate = dBFS + the
 *    field-calibration offset, or a nominal 0 dBFS ≈ 100 dB SPL when
 *    uncalibrated — always labeled "field-calibrated (approximate)" or
 *    "uncalibrated estimate", never a certified/IEC reading, and floored at 0 so
 *    silence never shows a negative SPL. Saved records store the SAME estimated
 *    dB SPL, flagged uncalibrated with the offset recorded (owner ruling
 *    2026-08-12: SPL is what pro users expect — supersedes ruling R1's
 *    dBFS-when-uncalibrated behaviour; log to governance). dBFS is reserved for
 *    genuine digital readings, not SPL readouts.
 *  - Peak may legitimately exceed 0 dBFS (finding F1) — the clip cue is the
 *    colour (red as the RAW peak nears/exceeds 0 dBFS), independent of the SPL
 *    estimate,
 *    never clamped.
 *  - Capture starts only on the explicit START press; the hook stops capture
 *    on unmount (§18: no DSP behind a closed screen).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { GlassButton } from '../../components/GlassButton';
import { lockLandscape, lockPortrait, unlockOrientation } from '../../lib/screenOrientationSafe';
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
import { SkinnedVu } from './SkinnedVu';
import { Spl3dGauge } from './Spl3dGauge';
import { levelColorForDb } from '../../features/tools/levelColor';
import { useLowLight, LOW_LIGHT_DIM } from '../../features/settings/lowLight';
import { MIC_LIMITS, toolByKey } from './toolsData';
import { ApeDsp, type MeterFrame } from '../../../modules/ape-dsp';
import { useToolHelp, HelpHead, DisplayGuideButton } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SplMeter'>;

type Weighting = SplLogPayload['weighting']; // 'A' | 'C' | 'Z'
type MeterResponse = SplLogPayload['response']; // 'fast' | 'slow'

const WEIGHTINGS: Weighting[] = ['A', 'C', 'Z'];

// Meter time-response (owner 2026-08-17): FAST/SLOW come straight from the
// engine frame; '5 SEC AVG' is a client-side rolling 5-second energy average
// (power-domain, honest) of the selected weighting's fast level.
type ResponseMode = 'fast' | 'slow' | 'avg5';
const RESPONSES: ResponseMode[] = ['fast', 'slow', 'avg5'];
const responseLabel = (r: ResponseMode) => (r === 'fast' ? 'FAST' : r === 'slow' ? 'SLOW' : '5 SEC AVG');
/** 5 SEC AVG: a TRUE 5-second window (samples kept by timestamp, not count) so
 *  the average is honest regardless of frame timing; the number it shows only
 *  refreshes every 2 s (owner 2026-08-17). */
const AVG5_WINDOW_MS = 5000;
const AVG5_REFRESH_MS = 2000;

/** The selected weighting × response reading from a real meter frame. */
function selectedLevelDb(m: MeterFrame, w: Weighting, r: MeterResponse): number {
  if (w === 'A') return r === 'fast' ? m.aFastDb : m.aSlowDb;
  if (w === 'C') return r === 'fast' ? m.cFastDb : m.cSlowDb;
  return r === 'fast' ? m.zFastDb : m.zSlowDb;
}

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
  dialW,
  level,
  calibrated,
  dialMode,
  onDialMode,
  onModeHelp,
  centerText,
  centerColor,
  onOpenFullscreen,
}: {
  dialW: number;
  /** Smoothed estimated dB SPL driving the segment fill; null = meter off. */
  level: number | null;
  calibrated: boolean;
  dialMode: DialMode;
  onDialMode: (m: DialMode) => void;
  onModeHelp: () => void;
  centerText: string;
  centerColor?: string;
  /** Tap the gauge (not the mode chips) to open the fullscreen landscape gauge. */
  onOpenFullscreen?: () => void;
}) {
  return (
    // SPL gauge — the isometric 3D segmented ring. The STUDIO/SPL/OPTIMAL chooser
    // is its own row above the gauge. Tapping the gauge opens the fullscreen
    // (landscape) view (owner 2026-08-19).
    <View style={{ width: dialW, alignSelf: 'center' }}>
      <View style={styles.dialModeRow}>
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
      <Pressable onPress={onOpenFullscreen} accessibilityRole={onOpenFullscreen ? 'button' : undefined} accessibilityLabel="Open the fullscreen SPL gauge">
        <Spl3dGauge
          width={dialW}
          mode={dialMode}
          level={level}
          calibrated={calibrated}
          centerText={centerText}
          centerColor={centerColor}
        />
      </Pressable>
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
const holdLabel = (m: PeakHoldMode) =>
  m === 'off' ? 'OFF'
  : m === 'inf' ? '∞'
  : m.endsWith('m') ? `${m.slice(0, -1)} MIN`
  : m.endsWith('h') ? `${m.slice(0, -1)} HR`
  : m; // seconds stay as-is ('1s', '30s', …)

/** Peak-hold DURATION options for the popup (owner 2026-08-18): OFF + 1 s … 1 h. */
const HOLD_POPUP_MODES: PeakHoldMode[] = [
  'off', '1s', '2s', '3s', '5s', '10s', '20s', '30s', '1m', '5m', '10m', '30m', '1h',
];

/** One selectable option inside a bottom-bar setting popup (owner 2026-08-18). */
function PopupOpt({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.popupOpt, selected && styles.popupOptSel]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.popupOptText, selected && styles.popupOptTextSel]}>{label}</Text>
    </Pressable>
  );
}

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

// ── Fullscreen readout brightness / red mode (owner 2026-08-17) ──────────────
// A popup-LOCAL control: dims the ENTIRE fullscreen readout as the slider moves
// left, and at the far-left position enters a night-vision RED mode like the
// Profile low-light look. The overlays live INSIDE the fullscreen modal, so
// closing it leaves every other screen untouched. The setting is persisted, so
// the popup reopens exactly where the user left it.
const FS_BRIGHT_KEY = 'ape:splFsBright';
const FS_RED_KEY = 'ape:splFsRed';
const FS_MAX_DIM = 0.72; // black wash at the darkest (non-red) setting
const FS_RED_AT = 0.06; // brightness ≤ this → LATCH red mode (far left)
const FS_RED_EXIT = 0.22; // brightness ≥ this → leave red mode (hysteresis, so it "stays")
// Night-vision RED via a MULTIPLY blend (owner 2026-08-18: an alpha wash either
// merged into the dim when faint, or reddened the BLACK when strong). Multiply
// keeps black BLACK (black × red = black) and turns only the lit readouts a
// submarine red — like the app's low-light mode, but properly hue-preserving.
// The black dim sets the LOW brightness; the multiply sets the red. Opaque red
// (the fade is the view's animated opacity).
const FS_RED_DIM = 0.5;
const FS_RED_WASH = 'rgb(235,30,25)';
const FS_THUMB = 30; // bigger thumb = easier to grab (owner 2026-08-17/18)

/** Discreet, light-gray brightness line (0 = darkest/red, 1 = full bright).
 *  ANCHORED drag (relative to the grab point) — grabbing never snaps the thumb
 *  and pushing past an end just holds it there; the thumb tracks on LOCAL state
 *  for smoothness, while onLive updates the dim imperatively (owner 2026-08-17).
 *  onCommit fires on release; onInteract keeps the auto-hide timer alive. */
function BrightnessSlider({
  value,
  onLive,
  onCommit,
  onInteract,
}: {
  value: number;
  onLive: (v: number) => void;
  onCommit: (v: number) => void;
  onInteract: () => void;
}) {
  const [w, setW] = useState(0);
  const [pos, setPos] = useState(value);
  const posRef = useRef(value);
  const draggingRef = useRef(false);
  const anchorX = useRef(0);
  const anchorPos = useRef(value);
  // Sync the thumb to committed value only when NOT dragging (never fight a drag).
  useEffect(() => {
    if (!draggingRef.current) {
      posRef.current = value;
      setPos(value);
    }
  }, [value]);
  const usable = Math.max(1, w - FS_THUMB);
  const thumbLeft = pos * usable;
  return (
    <View
      style={styles.brightTrack}
      hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        draggingRef.current = true;
        anchorX.current = e.nativeEvent.locationX;
        anchorPos.current = posRef.current;
        onInteract();
      }}
      onResponderMove={(e) => {
        const dv = (e.nativeEvent.locationX - anchorX.current) / usable;
        const np = Math.max(0, Math.min(1, anchorPos.current + dv));
        posRef.current = np;
        setPos(np);
        onLive(np);
        onInteract();
      }}
      onResponderRelease={() => {
        draggingRef.current = false;
        onCommit(posRef.current);
        onInteract();
      }}
      onResponderTerminate={() => {
        draggingRef.current = false;
        onCommit(posRef.current);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Screen brightness — slide left to dim, far left for red night mode"
    >
      <View style={styles.brightBase} />
      <View style={[styles.brightThumb, { left: thumbLeft }]} />
    </View>
  );
}

export function SplMeterScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('spl');
  const insets = useSafeAreaInsets();
  // Camera/notch housing size for the LANDSCAPE fullscreens (owner rev 24: the
  // gauge's left chips sat under the iPhone lens). We can't trust insets.left in
  // the programmatically-locked landscape overlay (it often stays at its stale
  // portrait 0, with the sensor-housing dimension only in insets.top), so take
  // the MAX across edges and inset both sides — clears the lens in either
  // landscape orientation. ~0 extra on notchless phones.
  const camInset = Math.max(insets.left, insets.right, insets.top);
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
  useToolAutoStart(state, startMeter, stop);

  const [weighting, setWeighting] = useState<Weighting>('A');
  const [response, setResponse] = useState<ResponseMode>('fast');
  // dBFS readout mode (owner 2026-08-17): show the RAW digital level (no SPL
  // offset) alongside the weighted dB SPL options. Uses the flat (Z) level.
  const [dbfs, setDbfs] = useState(false);
  // Fullscreen big-readout view (owner 2026-08-17): the number alone, with
  // PEAK / PEAK HOLD in the top corners + a popup-local brightness/red slider.
  const [readoutFsOpen, setReadoutFsOpen] = useState(false);
  // Global Low-Light (Profile) — when ON it LOCKS the popup in red and hides the
  // local dimmer; turning Low-Light off restores the dimmer (owner 2026-08-17).
  const lowLightOn = useLowLight();
  // Popup-local brightness (1 = full bright, 0 = darkest + red mode). Persisted
  // so the fullscreen view reopens at the user's last setting; NEVER applied to
  // any other screen (the overlays live inside the fullscreen modal only).
  const [fsBright, setFsBright] = useState(1);
  // Red night-mode LATCHES once activated at the far-left (owner 2026-08-17):
  // once on it stays on until the user deliberately brightens past the exit
  // point — small movements never drop it. Persisted with the dim level.
  const [fsRedLatched, setFsRedLatched] = useState(false);
  // The dimmer line + thumb are HIDDEN by default (a rare option): only a small
  // discreet sun icon shows; pressing it reveals the slider (owner 2026-08-17).
  const [fsDimmerOpen, setFsDimmerOpen] = useState(false);
  const fsRedLatchedRef = useRef(false);
  fsRedLatchedRef.current = fsRedLatched;
  // Live dim/red run through Animated values (NOT React state) while the slider
  // drags, so the heavy screen never re-renders per move — that removes the drag
  // lag/jump (owner 2026-08-17). Committed state re-syncs them between drags.
  const fsDimAnim = useRef(new Animated.Value(0)).current;
  const fsRedAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    AsyncStorage.multiGet([FS_BRIGHT_KEY, FS_RED_KEY])
      .then((pairs) => {
        const map = Object.fromEntries(pairs) as Record<string, string | null>;
        const n = map[FS_BRIGHT_KEY] != null ? parseFloat(map[FS_BRIGHT_KEY] as string) : NaN;
        if (Number.isFinite(n)) setFsBright(Math.max(0, Math.min(1, n)));
        if (map[FS_RED_KEY] === '1') setFsRedLatched(true);
      })
      .catch(() => {});
  }, []);
  const fsDimOpacity = (1 - fsBright) * FS_MAX_DIM;
  // Global Low-Light overrides the local dimmer: locked dim + red, no controls.
  const fsEffRed = lowLightOn ? true : fsRedLatched;
  const fsBaseDim = lowLightOn ? LOW_LIGHT_DIM : fsDimOpacity;
  const fsTargetDim = fsEffRed ? FS_RED_DIM : fsBaseDim;
  const fsDimmerAvailable = !lowLightOn;
  // Hold the Animated overlays at the committed look between drags.
  useEffect(() => {
    fsDimAnim.setValue(fsTargetDim);
    fsRedAnim.setValue(fsEffRed ? 1 : 0);
  }, [fsTargetDim, fsEffRed, fsDimAnim, fsRedAnim]);
  // Live drag → update the overlays imperatively; red shows the instant the
  // thumb reaches the far-left so the mode is DISTINCT, not a merge.
  const onDimLive = useCallback(
    (p: number) => {
      const red = p <= FS_RED_AT;
      fsRedAnim.setValue(red ? 1 : 0);
      fsDimAnim.setValue(red ? FS_RED_DIM : (1 - p) * FS_MAX_DIM);
    },
    [fsDimAnim, fsRedAnim],
  );
  // Release → commit level + latch red (hysteresis so it STAYS) + persist.
  const onDimCommit = useCallback((p: number) => {
    setFsBright(p);
    const red = p <= FS_RED_AT ? true : p >= FS_RED_EXIT ? false : fsRedLatchedRef.current;
    setFsRedLatched(red);
    void AsyncStorage.multiSet([[FS_BRIGHT_KEY, String(p)], [FS_RED_KEY, red ? '1' : '0']]);
  }, []);
  // Auto-hide the slider after 13 s of no screen interaction (owner 2026-08-17).
  const dimmerHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armDimmerHide = useCallback(() => {
    if (dimmerHideTimer.current) clearTimeout(dimmerHideTimer.current);
    dimmerHideTimer.current = setTimeout(() => setFsDimmerOpen(false), 13000);
  }, []);
  useEffect(() => {
    if (readoutFsOpen && fsDimmerOpen) armDimmerHide();
    else if (dimmerHideTimer.current) {
      clearTimeout(dimmerHideTimer.current);
      dimmerHideTimer.current = null;
    }
    return () => {
      if (dimmerHideTimer.current) clearTimeout(dimmerHideTimer.current);
    };
  }, [readoutFsOpen, fsDimmerOpen, armDimmerHide]);
  // Each fullscreen open starts with the dimmer hidden (just the sun icon).
  useEffect(() => {
    if (!readoutFsOpen) setFsDimmerOpen(false);
  }, [readoutFsOpen]);
  // Allow REAL device rotation while the fullscreen readout is open (owner
  // 2026-08-17: no manual button); re-lock portrait on close. Both go through
  // screenOrientationSafe, which require()s the native module inside try/catch
  // and no-ops when it's absent — so a dev client that predates the module can't
  // crash here (a dynamic import().catch() did NOT reliably catch the synchronous
  // module-eval throw — owner 2026-08-18).
  useEffect(() => {
    if (readoutFsOpen) unlockOrientation();
    return () => {
      lockPortrait();
    };
  }, [readoutFsOpen]);
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
  // LEVEL readouts read positive dB SPL (owner 2026-08-12): a real SPL meter
  // shows dB SPL / dBA / dBC, not negative dBFS. Weighted unit + honest
  // calibration state; uncalibrated is an approximate ESTIMATE, never certified.
  const splUnit = weighting === 'C' ? 'dBC' : weighting === 'A' ? 'dBA' : 'dB SPL';
  const unitLabel = `${splUnit} · ${offset != null ? 'field-calibrated (approximate)' : 'uncalibrated estimate'}`;
  /** Estimated dB SPL shown to the user AND stored in saved records (owner
   *  2026-08-12): dBFS + the field offset, or the nominal estimate when
   *  uncalibrated; floored at 0 so it never reads negative. dBFS is reserved for
   *  genuine digital readings, not SPL-meter readouts. */
  const shown = (rawDb: number, withDraft = false) =>
    Math.max(0, rawDb + (withDraft ? draftOffset : (offset ?? NOMINAL_OFFSET)));

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
  // VU is the tool's HOME (owner 2026-08-18): it shows on entry; the digital
  // readout sits behind it (reachable via the header "VU" button ⇄ the home's
  // "DIGITAL READOUT" nav). vuFsOpen is the landscape-only full VU screen.
  // De-modalized home/digital switch (Phase 1, 2026-08-19): the tool's HOME (the
  // VU) and the digital readout are ordinary in-tree views now — only one renders
  // at a time. 'home' is the entry (was the always-open `vuOpen` native Modal).
  const [view, setView] = useState<'home' | 'digital'>('home');
  const [vuFsOpen, setVuFsOpen] = useState(false);
  // Fullscreen SPL reference gauge — landscape-only, same as Full VU (owner
  // 2026-08-19). Tapping the gauge opens it; both fullscreens force landscape so
  // the phone never has to be flipped.
  const [gaugeFsOpen, setGaugeFsOpen] = useState(false);
  // Full VU: hide/show the right-side LED level meter (owner 2026-08-18). When
  // hidden the VU simply centers in the freed space (no zoom — owner).
  const [vuFsLedHidden, setVuFsLedHidden] = useState(false);
  // Which setting popup is open from the VU home's bottom control bar (owner
  // 2026-08-18): Range · Weighting · Response · Peak Hold.
  const [settingPopup, setSettingPopup] = useState<null | 'range' | 'unit' | 'response' | 'hold'>(null);
  // Both fullscreens are LANDSCAPE-ONLY (owner 2026-08-19): force landscape on
  // open so the phone never needs flipping, and re-lock PORTRAIT the instant
  // both are closed so the portrait-only home never lingers sideways.
  useEffect(() => {
    if (vuFsOpen || gaugeFsOpen) lockLandscape();
    else lockPortrait();
  }, [vuFsOpen, gaugeFsOpen]);
  // Declarative orientation (Phase 2, 2026-08-19): react-native-screens OWNS
  // orientation on this native stack and IGNORES expo-screen-orientation, so we
  // drive the per-screen option directly: free-rotate ('all') while Full VU OR
  // the fullscreen readout is open (owner: BOTH free-rotate), portrait otherwise.
  // The imperative screenOrientationSafe calls (above, and the readout effect
  // near line 683) are KEPT as a harmless fallback until this is confirmed
  // driving rotation on-device with a fresh build; only then are they removed.
  useEffect(() => {
    // Full VU + Full Gauge = LANDSCAPE-ONLY; the fullscreen readout still free-
    // rotates. Portrait everywhere else.
    const orientation = vuFsOpen || gaugeFsOpen ? 'landscape' : readoutFsOpen ? 'all' : 'portrait';
    navigation.setOptions({ orientation });
  }, [vuFsOpen, gaugeFsOpen, readoutFsOpen, navigation]);
  // Hardware BACK (Phase 1, 2026-08-19): the removed Modals handled Android back
  // for free — replicate the same priority now that everything is in-tree. Close
  // the settings popup, then Full VU, then the fullscreen readout, then fall the
  // digital view back to home; only when nothing is open does the default back
  // (leave the screen) proceed.
  useEffect(() => {
    const onBack = () => {
      if (settingPopup != null) { setSettingPopup(null); return true; }
      if (gaugeFsOpen) { setGaugeFsOpen(false); return true; }
      if (vuFsOpen) { setVuFsOpen(false); return true; }
      if (readoutFsOpen) { setReadoutFsOpen(false); return true; }
      if (view === 'digital') { setView('home'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [settingPopup, gaugeFsOpen, vuFsOpen, readoutFsOpen, view]);
  // User setting for the LED meter's peak-hold cap linger (owner 2026-07-30).
  const [holdMode, setHoldMode] = useState<PeakHoldMode>('1s');
  // RANGE (owner 2026-07-30): the environmental SPL that reads 0 VU. The wide VU
  // at the top shows the signal RELATIVE to this (current SPL − RANGE).
  const [rangeDb, setRangeDb] = useState(60);
  // AUTO range (owner 2026-07-30): when on, the 0-VU reference tracks a slow EMA
  // of the measured SPL so the needle stays on-scale and visibly swinging around
  // centre. Manual chips turn it off. autoRangeDb is the rounded auto reference.
  // Default to a FIXED range (owner 2026-08-18): AUTO kept re-referencing the
  // 0-VU point in 5 dB steps, so the needle re-centered instead of SWINGING like
  // a real VU. Fixed (rangeDb, 60 dB @ 0 VU) lets it swing; AUTO stays available
  // in the Range popup.
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
  const { width: winW, height: winH } = useWindowDimensions();
  // Fullscreen number size — scales with the CURRENT (real) orientation's
  // dimensions, so rotating the phone to landscape enlarges it (owner 2026-08-17).
  const fsNumSize = Math.round(Math.min(winW * 0.26, winH * 0.6));
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
  // labels sit OUTSIDE the ring with leader lines (3D gauge sizes itself).
  const dialW = winW - 32;
  // Fullscreen (landscape) gauge width — centred with padding: fills the long
  // side but leaves room, and (given the 2:1 aspect) keeps the chips row + margin
  // within the short side. Sized off the SHORT side minus the chips band.
  const fsLong = Math.max(winW, winH);
  const fsShort = Math.min(winW, winH);
  // Chips now sit in a LEFT column (owner rev 20), so the gauge uses the full
  // short side (minus a small margin) and leaves the long side for the chips.
  const gaugeFsW = Math.round(Math.min(fsLong - 150, (fsShort - 28) * 1.9));
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
  // Rolling 5-second average (owner 2026-08-17): the selected weighting's FAST
  // level, energy-averaged over a TRUE 5 s window (samples kept by timestamp) in
  // the POWER domain (never a dB average). The ring is fed continuously, but the
  // DISPLAYED value (avg5Db + the needle's avg5Ref) only refreshes every 2 s.
  // Cleared on weighting change / start / stop.
  const avg5RingRef = useRef<{ t: number; p: number }[]>([]);
  const avg5Ref = useRef(NaN);
  const lastAvg5PushRef = useRef(0);
  const [avg5Db, setAvg5Db] = useState<number>(NaN);
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
    const w = weightingRef.current;
    const r = responseRef.current;
    // 5 SEC AVG reads the rolling ring; FAST/SLOW read the frame.
    const lvl = r === 'avg5' ? avg5Ref.current : selectedLevelDb(m, w, r);
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
      // Feed the true 5 s ring with the current weighting's FAST power; drop
      // samples older than the window. The displayed average refreshes only
      // every 2 s (owner 2026-08-17) — no faster.
      const wf = w === 'A' ? m.aFastDb : w === 'C' ? m.cFastDb : m.zFastDb;
      if (Number.isFinite(wf)) {
        const ring = avg5RingRef.current;
        ring.push({ t: now, p: Math.pow(10, wf / 10) });
        const cutoff = now - AVG5_WINDOW_MS;
        while (ring.length && ring[0].t < cutoff) ring.shift();
        if (now - lastAvg5PushRef.current >= AVG5_REFRESH_MS && ring.length) {
          lastAvg5PushRef.current = now;
          const mean = ring.reduce((s, e) => s + e.p, 0) / ring.length;
          const db = mean > 0 ? 10 * Math.log10(mean) : NaN;
          avg5Ref.current = db;
          setAvg5Db(db);
        }
      }
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
      avg5RingRef.current = [];
      avg5Ref.current = NaN;
      lastAvg5PushRef.current = 0;
      setAvg5Db(NaN);
    }
  }, [running, liveRmsDb, livePeakDb]);
  // A weighting change restarts the 5 s window — the old ring holds the other
  // weighting's powers, which would otherwise contaminate the average.
  useEffect(() => {
    avg5RingRef.current = [];
    avg5Ref.current = NaN;
    lastAvg5PushRef.current = 0;
    setAvg5Db(NaN);
  }, [weighting]);

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
  // estSpl converts a dBFS reading to the ESTIMATED dB SPL (level + splOffset),
  // floored at 0 (owner 2026-08-12) — used by the circle gauge and readouts.
  const estSpl = (dbfs: number) => (Number.isFinite(dbfs) ? Math.max(0, dbfs + splOffset).toFixed(1) : '—');
  // The reading for the CURRENT response (owner 2026-08-17): FAST/SLOW from the
  // frame, or the rolling 5-second average — so the big number, VU and dial all
  // agree with the selected response.
  const levelNow = (m: MeterFrame | null): number | null => {
    if (!m) return null;
    if (response === 'avg5') return Number.isFinite(avg5Db) ? avg5Db : null;
    return selectedLevelDb(m, weighting, response);
  };
  // Live SPL number for the CENTER of the circle gauge — the ESTIMATED dB SPL
  // (level + splOffset) so it matches the node's position on the dial's scale —
  // plus its zone colour so the number turns the colour of the arc zone it's in.
  const dialSpl = (() => {
    const lv = levelNow(meter);
    return lv == null ? null : Math.round(lv + splOffset);
  })();
  // COLOR from the 3-second average (owner 2026-08-05) — the number is live but
  // its zone color is smoothed so it doesn't flash at a threshold.
  const colorSpl = zoneSpl ?? dialSpl;
  const dialCenterColor = colorSpl != null ? splZoneColor(colorSpl, dialMode) : undefined;
  // The 3 REFERENCE GAUGES ALWAYS read the 5-SECOND AVERAGE (owner 2026-08-19),
  // independent of the RESPONSE toggle — a reference gauge shows a stable
  // averaged level, not the live FAST/SLOW value. `avg5Db` is the rolling 5 s
  // mean (refreshes every 2 s); + splOffset makes it an estimated dB SPL. This
  // drives BOTH the segment fill/zone AND the centre number so they agree.
  const gaugeSpl = Number.isFinite(avg5Db) ? Math.round(avg5Db + splOffset) : null;
  const gaugeText = gaugeSpl != null ? `${gaugeSpl}` : '—';
  // Control-room sweet spot (owner 2026-07-30): in STUDIO mode only, a live level
  // in the 79–85 dB monitoring band lights the glowing gold frame around the
  // gauge (matches the dial's gold sweet-spot band). Never in SPL/OPTIMAL.
  // (Sweet-spot detection now lives visually in the 3D gauge's gold segments.)

  // ── Big # readout (owner 2026-08-17) ───────────────────────────────────────
  // Response toggle on the LEFT (FAST/SLOW/5 SEC AVG), unit toggle on the RIGHT
  // (dBFS raw + the three weighted SPL units), a fullscreen icon, PEAK/PEAK HOLD
  // moved ABOVE. dBFS shows the true digital level with NO SPL offset.
  const readoutLevel = levelNow(meter); // weighted dB, pre-offset, or null
  const fmtRaw = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
  const bigText =
    readoutLevel == null
      ? '—'
      : dbfs
        ? fmtRaw(readoutLevel) // raw dBFS (flat/Z), may be negative
        : Math.max(0, readoutLevel + splOffset).toFixed(1); // SPL estimate, floored at 0
  // De-duplicated readout text (owner 2026-08-17): the unit + response already
  // show in the toggles, so the inline card shows only the HONESTY line. The
  // fullscreen view (no toggles) adds an IDENTITY line so you still know what
  // you're reading — the two lines never repeat each other.
  const readoutIdentity = `${dbfs ? 'dBFS' : splUnit} · ${responseLabel(response)}`;
  const readoutHonesty = dbfs
    ? 'raw digital level · uncalibrated'
    : offset != null
      ? 'field-calibrated · approximate'
      : 'uncalibrated estimate';
  const activeUnit = dbfs ? 'dBFS' : weighting === 'A' ? 'dBA' : weighting === 'C' ? 'dBC' : 'dB SPL';
  // Full VU settings items — RANGE · WEIGHTING · RESPONSE · PEAK HOLD, each
  // opening the shared chooser popup. Rendered as a LEFT COLUMN in landscape
  // and a bottom bar in portrait (owner 2026-08-19).
  const fsCtrlItems = [
    { key: 'range' as const, label: 'RANGE', value: rangeAuto ? 'AUTO' : `${rangeDb}` },
    { key: 'unit' as const, label: 'WEIGHTING', value: activeUnit === 'dB SPL' ? 'SPL' : activeUnit === 'dBFS' ? 'FS' : activeUnit === 'dBA' ? 'A' : 'C' },
    { key: 'response' as const, label: 'RESPONSE', value: responseLabel(response) },
    { key: 'hold' as const, label: 'PEAK HOLD', value: holdLabel(holdMode) },
  ];
  // Session-log Leq follows the SELECTED dB unit (owner 2026-08-18): one column,
  // labeled + valued in the active unit. A→Leq(A); Z/C→Leq(Z) (C's documented
  // honest fallback); FS shows the raw dBFS Leq (no SPL estimate).
  const logLeqLabel = `Leq · ${activeUnit}`;
  const logLeqValue = !meter
    ? '—'
    : dbfs
      ? meter.leqZDb.toFixed(1)
      : weighting === 'A'
        ? estSpl(meter.leqADb)
        : estSpl(meter.leqZDb);
  // Session log order (owner 2026-08-18): ALWAYS dBA first (LAeq — what a
  // dosimeter officially measures), then the user's SELECTED unit, then elapsed.
  // dBA and the selected column read the same when dBA is the selection.
  const logDbaValue = meter ? estSpl(meter.leqADb) : '—';
  const UNIT_OPTS: { key: string; select: () => void }[] = [
    { key: 'dBFS', select: () => { setDbfs(true); setWeighting('Z'); } },
    { key: 'dBA', select: () => { setDbfs(false); setWeighting('A'); } },
    { key: 'dBC', select: () => { setDbfs(false); setWeighting('C'); } },
    { key: 'dB SPL', select: () => { setDbfs(false); setWeighting('Z'); } },
  ];
  // Calibration candidate reading — shared by the screen + VU-popup panels.
  const calDraftText = (() => {
    const lv = levelNow(meter);
    return lv == null ? '—' : Math.max(0, lv + draftOffset).toFixed(1);
  })();
  // Left (response) + right (unit) toggles — shared by the inline readout and
  // the fullscreen view. Functions so each render site gets its own instances.
  const renderResponseToggle = () => (
    <View style={styles.sideToggle}>
      {RESPONSES.map((r) => (
        <Pressable
          key={r}
          onPress={() => setResponse(r)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ selected: response === r }}
          accessibilityLabel={`${responseLabel(r)} response`}
        >
          <Text style={[styles.sideOpt, response === r && styles.sideOptActive]}>{responseLabel(r)}</Text>
        </Pressable>
      ))}
    </View>
  );
  const renderUnitToggle = () => (
    <View style={styles.sideToggle}>
      {UNIT_OPTS.map((u) => (
        <Pressable
          key={u.key}
          onPress={u.select}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityState={{ selected: activeUnit === u.key }}
          accessibilityLabel={u.key === 'dBFS' ? 'dBFS — raw digital level, uncalibrated' : `${u.key} weighted level`}
        >
          <Text style={[styles.sideOpt, activeUnit === u.key && styles.sideOptActive]}>{u.key}</Text>
        </Pressable>
      ))}
    </View>
  );

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
    // Values are stored AS DISPLAYED (owner 2026-08-12): estimated dB SPL always,
    // with calibration_status + the offset recorded so an uncalibrated record is
    // clearly an approximate estimate (compare mode warns on calibrated-vs-
    // uncalibrated pairs).
    const avgDb = shown(weighting === 'A' ? m.leqADb : m.leqZDb);
    const unit = weighting === 'C' ? 'dBC' : weighting === 'A' ? 'dBA' : 'dB SPL';
    // The saved payload's response is fast|slow only; 5 SEC AVG (a display-time
    // integration) records as SLOW, its closest logged sibling.
    const saveResponse: MeterResponse = response === 'fast' ? 'fast' : 'slow';
    const payload: SplLogPayload = {
      kind: 'spl_log',
      weighting,
      response: saveResponse,
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
      title: `SPL Log — Leq(${weighting === 'A' ? 'A' : 'Z'}) ${avgDb.toFixed(1)} ${unit} · ${fmtElapsed(m.elapsedSec)}`,
      notes: '',
      input_device: 'phone microphone',
      calibration_status: offset != null ? 'calibrated' : 'uncalibrated',
      sample_rate: null, // info polling is out of scope for this screen
      measurement_settings:
        offset != null
          ? { weighting, response: saveResponse, cal_offset_db: offset, cal_set_at: cal?.setAt ?? null }
          : { weighting, response: saveResponse, cal_offset_db: NOMINAL_OFFSET, cal_set_at: null },
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
    <View style={styles.root}>
      {view === 'digital' ? (
      <View style={{ flex: 1, paddingTop: insets.top + 10 }}>
      <View style={styles.header}>
        {/* Back from the digital readout returns to the SPL Meter HOME (the
            meter's own menu), NOT out to the tool intro — owner 2026-08-19.
            Mirrors the hardware-back handler. */}
        <Pressable onPress={() => setView('home')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to SPL Meter home">
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
          onPress={() => setView('home')}
          accessibilityRole="button"
          accessibilityLabel="Open full-screen VU meter"
        >
          <View style={styles.vuOpenFrame}>
            {viz ? <viz.VuGlyph size={58} /> : <VuGlyphFallback />}
          </View>
          <Text style={styles.vuOpenLabel}>VU HOME</Text>
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
            {/* WHAT THE DISPLAY SHOWS — moved ABOVE the peak/# readouts (owner
                2026-08-17). */}
            <DisplayGuideButton onPress={helpAll} />

            {/* PEAK · PEAK HOLD · FULLSCREEN (owner 2026-08-17): peak readouts on
                top; the ⛶ fullscreen button is a standalone control to the RIGHT
                of PEAK HOLD. Peak may exceed 0 dBFS (F1) — the COLOUR flags
                digital clipping, independent of the SPL estimate. */}
            <View style={styles.peakRow}>
              <Pressable style={styles.peakCell} onLongPress={() => help('peak')} delayLongPress={260}>
                <Text style={styles.cellLabel}>PEAK</Text>
                <Text style={[styles.cellValue, meter ? { color: levelColorForDb(meter.peakDb) } : styles.cellValueMax]}>
                  {meter ? estSpl(meter.peakDb) : '—'}
                </Text>
              </Pressable>
              {/* Tap the PEAK HOLD readout itself to reset. Long-press = help. */}
              <Pressable
                style={styles.peakCell}
                onPress={resetPeakHold}
                onLongPress={() => help('peak_hold')}
                delayLongPress={260}
                accessibilityRole="button"
                accessibilityLabel="Peak hold — tap to reset"
              >
                <Text style={styles.cellLabel}>PEAK HOLD</Text>
                <Text style={[styles.cellValue, meter ? { color: levelColorForDb(meter.peakHoldDb) } : styles.cellValueMax]}>
                  {meter ? estSpl(meter.peakHoldDb) : '—'}
                </Text>
                <Text style={styles.cellHint}>tap to reset</Text>
              </Pressable>
              <Pressable
                style={styles.fsBtn}
                onPress={() => setReadoutFsOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Open the readout full screen"
              >
                <Text style={styles.fsBtnIcon}>⛶</Text>
                <Text style={styles.fsBtnLabel}>FULL{'\n'}SCREEN</Text>
              </Pressable>
            </View>

            {/* Big live readout (owner 2026-08-17): RESPONSE toggle LEFT
                (FAST · SLOW · 5 SEC AVG), number center (tap = START/STOP), UNIT
                toggle RIGHT (dBFS · dBA · dBC · dB SPL). The toggles carry unit +
                response, so the card shows only the honesty line (no repetition). */}
            <View style={styles.readoutRow}>
              {renderResponseToggle()}
              <Pressable
                style={[styles.readoutCard, styles.readoutCardFlex]}
                onPress={running ? stopMeter : startMeter}
                accessibilityRole="button"
                accessibilityLabel={running ? 'Tap to stop the meter' : 'Tap to start the meter'}
              >
                <Text style={styles.readoutValue} numberOfLines={1}>
                  {bigText}
                </Text>
                <Text style={styles.readoutSub}>{readoutHonesty}</Text>
              </Pressable>
              {renderUnitToggle()}
            </View>

            {/* Session log (spec §9 View 2): Leq + elapsed + reset/save. */}
            <View style={styles.logCard}>
              <HelpHead title="SESSION LOG" onHelp={() => help('session_log')} style={styles.sectionHead} />
              <Pressable onLongPress={() => help('session_log')} delayLongPress={260}>
              <View style={styles.logRow}>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>Leq · dBA</Text>
                  <Text style={styles.cellValue}>{logDbaValue}</Text>
                </View>
                <View style={styles.logCell}>
                  <Text style={styles.cellLabel}>{logLeqLabel}</Text>
                  <Text style={styles.cellValue}>{logLeqValue}</Text>
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
                    {calDraftText}
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
      </View>
      ) : (
      /* ── SPL Meter HOME (de-modalized 2026-08-19): the VU home, now an ordinary
         in-tree view (was the always-open `vuOpen` native Modal). Same state,
         same handlers — the meter keeps running; nothing here is a second copy of
         the measurement. Reached via the header "VU HOME"; "DIGITAL ›" returns.
         Hardware BACK is handled by the BackHandler effect above. */
        <View style={[styles.vuModalRoot, { paddingTop: insets.top + 8 }]}>
          {/* SPL Meter HOME header — title + nav to the digital readout and the
              landscape-only full VU screen (owner 2026-08-18). */}
          <View style={styles.vuModalHead}>
            {/* Back button (owner 2026-08-19): the SPL Meter HOME is the meter's
                landing view — without this the user was stuck with no way out.
                Exits the tool (back to the tool intro). */}
            <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.vuModalBack}>
              <Text style={styles.back}>‹</Text>
            </Pressable>
            <Text style={styles.vuModalTitle}>SPL METER HOME</Text>
            <View style={{ flex: 1 }} />
            <Pressable
              style={styles.homeNavBtn}
              onPress={() => setView('digital')}
              accessibilityRole="button"
              accessibilityLabel="Open the digital readout"
            >
              <Text style={styles.homeNavText}>DIGITAL ›</Text>
            </Pressable>
            <Pressable
              style={[styles.homeNavBtn, styles.homeNavBtnFs]}
              onPress={() => setVuFsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open the full VU screen in landscape"
            >
              <Text style={styles.homeNavTextFs}>⛶ FULL VU</Text>
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
                    {/* The skinned VU is SVG — it needs NO Skia, so it renders on
                        every client (2026-08-19; the old pre-Skia gate card is gone). */}
                    {vuFsOpen ? (
                      // Paused while the Full VU covers this home (owner 2026-08-18).
                      <View style={{ width: vuW, height: vuH }} />
                    ) : (
                      <SkinnedVu
                        width={vuW}
                        height={vuH}
                        live={live}
                        live0Db={vuLive0}
                        running={running}
                        fit="contain"
                      />
                    )}
                    {/* Controls now live in the BOTTOM CONTROL BAR (owner 2026-08-18):
                        RANGE · WEIGHTING · RESPONSE · PEAK HOLD each open a popup. */}
                  </View>
                  {viz && !vuFsOpen ? (
                    <SideLed viz={viz} live={live} ledW={ledW} ledH={leftColH} holdMode={holdMode} splOffset={splOffset} weightingLabel={weighting} />
                  ) : null}
                </View>

                {/* BOTTOM CONTROL BAR (owner 2026-08-18): four buttons under the VU,
                    each shows its current value and opens a chooser popup. */}
                <View style={styles.ctrlBar}>
                  {[
                    { key: 'range' as const, label: 'RANGE', value: rangeAuto ? 'AUTO' : `${rangeDb}` },
                    { key: 'unit' as const, label: 'WEIGHTING', value: activeUnit === 'dB SPL' ? 'SPL' : activeUnit === 'dBFS' ? 'FS' : activeUnit === 'dBA' ? 'A' : 'C' },
                    { key: 'response' as const, label: 'RESPONSE', value: responseLabel(response) },
                    { key: 'hold' as const, label: 'PEAK HOLD', value: holdLabel(holdMode) },
                  ].map((b) => (
                    <Pressable
                      key={b.key}
                      style={styles.ctrlBarBtn}
                      onPress={() => setSettingPopup(b.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`${b.label}: ${b.value}. Tap to change.`}
                    >
                      <Text style={styles.ctrlBarLabel}>{b.label}</Text>
                      <Text style={styles.ctrlBarValue} numberOfLines={1}>{b.value}</Text>
                    </Pressable>
                  ))}
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
                  {/* Reveal triangle on the LEFT of the title (owner rev 14). */}
                  <Text style={[styles.gaugeToggleChevron, styles.gaugeToggleChevronLeft]}>{gaugeOpen ? '▾' : '▸'}</Text>
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
                </Pressable>
                {gaugeOpen ? (
                  <VuHero
                    dialW={dialW}
                    level={gaugeSpl}
                    calibrated={calibrated}
                    dialMode={dialMode}
                    onDialMode={setDialMode}
                    onModeHelp={() => help('mode')}
                    centerText={gaugeText}
                    centerColor={dialCenterColor}
                    onOpenFullscreen={() => setGaugeFsOpen(true)}
                  />
                ) : null}

                {/* 7 — Mirrored session log + save (same handlers) — COMPACT in
                    the VU popup (owner 2026-07-30: smaller readout + buttons). */}
                <View style={[styles.logCard, styles.logCardSm]}>
                  <HelpHead title="SESSION LOG" onHelp={() => help('session_log')} style={styles.sectionHeadSm} />
                  <View style={styles.logRow}>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>Leq · dBA</Text>
                      <Text style={styles.cellValueSm}>{logDbaValue}</Text>
                    </View>
                    <View style={styles.logCell}>
                      <Text style={styles.cellLabel}>{logLeqLabel}</Text>
                      <Text style={styles.cellValueSm}>{logLeqValue}</Text>
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
                        {calDraftText}
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

          {/* FULL VU overlay (owner 2026-08-18): rendered INSIDE the home — NOT a
              second stacked modal. A modal-over-modal went BLACK on iOS over the
              home. Both orientations (rotation unlocked while open); the home
              meters behind it are paused (vuFsOpen), so nothing double-renders. */}
          {vuFsOpen && (
            // The meter AREA closes on tap (reliable even where a Skia meter would
            // eat the ✕ — owner 2026-08-18: ✕ didn't close in portrait). The LED
            // toggle (top-left) and the settings bar (bottom) are INTERACTIVE child
            // Pressables: they act on their own taps while the meter / empty areas
            // still fall through to close — the same pattern as the settings popup.
            <Pressable
              style={styles.vuFsRoot}
              onPress={() => setVuFsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close the full VU screen — tap the meter to close"
            >
              <View style={[styles.vuFsClose, { right: camInset + 14 }]} pointerEvents="none">
                <Text style={styles.vuFsCloseX}>✕</Text>
              </View>
              {/* LANDSCAPE-ONLY (owner 2026-08-19): render the Full VU content
                  ONLY in landscape, so the portrait orientation never ghosts the
                  old stacked layout during the flip. The skinned VU is SVG (no
                  Skia); only the Skia LED (+ its toggle) gate on viz. */}
              {winW >= winH && (
                <>
                  {/* LED hide/show (owner 2026-08-18) — interactive, top-left. */}
                  {viz && (
                    <Pressable
                      style={[styles.vuFsLedToggle, { left: camInset + 14 }]}
                      onPress={() => setVuFsLedHidden((h) => !h)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !vuFsLedHidden }}
                      accessibilityLabel={vuFsLedHidden ? 'Show the LED level meter' : 'Hide the LED level meter'}
                    >
                      <Text style={styles.vuFsLedToggleText}>{vuFsLedHidden ? 'SHOW LED' : 'HIDE LED'}</Text>
                    </Pressable>
                  )}

                  {/* Stage (owner 2026-08-19): in LANDSCAPE the settings are a
                      COLUMN to the LEFT of the VU; in portrait they stay a bottom
                      bar (below). box-none so taps on the meter / empty areas still
                      close the screen; only the settings buttons handle their taps
                      (the meter row itself stays pointerEvents="none" so a Skia
                      meter can't eat the tap-to-close — owner 2026-08-18). */}
                  <View style={[styles.vuFsStage, { paddingHorizontal: camInset }]} pointerEvents="box-none">
                    {winW >= winH && (
                      <View style={styles.vuFsCtrlCol}>
                        {fsCtrlItems.map((b) => (
                          <Pressable
                            key={b.key}
                            style={styles.vuFsCtrlColBtn}
                            onPress={() => setSettingPopup(b.key)}
                            accessibilityRole="button"
                            accessibilityLabel={`${b.label}: ${b.value}. Tap to change.`}
                          >
                            <Text style={styles.ctrlBarLabel}>{b.label}</Text>
                            <Text style={styles.ctrlBarValue} numberOfLines={1}>{b.value}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                    <View style={[styles.vuFsRow, winW < winH && styles.vuFsCol]} pointerEvents="none">
                      <View style={styles.vuFsLeft}>
                        <SkinnedVu
                          width={winW >= winH ? Math.round(winW * 0.6) : Math.round(winW * 0.92)}
                          height={winW >= winH ? Math.round(winH * 0.78) : Math.round(winH * 0.4)}
                          live={live}
                          live0Db={vuLive0}
                          running={running}
                          fit="contain"
                        />
                      </View>
                      {!vuFsLedHidden && viz && (
                        <SideLed
                          viz={viz}
                          live={live}
                          ledW={92}
                          ledH={winW >= winH ? Math.round(winH * 0.82) : Math.round(winH * 0.4)}
                          holdMode={holdMode}
                          splOffset={splOffset}
                          weightingLabel={weighting}
                        />
                      )}
                    </View>
                  </View>

                  {/* Portrait keeps the settings as a bottom bar — no room for a
                      left column beside a near-full-width VU. */}
                  {winW < winH && (
                    <View style={[styles.vuFsCtrlBar, { paddingBottom: insets.bottom + 10 }]}>
                      {fsCtrlItems.map((b) => (
                        <Pressable
                          key={b.key}
                          style={styles.ctrlBarBtn}
                          onPress={() => setSettingPopup(b.key)}
                          accessibilityRole="button"
                          accessibilityLabel={`${b.label}: ${b.value}. Tap to change.`}
                        >
                          <Text style={styles.ctrlBarLabel}>{b.label}</Text>
                          <Text style={styles.ctrlBarValue} numberOfLines={1}>{b.value}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}
            </Pressable>
          )}

          {/* Fullscreen SPL reference gauge — LANDSCAPE-ONLY (owner 2026-08-19).
              Content renders ONLY in landscape so the portrait orientation never
              ghosts a squished layout during the flip. Tap anywhere to close. */}
          {gaugeFsOpen && (
            <Pressable
              style={styles.vuFsRoot}
              onPress={() => setGaugeFsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close the fullscreen SPL gauge — tap to close"
            >
              {winW >= winH ? (
                <>
                  <View style={[styles.vuFsClose, { right: camInset + 14 }]} pointerEvents="none">
                    <Text style={styles.vuFsCloseX}>✕</Text>
                  </View>
                  <View style={[styles.gaugeFsStage, { paddingLeft: camInset + 16, paddingRight: camInset + 12 }]} pointerEvents="box-none">
                    <View style={styles.gaugeFsChipsCol} pointerEvents="auto">
                      {(['studio', 'spl', 'optimal'] as const).map((m) => (
                        <Pressable
                          key={m}
                          style={[styles.dialModeChip, dialMode === m && styles.chipSelected]}
                          onPress={() => setDialMode(m)}
                          onLongPress={() => help('mode')}
                          delayLongPress={260}
                          accessibilityRole="button"
                          accessibilityState={{ selected: dialMode === m }}
                        >
                          <Text style={[styles.dialModeChipText, dialMode === m && styles.chipTextSelected]}>{m.toUpperCase()}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View pointerEvents="none">
                      <Spl3dGauge
                        width={gaugeFsW}
                        mode={dialMode}
                        level={gaugeSpl}
                        calibrated={calibrated}
                        centerText={gaugeText}
                        centerColor={dialCenterColor}
                      />
                    </View>
                  </View>
                </>
              ) : null}
            </Pressable>
          )}
        </View>
      )}

      {/* ── Setting chooser overlay (de-modalized 2026-08-19) — opened by the VU
          home's bottom control bar; one in-tree absolute-fill overlay serves
          Range · Weighting · Response · Peak Hold. The semi-transparent backdrop
          Pressable closes it (BackHandler covers Android back). ── */}
      {settingPopup != null && (
        <Pressable style={[styles.popupBackdrop, styles.overlayAbs]} onPress={() => setSettingPopup(null)} accessibilityRole="button" accessibilityLabel="Close">
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>
              {settingPopup === 'range' ? 'RANGE · dB AT 0 VU'
                : settingPopup === 'unit' ? 'WEIGHTING'
                : settingPopup === 'response' ? 'RESPONSE'
                : 'PEAK HOLD'}
            </Text>
            <View style={styles.popupGrid}>
              {settingPopup === 'range' && (
                <>
                  <PopupOpt label="AUTO" selected={rangeAuto} onPress={() => { setRangeAuto(true); setSettingPopup(null); }} />
                  {RANGE_VALUES.map((v) => (
                    <PopupOpt key={v} label={`${v}`} selected={!rangeAuto && rangeDb === v} onPress={() => { setRangeAuto(false); setRangeDb(v); setSettingPopup(null); }} />
                  ))}
                </>
              )}
              {settingPopup === 'unit' && UNIT_OPTS.map((u) => (
                <PopupOpt
                  key={u.key}
                  label={u.key === 'dB SPL' ? 'SPL' : u.key === 'dBFS' ? 'FS' : u.key === 'dBA' ? 'A' : 'C'}
                  selected={activeUnit === u.key}
                  onPress={() => { u.select(); setSettingPopup(null); }}
                />
              ))}
              {settingPopup === 'response' && RESPONSES.map((r) => (
                <PopupOpt key={r} label={responseLabel(r)} selected={response === r} onPress={() => { setResponse(r); setSettingPopup(null); }} />
              ))}
              {settingPopup === 'hold' && HOLD_POPUP_MODES.map((m) => (
                <PopupOpt key={m} label={holdLabel(m)} selected={holdMode === m} onPress={() => { setHoldMode(m); setSettingPopup(null); }} />
              ))}
            </View>
            {settingPopup === 'hold' && (
              <Pressable style={styles.popupResetBtn} onPress={() => { resetPeakHold(); setSettingPopup(null); }} accessibilityRole="button" accessibilityLabel="Reset peak hold now">
                <Text style={styles.popupResetText}>RESET PEAK HOLD NOW</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      )}

      {/* ── Fullscreen # readout (de-modalized 2026-08-19): the number ALONE (no
          side toggles), with PEAK (top-left) and PEAK HOLD (top-right). The number
          spans ~4/5 of the screen width. Now an in-tree absolute-fill overlay; its
          rotation is governed by the route's declarative `orientation` option
          (Phase 2), which is set to 'all' while it is open. ── */}
      {readoutFsOpen && (
        <View
          style={[styles.fsRoot, styles.overlayAbs, { paddingTop: insets.top + 8 }]}
          onTouchStart={fsDimmerOpen ? armDimmerHide : undefined}
          onTouchMove={fsDimmerOpen ? armDimmerHide : undefined}
        >
          {/* Hide the status bar (clock/battery) in fullscreen — the OS glyphs
              can't be dimmed from JS, so removing them is the closest to what the
              user expects for a dark meter (owner 2026-08-17). Restores on close. */}
          <StatusBar hidden animated />

          {/* Top: ✕ (top-LEFT) · PEAK then PEAK HOLD (right). Real device rotation
              (expo-screen-orientation) re-flows this — no manual toggle. */}
          <View style={styles.fsTopRow}>
            <Pressable
              onPress={() => setReadoutFsOpen(false)}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel="Close fullscreen readout"
            >
              <Text style={styles.vuClose}>✕</Text>
            </Pressable>
            <View style={styles.fsPeakGroup}>
              <View style={styles.fsCorner}>
                <Text style={styles.cellLabel}>PEAK</Text>
                <Text style={[styles.fsCornerValue, meter ? { color: levelColorForDb(meter.peakDb) } : styles.cellValueMax]}>
                  {meter ? estSpl(meter.peakDb) : '—'}
                </Text>
              </View>
              <Pressable
                style={styles.fsCorner}
                onPress={resetPeakHold}
                accessibilityRole="button"
                accessibilityLabel="Peak hold — tap to reset"
              >
                <Text style={styles.cellLabel}>PEAK HOLD</Text>
                <Text style={[styles.fsCornerValue, meter ? { color: levelColorForDb(meter.peakHoldDb) } : styles.cellValueMax]}>
                  {meter ? estSpl(meter.peakHoldDb) : '—'}
                </Text>
                <Text style={styles.cellHint}>tap to reset</Text>
              </Pressable>
            </View>
          </View>

          {/* Center: identity · BIG number · honesty. */}
          <View style={styles.fsCenter}>
            <Pressable
              style={styles.fsCard}
              onPress={running ? stopMeter : startMeter}
              accessibilityRole="button"
              accessibilityLabel={running ? 'Tap to stop the meter' : 'Tap to start the meter'}
            >
              <Text style={styles.fsIdentity}>{readoutIdentity}</Text>
              <Text style={[styles.fsValue, { fontSize: fsNumSize }]} numberOfLines={1}>
                {bigText}
              </Text>
              <Text style={styles.fsHonesty}>{readoutHonesty}</Text>
            </Pressable>
          </View>

          {/* Dim wash — Animated so slider drags don't re-render the screen. */}
          <Animated.View pointerEvents="none" style={[styles.fsDim, { opacity: fsDimAnim }]} />
          {/* DISTINCT night-vision red — a strong red over the dim, Animated in. */}
          <Animated.View pointerEvents="none" style={[styles.fsRedWash, { opacity: fsRedAnim }]} />

          {/* Revealed dimmer LINE — HIGHER up the screen (owner 2026-08-17), above
              the dim/red so it stays usable + visible. */}
          {fsDimmerAvailable && fsDimmerOpen && (
            <View style={[styles.fsSliderDock, { bottom: Math.round(winH * 0.22) }]} pointerEvents="box-none">
              <BrightnessSlider value={fsBright} onLive={onDimLive} onCommit={onDimCommit} onInteract={armDimmerHide} />
            </View>
          )}
          {/* Discreet SUN toggle pinned to the lower-right corner. */}
          {fsDimmerAvailable && (
            <Pressable
              style={styles.fsSunBtn}
              onPress={() => setFsDimmerOpen((o) => !o)}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel={fsDimmerOpen ? 'Hide the brightness slider' : 'Show the brightness slider'}
            >
              <Text style={styles.fsSun}>☀</Text>
            </Pressable>
          )}
        </View>
      )}
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
  readoutValue: { fontFamily: fonts.mono, fontSize: 54, color: colors.textPrimary, letterSpacing: 1 },
  readoutSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber, textAlign: 'center' },

  // Readout row: response toggle (left) · number card (center) · unit toggle
  // (right) — owner 2026-08-17.
  readoutRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  readoutCardFlex: { flex: 1, justifyContent: 'center' },
  // Vertical side toggle (response / unit): active amber, inactive white. Fixed
  // width so both columns match and "5 SEC AVG" wraps within it.
  sideToggle: { justifyContent: 'center', alignItems: 'center', gap: 12, width: 50 },
  sideOpt: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.3, color: '#ffffff', textAlign: 'center' },
  sideOptActive: { color: colors.amber },
  // Standalone FULLSCREEN button, right of PEAK HOLD. The FRAME matches the other
  // screen buttons (neutral #26262c/#131316, same as peakCell); only the CONTENTS
  // — the ⛶ icon + label — are green (owner 2026-08-18).
  fsBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fsBtnIcon: { fontFamily: fonts.mono, fontSize: 18, color: colors.green },
  fsBtnLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.8, color: colors.green, textAlign: 'center' },

  // Fullscreen # readout view (owner 2026-08-17): number alone, no toggles.
  // isolation:isolate makes the red MULTIPLY wash blend only against the
  // fullscreen content (not whatever is behind the modal).
  fsRoot: { flex: 1, backgroundColor: colors.screenBg, paddingHorizontal: 16, isolation: 'isolate' },
  // De-modalized full-screen overlays (2026-08-19): absolute-fill, above the
  // in-tree home/digital view. Replaces the native Modal windows the settings
  // chooser and fullscreen readout used to open in.
  overlayAbs: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  fsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fsCorner: { alignItems: 'flex-start', gap: 2 },
  // PEAK + PEAK HOLD grouped on the RIGHT, PEAK to the left (owner 2026-08-17).
  fsPeakGroup: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  fsCornerValue: { fontFamily: fonts.mono, fontSize: 22, color: colors.textPrimary },
  fsCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  fsCard: { alignItems: 'center', gap: 8 },
  fsIdentity: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.4, color: colors.amberLabel },
  fsValue: { fontFamily: fonts.mono, color: colors.textPrimary, letterSpacing: 1 },
  fsHonesty: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.amber },

  // Popup-local brightness / red-mode overlays + slider (owner 2026-08-17).
  // Both overlays are Animated (opacity driven imperatively during a drag).
  fsDim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000', zIndex: 50 },
  fsRedWash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: FS_RED_WASH, mixBlendMode: 'multiply', zIndex: 70 },
  // Revealed dimmer line — sits HIGHER up the screen (bottom set inline), above
  // the overlays so it stays usable. Discreet light-gray.
  fsSliderDock: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 65 },
  // Discreet SUN toggle in the lower-right corner — above the overlays so it is
  // always findable (the way out of a dark/red screen).
  fsSunBtn: { position: 'absolute', right: 14, bottom: 16, padding: 8, zIndex: 75 },
  fsSun: { fontFamily: fonts.mono, fontSize: 15, color: '#8a8c90' },
  // Narrower than the screen (centered by fsSliderDock) and TRANSPARENT — an
  // outlined pill, not a colored line, so it reads as glass over the dark meter
  // and is easy to grab (owner 2026-08-18).
  brightTrack: { height: 44, width: '62%', justifyContent: 'center' }, // tall = easy to grab
  brightBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 15,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(224,226,230,0.5)',
  },
  brightThumb: {
    position: 'absolute',
    top: (44 - FS_THUMB) / 2,
    width: FS_THUMB,
    height: FS_THUMB,
    borderRadius: FS_THUMB / 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },

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
  // Small in-cell instruction under the PEAK HOLD value (owner 2026-08-17).
  cellHint: { fontFamily: fonts.barlowRegular, fontSize: 11, color: colors.textMuted, marginTop: 1 },

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
  vuModalBack: { marginRight: 6 },
  vuModalTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.textPrimary },
  vuClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSecondary, padding: 4 },
  vuScroll: { padding: 16, paddingBottom: 40, gap: 14, alignItems: 'stretch' },
  // SPL Meter HOME nav buttons (→ digital readout, → full VU).
  homeNavBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  homeNavText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary },
  homeNavBtnFs: { borderColor: 'rgba(55,224,95,.5)' },
  homeNavTextFs: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.green },
  // Full VU overlay — absolute-fill inside the home (not a second modal).
  vuFsRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0c0c0f',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  // Visible, always-on-top close button (a plain ✕ under the notch was untappable
  // in portrait — owner 2026-08-18). `top` is set inline from the safe-area inset.
  vuFsClose: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 130,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,18,22,0.9)',
    borderWidth: 1,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vuFsCloseX: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSecondary },
  // Full VU stage — a row so the settings COLUMN sits left of the VU (landscape).
  vuFsStage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  // Fullscreen gauge: chips in a LEFT column, gauge to their right (owner rev 20).
  gaugeFsStage: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  gaugeFsChipsCol: { flexDirection: 'column', gap: 10 },
  // Settings column (landscape), left of the VU meter (owner 2026-08-19).
  vuFsCtrlCol: { width: 106, flexDirection: 'column', justifyContent: 'center', gap: 10, zIndex: 130 },
  vuFsCtrlColBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  vuFsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  // Portrait: stack VU over the LED, centered.
  vuFsCol: { flexDirection: 'column', gap: 22 },
  vuFsLeft: { alignItems: 'center', justifyContent: 'center' },
  // Full VU LED hide/show toggle — mirrors the ✕, top-LEFT, always tappable.
  vuFsLedToggle: {
    position: 'absolute',
    top: 10,
    left: 14,
    zIndex: 130,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(18,18,22,0.9)',
    borderWidth: 1,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vuFsLedToggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  // Full VU settings bar — pinned across the bottom, above the meter (owner
  // 2026-08-18). paddingBottom is set inline from the safe-area inset.
  vuFsCtrlBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: 130,
    flexDirection: 'row',
    gap: 8,
  },
  // Bottom control bar (Range · Weighting · Response · Peak Hold).
  ctrlBar: { flexDirection: 'row', gap: 8 },
  ctrlBarBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  ctrlBarLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, color: colors.textSub },
  ctrlBarValue: { fontFamily: fonts.mono, fontSize: 14, color: colors.amber },
  // Setting chooser popup.
  popupBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  popupCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 18,
    gap: 14,
  },
  popupTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSecondary, textAlign: 'center' },
  popupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  popupOpt: {
    minWidth: 62,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  popupOptSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  popupOptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.textSecondary },
  popupOptTextSel: { color: colors.amber },
  popupResetBtn: {
    alignSelf: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3a3a44',
    backgroundColor: '#17171c',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  popupResetText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSecondary },
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
  gaugeToggleChevronLeft: { marginLeft: 0, marginRight: 10 },
  gaugeToggleInfo: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amberLabel },

  // STUDIO / SPL chooser — pinned to the TOP-LEFT corner of the circle meter.
  // Mode chips in their OWN ROW above the 3D gauge (rev 2 — the absolute
  // corner overlay collided with the gauge's title/badge).
  dialModeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
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
