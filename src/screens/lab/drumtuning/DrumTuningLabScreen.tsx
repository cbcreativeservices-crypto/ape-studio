/**
 * DrumTuningLabScreen — "Drum Tuning Lab" (owner spec 2026-10-01). ONE
 * screen, seven chapters, each a run of steps (LEARN → HEAR → ADJUST →
 * PRACTICE → REVIEW) on the shared lab navigation strip in sub-step mode
 * (kit/LabNavBar):
 *
 *     ‹ DRUM TUNING LAB                                 ⓘ
 *     [⏮] [‹ PREV]   CHAPTER 3 · STEP 2 / 4 ▾   [NEXT ›]
 *
 * ‹ PREV / NEXT › walk a chapter's steps and roll over to the neighbouring
 * chapter (PREV lands on the previous chapter's LAST step); the readout
 * opens CONTENTS; FINISH › on the last step of Chapter 7 opens the
 * what's-left screen (owner: every lab ends on one; labs never block
 * navigation).
 *
 * CREDIT: a chapter banks THE MOMENT its requirement is met — every
 * decision brought to its RIGHT answer (a retry is free; merely tapping
 * an option is not an answer) and, where the chapter has one, its interactive's
 * goal reached (the head tuned even, two sound goals met, the tom range
 * distinct, the five symptoms cleared, the checklist revealed, the three
 * relationships heard) — on the event itself, not on NEXT, so leaving by
 * ‹, CONTENTS or a what's-left row never loses it. Credit is never
 * removed: START OVER (PRACTICE) clears answers, interactive flags and the
 * resume point, keeps `done` and the tuning notes.
 *
 * HOUSE GUEST RULE: a signed-out guest or a members-only preview restores
 * nothing and saves nothing; the first load waits for the entitlement tier
 * to be `resolved`.
 *
 * MODELLED ON mastering/MasteringLabScreen.tsx.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { confirmDialog } from '../../../lib/confirm';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { DRUM_CHAPTERS, drumChapterById, scenariosForChapter, type DrumChapterId, type TuningNote } from './drumContent';
import { deleteTuningNote, drumResumePoint, emptyDrumChapter, keepSessionNotes, resetDrumPractice, saveTuningNote, setDrumSaveBlocked, updateDrumProgress, withNote, type DrumProgressState } from './drumProgress';
import { DRUM_CHAPTER_COMPONENTS, DRUM_NEEDS_INTERACTIVE, DRUM_STEP_COUNTS } from './modules';
import { StepHostContext, type StepHost } from './steps';
import type { NoteDeleteResult, NoteSaveResult } from './modules/shared';
import { TakeawayCard } from './kit';

export const DRUM_LAB_TITLE = 'Drum Tuning Lab';
const SUBTITLE = 'Prepare, tune, listen, troubleshoot';

const ACCURACY_DETAIL =
  'This lab MODELS a drum on your phone. Every sound is SYNTHESIZED from membrane physics (Bessel-zero mode ratios, a lug-by-lug tension map, two heads coupled through the air, an amplitude-dependent pitch bend) and heard through an UNCALIBRATED output; the drawings are models and the readouts are measured from those renders. Learn the method here; trust your ears and a real drum.';

export function DrumTuningLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // HOUSE GUEST RULE: neither restore nor save for a guest / a preview;
  // blocked until the tier is `resolved` (the Mastering rule).
  const guest = useLabEndGuest();
  const { resolved, entitlement } = useEntitlement();
  const blocked = guest || !resolved;
  setDrumSaveBlocked(blocked);
  const preview = resolved && guest && entitlement !== 'anonymous';

  const [modId, setModId] = useState<DrumChapterId>('sound');
  const [step, setStepRaw] = useState(0);
  const [stepTitles, setStepTitles] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [interactive, setInteractive] = useState<ReadonlySet<string>>(() => new Set());
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set());
  const [notes, setNotes] = useState<TuningNote[]>([]);
  const [endState, setEndState] = useState<DrumProgressState | null>(null);
  const [loaded, setLoaded] = useState(false);
  /** Bumped by START OVER: the chapter remounts even when the run restarts
   *  on the chapter already open (toddler pass 1 — Chapter 1's answered
   *  cards stayed answered and locked for the fresh run). */
  const [runId, setRunId] = useState(0);

  const mod = drumChapterById(modId);
  const idx = DRUM_CHAPTERS.findIndex((m) => m.id === modId);
  const Component = DRUM_CHAPTER_COMPONENTS[mod.id];
  const modIdRef = useRef(modId);
  modIdRef.current = modId;
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;
  /** A move (chapter or step) made before the first load landed. */
  const movedRef = useRef(false);
  /** The last load ran against a BLOCKED store (a guest, a preview, or a
   *  member whose tier had not settled yet) — it read nothing. */
  const loadedBlockedRef = useRef(false);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  /** Session notes the sign-in re-read could NOT write to the device
   *  (toddler pass 3). They stay listed — the learner's work is not dropped —
   *  but marked NOT SAVED, never under "SAVED ON THIS DEVICE" as if stored. */
  const [unsaved, setUnsaved] = useState<readonly TuningNote[]>([]);
  const unsavedRef = useRef(unsaved);
  unsavedRef.current = unsaved;
  /** The store's list plus the notes it could not take. */
  const listed = useCallback((stored: readonly TuningNote[]): TuningNote[] => [...stored, ...unsavedRef.current.filter((u) => !stored.some((x) => x.id === u.id))], []);

  // ⛔ WAIT FOR `resolved` before the first read. And READ AGAIN when the
  // store unblocks (toddler pass 1): a member whose tier settled after
  // `resolved` (a slow or failed first read), or a guest who signs in
  // mid-lab, used to keep the blank guest copy for the whole visit — none of
  // their stored progress, credit or notes shown. The re-read MERGES (credit
  // only grows, the learner is not moved) and keeps the session's notes, as
  // the guest copy promised ("sign in to keep tuning notes on this device").
  useEffect(() => {
    if (!resolved) return;
    const reread = loaded && loadedBlockedRef.current && !blocked;
    if (loaded && !reread) return;
    let alive = true;
    loadedBlockedRef.current = blocked;
    void updateDrumProgress(() => {}).then(async (s) => {
      if (!alive) return;
      setDoneIds((prev) => new Set([...(reread ? prev : []), ...DRUM_CHAPTERS.filter((x) => s.modules[x.id]?.done).map((x) => x.id)]));
      setInteractive((prev) => new Set([...prev, ...DRUM_CHAPTERS.filter((x) => s.modules[x.id]?.interactive).map((x) => x.id)]));
      if (reread) {
        const here = s.modules[modIdRef.current]?.answers ?? {};
        setAnswers((prev) => ({ ...here, ...prev }));
        // Each session note is written over the stored list; one the write
        // REFUSED (toddler pass 3) used to come back inside the returned list
        // anyway and showed under "SAVED ON THIS DEVICE" — gone next visit.
        // A failed READ also returned an empty list per note, so only the
        // last session note stayed on screen.
        const kept = await keepSessionNotes(s.notes, notesRef.current);
        if (!alive) return;
        unsavedRef.current = kept.failed;
        setUnsaved(kept.failed);
        setNotes(listed(kept.notes));
        return;
      }
      setNotes(s.notes);
      if (movedRef.current) {
        const here = s.modules[modIdRef.current]?.answers ?? {};
        setAnswers((prev) => ({ ...prev, ...here }));
      } else {
        // Chapter 1 resumes too: a learner who never left it has a stored
        // step and answers but no `lastModule`.
        const at = drumResumePoint(s);
        setModId(at.id);
        setAnswers(at.answers);
        setStepRaw(at.step);
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [resolved, loaded, blocked]);

  const openModule = useCallback((id: DrumChapterId, atStep = 0) => {
    if (!loadedRef.current) movedRef.current = true;
    setEndState(null);
    setModId(id);
    setStepRaw(atStep);
    void updateDrumProgress((s) => {
      s.lastModule = id;
      s.lastStep = atStep;
    }).then((s) => {
      setAnswers(s.modules[id]?.answers ?? {});
      // No setNotes here (toddler pass 1): for a guest the blocked store
      // reads back EMPTY, so every chapter change wiped the notes the lab
      // had just promised to keep "for this session". Notes change only
      // through save / delete / the unblock re-read.
    });
  }, []);

  const onAnswered = useCallback(
    (scenarioId: string, correct: boolean) => {
      // A card reports once, when the RIGHT option is reached; `correct` says
      // whether the first pick was right (kept for the REVIEW's "your run").
      // A remounted card reports again; the first report stays.
      setAnswers((prev) => (scenarioId in prev ? prev : { ...prev, [scenarioId]: correct }));
      void updateDrumProgress((s) => {
        const m = s.modules[modId] ?? emptyDrumChapter();
        if (scenarioId in m.answers) return;
        s.modules[modId] = { ...m, answers: { ...m.answers, [scenarioId]: correct } };
      });
    },
    [modId],
  );

  /** The chapter's interactive reached its goal (this session + stored). */
  const onInteractive = useCallback(() => {
    const id = modIdRef.current;
    setInteractive((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    void updateDrumProgress((s) => {
      const m = s.modules[id] ?? emptyDrumChapter();
      s.modules[id] = { ...m, interactive: true };
    });
  }, []);

  const onSaveNote = useCallback(async (note: TuningNote): Promise<NoteSaveResult> => {
    // The list shows what the store HOLDS (toddler pass 1): the old merge
    // put the note the 24-note cap had just dropped back on screen as
    // "saved", and "Saved on this device" was shown before — and whether or
    // not — the write landed. A guest's notes live in memory for this
    // session only, capped the same way.
    const s = await saveTuningNote(note);
    if (s.saved) {
      setNotes(listed(s.notes));
      return 'saved';
    }
    if (s.blocked) {
      setNotes((prev) => withNote(prev, note));
      return 'session';
    }
    return 'failed';
  }, [listed]);
  const onDeleteNote = useCallback(async (id: string): Promise<NoteDeleteResult> => {
    // The row goes when the store says it went (toddler pass 2): the old
    // optimistic filter + `void deleteTuningNote` hid a failed write — the
    // row vanished, the note stayed on the device and was back next visit.
    // The store's list is also the LAST word over a save still in flight
    // (the queue runs in order), so a deleted row can never be put back by it.
    // A note the device never took is only on this screen: it just goes.
    if (unsavedRef.current.some((n) => n.id === id)) {
      const rest = unsavedRef.current.filter((n) => n.id !== id);
      unsavedRef.current = rest;
      setUnsaved(rest);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return 'session';
    }
    const s = await deleteTuningNote(id);
    if (s.saved) {
      setNotes(listed(s.notes));
      return 'deleted';
    }
    if (s.blocked) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return 'session';
    }
    return 'failed';
  }, [listed]);
  const unsavedIds = useMemo(() => new Set(unsaved.map((n) => n.id)), [unsaved]);

  const scenarios = scenariosForChapter(mod.id);
  const answeredCount = scenarios.filter((s) => s.id in answers).length;
  const needsInteractive = DRUM_NEEDS_INTERACTIVE[mod.id];
  const complete = answeredCount === scenarios.length && (!needsInteractive || interactive.has(mod.id));
  const done = doneIds.has(mod.id);

  /** THE CREDIT ACTION: bank this chapter. Never navigates. */
  const bank = useCallback(() => {
    setDoneIds((prev) => (prev.has(modId) ? prev : new Set([...prev, modId])));
    void updateDrumProgress((s) => {
      const m = s.modules[modId] ?? emptyDrumChapter();
      s.modules[modId] = { ...m, done: true };
    });
  }, [modId]);

  // BANK ON COMPLETION: the moment the requirement is met, before any navigation.
  useEffect(() => {
    if (loaded && complete && !done) bank();
  }, [loaded, complete, done, bank]);

  const setStep = useCallback((i: number) => {
    if (!loadedRef.current) movedRef.current = true;
    setStepRaw(i);
    void updateDrumProgress((s) => {
      s.lastStep = i;
    });
  }, []);
  const onSteps = useCallback((t: string[]) => {
    setStepTitles((prev) => (prev.length === t.length && prev.every((x, i) => x === t[i]) ? prev : t));
  }, []);
  const stepCount = DRUM_STEP_COUNTS[mod.id] ?? stepTitles.length;
  const stepIdx = Math.min(step, Math.max(0, stepCount - 1));

  const go = useCallback(
    (i: number) => {
      const target = DRUM_CHAPTERS[Math.max(0, Math.min(DRUM_CHAPTERS.length - 1, i))];
      if (!target) return;
      if (target.id === modId) {
        setEndState(null);
        setStep(0);
        return;
      }
      openModule(target.id, 0);
    },
    [modId, openModule, setStep],
  );
  /** PREV on a chapter's first step → the previous chapter's LAST step. */
  const rollPrev = useCallback(() => {
    const prev = DRUM_CHAPTERS[idx - 1];
    if (!prev) return;
    openModule(prev.id, Math.max(0, DRUM_STEP_COUNTS[prev.id] - 1));
  }, [idx, openModule]);
  const showEnd = useCallback(() => {
    void updateDrumProgress(() => {}).then(setEndState);
  }, []);
  const unEnd = useCallback(() => setEndState(null), []);
  const beforeAdvance = useCallback(() => {
    if (complete && !done) bank();
  }, [complete, done, bank]);
  const sub = useMemo(
    () => (stepCount > 1 ? { index: stepIdx, count: stepCount, titles: stepTitles, go: setStep, onRollPrev: rollPrev } : undefined),
    [stepCount, stepIdx, stepTitles, setStep, rollPrev],
  );
  const units = useMemo(() => DRUM_CHAPTERS.map((x) => ({ id: x.id, title: x.title, done: doneIds.has(x.id) })), [doneIds]);

  const doReset = () =>
    void resetDrumPractice().then((s) => {
      // Credit only grows: a guest's store reads back empty, so the set is
      // merged, never replaced.
      setDoneIds((prev) => new Set([...prev, ...DRUM_CHAPTERS.filter((x) => s.modules[x.id]?.done).map((x) => x.id)]));
      setInteractive(new Set());
      setAnswers({});
      setRunId((r) => r + 1);
      openModule('sound', 0);
    });
  const confirmReset = () => {
    const message = `Starts ${DRUM_LAB_TITLE} again from Chapter 1. Credit you have already earned stays, and so do your tuning notes.`;
    if (Platform.OS === 'web') {
      const confirm = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
      if (typeof confirm !== 'function' || confirm(`Start a fresh practice run? ${message}`)) doReset();
      return;
    }
    confirmDialog('Start a fresh practice run?', message, 'Start over', doReset);
  };

  const nav = useLabNav({
    units,
    index: Math.max(0, idx),
    ending: !!endState,
    go,
    beforeAdvance,
    finish: showEnd,
    unEnd,
    sub,
    reset: { label: 'START OVER (PRACTICE)', run: confirmReset },
  });

  // ONE line at the top of a chapter's first step (the full objective is on
  // CONTENTS and the REVIEW page): a rack well is short, and the prompt must
  // not be pushed below the fold.
  const head = <Text style={styles.objectiveLabel}>{`CHAPTER ${mod.num} GOAL · ${mod.goal}`}</Text>;
  const standing = scenarios.length
    ? `${answeredCount} of ${scenarios.length} decisions right${needsInteractive ? `, interactive ${interactive.has(mod.id) ? 'done' : 'not yet'}` : ''}`
    : needsInteractive
      ? interactive.has(mod.id) ? 'done' : 'not yet'
      : '';
  const tail = (
    <>
      <TakeawayCard>{mod.takeaway}</TakeawayCard>
      {done ? (
        <Text style={styles.requirement}>This chapter is credited. Review it any time — practising never removes credit.</Text>
      ) : (
        <>
          <Text style={styles.requirement}>{`TO EARN CREDIT · ${mod.credit}${standing ? ` — ${standing}.` : ''}`}</Text>
          <Text style={styles.requirement}>Credit lands the moment it is met. You can move on and come back any time.</Text>
        </>
      )}
    </>
  );
  const readWrap = (body: ReactNode) => (
    <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
      {body}
      <LabNextButton />
    </ScrollView>
  );
  const host: StepHost = { step: stepIdx, setStep, onSteps, head, tail, readWrap, hidden: !!endState };

  let end: ReactNode = null;
  if (endState) {
    const cleared = new Set<string>([...doneIds, ...DRUM_CHAPTERS.filter((x) => endState.modules[x.id]?.done).map((x) => x.id)]);
    end = (
      <LabEndScreen
        labTitle={`${DRUM_LAB_TITLE}: ${SUBTITLE}`}
        units={DRUM_CHAPTERS.map((x) => ({ id: x.id, label: x.title, detail: x.credit }))}
        cleared={cleared}
        mode="progress"
        noun="chapter"
        onJump={(id) => openModule(id as DrumChapterId, 0)}
        // "From the start": Chapter 1 opens fresh even when it is the chapter
        // kept mounted under this screen (the run counter remounts it).
        onPracticeAgain={() => {
          setRunId((r) => r + 1);
          openModule('sound', 0);
        }}
        onDone={() => navigation.goBack()}
        bottomInset
      />
    );
  }

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <LabHeader
          title={endState ? DRUM_LAB_TITLE.toUpperCase() : mod.title.toUpperCase()}
          subtitle={endState ? 'What’s left' : `${DRUM_LAB_TITLE}: ${SUBTITLE}${done ? ' · credited' : ''}`}
          right={<AccuracyNote compact detail={ACCURACY_DETAIL} />}
        />
        <LabNavBar nav={nav} />
        {end}
        {/* The chapter stays MOUNTED under the what's-left screen (toddler
            pass 2): FINISH ›, or "What's left" in CONTENTS from any step,
            used to unmount it, so ‹ PREV came back to a fresh chapter — Chapter
            7's cleared cases, Chapter 3's half-evened head, Chapter 6's faders
            and Chapter 5's met goals all gone, the interactive's credit to be
            earned again from zero. Hidden, it keeps its state; the host's
            `hidden` flag stops its sound and its animation. */}
        <View style={end ? styles.gone : styles.body} accessibilityElementsHidden={!!end} importantForAccessibility={end ? 'no-hide-descendants' : 'auto'}>
          <StepHostContext.Provider value={host}>
            <Component key={`${mod.id}:${runId}`} onAnswered={onAnswered} onInteractive={onInteractive} answers={answers} notes={notes} unsavedIds={unsavedIds} onSaveNote={onSaveNote} onDeleteNote={onDeleteNote} guest={resolved && guest} preview={preview} />
          </StepHostContext.Provider>
        </View>
      </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1 },
  gone: { display: 'none' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  objectiveLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6, lineHeight: 14 },
  requirement: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, textAlign: 'center', lineHeight: 16 },
});
