/**
 * StartHereScreen — "Start Here: Your First Steps in Audio" (owner brief
 * 2026-09-29: a tester found the app "too daunting and overwhelming for a new
 * user"). A free beginner experience entered from its own card on the Home
 * carousel, beside Pro Audio Safety.
 *
 *   • ALWAYS FREE, guests included. No membership gate, no certificate credit,
 *     no labCompletion unit, not listed in the labs area (test/startHere).
 *   • Progress: the device-local `ape:startHere:v1` record (kit pagedProgress)
 *     for signed-in learners; guests follow the house guest rule (owner
 *     2026-08-12) — nothing restored, nothing written, session only. The
 *     account wipe's `ape:*` sweep clears it; this module keeps no module
 *     state, so it needs no registry entry.
 *   • Paged, and NEVER blocking: BACK / CONTINUE always work, the page list
 *     jumps anywhere, and FINISH opens the what's-left screen (LabEndScreen)
 *     with "choose what's next" on it (owner hard rules).
 *   • A page with a live display is a Rack Unit page and gets the full height
 *     (the Sound Systems host idiom, SsPagedLab); a reading page scrolls in the
 *     centred reading column (tablets).
 *   • ONE tone voice for the whole screen — the Foundations course's
 *     (useCourseTone): audio-output gate, speaker guard, stop on mute, stop on
 *     close — and it stops on every page change.
 *   • Nothing auto-appears (Low-Light Production Mode): every popup here is
 *     opened by a tap.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApeDsp } from '../../../modules/ape-dsp';
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { AccuracyNote } from '../../components/AccuracyNote';
import { colors, fonts } from '../../theme/tokens';
import { readingColumn } from '../../theme/readingColumn';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { loadPagedProgress, resetPagedProgress, savePagedProgress, type PagedProgress } from '../../features/lab/pagedProgress';
import { animationsAllowed } from '../../features/settings/a11y';
import { confirmDialog } from '../../lib/confirm';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { useCourseTone } from '../lab/foundations/FoundationsCourseScreen';
import { requireViz } from '../lab/foundations/skiaGate';
import { requireVizMeters } from '../lab/meter/skiaGate';
import { ScrollLockProvider } from '../lab/scrollLock';
import { LabEndScreen, type LabEndUnit } from '../lab/kit/LabEndScreen';
import type { PageCtx } from '../lab/kit/PagedLab';
import {
  PAGES,
  SECTIONS,
  START_HERE_ID,
  START_HERE_TITLE,
  firstOpenPage,
  kickerFor,
  pageIndex,
  sectionDone,
  type FirstSource,
  type PageId,
  type Unplug,
} from '../../features/startHere/startHereContent';
import { PAGE_COMPONENTS, StartEnvCtx, type StartEnv } from './pages';
import { TermSheetHost } from './bits';
import { NextSteps } from './NextSteps';

/** Pro Audio Safety (v3 gs 3060) — the free topic beside this card. */
const SAFETY_GS = 3060;

