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
// Skin/hair tones for the human illustrations (owner: real skin gradients).
const SKIN_HI = '#8a6f5a';
const SKIN_MID = '#5d4a3c';
const SKIN_LO = '#2e2620';
const HAIR_HI = '#31343e';
const HAIR_LO = '#121318';
const ACCENT_ORANGE = '#ffa94d';

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

/** Human head in profile FACING RIGHT (+x), mouth open, origin at the mouth
 *  opening. Layered parts (owner 2026-07-29: a GENUINELY human profile —
 *  forehead, brow, nose, lips, chin, jaw, neck, ear, skull curve; smooth
 *  cubics, skin gradient + rim light, hair mass with its own gradient).
 *  `s` scales a ~52-px-tall base head. */
function buildHeadParts(s: number): {
  face: SkPathT;
  hair: SkPathT;
  hairSheen: SkPathT;
  ear: SkPathT;
  mouth: SkPathT;
  details: SkPathT;
  rim: SkPathT;
} {
  const face = Skia.Path.Make();
  face.moveTo(3.2 * s, -7.5 * s); // front of the upper lip (mouth open)
  face.cubicTo(5.8 * s, -8.6 * s, 5.2 * s, -10.4 * s, 2.6 * s, -10.8 * s); // upper lip → philtrum
  face.cubicTo(4.6 * s, -11.4 * s, 7.4 * s, -12.2 * s, 7.8 * s, -14.2 * s); // nostril wing → tip
  face.cubicTo(8.2 * s, -16.4 * s, 5.0 * s, -19.5 * s, 2.6 * s, -23.5 * s); // nose underside → bridge
  face.cubicTo(1.8 * s, -25.4 * s, 2.9 * s, -26.6 * s, 1.6 * s, -28.5 * s); // brow ridge
  face.cubicTo(0.2 * s, -31 * s, -3 * s, -34 * s, -8 * s, -35.6 * s); // forehead
  face.cubicTo(-14 * s, -37.6 * s, -21 * s, -37.2 * s, -26 * s, -33.4 * s); // crown
  face.cubicTo(-30.5 * s, -29.8 * s, -32 * s, -24 * s, -31 * s, -18 * s); // back of skull
  face.cubicTo(-30.2 * s, -12.5 * s, -27.5 * s, -7.5 * s, -25.5 * s, -2.5 * s); // occiput
  face.cubicTo(-24.5 * s, 0.5 * s, -23.5 * s, 4 * s, -23 * s, 8 * s); // nape
  face.lineTo(-22.5 * s, 15 * s); // back of the neck
  face.lineTo(-11.5 * s, 15 * s); // neck base
  face.cubicTo(-11 * s, 11 * s, -10 * s, 8.5 * s, -7.5 * s, 7.8 * s); // throat → under-jaw
  face.cubicTo(-3.5 * s, 9.8 * s, 1 * s, 8.8 * s, 3 * s, 6.4 * s); // jawline → chin
  face.cubicTo(5.4 * s, 5.2 * s, 5.6 * s, 2.6 * s, 3.6 * s, 1.6 * s); // chin ball
  face.cubicTo(5.6 * s, 0.6 * s, 5.4 * s, -1.4 * s, 2.8 * s, -2.2 * s); // lower lip
  face.cubicTo(0.4 * s, -3.4 * s, 0.4 * s, -6.2 * s, 3.2 * s, -7.5 * s); // open-mouth notch
  face.close();

  // Hair mass: crown + back of the skull, with an inner hairline curve.
  const hair = Skia.Path.Make();
  hair.moveTo(0.5 * s, -29.5 * s); // front hairline, above the brow
  hair.cubicTo(-2 * s, -33.5 * s, -8 * s, -37 * s, -14 * s, -37.9 * s);
  hair.cubicTo(-22 * s, -38.8 * s, -30.2 * s, -34 * s, -31.9 * s, -26 * s);
  hair.cubicTo(-33 * s, -19 * s, -31.5 * s, -11 * s, -28.5 * s, -4.6 * s); // down the back
  hair.lineTo(-24.6 * s, -6.4 * s);
  hair.cubicTo(-28.2 * s, -13 * s, -29.2 * s, -20 * s, -26.8 * s, -26.2 * s); // inner curve
  hair.cubicTo(-23.6 * s, -32.2 * s, -15.6 * s, -34.6 * s, -8.6 * s, -32.8 * s); // inner crown
  hair.cubicTo(-4.8 * s, -31.8 * s, -1.8 * s, -30.6 * s, 0.5 * s, -29.5 * s);
  hair.close();
  const hairSheen = Skia.Path.Make();
  hairSheen.moveTo(-6 * s, -34.4 * s);
  hairSheen.cubicTo(-13 * s, -36.4 * s, -21 * s, -35.6 * s, -26 * s, -30.6 * s);

  // Ear: a soft C tucked under the hair, mid-skull.
  const ear = Skia.Path.Make();
  ear.moveTo(-11.4 * s, -14.6 * s);
  ear.cubicTo(-8 * s, -14.4 * s, -7.8 * s, -8.6 * s, -11.8 * s, -7.8 * s);
  ear.cubicTo(-15.2 * s, -7.2 * s, -16 * s, -12 * s, -13.4 * s, -14.2 * s);
  ear.close();

  // Open-mouth interior (dark) — the head is speaking.
  const mouth = Skia.Path.Make();
  mouth.moveTo(2.9 * s, -7.1 * s);
  mouth.quadTo(0.9 * s, -5.8 * s, 0.9 * s, -4.6 * s);
  mouth.quadTo(0.9 * s, -3.4 * s, 2.6 * s, -2.6 * s);
  mouth.quadTo(1.9 * s, -4.9 * s, 2.9 * s, -7.1 * s);
  mouth.close();

  // Fine details: eye lid line + brow line + nostril + ear canal.
  const details = Skia.Path.Make();
  details.moveTo(1.6 * s, -24.4 * s); // eye
  details.quadTo(-0.6 * s, -25.4 * s, -2.8 * s, -24.4 * s);
  details.moveTo(2.4 * s, -27.2 * s); // brow
  details.quadTo(-0.4 * s, -28.4 * s, -3.2 * s, -27.4 * s);
  details.addOval(Skia.XYWHRect(3.4 * s, -13.2 * s, 1.9 * s, 1.3 * s)); // nostril
  details.moveTo(-12.6 * s, -12.6 * s); // ear canal fold
  details.quadTo(-10.8 * s, -11.4 * s, -12 * s, -9.6 * s);

  // Rim light: the lit front profile edge (light from the upper-left).
  const rim = Skia.Path.Make();
  rim.moveTo(2.8 * s, -10.9 * s);
  rim.cubicTo(4.8 * s, -11.5 * s, 7.4 * s, -12.2 * s, 7.8 * s, -14.2 * s);
  rim.cubicTo(8.2 * s, -16.4 * s, 5.0 * s, -19.5 * s, 2.6 * s, -23.5 * s);
  rim.cubicTo(1.8 * s, -25.4 * s, 2.9 * s, -26.6 * s, 1.6 * s, -28.5 * s);
  rim.cubicTo(0.2 * s, -31 * s, -3 * s, -34 * s, -8 * s, -35.6 * s);
  return { face, hair, hairSheen, ear, mouth, details, rim };
}

