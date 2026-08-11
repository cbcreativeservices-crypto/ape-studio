/**
 * S13 — Scenarios as HOMEWORK (owner spec 2026-08-11).
 *
 * A topic's scenarios are grouped by term (up to 3 each). The homework is THREE
 * ROUNDS — one scenario per term per round — pre-assigned server-side so all of
 * a term's scenarios are covered across the rounds. Each round is a full pass
 * (one item per term); finishing a round shows an encouraging, concept-clustered
 * report; completing all 3 fills the Dashboard scenarios LED (rounds ÷ 3).
 *
 * Robustness: rounds are built from whatever scenarios exist per term (0/1/2/3),
 * so short buckets just yield shorter later rounds — never a crash.
 *
 * In-round: inline ✓/✕ + explanation, no retry, auto-advance. Progress persists
 * server-side (mid-round resume). The Ear Training (S12) method was retired
 * (Booth 2026-07-26).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnswerCell, type AnswerCellState } from '../../components/AnswerCell';
import { AudioPlayer } from '../../components/AudioPlayer';
import { LedMeterWell } from '../../components/LedMeter';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import {
  SCENARIO_ROUNDS,
  buildRoundReport,
  completeScenarioRound,
  fetchScenarioHomework,
  recordScenarioAnswer,
  startScenarioCycle,
  type RoundReport,
  type ScenarioAnswer,
  type ScenarioHomework,
  type ScenarioQ,
} from '../../features/study/scenarioHomework';
import { setLastStudyLocation } from '../../features/study/lastStudyLocation';
import { StudyHeader } from './StudyHeader';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'Scenarios'>;

const EXPLANATION_MS = 3000;

type Feedback = { correct: boolean; text: string };
type View5 = 'loading' | 'nocontent' | 'play' | 'report' | 'done';

export function ScenariosScreen({ route }: Props) {
  const { achievementId, topicName } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'method', route: 'Scenarios', achievementId, topicName });
    }, [achievementId, topicName]),
  );

  const [hw, setHw] = useState<ScenarioHomework | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View5>('loading');
  const [activeRound, setActiveRound] = useState(1);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [sequence, setSequence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [report, setReport] = useState<RoundReport | null>(null);
  const [busy, setBusy] = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef<Record<string, ScenarioAnswer>>({});
  const initedRef = useRef(false);

  const roundQuestions: ScenarioQ[] = hw?.rounds[activeRound - 1] ?? [];
  const total = roundQuestions.length;
  const answeredInRound = useMemo(
    () => roundQuestions.filter((q) => answersRef.current[q.id]).length,
    // recompute as the pointer moves / round changes
    [roundQuestions, idx, activeRound, view],
  );

  const clearInteraction = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setPicked(null);
    setMultiSel(new Set());
    setSequence([]);
    setFeedback(null);
  };

  const finishRound = useCallback(
    (rq: ScenarioQ[], r: number) => {
      clearInteraction();
      setReport(buildRoundReport(r, rq, answersRef.current));
      setView('report');
      void completeScenarioRound(achievementId, r).then((rc) => {
        setHw((prev) =>
          prev ? { ...prev, roundsCompleted: Math.max(prev.roundsCompleted, rc) } : prev,
        );
      });
    },
    [achievementId],
  );

  /** Set up play for round r: resume at the first unanswered item, or finish the
   *  round outright if there's nothing (short/empty bucket) left to answer. */
  const enterRound = useCallback(
    (rq: ScenarioQ[], r: number) => {
      const first = rq.findIndex((q) => !answersRef.current[q.id]);
      if (rq.length === 0 || first === -1) {
        finishRound(rq, r);
        return;
      }
      clearInteraction();
      setActiveRound(r);
      setIdx(first);
      setView('play');
    },
    [finishRound],
  );

  // initial load
  useEffect(() => {
    let alive = true;
    fetchScenarioHomework(achievementId).then((h) => {
      if (!alive) return;
      setHw(h);
      setLoaded(true);
    });
    return () => {
      alive = false;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [achievementId]);

  // one-time setup once the plan is loaded
  useEffect(() => {
    if (!loaded || initedRef.current) return;
    initedRef.current = true;
    if (!hw || !hw.rounds.some((r) => r.length > 0)) {
      setView('nocontent');
      return;
    }
    answersRef.current = { ...hw.answers };
    if (hw.roundsCompleted >= SCENARIO_ROUNDS) {
      setView('done');
      return;
    }
    enterRound(hw.rounds[hw.currentRound - 1] ?? [], Math.min(SCENARIO_ROUNDS, hw.currentRound));
  }, [loaded, hw, enterRound]);

  const item = view === 'play' ? roundQuestions[idx] : null;

  const nextUnanswered = (from: number) => {
    for (let j = from; j < roundQuestions.length; j++) {
      if (!answersRef.current[roundQuestions[j].id]) return j;
    }
    return -1;
  };

  const advance = useCallback(() => {
    clearInteraction();
    const nextI = nextUnanswered(idx + 1);
    if (nextI === -1) finishRound(roundQuestions, activeRound);
    else setIdx(nextI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, roundQuestions, activeRound, finishRound]);

  const judge = useCallback(
    (correct: boolean) => {
      if (!item) return;
      answersRef.current[item.id] = { round: activeRound, correct };
      void recordScenarioAnswer(achievementId, item.id, activeRound, correct);
      setFeedback({ correct, text: item.explanation });
      advanceTimer.current = setTimeout(advance, EXPLANATION_MS);
    },
    [item, activeRound, achievementId, advance],
  );

  const answerSingle = useCallback(
    (opt: string) => {
      if (!item || picked || feedback) return;
      setPicked(opt);
      judge(opt === item.correct[0]);
    },
    [item, picked, feedback, judge],
  );

  const confirmMulti = useCallback(() => {
    if (!item || multiSel.size === 0 || feedback) return;
    const sel = [...multiSel].sort();
    const correct = sel.length === item.correct.length && sel.every((s) => item.correct.includes(s));
    judge(correct);
  }, [item, multiSel, feedback, judge]);

  const tapStep = useCallback(
    (opt: string) => {
      if (!item || feedback) return;
      setSequence((cur) => (cur.includes(opt) ? cur.filter((s) => s !== opt) : [...cur, opt]));
    },
    [item, feedback],
  );

  const confirmSequence = useCallback(() => {
    if (!item || sequence.length !== item.options.length || feedback) return;
    judge(sequence.every((s, i) => s === item.correct[i]));
  }, [item, sequence, feedback, judge]);

  const continueFromReport = () => {
    if (activeRound >= SCENARIO_ROUNDS) {
      setView('done');
      return;
    }
    enterRound(hw?.rounds[activeRound] ?? [], activeRound + 1);
  };

  const onStartFreshCycle = async () => {
    if (busy) return;
    setBusy(true);
    const fresh = await startScenarioCycle(achievementId);
    setBusy(false);
    if (!fresh) return;
    answersRef.current = { ...fresh.answers };
    setHw(fresh);
    setReport(null);
    enterRound(fresh.rounds[0] ?? [], 1);
  };

  /* ---- loading ---- */
  if (view === 'loading') return <View style={[styles.center, { paddingTop: insets.top }]} />;

  /* ---- no content ---- */
  if (view === 'nocontent') {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StudyHeader method="scenarios" title="SCENARIO" />
        <Text style={styles.emptyTitle}>NO SCENARIOS FOR THIS TOPIC</Text>
        <Text style={styles.emptyBody}>
          This topic doesn't include scenario drills. Review it with its other study methods.
        </Text>
      </View>
    );
  }

  /* ---- end-of-round report ---- */
  if (view === 'report' && report) {
    const pct = report.total > 0 ? Math.round((report.score / report.total) * 100) : 100;
    const headline =
      pct >= 90 ? 'Outstanding work.' : pct >= 70 ? 'Strong round.' : pct >= 50 ? 'Good progress.' : "You're building the picture.";
    const lastRound = report.round >= SCENARIO_ROUNDS;
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <StudyHeader method="scenarios" title="SCENARIO" />
          <Text style={styles.reportRound}>ROUND {report.round} OF {SCENARIO_ROUNDS} · COMPLETE</Text>
          <Text style={styles.reportHead}>{headline}</Text>
          {report.total > 0 ? (
            <Text style={styles.reportScore}>
              You answered <Text style={styles.reportScoreNum}>{report.score}</Text> of {report.total} correctly.
            </Text>
          ) : null}

          {report.strengths.length > 0 && (
            <View style={[styles.card, styles.cardGood]}>
              <Text style={styles.cardTitleGood}>WHAT YOU'VE GOT DOWN</Text>
              {report.strengths.map((s) => (
                <Text key={s.category} style={styles.cardLine}>
                  • {s.category} — {s.correct}/{s.total}
                </Text>
              ))}
            </View>
          )}

          {report.toReview.length > 0 && (
            <View style={[styles.card, styles.cardReview]}>
              <Text style={styles.cardTitleReview}>REVISIT THESE TO SEE THE BIGGER PICTURE</Text>
              <Text style={styles.cardSub}>
                A little review here connects the details into the whole. Focus your next pass on:
              </Text>
              {report.toReview.map((s) => (
                <Text key={s.category} style={styles.cardLine}>
                  • {s.category} — {s.correct}/{s.total}
                </Text>
              ))}
            </View>
          )}

          {report.missed.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>WORTH A SECOND LOOK</Text>
              {report.missed.map((m, i) => (
                <View key={i} style={styles.missItem}>
                  {m.term ? <Text style={styles.missTerm}>{m.term}</Text> : null}
                  <Text style={styles.missPrompt}>{m.prompt}</Text>
                  <Text style={styles.missAnswer}>Answer: {m.answer}</Text>
                  {m.explanation ? <Text style={styles.missExp}>{m.explanation}</Text> : null}
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: 6 }}>
            <StudioButton
              label={lastRound ? 'Finish homework' : `Begin Round ${report.round + 1}`}
              variant="success"
              onPress={continueFromReport}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ---- all 3 rounds done ---- */
  if (view === 'done') {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StudyHeader method="scenarios" title="SCENARIO" />
        <Text style={styles.doneTitle}>ALL THREE ROUNDS COMPLETE</Text>
        <Text style={styles.emptyBody}>
          You've worked through every scenario for this topic — the scenarios meter on your Dashboard
          is full. Come back any time for a fresh, re-shuffled set.
        </Text>
        <View style={{ width: 240, marginTop: 8, gap: 10 }}>
          <StudioButton label={busy ? 'Shuffling…' : 'Start a fresh set'} variant="primary" small disabled={busy} onPress={onStartFreshCycle} />
          <StudioButton
            label="Back to Dashboard"
            variant="secondary"
            small
            onPress={() => (navigation as any).navigate('Dashboard')}
          />
        </View>
      </View>
    );
  }

  /* ---- play ---- */
  if (!item) return <View style={[styles.center, { paddingTop: insets.top }]} />;

  const isMulti = item.type === 'multi_select';
  const isSeq = item.type === 'sequencing';

  const cellState = (opt: string): AnswerCellState => {
    if (isSeq) return sequence.includes(opt) ? 'selectedBlue' : 'default';
    if (isMulti) return multiSel.has(opt) ? 'selectedOrange' : 'default';
    if (!picked) return 'default';
    if (opt === picked) return feedback?.correct ? 'selectedBlue' : 'wrongRed';
    return 'dimmed';
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StudyHeader method="scenarios" title="SCENARIO" />
        <View style={{ alignSelf: 'stretch' }}>
          <LedMeterWell filled={Math.round((answeredInRound / Math.max(1, total)) * 21)} />
        </View>

        {item.term ? <Text style={styles.termTag}>{item.term.toUpperCase()}</Text> : null}

        {item.media?.kind === 'audio' && <AudioPlayer uri={item.media.url} />}
        {item.media?.kind === 'image' && (
          <Image source={{ uri: item.media.url }} style={styles.mediaImage} resizeMode="contain" />
        )}

        <Text style={styles.prompt}>{item.prompt}</Text>

        <View style={styles.optionList}>
          {item.options.map((opt) => (
            <View key={opt} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isSeq && (
                <View style={[styles.seqBadge, sequence.includes(opt) && styles.seqBadgeActive]}>
                  <Text style={styles.seqBadgeText}>
                    {sequence.includes(opt) ? sequence.indexOf(opt) + 1 : '·'}
                  </Text>
                </View>
              )}
              <AnswerCell
                label={opt}
                state={cellState(opt)}
                minHeight={48}
                check={isMulti ? (multiSel.has(opt) ? 'checked' : 'unchecked') : 'none'}
                onPress={() =>
                  isSeq
                    ? tapStep(opt)
                    : isMulti
                      ? setMultiSel((cur) => {
                          const next = new Set(cur);
                          if (next.has(opt)) next.delete(opt);
                          else next.add(opt);
                          return next;
                        })
                      : answerSingle(opt)
                }
                disabled={!!feedback && !isSeq && !isMulti}
              />
            </View>
          ))}
        </View>

        {isMulti && !feedback && (
          <StudioButton label="Confirm" variant="success" disabled={multiSel.size === 0} onPress={confirmMulti} />
        )}
        {isSeq && !feedback && (
          <StudioButton
            label="Confirm Order"
            variant="success"
            disabled={sequence.length !== item.options.length}
            onPress={confirmSequence}
          />
        )}

        {feedback && (
          <Pressable onPress={advance}>
            <View style={[styles.banner, feedback.correct ? styles.bannerOk : styles.bannerWrong]}>
              <Text style={[styles.bannerText, { color: feedback.correct ? '#7dffa1' : '#ffb3a8' }]}>
                {feedback.correct ? '✓ Correct — ' : '✕ Not quite — '}
                {feedback.text} <Text style={styles.bannerHint}>(auto-advance in 3s · tap to skip)</Text>
              </Text>
            </View>
          </Pressable>
        )}

        <Text style={styles.counter}>
          ITEM {idx + 1} OF {total} · ROUND {activeRound} OF {SCENARIO_ROUNDS}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, backgroundColor: colors.screenBg, padding: 16, gap: 14, alignItems: 'center' },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 2, color: colors.textMuted, marginTop: 40 },
  doneTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: '#37e05f', marginTop: 40 },
  emptyBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSub,
    textAlign: 'center',
    maxWidth: 300,
  },
  scroll: { padding: 16, gap: 16 },
  termTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSubAlt },
  mediaImage: { width: '80%', aspectRatio: 4 / 3, alignSelf: 'center', borderRadius: 6 },
  prompt: {
    fontFamily: fonts.barlowRegular,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 8,
    padding: 14,
  },
  optionList: { gap: 10 },
  seqBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqBadgeActive: { borderColor: 'rgba(47,155,255,.8)', backgroundColor: '#132638' },
  seqBadgeText: { fontFamily: fonts.mono, fontSize: 12, color: '#d6ecff' },
  banner: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14 },
  bannerOk: { backgroundColor: '#0d1f12', borderColor: 'rgba(55,224,95,.5)' },
  bannerWrong: { backgroundColor: '#210f0b', borderColor: 'rgba(255,75,58,.5)' },
  bannerText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20 },
  bannerHint: { color: '#5a5a5a' },
  counter: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, textAlign: 'center' },

  // ---- report ----
  reportRound: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: colors.textSubAlt, marginTop: 4 },
  reportHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textPrimary },
  reportScore: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 23, color: colors.textSecondary },
  reportScoreNum: { fontFamily: fonts.oswaldSemiBold, color: '#37e05f' },
  card: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairlineAlt, backgroundColor: '#161616', padding: 14, gap: 6 },
  cardGood: { borderColor: 'rgba(55,224,95,.35)', backgroundColor: '#0e1a12' },
  cardReview: { borderColor: 'rgba(255,176,80,.35)', backgroundColor: '#1c150b' },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  cardTitleGood: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: '#7dffa1' },
  cardTitleReview: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: '#ffcf8a' },
  cardSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 19, color: colors.textSub },
  cardLine: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  missItem: { gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.05)' },
  missTerm: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSubAlt },
  missPrompt: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  missAnswer: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: '#7dffa1' },
  missExp: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 19, color: colors.textSub },
});
