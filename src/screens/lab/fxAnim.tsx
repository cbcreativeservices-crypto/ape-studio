/**
 * fxAnim — the ANIMATED signal-flow heroes for the 12 effect labs (visual
 * standards 2026-07-29: living animations). ONE shared Skia scene, config
 * driven: an input wave travels left→right on a continuous phase clock,
 * enters the glowing EFFECT stage, and emerges transformed — with every
 * per-effect transformation computed from the SAME math the static fxViz
 * heroes plot (eqResponseDb / distShape / the TransferCurveGraph law / the
 * comb + phaser phase formulas), driven by the SAME param values that drive
 * the native DSP.
 *
 * HONESTY (§1.7): this is a TEACHING MODEL of the process, not a measurement —
 * carrier waves are drawn at slowed, visible spatial rates (audio-rate motion
 * cannot be rendered), while LFO rates (0.1–5 Hz) are genuinely renderable and
 * run at their true rate. Where the engine is running, the model's params are
 * the exact values being heard, and the dynamics stage glow is driven by the
 * LIVE measured GR. The host badges it accordingly; nothing here pretends to
 * be a measurement.
 *
 * GATING: this module imports '@shopify/react-native-skia' (and the
 * foundations viz clock, which does too). It is loaded ONLY through
 * FxLabScreen's requireFxAnim() — an inline require gated on the foundations
 * skiaGate probe — so pre-Skia clients never evaluate it and keep the static
 * fxViz heroes exactly as today.
 *
 * PERFORMANCE (standards rule 6): static geometry + curve tables in useMemo;
 * ALL per-frame work in worklet useDerivedValue (Skia path rebuilds on the UI
 * thread — no React re-renders); fixed node counts (≤4 dynamic paths per lab,
 * ≤12 canvas elements including chrome); parameter changes GLIDE (withTiming
 * shared values / phase-continuous usePhaseClock) so nothing snaps or strobes.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  DashPathEffect,
  Line as SkLine,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { distShape, eqResponseDb, type EqBandSpec } from '../../features/lab/fxViz';
import { usePhaseClock } from './foundations/viz';
import { colors, fonts } from '../../theme/tokens';

// Shared lab grammar (fxViz palette): amber = processed, dim = dry/reference,
// blue = the effect's internal copy (delayed/shifted voice).
const AMBER = colors.amber;
const BLUE = '#6fa8ff';
const DIM = '#767a85';
const BG = '#0c0c0f';
const FRAME = '#262b36';
const ZERO = '#39404d';

const FLOW_H = 118;
/** The effect stage sits at this fraction of the width. */
const STAGE_FRAC = 0.42;
const PI2 = Math.PI * 2;

type SkPathT = ReturnType<typeof Skia.Path.Make>;

// ─────────────────────────────────────────────────────────── model types ──
/** Per-lab animation model — plain resolved numbers, built by each config's
 *  `anim(values)` mapping from the SAME values driving the audio. */
export type FxAnimModel =
  | { kind: 'eq'; bands: EqBandSpec[] }
  | { kind: 'delay'; timeMs: number; feedback: number; mix: number; pingpong: boolean }
  | { kind: 'reverb'; rt60: number; preDelayMs: number; mix: number }
  | { kind: 'mod'; flavor: 'chorus' | 'flanger'; rateHz: number; depth: number; centerMs: number; mix: number; feedback: number }
  | { kind: 'phaser'; rateHz: number; depth: number; centerHz: number; stages: number; feedback: number }
  | {
      kind: 'dynamics';
      mode: 'compressor' | 'gate' | 'limiter';
      thresholdDb: number;
      ratio: number;
      rangeDb: number;
      ceilingDb: number;
      makeupDb: number;
    }
  | { kind: 'distortion'; type: 'hard' | 'soft' | 'tube'; driveDb: number; mix: number }
  | { kind: 'stereo'; flavor: 'phase' | 'width'; widthPct: number; pan: number; invertR: boolean; delayRms: number; monoFold: boolean };

function stageLabel(model: FxAnimModel): string {
  switch (model.kind) {
    case 'eq': return 'EQ';
    case 'delay': return 'DELAY';
    case 'reverb': return 'REVERB';
    case 'mod': return model.flavor === 'chorus' ? 'CHORUS' : 'FLANGER';
    case 'phaser': return 'PHASER';
    case 'dynamics': return model.mode === 'compressor' ? 'COMP' : model.mode === 'gate' ? 'GATE' : 'LIMIT';
    case 'distortion': return 'DRIVE';
    case 'stereo': return model.flavor === 'phase' ? 'PHASE' : 'WIDTH';
  }
}

