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
import { STEREO_TEST_LR_RAD, distShape, eqResponseDb, type EqBandSpec } from '../../features/lab/fxViz';
import { EQ_CURVE_F_MAX, EQ_CURVE_F_MIN, eqCurvePoints, eqCurveX, eqCurveY } from './fxEqCurve';
import { usePhaseClock } from './foundations/viz';
import { useStageTextScale } from './rack/stageAspect';
import { WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';
import { ECHO_SPAN_MS, echoSpacingFrac } from '../../features/lab/sliderMaps';

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
  | { kind: 'delay'; timeMs: number; feedback: number; mix: number; pingpong: boolean; dampHz: number; src: FxSrc }
  | { kind: 'reverb'; rt60: number; preDelayMs: number; mix: number; dampHz: number; src: FxSrc }
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
      /** FLANGER: which noise the spectrum hero shows (pink = flat). */
      spectrum?: 'pink' | 'white';
    }
  | { kind: 'phaser'; rateHz: number; depth: number; centerHz: number; stages: number; feedback: number; spectrum?: 'pink' | 'white' }
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
  | { kind: 'stereo'; flavor: 'phase' | 'width'; widthPct: number; pan: number; invertR: boolean; delayRms: number; monoFold: boolean; monoIn?: boolean };

function stageLabel(model: FxAnimModel): string {
  switch (model.kind) {
    case 'eq': return 'EQ';
    case 'delay': return 'DELAY';
    case 'reverb': return 'REVERB';
    case 'mod': return model.flavor === 'chorus' ? 'CHORUS' : 'FLANGER';
    case 'phaser': return 'PHASER';
    case 'dynamics': return model.mode === 'compressor' ? 'COMP' : model.mode === 'gate' ? 'GATE' : 'LIMIT';
    case 'distortion': return 'DRIVE';
    // "M/S WIDTH" names what the green stage does in the width lab: L/R →
    // MID + SIDE, SIDE × width, back to L/R (art grading 2026-10-16: a bare
    // "WIDTH" slab read as an unexplained object).
    // "R: Ø · DLY" names what the phase lab's stage does: it acts on the R
    // channel only — a polarity flip and/or a delay (art grading 2026-10-16:
    // a bare "PHASE" slab read as an unexplained object).
    case 'stereo': return model.flavor === 'phase' ? 'R: Ø · DLY' : 'M/S WIDTH';
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
  legend,
  zeroY,
  overlay,
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
  /** Trace key at the bottom-right ("L" amber · "R" blue) for two-trace
   *  scenes, so each coloured line is named on the drawing. */
  legend?: { label: string; color: string }[];
  /** Where the zero line runs (default the middle); null = the scene draws
   *  its own reference lines (spectrum halves, ping-pong lanes). */
  zeroY?: number | null;
  /** RN labels laid over the canvas (GlassText) — rulers, axis ticks. */
  overlay?: ReactNode;
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
        {zeroY === null ? null : (
          <SkLine p1={{ x: 4, y: zeroY ?? h / 2 }} p2={{ x: w - 4, y: zeroY ?? h / 2 }} color={ZERO} strokeWidth={1.1} />
        )}
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
      {legend ? (
        <View style={[flowStyles.legend, { right: 8 * ts, bottom: 3 * ts, gap: 8 * ts }]}>
          {legend.map((k) => (
            <Text key={k.label} style={[flowStyles.legendTxt, { fontSize: 11 * ts, color: k.color }]}>
              {'— '}
              {k.label}
            </Text>
          ))}
        </View>
      ) : null}
      {overlay}
    </View>
  );
}

/** The IN/OUT chip's point-sized parts at the stage text scale. */
function ioScaled(ts: number) {
  return { fontSize: 14 * ts, letterSpacing: 1.4 * ts, paddingHorizontal: 4 * ts, borderRadius: 3 * ts };
}

// ───────────────────────────────────────────────────────────── EQ flow ──
// A 3-tone composite (150 Hz · 1 kHz · 6 kHz) travels in; the out wave is the
// SAME composite re-weighted by eqResponseDb at each tone's frequency —
// boost/cut visibly reshapes the blend.
//
// Round 3 (lab-art grading 2026-10-16): the 20 Hz–20 kHz EQ curve used to be
// drawn ACROSS the time-domain wave box (a beginner can read a frequency curve
// as the wave's envelope), and the three tones were drawn at 1.3 / 3.6 / 9
// cycles — not in proportion. Now (1) the curve has its OWN strip under the
// wave box, with its own frame, zero line and frequency axis; (2) the box
// spans a true time window (EQ_WINDOW_MS), so each tone shows f × window
// cycles: 150 Hz ≈ 1.2, 1 kHz = 8, 6 kHz = 48 — the real 1 : 6.7 : 40.
const EQ_COMP_FREQS = [150, 1000, 6000];
/** The wave box's true time span, ms (the whole panel width). */
const EQ_WINDOW_MS = 8;
const TRAVEL_PX_PER_RAD = 13;
/** The curve strip's height (glass units) and the gap above it; the wave box
 *  gets the rest of FLOW_H, so the hero keeps its glass size. */
const EQ_STRIP_H = 44;
const EQ_STRIP_GAP = 3;

