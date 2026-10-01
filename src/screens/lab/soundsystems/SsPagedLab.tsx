/**
 * SsPagedLab — the Sound Systems Lab's paged host: kit/PagedLab's shell (the
 * SHARED LAB NAVIGATION — kit/LabNavBar, owner 2026-09-30: LabHeader over one
 * strip `[⏮] [‹ PREV]  MODULE / n / N ▾  [NEXT ›]`, CONTENTS from the readout,
 * the appended understanding check, progress in ape:<labId>:v1) plus the ONE
 * thing this lab needs that the shared shell does not offer — a page may
 * declare `rack: true` and receive the FULL HEIGHT with no ScrollView of its
 * own, the EQ / Cymatics host idiom, so its RackUnit can pin the display and
 * the dock and own the scroll well between them. Under LabNavProvider the
 * rack well gets the in-flow NEXT / FINISH by itself; a document page draws
 * it at the end of its scroll. Nothing is pinned at the bottom.
 *
 * FINISH opens kit/LabEndScreen (what's left) in place; DONE goes back to the
 * Sound Systems hub. It is NEVER held: the owner's rule is "labs never block
 * navigation" — an unpassed check is listed on the end screen, not a wall
 * (the old `finishBlocked` broke that rule and is gone).
 *
 * WHY A LOCAL HOST (2026-09-25): kit/PagedLab is shared by thirty-odd labs
 * under an additive-only contract and sits outside this pass's scope, so the
 * rack branch lives here. Everything else is kept identical on purpose —
 * same storage keys, same check page, same strip — so a learner's saved
 * place survives and the five modes look like every other paged lab. If the
 * owner later wants the branch upstream it is a `rack?: boolean` on PageDef
 * and one conditional around the scroll view.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScrollLockProvider } from '../scrollLock';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
// Tablet (owner 2026-09-29): a document page — prose and figures, each
// figure opening full screen — reads in the centred reading column instead of
// running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { animationsAllowed } from '../../../features/settings/a11y';
import { loadPagedProgress, savePagedProgress, type PagedProgress } from '../../../features/lab/pagedProgress';
import { confirmDialog } from '../../../lib/confirm';
import { LabUnderstandingCheck } from '../../../components/LabUnderstandingCheck';
import { UNDERSTANDING_UNIT, understandingFor } from '../../../features/lab/understanding';
import { markLabUnit, registerLabUnits, useLabClearedUnits } from '../../../features/lab/labCompletion';
import type { PageCtx } from '../kit/PagedLab';
import { LabEndScreen, type LabEndUnit } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav, type LabNavUnit } from '../kit/LabNavBar';
import type { SsPageDef } from './rackLayout';
import { PageMemoryKey, clearPageMemory } from './pageMemory';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { getLabPreview } from '../../../features/lab/labPreviewStore';
import { setSoundSystemsSaveBlocked } from '../../../features/soundsystems/progress';

function useOsReduceMotion(): boolean {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => { if (alive) setRm(!!v); })
      .catch(() => { /* older platforms do not report it */ });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setRm(!!v));
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return rm;
}

