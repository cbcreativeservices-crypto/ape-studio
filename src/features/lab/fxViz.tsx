/**
 * fxViz — the shared TEACHING VISUALS for the effect labs (v4 MASTER Pillar B).
 *
 * Success target (owner 2026-07-26): each lab's hero visual conveys THE concept.
 * One visual grammar everywhere so students transfer skills between labs:
 *   • AMBER   = the processed/designed result (what the effect does)
 *   • DIM     = the reference (flat / dry / before)
 *   • Dashed  = a limit/threshold (ceiling, threshold, RT60 marker)
 *
 * HONESTY (§1.7): every curve is computed from the SAME parameters (and the
 * same formulas) that drive the native DSP — badged "DESIGNED RESPONSE —
 * ANALYTIC" by the screens. The GR meters are the one LIVE element: they read
 * the real measured gain reduction from the engine (fxGrStatus), never a
 * simulated needle.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

const FS = 48000; // display-eval sample rate (matches the engine default)
const PI = Math.PI;

// ─────────────────────────────────────────────── JS mirrors of the DSP math ──
type Coeffs = { b0: number; b1: number; b2: number; a1: number; a2: number };

/** |H(e^jω)| in dB for one biquad. */
function biquadMagDb(c: Coeffs, f: number, fs = FS): number {
  const w = (2 * PI * f) / fs;
  const cos1 = Math.cos(w), sin1 = Math.sin(w);
  const cos2 = Math.cos(2 * w), sin2 = Math.sin(2 * w);
  const nr = c.b0 + c.b1 * cos1 + c.b2 * cos2;
  const ni = -(c.b1 * sin1 + c.b2 * sin2);
  const dr = 1 + c.a1 * cos1 + c.a2 * cos2;
  const di = -(c.a1 * sin1 + c.a2 * sin2);
  const mag2 = (nr * nr + ni * ni) / Math.max(dr * dr + di * di, 1e-24);
  return 10 * Math.log10(Math.max(mag2, 1e-12));
}

// RBJ designs — EXACT mirrors of Biquad.hpp (keep in lockstep).
export function rbjPeaking(f0: number, q: number, gainDb: number, fs = FS): Coeffs {
  const A = Math.pow(10, gainDb / 40);
  const w = (2 * PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w);
  const alpha = sw / (2 * q);
  const a0 = 1 + alpha / A;
  return {
    b0: (1 + alpha * A) / a0, b1: (-2 * cw) / a0, b2: (1 - alpha * A) / a0,
    a1: (-2 * cw) / a0, a2: (1 - alpha / A) / a0,
  };
}
export function rbjLowShelf(f0: number, q: number, gainDb: number, fs = FS): Coeffs {
  const A = Math.pow(10, gainDb / 40);
  const w = (2 * PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w);
  const alpha = sw / (2 * q);
  const tsa = 2 * Math.sqrt(A) * alpha;
  const a0 = A + 1 + (A - 1) * cw + tsa;
  return {
    b0: (A * (A + 1 - (A - 1) * cw + tsa)) / a0,
    b1: (2 * A * (A - 1 - (A + 1) * cw)) / a0,
    b2: (A * (A + 1 - (A - 1) * cw - tsa)) / a0,
    a1: (-2 * (A - 1 + (A + 1) * cw)) / a0,
    a2: (A + 1 + (A - 1) * cw - tsa) / a0,
  };
}
export function rbjHighShelf(f0: number, q: number, gainDb: number, fs = FS): Coeffs {
  const A = Math.pow(10, gainDb / 40);
  const w = (2 * PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w);
  const alpha = sw / (2 * q);
  const tsa = 2 * Math.sqrt(A) * alpha;
  const a0 = A + 1 - (A - 1) * cw + tsa;
  return {
    b0: (A * (A + 1 + (A - 1) * cw + tsa)) / a0,
    b1: (-2 * A * (A - 1 + (A + 1) * cw)) / a0,
    b2: (A * (A + 1 + (A - 1) * cw - tsa)) / a0,
    a1: (2 * (A - 1 - (A + 1) * cw)) / a0,
    a2: (A + 1 - (A - 1) * cw - tsa) / a0,
  };
}
export function rbjLowPass(f0: number, q: number, fs = FS): Coeffs {
  const w = (2 * PI * f0) / fs, cw = Math.cos(w), sw = Math.sin(w);
  const alpha = sw / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: (1 - cw) / 2 / a0, b1: (1 - cw) / a0, b2: (1 - cw) / 2 / a0,
    a1: (-2 * cw) / a0, a2: (1 - alpha) / a0,
  };
}
/** Butterworth HP via the analog prototype (mirror of Biquad::highpass). */
export function butterworthHighPassDb(f0: number, f: number): number {
  const r = f / f0;
  const r4 = Math.pow(r, 4);
  return 10 * Math.log10(Math.max(r4 / (1 + r4), 1e-12));
}