function EqFlow({ w, h, active, label, bands }: { w: number; h: number; active: boolean; label: string; bands: EqBandSpec[] }) {
  const ts = useStageTextScale();
  const hw = h - EQ_STRIP_H - EQ_STRIP_GAP; // the wave box
  const stageX = w * STAGE_FRAC;
  const phase = usePhaseClock(active, 0.5);
  // Linear gains at the component frequencies — the EXACT fxViz curve math.
  const gains = useMemo(
    () => EQ_COMP_FREQS.map((f) => Math.min(Math.pow(10, eqResponseDb(bands, f) / 20), 4)),
    [bands],
  );
  // THE RESPONSE CURVE (owner hold #27, 2026-10-14: it must be on the display)
  // in its own strip: 20 Hz → 20 kHz across, 0 dB on the strip's zero line,
  // from eqResponseDb on the SAME band the DSP runs. The three dots are the
  // wave's tones: the gain the curve gives each is how much it grows in OUT.
  const sh = EQ_STRIP_H;
  const curve = useMemo(() => {
    const x0 = 8;
    const x1 = w - 8;
    const halfH = sh / 2 - 5;
    const centre = bands.length === 1 ? bands[0].freq : undefined;
    const pts = eqCurvePoints((f) => eqResponseDb(bands, f), x0, x1, sh / 2, halfH, centre);
    const line = Skia.Path.Make();
    pts.forEach((pt, i) => (i === 0 ? line.moveTo(pt.x, pt.y) : line.lineTo(pt.x, pt.y)));
    const area = line.copy();
    area.lineTo(x1, sh / 2);
    area.lineTo(x0, sh / 2);
    area.close();
    const dots = Skia.Path.Make();
    for (const f of EQ_COMP_FREQS) dots.addCircle(eqCurveX(f, x0, x1), eqCurveY(eqResponseDb(bands, f), sh / 2, halfH), 2.6);
    const ticks = Skia.Path.Make();
    for (const f of [100, 1000, 10000]) {
      const x = eqCurveX(f, x0, x1);
      ticks.moveTo(x, 3);
      ticks.lineTo(x, sh - 3);
    }
    return { line, area, dots, ticks };
  }, [bands, w, sh]);
  const g0 = useGlide(gains[0]);
  const g1 = useGlide(gains[1]);
  const g2 = useGlide(gains[2]);
  // True proportion: k = 2π · f · window / w (cycles per glass unit).
  const k0 = (PI2 * EQ_COMP_FREQS[0] * EQ_WINDOW_MS) / 1000 / w;
  const k1 = (PI2 * EQ_COMP_FREQS[1] * EQ_WINDOW_MS) / 1000 / w;
  const k2 = (PI2 * EQ_COMP_FREQS[2] * EQ_WINDOW_MS) / 1000 / w;

  const inPath = useDerivedValue(() => {
    const s = phase.value * TRAVEL_PX_PER_RAD;
    const p = Skia.Path.Make();
    const x0 = 6;
    const x1 = stageX - 10;
    const A = hw * 0.32;
    const N = Math.ceil((x1 - x0) / 0.8); // ≥ 8 points per 6 kHz cycle
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const y = hw / 2 - (A / 3) * (Math.sin(k0 * (x - s)) + Math.sin(k1 * (x - s)) + Math.sin(k2 * (x - s)));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, stageX, w, hw]);

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
    const A = hw * 0.32;
    const N = Math.ceil((x1 - x0) / 0.8);
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const y =
        hw / 2 -
        ((A * norm) / 3) * (a0 * Math.sin(k0 * (x - s)) + a1 * Math.sin(k1 * (x - s)) + a2 * Math.sin(k2 * (x - s)));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, g0, g1, g2, stageX, w, hw]);

  return (
    <View>
      <FlowScene w={w} h={hw} label={label}>
        <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.1} opacity={0.85} />
        <FlowGlow path={outPath} gradH={hw} width={1.6} />
      </FlowScene>
      <View style={{ width: w * ts, height: sh * ts, marginTop: EQ_STRIP_GAP * ts }}>
        <Canvas style={{ position: 'absolute', width: w * ts, height: sh * ts }}>
          <Group transform={[{ scale: ts }]}>
            <RoundedRect x={0} y={0} width={w} height={sh} r={6} color={BG} />
            <Path path={curve.ticks} color={FRAME} style="stroke" strokeWidth={0.8} />
            <SkLine p1={{ x: 4, y: sh / 2 }} p2={{ x: w - 4, y: sh / 2 }} color={ZERO} strokeWidth={1} />
            <Path path={curve.area} color={STAGE_GREEN} opacity={0.1} />
            <Path path={curve.line} color={STAGE_GREEN} style="stroke" strokeWidth={1.6} strokeJoin="round" opacity={0.85} />
            <Path path={curve.dots} color={STAGE_GREEN} opacity={0.95} />
            <RoundedRect x={0.5} y={0.5} width={w - 1} height={sh - 1} r={5.5} color={FRAME} style="stroke" strokeWidth={1} />
          </Group>
        </Canvas>
        <Text style={[flowStyles.note, flowStyles.noteChip, { fontSize: 10 * ts, left: 6 * ts, top: 2 * ts, paddingHorizontal: 3 * ts, borderRadius: 3 * ts }]}>
          {`EQ CURVE · ${EQ_CURVE_F_MIN} Hz → ${EQ_CURVE_F_MAX / 1000} kHz`}
        </Text>
        <Text style={[flowStyles.note, flowStyles.noteChip, { fontSize: 10 * ts, right: 6 * ts, bottom: 2 * ts, paddingHorizontal: 3 * ts, borderRadius: 3 * ts }]}>
          {'● = the wave’s 150 Hz · 1k · 6k tones'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────── time-domain sources ──
/** What the delay / reverb / flanger / phaser heroes draw coming IN: the
 *  lab's selected SOURCE as Generator.hpp makes it (fix wave 2026-10-16). A
 *  click is a 5 ms 1 kHz ping at its BPM; a burst is a 50 ms Hann-windowed
 *  tone every 250 ms; a tone is a steady sine; noise is steady broadband. */
export type FxSrc =
  | { kind: 'click'; periodMs: number }
  | { kind: 'burst'; hz: number }
  | { kind: 'tone'; hz: number }
  | { kind: 'noise'; color: 'pink' | 'white' };

/** Gain at f of the engine's in-loop one-pole low-pass (Effects.hpp:
 *  y += c·(x − y), c = 1 − e^(−2π·fc/fs)) — the delay's REPEAT DAMPING and
 *  the reverb's HF DAMPING both run every repeat through it. */
export function onePoleGain(fcHz: number, fHz: number): number {
  const fs = 48000;
  const c = 1 - Math.exp((-2 * Math.PI * fcHz) / fs);
  const wv = (2 * Math.PI * fHz) / fs;
  const a = 1 - c;
  const re = 1 - a * Math.cos(wv);
  const im = a * Math.sin(wv);
  return c / Math.sqrt(re * re + im * im);
}

/** A label over the flow canvas at GLASS coordinates (x = its anchor per
 *  `align`, y = its top); points and position × ts like IN/OUT, so FULL
 *  SCREEN zooms it with the drawing. */
function GlassText({
  x,
  y,
  text,
  align = 'center',
  color = DIM,
  size = 9.5,
  w = 64,
}: {
  x: number;
  y: number;
  text: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  size?: number;
  w?: number;
}) {
  const ts = useStageTextScale();
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  return (
    <Text
      style={[
        flowStyles.tag,
        { fontSize: size * ts, letterSpacing: 0.5 * ts, left: left * ts, top: y * ts, width: w * ts, textAlign: align, color },
      ]}
    >
      {text}
    </Text>
  );
}

/** One click-train column of the delay hero: what lands inside the column's
 *  time span [tLo, tHi) — [dry hit (0/1), odd repeats, even repeats]; repeat
 *  n of every earlier hit sits at kP + nD with height mix·g^(n−1). */
function echoCol(tLo: number, tHi: number, P: number, D: number, mix: number, g: number): number[] {
  'worklet';
  const k0 = Math.ceil(tLo / P);
  const dry = k0 * P < tHi ? 1 : 0;
  let a = mix;
  let odd = 0;
  let even = 0;
  for (let n = 1; n <= 16; n++) {
    if (a < 0.008) break;
    const k = Math.ceil((tLo - n * D) / P);
    if (k * P + n * D < tHi) {
      if (n % 2 === 1) odd += a;
      else even += a;
    }
    a *= g;
  }
  return [dry, odd, even];
}

/** The delay hero's OUT side for one frame. kind 0 = the dry hits (grey);
 *  1 = the L (or only) lane's repeats, 2 = the R lane's — or, for a steady
 *  source, that lane's steady band. One path per lane, so each lane's level
 *  colour is pinned to its own centre line. */
function echoOutPath(
  kind: number,
  now: number,
  sk: number,
  srcHz: number,
  periodMs: number,
  msPerPx: number,
  stageX: number,
  outX0: number,
  outX1: number,
  pp: number,
  yc: number,
  lc: number,
  rc: number,
  half: number,
  halfPP: number,
  mixV: number,
  g: number,
  D: number,
): SkPathT {
  'worklet';
  const p = Skia.Path.Make();
  const yL = yc + (lc - yc) * pp;
  const yR = yc + (rc - yc) * pp;
  const hl = half + (halfPP - half) * pp;
  const split = pp > 0.5;
  const cols = Math.max(2, Math.floor(outX1 - outX0));
  const cw = (outX1 - outX0) / cols;
  if (sk === 0) {
    for (let c = 0; c < cols; c++) {
      const xL = outX0 + c * cw;
      const xm = xL + cw / 2;
      const tHi = now - (xL - stageX) * msPerPx;
      const tLo = tHi - cw * msPerPx;
      const ev = echoCol(tLo, tHi, periodMs, D, mixV, g);
      if (kind === 0) {
        const a = ev[0] * (1 - mixV);
        if (a * hl > 0.6) {
          p.moveTo(xm, yL - a * hl);
          p.lineTo(xm, yL + a * hl);
          if (split) {
            p.moveTo(xm, yR - a * hl);
            p.lineTo(xm, yR + a * hl);
          }
        }
      } else {
        // kind 1 = the L lane (odd repeats when split, all of them when not),
        // kind 2 = the R lane (even repeats; empty unless split).
        const a = kind === 1 ? (split ? ev[1] : ev[1] + ev[2]) : split ? ev[2] : 0;
        const y0 = kind === 1 ? yL : yR;
        const ac = Math.min(a, 1.05);
        if (ac * hl > 0.6) {
          p.moveTo(xm, y0 - ac * hl);
          p.lineTo(xm, y0 + ac * hl);
        }
      }
    }
    return p;
  }
  // A steady source: one band per lane at the steady output level.
  if (kind === 0) return p;
  let G = 1;
  if (sk === 1) {
    // |(1 − m) + m·e^(−jθ)/(1 − g·e^(−jθ))|, θ = 2π·f·D — the comb law.
    const th = (PI2 * srcHz * D) / 1000;
    const er = Math.cos(th);
    const ei = -Math.sin(th);
    const dr = 1 - g * er;
    const di = -g * ei;
    const den = Math.max(dr * dr + di * di, 1e-9);
    const wr = (er * dr + ei * di) / den;
    const wi = (ei * dr - er * di) / den;
    const hr = 1 - mixV + mixV * wr;
    const hi = mixV * wi;
    G = Math.sqrt(hr * hr + hi * hi);
  } else {
    // The repeats of noise are uncorrelated: they add in power.
    G = Math.sqrt((1 - mixV) * (1 - mixV) + (mixV * mixV) / Math.max(1 - g * g, 1e-3));
  }
  if (kind === 2 && !split) return p;
  const unit = hl / Math.max(1, G);
  const y0 = kind === 1 ? yL : yR;
  const seed = kind === 1 ? 0 : 7.7;
  for (let c = 0; c <= cols; c++) {
    const x = outX0 + c * cw;
    const t = now - (x - stageX) * msPerPx;
    const a = G * (sk === 1 ? 1 : 0.72 + 0.28 * hashW(Math.floor(t / 12) * 1.37 + 3.1 + seed));
    if (c === 0) p.moveTo(x, y0 - a * unit);
    else p.lineTo(x, y0 - a * unit);
  }
  for (let c = cols; c >= 0; c--) {
    const x = outX0 + c * cw;
    const t = now - (x - stageX) * msPerPx;
    const a = G * (sk === 1 ? 1 : 0.72 + 0.28 * hashW(Math.floor(t / 12) * 1.37 + 3.1 + seed));
    p.lineTo(x, y0 + a * unit);
  }
  p.close();
  return p;
}

// ─────────────────────────────────────────────────────────── delay flow ──
/* REWRITTEN 2026-10-16 (art grading, Delay 7.41: "echoes are bare 2-px ticks
 * in a mostly empty panel"; "no picture of time vs tempo"). ONE REAL TIME
 * BASE, the dynamics heroes' grammar: signal time at x is
 * t(x) = now − (x − stageX)·msPerPx — the stage is "now", IN is what is about
 * to arrive, OUT what already left, and everything moves right at true speed.
 * The OUT half spans ECHO_SPAN_MS (the timeline graph's own window) over a
 * seconds ruler, so the spacing reads as a time.
 *  • The SOURCE is the lab's: the CLICK is a 5 ms 1 kHz ping at its BPM
 *    (Generator.hpp). On a 3.25 s window one ping is one pixel column, so it
 *    is drawn as a DAW overview draws it — a full-height line at its level.
 *    A steady sine or noise is a band: the repeats of a steady signal sum
 *    into a steady level (the comb law at that pitch), and the glass says to
 *    use CLICK.
 *  • The ENGINE, mirrored (Effects.hpp DelayEffect): out = in·(1 − mix) +
 *    line·mix, line = in + fb·LP(line, D) — repeat n is mix·(fb·|H|)^(n−1),
 *    |H| the in-loop damping low-pass at the source's pitch, so REPEAT
 *    DAMPING visibly shortens the trail.
 *  • LINEAR amplitude (a DAW overview); the lane edge = the −20 dBFS peak.
 *  • PING-PONG splits OUT into two lanes, L over R: odd repeats left, even
 *    right (the designed behaviour — see the fix notes' HOLD on the engine's
 *    cross-feed with a mono source). */
function EchoFlow({
  w,
  h,
  active,
  label,
  timeMs,
  feedback,
  mix,
  pingpong,
  dampHz,
  src,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  timeMs: number;
  feedback: number;
  mix: number;
  pingpong: boolean;
  dampHz: number;
  src: FxSrc;
}) {
  const stageX = w * STAGE_FRAC;
  // ONE clock in real seconds (phase/2π = s): true speed, the click's tempo.
  const clock = usePhaseClock(active, 1);
  const dPx = useMemo(() => {
    const outSpan = w - stageX - 12;
    // A FIXED window (slider pass 2026-10-14): max(time × 6.5, 500) kept the
    // spacing constant for every TIME ≥ 77 ms. Echoes past the edge are not drawn.
    return echoSpacingFrac(timeMs) * outSpan;
  }, [w, stageX, timeMs]);
  const msPerPx = ECHO_SPAN_MS / (w - stageX - 12);
  // The delay time glides (the engine glides it too, tape-style ~50 ms).
  const dG = useGlide(dPx);
  const fbG = useGlide(feedback);
  const mixG = useGlide(mix);
  const ppG = useGlide(pingpong ? 1 : 0);
  const srcHz = src.kind === 'tone' ? src.hz : 1000;
  const hG = useGlide(onePoleGain(dampHz, srcHz));
  const sk = src.kind === 'tone' ? 1 : src.kind === 'noise' ? 2 : 0;
  const periodMs = src.kind === 'click' ? Math.max(100, src.periodMs) : 1000;

  const inX0 = 6;
  const inX1 = stageX - 16;
  const outX0 = stageX + (pingpong ? 22 : 12);
  const outX1 = w - 6;
  const top = 24;
  const bot = h - 20;
  const yc = (top + bot) / 2;
  const half = (bot - top) / 2 - 1;
  const lc = top + (bot - top) / 4;
  const rc = bot - (bot - top) / 4;
  const halfPP = (bot - top) / 4 - 2;

  /** IN: the source, mono, full lane. */
  const inPath = useDerivedValue(() => {
    const now = (clock.value / PI2) * 1000;
    const p = Skia.Path.Make();
    const cols = Math.max(2, Math.floor(inX1 - inX0));
    const cw = (inX1 - inX0) / cols;
    if (sk === 0) {
      for (let c = 0; c < cols; c++) {
        const xL = inX0 + c * cw;
        const tHi = now - (xL - stageX) * msPerPx;
        const tLo = tHi - cw * msPerPx;
        const k0 = Math.ceil(tLo / periodMs);
        if (k0 * periodMs < tHi) {
          p.moveTo(xL + cw / 2, yc - half);
          p.lineTo(xL + cw / 2, yc + half);
        }
      }
      return p;
    }
    for (let c = 0; c <= cols; c++) {
      const x = inX0 + c * cw;
      const t = now - (x - stageX) * msPerPx;
      const a = sk === 1 ? 1 : 0.72 + 0.28 * hashW(Math.floor(t / 12) * 1.37 + 3.1);
      if (c === 0) p.moveTo(x, yc - a * half);
      else p.lineTo(x, yc - a * half);
    }
    for (let c = cols; c >= 0; c--) {
      const x = inX0 + c * cw;
      const t = now - (x - stageX) * msPerPx;
      const a = sk === 1 ? 1 : 0.72 + 0.28 * hashW(Math.floor(t / 12) * 1.37 + 3.1);
      p.lineTo(x, yc + a * half);
    }
    p.close();
    return p;
  }, [clock, inX0, inX1, stageX, msPerPx, sk, periodMs, yc, half]);

  const outArgs = [sk, srcHz, periodMs, msPerPx, stageX, outX0, outX1, yc, lc, rc, half, halfPP] as const;
  const dryOut = useDerivedValue(
    () => echoOutPath(0, (clock.value / PI2) * 1000, sk, srcHz, periodMs, msPerPx, stageX, outX0, outX1, ppG.value, yc, lc, rc, half, halfPP, mixG.value, fbG.value * hG.value, Math.max(1, dG.value * msPerPx)),
    [clock, ppG, mixG, fbG, hG, dG, ...outArgs],
  );
  const wetL = useDerivedValue(
    () => echoOutPath(1, (clock.value / PI2) * 1000, sk, srcHz, periodMs, msPerPx, stageX, outX0, outX1, ppG.value, yc, lc, rc, half, halfPP, mixG.value, fbG.value * hG.value, Math.max(1, dG.value * msPerPx)),
    [clock, ppG, mixG, fbG, hG, dG, ...outArgs],
  );
  const wetR = useDerivedValue(
    () => echoOutPath(2, (clock.value / PI2) * 1000, sk, srcHz, periodMs, msPerPx, stageX, outX0, outX1, ppG.value, yc, lc, rc, half, halfPP, mixG.value, fbG.value * hG.value, Math.max(1, dG.value * msPerPx)),
    [clock, ppG, mixG, fbG, hG, dG, ...outArgs],
  );
  // Level colour pinned to TRUE full scale (loudness standard): a lane's edge
  // is the source's −20 dBFS peak, so full scale sits 10× further out and the
  // repeats read in the quiet colours they really are.
  const laneL = pingpong ? lc : yc;
  const laneHalf = pingpong ? halfPP : half;
  const fsSpan = laneHalf * 10;

  // The seconds ruler under OUT: a tick every 250 ms of age, whole seconds
  // named — the age of what you see, measured from the stage.
  const ruler = useMemo(() => {
    const p = Skia.Path.Make();
    const marks: { x: number; s: number }[] = [];
    for (let ms = 250; ms < 10000; ms += 250) {
      const x = stageX + ms / msPerPx;
      if (x > outX1) break;
      if (x < outX0) continue;
      const major = ms % 1000 === 0;
      p.moveTo(x, bot + 2);
      p.lineTo(x, bot + (major ? 6 : 4));
      if (major && x < outX1 - 10) marks.push({ x, s: ms / 1000 });
    }
    return { p, marks };
  }, [stageX, msPerPx, outX0, outX1, bot]);

  const note =
    sk === 0 ? `CLICK · ${Math.round(60000 / periodMs)} BPM` : sk === 1 ? 'STEADY SINE · TRY CLICK' : 'STEADY NOISE · TRY CLICK';

  return (
    <FlowScene
      w={w}
      h={h}
      label={label}
      note={note}
      noteColor={DIM}
      zeroY={pingpong ? null : yc}
      overlay={
        <>
      {ruler.marks.map((m) => (
          <GlassText key={m.s} x={m.x} y={bot + 5} text={`${m.s} s`} w={30} />
        ))}
        {pingpong ? (
          <>
            <GlassText x={stageX + 16} y={lc - 7} text="L" w={12} color={colors.textPrimary} />
            <GlassText x={stageX + 16} y={rc - 7} text="R" w={12} color={colors.textPrimary} />
          </>
        ) : null}
        </>
      }
    >
      <Path path={ruler.p} color={DIM} style="stroke" strokeWidth={1} opacity={0.7} />
      {pingpong ? (
        <>
          <SkLine p1={vec(4, yc)} p2={vec(stageX - 13, yc)} color={ZERO} strokeWidth={1.1} />
          <SkLine p1={vec(outX0, lc)} p2={vec(outX1, lc)} color={ZERO} strokeWidth={1} />
          <SkLine p1={vec(outX0, rc)} p2={vec(outX1, rc)} color={ZERO} strokeWidth={1} />
        </>
      ) : null}
      {sk === 0 ? (
        <Path path={inPath} color={DIM} style="stroke" strokeWidth={2} strokeCap="round" opacity={0.9} />
      ) : (
        <Path path={inPath} color={DIM} opacity={0.45} />
      )}
      <Path path={dryOut} color={DIM} style="stroke" strokeWidth={2} strokeCap="round" opacity={0.85} />
      {sk === 0 ? (
        <>
          <FlowGlow path={wetL} width={2.2} gradH={h} gradY={[laneL - fsSpan, laneL + fsSpan]} />
          <FlowGlow path={wetR} width={2.2} gradH={h} gradY={[rc - fsSpan, rc + fsSpan]} />
        </>
      ) : (
        <>
          <Path path={wetL} opacity={0.8}>
            <WaveMidiGradient h={h} y0={laneL - fsSpan} y1={laneL + fsSpan} />
          </Path>
          <Path path={wetR} opacity={0.8}>
            <WaveMidiGradient h={h} y0={rc - fsSpan} y1={rc + fsSpan} />
          </Path>
        </>
      )}
    </FlowScene>
  );
}

// ────────────────────────────────────────────────────────── reverb flow ──
/* REWRITTEN 2026-10-16 (art grading, Reverb 6.96: "the tail is a ~30 px
 * wedge; nothing shows thousands of reflections or the RT60 time scale; the
 * hero does not change visibly with RT60 / pre-delay").
 *  • IN flows into the stage on the real time base (the delay/dynamics
 *    grammar). OUT is a TRIGGERED SWEEP, as a decay analyser shows it: each
 *    click reaching the stage restarts a trace that writes left → right at
 *    true speed over REV_WIN_MS (a seconds ruler under it), so the decay
 *    FALLS to the right, the way every RT60 plot and DAW draws it. (On the
 *    flowing time base the newest signal sits nearest the stage, so a decay
 *    drew as a slope RISING to the right — tried first, it read backwards.)
 *  • A dB VIEW, rectified (the level-vs-time view of a decay analyser, or a
 *    DAW's waveform in dB): the baseline is REV_RANGE_DB below the source's
 *    −20 dBFS peak, the top edge is that peak. On a dB scale an exponential
 *    decay is a STRAIGHT SLOPE that falls 60 dB in RT60 — the one picture
 *    that makes RT60 a time you can see (in linear amplitude the tail is gone
 *    after a third of it).
 *  • The ENGINE, mirrored (Effects.hpp ReverbEffect — a 4-line FDN, lines
 *    31–59 ms, gᵢ = 10^(−3·Dᵢ/(fs·RT60)), in-loop one-pole damping, pre-delay,
 *    out = in·(1 − mix) + fdn·mix). Levels calibrated on an exact JS port of
 *    the FDN driven by the lab's 5 ms 1 kHz click (per-column peaks): nothing
 *    until pre-delay + 31 ms (the shortest line); the first arrivals at about
 *    −12 dB of the click for ~30 ms; then the dense tail from about −17 dB,
 *    falling at 60/RT60 dB/s PLUS what the damping low-pass takes from a
 *    1 kHz ping on every ~45 ms trip round the loop (DARK 2k ≈ +21 dB/s). Each
 *    hit's tail adds in POWER to the earlier ones still ringing, so a long
 *    RT60 builds a wash between the clicks.
 *  • A burst (50 ms of tone every 250 ms) excites the same tail ≈ 8 dB
 *    louder (the same port); steady noise keeps a steady wash ≈ 5 dB under
 *    the dry noise — the glass says to use the click. */
const REV_WIN_MS = 1500;
const REV_RANGE_DB = 90;
/** Mean round trip of the four FDN lines (1499–2833 samples at 48 kHz). */
const REV_LOOP_S = 0.0448;

/** One column of the reverb hero: [dry dB, wet dB] relative to the source's
 *  peak, at signal time tMid (ms). sk: 0 click · 1 burst · 2 noise. */
function revCol(tMid: number, colMs: number, sk: number, P: number, pre: number, decDbS: number, mix: number): number[] {
  'worklet';
  const lmix = 20 * Math.log10(Math.max(mix, 1e-4));
  // 100 % wet leaves no dry at all (not a −80 dB stub).
  const ldry = mix >= 0.999 ? -200 : 20 * Math.log10(1 - mix);
  const q = Math.floor(tMid / colMs);
  const jit = 1.6 * hashW(q * 1.37 + 5.3);
  let dry = -200;
  let sum = 0;
  if (sk === 2) {
    dry = ldry - jit;
    sum = Math.pow(10, (-5 - 1.6 * hashW(q * 2.11 + 1.7)) / 10);
  } else {
    if (sk === 0) {
      const tLo = tMid - colMs / 2;
      const k0 = Math.ceil(tLo / P);
      if (k0 * P < tLo + colMs) dry = ldry;
    } else {
      // Hann-windowed 50 ms burst: its loudest point inside the column.
      let best = 0;
      for (let s = -1; s <= 1; s++) {
        const t = tMid + (s * colMs) / 2;
        const tb = t - Math.floor(t / P) * P;
        if (tb < 50) {
          const e = 0.5 * (1 - Math.cos((PI2 * tb) / 50));
          if (e > best) best = e;
        }
      }
      if (best > 0.003) dry = ldry + 20 * Math.log10(best);
    }
    const lead = sk === 1 ? 50 : 0; // a burst keeps feeding the tank for 50 ms
    const kN = Math.floor((tMid - pre - 31) / P);
    for (let j = 0; j < 48; j++) {
      const k = kN - j;
      const tau = tMid - k * P - pre;
      let L = 0;
      if (tau < 31) continue;
      if (tau < 62 + lead) L = -12;
      else L = -17 - (decDbS * (tau - 60 - lead)) / 1000;
      if (sk === 1) L += 8;
      if (L < -110) break;
      sum += Math.pow(10, L / 10);
    }
  }
  const wet = sum > 0 ? 10 * Math.log10(sum) + lmix - (sk === 2 ? 0 : jit) : -200;
  return [dry, wet];
}

/** The reverb hero's OUT side for one frame — a TRIGGERED SWEEP: x is the
 *  time since the trigger (a click reaching the stage), left → right like a
 *  decay analyser or a DAW, so the decay FALLS to the right. The sweep head
 *  writes at true speed; right of it the previous sweep persists, dimmer.
 *  kind 0 = the wet area (closed, from the baseline), 1 = this sweep's top
 *  contour, 2 = the dry part, 3 = the previous sweep's top contour,
 *  4 = the sweep head. */
function revOutPath(
  kind: number,
  now: number,
  sk: number,
  P: number,
  TP: number,
  pre: number,
  dec: number,
  mix: number,
  outX0: number,
  outX1: number,
  msPerPx: number,
  top: number,
  base: number,
): SkPathT {
  'worklet';
  const p = Skia.Path.Make();
  const tTrig = Math.floor(now / TP) * TP;
  if (kind === 4) {
    const xh = outX0 + (now - tTrig) / msPerPx;
    if (xh < outX1) {
      p.moveTo(xh, top - 2);
      p.lineTo(xh, base);
    }
    return p;
  }
  const cols = Math.max(2, Math.floor(outX1 - outX0));
  const cw = (outX1 - outX0) / cols;
  const colMs = cw * msPerPx;
  let started = false;
  if (kind === 0) p.moveTo(outX0, base);
  for (let c = 0; c < cols; c++) {
    const xm = outX0 + (c + 0.5) * cw;
    let T = tTrig + (xm - outX0) * msPerPx;
    const old = T > now;
    if (old) T -= TP;
    const v = revCol(T, colMs, sk, P, pre, dec, mix);
    const db = kind === 2 ? v[0] : v[1];
    const hgt = Math.max(0, Math.min(1, (db + REV_RANGE_DB) / REV_RANGE_DB)) * (base - top);
    if (kind === 0) {
      p.lineTo(xm, base - hgt);
    } else if (kind === 1 || kind === 3) {
      if (hgt > 0.5 && old === (kind === 3)) {
        if (!started) p.moveTo(xm, base - hgt);
        else p.lineTo(xm, base - hgt);
        started = true;
      } else started = false;
    } else if (hgt > 0.5) {
      if (sk === 0) {
        p.moveTo(xm, base);
        p.lineTo(xm, base - hgt);
      } else {
        if (!started) p.moveTo(xm, base - hgt);
        else p.lineTo(xm, base - hgt);
        started = true;
      }
    } else started = false;
  }
  if (kind === 0) {
    p.lineTo(outX1, base);
    p.close();
  }
  return p;
}

function ReverbFlow({
  w,
  h,
  active,
  label,
  rt60,
  preDelayMs,
  mix,
  dampHz,
  src,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  rt60: number;
  preDelayMs: number;
  mix: number;
  dampHz: number;
  src: FxSrc;
}) {
  const stageX = w * STAGE_FRAC;
  const clock = usePhaseClock(active, 1); // real seconds
  const inX0 = 6;
  const inX1 = stageX - 16;
  const outX0 = stageX + 10;
  const outX1 = w - 6;
  const msPerPx = REV_WIN_MS / (outX1 - outX0);
  const top = 24;
  const base = h - 20;
  const pxPerDb = (base - top) / REV_RANGE_DB;
  const sk = src.kind === 'click' ? 0 : src.kind === 'burst' ? 1 : 2;
  const P = src.kind === 'click' ? Math.max(100, src.periodMs) : 250;
  const srcHz = src.kind === 'burst' ? src.hz : 1000;
  // dB per second the tail falls at the source's pitch: the RT60 law plus the
  // in-loop damping's bite per trip round the tank.
  const decG = useGlide(60 / Math.max(rt60, 0.05) + (-20 * Math.log10(onePoleGain(dampHz, srcHz))) / REV_LOOP_S);
  const preG = useGlide(preDelayMs);
  const mixG = useGlide(mix);

  // The sweep re-triggers on a click (every ~1 s of clicks), every 4th burst,
  // or free-runs over the window for steady noise.
  const TP = sk === 2 ? REV_WIN_MS : P * Math.max(1, Math.round(1000 / P));
  const wetArea = useDerivedValue(() => revOutPath(0, (clock.value / PI2) * 1000, sk, P, TP, preG.value, decG.value, mixG.value, outX0, outX1, msPerPx, top, base), [clock, preG, decG, mixG, sk, P, TP, outX0, outX1, msPerPx, top, base]);
  const wetTop = useDerivedValue(() => revOutPath(1, (clock.value / PI2) * 1000, sk, P, TP, preG.value, decG.value, mixG.value, outX0, outX1, msPerPx, top, base), [clock, preG, decG, mixG, sk, P, TP, outX0, outX1, msPerPx, top, base]);
  const dryOut = useDerivedValue(() => revOutPath(2, (clock.value / PI2) * 1000, sk, P, TP, preG.value, decG.value, mixG.value, outX0, outX1, msPerPx, top, base), [clock, preG, decG, mixG, sk, P, TP, outX0, outX1, msPerPx, top, base]);
  const wetOld = useDerivedValue(() => revOutPath(3, (clock.value / PI2) * 1000, sk, P, TP, preG.value, decG.value, mixG.value, outX0, outX1, msPerPx, top, base), [clock, preG, decG, mixG, sk, P, TP, outX0, outX1, msPerPx, top, base]);
  const head = useDerivedValue(() => revOutPath(4, (clock.value / PI2) * 1000, sk, P, TP, preG.value, decG.value, mixG.value, outX0, outX1, msPerPx, top, base), [clock, preG, decG, mixG, sk, P, TP, outX0, outX1, msPerPx, top, base]);

  /** IN: the source in the same dB view. */
  const inPath = useDerivedValue(() => {
    const now = (clock.value / PI2) * 1000;
    const p = Skia.Path.Make();
    const cols = Math.max(2, Math.floor(inX1 - inX0));
    const cw = (inX1 - inX0) / cols;
    const colMs = cw * msPerPx;
    let started = false;
    for (let c = 0; c < cols; c++) {
      const xm = inX0 + (c + 0.5) * cw;
      const v = revCol(now - (xm - stageX) * msPerPx, colMs, sk, P, 0, 60, 0);
      const hgt = Math.max(0, Math.min(1, (v[0] + REV_RANGE_DB) / REV_RANGE_DB)) * (base - top);
      if (hgt > 0.5) {
        if (sk === 0) {
          p.moveTo(xm, base);
          p.lineTo(xm, base - hgt);
        } else {
          if (!started) p.moveTo(xm, base - hgt);
          else p.lineTo(xm, base - hgt);
          started = true;
        }
      } else started = false;
    }
    return p;
  }, [clock, inX0, inX1, stageX, msPerPx, sk, P, top, base]);

  // The seconds ruler under OUT (ticks every 100 ms of age, named at 0.5 s).
  const ruler = useMemo(() => {
    const p = Skia.Path.Make();
    const marks: { x: number; s: string }[] = [];
    for (let ms = 100; ms < 5000; ms += 100) {
      const x = outX0 + ms / msPerPx; // time since the trigger
      if (x > outX1) break;
      if (x < outX0) continue;
      const major = ms % 500 === 0;
      p.moveTo(x, base + 2);
      p.lineTo(x, base + (major ? 6 : 4));
      if (major && x < outX1 - 12) marks.push({ x, s: ms % 1000 === 0 ? `${ms / 1000} s` : `${(ms / 1000).toFixed(1)} s` });
    }
    // dB guides: the source peak (top) and every 30 dB below it.
    const g = Skia.Path.Make();
    for (let d = 30; d < REV_RANGE_DB; d += 30) {
      const y = top + d * pxPerDb;
      g.moveTo(outX0, y);
      g.lineTo(outX1, y);
    }
    return { p, marks, g };
  }, [stageX, msPerPx, outX0, outX1, base, top, pxPerDb]);

  const note = sk === 0 ? `CLICK · ${Math.round(60000 / P)} BPM · dB VIEW` : sk === 1 ? 'TONE BURSTS · dB VIEW' : 'STEADY NOISE · TRY CLICK';

  return (
    <FlowScene
      w={w}
      h={h}
      label={label}
      note={note}
      noteColor={DIM}
      zeroY={base}
      overlay={
        <>
      {ruler.marks.map((m) => (
          <GlassText key={m.s} x={m.x} y={base + 5} text={m.s} w={34} />
        ))}
        </>
      }
    >
      <Path path={ruler.g} color={ZERO} style="stroke" strokeWidth={0.8} opacity={0.6}>
        <DashPathEffect intervals={[2, 4]} />
      </Path>
      <Path path={ruler.p} color={DIM} style="stroke" strokeWidth={1} opacity={0.7} />
      {sk === 0 ? (
        <Path path={inPath} color={DIM} style="stroke" strokeWidth={2} strokeCap="round" opacity={0.9} />
      ) : (
        <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} strokeJoin="round" opacity={0.9} />
      )}
      <Path path={wetArea}>
        <LinearGradient start={vec(0, top)} end={vec(0, base)} colors={['rgba(255,198,77,0.42)', 'rgba(255,198,77,0.06)']} />
      </Path>
      <Path path={wetOld} color={AMBER} style="stroke" strokeWidth={1.2} opacity={0.45} />
      <FlowGlow path={wetTop} width={1.6} />
      <Path path={head} color={colors.textPrimary} style="stroke" strokeWidth={1} opacity={0.35} />
      {sk === 0 ? (
        <Path path={dryOut} color={DIM} style="stroke" strokeWidth={2} strokeCap="round" opacity={0.9} />
      ) : (
        <Path path={dryOut} color={DIM} style="stroke" strokeWidth={1.2} strokeJoin="round" opacity={0.8} />
      )}
    </FlowScene>
  );
}

