/**
 * EarModuleScreen — the generic trial shell that runs every ear-training
 * module (spec §3). One screen: transport chips, answer chips, feedback with
 * the truth + "See it" panel, level ladder, fatigue nudge.
 *
 * State machine: rendering → answering → feedback → (next). The NEXT trial's
 * buffers are computed during feedback so the answer UI never blocks.
 * All sound goes through the app-wide audio gate; buffers are freed on exit.
 * All strings NEW COPY — owner review.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { EarClipPlayer } from '../../../features/ear/earPlayer';
import { isStereo } from '../../../features/ear/earDsp';
import { earModuleById } from '../../../features/ear/modules/registry';
import type { EarTrial } from '../../../features/ear/earTypes';
import {
  applyTrial, emptyModuleProgress, loadEarProgress, recentAccuracy, saveEarProgress,
  type EarProgressState,
} from '../../../features/ear/earProgress';
import { SeeItView } from './SeeItView';

const FATIGUE_MS = 15 * 60 * 1000;
const TOP_LEVEL_REPLAYS = 2;

type Phase = 'rendering' | 'answering' | 'feedback';

export function EarModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EarModule'>>();
  const mod = earModuleById(route.params.id);
  const { requestAudioOutput } = useAudioOutputGate();

  const playerRef = useRef<EarClipPlayer | null>(null);
  const player = () => (playerRef.current ??= new EarClipPlayer());
  const stateRef = useRef<EarProgressState | null>(null);
  const nextTrialRef = useRef<EarTrial | null>(null);
  const seedRef = useRef((Date.now() ^ 0x5f3759df) >>> 0);
  const startedAt = useRef(Date.now());
  const audioOn = useRef(false);

  const [phase, setPhase] = useState<Phase>('rendering');
  const [trial, setTrial] = useState<EarTrial | null>(null);
  const [level, setLevel] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [plays, setPlays] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [levelMsg, setLevelMsg] = useState<string | null>(null);
  const [fatigued, setFatigued] = useState(false);
  const [subBassOk, setSubBassOk] = useState(true);
  const [phonesAcked, setPhonesAcked] = useState(false);

  const nextSeed = () => (seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0);

  const beginTrial = useCallback(
    async (lvl: number, subOk: boolean, prerendered?: EarTrial | null) => {
      if (!mod) return;
      setPhase('rendering');
      setPicked(null);
      setPlaying(null);
      const t = prerendered ?? mod.makeTrial(lvl, nextSeed(), { subBassOk: subOk });
      nextTrialRef.current = null;
      setPlays(t.clips.map(() => 0));
      try {
        await player().load(t.clips.map((c) => c.buf));
      } catch {
        // A failed load must never wedge the screen — the trial still shows;
        // the play chips will retry the pipeline on the next trial.
      }
      setTrial(t);
      setPhase('answering');
    },
    [mod],
  );

  // Boot: progress + first trial.
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await loadEarProgress();
      if (!alive || !mod) return;
      stateRef.current = s;
      const p = s.modules[mod.id] ?? emptyModuleProgress();
      const lvl = Math.min(p.level, mod.levels);
      setLevel(lvl);
      setStreak(p.streak);
      setAccuracy(recentAccuracy(p));
      setSubBassOk(s.subBassOk);
      void beginTrial(lvl, s.subBassOk);
    })();
    return () => {
      alive = false;
      playerRef.current?.dispose();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 15-minute fatigue nudge (spec §1) — checked once a minute.
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - startedAt.current > FATIGUE_MS) setFatigued(true);
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const replayCap = mod && level >= mod.levels ? TOP_LEVEL_REPLAYS : Infinity;

  const onPlay = useCallback(
    async (i: number) => {
      if (!trial) return;
      if (phase === 'answering' && plays[i] >= replayCap) return;
      if (!audioOn.current) {
        const okOut = await requestAudioOutput();
        if (!okOut) return;
        audioOn.current = true;
      }
      player().play(i);
      setPlaying(i);
      if (phase === 'answering') setPlays((p) => p.map((n, j) => (j === i ? n + 1 : n)));
      const buf = trial.clips[i].buf;
      const ms = (isStereo(buf) ? buf.l.length : buf.length) / 48;
      setTimeout(() => setPlaying((cur) => (cur === i ? null : cur)), ms + 60);
    },
    [trial, phase, plays, replayCap, requestAudioOutput],
  );

  const onAnswer = useCallback(
    (i: number) => {
      if (!mod || !trial || phase !== 'answering') return;
      player().stop();
      setPlaying(null);
      setPicked(i);
      setPhase('feedback');
      const score = i === trial.correct ? 1 : trial.near?.includes(i) ? 0.5 : 0;
      const s = stateRef.current ?? { modules: {}, subBassOk: true };
      const p = s.modules[mod.id] ?? emptyModuleProgress();
      const { next, leveledUp, leveledDown } = applyTrial(p, mod.levels, score);
      s.modules[mod.id] = next;
      stateRef.current = s;
      void saveEarProgress(s);
      setStreak(next.streak);
      setAccuracy(recentAccuracy(next));
      setLevel(next.level);
      setLevelMsg(
        leveledUp
          ? `Level up — ${mod.levelNames[next.level - 1] ?? `level ${next.level}`}`
          : leveledDown
            ? 'Stepping back a level — build the streak again'
            : null,
      );
      // Pre-render the next trial while the learner reads the feedback.
      const lvl = next.level;
      const subOk = s.subBassOk;
      setTimeout(() => {
        try {
          nextTrialRef.current = mod.makeTrial(lvl, nextSeed(), { subBassOk: subOk });
        } catch {
          nextTrialRef.current = null;
        }
      }, 50);
    },
    [mod, trial, phase],
  );

  const onNext = useCallback(() => {
    if (!mod) return;
    void beginTrial(level, subBassOk, nextTrialRef.current);
  }, [mod, level, subBassOk, beginTrial]);

  const toggleSubBass = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    s.subBassOk = !s.subBassOk;
    setSubBassOk(s.subBassOk);
    void saveEarProgress(s);
  }, []);

  const chipsPerRow = useMemo(() => {
    const n = trial?.answers.length ?? 0;
    return n > 12 ? 5 : n > 6 ? 3 : 2;
  }, [trial]);

  if (!mod) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Module not found</Text>
      </View>
    );
  }

  const needsAck = mod.phones === 'required' && !phonesAcked;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mod.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>
            Level {level}/{mod.levels} · {mod.levelNames[level - 1] ?? ''}
          </Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statText}>
            {accuracy != null ? `${Math.round(accuracy * 100)}%` : '—'}
          </Text>
          <Text style={styles.statSub}>last 20</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {needsAck ? (
          <View style={styles.ackCard}>
            <Text style={styles.ackTitle}>HEADPHONES REQUIRED</Text>
            <Text style={styles.body}>
              This module trains the stereo image — phone speakers collapse it, so scoring only
              counts on headphones. {mod.playbackNote}
            </Text>
            <Pressable style={styles.ackBtn} onPress={() => setPhonesAcked(true)} accessibilityRole="button">
              <Text style={styles.ackBtnText}>I'M ON HEADPHONES</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.noteRow}>
              <Text style={styles.note}>
                {mod.phones === 'required' ? '🎧 required' : mod.phones === 'recommended' ? '🎧 recommended' : '🔊 any playback'} · {mod.playbackNote}
              </Text>
            </View>
            {mod.hasSubBassTrials ? (
              <Pressable onPress={toggleSubBass} style={styles.subBassRow} accessibilityRole="switch" accessibilityState={{ checked: !subBassOk }}>
                <Text style={[styles.subBassBox, !subBassOk && styles.subBassBoxOn]}>{!subBassOk ? '✓' : ''}</Text>
                <Text style={styles.subBassText}>My playback can't reproduce sub-bass (skip ≤80 Hz trials)</Text>
              </Pressable>
            ) : null}
            {fatigued ? (
              <Text style={styles.fatigue}>
                15 minutes in — ears fatigue fast on critical listening. A 5-minute break makes the next round sharper.
              </Text>
            ) : null}

            {phase === 'rendering' || !trial ? (
              <Text style={styles.rendering}>Rendering stimuli…</Text>
            ) : (
              <>
                <Text style={styles.question}>{trial.question}</Text>
                <View style={styles.transportRow}>
                  {trial.clips.map((c, i) => {
                    const capped = phase === 'answering' && plays[i] >= replayCap;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => void onPlay(i)}
                        disabled={capped}
                        style={[styles.clipChip, playing === i && styles.clipChipActive, capped && styles.clipChipCapped]}
                        accessibilityRole="button"
                        accessibilityLabel={`Play clip ${c.label}`}
                      >
                        <Text style={[styles.clipText, playing === i && styles.clipTextActive]}>
                          {playing === i ? '■' : '▶'} {c.label !== '▶' ? c.label : ''}
                        </Text>
                        {replayCap !== Infinity ? (
                          <Text style={styles.capText}>{Math.max(0, replayCap - plays[i])} left</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.answerWrap}>
                  {trial.answers.map((a, i) => {
                    const isCorrect = phase === 'feedback' && i === trial.correct;
                    const isWrongPick = phase === 'feedback' && picked === i && i !== trial.correct;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => onAnswer(i)}
                        disabled={phase !== 'answering'}
                        style={[
                          styles.answerChip,
                          { minWidth: `${Math.floor(100 / chipsPerRow) - 2}%` },
                          isCorrect && styles.answerCorrect,
                          isWrongPick && styles.answerWrong,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={a.label}
                      >
                        <Text
                          style={[styles.answerText, isCorrect && styles.answerTextOn, isWrongPick && styles.answerTextWrong]}
                          numberOfLines={1}
                        >
                          {a.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {phase === 'feedback' ? (
                  <View style={styles.feedback}>
                    <Text style={picked === trial.correct ? styles.verdictGood : trial.near?.includes(picked ?? -1) ? styles.verdictNear : styles.verdictBad}>
                      {picked === trial.correct ? 'CORRECT' : trial.near?.includes(picked ?? -1) ? 'CLOSE — half credit' : 'NOT THIS TIME'}
                    </Text>
                    {levelMsg ? <Text style={styles.levelMsg}>{levelMsg}</Text> : null}
                    <Text style={styles.reveal}>{trial.reveal}</Text>
                    <Text style={styles.hearAgain}>Hear it again with the answer in mind — the chips above stay live.</Text>
                    <SeeItView trial={trial} />
                    <Pressable style={styles.nextBtn} onPress={onNext} accessibilityRole="button" accessibilityLabel="Next trial">
                      <Text style={styles.nextText}>NEXT ›</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.streakRow}>
                  <Text style={styles.streakText}>Streak {streak}</Text>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1 },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  statPill: {
    alignItems: 'center', borderWidth: 1, borderColor: colors.hairline, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#121214',
  },
  statText: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  statSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 9.5 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  noteRow: { paddingVertical: 2 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  subBassRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minHeight: 44 },
  subBassBox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.steelBorder,
    color: colors.green, textAlign: 'center', lineHeight: 18, fontSize: 13, backgroundColor: '#101012',
  },
  subBassBoxOn: { borderColor: colors.green },
  subBassText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, flex: 1 },
  fatigue: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  rendering: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 14, paddingVertical: 30, textAlign: 'center' },
  question: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 17, lineHeight: 23, marginTop: 6 },
  transportRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  clipChip: {
    minWidth: 72, minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.steelBorder,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#141416', paddingHorizontal: 14,
  },
  clipChipActive: { borderColor: colors.green, backgroundColor: '#12241a' },
  clipChipCapped: { opacity: 0.4 },
  clipText: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 17 },
  clipTextActive: { color: colors.green },
  capText: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 9.5, marginTop: 1 },
  answerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  answerChip: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315',
    paddingHorizontal: 10, paddingVertical: 8, flexGrow: 1,
  },
  answerCorrect: { borderColor: colors.green, backgroundColor: '#0f2416' },
  answerWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  answerText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14 },
  answerTextOn: { color: colors.green },
  answerTextWrong: { color: colors.red },
  feedback: { marginTop: 6, gap: 6 },
  verdictGood: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  verdictNear: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  verdictBad: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  levelMsg: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  reveal: { color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  hearAgain: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  nextBtn: {
    marginTop: 10, minHeight: 48, borderRadius: 12, backgroundColor: '#173021',
    borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  nextText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 2 },
  streakRow: { marginTop: 4 },
  streakText: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  ackCard: {
    marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.steelBorder,
    backgroundColor: '#131315', padding: 18, gap: 10,
  },
  ackTitle: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.5 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  ackBtn: {
    minHeight: 48, borderRadius: 12, backgroundColor: '#173021', borderWidth: 1, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  ackBtnText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.5 },
});