export type EqBandSpec = {
  type: 'off' | 'peak' | 'lowShelf' | 'highShelf' | 'lowPass' | 'highPass';
  freq: number;
  q: number;
  gainDb: number;
};

/** Total EQ magnitude (dB) at f for a set of bands — the displayed EQ curve. */
export function eqResponseDb(bands: EqBandSpec[], f: number): number {
  let db = 0;
  for (const b of bands) {
    switch (b.type) {
      case 'peak': db += biquadMagDb(rbjPeaking(b.freq, b.q, b.gainDb), f); break;
      case 'lowShelf': db += biquadMagDb(rbjLowShelf(b.freq, b.q, b.gainDb), f); break;
      case 'highShelf': db += biquadMagDb(rbjHighShelf(b.freq, b.q, b.gainDb), f); break;
      case 'lowPass': db += biquadMagDb(rbjLowPass(b.freq, b.q), f); break;
      case 'highPass': db += butterworthHighPassDb(b.freq, f); break;
      default: break;
    }
  }
  return db;
}

/** Comb response (dB) of dry+delayed mix with feedback — flanger/chorus/delay.
 *  H = (1−mix) + mix·e^(−jωτ)/(1 − fb·e^(−jωτ)). */
export function combResponseDb(delayMs: number, mix: number, feedback: number, f: number): number {
  const w = 2 * PI * f * (delayMs / 1000);
  const er = Math.cos(w), ei = -Math.sin(w);
  // wet = e^{-jwτ} / (1 − fb·e^{-jwτ})
  const dr = 1 - feedback * er, di = -feedback * ei;
  const den = Math.max(dr * dr + di * di, 1e-12);
  const wr = (er * dr + ei * di) / den;
  const wi = (ei * dr - er * di) / den;
  const hr = 1 - mix + mix * wr;
  const hi = mix * wi;
  return 10 * Math.log10(Math.max(hr * hr + hi * hi, 1e-12));
}

/** Phaser response (dB): N first-order all-passes (corner fc) mixed with dry.
 *  Per-stage phase φ = −2·atan(f/fc) (analog form — matches the DSP design). */
export function phaserResponseDb(fc: number, stages: number, mix: number, f: number): number {
  const phi = -2 * stages * Math.atan(f / fc);
  const hr = 1 - mix + mix * Math.cos(phi);
  const hi = mix * Math.sin(phi);
  return 10 * Math.log10(Math.max(hr * hr + hi * hi, 1e-12));
}

// JS mirrors of the distortion shapers (Effects.hpp — keep in lockstep).
export function distShape(x: number, type: 'hard' | 'soft' | 'tube'): number {
  switch (type) {
    case 'hard': return x > 1 ? 1 : x < -1 ? -1 : x;
    case 'soft': return Math.tanh(x);
    case 'tube': return Math.tanh(x + 0.4) - Math.tanh(0.4);
  }
}

// ────────────────────────────────────────────────────── shared chart chrome ──
const W = 320;
const AMBER = colors.amber;
const DIM = '#4a4a55';
const GRID = '#20202a';
const BG = '#0c0c0f';

function logX(f: number, fLo: number, fHi: number, padL: number, padR: number): number {
  const t = (Math.log10(f) - Math.log10(fLo)) / (Math.log10(fHi) - Math.log10(fLo));
  return padL + t * (W - padL - padR);
}

