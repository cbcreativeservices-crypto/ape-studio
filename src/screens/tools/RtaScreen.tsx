/**
 * RtaScreen — Spectrum Analyzer / RTA, LIVE View 1 + trace save (View 2 seed).
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §10 (views, controls,
 * required warnings) + §6 quality flags + §7 saved traces. Engine build
 * 2026-07-23 (ape-dsp): polls REAL BandsFrame data via useDspEngine — never a
 * simulated bar (measurement-tools §1.7). Honesty rules embodied here:
 *  - all levels are dBFS, uncalibrated, and labeled so (never dB SPL);
 *  - Q2 gray-out: bands the engine flags unresolvable render dim gray with NO
 *    level bar, and only resolvable bands are persisted in a saved trace;
 *  - peak can exceed 0 dBFS (finding F1) — the 0 dBFS gridline sits below a
 *    headroom zone and numeric readouts print the real value, unclamped;
 *  - capture starts only on the explicit START press; the hook stops capture
 *    on unmount (spec §18).
 *
 * BAND CHOICES (owner spec 2026-07-29): 7 · 10 · 15 · 31 · 61.
 *  - 10 = native fraction 1 (1/1 octave), 31 = native fraction 3 (1/3 octave):
 *    the native BandsFrame renders directly.
 *  - 7 / 15 = client-side regrouping of the native 1/3-octave frame: grouped
 *    bands' LINEAR POWERS are energy-averaged (never dB averages), centers are
 *    the geometric mean of the group (log-even), and the group is resolvable
 *    only if EVERY member is (AND of the native flags — one dishonest member
 *    grays the whole group).
 *  - 61 = 1/6 octave DERIVED from the fine FFT spectrum (spectrumEnabled only
 *    while 61 is selected): bin powers energy-summed into 61 log-spaced bands
 *    20 Hz–20 kHz; a band whose bin support is too sparse at this FFT size
 *    (fewer than one bin, or narrower than one bin width) renders grayed under
 *    the exact same `resolvable` grammar. Disclosed in the meta line.
 *  Derived modes keep the α behavior (7/15 inherit the native band average;
 *  61 applies the same exponential α to the derived band powers) and track
 *  peak hold client-side ON THE DERIVED LEVEL (averaging native holds could
 *  overstate a group's hold). RESET PEAK clears both native and derived holds.
 *
 * Controls (spec §10): start/stop, banding, averaging speed (exponential α),
 * peak-hold reset, save trace. Banding/averaging changes live-apply through
 * ApeDsp.setEngineConfig ONLY when the engine config actually changes
 * (fraction / spectrumEnabled / α) — the native side restarts the band average
 * and peak hold under a new settings epoch (noted on screen). SAVE always
 * persists the NATIVE frame (§7 payload contract unchanged): display-time
 * regrouping never alters what is stored.
 *
 * Visual standard 2026-07-29 (rule 2 — abstract data styled, never
 * hairline-on-black): gradient-filled LED-style columns (hot top → deep base,
 * shared userSpaceOnUse gradient — ONE def, not per-bar), glow caps, bright
 * floating peak-hold dashes, plot frame + graticule weight hierarchy. The
 * honest gray slots and every §10 warning stay exactly as they were.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import Svg, { Defs, G, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ApeDsp, type BandsFrame, type EngineConfig } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { meterWarningFlags, useDspEngine } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { EngineGate } from './EngineGate';
import { useToolHelp, HelpHead, DisplayGuideButton, readoutKey } from '../../features/lab/guidedLessons';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rta'>;

const FFT_SIZE = 8192;

/** Averaging chips → exponential band-average α (higher = faster response). */
const AVG_CHOICES = [
  { label: 'FAST', alpha: 0.6 },
  { label: 'MED', alpha: 0.35 },
  { label: 'SLOW', alpha: 0.15 },
] as const;

