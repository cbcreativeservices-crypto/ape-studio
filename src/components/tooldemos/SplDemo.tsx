/**
 * SplDemo — Tool Demo: how an SPL meter reads sound (spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §9 SPL meter; demo-mode rules §4 and
 * tooldemos/types.ts contract, 2026-07-23; design pass 2026-09-13).
 *
 * VISUAL / ANIMATED TRAINING DEMO ONLY. Every trace, bar level and readout is
 * drawn from fixed, precomputed arrays (deterministic — no audio path, no
 * Math.random, no live values, no LedMeter per spec §1.7). The hosting
 * ToolDemoScreen renders the permanent "TRAINING DEMO — NOT A LIVE
 * MEASUREMENT" badge; nothing here implies a live reading, and every numeric
 * readout is tagged as a training example.
 *
 * UNIT HONESTY (house rule: never default dBFS / never bare "dB" for level):
 * the depicted signal is anchored to a declared training-example ceiling of
 * 100 dB SPL at full scale, so the PEAK / RMS readouts are true 20·log10 maths
 * over the drawn samples, expressed in dB SPL. The one relative figure (the
 * crest-factor gap) is correctly a plain "dB". The A-vs-C scene keeps its
 * dBA / dBC framing.
 *
 * LEVEL COLOUR: bar meters are the shared amplitude ramp (LOUDNESS_STOPS as an
 * SVG gradient, base blue → tip red) revealed by a native-driver animated
 * cover; the waveform strip strokes on WAVE_LEVEL_STOPS mapped userSpaceOnUse
 * to ±full scale; numeric SPL readouts tint via splColorForDba.
 *
 * Scenes: 1) PEAK vs RMS — the instantaneous bar spikes with each depicted
 * burst and falls back, an amber peak-hold cap LATCHES at the highest instant,
 * and RMS drifts toward the average. 2) A vs C WEIGHTING — 78 dBA / 84 dBC for
 * one bass-heavy source, with the IEC 61672 A/C curves over the source's own
 * bass-heavy spectrum silhouette (the eye sees the energy A discards).
 * 3) FAST vs SLOW — identical stepped input into 125 ms and 1 s ballistics,
 * with the 85 action-level marker on both bars.
 *
 * Animation: RN core Animated only — one looping master value per scene,
 * keyframed via interpolate(); transforms/opacity with useNativeDriver. SVG
 * geometry is static; only Views move.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Polyline, Rect, Stop } from 'react-native-svg';
import { levelColor, LOUDNESS_STOPS, splColorForDba, WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { colors, fonts, spacing } from '../../theme/tokens';

/* ------------------------------------------------------------------ */
/* Fixed, precomputed data (deterministic — computed once at module    */
/* load; the demo never samples anything at render time).              */
/* ------------------------------------------------------------------ */

/** Shared demo meter scale: 40 dB SPL (quiet room, ramp blue) at the bottom of
 *  every bar track, 100 dB SPL (ramp red) at the top — the same hearing-safety
 *  window splColorForDba uses, so bar colour and readout colour agree. */
const SPL_MIN = 40;
const SPL_MAX = 100;
/** NIOSH action level (as an 8-h A-weighted average — the captions carry the
 *  honest framing; the marker just shows WHERE 85 sits on the scale). */
const SPL_ACTION = 85;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
/** Fraction of the 40–100 dB SPL track for a level. */
function splFrac(db: number): number {
  return clamp01((db - SPL_MIN) / (SPL_MAX - SPL_MIN));
}
/** Linear amplitude (0..1 of full scale) → dB SPL under the declared
 *  training-example ceiling (full scale = 100 dB SPL). */
function linToSpl(v: number): number {
  return SPL_MAX + 20 * Math.log10(Math.max(v, 1e-6));
}

const SALMON = '#ff8d7a'; // warning / limit accent (shared demo contract)
const STEEL = '#9aa3ad'; // neutral-reference callout accent
const LEADER = 'rgba(255,255,255,.35)';

const VB_W = 300; // scope viewBox width
const VB_H = 130; // scope viewBox height
const Y_SCALE = 0.94; // headroom so strokes never kiss the frame
const BAR_H = 208; // scene 1 bar-track height (px) — hero-size viz
const BAR3_H = 150; // scene 3 bar-track height (px)

/** Scene 1 — burst-y depicted signal: three bursts over a quiet bed. */
interface Burst {
  start: number;
  end: number;
  amp: number;
}
const BURSTS: Burst[] = [
  { start: 0.07, end: 0.16, amp: 0.95 },
  { start: 0.38, end: 0.46, amp: 0.72 },
  { start: 0.66, end: 0.75, amp: 0.85 },
];

function envelope(t: number): number {
  for (const b of BURSTS) {
    if (t >= b.start && t <= b.end) {
      const u = (t - b.start) / (b.end - b.start);
      return b.amp * Math.pow(Math.sin(Math.PI * u), 0.35);
    }
  }
  return 0.12;
}

