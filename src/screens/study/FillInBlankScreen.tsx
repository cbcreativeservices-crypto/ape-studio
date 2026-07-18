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
  randomSentence,
  studyDisplayPct,
  type GlossaryItem,
  type ItemStates,
} from '../../features/study/api';
import { StudySession } from '../../features/study/sync';
import { saveLocalMethodStates } from '../../features/study/localProgress';
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

/** Blank the term out of a sentence (all occurrences, case-insensitive). */
function blankOut(term: string, sentence: string): { pre: string[] } {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, 'gi');
  if (re.test(sentence)) {
    return { pre: sentence.split(re) };
  }
  return { pre: [sentence] };
}

export function FillInBlankScreen({ navigation, route }: Props) {
  const { achievementId, topicName } = route.params;
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<GlossaryItem[] | null>(null);
  const [states, setStates] = useState<ItemStates>({});
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const session = useRef<StudySession | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [fetched, methodState] = await Promise.all([
          fetchTopicItems(achievementId),
          fetchMethodState(achievementId, 'fill_in_blank'),
        ]);
        if (!alive) return;
        setItems(shuffle(fetched));
        setStates(methodState?.itemStates ?? {});
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
    const distractors = shuffle(order.filter((o) => o.id !== item.id).map((o) => o.term)).slice(0, 3);
    // One randomly-chosen sentence per showing (Booth 2026-07-08) — the same
    // term can present a different facet of its definition each time.
    return { item, sentence: randomSentence(item.definition), options: shuffle([item.term, ...distractors]) };
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
      if (!question || picked) return;
      const correct = opt === question.item.term;
      setPicked(opt);
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
      setTimeout(() => {
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
  if (!items || !question) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const displayPct = studyDisplayPct(states, items.length, 'fill_in_blank');
  const { pre } = blankOut(question.item.term, question.sentence);
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
        <StudyHeader method="fill_in_blank" title="FILL IN THE BLANK" subtitle={`Topic · ${topicName}`} />
        {/* LED + compact item count (Booth 2026-07-08: count lives up here,
            never floating over the answer grid). */}
        <View style={styles.ledRow}>
          <View style={{ flex: 1 }}>
            <LedMeterWell filled={segmentsForPct(displayPct)} />
          </View>
          <Text style={styles.ledPct}>{Math.round(displayPct)}%</Text>
          <Text style={styles.counter}>
            {itemNumber + 1} / {order.length}
          </Text>
          <FsButton onPress={() => setFullscreen(true)} />
        </View>

        {questionBody}

        {/* Swipe strip (Booth 2026-07-15): the space below the answer grid
            scrolls between questions on a left/right swipe — an alternative to
            Prev/Next. A swipe-bypass never counts toward the study timer/gate. */}
        <View style={styles.swipeZone} {...pan.panHandlers}>
          <Text style={styles.swipeHint}>‹ swipe to browse questions ›</Text>
        </View>

        {/* Pinned footer (Booth 2026-07-08): scribble-glass Prev/Next at the
            bottom, same as Matching — swipe ‹ › still works too. */}
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <GlassButton label="‹ PREV" tint="steel" onPress={() => goTo(-1)} disabled={!!picked} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton label="NEXT ›" tint="gold" onPress={() => goTo(1)} disabled={!!picked} />
          </View>
        </View>
      </View>

      {/* Full-screen mode — same question, minimal chrome; shake = previous.
          Swipe ‹ › works across the WHOLE full screen (user feedback
          2026-07-17) — same silent bypass as the swipe strip, held while a
          picked answer's feedback is showing. */}
      <StudyFsOverlay
        visible={fullscreen}
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
  // Swipe-to-browse area below the answer grid (Booth 2026-07-15).
  swipeZone: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  swipeHint: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 1.5, color: colors.textMuted },
});
