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
  waterfallTimeDivisions,
  waterfallTimeSpan,
  type SpectrogramKey,
  type SpectrumKey,
  type WaterfallOpts,
} from './meterEngine';
import { fonts } from '../../../theme/tokens';
import {
  heatColor as levelHeatColor,
  fieldLevelColor,
  levelColor,
  LOUDNESS_STOPS,
} from '../../../features/tools/levelColor';
export { usePhaseClock, useVizClock } from '../foundations/viz';

const TAU = Math.PI * 2;
type SkPathT = ReturnType<typeof Skia.Path.Make>;

// House palette (lab tokens — same hexes as micspeaker/viz + tube/viz).
const BG = '#0c0c0f';
const GRID = '#3a3b46';
const GHOST = '#2e2f38';
const WAVE = '#ffc64d';
const ACCENT_RED = '#ff6b5e';
const AXIS_TEXT = '#9a9ca8';
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
        {/* Layer 2 — fine RTA bars, painted by the MIDI loudness ramp so each
            bar's height (its level) reads in the SAME colors as the left volume
            scale — blue quiet at the floor → red loud at the top (owner
            2026-08-05). The top of every Hz band is therefore its level color. */}
        <Path path={bars.body}>
          <LinearGradient
            start={vec(0, baseY)}
            end={vec(0, PAD_T)}
            colors={LOUDNESS_STOPS.map((s) => s.color)}
            positions={LOUDNESS_STOPS.map((s) => s.pos)}
          />
        </Path>
        <Path path={tips} color={withAlpha('#ffffff', 0.55)} />
        {/* Layer 3 — the smooth glowing envelope over the bars. */}
        <GlowStroke path={envelope.curve} color={WAVE} width={2.2} />
        {/* Peak-of-pattern marker (the feedback spike's thin flag). */}
        <Path path={envelope.marker} color={markerColor} style="stroke" strokeWidth={1} opacity={0.9} />
        <Path path={envelope.marker} color={markerColor} opacity={0.9} />
      </Canvas>
      {/* dB axis — the actual plotted range, each label in its MIDI level color
          (blue quiet → red loud) so the left volume scale is color-coded to
          match the bars (owner 2026-08-05). */}
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
            color: levelColor((dbV - SPEC_DB_FLOOR) / SPEC_DB_SPAN),
          }}
        >
          {`${dbV}`}
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

// Heat colormap: the app-wide amplitude ramp (owner 2026-08-02) — red = loud →
// blue = quiet (levelColor heatColor), so the spectrogram/waterfall level
// colours match every meter, waveform and the other labs' heat maps. Quantized
// to 32 buckets so the whole map is ≤32 Skia paths.
function heatColor(t01: number): string {
  return levelHeatColor(t01);
}

const HEAT_BUCKET_COUNT = 32;
const HEAT_BUCKETS: string[] = Array.from({ length: HEAT_BUCKET_COUNT }, (_, i) =>
  heatColor(i / (HEAT_BUCKET_COUNT - 1)),
);
// Legend gradient: hottest (red) at the top → quiet (blue) at the bottom.
const LEGEND_SAMPLES = [1, 0.8, 0.6, 0.4, 0.2, 0];
const LEGEND_COLORS = LEGEND_SAMPLES.map((t) => heatColor(t));
const LEGEND_POS = LEGEND_SAMPLES.map((t) => 1 - t);

/** M6 — spectrogram teaching view: time→, freq↑, color=level; axis teaching
 *  labels always on. TWO MODES (owner 2026-08-05):
 *  'scroll' (default — how a real-time spectrogram behaves): new data emerges
 *  at the RIGHT edge and the picture scrolls LEFT; the right edge is NOW.
 *  'snapshot': the full loop laid out at once (left = earliest) with the
 *  sweeping cursor — so the user can compare the complete pattern. */
