/**
 * LiveSpectrumEq — EQ Lab lesson 12 (owner spec 2026-08-07): everything
 * together — the phone-mic 1/3-octave spectrum with the designed EQ response
 * overlaid. Point the phone around the room and work the guided challenges.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): this module renders the RackUnit
 * frame itself (EqModuleScreen gives rack modules the full height, no host
 * ScrollView). The spectrum+curve glass PINS on the stage with the honesty
 * line as its badge; VIEW/LOW-CUT/BAND state reads on the bezel (MIC cell taps
 * to pause/resume); the parametric band rides the dock lane (FREQ/GAIN/Q —
 * touching any of them switches the band on); LOW CUT and VIEW live in group
 * trays. Only the challenges + caveats scroll. Tap the glass to stop/start
 * capture, exactly as before.
 *
 * Honesty grammar matches Seeing Frequency: REAL bands only, Q2 gray slots,
 * and the EQ curve is a DESIGNED RESPONSE — ANALYTIC overlay; the analyzer
 * itself stays unfiltered (COMBINED shapes the bars — owner 2026-08-07).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { BandsFrame, EngineConfig } from '../../../../../modules/ape-dsp';
import { useDspEngine, useToolAutoStart } from '../../../../features/tools/engine/useDspEngine';
import { LOUDNESS_STOPS } from '../../../../features/tools/levelColor';
import { eqResponseDb } from '../../../../features/lab/fxViz';
import { colors, fonts } from '../../../../theme/tokens';
import { EngineGate } from '../../../tools/EngineGate';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { MiniBtn } from './eqBits';
import { butterworthHpDb, bwOctFromQ, fFromNorm, fmtHz, gainColor, normFromF } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const FFT_SIZE = 8192;
const HPF_CHOICES = [40, 80, 120] as const;
const SLOPES = [12, 24, 48] as const;

// ---- Glass geometry (Seeing Frequency idiom, height-parametric for the
//      stage: the chart fills whatever glass the rack grants) ---------------
const FLOOR_DB = -90;
const ZERO_Y = 16;
const GRID_DBS = [0, -30, -60, FLOOR_DB];
const GRID_DBS_MINOR = [-15, -45, -75];
const LABEL_TARGETS = [63, 250, 1000, 4000, 16000] as const;
const PLOT_BG = '#0c0c0f';
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
  { title: 'TRY A LOW CUT', copy: 'Set the HPF around 80 Hz (LOW CUT key). Compare the designed response with the filter OFF.' },
  { title: 'CHANGE THE SLOPE', copy: 'Keep the cutoff constant. Compare 12, 24 and 48 dB/octave — watch the skirt swing.' },
  { title: 'FIND A FREQUENCY', copy: 'Ride the FREQ lane with a narrow boost (high Q, +12 dB) — watch which bands sit under the amber bump.' },
];

/** The pinned spectrum+curve glass. Height-parametric copy of the Seeing
 *  Frequency panel: bars, Q2 gray slots, peak ticks, designed-response curve. */
