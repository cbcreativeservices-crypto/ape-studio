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
 *  - 61 = 1/6 octave DERIVED from the fine FFT spectrum (spectrumEnabled is
 *    always ON so the native band frame stays populated — see the cfg note):
 *    bin powers energy-summed into 61 log-spaced bands
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
 * floating peak-hold dashes, graticule weight hierarchy. The honest gray
 * slots and every §10 warning stay exactly as they were.
 *
 * RACK UNIT (2026-08-23, owner-approved architecture — one of the first two
 * tools on it): the ScrollView body is replaced by the RackUnit frame. The
 * layout law: *reading may scroll; operating may not.*
 *  - STAGE: the live RTA glass (LED bars + optional piano map stacked inside),
 *    height-parametric, size L. The 2026-08-21 "inert display" workaround is
 *    GONE — the stage sits outside any ScrollView, so a scroll-touch can no
 *    longer read as a tap; tap-glass pause/resume (the original affordance) is
 *    restored. Badge carries the honesty line verbatim.
 *  - BEZEL: LEVEL (tap cycles C/A/Z weighting) · PK HOLD (tap resets; latches
 *    red after a clip) · BANDS · MIC LIVE/PAUSED (tap pauses/resumes).
 *  - DOCK (5 keys): BANDING sticky tray (A/B while the glass reacts) · AVG
 *    group tray (averaging α + STD/HI-RES resolution — they interact on
 *    response speed) · RST PK action · DISPLAY group tray (COLORS toggle,
 *    member-gated colour wheel, PIANO toggle) · SAVE action (exact §7 flow).
 *    No continuous param exists, so initialParam names the teaching-central
 *    BANDING tray and the lane hides itself.
 *  - WELL: EngineGate, library link, and every notice/advisory at the BOTTOM
 *    (owner tools rule). Mic lifecycle unchanged: useDspEngine +
 *    useToolAutoStart; stops still route through the hook's debounced
 *    releaseMic — never ApeDsp.stop on handoff.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import Svg, { Defs, G, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ApeDsp, type BandsFrame, type EngineConfig, type MeterFrame } from '../../../modules/ape-dsp';
import { meterWarningFlags, useDspEngine, useToolAutoStart } from '../../features/tools/engine/useDspEngine';
import { saveMeasurement } from '../../features/tools/measure/measurementStore';
import { evaluateQuality } from '../../features/tools/measure/quality';
import { WARNING_INFO } from '../../features/tools/measure/types';
import { LOUDNESS_STOPS, levelColorForDb } from '../../features/tools/levelColor';
import { useColorModePref } from '../../features/tools/colorModePref';
import { useToolColorPref } from '../../features/tools/waveColorPref';
import { deriveSixthOctave, NO_LEVEL, SIXTH_BANDS, type DisplayBands } from '../../features/tools/sixthOctave';
import { ColorWheelButton } from '../../components/ColorWheelButton';
import { colors, fonts } from '../../theme/tokens';
import { AccuracyNote } from '../../components/AccuracyNote';
import { EngineGate } from './EngineGate';
import { useToolHelp, readoutKey } from '../../features/lab/guidedLessons';
import { RackUnit } from '../lab/rack/RackUnit';
import type { BezelItem, DockParam } from '../lab/rack/rackTypes';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Rta'>;

const FFT_SIZE = 8192;
/** HI-RES mode FFT (the engine's Q5 16384 ceiling): ~2.9 Hz bins, resolves the
 *  sub-bass 1/6-oct bands 8192 leaves grayed. Fits the 32768 rolling buffer. */
const HIRES_FFT = 16384;

/** Averaging chips → exponential band-average α (higher = faster response).
 *  FAST bumped + made the default (owner 2026-08-17: the display felt slow and
 *  laggy — it now tracks the input sooner). */
const AVG_CHOICES = [
  { label: 'FAST', alpha: 0.8 },
  { label: 'MED', alpha: 0.45 },
  { label: 'SLOW', alpha: 0.2 },
  // ~5 s exponential time constant (owner 2026-08-21) — a long, steady average
  // for room/EQ work. Approximate: the exact settle time varies a little with
  // the band mode's update rate, but this is the "very slow / ~5 s" option.
  { label: '5 SEC', alpha: 0.016 },
] as const;
/** Opening averaging α — FAST, so the analyzer is responsive on entry. */
const DEFAULT_ALPHA = 0.8;

// ---- Band-count modes (owner spec 2026-07-29) ------------------------------
type BandMode = 7 | 10 | 15 | 31 | 61;
const BAND_MODES: readonly BandMode[] = [7, 10, 15, 31, 61] as const;
/** Tray blurbs: what each band count is FOR (owner 2026-08-28). */
const BAND_BLURBS: Record<number, string> = {
  7: 'Seven broad bands — the mixer-EQ view. Reads at a glance; hides detail.',
  10: 'One band per octave — the classic 10-band graphic-EQ layout.',
  15: 'Two-thirds octave — a middle ground: more shape, still calm.',
  31: 'One-third octave — the live-sound standard, matching a 31-band graphic EQ fader for fader.',
  61: 'Sixth-octave — analysis detail: narrow enough to isolate a single problem frequency.',
};
/** Engine fraction a mode needs (61 aggregates the fine spectrum instead —
 *  its native fraction stays 3 so SAVE keeps persisting real 1/3-oct bands). */