// ──────────────────────────────────────────────── flanger/phaser spectrum ──
/* NEW 2026-10-16 (art grading, Flanger 7.41 / Phaser 7.46: "the hero is two
 * sine traces; the jet sweep / notch movement is only in the lower graph").
 * Both labs play NOISE (pink or white), and noise through a flanger or a
 * phaser does not look like a wobbling sine on any instrument — the effect is
 * the moving NOTCHES, and the instrument that shows them is a spectrum
 * analyser. So the hero is two analysers: IN shows the source's spectrum
 * (pink = flat on an analyser, white = rising 3 dB/octave), OUT the same
 * spectrum through the effect AS IT IS RIGHT NOW, the notches sweeping at the
 * TRUE LFO rate (0.1–5 Hz is drawable). The zero line is the source's level;
 * the dotted line on OUT is the input for comparison.
 * The ENGINE, mirrored (Effects.hpp ModEffect):
 *  • FLANGER — wet = x(t − τ) + fb·wet(t − τ), out = (1 − mix)·x + mix·wet,
 *    τ = centre + depth·0.85·centre·sin(LFO), clamped 0.05–50 ms:
 *    H(f) = (1 − m) + m·e^(−jωτ)/(1 − fb·e^(−jωτ)) — notches every 1/τ Hz.
 *  • PHASER — N first-order all-passes at fc = centre·2^(2·depth·sin(LFO))
 *    (clamped 40 Hz – 0.45·fs), the cascade's output fed back by RES one sample
 *    late: A = e^(jφ), φ = −2N·atan(tan(πf/fs)/tan(πfc/fs)) (the bilinear
 *    all-pass the engine runs), y = A·x/(1 − fb·A·e^(−jω)), out = (1 − m)·x +
 *    m·y with the lab's fixed m = 0.5.
 * Above a few kHz a flanger's notches are closer together than the screen's
 * pixels: each column then draws the true min..max of the comb across it (a
 * solid band), never a moiré of samples. */
