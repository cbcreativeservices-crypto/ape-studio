/**
 * CircleMenu — the app's main navigation (owner-approved design 2026-11-20,
 * "GO, separate branch"). It REPLACES the bottom tab bar on the screens that
 * had one: Home, the Study screens, Progress and Profile.
 *
 * CLOSED: no bar. The screen runs to the bottom and one round MENU button
 * floats in the bottom-left corner (50 pt, 18 pt from the left edge, its
 * bottom 4 pt above the bottom safe-area inset). First visit only: it glows
 * three times and a small amber note points at it; opening the menu once
 * retires both for good (an `ape:intro:*` flag, so it survives sign-outs like
 * every intro and comes back with Settings → "Reset onboarding hints").
 *
 * OPEN (tap, or drag up from the button): a panel rises to half the screen,
 * the screen behind dims, and the twelve places spread out of the button
 * into one clock-face ring (CircleMenuPanel). Close: drag down, tap the dim
 * area, tap the grip, or Android BACK — they fold back into the button.
 * Reduce Motion / Low-Light (useDecorativeMotion) → a plain fade.
 *
 * Also on the Glossary (owner 2026-11-20; the old bar was not), and on the
 * Audio Tools, Calculator Lab and Labs landing screens (ScreenCircleMenu).
 * Put away while the keyboard is up (it would float over the field being
 * typed in) and while a screen's own in-tree overlay is up (useHideCircleMenu).
 *
 * APP-START BUDGET (test/perfStartTrim, a ratchet at 260 modules): this file
 * took TabBar's place and lib/footnote's (the footnote store lives here now,
 * its only reader), so the start graph did not grow. The panel and its drawn
 * icons are NOT imported: they load after the first frame (runSoon idle
 * pre-warm), or at the first tap if that comes sooner.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Keyboard, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, G } from 'react-native-svg';
import { CommonActions, getFocusedRouteNameFromRoute, useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../../theme/tokens';
import { COMMUNITY_VISIBLE } from '../../config/communityVisible';
import { CommunityBadge, useCommunityInbox } from '../../features/directory/CommunityBadge';
import { badgeA11y, badgeCount } from '../../features/directory/inboxCounts';
import { useDecorativeMotion } from '../../features/settings/decorativeMotion';
import { screenReaderOn } from '../../features/settings/a11y';
import { useOverlaysSuppressed } from '../../features/dev/popupSuppressStore';
import { useModalHostOpen } from '../DimModal';
import { createLocalStore } from '../../features/storage/localStore';
import { onScreenIntrosReset } from '../../features/intro/screenIntros';
import { useBackWhileFocused } from '../../lib/useBackWhileFocused';
import { runSoon } from '../../lib/afterInteractions';
import {
  MENU_BUTTON,
  MENU_BUTTON_LEFT,
  MENU_BUTTON_LIFT,
  currentPlace,
  dragTop,
  ringGeometry,
  settleOpen,
  type PlaceKey,
  type RingGeometry,
} from './circleMenuPlaces';
import type { CircleMenuPanelProps } from './CircleMenuPanel';

// ── Footnote notices (Booth 2026-07-08; was src/lib/footnote.ts) ──────────
// An occasional one-line reminder ("This topic is due this week!"). Nothing
// sets one yet — the triggering rules need a data source. With the bar gone
// it shows as a strip beside the MENU button.
let footnoteNow: string | null = null;
const footnoteListeners = new Set<() => void>();
export function setFootnote(message: string | null): void {
  if (message === footnoteNow) return;
  footnoteNow = message;
  footnoteListeners.forEach((l) => l());
}
export function useFootnote(): string | null {
  return useSyncExternalStore(
    (cb) => {
      footnoteListeners.add(cb);
      return () => footnoteListeners.delete(cb);
    },
    () => footnoteNow,
  );
}

// ── A screen's own in-tree overlay holds the button away ────────────────
// The menu floats over the whole tab screen, so a screen that draws its own
// overlay in the tree (the Glossary's term popup, its sense chooser and its
// topic list) says so while it is up, and the button steps aside until it
// closes. RN Modals need nothing: they sit above everything already.
const menuHolds = new Set<string>();
const holdListeners = new Set<() => void>();
function holdCount(): number {
  return menuHolds.size;
}
/** While `active`, the MENU button (and an open menu) is put away. */
export function useHideCircleMenu(key: string, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    menuHolds.add(key);
    holdListeners.forEach((l) => l());
    return () => {
      menuHolds.delete(key);
      holdListeners.forEach((l) => l());
    };
  }, [key, active]);
}
function useMenuHeld(): boolean {
  return (
    useSyncExternalStore(
      (cb) => {
        holdListeners.add(cb);
        return () => holdListeners.delete(cb);
      },
      holdCount,
      holdCount,
    ) > 0
  );
}

