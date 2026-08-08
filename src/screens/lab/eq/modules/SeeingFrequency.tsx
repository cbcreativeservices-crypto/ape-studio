/**
 * SeeingFrequency — EQ Lab module 1 (owner spec 2026-08-07, lessons 1+3: the
 * SIGNATURE MOMENT). Live 1/3-octave spectrum from the phone microphone with a
 * LOW-CUT / HIGH-PASS chip row (OFF · 20…160 Hz): raising the cutoff overlays
 * the theoretical filter curve on the live spectrum so the student physically
 * watches it cover the low end of their own room.
 *
 * Honesty rules (same grammar as RtaScreen, the shared chart idiom copied
 * locally per house rule):
 *  - bars = REAL native band frame only; Q2 gray slots for unresolvable bands;
 *  - the HPF curve is a DESIGNED RESPONSE — ANALYTIC overlay (fxViz grammar,
 *    amber): the analyzer keeps showing the room UNFILTERED — the curve shows
 *    what a low-cut WOULD remove, and says so;
 *  - phone-mic caveat stated unobtrusively (spec ruling);
 *  - never teach "visible LF ⇒ remove it" — remove UNWANTED energy while
 *    preserving useful content (spec ruling).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { EngineConfig } from '../../../../../modules/ape-dsp';
import { useDspEngine, useToolAutoStart } from '../../../../features/tools/engine/useDspEngine';
import { LOUDNESS_STOPS } from '../../../../features/tools/levelColor';
import { butterworthHighPassDb } from '../../../../features/lab/fxViz';
import { colors, fonts } from '../../../../theme/tokens';
import { EngineGate } from '../../../tools/EngineGate';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const FFT_SIZE = 8192;

/** The spec's cutoff ladder — OFF first, then 20 → 160 Hz. */
const HPF_CHOICES = [20, 40, 60, 80, 100, 120, 160] as const;

// ---- Bar-panel geometry (dBFS → pixels; RtaScreen idiom, local copy) -------
const PANEL_H = 252;
const FLOOR_DB = -90;
const ZERO_Y = 16;
const FLOOR_Y = 244;
const PX_PER_DB = (FLOOR_Y - ZERO_Y) / -FLOOR_DB;
const yForDb = (db: number) => Math.max(2, ZERO_Y - db * PX_PER_DB);

const GRID_DBS = [0, -30, -60, FLOOR_DB];
const GRID_DBS_MINOR = [-15, -45, -75];
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;

// Chart chrome (visual standards rule 2 — shared idiom, local copy).
const PLOT_BG = '#0c0c0f';
const PLOT_FRAME = '#3a4150';
const GRID = '#333846';
const GRID_MINOR = '#262b36';
const AXIS = '#5a6376';
const CAP_HALO = '#7fd4ff';
const CAP_CORE = '#d9f1ff';
const PEAK_TICK = '#ffe8b0';
const SLOT_GRAY = '#55555f';
const CURVE_AMBER = '#ffc64d';

/** Hz → fractional band index on the log-even center grid (for overlay x). */
function fracIndexForHz(f: number, centers: number[]): number {
  const n = centers.length;
  if (n < 2) return 0;
  if (f <= centers[0]) {
    return Math.log(f / centers[0]) / Math.log(centers[1] / centers[0]);
  }
  if (f >= centers[n - 1]) {
    return n - 1 + Math.log(f / centers[n - 1]) / Math.log(centers[n - 1] / centers[n - 2]);
  }
  for (let i = 0; i < n - 1; i++) {
    if (f <= centers[i + 1]) {
      return i + Math.log(f / centers[i]) / Math.log(centers[i + 1] / centers[i]);
    }
  }
  return n - 1;
}

/** Nearest band index per labeled center (RtaScreen idiom). */
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

