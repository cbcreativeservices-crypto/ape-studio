/**
 * Wave Physics Lab — Skia renderer (launch build, owner spec v4 §10.1;
 * visual standards docs/APE_VISUAL_STANDARDS_2026_07_29.md).
 *
 * EVERY exported signature below is the CONTRACT the module files are written
 * against — names + props kept exactly as the stub published them.
 *
 * All physics comes from waveEngine (pure math): imageSources / fieldAt /
 * fieldDb drive the heat map, arrivalsAt drives the arrival fan, modePressure
 * the standing-wave map, maekawaAttenuationDb the diffraction shadow, and
 * refractedRayHeight the refraction fan. Everything here is an ILLUSTRATIVE
 * geometric/analytic MODEL — badges live in the module files (§1.7).
 *
 * House idioms (small helpers COPIED from micspeaker/viz.tsx with provenance
 * comments — labs never import each other's viz):
 *   · quantized jet colormap, ≤32 bucket paths, horizontal run-length merging
 *   · WavefrontRings-style constant-speed ring trains in useDerivedValue
 *   · GlowStroke / Floor scene dressing, upper-left light, lab palette
 *
 * PERFORMANCE: heat maps are memoized per parameter set (never per frame);
 * per-frame work is worklet-safe useDerivedValue paths with FIXED node counts;
 * dragging rounds meters to 0.05 so the heat useMemo key (the rounded scene
 * JSON) changes at most once per 5 cm step — the map is never rebuilt more
 * than once per gesture frame.
 *
 * ONLY this file imports Skia (via wave/skiaGate.requireWaveViz()).
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  ColorMatrix,
  DashPathEffect,
  Group,
  Image as SkImage,
  Line as SkLine,
  LinearGradient,
  Path,
  Skia,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { fonts } from '../../../theme/tokens';
import { heatColor, levelColor } from '../../../features/tools/levelColor';
import { useScrollLock } from '../LabShell';
import {
  MATERIALS,
  alphaAt,
  arrivalsAt,
  directivityGain,
  fieldAt,
  fieldDb,
  imageSources,
  maekawaAttenuationDb,
  modePressure,
  refractedRayHeight,
  speedOfSound,
  type MaterialKey,
  type WaveScene,
  type WaveSource,
} from './waveEngine';
export { usePhaseClock, useVizClock } from '../foundations/viz';

// ── Lab palette (same tokens as micspeaker/viz.tsx — visual standards §3) ────
const BG = '#0c0c0f';
const GRID = '#3a3b46';
const WAVE = '#ffc64d'; // amber accents / direct energy
const ACCENT_BLUE = '#6fa8ff'; // energy / 1st reflections
const ACCENT_GREEN = '#5bff85'; // good / listener tint
const LINE = '#d7dbe2'; // line-art icon stroke (head-icon spec)
const HEAD_PLATE = 'rgba(9,10,14,0.62)'; // ONLY fill the head icons allow
const BODY_HI = '#4a4d58';
const BODY_LO = '#1e1f26';

type SkPathT = ReturnType<typeof Skia.Path.Make>;

// ── Colormaps ────────────────────────────────────────────────────────────────
// The SPL heat map uses the app-wide amplitude ramp (levelColor heatColor:
// red = loud → blue = quiet), so it matches every meter, waveform and the
// other labs' heat maps (owner 2026-08-02). The MODAL pressure map keeps its
// own DIVERGING ramp below — it shows pressure SIGN (±), not loudness.

type RampStop = { t: number; rgb: [number, number, number] };

// Diverging ramp for MODAL pressure maps: bright ice blue at strong negative
// pressure, near-black at the nulls, warm amber at strong positive — so the
// nodal lines read as dark valleys between the two pressure signs.
const MODAL_STOPS: RampStop[] = [
  { t: 0.0, rgb: [140, 196, 255] },
  { t: 0.3, rgb: [42, 84, 176] },
  { t: 0.5, rgb: [8, 9, 14] },
  { t: 0.7, rgb: [156, 84, 24] },
  { t: 1.0, rgb: [255, 190, 92] },
];

function rampColor(stops: RampStop[], t01: number): string {
  const t = Math.max(0, Math.min(1, t01));
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1].t) i++;
  const a = stops[i];
  const b = stops[i + 1];
  const f = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
  const mix = (k: 0 | 1 | 2) => Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * f);
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
}

/** SPL heat-map colormap, t01 ∈ [0,1] (0 = quiet, 1 = loud) → the app-wide
 *  amplitude ramp. Kept named jetColor for the module legends that import it. */
export function jetColor(t01: number): string {
  return heatColor(t01);
}

/** Diverging modal colormap, t01 ∈ [0,1] (0 = −1 pressure, 1 = +1). */
export function modalColor(t01: number): string {
  return rampColor(MODAL_STOPS, t01);
}

const BUCKET_N = 32;
const JET_BUCKETS: string[] = Array.from({ length: BUCKET_N }, (_, i) => jetColor(i / (BUCKET_N - 1)));

/** Walk one row of a quantized field and emit ONE rect per contiguous run of
 *  same-bucket cells. Copied from micspeaker/viz.tsx (addFieldRow) — this
 *  horizontal RUN-LENGTH MERGE is what keeps a ~20 000-cell field down to a
 *  few thousand Skia rects. The +0.5 overlap kills hairline seams. */
function addFieldRow(
  buckets: SkPathT[],
  cols: number,
  x0: number,
  y: number,
  cw: number,
  ch: number,
  bucketOf: (c: number) => number,
): void {
  let runIdx = bucketOf(0);
  let runStart = 0;
  for (let c = 1; c < cols; c++) {
    const idx = bucketOf(c);
    if (idx !== runIdx) {
      buckets[runIdx].addRect(Skia.XYWHRect(x0 + runStart * cw, y, (c - runStart) * cw + 0.5, ch + 0.5));
      runIdx = idx;
      runStart = c;
    }
  }
  buckets[runIdx].addRect(Skia.XYWHRect(x0 + runStart * cw, y, (cols - runStart) * cw + 0.5, ch + 0.5));
}

/** Glow + crisp double-stroke for a styled curve (copied from micspeaker/viz). */
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

/** Floor strip: gradient ground + edge line (copied from micspeaker/viz). */
function Floor({ w, y, h }: { w: number; y: number; h: number }) {
  const rect = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, y, w, h));
    return p;
  }, [w, y, h]);
  return (
    <>
      <Path path={rect}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={['#17181d', '#0d0d10']} />
      </Path>
      <SkLine p1={{ x: 0, y }} p2={{ x: w, y }} color="#2a2b32" strokeWidth={1.2} />
    </>
  );
}

/** Head-and-shoulders bust contour (copied from micspeaker/viz appendBust) —
 *  ONE closed silhouette so the light line-art stroke traces a crisp edge. */
function appendBust(p: SkPathT, x: number, y: number, s: number) {
  p.moveTo(x - 8 * s, y);
  p.cubicTo(x - 8 * s, y - 4.6 * s, x - 6.6 * s, y - 6.8 * s, x - 4.2 * s, y - 7.6 * s);
  p.cubicTo(x - 2.8 * s, y - 8.1 * s, x - 2.1 * s, y - 8.6 * s, x - 2.0 * s, y - 9.6 * s);
  p.cubicTo(x - 3.2 * s, y - 10.6 * s, x - 3.9 * s, y - 11.9 * s, x - 3.9 * s, y - 13.2 * s);
  p.cubicTo(x - 3.9 * s, y - 15.4 * s, x - 2.2 * s, y - 16.7 * s, x, y - 16.7 * s);
  p.cubicTo(x + 2.2 * s, y - 16.7 * s, x + 3.9 * s, y - 15.4 * s, x + 3.9 * s, y - 13.2 * s);
  p.cubicTo(x + 3.9 * s, y - 11.9 * s, x + 3.2 * s, y - 10.6 * s, x + 2.0 * s, y - 9.6 * s);
  p.cubicTo(x + 2.1 * s, y - 8.6 * s, x + 2.8 * s, y - 8.1 * s, x + 4.2 * s, y - 7.6 * s);
  p.cubicTo(x + 6.6 * s, y - 6.8 * s, x + 8 * s, y - 4.6 * s, x + 8 * s, y);
  p.close();
}

/** Line-art bust over a readability plate (LineBusts idiom, micspeaker/viz). */
function LineBust({ path, stroke, sw }: { path: SkPathT; stroke: string; sw: number }) {
  return (
    <Group>
      <Path path={path} color={HEAD_PLATE} />
      <Path path={path} color={stroke} style="stroke" strokeWidth={sw} strokeCap="round" strokeJoin="round" />
    </Group>
  );
}

// ── Owner line-art icons (real uploaded assets — NOT redrawn) ────────────────
// The crossed-claves source icon and the front/side head icons the owner
// supplied (assets/icons/*). Those PNGs are keyed to transparency straight from
// the owner's exact pixels (luminance → alpha), so nothing is reinterpreted —
// the sticks cross exactly as drawn. Rendered as TINTED Skia images: a
// ColorMatrix recolors every pixel to the accent and keeps the source alpha,
// so ONE asset serves every tint (owner 2026-08-02, replacing the old buildClaves
// / ListenerGlyph vector redraws that distorted the crossing).
const ICON_HEAD_FRONT = require('../../../../assets/icons/head-front.png');

const HEAD_SIZE = 28; // listener head, px

type SkImageT = ReturnType<typeof useImage>;

/** Color matrix that recolors every pixel to `hex` and KEEPS the source alpha
 *  (the transparent line-art asset takes on the accent). */
function tintMatrix(hex: string): number[] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, 1, 0];
}
const PLATE_MATRIX = tintMatrix('#0a0b0e'); // dark soft backing for readability

/** Draw an owner icon centered at (cx,cy), longest side = `size` px, tinted to
 *  `color`. `plate` lays a blurred dark copy behind so the line art stays
 *  legible over the heat field (the head-icon plate idiom, image form). */
function IconMark({
  image,
  cx,
  cy,
  size,
  color,
  opacity = 1,
  plate = false,
}: {
  image: SkImageT;
  cx: number;
  cy: number;
  size: number;
  color: string;
  opacity?: number;
  plate?: boolean;
}) {
  if (!image) return null;
  const s = size / Math.max(image.width(), image.height());
  const w = image.width() * s;
  const h = image.height() * s;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return (
    <Group opacity={opacity}>
      {plate ? (
        <SkImage image={image} x={x - 1} y={y - 1} width={w + 2} height={h + 2} fit="contain">
          <ColorMatrix matrix={PLATE_MATRIX} />
          <BlurMask blur={3} style="normal" />
        </SkImage>
      ) : null}
      <SkImage image={image} x={x} y={y} width={w} height={h} fit="contain">
        <ColorMatrix matrix={tintMatrix(color)} />
      </SkImage>
    </Group>
  );
}

// ── Contract types (v4 §10.1 launch set — unchanged from the stub) ───────────

/** Toggleable visual layers (v4 §10.1 launch set). */
export type WaveLayers = {
  /** Animated pressure wavefronts expanding from each source + image rays. */
  pressure: boolean;
  /** Static-per-param SPL heat map (jet colormap) of the interference field. */
  heat: boolean;
  /** Image-source reflection ray paths source→wall→listener. */
  rays: boolean;
  /** Time-of-arrival markers at the listener. */
  arrivals: boolean;
};

