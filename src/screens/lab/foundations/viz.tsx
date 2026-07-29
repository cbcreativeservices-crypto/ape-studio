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

// ─────────────────────────────────────────────────────────────────────────────
// Module 5 — Rate comparator: two sources vibrating at different RATES.
// Same conceptual-model rules as everything above (slowed, badged by the host).

export function RateComparatorView({
  clock,
  width,
  height = 132,
  visHzA,
  visHzB,
  amp = 0.8,
  active = 'none',
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  visHzA: number;
  visHzB: number;
  amp?: number;
  /** Which side is currently SOUNDING ('a' | 'b' | 'none') — highlighted. */
  active?: 'a' | 'b' | 'none';
}) {
  const w = width;
  const h = height;
  const colW = (w - 14) / 2;

  // One column's rest grid (shared by both sides; mirrored by x offset).
  const COLS = 12;
  const ROWS = 4;
  const grid = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        xs.push(26 + ((c + 0.5) / COLS) * (colW - 56) + (hashJs(r * COLS + c) - 0.5) * 5);
        ys.push(34 + ((r + 0.5) / ROWS) * (h - 48) + (hashJs(r * COLS + c + 500) - 0.5) * 6);
      }
    }
    return { xs, ys };
  }, [colW, h]);
  const gxs = grid.xs;
  const gys = grid.ys;

  // Per-side paths: piston+orbit-hand (stroke) and particles+orbit-dot (fill).
  const makeSide = (visHz: number, x0: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const fill = useDerivedValue(() => {
      const t = clock.value;
      const om = 2 * Math.PI * visHz;
      const lambda = colW / 1.7;
      const k = (2 * Math.PI) / lambda;
      const p = Skia.Path.Make();
      for (let i = 0; i < gxs.length; i++) {
        const dx = amp * 6 * Math.sin(om * t - k * gxs[i]);
        p.addCircle(x0 + gxs[i] + dx, gys[i], 2);
      }
      // Orbit dot — ONE revolution per cycle (count laps = count cycles).
      const ocx = x0 + colW - 22;
      const ocy = 17;
      p.addCircle(ocx + 10 * Math.cos(om * t - Math.PI / 2), ocy + 10 * Math.sin(om * t - Math.PI / 2), 3);
      return p;
    }, [clock, visHz, x0, gxs, gys, amp, colW]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const stroke = useDerivedValue(() => {
      const t = clock.value;
      const om = 2 * Math.PI * visHz;
      const p = Skia.Path.Make();
      // Piston (the source): a vertical bar oscillating along the travel axis.
      const px = x0 + 12 + amp * 7 * Math.sin(om * t);
      p.moveTo(px, 34);
      p.lineTo(px, h - 14);
      return p;
    }, [clock, visHz, x0, amp, h]);
    return { fill, stroke };
  };

  const a = makeSide(visHzA, 0);
  const b = makeSide(visHzB, colW + 14);

  // Static chrome: divider + the two orbit rings.
  const chrome = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(colW + 7, 8);
    p.lineTo(colW + 7, h - 8);
    p.addCircle(colW - 22, 17, 10);
    p.addCircle(colW + 14 + colW - 22, 17, 10);
    return p;
  }, [colW, h]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={chrome} color="#2c2c33" style="stroke" strokeWidth={1.4} />
      <Path path={a.stroke} color={active === 'a' ? ACCENT_GREEN : CONE} style="stroke" strokeWidth={3} />
      <Path path={b.stroke} color={active === 'b' ? ACCENT_GREEN : CONE} style="stroke" strokeWidth={3} />
      <Path path={a.fill} color={active === 'a' ? '#eef2ee' : PARTICLE} />
      <Path path={b.fill} color={active === 'b' ? '#eef2ee' : PARTICLE} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 6 — Wavelength ruler: the wave laid across a real room (7 m), with a
// λ bracket whose drawn length IS 343/f mapped onto the room scale.

export const RULER_ROOM_M = 7;

