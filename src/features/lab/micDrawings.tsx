/**
 * CANONICAL MICROPHONE DRAWINGS — one high-quality illustration per mic type,
 * drawn ONCE here and shared everywhere a mic appears (owner ruling 2026-08-28:
 * "There are several key types of mics. 1) handheld, 2) vertical large diaphragm
 * condenser. Each should have a high quality drawing that is shared and used.")
 *
 * Before this module the app drew mics in several places at different quality:
 * micspeaker/viz.tsx had a good parametric handheld, micselect/micArt.tsx had a
 * flatter catalogue handheld plus an LDC, and the shock-mount scene drew its own
 * plain basket + body. Now both types live here and every call site composes the
 * same art.
 *
 * HOUSE RULE (assistant memory `icon-quality-rule`): icons and equipment art are
 * ILLUSTRATIONS — layered gradient-filled paths, light from the upper-left,
 * specular highlights, real proportions. Never a stick-and-circle glyph.
 *
 * CONVENTIONS (identical for both mics, so call sites are interchangeable):
 *   • LOCAL coords: the acoustic FRONT of the mic sits at the origin (0,0) —
 *     the grille-ball centre for the handheld, the head-basket centre for the
 *     condenser — and the body extends toward +y (behind the front).
 *   • `angleDeg` uses the lab convention front = (sin θ, −cos θ), i.e. 0° = the
 *     mic points UP the screen. Same as the old HandheldMic, so existing call
 *     sites keep their angles.
 *   • Geometry is pure (no clocks). To animate one, wrap it in a Skia <Group>
 *     with an animated transform — see ShockMountView.
 */
import { useMemo } from 'react';
import { AmbiTetraMic, BlimpMic, DmsClusterMic, DummyHeadMic, LavalierMic, ShotgunMic } from './micDrawingsField';
import { BroadcastDynamicMic } from './micDrawingsBroadcast';
import { HeadsetBoomCapsule, LipRibbonMic, MicFlag } from './micDrawingsSport';
import { ParabolicDishMic } from './micDrawingsDish';
import { RibbonMic } from './micDrawingsRibbon';
import {
  BlurMask,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';

type SkPathT = ReturnType<typeof Skia.Path.Make>;

// Illustration tones — light source upper-left (house scene convention).
const METAL_HI = '#c6cad4';
const METAL_MID = '#7c7f89';
const METAL_LO = '#3a3c44';
const ACCENT = '#ffc64d';

// ─────────────────────────────────────────────────────────────────────────────
// 1 · HANDHELD VOCAL MIC (dynamic, ball grille) — the SM-class silhouette.

/** Handheld parts, LOCAL coords: grille sphere centred at the origin, tapered
 *  body extending toward +y (behind the grille).
 *
 *  ART PASS s9 (2026-10-10). The class, in mm (the common ball-grille vocal
 *  dynamic): overall ≈ 162; a woven-wire BALL GRILLE Ø ≈ 51 whose lower part
 *  runs straight down as a short skirt (≈ Ø 44) into a dark JOINT RING; the
 *  HANDLE Ø ≈ 37 under the ring, tapering (slightly concave) to Ø ≈ 24; a
 *  short XLR END collar with a parting groove. No badge, no brand band. The
 *  overall length stays 1.72·gr + len (handheldTotalLen). */
function buildHandheldMic(gr: number, len: number) {
  const y0 = gr * 0.72; // (layout) where the handle length is counted from
  const y1 = y0 + len; // the tail
  const skirtTop = gr * 0.5; // where the ball turns into the straight skirt
  const skirtX = gr * Math.sqrt(1 - 0.25);
  const ringTop = gr * 0.9;
  const ringBot = gr * 1.06;
  const topW = gr * 0.74; // handle half-width under the ring (Ø 37 on a Ø 51 ball)
  const botW = gr * 0.47; // handle half-width at the tail (Ø 24)
  const tailTop = y1 - gr * 0.5; // the XLR end collar begins
  const grille = Skia.Path.Make();
  grille.moveTo(-skirtX, skirtTop);
  grille.arcToOval(Skia.XYWHRect(-gr, -gr, gr * 2, gr * 2), 150, 240, false);
  grille.lineTo(gr * 0.84, ringTop);
  grille.lineTo(-gr * 0.84, ringTop);
  grille.close();
  const ring = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-gr * 0.86, ringTop - gr * 0.02, gr * 1.72, ringBot - ringTop + gr * 0.02), gr * 0.05, gr * 0.05));
  // The handle: concave taper (quick at the top, then nearly straight).
  const body = Skia.Path.Make();
  const hl = tailTop - ringBot;
  body.moveTo(-topW, ringBot);
  body.cubicTo(-topW * 0.93, ringBot + hl * 0.28, -botW * 1.08, ringBot + hl * 0.55, -botW, tailTop);
  body.lineTo(botW, tailTop);
  body.cubicTo(botW * 1.08, ringBot + hl * 0.55, topW * 0.93, ringBot + hl * 0.28, topW, ringBot);
  body.close();
  // The XLR end collar: a hair narrower, a parting groove, a rounded end.
  const tail = Skia.Path.Make();
  tail.addRRect(Skia.RRectXY(Skia.XYWHRect(-botW * 0.96, tailTop, botW * 1.92, y1 - tailTop), gr * 0.1, gr * 0.1));
  const grooves = Skia.Path.Make();
  grooves.moveTo(-botW * 0.95, tailTop + (y1 - tailTop) * 0.32);
  grooves.lineTo(botW * 0.95, tailTop + (y1 - tailTop) * 0.32);
  // Woven-wire mesh: a fine diagonal weave, clipped to the grille.
  const mesh = crossHatch(-gr, -gr, gr, ringTop, Math.max(0.9, gr * 0.115));
  // The skirt's top edge (where the ball's dome meets its straight wall).
  const seam = Skia.Path.Make();
  seam.moveTo(-skirtX * 0.99, skirtTop);
  seam.quadTo(0, skirtTop + gr * 0.12, skirtX * 0.99, skirtTop);
  const shadow = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(tail);
  return { grille, ring, body, tail, grooves, mesh, seam, shadow, y0, y1, ringTop };
}

/** Total drawn length of a handheld, front tip → tail (layout helper). */
export function handheldTotalLen(grilleR: number, bodyLen: number): number {
  return 1.72 * grilleR + bodyLen;
}

/**
 * HANDHELD VOCAL MIC. `x,y` = grille CENTRE; body extends behind it.
 * Spherical mesh grille + specular highlight over a tapered metal-sheen body.
 */
