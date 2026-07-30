/**
 * Visual Audio Analysis Lab — spectral renderers (M5 spectrum · M6 spectrogram
 * · M7 ⭐ WATERFALL, the owner-starred flagship: highest resolution we can
 * sustain). Exports below are the CONTRACT the module files are written
 * against IN PARALLEL — names + prop signatures preserved from the stub.
 *
 * HONESTY (§1.7): every picture here draws meterEngine's deterministic
 * teaching models (spectrumDb / spectrogramLevel / waterfallRt +
 * waterfallSpectrumDb — the waterfall renders the engine's RT60(f) story
 * faithfully: room-mode ridges linger, damping eats highs first, EQ boosts
 * height not length). Synthetic patterns, never measurements — the module
 * host panels carry the badges.
 *
 * PERFORMANCE CONTRACT (visual standards §6): ALL geometry is memoized.
 * Per-frame work is worklet useDerivedValue producing only: bar-top jitter
 * rects (M5), the sweeping time cursor (M6), and per-slice opacity windows
 * over frozen slice paths (M7). ONLY this file (and vizMeters) imports Skia,
 * via meter/skiaGate.
 */
import { useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import {
  hashN,
  spectrogramLevel,
  spectrumDb,
  waterfallRt,
  waterfallSpectrumDb,
  type SpectrogramKey,
  type SpectrumKey,
  type WaterfallOpts,
} from './meterEngine';
import { fonts } from '../../../theme/tokens';
export { usePhaseClock, useVizClock } from '../foundations/viz';

const TAU = Math.PI * 2;
type SkPathT = ReturnType<typeof Skia.Path.Make>;

// House palette (lab tokens — same hexes as micspeaker/viz + tube/viz).
const BG = '#0c0c0f';
const GRID = '#2c2c33';
const GHOST = '#232329';
const WAVE = '#ffc64d';
const ACCENT_RED = '#ff6b5e';
const AXIS_TEXT = '#767a85';
const TEACH_TEXT = '#9aa0ad';

/** Copied from micspeaker/viz.tsx (house helper — no cross-lab import). */
function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Glow + crisp double-stroke for a styled curve.
 *  Copied from micspeaker/viz.tsx (house idiom — no cross-lab import). */
function GlowStroke({
  path,
  color,
  width = 2.4,
  opacity = 1,
}: {
  path: SkPathT | SharedValue<SkPathT>;
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width * 2.6} opacity={0.22 * opacity}>
        <BlurMask blur={width * 2.2} style="normal" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} opacity={opacity} />
    </>
  );
}

/** Walk one row of a quantized field and emit ONE rect per contiguous run of
 *  same-bucket cells — this is what keeps a ~18 000-cell spectrogram down to
 *  ≤32 Skia paths. Copied from micspeaker/viz.tsx addFieldRow (house idiom —
 *  no cross-lab import; +0.5 overlap kills hairline seams). */
function addFieldRow(
  buckets: SkPathT[],
  cols: number,
  x0: number,
  y: number,
  cw: number,
  ch: number,
  bucketOf: (c: number) => number,
): void {
  let runIdx = bucketOf(0);
  let runStart = 0;
  for (let c = 1; c < cols; c++) {
    const idx = bucketOf(c);
    if (idx !== runIdx) {
      buckets[runIdx].addRect(Skia.XYWHRect(x0 + runStart * cw, y, (c - runStart) * cw + 0.5, ch + 0.5));
      runIdx = idx;
      runStart = c;
    }
  }
  buckets[runIdx].addRect(Skia.XYWHRect(x0 + runStart * cw, y, (cols - runStart) * cw + 0.5, ch + 0.5));
}

// ── Shared frequency-axis helpers ────────────────────────────────────────────

const F_LO = 20;
const F_HI = 20000;
/** 0..1 position of f on the 20 Hz → 20 kHz log axis. */
const lgFrac = (f: number) => Math.log(f / F_LO) / Math.log(F_HI / F_LO);

function fmtHz(f: number): string {
  if (f < 1000) return `${Math.round(f)} Hz`;
  return `${(f / 1000).toFixed(2).replace(/\.?0+$/, '')} kHz`;
}