export type RoomSceneProps = {
  scene: WaveScene;
  width: number;
  height?: number;
  freq: number;
  layers: WaveLayers;
  phase: SharedValue<number>;
  /** 'interference' = complex field of the sources (default) ·
   *  'modal' = standing-wave pattern for the given (nx, ny). */
  mode?: 'interference' | 'modal';
  modal?: { nx: number; ny: number };
  selectedId?: string | null;
  onDragSource?: (id: string, x: number, y: number) => void;
  onDragListener?: (x: number, y: number) => void;
  onSelect?: (id: string | null) => void;
  /** Fires true when an object drag starts, false on release/terminate — hosts
   *  wire this to their scroll-lock so the drag beats the ScrollView. Usually
   *  unneeded: RoomSceneView also locks via the ScrollLockProvider context. */
  onDragActive?: (active: boolean) => void;
};

// ── Room geometry: meters → px ───────────────────────────────────────────────

const WALL_T = 9; // wall strip thickness, px
const ROOM_MARGIN = 30; // canvas margin so wall strips + labels fit

type RoomGeo = { x0: number; y0: number; x1: number; y1: number; pxPerM: number; wPx: number; hPx: number; diag: number };

function roomGeo(scene: WaveScene, width: number, height: number): RoomGeo {
  const pxPerM = Math.max(
    1,
    Math.min((width - ROOM_MARGIN * 2) / scene.w, (height - ROOM_MARGIN * 2) / scene.h),
  );
  const wPx = scene.w * pxPerM;
  const hPx = scene.h * pxPerM;
  const x0 = (width - wPx) / 2;
  const y0 = (height - hPx) / 2;
  return { x0, y0, x1: x0 + wPx, y1: y0 + hPx, pxPerM, wPx, hPx, diag: Math.hypot(wPx, hPx) };
}

/** Heat-map memo key: the scene with every draggable coordinate ROUNDED to
 *  0.05 m. The drag handler rounds to the same grid before calling back, so a
 *  gesture only changes this key (→ rebuilds the map) once per 5 cm step. */
function sceneKey(scene: WaveScene): string {
  const r = (v: number) => Math.round(v / 0.05) * 0.05;
  return JSON.stringify({
    w: scene.w,
    h: scene.h,
    b: scene.boundary,
    t: scene.tempC,
    l: [r(scene.listener.x), r(scene.listener.y)],
    s: scene.sources.map((s) => [
      s.id, r(s.x), r(s.y), s.freq, s.levelDb, s.delayMs, s.polarity, s.kind,
      s.aimDeg ?? 0, s.coverageDeg ?? 90, s.muted ? 1 : 0,
    ]),
  });
}

// ── Wall strips: material color/texture hints ────────────────────────────────

const WALL_ART: Record<MaterialKey, { fill: string; accent: 'none' | 'spec' | 'hem' | 'ticks' | 'dots' | 'grain'; accentColor: string }> = {
  concrete: { fill: '#4b4e57', accent: 'none', accentColor: '' }, // flat slab gray
  glass: { fill: '#22384a', accent: 'spec', accentColor: '#9fd2f2' }, // pale + specular line
  drywall: { fill: '#5b5e66', accent: 'none', accentColor: '' },
  curtain: { fill: '#463a63', accent: 'hem', accentColor: '#8f7fc0' }, // soft wave hem
  carpet: { fill: '#4a3a2e', accent: 'ticks', accentColor: '#2e2318' },
  foam: { fill: '#23262c', accent: 'ticks', accentColor: '#3d434e' }, // dark + tick texture
  fiberglass: { fill: '#2e2620', accent: 'ticks', accentColor: '#5a4730' },
  wood: { fill: '#6b4a2c', accent: 'grain', accentColor: '#8a6238' },
  audience: { fill: '#2c3242', accent: 'dots', accentColor: '#6a7288' }, // dotted heads
  open: { fill: '', accent: 'none', accentColor: '' }, // dashed gap, no strip
};

type WallPiece = { path: SkPathT; color: string; width?: number; opacity: number; dash?: [number, number] };

/** Boundary strips: [top, right, bottom, left]. The inner-edge line brightness
 *  encodes REFLECTIVITY (1 − α at the current frequency) — reflective glass
 *  glints, absorptive fiberglass goes matte. Honest and pretty. */
function buildWalls(scene: WaveScene, geo: RoomGeo, freq: number): WallPiece[] {
  const { x0, y0, x1, y1 } = geo;
  const T = WALL_T;
  const pieces: WallPiece[] = [];
  for (let b = 0; b < 4; b++) {
    const mat = scene.boundary[b];
    const art = WALL_ART[mat];
    // Inner edge (room side) start/end, along unit, and normal INTO the strip.
    const horiz = b === 0 || b === 2;
    const sx = horiz ? x0 : b === 3 ? x0 : x1;
    const sy = horiz ? (b === 0 ? y0 : y1) : y0;
    const len = horiz ? x1 - x0 : y1 - y0;
    const ax = horiz ? 1 : 0;
    const ay = horiz ? 0 : 1;
    const nx = horiz ? 0 : b === 3 ? -1 : 1;
    const ny = horiz ? (b === 0 ? -1 : 1) : 0;
    const P = (t: number, off: number): [number, number] => [sx + ax * t + nx * off, sy + ay * t + ny * off];

    if (mat === 'open') {
      // Opening: no strip at all — a dashed gap along the boundary.
      const dashP = Skia.Path.Make();
      dashP.moveTo(sx, sy);
      dashP.lineTo(sx + ax * len, sy + ay * len);
      pieces.push({ path: dashP, color: '#7d828f', width: 1.6, opacity: 0.8, dash: [8, 7] });
      continue;
    }

    // Strip rect, extended past the corners so adjacent strips meet cleanly.
    const fill = Skia.Path.Make();
    if (horiz) fill.addRect(Skia.XYWHRect(x0 - T, b === 0 ? y0 - T : y1, len + 2 * T, T));
    else fill.addRect(Skia.XYWHRect(b === 3 ? x0 - T : x1, y0 - T, T, len + 2 * T));
    pieces.push({ path: fill, color: art.fill, opacity: 1 });

    // Material texture accents.
    if (art.accent === 'spec') {
      const spec = Skia.Path.Make();
      const [gx0, gy0] = P(len * 0.08, T * 0.45);
      const [gx1, gy1] = P(len * 0.92, T * 0.45);
      spec.moveTo(gx0, gy0);
      spec.lineTo(gx1, gy1);
      pieces.push({ path: spec, color: art.accentColor, width: 2, opacity: 0.4 });
      const hi = Skia.Path.Make();
      const [hx0, hy0] = P(len * 0.14, T * 0.28);
      const [hx1, hy1] = P(len * 0.5, T * 0.28);
      hi.moveTo(hx0, hy0);
      hi.lineTo(hx1, hy1);
      pieces.push({ path: hi, color: '#ffffff', width: 0.8, opacity: 0.55 });
    } else if (art.accent === 'hem') {
      const hem = Skia.Path.Make();
      let first = true;
      for (let t = 2; t <= len - 2; t += 4) {
        const [hx, hy] = P(t, T * 0.5 + 2.1 * Math.sin(t * 0.45));
        if (first) { hem.moveTo(hx, hy); first = false; } else hem.lineTo(hx, hy);
      }
      pieces.push({ path: hem, color: art.accentColor, width: 1.2, opacity: 0.6 });
    } else if (art.accent === 'ticks') {
      const ticks = Skia.Path.Make();
      for (let t = 5; t < len - 3; t += 8) {
        const [tx0, ty0] = P(t, 1.6);
        const [tx1, ty1] = P(t + 3.4, T - 1.6);
        ticks.moveTo(tx0, ty0);
        ticks.lineTo(tx1, ty1);
      }
      pieces.push({ path: ticks, color: art.accentColor, width: 1, opacity: 0.7 });
    } else if (art.accent === 'dots') {
      const dots = Skia.Path.Make();
      for (let t = 6; t < len - 4; t += 10) {
        const [dx, dy] = P(t, T * 0.5);
        dots.addCircle(dx, dy, 1.7);
      }
      pieces.push({ path: dots, color: art.accentColor, opacity: 0.85 });
    } else if (art.accent === 'grain') {
      const grain = Skia.Path.Make();
      for (const off of [T * 0.33, T * 0.66]) {
        const [gx0, gy0] = P(2, off);
        const [gx1, gy1] = P(len - 2, off);
        grain.moveTo(gx0, gy0);
        grain.lineTo(gx1, gy1);
      }
      pieces.push({ path: grain, color: art.accentColor, width: 0.9, opacity: 0.5 });
    }

    // Reflectivity edge on the room side: bright = reflective, matte = absorbed.
    const a = alphaAt(mat, freq);
    const edge = Skia.Path.Make();
    edge.moveTo(sx, sy);
    edge.lineTo(sx + ax * len, sy + ay * len);
    pieces.push({ path: edge, color: '#ffffff', width: 1.2, opacity: 0.08 + 0.5 * (1 - a) });
  }
  return pieces;
}

// ── Object glyphs (visual standards: no bare primitives for objects) ─────────

/** Mini top-view PA cabinet (shape after micspeaker/viz CabinetTop): trapezoid
 *  box + face gradient + horn slot, rotated to aimDeg, with a translucent
 *  coverage-wedge hint whose half-angle comes from the ACTUAL directivityGain
 *  −6 dB point at this frequency (coverage narrows with frequency — Module 9's
 *  whole lesson rides on this being real). */
function SpeakerGlyph({ src, x, y, freq, dim }: { src: WaveSource; x: number; y: number; freq: number; dim: boolean }) {
  const aim = src.aimDeg ?? 0;
  const halfDeg = useMemo(() => speakerHalfDeg(src, freq), [src, freq]);
  const parts = useMemo(() => {
    const s = 0.78;
    const box = Skia.Path.Make();
    const bw = 7.5 * s;
    const fw = 11.5 * s;
    const d = 17 * s;
    box.moveTo(-bw, -d);
    box.lineTo(bw, -d);
    box.lineTo(fw, 0);
    box.lineTo(-fw, 0);
    box.close();
    const horn = Skia.Path.Make();
    horn.addRRect(Skia.RRectXY(Skia.XYWHRect(-6.5 * s, -4.2 * s, 13 * s, 2.6 * s), 1.2 * s, 1.2 * s));
    // Coverage wedge hint: a pie opening toward local +y (the front).
    const wedge = Skia.Path.Make();
    const r = 34;
    const a0 = 90 - halfDeg;
    wedge.moveTo(0, 0);
    wedge.arcToOval(Skia.XYWHRect(-r, -r, 2 * r, 2 * r), a0, halfDeg * 2, false);
    wedge.close();
    return { box, horn, wedge };
  }, [halfDeg]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (-aim * Math.PI) / 180 }]} opacity={dim ? 0.35 : 1}>
      <Path path={parts.wedge} color={WAVE} opacity={0.08} />
      <Path path={parts.wedge} color={WAVE} style="stroke" strokeWidth={1} opacity={0.22} />
      <Path path={parts.box}>
        <LinearGradient start={vec(-9, -14)} end={vec(9, 0)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={parts.box} color="#5a5e6a" style="stroke" strokeWidth={1.1} />
      <Path path={parts.horn} color="#101116" />
    </Group>
  );
}

/** −6 dB half-angle of the engine's directivity model at this frequency. */
function speakerHalfDeg(src: WaveSource, freq: number): number {
  const aim = ((src.aimDeg ?? 0) * Math.PI) / 180;
  for (let d = 1; d <= 178; d++) {
    const a = aim + (d * Math.PI) / 180;
    if (directivityGain(src, Math.sin(a), Math.cos(a), freq) < 0.5) return d;
  }
  return 170;
}

