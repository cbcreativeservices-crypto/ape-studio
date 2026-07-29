/**
 * digital/vizSignal — Skia visuals for the Digital Lab's Module 1 (The Analog
 * Signal) and Module 2 (Sampling & Sample Rate). ONLY loaded via
 * digital/skiaGate.requireVizSignal(), so pre-Skia clients never evaluate it.
 *
 * ANTI-MISCONCEPTION CHARTER (owner's core requirement):
 *  • never draw or imply staircase digital audio,
 *  • never imply higher sample rate = "smoother",
 *  • sample dots read as MEASUREMENTS of a continuous signal — dots ON the
 *    curve at vertical sampling instants, never blocks of sound.
 *
 * HONESTY (§1.7): square/saw/triangle/impulse are drawn BAND-LIMITED from 12
 * harmonics (the honest shape a real chain carries — host panels badge it);
 * the reconstruction overlay of a pure sine is the sine itself (exact, not
 * smoothed); the AA filter drawing is a magnitude-rolloff model only.
 *
 * VISUAL STANDARDS (docs/APE_VISUAL_STANDARDS_2026_07_29.md): the speaker and
 * mic are illustrated objects (gradient forms, light upper-left), abstract
 * graphs get glow strokes + gradient underfills, statics live in useMemo and
 * per-frame work in worklet-safe useDerivedValue, stroke widths scale.
 */
import { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Line as SkLine,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { fonts } from '../../../theme/tokens';
export { usePhaseClock, useVizClock } from '../foundations/viz';

// Lab palette (house tokens — amber signal, blue energy, green good, red problem).
const BG = '#0c0c0f';
const WAVE = '#ffc64d';
const ACCENT_BLUE = '#6fa8ff';
const ACCENT_GREEN = '#5bff85';
const ACCENT_RED = '#ff6b5e';
const GRID = '#2c2c33';
const GHOST = '#232329';
const LABEL = '#8a8f9a';
const TICK = '#767a85';
// Illustration tones (light source: upper-left).
const METAL_HI = '#c6cad4';
const METAL_MID = '#7c7f89';
const METAL_LO = '#3a3c44';
const BODY_HI = '#4a4d58';
const BODY_LO = '#1e1f26';

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Deterministic hash noise (worklet-safe; no RNG state). */
function hash(n: number): number {
  'worklet';
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Waveform math — BAND-LIMITED drawings (12 harmonics), shared by both modules
// and by the module file's readout math (via computeWaveStats).

export type WaveKind = 'sine' | 'square' | 'triangle' | 'saw' | 'impulse' | 'noise';

/** Drawn harmonic count — the disclosed band limit of the square/saw/triangle
 *  and impulse shapes (host panels badge "12 HARMONICS"). */
export const DRAWN_HARMONICS = 12;

/** Unnormalized band-limited waveform value at phase th (radians). 'noise' is
 *  handled by sourceSample (hash-based — not a function of phase alone). */
function rawWave(kind: WaveKind, th: number): number {
  'worklet';
  if (kind === 'sine') return Math.sin(th);
  if (kind === 'square') {
    let s = 0;
    for (let n = 1; n <= 2 * DRAWN_HARMONICS - 1; n += 2) s += Math.sin(n * th) / n;
    return (4 / Math.PI) * s;
  }
  if (kind === 'triangle') {
    let s = 0;
    for (let i = 0; i < DRAWN_HARMONICS; i++) {
      const n = 2 * i + 1;
      s += ((i % 2 === 0 ? 1 : -1) / (n * n)) * Math.sin(n * th);
    }
    return (8 / (Math.PI * Math.PI)) * s;
  }
  if (kind === 'saw') {
    let s = 0;
    for (let n = 1; n <= DRAWN_HARMONICS; n++) s += ((n % 2 === 1 ? 1 : -1) / n) * Math.sin(n * th);
    return (2 / Math.PI) * s;
  }
  if (kind === 'impulse') {
    // Band-limited impulse train: equal-weight cosine stack, unit peak at th=0.
    let s = 0;
    for (let n = 1; n <= DRAWN_HARMONICS; n++) s += Math.cos(n * th);
    return s / DRAWN_HARMONICS;
  }
  return 0; // 'noise' — see sourceSample
}

function peakOf(kind: WaveKind): number {
  let m = 0;
  for (let i = 0; i < 4096; i++) m = Math.max(m, Math.abs(rawWave(kind, (i / 4096) * 2 * Math.PI)));
  return m > 0 ? m : 1;
}

/** Peak normalization (Gibbs overshoot etc.) so every kind spans ±1 drawn. */
const WAVE_NORM: Record<WaveKind, number> = {
  sine: peakOf('sine'),
  square: peakOf('square'),
  triangle: peakOf('triangle'),
  saw: peakOf('saw'),
  impulse: peakOf('impulse'),
  noise: 1,
};

/** Normalized (±1 peak) band-limited waveform value at phase th. */
export function waveSample(kind: WaveKind, th: number): number {
  'worklet';
  return rawWave(kind, th) / WAVE_NORM[kind];
}

/** Source value at phase th, INCLUDING the white-noise kind (smoothed hash so
 *  the drawn voltage scrolls deterministically and the diaphragm/cone match). */
function sourceSample(kind: WaveKind, th: number): number {
  'worklet';
  if (kind === 'noise') {
    const a = Math.floor(th * 4);
    const fr = th * 4 - a;
    const y0 = (hash(a * 127.1) - 0.5) * 2;
    const y1 = (hash((a + 1) * 127.1) - 0.5) * 2;
    return (y0 + (y1 - y0) * fr) * 0.85;
  }
  return waveSample(kind, th);
}

/** Disclosed soft distortion model: tanh bend, peak-normalized. */
const DIST_DRIVE = 2.4;
const DIST_NORM = Math.tanh(DIST_DRIVE);
export function distort(y: number): number {
  'worklet';
  return Math.tanh(DIST_DRIVE * y) / DIST_NORM;
}

/** Drawn broadband fuzz amplitude for ADD NOISE (±FS) — disclosed on a badge. */
export const NOISE_FUZZ = 0.05;

export type WaveStats = { peak: number; rms: number; crestDb: number };

/** Peak / RMS / crest factor computed from the ACTUAL drawn waveform samples
 *  (same math the trace uses) — the module's readout row calls this. */
export function computeWaveStats(kind: WaveKind, amp: number, noise: boolean, distortion: boolean): WaveStats {
  const N = 1024;
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * 2 * Math.PI;
    let y = (kind === 'noise' ? (hash(i * 91.7 + 3.1) - 0.5) * 2 * 0.85 : waveSample(kind, th)) * amp;
    if (distortion) y = distort(y);
    if (noise) y += NOISE_FUZZ * (hash(i * 57.3 + 11.7) - 0.5) * 2;
    peak = Math.max(peak, Math.abs(y));
    sum += y * y;
  }
  const rms = Math.sqrt(sum / N);
  return { peak, rms, crestDb: peak > 0 ? 20 * Math.log10(peak / Math.max(rms, 1e-9)) : 0 };
}

/** Low-pass magnitude (Butterworth-shaped rolloff): slope 12/24/48 dB/oct. */
function lpGainJs(f: number, cutoffHz: number, slopeDbOct: number): number {
  const order = slopeDbOct / 6;
  return 1 / Math.sqrt(1 + Math.pow(f / cutoffHz, 2 * order));
}

function fmtHzViz(f: number): string {
  if (f >= 1000) return `${Number((f / 1000).toFixed(2))} kHz`;
  return `${Math.round(f)} Hz`;
}

function strokeScale(w: number): number {
  return Math.min(1.6, Math.max(0.9, w / 360));
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 HERO — AnalogChainView: one event, three phase-locked views.
// (a) speaker cone radiating traveling compression/rarefaction bands,
// (b) mic diaphragm riding the arriving pressure,
// (c) continuous voltage scrolling out of the mic/preamp.

/** One traveling pressure band (compression = amber, rarefaction = blue). The
 *  band travels mouth→mic in exactly one cycle, so the diaphragm riding
 *  sourceSample(phase) is phase-locked with the arriving front. */
function PressureBand({
  phase,
  idx,
  count,
  cx,
  cy,
  span,
  amp,
  k,
}: {
  phase: SharedValue<number>;
  idx: number;
  count: number;
  cx: number;
  cy: number;
  span: number;
  amp: number;
  k: number;
}) {
  const frac0 = idx / count;
  const r = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI) + frac0) % 1;
    return 5 * k + f * span;
  }, [phase, span, k]);
  const op = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI) + frac0) % 1;
    return (1 - f) * (0.14 + 0.42 * amp);
  }, [phase, amp]);
  return (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      opacity={op}
      color={idx % 2 === 0 ? WAVE : ACCENT_BLUE}
      style="stroke"
      strokeWidth={3.2 * k}
    />
  );
}

const BAND_COUNT = 6;
const BAND_IDX = [0, 1, 2, 3, 4, 5];