function carrier(t: number): number {
  return 0.82 * Math.sin(2 * Math.PI * 36 * t) + 0.18 * Math.sin(2 * Math.PI * 97 * t + 1.1);
}

/** Map normalized samples (-1..1) to an SVG polyline points string. */
function toPolyline(values: number[], w: number, h: number): string {
  const last = values.length - 1;
  return values
    .map((v, i) => `${((i / last) * w).toFixed(2)},${(h / 2 - v * (h / 2) * Y_SCALE).toFixed(2)}`)
    .join(' ');
}

const S1_N = 200;
const BURST_VALUES: number[] = Array.from({ length: S1_N + 1 }, (_, i) => {
  const t = i / S1_N;
  return envelope(t) * carrier(t);
});
const BURST_POINTS = toPolyline(BURST_VALUES, VB_W, VB_H);
/** ±full-scale pixel band for the userSpaceOnUse waveform gradient. */
const WAVE_Y_TOP = (VB_H / 2) * (1 - Y_SCALE);
const WAVE_Y_BOTTOM = VB_H - WAVE_Y_TOP;

/** Honest readouts: peak and RMS of the actual drawn samples, expressed in
 *  dB SPL under the declared 100 dB SPL full-scale example ceiling. */
const PEAK_LEVEL = Math.max(...BURST_VALUES.map(Math.abs));
const RMS_LEVEL = Math.sqrt(BURST_VALUES.reduce((acc, v) => acc + v * v, 0) / BURST_VALUES.length);
const PEAK_SPL = linToSpl(PEAK_LEVEL);
const RMS_SPL = linToSpl(RMS_LEVEL);
const CREST_DB = PEAK_SPL - RMS_SPL; // relative dB — the crest factor
const PEAK_FRAC = splFrac(PEAK_SPL);
const RMS_FRAC = splFrac(RMS_SPL);

/** Per-burst maxima of the drawn samples (drives the instantaneous bar). */
const BURST_MAX_FRACS: number[] = BURSTS.map((b) => {
  let m = 0;
  BURST_VALUES.forEach((v, i) => {
    const t = i / S1_N;
    if (t >= b.start && t <= b.end) m = Math.max(m, Math.abs(v));
  });
  return splFrac(linToSpl(m));
});
/** Quiet-bed maximum (between bursts). */
const BED_FRAC: number = (() => {
  let m = 0;
  BURST_VALUES.forEach((v, i) => {
    const t = i / S1_N;
    if (!BURSTS.some((b) => t >= b.start && t <= b.end)) m = Math.max(m, Math.abs(v));
  });
  return splFrac(linToSpl(m));
})();

/** Instantaneous meter keyframes: fast attack into each burst, fall back to
 *  the bed after it — the motion the latched cap is contrasted against. */
const INST_KEYS: { in: number[]; out: number[] } = {
  in: [0, 0.07, 0.09, 0.16, 0.22, 0.38, 0.4, 0.46, 0.52, 0.66, 0.68, 0.75, 0.81, 1],
  out: [
    BED_FRAC,
    BED_FRAC,
    BURST_MAX_FRACS[0],
    BURST_MAX_FRACS[0],
    BED_FRAC,
    BED_FRAC,
    BURST_MAX_FRACS[1],
    BURST_MAX_FRACS[1],
    BED_FRAC,
    BED_FRAC,
    BURST_MAX_FRACS[2],
    BURST_MAX_FRACS[2],
    BED_FRAC,
    BED_FRAC,
  ],
};
/** Peak-hold cap: re-arms at the bed on loop start, LATCHES at the tallest
 *  burst's crest and stays for the rest of the sweep. */
const CAP_KEYS: { in: number[]; out: number[] } = {
  in: [0, 0.07, 0.09, 1],
  out: [BED_FRAC, BED_FRAC, PEAK_FRAC, PEAK_FRAC],
};
/** RMS integrates slowly — rises through each burst, sags a little between.
 *  Keyframes are the drawn-sample RMS scaled in LINEAR amplitude, then mapped
 *  through the same 20·log10 → track-fraction path as everything else. */
const RMS_KEYS: { in: number[]; out: number[] } = {
  in: [0, 0.07, 0.2, 0.36, 0.5, 0.64, 0.78, 1],
  out: [0.06, 0.07, RMS_LEVEL * 0.82, RMS_LEVEL * 0.72, RMS_LEVEL * 0.92, RMS_LEVEL * 0.8, RMS_LEVEL * 0.98, RMS_LEVEL].map(
    (v) => splFrac(linToSpl(v)),
  ),
};

function fmtSpl(db: number): string {
  return db.toFixed(1);
}

const GRID_XS = [VB_W * 0.25, VB_W * 0.5, VB_W * 0.75];

/* --------------------- Scene 2 — A vs C weighting ------------------ */

/** IEC 61672 A- and C-weighting responses, 20 Hz – 20 kHz. */
function aWeightDb(f: number): number {
  const f2 = f * f;
  const r =
    (12194 ** 2 * f2 * f2) /
    ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return 20 * Math.log10(r) + 2.0;
}
function cWeightDb(f: number): number {
  const f2 = f * f;
  const r = (12194 ** 2 * f2) / ((f2 + 20.6 ** 2) * (f2 + 12194 ** 2));
  return 20 * Math.log10(r) + 0.06;
}