const fractionFor = (m: BandMode): 1 | 3 => (m === 10 ? 1 : 3);

/** What the display renders — the native frame directly (10/31) or an honest
 *  client-side derivation of it (7/15/61). Same honesty grammar throughout. */
// DisplayBands + NO_LEVEL are shared via sixthOctave.ts (imported above).

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

// ---- 1/6-octave (61-band) derivation ---------------------------------------
// The derivation, its constants (SIXTH_BANDS/SIXTH_CENTERS/NO_LEVEL) and the
// DisplayBands type are SHARED with the MultiMeter via ../../features/tools/
// sixthOctave.ts (deduped 2026-08-21 — this was a byte-identical local copy).
// Only the RTA's own poll cadence stays local.
const SIXTH_POLL_MS = 80; // ~12.5 Hz — near the hook's 15 Hz frame poll

/** Honest meta line per mode — derived views disclose their derivation. */
function metaFor(mode: BandMode, alpha: number, fftSize: number): string {
  const a = `α ${alpha.toFixed(2)}`;
  switch (mode) {
    case 10:
      return `1/1 OCT · FFT ${fftSize} · ${a}`;
    case 31:
      return `1/3 OCT · FFT ${fftSize} · ${a}`;
    case 61:
      return `1/6 OCT · derived from FFT ${fftSize} · ${a}`;
    default:
      return `${mode} BANDS · grouped from 1/3 OCT · ${a}`;
  }
}

// ---- Bar-glass geometry (height-parametric; dBFS → pixels) ----------------
// Rack conversion 2026-08-23: the chart fills whatever glass the rack grants
// (LiveSpectrumEq idiom) — the y mapping is computed per-render from the glass
// height inside RtaGlass. Values above 0 dBFS climb into the headroom zone;
// only the SVG edge (y=2) limits geometry — numbers are never clamped (F1).
const FLOOR_DB = -90; // display floor — levels below draw no bar
const ZERO_Y = 16; // 0 dBFS gridline; the zone above is REAL headroom (F1)

const GRID_DBS = [0, -30, -60, FLOOR_DB];
const GRID_DBS_MINOR = [-15, -45, -75];
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;

// Visual standards 2026-07-29 rule 2 — chart chrome + LED palette. Copied
// locally from the fxViz grammar (shared idiom, not a cross-feature import).
// Graticule lifted (owner 2026-08-05): the marks were near-invisible on black.
const PLOT_BG = '#0c0c0f';
const GRID = '#333846';
const GRID_MINOR = '#262b36';
const AXIS = '#5a6376'; // 0 dBFS reference — brighter than the graticule
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

// ---- Level weighting (owner 2026-08-17) ------------------------------------
// The top-left readout can weight the broadband LEVEL: Z (flat), A, or C. On
// this UNCALIBRATED tool everything stays in the dBFS domain (weighting only
// changes which frequencies are emphasised before summing — it is NOT dB SPL),
// so the honest unit is dBFS(A)/dBFS(C), never bare dBA/dBC. Reads the engine's
// Fast weighted level from the same meter frame the PEAK cells use.
type Weighting = 'Z' | 'A' | 'C';
const WEIGHTINGS: readonly Weighting[] = ['C', 'A', 'Z'] as const; // bezel LEVEL cell tap-cycle order
/** Level unit per weighting (owner rev 24: dBA/dBC, never default dBFS). Z is
 *  unweighted → plain relative dB. Honesty (uncalibrated, relative, not SPL)
 *  lives in the accuracy note + subtitle, not in a confusing dBFS unit. */
const weightUnit = (w: Weighting): string => (w === 'Z' ? 'dB' : `dB${w}`);
/** The engine's Fast weighted level for the chosen weighting. */
const weightedFastDb = (m: MeterFrame | null | undefined, w: Weighting): number | undefined => {
  if (!m) return undefined;
  return w === 'A' ? m.aFastDb : w === 'C' ? m.cFastDb : m.zFastDb;
};

// LevelCell/StatCell (the old stat grid) are GONE (rack 2026-08-23): LEVEL,
// PK HOLD and BANDS now read on the rack's bezel strip — LEVEL taps to cycle
// the C/A/Z weighting, PK HOLD taps to reset (clip latch tints it red), and
// every cell keeps its long-press guided lesson via readoutKey.

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
 *  and short bars only ever show the deep end.
 *  RACK 2026-08-23: height-parametric — the chart fills whatever glass the
 *  stage grants (LiveSpectrumEq idiom), with the piano map stacked inside the
 *  glass when toggled on. */