// ── The first-visit hint's flag (device-level, an intro flag) ────────────
export const MENU_HINT_KEY = 'ape:intro:circleMenu';
const hintStore = createLocalStore<boolean>({
  key: MENU_HINT_KEY,
  empty: () => false,
  parse: (v) => v === true,
});
onScreenIntrosReset(() => hintStore.reset());

/** 'loading' | 'unreadable' | seen. A failed read shows no hint and writes
 *  nothing over the stored flag (createLocalStore's rule). */
function useMenuHintSeen(): 'loading' | 'unreadable' | boolean {
  const seen = hintStore.use();
  const hydrated = hintStore.useHydrated();
  const unreadable = useSyncExternalStore(hintStore.subscribe, hintStore.isUnreadable, hintStore.isUnreadable);
  if (!hydrated) return unreadable ? 'unreadable' : 'loading';
  return seen;
}

// ── The panel loads after the first frame ────────────────────────────────
type PanelModule = typeof import('./CircleMenuPanel');
let panelModule: PanelModule | null = null;
function loadPanel(): PanelModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (!panelModule) panelModule = require('./CircleMenuPanel') as PanelModule;
  return panelModule;
}

/** QUICK (owner 2026-11-20: "animate it (quickly) opening and closing"):
 *  the panel rises and the circles spread out of the button in 240 ms, and
 *  fold back in 190 ms — a firm ease-out, no slow settle, no wobble. The
 *  circles' stagger (circleMenuPlaces.flight) lives inside that time. A drag
 *  that is let go part-way finishes in the share of that time still to run.
 *  Under Reduce Motion / Low-Light: a plain fade. */
export const OPEN_MS = 240;
export const CLOSE_MS = 190;
const FADE_MS = 180;
/** The first-visit note waits for the screen to settle (welcome popups,
 *  the privacy notice and intros go first). */
const HINT_DELAY_MS = 1400;

/** Root screen of each nested-stack tab (TabBar's rule, kept). */
const TAB_ROOTS: Partial<Record<string, string>> = { Study: 'Dashboard', Achievements: 'AchievementsHome' };

/** Where a picked circle goes. `unread` = the Community has something waiting. */
type Go = (key: PlaceKey, unread: boolean) => void;
type Nav = { navigate: (...a: unknown[]) => void };

/**
 * The root-stack places: the same call from the tab bar and from a hub
 * screen (a navigate from the tabs reaches the root stack by bubbling).
 */
function goRootPlace(nav: Nav, key: PlaceKey, unread: boolean): void {
  // `pop: true`: a screen already in the stack is gone BACK to, never pushed a
  // second time (React Navigation 7's navigate pushes otherwise). From one hub
  // to another and back, the stack stays one deep.
  const POP = { pop: true };
  switch (key) {
    case 'tools': return nav.navigate('ToolsHub', undefined, POP);
    case 'labs': return nav.navigate('AudioLearning', undefined, POP);
    case 'enroll': return nav.navigate('Awards', { category: 'enrollment' }, POP);
    case 'calc': return nav.navigate('CalcLab', undefined, POP);
    // Help and Settings are pushed screens since 2026-11-20, and the panel is
    // an in-tree view, not a Modal: no hand-off wait.
    case 'help': return nav.navigate('Help', undefined, POP);
    case 'set': return nav.navigate('Settings', undefined, POP);
    case 'comm':
      if (!COMMUNITY_VISIBLE) return;
      // Something waiting → straight to REQUESTS, as Home's New Messages.
      return nav.navigate('AudioCommunityDirectory', unread ? { tab: 'requests' } : undefined, POP);
    default:
      return;
  }
}

