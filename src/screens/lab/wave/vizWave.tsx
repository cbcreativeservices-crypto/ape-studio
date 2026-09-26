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
import { useContext, useEffect, useMemo, useRef } from 'react';
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
  Rect,
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
import { StageAspectReport, useStageTextScale } from '../rack/stageAspect';
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

/** Side-view scenes (barrier, gradient) keep the L glass's shape in FULL
 *  SCREEN so their ground line and sky stay where the learner saw them. */
const SIDE_SCENE_ASPECT = 1.5;
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

// 64 colour steps (was 32): at 2–3× FULL SCREEN the 32 steps showed as
// stripes on the smooth standing-wave map (walkthrough 2026-09-26). The map
// is rebuilt only on a parameter change, so the cost is paths, not frames.
const BUCKET_N = 64;
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

/** A standing person, front view, drawn to a real height (feet at `gy`,
 *  `u` = px per metre) — for side-view scenes where the figure must stay in
 *  proportion with the speaker and the barrier (owner 2026-09-26: "the
 *  speaker, human figure and height all stay in correct proportional
 *  dimensions"). 1.75 m tall. Body contour + head, one path each. */
function appendStanding(p: SkPathT, x: number, gy: number, u: number) {
  const P = (dx: number, h: number): [number, number] => [x + dx * u, gy - h * u];
  const pts: [number, number][] = [
    P(-0.05, 1.5), P(-0.19, 1.45), P(-0.24, 1.36), P(-0.26, 0.86), P(-0.2, 0.86),
    P(-0.19, 1.2), P(-0.17, 0.82), P(-0.15, 0.0), P(-0.04, 0.0), P(0, 0.76),
    P(0.04, 0.0), P(0.15, 0.0), P(0.17, 0.82), P(0.19, 1.2), P(0.2, 0.86),
    P(0.26, 0.86), P(0.24, 1.36), P(0.19, 1.45), P(0.05, 1.5),
  ];
  pts.forEach(([px, py], i) => (i === 0 ? p.moveTo(px, py) : p.lineTo(px, py)));
  p.close();
  const [hx, hy] = P(0, 1.63);
  p.addCircle(hx, hy, 0.12 * u);
}

/** A handheld/stand microphone seen from above, grille toward +x, rotated
 *  to `angle` (rad). Body 18 × 5 units, grille ⌀ 9 — a real object, not a dot. */
function MicTopGlyph({ x, y, angle, s }: { x: number; y: number; angle: number; s: number }) {
  const parts = useMemo(() => {
    const body = Skia.Path.Make();
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(-19 * s, -2.5 * s, 16 * s, 5 * s), 2.2 * s, 2.2 * s));
    const mesh = Skia.Path.Make();
    for (const d of [-2.4, 0, 2.4]) {
      mesh.moveTo(d * s, -4 * s);
      mesh.lineTo(d * s, 4 * s);
      mesh.moveTo(-4 * s, d * s);
      mesh.lineTo(4 * s, d * s);
    }
    return { body, mesh };
  }, [s]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: angle }]}>
      <Path path={parts.body}>
        <LinearGradient start={vec(0, -2.5 * s)} end={vec(0, 2.5 * s)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={parts.body} color="#5a5e6a" style="stroke" strokeWidth={0.8 * s} />
      <Circle cx={0} cy={0} r={4.6 * s} color="#8d94a1" />
      <Group clip={Skia.RRectXY(Skia.XYWHRect(-4.6 * s, -4.6 * s, 9.2 * s, 9.2 * s), 4.6 * s, 4.6 * s)}>
        <Path path={parts.mesh} color="#3a3e48" style="stroke" strokeWidth={0.6 * s} />
      </Group>
      <Circle cx={0} cy={0} r={4.6 * s} color="#c9ced8" style="stroke" strokeWidth={0.8 * s} />
    </Group>
  );
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

const HEAD_SIZE = 28; // listener head icon box on side views / fallback, px
// REAL SIZES for top-view room objects (owner 2026-09-26: "make sure …
// speakers, heads, heights, and display stated dimensions are all
// proportional"). Every room glyph is sized from the room's px-per-metre, so
// a head is a head-width whatever the room size. A small px FLOOR (× the stage
// scale) keeps an object findable when a huge room makes it sub-visible —
// the only place the drawing is allowed to be bigger than life.
const REAL_HEAD_ICON_M = 0.38; // icon box whose drawn head is ≈ 0.2 m wide
const REAL_PA_FACE_M = 0.55; // PA cabinet front width
const REAL_POINT_SPK_M = 0.45; // small point-source speaker width
const REAL_SUB_M = 0.75; // sub cabinet width
const REAL_MIC_M = 0.18; // handheld/stand mic length
const REAL_ARRAY_BOX_H_M = 0.45; // line-array box height (section view)
const REAL_ARRAY_BOX_D_M = 0.55; // line-array box depth (section view)
const FLOOR_HEAD_PX = 14;
const FLOOR_SPK_PX = 8;
const FLOOR_MIC_PX = 9;

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
  /**
   * Index of a wall fitted with a WORKING diffuser, or null for an all-specular
   * room. Walls: 0 = top (y=0), 1 = right, 2 = bottom, 3 = left — the indices
   * marchWall returns.
   *
   * Owner ruling 2026-09-13, closing a punch-list item open since August: the
   * Diffusion module's DEPTH fader and DIFFUSER toggle changed the bezel and
   * nothing else, because `diffuser`/`depth` never reached the drawing and this
   * renderer had no notion of a scattering wall. The caller passes the wall only
   * when the diffuser is fitted AND the frequency is above its design ƒ
   * (c / 2·depth), so DEPTH becomes visible: it sets the threshold at which the
   * picture stops being a mirror.
   */
  scatterWall?: number | null;
  selectedId?: string | null;
  onDragSource?: (id: string, x: number, y: number) => void;
  onDragListener?: (x: number, y: number) => void;
  onSelect?: (id: string | null) => void;
  /** Draw the listener as a MICROPHONE (top view, aimed at the nearest
   *  source) instead of a head — the Comb lab is about a mic (2026-09-26). */
  listenerKind?: 'head' | 'mic';
  /** SECTION (side) view — the Line Array: speaker boxes drawn in section at
   *  true size and the listener as a standing person (2026-09-26). */
  sectionView?: boolean;
  /** Extra measurement points a module READS (e.g. Cardioid's rear probe) —
   *  drawn so a printed number never refers to an invisible spot. */
  probes?: { x: number; y: number; label: string }[];
  /** Wall strip depth on the glass, px (default 9). The Absorption lab draws
   *  its walls deeper so each material reads in section (owner 2026-09-26). */
  wallT?: number;
  /** A quadratic-residue diffuser FITTED to a wall (drawn whether or not it is
   *  scattering at this ƒ — the object is there either way; `scatterWall` is
   *  what says it is working). Well depths follow `depthM` (owner 2026-09-26:
   *  "draw the diffuser on the wall"). */
  diffuserPanel?: { wall: number; depthM: number } | null;
  /** Fires true when an object drag starts, false on release/terminate — hosts
   *  wire this to their scroll-lock so the drag beats the ScrollView. Usually
   *  unneeded: RoomSceneView also locks via the ScrollLockProvider context. */
  onDragActive?: (active: boolean) => void;
};

// ── Room geometry: meters → px ───────────────────────────────────────────────

const WALL_T = 9; // default wall strip depth on the glass, px (× ts in FULL SCREEN)
const ROOM_MARGIN = 30; // canvas margin so wall strips + labels fit

type RoomGeo = { x0: number; y0: number; x1: number; y1: number; pxPerM: number; wPx: number; hPx: number; diag: number };

