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
 *
 * VISUAL STANDARDS (owner ruling, docs/APE_VISUAL_STANDARDS_2026_07_29.md —
 * retrofit pass 2026-07-29): physical objects (the speaker cone, the ear, the
 * mic, the human scale figure) are drawn as recognizable illustrations —
 * layered gradient-filled paths, light from the upper-left, soft glows,
 * vignette scene depth. Abstract data (pressure traces, spectra, the spiral,
 * the equal-loudness curve) stays geometric but styled: gradient underfills,
 * glow strokes, brighter reference lines, mono-font tick labels — never
 * hairline-on-black. ALL clock code (useVizClock/usePhaseClock and the
 * 72a1fa2 phase-continuity rework) and ALL physics/teaching math (cos(ωt−kx)
 * alignment, exact sums at shared unit scale, true-λ tracking, spiral
 * geometry, phase-locked harmonics) are IDENTICAL to the pre-retrofit file —
 * this is a restyle of the DRAWING only.
 */
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line as SkLine,
  LinearGradient,
  Path,
  RadialGradient,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, WAVE_LEVEL_STOPS } from '../../../features/tools/levelColor';

// House palette for the model views.
const PARTICLE = '#cfd2d8';
const WAVE = colors.amber;
// MIDI amplitude ramp (loudness standard) as Skia gradient stops — blue at the
// zero line → red at ±full scale. Applied to the pressure waveform's level.
const MIDI_STOP_COLORS = WAVE_LEVEL_STOPS.map((s) => s.color);
const MIDI_STOP_POS = WAVE_LEVEL_STOPS.map((s) => s.offset);
// MONOTONIC MIDI level scale for a vertical volume bar — TOP = loud (red),
// BOTTOM = quiet (blue).
const MIDI_VSCALE_COLORS = [1, 0.75, 0.5, 0.25, 0].map(levelColor);
const MIDI_VSCALE_POS = [0, 0.25, 0.5, 0.75, 1];
const CONE = '#8a8c94';
const ACCENT_GREEN = '#37e05f';
const ACCENT_BLUE = '#6fa8ff';
const GRID = '#3a3b46';
const GHOST = '#2e2f38';
/** Brighter zero/reference line (house idiom — micspeaker ResponseCurveView). */
const ZERO_REF = '#4b4e58';
const AXIS_TEXT = '#9a9ca8';
const BG = '#0c0c0f';
// Illustration tones (light source: upper-left — house scene convention).
const METAL_HI = '#c6cad4';
const METAL_MID = '#7c7f89';
const METAL_LO = '#3a3c44';
const CONE_HI = '#7b7f8a';
const CONE_MID = '#565962';
const CONE_LO = '#2f3037';
// Skin tones for the illustrated ear (micspeaker hand palette).
const SKIN_HI = '#8a6f5a';
const SKIN_MID = '#5d4a3c';
const SKIN_LO = '#2e2620';
// Compression/rarefaction tint bands (warm squeeze / cool stretch).
const WARM_BAND = '#ff9a5e';
const COOL_BAND = '#5e8fff';

type SkPathT = ReturnType<typeof Skia.Path.Make>;

/** Hex → rgba (copied from micspeaker/viz.tsx — house helper). */
function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Glow + crisp double-stroke for a styled curve.
 *  (Copied verbatim from micspeaker/viz.tsx — the house GlowStroke idiom.) */
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

/** Subtle edge vignette so scenes don't float on flat black. Render LAST on
 *  scene canvases, never over pure data plots.
 *  (Copied from micspeaker/viz.tsx — house scene-depth idiom.) */
function Vignette({ w, h }: { w: number; h: number }) {
  const rect = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, 0, w, h));
    return p;
  }, [w, h]);
  return (
    <Path path={rect}>
      <RadialGradient
        c={vec(w / 2, h / 2)}
        r={Math.max(w, h) * 0.72}
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.30)']}
        positions={[0, 0.6, 1]}
      />
    </Path>
  );
}

/** Shared absolute-position style for mono axis/tick labels over a canvas
 *  (micspeaker RNText-overlay idiom — Skia draws the data, RN draws the type). */
const tickText = {
  position: 'absolute' as const,
  fontFamily: fonts.mono,
  fontSize: 8.5,
  color: AXIS_TEXT,
};

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

/** A PHASE clock (radians) for views whose visual rate CHANGES while mounted
 *  (sliders/drags driving visHz). Computing phase as ω·t with the absolute
 *  clock would jump by t·Δω on every rate change — after a minute on-screen a
 *  one-octave drag would spray dozens of phantom revolutions. Integrating
 *  φ += 2π·rate·dt instead keeps phase CONTINUOUS through any rate change:
 *  the motion simply speeds up or slows down, which is the whole lesson.
 *  The rate rides a SharedValue (updated via effect) so the frame worklet
 *  always reads the latest value — no reliance on callback refresh. */
export function usePhaseClock(running: boolean, visHz: number): SharedValue<number> {
  const phase = useSharedValue(0);
  const rate = useSharedValue(visHz);
  useEffect(() => {
    rate.value = visHz;
  }, [visHz, rate]);
  const cb = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame != null) {
      phase.value += 2 * Math.PI * rate.value * (Math.min(info.timeSincePreviousFrame, 64) / 1000);
    }
  }, false);
  useEffect(() => {
    cb.setActive(running);
  }, [running, cb]);
  return phase;
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

// SPARKLE-TRACKED molecules (owner 2026-08-10 — replaces the coloured tracers):
// 19 candidate home positions banded left→right across the field. At any
// moment exactly TWO of them wear a subtle white glint — a thin four-point
// specular star breathing around the particle while it oscillates IN PLACE.
// Every ~2 s ONE of the two hands off to a fresh location (staggered; each
// highlight lives ~4 s), so the viewer's eye keeps landing on a new molecule
// and the lesson repeats: each particle only moves back and forth — nothing
// crosses the screen. Monochrome and restrained: a specular highlight, not an
// ornament.
const SPARKLE_N = 19;
const SPARKLE_LIFE = 4; // seconds per highlight; the two slots stagger by 2 s

/** The 19 deterministic homes — one per horizontal band, jittered, so they
 *  cover the display left→right without clustering. */
function sparkleHomes(usableW: number, topPad: number, usableH: number): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < SPARKLE_N; i++) {
    xs.push(((i + 0.15 + 0.7 * hashJs(i * 3.31 + 1.7)) / SPARKLE_N) * usableW);
    ys.push(topPad + hashJs(i * 7.73 + 9.1) * usableH);
  }
  return { xs, ys };
}

/** Compound glint (worklet) — a specular star with real presence (owner
 *  2026-08-10: the single thin star was too easy to miss): a 4-point main
 *  star, a smaller cross rotated 45° (the classic 8-point camera-star look),
 *  and a hot core knot. Still monochrome and professional — just brighter. */
function addGlint(p: ReturnType<typeof Skia.Path.Make>, x: number, y: number, R: number, rot: number): void {
  'worklet';
  for (let arm = 0; arm < 2; arm++) {
    const AR = arm === 0 ? R : R * 0.55; // secondary cross at 55% size
    const off = rot + arm * (Math.PI / 4);
    const ir = AR * 0.16;
    for (let k = 0; k < 8; k++) {
      const a = off + (k * Math.PI) / 4;
      const rad = k % 2 === 0 ? AR : ir;
      const vx = x + rad * Math.cos(a);
      const vy = y + rad * Math.sin(a);
      if (k === 0) p.moveTo(vx, vy);
      else p.lineTo(vx, vy);
    }
    p.close();
  }
  p.addCircle(x, y, R * 0.2); // hot core knot
}