export function WavelengthRulerView({
  clock,
  width,
  height = 158,
  freqHz,
  visHz,
  amp = 0.85,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  freqHz: number;
  visHz: number;
  amp?: number;
}) {
  const w = width;
  const h = height;
  const floorY = h - 18;
  const lambdaM = 343 / Math.max(20, freqHz);
  const lambdaPx = (lambdaM / RULER_ROOM_M) * w;

  // Dense particle field — compression bands are the star.
  const COLS = 38;
  const ROWS = 6;
  const grid = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        xs.push(((c + 0.5) / COLS) * w + (hashJs(r * COLS + c + 77) - 0.5) * (w / COLS) * 0.5);
        ys.push(10 + ((r + 0.5) / ROWS) * (floorY - 46) + (hashJs(r * COLS + c + 901) - 0.5) * 7);
      }
    }
    return { xs, ys };
  }, [w, floorY]);
  const gxs = grid.xs;
  const gys = grid.ys;

  const dots = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    // TRUE lambda — the drawn band spacing must equal the bracket (the badge
    // promises "horizontal scale is real"). The tiny floor only guards math
    // pathology; it never engages within the module's 55–880 Hz range.
    const k = (2 * Math.PI) / Math.max(10, lambdaPx);
    const p = Skia.Path.Make();
    // Displacement capped so tight lambdas never collapse into solid bands.
    const disp = Math.min(9, lambdaPx / 7);
    for (let i = 0; i < gxs.length; i++) {
      const dx = amp * disp * Math.sin(om * t - k * gxs[i]);
      p.addCircle(gxs[i] + dx, gys[i], 1.9);
    }
    return p;
  }, [clock, visHz, lambdaPx, gxs, gys, amp]);

  // λ bracket (static per freq): measures ONE wavelength of spacing — the
  // moving bands flow through it.
  const bracket = useMemo(() => {
    const p = Skia.Path.Make();
    const y = floorY - 22;
    const x0 = 8;
    const x1 = Math.min(w - 8, x0 + lambdaPx);
    p.moveTo(x0, y - 5);
    p.lineTo(x0, y + 5);
    p.moveTo(x0, y);
    p.lineTo(x1, y);
    p.moveTo(x1, y - 5);
    p.lineTo(x1, y + 5);
    return p;
  }, [w, floorY, lambdaPx]);

  // Floor + 1 m ticks + a stick person for scale (static).
  const room = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, floorY);
    p.lineTo(w, floorY);
    for (let m = 0; m <= RULER_ROOM_M; m++) {
      const x = (m / RULER_ROOM_M) * w;
      p.moveTo(x, floorY);
      p.lineTo(x, floorY + (m % 2 === 0 ? 8 : 5));
    }
    // Stick person (garnish — vertical is NOT to the meter scale).
    const px = w - 26;
    p.addCircle(px, floorY - 40, 5);
    p.moveTo(px, floorY - 35);
    p.lineTo(px, floorY - 16);
    p.moveTo(px - 8, floorY - 28);
    p.lineTo(px + 8, floorY - 28);
    p.moveTo(px, floorY - 16);
    p.lineTo(px - 6, floorY);
    p.moveTo(px, floorY - 16);
    p.lineTo(px + 6, floorY);
    return p;
  }, [w, floorY]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={dots} color={PARTICLE} />
      <Path path={bracket} color={WAVE} style="stroke" strokeWidth={2.2} />
      <Path path={room} color="#3a3a42" style="stroke" strokeWidth={1.6} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 7 — Time vs space: the SAME wave on two rulers. The two cursor dots
// always sit at the SAME PHASE — equal heights is the whole lesson (d = v·t).

const DD_CYC = 2.2; // cycles across each window (identical → same pattern width)