const axisText = { fontFamily: fonts.mono, fontSize: 8.5, color: AXIS_TEXT } as const;
const teachText = {
  fontFamily: fonts.oswaldSemiBold,
  fontSize: 8,
  letterSpacing: 1.1,
  color: TEACH_TEXT,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// M5 — SpectrumPatternView: the analyzer hero. The pattern drawn THREE ways
// layered — fine RTA bars (shimmering), a glowing envelope, a gradient
// underfill — over an instrument-grade log-frequency / dB grid.

const SPEC_BARS = 96;
const SPEC_DB_TOP = 12;
const SPEC_DB_FLOOR = -60;
const SPEC_DB_SPAN = SPEC_DB_TOP - SPEC_DB_FLOOR; // 72 dB plotted
const SPEC_JITTER_DB = 1.5; // worklet bar-top shimmer, ±dB
const SPEC_DB_TICKS = [12, 0, -12, -24, -36, -48, -60];
const SPEC_DECADES: { f: number; label: string }[] = [
  { f: 20, label: '20' },
  { f: 100, label: '100' },
  { f: 1000, label: '1k' },
  { f: 10000, label: '10k' },
  { f: 20000, label: '20k' },
];
/** Narrow spectral lines the coarse samplers must not miss: mains-hum
 *  harmonics, the feedback spike, guitar string harmonics (engine bump
 *  centers — sampled exactly so peaks/labels land on the true Hz). */
const SPEC_FEATURES: number[] = [
  60, 120, 180, 240, 300, 360, // hum harmonics
  1750, // feedback spike
  196, 392, 588, 784, 980, 1176, 1372, 1568, // guitar harmonics
];

/** M5 — spectrum analyzer teaching view: the pattern drawn hi-res (curve +
 *  gradient underfill + optional bars), log axis labels. */
export function SpectrumPatternView(p: {
  width: number;
  height?: number;
  pattern: SpectrumKey;
  /** Animated bar shimmer on the phase clock (live-analyzer feel). */
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 210;
  const phase = p.phase;
  const PAD_L = 30;
  const PAD_R = 8;
  const PAD_T = 15; // peak-annotation row
  const PAD_B = 15; // frequency label strip
  const plotW = Math.max(20, w - PAD_L - PAD_R);
  const plotH = Math.max(20, h - PAD_T - PAD_B);
  const baseY = PAD_T + plotH;
  const xOf = (f: number) => PAD_L + lgFrac(f) * plotW;
  const yOf = (db: number) =>
    PAD_T + ((SPEC_DB_TOP - Math.max(SPEC_DB_FLOOR, Math.min(SPEC_DB_TOP, db))) / SPEC_DB_SPAN) * plotH;

  // Instrument grid: decade gridlines, minor log ticks, dB rules, frame.
  const axes = useMemo(() => {
    const grid = Skia.Path.Make();
    const ticks = Skia.Path.Make();
    const frame = Skia.Path.Make();
    for (const f of [100, 1000, 10000]) {
      const x = xOf(f);
      grid.moveTo(x, PAD_T);
      grid.lineTo(x, baseY);
    }
    for (const dbV of SPEC_DB_TICKS) {
      const y = yOf(dbV);
      grid.moveTo(PAD_L, y);
      grid.lineTo(PAD_L + plotW, y);
    }
    // Minor ticks: 2..9 × every decade (the log-axis lesson made visible).
    for (let dec = 10; dec <= 10000; dec *= 10) {
      for (let m = 2; m <= 9; m++) {
        const f = dec * m;
        if (f < F_LO || f > F_HI) continue;
        const x = xOf(f);
        ticks.moveTo(x, baseY);
        ticks.lineTo(x, baseY + 3);
      }
    }
    for (const d of SPEC_DECADES) {
      const x = xOf(d.f);
      ticks.moveTo(x, baseY);
      ticks.lineTo(x, baseY + 4.5);
    }
    frame.moveTo(PAD_L, PAD_T);
    frame.lineTo(PAD_L, baseY);
    frame.lineTo(PAD_L + plotW, baseY);
    return { grid, ticks, frame };
  }, [w, h]);

  // RTA bars — geometry memoized; each bar reads the MAX of 5 sub-samples
  // across its band (band peak-hold, how a real RTA renders narrow lines —
  // otherwise the 96-bar comb would step over the feedback/hum needles).
  const bars = useMemo(() => {
    const body = Skia.Path.Make();
    const xs: number[] = [];
    const ws: number[] = [];
    const tipBase: number[] = [];
    const dbs: number[] = [];
    const spd: number[] = [];
    const phs: number[] = [];
    const pitch = plotW / SPEC_BARS;
    const bw = Math.max(1, pitch * 0.62);
    for (let i = 0; i < SPEC_BARS; i++) {
      let dbV = -999;
      for (let s = 0; s < 5; s++) {
        const f = F_LO * Math.pow(F_HI / F_LO, (i + (s + 0.5) / 5) / SPEC_BARS);
        dbV = Math.max(dbV, spectrumDb(p.pattern, f));
      }
      const x = PAD_L + (i + 0.5) * pitch - bw / 2;
      const yTop = yOf(dbV - SPEC_JITTER_DB - 0.1); // body stops below the jitter zone
      if (dbV > SPEC_DB_FLOOR + 0.5) body.addRect(Skia.XYWHRect(x, yTop, bw, baseY - yTop));
      xs.push(x);
      ws.push(bw);
      tipBase.push(yTop);
      dbs.push(dbV);
      // Per-bar shimmer speed/phase from hashN (deterministic, engine idiom).
      spd.push(1.2 + 2.2 * hashN(i * 1.71 + 3));
      phs.push(TAU * hashN(i * 9.13 + 11));
    }
    return { body, xs, ws, tipBase, dbs, spd, phs };
  }, [p.pattern, w, h]);
  const { xs: barXs, ws: barWs, tipBase: barTipBase, dbs: barDbs, spd: barSpd, phs: barPhs } = bars;

  // Per-frame: ONLY the bar tips (≤96 tiny rects) jitter ±1.5 dB on the phase
  // clock — the live-analyzer feel; everything else above is frozen.
  const tips = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const ph = phase.value;
    for (let i = 0; i < barXs.length; i++) {
      const dbV = barDbs[i];
      if (dbV <= SPEC_DB_FLOOR + 0.5) continue;
      const j = Math.max(-1.4, SPEC_JITTER_DB * Math.sin(ph * barSpd[i] + barPhs[i]));
      const dbTip = Math.max(SPEC_DB_FLOOR, Math.min(SPEC_DB_TOP, dbV + j));
      const yTop = PAD_T + ((SPEC_DB_TOP - dbTip) / SPEC_DB_SPAN) * plotH;
      path.addRect(Skia.XYWHRect(barXs[i], yTop, barWs[i], Math.max(0.4, barTipBase[i] - yTop + 0.4)));
    }
    return path;
  }, [phase, bars]);

  // Envelope + underfill + peak-of-pattern marker. Dense log sampling PLUS
  // the exact feature frequencies so narrow spikes render at true height and
  // the peak label lands on the true Hz.
  const envelope = useMemo(() => {
    const freqs: number[] = [];
    const N = 420;
    for (let i = 0; i <= N; i++) freqs.push(F_LO * Math.pow(F_HI / F_LO, i / N));
    for (const f of SPEC_FEATURES) if (f > F_LO && f < F_HI) freqs.push(f);
    freqs.sort((a, b) => a - b);
    const curve = Skia.Path.Make();
    const under = Skia.Path.Make();
    let peakF = F_LO;
    let peakDb = -999;
    for (let i = 0; i < freqs.length; i++) {
      const f = freqs[i];
      const dbV = spectrumDb(p.pattern, f);
      if (dbV > peakDb) {
        peakDb = dbV;
        peakF = f;
      }
      const x = xOf(f);
      const y = yOf(dbV);
      if (i === 0) {
        curve.moveTo(x, y);
        under.moveTo(x, y);
      } else {
        curve.lineTo(x, y);
        under.lineTo(x, y);
      }
    }
    under.lineTo(PAD_L + plotW, baseY);
    under.lineTo(PAD_L, baseY);
    under.close();
    // Peak annotation: thin marker line up into the label row + a tip wedge.
    const marker = Skia.Path.Make();
    const px = xOf(peakF);
    const py = yOf(peakDb);
    marker.moveTo(px, py - 3);
    marker.lineTo(px, PAD_T - 4);
    marker.moveTo(px - 2.6, py - 3);
    marker.lineTo(px, py + 0.5);
    marker.lineTo(px + 2.6, py - 3);
    marker.close();
    return { curve, under, marker, peakF, px };
  }, [p.pattern, w, h]);

  const markerColor = p.pattern === 'feedback' ? ACCENT_RED : WAVE;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={axes.grid} color={GHOST} style="stroke" strokeWidth={1} />
        <Path path={axes.ticks} color={GRID} style="stroke" strokeWidth={1.2} />
        <Path path={axes.frame} color={GRID} style="stroke" strokeWidth={1.2} />
        {/* Layer 1 — gradient underfill lifts the pattern off black. */}
        <Path path={envelope.under}>
          <LinearGradient
            start={vec(0, PAD_T)}
            end={vec(0, baseY)}
            colors={[withAlpha(WAVE, 0.24), withAlpha(WAVE, 0.015)]}
          />
        </Path>
        {/* Layer 2 — fine RTA bars (static bodies + live worklet tips). */}
        <Path path={bars.body}>
          <LinearGradient
            start={vec(0, PAD_T)}
            end={vec(0, baseY)}
            colors={[withAlpha('#ffd98a', 0.85), withAlpha(WAVE, 0.5), withAlpha('#8a6a2a', 0.32)]}
            positions={[0, 0.45, 1]}
          />
        </Path>
        <Path path={tips} color="#ffe9b8" />
        {/* Layer 3 — the smooth glowing envelope over the bars. */}
        <GlowStroke path={envelope.curve} color={WAVE} width={2.2} />
        {/* Peak-of-pattern marker (the feedback spike's thin flag). */}
        <Path path={envelope.marker} color={markerColor} style="stroke" strokeWidth={1} opacity={0.9} />
        <Path path={envelope.marker} color={markerColor} opacity={0.9} />
      </Canvas>
      {/* dB axis — the actual plotted range. */}
      {SPEC_DB_TICKS.map((dbV) => (
        <RNText
          key={`d${dbV}`}
          style={{
            position: 'absolute',
            left: 0,
            width: PAD_L - 5,
            top: yOf(dbV) - 5,
            textAlign: 'right',
            ...axisText,
          }}
        >
          {dbV > 0 ? `+${dbV}` : `${dbV}`}
        </RNText>
      ))}
      {/* Frequency axis — decade labels (minor ticks drawn in Skia above). */}
      {SPEC_DECADES.map((d) => (
        <RNText
          key={`f${d.f}`}
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(w - 30, xOf(d.f) - 15)),
            width: 30,
            top: h - 11,
            textAlign: 'center',
            ...axisText,
          }}
        >
          {d.label}
        </RNText>
      ))}
      <RNText style={{ position: 'absolute', left: 1, top: h - 11, ...teachText }}>Hz</RNText>
      {/* Peak Hz label rides the marker. */}
      <RNText
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(w - 80, envelope.px - 40)),
          width: 80,
          top: 1,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 8.5,
          color: markerColor,
        }}
      >
        {fmtHz(envelope.peakF)}
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M6 — SpectrogramPatternView: the teaching spectrogram. TIME →, FREQUENCY ↑,
// color = LEVEL, always labeled; a scanning cursor sweeps on the phase clock.

