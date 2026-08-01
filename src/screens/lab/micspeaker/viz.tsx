/**
 * Mic & Speaker Labs — Skia visualization core (owner 2026-07-29).
 *
 * VISUAL-FIRST LAUNCH (owner decision): these labs teach microphone capture
 * and loudspeaker coverage entirely through manipulable drawings — audio
 * demonstrations are explicitly "coming in a future release" and every screen
 * says so. HONESTY (§1.7): every curve here is an ILLUSTRATIVE MODEL (polar
 * equations, simplified response shelves, conceptual coverage) — never a
 * measurement, never an SPL prediction; each host panel badges that.
 *
 * VISUAL STANDARDS (owner ruling, docs/APE_VISUAL_STANDARDS_2026_07_29.md):
 * physical objects (mics, heads, hands, cabinets, stands, pop gear) are drawn
 * as recognizable illustrations — layered gradient-filled paths, light from
 * the upper-left, soft glows, floor/vignette scene depth. Abstract data
 * (curves, coverage cells, polar plots, ripples) stays geometric but styled:
 * gradient underfills and glow strokes, never hairline-on-black. All math
 * and readout semantics are IDENTICAL to the pre-retrofit file.
 *
 * ONLY this file (and foundations/viz, which it reuses clocks from) imports
 * '@shopify/react-native-skia'; it is loaded solely through
 * micspeaker/skiaGate.requireMsViz(), so pre-Skia clients never evaluate it.
 *
 * Models used (kept honest in shape):
 *   polar        r(θ) = |A + B·cosθ|          (first-order pattern family) —
 *                drawn as a conceptual pickup FIELD: gain × 1/d through the
 *                quantized jet colormap (owner 2026-07-29), never a
 *                measured polar response
 *   distance     level ∝ 1/d (drawn),         direct/room bars conceptual;
 *                scene shows a conceptual direct-field + room-glow heat map
 *   proximity    LF shelf grows as distance shrinks — directional mics only
 *   off-axis     broadband 20·log10|A+B·cosθ| + growing HF rolloff
 *   coverage     within-dispersion × 1/d^n — drawn as a fine quantized-jet
 *                heat map (owner 2026-07-29); the legacy 4-band classifier
 *                (classifyCoverage) keeps its exact thresholds for busts/checks
 */
