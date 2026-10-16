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
  Group,
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
import { EQ_CURVE_F_MAX, EQ_CURVE_F_MIN, eqCurvePoints, eqCurveX, eqCurveY } from './fxEqCurve';
import { usePhaseClock } from './foundations/viz';
import { useStageTextScale } from './rack/stageAspect';
import { WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';
import { echoSpacingFrac } from '../../features/lab/sliderMaps';

// Shared lab grammar (fxViz palette): amber = processed, dim = dry/reference,
// blue = the effect's internal copy (delayed/shifted voice).
const AMBER = colors.amber;
const BLUE = '#6fa8ff';
const DIM = '#9a9ca8';
const BG = '#0c0c0f';
const FRAME = '#262b36';
const ZERO = '#5a6376';
// The middle EFFECT divider bar + its label are GREEN (owner 2026-08-05) — the
// bar and the effect it represents read as one green "processor" element.
const STAGE_GREEN = colors.green; // #37e05f
const STAGE_GREEN_DK1 = '#1b4a29';
const STAGE_GREEN_DK2 = '#0a1a10';

const FLOW_H = 118;
/* FULL SCREEN (owner D35, 2026-09-30: "EVERYTHING in the drawing zooms with
 * the step"). Every flow is laid out in GLASS units — the width the hero has
 * on the rack's glass, FLOW_H tall — and painted through one
 * <Group transform={[{ scale: ts }]}> where ts = useStageTextScale() (1 on
 * the glass, rendered ÷ glass width in full screen). So a stroke, a blur, a
 * dash, a radius, a margin and the worklet paths all grow with the zoom step
 * at no per-frame cost, and the React Native <Text> labels laid over the
 * canvas (IN ▸ / ▸ OUT / the processor name) multiply their own points by the
 * same ts — the Skia trap in stageAspect.ts. */
/** The effect stage sits at this fraction of the width. */
const STAGE_FRAC = 0.42;
const PI2 = Math.PI * 2;

type SkPathT = ReturnType<typeof Skia.Path.Make>;

// ─────────────────────────────────────────────────────────── model types ──
/** The dynamics hero's input signal, chosen by the lab's SOURCE key. */
export type DynSignal = { kind: 'hits'; periodMs: number } | { kind: 'steady' } | { kind: 'noise' };

/** Per-lab animation model — plain resolved numbers, built by each config's
 *  `anim(values)` mapping from the SAME values driving the audio. */
export type FxAnimModel =
  | { kind: 'eq'; bands: EqBandSpec[] }
  | { kind: 'delay'; timeMs: number; feedback: number; mix: number; pingpong: boolean }
  | { kind: 'reverb'; rt60: number; preDelayMs: number; mix: number }
  | {
      kind: 'mod';
      flavor: 'chorus' | 'flanger';
      rateHz: number;
      depth: number;
      centerMs: number;
      mix: number;
      feedback: number;
      /** CHORUS: the frequency of the tone the scope shows (the sine source's
       *  own pitch; 440 Hz standing in for one component of a noise source).
       *  The copy's phase lag is then the TRUE 2π·f·τ(t) the DSP produces —
       *  see ModFlow. Omitted (flanger) ⇒ the older fixed-carrier model. */
      srcHz?: number;
      /** The source is noise: the scope's tone is one component of it. */
      srcIsNoise?: boolean;
    }
  | { kind: 'phaser'; rateHz: number; depth: number; centerHz: number; stages: number; feedback: number }
  | {
      kind: 'dynamics';
      mode: 'compressor' | 'gate' | 'limiter';
      thresholdDb: number;
      ratio: number;
      rangeDb: number;
      ceilingDb: number;
      makeupDb: number;
      /** Envelope time constants, in ms. ⚠️ These were MISSING until
       *  2026-09-11 (owner: "the waveforms in the compression lab do not look
       *  correct according to the settings I'm inputting"). Without them the
       *  hero applied the static transfer curve instantaneously at every
       *  point — i.e. it drew a ZERO-ATTACK, ZERO-RELEASE compressor, which is
       *  precisely the thing the lab exists to teach you a compressor is not.
       *  Changing the ENV tray moved nothing on screen. A hero badged "EXACT
       *  JS MIRROR OF THE DSP MATH" must mirror the envelope follower too —
       *  it is half of what a dynamics processor IS. */
      attackMs: number;
      releaseMs: number;
      /** GATE only: how long the gate stays open after the signal drops below
       *  the threshold, before it starts closing. Anti-chatter — and the gate
       *  lab teaches it ("20 ms CHATTER"), so the hero has to show it. 0
       *  elsewhere. */
      holdMs: number;
      /** What the lab's selected SOURCE puts into the processor (2026-10-16
       *  fix pass): a click → a hit every beat at the click's real tempo; a
       *  sine → a steady level (the limiter lab's default — constant GR); a
       *  noise → a level that jitters. Omitted ⇒ hits at 120 BPM. */
      signal?: DynSignal;
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

/* ── the dynamics hero's time domain ──────────────────────────────────────
 * Attack and release are TIME constants, so they can only be drawn against a
 * time axis. The hero's horizontal span IS time, and the input is a repeating
 * TRANSIENT, because against a slow swell a compressor tracks almost perfectly
 * whatever its time constants are — the test signal could not express the
 * parameter (2026-09-11).
 *
 * REWRITTEN 2026-10-16 (lab-art grading fix, Compression/Gate/Limiter 5.8–5.9):
 *  • ONE REAL TIME BASE across the whole strip. Signal time at x is
 *    t(x) = now − (x − stageX)·msPerPx: the stage is "now", the IN half is the
 *    signal about to arrive, the OUT half is what already left. Everything
 *    moves RIGHT at true speed (IN ▸ stage ▸ OUT, the family's grammar), so a
 *    hit seen on IN crosses the stage and arrives on OUT. Before, the carrier
 *    sine ran right while the hit envelope scrolled LEFT, and IN and OUT drew
 *    the SAME 900 ms side by side.
 *  • No cartoon carrier. At 900 ms per half no carrier cycle is resolvable,
 *    so the waveform is drawn the way a DAW draws an overview: min/max per
 *    pixel column — a filled envelope symmetric about the centre line
 *    (feedback_never_stylized_audio).
 *  • LINEAR amplitude. The old meter-style dB→height map drew a −30 dB tail at
 *    half height. dB now lives only where it is labelled dB (the ladder, the
 *    transfer curve, the bezel).
 *  • The level is the source's: the hit peaks at the lab generator's −20 dBFS
 *    (was −8, which compressed at thresholds the caption says do nothing),
 *    hits arrive at the click's real tempo, a sine is a steady level, noise
 *    jitters. A hit decays exponentially in AMPLITUDE — a straight line in dB.
 */

/** The OUT half of the stage spans this much signal time. */
const DYN_WINDOW_MS = 900;
/** Hit amplitude time constant: a(t) = e^(−t/τ) — a drum-like ring. */
const DYN_DECAY_MS = 90;
/** The same decay in dB per ms (20·log10(e)/τ ≈ 8.69 dB per τ). */
const DYN_DB_PER_MS = 20 / (Math.LN10 * DYN_DECAY_MS);
/** The lab generators' level (fxLabConfigs SOURCE_PEAK_DB). */
const DYN_PEAK_DB = -20;
/** Bleed / noise floor between hits. */
const DYN_FLOOR_DB = -52;
/** The panel edge, in dBFS: the −20 dBFS source plus the +6 dB makeup chip —
 *  the loudest thing any dynamics lab can output, so nothing is ever drawn
 *  clipped at the edge that the audio does not clip. */
const DYN_TOP_DB = -14;
/** Follower sub-steps per pixel column (≈1.3 ms each): a 5 ms attack is about
 *  one pixel at this time scale, so the follower must run finer than the
 *  columns it is drawn into. */
const DYN_SUB = 4;

/** Input level (dBFS) at signal time tMs. kind: 0 hits · 1 steady · 2 noise. */
function dynLevelDb(tMs: number, kind: number, periodMs: number): number {
  'worklet';
  if (kind === 1) return DYN_PEAK_DB;
  if (kind === 2) {
    // Noise: a level that wanders a little under its peak, smooth over
    // ~6 ms blocks (deterministic in signal time, so it travels with the wave).
    const u = tMs / 6;
    const i = Math.floor(u);
    const f = u - i;
    const a = hashW(i * 1.37 + 3.1);
    const b = hashW((i + 1) * 1.37 + 3.1);
    // ~3 dB: a min/max overview of noise at ~4 ms a column barely moves
    // (audio-expert review 2026-10-16 — 8 dB exaggerated the GR movement).
    return DYN_PEAK_DB - 3 * (a + (b - a) * f);
  }
  const tb = tMs - Math.floor(tMs / periodMs) * periodMs;
  const db = DYN_PEAK_DB - DYN_DB_PER_MS * tb;
  return db > DYN_FLOOR_DB ? db : DYN_FLOOR_DB;
}

/** Linear amplitude (0..1 of the panel half-height) of a dBFS level. */
function dynLin(db: number): number {
  'worklet';
  const a = Math.pow(10, (db - DYN_TOP_DB) / 20);
  return a > 1 ? 1 : a;
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

/** Vertical MIDI amplitude gradient for a zero-centred waveform (loudness
 *  standard): blue at the mid line → green/yellow/orange → red at ±full scale.
 *  Mapped over the panel height so the colour tracks true level (owner
 *  2026-08-05: amplitude on the flow waves reads in the MIDI schema). */
function WaveMidiGradient({ h, y0 = 0, y1 = h }: { h: number; y0?: number; y1?: number }) {
  // y0..y1 = where +full scale and −full scale sit (default: the panel edges).
  return (
    <LinearGradient
      start={vec(0, y0)}
      end={vec(0, y1)}
      colors={WAVE_LEVEL_STOPS.map((s) => s.color)}
      positions={WAVE_LEVEL_STOPS.map((s) => s.offset)}
    />
  );
}

/** Glow + crisp double-stroke for an animated path (house GlowStroke idiom).
 *  When `gradH` is given the crisp stroke is coloured by the MIDI amplitude
 *  gradient (level → colour) instead of the flat role colour. */
function FlowGlow({
  path,
  color = AMBER,
  width = 2.2,
  opacity = 1,
  gradH,
  gradY,
}: {
  path: SharedValue<SkPathT>;
  color?: string;
  width?: number;
  opacity?: number;
  gradH?: number;
  /** Where ±full scale sit, when that is not the panel edges. */
  gradY?: [number, number];
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width * 2.6} strokeCap="round" strokeJoin="round" opacity={0.22 * opacity}>
        <BlurMask blur={width * 2.2} style="normal" />
      </Path>
      <Path path={path} color={gradH != null ? undefined : color} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" opacity={opacity}>
        {gradH != null ? <WaveMidiGradient h={gradH} y0={gradY?.[0]} y1={gradY?.[1]} /> : null}
      </Path>
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
  note,
  noteColor,
  children,
}: {
  w: number;
  h: number;
  label: string;
  glow?: SharedValue<number>;
  /** A small key at the bottom-left naming what an overlay is (the EQ
   *  curve) or what the IN signal is. RN text over Skia: its points grow by
   *  ts like IN/OUT. Green by default (it names the stage's curve). */
  note?: string;
  noteColor?: string;
  children: ReactNode;
}) {
  const stageX = w * STAGE_FRAC;
  // (w, h) are GLASS units; the box on screen is (w, h) × ts — see FLOW_H.
  const ts = useStageTextScale();
  const glowOp = useDerivedValue(
    () => (glow ? 0.1 + Math.min(Math.max(glow.value, 0), 1) * 0.42 : 0.12),
    [glow],
  );
  return (
    <View style={{ width: w * ts, height: h * ts }}>
      <Canvas style={{ position: 'absolute', width: w * ts, height: h * ts }}>
        <Group transform={[{ scale: ts }]}>
        <RoundedRect x={0} y={0} width={w} height={h} r={8} color={BG} />
        <SkLine p1={{ x: 4, y: h / 2 }} p2={{ x: w - 4, y: h / 2 }} color={ZERO} strokeWidth={1.1} />
        {children}
        {/* The effect stage — the signal visibly passes THROUGH it. GREEN: the
            bar and its label are one green "processor" element (owner 2026-08-05). */}
        <RoundedRect x={stageX - 13} y={4} width={26} height={h - 8} r={8} color={STAGE_GREEN} opacity={glowOp}>
          <BlurMask blur={13} style="normal" />
        </RoundedRect>
        <RoundedRect x={stageX - 6} y={7} width={12} height={h - 14} r={5}>
          <LinearGradient start={vec(stageX - 6, 7)} end={vec(stageX + 6, h - 7)} colors={[STAGE_GREEN_DK1, STAGE_GREEN_DK2]} />
        </RoundedRect>
        <RoundedRect x={stageX - 6} y={7} width={12} height={h - 14} r={5} color="rgba(55,224,95,.7)" style="stroke" strokeWidth={1.2} />
        <RoundedRect x={0.5} y={0.5} width={w - 1} height={h - 1} r={7.5} color={FRAME} style="stroke" strokeWidth={1} />
        </Group>
      </Canvas>
      {/* Emphasized IN / OUT labels (owner 2026-08-05) — larger, bold, chipped.
          RN text over Skia: its points and chip grow by ts themselves. */}
      <Text style={[flowStyles.io, ioScaled(ts), { left: 6 * ts, top: 4 * ts }]}>IN ▸</Text>
      <Text style={[flowStyles.io, ioScaled(ts), { right: 6 * ts, top: 4 * ts }]}>▸ OUT</Text>
      {/* Processor name written VERTICALLY along the green divider bar. */}
      <Text
        style={[
          flowStyles.stageLbl,
          { fontSize: 12 * ts, letterSpacing: 2 * ts, left: (stageX - 45) * ts, top: (h / 2 - 9) * ts, width: 90 * ts },
        ]}
      >
        {label}
      </Text>
      {note ? (
        <Text style={[flowStyles.note, { fontSize: 10 * ts, left: 8 * ts, bottom: 3 * ts }, noteColor ? { color: noteColor } : null]}>{note}</Text>
      ) : null}
    </View>
  );
}

/** The IN/OUT chip's point-sized parts at the stage text scale. */
function ioScaled(ts: number) {
  return { fontSize: 14 * ts, letterSpacing: 1.4 * ts, paddingHorizontal: 4 * ts, borderRadius: 3 * ts };
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
  // THE RESPONSE CURVE on the display (owner hold #27, 2026-10-14: the bell
  // was only drawn in the well below). Frequency runs 20 Hz → 20 kHz across
  // the whole panel, 0 dB on the flow's zero line, from eqResponseDb on the
  // SAME band the DSP runs — so it follows every fader live. The dots mark the
  // three component frequencies of the travelling wave: the gain the curve
  // gives each one is exactly how much that component grows or shrinks in OUT.
  const curve = useMemo(() => {
    const x0 = 8;
    const x1 = w - 8;
    const halfH = h / 2 - 18;
    const centre = bands.length === 1 ? bands[0].freq : undefined;
    const pts = eqCurvePoints((f) => eqResponseDb(bands, f), x0, x1, h / 2, halfH, centre);
    const line = Skia.Path.Make();
    pts.forEach((pt, i) => (i === 0 ? line.moveTo(pt.x, pt.y) : line.lineTo(pt.x, pt.y)));
    const area = line.copy();
    area.lineTo(x1, h / 2);
    area.lineTo(x0, h / 2);
    area.close();
    const dots = Skia.Path.Make();
    for (const f of EQ_COMP_FREQS) dots.addCircle(eqCurveX(f, x0, x1), eqCurveY(eqResponseDb(bands, f), h / 2, halfH), 2.6);
    return { line, area, dots };
  }, [bands, w, h]);
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
    <FlowScene w={w} h={h} label={label} note={`EQ CURVE · ${EQ_CURVE_F_MIN} Hz → ${EQ_CURVE_F_MAX / 1000} kHz`}>
      <Path path={curve.area} color={STAGE_GREEN} opacity={0.08} />
      <Path path={curve.line} color={STAGE_GREEN} style="stroke" strokeWidth={1.6} strokeJoin="round" opacity={0.75} />
      <Path path={curve.dots} color={STAGE_GREEN} opacity={0.9} />
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      <FlowGlow path={outPath} gradH={h} />
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
    // A FIXED window (slider pass 2026-10-14): max(time × 6.5, 500) kept the
    // spacing constant for every TIME ≥ 77 ms. Echoes past the edge are not drawn.
    return echoSpacingFrac(timeMs) * outSpan;
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
      <FlowGlow path={echoPath} width={3.4} gradH={h} />
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
  srcHz,
  srcIsNoise,
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
  /** CHORUS: the source tone's frequency — see `trueLag` below. */
  srcHz?: number;
  srcIsNoise?: boolean;
}) {
  const stageX = w * STAGE_FRAC;
  const carrier = usePhaseClock(active, 0.5);
  /* CHORUS — THE TRUE PHASE LAG (grading fix 2026-10-16, Chorus 5.0 D).
   * The copy used to sit (centerMs ÷ 40) of a drawn cycle behind the dry wave,
   * i.e. the strip was drawn as if the source were a 25 Hz tone. At the lab's
   * own 20 ms default that is HALF a cycle, so dry + copy cancelled and the
   * resting picture said "chorus silences the sound". What the DSP does
   * (Effects.hpp ModEffect, chorus: τ = centerMs + depth·6 ms·sin(LFO)) to the
   * tone the student actually plays is a lag of φ = 2π·f·τ: for 440 Hz and
   * 20 ms, 8.8 cycles — 0.8 of a cycle on screen — so the 50 % sum has
   * |cos(π·f·τ)| = 0.81 of the input. As the LFO moves τ by ±3 ms (CLASSIC
   * depth), φ sweeps ±1.32 cycles: the copy slides, the sum swells and thins
   * (the beating you hear), and a true null is a moment the sweep passes
   * through, not a rest. The scope is a few true cycles of that tone; its
   * drift is slowed.
   * SIGN: the wave runs right as sin(kc·x − pc), so the copy emitted τ
   * earlier is sin(kc·x − pc + φ) — its crests sit φ/kc BEHIND (left of) the
   * dry crests. */
  const trueLag = flavor === 'chorus' && srcHz != null && srcHz > 0;
  /* At fast, deep settings the copy slips by 2π·f·(depth·6 ms)·2π·rate rad/s
   * at peak — at 440 Hz, depth 1, 3 Hz that is ~0.8 of a cycle per frame,
   * which strobes and can seem to run backwards. The DRAWN LFO is capped so
   * the slip stays readable (≤ ~45 rad/s), and the glass says SLOWED. */
  const slipPerHz = trueLag ? PI2 * (srcHz as number) * 0.006 * Math.max(depth, 0.01) * PI2 : 0;
  const lfoVisHz = trueLag ? Math.min(rateHz, 45 / slipPerHz) : Math.min(rateHz, 5);
  const lfoSlowed = trueLag && lfoVisHz < rateHz - 1e-6;
  const lfo = usePhaseClock(active, lfoVisHz); // true LFO rate (chorus: capped, see below)
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
    if (trueLag) {
      dph = (PI2 * (srcHz as number) * (ctrG.value + 6 * depthG.value * Math.sin(pl))) / 1000;
    } else if (flavor === 'chorus') {
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
  }, [carrier, lfo, depthG, ctrG, stG, stageX, w, h, kc, lamPx, trueLag, srcHz]);

  const outPath = useDerivedValue(() => {
    const pc = carrier.value;
    const pl = lfo.value;
    const mixV = mixG.value;
    const fbV = fbG.value;
    let dx = 0;
    let dph = 0;
    if (trueLag) {
      dph = (PI2 * (srcHz as number) * (ctrG.value + 6 * depthG.value * Math.sin(pl))) / 1000;
    } else if (flavor === 'chorus') {
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
  }, [carrier, lfo, depthG, ctrG, mixG, fbG, stG, stageX, w, h, kc, lamPx, trueLag, srcHz]);

  // CHORUS: the dry voice carries on past the stage (dim), so the two voices
  // that MAKE the chorus — you (grey) and the late copy (blue) — sit side by
  // side with what you hear (amber, their mix).
  const dryOutPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!trueLag) return p;
    const pc = carrier.value;
    const A = h * 0.32;
    const N = 52;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const y = h / 2 - A * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, trueLag, stageX, w, h, kc]);

  const note = trueLag
    ? lfoSlowed
      ? `${srcHz} Hz · LFO SLOWED`
      : srcIsNoise
        ? `${srcHz} Hz PART OF THE NOISE`
        : `SCOPE · ${srcHz} Hz TONE`
    : undefined;

  return (
    <FlowScene w={w} h={h} label={label} note={note} noteColor={trueLag ? DIM : undefined}>
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.85} />
      {trueLag ? <Path path={dryOutPath} color={DIM} style="stroke" strokeWidth={1.1} opacity={0.5} /> : null}
      <Path path={copyPath} color={BLUE} style="stroke" strokeWidth={1.2} opacity={trueLag ? 0.8 : 0.55} />
      <FlowGlow path={outPath} gradH={h} />
    </FlowScene>
  );
}

