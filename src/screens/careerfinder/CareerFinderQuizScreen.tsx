/**
 * Audio Career Finder — the question experience (owner brief 2026-09-03;
 * design and learning reviews 2026-09-04).
 *
 * One question at a time, "Question 7 of 28" as the title, a progress bar
 * with three milestones, Back and Continue. Every tap is saved immediately;
 * the screen reopens where the user left off. Choosing an answer advances
 * after a short beat (a fade under motion, instant under Reduce Motion) and
 * the same rule finishes the last question — one gesture for all 28. Back
 * always lets the user revisit and change an answer.
 *
 * "I don’t know enough about this" is visibly a different kind of answer
 * (dashed, its own row); its note shows on the first question and whenever
 * it is the chosen answer, not 28 times.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../../features/settings/a11y';
import { hapticsEnabled } from '../../features/settings/store';
import { ANSWERS, QUESTIONS, QUESTION_COUNT, type Response } from '../../features/careerfinder/questions';
import { allAnswered, answerQuestion, completeCareerFinder, firstUnansweredIndex, setQuestionIndex, useCareerFinder, useCareerFinderHydrated } from '../../features/careerfinder/store';
import { FinderShell, NavButton, ProgressBar } from './kit';

const ADVANCE_MS = 450;
const STEM = 'How would you feel about ';
const MILESTONE: Record<number, string> = { 6: 'A quarter done', 13: 'Halfway — 14 to go', 20: 'Last seven' };

export function CareerFinderQuizScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const rec = useCareerFinder();
  const hydrated = useCareerFinderHydrated();
  const scrollRef = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  // Local index mirrors the store so a tap feels instant; the store is the
  // source of truth on (re)mount.
  const [index, setIndex] = useState(rec.index);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!hydrated || seeded) return;
    // Where to open: if everything is answered (a "change my answers" review),
    // honour the stored index — the caller sets it to 0 so review starts at
    // Q1. Otherwise resume at the stored question if it is unanswered, else at
    // the first unanswered so CONTINUE never lands on a question already done.
    const q = QUESTIONS[rec.index];
    const start = allAnswered(rec)
      ? Math.min(rec.index, QUESTION_COUNT - 1)
      : q && !(q.id in rec.responses)
        ? rec.index
        : firstUnansweredIndex(rec);
    setIndex(start);
    setSeeded(true);
  }, [hydrated, seeded, rec]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const q = QUESTIONS[index];
  const current = q ? rec.responses[q.id] : undefined;
  const answeredThis = q ? q.id in rec.responses : false;
  const last = index === QUESTION_COUNT - 1;

  const go = useCallback((i: number) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const idx = Math.max(0, Math.min(QUESTION_COUNT - 1, i));
    if (animationsAllowed()) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
    setIndex(idx);
    setQuestionIndex(idx);
    scrollRef.current?.scrollTo({ y: 0, animated: animationsAllowed() });
    AccessibilityInfo.announceForAccessibility?.(`Question ${idx + 1} of ${QUESTION_COUNT}`);
  }, [fade]);

  const finish = useCallback(() => {
    completeCareerFinder();
    // REPLACE, not push: the finished quiz must not sit under the results, or
    // a swipe-back from results would land on question 28. Results and quiz
    // alternate at the same depth, so back from either returns to the intro.
    navigation.replace('CareerFinderResults');
  }, [navigation]);

  const choose = (value: Response) => {
    if (!q) return;
    answerQuestion(q.id, value);
    if (Platform.OS !== 'web' && hapticsEnabled()) void Haptics.selectionAsync().catch(() => {});
    if (timer.current) clearTimeout(timer.current);
    const delay = animationsAllowed() ? ADVANCE_MS : 0;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!last) go(index + 1);
      else if (allAnswered({ ...rec, responses: { ...rec.responses, [q.id]: value } })) finish();
    }, delay);
  };

  const canFinish = last && allAnswered(rec);
  const milestone = MILESTONE[index];

  return (
    <FinderShell
      kicker="CAREER DISCOVERY LAB"
      title={`Question ${index + 1} of ${QUESTION_COUNT}`}
      onBack={() => navigation.goBack()}
      backLabel="Leave the questions. Your answers are saved."
      scrollRef={scrollRef}
      footer={
        <>
          <NavButton label="‹ BACK" onPress={() => go(index - 1)} disabled={index === 0} a11y="Back one question" />
          <View style={{ flex: 1 }} />
          {last ? (
            <NavButton label="SEE MY RESULTS ›" primary onPress={finish} disabled={!canFinish} a11y={canFinish ? 'See my results' : 'See my results — answer every question first'} />
          ) : (
            <NavButton label="CONTINUE ›" onPress={() => go(index + 1)} disabled={!answeredThis} a11y={answeredThis ? 'Continue to the next question' : 'Continue — choose an answer first'} />
          )}
        </>
      }
    >
      <ProgressBar value={(index + (answeredThis ? 1 : 0)) / QUESTION_COUNT} label={`Question ${index + 1} of ${QUESTION_COUNT}`} />
      {milestone ? <Text style={styles.milestone}>{milestone}</Text> : null}
      {q ? (
        <Animated.View style={{ opacity: fade, gap: 12 }}>
          <Text style={styles.question} accessibilityRole="header">
            <Text style={styles.stem}>{STEM}</Text>
            {q.text.replace(new RegExp(`^${STEM}`), '').replace(/\?$/, '')}?
          </Text>
          <View style={styles.answers} accessibilityRole="radiogroup" accessibilityLabel="Your answer">
            {ANSWERS.map((a) => {
              const on = answeredThis && current === a.value;
              const unknown = a.value === null;
              return (
                <Pressable
                  key={String(a.value)}
                  onPress={() => choose(a.value)}
                  style={({ pressed }) => [styles.answer, unknown && styles.answerUnknown, on && styles.answerOn, pressed && styles.answerPressed]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  aria-checked={on}
                  accessibilityLabel={a.label}
                  accessibilityHint={unknown ? 'Not scored. Tells us this activity is new to you.' : undefined}
                >
                  <View style={[styles.mark, on && styles.markOn, unknown && styles.markUnknown]}>
                    {on ? <Text style={styles.markText}>✓</Text> : null}
                  </View>
                  <Text style={[styles.answerText, on && styles.answerTextOn, unknown && !on && { color: colors.textSub }]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {index === 0 || (answeredThis && current === null) ? (
            <Text style={styles.note}>“I don’t know enough about this” is never counted as dislike. It simply marks an activity you have not met yet.</Text>
          ) : null}
        </Animated.View>
      ) : null}
    </FinderShell>
  );
}

const styles = StyleSheet.create({
  milestone: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, marginTop: -6 },
  question: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 21, lineHeight: 29, marginTop: 2 },
  stem: { color: colors.textSub, fontFamily: fonts.barlowRegular },
  answers: { gap: 6 },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315' },
  answerUnknown: { marginTop: 4, borderStyle: 'dashed', borderColor: '#3a3a44', backgroundColor: '#0f0f12' },
  answerOn: { borderColor: colors.cyanBright, backgroundColor: '#0f1a22' },
  answerPressed: { backgroundColor: '#1a1a1f', borderColor: '#4a4a55' },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  markOn: { borderColor: colors.cyanBright, backgroundColor: colors.cyanBright },
  markUnknown: { borderStyle: 'dashed' },
  markText: { color: '#08141a', fontFamily: fonts.oswaldBold, fontSize: 13, lineHeight: 15 },
  answerText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 16 },
  answerTextOn: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