function SpectrumGlass({
  w,
  h,
  bands,
  mode,
  hpfHz,
  slope,
  bellOn,
  bellF,
  bellG,
  bellQ,
}: {
  w: number;
  h: number;
  bands: BandsFrame | null;
  mode: ViewMode;
  hpfHz: number | null;
  slope: (typeof SLOPES)[number];
  bellOn: boolean;
  bellF: number;
  bellG: number;
  bellQ: number;
}) {
  const GUTTER = 26;
  const LABEL_H = 15;
  const chartW = Math.max(0, w - GUTTER - 6);
  const chartH = Math.max(60, h - LABEL_H - 4);
  const floorY = chartH - 8;
  const pxPerDb = (floorY - ZERO_Y) / -FLOOR_DB;
  const yForDb = (db: number) => Math.max(2, ZERO_Y - db * pxPerDb);

  const n = bands ? bands.centers.length : 0;
  const barW = n > 0 && chartW > 0 ? chartW / n : 0;
  const labels = bands ? bandLabels(bands.centers) : [];
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
      const y = Math.min(floorY, yForDb(Math.min(8, eqAt(f))));
      d += `${k === 0 ? 'M' : 'L'}${xForHz(f).toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bands, barW, chartW, xForHz, eqAt, hpfHz, bellOn, floorY]);

  const showBars = mode !== 'eq';
  const showCurve = mode !== 'spectrum';

  return (
    <View style={styles.glassRow}>
      <View style={{ width: GUTTER, height: chartH }}>
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
              <LinearGradient id="liveEqFill" x1="0" y1={ZERO_Y} x2="0" y2={floorY} gradientUnits="userSpaceOnUse">
                {LOUDNESS_STOPS.map((s) => (
                  <Stop key={s.pos} offset={String(s.pos)} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={chartW} height={chartH} rx={8} fill={PLOT_BG} />
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
                const bw = Math.max(1, barW - pad * 2);
                if (!bands.resolvable[i]) {
                  return (
                    <Rect key={`slot-${c}`} x={x} y={ZERO_Y} width={bw} height={floorY - ZERO_Y} fill={SLOT_GRAY} fillOpacity={0.14} />
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
                        <Rect x={x} y={barTop} width={bw} height={floorY - barTop} fill="url(#liveEqFill)" fillOpacity={0.96} />
                        <Rect x={x - 0.75} y={barTop - 2.5} width={bw + 1.5} height={5} rx={1.5} fill={CAP_HALO} fillOpacity={0.22} />
                        <Rect x={x} y={barTop - 1.1} width={bw} height={2.2} rx={1} fill={CAP_CORE} fillOpacity={0.95} />
                      </>
                    )}
                    {peak > FLOOR_DB && (
                      <Rect x={x + bw * 0.1} y={yForDb(peak) - 1} width={bw * 0.8} height={2} rx={1} fill={PEAK_TICK} fillOpacity={0.95} />
                    )}
                  </G>
                );
              })}
            {showCurve && eqPath != null && (
              <Path d={eqPath} stroke={CURVE_AMBER} strokeWidth={2} fill="none" strokeOpacity={0.9} />
            )}
          </Svg>
        )}
        <View style={{ height: LABEL_H }}>
          {chartW > 0 &&
            labels.map((l) => (
              <Text key={l.text} style={[styles.freqLabel, { left: (l.i + 0.5) * barW - 24 }]}>
                {l.text}
              </Text>
            ))}
        </View>
      </View>
    </View>
  );
}

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
  const anyUnresolvable = bands != null && bands.resolvable.some((r) => !r);

  // Riding any band lane IS turning the band on (cause→effect, zero taps).
  const bellFader = (set: (v: number) => void) => (v: number) => {
    if (!bellOn) setBellOn(true);
    set(v);
  };

  const designed = hpfHz != null || bellOn;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'bellf',
      label: 'FREQ',
      value: normFromF(bellF),
      onChange: bellFader((t) => setBellF(fFromNorm(t))),
      format: () => fmtHz(bellF),
    },
    {
      kind: 'fader',
      id: 'bellg',
      label: 'GAIN',
      value: (bellG + 18) / 36,
      onChange: bellFader((t) => setBellG(Math.round((t * 36 - 18) * 2) / 2)),
      format: () => `${bellG >= 0 ? '+' : ''}${bellG.toFixed(1)} dB`,
      formatShort: () => `${bellG >= 0 ? '+' : ''}${bellG.toFixed(1)}`,
      tint: gainColor(bellG, 18),
    },
    {
      kind: 'fader',
      id: 'bellq',
      label: 'Q',
      value: Math.log(bellQ / 0.3) / Math.log(12 / 0.3),
      onChange: bellFader((t) => setBellQ(0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))))),
      format: () => `Q ${bellQ.toFixed(2)} · ${bwOctFromQ(bellQ).toFixed(2)} oct`,
      formatShort: () => `Q${bellQ.toFixed(1)}`,
    },
    {
      kind: 'group',
      id: 'lowcut',
      label: 'LOW CUT',
      valueLabel: hpfHz != null ? `${hpfHz}·${slope}` : 'OFF',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>LOW-CUT / HPF</Text>
          <View style={styles.btnRow}>
            <MiniBtn label="OFF" active={hpfHz == null} onPress={() => setHpfHz(null)} />
            {HPF_CHOICES.map((hz) => (
              <MiniBtn key={hz} label={`${hz} Hz`} active={hpfHz === hz} onPress={() => setHpfHz(hz)} />
            ))}
          </View>
          <Text style={styles.trayHead}>SLOPE</Text>
          <View style={styles.btnRow}>
            {SLOPES.map((s) => (
              <MiniBtn key={s} label={`${s} dB/OCT`} active={slope === s} onPress={() => setSlope(s)} />
            ))}
          </View>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'view',
      label: 'VIEW',
      valueLabel: `${mode === 'spectrum' ? 'SPECT' : mode === 'eq' ? 'EQ' : 'COMB'}${bellOn ? '·B' : ''}`,
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>VIEW</Text>
          <View style={styles.btnRow}>
            <MiniBtn label="SPECTRUM ONLY" active={mode === 'spectrum'} onPress={() => setMode('spectrum')} />
            <MiniBtn label="EQ ONLY" active={mode === 'eq'} onPress={() => setMode('eq')} />
            <MiniBtn label="COMBINED" active={mode === 'combined'} onPress={() => setMode('combined')} />
          </View>
          <Text style={styles.trayHead}>PARAMETRIC BAND</Text>
          <View style={styles.btnRow}>
            <MiniBtn label={bellOn ? 'BAND ON' : 'BAND OFF'} active={bellOn} onPress={() => setBellOn((v) => !v)} />
          </View>
        </View>
      ),
    },
  ];

  return (
    <RackUnit
      initialParam="bellf"
      params={params}
      stage={{
        size: 'L', // the spectrum IS the lesson — everything together
        badge: designed
          ? 'AMBER = DESIGNED RESPONSE — ANALYTIC · THE ANALYZER STAYS UNFILTERED'
          : 'dBFS · UNCALIBRATED APPROXIMATE',
        bezel: [
          { k: 'VIEW', v: mode === 'spectrum' ? 'SPECT' : mode === 'eq' ? 'EQ' : 'COMB' },
          { k: 'LOW CUT', v: hpfHz != null ? `${hpfHz}Hz·${slope}` : 'OFF' },
          { k: 'BAND', v: bellOn ? fmtHz(bellF) : 'OFF' },
          {
            k: 'MIC',
            v: state === 'running' ? 'LIVE' : micPaused ? 'PAUSED' : '—',
            tint: state === 'running' ? undefined : '#7a7f8a',
            onPress: state === 'running' ? onStop : onStart,
          },
        ],
        render: (w, h) => (
          // Tapping the glass pauses/resumes capture (pre-rack idiom kept).
          <Pressable
            onPress={state === 'running' ? onStop : onStart}
            accessibilityRole="button"
            accessibilityLabel={state === 'running' ? 'Tap to stop capture' : 'Tap to start capture'}
            style={{ width: w, height: h, justifyContent: 'center' }}
          >
            <SpectrumGlass
              w={w}
              h={h}
              bands={bands}
              mode={mode}
              hpfHz={hpfHz}
              slope={slope}
              bellOn={bellOn}
              bellF={bellF}
              bellG={bellG}
              bellQ={bellQ}
            />
          </Pressable>
        ),
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          The spectrum is your room; the amber curve is your design. Point the phone around, ride
          the FREQ/GAIN/Q lanes (touching one switches the band on), and work the challenges.
        </GlossaryText>

        <EngineGate state={state} lastError={lastError} />
        {!micPaused && (state === 'idle' || state === 'starting') && (
          <Text style={styles.starting}>Starting the analyzer…</Text>
        )}
        {anyUnresolvable && <Text style={styles.grayNote}>grayed bands: insufficient resolution at this setting</Text>}

        <Text style={styles.sectionTitle}>GUIDED CHALLENGES</Text>
        {CHALLENGES.map((c) => (
          <View key={c.title} style={styles.challenge}>
            <Text style={styles.challengeHead}>{c.title}</Text>
            <Text style={styles.caption}>{c.copy}</Text>
          </View>
        ))}

        <Text style={styles.caveat}>
          A phone microphone is an educational measurement source, not a calibrated reference. 1/3
          OCT · FFT {FFT_SIZE}.
        </Text>
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  caveat: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: '#6b6f7a', marginTop: 4 },
  starting: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 2 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  glassRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  gutterLabel: { position: 'absolute', right: 0, fontFamily: fonts.mono, fontSize: 10, color: colors.textSub },
  freqLabel: { position: 'absolute', width: 48, textAlign: 'center', fontFamily: fonts.mono, fontSize: 10, color: colors.textSub },
  grayNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: '#7a7f8a' },
  challenge: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 4 },
  challengeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
});