export function DualDomainView({
  width,
  visHz,
  cursor,
  running,
}: {
  width: number;
  visHz: number;
  /** 0..1 — the linked phase cursor (from the panel's slider). */
  cursor: number;
  running: boolean;
}) {
  const clock = useVizClock(running);
  const w = width;
  const h = 84;

  // TOP — pressure at ONE point (the mic, right edge) plotted over TIME.
  const timeTrace = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = h * 0.34;
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      // Right edge = now; moving left = further into the past.
      const y = mid - a * Math.cos(om * t - ((w - x) / w) * 2 * Math.PI * DD_CYC);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, visHz, w]);
  const timeDots = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const mid = h / 2;
    const a = h * 0.34;
    const p = Skia.Path.Make();
    // The mic itself (right edge, reading "now").
    p.addCircle(w - 6, mid - a * Math.cos(om * t), 4);
    // The linked cursor — cursor c of a cycle back in time.
    const xc = w * (1 - cursor);
    p.addCircle(xc, mid - a * Math.cos(om * t - cursor * 2 * Math.PI * DD_CYC), 4.5);
    return p;
  }, [clock, visHz, w, cursor]);

  // BOTTOM — pressure along DISTANCE at this instant (source at the left).
  const spaceTrace = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = h * 0.34;
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const y = mid - a * Math.cos(om * t - (x / w) * 2 * Math.PI * DD_CYC);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, visHz, w]);
  const spaceDots = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const mid = h / 2;
    const a = h * 0.34;
    const p = Skia.Path.Make();
    // Same phase as the time cursor → ALWAYS the same height. That's d = v·t.
    const xc = w * cursor;
    p.addCircle(xc, mid - a * Math.cos(om * t - cursor * 2 * Math.PI * DD_CYC), 4.5);
    return p;
  }, [clock, visHz, w, cursor]);

  const cursorLineTop = useMemo(() => {
    const p = Skia.Path.Make();
    const x = w * (1 - cursor);
    p.moveTo(x, 4);
    p.lineTo(x, h - 4);
    return p;
  }, [w, cursor]);
  const cursorLineBottom = useMemo(() => {
    const p = Skia.Path.Make();
    const x = w * cursor;
    p.moveTo(x, 4);
    p.lineTo(x, h - 4);
    return p;
  }, [w, cursor]);
  const speaker = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(2, h / 2 - 14);
    p.lineTo(10, h / 2 - 7);
    p.lineTo(10, h / 2 + 7);
    p.lineTo(2, h / 2 + 14);
    p.close();
    return p;
  }, []);

  return (
    <View style={{ gap: 4 }}>
      <Text style={twStyles.winLabel}>OVER TIME — pressure at the mic (right edge = now)</Text>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color="#2c2c33" strokeWidth={1} />
        <Path path={cursorLineTop} color={ACCENT_GREEN} style="stroke" strokeWidth={1} opacity={0.5} />
        <Path path={timeTrace} color={WAVE} style="stroke" strokeWidth={2.2} />
        <Path path={timeDots} color={ACCENT_GREEN} />
      </Canvas>
      <Text style={twStyles.winLabel}>OVER DISTANCE — pressure along the room (this instant)</Text>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color="#2c2c33" strokeWidth={1} />
        <Path path={cursorLineBottom} color={ACCENT_GREEN} style="stroke" strokeWidth={1} opacity={0.5} />
        <Path path={speaker} color={CONE} style="stroke" strokeWidth={2} />
        <Path path={spaceTrace} color={WAVE} style="stroke" strokeWidth={2.2} />
        <Path path={spaceDots} color={ACCENT_GREEN} />
      </Canvas>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 8 — Octave spiral: one turn = one octave; equal musical steps are
// equal ANGLES while the Hz counter accelerates. Static (prop-driven).

export const SPIRAL_F0 = 110;
export const SPIRAL_OCTAVES = 3; // 110 → 880

export function OctaveSpiralView({
  clock,
  width,
  height = 210,
  freqHz,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  freqHz: number;
  /** Slowed conceptual rate for the marker's orbit — one lap per cycle, the
   *  same motif as M5's rate dials (higher pitch = visibly faster orbit). */
  visHz: number;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2;
  const rMax = Math.min(w, h) / 2 - 14;
  const r0 = 18;
  const rOf = (o: number) => r0 + (o / (SPIRAL_OCTAVES + 0.15)) * (rMax - r0);
  const angOf = (o: number) => -Math.PI / 2 + o * 2 * Math.PI;

  const spiral = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 320; i++) {
      const o = (i / 320) * (SPIRAL_OCTAVES + 0.15);
      const x = cx + rOf(o) * Math.cos(angOf(o));
      const y = cy + rOf(o) * Math.sin(angOf(o));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    // Octave markers — every crossing of the 12-o'clock ray is a DOUBLING.
    for (let o = 0; o <= SPIRAL_OCTAVES; o++) {
      p.addCircle(cx + rOf(o) * Math.cos(angOf(o)), cy + rOf(o) * Math.sin(angOf(o)), 4);
    }
    return p;
  }, [cx, cy, rMax]);

  // Marker position — plain numbers, computed in JS so the worklet below
  // captures only values (never calls a JS function).
  const oF = Math.max(0, Math.min(SPIRAL_OCTAVES, Math.log2(freqHz / SPIRAL_F0)));
  const mx = cx + rOf(oF) * Math.cos(angOf(oF));
  const my = cy + rOf(oF) * Math.sin(angOf(oF));

  const markerLine = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx, cy);
    p.lineTo(mx, my);
    p.addCircle(mx, my, 8.5);
    return p;
  }, [cx, cy, mx, my]);

  // The living part: a pulsing core + a satellite lapping ONCE PER CYCLE.
  const markerAnim = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    p.addCircle(mx + 13 * Math.cos(om * t - Math.PI / 2), my + 13 * Math.sin(om * t - Math.PI / 2), 3);
    p.addCircle(mx, my, 4.6 + 1.2 * Math.sin(om * t));
    return p;
  }, [clock, mx, my, visHz]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* The 12-o'clock "doubling ray": every crossing = ×2 frequency. */}
      <SkLine p1={{ x: cx, y: cy - r0 + 6 }} p2={{ x: cx, y: cy - rMax - 6 }} color="#2c2c33" strokeWidth={1.4} />
      <Path path={spiral} color="#4a4a54" style="stroke" strokeWidth={2} />
      <Path path={markerLine} color={WAVE} style="stroke" strokeWidth={2.4} />
      <Path path={markerAnim} color={WAVE} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 9 — Ear-sensitivity curve (SIMPLIFIED equal-loudness illustration —
// the host badges it: analytic, inspired by ISO-226-style contours, NOT data).

/** Simplified ear-sensitivity model in dB re 1 kHz (illustration only). */
export function earSensDb(f: number): number {
  const fc = Math.max(30, Math.min(18000, f));
  let s: number;
  if (fc < 1000) {
    s = -20 * Math.pow(Math.log10(1000 / fc), 1.8);
  } else {
    const bump = 5 * Math.exp(-Math.pow(Math.log2(fc / 3500), 2) / 0.6);
    const roll = -9 * Math.max(0, Math.log2(fc / 9000));
    s = bump + roll;
  }
  return Math.max(-42, Math.min(8, s));
}

export function EqualLoudnessView({
  clock,
  width,
  height = 152,
  freqHz,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  freqHz: number;
  /** Slowed conceptual rate — the signal strip travels & the dot pulses. */
  visHz: number;
}) {
  const w = width;
  const h = height;
  const fLo = 40;
  const fHi = 16000;
  const stripH = 34; // bottom band: the SIGNAL, amplitude constant
  const gh = h - stripH - 8; // curve region height
  const xOf = (f: number) => (Math.log(f / fLo) / Math.log(fHi / fLo)) * w;
  const yOf = (db: number) => 10 + ((8 - db) / 50) * (gh - 20);

  const curve = useMemo(() => {
    const p = Skia.Path.Make();
    const N = 100;
    for (let i = 0; i <= N; i++) {
      const f = fLo * Math.pow(fHi / fLo, i / N);
      const y = yOf(earSensDb(f));
      if (i === 0) p.moveTo(0, y);
      else p.lineTo(xOf(f), y);
    }
    return p;
  }, [w, gh]);

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [100, 1000, 10000]) {
      p.moveTo(xOf(f), 6);
      p.lineTo(xOf(f), gh - 2);
    }
    return p;
  }, [w, gh]);

  // Plain numbers for the worklet (earSensDb is a JS function — never call
  // it inside a worklet; evaluate here and capture the result).
  const fC = Math.max(fLo, Math.min(fHi, freqHz));
  const dotX = xOf(fC);
  const dotY = yOf(earSensDb(fC));
  // The strip's drawn spatial frequency follows pitch (visual hint only).
  const stripCyc = 2 + 4 * (Math.log(fC / fLo) / Math.log(fHi / fLo));
  const stripMid = h - stripH / 2 - 2;

  const anim = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    // Pulsing dot riding the sensitivity curve at the tone's frequency.
    p.addCircle(dotX, dotY, 5.2 + 1.4 * Math.sin(om * t));
    return p;
  }, [clock, dotX, dotY, visHz]);

  // THE SIGNAL — a traveling wave whose drawn amplitude NEVER changes while
  // you sweep. That constancy is the module's whole argument.
  const strip = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 110;
    const k = (2 * Math.PI * stripCyc) / w;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const y = stripMid - 11 * Math.sin(om * t - k * x);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, visHz, stripCyc, stripMid]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={grid} color="#232329" style="stroke" strokeWidth={1} />
      {/* 1 kHz reference line (sensitivity 0 dB). */}
      <SkLine p1={{ x: 0, y: yOf(0) }} p2={{ x: w, y: yOf(0) }} color="#2c2c33" strokeWidth={1.2} />
      <Path path={curve} color="#6fa8ff" style="stroke" strokeWidth={2.2} />
      {/* Divider between the ear's curve and the constant signal. */}
      <SkLine p1={{ x: 0, y: h - stripH - 6 }} p2={{ x: w, y: h - stripH - 6 }} color="#1c1c22" strokeWidth={2} />
      <Path path={strip} color={CONE} style="stroke" strokeWidth={1.8} />
      <Path path={anim} color={WAVE} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 10 — Phase overlay: two identical waves at a phase offset + their SUM.
