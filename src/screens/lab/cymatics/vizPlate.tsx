/**
 * cymatics/vizPlate — the Chladni plate, drawn (spec §1.2, §3 views). ONLY
 * loaded through skiaGate.requireVizPlate().
 *
 * VISUAL STANDARDS (2026-07-29): an ILLUSTRATED plate — machined face with a
 * brushed / polished / glass / grain finish, a bevelled edge, the driver puck
 * and clamp drawn as objects — never a coloured square. Motion is real: the
 * particles are a physics point cloud, the 3D plate breathes at a strobed
 * rate, the cross-section rocks.
 *
 * PERFORMANCE: the modal field is sampled ONCE per control change (a
 * Float32Array grid from plateModes.sampleField). Everything per-frame runs in
 * reanimated worklets on the UI thread and is read by Skia through
 * SharedValues — React state never sits in the frame loop (meter rule).
 *   • Particles: N positions in a shared Float32Array stepped each frame:
 *     descend the |displacement| gradient (sand walks off the antinodes onto
 *     the nodal lines), agitation ∝ local amplitude × resonance strength,
 *     friction, deterministic jitter. Between resonances the plate barely
 *     moves, so the sand only shivers — patterns SNAP IN near modes and
 *     dissolve between them; they never morph continuously.
 *   • Heat / phase / node views are a static-per-state Vertices mesh in the
 *     house `heatColor` ramp (navy floor → red).
 *   • 3D and cross-section views animate from one strobed clock: the real
 *     plate moves at f Hz — far too fast to see — so the display shows the
 *     SAME motion strobed to a few Hz (or slow motion), and says so.
 *
 * HONESTY: the host stamps the Simulation / Approximated badge; nothing here
 * invents detail the field does not contain.
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Canvas, Circle, FillType, Group, Line as SkLine, LinearGradient, Oval, Path, Points, RadialGradient, Rect, Skia, Vertices, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS, heatColor } from '../../../features/tools/levelColor';
import { MATERIAL_BY_ID } from '../../../features/cymatics/materials';
import { plateAspect, type PlateSpec } from '../../../features/cymatics/plateModes';
import { isLibraryShape, libraryInside, librarySnapInside, loadLibraryShape } from '../../../features/cymatics/modalLibrary';

export type PlateViewMode = 'particles' | 'heat' | 'overlay' | 'phase' | 'nodes' | 'plate3d' | 'section';

export const VIEW_LABELS: Record<PlateViewMode, string> = {
  particles: 'PARTICLES',
  heat: 'HEAT MAP',
  overlay: 'PARTICLES + HEAT',
  phase: 'PHASE',
  nodes: 'NODE LINES',
  plate3d: '3D PLATE',
  section: 'CROSS-SECTION',
};

const SAND = '#efe2b8';
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

// ── worklet helpers ──────────────────────────────────────────────────────────
function hashW(n: number): number {
  'worklet';
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
  return s - Math.floor(s);
}
/** Bilinear |field| at plate-normalised (x, y∈[0,aspect]); 0 outside. */
function ampAt(grid: Float32Array, N: number, x: number, y: number, aspect: number): number {
  'worklet';
  const gx = x * N - 0.5;
  const gy = (y / aspect) * N - 0.5;
  const i0 = Math.max(0, Math.min(N - 2, Math.floor(gx)));
  const j0 = Math.max(0, Math.min(N - 2, Math.floor(gy)));
  const fx = Math.max(0, Math.min(1, gx - i0));
  const fy = Math.max(0, Math.min(1, gy - j0));
  const a = grid[j0 * N + i0];
  const b = grid[j0 * N + i0 + 1];
  const c = grid[(j0 + 1) * N + i0];
  const d = grid[(j0 + 1) * N + i0 + 1];
  const va = a !== a ? 0 : Math.abs(a);
  const vb = b !== b ? 0 : Math.abs(b);
  const vc = c !== c ? 0 : Math.abs(c);
  const vd = d !== d ? 0 : Math.abs(d);
  return (va * (1 - fx) + vb * fx) * (1 - fy) + (vc * (1 - fx) + vd * fx) * fy;
}

