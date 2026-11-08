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
 * • The INTRO CARD (owner 2026-11-08, D52: "no real intro to what is going on
 *   or being learned … no instruction or guidance"). Any guide with `intro`
 *   gets it, with no per-screen wiring: the ScreenGuideKey OFFERS the intro to
 *   its host, and the host presents it ONCE per device per intro
 *   (`ape:intro:screenIntroCards`, screenIntroCardStore.ts; a failed read
 *   shows nothing and writes nothing). Two labelled parts — WHAT YOU'RE
 *   LEARNING / WHERE TO START — a GOT IT, a ✕ and EXPLAIN THIS SCREEN into
 *   the stepped guide, whose first step leads back with ‹ INTRO. Placement
 *   (placement.ts placeIntroCard): on a Rack Unit the dock — the controls the
 *   "start" line names — stays bright and live and the card is centred above
 *   it; otherwise it is centred over the dim, and one tap anywhere on the dim
 *   closes it. Gates, as the hint's: Low-Light / kill switch, focus, the lab
 *   term popup, any open DimModal and its closing fade (rootModalHoldMs), the
 *   host's `hold`, then a settle. The ⓘ hint waits while a card is owed or up.
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
import { areOverlaysSuppressed, useOverlaysSuppressed } from '../../dev/popupSuppressStore';
import { useLabTermIntroOwed } from '../../intro/screenIntros';
import { devBypass } from '../../../config/devMode';
import { markScreenGuideHintSeen, useScreenGuideHintSeen } from './screenGuideHintStore';
import {
  markScreenIntroSeen,
  screenIntroBusyId,
  setScreenIntroCardBusy,
  useScreenIntroCardBusy,
  useScreenIntroSeen,
} from './screenIntroCardStore';
import { measureGuideRegion, measureView } from './guideRegions';
import { onScreen, placeGuideStep, placeIntroCard, unionRect, type GuideLayout } from './placement';
import {
  SCREEN_GUIDE_HINT_TEXT,
  SCREEN_GUIDE_KEY_LABEL,
  SCREEN_GUIDE_SECTIONS,
  SCREEN_GUIDES_ON,
  SCREEN_INTRO_TEXT,
  screenGuideStepLabel,
  screenIntroId,
  type ScreenGuide,
  type ScreenIntro,
} from './types';

/** How long the screen must sit quiet (focused, no popup) before the hint
 *  shows: past GuestStartReminder's 1.2 s fallback, so a guest's reminder
 *  presents first instead of popping over a freshly drawn callout. */
export const SCREEN_GUIDE_HINT_SETTLE_MS = 1500;

/** The same quiet wait before the INTRO CARD presents (past the guest
 *  reminder's fallback and the lab term popup's hand-off). */
export const SCREEN_INTRO_SETTLE_MS = 1500;

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
  onIntro,
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
  /** The screen has an intro card: the first step's left button goes back
   *  to it (‹ INTRO) instead of a dead ‹ BACK. */
  onIntro?: () => void;
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
        {step === 0 && onIntro ? (
          <Pressable onPress={onIntro} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Back to the intro">
            <Text style={styles.navText}>{SCREEN_INTRO_TEXT.reopen}</Text>
          </Pressable>
        ) : (
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
        )}
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

// ────────────────────────────────────────────────────────── the intro card ──

/**
 * The intro card: what this screen teaches and the first thing to do. Two
 * labelled parts (types.ts SCREEN_INTRO_TEXT), ✕ + GOT IT to close, and
 * EXPLAIN THIS SCREEN into the stepped guide. Written to fit without
 * scrolling (SCREEN_INTRO_WORDS); the ScrollView is a safety net for a very
 * short screen or a large accessibility text size.
 */
function IntroCard({
  title,
  intro,
  onClose,
  onExplain,
  maxHeight,
}: {
  title: string;
  intro: ScreenIntro;
  onClose: () => void;
  onExplain: () => void;
  maxHeight?: number;
}) {
  return (
    <View style={[styles.card, styles.introCard, maxHeight ? { maxHeight } : null]}>
      <View style={styles.cardHead}>
        <Text style={styles.stepLabel} accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeX} accessibilityRole="button" accessibilityLabel="Close the intro">
          <Text style={styles.closeXText}>✕</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.introBody} showsVerticalScrollIndicator={false}>
        <View style={styles.introPart}>
          <Text style={styles.introLabel}>{SCREEN_INTRO_TEXT.learning}</Text>
          <Text style={styles.introLearning}>{intro.learning}</Text>
        </View>
        <View style={styles.introPart}>
          <Text style={styles.introLabel}>{SCREEN_INTRO_TEXT.start}</Text>
          <Text style={styles.introStart}>{intro.start}</Text>
        </View>
      </ScrollView>
      <View style={styles.navRow}>
        <Pressable
          onPress={onExplain}
          style={[styles.navBtn, styles.introExplain]}
          accessibilityRole="button"
          accessibilityLabel={SCREEN_GUIDE_KEY_LABEL}
        >
          <Text style={styles.navText}>ⓘ {SCREEN_INTRO_TEXT.explain}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.navBtn, styles.navPrimary]} accessibilityRole="button" accessibilityLabel="Got it">
          <Text style={[styles.navText, styles.navPrimaryText]}>{SCREEN_INTRO_TEXT.dismiss}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Hold the one-time ⓘ hint back while `on` (a card owed or on screen). */