// ──────────────────────────────────────────────────────── shared helpers ──
/** Worklet hash (foundations idiom) — deterministic shimmer, no RNG state. */
function hashW(n: number): number {
  'worklet';
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

/** Meter-style display mapping: dB (−60..0) → 0..1 height. Display scale only
 *  (a 10^(dB/20) linear map would make −40 dB invisible); the dB VALUES obey
 *  the real transfer law. */
function dispAmp(db: number): number {
  'worklet';
  const a = (Math.min(db, 0) + 60) / 60;
  return a < 0 ? 0 : a;
}

/** Mirror of fxViz TransferCurveGraph's outAt — keep in lockstep (the transfer
 *  law is not exported there; same three shapes, same numbers). */
function transferDb(
  dbIn: number,
  mode: 'compressor' | 'gate' | 'limiter',
  thr: number,
  ratio: number,
  range: number,
  ceil: number,
  makeup: number,
): number {
  'worklet';
  if (mode === 'compressor') {
    const over = dbIn - thr;
    return (over > 0 ? thr + over / Math.max(ratio, 1) : dbIn) + makeup;
  }
  if (mode === 'limiter') return Math.min(dbIn, ceil);
  return dbIn < thr ? Math.max(dbIn + range, -90) : dbIn;
}

/** Linear-interp lookup into a one-cycle table (u in cycles, wraps). */
function tabAt(tab: number[], u: number): number {
  'worklet';
  const t = u - Math.floor(u);
  const x = t * (tab.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = tab[i];
  const b = tab[i + 1 < tab.length ? i + 1 : 0];
  return a + (b - a) * f;
}

/** Eased parameter glide: chip presses never snap the drawing (standards rule
 *  4) — the worklets read this shared value every frame. */
function useGlide(target: number, ms = 300): SharedValue<number> {
  const sv = useSharedValue(target);
  useEffect(() => {
    sv.value = withTiming(target, { duration: ms, easing: Easing.out(Easing.cubic) });
  }, [target, ms, sv]);
  return sv;
}

/** Glow + crisp double-stroke for an animated path (house GlowStroke idiom). */
function FlowGlow({
  path,
  color = AMBER,
  width = 2.2,
  opacity = 1,
}: {
  path: SharedValue<SkPathT>;
  color?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width * 2.6} strokeCap="round" strokeJoin="round" opacity={0.22 * opacity}>
        <BlurMask blur={width * 2.2} style="normal" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" opacity={opacity} />
    </>
  );
}

/** The shared scene: plot panel, zero line, the glowing EFFECT stage the
 *  signal passes through, and IN/OUT labels. `glow` (0..1) drives the stage
 *  halo — the dynamics labs feed it the LIVE measured GR. */
function FlowScene({
  w,
  h,
  label,
  glow,
  children,
}: {
  w: number;
  h: number;
  label: string;
  glow?: SharedValue<number>;
  children: ReactNode;
}) {
  const stageX = w * STAGE_FRAC;
  const glowOp = useDerivedValue(
    () => (glow ? 0.1 + Math.min(Math.max(glow.value, 0), 1) * 0.42 : 0.12),
    [glow],
  );
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h }}>
        <RoundedRect x={0} y={0} width={w} height={h} r={8} color={BG} />
        <SkLine p1={{ x: 4, y: h / 2 }} p2={{ x: w - 4, y: h / 2 }} color={ZERO} strokeWidth={1.1} />
        {children}
        {/* The effect stage — the signal visibly passes THROUGH it. */}
        <RoundedRect x={stageX - 13} y={4} width={26} height={h - 8} r={8} color={AMBER} opacity={glowOp}>
          <BlurMask blur={13} style="normal" />
        </RoundedRect>
        <RoundedRect x={stageX - 6} y={7} width={12} height={h - 14} r={5}>
          <LinearGradient start={vec(stageX - 6, 7)} end={vec(stageX + 6, h - 7)} colors={['#43371d', '#191308']} />
        </RoundedRect>
        <RoundedRect x={stageX - 6} y={7} width={12} height={h - 14} r={5} color="rgba(255,198,77,.6)" style="stroke" strokeWidth={1.2} />
        <RoundedRect x={0.5} y={0.5} width={w - 1} height={h - 1} r={7.5} color={FRAME} style="stroke" strokeWidth={1} />
      </Canvas>
      <Text style={[flowStyles.lbl, { left: 8, top: 5 }]}>IN</Text>
      <Text style={[flowStyles.lbl, { right: 8, top: 5 }]}>OUT</Text>
      <Text style={[flowStyles.lbl, flowStyles.stageLbl, { left: stageX - 34, width: 68 }]}>{label}</Text>
    </View>
  );
}

