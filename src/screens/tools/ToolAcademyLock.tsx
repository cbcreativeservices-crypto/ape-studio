/**
 * ToolAcademyLock — shared locked-content panel for the tools training layer
 * (Phase 1, ruling 2026-07-23: Learn/Demo/concept content is Academy-gated;
 * the TOOLS themselves stay free to open — Booth 2026-07-11). Consistent with
 * the ratified marketing copy: "audio tool tutorials" are an Academy unlock.
 */
import { StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../components/GlassButton';
import { colors, fonts } from '../../theme/tokens';

export function ToolAcademyLock({ what, onUpgrade }: { what: string; onUpgrade: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>ACADEMY MEMBERS</Text>
      <Text style={styles.title}>Guided Measurement Training</Text>
      <Text style={styles.body}>
        {what} is part of the Academy's guided measurement training — step-by-step tutorials on what
        each tool measures, what it does not, how to read the display, and when a measurement should
        not be trusted. The tools themselves are always free to open.
      </Text>
      <View style={{ marginTop: 6 }}>
        <GlassButton label="UPGRADE TO ACADEMY" tint="gold" height={48} fontSize={14} onPress={onUpgrade} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.45)',
    backgroundColor: '#0b1420',
    padding: 16,
    gap: 8,
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: '#7fd4ff' },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20.5, color: colors.textSecondary },
});
