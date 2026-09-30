/**
 * PagedLab — the shared shell for the paged labs: header with page n of N,
 * progress dots + page list, Back/Continue, reduced-motion aware, progress
 * in ape:<labId>:v1. Pages are components receiving a small ctx.
 *
 * CONSUMERS (checked 2026-09-11) — SEVEN labs, not the original three:
 *   Sound Envelope · Speech & Voice · Smart Processors (De-Esser) ·
 *   Connector Select · Patchbay · Beginning Mixing · Advanced Mixing.
 * It is also no longer "visual-only": Connector Select and Patchbay are
 * assessment-bearing and wired to labCompletion. Re-count the importers
 * before assuming the blast radius of a change here.
 *
 * API contract (all seven labs depend on it — additive changes only):
 *   PageCtx  { reduceMotion, markDone, isDone, goTo? }
 *   PageDef  { title, short, Component, manualDone? }
 *
 * THE LAST PAGE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every lab
 * ends with a 'what's left' screen"; keep credit, always allow review and
 * redo). FINISH used to just go back. It now opens LabEndScreen in place of
 * the page: every page not yet done by name with a jump link, the check (if
 * authored) as its own row, PRACTISE AGAIN (page 1, clears nothing) and DONE.
 * FINISH is never held any more — an unpassed check is listed, not a wall.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { loadPagedProgress, resetPagedProgress, savePagedProgress, type PagedProgress } from '../../../features/lab/pagedProgress';
import { confirmDialog } from '../../../lib/confirm';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';

export type PageCtx = {
  reduceMotion: boolean;
  markDone: () => void;
  isDone: boolean;
  /** Jump to another page by index (clamped, scrolls to top, persisted).
   *  Optional so any hand-built ctx from before it existed still type-checks. */
  goTo?: (index: number) => void;
};

export type PageDef = {
  title: string;
  short: string;
  Component: (p: { ctx: PageCtx }) => JSX.Element;
  /** The page marks ITSELF done (a checks page that needs its answers): the
   *  Continue / Finish button will not mark it on the learner's behalf. (Finish
   *  used to stay disabled until it had; since owner 2026-09-29 it opens the
   *  what's-left screen, which lists the unmarked page instead.) */
  manualDone?: boolean;
};

/**
 * The OS "reduce motion" switch, subscribed — `animationsAllowed()` is a
 * synchronous read that cannot re-render this shell when the phone setting
 * flips mid-session, so the OS side is mirrored here and ORed in.
 */
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

import { LabUnderstandingCheck } from '../../../components/LabUnderstandingCheck';
import { UNDERSTANDING_UNIT, understandingFor } from '../../../features/lab/understanding';
import { markLabUnit, registerLabUnits, useLabClearedUnits, type LabKey } from '../../../features/lab/labCompletion';
import { LabEndScreen, type LabEndUnit } from './LabEndScreen';