const SG_COLS = 160; // time cells
const SG_ROWS = 112; // frequency cells

// Perceptual heat colormap: black → deep blue → magenta → orange → white
// (classic spectrogram ramp — NOT the coverage jet). Piecewise-linear through
// 8 stops, quantized to 32 buckets so the whole map is ≤32 Skia paths.
const HEAT_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0.0, rgb: [0, 0, 4] }, // black — silence
  { t: 0.14, rgb: [24, 15, 62] }, // deep blue
  { t: 0.29, rgb: [75, 20, 120] }, // violet
  { t: 0.43, rgb: [130, 37, 129] }, // magenta
  { t: 0.57, rgb: [184, 55, 121] }, // hot pink-magenta
  { t: 0.71, rgb: [229, 89, 90] }, // red-orange
  { t: 0.85, rgb: [251, 140, 90] }, // orange
  { t: 1.0, rgb: [252, 250, 210] }, // white-hot
];

/** Heat colormap: t01 ∈ [0,1] → CSS rgb(). Same interpolation shape as the
 *  coverage jetColor in micspeaker/viz.tsx (house idiom), different ramp. */
function heatColor(t01: number): string {
  const t = Math.max(0, Math.min(1, t01));
  let i = 0;
  while (i < HEAT_STOPS.length - 2 && t > HEAT_STOPS[i + 1].t) i++;
  const a = HEAT_STOPS[i];
  const b = HEAT_STOPS[i + 1];
  const f = (t - a.t) / (b.t - a.t);
  const mix = (k: 0 | 1 | 2) =>
    Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * Math.max(0, Math.min(1, f)));
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
}