const SPEC_F0 = 20;
const SPEC_F1 = 20000;
const SPEC_PX_PER_DB = 1.9;

/** |H| of the flanger (mode 0) or phaser (mode 1) at f, for this frame's
 *  modulated parameter `par` (τ in ms, or fc in Hz). */
function modMag(mode: number, f: number, par: number, mix: number, fb: number, stages: number): number {
  'worklet';
  let ar = 0;
  let ai = 0;
  if (mode === 0) {
    const th = (PI2 * f * par) / 1000;
    ar = Math.cos(th);
    ai = -Math.sin(th);
  } else {
    const t = Math.tan((Math.PI * Math.min(f, 23000)) / 48000) / Math.tan((Math.PI * par) / 48000);
    const phi = -2 * stages * Math.atan(t);
    // The phaser's feedback is the cascade's PREVIOUS output sample.
    const wv = (PI2 * f) / 48000;
    ar = Math.cos(phi);
    ai = Math.sin(phi);
    // denominator 1 − fb·A·e^(−jω)
    const lr = Math.cos(phi - wv);
    const li = Math.sin(phi - wv);
    const dr = 1 - fb * lr;
    const di = -fb * li;
    const den = Math.max(dr * dr + di * di, 1e-9);
    const yr = (ar * dr + ai * di) / den;
    const yi = (ai * dr - ar * di) / den;
    const hr = 1 - mix + mix * yr;
    const hi = mix * yi;
    return Math.sqrt(hr * hr + hi * hi);
  }
  const dr = 1 - fb * ar;
  const di = -fb * ai;
  const den = Math.max(dr * dr + di * di, 1e-9);
  const wr = (ar * dr + ai * di) / den;
  const wi = (ai * dr - ar * di) / den;
  const hr = 1 - mix + mix * wr;
  const hi = mix * wi;
  return Math.sqrt(hr * hr + hi * hi);
}

