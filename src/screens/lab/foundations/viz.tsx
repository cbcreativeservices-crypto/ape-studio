/**
 * Foundations of Sound — Skia visualization core (owner 2026-07-26).
 *
 * The animated mental-model views: air particles (longitudinal traveling
 * wave), speaker cone, pressure-vs-time graph, and the synchronized
 * three-window composite — plus the static analytic waveform/spectrum used by
 * the Playground.
 *
 * HONESTY (§1.7): the motion is a CONCEPTUAL MODEL — real audio-rate motion
 * cannot be rendered (a 440 Hz cycle is ~2.3 ms), so everything animates at a
 * slowed visual rate (visHz, ~0.4–2 Hz) and every host screen badges it
 * "CONCEPTUAL MODEL — SLOWED FOR VISIBILITY". Pitch changes still change the
 * visual rate proportionally (owner decision: slowed conceptual model).
 *
 * PHYSICS of the model (kept honest in shape even though slowed):
 *   displacement ξ(x,t) = D·sin(ωt − kx)   (longitudinal — particles move
 *                                            along the travel axis only)
 *   pressure    p(x,t) ∝ cos(ωt − kx)      (p ∝ −∂ξ/∂x — so the drawn
 *                                            pressure peaks align EXACTLY with
 *                                            the visible compression bands)
 *   cone        x(t) = D·sin(ωt)           (the source at x = 0)
 *
 * ONLY this file imports '@shopify/react-native-skia' — it is loaded solely
 * through skiaGate.requireViz(), so pre-Skia clients never evaluate it.
 *
 * Animation: one Reanimated clock (useFrameCallback) per view tree; the
 * three-window composite passes ITS clock to all three children so they stay
 * phase-locked. Paths are rebuilt per frame in useDerivedValue worklets (UI
 * thread — no React re-renders).
 */
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Line as SkLine, Path, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';

// House palette for the model views.
const PARTICLE = '#cfd2d8';
const WAVE = colors.amber;
const CONE = '#8a8c94';
const ACCENT_GREEN = '#5bff85';
const BG = '#0c0c0f';

// ─────────────────────────────────────────────────────────────────────────────
// Clock

/** A seconds clock that advances only while `running` — pausing FREEZES the
 *  scene (never resets), so students can stop and study a moment. The frame
 *  callback is fully DEACTIVATED when not running (setActive(false)), so a
 *  blurred-but-mounted screen (native-stack keeps it mounted under a pushed
 *  screen) does zero per-frame work. */
export function useVizClock(running: boolean): SharedValue<number> {
  const clock = useSharedValue(0);
  const cb = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame != null) {
      clock.value += Math.min(info.timeSincePreviousFrame, 64) / 1000;
    }
  }, false);
  useEffect(() => {
    cb.setActive(running);
  }, [running, cb]);
  return clock;
}

// ─────────────────────────────────────────────────────────────────────────────
// Air particles — the "what actually exists" window

export type AirMode = 'wave' | 'noise' | 'still';

