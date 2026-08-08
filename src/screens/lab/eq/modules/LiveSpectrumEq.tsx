/**
 * LiveSpectrumEq — EQ Lab lesson 12 (owner spec 2026-08-07): everything
 * together — the phone-mic 1/3-octave spectrum with the designed EQ response
 * overlaid. Toggle SPECTRUM | EQ | COMBINED, then point the phone around the
 * room and work the guided challenges (find the low end · try a low cut ·
 * change the slope · find a frequency).
 *
 * Honesty grammar matches Seeing Frequency (the panel idiom is a local copy —
 * house rule): REAL bands only, Q2 gray slots, and the EQ curve is a DESIGNED
 * RESPONSE — ANALYTIC overlay; the analyzer itself stays unfiltered.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { EngineConfig } from '../../../../../modules/ape-dsp';
import { useDspEngine, useToolAutoStart } from '../../../../features/tools/engine/useDspEngine';
import { LOUDNESS_STOPS } from '../../../../features/tools/levelColor';
import { eqResponseDb } from '../../../../features/lab/fxViz';
import { colors, fonts } from '../../../../theme/tokens';
import { EngineGate } from '../../../tools/EngineGate';
import { DragSlider } from '../../foundations/bits';
import { MiniBtn } from './eqBits';
import { butterworthHpDb, bwOctFromQ, fFromNorm, fmtHz, gainColor, normFromF } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const FFT_SIZE = 8192;
const HPF_CHOICES = [40, 80, 120] as const;
const SLOPES = [12, 24, 48] as const;

// ---- Bar-panel geometry (Seeing Frequency idiom, local copy) ---------------
const PANEL_H = 252;
const FLOOR_DB = -90;
const ZERO_Y = 16;
const FLOOR_Y = 244;
const PX_PER_DB = (FLOOR_Y - ZERO_Y) / -FLOOR_DB;
const yForDb = (db: number) => Math.max(2, ZERO_Y - db * PX_PER_DB);
const GRID_DBS = [0, -30, -60, FLOOR_DB];
const GRID_DBS_MINOR = [-15, -45, -75];
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;
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

function fracIndexForHz(f: number, centers: number[]): number {
  const n = centers.length;
  if (n < 2) return 0;
  if (f <= centers[0]) return Math.log(f / centers[0]) / Math.log(centers[1] / centers[0]);
  if (f >= centers[n - 1]) return n - 1 + Math.log(f / centers[n - 1]) / Math.log(centers[n - 1] / centers[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (f <= centers[i + 1]) return i + Math.log(f / centers[i]) / Math.log(centers[i + 1] / centers[i]);
  }
  return n - 1;
}
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

type ViewMode = 'spectrum' | 'eq' | 'combined';

const CHALLENGES: { title: string; copy: string }[] = [
  { title: 'FIND THE LOW END', copy: 'Watch the spectrum below 100 Hz. What energy exists even when the room seems quiet?' },
  { title: 'TRY A LOW CUT', copy: 'Set the HPF around 80 Hz. Compare the designed response with the filter OFF.' },
  { title: 'CHANGE THE SLOPE', copy: 'Keep the cutoff constant. Compare 12, 24 and 48 dB/octave — watch the skirt swing.' },
  { title: 'FIND A FREQUENCY', copy: 'Make a narrow parametric boost (high Q, +12 dB) and sweep it — watch which bands sit under it.' },
];

export function LiveSpectrumEqModule(_p: EqModuleComponentProps) {
  const cfg = useRef<EngineConfig>({
    fftSize: FFT_SIZE,
    fraction: 3,
    spectrumEnabled: true,
    bandAvgAlpha: 0.35,
  }).current;
  const { state, frames, start, stop, lastError } = useDspEngine(cfg, { bands: true });

  const [mode, setMode] = useState<ViewMode>('combined');
  const [hpfHz, setHpfHz] = useState<number | null>(null);
  const [slope, setSlope] = useState<(typeof SLOPES)[number]>(12);
  const [bellOn, setBellOn] = useState(false);
  const [bellF, setBellF] = useState(1000);
  const [bellG, setBellG] = useState(6);
  const [bellQ, setBellQ] = useState(2);

  const [micPaused, setMicPaused] = useState(false);
  useEffect(() => {
    if (state === 'running') setMicPaused(false);
  }, [state]);
  const onStart = useCallback(() => void start(), [start]);
  const onStop = useCallback(() => {
    setMicPaused(true);
    stop();
  }, [stop]);
  useToolAutoStart(state, onStart);

  const bands = frames.bands;
  const [chartW, setChartW] = useState(0);
  const n = bands ? bands.centers.length : 0;
  const barW = n > 0 && chartW > 0 ? chartW / n : 0;
  const labels = bands ? bandLabels(bands.centers) : [];
  const anyUnresolvable = bands != null && bands.resolvable.some((r) => !r);
  const pad = barW > 3 ? 1 : 0.5;

  const xForHz = useCallback(
    (f: number) => {
      if (!bands || barW <= 0) return 0;
      return Math.min(chartW - 2, Math.max(2, (fracIndexForHz(f, bands.centers) + 0.5) * barW));
    },
    [bands, barW, chartW],
  );

  /** Total designed response (dB) of the current EQ at f. */
  const eqAt = useCallback(
    (f: number) => {
      let db = 0;
      if (hpfHz != null) db += butterworthHpDb(hpfHz, f, slope / 6);
      if (bellOn) db += eqResponseDb([{ type: 'peak', freq: bellF, q: bellQ, gainDb: bellG }], f);
      return db;
    },
    [hpfHz, slope, bellOn, bellF, bellQ, bellG],
  );

  const eqPath = useMemo(() => {
    if (!bands || barW <= 0 || chartW <= 0) return null;
    if (hpfHz == null && !bellOn) return null;
    const PTS = 96;
    let d = '';
    for (let k = 0; k <= PTS; k++) {
      const f = 20 * Math.pow(2, (10 * k) / PTS);
      const y = Math.min(FLOOR_Y, yForDb(Math.min(8, eqAt(f))));
      d += `${k === 0 ? 'M' : 'L'}${xForHz(f).toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, [bands, barW, chartW, xForHz, eqAt, hpfHz, bellOn]);

  const showBars = mode !== 'eq';
  const showCurve = mode !== 'spectrum';
  const live = state === 'running' || micPaused;

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        The spectrum is your room; the amber curve is your design. Point the phone around and work
        the challenges below.
      </GlossaryText>

      <EngineGate state={state} lastError={lastError} />
      {!micPaused && (state === 'idle' || state === 'starting') && (
        <Text style={styles.starting}>Starting the analyzer…</Text>
      )}

      {live && (
        <>
          {/* Controls sit ABOVE the view toggle (owner 2026-08-07). */}
          <Text style={styles.sectionTitle}>LOW-CUT / HPF</Text>
          <View style={styles.btnRow}>
            <MiniBtn label="OFF" active={hpfHz == null} onPress={() => setHpfHz(null)} />
            {HPF_CHOICES.map((hz) => (
              <MiniBtn key={hz} label={`${hz} Hz`} active={hpfHz === hz} onPress={() => setHpfHz(hz)} />
            ))}
            {SLOPES.map((s) => (
              <MiniBtn key={s} label={`${s} dB/OCT`} active={slope === s} onPress={() => setSlope(s)} />
            ))}
          </View>

          <Text style={styles.sectionTitle}>PARAMETRIC BAND · VIEW</Text>
          {/* View buttons live to the RIGHT of the band toggle (owner 2026-08-07). */}
          <View style={styles.btnRow}>
            <MiniBtn label={bellOn ? 'BAND ON' : 'BAND OFF'} active={bellOn} onPress={() => setBellOn((v) => !v)} />
            <MiniBtn label="SPECTRUM ONLY" active={mode === 'spectrum'} onPress={() => setMode('spectrum')} />
            <MiniBtn label="EQ ONLY" active={mode === 'eq'} onPress={() => setMode('eq')} />
            <MiniBtn label="COMBINED" active={mode === 'combined'} onPress={() => setMode('combined')} />
          </View>
          {bellOn && (
            <>
              <DragSlider label="FREQUENCY" value={normFromF(bellF)} onChange={(t) => setBellF(fFromNorm(t))} readout={fmtHz(bellF)} />
              <DragSlider
                label="GAIN"
                value={(bellG + 18) / 36}
                onChange={(t) => setBellG(Math.round((t * 36 - 18) * 2) / 2)}
                readout={`${bellG >= 0 ? '+' : ''}${bellG.toFixed(1)} dB`}
                tint={gainColor(bellG, 18)}
              />
              <DragSlider
                label="Q"
                value={Math.log(bellQ / 0.3) / Math.log(12 / 0.3)}
                onChange={(t) => setBellQ(0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))))}
                readout={`Q ${bellQ.toFixed(2)} · ${bwOctFromQ(bellQ).toFixed(2)} oct`}
              />
            </>
          )}

          <Pressable
            onPress={state === 'running' ? onStop : onStart}
            accessibilityRole="button"
            accessibilityLabel={state === 'running' ? 'Tap to stop capture' : 'Tap to start capture'}
          >
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelEyebrow}>LIVE SPECTRUM + EQ</Text>
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
                <View style={styles.chartArea} onLayout={(e) => setChartW(Math.round(e.nativeEvent.layout.width))}>
                  {chartW > 0 && (
                    <Svg width={chartW} height={PANEL_H}>
                      <Defs>
                        <LinearGradient id="liveEqFill" x1="0" y1={ZERO_Y} x2="0" y2={FLOOR_Y} gradientUnits="userSpaceOnUse">
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
                      {showBars &&
                        bands != null &&
                        bands.centers.map((c, i) => {
                          const x = i * barW + pad;
                          const w = Math.max(1, barW - pad * 2);
                          if (!bands.resolvable[i]) {
                            return (
                              <Rect key={`slot-${c}`} x={x} y={ZERO_Y} width={w} height={FLOOR_Y - ZERO_Y} fill={SLOT_GRAY} fillOpacity={0.14} />
                            );
                          }
                          // In COMBINED, the EQ actually shapes the bars (owner
                          // 2026-08-07) — so a low-cut visibly rolls the low end
                          // off. SPECTRUM-only shows the raw room.
                          const shape = mode === 'combined' ? eqAt(c) : 0;
                          const level = bands.levelsDb[i] + shape;
                          const peak = bands.peakHoldDb[i] + shape;
                          const barTop = yForDb(level);
                          return (
                            <G key={`band-${c}`}>
                              {level > FLOOR_DB && (
                                <>
                                  <Rect x={x} y={barTop} width={w} height={FLOOR_Y - barTop} fill="url(#liveEqFill)" fillOpacity={0.96} />
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
                      {showCurve && eqPath != null && (
                        <Path d={eqPath} stroke={CURVE_AMBER} strokeWidth={2} fill="none" strokeOpacity={0.9} />
                      )}
                    </Svg>
                  )}
                  <View style={styles.labelRow}>
                    {chartW > 0 &&
                      labels.map((l) => (
                        <Text key={l.text} style={[styles.freqLabel, { left: (l.i + 0.5) * barW - 24 }]}>
                          {l.text}
                        </Text>
                      ))}
                  </View>
                </View>
              </View>
              <Text style={styles.unitLine}>
                {showCurve && (hpfHz != null || bellOn)
                  ? 'AMBER = DESIGNED RESPONSE — ANALYTIC · the analyzer stays unfiltered'
                  : 'dBFS · uncalibrated approximate'}
              </Text>
              {anyUnresolvable && <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>}
            </View>
          </Pressable>

          <Text style={styles.sectionTitle}>GUIDED CHALLENGES</Text>
          {CHALLENGES.map((c) => (
            <View key={c.title} style={styles.challenge}>
              <Text style={styles.challengeHead}>{c.title}</Text>
              <Text style={styles.caption}>{c.copy}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.caveat}>A phone microphone is an educational measurement source, not a calibrated reference.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  caveat: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: '#6b6f7a', marginTop: 4 },
  starting: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 2 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  unitLine: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSub },
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: '#7a7f8a' },
  challenge: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 4 },
  challengeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
});
