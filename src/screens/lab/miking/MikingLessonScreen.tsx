/**
 * MikingLessonScreen — route `MikingLesson { id }` (blueprint §7, §8). ONE
 * lesson, eight pages in JOURNEY order (docs/labs/miking/LESSON_JOURNEY.md),
 * each a run of steps on the shared lab strip in sub-step mode (the Drum
 * Tuning host shape, DrumTuningLabScreen.tsx):
 *
 *     ‹ KICK DRUM                                        ⚖
 *     [⏮] [‹ PREV]   PAGE 3 · STEP 2 / 3 ▾   [NEXT ›]
 *
 * FULLY SILENT (owner 2026-10-04): no audio anywhere in the Miking Labs.
 *
 * CREDIT (ruling §16.1, like the other training labs): a page banks THE
 * MOMENT its requirement is met — its checks answered right (a retry is
 * free) and its interactive reached — on the event, never on NEXT; a page
 * with no requirement (ORIENT) banks on NEXT. Credit only
 * grows: START OVER (PRACTICE) clears answers, interactives and the place.
 *
 * WHO IS SAVED (useTier, every render): a member / free account is written;
 * a guest or an unknown tier is held for the sign-in hand-off; a members-only
 * PREVIEW earns nothing. A failed read shows the shared UNREADABLE note and
 * every page stays open (D51). Labs never block navigation.
 *
 * THE JOURNEY (LESSON_JOURNEY §2–§3): the learner's path (NEW / EXPERIENCED)
 * and this run's quick check live on the progress record; the FOUNDATIONS
 * (MEET IT, STARTING SETUPS) are "met" from stored credit OR from
 * what was met on screen this session (so a guest and a preview are judged
 * by what they did). Until they are met — or the quick check is passed — a
 * later page shows the Foundations card in place of its ACTIVITY; NEXT,
 * PREV and CONTENTS still go anywhere. Passing the check credits nothing.
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
import { PAGE_IDS, type Lesson, type PageId, type SourcePageId, type VariantId } from './engine/model/types.ts';
import { StepHostContext, type StepHost } from './engine/steps';
import { StandardLine, TakeawayCard } from './engine/kit';
import { bankPage, lessonProgress, recordAnswer, recordInteractive, recordPath, recordPlace, recordQuickCheck, clearMikingPracticeRun, setMikingSaveBlocked, useMikingHydrated, useMikingProgress, useMikingUnreadable } from './engine/progress/mikingProgress';
import { banksOnNext, pageComplete } from './engine/progress/credit.ts';
import { creditedPages } from './engine/progress/creditMap.ts';
import { lessonById } from './data/lessons';
import { isFoundation, journeyPageOf, pageGate, STANDARD_LINE, STANDARD_LINE_PAGES, type LearnerPath, type QuickCheckResult } from './engine/journey.ts';
import { meetKeep, pageOf, restructureLesson, setupsKeep } from './engine/restructure.ts';
import { ComposedPage, type PagePart } from './engine/compose';
import { FoundationsCard, type JourneyProps } from './engine/journeyKit';
import { PageSteps } from './engine/steps';
import { PSound } from './pages/PSound';
import { PSetting } from './pages/PSetting';
import { lessonArt } from './data/lessonArt';
import type { LessonArt } from './engine/scene/sceneTypes.ts';
import type { PageProps } from './pages/pageTypes';
import { PInstrument } from './pages/PInstrument';
import { PMicrophone } from './pages/PMicrophone';
import { PMicOnIt } from './pages/PMicOnIt';
import { PSetups } from './pages/PSetups';
import { PPlacement } from './pages/PPlacement';
import { PContext } from './pages/PContext';
import { PTwoMic } from './pages/PTwoMic';
import { PPractice, PTroubleshoot } from './pages/PReadPages';

type PageFn = (p: PageProps) => ReactNode;

/** The shared page for every id a lesson's DATA is written for: the journey
 *  pages and the three source pages MEET IT and STARTING SETUPS are built
 *  from (engine/restructure.ts). */
const SHARED_PAGES: Record<Exclude<SourcePageId, 'meet' | 'setups'>, PageFn> = {
  instrument: PInstrument,
  sound: PSound,
  setting: PSetting,
  microphone: PMicrophone,
  placement: PPlacement,
  context: PContext,
  twoMic: PTwoMic,
  troubleshoot: PTroubleshoot,
  practice: PPractice,
};

