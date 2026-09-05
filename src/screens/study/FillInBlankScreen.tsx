/**
 * S3 — Fill-in-Blank (study).
 *
 * Locked behavior: 4-option grid 2×2, 8px gap · tap select → 350ms highlight →
 * auto-advance · media 80%/4:3 top · LED per question · 100% → manual back
 * only · bottom nav visible.
 *
 * Booth 2026-07-07: swipe ‹ › navigates back/forward through questions like
 * flashcards (revisit a missed term and answer it again — extra attempts
 * accrue server-side normally). Pan handlers live on the screen ROOT with no
 * ScrollView (a scroller eats the gestures — same fix as flashcards). The
 * LED creeps via studyDisplayPct (partial credit per pass) instead of the
 * leap-prone completion_pct; gates still read server fields.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnswerCell, type AnswerCellState } from '../../components/AnswerCell';
import { GlassButton } from '../../components/GlassButton';
import { LedMeterWell, segmentsForPct } from '../../components/LedMeter';
import { StudyFsOverlay, FsButton } from '../../components/StudyFsOverlay';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import {
  fetchMethodState,
  fetchTopicItems,
  studyDisplayPct,
  type GlossaryItem,
  type ItemStates,
} from '../../features/study/api';
import { BLANK, fibSentence } from '../../features/study/sentences';
import { StudySession } from '../../features/study/sync';
import { loadLocalMethodStates, mergeItemStates, saveLocalMethodStates } from '../../features/study/localProgress';
import { supabase } from '../../lib/supabase';
import { SuggestCorrectionButton } from '../../features/study/SuggestCorrectionButton';
import { incBrainOutput, resetBrainOutput, setRunning, usePaceSettings, useRunning } from '../../features/study/paceStore';
import { setLastStudyLocation } from '../../features/study/lastStudyLocation';
import { recordPaceSession } from '../../features/study/paceRecords';
import { PaceTimerBar } from '../../features/study/PaceTimerBar';
import { PaceTimerModal } from '../../features/study/PaceTimerModal';
import { registerTrialAnswer, useTimeTrial } from '../../features/study/timeTrial';
import { StudyHeader } from './StudyHeader';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'FillInBlank'>;

const FEEDBACK_MS = 950; // hold correct/incorrect coloring before auto-advance

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Split an already-masked sentence into the chunks around its blanks. The
 * masking itself (term, word variants, partial words, abbreviation) is done
 * once by `fibSentence` (study-method text audit 2026-09-05). When no
 * sentence of the definition names the term at all — 57% of the corpus —
 * the sentence DESCRIBES the answer, so a trailing blank is appended: the
 * learner always has somewhere to put the answer instead of a bare sentence.
 */
function blankOut(sentence: string, hasBlank: boolean): { pre: string[] } {
  if (!hasBlank) return { pre: [`${sentence} `, ''] };
  return { pre: sentence.split(BLANK) };
}