export function SsPagedLab({ labId, title, subtitle, pages, onPageDone }: {
  labId: string;
  title: string;
  subtitle: string;
  pages: SsPageDef[];
  onPageDone?: (index: number) => void;
}) {
  // The understanding check is appended exactly as kit/PagedLab appends it:
  // opt-in by data, self-marking, the lab's credit unit.
  const check = understandingFor(labId);
  const pagesWithCheck = useMemo<SsPageDef[]>(
    () =>
      check
        ? [
            ...pages,
            {
              title: 'Check your understanding',
              short: 'CHECK',
              manualDone: true,
              Component: ({ ctx }: { ctx: PageCtx }) => (
                <LabUnderstandingCheck
                  labTitle={title}
                  questions={check}
                  passed={ctx.isDone}
                  onPassed={() => {
                    ctx.markDone();
                    registerLabUnits(labId as never, [UNDERSTANDING_UNIT]);
                    markLabUnit(labId as never, UNDERSTANDING_UNIT);
                  }}
                />
              ),
            },
          ]
        : pages,
    [check, pages, labId, title],
  );

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [progress, setProgress] = useState<PagedProgress | null>(null);
  const progressRef = useRef<PagedProgress | null>(null);
  const [page, setPage] = useState(0);
  // The what's-left end screen (owner 2026-09-29) — shown in place of the page.
  const [ending, setEnding] = useState(false);
  const bankedCheck = useLabClearedUnits(labId);
  const [resetSeq, setResetSeq] = useState(0);
  const [dragLocked, setDragLocked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const osReduceMotion = useOsReduceMotion();
  const reduceMotion = osReduceMotion || !animationsAllowed();

  // Guest rule (owner 2026-08-12, the cable labs' rule) and PREVIEW EARNS
  // NOTHING (2026-09-01): a signed-out guest or a members-only preview
  // neither restores a place nor saves one (bug hunt 2026-09-29). `resolved`
  // is required — the provider boots at 'anonymous'.
  const { entitlement, resolved } = useEntitlement();
  const noSaveRef = useRef(false);
  noSaveRef.current = getLabPreview().active || (resolved && entitlement === 'anonymous');
  setSoundSystemsSaveBlocked(noSaveRef.current);
  // Before the saved progress loads (bug hunt 2026-09-29): a page that marks
  // itself on mount (the bench intro) is queued, not dropped, and a learner
  // who has already moved is not yanked back to the saved page.
  const pendingDoneRef = useRef<number[]>([]);
  const navigatedRef = useRef(false);
  const pageRef = useRef(0);
  pageRef.current = page;
  const loadedNoSaveRef = useRef(false);

  const persist = useCallback((patch: Partial<PagedProgress>) => {
    const base = progressRef.current;
    if (!base) return;
    const next = { ...base, ...patch };
    progressRef.current = next;
    setProgress(next);
    // A copy restored while no-save (the empty guest copy) is never written,
    // even once the tier clears (bug pass 3, 2026-09-30): a signed-in learner
    // whose first tier read failed reads 'anonymous' until a retry lands, and
    // the empty copy then overwrote their completed pages — credit removed.
    if (!noSaveRef.current && !loadedNoSaveRef.current) void savePagedProgress(labId, next);
  }, [labId]);
  const markPageDone = useCallback((i: number) => {
    const base = progressRef.current;
    if (!base) {
      if (!pendingDoneRef.current.includes(i)) pendingDoneRef.current.push(i);
      return;
    }
    const fresh = !base.completed.includes(i);
    const completed = fresh ? [...base.completed, i].sort((a, b) => a - b) : base.completed;
    persist({ completed, done: completed.length >= pagesWithCheck.length });
    // The appended check page is not one of the lab's pages (kit/PagedLab's
    // 2026-09-21 rule): it banks its own UNDERSTANDING_UNIT above.
    if (fresh && i < pages.length) onPageDone?.(i);
  }, [persist, pagesWithCheck.length, pages.length, onPageDone]);

  // ⛔ WAIT FOR `resolved` BEFORE RESTORING (bug pass 3, 2026-09-30; the
  // kit/PagedLab fix). A load that landed first read noSaveRef as false (the
  // tier was still unknown), so a signed-out device restored the previous
  // account's place. `resolved` flips once, bounded — a signed-in learner is
  // not held; pages marked or reached meanwhile are queued above and merged.
  useEffect(() => {
    if (!resolved) return;
    let alive = true;
    void loadPagedProgress(labId).then((p) => {
      if (!alive) return;
      loadedNoSaveRef.current = noSaveRef.current;
      const loaded = noSaveRef.current ? { completed: [], lastPage: 0, done: false } : p;
      progressRef.current = loaded;
      setProgress(loaded);
      if (navigatedRef.current) persist({ lastPage: pageRef.current });
      else setPage(Math.min(loaded.lastPage, pagesWithCheck.length - 1));
      const queued = pendingDoneRef.current;
      pendingDoneRef.current = [];
      queued.forEach(markPageDone);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId, pagesWithCheck.length, resolved]);

  const goTo = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(pagesWithCheck.length - 1, Math.round(i)));
    navigatedRef.current = true;
    setEnding(false);
    setPage(idx);
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    persist({ lastPage: idx });
  }, [pagesWithCheck.length, persist, reduceMotion]);
  const markDone = useCallback(() => markPageDone(page), [markPageDone, page]);
  // The in-mode RESET (bug hunt 2026-09-30): the session's page memory is
  // dropped and the current page re-mounted, so a capstone / console starts
  // its working state fresh.
  //
  // A PRACTICE reset, never a credit wipe (owner 2026-09-29, answering this
  // lab's RESET: "resets start a fresh practice run; they never wipe banked
  // credit"; bug hunt 2026-09-30 day). It used to delete the mode's completed
  // pages and its capstones / exercises / solved faults — the rows the hub's
  // WHAT IS LEFT counts toward credit. Now it drops the session's working
  // state and re-mounts from page 1; everything completed stays completed
  // (the fault bench already says "SOLVED BEFORE" for a re-run).
  const doReset = () => {
    clearPageMemory([labId]);
    goTo(0);
    setResetSeq((n) => n + 1);
  };
  const confirmReset = () => {
    const message = `Starts ${title} again from its first page. Pages, capstones, exercises and faults you have completed stay credited.`;
    if (Platform.OS === 'web') {
      // react-native-web's Alert is a no-op: keep the guard with the browser's confirm.
      const confirm = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
      if (typeof confirm !== 'function' || confirm(`Start a fresh practice run? ${message}`)) doReset();
      return;
    }
    confirmDialog('Start a fresh practice run?', message, 'Start over', doReset);
  };

  const def = pagesWithCheck[page];
  const Page = def.Component;
  const isDone = !!progress?.completed.includes(page);
  const ctx: PageCtx = { reduceMotion, markDone, isDone, goTo };
  const rack = !!def.rack;
  // Per-page working state survives PREV / NEXT for the session
  // (pageMemory.ts, bug hunt 2026-09-29).
  const memoryKey = `${labId}:${page}`;

  // What's-left inputs: a page counts when it is done in this mode's own
  // progress; the appended check also when its credit unit is banked.
  const endUnits: LabEndUnit[] = pagesWithCheck.map((p, i) =>
    check && i === pages.length
      ? { id: String(i), label: 'Check your understanding', kind: 'check', detail: 'Every answer correct — retry until you are.' }
      : { id: String(i), label: p.title },
  );
  const endCleared = new Set<string>();
  pagesWithCheck.forEach((_, i) => {
    const banked = !!check && i === pages.length && bankedCheck.has(UNDERSTANDING_UNIT);
    if (banked || progress?.completed.includes(i)) endCleared.add(String(i));
  });
  // pagesWithCheck, NOT pages: CONTENTS must list the appended check too.
  const navUnits: LabNavUnit[] = pagesWithCheck.map((p, i) => ({
    id: String(i),
    title: p.title,
    done: endCleared.has(String(i)),
    kind: check && i === pages.length ? 'check' : 'unit',
  }));
  const finish = useCallback(() => setEnding(true), []);
  const unEnd = useCallback(() => setEnding(false), []);
  // NEXT / FINISH mark the page unless it marks itself (a check, an exercise
  // that grades its own answer). Under the hook's one 400 ms tap lock; never
  // on a CONTENTS jump.
  const beforeAdvance = useCallback(
    (from: number) => {
      if (!pagesWithCheck[from]?.manualDone) markDone();
    },
    [pagesWithCheck, markDone],
  );
  const nav = useLabNav({
    units: navUnits,
    index: page,
    ending,
    go: goTo,
    beforeAdvance,
    finish,
    unEnd,
    reset: { label: 'START OVER (PRACTICE)', run: confirmReset },
  });

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        {/* The standing calibration note rides every page. A rack page has no
            scroll of its own to carry the full chip, so it wears the compact
            one on the header, the Cymatics host's placement. */}
        <LabHeader title={ending ? 'Where you are' : def.title} subtitle={title} right={rack && !ending ? <AccuracyNote compact /> : undefined} />
        <LabNavBar nav={nav} />
        {ending ? (
          <LabEndScreen
            labTitle={title}
            units={endUnits}
            cleared={endCleared}
            mode="progress"
            noun="page"
            onJump={(id) => goTo(Number(id))}
            onPracticeAgain={() => goTo(0)}
            onDone={() => navigation.goBack()}
            doneLabel="DONE · BACK TO SOUND SYSTEMS"
            bottomInset
          />
        ) : rack ? (
          // Rack page: full height — its RackUnit pins the stage and the dock,
          // owns the scroll well (and its own scroll-lock provider) and draws
          // the in-flow NEXT / FINISH at the end of the well from LabNavContext.
          <View style={styles.rackFill}>
            <PageMemoryKey.Provider value={memoryKey}>
              <Page key={`${memoryKey}:${resetSeq}`} ctx={ctx} />
            </PageMemoryKey.Provider>
          </View>
        ) : (
          <ScrollView ref={scrollRef} scrollEnabled={!dragLocked} contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollLockProvider value={setDragLocked}>
              <AccuracyNote style={styles.accuracy} />
              {page === 0 ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              <PageMemoryKey.Provider value={memoryKey}>
                <Page key={`${memoryKey}:${resetSeq}`} ctx={ctx} />
              </PageMemoryKey.Provider>
              <LabNextButton nav={nav} />
            </ScrollLockProvider>
          </ScrollView>
        )}
      </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, marginBottom: 2 },
  accuracy: { marginTop: 6, marginBottom: 4, alignSelf: 'flex-start' },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  rackFill: { flex: 1 },
});