// At 180° the sum line goes flat — the "magic trick", drawn from the math.

export function PhaseOverlayView({
  clock,
  width,
  height = 184,
  phaseDeg,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  phaseDeg: number;
  /** Slowed conceptual rate — both waves TRAVEL while their relative phase
   *  holds, so at 180° the inputs visibly move while the sum stays flat. */
  visHz: number;
}) {
  const w = width;
  const h = height;
  const midTop = h * 0.27;
  const midBot = h * 0.76;
  // ONE shared per-wave scale: inputs draw at 1× unit, the sum draws the TRUE
  // addition at the SAME unit — so 0° really is visibly DOUBLE the inputs and
  // 180° really is flat (the drawn sum is the exact sum, honest by scale).
  const unit = h * 0.095;
  const CYC = 2.2;
  const phi = (phaseDeg * Math.PI) / 180;

  const pathA = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 130;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const th = (i / N) * 2 * Math.PI * CYC - om * t;
      const y = midTop - unit * Math.sin(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, midTop, unit, visHz]);

  const pathB = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 130;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const th = (i / N) * 2 * Math.PI * CYC - om * t;
      const y = midTop - unit * Math.sin(th + phi);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, midTop, unit, phi, visHz]);

  const pathS = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 130;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const th = (i / N) * 2 * Math.PI * CYC - om * t;
      const y = midBot - unit * (Math.sin(th) + Math.sin(th + phi));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, midBot, unit, phi, visHz]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: 0, y: midTop }} p2={{ x: w, y: midTop }} color="#2c2c33" strokeWidth={1} />
      <SkLine p1={{ x: 0, y: midBot }} p2={{ x: w, y: midBot }} color="#2c2c33" strokeWidth={1} />
      <SkLine p1={{ x: 0, y: h * 0.52 }} p2={{ x: w, y: h * 0.52 }} color="#1c1c22" strokeWidth={2} />
      <Path path={pathA} color="#8a8c94" style="stroke" strokeWidth={2} />
      <Path path={pathB} color="#6fa8ff" style="stroke" strokeWidth={2} />
      <Path path={pathS} color={WAVE} style="stroke" strokeWidth={2.8} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 11 — Harmonic stacker: six sine layers (1/n amplitudes) + their SUM.

