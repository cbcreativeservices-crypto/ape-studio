/**
 * Subtle "Suggest a correction" text button (owner 2026-08-13) — the shared
 * per-item feedback affordance used across the study methods (flashcards uses
 * its own card-corner copy; homework + scenarios use this). Opens the mail
 * composer pre-filled via sendFeedback, carrying locating context so the exact
 * item can be hunted down. Low-contrast text so it reads as available but quiet.
 */
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { sendFeedback, type FeedbackContext } from '../../lib/feedback';
import { fonts } from '../../theme/tokens';

export function SuggestCorrectionButton({
  tag,
  context,
  style,
}: {
  tag?: string;
  context?: FeedbackContext;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={[styles.btn, style]}
      onPress={() => sendFeedback('correction', tag, context)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={tag ? `Suggest a correction for ${tag}` : 'Suggest a correction'}
    >
      <Text style={styles.text}>Suggest a correction</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 2, paddingHorizontal: 2, alignSelf: 'flex-end' },
  text: { fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.3, color: 'rgba(255,255,255,0.28)' },
});
