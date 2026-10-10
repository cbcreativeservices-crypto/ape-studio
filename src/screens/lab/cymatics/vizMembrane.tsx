/**
 * cymatics/vizMembrane — the drumhead and the loudspeaker, drawn (spec §1.5,
 * Phase 3). ONLY loaded through skiaGate.requireVizMembrane().
 *
 * VISUAL STANDARDS (2026-07-29): illustrated real objects — a drum shell with
 * its hoop and tension rods and a translucent head; a loudspeaker half-section
 * with its motor stack, basket, spider, voice coil, cone walls, surround and
 * dust cap (a dome tweeter in its own section) —
 * never coloured discs. Motion is real and strobed: the real head moves at
 * the drive frequency (too fast to see), so the display shows the SAME
 * motion at a few hertz and says so.
 *
 * COLOUR STANDARD (2026-07-31): every amplitude drawing is on the house heat
 * ramp — the static heat / 3D meshes through `heatColor`, the per-frame lit
 * head through `heatRgbW` (its worklet twin, pinned by test). Phase and node
 * views are sign / zero-set displays, not amplitude, and keep their own two
 * colours; the lit HEAD view lights the head's own material.
 *
 * PERFORMANCE: the signed field is sampled once per control change (a
 * Float32Array from membrane.sampleMembrane). Per-frame work runs in
 * reanimated worklets: the lit head is shaded into a small RGBA buffer and
 * handed to Skia as an SkImage (the liquid idiom); the 3D mesh and the cone
 * profile are derived values. React state never sits in the frame loop.
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { fitValue } from '../../../theme/legibility';
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
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS, heatColor, heatRgbW } from '../../../features/tools/levelColor';
import { HEAD_BY_ID, type ConeRead, type Driver, type MembraneSpec } from '../../../features/cymatics/membrane';
import { colors, fonts } from '../../../theme/tokens';
import { useStageTextScale } from '../rack/stageAspect';
import { GestureExclusionZone, STAGE_BAND_DP } from '../../../../modules/ape-gesture-exclusion';

export type MembraneViewMode = 'head' | 'heat' | 'phase' | 'nodes' | 'head3d' | 'section' | 'speaker';

export const MEMBRANE_VIEW_LABELS: Record<MembraneViewMode, string> = {
  head: 'THE DRUM',
  heat: 'HEAT MAP',
  phase: 'PHASE',
  nodes: 'NODE LINES',
  head3d: '3D HEAD',
  section: 'CROSS-SECTION',
  speaker: 'LOUDSPEAKER',
};

/**
 * ── PHASE SIGN IS CATEGORICAL, SO IT IS OFF THE RAMP (2026-09-18) ────────────
 *
 * `PHASE_DOWN` used to be `MIDLINE_BLUE`, with a comment saying "the house
 * MIDI-0 blue — one blue app-wide". The intent was right and the result was the
 * opposite: `levelColor.ts` defines that blue as "silence / mid line", and here
 * it was painted on a lobe at MAXIMUM DOWNWARD displacement, mixed toward black
 * only as amplitude FELL.
 *
 * So a learner who had just been taught the heat map — black = still, blue = a
 * little, red = the most — read a blue phase lobe as a quiet region. It is the
 * exact inverse of the truth: that lobe is moving as hard as the amber one.
 *
 * The standing colour rule is that the velocity ramp means AMPLITUDE and only
 * amplitude, and categorical states must not borrow its hues. Up/down is a
 * sign, not a level. Violet appears nowhere on the ramp, so it cannot be
 * misread as one, and it keeps a strong warm/cool split against the amber.
 */
const PHASE_UP = '#ffc64d';
const PHASE_DOWN = '#a97bff';
const NODE_LINE = '#e9f2ff';

function hexRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

export type MembraneViewProps = {
  width: number;
  height: number;
  spec: MembraneSpec;
  /** Signed field ±1 on an N×N grid (NaN outside the head). */
  grid: Float32Array;
  N: number;
  /** Response strength 0..1 at the drive frequency. */
  strength: number;
  /** Drive amplitude 0..1. */
  amplitude: number;
  view: MembraneViewMode;
  running: boolean;
  slowMo: boolean;
  sectionY: number;
  dragTarget: 'strike' | 'section' | null;
  onStrike?: (r: number, thetaDeg: number) => void;
  onSection?: (y01: number) => void;
  /** LOUDSPEAKER view: the cone's read + profile grid at the drive frequency. */
  cone?: { read: ConeRead; grid: Float32Array; driver: Driver; hz: number };
};

/**
 * One point of the cone's section profile (s = 0 at the neck, 1 at the
 * mouth; sign −1 upper wall, +1 lower). Displacement along the cone varies by
 * draw mode — piston = uniform; flex = centre leads the rim; radial = rim
 * lobes (opposite sign top/bottom); breakup = wobble. Shared by the far-side
 * surface, the section walls, the dust cap and the surround so they agree.
 */
function coneProfile(s: number, sign: number, t: number, mode: number, travel: number, coilX: number, mouthX: number, cyL: number, half: number): { x: number; y: number } {
  'worklet';
  let w = 1;
  if (mode === 1) w = 1 - 0.65 * s * s;
  else if (mode >= 2 && mode <= 4) w = 1 - 0.5 * s + sign * 0.5 * s * s * Math.cos(t * 2 * Math.PI * 0.5 + mode);
  else if (mode === 5) w = 0.7 + 0.5 * Math.sin(s * 9 + t * 2 * Math.PI * 1.3) * s;
  const x = coilX + s * (mouthX - coilX) + travel * w;
  const y = cyL + sign * (half * 0.18 + s * (half - half * 0.18));
  return { x, y };
}

