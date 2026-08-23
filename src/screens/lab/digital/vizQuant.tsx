/**
 * digital/vizQuant — Skia visuals for Module 3 (Quantization & Bit Depth +
 * Dither) and Module 4 (Binary Sample Values). ONLY loaded through
 * skiaGate.requireVizQuant(); this file (plus foundations/viz, whose clocks it
 * re-exports) is the only Skia importer for these two modules.
 *
 * PERFORMANCE (visual standards §6): everything here is STATIC-PER-STATE —
 * geometry is rebuilt in useMemo when a control changes; there are no frame
 * clocks. The single animated value is the bit-toggle sample dot, which eases
 * to its new amplitude with withTiming (standards §4: no teleports).
 *
 * HONESTY (§1.7 + module charter):
 *  • The quantizer is REAL math — mid-tread two's-complement rounding,
 *    clamped to [−2^(N−1), 2^(N−1)−1] — so every step, whisker and error
 *    trace is the true arithmetic, never a cartoon.
 *  • Dither is REAL math on a seeded deterministic array (hashW idiom):
 *    RPDF = uniform(−Δ/2, Δ/2), TPDF = sum of two such uniforms, noise-shaped
 *    = TPDF + first-order error feedback. Only the dither SPECTRUM strip is a
 *    simplified illustrative shape (host badges it — it is not an FFT).
 *  • Above 4 bits the level grid is drawn as a fine ruled band because the
 *    real steps are sub-pixel; the host says so instead of exaggerating.
 *
 * Abstract data stays abstract but styled (standards §2): gradient underfills,
 * layered glow strokes, never hairline-on-black.
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Line as SkLine,
  LinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';

export { usePhaseClock, useVizClock } from '../foundations/viz';

// House palette (lab tokens per visual standards §3).
const WAVE = colors.amber; //      #ffc64d — the signal / stored values accent
const ACCENT_BLUE = '#6fa8ff'; //  energy / original samples
const ACCENT_GREEN = '#5bff85'; // good / reconstruction
const ACCENT_RED = '#ff6b5e'; //   problem / error
const GRID = '#3a3b46';
const BG = '#0c0c0f';

/** Worklet-safe deterministic hash (foundations idiom) — seeded, reproducible. */
function hashW(n: number): number {
  'worklet';
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

/** REAL mid-tread quantizer on the normalized −1..+1 axis: round to the code
 *  grid k/2^(N−1), clamped to the two's-complement range [−2^(N−1), 2^(N−1)−1].
 *  Step Δ = 1/2^(N−1) of full scale (peak). */
function quantizeNorm(x: number, bits: number): number {
  const half = Math.pow(2, bits - 1);
  const code = Math.max(-half, Math.min(half - 1, Math.round(x * half)));
  return code / half;
}

type SkPathT = ReturnType<typeof Skia.Path.Make>;

/** Smooth trace through points via quadratics to segment midpoints. */
function smoothThrough(xs: number[], ys: number[]): SkPathT {
  const p = Skia.Path.Make();
  if (xs.length === 0) return p;
  p.moveTo(xs[0], ys[0]);
  for (let i = 1; i < xs.length - 1; i++) {
    p.quadTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
  }
  if (xs.length > 1) p.lineTo(xs[xs.length - 1], ys[ys.length - 1]);
  return p;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 3 hero — QuantView

/**
 * The quantization scene: continuous sine, the 2^N level grid (individual
 * lines ≤ 4 bits, fine ruled band above — the honest sub-pixel treatment),
 * sampled points, ROUNDED stored values snapped to levels, error whiskers,
 * and the reconstructed-result trace. `errorOnly` hides the signal and shows
 * (original − quantized) alone, vertically zoomed ×2^N (±Δ/2 fills the panel;
 * clipping error near 0 dBFS is visually clamped at the frame edge).
 */
export function QuantView({
  width,
  bits,
  levelDb,
  errorOnly,
}: {
  width: number;
  bits: number;
  /** Signal peak level, dBFS (0 … −40). */
  levelDb: number;
  errorOnly: boolean;
}) {
  const H = 184;
  const geo = useMemo(() => {
    const padX = 10;
    const innerW = width - padX * 2;
    const midY = H / 2;
    const ampPx = H / 2 - 16;
    const amp = Math.pow(10, levelDb / 20);
    const half = Math.pow(2, bits - 1);
    const step = 1 / half; // Δ, in units of full-scale peak
    const yOf = (v: number) => midY - v * ampPx;
    const xOf = (t: number) => padX + t * innerW; // t 0..1
    const cycles = 2;
    const sig = (t: number) => amp * Math.sin(2 * Math.PI * cycles * t);

    // Level grid — REAL code lines at k/2^(N−1).
    const levelLines = Skia.Path.Make();
    const drawIndividual = bits <= 4;
    if (drawIndividual) {
      for (let k = -half; k <= half - 1; k++) {
        const y = yOf(k / half);
        levelLines.moveTo(padX, y);
        levelLines.lineTo(width - padX, y);
      }
    } else {
      // Fine ruled band: the steps are finer than these rules (host badges it).
      for (let y = midY - ampPx; y <= midY + ampPx; y += 3.5) {
        levelLines.moveTo(padX, y);
        levelLines.lineTo(width - padX, y);
      }
    }

    // Continuous original signal (dense).
    const M = 192;
    const sigPath = Skia.Path.Make();
    for (let i = 0; i <= M; i++) {
      const t = i / M;
      const y = yOf(sig(t));
      if (i === 0) sigPath.moveTo(xOf(t), y);
      else sigPath.lineTo(xOf(t), y);
    }

    // Samples → stored (rounded) values → whiskers → reconstruction.
    const NS = 23;
    const origDots = Skia.Path.Make();
    const quantDots = Skia.Path.Make();
    const whiskers = Skia.Path.Make();
    const qx: number[] = [];
    const qy: number[] = [];
    for (let i = 0; i < NS; i++) {
      const t = i / (NS - 1);
      const x = xOf(t);
      const v = sig(t);
      const q = quantizeNorm(v, bits);
      const yv = yOf(v);
      const yq = yOf(q);
      origDots.addCircle(x, yv, 2.2);
      quantDots.addCircle(x, yq, 2.7);
      if (Math.abs(yq - yv) >= 0.75) {
        whiskers.moveTo(x, yv);
        whiskers.lineTo(x, yq);
      }
      qx.push(x);
      qy.push(yq);
    }
    const recon = smoothThrough(qx, qy);

    // ERROR ONLY: e(t) = original − quantized, drawn zoomed so ±Δ/2 fills the
    // panel (vertical zoom ×2^N). Clipping error (only near 0 dBFS at the last
    // code) is clamped to the frame — the host caption owns the zoom honesty.
    const eScale = ampPx / (step / 2);
    const errPath = Skia.Path.Make();
    const errFill = Skia.Path.Make();
    errFill.moveTo(xOf(0), midY);
    for (let i = 0; i <= M; i++) {
      const t = i / M;
      const v = sig(t);
      const e = v - quantizeNorm(v, bits);
      const y = midY - Math.max(-ampPx, Math.min(ampPx, e * eScale));
      if (i === 0) errPath.moveTo(xOf(t), y);
      else errPath.lineTo(xOf(t), y);
      errFill.lineTo(xOf(t), y);
    }
    errFill.lineTo(xOf(1), midY);
    errFill.close();

    return { padX, midY, ampPx, levelLines, drawIndividual, sigPath, origDots, quantDots, whiskers, recon, errPath, errFill };
  }, [width, bits, levelDb]);

  const { padX, midY, ampPx, levelLines, drawIndividual, sigPath, origDots, quantDots, whiskers, recon, errPath, errFill } = geo;

  return (
    <Canvas style={{ width, height: H, backgroundColor: BG, borderRadius: 8 }}>
      {/* Zero / midline (both views). */}
      <SkLine p1={{ x: padX, y: midY }} p2={{ x: width - padX, y: midY }} color="#3a3a42" strokeWidth={1} />
      {errorOnly ? (
        <Group>
          {/* ±Δ/2 frame — the whole vertical range in this zoomed view. */}
          <SkLine p1={{ x: padX, y: midY - ampPx }} p2={{ x: width - padX, y: midY - ampPx }} color={GRID} strokeWidth={1} />
          <SkLine p1={{ x: padX, y: midY + ampPx }} p2={{ x: width - padX, y: midY + ampPx }} color={GRID} strokeWidth={1} />
          <Path path={errFill} opacity={0.9}>
            <LinearGradient
              start={vec(0, midY - ampPx)}
              end={vec(0, midY + ampPx)}
              colors={['rgba(255,107,94,0.30)', 'rgba(255,107,94,0.05)', 'rgba(255,107,94,0.30)']}
              positions={[0, 0.5, 1]}
            />
          </Path>
          <Path path={errPath} color={ACCENT_RED} style="stroke" strokeWidth={4} opacity={0.28}>
            <BlurMask blur={5} style="normal" />
          </Path>
          <Path path={errPath} color={ACCENT_RED} style="stroke" strokeWidth={1.7} />
        </Group>
      ) : (
        <Group>
          {/* Level grid — individual code lines ≤4 bits, fine ruled band above. */}
          {!drawIndividual ? (
            <Rect x={padX} y={midY - ampPx} width={width - padX * 2} height={ampPx * 2}>
              <LinearGradient
                start={vec(0, midY - ampPx)}
                end={vec(0, midY + ampPx)}
                colors={['rgba(111,168,255,0.07)', 'rgba(111,168,255,0.02)', 'rgba(111,168,255,0.07)']}
                positions={[0, 0.5, 1]}
              />
            </Rect>
          ) : null}
          <Path path={levelLines} color={GRID} style="stroke" strokeWidth={1} opacity={drawIndividual ? 0.9 : 0.35} />
          {/* Original continuous signal — amber, glow + crisp. */}
          <Path path={sigPath} color={WAVE} style="stroke" strokeWidth={5} opacity={0.22}>
            <BlurMask blur={6} style="normal" />
          </Path>
          <Path path={sigPath} color={WAVE} style="stroke" strokeWidth={1.8} />
          {/* Reconstructed-result trace through the STORED values. */}
          <Path path={recon} color={ACCENT_GREEN} style="stroke" strokeWidth={3.4} opacity={0.2}>
            <BlurMask blur={4} style="normal" />
          </Path>
          <Path path={recon} color={ACCENT_GREEN} style="stroke" strokeWidth={1.4} opacity={0.95} />
          {/* Error whiskers: original → stored. */}
          <Path path={whiskers} color={ACCENT_RED} style="stroke" strokeWidth={1.3} opacity={0.9} />
          {/* Sampled points (blue) and rounded stored values (green). */}
          <Path path={origDots} color={ACCENT_BLUE} opacity={0.95} />
          <Path path={quantDots} color={ACCENT_GREEN} />
        </Group>
      )}
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 3 — DitherView

export type DitherMode = 'none' | 'rpdf' | 'tpdf' | 'shaped';

// Fixed teaching setup: a −39 dBFS sine (1.4 Δ) reduced to 8 bits, view zoomed
// to ±3 steps around zero so the codes are visible. All REAL math (see header).
const D_BITS = 8;
const D_HALF = Math.pow(2, D_BITS - 1);
const D_STEP = 1 / D_HALF;
const D_AMP = 1.4 * D_STEP;
const D_N = 168;
const D_CYCLES = 2.5;

type DitherData = {
  xIn: number[]; //  original samples
  yOut: number[]; // quantized (dithered) output
  err: number[]; //  total error out − in
};

function computeDither(mode: DitherMode): DitherData {
  const xIn: number[] = [];
  const yOut: number[] = [];
  const err: number[] = [];
  let ePrev = 0; // first-order error-feedback state (noise shaping)
  for (let i = 0; i < D_N; i++) {
    const x = D_AMP * Math.sin((2 * Math.PI * D_CYCLES * i) / D_N);
    // Seeded deterministic uniforms (hashW idiom — reproducible frame to frame).
    const u1 = hashW(i * 12.9898 + 7.7);
    const u2 = hashW(i * 78.233 + 3.1);
    let d = 0;
    if (mode === 'rpdf') d = (u1 - 0.5) * D_STEP; //          uniform(−Δ/2, Δ/2)
    if (mode === 'tpdf' || mode === 'shaped') d = (u1 - 0.5) * D_STEP + (u2 - 0.5) * D_STEP; // sum of two uniforms
    let y: number;
    if (mode === 'shaped') {
      const vin = x - ePrev; // subtract previous quantization error (1st order)
      y = quantizeNorm(vin + d, D_BITS);
      ePrev = y - vin;
    } else {
      y = quantizeNorm(x + d, D_BITS);
    }
    xIn.push(x);
    yOut.push(y);
    err.push(y - x);
  }
  return { xIn, yOut, err };
}

/** One labeled strip: tiny eyebrow + canvas. */
function Strip({ label, children, width, height }: { label: string; children: React.ReactNode; width: number; height: number }) {
  return (
    <View style={{ gap: 3 }}>
      <RNText style={vstyles.stripLabel}>{label}</RNText>
      <Canvas style={{ width, height, backgroundColor: BG, borderRadius: 6 }}>{children}</Canvas>
    </View>
  );
}

/**
 * The dither scene: a low-level sine reduced to 8 bits with the selected
 * dither, drawn as (1) quantized output over the faint original, (2) the
 * total-error waveform, (3) a histogram of the error values (correlated
 * spikes vs flat/triangular spread), and (4) a SIMPLIFIED noise-spectrum
 * strip (illustrative shape, not an FFT — the host badges it).
 */
export function DitherView({ width, mode }: { width: number; mode: DitherMode }) {
  const HW = 88; // waveform strip
  const HE = 44; // error strip
  const HH = 42; // histogram strip
  const HS = 42; // spectrum strip
  const geo = useMemo(() => {
    const padX = 8;
    const innerW = width - padX * 2;
    const xOf = (i: number) => padX + (i / (D_N - 1)) * innerW;
    const { xIn, yOut, err } = computeDither(mode);

    // Waveform strip: view range ±3Δ.
    const wMid = HW / 2;
    const wScale = (HW / 2 - 6) / (3 * D_STEP);
    const yW = (v: number) => wMid - v * wScale;
    const orig = Skia.Path.Make();
    const quant = Skia.Path.Make();
    for (let i = 0; i < D_N; i++) {
      const xo = xOf(i);
      if (i === 0) {
        orig.moveTo(xo, yW(xIn[i]));
        quant.moveTo(xo, yW(yOut[i]));
      } else {
        orig.lineTo(xo, yW(xIn[i]));
        quant.lineTo(xo, yW(yOut[i - 1])); // hold → step
        quant.lineTo(xo, yW(yOut[i]));
      }
    }
    const codeLines = Skia.Path.Make();
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      codeLines.moveTo(padX, yW(k * D_STEP));
      codeLines.lineTo(width - padX, yW(k * D_STEP));
    }

    // Error strip: range ±1.6Δ.
    const eMid = HE / 2;
    const eScale = (HE / 2 - 4) / (1.6 * D_STEP);
    const errP = Skia.Path.Make();
    for (let i = 0; i < D_N; i++) {
      const y = eMid - Math.max(-(HE / 2 - 3), Math.min(HE / 2 - 3, err[i] * eScale));
      if (i === 0) errP.moveTo(xOf(i), y);
      else errP.lineTo(xOf(i), y);
    }

    // Histogram: 21 bins across ±1.6Δ of the REAL error values.
    const BINS = 21;
    const counts = new Array<number>(BINS).fill(0);
    for (const e of err) {
      const b = Math.max(0, Math.min(BINS - 1, Math.floor(((e / (1.6 * D_STEP) + 1) / 2) * BINS)));
      counts[b] += 1;
    }
    const cMax = Math.max(1, ...counts);
    const hist = Skia.Path.Make();
    const barW = innerW / BINS;
    for (let b = 0; b < BINS; b++) {
      const h = (counts[b] / cMax) * (HH - 8);
      if (h > 0) hist.addRect({ x: padX + b * barW + 1, y: HH - 3 - h, width: barW - 2, height: h });
    }

    // Spectrum strip — SIMPLIFIED ILLUSTRATIVE SHAPE (badged by the host):
    // signal spike at the left; error content per mode: harmonic spikes
    // (undithered), flat floor (RPDF/TPDF), rising first-order-shaped floor.
    const specBase = HS - 4;
    const spikes = Skia.Path.Make();
    const floor = Skia.Path.Make();
    const floorFill = Skia.Path.Make();
    const sigX = padX + innerW * 0.07;
    if (mode === 'none') {
      for (let k = 0; k < 6; k++) {
        const hx = padX + innerW * (0.21 + k * 0.145);
        const hh = (HS - 12) * (0.72 - k * 0.1);
        spikes.addRect({ x: hx - 1.1, y: specBase - hh, width: 2.2, height: hh });
      }
    } else {
      const floorY = (f: number) => {
        // f 0..1 across the band
        if (mode === 'shaped') {
          const g = Math.pow(Math.sin((Math.PI / 2) * f), 2); // |1−z⁻¹| tilt
          return specBase - (4 + g * (HS - 16));
        }
        return specBase - (HS - 12) * 0.34; // flat floor (RPDF/TPDF)
      };
      floor.moveTo(padX, floorY(0));
      floorFill.moveTo(padX, specBase);
      const FM = 60;
      for (let i = 0; i <= FM; i++) {
        const f = i / FM;
        const ripple = (hashW(i * 3.3 + (mode === 'shaped' ? 9 : 2)) - 0.5) * 2.4;
        const y = floorY(f) + ripple;
        floor.lineTo(padX + f * innerW, y);
        floorFill.lineTo(padX + f * innerW, y);
      }
      floorFill.lineTo(width - padX, specBase);
      floorFill.close();
    }

    return { padX, wMid, orig, quant, codeLines, eMid, errP, hist, spikes, floor, floorFill, sigX, specBase };
  }, [width, mode]);

  const g = geo;
  return (
    <View style={{ gap: 8 }}>
      <Strip label={`LOW-LEVEL SINE → ${D_BITS}-BIT · VIEW ZOOMED TO ±3 STEPS`} width={width} height={HW}>
        <SkLine p1={{ x: g.padX, y: g.wMid }} p2={{ x: width - g.padX, y: g.wMid }} color="#3a3a42" strokeWidth={1} />
        <Path path={g.codeLines} color={GRID} style="stroke" strokeWidth={1} opacity={0.8} />
        <Path path={g.orig} color={ACCENT_BLUE} style="stroke" strokeWidth={1.3} opacity={0.55} />
        <Path path={g.quant} color={WAVE} style="stroke" strokeWidth={3.4} opacity={0.22}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={g.quant} color={WAVE} style="stroke" strokeWidth={1.5} />
      </Strip>
      <Strip label="TOTAL ERROR (OUTPUT − INPUT)" width={width} height={HE}>
        <SkLine p1={{ x: g.padX, y: g.eMid }} p2={{ x: width - g.padX, y: g.eMid }} color="#3a3a42" strokeWidth={1} />
        <Path path={g.errP} color={ACCENT_RED} style="stroke" strokeWidth={2.6} opacity={0.25}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={g.errP} color={ACCENT_RED} style="stroke" strokeWidth={1.1} />
      </Strip>
      <Strip label="ERROR HISTOGRAM (SPIKES = CORRELATED · SPREAD = DITHERED)" width={width} height={HH}>
        <Path path={g.hist}>
          <LinearGradient start={vec(0, 0)} end={vec(0, HH)} colors={['#5bff85', 'rgba(91,255,133,0.25)']} />
        </Path>
      </Strip>
      <Strip label="NOISE SPECTRUM — SIMPLIFIED SHAPE (NOT AN FFT)" width={width} height={HS}>
        <SkLine p1={{ x: g.padX, y: g.specBase }} p2={{ x: width - g.padX, y: g.specBase }} color={GRID} strokeWidth={1} />
        {/* The sine itself. */}
        <SkLine p1={{ x: g.sigX, y: g.specBase }} p2={{ x: g.sigX, y: 5 }} color={WAVE} strokeWidth={2.4} />
        <SkLine p1={{ x: g.sigX, y: g.specBase }} p2={{ x: g.sigX, y: 5 }} color={WAVE} strokeWidth={5} opacity={0.25}>
          <BlurMask blur={4} style="normal" />
        </SkLine>
        {/* Error content. */}
        <Path path={g.spikes} color={ACCENT_RED} opacity={0.95} />
        <Path path={g.floorFill}>
          <LinearGradient start={vec(0, 0)} end={vec(0, HS)} colors={['rgba(111,168,255,0.30)', 'rgba(111,168,255,0.04)']} />
        </Path>
        <Path path={g.floor} color={ACCENT_BLUE} style="stroke" strokeWidth={1.3} opacity={0.9} />
      </Strip>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 4 — InspectStripView (tap/drag to select one sample)

const INS_H = 128;
const INS_PAD = 14;

/**
 * A short sampled waveform strip: stems + dots for each stored sample and a
 * faint smooth trace for context. Tap or drag horizontally to select the
 * nearest sample (highlighted with a glow ring + vertical guide). Values are
 * signed 16-bit ints, normalized here as v/32768.
 */
export function InspectStripView({
  width,
  values,
  selected,
  onSelect,
}: {
  width: number;
  /** Signed 16-bit sample values (−32768..32767). */
  values: number[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const n = values.length;
  const innerW = width - INS_PAD * 2;
  const dx = n > 1 ? innerW / (n - 1) : innerW;

  // DragSlider idiom: refs so the (stable) PanResponder always sees fresh data.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const dxRef = useRef(dx);
  dxRef.current = dx;
  const nRef = useRef(n);
  nRef.current = n;
  const pick = (locX: number) => {
    const i = Math.round((locX - INS_PAD) / dxRef.current);
    onSelectRef.current(Math.max(0, Math.min(nRef.current - 1, i)));
  };
  const baseXRef = useRef(0); // anchored-drag base — avoids locationX re-base whip
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      // Anchor to the gesture START X (owner 2026-08-23): base + gestureState.dx
      // reproduces the true finger X without re-basing, so dragging past the
      // track edge no longer jumps the selection to the opposite sample.
      onPanResponderGrant: (e, g) => {
        baseXRef.current = e.nativeEvent.locationX - g.dx;
        pick(baseXRef.current);
      },
      onPanResponderMove: (_e, g) => pick(baseXRef.current + g.dx),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const geo = useMemo(() => {
    const midY = INS_H / 2;
    const ampPx = INS_H / 2 - 14;
    const xs: number[] = [];
    const ys: number[] = [];
    const stems = Skia.Path.Make();
    const dots = Skia.Path.Make();
    for (let i = 0; i < n; i++) {
      const x = INS_PAD + i * dx;
      const y = midY - (values[i] / 32768) * ampPx;
      xs.push(x);
      ys.push(y);
      stems.moveTo(x, midY);
      stems.lineTo(x, y);
      dots.addCircle(x, y, 2.6);
    }
    const trace = smoothThrough(xs, ys);
    return { midY, xs, ys, stems, dots, trace };
  }, [width, values, n, dx]);

  const selX = geo.xs[selected] ?? INS_PAD;
  const selY = geo.ys[selected] ?? geo.midY;

  return (
    <View {...pan.panHandlers}>
      <Canvas pointerEvents="none" style={{ width, height: INS_H, backgroundColor: BG, borderRadius: 8 }}>
        <SkLine p1={{ x: INS_PAD - 6, y: geo.midY }} p2={{ x: width - INS_PAD + 6, y: geo.midY }} color="#3a3a42" strokeWidth={1} />
        <Path path={geo.trace} color={ACCENT_BLUE} style="stroke" strokeWidth={3.4} opacity={0.16}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={geo.trace} color={ACCENT_BLUE} style="stroke" strokeWidth={1.1} opacity={0.5} />
        <Path path={geo.stems} color={GRID} style="stroke" strokeWidth={1.4} />
        <Path path={geo.dots} color={WAVE} opacity={0.9} />
        {/* Selection: vertical guide + glow halo + lifted dot. */}
        <SkLine p1={{ x: selX, y: 6 }} p2={{ x: selX, y: INS_H - 6 }} color={ACCENT_GREEN} strokeWidth={1} opacity={0.55} />
        <Circle cx={selX} cy={selY} r={9} color={ACCENT_GREEN} opacity={0.3}>
          <BlurMask blur={6} style="normal" />
        </Circle>
        <Circle cx={selX} cy={selY} r={4.4} color={ACCENT_GREEN} />
        <Circle cx={selX} cy={selY} r={6.5} color={ACCENT_GREEN} style="stroke" strokeWidth={1} opacity={0.8} />
      </Canvas>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 4 — BitDotStrip (the bit-toggle exercise's live amplitude dot)

const DOT_H = 78;

/**
 * A mini amplitude strip for the bit-toggle exercise: full-scale rails, zero
 * line, and one sample dot that EASES (withTiming — standards §4) to the
 * amplitude of the current 16-bit value. y is the only animated value; the
 * derived stem endpoint is worklet-safe.
 */
export function BitDotStrip({ width, value }: { width: number; value: number }) {
  const midY = DOT_H / 2;
  const ampPx = DOT_H / 2 - 10;
  const dotX = width * 0.5;
  const target = midY - (value / 32768) * ampPx;
  const y = useSharedValue(target);
  useEffect(() => {
    y.value = withTiming(target, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [target, y]);
  const stemP2 = useDerivedValue(() => ({ x: dotX, y: y.value }));

  const rails = useMemo(() => {
    const p = Skia.Path.Make();
    const padX = 10;
    for (const ry of [midY - ampPx, midY + ampPx]) {
      for (let x = padX; x < width - padX; x += 9) {
        p.moveTo(x, ry);
        p.lineTo(x + 4.5, ry);
      }
    }
    return p;
  }, [width, midY, ampPx]);

  return (
    <Canvas style={{ width, height: DOT_H, backgroundColor: BG, borderRadius: 8 }}>
      <Rect x={0} y={0} width={width} height={DOT_H}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, DOT_H)}
          colors={['rgba(255,107,94,0.06)', 'rgba(111,168,255,0.02)', 'rgba(255,107,94,0.06)']}
          positions={[0, 0.5, 1]}
        />
      </Rect>
      <Path path={rails} color={ACCENT_RED} style="stroke" strokeWidth={1} opacity={0.55} />
      <SkLine p1={{ x: 10, y: midY }} p2={{ x: width - 10, y: midY }} color="#3a3a42" strokeWidth={1} />
      <SkLine p1={{ x: dotX, y: midY }} p2={stemP2} color={WAVE} strokeWidth={1.6} opacity={0.8} />
      <Circle cx={dotX} cy={y} r={9} color={WAVE} opacity={0.3}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Circle cx={dotX} cy={y} r={4.6} color={WAVE} />
    </Canvas>
  );
}

const vstyles = StyleSheet.create({
  stripLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.1, color: colors.textSub },
});
