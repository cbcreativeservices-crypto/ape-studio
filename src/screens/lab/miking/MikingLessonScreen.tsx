/**
 * MikingLessonScreen — route `MikingLesson { id }` (blueprint §7, §8). ONE
 * lesson, eight pages, each a run of steps on the shared lab strip in
 * sub-step mode (the Drum Tuning host shape, DrumTuningLabScreen.tsx):
 *
 *     ‹ KICK DRUM                                        ⚖
 *     [⏮] [‹ PREV]   PAGE 3 · STEP 2 / 3 ▾   [NEXT ›]
 *
 * FULLY SILENT (owner 2026-10-04): no audio anywhere in the Miking Labs.
 *
 * CREDIT (ruling §16.1, like the other training labs): a page banks THE
 * MOMENT its requirement is met — its checks answered right (a retry is
 * free) and its interactive reached — on the event, never on NEXT; the
 * Sources page, which has no requirement, banks on NEXT / FINISH. Credit only
 * grows: START OVER (PRACTICE) clears answers, interactives and the place.
 *
 * WHO IS SAVED (useTier, every render): a member / free account is written;
 * a guest or an unknown tier is held for the sign-in hand-off; a members-only
 * PREVIEW earns nothing. A failed read shows the shared UNREADABLE note and
 * every page stays open (D51). Labs never block navigation.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { confirmDialog } from '../../../lib/confirm';
import { safeGoBack } from '../../../lib/safeGoBack';
import { useTier } from '../../../features/commercial/useTier';
import { persistAllowed } from '../../../features/commercial/tier';
import { LabEndScreen } from '../kit/LabEndScreen';
import { ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { PAGE_IDS, type Lesson, type PageId, type VariantId } from './engine/model/types.ts';
import { StepHostContext, type StepHost } from './engine/steps';
import { TakeawayCard } from './engine/kit';
import { bankPage, lessonProgress, recordAnswer, recordInteractive, recordPlace, clearMikingPracticeRun, setMikingSaveBlocked, useMikingHydrated, useMikingProgress, useMikingUnreadable } from './engine/progress/mikingProgress';
import { lessonById } from './data/lessons';
import { lessonArt } from './data/lessonArt';
import type { LessonArt } from './engine/scene/sceneTypes.ts';
import type { PageProps } from './pages/pageTypes';
import { PInstrument } from './pages/PInstrument';
import { PMicrophone } from './pages/PMicrophone';
import { PPlacement } from './pages/PPlacement';
import { PContext } from './pages/PContext';
import { PTwoMic } from './pages/PTwoMic';
import { PPractice, PSources, PTroubleshoot } from './pages/PReadPages';

const PAGE_COMPONENTS: Record<PageId, (p: PageProps) => ReactNode> = {
  instrument: PInstrument,
  microphone: PMicrophone,
  placement: PPlacement,
  context: PContext,
  twoMic: PTwoMic,
  troubleshoot: PTroubleshoot,
  practice: PPractice,
  sources: PSources,
};

/** Steps per page (the strip's count before a page reports its titles). */
const STEP_COUNTS: Record<PageId, number> = { instrument: 2, microphone: 3, placement: 3, context: 3, twoMic: 3, troubleshoot: 1, practice: 1, sources: 1 };

/** A page's requirement is met (pure; tested). */
export function pageComplete(lesson: Lesson, page: PageId, answers: Readonly<Record<string, boolean>>, interactive: ReadonlySet<string>): boolean {
  const c = lesson.pages[page].credit;
  if (c.scenarios.length === 0 && !c.interactive) return false; // banks on NEXT / FINISH
  return c.scenarios.every((id) => id in answers) && (!c.interactive || interactive.has(c.interactive));
}

export function MikingLessonScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params ?? {}) as { id?: string; page?: string };
  const lesson = lessonById(params.id);
  const art = params.id ? lessonArt(params.id) : undefined;
  const insets = useSafeAreaInsets();
  if (!lesson || !art) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <LabHeader title="MIKING LABS" subtitle="Lesson not found" />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This lesson is not available in this version of the app.</Text>
          <Text style={styles.link} onPress={() => safeGoBack(navigation)} accessibilityRole="button">
            ‹ Back
          </Text>
        </View>
      </View>
    );
  }
  return <LessonHost lesson={lesson} art={art} startPage={params.page} />;
}