export function HandheldMic({
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
  const hair = Math.max(0.35, gr * 0.03);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      {/* A soft lift shadow. */}
      <Group transform={[{ translateX: gr * 0.1 }, { translateY: gr * 0.1 }]}>
        <Path path={parts.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={gr * 0.16} style="normal" />
        </Path>
      </Group>
      {/* The handle: satin charcoal metal, a long specular band, lit upper-left. */}
      <Path path={parts.body}>
        <LinearGradient
          start={vec(-gr * 0.8, 0)}
          end={vec(gr * 0.8, 0)}
          colors={['#24262c', '#7d828c', '#b4b9c3', '#5a5e67', '#2a2c32', '#16171b']}
          positions={[0, 0.2, 0.32, 0.55, 0.82, 1]}
        />
      </Path>
      <Path path={parts.tail}>
        <LinearGradient start={vec(-gr * 0.5, 0)} end={vec(gr * 0.5, 0)} colors={['#1c1d22', '#6a6e78', '#33363d', '#141519']} positions={[0, 0.3, 0.62, 1]} />
      </Path>
      <Path path={parts.grooves} style="stroke" strokeWidth={hair} color="#0b0c0f" opacity={0.85} />
      <Path path={parts.body} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.85} />
      {/* The dark joint ring under the grille. */}
      <Path path={parts.ring}>
        <LinearGradient start={vec(-gr * 0.86, 0)} end={vec(gr * 0.86, 0)} colors={['#141519', '#5d616b', '#26282e', '#0d0e11']} positions={[0, 0.3, 0.6, 1]} />
      </Path>
      {/* Ball grille: the dark foam behind a bright woven mesh, then the weave. */}
      <Path path={parts.grille}>
        <RadialGradient c={vec(-gr * 0.35, -gr * 0.4)} r={gr * 1.75} colors={['#e3e6ec', '#a9aeb8', '#62666f', '#2a2c32']} positions={[0, 0.3, 0.68, 1]} />
      </Path>
      <Group clip={parts.grille}>
        <Path path={parts.mesh} color="#16171c" style="stroke" strokeWidth={Math.max(0.3, gr * 0.035)} opacity={0.6} />
        <Path path={parts.seam} color="#16171c" style="stroke" strokeWidth={Math.max(0.4, gr * 0.05)} opacity={0.45} />
      </Group>
      <Path path={parts.grille} style="stroke" strokeWidth={hair * 1.3} color="#0a0a0d" opacity={0.85} />
      {/* Specular hotspot on the dome: soft bloom + crisp core. */}
      <Circle cx={-gr * 0.34} cy={-gr * 0.42} r={gr * 0.3} color="#ffffff" opacity={0.35}>
        <BlurMask blur={gr * 0.28} style="normal" />
      </Circle>
      <Circle cx={-gr * 0.36} cy={-gr * 0.44} r={gr * 0.09} color="#ffffff" opacity={0.7} />
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · VERTICAL LARGE-DIAPHRAGM CONDENSER — the studio U-class silhouette:
// a rounded-rect head basket of dual-layer wire mesh with the capsule visible
// behind it, over a brushed body with a badge and pad/roll-off switches.

/** Condenser parts, LOCAL coords: head-basket CENTRE at the origin, body
 *  extending toward +y. `hr` = head half-width. */
function buildCondenserMic(hr: number, bodyLen: number) {
  const headH = hr * 2.3; // basket is taller than wide (LDC proportion)
  const headTop = -headH / 2;
  const headBot = headH / 2;
  const bodyW = hr * 0.86; // body is narrower than the basket
  const bodyTop = headBot - hr * 0.06;
  const bodyBot = bodyTop + bodyLen;

  const head: SkPathT = Skia.Path.Make();
  head.addRRect(Skia.RRectXY(Skia.XYWHRect(-hr, headTop, hr * 2, headH), hr * 0.62, hr * 0.62));

  // Dual-layer wire mesh: verticals + horizontals, clipped to the basket by
  // drawing them only within the rounded-rect's inset.
  const mesh: SkPathT = Skia.Path.Make();
  const mx = hr * 0.84;
  const myTop = headTop + hr * 0.2;
  const myBot = headBot - hr * 0.2;
  for (let i = -3; i <= 3; i++) {
    const px = (i / 3.4) * mx;
    const shrink = Math.sqrt(Math.max(0, 1 - Math.pow(px / (hr * 1.02), 2)));
    mesh.moveTo(px, myTop + hr * 0.12 * (1 - shrink));
    mesh.lineTo(px, myBot - hr * 0.12 * (1 - shrink));
  }
  for (let i = -4; i <= 4; i++) {
    const py = (i / 4.6) * (headH / 2 - hr * 0.16);
    const hw = mx * Math.sqrt(Math.max(0, 1 - Math.pow(py / (headH / 2), 2) * 0.35));
    mesh.moveTo(-hw, py);
    mesh.lineTo(hw, py);
  }

  // Body: a stadium with a squared shoulder under the basket.
  const body: SkPathT = Skia.Path.Make();
  body.addRRect(
    Skia.RRectXY(Skia.XYWHRect(-bodyW, bodyTop, bodyW * 2, bodyLen), bodyW * 0.34, bodyW * 0.34),
  );
  // Shoulder collar where basket meets body.
  const collar: SkPathT = Skia.Path.Make();
  collar.addRRect(
    Skia.RRectXY(Skia.XYWHRect(-hr * 0.94, headBot - hr * 0.1, hr * 1.88, hr * 0.3), hr * 0.1, hr * 0.1),
  );
  // Badge band + the two small pad / roll-off switch dots below it.
  const badge: SkPathT = Skia.Path.Make();
  const badgeY = bodyTop + bodyLen * 0.34;
  badge.addRRect(
    Skia.RRectXY(Skia.XYWHRect(-bodyW * 0.52, badgeY, bodyW * 1.04, hr * 0.2), hr * 0.06, hr * 0.06),
  );
  // XLR base collar at the tail.
  const base: SkPathT = Skia.Path.Make();
  base.addRRect(
    Skia.RRectXY(Skia.XYWHRect(-bodyW * 0.82, bodyBot - hr * 0.34, bodyW * 1.64, hr * 0.34), hr * 0.08, hr * 0.08),
  );
  return {
    head,
    mesh,
    body,
    collar,
    badge,
    base,
    headTop,
    headBot,
    bodyBot,
    bodyW,
    switchY: badgeY + hr * 0.5,
  };
}

/** Total drawn length of a condenser, basket top → base (layout helper). */
export function condenserTotalLen(headR: number, bodyLen: number): number {
  return headR * 1.15 + bodyLen;
}

/**
 * VERTICAL LARGE-DIAPHRAGM CONDENSER. `x,y` = head-basket CENTRE (the acoustic
 * front, so it lines up with HandheldMic's grille centre); body extends behind.
 */
export function CondenserMic({
  x,
  y,
  angleDeg = 0,
  headR,
  bodyLen,
}: {
  x: number;
  y: number;
  angleDeg?: number;
  headR: number;
  bodyLen: number;
}) {
  const hr = headR;
  const p = useMemo(() => buildCondenserMic(hr, bodyLen), [hr, bodyLen]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      {/* Body — brushed metal, lit upper-left. */}
      <Path path={p.body}>
        <LinearGradient
          start={vec(-p.bodyW, 0)}
          end={vec(p.bodyW, 0)}
          colors={[METAL_LO, METAL_HI, METAL_MID, '#2b2d34']}
          positions={[0, 0.26, 0.56, 1]}
        />
      </Path>
      {/* The front-side plate (plain, no logo — it only marks the address
          side) + the pad / roll-off switches. */}
      <Path path={p.badge} color="#1d1f25" opacity={0.85} />
      <Path path={p.badge} style="stroke" strokeWidth={Math.max(0.4, hr * 0.025)} color="#c9ced8" opacity={0.35} />
      <Circle cx={-p.bodyW * 0.3} cy={p.switchY} r={hr * 0.09} color="#15161b" />
      <Circle cx={p.bodyW * 0.3} cy={p.switchY} r={hr * 0.09} color="#15161b" />
      {/* XLR base collar. */}
      <Path path={p.base}>
        <LinearGradient
          start={vec(-p.bodyW * 0.8, 0)}
          end={vec(p.bodyW * 0.8, 0)}
          colors={['#23242b', '#585c68', '#1c1d23']}
          positions={[0, 0.32, 1]}
        />
      </Path>
      {/* Shoulder collar under the basket. */}
      <Path path={p.collar}>
        <LinearGradient start={vec(-hr, 0)} end={vec(hr, 0)} colors={['#3a3c44', '#9ba0ac', '#33343c']} />
      </Path>
      {/* Head basket: metal shell, capsule shadow behind the mesh, then mesh. */}
      <Path path={p.head}>
        <LinearGradient
          start={vec(-hr, p.headTop)}
          end={vec(hr, p.headBot)}
          colors={['#c9ccd5', '#7f838d', '#2f3037']}
          positions={[0, 0.45, 1]}
        />
      </Path>
      {/* The large diaphragm itself, seen through the grille — the whole point
          of an LDC, so it reads as a real capsule and not a blank patch. */}
      <Circle cx={0} cy={-hr * 0.12} r={hr * 0.58} color="#0e0f13" opacity={0.86} />
      <Circle cx={0} cy={-hr * 0.12} r={hr * 0.58} style="stroke" strokeWidth={Math.max(0.6, hr * 0.05)} color="#b9912f" opacity={0.55} />
      <Circle cx={-hr * 0.18} cy={-hr * 0.3} r={hr * 0.16} color="#ffffff" opacity={0.16}>
        <BlurMask blur={hr * 0.18} style="normal" />
      </Circle>
      {/* Dual-layer wire mesh over it. */}
      <Path path={p.mesh} color="#0f1015" style="stroke" strokeWidth={Math.max(0.5, hr * 0.05)} opacity={0.5} />
      {/* Basket rim + specular sweep down the left shoulder. */}
      <Path path={p.head} style="stroke" strokeWidth={Math.max(0.6, hr * 0.05)} color="#d5d9e2" opacity={0.35} />
      <Circle cx={-hr * 0.42} cy={-hr * 0.62} r={hr * 0.3} color="#ffffff" opacity={0.4}>
        <BlurMask blur={hr * 0.28} style="normal" />
      </Circle>
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · KICK-TYPE MICS (Miking Labs, 2026-10-04): an END-ADDRESS KICK DYNAMIC, a
// SMALL-CAPSULE CONDENSER and a BOUNDARY PLATE. GENERIC silhouettes at the
// overall sizes their cited examples document (docs/labs/miking/kick/
// SOURCES.md §d) — never a brand's likeness, no logos, no brand colours. Same
// conventions as above: the mic's FRONT (grille front; the element end of a
// boundary plate) sits at the origin and the body extends toward +y; sizes are
// in the caller's units (the Miking scenes draw in millimetres).
//
// ART PASS (2026-10-04): mesh grilles clipped to their baskets, a chrome
// joint ring, a tapered satin body, the XLR tail, a soft lift shadow and rim
// light. LIGHT: in the Miking scenes a mic aimed at a head (−x) is turned so
// its local +x points UP the screen, so the lit side is local +x and the
// shadow falls toward local −x. Every outline stays inside the documented
// envelope: width 2r (or `cross`), length `len` — the drawing never claims a
// size the collision model does not use.

/** Local-space light: lit at +x, shadow at −x (see the note above). */
const LIT = (r: number) => ({ start: vec(r, 0), end: vec(-r, 0) });

function crossHatch(x0: number, y0: number, x1: number, y1: number, step: number): SkPathT {
  const p: SkPathT = Skia.Path.Make();
  const w = x1 - x0;
  const h = y1 - y0;
  for (let d = -h; d < w; d += step) {
    p.moveTo(x0 + d, y0);
    p.lineTo(x0 + d + h, y1);
    p.moveTo(x0 + d + h, y0);
    p.lineTo(x0 + d, y1);
  }
  return p;
}

function buildKickDynamic(r: number, len: number) {
  // A large domed basket (≈ 47 % of the length), a chrome joint ring, then a
  // short body tapering to the XLR tail with a stand-adapter collar.
  const gl = len * 0.47;
  const sh = Math.min(gl * 0.7, r * 0.55); // where the dome meets the straight basket
  const grille: SkPathT = Skia.Path.Make();
  grille.moveTo(-r * 0.97, gl);
  grille.lineTo(-r, sh);
  grille.cubicTo(-r, sh * 0.32, -r * 0.6, 0, 0, 0);
  grille.cubicTo(r * 0.6, 0, r, sh * 0.32, r, sh);
  grille.lineTo(r * 0.97, gl);
  grille.close();
  const mesh = crossHatch(-r, 0, r, gl, Math.max(1.2, r * 0.13));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, gl - r * 0.04, r * 2, r * 0.16), r * 0.05, r * 0.05));
  const b0 = gl + r * 0.12;
  const tailTop = len - r * 0.3;
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.94, b0);
  body.cubicTo(-r * 0.92, b0 + (tailTop - b0) * 0.55, -r * 0.66, tailTop - r * 0.06, -r * 0.5, tailTop);
  body.lineTo(r * 0.5, tailTop);
  body.cubicTo(r * 0.66, tailTop - r * 0.06, r * 0.92, b0 + (tailTop - b0) * 0.55, r * 0.94, b0);
  body.close();
  const collar: SkPathT = Skia.Path.Make();
  const cy = b0 + (tailTop - b0) * 0.42;
  collar.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.86, cy, r * 1.72, r * 0.15), r * 0.04, r * 0.04));
  const tail: SkPathT = Skia.Path.Make();
  tail.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.4, tailTop - r * 0.02, r * 0.8, len - tailTop + r * 0.02), r * 0.09, r * 0.09));
  const grooves: SkPathT = Skia.Path.Make();
  for (const t of [0.35, 0.65]) {
    const y = tailTop + (len - tailTop) * t;
    grooves.moveTo(-r * 0.38, y);
    grooves.lineTo(r * 0.38, y);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(tail);
  return { grille, mesh, ring, body, collar, tail, grooves, shadow, gl, sh, b0, tailTop };
}