export function StartHereScreen() {
  const insets = useSafeAreaInsets();
  // Untyped on purpose: this screen reaches the root stack, a nested tab
  // (Study → Glossary / Dashboard) and routes named in content data.
  const navigation = useNavigation<any>();
  const focused = useIsFocused();

  // ── guest rule ───────────────────────────────────────────────────────────
  // `resolved` REQUIRED: the provider boots at 'anonymous', and a signed-in
  // learner must not be treated as a guest before the tier is known.
  const { entitlement, resolved } = useEntitlement();
  const noAccountRef = useRef(resolved && entitlement === 'anonymous');
  noAccountRef.current = resolved && entitlement === 'anonymous';

  // ── progress ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [progress, setProgress] = useState<PagedProgress>({ completed: [], lastPage: 0, done: false });
  const progressRef = useRef(progress);
  const loadedRef = useRef(false);
  const navigatedRef = useRef(false);
  const [ending, setEnding] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadPagedProgress(START_HERE_ID).then((p) => {
      if (!alive) return;
      loadedRef.current = true;
      if (noAccountRef.current) return; // guests: nothing restored
      // Merge anything done before the load landed (a fast first tap).
      const completed = [...new Set([...p.completed, ...progressRef.current.completed])]
        .filter((i) => i < PAGES.length)
        .sort((a, b) => a - b);
      const next = { ...p, completed, done: completed.length >= PAGES.length };
      progressRef.current = next;
      setProgress(next);
      if (!navigatedRef.current) setPage(Math.min(p.lastPage, PAGES.length - 1));
    });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: PagedProgress) => {
    progressRef.current = next;
    setProgress(next);
    if (!noAccountRef.current && loadedRef.current) void savePagedProgress(START_HERE_ID, next);
  }, []);

  // ── the one tone voice ───────────────────────────────────────────────────
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const tone = useCourseTone(gate === 'idle');
  const viz = useMemo(() => requireViz(), []);
  const meters = useMemo(() => requireVizMeters(), []);

  // ── "Your First Audio Signal": one signal carried through five steps ────
  const [source, setSource] = useState<FirstSource>('tone');
  const [freq, setFreq] = useState(220);
  // The mixer fader, dB: 0 = unity (the source's −18 dBFS passes unchanged).
  const [gainDb, setGainDb] = useState(0);
  const [unplug, setUnplug] = useState<Unplug>('none');

  // OS "reduce motion", subscribed (a mid-session flip re-renders), ORed with
  // the app's own animation setting.
  const [osReduce, setOsReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (alive) setOsReduce(!!v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setOsReduce(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  const reduceMotion = osReduce || !animationsAllowed();

  const scrollRef = useRef<ScrollView>(null);
  const [dragLocked, setDragLocked] = useState(false);

  /** Double-tap guard: a second tap on CONTINUE inside 350 ms is ignored. */
  const lastNavAt = useRef(0);
  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(PAGES.length - 1, Math.round(i)));
      lastNavAt.current = Date.now();
      navigatedRef.current = true;
      tone.stop(); // each page owns its own sound — never carried over
      setEnding(false);
      setListOpen(false);
      setPage(idx);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      persist({ ...progressRef.current, lastPage: idx });
    },
    [persist, tone],
  );

  const markDoneAt = useCallback(
    (i: number) => {
      const base = progressRef.current;
      if (base.completed.includes(i)) return;
      const completed = [...base.completed, i].sort((a, b) => a - b);
      persist({ ...base, completed, done: completed.length >= PAGES.length });
    },
    [persist],
  );

  const leave = useCallback(() => {
    tone.stop();
    navigation.goBack();
  }, [navigation, tone]);

  // ── outward links (always stop the tone first) ──────────────────────────
  const env: StartEnv = {
    tone,
    gate,
    viz,
    meters,
    // Reduced motion (OS or app setting) holds every display still.
    focused: focused && !reduceMotion,
    guest: resolved && entitlement === 'anonymous',
    first: { source, setSource, freq, setFreq, gainDb, setGainDb, unplug, setUnplug },
    openRoute: (route, params) => {
      tone.stop();
      navigation.navigate(route, params);
    },
    openTerms: () => {
      tone.stop();
      navigation.navigate('StartHereTerms');
    },
    openSafety: () => {
      tone.stop();
      // popTo, not navigate: navigate('Main') would PUSH a second tab shell.
      navigation.popTo('Main', { screen: 'Study', params: { screen: 'Dashboard', params: { focusGs: SAFETY_GS } } });
    },
    goToPage: (id: PageId) => goTo(pageIndex(id)),
  };

  const openGlossary = () => {
    tone.stop();
    navigation.popTo('Main', { screen: 'Study', params: { screen: 'Glossary', params: { from: 'home' }, initial: false } });
  };

  const doReset = () => {
    // START OVER lands on the welcome page, which has no PLAY to stop a tone
    // started on a lab page — so it stops here, like every other page change.
    tone.stop();
    return void resetPagedProgress(START_HERE_ID).then(() => {
      const fresh: PagedProgress = { completed: [], lastPage: 0, done: false };
      progressRef.current = fresh;
      setProgress(fresh);
      setPage(0);
      setListOpen(false);
    });
  };
  const confirmReset = () => {
    const message = 'Clears your place and the ticks in Start Here only.';
    if (Platform.OS === 'web') {
      const c = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
      if (typeof c !== 'function' || c(`Start over? ${message}`)) doReset();
      return;
    }
    confirmDialog('Start over?', message, 'Start over', doReset, { destructive: true });
  };

  const done = useMemo(() => new Set(progress.completed), [progress.completed]);
  const def = PAGES[page];
  const Page = PAGE_COMPONENTS[def.id];
  const last = page === PAGES.length - 1;
  const ctx: PageCtx = {
    reduceMotion,
    markDone: () => markDoneAt(page),
    isDone: done.has(page),
    goTo,
  };

  // ── what's left: one unit per lesson / the lab (not the welcome page) ──
  const endUnits: LabEndUnit[] = SECTIONS.filter((s) => s.kind !== 'welcome').map((s) => ({
    id: s.id,
    label: s.kind === 'lab' ? `The lab · ${s.title}` : `Lesson ${s.num} · ${s.title}`,
  }));
  const endCleared = new Set(SECTIONS.filter((s) => s.kind !== 'welcome' && sectionDone(s.id, done)).map((s) => s.id));

  const header = (kicker: string, title: string) => (
    <View style={styles.header}>
      <Pressable onPress={leave} style={styles.backBtn} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Leave Start Here">
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker} numberOfLines={1}>
          {kicker}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Pressable
        onPress={env.openTerms}
        style={styles.wordsBtn}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Starter words: meanings, flip cards and a quiz"
      >
        <Text style={styles.wordsText}>WORDS</Text>
      </Pressable>
      <AccuracyNote compact />
    </View>
  );

  if (ending) {
    return (
      <TermSheetHost>
        <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
          {header('START HERE · THE END', 'Choose what’s next')}
          <LabEndScreen
            labTitle={START_HERE_TITLE}
            units={endUnits}
            cleared={endCleared}
            mode="progress"
            noun="part"
            completeTitle="YOU’RE READY"
            doneLabel="DONE · BACK TO HOME"
            onJump={(id) => goTo(firstOpenPage(id, done))}
            onPracticeAgain={() => goTo(0)}
            onDone={leave}
            bottomInset
            extra={<NextSteps onRoute={env.openRoute} onGlossary={openGlossary} />}
          />
        </View>
      </TermSheetHost>
    );
  }

  return (
    <StartEnvCtx.Provider value={env}>
      <TermSheetHost>
        <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
          {header(kickerFor(def.sectionId), def.title)}
          <Pressable
            onPress={() => setListOpen(!listOpen)}
            style={styles.dots}
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="button"
            accessibilityState={{ expanded: listOpen }}
            aria-expanded={listOpen}
            accessibilityLabel={`All pages. ${progress.completed.length} of ${PAGES.length} done. ${listOpen ? 'Expanded' : 'Collapsed'}`}
          >
            {PAGES.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.dot,
                  i > 0 && PAGES[i - 1].sectionId !== p.sectionId && styles.dotGap,
                  done.has(i) && styles.dotDone,
                  i === page && styles.dotNow,
                ]}
              />
            ))}
            <Text style={styles.dotsText}>
              {page + 1}/{PAGES.length} {listOpen ? '▴' : '▾'}
            </Text>
          </Pressable>
          {listOpen ? (
            <ScrollView style={styles.listScroll} contentContainerStyle={[styles.list, readingColumn]}>
              {SECTIONS.map((s) => (
                <View key={s.id}>
                  <Text style={styles.listSection}>
                    {s.kind === 'lab' ? 'THE LAB · ' : s.num ? `LESSON ${s.num} · ` : ''}
                    {s.title.toUpperCase()}
                  </Text>
                  {s.pages.map((p) => {
                    const i = pageIndex(p.id);
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => goTo(i)}
                        style={styles.listRow}
                        accessibilityRole="button"
                        accessibilityState={{ selected: i === page }}
                        accessibilityLabel={`${p.title}${done.has(i) ? ', done' : ''}${i === page ? ', current page' : ''}`}
                      >
                        <Text style={[styles.listText, i === page && { color: colors.cyanBright }, done.has(i) && i !== page && { color: colors.textPrimary }]}>
                          {done.has(i) ? '✓' : '○'} {p.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <Pressable onPress={confirmReset} style={[styles.listRow, styles.listReset]} accessibilityRole="button" accessibilityLabel="Start Start Here over">
                <Text style={[styles.listText, { color: colors.textMuted }]}>START OVER</Text>
              </Pressable>
            </ScrollView>
          ) : null}

          {def.rack ? (
            <View style={styles.rackFill}>
              <Page key={def.id} ctx={ctx} />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              scrollEnabled={!dragLocked}
              contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: 28 }]}
            >
              <ScrollLockProvider value={setDragLocked}>
                <Page key={def.id} ctx={ctx} />
              </ScrollLockProvider>
            </ScrollView>
          )}

          <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable
              onPress={() => page > 0 && goTo(page - 1)}
              disabled={page === 0}
              style={[styles.navBtn, page === 0 && { opacity: 0.35 }]}
              accessibilityRole="button"
              accessibilityState={{ disabled: page === 0 }}
              aria-disabled={page === 0}
              accessibilityLabel="Back one page"
            >
              <Text style={styles.navText}>‹ BACK</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => {
                if (Date.now() - lastNavAt.current < 350) return;
                markDoneAt(page);
                if (!last) goTo(page + 1);
                else {
                  lastNavAt.current = Date.now();
                  tone.stop();
                  setListOpen(false);
                  setEnding(true);
                }
              }}
              style={[styles.navBtn, styles.navNext]}
              accessibilityRole="button"
              accessibilityLabel={last ? 'Finish and choose what to do next' : 'Continue to the next page'}
            >
              <Text style={[styles.navText, { color: colors.green }]}>{last ? 'FINISH ›' : 'CONTINUE ›'}</Text>
            </Pressable>
          </View>
        </View>
      </TermSheetHost>
    </StartEnvCtx.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.3 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.5 },
  wordsBtn: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(127,212,255,.45)',
    backgroundColor: '#0e1822',
    paddingHorizontal: 10,
  },
  wordsText: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 16, paddingVertical: 6, flexWrap: 'wrap' },
  dot: { width: 11, height: 6, borderRadius: 3, backgroundColor: '#26262b' },
  dotGap: { marginLeft: 5 },
  dotDone: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.cyanBright },
  dotsText: { marginLeft: 6, color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11.5 },
  listScroll: { maxHeight: 330, flexGrow: 0 },
  list: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingVertical: 6 },
  listSection: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.3, paddingHorizontal: 12, paddingTop: 8 },
  listRow: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 12 },
  listReset: { borderTopWidth: 1, borderTopColor: colors.hairlineDim, marginTop: 6 },
  listText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14 },
  rackFill: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineDim,
    backgroundColor: colors.screenBgDeep,
  },
  navBtn: { minHeight: 44, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  navNext: { borderColor: colors.green, backgroundColor: '#173021' },
  navText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2 },
});
