/**
 * S13 — Scenarios (LOCKED v1.1; single-pass; visuals from 21-s13-scenarios).
 * SCREENS-ONLY for Fall: no content, not gate-relevant, non-blocking.
 *
 * Kit: prompt panel · optional media (audio = S12 player / image 80% 4:3 /
 * none = reflow up) · types — mc (tap=submit+advance) · multi_select
 * (+Confirm) · matching-as-SEQUENCING (tap steps in order + Confirm) ·
 * wrong answer: inline explanation banner 3s, tap to skip, then auto-advance,
 * NO retry (locked) · LED +1 per item answered (progress, not score) ·
 * "ITEM n OF m · SINGLE PASS" · after all items → first-pass summary
 * (S7 Results handoff is content-dependent — wired when content ships).
 */
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnswerCell, type AnswerCellState } from '../../components/AnswerCell';
import { AudioPlayer } from '../../components/AudioPlayer';
import { LedMeterWell } from '../../components/LedMeter';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import {
  DEV_SCENARIO_ITEMS,
  fetchScenarioItems,
  type ScenarioItem,
} from '../../features/study/mediaTypes';
import { StudyHeader } from './StudyHeader';
import type { StudyStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StudyStackParamList, 'Scenarios'>;

const EXPLANATION_MS = 3000;

type Feedback = { correct: boolean; text: string };

export function ScenariosScreen({ route }: Props) {
  const { achievementId } = route.params;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [items, setItems] = useState<ScenarioItem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [sequence, setSequence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useState(() => {
    fetchScenarioItems(achievementId).then(setItems).catch(() => setItems([]));
  });

  const item = items && !finished ? items[idx] : null;

  const advance = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setFeedback(null);
    setPicked(null);
    setMultiSel(new Set());
    setSequence([]);
    if (items && idx + 1 >= items.length) setFinished(true);
    else setIdx((i) => i + 1);
  }, [items, idx]);

  const judge = useCallback(
    (correct: boolean) => {
      if (!item) return;
      if (!correct) setWrongIds((w) => [...w, item.id]);
      setFeedback({
        correct,
        text: correct ? item.explanation : item.explanation, // same copy; banner color differs
      });
      advanceTimer.current = setTimeout(advance, EXPLANATION_MS);
      // Progress events wire through StudySession when Spring content lands.
    },
    [item, advance],
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

  /* ---- no-content state (Fall) ---- */
  if (items && items.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StudyHeader method="scenarios" title="SCENARIO" />
        <Text style={styles.emptyTitle}>NO FALL CONTENT</Text>
        <Text style={styles.emptyBody}>
          Scenarios launch with a future semester's content. They are not required for any Fall
          topic.
        </Text>
        {__DEV__ && (
          <View style={{ width: 220, marginTop: 8 }}>
            <StudioButton label="Preview kit (dev)" variant="secondary" small onPress={() => setItems(DEV_SCENARIO_ITEMS)} />
          </View>
        )}
      </View>
    );
  }
  if (!items) return <View style={[styles.center, { paddingTop: insets.top }]} />;

  /* ---- single-pass complete ---- */
  if (finished) {
    const score = items.length - wrongIds.length;
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <StudyHeader method="scenarios" title="SCENARIO" />
        <Text style={styles.emptyTitle}>SINGLE PASS COMPLETE</Text>
        <Text style={styles.emptyBody}>
          First-pass score: {score} / {items.length}. Full S7 Results handoff wires when scenario
          content ships.
        </Text>
        <View style={{ width: 220, marginTop: 8 }}>
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
          {/* LED = +1 per item ANSWERED (progress, not score) — locked */}
          <LedMeterWell filled={Math.round((idx / Math.max(1, items.length)) * 21)} />
        </View>

        {item.media?.kind === 'audio' && <AudioPlayer uri={item.media.url} />}
        {item.media?.kind === 'image' && (
          <Image source={{ uri: item.media.url }} style={styles.mediaImage} resizeMode="contain" />
        )}
        {/* media: none → content reflows up (locked) */}

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
          ITEM {idx + 1} OF {items.length} · SINGLE PASS
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  center: { flex: 1, backgroundColor: colors.screenBg, padding: 16, gap: 14, alignItems: 'center' },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 2, color: colors.textMuted, marginTop: 40 },
  emptyBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSub,
    textAlign: 'center',
    maxWidth: 280,
  },
  scroll: { padding: 16, gap: 16 },
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
});