import { useEffect, useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Line as SkLine,
  LinearGradient,
  Path,
  RadialGradient,
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
// Reuse the house clocks (same Skia-gated load condition as this file).
import { usePhaseClock } from '../foundations/viz';
import { fonts } from '../../../theme/tokens';
import { heatColor } from '../../../features/tools/levelColor';
export { usePhaseClock, useVizClock } from '../foundations/viz';

const PARTICLE = '#cfd2d8';
const WAVE = '#ffc64d';
const CONE = '#8a8c94';
const ACCENT_GREEN = '#5bff85';
const ACCENT_BLUE = '#6fa8ff';
const ACCENT_RED = '#ff6b5e';
const ACCENT_YELLOW = '#ffd76b';
const GRID = '#2c2c33';
const GHOST = '#232329';
const BG = '#0c0c0f';
// Illustration tones (light source: upper-left).
const METAL_HI = '#c6cad4';
const METAL_MID = '#7c7f89';
const METAL_LO = '#3a3c44';
const BODY_HI = '#4a4d58';
const BODY_LO = '#1e1f26';
// Skin tones for the HAND illustration (the hand stays a rendered object).
const SKIN_HI = '#8a6f5a';
const SKIN_MID = '#5d4a3c';
const SKIN_LO = '#2e2620';
const ACCENT_ORANGE = '#ffa94d';
// Line-art head icons (owner ruling 2026-07-29, reference art supplied): a
// single uniform-weight stroke, rounded caps, no fill, no shading, bald. The
// reference is dark-on-white; our labs are on near-black, so the stroke is a
// light neutral and `tint` rides on top as the state accent.
const LINE = '#d7dbe2';
/** The ONLY fill the head icons are allowed: a readability plate under the
 *  line art where it sits over a busy heat-map field. */
const HEAD_PLATE = 'rgba(9,10,14,0.62)';

// ── Scene scale & real-world proportions (owner ruling 2026-07-29) ───────────
// The coverage scenes are zoomed OUT 27% — content is drawn at SCENE_SCALE so a
// uniform margin appears around the rig in the panel — and EVERY object is
// sized from one pixels-per-metre so the rig reads true to a real PA: a
// loudspeaker cabinet is ~0.6 m, a line-array box ~0.3 m, a standing human
// ~1.7 m, a seated head+shoulders bust ~0.9 m tall. Before this pass the
// cabinets and the audience were sized independently and read out of scale;
// now they all descend from the same metre.
export const SCENE_SCALE = 0.73;
const M_HUMAN = 1.7; // standing human, metres (the scale reference)
const M_CAB = 0.6; //   loudspeaker cabinet height, metres
const M_BOX = 0.3; //   line-array box height, metres
const M_BUST = 0.95; //  seated head+shoulders visible height, metres
// Authored drawn heights (in local px at scale 1) of the reusable builders,
// used to convert a metric size into the `scale` each one expects.
const CAB_DRAWN_H = 18; // CabinetSide spans y −9…+9
const BUST_DRAWN_H = 16.6; // appendBust footprint

/** Centred scale transform: shrink canvas content to SCENE_SCALE about the
 *  canvas centre so a uniform margin appears on every side. Returned as a
 *  plain array (Skia `Transforms3d`). */
function sceneTransform(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  return [
    { translateX: cx },
    { translateY: cy },
    { scale: SCENE_SCALE },
    { translateX: -cx },
    { translateY: -cy },
  ];
}

type SkPathT = ReturnType<typeof Skia.Path.Make>;

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** First-order polar gain at θ (radians from the mic's front axis). */
export function polarGain(a: number, b: number, theta: number): number {
  return Math.abs(a + b * Math.cos(theta));
}

/** The pattern family the Polar Viewer teaches. */
export const POLAR_PATTERNS: { key: string; label: string; a: number; b: number }[] = [
  { key: 'omni', label: 'OMNI', a: 1, b: 0 },
  { key: 'cardioid', label: 'CARDIOID', a: 0.5, b: 0.5 },
  { key: 'super', label: 'SUPER', a: 0.37, b: 0.63 },
  { key: 'hyper', label: 'HYPER', a: 0.25, b: 0.75 },
  { key: 'fig8', label: 'FIGURE-8', a: 0, b: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared illustration builders (all static geometry — always inside useMemo
// at the call site; nothing here runs per-frame).

/**
 * ── HEAD PROPORTION vs THE MIC (owner ruling 2026-07-29) ────────────────────
 * A real head is ~23 cm tall; a handheld vocal mic is ~16 cm long. So the head
 * must be NOTICEABLY LARGER than the mic in every scene where both appear —
 * and the owner explicitly prefers correct proportion over fitting the whole
 * head on canvas: the cranium is ALLOWED to crop off the top/side as long as
 * the mouth/nose region (the acoustically relevant part) stays in view.
 *
 * `HEAD_CANON_H` is the crown→chin height of the line-art canon below in head
 * units, so headScaleForMic() returns exactly the scale that puts a 23 cm head
 * next to the 16 cm mic actually drawn at that call site.
 */
const HEAD_CANON_H = 45.6; // crown (−35.1) → chin (+10.5), head units
const HEAD_CM = 23;
const MIC_CM = 16;
/** Total drawn length of a mic built by buildHandheldMic(gr, len) — the same
 *  1.72·gr + len the 3.2 : 1 proportion notes use throughout this file. */
export function micTotalLen(grilleR: number, bodyLen: number): number {
  return 1.72 * grilleR + bodyLen;
}
/** TRUE human proportion: the head scale that matches a 23 cm head to the
 *  16 cm mic drawn with (grilleR, bodyLen) at this call site. */
export function headScaleForMic(grilleR: number, bodyLen: number): number {
  return (micTotalLen(grilleR, bodyLen) * (HEAD_CM / MIC_CM)) / HEAD_CANON_H;
}

/**
 * PROFILE head — CLEAN LINE-ART ICON, authored FACING LEFT (owner ruling
 * 2026-07-29; the shaded/rendered head was rejected twice and is gone).
 *
 * ORIGIN = THE MOUTH OPENING, exactly: the lip line is y = 0 and the front of
 * the lips is x = 0 (call sites measure mouth→grille gaps straight from it).
 * Canon, in head units: crown −35.1 · brow −21.4 · nose tip −7.7 · nose base
 * −3.9 · MOUTH 0 · chin +10.5 · neck base +20.9. Head depth (nose tip −11.3 →
 * occiput +32.5) ≈ head height, and the cranium is deliberately FULL AT THE
 * BACK — the single most common profile mistake.
 *
 * The reference art is one uniform stroke: no fill, no gradient, no shading,
 * no hair. Landmarks along the front edge, in path order from the neck up:
 * throat → jaw sweeping BACK AND UP to the ear → chin tucking under → fuller
 * lower lip → lip notch → upper lip → philtrum → nostril undercut → defined
 * nose tip → straight bridge → nasion (brow notch) → brow → forehead slope →
 * crown → full back of the skull → occiput → nape. The THICK SQUARED NECK is
 * two open lines dropping from the jaw and the nape, not a thin stalk.
 *
 * FACING: this is the ONLY authored version. The right-facing head every call
 * site actually uses is derived by MIRRORING (scaleX −1) inside ProfileHead,
 * exactly as the owner instructed — there is no second hand-authored path.
 */
function appendProfileOutline(p: SkPathT, s: number): void {
  p.moveTo(16.8 * s, -0.6 * s); // the ramus, just in front of the ear
  p.cubicTo(16.6 * s, 6.4 * s, 15.0 * s, 10.0 * s, 12.0 * s, 11.4 * s); // → gonion
  p.cubicTo(7.0 * s, 13.4 * s, 1.5 * s, 12.6 * s, -3.0 * s, 9.7 * s); // jaw → chin
  p.cubicTo(-4.4 * s, 8.5 * s, -5.6 * s, 7.8 * s, -5.6 * s, 6.7 * s); // chin projects
  p.cubicTo(-5.6 * s, 5.5 * s, -4.0 * s, 5.1 * s, -4.0 * s, 3.5 * s); // …tucks under
  p.cubicTo(-4.2 * s, 2.5 * s, -5.2 * s, 2.3 * s, -5.2 * s, 1.5 * s); // fuller lower lip
  p.cubicTo(-5.2 * s, 0.8 * s, -4.4 * s, 0.5 * s, -3.9 * s, 0.0 * s); // lip notch (= origin plane)
  p.cubicTo(-4.3 * s, -0.7 * s, -4.7 * s, -1.1 * s, -4.9 * s, -1.5 * s); // upper lip
  p.cubicTo(-4.4 * s, -2.5 * s, -3.6 * s, -3.0 * s, -2.6 * s, -3.9 * s); // philtrum
  p.cubicTo(-4.8 * s, -4.3 * s, -6.8 * s, -4.6 * s, -8.6 * s, -5.2 * s); // nose base / wing
  p.cubicTo(-10.3 * s, -5.7 * s, -11.3 * s, -6.5 * s, -11.3 * s, -7.7 * s); // nostril undercut → tip
  p.cubicTo(-11.3 * s, -9.6 * s, -9.3 * s, -11.7 * s, -6.5 * s, -14.7 * s); // straight bridge
  p.cubicTo(-4.5 * s, -16.7 * s, -3.4 * s, -17.5 * s, -3.0 * s, -18.7 * s); // nasion notch
  p.cubicTo(-2.8 * s, -19.7 * s, -4.0 * s, -20.2 * s, -4.0 * s, -21.4 * s); // brow
  p.cubicTo(-4.0 * s, -24.1 * s, -2.4 * s, -27.2 * s, 0.6 * s, -29.9 * s); // forehead slope
  p.cubicTo(3.8 * s, -32.8 * s, 8.2 * s, -34.8 * s, 13.5 * s, -35.1 * s); // crown
  p.cubicTo(21.2 * s, -35.6 * s, 28.0 * s, -31.6 * s, 30.5 * s, -25.3 * s);
  p.cubicTo(32.5 * s, -20.3 * s, 32.1 * s, -14.3 * s, 29.9 * s, -8.9 * s); // FULL at the back
  p.cubicTo(28.4 * s, -5.3 * s, 26.4 * s, -2.3 * s, 25.4 * s, 1.5 * s); // occiput → mastoid
  p.cubicTo(24.6 * s, 4.5 * s, 24.1 * s, 7.7 * s, 23.7 * s, 11.1 * s); // nape
}

function buildProfileHead(s: number): { lines: SkPathT; plate: SkPathT; open: SkPathT } {
  // ── The one stroked family: outline + neck + ear + lip line ───────────────
  const lines = Skia.Path.Make();
  appendProfileOutline(lines, s);
  // Thick squared neck column: two open lines, jaw → base and nape → base.
  lines.moveTo(6.2 * s, 13.2 * s);
  lines.lineTo(7.6 * s, 20.9 * s);
  lines.moveTo(23.7 * s, 11.1 * s);
  lines.lineTo(23.4 * s, 20.9 * s);
  // Ear, mid-skull: outer helix oval…
  lines.moveTo(14.2 * s, -14.7 * s);
  lines.cubicTo(17.6 * s, -16.7 * s, 21.4 * s, -14.9 * s, 21.6 * s, -10.7 * s);
  lines.cubicTo(21.8 * s, -7.3 * s, 19.8 * s, -4.5 * s, 17.2 * s, -3.3 * s);
  lines.cubicTo(15.2 * s, -2.4 * s, 13.6 * s, -3.5 * s, 13.4 * s, -5.7 * s);
  lines.cubicTo(13.2 * s, -8.7 * s, 13.4 * s, -12.1 * s, 14.2 * s, -14.7 * s);
  lines.close();
  // …plus the small inner fold curl.
  lines.moveTo(15.4 * s, -13.3 * s);
  lines.cubicTo(18.6 * s, -13.7 * s, 19.8 * s, -10.9 * s, 18.8 * s, -7.9 * s);
  lines.cubicTo(18.2 * s, -6.1 * s, 16.8 * s, -5.1 * s, 15.6 * s, -5.1 * s);
  // Lip line running back into the face from the notch.
  lines.moveTo(-4.2 * s, 0.1 * s);
  lines.cubicTo(-2.6 * s, 0.8 * s, -0.8 * s, 0.9 * s, 0.6 * s, 0.4 * s);

  // ── Speaking variant: the lip strokes open into a small mouth lens ────────
  const open = Skia.Path.Make();
  open.moveTo(-4.4 * s, -0.8 * s);
  open.cubicTo(-2.4 * s, -1.8 * s, -0.4 * s, -1.4 * s, 1.0 * s, -0.3 * s);
  open.cubicTo(-0.4 * s, 1.8 * s, -2.8 * s, 2.0 * s, -4.4 * s, 0.9 * s);
  open.close();

  // ── Readability plate: the silhouette + the neck column, filled dark. The
  //    ONLY fill in the icon, and only used where a head sits on a heat map.
  const plate = Skia.Path.Make();
  appendProfileOutline(plate, s); // Skia closes it implicitly when filled
  plate.close();
  plate.moveTo(6.2 * s, 13.2 * s);
  plate.lineTo(7.6 * s, 20.9 * s);
  plate.lineTo(23.4 * s, 20.9 * s);
  plate.lineTo(23.7 * s, 11.1 * s);
  plate.close();
  return { lines, plate, open };
}

/**
 * FRONT head — the same line-art language, symmetric, used wherever a head is
 * seen face-on. Tall rounded cranium, temples narrowing to cheeks, a soft
 * tapered jaw to a rounded chin, one small elongated ear each side with a tiny
 * inner fold, two curved eyebrow strokes, a nose drawn ONLY as two short
 * bridge lines meeting two nostril curls, and a small two-stroke mouth.
 * NOTE: the reference has NO EYES — deliberately kept that way.
 */
function buildFrontHead(s: number): { lines: SkPathT; plate: SkPathT } {
  const shell = (p: SkPathT) => {
    p.moveTo(0, -35.1 * s);
    p.cubicTo(7.6 * s, -35.1 * s, 12.8 * s, -31.8 * s, 14.0 * s, -25.8 * s);
    p.cubicTo(14.8 * s, -21.4 * s, 14.2 * s, -15.6 * s, 13.6 * s, -8.8 * s); // temple → cheek
    p.cubicTo(13.2 * s, -3.9 * s, 11.4 * s, 1.0 * s, 8.6 * s, 5.1 * s); // cheek → jaw
    p.cubicTo(6.4 * s, 8.2 * s, 3.5 * s, 10.4 * s, 0, 10.5 * s); // jaw → rounded chin
    p.cubicTo(-3.5 * s, 10.4 * s, -6.4 * s, 8.2 * s, -8.6 * s, 5.1 * s);
    p.cubicTo(-11.4 * s, 1.0 * s, -13.2 * s, -3.9 * s, -13.6 * s, -8.8 * s);
    p.cubicTo(-14.2 * s, -15.6 * s, -14.8 * s, -21.4 * s, -14.0 * s, -25.8 * s);
    p.cubicTo(-12.8 * s, -31.8 * s, -7.6 * s, -35.1 * s, 0, -35.1 * s);
    p.close();
  };
  const lines = Skia.Path.Make();
  shell(lines);
  for (const g of [-1, 1]) {
    // Ear: small elongated outer curve hugging the skull…
    lines.moveTo(g * 13.4 * s, -14.2 * s);
    lines.cubicTo(g * 17.6 * s, -15.2 * s, g * 18.4 * s, -10.0 * s, g * 17.0 * s, -6.2 * s);
    lines.cubicTo(g * 16.0 * s, -3.6 * s, g * 13.8 * s, -3.4 * s, g * 13.2 * s, -5.4 * s);
    // …with a tiny inner fold.
    lines.moveTo(g * 15.4 * s, -12.4 * s);
    lines.cubicTo(g * 16.6 * s, -11.0 * s, g * 16.4 * s, -8.4 * s, g * 15.2 * s, -7.0 * s);
    // Eyebrow.
    lines.moveTo(g * 10.0 * s, -18.4 * s);
    lines.cubicTo(g * 7.6 * s, -20.4 * s, g * 4.6 * s, -20.4 * s, g * 2.6 * s, -19.0 * s);
    // Nose: a short bridge line that ends in a nostril curl (no nose outline).
    lines.moveTo(g * 2.0 * s, -15.2 * s);
    lines.lineTo(g * 2.6 * s, -5.2 * s);
    lines.cubicTo(g * 3.6 * s, -3.6 * s, g * 5.0 * s, -4.0 * s, g * 5.2 * s, -5.6 * s);
    // Neck column.
    lines.moveTo(g * 7.0 * s, 6.6 * s);
    lines.lineTo(g * 7.0 * s, 20.9 * s);
  }
  // Two-stroke mouth.
  lines.moveTo(-5.0 * s, -0.8 * s);
  lines.cubicTo(-2.4 * s, -2.0 * s, 2.4 * s, -2.0 * s, 5.0 * s, -0.8 * s);
  lines.moveTo(-4.4 * s, 0.5 * s);
  lines.cubicTo(-2.0 * s, 2.0 * s, 2.0 * s, 2.0 * s, 4.4 * s, 0.5 * s);

  const plate = Skia.Path.Make();
  shell(plate);
  plate.moveTo(-7.0 * s, 6.6 * s);
  plate.lineTo(-7.0 * s, 20.9 * s);
  plate.lineTo(7.0 * s, 20.9 * s);
  plate.lineTo(7.0 * s, 6.6 * s);
  plate.close();
  return { lines, plate };
}

/**
 * PROFILE head icon. `angleRad` = the facing direction, 0 = +x (RIGHT) — the
 * left-facing canon above is MIRRORED (scaleX −1) to get there, per the owner.
 * Stroke width scales with `scale` (never absolute px), rounded caps/joins.
 * `tint` rides on the same stroke as the state accent; `plate` turns on the
 * dark interior for heads that sit over a heat-map field.
 */
function ProfileHead({
  x,
  y,
  angleRad,
  scale,
  tint,
  glow,
  plate,
  speaking,
}: {
  x: number;
  y: number;
  angleRad: number;
  scale: number;
  tint: string;
  glow?: boolean;
  /** Dark translucent interior — ONLY where the head overlaps a heat map. */
  plate?: boolean;
  /** Mouth-open state: the lip strokes open into a small mouth. */
  speaking?: boolean;
}) {
  const parts = useMemo(() => buildProfileHead(scale), [scale]);
  const s = scale;
  const lw = 1.55 * s;
  return (
    <Group
      transform={[{ translateX: x }, { translateY: y }, { rotate: angleRad }, { scaleX: -1 }]}
    >
      {plate ? <Path path={parts.plate} color={HEAD_PLATE} /> : null}
      {glow ? (
        <Path
          path={parts.lines}
          color={tint}
          style="stroke"
          strokeWidth={lw * 3.4}
          strokeCap="round"
          strokeJoin="round"
          opacity={0.3}
        >
          <BlurMask blur={3 * s} style="normal" />
        </Path>
      ) : null}
      <Path
        path={parts.lines}
        color={LINE}
        style="stroke"
        strokeWidth={lw}
        strokeCap="round"
        strokeJoin="round"
      />
      <Path
        path={parts.lines}
        color={tint}
        style="stroke"
        strokeWidth={lw}
        strokeCap="round"
        strokeJoin="round"
        opacity={0.34}
      />
      {speaking ? (
        <Path
          path={parts.open}
          color={LINE}
          style="stroke"
          strokeWidth={lw}
          strokeCap="round"
          strokeJoin="round"
        />
      ) : null}
    </Group>
  );
}

/** FRONT head icon — same line-art language, used wherever a head is face-on. */
function FrontHead({
  x,
  y,
  scale,
  tint,
  plate,
}: {
  x: number;
  y: number;
  scale: number;
  tint: string;
  plate?: boolean;
}) {
  const parts = useMemo(() => buildFrontHead(scale), [scale]);
  const lw = 1.55 * scale;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {plate ? <Path path={parts.plate} color={HEAD_PLATE} /> : null}
      <Path
        path={parts.lines}
        color={LINE}
        style="stroke"
        strokeWidth={lw}
        strokeCap="round"
        strokeJoin="round"
      />
      <Path
        path={parts.lines}
        color={tint}
        style="stroke"
        strokeWidth={lw}
        strokeCap="round"
        strokeJoin="round"
        opacity={0.34}
      />
    </Group>
  );
}

/**
 * CLAVES — CLEAN LINE-ART ICON (owner 2026-07-29, reference art supplied):
 * two crossed cylindrical percussion sticks with three small "click" strokes
 * radiating from the crossing point. THE sound source of the POLAR section —
 * claves are the classic point-ish acoustic source, and unlike a talker they
 * have NO facing direction, so the icon never rotates toward the mic.
 *
 * ORIGIN = THE CROSSING POINT of the two sticks, exactly — the click happens
 * there, so the crossing IS the acoustic origin the polar math measures from.
 * Canon, in claves units (× s): each stick is 44 long × 6.8 wide, crossed at
 * ±35° from vertical NEAR THE UPPER THIRD (14 above the crossing, 30 below),
 * rounded caps both ends, an elliptical end-cap hint at each LOWER end (the
 * cylinder's visible end face), and three short click strokes fanned above
 * the crossing. Same language as the head icons: ONE uniform stroke scaling
 * with s, rounded caps, light neutral LINE, no fill — except the established
 * dark readability plate where the icon sits over a heat-map field.
 */
const CLAVES_ANGLE = (35 * Math.PI) / 180;
const CLAVES_UP = 14; //  stick length above the crossing, claves units
const CLAVES_DOWN = 30; // stick length below the crossing, claves units
/** Full drawn stick length in claves units (the sizing canon). */
const CLAVES_CANON_L = CLAVES_UP + CLAVES_DOWN;
const CLAVES_CM = 20; // a real clave is ~20 cm long
/** TRUE proportion: the claves scale that matches a 20 cm clave to the 16 cm
 *  mic drawn with (grilleR, bodyLen) at this call site. */
export function clavesScaleForMic(grilleR: number, bodyLen: number): number {
  return (micTotalLen(grilleR, bodyLen) * (CLAVES_CM / MIC_CM)) / CLAVES_CANON_L;
}

function buildClaves(s: number): { lines: SkPathT; plate: SkPathT } {
  const hw = 3.4 * s; // stick half-width
  const k = hw * 1.33; // cubic ≈ semicircular rounded cap
  // One stick: a rounded-end bar along ±CLAVES_ANGLE from vertical, appended
  // as a single closed outline (up-cap → far edge → down-cap → near edge).
  const stick = (p: SkPathT, sgn: 1 | -1) => {
    const dx = Math.sin(CLAVES_ANGLE) * sgn; // unit axis, pointing DOWN-stick
    const dy = Math.cos(CLAVES_ANGLE);
    const nx = -dy; // unit normal
    const ny = dx;
    const tX = -CLAVES_UP * s * dx;
    const tY = -CLAVES_UP * s * dy;
    const bX = CLAVES_DOWN * s * dx;
    const bY = CLAVES_DOWN * s * dy;
    p.moveTo(tX + nx * hw, tY + ny * hw);
    p.cubicTo(
      tX + nx * hw - dx * k, tY + ny * hw - dy * k,
      tX - nx * hw - dx * k, tY - ny * hw - dy * k,
      tX - nx * hw, tY - ny * hw,
    ); // rounded top cap
    p.lineTo(bX - nx * hw, bY - ny * hw);
    p.cubicTo(
      bX - nx * hw + dx * k, bY - ny * hw + dy * k,
      bX + nx * hw + dx * k, bY + ny * hw + dy * k,
      bX + nx * hw, bY + ny * hw,
    ); // rounded bottom cap
    p.close();
  };
  const lines = Skia.Path.Make();
  const plate = Skia.Path.Make();
  for (const sgn of [1, -1] as const) {
    stick(lines, sgn);
    stick(plate, sgn); // the plate is the same two silhouettes, filled dark
    // Elliptical end-cap hint at the LOWER end: an open arc across the stick
    // just above the tip, bulging back UP the stick — the visible near edge
    // of the cylinder's end face (per the reference's line-art language).
    const dx = Math.sin(CLAVES_ANGLE) * sgn;
    const dy = Math.cos(CLAVES_ANGLE);
    const nx = -dy;
    const ny = dx;
    const ex = (CLAVES_DOWN - 0.8) * s * dx;
    const ey = (CLAVES_DOWN - 0.8) * s * dy;
    lines.moveTo(ex + nx * hw * 0.94, ey + ny * hw * 0.94);
    lines.quadTo(ex - dx * hw * 1.15, ey - dy * hw * 1.15, ex - nx * hw * 0.94, ey - ny * hw * 0.94);
  }
  // The CLICK: three short strokes radiating from the crossing point, fanned
  // in the gap above the two upper stick ends (they clear the 14-unit tips).
  for (const aDeg of [-22, 0, 22]) {
    const a = (aDeg * Math.PI) / 180;
    const ux = Math.sin(a);
    const uy = -Math.cos(a);
    lines.moveTo(ux * 17 * s, uy * 17 * s);
    lines.lineTo(ux * 23 * s, uy * 23 * s);
  }
  return { lines, plate };
}

/** CLAVES icon — the polar section's draggable source. No `angleRad`: claves
 *  don't face anything; the crossing point (the origin) is the acoustic
 *  origin, so callers position it and nothing else. Stroke width scales with
 *  `scale` (never absolute px), rounded caps/joins; `tint` rides the stroke
 *  as the state accent; `plate` = the dark interior over heat-map fields. */
function Claves({
  x,
  y,
  scale,
  tint,
  glow,
  plate,
}: {
  x: number;
  y: number;
  scale: number;
  tint: string;
  glow?: boolean;
  plate?: boolean;
}) {
  const parts = useMemo(() => buildClaves(scale), [scale]);
  const lw = 1.55 * scale;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {plate ? <Path path={parts.plate} color={HEAD_PLATE} /> : null}
      {glow ? (
        <Path
          path={parts.lines}
          color={tint}
          style="stroke"
          strokeWidth={lw * 3.4}
          strokeCap="round"
          strokeJoin="round"
          opacity={0.3}
        >
          <BlurMask blur={3 * scale} style="normal" />
        </Path>
      ) : null}
      <Path
        path={parts.lines}
        color={LINE}
        style="stroke"
        strokeWidth={lw}
        strokeCap="round"
        strokeJoin="round"
      />
      <Path
        path={parts.lines}
        color={tint}
        style="stroke"
        strokeWidth={lw}
        strokeCap="round"
        strokeJoin="round"
        opacity={0.34}
      />
    </Group>
  );
}

/** Head-and-shoulders bust appended to `p`; `x` = center, `y` = base line.
 *  ONE closed contour (shoulders → neck → jaw → cranium → back down) so the
 *  caller's dark outline stroke traces a single crisp silhouette with no
 *  internal seams — these are drawn small and layered over heat maps, where a
 *  clean edge is the only thing keeping them readable. Same overall footprint
 *  (16.6·s tall, 16·s wide) as the previous helper, so every seat/stage layout
 *  that positions them is untouched. */
function appendBust(p: SkPathT, x: number, y: number, s: number) {
  p.moveTo(x - 8 * s, y);
  // Left trapezius → shoulder → neck.
  p.cubicTo(x - 8 * s, y - 4.6 * s, x - 6.6 * s, y - 6.8 * s, x - 4.2 * s, y - 7.6 * s);
  p.cubicTo(x - 2.8 * s, y - 8.1 * s, x - 2.1 * s, y - 8.6 * s, x - 2.0 * s, y - 9.6 * s);
  // Jaw → cheek → cranium (widest just above the ear line).
  p.cubicTo(x - 3.2 * s, y - 10.6 * s, x - 3.9 * s, y - 11.9 * s, x - 3.9 * s, y - 13.2 * s);
  p.cubicTo(x - 3.9 * s, y - 15.4 * s, x - 2.2 * s, y - 16.7 * s, x, y - 16.7 * s);
  p.cubicTo(x + 2.2 * s, y - 16.7 * s, x + 3.9 * s, y - 15.4 * s, x + 3.9 * s, y - 13.2 * s);
  p.cubicTo(x + 3.9 * s, y - 11.9 * s, x + 3.2 * s, y - 10.6 * s, x + 2.0 * s, y - 9.6 * s);
  // Right neck → shoulder → trapezius.
  p.cubicTo(x + 2.1 * s, y - 8.6 * s, x + 2.8 * s, y - 8.1 * s, x + 4.2 * s, y - 7.6 * s);
  p.cubicTo(x + 6.6 * s, y - 6.8 * s, x + 8 * s, y - 4.6 * s, x + 8 * s, y);
  p.close();
}

/** Audience/performer busts in the SAME LINE-ART LANGUAGE as the head icons
 *  (owner ruling 2026-07-29): the silhouette keeps its shape, but it is now a
 *  light uniform stroke over a subtle dark interior so it reads instantly on
 *  top of a busy heat-map field. `stroke` carries meaning where the caller has
 *  meaning to carry (the coverage class); `sw` scales with the bust. */
function LineBusts({ path, stroke, sw }: { path: SkPathT; stroke: string; sw: number }) {
  return (
    <Group>
      <Path path={path} color={HEAD_PLATE} />
      <Path
        path={path}
        color={stroke}
        style="stroke"
        strokeWidth={sw}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

/** Handheld vocal mic parts, LOCAL coords: grille sphere centered at the
 *  origin, tapered body extending toward +y (behind the grille). */
function buildHandheldMic(gr: number, len: number) {
  const y0 = gr * 0.72; // neck: where the body meets the grille ball
  const y1 = y0 + len;
  const topW = gr * 0.68;
  const botW = gr * 0.48;
  const tailTop = y1 - gr * 0.55; // where the XLR tail begins
  const body = Skia.Path.Make();
  body.moveTo(-topW, y0);
  body.lineTo(-botW * 1.02, tailTop);
  body.lineTo(botW * 1.02, tailTop);
  body.lineTo(topW, y0);
  body.close();
  // XLR taper at the tail: a narrower stepped collar with a rounded end.
  const tail = Skia.Path.Make();
  tail.addRRect(
    Skia.RRectXY(Skia.XYWHRect(-botW * 0.82, tailTop, botW * 1.64, y1 - tailTop), gr * 0.16, gr * 0.16),
  );
  // Wire-mesh grille: fine crosshatch — latitude AND longitude ovals.
  const mesh = Skia.Path.Make();
  for (const t of [-0.72, -0.46, -0.2, 0.06, 0.32, 0.58, 0.8]) {
    const hw = gr * Math.sqrt(1 - t * t);
    mesh.addOval(Skia.XYWHRect(-hw, gr * t - gr * 0.12, hw * 2, gr * 0.24));
  }
  for (const t of [-0.62, -0.32, 0, 0.32, 0.62]) {
    const hh = gr * Math.sqrt(1 - t * t);
    mesh.addOval(Skia.XYWHRect(gr * t - gr * 0.11, -hh, gr * 0.22, hh * 2));
  }
  // Knurled ring at the grille/body joint: band + tick marks.
  const knurlH = gr * 0.34;
  const knurlBand = Skia.Path.Make();
  knurlBand.addRect(Skia.XYWHRect(-topW, y0, topW * 2, knurlH));
  const knurlTicks = Skia.Path.Make();
  for (let tx = -topW + gr * 0.12; tx < topW - gr * 0.05; tx += gr * 0.19) {
    knurlTicks.moveTo(tx, y0 + gr * 0.04);
    knurlTicks.lineTo(tx, y0 + knurlH - gr * 0.04);
  }
  // Subtle brand band mid-body.
  const brandBand = Skia.Path.Make();
  const bandY = y0 + (tailTop - y0) * 0.48;
  brandBand.addRect(Skia.XYWHRect(-botW * 1.08, bandY, botW * 2.16, gr * 0.14));
  return { body, tail, mesh, knurlBand, knurlTicks, brandBand, y0, y1 };
}

/**
 * Recognizable handheld vocal mic: spherical mesh grille + specular highlight
 * over a tapered metal-sheen body. `x,y` = grille CENTER; `angleDeg` uses the
 * lab convention front = (sin θ, −cos θ), i.e. 0° points up.
 */
function HandheldMic({
  x,
  y,
  angleDeg,
  grilleR,
  bodyLen,
}: {
  x: number;
  y: number;
  angleDeg: number;
  grilleR: number;
  bodyLen: number;
}) {
  const gr = grilleR;
  const parts = useMemo(() => buildHandheldMic(gr, bodyLen), [gr, bodyLen]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      {/* Tapered body: 3-stop metal sheen, lit from the upper-left. */}
      <Path path={parts.body}>
        <LinearGradient
          start={vec(-gr, 0)}
          end={vec(gr, 0)}
          colors={[METAL_LO, METAL_HI, METAL_MID, METAL_LO]}
          positions={[0, 0.28, 0.55, 1]}
        />
      </Path>
      {/* Subtle brand band mid-body. */}
      <Path path={parts.brandBand} color={WAVE} opacity={0.5} />
      {/* XLR taper at the tail. */}
      <Path path={parts.tail}>
        <LinearGradient
          start={vec(-gr * 0.5, 0)}
          end={vec(gr * 0.5, 0)}
          colors={['#23242b', '#585c68', '#1c1d23']}
          positions={[0, 0.32, 1]}
        />
      </Path>
      {/* Knurled ring at the grille/body joint. */}
      <Path path={parts.knurlBand}>
        <LinearGradient start={vec(-gr * 0.7, 0)} end={vec(gr * 0.7, 0)} colors={['#3a3c44', '#9ba0ac', '#33343c']} />
      </Path>
      <Path path={parts.knurlTicks} color="#15161b" style="stroke" strokeWidth={Math.max(0.5, gr * 0.05)} opacity={0.8} />
      {/* Grille sphere + fine crosshatch mesh (both directions). */}
      <Circle cx={0} cy={0} r={gr}>
        <RadialGradient
          c={vec(-gr * 0.35, -gr * 0.4)}
          r={gr * 1.9}
          colors={['#dde0e7', '#8a8c94', '#33343c']}
        />
      </Circle>
      <Path path={parts.mesh} color="#101116" style="stroke" strokeWidth={Math.max(0.5, gr * 0.055)} opacity={0.55} />
      {/* Specular hotspot: soft bloom + crisp core. */}
      <Circle cx={-gr * 0.34} cy={-gr * 0.4} r={gr * 0.32} color="#ffffff" opacity={0.45}>
        <BlurMask blur={gr * 0.3} style="normal" />
      </Circle>
      <Circle cx={-gr * 0.36} cy={-gr * 0.42} r={gr * 0.12} color="#ffffff" opacity={0.8} />
    </Group>
  );
}

/** Slim pencil-condenser mic, LOCAL: capsule tip at origin, body toward +y. */
function buildPencilMic(w2: number, len: number): SkPathT {
  const p = Skia.Path.Make();
  const capL = len * 0.26;
  // Capsule (slightly narrower), rounded nose.
  p.moveTo(-w2 * 0.8, capL);
  p.lineTo(-w2 * 0.8, w2);
  p.quadTo(-w2 * 0.8, 0, 0, 0);
  p.quadTo(w2 * 0.8, 0, w2 * 0.8, w2);
  p.lineTo(w2 * 0.8, capL);
  p.close();
  // Body: a stadium behind the capsule.
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(-w2, capL, w2 * 2, len - capL), w2, w2));
  return p;
}

function PencilMic({ x, y, angleDeg, scale = 1 }: { x: number; y: number; angleDeg: number; scale?: number }) {
  const w2 = 4.6 * scale;
  const len = 30 * scale;
  const path = useMemo(() => buildPencilMic(w2, len), [w2, len]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={path}>
        <LinearGradient
          start={vec(-w2, 0)}
          end={vec(w2, 0)}
          colors={[METAL_LO, METAL_HI, METAL_MID, METAL_LO]}
          positions={[0, 0.3, 0.55, 1]}
        />
      </Path>
      <SkLine
        p1={{ x: -w2 * 0.8, y: len * 0.26 }}
        p2={{ x: w2 * 0.8, y: len * 0.26 }}
        color={WAVE}
        strokeWidth={1.1 * scale}
        opacity={0.7}
      />
    </Group>
  );
}

/**
 * THE canonical hand (owner defect ruling 2026-07-29 — "different icons and
 * drawing artifacts in different positions"). There is now exactly ONE hand
 * drawing in this file. Every hand on screen — the grip panel, the cutaway's
 * cupping hand, and all seven mistake-gallery cards — renders THIS geometry,
 * parameterized ONLY by position, scale, rotation, tint and layer. No branch
 * anywhere swaps in a different shape, so the hand is provably identical at
 * every position.
 *
 * Local frame (all numbers below are "hand units", multiplied by `s`):
 *   • origin (0,0) = the grip CENTRE, sitting ON the mic axis. The mic body
 *     runs along the local +y/−y axis; local −y points toward the grille.
 *   • the palm mass sits at +x (BEHIND the body, drawn in the "back" layer);
 *     the fingers wrap across the axis out to −x (IN FRONT of the body,
 *     drawn in the "front" layer), so the body is sandwiched correctly.
 *   • HAND_TOP … HAND_BOT is the hand SILHOUETTE extent along the body axis
 *     (36.5 units). The forearm/wrist deliberately runs past HAND_BOT and is
 *     NOT part of that extent — the grip-zone geometry (below) uses the hand,
 *     not the arm.
 *
 * Artifacts eliminated in this rebuild:
 *   • the old free-floating stroked "fingerShade" polyline drew each crease
 *     ON TOP of the NEXT finger (and the last one below the silhouette
 *     entirely) — creases are now filled slivers built INSIDE each finger's
 *     own outline, so nothing can land outside it;
 *   • the old blurred fingertip Circles (SKIN_LO + BlurMask, centred past the
 *     tip) bled dark pads outside the hand — deleted; the curl is now part of
 *     the finger outline itself;
 *   • the old palm reached to x = −10.5s, so at small scales it poked out on
 *     the WRONG side of the body (the hand looked different in the gallery
 *     than in the grip panel) — the palm now stops at x ≈ −3s, strictly
 *     behind the body, and only the fingers cross the axis;
 *   • tint strokes used absolute 0.9–1.0 px widths, so the tint read ~1.8×
 *     heavier on the small gallery hands — all strokes now scale with `s`.
 */
const HAND_TOP = -17.5;
const HAND_BOT = 19;
/** Hand silhouette height in hand units (HAND_BOT − HAND_TOP). */
const HAND_H = HAND_BOT - HAND_TOP;
/** Fingers, index → pinky: centre line, reach (tip x), half-thickness. */
const HAND_FINGERS: { y: number; tip: number; th: number }[] = [
  { y: -11.1, tip: -12.4, th: 3.3 },
  { y: -3.7, tip: -13.2, th: 3.4 },
  { y: 3.7, tip: -12.6, th: 3.2 },
  { y: 11.1, tip: -10.8, th: 2.9 },
];

function buildHand(s: number): {
  palm: SkPathT;
  wrist: SkPathT;
  fingers: SkPathT[];
  creases: SkPathT[];
  thumb: SkPathT;
  thumbShade: SkPathT;
  thumbEdge: SkPathT;
} {
  // Palm mass: a rounded organic silhouette BEHIND the body. Its far edge
  // stops just short of the axis so it never shows on the finger side.
  const palm = Skia.Path.Make();
  palm.moveTo(-1.5 * s, -12.5 * s);
  palm.cubicTo(5 * s, -17.5 * s, 15 * s, -17.2 * s, 19.5 * s, -10.5 * s); // knuckle line → thenar
  palm.cubicTo(22.5 * s, -4.5 * s, 22.5 * s, 6.5 * s, 19 * s, 12.5 * s); // back of the hand
  palm.cubicTo(14.5 * s, 18.5 * s, 3 * s, 19 * s, -1 * s, 15 * s); // heel of the hand
  palm.cubicTo(-3 * s, 12.5 * s, -3 * s, 2 * s, -2 * s, -5 * s); // axis-side edge
  palm.cubicTo(-1.8 * s, -9 * s, -2.2 * s, -10.8 * s, -1.5 * s, -12.5 * s);
  palm.close();
  // Forearm leaving toward the lower right, tapering out of frame.
  const wrist = Skia.Path.Make();
  wrist.moveTo(9 * s, 13.5 * s);
  wrist.cubicTo(15 * s, 17 * s, 21 * s, 21.5 * s, 26 * s, 27 * s);
  wrist.lineTo(18 * s, 32.5 * s);
  wrist.cubicTo(12.5 * s, 25.5 * s, 8 * s, 21 * s, 3.5 * s, 17.5 * s);
  wrist.close();
  // Four curling fingers. Each is ONE closed outline: underside sweep out to
  // the tip, a rounded curl AROUND the far edge of the body, then the top
  // edge back through the PIP joint and the MCP knuckle into the palm. The
  // outline is x-monotone out and back, so it cannot self-intersect.
  const fingers: SkPathT[] = [];
  const creases: SkPathT[] = [];
  for (let i = 0; i < 4; i++) {
    const fg = HAND_FINGERS[i];
    const fy = fg.y * s;
    const tip = fg.tip * s;
    const th = fg.th * s;
    const f = Skia.Path.Make();
    f.moveTo(20 * s, fy + th);
    f.cubicTo(10 * s, fy + th + 0.6 * s, 2 * s, fy + th + 0.4 * s, tip + 3.4 * s, fy + th * 0.92); // underside
    f.quadTo(tip - 0.4 * s, fy + th * 0.92, tip - 0.4 * s, fy); // curl around the far edge
    f.quadTo(tip - 0.4 * s, fy - th * 0.92, tip + 3.4 * s, fy - th * 0.92); // back over the top
    f.cubicTo(6 * s, fy - th - 0.5 * s, 12 * s, fy - th - 1.4 * s, 15.5 * s, fy - th - 1.1 * s); // PIP ridge
    f.quadTo(18.5 * s, fy - th - 0.8 * s, 20 * s, fy - th + 0.4 * s); // MCP knuckle, palm side
    f.close();
    fingers.push(f);
    // Crease: a filled sliver built strictly INSIDE this finger's outline
    // (it shares the underside curve and returns 1 unit above it), so it can
    // never draw over a neighbouring finger or outside the silhouette.
    const cr = Skia.Path.Make();
    cr.moveTo(19 * s, fy + th);
    cr.cubicTo(10 * s, fy + th + 0.6 * s, 2 * s, fy + th + 0.4 * s, tip + 3.6 * s, fy + th * 0.9);
    cr.cubicTo(2 * s, fy + th - 0.7 * s, 10 * s, fy + th - 0.5 * s, 19 * s, fy + th - 1.1 * s);
    cr.close();
    creases.push(cr);
  }
  // Thumb: crosses the body diagonally, over the upper fingers, tip curling
  // toward the far edge — the natural way a thumb closes a grip.
  const thumb = Skia.Path.Make();
  thumb.moveTo(19 * s, 5.5 * s); // base at the thenar
  thumb.cubicTo(12 * s, 3.2 * s, 5 * s, -1.5 * s, 0.2 * s, -7.2 * s); // leading edge
  thumb.quadTo(-3.2 * s, -11.2 * s, -0.6 * s, -13.6 * s); // rounded tip
  thumb.quadTo(2 * s, -15.8 * s, 5 * s, -12.6 * s); // tip top
  thumb.cubicTo(9.5 * s, -7.6 * s, 14.5 * s, -2.6 * s, 20.5 * s, -0.6 * s); // trailing edge
  thumb.close();
  const thumbShade = Skia.Path.Make();
  thumbShade.moveTo(16.5 * s, 4.4 * s);
  thumbShade.cubicTo(10.5 * s, 2.2 * s, 4.5 * s, -2.2 * s, 0.8 * s, -7 * s);
  // STRAY-THUMB FIX (owner defect 2026-07-29 — "there is still a drawn outline
  // of a thumb on top of the hand … in the various handle positions"). ROOT
  // CAUSE: the front layer stroked the CLOSED `thumb` path in the state tint
  // AFTER filling it, and then stroked all four fingers in the tint after
  // that — so a complete, unbroken thumb-shaped contour was drawn over the
  // filled fingers at every grip position, reading as a second, ghost thumb.
  // There is only ever ONE thumb shape; the tint now rides a SINGLE OPEN edge
  // (the thumb's lit leading edge) instead of a closed outline, and the finger
  // edges are drawn BEFORE the thumb so nothing outlines across it.
  const thumbEdge = Skia.Path.Make();
  thumbEdge.moveTo(19 * s, 5.5 * s);
  thumbEdge.cubicTo(12 * s, 3.2 * s, 5 * s, -1.5 * s, 0.2 * s, -7.2 * s);
  thumbEdge.quadTo(-3.2 * s, -11.2 * s, -0.6 * s, -13.6 * s);
  thumbEdge.quadTo(2 * s, -15.8 * s, 5 * s, -12.6 * s);
  return { palm, wrist, fingers, creases, thumb, thumbShade, thumbEdge };
}

// Per-finger highlight tones (upper fingers catch more of the light).
const FINGER_HI = ['#94785f', '#8d725a', '#836a53', '#78614c'];

/**
 * The canonical hand, rendered in two passes so the mic body sits between the
 * palm and the fingers:
 *   <GripHand layer="back" …/> → <HandheldMic …/> → <GripHand layer="front" …/>
 * (x, y) = the grip centre ON the mic axis; `angleDeg` rotates the hand with
 * the mic (0 = mic pointing up). Shape NEVER varies with any of these.
 */
function GripHand({
  x,
  y,
  scale,
  tint,
  angleDeg = 0,
  layer,
}: {
  x: number;
  y: number;
  scale: number;
  tint: string;
  angleDeg?: number;
  layer: 'back' | 'front';
}) {
  const s = scale;
  const parts = useMemo(() => buildHand(s), [s]);
  const hair = Math.max(0.55, 0.85 * s); // every stroke scales with the hand
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      {layer === 'back' ? (
        <>
          <Path path={parts.wrist}>
            <LinearGradient start={vec(3 * s, 13 * s)} end={vec(26 * s, 32 * s)} colors={[SKIN_MID, SKIN_LO]} />
          </Path>
          <Path path={parts.palm}>
            <LinearGradient
              start={vec(-2 * s, -17.5 * s)}
              end={vec(22.5 * s, 19 * s)}
              colors={[SKIN_HI, SKIN_MID, SKIN_LO]}
              positions={[0, 0.45, 1]}
            />
          </Path>
        </>
      ) : (
        <>
          {/* Four fingers, each lit across its own thickness — knuckles up. */}
          {parts.fingers.map((f, i) => (
            <Path key={i} path={f}>
              <LinearGradient
                start={vec(0, (HAND_FINGERS[i].y - HAND_FINGERS[i].th - 1.6) * s)}
                end={vec(0, (HAND_FINGERS[i].y + HAND_FINGERS[i].th) * s)}
                colors={[FINGER_HI[i] ?? SKIN_HI, SKIN_MID, SKIN_LO]}
                positions={[0, 0.5, 1]}
              />
            </Path>
          ))}
          {/* Creases: filled slivers INSIDE each finger — no stray strokes. */}
          {parts.creases.map((c, i) => (
            <Path key={`c${i}`} path={c} color="#1c130d" opacity={0.45} />
          ))}
          {/* Finger edge light FIRST — so no finger outline is ever drawn
              across the thumb that sits on top of them. */}
          {parts.fingers.map((f, i) => (
            <Path key={`t${i}`} path={f} color={tint} style="stroke" strokeWidth={hair * 0.9} opacity={0.4} />
          ))}
          {/* Thumb REMOVED (owner 2026-07-30): it kept drawing on top of the
              fingers, which reads as a hand that can't hold anything and isn't
              how a real grip looks. The wrapped fingers alone carry the grip. */}
        </>
      )}
    </Group>
  );
}

/** Subtle edge vignette so scenes don't float on flat black. Render last on
 *  scene canvases (not over data maps). */
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

/** Floor strip: gradient ground + edge line for scene depth. */
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

/** Glow + crisp double-stroke for a styled curve. */
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

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Polar Pattern Viewer — drag the source around the mic

/** Conceptual field level → colormap position for the mic-lab heat fields
 *  (same idea as the speaker lab's coverageT, tuned so on-axis near the mic
 *  glows red and the pattern nulls sit in deep navy). ILLUSTRATIVE, never a
 *  measured response. */
function fieldT(lvl: number): number {
  const db = 10 * Math.log10(Math.max(1e-4, lvl));
  return Math.max(0, Math.min(1, (db + 12) / 15));
}

/**
 * Fine conceptual pickup field around the mic: polar gain r(θ) × 1/d falloff,
 * quantized into ≤32 jet buckets — ONE Path per bucket, memoized per pattern
 * change (never per frame).
 *
 * RESOLUTION (owner ruling 2026-07-29): 200 × 200 cells — 4× the old 50 × 50
 * linear resolution, 16× the cells. The rect count does NOT go up 16× with
 * it: each row is RUN-LENGTH MERGED, emitting one rect per contiguous run of
 * same-bucket cells. The field is smooth, so a 200-cell row typically crosses
 * only a couple of dozen bucket boundaries — see the run-merge note on
 * addFieldRow() below.
 */
const POLAR_FIELD_N = 200;

/** Walk one row of a quantized field and emit ONE rect per contiguous run of
 *  same-bucket cells (instead of one rect per cell). `bucketOf(c)` returns the
 *  bucket index for column c. This is what keeps a 40 000-cell field down to a
 *  few thousand Skia rects on a mid-range phone. */
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
      // +0.5 overlap kills hairline seams between neighbouring runs/rows.
      buckets[runIdx].addRect(Skia.XYWHRect(x0 + runStart * cw, y, (c - runStart) * cw + 0.5, ch + 0.5));
      runIdx = idx;
      runStart = c;
    }
  }
  buckets[runIdx].addRect(Skia.XYWHRect(x0 + runStart * cw, y, (cols - runStart) * cw + 0.5, ch + 0.5));
}

