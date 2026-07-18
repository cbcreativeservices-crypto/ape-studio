/**
 * GlossaryChip — the Dashboard title-block glossary button. Recolored to the
 * glossary blue (matches the Course Selection glossary card's border frame,
 * rgb(91,176,255)) so the glossary reads consistently blue app-wide
 * (Booth 2026-07-09d; was active amber).
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';

export function GlossaryChip({ onPress, label = 'Glossary' }: { onPress?: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      {({ pressed }) => (
        <LinearGradient
          colors={['#0d1b2a', '#08131f']}
          style={[styles.chip, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.label}>{label.toUpperCase()}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.65)',
  },
  label: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: '#5bb0ff',
    textShadowColor: 'rgba(91,176,255,.5)',
    textShadowRadius: 7,
    textShadowOffset: { width: 0, height: 0 },
  },
});
