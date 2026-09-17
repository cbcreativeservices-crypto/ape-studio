/**
 * PatternFigure — a saved pattern drawn as line art on its object (react-
 * native-svg; Phase 4 design decision 5): the plate / head / dish face, the
 * region fills of an Artwork, the nodal lines, the outline. ONE renderer for
 * the gallery thumbnails, the open view, the art board (tap-to-fill), the
 * compare canvas and the capture card — and the same path data that
 * svgExport.ts writes, so what you see is what ships.
 *
 * No Skia: react-native-view-shot captures RN-SVG reliably on Android, and the
 * board is static between taps. Never resized during an interaction: the
 * frame is computed from the box it is given.
 */
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FIG_PAD, LINE_REF_W, figureLayers, fitFrame, shade, type FigureLayers } from '../../../features/cymatics/figure';
import type { PatternGeometry } from '../../../features/cymatics/patternField';
import type { Artwork } from '../../../features/cymatics/patternStore';

/** The PAPER choices of the art board (Artwork.background). */
export const PAPERS: { id: string; label: string; blurb?: string }[] = [
  { id: 'plate', label: 'Plate (material)', blurb: 'The object’s own face under the figure — aluminum, brass, the drumhead, the liquid.' },
  { id: '#000000', label: 'Black' },
  { id: '#ffffff', label: 'White' },
  { id: '#f4ecd8', label: 'Warm paper' },
  { id: '#0b1020', label: 'Navy' },
  { id: 'transparent', label: 'Transparent', blurb: 'For the transparent PNG — the object face is not drawn, so the figure composites onto anything.' },
];

let seq = 0;

/** The SVG layers of one figure at a frame (ids prefixed so several can share a root). */
export function FigureLayersSvg({ g, L, artwork, paper, id, lineScale }: { g: PatternGeometry; L: FigureLayers; artwork: Artwork | null; paper: string; id: string; lineScale: number }) {
  const lw = (artwork ? artwork.lineWeight : 1.5) * lineScale;
  const lc = artwork ? artwork.lineColor : '#ffffff';
  const showFace = paper === 'plate';
  const bg = paper !== 'plate' && paper !== 'transparent' ? paper : null;
  const f = L.frame;
  return (
    <>
      <Defs>
        <ClipPath id={`${id}c`}>
          <Path d={L.outlineD} clipRule="evenodd" />
        </ClipPath>
        {showFace ? (
          <LinearGradient id={`${id}hl`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={g.texture === 'matte' ? 0.08 : 0.24} />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={g.texture === 'glass' || g.texture === 'liquid' ? 0.28 : 0.18} />
          </LinearGradient>
        ) : null}
        {L.fills
          .filter((x) => x.style === 'gradient')
          .map((x) => (
            <RadialGradient key={x.region} id={`${id}g${x.region}`} cx={x.cx} cy={x.cy} r={x.r} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={x.color} />
              <Stop offset="1" stopColor={shade(x.color, 0.45)} />
            </RadialGradient>
          ))}
      </Defs>
      {bg ? <Rect x={f.ox - FIG_PAD} y={f.oy - FIG_PAD} width={f.w + FIG_PAD * 2} height={f.h + FIG_PAD * 2} fill={bg} /> : null}
      {showFace ? <Path d={L.outlineD} fill={g.face} fillRule="evenodd" /> : null}
      {showFace ? <Path d={L.outlineD} fill={`url(#${id}hl)`} fillRule="evenodd" /> : null}
      <G clipPath={`url(#${id}c)`}>
        {L.fills.map((x) => (
          <Path key={x.region} d={x.d} fill={x.style === 'gradient' ? `url(#${id}g${x.region})` : x.color} fillRule="evenodd" />
        ))}
        {lw > 0 && L.linesD ? <Path d={L.linesD} fill="none" stroke={lc} strokeWidth={Math.max(0.5, lw)} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </G>
      <Path d={L.outlineD} fill="none" stroke={g.edge} strokeWidth={Math.max(1, 2.5 * lineScale)} fillRule="evenodd" />
      {showFace ? <Path d={L.outlineD} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={Math.max(0.5, lineScale)} fillRule="evenodd" /> : null}
    </>
  );
}

export type PatternFigureProps = {
  geometry: PatternGeometry;
  artwork: Artwork | null;
  width: number;
  height: number;
  /** Overrides the artwork's paper (export: transparent). Default = artwork.background or 'plate'. */
  paper?: string;
  interactive?: boolean;
  /** Canvas-px tap position (for regionAtPx / domainPoint with the same frame). */
  onTap?: (x: number, y: number) => void;
  pad?: number;
};

export const PatternFigure = memo(function PatternFigure({ geometry, artwork, width, height, paper, interactive, onTap, pad = FIG_PAD }: PatternFigureProps) {
  const frame = useMemo(() => fitFrame(geometry.aspect, width, height, pad), [geometry.aspect, width, height, pad]);
  const L = useMemo(() => figureLayers(geometry, frame, artwork), [geometry, frame, artwork]);
  const id = useMemo(() => `pf${(seq++).toString(36)}`, []);
  const paperUsed = paper ?? artwork?.background ?? 'plate';
  const svg = (
    <Svg width={width} height={height}>
      <FigureLayersSvg g={geometry} L={L} artwork={artwork} paper={paperUsed} id={id} lineScale={frame.w / LINE_REF_W} />
    </Svg>
  );
  if (!interactive) return <View style={{ width, height }}>{svg}</View>;
  return (
    <Pressable style={{ width, height }} onPress={(e) => onTap?.(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessibilityRole="button" accessibilityLabel="Art board — tap a region to fill it">
      {svg}
    </Pressable>
  );
});
