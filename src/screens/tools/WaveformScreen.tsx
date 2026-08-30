/**
 * WaveformScreen — Waveform Viewer LIVE oscilloscope view (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §11 View 1; engine build 2026-07-23).
 * Min/max envelope from the engine's waveform buckets (50 ms each, newest at
 * right) drawn as a gradient-filled area with a glow edge, RMS energy core,
 * red clip ticks, styled center line + dB grid, ±1 amplitude marks.
 *
 * Owner directive 2026-07-29: zoom chips ×1/×2/×4/×6 (DEFAULT ×4) and an
 * adjustable time window (DEFAULT 5 s). The owner asked for 2–7 s, but the
 * native engine ring (WaveEnvelope: 50 ms × 120 buckets, both bridges cap at
 * kMaxWaveBuckets = 120) holds exactly 6.0 s of REAL history — so the control
 * honestly tops out at 6 s and says so on screen; we never draw fabricated
 * history (measurement-tools §1.7).
 *
 * Integrity:
 *  - NO simulated readings — anything drawn comes from ApeDsp.getWaveform()
 *    while capture is running; every other state renders EngineGate or the
 *    explicit START affordance (measurement-tools §1.7).
 *  - Capture starts only on the user's START press; useDspEngine stops it on
 *    unmount (spec §18).
 *  - All levels are dBFS and UNCALIBRATED — labeled so, never shown as SPL.
 *  - Peak may exceed 0 dBFS and samples may exceed ±1 (finding F1): the peak
 *    readout never clamps, and the display autoscales to the observed max.
 *  - Vertical zoom AND the time window are display scaling ONLY, with the
 *    spec §11 honesty line shown whenever zoom is engaged.
 *  - FREEZE holds the drawn buckets (the FULL 6 s engine history is held, so
 *    the window control keeps slicing real data while frozen); capture (and
 *    the live meter) continue.
 *  - SAVE SNAPSHOT stores the envelope as NUMBERS (never audio) with the same
 *    quality flags shown live (spec §6/§7).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { lockLandscape, lockPortrait } from '../../lib/screenOrientationSafe';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Canvas, Path as SkiaPath, LinearGradient as SkiaGradient, Skia, vec } from '@shopify/react-native-skia';
import * as Crypto from 'expo-crypto';
import { ApeDsp, type WaveBucket } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine, useToolAutoStart } from '../../features/tools/engine/useDspEngine';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS, levelColorForDb } from '../../features/tools/levelColor';
import { useColorModePref } from '../../features/tools/colorModePref';
import { useWaveColorPref, WAVE_COLOR_SWATCHES } from '../../features/tools/waveColorPref';
import { ColorWheelButton } from '../../components/ColorWheelButton';
import { SpectrumColorPicker } from '../../components/SpectrumColorPicker';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { EngineGate } from './EngineGate';
import { useToolHelp, DisplayGuideButton } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WaveformLive'>;

/** The native ring spans 6.0 s of history (WaveEnvelope.hpp: bucketFrames ×
 *  historyBuckets). The bucket DURATION is derived from the actual bucket COUNT
 *  the engine sends — so if the native resolution changes (owner 2026-08-02:
 *  finer buckets → a smoother, less blocky trace) this display auto-adapts with
 *  no code change here. */
const ENGINE_HISTORY_SEC = 6.0;
/** Slice headroom — the engine never sends more than its ring capacity. */
const MAX_BUCKETS = 4096;
const PANEL_H = 240;
/** Left control-column width in the landscape fullscreen (owner rev 24). */
const FS_CTRL_W = 108;
/** Skia's CanvasKit isn't shipped on web (nor any Spike-0 build), so the trace
 *  is drawn with SVG there and Skia on device — the tool never blanks. Enables
 *  the dev #waveformpreview and hardens against no-CanvasKit runtimes. */
const SKIA_READY =
  Platform.OS !== 'web' ||
  (typeof globalThis !== 'undefined' && !!(globalThis as { CanvasKit?: unknown }).CanvasKit);

/** Vertical inset of the drawable area (leaves the clip-tick lane at top). */
const PAD_V = 16;
/** Accent for clip ticks / axis (teal, toolsData). */
const TRACE = '#5fd9c4';
// Skia gradient inputs derived from the shared amplitude ramp (offset → color).
const WAVE_LEVEL_COLORS = WAVE_LEVEL_STOPS.map((s) => s.color);
const WAVE_LEVEL_POS = WAVE_LEVEL_STOPS.map((s) => s.offset);

/** Vertical zoom chips — owner 2026-07-29: ×6 added, DEFAULT ×4. */
const ZOOMS = [1, 2, 4, 6] as const;
type Zoom = (typeof ZOOMS)[number];
const DEFAULT_ZOOM: Zoom = 2;

/** Time-window chips (seconds of history shown) — owner 2026-07-31: 0.5–4 s. */
const WINDOWS = [0.5, 1, 2, 3, 4] as const;
type WindowSec = (typeof WINDOWS)[number];
const DEFAULT_WINDOW: WindowSec = 4;

/** Honest dBFS formatting — NEVER clamps; peak can exceed 0 dBFS (F1). */
const fmtDb = (v: number | undefined | null) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

