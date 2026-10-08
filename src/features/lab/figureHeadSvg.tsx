/**
 * A FIGURE'S HEAD for react-native-svg screens (head fix 2026-10-08) — the
 * same look as the Miking PlayerFigure FigureHead (figureHead.tsx), without
 * Skia: one skin-tone silhouette (skull, ears, the neck into the collar), the
 * skin gradient, a lit crescent on the upper left, a core-shadow crescent on
 * the lower right, a darker contour. Neutral, no face.
 *
 * ⛔ OWNER RULE 2026-10-08: a head on a body is drawn like this — never the
 * line-art head icon, never a circle.
 *
 * The outline follows PlayerFigure's headFront / headProfile point for point
 * (head radius 110 units, centre at the origin), traced as ONE closed contour
 * so the crescents can be cut with an even-odd fill inside a clip (SVG has no
 * path boolean ops).
 */
import { useId } from 'react';
import { ClipPath, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { catmullInto, svgPathSink, type PathSink } from './headIconGeometry';

type XY = readonly [number, number];

/** The skin tone, from PlayerFigure FIGURE_TONES.skin. */
const SKIN = { ramp: ['#c3ab98', '#a28977', '#7d6656', '#5a4639'], rim: '#ecdccd', core: '#2b1f18', edge: '#2a201a', rimW: 4.5, coreW: 16 } as const;
/** Head radius in units: crown→chin ≈ 226 units (headFront −118 … +108). */
const SPAN = 226;

const offset = (p: PathSink, dx: number, dy: number): PathSink => ({
  moveTo: (x, y) => p.moveTo(x + dx, y + dy),
  lineTo: (x, y) => p.lineTo(x + dx, y + dy),
  cubicTo: (a, b, c, d, x, y) => p.cubicTo(a + dx, b + dy, c + dx, d + dy, x + dx, y + dy),
  close: () => p.close(),
});

/** Front: neck (left, bottom) → jaw → ear → cranium → ear → jaw → neck. */
function frontContour(nb: number): XY[] {
  const half: XY[] = [
    [-50, nb],
    [-47, nb * 0.55 + 40],
    [-46, 88],
    [-58, 75],
    [-71, 42],
    [-80, 44],
    [-90, 38],
    [-96, 14],
    [-90, -8],
    [-79, -12],
    [-81, -26],
    [-77, -70],
    [-52, -108],
    [0, -118],
  ];
  return [...half, ...half.slice(0, -1).reverse().map(([x, y]) => [-x, y] as XY)];
}

/** Profile, authored facing −x: throat → chin → face → crown → nape → neck. */
function sideContour(nb: number): XY[] {
  return [
    [-46, nb],
    [-41, (98 + nb) / 2],
    [-40, 98],
    [-60, 94],
    [-72, 84],
    [-76, 70],
    [-84, 60],
    [-80, 52],
    [-85, 45],
    [-82, 33],
    [-90, 32],
    [-102, 24],
    [-92, 8],
    [-83, -9],
    [-77, -21],
    [-82, -30],
    [-80, -44],
    [-70, -78],
    [-46, -106],
    [-6, -120],
    [40, -114],
    [80, -86],
    [100, -36],
    [102, 18],
    [84, 66],
    [62, 98],
    [64, (98 + nb) / 2],
    [68, nb],
  ];
}

function contourD(view: 'front' | 'side', nb: number, dx = 0, dy = 0): string {
  const sink = svgPathSink();
  const pts = view === 'front' ? frontContour(nb) : sideContour(nb);
  catmullInto(offset(sink, dx, dy), pts, 1, false, 0.5);
  sink.lineTo(pts[0][0] + dx, pts[0][1] + dy);
  sink.close();
  return sink.d();
}

/**
 * The figure head centred on (cx, cy), `h` tall (crown→chin) in the caller's
 * units; the neck runs down to `neckTo` (default a short neck). Side view:
 * `facing` +1 = the face toward +x. Render inside the caller's <Svg>.
 */
export function FigureHeadSvg({
  view,
  cx,
  cy,
  h,
  neckTo,
  facing = 1,
  minContour = 0.7,
}: {
  view: 'front' | 'side';
  cx: number;
  cy: number;
  h: number;
  neckTo?: number;
  facing?: number;
  minContour?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const k = h / SPAN;
  const nb = neckTo === undefined ? 140 : Math.max(112, (neckTo - cy) / k);
  const sil = contourD(view, nb);
  const rim = sil + contourD(view, nb, SKIN.rimW * 0.8, SKIN.rimW);
  const core = sil + contourD(view, nb, -SKIN.coreW * 0.75, -SKIN.coreW);
  const flip = view === 'side' && facing >= 0 ? -1 : 1; // authored facing −x
  const contour = Math.max(2.6, minContour / k);
  return (
    <G transform={`translate(${cx} ${cy}) scale(${flip * k} ${k})`}>
      <Defs>
        <LinearGradient id={`fhg${uid}`} gradientUnits="userSpaceOnUse" x1={-110} y1={-120} x2={110} y2={nb}>
          <Stop offset={0} stopColor={SKIN.ramp[0]} />
          <Stop offset={0.38} stopColor={SKIN.ramp[1]} />
          <Stop offset={0.72} stopColor={SKIN.ramp[2]} />
          <Stop offset={1} stopColor={SKIN.ramp[3]} />
        </LinearGradient>
        <ClipPath id={`fhc${uid}`}>
          <Path d={sil} />
        </ClipPath>
      </Defs>
      <Path d={sil} fill={`url(#fhg${uid})`} />
      <G clipPath={`url(#fhc${uid})`}>
        <Path d={core} fill={SKIN.core} fillRule="evenodd" opacity={0.42} />
        <Path d={rim} fill={SKIN.rim} fillRule="evenodd" opacity={0.55} />
      </G>
      <Path d={sil} fill="none" stroke={SKIN.edge} strokeWidth={contour} strokeLinejoin="round" opacity={0.95} />
    </G>
  );
}
