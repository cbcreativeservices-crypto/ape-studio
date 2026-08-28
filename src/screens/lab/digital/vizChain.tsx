/**
 * digital/vizChain — Skia visuals for Module 5 (Analog→Digital Conversion)
 * and Module 6 (Digital Processing & Formats) of the Digital Audio Sampling
 * & Conversion Lab.
 *
 * ONLY loaded via digital/skiaGate.requireVizChain() (inline require), so
 * pre-Skia clients never evaluate this file. Styled per
 * docs/APE_VISUAL_STANDARDS_2026_07_29.md: abstract data stays geometric but
 * dressed (gradient plates, glow strokes, never hairline-on-black); per-frame
 * work lives in worklet useDerivedValue on the shared phase clocks; static
 * geometry is memoized. HONESTY (§1.7): every view here is an ILLUSTRATIVE
 * MODEL — level axes are compressed for visibility where noted, the float
 * diagram is deliberately simplified (not IEEE-754 field widths), and the
 * host module badges all of it.
 *
 * CHARTER (owner): analog clipping and digital full-scale clipping are drawn
 * as SEPARATE events at separate points; sample-and-hold is presented as a
 * CONVERTER operation (never as the DAC's output waveform); the float views
 * never imply that floating point can restore information clipped before or
 * during conversion.
 */
import { useEffect, useMemo } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  DashPathEffect,
  Group,
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
import { fonts } from '../../../theme/tokens';
import { rampColors } from '../../../features/tools/levelColor';
export { usePhaseClock, useVizClock } from '../foundations/viz';

const BG = '#0c0c0f';
const GRID = '#3a3b46';
const GHOST = '#2e2f38';
const LINE = '#d7dbe2';
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREEN = '#5bff85';
const RED = '#ff6b5e';
const PLATE_HI = '#24252d';
const PLATE_LO = '#141419';
const AXIS_TEXT = '#9a9ca8';

/** Full-scale amplitude ramp for the LEVEL METERS in this file, ordered TOP
 *  (full scale, red) → BOTTOM (silence, blue). The gradient axis is mapped to
 *  the whole meter TRACK, not to the fill, so a given height always paints the
 *  same colour and the tip colour is the true level colour.
 *
 *  NOTE the trace colours above (AMBER/GREEN/BLUE) are signal IDENTITY — which
 *  stage or which path you are looking at (HELD vs CODE OUT, FLOAT vs FIXED) —
 *  not amplitude, so the amplitude standard does not govern them. It governs
 *  anything whose SIZE encodes a level. */
const METER_RAMP = rampColors(1, 8).slice().reverse();

type SkPathT = ReturnType<typeof Skia.Path.Make>;

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Glow + core stroke pair — the house treatment for abstract curves. */
function GlowStroke({
  path,
  color,
  width = 2.2,
  opacity = 1,
}: {
  path: SkPathT | SharedValue<SkPathT>;
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width * 2.6} opacity={0.2 * opacity}>
        <BlurMask blur={width * 2.1} style="normal" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} opacity={opacity} strokeJoin="round" strokeCap="round" />
    </>
  );
}