/** Is (x, y in [0,aspect]) on a library plate? Nearest-cell mask lookup (worklet). */
function insideW(mask: Uint8Array, nx: number, ny: number, x: number, y: number, aspect: number): boolean {
  'worklet';
  if (nx === 0) return true;
  const yN = y / aspect;
  if (x < 0 || x > 1 || yN < 0 || yN > 1) return false;
  const i = Math.max(0, Math.min(nx - 1, Math.round(x * (nx - 1))));
  const j = Math.max(0, Math.min(ny - 1, Math.round(yN * (ny - 1))));
  return mask[j * nx + i] === 1;
}
const EMPTY_MASK = new Uint8Array(0);

export type PlateViewProps = {
  width: number;
  height: number;
  spec: PlateSpec;
  /** Signed field ±1 on an N×N grid (NaN outside a disc). */
  grid: Float32Array;
  N: number;
  /** Resonance strength 0..1 (particle agitation). */
  strength: number;
  /** Drive amplitude 0..1. */
  amplitude: number;
  view: PlateViewMode;
  running: boolean;
  slowMo: boolean;
  particleCount: number;
  /** 0..1 → dot radius. */
  particleSize: number;
  /** 0..1. */
  friction: number;
  /** Change to re-scatter the sand. */
  resetToken: number;
  /** Cross-section slice, 0..1 of the plate's y extent. */
  sectionY: number;
  /** Drag target for a finger on the plate. */
  dragTarget: 'exciter' | 'support' | 'section' | null;
  onPlace?: (kind: 'exciter' | 'support', x: number, y: number) => void;
  onSection?: (y01: number) => void;
};

