/** Live "is this a tablet layout" — see ./tablet.ts for the rule (owner
 *  2026-09-29, tablet pass). Re-renders on rotation and Split View. */
import { Dimensions, useWindowDimensions } from 'react-native';
import { isTabletWindow } from './tablet';

export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return isTabletWindow(width, height);
}

/**
 * Is the DEVICE a tablet — its current display, not the app's window (owner
 * 2026-09-29, Android large-screen pass). Layout asks `useIsTablet()` (a
 * split-screen pane on a tablet should lay out like a phone); ORIENTATION asks
 * this, because whether the app may turn is a property of the device in the
 * hand: an unfolded foldable (673 × 841) is a tablet, the same phone folded
 * (≈ 373 × 800) is not. Read it at call time — a foldable's display changes
 * under a running app. The same 600 short-edge rule, so no phone ever counts.
 */
export function isTabletDisplay(): boolean {
  const s = Dimensions.get('screen');
  return isTabletWindow(s.width, s.height);
}