export function SeeingFrequencyModule(_p: EqModuleComponentProps) {
  // Ref-stable config (RtaScreen rule): useDspEngine's start() closes over this
  // object. spectrumEnabled MUST stay true — the native engine only runs the
  // FFT when spectrum is enabled and the band frame is derived from that FFT.
  const cfg = useRef<EngineConfig>({
    fftSize: FFT_SIZE,
    fraction: 3,
    spectrumEnabled: true,
    bandAvgAlpha: 0.35,
  }).current;
  const { state, frames, start, stop, lastError } = useDspEngine(cfg, { bands: true });

  // Low-cut selection — null = OFF (the lesson starts with the filter off).
  const [hpfHz, setHpfHz] = useState<number | null>(null);

  // STOP holds the frozen panel on-screen instead of collapsing (RTA idiom).
  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);
  const onStart = useCallback(() => void start(), [start]);
  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);
  // Straight into the live tool on open (owner 2026-08-01 auto-start rule).
  useToolAutoStart(state, onStart);

  const bands = frames.bands;
  const [chartW, setChartW] = useState(0);
  const n = bands ? bands.centers.length : 0;
  const barW = n > 0 && chartW > 0 ? chartW / n : 0;
  const labels = bands ? bandLabels(bands.centers) : [];
  const anyUnresolvable = bands != null && bands.resolvable.some((r) => !r);
  const pad = barW > 3 ? 1 : 0.5;

  /** X pixel for a frequency on the current band grid. */
  const xForHz = useCallback(
    (f: number) => {
      if (!bands || barW <= 0) return 0;
      const idx = fracIndexForHz(f, bands.centers);
      return Math.min(chartW - 2, Math.max(2, (idx + 0.5) * barW));
    },
    [bands, barW, chartW],
  );

  /** The analytic HPF response curve, drawn OVER the now-rolled-off bars as a
   *  reference of the filter's shape. 12 dB/oct Butterworth (mirrors the native
   *  Biquad); slope choices arrive with the Slopes module. */
  const hpfPaths = useMemo(() => {
    if (hpfHz == null || !bands || barW <= 0 || chartW <= 0) return null;
    const PTS = 96;
    let curve = '';
    for (let k = 0; k <= PTS; k++) {
      const f = 20 * Math.pow(2, (10 * k) / PTS); // 20 Hz … ~20.48 kHz, log-even
      const g = Math.min(0, butterworthHighPassDb(hpfHz, f));
      const y = Math.min(FLOOR_Y, yForDb(g));
      curve += `${k === 0 ? 'M' : 'L'}${xForHz(f).toFixed(1)} ${y.toFixed(1)}`;
    }
    return { curve };
  }, [hpfHz, bands, barW, chartW, xForHz]);

  const live = state === 'running' || micPaused;

  return (
    <View style={styles.root}>
      {/* Signature-moment framing (spec: appears very early, before any EQ). */}
      <GlossaryText style={styles.body}>
        Your room isn’t silent at low frequencies. Watch the lower end of the spectrum — HVAC,
        traffic, handling noise, vibration and wind put energy below 100 Hz even when you don’t
        perceive much sound.
      </GlossaryText>

      {/* Honest not-ready card (absent/spike/denied/error). */}
      <EngineGate state={state} lastError={lastError} />
      {!micPaused && (state === 'idle' || state === 'starting') && (
        <Text style={styles.starting}>Starting the analyzer…</Text>
      )}

      {live && (
        <>
          {/* Tapping the display toggles START/STOP (standing rule 2026-07-31). */}
          <Pressable
            onPress={state === 'running' ? onStop : onStart}
            accessibilityRole="button"
            accessibilityLabel={state === 'running' ? 'Tap to stop capture' : 'Tap to start capture'}
          >
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={[styles.panelEyebrow, { flexShrink: 1 }]}>
                  LIVE SPECTRUM OF YOUR ENVIRONMENT RIGHT NOW
                </Text>
                <Text style={styles.panelSettings}>1/3 OCT · FFT {FFT_SIZE}</Text>
              </View>
              <View style={styles.chartRow}>
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
                        {/* App-wide MIDI level ramp anchored to the dB scale —
                            loudness colour standard (blue floor → red 0 dBFS). */}
                        <LinearGradient
                          id="eqSpecFill"
                          x1="0"
                          y1={ZERO_Y}
                          x2="0"
                          y2={FLOOR_Y}
                          gradientUnits="userSpaceOnUse"
                        >
                          {LOUDNESS_STOPS.map((s) => (
                            <Stop key={s.pos} offset={String(s.pos)} stopColor={s.color} />
                          ))}
                        </LinearGradient>
                      </Defs>
                      <Rect x={0} y={0} width={chartW} height={PANEL_H} rx={8} fill={PLOT_BG} />
                      <Rect x={0.5} y={0.5} width={chartW - 1} height={PANEL_H - 1} rx={7.5} stroke={PLOT_FRAME} strokeWidth={1} fill="none" />
                      {GRID_DBS_MINOR.map((db) => (
                        <Line key={db} x1={2} y1={yForDb(db)} x2={chartW - 2} y2={yForDb(db)} stroke={GRID_MINOR} strokeWidth={0.75} />
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
                            // Q2 honest gray-out: dim slot, NO bar, NO tick.
                            return (
                              <Rect key={`slot-${c}`} x={x} y={ZERO_Y} width={w} height={FLOOR_Y - ZERO_Y} fill={SLOT_GRAY} fillOpacity={0.14} />
                            );
                          }
                          // Apply the low-cut to the DISPLAYED bars (owner
                          // 2026-08-07): the filter actually rolls the low end
                          // off, not just an overlay. 12 dB/oct.
                          const roll = hpfHz != null ? butterworthHighPassDb(hpfHz, c) : 0;
                          const level = bands.levelsDb[i] + roll;
                          const peak = bands.peakHoldDb[i] + roll;
                          const barTop = yForDb(level);
                          return (
                            <G key={`band-${c}`}>
                              {level > FLOOR_DB && (
                                <>
                                  <Rect x={x} y={barTop} width={w} height={FLOOR_Y - barTop} fill="url(#eqSpecFill)" fillOpacity={0.96} />
                                  <Rect x={x - 0.75} y={barTop - 2.5} width={w + 1.5} height={5} rx={1.5} fill={CAP_HALO} fillOpacity={0.22} />
                                  <Rect x={x} y={barTop - 1.1} width={w} height={2.2} rx={1} fill={CAP_CORE} fillOpacity={0.95} />
                                </>
                              )}
                              {peak > FLOOR_DB && (
                                <Rect x={x + w * 0.1} y={yForDb(peak) - 1} width={w * 0.8} height={2} rx={1} fill={PEAK_TICK} fillOpacity={0.95} />
                              )}
                            </G>
                          );
                        })}
                      {/* HPF OFF: a static dashed marker frames the lesson —
                          "look below 100 Hz". ON: the analytic curve + the
                          shaded wedge it would remove take over. */}
                      {bands != null && hpfHz == null && (
                        <Line
                          x1={xForHz(100)}
                          y1={ZERO_Y}
                          x2={xForHz(100)}
                          y2={FLOOR_Y}
                          stroke={CURVE_AMBER}
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          strokeOpacity={0.55}
                        />
                      )}
                      {/* The filter's response, over the now-rolled-off bars. */}
                      {hpfPaths != null && (
                        <Path d={hpfPaths.curve} stroke={CURVE_AMBER} strokeWidth={2} fill="none" strokeOpacity={0.9} />
                      )}
                    </Svg>
                  )}
                  <View style={styles.labelRow}>
                    {/* The extreme low end is labeled explicitly on the left
                        (owner 2026-08-07) — what frequency the leftmost band is. */}
                    {chartW > 0 && bands != null && bands.centers.length > 0 && (
                      <Text style={[styles.freqLabel, styles.freqLabelEdge, { left: 0 }]}>
                        {Math.round(bands.centers[0])} Hz
                      </Text>
                    )}
                    {chartW > 0 &&
                      labels.map((l) => (
                        <Text key={l.text} style={[styles.freqLabel, { left: (l.i + 0.5) * barW - 24 }]}>
                          {l.text}
                        </Text>
                      ))}
                  </View>
                </View>
              </View>
              <Text style={[styles.unitLine, hpfHz == null && styles.unitLineCallout]}>
                {hpfHz == null
                  ? '◂ look below 100 Hz — what energy lives there even when the room seems quiet?'
                  : `HPF ${hpfHz} Hz · 12 dB/OCT — the low end is rolled off; amber = the filter’s response`}
              </Text>
              {anyUnresolvable && (
                <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>
              )}
            </View>
          </Pressable>

          {/* LOW-CUT / HIGH-PASS FILTER — the spec's cutoff ladder. */}
          <Text style={styles.sectionTitle}>LOW-CUT / HIGH-PASS FILTER</Text>
          <View style={styles.chipRow}>
            <Chip label="OFF" active={hpfHz == null} onPress={() => setHpfHz(null)} />
            {HPF_CHOICES.map((hz) => (
              <Chip key={hz} label={`${hz}`} active={hpfHz === hz} onPress={() => setHpfHz(hz)} />
            ))}
          </View>
          <Text style={styles.caption}>
            The amber curve is the filter’s designed response — the analyzer keeps showing your room
            unfiltered, so you can see exactly what a low-cut at each frequency would remove.
          </Text>

          <Text style={styles.body}>
            This is why low-cut controls appear on microphones, consoles, preamps and channel
            strips. The lesson is not “low frequencies are bad”: remove UNWANTED low-frequency
            energy while preserving useful content.
          </Text>
        </>
      )}

      {/* Spec ruling: the caveat is stated, but unobtrusively. */}
      <Text style={styles.caveat}>
        A phone microphone is an educational measurement source, not a calibrated reference.
      </Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label === 'OFF' ? 'Low cut off' : `Low cut ${label} hertz`}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  starting: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 2 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  caveat: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: '#6b6f7a', marginTop: 4 },

  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  panelSettings: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  chartRow: { flexDirection: 'row', gap: 6 },
  gutter: { width: 26, height: PANEL_H },
  gutterLabel: { position: 'absolute', right: 0, fontFamily: fonts.mono, fontSize: 10, color: colors.textSub },
  chartArea: { flex: 1, height: PANEL_H + 18 },
  labelRow: { position: 'absolute', top: PANEL_H + 2, left: 0, right: 0, height: 14 },
  freqLabel: { position: 'absolute', width: 48, textAlign: 'center', fontFamily: fonts.mono, fontSize: 10, color: colors.textSub },
  freqLabelEdge: { textAlign: 'left', color: colors.amber },
  unitLine: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSub },
  // The "look below 100 Hz" invitation reads amber (owner 2026-08-07).
  unitLineCallout: { color: colors.amber },
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: '#7a7f8a' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#17171c' },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
});
