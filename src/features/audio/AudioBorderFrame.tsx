/**
 * AudioBorderFrame — bright RED warning marks drawn whenever global audio
 * OUTPUT is enabled (owner request 2026-07-25). A persistent "the app can make
 * sound right now" warning on EVERY screen. Mounted once at the app root above
 * the navigator; pointerEvents 'none' so it never intercepts touches.
 *
 * Evolution:
 *  - 2026-07-26 (a): the original edge hairline was invisible on modern phones
 *    (hidden under the status bar / clipped by rounded corners) → moved to a
 *    solid frame INSET to the safe area, thickness doubled to ~6 px.
 *  - 2026-07-26 (b): owner refined it to two SIDE bars only.
 *  - 2026-07-30 (c): owner moved them to TOP + BOTTOM.
 *  - 2026-07-30 (d): owner dropped the BOTTOM bar — ONE top line only, spanning
 *    the full screen width CORNER TO CORNER (below the notch/status bar).
 */
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioOutputEnabled } from './audioOutputStore';

// Vivid warning red (brighter than the old #c90000 so it reads as a warning).
const AUDIO_RED = '#ff2a2a';
// Bar thickness (matches the previous bar weight).
const THICK = 2.58;

export function AudioBorderFrame() {
  const on = useAudioOutputEnabled();
  const insets = useSafeAreaInsets();
  if (!on) return null;
  // ONE line across the very top, full screen width (corner to corner), sitting
  // just below the status bar / notch so it's always visible.
  return (
    <View
      pointerEvents="none"
      style={[styles.bar, { top: insets.top, left: 0, right: 0 }]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: THICK,
    backgroundColor: AUDIO_RED,
  },
});