export function AnalogChainView({
  width,
  phase,
  wave,
  amp,
  polarity,
  noise,
  distortion,
  cycles,
  height = 176,
}: {
  width: number;
  phase: SharedValue<number>;
  wave: WaveKind;
  /** 0..1 of drawn full scale. */
  amp: number;
  polarity: 1 | -1;
  noise: boolean;
  distortion: boolean;
  /** Cycles across the voltage window (TIME ZOOM). */
  cycles: number;
  height?: number;
}) {
  const w = width;
  const h = height;
  const k = strokeScale(w);
  const midY = h / 2;

  // Scene anchors: speaker → pressure gap → mic → voltage graph.
  const magX = 8 * k;
  const magW = 22 * k;
  const magH = 42 * k;
  const coneBaseX = magX + magW;
  const mouthX = coneBaseX + 24 * k;
  const mouthHalf = 27 * k;
  const micX = Math.max(mouthX + 54 * k, w * 0.36);
  const micLen = 26 * k;
  const gx0 = micX + micLen + 14 * k;
  const gw = w - gx0 - 6;
  const span = micX - mouthX - 8 * k;
  const ampPx = h * 0.3;

  // ── Static geometry (illustrated objects — gradients, organic silhouettes) ──
  const magnetPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(magX, midY - magH / 2, magW, magH), 3.5 * k, 3.5 * k));
    return p;
  }, [magX, magW, magH, midY, k]);

  const conePath = useMemo(() => {
    const p = Skia.Path.Make();
    // Curved cone silhouette (quads, not a rect stack), base → mouth.
    p.moveTo(coneBaseX, midY - 8 * k);
    p.quadTo(coneBaseX + (mouthX - coneBaseX) * 0.45, midY - mouthHalf * 0.4, mouthX, midY - mouthHalf + 2 * k);
    p.lineTo(mouthX, midY + mouthHalf - 2 * k);
    p.quadTo(coneBaseX + (mouthX - coneBaseX) * 0.45, midY + mouthHalf * 0.4, coneBaseX, midY + 8 * k);
    p.close();
    return p;
  }, [coneBaseX, mouthX, mouthHalf, midY, k]);

  const flangePath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(
      Skia.RRectXY(Skia.XYWHRect(mouthX - 1.4 * k, midY - mouthHalf - 5 * k, 3 * k, (mouthHalf + 5 * k) * 2), 1.5 * k, 1.5 * k),
    );
    return p;
  }, [mouthX, mouthHalf, midY, k]);

  const grillePath = useMemo(() => {
    // Mic grille cap facing the speaker (rounded on the sound-facing side).
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(micX - 10 * k, midY - 8.5 * k, 11 * k, 17 * k), 7 * k, 7 * k));
    return p;
  }, [micX, midY, k]);

  const diaphragmPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(micX - 4.6 * k, midY - 6.2 * k, 2 * k, 12.4 * k), 1 * k, 1 * k));
    return p;
  }, [micX, midY, k]);

  const micBodyPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(micX + 1 * k, midY - 7.5 * k, micLen, 15 * k), 3.5 * k, 3.5 * k));
    return p;
  }, [micX, micLen, midY, k]);

  const wirePath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(micX + micLen + 1 * k, midY);
    p.lineTo(gx0, midY);
    return p;
  }, [micX, micLen, gx0, midY, k]);

  const bandClip = useMemo(
    () => Skia.XYWHRect(mouthX + 4 * k, midY - mouthHalf - 12 * k, span + 6 * k, (mouthHalf + 12 * k) * 2),
    [mouthX, mouthHalf, span, midY, k],
  );

  // ── Per-frame worklets ──────────────────────────────────────────────────────
  const coneShift = useDerivedValue(
    () => [{ translateX: amp * 6 * k * sourceSample(wave, phase.value) }],
    [phase, wave, amp, k],
  );
  const diaShift = useDerivedValue(
    () => [{ translateX: amp * 2.6 * k * sourceSample(wave, phase.value) }],
    [phase, wave, amp, k],
  );

  const NPTS = 150;
  const trace = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ph = phase.value;
    const tq = Math.floor(ph * 3);
    for (let i = 0; i <= NPTS; i++) {
      const x = gx0 + (i / NPTS) * gw;
      let v = sourceSample(wave, ph - (i / NPTS) * cycles * 2 * Math.PI) * amp;
      if (distortion) v = distort(v);
      v *= polarity;
      if (noise) v += NOISE_FUZZ * (hash(i * 31.7 + tq * 57.3) - 0.5) * 2;
      const y = midY - v * ampPx;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, wave, amp, distortion, polarity, noise, cycles, gx0, gw, midY, ampPx]);

  const traceFill = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ph = phase.value;
    const tq = Math.floor(ph * 3);
    for (let i = 0; i <= NPTS; i++) {
      const x = gx0 + (i / NPTS) * gw;
      let v = sourceSample(wave, ph - (i / NPTS) * cycles * 2 * Math.PI) * amp;
      if (distortion) v = distort(v);
      v *= polarity;
      if (noise) v += NOISE_FUZZ * (hash(i * 31.7 + tq * 57.3) - 0.5) * 2;
      const y = midY - v * ampPx;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.lineTo(gx0 + gw, midY);
    p.lineTo(gx0, midY);
    p.close();
    return p;
  }, [phase, wave, amp, distortion, polarity, noise, cycles, gx0, gw, midY, ampPx]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        {/* Scene depth: floor line under the physical objects. */}
        <SkLine p1={vec(4, h - 10)} p2={vec(micX + micLen + 4 * k, h - 10)} color="#17171c" strokeWidth={2} />

        {/* Loudspeaker — magnet, moving cone, surround flange. */}
        <Path path={magnetPath}>
          <LinearGradient
            start={vec(magX, midY - magH / 2)}
            end={vec(magX + magW, midY + magH / 2)}
            colors={[METAL_HI, METAL_MID, METAL_LO]}
          />
        </Path>
        <Path path={flangePath} color={METAL_LO} />
        <Group transform={coneShift}>
          <Path path={conePath}>
            <LinearGradient
              start={vec(coneBaseX, midY - mouthHalf)}
              end={vec(mouthX, midY + mouthHalf)}
              colors={['#5f6470', '#22232a']}
            />
          </Path>
          <Path path={conePath} color="#9aa0ac" style="stroke" strokeWidth={1.3 * k} />
          <Circle cx={coneBaseX + 2 * k} cy={midY} r={5 * k} color="#aab0bc" />
        </Group>

        {/* Traveling pressure: compression (amber) / rarefaction (blue) bands. */}
        <Group clip={bandClip}>
          {BAND_IDX.map((i) => (
            <PressureBand
              key={i}
              phase={phase}
              idx={i}
              count={BAND_COUNT}
              cx={mouthX + 2 * k}
              cy={midY}
              span={span}
              amp={amp}
              k={k}
            />
          ))}
        </Group>

        {/* Microphone — grille facing the wave, diaphragm riding the pressure. */}
        <Path path={grillePath}>
          <LinearGradient
            start={vec(micX - 10 * k, midY - 9 * k)}
            end={vec(micX + 1 * k, midY + 9 * k)}
            colors={[METAL_HI, METAL_MID]}
          />
        </Path>
        <Group transform={diaShift}>
          <Path path={diaphragmPath} color="#ffd76b">
            <BlurMask blur={2.5} style="solid" />
          </Path>
        </Group>
        <Path path={micBodyPath}>
          <LinearGradient
            start={vec(micX, midY - 8 * k)}
            end={vec(micX + micLen, midY + 8 * k)}
            colors={[BODY_HI, BODY_LO]}
          />
        </Path>
        <Path path={wirePath} color="#3c4048" style="stroke" strokeWidth={1.6 * k} />

        {/* Voltage window — abstract graph, styled (glow + gradient underfill). */}
        <SkLine p1={vec(gx0, midY - ampPx)} p2={vec(gx0 + gw, midY - ampPx)} color={GHOST} strokeWidth={1} />
        <SkLine p1={vec(gx0, midY + ampPx)} p2={vec(gx0 + gw, midY + ampPx)} color={GHOST} strokeWidth={1} />
        <SkLine p1={vec(gx0, midY)} p2={vec(gx0 + gw, midY)} color={GRID} strokeWidth={1.1} />
        <Path path={traceFill}>
          <LinearGradient
            start={vec(gx0, midY - ampPx)}
            end={vec(gx0, midY + ampPx)}
            colors={[withAlpha(WAVE, 0.24), withAlpha(WAVE, 0.03)]}
          />
        </Path>
        <Path path={trace} color={WAVE} style="stroke" strokeWidth={4.6 * k} opacity={0.25}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={trace} color={WAVE} style="stroke" strokeWidth={2 * k} />
      </Canvas>

      <RNText style={[lbl.tag, { left: magX, top: h - 24 }]}>SPEAKER</RNText>
      <RNText style={[lbl.tag, { left: mouthX + 8 * k, top: 3 }]}>PRESSURE →</RNText>
      <RNText style={[lbl.tag, { left: micX - 10 * k, top: h - 24 }]}>MIC</RNText>
      <RNText style={[lbl.tagAmber, { left: gx0, top: 3 }]}>CONTINUOUS VOLTAGE →</RNText>
      <RNText style={[lbl.mono, { left: gx0 + 2, top: midY - ampPx - 12 }]}>+1.0</RNText>
      <RNText style={[lbl.mono, { left: gx0 + 2, top: midY - 12 }]}>0</RNText>
      <RNText style={[lbl.mono, { left: gx0 + 2, top: midY + ampPx + 1 }]}>−1.0</RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 HERO — SamplingView: continuous input + sampling instants + sample
