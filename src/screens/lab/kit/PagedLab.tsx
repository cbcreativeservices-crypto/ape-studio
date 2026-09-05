/**
 * PagedLab — the shared shell for the visual-only paced labs (Sound
 * Envelope, Speech & Voice, Smart Processors): header with page n of N,
 * progress dots + page list, Back/Continue, reduced-motion aware, progress
 * in ape:<labId>:v1. Pages are components receiving a small ctx.
 *
 * API contract (three labs depend on it — additive changes only):
 *   PageCtx  { reduceMotion, markDone, isDone, goTo? }
 *   PageDef  { title, short, Component, manualDone? }
 */
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { AccessibilityInfo, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { animationsAllowed } from '../../../features/settings/a11y';
import { loadPagedProgress, resetPagedProgress, savePagedProgress, type PagedProgress } from '../../../features/lab/pagedProgress';

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
   *  Continue / Finish button will not mark it on the learner's behalf, and
   *  Finish stays disabled on a last page until the page has marked itself. */
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

export function PagedLab({ labId, title, subtitle, pages }: { labId: string; title: string; subtitle: string; pages: PageDef[] }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [progress, setProgress] = useState<PagedProgress | null>(null);
  // Latest persisted state, so two writes in one tap (mark done + advance)
  // never clobber each other through a stale render closure.
  const progressRef = useRef<PagedProgress | null>(null);
  const [page, setPage] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const osReduceMotion = useOsReduceMotion();
  const reduceMotion = osReduceMotion || !animationsAllowed();

  useEffect(() => {
    let alive = true;
    void loadPagedProgress(labId).then((p) => {
      if (!alive) return;
      progressRef.current = p;
      setProgress(p);
      setPage(Math.min(p.lastPage, pages.length - 1));
    });
    return () => { alive = false; };
  }, [labId, pages.length]);

  const persist = useCallback((patch: Partial<PagedProgress>) => {
    const base = progressRef.current;
    if (!base) return;
    const next = { ...base, ...patch };
    progressRef.current = next;
    setProgress(next);
    void savePagedProgress(labId, next);
  }, [labId]);
  const goTo = useCallback((i: number) => {
    const idx = Math.max(0, Math.min(pages.length - 1, Math.round(i)));
    setPage(idx);
    setListOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    persist({ lastPage: idx });
  }, [pages.length, persist, reduceMotion]);
  const markDone = useCallback(() => {
    const base = progressRef.current;
    if (!base) return;
    const completed = base.completed.includes(page) ? base.completed : [...base.completed, page].sort((a, b) => a - b);
    persist({ completed, done: completed.length >= pages.length });
  }, [page, persist, pages.length]);
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
    Alert.alert('Reset this lab?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: doReset },
    ]);
  };

  const def = pages[page];
  const Page = def.Component;
  const isDone = !!progress?.completed.includes(page);
  const last = page === pages.length - 1;
  // A self-marking last page (checks) holds Finish until it has marked itself.
  const finishBlocked = last && !!def.manualDone && !isDone;
  const ctx: PageCtx = { reduceMotion, markDone, isDone, goTo };
  const doneCount = progress?.completed.length ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel="Leave the lab">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker} numberOfLines={1}>{title.toUpperCase()} · {page + 1} OF {pages.length}</Text>
          <Text style={styles.title} numberOfLines={2}>{def.title}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => setListOpen(!listOpen)}
        style={styles.dots}
        hitSlop={{ top: 12, bottom: 12 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: listOpen }}
        accessibilityLabel={`Page list. ${doneCount} of ${pages.length} complete. ${listOpen ? 'Expanded' : 'Collapsed'}`}
      >
        {pages.map((_, i) => <View key={i} style={[styles.dot, progress?.completed.includes(i) && styles.dotDone, i === page && styles.dotNow]} />)}
        <Text style={styles.dotsText}>{doneCount}/{pages.length} done {listOpen ? '▴' : '▾'}</Text>
      </Pressable>
      {listOpen ? (
        <View style={styles.list}>
          {pages.map((p, i) => {
            const done = !!progress?.completed.includes(i);
            return (
              <Pressable key={i} onPress={() => goTo(i)} style={styles.listRow} accessibilityRole="button" accessibilityState={{ selected: i === page }} accessibilityLabel={`Page ${i + 1}, ${p.title}${done ? ', complete' : ''}${i === page ? ', current' : ''}`}>
                <Text style={[styles.listText, i === page && { color: colors.cyanBright }, done && i !== page && { color: colors.textPrimary }]}>{done ? '✓' : '○'} {i + 1}. {p.title}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={confirmReset} style={[styles.listRow, styles.listReset]} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
            <Text style={[styles.listText, { color: colors.textMuted }]}>RESET LAB PROGRESS</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {page === 0 ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Page ctx={ctx} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={() => page > 0 && goTo(page - 1)} disabled={page === 0} style={[styles.navBtn, page === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityState={{ disabled: page === 0 }} accessibilityLabel="Back one page">
          <Text style={styles.navText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            if (finishBlocked) return;
            if (!def.manualDone) markDone();
            // FINISH on the last page used to do nothing visible — it read as a
            // dead button (Bug+Hater night K2-01). Finishing now LEAVES the lab,
            // which is what the label promises; progress is already persisted.
            if (!last) goTo(page + 1);
            else navigation.goBack();
          }}
          disabled={finishBlocked}
          style={[styles.navBtn, styles.navNext, finishBlocked && { opacity: 0.45 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: finishBlocked }}
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