// ---- Band-count modes (owner spec 2026-07-29) ------------------------------
type BandMode = 7 | 10 | 15 | 31 | 61;
const BAND_MODES: readonly BandMode[] = [7, 10, 15, 31, 61] as const;
/** Engine fraction a mode needs (61 aggregates the fine spectrum instead —
 *  its native fraction stays 3 so SAVE keeps persisting real 1/3-oct bands). */
const fractionFor = (m: BandMode): 1 | 3 => (m === 10 ? 1 : 3);

/** What the display renders — the native frame directly (10/31) or an honest
 *  client-side derivation of it (7/15/61). Same honesty grammar throughout. */
type DisplayBands = {
  centers: number[];
  levelsDb: number[];
  peakHoldDb: number[];
  resolvable: boolean[];
};

/** Sentinel well under the display floor — derived gray bands carry it so no
 *  bar and no tick can ever render for them. */
const NO_LEVEL = -999;

/** 7/15-band regrouping of the native 1/3-octave frame. Levels ENERGY-average
 *  (mean of the members' linear powers — never a dB average); centers are the
 *  geometric mean of the grouped native centers (log-even since the native
 *  grid is); resolvable = AND of the members' flags. Peak hold is tracked
 *  client-side on the DERIVED level in `hold` (max over time of the group's
 *  energy average) — energy-averaging native per-band holds could overstate
 *  the group hold when member peaks happened at different times. */
function regroupBands(nb: BandsFrame, groups: number, hold: Map<number, number>): DisplayBands {
  const n = nb.centers.length;
  const centers: number[] = [];
  const levelsDb: number[] = [];
  const peakHoldDb: number[] = [];
  const resolvable: boolean[] = [];
  for (let g = 0; g < groups; g++) {
    const i0 = Math.floor((g * n) / groups);
    const i1 = Math.floor(((g + 1) * n) / groups);
    if (i1 <= i0) continue;
    let logSum = 0;
    let power = 0;
    let ok = true;
    for (let i = i0; i < i1; i++) {
      logSum += Math.log(nb.centers[i]);
      power += Math.pow(10, nb.levelsDb[i] / 10);
      ok = ok && nb.resolvable[i];
    }
    const m = i1 - i0;
    centers.push(Math.exp(logSum / m));
    resolvable.push(ok);
    if (ok) {
      const level = 10 * Math.log10(power / m);
      const prev = hold.get(g);
      const h = prev != null && prev > level ? prev : level;
      hold.set(g, h);
      levelsDb.push(level);
      peakHoldDb.push(h);
    } else {
      levelsDb.push(NO_LEVEL);
      peakHoldDb.push(NO_LEVEL);
    }
  }
  return { centers, levelsDb, peakHoldDb, resolvable };
}

// ---- 1/6-octave (61-band) derivation from the fine FFT spectrum ------------
const SIXTH_BANDS = 61;
/** 1/6-oct centers, 20 Hz × 2^(k/6) → 20 Hz … 20.48 kHz (log-even). */
const SIXTH_CENTERS: number[] = Array.from({ length: SIXTH_BANDS }, (_, k) => 20 * Math.pow(2, k / 6));
const SIXTH_EDGE = Math.pow(2, 1 / 12); // band edges at center × 2^(±1/12)
const SIXTH_POLL_MS = 80; // ~12.5 Hz — near the hook's 15 Hz frame poll

/** Aggregate one REAL fine-spectrum frame (dBFS per bin) into the 61 bands:
 *  bin powers ENERGY-SUMMED per band, exponential α on the summed POWER (the
 *  same averaging behavior the native band path applies), client-side peak
 *  hold on the derived level. Honesty (same grammar as native `resolvable`):
 *  a band is resolvable only if ≥1 bin lands in it AND its bandwidth spans at
 *  least one bin width at this FFT size — otherwise gray, no bar, no hold. */