/** HOME: back to the tabs (the root route 'Main'), on the Home tab. From a
 *  root-stack screen it goes BACK to Main (never a second copy); from a tab
 *  screen it switches to Home. The HOME key on every menu screen uses it. */
export function goHome(navigation: unknown): void {
  (navigation as Nav).navigate('Main', { screen: 'Home' }, { pop: true });
}

/** The tab bar: the menu on Home, the Study screens, Progress and Profile. */
export function CircleMenu({ state, navigation, insets }: BottomTabBarProps) {
  const activeTab = state.routes[state.index];
  const nested = activeTab ? getFocusedRouteNameFromRoute(activeTab) : undefined;
  // The Glossary carries the menu too since 2026-11-20 (owner); it was the one
  // tab screen the old bar left (owner 2026-10-11).
  const hidden = false;
  const here: PlaceKey | null = currentPlace(activeTab?.name, nested ?? TAB_ROOTS[activeTab?.name ?? '']);

  const pressTab = useCallback(
    (name: string) => {
      const route = state.routes.find((r) => r.name === name);
      if (!route) return;
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (event.defaultPrevented) return;
      const root = TAB_ROOTS[name];
      // Stack-backed tabs (Study / Achievements) ALWAYS show their root (Booth
      // ruling 2026-07-18, kept from TabBar): reset an off-root nested stack
      // to its root first, at the stack's LIVE key, then navigate.
      if (root) {
        const nestedState = (route as { state?: { key?: string; index?: number; routes?: { name: string }[] } }).state;
        if (
          nestedState?.key &&
          Array.isArray(nestedState.routes) &&
          (nestedState.index !== 0 || nestedState.routes[0]?.name !== root)
        ) {
          navigation.dispatch({ ...CommonActions.reset({ index: 0, routes: [{ name: root }] }), target: nestedState.key });
        }
        (navigation.navigate as (n: string, p?: object) => void)(name, { screen: root });
      } else if (activeTab?.name !== name) {
        (navigation.navigate as (n: string) => void)(name);
      }
    },
    [state.routes, navigation, activeTab?.name],
  );

  const go = useCallback<Go>(
    (key, unread) => {
      const nav = navigation as unknown as Nav;
      switch (key) {
        case 'home': return pressTab('Home');
        case 'study': return pressTab('Study');
        case 'prog': return pressTab('Achievements');
        case 'prof': return pressTab('Profile');
        case 'gloss':
          // From the Study screens: on top of where the learner is, as the
          // Dashboard's own Glossary key does. From anywhere else: Home's way
          // (`from: 'home'`, Dashboard mounted beneath; see GlossaryParams).
          if (activeTab?.name === 'Study') return nav.navigate('Study', { screen: 'Glossary' });
          return nav.navigate('Study', { screen: 'Glossary', params: { from: 'home' }, initial: false });
        default:
          return goRootPlace(nav, key, unread);
      }
    },
    [navigation, pressTab, activeTab?.name],
  );

  return <MenuLayer here={here} hidden={hidden} insets={insets} go={go} />;
}

/** The screens of the root stack that carry the menu too (owner 2026-11-20):
 *  the Audio Tools, Calculator Lab and Labs landing screens (never the tools
 *  or labs inside them), then the Community, Settings and Help. */
export type HubPlace = 'tools' | 'calc' | 'labs' | 'comm' | 'set' | 'help' | 'enroll';

/**
 * The same MENU button and circle, on a hub screen of the root stack. Render
 * it as the LAST child of the screen's full-screen root (it fills the screen
 * and lets every touch through except its own), and end the screen's scroll
 * content `menuClearance(insets.bottom)` above the bottom.
 */
