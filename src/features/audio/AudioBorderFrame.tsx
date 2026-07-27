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
 *  - 2026-07-26 (b): owner refined it to TWO SIDE BARS ONLY — the top and
 *    bottom edges removed — and each side bar SHRUNK by 1/3 (spans 2/3 of the
 *    safe-area height, vertically centered). Less visually heavy while still
 *    unmistakable on the left and right edges.
 */
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioOutputEnabled } from './audioOutputStore';

// Vivid warning red (brighter than the old #c90000 so it reads as a warning).
const AUDIO_RED = '#ff2a2a';
const THICK = 6;
// Each side bar spans 2/3 of the safe-area height, centered — i.e. shrunk by
// 1/3, trimming 1/6 off the top and 1/6 off the bottom.
const INSET_PCT = `${100 / 6}%`;

export function AudioBorderFrame() {
  const on = useAudioOutputEnabled();
  const insets = useSafeAreaInsets();
  if (!on) return null;
  // Container spans the safe area (just inside the status/nav bars + rounded
  // corners); the two bars sit on its left and right edges.
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 2,
        bottom: insets.bottom + 2,
        left: insets.left + 2,
        right: insets.right + 2,
      }}
    >
      <View style={[styles.side, { left: 0 }]} />
      <View style={[styles.side, { right: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    position: 'absolute',
    top: INSET_PCT,
    bottom: INSET_PCT,
    width: THICK,
    backgroundColor: AUDIO_RED,
    borderRadius: THICK / 2,
  },
});
