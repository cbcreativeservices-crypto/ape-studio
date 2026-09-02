/**
 * EarModuleScreen — the generic trial shell that runs every ear-training
 * module (spec §3). One screen: LISTEN FOR objective, transport chips, answer
 * chips, feedback with the truth + targeted miss line + "See it" panel,
 * 10-trial rounds with a summary, level ladder, fatigue nudge.
 *
 * State machine: rendering → answering → feedback → (next). The NEXT trial's
 * buffers are computed during feedback so the answer UI never blocks.
 * All sound goes through the app-wide audio gate on EVERY play (the gate
 * resolves instantly once enabled, and a mid-session mute must still bite);
 * buffers are freed on exit. All strings NEW COPY — owner review.
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
/** Spec §1: rounds are ten trials — a bounded set with a summary gives the
 *  session a shape and a natural place to stop. */
const ROUND = 10;
/** Spec §1 anti-gaming: never the same parameter twice in a row. */
const NO_REPEAT_TRIES = 4;

type Phase = 'rendering' | 'answering' | 'feedback';

/** The parameters a trial tests, for the no-repeat rule. */
const trialKey = (t: EarTrial) => `${t.question}|${t.reveal}`;

/**
 * Chips per row from the LONGEST label, so "12.5 kHz" on a 25-chip grid or
 * "RF interference (emulation)" never truncates to an ellipsis (the honesty
 * tag is the part that got cut). Decks over 12 use the compact chip.
 */
function chipLayout(labels: string[]): { perRow: number; compact: boolean } {
  const n = labels.length;
  if (n <= 3) return { perRow: Math.max(1, n), compact: false };
  if (n <= 4) return { perRow: 2, compact: false };
  const compact = n > 12;
  const maxLen = Math.max(...labels.map((l) => l.length));
  const pxPerChar = compact ? 6.9 : 7.5;
  const pad = compact ? 12 : 20;
  const est = Math.floor((328 + 8) / (maxLen * pxPerChar + pad + 8));
  return { perRow: Math.max(2, Math.min(5, est)), compact };
}

/** Targeted miss feedback — where the pick sat relative to the truth. */
// NEW COPY
function missLine(trial: EarTrial, picked: number): string | null {
  if (picked === trial.correct) return null;
  const pick = trial.answers[picked]?.label ?? '—';
  const ans = trial.answers[trial.correct].label;
  if (trial.ordered) {
    const d = picked - trial.correct;
    const n = Math.abs(d);
    return `You picked ${pick} — ${n} step${n > 1 ? 's' : ''} ${d < 0 ? trial.ordered.low : trial.ordered.high}. It was ${ans}.`;
  }
  return `You picked ${pick}. It was ${ans}.`;
}

