/**
 * Screen Guide — "explain this screen" for a lab (owner 2026-10-31).
 *
 * Owner review of the first build: "too much to scroll, maybe present it in
 * sections; when showing, try to allow the correct area of the screen below
 * to be still seen so what is being read is relevant." So the guide is
 * STEPPED — one section per step — and each step sits AWAY from the area it
 * talks about (types.ts SCREEN_GUIDE_SECTIONS, placement.ts):
 *
 *   1 · WHAT YOU'RE SEEING    card low; display + readout strip bright
 *   2 · WHAT YOU CONTROL      card high; the dock bright and live
 *   3 · WHAT CHANGES — AND WHY card low
 *   4 · WHAT THIS TEACHES      card low
 *   5 · TRY THIS               a compact NON-BLOCKING strip above the dock,
 *                              one experiment at a time (‹ ›), nothing dimmed:
 *                              move the faders and watch the display
 *
 * Step marker = dots + "N · NAME" — never "N of total" (owner rule).
 * ‹ BACK / NEXT ›, ✕ always, the last step's button is GOT IT.
 *
 * Pieces:
 * • ScreenGuideHost — put it INSIDE the screen's root View (it renders the
 *   overlay as the root's last child). The overlay lives in the screen's own
 *   view tree, not a native Modal, on purpose: the regions it keeps bright are
 *   measured with measureInWindow, and on Android a Modal is a separate
 *   window whose origin can differ by the status bar — the bright band would
 *   miss the display. In-tree, the Low-Light wash reaches it with no extra
 *   work, it can never stack Modal-on-Modal (K10), and the TRY THIS strip can
 *   leave the rest of the screen live. Android BACK closes it.
 * • ScreenGuideKey — the header ⓘ (the compact AccuracyNote chip's exact
 *   look, accessible label "Explain this screen"). With a host it opens the
 *   overlay; without one (a future screen that has not added a host) it falls
 *   back to the same stepped card centred in a DimModal.
 * • ScreenGuideHintAnchor — wraps the lab header; ONCE per device hangs a
 *   small inline callout under its right edge pointing at the key. Gates:
 *   Low-Light / kill switch (useOverlaysSuppressed), focus, the lab term popup
 *   (useLabTermIntroOwed), any open DimModal (useModalHostOpen) and a closing
 *   fade (rootModalHoldMs), then a short settle. Tap it, or use the key, and
 *   it retires (`ape:intro:screenGuideHint`, screenGuideHintStore.ts).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, rootModalHoldMs, useModalHostOpen } from '../../../components/DimModal';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../../theme/tokens';
import { useBackWhileFocused } from '../../../lib/useBackWhileFocused';
import { useOverlaysSuppressed } from '../../dev/popupSuppressStore';
import { useLabTermIntroOwed } from '../../intro/screenIntros';
import { markScreenGuideHintSeen, useScreenGuideHintSeen } from './screenGuideHintStore';
import { measureGuideRegion, measureView } from './guideRegions';
import { onScreen, placeGuideStep, unionRect, type GuideLayout } from './placement';
import {
  SCREEN_GUIDE_HINT_TEXT,
  SCREEN_GUIDE_KEY_LABEL,
  SCREEN_GUIDE_SECTIONS,
  screenGuideStepLabel,
  type ScreenGuide,
} from './types';

/** How long the screen must sit quiet (focused, no popup) before the hint
 *  shows: past GuestStartReminder's 1.2 s fallback, so a guest's reminder
 *  presents first instead of popping over a freshly drawn callout. */
export const SCREEN_GUIDE_HINT_SETTLE_MS = 1500;

const LAST = SCREEN_GUIDE_SECTIONS.length - 1;
const DIM = 'rgba(0,0,0,0.62)';

// ───────────────────────────────────────────────────────── the stepped card ──

function StepDots({ count, at, small = false }: { count: number; at: number; small?: boolean }) {
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[small ? styles.dotSmall : styles.dot, i === at && styles.dotOn]} />
      ))}
    </View>
  );
}

