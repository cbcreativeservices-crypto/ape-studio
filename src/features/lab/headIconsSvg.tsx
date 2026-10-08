/**
 * THE HEAD ICONS — react-native-svg renderer (head fix 2026-10-08). Same
 * geometry as the Skia HeadIcon (headIconGeometry.ts), as unit-scale SVG path
 * strings scaled by a transform. No Skia import, so SVG screens stay
 * Skia-free.
 *
 * ⛔ OWNER RULE 2026-10-08: only for a head ALONE. A head on a body is the
 * figure's skin-silhouette head (FigureHeadSvg / FigureHead), never the icon.
 *
 * Returns a <G>: render it inside the caller's <Svg>, whose root already
 * carries the accessibility hiding (a11y ratchet).
 */
import Svg, { G, Path } from 'react-native-svg';
import {
  ABOVE_CANON,
  HEAD_ABOVE_SVG,
  HEAD_ICON_LINE,
  HEAD_ICON_PLATE,
  HEAD_SIDE_SVG,
  SIDE_CANON,
  SIDE_CENTER,
  SIDE_NECK,
  headIconScale,
  type HeadIconView,
} from './headIconGeometry';

export { HEAD_ICON_LINE, HEAD_ICON_PLATE, aboveRotation, appendHeadIcon, headIconScale, headIconStroke, svgPathSink, type HeadIconView } from './headIconGeometry';

export type HeadIconSvgProps = {
  view: HeadIconView;
  /** side = the mouth (or the box centre with anchor 'center'); above = centre. */
  x: number;
  y: number;
  /** Crown→chin height in px. */
  size: number;
  /** SIDE: which way the face looks (authored LEFT; 'right' mirrors). */
  facing?: 'left' | 'right';
  /** Radians. SIDE: a tilt. ABOVE: the heading (aboveRotation(dx, dy)). */
  rotation?: number;
  anchor?: 'origin' | 'center' | 'neck';
  tint?: string;
  tintOpacity?: number;
  plate?: boolean;
  speaking?: boolean;
  /** Stroke floor in px. */
  minStroke?: number;
  color?: string;
  opacity?: number;
};

export function HeadIconSvg({
  view,
  x,
  y,
  size,
  facing = 'right',
  rotation = 0,
  anchor = 'origin',
  tint,
  tintOpacity = 0.34,
  plate,
  speaking,
  minStroke = 0,
  color = HEAD_ICON_LINE,
  opacity = 1,
}: HeadIconSvgProps) {
  const s = headIconScale(view, size);
  const lwPx = Math.max(minStroke, (view === 'side' ? SIDE_CANON.stroke : ABOVE_CANON.stroke) * s);
  const lw = lwPx / s; // in unit space (the group scales it back)
  const deg = (rotation * 180) / Math.PI;
  const flip = view === 'side' && facing === 'right' ? -1 : 1;
  const at = anchor === 'center' ? SIDE_CENTER : anchor === 'neck' ? SIDE_NECK : null;
  const shift = view === 'side' && at ? ` translate(${-at[0]} ${-at[1]})` : '';
  const transform = `translate(${x} ${y}) rotate(${deg}) scale(${flip * s} ${s})${shift}`;
  const d = view === 'side' ? HEAD_SIDE_SVG : HEAD_ABOVE_SVG;
  const stroke = { fill: 'none', strokeWidth: lw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <G transform={transform} opacity={opacity}>
      {plate ? <Path d={d.plate} fill={HEAD_ICON_PLATE} /> : null}
      <Path d={d.lines} stroke={color} {...stroke} />
      {tint ? <Path d={d.lines} stroke={tint} strokeOpacity={tintOpacity} {...stroke} /> : null}
      {speaking && view === 'side' ? <Path d={HEAD_SIDE_SVG.open} stroke={color} {...stroke} /> : null}
    </G>
  );
}

/** Side icon's crown→chin size that fits its whole drawing (nose tip →
 *  occiput, crown → neck base: 43.8 × 56 head units) in a `box` square. */
const sideFit = (box: number) => ((box * 0.84) / (SIDE_CANON.neckBase - SIDE_CANON.crown)) * SIDE_CANON.height;
/** Above icon's size that fits a `box` square (it is 100 × 79.4 units). */
const aboveFit = (box: number) => box * 0.84;

/**
 * A head icon in its OWN <Svg> square (a glyph in a row of glyphs). Hidden
 * from the accessibility tree unless `label` makes it ONE labelled element.
 */
export function HeadGlyph({
  view,
  size,
  facing = 'right',
  rotation = 0,
  speaking,
  color,
  tint,
  label,
}: {
  view: HeadIconView;
  size: number;
  facing?: 'left' | 'right';
  rotation?: number;
  speaking?: boolean;
  color?: string;
  tint?: string;
  label?: string;
}) {
  const icon = view === 'side' ? sideFit(size) : aboveFit(size);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}
    >
      <HeadIconSvg
        view={view}
        x={size / 2}
        y={size / 2}
        size={icon}
        facing={facing}
        rotation={rotation}
        anchor="center"
        speaking={speaking}
        color={color}
        tint={tint}
        minStroke={1.4}
      />
    </Svg>
  );
}