/** END-ADDRESS KICK DYNAMIC: radius `r`, overall length `len`, front at the origin. */
export function KickDynamicMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildKickDynamic(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.022);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      {/* Lift shadow, falling away from the light. */}
      <Group transform={[{ translateX: -r * 0.1 }, { translateY: r * 0.08 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.55}>
          <BlurMask blur={r * 0.14} style="normal" />
        </Path>
      </Group>
      {/* Body: dark satin, tapered; the stand-adapter collar; the XLR tail. */}
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#6a6f7a', '#3b3f48', '#23252b', '#121317']} positions={[0, 0.3, 0.65, 1]} />
      </Path>
      <Path path={p.collar}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#8f949f', '#454952', '#1c1d22']} />
      </Path>
      <Path path={p.tail}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9aa0ab', '#4f535c', '#1f2126']} />
      </Path>
      <Path path={p.grooves} style="stroke" strokeWidth={hair} color="#0d0e11" opacity={0.8} />
      {/* Basket: a dark interior under a fine wire crosshatch, lit at the shoulder. */}
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9ba1ac', '#4c515b', '#1b1d22']} positions={[0, 0.45, 1]} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.3, r * 0.03)} color="#0c0d10" opacity={0.75} />
        <Circle cx={r * 0.45} cy={p.sh * 0.75} r={r * 0.45} color="#ffffff" opacity={0.18}>
          <BlurMask blur={r * 0.3} style="normal" />
        </Circle>
      </Group>
      <Path path={p.ring}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#f4f6fa', '#9aa0ab', '#3a3d45']} />
      </Path>
      {/* Edges: a crisp dark outline, and a rim light on the lit side. */}
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.35} />
    </Group>
  );
}

function buildSdc(r: number, len: number) {
  // ART PASS s9 (2026-10-10). The pencil condenser, in mm (the common small-
  // diaphragm class: Ø 19–22 × 104–125, e.g. Ø 22 × 107): the CAPSULE HEAD
  // at the front — a mesh cap ≈ 18 % of the length with a flat, slightly
  // rounded front; behind it the cardioid's REAR-VENT band (a row of short
  // slots, ≈ 6 %); a fine thread seam; then the satin TUBE (the preamp) at
  // the full diameter to the XLR END, whose collar shows a parting groove
  // ≈ 12 % from the tail. The capsule end is the origin, the XLR end +y.
  const gl = len * 0.18;
  const vl = len * 0.065;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.97, 0, r * 1.94, gl), r * 0.3, r * 0.3));
  const mesh = crossHatch(-r, 0, r, gl, Math.max(0.8, r * 0.17));
  // The vent band and its slots (seen on the near side: 3 across).
  const vent: SkPathT = Skia.Path.Make();
  vent.addRect(Skia.XYWHRect(-r * 0.97, gl, r * 1.94, vl));
  const slots: SkPathT = Skia.Path.Make();
  for (const k of [-0.6, -0.2, 0.2, 0.6]) slots.addRRect(Skia.RRectXY(Skia.XYWHRect(r * k - r * 0.1, gl + vl * 0.22, r * 0.2, vl * 0.56), r * 0.08, r * 0.08));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRect(Skia.XYWHRect(-r, gl + vl - len * 0.004, r * 2, len * 0.012));
  const b0 = gl + vl + len * 0.008;
  const body: SkPathT = Skia.Path.Make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, b0, r * 2, len - b0), r * 0.16, r * 0.16));
  const grooves: SkPathT = Skia.Path.Make();
  for (const t of [0.88]) {
    grooves.moveTo(-r * 0.98, len * t);
    grooves.lineTo(r * 0.98, len * t);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(vent);
  return { grille, mesh, vent, slots, ring, body, grooves, shadow, gl };
}

/** SMALL-CAPSULE CONDENSER: radius `r`, length `len`, front at the origin. */
export function SdcMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildSdc(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.03);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.1 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.5}>
          <BlurMask blur={r * 0.18} style="normal" />
        </Path>
      </Group>
      {/* The tube: satin nickel, a long specular band on the lit side. */}
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9ea3ad', '#eef0f4', '#c4c8d0', '#80858f', '#3a3d45']} positions={[0, 0.16, 0.34, 0.68, 1]} />
      </Path>
      <Path path={p.grooves} style="stroke" strokeWidth={hair} color="#24262c" opacity={0.8} />
      <Path path={p.vent}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c9ced8', '#8a8f99', '#3e4149']} />
      </Path>
      <Path path={p.slots} color="#0b0c0f" opacity={0.9} />
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c3c7cf', '#7d828c', '#2a2c32']} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.25, r * 0.04)} color="#0c0d10" opacity={0.7} />
      </Group>
      <Path path={p.ring} color="#2a2c32" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
      <Path path={p.vent} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.7} />
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}

function buildBoundary(len: number, cross: number) {
  const plate: SkPathT = Skia.Path.Make();
  const profile = cross <= 40; // seen edge-on (the side view): a low wedge
  if (profile) {
    // Local +x is the plate's TOP face (away from the surface it rests on):
    // a low nose at the element end, a flat top, a sloped rear to the cable.
    const lo = -cross / 2;
    const hi = cross / 2;
    plate.moveTo(lo, 0);
    plate.lineTo(lo + cross * 0.35, 0);
    plate.cubicTo(hi - cross * 0.1, len * 0.04, hi, len * 0.12, hi, len * 0.2);
    plate.lineTo(hi, len * 0.8);
    plate.cubicTo(hi, len * 0.9, lo + cross * 0.55, len, lo + cross * 0.35, len);
    plate.lineTo(lo, len);
    plate.close();
  } else {
    plate.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross / 2, 0, cross, len), Math.min(cross, len) * 0.2, Math.min(cross, len) * 0.2));
  }
  // The grille field near the element end; a perforated pattern in plan,
  // a perforated edge band in profile.
  const grille: SkPathT = Skia.Path.Make();
  const holes: SkPathT = Skia.Path.Make();
  if (profile) {
    grille.addRect(Skia.XYWHRect(cross / 2 - cross * 0.16, len * 0.2, cross * 0.16, len * 0.32));
    for (let yy = len * 0.22; yy < len * 0.5; yy += Math.max(1.6, len * 0.025)) holes.addCircle(cross / 2 - cross * 0.08, yy, Math.max(0.35, cross * 0.03));
  } else {
    grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross * 0.36, len * 0.07, cross * 0.72, len * 0.4), cross * 0.1, cross * 0.1));
    const step = Math.max(2, cross * 0.06);
    for (let yy = len * 0.07 + step * 0.7; yy < len * 0.47 - step * 0.4; yy += step) {
      for (let xx = -cross * 0.36 + step * 0.7; xx < cross * 0.36 - step * 0.4; xx += step) holes.addCircle(xx, yy, Math.max(0.35, step * 0.24));
    }
  }
  // The connector boss and a cable leaving the rear (ILLUSTRATIVE run).
  const boss: SkPathT = Skia.Path.Make();
  const cable: SkPathT = Skia.Path.Make();
  if (profile) {
    boss.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross / 2, len * 0.9, cross * 0.45, len * 0.1), cross * 0.08, cross * 0.08));
    cable.moveTo(-cross / 2 + cross * 0.22, len);
    cable.cubicTo(-cross / 2 + cross * 0.22, len + len * 0.12, -cross / 2 + cross * 0.05, len + len * 0.16, -cross / 2 + cross * 0.05, len + len * 0.3);
  } else {
    boss.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross * 0.14, len * 0.88, cross * 0.28, len * 0.12), cross * 0.04, cross * 0.04));
    cable.moveTo(0, len);
    cable.cubicTo(0, len + len * 0.1, cross * 0.08, len + len * 0.16, cross * 0.08, len + len * 0.3);
  }
  return { plate, grille, holes, boss, cable, profile };
}

/** BOUNDARY PLATE: `len` along its axis, `cross` = the visible cross size
 *  (its height in a side view, its width from above); element end at the origin. */
export function BoundaryMic({ len, cross, x = 0, y = 0, angleDeg = 0, tint }: { len: number; cross: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildBoundary(len, cross), [len, cross]);
  const hair = Math.max(0.35, Math.min(cross, len) * 0.025);
  const lit = LIT(cross / 2);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: -cross * 0.06 }, { translateY: len * 0.03 }]}>
        <Path path={p.plate} color="#000000" opacity={0.55}>
          <BlurMask blur={Math.max(1, Math.min(cross, len) * 0.08)} style="normal" />
        </Path>
      </Group>
      {/* The cable leaving the rear (its run is ILLUSTRATIVE). */}
      <Path path={p.cable} style="stroke" strokeWidth={Math.max(1, Math.min(cross, 40) * 0.24)} strokeCap="round" color="#0e0f12" />
      <Path path={p.cable} style="stroke" strokeWidth={Math.max(0.4, Math.min(cross, 40) * 0.08)} strokeCap="round" color="#4a4e57" />
      <Path path={p.plate}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5d626d', '#30333b', '#1a1b20', '#0f1013']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.grille} color="#0b0c0f" />
      <Path path={p.holes} color="#9aa0ab" opacity={0.75} />
      <Path path={p.boss}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#b6bbc5', '#5b5f69', '#25272d']} />
      </Path>
      <Path path={p.plate} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.plate} style="stroke" strokeWidth={hair} color={tint ?? '#c9ced8'} opacity={tint ? 0.95 : 0.4} />
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUMENT DYNAMICS for the drum kit (Miking Lab 1, 2026-10-04). Same
// conventions as the kick mics above: front at the origin, the body toward +y,
// `r` the front radius, `len` the overall length; generic shapes, no brand.