/** Deterministic 0..1 hash — worklet-safe (used for bit patterns / noise). */
function hash01(n: number): number {
  'worklet';
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
function fract(x: number): number {
  'worklet';
  return x - Math.floor(x);
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 · 1 — THE ADC CHAIN (hero)
// ═════════════════════════════════════════════════════════════════════════════

export type AdcBlockKey =
  | 'mic'
  | 'preamp'
  | 'filter'
  | 'sh'
  | 'quant'
  | 'encoder'
  | 'pcm'
  | 'conv'
  | 'data';

type WaveKind = 'raw' | 'amped' | 'smooth' | 'held' | 'snap' | 'bits' | 'stream';
type StageMeta = { key: AdcBlockKey; label: string; wave: WaveKind; color: string };

/** Full 7-block chain (STANDARD / X-RAY). */
const FULL_STAGES: StageMeta[] = [
  { key: 'mic', label: 'MIC', wave: 'raw', color: BLUE },
  { key: 'preamp', label: 'PREAMP', wave: 'amped', color: BLUE },
  { key: 'filter', label: 'AA FILT', wave: 'smooth', color: BLUE },
  { key: 'sh', label: 'S & H', wave: 'held', color: AMBER },
  { key: 'quant', label: 'QUANT', wave: 'snap', color: AMBER },
  { key: 'encoder', label: 'ENCODE', wave: 'bits', color: GREEN },
  { key: 'pcm', label: 'PCM', wave: 'stream', color: GREEN },
];
/** 4-block SIMPLIFIED chain. */
const SIMPLE_STAGES: StageMeta[] = [
  { key: 'mic', label: 'MIC', wave: 'raw', color: BLUE },
  { key: 'filter', label: 'FILTER', wave: 'smooth', color: BLUE },
  { key: 'conv', label: 'CONVERTER', wave: 'held', color: AMBER },
  { key: 'data', label: 'DATA', wave: 'stream', color: GREEN },
];

type TileLay = StageMeta & { x: number; w: number };

/** Line-art glyphs for the chain tiles — the lab's icon language. All paths
 *  in local coords (roughly −18..18 both axes); rendered inside a per-tile
 *  scaled Group so strokes scale with the tile. */
function buildGlyph(key: AdcBlockKey): { line: SkPathT; accent: SkPathT; fill: SkPathT } {
  const line = Skia.Path.Make();
  const accent = Skia.Path.Make();
  const fill = Skia.Path.Make();
  const cells = (xs: number[], bits: number[], y: number, sz: number) => {
    xs.forEach((x, i) => {
      const r = Skia.XYWHRect(x, y, sz, sz);
      if (bits[i]) fill.addRect(r);
      else line.addRect(r);
    });
  };
  switch (key) {
    case 'mic': {
      // Handheld capsule glyph: round grille + hatch, tapered body at 45°.
      line.addCircle(-5, -8, 7.2);
      line.moveTo(-10.9, -11);
      line.lineTo(0.9, -11);
      line.moveTo(-12, -6.4);
      line.lineTo(2, -6.4);
      line.moveTo(-0.6, -2.9);
      line.lineTo(8.4, 6.4);
      line.lineTo(4.4, 10.4);
      line.lineTo(-4.9, 1.4);
      line.moveTo(8.4, 6.4);
      line.quadTo(10.4, 9.4, 6.4, 12);
      line.lineTo(4.4, 10.4);
      // Incoming sound arcs.
      accent.addArc({ x: -21, y: -13, width: 8, height: 10 }, 120, 120);
      accent.addArc({ x: -25, y: -16, width: 12, height: 16 }, 120, 120);
      break;
    }
    case 'preamp': {
      // Amplifier triangle with leads and a variable-gain arrow.
      line.moveTo(-10, -10);
      line.lineTo(-10, 10);
      line.lineTo(12, 0);
      line.close();
      line.moveTo(-16, 0);
      line.lineTo(-10, 0);
      line.moveTo(12, 0);
      line.lineTo(17, 0);
      accent.moveTo(-6, 9);
      accent.lineTo(7, -8);
      accent.moveTo(7, -8);
      accent.lineTo(2.8, -7.4);
      accent.moveTo(7, -8);
      accent.lineTo(6.4, -3.8);
      break;
    }
    case 'filter': {
      // Low-pass response glyph: axes, flat passband, rolloff, cutoff dashes.
      line.moveTo(-13, -9);
      line.lineTo(-13, 10);
      line.lineTo(14, 10);
      accent.moveTo(-13, -4);
      accent.lineTo(0, -4);
      accent.cubicTo(5, -4, 5.5, 8, 10.5, 8);
      accent.moveTo(2, -8);
      accent.lineTo(2, -5);
      accent.moveTo(2, -2);
      accent.lineTo(2, 1);
      accent.moveTo(2, 4);
      accent.lineTo(2, 7);
      break;
    }
    case 'sh': {
      // Switch + hold capacitor to ground — the classic S&H cell.
      line.moveTo(-16, 2);
      line.lineTo(-8, 2);
      line.moveTo(6, 2);
      line.lineTo(16, 2);
      line.moveTo(10, 2);
      line.lineTo(10, 6.2);
      line.moveTo(6.4, 6.8);
      line.lineTo(13.6, 6.8);
      line.moveTo(6.4, 9.6);
      line.lineTo(13.6, 9.6);
      line.moveTo(10, 9.6);
      line.lineTo(10, 12);
      line.moveTo(7.6, 12.6);
      line.lineTo(12.4, 12.6);
      line.moveTo(8.8, 14.4);
      line.lineTo(11.2, 14.4);
      accent.moveTo(-8, 2);
      accent.lineTo(3.6, -6);
      fill.addCircle(-8, 2, 1.7);
      fill.addCircle(6, 2, 1.7);
      break;
    }
    case 'quant': {
      // Level rungs + a value dot snapping to the nearest rung.
      for (const y of [-10, -5, 0, 5, 10]) {
        line.moveTo(-12, y);
        line.lineTo(12, y);
      }
      fill.addCircle(-2, 1.8, 2.2);
      accent.moveTo(-2, 1.8);
      accent.lineTo(-2, 4.4);
      accent.moveTo(-2, 4.4);
      accent.lineTo(-3.6, 2.9);
      accent.moveTo(-2, 4.4);
      accent.lineTo(-0.4, 2.9);
      accent.moveTo(-12, 5);
      accent.lineTo(12, 5);
      break;
    }
    case 'encoder': {
      // Bit cells (1 = filled, 0 = hollow) over a word-frame bracket.
      cells([-14, -4, 6], [1, 0, 1], -8, 8);
      line.moveTo(-15, 4);
      line.lineTo(-15, 7.5);
      line.lineTo(15, 7.5);
      line.lineTo(15, 4);
      break;
    }
    case 'pcm':
    case 'data': {
      // A little bit stream flowing out.
      cells([-16.5, -9.5, -2.5, 4.5], [1, 0, 1, 1], -3, 6);
      accent.moveTo(12, 0);
      accent.lineTo(17.5, 0);
      accent.moveTo(17.5, 0);
      accent.lineTo(14.5, -2.4);
      accent.moveTo(17.5, 0);
      accent.lineTo(14.5, 2.4);
      break;
    }
    case 'conv': {
      // Simplified converter: measure → staircase of numbers.
      line.moveTo(-15, 7);
      line.lineTo(-8, 7);
      line.lineTo(-8, 0);
      line.lineTo(-1, 0);
      line.lineTo(-1, -7);
      line.lineTo(6, -7);
      line.lineTo(6, -2);
      line.lineTo(13, -2);
      fill.addCircle(-8, 7, 1.7);
      fill.addCircle(-1, 0, 1.7);
      fill.addCircle(6, -7, 1.7);
      break;
    }
  }
  return { line, accent, fill };
}

/**
 * AdcChainView — the Module 5 hero: MIC → PREAMP → AA FILTER → S&H →
 * QUANTIZER → ENCODER → PCM as illustrated tiles on a signal path, with an
 * energy pulse riding the path and the waveform glyph morphing per stage
 * above it. Tiles are tappable (amber ring = selected); X-RAY adds the S&H
 * hold windows, the quantizer's level rungs and the encoder's binary framing
 * drawn along the path.
 */
export function AdcChainView({
  phase,
  width,
  mode,
  selected,
  onSelect,
  onHelp,
}: {
  phase: SharedValue<number>;
  width: number;
  mode: 'simple' | 'standard' | 'xray';
  selected: AdcBlockKey | null;
  onSelect: (k: AdcBlockKey) => void;
  /** Long-press on any block opens the chain's guide (help key). */
  onHelp?: () => void;
}) {
  const w = width;
  const PAD = 8;
  const stripMid = 26;
  const stripAmp = 15;
  const tileY = 50;
  const tileH = 48;
  const labelY = tileY + tileH + 3;
  const xrayY = tileY + tileH + 20;
  const h = mode === 'xray' ? xrayY + 52 : labelY + 18;
  const pathY = tileY + tileH / 2;
  const sw = Math.max(1, w / 380);

  const stages = mode === 'simple' ? SIMPLE_STAGES : FULL_STAGES;

  const tiles = useMemo<TileLay[]>(() => {
    const n = stages.length;
    const gap = mode === 'simple' ? 14 : 7;
    const tw = (w - 2 * PAD - gap * (n - 1)) / n;
    return stages.map((s, i) => ({ ...s, x: PAD + i * (tw + gap), w: tw }));
  }, [stages, w, mode]);

  const glyphs = useMemo(() => tiles.map((t) => buildGlyph(t.key)), [tiles]);

  /** Connector segments between tiles (the signal path). */
  const connectors = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(2, pathY);
    p.lineTo(tiles[0].x, pathY);
    for (let i = 0; i < tiles.length - 1; i++) {
      p.moveTo(tiles[i].x + tiles[i].w, pathY);
      p.lineTo(tiles[i + 1].x, pathY);
    }
    p.moveTo(tiles[tiles.length - 1].x + tiles[tiles.length - 1].w, pathY);
    p.lineTo(w - 2, pathY);
    return p;
  }, [tiles, w, pathY]);

  // ── The morphing waveform strip (per-frame worklets on the phase clock) ────
  const buildStrip = (kinds: WaveKind[]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- called a fixed 3× per render
    return useDerivedValue(() => {
      const ph = phase.value;
      const p = Skia.Path.Make();
      for (const t of tiles) {
        if (!kinds.includes(t.wave)) continue;
        const x0 = t.x + 2;
        const sw2 = t.w - 4;
        const N = 22;
        if (t.wave === 'bits') {
          const cellN = 6;
          const step = sw2 / cellN;
          let prevY = 0;
          for (let i = 0; i < cellN; i++) {
            const bit = hash01(i + Math.floor(ph * 0.6) * 7) > 0.5;
            const y = stripMid + (bit ? -1 : 1) * stripAmp * 0.62;
            const xa = x0 + i * step;
            if (i === 0) p.moveTo(xa, y);
            else {
              p.lineTo(xa, prevY);
              p.lineTo(xa, y);
            }
            p.lineTo(xa + step, y);
            prevY = y;
          }
        } else if (t.wave === 'stream') {
          // handled by the fill strip below (cells); draw the carrier line
          p.moveTo(x0, stripMid);
          p.lineTo(x0 + sw2, stripMid);
        } else {
          let prevY = stripMid;
          for (let i = 0; i <= N; i++) {
            const u = i / N;
            let v = 0;
            if (t.wave === 'raw') {
              v = 0.62 * Math.sin(Math.PI * 2 * 2.1 * u + ph) + 0.28 * Math.sin(Math.PI * 2 * 5.3 * u + 1.3 + ph * 1.6);
              v *= 0.55;
            } else if (t.wave === 'amped') {
              const r = 0.62 * Math.sin(Math.PI * 2 * 2.1 * u + ph) + 0.28 * Math.sin(Math.PI * 2 * 5.3 * u + 1.3 + ph * 1.6);
              v = Math.tanh(1.5 * r);
            } else if (t.wave === 'smooth') {
              v = 0.85 * Math.sin(Math.PI * 2 * 2.1 * u + ph);
            } else if (t.wave === 'held') {
              const uq = Math.floor(u * 7) / 7;
              v = 0.85 * Math.sin(Math.PI * 2 * 2.1 * uq + ph);
            } else if (t.wave === 'snap') {
              const uq = Math.floor(u * 7) / 7;
              v = Math.round(0.85 * Math.sin(Math.PI * 2 * 2.1 * uq + ph) * 2) / 2;
            }
            const x = x0 + u * sw2;
            const y = stripMid - v * stripAmp;
            if (i === 0) p.moveTo(x, y);
            else if (t.wave === 'held' || t.wave === 'snap') {
              // staircase: horizontal run to x at the held level, then jump
              p.lineTo(x, prevY);
              p.lineTo(x, y);
            } else p.lineTo(x, y);
            prevY = y;
          }
        }
      }
      return p;
    }, [tiles, phase]);
  };
  const waveBlue = buildStrip(['raw', 'amped', 'smooth']);
  const waveAmber = buildStrip(['held', 'snap']);
  const waveGreen = buildStrip(['bits', 'stream']);

  /** Scrolling PCM cells (filled 1-bits) above the stream stage(s). */
  const streamFill = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const scroll = ph * 7;
    for (const t of tiles) {
      if (t.wave !== 'stream') continue;
      const x0 = t.x + 2;
      const sw2 = t.w - 4;
      const pitch = 9;
      const n = Math.floor(sw2 / pitch) + 1;
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * pitch - (scroll % pitch);
        const gi = i + Math.floor(scroll / pitch);
        if (x < x0 || x + 6 > x0 + sw2) continue;
        if (hash01(gi * 3.7) > 0.45) p.addRect(Skia.XYWHRect(x, stripMid - 3, 6, 6));
        else p.addRect(Skia.XYWHRect(x + 1.2, stripMid - 1.8, 3.6, 3.6));
      }
    }
    return p;
  }, [tiles, phase]);

  /** The energy pulse traveling left→right along the path. */
  const pulse = useDerivedValue(() => {
    const t = fract(phase.value / (2 * Math.PI));
    const x = PAD + t * (w - 2 * PAD);
    const p = Skia.Path.Make();
    p.addCircle(x, pathY, 3.4 * sw);
    p.moveTo(Math.max(PAD, x - 16 * sw), pathY);
    p.lineTo(x, pathY);
    return p;
  }, [phase, w, pathY, sw]);

  // ── X-RAY annotations (static per layout) ──────────────────────────────────
  const xray = useMemo(() => {
    if (mode !== 'xray') return null;
    const ticks = Skia.Path.Make();
    const holds = Skia.Path.Make();
    const rungs = Skia.Path.Make();
    const frames = Skia.Path.Make();
    const framesFill = Skia.Path.Make();
    const sh = tiles.find((t) => t.key === 'sh');
    const q = tiles.find((t) => t.key === 'quant');
    const enc = tiles.find((t) => t.key === 'encoder');
    const pcm = tiles.find((t) => t.key === 'pcm');
    let shCx = 0;
    let qCx = 0;
    let frCx = 0;
    if (sh) {
      // Hold windows: sample ticks, each holding the level until the next.
      shCx = sh.x + sh.w / 2;
      const span = Math.min(sh.w * 1.7, 86);
      const x0 = Math.max(PAD, shCx - span / 2);
      const T = span / 5;
      for (let i = 0; i < 5; i++) {
        const x = x0 + i * T;
        ticks.moveTo(x, xrayY);
        ticks.lineTo(x, xrayY + 26);
        holds.addRect(Skia.XYWHRect(x + 1, xrayY + 5 + (i % 2) * 8, T * 0.82, 9));
      }
    }
    if (q) {
      // The quantizer's level rungs.
      qCx = q.x + q.w / 2;
      const span = Math.min(q.w * 1.5, 74);
      const x0 = qCx - span / 2;
      for (let i = 0; i < 5; i++) {
        rungs.moveTo(x0, xrayY + 3 + i * 5.6);
        rungs.lineTo(x0 + span, xrayY + 3 + i * 5.6);
      }
      rungs.moveTo(x0 - 3, xrayY + 3);
      rungs.lineTo(x0 - 3, xrayY + 3 + 4 * 5.6);
    }
    if (enc && pcm) {
      // Binary framing along the path: bracketed 8-bit words.
      const x0 = enc.x + 2;
      const x1 = pcm.x + pcm.w - 2;
      frCx = (x0 + x1) / 2;
      const cell = Math.min(5.5, (x1 - x0 - 10) / 17);
      let x = x0;
      for (let f = 0; f < 2; f++) {
        frames.moveTo(x, xrayY + 2);
        frames.lineTo(x, xrayY + 20);
        for (let b = 0; b < 8; b++) {
          const bx = x + 2 + b * cell;
          if (hash01(f * 8 + b + 2.2) > 0.5) framesFill.addRect(Skia.XYWHRect(bx, xrayY + 6, cell - 1.4, cell - 1.4));
          else frames.addRect(Skia.XYWHRect(bx, xrayY + 6, cell - 1.4, cell - 1.4));
        }
        x += 2 + 8 * cell + 2;
      }
      frames.moveTo(x, xrayY + 2);
      frames.lineTo(x, xrayY + 20);
    }
    return { ticks, holds, rungs, frames, framesFill, shCx, qCx, frCx };
  }, [mode, tiles, xrayY]);

  const tileCy = tileY + tileH / 2;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Signal path + traveling energy pulse */}
        <Path path={connectors} color={GRID} style="stroke" strokeWidth={1.6 * sw} />
        {/* Morphing waveform glyph riding above the path */}
        <GlowStroke path={waveBlue} color={BLUE} width={1.7 * sw} />
        <GlowStroke path={waveAmber} color={AMBER} width={1.7 * sw} />
        <Path path={waveGreen} color={withAlpha(GREEN, 0.55)} style="stroke" strokeWidth={1.2 * sw} />
        <Path path={streamFill} color={GREEN} opacity={0.9} />
        {/* Tiles */}
        {tiles.map((t, i) => {
          const sel = selected === t.key;
          const gs = Math.min(t.w, 46) / 46;
          return (
            <Group key={t.key}>
              <RoundedRect x={t.x} y={tileY} width={t.w} height={tileH} r={7}>
                <LinearGradient start={vec(t.x, tileY)} end={vec(t.x + t.w * 0.4, tileY + tileH)} colors={[PLATE_HI, PLATE_LO]} />
              </RoundedRect>
              <RoundedRect x={t.x} y={tileY} width={t.w} height={tileH} r={7} style="stroke" strokeWidth={1} color={sel ? withAlpha(AMBER, 0.9) : GRID} />
              {sel ? (
                <RoundedRect x={t.x} y={tileY} width={t.w} height={tileH} r={7} style="stroke" strokeWidth={2.4 * sw} color={AMBER} opacity={0.5}>
                  <BlurMask blur={5} style="normal" />
                </RoundedRect>
              ) : null}
              <Group transform={[{ translateX: t.x + t.w / 2 }, { translateY: tileCy }, { scale: gs }]}>
                <Path path={glyphs[i].line} color={LINE} style="stroke" strokeWidth={1.7} strokeCap="round" strokeJoin="round" />
                <Path path={glyphs[i].accent} color={t.color} style="stroke" strokeWidth={1.7} strokeCap="round" strokeJoin="round" />
                <Path path={glyphs[i].fill} color={t.color} />
              </Group>
            </Group>
          );
        })}
        {/* Pulse drawn last so it glides over tile edges */}
        <Path path={pulse} color={AMBER} style="stroke" strokeWidth={2.6 * sw} opacity={0.35}>
          <BlurMask blur={6} style="normal" />
        </Path>
        <Path path={pulse} color={AMBER} style="stroke" strokeWidth={1.4 * sw} strokeCap="round" />
        {/* X-RAY annotations */}
        {xray ? (
          <>
            <Path path={xray.ticks} color={withAlpha(AMBER, 0.8)} style="stroke" strokeWidth={1} />
            <Path path={xray.holds} color={withAlpha(AMBER, 0.22)} />
            <Path path={xray.rungs} color={withAlpha(AMBER, 0.7)} style="stroke" strokeWidth={1} />
            <Path path={xray.frames} color={withAlpha(GREEN, 0.7)} style="stroke" strokeWidth={1} />
            <Path path={xray.framesFill} color={withAlpha(GREEN, 0.85)} />
          </>
        ) : null}
      </Canvas>
      {/* Tile labels + tap targets */}
      {tiles.map((t) => (
        <RNText
          key={`l${t.key}`}
          style={{
            position: 'absolute',
            left: t.x - 4,
            width: t.w + 8,
            top: labelY,
            textAlign: 'center',
            fontFamily: fonts.barlowCondensedSemiBold,
            fontSize: 9,
            letterSpacing: 0.4,
            color: selected === t.key ? AMBER : AXIS_TEXT,
          }}
        >
          {t.label}
        </RNText>
      ))}
      {xray ? (
        <>
          <RNText style={{ position: 'absolute', left: xray.shCx - 40, width: 80, top: xrayY + 30, textAlign: 'center', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 8.5, color: withAlpha(AMBER, 0.75) }}>
            HOLD WINDOWS
          </RNText>
          <RNText style={{ position: 'absolute', left: xray.qCx - 40, width: 80, top: xrayY + 30, textAlign: 'center', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 8.5, color: withAlpha(AMBER, 0.75) }}>
            LEVEL RUNGS
          </RNText>
          <RNText style={{ position: 'absolute', left: xray.frCx - 40, width: 80, top: xrayY + 30, textAlign: 'center', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 8.5, color: withAlpha(GREEN, 0.75) }}>
            8-BIT FRAMES
          </RNText>
        </>
      ) : null}
      {tiles.map((t) => (
        <Pressable
          key={`p${t.key}`}
          style={{ position: 'absolute', left: t.x, top: tileY - 6, width: t.w, height: tileH + 24 }}
          onPress={() => onSelect(t.key)}
          onLongPress={onHelp}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === t.key }}
          accessibilityLabel={`${t.label} block`}
        />
      ))}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 · 2 — SAMPLE-AND-HOLD demo strip