const CURVE_W = 300;
const CURVE_H = 140;
const DB_TOP = 5; // dB at the top of the sketch
const DB_BOTTOM = -52; // dB at the bottom (A ≈ −50 dB at 20 Hz)
const LOG_MIN = Math.log10(20);
const LOG_MAX = Math.log10(20000);

function freqToX(f: number): number {
  return ((Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * CURVE_W;
}
function dbToY(db: number): number {
  const clamped = Math.max(DB_BOTTOM, Math.min(DB_TOP, db));
  return ((DB_TOP - clamped) / (DB_TOP - DB_BOTTOM)) * (CURVE_H - 8) + 4;
}

const CURVE_N = 48;
const CURVE_FREQS: number[] = Array.from({ length: CURVE_N + 1 }, (_, i) =>
  Math.pow(10, LOG_MIN + ((LOG_MAX - LOG_MIN) * i) / CURVE_N),
);
const A_CURVE_POINTS = CURVE_FREQS.map((f) => `${freqToX(f).toFixed(2)},${dbToY(aWeightDb(f)).toFixed(2)}`).join(' ');
const C_CURVE_POINTS = CURVE_FREQS.map((f) => `${freqToX(f).toFixed(2)},${dbToY(cWeightDb(f)).toFixed(2)}`).join(' ');
const CURVE_GRID_FREQS = [100, 1000, 10000] as const;
const CURVE_GRID_XS = CURVE_GRID_FREQS.map(freqToX);
const ZERO_DB_Y = dbToY(0);
const DB_GRID_YS = [-20, -40].map(dbToY);

/** Bass-heavy source spectrum SILHOUETTE (a labeled sketch, drawn on the same
 *  frequency axis under the curves): a low-frequency hump around ~55 Hz, then
 *  a gentle roll toward the highs — so the eye can see that the source's
 *  energy sits exactly where the A curve dives. */
function sourceSketchDb(f: number): number {
  const lf = Math.log10(f);
  const hump = 6 * Math.exp(-Math.pow((lf - Math.log10(55)) / 0.28, 2));
  const roll = Math.max(0, 9 * (lf - Math.log10(200)));
  return -12 + hump - roll;
}
const SRC_PATH = `M 0 ${CURVE_H} ${CURVE_FREQS.map(
  (f) => `L ${freqToX(f).toFixed(2)} ${dbToY(sourceSketchDb(f)).toFixed(2)}`,
).join(' ')} L ${CURVE_W} ${CURVE_H} Z`;

/** % positions (of the curve panel) for the overlay callouts — proportional,
 *  so they track the stretched SVG at any width. */
const PCT = (v: number, total: number) => `${((v / total) * 100).toFixed(1)}%` as `${number}%`;
const HUMP_X_PCT = PCT(freqToX(55), CURVE_W);
const HUMP_Y_PCT = PCT(dbToY(sourceSketchDb(55)), CURVE_H);
const A_LOW_Y_PCT = PCT(dbToY(aWeightDb(60)), CURVE_H);
const C_FLAT_Y_PCT = PCT(dbToY(0) + 6, CURVE_H);
const GRID_X_PCTS = CURVE_GRID_XS.map((x) => PCT(x, CURVE_W));
const GRID_X_LABELS = ['100', '1k', '10k'];

const DBA_EXAMPLE = 78;
const DBC_EXAMPLE = 84;

/* ---------------------- Scene 3 — Fast vs Slow --------------------- */

/** One shared step pattern (track fractions of the same 40–100 dB SPL scale);
 *  Fast chases it, Slow damps it. */
const STEP_TARGETS = [0.25, 0.85, 0.35, 0.7, 0.2, 0.9, 0.45, 0.6];
const STEP_FRAC = 1 / STEP_TARGETS.length;
const LOOP3_MS = 5600;
const FAST_PEAK_FRAC = Math.max(...STEP_TARGETS);
const SLOW_TREND_FRAC = STEP_TARGETS.reduce((a, v) => a + v, 0) / STEP_TARGETS.length;
const ACTION_FRAC = splFrac(SPL_ACTION);

/** Fast (125 ms): near-instant jumps with a small deterministic overshoot. */
const FAST_KEYS: { in: number[]; out: number[] } = (() => {
  const inputs: number[] = [0];
  const outputs: number[] = [STEP_TARGETS[STEP_TARGETS.length - 1]];
  STEP_TARGETS.forEach((target, i) => {
    const t0 = i * STEP_FRAC;
    const prev = i === 0 ? STEP_TARGETS[STEP_TARGETS.length - 1] : STEP_TARGETS[i - 1];
    const wiggle = (i % 2 === 0 ? 1 : -1) * 0.05;
    inputs.push(t0 + 0.006, t0 + 0.03, t0 + 0.05, t0 + 0.07);
    outputs.push(prev, target, Math.max(0, Math.min(1, target + wiggle)), target);
  });
  inputs.push(1);
  outputs.push(STEP_TARGETS[STEP_TARGETS.length - 1]);
  return { in: inputs, out: outputs };
})();

/** Slow (1 s): first-order smoothing of the same pattern, pre-converged so
 *  the loop is seamless. */
const SLOW_KEYS: { in: number[]; out: number[] } = (() => {
  const samples = 160;
  const dtMs = LOOP3_MS / samples;
  const alpha = 1 - Math.exp(-dtMs / 1000);
  const vals: number[] = [];
  let s = 0.5;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const target = STEP_TARGETS[Math.min(Math.floor(t / STEP_FRAC), STEP_TARGETS.length - 1)];
      s += (target - s) * alpha;
      if (pass === 2) vals.push(s);
    }
  }
  const inputs: number[] = [];
  const outputs: number[] = [];
  for (let i = 0; i < samples; i += 8) {
    inputs.push(i / samples);
    outputs.push(vals[i]);
  }
  inputs.push(1);
  outputs.push(vals[0]);
  return { in: inputs, out: outputs };
})();