// ───────────────────────────────────────────────────────────── EQ flow ──
// A 3-band composite (low/mid/high sine components) travels in; the out wave
// is the SAME composite re-weighted by eqResponseDb at each component's
// frequency — boost/cut visibly reshapes the blend.
const EQ_COMP_FREQS = [150, 1000, 6000];
const EQ_CYCLES = [1.3, 3.6, 9.0];
const TRAVEL_PX_PER_RAD = 13;

function EqFlow({ w, h, active, label, bands }: { w: number; h: number; active: boolean; label: string; bands: EqBandSpec[] }) {
  const stageX = w * STAGE_FRAC;
  const phase = usePhaseClock(active, 0.5);
  // Linear gains at the component frequencies — the EXACT fxViz curve math.
  const gains = useMemo(
    () => EQ_COMP_FREQS.map((f) => Math.min(Math.pow(10, eqResponseDb(bands, f) / 20), 4)),
    [bands],
  );
  const g0 = useGlide(gains[0]);
  const g1 = useGlide(gains[1]);
  const g2 = useGlide(gains[2]);
  const k0 = (PI2 * EQ_CYCLES[0]) / w;
  const k1 = (PI2 * EQ_CYCLES[1]) / w;
  const k2 = (PI2 * EQ_CYCLES[2]) / w;

  const inPath = useDerivedValue(() => {
    const s = phase.value * TRAVEL_PX_PER_RAD;
    const p = Skia.Path.Make();
    const x0 = 6;
    const x1 = stageX - 10;
    const A = h * 0.32;
    const N = 44;
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const y = h / 2 - (A / 3) * (Math.sin(k0 * (x - s)) + Math.sin(k1 * (x - s)) + Math.sin(k2 * (x - s)));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, stageX, w, h]);

  const outPath = useDerivedValue(() => {
    const s = phase.value * TRAVEL_PX_PER_RAD;
    const a0 = g0.value;
    const a1 = g1.value;
    const a2 = g2.value;
    // Preserve the RELATIVE re-weighting (the lesson) while staying in-panel.
    const norm = 1 / Math.max(1, (a0 + a1 + a2) / 3);
    const p = Skia.Path.Make();
    const x0 = stageX + 10;
    const x1 = w - 6;
    const A = h * 0.32;
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const y =
        h / 2 -
        ((A * norm) / 3) * (a0 * Math.sin(k0 * (x - s)) + a1 * Math.sin(k1 * (x - s)) + a2 * Math.sin(k2 * (x - s)));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, g0, g1, g2, stageX, w, h]);

  return (
    <FlowScene w={w} h={h} label={label}>
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      <FlowGlow path={outPath} />
    </FlowScene>
  );
}

// ─────────────────────────────────────────────────────────── delay flow ──
// A dry pulse travels in; past the stage its echoes march out behind it —
// spacing = delay time (same px/ms auto-zoom law as EchoTimelineGraph),
// heights = mix·fb^(n−1) with post-stage dry at (1−mix) (the comb mix law).
function EchoFlow({
  w,
  h,
  active,
  label,
  timeMs,
  feedback,
  mix,
  pingpong,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  timeMs: number;
  feedback: number;
  mix: number;
  pingpong: boolean;
}) {
  const stageX = w * STAGE_FRAC;
  const phase = usePhaseClock(active, 0.16);
  const dPx = useMemo(() => {
    const outSpan = w - stageX - 12;
    const spanMs = Math.max(timeMs * 6.5, 500);
    return (timeMs * outSpan) / spanMs;
  }, [w, stageX, timeMs]);
  const dG = useGlide(dPx);
  const fbG = useGlide(feedback);
  const mixG = useGlide(mix);
  const ppG = useGlide(pingpong ? 1 : 0);

  const dryPath = useDerivedValue(() => {
    const d = dG.value;
    const track = w - 12 + d * 6;
    const frac = phase.value / PI2;
    const xDry = 6 + (frac - Math.floor(frac)) * track;
    const p = Skia.Path.Make();
    if (xDry <= w - 6) {
      const hs = h * 0.34 * (xDry > stageX ? 1 - mixG.value : 1);
      if (hs > 1) {
        p.moveTo(xDry, h / 2 - hs);
        p.lineTo(xDry, h / 2 + hs);
      }
    }
    return p;
  }, [phase, dG, mixG, w, h, stageX]);

  const echoPath = useDerivedValue(() => {
    const d = dG.value;
    const track = w - 12 + d * 6;
    const frac = phase.value / PI2;
    const xDry = 6 + (frac - Math.floor(frac)) * track;
    const pp = ppG.value;
    const p = Skia.Path.Make();
    let a = mixG.value;
    for (let n = 1; n <= 6; n++) {
      if (a < 0.04) break;
      const xe = xDry - n * d; // echoes are LATER in time → they trail behind
      if (xe > stageX + 10 && xe < w - 6) {
        const hs = h * 0.34 * Math.min(a, 1);
        const top = n % 2 === 1 ? 1 : 1 - pp; // ping-pong: odd taps up (L),
        const bot = n % 2 === 1 ? 1 - pp : 1; // even taps down (R)
        p.moveTo(xe, h / 2 - hs * top);
        p.lineTo(xe, h / 2 + hs * bot);
      }
      a *= fbG.value;
    }
    return p;
  }, [phase, dG, fbG, mixG, ppG, w, h, stageX]);

  return (
    <FlowScene w={w} h={h} label={label}>
      <Path path={dryPath} color={DIM} style="stroke" strokeWidth={4} strokeCap="round" opacity={0.9} />
      <FlowGlow path={echoPath} width={3.4} />
    </FlowScene>
  );
}