export function ScreenCircleMenu({
  here,
  onSelf,
  firstRun = false,
}: {
  here: HubPlace | null;
  /** The first-run landing (owner 2026-11-22): the callout greets a newcomer,
   *  so it reads "YOUR MENU", not "NEW: YOUR MENU" (nothing is new to them). */
  firstRun?: boolean;
  /**
   * A place this screen shows itself (the Awards pager's My Enrollments page):
   * navigate() to the route already focused only swaps its params and does
   * nothing, so the screen turns its own page instead. Return true when handled.
   */
  onSelf?: (key: PlaceKey) => boolean;
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const go = useCallback<Go>(
    (key, unread) => {
      const nav = navigation as unknown as Nav;
      if (key === here) return; // already here: the menu just folds away
      if (onSelf?.(key)) return;
      switch (key) {
        // The tabs live under the root route 'Main'; navigating there returns
        // to it (this hub screen comes off the stack).
        case 'home': return nav.navigate('Main', { screen: 'Home' }, { pop: true });
        case 'study': return nav.navigate('Main', { screen: 'Study', params: { screen: 'Dashboard' } }, { pop: true });
        case 'prog': return nav.navigate('Main', { screen: 'Achievements', params: { screen: 'AchievementsHome' } }, { pop: true });
        case 'prof': return nav.navigate('Main', { screen: 'Profile' }, { pop: true });
        case 'gloss':
          return nav.navigate('Main', { screen: 'Study', params: { screen: 'Glossary', params: { from: 'home' }, initial: false } }, { pop: true });
        default:
          return goRootPlace(nav, key, unread);
      }
    },
    [navigation, here, onSelf],
  );
  return <MenuLayer here={here} hidden={false} insets={insets} go={go} firstRun={firstRun} />;
}

function MenuLayer({
  here,
  hidden,
  insets,
  go,
  firstRun = false,
}: {
  here: PlaceKey | null;
  hidden: boolean;
  firstRun?: boolean;
  insets: { top: number; bottom: number };
  go: Go;
}) {
  const win = useWindowDimensions();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const w = box?.w ?? win.width;
  const h = box?.h ?? win.height;
  const geo = useMemo<RingGeometry>(() => ringGeometry(w, h, insets.top, insets.bottom), [w, h, insets.top, insets.bottom]);

  const motion = useDecorativeMotion();
  const suppressed = useOverlaysSuppressed();
  const modalUp = useModalHostOpen();
  const focused = useIsFocused();
  const inbox = useCommunityInbox();
  const footnote = useFootnote();
  const hintSeen = useMenuHintSeen();
  const held = useMenuHeld();

  // ── keyboard: no floating button over a field being typed in ──
  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // ── the panel module ──
  const [panelReady, setPanelReady] = useState(panelModule != null);
  useEffect(() => {
    if (panelReady) return;
    const job = runSoon(
      () => {
        loadPanel();
        setPanelReady(true);
      },
      { idleTimeoutMs: 1500 },
    );
    return () => job.cancel();
  }, [panelReady]);
  const ensurePanel = useCallback(() => {
    loadPanel();
    setPanelReady(true);
  }, []);

  // ── open / closed: one value, 0 closed … 1 open (a drag may pull a hair past) ──
  const p = useSharedValue(0);
  const [shown, setShown] = useState(false); // any part of the panel on screen
  const [live, setLive] = useState(false); // fully open: circles take taps
  useAnimatedReaction(
    () => p.value > 0.002,
    (now, prev) => {
      if (now !== prev) runOnJS(setShown)(now);
    },
  );
  useAnimatedReaction(
    () => p.value > 0.95,
    (now, prev) => {
      if (now !== prev) runOnJS(setLive)(now);
    },
  );

  const span = Math.max(1, h - geo.openTop);
  const settleTo = useCallback(
    // The release speed only chose the end (settleOpen); the finish is always
    // the same quick ease-out.
    (open: boolean, _velocityPtPerS = 0) => {
      'worklet';
      const target = open ? 1 : 0;
      if (motion) {
        const left = Math.min(1, Math.abs(target - p.value));
        const full = open ? OPEN_MS : CLOSE_MS;
        p.value = withTiming(target, { duration: Math.max(90, Math.round(full * left)), easing: Easing.out(Easing.cubic) });
      } else {
        p.value = withTiming(target, { duration: FADE_MS, easing: Easing.out(Easing.quad) });
      }
    },
    [motion, p],
  );

  const markHintSeen = useCallback(() => {
    if (hintStore.isHydrated() && hintStore.get() !== true) void hintStore.set(true);
  }, []);

  const open = useCallback(() => {
    ensurePanel();
    markHintSeen();
    settleTo(true);
  }, [ensurePanel, markHintSeen, settleTo]);
  const close = useCallback(() => settleTo(false), [settleTo]);

  // A screen reader hears the panel open and lands on its first place.
  const firstCircleRef = useRef<View>(null);
  useEffect(() => {
    if (!live) return;
    if (Platform.OS === 'web' || !screenReaderOn()) return; // RNW reports "on" always (trap)
    AccessibilityInfo.announceForAccessibility(
      `Menu open. ${COMMUNITY_VISIBLE ? 'Twelve' : 'Eleven'} places, clockwise from Glossary.`,
    );
    const t = setTimeout(() => {
      const node = firstCircleRef.current;
      if (node) AccessibilityInfo.sendAccessibilityEvent?.(node as never, 'focus');
    }, 350);
    return () => clearTimeout(t);
  }, [live]);

  // Android BACK closes the menu first (only while this screen is focused).
  const onBack = useCallback(() => {
    close();
    return true;
  }, [close]);
  useBackWhileFocused(shown, onBack);

  // Leaving the tab screens (a root screen on top) or reaching the Glossary
  // folds the menu away, so it is never left half open behind them.
  useEffect(() => {
    if ((!focused || hidden || held) && p.value > 0) {
      cancelAnimation(p);
      p.value = 0;
    }
  }, [focused, hidden, held, p]);

  // ── where each circle goes (the caller decides: tab bar or hub screen) ──
  const pick = useCallback(
    (key: PlaceKey) => {
      close();
      go(key, (badgeCount(inbox) ?? 0) > 0);
    },
    [close, go, inbox],
  );

  // ── the MENU button: tap opens, drag up pulls the panel with the finger ──
  const startP = useSharedValue(0);
  const pullFromButton = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .failOffsetX([-24, 24])
        .onStart(() => {
          startP.value = p.value;
          cancelAnimation(p);
          runOnJS(ensurePanel)();
          runOnJS(markHintSeen)();
        })
        .onUpdate((e) => {
          const top0 = h - startP.value * span;
          const t = dragTop(top0 + e.translationY, geo.openTop, h);
          p.value = (h - t) / span;
        })
        .onEnd((e) => {
          const t = h - p.value * span;
          settleTo(settleOpen(t, e.velocityY, geo.openTop, h), e.velocityY);
        }),
    [h, span, geo.openTop, p, startP, ensurePanel, markHintSeen, settleTo],
  );

  // ── first-visit hint ──
  const hintWanted = hintSeen === false && !suppressed && !modalUp && focused && !hidden && !held && !keyboardUp;
  const [hintOn, setHintOn] = useState(false);
  useEffect(() => {
    if (!hintWanted) {
      setHintOn(false);
      return;
    }
    const t = setTimeout(() => setHintOn(true), HINT_DELAY_MS);
    return () => clearTimeout(t);
  }, [hintWanted]);

  const fabStyle = useAnimatedStyle(() => {
    const f = Math.max(0, Math.min(1, p.value * 2.5));
    return { opacity: 1 - f, transform: [{ scale: motion ? 1 - 0.3 * f : 1 }] };
  }, [motion]);
  const hintStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, 1 - p.value * 4)) }));

  const unread = COMMUNITY_VISIBLE ? badgeA11y(inbox) : '';
  // loadPanel() is idempotent: it also re-binds the module after a Fast Refresh.
  const Panel = panelReady ? loadPanel().CircleMenuPanel : null;
  const panelProps: CircleMenuPanelProps | null = Panel
    ? {
        p,
        geo,
        width: w,
        height: h,
        insetTop: insets.top,
        here,
        motion,
        live,
        shown,
        inbox,
        onPick: pick,
        onClose: close,
        settleTo,
        firstCircleRef,
      }
    : null;

  if (hidden || held) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((b) => (b && b.w === width && b.h === height ? b : { w: width, h: height }));
      }}
      // VoiceOver: while the menu is open, the screen behind it is out of reach.
      accessibilityViewIsModal={shown}
    >
      {Panel && panelProps ? <Panel {...panelProps} /> : null}

      {keyboardUp ? null : (
        <>
          {footnote != null && !shown ? (
            <View
              pointerEvents="none"
              style={[
                styles.footnote,
                { left: MENU_BUTTON_LEFT + MENU_BUTTON + 10, bottom: insets.bottom + MENU_BUTTON_LIFT + MENU_BUTTON / 2 - 13 },
              ]}
            >
              <Text style={styles.footnoteText} numberOfLines={1}>
                {footnote}
              </Text>
            </View>
          ) : null}

          {hintOn ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.coach, { bottom: insets.bottom + MENU_BUTTON_LIFT + MENU_BUTTON + 10 }, hintStyle]}
              accessible
              accessibilityLabel={`${firstRun ? 'Your menu' : 'New: your menu'}. Every part of the app is in here. Tap it, or pull it up.`}
            >
              <Text style={styles.coachTitle} maxFontSizeMultiplier={1.2}>
                {firstRun ? 'YOUR MENU' : 'NEW: YOUR MENU'}
              </Text>
              <Text style={styles.coachBody} maxFontSizeMultiplier={1.2}>
                Every part of the app is in here. Tap it, or pull it up.
              </Text>
              <View style={styles.coachArrow} />
            </Animated.View>
          ) : null}

          <Animated.View
            style={[styles.fabWrap, { bottom: insets.bottom + MENU_BUTTON_LIFT }, fabStyle]}
            pointerEvents={shown ? 'none' : 'box-none'}
          >
            {hintOn ? <HintPulse motion={motion} /> : null}
            <GestureDetector gesture={pullFromButton}>
              <Pressable
                onPress={open}
                accessibilityRole="button"
                accessibilityLabel={unread ? `Menu, ${unread}` : 'Menu'}
                accessibilityHint="Opens every part of the app"
                accessibilityState={{ expanded: shown }}
                style={({ pressed }) => [styles.fab, (pressed || (hintOn && !motion)) && styles.fabHeld]}
              >
                <MenuMark />
                <Text style={styles.fabText} maxFontSizeMultiplier={1.15}>
                  MENU
                </Text>
                {COMMUNITY_VISIBLE ? <CommunityBadge state={inbox} style={styles.fabBadge} /> : null}
              </Pressable>
            </GestureDetector>
          </Animated.View>
        </>
      )}
    </View>
  );
}

