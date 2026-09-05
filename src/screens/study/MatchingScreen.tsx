/**
 * S4 — Matching (study; RE-LOCKED June 10).
 *
 * Locked behavior: 2 columns (left definitions (read), right terms (shuffled
 * options)) · tap-to-pair,
 * 1.5px borders, visual feedback · [Prev]/[Next] + swipe L/R · auto-advance
 * 300ms after the board's last confirmed pair · media top · LED (server pct) ·
 * 100% → manual back only · bottom nav visible.
 *
 * Boards chunk the topic's items into sets of up to 4 pairs; right column
 * independently shuffled. Correct pair → both cells lock (dimmed) +
 * answer{correct:true}; wrong pick → red flash on both + answer{correct:false}.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
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
import { matchingSentenceV2 } from '../../features/study/sentences';
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

type Props = NativeStackScreenProps<StudyStackParamList, 'Matching'>;

const PAIRS_PER_BOARD = 4;
const CORRECT_FLASH_MS = 550; // green flash on a right pair before it locks
const ADVANCE_MS = 750; // board-complete pause (lets the last green flash show)
const WRONG_FLASH_MS = 650; // red flash on a wrong pair

// Matched-pair collapse is now handled per-cell by Reanimated (Fabric-native):
// each cell's `exiting` fades it out and sibling `layout` slides the rest up when
// it's removed — replacing the old global LayoutAnimation.configureNext (owner
// debug audit 2026-08-21). Durations kept close to the prior feel.
const COLLAPSE_MS = 320;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchingScreen({ navigation, route }: Props) {
  const { achievementId, topicName } = route.params;

  // Remember this exact method+topic so the Enrollments "CONTINUE LEARNING"
  // banner can resume here (re-records on every focus = true last-visited).
  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'method', route: 'Matching', achievementId, topicName });
    }, [achievementId, topicName]),
  );
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<GlossaryItem[] | null>(null);
  const [states, setStates] = useState<ItemStates>({});
  const [error, setError] = useState<string | null>(null);
  const [boardIdx, setBoardIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set()); // item ids paired on this board
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [correctFlash, setCorrectFlash] = useState<string | null>(null); // item id flashing green
  const session = useRef<StudySession | null>(null);
  // Flash/advance timers — tracked + cleared on unmount. Critical here because
  // one of them fires LayoutAnimation.configureNext, which is GLOBAL: firing it
  // after this screen unmounts would animate the NEXT screen's first layout
  // commit on Fabric. `mounted` gates the deferred work. Owner debug audit.
  const mounted = useRef(true);
  const flashTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      flashTimers.current.forEach((t) => clearTimeout(t));
      flashTimers.current.clear();
    };
  }, []);
  const scheduleFlash = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      flashTimers.current.delete(t);
      if (mounted.current) fn();
    }, ms);
    flashTimers.current.add(t);
  };

  // Pace timer (practice aid — device-local settings, never blocks study).
  const { settings: pace, setEnabled, setPreset } = usePaceSettings('matching');
  const running = useRunning('matching');
  // Time trial (opt-in 15:00 challenge) — the readout switches to its HUD while live.
  const trial = useTimeTrial('matching');
  const [timerOpen, setTimerOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const recordedRef = useRef(false);
  // Baseline of the pace window: the answered count when the timer was enabled,
  // so the readout's session counter zeroes without touching earned progress.
  const answeredBaseRef = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [fetched, methodState, localStates] = await Promise.all([
          fetchTopicItems(achievementId),
          fetchMethodState(achievementId, 'matching'),
          // Device-mirror resume merge — SIGNED-IN only (flashcards ruling
          // 2026-08-17; ported QA night 2026-08-31).
          supabase.auth
            .getSession()
            .then(({ data }) => (data.session ? loadLocalMethodStates(achievementId, 'matching') : null))
            .catch(() => null),
        ]);
        if (!alive) return;
        // Items needing attempts first, then done items (practice), stable within session.
        const st: ItemStates = mergeItemStates(methodState?.itemStates, localStates);
        const notDone = shuffle(fetched.filter((it) => (st[it.id]?.attempts ?? 0) < 2));
        const done = shuffle(fetched.filter((it) => (st[it.id]?.attempts ?? 0) >= 2));
        setItems([...notDone, ...done]);
        setStates(st);
      } catch {
        if (alive) setError('Could not load this topic. Check your connection.');
      }
    })();
    const s = new StudySession(achievementId, 'matching', () => {});
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
    if (Object.keys(states).length) void saveLocalMethodStates(achievementId, 'matching', states);
  }, [states, achievementId]);

  // Fresh visit = fresh pace session: the clock (startRef/elapsedRef) is
  // per-instance and starts at 0 on mount, but the brain-output tally and the
  // running flag live in the module-level store and would otherwise carry over
  // from the previous visit (stale AHEAD/BEHIND offset at 0:00, or a paused
  // readout). Zero the tally and start running so the readout is consistent (B-138).
  useEffect(() => {
    resetBrainOutput('matching');
    setRunning('matching', true);
  }, []);

  // Pace clock: present while ENABLED; only ticks while also RUNNING. When
  // enabled-but-paused the clock HOLDS (elapsed kept); disabling resets to 0.
  useEffect(() => {
    if (!pace.enabled) {
      startRef.current = null;
      elapsedRef.current = 0;
      recordedRef.current = false;
      setElapsed(0);
      resetBrainOutput('matching'); // fresh pace session → zero the brain-output tally
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

  // answered = distinct items with at least one attempt (a confirmed pair).
  const answered = useMemo(
    () => Object.values(states).filter((s) => (s.attempts ?? 0) > 0).length,
    [states],
  );
  const answeredRef = useRef(answered);
  answeredRef.current = answered;

  // ENABLING the timer opens a fresh pace window: pairs and brain outputs made
  // before the clock started must not count, or a freshly added timer reads
  // 5/5 at 0:01 and the stopwatch logs a 0 s best (B-083). Re-baselined once
  // the topic loads too, since a persisted ON timer can hydrate before the
  // server progress arrives.
  useEffect(() => {
    if (!pace.enabled) return;
    answeredBaseRef.current = answeredRef.current;
    startRef.current = Date.now();
    elapsedRef.current = 0;
    recordedRef.current = false;
    setElapsed(0);
    resetBrainOutput('matching');
  }, [pace.enabled, items]);

  // STOPWATCH: on pairing every item WITHIN the timed window, log the run once
  // (encouraging records). Trivially short runs are skipped, as in AUTO TRACK.
  useEffect(() => {
    if (!pace.enabled || pace.preset !== 'stopwatch' || recordedRef.current) return;
    if (!items || items.length === 0 || startRef.current == null) return;
    if (answered - answeredBaseRef.current < items.length) return;
    const secs = (Date.now() - startRef.current) / 1000;
    if (secs < 2) return;
    recordedRef.current = true;
    void recordPaceSession('matching', secs, items.length);
  }, [pace.enabled, pace.preset, answered, items]);

  const boards = useMemo(() => {
    if (!items) return [];
    const out: GlossaryItem[][] = [];
    for (let i = 0; i < items.length; i += PAIRS_PER_BOARD) {
      out.push(items.slice(i, i + PAIRS_PER_BOARD));
    }
    // A trailing 1-pair board is trivial; fold it into the previous board.
    if (out.length > 1 && out[out.length - 1].length === 1) {
      const last = out.pop()!;
      out[out.length - 1] = [...out[out.length - 1], ...last];
    }
    return out;
  }, [items]);

  const board = boards[boardIdx] ?? null;
  // Left column (read): each definition shows exactly ONE sentence per board
  // visit, and that sentence never contains its own term/abbreviation (Booth
  // 2026-07-16 — a leaked term made pairs trivially solvable).
  const leftPrompts = useMemo(
    // Tiered clue (text audit 2026-09-05): never the term or a word variant of
    // it; fewest partial words of a multi-word answer; fewest OTHER topic
    // terms named in the clue (a wrong pair's answer in the clue misleads).
    () => (board ? board.map((it) => ({ it, text: matchingSentenceV2(it.term, it.definition, board.map((x) => x.term)) })) : []),
    [board],
  );
  // Right column: shuffled term options — the answer for each left definition.
  const rightOrder = useMemo(() => (board ? shuffle(board) : []), [board]);

  const goBoard = useCallback(
    // silent = a SWIPE-BYPASS: no touch(), so skipped boards never keep the
    // engagement timer alive and never count toward the study gate (Booth
    // 2026-07-15). Prev/Next + shake stay "real" interactions (touch()).
    (dir: 1 | -1, opts?: { silent?: boolean }) => {
      if (boards.length === 0) return;
      if (!opts?.silent) session.current?.touch();
      setBoardIdx((i) => (i + dir + boards.length) % boards.length);
      setSelectedLeft(null);
      setLocked(new Set());
      setWrongPair(null);
    },
    [boards.length],
  );

  const goBoardRef = useRef(goBoard);
  goBoardRef.current = goBoard;

  // Swipe strip below the cards (Booth 2026-07-15): swiping there scrolls
  // between boards WITHOUT counting as study time — a pure bypass.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -50) goBoardRef.current(1, { silent: true });
        else if (g.dx >= 50) goBoardRef.current(-1, { silent: true });
      },
    }),
  ).current;

  const pickLeft = useCallback(
    (id: string) => {
      if (locked.has(id) || wrongPair) return;
      session.current?.touch();
      setSelectedLeft((cur) => (cur === id ? null : id));
    },
    [locked, wrongPair],
  );

  const pickRight = useCallback(
    (rightId: string) => {
      if (!board || !selectedLeft || locked.has(rightId) || wrongPair) return;
      const correct = rightId === selectedLeft;
      registerTrialAnswer('matching', correct); // time trial: only correct advances pace
      if (correct) incBrainOutput('matching'); // one brain output per correct PAIR match (not per board)
      session.current?.addEvent({ item: selectedLeft, kind: 'answer', correct });
      const answeredId = selectedLeft;
      setStates((prev) => ({
        ...prev,
        [answeredId]: {
          ...prev[answeredId],
          attempts: (prev[answeredId]?.attempts ?? 0) + 1,
          correct: (prev[answeredId]?.correct ?? 0) + (correct ? 1 : 0),
        },
      }));

      if (correct) {
        const next = new Set(locked).add(selectedLeft);
        setLocked(next);
        setSelectedLeft(null);
        setCorrectFlash(answeredId); // green flash, then the pair animates out
        scheduleFlash(() => {
          // Clearing correctFlash unmounts the matched cells → each cell's
          // Reanimated `exiting` fades it out and sibling `layout` slides the
          // rest up (no global LayoutAnimation).
          setCorrectFlash((c) => (c === answeredId ? null : c));
        }, CORRECT_FLASH_MS);
        if (next.size === board.length) {
          scheduleFlash(() => goBoardRef.current(1), ADVANCE_MS);
        }
      } else {
        setWrongPair({ left: selectedLeft, right: rightId });
        scheduleFlash(() => {
          setWrongPair(null);
          setSelectedLeft(null);
        }, WRONG_FLASH_MS);
      }
    },
    [board, selectedLeft, locked, wrongPair],
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
  // Loaded but the topic has no items — show an exit instead of spinning forever
  // (StudyStack has no header/back gesture; the spinner below would trap the
  // user with only the tab bar to escape). Owner launch-triage E6.
  if (items && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>This topic has no matching items yet.</Text>
        <View style={{ width: 180 }}>
          <StudioButton label="Back" variant="secondary" small onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }
  if (!items || !board) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const displayPct = studyDisplayPct(states, items.length, 'matching');
  // Readout shows 0–99 until the RAW value is 100 (same rule as the Dashboard
  // row): Math.round alone read "100%" with an item still unstudied (B-086).
  const displayPctLabel = displayPct >= 100 ? 100 : Math.min(Math.round(displayPct), 99);

  const leftState = (id: string): AnswerCellState => {
    if (correctFlash === id) return 'correctGreen';
    if (wrongPair?.left === id) return 'wrongRed';
    if (locked.has(id)) return 'dimmed';
    if (selectedLeft === id) return 'selectedBlue';
    return 'default';
  };
  const rightState = (id: string): AnswerCellState => {
    if (correctFlash === id) return 'correctGreen';
    if (wrongPair?.right === id) return 'wrongRed';
    if (locked.has(id)) return 'dimmed';
    return 'default';
  };

  const sideBars = (
    <View style={styles.sideBars}>
      <View style={[styles.sideBar, styles.sideBarLeft]} />
      <View style={[styles.sideBar, styles.sideBarRight]} />
    </View>
  );
  const columnsBody = (
    <>
      {/* No line cap on the cells (Booth 2026-07-16) — long sentences were
          cropping; each cell grows past minHeight to fit its full text. */}
      {/* A matched pair shows its green flash, then is REMOVED from both columns
          (user request 2026-07-25): keep it while it's flashing, drop it once
          settled so the remaining cards collapse UP and stay pinned to the top. */}
      <View style={styles.column}>
        {leftPrompts
          .filter(({ it }) => !locked.has(it.id) || correctFlash === it.id)
          .map(({ it, text }) => (
            <Animated.View key={it.id} layout={LinearTransition.duration(COLLAPSE_MS)} exiting={FadeOut.duration(COLLAPSE_MS)}>
              <AnswerCell
                label={text}
                state={leftState(it.id)}
                fontSize={17}
                borderWidth={1.5}
                minHeight={52}
                onPress={() => pickLeft(it.id)}
              />
            </Animated.View>
          ))}
      </View>
      <View style={styles.column}>
        {rightOrder
          .filter((it) => !locked.has(it.id) || correctFlash === it.id)
          .map((it) => (
            <Animated.View key={it.id} layout={LinearTransition.duration(COLLAPSE_MS)} exiting={FadeOut.duration(COLLAPSE_MS)}>
              <AnswerCell
                label={it.term}
                state={rightState(it.id)}
                fontSize={18}
                borderWidth={1.5}
                minHeight={52}
                onPress={() => pickRight(it.id)}
              />
            </Animated.View>
          ))}
      </View>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <StudyHeader
          method="matching"
          title="MATCHING · PAIR EACH"
          subtitle={`Topic · ${topicName}`}
          onOpenTimer={() => setTimerOpen(true)}
          hideTimerButton={!!(pace.enabled || trial.active || trial.result)}
        />
        <View style={styles.ledRow}>
          <View style={{ flex: 1 }}>
            <LedMeterWell filled={segmentsForPct(displayPct)} />
          </View>
          <Text style={styles.ledPct}>{displayPctLabel}%</Text>
          <Text style={styles.counter}>
            {boardIdx + 1} / {boards.length}
          </Text>
          <FsButton onPress={() => setFullscreen(true)} />
        </View>

        {pace.enabled || trial.active || trial.result ? (
          <PaceTimerBar
            method="matching"
            preset={pace.preset}
            answered={Math.max(0, answered - answeredBaseRef.current)}
            total={items.length}
            elapsed={elapsed}
            enabled={pace.enabled}
            onOpenSettings={() => setTimerOpen(true)}
            running={running}
            onToggleRunning={() => setRunning('matching', !running)}
            onRemove={() => setEnabled(false)}
            onPresetChange={setPreset}
          />
        ) : null}

        {/* Column delineation (Booth 2026-07-08, rev 2): NO text — two subtle
            tinted bars over the columns mark the two sides to be matched. */}
        {sideBars}

        {/* Left/right swipe on the BOARD itself browses between boards (owner
            2026-08-13) — the old thin hint strip was easy to miss and read as
            broken. Horizontal-dominant gesture only, so vertical scroll + cell
            taps are untouched. A swipe never counts toward the study gate. */}
        <View style={styles.columns} {...pan.panHandlers}>{columnsBody}</View>

      </ScrollView>

      {/* Suggest a correction — bottom-right of the answers area, above Prev/Next
          (owner 2026-08-13). */}
      <View style={styles.reportRow}>
        <SuggestCorrectionButton
          tag={topicName}
          context={{
            Method: 'Matching',
            Topic: topicName,
            'Topic ID': achievementId,
            Board: `${boardIdx + 1} of ${boards.length}`,
            Terms: board.map((it) => it.term).join(', '),
          }}
        />
      </View>

      {/* Pinned footer (Booth 2026-07-08): scribble-glass Prev/Next, always
          at the bottom just above the bottom nav — never scrolls away. */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <GlassButton label="‹ PREV" tint="gold" onPress={() => goBoard(-1)} />
        </View>
        <View style={{ flex: 1 }}>
          <GlassButton label="NEXT ›" tint="green" onPress={() => goBoard(1)} />
        </View>
      </View>

      {/* Full-screen mode — the board only; shake = previous board. Swipe ‹ ›
          works across the WHOLE full screen (user feedback 2026-07-17) — same
          silent bypass as the swipe strip. */}
      <StudyFsOverlay
        visible={fullscreen}
        topSlot={
          pace.enabled || trial.active || trial.result ? (
            <PaceTimerBar
              method="matching"
              preset={pace.preset}
              answered={Math.max(0, answered - answeredBaseRef.current)}
              total={items.length}
              elapsed={elapsed}
              variant="fullscreen"
            />
          ) : null
        }
        onClose={() => setFullscreen(false)}
        onShakePrev={() => goBoard(-1)}
        onSwipePrev={() => goBoard(-1, { silent: true })}
        onSwipeNext={() => goBoard(1, { silent: true })}
        guideKey="ape:matchFsGuide"
      >
        {sideBars}
        <View style={styles.columns}>{columnsBody}</View>
      </StudyFsOverlay>

      <PaceTimerModal visible={timerOpen} onClose={() => setTimerOpen(false)} method="matching" topicId={achievementId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
  scroll: { padding: 16, gap: 16 },
  sideBars: { flexDirection: 'row', gap: 12, marginBottom: -8 },
  sideBar: { flex: 1, height: 3, borderRadius: 2 },
  sideBarLeft: { backgroundColor: 'rgba(255,198,77,0.28)' }, // definitions side — faint amber
  sideBarRight: { backgroundColor: 'rgba(91,176,255,0.28)' }, // terms side — faint blue
  // A little breathing room between the delineation bars / prompt above and
  // the answer cell columns below (user request 2026-07-17).
  columns: { flexDirection: 'row', gap: 12, marginTop: 10 },
  column: { flex: 1, gap: 10 },
  counter: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, minWidth: 56, textAlign: 'right' },
  ledRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  ledPct: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, minWidth: 44, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },
  // Suggest-a-correction row — right-aligned, just above the Prev/Next footer.
  reportRow: { paddingHorizontal: 16, paddingBottom: 2, alignItems: 'flex-end' },
});