// ────────────────────────────────────────────────────────── reverb flow ──
// A dry pulse travels in; past the stage a DENSE decaying wash trails it —
// pre-delay gap, then amplitude 10^(−3·Δt/RT60) (−60 dB at RT60, the same law
// as DecayCurveGraph) on a fixed time scale so longer RT60 = longer tail.
function ReverbFlow({
  w,
  h,
  active,
  label,
  rt60,
  preDelayMs,
  mix,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  rt60: number;
  preDelayMs: number;
  mix: number;
}) {
  const stageX = w * STAGE_FRAC;
  const phase = usePhaseClock(active, 0.13);
  const pxPerS = (w - stageX - 12) / 3.2; // fixed scale: ~3.2 s across OUT
  const preG = useGlide((preDelayMs / 1000) * pxPerS);
  const washG = useGlide(rt60 * pxPerS); // px to fall 60 dB
  const mixG = useGlide(mix);

  const dryPath = useDerivedValue(() => {
    const track = w - 12 + preG.value + washG.value * 0.62;
    const frac = phase.value / PI2;
    const xDry = 6 + (frac - Math.floor(frac)) * track;
    const p = Skia.Path.Make();
    if (xDry <= w - 6) {
      const hs = h * 0.36 * (xDry > stageX ? 1 - mixG.value : 1);
      if (hs > 1) {
        p.moveTo(xDry, h / 2 - hs);
        p.lineTo(xDry, h / 2 + hs);
      }
    }
    return p;
  }, [phase, preG, washG, mixG, w, h, stageX]);

  const washFill = useDerivedValue(() => {
    const pre = preG.value;
    const wash = washG.value;
    const track = w - 12 + pre + wash * 0.62;
    const frac = phase.value / PI2;
    const xDry = 6 + (frac - Math.floor(frac)) * track;
    const head = xDry - pre; // the wash starts a pre-delay behind the hit
    const p = Skia.Path.Make();
    const x1 = Math.min(head, w - 6);
    const x0 = Math.max(stageX + 10, head - wash * 0.62);
    if (!(x1 > x0 + 2 && wash > 4)) return p;
    const mid = h / 2;
    const A = h * 0.4 * mixG.value;
    const tq = Math.floor(phase.value * 4); // quantized shimmer (noise idiom)
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const env = Math.pow(10, (-3 * (head - x)) / wash); // −60 dB at RT60
      const y = mid - A * env * (0.45 + 0.55 * hashW(i * 17.9 + tq * 131.7));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const x = x0 + ((x1 - x0) * i) / N;
      const env = Math.pow(10, (-3 * (head - x)) / wash);
      p.lineTo(x, mid + A * env * (0.45 + 0.55 * hashW(i * 23.3 + tq * 97.1 + 7)));
    }
    p.close();
    return p;
  }, [phase, preG, washG, mixG, w, h, stageX]);

  const envPath = useDerivedValue(() => {
    const pre = preG.value;
    const wash = washG.value;
    const track = w - 12 + pre + wash * 0.62;
    const frac = phase.value / PI2;
    const xDry = 6 + (frac - Math.floor(frac)) * track;
    const head = xDry - pre;
    const p = Skia.Path.Make();
    const x1 = Math.min(head, w - 6);
    const x0 = Math.max(stageX + 10, head - wash * 0.62);
    if (!(x1 > x0 + 2 && wash > 4)) return p;
    const mid = h / 2;
    const A = h * 0.4 * mixG.value;
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const y = mid - A * Math.pow(10, (-3 * (head - x)) / wash);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const y = mid + A * Math.pow(10, (-3 * (head - x)) / wash);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, preG, washG, mixG, w, h, stageX]);

  return (
    <FlowScene w={w} h={h} label={label}>
      <Path path={washFill}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, h)}
          colors={['rgba(255,198,77,0.30)', 'rgba(255,198,77,0.05)', 'rgba(255,198,77,0.30)']}
        />
      </Path>
      <FlowGlow path={envPath} width={1.6} opacity={0.9} />
      <Path path={dryPath} color={DIM} style="stroke" strokeWidth={4} strokeCap="round" opacity={0.9} />
    </FlowScene>
  );
}