function buildSmallDynamic(r: number, len: number) {
  // A straight grille barrel (≈ 22 % of the length) with a rounded nose, a
  // chrome joint ring, then a long body tapering from the front diameter to
  // the tail's (the sourced size set: 157 long, Ø 32 front, Ø 23 tail).
  const gl = len * 0.22;
  const nose = r * 0.42;
  const grille: SkPathT = Skia.Path.Make();
  grille.moveTo(-r * 0.96, gl);
  grille.lineTo(-r, nose);
  grille.cubicTo(-r, nose * 0.25, -r * 0.7, 0, 0, 0);
  grille.cubicTo(r * 0.7, 0, r, nose * 0.25, r, nose);
  grille.lineTo(r * 0.96, gl);
  grille.close();
  const mesh = crossHatch(-r, 0, r, gl, Math.max(1, r * 0.18));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, gl - r * 0.05, r * 2, r * 0.22), r * 0.06, r * 0.06));
  const b0 = gl + r * 0.17;
  const tailR = r * 0.72;
  const tailTop = len - r * 0.55;
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.97, b0);
  body.lineTo(-tailR, tailTop);
  body.lineTo(tailR, tailTop);
  body.lineTo(r * 0.97, b0);
  body.close();
  const tail: SkPathT = Skia.Path.Make();
  tail.addRRect(Skia.RRectXY(Skia.XYWHRect(-tailR * 0.94, tailTop, tailR * 1.88, len - tailTop), r * 0.1, r * 0.1));
  const grooves: SkPathT = Skia.Path.Make();
  for (const t of [0.3, 0.7]) {
    const y = tailTop + (len - tailTop) * t;
    grooves.moveTo(-tailR * 0.9, y);
    grooves.lineTo(tailR * 0.9, y);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(tail);
  return { grille, mesh, ring, body, tail, grooves, shadow };
}

/** SMALL END-ADDRESS DYNAMIC (the common snare / tom instrument mic). */
export function SmallDynamicMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildSmallDynamic(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.03);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.1 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.5}>
          <BlurMask blur={r * 0.2} style="normal" />
        </Path>
      </Group>
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#6a6f7a', '#3b3f48', '#23252b', '#121317']} positions={[0, 0.3, 0.65, 1]} />
      </Path>
      <Path path={p.tail}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9aa0ab', '#4f535c', '#1f2126']} />
      </Path>
      <Path path={p.grooves} style="stroke" strokeWidth={hair} color="#0d0e11" opacity={0.8} />
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#a9aeb8', '#575c66', '#1e2025']} positions={[0, 0.45, 1]} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.3, r * 0.04)} color="#0c0d10" opacity={0.75} />
        <Circle cx={r * 0.4} cy={len * 0.08} r={r * 0.4} color="#ffffff" opacity={0.16}>
          <BlurMask blur={r * 0.3} style="normal" />
        </Circle>
      </Group>
      <Path path={p.ring}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#f4f6fa', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.35} />
    </Group>
  );
}

function buildClipDynamic(r: number, len: number) {
  // A short, wide body: a domed grille over the front ≈ 45 %, a chrome ring,
  // a rear body that narrows a little to the connector (Ø 41 × 63 set).
  // s9 (2026-10-10): the rear connector shell at the tail (the clamp itself
  // is the scene's).
  const gl = len * 0.45;
  const grille: SkPathT = Skia.Path.Make();
  grille.moveTo(-r * 0.97, gl);
  grille.lineTo(-r, r * 0.5);
  grille.cubicTo(-r, r * 0.12, -r * 0.62, 0, 0, 0);
  grille.cubicTo(r * 0.62, 0, r, r * 0.12, r, r * 0.5);
  grille.lineTo(r * 0.97, gl);
  grille.close();
  const mesh = crossHatch(-r, 0, r, gl, Math.max(1, r * 0.16));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, gl - r * 0.04, r * 2, r * 0.14), r * 0.05, r * 0.05));
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.96, gl + r * 0.1);
  body.lineTo(-r * 0.78, len);
  body.lineTo(r * 0.78, len);
  body.lineTo(r * 0.96, gl + r * 0.1);
  body.close();
  const rear: SkPathT = Skia.Path.Make();
  rear.addRect(Skia.XYWHRect(-r * 0.8, len - len * 0.12, r * 1.6, len * 0.12));
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  return { grille, mesh, ring, body, rear, shadow };
}

/** COMPACT CLIP-ON DYNAMIC (rides a rim clamp; the clamp is drawn by the scene). */
export function ClipDynamicMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildClipDynamic(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.03);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: -r * 0.1 }, { translateY: r * 0.08 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.5}>
          <BlurMask blur={r * 0.18} style="normal" />
        </Path>
      </Group>
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5d626d', '#30333b', '#1a1b20', '#0f1013']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.rear}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#4a4e57', '#1f2126', '#0b0c0e']} />
      </Path>
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9ba1ac', '#4c515b', '#1b1d22']} positions={[0, 0.45, 1]} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.3, r * 0.035)} color="#0c0d10" opacity={0.75} />
      </Group>
      <Path path={p.ring}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#f4f6fa', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.35} />
    </Group>
  );
}

function buildGooseneck(r: number, len: number) {
  // ART PASS s9 (2026-10-10). A clip-on / gooseneck condenser HEAD, in mm
  // (the rim-mount drum condenser class: head Ø 22 × ≈ 40; a conference or
  // miniature head keeps the same layout at its own size): the `len` given is
  // the HEAD, so the head fills ≈ 84 % of it — a domed mesh front ≈ 40 % of
  // the head, a satin body with a fine collar line, a tapered FERRULE — and
  // the last ≈ 16 % is the first turns of the GOOSENECK (Ø 9.5 on a Ø 22
  // head: 0.43 of the head's width), a spiral-wound flexible tube. The rest
  // of the neck and its clamp are drawn by the scene (the mount).
  const head = len * 0.84;
  const gw = r * 0.43; // the gooseneck's half-width
  const gl = head * 0.4;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, gl), r * 0.55, r * 0.55));
  const mesh = crossHatch(-r, 0, r, gl, Math.max(0.6, r * 0.24));
  const body: SkPathT = Skia.Path.Make();
  const b0 = gl - r * 0.08;
  const fer0 = head - Math.min(head * 0.18, r * 0.9);
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.97, b0, r * 1.94, fer0 - b0 + r * 0.1), r * 0.18, r * 0.18));
  const collar: SkPathT = Skia.Path.Make();
  collar.moveTo(-r * 0.96, gl + (fer0 - gl) * 0.5);
  collar.lineTo(r * 0.96, gl + (fer0 - gl) * 0.5);
  // The ferrule: from the body down to the neck's width.
  const ferrule: SkPathT = Skia.Path.Make();
  ferrule.moveTo(-r * 0.9, fer0);
  ferrule.lineTo(r * 0.9, fer0);
  ferrule.lineTo(gw * 1.25, head);
  ferrule.lineTo(-gw * 1.25, head);
  ferrule.close();
  // The gooseneck's first turns: a round tube, its winding as slanted ribs.
  const neck: SkPathT = Skia.Path.Make();
  neck.addRect(Skia.XYWHRect(-gw, head, gw * 2, len - head));
  const ribs: SkPathT = Skia.Path.Make();
  const pitch = Math.max(0.6, gw * 0.55);
  for (let yy = head + pitch * 0.5; yy < len; yy += pitch) {
    ribs.moveTo(-gw, yy);
    ribs.lineTo(gw, yy - pitch * 0.35);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(neck);
  return { grille, mesh, body, collar, ferrule, neck, ribs, shadow };
}

/** SLIM CONDENSER ON A GOOSENECK (a rim-mounted drum condenser). */
export function GooseneckMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildGooseneck(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.3, r * 0.04);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.1 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.25} style="normal" />
        </Path>
      </Group>
      <Path path={p.neck}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#4b4f58', '#8a8f99', '#3a3d45', '#121317']} positions={[0, 0.25, 0.6, 1]} />
      </Path>
      <Group clip={p.neck}>
        <Path path={p.ribs} style="stroke" strokeWidth={hair * 1.1} color="#08080a" opacity={0.75} />
      </Group>
      <Path path={p.ferrule}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5a5e67', '#2a2c32', '#111215']} />
      </Path>
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5d626d', '#30333b', '#1a1b20', '#0f1013']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.collar} style="stroke" strokeWidth={hair} color="#000000" opacity={0.7} />
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#a9aeb8', '#575c66', '#1e2025']} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.25, r * 0.05)} color="#0c0d10" opacity={0.7} />
      </Group>
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}

