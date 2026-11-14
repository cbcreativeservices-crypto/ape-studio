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
 * unit, never disabled; the readout opens CONTENTS — a CENTERED POPUP since
 * the lab fix round 2026-11-14 (owner standing rule "popups, never
 * pulldowns"; F6): ✕, a tap outside or Android BACK closes it; one 400 ms tap lock; 44 pt targets; 13 pt labels, nothing under
 * 9 pt; the row caps at READING_MAX_W on a tablet. The header ‹ ALWAYS leaves
 * the lab. Retired words: CONTINUE, COMPLETE ✓, DONE ✓, SKIP AHEAD, ‹ BACK,
 * ⏮ START (guarded by test/labNavLaw.test.ts). LabNextButton in the well
 * reads "NEXT: <title> ›" / "FINISH · SEE WHAT'S LEFT ›" (LabEndLink's look).
 */
import { createContext, useContext, useEffect, useRef, type ReactNode, type Ref } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { NavigationContext, useNavigation } from '@react-navigation/native';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../../theme/tokens';
import { READING_MAX_W, popupCard } from '../../../theme/readingColumn';
import { Modal } from '../../../components/DimModal';
import { useModalHandoff } from '../../../lib/confirm';
import { NAV, nextButtonLabel, relabelView, type UnitNoun } from './labNav';
import type { LabNav } from './useLabNav';
import { safeGoBack } from '../../../lib/safeGoBack';
// Screen Guide (owner 2026-10-31): the header ⓘ "this screen, explained".
import { ScreenGuideHintAnchor, ScreenGuideKey, type ScreenGuide } from '../../../features/lab/screenGuide';

export { useLabNav } from './useLabNav';
export type { LabNav, LabNavOptions, LabNavSub, LabNavUnit } from './useLabNav';

/**
 * The lab's ONE unit noun (owner decision 3, 2026-11-14: one name per unit
 * of progress, used everywhere). A host says it once — PagedLab's `unitNoun`
 * prop, or <LabNounProvider value="lesson"> around a lab that builds its own
 * screen — and the strip, CONTENTS and LabEndScreen all read it. Default
 * 'module' (what the strip always said).
 */
const LabNounContext = createContext<UnitNoun>('module');
export const LabNounProvider = LabNounContext.Provider;
export function useLabNoun(): UnitNoun {
  return useContext(LabNounContext);
}

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
 * ONE leave window shared by the header ‹ and the end screen's DONE (night
 * pass 2, 2026-10-01). Each had its own 700 ms window, so ‹ with one finger
 * and DONE with another (both on screen on the what's-left page) ran two
 * goBack()s and popped the screen under the lab as well. Returns true when
 * this tap may leave; false while another leave tap is inside the window.
 */
let lastLeaveAt = 0;
export function claimLabLeave(): boolean {
  const now = Date.now();
  if (now - lastLeaveAt < LEAVE_LATCH_MS) return false;
  lastLeaveAt = now;
  return true;
}

/**
 * The lab header: ‹ (LEAVE THE LAB — stack pop, same as Android BACK; never
 * blocked, never confirmed), title over subtitle, and an optional `right`
 * group (AccuracyNote, HelpKey, a play button). `onTitlePress`, `onTouchStart`
 * and `headerRef` exist for LabShell's TEMP touch probe only.
 *
 * SCREEN GUIDE (owner 2026-10-31, opt-in): pass `guide` and the header draws
 * the ⓘ ScreenGuideKey as the LAST item of the right group (after `right`)
 * and wraps itself in ScreenGuideHintAnchor (the one-time "tap ⓘ" callout).
 * The screen must still wrap its root View's content in <ScreenGuideHost>
 * (regions on a Rack Unit screen, `regions={false}` otherwise) so the steps
 * sit away from the area they explain. A CONCEPT lab drops its AccuracyNote
 * from `right` (the key takes that spot); a measurement lab keeps the chip
 * and the key sits beside it. No `guide` = exactly the old header.
 */
export function LabHeader({
  title,
  subtitle,
  right,
  onTitlePress,
  onTouchStart,
  headerRef,
  guide,
  guideTitle,
  backLabel = 'Leave the lab',
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onTitlePress?: () => void;
  onTouchStart?: (e: GestureResponderEvent) => void;
  headerRef?: Ref<View>;
  /** Opt-in: this screen's "explained" guide — draws the ⓘ key. */
  guide?: ScreenGuide;
  /** The guide card's title; defaults to `title` in capitals. */
  guideTitle?: string;
  /** What ‹ says to a screen reader, for a screen where ‹ does not leave the
   *  whole lab (a module under its own menu). */
  backLabel?: string;
}) {
  const navigation = useNavigation();
  const leave = () => {
    if (!claimLabLeave()) return;
    safeGoBack(navigation);
  };
  const key = guide ? <ScreenGuideKey title={guideTitle ?? title.toUpperCase()} guide={guide} /> : null;
  // The title never breaks inside a word (checker C4, 2026-11-14): its floor is its longest word.
  const titleFloor = { minWidth: titleMinWidth(title) };
  const header = (
    <View style={styles.header} ref={headerRef} onTouchStart={onTouchStart}>
      <Pressable onPress={leave} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel={backLabel}>
        <Text style={styles.back} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
      </Pressable>
      <Pressable style={[styles.titleBlock, titleFloor]} onPress={onTitlePress} accessible={false} disabled={!onTitlePress}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      {right || key ? (
        <View style={styles.headerRight}>
          {right}
          {key}
        </View>
      ) : null}
    </View>
  );
  return guide ? <ScreenGuideHintAnchor>{header}</ScreenGuideHintAnchor> : header;
}

/**
 * The title block's floor (lab fix round 2026-11-14, checker C4 / F8): the
 * width of the title's longest word, so a narrow phone drops the header keys
 * to a second row (header flexWrap) instead of breaking "MEMBR / ANE" or
 * "HARMONOGRAP / H". Oswald SemiBold 16 with 1.2 tracking runs ≤ 10.7 px per
 * capital (HARMONOGRAPH measured 126 px, 12 letters); floor 80, cap 128 so a
 * long word never pushes the keys off a 390 row (Membrane's title there is
 * 131 wide). Short titles (GATE LAB) keep one row even at 320.
 */
export function titleMinWidth(title: string): number {
  const longest = title.split(/[\s/]+/).reduce((n, w) => Math.max(n, w.length), 0);
  return Math.min(128, Math.max(80, Math.ceil(longest * 10.7)));
}

/** The strip + the CONTENTS popup (a centered card, never a pull-down). */
export function LabNavBar({ nav, posLabel }: {
  nav: LabNav;
  /** ADDITIVE (2026-11-14, F4): the readout's lower line instead of the
   *  unit's number, e.g. a Mixing Guide's style: GUIDE over POP. Never a
   *  total. Omitted = the number (GUIDE over 7). */
  posLabel?: string;
}) {
  const { contentsOpen, setContentsOpen } = nav;
  // The strip speaks the lab's own unit noun (MODULE / LESSON / CHAPTER / STEP / PAGE / GUIDE / STAGE).
  const noun = useLabNoun();
  const labeled = relabelView(nav.view, noun);
  const view = posLabel && !nav.ending && nav.index >= 0 ? { ...labeled, pos: posLabel } : labeled;
  const { height: winH } = useWindowDimensions();

  // Android BACK closes CONTENTS while it is open (registered only then).
  // …and only while this lab is the FOCUSED screen (bug pass 2026-10-01): with
  // CONTENTS left open, ? (Help) or a paywall pushed on top — a native-stack
  // screen, not a Modal — got its BACK eaten here: the hidden list closed and
  // the screen on top stayed.
  const navCtx = useContext(NavigationContext);
  useEffect(() => {
    if (!contentsOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navCtx && !navCtx.isFocused()) return false;
      setContentsOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [contentsOpen, setContentsOpen, navCtx]);

  // The popup's list scrolls inside the card; the card never fills the screen.
  const listMax = Math.max(44 * 3, Math.min(Math.round(winH * 0.62), 520));

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
      {/* CONTENTS as the app's centered popup (lab fix round 2026-11-14; owner
          standing rule "popups, never pulldowns" — it used to open in-tree
          under the strip and push the lab down). DimModal keeps Low-Light's
          wash; onRequestClose is Android BACK while the popup is up (the
          BackHandler above stays for the focus rule). */}
      <Modal
        visible={contentsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setContentsOpen(false)}
        accessibilityViewIsModal
      >
        {contentsOpen ? <LabContents nav={nav} maxHeight={listMax} noun={noun} /> : null}
      </Modal>
    </View>
  );
}

function LabContents({ nav, maxHeight, noun }: { nav: LabNav; maxHeight: number; noun: UnitNoun }) {
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  const { units, index, ending } = nav;
  const close = () => nav.setContentsOpen(false);
  // START OVER opens a confirm dialog: run it after this popup's Modal has
  // gone (house helper; iOS refuses to present while one is still closing).
  const handoff = useModalHandoff();
  return (
    // A tap outside the card closes it; the card swallows its own taps.
    <Pressable accessible={false} style={styles.contentsBackdrop} onPress={close}>
      <Pressable accessible={false} style={[styles.contents, { maxHeight: maxHeight + 56 }]} onPress={() => {}}>
        <View style={styles.contentsHead}>
          <Text style={styles.contentsTitle} accessibilityRole="header">
            CONTENTS
          </Text>
          <Pressable onPress={close} hitSlop={12} style={styles.contentsClose} accessibilityRole="button" accessibilityLabel="Close the contents">
            <Text style={styles.contentsCloseText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
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
                accessibilityLabel={`${u.kind === 'check' ? 'Check' : `${Noun} ${i + 1}`}, ${u.title}${u.done ? ', done' : ''}${current ? ', current' : ''}`}
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
                const run = nav.reset?.run;
                nav.setContentsOpen(false);
                if (run) handoff(run);
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${nav.reset.label}. Never removes credit`}
            >
              <Text style={[styles.rowFooterText, styles.rowReset]}>{nav.reset.label}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Pressable>
    </Pressable>
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
  // flexWrap + a 110 pt floor on the title (lab fix round 2026-11-14, checker C4 / F8): at 320 wide a
  // long title word (MEMBRANE, OSCILLATOR, HARMONOGRAPH) broke mid-word; now the right-hand keys drop to
  // a second row, right-aligned (marginLeft 'auto'), and the title keeps its words. 390: one row as before.
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  // minWidth comes from titleMinWidth(title) (its longest word, 80–128): with F8's fixed 110 the keys
  // stayed on row 1 at 320 and HARMONOGRAPH (126 px) broke ("HARMONOGRAP / H", measured 2026-11-14).
  titleBlock: { flexShrink: 1, flexGrow: 1, flexBasis: 0 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },

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

  // CONTENTS — the centered popup (2026-11-14): dim backdrop, card at the
  // popup width (popupCard), ✕ in its header.
  contentsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  contentsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 4, minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  contentsTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.amber },
  contentsClose: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  contentsCloseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  contents: {
    ...popupCard,
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
