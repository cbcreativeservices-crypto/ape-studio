/**
 * CoachMark — a subtle floating hint pill near the bottom of the screen
 * (Booth 2026-07-08). Amber, slightly translucent, gently fades in. Used for
 * the self-retiring onboarding hints (see lib/coachMark.ts). Rendered inside
 * the screen root, positioned above the content bottom / nav.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { fonts } from '../theme/tokens';

export function CoachMark({ text, bottom = 16 }: { text: string; bottom?: number }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  // Subtle by design (Booth 2026-07-09): a quiet dark pill with muted text —
  // a gentle instruction, not a highlighted callout. Slightly translucent.
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pill, { bottom, opacity: Animated.multiply(fade, 0.9) }]}
      accessibilityRole="alert"
    >
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    left: 40,
    right: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,24,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontFamily: fonts.barlowMedium,
    fontSize: 12.5,
    letterSpacing: 0.3,
    color: '#9a9a9a',
    textAlign: 'center',
  },
});