function buildInstrumentDynamic(r: number, len: number) {
  // The classic end-address instrument dynamic (Miking Labs, 2026-10-05): a
  // flat-fronted cylindrical mesh grille (≈ 29 % of the length) at the full
  // width, a dark joint ring, then a satin body tapering to ≈ 72 % of the
  // grille's width at the XLR end (the documented 32 → 23 mm of the common
  // type; proportions only — generic, no maker's likeness).
  //
  // ART PASS s9 (2026-10-10), in mm: overall 157; GRILLE Ø 32 × ≈ 40 (25 %),
  // a flat front with a small edge radius, a fine woven mesh, a narrow front
  // rim; a dark JOINT RING ≈ 4 a hair under the grille's width; the HANDLE
  // tapering Ø ≈ 30 → 23 with a satin sheen; the XLR END ≈ 12 with a parting
  // groove and its rounded end. Every outline inside width 2r and `len`.
  const gl = len * 0.255;
  const tailR = r * 0.72;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, gl), r * 0.24, r * 0.24));
  const mesh = crossHatch(-r, 0, r, gl, Math.max(0.8, r * 0.15));
  // The front rim: the grille's flat face seen edge-on.
  const rim: SkPathT = Skia.Path.Make();
  rim.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.97, 0, r * 1.94, len * 0.016), r * 0.2, r * 0.08));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.95, gl - len * 0.004, r * 1.9, len * 0.03), r * 0.05, r * 0.05));
  const b0 = gl + len * 0.024;
  const xlr0 = len * 0.92;
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.93, b0);
  body.cubicTo(-r * 0.9, b0 + (xlr0 - b0) * 0.3, -tailR * 1.02, xlr0 - (xlr0 - b0) * 0.25, -tailR, xlr0);
  body.lineTo(tailR, xlr0);
  body.cubicTo(tailR * 1.02, xlr0 - (xlr0 - b0) * 0.25, r * 0.9, b0 + (xlr0 - b0) * 0.3, r * 0.93, b0);
  body.close();
  const tail: SkPathT = Skia.Path.Make();
  tail.addRRect(Skia.RRectXY(Skia.XYWHRect(-tailR * 0.97, xlr0 - len * 0.003, tailR * 1.94, len - xlr0 + len * 0.003), r * 0.12, r * 0.12));
  const grooves: SkPathT = Skia.Path.Make();
  grooves.moveTo(-tailR * 0.95, xlr0 + (len - xlr0) * 0.4);
  grooves.lineTo(tailR * 0.95, xlr0 + (len - xlr0) * 0.4);
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(tail);
  return { grille, mesh, rim, ring, body, tail, grooves, shadow, gl };
}

/** END-ADDRESS INSTRUMENT DYNAMIC: radius `r` (the grille), overall length
 *  `len`, front at the origin (same conventions as the kick dynamic). */
export function InstrumentDynamicMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildInstrumentDynamic(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.03);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.1 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.5}>
          <BlurMask blur={r * 0.18} style="normal" />
        </Path>
      </Group>
      {/* Handle: dark satin with a soft specular band on the lit side. */}
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#3d4149', '#7a7f89', '#43474f', '#23252b', '#121317']} positions={[0, 0.16, 0.36, 0.68, 1]} />
      </Path>
      <Path path={p.tail}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#6d727c', '#3a3d45', '#1c1d22', '#0e0f12']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.grooves} style="stroke" strokeWidth={hair} color="#050506" opacity={0.85} />
      {/* Grille: the dark windscreen foam behind a bright woven mesh. */}
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c3c7cf', '#7d828c', '#3a3d45', '#1b1d22']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.25, r * 0.035)} color="#0c0d10" opacity={0.72} />
      </Group>
      <Path path={p.rim}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#e8ebf0', '#8d929c', '#3a3d45']} />
      </Path>
      {/* The dark joint ring, its top edge catching the light. */}
      <Path path={p.ring}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5a5e67', '#26282e', '#0d0e11']} />
      </Path>
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.tail} style="stroke" strokeWidth={hair * 1.1} color="#08080a" opacity={0.85} />
      <Path path={p.grille} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.32} />
    </Group>
  );
}

/**
 * SIDE-ADDRESS LARGE-DIAPHRAGM CONDENSER, in the Miking scene's local frame:
 * its FRONT FACE (the side of the body the capsule looks out of) at the
 * origin, the body's depth toward +y (behind the face), its long upright
 * extent along local x — `cross` long (the scene passes the long extent in a
 * side view, the body's width from above). The head basket is the +x end;
 * the face carries no badge or brand, only the capsule seen through the mesh.
 *
 * ART PASS s9 (2026-10-10). The class, in mm (the studio side-address LDC):
 * a round BODY Ø ≈ 55 × ≈ 200 overall; the HEAD BASKET ≈ 36 % of it, a
 * double-layer woven mesh on a wire frame, round-topped; inside it the
 * dual-diaphragm CAPSULE (Ø ≈ 34, ≈ 9 thick) stands on the axis with its
 * faces toward the front and the back (seen edge-on from the side, as a bar
 * across the basket from above); a joint ring; the satin-nickel body with
 * the pattern switch on its front and the pad on its back (no logo, no
 * badge); the threaded base ring. When the envelope has room (a 255 × 118 ×
 * 80 product envelope that includes its mount) the mic sits in its SHOCK
 * MOUNT: two clamping rings on the body, an outer ring round each on
 * elastic cords, a rear spine, the swivel with its knob and the stand
 * adapter under the mic. Every size follows the envelope: the body Ø is
 * 0.7 × the depth when mounted, else the smaller of the depth and the width.
 * `r` (optional, the type's radius): with it, a SIDE view is told by
 * `cross > 2r` (the engine passes the long extent from the side, 2r from
 * above); without it, by the old `cross > 1.8 × len`.
 */
type LdcGeom = { side: boolean; D: number; mount: boolean; top: number; micLen: number; headLen: number; capX: number };
function ldcGeom(cross: number, len: number, r: number | undefined): LdcGeom {
  const side = r !== undefined ? cross > r * 2 + 1 : cross > len * 1.8;
  const w = r !== undefined ? r * 2 : side ? len : cross;
  const mount = len >= 64 && w >= 100;
  const D = mount ? Math.min(len * 0.7, w * 0.6) : side ? Math.min(len, w, cross * 0.36) : Math.min(len, cross);
  const top = cross / 2;
  const micLen = side ? (mount ? Math.min(cross * 0.8, D * 3.7) : cross) : 0;
  const headLen = micLen * (mount ? 0.36 : 0.42);
  return { side, D, mount, top, micLen, headLen, capX: top - headLen * 0.5 };
}

function buildSideLdc(cross: number, len: number, r: number | undefined, attachX = 0) {
  const g = ldcGeom(cross, len, r);
  const { D, top, micLen, headLen } = g;
  const hd = D / 2;
  const P = () => Skia.Path.Make();
  const body: SkPathT = P();
  const head: SkPathT = P();
  const ring: SkPathT = P();
  const base: SkPathT = P();
  const cap: SkPathT = P();
  const capRims: SkPathT = P();
  const capPost: SkPathT = P();
  const switches: SkPathT = P();
  const seams: SkPathT = P();
  const frame: SkPathT = P(); // the basket's wire frame (heavier lines)
  const mInner: SkPathT = P(); // mount: clamping rings (edge-on bands / circles)
  const mOuter: SkPathT = P(); // mount: outer rings
  const mSpine: SkPathT = P(); // mount: rear spine, swivel arm, adapter
  const cords: SkPathT = P();
  let knob = { x: 0, y: 0, r: 0 };
  let mesh: SkPathT;
  if (g.side) {
    // ── from the side: +x is the basket end ──
    const bot = top - micLen;
    const hb = top - headLen; // basket / body joint
    head.moveTo(hb, 0);
    head.lineTo(top - hd, 0);
    head.arcToOval(Skia.XYWHRect(top - D, 0, D, D), 270, 180, false);
    head.lineTo(hb, D);
    head.close();
    mesh = crossHatch(hb, 0, top, D, Math.max(0.8, D * 0.075));
    // Wire frame: the rim round the dome and a band across the basket.
    frame.addPath(head);
    for (const t of [0.5]) {
      frame.moveTo(hb + headLen * t, D * 0.02);
      frame.lineTo(hb + headLen * t, D * 0.98);
    }
    ring.addRect(Skia.XYWHRect(hb - D * 0.05, -D * 0.005, D * 0.1, D * 1.01));
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(bot, D * 0.025, hb - bot, D * 0.95), D * 0.1, D * 0.1));
    base.addRRect(Skia.RRectXY(Skia.XYWHRect(bot, D * 0.06, D * 0.14, D * 0.88), D * 0.05, D * 0.05));
    seams.moveTo(bot + D * 0.2, D * 0.04);
    seams.lineTo(bot + D * 0.2, D * 0.96);
    // The capsule on the axis, edge-on: two diaphragm rims and the backplate.
    const cl = Math.min(D * 0.62, headLen * 0.8);
    const ct = D * 0.17;
    cap.addRRect(Skia.RRectXY(Skia.XYWHRect(g.capX - cl / 2, hd - ct / 2, cl, ct), ct * 0.3, ct * 0.3));
    capRims.moveTo(g.capX - cl / 2, hd - ct * 0.36);
    capRims.lineTo(g.capX + cl / 2, hd - ct * 0.36);
    capRims.moveTo(g.capX - cl / 2, hd + ct * 0.36);
    capRims.lineTo(g.capX + cl / 2, hd + ct * 0.36);
    capPost.addRect(Skia.XYWHRect(hb, hd - D * 0.03, Math.max(0, g.capX - cl / 2 - hb), D * 0.06));
    // Pattern switch on the front face, pad switch on the back.
    switches.addRRect(Skia.RRectXY(Skia.XYWHRect(hb - D * 0.42, -D * 0.035, D * 0.16, D * 0.06), D * 0.02, D * 0.02));
    switches.addRRect(Skia.RRectXY(Skia.XYWHRect(hb - D * 0.42, D * 0.975, D * 0.16, D * 0.06), D * 0.02, D * 0.02));
    if (g.mount) {
      const rt = D * 0.08; // ring thickness along the axis
      const ri = hd + D * 0.04;
      const ro = Math.min(hd + D * 0.2, len - hd - 2);
      const rings = [hb - D * 0.32, bot + D * 0.42];
      for (const x of rings) {
        mInner.addRRect(Skia.RRectXY(Skia.XYWHRect(x - rt / 2, hd - ri, rt, ri * 2), rt * 0.3, rt * 0.3));
        mOuter.addRRect(Skia.RRectXY(Skia.XYWHRect(x - rt * 0.55, hd - ro, rt * 1.1, ro * 2), rt * 0.3, rt * 0.3));
        // Elastic cords crossing the gaps, front and back (inside the bands' width).
        for (const s of [-1, 1]) {
          const a = hd + s * ri;
          const b = hd + s * ro;
          cords.moveTo(x - rt * 0.5, b);
          cords.lineTo(x + rt * 0.5, a);
          cords.moveTo(x + rt * 0.5, b);
          cords.lineTo(x - rt * 0.5, a);
        }
      }
      // The rear spine joining the outer rings, and the swivel it hangs from
      // at the mount's attach point — where the engine's stand or boom meets
      // the mic: the tail point (local (attachX, len); attachX = 0, or the
      // basket centre for the vocal drawing, which is shifted by it).
      const sy = hd + ro - D * 0.05;
      const sw = D * 0.08;
      const kr = Math.min(D * 0.16, (len - sy) * 0.9);
      const ky = len - kr;
      const ax = Math.max(rings[1], Math.min(rings[0], attachX));
      mSpine.addRRect(Skia.RRectXY(Skia.XYWHRect(rings[1] - rt, sy - sw / 2, rings[0] - rings[1] + rt * 2, sw), sw * 0.4, sw * 0.4));
      // The swivel's arm from the spine back to the attach point.
      mSpine.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(ax, attachX) - sw / 2, sy - sw / 2, Math.abs(attachX - ax) + sw, sw), sw * 0.4, sw * 0.4));
      mSpine.addRRect(Skia.RRectXY(Skia.XYWHRect(attachX - sw * 0.6, sy - sw / 2, sw * 1.2, ky - sy + sw / 2), sw * 0.4, sw * 0.4));
      knob = { x: attachX, y: ky, r: kr };
    }
  } else {
    // ── from above: the crown of the basket, the capsule bar across it ──
    head.addCircle(0, hd, hd);
    mesh = crossHatch(-hd, 0, hd, D, Math.max(0.8, D * 0.075));
    frame.addCircle(0, hd, hd);
    const cl = D * 0.62;
    const ct = D * 0.17;
    cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-cl / 2, hd - ct / 2, cl, ct), ct * 0.3, ct * 0.3));
    capRims.moveTo(-cl / 2, hd - ct * 0.36);
    capRims.lineTo(cl / 2, hd - ct * 0.36);
    capRims.moveTo(-cl / 2, hd + ct * 0.36);
    capRims.lineTo(cl / 2, hd + ct * 0.36);
    if (g.mount) {
      const ri = hd + D * 0.04;
      const ro = Math.min(hd + D * 0.2, len - hd - 2, cross / 2 - 2);
      mInner.addCircle(0, hd, ri);
      mOuter.addCircle(0, hd, ro);
      for (let k = 0; k < 8; k++) {
        const a0 = ((k + 0.5) / 8) * Math.PI * 2;
        const a1 = a0 + (k % 2 ? 0.5 : -0.5);
        cords.moveTo(Math.cos(a0) * ri, hd + Math.sin(a0) * ri);
        cords.lineTo(Math.cos(a1) * ro, hd + Math.sin(a1) * ro);
      }
      // The spine at the back of the outer ring.
      mSpine.addRRect(Skia.RRectXY(Skia.XYWHRect(-D * 0.07, hd + ro - D * 0.06, D * 0.14, D * 0.14), D * 0.03, D * 0.03));
    }
  }
  return { g, body, head, mesh, frame, ring, base, cap, capRims, capPost, switches, seams, mInner, mOuter, mSpine, cords, knob };
}

