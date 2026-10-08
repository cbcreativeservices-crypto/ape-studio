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
 *  body extending toward +y (behind the grille). */
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
      <Path path={parts.brandBand} color={ACCENT} opacity={0.5} />
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
        <RadialGradient c={vec(-gr * 0.35, -gr * 0.4)} r={gr * 1.9} colors={['#dde0e7', '#8a8c94', '#33343c']} />
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
      {/* Badge + the pad / roll-off switches. */}
      <Path path={p.badge} color={ACCENT} opacity={0.55} />
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
  // A rounded mesh cap (≈ 24 % of the length), a chrome ring, a straight
  // satin tube to the XLR end.
  const gl = len * 0.24;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.93, 0, r * 1.86, gl), r * 0.42, r * 0.42));
  const mesh = crossHatch(-r, 0, r, gl, Math.max(1, r * 0.16));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, gl - len * 0.01, r * 2, len * 0.05), r * 0.06, r * 0.06));
  const body: SkPathT = Skia.Path.Make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.97, gl + len * 0.035, r * 1.94, len - gl - len * 0.035), r * 0.14, r * 0.14));
  const grooves: SkPathT = Skia.Path.Make();
  for (const t of [0.86, 0.9]) {
    grooves.moveTo(-r * 0.95, len * t);
    grooves.lineTo(r * 0.95, len * t);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  return { grille, mesh, ring, body, grooves, shadow, gl };
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
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#e6e9ef', METAL_HI, METAL_MID, '#2b2d34']} positions={[0, 0.22, 0.6, 1]} />
      </Path>
      <Path path={p.grooves} style="stroke" strokeWidth={hair} color="#24262c" opacity={0.7} />
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#a9aeb8', '#575c66', '#1e2025']} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.3, r * 0.035)} color="#0c0d10" opacity={0.7} />
      </Group>
      <Path path={p.ring}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#f4f6fa', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
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
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  return { grille, mesh, ring, body, shadow };
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
  // A slim condenser head (Ø = 2r, its first ≈ 40 mm a grille) on a ribbed
  // gooseneck that runs back to the clamp (the head's length is a drawing
  // default; the gooseneck is the sourced 9.5 mm across).
  const head = Math.min(len * 0.28, 44);
  const gr = r * 0.43;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, head * 0.45), r * 0.45, r * 0.45));
  const mesh = crossHatch(-r, 0, r, head * 0.45, Math.max(1, r * 0.3));
  const body: SkPathT = Skia.Path.Make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.96, head * 0.42, r * 1.92, head * 0.58), r * 0.2, r * 0.2));
  const neck: SkPathT = Skia.Path.Make();
  neck.addRect(Skia.XYWHRect(-gr, head, gr * 2, len - head));
  const ribs: SkPathT = Skia.Path.Make();
  for (let yy = head + 3; yy < len; yy += Math.max(2.5, gr * 0.7)) {
    ribs.moveTo(-gr, yy);
    ribs.lineTo(gr, yy);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  shadow.addPath(neck);
  return { grille, mesh, body, neck, ribs, shadow };
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
        <LinearGradient start={lit.start} end={lit.end} colors={['#5b5f69', '#2a2c32', '#121317']} />
      </Path>
      <Path path={p.ribs} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.7} />
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#e6e9ef', METAL_HI, METAL_MID, '#2b2d34']} positions={[0, 0.22, 0.6, 1]} />
      </Path>
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
  const gl = len * 0.29;
  const tailR = r * 0.72;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, gl), r * 0.32, r * 0.32));
  const mesh = crossHatch(-r, 0, r, gl, Math.max(1, r * 0.2));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.98, gl - len * 0.008, r * 1.96, len * 0.04), r * 0.06, r * 0.06));
  const b0 = gl + len * 0.03;
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.96, b0);
  body.lineTo(-tailR, len - r * 0.06);
  body.quadTo(-tailR, len, -tailR + r * 0.08, len);
  body.lineTo(tailR - r * 0.08, len);
  body.quadTo(tailR, len, tailR, len - r * 0.06);
  body.lineTo(r * 0.96, b0);
  body.close();
  const grooves: SkPathT = Skia.Path.Make();
  for (const t of [0.9, 0.94]) {
    const half = r * 0.96 + (tailR - r * 0.96) * ((len * t - b0) / (len - b0));
    grooves.moveTo(-half, len * t);
    grooves.lineTo(half, len * t);
  }
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grille);
  shadow.addPath(body);
  return { grille, mesh, ring, body, grooves, shadow, gl };
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
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#6a6f7a', '#3b3f48', '#23252b', '#121317']} positions={[0, 0.3, 0.65, 1]} />
      </Path>
      <Path path={p.grooves} style="stroke" strokeWidth={hair} color="#0d0e11" opacity={0.8} />
      <Path path={p.grille}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#a9aeb8', '#575c66', '#1e2025']} />
      </Path>
      <Group clip={p.grille}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.3, r * 0.035)} color="#0c0d10" opacity={0.75} />
      </Group>
      <Path path={p.ring} color="#17181c" />
      <Path path={p.grille} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
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
 */
