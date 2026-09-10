/**
 * Final Exam (R6b capstone) — the award-level examination.
 *
 * A deliberate port of screens/quiz/QuizScreen.tsx, because the server applies
 * identical rules to both (verified against live function bodies 2026-08-28):
 *   • 10:00 deadline computed from the server's started_at, never pauses;
 *     force-submit at 0:00 (server grades timed_out past 602s).
 *   • App-switch: 2s grace, 1st loss warns, 2nd VOIDS + 15-minute lockout.
 *   • Answers recorded as served VALUE strings keyed by slot_index (F4).
 *   • One question at a time; tap select → 350ms highlight → auto-advance.
 *
 * Differences from the topic quiz, all of them because this is the capstone:
 *   • Header reads "FINAL EXAM" and the pass mark is shown up front.
 *   • No practice mode — a Final Exam attempt is always genuine.
 *   • Exit copy warns that leaving wipes answers; the attempt stays open
 *     server-side and re-entry resumes the SAME payload.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
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
import { confirmDialog, notify } from '../../lib/confirm';
import {
  clearExamIntent,
  enqueueExamSubmission,
  ExamStartFailure,
  EXAM_START_ERROR_COPY,
  startFinalExam,
  submitFinalExam,
  type AnswerValue,
  type ExamItem,
  type ExamPayload,
  type MatchingOptions,
} from '../../features/finalExam/api';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FinalExam'>;

const HIGHLIGHT_MS = 350;
const FOCUS_GRACE_S = 2;

function fmtClock(msLeft: number): string {
  const s = Math.max(0, Math.ceil(msLeft / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function FinalExamScreen({ navigation, route }: Props) {
  const { awardType, awardId, awardName } = route.params;
  const insets = useSafeAreaInsets();

  const [payload, setPayload] = useState<ExamPayload | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [msLeft, setMsLeft] = useState<number>(600_000);
  // Selection is tracked by OPTION INDEX, never by the value string (C1): two
  // options with the same display text must remain independently selectable.
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [multiSel, setMultiSel] = useState<Set<number>>(new Set());
  const [leftSel, setLeftSel] = useState<number | null>(null);
  const [pairs, setPairs] = useState<[number, number][]>([]); // [leftIndex, rightIndex]
  const [submitting, setSubmitting] = useState(false);

  const answers = useRef<Record<string, AnswerValue>>({});
  const focusLossCount = useRef(0);
  const focusLossDuration = useRef(0);
  const blurStartedAt = useRef<number | null>(null);
  const submitted = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  /* ---- attempt start (online-only; idempotent resume) ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await startFinalExam(awardType, awardId);
        if (alive) setPayload(p);
      } catch (e) {
        if (!alive) return;
        const code = e instanceof ExamStartFailure ? e.code : 'unknown';
        setStartError(EXAM_START_ERROR_COPY[code]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [awardType, awardId]);

  const deadline = useMemo(
    () =>
      payload
        ? new Date(payload.started_at).getTime() + (payload.time_limit_seconds ?? 600) * 1000
        : null,
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
        const result = await submitFinalExam(args);
        await clearExamIntent(awardType, awardId);
        // REPLACE the exam with its result rather than popToTop()+navigate
        // (launch audit 2026-09-09). FinalExam/FinalExamResult live on the ROOT
        // stack whose first route is Splash, so popToTop() popped to Splash and
        // pushed the result above it — a hardware back then re-ran Splash's
        // session hand-off. Replacing swaps the just-finished exam for the
        // result, leaving the originating AwardProgress beneath, so Done / back
        // returns there (the award's progress, now showing the credential).
        (navigation as any).replace('FinalExamResult', { result, awardName, awardType, awardId });
      } catch (e) {
        if (/network|fetch/i.test((e as Error).message)) {
          await enqueueExamSubmission({ ...args, awardType, awardId });
          // notify / confirmDialog, not Alert.alert: RN-web's Alert is a no-op,
          // so these were silent on the web preview (B-148).
          notify(
            'Offline',
            'Your exam is saved and will be submitted automatically when you reconnect. Your finish time is preserved.',
            () => navigation.goBack(),
          );
        } else {
          // [31] (2026-09-07): release the double-submit latch on a non-network
          // failure so the attempt can be retried (offline path stays queued).
          submitted.current = false;
          notify('Submit failed', (e as Error).message, () => navigation.goBack());
        }
      } finally {
        // [32] (2026-09-07): the success path replace()s (unmounts) this screen,
        // so guard the state set against a post-unmount update.
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [payload, awardType, awardId, awardName, navigation],
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
      if (dur <= FOCUS_GRACE_S) return;
      focusLossCount.current += 1;
      focusLossDuration.current += dur;
      if (focusLossCount.current === 1) {
        notify(
          'App switch detected',
          'Leaving the app during the Final Exam is not allowed. One more switch will VOID this attempt and lock the exam for 15 minutes.',
        );
      } else {
        void doSubmit();
      }
    });
    return () => sub.remove();
  }, [payload, doSubmit]);

  /* ---- per-question state helpers ---- */
  const question: ExamItem | null = payload?.items[qIdx] ?? null;

  const advance = useCallback(() => {
    setSelIdx(null);
    setMultiSel(new Set());
    setLeftSel(null);
    setPairs([]);
    if (!payload) return;
    if (qIdx + 1 >= payload.items.length) void doSubmit();
    else setQIdx((i) => i + 1);
  }, [payload, qIdx, doSubmit]);

  const recordAndAdvance = useCallback(
    (slot: number, value: AnswerValue) => {
      answers.current[String(slot)] = value; // F4: slot-keyed VALUES
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(advance, HIGHLIGHT_MS);
    },
    [advance],
  );

  const pickSingle = useCallback(
    (idx: number, value: string) => {
      if (!question || selIdx !== null) return;
      setSelIdx(idx);
      recordAndAdvance(question.slot_index, value); // submit the served string
    },
    [question, selIdx, recordAndAdvance],
  );

  const toggleMulti = useCallback((idx: number) => {
    setMultiSel((cur) => {
      const next = new Set(cur);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const confirmMulti = useCallback(() => {
    if (!question || multiSel.size === 0) return;
    // Preserve served order for determinism (grading is set-based server-side);
    // map the selected INDICES back to their value strings.
    const opts = Array.isArray(question.options) ? (question.options as string[]) : [];
    recordAndAdvance(
      question.slot_index,
      opts.filter((_, i) => multiSel.has(i)),
    );
  }, [question, multiSel, recordAndAdvance]);

  const pickMatch = useCallback(
    (side: 'left' | 'right', idx: number) => {
      if (!question) return;
      const pairedLeft = (i: number) => pairs.some((p) => p[0] === i);
      const pairedRight = (i: number) => pairs.some((p) => p[1] === i);
      if (side === 'left') {
        if (pairedLeft(idx)) return;
        setLeftSel((cur) => (cur === idx ? null : idx));
        return;
      }
      if (leftSel === null || pairedRight(idx)) return;
      const nextPairs: [number, number][] = [...pairs, [leftSel, idx]];
      setPairs(nextPairs);
      setLeftSel(null);
      const opts = question.options as MatchingOptions;
      const lefts = Array.isArray(opts?.lefts) ? opts.lefts : [];
      const rights = Array.isArray(opts?.rights) ? opts.rights : [];
      const k = lefts.length;
      if (k > 0 && nextPairs.length === k) {
        // F4: submit VALUE tuples, resolved from the index pairs.
        const valuePairs = nextPairs.map(([li, ri]) => [lefts[li], rights[ri]] as [string, string]);
        recordAndAdvance(question.slot_index, valuePairs);
      }
    },
    [question, leftSel, pairs, recordAndAdvance],
  );

  const confirmExit = useCallback(() => {
    confirmDialog(
      'Leave the Final Exam?',
      'Your answers will be wiped immediately. The exam allows no pause or save.',
      'Leave & wipe',
      () => {
        answers.current = {};
        navigation.goBack();
      },
      { cancelText: 'Keep going', destructive: true },
    );
  }, [navigation]);

  // M3 (launch audit 2026-09-09; ported from QuizScreen): a malformed options
  // payload renders no controls; record an empty answer for the slot and move
  // on rather than stranding the learner until the 10-minute force-submit.
  const skipQuestion = useCallback(() => {
    if (!question) return;
    answers.current[String(question.slot_index)] = '';
    advance();
  }, [question, advance]);

  /* ---- Android hardware-back routes through the exit confirm (launch audit
     2026-09-09; ported from QuizScreen). Without this, gestureEnabled:false only
     blocks the iOS swipe, so a hardware BACK during the timed capstone pops the
     screen instantly — abandoning the sitting with no "answers will be wiped"
     confirm. ---- */
  useEffect(() => {
    if (!payload || submitting) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (submitted.current) return false;
      confirmExit();
      return true; // handled
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, submitting]);

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
  if (payload && payload.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          This Final Exam has no questions available right now. Please try again later.
        </Text>
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
  // Runtime shape guards (parity with QuizScreen): `as` casts are compile-time
  // only, so a malformed payload renders empty rather than crashing.
  const rawOpts = question.options as unknown;
  const matching: MatchingOptions | null =
    isMatching &&
    Array.isArray((rawOpts as MatchingOptions)?.lefts) &&
    Array.isArray((rawOpts as MatchingOptions)?.rights)
      ? (rawOpts as MatchingOptions)
      : null;
  const singleOpts: string[] = !isMatching && Array.isArray(rawOpts) ? (rawOpts as string[]) : [];
  const isMulti = question.question_type === 'multi_select';
  // Whether ANY answerable control will render — drives the M3 Skip fallback.
  const answerable = isMatching ? !!matching : singleOpts.length > 0;

  const singleState = (i: number): AnswerCellState =>
    selIdx === i ? 'selectedBlue' : selIdx !== null ? 'dimmed' : 'default';
  const leftState = (i: number): AnswerCellState =>
    pairs.some((p) => p[0] === i) ? 'dimmed' : leftSel === i ? 'selectedBlue' : 'default';
  const rightState = (i: number): AnswerCellState => (pairs.some((p) => p[1] === i) ? 'dimmed' : 'default');

  const passMark = Math.max(1, payload.items.length - 2);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable onPress={confirmExit} hitSlop={16} accessibilityRole="button" accessibilityLabel="Leave Final Exam">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerCounter}>
            {qIdx + 1} OF {payload.items.length}
          </Text>
          <Text style={styles.examChip}>FINAL EXAM</Text>
        </View>
        <Text style={[styles.timer, msLeft < 60_000 && styles.timerLow]}>{fmtClock(msLeft)}</Text>
      </View>

      <View style={styles.subBar}>
        <Text style={styles.subBarText} numberOfLines={1}>
          {awardName}
        </Text>
        <Text style={styles.subBarMark}>
          PASS {passMark}/{payload.items.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {question.media_url ? (
          <Image
              source={{ uri: question.media_url }}
              style={styles.media}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Figure for this exam question"
            />
        ) : null}

        <Text style={styles.questionText}>{question.question_text ?? ''}</Text>
        {question.stem && question.stem !== question.question_text ? (
          <Text style={styles.stem}>{question.stem}</Text>
        ) : null}

        {!isMatching && (
          <View style={styles.optionList}>
            {singleOpts.map((opt, i) => (
              <AnswerCell
                key={i}
                label={opt}
                minHeight={48}
                state={isMulti ? (multiSel.has(i) ? 'selectedOrange' : 'default') : singleState(i)}
                check={isMulti ? (multiSel.has(i) ? 'checked' : 'unchecked') : 'none'}
                onPress={() => (isMulti ? toggleMulti(i) : pickSingle(i, opt))}
                disabled={!isMulti && selIdx !== null}
              />
            ))}
          </View>
        )}

        {isMulti && answerable && (
          <StudioButton label="Confirm" variant="success" disabled={multiSel.size === 0} onPress={confirmMulti} />
        )}

        {isMatching && matching && (
          <>
            <View style={styles.matchColumns}>
              <View style={styles.matchColumn}>
                {matching.lefts.map((v, i) => (
                  <AnswerCell
                    key={i}
                    label={v}
                    fontSize={14}
                    borderWidth={1.5}
                    minHeight={48}
                    numberOfLines={3}
                    state={leftState(i)}
                    onPress={() => pickMatch('left', i)}
                  />
                ))}
              </View>
              <View style={styles.matchColumn}>
                {matching.rights.map((v, i) => (
                  <AnswerCell
                    key={i}
                    label={v}
                    fontSize={13}
                    borderWidth={1.5}
                    minHeight={48}
                    numberOfLines={3}
                    state={rightState(i)}
                    onPress={() => pickMatch('right', i)}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.matchHint}>
              PAIR EVERY TERM · {pairs.length} / {matching.lefts.length}
            </Text>
          </>
        )}

        {!answerable && (
          <View style={styles.skipWrap}>
            <Text style={styles.errorText}>
              This question couldn’t be displayed. You can skip it and keep going.
            </Text>
            <StudioButton label="Skip question" variant="secondary" onPress={skipQuestion} />
          </View>
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
  examChip: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.amber,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.6)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#0f0f0f',
  },
  subBarText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSecondary },
  subBarMark: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, color: colors.textSubAlt },
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
  skipWrap: { gap: 12, marginTop: 8 },
});