export function SideLdcMic({ cross, len, tint, r, attachX = 0 }: { cross: number; len: number; tint?: string; r?: number; /** where the mount meets the stand (local x; the tail point) */ attachX?: number }) {
  const p = useMemo(() => buildSideLdc(cross, len, r, attachX), [cross, len, r, attachX]);
  const D = p.g.D;
  const hair = Math.max(0.35, D * 0.014);
  // Light from the front/upper-left: y = 0 (the face) lit, the back in shade.
  const L = (a: string[], pos?: number[]) => <LinearGradient start={vec(0, 0)} end={vec(0, D)} colors={a} positions={pos} />;
  return (
    <Group>
      <Group transform={[{ translateX: -D * 0.06 }, { translateY: D * 0.08 }]}>
        <Path path={p.body} color="#000000" opacity={0.45}>
          <BlurMask blur={D * 0.1} style="normal" />
        </Path>
        <Path path={p.head} color="#000000" opacity={0.45}>
          <BlurMask blur={D * 0.1} style="normal" />
        </Path>
      </Group>
      {/* The shock mount's outer rings and spine, behind the mic. */}
      {p.g.mount ? (
        <>
          <Path path={p.mSpine}>{L(['#5b5f69', '#2a2c32', '#121317'])}</Path>
          <Path path={p.mSpine} style="stroke" strokeWidth={hair} color="#050506" />
          <Path path={p.mOuter} style={p.g.side ? 'fill' : 'stroke'} strokeWidth={D * 0.06}>
            {L(['#a3a8b2', '#5d626c', '#2c2e34'])}
          </Path>
          {p.g.side ? <Path path={p.mOuter} style="stroke" strokeWidth={hair} color="#050506" /> : null}
        </>
      ) : null}
      {/* Body: satin nickel, lit at its face. */}
      <Path path={p.body}>{L(['#e4e7ec', '#c2c6ce', '#8e939d', '#5b5f68', '#3a3d44'], [0, 0.18, 0.5, 0.8, 1])}</Path>
      <Path path={p.base}>{L(['#9ea3ad', '#6a6e78', '#2f3238'])}</Path>
      <Path path={p.seams} style="stroke" strokeWidth={hair} color="#2a2c32" opacity={0.8} />
      <Path path={p.switches}>{L(['#3a3d45', '#16171b'])}</Path>
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      {/* The basket: dark interior, the capsule on its post, then the mesh. */}
      <Path path={p.head}>{L(['#6a6e78', '#3a3d45', '#1c1d22'])}</Path>
      <Group clip={p.head}>
        <Path path={p.capPost} color="#2a2c32" />
        <Path path={p.cap} color="#15161a" />
        <Path path={p.capRims} style="stroke" strokeWidth={Math.max(0.4, D * 0.03)} color="#d4ad55" opacity={0.95} />
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.25, D * 0.014)} color="#d9dde5" opacity={0.42} />
        <Group transform={[{ translateX: D * 0.012 }, { translateY: D * 0.012 }]}>
          <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.2, D * 0.008)} color="#0c0d10" opacity={0.5} />
        </Group>
      </Group>
      <Path path={p.frame} style="stroke" strokeWidth={Math.max(0.5, D * 0.03)}>
        {L(['#f1f3f7', '#a9aeb8', '#4a4e57'])}
      </Path>
      {p.g.side ? <Path path={p.ring}>{L(['#f4f6fa', '#a3a8b2', '#3a3d45'])}</Path> : null}
      <Path path={p.head} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.85} />
      {/* The shock mount's clamping rings, elastic cords, the swivel knob. */}
      {p.g.mount ? (
        <>
          <Path path={p.cords} style="stroke" strokeWidth={Math.max(0.35, D * 0.018)} strokeCap="round" color="#141519" opacity={0.95} />
          <Path path={p.mInner} style={p.g.side ? 'fill' : 'stroke'} strokeWidth={D * 0.05}>
            {L(['#5a5e67', '#26282e', '#0e0f12'])}
          </Path>
          {p.knob.r > 0 ? (
            <>
              <Circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r}>
                <LinearGradient start={vec(p.knob.x, p.knob.y - p.knob.r)} end={vec(p.knob.x, p.knob.y + p.knob.r)} colors={['#6a6e78', '#2a2c32', '#111215']} />
              </Circle>
              <Circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r} style="stroke" strokeWidth={hair} color="#050506" />
              <Circle cx={p.knob.x} cy={p.knob.y} r={p.knob.r * 0.35} color="#9aa0ab" opacity={0.6} />
            </>
          ) : null}
        </>
      ) : null}
      {/* The front face: a rim light along the basket (the side the capsule faces). */}
      <Path path={p.head} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.25} />
    </Group>
  );
}

/**
 * HANDHELD VOCAL DYNAMIC for the Miking Labs (Lab 5, the voice): the same
 * ball-grille handheld as above, on the Miking convention — the grille's
 * FRONT at the origin (not its centre), the handle toward +y, `r` the
 * grille's radius, `len` the overall length front to tail.
 */
export function VocalDynamicMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  return (
    <Group>
      {/* Mirrored so its light falls on local +x, as every Miking mic's does. */}
      <Group transform={[{ scaleX: -1 }]}>
        <HandheldMic x={0} y={r} angleDeg={0} grilleR={r} bodyLen={Math.max(r, len - 1.72 * r)} />
      </Group>
      {tint ? <Circle cx={0} cy={r} r={r} style="stroke" strokeWidth={Math.max(0.5, r * 0.06)} color={tint} opacity={0.95} /> : null}
    </Group>
  );
}

/** The side-address condenser for a VOICE (Lab 5): the same drawing, moved so
 *  the CENTRE OF ITS BASKET — where the capsule is — sits on the mic's front
 *  point (the singer sings into the basket; the body hangs below it). Seen
 *  from above it is the plain drawing. */