export function HarmonicStackerView({
  clock,
  width,
  on,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  /** Six booleans — harmonics 1..6 in/out of the stack. */
  on: boolean[];
  /** Slowed fundamental rate. Every layer travels PHASE-LOCKED (ωₙ = n·ω₀,
   *  kₙ = n·k₀ → same phase velocity), so the summed SHAPE glides rigidly —
   *  the visual reason a harmonic recipe is one stable repeating waveform. */
  visHz: number;
}) {
  const w = width;
  const rowH = 21;
  const sumH = 66;
  const h = 6 * rowH + 10 + sumH;

  const rowsOn = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    for (let n = 1; n <= 6; n++) {
      if (!on[n - 1]) continue;
      const mid = (n - 0.5) * rowH;
      const a = 8.5 * Math.pow(1 / n, 0.6); // visual hint of 1/n without vanishing
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const y = mid - a * Math.sin(2 * Math.PI * 1.6 * n * (i / N) - n * om * t);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
    }
    return p;
  }, [clock, w, on, visHz]);

  const rowsOff = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    for (let n = 1; n <= 6; n++) {
      if (on[n - 1]) continue;
      const mid = (n - 0.5) * rowH;
      const a = 8.5 * Math.pow(1 / n, 0.6);
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const y = mid - a * Math.sin(2 * Math.PI * 1.6 * n * (i / N) - n * om * t);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
    }
    return p;
  }, [clock, w, on, visHz]);

  const sum = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    // SUM — true 1/n weights, engine-style peak normalization.
    const midS = 6 * rowH + 10 + sumH / 2;
    let wsum = 0;
    for (let n = 1; n <= 6; n++) if (on[n - 1]) wsum += 1 / n;
    const norm = 1 / Math.max(1, wsum);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      let s = 0;
      for (let n = 1; n <= 6; n++) {
        if (on[n - 1]) s += (1 / n) * Math.sin(2 * Math.PI * 1.6 * n * (i / N) - n * om * t);
      }
      const y = midS - sumH * 0.42 * s * norm;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, on, visHz]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: 0, y: 6 * rowH + 5 }} p2={{ x: w, y: 6 * rowH + 5 }} color="#2c2c33" strokeWidth={1.4} />
      <Path path={rowsOff} color="#26262c" style="stroke" strokeWidth={1.4} />
      <Path path={rowsOn} color="rgba(255,198,77,.55)" style="stroke" strokeWidth={1.6} />
      <Path path={sum} color={WAVE} style="stroke" strokeWidth={2.6} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 12 — Fourier lens: MORPH between a complex wave and its sine