/** Squat sub cabinet with LF radiation rings (subs are omni at these sizes). */
function SubGlyph({ x, y, dim }: { x: number; y: number; dim: boolean }) {
  const parts = useMemo(() => {
    const box = Skia.Path.Make();
    box.addRRect(Skia.RRectXY(Skia.XYWHRect(-9, -6.5, 18, 13), 2, 2));
    const port = Skia.Path.Make();
    port.addCircle(-4.2, 0, 2.1);
    port.addCircle(4.2, 0, 2.1);
    const rings = Skia.Path.Make();
    rings.addCircle(0, 0, 13);
    rings.addCircle(0, 0, 19);
    return { box, port, rings };
  }, []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]} opacity={dim ? 0.35 : 1}>
      <Path path={parts.rings} color={ACCENT_BLUE} style="stroke" strokeWidth={1} opacity={0.2} />
      <Path path={parts.box}>
        <LinearGradient start={vec(-8, -6)} end={vec(8, 6)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={parts.box} color="#5a5e6a" style="stroke" strokeWidth={1.1} />
      <Path path={parts.port} color="#101116" />
    </Group>
  );
}

/** The listener — line-art FRONT-head icon language (head-icon spec: light
 *  uniform stroke, rounded caps, NO fill except the readability plate). */
function ListenerGlyph({ x, y }: { x: number; y: number }) {
  const parts = useMemo(() => {
    const lines = Skia.Path.Make();
    lines.addCircle(0, -8.4, 4.8); // head
    lines.moveTo(-8.2, 3.4); // shoulders
    lines.cubicTo(-6.6, -1.4, -3.2, -3, 0, -3);
    lines.cubicTo(3.2, -3, 6.6, -1.4, 8.2, 3.4);
    const plate = Skia.Path.Make();
    plate.addCircle(0, -8.4, 4.8);
    plate.moveTo(-8.2, 3.4);
    plate.cubicTo(-6.6, -1.4, -3.2, -3, 0, -3);
    plate.cubicTo(3.2, -3, 6.6, -1.4, 8.2, 3.4);
    plate.close();
    return { lines, plate };
  }, []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Path path={parts.plate} color={HEAD_PLATE} />
      <Path path={parts.lines} color={LINE} style="stroke" strokeWidth={1.4} strokeCap="round" strokeJoin="round" />
      <Path path={parts.lines} color={ACCENT_GREEN} style="stroke" strokeWidth={1.4} strokeCap="round" strokeJoin="round" opacity={0.3} />
    </Group>
  );
}

// ── Pressure wavefront ring trains ───────────────────────────────────────────
// WavefrontRings idiom (micspeaker/viz): each unmuted source radiates a train
// of rings expanding at ONE constant speed, RING SPACING ∝ λ = c/freq
// (wavelength honesty — clamped to [12 px, 0.45·diag] so extremes stay
// readable; high freq = tight fronts hugging the source, low freq = wide
// fronts flooding the room). Speakers draw arcs across their REAL directivity
// wedge with a brighter axis core; additive blend so crossings reinforce.
// Node count is FIXED: RING_N ring indices × 2 strokes = 6 paths, regardless
// of source count (each ring path sums every source).

const RING_N = 3;

type RingSrc = { x: number; y: number; dirDeg: number; spreadDeg: number; spacing: number };

function RoomRing({
  phase,
  srcs,
  i,
  count = RING_N,
}: {
  phase: SharedValue<number>;
  srcs: RingSrc[];
  i: number;
  /** Length of the ring train (default RING_N). Scenes that must span a wide
   *  canvas at wavelength-true spacing pass a larger count so the wavefronts
   *  actually reach across (e.g. the diffraction barrier). */
  count?: number;
}) {
  const path = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    for (let k = 0; k < srcs.length; k++) {
      const s = srcs[k];
      const r = (f + i) * s.spacing;
      const maxR = count * s.spacing;
      if (r < 2.5 || r > maxR) continue;
      if (s.spreadDeg >= 355) {
        p.addCircle(s.x, s.y, r);
      } else {
        const box = { x: s.x - r, y: s.y - r, width: 2 * r, height: 2 * r };
        p.addArc(box, s.dirDeg - s.spreadDeg / 2, s.spreadDeg);
        // Brighter core along the axis (additive → hotter centre).
        p.addArc(box, s.dirDeg - s.spreadDeg / 4, s.spreadDeg / 2);
      }
    }
    return p;
  }, [phase, srcs, i, count]);
  const lineOp = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const u = (f + i) / count;
    return 0.42 * Math.min(1, u / 0.12) * (1 - u) * (1 - u);
  }, [phase, i, count]);
  const glowOp = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const u = (f + i) / count;
    return 0.2 * Math.min(1, u / 0.12) * (1 - u) * (1 - u);
  }, [phase, i, count]);
  return (
    <>
      <Path path={path} color="#bcd4ff" style="stroke" strokeWidth={3.4} opacity={glowOp} blendMode="plus">
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color="#e6f0ff" style="stroke" strokeWidth={1.2} opacity={lineOp} blendMode="plus" />
    </>
  );
}

// ── Pulse tracer (owner 2026-08-02) ─────────────────────────────────────────
// Every PULSE_MS a pulse leaves the source and a node rides EVERY visible ray
// at one constant speed (sound doesn't travel faster on longer paths), so the
// direct ray arrives first and each reflection arrives later in true
// path-length order. All traces complete by PULSE_ARRIVE of the cycle; the
// remainder is a beat of silence before the next pulse. Node counts are FIXED
// per frame (one circle per ray); the ring is one path.

const PULSE_MS = 3000; // 3 s between pulses — more time to watch the decay
const PULSE_ARRIVE = 0.9; // every reflection lands by 90% of the cycle
// Everything fades to nothing by this fraction of the cycle (2.98 s of 3 s),
// leaving a clean beat before the next pulse — catches even long free-bounce
// nodes that would otherwise still be travelling at the reset.
const PULSE_FADE_END = 2.98 / 3;
const PULSE_FADE_START = 0.9;

/** `segGain` = amplitude gain while travelling segment i (1.0 leaving the
 *  source, × √(1−α) after each bounce) — the MATERIAL loss. `free` traces are
 *  the extra diffuse reflections (multi-bounce paths that reach the listener);
 *  the rest are the line-traced image-source reflections. Every trace ENDS at
 *  the listener. */
type TraceRay = { pts: number[]; cum: number[]; len: number; order: number; segGain: number[]; free?: boolean };