export function VocalLdcMic({ cross, len, tint, r }: { cross: number; len: number; tint?: string; r?: number }) {
  const g = ldcGeom(cross, len, r);
  return (
    <Group transform={g.side ? [{ translateX: -g.capX }] : []}>
      <SideLdcMic cross={cross} len={len} tint={tint} r={r} attachX={g.side ? g.capX : 0} />
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lab 6 group 4 (Miking Lab 6, the measurement lessons F11–F16, 2026-10-08):
// a MEASUREMENT MIC (a slim capsule under its slotted protection grid, on a
// preamp of the same diameter, a knurled connector ring) and a complete SOUND
// LEVEL METER (capsule on a tapered neck under a foam windscreen, a handheld
// body with its display and keys). Generic — no maker's likeness. Same
// conventions as above: FRONT at the origin, body toward +y, sizes in the
// caller's units; every outline inside width 2r and length `len`.

function buildMeasMic(r: number, len: number) {
  // ART PASS s9 (2026-10-10). The ½ in (or ¼ in) measurement mic on its
  // preamp, in mm (the free-field / pressure / random-incidence lab class):
  // the PROTECTION GRID over the capsule, Ø ≈ 13.2 × ≈ 12 (6.5 % of a 185
  // assembly): a cylindrical cage with long side slots, a slotted front face
  // and a knurled rim where it threads on; the CAPSULE body Ø 12.7 × ≈ 9; a
  // fine joint; the PREAMP Ø 12.7 at the same diameter (satin nickel) to a
  // black CONNECTOR BOOT ≈ 18 long at the tail with two grip rings (the
  // 7-pin / coaxial end). Every outline inside width 2r and `len`.
  const g = Math.max(r * 1.6, len * 0.065);
  const grid: SkPathT = Skia.Path.Make();
  grid.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, g), r * 0.18, r * 0.18));
  // The grid's long side slots (three on the near side) and its front face.
  const slots: SkPathT = Skia.Path.Make();
  for (const k of [-0.56, 0, 0.56]) slots.addRRect(Skia.RRectXY(Skia.XYWHRect(r * k - r * 0.13, g * 0.16, r * 0.26, g * 0.56), r * 0.1, r * 0.1));
  const face: SkPathT = Skia.Path.Make();
  face.addRect(Skia.XYWHRect(-r * 0.96, 0, r * 1.92, Math.max(0.4, g * 0.07)));
  // The knurled rim at the grid's rear (it threads onto the capsule).
  const knurl0 = g * 0.78;
  const knurl: SkPathT = Skia.Path.Make();
  knurl.addRect(Skia.XYWHRect(-r, knurl0, r * 2, g - knurl0));
  const ridges: SkPathT = Skia.Path.Make();
  for (let x = -r * 0.85; x < r * 0.9; x += Math.max(0.35, r * 0.22)) {
    ridges.moveTo(x, knurl0 + (g - knurl0) * 0.12);
    ridges.lineTo(x, g - (g - knurl0) * 0.12);
  }
  const capL = Math.max(r * 1.2, len * 0.05);
  const capsule: SkPathT = Skia.Path.Make();
  capsule.addRect(Skia.XYWHRect(-r * 0.97, g, r * 1.94, capL));
  const bootL = Math.max(r * 2, len * 0.1);
  const b0 = g + capL;
  const body: SkPathT = Skia.Path.Make();
  body.addRect(Skia.XYWHRect(-r * 0.97, b0, r * 1.94, len - bootL - b0 + r * 0.1));
  const boot: SkPathT = Skia.Path.Make();
  boot.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.92, len - bootL, r * 1.84, bootL), r * 0.25, r * 0.25));
  const grips: SkPathT = Skia.Path.Make();
  for (const t of [0.35, 0.6]) {
    grips.moveTo(-r * 0.9, len - bootL + bootL * t);
    grips.lineTo(r * 0.9, len - bootL + bootL * t);
  }
  // The thin joints: capsule / preamp, preamp / boot.
  const joint: SkPathT = Skia.Path.Make();
  joint.moveTo(-r * 0.97, b0);
  joint.lineTo(r * 0.97, b0);
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grid);
  shadow.addPath(body);
  shadow.addPath(boot);
  return { grid, slots, face, knurl, ridges, capsule, body, boot, grips, joint, shadow };
}

/** MEASUREMENT MIC: radius `r` (the capsule's), length `len`, front at the origin. */
export function MeasurementMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildMeasMic(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.25, r * 0.05);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.15 }, { translateY: r * 0.12 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.25} style="normal" />
        </Path>
      </Group>
      {/* The preamp: satin nickel with a long specular band. */}
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#a9aeb8', '#f2f4f7', '#c9cdd5', '#7d828c', '#33363d']} positions={[0, 0.16, 0.36, 0.7, 1]} />
      </Path>
      <Path path={p.capsule}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#d9dce2', '#a4a9b3', '#5c6069', '#2c2f35']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.joint} style="stroke" strokeWidth={hair} color="#1a1b1f" opacity={0.75} />
      {/* The connector boot. */}
      <Path path={p.boot}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#4a4e57', '#24262b', '#0e0f12']} />
      </Path>
      <Path path={p.grips} style="stroke" strokeWidth={hair * 1.2} color="#050506" opacity={0.9} />
      {/* The protection grid: bright cage, its slots, the knurled rim. */}
      <Path path={p.grid}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#e6e9ee', '#a3a8b2', '#4a4e57']} />
      </Path>
      <Path path={p.slots} color="#0b0c0f" opacity={0.88} />
      <Path path={p.face} color="#2a2c32" opacity={0.9} />
      <Path path={p.knurl}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#b4b9c3', '#6a6e78', '#2a2c32']} />
      </Path>
      <Path path={p.ridges} style="stroke" strokeWidth={hair * 0.8} color="#15161a" opacity={0.7} />
      <Path path={p.grid} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.85} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.8} />
      <Path path={p.boot} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.8} />
      <Path path={p.grid} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}

function buildSlm(r: number, len: number) {
  // Proportions of the drawing default (300 × 74): the capsule radius is
  // ~ r/5.8, the neck tapers to the body, the body takes the lower 70 %.
  const cr = r / 5.8;
  const neck0 = cr * 2.4;
  const body0 = len * 0.3;
  const capsule: SkPathT = Skia.Path.Make();
  capsule.addRRect(Skia.RRectXY(Skia.XYWHRect(-cr, 0, cr * 2, neck0), cr * 0.3, cr * 0.3));
  const neck: SkPathT = Skia.Path.Make();
  neck.moveTo(-cr * 1.05, neck0);
  neck.lineTo(cr * 1.05, neck0);
  neck.cubicTo(cr * 1.2, body0 * 0.7, r * 0.55, body0 * 0.85, r * 0.62, body0);
  neck.lineTo(-r * 0.62, body0);
  neck.cubicTo(-r * 0.55, body0 * 0.85, -cr * 1.2, body0 * 0.7, -cr * 1.05, neck0);
  neck.close();
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.62, body0);
  body.lineTo(r * 0.62, body0);
  body.cubicTo(r, body0 + r * 0.2, r, body0 + r * 0.3, r, body0 + r * 0.5);
  body.lineTo(r * 0.82, len - r * 0.3);
  body.cubicTo(r * 0.8, len, -r * 0.8, len, -r * 0.82, len - r * 0.3);
  body.lineTo(-r, body0 + r * 0.5);
  body.cubicTo(-r, body0 + r * 0.3, -r, body0 + r * 0.2, -r * 0.62, body0);
  body.close();
  const screen: SkPathT = Skia.Path.Make();
  screen.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.62, body0 + r * 0.55, r * 1.24, r * 0.95), r * 0.08, r * 0.08));
  // The display's digits as segment strokes (no number is claimed).
  const segs: SkPathT = Skia.Path.Make();
  const sy = body0 + r * 0.8;
  for (const sx of [-0.4, -0.12, 0.16]) {
    segs.addRect(Skia.XYWHRect(r * sx, sy, r * 0.18, r * 0.04));
    segs.addRect(Skia.XYWHRect(r * sx, sy + r * 0.2, r * 0.18, r * 0.04));
    segs.addRect(Skia.XYWHRect(r * sx, sy + r * 0.4, r * 0.18, r * 0.04));
    segs.addRect(Skia.XYWHRect(r * (sx + 0.15), sy, r * 0.04, r * 0.44));
    // s9: the left verticals too, so each digit reads as a blank "8" (all
    // segments), not a "3".
    segs.addRect(Skia.XYWHRect(r * (sx - 0.01), sy, r * 0.04, r * 0.44));
  }
  // The decimal point before the last digit.
  segs.addRect(Skia.XYWHRect(r * 0.11, sy + r * 0.4, r * 0.04, r * 0.04));
  const keys: SkPathT = Skia.Path.Make();
  for (let i = 0; i < 3; i++) for (const kx of [-0.45, 0.05]) keys.addRRect(Skia.RRectXY(Skia.XYWHRect(r * kx, body0 + r * (1.8 + i * 0.5), r * 0.4, r * 0.26), r * 0.08, r * 0.08));
  // The foam windscreen ball round the capsule.
  const ball = Skia.Path.Make();
  const br = r * 1.2;
  ball.addCircle(0, cr * 1.2, br);
  // Its open-cell texture as a few short arcs (one Path, not a dot per cell).
  const foam: SkPathT = Skia.Path.Make();
  for (let i = 0; i < 14; i++) {
    const a = i * 2.39996;
    const rr = br * (0.25 + 0.65 * ((i * 0.618) % 1));
    const cx = Math.cos(a) * rr;
    const cy = cr * 1.2 + Math.sin(a) * rr;
    foam.addCircle(cx, cy, br * 0.06);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(neck);
  shadow.addPath(body);
  return { capsule, neck, body, screen, segs, keys, ball, foam, shadow, br, cr };
}

/** SOUND LEVEL METER with its windscreen: `r` = half the body width, `len` front to base. */
export function SoundLevelMeter({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildSlm(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.3, r * 0.025);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.1 }, { translateY: r * 0.08 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.12} style="normal" />
        </Path>
      </Group>
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5a5f69', '#3a3e46', '#1c1e23']} />
      </Path>
      <Path path={p.neck}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c9cdd5', '#7b808a', '#2f3238']} />
      </Path>
      <Path path={p.screen} color="#11161a" />
      <Path path={p.segs} color="#9fe3b0" opacity={0.75} />
      <Path path={p.keys}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#8a8f99', '#4d515a']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.4} color="#07070a" opacity={0.85} />
      <Path path={p.capsule}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#eceef2', '#9aa0aa', '#3c4048']} />
      </Path>
      <Path path={p.ball}>
        <RadialGradient c={vec(p.br * 0.3, p.cr * 1.2 - p.br * 0.35)} r={p.br * 1.25} colors={['#5f6470', '#3b3f48', '#23252b']} />
      </Path>
      <Path path={p.ball} opacity={0.35} color="#000000" style="stroke" strokeWidth={hair * 2} />
      <Path path={p.foam} color="#1a1c21" opacity={0.55} />
      <Path path={p.ball} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.25} />
    </Group>
  );
}