function roomGeo(scene: WaveScene, width: number, height: number, margin = ROOM_MARGIN): RoomGeo {
  const pxPerM = Math.max(
    1,
    Math.min((width - margin * 2) / scene.w, (height - margin * 2) / scene.h),
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

// ── Wall strips: each material drawn in SECTION ─────────────────────────────
// The strip is the wall seen from above, cut through — so each material shows
// what it physically is (owner 2026-09-26: "I want better … (static) of the
// materials … thicken the edge (wall) thickness so that material inside could
// be better visualized"). Illustrative, not to scale: a 5 cm foam panel is not
// drawn 5 cm deep. Treatments sit on a backing wall (grey band on the outside)
// so the picture says "treatment ON a wall", which is what α describes.

/** Deterministic 0..1 noise — the texture must not shimmer between renders. */
function wallNoise(i: number, b: number, salt: number): number {
  const v = Math.sin(i * 127.1 + b * 311.7 + salt * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

const WALL_BACKING = '#4b4e57'; // the structural wall behind a treatment
const WALL_POST = '#3a3c43'; // corner posts where two strips meet

type WallPiece = { path: SkPathT; color: string; width?: number; opacity: number; dash?: [number, number] };

/** Boundary strips: [top, right, bottom, left], `T` px deep. The inner-edge
 *  line brightness encodes REFLECTIVITY (1 − α at the current frequency) —
 *  reflective glass glints, absorptive fiberglass goes matte. */
/** QRD well sequence for N = 7: sₙ = n² mod 7. Well depth ∝ sₙ. */
const QRD7 = [0, 1, 4, 2, 2, 4, 1];
/** The Diffusion lab's DEPTH range, m — maps the panel's depth into the strip. */
const QRD_DEPTH_MIN = 0.05;
const QRD_DEPTH_MAX = 0.6;

function buildWalls(
  scene: WaveScene,
  geo: RoomGeo,
  freq: number,
  T: number,
  panel?: { wall: number; depthM: number } | null,
): WallPiece[] {
  const { x0, y0, x1, y1, pxPerM } = geo;
  const u = T / WALL_T; // detail scale: 1 on a default glass wall, grows with depth and zoom
  const pieces: WallPiece[] = [];
  const fill = (path: SkPathT, color: string, opacity = 1) => pieces.push({ path, color, opacity });
  const stroke = (path: SkPathT, color: string, width: number, opacity = 1) => pieces.push({ path, color, width, opacity });
  for (let b = 0; b < 4; b++) {
    const mat = scene.boundary[b];
    // Inner edge (room side) start/end, along unit, and normal INTO the strip.
    const horiz = b === 0 || b === 2;
    const sx = horiz ? x0 : b === 3 ? x0 : x1;
    const sy = horiz ? (b === 0 ? y0 : y1) : y0;
    const len = horiz ? x1 - x0 : y1 - y0;
    const ax = horiz ? 1 : 0;
    const ay = horiz ? 0 : 1;
    const nx = horiz ? 0 : b === 3 ? -1 : 1;
    const ny = horiz ? (b === 0 ? -1 : 1) : 0;
    // (t along the wall, d depth from the room face) → canvas px.
    const P = (t: number, d: number): [number, number] => [sx + ax * t + nx * d, sy + ay * t + ny * d];
    const poly = (pts: [number, number][]) => {
      const path = Skia.Path.Make();
      pts.forEach(([t, d], i) => {
        const [px, py] = P(t, d);
        if (i === 0) path.moveTo(px, py);
        else path.lineTo(px, py);
      });
      path.close();
      return path;
    };
    const band = (d0: number, d1: number) => poly([[0, d0], [len, d0], [len, d1], [0, d1]]);
    const seg = (path: SkPathT, t0: number, d0: number, t1: number, d1: number) => {
      const [qx0, qy0] = P(t0, d0);
      const [qx1, qy1] = P(t1, d1);
      path.moveTo(qx0, qy0);
      path.lineTo(qx1, qy1);
    };

    if (mat === 'open') {
      // Opening: no strip at all — a dashed gap along the boundary.
      const dashP = Skia.Path.Make();
      dashP.moveTo(sx, sy);
      dashP.lineTo(sx + ax * len, sy + ay * len);
      pieces.push({ path: dashP, color: '#7d828f', width: 1.6 * u, opacity: 0.8, dash: [8 * u, 7 * u] });
      continue;
    }

    if (panel && panel.wall === b) {
      // Quadratic-residue diffuser: a row of wooden wells of different depths
      // (sₙ = n² mod 7, repeating) on the structural wall. Deeper panel =
      // deeper wells = scatters lower (ƒmin = c / 2·depth). The deepest well
      // is the printed DEPTH to scale (owner 2026-09-26: proportional), capped
      // at the strip.
      const D = Math.max(1.5 * u, Math.min(T, panel.depthM * pxPerM));
      fill(band(D, T), WALL_BACKING);
      fill(band(0, D), '#0c0d10');
      const ww = Math.max(4 * u, len / 42);
      const wood = Skia.Path.Make();
      const fins = Skia.Path.Make();
      let n = 0;
      for (let t = 0; t < len - 0.5; t += ww, n++) {
        const t1 = Math.min(len, t + ww);
        const bottom = (QRD7[n % 7] / 4) * D;
        wood.addPath(poly([[t, bottom], [t1, bottom], [t1, D], [t, D]]));
        seg(fins, t, 0, t, D);
      }
      seg(fins, len, 0, len, D);
      fill(wood, '#7a5534');
      stroke(fins, '#b0824f', 0.9 * u, 1);
    } else if (mat === 'concrete') {
      // Poured slab: grey with aggregate stones.
      fill(band(0, T), '#4b4e57');
      const lite = Skia.Path.Make();
      const dark = Skia.Path.Make();
      const n = Math.floor(len / (3.2 * u));
      for (let i = 0; i < n; i++) {
        const [cx, cy] = P(wallNoise(i, b, 1) * len, (0.15 + 0.7 * wallNoise(i, b, 2)) * T);
        (i % 2 ? lite : dark).addCircle(cx, cy, (0.45 + 0.75 * wallNoise(i, b, 3)) * u);
      }
      fill(lite, '#70747e', 0.85);
      fill(dark, '#33353c', 0.9);
    } else if (mat === 'glass') {
      // Window: dark frame depth, a pale pane with glints, mullions.
      fill(band(0, T), '#16232e');
      fill(band(0.3 * T, 0.62 * T), '#8fc6e6', 0.32);
      const glint = Skia.Path.Make();
      seg(glint, len * 0.1, 0.38 * T, len * 0.42, 0.38 * T);
      seg(glint, len * 0.58, 0.38 * T, len * 0.7, 0.38 * T);
      stroke(glint, '#ffffff', 0.8 * u, 0.6);
      const mull = Skia.Path.Make();
      const S = Math.max(40 * u, len / 5);
      for (let t = S; t < len - S * 0.3; t += S) seg(mull, t, 0, t, T);
      stroke(mull, '#3a4a58', 1.8 * u, 1);
    } else if (mat === 'drywall') {
      // Stud wall: gypsum board each side of a hollow cavity, studs every 40 cm.
      fill(band(0, T), '#1a1b20');
      fill(band(0, 0.26 * T), '#a8a49a');
      fill(band(0.8 * T, T), '#a8a49a', 0.7);
      const S = Math.max(10 * u, 0.4 * pxPerM);
      const sw = Math.max(1.5 * u, 0.1 * S);
      const studs = Skia.Path.Make();
      for (let t = S / 2; t < len - sw; t += S) studs.addPath(poly([[t, 0.26 * T], [t + sw, 0.26 * T], [t + sw, 0.8 * T], [t, 0.8 * T]]));
      fill(studs, '#7a5a3a');
    } else if (mat === 'wood') {
      // Panelling: planks with seams and running grain.
      fill(band(0, T), '#6b4a2c');
      const seams = Skia.Path.Make();
      let k = 0;
      for (let t = 14 * u; t < len - 4 * u; t += (14 + 6 * wallNoise(k++, b, 4)) * u) seg(seams, t, 0, t, T);
      stroke(seams, '#3e2a18', 0.9 * u, 0.9);
      const grain = Skia.Path.Make();
      [0.25, 0.5, 0.75].forEach((dd, g) => {
        for (let t = 0; t <= len; t += 2 * u) {
          const [gx, gy] = P(t, dd * T + 0.07 * T * Math.sin(t / (6 * u) + g * 1.9));
          if (t === 0) grain.moveTo(gx, gy);
          else grain.lineTo(gx, gy);
        }
      });
      stroke(grain, '#95693e', 0.7 * u, 0.7);
    } else if (mat === 'curtain') {
      // Heavy drape hung off the wall: pleated fabric, an air gap, the wall.
      fill(band(0, T), '#101116');
      fill(band(0.8 * T, T), WALL_BACKING);
      const pleat = Skia.Path.Make();
      const hi = Skia.Path.Make();
      const Pd = 9 * u;
      for (let t = 0; t <= len; t += 0.8 * u) {
        const d = 0.4 * T + 0.26 * T * Math.sin((2 * Math.PI * t) / Pd);
        const [px, py] = P(t, d);
        const [hx, hy] = P(t, d - 0.08 * T);
        if (t === 0) {
          pleat.moveTo(px, py);
          hi.moveTo(hx, hy);
        } else {
          pleat.lineTo(px, py);
          hi.lineTo(hx, hy);
        }
      }
      stroke(pleat, '#7a68ad', Math.max(1.4 * u, 0.14 * T), 1);
      stroke(hi, '#bfb0ea', 0.5 * u, 0.5);
    } else if (mat === 'carpet') {
      // Backing + underlay, then a dense pile facing the room.
      fill(band(0, T), '#241a13');
      fill(band(0.62 * T, T), '#3a2d23');
      const pileA = Skia.Path.Make();
      const pileB = Skia.Path.Make();
      let i = 0;
      for (let t = 0.8 * u; t < len; t += 1.6 * u, i++) {
        const lean = (wallNoise(i, b, 5) - 0.5) * 1.4 * u;
        seg(i % 2 ? pileA : pileB, t, 0.62 * T, t + lean, (0.06 + 0.12 * wallNoise(i, b, 6)) * T);
      }
      stroke(pileA, '#8a6a4f', 0.8 * u, 0.95);
      stroke(pileB, '#6a4f3b', 0.8 * u, 0.95);
    } else if (mat === 'foam') {
      // Wedge foam on the wall: the sawtooth profile everyone recognises.
      fill(band(0, T), '#101116');
      fill(band(0.82 * T, T), WALL_BACKING);
      const Pw = Math.max(6 * u, 0.8 * T);
      const body: [number, number][] = [[0, 0.82 * T], [0, 0.5 * T]];
      const lit = Skia.Path.Make();
      for (let t = 0; t < len; t += Pw) {
        const tip = Math.min(len, t + Pw / 2);
        const end = Math.min(len, t + Pw);
        body.push([tip, 0.05 * T], [end, 0.5 * T]);
        lit.addPath(poly([[t, 0.5 * T], [tip, 0.05 * T], [tip, 0.5 * T]]));
      }
      body.push([len, 0.82 * T]);
      fill(poly(body), '#353a44');
      fill(lit, '#4c5360', 0.95);
    } else if (mat === 'fiberglass') {
      // Fabric-wrapped rigid panel on stand-offs: fibrous core, air gap, wall.
      fill(band(0, T), '#101116');
      fill(band(0.84 * T, T), WALL_BACKING);
      fill(band(0.06 * T, 0.62 * T), '#9c7b46');
      fill(band(0, 0.06 * T), '#4a4552');
      const clips = Skia.Path.Make();
      for (let t = 12 * u; t < len; t += 24 * u) seg(clips, t, 0.62 * T, t, 0.84 * T);
      stroke(clips, '#6b6e78', 1.4 * u, 1);
      const fibA = Skia.Path.Make();
      const fibB = Skia.Path.Make();
      const n = Math.floor(len / (1.8 * u));
      for (let i = 0; i < n; i++) {
        const t = wallNoise(i, b, 7) * len;
        const d = (0.12 + 0.44 * wallNoise(i, b, 8)) * T;
        const ang = wallNoise(i, b, 9) * Math.PI;
        const r = 1.4 * u;
        seg(i % 2 ? fibA : fibB, t - Math.cos(ang) * r, d - Math.sin(ang) * r * 0.5, t + Math.cos(ang) * r, d + Math.sin(ang) * r * 0.5);
      }
      stroke(fibA, '#d4b37c', 0.5 * u, 0.6);
      stroke(fibB, '#6e5530', 0.5 * u, 0.6);
    } else if (mat === 'audience') {
      // A seated row from above: shoulders and heads, seat backs behind.
      fill(band(0, T), '#14161d');
      fill(band(0.82 * T, T), '#2a2f3d');
      const sh = Skia.Path.Make();
      const heads = Skia.Path.Make();
      const S = Math.max(7 * u, 0.62 * T);
      for (let t = S / 2; t < len - S / 3; t += S) {
        const [cx, cy] = P(t, 0.58 * T);
        const along = 0.52 * T;
        const deep = 0.26 * T;
        const wR = horiz ? along : deep;
        const hR = horiz ? deep : along;
        sh.addOval(Skia.XYWHRect(cx - wR / 2, cy - hR / 2, wR, hR));
        const [hx, hy] = P(t, 0.34 * T);
        heads.addCircle(hx, hy, 0.19 * T);
      }
      fill(sh, '#3b4256');
      fill(heads, '#9aa2b8', 0.9);
    }

    // Reflectivity edge on the room side: bright = reflective, matte = absorbed.
    // Not on a diffuser: a hard white face there read as a surface blocking
    // the wells behind it (owner 2026-09-26).
    if (panel && panel.wall === b) continue;
    const a = alphaAt(mat, freq);
    const edge = Skia.Path.Make();
    edge.moveTo(sx, sy);
    edge.lineTo(sx + ax * len, sy + ay * len);
    pieces.push({ path: edge, color: '#ffffff', width: 1.2 * u, opacity: 0.08 + 0.5 * (1 - a) });
  }
  // Corner posts where two strips meet (skipped where both sides are open).
  const bd = scene.boundary;
  const posts = Skia.Path.Make();
  const corner = (cx: number, cy: number, wa: number, wb: number) => {
    if (bd[wa] === 'open' && bd[wb] === 'open') return;
    posts.addRect(Skia.XYWHRect(cx, cy, T, T));
  };
  corner(x0 - T, y0 - T, 0, 3);
  corner(x1, y0 - T, 0, 1);
  corner(x1, y1, 2, 1);
  corner(x0 - T, y1, 2, 3);
  pieces.push({ path: posts, color: WALL_POST, opacity: 1 });
  return pieces;
}

// ── Object glyphs (visual standards: no bare primitives for objects) ─────────

/** Mini top-view PA cabinet (shape after micspeaker/viz CabinetTop): trapezoid
 *  box + face gradient + horn slot, rotated to aimDeg, with a translucent
 *  coverage-wedge hint whose half-angle comes from the ACTUAL directivityGain
 *  −6 dB point at this frequency (coverage narrows with frequency — Module 9's
 *  whole lesson rides on this being real). */
function SpeakerGlyph({
  src,
  x,
  y,
  freq,
  dim,
  wedgeR = 34,
}: {
  src: WaveSource;
  x: number;
  y: number;
  freq: number;
  dim: boolean;
  /** Coverage-wedge radius in the glyph's own units (the host scales the
   *  body to real size; the wedge is an indicator, sized separately). */
  wedgeR?: number;
}) {
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
    const r = wedgeR;
    const a0 = 90 - halfDeg;
    wedge.moveTo(0, 0);
    wedge.arcToOval(Skia.XYWHRect(-r, -r, 2 * r, 2 * r), a0, halfDeg * 2, false);
    wedge.close();
    return { box, horn, wedge };
  }, [halfDeg, wedgeR]);
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

// 3 s between pulses — more time to watch the decay — then stretched so every
// ball travels 13 % SLOWER (owner 2026-09-26: "the balls travel too fast").
// Speed ∝ 1 / PULSE_MS; the fade points are fractions of the cycle, so the
// whole choreography stretches together (≈3.45 s).
const PULSE_MS = Math.round(3000 / 0.87);
const PULSE_ARRIVE = 0.9; // the pacing span is covered by 90% of the cycle
/** Room diagonals the wavefront covers per pulse cycle. The pulse speed is
 *  keyed to ROOM GEOMETRY, never to the surviving ray set, so the surface
 *  material can't change how fast the pressure rays travel (owner 2026-08-07).
 *  Sized to let the usual multi-bounce diffuse paths land inside the cycle. */
const PACE_SPAN = 3.5;
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
type TraceRay = {
  pts: number[];
  cum: number[];
  len: number;
  order: number;
  segGain: number[];
  free?: boolean;
  /** A fragment of a pulse split by a diffuser: it rides one ray of the
   *  scatter fan and VANISHES at the ray's end (it does not reach the
   *  listener, so it must not park anywhere). */
  split?: boolean;
};

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
  if (ray.split && dist >= ray.len) return { x: 0, y: 0, amp: 0, r: 0 };
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
  // Diffuser fragments keep a visible floor: each carries 1/√N of the energy,
  // so by level alone they shrank to sub-pixel specks and the split could not
  // be seen (owner 2026-09-26: "there should be MANY balls"). Colour still
  // tells the truth about their level.
  const r = Math.max(ray.split ? 1.7 : 0, 2.5 * (0.34 + 0.66 * amp));
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
function PulseNodes({
  t,
  traces,
  paceLen,
  minLen,
  scale = 1,
}: {
  t: SharedValue<number>;
  traces: TraceRay[];
  paceLen: number;
  minLen: number;
  /** Stage text scale: the balls zoom with the drawing (D35). */
  scale?: number;
}) {
  // A soft bloom under every node so they read over the heat field.
  const glow = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const dist = t.value * (paceLen / PULSE_ARRIVE);
    const env = pulseTimeEnv(t.value);
    for (let k = 0; k < traces.length; k++) {
      const n = nodeState(traces[k], dist, minLen, env);
      p.addCircle(n.x, n.y, n.r * 1.5 * scale);
    }
    return p;
  }, [t, traces, paceLen, minLen, scale]);
  // One colour path per loudness bucket (fixed count → stable hook order).
  const buckets: SharedValue<SkPathT>[] = [];
  for (let b = 0; b < NODE_BUCKETS; b++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    buckets.push(
      useDerivedValue(() => {
        const p = Skia.Path.Make();
        const dist = t.value * (paceLen / PULSE_ARRIVE);
        const env = pulseTimeEnv(t.value);
        for (let k = 0; k < traces.length; k++) {
          const n = nodeState(traces[k], dist, minLen, env);
          if (Math.round(n.amp * (NODE_BUCKETS - 1)) === b) p.addCircle(n.x, n.y, n.r * scale);
        }
        return p;
      }, [t, traces, paceLen, minLen, scale]),
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
  paceLen,
}: {
  t: SharedValue<number>;
  origins: { x: number; y: number }[];
  paceLen: number;
}) {
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const r = t.value * (paceLen / PULSE_ARRIVE);
    if (r > 1.5) for (let i = 0; i < origins.length; i++) p.addCircle(origins[i].x, origins[i].y, r);
    return p;
  }, [t, origins, paceLen]);
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
type ArrivalLabel = { ms: string; db: string; color: string };

// ── RoomSceneView — the one view all 16 modules render through ───────────────

export function RoomSceneView(p: RoomSceneProps) {
  const h = p.height ?? 250;
  const w = p.width;
  const scene = p.scene;
  const freq = p.freq;
  const mode = p.mode ?? 'interference';
  // Overlay-label scale: 1 on the glass, rendered ÷ glass width in FULL
  // SCREEN (the Skia trap — see stageAspect.ts). The room margin holds the
  // wall labels, so it grows with them.
  const ts = useStageTextScale();
  // Walls zoom with the drawing (D35): depth × ts, and the margin that holds
  // the strip + its label grows by whatever the lab adds over the default.
  const wallT0 = p.wallT ?? WALL_T;
  const roomMargin = ROOM_MARGIN + (wallT0 - WALL_T);
  const wallPx = wallT0 * ts;
  const geo = useMemo(() => roomGeo(scene, w, h, roomMargin * ts), [scene, w, h, ts, roomMargin]);
  // FULL SCREEN: report the room's own shape so the zoomed canvas is the room
  // (plus its label margin), not a tall box with the room floating mid-way.
  const report = useContext(StageAspectReport);
  useEffect(() => {
    report?.aspect(scene.w / scene.h, roomMargin);
  }, [report, scene.w, scene.h, roomMargin]);
  const key = sceneKey(scene);
  const headFrontImg = useImage(ICON_HEAD_FRONT);
  const nx = p.modal?.nx ?? 1;
  const ny = p.modal?.ny ?? 0;
  const scatterWall = p.scatterWall ?? null;

  // ── HEAT: fine SPL map of the interference field / modal pressure map ─────
  // Memoized per (rounded scene, freq, mode, nx, ny) — NEVER per frame. Grid
  // ≤176×140 cells scaled to the room; ≤32 quantized buckets, one Path per
  // bucket, horizontal run-length merging (see addFieldRow).
  const heat = useMemo(() => {
    if (!p.layers.heat) return null;
    // ~2.6 px cells at every zoom step: the cap grows with the stage scale (to
    // 2.2× the glass grid) so FULL SCREEN stays smooth instead of blocky
    // (walkthrough 2026-09-26). Rebuilt only on a parameter change.
    const COLS = Math.min(Math.round(176 * Math.min(2.2, Math.max(1, ts))), Math.max(64, Math.round(geo.wPx / 2.6)));
    const ROWS = Math.min(Math.round(140 * Math.min(2.2, Math.max(1, ts))), Math.max(48, Math.round(geo.hPx / 2.6)));
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
  const panelWall = p.diffuserPanel?.wall ?? -1;
  const panelDepth = p.diffuserPanel?.depthM ?? 0;
  const walls = useMemo(
    () => buildWalls(scene, geo, freq, wallPx, panelWall >= 0 ? { wall: panelWall, depthM: panelDepth } : null),
    [key, geo, freq, wallPx, panelWall, panelDepth], // eslint-disable-line react-hooks/exhaustive-deps
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // ── RAYS: image-source reflection polylines, order ≤ 2 ────────────────────
  // Also emits TRACES — each ray's px polyline + cumulative segment lengths —
  // for the pulse tracer below (owner 2026-08-02).
  // Built when RAYS or PRESSURE is on: the pulse balls ride these paths, and
  // PRESSURE shows them on its own (owner 2026-09-26: "show pressure without
  // having to have rays on at the same time"). The LINES draw only with RAYS.
  const rays = useMemo(() => {
    if (!p.layers.rays && !p.layers.pressure) return null;
    const byOrder = [Skia.Path.Make(), Skia.Path.Make(), Skia.Path.Make()];
    const arrows = [Skia.Path.Make(), Skia.Path.Make(), Skia.Path.Make()];
    const traces: TraceRay[] = [];
    /**
     * Rays fanning off a diffusing wall, drawn faint and separate from the
     * specular orders.
     *
     * ⚠️ THIS is the path the Diffusion module needs, not the free-cast traces
     * below. Those are pulse-tracer nodes, and `traces` is only consumed when
     * the PRESSURE layer is on (Diffusion opens with it on since 2026-09-26,
     * but the learner can turn it off). The rays drawn there are these
     * image-source reflections, so a diffuser that does not change THEM
     * changes nothing on screen with PRESSURE off.
     */
    const scatter = Skia.Path.Make();
    const SCATTER_FAN = 11; // rays drawn in place of the one specular bounce
    const SCATTER_ARC = (110 * Math.PI) / 180; // total fan angle
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
        // Does this reflection bounce off the diffusing wall? If so the mirror
        // leg LEAVING that bounce is replaced by a fan: one strong specular ray
        // becomes many weak ones from the same point. Energy is NOT reduced —
        // no gain is touched here — which is exactly what the module's ENERGY
        // RETURNED readout claims ("SAME ON OR OFF").
        const sIdx = scatterWall == null ? -1 : img.bounces.indexOf(scatterWall);
        // Material gain per segment (see segGain below) — needed here too so
        // the split fragments inherit the loss up to the diffuser.
        const gains: number[] = [1];
        {
          let g = 1;
          for (let bi = 0; bi < img.bounces.length; bi++) {
            g *= Math.sqrt(Math.max(0, 1 - alphaAt(scene.boundary[img.bounces[bi]], freq)));
            gains.push(g);
          }
        }
        if (sIdx >= 0 && pts.length > sIdx + 2) {
          // Draw only as far as the scattering bounce...
          path.moveTo(X(pts[0][0]), Y(pts[0][1]));
          for (let i = 1; i <= sIdx + 1; i++) path.lineTo(X(pts[i][0]), Y(pts[i][1]));
          // ...then fan from it, spanning the same reach as the leg it replaces.
          const [bx, by] = pts[sIdx + 1];
          const [tx, ty] = pts[sIdx + 2];
          const vx = tx - bx;
          const vy = ty - by;
          const len = Math.hypot(vx, vy) || 1;
          // Inward normal of the scattering wall: 0 = top, 1 = right, 2 = bottom,
          // 3 = left (marchWall's indices).
          const inX = scatterWall === 1 ? -1 : scatterWall === 3 ? 1 : 0;
          const inY = scatterWall === 0 ? 1 : scatterWall === 2 ? -1 : 0;
          // The pulse SPLITS at the diffuser (owner 2026-09-26: "the pressure
          // balls need to split apart when they hit the diffusor, not just
          // bounce one image out"): one fragment per fan ray, sharing the
          // incoming leg. Each fragment carries 1/N of the reflected ENERGY,
          // and that share is what its colour shows — so the split reads as a
          // clear step down the ramp (owner 2026-09-26: "balls after diffusion
          // show color (amplitude) reduced … due to small reflective
          // amplitude"). At 1/√N the fragments sat on the meter ramp's wide
          // green plateau beside the unsplit reflections and the drop was
          // invisible. The total is unchanged: ENERGY RETURNED stays "SAME".
          const lead: number[] = [];
          for (let i = 0; i <= sIdx + 1; i++) lead.push(X(pts[i][0]), Y(pts[i][1]));
          const leadCum: number[] = [0];
          for (let i = 1; i <= sIdx + 1; i++) {
            leadCum.push(leadCum[i - 1] + Math.hypot(lead[i * 2] - lead[(i - 1) * 2], lead[i * 2 + 1] - lead[(i - 1) * 2 + 1]));
          }
          const frags: { ex: number; ey: number }[] = [];
          for (let f = 0; f < SCATTER_FAN; f++) {
            const a = (f / (SCATTER_FAN - 1) - 0.5) * SCATTER_ARC;
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const rx = (vx * ca - vy * sa) / len;
            const ry = (vx * sa + vy * ca) / len;
            // A diffuser scatters INTO the room, never back out through itself.
            // Without this the fan sprayed through the wall and off the panel.
            if (rx * inX + ry * inY <= 0.05) continue;
            // Stop at the first wall this ray meets, and never draw further than
            // the specular leg it stands in for — so the fan reads as the same
            // reflection broken up, not as new energy reaching further.
            const hitF = marchWall(bx, by, rx, ry, scene.w, scene.h);
            const reach = Math.min(len, Math.hypot(hitF.x - bx, hitF.y - by));
            scatter.moveTo(X(bx), Y(by));
            scatter.lineTo(X(bx + rx * reach), Y(by + ry * reach));
            frags.push({ ex: X(bx + rx * reach), ey: Y(by + ry * reach) });
          }
          const share = 1 / Math.max(1, frags.length);
          const bxPx = lead[(sIdx + 1) * 2];
          const byPx = lead[(sIdx + 1) * 2 + 1];
          const leadLen = leadCum[sIdx + 1];
          for (const fr of frags) {
            const legLen = Math.hypot(fr.ex - bxPx, fr.ey - byPx);
            traces.push({
              pts: [...lead, fr.ex, fr.ey],
              cum: [...leadCum, leadLen + legLen],
              len: leadLen + legLen,
              order,
              segGain: [...gains.slice(0, sIdx + 1), gains[sIdx + 1] * share],
              split: true,
            });
          }
        } else {
          path.moveTo(X(pts[0][0]), Y(pts[0][1]));
          for (let i = 1; i < pts.length; i++) path.lineTo(X(pts[i][0]), Y(pts[i][1]));
        }
        const splitHere = sIdx >= 0 && pts.length > sIdx + 2;
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
        if (!splitHere) traces.push({ pts: flat, cum, len: total, order, segGain });
        // Arrowhead just before the listener, along the final segment.
        const a = pts[pts.length - 2];
        const b = pts[pts.length - 1];
        const dx = X(b[0]) - X(a[0]);
        const dy = Y(b[1]) - Y(a[1]);
        const len = Math.hypot(dx, dy) || 1;
        appendArrow(arrows[order], X(b[0]) - (dx / len) * 12, Y(b[1]) - (dy / len) * 12, dx / len, dy / len, 6);
      }
    }
    // DIFFUSER BURST (owner 2026-09-26: "show more bounced reflection balls
    // than just the lines already drawn … there should be MANY balls
    // reflecting after hitting the diffusor"). The pulse's wavefront meets the
    // diffuser along its WHOLE face, not only where a drawn ray lands, so it is
    // sampled at BURST_HITS points across the wall; at each, the pulse breaks
    // into BURST_FRAGS small balls spread over the scatter arc, each riding to
    // the first wall it meets and vanishing there. Each ball shows its 1/N
    // share of the energy, the same rule as the drawn fans — many dim balls,
    // not new energy.
    // Pulse-only (no lines): the drawn fans stay the readable reference.
    if (scatterWall != null && scene.boundary[scatterWall] !== 'open') {
      const BURST_HITS = 9;
      const BURST_FRAGS = 15;
      const BURST_ARC = (130 * Math.PI) / 180;
      const inX = scatterWall === 1 ? -1 : scatterWall === 3 ? 1 : 0;
      const inY = scatterWall === 0 ? 1 : scatterWall === 2 ? -1 : 0;
      const horizW = scatterWall === 0 || scatterWall === 2;
      const wallLen = horizW ? scene.w : scene.h;
      const wallGain = Math.sqrt(Math.max(0, 1 - alphaAt(scene.boundary[scatterWall], freq)));
      const share = wallGain / BURST_FRAGS;
      for (const s of scene.sources) {
        if (s.muted) continue;
        for (let hI = 0; hI < BURST_HITS; hI++) {
          const along = ((hI + 0.5) / BURST_HITS) * wallLen;
          const hx = horizW ? along : scatterWall === 1 ? scene.w : 0;
          const hy = horizW ? (scatterWall === 0 ? 0 : scene.h) : along;
          const ix = hx - s.x;
          const iy = hy - s.y;
          const iLen = Math.hypot(ix, iy);
          if (iLen < 1e-6) continue;
          // Mirror direction off the wall, then spread the fragments around it.
          let mx = ix / iLen;
          let my = iy / iLen;
          if (horizW) my = -my;
          else mx = -mx;
          const leadPx = Math.hypot(X(hx) - X(s.x), Y(hy) - Y(s.y));
          for (let f = 0; f < BURST_FRAGS; f++) {
            const jitter = (hashFrac(hI * 31.7 + f * 7.13 + 0.5) - 0.5) * (BURST_ARC / BURST_FRAGS);
            const a = (f / (BURST_FRAGS - 1) - 0.5) * BURST_ARC + jitter;
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const rx = mx * ca - my * sa;
            const ry = mx * sa + my * ca;
            if (rx * inX + ry * inY <= 0.05) continue; // into the room only
            const hit = marchWall(hx, hy, rx, ry, scene.w, scene.h);
            const ex = X(hit.x);
            const ey = Y(hit.y);
            const legPx = Math.hypot(ex - X(hx), ey - Y(hy));
            if (legPx < 1) continue;
            traces.push({
              pts: [X(s.x), Y(s.y), X(hx), Y(hy), ex, ey],
              cum: [0, leadPx, leadPx + legPx],
              len: leadPx + legPx,
              order: 1,
              segGain: [1, share],
              split: true,
            });
          }
        }
      }
    }
    // Free diffuse reflections (owner 2026-08-02): cast many rays that bounce
    // around the room and KEEP ONLY the ones that reach the listener's head —
    // extra multi-bounce reflection paths beyond the line-traced order-≤2 set.
    // Each keeps the √(1−α) material loss along its path, so a long/absorptive
    // route arrives quieter (bluer). Not line-traced — pulse nodes only.
    // Illustrative scatter cone off a diffusing wall (±~60°). Wide enough that
    // one bounce visibly stops being a mirror, narrow enough that the rays still
    // read as coming FROM the wall rather than as noise.
    const SCATTER_SPREAD = (120 * Math.PI) / 180;
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
          // Mirror first...
          if (hit.wall === 0 || hit.wall === 2) dy = -dy; else dx = -dx;
          // ...then SCATTER if this wall carries a working diffuser. A diffuser
          // redistributes the same energy over many directions rather than
          // removing it, so `amp` is deliberately untouched here — which is what
          // keeps the module's ENERGY RETURNED readout honest ("SAME ON OR OFF").
          // Deterministic via hashFrac: this whole path set is built in a useMemo
          // and must be identical on every re-render, or the rays would crawl.
          if (scatterWall != null && hit.wall === scatterWall) {
            const spread = (hashFrac(n * 3.77 + k * 1.13 + 0.29) - 0.5) * SCATTER_SPREAD;
            const c = Math.cos(spread);
            const sn = Math.sin(spread);
            const rx = dx * c - dy * sn;
            const ry = dx * sn + dy * c;
            const len = Math.hypot(rx, ry) || 1;
            dx = rx / len;
            dy = ry / len;
          }
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
    return { byOrder, arrows, traces, scatter };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, freq, geo, p.layers.rays || p.layers.pressure, scatterWall]);

  // ── PULSE TRACER (owner 2026-08-02): with PRESSURE on (RAYS no longer
  // needed, 2026-09-26), every
  // 2 s a pulse leaves the source; a node rides EVERY visible ray at ONE
  // constant speed, so the direct ray lands at the listener first and each
  // reflection lands later in true path-length order — all before the next
  // pulse fires. A bright expanding ring marks the pulse itself; the ring
  // radius IS the nodes' travelled distance (they ride its wavefront).
  const traces = rays && p.layers.pressure && mode !== 'modal' ? rays.traces : null;
  const tracing = !!traces && traces.length > 0;
  // PACING — CONSTANT SPEED, INDEPENDENT OF MATERIAL (owner 2026-08-07 fix).
  // This used to normalise the wavefront to the LONGEST SURVIVING ray, but an
  // absorptive wall kills long diffuse paths early (FREE_FADE below), so
  // choosing a softer surface shrank that reference and visibly SLOWED the
  // pulse — wrong: sound travels at one speed no matter what it bounces off.
  // Material changes the reflected AMPLITUDE (segGain), never the speed.
  // Pace on ROOM GEOMETRY instead — a fixed span of the room diagonal — which
  // is invariant to material, boundary type and frequency. (pxPerM already
  // scales the room to the canvas, so the on-screen speed also stays steady
  // across room sizes.) A path longer than the span simply fades out still
  // travelling, which is honest: very long echoes arrive late and quiet.
  const paceLen = useMemo(
    () => Math.max(1, PACE_SPAN * Math.hypot(scene.w * geo.pxPerM, scene.h * geo.pxPerM)),
    [scene.w, scene.h, geo.pxPerM],
  );
  // The colour reference is the SHORTEST real reflection = the direct sound
  // (reddest), so echo colour tracks path length. Image-source paths are
  // material-independent by design, so this reference is stable too.
  const minLen = useMemo(() => {
    let m = Infinity;
    if (traces) for (const r of traces) if (!r.free && !r.split) m = Math.min(m, r.len);
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
    if (list.length === 0) return { ticks: [] as { path: SkPathT; color: string }[], rows: [] as ArrivalLabel[] };
    const lx = geo.x0 + scene.listener.x * geo.pxPerM;
    const ly = geo.y0 + scene.listener.y * geo.pxPerM;
    const maxDb = list[0].levelDb; // the direct arrival (earliest = loudest)
    const byColor = new Map<string, SkPathT>();
    const rows: ArrivalLabel[] = [];
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
      // Sized with the text scale so the fan grows in FULL SCREEN (owner
      // 2026-09-26: "make sure the head, speaker … are also zooming").
      const r0 = 14 * ts;
      const r1 = r0 + (8 + 20 * norm) * ts;
      const color = ARRIVAL_COLORS[Math.min(2, a.bounces.length)];
      let path = byColor.get(color);
      if (!path) { path = Skia.Path.Make(); byColor.set(color, path); }
      path.moveTo(lx + Math.cos(ang) * r0, ly - 4 * ts + Math.sin(ang) * r0);
      path.lineTo(lx + Math.cos(ang) * r1, ly - 4 * ts + Math.sin(ang) * r1);
      // Sign is decided on the ROUNDED magnitude so a reflection 0.05–0.5 dB
      // under the direct reads '0 dB', never '−0 dB' (B-105).
      const relRounded = Math.round(Math.abs(relDb));
      rows.push({
        ms: `${(a.t * 1000).toFixed(1)} ms`,
        db: i === 0 ? 'direct' : `${relRounded > 0 && relDb < 0 ? '−' : ''}${relRounded} dB`,
        color,
      });
    }
    return { ticks: Array.from(byColor, ([color, path]) => ({ path, color })), rows };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, freq, geo, ts, p.layers.arrivals]);

  // Pulsing listener halo (arrivals layer) — soft breathing, eased by sin.
  const haloR = useDerivedValue(() => (12 + 2.6 * Math.sin(p.phase.value * 0.7)) * ts, [p.phase, ts]);
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

  // Listener head icon box at real size (≈0.2 m head), floored for findability.
  const headPx = Math.max(FLOOR_HEAD_PX * ts, REAL_HEAD_ICON_M * geo.pxPerM);
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
  const matLabel = (b: number) => (b === panelWall ? 'DIFFUSER' : MATERIALS[scene.boundary[b]].label.toUpperCase());

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
        {rays && p.layers.rays ? (
          <>
            <GlowStroke path={rays.byOrder[0]} color={RAY_COLORS[0]} width={1.6} opacity={0.85} />
            <Path path={rays.byOrder[1]} color={RAY_COLORS[1]} style="stroke" strokeWidth={1.3} opacity={0.6} />
            <Path path={rays.byOrder[2]} color={RAY_COLORS[2]} style="stroke" strokeWidth={1.1} opacity={0.42} />
            {/* Scattered fan off a diffusing wall — many weak rays where one
                strong specular ray used to be. Thinner and fainter than any
                specular order on purpose: the eye should read "broken up", not
                "more energy". */}
            <Path path={rays.scatter} color={RAY_COLORS[1]} style="stroke" strokeWidth={0.9} opacity={0.5} />
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
        {/* PULSE TRACER (PRESSURE, with or without RAYS): the 2 s pulse ring + one
            node per ray riding its line at constant speed — direct arrives
            first, reflections later, all landed before the next pulse. */}
        {tracing && traces ? (
          <>
            <PulseRing t={pulseT} origins={pulseOrigins} paceLen={paceLen} />
            <PulseNodes t={pulseT} traces={traces} paceLen={paceLen} minLen={minLen} scale={ts} />
          </>
        ) : null}
        {/* ARRIVALS: tick fan + pulsing listener halo. */}
        {arrivalFan ? (
          <>
            <Circle cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM - 4 * ts} r={haloR} color={ACCENT_GREEN} style="stroke" strokeWidth={1.4 * ts} opacity={haloOp}>
              <BlurMask blur={3 * ts} style="normal" />
            </Circle>
            {arrivalFan.ticks.map((t, i) => (
              <Path key={i} path={t.path} color={t.color} style="stroke" strokeWidth={2 * ts} strokeCap="round" opacity={0.85} />
            ))}
          </>
        ) : null}
        {/* Sources: illustrated glyphs by kind (visual standards §1). Point
            sources use the small side-view PA speaker (same icon as the
            diffraction lab), owner 2026-08-02. */}
        {pointSrcs.filter((s) => !s.muted).map((s, i) => (
          <SideSpeakerGlyph key={`spk${i}`} x={s.x} y={s.y} s={Math.max(FLOOR_SPK_PX * ts, REAL_POINT_SPK_M * geo.pxPerM) / 14} />
        ))}
        {/* Object glyphs scale about their own anchor with the text scale, so
            the speaker, the sub and the head grow with the room in FULL SCREEN
            instead of staying phone-sized on a doubled floor. */}
        {scene.sources.map((s) => {
          const gx = geo.x0 + s.x * geo.pxPerM;
          const gy = geo.y0 + s.y * geo.pxPerM;
          if (s.kind === 'speaker' && p.sectionView) {
            // SECTION view (line array): a true-scale box seen from the side —
            // 0.45 m tall × 0.55 m deep, face toward its aim — not a top-view
            // cabinet stood on end (it drew each 0.5 m box ≈ 1.5 m tall).
            const bh = REAL_ARRAY_BOX_H_M * geo.pxPerM;
            const bd = REAL_ARRAY_BOX_D_M * geo.pxPerM;
            const rot = ((90 - (s.aimDeg ?? 90)) * Math.PI) / 180;
            return (
              <Group key={s.id} transform={[{ translateX: gx }, { translateY: gy }, { rotate: rot }]} opacity={s.muted ? 0.35 : 1}>
                <Rect x={-bd} y={-bh / 2} width={bd} height={bh}>
                  <LinearGradient start={vec(-bd, -bh / 2)} end={vec(0, bh / 2)} colors={[BODY_HI, BODY_LO]} />
                </Rect>
                <Rect x={-bd} y={-bh / 2} width={bd} height={bh} color="#5a5e6a" style="stroke" strokeWidth={Math.max(0.6, 0.02 * geo.pxPerM)} />
                <Rect x={-Math.max(1, 0.06 * geo.pxPerM)} y={-bh / 2} width={Math.max(1, 0.06 * geo.pxPerM)} height={bh} color="#101116" />
              </Group>
            );
          }
          // Body scaled to its real width; the coverage wedge kept at its
          // on-screen size so the lesson indicator never shrinks with the box.
          const spkK = Math.max(0.42 * ts, (REAL_PA_FACE_M * geo.pxPerM) / 17.9);
          const subK = Math.max(0.42 * ts, (REAL_SUB_M * geo.pxPerM) / 18);
          return s.kind === 'speaker' ? (
            <Group key={s.id} origin={vec(gx, gy)} transform={[{ scale: spkK }]}>
              <SpeakerGlyph src={s} x={gx} y={gy} freq={freq} dim={!!s.muted} wedgeR={(34 * ts) / spkK} />
            </Group>
          ) : s.kind === 'sub' ? (
            <Group key={s.id} origin={vec(gx, gy)} transform={[{ scale: subK }]}>
              <SubGlyph x={gx} y={gy} dim={!!s.muted} />
            </Group>
          ) : s.muted ? (
            // Muted point source: the claves icon skips it; show a dim core ring.
            <Circle key={s.id} cx={gx} cy={gy} r={3.2 * ts} color="#6a6e7a" style="stroke" strokeWidth={1.2 * ts} opacity={0.5} />
          ) : null;
        })}
        {/* The listener — the owner's front-head line icon (LINE + a green
            accent wash), falling back to the vector glyph while it loads. */}
        {p.listenerKind === 'mic' ? (
          (() => {
            const mx = geo.x0 + scene.listener.x * geo.pxPerM;
            const my = geo.y0 + scene.listener.y * geo.pxPerM;
            const src = scene.sources[0];
            const ang = src ? Math.atan2(src.y - scene.listener.y, src.x - scene.listener.x) : Math.PI;
            return <MicTopGlyph x={mx} y={my} angle={ang} s={Math.max(FLOOR_MIC_PX * ts, REAL_MIC_M * geo.pxPerM) / 23.6} />;
          })()
        ) : p.sectionView ? (
          (() => {
            // SECTION view: a true-scale standing person whose ear (≈1.55 m)
            // is the listener point — feet 1.55 m below it.
            const ex = geo.x0 + scene.listener.x * geo.pxPerM;
            const feetY = geo.y0 + (scene.listener.y + 1.55) * geo.pxPerM;
            const fig = Skia.Path.Make();
            appendStanding(fig, ex, feetY, geo.pxPerM);
            return <LineBust path={fig} stroke={LINE} sw={Math.max(1, 0.05 * geo.pxPerM)} />;
          })()
        ) : headFrontImg ? (
          <>
            {/* Dark backing disc + light ring: the thin line head vanished on
                a black node line and blended into bright maps — the lesson's
                "drag the listener" needs it findable on ANY colour
                (walkthrough 2026-09-26). */}
            <Circle cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM} r={headPx * 0.62} color={BG} opacity={0.72} />
            <Circle cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM} r={headPx * 0.62} color={LINE} style="stroke" strokeWidth={Math.max(0.8, 0.06 * headPx)} opacity={0.9} />
            <IconMark image={headFrontImg} cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM} size={headPx} color={LINE} plate />
            <IconMark image={headFrontImg} cx={geo.x0 + scene.listener.x * geo.pxPerM} cy={geo.y0 + scene.listener.y * geo.pxPerM} size={headPx} color={ACCENT_GREEN} opacity={0.28} />
          </>
        ) : (
          <Group origin={vec(geo.x0 + scene.listener.x * geo.pxPerM, geo.y0 + scene.listener.y * geo.pxPerM)} transform={[{ scale: ts }]}>
            <ListenerGlyph x={geo.x0 + scene.listener.x * geo.pxPerM} y={geo.y0 + scene.listener.y * geo.pxPerM} />
          </Group>
        )}
        {/* Probe points the module reads (Cardioid REAR): a small mic cross. */}
        {(p.probes ?? []).map((pr, i) => {
          const px = geo.x0 + pr.x * geo.pxPerM;
          const py = geo.y0 + pr.y * geo.pxPerM;
          const r = 5 * ts;
          return (
            <Group key={`probe${i}`}>
              <Circle cx={px} cy={py} r={r} color={BG} opacity={0.75} />
              <Circle cx={px} cy={py} r={r} color={ACCENT_BLUE} style="stroke" strokeWidth={1.2 * ts} />
              <SkLine p1={{ x: px - r * 1.6, y: py }} p2={{ x: px + r * 1.6, y: py }} color={ACCENT_BLUE} strokeWidth={1 * ts} />
              <SkLine p1={{ x: px, y: py - r * 1.6 }} p2={{ x: px, y: py + r * 1.6 }} color={ACCENT_BLUE} strokeWidth={1 * ts} />
            </Group>
          );
        })}
        {/* Selection: amber ring (sources by id, listener as 'listener'). */}
        {selPos ? (
          <Circle cx={selPos.x} cy={selPos.y} r={16 * ts} color={WAVE} style="stroke" strokeWidth={1.6 * ts} opacity={0.85} />
        ) : null}
      </Canvas>
      {/* Labels (outside the canvas — mono, house label idiom). Every size and
          offset here is × ts (the Skia trap, 2026-09-25): the canvas grows in
          FULL SCREEN, RN text does not, so the labels scale themselves. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {(p.probes ?? []).map((pr, i) => (
          <RNText
            key={`probeL${i}`}
            style={[styles.wallLabel, { fontSize: 9 * ts, color: ACCENT_BLUE, left: geo.x0 + pr.x * geo.pxPerM + 9 * ts, top: geo.y0 + pr.y * geo.pxPerM - 6 * ts }]}
          >
            {pr.label}
          </RNText>
        ))}
        <RNText style={[styles.wallLabel, { fontSize: 9 * ts, left: midX - 50 * ts, top: geo.y0 - wallPx - 15 * ts, width: 100 * ts, textAlign: 'center' }]}>
          {matLabel(0)}
        </RNText>
        <RNText style={[styles.wallLabel, { fontSize: 9 * ts, left: midX - 50 * ts, top: geo.y1 + wallPx + 2 * ts, width: 100 * ts, textAlign: 'center' }]}>
          {matLabel(2)}
        </RNText>
        <RNText
          style={[styles.wallLabel, { fontSize: 9 * ts, left: geo.x1 + wallPx + 8 * ts - 50 * ts, top: midY - 6 * ts, width: 100 * ts, textAlign: 'center', transform: [{ rotate: '90deg' }] }]}
        >
          {matLabel(1)}
        </RNText>
        <RNText
          style={[styles.wallLabel, { fontSize: 9 * ts, left: geo.x0 - wallPx - 8 * ts - 50 * ts, top: midY - 6 * ts, width: 100 * ts, textAlign: 'center', transform: [{ rotate: '-90deg' }] }]}
        >
          {matLabel(3)}
        </RNText>
        {/* ARRIVALS legend — one row per tick, in TIME order (= the fan's
            left-to-right order), each in its tick's colour. It used to sit as
            five 8-pt labels fanned around the head, where they collided with
            each other (legibility pass 2026-09-25); a stack beside the head
            keeps every number readable at 9 pt and never overlaps itself. */}
        {arrivalFan && arrivalFan.rows.length > 0 ? (() => {
          const rowH = 12 * ts;
          const padX = 5 * ts;
          const padY = 3 * ts;
          const stackW = 96 * ts;
          const stackH = arrivalFan.rows.length * rowH + padY * 2;
          const lx = geo.x0 + scene.listener.x * geo.pxPerM;
          const ly = geo.y0 + scene.listener.y * geo.pxPerM;
          // Beside the head, clear of the tick fan, on the side AWAY from the
          // sources when both sides fit (so it never sits on the speaker or the
          // direct ray); below the head when neither side has the room.
          const gap = 34 * ts;
          const srcX = scene.sources.reduce((acc, s) => acc + s.x, 0) / Math.max(1, scene.sources.length);
          const preferRight = geo.x0 + srcX * geo.pxPerM <= lx;
          const midTop = Math.max(2, Math.min(h - stackH - 2, ly - stackH / 2));
          const side = (l: number) => ({ left: l, top: midTop });
          const candidates = [
            preferRight ? side(lx + gap) : side(lx - gap - stackW),
            preferRight ? side(lx - gap - stackW) : side(lx + gap),
            { left: lx - stackW / 2, top: ly + 22 * ts }, // below the head
            { left: lx - stackW / 2, top: ly - 50 * ts - stackH }, // above the fan
          ];
          // Inside the ROOM, not just the canvas: the canvas margin holds the
          // wall strip and its material label, which the stack must not cover
          // (Reflection, deep walls 2026-09-26).
          const inCanvas = (c: { left: number; top: number }) =>
            c.left >= geo.x0 + 2 && c.left + stackW <= geo.x1 - 2 && c.top >= geo.y0 + 2 && c.top + stackH <= geo.y1 - 2;
          const coversSource = (c: { left: number; top: number }) =>
            scene.sources.some((s) => {
              const sx = geo.x0 + s.x * geo.pxPerM;
              const sy = geo.y0 + s.y * geo.pxPerM;
              const m = 12 * ts;
              return sx > c.left - m && sx < c.left + stackW + m && sy > c.top - m && sy < c.top + stackH + m;
            });
          const pick =
            candidates.find((c) => inCanvas(c) && !coversSource(c)) ??
            candidates.find(inCanvas) ??
            { left: Math.max(geo.x0 + 2, Math.min(geo.x1 - stackW - 2, lx - stackW / 2)), top: midTop };
          const { left, top } = pick;
          return (
            <View pointerEvents="none" style={[styles.arrivalStack, { left, top, width: stackW, paddingHorizontal: padX, paddingVertical: padY, borderRadius: 4 * ts }]}>
              {arrivalFan.rows.map((l, i) => (
                <View key={i} style={{ height: rowH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <RNText style={[styles.msLabel, { fontSize: 9 * ts, color: l.color }]}>{l.ms}</RNText>
                  <RNText style={[styles.dbLabel, { fontSize: 9 * ts, color: l.color }]}>{l.db}</RNText>
                </View>
              ))}
            </View>
          );
        })() : null}
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
const BARRIER_SIDE_M = 10; // source and listener each 10 m from the barrier (module geometry)
const BARRIER_EAR_M = 1.5; // source and ear height, m (module geometry)
const PA_CAB_M = 0.6; // PA cabinet height, m — the speaker glyph is scaled to this

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
  // Bright enough to SEE the wrap (walkthrough 2026-09-26: it was drawn but
  // too faint to read); `amp` is still the real Maekawa level per band.
  return (
    <>
      <Path path={path} color="#bcd4ff" style="stroke" strokeWidth={3.2} opacity={0.35 * amp} blendMode="plus">
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color="#e6f0ff" style="stroke" strokeWidth={1.5} opacity={0.95 * amp} blendMode="plus" />
    </>
  );
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
  /** Barrier height, m — drawn to scale (2–8 m in the module). */
  barrierM: number;
  phase: SharedValue<number>;
}) {
  const w = p.width;
  const h = p.height ?? 200;
  const ts = useStageTextScale();
  const report = useContext(StageAspectReport);
  useEffect(() => {
    report?.aspect(SIDE_SCENE_ASPECT, 0);
  }, [report]);
  const groundY = h - 18;
  const ppm = w / BARRIER_SCENE_M;
  const c = speedOfSound(BARRIER_TEMP_C);
  const lambdaPx = (c / Math.max(20, p.freq)) * ppm;
  const spacing = Math.max(10, Math.min(w * 0.33, lambdaPx)); // wavelength-true, clamped readable

  // Geometry — the MODULE'S geometry, drawn to ONE scale (px per metre the
  // same across and up), so speaker, person and wall keep their real
  // proportions (walkthrough 2026-09-26). Source and listener 10 m either
  // side of the barrier at 1.5 m, exactly what the LOSS readouts assume;
  // the barrier is its real height, not a fraction of the canvas.
  const bxM = BARRIER_SCENE_M * 0.5;
  const sxM = bxM - BARRIER_SIDE_M;
  const lxM = bxM + BARRIER_SIDE_M;
  const syM = BARRIER_EAR_M;
  const barM = Math.max(0.4, Math.min((groundY - 6) / ppm, p.barrierM));
  const sx = sxM * ppm;
  const sy = groundY - syM * ppm;
  const bx = bxM * ppm;
  const lx = lxM * ppm;
  const eY = groundY - barM * ppm;
  // Level at the listener: the same Maekawa loss the bezel prints, shown on
  // the app's loudness ramp in dB (0 dB = unobstructed → red; 30 dB down →
  // blue), so 63 Hz reads warm and 8 kHz reads cold.
  const listenerLoss = maekawaAttenuationDb(
    Math.hypot(bxM - sxM, barM - syM) + Math.hypot(lxM - bxM, barM - syM),
    lxM - sxM,
    p.freq,
    BARRIER_TEMP_C,
  );
  const listenerLevel = Math.max(0, Math.min(1, 1 - listenerLoss / 30));

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

  // The direct wave exists only where the source can SEE: everything except
  // the geometric shadow behind the wall. Clipping the primary rings to it
  // leaves the shadow to the diffracted train alone — the wrap is then the
  // only sound in there, so it reads (walkthrough 2026-09-26).
  const lit = useMemo(() => {
    const path = Skia.Path.Make();
    const slope = (eY - sy) / (bx - sx); // up-to-the-right (barrier > source)
    const yAtW = eY + slope * (w - bx);
    path.moveTo(0, 0);
    if (yAtW >= 0) {
      path.lineTo(w, 0);
      path.lineTo(w, yAtW);
    } else {
      path.lineTo(bx + (0 - eY) / slope, 0);
    }
    path.lineTo(bx, eY);
    path.lineTo(bx, groundY);
    path.lineTo(0, groundY);
    path.close();
    return path;
  }, [w, bx, eY, sx, sy, groundY]);
  const barrier = useMemo(() => {
    const path = Skia.Path.Make();
    const t = Math.max(3, 0.25 * ppm); // a 25 cm wall
    path.addRect(Skia.XYWHRect(bx - t / 2, eY, t, groundY - eY));
    return path;
  }, [bx, eY, groundY, ppm]);
  const barrierT = Math.max(3, 0.25 * ppm);
  // Speaker: a 0.6 m cabinet centred at 1.5 m on a stand (glyph box = 16 s).
  const spkS = (PA_CAB_M * ppm) / 16;
  const stand = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(sx - 4 * spkS, sy + 8 * spkS);
    path.lineTo(sx - 4 * spkS, groundY);
    return path;
  }, [sx, sy, spkS, groundY]);
  const sky = useMemo(() => {
    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(0, 0, w, groundY));
    return path;
  }, [w, groundY]);
  const bust = useMemo(() => {
    const path = Skia.Path.Make();
    appendStanding(path, lx, groundY, ppm);
    return path;
  }, [lx, groundY, ppm]);
  const headY = groundY - 1.63 * ppm;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={sky}>
          <LinearGradient start={vec(0, 0)} end={vec(0, groundY)} colors={['#111420', '#0c0c0f']} />
        </Path>
        {/* Primary wavefronts (wavelength-true spacing) — only where the
            source can see; the shadow gets the diffracted train alone. */}
        <Group clip={lit}>
          <WaveTrain phase={p.phase} x={sx} y={sy} spacing={spacing} count={primaryCount} maxR={trainMaxR} />
        </Group>
        {/* Maekawa shadow: dimming buckets behind the barrier (idx 0 = clear). */}
        {shadow.map((path, i) =>
          i === 0 ? null : <Path key={i} path={path} color="#06070b" opacity={(i / 13) * 0.9} />,
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
          <LinearGradient start={vec(bx - barrierT / 2, 0)} end={vec(bx + barrierT / 2, 0)} colors={['#6a6e79', '#3a3d46']} />
        </Path>
        <Circle cx={bx} cy={eY + 1} r={2.2 * ts} color={WAVE} opacity={0.65}>
          <BlurMask blur={2.4 * ts} style="normal" />
        </Circle>
        <Floor w={w} y={groundY} h={h - groundY} />
        {/* Speaker on its stand, over a dark plate so dense high-frequency
            rings never swallow it. */}
        <Path path={stand} color="#4a4d58" style="stroke" strokeWidth={Math.max(1, 0.05 * ppm)} />
        <Circle cx={sx - 4 * spkS} cy={sy} r={12 * spkS} color={BG} opacity={0.85}>
          <BlurMask blur={3 * spkS} style="normal" />
        </Circle>
        <SideSpeakerGlyph x={sx} y={sy} s={spkS} />
        {/* Listener level halo — the bezel's LOSS on the loudness ramp. */}
        <Circle cx={lx} cy={headY} r={0.55 * ppm} color={levelColor(listenerLevel)} opacity={0.28 + 0.5 * listenerLevel}>
          <BlurMask blur={0.25 * ppm} style="normal" />
        </Circle>
        <LineBust path={bust} stroke={LINE} sw={Math.max(1, 0.06 * ppm)} />
      </Canvas>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Bright enough to read on the dark wedge (walkthrough 2026-09-26). */}
        <RNText style={[styles.sceneLabel, { fontSize: 9 * ts, left: bx + (lx - bx) / 2 - 50 * ts, top: groundY - 14 * ts, width: 100 * ts, textAlign: 'center', color: '#c9d3e6' }]}>
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

// ONE model for picture and readouts (owner 2026-09-26 walkthrough): the
// drawing used to bend its rays with an undisclosed 15× gradient over a 90 m
// scene while the bezel quoted the real one at 150 m. Now both use the same
// dc/dz (module units × GRAD_PER_UNIT) and the picture is honest about the one
// thing it exaggerates: HEIGHT, drawn ×GRAD_V_EXAG and tagged on the display.
// Real refraction is a few metres over hundreds of metres — invisible at 1:1.
const GRAD_SCENE_M = 400; // canvas width spans 400 m
const GRAD_TEMP_C = 20;
const GRAD_PER_UNIT = 0.08; // (m/s)/m per unit of the module's gradient (±1)
const GRAD_V_EXAG = 20; // heights drawn ×20 — shown as "HEIGHT ×20"
const GRAD_LISTENER_M = 150; // the listener, and the bezel's H @150 m ray
/** Drawn launch slopes (px rise per px run on the picture). The real launch
 *  angle is slope ÷ GRAD_V_EXAG (0.75 → 2.1°). Index GRAD_HERO is the level
 *  launch — the amber ray the bezel's H @150 m reads. */
const GRAD_SLOPES = [-0.3, -0.12, 0, 0.15, 0.3, 0.5, 0.75];
const GRAD_HERO = 2;

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
      // Real height (m): launch slope is the drawn slope ÷ the exaggeration.
      const y = h0 + (GRAD_SLOPES[k] / GRAD_V_EXAG) * x + kCurv * x * x;
      if (y < 0.05) { pen = false; continue; }
      const px = x0px + x * ppm;
      const py = groundY - y * ppm * GRAD_V_EXAG;
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
  const ts = useStageTextScale();
  const report = useContext(StageAspectReport);
  useEffect(() => {
    report?.aspect(SIDE_SCENE_ASPECT, 0);
  }, [report]);
  const groundY = h - 16;
  const ppm = w / GRAD_SCENE_M; // horizontal px per metre
  const ppmY = ppm * GRAD_V_EXAG; // vertical px per metre (exaggerated)
  const wind = p.wind01 ?? 0;
  // The SAME dc/dz the module's BEND / H @150 m readouts use: gradient plus
  // wind shear as an equivalent gradient (0.55/1.2 relative weight), × 0.08
  // (m/s)/m. Disclosed teaching simplification — linear-gradient ray.
  const effGrad = (p.gradient01 + wind * (0.55 / 1.2)) * GRAD_PER_UNIT;
  const c = speedOfSound(GRAD_TEMP_C);
  const kCurv = -effGrad / (2 * c);
  const h0 = 2.0; // source height, m
  const srcXm = 8;
  const x0px = srcXm * ppm;
  const maxXm = GRAD_SCENE_M - srcXm - 6;

  // Static ray fan — heights straight from the ENGINE's refractedRayHeight
  // (plus the launch tilt m·x), sampled to polylines. Memoized per params.
  const rays = useMemo(() => {
    const dim = Skia.Path.Make();
    const hot = Skia.Path.Make();
    const N = 46;
    for (let j = 0; j < GRAD_SLOPES.length; j++) {
      const m = GRAD_SLOPES[j] / GRAD_V_EXAG; // real launch slope
      const target = j === GRAD_HERO ? hot : dim; // amber = the level launch the bezel reads
      let pen = false;
      for (let k = 0; k <= N; k++) {
        const x = (k / N) * maxXm;
        const y = refractedRayHeight(h0, x, effGrad, GRAD_TEMP_C) + m * x; // real m
        if (y < 0.02) break; // grounded
        const px = x0px + x * ppm;
        const py = groundY - y * ppmY;
        if (py < 4) break; // off the top
        if (!pen) { target.moveTo(px, py); pen = true; } else target.lineTo(px, py);
      }
    }
    return { dim, hot };
  }, [effGrad, maxXm, x0px, ppm, ppmY, groundY]);

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
    // Ear (≈13 bust units up) at a standing 1.6 m on the SAME ×20 height scale
    // as the rays, so a ray printed at ear height visibly reaches the head
    // (proportion audit 2026-09-26: the bust stood ~0.7 m tall).
    appendBust(path, x0px + GRAD_LISTENER_M * ppm, groundY, (1.6 * ppmY) / 13);
    return path;
  }, [x0px, ppm, ppmY, groundY]);

  // "UNIFORM AIR" must account for wind shear too (fix 2026-08-28) — it was
  // printed over a visibly bent ray fan whenever WIND alone did the bending.
  const uniform = Math.abs(p.gradient01 + (p.wind01 ?? 0) * (0.55 / 1.2)) < 0.1;
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
        <SkLine p1={{ x: x0px, y: groundY - h0 * ppmY + 9 * ts }} p2={{ x: x0px, y: groundY }} color="#4a4d58" strokeWidth={2 * ts} />
        <SideSpeakerGlyph x={x0px + 4 * ts} y={groundY - h0 * ppmY} s={1.0 * ts} />
        {/* The distant listener. */}
        <LineBust path={bust} stroke={LINE} sw={1.2} />
      </Canvas>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {topLabel ? <RNText style={[styles.sceneLabel, { fontSize: 9 * ts, left: 12 * ts, top: 10 * ts }]}>{topLabel}</RNText> : null}
        {/* Clear of the speaker: it sits on its pole ABOVE this label now,
            and the label starts past the cabinet's width (it used to be
            hidden behind it — walkthrough 2026-09-26). */}
        <RNText style={[styles.sceneLabel, { fontSize: 9 * ts, left: x0px + 26 * ts, top: groundY - 14 * ts }]}>{botLabel}</RNText>
        {/* The one exaggeration, said on the picture. */}
        <RNText style={[styles.sceneLabel, { fontSize: 9 * ts, right: 8 * ts, top: 10 * ts, color: '#c9a45a' }]}>{`HEIGHT ×${GRAD_V_EXAG}`}</RNText>
        <RNText style={[styles.sceneLabel, { fontSize: 9 * ts, left: x0px + GRAD_LISTENER_M * ppm - 20 * ts, top: groundY + 2 * ts, width: 40 * ts, textAlign: 'center' }]}>
          {`${GRAD_LISTENER_M} m`}
        </RNText>
        {Math.abs(wind) >= 0.04 ? (
          <RNText style={[styles.sceneLabel, { fontSize: 9 * ts, left: w * 0.5 - 24 * ts, top: 30 * ts, width: 48 * ts, textAlign: 'center' }]}>WIND</RNText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lab display law (owner 2026-09-25): nothing under 9 pt on the glass. Each
  // use site multiplies fontSize by useStageTextScale() for FULL SCREEN.
  wallLabel: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.6,
    color: '#8f95a6',
  },
  arrivalStack: {
    position: 'absolute',
    backgroundColor: 'rgba(8,9,13,0.78)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2a2d38',
  },
  msLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
  },
  dbLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
  },
  sceneLabel: {
    position: 'absolute',
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#8f95a6',
  },
});