/** One frame of a spectrum half: kind 0 = the filled area under the trace,
 *  1 = the trace as a band (min..max per column), 2 = the plain source line
 *  (no effect: par < 0). y = y0 − dB·SPEC_PX_PER_DB, clamped to [yTop, yBot]. */
function specPath(
  kind: number,
  x0: number,
  x1: number,
  y0: number,
  yTop: number,
  yBot: number,
  white: number,
  mode: number,
  par: number,
  mix: number,
  fb: number,
  stages: number,
): SkPathT {
  'worklet';
  const p = Skia.Path.Make();
  const cols = Math.max(2, Math.floor(x1 - x0));
  const cw = (x1 - x0) / cols;
  const lr = Math.log(SPEC_F1 / SPEC_F0);
  const hiY: number[] = [];
  const loY: number[] = [];
  for (let c = 0; c < cols; c++) {
    const fA = SPEC_F0 * Math.exp((lr * c) / cols);
    const fB = SPEC_F0 * Math.exp((lr * (c + 1)) / cols);
    const fm = Math.sqrt(fA * fB);
    const tilt = white > 0.5 ? 10 * Math.log10(fm / 1000) : 0;
    let mx = 1;
    let mn = 1;
    if (par >= 0) {
      if (mode === 0 && fB - fA >= 1000 / Math.max(par, 0.01)) {
        // A whole comb period inside the column: its extremes are at the
        // in-phase and anti-phase frequencies.
        const a = Math.abs(1 - mix + mix / (1 - fb));
        const b = Math.abs(1 - mix - mix / (1 + fb));
        mx = Math.max(a, b);
        mn = Math.min(a, b);
      } else {
        mx = 0;
        mn = 1e9;
        for (let s = 0; s <= 4; s++) {
          const f = fA * Math.pow(fB / fA, s / 4);
          const m = modMag(mode, f, par, mix, fb, stages);
          if (m > mx) mx = m;
          if (m < mn) mn = m;
        }
      }
    }
    const yH = y0 - (20 * Math.log10(Math.max(mx, 1e-5)) + tilt) * SPEC_PX_PER_DB;
    const yL = y0 - (20 * Math.log10(Math.max(mn, 1e-5)) + tilt) * SPEC_PX_PER_DB;
    hiY.push(Math.max(yTop, Math.min(yBot, yH)));
    loY.push(Math.max(yTop, Math.min(yBot, yL)));
  }
  if (kind === 0) {
    p.moveTo(x0, yBot);
    for (let c = 0; c < cols; c++) p.lineTo(x0 + (c + 0.5) * cw, hiY[c]);
    p.lineTo(x1, yBot);
    p.close();
  } else if (kind === 1) {
    for (let c = 0; c < cols; c++) {
      if (c === 0) p.moveTo(x0 + 0.5 * cw, hiY[c]);
      else p.lineTo(x0 + (c + 0.5) * cw, hiY[c]);
    }
    for (let c = cols - 1; c >= 0; c--) p.lineTo(x0 + (c + 0.5) * cw, loY[c] + 0.6);
    p.close();
  } else {
    for (let c = 0; c < cols; c++) {
      if (c === 0) p.moveTo(x0 + 0.5 * cw, hiY[c]);
      else p.lineTo(x0 + (c + 0.5) * cw, hiY[c]);
    }
  }
  return p;
}