export function SpectrogramPatternView(p: {
  width: number;
  height?: number;
  pattern: SpectrogramKey;
  phase: SharedValue<number>;
  mode?: 'scroll' | 'snapshot';
}) {
  const w = p.width;
  const h = p.height ?? 220;
  const phase = p.phase;
  const mode = p.mode ?? 'scroll';
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
  const plotRect = useMemo(() => Skia.XYWHRect(plotX, plotY, plotW, plotH), [w, h]);

  // SCROLL mode: the loop is cyclic, so the rolling view is the memoized
  // image drawn TWICE under a phase-driven translate inside a clip — the
  // newest column always rides the right edge and history slides off left.
  const scrollA = useDerivedValue(() => {
    const u = (((phase.value / TAU) % 1) + 1) % 1;
    return [{ translateX: plotW * (1 - u) }];
  }, [phase, w, h]);
  const scrollB = useDerivedValue(() => {
    const u = (((phase.value / TAU) % 1) + 1) % 1;
    return [{ translateX: -plotW * u }];
  }, [phase, w, h]);
  // Fixed NOW marker at the right edge (scroll mode).
  const nowLine = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(plotX + plotW - 1, plotY);
    path.lineTo(plotX + plotW - 1, plotY + plotH);
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
        {mode === 'scroll' ? (
          <>
            {/* Rolling history: two copies of the loop image slide left under
                the clip; the seam is the loop boundary. Right edge = NOW. */}
            <Group clip={plotRect}>
              <Group transform={scrollA}>
                {buckets.map((path, i) => (
                  <Path key={`a${i}`} path={path} color={HEAT_BUCKETS[i]} />
                ))}
              </Group>
              <Group transform={scrollB}>
                {buckets.map((path, i) => (
                  <Path key={`b${i}`} path={path} color={HEAT_BUCKETS[i]} />
                ))}
              </Group>
            </Group>
            <Path path={nowLine} color={WAVE} style="stroke" strokeWidth={1.6} opacity={0.85} />
          </>
        ) : (
          <>
            {buckets.map((path, i) => (
              <Path key={i} path={path} color={HEAT_BUCKETS[i]} />
            ))}
            {/* Live column highlight + sweep line (worklet, phase clock). */}
            <Path path={cursorBand} color="#ffffff" opacity={0.1} />
            <Path path={cursorLine} color={WAVE} style="stroke" strokeWidth={1.2} opacity={0.8} />
          </>
        )}
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
        {mode === 'scroll' ? 'OLDER ←  TIME  → NOW' : 'TIME → · FULL 5 s SNAPSHOT'}
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
// X = frequency (log), Y = amplitude, Z = TIME. ORIENTATION (owner 2026-08-05,
// Altiverb reference screenshots): the loud start (t=0) stands TALL AT THE
// BACK (upper-right) and each LATER instant steps down-forward toward the
// viewer — the decay cascades toward you, every slice's front face visible,
// instead of hiding behind a tall t=0 front wall. 56 slices × 140 log-spaced
// frequency points; each slice is a CLOSED filled path drawn back-to-front
// with an OPAQUE fill so nearer slices occlude farther ones — the classic
// hidden-line CSD look -- so every slice is drawn OPAQUE and blocks the ones
// behind it; a slice is never part-transparent. All geometry frozen in useMemo;
// the build → hold loop animates ONLY which slices are present.
//
// Grammar per the owner's reference CSD screenshots:
//   • frequency labels along the BOTTOM front edge (30 · 120 · 440 · 1.6k ·
//     6k · 20k), each tied to the range by a guide line running INTO the depth
//     parallel to the recession and drawn BEHIND the slices;
//   • labeled 1-SECOND floor division lines (1 / 2 / 3 Sec) across the 3 s
//     span — the ridges cross them during the collapse, making time visible;
//   • HEIGHT-GRADED LEVEL fills: the app amplitude ramp up each slice, anchored
//     to the full 60 dB scale (red at the 0 dB peak → blue at −60), with depth
//     dimming toward a cool dark;
//   • the front slice's spectrum re-drawn as a green 2-D silhouette standing
//     on the outer side plane, synced to the front slice.
// Math (waterfallSpectrumDb / waterfallRt), the 56×140 geometry, occlusion,
// memoization, and the animation architecture are all unchanged.

/** Second labels: sub-second windows need a decimal, whole ones must not have
 *  one (a studio reads "0.1s", a cathedral "2s"). */
function fmtSec(t: number): string {
  return `${t < 1 ? t.toFixed(1).replace(/\.0$/, '') : String(t)}s`;
}

const WF_SLICES = 56;
// The time span is NO LONGER a constant — it is fitted to the scene's own decay
// by waterfallTimeSpan(opts). A fixed 3 s window showed a studio's decay in 5
// of 56 slices while a cathedral overflowed it; see meterEngine for the why.
// The dB axis is EXACTLY 60 dB, 0 at the top, and 0 means THE PEAK OF THE
// IMPULSE. Every level on the plot is relative to that peak.
//
// It used to run +12 down to −60, with the +12 there as headroom for the ±12 dB
// EQ boost. That put "+12" at the very top of the key with "0" just below it,
// and neither was anchored to anything a student could name. Owner 2026-08-28:
// "you have +12 and then 0 (which one is it going to be? because both are
// confusing)." A dB scale that tops out at 0 and runs negative is the universal
// convention for "relative to peak", so the headroom is gone and the slices are
// normalised to their own peak instead.
//
// The payoff is that the mountain's FULL HEIGHT is now exactly the 60 dB of
// RT60. A ridge falling from the ceiling to the floor IS one RT60 -- the
// definition of the number this whole lab teaches, made visible as a distance.
const WF_DB_TOP = 0;
const WF_DB_FLOOR = -60;
const WF_DB_SPAN = WF_DB_TOP - WF_DB_FLOOR; // 60 dB — one RT60 of decay
// Animation timeline as fractions of one phase-clock cycle.
// The cycle is BUILD then HOLD — there is no collapse phase (owner
// 2026-08-28). The range completes, holds for the rest of the cycle, and the
// loop wrap resets it instantly.
const WF_GROW_END = 0.4; // impulse flash + build back → front

/** REAL-TIME clock rate for the waterfall (owner 2026-08-05): the GROW phase
 *  spans the plot's whole time window in REAL seconds, so a ridge crosses each
 *  floor marker at exactly that many real seconds and the displayed time
 *  matches wall-clock time. Now a function of the scene, because the window is
 *  fitted to the room — a dead studio's decay plays out over its own fraction
 *  of a second, a cathedral's over several.
 *  (grow duration = WF_GROW_END / hz = span → hz = WF_GROW_END / span.) */
export function waterfallRealtimeHz(opts: WaterfallOpts): number {
  return WF_GROW_END / waterfallTimeSpan(opts);
}

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

// HEIGHT-GRADED LEVEL COLOUR. Every slice carries the app amplitude ramp up
// its height, and the gradient is anchored to the FULL dB scale (yTop = the
// WF_DB_TOP ceiling … yBase = the WF_DB_FLOOR baseline), NOT to the slice's own
// min/max — so a ridge only reaching halfway up only reaches the middle of the
// ramp. Colour IS the dB reading: the same height is the same colour on every
// slice, and a ridge that decays visibly cools as it falls.
//
// This used to be a private amber-only ramp (white-hot peaks → deep RED base)
// copied from a CSD reference. It broke the app-wide standard in the worst
// possible way — the base, the QUIETEST part of the display, was the reddest —
// and in practice only red and yellow ever appeared, so the mountains carried
// no level information at all. Owner 2026-08-28: "the waterfall is not showing
// level via our colors ... if the level goes down, its color matches."
//
// FIELD_STOPS (via fieldLevelColor), not the meter ramp: this is a 2-D field
// read against a scale, so the stops must be EVENLY spaced — the meter ramp's
// wide green plateau would flatten a quarter of the mountain to one colour.
const WF_HEAT_STOPS: { pos: number; rgb: [number, number, number] }[] = Array.from(
  { length: 9 },
  (_, i) => {
    const pos = i / 8; // 0 = the 0 dB ceiling (the peak) … 1 = the −60 dB floor
    const hex = fieldLevelColor(1 - pos);
    const n = parseInt(hex.slice(1), 16);
    return { pos, rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number] };
  },
);
const WF_HEAT_POS = WF_HEAT_STOPS.map((s) => s.pos);
/** NEUTRAL dark the depth dimming mixes toward (older = darker).
 *
 *  This was [15, 18, 30] — a BLUE dark — which collided head-on with the level
 *  ramp: blue already means QUIET, so a forward slice went blue both because it
 *  had decayed and because it was old, and a student could not tell which. Now
 *  neutral, so hue carries level and level only; depth is carried by occlusion,
 *  the perspective width taper and plain darkness. */