// dots ON the curve + a sweeping sample-clock cursor. Above Nyquist the true
// input dims and the alias sinusoid the dots actually fit draws bright.

export function SamplingView({
  width,
  phase,
  freqHz,
  sampleRate,
  cyclesShown,
  showRecon,
  filterOn,
  cutoffHz,
  slopeDbOct,
  height = 192,
}: {
  width: number;
  /** Sweep clock for the sample-clock cursor (one window per 2π). */
  phase: SharedValue<number>;
  freqHz: number;
  sampleRate: number;
  cyclesShown: number;
  /** Draw the band-limited reconstruction THROUGH the dots. */
  showRecon: boolean;
  filterOn: boolean;
  cutoffHz: number;
  slopeDbOct: number;
  height?: number;
}) {
  const w = width;
  const h = height;
  const k = strokeScale(w);
  const pad = 8;
  const gw = w - pad * 2;
  const topPad = 18;
  const plotH = h - topPad - 22;
  const midY = topPad + plotH / 2;
  const A = plotH * 0.42;
  const nyq = sampleRate / 2;
  const T = cyclesShown / freqHz; // window duration, seconds
  const PHI0 = 0.9; // start phase — dots don't all sit on zero crossings
  const nFold = Math.round(freqHz / sampleRate);
  const fFold = freqHz - nFold * sampleRate; // SIGNED folded frequency
  const aliased = freqHz > nyq * (1 + 1e-9);
  const gainIn = filterOn ? lpGainJs(freqHz, cutoffHz, slopeDbOct) : 1;
  const aliasHz = Math.abs(fFold);
  const aliasVisible = aliased && gainIn > 0.04;
  const aliasRemoved = aliased && filterOn && gainIn <= 0.04;

  // Static geometry — recomputed only when a control changes.
  const geo = useMemo(() => {
    const xOfT = (t: number) => pad + (t / T) * gw;
    const yOfV = (v: number) => midY - v * A;
    const input = Skia.Path.Make();
    const ghost = Skia.Path.Make();
    const recon = Skia.Path.Make();
    const N = Math.min(1100, Math.max(140, Math.ceil(cyclesShown * 26)));
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * T;
      const x = xOfT(t);
      const yi = yOfV(gainIn * Math.sin(2 * Math.PI * freqHz * t + PHI0));
      const yg = yOfV(Math.sin(2 * Math.PI * freqHz * t + PHI0));
      // The signed folded sinusoid passes EXACTLY through every sample dot
      // (sin(2π·f·tₙ+φ) ≡ sin(2π·f_fold·tₙ+φ) at tₙ = n/fs) — below Nyquist
      // f_fold = f, so this IS the input: reconstruction of a sine is the sine.
      const yr = yOfV(gainIn * Math.sin(2 * Math.PI * fFold * t + PHI0));
      if (i === 0) {
        input.moveTo(x, yi);
        ghost.moveTo(x, yg);
        recon.moveTo(x, yr);
      } else {
        input.lineTo(x, yi);
        ghost.lineTo(x, yg);
        recon.lineTo(x, yr);
      }
    }
    const sticks = Skia.Path.Make();
    const dots = Skia.Path.Make();
    const nS = Math.floor(T * sampleRate);
    const dotR = (nS > 240 ? 1.4 : nS > 130 ? 2 : nS > 60 ? 2.6 : 3.3) * k;
    for (let n = 0; n <= nS; n++) {
      const tn = n / sampleRate;
      const x = xOfT(tn);
      sticks.moveTo(x, topPad);
      sticks.lineTo(x, topPad + plotH);
      dots.addCircle(x, yOfV(gainIn * Math.sin(2 * Math.PI * freqHz * tn + PHI0)), dotR);
    }
    return { input, ghost, recon, sticks, dots };
  }, [T, gw, midY, A, cyclesShown, gainIn, freqHz, fFold, sampleRate, k, plotH, topPad, pad]);

  // Sample-clock cursor sweeping the window (per-frame worklets only).
  const cursorLine = useDerivedValue(() => {
    const fr = (phase.value / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    const x = pad + fr * gw;
    p.moveTo(x, topPad);
    p.lineTo(x, topPad + plotH);
    return p;
  }, [phase, gw, topPad, plotH, pad]);

  const cursorDot = useDerivedValue(() => {
    const fr = (phase.value / (2 * Math.PI)) % 1;
    const n = Math.floor(fr * T * sampleRate + 1e-9);
    const tn = n / sampleRate;
    const p = Skia.Path.Make();
    p.addCircle(pad + (tn / T) * gw, midY - gainIn * Math.sin(2 * Math.PI * freqHz * tn + PHI0) * A, 5 * k);
    return p;
  }, [phase, T, sampleRate, gw, midY, gainIn, freqHz, A, k, pad]);

  const reconVisible = showRecon || aliasVisible;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <SkLine p1={vec(pad, midY)} p2={vec(pad + gw, midY)} color={GRID} strokeWidth={1.1} />
        {/* Sampling instants — the measurement grid in time. */}
        <Path path={geo.sticks} color={GHOST} style="stroke" strokeWidth={1} />
        {/* Unfiltered ghost when the AA filter is audibly attenuating. */}
        {filterOn && gainIn < 0.985 ? (
          <Path path={geo.ghost} color="#3a3d46" style="stroke" strokeWidth={1.2 * k} />
        ) : null}
        {/* The continuous input — dimmed above Nyquist (the dots stop fitting it). */}
        <Path
          path={geo.input}
          color={WAVE}
          style="stroke"
          strokeWidth={4.4 * k}
          opacity={aliased ? 0.1 : 0.25}
        >
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={geo.input} color={WAVE} style="stroke" strokeWidth={2 * k} opacity={aliased ? 0.38 : 1} />
        {/* Band-limited reconstruction / alias — the sinusoid the dots fit. */}
        {reconVisible ? (
          <>
            <Path
              path={geo.recon}
              color={aliased ? ACCENT_RED : ACCENT_GREEN}
              style="stroke"
              strokeWidth={4.2 * k}
              opacity={0.28}
            >
              <BlurMask blur={4} style="normal" />
            </Path>
            <Path path={geo.recon} color={aliased ? ACCENT_RED : ACCENT_GREEN} style="stroke" strokeWidth={1.7 * k} />
          </>
        ) : null}
        {/* Sample dots — MEASUREMENTS of the continuous signal, ON the curve. */}
        <Path path={geo.dots} color="#eef1f6" />
        {/* Sample-clock cursor. */}
        <Path path={cursorLine} color={ACCENT_GREEN} style="stroke" strokeWidth={1.2 * k} opacity={0.55} />
        <Path path={cursorDot} color={ACCENT_GREEN} opacity={0.9}>
          <BlurMask blur={3} style="solid" />
        </Path>
      </Canvas>

      <RNText style={[lbl.tagAmber, { left: pad, top: 3 }]}>
        {aliased ? 'TRUE INPUT (DIM) — ABOVE NYQUIST' : 'INPUT — CONTINUOUS'}
      </RNText>
      {aliasVisible ? (
        <RNText style={[lbl.tagRed, { right: pad, top: 3 }]}>
          ALIAS ≈ {fmtHzViz(aliasHz)} — THE DOTS FIT THIS
        </RNText>
      ) : aliasRemoved ? (
        <RNText style={[lbl.tagGreen, { right: pad, top: 3 }]}>ALIAS REMOVED — FILTERED BEFORE THE SAMPLER</RNText>
      ) : showRecon ? (
        <RNText style={[lbl.tagGreen, { right: pad, top: 3 }]}>RECONSTRUCTED = THE SINE ITSELF (EXACT)</RNText>
      ) : null}
      <RNText style={[lbl.mono, { left: pad, top: h - 14 }]}>0</RNText>
      <RNText style={[lbl.mono, { right: pad, top: h - 14 }]}>
        {(T * 1000).toFixed(T * 1000 < 1 ? 3 : 2)} ms
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fold diagram — the frequency axis folding at Nyquist (secondary strip).

export function FoldView({
  width,
  freqHz,
  sampleRate,
  height = 92,
}: {
  width: number;
  freqHz: number;
  sampleRate: number;
  height?: number;
}) {
  const w = width;
  const h = height;
  const k = strokeScale(w);
  const nyq = sampleRate / 2;
  const pad = 10;
  const plotTop = 18;
  const axisY = h - 18;
  const plotH = axisY - plotTop;
  const fMax = Math.max(3 * nyq, freqHz * 1.06);
  const folded = Math.abs(freqHz - Math.round(freqHz / sampleRate) * sampleRate);
  const aliased = freqHz > nyq * (1 + 1e-9);

  const xOf = (f: number) => pad + (f / fMax) * (w - 2 * pad);
  const yOf = (ff: number) => axisY - (ff / nyq) * plotH;

  const geo = useMemo(() => {
    const zig = Skia.Path.Make();
    zig.moveTo(xOf(0), yOf(0));
    let f = 0;
    let up = true;
    while (f < fMax) {
      const next = Math.min(f + nyq, fMax);
      const ffAtNext = up ? next - f : nyq - (next - f);
      zig.lineTo(xOf(next), yOf(ffAtNext));
      f = next;
      up = !up;
    }
    const marks = Skia.Path.Make();
    for (let m = 1; m * nyq < fMax + 1; m++) {
      marks.moveTo(xOf(m * nyq), plotTop - 2);
      marks.lineTo(xOf(m * nyq), axisY);
    }
    const zone = Skia.Path.Make();
    zone.addRect(Skia.XYWHRect(xOf(nyq), plotTop - 2, w - pad - xOf(nyq), plotH + 2));
    const marker = Skia.Path.Make();
    marker.addCircle(xOf(Math.min(freqHz, fMax)), yOf(folded), 4 * k);
    const guide = Skia.Path.Make();
    guide.moveTo(pad, yOf(folded));
    guide.lineTo(xOf(Math.min(freqHz, fMax)), yOf(folded));
    return { zig, marks, zone, marker, guide };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, nyq, fMax, freqHz, folded, k]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <Path path={geo.zone} color={withAlpha(ACCENT_RED, 0.06)} />
        <SkLine p1={vec(pad, axisY)} p2={vec(w - pad, axisY)} color={GRID} strokeWidth={1.1} />
        <Path path={geo.marks} color={GHOST} style="stroke" strokeWidth={1} />
        <Path path={geo.zig} color={WAVE} style="stroke" strokeWidth={1.8 * k} opacity={0.9} />
        <Path path={geo.guide} color={aliased ? ACCENT_RED : ACCENT_GREEN} style="stroke" strokeWidth={1} opacity={0.5} />
        <Path path={geo.marker} color={aliased ? ACCENT_RED : ACCENT_GREEN}>
          <BlurMask blur={3} style="solid" />
        </Path>
      </Canvas>
      <RNText style={[lbl.tag, { left: pad, top: 2 }]}>THE FOLD — WHERE AN INPUT LANDS IN THE SAMPLED DATA</RNText>
      <RNText style={[lbl.mono, { left: Math.max(pad, xOf(nyq) - 12), top: h - 14 }]}>fs/2</RNText>
      {2 * nyq < fMax ? <RNText style={[lbl.mono, { left: xOf(2 * nyq) - 8, top: h - 14 }]}>fs</RNText> : null}
      {3 * nyq <= fMax ? <RNText style={[lbl.mono, { left: Math.min(w - 34, xOf(3 * nyq) - 14), top: h - 14 }]}>3fs/2</RNText> : null}
      <RNText style={[aliased ? lbl.tagRed : lbl.tagGreen, { right: pad, top: 2 }]}>
        READS AS {fmtHzViz(folded)}
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Anti-aliasing filter response — magnitude-rolloff drawing (module badges the
// in-development advanced params: ripple/stopband/phase).

export function AAFilterView({
  width,
  sampleRate,
  cutoffHz,
  slopeDbOct,
  freqHz,
  filterOn,
  height = 126,
}: {
  width: number;
  sampleRate: number;
  cutoffHz: number;
  slopeDbOct: number;
  freqHz: number;
  filterOn: boolean;
  height?: number;
}) {
  const w = width;
  const h = height;
  const k = strokeScale(w);
  const nyq = sampleRate / 2;
  const padL = 32;
  const padR = 8;
  const plotTop = 16;
  const axisY = h - 16;
  const plotH = axisY - plotTop;
  const fMax = 1.6 * nyq;
  const DB_FLOOR = -60;

  const xOf = (f: number) => padL + (f / fMax) * (w - padL - padR);
  const yOf = (db: number) => plotTop + (Math.min(0, Math.max(DB_FLOOR, db)) / DB_FLOOR) * plotH;

  const gainAtInput = filterOn ? lpGainJs(freqHz, cutoffHz, slopeDbOct) : 1;
  const attenDb = -20 * Math.log10(Math.max(gainAtInput, 1e-6));

  const geo = useMemo(() => {
    const resp = Skia.Path.Make();
    const fill = Skia.Path.Make();
    const N = 140;
    const order = slopeDbOct / 6;
    for (let i = 0; i <= N; i++) {
      const f = (i / N) * fMax;
      const db = filterOn ? -10 * Math.log10(1 + Math.pow(f / cutoffHz, 2 * order)) : 0;
      const x = xOf(f);
      const y = yOf(db);
      if (i === 0) {
        resp.moveTo(x, y);
        fill.moveTo(x, y);
      } else {
        resp.lineTo(x, y);
        fill.lineTo(x, y);
      }
    }
    fill.lineTo(xOf(fMax), axisY);
    fill.lineTo(xOf(0), axisY);
    fill.close();
    const zone = Skia.Path.Make();
    zone.addRect(Skia.XYWHRect(xOf(nyq), plotTop, w - padR - xOf(nyq), plotH));
    const marker = Skia.Path.Make();
    const fIn = Math.min(freqHz, fMax);
    marker.moveTo(xOf(fIn), plotTop);
    marker.lineTo(xOf(fIn), axisY);
    const dot = Skia.Path.Make();
    const dbIn = filterOn ? -10 * Math.log10(1 + Math.pow(fIn / cutoffHz, 2 * order)) : 0;
    dot.addCircle(xOf(fIn), yOf(dbIn), 3.6 * k);
    return { resp, fill, zone, marker, dot };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, nyq, fMax, cutoffHz, slopeDbOct, filterOn, freqHz, k]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <Path path={geo.zone} color={withAlpha(ACCENT_RED, 0.06)} />
        {/* dB grid. */}
        <SkLine p1={vec(padL, yOf(0))} p2={vec(w - padR, yOf(0))} color={GRID} strokeWidth={1.1} />
        <SkLine p1={vec(padL, yOf(-30))} p2={vec(w - padR, yOf(-30))} color={GHOST} strokeWidth={1} />
        <SkLine p1={vec(padL, axisY)} p2={vec(w - padR, axisY)} color={GRID} strokeWidth={1.1} />
        {/* Nyquist boundary. */}
        <SkLine p1={vec(xOf(nyq), plotTop)} p2={vec(xOf(nyq), axisY)} color={ACCENT_GREEN} strokeWidth={1.2 * k} opacity={0.6} />
        {/* Response — glow stroke + gradient underfill. */}
        <Path path={geo.fill}>
          <LinearGradient
            start={vec(padL, plotTop)}
            end={vec(padL, axisY)}
            colors={[withAlpha(ACCENT_BLUE, 0.22), withAlpha(ACCENT_BLUE, 0.02)]}
          />
        </Path>
        <Path path={geo.resp} color={ACCENT_BLUE} style="stroke" strokeWidth={4 * k} opacity={0.25}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={geo.resp} color={ACCENT_BLUE} style="stroke" strokeWidth={1.8 * k} />
        {/* Input marker + its point on the response. */}
        <Path path={geo.marker} color={WAVE} style="stroke" strokeWidth={1 * k} opacity={0.55} />
        <Path path={geo.dot} color={WAVE}>
          <BlurMask blur={2.5} style="solid" />
        </Path>
      </Canvas>
      <RNText style={[lbl.tag, { left: padL, top: 2 }]}>
        {filterOn ? `LOW-PASS BEFORE THE SAMPLER — ${slopeDbOct} dB/OCT` : 'FILTER BYPASSED — EVERYTHING REACHES THE SAMPLER'}
      </RNText>
      <RNText style={[lbl.mono, { left: 2, top: yOf(0) - 6 }]}>0</RNText>
      <RNText style={[lbl.mono, { left: 2, top: yOf(-30) - 6 }]}>−30</RNText>
      <RNText style={[lbl.mono, { left: 2, top: axisY - 6 }]}>−60</RNText>
      <RNText style={[lbl.tagGreen, { left: Math.min(w - 60, xOf(nyq) + 3), top: h - 14 }]}>NYQUIST</RNText>
      <RNText style={[lbl.monoAmber, { right: padR, top: 2 }]}>
        input −{attenDb.toFixed(1)} dB
      </RNText>
    </View>
  );
}

const lbl = StyleSheet.create({
  tag: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.9, color: LABEL },
  tagAmber: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.9, color: WAVE },
  tagGreen: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.9, color: ACCENT_GREEN },
  tagRed: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.9, color: ACCENT_RED },
  mono: { position: 'absolute', fontFamily: fonts.mono, fontSize: 9.5, color: TICK },
  monoAmber: { position: 'absolute', fontFamily: fonts.mono, fontSize: 9.5, color: WAVE },
});
