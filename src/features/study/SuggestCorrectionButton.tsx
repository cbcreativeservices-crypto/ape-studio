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
  tagIsAnswer = false,
}: {
  tag?: string;
  context?: FeedbackContext;
  style?: StyleProp<ViewStyle>;
  /**
   * The `tag` is the CORRECT ANSWER to the question on screen, so it must not
   * be spoken.
   *
   * ⛔ WHY THIS EXISTS (owner walkthrough 2026-09-21). Fill in the Blank
   * passes `question.item.term` as the tag, and that term IS the answer —
   * `options: shuffle([item.term, ...distractors])`. The label therefore
   * announced "Suggest a correction for Clip Launching" on a question whose
   * four choices included Clip Launching. A screen-reader user was handed the
   * answer before choosing.
   *
   * It survived because the VISIBLE text is only "Suggest a correction" — the
   * leak existed solely in the accessibility layer, which is to say it only
   * ever harmed the users who depend on that layer.
   *
   * The tag still travels in the feedback payload; it just stops being
   * announced.
   */
  tagIsAnswer?: boolean;
}) {
  return (
    <Pressable
      style={[styles.btn, style]}
      onPress={() => sendFeedback('correction', tag, context)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={tag && !tagIsAnswer ? `Suggest a correction for ${tag}` : 'Suggest a correction'}
    >
      <Text style={styles.text}>Suggest a correction</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 2, paddingHorizontal: 2, alignSelf: 'flex-end' },
  text: { fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.3, color: 'rgba(255,255,255,0.28)' },
});
