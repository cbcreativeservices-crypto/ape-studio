/**
 * cymatics/vizLiquid — the Faraday dish, drawn (spec §1.4, §3 liquid views).
 * ONLY loaded through skiaGate.requireVizLiquid().
 *
 * VISUAL STANDARDS (2026-07-29): the RIG view is the real apparatus — a
 * loudspeaker-style shaker, a coupling platform on its rod, the shallow dish
 * with its liquid layer and a lamp — never a diagram of boxes. The top views
 * render the liquid itself: a lit, glossy surface, the Academy height ramp,
 * contour lines, the classic light-through-water caustic web, or a plain
 * scientific greyscale.
 *
 * PERFORMANCE: the two standing-wave BASIS fields (A = the pattern, B = its
 * quadrature partner or the competing pattern) are sampled once per control
 * change by faraday.sampleSurface. Every frame a reanimated worklet composes
 * h = env·(wA·A + wB·B) — the stage decides the weights (standing: cos·A;
 * travelling: cos·A + sin·B; competing: a slow crossfade; chaos: two drifting
 * envelopes) — shades a 36×36 RGBA buffer and hands Skia a tiny SkImage that
 * is drawn with LINEAR sampling into the dish, so the upscale is smooth for
 * free. No React state in the loop; nothing per-frame on the JS thread.
 *
 * TIME: the real surface oscillates at f/2 (or f before onset) — far too fast
 * to see — so the display is STROBED to ~1.4 Hz (0.3 Hz in slow motion) and
 * the host says so. The platform in the RIG view bobs at twice the surface
 * rate, i.e. at the drive frequency: the subharmonic relationship, visible.
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import {
  AlphaType,
  Canvas,
  Circle,
  ColorType,
  FilterMode,
  Group,
  Image as SkiaImage,
  Line as SkLine,
  LinearGradient,
  MipmapMode,
  Oval,
  Path,
  RadialGradient,
  Rect,
  Skia,
  Vertices,
  vec,
  type SkImage,
} from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { heatColor } from '../../../features/tools/levelColor';
import type { LiquidSpec, LiquidState, Stage } from '../../../features/cymatics/faraday';
import { colors, fonts } from '../../../theme/tokens';

export type LiquidViewMode = 'rig' | 'surface' | 'height' | 'contours' | 'refraction' | 'mono' | 'liquid3d' | 'section';

export const LIQUID_VIEW_LABELS: Record<LiquidViewMode, string> = {
  rig: 'THE RIG',
  surface: 'LIQUID SURFACE',
  height: 'HEIGHT MAP',
  contours: 'CONTOURS',
  refraction: 'REFRACTION',
  mono: 'MONOCHROME',
  liquid3d: '3D SURFACE',
  section: 'CROSS-SECTION',
};

const STAGE_CODE: Record<Stage, number> = { flat: 0, damped: 0, sloshing: 1, ripples: 1, onset: 2, stable: 2, transition: 3, mixed: 4, unstable: 5, chaotic: 6, splash: 7 };
const VIEW_CODE: Record<LiquidViewMode, number> = { rig: 0, surface: 1, height: 2, contours: 3, refraction: 4, mono: 5, liquid3d: 6, section: 7 };

// ── worklet helpers ──────────────────────────────────────────────────────────
function hashW(n: number): number {
  'worklet';
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return s - Math.floor(s);
}
/** The Academy field ramp (levelColor.ts FIELD_STOPS, level order) with the
 *  black floor of heatColor — worklet copy so the UI thread can shade. */
function rampW(t: number): [number, number, number] {
  'worklet';
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  // stops: blue #2f74ff → green #3fae52 → yellow #e8c341 → orange #e6902f → red #ff5f4e
  const R = [47, 63, 232, 230, 255];
  const G = [116, 174, 195, 144, 95];
  const B = [255, 82, 65, 47, 78];
  const p = x * 4;
  const i = p >= 4 ? 3 : Math.floor(p);
  const f = p - i;
  const k = x < 0.1 ? x / 0.1 : 1;
  return [(R[i] + (R[i + 1] - R[i]) * f) * k, (G[i] + (G[i + 1] - G[i]) * f) * k, (B[i] + (B[i + 1] - B[i]) * f) * k];
}
/** Stage → (wA, wB) blend weights at strobed response phase t and raw time tr. */
function weightsW(stage: number, blend: number, t: number, tr: number): [number, number] {
  'worklet';
  const w = Math.cos(2 * Math.PI * t);
  if (stage <= 2) return [w, 0];
  if (stage === 3) return [w * (1 - blend), w * blend];
  if (stage === 4) {
    const b = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.18 * tr);
    return [w * (1 - b), w * b];
  }
  if (stage === 5) return [Math.cos(2 * Math.PI * t), Math.sin(2 * Math.PI * t)];
  return [w * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.7 * tr)), Math.cos(2 * Math.PI * t + 1.2) * (0.6 + 0.4 * Math.cos(2 * Math.PI * 0.9 * tr))];
}
function hexRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

