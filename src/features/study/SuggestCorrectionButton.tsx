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
  /**
   * ⛔ CONTRAST FLOOR, NOT A STYLE PREFERENCE (owner walkthrough 2026-09-21).
   *
   * This was 10 px at 28% white, which composites to rgb(90,90,92) on the
   * card behind it — a measured **2.53:1** against that background. WCAG AA
   * for normal-size text is 4.5:1, so it failed by a wide margin, at a size
   * (10 px) already below both platforms' recommended minimum.
   *
   * 50% white measures 5.18:1 and 11 px clears the size floor. It is still
   * plainly the quietest thing on the screen — which was the intent — it is
   * simply legible now. Measured, not eyeballed.
   */
  text: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.3, color: 'rgba(255,255,255,0.5)' },
});