const HEAT_BUCKET_COUNT = 32;
const HEAT_BUCKETS: string[] = Array.from({ length: HEAT_BUCKET_COUNT }, (_, i) =>
  heatColor(i / (HEAT_BUCKET_COUNT - 1)),
);
// Legend gradient: hottest at the top.
const LEGEND_COLORS = [...HEAT_STOPS].reverse().map((s) => `rgb(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]})`);
const LEGEND_POS = [...HEAT_STOPS].reverse().map((s) => 1 - s.t);

/** M6 — spectrogram teaching view: time→, freq↑, color=level; scrolling
 *  cursor on the phase clock; axis teaching labels always on. */
export function SpectrogramPatternView(p: {
  width: number;
  height?: number;
  pattern: SpectrogramKey;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 220;
  const phase = p.phase;
  const PAD_L = 16; // rotated FREQUENCY label gutter
  const PAD_T = 6;
  const PAD_B = 14; // TIME label strip
  const LEG_W = 26; // color-scale legend column
  const plotX = PAD_L;
  const plotY = PAD_T;
  const plotW = Math.max(20, w - PAD_L - LEG_W - 6);
  const plotH = Math.max(20, h - PAD_T - PAD_B);
  const cellW = plotW / SG_COLS;

  // The map: 160 × 112 cells of spectrogramLevel through the heat ramp,
  // run-length merged per row into ≤32 bucket paths — memoized per pattern.
  const buckets = useMemo(() => {
    const bucketPaths: SkPathT[] = Array.from({ length: HEAT_BUCKET_COUNT }, () => Skia.Path.Make());
    const ch = plotH / SG_ROWS;
    for (let r = 0; r < SG_ROWS; r++) {
      const f01 = 1 - (r + 0.5) / SG_ROWS; // row 0 at the top = high frequency
      addFieldRow(bucketPaths, SG_COLS, plotX, plotY + r * ch, cellW, ch, (c) => {
        const lvl = spectrogramLevel(p.pattern, (c + 0.5) / SG_COLS, f01);
        return Math.round(Math.max(0, Math.min(1, lvl)) * (HEAT_BUCKET_COUNT - 1));
      });
    }
    return bucketPaths;
  }, [p.pattern, w, h]);

  const frame = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(plotX, plotY, plotW, plotH));
    return path;
  }, [w, h]);

  const legend = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(w - LEG_W + 2, plotY + 8, 7, plotH - 16));
    return path;
  }, [w, h]);

  // Per-frame: ONLY the scanning cursor — a snapped live-column highlight
  // band + the sweep line, both on the phase clock.
  const cursorBand = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const u = ((phase.value / TAU) % 1 + 1) % 1;
    const col = Math.min(SG_COLS - 1, Math.floor(u * SG_COLS));
    path.addRect(Skia.XYWHRect(plotX + col * cellW, plotY, cellW, plotH));
    return path;
  }, [phase, w, h]);
  const cursorLine = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const u = ((phase.value / TAU) % 1 + 1) % 1;
    const x = plotX + u * plotW;
    path.moveTo(x, plotY);
    path.lineTo(x, plotY + plotH);
    return path;
  }, [phase, w, h]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {buckets.map((path, i) => (
          <Path key={i} path={path} color={HEAT_BUCKETS[i]} />
        ))}
        {/* Live column highlight + sweep line (worklet, phase clock). */}
        <Path path={cursorBand} color="#ffffff" opacity={0.1} />
        <Path path={cursorLine} color={WAVE} style="stroke" strokeWidth={1.2} opacity={0.8} />
        <Path path={frame} color={GRID} style="stroke" strokeWidth={1.2} />
        {/* Color-scale legend strip (hot at the top). */}
        <Path path={legend}>
          <LinearGradient
            start={vec(0, plotY + 8)}
            end={vec(0, plotY + plotH - 8)}
            colors={LEGEND_COLORS}
            positions={LEGEND_POS}
          />
        </Path>
      </Canvas>
      {/* AXES ALWAYS TAUGHT. */}
      <RNText
        style={{
          position: 'absolute',
          left: plotX,
          width: plotW,
          top: h - 11,
          textAlign: 'center',
          ...teachText,
        }}
      >
        TIME →
      </RNText>
      <RNText
        style={{
          position: 'absolute',
          left: 6 - 50,
          width: 100,
          top: plotY + plotH / 2 - 6,
          textAlign: 'center',
          transform: [{ rotate: '-90deg' }],
          ...teachText,
        }}
      >
        FREQUENCY ↑
      </RNText>
      <RNText
        style={{
          position: 'absolute',
          left: w - 10 - 50,
          width: 100,
          top: plotY + plotH / 2 - 6,
          textAlign: 'center',
          transform: [{ rotate: '90deg' }],
          ...teachText,
        }}
      >
        LEVEL
      </RNText>
      <RNText
        style={{
          position: 'absolute',
          left: w - LEG_W - 5,
          width: LEG_W + 4,
          top: plotY - 4,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 7.5,
          color: AXIS_TEXT,
        }}
      >
        HI
      </RNText>
      <RNText
        style={{
          position: 'absolute',
          left: w - LEG_W - 5,
          width: LEG_W + 4,
          top: plotY + plotH - 5,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 7.5,
          color: AXIS_TEXT,
        }}
      >
        LO
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// M7 ⭐⭐ — WaterfallView: the FLAGSHIP. CSD-style pseudo-3D mountain range:
// X = frequency (log), Y = amplitude, Z = time receding up-right. 56 slices ×
// 140 log-spaced frequency points; each slice is a CLOSED filled path drawn
// back-to-front with an OPAQUE fill so nearer slices occlude farther ones —
// the classic hidden-line CSD look. All geometry frozen in useMemo; the
// build → hold → collapse loop animates ONLY per-slice opacity windows.