const WF_COOL_DARK: [number, number, number] = [16, 16, 18];
/** Ridge-line highlight mixed INTO the level colour so the crest still reads as
 *  a bright edge without overriding what the colour is saying about level. */
const WF_RIDGE_LIFT: [number, number, number] = [255, 250, 236];

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
  strokeColors: string[];
  /** The level ramp (WF_HEAT_STOPS depth-dimmed for this slice), anchored
   *  yTop (0 dB — the peak, red) → yBase (the −60 dB floor, blue). */
  fillColors: string[];
  swid: number;
  yTop: number; // top anchor of the height-heat gradient (full-amp ceiling)
  yBase: number; // this slice's own baseline
};

/** One slice: frozen geometry + colors, present-or-absent in a worklet. The
 *  build sweeps back → front (one direction only), each slice fully OPAQUE so
 *  it occludes the ones behind it, and the range holds until the loop resets —
 *  no exit animation (owner 2026-08-28). */
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
    // Time-flipped ordering (owner 2026-08-05): the t=0 slice is the BACK
    // (highest index), so the build reveals back → front — the impulse flashes
    // at the back and the decay cascades toward the viewer.
    const ri = WF_SLICES - 1 - index; // 0 = the t=0 back slice … N−1 = oldest front
    const g = easeInOutW(Math.min(1, u / WF_GROW_END)) * WF_SLICES;
    // OPAQUE OR ABSENT — never part-transparent (owner 2026-08-28: "each slice
    // is in front of the next, blocking the previous slice behind it, opaque
    // not transparent"). A slice used to FADE in over its reveal, and a
    // half-faded slice let the slices behind it show through, which is exactly
    // what the hidden-line CSD look depends on NOT happening.
    if (g <= ri) return 0;
    // NO EXIT ANIMATION (owner 2026-08-28: "it completes and then resets, the
    // exit animation is confusing"). Past the build the range simply HOLDS for
    // the rest of the cycle; the loop wrapping to u=0 snaps it back to empty
    // and the next build starts. There is no collapse phase to read.
    return 1;
  }, [phase, animate, index]);
  return (
    <Group opacity={op}>
      {/* Opaque fill = hidden-line occlusion + the height-graded LEVEL ramp
          (red at the dB ceiling → blue at the floor, depth-dimmed). */}
      <Path path={slice.fill}>
        <LinearGradient
          start={vec(0, slice.yTop)}
          end={vec(0, slice.yBase)}
          colors={slice.fillColors}
          positions={WF_HEAT_POS}
        />
      </Path>
      <Path
        path={slice.stroke}
        style="stroke"
        strokeWidth={slice.swid}
        strokeCap="round"
        strokeJoin="round"
      >
        <LinearGradient
          start={vec(0, slice.yTop)}
          end={vec(0, slice.yBase)}
          colors={slice.strokeColors}
          positions={WF_HEAT_POS}
        />
      </Path>
    </Group>
  );
}