export function PlateView(p: PlateViewProps) {
  const { width, height, spec, grid, N, view } = p;
  const mat = MATERIAL_BY_ID[spec.material];
  const circle = spec.shape === 'circle';
  // MODAL-LIBRARY shapes (spec 1.3): the plate is a solved mask + outline,
  // drawn, clipped and walked on exactly like the analytic shapes.
  const lib = isLibraryShape(spec.shape) ? loadLibraryShape(spec.shape) : null;
  const aspect = plateAspect(spec);

  // Plate rectangle in canvas px (padded, aspect-correct).
  const pad = 14;
  const availW = width - pad * 2;
  const availH = height - pad * 2;
  const is3d = view === 'plate3d';
  const isSection = view === 'section';
  // 3D tilts the plate; CROSS-SECTION needs room UNDER the plate for the
  // profile trace (device pass 2026-09-16: at full size the trace fell below
  // the stage). Both shrink the plate and shift it up.
  const plateW = Math.min(availW, availH / aspect) * (is3d ? 0.78 : isSection ? 0.7 : 1);
  const plateH = plateW * aspect;
  const ox = (width - plateW) / 2;
  const oy = (height - plateH) / 2 + (is3d ? plateH * 0.08 : isSection ? -height * 0.13 : 0);

  // ── shared frame clock (strobed / slow-mo) ────────────────────────────────
  const clock = useSharedValue(0);
  const rate = useSharedValue(3.2);
  useEffect(() => {
    rate.value = p.slowMo ? 0.45 : 3.2;
  }, [p.slowMo, rate]);

  // ── particles ─────────────────────────────────────────────────────────────
  const count = Math.max(200, Math.min(8000, Math.round(p.particleCount)));
  const pos = useSharedValue(new Float32Array(0));
  const vel = useSharedValue(new Float32Array(0));
  const tick = useSharedValue(0);
  const gridSV = useSharedValue(grid);
  const strengthSV = useSharedValue(p.strength);
  const ampSV = useSharedValue(p.amplitude);
  const frictionSV = useSharedValue(p.friction);
  const runningSV = useSharedValue(p.running);
  const maskSV = useSharedValue<Uint8Array>(lib ? lib.mask : EMPTY_MASK);
  const maskNxSV = useSharedValue(lib ? lib.nx : 0);
  const maskNySV = useSharedValue(lib ? lib.ny : 0);
  useEffect(() => {
    maskSV.value = lib ? lib.mask : EMPTY_MASK;
    maskNxSV.value = lib ? lib.nx : 0;
    maskNySV.value = lib ? lib.ny : 0;
  }, [lib, maskSV, maskNxSV, maskNySV]);
  const seedRef = useRef(1);
  useEffect(() => {
    gridSV.value = grid;
  }, [grid, gridSV]);
  useEffect(() => {
    strengthSV.value = p.strength;
    ampSV.value = p.amplitude;
    frictionSV.value = p.friction;
    runningSV.value = p.running;
  }, [p.strength, p.amplitude, p.friction, p.running, strengthSV, ampSV, frictionSV, runningSV]);
  // (Re)scatter on count / shape / reset.
  useEffect(() => {
    const seed = seedRef.current++;
    const arr = new Float32Array(count * 2);
    let i = 0;
    let k = 0;
    while (i < count && k < count * 20) {
      const x = hashW(seed * 7919 + k * 2 + 1);
      const y = hashW(seed * 7919 + k * 2 + 2) * aspect;
      k++;
      if (lib) {
        if (!libraryInside(lib, x, y / aspect)) continue;
      } else if (circle) {
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        if (dx * dx + dy * dy > 0.94) continue;
      }
      arr[i * 2] = x;
      arr[i * 2 + 1] = y;
      i++;
    }
    pos.value = arr;
    vel.value = new Float32Array(count * 2);
    tick.value += 1;
  }, [count, circle, lib, aspect, p.resetToken, pos, vel, tick]);

  const wantParticles = view === 'particles' || view === 'overlay';
  const cb = useFrameCallback((info) => {
    const dtRaw = info.timeSincePreviousFrame ?? 16;
    const dt = Math.min(dtRaw, 48) / 1000;
    // Nothing moves without a drive (owner caption + Low-Light): the strobed
    // clock only advances while the plate is driven (learning pass B8).
    if (!runningSV.value) return;
    clock.value += dt * rate.value;
    if (!wantParticles) return;
    const P = pos.value;
    const V = vel.value;
    const G = gridSV.value;
    const n = P.length / 2;
    if (n === 0 || G.length !== N * N) return;
    const s = strengthSV.value;
    const a = ampSV.value;
    // Agitation: how hard the plate throws the sand. Off resonance (s→0) the
    // plate barely moves — the sand just shivers where it lies.
    const agit = a * (0.04 + 0.96 * s * s);
    const kick = 2.2 * agit; // gradient descent gain (plate units / s²)
    const jit = 0.09 * agit; // random walk ∝ local amplitude
    const damp = Math.exp(-dt * (2.5 + 9 * frictionSV.value));
    const h = 1 / N;
    const fr = tick.value;
    // STATIC FRICTION (device pass 2026-09-16): a grain that has reached a
    // still line is no longer shaken, so it stays put — real sand sits ON the
    // nodal line. Without this the residual gradient along the line crept
    // every grain to the crossings and the figure dissolved into dots.
    const settle = 0.035 + 0.05 * frictionSV.value;
    const M = maskSV.value;
    const mnx = maskNxSV.value;
    const mny = maskNySV.value;
    for (let i = 0; i < n; i++) {
      const x = P[i * 2];
      const y = P[i * 2 + 1];
      const A = ampAt(G, N, x, y, aspect);
      if (A < settle) {
        V[i * 2] = 0;
        V[i * 2 + 1] = 0;
        continue;
      }
      const gx = (ampAt(G, N, x + h, y, aspect) - ampAt(G, N, x - h, y, aspect)) / (2 * h);
      const gy = (ampAt(G, N, x, y + h, aspect) - ampAt(G, N, x, y - h, aspect)) / (2 * h);
      // Sand is thrown harder where the plate moves more: kick ∝ A·∇A.
      const push = kick * A;
      let vx = V[i * 2] * damp - gx * push * dt + (hashW(fr * 1.37 + i * 3.1) - 0.5) * jit * A;
      let vy = V[i * 2 + 1] * damp - gy * push * dt + (hashW(fr * 2.71 + i * 5.3) - 0.5) * jit * A;
      // Speed cap keeps a particle from tunnelling through a nodal line.
      const sp = Math.sqrt(vx * vx + vy * vy);
      const cap = 0.9;
      if (sp > cap) {
        vx *= cap / sp;
        vy *= cap / sp;
      }
      let nx = x + vx * dt;
      let ny = y + vy * dt;
      // Keep the sand on the plate.
      if (mnx > 0) {
        // Library shape: a step off the plate (over an edge, into the ring's
        // hole or an f-hole) is refused; the grain stays and loses its run.
        if (!insideW(M, mnx, mny, nx, ny, aspect)) {
          nx = x;
          ny = y;
          vx *= -0.2;
          vy *= -0.2;
        }
      } else if (circle) {
        const dx = (nx - 0.5) * 2;
        const dy = (ny - 0.5) * 2;
        const r2 = dx * dx + dy * dy;
        if (r2 > 0.96) {
          const r = Math.sqrt(r2);
          nx = 0.5 + (dx / r) * 0.49;
          ny = 0.5 + (dy / r) * 0.49;
          vx *= -0.2;
          vy *= -0.2;
        }
      } else {
        if (nx < 0.01) {
          nx = 0.01;
          vx = -vx * 0.2;
        } else if (nx > 0.99) {
          nx = 0.99;
          vx = -vx * 0.2;
        }
        if (ny < 0.01) {
          ny = 0.01;
          vy = -vy * 0.2;
        } else if (ny > aspect - 0.01) {
          ny = aspect - 0.01;
          vy = -vy * 0.2;
        }
      }
      P[i * 2] = nx;
      P[i * 2 + 1] = ny;
      V[i * 2] = vx;
      V[i * 2 + 1] = vy;
    }
    tick.value = fr + 1;
  }, false);
  useEffect(() => {
    cb.setActive(true);
    return () => cb.setActive(false);
  }, [cb]);

  const points = useDerivedValue(() => {
    tick.value; // dependency
    const P = pos.value;
    const n = P.length / 2;
    const out: { x: number; y: number }[] = new Array(n);
    for (let i = 0; i < n; i++) out[i] = { x: ox + P[i * 2] * plateW, y: oy + (P[i * 2 + 1] / aspect) * plateH };
    return out;
  }, [ox, oy, plateW, plateH, aspect]);

  // ── static-per-state meshes (heat / phase / nodes) ────────────────────────
  // The field is normalised to ±1 so its SHAPE is always legible, but the
  // HEAT ramp must tell amplitude: off resonance the plate barely moves, so
  // the heat map is scaled by the response strength and reads dark between
  // modes (learning pass A5/D2 — a full-red map at every frequency taught
  // "there is a pattern at every frequency", the lab's own misconception).
  // PHASE and NODES keep the shape — "which figure WOULD form" — and fade
  // with strength instead (opacity, below).
  const strengthK = 0.12 + 0.88 * Math.max(0, Math.min(1, p.strength));
  const mesh = useMemo(() => {
    if (view === 'particles' || view === 'plate3d') return null;
    const verts: { x: number; y: number }[] = [];
    const cols: string[] = [];
    const idx: number[] = [];
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const v = grid[j * N + i];
        const a = v !== v ? 0 : Math.abs(v);
        verts.push({ x: ox + ((i + 0.5) / N) * plateW, y: oy + ((j + 0.5) / N) * plateH });
        let c: string;
        if (view === 'phase') {
          const k = Math.min(1, a * 1.15);
          c = v > 0 ? mixHex('#0b0b10', PHASE_UP, k) : mixHex('#0b0b10', PHASE_DOWN, k);
        } else if (view === 'nodes') {
          c = a < 0.06 ? NODE_LINE : a < 0.12 ? '#8aa0bf' : '#101216';
        } else {
          c = heatColor(a * strengthK);
        }
        cols.push(c);
        if (i < N - 1 && j < N - 1) {
          const k0 = j * N + i;
          idx.push(k0, k0 + 1, k0 + N, k0 + 1, k0 + N + 1, k0 + N);
        }
      }
    }
    return { verts, cols, idx };
  }, [grid, N, view, ox, oy, plateW, plateH, strengthK]);

  // ── 3D plate (strobed) ───────────────────────────────────────────────────
  const M = 30;
  const grid3d = useMemo(() => {
    // Downsample the field to M×M for the surface + static heat colours.
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
    // A quad is emitted only when all four corners are on the plate, so the
    // 3D mesh is plate-shaped (a disc, a triangle, a violin) rather than the
    // bounding square with a flat navy margin.
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
  const verts3d = useDerivedValue(() => {
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI) * ampSV.value * (0.25 + 0.75 * strengthSV.value);
    const V = vals3dSV.value;
    const out: { x: number; y: number }[] = new Array(M * M);
    const cx = width / 2;
    const cy = height / 2 + height * 0.06;
    const sx = plateW * 0.95;
    const sy = plateH * 0.42;
    const zs = height * 0.16;
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        const u = (i + 0.5) / M - 0.5;
        const w = (j + 0.5) / M - 0.5;
        const d = V[j * M + i] * z;
        out[j * M + i] = { x: cx + u * sx + w * sx * 0.32, y: cy + w * sy - d * zs };
      }
    }
    return out;
  }, [width, height, plateW, plateH]);

  // ── cross-section (strobed) ──────────────────────────────────────────────
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
    const base = oy + plateH + 26 + 28;
    const amp = 26;
    let started = false;
    for (let i = 0; i < N; i++) {
      const v = G[j * N + i];
      if (v !== v) {
        started = false;
        continue;
      }
      const x = ox + ((i + 0.5) / N) * plateW;
      const y = base - v * z * amp;
      if (!started) {
        path.moveTo(x, y);
        started = true;
      } else path.lineTo(x, y);
    }
    return path;
  }, [ox, oy, plateW, plateH, N]);

  // ── plate outline + finish ───────────────────────────────────────────────
  const outline = useMemo(() => {
    const path = Skia.Path.Make();
    if (lib) {
      // The solved outline (plate-normalised) to canvas; interior boundaries
      // (the ring's hole, the f-holes) cut out with even-odd filling.
      const toCanvas = (q: { x: number; y: number }) => ({ x: ox + q.x * plateW, y: oy + (q.y / aspect) * plateH });
      const poly = (pts: { x: number; y: number }[]) => {
        pts.forEach((q, k) => {
          const c = toCanvas(q);
          if (k === 0) path.moveTo(c.x, c.y);
          else path.lineTo(c.x, c.y);
        });
        path.close();
      };
      poly(lib.outline);
      for (const h of lib.holes) poly(h);
      path.setFillType(FillType.EvenOdd);
    } else if (circle) path.addCircle(ox + plateW / 2, oy + plateH / 2, plateW / 2);
    else path.addRRect({ rect: { x: ox, y: oy, width: plateW, height: plateH }, rx: 6, ry: 6 });
    return path;
  }, [lib, circle, ox, oy, plateW, plateH, aspect]);
  // Bell plate: the centre post the plate is clamped on (drawn as an object).
  const post = lib?.clampedPatch ? { cx: ox + lib.clampedPatch.x * plateW, cy: oy + (lib.clampedPatch.y / aspect) * plateH, r: Math.max(5, lib.clampedPatch.r * plateW) } : null;
  const finishLines = useMemo(() => {
    const path = Skia.Path.Make();
    const cx = ox + plateW / 2;
    const cy = oy + plateH / 2;
    const ang = mat.texture === 'grain' ? (spec.grainDeg * Math.PI) / 180 : mat.texture === 'brushed' ? 0 : Math.PI / 4;
    if (mat.texture === 'matte') return path;
    const R = Math.max(plateW, plateH) * 0.8;
    const step = mat.texture === 'grain' ? 7 : 4;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let d = -R; d <= R; d += step) {
      const wob = mat.texture === 'grain' ? Math.sin(d * 0.12) * 3 : 0;
      const px = -sa * (d + wob);
      const py = ca * (d + wob);
      path.moveTo(cx + px - ca * R, cy + py - sa * R);
      path.lineTo(cx + px + ca * R, cy + py + sa * R);
    }
    return path;
  }, [mat.texture, spec.grainDeg, ox, oy, plateW, plateH]);

  // Edge condition, drawn (learning pass B4): a clamped plate wears a dark
  // frame with screw heads; a supported one sits on a thin ledge. Library
  // shapes carry their own solved boundary and draw nothing extra.
  const edgeScrews = useMemo(() => {
    if (lib || spec.edge !== 'clamped') return [] as { x: number; y: number }[];
    const out: { x: number; y: number }[] = [];
    if (circle) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        out.push({ x: ox + plateW / 2 + Math.cos(a) * (plateW / 2 + 1), y: oy + plateH / 2 + Math.sin(a) * (plateH / 2 + 1) });
      }
    } else {
      const xs = [ox + 10, ox + plateW / 2, ox + plateW - 10];
      const ys = [oy + 10, oy + plateH / 2, oy + plateH - 10];
      for (const x of xs) for (const y of ys) if (x === ox + plateW / 2 && y === oy + plateH / 2) continue; else out.push({ x, y: y === oy + plateH / 2 ? y : y });
      // Keep the edge ring: mid points only on the edges, corners at the corners.
      return out.filter((q) => q.x === ox + 10 || q.x === ox + plateW - 10 || q.y === oy + 10 || q.y === oy + plateH - 10);
    }
    return out;
  }, [lib, spec.edge, circle, ox, oy, plateW, plateH]);

  // ── touch: drag the exciter / support / section ──────────────────────────
  const dragRef = useRef(p.dragTarget);
  dragRef.current = p.dragTarget;
  const cbRef = useRef({ onPlace: p.onPlace, onSection: p.onSection });
  cbRef.current = { onPlace: p.onPlace, onSection: p.onSection };
  const geom = useRef({ ox, oy, plateW, plateH, aspect, circle, lib });
  geom.current = { ox, oy, plateW, plateH, aspect, circle, lib };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dragRef.current != null,
      onMoveShouldSetPanResponder: () => dragRef.current != null,
      onPanResponderGrant: (e) => place(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => place(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;
  function place(lx: number, ly: number) {
    const g = geom.current;
    const t = dragRef.current;
    if (!t) return;
    let x = (lx - g.ox) / g.plateW;
    let y = ((ly - g.oy) / g.plateH) * g.aspect;
    if (t === 'section') {
      cbRef.current.onSection?.(Math.max(0, Math.min(1, y / g.aspect)));
      return;
    }
    x = Math.max(0.03, Math.min(0.97, x));
    y = Math.max(0.03, Math.min(g.aspect - 0.03, y));
    if (g.lib) {
      const q = librarySnapInside(g.lib, x, y / g.aspect);
      x = q.x;
      y = q.y * g.aspect;
    } else if (g.circle) {
      const dx = (x - 0.5) * 2;
      const dy = (y - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 0.92) {
        x = 0.5 + (dx / r) * 0.46;
        y = 0.5 + (dy / r) * 0.46;
      }
    }
    cbRef.current.onPlace?.(t, x, y);
  }

  const exX = ox + spec.exciter.x * plateW;
  const exY = oy + (spec.exciter.y / aspect) * plateH;
  const spX = spec.support ? ox + spec.support.x * plateW : null;
  const spY = spec.support ? oy + (spec.support.y / aspect) * plateH : null;
  const dotR = 0.9 + p.particleSize * 1.9;
  const showMesh = mesh != null && (view === 'heat' || view === 'overlay' || view === 'phase' || view === 'nodes' || view === 'section');

  return (
    <View
      style={{ width, height }}
      accessible
      accessibilityLabel={`Plate display, ${VIEW_LABELS[view].toLowerCase()} view, response ${Math.round(p.strength * 100)} percent${p.dragTarget ? `, drag on the plate to move the ${p.dragTarget === 'section' ? 'slice' : p.dragTarget}` : ''}`}
      {...pan.panHandlers}
    >
      <Canvas style={{ width, height }}>
        {/* Bench shadow under the plate */}
        <Group>
          <Path path={outline} color="rgba(0,0,0,0.55)" transform={[{ translateY: 6 }]} />
        </Group>
        {!is3d ? (
          <Group clip={outline}>
            {/* Machined face */}
            <Rect x={ox} y={oy} width={plateW} height={plateH}>
              <LinearGradient start={vec(ox, oy)} end={vec(ox + plateW, oy + plateH)} colors={[lighten(mat.face, 0.12), mat.face, mat.edge]} />
            </Rect>
            {mat.texture === 'glass' || mat.texture === 'polished' ? (
              <Rect x={ox} y={oy} width={plateW} height={plateH}>
                <RadialGradient c={vec(ox + plateW * 0.3, oy + plateH * 0.25)} r={plateW * 0.7} colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']} />
              </Rect>
            ) : null}
            <Path path={finishLines} style="stroke" strokeWidth={1} color={mat.texture === 'grain' ? 'rgba(80,50,20,0.28)' : 'rgba(255,255,255,0.07)'} />
            {/* Field mesh */}
            {showMesh && mesh ? (
              <Vertices
                vertices={mesh.verts}
                colors={mesh.cols}
                indices={mesh.idx}
                mode="triangles"
                opacity={view === 'overlay' ? 0.78 : view === 'section' ? 0.55 : view === 'phase' || view === 'nodes' ? 0.35 + 0.61 * strengthK : 0.96}
              />
            ) : null}
            {/* Section slice marker */}
            {view === 'section' ? (
              <SkLine p1={vec(ox, oy + p.sectionY * plateH)} p2={vec(ox + plateW, oy + p.sectionY * plateH)} color="#ffc64d" strokeWidth={1.5} />
            ) : null}
            {/* Sand */}
            {wantParticles ? <Points points={points} mode="points" strokeWidth={dotR * 2} strokeCap="round" color={SAND} /> : null}
          </Group>
        ) : (
          <Group>
            {/* Shadow on the bench, the plate's edge slab, then the face */}
            <Oval x={width / 2 - plateW * 0.5} y={height / 2 + height * 0.06 - plateH * 0.21 + 14} width={plateW} height={plateH * 0.42} color="rgba(0,0,0,0.45)" />
            <Vertices vertices={verts3d} indices={grid3d.idx} mode="triangles" color={mat.edge} transform={[{ translateY: 7 }]} />
            <Vertices vertices={verts3d} colors={grid3d.cols} indices={grid3d.idx} mode="triangles" />
          </Group>
        )}
        {/* Bevelled edge */}
        {!is3d ? <Path path={outline} style="stroke" strokeWidth={2.5} color={mat.edge} /> : null}
        {!is3d ? <Path path={outline} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.35)" /> : null}
        {/* Edge condition: clamp frame + screws, or a support ledge */}
        {!is3d && !lib && spec.edge === 'clamped' ? (
          <Group>
            <Path path={outline} style="stroke" strokeWidth={10} color="#26262b" />
            <Path path={outline} style="stroke" strokeWidth={10} color="#3a3a42" opacity={0.5} />
            <Path path={outline} style="stroke" strokeWidth={1} color="#6a6a74" />
            {edgeScrews.map((q, k) => (
              <Group key={k}>
                <Circle cx={q.x} cy={q.y} r={3.4} color="#8e8e96" />
                <Circle cx={q.x} cy={q.y} r={3.4} style="stroke" strokeWidth={0.8} color="#c4cad2" />
                <SkLine p1={vec(q.x - 2, q.y)} p2={vec(q.x + 2, q.y)} color="#2b2b30" strokeWidth={1} />
              </Group>
            ))}
          </Group>
        ) : null}
        {!is3d && !lib && spec.edge === 'supported' ? <Path path={outline} style="stroke" strokeWidth={6} color="#7a7a84" opacity={0.75} /> : null}
        {/* Cross-section profile */}
        {view === 'section' ? (
          <Group>
            <SkLine p1={vec(ox, oy + plateH + 54)} p2={vec(ox + plateW, oy + plateH + 54)} color={MIDLINE_BLUE} strokeWidth={1} />
            {/* The trace is a ± waveform: blue at the zero line, climbing the ramp to ± full excursion (colour standard). */}
            <Path path={sectionPath} style="stroke" strokeWidth={3} strokeJoin="round" strokeCap="round">
              <LinearGradient start={vec(0, oy + plateH + 54 - 26)} end={vec(0, oy + plateH + 54 + 26)} colors={WAVE_LEVEL_STOPS.map((q) => q.color)} positions={WAVE_LEVEL_STOPS.map((q) => q.offset)} />
            </Path>
          </Group>
        ) : null}
        {/* Bell plate: the centre post it is clamped on */}
        {!is3d && post ? (
          <Group>
            <Circle cx={post.cx} cy={post.cy} r={post.r + 2} color="rgba(0,0,0,0.5)" />
            <Circle cx={post.cx} cy={post.cy} r={post.r} color="#2b2b30" />
            <Circle cx={post.cx} cy={post.cy} r={post.r} style="stroke" strokeWidth={2} color="#5bb0ff" />
            <Circle cx={post.cx} cy={post.cy} r={Math.max(2, post.r * 0.35)} color="#5bb0ff" />
          </Group>
        ) : null}
        {/* Driver puck (magnet + coil) and clamp */}
        {!is3d ? (
          <Group>
            {/* Driver puck: a steel magnet cup lit from the upper-left, its copper coil ring, a drop shadow lower-right */}
            <Circle cx={exX + 2} cy={exY + 3} r={11} color="rgba(0,0,0,0.55)" />
            <Circle cx={exX} cy={exY} r={10}>
              <RadialGradient c={vec(exX - 3.5, exY - 3.5)} r={13} colors={['#7c7c88', '#3a3a42', '#17171b']} />
            </Circle>
            <Circle cx={exX} cy={exY} r={10} style="stroke" strokeWidth={1.2} color={p.dragTarget === 'exciter' ? '#ffc64d' : 'rgba(255,255,255,0.35)'} />
            <Circle cx={exX} cy={exY} r={6.2} style="stroke" strokeWidth={2.2} color="#b8743a" />
            <Circle cx={exX} cy={exY} r={6.2} style="stroke" strokeWidth={0.8} color="#e2a565" opacity={0.7} />
            <Circle cx={exX} cy={exY} r={2.6} color="#ff6b5e" />
            {spX != null && spY != null ? (
              <Group>
                {/* Clamp pad: a rubber-faced foot with a screw head */}
                <Circle cx={spX + 1.5} cy={spY + 2.5} r={9} color="rgba(0,0,0,0.5)" />
                <Circle cx={spX} cy={spY} r={8.5}>
                  <RadialGradient c={vec(spX - 3, spY - 3)} r={11} colors={['#5c6470', '#2f343c', '#15171b']} />
                </Circle>
                <Circle cx={spX} cy={spY} r={8.5} style="stroke" strokeWidth={1.2} color={p.dragTarget === 'support' ? '#ffc64d' : MIDLINE_BLUE} />
                <Circle cx={spX} cy={spY} r={3.2} color="#8e8e96" />
                <SkLine p1={vec(spX - 2.2, spY)} p2={vec(spX + 2.2, spY)} color="#1c1c20" strokeWidth={1} />
              </Group>
            ) : null}
          </Group>
        ) : null}
      </Canvas>
    </View>
  );
}

/** Intro strip: a pressure wave travelling as compressions / rarefactions of
 *  air, then the same vibration moving a plate — the first animated beat of
 *  "What is cymatics?". Pure Skia + one clock; nothing to configure. */
export function PressureWaveStrip({ width, height, running }: { width: number; height: number; running: boolean }) {
  const clock = useSharedValue(0);
  const cb = useFrameCallback((info) => {
    const dt = Math.min(info.timeSincePreviousFrame ?? 16, 48) / 1000;
    clock.value += dt;
  }, false);
  useEffect(() => {
    cb.setActive(running);
  }, [running, cb]);
  const n = 46;
  const pts = useDerivedValue(() => {
    const t = clock.value;
    const out: { x: number; y: number }[] = [];
    const rows = 5;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      // Longitudinal displacement of air molecules: x + A·sin(kx − ωt)
      const dx = Math.sin(u * Math.PI * 4 - t * 2 * Math.PI * 0.9) * (width / n) * 0.9;
      for (let r = 0; r < rows; r++) {
        out.push({ x: 10 + u * (width - 20) + dx, y: 10 + ((r + 0.5) / rows) * (height - 20) });
      }
    }
    return out;
  }, [width, height]);
  return (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color="#0b0b10" />
      <Points points={pts} mode="points" strokeWidth={5} strokeCap="round" color="#7fd4ff" />
    </Canvas>
  );
}

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bb = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bb})`;
}
function lighten(hex: string, amt: number): string {
  return mixHex(hex, '#ffffff', amt);
}

export const vizStyles = StyleSheet.create({});
export type { SharedValue };