const WF_SLICES = 56;
const WF_T_MAX = 2.4; // seconds spanned front (t=0) → back
const WF_DB_TOP = 12;
const WF_DB_FLOOR = -60;
const WF_DB_SPAN = WF_DB_TOP - WF_DB_FLOOR; // 72 dB of mountain height
// Animation timeline as fractions of one phase-clock cycle.
const WF_GROW_END = 0.4; // Phase A: impulse flash + grow backward
const WF_HOLD_END = 0.58; // Phase B: hold the full range
// Recency-graded slice strokes: front = white-hot amber, back = cool dim blue.
const WF_FRONT_RGB: [number, number, number] = [255, 233, 192];
const WF_MID_RGB: [number, number, number] = [255, 176, 64];
const WF_BACK_RGB: [number, number, number] = [58, 84, 128];
const BG_RGB: [number, number, number] = [12, 12, 15];

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  f: number,
): [number, number, number] {
  const g = Math.max(0, Math.min(1, f));
  return [
    Math.round(a[0] + (b[0] - a[0]) * g),
    Math.round(a[1] + (b[1] - a[1]) * g),
    Math.round(a[2] + (b[2] - a[2]) * g),
  ];
}
const rgbStr = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const wfStrokeRgb = (cum: number): [number, number, number] =>
  cum < 0.45 ? mixRgb(WF_FRONT_RGB, WF_MID_RGB, cum / 0.45) : mixRgb(WF_MID_RGB, WF_BACK_RGB, (cum - 0.45) / 0.55);