// Frequency stations per the owner's reference CSD (30 · 120 · 440 · 1.6k ·
// 6k · 20k), labeled along the BOTTOM / front edge, each tied to the range by a
// guide line running into the depth at the scene's angle, drawn BEHIND the
// slices (owner 2026-08-28).
const WF_FRONT_LABELS: { f: number; label: string }[] = [
  { f: 30, label: '30' },
  { f: 120, label: '120' },
  { f: 440, label: '440' },
  { f: 1600, label: '1.6k' },
  { f: 6000, label: '6k' },
  { f: 20000, label: '20k' },
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
    const tMax = waterfallTimeSpan(o); // the window, fitted to THIS room
    const q = 0.975; // per-slice depth step shrinks — perspective recession
    const norm = 1 - Math.pow(q, WF_SLICES - 1);
    const specRaw = WF_FREQS.map((f) => waterfallSpectrumDb(o, f));
    // Normalise to the impulse's own peak so the top of the scale is 0 dB by
    // construction and nothing can exceed it (the ±12 dB EQ boost used to push
    // content above 0, which is why the axis carried +12 of headroom). Boosting
    // 250 Hz still reshapes the range -- 250 holds the ceiling while the rest
    // sits further below it -- which is how a CSD is conventionally read.
    const specPeak = Math.max(...specRaw);
    const spec = specRaw.map((v) => v - specPeak);
    const rt = WF_FREQS.map((f) => waterfallRt(o, f));
    const lgF = WF_FREQS.map((f) => lgFrac(f));
    const slices: WfSliceGeo[] = [];
    for (let i = 0; i < WF_SLICES; i++) {
      const cum = norm > 0 ? (1 - Math.pow(q, i)) / norm : 0; // 0 front → 1 back
      const ox = xL0 + dxTot * cum;
      const oy = baseY - dyTot * cum;
      const sw = frontW * (1 - 0.2 * cum);
      const amp = ampH * (1 - 0.18 * cum);
      // TIME FLIP (owner 2026-08-05, Altiverb reference): the loud start (t=0)
      // stands tall at the BACK; each LATER instant steps down toward the
      // viewer — the decay cascades toward you instead of hiding behind a
      // tall front wall. So depth cum=1 (back) is t=0 and cum=0 (front) is
      // the oldest, most-decayed slice.
      const t = (1 - i / (WF_SLICES - 1)) * tMax;
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
      // Height-graded heat, AGE-dimmed (owner 2026-08-05): the t=0 back ridge
      // stays white-hot (Altiverb's bright crest); slices cool toward the dark
      // as they age forward toward the viewer. Perspective width (swid) still
      // follows depth.
      const age = t / tMax; // 0 = the loud start … 1 = fully decayed
      // Dimming cut 0.62 → 0.28 (design review 2026-08-28): at 0.62 the forward
      // slices were washed so far toward the dark that the level ramp — the
      // whole lesson — stopped being readable exactly where the decay is.
      const dim = 0.28 * age;
      slices.push({
        fill,
        stroke,
        // The ridge line rides the SAME ramp as the fill (lifted toward white
        // so the crest still reads as a bright edge). It used to be one fixed
        // white-hot colour, which is what made the whole display look amber
        // regardless of how far the ridge had fallen.
        strokeColors: WF_HEAT_STOPS.map((st) =>
          rgbStr(mixRgb(mixRgb(st.rgb, WF_RIDGE_LIFT, 0.35), WF_COOL_DARK, 0.35 * age)),
        ),
        fillColors: WF_HEAT_STOPS.map((st) => rgbStr(mixRgb(st.rgb, WF_COOL_DARK, dim))),
        swid: 1.7 - 0.8 * cum,
        yTop: oy - amp,
        yBase: oy,
      });
    }
    // THE 2-D SIDE PROFILE IS GONE (owner asked what it was for, 2026-08-28;
    // design review agreed it should go). It drew the t=0 spectrum as a flat
    // green silhouette on a "side plane" to the right, and it was wrong four
    // ways at once:
    //   • it floated 45.5 px OUTBOARD of the solid's real side face, because it
    //     used dxTot for the recession and ignored the per-slice width shrink —
    //     so it stood on a plane that does not exist in the scene;
    //   • it reused the DEPTH direction to mean FREQUENCY, while everywhere
    //     else in this chart depth means TIME;
    //   • a flat #7dd87d curve whose HEIGHT encodes level painted a +12 dB peak
    //     and a −60 dB valley the same "moderate" green — the exact violation
    //     the 2026-08-28 colour ruling removed from the mountains themselves;
    //   • it duplicated the back ridge, which is already the tallest, brightest,
    //     unoccluded crest in the picture.
    // Deleting it also frees the right margin the time axis needs.
    // 1-SECOND FLOOR DIVISION LINES (owner 2026-07-29 + 2026-08-05 Altiverb
    // reference): one line across the floor at every whole second, each
    // labeled at its right end — the ridges cross them during the decay, so
    // the viewer SEES time going by. With the time flip, t=0 lives at the
    // BACK, so each second's band steps FORWARD toward the viewer.
    const timeMarks = waterfallTimeDivisions(tMax).map((tSec) => {
      const iF = (1 - tSec / tMax) * (WF_SLICES - 1);
      const cum = norm > 0 ? (1 - Math.pow(q, iF)) / norm : 0;
      const x0 = xL0 + dxTot * cum;
      const y = baseY - dyTot * cum;
      return { t: tSec, x0, x1: x0 + frontW * (1 - 0.2 * cum), y };
    });
    return { slices, xL0, frontW, dxTot, dyTot, baseY, ampH, timeMarks, tMax };
  }, [o.room, o.damping01, o.eqBoostDb, o.qRing, o.reverb, w, h]);

  // Fine axis annotations (all static memo geometry): front-edge freq ticks +
  // baseline, frequency GUIDE LINES running into the depth parallel to the
  // recession, the 1-second floor DIVISION LINES, the TIME depth arrow, the
  // dB height reference.
  const axes = useMemo(() => {
    // The floor the range stands on. Without it the mountains float in black
    // and the recession has to be inferred from the ridges alone. Built from
    // the SAME four corners the slices use — front edge at baseY, back edge
    // shrunk by the per-slice width taper — so it can't disagree with them.
    const floor = Skia.Path.Make();
    floor.moveTo(geo.xL0, geo.baseY);
    floor.lineTo(geo.xL0 + geo.frontW, geo.baseY);
    floor.lineTo(geo.xL0 + geo.dxTot + geo.frontW * 0.8, geo.baseY - geo.dyTot);
    floor.lineTo(geo.xL0 + geo.dxTot, geo.baseY - geo.dyTot);
    floor.close();
    const ticks = Skia.Path.Make();
    const depthGuides = Skia.Path.Make();
    for (const { f } of WF_FRONT_LABELS) {
      const x = geo.xL0 + lgFrac(f) * geo.frontW;
      ticks.moveTo(x, geo.baseY + 2);
      ticks.lineTo(x, geo.baseY + 6);
      // THE tie line for this frequency: from its front-edge position, running
      // INTO the depth parallel to the recession, so it stays over the SAME
      // frequency at every slice.
      //
      // There used to be a second, VERTICAL post here as well, rising from the
      // front edge to the old top label strip. On an angled chart that is
      // simply wrong: the scene recedes to the upper right, so a frequency's x
      // drifts 40–83 px between the front slice and the back one. A vertical
      // line holds the FRONT x all the way up, so it arrives at the back of the
      // scene sitting over a completely different frequency — it crossed the
      // range diagonally while claiming to mark one station, and clashed with
      // the depth guide for its own frequency. Owner 2026-08-28: "vertical
      // lines that clash and since chart is at angle do not line up in front
      // and back." Deleted; the depth guide is the only honest tie line.
      depthGuides.moveTo(x, geo.baseY);
      depthGuides.lineTo(geo.xL0 + geo.dxTot + lgFrac(f) * geo.frontW * 0.8, geo.baseY - geo.dyTot);
    }
    ticks.moveTo(geo.xL0, geo.baseY);
    ticks.lineTo(geo.xL0 + geo.frontW, geo.baseY);
    // 1-second division lines across the floor (labels are RN text below).
    const timeLines = Skia.Path.Make();
    for (const m of geo.timeMarks) {
      timeLines.moveTo(m.x0, m.y);
      timeLines.lineTo(m.x1, m.y);
    }
    // TIME arrow, parallel to the RIGHT edge it sits beside.
    //
    // The plot has PERSPECTIVE -- each slice is narrower than the one in front
    // of it (sw = frontW * (1 - 0.2 * cum)) -- so the left and right edges are
    // NOT parallel: the left recedes at about -49 deg and the right at about
    // -68 deg. This arrow was built from the LEFT edge's slope (dxTot, -dyTot)
    // but positioned on the RIGHT side, so it diverged ~19 deg from the edge
    // running beside it and pointed at a different horizon than the chart.
    // Owner 2026-08-28: "Why is this time line off the same horizon point as
    // the chart?" Use the right edge's own recession instead.
    const rdxTot = geo.dxTot - 0.2 * geo.frontW; // the RIGHT edge's x-run
    const ax0 = geo.xL0 + geo.frontW + 10;
    const ay0 = geo.baseY - 2;
    const ax1 = ax0 + rdxTot * 0.9;
    const ay1 = ay0 - geo.dyTot * 0.9;
    // Time now increases TOWARD the viewer (t=0 at the back), so the arrow
    // points down-forward: tail at the back corner, head at the front.
    const arrow = Skia.Path.Make();
    arrow.moveTo(ax1, ay1);
    arrow.lineTo(ax0, ay0);
    const angA = Math.atan2(ay0 - ay1, ax0 - ax1);
    for (const s of [-1, 1]) {
      arrow.moveTo(ax0, ay0);
      arrow.lineTo(ax0 - 6 * Math.cos(angA - s * 0.42), ay0 - 6 * Math.sin(angA - s * 0.42));
    }
    // dB KEY — a COLOUR key, not a geometric ruler.
    //
    // This gutter used to be a plain vertical ruler spanning ampH from baseY,
    // which is the FRONT slice's scale. But every slice has its own baseline
    // (oy = baseY − dyTot·cum) and its own height (amp = ampH·(1 − 0.18·cum)):
    // at the back the baseline is ~119 px higher and the scale ~18% shorter. So
    // the ruler was true for exactly ONE of 56 slices — and that one was the
    // FRONT slice, the most decayed, the one nobody is reading. Sighting across
    // from "−30" to the back ridge was wrong by a third of the plot height. A
    // confidently wrong anchor is worse than no anchor.
    //
    // COLOUR is the encoding that IS correct on every slice, because each
    // slice's gradient is anchored to its own yTop/yBase — the same colour means
    // the same dB at any depth. So the key shows the ramp itself. That also
    // gives the chart's most important encoding its first legend anywhere.
    // Key abuts the plot's left edge; the tick labels keep the full gutter to
    // its left (a "−60" at 10 pt mono needs ~24 px, so this budget is tight and
    // must not be eaten by the key).
    const keyW = 7;
    const keyX = geo.xL0 - keyW;
    const keyTop = geo.baseY - geo.ampH;
    const ref = Skia.Path.Make();
    ref.addRect(Skia.XYWHRect(keyX, keyTop, keyW, geo.ampH));
    const dbTickYs: { dbV: number; y: number }[] = [];
    for (const dbV of [0, -20, -40, WF_DB_FLOOR]) {
      const y = geo.baseY - ((dbV - WF_DB_FLOOR) / WF_DB_SPAN) * geo.ampH;
      dbTickYs.push({ dbV, y });
    }
    return { floor, ticks, depthGuides, timeLines, arrow, ref, keyX, keyW, keyTop, ax0, ay0, ax1, ay1, dbTickYs };
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
        <Path path={axes.floor} color="#12131a" />
        {/* dB colour key — the ramp itself, so the chart's main encoding has a
            legend. Same stops and axis direction as every slice. */}
        <Path path={axes.ref}>
          <LinearGradient
            start={vec(0, axes.keyTop)}
            end={vec(0, geo.baseY)}
            colors={WF_HEAT_STOPS.map((st) => rgbStr(st.rgb))}
            positions={WF_HEAT_POS}
          />
        </Path>
        {/* Floor grammar UNDER the mountains: depth guide lines + the labeled
            1-second division lines — ridges cross them as time goes by. */}
        {/* Frequency tie lines — one per labelled station, running from the
            label's front-edge position INTO the depth at the scene's angle, so
            each line stays over its own frequency on every slice. Drawn BEFORE
            the slices (owner 2026-08-28), so the opaque mountains occlude them:
            a line shows through where the range is QUIET and is hidden where it
            is loud, which reads as real depth instead of a grid pasted on top.
            Brightened now that most of each line is hidden. */}
        <Path path={axes.depthGuides} color="#8d93a3" style="stroke" strokeWidth={1} opacity={0.35} />
        {/* 1-second bands — bright, Altiverb-style, so time is unmissable. */}
        {/* Chrome must never out-contrast the data: at 0.75 these floor bands
            were brighter than the decayed mountain fills they run behind. They
            stay legible because they EMERGE from behind the ridges. */}
        <Path path={axes.timeLines} color="#c6ccda" style="stroke" strokeWidth={1.3} opacity={0.45} />
        <Path path={axes.arrow} color="#4b4e58" style="stroke" strokeWidth={1.2} strokeCap="round" />
        {/* The mountain range: BACK-TO-FRONT so opaque fills occlude. */}
        {Array.from({ length: WF_SLICES }, (_, k) => {
          const i = WF_SLICES - 1 - k;
          return <WfSlice key={i} slice={geo.slices[i]} index={i} phase={phase} animate={animate} />;
        })}
        {/* Phase A impulse flash on the t=0 slice — the BACK ridge. */}
        <Path path={geo.slices[WF_SLICES - 1].stroke} color="#ffffff" style="stroke" strokeWidth={2.6} opacity={flashOp}>
          <BlurMask blur={5} style="normal" />
        </Path>
        <Path path={axes.ticks} color={GRID} style="stroke" strokeWidth={1.2} />
      </Canvas>
      {/* Frequency labels along the BOTTOM / front edge, one per tie line
          (owner 2026-08-28: "show the freq (Hz) scale numbers ... down"). They
          sat in the top strip, which put the scale at the far end of the
          mountains it labels; at the front edge each number is next to the
          frequency it names. */}
      {WF_FRONT_LABELS.map((d) => (
        <RNText
          key={`f${d.f}`}
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(w - 34, geo.xL0 + lgFrac(d.f) * geo.frontW - 17)),
            width: 34,
            top: geo.baseY + 9,
            textAlign: 'center',
            ...axisText,
            fontSize: 11,
          }}
        >
          {d.label}
        </RNText>
      ))}
      {/* Hz caps the RIGHT end of the frequency strip. At the left it sat at
          x 1–27 while the "30" label clamped to x 26, so the unit and the first
          tick touched; and it read as a seventh station rather than as the
          scale's unit. */}
      <RNText
        style={{
          position: 'absolute',
          // The 20k label is centred in a 34 px box, so it overhangs the front
          // corner by 17 px — Hz has to start past that, not at the corner.
          left: Math.min(w - 24, geo.xL0 + geo.frontW + 20),
          top: geo.baseY + 9,
          width: 24,
          textAlign: 'left',
          ...teachText,
          fontSize: 11,
        }}
      >
        Hz
      </RNText>
      {/* Second marks, drawn INBOARD of each floor line's right end rather than
          outboard. Outboard they were clamped against the canvas edge and sat
          on top of the time arrow; inboard they need no clamp and leave the
          right margin to the axis. Short units ("1s") so they read as ticks on
          one scale, not as three separate captions. */}
      {geo.timeMarks.map((m) => (
        <RNText
          key={`t${m.t}`}
          style={{
            position: 'absolute',
            left: m.x1 - 32,
            width: 30,
            top: m.y - 5,
            textAlign: 'right',
            fontFamily: fonts.mono,
            fontSize: 10,
            color: AXIS_TEXT,
          }}
        >
          {fmtSec(m.t)}
        </RNText>
      ))}
      {/* TIME depth arrow labels. */}
      <RNText
        style={{
          position: 'absolute',
          left: Math.min(w - 40, (axes.ax0 + axes.ax1) / 2 + 2),
          top: (axes.ay0 + axes.ay1) / 2 - 6,
          ...teachText,
          fontSize: 11,
        }}
      >
        TIME
      </RNText>
      {/* The arrow's two ends carry the scale's endpoints — 0 s at the back
          (the impulse) and 3 s at the front — so together with the 1s/2s floor
          marks there is ONE time scale reading 0·1·2·3, not two competing
          ones. */}
      <RNText
        style={{
          position: 'absolute',
          // Clear of the frequency strip that now owns the bottom edge: sits
          // just outside the front corner, beside the range rather than under it.
          left: Math.max(0, Math.min(w - 36, axes.ax0 + 4)),
          top: Math.max(0, axes.ay0 - 12),
          width: 36,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 10,
          color: AXIS_TEXT,
        }}
      >
        {fmtSec(geo.tMax)}
      </RNText>
      <RNText
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(w - 24, axes.ax1 - 4)),
          top: Math.max(0, axes.ay1 - 13),
          width: 24,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 10,
          color: AXIS_TEXT,
        }}
      >
        0s
      </RNText>
      {/* dB height reference. */}
      {axes.dbTickYs.map(({ dbV, y }) => (
        <RNText
          key={`r${dbV}`}
          style={{
            position: 'absolute',
            left: 0,
            width: axes.keyX - 2,
            top: y - 5,
            textAlign: 'right',
            fontFamily: fonts.mono,
            fontSize: 10,
            color: AXIS_TEXT,
          }}
        >
          {dbV > 0 ? `+${dbV}` : `${dbV}`}
        </RNText>
      ))}
      <RNText
        style={{
          position: 'absolute',
          left: 0,
          width: geo.xL0 - 8,
          // Clears the "+12" tick, which sits at (baseY - ampH) - 5 and is ~13
          // px tall — at -15 the caption landed on top of it (owner 2026-08-28:
          // "the dB marking is showing over the +12").
          top: geo.baseY - geo.ampH - 30,
          textAlign: 'right',
          ...teachText,
          fontSize: 11,
        }}
      >
        dB
      </RNText>
    </View>
  );
}
