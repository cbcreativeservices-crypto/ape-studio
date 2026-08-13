/**
 * FundamentalsCreditBanner — Dashboard notice shown once the learner has
 * completed every Audio Fundamentals lab (R6c). Renders NOTHING until the
 * server has confirmed audio_fundamentals_complete (persisted, survives relaunch,
 * cleared on account switch), so it never over-promises credit that isn't earned.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { useAudioFundamentalsComplete } from './labCompletion';

export function FundamentalsCreditBanner() {
  const earned = useAudioFundamentalsComplete();
  if (!earned) return null;
  return (
    <View
      style={styles.banner}
      accessibilityRole="summary"
      accessibilityLabel="Audio Fundamentals credit earned"
    >
      <Text style={styles.check}>✓</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>AUDIO FUNDAMENTALS CREDIT EARNED</Text>
        <Text style={styles.body}>
          You’ve completed every Audio Fundamentals lab — that requirement is met toward your
          certificates and programs.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0c1a10',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  check: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.green },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.green },
  body: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
});
