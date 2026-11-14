/**
 * PredictCheck — page 7's PREDICT BEFORE PATCHING card. It looks and behaves
 * like the shared UnderstandingCheck (tuning/components/check.tsx: shuffled
 * options, per-option feedback, retry until right), with one difference the
 * page needs: ANY committed pick counts as the prediction (`onCommit`), so a
 * wrong guesser can test the jacks and SEE they were wrong.
 *
 * Beginner audit 2026-11-14 (G2_PatchbayLab, page 7): the jacks unlocked only
 * on the RIGHT answer, so "predict, then test" became "guess until right",
 * and the wrong-answer line sent the learner to a top jack that was not there.
 */
import { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Card, Eyebrow } from '../tuning/components/primitives';
import { checkFeedback } from '../tuning/components/checkFeedback';

export function PredictCheck({
  question,
  options,
  correct,
  explain,
  wrong,
  onCommit,
  eyebrow = 'PREDICT BEFORE PATCHING',
}: {
  question: string;
  options: string[];
  /** Index into `options` as authored (presentation order is shuffled). */
  correct: number;
  explain: string;
  /** Per-distractor feedback, indexed like `options`. */
  wrong: (string | undefined)[];
  /** Fires on the FIRST pick, right or wrong: the prediction is committed. */
  onCommit: () => void;
  eyebrow?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const committed = useRef(false);
  const signature = options.join('');
  const order = useMemo(() => {
    const idx = options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  const right = picked === correct;
  const feedback = checkFeedback({ picked, correct, explain, wrong, misses: 1 });
  return (
    <Card>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={styles.q}>{question}</Text>
      {order.map((i) => {
        const isRight = picked === i && right;
        const isWrong = picked === i && !right;
        return (
          <Pressable
            key={i}
            disabled={right}
            onPress={() => {
              setPicked(i);
              if (!committed.current) {
                committed.current = true;
                onCommit();
              }
              const said = checkFeedback({ picked: i, correct, explain, wrong, misses: 1 }) ?? '';
              AccessibilityInfo.announceForAccessibility?.(i === correct ? `Correct. ${explain}` : `Not quite. ${said}`);
            }}
            style={[styles.opt, isRight && styles.optRight, isWrong && styles.optWrong]}
            accessibilityRole="button"
            accessibilityLabel={options[i]}
            accessibilityState={{ disabled: right, selected: picked === i }}
            aria-disabled={right}
            aria-pressed={picked === i}
          >
            <Text style={[styles.optText, isRight && { color: colors.green }, isWrong && { color: colors.red }]}>{options[i]}</Text>
          </Pressable>
        );
      })}
      {feedback ? (
        <View accessibilityLiveRegion="polite">
          <Text style={[styles.explain, { color: right ? colors.green : colors.gold }]}>{feedback}</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  opt: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f2416' },
  optWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
