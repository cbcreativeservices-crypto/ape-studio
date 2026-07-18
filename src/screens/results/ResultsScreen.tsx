/**
 * S7 — Results (RE-LOCKED v3.7; modal — lives on the ROOT stack so the bottom
 * nav is hidden; visuals from 07-s7-results-partial / 08-s7-results-voided).
 *
 * Branches:
 *   partial_pass (20–23) — clamp notice (locked copy) + [Retake for Trophy] +
 *     [Continue · Provisional]
 *   no_pass (≤19) — [Retake Quiz] + [Back to Dashboard]
 *   practice — PRACTICE label, [Retake] + [Back], no trophy option
 *   timed_out — "Time expired — not passed" (no lockout)
 *   voided — red ! + "QUIZ VOIDED" + live 15-min lockout countdown
 * Scrollable wrong-answer review: question, your answer, correct answer.
 * (Explanations are NOT client-readable — quiz_questions is admin-only; gap
 * D-3 logged for the backend session.)
 */
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import { clearQuizIntent } from '../../features/quiz/api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

/** Render any F4 answer shape for the review list. */
function fmtAnswer(v: unknown): string {
  if (v == null) return '(no answer)';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    if (v.length > 0 && Array.isArray(v[0])) {
      return (v as [string, string][]).map((p) => `${p[0]} → ${p[1]}`).join('\n');
    }
    return (v as string[]).join(', ');
  }
  return String(v);
}

function useLockoutCountdown(lockoutUntil?: string) {
  const [msLeft, setMsLeft] = useState(() =>
    lockoutUntil ? Math.max(0, new Date(lockoutUntil).getTime() - Date.now()) : 0,
  );
  useEffect(() => {
    if (!lockoutUntil) return;
    const t = setInterval(
      () => setMsLeft(Math.max(0, new Date(lockoutUntil).getTime() - Date.now())),
      1000,
    );
    return () => clearInterval(t);
  }, [lockoutUntil]);
  const s = Math.ceil(msLeft / 1000);
  return { msLeft, clock: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` };
}

export function ResultsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { result, topicName, achievementId, isPractice, questions } = route.params;
  const { msLeft, clock } = useLockoutCountdown(result.lockout_until);

  const wrongSlots = Object.entries(result.wrong_answers ?? {}).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );
  const questionText = (slot: string) =>
    questions.find((q) => q.slot === Number(slot))?.text ?? `Question ${slot}`;

  const toDashboard = useCallback(
    () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
    [navigation],
  );

  const retake = useCallback(async () => {
    await clearQuizIntent(achievementId); // new attempt intent = fresh draw
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          params: { screen: 'Study', params: { screen: 'Quiz', params: { achievementId, topicName } } },
        },
      ],
    });
  }, [navigation, achievementId, topicName]);

  /* ---- voided: dedicated full-screen state (08-s7-results-voided) ---- */
  if (result.outcome === 'voided') {
    return (
      <View style={[styles.rootCenter, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.voidBang}>
          <Text style={styles.voidBangText}>!</Text>
        </View>
        <Text style={styles.voidTitle}>QUIZ VOIDED</Text>
        <Text style={styles.voidBody}>
          App-switch detected twice. This attempt was voided and does not count.
        </Text>
        <View style={styles.lockoutCard}>
          <Text style={styles.lockoutEyebrow}>LOCKOUT</Text>
          <Text style={styles.lockoutClock}>{clock}</Text>
          <Text style={styles.lockoutSub}>UNTIL YOU CAN RETRY</Text>
        </View>
        <View style={styles.buttonCol}>
          {msLeft <= 0 && <StudioButton label="Retake Quiz" variant="primary" onPress={retake} />}
          <StudioButton label="Back to Dashboard" variant="secondary" onPress={toDashboard} />
        </View>
      </View>
    );
  }

  /* ---- scored states ---- */
  const partial = result.outcome === 'partial_pass' && !isPractice;
  const timedOut = result.outcome === 'timed_out';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.scoreBlock}>
          <Text style={styles.resultsEyebrow}>{isPractice ? 'RESULTS · PRACTICE' : 'RESULTS'}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreBig}>{result.score}</Text>
            <Text style={styles.scoreOf}>/ 25</Text>
          </View>
          {timedOut && <Text style={styles.timedOut}>Time expired — not passed</Text>}
        </View>

        {partial && (
          <View style={styles.clampNotice}>
            <Text style={styles.clampBody}>
              <Text style={styles.clampLead}>PROVISIONAL PASS — </Text>
              Score 24+ on the previous topic to earn the trophy and continue further.
            </Text>
          </View>
        )}

        <View style={styles.buttonCol}>
          {partial ? (
            <>
              <StudioButton label="Retake for Trophy" variant="primary" onPress={retake} />
              <StudioButton label="Continue · Provisional" variant="secondary" onPress={toDashboard} />
            </>
          ) : (
            <>
              <StudioButton label={isPractice ? 'Retake' : 'Retake Quiz'} variant="primary" onPress={retake} />
              <StudioButton label="Back to Dashboard" variant="secondary" onPress={toDashboard} />
            </>
          )}
        </View>

        {wrongSlots.length > 0 && (
          <>
            <Text style={styles.reviewHeader}>REVIEW — {wrongSlots.length} INCORRECT</Text>
            {wrongSlots.map(([slot, wa]) => (
              <View key={slot} style={styles.reviewCard}>
                <Text style={styles.reviewQuestion}>{questionText(slot)}</Text>
                <Text style={styles.reviewYours}>Your answer: {fmtAnswer(wa.selected)}</Text>
                <Text style={styles.reviewCorrect}>Correct: {fmtAnswer(wa.correct)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  rootCenter: {
    flex: 1,
    backgroundColor: colors.screenBg,
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  scoreBlock: { alignItems: 'center' },
  resultsEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 3, color: colors.textSubAlt },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  scoreBig: {
    fontFamily: fonts.mono,
    fontSize: 48,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.6)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  scoreOf: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.4, color: '#777777' },
  timedOut: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.red, marginTop: 8 },

  clampNotice: {
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,194,51,.55)',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  clampLead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.amber },
  clampBody: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 22, color: '#ffd27a' },

  buttonCol: { gap: 10 },

  reviewHeader: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.textSubAlt,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  reviewQuestion: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  reviewYours: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: '#ff6b5b' },
  reviewCorrect: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.greenBright },

  voidBang: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  voidBangText: {
    fontFamily: fonts.oswaldBold,
    fontSize: 30,
    color: colors.red,
    textShadowColor: 'rgba(255,75,58,.7)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  voidTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 22,
    letterSpacing: 1.8,
    color: colors.red,
    textAlign: 'center',
    textShadowColor: 'rgba(255,75,58,.5)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  voidBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: '#cccccc',
    textAlign: 'center',
  },
  lockoutCard: {
    backgroundColor: '#190d0d',
    borderWidth: 1,
    borderColor: 'rgba(255,75,58,.5)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  lockoutEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.6, color: colors.textSubAlt },
  lockoutClock: {
    fontFamily: fonts.mono,
    fontSize: 36,
    color: colors.red,
    marginTop: 4,
    textShadowColor: 'rgba(255,75,58,.6)',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  lockoutSub: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 0.9, color: colors.textSubAlt, marginTop: 4 },
});