function usePolarFieldBuckets(
  w: number,
  h: number,
  cx: number,
  cy: number,
  R: number,
  a: number,
  b: number,
): SkPathT[] {
  return useMemo(() => {
    const bucketPaths: SkPathT[] = Array.from({ length: JET_BUCKET_COUNT }, () => Skia.Path.Make());
    const COLS = POLAR_FIELD_N;
    const ROWS = POLAR_FIELD_N;
    const cw = w / COLS;
    const ch = h / ROWS;
    const refD = R * 0.45;
    for (let r = 0; r < ROWS; r++) {
      const py = (r + 0.5) * ch;
      const dy = py - cy;
      addFieldRow(bucketPaths, COLS, 0, r * ch, cw, ch, (c) => {
        const dx = (c + 0.5) * cw - cx;
        const d = Math.max(10, Math.hypot(dx, dy));
        const th = Math.atan2(dx, -dy); // angle from the mic's front axis (up)
        const lvl = polarGain(a, b, th) * (refD / d);
        return Math.round(fieldT(lvl) * (JET_BUCKET_COUNT - 1));
      });
    }
    return bucketPaths;
  }, [w, h, cx, cy, R, a, b]);
}

// ── POLAR: the CLAVES are the source, positioned FREELY (owner 2026-07-29,
// reference art supplied) ────────────────────────────────────────────────────
// The draggable source of the polar section is the crossed-claves icon — the
// crossing point (where the click happens) IS the acoustic origin the polar
// math measures from. Claves don't "face" anything, so the icon never rotates
// toward the mic. It is dragged anywhere on the canvas and the ONLY
// restriction is that its silhouette may not INTERSECT the mic's — it may sit
// right up against it. The collision floor is solved in the host screen
// (which must also work on pre-Skia clients), against the geometry constants
// published here. The profile head stays in use in every OTHER section
// (distance / proximity / off-axis …) — only the polar source changed.
/** Grille radius / body length of the polar scene's mic. */
export const POLAR_MIC_GR = 8;
export const POLAR_MIC_LEN = 37;
/** Mic grille-centre offset from the canvas centre, in px. */
export const POLAR_MIC_DY = -6;
/** The claves silhouette as three collision circles, in CLAVES UNITS, in the
 *  icon's own UNROTATED frame (origin = the crossing point, +y down as
 *  drawn — the icon never rotates): one over the crossing (covers both upper
 *  stick halves) and one along each stick's lower half. Multiply by
 *  clavesScaleForMic(POLAR_MIC_GR, POLAR_MIC_LEN). */
export const CLAVES_COLLIDERS: { u: number; v: number; r: number }[] = [
  { u: 0, v: 0, r: 10 },
  { u: 10.9, v: 15.6, r: 8 },
  { u: -10.9, v: 15.6, r: 8 },
];

export function PolarPatternView({
  phase,
  width,
  height = 230,
  a,
  b,
  srcX,
  srcY,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  a: number;
  b: number;
  /** Source position in CANVAS px — already collision-clamped by the host. */
  srcX: number;
  srcY: number;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2 - 16;

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [1, 0.66, 0.33]) p.addCircle(cx, cy, R * f);
    p.moveTo(cx - R, cy);
    p.lineTo(cx + R, cy);
    p.moveTo(cx, cy - R);
    p.lineTo(cx, cy + R);
    return p;
  }, [cx, cy, R]);

  const pattern = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 180; i++) {
      const th = (i / 180) * 2 * Math.PI;
      const r = R * 0.92 * polarGain(a, b, th);
      const x = cx + r * Math.sin(th);
      const y = cy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [cx, cy, R, a, b]);

  // Source position + its pickup gain (plain JS — captured by the worklet).
  // The polar math is UNCHANGED: θ is still measured from the mic's front
  // axis (up); only WHAT sits at the source has changed. The claves' crossing
  // point IS the source position — no facing/rotation (claves don't face).
  const sx = srcX;
  const sy = srcY;
  const gy = cy + POLAR_MIC_DY; // the grille centre the pickup line runs to
  const thSrc = Math.atan2(sx - cx, -(sy - gy));
  const gain = polarGain(a, b, thSrc);

  const pickupLine = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(sx, sy);
    p.lineTo(cx, gy);
    return p;
  }, [sx, sy, cx, gy]);

  // Ripples traveling source → mic (phase-continuous).
  const ripples = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const dist = Math.hypot(sx - cx, sy - gy);
    for (let i = 0; i < 3; i++) {
      const f = (ph / (2 * Math.PI) + i / 3) % 1;
      p.addCircle(sx, sy, 6 + f * dist);
    }
    return p;
  }, [phase, sx, sy, cx, gy]);

  const field = usePolarFieldBuckets(w, h, cx, cy, R, a, b);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Conceptual pickup FIELD: polar gain × 1/d falloff through the jet
          colormap — 50×50 cells in ≤32 bucket paths, memoized per pattern.
          Smooth lobes glow red on-axis and fall to deep navy in the nulls. */}
      {field.map((p, i) => (
        <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.92} />
      ))}
      {/* Polar grid, faint over the field. */}
      <Path path={grid} color="#ffffff" style="stroke" strokeWidth={1} opacity={0.1} />
      <Path path={ripples} color="#ffffff" style="stroke" strokeWidth={1.2} opacity={0.32} />
      {/* Pattern boundary: a thin bright edge over the field. */}
      <GlowStroke path={pattern} color="#ffffff" width={1.6} opacity={0.6} />
      {/* Pickup line, weight fading with gain (same opacity law as before). */}
      <Path
        path={pickupLine}
        color={ACCENT_GREEN}
        style="stroke"
        strokeWidth={2}
        opacity={0.25 + 0.75 * gain}
      />
      {/* The mic itself, front axis up (1.72·8 + 37 ≈ 3.2 × the 16-px grille). */}
      <HandheldMic x={cx} y={gy} angleDeg={0} grilleR={POLAR_MIC_GR} bodyLen={POLAR_MIC_LEN} />
      {/* THE SOURCE: crossed claves (owner reference art), the click point —
          the crossing — sitting exactly at the source position, in TRUE
          proportion to the mic (20 cm clave vs 16 cm mic) and free to be
          dragged right up next to the grille. Never rotated (claves don't
          face); plated so the line art stays readable over the heat field. */}
      <Claves
        x={sx}
        y={sy}
        scale={clavesScaleForMic(POLAR_MIC_GR, POLAR_MIC_LEN)}
        tint={ACCENT_GREEN}
        glow
        plate
      />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Distance — wavefronts, working distance, direct vs room

export function DistanceView({
  phase,
  width,
  height = 150,
  dist01,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** 0 = closest working distance · 1 = far. */
  dist01: number;
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const srcX = 22;
  const micX = 64 + dist01 * (w - 110);

  const fronts = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const maxR = w - 36;
    for (let i = 0; i < 4; i++) {
      const f = (ph / (2 * Math.PI) + i / 4) % 1;
      const r = 10 + f * maxR;
      // Forward-facing arcs only (a mouth radiates ahead).
      p.addArc({ x: srcX - r, y: mid - r, width: 2 * r, height: 2 * r }, -64, 128);
    }
    return p;
  }, [phase, srcX, mid, w]);

  // Conceptual sound field: DIRECT energy (forward lobe × 1/d from the mouth)
  // over a constant diffuse ROOM glow — the mic slides THROUGH the field as
  // the distance changes. Static per layout (source is fixed): memoized,
  // ≤32 jet-bucket paths, never rebuilt per frame.
  const field = useMemo(() => {
    const bucketPaths: SkPathT[] = Array.from({ length: JET_BUCKET_COUNT }, () => Skia.Path.Make());
    const fieldH = h - 16; // stop at the floor strip
    // 200 × 88 — 4× the old 50 × 22 linear resolution (owner 2026-07-29),
    // with per-row run-length merging so the rect count stays modest.
    const COLS = 200;
    const ROWS = 88;
    const cw = w / COLS;
    const ch = fieldH / ROWS;
    const refD = 42;
    const room = 0.14; // the diffuse room level the direct field sinks into
    for (let r = 0; r < ROWS; r++) {
      const dy = (r + 0.5) * ch - mid;
      addFieldRow(bucketPaths, COLS, 0, r * ch, cw, ch, (c) => {
        const dx = (c + 0.5) * cw - srcX;
        const d = Math.max(12, Math.hypot(dx, dy));
        const offDeg = (Math.abs(Math.atan2(dy, Math.max(1e-3, dx))) * 180) / Math.PI;
        const forward = dx > 0 ? smoothEdge(offDeg, 55) : 0.12; // a mouth radiates ahead
        const lvl = forward * (refD / d) + room;
        return Math.round(fieldT(lvl) * (JET_BUCKET_COUNT - 1));
      });
    }
    return bucketPaths;
  }, [w, h, srcX, mid]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Heat field: direct sound fading into the room glow. */}
      {field.map((p, i) => (
        <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.92} />
      ))}
      <Floor w={w} y={h - 16} h={16} />
      <Path path={fronts} color="#ffffff" style="stroke" strokeWidth={4} opacity={0.1}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={fronts} color="#ffffff" style="stroke" strokeWidth={1.3} opacity={0.4} />
      {/* Talker in profile, mouth at the wavefront origin — TRUE proportion to
          the mic (head ≈ 1.44 × the mic's length); the back of the skull runs
          off the left edge by design. */}
      <ProfileHead
        x={srcX}
        y={mid}
        angleRad={0}
        scale={headScaleForMic(8, 37)}
        tint={CONE}
        plate
        speaking
      />
      {/* The mic at working distance, grille facing the talker (3.2 : 1). */}
      <HandheldMic x={micX} y={mid} angleDeg={-90} grilleR={8} bodyLen={37} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Proximity effect — the LF shelf that appears as you move in

/** Illustrative proximity boost curve (dB at f for a given boost setting). */
export function proximityDb(f: number, boostDb: number): number {
  if (f >= 220) return 0;
  const x = Math.min(1, Math.log2(220 / f) / 2.2); // 0 at 220 Hz → 1 near 48 Hz
  return boostDb * x;
}

/** Frequency ticks for the response graphs — the ACTUAL plotted decade span
 *  (40 Hz … 16 kHz), so the axis never claims range the curve doesn't have. */
const FREQ_TICKS: { f: number; label: string }[] = [
  { f: 40, label: '40' },
  { f: 100, label: '100' },
  { f: 1000, label: '1k' },
  { f: 10000, label: '10k' },
  { f: 16000, label: '16k' },
];

/** Pick a dB grid step giving ≤ 4 interior lines for the caller's range. */
function dbStepFor(range: number): number {
  for (const v of [2, 3, 5, 6, 10, 12, 20, 25]) if (range / v <= 4) return v;
  return 30;
}

/**
 * Response curve WITH READABLE AXES (owner 2026-07-29 — the bare curve gave
 * no ranges). Log FREQUENCY axis with labelled ticks along the bottom, and an
 * AMPLITUDE axis in dB down the left gutter that shows the caller's ACTUAL
 * plotted range: the floor and ceiling are always labelled endpoints, with a
 * nice-stepped grid between them and a brighter 0 dB reference line. Labels
 * are RN text over the canvas (the lab's font tokens), like the proximity
 * scene's readout — no Skia font asset needed.
 */