function useIntroBusy(on: boolean): void {
  const [me] = useState(screenIntroBusyId);
  useEffect(() => {
    setScreenIntroCardBusy(me, on);
    return () => setScreenIntroCardBusy(me, false);
  }, [me, on]);
}

type IntroOffer = { owner: number; id: string; title: string; guide: ScreenGuide; intro: ScreenIntro };

/**
 * Decides WHEN an offered intro card presents; draws nothing itself. Once per
 * device per intro (the dev bypass `alwaysShowIntros` shows it on every visit
 * and writes nothing, as useScreenIntro does). A read still out keeps it owed;
 * a failed read (UNREADABLE) shows nothing and writes nothing. The seen list
 * is written when the student CLOSES the card (✕, GOT IT, the dim, BACK, or
 * EXPLAIN THIS SCREEN) — not when it presents — so a card that never got
 * read (the screen left or rebuilt under it) comes back next time.
 */
function IntroCardController({
  offer,
  hold,
  inModal,
  onPresent,
}: {
  offer: IntroOffer;
  hold: boolean;
  /** The host is inside a native Modal (LabCheckEnd's end layer): that Modal
   *  is the open DimModal, so it does not count as "another popup". */
  inModal: boolean;
  onPresent: () => void;
}) {
  const bypass = devBypass('alwaysShowIntros');
  const stored = useScreenIntroSeen(offer.id);
  const seen = bypass ? false : stored;
  const focused = useIsFocused();
  const suppressed = useOverlaysSuppressed();
  const labTermFirst = useLabTermIntroOwed();
  const modalUp = useModalHostOpen();
  const owed = seen === 'loading' || seen === false;
  useIntroBusy(owed && focused);
  const clear = seen === false && focused && !suppressed && !labTermFirst && !hold && (inModal || !modalUp);
  const presentRef = useRef(onPresent);
  presentRef.current = onPresent;
  useEffect(() => {
    if (!clear) return;
    const t = setTimeout(() => {
      // Re-checked at the moment it would show: Low-Light may have come on.
      if (areOverlaysSuppressed()) return;
      presentRef.current();
    }, SCREEN_INTRO_SETTLE_MS + rootModalHoldMs());
    return () => clearTimeout(t);
  }, [clear]);
  return null;
}

/** The student closed an auto-presented card: never auto-show it again on
 *  this device (the dev bypass writes nothing). */
function claimIntro(id: string | undefined): void {
  if (id && !devBypass('alwaysShowIntros')) void markScreenIntroSeen(id);
}

// ─────────────────────────────────────────────── the in-screen overlay host ──

