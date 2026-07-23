/**
 * DeckIcon — a "deck of 3 cards" (user request 2026-07-23). The front card is
 * filled OPAQUE (lighter than the border) so the two staggered cards behind it
 * read as frames peeking out at the top/left — the hidden part behind the front
 * card is fully occluded (user 2026-07-23). Monochrome border via `color`
 * (BLUE loaded / GRAY not); `fill` tints the front card's opaque face.
 */
import Svg, { G, Rect } from 'react-native-svg';

export function DeckIcon({
  color,
  size = 33,
  fill = 'none',
}: {
  color: string;
  size?: number;
  /** Opaque face colour for the FRONT card (should be lighter than `color`).
   *  Defaults to 'none' — an outline-only deck. */
  fill?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Two back cards, offset up-and-left with a slight tilt — unfilled frames.
          Drawn first so the opaque front card covers the part behind it. */}
      <G transform="rotate(-16 10 10)">
        <Rect x={5} y={3} width={10} height={13} rx={2} fill="none" stroke={color} strokeWidth={1.3} />
      </G>
      <G transform="rotate(-8 12 12)">
        <Rect x={7} y={5} width={10} height={13} rx={2} fill="none" stroke={color} strokeWidth={1.3} />
      </G>
      {/* Front card — OPAQUE face hides the back cards behind it. */}
      <Rect x={9} y={7} width={10} height={13} rx={2} fill={fill} stroke={color} strokeWidth={1.3} />
    </Svg>
  );
}