export function FillInBlankScreen({ navigation, route }: Props) {
  const { achievementId, topicName } = route.params;

  // Remember this exact method+topic so the Enrollments "CONTINUE LEARNING"
  // banner can resume here (re-records on every focus = true last-visited).
  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'method', route: 'FillInBlank', achievementId, topicName });
    }, [achievementId, topicName]),
  );
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<GlossaryItem[] | null>(null);
  const [states, setStates] = useState<ItemStates>({});
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const session = useRef<StudySession | null>(null);
  // Auto-advance timer — tracked so it's cleared on unmount (no setState after
  // unmount if the user leaves during the feedback hold). Owner debug audit.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  // Pace timer (practice aid — device-local settings, never blocks study).
  const { settings: pace, setEnabled, setPreset } = usePaceSettings('fill_in_blank');
  const running = useRunning('fill_in_blank');
  // Time trial (opt-in 15:00 challenge) — the readout switches to its HUD while live.
  const trial = useTimeTrial('fill_in_blank');
  const [timerOpen, setTimerOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const recordedRef = useRef(false);
  // Baseline for the RESET button: the answered count at the last reset, so the
  // readout's session counters zero without touching earned study progress.
  const answeredBaseRef = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [fetched, methodState, localStates] = await Promise.all([
          fetchTopicItems(achievementId),
          fetchMethodState(achievementId, 'fill_in_blank'),
          // Device-mirror resume merge — SIGNED-IN only (same ruling as the
          // flashcards fix 2026-08-17; QA night 2026-08-31 found FIB/Matching
          // never got it, and a single answer then clobbered the mirror).
          supabase.auth
            .getSession()
            .then(({ data }) => (data.session ? loadLocalMethodStates(achievementId, 'fill_in_blank') : null))
            .catch(() => null),
        ]);
        if (!alive) return;
        setItems(shuffle(fetched));
        setStates(mergeItemStates(methodState?.itemStates, localStates));
      } catch {
        if (alive) setError('Could not load this topic. Check your connection.');
      }
    })();
    const s = new StudySession(achievementId, 'fill_in_blank', () => {});
    s.start();
    session.current = s;
    return () => {
      alive = false;
      void s.stop();
      session.current = null;
    };
  }, [achievementId]);

  // Mirror progress to the device so the Dashboard reflects it immediately,
  // even before the server write lands (Booth 2026-07-15).
  useEffect(() => {
    if (Object.keys(states).length) void saveLocalMethodStates(achievementId, 'fill_in_blank', states);
  }, [states, achievementId]);

  // Fresh visit = fresh pace session: the clock (startRef/elapsedRef) is
  // per-instance and starts at 0 on mount, but the brain-output tally and the
  // running flag live in the module-level store and would otherwise carry over
  // from the previous visit (stale AHEAD/BEHIND offset at 0:00, or a paused
  // readout). Zero the tally and start running so the readout is consistent (B-138).
  useEffect(() => {
    resetBrainOutput('fill_in_blank');
    setRunning('fill_in_blank', true);
  }, []);

  // Pace clock: present while ENABLED; only ticks while also RUNNING. When
  // enabled-but-paused the clock HOLDS (elapsed kept); disabling resets to 0.
  useEffect(() => {
    if (!pace.enabled) {
      startRef.current = null;
      elapsedRef.current = 0;
      recordedRef.current = false;
      setElapsed(0);
      resetBrainOutput('fill_in_blank'); // fresh pace session → zero the brain-output tally
      return;
    }
    if (!running) return; // paused → hold the clock where it is
    startRef.current = Date.now() - elapsedRef.current * 1000; // resume from held time
    const id = setInterval(() => {
      if (startRef.current != null) {
        const e = (Date.now() - startRef.current) / 1000;
        elapsedRef.current = e;
        setElapsed(e);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [pace.enabled, running]);

  // answered = distinct items with at least one attempt (progress through M).
  const answered = useMemo(
    () => Object.values(states).filter((s) => (s.attempts ?? 0) > 0).length,
    [states],
  );
  const answeredRef = useRef(answered);
  answeredRef.current = answered;

  // Reset zeroes the readout's elapsed + answered session counters (a fresh
  // pace window) — earned study progress (states) is untouched.
  const handlePaceReset = useCallback(() => {
    answeredBaseRef.current = answered;
    startRef.current = Date.now();
    elapsedRef.current = 0;
    recordedRef.current = false;
    setElapsed(0);
    resetBrainOutput('fill_in_blank');
  }, [answered]);

  // ENABLING the timer opens a fresh pace window (same as RESET): answers and
  // brain outputs made before the clock started must not count, or a freshly
  // added timer reads 5/5 · 300 Q/min at 0:01 and the stopwatch logs a 0 s
  // best (B-083). Re-baselined once the topic loads too, since a persisted
  // ON timer can hydrate before the server progress arrives.
  useEffect(() => {
    if (!pace.enabled) return;
    answeredBaseRef.current = answeredRef.current;
    startRef.current = Date.now();
    elapsedRef.current = 0;
    recordedRef.current = false;
    setElapsed(0);
    resetBrainOutput('fill_in_blank');
  }, [pace.enabled, items]);

  // STOPWATCH: on completing all items WITHIN the timed window, log the run once
  // (encouraging records). Trivially short runs are skipped, as in AUTO TRACK.
  useEffect(() => {
    if (!pace.enabled || pace.preset !== 'stopwatch' || recordedRef.current) return;
    if (!items || items.length === 0 || startRef.current == null) return;
    if (answered - answeredBaseRef.current < items.length) return;
    const secs = (Date.now() - startRef.current) / 1000;
    if (secs < 2) return;
    recordedRef.current = true;
    void recordPaceSession('fill_in_blank', secs, items.length);
  }, [pace.enabled, pace.preset, answered, items]);

  // Working order: items still needing attempts first, then the rest.
  const order = useMemo(() => {
    if (!items) return [];
    const notDone = items.filter((it) => (states[it.id]?.attempts ?? 0) < 2);
    const done = items.filter((it) => (states[it.id]?.attempts ?? 0) >= 2);
    return [...notDone, ...done];
    // Stable within the session so navigation doesn't reshuffle underfoot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const question = useMemo(() => {
    if (order.length === 0) return null;
    const item = order[((qIdx % order.length) + order.length) % order.length];
    // One randomly-chosen sentence per showing (Booth 2026-07-08) — the same
    // term can present a different facet of its definition each time. The
    // sentence arrives with the answer (and its variants) already masked.
    // Distractors prefer terms that share a word with the answer, and only the
    // words that would single the answer out among the four options are
    // blanked (reader finding 2026-09-05: masking every repeat of "tape" made
    // six blanks in one sentence; leaving "reverb" visible gave the pair away).
    const fb = fibSentence(item.term, item.definition, order.filter((o) => o.id !== item.id).map((o) => o.term));
    return { item, sentence: fb.masked, hasBlank: fb.hasBlank, options: shuffle([item.term, ...fb.distractors]) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, qIdx]);

  const goTo = useCallback((dir: 1 | -1, opts?: { silent?: boolean }) => {
    // silent = a SWIPE-BYPASS: no touch(), so skipped questions never keep the
    // engagement timer alive and never count toward the study gate (Booth
    // 2026-07-15). Prev/Next stay "real" interactions.
    if (!opts?.silent) session.current?.touch();
    setPicked(null);
    setQIdx((i) => i + dir);
  }, []);

  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const pickedRef = useRef(picked);
  pickedRef.current = picked;

  // Swipe ‹ › on the whole screen (Booth ruling — study methods navigate
  // back/forward by gesture, like flashcards; the quiz stays forward-only).
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderRelease: (_e, g) => {
        if (pickedRef.current) return; // mid-highlight — let it advance
        if (g.dx <= -50) goToRef.current(1, { silent: true });
        else if (g.dx >= 50) goToRef.current(-1, { silent: true });
      },
    }),
  ).current;

  const answer = useCallback(
    (opt: string) => {
      // pickedRef is the SYNCHRONOUS guard (QA night 2026-08-31): a same-tick
      // multi-tap saw batched `picked` still null and recorded 3 answers for
      // one showing. The ref re-syncs from state every render.
      if (!question || picked || pickedRef.current) return;
      pickedRef.current = opt;
      const correct = opt === question.item.term;
      setPicked(opt);
      registerTrialAnswer('fill_in_blank', correct); // time trial: only correct advances pace
      if (correct) incBrainOutput('fill_in_blank'); // one brain output per correct answer press
      session.current?.addEvent({ item: question.item.id, kind: 'answer', correct });
      setStates((prev) => ({
        ...prev,
        [question.item.id]: {
          ...prev[question.item.id],
          attempts: (prev[question.item.id]?.attempts ?? 0) + 1,
          correct: (prev[question.item.id]?.correct ?? 0) + (correct ? 1 : 0),
        },
      }));
      // Hold the correct/incorrect coloring long enough to register the
      // result before advancing (Booth 2026-07-08: give real feedback).
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setPicked(null);
        setQIdx((i) => i + 1);
      }, FEEDBACK_MS);
    },
    [question, picked],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={{ width: 180 }}>
          <StudioButton label="Back" variant="secondary" small onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }
  // Loaded but the topic has no items — offer an exit instead of an endless
  // spinner (StudyStack has no header/back gesture). Owner launch-triage E6.
  if (items && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>This topic has no fill-in-the-blank items yet.</Text>
        <View style={{ width: 180 }}>
          <StudioButton label="Back" variant="secondary" small onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }
  if (!items || !question) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const displayPct = studyDisplayPct(states, items.length, 'fill_in_blank');
  // Readout shows 0–99 until the RAW value is 100 (same rule as the Dashboard
  // row): Math.round alone read "100%" with an item still unstudied (B-086).
  const displayPctLabel = displayPct >= 100 ? 100 : Math.min(Math.round(displayPct), 99);
  const { pre } = blankOut(question.sentence, question.hasBlank);
  const cellState = (opt: string): AnswerCellState => {
    if (!picked) return 'default';
    // After answering: the correct term is always shown GREEN; a wrong pick
    // shows RED (so you see both your mistake and the right answer).
    if (opt === question.item.term) return 'correctGreen';
    if (opt === picked) return 'wrongRed';
    return 'dimmed';
  };
  const itemNumber = ((qIdx % order.length) + order.length) % order.length;

  const questionBody = (
    <>
      <Text style={styles.sentence}>
        {pre.map((chunk, i) => (
          <Text key={i}>
            {chunk}
            {i < pre.length - 1 && <Text style={styles.blank}>______</Text>}
          </Text>
        ))}
      </Text>

      <View style={styles.grid}>
        {question.options.map((opt) => (
          <View key={opt} style={styles.gridCell}>
            <AnswerCell
              label={opt}
              state={cellState(opt)}
              minHeight={64}
              fontSize={18}
              onPress={() => answer(opt)}
              disabled={!!picked}
            />
          </View>
        ))}
      </View>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.body}>
        <StudyHeader
          method="fill_in_blank"
          title="FILL IN THE BLANK"
          subtitle={`Topic · ${topicName}`}
          onOpenTimer={() => setTimerOpen(true)}
          hideTimerButton={!!(pace.enabled || trial.active || trial.result)}
        />
        {/* LED + compact item count (Booth 2026-07-08: count lives up here,
            never floating over the answer grid). */}
        <View style={styles.ledRow}>
          <View style={{ flex: 1 }}>
            <LedMeterWell filled={segmentsForPct(displayPct)} />
          </View>
          <Text style={styles.ledPct}>{displayPctLabel}%</Text>
          <Text style={styles.counter}>
            {itemNumber + 1} / {order.length}
          </Text>
          <FsButton onPress={() => setFullscreen(true)} />
        </View>

        {pace.enabled || trial.active || trial.result ? (
          <PaceTimerBar
            method="fill_in_blank"
            preset={pace.preset}
            answered={Math.max(0, answered - answeredBaseRef.current)}
            total={items.length}
            elapsed={elapsed}
            enabled={pace.enabled}
            onReset={handlePaceReset}
            running={running}
            onToggleRunning={() => setRunning('fill_in_blank', !running)}
            onRemove={() => setEnabled(false)}
            onPresetChange={setPreset}
          />
        ) : null}

        {questionBody}

        {/* Swipe strip (Booth 2026-07-15): the space below the answer grid
            scrolls between questions on a left/right swipe — an alternative to
            Prev/Next. A swipe-bypass never counts toward the study timer/gate. */}
        <View style={styles.swipeZone} {...pan.panHandlers}>
          <Text style={styles.swipeHint}>‹ swipe to browse questions ›</Text>
        </View>

        {/* Suggest a correction — bottom-right of the answers area, above
            Prev/Next (owner 2026-08-13). */}
        <View style={styles.reportRow}>
          <SuggestCorrectionButton
            tag={question?.item?.term}
            context={{
              Method: 'Fill in the blank',
              Topic: topicName,
              'Topic ID': achievementId,
              Term: question?.item?.term,
              'Term ID': question?.item?.id,
            }}
          />
        </View>

        {/* Pinned footer (Booth 2026-07-08): scribble-glass Prev/Next at the
            bottom, same as Matching — swipe ‹ › still works too. */}
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <GlassButton label="‹ PREV" tint="gold" onPress={() => goTo(-1)} disabled={!!picked} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton label="NEXT ›" tint="green" onPress={() => goTo(1)} disabled={!!picked} />
          </View>
        </View>
      </View>

      {/* Full-screen mode — same question, minimal chrome; shake = previous.
          Swipe ‹ › works across the WHOLE full screen (user feedback
          2026-07-17) — same silent bypass as the swipe strip, held while a
          picked answer's feedback is showing. */}
      <StudyFsOverlay
        visible={fullscreen}
        topSlot={
          pace.enabled || trial.active || trial.result ? (
            <PaceTimerBar
              method="fill_in_blank"
              preset={pace.preset}
              answered={Math.max(0, answered - answeredBaseRef.current)}
              total={items.length}
              elapsed={elapsed}
              variant="fullscreen"
            />
          ) : null
        }
        onClose={() => setFullscreen(false)}
        onShakePrev={() => goTo(-1)}
        onSwipePrev={() => {
          if (!picked) goTo(-1, { silent: true });
        }}
        onSwipeNext={() => {
          if (!picked) goTo(1, { silent: true });
        }}
        guideKey="ape:fibFsGuide"
      >
        {questionBody}
      </StudyFsOverlay>

      <PaceTimerModal visible={timerOpen} onClose={() => setTimerOpen(false)} method="fill_in_blank" topicId={achievementId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
  body: { flex: 1, padding: 16, gap: 16 },
  // 18/29 matches the flashcards body ruling (Booth 2026-07-08).
  sentence: { fontFamily: fonts.barlowRegular, fontSize: 20, lineHeight: 31, color: colors.textSecondary },
  blank: {
    fontFamily: fonts.barlowSemiBold,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell: { width: '48.8%' },
  ledRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  ledPct: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, minWidth: 44, textAlign: 'right' },
  counter: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, minWidth: 56, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: 10 },
  reportRow: { paddingBottom: 2, alignItems: 'flex-end' },
  // Swipe-to-browse area below the answer grid (Booth 2026-07-15).
  swipeZone: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  swipeHint: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 1.5, color: colors.textMuted },
});