export function ResponseCurveView({
  width,
  height = 132,
  dbAt,
  color = WAVE,
  floorDb = -14,
  ceilDb = 14,
}: {
  width: number;
  height?: number;
  /** dB at frequency (40..16k) — the illustrative model to draw. */
  dbAt: (f: number) => number;
  color?: string;
  floorDb?: number;
  ceilDb?: number;
}) {
  const w = width;
  const h = height;
  const fLo = 40;
  const fHi = 16000;
  const PAD_L = 30; // dB gutter
  const PAD_R = 8;
  const PAD_T = 9;
  const PAD_B = 15; // frequency label strip
  const plotW = Math.max(20, w - PAD_L - PAD_R);
  const plotH = Math.max(20, h - PAD_T - PAD_B);
  const xOf = (f: number) => PAD_L + (Math.log(f / fLo) / Math.log(fHi / fLo)) * plotW;
  const yOf = (db: number) =>
    PAD_T + ((ceilDb - Math.max(floorDb, Math.min(ceilDb, db))) / (ceilDb - floorDb)) * plotH;

  // dB ticks: nice-stepped multiples inside the range, plus the exact floor
  // and ceiling so the reader always sees what the graph actually spans.
  const dbTicks = useMemo(() => {
    const step = dbStepFor(ceilDb - floorDb);
    const out: number[] = [];
    for (let v = Math.ceil(floorDb / step) * step; v <= ceilDb + 1e-6; v += step) out.push(v);
    if (out.length === 0 || out[0] - floorDb > step * 0.4) out.unshift(floorDb);
    if (ceilDb - out[out.length - 1] > step * 0.4) out.push(ceilDb);
    return out;
  }, [floorDb, ceilDb]);

  const { grid, ticks, frame } = useMemo(() => {
    const g = Skia.Path.Make();
    const t = Skia.Path.Make();
    const fr = Skia.Path.Make();
    for (const ft of FREQ_TICKS) {
      const x = xOf(ft.f);
      g.moveTo(x, PAD_T);
      g.lineTo(x, PAD_T + plotH);
      t.moveTo(x, PAD_T + plotH);
      t.lineTo(x, PAD_T + plotH + 3.5);
    }
    for (const db of dbTicks) {
      const y = yOf(db);
      g.moveTo(PAD_L, y);
      g.lineTo(PAD_L + plotW, y);
      t.moveTo(PAD_L - 3.5, y);
      t.lineTo(PAD_L, y);
    }
    // Plot frame: left axis + baseline.
    fr.moveTo(PAD_L, PAD_T);
    fr.lineTo(PAD_L, PAD_T + plotH);
    fr.lineTo(PAD_L + plotW, PAD_T + plotH);
    return { grid: g, ticks: t, frame: fr };
  }, [w, h, floorDb, ceilDb, dbTicks]);

  const { curve, under } = useMemo(() => {
    const c = Skia.Path.Make();
    const u = Skia.Path.Make();
    const N = 110;
    for (let i = 0; i <= N; i++) {
      const f = fLo * Math.pow(fHi / fLo, i / N);
      const y = yOf(dbAt(f));
      const x = xOf(f);
      if (i === 0) {
        c.moveTo(x, y);
        u.moveTo(x, y);
      } else {
        c.lineTo(x, y);
        u.lineTo(x, y);
      }
    }
    u.lineTo(PAD_L + plotW, PAD_T + plotH);
    u.lineTo(PAD_L, PAD_T + plotH);
    u.close();
    return { curve: c, under: u };
  }, [w, h, dbAt, floorDb, ceilDb]);

  const axisText = {
    fontFamily: fonts.mono,
    fontSize: 8.5,
    color: '#767a85',
  } as const;
  const zeroInRange = floorDb <= 0 && ceilDb >= 0;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Path path={grid} color={GHOST} style="stroke" strokeWidth={1} />
        <Path path={ticks} color={GRID} style="stroke" strokeWidth={1.2} />
        <Path path={frame} color={GRID} style="stroke" strokeWidth={1.2} />
        {/* 0 dB reference, brighter than the grid. */}
        {zeroInRange ? (
          <SkLine
            p1={{ x: PAD_L, y: yOf(0) }}
            p2={{ x: PAD_L + plotW, y: yOf(0) }}
            color="#4b4e58"
            strokeWidth={1.4}
          />
        ) : null}
        {/* Gradient underfill lifts the curve off black (abstract, styled). */}
        <Path path={under}>
          <LinearGradient
            start={vec(0, PAD_T)}
            end={vec(0, PAD_T + plotH)}
            colors={[withAlpha(color, 0.26), withAlpha(color, 0.02)]}
          />
        </Path>
        <GlowStroke path={curve} color={color} width={2.4} />
      </Canvas>
      {/* AMPLITUDE axis (dB) — the actual plotted range. */}
      {dbTicks.map((db) => (
        <RNText
          key={`d${db}`}
          style={{
            position: 'absolute',
            left: 0,
            width: PAD_L - 5,
            top: yOf(db) - 5,
            textAlign: 'right',
            ...axisText,
          }}
        >
          {db > 0 ? `+${db}` : `${db}`}
        </RNText>
      ))}
      <RNText
        style={{
          position: 'absolute',
          left: 1,
          top: 0,
          fontFamily: fonts.oswaldSemiBold,
          fontSize: 8,
          letterSpacing: 0.8,
          color: '#767a85',
        }}
      >
        dB
      </RNText>
      {/* FREQUENCY axis (log). */}
      {FREQ_TICKS.map((ft) => (
        <RNText
          key={`f${ft.f}`}
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(w - 30, xOf(ft.f) - 15)),
            width: 30,
            top: h - 11,
            textAlign: 'center',
            ...axisText,
          }}
        >
          {ft.label}
        </RNText>
      ))}
      <RNText
        style={{
          position: 'absolute',
          left: 1,
          top: h - 11,
          fontFamily: fonts.oswaldSemiBold,
          fontSize: 8,
          letterSpacing: 0.8,
          color: '#767a85',
        }}
      >
        Hz
      </RNText>
    </View>
  );
}

/**
 * Proximity APPROACH scene (owner 2026-07-29): a live side view of the mic
 * physically moving toward the singer as the distance changes — eased motion
 * (never snapping), an annotated gap, and low-frequency emphasis visualized
 * as a warm capsule glow + swelling bass arcs at close range. Pairs with the
 * response curve; ILLUSTRATIVE throughout.
 */
export function ProximityApproachView({
  phase,
  width,
  height = 128,
  inches,
  boostDb,
  directional,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** Working distance in inches (1..12 in the lab). */
  inches: number;
  /** The illustrative LF boost at this distance (dB). */
  boostDb: number;
  /** Omni mics have no proximity effect — the glow stays off. */
  directional: boolean;
}) {
  const w = width;
  const h = height;
  const mid = h * 0.52;
  const headX = 30; // ProfileHead origin = the mouth
  const GR = 9; // grille radius
  const LEN = 42; // body length → 1.72·9 + 42 = 57.5 ≈ 3.2 × the 18-px grille
  // TRUE proportion: the head is ~1.8× the drawn scale, i.e. ~82 px crown→chin
  // against the 57.5-px mic. The cranium reaches y ≈ mid − 63, so it just
  // clears the top of this panel; the nose tip lands at headX + 20.
  const headS = headScaleForMic(GR, LEN);
  // Map inches → on-screen gap (mouth → grille), then EASE toward it. The
  // 26-px floor is the closest the grille may come before it would touch the
  // (now correctly sized) nose.
  const gapPx = 26 + ((inches - 1) / 11) * Math.max(36, w - 168);
  const targetX = headX + gapPx + GR; // grille centre
  const micX = useSharedValue(targetX);
  const warm = useSharedValue(directional ? boostDb : 0);
  useEffect(() => {
    micX.value = withTiming(targetX, { duration: 650, easing: Easing.out(Easing.cubic) });
    warm.value = withTiming(directional ? boostDb : 0, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [micX, warm, targetX, boostDb, directional]);

  // ── Why the mic is drawn as PATHS and not as a translated <Group> ─────────
  // The previous build put <HandheldMic> inside <Group transform={derived}>.
  // That animated CTM was the ONLY animated Group transform in the whole app,
  // and the mic never moved. Everything in this file that DOES animate feeds
  // a Skia PATH (or a scalar paint prop) built inside a useDerivedValue
  // worklet straight into a drawing node. So the mic's geometry is now
  // rebuilt from the eased `micX` every frame, in WORLD coordinates — the
  // drawn geometry itself moves, with no CTM in the loop at all.
  //
  // The gradients stay STATIC because the mic only travels in X and every
  // gradient here runs vertically (start/end share x = 0): a vertical form
  // gradient is invariant under horizontal motion, so no animated shader
  // props are needed either.
  const bodyPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const x0 = micX.value + GR * 0.72; // grille/body joint
    const xTail = x0 + LEN - GR * 0.55;
    const topW = GR * 0.68;
    const botW = GR * 0.48;
    p.moveTo(x0, mid - topW);
    p.lineTo(xTail, mid - botW * 1.02);
    p.lineTo(xTail, mid + botW * 1.02);
    p.lineTo(x0, mid + topW);
    p.close();
    return p;
  }, [micX, mid]);

  const tailPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const x0 = micX.value + GR * 0.72;
    const x1 = x0 + LEN;
    const xTail = x1 - GR * 0.55;
    const botW = GR * 0.48;
    p.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(xTail, mid - botW * 0.82, x1 - xTail, botW * 1.64),
        GR * 0.16,
        GR * 0.16,
      ),
    );
    return p;
  }, [micX, mid]);

  const knurlPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const x0 = micX.value + GR * 0.72;
    const topW = GR * 0.68;
    p.addRect(Skia.XYWHRect(x0, mid - topW, GR * 0.34, topW * 2));
    return p;
  }, [micX, mid]);

  const knurlTicks = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const x0 = micX.value + GR * 0.72;
    const topW = GR * 0.68;
    for (let i = 0; i < 10; i++) {
      const ty = mid - topW + GR * 0.12 + i * GR * 0.19;
      if (ty > mid + topW - GR * 0.05) break;
      p.moveTo(x0 + GR * 0.04, ty);
      p.lineTo(x0 + GR * 0.3, ty);
    }
    return p;
  }, [micX, mid]);

  const brandPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const x0 = micX.value + GR * 0.72;
    const xTail = x0 + LEN - GR * 0.55;
    const botW = GR * 0.48;
    p.addRect(Skia.XYWHRect(x0 + (xTail - x0) * 0.48, mid - botW * 1.08, GR * 0.14, botW * 2.16));
    return p;
  }, [micX, mid]);

  const grillePath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.addCircle(micX.value, mid, GR);
    return p;
  }, [micX, mid]);

  // Fine crosshatch mesh — latitude AND longitude ovals, same as the static
  // mic illustration, rebuilt at the live grille centre.
  const meshPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const gx = micX.value;
    for (let i = 0; i < 7; i++) {
      const t = -0.78 + i * 0.26;
      const hh = GR * Math.sqrt(Math.max(0, 1 - t * t));
      p.addOval(Skia.XYWHRect(gx + GR * t - GR * 0.12, mid - hh, GR * 0.24, hh * 2));
    }
    for (let i = 0; i < 5; i++) {
      const t = -0.62 + i * 0.31;
      const hw = GR * Math.sqrt(Math.max(0, 1 - t * t));
      p.addOval(Skia.XYWHRect(gx - hw, mid + GR * t - GR * 0.11, hw * 2, GR * 0.22));
    }
    return p;
  }, [micX, mid]);

  const specBloom = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.addCircle(micX.value - GR * 0.34, mid - GR * 0.4, GR * 0.32);
    return p;
  }, [micX, mid]);
  const specCore = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.addCircle(micX.value - GR * 0.36, mid - GR * 0.42, GR * 0.12);
    return p;
  }, [micX, mid]);

  // Ripples: voice traveling mouth → mic (forward arcs, phase-continuous).
  const ripples = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const ph = phase.value;
    const maxR = Math.max(20, micX.value - GR - headX);
    for (let i = 0; i < 3; i++) {
      const f = (ph / (2 * Math.PI) + i / 3) % 1;
      const r = 6 + f * maxR;
      p.addArc({ x: headX - r, y: mid - r, width: 2 * r, height: 2 * r }, -56, 112);
    }
    return p;
  }, [phase, micX, headX, mid]);

  // Bass arcs: LF energy swelling at the capsule as the mic closes in.
  const bassArcs = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (warm.value <= 0.2) return p;
    const gx = micX.value;
    const pulse = 1 + 0.05 * Math.sin(phase.value * 2);
    for (let i = 1; i <= 3; i++) {
      const r = (10 + i * 8) * pulse;
      p.addArc({ x: gx - GR - r, y: mid - r, width: 2 * r, height: 2 * r }, 128, 104);
    }
    return p;
  }, [warm, micX, phase, mid]);
  const bassOp = useDerivedValue(() => Math.min(0.55, warm.value * 0.055), [warm]);
  const bassWidth = useDerivedValue(() => 1.4 + warm.value * 0.22, [warm]);
  // Warm LF glow at the capsule: radius carried BY THE PATH (rebuilt per
  // frame) so it grows and travels with the mic.
  const lfGlow = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.addCircle(micX.value - GR * 0.4, mid, 10 + warm.value * 2.4);
    return p;
  }, [micX, warm, mid]);
  const glowOp = useDerivedValue(() => Math.min(0.5, warm.value * 0.048), [warm]);

  // Gap annotation: a dimension line with end ticks, riding the eased mic.
  const dimLine = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const x0 = headX + 2;
    const x1 = micX.value - 12;
    const yD = mid + 42; // clear of the (now full-size) neck column
    if (x1 - x0 > 10) {
      p.moveTo(x0, yD - 5);
      p.lineTo(x0, yD + 5);
      p.moveTo(x0, yD);
      p.lineTo(x1, yD);
      p.moveTo(x1, yD - 5);
      p.lineTo(x1, yD + 5);
    }
    return p;
  }, [micX, headX, mid]);

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Floor w={w} y={h - 14} h={14} />
        <Path path={ripples} color="#ffffff" style="stroke" strokeWidth={1.2} opacity={0.3} />
        {/* LF emphasis: warm glow + swelling bass arcs at the capsule. */}
        <Path path={bassArcs} color="#ffb35e" style="stroke" strokeWidth={bassWidth} opacity={bassOp}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={lfGlow} color="#ff9b4d" opacity={glowOp}>
          <BlurMask blur={10} style="normal" />
        </Path>
        {/* The mic — every part a per-frame path in world coords. Vertical
            (x-invariant) gradients keep the metal sheen correct as it moves. */}
        <Path path={bodyPath}>
          <LinearGradient
            start={vec(0, mid - GR)}
            end={vec(0, mid + GR)}
            colors={[METAL_LO, METAL_HI, METAL_MID, METAL_LO]}
            positions={[0, 0.28, 0.55, 1]}
          />
        </Path>
        <Path path={brandPath} color={WAVE} opacity={0.5} />
        <Path path={tailPath}>
          <LinearGradient
            start={vec(0, mid - GR * 0.5)}
            end={vec(0, mid + GR * 0.5)}
            colors={['#23242b', '#585c68', '#1c1d23']}
            positions={[0, 0.32, 1]}
          />
        </Path>
        <Path path={knurlPath}>
          <LinearGradient
            start={vec(0, mid - GR * 0.68)}
            end={vec(0, mid + GR * 0.68)}
            colors={['#3a3c44', '#9ba0ac', '#33343c']}
          />
        </Path>
        <Path path={knurlTicks} color="#15161b" style="stroke" strokeWidth={0.5} opacity={0.8} />
        <Path path={grillePath}>
          <LinearGradient
            start={vec(0, mid - GR)}
            end={vec(0, mid + GR)}
            colors={['#dde0e7', '#8a8c94', '#33343c']}
          />
        </Path>
        <Path path={meshPath} color="#101116" style="stroke" strokeWidth={0.5} opacity={0.55} />
        <Path path={specBloom} color="#ffffff" opacity={0.45}>
          <BlurMask blur={GR * 0.3} style="normal" />
        </Path>
        <Path path={specCore} color="#ffffff" opacity={0.8} />
        {/* The singer, mouth toward the approaching mic — TRUE proportion. */}
        <ProfileHead x={headX} y={mid} angleRad={0} scale={headS} tint={CONE} speaking />
        <GlowStroke path={dimLine} color={ACCENT_GREEN} width={1.2} opacity={0.7} />
        <Vignette w={w} h={h} />
      </Canvas>
      {/* Gap readout (RN text — the annotation the dimension line points at). */}
      <RNText
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 1,
          textAlign: 'center',
          fontFamily: fonts.oswaldSemiBold,
          fontSize: 10.5,
          letterSpacing: 1.2,
          color: '#5bff85',
        }}
      >
        {`GAP ≈ ${inches} in${directional ? ` · LF +${boostDb} dB` : ' · OMNI — no LF rise'}`}
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Off-axis — the mic turned away from the source

/** Illustrative off-axis response: broadband polar loss + growing HF rolloff. */
export function offAxisDb(f: number, angleDeg: number): number {
  const th = (angleDeg * Math.PI) / 180;
  const broadband = 20 * Math.log10(Math.max(0.07, polarGain(0.5, 0.5, th)));
  const hfCut = -(angleDeg / 180) * 9; // extra HF loss, grows with angle
  const hfMix = f <= 2000 ? 0 : Math.min(1, Math.log2(f / 2000) / 3);
  return broadband + hfCut * hfMix;
}

export function OffAxisMicView({
  width,
  height = 96,
  angleDeg,
}: {
  width: number;
  height?: number;
  angleDeg: number;
}) {
  const w = width;
  const h = height;
  // Lifted slightly so the (properly proportioned) body clears the floor
  // strip when the mic is rotated to 90°.
  const mid = h * 0.46;
  const srcX = 24;
  const micX = w - 60;

  const arrow = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(srcX + 28, mid); // starts clear of the full-size nose
    p.lineTo(micX - 26, mid);
    p.moveTo(micX - 34, mid - 5);
    p.lineTo(micX - 26, mid);
    p.lineTo(micX - 34, mid + 5);
    return p;
  }, [srcX, micX, mid]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 10} h={10} />
      <GlowStroke path={arrow} color={WAVE} width={1.8} opacity={0.8} />
      {/* Talker in true proportion to the 45-px mic (crown crops by design). */}
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={headScaleForMic(7, 33)} tint={CONE} speaking />
      {/* Mic rotated: at 0° the grille faces the incoming sound (left).
          1.72·7 + 33 = 45 ≈ 3.2 × the 14-px grille diameter. */}
      <HandheldMic x={micX} y={mid} angleDeg={-90 + angleDeg} grilleR={7} bodyLen={33} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Pop filter — plosive bursts vs the barrier family

export const POP_MODES: { key: string; label: string; pass: number }[] = [
  { key: 'none', label: 'NO PROTECTION', pass: 1 },
  { key: 'pop', label: 'POP FILTER', pass: 0.3 },
  { key: 'foam', label: 'FOAM', pass: 0.5 },
  { key: 'blimp', label: 'SHOTGUN WINDSHIELD', pass: 0.12 },
];

export function PopFilterView({
  phase,
  width,
  height = 150,
  mode,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  mode: 'none' | 'pop' | 'foam' | 'blimp';
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const srcX = 24;
  // Pulled in so the properly proportioned body (grilleR 8 / bodyLen 37,
  // 3.2 : 1) still fits inside the canvas.
  const micX = w - 56;
  const barX = srcX + (micX - srcX) * 0.62;
  const pass = mode === 'none' ? 1 : mode === 'pop' ? 0.3 : mode === 'foam' ? 0.5 : 0.12;
  const gx = micX + 2; // grille center

  const gear = useMemo(() => {
    const hoop = Skia.Path.Make();
    const hoopMesh = Skia.Path.Make();
    const foam = Skia.Path.Make();
    const blimp = Skia.Path.Make();
    const blimpRibs = Skia.Path.Make();
    if (mode === 'pop') {
      // Hoop with visible mesh + gooseneck.
      hoop.addCircle(barX, mid, 26);
      hoop.addCircle(barX, mid, 22.5);
      for (let i = -3; i <= 3; i++) {
        const off = i * 6.4;
        const half = Math.sqrt(Math.max(0, 22.5 * 22.5 - off * off));
        hoopMesh.moveTo(barX + off, mid - half);
        hoopMesh.lineTo(barX + off, mid + half);
        hoopMesh.moveTo(barX - half, mid + off);
        hoopMesh.lineTo(barX + half, mid + off);
      }
      hoop.moveTo(barX, mid + 26);
      hoop.quadTo(barX + 4, mid + 44, barX + 18, h - 4); // gooseneck
    } else if (mode === 'foam') {
      // Sculpted foam windscreen hugging the grille: soft blobby silhouette.
      foam.moveTo(gx - 17, mid);
      foam.cubicTo(gx - 18, mid - 12, gx - 9, mid - 19, gx + 1, mid - 18);
      foam.cubicTo(gx + 11, mid - 19, gx + 18, mid - 11, gx + 17, mid - 1);
      foam.cubicTo(gx + 18, mid + 10, gx + 10, mid + 19, gx, mid + 18);
      foam.cubicTo(gx - 10, mid + 19, gx - 17, mid + 11, gx - 17, mid);
      foam.close();
    } else if (mode === 'blimp') {
      // Slotted blimp shell surrounding the whole mic.
      blimp.addRRect(Skia.RRectXY(Skia.XYWHRect(gx - 32, mid - 24, 60, 48), 24, 24));
      for (const t of [-0.55, 0, 0.55]) {
        blimpRibs.addOval(Skia.XYWHRect(gx - 32 + 6, mid + t * 24 - 3.4, 48, 6.8));
      }
    }
    return { hoop, hoopMesh, foam, blimp, blimpRibs };
  }, [srcX, micX, barX, mid, mode, gx, h]);

  // The sound itself (a small steady wave) ALWAYS passes — wind is the enemy.
  const sound = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = srcX + 12 + (i / N) * (micX - srcX - 20);
      const y = mid - 5 * Math.sin((i / N) * 2 * Math.PI * 3 - ph);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, srcX, micX, mid]);

  // Plosive puffs: a particle cluster launched each cycle; blocked at the
  // barrier (only `pass` of the energy continues, spread wider).
  const puffs = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const f = (ph / (2 * Math.PI)) % 1; // 0..1 along the flight
    const x = srcX + 12 + f * (micX - srcX - 16);
    const blockAt = mode === 'none' ? 1e9 : mode === 'pop' ? barX : micX - 12;
    for (let i = 0; i < 7; i++) {
      const spread = 4 + f * 18 + (i % 3) * 3;
      const yy = mid + (i - 3) * (spread / 3);
      if (x <= blockAt) {
        p.addCircle(x, yy, 2.2);
      } else {
        // Past the barrier: only a fraction continues (drawn smaller/fewer).
        if (i / 7 < pass) p.addCircle(x, yy, 1.6);
      }
    }
    return p;
  }, [phase, srcX, micX, barX, mid, mode, pass]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 12} h={12} />
      <GlowStroke path={sound} color={WAVE} width={1.6} opacity={0.6} />
      {/* Wind puffs: soft-glowing air, not sound. */}
      <Path path={puffs} color={ACCENT_BLUE} opacity={0.4}>
        <BlurMask blur={3.5} style="normal" />
      </Path>
      <Path path={puffs} color={ACCENT_BLUE} />
      {/* The talker firing the plosive — TRUE proportion to the mic. */}
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={headScaleForMic(8, 37)} tint={CONE} speaking />
      <HandheldMic x={gx} y={mid} angleDeg={-90} grilleR={8} bodyLen={37} />
      {mode === 'pop' ? (
        <>
          <Path path={gear.hoopMesh} color={PARTICLE} style="stroke" strokeWidth={0.8} opacity={0.4} />
          <Path path={gear.hoop} color={METAL_MID} style="stroke" strokeWidth={2}>
            <LinearGradient start={vec(barX - 26, mid - 26)} end={vec(barX + 26, mid + 26)} colors={[METAL_HI, METAL_LO]} />
          </Path>
        </>
      ) : null}
      {mode === 'foam' ? (
        <>
          <Path path={gear.foam} opacity={0.94}>
            <RadialGradient c={vec(gx - 6, mid - 7)} r={30} colors={['#4a4133', '#241f18']} />
          </Path>
          <Path path={gear.foam} color="#6b5f49" style="stroke" strokeWidth={1.4} opacity={0.8} />
        </>
      ) : null}
      {mode === 'blimp' ? (
        <>
          <Path path={gear.blimp} opacity={0.3}>
            <LinearGradient start={vec(gx - 32, mid - 24)} end={vec(gx + 28, mid + 24)} colors={[METAL_HI, METAL_LO]} />
          </Path>
          <Path path={gear.blimpRibs} color={PARTICLE} style="stroke" strokeWidth={1} opacity={0.45} />
          <Path path={gear.blimp} color={METAL_MID} style="stroke" strokeWidth={1.8} />
        </>
      ) : null}
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 · Shock mount — vibration up the stand

