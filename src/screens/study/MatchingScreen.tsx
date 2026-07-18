/**
 * S4 — Matching (study; RE-LOCKED June 10).
 *
 * Locked behavior: 2 columns (left terms, right definitions) · tap-to-pair,
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
  matchingSentence,
  studyDisplayPct,
  type GlossaryItem,
  type ItemStates,
} from '../../features/study/api';
import { StudySession } from '../../features/study/sync';
import { saveLocalMethodStates } from '../../features/study/localProgress';
import { StudyHeader } from './StudyHeader';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'Matching'>;

const PAIRS_PER_BOARD = 4;
const CORRECT_FLASH_MS = 550; // green flash on a right pair before it locks
const ADVANCE_MS = 750; // board-complete pause (lets the last green flash show)
const WRONG_FLASH_MS = 650; // red flash on a wrong pair

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [fetched, methodState] = await Promise.all([
          fetchTopicItems(achievementId),
          fetchMethodState(achievementId, 'matching'),
        ]);
        if (!alive) return;
        // Items needing attempts first, then done items (practice), stable within session.
        const st: ItemStates = methodState?.itemStates ?? {};
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
  // Right column: shuffled; each definition shows exactly ONE sentence per
  // board visit, and that sentence never contains its own term/abbreviation
  // (Booth 2026-07-16 — a leaked term made pairs trivially solvable).
  const rightOrder = useMemo(
    () => (board ? shuffle(board).map((it) => ({ it, text: matchingSentence(it.term, it.definition) })) : []),
    [board],
  );

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
        setCorrectFlash(answeredId); // green flash, then it settles to locked/dimmed
        setTimeout(() => setCorrectFlash((c) => (c === answeredId ? null : c)), CORRECT_FLASH_MS);
        if (next.size === board.length) {
          setTimeout(() => goBoardRef.current(1), ADVANCE_MS);
        }
      } else {
        setWrongPair({ left: selectedLeft, right: rightId });
        setTimeout(() => {
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
  if (!items || !board) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const displayPct = studyDisplayPct(states, items.length, 'matching');

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
      <View style={styles.column}>
        {board.map((it) => (
          <AnswerCell
            key={it.id}
            label={it.term}
            state={leftState(it.id)}
            fontSize={18}
            borderWidth={1.5}
            minHeight={52}
            onPress={() => pickLeft(it.id)}
          />
        ))}
      </View>
      {/* No line cap on the cells (Booth 2026-07-16) — long sentences were
          cropping; each cell grows past minHeight to fit its full text. */}
      <View style={styles.column}>
        {rightOrder.map(({ it, text }) => (
          <AnswerCell
            key={it.id}
            label={text}
            state={rightState(it.id)}
            fontSize={17}
            borderWidth={1.5}
            minHeight={52}
            onPress={() => pickRight(it.id)}
          />
        ))}
      </View>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <StudyHeader method="matching" title="MATCHING · PAIR EACH" subtitle={`Topic · ${topicName}`} />
        <View style={styles.ledRow}>
          <View style={{ flex: 1 }}>
            <LedMeterWell filled={segmentsForPct(displayPct)} />
          </View>
          <Text style={styles.ledPct}>{Math.round(displayPct)}%</Text>
          <Text style={styles.counter}>
            {boardIdx + 1} / {boards.length}
          </Text>
          <FsButton onPress={() => setFullscreen(true)} />
        </View>

        {/* Column delineation (Booth 2026-07-08, rev 2): NO text — two subtle
            tinted bars over the columns mark the two sides to be matched. */}
        {sideBars}

        <View style={styles.columns}>{columnsBody}</View>

      </ScrollView>

      {/* Swipe strip (Booth 2026-07-15): the space below the cards scrolls
          between boards on a left/right swipe — an alternative to Prev/Next.
          A swipe-bypass never counts toward the study timer/gate. */}
      <View {...pan.panHandlers} style={styles.swipeStrip}>
        <Text style={styles.swipeHint}>‹ swipe to browse questions ›</Text>
      </View>

      {/* Pinned footer (Booth 2026-07-08): scribble-glass Prev/Next, always
          at the bottom just above the bottom nav — never scrolls away. */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <GlassButton label="‹ PREV" tint="steel" onPress={() => goBoard(-1)} />
        </View>
        <View style={{ flex: 1 }}>
          <GlassButton label="NEXT ›" tint="gold" onPress={() => goBoard(1)} />
        </View>
      </View>

      {/* Full-screen mode — the board only; shake = previous board. Swipe ‹ ›
          works across the WHOLE full screen (user feedback 2026-07-17) — same
          silent bypass as the swipe strip. */}
      <StudyFsOverlay
        visible={fullscreen}
        onClose={() => setFullscreen(false)}
        onShakePrev={() => goBoard(-1)}
        onSwipePrev={() => goBoard(-1, { silent: true })}
        onSwipeNext={() => goBoard(1, { silent: true })}
        guideKey="ape:matchFsGuide"
      >
        {sideBars}
        <View style={styles.columns}>{columnsBody}</View>
      </StudyFsOverlay>
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
  sideBarLeft: { backgroundColor: 'rgba(255,198,77,0.28)' }, // terms side — faint amber
  sideBarRight: { backgroundColor: 'rgba(91,176,255,0.28)' }, // definitions side — faint blue
  // A little breathing room between the delineation bars / prompt above and
  // the answer cell columns below (user request 2026-07-17).
  columns: { flexDirection: 'row', gap: 12, marginTop: 10 },
  column: { flex: 1, gap: 10 },
  counter: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, minWidth: 56, textAlign: 'right' },
  ledRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  ledPct: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, minWidth: 44, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 },
  // Swipe-to-browse strip below the cards (Booth 2026-07-15).
  swipeStrip: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1c1c1e',
    backgroundColor: '#0e0e10',
  },
  swipeHint: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 1.5, color: colors.textMuted },
});
