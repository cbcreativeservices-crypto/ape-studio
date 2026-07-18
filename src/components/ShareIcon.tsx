/**
 * ShareIcon — the universally recognized share glyph (box with an up arrow,
 * as on iOS share sheets). Replaces the obscure ⇪ text glyph (Booth
 * 2026-07-18: "change share icon to more known and familiar icon").
 */
import Svg, { Path } from 'react-native-svg';

export function ShareIcon({ size = 18, color = '#8b8f97' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* tray (open at the top where the arrow exits) */}
      <Path
        d="M8.5 8.5H7A2 2 0 0 0 5 10.5V18A2 2 0 0 0 7 20H17A2 2 0 0 0 19 18V10.5A2 2 0 0 0 17 8.5H15.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* arrow up out of the tray */}
      <Path d="M12 14V3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M8.5 6.5L12 3L15.5 6.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