// ────────────────────────────────────────────── chorus/flanger/phaser flow ──
// The dry wave travels in; past the stage its DOUBLED voice (blue) visibly
// wobbles against it on the true LFO rate, and the amber sum swells/cancels —
// the comb (or the phaser's all-pass phase φ = −2N·atan(f/fc), the exact
// phaserResponseDb formula) made visible in time.
function ModFlow({
  w,
  h,
  active,
  label,
  flavor,
  rateHz,
  depth,
  center,
  mix,
  feedback,
  stages,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  flavor: 'chorus' | 'flanger' | 'phaser';
  rateHz: number;
  depth: number;
  /** centerMs (chorus/flanger) or centerHz (phaser). */
  center: number;
  mix: number;
  feedback: number;
  stages: number;
}) {
  const stageX = w * STAGE_FRAC;
  const carrier = usePhaseClock(active, 0.5);
  const lfo = usePhaseClock(active, Math.min(rateHz, 5)); // true LFO rate
  const depthG = useGlide(depth);
  const ctrG = useGlide(center);
  const mixG = useGlide(mix);
  const fbG = useGlide(feedback);
  const stG = useGlide(stages);
  const kc = (PI2 * 3.0) / w;
  const lamPx = w / 3.0;

  const inPath = useDerivedValue(() => {
    const pc = carrier.value;
    const p = Skia.Path.Make();
    const A = h * 0.32;
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = 6 + ((stageX - 16) * i) / N;
      const y = h / 2 - A * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, stageX, h, kc]);

  // The doubled voice + the summed output share per-frame scalars.
  const copyPath = useDerivedValue(() => {
    const pc = carrier.value;
    const pl = lfo.value;
    let dx = 0;
    let dph = 0;
    if (flavor === 'chorus') {
      dx = (ctrG.value / 40 + ((6 * depthG.value) / 40) * Math.sin(pl)) * lamPx;
    } else if (flavor === 'flanger') {
      dx = (ctrG.value / 8 + ((ctrG.value * 0.85 * depthG.value) / 8) * Math.sin(pl)) * lamPx;
    } else {
      const fc = ctrG.value * Math.pow(2, 2 * depthG.value * Math.sin(pl));
      dph = -2 * stG.value * Math.atan(1000 / Math.max(fc, 20)); // phaserResponseDb φ
    }
    const p = Skia.Path.Make();
    const A = h * 0.32;
    const N = 52;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const y = h / 2 - A * Math.sin(kc * (x - dx) - pc + dph);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, lfo, depthG, ctrG, stG, stageX, w, h, kc, lamPx]);

  const outPath = useDerivedValue(() => {
    const pc = carrier.value;
    const pl = lfo.value;
    const mixV = mixG.value;
    const fbV = fbG.value;
    let dx = 0;
    let dph = 0;
    if (flavor === 'chorus') {
      dx = (ctrG.value / 40 + ((6 * depthG.value) / 40) * Math.sin(pl)) * lamPx;
    } else if (flavor === 'flanger') {
      dx = (ctrG.value / 8 + ((ctrG.value * 0.85 * depthG.value) / 8) * Math.sin(pl)) * lamPx;
    } else {
      const fc = ctrG.value * Math.pow(2, 2 * depthG.value * Math.sin(pl));
      dph = -2 * stG.value * Math.atan(1000 / Math.max(fc, 20));
    }
    const p = Skia.Path.Make();
    const A = h * 0.32;
    const norm = 1 / (1 + Math.abs(fbV) * mixV);
    const N = 52;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const dry = Math.sin(kc * x - pc);
      const wet = Math.sin(kc * (x - dx) - pc + dph) + fbV * Math.sin(kc * (x - 2 * dx) - pc + 2 * dph);
      const y = h / 2 - A * norm * ((1 - mixV) * dry + mixV * wet);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, lfo, depthG, ctrG, mixG, fbG, stG, stageX, w, h, kc, lamPx]);

  return (
    <FlowScene w={w} h={h} label={label}>
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      <Path path={copyPath} color={BLUE} style="stroke" strokeWidth={1.2} opacity={0.55} />
      <FlowGlow path={outPath} />
    </FlowScene>
  );
}