/** The button's mark: a little ring of 11 light-grey dots, a picture of the
 *  circle menu (dot r 1.6 on a circle of r 7.2, a 20.5 pt box, scaled with
 *  the 50 pt button). */
const MARK_DOTS = Array.from({ length: 11 }, (_, i) => {
  const a = ((270 - (i * 360) / 11) * Math.PI) / 180;
  return { cx: 8 + 5.6 * Math.cos(a), cy: 8 - 5.6 * Math.sin(a) };
});
function MenuMark() {
  return (
    <Svg width={20.5} height={20.5} viewBox="0 0 16 16" accessible={false} importantForAccessibility="no">
      {/* The mockup's dark drop shadow under each dot (0 0 1.2 pt at .95 and
          0 1 1.5 pt at .85; 1 pt = 0.78 here), drawn as halos so it renders
          the same on both phones: readable over photos. */}
      <G fill="#000000" opacity={0.55}>
        {MARK_DOTS.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={1.25 + 0.94} />
        ))}
      </G>
      <G fill="#000000" opacity={0.45}>
        {MARK_DOTS.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy + 0.78} r={1.25 + 1.17} />
        ))}
      </G>
      {/* Owner 2026-11-22: the white dots at 50% (the dark halos stay). */}
      <G fill="#f2f2f4" opacity={0.5}>
        {MARK_DOTS.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={1.25} />
        ))}
      </G>
    </Svg>
  );
}

