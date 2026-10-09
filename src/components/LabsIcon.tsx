/**
 * LabsIcon — the official Labs icon (owner 2026-10-09): a small loudspeaker,
 * front view — cabinet, tweeter, woofer cone and its dust cap. Line art in
 * one colour, like the app's other small marks. Decorative: the text beside
 * it names the place.
 */
import Svg, { Circle, Rect } from 'react-native-svg';

export function LabsIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={1.75} width={14} height={20.5} rx={2.2} fill="none" stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={6.6} r={1.9} fill="none" stroke={color} strokeWidth={1.4} />
      <Circle cx={12} cy={15.2} r={4.6} fill="none" stroke={color} strokeWidth={1.6} />
      <Circle cx={12} cy={15.2} r={1.5} fill={color} />
    </Svg>
  );
}