function devStartPage(fromParams?: string): PageId | null {
  if (fromParams && (PAGE_IDS as readonly string[]).includes(fromParams)) return fromParams as PageId;
  // The web preview harness only (`#labpreview/MikingLesson/M01` + `?page=`).
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    const m = /[?&]page=([A-Za-z]+)/.exec(window.location.search);
    if (m && (PAGE_IDS as readonly string[]).includes(m[1])) return m[1] as PageId;
  }
  return null;
}

function LessonHost({ lesson, art, startPage }: { lesson: Lesson; art: LessonArt; startPage?: string }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const tier = useTier();
  const canSave = persistAllowed(tier);
  const preview = tier === 'preview';
  setMikingSaveBlocked(!canSave);

  const progress = useMikingProgress();
  const hydrated = useMikingHydrated();
  const unreadable = useMikingUnreadable();
  const lp = lessonProgress(progress, lesson.id);
  const answers = lp.answers;
  const interactiveDone = useMemo(() => new Set(lp.interactive), [lp.interactive]);
  const doneIds = useMemo(() => new Set<string>(lp.done), [lp.done]);

  const dev = useMemo(() => devStartPage(startPage), [startPage]);
  const [pageIdx, setPageIdx] = useState(() => (dev ? PAGE_IDS.indexOf(dev) : 0));
  const [step, setStepRaw] = useState(0);
  const [stepTitles, setStepTitles] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);
  const [runId, setRunId] = useState(0);
  const [variant, setVariant] = useState<VariantId>(lesson.model.defaultVariant);
  const page = PAGE_IDS[pageIdx];
  const content = lesson.pages[page];

  // RESUME once, for a learner whose record is theirs to restore (never a
  // guest or a preview), and never over a move already made.
  const moved = useRef(!!dev);
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current || !hydrated || !canSave) return;
    resumed.current = true;
    if (moved.current || !lp.lastPage) return;
    setPageIdx(Math.max(0, PAGE_IDS.indexOf(lp.lastPage)));
    setStepRaw(lp.lastStep ?? 0);
  }, [hydrated, canSave, lp.lastPage, lp.lastStep]);

  const goPage = useCallback(
    (i: number, atStep = 0) => {
      moved.current = true;
      const p = PAGE_IDS[Math.max(0, Math.min(PAGE_IDS.length - 1, i))];
      setEnding(false);
      setPageIdx(PAGE_IDS.indexOf(p));
      setStepRaw(atStep);
      setStepTitles([]);
      void recordPlace(lesson.id, p, atStep);
    },
    [lesson.id],
  );
  const setStep = useCallback(
    (i: number) => {
      moved.current = true;
      setStepRaw(i);
      void recordPlace(lesson.id, PAGE_IDS[pageIdx], i);
    },
    [lesson.id, pageIdx],
  );
  const onSteps = useCallback((t: string[]) => setStepTitles((prev) => (prev.length === t.length && prev.every((x, i) => x === t[i]) ? prev : t)), []);

  const onAnswered = useCallback((id: string, ok: boolean) => void recordAnswer(lesson.id, id, ok), [lesson.id]);
  const onInteractive = useCallback((id: string) => void recordInteractive(lesson.id, id), [lesson.id]);

  // BANK ON COMPLETION: the moment the requirement is met.
  const complete = pageComplete(lesson, page, answers, interactiveDone);
  const done = doneIds.has(page);
  useEffect(() => {
    if (complete && !done) void bankPage(lesson.id, page);
  }, [complete, done, lesson.id, page]);
  const beforeAdvance = useCallback(() => {
    const c = content.credit;
    if (!done && (complete || (c.scenarios.length === 0 && !c.interactive))) void bankPage(lesson.id, page);
  }, [content, done, complete, lesson.id, page]);

  const stepCount = stepTitles.length || STEP_COUNTS[page];
  const stepIdx = Math.min(step, Math.max(0, stepCount - 1));
  const sub = useMemo(
    () =>
      stepCount > 1
        ? { index: stepIdx, count: stepCount, titles: stepTitles, go: setStep, onRollPrev: () => goPage(pageIdx - 1, Math.max(0, STEP_COUNTS[PAGE_IDS[Math.max(0, pageIdx - 1)]] - 1)) }
        : undefined,
    [stepCount, stepIdx, stepTitles, setStep, goPage, pageIdx],
  );
  const units = useMemo(() => PAGE_IDS.map((id) => ({ id, title: lesson.pages[id].title, done: doneIds.has(id) })), [lesson, doneIds]);

  const doReset = () =>
    void clearMikingPracticeRun(lesson.id).then(() => {
      setRunId((r) => r + 1);
      goPage(0);
    });
  const confirmReset = () => {
    const message = `Starts ${lesson.title} again from page 1. Pages you have already been credited for stay credited.`;
    if (Platform.OS === 'web') {
      const c = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
      if (typeof c !== 'function' || c(`Start a fresh practice run? ${message}`)) doReset();
      return;
    }
    confirmDialog('Start a fresh practice run?', message, 'Start over', doReset);
  };

  const nav = useLabNav({
    units,
    index: pageIdx,
    ending,
    go: (i) => goPage(i),
    beforeAdvance,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    sub,
    reset: { label: 'START OVER (PRACTICE)', run: confirmReset },
  });

  const c = content.credit;
  const answered = c.scenarios.filter((id) => id in answers).length;
  const standing = [c.scenarios.length ? `${answered} of ${c.scenarios.length} checks right` : '', c.interactive ? `activity ${interactiveDone.has(c.interactive) ? 'done' : 'not yet'}` : ''].filter(Boolean).join(', ');
  const head = <Text style={styles.objective}>{`PAGE ${pageIdx + 1} GOAL · ${content.goal}`}</Text>;
  const tail = (
    <>
      <TakeawayCard>{content.takeaway}</TakeawayCard>
      {done ? (
        <Text style={styles.requirement}>This page is credited. Review it any time — practising never removes credit.</Text>
      ) : (
        <Text style={styles.requirement}>{`TO EARN CREDIT · ${c.note}${standing ? ` — ${standing}.` : ''}`}</Text>
      )}
    </>
  );
  const readWrap = (body: ReactNode) => (
    <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
      {body}
      <LabNextButton />
    </ScrollView>
  );
  const host: StepHost = { step: stepIdx, setStep, onSteps, head, tail, readWrap, hidden: ending };
  const Page = PAGE_COMPONENTS[page];

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <LabHeader
          title={ending ? lesson.title.toUpperCase() : content.title.toUpperCase()}
          subtitle={ending ? 'What’s left' : `${lesson.title}: ${lesson.subtitle}${done ? ' · credited' : ''}`}
          right={<AccuracyNote compact detail={lesson.accuracyDetail} />}
        />
        <LabNavBar nav={nav} />
        {unreadable && !ending ? <ProgressUnreadableNote style={styles.unreadable} /> : null}
        {ending ? (
          <LabEndScreen
            labTitle={`Miking: ${lesson.title}`}
            units={PAGE_IDS.map((id) => ({ id, label: lesson.pages[id].title, detail: lesson.pages[id].credit.note }))}
            cleared={doneIds}
            unreadable={unreadable}
            mode="progress"
            noun="page"
            onJump={(id) => goPage(PAGE_IDS.indexOf(id as PageId))}
            onPracticeAgain={() => {
              setRunId((r) => r + 1);
              goPage(0);
            }}
            onDone={() => safeGoBack(navigation)}
            bottomInset
          />
        ) : null}
        {/* The page stays MOUNTED under the what's-left screen (the Drum
            Tuning rule): ‹ PREV returns to it exactly as it was. */}
        <View style={ending ? styles.gone : styles.body} accessibilityElementsHidden={ending} importantForAccessibility={ending ? 'no-hide-descendants' : 'auto'}>
          <StepHostContext.Provider value={host}>
            <Page
              key={`${page}:${runId}`}
              lesson={lesson}
              art={art}
              answers={answers}
              onAnswered={onAnswered}
              onInteractive={onInteractive}
              interactiveDone={interactiveDone}
              variant={variant}
              setVariant={setVariant}
              hidden={ending}
              canSave={canSave}
              preview={preview}
            />
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
  unreadable: { marginHorizontal: 12, marginBottom: 6 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  objective: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6, lineHeight: 14 },
  requirement: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, textAlign: 'center', lineHeight: 16 },
  missing: { padding: 20, gap: 12 },
  missingText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 21 },
  link: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 1, minHeight: 44 },
});
