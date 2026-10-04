/**
 * TuningLabScreen — the paced chapter shell (spec Stage 1 §5–6): the SHARED
 * LAB NAVIGATION strip (kit/LabNavBar, owner 2026-09-30 — ⏮ / ‹ PREV /
 * MODULE n / 14 ▾ / NEXT ›, FINISH › on the last chapter, CONTENTS from the
 * readout), Basic View / See the Math in the header, sound status + Stop on
 * the reading chapter and the end screen (rack chapters carry ■ STOP in the
 * dock). One TuningPlayer for the whole lab, disposed on unmount; switching
 * Basic/Math never remounts the chapter (the chapter component is the same
 * element, only ctx changes). The strip calls a chapter a MODULE; the
 * chapter eyebrows inside the content keep their word.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { useStopOnClose } from '../../../features/audio/useStopOnBlur';
import { useStopWhenSilenced } from '../../../features/audio/useStopWhenSilenced';
import { useAnimationsAllowed } from '../../../features/settings/a11y';
import { C4_ET } from '../../../features/tuning/tuningMath';
import { TuningPlayer, type PlayerStatus } from '../../../features/tuning/tuningAudio';
import { holdTuningProgress, isTuningProgressUnreadable, loadTuningProgress, saveTuningProgress, setTuningChapterCount, type TuningProgress } from '../../../features/tuning/tuningProgress';
import { ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { peekSessionWork } from '../../../features/lab/sessionCarry';
import { CHAPTERS, CHAPTER_COUNT } from './chapters';
import type { LabCtx } from './labCtx';
import { confirmDialog } from '../../../lib/confirm';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';
import { safeGoBack } from '../../../lib/safeGoBack';

// The store marks the lab done when a sign-in hand-off completes the set.
setTuningChapterCount(CHAPTER_COUNT);

export function TuningLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { requestAudioOutput } = useAudioOutputGate();
  const player = useMemo(() => new TuningPlayer(requestAudioOutput), [requestAudioOutput]);
  const [status, setStatus] = useState<PlayerStatus>({ playing: false, label: null });
  // Owner 2026-09-29 sound audit: the lab stopped only on unmount and on
  // backgrounding; a shake-to-mute / idle lock also cancels a clip still
  // RENDERING. Owner 2026-09-29 (later): "only stop when closed" — a clip
  // plays on under a pushed screen (glossary, lesson) and stops on close, or
  // when another sound lab comes to the front (labOutputOwner).
  useStopOnClose(() => player.stop());
  useStopWhenSilenced(status.playing || !!status.rendering, () => player.stop());

  /**
   * W16 (2026-09-18): the sound line in the footer is `accessibilityLiveRegion`
   * — Android-only, a no-op on iOS. This lab's whole subject is AUDIO, and a
   * VoiceOver user got no confirmation that a tone had started, what it was,
   * or that it had stopped. Transport changes are discrete events, so the
   * string is safe to speak as written; keyed on the rendered text so a
   * re-render with the same status stays quiet.
   */
  const soundLine = status.rendering
    ? `Rendering: ${status.rendering}…`
    : status.playing
      ? `Playing ${status.label}`
      : 'Sound stopped';
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.announceForAccessibility(soundLine);
  }, [soundLine]);
  const [progress, setProgress] = useState<TuningProgress | null>(null);
  /** The stored chapters could NOT BE READ (owner 2026-10-03, "do 2"): the
   *  strip's ticks and the what's-left list are a stand-in, so the shared
   *  note says so — never "not started". Every chapter stays open. */
  const [unreadable, setUnreadable] = useState(false);
  // Every save builds on the NEWEST progress (bug hunt 2026-09-30, the
  // PagedLab pattern): a chapter's late callback (SHOW ME finishing after
  // CONTINUE) spread its render-time copy and reverted lastChapter / mathView.
  const progressRef = useRef<TuningProgress | null>(null);
  // HOUSE GUEST RULE (kit/PagedLab's; bug hunt 2026-09-30 day): a signed-out
  // guest or a members-only preview neither restores a place nor saves one.
  // This shell saved and restored for everyone — while its own end screen
  // told the guest "nothing here is saved". Same reading as that screen.
  const guest = useLabEndGuest();
  const guestRef = useRef(guest);
  guestRef.current = guest;
  // Progress restored AS A GUEST (empty) is never written, even once the
  // tier clears (bug pass 3, 2026-09-30): a signed-in learner whose first
  // tier read failed reads 'anonymous' until a retry lands, and the empty
  // copy then overwrote their completed chapters — credit removed.
  const loadedAsGuestRef = useRef(false);
  /** The BASIC/MATH pick made before the stored progress landed. */
  const mathPickedRef = useRef<boolean | null>(null);
  /** Chapters completed before the stored progress landed (night pass 2,
   *  2026-10-01): markDone had no base yet and dropped them — a check answered
   *  while the tier was still resolving never counted, and useMarkWhen does
   *  not fire twice. Merged into the stored copy when it arrives. */
  const pendingDoneRef = useRef<number[]>([]);
  const [chapter, setChapter] = useState(0);
  const [rootHz, setRootHz] = useState(C4_ET);
  const [mathView, setMathView] = useState(false);
  // The what's-left end screen (owner 2026-09-29), shown in place of the chapter.
  const [ending, setEnding] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const reduceMotion = !useAnimationsAllowed(); // subscribed (P10b 2026-10-02)

  useEffect(() => {
    const unsub = player.subscribe(setStatus);
    return () => {
      unsub();
      player.dispose(); // stops and releases every voice when the lab unmounts
    };
  }, [player]);

  // ⛔ WAIT FOR `resolved` BEFORE RESTORING (bug pass 3, 2026-09-30; the
  // kit/PagedLab fix). A load that landed first read the guest flag as false
  // (the provider boots at 'anonymous'-but-unresolved), so a signed-out
  // device restored the previous account's place. `resolved` flips once,
  // bounded, after the first read attempt — a signed-in learner is not held.
  // A chapter picked meanwhile is kept, not yanked back to the saved one.
  const { resolved } = useEntitlement();
  const navigatedRef = useRef(false);
  // RE-READ WHEN THE ACCOUNT STATE CHANGES (owner ruling 2026-10-01, the
  // kit/PagedLab rule): a guest who signs in gets the stored copy plus what
  // the guest session held (the shared ledger also writes it); a learner who
  // signs out drops to the empty guest copy, so the next person to sign in is
  // never saved the previous one's chapters from the screen.
  useEffect(() => {
    if (!resolved) return;
    let alive = true;
    const first = progressRef.current == null;
    void loadTuningProgress().then((stored) => {
      if (!alive) return;
      const wasGuest = loadedAsGuestRef.current;
      loadedAsGuestRef.current = guestRef.current;
      let p: TuningProgress = guestRef.current ? { completed: [], lastChapter: 0, done: false, mathView: false } : stored;
      if (!first && !guestRef.current && wasGuest) {
        // The guest session's chapters (held for the hand-off) join the copy.
        const held = peekSessionWork<{ completed: number[] }>('tuning')?.completed ?? [];
        const completed = [...new Set([...p.completed, ...held])].sort((a, b) => a - b);
        p = { ...p, completed, done: p.done || completed.length >= CHAPTER_COUNT };
      }
      // BASIC/MATH tapped before the load landed is kept (bug pass
      // 2026-10-01): the stored flag used to yank the toggle straight back.
      if (mathPickedRef.current != null) p = { ...p, mathView: mathPickedRef.current };
      const early = pendingDoneRef.current.filter((c) => !p.completed.includes(c));
      pendingDoneRef.current = [];
      if (early.length) {
        const completed = [...p.completed, ...early].sort((a, b) => a - b);
        p = { ...p, completed, done: completed.length >= CHAPTER_COUNT };
        if (!guestRef.current) void saveTuningProgress(p);
        else for (const c of early) holdTuningProgress({ done: c });
      }
      progressRef.current = p;
      setUnreadable(!guestRef.current && isTuningProgressUnreadable());
      setProgress(p);
      setMathView(p.mathView);
      const built = CHAPTERS.map((c) => c.index);
      if (!navigatedRef.current) setChapter(built.includes(p.lastChapter) ? p.lastChapter : 0);
    });
    return () => {
      alive = false;
    };
  }, [resolved, guest]);

  const persist = useCallback((patch: Partial<TuningProgress>) => {
    const base = progressRef.current;
    if (!base) return;
    const next = { ...base, ...patch };
    progressRef.current = next;
    setProgress(next);
    if (!guestRef.current && !loadedAsGuestRef.current) void saveTuningProgress(next);
    else {
      // A guest's work is HELD for the sign-in hand-off, as deltas (owner
      // ruling 2026-10-01; features/lab/sessionCarry).
      for (const c of next.completed) if (!base.completed.includes(c)) holdTuningProgress({ done: c });
      if (next.lastChapter !== base.lastChapter) holdTuningProgress({ lastChapter: next.lastChapter });
      if (next.mathView !== base.mathView) holdTuningProgress({ mathView: next.mathView });
    }
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      player.stop(); // leaving a chapter stops its audio
      navigatedRef.current = true;
      setEnding(false);
      setChapter(idx);
      scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
      persist({ lastChapter: idx });
    },
    [player, persist, reduceMotion],
  );

  const markDone = useCallback(() => {
    const base = progressRef.current;
    if (!base) {
      if (!pendingDoneRef.current.includes(chapter)) pendingDoneRef.current.push(chapter);
      return;
    }
    const completed = base.completed.includes(chapter) ? base.completed : [...base.completed, chapter].sort((a, b) => a - b);
    const done = completed.length >= CHAPTER_COUNT;
    persist({ completed, done });
  }, [chapter, persist]);

  const toggleMath = () => {
    const next = !mathView;
    mathPickedRef.current = next;
    setMathView(next);
    persist({ mathView: next });
  };

  // A PRACTICE reset, never a credit wipe (owner 2026-09-29: "resets start a
  // fresh practice run; they never wipe banked credit"; bug hunt 2026-09-30
  // day, the Amp lab's fix). It used to remove the whole key — every
  // completed chapter, this lab's only record of them. Now it starts over
  // from the first chapter and the completed chapters stay complete.
  const confirmReset = () =>
    confirmDialog(
      'Start a fresh practice run?',
      'Goes back to the first chapter of the Tuning & Temperament Lab. Chapters you have completed stay complete.',
      'Start over',
      () => goTo(CHAPTERS[0].index),
    );

  const def = CHAPTERS.find((c) => c.index === chapter) ?? CHAPTERS[0];
  const isDone = !!progress?.completed.includes(chapter);

  const ctx: LabCtx = { rootHz, setRootHz, mathView, reduceMotion, player, markDone, isDone, objective: def.objective };
  const Chapter = def.Component;
  // RACK CHAPTERS (owner, TestFlight build 32, 2026-09-30: "poor arrangement
  // of controls above displays … do a proper rack system"): a chapter that
  // declares `rack` gets the FULL HEIGHT and no ScrollView of its own — its
  // TuningRackLayout pins the display and the dock and owns the scroll well
  // between them (the Sound Systems paged host's idiom). The reading chapter
  // keeps the document layout below.
  const rack = !!def.rack;

  /**
   * THE LAST CHAPTER ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every
   * lab ends with a 'what's left' screen"; always allow review and redo).
   * FINISH › on the strip swaps LabEndScreen in for the chapter: the chapters
   * not yet done (this lab's own device progress — no credit), a jump to
   * each, PRACTISE AGAIN from the first chapter (clears nothing) and DONE.
   */
  const finish = useCallback(() => {
    player.stop();
    setEnding(true);
  }, [player]);
  const unEnd = useCallback(() => setEnding(false), []);
  const endCleared = new Set((progress?.completed ?? []).map(String));

  // THE SHARED LAB NAVIGATION (kit/LabNavBar, owner 2026-09-30). The strip is
  // 1-based (MODULE 3 / 14); `chapter` stays the 0-based registry index. The
  // hook persists nothing — `goTo` keeps the stop-on-leave and the save.
  const units = useMemo(
    () => CHAPTERS.map((c) => ({ id: String(c.index), title: c.title, done: !!progress?.completed.includes(c.index) })),
    [progress],
  );
  const navGo = useCallback((i: number) => goTo(CHAPTERS[i]?.index ?? 0), [goTo]);
  const nav = useLabNav({
    units,
    index: CHAPTERS.findIndex((c) => c.index === chapter),
    ending,
    go: navGo,
    finish,
    unEnd,
    reset: { label: 'START OVER (PRACTICE)', run: confirmReset },
  });

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <LabHeader
        title="TUNING & TEMPERAMENT LAB"
        subtitle={ending ? "What's left" : def.title}
        right={
          /* Two-segment toggle: both states are visible, so the learner can see
             what tapping will do (the old single label only named the current state). */
          <Pressable onPress={toggleMath} style={styles.mathBtn} accessibilityRole="switch" accessibilityState={{ checked: mathView }} aria-checked={mathView} accessibilityLabel="See the math" accessibilityHint="Shows or hides the derivations under each display">
            <View style={[styles.seg, !mathView && styles.segOn]}><Text style={[styles.mathBtnText, !mathView && styles.segOnText]}>BASIC</Text></View>
            <View style={[styles.seg, mathView && styles.segOnMath]}><Text style={[styles.mathBtnText, mathView && { color: colors.cyanBright }]}>MATH</Text></View>
          </Pressable>
        }
      />
      <LabNavBar nav={nav} />
      {unreadable && !ending ? <ProgressUnreadableNote style={styles.unreadable} /> : null}

      {ending ? (
        <LabEndScreen
          labTitle="Tuning & Temperament Lab"
          unreadable={unreadable}
          units={CHAPTERS.map((c) => ({ id: String(c.index), label: c.title }))}
          cleared={endCleared}
          mode="progress"
          noun="chapter"
          onJump={(id) => goTo(Number(id))}
          onPracticeAgain={() => goTo(CHAPTERS[0].index)}
          onDone={() => safeGoBack(navigation)}
        />
      ) : rack ? (
        // The rack takes the rest of the height; the chapter's own well scrolls
        // and ends on the rack's own "NEXT: <chapter> ›" (LabNavProvider).
        // Keyed on the chapter so a revisit starts the chapter's state fresh.
        <View style={styles.rackFill}>
          <Chapter key={chapter} ctx={ctx} />
        </View>
      ) : (
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: 24 }]}>
        {/* This lab PLAYS synthesized tones — it never uses the microphone
            (the note said it did until 2026-09-30, factually wrong). What the
            learner hears passes through an uncalibrated output and speaker or
            headphones, so the caveat is still the substance. */}
        <AccuracyNote style={styles.accuracyNote} detail="The tones here are synthesized exactly, but you hear them through this phone's uncalibrated output and your speaker or headphones. Use a dedicated tuner or a calibrated reference for work that has to be right." />
        {def.objective ? (
          <View style={styles.objective} accessible accessibilityLabel={`In this chapter: ${def.objective}`}>
            <Text style={styles.objectiveKicker}>IN THIS CHAPTER</Text>
            <Text style={styles.objectiveText}>{def.objective}</Text>
          </View>
        ) : null}
        <Chapter ctx={ctx} />
        {/* The reading chapter has no rack, so it draws the in-flow NEXT itself. */}
        <LabNextButton />
      </ScrollView>
      )}

      {/* Sound status + ■ STOP — on the reading chapter and the end screen
          only. On a rack chapter ■ STOP is a DOCK key (reachable in full
          screen, where this footer is not) and the rack pads the safe area
          itself; a footer copy would be a duplicate an inch away. */}
      {rack && !ending ? null : (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.sound} accessibilityLiveRegion="polite">
            {status.rendering ? `Rendering: ${status.rendering}…` : status.playing ? `♪ ${status.label}` : 'Sound: stopped'}
          </Text>
          <Pressable onPress={() => player.stop()} style={styles.stopBtn} accessibilityRole="button" accessibilityLabel="Stop all audio">
            <Text style={styles.stopText}>■ STOP</Text>
          </Pressable>
        </View>
      )}
    </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  // The header (‹, title, subtitle) and the strip are kit/LabNavBar's.
  mathBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', padding: 3, gap: 2, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0e10' },
  seg: { minHeight: 36, paddingHorizontal: 9, borderRadius: 8, justifyContent: 'center' },
  segOn: { backgroundColor: '#1d1d21' },
  segOnMath: { backgroundColor: '#0f1a22', borderWidth: 1, borderColor: colors.cyanBright },
  segOnText: { color: colors.textPrimary },
  mathBtnText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.2 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  rackFill: { flex: 1 },
  unreadable: { marginHorizontal: 12, marginBottom: 6 },
  accuracyNote: { marginBottom: 10, alignSelf: 'flex-start' },
  objective: { borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, paddingVertical: 2, gap: 2 },
  objectiveKicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  objectiveText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairlineDim, backgroundColor: colors.screenBgDeep },
  sound: { flex: 1, color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  stopBtn: { minHeight: 44, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#4a2020', justifyContent: 'center', backgroundColor: '#1a0f10' },
  stopText: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
});
