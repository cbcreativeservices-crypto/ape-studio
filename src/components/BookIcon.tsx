/**
 * BookIcon — a simple book glyph (evokes the academy logo). Used as the
 * "place on Home screen" toggle: filled when the topic is on Home, outline
 * otherwise (user request 2026-07-22).
 */
import Svg, { Path, Line } from 'react-native-svg';

export function BookIcon({ color, filled, size = 20 }: { color: string; filled?: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6.5 3.5H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 18V6A2.5 2.5 0 0 1 6.5 3.5z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Line x1={8.5} y1={3.5} x2={8.5} y2={20.5} stroke={filled ? '#0d0d0d' : color} strokeWidth={1.2} />
    </Svg>
  );
}
