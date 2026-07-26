/**
 * ResetIcon — a counterclockwise circular arrow (the "undo / reset / replay"
 * symbol). Shared by the Flashcards "Reset deck" button and the pace-timer
 * RESET control (user request 2026-07-24 / 2026-07-25).
 */
import Svg, { Path } from 'react-native-svg';

export function ResetIcon({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        fill={color}
      />
    </Svg>
  );
}