/** A rendered profile head (layered face + hair + ear + open mouth, skin
 *  gradient with rim light), facing along `angleRad` (0 = +x / right). */
function ProfileHead({
  x,
  y,
  angleRad,
  scale,
  tint,
  glow,
}: {
  x: number;
  y: number;
  angleRad: number;
  scale: number;
  tint: string;
  glow?: boolean;
}) {
  const parts = useMemo(() => buildHeadParts(scale), [scale]);
  const s = scale;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: angleRad }]}>
      {glow ? (
        <Path path={parts.face} color={tint} style="stroke" strokeWidth={5 * s} opacity={0.3}>
          <BlurMask blur={6 * s} style="normal" />
        </Path>
      ) : null}
      {/* Skin: warm form gradient, light from the upper-left. */}
      <Path path={parts.face}>
        <LinearGradient
          start={vec(-30 * s, -38 * s)}
          end={vec(10 * s, 15 * s)}
          colors={[SKIN_HI, SKIN_MID, SKIN_LO]}
          positions={[0, 0.55, 1]}
        />
      </Path>
      {/* Cheek/temple lift: a soft radial highlight. */}
      <Circle cx={-6 * s} cy={-17 * s} r={11 * s} color="#ffffff" opacity={0.06}>
        <BlurMask blur={7 * s} style="normal" />
      </Circle>
      {/* Ear (slightly darker skin) + its fold. */}
      <Path path={parts.ear}>
        <LinearGradient start={vec(-16 * s, -15 * s)} end={vec(-8 * s, -7 * s)} colors={[SKIN_MID, SKIN_LO]} />
      </Path>
      {/* Hair mass with its own darker gradient + a sheen arc. */}
      <Path path={parts.hair}>
        <LinearGradient start={vec(-28 * s, -38 * s)} end={vec(-10 * s, -4 * s)} colors={[HAIR_HI, HAIR_LO]} />
      </Path>
      <Path path={parts.hairSheen} color="#5a5f6e" style="stroke" strokeWidth={1.4 * s} opacity={0.5} />
      {/* Open mouth interior + feature lines. */}
      <Path path={parts.mouth} color="#170d0c" />
      <Path path={parts.details} color="#1c1410" style="stroke" strokeWidth={0.9 * s} opacity={0.85} />
      {/* Rim light along the lit profile + a whisper of state tint. */}
      <Path path={parts.rim} color="#f2dfc8" style="stroke" strokeWidth={1.1 * s} opacity={0.5} />
      <Path path={parts.face} color={tint} style="stroke" strokeWidth={1.1} opacity={0.45} />
    </Group>
  );
}