function deriveSixthOctave(
  spec: Float32Array,
  sampleRate: number,
  fftSize: number,
  alpha: number,
  smoothRef: { current: Float64Array | null },
  hold: Float64Array,
): DisplayBands {
  const hzPerBin = sampleRate / fftSize;
  const power = new Float64Array(SIXTH_BANDS);
  const binCount = new Int32Array(SIXTH_BANDS);
  const nyquist = sampleRate / 2;
  for (let i = 1; i < spec.length; i++) {
    const f = i * hzPerBin;
    if (f > nyquist) break;
    const k = Math.round(6 * Math.log2(f / 20));
    if (k < 0 || k >= SIXTH_BANDS) continue;
    power[k] += Math.pow(10, spec[i] / 10);
    binCount[k] += 1;
  }
  const first = smoothRef.current == null;
  const sm = smoothRef.current ?? Float64Array.from(power);
  smoothRef.current = sm;
  const levelsDb: number[] = [];
  const peakHoldDb: number[] = [];
  const resolvable: boolean[] = [];
  for (let k = 0; k < SIXTH_BANDS; k++) {
    const widthHz = SIXTH_CENTERS[k] * (SIXTH_EDGE - 1 / SIXTH_EDGE);
    const ok = binCount[k] >= 1 && widthHz >= hzPerBin;
    resolvable.push(ok);
    if (!ok) {
      levelsDb.push(NO_LEVEL);
      peakHoldDb.push(NO_LEVEL);
      continue;
    }
    if (!first) sm[k] += alpha * (power[k] - sm[k]);
    const db = sm[k] > 0 ? 10 * Math.log10(sm[k]) : NO_LEVEL;
    if (db > hold[k]) hold[k] = db;
    levelsDb.push(db);
    peakHoldDb.push(hold[k]);
  }
  return { centers: SIXTH_CENTERS, levelsDb, peakHoldDb, resolvable };
}

/** Honest meta line per mode — derived views disclose their derivation. */
function metaFor(mode: BandMode, alpha: number): string {
  const a = `α ${alpha.toFixed(2)}`;
  switch (mode) {
    case 10:
      return `1/1 OCT · FFT ${FFT_SIZE} · ${a}`;
    case 31:
      return `1/3 OCT · FFT ${FFT_SIZE} · ${a}`;
    case 61:
      return `1/6 OCT · derived from FFT ${FFT_SIZE} · ${a}`;
    default:
      return `${mode} BANDS · grouped from 1/3 OCT · ${a}`;
  }
}

// ---- Bar-panel geometry (fixed-height SVG; dBFS → pixels) -----------------
const PANEL_H = 190;
const FLOOR_DB = -90; // display floor — levels below draw no bar
const ZERO_Y = 16; // 0 dBFS gridline; the zone above is REAL headroom (F1)
const FLOOR_Y = 182;
const PX_PER_DB = (FLOOR_Y - ZERO_Y) / -FLOOR_DB;
/** dBFS → y. Values above 0 dBFS climb into the headroom zone; only the SVG
 *  edge (y=2, ≈+7.6 dBFS) limits geometry — numbers are never clamped. */
const yForDb = (db: number) => Math.max(2, ZERO_Y - db * PX_PER_DB);

const GRID_DBS = [0, -30, -60, FLOOR_DB];
const GRID_DBS_MINOR = [-15, -45, -75];
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;

// Visual standards 2026-07-29 rule 2 — chart chrome + LED palette. Copied
// locally from the fxViz grammar (shared idiom, not a cross-feature import).
const PLOT_BG = '#0c0c0f';
const PLOT_FRAME = '#262b36';
const GRID = '#20242e';
const GRID_MINOR = '#181c22';
const AXIS = '#39404d'; // 0 dBFS reference — brighter than the graticule
const BAR_HOT = '#ffd35e'; // 0 dBFS and the headroom zone above it
const BAR_HI = '#7fd4ff';
const BAR_MID = '#2f9bff';
const BAR_DEEP = '#123a5e';
const CAP_HALO = '#7fd4ff';
const CAP_CORE = '#d9f1ff';
const PEAK_TICK = '#ffe8b0';
const SLOT_GRAY = '#55555f'; // Q2 honest gray — unchanged