// ──────────────────────────────────────────────── comp/gate/limiter flow ──
// An amplitude-varying wave (loud/quiet swells) travels in; the out wave has
// the transfer law applied per sample — loud parts visibly squeezed (comp/
// limiter), quiet parts dropped to the floor (gate). Where the engine runs,
// the LIVE measured GR drives the stage glow.
function DynamicsFlow({
  w,
  h,
  active,
  label,
  mode,
  thresholdDb,
  ratio,
  rangeDb,
  ceilingDb,
  makeupDb,
  grDb,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  mode: 'compressor' | 'gate' | 'limiter';
  thresholdDb: number;
  ratio: number;
  rangeDb: number;
  ceilingDb: number;
  makeupDb: number;
  grDb: number;
}) {
  const stageX = w * STAGE_FRAC;
  const carrier = usePhaseClock(active, 0.55);
  const env = usePhaseClock(active, 0.22);
  const thrG = useGlide(thresholdDb);
  const ratG = useGlide(ratio);
  const rngG = useGlide(rangeDb);
  const ceilG = useGlide(ceilingDb);
  const mkG = useGlide(makeupDb);
  const grG = useGlide(grDb, 140); // LIVE measured GR → stage glow
  const glow = useDerivedValue(() => Math.min(grG.value / 12, 1), [grG]);
  const kc = (PI2 * 6.5) / w;
  const ke = (PI2 * 1.15) / w;

  const inPath = useDerivedValue(() => {
    const pc = carrier.value;
    const pe = env.value;
    const p = Skia.Path.Make();
    const A = h * 0.42;
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const x = 6 + ((stageX - 16) * i) / N;
      const dbIn = -46 + 36 * (0.5 + 0.5 * Math.sin(ke * x - pe));
      const y = h / 2 - A * dispAmp(dbIn) * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, env, stageX, h, kc, ke]);

  const outPath = useDerivedValue(() => {
    const pc = carrier.value;
    const pe = env.value;
    const p = Skia.Path.Make();
    const A = h * 0.42;
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const dbIn = -46 + 36 * (0.5 + 0.5 * Math.sin(ke * x - pe));
      const dbOut = transferDb(dbIn, mode, thrG.value, ratG.value, rngG.value, ceilG.value, mkG.value);
      const y = h / 2 - A * dispAmp(dbOut) * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, env, thrG, ratG, rngG, ceilG, mkG, stageX, w, h, kc, ke]);

  // Dashed limit guides: threshold over the IN side (comp/gate), ceiling over
  // the OUT side (limiter) — dashed = a limit, the shared grammar.
  const guidePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const A = h * 0.42;
    const db = mode === 'limiter' ? ceilG.value : thrG.value;
    const yOff = A * dispAmp(db);
    const x0 = mode === 'limiter' ? stageX + 10 : 6;
    const x1 = mode === 'limiter' ? w - 6 : stageX - 16;
    p.moveTo(x0, h / 2 - yOff);
    p.lineTo(x1, h / 2 - yOff);
    p.moveTo(x0, h / 2 + yOff);
    p.lineTo(x1, h / 2 + yOff);
    return p;
  }, [thrG, ceilG, stageX, w, h]);

  return (
    <FlowScene w={w} h={h} label={label} glow={glow}>
      <Path path={guidePath} color="rgba(255,198,77,.4)" style="stroke" strokeWidth={1}>
        <DashPathEffect intervals={[4, 3]} />
      </Path>
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      <FlowGlow path={outPath} width={2} />
    </FlowScene>
  );
}

// ────────────────────────────────────────────────────── distortion flow ──
// A clean sine travels in; the out wave is the SAME cycle bent through
// distShape (drive applied like the DSP, shape-normalized like the static
// hero) — table built once per param change, crossfaded so drive glides.
const DIST_TAB_N = 96;