export function PagedLab({ labId, title, subtitle, pages, onPageDone, creditLabKey }: {
  labId: string;
  title: string;
  subtitle: string;
  pages: PageDef[];
  /** ADDITIVE (2026-09-10, Patchbay lab-credit bridge): fires once each time a
   *  page is newly marked done — lets a lab feed external completion tracking
   *  (labCompletion units) without touching the shell's own persistence. */
  onPageDone?: (index: number) => void;
  /** ADDITIVE (owner 2026-09-29, the what's-left screen): the labCompletion
   *  key this lab banks certificate credit under, one unit per page named
   *  `p<n>` (1-based — the Patchbay / Connector Select convention). Banked
   *  pages read CREDITED on the end screen even after RESET LAB PROGRESS. */
  creditLabKey?: LabKey;
}) {
  /**
   * ⛔ THE UNDERSTANDING CHECK IS APPENDED HERE, FOR ALL 33 PagedLab LABS AT
   * ONCE (owner 2026-09-20). Member labs recorded no progress at all, so a
   * credential that required one could never be satisfied; passing this check
   * is what completes the lab.
   *
   * It is opt-in BY DATA, not by flag: a lab gets the page the moment Computer
   * B authors its questions, and until then there is no page and no promise of
   * one. Stubbing a placeholder test would be worse than having none, because
   * this one grants credit.
   */
  const check = understandingFor(labId);
  const pagesWithCheck = useMemo(
    () =>
      check
        ? [
            ...pages,
            {
              title: 'Check your understanding',
              short: 'CHECK',
              // Self-marking: FINISH stays held until every question is right.
              manualDone: true,
              Component: ({ ctx }: { ctx: PageCtx }) => (
                <LabUnderstandingCheck
                  labTitle={title}
                  questions={check}
                  passed={ctx.isDone}
                  onPassed={() => {
                    ctx.markDone();
                    // Server credit rides the same queue every af_* lab uses,
                    // so an offline pass is retried rather than lost.
                    registerLabUnits(labId as never, [UNDERSTANDING_UNIT]);
                    markLabUnit(labId as never, UNDERSTANDING_UNIT);
                  }}
                />
              ),
            } satisfies PageDef,
          ]
        : pages,
    [check, pages, labId, title],
  );


  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [progress, setProgress] = useState<PagedProgress | null>(null);
  // Latest persisted state, so two writes in one tap (mark done + advance)
  // never clobber each other through a stale render closure.
  const progressRef = useRef<PagedProgress | null>(null);
  // HOUSE GUEST RULE (bug pass 2026-09-30): a signed-out guest's place is
  // neither restored nor saved — the end screen tells them "nothing here is
  // saved". `resolved` REQUIRED: the provider boots at 'anonymous', and a
  // signed-in learner must not be treated as a guest before the tier is known.
  const { entitlement, resolved } = useEntitlement();
  const guestRef = useRef(false);
  guestRef.current = resolved && entitlement === 'anonymous';
  // A copy restored AS A GUEST is the empty guest copy. If the tier later turns
  // out signed-in (a failed first read reads 'anonymous'), saving it would
  // write that empty copy over real progress — credit is never removed. So a
  // guest-loaded copy is never saved (bug pass 3, 2026-09-30).
  const loadedAsGuestRef = useRef(false);
  const [page, setPage] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  // The what's-left end screen (owner 2026-09-29) — shown in place of the page.
  const [ending, setEnding] = useState(false);
  const bankedPages = useLabClearedUnits(creditLabKey ?? labId);
  const bankedCheck = useLabClearedUnits(labId);
  // Drag-vs-scroll lock (owner device pass 2026-09-11): the mixing console's
  // fader and pan pot live INSIDE this page scroller, and on device the native
  // scroll view steals a vertical gesture before any JS responder can argue -
  // the fader "wanted to scroll the screen instead of move". Same systemic fix
  // as LabShell/RackUnit (owner 2026-07-30): drag primitives grab the nearest
  // ScrollLockProvider and freeze the page for exactly the gesture's duration.
  const [dragLocked, setDragLocked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const osReduceMotion = useOsReduceMotion();
  const reduceMotion = osReduceMotion || !animationsAllowed();

  /**
   * Taps that land BEFORE saved progress has loaded (bug hunt 2026-09-29).
   * persist()/markDone() used to return early with no base, so a NEXT or a
   * page-done in that window was simply dropped — and then the restore below
   * snapped the learner back to their saved page. Now: once the learner has
   * navigated, the restore keeps THEIR page, and done-marks / the last page
   * made before the load are merged in and saved when it resolves.
   */
  const navigatedRef = useRef(false);
  const preloadRef = useRef<{ lastPage?: number; done: Set<number> }>({ done: new Set() });
  const onPageDoneRef = useRef(onPageDone);
  onPageDoneRef.current = onPageDone;

  useEffect(() => {
    navigatedRef.current = false;
    preloadRef.current = { done: new Set() };
  }, [labId, pagesWithCheck.length]);

  // ⛔ WAIT FOR `resolved` BEFORE RESTORING (bug pass 3, 2026-09-30). A load
  // that landed first read guestRef as false (the tier was still unknown), so
  // a signed-out device restored the PREVIOUS account's place. `resolved` flips
  // once, bounded, after the first read attempt — a signed-in learner is never
  // held, and taps made meanwhile are kept by preloadRef and merged here.
  useEffect(() => {
    if (!resolved) return;
    let alive = true;
    void loadPagedProgress(labId).then((loaded) => {
      if (!alive) return;
      loadedAsGuestRef.current = guestRef.current;
      const p: PagedProgress = guestRef.current ? { completed: [], lastPage: 0, done: false } : loaded;
      const pre = preloadRef.current;
      preloadRef.current = { done: new Set() };
      let next = p;
      if (navigatedRef.current || pre.done.size > 0) {
        const fresh = [...pre.done].filter((i) => !p.completed.includes(i));
        const completed = [...p.completed, ...fresh].sort((a, b) => a - b);
        next = {
          ...p,
          completed,
          done: completed.length >= pagesWithCheck.length,
          lastPage: pre.lastPage ?? p.lastPage,
        };
        if (!guestRef.current && !loadedAsGuestRef.current) void savePagedProgress(labId, next);
        // Same rule as markDone: the appended check page is not a lab page.
        for (const i of fresh) if (i < pages.length) onPageDoneRef.current?.(i);
      }
      progressRef.current = next;
      setProgress(next);
      if (!navigatedRef.current) setPage(Math.min(p.lastPage, pagesWithCheck.length - 1));
    });
    return () => { alive = false; };
    // pages.length only feeds the check-page rule above; it moves with
    // pagesWithCheck.length.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId, pagesWithCheck.length, resolved]);

  const persist = useCallback((patch: Partial<PagedProgress>) => {
    const base = progressRef.current;
    if (!base) {
      // Not loaded yet — remember the place; the load merges it (see above).
      if (patch.lastPage != null) preloadRef.current.lastPage = patch.lastPage;
      return;
    }
    const next = { ...base, ...patch };
    progressRef.current = next;
    setProgress(next);
    if (!guestRef.current && !loadedAsGuestRef.current) void savePagedProgress(labId, next);
  }, [labId]);
  const goTo = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(pagesWithCheck.length - 1, Math.round(i)));
    navigatedRef.current = true;
    setEnding(false);
    setPage(idx);
    setListOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    persist({ lastPage: idx });
  }, [pagesWithCheck.length, persist, reduceMotion]);
  const markDone = useCallback(() => {
    const base = progressRef.current;
    if (!base) {
      preloadRef.current.done.add(page); // merged + saved once the load resolves
      return;
    }
    const fresh = !base.completed.includes(page);
    const completed = fresh ? [...base.completed, page].sort((a, b) => a - b) : base.completed;
    persist({ completed, done: completed.length >= pagesWithCheck.length });
    /**
     * ⛔ THE APPENDED CHECK PAGE IS NOT ONE OF THE LAB'S PAGES
     * (owner 2026-09-21 bug pass — latent until the first check is authored).
     *
     * Callers implement onPageDone as `markLabUnit(lab, 'p' + (index + 1))`
     * against a unit list that ends at their real page count, so firing it for
     * the check page banked credit under a `p17` / `p24` that no lab registers.
     * The check page already marks its own UNDERSTANDING_UNIT above, which is
     * the unit that actually exists.
     */
    if (fresh && page < pages.length) onPageDone?.(page);
  }, [page, persist, pagesWithCheck.length, pages.length, onPageDone]);
  const doReset = () => void resetPagedProgress(labId).then(() => {
    const fresh: PagedProgress = { completed: [], lastPage: 0, done: false };
    progressRef.current = fresh;
    setProgress(fresh);
    setPage(0);
    setListOpen(false);
  });
  const confirmReset = () => {
    const message = `Clears your progress for ${title} only.`;
    if (Platform.OS === 'web') {
      // react-native-web's Alert is a no-op: keep the guard with the browser's confirm.
      const confirm = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
      if (typeof confirm !== 'function' || confirm(`Reset this lab? ${message}`)) doReset();
      return;
    }
    confirmDialog('Reset this lab?', message, 'Reset', doReset, { destructive: true });
  };

  const def = pagesWithCheck[page];
  const Page = def.Component;
  const isDone = !!progress?.completed.includes(page);
  const last = page === pagesWithCheck.length - 1;
  const ctx: PageCtx = { reduceMotion, markDone, isDone, goTo };
  const doneCount = progress?.completed.length ?? 0;

  // What's-left inputs: a page counts when it is done in this shell's own
  // progress OR its credit unit is banked (so RESET LAB PROGRESS, which clears
  // only the page dots, never makes banked credit read as missing).
  const endUnits: LabEndUnit[] = pagesWithCheck.map((p, i) =>
    check && i === pages.length
      ? { id: String(i), label: 'Check your understanding', kind: 'check', detail: 'Every answer correct — retry until you are.' }
      : { id: String(i), label: p.title },
  );
  const endCleared = new Set<string>();
  pagesWithCheck.forEach((_, i) => {
    const banked = check && i === pages.length
      ? bankedCheck.has(UNDERSTANDING_UNIT)
      : !!creditLabKey && bankedPages.has(`p${i + 1}`);
    if (banked || progress?.completed.includes(i)) endCleared.add(String(i));
  });

  if (ending) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Leave the lab">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker} numberOfLines={1}>{title.toUpperCase()} · END</Text>
            <Text style={styles.title} numberOfLines={2}>Where you are</Text>
          </View>
        </View>
        <LabEndScreen
          labTitle={title}
          units={endUnits}
          cleared={endCleared}
          mode={creditLabKey ? 'credit' : 'progress'}
          noun="page"
          onJump={(id) => goTo(Number(id))}
          onPracticeAgain={() => goTo(0)}
          onDone={() => navigation.goBack()}
          bottomInset
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Leave the lab">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker} numberOfLines={1}>{title.toUpperCase()} · {page + 1} OF {pagesWithCheck.length}</Text>
          <Text style={styles.title} numberOfLines={2}>{def.title}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => setListOpen(!listOpen)}
        style={styles.dots}
        hitSlop={{ top: 12, bottom: 12 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: listOpen }}
        aria-expanded={listOpen}
        accessibilityLabel={`Page list. ${doneCount} of ${pagesWithCheck.length} complete. ${listOpen ? 'Expanded' : 'Collapsed'}`}
      >
        {/* ⛔ pagesWithCheck, NOT pages. The counter beside these dots already
            counts the appended check page, so iterating the original array
            left the check with no dot and no row in the list below —
            unreachable except by pressing CONTINUE off the page before it,
            while the header read "17 of 17". */}
        {pagesWithCheck.map((_, i) => <View key={i} style={[styles.dot, progress?.completed.includes(i) && styles.dotDone, i === page && styles.dotNow]} />)}
        <Text style={styles.dotsText}>{doneCount}/{pagesWithCheck.length} done {listOpen ? '▴' : '▾'}</Text>
      </Pressable>
      {listOpen ? (
        <View style={styles.list}>
          {pagesWithCheck.map((p, i) => {
            const done = !!progress?.completed.includes(i);
            return (
              <Pressable key={i} onPress={() => goTo(i)} style={styles.listRow} accessibilityRole="button" accessibilityState={{ selected: i === page }} aria-pressed={i === page} accessibilityLabel={`Page ${i + 1}, ${p.title}${done ? ', complete' : ''}${i === page ? ', current' : ''}`}>
                <Text style={[styles.listText, i === page && { color: colors.cyanBright }, done && i !== page && { color: colors.textPrimary }]}>{done ? '✓' : '○'} {i + 1}. {p.title}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={confirmReset} style={[styles.listRow, styles.listReset]} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
            <Text style={[styles.listText, { color: colors.textMuted }]}>RESET LAB PROGRESS</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} scrollEnabled={!dragLocked} contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 24 }]}>
        <ScrollLockProvider value={setDragLocked}>
        {/* THE NOTE IS NOT PAGE-ONE FURNITURE (corrected 2026-09-17). It was
            inside the `page === 0` block with the subtitle — and this shell
            RESTORES `lastPage`, so a learner returning to the lab, which is most
            of them after the first sitting, never saw it again. The subtitle is
            genuinely a first-page thing; the calibration note is a standing
            statement about every page. */}
        <AccuracyNote style={styles.accuracy} />
        {page === 0 ? (
          <>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </>
        ) : null}
        <Page ctx={ctx} />
        </ScrollLockProvider>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={() => page > 0 && goTo(page - 1)} disabled={page === 0} style={[styles.navBtn, page === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityState={{ disabled: page === 0 }} aria-disabled={page === 0} accessibilityLabel="Back one page">
          <Text style={styles.navText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            if (!def.manualDone) markDone();
            // FINISH on the last page used to do nothing visible (Bug+Hater
            // night K2-01), then just left the lab. It now opens the what's-left
            // screen (owner 2026-09-29) — never held, never a dead end.
            if (!last) goTo(page + 1);
            else {
              setEnding(true);
              setListOpen(false);
            }
          }}
          style={[styles.navBtn, styles.navNext]}
          accessibilityRole="button"
          accessibilityLabel={!last ? 'Continue to the next page' : "Finish the lab and see what's left"}
        >
          <Text style={[styles.navText, { color: colors.green }]}>{!last ? 'CONTINUE ›' : progress?.done ? 'COMPLETE ✓' : 'FINISH ›'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5 },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, marginBottom: 2 },
  accuracy: { marginTop: 6, marginBottom: 4, alignSelf: 'flex-start' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 6 },
  dot: { width: 14, height: 6, borderRadius: 3, backgroundColor: '#26262b' },
  dotDone: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.cyanBright },
  dotsText: { marginLeft: 6, color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11 },
  list: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingVertical: 4 },
  listRow: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  listReset: { borderTopWidth: 1, borderTopColor: colors.hairlineDim, marginTop: 4 },
  listText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairlineDim, backgroundColor: colors.screenBgDeep },
  navBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  navNext: { borderColor: colors.green, backgroundColor: '#173021' },
  navText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
});