function buildSideLdc(cross: number, len: number) {
  const tall = cross > len * 1.8;
  const half = cross / 2;
  const body: SkPathT = Skia.Path.Make();
  const head: SkPathT = Skia.Path.Make();
  const mesh: SkPathT = Skia.Path.Make();
  const ring: SkPathT = Skia.Path.Make();
  const cap: SkPathT = Skia.Path.Make();
  if (tall) {
    // From the side: the body below, the basket above (a rounded dome).
    const split = half - cross * 0.42;
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(-half, len * 0.06, split + half, len * 0.88), len * 0.16, len * 0.16));
    head.addRRect(Skia.RRectXY(Skia.XYWHRect(split, 0, half - split, len), len * 0.48, len * 0.48));
    ring.addRect(Skia.XYWHRect(split - cross * 0.025, len * 0.02, cross * 0.05, len * 0.96));
    const step = Math.max(2, len * 0.09);
    for (let x = split + step * 0.6; x < half - step * 0.3; x += step) {
      mesh.moveTo(x, len * 0.06);
      mesh.lineTo(x, len * 0.94);
    }
    for (let y = step * 0.6; y < len; y += step) {
      mesh.moveTo(split + 2, y);
      mesh.lineTo(half - 2, y);
    }
    // The capsule edge-on, just behind the face.
    cap.addRRect(Skia.RRectXY(Skia.XYWHRect(split + (half - split) * 0.18, len * 0.08, (half - split) * 0.64, len * 0.12), len * 0.04, len * 0.04));
  } else {
    // From above: the body's footprint, the basket's crown with its mesh.
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(-half, 0, cross, len), Math.min(cross, len) * 0.36, Math.min(cross, len) * 0.36));
    head.addRRect(Skia.RRectXY(Skia.XYWHRect(-half * 0.82, len * 0.08, cross * 0.82, len * 0.84), Math.min(cross, len) * 0.32, Math.min(cross, len) * 0.32));
    const step = Math.max(2, len * 0.09);
    for (let x = -half * 0.78; x < half * 0.78; x += step) {
      mesh.moveTo(x, len * 0.1);
      mesh.lineTo(x, len * 0.9);
    }
    cap.addRect(Skia.XYWHRect(-half * 0.6, len * 0.12, cross * 0.6, len * 0.08));
  }
  return { body, head, mesh, ring, cap, tall };
}

export function SideLdcMic({ cross, len, tint }: { cross: number; len: number; tint?: string }) {
  const p = useMemo(() => buildSideLdc(cross, len), [cross, len]);
  const hair = Math.max(0.35, len * 0.012);
  return (
    <Group>
      <Group transform={[{ translateX: -len * 0.05 }, { translateY: len * 0.06 }]}>
        <Path path={p.body} color="#000000" opacity={0.45}>
          <BlurMask blur={len * 0.08} style="normal" />
        </Path>
      </Group>
      {/* Body: dark satin, lit from the upper left. */}
      <Path path={p.body}>
        <LinearGradient start={vec(0, 0)} end={vec(0, len)} colors={['#8a8f99', '#4a4e57', '#24262c', '#121317']} positions={[0, 0.25, 0.7, 1]} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      {/* Basket: metal shell, the capsule behind the mesh, the mesh. */}
      <Path path={p.head}>
        <LinearGradient start={vec(0, 0)} end={vec(0, len)} colors={['#c9ccd5', '#7f838d', '#2f3037']} positions={[0, 0.45, 1]} />
      </Path>
      <Path path={p.cap} color="#b9912f" opacity={0.55} />
      <Group clip={p.head}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.3, len * 0.012)} color="#0c0d10" opacity={0.75} />
      </Group>
      <Path path={p.ring}>
        <LinearGradient start={vec(0, 0)} end={vec(0, len)} colors={['#eef1f6', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.head} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.85} />
      {/* The front face: a rim light along it (the side the capsule faces). */}
      <Path path={p.head} style="stroke" strokeWidth={hair} color={tint ?? ACCENT} opacity={tint ? 0.95 : 0.35} />
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
      <HandheldMic x={0} y={r} angleDeg={0} grilleR={r} bodyLen={Math.max(r, len - 1.72 * r)} />
      {tint ? <Circle cx={0} cy={r} r={r} style="stroke" strokeWidth={Math.max(0.5, r * 0.06)} color={tint} opacity={0.95} /> : null}
    </Group>
  );
}

/** The side-address condenser for a VOICE (Lab 5): the same drawing, moved so
 *  the CENTRE OF ITS BASKET — where the capsule is — sits on the mic's front
 *  point (the singer sings into the basket; the body hangs below it). Seen
 *  from above it is the plain drawing. */