/** Steps per source page (the strip's count before a page reports its
 *  titles; a composed page counts its parts — an over-count is harmless,
 *  the step is clamped once the titles arrive). */
const STEP_COUNTS: Record<Exclude<SourcePageId, 'meet' | 'setups'>, number> = { instrument: 3, sound: 4, setting: 3, microphone: 3, placement: 4, context: 3, twoMic: 3, troubleshoot: 1, practice: 3 };
/** The engine's own steps on a composed page: STARTING SETUPS (the setups,
 *  what else the mic hears), MICROPHONES (the mic on the instrument). */
const OWN_STEPS = { setups: 2, onit: 1 } as const;

/** The journey's page components for a lesson's art: its own page for an id
 *  (art.pages), else the shared one; MEET IT, STARTING SETUPS and
 *  MICROPHONES composed from their parts (engine/compose.tsx). */
export function journeyPages(art: LessonArt): Record<PageId, PageFn> {
  const own = (art.pages ?? {}) as Partial<Record<SourcePageId, PageFn>>;
  const src = (id: Exclude<SourcePageId, 'meet' | 'setups'>): PageFn => own[id] ?? SHARED_PAGES[id];
  const compose = (name: string, parts: readonly PagePart[]): PageFn => {
    const Composed = (p: PageProps) => <ComposedPage parts={parts} props={p} />;
    Composed.displayName = name;
    return Composed;
  };
  return {
    meet: own.meet ?? compose('MeetIt', [{ key: 'instrument', Page: src('instrument') }, { key: 'sound', Page: src('sound'), keep: meetKeep }]),
    setups: own.setups ?? compose('StartingSetups', [{ key: 'setups', Page: PSetups }, { key: 'setting', Page: src('setting'), keep: setupsKeep }]),
    microphone: compose('Microphones', [{ key: 'onit', Page: PMicOnIt }, { key: 'microphone', Page: src('microphone') }]),
    placement: src('placement'),
    context: src('context'),
    twoMic: src('twoMic'),
    troubleshoot: src('troubleshoot'),
    practice: src('practice'),
  };
}

/** Steps per journey page before it reports (see STEP_COUNTS). */
export function journeyStepCount(art: LessonArt, id: PageId): number {
  const n = (s: Exclude<SourcePageId, 'meet' | 'setups'>) => art.stepCounts?.[s] ?? STEP_COUNTS[s];
  if (id === 'meet') return art.stepCounts?.meet ?? n('instrument') + n('sound');
  if (id === 'setups') return art.stepCounts?.setups ?? OWN_STEPS.setups + n('setting');
  if (id === 'microphone') return OWN_STEPS.onit + n('microphone');
  return n(id);
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

/** The web preview harness only: `&unlock=1` treats the quick check as passed
 *  so a capture can reach any stage (never the production router). */
function devUnlock(): boolean {
  return __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]unlock=1(&|$)/.test(window.location.search);
}

/** A page id from a route or the harness: a journey page, or one of the
 *  three source pages, read as the page built from it. */
function asJourneyPage(x: string | undefined): PageId | null {
  if (!x) return null;
  if ((PAGE_IDS as readonly string[]).includes(x)) return x as PageId;
  if (x === 'instrument' || x === 'sound' || x === 'setting') return journeyPageOf(x);
  return null;
}

function devStartPage(fromParams?: string): PageId | null {
  const p = asJourneyPage(fromParams);
  if (p) return p;
  // The web preview harness only (`#labpreview/MikingLesson/M01` + `?page=`).
  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    const m = /[?&]page=([A-Za-z]+)/.exec(window.location.search);
    return asJourneyPage(m?.[1]);
  }
  return null;
}

/** The web preview harness only: `&step=<n>` opens that step of the page,
 *  `&variant=<id>` that setup (captures of every stage). */
