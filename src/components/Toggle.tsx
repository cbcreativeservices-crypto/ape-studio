/**
 * Toggle — settings switch (design-reference Toggle: amber when on).
 * 44×26, animated knob, immediate onChange (no Save button per S11).
 */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function Toggle({
  on,
  onChange,
  disabled = false,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const knobX = useRef(new Animated.Value(on ? 20 : 2)).current;

  useEffect(() => {
    Animated.timing(knobX, { toValue: on ? 20 : 2, duration: 160, useNativeDriver: true }).start();
  }, [on, knobX]);

  return (
    <Pressable
      onPress={() => onChange(!on)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      hitSlop={8}
      style={disabled && { opacity: 0.45 }}
    >
      <LinearGradient
        colors={on ? ['#ffd35e', '#f09e1a'] : ['#242424', '#1c1c1c']}
        style={[styles.track, !on && styles.trackOff]}
      >
        <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  trackOff: { borderWidth: 1, borderColor: '#3a3a3a' },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