export function AirParticlesView({
  clock,
  width,
  height = 116,
  visHz,
  amp,
  mode = 'wave',
  showEar = false,
  showZones = true,
  lambdaPx,
  phasePx = 0,
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
  /** Show the warm/cool compression-rarefaction pressure colour bands (owner
   *  2026-08-05: M1–M4 can toggle these off). */
  showZones?: boolean;
  /** Spatial phase offset (px) added to x in cos(ωt − k(x + phasePx)) so this
   *  view aligns with a co-drawn graph whose wave originates elsewhere on the
   *  shared screen (owner 2026-08-05: wave born at the speaker). */
  phasePx?: number;
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
  // Reserve a little clear zone on the far RIGHT for a LARGER ear (owner
  // 2026-08-05) — like the speaker's own space on the left. Only when showEar.
  const earW = showEar ? 50 : 0;
  const earScale = 1.55;

  // Rest grid + per-particle jitter (deterministic — stable across renders).
  // Particles that would fall in the ear zone are dropped so the ear reads
  // clearly (the wave math/λ is unchanged — alignment is preserved).
  const rest = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const jx = (hashJs(r * COLS + c) - 0.5) * (w / COLS) * 0.55;
        const jy = (hashJs(r * COLS + c + 999) - 0.5) * (h / ROWS) * 0.55;
        const px = ((c + 0.5) / COLS) * w + jx;
        if (px > w - earW) continue; // leave the ear zone clear
        pts.push({
          x: px,
          y: ((r + 0.5) / ROWS) * (h - 8) + 4 + jy,
        });
      }
    }
    return pts;
  }, [w, h, earW]);
  // Flat arrays capture cleanly into the worklet.
  const xs = useMemo(() => rest.map((p) => p.x), [rest]);
  const ys = useMemo(() => rest.map((p) => p.y), [rest]);

  const lambda = lambdaPx && lambdaPx > 8 ? lambdaPx : w / 2.2; // ~2 wavelengths by default
  const dispMax = (w / 2.2) / 7; // peak displacement — keyed to the DEFAULT scale so
  // particles never overlap into a solid band even when lambda tightens.

  // Sparkle-tracker homes: 19 spots across the field (clear of the ear zone).
  const sparkleXY = useMemo(() => sparkleHomes(w - earW, 8, h - 16), [w, earW, h]);
  const sxs = sparkleXY.xs;
  const sys = sparkleXY.ys;

  // TWO sparkling molecules at a time, staggered hand-offs every 2 s. Each
  // follows the SAME displacement law as the field — the glint just makes one
  // particle followable, so its back-and-forth (never across) reads plainly.
  const sparkles = useDerivedValue(() => {
    const t = clock.value;
    const p = Skia.Path.Make();
    const k = (2 * Math.PI) / lambda;
    const om = 2 * Math.PI * visHz;
    const e0 = Math.floor(t / SPARKLE_LIFE);
    for (let s = 0; s < 2; s++) {
      const ts = t + s * (SPARKLE_LIFE / 2);
      const e = Math.floor(ts / SPARKLE_LIFE);
      const u = ts - e * SPARKLE_LIFE; // 0..LIFE within this slot's tenure
      let idx = Math.floor(hash(e * 17.31 + s * 3.77) * SPARKLE_N) % SPARKLE_N;
      if (s === 1) {
        const idx0 = Math.floor(hash(e0 * 17.31) * SPARKLE_N) % SPARKLE_N;
        if (idx === idx0) idx = (idx + 7) % SPARKLE_N;
      }
      const fade = Math.min(1, u / 0.45, (SPARKLE_LIFE - u) / 0.45);
      if (fade <= 0.02) continue;
      let dx = 0;
      if (mode === 'wave') {
        dx = amp * dispMax * Math.sin(om * t - k * (sxs[idx] + phasePx));
      } else if (mode === 'noise') {
        const tq = Math.floor(t * 22);
        dx = amp * dispMax * 0.9 * (hash(idx * 127.1 + tq * 311.7) - 0.5) * 2;
      }
      const x = sxs[idx] + dx;
      const y = sys[idx];
      // Dual-frequency shimmer (owner 2026-08-10: more visible, more sparkle):
      // a slow breath plus a fast flicker, so the glint visibly twinkles.
      // Size carries the fade — grows in, shrinks out on each hand-off.
      const R = Math.max(
        0.5,
        (7 + 2.2 * Math.sin(t * 6 + idx * 2.1) + 0.9 * Math.sin(t * 13 + idx * 1.7)) * fade,
      );
      addGlint(p, x, y, R, t * 1.2 + idx);
      p.addCircle(x, y, 2.2 + 1.0 * fade); // the molecule itself, larger + bright
    }
    return p;
  }, [clock, sxs, sys, visHz, amp, mode, lambda, dispMax, phasePx]);

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
        dx = amp * dispMax * Math.sin(om * t - k * (xs[i] + phasePx));
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
  }, [clock, xs, ys, visHz, amp, mode, lambda, dispMax, phasePx]);

  // Compression/rarefaction ZONE SHADING — pressure p ∝ cos(ωt − kx), the SAME
  // law the co-drawn PressureGraphView plots, so the warm bands sit exactly
  // where the particles bunch (and directly above the graph's peaks). Each
  // band is one thick blurred vertical stroke; only positions move per frame.
  const bandW = lambda * 0.36;
  const warmBands = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (mode === 'wave') {
      const t = clock.value;
      const k = (2 * Math.PI) / lambda;
      const om = 2 * Math.PI * visHz;
      // Compression centres: cos(ωt − k(x+φ)) = 1 → x ≡ ωt/k − φ (mod λ).
      const x0 = (((((om * t) / k - phasePx) % lambda) + lambda) % lambda);
      for (let x = x0 - lambda; x < w + lambda; x += lambda) {
        p.moveTo(x, 3);
        p.lineTo(x, h - 3);
      }
    }
    return p;
  }, [clock, visHz, mode, lambda, w, h, phasePx]);
  const coolBands = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (mode === 'wave') {
      const t = clock.value;
      const k = (2 * Math.PI) / lambda;
      const om = 2 * Math.PI * visHz;
      // Rarefaction centres: half a wavelength from the compressions.
      const x0 = (((((om * t) / k - phasePx + lambda / 2) % lambda) + lambda) % lambda);
      for (let x = x0 - lambda; x < w + lambda; x += lambda) {
        p.moveTo(x, 3);
        p.lineTo(x, h - 3);
      }
    }
    return p;
  }, [clock, visHz, mode, lambda, w, h, phasePx]);

  // The EAR — a recognizable illustrated ear at the receiving end (standards
  // rule 1: no circle standing in for a body part). Static geometry: organic
  // helix outline, inner ridge + tragus, skin gradient lit from upper-left.
  const ear = useMemo(() => {
    const cx = w - earW / 2; // centred in the reserved ear zone
    const cy = h / 2;
    const outline = Skia.Path.Make();
    outline.moveTo(cx - 4, cy - 13);
    outline.cubicTo(cx + 5, cy - 16, cx + 11, cy - 9, cx + 10, cy - 1);
    outline.cubicTo(cx + 9.4, cy + 6, cx + 5, cy + 12, cx - 1, cy + 14.5);
    outline.cubicTo(cx - 5, cy + 16, cx - 8.5, cy + 13, cx - 7.5, cy + 9.5);
    outline.cubicTo(cx - 7, cy + 7.5, cx - 6.4, cy + 5.5, cx - 6.4, cy + 3);
    outline.cubicTo(cx - 6.4, cy - 3, cx - 8.5, cy - 6, cx - 8, cy - 9);
    outline.cubicTo(cx - 7.6, cy - 11.6, cx - 6.4, cy - 12.6, cx - 4, cy - 13);
    outline.close();
    const ridges = Skia.Path.Make();
    // Antihelix ridge just inside the rim.
    ridges.moveTo(cx - 3, cy - 9.5);
    ridges.cubicTo(cx + 3, cy - 11.5, cx + 7, cy - 6.5, cx + 6.2, cy - 0.5);
    ridges.cubicTo(cx + 5.6, cy + 4, cx + 3, cy + 8, cx - 0.5, cy + 10);
    // Tragus flap over the canal.
    ridges.moveTo(cx - 4.6, cy - 2);
    ridges.quadTo(cx - 1.6, cy - 0.5, cx - 2.2, cy + 3.5);
    return { outline, ridges, cx, cy };
  }, [w, h, earW]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Zone shading BEHIND the particles: warm squeeze / cool stretch.
          Toggleable (owner 2026-08-05). */}
      {showZones ? (
        <>
          <Path path={warmBands} color={WARM_BAND} style="stroke" strokeWidth={bandW} opacity={0.05 + 0.1 * amp}>
            <BlurMask blur={9} style="normal" />
          </Path>
          <Path path={coolBands} color={COOL_BAND} style="stroke" strokeWidth={bandW} opacity={0.04 + 0.08 * amp}>
            <BlurMask blur={9} style="normal" />
          </Path>
        </>
      ) : null}
      {/* Particles: soft halo layer + crisp cores (tube-lab electron idiom). */}
      <Path path={path} color={PARTICLE} opacity={0.35}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color={PARTICLE} />
      {/* SPARKLE-TRACKED molecules — two glinting at a time, handing off every
          ~2 s, each only ever swinging back and forth in place. Three layers
          (owner 2026-08-10, more visible): wide bloom → tight glow → crisp star. */}
      <Path path={sparkles} color="#ffffff" opacity={0.32}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={sparkles} color="#ffffff" opacity={0.45}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={sparkles} color="#f6f8fc" opacity={0.95} />
      {showEar ? (
        // Scaled up around its centre (owner 2026-08-05) so the ear reads clearly.
        <Group transform={[{ translateX: ear.cx }, { translateY: ear.cy }, { scale: earScale }, { translateX: -ear.cx }, { translateY: -ear.cy }]}>
          {/* Receiving glow — the ear is where the wave lands. */}
          <Circle cx={ear.cx} cy={ear.cy} r={16} color={ACCENT_GREEN} opacity={0.14}>
            <BlurMask blur={12} style="normal" />
          </Circle>
          <Path path={ear.outline}>
            <LinearGradient
              start={vec(ear.cx - 9, ear.cy - 14)}
              end={vec(ear.cx + 11, ear.cy + 15)}
              colors={[SKIN_HI, SKIN_MID, SKIN_LO]}
              positions={[0, 0.5, 1]}
            />
          </Path>
          <Path path={ear.outline} color={SKIN_LO} style="stroke" strokeWidth={1.2} opacity={0.9} />
          <Path path={ear.ridges} color="#1c130d" style="stroke" strokeWidth={1.4} strokeCap="round" opacity={0.55} />
        </Group>
      ) : null}
      <Vignette w={w} h={h} />
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
  const cy = h / 2;
  const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  // Smaller excursion + a bigger rim margin (owner 2026-08-05) so the cone and
  // its surround clearly vibrate WITHIN the basket, never through it.
  const excMax = clampN(w * 0.055, 4, 8) * 0.81; // px excursion at amp = 1 (−19% travel, owner 2026-08-05)

  // Side CUTAWAY firing RIGHT, proportioned from the owner's reference images
  // (2026-08-05): steel back plate · magnet ring (warm, as in the cutaways) ·
  // front plate → LONG voice-coil former with tight copper turns riding the
  // gap → corrugated SPIDER suspension former→basket → SHALLOW wide cone +
  // dust cap → surround ROLL bridging the moving cone to the fixed basket rim.
  // Deliberately THIN overall so it can sit beside the air animation.
  const magW = clampN(w * 0.22, 14, 26);
  const gapX = 3 + magW - 2; // the former slides over the pole piece here
  const coilLen = clampN(w * 0.17, 12, 19); // long former, reference-like
  const formerFront = gapX + coilLen;
  const apexX = formerFront - 1; // cone apex meets the former's front end
  const coneDepth = clampN(w * 0.3, 20, 40); // SHALLOW — real drivers have little depth
  const mouthX = apexX + coneDepth;
  // Fixed basket rim sits BEYOND the cone's full forward excursion + a margin
  // (owner 2026-08-05) so the basket cage is always outside the moving cone and
  // its elastic surround band — they never collide at peak travel.
  const rimX = mouthX + excMax + clampN(w * 0.04, 3, 5); // small gap → a SHORT, thin surround
  const apexHalf = 5;
  const mh = h * 0.42; // TALL mouth — the wide flare of the reference cone
  const gapH = clampN(h * 0.13, 10, 14);
  const poleHalf = gapH * 0.26; // inner STATIC pole half-height
  const coilOuter = gapH * 0.56; // voice-coil former outer half-height (OUTSIDE the pole)
  // The basket FRAME sits OUTSIDE the cone mouth (owner 2026-08-05): the cone and
  // its elastic surround must never extend past this — the frame contains them.
  const frameHalf = mh + clampN(h * 0.06, 4, 8);
  // The static pole's right end — extended toward the coil front (owner
  // 2026-08-05) but still short enough that a GAP opens past it when the coil
  // slides fully out.
  const poleRight = formerFront - excMax * 0.5;

  // THE MOTION — cone excursion (wave: amp·excMax·sin ωt; noise: hash jitter).
  // The illustrated coil/cone/dust-cap assembly rides ONE translateX per frame.
  const coneShift = useDerivedValue(() => {
    const t = clock.value;
    let off = 0;
    if (mode === 'wave') off = amp * excMax * Math.sin(2 * Math.PI * visHz * t);
    else if (mode === 'noise') {
      const tq = Math.floor(t * 22);
      off = amp * excMax * 0.8 * (hash(tq * 97.7) - 0.5) * 2;
    }
    return [{ translateX: off }];
  }, [clock, visHz, amp, mode]);

  // Motor assembly + basket struts (STATIC — only the cone assembly translates).
  const motor = useMemo(() => {
    const backW = magW * 0.3;
    const ringW = magW * 0.42;
    const poleW = magW * 0.28;
    // Basket cage arms out to the FRONT frame edge (OUTSIDE the cone mouth).
    const struts = Skia.Path.Make();
    for (const sgn of [-1, 1]) {
      struts.moveTo(3 + magW, cy + sgn * h * 0.16);
      struts.lineTo(rimX, cy + sgn * frameHalf);
    }
    return { backW, ringW, poleW, struts };
  }, [magW, cy, h, rimX, frameHalf]);

  // Moving assembly (rest coordinates): shallow CONCAVE cone flare, long
  // voice-coil former, tight vertical copper turns (each winding seen edge-on,
  // as in the reference cutaway), top rim light.
  const coneParts = useMemo(() => {
    const midX = apexX + coneDepth * 0.5;
    // Concave flare: control points pulled toward the axis so the profile
    // curves like a real cone, not a straight trapezoid.
    const ctrl = apexHalf + (mh - apexHalf) * 0.32;
    const cone = Skia.Path.Make();
    cone.moveTo(apexX, cy - apexHalf);
    cone.quadTo(midX, cy - ctrl, mouthX, cy - mh);
    cone.lineTo(mouthX, cy + mh);
    cone.quadTo(midX, cy + ctrl, apexX, cy + apexHalf);
    cone.close();
    const topEdge = Skia.Path.Make();
    topEdge.moveTo(apexX, cy - apexHalf);
    topEdge.quadTo(midX, cy - ctrl, mouthX, cy - mh);
    // Voice-coil former = the bobbin walls that ride OUTSIDE the centre pole:
    // a TOP wall and a BOTTOM wall, with the static pole showing between them
    // (owner 2026-08-05 — the coil wraps the pole, it is not under it).
    const former = Skia.Path.Make();
    former.addRRect(Skia.RRectXY(Skia.XYWHRect(gapX, cy - coilOuter, coilLen, coilOuter - poleHalf), 1.2, 1.2));
    former.addRRect(Skia.RRectXY(Skia.XYWHRect(gapX, cy + poleHalf, coilLen, coilOuter - poleHalf), 1.2, 1.2));
    // Copper turns — tight vertical striations on BOTH walls (edge-on).
    const windings = Skia.Path.Make();
    for (let x = gapX + 2; x <= gapX + coilLen - 2; x += 2.1) {
      windings.moveTo(x, cy - coilOuter + 1);
      windings.lineTo(x, cy - poleHalf - 1);
      windings.moveTo(x, cy + poleHalf + 1);
      windings.lineTo(x, cy + coilOuter - 1);
    }
    return { cone, topEdge, former, windings };
  }, [apexX, coneDepth, mouthX, cy, mh, gapX, coilLen, apexHalf, coilOuter, poleHalf]);

  // CORRUGATED SPIDER (reference: the yellow accordion suspension) — links the
  // MOVING former to the FIXED basket, top and bottom. Redrawn per frame so its
  // folds visibly flex with the excursion.
  const spider = useDerivedValue(() => {
    const t = clock.value;
    let off = 0;
    if (mode === 'wave') off = amp * excMax * Math.sin(2 * Math.PI * visHz * t);
    else if (mode === 'noise') {
      const tq = Math.floor(t * 22);
      off = amp * excMax * 0.8 * (hash(tq * 97.7) - 0.5) * 2;
    }
    const p = Skia.Path.Make();
    const N = 4; // corrugation folds
    for (const sgn of [-1, 1]) {
      const x0 = formerFront + off - 3; // moving inner edge
      const y0 = cy + sgn * (coilOuter + 1);
      const x1 = formerFront + 5; // fixed basket anchor
      const y1 = cy + sgn * (coilOuter + h * 0.2);
      p.moveTo(x0, y0);
      for (let i = 1; i <= N; i++) {
        const f = i / N;
        const zig = i < N ? (i % 2 === 1 ? 3 : -3) : 0;
        p.lineTo(x0 + (x1 - x0) * f + zig, y0 + (y1 - y0) * f);
      }
    }
    return p;
  }, [clock, visHz, amp, mode, formerFront, cy, coilOuter, h]);

  // FLEXING SURROUND (the membrane) — bridges the MOVING cone mouth edge to the
  // FIXED basket rim, redrawn per frame so it visibly stretches / compresses as
  // the cone travels. Drawn OUTSIDE the translate group (it connects moving to
  // fixed). Two half-rolls, top and bottom.
  const surround = useDerivedValue(() => {
    const t = clock.value;
    let off = 0;
    if (mode === 'wave') off = amp * excMax * Math.sin(2 * Math.PI * visHz * t);
    else if (mode === 'noise') {
      const tq = Math.floor(t * 22);
      off = amp * excMax * 0.8 * (hash(tq * 97.7) - 0.5) * 2;
    }
    const innerX = mouthX + off; // moving cone edge
    // Small half-roll that stays BETWEEN the cone edge (cy±mh) and the frame
    // rim (both at the mouth height) — its peak never reaches the frame rail at
    // cy±frameHalf, so the surround can't exceed the basket (owner 2026-08-05).
    const bulge = 2 + Math.abs(off) * 0.15;
    const p = Skia.Path.Make();
    p.moveTo(innerX, cy - mh);
    p.quadTo((innerX + rimX) / 2, cy - mh - bulge, rimX, cy - mh);
    p.moveTo(innerX, cy + mh);
    p.quadTo((innerX + rimX) / 2, cy + mh + bulge, rimX, cy + mh);
    return p;
  }, [clock, visHz, amp, mode, mouthX, rimX, cy, mh]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* ── Motor: steel back plate · WARM magnet ring (reference cutaway) ·
          steel front plate. */}
      <RoundedRect x={3} y={cy - h * 0.3} width={motor.backW} height={h * 0.6} r={2}>
        <LinearGradient start={vec(3, cy - h * 0.3)} end={vec(3, cy + h * 0.3)} colors={[METAL_MID, METAL_LO]} />
      </RoundedRect>
      <RoundedRect x={3 + motor.backW} y={cy - h * 0.24} width={motor.ringW} height={h * 0.48} r={2}>
        <LinearGradient
          start={vec(3 + motor.backW, cy - h * 0.24)}
          end={vec(3 + motor.backW, cy + h * 0.24)}
          colors={['#8a5a20', '#3a2410']}
        />
      </RoundedRect>
      <RoundedRect x={3 + motor.backW + motor.ringW} y={cy - h * 0.3} width={motor.poleW} height={h * 0.6} r={2}>
        <LinearGradient
          start={vec(3 + motor.backW + motor.ringW, cy - h * 0.3)}
          end={vec(3 + motor.backW + motor.ringW, cy + h * 0.3)}
          colors={[METAL_HI, METAL_MID, METAL_LO]}
        />
      </RoundedRect>
      {/* Basket struts out to the fixed mounting rim. */}
      <Path path={motor.struts} color="#3a3a42" style="stroke" strokeWidth={1.6} />
      {/* FIXED basket front rim/lip — spans from the frame edge (outside the
          cone) DOWN to the mouth, where the surround attaches. The cone + roll
          stay inside it (owner 2026-08-05). */}
      <RoundedRect x={rimX} y={cy - frameHalf} width={5} height={frameHalf - mh + 2} r={1.5}>
        <LinearGradient start={vec(rimX, 0)} end={vec(rimX + 5, 0)} colors={[METAL_MID, METAL_LO]} />
      </RoundedRect>
      <RoundedRect x={rimX} y={cy + mh - 2} width={5} height={frameHalf - mh + 2} r={1.5}>
        <LinearGradient start={vec(rimX, 0)} end={vec(rimX + 5, 0)} colors={[METAL_MID, METAL_LO]} />
      </RoundedRect>

      {/* CORRUGATED SPIDER — accordion suspension, moving former → fixed
          basket (drawn behind the cone; flexes per frame). */}
      <Path path={spider} color="#a8862e" style="stroke" strokeWidth={1.6} opacity={0.9} />

      {/* STATIC CENTRE POLE PIECE — the fixed steel core. The voice coil rides
          OUTSIDE it (walls above & below), so this is drawn BEHIND the moving
          coil and shows THROUGH the gap between the coil walls (owner
          2026-08-05: coil is outside the pole, not under it). */}
      {/* The pole ends SHORT of the coil front (owner 2026-08-05) so that when
          the cone/coil slides fully OUT there is a visible GAP past the pole's
          right end — proving the core is STATIC while the coil moves over it. */}
      <RoundedRect
        x={3 + motor.backW + motor.ringW}
        y={cy - poleHalf}
        width={poleRight - (3 + motor.backW + motor.ringW)}
        height={poleHalf * 2}
        r={1.5}
      >
        <LinearGradient
          start={vec(0, cy - poleHalf)}
          end={vec(0, cy + poleHalf)}
          colors={[METAL_HI, METAL_MID, METAL_LO]}
          positions={[0, 0.45, 1]}
        />
      </RoundedRect>
      <SkLine
        p1={{ x: 3 + motor.backW + motor.ringW, y: cy - poleHalf + 1 }}
        p2={{ x: poleRight, y: cy - poleHalf + 1 }}
        color="#ffffff"
        strokeWidth={0.7}
        opacity={0.25}
      />

      {/* ── The moving assembly: voice coil (OUTSIDE the pole) + cone + cap. */}
      <Group transform={coneShift}>
        <Path path={coneParts.former}>
          <LinearGradient start={vec(gapX, cy - coilOuter)} end={vec(gapX, cy + coilOuter)} colors={['#565a64', '#26272e']} />
        </Path>
        {/* Copper voice-coil turns — tight vertical striations (edge-on). */}
        <Path path={coneParts.windings} color="#c9772e" style="stroke" strokeWidth={1.1} opacity={0.95} />
        <Path path={coneParts.cone}>
          <LinearGradient
            start={vec(apexX, cy - mh)}
            end={vec(mouthX, cy + mh)}
            colors={[CONE_HI, CONE_MID, CONE_LO]}
            positions={[0, 0.5, 1]}
          />
        </Path>
        <Path path={coneParts.cone} color="#14151a" style="stroke" strokeWidth={1} opacity={0.8} />
        <Path path={coneParts.topEdge} color="#ffffff" style="stroke" strokeWidth={1.2} opacity={0.22} />
        {/* Dust cap: radial-gradient dome over the apex, lit from upper-left. */}
        <Circle cx={apexX + 3} cy={cy} r={6.5}>
          <RadialGradient c={vec(apexX + 1, cy - 2.5)} r={10} colors={['#9ba0ac', '#3f424b']} />
        </Circle>
      </Group>

      {/* FLEXING surround roll — a THIN elastic band bridging the moving cone
          to the fixed rim (owner 2026-08-05: was too long/thick). */}
      <Path path={surround} color="#1c1d23" style="stroke" strokeWidth={3.2} strokeCap="round" />
      <Path path={surround} color="#ffffff" style="stroke" strokeWidth={0.9} strokeCap="round" opacity={0.16} />

      {/* No emanating "sound rays" (owner 2026-08-05) — the air window shows
          the propagation; nothing decorative is drawn leaving the speaker. */}
      <Vignette w={w} h={h} />
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
  lambdaPx,
  originX = 0,
}: {
  clock: SharedValue<number>;
  width: number;
  height?: number;
  visHz: number;
  amp: number;
  mode?: AirMode;
  /** Spatial scale in px — pass the air window's λ so crests align. */
  lambdaPx?: number;
  /** The wave is BORN here (px) and travels right; flat (atmospheric) to the
   *  left of it. Set to the speaker's mouth x so the speaker "creates" the wave
   *  (owner 2026-08-05). */
  originX?: number;
}) {
  const w = width;
  const h = height;
  const lambda = lambdaPx && lambdaPx > 8 ? lambdaPx : w / 2.2; // SAME spatial
  // scale as the particle window — the drawn pressure peaks align with the
  // compression bands above.
  const N = 90;
  const mid = h / 2;
  const fullA = h * 0.36; // pixel excursion at full scale (amp = 1) — the MIDI
  // gradient maps over ±fullA so a quiet wave stays blue and a loud one reaches red.

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
      if (x < originX) {
        y = mid; // atmospheric — the wave hasn't been created here yet
      } else if (mode === 'noise') {
        const tq = Math.floor(t * 22);
        y = mid - a * 0.8 * (hash(i * 91.3 + tq * 57.1) - 0.5) * 2;
      } else {
        // p ∝ cos(ωt − k(x−x0)): born at the speaker mouth, travels right, and
        // its peaks sit under the compression bands.
        y = mid - a * Math.cos(om * t - k * (x - originX));
      }
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, visHz, amp, mode, w, h, lambda, originX]);

  // Gradient underfill: the SAME p ∝ cos(ωt − kx) samples, closed back to the
  // atmospheric zero line (styling only — identical pressure law).
  const under = useDerivedValue(() => {
    const t = clock.value;
    const k = (2 * Math.PI) / lambda;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = amp * (h * 0.36);
    p.moveTo(0, mid);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      let y: number;
      if (x < originX) {
        y = mid;
      } else if (mode === 'noise') {
        const tq = Math.floor(t * 22);
        y = mid - a * 0.8 * (hash(i * 91.3 + tq * 57.1) - 0.5) * 2;
      } else {
        y = mid - a * Math.cos(om * t - k * (x - originX));
      }
      p.lineTo(x, y);
    }
    p.lineTo(w, mid);
    p.close();
    return p;
  }, [clock, visHz, amp, mode, w, h, lambda, originX]);

  // Styled axis ticks along the zero line (static chrome).
  const ticks = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 1; i < 8; i++) {
      const x = (i / 8) * w;
      p.moveTo(x, h / 2 - 3);
      p.lineTo(x, h / 2 + 3);
    }
    return p;
  }, [w, h]);

  return (
    <View style={{ width: w, height: h }}>
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Underfill — MIDI level ramp (blue at the zero line → red at the peaks). */}
      <Path path={under} opacity={0.42}>
        <LinearGradient start={vec(0, mid - fullA)} end={vec(0, mid + fullA)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
      </Path>
      <Path path={ticks} color={GRID} style="stroke" strokeWidth={1.2} />
      {/* Atmospheric-pressure zero line — brighter than the grid (reference). */}
      <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color={ZERO_REF} strokeWidth={1.4} />
      {/* Trace: glow + crisp, BOTH coloured by the MIDI amplitude gradient
          (owner 2026-08-05: level shown in the MIDI scheme). */}
      <Path path={trace} style="stroke" strokeWidth={5.4} strokeCap="round" strokeJoin="round" opacity={0.22}>
        <BlurMask blur={4} style="normal" />
        <LinearGradient start={vec(0, mid - fullA)} end={vec(0, mid + fullA)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
      </Path>
      <Path path={trace} style="stroke" strokeWidth={2.2} strokeCap="round" strokeJoin="round">
        <LinearGradient start={vec(0, mid - fullA)} end={vec(0, mid + fullA)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
      </Path>
    </Canvas>
      {/* +/- PRESSURE metrics on the LEFT (owner 2026-08-05): above the zero
          line = compression (+), below = rarefaction (−). */}
      <Text style={[pgStyles.pLabel, pgStyles.pPlus, { top: h / 2 - 16 }]}>+ PRESSURE</Text>
      <Text style={[pgStyles.pLabel, pgStyles.pMinus, { top: h / 2 + 5 }]}>− PRESSURE</Text>
    </View>
  );
}

const pgStyles = StyleSheet.create({
  pLabel: {
    position: 'absolute',
    left: 4,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  // Both pressure labels amber (owner 2026-08-05) — not red/blue.
  pPlus: { color: WAVE },
  pMinus: { color: WAVE },
});

// ─────────────────────────────────────────────────────────────────────────────
// The three-window composite — Module 2's centerpiece

export function ThreeWindowView({
  width,
  visHz,
  amp,
  running,
  mode = 'wave',
  showEar = true,
  showZones = true,
}: {
  width: number;
  visHz: number;
  amp: number;
  running: boolean;
  mode?: AirMode;
  showEar?: boolean;
  showZones?: boolean;
}) {
  // ONE clock — all three windows phase-locked (the whole point).
  const clock = useVizClock(running);
  // Side-by-side (owner 2026-08-05): THIN speaker on the LEFT firing into the
  // air animation on the RIGHT — source → medium reads left-to-right. The
  // pressure graph sits DIRECTLY UNDER the air at the SAME width/x-origin so
  // its crests line up vertically with the particle compressions above (same
  // lambda + same cos(ωt−kx) phase → aligned across the screen).
  // Wider speaker now that no sound-rays take space (owner 2026-08-05) — better
  // proportions, less squished. Clamped so a narrow panel still leaves room for
  // the air animation on the right.
  const spkW = Math.min(120, Math.max(96, width * 0.36));
  const gap = 6;
  const airW = Math.max(60, width - spkW - gap);
  const originX = spkW * 0.72; // the speaker's cone-mouth x — the wave is born here
  const lambdaPx = airW / 2.2; // one spatial scale shared by air + graph
  // Shift the air's phase so its compressions line up with the FULL-WIDTH graph
  // whose wave starts at originX: air-local x=0 sits at screen (spkW+gap).
  const airPhasePx = spkW + gap - originX;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap }}>
        <View style={{ gap: 4 }}>
          <Text style={twStyles.winLabel}>SPEAKER</Text>
          <SpeakerConeView clock={clock} width={spkW} height={116} visHz={visHz} amp={amp} mode={mode} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={twStyles.winLabel}>AIR — molecules, moving</Text>
          <AirParticlesView
            clock={clock}
            width={airW}
            visHz={visHz}
            amp={amp}
            mode={mode}
            showEar={showEar}
            showZones={showZones}
            phasePx={airPhasePx}
          />
        </View>
      </View>
      {/* THE GRAPH — full width UNDER the speaker + air. The wave is created at
          the speaker mouth and travels right; its crests sit under the
          compressions above. */}
      <Text style={twStyles.winLabel}>THE GRAPH — the speaker creates the wave; it travels right</Text>
      <PressureGraphView clock={clock} width={width} visHz={visHz} amp={amp} mode={mode} lambdaPx={lambdaPx} originX={originX} />
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
  // Samples computed ONCE (identical math to the pre-retrofit trace — same
  // seeded noise smoothing, same engine-style peak normalization), then built
  // into both the stroke path and its gradient underfill.
  const { path, under } = useMemo(() => {
    const p = Skia.Path.Make();
    const u = Skia.Path.Make();
    const mid = h / 2;
    const a = level * h * 0.4;
    const N = 160;
    const ys: number[] = [];
    if (noise) {
      // Idealized noise trace (seeded, deterministic): white = raw hash,
      // pink/brown = progressively one-pole smoothed. Badged analytic.
      const smooth = noise === 'white' ? 0 : noise === 'pink' ? 0.75 : 0.93;
      let y = 0;
      for (let i = 0; i <= N; i++) {
        const r = (hashJs(i * 17.13) - 0.5) * 2;
        y = smooth * y + (1 - smooth) * r;
        ys.push(mid - a * (noise === 'brown' ? y * 3.2 : noise === 'pink' ? y * 1.8 : y));
      }
    } else {
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
        ys.push(mid - a * s * norm);
      }
    }
    u.moveTo(0, mid);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      if (i === 0) p.moveTo(x, ys[i]);
      else p.lineTo(x, ys[i]);
      u.lineTo(x, ys[i]);
    }
    u.lineTo(w, mid);
    u.close();
    return { path: p, under: u };
  }, [w, h, amps, phasesDeg, level, noise]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={under} opacity={0.85}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, h)}
          colors={[withAlpha(WAVE, 0), withAlpha(WAVE, 0.18), withAlpha(WAVE, 0)]}
        />
      </Path>
      {/* Zero line — brighter reference (house idiom). */}
      <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color={ZERO_REF} strokeWidth={1.2} />
      <GlowStroke path={path} color={WAVE} width={2} />
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
      {/* Baseline — brighter reference (house idiom). */}
      <SkLine p1={{ x: 0, y: h - 14 }} p2={{ x: w, y: h - 14 }} color={ZERO_REF} strokeWidth={1.4} />
      {/* Harmonic sticks: glow pass + crisp pass with a vertical heat gradient
          (tip hot, base dim) — heights are the SAME dB mapping as ever. */}
      <Path path={sticks} color={WAVE} style="stroke" strokeWidth={5.5} opacity={0.22}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={sticks} style="stroke" strokeWidth={3}>
        <LinearGradient start={vec(0, 8)} end={vec(0, h - 14)} colors={['#ffd98a', WAVE, '#b8842a']} />
      </Path>
      {/* Noise slope: glow + crisp (same idealized dB/oct line). */}
      <Path path={slope} color={WAVE} style="stroke" strokeWidth={4.5} opacity={0.22}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
      <Path path={slope} color={WAVE} style="stroke" strokeWidth={2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 5 — Rate comparator: two sources vibrating at different RATES.
// Same conceptual-model rules as everything above (slowed, badged by the host).

export function RateComparatorView({
  phaseA,
  phaseB,
  width,
  height = 132,
  amp = 0.8,
  active = 'none',
}: {
  /** Phase clocks (usePhaseClock) — continuous through pair switches. */
  phaseA: SharedValue<number>;
  phaseB: SharedValue<number>;
  width: number;
  height?: number;
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
  const makeSide = (phase: SharedValue<number>, x0: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const fill = useDerivedValue(() => {
      const ph = phase.value;
      const lambda = colW / 1.7;
      const k = (2 * Math.PI) / lambda;
      const p = Skia.Path.Make();
      for (let i = 0; i < gxs.length; i++) {
        const dx = amp * 6 * Math.sin(ph - k * gxs[i]);
        p.addCircle(x0 + gxs[i] + dx, gys[i], 2);
      }
      // Orbit dot — ONE revolution per cycle (count laps = count cycles).
      const ocx = x0 + colW - 22;
      const ocy = 17;
      p.addCircle(ocx + 10 * Math.cos(ph - Math.PI / 2), ocy + 10 * Math.sin(ph - Math.PI / 2), 3);
      return p;
    }, [phase, x0, gxs, gys, amp, colW]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const stroke = useDerivedValue(() => {
      const ph = phase.value;
      const p = Skia.Path.Make();
      // Piston (the source): a vertical bar oscillating along the travel axis.
      const px = x0 + 12 + amp * 7 * Math.sin(ph);
      p.moveTo(px, 34);
      p.lineTo(px, h - 14);
      return p;
    }, [phase, x0, amp, h]);
    return { fill, stroke };
  };

  const a = makeSide(phaseA, 0);
  const b = makeSide(phaseB, colW + 14);

  // Static chrome, styled: divider, the two orbit dials, and a 12-o'clock lap
  // tick on each dial (one lap = one cycle — the tick marks the lap start).
  const chrome = useMemo(() => {
    const divider = Skia.Path.Make();
    divider.moveTo(colW + 7, 8);
    divider.lineTo(colW + 7, h - 8);
    const rings = Skia.Path.Make();
    rings.addCircle(colW - 22, 17, 10);
    rings.addCircle(colW + 14 + colW - 22, 17, 10);
    const lapTicks = Skia.Path.Make();
    for (const ocx of [colW - 22, colW + 14 + colW - 22]) {
      lapTicks.moveTo(ocx, 3.5);
      lapTicks.lineTo(ocx, 9);
    }
    return { divider, rings, lapTicks };
  }, [colW, h]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={chrome.divider} color={GRID} style="stroke" strokeWidth={1.4} />
      <Path path={chrome.rings} color="#3a3a42" style="stroke" strokeWidth={1.6} />
      <Path path={chrome.lapTicks} color={WAVE} style="stroke" strokeWidth={1.6} opacity={0.7} />
      {/* Pistons (the sources): capsule rods — soft glow + metal-sheen core.
          Position law identical; only the rendering is richer. */}
      <Path
        path={a.stroke}
        color={active === 'a' ? ACCENT_GREEN : CONE}
        style="stroke"
        strokeWidth={9}
        strokeCap="round"
        opacity={active === 'a' ? 0.4 : 0.1}
      >
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path
        path={a.stroke}
        style="stroke"
        strokeWidth={5.5}
        strokeCap="round"
        color={active === 'a' ? ACCENT_GREEN : undefined}
      >
        {active === 'a' ? null : (
          <LinearGradient start={vec(0, 34)} end={vec(0, h - 14)} colors={[METAL_HI, METAL_MID, METAL_LO]} />
        )}
      </Path>
      <Path
        path={b.stroke}
        color={active === 'b' ? ACCENT_GREEN : CONE}
        style="stroke"
        strokeWidth={9}
        strokeCap="round"
        opacity={active === 'b' ? 0.4 : 0.1}
      >
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path
        path={b.stroke}
        style="stroke"
        strokeWidth={5.5}
        strokeCap="round"
        color={active === 'b' ? ACCENT_GREEN : undefined}
      >
        {active === 'b' ? null : (
          <LinearGradient start={vec(0, 34)} end={vec(0, h - 14)} colors={[METAL_HI, METAL_MID, METAL_LO]} />
        )}
      </Path>
      {/* Particles + orbit dots: soft halo layer + crisp cores. */}
      <Path path={a.fill} color={active === 'a' ? '#eef2ee' : PARTICLE} opacity={0.35}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={a.fill} color={active === 'a' ? '#eef2ee' : PARTICLE} />
      <Path path={b.fill} color={active === 'b' ? '#eef2ee' : PARTICLE} opacity={0.35}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={b.fill} color={active === 'b' ? '#eef2ee' : PARTICLE} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 6 — Wavelength ruler: the wave laid across a real room (7 m), with a
// λ bracket whose drawn length IS 343/f mapped onto the room scale.

export const RULER_ROOM_M = 7;

export function WavelengthRulerView({
  phase,
  clock,
  width,
  height = 158,
  freqHz,
  amp = 0.85,
}: {
  /** Phase clock (usePhaseClock) — continuous while the slider drags. */
  phase: SharedValue<number>;
  /** Seconds clock (useVizClock) — paces the sparkle hand-offs (owner
   *  2026-08-10); without it the sparkle-tracked molecules are skipped. */
  clock?: SharedValue<number>;
  width: number;
  height?: number;
  freqHz: number;
  amp?: number;
}) {
  const w = width;
  const h = height;
  const floorY = h - 18;
  const lambdaM = 343 / Math.max(20, freqHz);
  const lambdaPx = (lambdaM / RULER_ROOM_M) * w;
  // Sparkle-tracked molecules (owner 2026-08-10, replacing the coloured
  // tracers): 19 homes over the particle field; two glint at a time.
  const sparkleXY = useMemo(() => sparkleHomes(w, 12, floorY - 52), [w, floorY]);
  const sxs = sparkleXY.xs;
  const sys = sparkleXY.ys;
  const sparkles = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!clock) return p;
    const t = clock.value;
    const ph = phase.value;
    const k = (2 * Math.PI) / Math.max(10, lambdaPx);
    const disp = Math.min(9, lambdaPx / 7); // same excursion as the field dots
    const e0 = Math.floor(t / SPARKLE_LIFE);
    for (let s = 0; s < 2; s++) {
      const ts = t + s * (SPARKLE_LIFE / 2);
      const e = Math.floor(ts / SPARKLE_LIFE);
      const u = ts - e * SPARKLE_LIFE;
      let idx = Math.floor(hash(e * 17.31 + s * 3.77) * SPARKLE_N) % SPARKLE_N;
      if (s === 1) {
        const idx0 = Math.floor(hash(e0 * 17.31) * SPARKLE_N) % SPARKLE_N;
        if (idx === idx0) idx = (idx + 7) % SPARKLE_N;
      }
      const fade = Math.min(1, u / 0.45, (SPARKLE_LIFE - u) / 0.45);
      if (fade <= 0.02) continue;
      const dx = amp * disp * Math.sin(ph - k * sxs[idx]);
      const x = sxs[idx] + dx;
      const y = sys[idx];
      // Dual-frequency shimmer (owner 2026-08-10) — see AirParticlesView.
      const R = Math.max(
        0.5,
        (6 + 2 * Math.sin(t * 6 + idx * 2.1) + 0.8 * Math.sin(t * 13 + idx * 1.7)) * fade,
      );
      addGlint(p, x, y, R, t * 1.2 + idx);
      p.addCircle(x, y, 1.9 + 0.9 * fade); // the molecule itself, larger + bright
    }
    return p;
  }, [phase, clock, sxs, sys, amp, lambdaPx]);

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
    const ph = phase.value;
    // TRUE lambda — the drawn band spacing must equal the bracket (the badge
    // promises "horizontal scale is real"). The tiny floor only guards math
    // pathology; it never engages within the module's 55–880 Hz range.
    const k = (2 * Math.PI) / Math.max(10, lambdaPx);
    const p = Skia.Path.Make();
    // Displacement capped so tight lambdas never collapse into solid bands.
    const disp = Math.min(9, lambdaPx / 7);
    for (let i = 0; i < gxs.length; i++) {
      const dx = amp * disp * Math.sin(ph - k * gxs[i]);
      p.addCircle(gxs[i] + dx, gys[i], 1.9);
    }
    return p;
  }, [phase, lambdaPx, gxs, gys, amp]);

  // Compression-zone tint bands — pressure crests (cos(φ − kx) = 1) at the
  // TRUE drawn λ (same k guard as the dots), so the warm bands ride exactly
  // with the particle bunching. One thick blurred stroke per crest.
  const bandW = Math.max(10, lambdaPx) * 0.34;
  const bands = useDerivedValue(() => {
    const ph = phase.value;
    const lam = Math.max(10, lambdaPx);
    const k = (2 * Math.PI) / lam;
    const p = Skia.Path.Make();
    const x0 = (((ph / k) % lam) + lam) % lam;
    for (let x = x0 - lam; x < w + lam; x += lam) {
      p.moveTo(x, 4);
      p.lineTo(x, floorY - 34);
    }
    return p;
  }, [phase, lambdaPx, w, floorY]);

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

  // 1 m ticks (static; the floor itself is a gradient strip below).
  const room = useMemo(() => {
    const p = Skia.Path.Make();
    for (let m = 0; m <= RULER_ROOM_M; m++) {
      const x = (m / RULER_ROOM_M) * w;
      p.moveTo(x, floorY);
      p.lineTo(x, floorY + (m % 2 === 0 ? 8 : 5));
    }
    return p;
  }, [w, floorY]);

  // Human scale figure — line-art person in the house single-stroke language
  // (micspeaker head-icon/guitarist idiom): uniform stroke, rounded caps,
  // organic curves, no fill. Garnish — vertical is NOT to the metre scale.
  const person = useMemo(() => {
    const p = Skia.Path.Make();
    const px = w - 26;
    const fy = floorY;
    p.addCircle(px, fy - 41, 4.6); // head
    p.moveTo(px, fy - 36.2); // torso: gentle S from neck to hips
    p.cubicTo(px + 0.8, fy - 32, px - 0.8, fy - 26, px, fy - 21);
    p.moveTo(px - 6, fy - 33.5); // shoulders sloping naturally
    p.quadTo(px, fy - 36.5, px + 6, fy - 33.5);
    p.moveTo(px - 6, fy - 33.5); // arms relaxed at the sides
    p.cubicTo(px - 7.5, fy - 28, px - 7, fy - 23, px - 6, fy - 18.5);
    p.moveTo(px + 6, fy - 33.5);
    p.cubicTo(px + 7.5, fy - 28, px + 7, fy - 23, px + 6, fy - 18.5);
    p.moveTo(px, fy - 21); // legs with a slight stance
    p.cubicTo(px - 2, fy - 14, px - 3.5, fy - 7, px - 4.5, fy);
    p.moveTo(px, fy - 21);
    p.cubicTo(px + 2, fy - 14, px + 4, fy - 7, px + 5, fy);
    return p;
  }, [w, floorY]);

  const bracketMidX = (8 + Math.min(w - 8, 8 + lambdaPx)) / 2;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Warm compression bands riding with the particle bunching. */}
        <Path path={bands} color={WARM_BAND} style="stroke" strokeWidth={bandW} opacity={0.12}>
          <BlurMask blur={Math.min(9, bandW * 0.8)} style="normal" />
        </Path>
        {/* Particles: soft halo layer + crisp cores. */}
        <Path path={dots} color={PARTICLE} opacity={0.35}>
          <BlurMask blur={3.5} style="normal" />
        </Path>
        <Path path={dots} color={PARTICLE} />
        {/* SPARKLE-TRACKED molecules — two glinting at a time, handing off
            every ~2 s, each only ever wobbling in place. Three layers (owner
            2026-08-10, more visible): wide bloom → tight glow → crisp star. */}
        <Path path={sparkles} color="#ffffff" opacity={0.32}>
          <BlurMask blur={14} style="normal" />
        </Path>
        <Path path={sparkles} color="#ffffff" opacity={0.45}>
          <BlurMask blur={5} style="normal" />
        </Path>
        <Path path={sparkles} color="#f6f8fc" opacity={0.95} />
        {/* Floor: gradient ground strip + edge line (house Floor idiom). */}
        <RoundedRect x={0} y={floorY} width={w} height={h - floorY} r={0}>
          <LinearGradient start={vec(0, floorY)} end={vec(0, h)} colors={['#17181d', '#0d0d10']} />
        </RoundedRect>
        <SkLine p1={{ x: 0, y: floorY }} p2={{ x: w, y: floorY }} color="#2a2b32" strokeWidth={1.2} />
        <Path path={room} color="#46474f" style="stroke" strokeWidth={1.6} />
        {/* λ bracket — glowing amber measure (still EXACTLY 343/f, to scale). */}
        <GlowStroke path={bracket} color={WAVE} width={2.2} />
        <Path
          path={person}
          color="#d7dbe2"
          style="stroke"
          strokeWidth={1.5}
          strokeCap="round"
          strokeJoin="round"
          opacity={0.85}
        />
        <Vignette w={w} h={h} />
      </Canvas>
      {/* Mono tick labels (house RNText-overlay idiom). */}
      <Text style={[tickText, { left: 2, top: floorY + 9 }]}>0</Text>
      <Text style={[tickText, { left: w - 26, top: floorY + 9, width: 24, textAlign: 'right' as const }]}>7 m</Text>
      <Text style={[tickText, { left: Math.max(10, Math.min(w - 16, bracketMidX - 3)), top: floorY - 38, color: WAVE }]}>
        λ
      </Text>
    </View>
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
  // Phase clock: continuous through the 110/220 chip switches.
  const phase = usePhaseClock(running, visHz);
  const w = width;
  const h = 84;

  // TOP — pressure at ONE point (the mic, right edge) plotted over TIME.
  const timeTrace = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = h * 0.34;
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      // Right edge = now; moving left = further into the past.
      const y = mid - a * Math.cos(ph - ((w - x) / w) * 2 * Math.PI * DD_CYC);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, w]);
  const timeDots = useDerivedValue(() => {
    const ph = phase.value;
    const mid = h / 2;
    const a = h * 0.34;
    const p = Skia.Path.Make();
    // The mic itself (right edge, reading "now").
    p.addCircle(w - 6, mid - a * Math.cos(ph), 4);
    // The linked cursor — cursor c of a cycle back in time.
    const xc = w * (1 - cursor);
    p.addCircle(xc, mid - a * Math.cos(ph - cursor * 2 * Math.PI * DD_CYC), 4.5);
    return p;
  }, [phase, w, cursor]);

  // BOTTOM — pressure along DISTANCE at this instant (source at the left).
  const spaceTrace = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = h * 0.34;
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const y = mid - a * Math.cos(ph - (x / w) * 2 * Math.PI * DD_CYC);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, w]);
  const spaceDots = useDerivedValue(() => {
    const ph = phase.value;
    const mid = h / 2;
    const a = h * 0.34;
    const p = Skia.Path.Make();
    // Same phase as the time cursor → ALWAYS the same height. That's d = v·t.
    const xc = w * cursor;
    p.addCircle(xc, mid - a * Math.cos(ph - cursor * 2 * Math.PI * DD_CYC), 4.5);
    return p;
  }, [phase, w, cursor]);

  // Gradient underfills — the SAME cos(φ − θ(x)) samples as the traces,
  // closed back to the midline (styling only; identical trace math).
  const timeUnder = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = h * 0.34;
    const N = 90;
    p.moveTo(0, mid);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      p.lineTo(x, mid - a * Math.cos(ph - ((w - x) / w) * 2 * Math.PI * DD_CYC));
    }
    p.lineTo(w, mid);
    p.close();
    return p;
  }, [phase, w]);
  const spaceUnder = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const mid = h / 2;
    const a = h * 0.34;
    const N = 90;
    p.moveTo(0, mid);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      p.lineTo(x, mid - a * Math.cos(ph - (x / w) * 2 * Math.PI * DD_CYC));
    }
    p.lineTo(w, mid);
    p.close();
    return p;
  }, [phase, w]);

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
  // The source — a micro ILLUSTRATED cone (curved gradient flare + dust cap),
  // not a bare trapezoid outline (standards rule 1).
  const speaker = useMemo(() => {
    const cy = h / 2;
    const p = Skia.Path.Make();
    p.moveTo(4, cy - 5);
    p.quadTo(8, cy - 6.5, 12, cy - 12);
    p.lineTo(12, cy + 12);
    p.quadTo(8, cy + 6.5, 4, cy + 5);
    p.close();
    return p;
  }, []);

  const underGrad = [withAlpha(WAVE, 0), withAlpha(WAVE, 0.16), withAlpha(WAVE, 0)];
  return (
    <View style={{ gap: 4 }}>
      <Text style={twStyles.winLabel}>OVER TIME — pressure at the mic (right edge = now)</Text>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <Path path={timeUnder} opacity={0.85}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={underGrad} />
        </Path>
        <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color={ZERO_REF} strokeWidth={1.2} />
        {/* Linked cursor: soft glow + dashed core. */}
        <Path path={cursorLineTop} color={ACCENT_GREEN} style="stroke" strokeWidth={3} opacity={0.18}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={cursorLineTop} color={ACCENT_GREEN} style="stroke" strokeWidth={1.1} opacity={0.6}>
          <DashPathEffect intervals={[4, 4]} />
        </Path>
        <GlowStroke path={timeTrace} color={WAVE} width={2.2} />
        <Path path={timeDots} color={ACCENT_GREEN} opacity={0.4}>
          <BlurMask blur={5} style="normal" />
        </Path>
        <Path path={timeDots} color={ACCENT_GREEN} />
      </Canvas>
      <Text style={twStyles.winLabel}>OVER DISTANCE — pressure along the room (this instant)</Text>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <Path path={spaceUnder} opacity={0.85}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={underGrad} />
        </Path>
        <SkLine p1={{ x: 0, y: h / 2 }} p2={{ x: w, y: h / 2 }} color={ZERO_REF} strokeWidth={1.2} />
        <Path path={cursorLineBottom} color={ACCENT_GREEN} style="stroke" strokeWidth={3} opacity={0.18}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={cursorLineBottom} color={ACCENT_GREEN} style="stroke" strokeWidth={1.1} opacity={0.6}>
          <DashPathEffect intervals={[4, 4]} />
        </Path>
        {/* Micro speaker: magnet nub + gradient cone + dust cap. */}
        <RoundedRect x={0} y={h / 2 - 6} width={4} height={12} r={1.5}>
          <LinearGradient start={vec(0, h / 2 - 6)} end={vec(0, h / 2 + 6)} colors={[METAL_MID, METAL_LO]} />
        </RoundedRect>
        <Path path={speaker}>
          <LinearGradient start={vec(4, h / 2 - 12)} end={vec(12, h / 2 + 12)} colors={[CONE_HI, CONE_MID, CONE_LO]} />
        </Path>
        <Circle cx={5.5} cy={h / 2} r={2.2} color="#9ba0ac" />
        <GlowStroke path={spaceTrace} color={WAVE} width={2.2} />
        <Path path={spaceDots} color={ACCENT_GREEN} opacity={0.4}>
          <BlurMask blur={5} style="normal" />
        </Path>
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
  phase,
  width,
  height = 210,
  freqHz,
}: {
  /** Phase clock (usePhaseClock) — one satellite lap per cycle, CONTINUOUS
   *  while the drag glides the pitch (the same motif as M5's rate dials:
   *  higher pitch = visibly faster orbit). */
  phase: SharedValue<number>;
  width: number;
  height?: number;
  freqHz: number;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2;
  const rMax = Math.min(w, h) / 2 - 14;
  const r0 = 18;
  const rOf = (o: number) => r0 + (o / (SPIRAL_OCTAVES + 0.15)) * (rMax - r0);
  const angOf = (o: number) => -Math.PI / 2 + o * 2 * Math.PI;

  const spiralParts = useMemo(() => {
    const curve = Skia.Path.Make();
    for (let i = 0; i <= 320; i++) {
      const o = (i / 320) * (SPIRAL_OCTAVES + 0.15);
      const x = cx + rOf(o) * Math.cos(angOf(o));
      const y = cy + rOf(o) * Math.sin(angOf(o));
      if (i === 0) curve.moveTo(x, y);
      else curve.lineTo(x, y);
    }
    // Octave markers — every crossing of the 12-o'clock ray is a DOUBLING.
    const octDots = Skia.Path.Make();
    for (let o = 0; o <= SPIRAL_OCTAVES; o++) {
      octDots.addCircle(cx + rOf(o) * Math.cos(angOf(o)), cy + rOf(o) * Math.sin(angOf(o)), 4);
    }
    return { curve, octDots };
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
    const ph = phase.value;
    const p = Skia.Path.Make();
    p.addCircle(mx + 13 * Math.cos(ph - Math.PI / 2), my + 13 * Math.sin(ph - Math.PI / 2), 3);
    p.addCircle(mx, my, 4.6 + 1.2 * Math.sin(ph));
    return p;
  }, [phase, mx, my]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* The 12-o'clock "doubling ray": every crossing = ×2 frequency. */}
        <SkLine p1={{ x: cx, y: cy - r0 + 6 }} p2={{ x: cx, y: cy - rMax - 6 }} color={ZERO_REF} strokeWidth={1.4}>
          <DashPathEffect intervals={[3, 4]} />
        </SkLine>
        <Path path={spiralParts.curve} color="#4a4a54" style="stroke" strokeWidth={2} />
        {/* Octave doubling markers on the ray. */}
        <Path path={spiralParts.octDots} color="#6a6e78" />
        {/* Hub anchor — the hub dead-zone stays clear (r0 unchanged). */}
        <Circle cx={cx} cy={cy} r={3.4}>
          <RadialGradient c={vec(cx - 1, cy - 1)} r={5} colors={[METAL_HI, METAL_LO]} />
        </Circle>
        {/* Marker ray + ring: glow + crisp. GREEN — this is the node you drag
            (owner 2026-08-05). */}
        <GlowStroke path={markerLine} color={ACCENT_GREEN} width={2.4} />
        {/* Satellite + pulsing core: soft halo + crisp (one lap = one cycle). */}
        <Path path={markerAnim} color={ACCENT_GREEN} opacity={0.4}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Path path={markerAnim} color={ACCENT_GREEN} />
        <Vignette w={w} h={h} />
      </Canvas>
      {/* Octave labels along the doubling ray (mono ticks — ×2 each lap). */}
      {Array.from({ length: SPIRAL_OCTAVES + 1 }, (_, o) => (
        <Text key={o} style={[tickText, { left: cx + 8, top: cy - rOf(o) - 4 }]}>
          {SPIRAL_F0 * Math.pow(2, o)}
        </Text>
      ))}
    </View>
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
  phase,
  width,
  height = 152,
  freqHz,
  level01 = 0.65,
}: {
  /** Phase clock (usePhaseClock) — continuous while the sweep drags. */
  phase: SharedValue<number>;
  width: number;
  height?: number;
  freqHz: number;
  /** 0..1 from the LEVEL slider — the strip's drawn amplitude follows the
   *  REAL commanded level (constant while you sweep FREQUENCY, which is the
   *  module's argument; honest when you move the level itself). */
  level01?: number;
}) {
  const w = width;
  const h = height;
  const fLo = 40;
  const fHi = 16000;
  const stripH = 34; // bottom band: the SIGNAL, amplitude constant
  const gh = h - stripH - 8; // curve region height
  const xOf = (f: number) => (Math.log(f / fLo) / Math.log(fHi / fLo)) * w;
  const yOf = (db: number) => 10 + ((8 - db) / 50) * (gh - 20);

  // Curve + its gradient underfill (same earSensDb samples, built once).
  const { curve, under } = useMemo(() => {
    const c = Skia.Path.Make();
    const u = Skia.Path.Make();
    const N = 100;
    u.moveTo(0, gh - 2);
    for (let i = 0; i <= N; i++) {
      const f = fLo * Math.pow(fHi / fLo, i / N);
      const x = i === 0 ? 0 : xOf(f);
      const y = yOf(earSensDb(f));
      if (i === 0) c.moveTo(0, y);
      else c.lineTo(x, y);
      u.lineTo(x, y);
    }
    u.lineTo(w, gh - 2);
    u.close();
    return { curve: c, under: u };
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
    const ph = phase.value;
    const p = Skia.Path.Make();
    // Pulsing dot riding the sensitivity curve at the tone's frequency.
    p.addCircle(dotX, dotY, 5.2 + 1.4 * Math.sin(ph));
    return p;
  }, [phase, dotX, dotY]);

  // THE SIGNAL — a traveling wave whose drawn amplitude follows ONLY the
  // level slider: it never changes while you sweep FREQUENCY (the module's
  // whole argument), and honestly tracks the level when you move that.
  const stripAmp = 3.5 + 7.5 * Math.max(0, Math.min(1, level01));
  const strip = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 110;
    const k = (2 * Math.PI * stripCyc) / w;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const y = stripMid - stripAmp * Math.sin(ph - k * x);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, w, stripCyc, stripMid, stripAmp]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Frequency grid — brighter for contrast (owner 2026-08-05). */}
        <Path path={grid} color="#4a4c56" style="stroke" strokeWidth={1.2} />
        {/* 1 kHz reference line (sensitivity 0 dB) — brighter reference. */}
        <SkLine p1={{ x: 0, y: yOf(0) }} p2={{ x: w, y: yOf(0) }} color={ZERO_REF} strokeWidth={1.4} />
        {/* Gradient underfill gives the sensitivity region a body. */}
        <Path path={under} opacity={0.9}>
          <LinearGradient
            start={vec(0, 6)}
            end={vec(0, gh)}
            colors={[withAlpha(ACCENT_BLUE, 0.22), withAlpha(ACCENT_BLUE, 0.02)]}
          />
        </Path>
        <GlowStroke path={curve} color={ACCENT_BLUE} width={2.2} />
        {/* The signal lane: subtle panel + divider between ear and signal. */}
        <RoundedRect x={0} y={h - stripH - 5} width={w} height={stripH + 5} r={0} color="#101117" />
        <SkLine p1={{ x: 0, y: h - stripH - 6 }} p2={{ x: w, y: h - stripH - 6 }} color={GRID} strokeWidth={1.6} />
        {/* THE SIGNAL waveform — coloured by AMPLITUDE via the MIDI ramp (owner
            2026-08-05): blue at the zero line → red at the peaks. */}
        <Path path={strip} style="stroke" strokeWidth={3.4} opacity={0.3}>
          <BlurMask blur={3} style="normal" />
          <LinearGradient start={vec(0, stripMid - 11)} end={vec(0, stripMid + 11)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
        </Path>
        <Path path={strip} style="stroke" strokeWidth={1.8}>
          <LinearGradient start={vec(0, stripMid - 11)} end={vec(0, stripMid + 11)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
        </Path>
        {/* The riding dot: GREEN (owner 2026-08-05) — matches the frequency
            slider; soft halo + crisp pulsing core. */}
        <Path path={anim} color={ACCENT_GREEN} opacity={0.4}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Path path={anim} color={ACCENT_GREEN} />
        {/* VERTICAL VOLUME scale (MIDI colours) on the far LEFT + a level marker
            (owner 2026-08-05): top = loud (red), bottom = quiet (blue). */}
        <RoundedRect x={0} y={6} width={7} height={h - stripH - 14} r={2}>
          <LinearGradient start={vec(0, 6)} end={vec(0, h - stripH - 8)} colors={MIDI_VSCALE_COLORS} positions={MIDI_VSCALE_POS} />
        </RoundedRect>
        <SkLine
          p1={{ x: 0, y: 6 + (1 - Math.max(0, Math.min(1, level01))) * (h - stripH - 14) }}
          p2={{ x: 11, y: 6 + (1 - Math.max(0, Math.min(1, level01))) * (h - stripH - 14) }}
          color="#ffffff"
          strokeWidth={2}
        />
      </Canvas>
      {/* VOL label above the vertical scale. */}
      <Text style={[tickText, { left: 0, top: 0, width: 22, color: '#c8ccd4' }]}>VOL</Text>
      {/* Log-frequency tick labels (mono) — brighter for contrast. */}
      {[
        { f: 100, label: '100' },
        { f: 1000, label: '1k' },
        { f: 10000, label: '10k' },
      ].map((t) => (
        <Text
          key={t.f}
          style={[tickText, { left: Math.max(0, Math.min(w - 24, xOf(t.f) - 12)), width: 24, textAlign: 'center' as const, top: 0, color: '#c8ccd4' }]}
        >
          {t.label}
        </Text>
      ))}
    </View>
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
  // Near 180° the two inputs cancel — the sum collapses to the centerline; flag
  // it so the sum draws as a glowing RED flat line (owner 2026-08-05: "bad").
  const cancelled = Math.abs((((phaseDeg % 360) + 360) % 360) - 180) < 12;

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

  // Sum underfill — the SAME exact sum at the SAME shared unit scale, closed
  // to the sum midline (styling only; the honest-by-scale rule is untouched).
  const sumUnder = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 130;
    p.moveTo(0, midBot);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const th = (i / N) * 2 * Math.PI * CYC - om * t;
      p.lineTo(x, midBot - unit * (Math.sin(th) + Math.sin(th + phi)));
    }
    p.lineTo(w, midBot);
    p.close();
    return p;
  }, [clock, w, midBot, unit, phi, visHz]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Midlines — brighter references; divider between inputs and sum. */}
        <SkLine p1={{ x: 0, y: midTop }} p2={{ x: w, y: midTop }} color={ZERO_REF} strokeWidth={1.2} />
        <SkLine p1={{ x: 0, y: midBot }} p2={{ x: w, y: midBot }} color={ZERO_REF} strokeWidth={1.2} />
        <SkLine p1={{ x: 0, y: h * 0.52 }} p2={{ x: w, y: h * 0.52 }} color="#1c1c22" strokeWidth={2} />
        {/* Inputs: A PURPLE, B BLUE (owner 2026-08-05) — light glow so the SUM
            stays the star. */}
        <Path path={pathA} color="#b45bff" style="stroke" strokeWidth={4.5} opacity={0.18}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={pathA} color="#b45bff" style="stroke" strokeWidth={2} />
        <Path path={pathB} color={ACCENT_BLUE} style="stroke" strokeWidth={4.5} opacity={0.16}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={pathB} color={ACCENT_BLUE} style="stroke" strokeWidth={2} />
        {/* THE SUM. Normally coloured by the MIDI amplitude ramp (blue at the
            midline → red at the peaks). At full cancellation (~180°) it collapses
            to the centerline and glows RED — the "bad, they cancelled" signal
            (owner 2026-08-05). */}
        {cancelled ? (
          <>
            <Path path={pathS} color="#ff3b30" style="stroke" strokeWidth={8} strokeCap="round" opacity={0.45}>
              <BlurMask blur={8} style="normal" />
            </Path>
            <Path path={pathS} color="#ff5a48" style="stroke" strokeWidth={2.8} strokeCap="round" />
          </>
        ) : (
          <>
            <Path path={sumUnder} opacity={0.5}>
              <LinearGradient start={vec(0, midBot - unit * 2.1)} end={vec(0, midBot + unit * 2.1)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
            </Path>
            <Path path={pathS} style="stroke" strokeWidth={6.5} strokeCap="round" strokeJoin="round" opacity={0.2}>
              <BlurMask blur={5} style="normal" />
              <LinearGradient start={vec(0, midBot - unit * 2.1)} end={vec(0, midBot + unit * 2.1)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
            </Path>
            <Path path={pathS} style="stroke" strokeWidth={2.8} strokeCap="round" strokeJoin="round">
              <LinearGradient start={vec(0, midBot - unit * 2.1)} end={vec(0, midBot + unit * 2.1)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
            </Path>
          </>
        )}
      </Canvas>
      <Text style={[tickText, { left: 4, top: 2 }]}>INPUTS</Text>
      <Text style={[tickText, { left: 4, top: h * 0.52 + 3 }]}>SUM = A + B</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 11 — Harmonic stacker: six sine layers (1/n amplitudes) + their SUM.

const HSTACK_ROWS = 6;
const HSTACK_ROW_H = 30; // taller rows so the harmonics are well spaced (owner 2026-08-05)
const HSTACK_SUM_H = 86;
const HSTACK_TOP = 4;
const HSTACK_GAP = 12;
const HSTACK_ROWS_BOTTOM = HSTACK_TOP + HSTACK_ROWS * HSTACK_ROW_H;
const HSTACK_MIDS = HSTACK_ROWS_BOTTOM + HSTACK_GAP + HSTACK_SUM_H / 2;
// H1 (fundamental) at the BOTTOM, H6 at the top (owner 2026-08-05).
const hstackMid = (n: number) => HSTACK_TOP + (HSTACK_ROWS - n + 0.5) * HSTACK_ROW_H;

/** One harmonic layer — a travelling sine whose drawn amplitude AND colour both
 *  follow its amplitude (MIDI ramp: quiet = blue → loud = red). */
function HStackRow({
  clock,
  width,
  n,
  amp,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  n: number;
  amp: number;
  visHz: number;
}) {
  const mid = hstackMid(n);
  const path = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const a = amp * (HSTACK_ROW_H * 0.42); // drawn amplitude tracks the level
    const p = Skia.Path.Make();
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * width;
      const y = mid - a * Math.sin(2 * Math.PI * 1.6 * n * (i / N) - n * om * t);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, width, mid, n, amp, visHz]);
  const on = amp > 0.02;
  // Fixed-scale symmetric ramp over the row's ±full-scale (blue at the mid line →
  // peak colour at the excursion), matching THE SUM curve below — so a loud
  // harmonic shows the whole climb, not a solid block. Off rows stay dim gray.
  const gStart = vec(0, mid - HSTACK_ROW_H * 0.42);
  const gEnd = vec(0, mid + HSTACK_ROW_H * 0.42);
  return (
    <Group>
      <SkLine p1={{ x: 0, y: mid }} p2={{ x: width, y: mid }} color="#161619" strokeWidth={1} />
      {on ? (
        <>
          <Path path={path} style="stroke" strokeWidth={3.4} opacity={0.16}>
            <BlurMask blur={4} style="normal" />
            <LinearGradient start={gStart} end={gEnd} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
          </Path>
          <Path path={path} style="stroke" strokeWidth={2} opacity={1}>
            <LinearGradient start={gStart} end={gEnd} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
          </Path>
        </>
      ) : (
        <Path path={path} color="#2a2a30" style="stroke" strokeWidth={1.2} opacity={0.5} />
      )}
    </Group>
  );
}

export function HarmonicStackerView({
  clock,
  width,
  amps,
  visHz,
}: {
  clock: SharedValue<number>;
  width: number;
  /** Six per-harmonic amplitudes 0..1 (H1..H6). */
  amps: number[];
  /** Slowed fundamental rate. Every layer travels PHASE-LOCKED (ωₙ = n·ω₀). */
  visHz: number;
}) {
  const w = width;
  const h = HSTACK_ROWS_BOTTOM + HSTACK_GAP + HSTACK_SUM_H;
  const a6 = amps;

  const sum = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    let wsum = 0;
    for (let n = 1; n <= HSTACK_ROWS; n++) wsum += a6[n - 1] ?? 0;
    const norm = 1 / Math.max(1, wsum);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      let s = 0;
      for (let n = 1; n <= HSTACK_ROWS; n++) s += (a6[n - 1] ?? 0) * Math.sin(2 * Math.PI * 1.6 * n * (i / N) - n * om * t);
      const y = HSTACK_MIDS - HSTACK_SUM_H * 0.42 * s * norm;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [clock, w, a6, visHz]);

  const sumUnder = useDerivedValue(() => {
    const t = clock.value;
    const om = 2 * Math.PI * visHz;
    const p = Skia.Path.Make();
    const N = 140;
    let wsum = 0;
    for (let n = 1; n <= HSTACK_ROWS; n++) wsum += a6[n - 1] ?? 0;
    const norm = 1 / Math.max(1, wsum);
    p.moveTo(0, HSTACK_MIDS);
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      let s = 0;
      for (let n = 1; n <= HSTACK_ROWS; n++) s += (a6[n - 1] ?? 0) * Math.sin(2 * Math.PI * 1.6 * n * (i / N) - n * om * t);
      p.lineTo(x, HSTACK_MIDS - HSTACK_SUM_H * 0.42 * s * norm);
    }
    p.lineTo(w, HSTACK_MIDS);
    p.close();
    return p;
  }, [clock, w, a6, visHz]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Divider between the layer rows and the sum. */}
        <SkLine p1={{ x: 0, y: HSTACK_ROWS_BOTTOM + HSTACK_GAP / 2 }} p2={{ x: w, y: HSTACK_ROWS_BOTTOM + HSTACK_GAP / 2 }} color={ZERO_REF} strokeWidth={1.4} />
        {/* Harmonic layers — each coloured by its own amplitude (MIDI). */}
        {a6.slice(0, HSTACK_ROWS).map((a, i) => (
          <HStackRow key={i} clock={clock} width={w} n={i + 1} amp={a} visHz={visHz} />
        ))}
        {/* THE SUM — MIDI amplitude gradient. */}
        <Path path={sumUnder} opacity={0.5}>
          <LinearGradient start={vec(0, HSTACK_MIDS - HSTACK_SUM_H * 0.45)} end={vec(0, HSTACK_MIDS + HSTACK_SUM_H * 0.45)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
        </Path>
        <Path path={sum} style="stroke" strokeWidth={6} strokeCap="round" strokeJoin="round" opacity={0.2}>
          <BlurMask blur={5} style="normal" />
          <LinearGradient start={vec(0, HSTACK_MIDS - HSTACK_SUM_H * 0.45)} end={vec(0, HSTACK_MIDS + HSTACK_SUM_H * 0.45)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
        </Path>
        <Path path={sum} style="stroke" strokeWidth={2.6} strokeCap="round" strokeJoin="round">
          <LinearGradient start={vec(0, HSTACK_MIDS - HSTACK_SUM_H * 0.45)} end={vec(0, HSTACK_MIDS + HSTACK_SUM_H * 0.45)} colors={MIDI_STOP_COLORS} positions={MIDI_STOP_POS} />
        </Path>
      </Canvas>
      {/* Harmonic row numbers (H1 at the bottom) — coloured by level. */}
      {Array.from({ length: HSTACK_ROWS }, (_, i) => {
        const a = a6[i] ?? 0;
        return (
          <Text key={i} style={[tickText, { left: 3, top: hstackMid(i + 1) - 6, color: a > 0.02 ? levelColor(a) : '#4a4a54' }]}>
            {`H${i + 1}`}
          </Text>
        );
      })}
      <Text style={[tickText, { left: 3, top: HSTACK_MIDS - 6 }]}>SUM</Text>
    </View>
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

  const sumO = Math.max(0.08, 1 - m);
  const compO = Math.max(0.05, m);
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Midline + spectrum baseline — brighter references. */}
      <SkLine p1={{ x: 0, y: centerY }} p2={{ x: w, y: centerY }} color={ZERO_REF} strokeWidth={1.2} />
      <SkLine p1={{ x: 0, y: specBase }} p2={{ x: w, y: specBase }} color={ZERO_REF} strokeWidth={1.4} />
      {/* The mixed wave: glow + crisp, fading as the lens separates it. */}
      <Path path={sum} color={WAVE} style="stroke" strokeWidth={5.5} opacity={0.2 * sumO}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={sum} color={WAVE} style="stroke" strokeWidth={2.6} opacity={sumO} />
      {/* The un-mixed components: blue glow + crisp, rising with the morph. */}
      <Path path={comps} color={ACCENT_BLUE} style="stroke" strokeWidth={4} opacity={0.18 * compO}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={comps} color={ACCENT_BLUE} style="stroke" strokeWidth={1.8} opacity={compO} />
      {/* The recipe card: glowing gradient bars (still static — time passes,
          the recipe doesn't; that stillness IS the lesson). */}
      <Path path={bars} color={WAVE} style="stroke" strokeWidth={7} opacity={0.25 * m}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={bars} style="stroke" strokeWidth={4} opacity={m}>
        <LinearGradient start={vec(0, specBase - 36)} end={vec(0, specBase)} colors={['#ffd98a', WAVE, '#b8842a']} />
      </Path>
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
  // Source is the SAME speaker used everywhere else (owner 2026-08-05) — a small
  // SpeakerConeView on the left; the air + mic live in the canvas to its right.
  const spkW = Math.min(88, Math.max(70, w * 0.34));
  const airW = w - spkW;
  // Mic moved IN from the right edge (owner 2026-08-05) so more of its BARREL
  // shows — it reads more like a microphone.
  const micX = airW - 42;
  const barrelRight = airW - 4;
  const waveX0 = 6;
  const waveX1 = micX - 18;

  // The air — a pressure wave traveling source → mic (air-canvas coords).
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
    const arr = Math.cos(om * t - 2 * Math.PI * 2.2);
    const p = Skia.Path.Make();
    const x = micX - 3 + 3 * arr;
    p.moveTo(x, mid - 7);
    p.lineTo(x, mid + 7);
    return p;
  }, [clock, mid, micX, visHz]);

  // Wire-mesh grille crosshatch (micspeaker handheld-mic idiom, scaled down).
  const micMesh = useMemo(() => {
    const p = Skia.Path.Make();
    const gr = 11;
    for (const t of [-0.6, -0.2, 0.2, 0.6]) {
      const hw = gr * Math.sqrt(1 - t * t);
      p.addOval(Skia.XYWHRect(micX - hw, mid + gr * t - 1.5, hw * 2, 3));
    }
    for (const t of [-0.5, 0, 0.5]) {
      const hh = gr * Math.sqrt(1 - t * t);
      p.addOval(Skia.XYWHRect(micX + gr * t - 1.5, mid - hh, 3, hh * 2));
    }
    return p;
  }, [micX, mid]);

  return (
    <View style={{ width: w, height: h, flexDirection: 'row' }}>
      {/* The SOURCE — the shared SpeakerConeView, firing right into the air. */}
      <SpeakerConeView clock={clock} width={spkW} height={h} visHz={visHz} amp={0.7} />
      <Canvas style={{ width: airW, height: h, backgroundColor: BG }}>
        {/* Travel axis. */}
        <SkLine p1={{ x: waveX0, y: mid }} p2={{ x: waveX1, y: mid }} color="#1c1c22" strokeWidth={1.2} />
        {/* ── The air: glowing pressure wave (cos(ωt − kx) trace). ── */}
        <GlowStroke path={trace} color={WAVE} width={2} />
        {/* ── The mic: mesh grille ball + a longer gradient BARREL behind it. ── */}
        <Circle cx={micX} cy={mid} r={17} color={ACCENT_GREEN} opacity={0.1}>
          <BlurMask blur={10} style="normal" />
        </Circle>
        <RoundedRect x={micX + 5} y={mid - 8} width={barrelRight - (micX + 5)} height={16} r={4}>
          <LinearGradient start={vec(micX + 5, mid - 8)} end={vec(micX + 5, mid + 8)} colors={[METAL_HI, METAL_MID, METAL_LO]} />
        </RoundedRect>
        {/* barrel body seam lines so it reads as a mic barrel */}
        <SkLine p1={{ x: micX + 12, y: mid - 8 }} p2={{ x: micX + 12, y: mid + 8 }} color="#0d0d10" strokeWidth={1} opacity={0.5} />
        <Circle cx={micX} cy={mid} r={11}>
          <RadialGradient c={vec(micX - 4, mid - 4)} r={19} colors={['#dde0e7', '#8a8c94', '#33343c']} />
        </Circle>
        <Path path={micMesh} color="#101116" style="stroke" strokeWidth={0.7} opacity={0.55} />
        <Circle cx={micX - 3.8} cy={mid - 4.2} r={2.6} color="#ffffff" opacity={0.4}>
          <BlurMask blur={2.5} style="normal" />
        </Circle>
        {/* Diaphragm riding the arriving pressure: green glow + crisp core. */}
        <Path path={diaphragm} color={ACCENT_GREEN} style="stroke" strokeWidth={5} opacity={0.35}>
          <BlurMask blur={4} style="normal" />
        </Path>
        <Path path={diaphragm} color={ACCENT_GREEN} style="stroke" strokeWidth={2.4} strokeCap="round" />
        <Vignette w={airW} h={h} />
      </Canvas>
    </View>
  );
}