export function WaveformScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('waveform');
  const insets = useSafeAreaInsets();
  const { state, frames, start, stop, lastError } = useDspEngine(
    { waveformEnabled: true },
    { meter: true, waveform: true },
  );

  const { width: winW, height: winH } = useWindowDimensions();
  // Front-camera / notch inset for the LANDSCAPE fullscreen — max across edges
  // since the locked-landscape overlay can't trust insets.left (rev 24, matches
  // the SPL/VU fullscreens).
  const camInset = Math.max(insets.left, insets.right, insets.top);
  const [panelW, setPanelW] = useState(0);
  const [zoom, setZoom] = useState<Zoom>(DEFAULT_ZOOM);
  const [windowSec, setWindowSec] = useState<WindowSec>(DEFAULT_WINDOW);
  // ZOOM / WINDOW are compact value-buttons that open a small chooser popup
  // (owner rev 24 — the VU-fullscreen style). Android back closes it first.
  const [wavePopup, setWavePopup] = useState<null | 'zoom' | 'window' | 'color'>(null);
  // Landscape-only fullscreen (owner rev 24 — controls on the left, like SPL/VU).
  const [waveFsOpen, setWaveFsOpen] = useState(false);
  // CLOSING phase (owner 2026-08-21 ghost-flash fix, mirrors SplMeterScreen): keep
  // the opaque fullscreen mounted as a cover while the OS rotates landscape→
  // portrait on close, so the portrait-designed screen never flashes sideways.
  const [waveFsClosing, setWaveFsClosing] = useState(false);
  useEffect(() => {
    if (waveFsOpen && !waveFsClosing) lockLandscape();
    else lockPortrait();
  }, [waveFsOpen, waveFsClosing]);
  useEffect(() => {
    navigation.setOptions({ orientation: waveFsOpen && !waveFsClosing ? 'landscape' : 'portrait' });
  }, [waveFsOpen, waveFsClosing, navigation]);
  // Finish the close only once the window has actually rotated back to portrait;
  // a 700 ms fallback guards against a rotation that never arrives.
  const fsPortrait = winH > winW;
  useEffect(() => {
    if (!waveFsClosing) return;
    if (fsPortrait) { setWaveFsOpen(false); setWaveFsClosing(false); return; }
    const t = setTimeout(() => { setWaveFsOpen(false); setWaveFsClosing(false); }, 700);
    return () => clearTimeout(t);
  }, [waveFsClosing, fsPortrait]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (wavePopup != null) {
        setWavePopup(null);
        return true;
      }
      if (waveFsOpen && !waveFsClosing) {
        setWaveFsClosing(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [wavePopup, waveFsOpen, waveFsClosing]);
  // FREEZE: non-null = the FULL engine history held on screen (so the window
  // control still slices real data while frozen). Capture continues (spec §11
  // freeze control) — only the drawing stops updating.
  const [frozen, setFrozen] = useState<WaveBucket[] | null>(null);
  // Clip-overrun display baseline (owner 2026-08-01): tapping the CLIP OVERRUNS
  // readout zeroes the shown count by recording the current native total as a
  // baseline; the display shows (total − baseline). The native counter keeps
  // running (it resets to 0 on each capture start, when we also zero the base).
  const [clipBase, setClipBase] = useState(0);
  // COLORS toggle (owner 2026-08-05, items 6/7): MIDI level colours on the
  // trace, persisted per user, first-ever default ON.
  const [colorsOn, setColorsOn] = useColorModePref();
  // Custom flat-trace colour — applied when the MIDI gradient (COLORS) is off.
  // The colour-wheel button (member-gated) opens the picker (owner rev 24 / rule).
  const [waveColor, setWaveColor] = useWaveColorPref();
  const traceColor = waveColor ?? TRACE;
  // Whether the colour popup is showing the full spectrum wheel vs the swatches.
  const [waveSpectrum, setWaveSpectrum] = useState(false);
  // Clip latch (owner 2026-08-05, item 4): the CLIP OVERRUNS readout stays
  // GREEN "0" until the first real overrun, then turns RED and holds until reset.
  const [hasClipped, setHasClipped] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clear the SAVED ✓ timer on unmount (house review rule 2026-07-23).
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  // getWaveform() is newest-first → reverse so index 0 is oldest, drawn
  // leftmost, newest at the right edge (oscilloscope convention, §11 View 1).
  const liveBuckets = useMemo(
    () => frames.waveform.slice(0, MAX_BUCKETS).reverse(),
    [frames.waveform],
  );
  const source = frozen ?? liveBuckets;
  // Bucket DURATION from the ring's real capacity (the most buckets seen this
  // session): finer native buckets → more buckets/second → a finer trace, with
  // the time axis staying correct automatically.
  const capRef = useRef(1);
  if (liveBuckets.length > capRef.current) capRef.current = liveBuckets.length;
  const bucketSec = ENGINE_HISTORY_SEC / capRef.current;
  const windowBuckets = Math.min(source.length, Math.max(1, Math.round(windowSec / bucketSec)));
  /** The buckets actually on screen: the newest `windowBuckets` of the real
   *  history — a shorter run early in capture simply shows what exists. */
  const displayBuckets = useMemo(
    () => source.slice(Math.max(0, source.length - windowBuckets)),
    [source, windowBuckets],
  );
  const shownSec = displayBuckets.length * bucketSec;

  // Scope size: the normal card (panelW × PANEL_H) or the landscape fullscreen
  // (fills the space right of the left control column). ONE geometry memo serves
  // whichever is showing (owner rev 24).
  const fsLandscape = waveFsOpen && !waveFsClosing && winW >= winH;
  const scopeW = fsLandscape ? Math.max(120, winW - FS_CTRL_W - camInset - 44) : panelW;
  const scopeH = fsLandscape ? Math.max(120, winH - insets.top - insets.bottom - 28) : PANEL_H;

  const meter = frames.meter;
  // Live quality flags (spec §6) — the SAME flags get stored on save.
  const flags = useMemo(() => meterWarningFlags(meter), [meter]);

  // Clip-overrun display count + latch (item 4). Green 0 until the first real
  // overrun, then red until reset.
  const clipShown = meter ? Math.max(0, meter.clipRuns - clipBase) : 0;
  useEffect(() => {
    if (clipShown > 0) setHasClipped(true);
  }, [clipShown]);
  const resetClip = useCallback(() => {
    if (meter) setClipBase(meter.clipRuns);
    setHasClipped(false);
  }, [meter]);

  const toggleFreeze = useCallback(() => {
    setFrozen((f) => (f ? null : liveBuckets));
  }, [liveBuckets]);

  // micPaused (owner 2026-07-31): STOP only stops the mic and STAYS on the screen
  // (the viewer stays up, frozen on the last capture) — it must NOT collapse to
  // the START card (that read as "leaving the screen" + caused a scroll jump).
  const [micPaused, setMicPaused] = useState(false);
  const onStop = useCallback(() => {
    setFrozen(null);
    setMicPaused(true);
    stop();
  }, [stop]);
  const onStart = useCallback(() => {
    // Do NOT clear micPaused here (owner 2026-08-01 strobe fix): clearing it
    // during the 'starting' transition unmounts the frozen viewer for a frame
    // and flashes the whole screen like a strobe after every STOP→START. It is
    // cleared only once we are actually running (below), so the frozen viewer
    // stays up and seamlessly goes live.
    setClipBase(0); // native clip counter restarts at 0 on capture start
    setHasClipped(false); // fresh capture = fresh clip latch
    void start();
  }, [start]);
  // Clear the paused flag ONLY when truly running (never during 'starting').
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);

  // Open straight into the live oscilloscope — no redundant START screen (owner
  // 2026-08-01).
  useToolAutoStart(state, onStart, stop);

  /** Save the on-screen envelope to the library (Phase 2, spec §7) —
   *  numbers only, never audio. */
  const onSave = useCallback(() => {
    if (!meter || displayBuckets.length === 0) return;
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'waveform',
      created_at: new Date().toISOString(),
      title: `Waveform — ${shownSec.toFixed(1)} s · peak ${fmtDb(meter.peakDb)} dBFS`,
      notes: '',
      input_device: 'Device microphone (uncalibrated)',
      calibration_status: 'not_applicable',
      sample_rate: ApeDsp.getInfo()?.sampleRate ?? null,
      measurement_settings: { bucket_ms: Math.round(bucketSec * 1000), zoom, window_sec: windowSec },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'waveform_snapshot',
        envelope: displayBuckets.map((b) => ({ min: b.min, max: b.max })),
        durationSec: displayBuckets.length * bucketSec,
        peakDbfs: meter.peakDb, // never clamped — may exceed 0 dBFS (F1)
        clippedRuns: meter.clipRuns,
        channels: 1,
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [meter, displayBuckets, shownSec, zoom, windowSec, flags, bucketSec]);

  // ---- Scope geometry (pure display math over REAL buckets) ----------------
  // Builds: a closed min/max envelope area (gradient fill), the envelope
  // outline (drawn twice — wide translucent glow + crisp edge), a closed ±RMS
  // energy core, and the red clip-tick lane. ~15 SVG nodes total, rebuilt at
  // the 15 Hz poll — bounded and cheap.
  const scope = useMemo(() => {
    const n = displayBuckets.length;
    if (n === 0 || scopeW <= 0) return null;
    // Samples can exceed ±1 (F1): autoscale full-scale to the observed max.
    let observed = 1;
    for (const b of displayBuckets) {
      const m = Math.max(Math.abs(b.min), Math.abs(b.max));
      if (m > observed) observed = m;
    }
    const scaleMax = Math.max(1.05, observed);
    const half = scopeH / 2;
    const usable = half - PAD_V;
    const rawY = (v: number) => half - (v * zoom * usable) / scaleMax;
    // Zoomed traces clip at the panel edge (display only — zoom is not gain).
    const y = (v: number) => Math.min(scopeH - 2, Math.max(2, rawY(v)));
    const colW = scopeW / windowBuckets;

    // PER-PIXEL min/max envelope (owner 2026-07-31): sample the bucket envelope at
    // EVERY screen pixel (linearly interpolated between bucket centres) so the
    // waveform is drawn as finely as the screen allows — one filled amber body,
    // like a DAW, not a coarse outlined trace.
    // SAMPLE-AND-HOLD, NOT interpolated (owner 2026-08-01): each pixel takes the
    // NEAREST bucket's exact min/max/rms, so every bucket draws as a flat-topped
    // rectangular bar (the DAW peak look). Interpolating between bucket centres
    // slewed the edges into triangles when the buckets are wide (e.g. the 0.5 s
    // window) — that rounding is gone.
    const sampleAt = (px: number) => {
      let f = n - 0.5 - (scopeW - px) / colW; // fractional bucket index at this x
      if (f < 0) f = 0;
      if (f > n - 1) f = n - 1;
      const b = displayBuckets[Math.round(f)];
      return { max: b.max, min: b.min, rms: b.rms };
    };
    // Build the trace as SKIA paths (owner 2026-08-14): react-native-svg rendered
    // this dense per-pixel envelope COARSELY on Android; Skia is anti-aliased and
    // identical on both platforms. Collect the min/max + RMS envelope per screen
    // pixel, then close each into a filled area (top edge L→R, bottom edge R→L).
    const W = Math.round(scopeW);
    const topY = new Array<number>(W + 1);
    const botY = new Array<number>(W + 1);
    const rmsT = new Array<number>(W + 1);
    const rmsB = new Array<number>(W + 1);
    for (let px = 0; px <= W; px++) {
      const s = sampleAt(px);
      let y1 = y(s.max);
      let y2 = y(s.min);
      if (y2 - y1 < 1) {
        // Hairline floor so near-silence still draws a visible 1px band.
        y1 -= 0.5;
        y2 += 0.5;
      }
      topY[px] = y1;
      botY[px] = y2;
      rmsT[px] = y(s.rms);
      rmsB[px] = y(-s.rms);
    }
    // Skia paths on device; SVG path strings on web (CanvasKit absent).
    type SkPath = ReturnType<typeof Skia.Path.Make>;
    let areaP: SkPath | null = null;
    let rmsP: SkPath | null = null;
    let clipP: SkPath | null = null;
    let areaD = '';
    let rmsD = '';
    let clipD = '';
    if (SKIA_READY) {
      areaP = Skia.Path.Make();
      areaP.moveTo(0, topY[0]);
      for (let px = 1; px <= W; px++) areaP.lineTo(px, topY[px]);
      for (let px = W; px >= 0; px--) areaP.lineTo(px, botY[px]);
      areaP.close();
      rmsP = Skia.Path.Make();
      rmsP.moveTo(0, rmsT[0]);
      for (let px = 1; px <= W; px++) rmsP.lineTo(px, rmsT[px]);
      for (let px = W; px >= 0; px--) rmsP.lineTo(px, rmsB[px]);
      rmsP.close();
      clipP = Skia.Path.Make();
    } else {
      areaD = `M0 ${topY[0].toFixed(1)}`;
      for (let px = 1; px <= W; px++) areaD += `L${px} ${topY[px].toFixed(1)}`;
      for (let px = W; px >= 0; px--) areaD += `L${px} ${botY[px].toFixed(1)}`;
      areaD += 'Z';
      rmsD = `M0 ${rmsT[0].toFixed(1)}`;
      for (let px = 1; px <= W; px++) rmsD += `L${px} ${rmsT[px].toFixed(1)}`;
      for (let px = W; px >= 0; px--) rmsD += `L${px} ${rmsB[px].toFixed(1)}`;
      rmsD += 'Z';
    }
    // Clip ticks per REAL bucket (a bucket either clipped or it didn't).
    let hasClip = false;
    for (let i = 0; i < n; i++) {
      if (displayBuckets[i].clipped) {
        hasClip = true;
        const x = scopeW - (n - i - 0.5) * colW;
        if (SKIA_READY && clipP) {
          clipP.moveTo(x, 4);
          clipP.lineTo(x, 12);
        } else {
          clipD += `M${x.toFixed(1)} 4L${x.toFixed(1)} 12`;
        }
      }
    }
    // Level-colour gradient axis (owner 2026-07-31): the loudness ramp is keyed to
    // TRUE amplitude — red at ±full scale, deep green at the zero line — mapped in
    // panel pixels so the colour tracks level regardless of vertical zoom.
    // fullPix = pixels from the centre line to |amp| = 1.0 (0 dBFS).
    const fullPix = (zoom * usable) / scaleMax;
    const gradY0 = half - fullPix; // +full scale (top) → red
    const gradY1 = half + fullPix; // −full scale (bottom) → red
    // dB scale on the LEFT edge — scales with zoom (y() includes zoom): each dB
    // below full-scale sits at its amplitude, mirrored above/below the zero line.
    // Thin out marks that would collide (esp. the low-level ones crowding the zero
    // line at low zoom): keep a mark only if it clears the last kept one by ≥12 px.
    const MIN_TICK_GAP = 12;
    let lastKept = -Infinity;
    const dbTicks = [0, -6, -12, -18, -24, -30]
      .map((db) => ({ db, amp: Math.pow(10, db / 20), ry: rawY(Math.pow(10, db / 20)) }))
      .filter((t) => t.ry >= 9 && t.ry <= half - 2)
      .filter((t) => {
        if (half - t.ry < MIN_TICK_GAP) return false; // too close to the −∞ zero line
        if (t.ry - lastKept < MIN_TICK_GAP) return false; // collides with the last kept mark
        lastKept = t.ry;
        return true;
      })
      .map((t) => ({ db: t.db, yTop: y(t.amp), yBot: y(-t.amp) }));
    return {
      areaP,
      rmsP,
      clipP,
      areaD,
      rmsD,
      clipD,
      hasClip,
      dbTicks,
      observed,
      scaleMax,
      gradY0,
      gradY1,
      clipW: Math.max(1.5, colW * 0.8),
    };
  }, [displayBuckets, scopeW, scopeH, zoom, windowBuckets]);

  const running = state === 'running';
  // Keep the viewer up while running OR while manually paused (mic off, still on
  // the screen). Clear the paused flag only once truly running again, so a
  // restart never flickers back to the START card.
  const showView = running || micPaused;
  useEffect(() => {
    if (running) setMicPaused(false);
  }, [running]);
  const half = scopeH / 2;

  // The scope visual (chrome + trace), sized to scopeW × scopeH — rendered in the
  // normal card OR the landscape fullscreen (owner rev 24). pointerEvents none so
  // the parent (card = tap-to-toggle; fullscreen = display-only) owns touches.
  const scopeInner =
    scopeW > 0 ? (
      <View style={{ width: scopeW, height: scopeH }} pointerEvents="none">
        <Svg width={scopeW} height={scopeH} style={StyleSheet.absoluteFill}>
          {scope?.dbTicks.map((t) => (
            <G key={t.db}>
              <Line x1={30} x2={scopeW} y1={t.yTop} y2={t.yTop} stroke={colors.hairlineDim} strokeDasharray="2 6" />
              <Line x1={30} x2={scopeW} y1={t.yBot} y2={t.yBot} stroke={colors.hairlineDim} strokeDasharray="2 6" />
              <SvgText x={3} y={t.yTop + 4} fill={colors.textSecondary} fontSize={12} fontFamily={fonts.mono}>
                {t.db === 0 ? '0dB' : `${t.db}`}
              </SvgText>
              <SvgText x={3} y={t.yBot + 4} fill={colors.textSecondary} fontSize={12} fontFamily={fonts.mono}>
                {t.db === 0 ? '0dB' : `${t.db}`}
              </SvgText>
            </G>
          ))}
          <Line x1={0} x2={scopeW} y1={half} y2={half} stroke={MIDLINE_BLUE} strokeWidth={1} />
          <SvgText x={4} y={half + 5} fill={colors.textSecondary} fontSize={13} fontFamily={fonts.mono}>
            -∞
          </SvgText>
          <Rect x={0.5} y={0.5} width={scopeW - 1} height={scopeH - 1} stroke="#26262c" strokeWidth={1} fill="none" />
        </Svg>
        {scope && SKIA_READY ? (
          <Canvas style={StyleSheet.absoluteFill}>
            {colorsOn ? (
              <SkiaPath path={scope.areaP!} opacity={0.9}>
                <SkiaGradient start={vec(0, scope.gradY0)} end={vec(0, scope.gradY1)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
              </SkiaPath>
            ) : (
              <SkiaPath path={scope.areaP!} color={traceColor} opacity={0.9} />
            )}
            {colorsOn ? (
              <SkiaPath path={scope.rmsP!} opacity={0.6}>
                <SkiaGradient start={vec(0, scope.gradY0)} end={vec(0, scope.gradY1)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
              </SkiaPath>
            ) : (
              <SkiaPath path={scope.rmsP!} color={traceColor} opacity={0.6} />
            )}
            {scope.hasClip ? <SkiaPath path={scope.clipP!} color={colors.red} style="stroke" strokeWidth={scope.clipW} /> : null}
          </Canvas>
        ) : scope ? (
          // Web fallback (no CanvasKit): SVG trace, flat trace colour.
          <Svg width={scopeW} height={scopeH} style={StyleSheet.absoluteFill}>
            <Path d={scope.areaD} fill={traceColor} opacity={0.9} />
            <Path d={scope.rmsD} fill={traceColor} opacity={0.6} />
            {scope.hasClip ? <Path d={scope.clipD} stroke={colors.red} strokeWidth={scope.clipW} fill="none" /> : null}
          </Svg>
        ) : null}
      </View>
    ) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>WAVEFORM VIEWER (OSCILLOSCOPE)</Text>
          <Text style={styles.subtitle}>Live oscilloscope · amplitude vs time</Text>
        </View>
        <AccuracyNote compact detail="This tool runs on your phone’s UNCALIBRATED microphone — read every level as RELATIVE, for learning, NOT a calibrated SPL reading. For accurate, absolute measurements use a calibrated SPL meter, measurement mic, or a dedicated instrument." />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready states (absent / spike / denied / error). */}
        <EngineGate state={state} lastError={lastError} />
        {state === 'error' ? (
          <GlassButton label="TRY AGAIN" tint="teal" height={52} fontSize={15} onPress={() => void start()} />
        ) : null}

        {/* Opens straight into the live oscilloscope (auto-start). */}
        {!micPaused && (state === 'idle' || state === 'starting') ? (
          <Text style={styles.intro}>Starting the oscilloscope…</Text>
        ) : null}

        {showView ? (
          <>
            {/* "What the display shows" moved ABOVE the readouts (owner rev 24). */}
            <DisplayGuideButton onPress={helpAll} />
            {/* Live readouts — ABOVE the viewer (owner 2026-07-31). Real meter
                frame only; peak NEVER clamped (F1). */}
            <View style={styles.statGrid}>
              <Pressable accessibilityHint="Press and hold for an explanation." style={styles.statCell} onLongPress={() => help('peak')} delayLongPress={260}>
                <Text style={styles.statLabel}>PEAK</Text>
                {/* Number reads level on the amplitude ramp — louder red, quieter
                    blue (owner 2026-08-12). */}
                <Text style={[styles.statValue, meter ? { color: levelColorForDb(meter.peakDb) } : null]}>
                  {fmtDb(meter?.peakDb)}
                  <Text style={styles.statUnit}> dB</Text>
                </Text>
              </Pressable>
              {/* Tap to RESET the shown count; long-press for help (owner 2026-08-01).
                  Green until the first overrun, then red until reset (item 4). */}
              <Pressable
                style={[styles.statCell, hasClipped && styles.statCellClipped]}
                onPress={resetClip}
                onLongPress={() => help('clip_runs')}
                delayLongPress={260}
                accessibilityRole="button"
                accessibilityLabel="Clip overruns — tap to reset the count"
              >
                <Text style={styles.statLabel}>CLIP OVERRUNS</Text>
                <Text style={[styles.statValue, hasClipped ? styles.statValueRed : styles.statValueGreen]}>
                  {meter ? clipShown : '—'}
                </Text>
                {/* Reset lives IN the container now (owner rev 24 — the separate
                    RESET CLIP button was removed). */}
                <Text style={styles.statHint}>tap to reset</Text>
              </Pressable>
              <Pressable accessibilityHint="Press and hold for an explanation." style={styles.statCell} onLongPress={() => help('window')} delayLongPress={260}>
                <Text style={styles.statLabel}>WINDOW</Text>
                <Text style={styles.statValue}>
                  {shownSec.toFixed(1)}
                  <Text style={[styles.statUnit, styles.statUnitWhite]}> s</Text>
                </Text>
              </Pressable>
            </View>

            {/* Oscilloscope panel — REAL buckets only (§11 View 1). */}
            <View style={styles.scopeCard}>
              {/* Tapping the display toggles START/STOP (owner 2026-07-31). */}
              <Pressable
                style={styles.scopeSurface}
                onLayout={(e) => setPanelW(Math.round(e.nativeEvent.layout.width))}
                onPress={running ? onStop : onStart}
                accessibilityRole="button"
                accessibilityLabel={running ? 'Tap to stop capture' : 'Tap to start capture'}
              >
                {!waveFsOpen && !waveFsClosing ? scopeInner : null}
                {frozen ? <Text style={styles.frozenBadge}>FROZEN</Text> : null}
              </Pressable>
              {/* Time axis + honest scale disclosure. */}
              <View style={styles.axisRow}>
                <Text style={styles.axisText}>−{shownSec.toFixed(1)} s</Text>
                {scope && scope.observed > 1 ? (
                  <Text style={styles.axisText}>scale ±{scope.scaleMax.toFixed(2)}</Text>
                ) : null}
                <Text style={styles.axisText}>now</Text>
              </View>
            </View>

            {/* ZOOM + WINDOW are compact value-buttons that open a chooser popup
                (owner rev 24 — the VU-fullscreen style); FREEZE stays an inline
                toggle. Display scaling / history length ONLY (capture unaffected). */}
            <View style={styles.ctrlRow}>
              <Pressable
                style={styles.ctrlBtn}
                onPress={() => setWavePopup('zoom')}
                accessibilityRole="button"
                accessibilityLabel={`Vertical zoom ${zoom} times. Tap to change.`}
              >
                <Text style={styles.ctrlLabel}>ZOOM</Text>
                <Text style={styles.ctrlValue}>×{zoom}</Text>
              </Pressable>
              <Pressable
                style={styles.ctrlBtn}
                onPress={() => setWavePopup('window')}
                accessibilityRole="button"
                accessibilityLabel={`Time window ${shownSec.toFixed(1)} seconds. Tap to change.`}
              >
                <Text style={styles.ctrlLabel}>WINDOW</Text>
                <Text style={styles.ctrlValue}>{windowSec}s</Text>
              </Pressable>
              <Pressable
                style={[styles.ctrlBtn, frozen != null && styles.ctrlBtnActive]}
                onPress={toggleFreeze}
                disabled={displayBuckets.length === 0}
                accessibilityRole="button"
                accessibilityState={{ selected: frozen != null, disabled: displayBuckets.length === 0 }}
                accessibilityLabel={frozen ? 'Unfreeze display' : 'Freeze display'}
              >
                <Text style={styles.ctrlLabel}>FREEZE</Text>
                <Text style={[styles.ctrlValue, frozen != null && styles.ctrlValueActive]}>{frozen ? 'FROZEN' : 'LIVE'}</Text>
              </Pressable>
            </View>
            {/* Display toggles (owner 2026-08-05): COLORS + clip RESET. */}
            <View style={styles.chipRow}>
              <Text style={styles.rowLabel}>DISPLAY</Text>
              <Pressable
                style={[styles.chip, colorsOn && styles.chipGreen]}
                onPress={() => setColorsOn(!colorsOn)}
                accessibilityRole="button"
                accessibilityState={{ selected: colorsOn }}
                accessibilityLabel="Toggle MIDI level colours on the waveform"
              >
                <Text style={[styles.chipText, colorsOn && styles.chipTextGreen]}>COLORS</Text>
              </Pressable>
              {/* Custom trace colour — discreet color-wheel, member-gated (owner
                  2026-08-20 rule); non-members get the membership popup. The dot
                  shows the current colour. */}
              <View style={[styles.chip, styles.colorChip]}>
                <View style={[styles.colorDot, { backgroundColor: traceColor }]} />
                <ColorWheelButton onCustomize={() => { setWaveSpectrum(false); setWavePopup('color'); }} accessibilityLabel="Waveform colour" feature="the waveform trace colour" size={20} />
              </View>
              {/* Fullscreen — to the RIGHT of the colour button (owner rev 24). */}
              <Pressable
                style={[styles.chip, styles.chipWide]}
                onPress={() => { setWaveFsClosing(false); setWaveFsOpen(true); }}
                disabled={displayBuckets.length === 0}
                accessibilityRole="button"
                accessibilityLabel="Open fullscreen (landscape)"
              >
                <Text style={styles.chipText}>⛶ FULLSCREEN</Text>
              </Pressable>
            </View>

            {/* START / SAVE. Notices now live at the very BOTTOM (owner rev 24). */}
            <View style={styles.controls}>
              <View style={{ flex: 1 }}>
                {running ? (
                  <GlassButton label="STOP" tint="teal" height={52} fontSize={15} onPress={onStop} />
                ) : (
                  <GlassButton label="START" tint="teal" height={52} fontSize={15} onPress={onStart} />
                )}
              </View>
              <Pressable
                style={[
                  styles.saveBtn,
                  justSaved && styles.saveBtnSaved,
                  (!meter || displayBuckets.length === 0) && styles.saveBtnDisabled,
                ]}
                onPress={onSave}
                disabled={!meter || displayBuckets.length === 0}
                accessibilityRole="button"
                accessibilityState={{ disabled: !meter || displayBuckets.length === 0 }}
                accessibilityLabel="Save snapshot"
              >
                <Text style={[styles.saveText, justSaved && styles.saveTextSaved]}>
                  {justSaved ? 'SAVED ✓' : 'SAVE SNAPSHOT'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'waveform' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>

            {/* ── ALL NOTICES AT THE BOTTOM (owner rev 24 — standard). ── */}
            {zoom > 1 ? (
              // Required §11 honesty line — visible whenever zoom is engaged.
              <Text style={styles.liveWarn}>Vertical zoom changes display size, not audio level.</Text>
            ) : null}
            <Text style={styles.settingsNote}>
              Zoom and window change the display only — capture keeps running unchanged.
            </Text>
            <Text style={styles.calNote}>Levels are RELATIVE (uncalibrated) — not a calibrated SPL meter.</Text>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {flags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* Required interpretation warnings (spec §11). */}
            <Text style={styles.footnote}>
              Waveform height is not the same as perceived loudness. This view shows amplitude over
              time, not frequency balance.
            </Text>
          </>
        ) : null}
      </ScrollView>

      {/* ── LANDSCAPE FULLSCREEN (owner rev 24) — controls in a LEFT column, the
          scope fills the rest; camera-inset ✕ top-right. Content renders only in
          landscape so the portrait flip never ghosts a squished layout. ── */}
      {waveFsOpen || waveFsClosing ? (
        <View style={styles.fsRoot}>
          <Pressable hitSlop={6}
            style={[styles.fsClose, { right: camInset + 14, top: insets.top + 8 }]}
            onPress={() => setWaveFsClosing(true)}
            accessibilityRole="button"
            accessibilityLabel="Close fullscreen"
          >
            <Text style={styles.fsCloseX}>✕</Text>
          </Pressable>
          {winW >= winH && !waveFsClosing ? (
            <View
              style={[
                styles.fsStage,
                { paddingLeft: camInset + 14, paddingRight: camInset + 14, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 },
              ]}
            >
              <View style={styles.fsCtrlCol}>
                <Pressable style={styles.ctrlBtn} onPress={() => setWavePopup('zoom')} accessibilityRole="button" accessibilityLabel={`Zoom ${zoom}×. Tap to change.`}>
                  <Text style={styles.ctrlLabel}>ZOOM</Text>
                  <Text style={styles.ctrlValue}>×{zoom}</Text>
                </Pressable>
                <Pressable style={styles.ctrlBtn} onPress={() => setWavePopup('window')} accessibilityRole="button" accessibilityLabel={`Window ${windowSec} seconds. Tap to change.`}>
                  <Text style={styles.ctrlLabel}>WINDOW</Text>
                  <Text style={styles.ctrlValue}>{windowSec}s</Text>
                </Pressable>
                <Pressable
                  style={[styles.ctrlBtn, frozen != null && styles.ctrlBtnActive]}
                  onPress={toggleFreeze}
                  disabled={displayBuckets.length === 0}
                  accessibilityRole="button"
                  accessibilityState={{ selected: frozen != null }}
                  accessibilityLabel={frozen != null ? 'Freeze, frozen' : 'Freeze, live'}
                >
                  <Text style={styles.ctrlLabel}>FREEZE</Text>
                  <Text style={[styles.ctrlValue, frozen != null && styles.ctrlValueActive]}>{frozen ? 'FROZEN' : 'LIVE'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.ctrlBtn, colorsOn && styles.ctrlBtnActive]}
                  onPress={() => setColorsOn(!colorsOn)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: colorsOn }}
                  accessibilityLabel={colorsOn ? 'Colors, on' : 'Colors, off'}
                >
                  <Text style={styles.ctrlLabel}>COLORS</Text>
                  <Text style={[styles.ctrlValue, colorsOn && styles.ctrlValueActive]}>{colorsOn ? 'ON' : 'OFF'}</Text>
                </Pressable>
              </View>
              <View style={styles.fsScope}>{scopeInner}</View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ZOOM / WINDOW chooser popup (owner rev 24). Tap outside or Android-back
          to close; picking an option applies + closes. */}
      {wavePopup != null ? (
        <Pressable
          style={styles.popupBackdrop}
          onPress={() => setWavePopup(null)}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>
              {wavePopup === 'zoom' ? 'VERTICAL ZOOM' : wavePopup === 'window' ? 'TIME WINDOW' : 'WAVEFORM COLOUR'}
            </Text>
            <View style={styles.popupGrid}>
              {wavePopup === 'zoom' &&
                ZOOMS.map((z) => (
                  <Pressable
                    key={z}
                    style={[styles.popupOpt, zoom === z && styles.popupOptSel]}
                    onPress={() => {
                      setZoom(z);
                      setWavePopup(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: zoom === z }}
                  >
                    <Text style={[styles.popupOptText, zoom === z && styles.popupOptTextSel]}>×{z}</Text>
                  </Pressable>
                ))}
              {wavePopup === 'window' &&
                WINDOWS.map((w) => (
                  <Pressable
                    key={w}
                    style={[styles.popupOpt, windowSec === w && styles.popupOptSel]}
                    onPress={() => {
                      setWindowSec(w);
                      setWavePopup(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: windowSec === w }}
                  >
                    <Text style={[styles.popupOptText, windowSec === w && styles.popupOptTextSel]}>{w}s</Text>
                  </Pressable>
                ))}
              {wavePopup === 'color' && !waveSpectrum &&
                WAVE_COLOR_SWATCHES.map((c) => {
                  const sel = traceColor.toLowerCase() === c.toLowerCase();
                  return (
                    <Pressable
                      key={c}
                      style={[styles.swatch, { backgroundColor: c }, sel && styles.swatchSel]}
                      onPress={() => {
                        const picked = c === WAVE_COLOR_SWATCHES[0] ? null : c;
                        setWaveColor(picked);
                        // Picking a custom colour auto-disables COLORS so it shows.
                        if (picked) setColorsOn(false);
                        setWavePopup(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={`Waveform colour ${c}${c === WAVE_COLOR_SWATCHES[0] ? ' (default)' : ''}`}
                    />
                  );
                })}
            </View>
            {wavePopup === 'color' && waveSpectrum ? (
              <SpectrumColorPicker
                value={waveColor}
                onPick={(c) => {
                  setWaveColor(c);
                  setColorsOn(false);
                  setWaveSpectrum(false);
                  setWavePopup(null);
                }}
              />
            ) : null}
            {wavePopup === 'color' ? (
              <Pressable
                onPress={() => setWaveSpectrum((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={waveSpectrum ? 'Back to swatches' : 'Open the colour spectrum wheel'}
              >
                <Text style={styles.spectrumLink}>{waveSpectrum ? '‹ SWATCHES' : '＋ SPECTRUM'}</Text>
              </Pressable>
            ) : null}
            {wavePopup === 'color' && !waveSpectrum ? (
              <Text style={styles.popupNote}>Applies to the flat trace. Picking a colour turns the COLORS ramp off automatically.</Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}
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

  // Oscilloscope card.
  scopeCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    gap: 6,
  },
  scopeSurface: { height: PANEL_H, borderRadius: 6, overflow: 'hidden', backgroundColor: '#07090b' },
  frozenBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.cyanBright,
  },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  axisText: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },

  // Zoom / window / freeze chip rows.
  // Compact ZOOM/WINDOW/FREEZE value-buttons + their chooser popup (owner rev 24).
  ctrlRow: { flexDirection: 'row', gap: 10 },
  ctrlBtn: {
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
  ctrlBtnActive: { borderColor: 'rgba(120,170,255,.55)', backgroundColor: '#10151f' },
  ctrlLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, color: colors.textSub },
  ctrlValue: { fontFamily: fonts.mono, fontSize: 15, color: colors.amber },
  ctrlValueActive: { color: '#8fb6ff' },
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    zIndex: 50,
  },
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
  popupOptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.textSecondary },
  popupOptTextSel: { color: colors.amber },
  // Custom-colour button + swatch picker (owner rev 24).
  colorChip: { flexDirection: 'row', gap: 5 },
  colorDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#00000066' },
  swatch: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#33333c' },
  swatchSel: { borderColor: '#ffffff', borderWidth: 3 },
  popupNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textMuted, textAlign: 'center' },
  spectrumLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.amber, textAlign: 'center', paddingVertical: 6 },
  // Landscape fullscreen (owner rev 24).
  fsRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0c0c0f', zIndex: 40 },
  fsClose: {
    position: 'absolute',
    zIndex: 45,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,18,22,0.9)',
    borderWidth: 1,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsCloseX: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSecondary },
  fsStage: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  fsCtrlCol: { width: FS_CTRL_W, gap: 10, justifyContent: 'center' },
  fsScope: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  chipRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  rowLabel: {
    width: 56,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textSub,
    alignSelf: 'center',
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { flex: 1.6 },
  chipActive: { borderColor: 'rgba(95,217,196,.6)', backgroundColor: '#10171a' },
  // ZOOM = green, WINDOW = blue (owner 2026-07-31).
  chipGreen: { borderColor: 'rgba(55,224,95,.65)', backgroundColor: '#0c2012' },
  chipTextGreen: { color: '#37e05f' },
  chipBlue: { borderColor: 'rgba(93,151,255,.65)', backgroundColor: '#101f36' },
  chipTextBlue: { color: '#7fa8ff' },
  chipFrozen: { borderColor: 'rgba(127,212,255,.6)', backgroundColor: '#0d151a' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textSecondary },
  chipTextActive: { color: TRACE },
  chipTextFrozen: { color: colors.cyanBright },
  settingsNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },

  // Readouts.
  statGrid: { flexDirection: 'row', gap: 10 },
  statCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  // Readout text — larger + higher contrast (owner 2026-08-05, item 4).
  statCellClipped: { borderColor: '#ff5a48' },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  statValue: { fontFamily: fonts.mono, fontSize: 23, color: colors.textPrimary },
  statValueRed: { color: '#ff5a48' },
  statValueGreen: { color: colors.green }, // clip readout before the first event (item 4)
  statValueBlue: { color: '#7fa8ff' },
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amberLabel },
  statHint: { fontFamily: fonts.barlowRegular, fontSize: 10, color: colors.textMuted, marginTop: 2 },
  statUnitBlue: { color: '#7fa8ff' },
  statUnitWhite: { color: colors.textPrimary },
  calNote: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSecondary },

  // Live quality warning line (spec §6) — house amber warning style.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  controls: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  saveTextSaved: { color: colors.greenBright },

  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },
  footnote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18.5,
    color: colors.textSub,
  },
});