export type LiquidViewProps = {
  width: number;
  height: number;
  spec: LiquidSpec;
  state: LiquidState;
  gridA: Float32Array;
  gridB: Float32Array;
  N: number;
  view: LiquidViewMode;
  running: boolean;
  slowMo: boolean;
  driveHz: number;
  accelG: number;
  displacementUm: number;
  /** Liquid base colour + how glossy it renders. */
  tint: string;
  gloss: number;
  sectionY: number;
  dragTarget: 'section' | null;
  onSection?: (y01: number) => void;
};

export function LiquidView(p: LiquidViewProps) {
  const { width, height, spec, state, gridA, gridB, N, view } = p;
  const circle = spec.shape === 'circle' || spec.shape === 'ring';
  const aspect = spec.shape === 'rect' ? Math.max(0.5, Math.min(1, spec.aspect)) : 1;
  const pad = 14;
  const availW = width - pad * 2;
  const availH = height - pad * 2;
  const is3d = view === 'liquid3d';
  const isSection = view === 'section';
  const isRig = view === 'rig';
  const dishW = Math.min(availW, availH / aspect) * (is3d ? 0.8 : isSection ? 0.7 : 1);
  const dishH = dishW * aspect;
  const ox = (width - dishW) / 2;
  const oy = (height - dishH) / 2 + (is3d ? dishH * 0.06 : isSection ? -height * 0.13 : 0);

  // ── clocks ───────────────────────────────────────────────────────────────
  const clock = useSharedValue(0); // response cycles (strobed)
  const raw = useSharedValue(0); // seconds
  const rate = useSharedValue(1.4);
  const runningSV = useSharedValue(p.running);
  useEffect(() => {
    rate.value = p.slowMo ? 0.3 : 1.4;
    runningSV.value = p.running;
  }, [p.slowMo, p.running, rate, runningSV]);
  const cb = useFrameCallback((info) => {
    const dt = Math.min(info.timeSincePreviousFrame ?? 16, 48) / 1000;
    if (!runningSV.value) return;
    clock.value += dt * rate.value;
    raw.value += dt;
  }, false);
  useEffect(() => {
    cb.setActive(true);
    return () => cb.setActive(false);
  }, [cb]);

  // ── shared state for the worklets ────────────────────────────────────────
  const gridASV = useSharedValue(gridA);
  const gridBSV = useSharedValue(gridB);
  const envSV = useSharedValue(state.envelope);
  const stageSV = useSharedValue(STAGE_CODE[state.stage]);
  const blendSV = useSharedValue(state.blend);
  const viewSV = useSharedValue(VIEW_CODE[view]);
  const glossSV = useSharedValue(p.gloss);
  const tintSV = useSharedValue(hexRgb(p.tint));
  const sectionYSV = useSharedValue(p.sectionY);
  useEffect(() => {
    gridASV.value = gridA;
    gridBSV.value = gridB;
  }, [gridA, gridB, gridASV, gridBSV]);
  useEffect(() => {
    envSV.value = state.envelope;
    stageSV.value = STAGE_CODE[state.stage];
    blendSV.value = state.blend;
  }, [state, envSV, stageSV, blendSV]);
  useEffect(() => {
    viewSV.value = VIEW_CODE[view];
    glossSV.value = p.gloss;
    tintSV.value = hexRgb(p.tint);
    sectionYSV.value = p.sectionY;
  }, [view, p.gloss, p.tint, p.sectionY, viewSV, glossSV, tintSV, sectionYSV]);

  // ── the per-frame surface image (top views) ──────────────────────────────
  const surface = useDerivedValue<SkImage | null>(() => {
    const v = viewSV.value;
    if (v === 0 || v === 6) return null; // rig / 3D draw themselves
    const A = gridASV.value;
    const B = gridBSV.value;
    const n = N;
    if (A.length !== n * n || B.length !== n * n) return null;
    const [wA, wB] = weightsW(stageSV.value, blendSV.value, clock.value, raw.value);
    const env = envSV.value;
    const gloss = glossSV.value;
    const tint = tintSV.value;
    const jitter = stageSV.value >= 7 ? 0.25 : 0;
    const fr = raw.value;
    // Composite field first (needed for gradients / Laplacian).
    const h = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) {
      const a = A[i];
      if (a !== a) {
        h[i] = NaN;
        continue;
      }
      const b = B[i] !== B[i] ? 0 : B[i];
      let val = env * (wA * a + wB * b);
      if (jitter > 0) val += (hashW(fr * 3.1 + i * 0.37) - 0.5) * jitter;
      h[i] = val;
    }
    const px = new Uint8Array(n * n * 4);
    // Light from the upper-left, elevated; viewer straight above.
    const lx = -0.45;
    const ly = -0.6;
    const lz = 0.66;
    const hx = lx;
    const hy = ly;
    const hz = lz + 1;
    const hn = Math.sqrt(hx * hx + hy * hy + hz * hz);
    const slope = 3.2; // height→slope gain for shading (visual exaggeration)
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const idx = j * n + i;
        const c = h[idx];
        const o = idx * 4;
        if (c !== c) {
          px[o] = 0;
          px[o + 1] = 0;
          px[o + 2] = 0;
          px[o + 3] = 0;
          continue;
        }
        const l = i > 0 && h[idx - 1] === h[idx - 1] ? h[idx - 1] : c;
        const r = i < n - 1 && h[idx + 1] === h[idx + 1] ? h[idx + 1] : c;
        const u = j > 0 && h[idx - n] === h[idx - n] ? h[idx - n] : c;
        const d = j < n - 1 && h[idx + n] === h[idx + n] ? h[idx + n] : c;
        let R = 0;
        let G = 0;
        let Bc = 0;
        if (v === 1) {
          // Lit glossy surface.
          const nx = -(r - l) * slope;
          const ny = -(d - u) * slope;
          const nl = Math.sqrt(nx * nx + ny * ny + 1);
          const ndl = Math.max(0, (nx * lx + ny * ly + lz) / nl);
          const ndh = Math.max(0, (nx * hx + ny * hy + hz) / (nl * hn));
          const spec = Math.pow(ndh, 48) * gloss;
          const depthShade = 1 + 0.25 * c; // crests lighter, troughs darker
          const base = 0.28 + 0.72 * ndl;
          R = tint[0] * base * depthShade + 255 * spec;
          G = tint[1] * base * depthShade + 255 * spec;
          Bc = tint[2] * base * depthShade + 255 * spec;
        } else if (v === 2 || v === 7) {
          const rgb = rampW(Math.abs(c));
          R = rgb[0];
          G = rgb[1];
          Bc = rgb[2];
          if (v === 7) {
            R *= 0.6;
            G *= 0.6;
            Bc *= 0.6;
          }
        } else if (v === 4) {
          // Caustics: light focuses where the surface is concave.
          //
          // The 5-point Laplacian of a fixed surface scales as 1/n^2 with the
          // sample count, so the old linear (n / 24) under-read the curvature
          // badly once the grid went to N = 64 — the web all but vanished.
          // Scale by n^2 (864 = 36^2 / 1.5, the factor this was tuned at) and it
          // is resolution-independent (owner debug 2026-09-17).
          const lap = (l + r + u + d - 4 * c) * ((n * n) / 864);
          const inten = 0.5 / (1 + 0.9 * lap);
          const k = Math.max(0, Math.min(1.6, inten));
          // A FLAT surface gives lap = 0, hence k = 0.5 exactly — and the old
          // threshold of 0.45 sat BELOW that, so every still pixel got a
          // constant white wash and the liquid read mid-grey instead of dark.
          // The knee now starts just above the flat value: flat is truly dark,
          // and only real focusing lights the web up.
          const web = Math.max(0, k - 0.52) * 3;
          R = 8 + tint[0] * 0.22 * k + 255 * web;
          G = 14 + tint[1] * 0.22 * k + 250 * web;
          Bc = 22 + tint[2] * 0.22 * k + 235 * web;
        } else {
          // Monochrome scientific / contour base.
          const g = 128 + 110 * c;
          const dim = v === 3 ? 0.55 : 1;
          R = g * dim;
          G = g * dim;
          Bc = g * dim;
        }
        px[o] = R > 255 ? 255 : R < 0 ? 0 : R;
        px[o + 1] = G > 255 ? 255 : G < 0 ? 0 : G;
        px[o + 2] = Bc > 255 ? 255 : Bc < 0 ? 0 : Bc;
        px[o + 3] = 255;
      }
    }
    const data = Skia.Data.fromBytes(px);
    return Skia.Image.MakeImage({ width: n, height: n, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul }, data, n * 4);
  }, [N]);

  // ── static contour paths (of the primary basis) ──────────────────────────
  const contours = useMemo(() => {
    const pos = Skia.PathBuilder.Make();
    const neg = Skia.PathBuilder.Make();
    if (view !== 'contours') return { pos: pos.detach(), neg: neg.detach() };
    // DECAY COMPENSATION (owner debug 2026-09-17): only the centre rings drew,
    // because a dish mode is a Bessel function — it decays outward, so the outer
    // rings never reached a fixed ±0.3 / ±0.65 level. Normalise by a smoothed
    // RADIAL envelope before contouring: zero crossings (the nodal rings, which
    // are the physics on show) are untouched, but every ring now reaches the
    // levels. For a rectangular dish the modes do not decay, the envelope comes
    // out flat, and this is a no-op.
    // ONE level per sign. Once the radial normalisation above makes every ring
    // reach full scale, six levels drew ~60 concentric bands and the dish read
    // as a solid dartboard — denser, but no more legible than the old version
    // that drew almost nothing. One amber line down each crest ring and one blue
    // line down each trough ring is exactly what the view promises.
    const levels = [-0.55, 0.55];
    const n = N;
    const cw = dishW / n;
    const ch = dishH / n;
    const BINS = 24;
    const env = new Float32Array(BINS);
    const mid = (n - 1) / 2;
    const rMax = Math.SQRT2 * mid;
    const binOf = (i: number, j: number) => {
      const dx = i - mid;
      const dy = j - mid;
      const b = Math.floor((Math.sqrt(dx * dx + dy * dy) / rMax) * BINS);
      return b < 0 ? 0 : b >= BINS ? BINS - 1 : b;
    };
    let gmax = 0;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const v = gridA[j * n + i];
        if (Number.isNaN(v)) continue;
        const a = Math.abs(v);
        if (a > gmax) gmax = a;
        const b = binOf(i, j);
        if (a > env[b]) env[b] = a;
      }
    }
    // Smooth the envelope and floor it, so a near-empty bin cannot blow small
    // numerical noise up into a spurious ring.
    const floor = Math.max(1e-6, gmax * 0.15);
    const sm = new Float32Array(BINS);
    for (let b = 0; b < BINS; b++) {
      const a = env[b > 0 ? b - 1 : 0];
      const c = env[b];
      const d = env[b < BINS - 1 ? b + 1 : BINS - 1];
      sm[b] = Math.max(floor, (a + 2 * c + d) / 4);
    }
    const at = (i: number, j: number) => gridA[j * n + i] / sm[binOf(i, j)];
    const lerp = (a: number, b: number, c: number) => (c - a) / (b - a || 1e-9);
    for (const lv of levels) {
      const path = lv > 0 ? pos : neg;
      for (let j = 0; j < n - 1; j++) {
        for (let i = 0; i < n - 1; i++) {
          const v0 = at(i, j);
          const v1 = at(i + 1, j);
          const v2 = at(i + 1, j + 1);
          const v3 = at(i, j + 1);
          if (Number.isNaN(v0) || Number.isNaN(v1) || Number.isNaN(v2) || Number.isNaN(v3)) continue;
          const idx = (v0 > lv ? 1 : 0) | (v1 > lv ? 2 : 0) | (v2 > lv ? 4 : 0) | (v3 > lv ? 8 : 0);
          if (idx === 0 || idx === 15) continue;
          const x0 = ox + (i + 0.5) * cw;
          const y0 = oy + (j + 0.5) * ch;
          // edge midpoints (interpolated): top (v0→v1), right (v1→v2), bottom (v3→v2), left (v0→v3)
          const T = { x: x0 + lerp(v0, v1, lv) * cw, y: y0 };
          const Rt = { x: x0 + cw, y: y0 + lerp(v1, v2, lv) * ch };
          const Bt = { x: x0 + lerp(v3, v2, lv) * cw, y: y0 + ch };
          const L = { x: x0, y: y0 + lerp(v0, v3, lv) * ch };
          const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
            path.moveTo(a.x, a.y);
            path.lineTo(b.x, b.y);
          };
          switch (idx) {
            case 1: case 14: seg(L, T); break;
            case 2: case 13: seg(T, Rt); break;
            case 3: case 12: seg(L, Rt); break;
            case 4: case 11: seg(Rt, Bt); break;
            case 5: seg(L, T); seg(Rt, Bt); break;
            case 6: case 9: seg(T, Bt); break;
            case 7: case 8: seg(L, Bt); break;
            case 10: seg(T, Rt); seg(L, Bt); break;
            default: break;
          }
        }
      }
    }
    return { pos: pos.detach(), neg: neg.detach() };
  }, [gridA, N, view, ox, oy, dishW, dishH]);

  // ── 3D surface (angled) ──────────────────────────────────────────────────
  // 40, not 30: quads are dropped where they fall outside the dish (see below),
  // and at 30 that mask left a visibly stair-stepped rim.
  const M = 40;
  const grid3d = useMemo(() => {
    const cols: string[] = [];
    const idx: number[] = [];
    const mask: number[] = [];
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        const gi = Math.min(N - 1, Math.floor(((i + 0.5) / M) * N));
        const gj = Math.min(N - 1, Math.floor(((j + 0.5) / M) * N));
        const v = gridA[gj * N + gi];
        const inside = !Number.isNaN(v);
        mask.push(inside ? 1 : 0);
        // Outside-the-dish vertices keep an OPAQUE edge colour rather than a
        // transparent one: they are never drawn (see the quad test below), and a
        // transparent vertex bled to black across the shared edge, which is what
        // put the dark corners on the mesh (owner debug 2026-09-17).
        cols.push(heatColor(inside ? Math.abs(v) : 0));
      }
    }
    // Emit a quad ONLY when all four of its corners are inside the dish, so the
    // mesh is dish-shaped instead of a square with black corners.
    for (let j = 0; j < M - 1; j++) {
      for (let i = 0; i < M - 1; i++) {
        const k0 = j * M + i;
        if (!mask[k0] || !mask[k0 + 1] || !mask[k0 + M] || !mask[k0 + M + 1]) continue;
        idx.push(k0, k0 + 1, k0 + M, k0 + 1, k0 + M + 1, k0 + M);
      }
    }
    return { cols, idx, mask };
  }, [gridA, N]);
  const verts3d = useDerivedValue(() => {
    const A = gridASV.value;
    const B = gridBSV.value;
    const n = N;
    const [wA, wB] = weightsW(stageSV.value, blendSV.value, clock.value, raw.value);
    const env = envSV.value;
    const out: { x: number; y: number }[] = new Array(M * M);
    const cx = width / 2;
    const cy = height / 2 + height * 0.06;
    const sx = dishW * 0.95;
    const sy = dishH * 0.42;
    // RELIEF (owner debug 2026-09-17): height * 0.14 read as a flat sheet once
    // the stage-3 envelope shrank the field, so the dish is given more vertical
    // gain AND the gain is referred to the envelope actually on screen — a small
    // envelope is still legible relief, a large one still cannot leave the dish.
    const zs = height * 0.3 * (0.45 + 0.55 * Math.min(1, env / 0.55));
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        const gi = Math.min(n - 1, Math.floor(((i + 0.5) / M) * n));
        const gj = Math.min(n - 1, Math.floor(((j + 0.5) / M) * n));
        const a = A[gj * n + gi];
        const b = B[gj * n + gi];
        const hv = a !== a ? 0 : env * (wA * a + wB * (b !== b ? 0 : b));
        const u = (i + 0.5) / M - 0.5;
        const w = (j + 0.5) / M - 0.5;
        // A TILT, not a shear. The old `x + w * sx * 0.32` skewed every row
        // sideways, which turned a round dish into a parallelogram; an
        // orthographic tilt just foreshortens y (sy already carries that), so a
        // circular dish projects to the ellipse it should be.
        out[j * M + i] = { x: cx + u * sx, y: cy + w * sy - hv * zs };
      }
    }
    return out;
  }, [width, height, dishW, dishH, N]);

  // ── 3D dish body (rim + wall, so the mesh sits IN something) ─────────────
  // Matches the projection in verts3d exactly: same centre, same sx/sy.
  const dish3d = useMemo(() => {
    const cx = width / 2;
    const cy = height / 2 + height * 0.06;
    const sx = dishW * 0.95;
    const sy = dishH * 0.42;
    const wall = Math.max(10, Math.min(28, dishH * 0.1));
    return { x: cx - sx / 2, y: cy - sy / 2, w: sx, h: sy, wall };
  }, [width, height, dishW, dishH]);

  // ── cross-section profile ────────────────────────────────────────────────
  const sectionPath = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    const A = gridASV.value;
    const B = gridBSV.value;
    const n = N;
    if (A.length !== n * n) return path.detach();
    const j = Math.max(0, Math.min(n - 1, Math.round(sectionYSV.value * (n - 1))));
    const [wA, wB] = weightsW(stageSV.value, blendSV.value, clock.value, raw.value);
    const env = envSV.value;
    const base = oy + dishH + 54;
    const amp = 24;
    let started = false;
    for (let i = 0; i < n; i++) {
      const a = A[j * n + i];
      if (a !== a) {
        started = false;
        continue;
      }
      const b = B[j * n + i];
      const hv = env * (wA * a + wB * (b !== b ? 0 : b));
      const x = ox + ((i + 0.5) / n) * dishW;
      const y = base - hv * amp;
      if (!started) {
        path.moveTo(x, y);
        started = true;
      } else path.lineTo(x, y);
    }
    return path.detach();
  }, [ox, oy, dishW, dishH, N]);

  // ── RIG (side elevation) ─────────────────────────────────────────────────
  // Platform bobs at the DRIVE frequency = twice the response rate; its
  // visible travel scales with the real displacement (µm) — exaggerated but
  // monotonic — and the surface profile rides on top at the response rate.
  const dispSV = useSharedValue(p.displacementUm);
  useEffect(() => {
    dispSV.value = p.displacementUm;
  }, [p.displacementUm, dispSV]);
  const rig = useMemo(() => {
    const cx = width / 2;
    const groundY = height - 22;
    // STAGE BUDGET (owner debug 2026-09-17): the rig used to put the dish rim at
    // half height, which left the shaker ~80 dp to live in — a sliver, not a
    // driver — while the lamp cone owned the top half. The apparatus is now laid
    // out the way it sits on a bench: lamp in the top ~8 %, dish rim at 38 %,
    // and the whole bottom 40 % for the shaker.
    const lampY = Math.round(height * 0.045);
    const coneTop = lampY + 13;
    const dishRimY = Math.round(height * 0.38);
    // Narrower dish (was 0.36w/150) so BOTH label gutters have room to live —
    // measured on a Pixel: at 0.30w the left-hand "LIQUID · N mm" still
    // ellipsized, 0.27w clears it.
    const dishHalfW = Math.min(width * 0.27, 110);
    const dishDepthPx = Math.max(34, Math.min(70, 18 + spec.wallMm * 1.1 + spec.depthMm * 1.1));
    const liquidPx = Math.max(6, dishDepthPx * (spec.depthMm / (spec.depthMm + spec.wallMm)));
    const platformY = dishRimY + dishDepthPx + 8;
    // Shaker basket: the trapezoid from the platform skirt down to the magnet.
    const basketTop = platformY + 14;
    const basketBot = groundY - 40;
    const basket = Skia.PathBuilder.Make()
      .moveTo(cx - 70, basketTop)
      .lineTo(cx + 70, basketTop)
      .lineTo(cx + 24, basketBot)
      .lineTo(cx - 24, basketBot)
      .close()
      .detach();
    // The lamp throws a real cone — narrow at the aperture, dish-wide at the
    // liquid — not the constant-width column it was drawn as before.
    const cone = Skia.PathBuilder.Make()
      .moveTo(cx - 11, coneTop)
      .lineTo(cx + 11, coneTop)
      .lineTo(cx + dishHalfW * 0.94, dishRimY - 4)
      .lineTo(cx - dishHalfW * 0.94, dishRimY - 4)
      .close()
      .detach();
    return { cx, groundY, lampY, coneTop, dishRimY, dishHalfW, dishDepthPx, liquidPx, platformY, basketTop, basketBot, basket, cone };
  }, [width, height, spec.wallMm, spec.depthMm]);
  const bob = useDerivedValue(() => {
    const a = Math.min(12, 1.5 + dispSV.value / 45);
    return Math.sin(2 * Math.PI * 2 * clock.value) * a * (runningSV.value ? 1 : 0);
  }, []);
  const rigTransform = useDerivedValue(() => [{ translateY: bob.value }], []);
  const rigSurface = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    const A = gridASV.value;
    const B = gridBSV.value;
    const n = N;
    if (A.length !== n * n) return path.detach();
    const j = Math.floor(n / 2);
    const [wA, wB] = weightsW(stageSV.value, blendSV.value, clock.value, raw.value);
    const env = envSV.value;
    const { cx, dishRimY, dishHalfW, dishDepthPx, liquidPx } = rig;
    const surfY = dishRimY + dishDepthPx - liquidPx + bob.value;
    const amp = Math.min(liquidPx * 0.8, 10);
    path.moveTo(cx - dishHalfW + 3, dishRimY + dishDepthPx + bob.value);
    for (let i = 0; i < n; i++) {
      const a = A[j * n + i];
      const b = B[j * n + i];
      const hv = a !== a ? 0 : env * (wA * a + wB * (b !== b ? 0 : b));
      const x = cx - dishHalfW + 3 + ((i + 0.5) / n) * (dishHalfW * 2 - 6);
      path.lineTo(x, surfY - hv * amp);
    }
    path.lineTo(cx + dishHalfW - 3, dishRimY + dishDepthPx + bob.value);
    path.close();
    return path.detach();
  }, [rig, N]);

  // ── dish outline (top views) ─────────────────────────────────────────────
  const outline = useMemo(() => {
    const path = Skia.PathBuilder.Make();
    if (circle) path.addCircle(ox + dishW / 2, oy + dishH / 2, dishW / 2);
    else path.addRRect({ rect: { x: ox, y: oy, width: dishW, height: dishH }, rx: 5, ry: 5 });
    return path.detach();
  }, [circle, ox, oy, dishW, dishH]);

  // ── touch: section slice ─────────────────────────────────────────────────
  const dragRef = useRef(p.dragTarget);
  dragRef.current = p.dragTarget;
  const cbRef = useRef(p.onSection);
  cbRef.current = p.onSection;
  const geom = useRef({ oy, dishH });
  geom.current = { oy, dishH };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dragRef.current != null,
      onMoveShouldSetPanResponder: () => dragRef.current != null,
      onPanResponderGrant: (e) => cbRef.current?.(Math.max(0, Math.min(1, (e.nativeEvent.locationY - geom.current.oy) / geom.current.dishH))),
      onPanResponderMove: (e) => cbRef.current?.(Math.max(0, Math.min(1, (e.nativeEvent.locationY - geom.current.oy) / geom.current.dishH))),
    }),
  ).current;

  const rimColor = '#9aa0a8';
  const showImage = !isRig && !is3d;

  return (
    <View style={{ width, height }} {...pan.panHandlers}>
      <Canvas style={{ width, height }}>
        {isRig ? (
          <Group>
            {/* Lamp + light cone (a real cone, brightest at the aperture) */}
            <Path path={rig.cone}>
              <LinearGradient
                start={vec(rig.cx, rig.coneTop)}
                end={vec(rig.cx, rig.dishRimY)}
                colors={['rgba(255,235,180,0.19)', 'rgba(255,235,180,0.03)']}
              />
            </Path>
            <Rect x={rig.cx - 20} y={rig.lampY} width={40} height={9} color="#3a3a40" />
            <Rect x={rig.cx - 20} y={rig.lampY} width={40} height={9} style="stroke" strokeWidth={1} color="#55555e" />
            <Rect x={rig.cx - 11} y={rig.lampY + 9} width={22} height={4} color="#ffe6a8" />
            {/* Bench */}
            <Rect x={0} y={rig.groundY} width={width} height={22} color="#151518" />
            <SkLine p1={vec(0, rig.groundY)} p2={vec(width, rig.groundY)} color="#2b2b30" strokeWidth={1.5} />
            {/* Shaker: magnet + basket + surround (a loudspeaker-style driver) */}
            <Rect x={rig.cx - 34} y={rig.groundY - 26} width={68} height={26} color="#2d2d33" />
            <Rect x={rig.cx - 34} y={rig.groundY - 26} width={68} height={26} style="stroke" strokeWidth={1} color="#4a4a52" />
            <Rect x={rig.cx - 22} y={rig.groundY - 40} width={44} height={14} color="#26262b" />
            <Path path={rig.basket} color="#1f1f24" />
            <Path path={rig.basket} style="stroke" strokeWidth={1.2} color="#4a4a52" />
            {/* Moving assembly: cone dust-cap → rod → platform → dish → liquid */}
            <Group transform={rigTransform}>
              <Oval x={rig.cx - 74} y={rig.platformY + 6} width={148} height={16} color="#3a3a42" />
              <Rect x={rig.cx - 5} y={rig.platformY + 14} width={10} height={rig.groundY - 40 - rig.platformY - 14} color="#55555e" />
              <Oval x={rig.cx - 80} y={rig.platformY - 4} width={160} height={18} color="#5b5b66" />
              <Oval x={rig.cx - 80} y={rig.platformY - 4} width={160} height={18} style="stroke" strokeWidth={1} color="#8a8a96" />
              {/* Dish body */}
              <Rect x={rig.cx - rig.dishHalfW} y={rig.dishRimY} width={rig.dishHalfW * 2} height={rig.dishDepthPx} color="rgba(190,205,215,0.10)" />
              <Rect x={rig.cx - rig.dishHalfW} y={rig.dishRimY} width={rig.dishHalfW * 2} height={rig.dishDepthPx} style="stroke" strokeWidth={2} color={rimColor} />
              <Oval x={rig.cx - rig.dishHalfW} y={rig.dishRimY - 5} width={rig.dishHalfW * 2} height={10} style="stroke" strokeWidth={1.2} color="#c4cad2" />
              {/* Liquid (profile from the surface field) */}
              <Path path={rigSurface} color={p.tint} opacity={0.85} />
              <Path path={rigSurface} style="stroke" strokeWidth={1.5} color="rgba(255,255,255,0.55)" />
            </Group>
          </Group>
        ) : null}

        {showImage ? (
          <Group>
            <Path path={outline} color="rgba(0,0,0,0.55)" transform={[{ translateY: 6 }]} />
            <Group clip={outline}>
              <Rect x={ox} y={oy} width={dishW} height={dishH} color="#0b0d12" />
              <SkiaImage image={surface} x={ox} y={oy} width={dishW} height={dishH} fit="fill" sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} />
              {view === 'surface' ? (
                <Rect x={ox} y={oy} width={dishW} height={dishH}>
                  <RadialGradient c={vec(ox + dishW * 0.3, oy + dishH * 0.22)} r={dishW * 0.75} colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']} />
                </Rect>
              ) : null}
              {view === 'contours' ? (
                <Group>
                  <Path path={contours.pos} style="stroke" strokeWidth={1.3} color="#ffc64d" />
                  <Path path={contours.neg} style="stroke" strokeWidth={1.3} color="#5bb0ff" />
                </Group>
              ) : null}
              {isSection ? <SkLine p1={vec(ox, oy + p.sectionY * dishH)} p2={vec(ox + dishW, oy + p.sectionY * dishH)} color="#ffc64d" strokeWidth={1.5} /> : null}
              {spec.shape === 'ring' ? <Circle cx={ox + dishW / 2} cy={oy + dishH / 2} r={dishW * 0.175} color="#0c0c0f" /> : null}
            </Group>
            {/* Rim */}
            <Path path={outline} style="stroke" strokeWidth={4} color={rimColor} />
            <Path path={outline} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.4)" />
            {spec.shape === 'ring' ? <Circle cx={ox + dishW / 2} cy={oy + dishH / 2} r={dishW * 0.175} style="stroke" strokeWidth={3} color={rimColor} /> : null}
            {isSection ? (
              <Group>
                <SkLine p1={vec(ox, oy + dishH + 54)} p2={vec(ox + dishW, oy + dishH + 54)} color="#2f74ff" strokeWidth={1} />
                <Path path={sectionPath} style="stroke" strokeWidth={3} color="#ffc64d" strokeJoin="round" strokeCap="round" />
              </Group>
            ) : null}
          </Group>
        ) : null}

        {is3d ? (
          <Group>
            {/* Dish wall: the lower ellipse shows below the rim as depth. */}
            <Oval x={dish3d.x} y={dish3d.y + dish3d.wall} width={dish3d.w} height={dish3d.h} color="#15171d" />
            <Oval x={dish3d.x} y={dish3d.y + dish3d.wall} width={dish3d.w} height={dish3d.h} style="stroke" strokeWidth={1.5} color="#3a3f47" />
            {/* Dish floor, then the liquid mesh, then the rim over the top. */}
            <Oval x={dish3d.x} y={dish3d.y} width={dish3d.w} height={dish3d.h} color="#0b0d12" />
            <Vertices vertices={verts3d} colors={grid3d.cols} indices={grid3d.idx} mode="triangles" />
            <Oval x={dish3d.x} y={dish3d.y} width={dish3d.w} height={dish3d.h} style="stroke" strokeWidth={3} color={rimColor} />
            <Oval x={dish3d.x} y={dish3d.y} width={dish3d.w} height={dish3d.h} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.4)" />
          </Group>
        ) : null}
      </Canvas>
      {isRig ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Right-hand labels are width-capped; the long LIQUID caption hangs off
              the LEFT rim instead (it used to run off the right edge). */}
          <Text numberOfLines={1} style={[styles.lbl, { left: rig.cx + rig.dishHalfW + 6, maxWidth: width - (rig.cx + rig.dishHalfW + 12), top: rig.dishRimY - 2 }]}>DISH</Text>
          <Text
            numberOfLines={1}
            style={[
              styles.lblR,
              { right: width - (rig.cx - rig.dishHalfW) + 6, maxWidth: rig.cx - rig.dishHalfW - 10, top: rig.dishRimY + rig.dishDepthPx - rig.liquidPx - 8 },
            ]}
          >
            LIQUID · {spec.depthMm} mm
          </Text>
          <Text numberOfLines={1} style={[styles.lbl, { left: rig.cx + 84, maxWidth: width - (rig.cx + 90), top: rig.platformY - 6 }]}>PLATFORM</Text>
          <Text numberOfLines={1} style={[styles.lbl, { left: rig.cx + 40, maxWidth: width - (rig.cx + 46), top: rig.groundY - 30 }]}>SHAKER · {p.driveHz.toFixed(0)} Hz</Text>
          <Text numberOfLines={1} style={[styles.lbl, { left: rig.cx + 26, maxWidth: width - (rig.cx + 32), top: rig.lampY - 1 }]}>LAMP</Text>
          <Text style={[styles.lbl, { left: 12, top: rig.groundY - 30, color: colors.textSub }]}>{p.accelG.toFixed(2)} g · {p.displacementUm < 1000 ? `${p.displacementUm.toFixed(0)} µm` : `${(p.displacementUm / 1000).toFixed(2)} mm`} travel</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lbl: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)' },
  lblR: { position: 'absolute', textAlign: 'right', fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)' },
});
