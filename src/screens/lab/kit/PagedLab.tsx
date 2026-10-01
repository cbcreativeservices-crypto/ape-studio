/**
 * PagedLab — the shared shell for the paged labs: the SHARED LAB NAVIGATION
 * (kit/LabNavBar, owner 2026-09-30 — LabHeader over one strip
 * `[⏮] [‹ PREV]  MODULE / n / N ▾  [NEXT ›]`, CONTENTS from the readout, an
 * in-flow NEXT at the end of the reading, nothing pinned at the bottom),
 * reduced-motion aware, progress in ape:<labId>:v1. Pages are components
 * receiving a small ctx.
 *
 * NEXT marks the page done (unless `manualDone`) and advances — today's
 * semantics, now behind the hook's one 400 ms tap lock. Before the lock a
 * double tap on the second-to-last page marked an UNSEEN last page done and
 * banked its `p<n>` credit through onPageDone (Patchbay, Connector Select).
 * A CONTENTS jump never marks anything.
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
import { loadPagedProgress, resetPagedProgress, savePagedProgress, type PagedProgress } from '../../../features/lab/pagedProgress';
import { confirmDialog } from '../../../lib/confirm';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { isRealAccount } from '../../../features/commercial/realAccount';
import { supabase } from '../../../lib/supabase';

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
  /** The page marks ITSELF done (a checks page that needs its answers): NEXT /
   *  FINISH will not mark it on the learner's behalf. (FINISH used to stay
   *  disabled until it had; since owner 2026-09-29 it opens the what's-left
   *  screen, which lists the unmarked page instead.) */
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
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav, type LabNavUnit } from './LabNavBar';

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
   *  pages read CREDITED on the end screen even after START OVER (PRACTICE). */
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
              // Self-marking: NEXT / FINISH never mark it; the what's-left
              // screen lists it until every question is right.
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
  const isGuest = resolved && entitlement === 'anonymous';
  guestRef.current = isGuest;
  // A copy restored AS A GUEST is the empty guest copy. If the tier later turns
  // out signed-in (a failed first read reads 'anonymous'), saving it would
  // write that empty copy over real progress — credit is never removed. So a
  // guest-loaded copy is never saved (bug pass 3, 2026-09-30).
  const loadedAsGuestRef = useRef(false);
  // WHOSE "GUEST" COPY IS ON SCREEN (night pass 3, 2026-10-01). The carry-over
  // below is for ONE person whose tier read failed and later landed. A real
  // sign-out → sign-in (as anybody, the same person included) also reads as
  // guest → signed-in, and carried what was done while signed OUT into the
  // account — banking their p<n> credit through onPageDone. So the carry is
  // allowed only while the signed-in identity seen at the guest load has not
  // changed since. undefined = not known yet (no carry).
  const identityRef = useRef<string | null | undefined>(undefined);
  // `undefined` here = a guest load happened before the first auth answer; the
  // first answer (INITIAL_SESSION, delivered to every new listener) fills it.
  const carryIdentityRef = useRef<string | null | undefined>(null);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = isRealAccount(session) ? (session?.user?.id ?? null) : null;
      if (carryIdentityRef.current === undefined && identityRef.current === undefined) carryIdentityRef.current = id;
      else if (id !== carryIdentityRef.current) carryIdentityRef.current = null;
      identityRef.current = id;
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const [page, setPage] = useState(0);
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
  // A new page never inherits a frozen scroller (night pass 2, 2026-10-01):
  // a drag on the old page's fader/pot plus a second finger on NEXT / PREV /
  // CONTENTS unmounted the control mid-gesture, its release never came, and
  // the new page could not scroll.
  useEffect(() => setDragLocked(false), [page, ending]);
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
      // GUEST → SIGNED-IN mid-visit (night pass 2, 2026-10-01): a signed-in
      // learner whose boot tier read failed works as a "guest" until the real
      // tier arrives. The pages they finished meanwhile were on screen; the
      // re-load replaced them with the stored copy and they vanished. They are
      // carried over like taps made before a load — ADDED to the real copy,
      // which is then saved (nothing is removed, and the empty guest copy
      // itself is still never written).
      const sameIdentity = carryIdentityRef.current != null && carryIdentityRef.current === identityRef.current;
      const carried = loadedAsGuestRef.current && !guestRef.current && sameIdentity ? progressRef.current?.completed ?? [] : [];
      loadedAsGuestRef.current = guestRef.current;
      // A guest load remembers who (if anyone) was signed in; any later
      // identity change clears it (the auth listener above).
      carryIdentityRef.current = guestRef.current ? identityRef.current : null;
      const p: PagedProgress = guestRef.current ? { completed: [], lastPage: 0, done: false } : loaded;
      const pre = preloadRef.current;
      for (const i of carried) pre.done.add(i);
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
    // `isGuest` (bug pass 2026-10-01): the tier can change after the first
    // load — a signed-in learner whose boot read failed resolves 'anonymous'
    // and later reads their real tier; a member can sign out mid-lab. Without
    // re-loading, the first stayed on the empty guest copy for the whole visit
    // and the second kept saving the old account's place as a guest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId, pagesWithCheck.length, resolved, isGuest]);

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
  // Bug pass 2026-10-01: (1) a guest's reset is in memory only — the stored
  // copy is device-wide, so removing it as a guest erased the previous
  // account's place (a guest copy is never written, and a removal is a write);
  // (2) START OVER from CONTENTS on the what's-left screen left `ending` on,
  // so the learner stayed on the end screen at "page 1".
  const doReset = () => {
    const skipStore = guestRef.current || loadedAsGuestRef.current;
    void (skipStore ? Promise.resolve() : resetPagedProgress(labId)).then(() => {
      const fresh: PagedProgress = { completed: [], lastPage: 0, done: false };
      progressRef.current = fresh;
      setProgress(fresh);
      setEnding(false);
      setPage(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };
  // A PRACTICE reset: the page marks kept on this device for this lab are
  // cleared and the lab starts from page 1. Credit already banked to the
  // account (Patchbay / Connector Select pages, a passed check) is never
  // removed and still reads CREDITED on the end screen.
  const confirmReset = () => {
    const message = `Starts ${title} again from its first page. Credit you have already earned stays.`;
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

  // What's-left inputs: a page counts when it is done in this shell's own
  // progress OR its credit unit is banked (so START OVER, which clears only
  // the page marks, never makes banked credit read as missing).
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

  // ⛔ pagesWithCheck, NOT pages: CONTENTS must list the appended check page
  // too, or it is unreachable except by NEXT off the page before it.
  const navUnits: LabNavUnit[] = pagesWithCheck.map((p, i) => ({
    id: String(i),
    title: p.title,
    done: endCleared.has(String(i)),
    kind: check && i === pages.length ? 'check' : 'unit',
  }));
  const finish = useCallback(() => setEnding(true), []);
  const unEnd = useCallback(() => setEnding(false), []);
  // NEXT / FINISH mark the page on the learner's behalf unless it marks
  // itself (a check page). Runs under the hook's tap lock, never on a
  // CONTENTS jump. `from` is the page the tap landed on — always `page`.
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
        <LabHeader title={ending ? 'Where you are' : def.title} subtitle={title} />
        <LabNavBar nav={nav} />
        {ending ? (
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
        ) : (
          <ScrollView ref={scrollRef} scrollEnabled={!dragLocked} contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 24 }]}>
            <ScrollLockProvider value={setDragLocked}>
              {/* THE NOTE IS NOT PAGE-ONE FURNITURE (corrected 2026-09-17). It was
                  inside the `page === 0` block with the subtitle — and this shell
                  RESTORES `lastPage`, so a learner returning to the lab, which is most
                  of them after the first sitting, never saw it again. The subtitle is
                  genuinely a first-page thing; the calibration note is a standing
                  statement about every page. */}
              <AccuracyNote style={styles.accuracy} />
              {page === 0 ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              <Page ctx={ctx} />
              {/* The in-flow NEXT / FINISH at the end of the reading (nothing is
                  pinned at the bottom any more). */}
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
});