type HostApi = {
  open: (title: string, guide: ScreenGuide) => void;
  /** A ScreenGuideKey whose guide has an intro offers it; the newest wins. */
  offerIntro: (offer: IntroOffer) => void;
  withdrawIntro: (owner: number) => void;
};
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
  hold = false,
}: {
  children: ReactNode;
  resetKey?: string;
  regions?: boolean;
  backRef?: MutableRefObject<(() => boolean) | null>;
  /** ADDITIVE (2026-11-08): the screen's own first-open popup is up or owed
   *  (a ProNote intro, a topic welcome) — the intro card waits, still owed,
   *  until it lifts (the house `hold` rule, K10). Omitted = no extra wait. */
  hold?: boolean;
}) {
  // `claim`: the auto-presented intro's id, written to the seen list when the
  // student closes the card (claimIntro), never before.
  const [shown, setShown] = useState<{ title: string; guide: ScreenGuide; mode: 'guide' | 'intro'; claim?: string } | null>(
    null,
  );
  const [offers, setOffers] = useState<readonly IntroOffer[]>([]);
  // Intros already presented (or made moot by the ⓘ key) on this visit: the
  // controller is not mounted for them again, even under the dev bypass.
  const [handled, setHandled] = useState<ReadonlySet<string>>(() => new Set());
  const offer = offers.length ? offers[offers.length - 1] : null;
  const offerRef = useRef<IntroOffer | null>(null);
  offerRef.current = offer;
  const handle = useCallback((id: string) => {
    setHandled((h) => (h.has(id) ? h : new Set(h).add(id)));
  }, []);
  const shownRef = useRef(false);
  shownRef.current = shown != null;
  const claimRef = useRef<string | undefined>(undefined);
  claimRef.current = shown?.claim;
  useEffect(() => {
    if (!backRef) return;
    backRef.current = () => {
      if (!shownRef.current) return false;
      shownRef.current = false;
      claimIntro(claimRef.current);
      setShown(null);
      return true;
    };
    return () => {
      backRef.current = null;
    };
  }, [backRef]);
  const open = useCallback(
    (title: string, guide: ScreenGuide) => {
      // The student asked for the full guide before the card came up: the
      // card is moot on this visit and counts as shown (‹ INTRO reaches it).
      const o = offerRef.current;
      if (o) {
        claimIntro(o.id);
        handle(o.id);
      }
      setShown({ title, guide, mode: 'guide' });
    },
    [handle],
  );
  const offerIntro = useCallback((o: IntroOffer) => {
    setOffers((list) => [...list.filter((x) => x.owner !== o.owner), o]);
  }, []);
  const withdrawIntro = useCallback((owner: number) => {
    setOffers((list) => (list.some((x) => x.owner === owner) ? list.filter((x) => x.owner !== owner) : list));
  }, []);
  const api = useMemo(() => ({ open, offerIntro, withdrawIntro }), [open, offerIntro, withdrawIntro]);
  // Close on a REAL content swap only. A bare `[resetKey]` effect also fires
  // when React re-runs effects with nothing changed (Fast Refresh in the web
  // preview, StrictMode), which closed a just-presented intro card unread.
  const lastReset = useRef(resetKey);
  useEffect(() => {
    if (lastReset.current === resetKey) return;
    lastReset.current = resetKey;
    setShown(null);
  }, [resetKey]);
  const close = useCallback(() => {
    claimIntro(claimRef.current);
    setShown(null);
  }, []);
  const introOf = shown?.mode === 'intro' ? shown.guide.intro : undefined;
  return (
    <HostContext.Provider value={api}>
      {children}
      {offer && !handled.has(offer.id) ? (
        <IntroCardController
          key={offer.id}
          offer={offer}
          hold={hold || shown != null}
          inModal={backRef != null}
          onPresent={() => {
            handle(offer.id);
            setShown({ title: offer.title, guide: offer.guide, mode: 'intro', claim: offer.id });
          }}
        />
      ) : null}
      {shown && introOf ? (
        <ScreenIntroOverlay
          title={shown.title}
          intro={introOf}
          regions={regions}
          onClose={close}
          onExplain={() => {
            claimIntro(shown.claim);
            setShown({ title: shown.title, guide: shown.guide, mode: 'guide' });
          }}
        />
      ) : shown ? (
        <ScreenGuideOverlay
          title={shown.title}
          guide={shown.guide}
          regions={regions}
          onClose={close}
          onIntro={shown.guide.intro ? () => setShown({ title: shown.title, guide: shown.guide, mode: 'intro' }) : undefined}
        />
      ) : null}
    </HostContext.Provider>
  );
}