// NEW COPY
function roundVerdict(pct: number): string {
  if (pct >= 0.8) return 'sharp — this pace moves the ladder.';
  if (pct >= 0.5) return 'solid. Replay the ones you missed with the answer in mind.';
  return 'a tough round. Play each clip again after the reveal — the category builds on repetition, not on guessing.';
}

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
  const lastKeyRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const seedRef = useRef((Date.now() ^ 0x5f3759df) >>> 0);
  const startedAt = useRef(Date.now());
  const scrollRef = useRef<ScrollView | null>(null);

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
  const [roundAnswered, setRoundAnswered] = useState(0);
  const [roundScore, setRoundScore] = useState(0);

  const nextSeed = () => (seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0);

  /** A trial that does not repeat the previous one's parameters. */
  const makeFresh = useCallback(
    (lvl: number, subOk: boolean): EarTrial | null => {
      if (!mod) return null;
      let t = mod.makeTrial(lvl, nextSeed(), { subBassOk: subOk });
      for (let i = 0; i < NO_REPEAT_TRIES && trialKey(t) === lastKeyRef.current; i++) {
        t = mod.makeTrial(lvl, nextSeed(), { subBassOk: subOk });
      }
      return t;
    },
    [mod],
  );

  const beginTrial = useCallback(
    async (lvl: number, subOk: boolean, prerendered?: EarTrial | null) => {
      if (!mod || busyRef.current) return;
      busyRef.current = true;
      try {
        setPhase('rendering');
        setPicked(null);
        setPlaying(null);
        const t = prerendered ?? makeFresh(lvl, subOk);
        nextTrialRef.current = null;
        if (!t) return;
        lastKeyRef.current = trialKey(t);
        setPlays(t.clips.map(() => 0));
        try {
          await player().load(t.clips.map((c) => c.buf));
        } catch {
          // A failed load must never wedge the screen — the trial still shows;
          // the play chips will retry the pipeline on the next trial.
        }
        setTrial(t);
        setPhase('answering');
      } finally {
        busyRef.current = false;
      }
    },
    [mod, makeFresh],
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
      // The ■ chip means STOP — tapping the clip that is playing stops it.
      if (playing === i) {
        player().stop();
        setPlaying(null);
        return;
      }
      if (phase === 'answering' && plays[i] >= replayCap) return;
      const okOut = await requestAudioOutput();
      if (!okOut) return;
      player().play(i);
      setPlaying(i);
      if (phase === 'answering') setPlays((p) => p.map((n, j) => (j === i ? n + 1 : n)));
      const buf = trial.clips[i].buf;
      const ms = (isStereo(buf) ? buf.l.length : buf.length) / 48;
      setTimeout(() => setPlaying((cur) => (cur === i ? null : cur)), ms + 60);
    },
    [trial, phase, plays, playing, replayCap, requestAudioOutput],
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
      setRoundAnswered((n) => n + 1);
      setRoundScore((v) => v + score);
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
          nextTrialRef.current = makeFresh(lvl, subOk);
        } catch {
          nextTrialRef.current = null;
        }
      }, 50);
    },
    [mod, trial, phase, makeFresh],
  );

  const roundDone = roundAnswered >= ROUND;

  const onNext = useCallback(() => {
    if (!mod || busyRef.current) return;
    if (roundDone) {
      setRoundAnswered(0);
      setRoundScore(0);
    }
    void beginTrial(level, subBassOk, nextTrialRef.current);
  }, [mod, level, subBassOk, roundDone, beginTrial]);

  const toggleSubBass = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    s.subBassOk = !s.subBassOk;
    setSubBassOk(s.subBassOk);
    // The pre-rendered next trial was drawn under the old setting.
    nextTrialRef.current = null;
    void saveEarProgress(s);
  }, []);

  const layout = useMemo(() => chipLayout(trial?.answers.map((a) => a.label) ?? []), [trial]);

  if (!mod) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Module not found</Text>
      </View>
    );
  }

  const needsAck = mod.phones === 'required' && !phonesAcked;
  const trialNo = Math.min(ROUND, roundAnswered + (phase === 'feedback' ? 0 : 1));
  const roundPct = roundAnswered ? roundScore / roundAnswered : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mod.title.toUpperCase()}</Text>
          <Text style={styles.subtitle} accessibilityLabel={`Level ${level} of ${mod.levels}, ${mod.levelNames[level - 1] ?? ''}`}>
            Level {level}/{mod.levels} · {mod.levelNames[level - 1] ?? ''}
          </Text>
        </View>
        <View
          style={styles.statPill}
          accessible
          accessibilityLabel={accuracy != null ? `Accuracy ${Math.round(accuracy * 100)} percent over the last 20 trials` : 'No trials yet'}
        >
          <Text style={styles.statText}>
            {accuracy != null ? `${Math.round(accuracy * 100)}%` : '—'}
          </Text>
          <Text style={styles.statSub}>last 20</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {needsAck ? (
          <View style={styles.ackCard}>
            <Text style={styles.ackTitle}>HEADPHONES REQUIRED</Text>
            <Text style={styles.body}>
              This module trains the stereo image — phone speakers collapse it, so scoring only
              counts on headphones.
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
            <View style={styles.objective}>
              <Text style={styles.objectiveEyebrow}>LISTEN FOR</Text>
              <Text style={styles.objectiveText}>{mod.listenFor}</Text>
            </View>
            {mod.hasSubBassTrials ? (
              <Pressable
                onPress={toggleSubBass}
                style={styles.subBassRow}
                accessibilityRole="switch"
                accessibilityState={{ checked: !subBassOk }}
                accessibilityLabel="My playback can't reproduce sub-bass — skip trials at or below 80 hertz"
              >
                <Text style={[styles.subBassBox, !subBassOk && styles.subBassBoxOn]} importantForAccessibility="no">{!subBassOk ? '✓' : ''}</Text>
                <Text style={styles.subBassText} importantForAccessibility="no">My playback can't reproduce sub-bass (skip ≤80 Hz trials)</Text>
              </Pressable>
            ) : null}
            {fatigued ? (
              <Text style={styles.fatigue} accessibilityRole="alert">
                15 minutes in — ears fatigue fast on critical listening. A 5-minute break makes the next round sharper.
              </Text>
            ) : null}

            {phase === 'rendering' || !trial ? (
              <Text style={styles.rendering}>Rendering the clips…</Text>
            ) : (
              <>
                <Text style={styles.roundLine}>
                  Trial {trialNo} of {ROUND} · Streak {streak}
                </Text>
                <Text style={styles.question}>{trial.question}</Text>
                <View style={styles.transportRow}>
                  {trial.clips.map((c, i) => {
                    const capped = phase === 'answering' && plays[i] >= replayCap;
                    const name = c.label === '▶' ? 'the clip' : `clip ${c.label}`;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => void onPlay(i)}
                        disabled={capped}
                        style={[styles.clipChip, playing === i && styles.clipChipActive, capped && styles.clipChipCapped]}
                        accessibilityRole="button"
                        accessibilityLabel={playing === i ? `Stop ${name}` : `Play ${name}`}
                        accessibilityHint={capped ? 'No replays left at this level' : undefined}
                        accessibilityState={{ disabled: capped }}
                      >
                        <Text style={[styles.clipText, playing === i && styles.clipTextActive]}>
                          {playing === i ? '■' : '▶'} {c.label !== '▶' ? c.label : ''}
                        </Text>
                        {phase === 'answering' && replayCap !== Infinity ? (
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
                          layout.compact && styles.answerChipCompact,
                          { minWidth: `${Math.floor(100 / layout.perRow) - 2}%` },
                          isCorrect && styles.answerCorrect,
                          isWrongPick && styles.answerWrong,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${a.label}${isCorrect ? ', correct answer' : isWrongPick ? ', your pick, not correct' : ''}`}
                        accessibilityState={{ disabled: phase !== 'answering', selected: picked === i }}
                      >
                        <Text
                          style={[
                            styles.answerText,
                            layout.compact && styles.answerTextCompact,
                            isCorrect && styles.answerTextOn,
                            isWrongPick && styles.answerTextWrong,
                          ]}
                          numberOfLines={2}
                        >
                          {a.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {phase === 'feedback' ? (
                  <View
                    style={styles.feedback}
                    onLayout={(e) => {
                      // Long grids push the verdict below the fold — bring it up.
                      scrollRef.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 12), animated: true });
                    }}
                  >
                    <Text
                      style={picked === trial.correct ? styles.verdictGood : trial.near?.includes(picked ?? -1) ? styles.verdictNear : styles.verdictBad}
                      accessibilityRole="header"
                    >
                      {picked === trial.correct ? 'CORRECT' : trial.near?.includes(picked ?? -1) ? 'CLOSE — half credit' : 'NOT THIS TIME'}
                    </Text>
                    {levelMsg ? <Text style={styles.levelMsg}>{levelMsg}</Text> : null}
                    {picked != null && picked !== trial.correct ? (
                      <Text style={styles.miss}>{missLine(trial, picked)}</Text>
                    ) : null}
                    <Text style={styles.reveal}>{trial.reveal}</Text>
                    <Text style={styles.hearAgain}>Hear it again with the answer in mind — the chips above stay live.</Text>
                    <SeeItView trial={trial} />
                    {roundDone ? (
                      <View style={styles.roundCard} accessible accessibilityRole="summary">
                        <Text style={styles.roundTitle}>ROUND COMPLETE</Text>
                        <Text style={styles.roundText}>
                          {roundScore % 1 === 0 ? roundScore : roundScore.toFixed(1)} of {ROUND} — {roundVerdict(roundPct)}
                        </Text>
                      </View>
                    ) : null}
                    <Pressable
                      style={styles.nextBtn}
                      onPress={onNext}
                      accessibilityRole="button"
                      accessibilityLabel={roundDone ? 'Start the next round' : 'Next trial'}
                    >
                      <Text style={styles.nextText}>{roundDone ? 'NEXT ROUND ›' : 'NEXT ›'}</Text>
                    </Pressable>
                  </View>
                ) : null}
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
  statSub: { color: colors.textMuted, fontFamily: fonts.barlowCondensedRegular, fontSize: 10.5 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  noteRow: { paddingVertical: 2 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  objective: {
    borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, paddingVertical: 2, gap: 2,
  },
  objectiveEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.5 },
  objectiveText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  subBassRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minHeight: 44 },
  subBassBox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.steelBorder,
    color: colors.green, textAlign: 'center', lineHeight: 18, fontSize: 13, backgroundColor: '#101012',
  },
  subBassBoxOn: { borderColor: colors.green },
  subBassText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, flex: 1 },
  fatigue: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  rendering: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 14, paddingVertical: 30, textAlign: 'center' },
  roundLine: { color: colors.textMuted, fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 0.5, marginTop: 2 },
  question: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 17, lineHeight: 23 },
  transportRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  clipChip: {
    minWidth: 72, minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.steelBorder,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#141416', paddingHorizontal: 14,
  },
  clipChipActive: { borderColor: colors.green, backgroundColor: '#12241a' },
  clipChipCapped: { opacity: 0.4 },
  clipText: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 17 },
  clipTextActive: { color: colors.green },
  capText: { color: colors.textMuted, fontFamily: fonts.barlowCondensedRegular, fontSize: 10.5, marginTop: 1 },
  answerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  answerChip: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315',
    paddingHorizontal: 10, paddingVertical: 8, flexGrow: 1,
  },
  answerChipCompact: { paddingHorizontal: 6, paddingVertical: 6 },
  answerCorrect: { borderColor: colors.green, backgroundColor: '#0f2416' },
  answerWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  answerText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14, textAlign: 'center' },
  answerTextCompact: { fontSize: 13 },
  answerTextOn: { color: colors.green },
  answerTextWrong: { color: colors.red },
  feedback: { marginTop: 6, gap: 6 },
  verdictGood: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  verdictNear: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  verdictBad: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1 },
  levelMsg: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  miss: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  reveal: { color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  hearAgain: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  roundCard: {
    marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.steelBorder,
    backgroundColor: '#131315', padding: 14, gap: 4,
  },
  roundTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5 },
  roundText: { color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  nextBtn: {
    marginTop: 10, minHeight: 48, borderRadius: 12, backgroundColor: '#173021',
    borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  nextText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 2 },
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