/**
 * HANDLING NOISE — rebuilt 2026-07-29 (owner: "make the entire animation way
 * better especially the detail of the mic and shockmount. The green animation
 * is confusing since the mic is supposed to be moving minimally, and the stand
 * below is moving, but the green animation is wobbling around the mic").
 *
 * WHAT THE SCENE NOW SHOWS
 *  • A properly detailed studio mic (head basket with crosshatch mesh, body,
 *    badge band) held in a REAL elastic cradle: an outer suspension ring on a
 *    yoke, with visible tensioned bands anchored ring → mic body.
 *  • The PHYSICS is legible. The STAND always shakes by the full ±AMP. With
 *    the SHOCK MOUNT the ring shakes WITH the stand while the mic body stays
 *    nearly still, so the BANDS STRETCH AND BOW — you watch the elastic absorb
 *    the motion. RIGID swaps the cradle for a hard clip and the shake goes
 *    straight into the body: the mic moves with the stand.
 *  • The confusing green wobble halo around the mic is GONE. Transmitted
 *    vibration is now read WHERE IT ACTUALLY IS: an excursion track with a
 *    live marker and a peak-to-peak bar at the STAND, and a second one at the
 *    CAPSULE. "Lots of shake down here, almost none up there" (shock mount)
 *    vs "the same shake all the way up" (rigid) — no halo anywhere.
 */
export function ShockMountView({
  phase,
  width,
  height = 216,
  shockMount,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  shockMount: boolean;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  // Fraction of the stand's motion that reaches the mic. IDENTICAL to the
  // host screen's "VIBRATION TRANSMITTED INTO THE MIC" meter (0.15 / 0.9).
  const damp = shockMount ? 0.15 : 0.9;
  const AMP = 6; // stand excursion, px

  // ── Fixed scene geometry ─────────────────────────────────────────────────
  const CAP_TRACK_Y = 22; // capsule excursion readout
  const MIC_TOP = 38;
  const BASKET_BOT = 70;
  const MIC_BOT = 128;
  const MIC_HW = 11; // body half-width
  const RING_CY = 98;
  const RING_RX = 36;
  const RING_RY = 28;
  const CLUTCH_Y = 140;
  const SHAFT_TOP = 156;
  const FLOOR_Y = 182;
  const STAND_TRACK_Y = 196;

  // Stand: tripod + shaft, riding the FULL excursion.
  const standPath = useDerivedValue(() => {
    'worklet';
    const o = AMP * Math.sin(phase.value * 1.9);
    const p = Skia.Path.Make();
    p.moveTo(cx + o, SHAFT_TOP);
    p.lineTo(cx + o, FLOOR_Y - 16);
    p.moveTo(cx + o - 30, FLOOR_Y);
    p.lineTo(cx + o, FLOOR_Y - 16);
    p.lineTo(cx + o + 30, FLOOR_Y);
    p.moveTo(cx + o - 16, FLOOR_Y - 8);
    p.lineTo(cx + o, FLOOR_Y - 16);
    p.lineTo(cx + o + 16, FLOOR_Y - 8);
    return p;
  }, [phase, cx]);

  // Clutch collar (the knurled twist-lock on the shaft) — moves with the stand.
  const clutchPath = useDerivedValue(() => {
    'worklet';
    const o = AMP * Math.sin(phase.value * 1.9);
    const p = Skia.Path.Make();
    p.addRRect(
      Skia.RRectXY(Skia.XYWHRect(cx + o - 9, CLUTCH_Y, 18, SHAFT_TOP - CLUTCH_Y + 2), 3, 3),
    );
    return p;
  }, [phase, cx]);

  // Cradle: suspension ring + yoke arms (shock mount), or a hard clip (rigid).
  const mountPath = useDerivedValue(() => {
    'worklet';
    const o = AMP * Math.sin(phase.value * 1.9);
    const p = Skia.Path.Make();
    if (shockMount) {
      p.addOval(
        Skia.XYWHRect(cx + o - RING_RX, RING_CY - RING_RY, RING_RX * 2, RING_RY * 2),
      );
      // Yoke: both arms from the ring's lower flanks down to the clutch.
      p.moveTo(cx + o - RING_RX * 0.82, RING_CY + RING_RY * 0.56);
      p.quadTo(cx + o - 22, CLUTCH_Y - 6, cx + o - 7, CLUTCH_Y);
      p.moveTo(cx + o + RING_RX * 0.82, RING_CY + RING_RY * 0.56);
      p.quadTo(cx + o + 22, CLUTCH_Y - 6, cx + o + 7, CLUTCH_Y);
    } else {
      // Rigid clip: a hard bracket bolting the body straight to the clutch.
      p.addRRect(
        Skia.RRectXY(Skia.XYWHRect(cx + o - MIC_HW - 5, RING_CY - 12, (MIC_HW + 5) * 2, 24), 4, 4),
      );
      p.moveTo(cx + o, RING_CY + 12);
      p.lineTo(cx + o, CLUTCH_Y);
    }
    return p;
  }, [phase, cx, shockMount]);

  // THE ELASTIC: each band runs from a RING anchor (moving with the stand) to
  // a BODY anchor (nearly still). The difference is drawn as a bowed quad, so
  // the band visibly stretches and slackens through the cycle.
  const bandsPath = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    if (!shockMount) return p;
    const o = AMP * Math.sin(phase.value * 1.9);
    const m = o * damp;
    for (const t of [-0.86, -0.3, 0.3, 0.86]) {
      const by = RING_CY + t * RING_RY * 0.82;
      const edge = RING_RX * Math.sqrt(Math.max(0, 1 - Math.pow((by - RING_CY) / RING_RY, 2)));
      for (const sgn of [-1, 1]) {
        const rx = cx + o + sgn * edge;
        const mx = cx + m + sgn * MIC_HW;
        // Bow the band away from the straight line by the mismatch — the
        // elastic visibly takes up the motion the mic never receives.
        const bow = (o - m) * 0.55;
        p.moveTo(rx, by);
        p.quadTo((rx + mx) / 2, by + bow, mx, by);
      }
    }
    return p;
  }, [phase, cx, shockMount, damp]);

  // ── The mic itself: basket + body + badge, riding `damp` of the shake ─────
  const micBody = useDerivedValue(() => {
    'worklet';
    const m = AMP * Math.sin(phase.value * 1.9) * damp;
    const p = Skia.Path.Make();
    p.addRRect(
      Skia.RRectXY(Skia.XYWHRect(cx + m - MIC_HW, BASKET_BOT - 6, MIC_HW * 2, MIC_BOT - BASKET_BOT + 6), 4, 4),
    );
    return p;
  }, [phase, cx, damp]);

  const micBasket = useDerivedValue(() => {
    'worklet';
    const m = AMP * Math.sin(phase.value * 1.9) * damp;
    const p = Skia.Path.Make();
    p.addRRect(
      Skia.RRectXY(Skia.XYWHRect(cx + m - 14, MIC_TOP, 28, BASKET_BOT - MIC_TOP), 13, 11),
    );
    return p;
  }, [phase, cx, damp]);

  const micMesh = useDerivedValue(() => {
    'worklet';
    const m = AMP * Math.sin(phase.value * 1.9) * damp;
    const p = Skia.Path.Make();
    const cyB = (MIC_TOP + BASKET_BOT) / 2;
    const ry = (BASKET_BOT - MIC_TOP) / 2 - 2;
    for (let i = -3; i <= 3; i++) {
      const yy = cyB + (i / 3.6) * ry;
      const hw = 12 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - cyB) / (ry + 2), 2)));
      p.moveTo(cx + m - hw, yy);
      p.lineTo(cx + m + hw, yy);
    }
    for (let i = -2; i <= 2; i++) {
      const xx = cx + m + (i / 2.6) * 12;
      const hh = ry * Math.sqrt(Math.max(0, 1 - Math.pow((xx - cx - m) / 13, 2)));
      p.moveTo(xx, cyB - hh);
      p.lineTo(xx, cyB + hh);
    }
    return p;
  }, [phase, cx, damp]);

  const micBadge = useDerivedValue(() => {
    'worklet';
    const m = AMP * Math.sin(phase.value * 1.9) * damp;
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(cx + m - MIC_HW, BASKET_BOT + 8, MIC_HW * 2, 3));
    p.addRect(Skia.XYWHRect(cx + m - MIC_HW, MIC_BOT - 12, MIC_HW * 2, 2));
    return p;
  }, [phase, cx, damp]);

  // ── TRANSMITTED-VIBRATION READOUT (replaces the green wobble halo) ────────
  // Static: two excursion tracks with a peak-to-peak bar sized by what each
  // point actually receives — the stand's bar is full width, the capsule's is
  // `damp` of it. Per-frame: a live marker on each track.
  const tracks = useMemo(() => {
    const p = Skia.Path.Make();
    for (const [ty, half] of [
      [CAP_TRACK_Y, AMP + 7],
      [STAND_TRACK_Y, AMP + 7],
    ] as const) {
      p.moveTo(cx - half, ty);
      p.lineTo(cx + half, ty);
      p.moveTo(cx - half, ty - 4);
      p.lineTo(cx - half, ty + 4);
      p.moveTo(cx + half, ty - 4);
      p.lineTo(cx + half, ty + 4);
      p.moveTo(cx, ty - 3); // rest position
      p.lineTo(cx, ty + 3);
    }
    return p;
  }, [cx]);
  const capBar = useMemo(() => {
    const p = Skia.Path.Make();
    const half = Math.max(0.6, AMP * damp);
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - half, CAP_TRACK_Y - 8, half * 2, 5), 2, 2));
    return p;
  }, [cx, damp]);
  const standBar = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - AMP, STAND_TRACK_Y - 8, AMP * 2, 5), 2, 2));
    return p;
  }, [cx]);
  const capMarker = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    p.addCircle(cx + AMP * Math.sin(phase.value * 1.9) * damp, CAP_TRACK_Y, 3.2);
    return p;
  }, [phase, cx, damp]);
  const standMarker = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    p.addCircle(cx + AMP * Math.sin(phase.value * 1.9), STAND_TRACK_Y, 3.2);
    return p;
  }, [phase, cx]);
  // Where the shake is injected: arrows at the foot of the stand.
  const arrows = useMemo(() => {
    const p = Skia.Path.Make();
    for (const s of [-1, 1]) {
      p.moveTo(cx + s * 46, FLOOR_Y - 12);
      p.lineTo(cx + s * 34, FLOOR_Y - 8);
      p.moveTo(cx + s * 46, FLOOR_Y - 4);
      p.lineTo(cx + s * 34, FLOOR_Y - 8);
    }
    return p;
  }, [cx]);

  const capColor = shockMount ? ACCENT_GREEN : ACCENT_RED;
  const pct = Math.round(damp * 100);
  const label = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    textAlign: 'center' as const,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
  };

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ position: 'absolute', width: w, height: h, backgroundColor: BG }}>
        <Floor w={w} y={FLOOR_Y} h={h - FLOOR_Y} />
        {/* The shake is applied HERE — at the floor. */}
        <GlowStroke path={arrows} color={ACCENT_RED} width={2} opacity={0.9} />
        {/* Stand: tripod + shaft + clutch, at full excursion. */}
        <Path
          path={standPath}
          color={METAL_MID}
          style="stroke"
          strokeWidth={5}
          strokeJoin="round"
          strokeCap="round"
        />
        <Path path={clutchPath} color="#5c606c" />
        <Path path={clutchPath} color="#9ba0ac" style="stroke" strokeWidth={1.1} />
        {/* Cradle / clip. */}
        <Path
          path={mountPath}
          color="#8e93a1"
          style="stroke"
          strokeWidth={2.6}
          strokeJoin="round"
          strokeCap="round"
        />
        {/* The elastic bands — they stretch and bow as the ring moves and the
            mic does not. This is the shock mount actually working. */}
        <Path path={bandsPath} color={WAVE} style="stroke" strokeWidth={3.4} opacity={0.22}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={bandsPath} color={WAVE} style="stroke" strokeWidth={1.5} strokeCap="round" />
        {/* The mic. */}
        <Path path={micBody}>
          <LinearGradient
            start={vec(cx - MIC_HW, 0)}
            end={vec(cx + MIC_HW, 0)}
            colors={[METAL_LO, METAL_HI, METAL_MID, METAL_LO]}
            positions={[0, 0.3, 0.58, 1]}
          />
        </Path>
        <Path path={micBasket}>
          <LinearGradient
            start={vec(cx - 14, 0)}
            end={vec(cx + 14, 0)}
            colors={['#4a4e5a', '#a8adba', '#2a2c34']}
            positions={[0, 0.32, 1]}
          />
        </Path>
        <Path path={micMesh} color="#12131a" style="stroke" strokeWidth={0.8} opacity={0.6} />
        <Path path={micBasket} color="#c3c8d4" style="stroke" strokeWidth={1.2} opacity={0.8} />
        <Path path={micBadge} color={WAVE} opacity={0.55} />
        <Path path={micBody} color="#666b78" style="stroke" strokeWidth={1} opacity={0.8} />
        {/* Transmitted-vibration readout: peak-to-peak bars + live markers. */}
        <Path path={tracks} color="#4b4e58" style="stroke" strokeWidth={1.2} />
        <Path path={capBar} color={capColor} opacity={0.55} />
        <Path path={standBar} color={ACCENT_RED} opacity={0.55} />
        <Path path={capMarker} color={capColor} opacity={0.4}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={capMarker} color={capColor} />
        <Path path={standMarker} color={ACCENT_RED} opacity={0.4}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={standMarker} color={ACCENT_RED} />
        <Vignette w={w} h={h} />
      </Canvas>
      <RNText style={[label, { top: 3, color: capColor }]}>
        {`AT THE CAPSULE — ${pct}% OF THE SHAKE`}
      </RNText>
      <RNText style={[label, { top: h - 15, color: ACCENT_RED }]}>
        STAND SHAKE — 100% (THE SOURCE)
      </RNText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 · Stereo techniques — XY · ORTF · AB · Mid-Side

export type StereoTech = 'xy' | 'ortf' | 'ab' | 'ms';

/** One capsule of a stereo pair: position, aim (lab convention — 0° points up,
 *  front = (sin θ, −cos θ)) and its first-order polar coefficients. */
type StereoCapsule = { x: number; y: number; angDeg: number; a: number; b: number };

export function StereoTechniqueView({
  width,
  height = 200,
  tech,
}: {
  width: number;
  height?: number;
  tech: StereoTech;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h * 0.72;
  // The stage is now a real DECK with a front LIP (owner 2026-07-29: it had
  // almost no contrast against the background). Deck value ≫ field value, and
  // the lip gives it a physical edge you read instantly.
  const DECK_H = 28;
  const LIP_H = 6;
  const fieldY0 = DECK_H + LIP_H;

  const layout = useMemo(() => {
    const R = h * 0.5;
    const caps: StereoCapsule[] = [];
    const wedges: SkPathT[] = [];
    const chrome = Skia.Path.Make();
    const lobes: { x: number; y: number; r: number }[] = [];
    const wedge = (x: number, y: number, angDeg: number, spreadDeg: number) => {
      const p = Skia.Path.Make();
      p.moveTo(x, y);
      const a0 = ((angDeg - spreadDeg / 2 - 90) * Math.PI) / 180;
      const a1 = ((angDeg + spreadDeg / 2 - 90) * Math.PI) / 180;
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const a = a0 + ((a1 - a0) * i) / N;
        p.lineTo(x + R * Math.cos(a), y + R * Math.sin(a));
      }
      p.close();
      wedges.push(p);
    };
    const CARD = { a: 0.5, b: 0.5 };
    if (tech === 'xy') {
      caps.push({ x: cx, y: cy, angDeg: -45, ...CARD }, { x: cx, y: cy, angDeg: 45, ...CARD });
      wedge(cx, cy, -45, 70);
      wedge(cx, cy, 45, 70);
    } else if (tech === 'ortf') {
      caps.push(
        { x: cx - 20, y: cy, angDeg: -55, ...CARD },
        { x: cx + 20, y: cy, angDeg: 55, ...CARD },
      );
      wedge(cx - 20, cy, -55, 70);
      wedge(cx + 20, cy, 55, 70);
      // Spacing bracket (≈17 cm).
      chrome.moveTo(cx - 20, cy + 22);
      chrome.lineTo(cx + 20, cy + 22);
      chrome.moveTo(cx - 20, cy + 18);
      chrome.lineTo(cx - 20, cy + 26);
      chrome.moveTo(cx + 20, cy + 18);
      chrome.lineTo(cx + 20, cy + 26);
    } else if (tech === 'ab') {
      // Spaced OMNIS — a = 1, b = 0.
      caps.push(
        { x: cx - 62, y: cy, angDeg: 0, a: 1, b: 0 },
        { x: cx + 62, y: cy, angDeg: 0, a: 1, b: 0 },
      );
      wedge(cx - 62, cy, 0, 80);
      wedge(cx + 62, cy, 0, 80);
      chrome.moveTo(cx - 62, cy + 22);
      chrome.lineTo(cx + 62, cy + 22);
      chrome.moveTo(cx - 62, cy + 18);
      chrome.lineTo(cx - 62, cy + 26);
      chrome.moveTo(cx + 62, cy + 18);
      chrome.lineTo(cx + 62, cy + 26);
    } else {
      // Mid-Side: cardioid forward + figure-8 sideways at one point.
      caps.push(
        { x: cx, y: cy - 6, angDeg: 0, ...CARD },
        { x: cx, y: cy + 6, angDeg: 90, a: 0, b: 1 },
      );
      wedge(cx, cy - 6, 0, 80);
      lobes.push({ x: cx - 26, y: cy + 10, r: 22 }, { x: cx + 26, y: cy + 10, r: 22 });
      // The side (figure-8) element: a small horizontal capsule.
      chrome.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 14, cy + 6, 28, 8), 4, 4));
    }
    // Mic bodies to draw (MS draws only the mid capsule as a pencil mic).
    const mics = tech === 'ms' ? [caps[0]] : caps;
    return { caps, mics, wedges, chrome, lobes, R };
  }, [cx, cy, h, tech]);

  // ── PICKUP FIELD radiating from the PAIR (owner 2026-07-29) ───────────────
  // Same machinery as every other heat map in this file: the two capsules'
  // first-order polar gains × 1/d, summed for the technique's actual geometry,
  // quantized into ≤32 jet buckets, run-length merged per row, memoized.
  // ILLUSTRATIVE — a conceptual pickup field, never a measured response.
  const field = useMemo(() => {
    const bucketPaths: SkPathT[] = Array.from({ length: JET_BUCKET_COUNT }, () => Skia.Path.Make());
    const COLS = 160;
    const ROWS = 120;
    const cw = w / COLS;
    const ch = (h - fieldY0) / ROWS;
    const refD = h * 0.3;
    const src = layout.caps.map((c) => {
      const th = (c.angDeg * Math.PI) / 180;
      return { x: c.x, y: c.y, ax: Math.sin(th), ay: -Math.cos(th), a: c.a, b: c.b };
    });
    for (let r = 0; r < ROWS; r++) {
      const py = fieldY0 + (r + 0.5) * ch;
      addFieldRow(bucketPaths, COLS, 0, fieldY0 + r * ch, cw, ch, (c) => {
        const px = (c + 0.5) * cw;
        let lvl = 0;
        for (let k = 0; k < src.length; k++) {
          const s = src[k];
          const vx = px - s.x;
          const vy = py - s.y;
          let d = Math.sqrt(vx * vx + vy * vy);
          if (d < 12) d = 12;
          const cosT = (vx * s.ax + vy * s.ay) / d;
          // θ from THIS capsule's front axis → the same |A + B·cosθ| family.
          lvl += Math.abs(s.a + s.b * (cosT < -1 ? -1 : cosT > 1 ? 1 : cosT)) * (refD / d);
        }
        return Math.round(fieldT(lvl) * (JET_BUCKET_COUNT - 1));
      });
    }
    return bucketPaths;
  }, [w, h, fieldY0, layout.caps]);

  const deck = useMemo(() => {
    const board = Skia.Path.Make();
    board.addRect(Skia.XYWHRect(0, 0, w, DECK_H));
    const lip = Skia.Path.Make();
    lip.addRect(Skia.XYWHRect(0, DECK_H, w, LIP_H));
    const planks = Skia.Path.Make();
    for (let i = 1; i < 8; i++) {
      planks.moveTo((i / 8) * w, 2);
      planks.lineTo((i / 8) * w, DECK_H - 1);
    }
    const shadow = Skia.Path.Make();
    shadow.addRect(Skia.XYWHRect(0, DECK_H + LIP_H, w, 9));
    return { board, lip, planks, shadow };
  }, [w]);
  const performers = useMemo(() => {
    const p = Skia.Path.Make();
    for (const fx of [0.3, 0.5, 0.7]) appendBust(p, w * fx, DECK_H - 2, 1.2);
    return p;
  }, [w]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Conceptual pickup FIELD from the pair — ≤32 quantized jet buckets. */}
      {field.map((p, i) => (
        <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.92} />
      ))}
      {/* THE STAGE: a lit deck, a defined front lip, and a cast shadow — a
          different value from the field, so it reads instantly. */}
      <Path path={deck.shadow}>
        <LinearGradient
          start={vec(0, DECK_H + LIP_H)}
          end={vec(0, DECK_H + LIP_H + 9)}
          colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0)']}
        />
      </Path>
      <Path path={deck.board}>
        <LinearGradient start={vec(0, 0)} end={vec(0, DECK_H)} colors={['#3b4252', '#232833']} />
      </Path>
      <Path path={deck.planks} color="#161a22" style="stroke" strokeWidth={1} opacity={0.5} />
      {/* Performers, in the same line-art language as the head icons. */}
      <LineBusts path={performers} stroke={LINE} sw={1.5} />
      <Path path={deck.lip}>
        <LinearGradient
          start={vec(0, DECK_H)}
          end={vec(0, DECK_H + LIP_H)}
          colors={['#6d778f', '#3a4152']}
        />
      </Path>
      <SkLine p1={{ x: 0, y: DECK_H }} p2={{ x: w, y: DECK_H }} color="#9aa4bb" strokeWidth={1.2} />
      <SkLine
        p1={{ x: 0, y: DECK_H + LIP_H }}
        p2={{ x: w, y: DECK_H + LIP_H }}
        color="#11131a"
        strokeWidth={1.4}
      />
      {/* Nominal acceptance angle: a thin edge cue over the field. */}
      {layout.wedges.map((wd, i) => (
        <Path key={`s${i}`} path={wd} color={WAVE} style="stroke" strokeWidth={1.1} opacity={0.45} />
      ))}
      {/* Mid-Side fig-8 lobes. */}
      {layout.lobes.map((lb, i) => (
        <Circle
          key={`l${i}`}
          cx={lb.x}
          cy={lb.y}
          r={lb.r}
          color={ACCENT_BLUE}
          style="stroke"
          strokeWidth={1.2}
          opacity={0.55}
        />
      ))}
      <Path path={layout.chrome} color={CONE} style="stroke" strokeWidth={2} />
      {layout.mics.map((m, i) => (
        <PencilMic key={i} x={m.x} y={m.y} angleDeg={m.angDeg} scale={1.1} />
      ))}
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 · Hand placement — mic · polar · response, synchronized (the cupping star)