/**
 * The intro card in the screen's own tree (the guide overlay's reasons: the
 * dock it keeps live is measured in the same window, the Low-Light wash
 * reaches it, never Modal-on-Modal). Dim everywhere but the dock; a tap on
 * the dim, ✕, GOT IT or Android BACK closes it — one tap, the house intro
 * rule, so it never stands between the student and the header's ‹ back.
 */
function ScreenIntroOverlay({
  title,
  intro,
  regions,
  onClose,
  onExplain,
}: {
  title: string;
  intro: ScreenIntro;
  regions: boolean;
  onClose: () => void;
  onExplain: () => void;
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
  useIntroBusy(true);
  const [layout, setLayout] = useState<GuideLayout | null>(null);
  const measure = useCallback(async () => {
    const root = await measureView(rootRef);
    if (!alive.current || !root) return;
    const k = regions ? await measureGuideRegion('dock') : null;
    if (!alive.current) return;
    setLayout({
      rootW: root.w,
      rootH: root.h,
      insetTop: insets.top,
      insetBottom: insets.bottom,
      display: null,
      dock: onScreen(k ? { x: k.x - root.x, y: k.y - root.y, w: k.w, h: k.h } : null, root.w, root.h),
    });
  }, [regions, insets.top, insets.bottom]);
  useEffect(() => {
    void measure();
  }, [measure]);
  const back = useCallback(() => {
    onClose();
    return true;
  }, [onClose]);
  useBackWhileFocused(true, back);

  const place = layout ? placeIntroCard(layout) : null;
  const keep = place?.keep ?? null;
  const W = layout?.rootW ?? 0;
  // The dim panes close the card; hidden from screen readers (the card's ✕
  // and GOT IT say it in words).
  const pane = (style: object, k: string) => (
    <Pressable
      key={k}
      style={[styles.pane, style]}
      onPress={onClose}
      accessible={false}
    />
  );
  return (
    <View ref={rootRef} collapsable={false} style={styles.overlay} pointerEvents="box-none" onLayout={() => void measure()} accessibilityViewIsModal={!keep}>
      {place
        ? keep
          ? [
              pane({ top: 0, left: 0, right: 0, height: Math.max(0, keep.y) }, 't'),
              pane({ top: keep.y + keep.h, left: 0, right: 0, bottom: 0 }, 'b'),
              pane({ top: keep.y, left: 0, width: Math.max(0, keep.x), height: keep.h }, 'l'),
              pane({ top: keep.y, left: keep.x + keep.w, width: Math.max(0, W - keep.x - keep.w), height: keep.h }, 'r'),
              <View
                key="o"
                pointerEvents="none"
                style={[styles.keepOutline, { top: keep.y - 3, left: keep.x - 3, width: keep.w + 6, height: keep.h + 6 }]}
              />,
            ]
          : pane(StyleSheet.absoluteFill, 'all')
        : null}
      {place ? (
        <View pointerEvents="box-none" style={[styles.introSlot, { top: place.slot.top, height: place.slot.height }]}>
          <IntroCard title={title} intro={intro} onClose={onClose} onExplain={onExplain} maxHeight={place.slot.height} />
        </View>
      ) : null}
    </View>
  );
}

function ScreenGuideOverlay({
  title,
  guide,
  regions,
  onClose,
  onIntro,
}: {
  title: string;
  guide: ScreenGuide;
  regions: boolean;
  onClose: () => void;
  onIntro?: () => void;
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
            onIntro={onIntro}
          />
        </View>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────── fallback: a centred DimModal card ──

/** The stepped guide centred in a DimModal — for a screen with no host. With
 *  `startWith="intro"` (and a guide that has one) it opens on the intro card;
 *  intro and guide share ONE Modal, so EXPLAIN THIS SCREEN / ‹ INTRO never
 *  close one popup and present another mid-dismiss (K10). */
export function ScreenGuidePopup({
  visible,
  title,
  guide,
  onClose,
  startWith = 'guide',
}: {
  visible: boolean;
  title: string;
  guide: ScreenGuide;
  onClose: () => void;
  startWith?: 'guide' | 'intro';
}) {
  const [step, setStep] = useState(0);
  const [exp, setExp] = useState(0);
  const [mode, setMode] = useState<'guide' | 'intro'>(startWith);
  // Reset on each open DURING render (React's "adjust state when a prop
  // changes" pattern), so the first frame of the fade-in is already the right
  // card — never one frame of the guide before the intro.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep(0);
      setExp(0);
      setMode(startWith);
    }
  }
  const intro = mode === 'intro' ? guide.intro : undefined;
  useIntroBusy(visible && intro != null);
  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        {intro ? (
          // The intro closes on one tap anywhere off the card (house intro rule).
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        ) : null}
        <View style={styles.modalSlot}>
          {intro ? (
            <IntroCard
              title={title}
              intro={intro}
              onClose={onClose}
              onExplain={() => {
                setStep(0);
                setExp(0);
                setMode('guide');
              }}
            />
          ) : (
            <GuideCard
              title={title}
              guide={guide}
              step={step}
              onStep={(i) => setStep(Math.max(0, Math.min(LAST, i)))}
              exp={exp}
              onExp={setExp}
              onClose={onClose}
              strip={false}
              onIntro={guide.intro ? () => setMode('intro') : undefined}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────── the header key ──

/**
 * The header ⓘ. `introId` (optional) overrides the intro card's seen id —
 * by default a hash of the intro's own words (types.ts screenIntroId), so no
 * screen has to pass one.
 */
export function ScreenGuideKey({ title, guide, introId }: { title: string; guide: ScreenGuide; introId?: string }) {
  return SCREEN_GUIDES_ON ? <LiveScreenGuideKey title={title} guide={guide} introId={introId} /> : null;
}

let keySeq = 0;

function LiveScreenGuideKey({ title, guide, introId }: { title: string; guide: ScreenGuide; introId?: string }) {
  const host = useContext(HostContext);
  const [open, setOpen] = useState(false);
  const [startWith, setStartWith] = useState<'guide' | 'intro'>('guide');
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

  // The intro card: offered to the host, which presents it (no per-screen
  // wiring). With no host the key presents it itself, in its fallback popup.
  const intro = guide.intro;
  const id = intro ? introId ?? screenIntroId(intro) : null;
  const [owner] = useState(() => ++keySeq);
  useEffect(() => {
    if (!host || !intro || !id) return;
    host.offerIntro({ owner, id, title, guide, intro });
    return () => host.withdrawIntro(owner);
  }, [host, owner, id, title, guide, intro]);
  const [fallbackHandled, setFallbackHandled] = useState<string | null>(null);
  // The presented card's id, claimed when the popup closes.
  const pendingClaim = useRef<string | undefined>(undefined);
  const fallbackOffer = !host && intro && id && fallbackHandled !== id ? { owner, id, title, guide, intro } : null;

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
          if (id) {
            // The full guide asked for first: the card is moot on this visit.
            claimIntro(id);
            setFallbackHandled(id);
          }
          setStartWith('guide');
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
      {fallbackOffer ? (
        <IntroCardController
          key={fallbackOffer.id}
          offer={fallbackOffer}
          hold={open}
          inModal={false}
          onPresent={() => {
            setFallbackHandled(fallbackOffer.id);
            pendingClaim.current = fallbackOffer.id;
            setStartWith('intro');
            setOpen(true);
          }}
        />
      ) : null}
      {host ? null : (
        <ScreenGuidePopup
          visible={open}
          title={title}
          guide={guide}
          startWith={startWith}
          onClose={() => {
            claimIntro(pendingClaim.current);
            pendingClaim.current = undefined;
            setOpen(false);
          }}
        />
      )}
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
  // A focused screen's intro card goes first (owed or on screen): the hint
  // waits for it, then points at the ⓘ that brings the card back.
  const introFirst = useScreenIntroCardBusy();
  const owed = seen === false && !introFirst;
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
  const visible = useScreenGuideHintVisible() && !off && SCREEN_GUIDES_ON;
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

  // ── intro card ──
  // Centred in its slot (placement.ts placeIntroCard): above a live dock on a
  // Rack Unit, else on the whole screen.
  introSlot: { position: 'absolute', left: 8, right: 8, alignItems: 'center', justifyContent: 'center' },
  introCard: { paddingTop: 12, paddingBottom: 12, gap: 10 },
  introBody: { gap: 12 },
  introPart: { gap: 4 },
  introLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.amber },
  introLearning: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  introStart: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 20, color: colors.textSecondary },
  introExplain: { flex: 1.45 },

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
