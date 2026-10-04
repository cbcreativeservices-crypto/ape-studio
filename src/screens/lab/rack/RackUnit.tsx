/**
 * RackUnit — the Rack Unit frame (APE_LAB_UX_PROPOSAL 2026-08-23, owner-
 * approved). The layout law: *reading may scroll; operating may not.*
 *
 * Three zones; only the middle one scrolls:
 *   STAGE — pinned recessed-glass display (ToolsHub tile language grown to
 *     full width) + BezelReadouts printed on its bezel. Sized at mount
 *     (S/M/L, auto-drops one size on short viewports) and NEVER resized
 *     during an interaction (never resize a live Skia canvas — judge ruling).
 *   WELL — the only ScrollView: prose, mistakes, CheckQuestion, notices.
 *     Wrapped in ScrollLockProvider for legacy in-well drag widgets. The well
 *     wraps its CONTENT height (owner 2026-08-23): collapse the notes and the
 *     dock rides up beneath them; long content shrinks to fit and scrolls.
 *   DOCK — the shared ParamLane, PRE-BOUND to the module's teaching parameter
 *     (`initialParam` is required — the owner's cause→effect rule made
 *     structural), over a strip of DockButtons. Blank faceplate fills below.
 *   Trays overlay everything BELOW the stage; the glass/bezel stay live.
 *
 * During any lane drag a DRAG TAG rides the glass bottom edge with the live
 * value (the Faceplate graft) — the value is never hidden under the finger.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { fitValue } from '../../../theme/legibility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { armSaveFailureReport } from '../../../features/storage/saveFailureNotice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../../features/settings/store';
import { colors, fonts } from '../../../theme/tokens';
import { ScrollLockProvider } from '../scrollLock';
import { BezelReadouts } from './BezelReadouts';
import { DockButton } from './DockButton';
import { DockTray } from './DockTray';
import { ParamLane } from './ParamLane';
import { STAGE_HEIGHTS, type DockParam, type RackStage } from './rackTypes';
import { StageFullScreen } from './StageFullScreen';
import { StageAspectReport, type StageReport } from './stageAspect';
import { READING_MAX_W, readingColumn } from '../../../theme/readingColumn';
import { isTabletWindow } from '../../../theme/tablet';
import { LabNextButton, useLabNavContext } from '../kit/LabNavBar';

/** Tablet glass height as a share of the window height, per declared size
 *  (owner 2026-09-29, tablet pass). 1366-tall portrait iPad: M 464 · L 546;
 *  1194-tall: M 406 · L 478; landscape the reserve binds (1024 tall: L 410,
 *  834 tall: 274). Never below the phone rule. `S` keeps
 *  the phone height: a lab declares S precisely when its drawing is compact
 *  (the FX labs' 118 pt signal-flow strip), and a taller glass only floated
 *  that strip in empty glass. */
const TABLET_STAGE_SHARE = { S: 0, M: 0.34, L: 0.4 } as const;
/** Chrome a tablet must keep around the glass: header + tabs, bezel + badge,
 *  toggles, dock, a paged lab's footer, and a well that still shows a
 *  paragraph. Measured in landscape (834 pt tall): at 480 the Sound Systems
 *  well was down to two lines. */
const TABLET_RESERVE = 560;

export type RackUnitApi = {
  setScrollLocked: (locked: boolean) => void;
  /** Scroll the well to a content offset (additive, 2026-09-28: a question
   *  flow that opens its next card below the fold brings it into view).
   *  Nothing calls it unless a lab asks. */
  scrollWellTo: (y: number) => void;
};