function SpectrumFlow({
  w,
  h,
  active,
  label,
  mode,
  rateHz,
  depth,
  center,
  mix,
  feedback,
  stages,
  white,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  /** 'flanger' (center = ms) or 'phaser' (center = Hz). */
  mode: 'flanger' | 'phaser';
  rateHz: number;
  depth: number;
  center: number;
  mix: number;
  feedback: number;
  stages: number;
  white: boolean;
}) {
  const stageX = w * STAGE_FRAC;
  const lfo = usePhaseClock(active, Math.min(rateHz, 10)); // the TRUE LFO rate
  const inX0 = 8;
  const inX1 = stageX - 18;
  const outX0 = stageX + 14;
  const outX1 = w - 8;
  const yTop = 24;
  const yBot = h - 20;
  const y0 = 52; // 0 dB: the source's own level
  const md = mode === 'flanger' ? 0 : 1;
  const ctrG = useGlide(center);
  const depthG = useGlide(depth);
  const mixG = useGlide(mix);
  const fbG = useGlide(feedback);
  const stG = useGlide(stages);
  const wh = white ? 1 : 0;

  // The modulated parameter this frame — exactly the engine's LFO law.
  const par = useDerivedValue(() => {
    const s = Math.sin(lfo.value);
    if (md === 0) return Math.max(0.05, Math.min(50, ctrG.value + depthG.value * 0.85 * ctrG.value * s));
    return Math.max(40, Math.min(21600, ctrG.value * Math.pow(2, 2 * depthG.value * s)));
  }, [lfo, ctrG, depthG, md]);

  const inArea = useMemo(() => specPath(0, inX0, inX1, y0, yTop, yBot, wh, md, -1, 0, 0, 0), [inX0, inX1, wh, md, yBot]);
  const inLine = useMemo(() => specPath(2, inX0, inX1, y0, yTop, yBot, wh, md, -1, 0, 0, 0), [inX0, inX1, wh, md, yBot]);
  const refLine = useMemo(() => specPath(2, outX0, outX1, y0, yTop, yBot, wh, md, -1, 0, 0, 0), [outX0, outX1, wh, md, yBot]);
  const outArea = useDerivedValue(
    () => specPath(0, outX0, outX1, y0, yTop, yBot, wh, md, par.value, mixG.value, fbG.value, stG.value),
    [par, mixG, fbG, stG, outX0, outX1, yBot, wh, md],
  );
  const outBand = useDerivedValue(
    () => specPath(1, outX0, outX1, y0, yTop, yBot, wh, md, par.value, mixG.value, fbG.value, stG.value),
    [par, mixG, fbG, stG, outX0, outX1, yBot, wh, md],
  );

  // Frequency ticks (100 Hz · 1 kHz · 10 kHz) under each half.
  const ticks = useMemo(() => {
    const p = Skia.Path.Make();
    const marks: { x: number; t: string }[] = [];
    const lr = Math.log(SPEC_F1 / SPEC_F0);
    for (const [a, b] of [
      [inX0, inX1],
      [outX0, outX1],
    ]) {
      for (const [f, t] of [
        [100, '100'],
        [1000, '1k'],
        [10000, '10k'],
      ] as const) {
        const x = a + ((b - a) * Math.log(f / SPEC_F0)) / lr;
        p.moveTo(x, yBot + 1);
        p.lineTo(x, yBot + 4);
        marks.push({ x, t });
      }
    }
    return { p, marks };
  }, [inX0, inX1, outX0, outX1, yBot]);

  return (
    <FlowScene
      w={w}
      h={h}
      label={label}
      zeroY={null}
      overlay={
        <>
      {ticks.marks.map((m, i) => (
          <GlassText key={i} x={m.x} y={yBot + 4} text={m.t} w={28} />
        ))}
        <GlassText x={52} y={6} align="left" w={90} text={white ? 'WHITE NOISE' : 'PINK NOISE'} />
        <GlassText x={outX0} y={6} align="left" w={90} text="SPECTRUM (dB)" />
        </>
      }
    >
      <SkLine p1={vec(inX0, y0)} p2={vec(inX1, y0)} color={ZERO} strokeWidth={1} />
      <SkLine p1={vec(outX0, y0)} p2={vec(outX1, y0)} color={ZERO} strokeWidth={1} />
      <SkLine p1={vec(inX0, yBot)} p2={vec(inX1, yBot)} color={FRAME} strokeWidth={1} />
      <SkLine p1={vec(outX0, yBot)} p2={vec(outX1, yBot)} color={FRAME} strokeWidth={1} />
      <Path path={ticks.p} color={DIM} style="stroke" strokeWidth={1} opacity={0.7} />
      <Path path={inArea}>
        <LinearGradient start={vec(0, yTop)} end={vec(0, yBot)} colors={['rgba(154,156,168,0.32)', 'rgba(154,156,168,0.04)']} />
      </Path>
      <Path path={inLine} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.9} />
      <Path path={outArea}>
        <LinearGradient start={vec(0, yTop)} end={vec(0, yBot)} colors={['rgba(255,198,77,0.34)', 'rgba(255,198,77,0.04)']} />
      </Path>
      <Path path={outBand} color={AMBER} opacity={0.95} />
      <FlowGlow path={outBand} width={1.2} />
      <Path path={refLine} color={DIM} style="stroke" strokeWidth={1} opacity={0.75}>
        <DashPathEffect intervals={[2, 3]} />
      </Path>
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
// A clean sine travels in; the out wave is the SAME cycle through the DSP's
// chain: x·drive → distShape → DC block → mix with the dry → out.
//
// Round 3 (lab-art grading 2026-10-16: "the hard-clipped square is drawn
// TALLER than the input sine — implies clipping raises peak level"): the old
// flow normalised the shaped wave to its own peak (shape-only). Now both
// sides share ONE true level scale — the dashed lines are the ±0 dBFS
// ceiling the shaper cannot pass, the input is the lab's real −20 dBFS sine,
// and a dashed ghost shows the DRIVEN wave before the ceiling, so the learner
// sees exactly what drive pushes into the clipper and what the clipper cuts.
const DIST_TAB_N = 96;
/** The lab sine's peak (fxLabConfigs SOURCE_PEAK_DB = −20 dBFS). */
export const DIST_IN_PEAK = Math.pow(10, -20 / 20);
/** Where the ±0 dBFS ceiling sits: this far in from the panel's top/bottom,
 *  clear of the IN/OUT chips and the bottom keys. */
const DIST_CEIL_INSET = 22;
const CEIL_RED = '#ff7a6b';

/** One cycle of the shaper's output in full-scale units, DC removed (the DSP's
 *  ~10 Hz DC blocker in steady state) — exported for the test. */
export function distCycle(type: 'hard' | 'soft' | 'tube', driveDb: number, n = DIST_TAB_N): number[] {
  const drive = Math.pow(10, driveDb / 20);
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(distShape(DIST_IN_PEAK * drive * Math.sin((PI2 * i) / n), type));
  let mean = 0;
  for (let i = 0; i < n; i++) mean += out[i] / n;
  return out.map((y) => y - mean);
}

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
  const driveG = useGlide(Math.pow(10, driveDb / 20));
  const kc = (PI2 * 3.2) / w;
  const A = h / 2 - DIST_CEIL_INSET; // px per full scale (the ceiling)

  const table = useMemo(() => distCycle(type, driveDb), [type, driveDb]);

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
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = 6 + ((stageX - 16) * i) / N;
      const y = h / 2 - A * DIST_IN_PEAK * Math.sin(kc * x - pc);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, stageX, h, kc, A]);

  // The driven wave BEFORE the shaper (input × drive), held inside the panel.
  const drivenPath = useDerivedValue(() => {
    const pc = carrier.value;
    const g = DIST_IN_PEAK * driveG.value;
    const p = Skia.Path.Make();
    const N = 96;
    const lim = h / 2 - 3;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const d = A * g * Math.sin(kc * x - pc);
      const y = h / 2 - (d > lim ? lim : d < -lim ? -lim : d);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, driveG, stageX, w, h, kc, A]);

  const outPath = useDerivedValue(() => {
    const pc = carrier.value;
    const b = blend.value;
    const prev = prevTab.value;
    const cur = curTab.value;
    const mixV = mixG.value;
    const p = Skia.Path.Make();
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const x = stageX + 10 + ((w - 6 - (stageX + 10)) * i) / N;
      const u = (kc * x - pc) / PI2;
      const shaped = tabAt(prev, u) * (1 - b) + tabAt(cur, u) * b;
      const y = h / 2 - A * (mixV * shaped + (1 - mixV) * DIST_IN_PEAK * Math.sin(kc * x - pc));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [carrier, blend, prevTab, curTab, mixG, stageX, w, h, kc, A]);

  const ceil = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(4, h / 2 - A);
    p.lineTo(w - 4, h / 2 - A);
    p.moveTo(4, h / 2 + A);
    p.lineTo(w - 4, h / 2 + A);
    return p;
  }, [w, h, A]);

  return (
    <FlowScene
      w={w}
      h={h}
      label={label}
      note="IN = −20 dBFS sine"
      noteColor={DIM}
      legend={[
        { label: 'DRIVEN (before clip)', color: DIM },
        { label: '0 dBFS', color: CEIL_RED },
      ]}
    >
      <Path path={ceil} color={CEIL_RED} style="stroke" strokeWidth={1} opacity={0.6}>
        <DashPathEffect intervals={[5, 4]} />
      </Path>
      <Path path={drivenPath} color={DIM} style="stroke" strokeWidth={1} opacity={0.55}>
        <DashPathEffect intervals={[3, 3]} />
      </Path>
      <Path path={inPath} color={DIM} style="stroke" strokeWidth={1.4} opacity={0.9} />
      <FlowGlow path={outPath} width={2} gradH={h} gradY={[h / 2 - A, h / 2 + A]} />
    </FlowScene>
  );
}

