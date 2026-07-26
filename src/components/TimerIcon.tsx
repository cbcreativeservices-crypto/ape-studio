/**
 * TimerIcon — a stopwatch glyph (top button + stem, circular body, a diagonal
 * hand). Used for the study-method pace-timer button so it renders consistently
 * on iOS/Android instead of the platform ⏱ emoji (user request 2026-07-25).
 */
import Svg, { Line, Path } from 'react-native-svg';

export function TimerIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Body — a ring with the arc from ~10 o'clock to ~11:50 left OPEN, so the
          hand appears to poke out through the gap (user request 2026-07-25).
          Drawn as clockwise sub-arcs through 12/3/6/9 o'clock so the geometry is
          unambiguous; it starts at 11:50 and ends at 10:00. */}
      <Path
        d="M 11.355 6.628 A 7.4 7.4 0 0 1 12 6.6 A 7.4 7.4 0 0 1 19.4 14 A 7.4 7.4 0 0 1 12 21.4 A 7.4 7.4 0 0 1 4.6 14 A 7.4 7.4 0 0 1 5.591 10.3"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Hand, pointing up-left. */}
      <Line x1={12} y1={14} x2={8.6} y2={10.6} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
