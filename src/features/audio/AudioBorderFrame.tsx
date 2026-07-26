/**
 * AudioBorderFrame — a hairline-thin RED frame drawn on the extreme screen edge
 * whenever global audio OUTPUT is enabled (owner request 2026-07-25). It is a
 * persistent, always-visible "the app can make sound right now" warning shown on
 * EVERY screen. Mounted once at the app root above the navigator; pointerEvents
 * 'none' so it never intercepts touches.
 */
import { StyleSheet, View } from 'react-native';
import { useAudioOutputEnabled } from './audioOutputStore';

// Pure red at ~79% brightness (HSV value 0.79 → rgb 201,0,0).
const AUDIO_RED = '#c90000';

export function AudioBorderFrame() {
  const on = useAudioOutputEnabled();
  if (!on) return null;
  return <View pointerEvents="none" style={styles.frame} />;
}

const styles = StyleSheet.create({
  // Fills the full-screen root; the border is the thinnest line the platform
  // can draw, on all four extreme edges.
  frame: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AUDIO_RED,
  },
});