// ──────────────────────────────────────────────── comp/gate/limiter flow ──
// The SOURCE's signal travels in on one real time base (see the time-domain
// note above); past the stage it carries the transfer law applied THROUGH the
// envelope follower — loud parts squeezed (comp/limiter), quiet tails dropped
// (gate). Drawn as a DAW overview: linear amplitude, min/max per column.
// Where the engine runs, the LIVE measured GR drives the stage glow.
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
  attackMs,
  releaseMs,
  holdMs,
  grDb,
  signal,
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
  attackMs: number;
  releaseMs: number;
  holdMs: number;
  grDb: number;
  signal?: DynSignal;
}) {
  const stageX = w * STAGE_FRAC;
  // ONE clock, in real seconds: phase/2π = seconds, so the picture moves at
  // the true speed of the signal and hits arrive at the click's real tempo.
  const clock = usePhaseClock(active, 1);
  const thrG = useGlide(thresholdDb);
  const ratG = useGlide(ratio);
  const rngG = useGlide(rangeDb);
  const ceilG = useGlide(ceilingDb);
  const mkG = useGlide(makeupDb);
  const atkG = useGlide(attackMs);
  const relG = useGlide(releaseMs);
  const holdG = useGlide(holdMs);
  const grG = useGlide(grDb, 140); // LIVE measured GR → stage glow
  const glow = useDerivedValue(() => Math.min(grG.value / 12, 1), [grG]);
  const sigKind = signal?.kind === 'steady' ? 1 : signal?.kind === 'noise' ? 2 : 0;
  const periodMs = signal?.kind === 'hits' ? Math.max(100, signal.periodMs) : 500;

  /** Shared time base: the OUT half defines ms-per-pixel and the IN half
   *  uses the same, so one hit is the SAME WIDTH on both sides of the stage —
   *  it is one signal crossing one processor. */
  const inX0 = 6;
  const inX1 = stageX - 16;
  const outX0 = stageX + 10;
  const outX1 = w - 6;
  const msPerPx = DYN_WINDOW_MS / Math.max(1, outX1 - outX0);
  const mid = h / 2;
  /** Half-height of the panel edge (= DYN_TOP_DB). */
  const A = h / 2 - 5;
  /** Where ±0 dBFS would sit: the level gradient is pinned to TRUE full
   *  scale (levelColor: "the colour tracks true level regardless of vertical
   *  zoom"), so a −20 dBFS hit reads in the quiet colours it really is. */
  const fsHalf = A * Math.pow(10, -DYN_TOP_DB / 20);

  const inPath = useDerivedValue(() => {
    const now = (clock.value / PI2) * 1000;
    const p = Skia.Path.Make();
    const cols = Math.max(2, Math.floor(inX1 - inX0));
    const cw = (inX1 - inX0) / cols;
    const amps: number[] = [];
    for (let c = 0; c < cols; c++) {
      // min/max per column: the loudest moment inside the column's time span.
      let best = -200;
      for (let s = 0; s < DYN_SUB; s++) {
        const x = inX0 + c * cw + ((s + 0.5) * cw) / DYN_SUB;
        const db = dynLevelDb(now - (x - stageX) * msPerPx, sigKind, periodMs);
        if (db > best) best = db;
      }
      amps.push(dynLin(best));
    }
    for (let c = 0; c < cols; c++) {
      const x = inX0 + (c + 0.5) * cw;
      if (c === 0) p.moveTo(x, mid - A * amps[c]);
      else p.lineTo(x, mid - A * amps[c]);
    }
    for (let c = cols - 1; c >= 0; c--) p.lineTo(inX0 + (c + 0.5) * cw, mid + A * amps[c]);
    p.close();
    return p;
  }, [clock, inX0, inX1, stageX, msPerPx, mid, A, sigKind, periodMs]);

  const outPath = useDerivedValue(() => {
    const now = (clock.value / PI2) * 1000;
    const p = Skia.Path.Make();
    const cols = Math.max(2, Math.floor(outX1 - outX0));
    const cw = (outX1 - outX0) / cols;
    const dts = (cw * msPerPx) / DYN_SUB; // follower sub-step, ms
    const dtc = dts * DYN_SUB; // pre-roll step (one column), ms
    const atk = Math.max(atkG.value, 0.1);
    const rel = Math.max(relG.value, 1);
    const ratV = Math.max(ratG.value, 1);
    const holdV = Math.max(holdG.value, 0);
    const thrLin = Math.pow(10, thrG.value / 20);
    const ceilLin = Math.pow(10, ceilG.value / 20);
    const floorG = Math.pow(10, rngG.value / 20);
    const mkLin = Math.pow(10, mkG.value / 20);
    const slope = 1 - 1 / ratV;
    const peakLin = Math.pow(10, DYN_PEAK_DB / 20);
    const floorLin = Math.pow(10, DYN_FLOOR_DB / 20);

    /* THE ENGINE, MIRRORED LINE FOR LINE (Effects.hpp DynamicsEffect::
     * processStereo — re-read 2026-10-16; the drawing used to smooth the GAIN
     * REDUCTION in dB, which is not what the engine does):
     *   • a PEAK DETECTOR on the linear level — attack coefficient while the
     *     level rises past it, release while it falls away;
     *   • COMP / LIMITER: the static law applied to that detector, sample by
     *     sample (no second smoother);
     *   • GATE: a linear gain that OPENS at the attack rate while the detector
     *     is over the threshold, holds for HOLD, then CLOSES at the release rate
     *     toward the range floor. Opening is the fast edge — the 2026-09-11
     *     swapped-edge bug drew a gate that never opened.
     * ⚠️ Written INLINE, deliberately: a nested `'worklet'` helper declared in
     * here throws "not defined" at runtime (Reanimated compiles it as a
     * separate worklet that cannot see this function's locals). Coefficients
     * are hoisted (the step is constant within each phase of the walk), and a
     * hit's decay is advanced by MULTIPLYING, re-seated once per hit, so the
     * walk costs a transcendental only where the law actually bites. */
    const aAtkF = 1 - Math.exp(-dts / atk);
    const aRelF = 1 - Math.exp(-dts / rel);
    const aAtkC = 1 - Math.exp(-dtc / atk);
    const aRelC = 1 - Math.exp(-dtc / rel);
    const decF = Math.exp(-dts / DYN_DECAY_MS);
    const decC = Math.exp(-dtc / DYN_DECAY_MS);

    // The OLDEST signal on screen is at the right edge. The detector is causal,
    // so it walks FORWARD in time from before that edge (PRE-ROLL, one column
    // per step — it only has to settle) and then across the panel right→left,
    // DYN_SUB steps per column, keeping each column's loudest output.
    const tOld = now - (outX1 - stageX) * msPerPx;
    const settleMs = Math.min(2500, Math.max(periodMs, 5 * rel, 5 * atk + holdV, 200));
    const pre = Math.ceil(settleMs / dtc);
    const peaks: number[] = [];
    for (let c = 0; c < cols; c++) peaks.push(0);
    const total = pre + cols * DYN_SUB;
    let t = tOld - pre * dtc;
    let tb = t - Math.floor(t / periodMs) * periodMs; // time since the last hit
    let xd = peakLin * Math.exp(-tb / DYN_DECAY_MS); // the hit's own decay
    let env = 0;
    let gG = floorG;
    let holdLeft = 0;
    for (let k = 0; k < total; k++) {
      const coarse = k < pre;
      const dt = coarse ? dtc : dts;
      const x =
        sigKind === 1 ? peakLin : sigKind === 2 ? Math.pow(10, dynLevelDb(t, 2, periodMs) / 20) : xd > floorLin ? xd : floorLin;
      const aAtk = coarse ? aAtkC : aAtkF;
      const aRel = coarse ? aRelC : aRelF;
      // Peak detector: fast toward rises (attack), slow away (release).
      env += (x > env ? aAtk : aRel) * (x - env);
      let gain = 1;
      if (mode === 'gate') {
        if (env > thrLin) {
          holdLeft = holdV;
          gG += aAtk * (1 - gG); // open fast (attack)
        } else if (holdLeft > 0) {
          holdLeft -= dt; // hold: stay where we are
        } else {
          gG += aRel * (floorG - gG); // close at release speed
        }
        gain = gG;
      } else if (!coarse) {
        if (mode === 'compressor') {
          // over·(1 − 1/ratio) dB of reduction, as a linear gain, plus makeup.
          gain = (env > thrLin ? Math.exp(-slope * Math.log(env / thrLin)) : 1) * mkLin;
        } else {
          gain = env > ceilLin ? ceilLin / env : 1; // limiter: brickwall at the ceiling
        }
      }
      if (!coarse) {
        const c = cols - 1 - Math.floor((k - pre) / DYN_SUB);
        const out = x * gain;
        if (c >= 0 && out > peaks[c]) peaks[c] = out;
      }
      t += dt;
      tb += dt;
      if (tb >= periodMs) {
        tb -= periodMs;
        xd = peakLin * Math.exp(-tb / DYN_DECAY_MS); // re-seat exactly at each hit
      } else {
        xd *= coarse ? decC : decF;
      }
    }
    const topLin = Math.pow(10, DYN_TOP_DB / 20);
    for (let c = 0; c < cols; c++) {
      const a = peaks[c] / topLin;
      peaks[c] = a > 1 ? 1 : a;
      const x = outX0 + (c + 0.5) * cw;
      if (c === 0) p.moveTo(x, mid - A * peaks[c]);
      else p.lineTo(x, mid - A * peaks[c]);
    }
    for (let c = cols - 1; c >= 0; c--) p.lineTo(outX0 + (c + 0.5) * cw, mid + A * peaks[c]);
    p.close();
    return p;
  }, [clock, thrG, ratG, rngG, ceilG, mkG, atkG, relG, holdG, outX0, outX1, stageX, msPerPx, mid, A, mode, sigKind, periodMs]);

  // The UNPROCESSED signal's outline behind OUT (cognitive review 2026-10-16:
  // with nothing to compare against, a squeezed hit or a gated tail did not
  // read as "something was taken away"). Same columns, no processor.
  const dryOutPath = useDerivedValue(() => {
    const now = (clock.value / PI2) * 1000;
    const p = Skia.Path.Make();
    const cols = Math.max(2, Math.floor(outX1 - outX0));
    const cw = (outX1 - outX0) / cols;
    const amps: number[] = [];
    for (let c = 0; c < cols; c++) {
      let best = -200;
      for (let s = 0; s < DYN_SUB; s++) {
        const x = outX0 + c * cw + ((s + 0.5) * cw) / DYN_SUB;
        const db = dynLevelDb(now - (x - stageX) * msPerPx, sigKind, periodMs);
        if (db > best) best = db;
      }
      amps.push(dynLin(best));
    }
    for (let c = 0; c < cols; c++) {
      const x = outX0 + (c + 0.5) * cw;
      if (c === 0) p.moveTo(x, mid - A * amps[c]);
      else p.lineTo(x, mid - A * amps[c]);
    }
    for (let c = cols - 1; c >= 0; c--) p.lineTo(outX0 + (c + 0.5) * cw, mid + A * amps[c]);
    p.close();
    return p;
  }, [clock, outX0, outX1, stageX, msPerPx, mid, A, sigKind, periodMs]);

  // Dashed limit guides at their LINEAR height: threshold over the IN side
  // (comp/gate), ceiling over the OUT side (limiter) — dashed = a limit.
  const guidePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const db = mode === 'limiter' ? ceilG.value : thrG.value;
    const yOff = A * dynLin(db);
    const x0 = mode === 'limiter' ? outX0 : inX0;
    const x1 = mode === 'limiter' ? outX1 : inX1;
    p.moveTo(x0, mid - yOff);
    p.lineTo(x1, mid - yOff);
    p.moveTo(x0, mid + yOff);
    p.lineTo(x1, mid + yOff);
    return p;
  }, [thrG, ceilG, mode, inX0, inX1, outX0, outX1, mid, A]);

  // What the IN half is: the source as the hero models it (RN text, ≥ 9 pt).
  const note =
        // ⚠️ "DRUM-HIT MODEL": the lab's CLICK is a 5 ms ping (Generator.hpp), so
    // the drawing borrows only its TEMPO — the decaying hit is a model, and
    // the glass says so (audio-expert review 2026-10-16).
    sigKind === 1 ? 'STEADY TONE · −20 dBFS' : sigKind === 2 ? 'NOISE · PEAKS ≈ −20 dBFS' : `DRUM-HIT MODEL · ${Math.round(60000 / periodMs)} BPM`;

  return (
    <FlowScene w={w} h={h} label={label} glow={glow} note={note} noteColor={DIM}>
      <Path path={guidePath} color="rgba(255,198,77,.55)" style="stroke" strokeWidth={1}>
        <DashPathEffect intervals={[4, 3]} />
      </Path>
      <Path path={inPath} color={DIM} opacity={0.3} />
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1} strokeJoin="round" opacity={0.85} />
      <Path path={dryOutPath} color={DIM} style="stroke" strokeWidth={1} strokeJoin="round" opacity={0.55}>
        <DashPathEffect intervals={[3, 2]} />
      </Path>
      <Path path={outPath} opacity={0.55}>
        <WaveMidiGradient h={h} y0={mid - fsHalf} y1={mid + fsHalf} />
      </Path>
      <FlowGlow path={outPath} width={1.4} gradH={h} gradY={[mid - fsHalf, mid + fsHalf]} />
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
      <FlowGlow path={outPath} width={2} gradH={h} />
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
          srcHz={model.srcHz}
          srcIsNoise={model.srcIsNoise}
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
          attackMs={model.attackMs}
          releaseMs={model.releaseMs}
          holdMs={model.holdMs}
          grDb={grDb}
          signal={model.signal}
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
  // FULL SCREEN: the measured width is the ZOOMED width; the flow is laid out
  // in glass units (width ÷ ts) and painted ×ts, so the whole picture — not
  // just its width — grows with the step (see FLOW_H).
  const ts = useStageTextScale();
  const glassUnitsW = w / ts;
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
      {glassUnitsW >= 80 ? <FlowBody model={model} w={glassUnitsW} active={active} grDb={grDb} /> : <View style={{ height: FLOW_H * ts }} />}
    </View>
  );
}

const flowStyles = StyleSheet.create({
  wrap: { width: '100%' },
  // Emphasized IN / OUT signal-flow labels — large, bold, on a subtle chip.
  // Point sizes live in ioScaled() so they ride the stage text scale.
  io: {
    position: 'absolute',
    fontFamily: fonts.oswaldBold,
    color: colors.textPrimary,
    backgroundColor: 'rgba(12,12,15,.72)',
    overflow: 'hidden',
  },
  // The overlay key (EQ curve) — green like the stage it describes.
  note: {
    position: 'absolute',
    fontFamily: fonts.oswaldMedium,
    color: STAGE_GREEN,
    opacity: 0.9,
  },
  // Processor name along the divider — rotated to run vertically down the bar,
  // green to match it (owner 2026-08-05). Size/spacing set inline × ts.
  stageLbl: {
    position: 'absolute',
    fontFamily: fonts.oswaldSemiBold,
    textAlign: 'center',
    color: STAGE_GREEN,
    transform: [{ rotate: '-90deg' }],
  },
});