// ── Grip-zone geometry (owner defect ruling 2026-07-29) ─────────────────────
// The zone thresholds below are DERIVED from the drawn geometry, not chosen,
// so every zone label is true by construction. All values are canvas px in
// HandPlacementView's fixed 216-px-tall panel.
//
//   MIC — properly proportioned handheld (was ~5.6× its grille diameter):
//     grille radius        GRIP_GR      = 15   → grille DIAMETER 30
//     body length          GRIP_LEN     = 70
//     total drawn length   1.72·GR + LEN = 95.8 ≈ 3.20 × 30  ✅ SM58-class
//     grille ball centre   GRIP_GRILLE_Y = 73   (apex at 58, panel-centred)
//     grille RIM (the grille/body joint, where the knurled ring sits)
//                          GRIP_RIM_Y   = 73 + 15·0.72 = 83.8
//     tail end             GRIP_BOT_Y   = 83.8 + 70    = 153.8
//
//   HAND — the canonical hand at GRIP_HAND_S = 1.11:
//     silhouette height    HAND_H·s = 36.5 · 1.11 = 40.5 px
//                          = 58 % of the 70-px body  ✅ (a real hand spans
//                            most of the handle)
//     top edge   handTop(yC) = yC + HAND_TOP·s = yC − 19.43
//     bottom edge handBot(yC) = yC + HAND_BOT·s = yC + 21.09
//
//   TRAVEL — pos01 0…1 moves the grip centre yC linearly between two real
//   physical end states:
//     pos01 = 0 → the hand RESTS ON THE TAIL:  handBot = GRIP_BOT_Y − 2
//                 ⇒ yC_LOW = 153.8 − 2 − 21.09 = 130.71
//     pos01 = 1 → the hand is CENTRED ON THE GRILLE BALL: yC_TOP = 73
//     yC(p) = 130.71 − 57.71·p
//
//   CLEARANCE — the gap between the top of the hand and the grille rim:
//     clearance(p) = handTop(p) − GRIP_RIM_Y = 27.48 − 57.71·p
//     clearance(0) = 27.48 px  (all the slack a 58 %-coverage hand has)
//
//   ZONES, each an actual geometric event:
//     LOW HANDLE  clearance > 13.74 (more than HALF the slack left)
//                 ⇒ p < 0.238  →  GRIP_P_CORRECT = 0.24
//     CORRECT     0 < clearance ≤ 13.74 — the hand is FULLY on the body with
//                 its TOP EDGE just below the rim, touching nothing
//                 ⇒ 0.24 ≤ p < 0.476  →  GRIP_P_RIM = 0.48
//     PARTIAL CUP clearance ≤ 0 — the top of the hand has REACHED the rim and
//                 fingertips now overlap the grille ball
//                 ⇒ 0.48 ≤ p < 0.813  →  GRIP_P_FULL = 0.81
//     FULL CUP    the grip CENTRE is at/above the rim (yC ≤ 83.8) — the hand
//                 mass is around the ball
//                 ⇒ p ≥ 0.81
//
//   Sanity (the check the old numbers failed):
//     p = 0.35 (the default) → yC = 110.5, handTop = 91.1 = 7.3 px BELOW the
//     rim on a 70-px body — i.e. genuinely "just below the grille". The old
//     scheme put its "CORRECT" hand 102 px below the rim.
export const GRIP_GR = 15;
export const GRIP_LEN = 70;
export const GRIP_GRILLE_Y = 73;
export const GRIP_RIM_Y = GRIP_GRILLE_Y + GRIP_GR * 0.72;
export const GRIP_BOT_Y = GRIP_RIM_Y + GRIP_LEN;
/** Hand scale: cover 58 % of the body (0.58 · 70 / 36.5 ≈ 1.11). */
export const GRIP_HAND_S = (0.58 * GRIP_LEN) / HAND_H;
const GRIP_YC_LOW = GRIP_BOT_Y - 2 - HAND_BOT * GRIP_HAND_S;
const GRIP_YC_TOP = GRIP_GRILLE_Y;
/** pos01 → grip-centre y in the hand panel (the single source of truth). */
export function gripCentreY(pos01: number): number {
  const t = Math.max(0, Math.min(1, pos01));
  return GRIP_YC_LOW + t * (GRIP_YC_TOP - GRIP_YC_LOW);
}
/** LOW HANDLE → CORRECT: half the available clearance is used up. */
export const GRIP_P_CORRECT = 0.24;
/** CORRECT → PARTIAL CUP: the hand's TOP EDGE reaches the grille rim. */
export const GRIP_P_RIM = 0.48;
/** PARTIAL → FULL CUP: the grip CENTRE reaches the rim (hand around the ball). */
export const GRIP_P_FULL = 0.81;
/** The default/showcase grip — centred in the CORRECT band. */
export const GRIP_P_DEFAULT = 0.35;

/** Morph params for a hand at pos01 (0 = bottom of the handle … 1 = full
 *  cup over the grille). SEMANTICS UNCHANGED — only the interference ONSET
 *  moved: acoustic collapse now begins at GRIP_P_RIM, i.e. exactly when the
 *  drawn hand geometrically reaches the grille rim, so the physics and the
 *  picture agree (defect ruling 2026-07-29). `sever` still runs 0 → 1 from
 *  that onset to a full cup, and drives the same pattern/response laws. */
export function cupMorph(pos01: number): { a: number; b: number; ripple: number; sever: number } {
  const t = Math.max(0, Math.min(1, pos01));
  const c = Math.max(0, (t - GRIP_P_RIM) / (1 - GRIP_P_RIM)); // onset AT the rim
  const b = 0.5 - 0.45 * c; // cardioid → omni-ish
  const a = 1 - b;
  // Irregularity peaks at the PARTIAL cup, settles as the cup completes.
  const ripple = 0.2 * Math.sin(Math.PI * Math.min(1, c * 1.35));
  return { a, b, ripple, sever: c };
}

/** Illustrative cupped-mic response: flat → peaks/dips as ports block. */
export function cupResponseDb(f: number, pos01: number): number {
  const { sever } = cupMorph(pos01);
  if (sever <= 0) return 0;
  const g = (fc: number, oct: number) => Math.exp(-Math.pow(Math.log2(f / fc) / oct, 2));
  return sever * (7 * g(900, 0.7) - 8 * g(3000, 0.6) + 6 * g(5500, 0.5) - 4 * g(12000, 0.8));
}

export function HandPlacementView({
  width,
  pos01,
}: {
  width: number;
  /** 0 = hand resting on the TAIL of the handle … 1 = hand centred on the
   *  grille ball. Zone thresholds are DERIVED from the drawn geometry — see
   *  the grip-zone block above: <GRIP_P_CORRECT low handle (neutral) ·
   *  <GRIP_P_RIM correct, hand's top edge just below the rim (green) ·
   *  <GRIP_P_FULL partial cup, fingers overlapping the rim (orange) ·
   *  ≥GRIP_P_FULL full cup (red). */
  pos01: number;
}) {
  const w = width;
  const h = 216;
  const micX = w * 0.17;
  const { a, b, ripple } = cupMorph(pos01);
  const grilleY = GRIP_GRILLE_Y;

  // Panel 1 — the hand rides the handle. yC comes from gripCentreY(), the
  // single source of truth the zone thresholds were solved against.
  const yC = gripCentreY(pos01);
  const cupArc = useMemo(() => {
    const p = Skia.Path.Make();
    if (pos01 >= GRIP_P_FULL) {
      const r = GRIP_GR + 6;
      p.addArc({ x: micX - r, y: grilleY - r, width: 2 * r, height: 2 * r }, 200, 140);
    }
    return p;
  }, [micX, grilleY, pos01]);

  // Panel 2 — the polar pattern (top right). pR sized so gain+ripple (≤1.2)
  // never clips the canvas top.
  const pcx = w * 0.63;
  const pcy = h * 0.28;
  const pR = h * 0.22;
  const polar = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 150; i++) {
      const th = (i / 150) * 2 * Math.PI;
      const r = pR * Math.max(0.04, polarGain(a, b, th) + ripple * Math.cos(3 * th));
      const x = pcx + r * Math.sin(th);
      const y = pcy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [pcx, pcy, pR, a, b, ripple]);
  const polarRef = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * 2 * Math.PI;
      const r = pR * polarGain(0.5, 0.5, th);
      const x = pcx + r * Math.sin(th);
      const y = pcy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [pcx, pcy, pR]);

  // Panel 3 — the response curve (bottom right).
  const ry0 = h * 0.58;
  const rh = h * 0.36;
  const rx0 = w * 0.38;
  const rw = w * 0.58;
  const { resp, respUnder } = useMemo(() => {
    const c = Skia.Path.Make();
    const u = Skia.Path.Make();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const f = 40 * Math.pow(400, i / N); // 40 Hz … 16 kHz
      const db = cupResponseDb(f, pos01);
      const y = ry0 + rh / 2 - (db / 10) * (rh / 2.4);
      const x = rx0 + (i / N) * rw;
      if (i === 0) {
        c.moveTo(x, y);
        u.moveTo(x, y);
      } else {
        c.lineTo(x, y);
        u.lineTo(x, y);
      }
    }
    u.lineTo(rx0 + rw, ry0 + rh);
    u.lineTo(rx0, ry0 + rh);
    u.close();
    return { resp: c, respUnder: u };
  }, [rx0, rw, ry0, rh, pos01]);

  // Zone tints use the DERIVED thresholds (same numbers as zoneAt() in the
  // host screen): low handle = neutral blue · top edge just below the rim =
  // the CORRECT green zone · fingers overlapping the rim = orange partial
  // cup · hand around the ball = red full cup.
  const zoneTint =
    pos01 < GRIP_P_CORRECT
      ? ACCENT_BLUE
      : pos01 < GRIP_P_RIM
        ? ACCENT_GREEN
        : pos01 < GRIP_P_FULL
          ? ACCENT_ORANGE
          : ACCENT_RED;
  const liveColor = pos01 < GRIP_P_RIM ? WAVE : pos01 < GRIP_P_FULL ? ACCENT_ORANGE : ACCENT_RED;

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Panel frames. */}
      <SkLine p1={{ x: w * 0.34, y: 8 }} p2={{ x: w * 0.34, y: h - 8 }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: w * 0.36, y: h * 0.53 }} p2={{ x: w - 6, y: h * 0.53 }} color={GHOST} strokeWidth={1.4} />
      {/* 1 · The mic and the gripping hand — palm BEHIND the body, fingers
          wrapping in front. */}
      <GripHand x={micX} y={yC} scale={GRIP_HAND_S} tint={zoneTint} layer="back" />
      <HandheldMic x={micX} y={grilleY} angleDeg={0} grilleR={GRIP_GR} bodyLen={GRIP_LEN} />
      <GripHand x={micX} y={yC} scale={GRIP_HAND_S} tint={zoneTint} layer="front" />
      <GlowStroke path={cupArc} color={ACCENT_RED} width={5} opacity={0.9} />
      {/* 2 · Polar: intended (ghost) vs current, gradient-filled. */}
      <Path path={polarRef} color={GHOST} style="stroke" strokeWidth={1.6} />
      <Path path={polar}>
        <RadialGradient c={vec(pcx, pcy)} r={pR * 1.2} colors={[withAlpha(liveColor, 0.24), withAlpha(liveColor, 0.02)]} />
      </Path>
      <GlowStroke path={polar} color={liveColor} width={2.2} />
      {/* 3 · Response: reference zero + current with underfill. */}
      <SkLine p1={{ x: rx0, y: ry0 + rh / 2 }} p2={{ x: rx0 + rw, y: ry0 + rh / 2 }} color={GRID} strokeWidth={1.2} />
      <Path path={respUnder}>
        <LinearGradient start={vec(0, ry0)} end={vec(0, ry0 + rh)} colors={[withAlpha(liveColor, 0.2), withAlpha(liveColor, 0.02)]} />
      </Path>
      <GlowStroke path={resp} color={liveColor} width={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8b · Why it happens — the pressure-gradient cutaway

export function MicCutawayView({
  phase,
  width,
  height = 150,
  blocked,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  blocked: boolean;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const capY = 44;

  const shellPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 46, capY - 26, 92, 62), 14, 14));
    return p;
  }, [cx, capY]);

  const innards = useMemo(() => {
    const p = Skia.Path.Make();
    // Rear ports (the slots that make it directional).
    for (const dx of [-38, 38]) {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + dx - 2, capY + 14, 4, 14), 2, 2));
    }
    // Internal acoustic path hint.
    p.moveTo(cx - 34, capY + 20);
    p.lineTo(cx - 8, capY - 4);
    p.moveTo(cx + 34, capY + 20);
    p.lineTo(cx + 8, capY - 4);
    return p;
  }, [cx, capY]);

  const diaphragm = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - 26, capY - 8);
    p.lineTo(cx + 26, capY - 8);
    return p;
  }, [cx, capY]);

  // The cupping hand (blocked state) is THE canonical hand — same builder,
  // same silhouette as the grip panel and the mistake gallery. It is only
  // POSITIONED differently: rotated +90° so the fingers reach UP and wrap
  // over the capsule and the rear ports, and scaled to the cutaway shell.
  // (No bespoke crescent/pad drawing exists in this file any more.)
  // Scaled so the finger block spans the 92-px shell (±32 px) and the
  // fingertips reach past the diaphragm, while the palm covers the rear
  // ports at cx ± 38 — i.e. the hand really is over everything that makes
  // the mic directional.
  const CUP_S = 2.9;
  const cupY = capY + 24;

  // Animated entries: FRONT always arrives; REAR arrives only when open.
  const arrows = useDerivedValue(() => {
    const ph = phase.value;
    const f = (ph / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    // Front path: from above, down to the diaphragm.
    const fy = 6 + f * (capY - 22);
    p.addCircle(cx - 12, fy, 2.4);
    p.addCircle(cx + 12, fy + 4, 2.4);
    if (!blocked) {
      // Rear paths: up into the side ports.
      const ry = h - 10 - f * (h - 10 - (capY + 28));
      p.addCircle(cx - 38, ry, 2.4);
      p.addCircle(cx + 38, ry, 2.4);
    }
    return p;
  }, [phase, cx, capY, h, blocked]);

  const dotColor = blocked ? ACCENT_YELLOW : ACCENT_GREEN;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Problem glow behind the cupping hand. */}
      {blocked ? (
        <Circle cx={cx} cy={capY + 10} r={54} color={ACCENT_RED} opacity={0.18}>
          <BlurMask blur={22} style="normal" />
        </Circle>
      ) : null}
      {/* Palm mass BEHIND the mic (same two-pass layering as every hand). */}
      {blocked ? <GripHand x={cx} y={cupY} scale={CUP_S} angleDeg={90} tint={ACCENT_RED} layer="back" /> : null}
      {/* Cutaway housing with a metal-form gradient. */}
      <Path path={shellPath}>
        <LinearGradient
          start={vec(cx - 46, capY - 26)}
          end={vec(cx + 46, capY + 36)}
          colors={['#33353e', '#191a20']}
        />
      </Path>
      <Path path={shellPath} color="#565a66" style="stroke" strokeWidth={1.8} />
      <Path path={innards} color={CONE} style="stroke" strokeWidth={1.8} opacity={0.85} />
      {/* Diaphragm: the live element, softly glowing. */}
      <GlowStroke path={diaphragm} color={WAVE} width={2.6} />
      <Path path={arrows} color={dotColor} opacity={0.4}>
        <BlurMask blur={3.5} style="normal" />
      </Path>
      <Path path={arrows} color={dotColor} />
      {/* Fingers wrapping IN FRONT of the housing, over the front entry and
          the rear ports — the canonical hand, red-tinted for the problem. */}
      {blocked ? <GripHand x={cx} y={cupY} scale={CUP_S} angleDeg={90} tint={ACCENT_RED} layer="front" /> : null}
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9 · Common handheld mistakes — mini illustrations for the gallery

export type MistakeKind = 'correct' | 'grille' | 'cup' | 'away' | 'far' | 'switch' | 'antenna';

// Gallery mic, same 3.2 : 1 total-length-to-grille-DIAMETER ratio as every
// other mic in this file: 1.72·8 + 37 = 50.8 ≈ 3.18 × 16.
const MIST_GR = 8;
const MIST_LEN = 37;
// Hand covering the same 58 % of the body as the grip panel.
const MIST_HAND_S = (0.58 * MIST_LEN) / HAND_H;