/** Frequency grid: 128 log-spaced points 20 Hz → 20 kHz PLUS exact feature
 *  frequencies (±0.014-decade flanks) so the engine's narrow ridges — the
 *  110/250 Hz room modes and the 1.2 kHz qRing (σ = 0.012 decades) — render
 *  at true height instead of falling between samples. 140 points total. */
const WF_FREQS: number[] = (() => {
  const out: number[] = [];
  const N = 128;
  for (let k = 0; k < N; k++) out.push(F_LO * Math.pow(F_HI / F_LO, k / (N - 1)));
  for (const f0 of [60, 110, 250, 1200]) {
    for (const m of [Math.pow(10, -0.014), 1, Math.pow(10, 0.014)]) out.push(f0 * m);
  }
  out.sort((a, b) => a - b);
  return out;
})();

function easeInOutW(x: number): number {
  'worklet';
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type WfSliceGeo = {
  fill: SkPathT;
  stroke: SkPathT;
  strokeColor: string;
  fillTop: string;
  swid: number;
  strokeOpacity: number;
  yTop: number; // top anchor of the height-tint gradient
  yBase: number; // this slice's own baseline
};

/** One slice: frozen geometry + colors, its opacity window animated in a
 *  worklet (grow front→back · hold · melt back→front — energy decaying). */
function WfSlice({
  slice,
  index,
  phase,
  animate,
}: {
  slice: WfSliceGeo;
  index: number;
  phase: SharedValue<number>;
  animate: boolean;
}) {
  const op = useDerivedValue(() => {
    if (!animate) return 1;
    const u = (((phase.value / TAU) % 1) + 1) % 1;
    if (u < WF_GROW_END) {
      // Phase A: the mountain grows backward, slice by slice.
      const g = easeInOutW(u / WF_GROW_END) * WF_SLICES;
      return Math.max(0, Math.min(1, g - index));
    }
    if (u < WF_HOLD_END) return 1; // Phase B: hold
    // Phase C: the range melts from the back (oldest) forward.
    const c = easeInOutW((u - WF_HOLD_END) / (1 - WF_HOLD_END)) * WF_SLICES;
    return Math.max(0, Math.min(1, WF_SLICES - index - c));
  }, [phase, animate, index]);
  return (
    <Group opacity={op}>
      {/* Opaque fill = hidden-line occlusion + per-vertex height tint. */}
      <Path path={slice.fill}>
        <LinearGradient
          start={vec(0, slice.yTop)}
          end={vec(0, slice.yBase)}
          colors={[slice.fillTop, BG]}
        />
      </Path>
      <Path
        path={slice.stroke}
        color={slice.strokeColor}
        style="stroke"
        strokeWidth={slice.swid}
        strokeCap="round"
        strokeJoin="round"
        opacity={slice.strokeOpacity}
      />
    </Group>
  );
}

const WF_FRONT_LABELS: { f: number; label: string }[] = [
  { f: 100, label: '100' },
  { f: 250, label: '250' },
  { f: 1000, label: '1k' },
  { f: 4000, label: '4k' },
  { f: 10000, label: '10k' },
];

/** M7 ⭐ — the WATERFALL (CSD-style pseudo-3D): X=frequency, Y=amplitude,
 *  Z=time receding. Impulse → mountain range → collapse, animated on the
 *  phase clock; slices from meterEngine.waterfallSliceDb(opts, f, t). */
export function WaterfallView(p: {
  width: number;
  height?: number;
  opts: WaterfallOpts;
  phase: SharedValue<number>;
  /** true → run the build-then-collapse animation loop; false → hold full. */
  animate?: boolean;
}) {
  const w = p.width;
  const h = p.height ?? 300;
  const phase = p.phase;
  const animate = p.animate ?? true;
  const o = p.opts;

  // ALL slice geometry — the expensive part — frozen here, keyed on opts.
  // Per-frequency spectrum/RT arrays are hoisted once; each slice's level is
  // then exactly meterEngine.waterfallSliceDb: spectrum(f) − 60·t / RT60(f).
  const geo = useMemo(() => {
    const xL0 = 30; // dB height-reference gutter at the left
    const usable = Math.max(60, w - 44);
    const frontW = usable * 0.72;
    const dxTot = usable * 0.27;
    const baseY = h - 30;
    const dyTot = h * 0.36;
    const ampH = h * 0.31;
    const q = 0.975; // per-slice depth step shrinks — perspective recession
    const norm = 1 - Math.pow(q, WF_SLICES - 1);
    const spec = WF_FREQS.map((f) => waterfallSpectrumDb(o, f));
    const rt = WF_FREQS.map((f) => waterfallRt(o, f));
    const lgF = WF_FREQS.map((f) => lgFrac(f));
    const slices: WfSliceGeo[] = [];
    for (let i = 0; i < WF_SLICES; i++) {
      const cum = norm > 0 ? (1 - Math.pow(q, i)) / norm : 0; // 0 front → 1 back
      const ox = xL0 + dxTot * cum;
      const oy = baseY - dyTot * cum;
      const sw = frontW * (1 - 0.2 * cum);
      const amp = ampH * (1 - 0.18 * cum);
      const t = (i / (WF_SLICES - 1)) * WF_T_MAX;
      const stroke = Skia.Path.Make();
      const fill = Skia.Path.Make();
      fill.moveTo(ox, oy);
      for (let k = 0; k < WF_FREQS.length; k++) {
        const dbV = spec[k] - (60 * t) / rt[k]; // = waterfallSliceDb(o, f, t)
        const a01 = Math.max(0, Math.min(1, (dbV - WF_DB_FLOOR) / WF_DB_SPAN));
        const x = ox + lgF[k] * sw;
        const y = oy - a01 * amp;
        if (k === 0) stroke.moveTo(x, y);
        else stroke.lineTo(x, y);
        fill.lineTo(x, y);
      }
      fill.lineTo(ox + sw, oy);
      fill.close();
      const strokeRgb = wfStrokeRgb(cum);
      slices.push({
        fill,
        stroke,
        strokeColor: rgbStr(strokeRgb),
        fillTop: rgbStr(mixRgb(strokeRgb, BG_RGB, 0.74)), // opaque height tint
        swid: 1.7 - 0.8 * cum,
        strokeOpacity: 1 - 0.4 * cum,
        yTop: oy - amp,
        yBase: oy,
      });
    }
    return { slices, xL0, frontW, dxTot, dyTot, baseY, ampH };
  }, [o.room, o.damping01, o.eqBoostDb, o.qRing, o.reverb, w, h]);

  // Fine axis annotations: front-edge freq ticks + baseline, the TIME depth
  // arrow along the recession, the dB height reference.
  const axes = useMemo(() => {
    const ticks = Skia.Path.Make();
    for (const { f } of WF_FRONT_LABELS) {
      const x = geo.xL0 + lgFrac(f) * geo.frontW;
      ticks.moveTo(x, geo.baseY + 2);
      ticks.lineTo(x, geo.baseY + 6);
    }
    ticks.moveTo(geo.xL0, geo.baseY);
    ticks.lineTo(geo.xL0 + geo.frontW, geo.baseY);
    const ax0 = geo.xL0 + geo.frontW + 10;
    const ay0 = geo.baseY - 2;
    const ax1 = ax0 + geo.dxTot * 0.9;
    const ay1 = ay0 - geo.dyTot * 0.9;
    const arrow = Skia.Path.Make();
    arrow.moveTo(ax0, ay0);
    arrow.lineTo(ax1, ay1);
    const angA = Math.atan2(ay1 - ay0, ax1 - ax0);
    for (const s of [-1, 1]) {
      arrow.moveTo(ax1, ay1);
      arrow.lineTo(ax1 - 6 * Math.cos(angA - s * 0.42), ay1 - 6 * Math.sin(angA - s * 0.42));
    }
    const ref = Skia.Path.Make();
    const rx = geo.xL0 - 8;
    ref.moveTo(rx, geo.baseY);
    ref.lineTo(rx, geo.baseY - geo.ampH);
    const dbTickYs: { dbV: number; y: number }[] = [];
    for (const dbV of [0, -30, -60]) {
      const y = geo.baseY - ((dbV - WF_DB_FLOOR) / WF_DB_SPAN) * geo.ampH;
      ref.moveTo(rx - 3, y);
      ref.lineTo(rx, y);
      dbTickYs.push({ dbV, y });
    }
    return { ticks, arrow, ref, ax0, ay0, ax1, ay1, dbTickYs };
  }, [geo]);

  // Impulse flash: the front slice flares white as each build cycle begins.
  const flashOp = useDerivedValue(() => {
    if (!animate) return 0;
    const u = (((phase.value / TAU) % 1) + 1) % 1;
    return u < WF_GROW_END ? Math.exp(-u * 26) * 0.85 : 0;
  }, [phase, animate]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={axes.ref} color={GRID} style="stroke" strokeWidth={1.1} />
        <Path path={axes.arrow} color="#4b4e58" style="stroke" strokeWidth={1.2} strokeCap="round" />
        {/* The mountain range: BACK-TO-FRONT so opaque fills occlude. */}
        {Array.from({ length: WF_SLICES }, (_, k) => {
          const i = WF_SLICES - 1 - k;
          return <WfSlice key={i} slice={geo.slices[i]} index={i} phase={phase} animate={animate} />;
        })}
        {/* Phase A impulse flash on the front slice. */}
        <Path path={geo.slices[0].stroke} color="#ffffff" style="stroke" strokeWidth={2.6} opacity={flashOp}>
          <BlurMask blur={5} style="normal" />
        </Path>
        <Path path={axes.ticks} color={GRID} style="stroke" strokeWidth={1.2} />
      </Canvas>
      {/* Frequency labels along the front edge. */}
      {WF_FRONT_LABELS.map((d) => (
        <RNText
          key={`f${d.f}`}
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(w - 30, geo.xL0 + lgFrac(d.f) * geo.frontW - 15)),
            width: 30,
            top: geo.baseY + 7,
            textAlign: 'center',
            ...axisText,
          }}
        >
          {d.label}
        </RNText>
      ))}
      <RNText
        style={{ position: 'absolute', left: 1, top: geo.baseY + 7, width: 26, textAlign: 'center', ...teachText }}
      >
        Hz
      </RNText>
      {/* TIME depth arrow labels. */}
      <RNText
        style={{
          position: 'absolute',
          left: Math.min(w - 34, (axes.ax0 + axes.ax1) / 2 + 2),
          top: (axes.ay0 + axes.ay1) / 2 - 5,
          ...teachText,
        }}
      >
        TIME
      </RNText>
      <RNText
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(w - 32, axes.ax1 - 26)),
          top: Math.max(0, axes.ay1 - 13),
          width: 32,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 7.5,
          color: AXIS_TEXT,
        }}
      >
        {`${WF_T_MAX} s`}
      </RNText>
      {/* dB height reference. */}
      {axes.dbTickYs.map(({ dbV, y }) => (
        <RNText
          key={`r${dbV}`}
          style={{
            position: 'absolute',
            left: 0,
            width: geo.xL0 - 12,
            top: y - 4.5,
            textAlign: 'right',
            fontFamily: fonts.mono,
            fontSize: 7.5,
            color: AXIS_TEXT,
          }}
        >
          {`${dbV}`}
        </RNText>
      ))}
      <RNText
        style={{
          position: 'absolute',
          left: 0,
          width: geo.xL0 - 10,
          top: geo.baseY - geo.ampH - 13,
          textAlign: 'right',
          ...teachText,
        }}
      >
        dB
      </RNText>
    </View>
  );
}
