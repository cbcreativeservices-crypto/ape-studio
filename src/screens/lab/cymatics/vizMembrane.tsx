/**
 * cymatics/vizMembrane — the drumhead and the loudspeaker, drawn (spec §1.5,
 * Phase 3). ONLY loaded through skiaGate.requireVizMembrane().
 *
 * VISUAL STANDARDS (2026-07-29): illustrated real objects — a drum shell with
 * its hoop and tension rods and a translucent head; a loudspeaker cutaway
 * with magnet, basket, spider, voice coil, cone, surround and dust cap —
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

export function MembraneView(p: MembraneViewProps) {
  const { width, height, spec, grid, N, view } = p;
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
  const spk = useMemo(() => {
    const L = width * 0.58;
    const cxL = L / 2 + 6;
    const cyL = height / 2 + 4;
    const coneH = Math.min(height * 0.76, L * 0.78); // cone mouth height
    const depth = coneH * 0.42; // cone depth (mouth → coil)
    const mouthX = cxL + depth * 0.55;
    const coilX = mouthX - depth;
    const magnetX = coilX - coneH * 0.16;
    const fx = width * 0.58 + (width * 0.42) / 2;
    const fR = Math.min(height * 0.36, width * 0.17);
    return { cxL, cyL, coneH, depth, mouthX, coilX, magnetX, fx, fy: height / 2 + 4, fR };
  }, [width, height]);
  const coneGridSV = useSharedValue(p.cone?.grid ?? new Float32Array(0));
  const coneExcSV = useSharedValue(p.cone?.read.excursion ?? 0);
  const coneModeSV = useSharedValue(p.cone?.read.drawMode ?? 0);
  useEffect(() => {
    coneGridSV.value = p.cone?.grid ?? new Float32Array(0);
    coneExcSV.value = p.cone?.read.excursion ?? 0;
    coneModeSV.value = p.cone?.read.drawMode ?? 0;
  }, [p.cone, coneGridSV, coneExcSV, coneModeSV]);
  const coneN = 40; // finer than the head grid so the masked disc edge does not stair-step
  /** The moving assembly (cone profile + dust cap + coil) as one path. */
  const conePath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI);
    const exc = coneExcSV.value * ampSV.value;
    const mode = coneModeSV.value;
    const travel = z * exc * spk.depth * 0.32; // strobed excursion, px
    const { cyL, coneH, mouthX, coilX } = spk;
    const half = coneH / 2;
    const steps = 18;
    // Upper profile: coil → mouth (straight cone), then mirror.
    const prof = (s: number, sign: number) => {
      // s = 0 at the coil, 1 at the mouth. Displacement varies along the cone
      // by draw mode: piston = uniform; flex = centre leads the rim; radial =
      // rim lobes (opposite sign top/bottom); breakup = wobble.
      let w = 1;
      if (mode === 1) w = 1 - 0.65 * s * s;
      else if (mode >= 2 && mode <= 4) w = 1 - 0.5 * s + sign * 0.5 * s * s * Math.cos(t * 2 * Math.PI * 0.5 + mode);
      else if (mode === 5) w = 0.7 + 0.5 * Math.sin(s * 9 + t * 2 * Math.PI * 1.3) * s;
      const x = coilX + s * (mouthX - coilX) + travel * w;
      const y = cyL + sign * (half * 0.18 + s * (half - half * 0.18));
      return { x, y };
    };
    let first = true;
    for (let k = 0; k <= steps; k++) {
      const q = prof(k / steps, -1);
      if (first) {
        path.moveTo(q.x, q.y);
        first = false;
      } else path.lineTo(q.x, q.y);
    }
    for (let k = steps; k >= 0; k--) {
      const q = prof(k / steps, 1);
      path.lineTo(q.x, q.y);
    }
    path.close();
    return path;
  }, [spk]);
  const dustCap = useDerivedValue(() => {
    const t = clock.value;
    const z = Math.sin(t * 2 * Math.PI);
    const travel = z * coneExcSV.value * ampSV.value * spk.depth * 0.32;
    return { x: spk.coilX + travel, y: spk.cyL };
  }, [spk]);
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
  const geom = useRef({ cx, cy, R, oy, D });
  geom.current = { cx, cy, R, oy, D };
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

  return (
    // ANNOUNCE THE STAGE (design pass, 2026-09-17). The plate and liquid views
    // both describe themselves; this one said nothing at all, so the drum and
    // the loudspeaker were the only instruments in the lab invisible to a
    // screen reader. Same sentence shape as vizPlate, so the three read alike.
    <View
      style={{ width, height }}
      accessible
      accessibilityLabel={`${isSpeaker ? 'Loudspeaker' : 'Drum head'} display, ${MEMBRANE_VIEW_LABELS[view].toLowerCase()} view, response ${Math.round(p.strength * 100)} percent`}
      {...pan.panHandlers}
    >
      <Canvas style={{ width, height }}>
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
            {/* Magnet (dark steel), back plate, pole piece */}
            <Rect x={spk.magnetX - spk.coneH * 0.22} y={spk.cyL - spk.coneH * 0.26} width={spk.coneH * 0.22} height={spk.coneH * 0.52} color="#2d2d33" />
            <Rect x={spk.magnetX - spk.coneH * 0.22} y={spk.cyL - spk.coneH * 0.26} width={spk.coneH * 0.22} height={spk.coneH * 0.52} style="stroke" strokeWidth={1} color="#4a4a52" />
            <Rect x={spk.magnetX - spk.coneH * 0.06} y={spk.cyL - spk.coneH * 0.11} width={spk.coneH * 0.26} height={spk.coneH * 0.22} color="#3a3a42" />
            {/* Basket struts to the frame */}
            <SkLine p1={vec(spk.magnetX, spk.cyL - spk.coneH * 0.26)} p2={vec(spk.mouthX + 4, spk.cyL - spk.coneH / 2 - 8)} color="#55555e" strokeWidth={3} />
            <SkLine p1={vec(spk.magnetX, spk.cyL + spk.coneH * 0.26)} p2={vec(spk.mouthX + 4, spk.cyL + spk.coneH / 2 + 8)} color="#55555e" strokeWidth={3} />
            {/* Spider (corrugated) */}
            <SkLine p1={vec(spk.coilX + 6, spk.cyL - spk.coneH * 0.2)} p2={vec(spk.coilX + 6, spk.cyL + spk.coneH * 0.2)} color="#8a6a3a" strokeWidth={2} />
            {/* Frame flange at the mouth */}
            <Rect x={spk.mouthX + 2} y={spk.cyL - spk.coneH / 2 - 14} width={6} height={spk.coneH + 28} color="#55555e" />
            {/* The moving assembly: cone + surround + dust cap + voice coil */}
            <Path path={conePath} color="#8f7a58">
              <LinearGradient start={vec(spk.coilX, spk.cyL)} end={vec(spk.mouthX, spk.cyL)} colors={['#6f5d42', '#a08a62']} />
            </Path>
            <Path path={conePath} style="stroke" strokeWidth={1.5} color="#d9c9a4" />
            <Circle c={dustCap} r={spk.coneH * 0.11} color="#3a3a42" />
            <Circle c={dustCap} r={spk.coneH * 0.11} style="stroke" strokeWidth={1.2} color="#8e8e96" />
            {/* Surround: the half-roll at the mouth */}
            <Circle cx={spk.mouthX} cy={spk.cyL - spk.coneH / 2 - 4} r={6} style="stroke" strokeWidth={2.5} color="#2b2b30" />
            <Circle cx={spk.mouthX} cy={spk.cyL + spk.coneH / 2 + 4} r={6} style="stroke" strokeWidth={2.5} color="#2b2b30" />
            {/* Front view: the cone's displacement field */}
            <Circle cx={spk.fx} cy={spk.fy + 4} r={spk.fR + 10} color="rgba(0,0,0,0.5)" />
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR + 10} color="#3a3a42" />
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR + 4} color="#2b2b30" />
            {frontMesh ? <Vertices vertices={frontMesh.verts} colors={frontMesh.cols} indices={frontMesh.idx} mode="triangles" /> : null}
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR} style="stroke" strokeWidth={2} color="#8e8e96" />
            <Circle cx={spk.fx} cy={spk.fy} r={spk.fR * 0.2} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.35)" />
          </Group>
        ) : null}
      </Canvas>
      {isSpeaker && p.cone ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Text numberOfLines={1} style={[styles.lbl, { left: 10, top: 6 }]}>CUTAWAY · {p.cone.driver.label.toUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.lbl, { left: spk.fx - spk.fR - 10, top: 6, width: spk.fR * 2 + 20, textAlign: 'center' }]}>CONE FROM THE FRONT</Text>
          <Text numberOfLines={1} style={[styles.lbl, { left: 10, top: height - 18, color: colors.textSub }]}>
            excursion {Math.round(p.cone.read.excursion * 100)} % of resonance · ka {p.cone.read.ka.toFixed(2)}
            {p.cone.read.beamDeg != null ? ` · beam ≈ ${p.cone.read.beamDeg}°` : ' · omnidirectional'}
          </Text>
        </View>
      ) : null}
      {!isSpeaker ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Text numberOfLines={1} style={[styles.lbl, { left: 10, top: height - 18, color: colors.textSub }]}>
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