// ═════════════════════════════════════════════════════════════════════════════

/**
 * SampleHoldView — input sine (blue), the switch closing at clock ticks, the
 * held flat segments while the quantizer decides (amber), and the released
 * code (green, quantized, appearing a beat later). A CONVERTER operation —
 * the caption in the host module states this is NOT the DAC's output.
 */
export function SampleHoldView({
  phase,
  width,
  height = 158,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
}) {
  const w = width;
  const h = height;
  const PL = 10;
  const PR = 10;
  const top = 30;
  const bot = h - 24;
  const mid = (top + bot) / 2;
  const amp = (bot - top) / 2 - 6;
  const plotW = w - PL - PR;
  const TICKS = 9;
  const T = plotW / TICKS;
  const sw = Math.max(1, w / 380);

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= TICKS; i++) {
      const x = PL + i * T;
      p.moveTo(x, bot);
      p.lineTo(x, bot + 5);
      p.moveTo(x, top);
      p.lineTo(x, bot);
    }
    p.moveTo(PL, mid);
    p.lineTo(PL + plotW, mid);
    return p;
  }, [T, bot, top, mid, plotW]);

  const sigAt = (x: number, ph: number) => {
    'worklet';
    return Math.sin(((x - PL) / plotW) * Math.PI * 2 * 1.45 + ph);
  };

  /** Input: the continuous analog sine, scrolling on the phase clock. */
  const inputPath = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const x = PL + (i / N) * plotW;
      const y = mid - sigAt(x, ph) * amp;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, plotW, mid, amp]);

  /** Held: flat segments frozen at the LAST clock event (staircase). */
  const heldPath = useDerivedValue(() => {
    const ph = phase.value;
    const evPerRev = TICKS;
    const phQ = (Math.floor((ph / (2 * Math.PI)) * evPerRev) / evPerRev) * 2 * Math.PI;
    const p = Skia.Path.Make();
    for (let i = 0; i < TICKS; i++) {
      const x = PL + i * T;
      const y = mid - sigAt(x, phQ) * amp;
      p.moveTo(x, y);
      p.lineTo(x + T, y);
      if (i < TICKS - 1) {
        const yn = mid - sigAt(x + T, phQ) * amp;
        p.lineTo(x + T, yn);
      }
    }
    return p;
  }, [phase, T, mid, amp]);

  /** Code out: quantized to 8 levels, released a quarter-period later. */
  const codePath = useDerivedValue(() => {
    const ph = phase.value;
    const evPerRev = TICKS;
    const phC = (Math.floor((ph / (2 * Math.PI)) * evPerRev - 0.3) / evPerRev) * 2 * Math.PI;
    const p = Skia.Path.Make();
    for (let i = 0; i < TICKS; i++) {
      const x = PL + i * T;
      const v = Math.round(sigAt(x, phC) * 3.5) / 3.5;
      const y = mid - v * amp;
      p.moveTo(x + T * 0.3, y);
      p.lineTo(x + T, y);
    }
    return p;
  }, [phase, T, mid, amp]);

  /** The switch: snaps closed at each clock event, open while holding. */
  const switchPath = useDerivedValue(() => {
    const ph = phase.value;
    const local = fract((ph / (2 * Math.PI)) * TICKS);
    const closed = local < 0.18;
    const p = Skia.Path.Make();
    const x0 = PL + 6;
    const y0 = 14;
    p.moveTo(x0 - 6, y0);
    p.lineTo(x0, y0);
    const ang = closed ? 0 : -0.62;
    p.moveTo(x0, y0);
    p.lineTo(x0 + 13 * Math.cos(ang), y0 + 13 * Math.sin(ang));
    p.moveTo(x0 + 13, y0);
    p.lineTo(x0 + 19, y0);
    p.addCircle(x0, y0, 1.6);
    p.addCircle(x0 + 13, y0, 1.6);
    return p;
  }, [phase]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={grid} color={GHOST} style="stroke" strokeWidth={1} />
        <GlowStroke path={inputPath} color={BLUE} width={1.8 * sw} />
        <GlowStroke path={heldPath} color={AMBER} width={2 * sw} />
        <Path path={codePath} color={GREEN} style="stroke" strokeWidth={1.6 * sw} strokeCap="round" />
        <Path path={switchPath} color={AMBER} style="stroke" strokeWidth={1.5 * sw} strokeCap="round" />
      </Canvas>
      <RNText style={{ position: 'absolute', left: PL + 32, top: 8, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9, letterSpacing: 0.6, color: AMBER }}>
        SWITCH (closes at each clock tick)
      </RNText>
      <RNText style={{ position: 'absolute', right: PR, top: 8, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9, color: BLUE }}>
        INPUT <RNText style={{ color: AMBER }}> · HELD</RNText>
        <RNText style={{ color: GREEN }}> · CODE OUT</RNText>
      </RNText>
      <RNText style={{ position: 'absolute', left: PL, top: h - 15, fontFamily: fonts.mono, fontSize: 8.5, color: AXIS_TEXT }}>
        sample clock →
      </RNText>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 · 3 — GAIN STAGING into the converter (the star)
// ═════════════════════════════════════════════════════════════════════════════

/** Shared drawn-model constants (the host module mirrors these numbers for
 *  its readouts — keep in sync). */
export const GAIN_MODEL = {
  driveMin: -54,
  driveMax: 12,
  /** Analog stage rail: +3 dB above digital full scale in this drawn model. */
  railDb: 3,
  noiseDb: -60,
  /** Analog rounding becomes audible/visible above this drive. */
  analogClipDb: 0.5,
  /** The soft-clipped analog wave reaches digital full scale here. */
  digitalOverDb: 1.9,
} as const;

/**
 * GainStagingView — one input-level drive through TWO SEPARATE limits: the
 * analog stage (rounded tanh saturation at the preamp rail) and digital full
 * scale (hard flat-top at 0 dBFS). Amplitude axis is compressed (pow 0.42)
 * so the noise floor stays visible — the host badges that.
 */
export function GainStagingView({
  phase,
  width,
  height = 190,
  driveDb,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** Pre-conversion peak level the slider commands, dB re full scale. */
  driveDb: number;
}) {
  const w = width;
  const h = height;
  const PL = 8;
  const meterW = 14;
  const meterGap = 10;
  const plotR = w - (meterW * 2 + meterGap + 26);
  const plotW = plotR - PL;
  const top = 10;
  const bot = h - 48;
  const mid = (top + bot) / 2;
  const half = (bot - top) / 2;
  const rail = Math.pow(10, GAIN_MODEL.railDb / 20);
  const sw = Math.max(1, w / 380);

  const yOfLin = (v: number) => {
    'worklet';
    const m = Math.min(Math.abs(v), rail * 1.03) / rail;
    return mid - Math.sign(v) * Math.pow(m, 0.42) * half;
  };
  const fsY = mid - Math.pow(1 / rail, 0.42) * half;
  const fsY2 = mid + Math.pow(1 / rail, 0.42) * half;

  const frame = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(PL, top);
    p.lineTo(PL, bot);
    p.lineTo(plotR, bot);
    p.lineTo(plotR, top);
    p.moveTo(PL, mid);
    p.lineTo(plotR, mid);
    return p;
  }, [top, bot, mid, plotR]);

  const fsLines = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(PL, fsY);
    p.lineTo(plotR, fsY);
    p.moveTo(PL, fsY2);
    p.lineTo(plotR, fsY2);
    return p;
  }, [fsY, fsY2, plotR]);

  const railLines = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(PL, mid - half);
    p.lineTo(plotR, mid - half);
    p.moveTo(PL, mid + half);
    p.lineTo(plotR, mid + half);
    return p;
  }, [mid, half, plotR]);

  const sigAt = (u: number, ph: number) => {
    'worklet';
    return 0.72 * Math.sin(Math.PI * 2 * 2.2 * u + ph) + 0.28 * Math.sin(Math.PI * 2 * 5.8 * u + 1.1 + ph * 1.5);
  };

  /** Recorded (post analog-saturation, post digital clamp) waveform. */
  const wavePath = useDerivedValue(() => {
    const ph = phase.value;
    const g = Math.pow(10, driveDb / 20);
    const p = Skia.Path.Make();
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const s = sigAt(u, ph);
      const ya = rail * Math.tanh((g * s) / rail);
      const yd = Math.max(-1, Math.min(1, ya));
      const x = PL + u * plotW;
      const y = yOfLin(yd);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, driveDb, plotW, mid, half]);

  /** Ghost of the un-clipped signal — what the flattened peaks used to be. */
  const ghostPath = useDerivedValue(() => {
    const ph = phase.value;
    const g = Math.pow(10, driveDb / 20);
    const p = Skia.Path.Make();
    if (driveDb <= GAIN_MODEL.analogClipDb) return p;
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const s = sigAt(u, ph);
      const x = PL + u * plotW;
      const y = yOfLin(Math.max(-rail * 1.03, Math.min(rail * 1.03, g * s)));
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, driveDb, plotW, mid, half]);

  /** Red overlay on the digitally flattened segments. */
  const clipPath = useDerivedValue(() => {
    const ph = phase.value;
    const g = Math.pow(10, driveDb / 20);
    const p = Skia.Path.Make();
    const N = 120;
    let inSeg = false;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const s = sigAt(u, ph);
      const ya = rail * Math.tanh((g * s) / rail);
      const x = PL + u * plotW;
      if (Math.abs(ya) >= 0.998) {
        const y = yOfLin(Math.sign(ya));
        if (!inSeg) {
          p.moveTo(x, y);
          inSeg = true;
        } else p.lineTo(x, y);
      } else inSeg = false;
    }
    return p;
  }, [phase, driveDb, plotW, mid, half]);

  /** Analog noise floor — drawn (exaggerated) fuzz band around zero. */
  const noisePath = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 90;
    const seed = Math.floor(ph * 3);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = PL + u * plotW;
      const y = mid + (hash01(i * 1.7 + seed * 13.1) * 2 - 1) * 5;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, plotW, mid]);

  // ── Meters (static per drive — prop-driven) ───────────────────────────────
  const g = Math.pow(10, driveDb / 20);
  const analogOut = rail * Math.tanh(g / rail);
  const analogClip = driveDb > GAIN_MODEL.analogClipDb;
  const digitalOver = analogOut >= 0.999;
  const recPeakDb = 20 * Math.log10(Math.max(1e-4, Math.min(1, analogOut)));
  const mTop = top + 12;
  const mBot = bot;
  const mH = mBot - mTop;
  const aFrac = Math.max(0.02, Math.min(1, (driveDb + 60) / (60 + GAIN_MODEL.railDb + 3)));
  const dFrac = Math.max(0.02, Math.min(1, (recPeakDb + 60) / 60));
  const mAx = plotR + 14;
  const mDx = mAx + meterW + meterGap;

  const zoneY = h - 34;
  const dbToX = (db: number) => PL + ((db - GAIN_MODEL.driveMin) / (GAIN_MODEL.driveMax - GAIN_MODEL.driveMin)) * (w - PL - 8);
  const zones = useMemo(
    () => [
      { x0: dbToX(-54), x1: dbToX(-18), c: BLUE, label: 'TOO LOW' },
      { x0: dbToX(-18), x1: dbToX(-10), c: GREEN, label: 'RIGHT' },
      { x0: dbToX(-10), x1: dbToX(12), c: RED, label: 'TOO HIGH' },
    ],
    [w],
  );
  const markerX = dbToX(driveDb);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={frame} color={GHOST} style="stroke" strokeWidth={1} />
        {/* Analog rail (the preamp's own limit) — OUTSIDE digital full scale */}
        <Path path={railLines} color={withAlpha(RED, 0.4)} style="stroke" strokeWidth={1}>
          <DashPathEffect intervals={[2, 4]} />
        </Path>
        {/* Digital full scale */}
        <Path path={fsLines} color={withAlpha(RED, 0.85)} style="stroke" strokeWidth={1.1}>
          <DashPathEffect intervals={[5, 4]} />
        </Path>
        {/* Noise floor fuzz */}
        <Path path={noisePath} color={LINE} style="stroke" strokeWidth={1} opacity={0.28}>
          <BlurMask blur={1.5} style="normal" />
        </Path>
        {/* Ghost: what the clipped peaks would have been */}
        <Path path={ghostPath} color={LINE} style="stroke" strokeWidth={1} opacity={0.22}>
          <DashPathEffect intervals={[3, 3]} />
        </Path>
        {/* The recorded wave */}
        <GlowStroke path={wavePath} color={AMBER} width={2 * sw} />
        {/* Flattened tops in red */}
        <Path path={clipPath} color={RED} style="stroke" strokeWidth={3 * sw} strokeCap="round" opacity={0.95} />
        {/* Meters */}
        <RoundedRect x={mAx} y={mTop} width={meterW} height={mH} r={3} color="#17171c" />
        <RoundedRect x={mAx} y={mTop + mH * (1 - aFrac)} width={meterW} height={mH * aFrac} r={3}>
          <LinearGradient start={vec(0, mTop)} end={vec(0, mBot)} colors={METER_RAMP} />
        </RoundedRect>
        <RoundedRect x={mDx} y={mTop} width={meterW} height={mH} r={3} color="#17171c" />
        <RoundedRect x={mDx} y={mTop + mH * (1 - dFrac)} width={meterW} height={mH * dFrac} r={3}>
          <LinearGradient start={vec(0, mTop)} end={vec(0, mBot)} colors={METER_RAMP} />
        </RoundedRect>
        {/* OVER lamps */}
        {analogClip ? (
          <RoundedRect x={mAx} y={mTop - 8} width={meterW} height={5} r={2.5} color={RED}>
            <BlurMask blur={3} style="solid" />
          </RoundedRect>
        ) : (
          <RoundedRect x={mAx} y={mTop - 8} width={meterW} height={5} r={2.5} color="#26262c" />
        )}
        {digitalOver ? (
          <RoundedRect x={mDx} y={mTop - 8} width={meterW} height={5} r={2.5} color={RED}>
            <BlurMask blur={3} style="solid" />
          </RoundedRect>
        ) : (
          <RoundedRect x={mDx} y={mTop - 8} width={meterW} height={5} r={2.5} color="#26262c" />
        )}
        {/* Zone strip */}
        {zones.map((z) => (
          <RoundedRect key={z.label} x={z.x0} y={zoneY} width={z.x1 - z.x0 - 1.5} height={8} r={2} color={withAlpha(z.c, 0.3)} />
        ))}
        <RoundedRect x={Math.min(Math.max(markerX - 1.5, PL), w - 11)} y={zoneY - 3} width={3} height={14} r={1.5} color={LINE} />
      </Canvas>
      <RNText style={{ position: 'absolute', left: PL + 4, top: fsY - 11, fontFamily: fonts.mono, fontSize: 8.5, color: withAlpha(RED, 0.9) }}>
        0 dBFS (digital full scale)
      </RNText>
      <RNText style={{ position: 'absolute', left: PL + 4, top: top - 1, fontFamily: fonts.mono, fontSize: 8.5, color: withAlpha(RED, 0.55) }}>
        analog rail
      </RNText>
      <RNText style={{ position: 'absolute', left: PL + 4, top: mid + 6, fontFamily: fonts.mono, fontSize: 8.5, color: AXIS_TEXT }}>
        noise floor (drawn)
      </RNText>
      <RNText style={{ position: 'absolute', left: mAx - 6, width: meterW + 12, top: mBot + 2, textAlign: 'center', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 8.5, color: AXIS_TEXT }}>
        ANLG
      </RNText>
      <RNText style={{ position: 'absolute', left: mDx - 6, width: meterW + 12, top: mBot + 2, textAlign: 'center', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 8.5, color: AXIS_TEXT }}>
        DIG
      </RNText>
      {zones.map((z) => (
        <RNText
          key={z.label}
          style={{
            position: 'absolute',
            left: (z.x0 + z.x1) / 2 - 34,
            width: 68,
            top: zoneY + 12,
            textAlign: 'center',
            fontFamily: fonts.barlowCondensedSemiBold,
            fontSize: 9,
            letterSpacing: 0.5,
            color: withAlpha(z.c, 0.95),
          }}
        >
          {z.label}
        </RNText>
      ))}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 · 1 — INT vs FLOAT number-line strip
