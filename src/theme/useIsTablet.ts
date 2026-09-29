/** Live "is this a tablet layout" — see ./tablet.ts for the rule (owner
 *  2026-09-29, tablet pass). Re-renders on rotation and Split View. */
import { useWindowDimensions } from 'react-native';
import { isTabletWindow } from './tablet';

export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return isTabletWindow(width, height);
}