// "recipe" — the components visually un-mix as the slider moves.

export function FourierLensView({
  clock,
  width,
  height = 208,
  amps,
  morph,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  /** 12 relative amplitudes (the additive recipe being played). */
  amps: number[];
  /** 0 = the summed wave · 1 = fully separated components + spectrum. */
  morph: number;
  /** Slowed fundamental rate — wave and components travel phase-locked;
   *  the spectrum bars hold still (the recipe doesn't change with time). */
  visHz: number;
}) {
  const w = width;
  const h = height;
  const m = Math.max(0, Math.min(1, morph));
  const centerY = h * 0.27;
  const specBase = h - 14;

  const sum = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    let wsum = 0;
    for (let n = 0; n < amps.length; n++) wsum += amps[n];
    const norm = 1 / Math.max(1, wsum);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      let s = 0;
      for (let n = 0; n < amps.length; n++) {
        if (amps[n] <= 0) continue;
        s += amps[n] * Math.sin(2 * Math.PI * 1.6 * (n + 1) * (i / N) - (n + 1) * om * t);
      }
      const y = centerY - h * 0.2 * s * norm;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, h, amps, centerY, visHz]);

  // The components — sliding from the sum's center line to their own rows,
  // each traveling at its own harmonic rate (phase-locked to the sum).
  const comps = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    let rows = 0;
    for (let n = 0; n < amps.length; n++) if (amps[n] > 0) rows++;
    if (rows === 0) rows = 1;
    let idx = 0;
    for (let n = 0; n < amps.length; n++) {
      if (amps[n] <= 0) continue;
      const rowY = h * 0.5 + ((idx + 0.5) / rows) * (h * 0.36) - h * 0.06;
      idx++;
      const yC = centerY + (rowY - centerY) * m;
      const aa = Math.max(3.5, 11 * Math.pow(amps[n], 0.55));
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const y = yC - aa * Math.sin(2 * Math.PI * 1.6 * (n + 1) * (i / N) - (n + 1) * om * t);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
    }
    return p;
  }, [clock, w, h, amps, m, centerY, visHz]);

  // The spectrum "recipe card" (bottom) — static: time passes, the recipe
  // doesn't. That stillness IS the lesson of the spectrum view.
  const bars = useMemo(() => {
    const p = Skia.Path.Make();
    for (let n = 0; n < amps.length; n++) {
      if (amps[n] <= 0) continue;
      const x = ((n + 1) / 13) * w;
      p.moveTo(x, specBase);
      p.lineTo(x, specBase - Math.max(6, 30 * amps[n]));
    }
    return p;
  }, [w, amps, specBase]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: 0, y: centerY }} p2={{ x: w, y: centerY }} color="#2c2c33" strokeWidth={1} />
      <SkLine p1={{ x: 0, y: specBase }} p2={{ x: w, y: specBase }} color="#2c2c33" strokeWidth={1.2} />
      <Path path={sum} color={WAVE} style="stroke" strokeWidth={2.6} opacity={Math.max(0.08, 1 - m)} />
      <Path path={comps} color="#6fa8ff" style="stroke" strokeWidth={1.8} opacity={Math.max(0.05, m)} />
      <Path path={bars} color={WAVE} style="stroke" strokeWidth={4} opacity={m} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 13 — Signal path: source → air → mic. The animated chain every