// ─────────────────────────────────────────────────── phase/stereo flow ──
/** Trace amplitude (× panel height). The loudest output — WIDTH 200 % on a
 *  hard pan, |M + 2S|·√2 ≈ 1.9 — still fits inside the panel (0.46 h), so
 *  the drawing never clips what the DSP does not clip. */
const STEREO_A = 0.24;
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
  monoIn = false,
}: {
  w: number;
  h: number;
  active: boolean;
  label: string;
  flavor: 'phase' | 'width';
  /** Width lab's MONO comparison source (engine 10): L = R going in. */
  monoIn?: boolean;
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
  // The SAME stereo test tone the well's Lissajous draws (fxViz).
  // The width lab's MONO comparison source (engine 10) is L = R as well —
  // nothing to widen, drawn as it sounds.
  const stereoIn = flavor === 'width' && !monoIn;
  const d0 = stereoIn ? STEREO_TEST_LR_RAD : 0;
  const ampK = flavor === 'width' ? STEREO_A : 0.3;

  const inL = useDerivedValue(() => {
    const pc = carrier.value;
    const p = Skia.Path.Make();
    const A = h * ampK;
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
    const A = h * ampK;
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
    // Constant-power pan, exactly processStereo's law (×√2 so centre = unity).
    const gL = Math.cos(((panG.value + 1) * Math.PI) / 4) * Math.SQRT2;
    const gR = Math.sin(((panG.value + 1) * Math.PI) / 4) * Math.SQRT2;
    const p = Skia.Path.Make();
    const A = h * ampK;
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
    // Constant-power pan, exactly processStereo's law (×√2 so centre = unity).
    const gL = Math.cos(((panG.value + 1) * Math.PI) / 4) * Math.SQRT2;
    const gR = Math.sin(((panG.value + 1) * Math.PI) / 4) * Math.SQRT2;
    const p = Skia.Path.Make();
    const A = h * ampK;
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
    <FlowScene
      w={w}
      h={h}
      label={label}
      note={stereoIn ? 'STEREO TEST TONE · L ≠ R' : 'SAME TONE IN L AND R'}
      noteColor={colors.textSub}
      legend={[{ label: 'L', color: AMBER }, { label: 'R', color: BLUE }]}
    >
      <Path path={inR} color={BLUE} style="stroke" strokeWidth={1.2} opacity={0.4} />
      <Path path={inL} color={flavor === 'width' ? AMBER : DIM} style="stroke" strokeWidth={1.4} opacity={flavor === 'width' ? 0.5 : 0.85} />
      <FlowGlow path={outR} color={BLUE} width={1.8} opacity={0.9} />
      <FlowGlow path={outL} width={1.8} />
      {/* Phase lab: L = R until the stage acts, so the R trace would hide
          under L. A thin R line drawn on TOP keeps both channels visible —
          one line with a blue core when they agree, two lines when Ø or the
          delay pulls R away (art grading 2026-10-16). */}
      {!stereoIn ? <Path path={outR} color={BLUE} style="stroke" strokeWidth={1.1} opacity={0.95} /> : null}
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
        <EchoFlow
          w={w}
          h={h}
          active={active}
          label={label}
          timeMs={model.timeMs}
          feedback={model.feedback}
          mix={model.mix}
          pingpong={model.pingpong}
          dampHz={model.dampHz}
          src={model.src}
        />
      );
    case 'reverb':
      return (
        <ReverbFlow
          w={w}
          h={h}
          active={active}
          label={label}
          rt60={model.rt60}
          preDelayMs={model.preDelayMs}
          mix={model.mix}
          dampHz={model.dampHz}
          src={model.src}
        />
      );
    case 'mod':
      if (model.flavor === 'flanger') {
        return (
          <SpectrumFlow
            w={w}
            h={h}
            active={active}
            label={label}
            mode="flanger"
            rateHz={model.rateHz}
            depth={model.depth}
            center={model.centerMs}
            mix={model.mix}
            feedback={model.feedback}
            stages={0}
            white={model.spectrum === 'white'}
          />
        );
      }
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
        <SpectrumFlow
          w={w}
          h={h}
          active={active}
          label={label}
          mode="phaser"
          rateHz={model.rateHz}
          depth={model.depth}
          center={model.centerHz}
          mix={0.5}
          feedback={model.feedback}
          stages={model.stages}
          white={model.spectrum === 'white'}
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
          monoIn={model.monoIn}
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
  // GlassText: rulers, axis ticks, small names over the canvas (size × ts).
  tag: { position: 'absolute', fontFamily: fonts.oswaldMedium },
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
  legend: { position: 'absolute', flexDirection: 'row', backgroundColor: 'rgba(12,12,15,.72)' },
  legendTxt: { fontFamily: fonts.oswaldSemiBold },
  // The overlay key (EQ curve) — green like the stage it describes.
  note: {
    position: 'absolute',
    fontFamily: fonts.oswaldMedium,
    color: STAGE_GREEN,
    opacity: 0.9,
  },
  // The EQ strip's keys sit on a dark chip so the curve can pass under them
  // (padding and radius are set inline × ts, like every point size here).
  noteChip: { backgroundColor: 'rgba(12,12,15,.78)', overflow: 'hidden' },
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