/**
 * One step of the guide. `strip` = the TRY THIS strip: one experiment at a
 * time with its own ‹ ›. In the centred fallback (`strip` false on the last
 * step) the experiments are listed like any other section.
 */
function GuideCard({
  title,
  guide,
  step,
  onStep,
  exp,
  onExp,
  onClose,
  strip,
  maxHeight,
}: {
  title: string;
  guide: ScreenGuide;
  step: number;
  onStep: (i: number) => void;
  exp: number;
  onExp: (i: number) => void;
  onClose: () => void;
  strip: boolean;
  maxHeight?: number;
}) {
  const section = SCREEN_GUIDE_SECTIONS[step];
  const lines = guide[section.key];
  const last = step === LAST;
  const items = guide.tryThis;
  const e = Math.min(exp, items.length - 1);
  return (
    <View
      style={[styles.card, strip && styles.cardStrip, maxHeight ? { maxHeight } : null]}
      accessibilityLabel={`${title}, explained. ${screenGuideStepLabel(step)}`}
    >
      <View style={styles.cardHead}>
        <StepDots count={SCREEN_GUIDE_SECTIONS.length} at={step} />
        <Text style={styles.stepLabel} accessibilityRole="header">
          {screenGuideStepLabel(step)}
        </Text>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeX} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.closeXText}>✕</Text>
        </Pressable>
      </View>

      {strip ? (
        <View style={styles.tryRow}>
          <Pressable
            onPress={() => onExp(Math.max(0, e - 1))}
            disabled={e === 0}
            hitSlop={8}
            style={[styles.tryArrow, e === 0 && styles.navOff]}
            accessibilityRole="button"
            accessibilityLabel="Previous experiment"
          >
            <Text style={styles.tryArrowText} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
          </Pressable>
          <View style={styles.tryBody}>
            <Text style={styles.tryText}>{items[e]}</Text>
            <StepDots count={items.length} at={e} small />
          </View>
          <Pressable
            onPress={() => onExp(Math.min(items.length - 1, e + 1))}
            disabled={e === items.length - 1}
            hitSlop={8}
            style={[styles.tryArrow, e === items.length - 1 && styles.navOff]}
            accessibilityRole="button"
            accessibilityLabel="Next experiment"
          >
            <Text style={styles.tryArrowText} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>›</Text>
          </Pressable>
        </View>
      ) : (
        // Written to fit without scrolling (types.ts SCREEN_GUIDE_BUDGET);
        // the ScrollView is only a safety net for a very short screen or a
        // large accessibility text size.
        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {lines.map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>›</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.navRow}>
        <Pressable
          onPress={() => onStep(step - 1)}
          disabled={step === 0}
          style={[styles.navBtn, step === 0 && styles.navOff]}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityState={{ disabled: step === 0 }}
        >
          <Text style={styles.navText}>‹ BACK</Text>
        </Pressable>
        {last ? (
          <Pressable onPress={onClose} style={[styles.navBtn, styles.navPrimary]} accessibilityRole="button" accessibilityLabel="Got it">
            <Text style={[styles.navText, styles.navPrimaryText]}>GOT IT</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => onStep(step + 1)} style={[styles.navBtn, styles.navPrimary]} accessibilityRole="button" accessibilityLabel="Next">
            <Text style={[styles.navText, styles.navPrimaryText]}>NEXT ›</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────── the in-screen overlay host ──

type HostApi = { open: (title: string, guide: ScreenGuide) => void };
const HostContext = createContext<HostApi | null>(null);

/**
 * Renders `children`, then — while a guide is open — the overlay as the next
 * sibling. Place it as the screen root View's whole content so the overlay's
 * absolute fill covers the screen. `resetKey` closes an open guide when the
 * screen swaps content in place (a module change). `regions={false}` for a
 * screen with no Rack Unit (the lab home): bottom card, no bright band.
 *
 * `backRef` (ADDITIVE, D41 K7 2026-11-01): for a host INSIDE a native Modal
 * (kit/LabCheckEnd's end layer). There Android BACK reaches only the Modal's
 * onRequestClose, never the overlay's BackHandler, so the Modal asks the host
 * first: `backRef.current()` closes an open guide and returns true, or
 * returns false when none is open. Omitted = exactly as before.
 */
export function ScreenGuideHost({
  children,
  resetKey,
  regions = true,
  backRef,
}: {
  children: ReactNode;
  resetKey?: string;
  regions?: boolean;
  backRef?: MutableRefObject<(() => boolean) | null>;
}) {
  const [shown, setShown] = useState<{ title: string; guide: ScreenGuide } | null>(null);
  const shownRef = useRef(false);
  shownRef.current = shown != null;
  useEffect(() => {
    if (!backRef) return;
    backRef.current = () => {
      if (!shownRef.current) return false;
      shownRef.current = false;
      setShown(null);
      return true;
    };
    return () => {
      backRef.current = null;
    };
  }, [backRef]);
  const open = useCallback((title: string, guide: ScreenGuide) => setShown({ title, guide }), []);
  const api = useMemo(() => ({ open }), [open]);
  useEffect(() => setShown(null), [resetKey]);
  return (
    <HostContext.Provider value={api}>
      {children}
      {shown ? <ScreenGuideOverlay title={shown.title} guide={shown.guide} regions={regions} onClose={() => setShown(null)} /> : null}
    </HostContext.Provider>
  );
}

function ScreenGuideOverlay({
  title,
  guide,
  regions,
  onClose,
}: {
  title: string;
  guide: ScreenGuide;
  regions: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const rootRef = useRef<View>(null);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const [step, setStep] = useState(0);
  const [exp, setExp] = useState(0);
  const [layout, setLayout] = useState<GuideLayout | null>(null);

  // Measure the overlay root and the regions IN THE SAME WINDOW, then make the
  // regions relative to the root. Re-measured on every step: the dock rides
  // up and down with the well, and HIDE DISPLAY removes the glass.
  const measure = useCallback(async () => {
    const root = await measureView(rootRef);
    if (!alive.current || !root) return;
    const [d, r, k] = regions
      ? await Promise.all([measureGuideRegion('display'), measureGuideRegion('readouts'), measureGuideRegion('dock')])
      : [null, null, null];
    if (!alive.current) return;
    const rel = (q: typeof d) => onScreen(q ? { x: q.x - root.x, y: q.y - root.y, w: q.w, h: q.h } : null, root.w, root.h);
    setLayout({
      rootW: root.w,
      rootH: root.h,
      insetTop: insets.top,
      insetBottom: insets.bottom,
      display: unionRect(rel(d), rel(r)),
      dock: rel(k),
    });
  }, [regions, insets.top, insets.bottom]);
  useEffect(() => {
    void measure();
  }, [step, measure]);

  const back = useCallback(() => {
    onClose();
    return true;
  }, [onClose]);
  useBackWhileFocused(true, back);

  const section = SCREEN_GUIDE_SECTIONS[step];
  const place = layout ? placeGuideStep(section.place, layout) : null;
  const keep = place?.keep ?? null;
  const W = layout?.rootW ?? 0;

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={styles.overlay}
      pointerEvents="box-none"
      onLayout={() => void measure()}
      accessibilityViewIsModal={place?.blocking ?? true}
    >
      {place && place.dim ? (
        keep ? (
          <>
            {/* Four dim panes around the bright band; they also hold taps
                (reading mode). The band itself stays live. */}
            <View style={[styles.pane, { top: 0, left: 0, right: 0, height: Math.max(0, keep.y) }]} />
            <View style={[styles.pane, { top: keep.y + keep.h, left: 0, right: 0, bottom: 0 }]} />
            <View style={[styles.pane, { top: keep.y, left: 0, width: Math.max(0, keep.x), height: keep.h }]} />
            <View style={[styles.pane, { top: keep.y, left: keep.x + keep.w, width: Math.max(0, W - keep.x - keep.w), height: keep.h }]} />
            <View pointerEvents="none" style={[styles.keepOutline, { top: keep.y - 3, left: keep.x - 3, width: keep.w + 6, height: keep.h + 6 }]} />
          </>
        ) : (
          <View style={[styles.pane, StyleSheet.absoluteFill]} />
        )
      ) : null}
      {place ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.cardSlot,
            place.card.top != null ? { top: place.card.top } : null,
            place.card.bottom != null ? { bottom: place.card.bottom } : null,
          ]}
        >
          <GuideCard
            title={title}
            guide={guide}
            step={step}
            onStep={(i) => {
              setExp(0);
              setStep(Math.max(0, Math.min(LAST, i)));
            }}
            exp={exp}
            onExp={setExp}
            onClose={onClose}
            strip={section.place === 'strip'}
            maxHeight={place.card.maxHeight}
          />
        </View>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────── fallback: a centred DimModal card ──

/** The stepped guide centred in a DimModal — for a screen with no host. */
export function ScreenGuidePopup({
  visible,
  title,
  guide,
  onClose,
}: {
  visible: boolean;
  title: string;
  guide: ScreenGuide;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [exp, setExp] = useState(0);
  useEffect(() => {
    if (visible) {
      setStep(0);
      setExp(0);
    }
  }, [visible]);
  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSlot}>
          <GuideCard
            title={title}
            guide={guide}
            step={step}
            onStep={(i) => setStep(Math.max(0, Math.min(LAST, i)))}
            exp={exp}
            onExp={setExp}
            onClose={onClose}
            strip={false}
          />
        </View>
      </View>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────── the header key ──

export function ScreenGuideKey({ title, guide }: { title: string; guide: ScreenGuide }) {
  const host = useContext(HostContext);
  const [open, setOpen] = useState(false);
  // Fallback path only — AccuracyNote's lesson (bug hunt 2026-09-29): if iOS
  // refused to present the Modal, `open` is stuck true and a plain
  // setOpen(true) is a no-op forever. A tap while "open" closes it and
  // reopens one frame later — cancelled if the key unmounts.
  const [reopen, setReopen] = useState(false);
  useEffect(() => {
    if (open || !reopen) return;
    // A one-frame timer, not requestAnimationFrame: a rAF with a cancel reads
    // as an animation loop to the motion ratchet (patternP10b), and this is a
    // single re-present, not animation.
    const t = setTimeout(() => {
      setReopen(false);
      setOpen(true);
    }, 16);
    return () => clearTimeout(t);
  }, [open, reopen]);
  return (
    <>
      <Pressable
        style={styles.chip}
        onPress={() => {
          // Using the key is what the hint asks for: retire it.
          void markScreenGuideHintSeen();
          if (host) {
            host.open(title, guide);
            return;
          }
          if (open) {
            setOpen(false);
            setReopen(true);
          } else {
            setOpen(true);
          }
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={SCREEN_GUIDE_KEY_LABEL}
      >
        <Text style={styles.chipGlyph}>ⓘ</Text>
      </Pressable>
      {host ? null : <ScreenGuidePopup visible={open} title={title} guide={guide} onClose={() => setOpen(false)} />}
    </>
  );
}

// ───────────────────────────────────────────────────────── the one-time hint ──

/** Whether the one-time hint should be on screen right now (see the header
 *  comment for every gate). */
export function useScreenGuideHintVisible(): boolean {
  const seen = useScreenGuideHintSeen();
  const focused = useIsFocused();
  const suppressed = useOverlaysSuppressed();
  const labTermFirst = useLabTermIntroOwed();
  const modalUp = useModalHostOpen();
  const owed = seen === false;
  const clear = owed && focused && !suppressed && !labTermFirst && !modalUp;
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!clear) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), SCREEN_GUIDE_HINT_SETTLE_MS + rootModalHoldMs());
    return () => clearTimeout(t);
  }, [clear]);
  return clear && settled;
}

/**
 * Wraps the lab header. While the hint is owed and the screen is quiet, a
 * small callout hangs under the header's right edge with its caret pointing
 * up at the ⓘ key. Absolutely positioned, so nothing below it moves (a rack
 * stage measures itself on layout and must never resize mid-visit).
 */
export function ScreenGuideHintAnchor({ children, off = false }: { children: ReactNode; off?: boolean }) {
  // `off`: a shared shell keeps the anchor mounted (so its header never
  // remounts) on a tab/page that has no guide — no key there, so no hint.
  const visible = useScreenGuideHintVisible() && !off;
  return (
    <View style={visible ? styles.anchorOnTop : undefined}>
      {children}
      {visible ? (
        <Pressable
          style={styles.hint}
          onPress={() => void markScreenGuideHintSeen()}
          accessibilityRole="button"
          accessibilityLabel={`${SCREEN_GUIDE_HINT_TEXT}. Tap to dismiss.`}
        >
          <View style={styles.hintCaret} />
          <Text style={styles.hintText}>{SCREEN_GUIDE_HINT_TEXT}</Text>
          <Text style={styles.hintClose}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── key: AccuracyNote's compact chip, verbatim geometry and colours ──
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    backgroundColor: '#2a2210',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  chipGlyph: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: colors.amber, marginTop: -1 },

  // ── overlay ──
  // Above the header, the nav strip, the rack's trays (zIndex) — and on
  // Android above any elevated child.
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100 },
  pane: { position: 'absolute', backgroundColor: DIM },
  keepOutline: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,77,.85)',
    borderRadius: 12,
  },
  cardSlot: { position: 'absolute', left: 8, right: 8, alignItems: 'center' },

  // ── card ──
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#101014',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    overflow: 'hidden',
  },
  cardStrip: { backgroundColor: '#131209', paddingTop: 8, paddingBottom: 8, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3a3a44' },
  dotSmall: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#3a3a44' },
  dotOn: { backgroundColor: colors.amber },
  stepLabel: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.amber },
  closeX: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2a2a31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeXText: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textSecondary },
  bodyScroll: { flexGrow: 0, flexShrink: 1 },
  body: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  bulletDot: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, lineHeight: 18, color: colors.amber },
  bulletText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  tryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tryArrow: {
    width: 32,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryArrowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.amber, marginTop: -2 },
  tryBody: { flex: 1, gap: 6, alignItems: 'center' },
  tryText: { alignSelf: 'stretch', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  navRow: { flexDirection: 'row', gap: 8 },
  navBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPrimary: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: 'rgba(255,198,77,.12)' },
  navOff: { opacity: 0.35 },
  navText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  navPrimaryText: { color: colors.amber },

  // ── fallback modal ──
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.66)', alignItems: 'center', justifyContent: 'center', padding: 12 },
  modalSlot: { width: '100%', maxWidth: 480, maxHeight: '86%' },

  // ── hint ──
  // The header's siblings (the nav strip, the stage) render after it, so the
  // wrapper rises above them only while the callout is out.
  anchorOnTop: { zIndex: 30, elevation: 30 },
  hint: {
    position: 'absolute',
    top: '100%',
    right: 8,
    maxWidth: 270,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    backgroundColor: '#1c180d',
    paddingVertical: 8,
    paddingHorizontal: 11,
    elevation: 30,
  },
  // Caret under the ⓘ key (header padding 14 + half the ~30 pt key ≈ 29 pt
  // from the screen's right edge): a rotated square riding the top border.
  hintCaret: {
    position: 'absolute',
    top: -6,
    right: 15,
    width: 11,
    height: 11,
    backgroundColor: '#1c180d',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    transform: [{ rotate: '45deg' }],
  },
  hintText: { flexShrink: 1, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 17, color: colors.textPrimary },
  hintClose: { fontFamily: fonts.barlowSemiBold, fontSize: 12, color: colors.textSub },
});