// ═════════════════════════════════════════════════════════════════════════════

/**
 * IntFloatRangeView — fixed-point formats end hard at full scale; float's
 * usable range dwarfs the whole strip (dB-scaled, deliberately truncated —
 * the host badges it). The amber band is where audio actually lives.
 */
export function IntFloatRangeView({ width, height = 148 }: { width: number; height?: number }) {
  const w = width;
  const h = height;
  const PL = 74;
  const PR = 26;
  const plotW = w - PL - PR;
  const DB_MIN = -200;
  const DB_MAX = 200;
  const xOf = (db: number) => PL + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * plotW;
  const rows = useMemo(
    () => [
      { label: '16-BIT INT', lo: -96, hi: 0, c: BLUE, note: '96 dB' },
      { label: '24-BIT INT', lo: -144, hi: 0, c: BLUE, note: '144 dB' },
      { label: '32-BIT INT', lo: -192, hi: 0, c: BLUE, note: '192 dB' },
      { label: '32-BIT FLOAT', lo: DB_MIN - 20, hi: DB_MAX + 20, c: GREEN, note: '±770 dB' },
    ],
    [],
  );
  const rowY = (i: number) => 14 + i * 26;
  const axisY = rowY(4) + 4;

  const staticPaths = useMemo(() => {
    const ticks = Skia.Path.Make();
    for (const db of [-200, -150, -100, -50, 0, 50, 100, 150, 200]) {
      ticks.moveTo(xOf(db), axisY);
      ticks.lineTo(xOf(db), axisY + 4);
    }
    const arrows = Skia.Path.Make();
    const y = rowY(3) + 5;
    arrows.moveTo(PL - 8, y);
    arrows.lineTo(PL - 2, y - 4);
    arrows.moveTo(PL - 8, y);
    arrows.lineTo(PL - 2, y + 4);
    arrows.moveTo(w - PR + 8, y);
    arrows.lineTo(w - PR + 2, y - 4);
    arrows.moveTo(w - PR + 8, y);
    arrows.lineTo(w - PR + 2, y + 4);
    return { ticks, arrows };
  }, [w, axisY]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* The audio window: where real program material lives */}
        <RoundedRect x={xOf(-60)} y={6} width={xOf(0) - xOf(-60)} height={axisY - 8} r={4} color={withAlpha(AMBER, 0.1)} />
        {/* Full-scale ceiling — the hard wall for every INT format */}
        <RoundedRect x={xOf(0) - 0.75} y={6} width={1.5} height={axisY - 8} r={0.75} color={withAlpha(RED, 0.8)} />
        {rows.map((r, i) => {
          const x0 = Math.max(PL - 6, xOf(r.lo));
          const x1 = Math.min(w - PR + 6, xOf(r.hi));
          return (
            <Group key={r.label}>
              <RoundedRect x={x0} y={rowY(i)} width={x1 - x0} height={10} r={5}>
                <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={[withAlpha(r.c, 0.16), withAlpha(r.c, 0.6)]} />
              </RoundedRect>
              <RoundedRect x={x0} y={rowY(i)} width={x1 - x0} height={10} r={5} style="stroke" strokeWidth={1} color={withAlpha(r.c, 0.7)} />
              {r.hi === 0 ? <RoundedRect x={xOf(0) - 1.5} y={rowY(i) - 2} width={3} height={14} r={1.5} color={RED} /> : null}
            </Group>
          );
        })}
        <Path path={staticPaths.ticks} color={GRID} style="stroke" strokeWidth={1} />
        <Path path={staticPaths.arrows} color={GREEN} style="stroke" strokeWidth={1.4} strokeCap="round" />
      </Canvas>
      {rows.map((r, i) => (
        <RNText key={r.label} style={{ position: 'absolute', left: 4, width: PL - 10, top: rowY(i), textAlign: 'left', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9, letterSpacing: 0.3, color: r.c === GREEN ? GREEN : '#9fb6dd' }}>
          {r.label}
        </RNText>
      ))}
      {[-200, -100, 0, 100, 200].map((db) => (
        <RNText key={db} style={{ position: 'absolute', left: xOf(db) - 20, width: 40, top: axisY + 6, textAlign: 'center', fontFamily: fonts.mono, fontSize: 8.5, color: AXIS_TEXT }}>
          {db > 0 ? `+${db}` : `${db}`}
        </RNText>
      ))}
      <RNText style={{ position: 'absolute', left: xOf(-30) - 44, width: 88, top: 8, textAlign: 'center', fontFamily: fonts.barlowCondensedSemiBold, fontSize: 8.5, color: withAlpha(AMBER, 0.85) }}>
        AUDIO WINDOW
      </RNText>
      <RNText style={{ position: 'absolute', left: xOf(0) - 2, top: axisY - 12, fontFamily: fonts.mono, fontSize: 8.5, color: withAlpha(RED, 0.9) }}>
        0 dBFS
      </RNText>
      <RNText style={{ position: 'absolute', right: 2, top: rowY(3), fontFamily: fonts.mono, fontSize: 8.5, color: GREEN }}>
        …
      </RNText>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 · 2 — FLOAT VISUALIZER (sign · exponent · mantissa, simplified)
// ═════════════════════════════════════════════════════════════════════════════

/** Conceptual decomposition used by FloatView (decimal decades, NOT IEEE-754
 *  binary fields — the host badges "SIMPLIFIED"). */
export function floatFields(value01: number): { sign: 1 | -1; exp: number; mant: number; value: number } {
  const signed = (value01 - 0.5) * 2;
  const sign: 1 | -1 = signed < 0 ? -1 : 1;
  const mag01 = Math.min(1, Math.abs(signed));
  const mag = Math.pow(10, -3 + mag01 * 3.6); // 0.001 .. ~4.0
  const exp = Math.max(-3, Math.min(0, Math.floor(Math.log10(mag))));
  const mant = mag / Math.pow(10, exp);
  return { sign, exp, mant, value: sign * mag };
}

export function FloatView({ width, value01, height = 128 }: { width: number; value01: number; height?: number }) {
  const w = width;
  const h = height;
  const f = floatFields(value01);
  const boxY = 26;
  const boxH = 46;
  const signW = 42;
  const expX = signW + 18;
  const expW = Math.max(84, (w - expX - 10) * 0.38);
  const mantX = expX + expW + 10;
  const mantW = w - mantX - 10;
  const notchW = (expW - 16) / 4;
  const activeNotch = f.exp + 3; // -3..0 → 0..3
  const mantFrac = (f.mant - 1) / 9;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* SIGN box */}
        <RoundedRect x={8} y={boxY} width={signW} height={boxH} r={7}>
          <LinearGradient start={vec(8, boxY)} end={vec(8, boxY + boxH)} colors={[PLATE_HI, PLATE_LO]} />
        </RoundedRect>
        <RoundedRect x={8} y={boxY} width={signW} height={boxH} r={7} style="stroke" strokeWidth={1.2} color={f.sign < 0 ? withAlpha(RED, 0.8) : withAlpha(GREEN, 0.8)} />
        {/* EXPONENT box + decade notches */}
        <RoundedRect x={expX} y={boxY} width={expW} height={boxH} r={7}>
          <LinearGradient start={vec(expX, boxY)} end={vec(expX, boxY + boxH)} colors={[PLATE_HI, PLATE_LO]} />
        </RoundedRect>
        <RoundedRect x={expX} y={boxY} width={expW} height={boxH} r={7} style="stroke" strokeWidth={1.2} color={withAlpha(BLUE, 0.7)} />
        {[0, 1, 2, 3].map((i) => (
          <Group key={i}>
            {i === activeNotch ? (
              <RoundedRect x={expX + 8 + i * notchW} y={boxY + 8} width={notchW - 5} height={14} r={3} color={BLUE} opacity={0.5}>
                <BlurMask blur={4} style="normal" />
              </RoundedRect>
            ) : null}
            <RoundedRect x={expX + 8 + i * notchW} y={boxY + 8} width={notchW - 5} height={14} r={3} color={i === activeNotch ? BLUE : '#1b1b21'} />
          </Group>
        ))}
        {/* MANTISSA box + sliding fill */}
        <RoundedRect x={mantX} y={boxY} width={mantW} height={boxH} r={7}>
          <LinearGradient start={vec(mantX, boxY)} end={vec(mantX, boxY + boxH)} colors={[PLATE_HI, PLATE_LO]} />
        </RoundedRect>
        <RoundedRect x={mantX} y={boxY} width={mantW} height={boxH} r={7} style="stroke" strokeWidth={1.2} color={withAlpha(AMBER, 0.7)} />
        <RoundedRect x={mantX + 8} y={boxY + 10} width={mantW - 16} height={10} r={5} color="#1b1b21" />
        <RoundedRect x={mantX + 8} y={boxY + 10} width={Math.max(4, (mantW - 16) * mantFrac)} height={10} r={5}>
          <LinearGradient start={vec(mantX + 8, 0)} end={vec(mantX + mantW - 8, 0)} colors={[withAlpha(AMBER, 0.35), AMBER]} />
        </RoundedRect>
      </Canvas>
      <RNText style={{ position: 'absolute', left: 8, top: 12, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9, letterSpacing: 0.6, color: AXIS_TEXT }}>SIGN</RNText>
      <RNText style={{ position: 'absolute', left: expX, top: 12, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9, letterSpacing: 0.6, color: AXIS_TEXT }}>EXPONENT (decade)</RNText>
      <RNText style={{ position: 'absolute', left: mantX, top: 12, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9, letterSpacing: 0.6, color: AXIS_TEXT }}>MANTISSA (slides 1→10)</RNText>
      <RNText style={{ position: 'absolute', left: 8, width: signW, top: boxY + 10, textAlign: 'center', fontFamily: fonts.mono, fontSize: 22, color: f.sign < 0 ? RED : GREEN }}>
        {f.sign < 0 ? '−' : '+'}
      </RNText>
      {[0, 1, 2, 3].map((i) => (
        <RNText key={i} style={{ position: 'absolute', left: expX + 8 + i * notchW - 3, width: notchW, top: boxY + 26, textAlign: 'center', fontFamily: fonts.mono, fontSize: 9, color: i === activeNotch ? BLUE : AXIS_TEXT }}>
          {`10${['⁻³', '⁻²', '⁻¹', '⁰'][i]}`}
        </RNText>
      ))}
      <RNText style={{ position: 'absolute', left: mantX + 8, top: boxY + 26, fontFamily: fonts.mono, fontSize: 11, color: AMBER }}>
        {f.mant.toFixed(2)}
      </RNText>
      <RNText style={{ position: 'absolute', left: 8, top: boxY + boxH + 10, fontFamily: fonts.mono, fontSize: 12.5, color: LINE }}>
        {`value = ${f.sign < 0 ? '−' : '+'}${f.mant.toFixed(2)} × 10^${f.exp}  =  ${f.value >= 0 ? '+' : ''}${f.value.toFixed(4)}`}
      </RNText>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 · 3 — GAIN ABOVE ZERO (the star)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * FloatHeadroomView — the same over-zero bus drawn through two fates, side
 * by side: the FLOAT INTERNAL PATH keeps the waveform intact above the 0 dBFS
 * line (trim −gain restores it perfectly — animated), while the FIXED-POINT
 * RENDER flat-tops at full scale, and trimming afterwards only yields a
 * quieter CLIPPED wave. Float never restores what was clipped before it.
 */
export function FloatHeadroomView({
  phase,
  width,
  height = 208,
  gainDb,
  trim,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** Push applied to the −6 dBFS mix (0..12 → bus peaks −6..+6 dBFS). */
  gainDb: number;
  /** When true, a −gain trim is applied downstream (animated). */
  trim: boolean;
}) {
  const w = width;
  const h = height;
  const paneW = (w - 24) / 2;
  const x0 = 8;
  const x1 = 16 + paneW;
  const top = 22;
  const plotH = 118;
  const bot = top + plotH;
  const mid = (top + bot) / 2;
  const half = plotH / 2 - 2;
  const DISP = 2.25; // linear display ceiling (supports +6 dBFS peaks)
  const fsOff = (1 / DISP) * half;
  const meterY = bot + 14;
  const meterH = 10;
  const sw = Math.max(1, w / 380);

  const trimSv = useSharedValue(trim ? 1 : 0);
  useEffect(() => {
    trimSv.value = withTiming(trim ? 1 : 0, { duration: 750, easing: Easing.inOut(Easing.cubic) });
  }, [trim, trimSv]);

  const sigAt = (u: number, ph: number) => {
    'worklet';
    return 0.62 * Math.sin(Math.PI * 2 * 1.8 * u + ph) + 0.38 * Math.sin(Math.PI * 2 * 3.4 * u + 2.1 + ph * 1.4);
  };

  /** Float bus: intact wave (gain, then animated trim — restores perfectly). */
  const floatPath = useDerivedValue(() => {
    const ph = phase.value;
    const gLin = Math.pow(10, gainDb / 20);
    const tLin = Math.pow(10, (-gainDb * trimSv.value) / 20);
    const p = Skia.Path.Make();
    const N = 74;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const v = 0.5 * sigAt(u, ph) * gLin * tLin;
      const x = x0 + u * paneW;
      const y = mid - (v / DISP) * half;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, gainDb, trimSv, paneW, mid, half]);

  /** Fixed render: clamped at full scale FIRST, then trimmed — still flat. */
  const fixedPath = useDerivedValue(() => {
    const ph = phase.value;
    const gLin = Math.pow(10, gainDb / 20);
    const tLin = Math.pow(10, (-gainDb * trimSv.value) / 20);
    const p = Skia.Path.Make();
    const N = 74;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const v = Math.max(-1, Math.min(1, 0.5 * sigAt(u, ph) * gLin)) * tLin;
      const x = x1 + u * paneW;
      const y = mid - (v / DISP) * half;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, gainDb, trimSv, paneW, mid, half]);

  /** The fixed pane's flattened segments, highlighted red (persist post-trim). */
  const fixedClip = useDerivedValue(() => {
    const ph = phase.value;
    const gLin = Math.pow(10, gainDb / 20);
    const tLin = Math.pow(10, (-gainDb * trimSv.value) / 20);
    const p = Skia.Path.Make();
    const N = 74;
    let inSeg = false;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const raw = 0.5 * sigAt(u, ph) * gLin;
      const x = x1 + u * paneW;
      if (Math.abs(raw) > 1) {
        const y = mid - ((Math.sign(raw) * tLin) / DISP) * half;
        if (!inSeg) {
          p.moveTo(x, y);
          inSeg = true;
        } else p.lineTo(x, y);
      } else inSeg = false;
    }
    return p;
  }, [phase, gainDb, trimSv, paneW, mid, half]);

  /** Meter fills (animate through the trim). */
  const meterDb = (db: number) => Math.max(0.02, Math.min(1, (db + 24) / 33));
  const floatMeter = useDerivedValue(() => {
    const db = -6 + gainDb * (1 - trimSv.value);
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x0, meterY, paneW * Math.max(0.02, Math.min(1, (db + 24) / 33)), meterH), 3, 3));
    return p;
  }, [gainDb, trimSv, paneW, meterY]);
  const fixedMeter = useDerivedValue(() => {
    const db = Math.min(0, -6 + gainDb) - gainDb * trimSv.value;
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x1, meterY, paneW * Math.max(0.02, Math.min(1, (db + 24) / 33)), meterH), 3, 3));
    return p;
  }, [gainDb, trimSv, paneW, meterY]);

  const statics = useMemo(() => {
    const fs = Skia.Path.Make();
    for (const px of [x0, x1]) {
      fs.moveTo(px, mid - fsOff);
      fs.lineTo(px + paneW, mid - fsOff);
      fs.moveTo(px, mid + fsOff);
      fs.lineTo(px + paneW, mid + fsOff);
    }
    const zeroMarks = Skia.Path.Make();
    for (const px of [x0, x1]) {
      const zx = px + paneW * meterDb(0);
      zeroMarks.moveTo(zx, meterY - 3);
      zeroMarks.lineTo(zx, meterY + meterH + 3);
    }
    // Clip region for the "over full scale" amber highlight (float pane).
    const overClip = Skia.Path.Make();
    overClip.addRect(Skia.XYWHRect(x0, top, paneW, mid - fsOff - top));
    overClip.addRect(Skia.XYWHRect(x0, mid + fsOff, paneW, bot - (mid + fsOff)));
    return { fs, zeroMarks, overClip };
  }, [x0, x1, paneW, mid, fsOff, top, bot, meterY]);

  const busDb = -6 + gainDb;
  const floatOver = busDb > 0.01 && !trim;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Pane plates */}
        {[x0, x1].map((px) => (
          <RoundedRect key={px} x={px - 3} y={top - 4} width={paneW + 6} height={plotH + 8} r={7} style="stroke" strokeWidth={1} color={GHOST} />
        ))}
        {/* 0 dBFS lines */}
        <Path path={statics.fs} color={withAlpha(RED, 0.8)} style="stroke" strokeWidth={1.1}>
          <DashPathEffect intervals={[5, 4]} />
        </Path>
        {/* FLOAT pane: intact wave (blue → green as the trim restores it) */}
        <GlowStroke path={floatPath} color={trim ? GREEN : BLUE} width={1.9 * sw} />
        {/* Over-zero portion highlighted amber (clipped region of the display) */}
        <Group clip={statics.overClip}>
          <Path path={floatPath} color={AMBER} style="stroke" strokeWidth={2.4 * sw} strokeCap="round" />
        </Group>
        {/* FIXED pane: flat-topped wave + red flats */}
        <GlowStroke path={fixedPath} color={AMBER} width={1.9 * sw} />
        <Path path={fixedClip} color={RED} style="stroke" strokeWidth={3 * sw} strokeCap="round" />
        {/* Meters */}
        {[x0, x1].map((px) => (
          <RoundedRect key={`m${px}`} x={px} y={meterY} width={paneW} height={meterH} r={3} color="#17171c" />
        ))}
        {/* Amplitude ramp across each meter's full track (blue at silence →
            red at full scale), so the fill's tip is the true level colour.
            METER_RAMP is ordered loud→quiet, so run the axis right→left. */}
        <Path path={floatMeter} opacity={0.9}>
          <LinearGradient start={vec(x0 + paneW, 0)} end={vec(x0, 0)} colors={METER_RAMP} />
        </Path>
        <Path path={fixedMeter} opacity={0.9}>
          <LinearGradient start={vec(x1 + paneW, 0)} end={vec(x1, 0)} colors={METER_RAMP} />
        </Path>
        <Path path={statics.zeroMarks} color={withAlpha(RED, 0.85)} style="stroke" strokeWidth={1.2} />
      </Canvas>
      <RNText style={{ position: 'absolute', left: x0, width: paneW, top: 6, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9.5, letterSpacing: 0.6, color: trim ? GREEN : BLUE }}>
        FLOAT INTERNAL PATH
      </RNText>
      <RNText style={{ position: 'absolute', left: x1, width: paneW, top: 6, fontFamily: fonts.barlowCondensedSemiBold, fontSize: 9.5, letterSpacing: 0.6, color: AXIS_TEXT }}>
        FIXED-POINT RENDER (24-BIT)
      </RNText>
      <RNText style={{ position: 'absolute', left: x0 + 3, top: mid - fsOff - 12, fontFamily: fonts.mono, fontSize: 8.5, color: withAlpha(RED, 0.85) }}>
        0 dBFS
      </RNText>
      <RNText style={{ position: 'absolute', left: x0, width: paneW, top: meterY + meterH + 4, fontFamily: fonts.mono, fontSize: 9, color: floatOver ? AMBER : GREEN }}>
        {trim ? `restored: ${(-6).toFixed(1)} dBFS — intact` : `bus peak: ${busDb >= 0 ? '+' : ''}${busDb.toFixed(1)} dBFS`}
      </RNText>
      <RNText style={{ position: 'absolute', left: x1, width: paneW, top: meterY + meterH + 4, fontFamily: fonts.mono, fontSize: 9, color: busDb > 0.01 ? RED : GREEN }}>
        {busDb > 0.01 ? (trim ? 'quieter — still clipped' : 'flat-topped at 0.0 dBFS') : `peak: ${busDb.toFixed(1)} dBFS`}
      </RNText>
    </View>
  );
}