/** Head-and-shoulders bust appended to `p`; `x` = center, `y` = base line. */
function appendBust(p: SkPathT, x: number, y: number, s: number) {
  // Shoulders: a soft dome.
  p.moveTo(x - 8 * s, y);
  p.cubicTo(x - 8 * s, y - 5.5 * s, x - 5 * s, y - 8 * s, x - 2.4 * s, y - 8.6 * s);
  p.lineTo(x + 2.4 * s, y - 8.6 * s);
  p.cubicTo(x + 5 * s, y - 8 * s, x + 8 * s, y - 5.5 * s, x + 8 * s, y);
  p.close();
  // Head: a slightly egg-shaped oval on the shoulders.
  p.addOval(Skia.XYWHRect(x - 3.5 * s, y - 16.6 * s, 7 * s, 8.6 * s));
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
  return { palm, wrist, fingers, creases, thumb, thumbShade };
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
          {/* Thumb crossing at a natural diagonal, over the fingers. */}
          <Path path={parts.thumb}>
            <LinearGradient
              start={vec(-3.2 * s, -15.8 * s)}
              end={vec(20.5 * s, 5.5 * s)}
              colors={['#9c7d62', SKIN_MID, SKIN_LO]}
              positions={[0, 0.55, 1]}
            />
          </Path>
          <Path path={parts.thumbShade} color="#1c130d" style="stroke" strokeWidth={hair} opacity={0.5} />
          {/* State tint: a thin edge light that scales with the hand. */}
          <Path path={parts.thumb} color={tint} style="stroke" strokeWidth={hair} opacity={0.5} />
          {parts.fingers.map((f, i) => (
            <Path key={`t${i}`} path={f} color={tint} style="stroke" strokeWidth={hair * 0.9} opacity={0.4} />
          ))}
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

export function PolarPatternView({
  phase,
  width,
  height = 230,
  a,
  b,
  srcAngleDeg,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  a: number;
  b: number;
  /** Source angle: 0° = the mic's front (up); clockwise positive. */
  srcAngleDeg: number;
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
  const thSrc = (srcAngleDeg * Math.PI) / 180;
  const sx = cx + R * Math.sin(thSrc);
  const sy = cy - R * Math.cos(thSrc);
  const gain = polarGain(a, b, thSrc);
  const faceAngle = Math.atan2(cy - sy, cx - sx); // head faces the mic

  const pickupLine = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(sx, sy);
    p.lineTo(cx, cy);
    return p;
  }, [sx, sy, cx, cy]);

  // Ripples traveling source → mic (phase-continuous).
  const ripples = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const dist = Math.hypot(sx - cx, sy - cy);
    for (let i = 0; i < 3; i++) {
      const f = (ph / (2 * Math.PI) + i / 3) % 1;
      p.addCircle(sx, sy, 6 + f * dist);
    }
    return p;
  }, [phase, sx, sy, cx, cy]);

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
      <HandheldMic x={cx} y={cy - 6} angleDeg={0} grilleR={8} bodyLen={37} />
      {/* The source: a head in profile, mouth toward the mic. */}
      <ProfileHead x={sx} y={sy} angleRad={faceAngle} scale={0.4} tint={ACCENT_GREEN} glow />
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
      {/* Talker in profile, mouth at the wavefront origin. */}
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={0.52} tint={CONE} />
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
  const xOf = (f: number) => (Math.log(f / fLo) / Math.log(fHi / fLo)) * w;
  const yOf = (db: number) => 8 + ((ceilDb - Math.max(floorDb, Math.min(ceilDb, db))) / (ceilDb - floorDb)) * (h - 16);

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [100, 1000, 10000]) {
      p.moveTo(xOf(f), 4);
      p.lineTo(xOf(f), h - 4);
    }
    return p;
  }, [w, h]);

  const { curve, under } = useMemo(() => {
    const c = Skia.Path.Make();
    const u = Skia.Path.Make();
    const N = 110;
    for (let i = 0; i <= N; i++) {
      const f = fLo * Math.pow(fHi / fLo, i / N);
      const y = yOf(dbAt(f));
      const x = i === 0 ? 0 : xOf(f);
      if (i === 0) {
        c.moveTo(0, y);
        u.moveTo(0, y);
      } else {
        c.lineTo(x, y);
        u.lineTo(x, y);
      }
    }
    u.lineTo(w, h);
    u.lineTo(0, h);
    u.close();
    return { curve: c, under: u };
  }, [w, h, dbAt]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={grid} color={GHOST} style="stroke" strokeWidth={1} />
      <SkLine p1={{ x: 0, y: yOf(0) }} p2={{ x: w, y: yOf(0) }} color={GRID} strokeWidth={1.2} />
      {/* Gradient underfill lifts the curve off black (abstract, styled). */}
      <Path path={under}>
        <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={[withAlpha(color, 0.26), withAlpha(color, 0.02)]} />
      </Path>
      <GlowStroke path={curve} color={color} width={2.4} />
    </Canvas>
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
  const headX = 32; // ProfileHead origin = the mouth
  const GR = 9; // grille radius
  const LEN = 42; // body length → 1.72·9 + 42 = 57.5 ≈ 3.2 × the 18-px grille
  // Map inches → on-screen gap (mouth → grille), then EASE toward it.
  const gapPx = 16 + ((inches - 1) / 11) * Math.max(40, w - 150);
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
    const x0 = headX + 4;
    const x1 = micX.value - 12;
    const yD = mid + 34;
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
        {/* The singer, mouth toward the approaching mic. */}
        <ProfileHead x={headX} y={mid} angleRad={0} scale={0.56} tint={CONE} />
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
    p.moveTo(srcX + 14, mid);
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
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={0.42} tint={CONE} />
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
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={0.5} tint={CONE} />
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

export function ShockMountView({
  phase,
  width,
  height = 170,
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
  const floorY = h - 14;
  const topY = 34;
  const damp = shockMount ? 0.15 : 0.9;

  // The stand column: full vibration at the floor, `damp` of it at the mic.
  const stand = useDerivedValue(() => {
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const p = Skia.Path.Make();
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const y = floorY - f * (floorY - topY - 18);
      const off = base * (1 - f) + base * damp * f;
      if (i === 0) p.moveTo(cx + off, y);
      else p.lineTo(cx + off, y);
    }
    // Tripod legs riding the base offset.
    p.moveTo(cx + base - 26, floorY);
    p.lineTo(cx + base, floorY - 16);
    p.lineTo(cx + base + 26, floorY);
    return p;
  }, [phase, cx, floorY, topY, damp]);

  // Mic assembly (body + grille) riding the damped top of the stand.
  const micBody = useDerivedValue(() => {
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const micOff = base * damp;
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + micOff - 9, topY - 20, 18, 38), 8, 8));
    p.addCircle(cx + micOff, topY - 24, 9);
    return p;
  }, [phase, cx, topY, damp]);

  // Elastic cradle: suspension ring + visible bands (shock mount only).
  const cradle = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!shockMount) return p;
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const micOff = base * damp;
    const rx = 24;
    const ry = 30;
    const ringCx = cx + base * 0.55; // ring follows the stand more than the mic
    const ringCy = topY - 2;
    p.addOval(Skia.XYWHRect(ringCx - rx, ringCy - ry, rx * 2, ry * 2));
    // Elastic bands: ring → mic body (they stretch as the two move apart).
    for (const t of [-0.8, -0.3, 0.3, 0.8]) {
      const bandY = ringCy + t * ry * 0.86;
      const edge = rx * Math.sqrt(Math.max(0, 1 - Math.pow((bandY - ringCy) / ry, 2)));
      p.moveTo(ringCx - edge, bandY);
      p.lineTo(cx + micOff - 9, bandY);
      p.moveTo(ringCx + edge, bandY);
      p.lineTo(cx + micOff + 9, bandY);
    }
    return p;
  }, [phase, cx, topY, damp, shockMount]);

  const arrows = useMemo(() => {
    const p = Skia.Path.Make();
    for (const s of [-1, 1]) {
      p.moveTo(cx + s * 34, floorY - 12);
      p.lineTo(cx + s * 22, floorY - 8);
      p.moveTo(cx + s * 34, floorY - 4);
      p.lineTo(cx + s * 22, floorY - 8);
    }
    return p;
  }, [cx, floorY]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={floorY} h={h - floorY} />
      {/* Vibration source cue at the base. */}
      <GlowStroke path={arrows} color={ACCENT_RED} width={2} opacity={0.85} />
      <Path path={stand} style="stroke" strokeWidth={5} strokeJoin="round" strokeCap="round">
        <LinearGradient start={vec(cx - 6, 0)} end={vec(cx + 6, 0)} colors={[METAL_HI, METAL_LO]} />
      </Path>
      <Path path={cradle} color={ACCENT_GREEN} style="stroke" strokeWidth={2} opacity={0.9} />
      <Path path={micBody}>
        <LinearGradient start={vec(cx - 10, 0)} end={vec(cx + 10, 0)} colors={[METAL_LO, METAL_HI, METAL_LO]} positions={[0, 0.35, 1]} />
      </Path>
      <Path path={micBody} color="#565a66" style="stroke" strokeWidth={1} opacity={0.7} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 · Stereo techniques — XY · ORTF · AB · Mid-Side

export type StereoTech = 'xy' | 'ortf' | 'ab' | 'ms';

export function StereoTechniqueView({
  width,
  height = 190,
  tech,
}: {
  width: number;
  height?: number;
  tech: StereoTech;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h * 0.68;

  const layout = useMemo(() => {
    const R = h * 0.52;
    const mics: { x: number; y: number; ang: number }[] = [];
    const wedges: { x: number; y: number; path: SkPathT }[] = [];
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
      wedges.push({ x, y, path: p });
    };
    if (tech === 'xy') {
      mics.push({ x: cx, y: cy, ang: -45 }, { x: cx, y: cy, ang: 45 });
      wedge(cx, cy, -45, 70);
      wedge(cx, cy, 45, 70);
    } else if (tech === 'ortf') {
      mics.push({ x: cx - 20, y: cy, ang: -55 }, { x: cx + 20, y: cy, ang: 55 });
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
      mics.push({ x: cx - 62, y: cy, ang: 0 }, { x: cx + 62, y: cy, ang: 0 });
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
      mics.push({ x: cx, y: cy - 6, ang: 0 });
      wedge(cx, cy - 6, 0, 80);
      lobes.push({ x: cx - 26, y: cy + 10, r: 22 }, { x: cx + 26, y: cy + 10, r: 22 });
      // The side (figure-8) element: a small horizontal capsule.
      chrome.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 14, cy + 6, 28, 8), 4, 4));
    }
    return { mics, wedges, chrome, lobes, R };
  }, [cx, cy, h, tech]);

  const stage = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, 0, w, 24));
    return p;
  }, [w]);
  const performers = useMemo(() => {
    const p = Skia.Path.Make();
    for (const fx of [0.3, 0.5, 0.7]) appendBust(p, w * fx, 23, 1.15);
    return p;
  }, [w]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* The stage the pair is aimed at — with performers, not a bare line. */}
      <Path path={stage}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 24)} colors={['#1c1d24', '#111116']} />
      </Path>
      <Path path={performers}>
        <LinearGradient start={vec(0, 4)} end={vec(0, 24)} colors={['#4a4d58', '#26272e']} />
      </Path>
      <SkLine p1={{ x: 0, y: 24 }} p2={{ x: w, y: 24 }} color={withAlpha(WAVE, 0.4)} strokeWidth={1.2} />
      {/* Pickup areas: soft gradient wedges (abstract, styled). */}
      {layout.wedges.map((wd, i) => (
        <Path key={i} path={wd.path}>
          <RadialGradient c={vec(wd.x, wd.y)} r={layout.R} colors={[withAlpha(WAVE, 0.22), withAlpha(WAVE, 0)]} />
        </Path>
      ))}
      {layout.wedges.map((wd, i) => (
        <Path key={`s${i}`} path={wd.path} color={WAVE} style="stroke" strokeWidth={1.1} opacity={0.4} />
      ))}
      {/* Mid-Side fig-8 lobes. */}
      {layout.lobes.map((lb, i) => (
        <Circle key={i} cx={lb.x} cy={lb.y} r={lb.r}>
          <RadialGradient c={vec(lb.x, lb.y)} r={lb.r} colors={[withAlpha(ACCENT_BLUE, 0.22), withAlpha(ACCENT_BLUE, 0.02)]} />
        </Circle>
      ))}
      {layout.lobes.map((lb, i) => (
        <Circle key={`s${i}`} cx={lb.x} cy={lb.y} r={lb.r} color={ACCENT_BLUE} style="stroke" strokeWidth={1.2} opacity={0.5} />
      ))}
      <Path path={layout.chrome} color={CONE} style="stroke" strokeWidth={2} />
      {layout.mics.map((m, i) => (
        <PencilMic key={i} x={m.x} y={m.y} angleDeg={m.ang} scale={1.1} />
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
    const head = far ? { x: cx - 62, y: 30 } : { x: cx - 46, y: 34 };
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
        extras.addCircle(head.x + 16 + t * (mic.gx - head.x - 26), head.y + 10 + t * (mic.gy - head.y - 8), 1.6);
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
      <ProfileHead x={layout.head.x} y={layout.head.y} angleRad={0} scale={0.44} tint={outline} glow={good} />
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

// ── Jet colormap (heat-map rendering, owner directive 2026-07-29) ────────────
// Deep navy (below range / no coverage) → blue → cyan → green → yellow →
// orange → red (hottest). Piecewise-linear through 8 stops, quantized to 32
// buckets so each map renders as ~32 Skia paths, never thousands of nodes.

const JET_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0.0, rgb: [11, 28, 74] }, // #0b1c4a deep navy — no coverage
  { t: 0.14, rgb: [29, 63, 168] }, // blue
  { t: 0.28, rgb: [30, 125, 221] }, // azure
  { t: 0.42, rgb: [25, 199, 194] }, // cyan
  { t: 0.56, rgb: [63, 208, 108] }, // green — target range
  { t: 0.7, rgb: [232, 225, 58] }, // yellow
  { t: 0.84, rgb: [242, 140, 38] }, // orange
  { t: 1.0, rgb: [216, 31, 31] }, // #d81f1f red — hottest
];

/** Jet-style colormap: t01 ∈ [0,1] → CSS rgb() through the 8 stops above. */
export function jetColor(t01: number): string {
  const t = Math.max(0, Math.min(1, t01));
  let i = 0;
  while (i < JET_STOPS.length - 2 && t > JET_STOPS[i + 1].t) i++;
  const a = JET_STOPS[i];
  const b = JET_STOPS[i + 1];
  const f = (t - a.t) / (b.t - a.t);
  const mix = (k: 0 | 1 | 2) => Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * Math.max(0, Math.min(1, f)));
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
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

// ── Wavefront rings — life over the (static, memoized) heat maps ─────────────
// Expanding arcs emanate from each active speaker on the phase clock: eased
// radius, opacity fading as they travel. 3 staggered layers × 2 paths each
// (glow + line) — constant node count, all per-frame work in worklets.

type RingCenter = { x: number; y: number; dirDeg: number; maxR: number };

function RingLayer({
  phase,
  centers,
  spreadDeg,
  offset,
}: {
  phase: SharedValue<number>;
  centers: RingCenter[];
  spreadDeg: number;
  offset: number;
}) {
  const path = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI) + offset) % 1;
    const e = f * (2 - f); // ease-out
    const p = Skia.Path.Make();
    for (const c of centers) {
      const r = 7 + e * c.maxR;
      p.addArc({ x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r }, c.dirDeg - spreadDeg / 2, spreadDeg);
    }
    return p;
  }, [phase, centers, spreadDeg, offset]);
  const lineOp = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI) + offset) % 1;
    return 0.34 * (1 - f) * (1 - f);
  }, [phase, offset]);
  const glowOp = useDerivedValue(() => {
    const f = (phase.value / (2 * Math.PI) + offset) % 1;
    return 0.14 * (1 - f) * (1 - f);
  }, [phase, offset]);
  return (
    <>
      <Path path={path} color="#ffffff" style="stroke" strokeWidth={3.4} opacity={glowOp}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={path} color="#ffffff" style="stroke" strokeWidth={1.2} opacity={lineOp} />
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
      <RingLayer phase={phase} centers={centers} spreadDeg={spreadDeg} offset={0} />
      <RingLayer phase={phase} centers={centers} spreadDeg={spreadDeg} offset={1 / 3} />
      <RingLayer phase={phase} centers={centers} spreadDeg={spreadDeg} offset={2 / 3} />
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
function CabinetTop({ x, y, aimDeg, small }: { x: number; y: number; aimDeg: number; small?: boolean }) {
  const s = small ? 0.62 : 1;
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

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Stage strip with depth + a hint of the band. */}
      <Path path={stage}>
        <LinearGradient start={vec(0, 0)} end={vec(0, stageH)} colors={['#20212a', '#131318']} />
      </Path>
      <Path path={performers}>
        <LinearGradient start={vec(0, 4)} end={vec(0, stageH)} colors={['#464956', '#23242c']} />
      </Path>
      {/* Heat map: ≤32 quantized-jet bucket paths (abstract data — styled,
          kept honest: conceptual level, never an SPL prediction). */}
      {buckets.map((p, i) => (
        <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.92} />
      ))}
      {/* Wavefronts ripple across the field from each active speaker. */}
      <WavefrontRings phase={ringPhase} centers={ringCenters} spreadDeg={Math.min(170, hDeg + 30)} />
      <SkLine p1={{ x: 0, y: stageH }} p2={{ x: w, y: stageH }} color={GRID} strokeWidth={1.5} />
      <GlowStroke path={aims} color={PARTICLE} width={1.6} opacity={0.8} />
      {spkList.map((s, i) => (
        <CabinetTop key={i} x={s.x} y={s.y} aimDeg={s.aim} small={s.small} />
      ))}
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

