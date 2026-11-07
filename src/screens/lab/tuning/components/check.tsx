/**
 * UnderstandingCheck — a short concept check with explanatory feedback and
 * retry (spec Stage 1 §5). Wrong picks explain; the correct concept is
 * always revealed in the learner's own terms.
 *
 * Options are SHUFFLED for presentation once per mount (stable across
 * re-renders — keyed on content, so inline `options` literals are fine) and
 * judged by the ORIGINAL index: `correct` is still authored against the
 * array you pass. Every lab that imports this gets the shuffle for free.
 *
 * `wrong` (optional, indexed by ORIGINAL option index) gives each distractor
 * its own misconception-targeting feedback; while it is present the correct
 * explanation stays hidden until the learner gets it right, so "try again"
 * is real retrieval rather than copying. Without `wrong`, the first miss
 * says only "Not quite — try again." and the explanation shows as a hint
 * from the second miss on (owner decision 7, 2026-11-07; checkFeedback.ts).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { Card, Eyebrow } from './primitives';
import { checkFeedback } from './checkFeedback';

export function UnderstandingCheck({
  question, options, correct, explain, onCorrect, wrong, eyebrow = 'UNDERSTANDING CHECK',
}: {
  question: string;
  options: string[];
  /** Index into `options` as authored (presentation order is shuffled). */
  correct: number;
  explain: string;
  onCorrect?: () => void;
  /** Per-distractor feedback, indexed like `options`. Optional. */
  wrong?: (string | undefined)[];
  eyebrow?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null); // ORIGINAL index
  // Wrong picks so far (owner decision 7, 2026-11-07): the first miss on a
  // check with no `wrong` map does not reveal the explanation.
  const [misses, setMisses] = useState(0);
  const missesRef = useRef(0);
  // Synchronous guard: a same-frame double tap on the right answer lands
  // before `disabled` re-renders, and must not fire onCorrect twice
  // (bug hunt 2026-09-29).
  const solvedRef = useRef(false);
  const signature = options.join('');
  const order = useMemo(() => {
    const idx = options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  // A new question (new options) starts the miss count again.
  useEffect(() => {
    missesRef.current = 0;
    setMisses(0);
  }, [signature]);
  const right = picked === correct;
  const feedback = checkFeedback({ picked, correct, explain, wrong, misses });
  return (
    <Card>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={styles.q}>{question}</Text>
      {order.map((i) => {
        const o = options[i];
        const isRight = picked != null && i === correct && right;
        const isWrong = picked === i && !right;
        return (
          <Pressable
            key={i}
            disabled={right}
            onPress={() => {
              if (solvedRef.current) return;
              setPicked(i);
              const ok = i === correct;
              if (ok) {
                solvedRef.current = true;
                onCorrect?.();
              } else {
                missesRef.current += 1;
                setMisses(missesRef.current);
              }
              // Spoken text = the shown line, so a screen reader is not told
              // the explanation on a first miss either.
              const said = checkFeedback({ picked: i, correct, explain, wrong, misses: missesRef.current }) ?? '';
              AccessibilityInfo.announceForAccessibility?.(ok ? `Correct. ${explain}` : wrong || missesRef.current > 1 ? `Not quite. ${said}` : said);
            }}
            style={[styles.opt, isRight && styles.optRight, isWrong && styles.optWrong]}
            accessibilityRole="button"
            accessibilityLabel={o}
            accessibilityState={{ disabled: right, selected: picked === i }}
            aria-disabled={right}
            aria-pressed={picked === i}
          >
            <Text style={[styles.optText, isRight && { color: colors.green }, isWrong && { color: colors.red }]}>{o}</Text>
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
