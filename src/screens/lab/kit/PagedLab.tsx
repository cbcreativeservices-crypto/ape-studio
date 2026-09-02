/**
 * PagedLab — the shared shell for the visual-only paced labs (Sound
 * Envelope, Speech & Voice, Smart Processors): header with page n of N,
 * progress dots + page list, Back/Continue, reduced-motion aware, progress
 * in ape:<labId>:v1. Pages are components receiving a small ctx.
 */
import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { animationsAllowed } from '../../../features/settings/a11y';
import { loadPagedProgress, resetPagedProgress, savePagedProgress, type PagedProgress } from '../../../features/lab/pagedProgress';

export type PageCtx = {
  reduceMotion: boolean;
  markDone: () => void;
  isDone: boolean;
};

export type PageDef = { title: string; short: string; Component: (p: { ctx: PageCtx }) => JSX.Element };

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
  const reduceMotion = !animationsAllowed();

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
    setPage(i);
    setListOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    persist({ lastPage: i });
  }, [persist, reduceMotion]);
  const markDone = useCallback(() => {
    const base = progressRef.current;
    if (!base) return;
    const completed = base.completed.includes(page) ? base.completed : [...base.completed, page].sort((a, b) => a - b);
    persist({ completed, done: completed.length >= pages.length });
  }, [page, persist, pages.length]);
  const confirmReset = () => Alert.alert('Reset this lab?', `Clears your progress for ${title} only.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', style: 'destructive', onPress: () => void resetPagedProgress(labId).then(() => { const fresh = { completed: [], lastPage: 0, done: false }; progressRef.current = fresh; setProgress(fresh); setPage(0); }) },
  ]);

  const def = pages[page];
  const Page = def.Component;
  const ctx: PageCtx = { reduceMotion, markDone, isDone: !!progress?.completed.includes(page) };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Leave the lab">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{title.toUpperCase()} · {page + 1} OF {pages.length}</Text>
          <Text style={styles.title} numberOfLines={2}>{def.title}</Text>
        </View>
      </View>
      <Pressable onPress={() => setListOpen(!listOpen)} style={styles.dots} accessibilityRole="button" accessibilityLabel={`Page list. ${progress?.completed.length ?? 0} of ${pages.length} complete`}>
        {pages.map((_, i) => <View key={i} style={[styles.dot, progress?.completed.includes(i) && styles.dotDone, i === page && styles.dotNow]} />)}
        <Text style={styles.dotsText}>{progress?.completed.length ?? 0}/{pages.length} ▾</Text>
      </Pressable>
      {listOpen ? (
        <View style={styles.list}>
          {pages.map((p, i) => (
            <Pressable key={i} onPress={() => goTo(i)} style={styles.listRow} accessibilityRole="button" accessibilityLabel={`Page ${i + 1}, ${p.title}${progress?.completed.includes(i) ? ', complete' : ''}`}>
              <Text style={[styles.listText, i === page && { color: colors.cyanBright }]}>{progress?.completed.includes(i) ? '✓' : '○'} {i + 1}. {p.title}</Text>
            </Pressable>
          ))}
          <Pressable onPress={confirmReset} style={styles.listRow} accessibilityRole="button" accessibilityLabel="Reset this lab's progress">
            <Text style={[styles.listText, { color: colors.textMuted }]}>RESET LAB PROGRESS</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {page === 0 ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Page ctx={ctx} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={() => page > 0 && goTo(page - 1)} disabled={page === 0} style={[styles.navBtn, page === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="Back one page">
          <Text style={styles.navText}>‹ BACK</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => { markDone(); if (page < pages.length - 1) goTo(page + 1); }}
          style={[styles.navBtn, styles.navNext]}
          accessibilityRole="button"
          accessibilityLabel={page < pages.length - 1 ? 'Continue to the next page' : 'Finish the lab'}
        >
          <Text style={[styles.navText, { color: colors.green }]}>{page < pages.length - 1 ? 'CONTINUE ›' : progress?.done ? 'COMPLETE ✓' : 'FINISH ›'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 6 },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5 },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, marginBottom: 2 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 6 },
  dot: { width: 14, height: 6, borderRadius: 3, backgroundColor: '#26262b' },
  dotDone: { backgroundColor: colors.green },
  dotNow: { backgroundColor: colors.cyanBright },
  dotsText: { marginLeft: 6, color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11 },
  list: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingVertical: 4 },
  listRow: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  listText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairlineDim, backgroundColor: colors.screenBgDeep },
  navBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  navNext: { borderColor: colors.green, backgroundColor: '#173021' },
  navText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
});