function devParam(key: 'step' | 'variant'): string | null {
  if (!(__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined')) return null;
  const m = new RegExp(`[?&]${key}=([A-Za-z0-9]+)`).exec(window.location.search);
  return m ? m[1] : null;
}

function LessonHost({ lesson: written, art, startPage }: { lesson: Lesson; art: LessonArt; startPage?: string }) {
  // The lesson as the eight-page journey serves it (MEET IT and STARTING
  // SETUPS built from the pages it was written in; engine/restructure.ts).
  const lesson = useMemo(() => restructureLesson(written), [written]);
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
  // A lesson family may supply its own page for an id (art.pages); the rest are shared.
  const PAGE_COMPONENTS = useMemo(() => journeyPages(art), [art]);
  // What happened ON SCREEN this session, kept beside the record: a preview
  // writes nothing, yet the journey must still follow what the learner did.
  const [localAnswers, setLocalAnswers] = useState<Record<string, boolean>>({});
  const [localInteractive, setLocalInteractive] = useState<ReadonlySet<string>>(() => new Set());
  const [metLocal, setMetLocal] = useState<ReadonlySet<PageId>>(() => new Set());
  const [localPath, setLocalPath] = useState<LearnerPath | null>(null);
  const [localQuick, setLocalQuick] = useState<QuickCheckResult | null>(null);
  const answers = useMemo(() => ({ ...localAnswers, ...lp.answers }), [localAnswers, lp.answers]);
  const interactiveDone = useMemo(() => new Set([...lp.interactive, ...localInteractive]), [lp.interactive, localInteractive]);
  // Stored credit, read as journey pages: a record from before the
  // 2026-10-06 restructure keeps instrument / sound / setting, which credit
  // the page built from them (engine/progress/creditMap.ts). Never erased.
  const credited = useMemo(() => creditedPages(lp.done), [lp.done]);
  const doneIds = useMemo(() => new Set<string>(credited), [credited]);
  const met = useMemo(() => new Set<PageId>([...credited, ...metLocal]), [credited, metLocal]);
  // The STARTING SETUP last looked at: the Placement Studio starts from it.
  const [startFrom, setStartFrom] = useState<string | null>(null);
  const path: LearnerPath | null = localPath ?? lp.path ?? null;
  const quick: QuickCheckResult | null = lp.quick ?? localQuick;
  const unlocked = useMemo(() => devUnlock(), []);
  const quickPassed = !!quick?.pass || unlocked;

  const dev = useMemo(() => devStartPage(startPage), [startPage]);
  const [pageIdx, setPageIdx] = useState(() => (dev ? PAGE_IDS.indexOf(dev) : 0));
  const [step, setStepRaw] = useState(() => Number(devParam('step') ?? 0) || 0);
  const [stepTitles, setStepTitles] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);
  const [runId, setRunId] = useState(0);
  const [variant, setVariant] = useState<VariantId>(() => {
    const v = devParam('variant');
    return v && lesson.model.variants.some((x) => x.id === v) ? v : lesson.model.defaultVariant;
  });
  const page = PAGE_IDS[pageIdx];
  const content = pageOf(lesson, page);

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

  const onAnswered = useCallback(
    (id: string, ok: boolean) => {
      setLocalAnswers((a) => (id in a ? a : { ...a, [id]: ok }));
      void recordAnswer(lesson.id, id, ok);
    },
    [lesson.id],
  );
  const onInteractive = useCallback(
    (id: string) => {
      setLocalInteractive((s0) => (s0.has(id) ? s0 : new Set([...s0, id])));
      void recordInteractive(lesson.id, id);
    },
    [lesson.id],
  );
  const markMet = useCallback((p: PageId) => setMetLocal((m) => (m.has(p) ? m : new Set([...m, p]))), []);

  // BANK ON COMPLETION: the moment the requirement is met.
  const complete = pageComplete(lesson, page, answers, interactiveDone);
  const done = doneIds.has(page);
  useEffect(() => {
    if (complete && !done) void bankPage(lesson.id, page);
    if (complete) markMet(page);
  }, [complete, done, lesson.id, page, markMet]);
  const beforeAdvance = useCallback(() => {
    if (!done && (complete || banksOnNext(lesson, page))) void bankPage(lesson.id, page);
    if (complete || banksOnNext(lesson, page)) markMet(page);
  }, [lesson, done, complete, page, markMet]);

  // A family's own pages (the hand drums, the guitars) may have their own step counts.
  const countOf = (id: PageId) => journeyStepCount(art, id);
  const stepCount = stepTitles.length || countOf(page);
  const stepIdx = Math.min(step, Math.max(0, stepCount - 1));
  const sub = useMemo(
    () =>
      stepCount > 1
        ? { index: stepIdx, count: stepCount, titles: stepTitles, go: setStep, onRollPrev: () => goPage(pageIdx - 1, Math.max(0, countOf(PAGE_IDS[Math.max(0, pageIdx - 1)]) - 1)) }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepCount, stepIdx, stepTitles, setStep, goPage, pageIdx, art],
  );
  const units = useMemo(() => PAGE_IDS.map((id) => ({ id, title: pageOf(lesson, id).title, done: doneIds.has(id) })), [lesson, doneIds]);

  // START OVER and PRACTISE AGAIN are one fresh practice run (toddler hunt
  // 2026-10-07): the screen resets AT ONCE — it used to wait for the device
  // write, so on slow storage START OVER looked dead (T1-02) — and PRACTISE
  // AGAIN on the what's-left screen used to keep every answer and activity,
  // so page 1 came back already finished (T1-03). Credit is never touched.
  const doReset = () => {
    void clearMikingPracticeRun(lesson.id);
    setLocalAnswers({});
    setLocalInteractive(new Set());
    setLocalQuick(null);
    setRunId((r) => r + 1);
    goPage(0);
  };
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

  // A review hint per page that never touches credit (review m7).
  const firstTry = (id: PageId) => {
    const ids = pageOf(lesson, id).credit.scenarios.filter((q) => q in answers);
    if (!ids.length) return '';
    const right = ids.filter((q) => answers[q]).length;
    return ` First try: ${right} of ${ids.length} right${right < ids.length ? ' — worth a second look' : ''}.`;
  };
  const c = content.credit;
  const answered = c.scenarios.filter((id) => id in answers).length;
  const standing = [c.scenarios.length ? `${answered} of ${c.scenarios.length} checks right` : '', c.interactive ? `activity ${interactiveDone.has(c.interactive) ? 'done' : 'not yet'}` : ''].filter(Boolean).join(', ');
  const head = (
    <>
      <Text style={styles.objective}>
        <Text style={styles.objectiveKey}>{`Page ${pageIdx + 1} goal: `}</Text>
        {content.goal}
      </Text>
      {STANDARD_LINE_PAGES.includes(page) ? <StandardLine text={STANDARD_LINE} /> : null}
    </>
  );
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
  const journey: JourneyProps = {
    path,
    choosePath: (p) => {
      setLocalPath(p);
      void recordPath(lesson.id, p);
    },
    quick,
    recordQuick: (r) => {
      setLocalQuick((q) => q ?? r);
      void recordQuickCheck(lesson.id, r);
    },
    met,
    quickPassed,
    goPage: (id, atStep = 0) => goPage(PAGE_IDS.indexOf(id), atStep),
    titleOf: (id) => pageOf(lesson, id).title,
    noun: lesson.noun,
    here: page,
  };
  const gated = pageGate(page, met, quickPassed) === 'foundations';
  const host: StepHost = { step: stepIdx, setStep, onSteps, head, tail: gated ? null : tail, readWrap, hidden: ending };
  // PAGE_COMPONENTS (above): a lesson's own page for an id (the kit-level
  // lessons, the speaker module, the hand drums), else the shared page.
  const Page = gated ? FoundationsPage : PAGE_COMPONENTS[page];

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
            units={PAGE_IDS.map((id) => ({ id, label: pageOf(lesson, id).title, detail: `${pageOf(lesson, id).credit.note}${firstTry(id)}${quick?.pass && isFoundation(id) && !doneIds.has(id) ? ' Skipped with the quick check — open it to earn its credit.' : ''}` }))}
            cleared={doneIds}
            unreadable={unreadable}
            mode="progress"
            noun="page"
            onJump={(id) => goPage(PAGE_IDS.indexOf(id as PageId))}
            onPracticeAgain={doReset}
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
              journey={journey}
              startFrom={startFrom}
              chooseStart={setStartFrom}
            />
          </StepHostContext.Provider>
        </View>
      </View>
    </LabNavProvider>
  );
}

/** In place of a later page's activity while the foundations are not met
 *  (navigation is never gated: the strip still goes anywhere). */
function FoundationsPage({ journey }: PageProps) {
  return <PageSteps steps={[{ key: 'foundations', title: 'Built on the foundations', kind: 'READ', layout: 'read', body: <FoundationsCard journey={journey} pageTitle={journey.titleOf(journey.here)} /> }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1 },
  gone: { display: 'none' },
  unreadable: { marginHorizontal: 12, marginBottom: 6 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  // The goal is the page's point: readable sentence case at 13.5 pt (review m2).
  objective: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  objectiveKey: { color: colors.amberLabel, fontFamily: fonts.barlowSemiBold },
  requirement: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, textAlign: 'center', lineHeight: 16 },
  missing: { padding: 20, gap: 12 },
  missingText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 21 },
  link: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 1, minHeight: 44 },
});