/** Deterministic hash noise (worklet-safe; no RNG state). */
function hash(n: number): number {
  'worklet';
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

export function AirParticlesView({
  clock,
  width,
  height = 116,
  visHz,
  amp,
  mode = 'wave',
  showEar = false,
  lambdaPx,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  /** Slowed visual frequency (Hz) — the conceptual rate, NOT the audio rate. */
  visHz: number;
  /** 0..1 — drives displacement (compression strength). */
  amp: number;
  mode?: AirMode;
  showEar?: boolean;
  /** Optional spatial wavelength in px. When the caller drives frequency
   *  (Playground), pass a value that TIGHTENS with pitch so the drawn spacing
   *  matches the wavelength readout. Default ~2 visible wavelengths across w.
   *  MUST match a co-drawn PressureGraphView's lambda to keep peaks aligned. */
  lambdaPx?: number;
}) {
  const COLS = 26;
  const ROWS = 6;
  const w = width;
  const h = height;

  // Rest grid + per-particle jitter (deterministic — stable across renders).
  const rest = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const jx = (hashJs(r * COLS + c) - 0.5) * (w / COLS) * 0.55;
        const jy = (hashJs(r * COLS + c + 999) - 0.5) * (h / ROWS) * 0.55;
        pts.push({
          x: ((c + 0.5) / COLS) * w + jx,
          y: ((r + 0.5) / ROWS) * (h - 8) + 4 + jy,
        });
      }
    }
    return pts;
  }, [w, h]);
  // Flat arrays capture cleanly into the worklet.
  const xs = useMemo(() => rest.map((p) => p.x), [rest]);
  const ys = useMemo(() => rest.map((p) => p.y), [rest]);

  const lambda = lambdaPx && lambdaPx > 8 ? lambdaPx : w / 2.2; // ~2 wavelengths by default
  const dispMax = (w / 2.2) / 7; // peak displacement — keyed to the DEFAULT scale so
  // particles never overlap into a solid band even when lambda tightens.

  const path = useDerivedValue(() => {
    const t = clock.value;
    const k = (2 * Math.PI) / lambda;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    for (let i = 0; i < xs.length; i++) {
      let dx = 0;
      let dy = 0;
      if (mode === 'wave') {
        // Longitudinal ONLY — along the travel axis. That IS the lesson.
        dx = amp * dispMax * Math.sin(om * t - k * xs[i]);
      } else if (mode === 'noise') {
        // Random agitation (noise has no single frequency) — quantized-time
        // hash jitter. STILL LONGITUDINAL (along the travel axis only): real
        // noise is a superposition of longitudinal waves, so keeping the motion
        // axis-only stays consistent with M1's "particles only move back and
        // forth along the direction of travel".
        const tq = Math.floor(t * 22);
        dx = amp * dispMax * 0.9 * (hash(i * 127.1 + tq * 311.7) - 0.5) * 2;
      }
      p.addCircle(xs[i] + dx, ys[i] + dy, 2.2);
    }
    return p;
  }, [clock, xs, ys, visHz, amp, mode, lambda, dispMax]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={path} color={PARTICLE} />
      {showEar ? (
        // A stylized ear at the receiving end (right edge).
        <>
          <Circle cx={w - 14} cy={h / 2} r={11} style="stroke" strokeWidth={2.5} color={ACCENT_GREEN} />
          <Circle cx={w - 14} cy={h / 2} r={5} style="stroke" strokeWidth={2} color={ACCENT_GREEN} />
        </>
      ) : null}
    </Canvas>
  );
}