function DistFlow({
  w,
  h,
  active,
  label,
  type,
  driveDb,
  mix,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  type: 'hard' | 'soft' | 'tube';
  driveDb: number;
  mix: number;
}) {
  const stageX = w * STAGE_FRAC;
  const carrier = usePhaseClock(active, 0.5);
  const mixG = useGlide(mix);
  const kc = (PI2 * 3.2) / w;

  // One shaped cycle via the EXACT fxViz shaper, normalized to its own peak
  // (the WaveshapeGraph convention: compare SHAPE, not level).
  const table = useMemo(() => {
    const drive = Math.pow(10, driveDb / 20);
    const out: number[] = [];
    let peak = 1e-9;
    for (let i = 0; i <= DIST_TAB_N; i++) {
      const y = distShape(0.9 * Math.sin((PI2 * i) / DIST_TAB_N) * drive, type);
      out.push(y);
      peak = Math.max(peak, Math.abs(y));
    }
    return out.map((y) => y / peak);
  }, [type, driveDb]);

  // Crossfade old table → new so TYPE/DRIVE chip presses glide, never snap.
  const prevTab = useSharedValue<number[]>(table);
  const curTab = useSharedValue<number[]>(table);
  const blend = useSharedValue(1);
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    prevTab.value = curTab.value;
    curTab.value = table;
    blend.value = 0;
    blend.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [table, prevTab, curTab, blend]);

  const inPath = useDerivedValue(() => {
    const pc = carrier.value;
    const p = Skia.Path.Make();
    const A = h * 0.36;
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = 6 + ((stageX - 16) * i) / N;
      const y = h / 2 - A * 0.9 * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, stageX, h, kc]);

  const outPath = useDerivedValue(() => {
    const pc = carrier.value;
    const b = blend.value;
    const prev = prevTab.value;
    const cur = curTab.value;
    const mixV = mixG.value;
    const p = Skia.Path.Make();
    const A = h * 0.36;
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const u = (kc * x - pc) / PI2;
      const shaped = tabAt(prev, u) * (1 - b) + tabAt(cur, u) * b;
      const y = h / 2 - A * (mixV * shaped + (1 - mixV) * 0.9 * Math.sin(kc * x - pc));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, blend, prevTab, curTab, mixG, stageX, w, h, kc]);

  return (
    <FlowScene w={w} h={h} label={label}>
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      <FlowGlow path={outPath} width={2} />
    </FlowScene>
  );
}

// ─────────────────────────────────────────────────── phase/stereo flow ──
// Dual traces: L (amber) and R (blue). Past the stage, polarity/phase-delay/
// width/pan act on the M/S decomposition — mono-fold glides both traces onto
// the same (L+R)/2 line, so INVERT + MONO visibly cancels to a flatline.
function StereoFlow({
  w,
  h,
  active,
  label,
  flavor,
  widthPct,
  pan,
  invertR,
  delayRms,
  monoFold,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  flavor: 'phase' | 'width';
  widthPct: number;
  pan: number;
  invertR: boolean;
  delayRms: number;
  monoFold: boolean;
}) {
  const stageX = w * STAGE_FRAC;
  const carrier = usePhaseClock(active, 0.5);
  const widthG = useGlide(widthPct / 100);
  const panG = useGlide(pan);
  const invG = useGlide(invertR ? 1 : 0);
  const dlyG = useGlide(delayRms);
  const foldG = useGlide(monoFold ? 1 : 0);
  const kc = (PI2 * 3.0) / w;
  const lamPx = w / 3.0;
  // The width lab's input carries a built-in L/R difference (otherwise SIDE
  // would be zero and width invisible); the phase lab's input is identical L=R.
  const d0 = flavor === 'width' ? 1.1 : 0;

  const inL = useDerivedValue(() => {
    const pc = carrier.value;
    const p = Skia.Path.Make();
    const A = h * 0.3;
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = 6 + ((stageX - 16) * i) / N;
      const y = h / 2 - A * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, stageX, h, kc]);

  const inR = useDerivedValue(() => {
    const pc = carrier.value;
    const p = Skia.Path.Make();
    const A = h * 0.3;
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const x = 6 + ((stageX - 16) * i) / N;
      const y = h / 2 - A * Math.sin(kc * x - pc - d0);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, stageX, h, kc, d0]);

  // Shared per-sample law for both output traces (worklet-inlined twice).
  const outL = useDerivedValue(() => {
    const pc = carrier.value;
    const wd = widthG.value;
    const pg = foldG.value;
    const sgn = 1 - 2 * invG.value; // glides through 0 → visible morph to Ø
    const dxp = dlyG.value * (lamPx / 12);
    const gL = Math.min(1, 1 - panG.value);
    const gR = Math.min(1, 1 + panG.value);
    const p = Skia.Path.Make();
    const A = h * 0.3;
    const N = 52;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const l = Math.sin(kc * x - pc);
      const r = sgn * Math.sin(kc * (x - dxp) - pc - d0);
      const m = (l + r) / 2;
      const s = ((l - r) / 2) * wd;
      const lp = (m + s) * gL;
      const rp = (m - s) * gR;
      const mono = (lp + rp) / 2;
      const y = h / 2 - A * (lp * (1 - pg) + mono * pg);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, widthG, panG, invG, dlyG, foldG, stageX, w, h, kc, lamPx, d0]);

  const outR = useDerivedValue(() => {
    const pc = carrier.value;
    const wd = widthG.value;
    const pg = foldG.value;
    const sgn = 1 - 2 * invG.value;
    const dxp = dlyG.value * (lamPx / 12);
    const gL = Math.min(1, 1 - panG.value);
    const gR = Math.min(1, 1 + panG.value);
    const p = Skia.Path.Make();
    const A = h * 0.3;
    const N = 52;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const l = Math.sin(kc * x - pc);
      const r = sgn * Math.sin(kc * (x - dxp) - pc - d0);
      const m = (l + r) / 2;
      const s = ((l - r) / 2) * wd;
      const lp = (m + s) * gL;
      const rp = (m - s) * gR;
      const mono = (lp + rp) / 2;
      const y = h / 2 - A * (rp * (1 - pg) + mono * pg);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, widthG, panG, invG, dlyG, foldG, stageX, w, h, kc, lamPx, d0]);

  return (
    <FlowScene w={w} h={h} label={label}>
      <Path path={inR} color={BLUE} style="stroke" strokeWidth={1.2} opacity={0.4} />
      <Path path={inL} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      <FlowGlow path={outR} color={BLUE} width={1.8} opacity={0.9} />
      <FlowGlow path={outL} width={1.8} />
    </FlowScene>
  );
}

