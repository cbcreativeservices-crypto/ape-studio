/**
 * Audio Career Finder — the question experience (owner brief 2026-09-03).
 *
 * One question at a time, "Question 7 of 28", a progress bar, Back and
 * Continue. Every tap is saved immediately; the screen reopens where the
 * user left off. Choosing an answer advances after a short beat (immediately
 * under Reduce Motion) — Back always lets the user revisit and change it.
 *
 * "I don’t know enough about this" is visibly a different kind of answer
 * (dashed, its own row, its own note): it is never scored as dislike.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../../features/settings/a11y';
import { ANSWERS, QUESTIONS, QUESTION_COUNT, type Response } from '../../features/careerfinder/questions';
import { allAnswered, answerQuestion, completeCareerFinder, firstUnansweredIndex, setQuestionIndex, useCareerFinder, useCareerFinderHydrated } from '../../features/careerfinder/store';
import { FinderShell, NavButton, ProgressBar } from './kit';

const ADVANCE_MS = 340;

export function CareerFinderQuizScreen() {
  const navigation = useNavigation();
  const rec = useCareerFinder();
  const hydrated = useCareerFinderHydrated();
  const scrollRef = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Local index mirrors the store so a tap feels instant; the store is the
  // source of truth on (re)mount.
  const [index, setIndex] = useState(rec.index);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!hydrated || seeded) return;
    // Resume where the user was; if that question is answered and later ones
    // are not, jump to the first unanswered so CONTINUE never lands on a
    // question that is already done.
    const q = QUESTIONS[rec.index];
    const start = q && !(q.id in rec.responses) ? rec.index : rec.completed ? 0 : firstUnansweredIndex(rec);
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
    setIndex(idx);
    setQuestionIndex(idx);
    scrollRef.current?.scrollTo({ y: 0, animated: animationsAllowed() });
    AccessibilityInfo.announceForAccessibility?.(`Question ${idx + 1} of ${QUESTION_COUNT}`);
  }, []);

  const finish = useCallback(() => {
    completeCareerFinder();
    navigation.navigate('CareerFinderResults');
  }, [navigation]);

  const choose = (value: Response) => {
    if (!q) return;
    answerQuestion(q.id, value);
    if (timer.current) clearTimeout(timer.current);
    const delay = animationsAllowed() ? ADVANCE_MS : 0;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!last) go(index + 1);
    }, delay);
  };

  const canFinish = last && allAnswered({ ...rec, responses: { ...rec.responses } });

  return (
    <FinderShell
      kicker={`CAREER DISCOVERY LAB · QUESTION ${index + 1} OF ${QUESTION_COUNT}`}
      title="How would you feel about…"
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
            <NavButton label="CONTINUE ›" primary onPress={() => go(index + 1)} disabled={!answeredThis} a11y={answeredThis ? 'Continue to the next question' : 'Continue — choose an answer first'} />
          )}
        </>
      }
    >
      <ProgressBar value={(index + (answeredThis ? 1 : 0)) / QUESTION_COUNT} label={`Question ${index + 1} of ${QUESTION_COUNT}`} />
      {q ? (
        <>
          <Text style={styles.question} accessibilityRole="header">{q.text.replace(/^How would you feel about /, '…').replace(/\?$/, '')}</Text>
          <View style={styles.answers} accessibilityRole="radiogroup" accessibilityLabel="Your answer">
            {ANSWERS.map((a) => {
              const on = answeredThis && current === a.value;
              const unknown = a.value === null;
              return (
                <Pressable
                  key={String(a.value)}
                  onPress={() => choose(a.value)}
                  style={({ pressed }) => [styles.answer, unknown && styles.answerUnknown, on && styles.answerOn, pressed && { opacity: 0.85 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
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
          <Text style={styles.note}>“I don’t know enough about this” is never counted as dislike. It simply marks an activity you have not met yet.</Text>
        </>
      ) : null}
    </FinderShell>
  );
}

const styles = StyleSheet.create({
  question: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 21, lineHeight: 29, marginTop: 2, marginBottom: 4 },
  answers: { gap: 8 },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315' },
  answerUnknown: { marginTop: 6, borderStyle: 'dashed', borderColor: '#3a3a44', backgroundColor: '#0f0f12' },
  answerOn: { borderColor: colors.cyanBright, backgroundColor: '#0f1a22' },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  markOn: { borderColor: colors.cyanBright, backgroundColor: colors.cyanBright },
  markUnknown: { borderStyle: 'dashed' },
  markText: { color: '#08141a', fontFamily: fonts.oswaldBold, fontSize: 13, lineHeight: 15 },
  answerText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 16 },
  answerTextOn: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
});