// JS-side hash twin (module scope, not a worklet).
function hashJs(n: number): number {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Speaker cone — the source

export function SpeakerConeView({
  clock,
  width,
  height = 74,
  visHz,
  amp,
  mode = 'wave',
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  visHz: number;
  amp: number;
  mode?: AirMode;
}) {
  const w = width;
  const h = height;
  // Side view, firing RIGHT (into the air window below/beside it): magnet at
  // the left, cone apex → mouth opening rightward.
  const magW = Math.min(46, w * 0.16);
  const coneBaseX = magW + 8;
  const mouthX = Math.min(w * 0.42, coneBaseX + 96);
  const excMax = 13; // px excursion at amp = 1

  const conePath = useDerivedValue(() => {
    const t = clock.value;
    let off = 0;
    if (mode === 'wave') off = amp * excMax * Math.sin(2 * Math.PI * visHz * t);
    else if (mode === 'noise') {
      const tq = Math.floor(t * 22);
      off = amp * excMax * 0.8 * (hash(tq * 97.7) - 0.5) * 2;
    }
    const p = Skia.Path.Make();
    const cy = h / 2;
    const apexX = coneBaseX + off;
    const mx = mouthX + off;
    // Cone (trapezoid) + dust cap.
    p.moveTo(apexX, cy - 6);
    p.lineTo(mx, cy - h * 0.36);
    p.lineTo(mx, cy + h * 0.36);
    p.lineTo(apexX, cy + 6);
    p.close();
    return p;
  }, [clock, visHz, amp, mode, coneBaseX, mouthX, h]);

  // Sound "rays" leaving the mouth (static hint of direction).
  const rays = useMemo(() => {
    const p = Skia.Path.Make();
    const cy = h / 2;
    for (let i = 0; i < 3; i++) {
      const r = 16 + i * 13;
      p.addArc({ x: mouthX + 6 - r, y: cy - r, width: 2 * r, height: 2 * r }, -38, 76);
    }
    return p;
  }, [mouthX, h]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Magnet/basket. */}
      <Path
        path={useMemo(() => {
          const p = Skia.Path.Make();
          p.addRRect(Skia.RRectXY(Skia.XYWHRect(4, h * 0.24, magW, h * 0.52), 3, 3));
          return p;
        }, [magW, h])}
        color="#3a3a42"
      />
      <Path path={conePath} color={CONE} style="stroke" strokeWidth={2.5} />
      <Path path={rays} color={WAVE} style="stroke" strokeWidth={1.4} opacity={0.5} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pressure graph — "the line is NOT the shape of the sound"

export function PressureGraphView({
  clock,
  width,
  height = 84,
  visHz,
  amp,
  mode = 'wave',
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  visHz: number;
  amp: number;
  mode?: AirMode;
}) {
  const w = width;
  const h = height;
  const lambda = w / 2.2; // SAME spatial scale as the particle window — the
  // drawn pressure peaks align with the compression bands above.
  const N = 90;

  const trace = useDerivedValue(() => {
    const t = clock.value;
    const k = (2 * Math.PI) / lambda;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = amp * (h * 0.36);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      let y: number;
      if (mode === 'noise') {
        const tq = Math.floor(t * 22);
        y = mid - a * 0.8 * (hash(i * 91.3 + tq * 57.1) - 0.5) * 2;
      } else {
        // p ∝ cos(ωt − kx): peaks sit exactly under the compression bands.
        y = mid - a * Math.cos(om * t - k * x);
      }
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, visHz, amp, mode, w, h, lambda]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Atmospheric-pressure zero line. */}
      <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color="#2c2c33" strokeWidth={1.2} />
      <Path path={trace} color={WAVE} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The three-window composite — Module 2's centerpiece

export function ThreeWindowView({
  width,
  visHz,
  amp,
  running,
  mode = 'wave',
  showEar = true,
}: {
  width: number;
  visHz: number;
  amp: number;
  running: boolean;
  mode?: AirMode;
  showEar?: boolean;
}) {
  // ONE clock — all three windows phase-locked (the whole point).
  const clock = useVizClock(running);
  return (
    <View style={{ gap: 4 }}>
      <Text style={twStyles.winLabel}>SPEAKER — electricity → motion</Text>
      <SpeakerConeView clock={clock} width={width} visHz={visHz} amp={amp} mode={mode} />
      <Text style={twStyles.winLabel}>AIR — what actually exists (molecules, moving)</Text>
      <AirParticlesView clock={clock} width={width} visHz={visHz} amp={amp} mode={mode} showEar={showEar} />
      <Text style={twStyles.winLabel}>THE GRAPH — pressure vs position/time (NOT the shape of sound)</Text>
      <PressureGraphView clock={clock} width={width} visHz={visHz} amp={amp} mode={mode} />
    </View>
  );
}

const twStyles = StyleSheet.create({
  winLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: colors.textSub,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Static analytic views (Playground) — no worklets; paths built in useMemo.

/** Waveform shape from an additive recipe (amps 0..1 ×12, phases in degrees),
 *  peak-normalized exactly like the engine (1/max(1, Σaₙ)). */
export function AnalyticWaveformView({
  width,
  height = 92,
  amps,
  phasesDeg,
  level = 1,
  noise = null,
}: {
  width: number;
  height?: number;
  amps: number[];
  phasesDeg: number[];
  /** 0..1 visual scale (from the level slider). */
  level?: number;
  /** Noise color key overrides the recipe ('white' | 'pink' | 'brown'). */
  noise?: string | null;
}) {
  const w = width;
  const h = height;
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = level * h * 0.4;
    const N = 160;
    if (noise) {
      // Idealized noise trace (seeded, deterministic): white = raw hash,
      // pink/brown = progressively one-pole smoothed. Badged analytic.
      const smooth = noise === 'white' ? 0 : noise === 'pink' ? 0.75 : 0.93;
      let y = 0;
      for (let i = 0; i <= N; i++) {
        const r = (hashJs(i * 17.13) - 0.5) * 2;
        y = smooth * y + (1 - smooth) * r;
        const yy = mid - a * (noise === 'brown' ? y * 3.2 : noise === 'pink' ? y * 1.8 : y);
        if (i === 0) p.moveTo(0, yy);
        else p.lineTo((i / N) * w, yy);
      }
      return p;
    }
    let sum = 0;
    for (const v of amps) sum += v;
    const norm = 1 / (sum > 1 ? sum : 1);
    for (let i = 0; i <= N; i++) {
      const x01 = i / N;
      let s = 0;
      for (let n = 0; n < amps.length; n++) {
        if (amps[n] <= 0) continue;
        s += amps[n] * Math.sin(2 * Math.PI * (n + 1) * x01 * 2.5 + (phasesDeg[n] * Math.PI) / 180);
      }
      const yy = mid - a * s * norm;
      if (i === 0) p.moveTo(0, yy);
      else p.lineTo(x01 * w, yy);
    }
    return p;
  }, [w, h, amps, phasesDeg, level, noise]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color="#2c2c33" strokeWidth={1} />
      <Path path={path} color={WAVE} style="stroke" strokeWidth={2} />
    </Canvas>
  );
}

/** Harmonic-stick spectrum (linear axis to 13×f0) with an optional response
 *  curve (e.g. the EQ's exact RBJ magnitude) shaping the stick heights —
 *  display mirrors DSP (lockstep rule). Noise draws its idealized slope. */
export function AnalyticSpectrumView({
  width,
  height = 92,
  f0,
  amps,
  gainDbAt = null,
  noise = null,
}: {
  width: number;
  height?: number;
  f0: number;
  amps: number[];
  /** dB gain applied at a frequency (the display twin of the audio EQ). */
  gainDbAt?: ((f: number) => number) | null;
  noise?: string | null;
}) {
  const w = width;
  const h = height;
  const fMax = 13 * f0;
  const floorDb = -48;

  const { sticks, slope } = useMemo(() => {
    const stickPath = Skia.Path.Make();
    const slopePath = Skia.Path.Make();
    const yOf = (db: number) => {
      const c = Math.max(floorDb, Math.min(0, db));
      return 8 + ((0 - c) / -floorDb) * (h - 22);
    };
    if (noise) {
      // Idealized color slopes: white 0, pink −3, brown −6 dB/oct (NoiseLab idiom).
      const per = noise === 'white' ? 0 : noise === 'pink' ? -3 : -6;
      const N = 60;
      for (let i = 0; i <= N; i++) {
        const f = 40 * Math.pow(16000 / 40, i / N);
        let db = per * Math.log2(f / 1000);
        if (gainDbAt) db += gainDbAt(f);
        const x = (i / N) * w;
        const y = yOf(db - 10);
        if (i === 0) slopePath.moveTo(x, y);
        else slopePath.lineTo(x, y);
      }
      return { sticks: stickPath, slope: slopePath };
    }
    let sum = 0;
    for (const v of amps) sum += v;
    const norm = 1 / (sum > 1 ? sum : 1);
    for (let n = 0; n < amps.length; n++) {
      const a = amps[n] * norm;
      if (a <= 0.001) continue;
      const f = (n + 1) * f0;
      let db = 20 * Math.log10(a);
      if (gainDbAt) db += gainDbAt(f);
      if (db <= floorDb) continue;
      const x = (f / fMax) * w;
      stickPath.moveTo(x, h - 14);
      stickPath.lineTo(x, yOf(db));
    }
    return { sticks: stickPath, slope: slopePath };
  }, [w, h, f0, amps, gainDbAt, noise, fMax]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: 0, y: h - 14 }} p2={{ x: w, y: h - 14 }} color="#2c2c33" strokeWidth={1.2} />
      <Path path={sticks} color={WAVE} style="stroke" strokeWidth={3} />
      <Path path={slope} color={WAVE} style="stroke" strokeWidth={2} />
    </Canvas>
  );
}
