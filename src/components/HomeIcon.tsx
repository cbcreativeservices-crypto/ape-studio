/**
 * HomeIcon — the house glyph (same shape as the bottom-nav Home tab) used as the
 * "add to Home screen" toggle so it clearly points to the Home screen (user
 * request 2026-07-22). Filled/lit when the item is on Home, outline when not.
 */
import Svg, { Path } from 'react-native-svg';

export function HomeIcon({ color, filled, size = 20 }: { color: string; filled?: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3 L21 10.5 L21 21 L14.5 21 L14.5 14.5 L9.5 14.5 L9.5 21 L3 21 L3 10.5 Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 1 : 1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