export function VocalLdcMic({ cross, len, tint }: { cross: number; len: number; tint?: string }) {
  const tall = cross > len * 1.8;
  return (
    <Group transform={tall ? [{ translateX: -0.29 * cross }] : []}>
      <SideLdcMic cross={cross} len={len} tint={tint} />
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
  const g = Math.max(r * 1.25, len * 0.05);
  const grid: SkPathT = Skia.Path.Make();
  grid.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, g), r * 0.22, r * 0.22));
  // The grid's side slots (a few vertical openings) and its front ring.
  const slots: SkPathT = Skia.Path.Make();
  for (const k of [-0.55, -0.18, 0.18, 0.55]) slots.addRRect(Skia.RRectXY(Skia.XYWHRect(r * k - r * 0.1, g * 0.2, r * 0.2, g * 0.62), r * 0.08, r * 0.08));
  const capsule: SkPathT = Skia.Path.Make();
  capsule.addRect(Skia.XYWHRect(-r * 0.98, g, r * 1.96, r * 0.9));
  const body: SkPathT = Skia.Path.Make();
  const b0 = g + r * 0.9;
  const knurl0 = len - r * 1.6;
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.96, b0, r * 1.92, knurl0 - b0), r * 0.08, r * 0.08));
  const knurl: SkPathT = Skia.Path.Make();
  knurl.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, knurl0, r * 2, len - knurl0), r * 0.12, r * 0.12));
  const ridges: SkPathT = Skia.Path.Make();
  for (let y = knurl0 + r * 0.25; y < len - r * 0.15; y += Math.max(0.6, r * 0.22)) {
    ridges.moveTo(-r * 0.95, y);
    ridges.lineTo(r * 0.95, y);
  }
  // The thin joint between the capsule and the preamp.
  const joint: SkPathT = Skia.Path.Make();
  joint.moveTo(-r * 0.98, b0);
  joint.lineTo(r * 0.98, b0);
  const shadow: SkPathT = Skia.Path.Make();
  shadow.addPath(grid);
  shadow.addPath(body);
  shadow.addPath(knurl);
  return { grid, slots, capsule, body, knurl, ridges, joint, shadow };
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
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#eef0f4', '#c4c8d0', '#7d828c', '#33363d']} positions={[0, 0.25, 0.65, 1]} />
      </Path>
      <Path path={p.capsule}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#f6f7fa', '#b9bec8', '#4a4e57']} />
      </Path>
      <Path path={p.knurl}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9ea3ad', '#5c6069', '#24262b']} />
      </Path>
      <Path path={p.ridges} style="stroke" strokeWidth={hair} color="#15161a" opacity={0.6} />
      <Path path={p.grid}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#dfe2e8', '#9298a3', '#3c4048']} />
      </Path>
      <Path path={p.slots} color="#0b0c0f" opacity={0.85} />
      <Path path={p.joint} style="stroke" strokeWidth={hair} color="#1a1b1f" opacity={0.7} />
      <Path path={p.grid} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.85} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.8} />
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
  }
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
  // The slots of the interference tube: short dark slits in pairs down its length.
  const slots: SkPathT = Skia.Path.Make();
  const n = Math.max(4, Math.round(fore / (r * 2.4)));
  for (let k = 1; k < n; k++) {
    const y = -fore + (k * fore) / n;
    slots.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.55, y - r * 0.45, r * 1.1, r * 0.55), r * 0.2, r * 0.2));
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
export function MikingMicArt({ art, r, len, cross, tint, fore = 0 }: { art: 'kickDynamic' | 'sdc' | 'boundary' | 'smallDynamic' | 'clipDynamic' | 'gooseneck' | 'instDynamic' | 'sideLdc' | 'vocalDynamic' | 'vocalLdc' | 'shotgun' | 'blimp' | 'lavalier' | 'dummyHead' | 'ambiTetra' | 'dmsCluster' | 'measMic' | 'slm' | 'shotgunMount' | 'broadcastDynamic' | 'headsetBoom' | 'lipRibbon' | 'flagHandheld'; r: number; len: number; cross?: number; tint?: string; fore?: number }) {
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
    /* Lab 7 group 1: the broadcast dynamic (micDrawingsBroadcast.tsx). */
    case 'broadcastDynamic':
      return <BroadcastDynamicMic r={r} len={len} tint={tint} />;
    /* Lab 6 group 6: the field and spatial mics (micDrawingsField.tsx). */
    case 'shotgun':
      return <ShotgunMic r={r} len={len} tint={tint} />;
    case 'blimp':
      return <BlimpMic r={r} len={len} tint={tint} />;
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
      return <VocalLdcMic cross={cross ?? r * 2} len={len} tint={tint} />;
    case 'sideLdc':
      return <SideLdcMic cross={cross ?? r * 2} len={len} tint={tint} />;
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