/** Nearest band index per labeled center — skip when over half an octave off
 *  (1/1-octave mode has no 63 Hz twin problem; sparse sets dedupe by index). */
function bandLabels(centers: number[]): { i: number; text: string }[] {
  const out: { i: number; text: string }[] = [];
  for (const hz of LABEL_TARGETS) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      if (centers[i] <= 0) continue;
      const d = Math.abs(Math.log2(centers[i] / hz));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best >= 0 && bestDist <= 0.5 && !out.some((l) => l.i === best)) {
      out.push({ i: best, text: hz >= 1000 ? `${hz / 1000}k` : `${hz}` });
    }
  }
  return out;
}

const fmtDb = (v: number | undefined) =>
  v != null && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—';

function StatCell({ label, value, unit, help }: { label: string; value: string; unit?: string; help?: (key: string) => void }) {
  return (
    <Pressable
      style={styles.statCell}
      onLongPress={help ? () => help(readoutKey(label)) : undefined}
      delayLongPress={350}
      accessibilityRole={help ? 'button' : undefined}
      accessibilityLabel={help ? `${label} — what it shows` : label}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </Pressable>
  );
}

function Chip({ label, active, onPress, a11yLabel }: { label: string; active: boolean; onPress: () => void; a11yLabel?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Live vertical bar graph — LED-style gradient columns (2026-07-29 restyle)
 *  from a REAL native or honestly-derived frame: glow caps on lit bars,
 *  bright floating peak-hold dashes, Q2 dim-gray slots for unresolvable
 *  bands. ONE shared gradient def in userSpaceOnUse — the ramp is anchored to
 *  the dB scale (hot at 0 dBFS, deep at the floor), so every bar shares it
 *  and short bars only ever show the deep end. */
function BandsPanel({ bands, mode, alpha }: { bands: DisplayBands | null; mode: BandMode; alpha: number }) {
  const [chartW, setChartW] = useState(0);

  const n = bands ? bands.centers.length : 0;
  const barW = n > 0 && chartW > 0 ? chartW / n : 0;
  const labels = bands ? bandLabels(bands.centers) : [];
  const anyUnresolvable = bands != null && bands.resolvable.some((r) => !r);
  const pad = barW > 3 ? 1 : 0.5;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelEyebrow}>LIVE RTA</Text>
        <Text style={styles.panelSettings}>{metaFor(mode, alpha)}</Text>
      </View>

      <View style={styles.chartRow}>
        {/* dB gutter — dBFS scale marks matching the gridlines. */}
        <View style={styles.gutter}>
          {GRID_DBS.map((db) => (
            <Text key={db} style={[styles.gutterLabel, { top: yForDb(db) - 8 }]}>
              {db}
            </Text>
          ))}
        </View>

        <View
          style={styles.chartArea}
          onLayout={(e) => setChartW(Math.round(e.nativeEvent.layout.width))}
        >
          {chartW > 0 && (
            <Svg width={chartW} height={PANEL_H}>
              <Defs>
                {/* Shared LED ramp — one def for every bar (perf discipline). */}
                <LinearGradient
                  id="rtaBarFill"
                  x1="0"
                  y1={ZERO_Y}
                  x2="0"
                  y2={FLOOR_Y}
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor={BAR_HOT} />
                  <Stop offset="0.13" stopColor={BAR_HI} />
                  <Stop offset="0.5" stopColor={BAR_MID} />
                  <Stop offset="1" stopColor={BAR_DEEP} />
                </LinearGradient>
              </Defs>
              {/* Plot frame — rounded panel + hairline (shared chart chrome). */}
              <Rect x={0} y={0} width={chartW} height={PANEL_H} rx={8} fill={PLOT_BG} />
              <Rect
                x={0.5}
                y={0.5}
                width={chartW - 1}
                height={PANEL_H - 1}
                rx={7.5}
                stroke={PLOT_FRAME}
                strokeWidth={1}
                fill="none"
              />
              {GRID_DBS_MINOR.map((db) => (
                <Line
                  key={db}
                  x1={2}
                  y1={yForDb(db)}
                  x2={chartW - 2}
                  y2={yForDb(db)}
                  stroke={GRID_MINOR}
                  strokeWidth={0.75}
                />
              ))}
              {GRID_DBS.map((db) => (
                <Line
                  key={db}
                  x1={2}
                  y1={yForDb(db)}
                  x2={chartW - 2}
                  y2={yForDb(db)}
                  stroke={db === 0 ? AXIS : GRID}
                  strokeWidth={db === 0 ? 1.2 : db === FLOOR_DB ? 1.5 : 1}
                />
              ))}
              {bands != null &&
                bands.centers.map((c, i) => {
                  const x = i * barW + pad;
                  const w = Math.max(1, barW - pad * 2);
                  if (!bands.resolvable[i]) {
                    // Q2 honest gray-out: a dim slot, NO level bar, NO tick —
                    // this band cannot be resolved at this FFT/banding setting.
                    return (
                      <Rect
                        key={`slot-${c}`}
                        x={x}
                        y={ZERO_Y}
                        width={w}
                        height={FLOOR_Y - ZERO_Y}
                        fill={SLOT_GRAY}
                        fillOpacity={0.14}
                      />
                    );
                  }
                  const level = bands.levelsDb[i];
                  const peak = bands.peakHoldDb[i];
                  const barTop = yForDb(level); // yForDb caps only at the SVG edge — F1 headroom
                  return (
                    <G key={`band-${c}`}>
                      {level > FLOOR_DB && (
                        <>
                          {/* LED column: shared hot-top→deep-base ramp. */}
                          <Rect
                            x={x}
                            y={barTop}
                            width={w}
                            height={FLOOR_Y - barTop}
                            fill="url(#rtaBarFill)"
                            fillOpacity={0.96}
                          />
                          {/* Glow cap: soft halo + bright core at the tip. */}
                          <Rect
                            x={x - 0.75}
                            y={barTop - 2.5}
                            width={w + 1.5}
                            height={5}
                            rx={1.5}
                            fill={CAP_HALO}
                            fillOpacity={0.22}
                          />
                          <Rect
                            x={x}
                            y={barTop - 1.1}
                            width={w}
                            height={2.2}
                            rx={1}
                            fill={CAP_CORE}
                            fillOpacity={0.95}
                          />
                        </>
                      )}
                      {peak > FLOOR_DB && (
                        <Rect
                          x={x + w * 0.1}
                          y={yForDb(peak) - 1}
                          width={w * 0.8}
                          height={2}
                          rx={1}
                          fill={PEAK_TICK}
                          fillOpacity={0.95}
                        />
                      )}
                    </G>
                  );
                })}
            </Svg>
          )}
          {/* Band-center frequency labels, aligned under their bars. */}
          <View style={styles.labelRow}>
            {chartW > 0 &&
              labels.map((l) => (
                <Text
                  key={l.text}
                  style={[styles.freqLabel, { left: (l.i + 0.5) * barW - 24 }]}
                >
                  {l.text}
                </Text>
              ))}
          </View>
        </View>
      </View>

      <Text style={styles.unitLine}>dBFS · uncalibrated approximate</Text>
      {anyUnresolvable && (
        <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>
      )}
    </View>
  );
}