/** First visit: the button glows three times (a ring that swells 12 pt and
 *  fades, 1.8 s each). Decorative: under Reduce Motion / Low-Light the rim
 *  simply stays amber while the note is up. */
function HintPulse({ motion }: { motion: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!motion) return;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), 3, false);
    return () => cancelAnimation(t);
  }, [motion, t]);
  const ring = useAnimatedStyle(() => ({
    opacity: t.value >= 1 ? 0 : 0.55 * (1 - t.value),
    transform: [{ scale: 1 + t.value * ((MENU_BUTTON + 24) / MENU_BUTTON - 1) }],
  }));
  if (!motion) return null;
  return <Animated.View pointerEvents="none" style={[styles.pulse, ring]} />;
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    left: MENU_BUTTON_LEFT,
    width: MENU_BUTTON,
    height: MENU_BUTTON,
  },
  fab: {
    width: MENU_BUTTON,
    height: MENU_BUTTON,
    borderRadius: MENU_BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingBottom: 1,
    // TRANSPARENT inside (owner 2026-11-20): no filled disc, only the rim —
    // a light 1 pt ring and a dark outer ring — with the screen showing
    // through. Outer box shadows are drawn outside the circle only, so the
    // drop shadow sits on the ring and never darkens the middle. Drawn shadows
    // (boxShadow), so iPhone and Android match.
    // Mockup values: a 1 pt light ring rgba(255,255,255,.42) (raised so the
    // rim shows on dark areas), a 1.5 pt dark ring outside it, and a soft
    // #000 .55 shadow (radius 5, offset 0/3) outside only. No elevation.
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    boxShadow: '0px 0px 0px 1.5px rgba(0,0,0,0.85), 0px 3px 10px 0px rgba(0,0,0,0.55)',
  },
  // Pressed / first-visit under Reduce Motion: the light ring turns amber with a soft amber glow.
  fabHeld: {
    borderColor: 'rgba(255,198,77,0.85)',
    boxShadow: '0px 0px 0px 1.5px rgba(0,0,0,0.85), 0px 0px 12px 0px rgba(255,198,77,0.35), 0px 3px 10px 0px rgba(0,0,0,0.55)',
  },
  fabText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9,
    lineHeight: 10,
    letterSpacing: 1.2,
    color: colors.amber,
    includeFontPadding: false,
    // Readable over photos: a soft dark shadow under the amber word.
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  fabBadge: { position: 'absolute', top: -3, right: -5 },
  pulse: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MENU_BUTTON,
    height: MENU_BUTTON,
    borderRadius: MENU_BUTTON / 2,
    // A ring, not a disc: the button's middle is see-through.
    borderWidth: 3,
    borderColor: 'rgba(255,198,77,1)',
  },
  coach: {
    position: 'absolute',
    left: 14,
    width: 250,
    paddingTop: 11,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1c1709',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,0.6)',
    boxShadow: '0px 10px 24px 0px rgba(0,0,0,0.6)',
    alignItems: 'center',
  },
  coachTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.4,
    color: colors.amber,
    marginBottom: 3,
  },
  coachBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 19,
    color: '#ece6d6',
    textAlign: 'center',
  },
  // The note's point, aimed at the button's centre (left 14 + 23 + 6 = 43 = 18 + 25).
  coachArrow: {
    position: 'absolute',
    left: 23,
    bottom: -7,
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#1c1709',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,198,77,0.6)',
  },
  footnote: {
    position: 'absolute',
    right: 16,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#151005',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,0.35)',
  },
  footnoteText: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 13,
    letterSpacing: 0.7,
    color: colors.amber,
  },
});
