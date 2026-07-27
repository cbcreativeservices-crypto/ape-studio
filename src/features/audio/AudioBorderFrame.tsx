/**
 * AudioBorderFrame — a bright RED frame drawn around the screen whenever global
 * audio OUTPUT is enabled (owner request 2026-07-25; made clearly visible
 * 2026-07-26 per owner: "anytime audio output is on and can happen, that visual
 * has to be on"). A persistent "the app can make sound right now" warning on
 * EVERY screen. Mounted once at the app root above the navigator; pointerEvents
 * 'none' so it never intercepts touches.
 *
 * Visibility fix (2026-07-26): the original hairline frame at the extreme screen
 * edge was invisible on modern phones — hidden under the status bar / gesture
 * nav and clipped by the rounded display corners. It is now a solid ~3 px frame
 * INSET to the safe area so all four sides are fully on-screen and unmistakable.
 */
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioOutputEnabled } from './audioOutputStore';

// Vivid warning red (brighter than the old #c90000 so it reads as a warning).
const AUDIO_RED = '#ff2a2a';
const THICK = 3;

export function AudioBorderFrame() {
  const on = useAudioOutputEnabled();
  const insets = useSafeAreaInsets();
  if (!on) return null;
  // Inset the frame just inside the safe area (never under the status/nav bars
  // or clipped by rounded corners) + a small margin so it always reads clearly.
  return (
    <View
      pointerEvents="none"
      style={[
        styles.frame,
        {
          top: insets.top + 2,
          bottom: insets.bottom + 2,
          left: insets.left + 2,
          right: insets.right + 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    borderWidth: THICK,
    borderColor: AUDIO_RED,
    borderRadius: 10,
  },
});