export function RtaScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('rta');
  const insets = useSafeAreaInsets();

  // Ref-stable config object: useDspEngine's start() closes over the object we
  // pass on mount, so settings changes MUTATE it (then live-apply below) —
  // a fresh object per render would leave START pushing stale settings.
  // spectrumEnabled rides the 61-band mode only (config effect, owner spec).
  const cfg = useRef<EngineConfig>({
    fftSize: FFT_SIZE,
    fraction: 3,
    spectrumEnabled: false,
    bandAvgAlpha: 0.35,
  }).current;
  const [mode, setMode] = useState<BandMode>(31);
  const [alpha, setAlpha] = useState(0.35);
  const fraction = fractionFor(mode); // what the ENGINE is banding at (save path)

  const { state, frames, start, stop, lastError, resetPeakHold } = useDspEngine(cfg, {
    meter: true,
    bands: true,
  });

  // ---- Derived-mode client state (7/15 grouping · 61 spectrum aggregation).
  const groupHoldRef = useRef<Map<number, number>>(new Map());
  const sixthHoldRef = useRef<Float64Array>(new Float64Array(SIXTH_BANDS).fill(NO_LEVEL));
  const sixthSmoothRef = useRef<Float64Array | null>(null);
  const [sixth, setSixth] = useState<DisplayBands | null>(null);
  const clearDerived = useCallback(() => {
    groupHoldRef.current.clear();
    sixthHoldRef.current.fill(NO_LEVEL);
    sixthSmoothRef.current = null;
    setSixth(null);
  }, []);

  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const applyMode = useCallback(
    (m: BandMode) => {
      if (m === mode) return;
      const wantFraction = fractionFor(m);
      const wantSpectrum = m === 61;
      // Reconfigure the engine ONLY when it actually changes (fraction /
      // spectrumEnabled) — 7↔15↔31 all ride the same native 1/3-oct frame.
      const needsConfig = cfg.fraction !== wantFraction || cfg.spectrumEnabled !== wantSpectrum;
      cfg.fraction = wantFraction;
      cfg.spectrumEnabled = wantSpectrum;
      setMode(m);
      clearDerived(); // fresh derivation state — stale holds would lie
      // Live-apply: the native side restarts band averaging + per-band peak
      // hold under a new settings epoch. When idle this pre-stages the config;
      // the hook re-pushes the same object on START.
      if (needsConfig) ApeDsp.setEngineConfig(cfg);
    },
    [cfg, mode, clearDerived],
  );

  const applyAlpha = useCallback(
    (a: number) => {
      if (a === alpha) return;
      cfg.bandAvgAlpha = a;
      setAlpha(a);
      clearDerived(); // derived smoothing/holds restart with the epoch too
      ApeDsp.setEngineConfig(cfg); // same settings-epoch restart as banding
    },
    [cfg, alpha, clearDerived],
  );

  // 61-band mode: aggregate the REAL fine spectrum on its own ~12.5 Hz poll
  // (the hook's 15 Hz frame poll doesn't carry the spectrum payload).
  useEffect(() => {
    if (state !== 'running' || mode !== 61) return;
    const id = setInterval(() => {
      const meta = ApeDsp.getSpectrumMeta();
      const spec = ApeDsp.getSpectrum();
      if (!meta || meta.sampleRate <= 0 || meta.fftSize <= 0 || spec.length === 0) return;
      setSixth(
        deriveSixthOctave(spec, meta.sampleRate, meta.fftSize, alpha, sixthSmoothRef, sixthHoldRef.current),
      );
    }, SIXTH_POLL_MS);
    return () => clearInterval(id);
  }, [state, mode, alpha]);

  /** What the panel renders for the current mode (native or honest derivation).
   *  While a fraction switch is in flight the native frame renders as-is for a
   *  frame or two rather than regrouping the wrong grid. */
  const displayBands = useMemo<DisplayBands | null>(() => {
    if (mode === 61) return sixth;
    const nb = frames.bands;
    if (nb == null) return null;
    if (mode === 10 || mode === 31 || nb.fraction !== 3) return nb;
    return regroupBands(nb, mode, groupHoldRef.current);
  }, [mode, frames.bands, sixth]);

  /** RESET PEAK: native hold (unchanged call) + the derived-mode holds. */
  const onResetPeak = useCallback(() => {
    groupHoldRef.current.clear();
    sixthHoldRef.current.fill(NO_LEVEL);
    resetPeakHold();
  }, [resetPeakHold]);

  // STOP must not collapse the tool back to the intro card (that shrinks the
  // ScrollView and jumps the scroll). Hold the view mounted via micPaused; the
  // button toggles START/STOP in place. Cleared once we're truly running again.
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);

  const onStart = useCallback(() => {
    setMicPaused(false);
    clearDerived(); // a fresh run must not inherit a previous run's holds
    void start();
  }, [clearDerived, start]);

  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);

  /** SAVE TRACE (spec §10 View 2 → §7 library). Real polled data only — always
   *  the NATIVE frame: display-time regrouping (7/15/61) never alters the
   *  stored payload, which stays the engine's 1/1 or 1/3-octave truth. */
  const onSaveTrace = useCallback(() => {
    const bands = frames.bands;
    if (state !== 'running' || bands == null || bands.centers.length === 0) return;
    const flags = meterWarningFlags(frames.meter);
    // Q2: persist ONLY resolvable bands — the payload has no resolvable flag,
    // so storing flagged-unresolvable levels would fabricate data on replay.
    const bandsHz: number[] = [];
    const levelsDb: number[] = [];
    bands.centers.forEach((c, i) => {
      if (bands.resolvable[i]) {
        bandsHz.push(c);
        levelsDb.push(bands.levelsDb[i]);
      }
    });
    const routeName = ApeDsp.getInfo()?.routeName;
    saveMeasurement({
      id: Crypto.randomUUID(),
      tool_type: 'rta',
      created_at: new Date().toISOString(),
      title: `RTA trace — ${fraction === 1 ? '1/1' : '1/3'} octave`,
      notes: '',
      input_device: routeName && routeName.length > 0 ? routeName : 'Device microphone',
      calibration_status: 'uncalibrated',
      sample_rate: bands.sampleRate,
      measurement_settings: { fraction, fft_size: FFT_SIZE, averaging: alpha },
      quality_state: evaluateQuality(flags),
      warning_flags: flags,
      data_payload: {
        kind: 'spectrum_trace',
        bandsHz,
        levelsDb,
        fraction,
        smoothing: String(alpha),
        averaging: 'exponential',
      },
    });
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1800);
  }, [state, frames, fraction, alpha]);

  const liveFlags = state === 'running' ? meterWarningFlags(frames.meter) : [];
  const meter = frames.meter;
  const canSave = state === 'running' && frames.bands != null && frames.bands.centers.length > 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>SPECTRUM ANALYZER / RTA</Text>
          <Text style={styles.subtitle}>Live RTA · dBFS · uncalibrated</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest not-ready card (absent/spike/denied/error) — renders nothing
            when the engine is usable. */}
        <EngineGate state={state} lastError={lastError} />

        {!micPaused && (state === 'idle' || state === 'starting') && (
          <>
            <Text style={styles.intro}>
              Watch signal energy across frequency in real time — 7 to 61 bands with peak hold.
              Levels are digital level at the microphone input (dBFS), uncalibrated and
              approximate. Press START to begin capture; nothing is simulated while stopped.
            </Text>
            <GlassButton
              label={state === 'starting' ? 'STARTING…' : 'START'}
              tint="blue"
              height={52}
              fontSize={15}
              disabled={state === 'starting'}
              onPress={onStart}
            />
          </>
        )}

        {(state === 'running' || micPaused) && (
          <>
            <BandsPanel bands={displayBands} mode={mode} alpha={alpha} />
            <DisplayGuideButton onPress={helpAll} />

            {/* Numeric truth row — peak may exceed 0 dBFS (F1): print it.
                Long-press any cell for what it shows. */}
            <View style={styles.statGrid}>
              <StatCell help={help} label="PEAK" value={fmtDb(meter?.peakDb)} unit="dBFS" />
              <StatCell help={help} label="PEAK HOLD" value={fmtDb(meter?.peakHoldDb)} unit="dBFS" />
              <StatCell help={help} label="BANDS" value={displayBands ? String(displayBands.centers.length) : '—'} />
            </View>

            {/* Live quality warnings (spec §6) — same flags stored on save. */}
            {liveFlags.map((f) => (
              <Text key={f} style={styles.liveWarn}>
                ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
              </Text>
            ))}

            {/* Controls (spec §10): banding · averaging · peak hold · save. */}
            <View style={styles.ctrlRow}>
              <HelpHead title="BANDING" onHelp={() => help('banding')} style={styles.ctrlLabel} />
              {BAND_MODES.map((m) => (
                <Chip
                  key={m}
                  label={String(m)}
                  a11yLabel={
                    m === 10
                      ? '10 bands, one octave'
                      : m === 31
                        ? '31 bands, one-third octave'
                        : m === 61
                          ? '61 bands, one-sixth octave, derived from the FFT spectrum'
                          : `${m} bands, grouped from one-third octave`
                  }
                  active={mode === m}
                  onPress={() => applyMode(m)}
                />
              ))}
            </View>
            <View style={styles.ctrlRow}>
              <HelpHead title="AVERAGING" onHelp={() => help('averaging')} style={styles.ctrlLabel} />
              {AVG_CHOICES.map((c) => (
                <Chip key={c.label} label={c.label} active={alpha === c.alpha} onPress={() => applyAlpha(c.alpha)} />
              ))}
            </View>
            <Text style={styles.settingsNote}>
              Changing banding or averaging restarts the band average and peak hold (new settings
              epoch).
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.ctrlBtn}
                onPress={onResetPeak}
                accessibilityRole="button"
                accessibilityLabel="Reset peak hold"
              >
                <Text style={styles.ctrlText}>RESET PEAK</Text>
              </Pressable>
              <Pressable
                style={[styles.ctrlBtn, justSaved && styles.ctrlBtnSaved, !canSave && styles.ctrlBtnDisabled]}
                onPress={onSaveTrace}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave }}
                accessibilityLabel="Save trace"
              >
                <Text style={[styles.ctrlText, justSaved && styles.ctrlTextSaved]}>
                  {justSaved ? 'SAVED ✓' : 'SAVE TRACE'}
                </Text>
              </Pressable>
            </View>

            <GlassButton
              label={state === 'running' ? 'STOP' : 'START'}
              tint="blue"
              height={52}
              fontSize={15}
              onPress={state === 'running' ? onStop : onStart}
            />

            <Pressable
              onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'rta' })}
              accessibilityRole="button"
              accessibilityLabel="View saved measurements"
            >
              <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
            </Pressable>
          </>
        )}

        {/* Required warnings (spec §10) — always visible. */}
        <Text style={styles.reminder}>
          This display shows frequency energy, not automatic EQ advice. Microphone position
          strongly affects the result.
        </Text>
      </ScrollView>
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
  scroll: { padding: 16, paddingBottom: 28, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Live bar-graph panel.
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 6,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  panelSettings: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  chartRow: { flexDirection: 'row' },
  gutter: { width: 32, height: PANEL_H },
  gutterLabel: {
    position: 'absolute',
    right: 4,
    width: 28,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chartArea: { flex: 1, height: PANEL_H + 16 },
  labelRow: { height: 16 },
  freqLabel: {
    position: 'absolute',
    top: 0,
    width: 48,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  unitLine: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSubAlt },

  // Numeric readout cells (fonts.mono for values — house data-readout face).
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
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  statValue: { fontFamily: fonts.mono, fontSize: 19, color: colors.textPrimary },
  statUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },

  // Live warning line (spec §6) — amber, plain language.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  // Control chips.
  ctrlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlLabel: {
    width: 84,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textSub,
  },
  chip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#18181c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.amberDeep, backgroundColor: '#1d180d' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  chipTextActive: { color: colors.amber },
  settingsNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },

  // Reset / save buttons.
  buttonRow: { flexDirection: 'row', gap: 12 },
  ctrlBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctrlBtnSaved: { borderColor: 'rgba(91,255,133,.65)', backgroundColor: '#0d1710' },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.textSecondary },
  ctrlTextSaved: { color: '#5bff85' },

  libraryLink: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: '#4dd0e1',
    textAlign: 'center',
  },

  reminder: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 4,
  },
});
