/**
 * LabNavBar — the SHARED LAB NAVIGATION (owner-approved 2026-09-30). One strip
 * under the lab header, the same in every lab:
 *     ‹ TITLE                                   [right]
 *     [⏮] [‹ PREV]      MODULE / 3 / 8 ▾        [NEXT ›]
 *
 * HOW A HOST ADOPTS IT (the migration packages follow this exactly):
 *   const nav = useLabNav({
 *     units: MODULES.map((m) => ({ id: m.id, title: m.title, done: banked.has(m.id) })),
 *     index: idx,                       // 0-based current unit
 *     ending,                           // LabEndScreen is showing in place
 *     go: (i) => { setEnding(false); setParams({ id: MODULES[i].id }); },
 *     finish: () => setEnding(true),
 *     unEnd: () => setEnding(false),
 *     reset: { label: 'START OVER (PRACTICE)', run: () => go(0) },  // optional
 *   });
 *   return (
 *     <LabNavProvider value={nav}>
 *       <View style={{ flex: 1, paddingTop: insets.top + 10 }}>
 *         <LabHeader title={meta.title} subtitle="Digital Audio Lab" right={<AccuracyNote compact />} />
 *         <LabNavBar nav={nav} />
 *         {ending ? <LabEndScreen … /> : <Module … />}   // a RackUnit well gets LabNextButton for free
 *       </View>
 *     </LabNavProvider>
 *   );
 * The strip enforces: ⏮ / ‹ PREV dim on unit 1; NEXT › is FINISH › on the last
 * unit, never disabled; the readout opens CONTENTS (tap only; Android BACK
 * closes it); one 400 ms tap lock; 44 pt targets; 13 pt labels, nothing under
 * 9 pt; the row caps at READING_MAX_W on a tablet. The header ‹ ALWAYS leaves
 * the lab. Retired words: CONTINUE, COMPLETE ✓, DONE ✓, SKIP AHEAD, ‹ BACK,
 * ⏮ START (guarded by test/labNavLaw.test.ts). LabNextButton in the well
 * reads "NEXT: <title> ›" / "FINISH · SEE WHAT'S LEFT ›" (LabEndLink's look).
 */
import { createContext, useContext, useEffect, useRef, type ReactNode, type Ref } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { colors, fonts } from '../../../theme/tokens';
import { READING_MAX_W } from '../../../theme/readingColumn';
import { NAV, nextButtonLabel } from './labNav';
import type { LabNav } from './useLabNav';

export { useLabNav } from './useLabNav';
export type { LabNav, LabNavOptions, LabNavSub, LabNavUnit } from './useLabNav';

/** Hosts provide their LabNav so RackUnit can append LabNextButton to the well. */
export const LabNavContext = createContext<LabNav | null>(null);
export const LabNavProvider = LabNavContext.Provider;
export function useLabNavContext(): LabNav | null {
  return useContext(LabNavContext);
}

/** How long the header ‹ ignores a second tap: a double tap must pop ONE
 *  screen (bug pass 2026-09-30: DONE popped two). A window, not a one-way
 *  latch, so a screen that did not leave still answers the next real tap. */
const LEAVE_LATCH_MS = 700;

/**
 * The lab header: ‹ (LEAVE THE LAB — stack pop, same as Android BACK; never
 * blocked, never confirmed), title over subtitle, and an optional `right`
 * group (AccuracyNote, HelpKey, a play button). `onTitlePress`, `onTouchStart`
 * and `headerRef` exist for LabShell's TEMP touch probe only.
 */
