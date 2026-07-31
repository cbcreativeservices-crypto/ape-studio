/**
 * LowLightLayer — low-light mode UI (user request 2026-07-18):
 *  - <LowLightDim/>  a full-bleed black wash that dims the app's OUTPUT (not the
 *                    device brightness) when ON, PLUS a persistent line at the
 *                    top of every screen marking the mode active. Mounted once
 *                    at the app root, pointer-transparent.
 *  - <LowLightRow/>  the toggle control, placed at the TOP of the Profile
 *                    screen. Lights up when engaged.
 *
 * Colour (owner request 2026-07-26): the low-light indicator is a BURNT, darker
 * glowing ORANGE — not the red used for the audio-output frame. Keeping the two
 * warnings distinct hues means they're never confused when both are on screen,
 * and the warm ember reads gentler than red in a dark theater. The top line is
 * also thicker (doubled) to match the audio frame's new weight.
 */
import { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../theme/tokens';
import { checkLowLightExpiry, LOW_LIGHT_DIM, toggleLowLight, useLowLight } from './lowLight';

// Burnt, darker, glowing orange (owner request 2026-07-26) — the low-light
// indicator hue, deliberately distinct from the audio-output frame's red.
const EMBER = '#c2540f';

/** Dim wash + red "active" line — both shown only when low-light is ON. */
export function LowLightDim() {
  const on = useLowLight();
  const insets = useSafeAreaInsets();
  // Auto-revert after 12h UNTOUCHED (owner 2026-07-30): foreground only CHECKS
  // expiry (reverts if the app was away past the window) — the clock is
  // refreshed by real user touches via the root touch-capture (App.tsx),
  // deliberately NOT by app-open. Registered once regardless of current state.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') checkLowLightExpiry();
    });
    return () => sub.remove();
  }, []);
  if (!on) return null;
  return (
    <>
      <View pointerEvents="none" style={[styles.dim, { opacity: LOW_LIGHT_DIM }]} />
      {/* Very-light RED wash over the ENTIRE screen while low-light is engaged
          (owner 2026-08-01) — full-bleed from y=0 so it also tints the status-bar
          region (clock, cell, Wi-Fi, battery background) as far as the app can
          reach. The OS's own status-bar glyphs are composited above the app and
          can't be recoloured from JS, but everything the app draws is tinted. */}
      <View pointerEvents="none" style={styles.redWash} />
      {/* Sits ABOVE the wash (higher zIndex) so it stays a crisp, bright red
          indicator that the mode is active. */}
      <View pointerEvents="none" style={[styles.activeLine, { top: insets.top }]} />
    </>
  );
}

/** Low-light toggle row (Profile screen). */
export function LowLightRow() {
  const on = useLowLight();
  return (
    <Pressable
      onPress={toggleLowLight}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Low light mode"
      accessibilityHint="Dims the whole app to reduce brightness."
      style={[styles.row, on && styles.rowOn]}
    >
      <View style={[styles.dot, on && styles.dotOn]} />
      <Text style={[styles.label, on && styles.labelOn]}>
        LOW LIGHT MODE{on ? ' · ON' : ''}
      </Text>
      <View style={{ flex: 1 }} />
      <View style={[styles.track, on && styles.trackOn]}>
        <View style={[styles.thumb, on && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 50,
  },
  // Very-light red wash — a translucent red laid over the whole (already dimmed)
  // screen so low-light mode reads as a gentle night-vision red (owner 2026-08-01).
  redWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,45,30,0.20)',
    zIndex: 55,
  },
  activeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Doubled 2 → 4 px (owner request 2026-07-26) to match the audio frame's
    // new weight.
    height: 4,
    backgroundColor: EMBER,
    // Still dimmed to 15% brightness so the indicator doesn't throw light in a
    // dark theater (user request 2026-07-18) — the warm ember reads gentler
    // than red at this low level.
    opacity: 0.15,
    zIndex: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
  },
  rowOn: { backgroundColor: '#1c1108', borderColor: EMBER },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  dotOn: { backgroundColor: EMBER },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#8a8c90' },
  labelOn: { color: EMBER },
  track: {
    width: 34,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: '#3a1f0d', borderColor: EMBER, alignItems: 'flex-end' },
  thumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#777' },
  thumbOn: { backgroundColor: EMBER },
});
