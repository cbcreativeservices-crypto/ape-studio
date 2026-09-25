/**
 * SsPagedLab — the Sound Systems Lab's paged host: kit/PagedLab's shell
 * (header with page n of N, progress dots + page list, Back/Continue, the
 * appended understanding check, progress in ape:<labId>:v1) plus the ONE
 * thing this lab needs that the shared shell does not offer — a page may
 * declare `rack: true` and receive the FULL HEIGHT with no ScrollView of its
 * own, the EQ / Cymatics host idiom, so its RackUnit can pin the display and
 * the dock and own the scroll well between them.
 *
 * WHY A LOCAL HOST (2026-09-25): kit/PagedLab is shared by thirty-odd labs
 * under an additive-only contract and sits outside this pass's scope, so the
 * rack branch lives here. Everything else is kept identical on purpose —
 * same storage keys, same check page, same footer — so a learner's saved
 * place survives and the five modes look like every other paged lab. If the
 * owner later wants the branch upstream it is a `rack?: boolean` on PageDef
 * and one conditional around the scroll view.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScrollLockProvider } from '../scrollLock';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { animationsAllowed } from '../../../features/settings/a11y';
import { loadPagedProgress, resetPagedProgress, savePagedProgress, type PagedProgress } from '../../../features/lab/pagedProgress';
import { confirmDialog } from '../../../lib/confirm';
import { LabUnderstandingCheck } from '../../../components/LabUnderstandingCheck';
import { UNDERSTANDING_UNIT, understandingFor } from '../../../features/lab/understanding';
import { markLabUnit, registerLabUnits } from '../../../features/lab/labCompletion';
import type { PageCtx } from '../kit/PagedLab';
import type { SsPageDef } from './rackLayout';

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
  const [listOpen, setListOpen] = useState(false);
  const [dragLocked, setDragLocked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const osReduceMotion = useOsReduceMotion();
  const reduceMotion = osReduceMotion || !animationsAllowed();

  useEffect(() => {
    let alive = true;
    void loadPagedProgress(labId).then((p) => {
      if (!alive) return;
      progressRef.current = p;
      setProgress(p);
      setPage(Math.min(p.lastPage, pagesWithCheck.length - 1));
    });
    return () => { alive = false; };
  }, [labId, pagesWithCheck.length]);

  const persist = useCallback((patch: Partial<PagedProgress>) => {
    const base = progressRef.current;
    if (!base) return;
    const next = { ...base, ...patch };
    progressRef.current = next;
    setProgress(next);
    void savePagedProgress(labId, next);
  }, [labId]);
  const goTo = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(pagesWithCheck.length - 1, Math.round(i)));
    setPage(idx);
    setListOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    persist({ lastPage: idx });
  }, [pagesWithCheck.length, persist, reduceMotion]);
  const markDone = useCallback(() => {
    const base = progressRef.current;
    if (!base) return;
    const fresh = !base.completed.includes(page);
    const completed = fresh ? [...base.completed, page].sort((a, b) => a - b) : base.completed;
    persist({ completed, done: completed.length >= pagesWithCheck.length });
    // The appended check page is not one of the lab's pages (kit/PagedLab's
    // 2026-09-21 rule): it banks its own UNDERSTANDING_UNIT above.
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
  const finishBlocked = last && !!def.manualDone && !isDone;
  const ctx: PageCtx = { reduceMotion, markDone, isDone, goTo };
  const doneCount = progress?.completed.length ?? 0;
  const rack = !!def.rack;

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
        {/* The standing calibration note rides every page. A rack page has no
            scroll of its own to carry the full chip, so it wears the compact
            one on the header, the Cymatics host's placement. */}
        {rack ? <AccuracyNote compact /> : null}
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
        {pagesWithCheck.map((_, i) => <View key={i} style={[styles.dot, progress?.completed.includes(i) && styles.dotDone, i === page && styles.dotNow]} />)}
        <Text style={styles.dotsText}>{doneCount}/{pagesWithCheck.length} done {listOpen ? '▴' : '▾'}</Text>
      </Pressable>
      {listOpen ? (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
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
        </ScrollView>
      ) : null}
      {rack ? (
        // Rack page: full height — its RackUnit pins the stage and the dock and
        // owns the scroll well (and its own scroll-lock provider).
        <View style={styles.rackFill}>
          <Page ctx={ctx} />
        </View>
      ) : (
        <ScrollView ref={scrollRef} scrollEnabled={!dragLocked} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
          <ScrollLockProvider value={setDragLocked}>
            <AccuracyNote style={styles.accuracy} />
            {page === 0 ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Page ctx={ctx} />
          </ScrollLockProvider>
        </ScrollView>
      )}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={() => page > 0 && goTo(page - 1)} disabled={page === 0} style={[styles.navBtn, page === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityState={{ disabled: page === 0 }} aria-disabled={page === 0} accessibilityLabel="Back one page">
          <Text style={styles.navText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            if (finishBlocked) return;
            if (!def.manualDone) markDone();
            if (!last) goTo(page + 1);
            else navigation.goBack();
          }}
          disabled={finishBlocked}
          style={[styles.navBtn, styles.navNext, finishBlocked && { opacity: 0.45 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: finishBlocked }}
          aria-disabled={finishBlocked}
          accessibilityLabel={!last ? 'Continue to the next page' : finishBlocked ? 'Finish the lab — complete this page first' : 'Finish the lab'}
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
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 6, flexWrap: 'wrap' },
  dot: { width: 14, height: 6, borderRadius: 3, backgroundColor: '#26262b' },
  dotDone: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.cyanBright },
  dotsText: { marginLeft: 6, color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11 },
  // The page list is its own scroller on a rack page (the rack takes the rest
  // of the height), capped so the stage stays in view beneath it.
  listScroll: { maxHeight: 260, flexGrow: 0 },
  list: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingVertical: 4 },
  listRow: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  listReset: { borderTopWidth: 1, borderTopColor: colors.hairlineDim, marginTop: 4 },
  listText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  rackFill: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairlineDim, backgroundColor: colors.screenBgDeep },
  navBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  navNext: { borderColor: colors.green, backgroundColor: '#173021' },
  navText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
});