/** Frequency ticks used by every log-axis chart (consistent grammar). */
const FREQ_TICKS = [50, 200, 1000, 5000, 20000];
const fmtF = (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

// ───────────────────────────────────────────────── ResponseCurveGraph ──
export type ResponseCurve = {
  /** dB at frequency f. */
  at: (f: number) => number;
  emphasis: 'main' | 'ref' | 'ghost'; // amber · dim solid · dim ghost
  label?: string;
};

/** Log-frequency magnitude chart (20 Hz–20 kHz), ±`dbRange` dB. The workhorse:
 *  EQ curves, comb sweeps, phaser notches, filter shapes. */
export function ResponseCurveGraph({
  curves,
  dbRange = 18,
  height = 150,
}: {
  curves: ResponseCurve[];
  dbRange?: number;
  height?: number;
}) {
  const H = height;
  const padL = 8, padR = 8, padB = 14;
  const yAt = (db: number) =>
    H / 2 - (Math.max(-dbRange, Math.min(dbRange, db)) / dbRange) * (H / 2 - 8);
  const paths = useMemo(
    () =>
      curves.map((c) => {
        const N = 96;
        let d = '';
        for (let i = 0; i <= N; i++) {
          const f = 20 * Math.pow(1000, i / N); // 20 → 20k log
          const x = logX(f, 20, 20000, padL, padR);
          d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yAt(c.at(f)).toFixed(1)}`;
        }
        return d;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [curves],
  );
  return (
    <Svg width="100%" height={H + padB} viewBox={`0 0 ${W} ${H + padB}`}>
      <Rect x={0} y={0} width={W} height={H} fill={BG} />
      <Line x1={padL} y1={H / 2} x2={W - padR} y2={H / 2} stroke={GRID} strokeWidth={1} />
      {[dbRange / 2, -dbRange / 2].map((db) => (
        <Line key={db} x1={padL} y1={yAt(db)} x2={W - padR} y2={yAt(db)} stroke={GRID} strokeWidth={0.5} />
      ))}
      {FREQ_TICKS.map((f) => (
        <SvgText key={f} x={logX(f, 20, 20000, padL, padR)} y={H + 11} fill={colors.textSub} fontSize={8} textAnchor="middle">
          {fmtF(f)}
        </SvgText>
      ))}
      {curves.map((c, i) =>
        c.emphasis === 'main' ? null : (
          <Path key={i} d={paths[i]} stroke={DIM} strokeWidth={c.emphasis === 'ref' ? 1.2 : 1} strokeDasharray={c.emphasis === 'ghost' ? '4 3' : undefined} fill="none" />
        ),
      )}
      {curves.map((c, i) =>
        c.emphasis === 'main' ? <Path key={`m${i}`} d={paths[i]} stroke={AMBER} strokeWidth={2.2} fill="none" /> : null,
      )}
    </Svg>
  );
}

// ───────────────────────────────────────────────── TransferCurveGraph ──
/** Dynamics transfer curve: input dB → output dB (−60..0 both axes), with the
 *  unity line dim behind. Mode shapes: compressor knee, gate floor, limiter
 *  ceiling — the ONE picture that explains all three dynamics processors. */
export function TransferCurveGraph({
  mode,
  thresholdDb,
  ratio = 4,
  rangeDb = -40,
  ceilingDb = -12,
  makeupDb = 0,
}: {
  mode: 'compressor' | 'gate' | 'limiter';
  thresholdDb: number;
  ratio?: number;
  rangeDb?: number;
  ceilingDb?: number;
  makeupDb?: number;
}) {
  const H = 170;
  const pad = 22;
  const xAt = (dbIn: number) => pad + ((dbIn + 60) / 60) * (W - pad - 8);
  const yAt = (dbOut: number) => 8 + (1 - (dbOut + 60) / 60) * (H - 8 - pad);
  const outAt = (dbIn: number): number => {
    if (mode === 'compressor') {
      const over = dbIn - thresholdDb;
      return (over > 0 ? thresholdDb + over / ratio : dbIn) + makeupDb;
    }
    if (mode === 'limiter') return Math.min(dbIn, ceilingDb);
    // gate: below threshold the output drops by the range (floor); hard curve
    return dbIn < thresholdDb ? Math.max(dbIn + rangeDb, -90) : dbIn;
  };
  const path = useMemo(() => {
    let d = '';
    for (let i = 0; i <= 96; i++) {
      const dbIn = -60 + (i / 96) * 60;
      d += `${i === 0 ? 'M' : 'L'}${xAt(dbIn).toFixed(1)} ${yAt(Math.max(outAt(dbIn), -60)).toFixed(1)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, thresholdDb, ratio, rangeDb, ceilingDb, makeupDb]);
  const markerDb = mode === 'limiter' ? ceilingDb : thresholdDb;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H - pad + 8} fill={BG} />
      {/* unity (no processing) reference */}
      <Path d={`M${xAt(-60)} ${yAt(-60)} L${xAt(0)} ${yAt(0)}`} stroke={DIM} strokeWidth={1.2} fill="none" />
      {/* threshold / ceiling marker */}
      <Line x1={xAt(markerDb)} y1={8} x2={xAt(markerDb)} y2={H - pad + 4} stroke="rgba(255,198,77,.35)" strokeWidth={1} strokeDasharray="4 3" />
      <Path d={path} stroke={AMBER} strokeWidth={2.2} fill="none" />
      {[-60, -40, -20, 0].map((db) => (
        <SvgText key={db} x={xAt(db)} y={H - pad + 16} fill={colors.textSub} fontSize={8} textAnchor="middle">
          {db}
        </SvgText>
      ))}
      {[-40, -20, 0].map((db) => (
        <SvgText key={`y${db}`} x={4} y={yAt(db) + 3} fill={colors.textSub} fontSize={8}>
          {db}
        </SvgText>
      ))}
      <SvgText x={W - 10} y={H - pad + 16} fill={colors.textSub} fontSize={8} textAnchor="end">
        IN dB
      </SvgText>
      <SvgText x={4} y={14} fill={colors.textSub} fontSize={8}>
        OUT
      </SvgText>
    </Svg>
  );
}

// ───────────────────────────────────────────────────── WaveshapeGraph ──
/** Distortion: a sine period through the shaper — input (dim) vs shaped output
 *  (amber). Drive is applied like the DSP (x·drive into the shaper). */
export function WaveshapeGraph({
  type,
  driveDb,
}: {
  type: 'hard' | 'soft' | 'tube';
  driveDb: number;
}) {
  const H = 120;
  const drive = Math.pow(10, driveDb / 20);
  const { inPath, outPath } = useMemo(() => {
    const N = 160;
    let a = '', b = '';
    // Normalize the shaped wave to its own peak so the SHAPE difference (not
    // level) is what the student compares.
    let peak = 1e-9;
    const outs: number[] = [];
    for (let i = 0; i <= N; i++) {
      const x = 0.9 * Math.sin((2 * PI * i) / N);
      const y = distShape(x * drive, type);
      outs.push(y);
      peak = Math.max(peak, Math.abs(y));
    }
    for (let i = 0; i <= N; i++) {
      const px = (i / N) * W;
      const xin = 0.9 * Math.sin((2 * PI * i) / N);
      a += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${(H / 2 - xin * (H / 2 - 8)).toFixed(1)}`;
      b += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${(H / 2 - (outs[i] / peak) * (H / 2 - 8)).toFixed(1)}`;
    }
    return { inPath: a, outPath: b };
  }, [type, drive]);
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} fill={BG} />
      <Line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={GRID} strokeWidth={1} />
      <Path d={inPath} stroke={DIM} strokeWidth={1.2} fill="none" />
      <Path d={outPath} stroke={AMBER} strokeWidth={2} fill="none" />
    </Svg>
  );
}