// The nodes carry LOUDNESS in the app-wide MIDI velocity colours (levelColor:
// 1 = red / full scale → 0 = MIDI-0 blue / silence — src/features/tools/
// levelColor). A node's loudness = how far the wavefront has expanded (all
// nodes ride ONE wavefront, so distance ∝ elapsed time) × the material gain it
// has left. So a node LEAVES the source red and full-size and, as the front
// travels out, fades through orange → yellow → green → blue AND shrinks. Since
// short paths finish while the front is still near the source, the DIRECT node
// arrives red/orange and the long, multiply-bounced reflections arrive blue
// (owner 2026-08-02). Quantised into NODE_BUCKETS colour paths (fixed/frame).
const NODE_BUCKETS = 24;
// Loudness also drives BRIGHTNESS (owner 2026-08-02): as level rises the colour
// gets brighter (blended toward white by amp × NODE_BRIGHT), so the loudest red
// at emission is visibly brighter than the same red a moment later as it dims.
// amp = 0 blends nothing — the quiet blue floor is left exactly as-is (never
// darkened).
const NODE_BRIGHT = 0.42;
function brightenHex(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt).toString(16).padStart(2, '0');
  return `#${mix((n >> 16) & 255)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}
const NODE_COLORS: string[] = Array.from({ length: NODE_BUCKETS }, (_, i) => {
  const amp = i / (NODE_BUCKETS - 1);
  return brightenHex(levelColor(amp), amp * NODE_BRIGHT);
}); // index 0 = blue (quiet, unbrightened) … last = bright red (loud)

// A node's loudness has TWO parts (owner 2026-08-02):
//  1. DISTANCE — spherical spreading (1/r) referenced to the DIRECT path
//     length: a node is red/full at the direct distance and cools smoothly
//     red→orange→yellow→green→blue the farther it travels. So the shortest
//     path (the DIRECT sound) arrives red, and every LONGER reflection arrives
//     cooler, passing through all the in-between colours. DIST_POW < 1 softens
//     the 1/r curve so the mid colours get more of the room (lower = gentler,
//     slower red→blue transition).
//  2. MATERIAL — the accumulated reflection gain √(1−α) (segGain) STEPS the
//     loudness down at each bounce: glass (α≈0) barely, fiberglass (α≈0.98) a
//     lot, so an absorptive bounce drops the colour cooler right at the wall.
// The two multiply: distance gives the gradient, material gives the per-bounce
// step. Only the direct (shortest, unbounced) reaches the listener red.
const DIST_POW = 0.58;
// Stretch the distance/time colour decay so nodes hold their warmer colours
// ~37% longer before cooling (owner 2026-08-02) — scales the 1/r reference
// length, so any given colour is reached at 37% more travel (= time).
const NODE_TIME_STRETCH = 1.37;

type NodeState = { x: number; y: number; amp: number; r: number };

/** Position + loudness (amp 0..1) + radius of a ray's node at wavefront
 *  distance `dist` — travels source→listener, then holds at the listener. */
function nodeState(ray: TraceRay, dist: number, minLen: number, timeEnv: number): NodeState {
  'worklet';
  const travelled = Math.min(dist, ray.len); // stop at the listener
  let i = 1;
  while (i < ray.cum.length - 1 && travelled > ray.cum[i]) i++;
  const d0 = ray.cum[i - 1];
  const seg = ray.cum[i] - d0 || 1;
  const f = (travelled - d0) / seg;
  const x = ray.pts[(i - 1) * 2] + (ray.pts[i * 2] - ray.pts[(i - 1) * 2]) * f;
  const y = ray.pts[(i - 1) * 2 + 1] + (ray.pts[i * 2 + 1] - ray.pts[(i - 1) * 2 + 1]) * f;
  // Every sound LEAVES THE SOURCE FULL RED in EVERY room — before any bounce
  // the gain is 1, so the colour at the source is identical regardless of wall
  // treatment. It then cools with DISTANCE travelled and STEPS cooler at each
  // bounce by that wall's √(1−α) (glass barely, fiberglass a lot). So the rooms
  // differ only AFTER the walls act: a close/reflective path arrives redder, a
  // far/absorptive one arrives bluer. `timeEnv` decays everything to blue by
  // the end of the pulse (all full blue at PULSE_FADE_END).
  const gain = ray.segGain[i - 1] ?? 1; // material left on the CURRENT segment
  const ref = minLen * NODE_TIME_STRETCH;
  const level = gain * Math.pow(ref / Math.max(ref, travelled), DIST_POW);
  const amp = Math.max(0, Math.min(1, level * timeEnv));
  const r = 2.5 * (0.34 + 0.66 * amp);
  return { x, y, amp, r };
}

/** Global loudness envelope: full until PULSE_FADE_START, then eased to 0 by
 *  PULSE_FADE_END so every node is full blue (lowest level) at 2.98 s. */
function pulseTimeEnv(u: number): number {
  'worklet';
  if (u < PULSE_FADE_START) return 1;
  return Math.max(0, 1 - (u - PULSE_FADE_START) / (PULSE_FADE_END - PULSE_FADE_START));
}

/** The nodes for ALL rays, coloured by each ray's ECHO LEVEL (its own path
 *  length + material) on the MIDI ramp, decaying to blue over the pulse.
 *  Quantised into NODE_BUCKETS colour paths (fixed set of paths/frame). */
function PulseNodes({ t, traces, maxLen, minLen }: { t: SharedValue<number>; traces: TraceRay[]; maxLen: number; minLen: number }) {
  // A soft bloom under every node so they read over the heat field.
  const glow = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const dist = t.value * (maxLen / PULSE_ARRIVE);
    const env = pulseTimeEnv(t.value);
    for (let k = 0; k < traces.length; k++) {
      const n = nodeState(traces[k], dist, minLen, env);
      p.addCircle(n.x, n.y, n.r * 1.5);
    }
    return p;
  }, [t, traces, maxLen, minLen]);
  // One colour path per loudness bucket (fixed count → stable hook order).
  const buckets: SharedValue<SkPathT>[] = [];
  for (let b = 0; b < NODE_BUCKETS; b++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    buckets.push(
      useDerivedValue(() => {
        const p = Skia.Path.Make();
        const dist = t.value * (maxLen / PULSE_ARRIVE);
        const env = pulseTimeEnv(t.value);
        for (let k = 0; k < traces.length; k++) {
          const n = nodeState(traces[k], dist, minLen, env);
          if (Math.round(n.amp * (NODE_BUCKETS - 1)) === b) p.addCircle(n.x, n.y, n.r);
        }
        return p;
      }, [t, traces, maxLen, minLen]),
    );
  }
  return (
    <>
      <Path path={glow} color="#eaf0ff" opacity={0.26} blendMode="plus">
        <BlurMask blur={5} style="normal" />
      </Path>
      {buckets.map((path, b) => (
        <Path key={b} path={path} color={NODE_COLORS[b]} />
      ))}
    </>
  );
}

/** The pulse itself: a bright ring expanding from each source at the nodes'
 *  exact speed (the nodes ride this wavefront), fading as it grows. */
function PulseRing({
  t,
  origins,
  maxLen,
}: {
  t: SharedValue<number>;
  origins: { x: number; y: number }[];
  maxLen: number;
}) {
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const r = t.value * (maxLen / PULSE_ARRIVE);
    if (r > 1.5) for (let i = 0; i < origins.length; i++) p.addCircle(origins[i].x, origins[i].y, r);
    return p;
  }, [t, origins, maxLen]);
  const op = useDerivedValue(() => 0.5 * (1 - t.value) * (1 - t.value), [t]);
  const glowOp = useDerivedValue(() => 0.24 * (1 - t.value) * (1 - t.value), [t]);
  return (
    <>
      <Path path={path} color={WAVE} style="stroke" strokeWidth={2.8} opacity={glowOp} blendMode="plus">
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color="#ffe9bd" style="stroke" strokeWidth={1.2} opacity={op} blendMode="plus" />
    </>
  );
}

// ── Ray helpers (image-source reflection polylines) ──────────────────────────

/** Mirror a point across boundary b (same construct as waveEngine's internal
 *  mirror — kept here so ray polylines can be re-folded back into the room). */
function mirrorPt(x: number, y: number, b: number, W: number, H: number): [number, number] {
  return b === 0 ? [x, -y] : b === 1 ? [2 * W - x, y] : b === 2 ? [x, 2 * H - y] : [-x, y];
}

/** Intersection of segment A→B with wall b of the W×H room (meters).
 *  Returns null when the bounce point is off the wall — that image path is
 *  not a physical reflection and must not be drawn. */
function wallIntersect(ax: number, ay: number, bx: number, by: number, wall: number, W: number, H: number): [number, number] | null {
  let t: number;
  if (wall === 0 || wall === 2) {
    const yw = wall === 0 ? 0 : H;
    if (Math.abs(by - ay) < 1e-9) return null;
    t = (yw - ay) / (by - ay);
    if (t <= 0.001 || t >= 0.999) return null;
    const x = ax + (bx - ax) * t;
    if (x < -0.01 || x > W + 0.01) return null;
    return [x, yw];
  }
  const xw = wall === 1 ? W : 0;
  if (Math.abs(bx - ax) < 1e-9) return null;
  t = (xw - ax) / (bx - ax);
  if (t <= 0.001 || t >= 0.999) return null;
  const y = ay + (by - ay) * t;
  if (y < -0.01 || y > H + 0.01) return null;
  return [xw, y];
}

function appendArrow(p: SkPathT, x: number, y: number, ux: number, uy: number, size: number) {
  const bx = x - ux * size;
  const by = y - uy * size;
  p.moveTo(x, y);
  p.lineTo(bx - uy * size * 0.55, by + ux * size * 0.55);
  p.lineTo(bx + uy * size * 0.55, by - ux * size * 0.55);
  p.close();
}

/** Deterministic pseudo-random in [0,1) from an integer — stable across renders
 *  (the free nodes keep their directions between frames) yet looks random. */
function hashFrac(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** March from (px,py) in direction (dx,dy) to the first W×H wall it exits
 *  (meters). Returns the hit point + wall (0 top · 1 right · 2 bottom · 3 left). */
function marchWall(px: number, py: number, dx: number, dy: number, W: number, H: number): { x: number; y: number; wall: number } {
  let best = Infinity;
  let wall = 0;
  if (dx > 1e-9) { const t = (W - px) / dx; if (t < best) { best = t; wall = 1; } }
  else if (dx < -1e-9) { const t = -px / dx; if (t < best) { best = t; wall = 3; } }
  if (dy > 1e-9) { const t = (H - py) / dy; if (t < best) { best = t; wall = 2; } }
  else if (dy < -1e-9) { const t = -py / dy; if (t < best) { best = t; wall = 0; } }
  if (!Number.isFinite(best)) return { x: px, y: py, wall: 0 };
  return { x: px + dx * best, y: py + dy * best, wall };
}

/** Does segment (ax,ay)→(bx,by) pass within R of the listener (lx,ly)? If so,
 *  returns how far along the segment (0..1) the ray first enters the R circle —
 *  the point where the free node should end AT the listener's head. */
function segReachesListener(ax: number, ay: number, bx: number, by: number, lx: number, ly: number, R: number): number | null {
  const dx = bx - ax;
  const dy = by - ay;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-9) return null;
  let tt = ((lx - ax) * dx + (ly - ay) * dy) / L2;
  tt = Math.max(0, Math.min(1, tt));
  const cx = ax + dx * tt;
  const cy = ay + dy * tt;
  return Math.hypot(cx - lx, cy - ly) <= R ? tt : null;
}

const RAY_COLORS = [WAVE, ACCENT_BLUE, '#4d5d85']; // direct · 1st bounce · 2nd
const ARRIVAL_COLORS = [WAVE, ACCENT_BLUE, '#5a6c94'];

/** One arrival readout: time (geometric) + level relative to the direct (the
 *  material/frequency-driven number). */
type ArrivalLabel = { x: number; y: number; ms: string; db: string; color: string };

// ── RoomSceneView — the one view all 16 modules render through ───────────────

export function RoomSceneView(p: RoomSceneProps) {
  const h = p.height ?? 250;
  const w = p.width;
  const scene = p.scene;
  const freq = p.freq;
  const mode = p.mode ?? 'interference';
  const geo = useMemo(() => roomGeo(scene, w, h), [scene, w, h]);
  const key = sceneKey(scene);
  const headFrontImg = useImage(ICON_HEAD_FRONT);
  const nx = p.modal?.nx ?? 1;
  const ny = p.modal?.ny ?? 0;

  // ── HEAT: fine SPL map of the interference field / modal pressure map ─────
  // Memoized per (rounded scene, freq, mode, nx, ny) — NEVER per frame. Grid
  // ≤176×140 cells scaled to the room; ≤32 quantized buckets, one Path per
  // bucket, horizontal run-length merging (see addFieldRow).
  const heat = useMemo(() => {
    if (!p.layers.heat) return null;
    const COLS = Math.min(176, Math.max(64, Math.round(geo.wPx / 2.6)));
    const ROWS = Math.min(140, Math.max(48, Math.round(geo.hPx / 2.6)));
    const buckets: SkPathT[] = Array.from({ length: BUCKET_N }, () => Skia.Path.Make());
    const cw = geo.wPx / COLS;
    const ch = geo.hPx / ROWS;
    if (mode === 'modal') {
      for (let r = 0; r < ROWS; r++) {
        const my = ((r + 0.5) / ROWS) * scene.h;
        addFieldRow(buckets, COLS, geo.x0, geo.y0 + r * ch, cw, ch, (c) => {
          const mx = ((c + 0.5) / COLS) * scene.w;
          const pr = modePressure(scene, nx, ny, mx, my); // ±1
          // MIDI amplitude scheme (owner 2026-08-01): colour by |pressure| so a
          // node (0) reads as the navy silence floor and an antinode (1) as red
          // — identical to every other amplitude display in the app. The sign is
          // carried by the breathe (below), not by colour.
          return Math.round(Math.abs(pr) * (BUCKET_N - 1));
        });
      }
    } else {
      const images = scene.sources.map((s) => imageSources(scene, s, freq, 2));
      for (let r = 0; r < ROWS; r++) {
        const my = ((r + 0.5) / ROWS) * scene.h;
        addFieldRow(buckets, COLS, geo.x0, geo.y0 + r * ch, cw, ch, (c) => {
          const mx = ((c + 0.5) / COLS) * scene.w;
          const db = fieldDb(fieldAt(scene, mx, my, freq, images));
          return Math.round(Math.max(0, Math.min(1, (db + 30) / 42)) * (BUCKET_N - 1));
        });
      }
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, freq, mode, nx, ny, geo, p.layers.heat]);

  // Modal maps BREATHE with the phase clock when the pressure layer is on —
  // physically true: standing-wave pressure = pattern × cos(ωt). Colouring by
  // |pressure| on the app-wide MIDI ramp, the map swells at the antinodes (red)
  // and dims through the node/silence floor (navy) twice per cycle; |cos ωt|
  // carries that oscillation.
  const modalAnimate = p.layers.pressure && mode === 'modal';
  const modalOp = useDerivedValue(
    () => (modalAnimate ? Math.abs(Math.cos(p.phase.value)) * 0.92 : 0.92),
    [p.phase, modalAnimate],
  );

  // ── Static room dressing: interior, 1 m floor grid, wall strips ────────────
  const interior = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(geo.x0, geo.y0, geo.wPx, geo.hPx));
    return path;
  }, [geo]);
  const gridPath = useMemo(() => {
    const path = Skia.Path.Make();
    for (let gx = 1; gx < scene.w - 1e-6; gx++) {
      path.moveTo(geo.x0 + gx * geo.pxPerM, geo.y0);
      path.lineTo(geo.x0 + gx * geo.pxPerM, geo.y1);
    }
    for (let gy = 1; gy < scene.h - 1e-6; gy++) {
      path.moveTo(geo.x0, geo.y0 + gy * geo.pxPerM);
      path.lineTo(geo.x1, geo.y0 + gy * geo.pxPerM);
    }
    return path;
  }, [scene.w, scene.h, geo]);
  const walls = useMemo(() => buildWalls(scene, geo, freq), [key, geo, freq]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── RAYS: image-source reflection polylines, order ≤ 2 ────────────────────
  // Also emits TRACES — each ray's px polyline + cumulative segment lengths —
  // for the pulse tracer below (owner 2026-08-02).
  const rays = useMemo(() => {
    if (!p.layers.rays) return null;
    const byOrder = [Skia.Path.Make(), Skia.Path.Make(), Skia.Path.Make()];
    const arrows = [Skia.Path.Make(), Skia.Path.Make(), Skia.Path.Make()];
    const traces: TraceRay[] = [];
    const X = (mx: number) => geo.x0 + mx * geo.pxPerM;
    const Y = (my: number) => geo.y0 + my * geo.pxPerM;
    const L = scene.listener;
    for (const s of scene.sources) {
      if (s.muted) continue;
      for (const img of imageSources(scene, s, freq, 2)) {
        // The ROOM governs how a reflection BEHAVES (the node shrinks/dies as
        // it travels — see segGain), NOT how many rays emanate from the source
        // (owner 2026-08-02). So every geometric reflection is kept regardless
        // of material; only a genuinely OPEN boundary produces no reflection at
        // all (sound passes through), so those alone are dropped.
        if (img.bounces.some((b) => scene.boundary[b] === 'open')) continue;
        const order = img.bounces.length;
        let pts: [number, number][] | null = null;
        if (order === 0) {
          pts = [[s.x, s.y], [L.x, L.y]];
        } else if (order === 1) {
          const hit = wallIntersect(img.x, img.y, L.x, L.y, img.bounces[0], scene.w, scene.h);
          if (hit) pts = [[s.x, s.y], hit, [L.x, L.y]];
        } else {
          // Unfold twice: P2 on the LAST wall from the 2nd-order image, then
          // P1 on the first wall from the 1st-order image aimed at P2.
          const p2 = wallIntersect(img.x, img.y, L.x, L.y, img.bounces[1], scene.w, scene.h);
          if (p2) {
            const [i1x, i1y] = mirrorPt(s.x, s.y, img.bounces[0], scene.w, scene.h);
            const p1 = wallIntersect(i1x, i1y, p2[0], p2[1], img.bounces[0], scene.w, scene.h);
            if (p1) pts = [[s.x, s.y], p1, p2, [L.x, L.y]];
          }
        }
        if (!pts) continue;
        const path = byOrder[order];
        path.moveTo(X(pts[0][0]), Y(pts[0][1]));
        for (let i = 1; i < pts.length; i++) path.lineTo(X(pts[i][0]), Y(pts[i][1]));
        // Trace polyline (px) + cumulative lengths for the pulse nodes.
        const flat: number[] = [];
        for (const [mx, my] of pts) flat.push(X(mx), Y(my));
        const cum: number[] = [0];
        let total = 0;
        for (let i = 1; i < pts.length; i++) {
          total += Math.hypot(flat[i * 2] - flat[(i - 1) * 2], flat[i * 2 + 1] - flat[(i - 1) * 2 + 1]);
          cum.push(total);
        }
        // Per-SEGMENT amplitude gain (owner 2026-08-02): 1.0 until the first
        // bounce, then × √(1−α) of each wall hit — so the node's size after a
        // bounce shows the MATERIAL: glass (α≈0) keeps almost everything,
        // acoustic foam swallows most of it. Changing a wall material rebuilds
        // these gains (this memo keys on the scene), changing node behaviour.
        const segGain: number[] = [1];
        let g = 1;
        for (let bi = 0; bi < img.bounces.length; bi++) {
          g *= Math.sqrt(Math.max(0, 1 - alphaAt(scene.boundary[img.bounces[bi]], freq)));
          segGain.push(g);
        }
        traces.push({ pts: flat, cum, len: total, order, segGain });
        // Arrowhead just before the listener, along the final segment.
        const a = pts[pts.length - 2];
        const b = pts[pts.length - 1];
        const dx = X(b[0]) - X(a[0]);
        const dy = Y(b[1]) - Y(a[1]);
        const len = Math.hypot(dx, dy) || 1;
        appendArrow(arrows[order], X(b[0]) - (dx / len) * 12, Y(b[1]) - (dy / len) * 12, dx / len, dy / len, 6);
      }
    }
    // Free diffuse reflections (owner 2026-08-02): cast many rays that bounce
    // around the room and KEEP ONLY the ones that reach the listener's head —
    // extra multi-bounce reflection paths beyond the line-traced order-≤2 set.
    // Each keeps the √(1−α) material loss along its path, so a long/absorptive
    // route arrives quieter (bluer). Not line-traced — pulse nodes only.
    const FREE_CAST = 60; // rays cast per source
    const FREE_KEEP = 12; // max diffuse reflections drawn
    const FREE_MAX_BOUNCES = 6;
    const FREE_FADE = 0.02; // too quiet to have survived to the listener
    const LR = Math.max(0.35, 0.5 * (scene.w + scene.h) * 0.06); // head catch radius, m
    for (const s of scene.sources) {
      if (s.muted) continue;
      let kept = 0;
      for (let n = 0; n < FREE_CAST && kept < FREE_KEEP; n++) {
        const ang = hashFrac(n * 1.37 + 0.11) * Math.PI * 2;
        let dx = Math.cos(ang);
        let dy = Math.sin(ang);
        let px = s.x;
        let py = s.y;
        let amp = 1;
        const pathM: [number, number][] = [[px, py]];
        const segGain: number[] = [];
        let reached = false;
        for (let k = 0; k < FREE_MAX_BOUNCES; k++) {
          const hit = marchWall(px, py, dx, dy, scene.w, scene.h);
          // After ≥1 bounce, does this leg pass through the listener's head?
          if (k >= 1) {
            const tt = segReachesListener(px, py, hit.x, hit.y, scene.listener.x, scene.listener.y, LR);
            if (tt !== null) {
              pathM.push([scene.listener.x, scene.listener.y]);
              segGain.push(amp);
              reached = true;
              break;
            }
          }
          pathM.push([hit.x, hit.y]);
          segGain.push(amp);
          if (scene.boundary[hit.wall] === 'open') break; // exits the room — lost
          const aAfter = amp * Math.sqrt(Math.max(0, 1 - alphaAt(scene.boundary[hit.wall], freq)));
          if (aAfter < FREE_FADE) break; // absorbed before reaching the listener
          if (hit.wall === 0 || hit.wall === 2) dy = -dy; else dx = -dx;
          amp = aAfter;
          px = hit.x;
          py = hit.y;
        }
        if (!reached) continue; // only keep rays that end at the listener
        const flat: number[] = [];
        for (const [mx, my] of pathM) flat.push(X(mx), Y(my));
        const cum: number[] = [0];
        let total = 0;
        for (let i = 1; i < pathM.length; i++) {
          total += Math.hypot(flat[i * 2] - flat[(i - 1) * 2], flat[i * 2 + 1] - flat[(i - 1) * 2 + 1]);
          cum.push(total);
        }
        if (total > 1) {
          traces.push({ pts: flat, cum, len: total, order: 0, segGain, free: true });
          kept++;
        }
      }
    }
    return { byOrder, arrows, traces };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, freq, geo, p.layers.rays]);

  // ── PULSE TRACER (owner 2026-08-02): with RAYS + PRESSURE both on, every
  // 2 s a pulse leaves the source; a node rides EVERY visible ray at ONE
  // constant speed, so the direct ray lands at the listener first and each
  // reflection lands later in true path-length order — all before the next
  // pulse fires. A bright expanding ring marks the pulse itself; the ring
  // radius IS the nodes' travelled distance (they ride its wavefront).
  const traces = rays && p.layers.pressure && mode !== 'modal' ? rays.traces : null;
  const tracing = !!traces && traces.length > 0;
  // Pacing spans the LONGEST path (incl. diffuse reflections) so they all reach
  // the listener within the pulse; the colour reference is the SHORTEST real
  // reflection = the direct sound (reddest), so echo colour tracks path length.
  const maxLen = useMemo(() => {
    let m = 1;
    if (traces) for (const r of traces) m = Math.max(m, r.len);
    return m;
  }, [traces]);
  const minLen = useMemo(() => {
    let m = Infinity;
    if (traces) for (const r of traces) if (!r.free) m = Math.min(m, r.len);
    return Number.isFinite(m) ? m : 1;
  }, [traces]);
  const pulseOrigins = useMemo(() => {
    if (!traces) return [];
    const seen = new Set<string>();
    const out: { x: number; y: number }[] = [];
    for (const r of traces) {
      const k = `${Math.round(r.pts[0])},${Math.round(r.pts[1])}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push({ x: r.pts[0], y: r.pts[1] });
      }
    }
    return out;
  }, [traces]);
  const pulseT = useSharedValue(0);
  useEffect(() => {
    if (!tracing) {
      cancelAnimation(pulseT);
      pulseT.value = 0;
      return;
    }
    pulseT.value = 0;
    pulseT.value = withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(pulseT);
  }, [tracing, pulseT]);

  // ── ARRIVALS: fan of time-of-arrival ticks at the listener ────────────────
  const arrivalFan = useMemo(() => {
    if (!p.layers.arrivals) return null;
    const list = arrivalsAt(scene, scene.listener.x, scene.listener.y, freq, 2).slice(0, 5);
    if (list.length === 0) return { ticks: [] as { path: SkPathT; color: string }[], labels: [] as ArrivalLabel[] };
    const lx = geo.x0 + scene.listener.x * geo.pxPerM;
    const ly = geo.y0 + scene.listener.y * geo.pxPerM;
    const maxDb = list[0].levelDb; // the direct arrival (earliest = loudest)
    const byColor = new Map<string, SkPathT>();
    const labels: ArrivalLabel[] = [];
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const ang = ((-135 + (i * 90) / Math.max(1, list.length - 1)) * Math.PI) / 180;
      // Level of THIS arrival relative to the direct — the number the ROOM and
      // FREQUENCY actually move: reflected arrivals lose √(1−α) of amplitude at
      // every bounce (glass barely drops, fiberglass plummets), and α is
      // frequency-dependent, so switching material or sweeping frequency
      // re-labels every reflected tick (owner 2026-08-02). Direct = 0.0 dB ref.
      const relDb = a.levelDb - maxDb;
      const norm = Math.pow(10, relDb / 20); // 0..1 linear, drives tick length
      const r0 = 14;
      const r1 = r0 + 8 + 20 * norm;
      const color = ARRIVAL_COLORS[Math.min(2, a.bounces.length)];
      let path = byColor.get(color);
      if (!path) { path = Skia.Path.Make(); byColor.set(color, path); }
      path.moveTo(lx + Math.cos(ang) * r0, ly - 4 + Math.sin(ang) * r0);
      path.lineTo(lx + Math.cos(ang) * r1, ly - 4 + Math.sin(ang) * r1);
      const lr = r1 + (i % 2 === 0 ? 12 : 24); // stagger so close arrivals don't collide
      labels.push({
        x: lx + Math.cos(ang) * lr,
        y: ly - 4 + Math.sin(ang) * lr,
        ms: `${(a.t * 1000).toFixed(1)} ms`,
        db: i === 0 ? 'direct' : `${relDb <= -0.05 ? '−' : ''}${Math.abs(relDb).toFixed(0)} dB`,
        color,
      });
    }
    return { ticks: Array.from(byColor, ([color, path]) => ({ path, color })), labels };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, freq, geo, p.layers.arrivals]);

  // Pulsing listener halo (arrivals layer) — soft breathing, eased by sin.
  const haloR = useDerivedValue(() => 12 + 2.6 * Math.sin(p.phase.value * 0.7), [p.phase]);
  const haloOp = useDerivedValue(() => 0.26 + 0.12 * Math.sin(p.phase.value * 0.7), [p.phase]);

  // ── PRESSURE ring-train sources (per-source constants precomputed here;
  //    the per-frame worklets above only do arithmetic on them) ──────────────
  const ringSrcs = useMemo<RingSrc[]>(() => {
    if (!p.layers.pressure || mode === 'modal') return [];
    const c = speedOfSound(scene.tempC);
    const lambdaPx = (c / Math.max(20, freq)) * geo.pxPerM;
    const spacing = Math.max(12, Math.min(geo.diag * 0.45, lambdaPx));
    return scene.sources
      .filter((s) => !s.muted)
      .map((s) => ({
        x: geo.x0 + s.x * geo.pxPerM,
        y: geo.y0 + s.y * geo.pxPerM,
        dirDeg: 90 - (s.aimDeg ?? 0), // screen angle of the aim vector (sin a, cos a)
        spreadDeg: s.kind === 'speaker' ? Math.min(340, 2 * speakerHalfDeg(s, freq) + 24) : 360,
        spacing,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, freq, geo, p.layers.pressure, mode]);

  // Pulsing point-source dots: ONE derived path for every point source.
  const pointSrcs = useMemo(
    () => scene.sources.filter((s) => s.kind === 'point').map((s) => ({
      x: geo.x0 + s.x * geo.pxPerM,
      y: geo.y0 + s.y * geo.pxPerM,
      muted: !!s.muted,
    })),
    [key, geo], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // Selection ring position (amber, per contract selectedId).
  const selPos = useMemo(() => {
    if (!p.selectedId) return null;
    if (p.selectedId === 'listener') {
      return { x: geo.x0 + scene.listener.x * geo.pxPerM, y: geo.y0 + scene.listener.y * geo.pxPerM };
    }
    const s = scene.sources.find((q) => q.id === p.selectedId);
    return s ? { x: geo.x0 + s.x * geo.pxPerM, y: geo.y0 + s.y * geo.pxPerM } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.selectedId, key, geo]);

  // ── Dragging: sources + listener (micspeaker HandSection idiom — the canvas
  //   is a dedicated interactive area, so we CLAIM ON TOUCH START; scrolling
  //   starts from anywhere else on the screen). Callbacks report METERS,
  //   clamped 0.2 m inside the room and rounded to 0.05 m (see sceneKey note).
  // Scroll-lock (owner 2026-07-30 drag-vs-scroll fix): the object drag must win
  // over the host ScrollView on every platform (Android's native ScrollView
  // otherwise steals vertical movement). Lock on grant, free on release/
  // terminate — via the ScrollLockProvider context (auto, no threading) plus an
  // explicit onDragActive for hosts that supply no provider.
  const ctxLock = useScrollLock();
  const stateRef = useRef({ scene, geo, cb: { s: p.onDragSource, l: p.onDragListener, sel: p.onSelect }, lock: ctxLock, onDragActive: p.onDragActive });
  stateRef.current = { scene, geo, cb: { s: p.onDragSource, l: p.onDragListener, sel: p.onSelect }, lock: ctxLock, onDragActive: p.onDragActive };
  const setScrollLock = (v: boolean) => {
    stateRef.current.lock?.(v);
    stateRef.current.onDragActive?.(v);
  };
  const grabRef = useRef<{ kind: 'src' | 'listener'; id: string; offX: number; offY: number; sx: number; sy: number; moved: boolean } | null>(null);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setScrollLock(true);
        const st = stateRef.current;
        const px = e.nativeEvent.locationX;
        const py = e.nativeEvent.locationY;
        const toX = (mx: number) => st.geo.x0 + mx * st.geo.pxPerM;
        const toY = (my: number) => st.geo.y0 + my * st.geo.pxPerM;
        let best: { kind: 'src' | 'listener'; id: string; ox: number; oy: number } | null = null;
        let bestD = 26; // touch radius, px
        for (const s of st.scene.sources) {
          const d = Math.hypot(px - toX(s.x), py - toY(s.y));
          if (d < bestD) { bestD = d; best = { kind: 'src', id: s.id, ox: toX(s.x), oy: toY(s.y) }; }
        }
        const ld = Math.hypot(px - toX(st.scene.listener.x), py - toY(st.scene.listener.y));
        if (ld < bestD) best = { kind: 'listener', id: 'listener', ox: toX(st.scene.listener.x), oy: toY(st.scene.listener.y) };
        grabRef.current = best
          ? { kind: best.kind, id: best.id, offX: px - best.ox, offY: py - best.oy, sx: px, sy: py, moved: false }
          : null;
      },
      onPanResponderMove: (e) => {
        const g = grabRef.current;
        if (!g) return;
        const st = stateRef.current;
        const px = e.nativeEvent.locationX;
        const py = e.nativeEvent.locationY;
        if (!g.moved && Math.hypot(px - g.sx, py - g.sy) < 4) return; // tap slop
        g.moved = true;
        const snap = (v: number, max: number) =>
          Math.min(Math.max(0.2, max - 0.2), Math.max(0.2, Math.round(v / 0.05) * 0.05));
        const mx = snap((px - g.offX - st.geo.x0) / st.geo.pxPerM, st.scene.w);
        const my = snap((py - g.offY - st.geo.y0) / st.geo.pxPerM, st.scene.h);
        if (g.kind === 'src') st.cb.s?.(g.id, mx, my);
        else st.cb.l?.(mx, my);
      },
      onPanResponderRelease: () => {
        const g = grabRef.current;
        const sel = stateRef.current.cb.sel;
        if (!g) sel?.(null);
        else if (!g.moved) sel?.(g.id);
        grabRef.current = null;
        setScrollLock(false);
      },
      onPanResponderTerminate: () => {
        grabRef.current = null;
        setScrollLock(false);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // Wall material labels (RNText, mono — labels live OUTSIDE the canvas, the
  // house label idiom; rotated for the side walls).
  const midX = (geo.x0 + geo.x1) / 2;
  const midY = (geo.y0 + geo.y1) / 2;
  const matLabel = (b: number) => MATERIALS[scene.boundary[b]].label.toUpperCase();

  return (
    <View style={{ width: w, height: h }} {...pan.panHandlers}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        {/* Room interior: subtle depth so the field never floats on flat black. */}
        <Path path={interior}>
          <LinearGradient start={vec(geo.x0, geo.y0)} end={vec(geo.x1, geo.y1)} colors={['#15161c', '#0e0f13']} />
        </Path>
        {/* HEAT map (≤32 bucket paths, memoized — see the useMemo above). */}
        {heat && mode === 'modal' ? (
          <Group opacity={modalOp}>
            {heat.map((path, i) => (
              <Path key={i} path={path} color={JET_BUCKETS[i]} />
            ))}
          </Group>
        ) : null}
        {heat && mode !== 'modal'
          ? heat.map((path, i) => <Path key={i} path={path} color={JET_BUCKETS[i]} opacity={0.88} />)
          : null}
        {/* 1 m floor grid, dim (a touch brighter when no field covers it). */}
        <Path path={gridPath} color={heat ? '#ffffff' : GRID} style="stroke" strokeWidth={1} opacity={heat ? 0.09 : 0.55} />
        {/* Wall strips: material hints + reflectivity edge. */}
        {walls.map((wp, i) =>
          wp.dash ? (
            <Path key={i} path={wp.path} color={wp.color} style="stroke" strokeWidth={wp.width ?? 1} opacity={wp.opacity}>
              <DashPathEffect intervals={wp.dash} />
            </Path>
          ) : (
            <Path
              key={i}
              path={wp.path}
              color={wp.color}
              style={wp.width != null ? 'stroke' : 'fill'}
              strokeWidth={wp.width ?? 1}
              opacity={wp.opacity}
            />
          ),
        )}
        {/* RAYS: direct amber → 1st bounce blue → 2nd dim, with arrowheads. */}
        {rays ? (
          <>
            <GlowStroke path={rays.byOrder[0]} color={RAY_COLORS[0]} width={1.6} opacity={0.85} />
            <Path path={rays.byOrder[1]} color={RAY_COLORS[1]} style="stroke" strokeWidth={1.3} opacity={0.6} />
            <Path path={rays.byOrder[2]} color={RAY_COLORS[2]} style="stroke" strokeWidth={1.1} opacity={0.42} />
            <Path path={rays.arrows[0]} color={RAY_COLORS[0]} opacity={0.9} />
            <Path path={rays.arrows[1]} color={RAY_COLORS[1]} opacity={0.65} />
            <Path path={rays.arrows[2]} color={RAY_COLORS[2]} opacity={0.45} />
          </>
        ) : null}
        {/* PRESSURE: constant-speed, wavelength-spaced ring trains (worklets;
            fixed 3 rings × 2 strokes = 6 paths regardless of source count). */}
        {ringSrcs.length > 0
          ? Array.from({ length: RING_N }, (_, i) => <RoomRing key={i} phase={p.phase} srcs={ringSrcs} i={i} />)
          : null}
        {/* PULSE TRACER (RAYS + PRESSURE combined): the 2 s pulse ring + one
            node per ray riding its line at constant speed — direct arrives
            first, reflections later, all landed before the next pulse. */}
        {tracing && traces ? (
          <>
            <PulseRing t={pulseT} origins={pulseOrigins} maxLen={maxLen} />
            <PulseNodes t={pulseT} traces={traces} maxLen={maxLen} minLen={minLen} />
          </>
        ) : null}
        {/* ARRIVALS: tick fan + pulsing listener halo. */}
        {arrivalFan ? (
          <>
            <Circle cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM - 4} r={haloR} color={ACCENT_GREEN} style="stroke" strokeWidth={1.4} opacity={haloOp}>
              <BlurMask blur={3} style="normal" />
            </Circle>
            {arrivalFan.ticks.map((t, i) => (
              <Path key={i} path={t.path} color={t.color} style="stroke" strokeWidth={2} strokeCap="round" opacity={0.85} />
            ))}
          </>
        ) : null}
        {/* Sources: illustrated glyphs by kind (visual standards §1). Point
            sources use the small side-view PA speaker (same icon as the
            diffraction lab), owner 2026-08-02. */}
        {pointSrcs.filter((s) => !s.muted).map((s, i) => (
          <SideSpeakerGlyph key={`spk${i}`} x={s.x} y={s.y} s={1.15} />
        ))}
        {scene.sources.map((s) =>
          s.kind === 'speaker' ? (
            <SpeakerGlyph key={s.id} src={s} x={geo.x0 + s.x * geo.pxPerM} y={geo.y0 + s.y * geo.pxPerM} freq={freq} dim={!!s.muted} />
          ) : s.kind === 'sub' ? (
            <SubGlyph key={s.id} x={geo.x0 + s.x * geo.pxPerM} y={geo.y0 + s.y * geo.pxPerM} dim={!!s.muted} />
          ) : s.muted ? (
            // Muted point source: the claves icon skips it; show a dim core ring.
            <Circle key={s.id} cx={geo.x0 + s.x * geo.pxPerM} cy={geo.y0 + s.y * geo.pxPerM} r={3.2} color="#6a6e7a" style="stroke" strokeWidth={1.2} opacity={0.5} />
          ) : null,
        )}
        {/* The listener — the owner's front-head line icon (LINE + a green
            accent wash), falling back to the vector glyph while it loads. */}
        {headFrontImg ? (
          <>
            <IconMark image={headFrontImg} cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM} size={HEAD_SIZE} color={LINE} plate />
            <IconMark image={headFrontImg} cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM} size={HEAD_SIZE} color={ACCENT_GREEN} opacity={0.28} />
          </>
        ) : (
          <ListenerGlyph x={geo.x0 + scene.listener.x * geo.pxPerM} y={geo.y0 + scene.listener.y * geo.pxPerM} />
        )}
        {/* Selection: amber ring (sources by id, listener as 'listener'). */}
        {selPos ? (
          <Circle cx={selPos.x} cy={selPos.y} r={16} color={WAVE} style="stroke" strokeWidth={1.6} opacity={0.85} />
        ) : null}
      </Canvas>
      {/* Labels (outside the canvas — mono, house label idiom). */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <RNText style={[styles.wallLabel, { left: midX - 50, top: geo.y0 - WALL_T - 14, width: 100, textAlign: 'center' }]}>
          {matLabel(0)}
        </RNText>
        <RNText style={[styles.wallLabel, { left: midX - 50, top: geo.y1 + WALL_T + 2, width: 100, textAlign: 'center' }]}>
          {matLabel(2)}
        </RNText>
        <RNText
          style={[styles.wallLabel, { left: geo.x1 + WALL_T - 43, top: midY - 7, width: 100, textAlign: 'center', transform: [{ rotate: '90deg' }] }]}
        >
          {matLabel(1)}
        </RNText>
        <RNText
          style={[styles.wallLabel, { left: geo.x0 - WALL_T - 57, top: midY - 7, width: 100, textAlign: 'center', transform: [{ rotate: '-90deg' }] }]}
        >
          {matLabel(3)}
        </RNText>
        {arrivalFan
          ? arrivalFan.labels.map((l, i) => (
              <View key={i} pointerEvents="none" style={{ position: 'absolute', left: l.x - 24, top: l.y - 10, width: 48, alignItems: 'center' }}>
                <RNText style={[styles.msLabel, { color: l.color }]}>{l.ms}</RNText>
                <RNText style={[styles.dbLabel, { color: l.color }]}>{l.db}</RNText>
              </View>
            ))
          : null}
      </View>
    </View>
  );
}

// ── BarrierSceneView — diffraction (Maekawa knife edge), side view ───────────
// Source left · knife-edge barrier mid · shadow zone right shaded by the REAL
// maekawaAttenuationDb over a grid. Wavefronts are wavelength-true rings; past
// the edge a secondary (Huygens) train wraps into the shadow, its brightness
// per angular band taken from the same Maekawa dB — so low frequencies visibly
// wrap and high frequencies cast a hard shadow.

const BARRIER_SCENE_M = 30; // canvas width spans 30 m (side view)
const BARRIER_TEMP_C = 20;

/** A whole wavefront TRAIN drawn in ONE worklet path — a full run of concentric
 *  circles at wavelength-true spacing. One component (not N RoomRings), so the
 *  barrier scene reconciles cheaply while a slider drags on the JS thread. The
 *  circles are drawn to `maxR` (clipped by the count loop and the canvas), so
 *  the wave reaches the barrier and beyond regardless of frequency. */
function WaveTrain({
  phase,
  x,
  y,
  spacing,
  count,
  maxR,
}: {
  phase: SharedValue<number>;
  x: number;
  y: number;
  spacing: number;
  count: number;
  maxR: number;
}) {
  const path = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    for (let k = 0; k < count; k++) {
      const r = (f + k) * spacing;
      if (r >= 2.5 && r <= maxR) p.addCircle(x, y, r);
    }
    return p;
  }, [phase, x, y, spacing, count, maxR]);
  return (
    <>
      <Path path={path} color="#bcd4ff" style="stroke" strokeWidth={3.0} opacity={0.15} blendMode="plus">
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color="#e6f0ff" style="stroke" strokeWidth={1.2} opacity={0.32} blendMode="plus" />
    </>
  );
}

