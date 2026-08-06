/**
 * Digital Lab viz — Modules 7 & 8 (D-to-A Reconstruction · Errors & Limits).
 *
 * THE LAB'S HEART. Module 7 kills the staircase myth: sample values describe a
 * band-limited signal, and the DAC + reconstruction filter produce a
 * CONTINUOUS analog waveform via band-limited interpolation — never straight
 * lines between dots, never stair steps as the final output. The ZOH steps
 * are drawn deliberately utilitarian (an INTERMEDIATE stage), while the
 * reconstructed output is the hero — and it lies exactly on the ghost of the
 * original analog input below Nyquist (the money shot).
 *
 * HONESTY (§1.7): all spectra here are DRAWN (illustrative mirror math, not
 * measurements); the jitter view's timing deviation is exaggerated ~×1000 for
 * visibility. Host panels badge both. For the sine content used everywhere in
 * these views the exact band-limited reconstruction IS the sine itself, so
 * the hero curve is computed honestly — no fake smoothing.
 *
 * ONLY loaded via skiaGate.requireVizDac() — the sole Skia import path for
 * the module-7/8 pair; pre-Skia clients never evaluate this file.
 * Per-frame work in useDerivedValue worklets on the phase clock; static
 * geometry in useMemo; strokes scale off the drawn size (VISUAL STANDARDS
 * 2026-07-29: abstract data stays abstract, but styled — glow, gradient
 * underfills, mono numerals).
 */
import { useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Line as SkLine,
  LinearGradient,
  Path,
  Skia,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { usePhaseClock } from '../foundations/viz';
import { fonts } from '../../../theme/tokens';
export { usePhaseClock, useVizClock } from '../foundations/viz';

const BG = '#0c0c0f';
const GRID = '#3a3b46';
const GHOST = '#2e2f38';
const WAVE = '#ffc64d'; // hero amber — the reconstructed CONTINUOUS output
const BLUE = '#6fa8ff'; // stored sample values
const GREEN = '#5bff85'; // good / filter response
const RED = '#ff6b5e'; // danger: over-full-scale, jitter error
const STEEL = '#8a8c94'; // utilitarian ZOH steps — deliberately not glamorous
const LABEL = '#9a9ca8';

/** JS-side deterministic hash (module scope — mirrors foundations/viz). */
function hashJs(n: number): number {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** House glow stroke: wide blurred halo under a crisp core (micspeaker idiom). */
function GlowStroke({
  path,
  color,
  width = 2.4,
  opacity = 1,
}: {
  path: SkPath | SharedValue<SkPath>;
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

const tiny = {
  position: 'absolute' as const,
  fontFamily: fonts.oswaldSemiBold,
  fontSize: 8,
  letterSpacing: 0.8,
  color: LABEL,
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7 · ReconstructionView — the four-layer hero
//
// ① SAMPLES (stored values: dots + stems) · ② ZOH (stepped intermediate,
// dim/utilitarian) · ③ RECONSTRUCTED (band-limited output, hero-bright,
// passing THROUGH the dots and visibly clearing the step corners) ·
// ④ ORIGINAL (soft wide ghost of the pre-ADC analog — the amber core rides
// exactly inside it below Nyquist).
//
// For this sine content the exact band-limited reconstruction IS the sine, so
// layers ③ and ④ share one honestly-computed curve: the reconstruction
// overlays the original EXACTLY — that identity is the money shot, drawn as
// a bright core inside a soft halo.

export function ReconstructionView({
  width,
  running,
  height = 178,
  showSamples,
  showZoh,
  showRecon,
  showOriginal,
  xray,
}: {
  width: number;
  running: boolean;
  height?: number;
  showSamples: boolean;
  showZoh: boolean;
  showRecon: boolean;
  showOriginal: boolean;
  /** X-RAY adds the DAC clock ticks + a reconstruction-filter response inset. */
  xray: boolean;
}) {
  const phase = usePhaseClock(running, 0.42);
  const w = width;
  const h = height;
  const mid = h / 2;
  const amp = h * 0.3;
  const x0 = 8;
  const x1 = w - 8;
  const CYC = 2.0; // cycles across the window → 8.5 samples/cycle (well-sampled)
  const NS = 17; // sample instants
  const k = (2 * Math.PI * CYC) / (x1 - x0);
  const xs = useMemo(
    () => Array.from({ length: NS }, (_, n) => x0 + (n / (NS - 1)) * (x1 - x0)),
    [x1],
  );

  // ③/④ — the continuous band-limited curve (exact for sine content).
  const recon = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 150;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (i / N) * (x1 - x0);
      const y = mid - amp * Math.sin(ph - k * (x - x0));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, x1, mid, amp, k]);

  // ② — zero-order hold: each value HELD until the next clock edge. Corners
  // deliberately square; the smooth curve visibly never touches them.
  const zoh = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    for (let n = 0; n < xs.length; n++) {
      const y = mid - amp * Math.sin(ph - k * (xs[n] - x0));
      if (n === 0) p.moveTo(xs[0], y);
      else p.lineTo(xs[n], y);
      if (n < xs.length - 1) p.lineTo(xs[n + 1], y);
    }
    return p;
  }, [phase, xs, mid, amp, k]);

  // ① — stems + dots (two paths: stroke vs fill).
  const stems = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    for (let n = 0; n < xs.length; n++) {
      const y = mid - amp * Math.sin(ph - k * (xs[n] - x0));
      p.moveTo(xs[n], mid);
      p.lineTo(xs[n], y);
    }
    return p;
  }, [phase, xs, mid, amp, k]);
  const dots = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    for (let n = 0; n < xs.length; n++) {
      const y = mid - amp * Math.sin(ph - k * (xs[n] - x0));
      p.addCircle(xs[n], y, 3.4);
    }
    return p;
  }, [phase, xs, mid, amp, k]);

  // X-ray chrome (static): DAC clock ticks + filter-response inset.
  const clockTicks = useMemo(() => {
    const p = Skia.Path.Make();
    for (const x of xs) {
      p.moveTo(x, h - 10);
      p.lineTo(x, h - 4);
    }
    return p;
  }, [xs, h]);
  const inset = useMemo(() => {
    const bx = w - 88;
    const by = 6;
    const bw = 80;
    const bh = 34;
    const box = Skia.Path.Make();
    box.addRRect(Skia.RRectXY(Skia.XYWHRect(bx, by, bw, bh), 4, 4));
    const curve = Skia.Path.Make();
    // Lowpass response: flat passband, then the analog rolloff.
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const resp = t < 0.55 ? 1 : Math.pow(Math.cos(Math.min(1, (t - 0.55) / 0.4) * (Math.PI / 2)), 2);
      const x = bx + 6 + t * (bw - 12);
      const y = by + bh - 7 - resp * (bh - 14);
      if (i === 0) curve.moveTo(x, y);
      else curve.lineTo(x, y);
    }
    return { box, curve };
  }, [w]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <SkLine p1={{ x: 0, y: mid }} p2={{ x: w, y: mid }} color={GRID} strokeWidth={1.1} />
        {/* ④ ORIGINAL — soft wide ghost of the pre-ADC analog. */}
        {showOriginal ? (
          <Path path={recon} color="#aeb4c0" style="stroke" strokeWidth={7} opacity={0.3}>
            <BlurMask blur={4.5} style="normal" />
          </Path>
        ) : null}
        {/* ② ZOH — utilitarian, dim, square-cornered. An intermediate, not the output. */}
        {showZoh ? <Path path={zoh} color={STEEL} style="stroke" strokeWidth={1.6} opacity={0.75} /> : null}
        {/* ① SAMPLES — the stored values. */}
        {showSamples ? <Path path={stems} color={withAlpha(BLUE, 0.4)} style="stroke" strokeWidth={1.2} /> : null}
        {/* ③ RECONSTRUCTED — hero-bright, THROUGH the dots, riding exactly
            inside the original's halo. */}
        {showRecon ? <GlowStroke path={recon} color={WAVE} width={2.6} /> : null}
        {showSamples ? <Path path={dots} color={BLUE} /> : null}
        {xray ? <Path path={clockTicks} color={GREEN} style="stroke" strokeWidth={1.4} opacity={0.8} /> : null}
        {xray ? (
          <>
            <Path path={inset.box} color="#101017" />
            <Path path={inset.box} color={GRID} style="stroke" strokeWidth={1.1} />
            <Path path={inset.curve} color={GREEN} style="stroke" strokeWidth={1.6} />
          </>
        ) : null}
      </Canvas>
      {xray ? (
        <>
          <RNText style={[tiny, { left: 8, top: h - 22 }]}>DAC CLOCK</RNText>
          <RNText style={[tiny, { right: 12, top: 8, color: withAlpha(GREEN, 0.85) }]}>RECON LPF</RNText>
        </>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7 · DacChainStrip — PCM DATA → CLOCKED VALUES → DAC ELEMENT →
// STEPPED INTERMEDIATE → RECONSTRUCTION FILTER → ANALOG OUT, with the
// step→smooth transition drawn AT the filter block and a signal pulse
// flowing the length of the chain.

const CHAIN_LABELS = ['PCM DATA', 'CLOCKED VALUES', 'DAC ELEMENT', 'STEPPED', 'RECON FILTER', 'ANALOG OUT'];

export function DacChainStrip({ width, running, height = 76 }: { width: number; running: boolean; height?: number }) {
  const phase = usePhaseClock(running, 0.16);
  const w = width;
  const h = height;
  const pad = 4;
  const gap = 7;
  const bw = (w - pad * 2 - gap * 5) / 6;
  const by = 8;
  const bh = h - 16;
  const cy = by + bh / 2;
  const bx = (i: number) => pad + i * (bw + gap);

  const chrome = useMemo(() => {
    const boxes = Skia.Path.Make();
    const arrows = Skia.Path.Make();
    for (let i = 0; i < 6; i++) {
      boxes.addRRect(Skia.RRectXY(Skia.XYWHRect(bx(i), by, bw, bh), 5, 5));
      if (i < 5) {
        const ax = bx(i) + bw;
        arrows.moveTo(ax + 1, cy);
        arrows.lineTo(ax + gap - 1, cy);
        arrows.moveTo(ax + gap - 3.5, cy - 2.5);
        arrows.lineTo(ax + gap - 1, cy);
        arrows.lineTo(ax + gap - 3.5, cy + 2.5);
      }
    }
    return { boxes, arrows };
  }, [w, h]);

  // Static glyphs (all inside useMemo — nothing per-frame).
  const glyphs = useMemo(() => {
    const m = 8; // glyph margin inside a block
    const gx = (i: number) => bx(i) + m;
    const gw = bw - m * 2;
    const gTop = by + 9;
    const gBot = by + bh - 9;
    const gMid = cy;
    const gAmp = (gBot - gTop) / 2;

    // 0 · PCM DATA — a bit field (filled = 1, hollow = 0).
    const bits1 = Skia.Path.Make();
    const bits0 = Skia.Path.Make();
    const cols = 4;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = Math.min(gw / cols, (gBot - gTop) / rows) - 2.5;
        const x = gx(0) + (c + 0.5) * (gw / cols) - s / 2;
        const y = gTop + (r + 0.5) * ((gBot - gTop) / rows) - s / 2;
        (hashJs(r * 7.3 + c * 13.1) > 0.5 ? bits1 : bits0).addRect(Skia.XYWHRect(x, y, s, s));
      }
    }

    // 1 · CLOCKED VALUES — lollipop samples on a clock baseline.
    const clocked = Skia.Path.Make();
    const clockedDots = Skia.Path.Make();
    clocked.moveTo(gx(1), gBot);
    clocked.lineTo(gx(1) + gw, gBot);
    for (let n = 0; n < 5; n++) {
      const x = gx(1) + ((n + 0.5) / 5) * gw;
      const y = gMid - gAmp * 0.8 * Math.sin((n / 5) * Math.PI * 2 + 0.6);
      clocked.moveTo(x, gBot);
      clocked.lineTo(x, y);
      clockedDots.addCircle(x, y, 2);
    }

    // 2 · DAC ELEMENT — the converter triangle.
    const dac = Skia.Path.Make();
    dac.moveTo(gx(2), gTop + 1);
    dac.lineTo(gx(2) + gw, gMid);
    dac.lineTo(gx(2), gBot - 1);
    dac.close();

    // 3 · STEPPED INTERMEDIATE — the mini ZOH staircase.
    const step = Skia.Path.Make();
    for (let n = 0; n < 6; n++) {
      const xA = gx(3) + (n / 6) * gw;
      const xB = gx(3) + ((n + 1) / 6) * gw;
      const y = gMid - gAmp * 0.85 * Math.sin((n / 6) * Math.PI * 2 + 0.5);
      if (n === 0) step.moveTo(xA, y);
      else step.lineTo(xA, y);
      step.lineTo(xB, y);
    }

    // 4 · RECONSTRUCTION FILTER — the step→smooth transition happens HERE:
    // stepped on the way in, continuous on the way out.
    const filtIn = Skia.Path.Make();
    const filtOut = Skia.Path.Make();
    const half = gw / 2;
    for (let n = 0; n < 3; n++) {
      const xA = gx(4) + (n / 3) * half;
      const xB = gx(4) + ((n + 1) / 3) * half;
      const y = gMid - gAmp * 0.85 * Math.sin((n / 3) * Math.PI * 2 + 0.5);
      if (n === 0) filtIn.moveTo(xA, y);
      else filtIn.lineTo(xA, y);
      filtIn.lineTo(xB, y);
    }
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = gx(4) + half + t * half;
      const y = gMid - gAmp * 0.85 * Math.sin(t * Math.PI * 2 + 0.5);
      if (i === 0) filtOut.moveTo(x, y);
      else filtOut.lineTo(x, y);
    }

    // 5 · ANALOG OUT — the continuous waveform.
    const out = Skia.Path.Make();
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = gx(5) + t * gw;
      const y = gMid - gAmp * 0.85 * Math.sin(t * Math.PI * 2 + 0.5);
      if (i === 0) out.moveTo(x, y);
      else out.lineTo(x, y);
    }
    return { bits1, bits0, clocked, clockedDots, dac, step, filtIn, filtOut, out };
  }, [w, h]);

  // The traveling signal pulse — one pass per phase revolution, eased.
  const pulseX = useDerivedValue(() => {
    const t = (phase.value / (2 * Math.PI)) % 1;
    const e = t * t * (3 - 2 * t); // smoothstep ease — no linear teleport
    return pad + 4 + e * (w - pad * 2 - 8);
  }, [phase, w]);

  return (
    <View style={{ width: w }}>
      <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
        <Path path={chrome.boxes} color="#111118" />
        <Path path={chrome.boxes} color={GRID} style="stroke" strokeWidth={1.1} />
        <Path path={chrome.arrows} color={LABEL} style="stroke" strokeWidth={1.2} />
        <Path path={glyphs.bits1} color={BLUE} opacity={0.9} />
        <Path path={glyphs.bits0} color={BLUE} style="stroke" strokeWidth={1} opacity={0.55} />
        <Path path={glyphs.clocked} color={withAlpha(BLUE, 0.55)} style="stroke" strokeWidth={1.2} />
        <Path path={glyphs.clockedDots} color={BLUE} />
        <Path path={glyphs.dac} color={STEEL} style="stroke" strokeWidth={1.5} />
        <Path path={glyphs.step} color={STEEL} style="stroke" strokeWidth={1.5} />
        <Path path={glyphs.filtIn} color={STEEL} style="stroke" strokeWidth={1.3} opacity={0.8} />
        <GlowStroke path={glyphs.filtOut} color={WAVE} width={1.7} />
        <GlowStroke path={glyphs.out} color={WAVE} width={2} />
        <Circle cx={pulseX} cy={cy} r={3.2} color={WAVE} opacity={0.9}>
          <BlurMask blur={3.2} style="normal" />
        </Circle>
        <Circle cx={pulseX} cy={cy} r={1.7} color="#fff2cf" />
      </Canvas>
      <View style={{ flexDirection: 'row', paddingHorizontal: pad, marginTop: 2 }}>
        {CHAIN_LABELS.map((l, i) => (
          <RNText
            key={l}
            style={{
              width: bw,
              marginRight: i < 5 ? gap : 0,
              textAlign: 'center',
              fontFamily: fonts.oswaldSemiBold,
              fontSize: 8,
              letterSpacing: 0.3,
              color: i >= 4 ? withAlpha(WAVE, 0.85) : LABEL,
            }}
          >
            {l}
          </RNText>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7 · ImagesView — frequency domain: baseband + spectral images around
// fs and 2fs (mirror math), the reconstruction filter's response, and the
// surviving output. Oversampling slides the images away and the drawn filter
// visibly relaxes from a cliff to a gentle slope. DRAWN SPECTRA (badged by
// the host): the √f axis compression keeps the audio band readable while the
// images travel far right.

const IMG_FMAX = 17.6; // axis span, units of the base sample rate
const IMG_B = 0.45; // audio band edge (~21.6 kHz at 48 k), units of base fs

export function ImagesView({ width, os, height = 158 }: { width: number; os: 1 | 2 | 4 | 8; height?: number }) {
  const w = width;
  const h = height;
  const padL = 8;
  const baseY = h - 20;
  const humpH = baseY - 18;
  const xOf = (f: number) => padL + Math.sqrt(Math.max(0, f) / IMG_FMAX) * (w - padL - 6);
  const ampAt = (u: number) => Math.pow(Math.cos(Math.min(1, Math.abs(u)) * (Math.PI / 2)), 0.75);

  const paths = useMemo(() => {
    // Baseband hump (0..B) — fill + stroke.
    const base = Skia.Path.Make();
    base.moveTo(xOf(0), baseY - humpH * ampAt(0));
    const NB = 50;
    for (let i = 1; i <= NB; i++) {
      const f = (i / NB) * IMG_B;
      base.lineTo(xOf(f), baseY - humpH * ampAt(f / IMG_B));
    }
    const baseFill = base.copy();
    baseFill.lineTo(xOf(IMG_B), baseY);
    baseFill.lineTo(xOf(0), baseY);
    baseFill.close();

    // Spectral images around os·fs and 2·os·fs (the sampled signal's mirrors).
    const images = Skia.Path.Make();
    const imagesFill = Skia.Path.Make();
    for (const m of [1, 2]) {
      const c = m * os;
      if (c - IMG_B > IMG_FMAX) continue;
      const fill = Skia.Path.Make();
      let started = false;
      const N = 60;
      for (let i = 0; i <= N; i++) {
        const f = c - IMG_B + (i / N) * (2 * IMG_B);
        if (f < 0 || f > IMG_FMAX) continue;
        const y = baseY - humpH * 0.92 * ampAt((f - c) / IMG_B);
        if (!started) {
          images.moveTo(xOf(f), y);
          fill.moveTo(xOf(f), baseY);
          fill.lineTo(xOf(f), y);
          started = true;
        } else {
          images.lineTo(xOf(f), y);
          fill.lineTo(xOf(f), y);
        }
      }
      fill.lineTo(xOf(Math.min(IMG_FMAX, c + IMG_B)), baseY);
      fill.close();
      imagesFill.addPath(fill);
    }

    // Reconstruction filter response: unity through the audio band, down to
    // zero by the first image's lower edge (os·fs − B). At 1× that is a
    // cliff; at 8× a long gentle slope — the whole argument.
    const filter = Skia.Path.Make();
    const roll0 = IMG_B;
    const roll1 = Math.max(IMG_B + 0.06, os - IMG_B);
    const NF = 130;
    for (let i = 0; i <= NF; i++) {
      const f = (i / NF) * IMG_FMAX;
      const resp =
        f <= roll0 ? 1 : f >= roll1 ? 0 : 0.5 + 0.5 * Math.cos(((f - roll0) / (roll1 - roll0)) * Math.PI);
      const x = xOf(f);
      const y = baseY - resp * humpH * 0.98;
      if (i === 0) filter.moveTo(x, y);
      else filter.lineTo(x, y);
    }

    // Axis + ticks at 0, band edge, os·fs, 2·os·fs.
    const axis = Skia.Path.Make();
    axis.moveTo(0, baseY);
    axis.lineTo(w, baseY);
    for (const f of [0, IMG_B, os, 2 * os]) {
      if (f > IMG_FMAX) continue;
      axis.moveTo(xOf(f), baseY);
      axis.lineTo(xOf(f), baseY + 5);
    }
    return { base, baseFill, images, imagesFill, filter, axis };
  }, [w, h, os]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={paths.axis} color={GRID} style="stroke" strokeWidth={1.2} />
        {/* Images: what sampling mirrored around the (oversampled) rate. */}
        <Path path={paths.imagesFill} color={withAlpha(RED, 0.13)} />
        <Path path={paths.images} color={withAlpha(RED, 0.6)} style="stroke" strokeWidth={1.5} />
        {/* Surviving output = the baseband, hero-lit. */}
        <Path path={paths.baseFill}>
          <LinearGradient start={vec(0, baseY - humpH)} end={vec(0, baseY)} colors={[withAlpha(WAVE, 0.3), withAlpha(WAVE, 0.02)]} />
        </Path>
        <GlowStroke path={paths.base} color={WAVE} width={2.2} />
        {/* The analog reconstruction filter's response. */}
        <GlowStroke path={paths.filter} color={GREEN} width={1.8} opacity={0.9} />
      </Canvas>
      <RNText style={[tiny, { left: padL, top: 2 }]}>DRAWN SPECTRUM · √f AXIS</RNText>
      <RNText style={[tiny, { left: Math.max(padL, xOf(IMG_B) - 14), top: h - 13, fontFamily: fonts.mono }]}>20k</RNText>
      <RNText style={[tiny, { left: xOf(os) - 10, top: h - 13, fontFamily: fonts.mono, color: withAlpha(RED, 0.85) }]}>
        {os === 1 ? 'fs' : `${os}fs`}
      </RNText>
      {2 * os <= IMG_FMAX ? (
        <RNText style={[tiny, { left: xOf(2 * os) - 12, top: h - 13, fontFamily: fonts.mono, color: withAlpha(RED, 0.85) }]}>
          {`${2 * os}fs`}
        </RNText>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7 · IspView — inter-sample peaks. A near-Nyquist sine whose SAMPLES
// are normalized to −0.1 dBFS (the "safe" master a sample meter approves),
// while the reconstructed CONTINUOUS waveform arcs above the 0 dBFS line
// between them. Exact math for a pure sine: sample peak depends on where the
// samples land in phase; the true peak is the sine's amplitude. The module
// computes the same numbers for its readouts (ISP_* constants shared by
// convention — 16 drawn samples, −0.1 dBFS sample-peak normalization).

export function IspView({
  width,
  running,
  ratio,
  phaseDeg,
  height = 172,
}: {
  width: number;
  running: boolean;
  /** Signal frequency as a fraction of fs (~0.40–0.49). */
  ratio: number;
  /** Where the sampling grid lands on the sine (0–180°). */
  phaseDeg: number;
  height?: number;
}) {
  const pulse = usePhaseClock(running, 1.1);
  const w = width;
  const h = height;
  const mid = h / 2;
  const yFS = h * 0.3; // 0 dBFS in px
  const NS = 16;
  const x0 = 8;
  const sp = (w - 16) / (NS - 1);

  const geo = useMemo(() => {
    const phi = (phaseDeg * Math.PI) / 180;
    const target = Math.pow(10, -0.1 / 20); // sample-peak normalization: −0.1 dBFS
    let maxSin = 0;
    for (let n = 0; n < NS; n++) maxSin = Math.max(maxSin, Math.abs(Math.sin(2 * Math.PI * ratio * n + phi)));
    const gain = target / Math.max(1e-6, maxSin); // sine amplitude in FS units
    const A = yFS * gain;

    const curve = Skia.Path.Make();
    const over = Skia.Path.Make(); // the arcs beyond ±0 dBFS
    let overOpen = false;
    let peakX = x0;
    let peakV = 0;
    const N = 260;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (i / N) * (w - 16);
      const v = gain * Math.sin(2 * Math.PI * ratio * ((x - x0) / sp) + phi); // FS units
      const y = mid - yFS * v;
      if (i === 0) curve.moveTo(x, y);
      else curve.lineTo(x, y);
      if (Math.abs(v) > 1) {
        if (!overOpen) {
          over.moveTo(x, y);
          overOpen = true;
        } else over.lineTo(x, y);
      } else overOpen = false;
      if (Math.abs(v) > Math.abs(peakV)) {
        peakV = v;
        peakX = x;
      }
    }

    const stems = Skia.Path.Make();
    const dots = Skia.Path.Make();
    for (let n = 0; n < NS; n++) {
      const x = x0 + n * sp;
      const y = mid - A * Math.sin(2 * Math.PI * ratio * n + phi);
      stems.moveTo(x, mid);
      stems.lineTo(x, y);
      dots.addCircle(x, y, 3);
    }
    return { curve, over, stems, dots, peakX, peakY: mid - yFS * peakV, clip: gain > 1 };
  }, [w, h, ratio, phaseDeg, mid, yFS, sp]);

  // Breathing marker on the true peak — red when it exceeds 0 dBFS. Capture
  // plain numbers only (never the geo object — it holds Skia host objects).
  const peakX = geo.peakX;
  const peakY = geo.peakY;
  const marker = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.addCircle(peakX, peakY, 4.4 + 1.5 * Math.sin(pulse.value));
    return p;
  }, [pulse, peakX, peakY]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <SkLine p1={{ x: 0, y: mid }} p2={{ x: w, y: mid }} color={GHOST} strokeWidth={1} />
        {/* The 0 dBFS ceilings — the lines a sample meter swears were never crossed. */}
        <SkLine p1={{ x: 0, y: mid - yFS }} p2={{ x: w, y: mid - yFS }} color={withAlpha(RED, 0.55)} strokeWidth={1.3} />
        <SkLine p1={{ x: 0, y: mid + yFS }} p2={{ x: w, y: mid + yFS }} color={withAlpha(RED, 0.55)} strokeWidth={1.3} />
        <Path path={geo.stems} color={withAlpha(GREEN, 0.35)} style="stroke" strokeWidth={1.2} />
        <GlowStroke path={geo.curve} color={WAVE} width={2.2} />
        {/* The reconstruction rising ABOVE full scale between legal samples. */}
        <GlowStroke path={geo.over} color={RED} width={2.8} />
        <Path path={geo.dots} color={GREEN} />
        <Path path={marker} color={geo.clip ? RED : WAVE} style="stroke" strokeWidth={1.6} />
      </Canvas>
      <RNText style={[tiny, { left: 8, top: mid - yFS - 12, color: withAlpha(RED, 0.85), fontFamily: fonts.mono }]}>0 dBFS</RNText>
      <RNText style={[tiny, { left: 8, top: 2, color: withAlpha(GREEN, 0.8) }]}>SAMPLES (METER SEES)</RNText>
      <RNText style={[tiny, { right: 8, top: 2, color: withAlpha(WAVE, 0.9) }]}>RECONSTRUCTED (DAC MAKES)</RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8 · JitterView — clocking. Top strip: ideal equally-spaced sampling
// instants. Below: the same instants with (exaggerated ~×1000) timing
// deviation. On the waveform, each timing error becomes a VALUE error whose
// size scales with the local slope: error ≈ slope × Δt — steep signal, big
// whisker; flat signal, none. Honest framing lives in the host panel.

export function JitterView({
  width,
  running,
  amount,
  mode,
  height = 198,
}: {
  width: number;
  running: boolean;
  /** 0..1 — jitter amount (drawn exaggerated; host badges the ×1000). */
  amount: number;
  mode: 'random' | 'periodic';
  height?: number;
}) {
  const phase = usePhaseClock(running, 0.32);
  const w = width;
  const h = height;
  const NT = 13;
  const x0 = 10;
  const xs = useMemo(() => Array.from({ length: NT }, (_, n) => x0 + (n / (NT - 1)) * (w - 20)), [w]);
  const MAXD = 11; // px — the exaggerated deviation at amount = 1
  const deltas = useMemo(
    () =>
      xs.map((_, n) =>
        mode === 'random' ? (hashJs(n * 127.3 + 7.7) * 2 - 1) * MAXD * amount : Math.sin((n / NT) * Math.PI * 5) * MAXD * amount,
      ),
    [xs, amount, mode],
  );

  const yIdeal = 16;
  const yJit = 44;
  const waveTop = 72;
  const mid = waveTop + (h - waveTop - 10) / 2;
  const amp = (h - waveTop - 10) * 0.42;
  const k = (2 * Math.PI * 1.7) / (w - 20);

  const strips = useMemo(() => {
    const ideal = Skia.Path.Make();
    const jit = Skia.Path.Make();
    const drift = Skia.Path.Make();
    for (let n = 0; n < xs.length; n++) {
      ideal.moveTo(xs[n], yIdeal - 6);
      ideal.lineTo(xs[n], yIdeal + 6);
      jit.moveTo(xs[n] + deltas[n], yJit - 6);
      jit.lineTo(xs[n] + deltas[n], yJit + 6);
      drift.moveTo(xs[n], yIdeal + 6);
      drift.lineTo(xs[n] + deltas[n], yJit - 6);
    }
    return { ideal, jit, drift };
  }, [xs, deltas]);

  const wave = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 150;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (i / N) * (w - 20);
      const y = mid - amp * Math.sin(ph - k * (x - x0));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, w, mid, amp, k]);

  // Amplitude-error whiskers: value read at the WRONG instant vs the right
  // one. Biggest where the wave is steepest — error ≈ slope × Δt, live.
  const whiskers = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    for (let n = 0; n < xs.length; n++) {
      const yI = mid - amp * Math.sin(ph - k * (xs[n] - x0));
      const yJ = mid - amp * Math.sin(ph - k * (xs[n] + deltas[n] - x0));
      p.moveTo(xs[n], yI);
      p.lineTo(xs[n], yJ);
      p.addCircle(xs[n], yJ, 2.5);
    }
    return p;
  }, [phase, xs, deltas, mid, amp, k]);
  const idealDots = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    for (let n = 0; n < xs.length; n++) {
      p.addCircle(xs[n], mid - amp * Math.sin(ph - k * (xs[n] - x0)), 2);
    }
    return p;
  }, [phase, xs, mid, amp, k]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <SkLine p1={{ x: x0, y: yIdeal }} p2={{ x: w - 10, y: yIdeal }} color={GHOST} strokeWidth={1} />
        <SkLine p1={{ x: x0, y: yJit }} p2={{ x: w - 10, y: yJit }} color={GHOST} strokeWidth={1} />
        <Path path={strips.ideal} color={GREEN} style="stroke" strokeWidth={1.6} opacity={0.9} />
        <Path path={strips.drift} color={withAlpha(RED, 0.3)} style="stroke" strokeWidth={1} />
        <Path path={strips.jit} color={RED} style="stroke" strokeWidth={1.6} opacity={0.9} />
        <SkLine p1={{ x: 0, y: mid }} p2={{ x: w, y: mid }} color={GHOST} strokeWidth={1} />
        <GlowStroke path={wave} color={WAVE} width={2.2} />
        <Path path={whiskers} color={RED} style="stroke" strokeWidth={1.6} />
        <Path path={idealDots} color={BLUE} />
      </Canvas>
      <RNText style={[tiny, { left: x0, top: 0, color: withAlpha(GREEN, 0.8) }]}>IDEAL CLOCK</RNText>
      <RNText style={[tiny, { left: x0, top: 54, color: withAlpha(RED, 0.85) }]}>WITH JITTER (EXAGGERATED)</RNText>
      <RNText style={[tiny, { right: 10, top: waveTop - 12 }]}>VALUE ERROR ≈ SLOPE × TIMING ERROR</RNText>
    </View>
  );
}