// ──────────────────────────────────────────────────── EchoTimelineGraph ──
/** Delay: the repeats as stems on a time axis — spacing = delay time, decay =
 *  feedback, alternating sides when ping-pong. The echo pattern at a glance. */
export function EchoTimelineGraph({
  timeMs,
  feedback,
  mix,
  pingpong,
}: {
  timeMs: number;
  feedback: number;
  mix: number;
  pingpong: boolean;
}) {
  const H = 120;
  const spanMs = Math.max(timeMs * 6.5, 500);
  const xAt = (ms: number) => 10 + (ms / spanMs) * (W - 20);
  const taps = useMemo(() => {
    const out: { ms: number; amp: number; side: 'L' | 'R' | 'C' }[] = [];
    let amp = mix;
    for (let n = 1; n <= 12 && amp > 0.02; n++) {
      out.push({ ms: n * timeMs, amp, side: pingpong ? (n % 2 === 1 ? 'L' : 'R') : 'C' });
      amp *= feedback;
    }
    return out;
  }, [timeMs, feedback, mix, pingpong]);
  return (
    <Svg width="100%" height={H + 14} viewBox={`0 0 ${W} ${H + 14}`}>
      <Rect x={0} y={0} width={W} height={H} fill={BG} />
      <Line x1={0} y1={H - 12} x2={W} y2={H - 12} stroke={GRID} strokeWidth={1} />
      {/* dry hit */}
      <Rect x={xAt(0) - 2} y={H - 12 - (H - 30)} width={4} height={H - 30} fill={DIM} />
      {taps.map((t, i) => (
        <Rect
          key={i}
          x={xAt(t.ms) - 2}
          y={H - 12 - t.amp * (H - 30)}
          width={4}
          height={Math.max(t.amp * (H - 30), 2)}
          fill={AMBER}
          opacity={t.side === 'C' ? 0.95 : 0.95}
        />
      ))}
      {taps.map((t, i) =>
        pingpong ? (
          <SvgText key={`s${i}`} x={xAt(t.ms)} y={H - 2} fill={colors.textSub} fontSize={7} textAnchor="middle">
            {t.side}
          </SvgText>
        ) : null,
      )}
      <SvgText x={xAt(0)} y={H + 10} fill={colors.textSub} fontSize={8} textAnchor="middle">
        dry
      </SvgText>
      <SvgText x={W - 8} y={H + 10} fill={colors.textSub} fontSize={8} textAnchor="end">
        {`${Math.round(spanMs)} ms`}
      </SvgText>
    </Svg>
  );
}