/** The diffracted (Huygens) wavelet train wrapping past the barrier edge, drawn
 *  as ONE worklet path per band. `amp` (real Maekawa dB at the band's mid-angle)
 *  sets brightness — low freq wraps visibly, highs stay in shadow. */
function DiffractedTrain({
  phase,
  cx,
  cy,
  spacing,
  count,
  a0,
  sweep,
  amp,
  maxR,
}: {
  phase: SharedValue<number>;
  cx: number;
  cy: number;
  spacing: number;
  count: number;
  a0: number;
  sweep: number;
  amp: number;
  maxR: number;
}) {
  const path = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    for (let k = 0; k < count; k++) {
      const r = (f + k) * spacing;
      if (r >= 3 && r <= maxR) p.addArc({ x: cx - r, y: cy - r, width: 2 * r, height: 2 * r }, a0, sweep);
    }
    return p;
  }, [phase, cx, cy, spacing, count, a0, sweep, maxR]);
  return <Path path={path} color="#bcd4ff" style="stroke" strokeWidth={1.3} opacity={0.55 * amp} blendMode="plus" />;
}

/** Small side-view PA speaker (front toward +x) — recognizable object, not a
 *  primitive: gradient cabinet, woofer + dust cap, horn slot, lit upper-left. */
function SideSpeakerGlyph({ x, y, s }: { x: number; y: number; s: number }) {
  const parts = useMemo(() => {
    const box = Skia.Path.Make();
    box.addRRect(Skia.RRectXY(Skia.XYWHRect(-11 * s, -8 * s, 14 * s, 16 * s), 1.6 * s, 1.6 * s));
    const horn = Skia.Path.Make();
    horn.addRRect(Skia.RRectXY(Skia.XYWHRect(-1.4 * s, -5.6 * s, 3.4 * s, 2.6 * s), 0.8 * s, 0.8 * s));
    return { box, horn };
  }, [s]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Path path={parts.box}>
        <LinearGradient start={vec(-11 * s, -8 * s)} end={vec(3 * s, 8 * s)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={parts.box} color="#5a5e6a" style="stroke" strokeWidth={1} />
      <Circle cx={-0.4 * s} cy={2.6 * s} r={4.1 * s} color="#101116" />
      <Circle cx={-0.4 * s} cy={2.6 * s} r={4.1 * s} color="#3c4049" style="stroke" strokeWidth={0.9 * s} />
      <Circle cx={-0.4 * s} cy={2.6 * s} r={1.3 * s} color="#6d717d" />
      <Path path={parts.horn} color="#101116" />
    </Group>
  );
}

/** Diffraction module: side view — source, knife-edge barrier, shadow zone. */
export function BarrierSceneView(p: {
  width: number;
  height?: number;
  freq: number;
  barrierH01: number;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 200;
  const groundY = h - 18;
  const ppm = w / BARRIER_SCENE_M;
  const c = speedOfSound(BARRIER_TEMP_C);
  const lambdaPx = (c / Math.max(20, p.freq)) * ppm;
  const spacing = Math.max(10, Math.min(w * 0.33, lambdaPx)); // wavelength-true, clamped readable

  // Geometry (meters are heights above ground; screen y runs down).
  const sxM = 3.0;
  const syM = 1.4;
  const bxM = BARRIER_SCENE_M * 0.5;
  const maxBarM = (groundY - 14) / ppm;
  const barM = Math.max(0.4, Math.min(1, p.barrierH01) * maxBarM);
  const sx = sxM * ppm;
  const sy = groundY - syM * ppm;
  const bx = bxM * ppm;
  const eY = groundY - barM * ppm;

  // Ring-train lengths are derived from the CANVAS geometry and the 10 px
  // spacing floor — NOT the live frequency or barrier height — so the count is
  // constant while either slider is dragged and Skia nodes are never remounted
  // mid-drag (keeps the fixed-per-frame node-count invariant; a frequency-tied
  // count was the source of the slider jank). Sized so that even at the tightest
  // (10 px floor) spacing the wavefronts reach past the barrier and wrap into the
  // shadow; at lower frequencies the surplus rings fall off-canvas and are clipped.
  const SPACING_FLOOR = 10; // must match the `spacing` clamp floor above
  const primaryCount = Math.min(40, Math.ceil((bx - sx) / SPACING_FLOOR) + 6);
  const diffCount = Math.min(40, Math.ceil((w - bx) / SPACING_FLOOR) + 2);
  const trainMaxR = Math.hypot(w, groundY); // clip rings to the canvas

  // ── Shadow shading: Maekawa dB sampled over the region behind the barrier,
  //    quantized to 14 dimming buckets, run-length merged. Memoized per
  //    (freq, barrier height) — never per frame.
  const shadow = useMemo(() => {
    const N_SHADE = 14;
    const buckets: SkPathT[] = Array.from({ length: N_SHADE }, () => Skia.Path.Make());
    const X0 = bx + 3;
    const COLS = 76;
    const ROWS = 52;
    const cw = (w - 4 - X0) / COLS;
    const ch = (groundY - 8) / ROWS;
    const S = { x: sxM, y: syM };
    const E = { x: bxM, y: barM };
    for (let r = 0; r < ROWS; r++) {
      const py = 8 + (r + 0.5) * ch;
      const Pm = { y: Math.max(0.05, (groundY - py) / ppm) };
      addFieldRow(buckets, COLS, X0, 8 + r * ch, cw, ch, (col) => {
        const pxx = X0 + (col + 0.5) * cw;
        const Px = pxx / ppm;
        // Line-of-sight test at the barrier plane.
        const yAtBar = S.y + ((Pm.y - S.y) * (E.x - S.x)) / Math.max(1e-6, Px - S.x);
        const over = Math.hypot(E.x - S.x, E.y - S.y) + Math.hypot(Px - E.x, Pm.y - E.y);
        const direct = Math.hypot(Px - S.x, Pm.y - S.y);
        // LOS: negative Fresnel number (2·direct − over ⇒ δ < 0) — the engine
        // returns ~0 there, with the correct soft edge just above the boundary.
        const att = yAtBar > E.y
          ? maekawaAttenuationDb(2 * direct - over, direct, p.freq, BARRIER_TEMP_C)
          : maekawaAttenuationDb(over, direct, p.freq, BARRIER_TEMP_C);
        return Math.round(Math.min(1, att / 28) * (N_SHADE - 1));
      });
    }
    return buckets;
  }, [w, h, groundY, ppm, bx, sxM, syM, bxM, barM, p.freq]);

  // ── Diffraction bands: two angular slices of the shadow, each with an
  //    amplitude from the REAL Maekawa dB at its mid-angle (γ-compressed ^0.75
  //    so the ordering stays honest while deep shadow remains faintly visible).
  const bands = useMemo(() => {
    const th0 = (Math.atan2(eY - sy, bx - sx) * 180) / Math.PI; // shadow boundary
    const thMax = 86; // just short of the barrier's back face
    const mid = th0 + (thMax - th0) * 0.45;
    const mk = (a0: number, a1: number) => {
      const am = (((a0 + a1) / 2) * Math.PI) / 180;
      const rep = (w - bx) * 0.5;
      const Px = (bx + Math.cos(am) * rep) / ppm;
      const Py = Math.max(0.2, (groundY - (eY + Math.sin(am) * rep)) / ppm);
      const over = Math.hypot(bxM - sxM, barM - syM) + Math.hypot(Px - bxM, Py - barM);
      const direct = Math.hypot(Px - sxM, Py - syM);
      const att = maekawaAttenuationDb(over, direct, p.freq, BARRIER_TEMP_C);
      return { a0, sweep: a1 - a0, amp: Math.pow(Math.pow(10, -att / 20), 0.75) };
    };
    return [mk(th0, mid), mk(mid, thMax)];
  }, [w, groundY, ppm, bx, eY, sx, sy, sxM, syM, bxM, barM, p.freq]);

  const barrier = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(bx - 2.5, eY, 5, groundY - eY));
    return path;
  }, [bx, eY, groundY]);
  const sky = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(0, 0, w, groundY));
    return path;
  }, [w, groundY]);
  const bust = useMemo(() => {
    const path = Skia.Path.Make();
    appendBust(path, w * 0.86, groundY, 1.15);
    return path;
  }, [w, groundY]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={sky}>
          <LinearGradient start={vec(0, 0)} end={vec(0, groundY)} colors={['#111420', '#0c0c0f']} />
        </Path>
        {/* Primary wavefronts (wavelength-true spacing). */}
        <WaveTrain phase={p.phase} x={sx} y={sy} spacing={spacing} count={primaryCount} maxR={trainMaxR} />
        {/* Maekawa shadow: dimming buckets behind the barrier (idx 0 = clear). */}
        {shadow.map((path, i) =>
          i === 0 ? null : <Path key={i} path={path} color="#06070b" opacity={(i / 13) * 0.82} />,
        )}
        {/* Diffracted (Huygens) train wrapping past the edge — brightness per
            band from the Maekawa dB; low freq wraps visibly, highs shadow. */}
        {bands.map((b, k) => (
          <DiffractedTrain
            key={k}
            phase={p.phase}
            cx={bx}
            cy={eY}
            spacing={spacing}
            count={diffCount}
            a0={b.a0}
            sweep={b.sweep}
            amp={b.amp}
            maxR={trainMaxR}
          />
        ))}
        {/* The knife-edge barrier: concrete-toned slab, lit edge cap. */}
        <Path path={barrier}>
          <LinearGradient start={vec(bx - 2.5, 0)} end={vec(bx + 2.5, 0)} colors={['#6a6e79', '#3a3d46']} />
        </Path>
        <Circle cx={bx} cy={eY + 1} r={2.2} color={WAVE} opacity={0.65}>
          <BlurMask blur={2.4} style="normal" />
        </Circle>
        <Floor w={w} y={groundY} h={h - groundY} />
        <SideSpeakerGlyph x={sx} y={sy} s={1.15} />
        <LineBust path={bust} stroke={LINE} sw={1.2} />
      </Canvas>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <RNText style={[styles.sceneLabel, { left: bx + (w - bx) / 2 - 44, top: groundY - 30, width: 88, textAlign: 'center' }]}>
          SHADOW ZONE
        </RNText>
      </View>
    </View>
  );
}