const SEAT_GRADS: Record<CoverageClass, [string, string]> = {
  green: ['#7dffa1', '#20713d'],
  yellow: ['#ffe08f', '#7d6526'],
  red: ['#ff8a7d', '#7c332c'],
  gray: ['#9a9ca6', '#3a3c44'],
};

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
}) {
  const w = width;
  const h = height;
  const floorY = h - 16;
  const ceilY = 18 + (1 - ceil01) * 42;
  const stageW = 44;
  const stageTop = floorY - (16 + stage01 * 34);
  const spkX = 30;
  const spkY = stageTop - 8 - h01 * Math.max(10, stageTop - 8 - (ceilY + 12));

  const geo = useMemo(() => {
    const axis = (tiltDeg * Math.PI) / 180;
    const half = ((vDeg / 2) * Math.PI) / 180;
    const L = w * 1.2;

    // Main coverage wedge: a filled fan, plus its center-axis cue.
    const wedgeFill = Skia.Path.Make();
    wedgeFill.moveTo(spkX, spkY);
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const a = axis - half + ((2 * half) * i) / N;
      wedgeFill.lineTo(spkX + Math.cos(a) * L, spkY + Math.sin(a) * L);
    }
    wedgeFill.close();
    const axisLine = Skia.Path.Make();
    axisLine.moveTo(spkX, spkY);
    axisLine.lineTo(spkX + Math.cos(axis) * L, spkY + Math.sin(axis) * L);

    // Room lines.
    const room = Skia.Path.Make();
    room.moveTo(0, ceilY);
    room.lineTo(w, ceilY);

    // Stage block.
    const stage = Skia.Path.Make();
    stage.addRRect(Skia.RRectXY(Skia.XYWHRect(4, stageTop, stageW, floorY - stageTop), 3, 3));

    // Delay speaker (concept only): hung at ~60% depth, covering the rear.
    const audX0 = stageW + 26;
    const audW = depth01 * (w - audX0 - 14);
    const dlyX = audX0 + audW * 0.58;
    const dlyY = ceilY + 22;
    const delayWedge = Skia.Path.Make();
    if (delayOn) {
      // Fan between the two original delay-cone edges.
      const aA = Math.atan2(w * 0.34, w * 0.5); // shallow edge
      const aB = Math.atan2(w * 0.5, w * 0.16); // steep edge
      delayWedge.moveTo(dlyX, dlyY);
      const M = 10;
      for (let i = 0; i <= M; i++) {
        const a = aA + ((aB - aA) * i) / M;
        delayWedge.lineTo(dlyX + Math.cos(a) * w * 0.65, dlyY + Math.sin(a) * w * 0.65);
      }
      delayWedge.close();
    }

    // Seats: classified audience busts along the depth (SAME classification
    // math as always — only the drawing changed).
    const seatPaths: Record<CoverageClass, SkPathT> = {
      red: Skia.Path.Make(),
      green: Skia.Path.Make(),
      yellow: Skia.Path.Make(),
      gray: Skia.Path.Make(),
    };
    const NS = 9;
    for (let i = 0; i < NS; i++) {
      const sx = audX0 + ((i + 0.5) / NS) * audW;
      const rise = sloped ? (i / (NS - 1)) * 34 : 0;
      const hy = floorY - 14 - rise;
      const vx = sx - spkX;
      const vy = hy - spkY;
      const d = Math.hypot(vx, vy);
      const ang = Math.atan2(vy, vx); // downward positive
      const off = Math.abs(ang - axis);
      let cls: CoverageClass = off <= half ? 'green' : off <= half + (7 * Math.PI) / 180 ? 'yellow' : 'gray';
      // Hot zone: front rows blasted point-blank inside the core.
      if (cls === 'green' && d < w * 0.2) cls = 'red';
      // Delay speaker rescues the rear (concept only).
      if (delayOn && cls === 'gray' && sx > dlyX - 8) cls = 'green';
      appendBust(seatPaths[cls], sx, floorY - rise, 1.35);
    }
    return { wedgeFill, axisLine, room, stage, delayWedge, seats: seatPaths, dlyX, dlyY };
  }, [w, floorY, ceilY, stageTop, spkX, spkY, tiltDeg, vDeg, depth01, sloped, delayOn, stageW]);

  // Side-plane heat map (stage front → rear wall, ceiling → floor): the same
  // vertical-pattern × distance model, continuous, quantized-jet bucketed —
  // ≤32 Path nodes, rebuilt only when a drive parameter changes.
  const heat = useMemo(() => {
    const bucketPaths: SkPathT[] = Array.from({ length: JET_BUCKET_COUNT }, () => Skia.Path.Make());
    const x0 = stageW + 8;
    const x1 = w - 2;
    const y0 = ceilY + 4;
    const y1 = floorY;
    const srcs: { x: number; y: number; axis: number; half: number; refD: number; scale: number }[] = [
      { x: spkX, y: spkY, axis: (tiltDeg * Math.PI) / 180, half: vDeg / 2, refD: w * 0.5, scale: 1 },
    ];
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
  }, [w, ceilY, floorY, stageW, spkX, spkY, tiltDeg, vDeg, delayOn, geo.dlyX, geo.dlyY]);

  const ringPhase = usePhaseClock(true, 0.22);
  const ringCenters = useMemo<RingCenter[]>(() => {
    const r: RingCenter[] = [{ x: spkX, y: spkY, dirDeg: tiltDeg, maxR: w * 0.85 }];
    if (delayOn) r.push({ x: geo.dlyX, y: geo.dlyY, dirDeg: 53, maxR: w * 0.5 });
    return r;
  }, [spkX, spkY, tiltDeg, w, delayOn, geo.dlyX, geo.dlyY]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Room: ceiling line + gradient floor. */}
      <Path path={geo.room} color={GRID} style="stroke" strokeWidth={1.6} />
      <Floor w={w} y={floorY} h={h - floorY} />
      {/* Heat map: the vertical beam glows in the field (≤32 bucket paths). */}
      {heat.map((p, i) => (
        <Path key={i} path={p} color={JET_BUCKETS[i]} opacity={0.92} />
      ))}
      {/* Wavefronts ripple down the beam. */}
      <WavefrontRings phase={ringPhase} centers={ringCenters} spreadDeg={Math.min(170, vDeg + 30)} />
      {/* Wedge edge + axis cues stay as thin overlays on the heat field. */}
      <Path path={geo.wedgeFill} color={WAVE} style="stroke" strokeWidth={1} opacity={0.28} />
      <GlowStroke path={geo.axisLine} color={WAVE} width={1.4} opacity={0.6} />
      {delayOn ? (
        <Path path={geo.delayWedge} color={ACCENT_BLUE} style="stroke" strokeWidth={1} opacity={0.3} />
      ) : null}
      {/* Stage block. */}
      <Path path={geo.stage}>
        <LinearGradient start={vec(4, stageTop)} end={vec(4, floorY)} colors={['#2b2d36', '#15161b']} />
      </Path>
      <Path path={geo.stage} color="#454854" style="stroke" strokeWidth={1.2} />
      {/* Cabinets: main (tilted with the wedge) + optional delay box. */}
      <CabinetSide x={spkX} y={spkY} tiltDeg={tiltDeg} />
      {delayOn ? <CabinetSide x={geo.dlyX} y={geo.dlyY} tiltDeg={48} scale={0.72} /> : null}
      {/* The audience: coverage-tinted busts ON TOP of the heat field, with a
          dark outline so they never vanish against hot colors. */}
      {(['gray', 'yellow', 'green', 'red'] as CoverageClass[]).map((k) => (
        <Group key={k}>
          <Path path={geo.seats[k]} color="#0a0a0e" style="stroke" strokeWidth={2.6} opacity={0.85} />
          <Path path={geo.seats[k]}>
            <LinearGradient start={vec(0, floorY - 58)} end={vec(0, floorY)} colors={SEAT_GRADS[k]} />
          </Path>
        </Group>
      ))}
    </Canvas>
  );
}
