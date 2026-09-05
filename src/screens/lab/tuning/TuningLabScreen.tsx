/**
 * TuningLabScreen — the paced chapter shell (spec Stage 1 §5–6): chapter
 * title/number/count, progress, Back/Continue, Basic View / See the Math,
 * sound status + Stop, a chapter list for review. One TuningPlayer for the
 * whole lab, disposed on unmount; switching Basic/Math never remounts the
 * chapter (the chapter component is the same element, only ctx changes).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { animationsAllowed } from '../../../features/settings/a11y';
import { C4_ET } from '../../../features/tuning/tuningMath';
import { TuningPlayer, type PlayerStatus } from '../../../features/tuning/tuningAudio';
import { loadTuningProgress, resetTuningProgress, saveTuningProgress, type TuningProgress } from '../../../features/tuning/tuningProgress';
import { CHAPTERS, CHAPTER_COUNT, CHAPTER_TITLES } from './chapters';
import type { LabCtx } from './labCtx';

export function TuningLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { requestAudioOutput } = useAudioOutputGate();
  const player = useMemo(() => new TuningPlayer(requestAudioOutput), [requestAudioOutput]);
  const [status, setStatus] = useState<PlayerStatus>({ playing: false, label: null });
  const [progress, setProgress] = useState<TuningProgress | null>(null);
  const [chapter, setChapter] = useState(0);
  const [rootHz, setRootHz] = useState(C4_ET);
  const [mathView, setMathView] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const reduceMotion = !animationsAllowed();

  useEffect(() => {
    const unsub = player.subscribe(setStatus);
    let alive = true;
    void loadTuningProgress().then((p) => {
      if (!alive) return;
      setProgress(p);
      setMathView(p.mathView);
      const built = CHAPTERS.map((c) => c.index);
      setChapter(built.includes(p.lastChapter) ? p.lastChapter : 0);
    });
    return () => {
      alive = false;
      unsub();
      player.dispose(); // stops and releases every voice when the lab unmounts
    };
  }, [player]);

  const persist = useCallback((next: TuningProgress) => {
    setProgress(next);
    void saveTuningProgress(next);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      player.stop(); // leaving a chapter stops its audio
      setChapter(idx);
      setListOpen(false);
      scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
      if (progress) persist({ ...progress, lastChapter: idx });
    },
    [player, progress, persist, reduceMotion],
  );

  const markDone = useCallback(() => {
    if (!progress) return;
    const completed = progress.completed.includes(chapter) ? progress.completed : [...progress.completed, chapter].sort((a, b) => a - b);
    const done = completed.length >= CHAPTER_COUNT;
    persist({ ...progress, completed, done });
  }, [progress, chapter, persist]);

  const toggleMath = () => {
    const next = !mathView;
    setMathView(next);
    if (progress) persist({ ...progress, mathView: next });
  };

  const confirmReset = () =>
    Alert.alert('Reset this lab?', 'Clears your chapter progress for the Tuning & Temperament Lab only.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void resetTuningProgress().then(() => { setProgress({ completed: [], lastChapter: 0, done: false, mathView }); setChapter(0); }) },
    ]);

  const def = CHAPTERS.find((c) => c.index === chapter) ?? CHAPTERS[0];
  const isDone = !!progress?.completed.includes(chapter);
  const builtNext = CHAPTERS.find((c) => c.index > chapter);
  const builtPrev = [...CHAPTERS].reverse().find((c) => c.index < chapter);

  const ctx: LabCtx = { rootHz, setRootHz, mathView, reduceMotion, player, markDone, isDone };
  const Chapter = def.Component;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Leave the lab">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>TUNING & TEMPERAMENT LAB · CHAPTER {chapter + 1} OF {CHAPTER_COUNT}</Text>
          <Text style={styles.title} numberOfLines={2}>{def.title}</Text>
        </View>
        {/* Two-segment toggle: both states are visible, so the learner can see
            what tapping will do (the old single label only named the current state). */}
        <Pressable onPress={toggleMath} style={styles.mathBtn} accessibilityRole="switch" accessibilityState={{ checked: mathView }} accessibilityLabel="See the math" accessibilityHint="Shows or hides the derivations under each display">
          <View style={[styles.seg, !mathView && styles.segOn]}><Text style={[styles.mathBtnText, !mathView && styles.segOnText]}>BASIC</Text></View>
          <View style={[styles.seg, mathView && styles.segOnMath]}><Text style={[styles.mathBtnText, mathView && { color: colors.cyanBright }]}>MATH</Text></View>
        </Pressable>
      </View>

      {/* progress dots */}
      <Pressable onPress={() => setListOpen(!listOpen)} style={styles.dots} accessibilityRole="button" accessibilityState={{ expanded: listOpen }} accessibilityLabel={`Chapter list. ${progress?.completed.length ?? 0} of ${CHAPTER_COUNT} complete`}>
        {CHAPTER_TITLES.map((_, i) => (
          <View key={i} style={[styles.dot, progress?.completed.includes(i) && styles.dotDone, i === chapter && styles.dotNow]} />
        ))}
        <Text style={styles.dotsText}>{progress?.completed.length ?? 0}/{CHAPTER_COUNT} done {listOpen ? '▴' : '▾'}</Text>
      </Pressable>
      {listOpen ? (
        <View style={styles.list}>
          {CHAPTER_TITLES.map((t, i) => {
            const built = CHAPTERS.some((c) => c.index === i);
            return (
              <Pressable key={i} disabled={!built} onPress={() => goTo(i)} style={styles.listRow} accessibilityRole="button" accessibilityLabel={`Chapter ${i}, ${t}${progress?.completed.includes(i) ? ', complete' : ''}${built ? '' : ', not available'}`}>
                <Text style={[styles.listText, !built && { color: colors.textMutedDeep }, i === chapter && { color: colors.cyanBright }]}>
                  {progress?.completed.includes(i) ? '✓' : '○'} {i}. {t}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={confirmReset} style={styles.listRow} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
            <Text style={[styles.listText, { color: colors.textMuted }]}>RESET LAB PROGRESS</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {def.objective ? (
          <View style={styles.objective} accessible accessibilityLabel={`In this chapter: ${def.objective}`}>
            <Text style={styles.objectiveKicker}>IN THIS CHAPTER</Text>
            <Text style={styles.objectiveText}>{def.objective}</Text>
          </View>
        ) : null}
        <Chapter ctx={ctx} />
      </ScrollView>

      {/* sound status + navigation */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.sound} accessibilityLiveRegion="polite">{status.playing ? `♪ ${status.label}` : 'Sound: stopped'}</Text>
        <Pressable onPress={() => player.stop()} style={styles.stopBtn} accessibilityRole="button" accessibilityLabel="Stop all audio">
          <Text style={styles.stopText}>■ STOP</Text>
        </Pressable>
        <Pressable onPress={() => builtPrev && goTo(builtPrev.index)} disabled={!builtPrev} style={[styles.navBtn, !builtPrev && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="Back one chapter">
          <Text style={styles.navText}>‹ BACK</Text>
        </Pressable>
        <Pressable
          onPress={() => builtNext && goTo(builtNext.index)}
          disabled={!builtNext}
          style={[styles.navBtn, styles.navNext, !builtNext && { opacity: 0.35 }]}
          accessibilityRole="button"
          accessibilityLabel={builtNext ? `Continue to chapter ${builtNext.index}` : 'Last available chapter'}
        >
          <Text style={[styles.navText, { color: colors.green }]}>CONTINUE ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 6 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5 },
  mathBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', padding: 3, gap: 2, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0e10' },
  seg: { minHeight: 36, paddingHorizontal: 9, borderRadius: 8, justifyContent: 'center' },
  segOn: { backgroundColor: '#1d1d21' },
  segOnMath: { backgroundColor: '#0f1a22', borderWidth: 1, borderColor: colors.cyanBright },
  segOnText: { color: colors.textPrimary },
  mathBtnText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.2 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, minHeight: 44 },
  dot: { width: 12, height: 6, borderRadius: 3, backgroundColor: '#26262b' },
  dotDone: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.cyanBright },
  dotsText: { marginLeft: 6, color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11 },
  list: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingVertical: 4 },
  listRow: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  listText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  objective: { borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, paddingVertical: 2, gap: 2 },
  objectiveKicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  objectiveText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairlineDim, backgroundColor: colors.screenBgDeep },
  sound: { flex: 1, color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  stopBtn: { minHeight: 44, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#4a2020', justifyContent: 'center', backgroundColor: '#1a0f10' },
  stopText: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  navBtn: { minHeight: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  navNext: { borderColor: colors.green, backgroundColor: '#173021' },
  navText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
});