export function MistakeIllustration({
  width,
  height = 110,
  kind,
}: {
  width: number;
  height?: number;
  kind: MistakeKind;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;

  const layout = useMemo(() => {
    // Mic anchor + angle per kind (same geometry family as the original).
    const micAt = (x: number, y: number, angDeg: number) => {
      const th = (angDeg * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = -Math.cos(th);
      return { gx: x + dx * 22, gy: y + dy * 22, ang: angDeg, x, y, dx, dy };
    };
    const far = kind === 'far';
    // TRUE proportion (owner 2026-07-29): the head is ~73 px crown→chin
    // against the 50.8-px mic, so the mouth is dropped to y ≈ 62 and the
    // cranium/back of the skull deliberately crop off the top-left — the
    // acoustically relevant mouth/nose region stays fully in view.
    const head = far ? { x: cx - 68, y: 60 } : { x: cx - 50, y: 62 };
    const mic = far
      ? micAt(cx + 42, 78, -30)
      : kind === 'away'
        ? micAt(cx + 10, 62, 55)
        : micAt(cx + 6, 66, -35);
    // Hand position along the mic axis, in the SAME units micAt() uses
    // (u = distance toward the grille from the anchor; grille sits at u=22).
    // With MIST_GR 8 / MIST_LEN 37 the body occupies u ∈ [−20.8, +16.2] and
    // the hand (scale MIST_HAND_S) reaches 17.5·s ≈ 10.3 above / 19·s ≈ 11.2
    // below its centre — so, by the same geometry as the grip panel:
    //   correct  → top edge ~4 px below the rim (u = 16.2)      → u_c = +2
    //   grille/cup → hand centred on the grille ball            → u_c = +22
    //   antenna  → hand bottom resting on the tail (u = −20.8)  → u_c = −8
    //   neutral  → mid-handle                                   → u_c = −3
    const atGrille = kind === 'grille' || kind === 'cup';
    const handF = atGrille ? 22 : kind === 'antenna' ? -8 : kind === 'correct' ? 2 : -3;
    const hand = { x: mic.x + mic.dx * handF, y: mic.y + mic.dy * handF };
    const extras = Skia.Path.Make();
    if (kind === 'cup') {
      extras.addArc({ x: mic.gx - 13, y: mic.gy - 13, width: 26, height: 26 }, 160, 220);
    }
    if (far) {
      // The gulf between mouth and mic: fading dots.
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        extras.addCircle(head.x + 26 + t * (mic.gx - head.x - 36), head.y + t * (mic.gy - head.y), 1.6);
      }
    }
    if (kind === 'antenna') {
      // Antenna stub past the base of the body (the tail sits at u = −20.8).
      extras.moveTo(mic.x - mic.dx * 21, mic.y - mic.dy * 21);
      extras.lineTo(mic.x - mic.dx * 33, mic.y - mic.dy * 33);
    }
    const alert = Skia.Path.Make();
    if (kind === 'switch') {
      // The mute switch on the body, under the hand's reach.
      alert.addRRect(Skia.RRectXY(Skia.XYWHRect(mic.x - mic.dx * 4 - 5, mic.y - mic.dy * 4 - 4, 10, 8), 2.5, 2.5));
    }
    const badHand = kind === 'grille' || kind === 'cup' || kind === 'antenna';
    return { head, mic, hand, extras, alert, badHand };
  }, [cx, kind]);

  const good = kind === 'correct';
  const outline = good ? ACCENT_GREEN : CONE;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 8} h={8} />
      <ProfileHead
        x={layout.head.x}
        y={layout.head.y}
        angleRad={0}
        scale={headScaleForMic(MIST_GR, MIST_LEN)}
        tint={outline}
        glow={good}
        speaking
      />
      <Path path={layout.extras} color={PARTICLE} style="stroke" strokeWidth={1.6} opacity={0.6} />
      {/* Hand wraps the mic: palm behind the body, fingers in front. */}
      <GripHand
        x={layout.hand.x}
        y={layout.hand.y}
        scale={MIST_HAND_S}
        angleDeg={layout.mic.ang}
        tint={layout.badHand ? ACCENT_RED : good ? ACCENT_GREEN : ACCENT_BLUE}
        layer="back"
      />
      <HandheldMic x={layout.mic.gx} y={layout.mic.gy} angleDeg={layout.mic.ang} grilleR={MIST_GR} bodyLen={MIST_LEN} />
      <GripHand
        x={layout.hand.x}
        y={layout.hand.y}
        scale={MIST_HAND_S}
        angleDeg={layout.mic.ang}
        tint={layout.badHand ? ACCENT_RED : good ? ACCENT_GREEN : ACCENT_BLUE}
        layer="front"
      />
      <GlowStroke path={layout.alert} color={ACCENT_RED} width={2} opacity={0.95} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKER LAB · Top view — coverage map (CONCEPTUAL, never an SPL prediction)

export const DISPERSIONS: { key: string; label: string; hDeg: number; vDeg: number }[] = [
  { key: '60x40', label: '60° × 40°', hDeg: 60, vDeg: 40 },
  { key: '90x60', label: '90° × 60°', hDeg: 90, vDeg: 60 },
  { key: '100x100', label: '100° × 100°', hDeg: 100, vDeg: 100 },
  { key: '120x60', label: '120° × 60°', hDeg: 120, vDeg: 60 },
];

export type CoverageClass = 'red' | 'green' | 'yellow' | 'gray';

// ── Heat-map colormap (owner 2026-08-02: the app-wide amplitude ramp) ────────
// red = loud → blue = quiet (levelColor heatColor), quantized to 32 buckets so
// each map renders as ~32 Skia paths. Unified with every meter/waveform and the
// other labs' heat maps so "red = loud" transfers between labs.

/** Heat-map colormap: t01 ∈ [0,1] (0 = quiet, 1 = loud). Kept named jetColor for
 *  the screens/legends that import it. */
export function jetColor(t01: number): string {
  return heatColor(t01);
}

const JET_BUCKET_COUNT = 32;
const JET_BUCKETS: string[] = Array.from({ length: JET_BUCKET_COUNT }, (_, i) =>
  jetColor(i / (JET_BUCKET_COUNT - 1)),
);

/** Conceptual level → colormap position. Same honesty rules as ever: this is
 *  an ILLUSTRATIVE dB-ish scale (10·log10 of the summed conceptual energy),
 *  mapped so the old class thresholds land in sensible colormap zones
 *  (red ≥ 1.7 → hot reds · green ≥ 0.5 → greens/yellows · < 0.26 → blues). */
export function coverageT(lvl: number): number {
  const db = 10 * Math.log10(Math.max(1e-4, lvl));
  return Math.max(0, Math.min(1, (db + 16) / 21));
}

/** Conceptual level from one speaker to one point (top view). Banded pattern
 *  edge — the ORIGINAL model, kept verbatim (readouts/semantics unchanged).
 *  Exported so its meaning stays inspectable alongside the smooth variant. */
export function topLevel(
  sx: number,
  sy: number,
  aimDeg: number,
  hDeg: number,
  px: number,
  py: number,
  refD: number,
  scale: number,
): number {
  const vx = px - sx;
  const vy = py - sy;
  const d = Math.max(12, Math.hypot(vx, vy));
  // Aim: 0° = straight into the audience (down the screen).
  const th = (aimDeg * Math.PI) / 180;
  const ax = Math.sin(th);
  const ay = Math.cos(th);
  const cosA = (vx * ax + vy * ay) / d;
  const ang = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
  const half = hDeg / 2;
  const base = ang <= half ? 1 : ang <= half + 12 ? 0.5 : 0.08;
  return scale * base * Math.pow(refD / d, 1.5);
}

/** Smooth pattern-edge gain: 1 inside the nominal wedge, then a continuous
 *  −3 dB-per-8° rolloff (floored) — ADDED for the heat map so the field has
 *  the smooth spatial falloff of the reference plots. Same dispersion ×
 *  distance family as topLevel; only the edge is continuous, not banded. */
function smoothEdge(offDeg: number, halfDeg: number): number {
  const over = offDeg - halfDeg;
  if (over <= 0) return 1;
  return Math.max(0.055, Math.pow(0.5, over / 8));
}

/** topLevel's continuous sibling (top view, heat map only). */
export function topLevelSmooth(
  sx: number,
  sy: number,
  aimDeg: number,
  hDeg: number,
  px: number,
  py: number,
  refD: number,
  scale: number,
): number {
  const vx = px - sx;
  const vy = py - sy;
  const d = Math.max(12, Math.hypot(vx, vy));
  const th = (aimDeg * Math.PI) / 180;
  const ax = Math.sin(th);
  const ay = Math.cos(th);
  const cosA = (vx * ax + vy * ay) / d;
  const ang = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
  return scale * smoothEdge(ang, hDeg / 2) * Math.pow(refD / d, 1.5);
}

/** Side-plane conceptual level (vertical pattern × distance, smooth edge).
 *  Exported as the readable reference for the side heat map, whose inner loop
 *  inlines this same expression with the per-source constants hoisted. */
export function sideLevelSmooth(
  sx: number,
  sy: number,
  axisRad: number,
  halfDeg: number,
  px: number,
  py: number,
  refD: number,
  scale: number,
): number {
  const vx = px - sx;
  const vy = py - sy;
  const d = Math.max(12, Math.hypot(vx, vy));
  const offDeg = (Math.abs(Math.atan2(vy, vx) - axisRad) * 180) / Math.PI;
  return scale * smoothEdge(offDeg, halfDeg) * Math.pow(refD / d, 1.5);
}

// ── Wavefront rings — physically faithful concentric propagation ─────────────
// Each active source radiates CONCENTRIC circular wavefronts from the cabinet,
// all expanding at ONE constant speed and spaced by a constant wavelength, so
// the pattern is a moving train of equally-spaced rings — real propagation, not
// a single sweeping arc. Amplitude is DIRECTIONAL: every ring is drawn only
// across the cabinet's aimed dispersion wedge, with a brighter core along the
// axis, so energy fades toward and behind the pattern edges. The rings render
// with an ADDITIVE ('plus') blend, so where two sources' wavefronts cross they
// visibly REINFORCE — the "overlap = hot ridge / comb" lesson. Each ring is one
// component whose radius is r = ((f + i)/RINGS)·maxR: as f sweeps 0→1 the whole
// multiset of radii is continuous, and each ring's opacity fades to zero at
// birth (r→0) and death (r→maxR), so the train never pops. Per-frame work is
// worklet-safe (useDerivedValue); node count is fixed at RINGS × 2 paths.

type RingCenter = { x: number; y: number; dirDeg: number; maxR: number; spreadDeg?: number };

const RINGS_PER_SRC = 5;

/** One wavefront ring (index i of the constant-wavelength train), summed across
 *  every active source; additive so crossings reinforce. */
function WaveRing({
  phase,
  centers,
  spreadDeg,
  i,
}: {
  phase: SharedValue<number>;
  centers: RingCenter[];
  spreadDeg: number;
  i: number;
}) {
  const path = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    for (let ci = 0; ci < centers.length; ci++) {
      const c = centers[ci];
      const r = ((f + i) / RINGS_PER_SRC) * c.maxR;
      if (r < 3 || r > c.maxR) continue;
      const spread = c.spreadDeg ?? spreadDeg;
      const box = { x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r };
      // Wide dim wavefront across the whole wedge…
      p.addArc(box, c.dirDeg - spread / 2, spread);
      // …plus a brighter core along the axis (additive → hotter centre).
      p.addArc(box, c.dirDeg - spread / 4, spread / 2);
    }
    return p;
  }, [phase, centers, spreadDeg, i]);
  const lineOp = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const u = (f + i) / RINGS_PER_SRC; // radius fraction 0→1
    const fadeIn = Math.min(1, u / 0.14);
    const fadeOut = (1 - u) * (1 - u);
    return 0.42 * fadeIn * fadeOut;
  }, [phase, i]);
  const glowOp = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI)) % 1;
    const u = (f + i) / RINGS_PER_SRC;
    const fadeIn = Math.min(1, u / 0.14);
    const fadeOut = (1 - u) * (1 - u);
    return 0.2 * fadeIn * fadeOut;
  }, [phase, i]);
  return (
    <>
      <Path path={path} color="#bcd4ff" style="stroke" strokeWidth={3.4} opacity={glowOp} blendMode="plus">
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color="#e6f0ff" style="stroke" strokeWidth={1.2} opacity={lineOp} blendMode="plus" />
    </>
  );
}

function WavefrontRings({
  phase,
  centers,
  spreadDeg,
}: {
  phase: SharedValue<number>;
  centers: RingCenter[];
  spreadDeg: number;
}) {
  return (
    <>
      {Array.from({ length: RINGS_PER_SRC }, (_, i) => (
        <WaveRing key={i} phase={phase} centers={centers} spreadDeg={spreadDeg} i={i} />
      ))}
    </>
  );
}

export function classifyCoverage(lvl: number): CoverageClass {
  if (lvl >= 1.7) return 'red';
  if (lvl >= 0.5) return 'green';
  if (lvl >= 0.26) return 'yellow';
  return 'gray';
}

/** Top-view PA cabinet: trapezoid box + face gradient + horn slot (local
 *  coords, front face toward +y — matching the aim convention). */
function CabinetTop({
  x,
  y,
  aimDeg,
  small,
  scale = 1,
}: {
  x: number;
  y: number;
  aimDeg: number;
  small?: boolean;
  scale?: number;
}) {
  const s = (small ? 0.62 : 1) * scale;
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const bw = 7.5 * s; // back half-width
    const fw = 11.5 * s; // front half-width
    const d = 17 * s; // depth
    p.moveTo(-bw, -d);
    p.lineTo(bw, -d);
    p.lineTo(fw, 0);
    p.lineTo(-fw, 0);
    p.close();
    return p;
  }, [s]);
  const horn = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-6.5 * s, -4.2 * s, 13 * s, 2.6 * s), 1.2 * s, 1.2 * s));
    return p;
  }, [s]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (-aimDeg * Math.PI) / 180 }]}>
      <Path path={path}>
        <LinearGradient start={vec(-10 * s, -17 * s)} end={vec(10 * s, 0)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={path} color="#5a5e6a" style="stroke" strokeWidth={1.1} />
      <Path path={horn} color="#101116" />
    </Group>
  );
}

export function TopCoverageView({
  width,
  height = 250,
  spk1x01,
  spk1AimDeg,
  spk2On,
  spk2x01,
  spk2AimDeg,
  hDeg,
  frontFills,
}: {
  width: number;
  height?: number;
  spk1x01: number;
  spk1AimDeg: number;
  spk2On: boolean;
  spk2x01: number;
  spk2AimDeg: number;
  hDeg: number;
  frontFills: boolean;
}) {
  const w = width;
  const h = height;
  const stageH = 26;
  const audY0 = stageH + 8;
  const audH = h - audY0 - 8;

  const { buckets, aims, spkList, ringCenters } = useMemo(() => {
    const refD = 0.55 * audH;
    const spks: { x: number; y: number; aim: number; hd: number; refD: number; scale: number; small?: boolean }[] = [
      { x: spk1x01 * (w - 40) + 20, y: stageH, aim: spk1AimDeg, hd: hDeg, refD, scale: 1 },
    ];
    if (spk2On) spks.push({ x: spk2x01 * (w - 40) + 20, y: stageH, aim: spk2AimDeg, hd: hDeg, refD, scale: 1 });
    if (frontFills) {
      for (const fx of [0.3, 0.7]) {
        spks.push({ x: fx * w, y: stageH, aim: 0, hd: 90, refD: 0.2 * audH, scale: 0.5, small: true });
      }
    }
    // Fine heat map: 224 × 192 cells — 4× the previous 56 × 48 linear
    // resolution (owner 2026-07-29). Cells are RUN-LENGTH MERGED per row and
    // bucketed into ≤32 quantized jet colors → one Path per bucket. Rebuilt
    // ONLY when a drive parameter changes (this useMemo), never per frame.
    const bucketPaths: SkPathT[] = Array.from({ length: JET_BUCKET_COUNT }, () => Skia.Path.Make());
    const COLS = 224;
    const ROWS = 192;
    const cw = w / COLS;
    const ch = audH / ROWS;
    // Per-source constants hoisted OUT of the 43 008-cell loop. The body
    // below is algebraically identical to topLevelSmooth() (kept exported
    // above as the readable reference) — it just stops recomputing sin/cos
    // of the aim angle once per cell per source. Measured 2.4× faster with
    // bit-identical bucket indices.
    const src = spks.map((s) => {
      const th = (s.aim * Math.PI) / 180;
      return { x: s.x, y: s.y, ax: Math.sin(th), ay: Math.cos(th), half: s.hd / 2, refD: s.refD, scale: s.scale };
    });
    for (let r = 0; r < ROWS; r++) {
      const py = audY0 + (r + 0.5) * ch;
      addFieldRow(bucketPaths, COLS, 0, audY0 + r * ch, cw, ch, (c) => {
        const px = (c + 0.5) * cw;
        let lvl = 0;
        for (let k = 0; k < src.length; k++) {
          const s = src[k];
          const vx = px - s.x;
          const vy = py - s.y;
          let d = Math.sqrt(vx * vx + vy * vy);
          if (d < 12) d = 12;
          const cosA = (vx * s.ax + vy * s.ay) / d;
          const ang = (Math.acos(cosA < -1 ? -1 : cosA > 1 ? 1 : cosA) * 180) / Math.PI;
          const rd = s.refD / d;
          lvl += s.scale * smoothEdge(ang, s.half) * rd * Math.sqrt(rd);
        }
        return Math.round(coverageT(lvl) * (JET_BUCKET_COUNT - 1));
      });
    }
    // Aim cue lines, clamped into the canvas (kept absolute like before so an
    // edge speaker at hard aim keeps its cue).
    const aimPath = Skia.Path.Make();
    for (const s of spks) {
      const th = (s.aim * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = Math.cos(th);
      const L = s.small ? 26 : 46;
      aimPath.moveTo(s.x, s.y);
      aimPath.lineTo(Math.max(4, Math.min(w - 4, s.x + dx * L)), s.y + dy * L);
    }
    // Wavefront-ring anchors: arcs open toward each speaker's aim.
    const rings: RingCenter[] = spks.map((s) => ({
      x: s.x,
      y: s.y,
      dirDeg: 90 - s.aim, // screen angle of the aim vector (sin θ, cos θ)
      maxR: s.small ? audH * 0.42 : audH * 1.05,
    }));
    return { buckets: bucketPaths, aims: aimPath, spkList: spks, ringCenters: rings };
  }, [w, h, audY0, audH, spk1x01, spk1AimDeg, spk2On, spk2x01, spk2AimDeg, hDeg, frontFills]);

  const ringPhase = usePhaseClock(true, 0.22);

  const stage = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, 0, w, stageH));
    return p;
  }, [w]);
  const performers = useMemo(() => {
    const p = Skia.Path.Make();
    for (const fx of [0.42, 0.5, 0.58]) appendBust(p, w * fx, stageH - 3, 1);
    return p;
  }, [w]);

  // Audience SEATING (owner 2026-07-29): rows of head-dots (viewed from above)
  // in proportional blocks split by aisles. The heat map is an OVERLAY on this
  // seating — drawn under the field at reduced field alpha so the seats read
  // through it, exactly like a coverage plot laid over a venue plan. A head
  // from above is ~0.4 m; the block/aisle proportions follow a real room.
  const seating = useMemo(() => {
    const dots = Skia.Path.Make();
    const x0 = 10;
    const x1 = w - 10;
    const y0 = audY0 + 8;
    const y1 = h - 8;
    const span = x1 - x0;
    const blocks = 3;
    const aisleFrac = 0.05; // each aisle = 5% of the audience width
    const blockW = (span - aisleFrac * span * (blocks - 1)) / blocks;
    const pitch = 11; // seat/row pitch (px)
    const dotR = 3.0;
    for (let b = 0; b < blocks; b++) {
      const bx0 = x0 + b * (blockW + aisleFrac * span);
      const cols = Math.max(1, Math.round(blockW / pitch));
      const cstep = blockW / cols;
      for (let yy = y0; yy <= y1; yy += pitch) {
        for (let cc = 0; cc < cols; cc++) {
          dots.addCircle(bx0 + (cc + 0.5) * cstep, yy, dotR);
        }
      }
    }
    return dots;
  }, [w, h, audY0]);

  // Cabinet scale: a PA main viewed from above is ~0.6 m across — sized down
  // from the old fixed footprint so it reads proportional to the seat blocks.
  const mainCabS = 0.7;

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Group transform={sceneTransform(w, h)}>
        {/* Stage deck with depth + a hint of the band. */}
        <Path path={stage}>
          <LinearGradient start={vec(0, 0)} end={vec(0, stageH)} colors={['#3b4252', '#232833']} />
        </Path>
        {/* Performers in the line-art language of the head icons. */}
        <LineBusts path={performers} stroke={LINE} sw={1.4} />
        {/* SEATING under the map: dim head-dots + a faint rim, drawn BEFORE the
            field so the coverage overlays real seats (not floating on black). */}
        <Path path={seating} color="#2b3040" />
        <Path path={seating} color="#4a5162" style="stroke" strokeWidth={0.6} />
        {/* Heat map: ≤32 quantized-jet bucket paths (abstract data — styled,
            kept honest: conceptual level, never an SPL prediction). Field alpha
            is held at 0.6 so the seating reads THROUGH the coverage overlay. */}
        {buckets.map((p, i) => (
          <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.6} />
        ))}
        {/* Wavefronts ripple across the field from each active speaker. */}
        <WavefrontRings phase={ringPhase} centers={ringCenters} spreadDeg={Math.min(170, hDeg + 30)} />
        <SkLine p1={{ x: 0, y: stageH }} p2={{ x: w, y: stageH }} color={GRID} strokeWidth={1.5} />
        <GlowStroke path={aims} color={PARTICLE} width={1.6} opacity={0.8} />
        {spkList.map((s, i) => (
          <CabinetTop key={i} x={s.x} y={s.y} aimDeg={s.aim} small={s.small} scale={s.small ? 1 : mainCabS} />
        ))}
      </Group>
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKER LAB · Side view — height, tilt, vertical coverage, delay concept

/** Side-view PA cabinet: rounded trapezoid, woofer cone + dust cap, horn slot.
 *  Local coords: front face toward +x; rotate = down-tilt. */
function CabinetSide({ x, y, tiltDeg, scale = 1 }: { x: number; y: number; tiltDeg: number; scale?: number }) {
  const s = scale;
  const box = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(-8 * s, -7 * s);
    p.lineTo(10.5 * s, -9 * s);
    p.quadTo(12 * s, -9 * s, 12 * s, -7.5 * s);
    p.lineTo(12 * s, 7.5 * s);
    p.quadTo(12 * s, 9 * s, 10.5 * s, 9 * s);
    p.lineTo(-8 * s, 7 * s);
    p.quadTo(-9.5 * s, 6.5 * s, -9.5 * s, 5 * s);
    p.lineTo(-9.5 * s, -5 * s);
    p.quadTo(-9.5 * s, -6.5 * s, -8 * s, -7 * s);
    p.close();
    return p;
  }, [s]);
  const horn = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(6 * s, -6.6 * s, 4.6 * s, 4.4 * s), 1.2 * s, 1.2 * s));
    return p;
  }, [s]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (tiltDeg * Math.PI) / 180 }]}>
      <Path path={box}>
        <LinearGradient start={vec(-9 * s, -9 * s)} end={vec(12 * s, 9 * s)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={box} color="#5a5e6a" style="stroke" strokeWidth={1.1} />
      {/* Woofer: radial-gradient cone + dust cap. */}
      <Circle cx={7.2 * s} cy={3 * s} r={4.6 * s}>
        <RadialGradient c={vec(6 * s, 1.6 * s)} r={7 * s} colors={['#787c88', '#26272e']} />
      </Circle>
      <Circle cx={7.2 * s} cy={3 * s} r={1.5 * s} color="#a7abb6" />
      <Path path={horn} color="#101116" />
    </Group>
  );
}

/** Coverage class → the line-art stroke colour of an audience bust. Same
 *  classification, same meaning as the old gradient fills — restyled to the
 *  head icons' line-art language (owner ruling 2026-07-29). */
const SEAT_LINE: Record<CoverageClass, string> = {
  green: '#7dffa1',
  yellow: '#ffe08f',
  red: '#ff8a7d',
  gray: '#b6b9c4',
};

/** Standing GUITARIST — recognizable line-art musician holding a guitar, in the
 *  same single-stroke language as the head icons (owner ruling 2026-07-29).
 *  Canonical figure is ~46 units crown→feet, origin AT THE FEET (y grows down,
 *  figure occupies y ∈ [−46s, 0]) so it stands on the stage deck. Sized from
 *  the scene metre so it is a true ~1.7 m reference beside the ~0.6 m cabinet. */
