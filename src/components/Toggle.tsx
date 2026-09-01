/**
 * Toggle — settings switch (design-reference Toggle: amber when on).
 * 44×26, animated knob, immediate onChange (no Save button per S11).
 *
 * ACCESSIBILITY (2026-08-30 sweep): a switch with no label announces only
 * "switch, on" — a screen-reader user hears the STATE but never learns WHAT it
 * controls, because React Native does not associate a sibling <Text> with it.
 * Callers pass `label`; every Settings row now does.
 */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { animationsAllowed } from '../features/settings/a11y';

export function Toggle({
  on,
  onChange,
  disabled = false,
  label,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** What this switch controls, e.g. "Email". Announced with the state. */
  label?: string;
}) {
  const knobX = useRef(new Animated.Value(on ? 20 : 2)).current;

  useEffect(() => {
    // Reduce-motion (app toggle OR the phone's own setting) snaps the knob
    // instead of sliding it — the control still shows its state, it just does
    // not animate.
    if (!animationsAllowed()) {
      knobX.setValue(on ? 20 : 2);
      return;
    }
    Animated.timing(knobX, { toValue: on ? 20 : 2, duration: 160, useNativeDriver: true }).start();
  }, [on, knobX]);

  return (
    <Pressable
      onPress={() => onChange(!on)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on, disabled }}
      // RN-web 0.21 no longer maps accessibilityState → ARIA; without this
      // every switch announced with NO on/off state on web (QA 2026-09-01).
      aria-checked={on}
      // 26 tall + 8 = 42, just under the 44 minimum; 10 clears it.
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
