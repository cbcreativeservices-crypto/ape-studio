/**
 * FullscreenIcon — corner-bracket frame + a thin double-sided diagonal arrow
 * (bottom-left ↔︎ top-right). Shared so the flashcards row and the interactive
 * study-method screens show the SAME glyph (user request 2026-07-25).
 */
import Svg, { Path } from 'react-native-svg';

export function FullscreenIcon({ color, size = 23 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Corner-bracket frame. */}
      <Path
        d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Thin double-sided diagonal arrow, gapped from the brackets. */}
      <Path
        d="M8.5 15.5 L15.5 8.5 M15.5 8.5 L12 8.5 M15.5 8.5 L15.5 12 M8.5 15.5 L12 15.5 M8.5 15.5 L8.5 12"
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