function RtaGlass({
  w,
  h,
  bands,
  mode,
  alpha,
  fftSize,
  midiColors,
  flatColor,
  pianoOn,
  pitchIdx,
}: {
  w: number;
  h: number;
  bands: DisplayBands | null;
  mode: BandMode;
  alpha: number;
  fftSize: number;
  /** COLORS toggle (owner 2026-08-05): recolour the columns with the app-wide
   *  MIDI level ramp (red at 0 dBFS → blue at the floor) instead of the LED ramp. */
  midiColors?: boolean;
  /** Custom flat bar colour (Academy member, owner rule 2026-08-20) — used only
   *  when COLORS (the MIDI ramp) is OFF; null = the default blue gradient. */
  flatColor?: string | null;
  pianoOn: boolean;
  pitchIdx: number | null;
}) {
  const GUTTER = 32;
  const HEAD_H = 18;
  const LABEL_H = 16;
  const PIANO_BLOCK = PIANO_H + 14; // keybed + C-octave label row
  const chartW = Math.max(0, w - GUTTER - 8);
  const chartH = Math.max(60, h - HEAD_H - LABEL_H - (pianoOn ? PIANO_BLOCK + 2 : 0) - 6);
  const floorY = chartH - 8;
  const pxPerDb = (floorY - ZERO_Y) / -FLOOR_DB;
  /** dBFS → y. Values above 0 dBFS climb into the headroom zone; only the SVG
   *  edge (y=2) limits geometry — numbers are never clamped (F1). */
  const yForDb = (db: number) => Math.max(2, ZERO_Y - db * pxPerDb);

  const n = bands ? bands.centers.length : 0;
  const barW = n > 0 && chartW > 0 ? chartW / n : 0;
  const labels = bands ? bandLabels(bands.centers) : [];
  const pad = barW > 3 ? 1 : 0.5;

  return (
    <View style={styles.glassBody}>
      <View style={styles.glassHead}>
        <Text accessibilityRole="header" style={styles.panelEyebrow}>LIVE RTA</Text>
        <Text style={styles.panelSettings}>{metaFor(mode, alpha, fftSize)}</Text>
      </View>

      <View style={styles.chartRow}>
        {/* dB gutter — dBFS scale marks matching the gridlines. */}
        <View style={[styles.gutter, { height: chartH }]}>
          {GRID_DBS.map((db) => (
            <Text key={db} style={[styles.gutterLabel, { top: yForDb(db) - 8 }]}>
              {db}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {chartW > 0 && (
            <Svg width={chartW} height={chartH}>
              <Defs>
                {/* Shared LED ramp — one def for every bar (perf discipline). */}
                <LinearGradient
                  id="rtaBarFill"
                  x1="0"
                  y1={ZERO_Y}
                  x2="0"
                  y2={floorY}
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor={BAR_HOT} />
                  <Stop offset="0.13" stopColor={BAR_HI} />
                  <Stop offset="0.5" stopColor={BAR_MID} />
                  <Stop offset="1" stopColor={BAR_DEEP} />
                </LinearGradient>
                {/* MIDI level ramp — red (0 dBFS/full scale) → blue (floor). */}
                <LinearGradient
                  id="rtaBarFillMidi"
                  x1="0"
                  y1={ZERO_Y}
                  x2="0"
                  y2={floorY}
                  gradientUnits="userSpaceOnUse"
                >
                  {LOUDNESS_STOPS.map((s) => (
                    <Stop key={s.pos} offset={String(s.pos)} stopColor={s.color} />
                  ))}
                </LinearGradient>
              </Defs>
              {/* Plot bed — the rack's recessed glass provides the frame. */}
              <Rect x={0} y={0} width={chartW} height={chartH} rx={8} fill={PLOT_BG} />
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
                        height={floorY - ZERO_Y}
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
                          {/* LED column: shared hot-top→deep-base ramp (or the
                              MIDI level ramp when COLORS is on). */}
                          <Rect
                            x={x}
                            y={barTop}
                            width={w}
                            height={floorY - barTop}
                            fill={midiColors ? 'url(#rtaBarFillMidi)' : (flatColor ?? 'url(#rtaBarFill)')}
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

      {/* Piano map stacked inside the glass (owner 2026-08-05) when toggled.
          The honesty line moved verbatim to the stage badge; the gray-band
          note reads in the well. */}
      {pianoOn && <PianoStrip bands={bands} highlightIdx={pitchIdx} />}
    </View>
  );
}

// ---- Piano map (owner 2026-08-05) ------------------------------------------
// A keyboard under the display showing where each note's fundamental lines up
// with the frequency axis, low → high, left → right. Keys are placed by mapping
// their Hz onto the SAME axis the bars use (log-interpolated through the band
// centers) so a key sits directly beneath the band it belongs to. Aligned to
// the chart by mirroring the panel's dB-gutter width.
const PIANO_H = 44;
const KEYBED = '#ece9f0';
const KEY_LINE = '#9a97a6';
const KEY_BLACK = '#141319';
const KEY_HILITE = '#37c6ff'; // detected-note highlight (accent cyan)
/** Semitone offsets (from C) that are black keys. */
const BLACK_SET = new Set([1, 3, 6, 8, 10]);
const NOTE_C0 = 16.351598; // Hz — C0; note n semitones up = C0 · 2^(n/12).

// ---- Dominant-pitch highlight (owner 2026-08-10) ---------------------------
// With the piano shown, analyse the fine FFT spectrum, find the strongest tonal
// peak, and track which musical note it lands on MOST CONSTANTLY over a short
// window — then light that key. A steady tone locks a key; noise/chords/silence
// light nothing (no false readout).
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** Note label in this screen's C0-based index (matches the keybed's C-labels). */
function noteLabel(idx: number): string {
  return `${NOTE_NAMES[((idx % 12) + 12) % 12]}${Math.floor(idx / 12)}`;
}
/** Nearest note index (0 = C0) for a frequency. */
function hzToNoteIdx(hz: number): number {
  return Math.round(12 * Math.log2(hz / NOTE_C0));
}
const PITCH_POLL_MS = 80; // ~12.5 detections/s
const PITCH_WINDOW = 14; // ~1.1 s of history for the "most constant" vote
const PITCH_MIN_SHARE = 0.55; // winner must hold ≥55% of recent detections
const PITCH_PROMINENCE_DB = 12; // peak must stand this far above the mean bin
const PITCH_LO_HZ = 27.5; // A0 — below this, fundamentals aren't reliable here
const PITCH_HI_HZ = 5000; // musical fundamentals of interest top out well below

/** The strongest tonal peak in the fine spectrum, or null when nothing stands
 *  out (silence, broadband noise). Parabolic-interpolated for sub-bin accuracy;
 *  gated on PROMINENCE (peak vs mean) so it is scale/calibration independent. */
function detectPeakHz(spec: Float32Array, sampleRate: number, fftSize: number): number | null {
  const hzPerBin = sampleRate / fftSize;
  if (hzPerBin <= 0) return null;
  const lo = Math.max(1, Math.floor(PITCH_LO_HZ / hzPerBin));
  const hi = Math.min(spec.length - 2, Math.ceil(PITCH_HI_HZ / hzPerBin));
  if (hi <= lo) return null;
  let peak = -Infinity;
  let pi = -1;
  let sum = 0;
  let count = 0;
  for (let i = lo; i <= hi; i++) {
    const v = spec[i];
    sum += v;
    count += 1;
    if (v > peak) {
      peak = v;
      pi = i;
    }
  }
  if (pi < 1 || count === 0) return null;
  if (peak - sum / count < PITCH_PROMINENCE_DB) return null; // no clear tone
  // Parabolic peak interpolation in the dB domain.
  const a = spec[pi - 1];
  const b = spec[pi];
  const c = spec[pi + 1];
  const denom = a - 2 * b + c;
  const delta = denom !== 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / denom)) : 0;
  return (pi + delta) * hzPerBin;
}

/** Fractional band-index for a frequency (log-interpolated through centers) —
 *  the axis the bars are drawn on. */
function fracIndexForHz(hz: number, centers: number[]): number | null {
  const n = centers.length;
  if (n === 0 || hz <= 0) return null;
  const lf = Math.log2(hz);
  if (lf <= Math.log2(centers[0])) return 0;
  if (lf >= Math.log2(centers[n - 1])) return n - 1;
  for (let i = 1; i < n; i++) {
    const a = Math.log2(centers[i - 1]);
    const b = Math.log2(centers[i]);
    if (lf <= b) return i - 1 + (lf - a) / (b - a || 1);
  }
  return n - 1;
}

function PianoStrip({ bands, highlightIdx }: { bands: DisplayBands | null; highlightIdx: number | null }) {
  const [w, setW] = useState(0);
  const centers = bands?.centers ?? [];
  const n = centers.length;
  const barW = n > 0 && w > 0 ? w / n : 0;
  const xForHz = (hz: number): number | null => {
    const fi = fracIndexForHz(hz, centers);
    return fi == null ? null : (fi + 0.5) * barW;
  };

  // C0 (~16 Hz) … C10 covers the full audible span; only notes that fall inside
  // the axis get drawn. White separators + black keys + C-octave labels.
  const whiteXs: number[] = [];
  const blackKeys: { x: number }[] = [];
  const octaveLabels: { x: number; text: string }[] = [];
  // The detected note's on-axis position (owner 2026-08-10) — lit if in range.
  let hi: { x: number; black: boolean; label: string } | null = null;
  if (w > 0 && n > 0) {
    for (let midi = 0; midi <= 120; midi++) {
      const hz = NOTE_C0 * Math.pow(2, midi / 12);
      const x = xForHz(hz);
      if (x == null) continue;
      const semi = midi % 12;
      const black = BLACK_SET.has(semi);
      if (black) blackKeys.push({ x });
      else whiteXs.push(x);
      if (semi === 0) octaveLabels.push({ x, text: `C${Math.floor(midi / 12)}` });
      if (highlightIdx != null && midi === highlightIdx) hi = { x, black, label: noteLabel(midi) };
    }
  }
  const hiBw = Math.max(6, barW * 0.7);

  return (
    <View style={styles.pianoRow}>
      <View style={styles.pianoGutter} />
      <View style={styles.pianoArea} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
        {w > 0 && n > 0 && (
          <Svg width={w} height={PIANO_H}>
            {/* Keybed */}
            <Rect x={0} y={0} width={w} height={PIANO_H} rx={4} fill={KEYBED} />
            {/* Detected-note highlight UNDER the keys/lines (owner 2026-08-10). */}
            {hi && !hi.black && (
              <Rect x={hi.x - hiBw / 2} y={1} width={hiBw} height={PIANO_H - 2} rx={2.5} fill={KEY_HILITE} />
            )}
            {/* White-key separators */}
            {whiteXs.map((x, i) => (
              <Line key={`w-${i}`} x1={x} y1={0} x2={x} y2={PIANO_H} stroke={KEY_LINE} strokeWidth={0.75} />
            ))}
            {/* Black keys — upper ~60%, centered on their Hz position */}
            {blackKeys.map((k, i) => {
              const bw = Math.max(2, barW * 0.55);
              return (
                <Rect
                  key={`b-${i}`}
                  x={k.x - bw / 2}
                  y={0}
                  width={bw}
                  height={PIANO_H * 0.62}
                  rx={1.5}
                  fill={KEY_BLACK}
                />
              );
            })}
            {/* A lit BLACK key glows in the accent instead of ink. */}
            {hi && hi.black && (
              <Rect
                x={hi.x - Math.max(2, barW * 0.55) / 2}
                y={0}
                width={Math.max(2, barW * 0.55)}
                height={PIANO_H * 0.62}
                rx={1.5}
                fill={KEY_HILITE}
              />
            )}
          </Svg>
        )}
        {/* C-octave labels under the keybed */}
        <View style={styles.pianoLabelRow}>
          {octaveLabels.map((l) => (
            <Text key={l.text} style={[styles.pianoLabel, { left: l.x - 12 }]}>
              {l.text}
            </Text>
          ))}
        </View>
        {/* Detected-note readout, pinned above its key. */}
        {hi && <Text style={[styles.pianoNote, { left: Math.max(0, Math.min(w - 36, hi.x - 18)) }]}>♪ {hi.label}</Text>}
      </View>
    </View>
  );
}

export function RtaScreen({ navigation }: Props) {
  const { help, helpAll, sheet } = useToolHelp('rta');
  const insets = useSafeAreaInsets();

  // Ref-stable config object: useDspEngine's start() closes over the object we
  // pass on mount, so settings changes MUTATE it (then live-apply below) —
  // a fresh object per render would leave START pushing stale settings.
  // spectrumEnabled is ALWAYS on (bug fix 2026-08-01): the native engine only
  // runs the FFT when spectrum is enabled, and the octave-band frame is derived
  // from that FFT — so with it OFF, getBandsFrame() came back empty and the
  // native band modes (7/10/15/31) drew nothing. Keeping the FFT running fills
  // the bands for every mode and removes the warm-up delay when selecting 61.
  const cfg = useRef<EngineConfig>({
    fftSize: FFT_SIZE,
    fraction: 3,
    spectrumEnabled: true,
    bandAvgAlpha: DEFAULT_ALPHA,
  }).current;
  const [mode, setMode] = useState<BandMode>(31);
  const [alpha, setAlpha] = useState(DEFAULT_ALPHA);
  // Top-left LEVEL weighting (owner 2026-08-17): Z (flat) · A · C, dBFS domain.
  const [weighting, setWeighting] = useState<Weighting>('Z');
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
      // spectrumEnabled stays ON for every mode (see cfg note) — the FFT must
      // keep running so the native band frame is populated. Reconfigure ONLY
      // when the octave FRACTION changes (10 = 1/1, everything else = 1/3);
      // 7↔︎15↔︎31↔︎61 all ride the same native 1/3-oct FFT.
      const needsConfig = cfg.fraction !== wantFraction;
      cfg.fraction = wantFraction;
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

  // HI-RES / low-frequency detail (owner 2026-08-21): doubling the FFT halves the
  // bin width (~5.9 → ~2.9 Hz at 48 k), so the sub-bass 1/6-oct bands that were
  // grayed as unresolvable (band narrower than a bin) become resolvable — down to
  // ~30 Hz instead of ~55. Trade-off: a longer window = slower time response.
  // 16384 is the engine's Q5 ceiling and fits the 32768 rolling buffer, so this
  // is a pure config change (no native work).
  const [hiRes, setHiRes] = useState(false);
  const fftSize = hiRes ? HIRES_FFT : FFT_SIZE;
  const applyHiRes = useCallback(
    (on: boolean) => {
      if (on === hiRes) return;
      cfg.fftSize = on ? HIRES_FFT : FFT_SIZE;
      setHiRes(on);
      clearDerived(); // bin geometry changed — stale holds/smoothing would lie
      ApeDsp.setEngineConfig(cfg);
    },
    [cfg, hiRes, clearDerived],
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

  // Clip latch (owner 2026-08-05): PEAK / PEAK HOLD numbers are neutral until an
  // actual clip (≥ 0 dBFS), then stay RED (+ red frame on PEAK HOLD) until the
  // user hits RESET PEAK.
  const [hasClipped, setHasClipped] = useState(false);
  // Display toggles (owner 2026-08-05): recolor the bars with the MIDI level
  // ramp (persisted, first-ever default ON — item 7), and a piano keyboard.
  const [colorsOn, setColorsOn] = useColorModePref();
  // Custom flat bar colour (member-gated) — used when COLORS (the MIDI ramp) is
  // off (owner rule 2026-08-20). BAR_HOT is the default gradient's top colour.
  const [rtaColor, setRtaColor] = useToolColorPref('ape:tools:rtaColor');
  const [pianoOn, setPianoOn] = useState(false);

  // DOMINANT-PITCH tracking (owner 2026-08-10): while the piano is shown, poll
  // the fine spectrum, detect the strongest tonal peak, and light the note it
  // lands on MOST CONSTANTLY over a ~1 s window. Steady tone → locked key;
  // noise / chords / silence → nothing lit.
  const pitchRingRef = useRef<(number | null)[]>([]);
  const [pitchIdx, setPitchIdx] = useState<number | null>(null);
  useEffect(() => {
    if (!pianoOn || state !== 'running') {
      pitchRingRef.current = [];
      setPitchIdx(null);
      return;
    }
    const id = setInterval(() => {
      const meta = ApeDsp.getSpectrumMeta();
      const spec = ApeDsp.getSpectrum();
      if (!meta || meta.sampleRate <= 0 || meta.fftSize <= 0 || spec.length === 0) return;
      const hz = detectPeakHz(spec, meta.sampleRate, meta.fftSize);
      const ring = pitchRingRef.current;
      ring.push(hz != null ? hzToNoteIdx(hz) : null);
      if (ring.length > PITCH_WINDOW) ring.shift();
      // Most CONSTANT note across the window (mode of the recent detections).
      const counts = new Map<number, number>();
      let valid = 0;
      for (const m of ring) {
        if (m == null) continue;
        counts.set(m, (counts.get(m) ?? 0) + 1);
        valid += 1;
      }
      let best: number | null = null;
      let bestC = 0;
      counts.forEach((c, m) => {
        if (c > bestC) {
          bestC = c;
          best = m;
        }
      });
      const stable =
        best != null &&
        valid >= Math.ceil(0.5 * ring.length) &&
        bestC >= Math.ceil(PITCH_MIN_SHARE * ring.length);
      setPitchIdx(stable ? best : null);
    }, PITCH_POLL_MS);
    return () => clearInterval(id);
  }, [pianoOn, state]);

  /** RESET PEAK: native hold (unchanged call) + the derived-mode holds + clip latch. */
  const onResetPeak = useCallback(() => {
    groupHoldRef.current.clear();
    sixthHoldRef.current.fill(NO_LEVEL);
    resetPeakHold();
    setHasClipped(false);
  }, [resetPeakHold]);

  // STOP must not collapse the tool back to the intro card (that shrinks the
  // ScrollView and jumps the scroll). Hold the view mounted via micPaused; the
  // button toggles START/STOP in place. Cleared once we're truly running again.
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);

  const onStart = useCallback(() => {
    // Don't clear micPaused here (strobe fix 2026-08-01) — it flashes the frozen
    // panel out for a frame during 'starting'. It's cleared once running (above).
    clearDerived(); // a fresh run must not inherit a previous run's holds
    void start();
  }, [clearDerived, start]);

  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);

  // Go straight to the live tool on open — no redundant START screen (owner
  // 2026-08-01). A manual STOP still holds the tool on-screen (micPaused).
  useToolAutoStart(state, onStart, stop);

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
  const anyUnresolvable = displayBands != null && displayBands.resolvable.some((r) => !r);

  // LEVEL bezel cell: tap cycles the C/A/Z weighting (the old vertical unit
  // stack, condensed to the bezel's one-value grammar — same order, same
  // dBA/dBC-never-dBFS labeling via weightUnit).
  const cycleWeighting = useCallback(() => {
    setWeighting((w) => WEIGHTINGS[(WEIGHTINGS.indexOf(w) + 1) % WEIGHTINGS.length]);
  }, []);

  // Latch the clip flag the instant peak (or its hold) reaches 0 dBFS. Stays set
  // until RESET PEAK (owner 2026-08-05); this drives the red numbers + red frame.
  useEffect(() => {
    if (!meter) return;
    const p = meter.peakDb;
    const h = meter.peakHoldDb;
    if ((Number.isFinite(p) && p >= 0) || (Number.isFinite(h) && h >= 0)) setHasClipped(true);
  }, [meter]);

  // ---- Rack declarations (rebuilt every render — trays and bezel stay live) ----
  const levelDb = weightedFastDb(meter, weighting);
  const avgLabel = AVG_CHOICES.find((c) => c.alpha === alpha)?.label ?? `α ${alpha.toFixed(2)}`;

  /** Bezel: the old stat grid, printed on the display. LEVEL taps to cycle
   *  C/A/Z; PK HOLD taps to reset (clip latch tints it red until reset); MIC
   *  taps to pause/resume (LiveSpectrumEq idiom). Long-press = guided lesson. */
  const bezel: BezelItem[] = [
    {
      k: 'LEVEL',
      v: `${fmtDb(levelDb)} ${weightUnit(weighting)}`,
      tint: levelDb != null && Number.isFinite(levelDb) ? levelColorForDb(levelDb) : undefined,
      onPress: cycleWeighting,
      helpKey: readoutKey('LEVEL'),
      flex: 1.25,
    },
    {
      k: 'PK HOLD',
      v: fmtDb(meter?.peakHoldDb),
      tint: hasClipped
        ? '#ff5a48' // clip latch (owner 2026-08-05) — red until RESET
        : meter != null && Number.isFinite(meter.peakHoldDb)
          ? levelColorForDb(meter.peakHoldDb)
          : undefined,
      onPress: onResetPeak,
      helpKey: readoutKey('PEAK HOLD'),
    },
    { k: 'BANDS', v: String(mode), helpKey: readoutKey('BANDS'), flex: 0.7 },
    {
      k: 'MIC',
      v: state === 'running' ? 'LIVE' : micPaused ? 'PAUSED' : '—',
      tint: state === 'running' ? undefined : '#7a7f8a',
      onPress: state === 'running' ? onStop : onStart,
    },
  ];

  /** Dock (5 keys). No continuous param exists on this tool, so there is no
   *  fader — initialParam names the teaching-central BANDING tray and the
   *  lane hides itself. */
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'banding',
      label: 'BANDING',
      valueLabel: String(mode),
      options: BAND_MODES.map((m) => ({ id: String(m), label: String(m), blurb: BAND_BLURBS[m] })),
      selectedId: String(mode),
      onSelect: (id) => applyMode(Number(id) as BandMode),
      sticky: true, // teaching collection — A/B band counts while the glass reacts
      helpKey: 'banding',
    },
    {
      kind: 'group',
      id: 'avg',
      label: 'AVG',
      valueLabel: `${avgLabel}${hiRes ? '·HR' : ''}`,
      helpKey: 'averaging',
      // AVERAGING + RESOLUTION share one tray: both trade response speed for
      // steadiness/detail (interacting params — the group-tray graft). Exact
      // α mapping and STD/HI-RES semantics unchanged.
      render: () => (
        <View style={styles.trayCol}>
          <Text style={styles.trayHead}>AVERAGING</Text>
          <View style={styles.trayRow}>
            {AVG_CHOICES.map((c) => (
              <Chip key={c.label} label={c.label} active={alpha === c.alpha} onPress={() => applyAlpha(c.alpha)} />
            ))}
          </View>
          <Text style={styles.trayHead}>RESOLUTION</Text>
          <View style={styles.trayRow}>
            <Chip
              label="STD"
              active={!hiRes}
              onPress={() => applyHiRes(false)}
              a11yLabel="Standard resolution — faster response"
            />
            <Chip
              label="HI-RES"
              active={hiRes}
              onPress={() => applyHiRes(true)}
              a11yLabel="High resolution — reveals lower frequencies, slower response"
            />
          </View>
          <Text style={styles.settingsNote}>
            Changing banding, averaging, or resolution restarts the band average and peak hold (new
            settings epoch). HI-RES doubles the FFT for finer low-frequency detail (down to ~30 Hz) at
            a slower response.
          </Text>
        </View>
      ),
    },
    // Peak hold has no on/off in this tool — the control is RESET (spec §10),
    // kept as a plain action key; the PK HOLD bezel cell also taps to reset.
    { kind: 'action', id: 'rstpeak', label: 'RST PK', onPress: onResetPeak },
    {
      kind: 'group',
      id: 'display',
      label: 'DISPLAY',
      valueLabel: `${colorsOn ? 'MIDI' : rtaColor ? 'CUST' : 'LED'}${pianoOn ? '·♪' : ''}`,
      render: () => (
        <View style={styles.trayCol}>
          <Text style={styles.trayHead}>BAR COLOURS</Text>
          <View style={styles.trayRow}>
            <Chip
              label="COLORS"
              active={colorsOn}
              onPress={() => setColorsOn(!colorsOn)}
              a11yLabel="Toggle MIDI level colours on the display"
            />
            {/* Custom bar colour — discreet wheel, member-gated (owner rule
                2026-08-20). Gating lives inside ColorWheelButton, unchanged. */}
            <ColorWheelButton
              style={styles.rtaColorBtn}
              current={rtaColor}
              onPick={(c) => {
                setRtaColor(c);
                // Picking a custom colour auto-disables the level-ramp COLORS
                // toggle so the choice actually shows (owner 2026-08-21) — the
                // ramp otherwise overrides the flat colour.
                if (c) setColorsOn(false);
              }}
              accessibilityLabel="RTA bar colour"
              feature="the RTA bar colour"
              pickerTitle="RTA BAR COLOUR"
              pickerNote="Applies when COLORS (the level ramp) is off."
              size={22}
            />
          </View>
          <Text style={styles.trayHead}>PIANO MAP</Text>
          <View style={styles.trayRow}>
            <Chip
              label={pianoOn ? 'PIANO ON' : 'PIANO OFF'}
              active={pianoOn}
              onPress={() => setPianoOn((v) => !v)}
              a11yLabel="Toggle a piano keyboard under the display"
            />
          </View>
        </View>
      ),
    },
    // SAVE TRACE — exact §7 flow (onSaveTrace guards on running+bands itself).
    { kind: 'action', id: 'save', label: justSaved ? 'SAVED ✓' : 'SAVE', onPress: onSaveTrace },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>SPECTRUM ANALYZER / RTA</Text>
          <Text style={styles.subtitle}>Live RTA · relative · uncalibrated</Text>
        </View>
        <AccuracyNote compact detail="This tool runs on your phone’s UNCALIBRATED microphone — read every level as RELATIVE (A/C-weighted so it reads in a familiar scale), for learning, NOT a calibrated SPL reading. For accurate, absolute measurements use a calibrated SPL meter, measurement mic, or a dedicated instrument." />
      </View>

      {/* RACK UNIT — the frame owns the layout law: reading may scroll;
          operating may not. Stage+bezel+dock are pinned; only the well below
          scrolls. */}
      <RackUnit
        initialParam="banding"
        params={params}
        onHelp={(k) => {
          if (k) help(k);
        }}
        stage={{
          size: 'L', // the spectrum IS the tool
          // Honesty line — verbatim from the old in-panel unit line (hard rule).
          badge: 'relative dB · uncalibrated approximate',
          onGuide: helpAll,
          bezel,
          render: (w, h) => (
            // Tap-glass = pause/resume capture. The 2026-08-21 inert-display
            // workaround is retired: the stage sits OUTSIDE any ScrollView, so
            // a scroll-touch can no longer read as an accidental tap — the
            // original tap affordance is restored (LiveSpectrumEq idiom).
            <Pressable
              onPress={state === 'running' ? onStop : onStart}
              accessibilityRole="button"
              accessibilityLabel={state === 'running' ? 'Tap to stop capture' : 'Tap to start capture'}
              style={{ width: w, height: h }}
            >
              <RtaGlass
                w={w}
                h={h}
                bands={displayBands}
                mode={mode}
                alpha={alpha}
                fftSize={fftSize}
                midiColors={colorsOn}
                flatColor={rtaColor}
                pianoOn={pianoOn}
                pitchIdx={pitchIdx}
              />
            </Pressable>
          ),
        }}
      >
        {/* WELL — reading only. Honest not-ready card (absent/spike/denied/
            error) renders nothing when the engine is usable. */}
        <EngineGate state={state} lastError={lastError} />

        {/* Opens straight into the live tool (auto-start); a brief starting note
            bridges the mic warm-up instead of a redundant intro screen. */}
        {!micPaused && (state === 'idle' || state === 'starting') && (
          <Text style={styles.intro}>Starting the analyzer…</Text>
        )}

        {/* Q2 honesty note for the pinned glass — reads in the well. */}
        {anyUnresolvable && (
          <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>
        )}

        <Pressable
          onPress={() => navigation.navigate('ToolLibrary', { toolKey: 'rta' })}
          accessibilityRole="button"
          accessibilityLabel="View saved measurements"
        >
          <Text style={styles.libraryLink}>VIEW SAVED MEASUREMENTS ›</Text>
        </Pressable>

        {/* Live quality warnings (spec §6) — notices at the very bottom of the
            well (owner tools rule): the "input is uncalibrated…" note reads
            last. */}
        {liveFlags.map((f) => (
          <Text key={f} style={styles.liveWarn}>
            ⚠ {WARNING_INFO[f].message} {WARNING_INFO[f].hint}
          </Text>
        ))}

        {/* Required warnings (spec §10) — always visible, bottom of the well. */}
        <Text style={styles.reminder}>
          This display shows frequency energy, not automatic EQ advice. Microphone position
          strongly affects the result.
        </Text>
      </RackUnit>
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

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Live bar-graph glass (rack stage, height-parametric).
  glassBody: { flex: 1, paddingHorizontal: 4, paddingTop: 2 },
  glassHead: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  panelSettings: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  chartRow: { flexDirection: 'row' },
  gutter: { width: 32 },
  gutterLabel: {
    position: 'absolute',
    right: 4,
    width: 28,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
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
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSubAlt },

  // The old stat-grid / LEVEL-toggle styles are gone: those readouts live on
  // the rack bezel now (BezelReadouts owns the skin).

  // Live warning line (spec §6) — amber, plain language.
  liveWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },

  // Tray composition (AVG · DISPLAY group trays) — chips in labeled rows.
  trayCol: { gap: 10 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  trayRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
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

  // Discreet colour-wheel button in the DISPLAY tray (owner rule 2026-08-20).
  rtaColorBtn: {
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#18181c',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Piano map strip (owner 2026-08-05).
  pianoRow: { flexDirection: 'row', marginTop: 2 },
  pianoGutter: { width: 32 },
  pianoArea: { flex: 1 },
  pianoLabelRow: { height: 14 },
  pianoLabel: {
    position: 'absolute',
    top: 0,
    width: 24,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSub,
    textAlign: 'center',
  },
  // Detected-note readout, pinned over its lit key (owner 2026-08-10).
  pianoNote: {
    position: 'absolute',
    top: 1,
    width: 36,
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 11,
    color: '#04121b',
    textAlign: 'center',
  },

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
