/**
 * A STANDING ADULT FROM ABOVE for react-native-svg plans (art fix 2026-10-16,
 * lab-art grading: "musicians on the riser are UI 'user' glyphs — head and
 * shoulders with no bodies — that read as app icons, not people").
 *
 * The same figure the Skia plans draw (PlayerFigure's SINGER_TOP: the shirt's
 * shoulders and the tops of the hanging arms as ONE garment silhouette, the
 * head from above — cranium, ears close to the skull, the tip of the nose
 * toward the front — in the house skin tone, bald and faceless), in the
 * PlayerFigure palette, lit from the upper left. Authored in millimetres at
 * true size (≈ 470 mm across the arms, ≈ 230 mm chest-to-back); the caller
 * gives the scale. No feet: a standing figure seen from above hides them
 * (owner D68).
 *
 * `facingDeg` turns the figure (SVG rotate, clockwise on screen): 0 = facing
 * +y (down the plan, toward the house), −90 = facing +x, 90 = facing −x.
 */
import { useId, useMemo } from 'react';
import { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { catmullInto, svgPathSink } from './headIconGeometry';

type XY = readonly [number, number];

/** PlayerFigure FIGURE_TONES (shirt, skin) — kept in step by hand. */
const SHIRT = { ramp: ['#76839e', '#55617b', '#3a4357', '#262c3a'], edge: '#12151c', seam: '#161a24' } as const;
const SKIN = { ramp: ['#c3ab98', '#a28977', '#7d6656', '#5a4639'], edge: '#2a201a', rim: '#ecdccd' } as const;

const mirror = (half: readonly XY[]): XY[] => [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y] as XY)];

/** Shoulders + the tops of the arms, one silhouette (front = +y). */
const BODY: XY[] = mirror([
  [0, -116],
  [92, -110],
  [162, -98],
  [210, -76],
  [234, -40],
  [238, 4],
  [228, 46],
  [202, 78],
  [158, 94],
  [92, 104],
  [0, 110],
]);
/** The head from above (PlayerFigure headAbove, r = 96 mm), nose +y. */
const HK = 96 / 110;
const HY = 14; // the head sits a little forward of the shoulder line
const H = (x: number, y: number): XY => [x * HK, y * HK + HY];
const SKULL: XY[] = [H(0, -98), H(62, -80), H(80, -10), H(70, 60), H(36, 92), H(0, 98), H(-36, 92), H(-70, 60), H(-80, -10), H(-62, -80)];
const EARS: XY[][] = [-1, 1].map((s) => [H(s * 70, -16), H(s * 86, -6), H(s * 88, 14), H(s * 74, 26)]);
const NOSE: XY[] = [H(-12, 86), H(0, 114), H(12, 86)];

function closedD(pts: readonly XY[], tension = 0.55): string {
  const p = svgPathSink();
  catmullInto(p, pts, 1, true, tension);
  return p.d();
}

export function FigureAboveSvg({ x, y, pxPerMm, facingDeg = 0, dim = 1, halo }: { x: number; y: number; pxPerMm: number; facingDeg?: number; dim?: number; /** A light rim round the whole figure, for plans where it is only a few px across (true scale on a venue plot). */ halo?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const d = useMemo(() => {
    const seams = [-1, 1]
      .map((s) => {
        const p = svgPathSink();
        catmullInto(p, [[s * 170, -94], [s * 160, -30], [s * 164, 40], [s * 176, 88]], 1, false, 0.5);
        return p.d();
      })
      .join('');
    return { body: closedD(BODY, 0.5), skull: closedD(SKULL), ears: EARS.map((e) => closedD(e, 0.6)), nose: closedD(NOSE, 0.5), seams };
  }, []);
  // Contours stay about 0.6 px whatever the scale.
  const line = 0.6 / pxPerMm;
  return (
    <G transform={`translate(${x} ${y}) rotate(${facingDeg}) scale(${pxPerMm})`} opacity={dim}>
      <Defs>
        <LinearGradient id={`fas${uid}`} gradientUnits="userSpaceOnUse" x1={-200} y1={-120} x2={200} y2={110}>
          {SHIRT.ramp.map((c, i) => (
            <Stop key={c} offset={i / 3} stopColor={c} />
          ))}
        </LinearGradient>
        <LinearGradient id={`fak${uid}`} gradientUnits="userSpaceOnUse" x1={-80} y1={-70} x2={80} y2={100}>
          {SKIN.ramp.map((c, i) => (
            <Stop key={c} offset={i / 3} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      {/* contact shadow, offset down-right (light from the upper left) */}
      <Path d={d.body} fill="#000" opacity={0.4} transform="translate(22 30)" />
      {halo ? <Path d={d.body} fill="none" stroke={halo} strokeWidth={1.4 / pxPerMm} strokeLinejoin="round" opacity={0.85} /> : null}
      <Path d={d.body} fill={`url(#fas${uid})`} stroke={SHIRT.edge} strokeWidth={line} strokeLinejoin="round" />
      {/* the armhole seams: the sleeves are part of the same shirt */}
      <Path d={d.seams} fill="none" stroke={SHIRT.seam} strokeWidth={line * 0.8} opacity={0.55} />
      {d.ears.map((e, i) => (
        <Path key={i} d={e} fill={`url(#fak${uid})`} stroke={SKIN.edge} strokeWidth={line} />
      ))}
      <Path d={d.nose} fill={`url(#fak${uid})`} stroke={SKIN.edge} strokeWidth={line} />
      <Path d={d.skull} fill={`url(#fak${uid})`} stroke={SKIN.edge} strokeWidth={line} strokeLinejoin="round" />
      {/* the crown catches the light */}
      <Path d={closedD([H(-30, -60), H(4, -74), H(20, -40), H(-12, -26)], 0.6)} fill={SKIN.rim} opacity={0.28} />
    </G>
  );
}

/** The figure's width across the arms, mm (for layout and overlap checks). */
export const FIGURE_ABOVE_W_MM = 476;