// ────────────────────────────────────────────────────── DecayCurveGraph ──
/** Reverb: level vs time — pre-delay gap, then the straight −60 dB/RT60 slope
 *  on a dB axis (why RT60 is a TIME: where the line crosses −60). */
export function DecayCurveGraph({
  rt60,
  preDelayMs,
  refRt60,
}: {
  rt60: number;
  preDelayMs: number;
  /** Optional dim comparison slope (e.g. the previous setting). */
  refRt60?: number;
}) {
  const H = 150;
  const padL = 26, padB = 14;
  const spanS = Math.max(rt60 * 1.25, refRt60 ? refRt60 * 1.25 : 0, 0.6);
  const xAt = (s: number) => padL + (s / spanS) * (W - padL - 8);
  const yAt = (db: number) => 8 + (-db / 70) * (H - 8 - padB);
  const slope = (r: number) => {
    const pre = preDelayMs / 1000;
    return `M${xAt(0)} ${yAt(0)} L${xAt(pre)} ${yAt(0)} L${xAt(pre + r)} ${yAt(-60)} L${xAt(Math.min(pre + r * 1.15, spanS))} ${yAt(-69)}`;
  };
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H - padB} fill={BG} />
      <Line x1={padL} y1={yAt(-60)} x2={W - 8} y2={yAt(-60)} stroke="rgba(255,198,77,.35)" strokeWidth={1} strokeDasharray="4 3" />
      {refRt60 ? <Path d={slope(refRt60)} stroke={DIM} strokeWidth={1.2} fill="none" /> : null}
      <Path d={slope(rt60)} stroke={AMBER} strokeWidth={2.2} fill="none" />
      {/* RT60 marker: where the amber line hits −60 */}
      <Line x1={xAt(preDelayMs / 1000 + rt60)} y1={yAt(-60) - 6} x2={xAt(preDelayMs / 1000 + rt60)} y2={yAt(-60) + 6} stroke={AMBER} strokeWidth={2} />
      {[0, -20, -40, -60].map((db) => (
        <SvgText key={db} x={2} y={yAt(db) + 3} fill={colors.textSub} fontSize={8}>
          {db}
        </SvgText>
      ))}
      <SvgText x={xAt(preDelayMs / 1000 + rt60)} y={H - 2} fill={AMBER} fontSize={8} textAnchor="middle">
        {`RT60 ${rt60.toFixed(1)} s`}
      </SvgText>
    </Svg>
  );
}