/* lab6 group 1 (2026-10-08) — THE SHORT SHOTGUN for the Miking Labs (Lab 6
 * Foley and field; foley_footsteps/GEOMETRY_PROPOSAL.md §4). On the Miking
 * convention, but its reference point is the CAPSULE: the interference tube
 * reaches `fore` mm AHEAD of it (toward −y: the slotted tube and the front
 * grille), the short body `len` mm behind it (toward +y) ends at the XLR. A
 * SHOCK MOUNT cradles the body (a ring on elastic cords inside a frame on the
 * boom's clamp) — the line every Foley stand mic carries (correction F01-C5).
 * Sizes: a common short shotgun's Ø 19 × 250 mm, the capsule 200 mm behind
 * the grille (drawing defaults). */
function buildShotgun(r: number, len: number, fore: number) {
  const tube: SkPathT = Skia.Path.Make();
  tube.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, -fore, 2 * r, fore + len * 0.25), r * 0.35, r * 0.35));
  const body: SkPathT = Skia.Path.Make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, -r * 0.2, 2 * r, len + r * 0.2), r * 0.45, r * 0.45));
  // The slots of the interference tube (s9 2026-10-10): long narrow slots
  // ALONG the tube, in staggered pairs (two rows on the near side), each
  // ≈ 1.5 Ø long — not cross-cut pills.
  const slots: SkPathT = Skia.Path.Make();
  const sl = Math.max(r * 1.2, Math.min(r * 1.9, fore / 7));
  const sw = r * 0.26;
  let k = 0;
  for (let y = -fore + fore * 0.07; y + sl <= -r * 1.2; y += sl * 0.68, k++) {
    const x = k % 2 ? r * 0.36 : -r * 0.36;
    slots.addRRect(Skia.RRectXY(Skia.XYWHRect(x - sw / 2, y, sw, sl), sw * 0.5, sw * 0.5));
  }
  const cap: SkPathT = Skia.Path.Make();
  cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 1.04, -fore - r * 0.1, r * 2.08, r * 1.2), r * 0.5, r * 0.5));
  const seam: SkPathT = Skia.Path.Make();
  seam.addRect(Skia.XYWHRect(-r * 1.06, -r * 0.35, r * 2.12, r * 0.5));
  const xlr: SkPathT = Skia.Path.Make();
  xlr.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.8, len - r * 0.25, r * 1.6, r * 0.55), r * 0.2, r * 0.2));
  // The shock mount: an inner ring round the body, an outer frame, the cords.
  const cy = len * 0.45;
  const outer = r * 2.7;
  const frame: SkPathT = Skia.Path.Make();
  frame.addRRect(Skia.RRectXY(Skia.XYWHRect(-outer, cy - r * 0.55, 2 * outer, r * 1.1), r * 0.5, r * 0.5));
  frame.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.45, cy + r * 0.4, r * 0.9, len * 0.6 + r * 1.2), r * 0.3, r * 0.3));
  const cords: SkPathT = Skia.Path.Make();
  for (const sgn of [-1, 1]) {
    cords.moveTo(sgn * r * 1.02, cy - r * 0.9);
    cords.lineTo(sgn * outer * 0.92, cy - r * 0.15);
    cords.moveTo(sgn * r * 1.02, cy + r * 0.9);
    cords.lineTo(sgn * outer * 0.92, cy + r * 0.15);
  }
  const band: SkPathT = Skia.Path.Make();
  band.addRect(Skia.XYWHRect(-r * 1.12, cy - r * 0.32, r * 2.24, r * 0.64));
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, -fore, 2 * r, fore + len), r * 0.4, r * 0.4));
  return { tube, body, slots, cap, seam, xlr, frame, cords, band, shadow };
}

export function ShotgunMountMic({ r, len, fore, tint, mount = true }: { r: number; len: number; fore: number; tint?: string; mount?: boolean }) {
  const p = useMemo(() => buildShotgun(r, len, fore), [r, len, fore]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.05);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.15 }, { translateY: r * 0.12 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.25} style="normal" />
        </Path>
      </Group>
      {mount ? (
        <>
          <Path path={p.frame}>
            <LinearGradient start={lit.start} end={lit.end} colors={['#5b5f69', '#2a2c32', '#121317']} />
          </Path>
          <Path path={p.frame} style="stroke" strokeWidth={hair * 1.4} color="#050506" />
        </>
      ) : null}
      <Path path={p.tube}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9aa0ab', '#4a4e57', '#24262c', '#121317']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.slots} color="#050506" opacity={0.85} />
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#e6e9ef', METAL_HI, METAL_MID, '#2b2d34']} positions={[0, 0.22, 0.6, 1]} />
      </Path>
      <Path path={p.seam} color="#1a1b20" opacity={0.85} />
      <Path path={p.cap}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#a9aeb8', '#575c66', '#1e2025']} />
      </Path>
      <Path path={p.xlr} color="#1a1b20" />
      <Path path={p.tube} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
      {mount ? (
        <>
          <Path path={p.cords} style="stroke" strokeWidth={Math.max(0.5, r * 0.16)} strokeCap="round" color="#c9a24a" opacity={0.9} />
          <Path path={p.band}>
            <LinearGradient start={lit.start} end={lit.end} colors={['#4d515b', '#1d1e23']} />
          </Path>
        </>
      ) : null}
      <Path path={p.tube} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.25} />
    </Group>
  );
}

/** One switch for every Miking mic art id (the placement scene and the
 *  polar page draw through it). `fore` (lab6 group 1): the body reaching
 *  ahead of the reference point — the shock-mounted shotgun's tube. */
export function MikingMicArt({ art, r, len, cross, tint, fore = 0 }: { art: 'kickDynamic' | 'sdc' | 'boundary' | 'smallDynamic' | 'clipDynamic' | 'gooseneck' | 'instDynamic' | 'sideLdc' | 'vocalDynamic' | 'vocalLdc' | 'shotgun' | 'blimp' | 'lavalier' | 'dummyHead' | 'ambiTetra' | 'dmsCluster' | 'measMic' | 'slm' | 'shotgunMount' | 'broadcastDynamic' | 'dish' | 'headsetBoom' | 'lipRibbon' | 'flagHandheld' | 'ribbon'; r: number; len: number; cross?: number; tint?: string; fore?: number }) {
  switch (art) {
    /* Lab 7b group 1: speech in sport (micDrawingsSport.tsx). */
    case 'headsetBoom':
      return <HeadsetBoomCapsule r={r} len={len} tint={tint} />;
    case 'lipRibbon':
      return <LipRibbonMic r={r} len={len} tint={tint} />;
    case 'flagHandheld':
      return (
        <Group>
          <VocalDynamicMic r={r} len={len} tint={tint} />
          <MicFlag r={r} />
        </Group>
      );
    /* Lab 6 group 1: the Foley short shotgun in its shock mount, measured to its capsule. */
    case 'shotgunMount':
      return <ShotgunMountMic r={r} len={len} fore={fore} tint={tint} />;
    // lab6 group 2: the parabolic dish (micDrawingsDish.tsx).
    case 'dish':
      return <ParabolicDishMic r={r} len={len} fore={fore} tint={tint} />;
    /* Lab 7 group 1: the broadcast dynamic (micDrawingsBroadcast.tsx). */
    case 'broadcastDynamic':
      return <BroadcastDynamicMic r={r} len={len} tint={tint} />;
    /* Lab 6 group 6: the field and spatial mics (micDrawingsField.tsx). */
    // Owner 2026-10-08 (L6A): a shotgun read to its CAPSULE — the same drawing,
    // its tip `fore` mm ahead of the reference point.
    case 'shotgun':
      return fore > 0 ? (
        <Group transform={[{ translateY: -fore }]}>
          <ShotgunMic r={r} len={len + fore} tint={tint} capAt={fore} />
        </Group>
      ) : (
        <ShotgunMic r={r} len={len} tint={tint} />
      );
    case 'blimp':
      return fore > 0 ? (
        <Group transform={[{ translateY: -fore }]}>
          <BlimpMic r={r} len={len + fore} tint={tint} />
        </Group>
      ) : (
        <BlimpMic r={r} len={len} tint={tint} />
      );
    case 'lavalier':
      return <LavalierMic r={r} len={len} tint={tint} />;
    case 'dummyHead':
      return <DummyHeadMic r={r} len={len} cross={cross ?? r * 2} tint={tint} />;
    case 'ambiTetra':
      return <AmbiTetraMic r={r} len={len} cross={cross ?? r * 2} tint={tint} />;
    case 'dmsCluster':
      return <DmsClusterMic r={r} len={len} cross={cross ?? r * 2} tint={tint} />;
    // Lab 6 group 4: the measurement mic and the sound level meter.
    case 'measMic':
      return <MeasurementMic r={r} len={len} tint={tint} />;
    case 'slm':
      return <SoundLevelMeter r={r} len={len} tint={tint} />;
    case 'vocalDynamic':
      return <VocalDynamicMic r={r} len={len} tint={tint} />;
    case 'vocalLdc':
      return <VocalLdcMic cross={cross ?? r * 2} len={len} tint={tint} r={r} />;
    // s9 round 2: the side-address figure-8 ribbon (micDrawingsRibbon.tsx).
    case 'ribbon':
      return <RibbonMic r={r} len={len} cross={cross ?? r * 2} tint={tint} />;
    case 'sideLdc':
      return <SideLdcMic cross={cross ?? r * 2} len={len} tint={tint} r={r} />;
    case 'boundary':
      return <BoundaryMic len={len} cross={cross ?? r * 2} tint={tint} />;
    case 'sdc':
      return <SdcMic r={r} len={len} tint={tint} />;
    case 'smallDynamic':
      return <SmallDynamicMic r={r} len={len} tint={tint} />;
    case 'clipDynamic':
      return <ClipDynamicMic r={r} len={len} tint={tint} />;
    case 'gooseneck':
      return <GooseneckMic r={r} len={len} tint={tint} />;
    case 'instDynamic':
      return <InstrumentDynamicMic r={r} len={len} tint={tint} />;
    default:
      return <KickDynamicMic r={r} len={len} tint={tint} />;
  }
}