export function LabHeader({
  title,
  subtitle,
  right,
  onTitlePress,
  onTouchStart,
  headerRef,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onTitlePress?: () => void;
  onTouchStart?: (e: GestureResponderEvent) => void;
  headerRef?: Ref<View>;
}) {
  const navigation = useNavigation();
  const leftAt = useRef(0);
  const leave = () => {
    const now = Date.now();
    if (now - leftAt.current < LEAVE_LATCH_MS) return;
    leftAt.current = now;
    navigation.goBack();
  };
  return (
    <View style={styles.header} ref={headerRef} onTouchStart={onTouchStart}>
      <Pressable onPress={leave} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Leave the lab">
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <Pressable style={styles.titleBlock} onPress={onTitlePress} accessible={false} disabled={!onTitlePress}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

/** The strip + the CONTENTS dropdown. */
export function LabNavBar({ nav }: { nav: LabNav }) {
  const { view, contentsOpen, setContentsOpen } = nav;
  const { height: winH } = useWindowDimensions();

  // Android BACK closes CONTENTS while it is open (registered only then).
  useEffect(() => {
    if (!contentsOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setContentsOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [contentsOpen, setContentsOpen]);

  // CONTENTS is capped so the rack stage stays visible under it.
  const listMax = Math.max(44 * 3, Math.min(Math.round(winH * 0.42), 320));

  return (
    <View>
      <View style={styles.strip}>
        <View style={styles.stripInner}>
          <Pressable
            onPress={nav.start}
            style={styles.iconBtn}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={view.a11y.start}
            accessibilityState={{ disabled: !view.startOn }}
            aria-disabled={!view.startOn}
          >
            <Text style={[styles.icon, !view.startOn && styles.dim]}>⏮</Text>
          </Pressable>
          <Pressable
            onPress={nav.prev}
            style={styles.textBtn}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={view.a11y.prev}
            accessibilityState={{ disabled: !view.prevOn }}
            aria-disabled={!view.prevOn}
          >
            <Text style={[styles.label, !view.prevOn && styles.dim]}>{NAV.prev}</Text>
          </Pressable>
          <Pressable
            onPress={() => setContentsOpen(!contentsOpen)}
            style={styles.readout}
            accessibilityRole="button"
            accessibilityState={{ expanded: contentsOpen }}
            aria-expanded={contentsOpen}
            accessibilityLabel={view.a11y.pos}
          >
            <Text style={styles.noun} numberOfLines={1}>
              {view.noun}
            </Text>
            <Text style={styles.pos} numberOfLines={1}>
              {view.pos} {contentsOpen ? '▴' : '▾'}
            </Text>
          </Pressable>
          {/* NEXT's slot keeps its width on the end screen (empty, not removed). */}
          {view.nextLabel ? (
            <Pressable onPress={nav.next} style={styles.nextBtn} hitSlop={4} accessibilityRole="button" accessibilityLabel={view.a11y.next}>
              <Text style={styles.nextLabel}>{view.nextLabel}</Text>
            </Pressable>
          ) : (
            <View style={styles.nextSlot} />
          )}
        </View>
      </View>
      {contentsOpen ? <LabContents nav={nav} maxHeight={listMax} /> : null}
    </View>
  );
}

function LabContents({ nav, maxHeight }: { nav: LabNav; maxHeight: number }) {
  const { units, index, ending } = nav;
  return (
    <View style={styles.contentsWrap}>
      <View style={[styles.contents, { maxHeight }]}>
        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {units.map((u, i) => {
            const current = !ending && i === index;
            const num = u.kind === 'check' ? 'CHECK' : String(i + 1).padStart(2, '0');
            return (
              <Pressable
                key={u.id}
                onPress={() => nav.jump(i)}
                style={styles.row}
                accessibilityRole="button"
                accessibilityState={{ selected: current }}
                aria-pressed={current}
                accessibilityLabel={`${u.kind === 'check' ? 'Check' : `Module ${i + 1}`}, ${u.title}${u.done ? ', done' : ''}${current ? ', current' : ''}`}
              >
                <Text style={[styles.rowMark, u.done && styles.rowMarkDone, current && styles.rowCurrent]}>{u.done ? '✓' : '○'}</Text>
                <Text style={[styles.rowNum, u.kind === 'check' && styles.rowNumCheck, current && styles.rowCurrent]}>{num}</Text>
                <Text style={[styles.rowTitle, current && styles.rowCurrent]} numberOfLines={2}>
                  {u.title}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={nav.openEnd}
            style={[styles.row, styles.rowFooter]}
            accessibilityRole="button"
            accessibilityState={{ selected: ending }}
            accessibilityLabel="What's left. Opens the end screen"
          >
            <Text style={[styles.rowFooterText, ending && styles.rowCurrent]}>{NAV.whatsLeft} ›</Text>
          </Pressable>
          {nav.reset ? (
            <Pressable
              onPress={() => {
                nav.setContentsOpen(false);
                nav.reset?.run();
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${nav.reset.label}. Never removes credit`}
            >
              <Text style={[styles.rowFooterText, styles.rowReset]}>{nav.reset.label}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * The in-flow NEXT at the end of the reading / the rack well:
 * "NEXT: <next title> ›", and "FINISH · SEE WHAT'S LEFT ›" on the last unit.
 * With no `nav` it reads the LabNavContext; with neither it draws nothing.
 * `label` / `onPress` override both (LabEndLink is built on this).
 */
export function LabNextButton({ nav: navProp, label, onPress }: { nav?: LabNav; label?: string; onPress?: () => void }) {
  const ctx = useLabNavContext();
  const nav = navProp ?? ctx;
  if (!onPress && (!nav || nav.ending)) return null;
  const text = label ?? nextButtonLabel(nav?.nextTitle ?? null);
  const press = onPress ?? nav?.next;
  const isFinish = !nav?.nextTitle;
  return (
    <Pressable
      onPress={press}
      style={styles.next}
      accessibilityRole="button"
      accessibilityLabel={onPress || isFinish ? "Finish the lab and see what's left" : `Next: ${nav?.nextTitle}`}
    >
      <Text style={styles.nextText} numberOfLines={2}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Header — the Digital / Foundations header, unchanged in look.
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  titleBlock: { flexShrink: 1, flexGrow: 1 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // The strip. Every control is a 44 pt box; the row caps at the reading
  // column and centres on a tablet (RackUnit's dockInner).
  strip: { paddingHorizontal: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  stripInner: { width: '100%', maxWidth: READING_MAX_W, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.amber },
  textBtn: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amber },
  dim: { color: '#45454d' },
  readout: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  noun: { fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub, minHeight: 12 },
  pos: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textPrimary, marginTop: 1 },
  // NEXT: the header pill look (LabShell's HeaderTextButton), amber-rimmed.
  nextBtn: {
    minHeight: 38,
    minWidth: 88,
    marginVertical: 3,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,77,.6)',
    backgroundColor: '#17171c',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSlot: { minWidth: 88, minHeight: 44 },
  nextLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },

  // CONTENTS — in-tree (no Modal), under the strip, capped.
  contentsWrap: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 },
  contents: {
    width: '100%',
    maxWidth: READING_MAX_W,
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#101013',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingVertical: 6, paddingHorizontal: 12 },
  rowMark: { width: 14, fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  rowMarkDone: { color: colors.green },
  rowNum: { width: 40, fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, color: colors.amber },
  rowNumCheck: { fontSize: 10, color: colors.cyanBright },
  rowTitle: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  rowCurrent: { color: colors.cyanBright },
  rowFooter: { borderTopWidth: 1, borderTopColor: colors.hairlineDim, marginTop: 2 },
  rowFooterText: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  rowReset: { color: colors.textMuted },

  // In-flow NEXT / FINISH — LabEndLink's look (green, 48 pt).
  next: {
    alignSelf: 'stretch',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: '#173021',
    paddingHorizontal: 14,
    marginTop: 6,
  },
  nextText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, textAlign: 'center' },
});
