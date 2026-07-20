/**
 * LowLightLayer — low-light mode UI (user request 2026-07-18):
 *  - <LowLightDim/>  a full-bleed black wash that dims the app's OUTPUT (not the
 *                    device brightness) when ON, PLUS a persistent red line at
 *                    the top of every screen marking the mode active. Mounted
 *                    once at the app root, pointer-transparent.
 *  - <LowLightRow/>  the toggle control, placed at the TOP of the Profile
 *                    screen. Turns red when engaged.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../theme/tokens';
import { LOW_LIGHT_DIM, toggleLowLight, useLowLight } from './lowLight';

const RED = '#e5473b';

/** Dim wash + red "active" line — both shown only when low-light is ON. */
export function LowLightDim() {
  const on = useLowLight();
  const insets = useSafeAreaInsets();
  if (!on) return null;
  return (
    <>
      <View pointerEvents="none" style={[styles.dim, { opacity: LOW_LIGHT_DIM }]} />
      {/* Sits ABOVE the dim (higher zIndex) so it stays a crisp, bright red
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
  activeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: RED,
    // Dimmed to 15% brightness so the indicator doesn't throw light in a dark
    // theater (user request 2026-07-18).
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
  rowOn: { backgroundColor: '#1c0e0d', borderColor: RED },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555' },
  dotOn: { backgroundColor: RED },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#8a8c90' },
  labelOn: { color: RED },
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
  trackOn: { backgroundColor: '#3a1512', borderColor: RED, alignItems: 'flex-end' },
  thumb: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#777' },
  thumbOn: { backgroundColor: RED },
});