// ── GradientSceneView — refraction (temperature gradient bends rays) ─────────
// Outdoor side view: a fan of rays launched at several elevations, each height
// following the engine's refractedRayHeight (curving DOWN under an inversion,
// UP under a lapse), a distant listener, a warm/cool sky tint telling the
// temperature profile, wind (optional) skewing the fan.

const GRAD_SCENE_M = 90; // canvas width spans 90 m
const GRAD_TEMP_C = 20;
const GRAD_SLOPES = [-0.12, -0.06, 0, 0.06, 0.12, 0.18, 0.24]; // launch slopes

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): string {
  const q = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * q)},${Math.round(a[1] + (b[1] - a[1]) * q)},${Math.round(a[2] + (b[2] - a[2]) * q)})`;
}

/** One animated wavefront riding the curved ray fan: a polyline across the
 *  rays at equal propagation distance. The height math inlined in the worklet
 *  is EXACTLY refractedRayHeight's formula (h0 + kCurv·x², kCurv = −grad/2c)
 *  plus the launch tilt — inlined because engine functions aren't worklets. */
function GradientFront({
  phase,
  i,
  h0,
  kCurv,
  ppm,
  groundY,
  x0px,
  maxXm,
}: {
  phase: SharedValue<number>;
  i: number;
  h0: number;
  kCurv: number;
  ppm: number;
  groundY: number;
  x0px: number;
  maxXm: number;
}) {
  const path = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const u = (f + i) / RING_N;
    const x = u * maxXm;
    const p = Skia.Path.Make();
    let pen = false;
    for (let k = 0; k < GRAD_SLOPES.length; k++) {
      const y = h0 + GRAD_SLOPES[k] * x + kCurv * x * x;
      if (y < 0.05) { pen = false; continue; }
      const px = x0px + x * ppm;
      const py = groundY - y * ppm;
      if (py < 4) { pen = false; continue; }
      if (!pen) { p.moveTo(px, py); pen = true; } else p.lineTo(px, py);
    }
    return p;
  }, [phase, i, h0, kCurv, ppm, groundY, x0px, maxXm]);
  const op = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const u = (f + i) / RING_N;
    return 0.5 * Math.min(1, u / 0.1) * (1 - u) * (1 - u);
  }, [phase, i]);
  return <Path path={path} color="#e6f0ff" style="stroke" strokeWidth={1.3} opacity={op} blendMode="plus" />;
}

/** Refraction module: outdoor side view — temperature gradient bends rays. */
export function GradientSceneView(p: {
  width: number;
  height?: number;
  /** −1 (lapse, bends up) … +1 (inversion, bends down). */
  gradient01: number;
  wind01?: number;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 200;
  const groundY = h - 16;
  const ppm = w / GRAD_SCENE_M;
  const wind = p.wind01 ?? 0;
  // Illustrative dc/dz scaling: ±1.2 (m/s)/m puts the ray-curvature radius
  // R = c/grad near ~300 m, so the bend is clearly visible across the 90 m
  // scene. Wind shear adds to the effective downwind gradient (disclosed
  // teaching simplification — same family as the engine's linear-gradient ray).
  const effGrad = p.gradient01 * 1.2 + wind * 0.55;
  const c = speedOfSound(GRAD_TEMP_C);
  const kCurv = -effGrad / (2 * c);
  const h0 = 2.0; // source height, m
  const srcXm = 4;
  const x0px = srcXm * ppm;
  const maxXm = GRAD_SCENE_M - srcXm - 4;

  // Static ray fan — heights straight from the ENGINE's refractedRayHeight
  // (plus the launch tilt m·x), sampled to polylines. Memoized per params.
  const rays = useMemo(() => {
    const dim = Skia.Path.Make();
    const hot = Skia.Path.Make();
    const N = 46;
    for (let j = 0; j < GRAD_SLOPES.length; j++) {
      const m = GRAD_SLOPES[j];
      const target = j === 3 ? hot : dim; // one amber "hero" ray mid-fan
      let pen = false;
      for (let k = 0; k <= N; k++) {
        const x = (k / N) * maxXm;
        const y = refractedRayHeight(h0, x, effGrad, GRAD_TEMP_C) + m * x;
        if (y < 0.02) break; // grounded
        const px = x0px + x * ppm;
        const py = groundY - y * ppm;
        if (py < 4) break; // off the top
        if (!pen) { target.moveTo(px, py); pen = true; } else target.lineTo(px, py);
      }
    }
    return { dim, hot };
  }, [effGrad, maxXm, x0px, ppm, groundY]);

  // Sky: warm/cool vertical tint telling the temperature profile (inversion =
  // warm aloft over cool ground; lapse = the reverse). Thermometer strip at
  // the left edge mirrors it.
  const WARM: [number, number, number] = [52, 34, 14];
  const COOL: [number, number, number] = [10, 16, 30];
  const topCol = mixRgb(COOL, WARM, (p.gradient01 + 1) / 2);
  const botCol = mixRgb(COOL, WARM, (1 - p.gradient01) / 2);
  const sky = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(0, 0, w, groundY));
    return path;
  }, [w, groundY]);
  const thermo = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(4, 8, 4, groundY - 16));
    return path;
  }, [groundY]);

  // Wind arrows (drawn, not text): 2 strokes near the top, length ∝ wind.
  const windPath = useMemo(() => {
    const path = Skia.Path.Make();
    if (Math.abs(wind) < 0.04) return path;
    const len = 16 + 30 * Math.abs(wind);
    const dir = wind > 0 ? 1 : -1;
    for (const yy of [16, 26]) {
      const xc = w * 0.5 - (dir * len) / 2;
      path.moveTo(xc, yy);
      path.lineTo(xc + dir * len, yy);
      path.moveTo(xc + dir * len, yy);
      path.lineTo(xc + dir * (len - 5), yy - 3.2);
      path.moveTo(xc + dir * len, yy);
      path.lineTo(xc + dir * (len - 5), yy + 3.2);
    }
    return path;
  }, [w, wind]);

  const bust = useMemo(() => {
    const path = Skia.Path.Make();
    appendBust(path, x0px + 78 * ppm, groundY, 1.15);
    return path;
  }, [x0px, ppm, groundY]);

  const uniform = Math.abs(p.gradient01) < 0.1;
  const topLabel = uniform ? '' : p.gradient01 > 0 ? 'WARM AIR' : 'COOL AIR';
  const botLabel = uniform ? 'UNIFORM AIR' : p.gradient01 > 0 ? 'COOL AIR' : 'WARM AIR';

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={sky}>
          <LinearGradient start={vec(0, 0)} end={vec(0, groundY)} colors={[topCol, '#0c0c0f', botCol]} positions={[0, 0.55, 1]} />
        </Path>
        {/* Thermometer strip: the same profile, readable at a glance. */}
        <Path path={thermo}>
          <LinearGradient
            start={vec(0, 8)}
            end={vec(0, groundY - 8)}
            colors={[mixRgb([80, 90, 110], [255, 176, 77], (p.gradient01 + 1) / 2), mixRgb([80, 90, 110], [255, 176, 77], (1 - p.gradient01) / 2)]}
          />
        </Path>
        {/* The ray fan: engine-true curved paths, one amber hero mid-fan. */}
        <GlowStroke path={rays.dim} color={ACCENT_BLUE} width={1.1} opacity={0.5} />
        <GlowStroke path={rays.hot} color={WAVE} width={1.5} opacity={0.85} />
        {/* Animated wavefronts riding the fan. */}
        {Array.from({ length: RING_N }, (_, i) => (
          <GradientFront key={i} phase={p.phase} i={i} h0={h0} kCurv={kCurv} ppm={ppm} groundY={groundY} x0px={x0px} maxXm={maxXm} />
        ))}
        {/* Wind cue. */}
        <Path path={windPath} color="#9aa3b5" style="stroke" strokeWidth={1.4} strokeCap="round" opacity={0.7} />
        <Floor w={w} y={groundY} h={h - groundY} />
        {/* Source: small PA on a pole, near the ground at left. */}
        <SkLine p1={{ x: x0px, y: groundY - h0 * ppm + 9 }} p2={{ x: x0px, y: groundY }} color="#4a4d58" strokeWidth={2} />
        <SideSpeakerGlyph x={x0px + 4} y={groundY - h0 * ppm} s={1.0} />
        {/* The distant listener. */}
        <LineBust path={bust} stroke={LINE} sw={1.2} />
      </Canvas>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {topLabel ? <RNText style={[styles.sceneLabel, { left: 12, top: 10 }]}>{topLabel}</RNText> : null}
        <RNText style={[styles.sceneLabel, { left: 12, top: groundY - 16 }]}>{botLabel}</RNText>
        {Math.abs(wind) >= 0.04 ? (
          <RNText style={[styles.sceneLabel, { left: w * 0.5 - 20, top: 30, width: 40, textAlign: 'center' }]}>WIND</RNText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wallLabel: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.6,
    color: '#8f95a6',
  },
  msLabel: {
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 8,
  },
  dbLabel: {
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 0.5,
  },
  sceneLabel: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.8,
    color: '#8f95a6',
  },
});