/** Staircase sketch geometry of the shared step pattern (scene 3 header). */
const STAIR_W = 300;
const STAIR_H = 56;
function stairY(v: number): number {
  return (STAIR_H - 8) * (1 - v) + 4;
}
const STAIR_ACTION_Y = stairY(ACTION_FRAC);

/* ------------------------------------------------------------------ */
/* Shared meter building blocks                                        */
/* ------------------------------------------------------------------ */

/**
 * Ramp bar meter: a STATIC full-track SVG gradient on the shared amplitude
 * ramp (blue base → red full scale), revealed bottom-up by a native-driver
 * animated cover — so the ramp itself never stretches and the tip colour is
 * always the true colour of the current level (owner bar ruling 2026-08-16).
 */
function RampMeter({
  level,
  cap,
  trackH,
  width,
  gradId,
  markerFrac,
}: {
  level: Animated.AnimatedInterpolation<number>;
  cap?: Animated.AnimatedInterpolation<number>;
  trackH: number;
  width: number;
  gradId: string;
  markerFrac?: number;
}) {
  return (
    <View style={[styles.meterTrack, { height: trackH, width }]}>
      <Svg width='100%' height='100%' viewBox={`0 0 10 ${trackH}`} preserveAspectRatio='none'>
        <Defs>
          <LinearGradient id={gradId} x1='0' y1='0' x2='0' y2='1'>
            {LOUDNESS_STOPS.map((s) => (
              <Stop key={s.pos} offset={s.pos} stopColor={s.color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={10} height={trackH} fill={`url(#${gradId})`} />
      </Svg>
      <Animated.View
        pointerEvents='none'
        style={[
          styles.meterCover,
          {
            height: trackH,
            transform: [
              { translateY: level.interpolate({ inputRange: [0, 1], outputRange: [0, -trackH] }) },
            ],
          },
        ]}
      />
      {markerFrac != null ? (
        <View pointerEvents='none' style={[styles.meterMarker, { top: trackH * (1 - markerFrac) - 0.5 }]} />
      ) : null}
      {cap ? (
        <Animated.View
          pointerEvents='none'
          style={[
            styles.meterCap,
            {
              transform: [
                { translateY: cap.interpolate({ inputRange: [0, 1], outputRange: [trackH - 2, 0] }) },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/** dB SPL tick scale beside a meter track (40–100, salmon 85 action mark). */
const SCALE_DBS = [100, 85, 70, 55, 40] as const;
function DbScale({ trackH }: { trackH: number }) {
  return (
    <View style={[styles.scaleCol, { height: trackH }]}>
      {SCALE_DBS.map((db) => {
        const hot = db === SPL_ACTION;
        return (
          <View key={db} style={[styles.scaleTickRow, { top: trackH * (1 - splFrac(db)) - 6 }]}>
            <Text style={[styles.scaleText, hot && { color: SALMON }]}>{db}</Text>
            <View style={[styles.scaleTick, hot && { backgroundColor: SALMON }]} />
          </View>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene captions — WATCH FOR / body / FIELD NOTE                      */
/* ------------------------------------------------------------------ */

interface SceneDef {
  key: string;
  chip: string;
  title: string;
  watch: string;
  body: string;
  note: string;
}

const SCENES: SceneDef[] = [
  {
    key: 'peakRms',
    chip: 'PEAK vs RMS',
    title: 'PEAK vs RMS — ONE SIGNAL, TWO NUMBERS',
    watch: `Each burst spikes the meter, then it falls back — but the amber cap latches at ${fmtSpl(
      PEAK_SPL,
    )} and stays. Green RMS only drifts.`,
    body: `PEAK grabs the single loudest instant, and the hold keeps it on screen after the burst is gone. RMS averages energy over time, so three short bursts barely lift it above the quiet bed. The gap between them — the crest factor, about ${CREST_DB.toFixed(
      0,
    )} dB here — says this signal is spiky, not steady. Peak protects equipment and headroom; RMS tracks loudness and exposure.`,
    note: 'Peak and RMS reading nearly the same is not a calm signal — it is a heavily limited, square-ish one. Healthy program always shows a gap.',
  },
  {
    key: 'weighting',
    chip: 'A vs C',
    title: 'A vs C WEIGHTING',
    watch: `One speaker, one moment: ${DBA_EXAMPLE} dBA vs ${DBC_EXAMPLE} dBC. The source's bass hump sits exactly where the blue A curve dives.`,
    body: 'Weighting is a filter applied BEFORE the number is computed — not a display option. A-weighting rolls off low frequencies the way the ear does at modest levels, so most of this source’s bass energy is discarded before it is counted; C-weighting stays nearly flat and keeps it. Neither reading is wrong: they answer different questions about the same air.',
    note: 'Always say the letter. 95 dB(A) and 95 dB(C) describe different acoustic events — match weighting before comparing any two readings.',
  },
  {
    key: 'fastSlow',
    chip: 'FAST vs SLOW',
    title: 'FAST vs SLOW RESPONSE',
    watch: 'Both meters are fed the identical stepped pattern above them. FAST flicks past the 85 marker on peaks; SLOW settles on the trend.',
    body: 'FAST and SLOW are meter ballistics — averaging windows of 125 ms and 1 s. FAST resolves every short event, which is what you want when hunting transients; SLOW damps the same input into a stable value you can log and compare against exposure limits. Neither is more accurate, and two readings only compare when both meters used the same response.',
    note: 'Exposure is a dose — level × time. The 85 dBA action level is an 8-hour average, so judge it from SLOW or logged readings, never from FAST flickers.',
  },
];

/* ------------------------------------------------------------------ */
/* Scene 1 — PEAK vs RMS                                               */
/* ------------------------------------------------------------------ */

const LOOP1_MS = 5200;

function PeakRmsScene() {
  const [scopeW, setScopeW] = useState(0);
  const master = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(master, {
        toValue: 1,
        duration: LOOP1_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [master]);

  const cursorX = master.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(scopeW - 2, 1)],
  });
  const instLevel = master.interpolate({ inputRange: INST_KEYS.in, outputRange: INST_KEYS.out });
  const capLevel = master.interpolate({ inputRange: CAP_KEYS.in, outputRange: CAP_KEYS.out });
  const rmsLevel = master.interpolate({ inputRange: RMS_KEYS.in, outputRange: RMS_KEYS.out });

  return (
    <View style={styles.sceneRoot}>
      <View style={styles.peakRow}>
        <View
          style={[styles.vizPanel, styles.scope]}
          onLayout={(e: LayoutChangeEvent) => setScopeW(e.nativeEvent.layout.width)}
        >
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
            <Defs>
              <LinearGradient
                id='splWaveRamp'
                x1='0'
                y1={WAVE_Y_TOP}
                x2='0'
                y2={WAVE_Y_BOTTOM}
                gradientUnits='userSpaceOnUse'
              >
                {WAVE_LEVEL_STOPS.map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            </Defs>
            {GRID_XS.map((x) => (
              <Line key={x} x1={x} y1={0} x2={x} y2={VB_H} stroke={colors.hairlineDim} strokeWidth={1} />
            ))}
            <Line
              x1={0}
              y1={VB_H / 2}
              x2={VB_W}
              y2={VB_H / 2}
              stroke={colors.steelBorder}
              strokeWidth={1}
              strokeDasharray='4 4'
            />
            <Polyline points={BURST_POINTS} fill='none' stroke='url(#splWaveRamp)' strokeWidth={1.5} />
          </Svg>
          <Animated.View
            pointerEvents='none'
            style={[styles.cursor, { transform: [{ translateX: cursorX }] }]}
          />
          {/* In-picture callouts, y-aligned to the bar features they name. */}
          <View pointerEvents='none' style={[styles.calloutRow, { top: Math.max(2, BAR_H * (1 - PEAK_FRAC) - 5), right: 4 }]}>
            <Text style={[styles.calloutText, { color: colors.amber }]}>PEAK LATCHES</Text>
            <View style={styles.calloutLeader} />
          </View>
          <View pointerEvents='none' style={[styles.calloutRow, { top: BAR_H * (1 - RMS_FRAC) - 5, right: 4 }]}>
            <Text style={[styles.calloutText, { color: STEEL }]}>RMS AVERAGES</Text>
            <View style={styles.calloutLeader} />
          </View>
          {/* "ON A QUIET BED" lives in the caption; at 393 the full phrase ran
              into "TIME →" (integration pass 2026-09-13). numberOfLines + the
              right bound make the collision impossible at any width. */}
          <Text style={styles.scopeTagLeft} numberOfLines={1}>SKETCHED SIGNAL — 3 BURSTS</Text>
          <Text style={styles.scopeTagRight}>TIME →</Text>
        </View>

        <View style={styles.meterPane}>
          <DbScale trackH={BAR_H} />
          <View style={styles.meterCol}>
            <RampMeter level={instLevel} cap={capLevel} trackH={BAR_H} width={30} gradId='splS1Peak' />
            <Text style={styles.barLabel}>PEAK</Text>
          </View>
          <View style={styles.meterCol}>
            <RampMeter level={rmsLevel} trackH={BAR_H} width={30} gradId='splS1Rms' />
            <Text style={styles.barLabel}>RMS</Text>
          </View>
        </View>
      </View>

      <View style={styles.readoutStrip}>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>PEAK (HELD)</Text>
          <Text style={[styles.readoutValue, { color: splColorForDba(PEAK_SPL) }]}>
            {fmtSpl(PEAK_SPL)} dB SPL
          </Text>
        </View>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>RMS (AVG)</Text>
          <Text style={[styles.readoutValue, { color: splColorForDba(RMS_SPL) }]}>
            {fmtSpl(RMS_SPL)} dB SPL
          </Text>
        </View>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>CREST FACTOR</Text>
          <Text style={[styles.readoutValue, { color: colors.textSub }]}>{CREST_DB.toFixed(1)} dB</Text>
        </View>
        <Text style={styles.exampleTag}>TRAINING{'\n'}EXAMPLE</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — A vs C WEIGHTING                                          */
/* ------------------------------------------------------------------ */

function WeightingScene() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Bass thump: the woofer breathes, and the C readout glows in step with it
  // (C-weighting is the one that counts that low end).
  const wooferScale = pulse.interpolate({
    inputRange: [0, 0.22, 0.5, 1],
    outputRange: [1, 1.16, 1, 1],
  });
  const cGlow = pulse.interpolate({
    inputRange: [0, 0.22, 0.5, 1],
    outputRange: [0.05, 0.3, 0.05, 0.05],
  });

  return (
    <View style={styles.sceneRoot}>
      <View style={styles.sourceRow}>
        <View style={styles.speaker}>
          <View style={styles.tweeter} />
          <Animated.View style={[styles.woofer, { transform: [{ scale: wooferScale }] }]} />
        </View>
        <View style={styles.readCard}>
          <View style={styles.readValueRow}>
            <Text style={[styles.readValue, { color: colors.blue }]}>{DBA_EXAMPLE}</Text>
            <Text style={[styles.readUnit, { color: colors.blue }]}>dBA</Text>
          </View>
          <Text style={styles.readNote}>BASS ROLLED OFF</Text>
        </View>
        <View style={styles.readCard}>
          <Animated.View
            pointerEvents='none'
            style={[StyleSheet.absoluteFill, styles.glowOrange, { opacity: cGlow }]}
          />
          <View style={styles.readValueRow}>
            <Text style={[styles.readValue, { color: colors.orange }]}>{DBC_EXAMPLE}</Text>
            <Text style={[styles.readUnit, { color: colors.orange }]}>dBC</Text>
          </View>
          <Text style={styles.readNote}>BASS COUNTED</Text>
        </View>
      </View>
      <Text style={styles.deltaLine}>
        SAME SOURCE · SAME MOMENT · Δ {DBC_EXAMPLE - DBA_EXAMPLE} dB — TRAINING EXAMPLE VALUES
      </Text>

      <View style={[styles.vizPanel, styles.curveBox]}>
        <Svg width='100%' height='100%' viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} preserveAspectRatio='none'>
          {CURVE_GRID_XS.map((x) => (
            <Line key={x} x1={x} y1={0} x2={x} y2={CURVE_H} stroke={colors.hairlineDim} strokeWidth={1} />
          ))}
          {DB_GRID_YS.map((y) => (
            <Line key={y} x1={0} y1={y} x2={CURVE_W} y2={y} stroke={colors.hairlineDim} strokeWidth={1} />
          ))}
          {/* Bass-heavy source silhouette — the energy the two filters fight over. */}
          <Path d={SRC_PATH} fill='rgba(154,163,173,.14)' stroke='rgba(154,163,173,.5)' strokeWidth={1} />
          <Line
            x1={0}
            y1={ZERO_DB_Y}
            x2={CURVE_W}
            y2={ZERO_DB_Y}
            stroke={colors.steelBorder}
            strokeWidth={1}
            strokeDasharray='4 4'
          />
          <Polyline points={C_CURVE_POINTS} fill='none' stroke={colors.orange} strokeWidth={2} />
          <Polyline points={A_CURVE_POINTS} fill='none' stroke={colors.blue} strokeWidth={2} />
        </Svg>
        {/* Curve identity tags */}
        <Text style={[styles.curveTag, { color: colors.blue, top: '56%', left: '5%' }]}>A</Text>
        <Text style={[styles.curveTag, { color: colors.orange, top: '4%', left: '5%' }]}>C</Text>
        {/* In-picture callouts (proportional, so they track the features). */}
        <View pointerEvents='none' style={[styles.calloutAnchor, { left: HUMP_X_PCT, top: HUMP_Y_PCT }]}>
          <View style={styles.calloutStub} />
          <Text style={[styles.calloutText, { color: STEEL }]}>BASS-HEAVY SOURCE</Text>
        </View>
        <View pointerEvents='none' style={[styles.calloutAnchor, { left: '13%', top: A_LOW_Y_PCT }]}>
          <View style={styles.calloutStub} />
          <Text style={[styles.calloutText, { color: colors.amber }]}>A ROLLS OFF THE LOWS</Text>
        </View>
        <View pointerEvents='none' style={[styles.calloutAnchor, { left: '55%', top: C_FLAT_Y_PCT }]}>
          <View style={styles.calloutStub} />
          <Text style={[styles.calloutText, { color: STEEL }]}>C STAYS NEARLY FLAT</Text>
        </View>
        <Text style={[styles.axisYTag, { top: PCT(ZERO_DB_Y - 13, CURVE_H) }]}>0 dB</Text>
        {GRID_X_PCTS.map((left, i) => (
          <Text key={left} style={[styles.axisXTag, { left }]}>
            {GRID_X_LABELS[i]}
          </Text>
        ))}
      </View>
      <View style={styles.freqRow}>
        <Text style={styles.freqText}>20 Hz</Text>
        <Text style={styles.freqText}>FILTER GAIN vs LOG FREQUENCY</Text>
        <Text style={styles.freqText}>20 kHz</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — FAST vs SLOW                                              */
/* ------------------------------------------------------------------ */

function FastSlowScene() {
  const [stairW, setStairW] = useState(0);
  const master = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(master, {
        toValue: 1,
        duration: LOOP3_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [master]);

  const cursorX = master.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(stairW - 2, 1)],
  });
  const fastLevel = master.interpolate({ inputRange: FAST_KEYS.in, outputRange: FAST_KEYS.out });
  const slowLevel = master.interpolate({ inputRange: SLOW_KEYS.in, outputRange: SLOW_KEYS.out });

  return (
    <View style={styles.sceneRoot}>
      <View
        style={[styles.vizPanel, styles.stair]}
        onLayout={(e: LayoutChangeEvent) => setStairW(e.nativeEvent.layout.width)}
      >
        <Svg width='100%' height='100%' viewBox={`0 0 ${STAIR_W} ${STAIR_H}`} preserveAspectRatio='none'>
          <Line
            x1={0}
            y1={STAIR_ACTION_Y}
            x2={STAIR_W}
            y2={STAIR_ACTION_Y}
            stroke={SALMON}
            strokeWidth={1}
            strokeDasharray='3 4'
            opacity={0.55}
          />
          {STEP_TARGETS.map((v, i) => {
            const x1 = i * STEP_FRAC * STAIR_W;
            const prev = i === 0 ? null : STEP_TARGETS[i - 1];
            return prev != null ? (
              <Line
                key={`c${i}`}
                x1={x1}
                y1={stairY(prev)}
                x2={x1}
                y2={stairY(v)}
                stroke={colors.steelBorder}
                strokeWidth={1}
              />
            ) : null;
          })}
          {STEP_TARGETS.map((v, i) => (
            <Line
              key={`s${i}`}
              x1={i * STEP_FRAC * STAIR_W}
              y1={stairY(v)}
              x2={(i + 1) * STEP_FRAC * STAIR_W}
              y2={stairY(v)}
              stroke={levelColor(v)}
              strokeWidth={2.5}
            />
          ))}
        </Svg>
        <Animated.View
          pointerEvents='none'
          style={[styles.cursor, { transform: [{ translateX: cursorX }] }]}
        />
        <Text style={styles.stairTag}>INPUT — SAME FOR BOTH METERS</Text>
      </View>

      <View style={styles.fsRow}>
        <DbScale trackH={BAR3_H} />
        <View style={styles.meterCol}>
          <RampMeter level={fastLevel} trackH={BAR3_H} width={46} gradId='splS3Fast' markerFrac={ACTION_FRAC} />
          <View style={styles.fsLabelRow}>
            <Text style={[styles.barLabel, { color: colors.amber }]}>FAST</Text>
            <Text style={styles.fsTime}>125 ms</Text>
          </View>
        </View>
        <View style={styles.meterCol}>
          <RampMeter level={slowLevel} trackH={BAR3_H} width={46} gradId='splS3Slow' markerFrac={ACTION_FRAC} />
          <View style={styles.fsLabelRow}>
            <Text style={[styles.barLabel, { color: colors.blue }]}>SLOW</Text>
            <Text style={styles.fsTime}>1 s</Text>
          </View>
        </View>
        <View style={[styles.fsAnnotCol, { height: BAR3_H }]}>
          <View style={[styles.calloutAnnot, { top: BAR3_H * (1 - FAST_PEAK_FRAC) - 5 }]}>
            <View style={styles.calloutLeader} />
            <Text style={[styles.calloutText, { color: colors.amber }]}>CHASES EVERY FLICK</Text>
          </View>
          <View style={[styles.calloutAnnot, { top: BAR3_H * (1 - ACTION_FRAC) - 5 }]}>
            <View style={[styles.calloutLeader, { backgroundColor: SALMON }]} />
            <Text style={[styles.calloutText, { color: SALMON }]}>85 dB SPL · ACTION</Text>
          </View>
          <View style={[styles.calloutAnnot, { top: BAR3_H * (1 - SLOW_TREND_FRAC) - 5 }]}>
            <View style={styles.calloutLeader} />
            <Text style={[styles.calloutText, { color: STEEL }]}>SETTLES ON THE TREND</Text>
          </View>
        </View>
      </View>
      <Text style={styles.exampleLine}>SCALE IN dB SPL — TRAINING EXAMPLE PATTERN</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function SplDemo() {
  const [scene, setScene] = useState(0);
  const current = SCENES[scene] ?? SCENES[0];

  return (
    <View style={styles.panel}>
      <View style={styles.chipRow} accessibilityRole='tablist'>
        {SCENES.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => setScene(i)}
            accessibilityRole='tab'
            accessibilityState={{ selected: i === scene }}
            aria-selected={i === scene}
            accessibilityLabel={s.title}
            hitSlop={4}
            style={[styles.chip, i === scene && styles.chipActive]}
          >
            <Text style={[styles.chipText, i === scene && styles.chipTextActive]}>{s.chip}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sceneTitle}>{current.title}</Text>
      <View style={styles.stage}>
        {scene === 0 ? <PeakRmsScene /> : scene === 1 ? <WeightingScene /> : <FastSlowScene />}
      </View>
      <View style={styles.captionBlock}>
        <Text style={styles.watchFor}>WATCH FOR — {current.watch}</Text>
        <Text style={styles.caption}>{current.body}</Text>
        <Text style={styles.fieldNote}>FIELD NOTE: {current.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: spacing.md,
    gap: spacing.sm,
  },

  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipActive: {
    borderColor: colors.amber,
    backgroundColor: 'rgba(255,180,0,.10)',
  },
  chipText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  chipTextActive: { color: colors.amber },

  sceneTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.amberLabel,
  },

  stage: {},
  sceneRoot: { gap: spacing.sm },

  /* Recessed glass instrumentation frame (shared demo contract). */
  vizPanel: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },

  /* Shared meter pieces */
  meterTrack: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
    overflow: 'hidden',
  },
  meterCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.screenBgDeep,
  },
  meterCap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.amber,
  },
  meterMarker: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: SALMON,
    opacity: 0.75,
  },
  meterCol: { alignItems: 'center', gap: 4 },
  scaleCol: { width: 30 },
  scaleTickRow: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scaleText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  scaleTick: { width: 4, height: 1, backgroundColor: colors.steelBorder },

  /* Callouts */
  calloutRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutAnnot: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutAnchor: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  calloutLeader: { width: 12, height: 1, backgroundColor: LEADER },
  calloutStub: { width: 8, height: 1, backgroundColor: LEADER },

  /* Scene 1 */
  peakRow: { flexDirection: 'row', gap: spacing.sm },
  scope: { flex: 1, height: BAR_H },
  cursor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: colors.amber,
    opacity: 0.45,
  },
  scopeTagLeft: {
    position: 'absolute',
    left: 8,
    right: 56, // hard gap before the TIME tag — overlap-proof at any width
    bottom: 5,
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  scopeTagRight: {
    position: 'absolute',
    right: 8,
    bottom: 5,
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  meterPane: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  barLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSub,
  },
  readoutStrip: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
    paddingTop: 2,
  },
  readoutCell: { gap: 1 },
  readoutLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  readoutValue: { fontFamily: fonts.mono, fontSize: 13 },
  exampleTag: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 12,
    color: colors.textMutedDeep,
  },

  /* Scene 2 */
  sourceRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  speaker: {
    width: 54,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: colors.screenBgDeep,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 6,
  },
  tweeter: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  woofer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 138, 30, 0.12)',
  },
  readCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.screenBgDeep,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
    overflow: 'hidden',
  },
  glowOrange: { backgroundColor: colors.orange },
  readValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  readValue: { fontFamily: fonts.mono, fontSize: 24, lineHeight: 26 },
  readUnit: { fontFamily: fonts.mono, fontSize: 12, marginBottom: 2 },
  readNote: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textSub,
  },
  deltaLine: {
    textAlign: 'center',
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  curveBox: { height: 196 },
  curveTag: {
    position: 'absolute',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  axisYTag: {
    position: 'absolute',
    right: 6,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  axisXTag: {
    position: 'absolute',
    bottom: 3,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  freqRow: { flexDirection: 'row', justifyContent: 'space-between' },
  freqText: {
    fontFamily: fonts.barlowCondensedRegular,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },

  /* Scene 3 */
  stair: { height: 62 },
  stairTag: {
    position: 'absolute',
    top: 4,
    right: 8,
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  fsRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  fsAnnotCol: { flex: 1 },
  fsLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  fsTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  exampleLine: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMutedDeep,
  },

  /* Captions */
  captionBlock: { gap: 5, paddingTop: 2 },
  watchFor: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    lineHeight: 16,
    color: colors.amber,
  },
  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  fieldNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