// ──────────────────────────────────────────────────────── LissajousGraph ──
/** Stereo/Phase: the L-vs-R (XY) figure for a sine under the current stereo
 *  params — vertical line = mono (+1), horizontal-leaning = anti-phase (−1),
 *  ellipse/ball = decorrelated. Correlation is computed from the same signal. */
export function LissajousGraph({
  widthPct,
  invertR,
  delayRms,
  toneHz = 440,
}: {
  widthPct: number;
  invertR: boolean;
  delayRms: number;
  toneHz?: number;
}) {
  const SIZE = 170;
  const { path, corr } = useMemo(() => {
    const N = 720;
    const phi = 2 * PI * toneHz * (delayRms / 1000);
    const width = widthPct / 100;
    let d = '';
    let sLL = 0, sRR = 0, sLR = 0;
    for (let i = 0; i <= N; i++) {
      const th = (2 * PI * i) / N;
      let l = Math.sin(th);
      let r = Math.sin(th - phi) * (invertR ? -1 : 1);
      const m = 0.5 * (l + r), s = 0.5 * (l - r) * width;
      l = m + s;
      r = m - s;
      sLL += l * l; sRR += r * r; sLR += l * r;
      // Rotate 45° so mono = vertical (the correlation-meter convention).
      const px = SIZE / 2 + ((l - r) / 2) * (SIZE / 2 - 12);
      const py = SIZE / 2 - ((l + r) / 2) * (SIZE / 2 - 12);
      d += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    const c = sLR / Math.max(Math.sqrt(sLL * sRR), 1e-9);
    return { path: d, corr: c };
  }, [widthPct, invertR, delayRms, toneHz]);
  return (
    <View style={lissaStyles.row}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Rect x={0} y={0} width={SIZE} height={SIZE} fill={BG} />
        <Line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} stroke={GRID} strokeWidth={1} />
        <Line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke={GRID} strokeWidth={1} />
        <Path d={path} stroke={AMBER} strokeWidth={1.6} fill="none" opacity={0.9} />
      </Svg>
      <View style={lissaStyles.meter}>
        <Text style={lissaStyles.corrLabel}>CORRELATION</Text>
        <Text style={lissaStyles.corrValue}>{corr >= 0 ? `+${corr.toFixed(2)}` : corr.toFixed(2)}</Text>
        <Text style={lissaStyles.corrHint}>
          {corr > 0.9 ? 'mono / in phase' : corr < -0.9 ? 'ANTI-PHASE — cancels in mono' : corr < 0 ? 'partly out of phase' : 'wide / decorrelated'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────── GrMeter ──
/** LIVE gain-reduction meter — fed by the REAL engine readout (fxGrStatus).
 *  The one live element in the effect labs (honest-metrics: measured). */
export function GrMeter({ grDb, maxDb = 24, label = 'GAIN REDUCTION' }: { grDb: number; maxDb?: number; label?: string }) {
  const frac = Math.min(Math.max(grDb, 0) / maxDb, 1);
  return (
    <View style={grStyles.wrap}>
      <View style={grStyles.head}>
        <Text style={grStyles.label}>{label}</Text>
        <Text style={grStyles.value}>{`−${grDb.toFixed(1)} dB`}</Text>
      </View>
      <View style={grStyles.track}>
        <View style={[grStyles.fill, { width: `${frac * 100}%` }]} />
      </View>
    </View>
  );
}

const lissaStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  meter: { flex: 1, gap: 3 },
  corrLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  corrValue: { fontFamily: fonts.oswaldSemiBold, fontSize: 26, color: colors.amber },
  corrHint: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
});

const grStyles = StyleSheet.create({
  wrap: { gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  value: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber },
  track: { height: 10, borderRadius: 5, backgroundColor: '#1a1a20', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.amber, opacity: 0.85 },
});
