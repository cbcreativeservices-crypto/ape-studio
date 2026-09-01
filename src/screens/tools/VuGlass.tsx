/**
 * VuGlass — the meter's glass pane, drawn in code rather than baked into the
 * skin artwork (owner "Plan B", 2026-09-01).
 *
 * Image generators reliably fail at meter glass: they render it as a mirror —
 * a reflected room, a hard diagonal light bar, a wet gloss layer — and every
 * one of those reads as fake over a flat, straight-on dial. Photographed
 * head-on under diffuse light, real meter glass is almost invisible. Only four
 * cues sell it, and they are all soft gradients, which is exactly what code is
 * good at:
 *
 *   1. the shadow the bezel casts onto the face (the pane sits a few mm proud
 *      of the dial) — by far the strongest cue,
 *   2. one very broad, very low-contrast sheen,
 *   3. a faint darkening where the pane meets the bezel, and corner vignette,
 *   4. sparse imperfections — dust, a smudge, a couple of hairline scratches.
 *
 * Drawn ON TOP of everything (scale, lamp, needle), because that is where a
 * pane physically is. Clipped to the face window so it never touches the
 * bezel. No SVG filters are used — blur support is inconsistent across
 * platforms, so every soft edge here is a gradient.
 *
 * Every value in GLASS below is a tuning dial: change a number, reload, look.
 */
import { useId, type ReactNode } from 'react';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SKIN_VB, VU_FACE } from './vuGeometry';

/** Tuning. All alphas are 0–1; raise to make the pane more present. */
export const GLASS = {
  /** Cast shadow under the bezel's top edge — the "there is a pane" cue. */
  topShadow: 0.4,
  /** How far down the face that shadow reaches (fraction of face height). */
  topShadowDepth: 0.2,
  /** The same from the left edge, weaker (key light sits upper-left). */
  leftShadow: 0.2,
  leftShadowDepth: 0.1,
  /** Darkening right at the pane's edge, all the way round. */
  edgeDark: 0.22,
  /** Peak whiteness of the broad sheen. Keep this small — a few percent. */
  sheen: 0.06,
  /** Corner vignette. */
  vignette: 0.16,
  /** Imperfections: dust specks and hairline scratches. */
  dust: 0.11,
  scratch: 0.07,
};

const F = VU_FACE; // x, y, w, h, rx — the glass window in skin space

/** Sparse, deterministic imperfections (no RNG — the pane must not shimmer
 *  between renders). Positions are fractions of the face box. */
const DUST: ReadonlyArray<{ u: number; v: number; r: number }> = [
  { u: 0.21, v: 0.34, r: 2.2 }, { u: 0.63, v: 0.19, r: 1.6 }, { u: 0.78, v: 0.62, r: 2.6 },
  { u: 0.37, v: 0.74, r: 1.8 }, { u: 0.52, v: 0.45, r: 1.4 }, { u: 0.88, v: 0.29, r: 1.9 },
];
const SCRATCH: ReadonlyArray<{ u1: number; v1: number; u2: number; v2: number }> = [
  { u1: 0.14, v1: 0.62, u2: 0.34, v2: 0.55 },
  { u1: 0.58, v1: 0.28, u2: 0.79, v2: 0.2 },
];

const fx = (u: number) => F.x + u * F.w;
const fy = (v: number) => F.y + v * F.h;

/**
 * The pane. Render it LAST, absolutely positioned over the meter, with the
 * same viewBox + preserveAspectRatio as the skin so it lines up exactly.
 */
export function VuGlass({ width, height, par }: { width: number; height: number; par: string }): ReactNode {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clip = `${uid}gc`;
  const gTop = `${uid}gt`;
  const gLeft = `${uid}gl`;
  const gSheen = `${uid}gs`;
  const gEdgeT = `${uid}get`;
  const gEdgeB = `${uid}geb`;
  return (
    <Svg
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, top: 0 }}
      width={width}
      height={height}
      viewBox={SKIN_VB}
      preserveAspectRatio={par}
    >
      <Defs>
        <ClipPath id={clip}>
          <Rect x={F.x} y={F.y} width={F.w} height={F.h} rx={F.rx} ry={F.rx} />
        </ClipPath>
        {/* 1. Bezel cast shadow — dark at the very top edge, gone by depth. */}
        <LinearGradient id={gTop} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity={GLASS.topShadow} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={gLeft} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity={GLASS.leftShadow} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
        {/* 2. One broad sheen, upper-left brighter — edges must be unfindable. */}
        <LinearGradient id={gSheen} x1="0" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={GLASS.sheen} />
          <Stop offset="0.45" stopColor="#ffffff" stopOpacity={GLASS.sheen * 0.35} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        {/* 3. Edge darkening, top and bottom bands. */}
        <LinearGradient id={gEdgeT} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity={GLASS.edgeDark} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={gEdgeB} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity={GLASS.edgeDark} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <G clipPath={`url(#${clip})`}>
        {/* Cast shadow from the bezel — the pane sits proud of the dial. */}
        <Rect x={F.x} y={F.y} width={F.w} height={F.h * GLASS.topShadowDepth} fill={`url(#${gTop})`} />
        <Rect x={F.x} y={F.y} width={F.w * GLASS.leftShadowDepth} height={F.h} fill={`url(#${gLeft})`} />
        {/* The broad sheen. */}
        <Rect x={F.x} y={F.y} width={F.w} height={F.h} fill={`url(#${gSheen})`} />
        {/* Edge darkening where the pane meets the bezel. */}
        <Rect x={F.x} y={F.y} width={F.w} height={26} fill={`url(#${gEdgeT})`} />
        <Rect x={F.x} y={F.y + F.h - 26} width={F.w} height={26} fill={`url(#${gEdgeB})`} />
        {/* Corner vignette — one soft ellipse larger than the face, so only its
            falloff reaches the corners. */}
        <Ellipse
          cx={F.x + F.w / 2}
          cy={F.y + F.h / 2}
          rx={F.w * 0.78}
          ry={F.h * 0.78}
          fill="none"
          stroke="#000"
          strokeOpacity={GLASS.vignette}
          strokeWidth={F.w * 0.34}
        />
        {/* 4. Imperfections — sparse enough to be felt, not seen. */}
        {DUST.map((d, i) => (
          <Ellipse key={`d${i}`} cx={fx(d.u)} cy={fy(d.v)} rx={d.r} ry={d.r} fill="#ffffff" fillOpacity={GLASS.dust} />
        ))}
        {SCRATCH.map((sc, i) => (
          <Rect
            key={`s${i}`}
            x={fx(sc.u1)}
            y={fy(sc.v1)}
            width={Math.hypot(fx(sc.u2) - fx(sc.u1), fy(sc.v2) - fy(sc.v1))}
            height={1.2}
            fill="#ffffff"
            fillOpacity={GLASS.scratch}
            transform={`rotate(${(Math.atan2(fy(sc.v2) - fy(sc.v1), fx(sc.u2) - fx(sc.u1)) * 180) / Math.PI} ${fx(sc.u1)} ${fy(sc.v1)})`}
          />
        ))}
      </G>
    </Svg>
  );
}