function buildGuitarist(s: number): { body: SkPathT; guitar: SkPathT } {
  const body = Skia.Path.Make();
  body.addCircle(0, -42.5 * s, 3.7 * s); // head
  body.moveTo(0, -38.8 * s); // spine: neck → hips
  body.lineTo(0, -22 * s);
  body.moveTo(-5 * s, -36.5 * s); // shoulders
  body.lineTo(5 * s, -36.5 * s);
  body.moveTo(0, -22 * s); // left leg
  body.lineTo(-4 * s, 0);
  body.moveTo(0, -22 * s); // right leg
  body.lineTo(4.6 * s, 0);
  body.moveTo(-5 * s, -36.5 * s); // strumming arm → over the lower bout
  body.cubicTo(-9.5 * s, -33 * s, -9 * s, -27 * s, -4.5 * s, -24.5 * s);
  body.moveTo(5 * s, -36.5 * s); // fretting arm → up the neck
  body.cubicTo(10 * s, -35 * s, 13 * s, -31 * s, 15.5 * s, -27.5 * s);

  const guitar = Skia.Path.Make();
  guitar.moveTo(-1.5 * s, -31 * s); // figure-8 body held at the waist
  guitar.cubicTo(-7 * s, -31 * s, -8 * s, -26 * s, -5 * s, -24 * s);
  guitar.cubicTo(-9 * s, -22 * s, -8 * s, -15 * s, -1 * s, -15 * s);
  guitar.cubicTo(6 * s, -15 * s, 7 * s, -22 * s, 3 * s, -24 * s);
  guitar.cubicTo(6 * s, -26 * s, 5 * s, -31 * s, 0, -31 * s);
  guitar.close();
  guitar.moveTo(-1 * s, -30 * s); // neck up to the fretting hand
  guitar.lineTo(15.5 * s, -27.5 * s);
  return { body, guitar };
}

function Guitarist({ x, footY, scale, tint }: { x: number; footY: number; scale: number; tint: string }) {
  const parts = useMemo(() => buildGuitarist(scale), [scale]);
  const lw = 1.5 * scale;
  return (
    <Group transform={[{ translateX: x }, { translateY: footY }]}>
      <Path path={parts.guitar} color="#2a2116" />
      <Path path={parts.guitar} color={tint} style="stroke" strokeWidth={lw} strokeCap="round" strokeJoin="round" />
      <Path path={parts.body} color={LINE} style="stroke" strokeWidth={lw} strokeCap="round" strokeJoin="round" />
      <Path path={parts.body} color={tint} style="stroke" strokeWidth={lw} strokeCap="round" strokeJoin="round" opacity={0.4} />
    </Group>
  );
}

/**
 * DELAY-ALIGNMENT overlay (CONCEPTUAL MODEL — owner 2026-07-29). Two travelling
 * wavefronts race to the rear rows: the MAIN system's front sweeps the full
 * depth from the stage (slow to arrive), and the REAR hanging speaker's front
 * covers the short hop to the rear seats. When `aligned`, the rear speaker
 * FIRES LATE — held back by the propagation delay (distance ÷ speed) — so both
 * fronts land on the rear rows TOGETHER (green "IN STEP" flash). When not
 * aligned, the rear fires with the mains, arrives early, and the two arrivals
 * separate (an echo). It is illustrative timing, NOT true time-alignment math.
 */
function AlignmentOverlay({
  phase,
  mainX,
  rearX,
  targetX,
  yTop,
  yBot,
  aligned,
}: {
  phase: SharedValue<number>;
  mainX: number;
  rearX: number;
  targetX: number;
  yTop: number;
  yBot: number;
  aligned: boolean;
}) {
  const D_REAR = 0.16; // rear front's travel time as a fraction of the cycle
  const mainPath = useDerivedValue(() => {
    const g = (phase.value / (2 * Math.PI)) % 1;
    const x = mainX + g * (targetX - mainX);
    const p = Skia.Path.Make();
    p.moveTo(x, yTop);
    p.lineTo(x, yBot);
    return p;
  }, [phase, mainX, targetX, yTop, yBot]);
  const rearPath = useDerivedValue(() => {
    const g = (phase.value / (2 * Math.PI)) % 1;
    const start = aligned ? 1 - D_REAR : 0; // aligned → fire late by the delay
    const local = (g - start) / D_REAR;
    const p = Skia.Path.Make();
    if (local >= 0 && local <= 1) {
      const x = rearX + local * (targetX - rearX);
      p.moveTo(x, yTop);
      p.lineTo(x, yBot);
    }
    return p;
  }, [phase, rearX, targetX, yTop, yBot, aligned]);
  // Green "in step" pulse when both fronts converge on the rear rows (g→1).
  const flashOp = useDerivedValue(() => {
    const g = (phase.value / (2 * Math.PI)) % 1;
    const near = Math.max(0, 1 - Math.abs(g - 1) / 0.1);
    return aligned ? 0.55 * near : 0;
  }, [phase, aligned]);
  return (
    <>
      <Path path={mainPath} color={ACCENT_YELLOW} style="stroke" strokeWidth={2.2} opacity={0.9} />
      <Path path={rearPath} color={ACCENT_BLUE} style="stroke" strokeWidth={2.2} opacity={0.9} />
      <Circle cx={targetX} cy={(yTop + yBot) / 2} r={11} color={ACCENT_GREEN} opacity={flashOp}>
        <BlurMask blur={6} style="normal" />
      </Circle>
    </>
  );
}

export function SideCoverageView({
  width,
  height = 230,
  h01,
  tiltDeg,
  vDeg,
  stage01,
  ceil01,
  depth01,
  sloped,
  delayOn,
  lineArray = false,
  rearDelayOn = false,
  timeAligned = true,
}: {
  width: number;
  height?: number;
  /** 0 = speaker at stage-top level … 1 = at the ceiling. */
  h01: number;
  /** Downward tilt in degrees (0 = firing level). */
  tiltDeg: number;
  vDeg: number;
  stage01: number;
  ceil01: number;
  depth01: number;
  sloped: boolean;
  delayOn: boolean;
  /** Replace the single flown box with a splayed vertical line array. */
  lineArray?: boolean;
  /** A distinct DELAYED hanging speaker over the rear seats (own coverage). */
  rearDelayOn?: boolean;
  /** Rear speaker fires late by the propagation delay so arrivals fuse. */
  timeAligned?: boolean;
}) {
  const w = width;
  const h = height;
  const floorY = h - 16;
  const ceilY = 18 + (1 - ceil01) * 42;
  const stageW = 44;
  const stageTop = floorY - (16 + stage01 * 34);
  const spkX = 30;
  const spkY = stageTop - 8 - h01 * Math.max(10, stageTop - 8 - (ceilY + 12));

  // ── Real-world sizing: one metre drives every object (owner 2026-07-29) ────
  const HUMAN_PX = 42; // a standing human ≈ 1.7 m
  const MPP = HUMAN_PX / M_HUMAN; // pixels per metre
  const cabScale = (M_CAB * MPP) / CAB_DRAWN_H; // ~0.6 m cabinet
  const boxScale = (M_BOX * MPP) / CAB_DRAWN_H; // ~0.3 m line-array box
  const bustScale = (M_BUST * MPP) / BUST_DRAWN_H; // seated head+shoulders
  const guitaristScale = (M_HUMAN * MPP) / 46; // 46-unit canonical figure

  // Line-array hang: N boxes down from the fly point with progressive splay —
  // top boxes near-flat for far throw, lower boxes tilting down for the near
  // seats (the classic J so the whole depth hears an even level).
  const arrayBoxes = useMemo(() => {
    const boxDrawnH = CAB_DRAWN_H * boxScale + 1.5;
    const N = 6;
    const out: { x: number; y: number; tilt: number }[] = [];
    let a = tiltDeg - 2;
    for (let i = 0; i < N; i++) {
      out.push({ x: spkX, y: spkY + i * boxDrawnH, tilt: a });
      a += 2.4 + i * 1.3;
    }
    return out;
  }, [spkX, spkY, tiltDeg, boxScale]);
  const arrayMidY = arrayBoxes.length ? arrayBoxes[Math.floor(arrayBoxes.length / 2)].y : spkY;

  const geo = useMemo(() => {
    const axis = (tiltDeg * Math.PI) / 180;
    const half = ((vDeg / 2) * Math.PI) / 180;
    const L = w * 1.2;
    const boxHalf = (7 * Math.PI) / 180; // per-array-box vertical control

    // Main coverage wedge (single box): a filled fan + its center-axis cue.
    // With a line array the single wedge is replaced by faint per-box beams.
    const wedgeFill = Skia.Path.Make();
    const axisLine = Skia.Path.Make();
    if (!lineArray) {
      wedgeFill.moveTo(spkX, spkY);
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const a = axis - half + ((2 * half) * i) / N;
        wedgeFill.lineTo(spkX + Math.cos(a) * L, spkY + Math.sin(a) * L);
      }
      wedgeFill.close();
      axisLine.moveTo(spkX, spkY);
      axisLine.lineTo(spkX + Math.cos(axis) * L, spkY + Math.sin(axis) * L);
    }

    // Per-box beam edges: each array box's own narrow wedge, drawn faint over
    // the summed field so the array total reads as a stack of contributions.
    const boxBeams = Skia.Path.Make();
    if (lineArray) {
      for (const b of arrayBoxes) {
        const ba = (b.tilt * Math.PI) / 180;
        for (const edge of [ba - boxHalf, ba + boxHalf]) {
          boxBeams.moveTo(b.x, b.y);
          boxBeams.lineTo(b.x + Math.cos(edge) * L, b.y + Math.sin(edge) * L);
        }
      }
    }

    // Room lines.
    const room = Skia.Path.Make();
    room.moveTo(0, ceilY);
    room.lineTo(w, ceilY);

    // Stage block.
    const stage = Skia.Path.Make();
    stage.addRRect(Skia.RRectXY(Skia.XYWHRect(4, stageTop, stageW, floorY - stageTop), 3, 3));

    // Audience extent.
    const audX0 = stageW + 26;
    const audW = depth01 * (w - audX0 - 14);

    // Existing DELAY SPEAKER (concept only): hung at ~58% depth.
    const dlyX = audX0 + audW * 0.58;
    const dlyY = ceilY + 22;
    const delayWedge = Skia.Path.Make();
    if (delayOn) {
      const aA = Math.atan2(w * 0.34, w * 0.5);
      const aB = Math.atan2(w * 0.5, w * 0.16);
      delayWedge.moveTo(dlyX, dlyY);
      const Md = 10;
      for (let i = 0; i <= Md; i++) {
        const a = aA + ((aB - aA) * i) / Md;
        delayWedge.lineTo(dlyX + Math.cos(a) * w * 0.65, dlyY + Math.sin(a) * w * 0.65);
      }
      delayWedge.close();
    }

    // NEW distinct DELAYED HANGING speaker, farther back OVER the rear seats,
    // with its own steep coverage wedge onto the rear rows.
    const rearX = audX0 + audW * 0.84;
    const rearY = ceilY + 16;
    const rearAxis = (72 * Math.PI) / 180; // steep down onto the rear rows
    const rearHalf = (26 * Math.PI) / 180;
    const rearWedge = Skia.Path.Make();
    if (rearDelayOn) {
      rearWedge.moveTo(rearX, rearY);
      const Mr = 10;
      const Lr = w * 0.5;
      for (let i = 0; i <= Mr; i++) {
        const a = rearAxis - rearHalf + ((2 * rearHalf) * i) / Mr;
        rearWedge.lineTo(rearX + Math.cos(a) * Lr, rearY + Math.sin(a) * Lr);
      }
      rearWedge.close();
    }

    // Seats: classified audience busts along the depth. classifyCoverage() and
    // its thresholds are untouched; this inline tint generalises to the array
    // (even deep coverage) and the two delayed speakers (rear rescue).
    const seatPaths: Record<CoverageClass, SkPathT> = {
      red: Skia.Path.Make(),
      green: Skia.Path.Make(),
      yellow: Skia.Path.Make(),
      gray: Skia.Path.Make(),
    };
    const topA = arrayBoxes.length ? (arrayBoxes[0].tilt * Math.PI) / 180 : axis;
    const botA = arrayBoxes.length ? (arrayBoxes[arrayBoxes.length - 1].tilt * Math.PI) / 180 : axis;
    const NS = 9;
    for (let i = 0; i < NS; i++) {
      const sx = audX0 + ((i + 0.5) / NS) * audW;
      const rise = sloped ? (i / (NS - 1)) * 34 : 0;
      const hy = floorY - 14 - rise;
      let cls: CoverageClass;
      let d: number;
      if (lineArray) {
        // The array covers evenly across its whole vertical spread.
        const vx = sx - spkX;
        const vy = hy - arrayMidY;
        d = Math.hypot(vx, vy);
        const ang = Math.atan2(vy, vx);
        if (ang >= topA - boxHalf && ang <= botA + boxHalf) cls = 'green';
        else if (ang >= topA - boxHalf - (6 * Math.PI) / 180 && ang <= botA + boxHalf + (6 * Math.PI) / 180)
          cls = 'yellow';
        else cls = 'gray';
      } else {
        const vx = sx - spkX;
        const vy = hy - spkY;
        d = Math.hypot(vx, vy);
        const off = Math.abs(Math.atan2(vy, vx) - axis);
        cls = off <= half ? 'green' : off <= half + (7 * Math.PI) / 180 ? 'yellow' : 'gray';
      }
      // Hot zone: front rows blasted point-blank inside the core.
      if (cls === 'green' && d < w * 0.2) cls = 'red';
      // Existing delay speaker rescues the mid/rear (concept only).
      if (delayOn && cls === 'gray' && sx > dlyX - 8) cls = 'green';
      // Distinct rear hanging speaker rescues the rear rows.
      if (rearDelayOn && (cls === 'gray' || cls === 'yellow') && sx > rearX - audW * 0.3) cls = 'green';
      appendBust(seatPaths[cls], sx, floorY - rise, bustScale);
    }
    return {
      wedgeFill,
      axisLine,
      boxBeams,
      room,
      stage,
      delayWedge,
      rearWedge,
      seats: seatPaths,
      dlyX,
      dlyY,
      rearX,
      rearY,
      audX0,
      audW,
    };
  }, [
    w,
    floorY,
    ceilY,
    stageTop,
    spkX,
    spkY,
    tiltDeg,
    vDeg,
    depth01,
    sloped,
    delayOn,
    stageW,
    lineArray,
    rearDelayOn,
    arrayBoxes,
    arrayMidY,
    bustScale,
  ]);

  // Side-plane heat map (stage front → rear wall, ceiling → floor): the same
  // vertical-pattern × distance model, continuous, quantized-jet bucketed —
  // ≤32 Path nodes, rebuilt only when a drive parameter changes.
  const heat = useMemo(() => {
    const bucketPaths: SkPathT[] = Array.from({ length: JET_BUCKET_COUNT }, () => Skia.Path.Make());
    const x0 = stageW + 8;
    const x1 = w - 2;
    const y0 = ceilY + 4;
    const y1 = floorY;
    const srcs: { x: number; y: number; axis: number; half: number; refD: number; scale: number }[] = [];
    if (lineArray) {
      // Every box contributes its own tight beam; run-length merged into the
      // SAME ≤32 bucket paths, so the field the audience sees is the array SUM.
      for (const b of arrayBoxes) {
        srcs.push({ x: b.x, y: b.y, axis: (b.tilt * Math.PI) / 180, half: 7, refD: w * 0.52, scale: 0.5 });
      }
    } else {
      srcs.push({ x: spkX, y: spkY, axis: (tiltDeg * Math.PI) / 180, half: vDeg / 2, refD: w * 0.5, scale: 1 });
    }
    if (delayOn) {
      // Delay box beam: mid-axis of its drawn wedge (same edges as geo).
      const aA = Math.atan2(w * 0.34, w * 0.5);
      const aB = Math.atan2(w * 0.5, w * 0.16);
      srcs.push({
        x: geo.dlyX,
        y: geo.dlyY,
        axis: (aA + aB) / 2,
        half: (((aB - aA) / 2) * 180) / Math.PI,
        refD: w * 0.3,
        scale: 0.7,
      });
    }
    if (rearDelayOn) {
      // Distinct rear hanging speaker: its OWN heat contribution on the rear.
      srcs.push({ x: geo.rearX, y: geo.rearY, axis: (72 * Math.PI) / 180, half: 26, refD: w * 0.32, scale: 0.72 });
    }
    // 192 × 120 cells — 4× the previous 48 × 30 linear resolution (owner
    // 2026-07-29), run-length merged per row into the ≤32 bucket paths.
    const COLS = 192;
    const ROWS = 120;
    const cw = (x1 - x0) / COLS;
    const ch = (y1 - y0) / ROWS;
    // Same hoisting as the top view: algebraically identical to
    // sideLevelSmooth(), with the per-source constants lifted out.
    for (let r = 0; r < ROWS; r++) {
      const py = y0 + (r + 0.5) * ch;
      addFieldRow(bucketPaths, COLS, x0, y0 + r * ch, cw, ch, (c) => {
        const px = x0 + (c + 0.5) * cw;
        let lvl = 0;
        for (let k = 0; k < srcs.length; k++) {
          const s = srcs[k];
          const vx = px - s.x;
          const vy = py - s.y;
          let d = Math.sqrt(vx * vx + vy * vy);
          if (d < 12) d = 12;
          const offDeg = (Math.abs(Math.atan2(vy, vx) - s.axis) * 180) / Math.PI;
          const rd = s.refD / d;
          lvl += s.scale * smoothEdge(offDeg, s.half) * rd * Math.sqrt(rd);
        }
        return Math.round(coverageT(lvl) * (JET_BUCKET_COUNT - 1));
      });
    }
    return bucketPaths;
  }, [
    w,
    ceilY,
    floorY,
    stageW,
    spkX,
    spkY,
    tiltDeg,
    vDeg,
    delayOn,
    geo.dlyX,
    geo.dlyY,
    lineArray,
    rearDelayOn,
    geo.rearX,
    geo.rearY,
    arrayBoxes,
  ]);

  const ringPhase = usePhaseClock(true, 0.22);
  const ringCenters = useMemo<RingCenter[]>(() => {
    const r: RingCenter[] = [];
    if (lineArray) {
      // The array's summed wavefront: one clean train from the hang centre,
      // tighter vertical spread than a single box.
      r.push({ x: spkX, y: arrayMidY, dirDeg: tiltDeg + 6, maxR: w * 0.9, spreadDeg: 34 });
    } else {
      r.push({ x: spkX, y: spkY, dirDeg: tiltDeg, maxR: w * 0.85 });
    }
    if (delayOn) r.push({ x: geo.dlyX, y: geo.dlyY, dirDeg: 53, maxR: w * 0.5 });
    if (rearDelayOn) r.push({ x: geo.rearX, y: geo.rearY, dirDeg: 72, maxR: w * 0.42, spreadDeg: 52 });
    return r;
  }, [spkX, spkY, arrayMidY, tiltDeg, w, delayOn, geo.dlyX, geo.dlyY, lineArray, rearDelayOn, geo.rearX, geo.rearY]);

  // Alignment overlay anchors: main front sweeps from the stage; rear front
  // hops from the rear speaker; both aim at the rear-row target.
  const alignPhase = usePhaseClock(rearDelayOn, 0.5);
  const rearTargetX = geo.audX0 + geo.audW * 0.96;

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Group transform={sceneTransform(w, h)}>
        {/* Room: ceiling line + gradient floor. */}
        <Path path={geo.room} color={GRID} style="stroke" strokeWidth={1.6} />
        <Floor w={w} y={floorY} h={h - floorY} />
        {/* Heat map: the vertical beam(s) glow in the field (≤32 bucket paths). */}
        {heat.map((p, i) => (
          <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.92} />
        ))}
        {/* Wavefronts ripple down the beam. */}
        <WavefrontRings phase={ringPhase} centers={ringCenters} spreadDeg={Math.min(170, vDeg + 30)} />
        {/* Single-box wedge cues, OR faint per-box array beam edges. */}
        {lineArray ? (
          <Path path={geo.boxBeams} color={ACCENT_YELLOW} style="stroke" strokeWidth={0.8} opacity={0.34} />
        ) : (
          <>
            <Path path={geo.wedgeFill} color={WAVE} style="stroke" strokeWidth={1} opacity={0.28} />
            <GlowStroke path={geo.axisLine} color={WAVE} width={1.4} opacity={0.6} />
          </>
        )}
        {delayOn ? (
          <Path path={geo.delayWedge} color={ACCENT_BLUE} style="stroke" strokeWidth={1} opacity={0.3} />
        ) : null}
        {rearDelayOn ? (
          <Path path={geo.rearWedge} color={ACCENT_BLUE} style="stroke" strokeWidth={1} opacity={0.34} />
        ) : null}
        {/* Stage block. */}
        <Path path={geo.stage}>
          <LinearGradient start={vec(4, stageTop)} end={vec(4, floorY)} colors={['#2b2d36', '#15161b']} />
        </Path>
        <Path path={geo.stage} color="#454854" style="stroke" strokeWidth={1.2} />
        {/* Guitarist on stage — a true ~1.7 m human next to the ~0.6 m cabinet. */}
        <Guitarist x={stageW * 0.6} footY={stageTop} scale={guitaristScale} tint={ACCENT_ORANGE} />
        {/* Cabinets: single flown box, OR the splayed line-array hang. */}
        {lineArray ? (
          arrayBoxes.map((b, i) => <CabinetSide key={i} x={b.x} y={b.y} tiltDeg={b.tilt} scale={boxScale} />)
        ) : (
          <CabinetSide x={spkX} y={spkY} tiltDeg={tiltDeg} scale={cabScale} />
        )}
        {delayOn ? <CabinetSide x={geo.dlyX} y={geo.dlyY} tiltDeg={48} scale={cabScale * 0.86} /> : null}
        {rearDelayOn ? <CabinetSide x={geo.rearX} y={geo.rearY} tiltDeg={62} scale={cabScale * 0.86} /> : null}
        {/* The audience: proportional line-art busts, tinted by coverage class. */}
        {(['gray', 'yellow', 'green', 'red'] as CoverageClass[]).map((k) => (
          <LineBusts key={k} path={geo.seats[k]} stroke={SEAT_LINE[k]} sw={1.7} />
        ))}
        {/* Delay-alignment race to the rear rows (conceptual timing). */}
        {rearDelayOn ? (
          <AlignmentOverlay
            phase={alignPhase}
            mainX={spkX}
            rearX={geo.rearX}
            targetX={rearTargetX}
            yTop={ceilY + 6}
            yBot={floorY - 2}
            aligned={timeAligned}
          />
        ) : null}
      </Group>
    </Canvas>
  );
}
