/**
 * UnderstandingCheck — a short concept check with explanatory feedback and
 * retry (spec Stage 1 §5). Wrong picks explain; the correct concept is
 * always revealed in the learner's own terms.
 */
import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { Card, Eyebrow } from './primitives';

export function UnderstandingCheck({
  question, options, correct, explain, onCorrect,
}: {
  question: string;
  options: string[];
  correct: number;
  explain: string;
  onCorrect?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === correct;
  return (
    <Card>
      <Eyebrow>UNDERSTANDING CHECK</Eyebrow>
      <Text style={styles.q}>{question}</Text>
      {options.map((o, i) => {
        const isRight = picked != null && i === correct;
        const isWrong = picked === i && !right;
        return (
          <Pressable
            key={i}
            disabled={right}
            onPress={() => {
              setPicked(i);
              if (i === correct) onCorrect?.();
              AccessibilityInfo.announceForAccessibility?.(i === correct ? 'Correct.' : 'Not quite.');
            }}
            style={[styles.opt, isRight && styles.optRight, isWrong && styles.optWrong]}
            accessibilityRole="button"
            accessibilityLabel={o}
          >
            <Text style={[styles.optText, isRight && { color: colors.green }, isWrong && { color: colors.red }]}>{o}</Text>
          </Pressable>
        );
      })}
      {picked != null ? (
        <Text style={[styles.explain, { color: right ? colors.green : colors.gold }]}>
          {right ? '✓ ' : ''}{explain}{!right ? ' — try again with that in mind.' : ''}
        </Text>
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