/**
 * HIDE DISPLAY — give the lesson the whole screen.
 *
 * ⛔ TESTER REPORT 2026-09-23 (Frank, iPhone SE 3rd gen):
 *   "It's hard to go through the lesson and question when it's only that
 *    small portion of the screen that scrolls."
 *
 * Measured: the stage is pinned at the top and the dock at the bottom, so on a
 * 667pt phone the well was left roughly 140pt — about six lines of prose, with
 * the CHECK YOURSELF question living inside the same window. On a tall phone it
 * is comfortable, which is why it went unnoticed.
 *
 * Owner's ruling (2026-09-23), choosing between shrinking the stage, collapsing
 * it, or letting the whole page scroll: "let the display collapse so the lesson
 * can take the screen."
 *
 * ⚠️ COLLAPSING HIDES THE GLASS ONLY. The bezel readouts and the honesty badge
 * stay on screen. The badge is a disclosure ("illustrative — not live
 * measurements", "ESTIMATED · UNCALIBRATED") and the standing accuracy rule does
 * not let a disclosure be tucked away to win space.
 *
 * ⚠️ AND THE CHOICE HAS TO OUTLIVE THE MODULE. The lab screens mount a FRESH
 * RackUnit per module (`<s.Rack key={s.key} …/>`), so component state alone
 * would snap back to expanded on every NEXT — collapse, read, tap NEXT, and the
 * display is in your way again. Hence a module-scope cache (survives the
 * remount with no flash) written through to storage (survives a relaunch).
 */
const STAGE_COLLAPSED_KEY = 'ape:lab:stageCollapsed';
/** Session cache — set before the first storage read resolves, so stepping
 *  between modules never flashes the display back open. */
let stageCollapsedCache: boolean | null = null;

/** How long full screen takes to leave before a sibling Modal may present
 *  (its fade is ~250 ms; see leaveFullThen). */
export const FULL_DISMISS_MS = 350;

/**
 * ⛔ A GROUP TRAY'S LONG-PRESS IN FULL SCREEN (hunt 13, 2026-10-04). A
 * 'group' tray renders the lab's own chips, and their long-press calls the
 * lab's openLesson DIRECTLY — not the rack's `help` — so in full screen the
 * lesson sheet (a sibling Modal) was asked for over the full-screen Modal:
 * refused on iOS (the sheet's open flag then sticks — a dead ⓘ), drawn
 * behind on Android. Binaural OBJ/SRC, Fx, Modular, Plate… Inside the
 * full-screen tray this hands out leaveFullThen; everywhere else it is null
 * and the press runs as before. LabChip routes its long-press through it.
 */
const RackLeaveFullContext = createContext<((fn: () => void) => void) | null>(null);
export function useRackLeaveFull(): ((fn: () => void) => void) | null {
  return useContext(RackLeaveFullContext);
}