// measurement tool in the app listens to (the mural above the tool cards).

export function SignalPathView({
  clock,
  width,
  height = 96,
  visHz = 0.8,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  visHz?: number;
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const micX = w - 22;
  const waveX0 = 52;
  const waveX1 = micX - 20;

  // The source — a cone pushing rightward into the chain.
  const cone = useDerivedValue(() => {
    const t = clock.value;
    const off = 6 * Math.sin(2 * Math.PI * visHz * t);
    const p = Skia.Path.Make();
    p.moveTo(12 + off, mid - 5);
    p.lineTo(40 + off, mid - h * 0.3);
    p.lineTo(40 + off, mid + h * 0.3);
    p.lineTo(12 + off, mid + 5);
    p.close();
    return p;
  }, [clock, mid, h, visHz]);

  // The air — a pressure wave traveling source → mic.
  const trace = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const span = waveX1 - waveX0;
    const k = (2 * Math.PI * 2.2) / span;
    const p = Skia.Path.Make();
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const x = waveX0 + (i / N) * span;
      const y = mid - h * 0.24 * Math.cos(om * t - k * (x - waveX0));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, mid, h, visHz, waveX0, waveX1]);

  // The mic — its diaphragm rides the arriving pressure (Module 3's promise).
  const diaphragm = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    // Phase at the mic = the wave evaluated at x = waveX1.
    const arr = Math.cos(om * t - 2 * Math.PI * 2.2);
    const p = Skia.Path.Make();
    const x = micX - 3 + 3 * arr;
    p.moveTo(x, mid - 7);
    p.lineTo(x, mid + 7);
    return p;
  }, [clock, mid, micX, visHz]);

  const micRing = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(micX, mid, 11);
    return p;
  }, [micX, mid]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: waveX0, y: mid }} p2={{ x: waveX1, y: mid }} color="#1c1c22" strokeWidth={1.2} />
      <Path path={cone} color={CONE} style="stroke" strokeWidth={2.4} />
      <Path path={trace} color={WAVE} style="stroke" strokeWidth={2} />
      <Path path={micRing} color={ACCENT_GREEN} style="stroke" strokeWidth={2.4} />
      <Path path={diaphragm} color={ACCENT_GREEN} style="stroke" strokeWidth={2.4} />
    </Canvas>
  );
}
