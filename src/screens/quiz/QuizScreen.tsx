/**
 * S6 — Topic Quiz (RE-LOCKED v3.7, MASTER; visuals from 06-s6-quiz.dc.html).
 *
 * - "QUESTION n OF 25" + always-visible 10:00 countdown (deadline-based off
 *   the server's started_at — never pauses) → force-submit at 0:00 (server
 *   grades timed_out past 602s).
 * - One question at a time; tap select → 350ms highlight → auto-advance.
 * - Renders served_options per type (Code brief §3): mc/fill = 6 strings pick
 *   1 · multi_select = 6 strings + Confirm · matching = K lefts ↔︎ K rights.
 * - 🔴 F4: answers recorded as the served VALUE strings keyed by slot_index.
 * - App-switch: 2s grace; 1st loss = warning, 2nd = immediate submit → server
 *   voids + 15-min lockout. (Timer/warning/lockout UI is [TBD-DESIGN] — the
 *   warning uses a system alert for now.)
 * - One sitting: [‹] back = confirm → wipe local answers immediately (the
 *   attempt stays open server-side; re-entry resumes the same payload).
 * - Offline submit → queued + "Offline — please reconnect to submit."
 * - Result routing lands on a placeholder panel until S7 builds in M6.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnswerCell, type AnswerCellState } from '../../components/AnswerCell';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import {
  clearQuizIntent,
  enqueueSubmission,
  QuizStartFailure,
  QUIZ_START_ERROR_COPY,
  startQuizAttempt,
  submitQuiz,
  type AnswerValue,
  type AttemptPayload,
  type MatchingOptions,
  type ServedQuestion,
} from '../../features/quiz/api';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'Quiz'>;

const HIGHLIGHT_MS = 350;
const FOCUS_GRACE_S = 2;

function fmtClock(msLeft: number): string {
  const s = Math.max(0, Math.ceil(msLeft / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function QuizScreen({ navigation, route }: Props) {
  const { achievementId, topicName } = route.params;
  const insets = useSafeAreaInsets();

  const [payload, setPayload] = useState<AttemptPayload | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [msLeft, setMsLeft] = useState<number>(600_000);
  const [picked, setPicked] = useState<string | null>(null); // mc/fill transient highlight
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [submitting, setSubmitting] = useState(false);

  const answers = useRef<Record<string, AnswerValue>>({});
  const focusLossCount = useRef(0);
  const focusLossDuration = useRef(0);
  const blurStartedAt = useRef<number | null>(null);
  const submitted = useRef(false);

  /* ---- attempt start (online-only; idempotent resume) ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await startQuizAttempt(achievementId);
        if (alive) setPayload(p);
      } catch (e) {
        if (!alive) return;
        const code = e instanceof QuizStartFailure ? e.code : 'unknown';
        setStartError(QUIZ_START_ERROR_COPY[code]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [achievementId]);

  const deadline = useMemo(
    () => (payload ? new Date(payload.started_at).getTime() + payload.time_limit_seconds * 1000 : null),
    [payload],
  );

  const doSubmit = useCallback(
    async (submittedAtMs?: number) => {
      if (!payload || submitted.current) return;
      submitted.current = true;
      setSubmitting(true);
      const submittedAt = new Date(submittedAtMs ?? Date.now()).toISOString();
      const args = {
        attemptId: payload.attempt_id,
        answers: answers.current,
        submittedAt,
        submittedOffline: false,
        focusLossCount: focusLossCount.current,
        focusLossDuration: Math.round(focusLossDuration.current),
      };
      try {
        const result = await submitQuiz(args);
        await clearQuizIntent(achievementId);
        // Route per Code brief §2.2: genuine full pass → trophy loop first;
        // everything else (incl. practice, voided, timed_out) → Results (S7).
        // Both live on the ROOT stack (bottom nav hidden); pop the study
        // stack first so no stale quiz screen lingers beneath.
        const questions = payload.questions.map((q) => ({ slot: q.slot_index, text: q.question_text }));
        // Guarded: popToTop on an already-single-route stack raises an
        // unhandled-action redbox (Booth 2026-07-09p).
        if (navigation.canGoBack()) navigation.popToTop();
        if (result.outcome === 'full_pass' && !payload.is_practice) {
          // Straight to the Trophy result — the animated reveal (TrophyAnim) is
          // removed; no award animation is used (user request 2026-07-18).
          (navigation as any).navigate('Trophy', {
            topicName,
            achievementId,
            badgeEarned: result.badge_earned,
            entrySource: 'quiz_win',
          });
        } else {
          (navigation as any).navigate('Results', {
            result,
            topicName,
            achievementId,
            isPractice: payload.is_practice,
            questions,
          });
        }
      } catch (e) {
        if (/network|fetch/i.test((e as Error).message)) {
          enqueueSubmission({ ...args, achievementId });
          Alert.alert('Offline', 'Offline — please reconnect to submit.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Submit failed', (e as Error).message, [
            { text: 'Back to Dashboard', onPress: () => navigation.goBack() },
          ]);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [payload, achievementId, topicName, navigation],
  );

  /* ---- countdown (never pauses; force-submit at 0:00) ---- */
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => {
      const left = deadline - Date.now();
      setMsLeft(left);
      if (left <= 0) {
        clearInterval(t);
        void doSubmit(deadline);
      }
    }, 250);
    return () => clearInterval(t);
  }, [deadline, doSubmit]);

  /* ---- focus-void handling (2s grace; 1st warn, 2nd void) ---- */
  useEffect(() => {
    if (!payload) return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') {
        if (blurStartedAt.current == null) blurStartedAt.current = Date.now();
        return;
      }
      if (blurStartedAt.current == null) return;
      const dur = (Date.now() - blurStartedAt.current) / 1000;
      blurStartedAt.current = null;
      if (dur <= FOCUS_GRACE_S) return; // grace
      focusLossCount.current += 1;
      focusLossDuration.current += dur;
      if (focusLossCount.current === 1) {
        Alert.alert(
          'App switch detected',
          'Leaving the app during a quiz is not allowed. One more switch will VOID this attempt and lock the quiz for 15 minutes.',
        );
      } else {
        void doSubmit(); // server voids + applies the lockout
      }
    });
    return () => sub.remove();
  }, [payload, doSubmit]);

  /* ---- per-question state helpers ---- */
  const question: ServedQuestion | null = payload?.questions[qIdx] ?? null;

  const advance = useCallback(() => {
    setPicked(null);
    setMultiSel(new Set());
    setLeftSel(null);
    setPairs([]);
    if (!payload) return;
    if (qIdx + 1 >= payload.questions.length) void doSubmit();
    else setQIdx((i) => i + 1);
  }, [payload, qIdx, doSubmit]);

  const recordAndAdvance = useCallback(
    (slot: number, value: AnswerValue) => {
      answers.current[String(slot)] = value; // F4: slot-keyed VALUES
      setTimeout(advance, HIGHLIGHT_MS);
    },
    [advance],
  );

  const pickSingle = useCallback(
    (opt: string) => {
      if (!question || picked) return;
      setPicked(opt);
      recordAndAdvance(question.slot_index, opt); // the served string itself
    },
    [question, picked, recordAndAdvance],
  );

  const toggleMulti = useCallback((opt: string) => {
    setMultiSel((cur) => {
      const next = new Set(cur);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }, []);

  const confirmMulti = useCallback(() => {
    if (!question || multiSel.size === 0) return;
    // Preserve served order for determinism (grading is set-based server-side).
    const opts = question.options as string[];
    recordAndAdvance(
      question.slot_index,
      opts.filter((o) => multiSel.has(o)),
    );
  }, [question, multiSel, recordAndAdvance]);

  const pickMatch = useCallback(
    (side: 'left' | 'right', value: string) => {
      if (!question) return;
      const paired = (v: string, idx: 0 | 1) => pairs.some((p) => p[idx] === v);
      if (side === 'left') {
        if (paired(value, 0)) return;
        setLeftSel((cur) => (cur === value ? null : value));
        return;
      }
      if (!leftSel || paired(value, 1)) return;
      const nextPairs: [string, string][] = [...pairs, [leftSel, value]];
      setPairs(nextPairs);
      setLeftSel(null);
      const k = (question.options as MatchingOptions).lefts.length;
      if (nextPairs.length === k) recordAndAdvance(question.slot_index, nextPairs);
    },
    [question, leftSel, pairs, recordAndAdvance],
  );

  const confirmExit = useCallback(() => {
    Alert.alert('Leave quiz?', 'Your answers will be wiped immediately. The quiz allows no pause or save.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Leave & wipe',
        style: 'destructive',
        onPress: () => {
          answers.current = {};
          navigation.goBack();
        },
      },
    ]);
  }, [navigation]);

  /* ---- states ---- */
  if (startError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{startError}</Text>
        <View style={{ width: 200 }}>
          <StudioButton label="Back" variant="secondary" small onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }
  if (!payload || !question || submitting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
        {submitting && <Text style={styles.errorText}>Submitting…</Text>}
      </View>
    );
  }

  const isMatching = question.question_type === 'matching';
  const matching = isMatching ? (question.options as MatchingOptions) : null;
  const singleOpts = !isMatching ? (question.options as string[]) : [];
  const isMulti = question.question_type === 'multi_select';

  const singleState = (opt: string): AnswerCellState => (picked === opt ? 'selectedBlue' : picked ? 'dimmed' : 'default');
  const leftState = (v: string): AnswerCellState =>
    pairs.some((p) => p[0] === v) ? 'dimmed' : leftSel === v ? 'selectedBlue' : 'default';
  const rightState = (v: string): AnswerCellState => (pairs.some((p) => p[1] === v) ? 'dimmed' : 'default');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header: counter + always-visible countdown */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable onPress={confirmExit} hitSlop={10} accessibilityRole="button" accessibilityLabel="Leave quiz">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerCounter}>
            QUESTION {qIdx + 1} OF {payload.questions.length}
          </Text>
          {payload.is_practice && <Text style={styles.practiceChip}>PRACTICE</Text>}
        </View>
        <Text style={[styles.timer, msLeft < 60_000 && styles.timerLow]}>{fmtClock(msLeft)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {question.media_url ? (
          <Image source={{ uri: question.media_url }} style={styles.media} resizeMode="contain" />
        ) : null}

        <Text style={styles.questionText}>{question.question_text}</Text>
        {question.stem && question.stem !== question.question_text ? (
          <Text style={styles.stem}>{question.stem}</Text>
        ) : null}

        {!isMatching && (
          <View style={styles.optionList}>
            {singleOpts.map((opt) => (
              <AnswerCell
                key={opt}
                label={opt}
                minHeight={48}
                state={
                  isMulti ? (multiSel.has(opt) ? 'selectedOrange' : 'default') : singleState(opt)
                }
                check={isMulti ? (multiSel.has(opt) ? 'checked' : 'unchecked') : 'none'}
                onPress={() => (isMulti ? toggleMulti(opt) : pickSingle(opt))}
                disabled={!isMulti && !!picked}
              />
            ))}
          </View>
        )}

        {isMulti && (
          <StudioButton label="Confirm" variant="success" disabled={multiSel.size === 0} onPress={confirmMulti} />
        )}

        {isMatching && matching && (
          <>
            <View style={styles.matchColumns}>
              <View style={styles.matchColumn}>
                {matching.lefts.map((v) => (
                  <AnswerCell
                    key={v}
                    label={v}
                    fontSize={14}
                    borderWidth={1.5}
                    minHeight={48}
                    numberOfLines={3}
                    state={leftState(v)}
                    onPress={() => pickMatch('left', v)}
                  />
                ))}
              </View>
              <View style={styles.matchColumn}>
                {matching.rights.map((v) => (
                  <AnswerCell
                    key={v}
                    label={v}
                    fontSize={13}
                    borderWidth={1.5}
                    minHeight={48}
                    numberOfLines={3}
                    state={rightState(v)}
                    onPress={() => pickMatch('right', v)}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.matchHint}>
              PAIR EVERY TERM · {pairs.length} / {matching.lefts.length}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { fontFamily: fonts.oswaldMedium, fontSize: 24, color: colors.textSub, marginTop: -2 },
  headerCounter: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, color: colors.textPrimary },
  practiceChip: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.blue,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.6)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  timer: {
    fontFamily: fonts.mono,
    fontSize: 18,
    letterSpacing: 1,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.6)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  timerLow: { color: colors.red, textShadowColor: 'rgba(255,75,58,.6)' },
  scroll: { padding: 16, gap: 12 },
  media: { width: '80%', aspectRatio: 4 / 3, alignSelf: 'center', borderRadius: 6 },
  questionText: { fontFamily: fonts.barlowRegular, fontSize: 16, lineHeight: 26, color: colors.textPrimary },
  stem: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 24, color: colors.textSecondary },
  optionList: { gap: 10, marginTop: 4 },
  matchColumns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  matchColumn: { flex: 1, gap: 10 },
  matchHint: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, textAlign: 'center' },
});