export function RackUnit({
  stage,
  params,
  initialParam,
  onHelp,
  bottomInset,
  active = true,
  children,
}: {
  stage: RackStage;
  /** The dock declaration (≤5 keys reads best on a 375-wide phone). */
  params: DockParam[];
  /** REQUIRED: the id of the fader the lane binds on mount — the module's
   *  teaching parameter costs zero taps (the #1 non-negotiable, structural). */
  initialParam: string;
  /** Guided-lesson router: helpKey → the lab's GuidedLessonSheet. */
  onHelp?: (helpKey?: string) => void;
  /** Bottom inset under the faceplate and the tray. Defaults to the safe-area
   *  inset; a host that mounts its OWN footer beneath the rack (the Sound
   *  Systems paged host, 2026-09-25) already pads the safe area there and
   *  passes 0 so the well is not shortened twice. Additive — every existing
   *  host leaves it undefined. */
  bottomInset?: number;
  /** False while the host hides this rack without unmounting it (LabShell's
   *  LEARN / CHECK tabs, `display: 'none'`). An open tray then stays open for
   *  the hop back, but stops answering Android back — bug hunt 2026-09-29:
   *  back silently closed a tray nobody could see instead of leaving. */
  active?: boolean;
  /** The scroll well. A function child receives the well's scroll-lock API
   *  (LabShell parity for legacy in-well drag widgets). */
  children: ReactNode | ((api: RackUnitApi) => ReactNode);
}) {
  const labNav = useLabNavContext();
  const faders = useMemo(() => params.filter((p) => p.kind === 'fader'), [params]);
  const validInitial = faders.some((f) => f.id === initialParam);
  const [boundId, setBoundId] = useState(validInitial ? initialParam : (faders[0]?.id ?? ''));
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  const [wellLocked, setWellLocked] = useState(false);
  const wellRef = useRef<ScrollView>(null);
  const scrollWellTo = useCallback((y: number) => {
    wellRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  }, []);
  const [laneActive, setLaneActive] = useState(false);
  const [glassW, setGlassW] = useState(0);
  const [stageBlockH, setStageBlockH] = useState(0); // tray overlay top edge
  const [dockH, setDockH] = useState(0); // tray overlay bottom edge (inline)
  const [rootH, setRootH] = useState(0); // → the inline tray's room
  const insets = useSafeAreaInsets();
  const bottom = bottomInset ?? insets.bottom;

  // Contract check once, not per render (a wrong id would otherwise warn ~60/s
  // while riding the lane and bury the device logs).
  useEffect(() => {
    if (__DEV__ && !validInitial && faders.length > 0) {
      console.warn(`[rack] initialParam "${initialParam}" is not a fader param — binding "${faders[0].id}"`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile the bound param against the CURRENT params every render — a lab
  // whose fader set is conditional (engine-gated, mode-switched) must never
  // strand the lane on a vanished id (review 2026-08-23).
  const effBoundId = faders.some((f) => f.id === boundId)
    ? boundId
    : validInitial
      ? initialParam
      : (faders[0]?.id ?? '');
  const bound = faders.find((f) => f.id === effBoundId) ?? null;
  useEffect(() => {
    if (!bound && laneActive) setLaneActive(false); // fader vanished mid-drag
  }, [bound, laneActive]);

  const openParam = params.find((p) => p.id === openTrayId) ?? null;

  // A fader with a `chooser` presents as an options tray. Choosing closes it
  // and BINDS the lane, so one key does chooser-then-slider (owner 2026-08-30).
  const chooserTray: Extract<DockParam, { kind: 'options' }> | null =
    openParam && openParam.kind === 'fader' && openParam.chooser
      ? {
          kind: 'options',
          id: openParam.id,
          label: openParam.chooser.title ?? openParam.label,
          valueLabel: '',
          options: openParam.chooser.options,
          selectedId: openParam.chooser.selectedId,
          sticky: openParam.chooser.sticky,
          onReset: openParam.chooser.onReset,
          onSelect: (id: string) => {
            openParam.chooser?.onSelect(id);
            // A sticky chooser stays open for A/B; the lane binds when the
            // tray closes instead (see the DockTray onClose below).
            if (!openParam.chooser?.sticky) {
              setOpenTrayId(null);
              setBoundId(openParam.id); // hand straight back to the slider
            }
          },
          helpKey: openParam.helpKey,
        }
      : null;

  const trayParam =
    chooserTray ??
    ((params.find((p) => p.id === openTrayId && (p.kind === 'options' || p.kind === 'group')) as
      | Extract<DockParam, { kind: 'options' | 'group' }>
      | undefined) ?? null);

  const [stageCollapsed, setStageCollapsed] = useState(stageCollapsedCache ?? false);
  useEffect(() => {
    if (stageCollapsedCache != null) return; // already known this session
    let alive = true;
    AsyncStorage.getItem(STAGE_COLLAPSED_KEY)
      .then((v) => {
        // A toggle made while the read was out is newer than the stored
        // copy: it wins (wave 2, 2026-10-02 — the read used to land over it,
        // so the next module opened the way the learner had just undone).
        if (stageCollapsedCache != null) return;
        stageCollapsedCache = v === '1';
        if (alive && stageCollapsedCache) setStageCollapsed(true);
      })
      .catch(() => {
        // readFailed: the pref is unknown, not "expanded" — the cache stays
        // empty so the next module reads again. Nothing is written from it:
        // the one value is written only by the learner's own toggle.
      });
    return () => {
      alive = false;
    };
  }, []);
  const toggleStage = useCallback(() => {
    setStageCollapsed((prev) => {
      const next = !prev;
      stageCollapsedCache = next;
      // The in-memory cache carries it for this session; a refusal is still
      // told, so the learner knows it will not be remembered (owner 2026-10-03).
      const reportRefused = armSaveFailureReport();
      AsyncStorage.setItem(STAGE_COLLAPSED_KEY, next ? '1' : '0').catch(() => reportRefused());
      return next;
    });
  }, []);

  const { width: winW, height: winH } = useWindowDimensions();
  const tablet = isTabletWindow(winW, winH);
  // FULL SCREEN state lives up here (it used to sit below the glass sizing)
  // because the tablet glass needs `fixedStage` — see TABLET_STAGE_SHARE.
  const [full, setFull] = useState(false);
  const [fixedStage, setFixedStage] = useState(false);
  // Vertical budget (review 2026-08-23): the stage may never starve the dock.
  // Target = the declared size, auto-dropped one step on short viewports, then
  // clamped so chrome+bezel+dock+a usable well always fit (landscape/split-
  // screen floor 100). Applied only while NO interaction is live — the glass
  // never resizes under a drag or an open tray (never resize a live canvas).
  const size = stage.size ?? 'M';
  const effSize = winH < 700 ? (size === 'L' ? 'M' : 'S') : size;
  // Reserve = the chrome that must fit around the glass: safe-top + header +
  // tabs/nav (~125) + bezel + badge (~65) + dock (119) + a usable well (~40).
  // 300 under-counted it (judge panel 2026-09-17): on a 550 dp phone the well
  // shrank to 0-40 dp and every tray became a ~120 dp scrolling card.
  //
  // TABLET (owner 2026-09-29, tablet pass): the phone heights (160/200/250)
  // left a drawing marooned on an iPad — a 250-tall glass 1000 pt wide, the
  // plan drawn at a third of the width with ~300 pt of blank faceplate under
  // the dock. On a tablet the glass takes a share of the WINDOW height
  // instead, still clamped so the well and dock keep their room (a larger
  // reserve: the tablet well should still show a paragraph in landscape).
  // A view-built stage (StageBox → `fixed()`) keeps the phone height: its
  // text does not grow with the box, so more glass would only add air.
  const phoneTarget = Math.min(STAGE_HEIGHTS[effSize], Math.max(100, winH - 350));
  const tabletTarget = Math.min(Math.round(winH * TABLET_STAGE_SHARE[size]), winH - TABLET_RESERVE);
  // Never SMALLER than the phone rule gives the same window (a landscape
  // iPad mini's 744 pt height keeps the phone glass).
  const targetH = tablet && !fixedStage ? Math.max(phoneTarget, tabletTarget) : phoneTarget;
  const [glassH, setGlassH] = useState(targetH);
  const interacting = laneActive || trayParam != null;
  useEffect(() => {
    if (!interacting && glassH !== targetH) setGlassH(targetH);
  }, [interacting, glassH, targetH]);

  // FULL SCREEN owned by the rack (opt-in `stage.fullScreen`, 2026-09-25).
  // The glass render is wrapped in a StageAspectReport so a view-built stage
  // (StageBox → `fixed()`) can decline the button: its text would not grow.
  // The dock and its trays are rendered INSIDE the full-screen view too
  // (owner 2026-09-25: "the user must still be able to adjust and view their
  // changes to controls"), sharing this same state — one lane, one bound
  // param, one open tray, whichever surface is showing.
  const glassReport = useMemo<StageReport>(() => ({ aspect: () => {}, fixed: () => setFixedStage(true) }), []);
  const ownsFull = stage.fullScreen === true && !fixedStage;
  const onEnlarge = ownsFull ? () => setFull(true) : stage.onEnlarge;

  // ⛔ NOTHING PRESENTS OVER FULL SCREEN (bug hunt 2026-09-29). Full screen is
  // a native Modal. A long-press lesson (the lab's GuidedLessonSheet) or a
  // photo (LabPhotoLightbox) is ANOTHER Modal, mounted beside the rack — a
  // sibling, not a child. On iOS UIKit refuses to present a second view
  // controller from one that is already presenting ("already presenting"), so
  // the sheet never appears while its host's `open` flag is now stuck true:
  // every later ⓘ sets true→true and does nothing — a dead key. On Android the
  // sibling opens BEHIND the full-screen dialog. So every route out of the
  // rack that opens something (help, a tray chip's photo) closes full screen
  // first and runs once its dismissal has finished. Inline it runs at once.
  const fullRef = useRef(false);
  fullRef.current = full;
  // The pending present, cleared on unmount (bug pass 3, 2026-09-30): a
  // long-press ⓘ in full screen followed at once by NEXT / back fired this
  // rack's lesson 350 ms later over the next module (or a screen already gone).
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);
  const leaveFullThen = useCallback((fn: () => void) => {
    if (!fullRef.current) {
      fn();
      return;
    }
    setFull(false);
    // The Modal fades out (~250 ms); present only after it is gone.
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      fn();
    }, FULL_DISMISS_MS);
  }, []);
  const help = useMemo(
    () => (onHelp ? (helpKey?: string) => leaveFullThen(() => onHelp(helpKey)) : undefined),
    [onHelp, leaveFullThen],
  );
  // A bezel cell / dock action that opens something OUTSIDE the rack (opt-in
  // `leavesFull`, hunt 13, 2026-10-04) leaves full screen first, like `help`:
  // Harmonics' THD cell opened its Modal behind / refused over full screen,
  // and the Tube lab's REF key navigated underneath it.
  const bezelItems = stage.bezel?.map((it) =>
    it.leavesFull && it.onPress ? { ...it, onPress: () => leaveFullThen(it.onPress as () => void) } : it,
  );

  const dockNode = (
    <View style={styles.dock}>
      {/* Tablet (owner 2026-09-29): the faceplate stays full width but the
          lane and keys sit in the centred reading column, lined up with the
          well's notes above them — a single PART key had
          stretched to 1004 pt on an iPad. Never binds on a phone. */}
      <View style={styles.dockInner}>
      {bound && !(trayParam?.kind === 'group' && trayParam.hideLane) ? (
        <ParamLane
          label={bound.label}
          value={bound.value}
          readout={bound.format(bound.value)}
          onChange={bound.onChange}
          onDragActive={setLaneActive}
          tint={bound.tint}
          level={bound.level}
          home={bound.home}
        />
      ) : null}
      <View style={styles.strip}>
        {params.map((p) => {
          switch (p.kind) {
            case 'fader':
              return (
                <DockButton
                  key={p.id}
                  label={p.label}
                  value={(p.formatShort ?? p.format)(p.value)}
                  // A chooser-fader opens a tray first, so it wears the
                  // OPEN verb glyph, not the bind glyph (the two-verb rule).
                  glyph={p.chooser ? '▸' : '▪'}
                  frameTint={p.tint}
                  selected={effBoundId === p.id || openTrayId === p.id}
                  onPress={() => {
                    if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
                    if (p.chooser) setOpenTrayId((cur) => (cur === p.id ? null : p.id));
                    else setBoundId(p.id);
                  }}
                  onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                  a11y={
                    p.chooser
                      ? `${p.label}: ${p.format(p.value)}. Tap to choose, then adjust on the fader.`
                      : `${p.label}: ${p.format(p.value)}. Tap to adjust on the fader.`
                  }
                />
              );
            case 'options':
            case 'group':
              return (
                <DockButton
                  key={p.id}
                  label={p.label}
                  value={p.valueLabel}
                  glyph="▸"
                  selected={openTrayId === p.id}
                  onPress={() => setOpenTrayId((cur) => (cur === p.id ? null : p.id))}
                  onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                  a11y={`${p.label}: ${p.valueLabel}. Tap to open the chooser.`}
                />
              );
            case 'toggle':
              // Distinct KEY skin + LED: amber-selected means "bound/open"
              // ONLY (the two-verb rule); an ON toggle must not impersonate it.
              return (
                <DockButton
                  key={p.id}
                  label={p.label}
                  value=""
                  variant="key"
                  led={p.value}
                  labelLines={p.labelLines}
                  onPress={p.onToggle}
                  onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                  a11y={`${p.label}: ${p.value ? 'on' : 'off'}. Tap to toggle.`}
                />
              );
            case 'action':
              return (
                <DockButton
                  key={p.id}
                  label={p.label}
                  value=""
                  variant="key"
                  frameTint={p.tint}
                  onPress={p.leavesFull ? () => leaveFullThen(p.onPress) : p.onPress}
                  a11y={p.label}
                />
              );
          }
        })}
      </View>
      </View>
    </View>
  );

  const closeTray = () => {
    // Closing a chooser-fader's tray hands over to its slider — that is
    // what makes one key do both jobs for the sticky case too.
    if (chooserTray) setBoundId(chooserTray.id);
    setOpenTrayId(null);
  };
  // The inline tray layer already stops at the dock's top edge, so the card
  // needs no safe-area inset of its own.
  // …and the card may use ALL of that room (6 dp margins): on a 667 pt phone
  // the old 86% cap clipped a two-row tray under the fold.
  const trayRoom = rootH - stageBlockH - dockH - bottom - 12;
  // A tray chip's own long-press (a reference photo — LabPhotoLightbox, a
  // sibling Modal) leaves full screen first, like `help` above.
  const trayRouted = useMemo(
    () =>
      trayParam && trayParam.kind === 'options' && trayParam.options.some((o) => o.onLongPress)
        ? {
            ...trayParam,
            options: trayParam.options.map((o) =>
              o.onLongPress ? { ...o, onLongPress: () => leaveFullThen(o.onLongPress as () => void) } : o,
            ),
          }
        : trayParam,
    [trayParam, leaveFullThen],
  );
  const trayNode = <DockTray param={trayRouted} onClose={closeTray} onHelp={help} bottomInset={0} maxHeight={rootH > 0 ? trayRoom : undefined} active={active} />;
  // In full screen the drawing is what sits behind the tray: no wash.
  // …and its card height is reported so the full-screen view can lift the
  // dock ABOVE the open tray: the learner keeps the lane and keys while
  // choosing (owner 2026-09-26), and the dock drops back when it closes.
  const [fullTrayH, setFullTrayH] = useState(0);
  // A 'group' tray's content is the LAB's own (its chips call the lab's
  // openLesson straight away), so in full screen it is handed the way out:
  // useRackLeaveFull (hunt 13, 2026-10-04).
  const trayNodeFull = (
    <RackLeaveFullContext.Provider value={leaveFullThen}>
      <DockTray param={trayRouted} onClose={closeTray} onHelp={help} bottomInset={0} dim={false} onCardLayout={setFullTrayH} />
    </RackLeaveFullContext.Provider>
  );

  return (
    <View style={[styles.root, { paddingBottom: bottom }]} onLayout={(e) => setRootH(Math.round(e.nativeEvent.layout.height))}>
      {/* ── STAGE — pinned; structurally cannot leave the screen ─────────── */}
      <View style={styles.stageWrap} onLayout={(e) => setStageBlockH(Math.round(e.nativeEvent.layout.height))}>
        {/* Not rendered at all when collapsed — a zero-height canvas would
            still be mounted and still be drawing frames. */}
        {stageCollapsed ? null : (
        <View style={[styles.glass, { height: glassH }]} onLayout={(e) => setGlassW(Math.round(e.nativeEvent.layout.width) - 2)}>
          {glassW > 0 ? (
            <StageAspectReport.Provider value={glassReport}>{stage.render(glassW, glassH - 2)}</StageAspectReport.Provider>
          ) : null}
          {/* Smoked-glass sheen (ToolsHub TileGlass language). Decorative. */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.015)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.14)']}
            locations={[0, 0.4, 0.8, 1]}
            style={StyleSheet.absoluteFill}
          />
          {laneActive && bound && !stage.hideDragTag ? (
            <View style={styles.dragTag} pointerEvents="none">
              <Text style={styles.dragTagText} {...fitValue(13)}>
                {bound.label}  {bound.format(bound.value)}
              </Text>
            </View>
          ) : null}
        </View>
        )}
        {stage.bezel?.length || stage.onGuide ? (
          <BezelReadouts items={bezelItems ?? []} onGuide={stage.onGuide} onHelp={help} />
        ) : null}
        {stage.badge ? (
          // Honesty badge: silk-screened on the FACEPLATE under the unit —
          // never floated over the glass (owner 2026-08-23: no hover objects
          // may block the display). Still pinned with it. Two lines + a gentle
          // shrink floor instead of hard truncation: at 375 the M6/M11 badges
          // were cutting mid-claim ("…7 m ROO") — and a truncated disclosure
          // is a weakened disclosure.
          <Text style={styles.badgeStrip} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
            {stage.badge}
          </Text>
        ) : null}
      </View>

      {/* HIDE / SHOW DISPLAY — the reading-space control. Sits on the
          faceplate between the stage and the well, never floated over the
          glass (owner 2026-08-23: nothing may hover over the display). House
          wording, matching the SPL meter's HIDE CONTROLS / HIDE LED. */}
      <View style={styles.stageToggleRow}>
        <Pressable
          onPress={toggleStage}
          style={[styles.stageToggle, styles.stageToggleFlex]}
          // The visible bar is 34 pt (owner 2026-09-26: "a little thinner —
          // they don't need to occupy that much vertical screen space"), but
          // the TOUCH target stays 44 pt by hit slop — the lesson-reading
          // control must not repeat the back-button mistake of being too
          // small to hit.
          hitSlop={{ top: 5, bottom: 5, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityState={{ expanded: !stageCollapsed }}
          accessibilityLabel={stageCollapsed ? 'Show the display' : 'Hide the display to read'}
          accessibilityHint={
            stageCollapsed
              ? 'Brings the display back'
              : 'Gives the lesson the whole screen; the readings stay on screen'
          }
        >
          <Text style={styles.stageToggleText}>
            {stageCollapsed ? '▾  SHOW DISPLAY' : '▴  HIDE DISPLAY'}
          </Text>
        </Pressable>
        {onEnlarge && !stageCollapsed ? (
          // FULL SCREEN (owner 2026-09-25): the drawing at the whole phone,
          // with zoom — a button on the faceplate, never a tap on the glass
          // (the glass is the instrument; its taps belong to the page).
          <Pressable
            onPress={onEnlarge}
            style={[styles.stageToggle, styles.stageToggleFlex]}
            hitSlop={{ top: 5, bottom: 5, left: 6, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Open the display full screen"
            accessibilityHint="Shows the drawing at full size with zoom"
          >
            <Text style={styles.stageToggleText}>⤢  FULL SCREEN</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── WELL — the only scroller. It wraps its CONTENT height (owner
             2026-08-23): collapse LAB NOTES and the dock rides up directly
             beneath it, leaving blank faceplate below — not a dead gap in the
             middle. Long content still shrinks to fit and scrolls. ─────────── */}
      {/* `flexGrow: 1` ONLY while collapsed: expanded, the well must keep
          wrapping its content so the dock rides up under short lessons
          (owner 2026-08-23) rather than leaving a dead gap in the middle. */}
      {/* …and while a tray is open the well grows too, so the dock sits at
          the bottom and the tray card fills the well above it (below). */}
      <View style={[styles.wellWrap, (stageCollapsed || trayParam != null) && styles.wellWrapGrow]}>
        <ScrollLockProvider value={setWellLocked}>
          <ScrollView
            ref={wellRef}
            style={[styles.wellScroll, (stageCollapsed || trayParam != null) && styles.wellScrollGrow]}
            // The well is the lab's READING space: on a tablet its notes
            // cap at the reading column (owner 2026-09-29 — the notes ran
            // 990 pt wide, ~150 characters a line). No-op on a phone.
            contentContainerStyle={[styles.well, readingColumn]}
            scrollEnabled={!wellLocked}
          >
            {typeof children === 'function' ? children({ setScrollLocked: setWellLocked, scrollWellTo }) : children}
            {/* Shared lab navigation (2026-09-30): a host that provides a
                LabNav gets the in-flow "NEXT: <title> ›" / FINISH at the end
                of its well. Draws nothing when there is no provider. */}
            {labNav ? <LabNextButton nav={labNav} /> : null}
          </ScrollView>
        </ScrollLockProvider>
      </View>

      {/* ── DOCK — lane + strip; rides directly under the well content ────── */}
      <View onLayout={(e) => setDockH(Math.round(e.nativeEvent.layout.height))}>{dockNode}</View>

      {/* Blank faceplate below the raised dock — calm, non-interactive. Gone
          while a tray is open: the dock drops to the bottom instead. */}
      {trayParam ? null : <View style={styles.filler} pointerEvents="none" />}

      {/* Tray overlay at ROOT level: covers the WELL only — between the stage
          block and the dock. The glass/bezel stay bright and live (the
          load-bearing rule) and the DOCK stays live under the tray (owner
          2026-09-27: "the user should always be able to adjust controls
          without having to open and close" — the full-screen rule of
          2026-09-26, inline). */}
      <View style={[styles.trayLayer, { top: stageBlockH, bottom: dockH + bottom }]} pointerEvents="box-none">
        {trayNode}
      </View>

      {ownsFull ? (
        <StageFullScreen
          visible={full}
          onClose={() => setFull(false)}
          // Android back inside full screen closes an open tray FIRST (bug
          // hunt 2026-09-29): the Modal takes back, not the tray's BackHandler,
          // so back used to drop the learner out with the tray still open.
          onBack={() => {
            if (trayParam) {
              closeTray();
              return;
            }
            setFull(false);
          }}
          render={stage.render}
          badge={stage.badge}
          glassW={glassW}
          controls={dockNode}
          overlay={trayNodeFull}
          overlayLift={trayParam ? fullTrayH + 6 : 0}
          readouts={bezelItems?.length ? <BezelReadouts items={bezelItems} onHelp={help} /> : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filler: { flex: 1 },
  trayLayer: { position: 'absolute', left: 0, right: 0 },
  // The stage sits on the faceplate: a slim metallic margin around the glass,
  // with breathing room below the shell's mode tabs (owner 2026-08-23).
  stageWrap: { paddingHorizontal: 10, paddingTop: 10 },
  glass: {
    borderWidth: 1,
    borderColor: '#3a3a44',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#0c0c0f',
    overflow: 'hidden',
  },
  badgeStrip: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#6d6f75',
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 1,
    paddingHorizontal: 8,
  },
  // Drag readout rides at the TOP of the glass (owner 2026-08-28) — bottom
  // placement collided with stage content (M9's signal strip).
  dragTag: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dragTagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: '#0c0c0c' },
  // The well wraps its content (dock rides up under it) but shrinks + scrolls
  // when the content outgrows the space above the dock.
  wellWrap: { flexGrow: 0, flexShrink: 1 },
  wellWrapGrow: { flexGrow: 1 },
  wellScroll: { flexGrow: 0 },
  wellScrollGrow: { flexGrow: 1 },
  stageToggleRow: { flexDirection: 'row', gap: 8, marginHorizontal: 10, marginTop: 6 },
  stageToggleFlex: { flex: 1 },
  stageToggle: {
    minHeight: 34, // + hitSlop 5/5 = a 44 pt touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2c2c33',
    borderRadius: 8,
    backgroundColor: '#101114',
  },
  stageToggleText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    color: colors.textSubAlt,
  },
  // 6px of clearance so scrolled well text never hard-clips mid-glyph
  // against the pinned badge strip above it (design pass 2026-08-31).
  well: { padding: 12, paddingTop: 18, paddingBottom: 14, gap: 10 },
  dock: {
    borderTopWidth: 1,
    borderTopColor: '#2c2c33',
    backgroundColor: '#101114',
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 9,
  },
  dockInner: { width: '100%', maxWidth: READING_MAX_W, alignSelf: 'center', gap: 7 },
  strip: { flexDirection: 'row', gap: 6 },
});
