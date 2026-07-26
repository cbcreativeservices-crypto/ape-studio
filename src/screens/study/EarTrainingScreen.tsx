/**
 * S12-Media — Ear Training (LOCKED v1.0; visuals from 20-s12-ear-training).
 * SCREENS-ONLY for Fall: no content, not gate-relevant, non-blocking.
 *
 * Kit: audio player (48px play/pause, scrubable bar, plays-count, duration
 * mono; no auto-play/loop, pauses on background) · question panel · grids —
 * mc 2×2 tall cells (selected blue, others dimmed after answer, tap=submit+
 * advance) · multi_select 2-col + green [Confirm] · "ITEM n OF m" counter ·
 * LED (F-7 gradient retained) · manual exit only (bottom-nav re-tap ruling).
 * Empty state shows NO FALL CONTENT; __DEV__ preview loads fixture items so
 * the kit is reviewable on-device (no audio assets exist yet).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnswerCell, type AnswerCellState } from '../../components/AnswerCell';
import { AudioPlayer } from '../../components/AudioPlayer';
import { LedMeterWell } from '../../components/LedMeter';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import {
  DEV_EAR_ITEMS,
  fetchEarTrainingItems,
  type EarTrainingItem,
} from '../../features/study/mediaTypes';
import { incBrainOutput, resetBrainOutput, setRunning, usePaceSettings, useRunning } from '../../features/study/paceStore';
import { setLastStudyLocation } from '../../features/study/lastStudyLocation';
import { PaceTimerBar } from '../../features/study/PaceTimerBar';
import { PaceTimerModal } from '../../features/study/PaceTimerModal';
import { registerTrialAnswer, useTimeTrial } from '../../features/study/timeTrial';
import { StudyHeader } from './StudyHeader';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'EarTraining'>;

const HIGHLIGHT_MS = 350;

export function EarTrainingScreen({ route }: Props) {
  const { achievementId, topicName } = route.params;
  const insets = useSafeAreaInsets();

  // Remember this exact method+topic so the Enrollments "CONTINUE LEARNING"
  // banner can resume here (re-records on every focus = true last-visited).
  useFocusEffect(
    useCallback(() => {
      setLastStudyLocation({ kind: 'method', route: 'EarTraining', achievementId, topicName });
    }, [achievementId, topicName]),
  );
  const [items, setItems] = useState<EarTrainingItem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [answeredCount, setAnsweredCount] = useState(0);

  // Pace timer (practice aid — device-local settings, never blocks study).
  const { settings: pace, setEnabled, setPreset } = usePaceSettings('ear_training');
  const running = useRunning('ear_training');
  // Time trial (opt-in 15:00 challenge) — the readout switches to its HUD while live.
  const trial = useTimeTrial('ear_training');
  const [timerOpen, setTimerOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  // Baseline so RESET zeroes the readout counters without disturbing the LED.
  const answeredBaseRef = useRef(0);

  useState(() => {
    fetchEarTrainingItems(achievementId).then(setItems).catch(() => setItems([]));
  });

  // Pace clock: present while ENABLED; only ticks while also RUNNING. When
  // enabled-but-paused the clock HOLDS (elapsed kept); disabling resets to 0.
  useEffect(() => {
    if (!pace.enabled) {
      startRef.current = null;
      elapsedRef.current = 0;
      setElapsed(0);
      resetBrainOutput('ear_training'); // fresh pace session → zero the brain-output tally
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

  const handlePaceReset = useCallback(() => {
    answeredBaseRef.current = answeredCount;
    startRef.current = Date.now();
    elapsedRef.current = 0;
    setElapsed(0);
    resetBrainOutput('ear_training');
  }, [answeredCount]);

  const item = items?.[idx % Math.max(1, items.length)] ?? null;

  const advance = useCallback(() => {
    setPicked(null);
    setMultiSel(new Set());
    setAnsweredCount((n) => n + 1);
    setIdx((i) => i + 1);
  }, []);

  const answerSingle = useCallback(
    (opt: string) => {
      if (!item || picked) return;
      setPicked(opt);
      // Time trial: grade against the item's answer key (only correct advances pace).
      const isCorrect = item.correct.includes(opt);
      registerTrialAnswer('ear_training', isCorrect);
      if (isCorrect) incBrainOutput('ear_training'); // one brain output per correct answer press
      // Content pipeline TBD: progress events wire through StudySession when
      // Spring content lands (method not applicable for Fall topics).
      setTimeout(advance, HIGHLIGHT_MS);
    },
    [item, picked, advance],
  );

  const confirmMulti = useCallback(() => {
    if (!item || multiSel.size === 0) return;
    // Time trial: exact-set match against the answer key counts as correct.
    const sel = [...multiSel];
    const correct =
      sel.length === item.correct.length && sel.every((s) => item.correct.includes(s));
    registerTrialAnswer('ear_training', correct);
    if (correct) incBrainOutput('ear_training'); // one brain output per correct multi-select confirm
    setTimeout(advance, HIGHLIGHT_MS);
  }, [item, multiSel, advance]);

  /* ---- no-content state (Fall) ---- */
  if (items && items.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StudyHeader method="ear_training" title="EAR TRAINING" />
        <Text style={styles.emptyTitle}>NO FALL CONTENT</Text>
        <Text style={styles.emptyBody}>
          Ear Training launches with a future semester's media content. It is not required for any
          Fall topic.
        </Text>
        {__DEV__ && (
          <View style={{ width: 220, marginTop: 8 }}>
            <StudioButton label="Preview kit (dev)" variant="secondary" small onPress={() => setItems(DEV_EAR_ITEMS)} />
          </View>
        )}
      </View>
    );
  }
  if (!items || !item) {
    return <View style={[styles.center, { paddingTop: insets.top }]} />;
  }

  const isMulti = item.type === 'multi_select';
  const cellState = (opt: string): AnswerCellState => {
    if (isMulti) return multiSel.has(opt) ? 'selectedOrange' : 'default';
    if (!picked) return 'default';
    return opt === picked ? 'selectedBlue' : 'dimmed'; // others dim after answer (locked)
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StudyHeader
          method="ear_training"
          title="EAR TRAINING"
          onOpenTimer={() => setTimerOpen(true)}
          hideTimerButton={!!(pace.enabled || trial.active || trial.result)}
        />
        <View style={{ alignSelf: 'stretch' }}>
          <LedMeterWell filled={Math.min(21, answeredCount)} />
        </View>

        {pace.enabled || trial.active || trial.result ? (
          <PaceTimerBar
            method="ear_training"
            preset={pace.preset}
            answered={Math.max(0, answeredCount - answeredBaseRef.current)}
            total={items.length}
            elapsed={elapsed}
            enabled={pace.enabled}
            onReset={handlePaceReset}
            running={running}
            onToggleRunning={() => setRunning('ear_training', !running)}
            onRemove={() => setEnabled(false)}
            onPresetChange={setPreset}
          />
        ) : null}

        {/* Player renders only when the item actually has audio (Booth
            2026-07-08 media rule) — no empty frame otherwise. */}
        {item.audioUrl ? <AudioPlayer uri={item.audioUrl} /> : null}

        <Text style={styles.question}>{item.question}</Text>

        <View style={styles.grid}>
          {item.options.map((opt) => (
            <View key={opt} style={styles.gridCell}>
              <AnswerCell
                label={opt}
                state={cellState(opt)}
                minHeight={100}
                onPress={() =>
                  isMulti
                    ? setMultiSel((cur) => {
                        const next = new Set(cur);
                        if (next.has(opt)) next.delete(opt);
                        else next.add(opt);
                        return next;
                      })
                    : answerSingle(opt)
                }
                check={isMulti ? (multiSel.has(opt) ? 'checked' : 'unchecked') : 'none'}
                disabled={!isMulti && !!picked}
              />
            </View>
          ))}
        </View>

        {isMulti && (
          <StudioButton label="Confirm" variant="success" disabled={multiSel.size === 0} onPress={confirmMulti} />
        )}

        <Text style={styles.counter}>
          ITEM {(idx % items.length) + 1} OF {items.length}
        </Text>
      </ScrollView>

      <PaceTimerModal visible={timerOpen} onClose={() => setTimerOpen(false)} method="ear_training" topicId={achievementId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, backgroundColor: colors.screenBg, padding: 16, gap: 14, alignItems: 'center' },
  emptyTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.textMuted,
    marginTop: 40,
  },
  emptyBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSub,
    textAlign: 'center',
    maxWidth: 280,
  },
  scroll: { padding: 16, gap: 16 },
  question: {
    fontFamily: fonts.barlowMedium,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 8,
    padding: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { width: '47.8%' },
  counter: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, textAlign: 'center' },
});
