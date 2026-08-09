/**
 * LinkIcon — the chain-link glyph for the glossary's SHOW LINKS / HIDE LINKS
 * toggle (owner 2026-08-07). `off` draws the same chain with a slash through
 * it, so the two states read as one control rather than two different icons.
 *
 * The toggle is GLOBAL (it turns cross-links off across the whole glossary)
 * even though it appears in each term's own icon row.
 */
import Svg, { Line, Path } from 'react-native-svg';

export function LinkIcon({ size = 18, color = '#8b8f97', off = false }: { size?: number; color?: string; off?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* two interlocking chain links */}
      <Path
        d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.2 1.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.2-1.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* struck through when links are hidden */}
      {off ? <Line x1={4} y1={20} x2={20} y2={4} stroke={color} strokeWidth={1.8} strokeLinecap="round" /> : null}
    </Svg>
  );
}