export function MembraneView(p: MembraneViewProps) {
  const { width: boxW, height: boxH, spec, grid, N, view } = p;
  // FULL SCREEN (house rule D35, 2026-09-30): laid out in GLASS units (box ÷
  // StageTextScale — 1 on the glass) and painted through one scaled Group, so
  // the head, the hoop, the mallet, the cone and every stroke grow with the
  // picture; the N×N field is unchanged (same cost at every zoom). The RN
  // labels ride a scaled overlay the same size. Touches are mapped back into
  // glass units.
  const s = useStageTextScale();
  const width = boxW / s;
  const height = boxH / s;
  const head = HEAD_BY_ID[spec.head];
  const isSpeaker = view === 'speaker';
  const is3d = view === 'head3d';
  const isSection = view === 'section';
  const pad = 16;
  const availW = width - pad * 2;
  const availH = height - pad * 2;
  const D = Math.min(availW, availH) * (is3d ? 0.82 : isSection ? 0.68 : 0.92);
  const cx = width / 2;
  const cy = height / 2 + (is3d ? D * 0.06 : isSection ? -height * 0.12 : 0);
  const R = D / 2;
  const ox = cx - R;
  const oy = cy - R;

  // ── strobed clock ────────────────────────────────────────────────────────
  const clock = useSharedValue(0);
  const rate = useSharedValue(3.2);
  const runningSV = useSharedValue(p.running);
  useEffect(() => {
    rate.value = p.slowMo ? 0.45 : 3.2;
    runningSV.value = p.running;
  }, [p.slowMo, p.running, rate, runningSV]);
  const cb = useFrameCallback((info) => {
    const dt = Math.min(info.timeSincePreviousFrame ?? 16, 48) / 1000;
    if (!runningSV.value) return;
    clock.value += dt * rate.value;
  }, false);
  useEffect(() => {
    cb.setActive(true);
    return () => cb.setActive(false);
  }, [cb]);

  const gridSV = useSharedValue(grid);
  const strengthSV = useSharedValue(p.strength);
  const ampSV = useSharedValue(p.amplitude);
  const tintSV = useSharedValue(hexRgb(head.tint));
  useEffect(() => {
    gridSV.value = grid;
  }, [grid, gridSV]);
  useEffect(() => {
    strengthSV.value = p.strength;
    ampSV.value = p.amplitude;
    tintSV.value = hexRgb(head.tint);
  }, [p.strength, p.amplitude, head.tint, strengthSV, ampSV, tintSV]);

  // ── THE DRUM: lit head, shaded per frame (liquid idiom) ──────────────────
  const headImage = useDerivedValue<SkImage | null>(() => {
    if (view !== 'head') return null;
    const G = gridSV.value;
    const n = N;
    if (G.length !== n * n) return null;
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI) * ampSV.value * (0.25 + 0.75 * strengthSV.value);
    const tint = tintSV.value;
    const px = new Uint8Array(n * n * 4);
    // Light from the upper-left, a little glossy.
    const lx = -0.5;
    const ly = -0.6;
    const lz = 0.65;
    const ln = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const slope = 3.2;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const idx = j * n + i;
        const o = idx * 4;
        const c = G[idx];
        if (c !== c) {
          px[o + 3] = 0;
          continue;
        }
        const l = i > 0 && G[idx - 1] === G[idx - 1] ? G[idx - 1] : c;
        const r = i < n - 1 && G[idx + 1] === G[idx + 1] ? G[idx + 1] : c;
        const u = j > 0 && G[idx - n] === G[idx - n] ? G[idx - n] : c;
        const d = j < n - 1 && G[idx + n] === G[idx + n] ? G[idx + n] : c;
        const nx = -(r - l) * slope * z;
        const ny = -(d - u) * slope * z;
        const nl = Math.sqrt(nx * nx + ny * ny + 1);
        const ndl = Math.max(0, (nx * lx + ny * ly + lz) / (nl * ln));
        const base = 0.42 + 0.58 * ndl;
        // Amplitude is ALSO told by the house ramp, faintly, so a still head
        // reads as its material and a moving one warms toward the ramp.
        const a = Math.abs(c * z);
        const ramp = heatRgbW(a);
        const k = Math.min(0.55, a * 0.9);
        px[o] = Math.min(255, tint[0] * base * (1 - k) + ramp[0] * k);
        px[o + 1] = Math.min(255, tint[1] * base * (1 - k) + ramp[1] * k);
        px[o + 2] = Math.min(255, tint[2] * base * (1 - k) + ramp[2] * k);
        px[o + 3] = 255;
      }
    }
    const data = Skia.Data.fromBytes(px);
    return Skia.Image.MakeImage({ width: n, height: n, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul }, data, n * 4);
  }, [N, view]);

  // ── static meshes: heat / phase / nodes (plate idiom) ────────────────────
  // Heat / 3D encode the RESPONSE, not a +/-1 shape (Plate parity): dark between resonances.
  const strengthK = 0.12 + 0.88 * Math.max(0, Math.min(1, p.strength));
  const mesh = useMemo(() => {
    if (view !== 'heat' && view !== 'phase' && view !== 'nodes' && view !== 'section') return null;
    const verts: { x: number; y: number }[] = [];
    const cols: string[] = [];
    const idx: number[] = [];
    const inside = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const v = grid[j * N + i];
        const a = v !== v ? 0 : Math.abs(v);
        inside[j * N + i] = v === v ? 1 : 0;
        verts.push({ x: ox + ((i + 0.5) / N) * D, y: oy + ((j + 0.5) / N) * D });
        let c: string;
        if (view === 'phase') c = v > 0 ? mixHex('#0b0b10', PHASE_UP, Math.min(1, a * 1.15)) : mixHex('#0b0b10', PHASE_DOWN, Math.min(1, a * 1.15));
        else if (view === 'nodes') c = a < 0.06 ? NODE_LINE : a < 0.12 ? '#8aa0bf' : '#101216';
        else c = heatColor(a * strengthK);
        cols.push(c);
      }
    }
    for (let j = 0; j < N - 1; j++) {
      for (let i = 0; i < N - 1; i++) {
        const k0 = j * N + i;
        if (!inside[k0] || !inside[k0 + 1] || !inside[k0 + N] || !inside[k0 + N + 1]) continue;
        idx.push(k0, k0 + 1, k0 + N, k0 + 1, k0 + N + 1, k0 + N);
      }
    }
    return { verts, cols, idx };
  }, [grid, N, view, ox, oy, D, strengthK]);

  // ── 3D head (tilted, strobed, head-shaped) ───────────────────────────────
  const M = 40;
  const grid3d = useMemo(() => {
    const vals = new Float32Array(M * M);
    const inside = new Uint8Array(M * M);
    const cols: string[] = [];
    const idx: number[] = [];
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        const gi = Math.min(N - 1, Math.floor(((i + 0.5) / M) * N));
        const gj = Math.min(N - 1, Math.floor(((j + 0.5) / M) * N));
        const v = grid[gj * N + gi];
        vals[j * M + i] = v !== v ? 0 : v;
        inside[j * M + i] = v === v ? 1 : 0;
        cols.push(heatColor(Math.abs(vals[j * M + i]) * strengthK));
      }
    }
    for (let j = 0; j < M - 1; j++) {
      for (let i = 0; i < M - 1; i++) {
        const k0 = j * M + i;
        if (!inside[k0] || !inside[k0 + 1] || !inside[k0 + M] || !inside[k0 + M + 1]) continue;
        idx.push(k0, k0 + 1, k0 + M, k0 + 1, k0 + M + 1, k0 + M);
      }
    }
    return { vals, cols, idx };
  }, [grid, N, strengthK]);
  const vals3dSV = useSharedValue(grid3d.vals);
  useEffect(() => {
    vals3dSV.value = grid3d.vals;
  }, [grid3d, vals3dSV]);
  const sx3 = D * 0.95;
  const sy3 = D * 0.42;
  const verts3d = useDerivedValue(() => {
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI) * ampSV.value * (0.25 + 0.75 * strengthSV.value);
    const V = vals3dSV.value;
    const out: { x: number; y: number }[] = new Array(M * M);
    const zs = height * 0.22;
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        const u = (i + 0.5) / M - 0.5;
        const w = (j + 0.5) / M - 0.5;
        out[j * M + i] = { x: cx + u * sx3, y: cy + w * sy3 - V[j * M + i] * z * zs };
      }
    }
    return out;
  }, [cx, cy, sx3, sy3, height]);
  const rim3d = { x: cx - sx3 / 2, y: cy - sy3 / 2, w: sx3, h: sy3, wall: Math.max(10, D * 0.12) };

  // ── cross-section ────────────────────────────────────────────────────────
  const sectionYSV = useSharedValue(p.sectionY);
  useEffect(() => {
    sectionYSV.value = p.sectionY;
  }, [p.sectionY, sectionYSV]);
  const sectionPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const G = gridSV.value;
    if (G.length !== N * N) return path;
    const j = Math.max(0, Math.min(N - 1, Math.round(sectionYSV.value * (N - 1))));
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI) * ampSV.value * (0.25 + 0.75 * strengthSV.value);
    const base = oy + D + 54;
    const amp = 26;
    let started = false;
    for (let i = 0; i < N; i++) {
      const v = G[j * N + i];
      if (v !== v) {
        started = false;
        continue;
      }
      const x = ox + ((i + 0.5) / N) * D;
      const y = base - v * z * amp;
      if (!started) {
        path.moveTo(x, y);
        started = true;
      } else path.lineTo(x, y);
    }
    return path;
  }, [ox, oy, D, N]);

  // ── LOUDSPEAKER cutaway ──────────────────────────────────────────────────
  // Layout: cutaway on the left 58 %, front view of the cone on the right.
  //
  // ART PASS 2026-10-10 — a true half-section of a cone driver, firing right,
  // drawn in template millimetres (an 8" / 200 mm-class woofer) and scaled by
  // `u` px per mm to fit the glass:
  //   frame Ø205 (flange r 93–102.5, 6 thick) · cone mouth Ø165, neck Ø30,
  //   cone depth ≈ 0.38 × mouth Ø · half-roll surround r 82.5–93 · dust cap
  //   Ø36, 9 high · 25 mm (1") voice coil on a former reaching ≈ 22 mm back
  //   into the gap · corrugated spider r 14–56 · ferrite motor: back plate
  //   Ø100 × 7 with a Ø23 vented pole, magnet ring Ø100/Ø48 × 17, top plate
  //   Ø100/Ø31.6 × 8 · cast basket arms from the top plate to the flange.
  // The cone is drawn as its two section WALLS over a faint far-side surface
  // (not a solid wedge), the dust cap as the dome on the cone's front, and
  // the motor as the real stack. The 25 mm dome tweeter gets its own section
  // (faceplate, dome, coil, neodymium motor, rear chamber).
  const isDome = p.cone?.driver.id === 'tweeter25';
  const spk = useMemo(() => {
    const L = width * 0.58;
    const cxL = L / 2 + 6;
    const cyL = height / 2 + 4;
    // Fit: the 205 mm frame inside the glass between the labels, the
    // ≈ 120 mm-long assembly inside the left 58 %.
    const u = Math.max(0.2, Math.min((height - 46) / 205, (L - 18) / 122));
    const coneH = 165 * u; // cone mouth diameter, px
    const depth = coneH * (p.cone?.driver.id === 'full100' ? 0.3 : 0.38); // mouth → neck
    const mouthX = cxL + (depth + 38 * u) / 2;
    const coilX = mouthX - depth; // the cone's neck, where the coil former joins
    const gapC = coilX - 22 * u; // centre of the magnetic gap (coil windings at rest)
    const magnetX = gapC - 4 * u; // the magnet's front face (top plate behind it)
    const fx = width * 0.58 + (width * 0.42) / 2;
    const fR = Math.min(height * 0.36, width * 0.17);
    return { cxL, cyL, coneH, depth, mouthX, coilX, magnetX, gapC, u, fx, fy: height / 2 + 4, fR };
  }, [width, height, p.cone?.driver.id]);
  const coneGridSV = useSharedValue(p.cone?.grid ?? new Float32Array(0));
  const coneExcSV = useSharedValue(p.cone?.read.excursion ?? 0);
  const coneModeSV = useSharedValue(p.cone?.read.drawMode ?? 0);
  useEffect(() => {
    coneGridSV.value = p.cone?.grid ?? new Float32Array(0);
    coneExcSV.value = p.cone?.read.excursion ?? 0;
    coneModeSV.value = p.cone?.read.drawMode ?? 0;
  }, [p.cone, coneGridSV, coneExcSV, coneModeSV]);
  const coneN = 40; // finer than the head grid so the masked disc edge does not stair-step
  /** The cone's far-side inner surface (cone profile closed at the mouth). */
  const conePath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI);
    const exc = coneExcSV.value * ampSV.value;
    const mode = coneModeSV.value;
    const travel = z * exc * spk.depth * 0.32; // strobed excursion, px
    const steps = 18;
    let first = true;
    for (let k = 0; k <= steps; k++) {
      const q = coneProfile(k / steps, -1, t, mode, travel, spk.coilX, spk.mouthX, spk.cyL, spk.coneH / 2);
      if (first) {
        path.moveTo(q.x, q.y);
        first = false;
      } else path.lineTo(q.x, q.y);
    }
    for (let k = steps; k >= 0; k--) {
      const q = coneProfile(k / steps, 1, t, mode, travel, spk.coilX, spk.mouthX, spk.cyL, spk.coneH / 2);
      path.lineTo(q.x, q.y);
    }
    path.close();
    return path;
  }, [spk]);
  /** The moving parts as section lines — the two cone walls, the dust cap,
   *  the surround roll, the coil former + windings and the spider — each its
   *  own derived path on the one strobed travel, the cone's own profile from
   *  `coneProfile` (the same physics the far-side surface uses). */
  const coneWalls = useDerivedValue(() => {
    const t = clock.value;
    const travel = Math.sin(t * 2 * Math.PI) * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    const mode = coneModeSV.value;
    const walls = Skia.Path.Make();
    for (const sign of [-1, 1]) {
      for (let k = 0; k <= 18; k++) {
        const q = coneProfile(k / 18, sign, t, mode, travel, spk.coilX, spk.mouthX, spk.cyL, spk.coneH / 2);
        if (k === 0) walls.moveTo(q.x, q.y);
        else walls.lineTo(q.x, q.y);
      }
    }
    return walls;
  }, [spk]);
  // dust cap: a dome glued to the cone's front at r = 18 mm, 9 mm high
  const capPath = useDerivedValue(() => {
    const t = clock.value;
    const travel = Math.sin(t * 2 * Math.PI) * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    const mode = coneModeSV.value;
    const { u, cyL } = spk;
    const half = spk.coneH / 2;
    const capS = Math.max(0, (18 * u - half * 0.18) / (half - half * 0.18));
    const a = coneProfile(capS, -1, t, mode, travel, spk.coilX, spk.mouthX, cyL, half);
    const b = coneProfile(capS, 1, t, mode, travel, spk.coilX, spk.mouthX, cyL, half);
    const cap = Skia.Path.Make();
    cap.moveTo(a.x, a.y);
    cap.cubicTo(a.x + 6 * u, a.y, a.x + 9 * u, cyL - 9 * u, a.x + 9 * u, cyL);
    cap.cubicTo(a.x + 9 * u, cyL + 9 * u, b.x + 6 * u, b.y, b.x, b.y);
    return cap;
  }, [spk]);
  // surround: a half-roll from the moving cone edge to the fixed flange
  const rollPath = useDerivedValue(() => {
    const t = clock.value;
    const travel = Math.sin(t * 2 * Math.PI) * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    const mode = coneModeSV.value;
    const { u, cyL } = spk;
    const half = spk.coneH / 2;
    const top = coneProfile(1, -1, t, mode, travel, spk.coilX, spk.mouthX, cyL, half);
    const bot = coneProfile(1, 1, t, mode, travel, spk.coilX, spk.mouthX, cyL, half);
    const fixX = spk.mouthX + 1.5 * u;
    const roll = Skia.Path.Make();
    roll.moveTo(top.x, top.y);
    roll.cubicTo(top.x + 7 * u, top.y, fixX + 7 * u, cyL - 93 * u, fixX, cyL - 93 * u);
    roll.moveTo(bot.x, bot.y);
    roll.cubicTo(bot.x + 7 * u, bot.y, fixX + 7 * u, cyL + 93 * u, fixX, cyL + 93 * u);
    return roll;
  }, [spk]);
  // voice-coil former (moving tube, r 12.2–13 mm) from the gap to the neck
  const formerPath = useDerivedValue(() => {
    const travel = Math.sin(clock.value * 2 * Math.PI) * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    const { u, cyL } = spk;
    const x0 = spk.gapC - 7 * u + travel;
    const len = spk.coilX - spk.gapC + 7 * u;
    const f = Skia.Path.Make();
    f.addRect(Skia.XYWHRect(x0, cyL - 13 * u, len, 0.8 * u + 0.4));
    f.addRect(Skia.XYWHRect(x0, cyL + 12.2 * u - 0.4, len, 0.8 * u + 0.4));
    return f;
  }, [spk]);
  // the copper windings, 12 mm long, sitting in the gap at rest
  const windPath = useDerivedValue(() => {
    const travel = Math.sin(clock.value * 2 * Math.PI) * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    const { u, cyL } = spk;
    const w = Skia.Path.Make();
    w.addRect(Skia.XYWHRect(spk.gapC - 6 * u + travel, cyL - 15.2 * u, 12 * u, 2.2 * u));
    w.addRect(Skia.XYWHRect(spk.gapC - 6 * u + travel, cyL + 13 * u, 12 * u, 2.2 * u));
    return w;
  }, [spk]);
  // spider: corrugated, inner edge on the former (moving), outer on the basket seat
  const spiderPath = useDerivedValue(() => {
    const travel = Math.sin(clock.value * 2 * Math.PI) * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    const { u, cyL } = spk;
    const sx = spk.coilX - 9 * u;
    const sp = Skia.Path.Make();
    for (const sign of [-1, 1]) {
      for (let i = 0; i <= 6; i++) {
        const f = i / 6;
        const x = sx + travel * (1 - f) + (i % 2 === 0 ? 0 : 2.4 * u);
        const y = cyL + sign * (13.5 * u + f * (56 - 13.5) * u);
        if (i === 0) sp.moveTo(x, y);
        else sp.lineTo(x, y);
      }
    }
    return sp;
  }, [spk]);
  /** The static half-section: ferrite motor stack, cast basket, flange. */
  const motorArt = useMemo(() => {
    const { cyL, u, gapC, coilX, mouthX } = spk;
    const rect = (x: number, y: number, w: number, h: number) => Skia.XYWHRect(x, y, w, h);
    const steel = Skia.Path.Make();
    const topPlateX = gapC - 4 * u;
    // top plate: r 15.8 → 50, 8 thick (centred on the gap)
    steel.addRect(rect(topPlateX, cyL - 50 * u, 8 * u, (50 - 15.8) * u));
    steel.addRect(rect(topPlateX, cyL + 15.8 * u, 8 * u, (50 - 15.8) * u));
    // back plate Ø100 × 7 and the Ø23 pole up to the top plate's front face
    const backX = topPlateX - 17 * u - 7 * u;
    steel.addRect(rect(backX, cyL - 50 * u, 7 * u, 100 * u));
    steel.addRect(rect(backX + 7 * u, cyL - 11.5 * u, gapC + 4 * u - (backX + 7 * u), 23 * u));
    const magnet = Skia.Path.Make();
    magnet.addRect(rect(topPlateX - 17 * u, cyL - 50 * u, 17 * u, 26 * u));
    magnet.addRect(rect(topPlateX - 17 * u, cyL + 24 * u, 17 * u, 26 * u));
    const vent = Skia.Path.Make();
    vent.addRect(rect(backX, cyL - 3 * u, gapC + 4 * u - backX, 6 * u));
    // basket arms: top-plate rim → spider seat → flange
    const basket = Skia.Path.Make();
    for (const sign of [-1, 1]) {
      basket.moveTo(topPlateX + 8 * u, cyL + sign * 48 * u);
      basket.lineTo(coilX - 9 * u, cyL + sign * 58 * u);
      basket.lineTo(mouthX - 2 * u, cyL + sign * 94 * u);
    }
    const flange = Skia.Path.Make();
    flange.addRect(rect(mouthX - 2 * u, cyL - 102.5 * u, 6 * u, 9.5 * u));
    flange.addRect(rect(mouthX - 2 * u, cyL + 93 * u, 6 * u, 9.5 * u));
    const seat = Skia.Path.Make();
    seat.addRect(rect(coilX - 10.5 * u, cyL - 60 * u, 3 * u, 5 * u));
    seat.addRect(rect(coilX - 10.5 * u, cyL + 55 * u, 3 * u, 5 * u));
    return { steel, magnet, vent, basket, flange, seat, backX };
  }, [spk]);
  /** The 25 mm dome tweeter in section (template mm, faceplate Ø100 mapped to
   *  the frame's 205): faceplate, dome + roll surround, coil, neodymium motor
   *  and the damped rear chamber. Its dome moves with the same strobed travel,
   *  scaled to a tweeter's tiny excursion. */
  const domeArt = useMemo(() => {
    const { cyL, u } = spk;
    const k = (205 / 100) * u; // px per tweeter-mm
    const fx0 = spk.cxL + 6 * k; // faceplate front face
    const rect = (x: number, y: number, w: number, h: number) => Skia.XYWHRect(x, y, w, h);
    const face = Skia.Path.Make();
    face.addRect(rect(fx0 - 4 * k, cyL - 50 * k, 4 * k, (50 - 15.5) * k));
    face.addRect(rect(fx0 - 4 * k, cyL + 15.5 * k, 4 * k, (50 - 15.5) * k));
    const steel = Skia.Path.Make();
    steel.addRect(rect(fx0 - 8 * k, cyL - 30 * k, 4 * k, (30 - 13.8) * k)); // top plate
    steel.addRect(rect(fx0 - 8 * k, cyL + 13.8 * k, 4 * k, (30 - 13.8) * k));
    steel.addRect(rect(fx0 - 20 * k, cyL - 30 * k, 4 * k, 60 * k)); // back plate
    steel.addRect(rect(fx0 - 16 * k, cyL - 12 * k, 12 * k, 24 * k)); // pole
    const magnet = Skia.Path.Make();
    magnet.addRect(rect(fx0 - 16 * k, cyL - 30 * k, 8 * k, 16 * k));
    magnet.addRect(rect(fx0 - 16 * k, cyL + 14 * k, 8 * k, 16 * k));
    const chamber = Skia.Path.Make();
    chamber.addRRect(Skia.RRectXY(rect(fx0 - 32 * k, cyL - 22 * k, 12 * k, 44 * k), 4 * k, 4 * k));
    return { face, steel, magnet, chamber, fx0, k };
  }, [spk]);
  const domeFx0 = domeArt.fx0;
  const domeK = domeArt.k;
  const domePath = useDerivedValue(() => {
    const travel = Math.sin(clock.value * 2 * Math.PI) * coneExcSV.value * ampSV.value * domeK * 1.6; // ≤ ±1.6 mm, strobed
    const cyL = spk.cyL;
    const x = domeFx0 + travel;
    const d = Skia.Path.Make();
    d.moveTo(x, cyL - 12.8 * domeK);
    d.cubicTo(x + 5 * domeK, cyL - 12.8 * domeK, x + 7.5 * domeK, cyL - 6 * domeK, x + 7.5 * domeK, cyL);
    d.cubicTo(x + 7.5 * domeK, cyL + 6 * domeK, x + 5 * domeK, cyL + 12.8 * domeK, x, cyL + 12.8 * domeK);
    return d;
  }, [spk, domeFx0, domeK]);
  const domeRoll = useDerivedValue(() => {
    const travel = Math.sin(clock.value * 2 * Math.PI) * coneExcSV.value * ampSV.value * domeK * 1.6;
    const cyL = spk.cyL;
    const r = Skia.Path.Make();
    for (const sign of [-1, 1]) {
      r.moveTo(domeFx0 + travel, cyL + sign * 12.8 * domeK);
      r.cubicTo(domeFx0 + 1.8 * domeK + travel, cyL + sign * 13.2 * domeK, domeFx0 + 1.8 * domeK, cyL + sign * 15.4 * domeK, domeFx0, cyL + sign * 15.6 * domeK);
    }
    return r;
  }, [spk, domeFx0, domeK]);
  const domeCoil = useDerivedValue(() => {
    const travel = Math.sin(clock.value * 2 * Math.PI) * coneExcSV.value * ampSV.value * domeK * 1.6;
    const cyL = spk.cyL;
    const c = Skia.Path.Make();
    c.addRect(Skia.XYWHRect(domeFx0 - 6 * domeK + travel, cyL - 13.5 * domeK, 6 * domeK, 1.2 * domeK));
    c.addRect(Skia.XYWHRect(domeFx0 - 6 * domeK + travel, cyL + 12.3 * domeK, 6 * domeK, 1.2 * domeK));
    return c;
  }, [spk, domeFx0, domeK]);
  const frontMesh = useMemo(() => {
    if (!p.cone) return null;
    const G = p.cone.grid;
    const n = coneN;
    const verts: { x: number; y: number }[] = [];
    const cols: string[] = [];
    const idx: number[] = [];
    const inside = new Uint8Array(n * n);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const v = G[j * n + i];
        inside[j * n + i] = v === v ? 1 : 0;
        verts.push({ x: spk.fx - spk.fR + ((i + 0.5) / n) * spk.fR * 2, y: spk.fy - spk.fR + ((j + 0.5) / n) * spk.fR * 2 });
        cols.push(heatColor(v !== v ? 0 : Math.abs(v) * (0.35 + 0.65 * p.cone.read.excursion)));
      }
    }
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const k0 = j * n + i;
        if (!inside[k0] || !inside[k0 + 1] || !inside[k0 + n] || !inside[k0 + n + 1]) continue;
        idx.push(k0, k0 + 1, k0 + n, k0 + 1, k0 + n + 1, k0 + n);
      }
    }
    return { verts, cols, idx };
  }, [p.cone, spk]);

  // ── touch: strike point / section ────────────────────────────────────────
  const dragRef = useRef(p.dragTarget);
  dragRef.current = p.dragTarget;
  const cbRef = useRef({ onStrike: p.onStrike, onSection: p.onSection });
  cbRef.current = { onStrike: p.onStrike, onSection: p.onSection };
  const geom = useRef({ cx, cy, R, oy, D, s });
  geom.current = { cx, cy, R, oy, D, s };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dragRef.current != null,
      onMoveShouldSetPanResponder: () => dragRef.current != null,
      onPanResponderGrant: (e) => place(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => place(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;
  function place(lxBox: number, lyBox: number) {
    const g = geom.current;
    const t = dragRef.current;
    if (!t) return;
    // The touch arrives in box px; the head is laid out in glass units.
    const lx = lxBox / g.s;
    const ly = lyBox / g.s;
    if (t === 'section') {
      cbRef.current.onSection?.(Math.max(0, Math.min(1, (ly - g.oy) / g.D)));
      return;
    }
    const dx = (lx - g.cx) / g.R;
    const dy = (ly - g.cy) / g.R;
    const r = Math.min(0.95, Math.sqrt(dx * dx + dy * dy));
    const th = (Math.atan2(dy, dx) * 180) / Math.PI;
    cbRef.current.onStrike?.(r, th);
  }

  const strikeX = cx + spec.strike.r * R * Math.cos((spec.strike.thetaDeg * Math.PI) / 180);
  const strikeY = cy + spec.strike.r * R * Math.sin((spec.strike.thetaDeg * Math.PI) / 180);
  const lugs = 8;
  const hoopPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(cx, cy, R);
    return path;
  }, [cx, cy, R]);
  const showMesh = mesh != null && (view === 'heat' || view === 'phase' || view === 'nodes' || view === 'section');
  // The RN labels: a glass-sized layer scaled about its centre into the box.
  const glassOverlay = { position: 'absolute' as const, left: 0, top: 0, width, height, transform: [{ translateX: (boxW - width) / 2 }, { translateY: (boxH - height) / 2 }, { scale: s }] };

  return (
    // ANNOUNCE THE STAGE (design pass, 2026-09-17). The plate and liquid views
    // both describe themselves; this one said nothing at all, so the drum and
    // the loudspeaker were the only instruments in the lab invisible to a
    // screen reader. Same sentence shape as vizPlate, so the three read alike.
    <View
      style={{ width: boxW, height: boxH }}
      accessible
      accessibilityLabel={`${isSpeaker ? 'Loudspeaker' : 'Drum head'} display, ${MEMBRANE_VIEW_LABELS[view].toLowerCase()} view, response ${Math.round(p.strength * 100)} percent`}
      {...pan.panHandlers}
    >
      {/* Android gesture nav: a drag that starts at the screen edge must not
          start the system back gesture (modules/ape-gesture-exclusion; the
          stage band, so lane 48 + 140 stays inside the 200 dp per-edge cap; armed only while a drag target is chosen).
          Renders nothing on iOS, web and builds without the module. */}
      <GestureExclusionZone active={p.dragTarget != null} maxHeightDp={STAGE_BAND_DP} />
      <Canvas style={{ width: boxW, height: boxH }}>
       {/* Everything below is in glass units; this one Group is the zoom. */}
       <Group transform={[{ scale: s }]}>
        {!isSpeaker && !is3d ? (
          <Group>
            {/* Shell + hoop (the drum from above): a wooden shell ring, a metal hoop, tension rods */}
            <Circle cx={cx} cy={cy + 5} r={R + 12} color="rgba(0,0,0,0.5)" />
            <Circle cx={cx} cy={cy} r={R + 12} color="#3b2a1c" />
            <Circle cx={cx} cy={cy} r={R + 12} style="stroke" strokeWidth={1} color="#5a4530" />
            <Circle cx={cx} cy={cy} r={R + 5} color="#9aa0a8" />
            <Circle cx={cx} cy={cy} r={R + 5} style="stroke" strokeWidth={1} color="#d7dbe0" />
            {Array.from({ length: lugs }, (_, k) => {
              const a = (k / lugs) * Math.PI * 2 + Math.PI / lugs;
              const lx = cx + Math.cos(a) * (R + 9);
              const ly = cy + Math.sin(a) * (R + 9);
              return (
                <Group key={k}>
                  <Circle cx={lx} cy={ly} r={4.2} color="#2b2b30" />
                  <Circle cx={lx} cy={ly} r={4.2} style="stroke" strokeWidth={1} color="#c4cad2" />
                  <Circle cx={lx} cy={ly} r={1.4} color="#c4cad2" />
                </Group>
              );
            })}
            <Group clip={hoopPath}>
              {/* The head: translucent film over the dark shell interior */}
              <Circle cx={cx} cy={cy} r={R} color="#0b0b10" />
              <Circle cx={cx} cy={cy} r={R} color={head.tint} opacity={view === 'head' ? head.alpha * 0.55 : 0.18} />
              {view === 'head' ? (
                <SkiaImage image={headImage} x={ox} y={oy} width={D} height={D} fit="fill" sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} opacity={head.alpha} />
              ) : null}
              {view === 'head' ? (
                <Circle cx={cx} cy={cy} r={R}>
                  <RadialGradient c={vec(cx - R * 0.35, cy - R * 0.4)} r={R * 1.1} colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']} />
                </Circle>
              ) : null}
              {showMesh && mesh ? <Vertices vertices={mesh.verts} colors={mesh.cols} indices={mesh.idx} mode="triangles" opacity={view === 'section' ? 0.6 : view === 'phase' || view === 'nodes' ? 0.35 + 0.61 * strengthK : 0.96} /> : null}
              {isSection ? <SkLine p1={vec(ox, oy + p.sectionY * D)} p2={vec(ox + D, oy + p.sectionY * D)} color="#ffc64d" strokeWidth={1.5} /> : null}
            </Group>
            {/* Bearing edge */}
            <Circle cx={cx} cy={cy} r={R} style="stroke" strokeWidth={2} color="#c4cad2" />
            {/* Strike point: the mallet head */}
            <Circle cx={strikeX} cy={strikeY} r={9} color="rgba(0,0,0,0.45)" />
            <Circle cx={strikeX} cy={strikeY} r={7.5} color="#e9e4d2" />
            <Circle cx={strikeX} cy={strikeY} r={7.5} style="stroke" strokeWidth={2} color={p.dragTarget === 'strike' ? '#ffc64d' : '#8e8e96'} />
            <Circle cx={strikeX} cy={strikeY} r={2.4} color="#ff6b5e" />
            {isSection ? (
              <Group>
                <SkLine p1={vec(ox, oy + D + 54)} p2={vec(ox + D, oy + D + 54)} color={MIDLINE_BLUE} strokeWidth={1} />
                {/* The trace is a +/- waveform: blue at the zero line, the ramp to +/- full excursion (colour standard). */}
                <Path path={sectionPath} style="stroke" strokeWidth={3} strokeJoin="round" strokeCap="round">
                  <LinearGradient start={vec(0, oy + D + 54 - 26)} end={vec(0, oy + D + 54 + 26)} colors={WAVE_LEVEL_STOPS.map((q) => q.color)} positions={WAVE_LEVEL_STOPS.map((q) => q.offset)} />
                </Path>
              </Group>
            ) : null}
          </Group>
        ) : null}

        {is3d ? (
          <Group>
            {/* Shell wall, then the head mesh, then the hoop over the top */}
            <Oval x={rim3d.x - 6} y={rim3d.y + rim3d.wall} width={rim3d.w + 12} height={rim3d.h} color="#3b2a1c" />
            <Oval x={rim3d.x - 6} y={rim3d.y + rim3d.wall} width={rim3d.w + 12} height={rim3d.h} style="stroke" strokeWidth={1.5} color="#5a4530" />
            <Rect x={rim3d.x - 6} y={rim3d.y + rim3d.h / 2} width={rim3d.w + 12} height={rim3d.wall} color="#3b2a1c" />
            <Oval x={rim3d.x} y={rim3d.y} width={rim3d.w} height={rim3d.h} color="#0b0b10" />
            <Vertices vertices={verts3d} colors={grid3d.cols} indices={grid3d.idx} mode="triangles" />
            <Oval x={rim3d.x - 6} y={rim3d.y - 3} width={rim3d.w + 12} height={rim3d.h + 6} style="stroke" strokeWidth={5} color="#9aa0a8" />
            <Oval x={rim3d.x} y={rim3d.y} width={rim3d.w} height={rim3d.h} style="stroke" strokeWidth={1.5} color="#d7dbe0" />
          </Group>
        ) : null}

        {isSpeaker && p.cone ? (
          <Group>
            {isDome ? (
              <Group>
                {/* 25 mm dome tweeter, half-section: rear chamber, neodymium
                    motor (back plate + pole, magnet ring, top plate), the
                    faceplate, then the moving coil, roll surround and dome. */}
                <Path path={domeArt.chamber} color="#1d1d22" />
                <Path path={domeArt.chamber} style="stroke" strokeWidth={1} color="#4a4a52" />
                <Path path={domeArt.magnet} color="#5a5f68" />
                <Path path={domeArt.steel}>
                  <LinearGradient start={vec(0, spk.cyL - 30 * domeK)} end={vec(0, spk.cyL + 30 * domeK)} colors={['#8a8e98', '#3a3c44', '#6a6e78']} />
                </Path>
                <Path path={domeArt.face} color="#2b2c32" />
                <Path path={domeArt.face} style="stroke" strokeWidth={1} color="#6a6e78" />
                <Path path={domeCoil} color="#c9772e" />
                <Path path={domeRoll} style="stroke" strokeWidth={2} color="#1c1d23" />
                <Path path={domePath} style="stroke" strokeWidth={2.4} color="#c9ced8" />
                <Path path={domePath} style="stroke" strokeWidth={0.8} color="#ffffff" opacity={0.5} />
              </Group>
            ) : (
              <Group>
                {/* Motor, half-section: steel back plate + vented pole, the
                    ferrite magnet ring, the steel top plate around the gap. */}
                <Path path={motorArt.magnet} color="#34343b" />
                <Path path={motorArt.magnet} style="stroke" strokeWidth={0.8} color="#4f4f58" />
                <Path path={motorArt.steel}>
                  <LinearGradient start={vec(0, spk.cyL - 50 * spk.u)} end={vec(0, spk.cyL + 50 * spk.u)} colors={['#8a8e98', '#3a3c44', '#6a6e78']} />
                </Path>
                <Path path={motorArt.steel} style="stroke" strokeWidth={0.8} color="#22232a" />
                <Path path={motorArt.vent} color="#0b0b0e" />
                {/* Cast basket: arms from the top plate to the spider seat and
                    on to the mounting flange. */}
                <Path path={motorArt.basket} style="stroke" strokeWidth={Math.max(2, 3.2 * spk.u)} strokeJoin="round" color="#55555e" />
                <Path path={motorArt.seat} color="#55555e" />
                <Path path={motorArt.flange} color="#5d5e67" />
                <Path path={motorArt.flange} style="stroke" strokeWidth={0.8} color="#8a8e98" />
                {/* The moving assembly: far-side cone surface, coil former and
                    windings in the gap, spider, the cone's section walls, the
                    dust cap, and the surround roll. */}
                <Path path={conePath} opacity={0.55}>
                  <LinearGradient start={vec(spk.coilX, spk.cyL)} end={vec(spk.mouthX, spk.cyL)} colors={['#4a3f2d', '#7a6849']} />
                </Path>
                <Path path={formerPath} color="#b9a57a" />
                <Path path={windPath} color="#c9772e" />
                <Path path={spiderPath} style="stroke" strokeWidth={1.6} strokeJoin="round" color="#a8862e" />
                <Path path={coneWalls} style="stroke" strokeWidth={Math.max(2, 2.6 * spk.u)} strokeCap="round" color="#d9c9a4" />
                <Path path={capPath} color="#2f2f36" />
                <Path path={capPath} style="stroke" strokeWidth={1.4} color="#8e8e96" />
                <Path path={rollPath} style="stroke" strokeWidth={Math.max(2.4, 3.4 * spk.u)} strokeCap="round" color="#1c1d23" />
                <Path path={rollPath} style="stroke" strokeWidth={0.8} color="#ffffff" opacity={0.18} />
              </Group>
            )}
            {/* Front view: the cone's displacement field */}
            <Circle cx={spk.fx} cy={spk.fy + 4} r={spk.fR + 10} color="rgba(0,0,0,0.5)" />
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR + 10} color="#3a3a42" />
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR + 4} color="#2b2b30" />
            {frontMesh ? <Vertices vertices={frontMesh.verts} colors={frontMesh.cols} indices={frontMesh.idx} mode="triangles" /> : null}
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR} style="stroke" strokeWidth={2} color="#8e8e96" />
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR * 0.2} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.35)" />
          </Group>
        ) : null}
       </Group>
      </Canvas>
      {isSpeaker && p.cone ? (
        <View pointerEvents="none" style={glassOverlay}>
          <Text numberOfLines={1} style={[styles.lbl, { left: 10, top: 6 }]}>CUTAWAY · {p.cone.driver.label.toUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.lbl, { left: spk.fx - spk.fR - 10, top: 6, width: spk.fR * 2 + 20, textAlign: 'center' }]}>CONE FROM THE FRONT</Text>
          <Text {...fitValue(12)} style={[styles.lbl, { left: 10, top: height - 18, color: colors.textSub }]}>
            excursion {Math.round(p.cone.read.excursion * 100)} % of resonance · ka {p.cone.read.ka.toFixed(2)}
            {p.cone.read.beamDeg != null ? ` · beam ≈ ${p.cone.read.beamDeg}°` : ' · omnidirectional'}
          </Text>
        </View>
      ) : null}
      {!isSpeaker ? (
        <View pointerEvents="none" style={glassOverlay}>
          <Text {...fitValue(12)} style={[styles.lbl, { left: 10, top: height - 18, color: colors.textSub }]}>
            {head.label.toUpperCase()} · Ø {spec.diameterMm} mm · {(spec.tensionNpm / 1000).toFixed(1)} kN/m{spec.kettle ? ' · KETTLE' : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lbl: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)' },
});