// ─────────────────────────────────────────────────────────── dispatcher ──
function FlowBody({ model, w, active, grDb }: { model: FxAnimModel; w: number; active: boolean; grDb: number }) {
  const h = FLOW_H;
  const label = stageLabel(model);
  switch (model.kind) {
    case 'eq':
      return <EqFlow w={w} h={h} active={active} label={label} bands={model.bands} />;
    case 'delay':
      return (
        <EchoFlow w={w} h={h} active={active} label={label} timeMs={model.timeMs} feedback={model.feedback} mix={model.mix} pingpong={model.pingpong} />
      );
    case 'reverb':
      return <ReverbFlow w={w} h={h} active={active} label={label} rt60={model.rt60} preDelayMs={model.preDelayMs} mix={model.mix} />;
    case 'mod':
      return (
        <ModFlow
          w={w}
          h={h}
          active={active}
          label={label}
          flavor={model.flavor}
          rateHz={model.rateHz}
          depth={model.depth}
          center={model.centerMs}
          mix={model.mix}
          feedback={model.feedback}
          stages={0}
        />
      );
    case 'phaser':
      return (
        <ModFlow
          w={w}
          h={h}
          active={active}
          label={label}
          flavor="phaser"
          rateHz={model.rateHz}
          depth={model.depth}
          center={model.centerHz}
          mix={0.5}
          feedback={model.feedback}
          stages={model.stages}
        />
      );
    case 'dynamics':
      return (
        <DynamicsFlow
          w={w}
          h={h}
          active={active}
          label={label}
          mode={model.mode}
          thresholdDb={model.thresholdDb}
          ratio={model.ratio}
          rangeDb={model.rangeDb}
          ceilingDb={model.ceilingDb}
          makeupDb={model.makeupDb}
          grDb={grDb}
        />
      );
    case 'distortion':
      return <DistFlow w={w} h={h} active={active} label={label} type={model.type} driveDb={model.driveDb} mix={model.mix} />;
    case 'stereo':
      return (
        <StereoFlow
          w={w}
          h={h}
          active={active}
          label={label}
          flavor={model.flavor}
          widthPct={model.widthPct}
          pan={model.pan}
          invertR={model.invertR}
          delayRms={model.delayRms}
          monoFold={model.monoFold}
        />
      );
  }
}

/** The shared animated hero. `active` gates ALL per-frame work (pass screen
 *  focus); a collapsed DISPLAY section unmounts it entirely. `grDb` is the
 *  LIVE measured gain reduction (dynamics labs) — 0 elsewhere/when stopped. */
export function FxAnimHero({ model, active, grDb = 0 }: { model: FxAnimModel; active: boolean; grDb?: number }) {
  const [w, setW] = useState(0);
  return (
    <View
      style={flowStyles.wrap}
      onLayout={(e) => {
        const lw = Math.round(e.nativeEvent.layout.width);
        if (lw !== w) setW(lw);
      }}
      accessible
      accessibilityLabel="Animated signal-flow model: the input wave enters the effect stage and emerges transformed by the current settings"
    >
      {w >= 80 ? <FlowBody model={model} w={w} active={active} grDb={grDb} /> : <View style={{ height: FLOW_H }} />}
    </View>
  );
}

const flowStyles = StyleSheet.create({
  wrap: { width: '100%' },
  lbl: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.6,
    color: colors.textSub,
  },
  stageLbl: { top: 5, textAlign: 'center', color: 'rgba(255,198,77,.85)' },
});
