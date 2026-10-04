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
// SOURCES.md §d) — never a brand's likeness. Same conventions as above: the
// mic's FRONT (grille front; the element end of a boundary plate) sits at the
// origin and the body extends toward +y; sizes are in the caller's units (the
// Miking scenes draw in millimetres). These are the in-scene bodies; a later
// art pass may enrich them, keeping the outline sizes.

function buildKickDynamic(r: number, len: number) {
  // Front grille: a shallow dome on a straight basket (≈ 40 % of the length),
  // a dark collar ring, then a body tapering slightly to the XLR tail.
  const gl = len * 0.4;
  const dome = r * 0.28;
  const grille: SkPathT = Skia.Path.Make();
  grille.moveTo(-r, dome);
  grille.quadTo(-r, 0, 0, 0);
  grille.quadTo(r, 0, r, dome);
  grille.lineTo(r, gl);
  grille.lineTo(-r, gl);
  grille.close();
  const mesh: SkPathT = Skia.Path.Make();
  for (let i = 1; i <= 5; i++) {
    const yy = dome * 0.6 + ((gl - dome * 0.6) * i) / 6;
    mesh.moveTo(-r * 0.96, yy);
    mesh.lineTo(r * 0.96, yy);
  }
  for (let i = -3; i <= 3; i++) {
    const xx = (i / 3.6) * r;
    mesh.moveTo(xx, dome * (1 - Math.abs(xx) / r) * 0.5 + dome * 0.35);
    mesh.lineTo(xx, gl - r * 0.04);
  }
  const collar: SkPathT = Skia.Path.Make();
  collar.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 1.02, gl, r * 2.04, len * 0.07), r * 0.06, r * 0.06));
  const bt = gl + len * 0.07;
  const body: SkPathT = Skia.Path.Make();
  body.moveTo(-r * 0.98, bt);
  body.lineTo(-r * 0.78, len - r * 0.3);
  body.quadTo(-r * 0.78, len, -r * 0.5, len);
  body.lineTo(r * 0.5, len);
  body.quadTo(r * 0.78, len, r * 0.78, len - r * 0.3);
  body.lineTo(r * 0.98, bt);
  body.close();
  const band: SkPathT = Skia.Path.Make();
  band.addRect(Skia.XYWHRect(-r * 0.9, bt + (len - bt) * 0.45, r * 1.8, len * 0.035));
  return { grille, mesh, collar, body, band, gl };
}

/** END-ADDRESS KICK DYNAMIC: radius `r`, overall length `len`, front at the origin. */
export function KickDynamicMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildKickDynamic(r, len), [r, len]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={p.body}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={['#202227', '#5d616c', '#383a42', '#17181c']} positions={[0, 0.3, 0.6, 1]} />
      </Path>
      <Path path={p.band} color={ACCENT} opacity={0.45} />
      <Path path={p.collar}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={['#2a2b31', '#8d919c', '#26272d']} />
      </Path>
      <Path path={p.grille}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, p.gl)} colors={['#c3c7d0', '#7b7f89', '#34363d']} positions={[0, 0.42, 1]} />
      </Path>
      <Path path={p.mesh} color="#121318" style="stroke" strokeWidth={Math.max(0.4, r * 0.035)} opacity={0.55} />
      <Path path={p.grille} style="stroke" strokeWidth={Math.max(0.4, r * 0.04)} color={tint ?? '#d8dbe3'} opacity={tint ? 0.95 : 0.4} />
    </Group>
  );
}

function buildSdc(r: number, len: number) {
  const gl = len * 0.22;
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.86, 0, r * 1.72, gl), r * 0.3, r * 0.3));
  const mesh: SkPathT = Skia.Path.Make();
  for (let i = 1; i <= 3; i++) {
    const yy = (gl * i) / 4;
    mesh.moveTo(-r * 0.8, yy);
    mesh.lineTo(r * 0.8, yy);
  }
  const body: SkPathT = Skia.Path.Make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, gl, r * 2, len - gl), r * 0.18, r * 0.18));
  const ring: SkPathT = Skia.Path.Make();
  ring.addRect(Skia.XYWHRect(-r, gl + len * 0.05, r * 2, len * 0.03));
  return { grille, mesh, body, ring, gl };
}

/** SMALL-CAPSULE CONDENSER: radius `r`, length `len`, front at the origin. */
export function SdcMic({ r, len, x = 0, y = 0, angleDeg = 0, tint }: { r: number; len: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildSdc(r, len), [r, len]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={p.body}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, 0)} colors={[METAL_LO, METAL_HI, METAL_MID, '#2b2d34']} positions={[0, 0.28, 0.58, 1]} />
      </Path>
      <Path path={p.ring} color={ACCENT} opacity={0.45} />
      <Path path={p.grille}>
        <LinearGradient start={vec(-r, 0)} end={vec(r, p.gl)} colors={['#d2d5dd', '#868a94', '#3a3c44']} />
      </Path>
      <Path path={p.mesh} color="#121318" style="stroke" strokeWidth={Math.max(0.4, r * 0.04)} opacity={0.5} />
      <Path path={p.grille} style="stroke" strokeWidth={Math.max(0.4, r * 0.05)} color={tint ?? '#d8dbe3'} opacity={tint ? 0.95 : 0.35} />
    </Group>
  );
}

function buildBoundary(len: number, cross: number) {
  const plate: SkPathT = Skia.Path.Make();
  plate.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross / 2, 0, cross, len), Math.min(cross, len) * 0.12, Math.min(cross, len) * 0.12));
  // The grille field at the element end (front), then the connector boss.
  const grille: SkPathT = Skia.Path.Make();
  grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross * 0.38, len * 0.05, cross * 0.76, len * 0.42), cross * 0.08, cross * 0.08));
  const holes: SkPathT = Skia.Path.Make();
  for (let i = 1; i <= 4; i++) {
    const yy = len * 0.05 + (len * 0.42 * i) / 5;
    holes.moveTo(-cross * 0.34, yy);
    holes.lineTo(cross * 0.34, yy);
  }
  const boss: SkPathT = Skia.Path.Make();
  boss.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross * 0.18, len * 0.9, cross * 0.36, len * 0.1), cross * 0.04, cross * 0.04));
  return { plate, grille, holes, boss };
}

/** BOUNDARY PLATE: `len` along its axis, `cross` = the visible cross size
 *  (its height in a side view, its width from above); element end at the origin. */
export function BoundaryMic({ len, cross, x = 0, y = 0, angleDeg = 0, tint }: { len: number; cross: number; x?: number; y?: number; angleDeg?: number; tint?: string }) {
  const p = useMemo(() => buildBoundary(len, cross), [len, cross]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={p.plate}>
        <LinearGradient start={vec(-cross / 2, 0)} end={vec(cross / 2, len)} colors={['#4a4d56', '#24262c', '#141519']} />
      </Path>
      {cross > 30 ? (
        <>
          <Path path={p.grille} color="#0e0f12" />
          <Path path={p.holes} color="#7d818b" style="stroke" strokeWidth={Math.max(0.4, cross * 0.012)} opacity={0.6} />
          <Path path={p.boss} color="#5b5f69" />
        </>
      ) : null}
      <Path path={p.plate} style="stroke" strokeWidth={Math.max(0.4, Math.min(cross, len) * 0.03)} color={tint ?? '#9a9ea8'} opacity={tint ? 0.95 : 0.6} />
    </Group>
  );
}
