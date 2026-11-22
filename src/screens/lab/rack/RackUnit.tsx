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
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { DockButton, DockStrip } from './DockButton';
import { DockTray } from './DockTray';
import { DOCK_KEY_GAP, isLabelOnly, widestLaneValue } from './dockFit';
import { ParamLane } from './ParamLane';
import { STAGE_HEIGHTS, type DockParam, type RackStage } from './rackTypes';
import { StageFullScreen } from './StageFullScreen';
import { StageAspectReport, type StageReport } from './stageAspect';
import { READING_MAX_W, readingColumn } from '../../../theme/readingColumn';
import { isTabletWindow } from '../../../theme/tablet';
import { LabNextButton, useLabNavContext } from '../kit/LabNavBar';
// Screen Guide (owner 2026-10-31): the guide keeps the area it is explaining
// visible, so it MEASURES these three views when it shows a step. Register-only
// refs — no layout change, nothing runs unless a guide asks.
import { useGuideRegion } from '../../../features/lab/screenGuide/guideRegions';
// …and the first-visit intro card never rises over a tray or a drag already
// under way (held frame item 2, 2026-11-13): leaf context, nothing else.
import { useScreenGuideWork } from '../../../features/lab/screenGuide/introHold';
// Lab fix round 1 (2026-11-14): the silent learner's line (row 3), first-visit
// bezel captions (row 7), the lane's − / + keys (row 8).
import { SoundOffLine, soundOffLineText } from './silentPath';
import { captionsIdFor, markCaptionsSeen, useCaptionsUnseen } from './bezelFirstSight';
import { laneStepA11y, laneStepTries } from './laneStep';
import { TRAY_READ_MIN, peekHeight, shouldPeek, shouldTrayFold } from './peekRules';
import { DrawingPlaceholder, ModelNote } from './ModelNote';

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
 * THE READING WELL GETS ROOM WHILE YOU READ (lab fix round 1, 2026-11-14,
 * section 3 row 9; owner: "Begin fixing all bugs found and do obvious ...
 * fixes as you suggested in the report", suggested order item 8). The audit:
 * Wave's teaching text scrolled "through a 228 px window (27 % of the
 * screen)", Foundations "about 6 lines", Signal Detective ~230 px, Delay
 * ~150 px. On a phone, once the learner scrolls a well that holds more than
 * it shows, the display FOLDS to a slim strip: the glass is CLIPPED to
 * PEEK_SHARE of its height around its middle, never resized (a live canvas is
 * never resized — the judge ruling; nothing re-renders at a new size), and
 * the bezel readouts and the badge stay on screen. It opens again on any
 * touch on the display or the dock, when a tray opens, when the well is
 * scrolled back to its top, or with the OPEN DISPLAY bar. HIDE
 * DISPLAY (the owner's 2026-09-23 collapse) works exactly as before.
 * Tablets keep the whole display (they have the room).
 */
export { PEEK_AFTER_Y, PEEK_MIN_H, PEEK_SHARE, PEEK_SPARE, TRAY_READ_MIN, peekHeight, shouldPeek, shouldTrayFold } from './peekRules';

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
  // A LOCKED fader never binds the lane (rackTypes `locked`).
  const faders = useMemo(() => params.filter((p): p is Extract<DockParam, { kind: 'fader' }> => p.kind === 'fader' && !p.locked), [params]);
  /** The locked key last tapped — its reason prints under the keys. */
  const [lockedNoteId, setLockedNoteId] = useState<string | null>(null);
  const validInitial = faders.some((f) => f.id === initialParam);
  const [boundId, setBoundId] = useState(validInitial ? initialParam : (faders[0]?.id ?? ''));
  const [openTrayId, setOpenTrayId] = useState<string | null>(null);
  const [wellLocked, setWellLocked] = useState(false);
  /** The display is folded while the learner reads (row 9, PEEK_SHARE). */
  const [peek, setPeek] = useState(false);
  const peekRef = useRef(false);
  peekRef.current = peek;
  /** The learner unfolded it with OPEN DISPLAY: no fold again on
   *  this visit (they asked to see the whole display while they read). */
  const peekOptOut = useRef(false);
  /** Last render's tray fold (the layout it was measured with). */
  const trayFoldRef = useRef(false);
  /** The open inline tray card's height: the well's foot gets that much room,
   *  so any line can be scrolled above the card (row 8). */
  const [inlineTrayH, setInlineTrayH] = useState(0);
  /** The well's top edge in the rack (dp), as last laid out (row 8 tray fold). */
  const [wellTopY, setWellTopY] = useState(0);
  /** Where the current touch on the well went down (tap vs scroll). */
  const wellTouch = useRef<{ x: number; y: number } | null>(null);
  const wellRef = useRef<ScrollView>(null);
  const glassRef = useRef<View>(null);
  const bezelRef = useRef<View>(null);
  const dockRef = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const stageRef = useRef<View>(null);
  useGuideRegion('display', glassRef);
  useGuideRegion('readouts', bezelRef);
  useGuideRegion('dock', dockRef);
  // SHOWN AGAIN, MEASURED AGAIN (phase 3): a rack that mounted hidden (a
  // first visit opens on LEARN) measured 0, and the web does not always send
  // a new layout when `display` comes back, so the glass never drew. When the
  // rack becomes active it measures its parts itself (keepShown).
  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => {
      glassRef.current?.measure?.((_x, _y, w) => keepShown(setGlassW, Math.round(w) - 2));
      rootRef.current?.measure?.((_x, _y, _w, h) => keepShown(setRootH, Math.round(h)));
      stageRef.current?.measure?.((_x, _y, _w, h) => keepShown(setStageBlockH, Math.round(h)));
      dockRef.current?.measure?.((_x, _y, _w, h) => keepShown(setDockH, Math.round(h)));
    }, 0);
    return () => clearTimeout(t);
  }, [active]);
  const scrollWellTo = useCallback((y: number) => {
    wellRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  }, []);
  const [laneActive, setLaneActive] = useState(false);
  // autoBind faders (rackTypes): bind the lane when one APPEARS; while a
  // finger is on the lane the switch waits for it to lift (never rebinds
  // mid-drag).
  const seenFaderIds = useRef<Set<string>>(new Set(faders.map((f) => f.id)));
  const pendingAutoBind = useRef<string | null>(null);
  useEffect(() => {
    const appeared = faders.find((f) => f.autoBind && !seenFaderIds.current.has(f.id));
    seenFaderIds.current = new Set(faders.map((f) => f.id));
    if (!appeared) return;
    if (laneActive) pendingAutoBind.current = appeared.id;
    else setBoundId(appeared.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faders]);
  useEffect(() => {
    if (laneActive || pendingAutoBind.current == null) return;
    const id = pendingAutoBind.current;
    pendingAutoBind.current = null;
    if (faders.some((f) => f.id === id)) setBoundId(id);
  }, [laneActive, faders]);
  const [glassW, setGlassW] = useState(0);
  const [stageBlockH, setStageBlockH] = useState(0); // tray overlay top edge
  const [dockH, setDockH] = useState(0); // tray overlay bottom edge (inline)
  const [rootH, setRootH] = useState(0); // → the inline tray's room
  /** Everything above the well EXCEPT the glass (stage padding, bezel, badge,
   *  the HIDE DISPLAY row) — measured, for `stage.minWell`. */
  const [wellChromeH, setWellChromeH] = useState(0);
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
    ((params.find((p) => p.id === openTrayId && (p.kind === 'options' || p.kind === 'group') && !isLabelOnly(p)) as
      | Extract<DockParam, { kind: 'options' | 'group' }>
      | undefined) ?? null);
  // Its choices narrowed to one while the tray was open: the tray is gone,
  // and it must not come back by itself if they widen again.
  const openIsLabel = openParam != null && isLabelOnly(openParam);
  useEffect(() => {
    if (openIsLabel) setOpenTrayId(null);
  }, [openIsLabel]);

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
    // While the display is folded for reading (row 9) the bar unfolds it.
    if (peekRef.current) {
      peekOptOut.current = true;
      setPeek(false);
      return;
    }
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
  // A lab may ask for a taller phone glass (stage.phoneHeight, sized from the
  // window by the lab): honoured only where the declared size is not dropped.
  const phoneBase = stage.phoneHeight && effSize === size ? Math.max(STAGE_HEIGHTS[effSize], stage.phoneHeight) : STAGE_HEIGHTS[effSize];
  const phoneTarget = Math.min(phoneBase, Math.max(100, winH - 350));
  const tabletTarget = Math.min(Math.round(winH * TABLET_STAGE_SHARE[size]), winH - TABLET_RESERVE);
  // Never SMALLER than the phone rule gives the same window (a landscape
  // iPad mini's 744 pt height keeps the phone glass).
  const declaredH = tablet && !fixedStage ? Math.max(phoneTarget, tabletTarget) : phoneTarget;
  // stage.minWell (opt-in, follow-up 2026-10-15): the 350 dp reserve above is
  // an estimate, and a lab with a tall bezel/badge and a big dock under a
  // LabShell header outgrew it (Modular: a ~50 dp well on a 731 dp phone).
  // With the real chrome and dock heights measured, the glass gives up just
  // what the well is short of — never below the S height (or the declared
  // one, if that is already smaller).
  const fitH =
    stage.minWell && rootH > 0 && dockH > 0 && wellChromeH > 0 ? rootH - bottom - dockH - wellChromeH - stage.minWell : Infinity;
  const targetH = Math.max(Math.min(declaredH, STAGE_HEIGHTS.S), Math.min(declaredH, Math.round(fitH)));
  const [glassH, setGlassH] = useState(targetH);
  const interacting = laneActive || trayParam != null;
  // A hidden rack (`active` false) has no tray anyone can see.
  useScreenGuideWork(active && interacting);
  useEffect(() => {
    if (!interacting && glassH !== targetH) setGlassH(targetH);
  }, [interacting, glassH, targetH]);
  // The fold (row 9) opens the moment anything is in hand.
  const peekAllowed = !tablet && !stageCollapsed;
  useEffect(() => {
    if (peek && (interacting || !peekAllowed)) setPeek(false);
  }, [peek, interacting, peekAllowed]);
  /**
   * AN OPEN TRAY ON A TALL DISPLAY FOLDS IT TOO (row 8, F2 on DJ screen 10 at
   * 390 × 844: under DjRack's tall glass an open tray left ONE lesson line).
   * While a tray is open and the reading room between the well's top and the
   * card is under TRAY_READ_MIN, the display folds to the same slim strip as
   * the reading fold (clipped, never resized; bezel and badge stay), and it
   * opens again when the tray closes. Decided from the UNFOLDED layout, so
   * folding can never flip the decision back.
   *
   * ⛔ NEVER UNDER A STICKY TRAY (owner 2026-11-21, iPhone video of the Spectrum
   * Analyzer: "look at this bug"). A sticky tray says "stays open — compare while
   * you watch", and the fold clipped the display to its middle 40 % exactly then:
   * every peak above −12 dB, the 220 Hz marker and the Hz labels were cut off, so
   * pink noise read as a flat-topped block. While you compare, the WHOLE display
   * stays; the reading well behind the card gives up the room instead.
   */
  const trayIsSticky = trayParam != null && 'sticky' in trayParam && trayParam.sticky === true;
  const trayFold =
    trayParam != null &&
    !trayIsSticky &&
    peekAllowed &&
    !full &&
    shouldTrayFold({ rootH, bottom, dockH, cardH: inlineTrayH, wellTop: wellTopY + (peek || trayFoldRef.current ? glassH - peekHeight(glassH) : 0), glassH });
  trayFoldRef.current = trayFold;
  /** The display is folded now: for reading (peek) or under a tray. */
  const folded = peek || trayFold;

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
  const soundOffText = soundOffLineText(stage.soundOffLine);
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
  // FIRST-VISIT CAPTIONS (row 7, bezelFirstSight): latched for this mount
  // once known unseen, and the visit is recorded when this rack goes away, so
  // the whole first visit keeps them and the next one is as before.
  const captionsId = captionsIdFor(stage.captionsId, (stage.bezel ?? []).map((b) => b.caption));
  const captionsUnseen = useCaptionsUnseen(captionsId);
  const captionsShownRef = useRef<string | null>(null);
  if (captionsUnseen && captionsId) captionsShownRef.current = captionsId;
  const showCaptions = captionsId != null && captionsShownRef.current === captionsId;
  useEffect(
    () => () => {
      if (captionsShownRef.current) void markCaptionsSeen(captionsShownRef.current);
    },
    [],
  );

  // FULL SCREEN's dock leaves out the keys that change nothing there
  // (`hideInFull`, owner 2026-10-06: "useless buttons should just be
  // hidden" — a view toggle over a full screen that shows both views).
  const shownIn = (inFull: boolean) => params.filter((p) => !(inFull && (p.kind === 'toggle' || p.kind === 'options') && p.hideInFull));
  // A readout that repeats the key's name is read aloud without the repeat
  // ("TRIM 1: TRIM 1 +9.0 dB"); the screen is unchanged. Same rule as
  // spokenValue.ts, inline because the dock's code is also run from source.
  const spokenOf = (label: string, text: string) => {
    const l = label.trim();
    return l && text.toLowerCase().startsWith(`${l.toLowerCase()} `) ? text.slice(l.length + 1).trimStart() : text;
  };
  const dockFor = (inFull: boolean) => (
    <View style={styles.dock}>
      {/* Tablet (owner 2026-09-29): the faceplate stays full width but the
          lane and keys sit in the centred reading column, lined up with the
          well's notes above them — a single PART key had
          stretched to 1004 pt on an iPad. Never binds on a phone. */}
      <View style={styles.dockInner}>
      {bound && !(trayParam?.kind === 'group' && trayParam.hideLane) ? (
        <View style={styles.laneRow}>
          {/* − / + at the lane's ends (row 8, laneStep.ts): a lane without
              the lab's own nudges gets one-step keys; hold = that end. */}
          {bound.nudges?.length ? null : <LaneStepKey dir={-1} param={bound} />}
          <View style={styles.laneFlex}>
            <ParamLane
              label={bound.label}
              value={bound.value}
              readout={bound.format(bound.value)}
              onChange={bound.onChange}
              onCommit={bound.onCommit}
              format={bound.onCommit ? bound.format : undefined}
              onDragActive={setLaneActive}
              tint={bound.tint}
              level={bound.level}
              home={bound.home}
            />
          </View>
          {bound.nudges?.length ? null : <LaneStepKey dir={1} param={bound} />}
        </View>
      ) : null}
      {/* The bound fader's fine-step buttons (owner rule 2026-10-10: the
          well's nudge buttons moved into the dock, under their own lane). */}
      {bound?.nudges?.length && !(trayParam?.kind === 'group' && trayParam.hideLane) ? (
        <View style={styles.nudgeRow}>
          {bound.nudges.map((n) => (
            <Pressable
              key={n.label}
              onPress={n.onPress}
              onLongPress={n.onLongPress}
              hitSlop={6}
              style={({ pressed }) => [styles.nudge, pressed && styles.nudgePressed]}
              accessibilityRole="button"
              accessibilityLabel={n.a11y}
            >
              <Text style={styles.nudgeText} {...fitValue(12)}>{n.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {/* A tapped LOCKED key's reason (rackTypes `locked`). A key with a
          `lockedValue` is only "not yet", and says so (SN-1, 2026-11-15). */}
      {(() => {
        const lp = lockedNoteId ? params.find((p) => p.id === lockedNoteId) : null;
        return lp && (lp.kind === 'fader' || lp.kind === 'toggle' || lp.kind === 'options') && lp.locked ? (
          <Text style={styles.lockedNote} accessibilityLiveRegion="polite">
            {lp.label} — {lp.lockedValue ? 'not yet' : 'locked'}: {lp.locked}
          </Text>
        ) : null;
      })()}
      <DockStrip style={styles.strip} ids={shownIn(inFull).map((p) => p.id)}>
        {(fitFor) => params.map((p) => {
          if (inFull && (p.kind === 'toggle' || p.kind === 'options') && p.hideInFull) return null;
          const fit = fitFor(p.id);
          switch (p.kind) {
            case 'fader':
              if (p.locked) {
                return (
                  <DockButton
                    key={p.id}
                    fit={fit}
                    label={p.label}
                    // `lockedValue`: a key that is only "not yet" reads its own words, not LOCKED (SN-1, 2026-11-15).
                    value={p.lockedValue ?? 'LOCKED'}
                    // Its own words ask the strip for room, so they are never cut (SN-1 checker follow-up).
                    valueSpan={p.lockedValue}
                    glyph="▪"
                    dim
                    selected={lockedNoteId === p.id || (!!p.chooser && openTrayId === p.id)}
                    onPress={() => {
                      setLockedNoteId((cur) => (cur === p.id ? null : p.id));
                      // a locked chooser-fader still offers its other options
                      if (p.chooser) setOpenTrayId((cur) => (cur === p.id ? null : p.id));
                    }}
                    onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                    // The reason loses its own end stop, so it never reads ".." (dockFit lockedReason, 2026-11-14).
                    a11y={p.lockedValue
                      ? `${p.label}: not yet — ${p.locked.trim().replace(/[.!?]+$/, '')}.${p.chooser ? ' Tap to choose another.' : ''}`
                      : `${p.label}: locked — ${p.locked.trim().replace(/[.!?]+$/, '')}.${p.chooser ? ' Tap to choose another.' : ''}`}
                  />
                );
              }
              return (
                <DockButton
                  key={p.id}
                  fit={fit}
                  label={p.label}
                  value={(p.formatShort ?? p.format)(p.value)}
                  // A chooser-fader's key shows the value the drag changes: it
                  // asks for room for the widest one, so it never moves
                  // sideways under the finger (frame round 2, 2026-11-13).
                  valueSpan={p.chooser ? widestLaneValue(p.formatShort ?? p.format, (p.formatShort ?? p.format)(p.value)) : undefined}
                  // A chooser-fader opens a tray first, so it wears the
                  // OPEN verb glyph, not the bind glyph (the two-verb rule).
                  glyph={p.chooser ? '▸' : '▪'}
                  frameTint={p.tint}
                  selected={effBoundId === p.id || openTrayId === p.id}
                  onPress={() => {
                    setLockedNoteId(null);
                    if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
                    if (p.chooser) setOpenTrayId((cur) => (cur === p.id ? null : p.id));
                    else setBoundId(p.id);
                  }}
                  onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                  a11y={
                    p.chooser
                      ? `${p.label}: ${spokenOf(p.label, p.format(p.value))}. Tap to choose, then adjust on the fader.`
                      : `${p.label}: ${spokenOf(p.label, p.format(p.value))}. Tap to adjust on the fader.`
                  }
                />
              );
            case 'options':
            case 'group':
              if (p.kind === 'options' && p.locked) {
                return (
                  <DockButton
                    key={p.id}
                    fit={fit}
                    label={p.label}
                    value={p.lockedValue ?? 'LOCKED'}
                    glyph="▸"
                    dim
                    selected={lockedNoteId === p.id}
                    onPress={() => setLockedNoteId((cur) => (cur === p.id ? null : p.id))}
                    onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                    a11y={p.lockedValue
                      ? `${p.label}: not yet — ${p.locked.trim().replace(/[.!?]+$/, '')}.`
                      : `${p.label}: locked — ${p.locked.trim().replace(/[.!?]+$/, '')}.`}
                  />
                );
              }
              // One choice: nothing to open, so nothing to press. The lane
              // binds faders only, so it never depended on this key.
              if (p.kind === 'options' && isLabelOnly(p)) {
                return (
                  <DockButton
                    key={p.id}
                    fit={fit}
                    plain
                    label={p.label}
                    value={p.valueLabel}
                    onPress={() => {}}
                    a11y={`${p.label}: ${p.valueA11y ?? p.valueLabel}.`}
                  />
                );
              }
              return (
                <DockButton
                  key={p.id}
                  fit={fit}
                  label={p.label}
                  value={p.valueLabel}
                  glyph="▸"
                  selected={openTrayId === p.id}
                  onPress={() => {
                    setLockedNoteId(null);
                    setOpenTrayId((cur) => (cur === p.id ? null : p.id));
                  }}
                  onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                  a11y={`${p.label}: ${p.valueA11y ?? p.valueLabel}. Tap to open the chooser.`}
                />
              );
            case 'toggle':
              // Drawn as a locked options key, minus the verb glyph: a toggle
              // neither binds nor opens. The value skin carries the word LOCKED,
              // which the flat KEY skin has no line for.
              if (p.locked) {
                return (
                  <DockButton
                    key={p.id}
                    fit={fit}
                    label={p.label}
                    value={p.lockedValue ?? 'LOCKED'}
                    dim
                    selected={lockedNoteId === p.id}
                    onPress={() => setLockedNoteId((cur) => (cur === p.id ? null : p.id))}
                    onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                    a11y={p.lockedValue
                      ? `${p.label}: not yet — ${p.locked.trim().replace(/[.!?]+$/, '')}.`
                      : `${p.label}: locked — ${p.locked.trim().replace(/[.!?]+$/, '')}.`}
                  />
                );
              }
              // Distinct KEY skin + LED: amber-selected means "bound/open"
              // ONLY (the two-verb rule); an ON toggle must not impersonate it.
              return (
                <DockButton
                  key={p.id}
                  fit={fit}
                  label={p.label}
                  value=""
                  variant="key"
                  led={p.value}
                  labelLines={p.labelLines}
                  onPress={() => {
                    setLockedNoteId(null);
                    p.onToggle();
                  }}
                  onLongPress={p.helpKey ? () => help?.(p.helpKey) : undefined}
                  a11y={`${p.label}: ${p.value ? 'on' : 'off'}. Tap to toggle.`}
                />
              );
            case 'action':
              return (
                <DockButton
                  key={p.id}
                  fit={fit}
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
      </DockStrip>
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
  // The tray covers the well between the stage block and the dock. On a
  // short phone under a tall stage (Miking: two-line bezel + badge, 640 dp
  // window) that gap was ~25 dp and a chooser opened as an EMPTY sliver — its
  // options clipped away (live emulator retest 2026-10-14). The open tray
  // then rises over the foot of the stage just far enough to fit TRAY_MIN;
  // everywhere else it starts at the stage block, as before.
  const trayTop = rootH > 0 ? Math.max(0, Math.min(stageBlockH, rootH - bottom - dockH - 12 - TRAY_MIN)) : stageBlockH;
  const trayRoom = rootH - trayTop - dockH - bottom - 12;
  // A TRAY FOLD MUST LEAVE THE LESSON ITS ROOM (checker C1, FAIL 1, DJ screen
  // 10): the fold freed the display's room and the card grew straight into it
  // (DockTray holds its tallest height up to `maxHeight`), hiding every line
  // again. While the tray fold holds, the card keeps at most the room it had
  // UNFOLDED, and never so much that under TRAY_READ_MIN of lesson shows
  // above it; never under TRAY_MIN (its title and two rows).
  const trayCardRoom = trayFold
    ? Math.max(TRAY_MIN, Math.min(trayRoom - (glassH - peekHeight(glassH)), rootH - bottom - dockH - 12 - (wellTopY + TRAY_READ_MIN)))
    : trayRoom;
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
  // PASS-THROUGH (row 8): the inline tray no longer washes and blocks the
  // well. The lesson stays readable and live around the card; a tap on the
  // well closes the tray (and still reaches what was tapped), and the well's
  // foot gets the card's height so any line can be scrolled above it.
  const trayNode = <DockTray param={trayRouted} onClose={closeTray} onHelp={help} bottomInset={0} passThrough onCardLayout={setInlineTrayH} maxHeight={rootH > 0 ? trayCardRoom : undefined} active={active} />;
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
    <View ref={rootRef} style={[styles.root, { paddingBottom: bottom }]} onLayout={(e) => keepShown(setRootH, Math.round(e.nativeEvent.layout.height))}>
      {/* ── STAGE — pinned; structurally cannot leave the screen ─────────── */}
      <View ref={stageRef} style={styles.stageWrap} onLayout={(e) => keepShown(setStageBlockH, Math.round(e.nativeEvent.layout.height))}>
        {/* Not rendered at all when collapsed — a zero-height canvas would
            still be mounted and still be drawing frames. */}
        {stageCollapsed ? null : (
        // The fold's clip (row 9): the glass keeps its height inside; the
        // window onto it shrinks around its middle. A touch here opens it.
        <View
          style={[styles.peekClip, folded && { height: peekHeight(glassH) }]}
          onTouchStart={peek ? () => setPeek(false) : undefined}
          {...mouseToo(peek ? () => setPeek(false) : undefined)}
        >
        <View ref={glassRef} collapsable={false} style={[styles.glass, { height: glassH }, folded && { marginTop: -Math.round((glassH - peekHeight(glassH)) / 2) }]} onLayout={(e) => keepShown(setGlassW, Math.round(e.nativeEvent.layout.width) - 2)}>
          {glassW > 0 ? (
            <StageAspectReport.Provider value={glassReport}>{stage.render(glassW, glassH - 2)}</StageAspectReport.Provider>
          ) : null}
          {/* "drawing…" (phase 3): never an empty black box — before the
              first measure, and while the lab says its drawing is not ready. */}
          {glassW <= 0 || stage.drawing ? <DrawingPlaceholder /> : null}
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
        </View>
        )}
        {stage.bezel?.length || stage.onGuide ? (
          <View ref={bezelRef} collapsable={false}>
            <BezelReadouts items={bezelItems ?? []} onGuide={stage.onGuide} onHelp={help} captions={showCaptions} unitsChip />
          </View>
        ) : null}
        {stage.modelNote ? (
          // Phase 3 (owner's decision 3): the disclosure as one plain
          // sentence, still pinned with the display.
          <ModelNote text={stage.modelNote} />
        ) : stage.badge ? (
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
          accessibilityLabel={peek ? 'Show all of the display' : stageCollapsed ? 'Show the display' : 'Hide the display to read'}
          accessibilityHint={
            stageCollapsed
              ? 'Brings the display back'
              : 'Gives the lesson the whole screen; the readings stay on screen'
          }
        >
          <Text style={styles.stageToggleText}>
            {peek ? '▾  OPEN DISPLAY' : stageCollapsed ? '▾  SHOW DISPLAY' : '▴  HIDE DISPLAY'}
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
      <View
        style={[styles.wellWrap, (stageCollapsed || trayParam != null) && styles.wellWrapGrow, peek && styles.wellWrapGrow]}
        // A tap on the well closes an open tray (row 8); the tap still lands
        // on what it was meant for. A scroll is handled by the ScrollView.
        onTouchStart={(e) => {
          wellTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        }}
        onTouchEnd={(e) => {
          const t0 = wellTouch.current;
          wellTouch.current = null;
          if (!trayParam || !t0) return;
          if (Math.hypot(e.nativeEvent.pageX - t0.x, e.nativeEvent.pageY - t0.y) < 10) closeTray();
        }}
        {...mouseToo(
          (e) => {
            wellTouch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
          },
          (e) => {
            const t0 = wellTouch.current;
            wellTouch.current = null;
            if (!trayParam || !t0) return;
            if (Math.hypot(e.nativeEvent.pageX - t0.x, e.nativeEvent.pageY - t0.y) < 10) closeTray();
          },
        )}
        // The well's top minus the glass = the fixed chrome above it (read
        // with the glass height this layout was made with). Only while the
        // display shows, and only for a lab that asked (stage.minWell).
        onLayout={(e) => {
          const y = Math.round(e.nativeEvent.layout.y);
          if (y !== wellTopY) setWellTopY(y);
          // While folded the glass is clipped, so the well's top says nothing
          // about the chrome: read it only with the whole display showing.
          if (!stage.minWell || stageCollapsed || folded) return;
          const c = Math.round(e.nativeEvent.layout.y) - glassH;
          if (c > 0 && c !== wellChromeH) setWellChromeH(c);
        }}
      >
        <ScrollLockProvider value={setWellLocked}>
          <ScrollView
            ref={wellRef}
            style={[styles.wellScroll, (stageCollapsed || trayParam != null) && styles.wellScrollGrow, peek && styles.wellScrollGrow]}
            // The well is the lab's READING space: on a tablet its notes
            // cap at the reading column (owner 2026-09-29 — the notes ran
            // 990 pt wide, ~150 characters a line). No-op on a phone.
            contentContainerStyle={[styles.well, readingColumn]}
            scrollEnabled={!wellLocked}
            scrollEventThrottle={64}
            onScrollBeginDrag={() => {
              // Scrolling the well closes a pick-and-close tray; a sticky
              // (A/B) tray stays while the learner scrolls and compares.
              if (trayParam && !(trayParam.kind === 'group' || trayParam.sticky)) closeTray();
            }}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const y = contentOffset.y;
              if (peek) {
                if (y <= 4) setPeek(false);
                return;
              }
              if (shouldPeek({ y, contentH: contentSize.height, viewH: layoutMeasurement.height, glassH, busy: interacting, allowed: peekAllowed && !full && !peekOptOut.current })) setPeek(true);
            }}
          >
            {/* The silent learner's line (row 3): only while sound is off,
                only where the stage asks for it. */}
            {soundOffText ? <SoundOffLine text={soundOffText} /> : null}
            {typeof children === 'function' ? children({ setScrollLocked: setWellLocked, scrollWellTo }) : children}
            {/* Shared lab navigation (2026-09-30): a host that provides a
                LabNav gets the in-flow "NEXT: <title> ›" / FINISH at the end
                of its well. Draws nothing when there is no provider. */}
            {labNav ? <LabNextButton nav={labNav} /> : null}
            {/* While a tray is open the well's foot gets the card's height
                (row 8), so any line, NEXT included, scrolls above the card. */}
            {trayParam && inlineTrayH > 0 ? <View style={{ height: inlineTrayH + 12 }} pointerEvents="none" /> : null}
          </ScrollView>
        </ScrollLockProvider>
      </View>

      {/* ── DOCK — lane + strip; rides directly under the well content ────── */}
      {/* A touch on the dock unfolds a folded display (row 9). */}
      <View ref={dockRef} collapsable={false} onLayout={(e) => keepShown(setDockH, Math.round(e.nativeEvent.layout.height))} onTouchStart={peek ? () => setPeek(false) : undefined} {...mouseToo(peek ? () => setPeek(false) : undefined)}>{dockFor(false)}</View>

      {/* Blank faceplate below the raised dock — calm, non-interactive. Gone
          while a tray is open: the dock drops to the bottom instead. */}
      {trayParam ? null : <View style={styles.filler} pointerEvents="none" />}

      {/* Tray overlay at ROOT level: covers the WELL only — between the stage
          block and the dock. The glass/bezel stay bright and live (the
          load-bearing rule) and the DOCK stays live under the tray (owner
          2026-09-27: "the user should always be able to adjust controls
          without having to open and close" — the full-screen rule of
          2026-09-26, inline). */}
      <View style={[styles.trayLayer, { top: trayTop, bottom: dockH + bottom }]} pointerEvents="box-none">
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
          badge={stage.modelNote ?? stage.badge}
          badgePlain={!!stage.modelNote}
          glassW={glassW}
          controls={dockFor(true)}
          overlay={trayNodeFull}
          overlayLift={trayParam ? fullTrayH + 6 : 0}
          readouts={bezelItems?.length ? <BezelReadouts items={bezelItems} onHelp={help} /> : undefined}
        />
      ) : null}
    </View>
  );
}

/** The least room an open tray gets: its title and two full-size rows. */
const TRAY_MIN = 168;

/**
 * The browser preview has a MOUSE, and react-native-web fires no touch events
 * for it, so the row 8 / row 9 touch handlers (a tap on the well closes the
 * tray; a touch on the display or dock unfolds it) also listen to the mouse
 * there. Phones: touch only, exactly as written.
 */
const WEB = Platform.OS === 'web';
function mouseToo(down?: (e: { nativeEvent: { pageX: number; pageY: number } }) => void, up?: (e: { nativeEvent: { pageX: number; pageY: number } }) => void): object | null {
  if (!WEB) return null;
  return { onMouseDown: down, onMouseUp: up } as object;
}

/** One − / + key at the lane's end (row 8, laneStep.ts). A tap tries the
 *  steps laneStepTries gives, a beat apart, until the lab's value moves (a
 *  stepped lab snaps a too-small step back): one position, never an end
 *  (checker C4 FAIL-5). Hold = that end. */
function LaneStepKey({ dir, param }: { dir: -1 | 1; param: Extract<DockParam, { kind: 'fader' }> }) {
  const paramRef = useRef(param);
  paramRef.current = param;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const set = (v: number) => {
    const p = paramRef.current;
    if (v === p.value) return;
    p.onChange(v);
    p.onCommit?.(v);
  };
  const tap = () => {
    if (timer.current) clearTimeout(timer.current);
    const from = param.value;
    const tries = laneStepTries(from, dir, param.format, param.steps);
    if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    const attempt = (i: number) => {
      set(tries[i]);
      if (i + 1 >= tries.length) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        if (paramRef.current.value === from) attempt(i + 1);
      }, LANE_RETRY_MS);
    };
    attempt(0);
  };
  return (
    <Pressable
      onPress={tap}
      onLongPress={() => {
        if (timer.current) clearTimeout(timer.current);
        set(dir < 0 ? 0 : 1);
      }}
      delayLongPress={450}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.laneStep, pressed && styles.nudgePressed]}
      accessibilityRole="button"
      accessibilityLabel={laneStepA11y(param.label, dir)}
    >
      <Text style={styles.laneStepText}>{dir < 0 ? '−' : '+'}</Text>
    </Pressable>
  );
}
/**
 * A HIDDEN RACK MEASURES 0 (phase 3, seen on screen): LabShell keeps the rack
 * mounted under `display: 'none'` on LEARN / CHECK, and since a first visit
 * now opens on LEARN, the glass reported a width of 0 there and never drew
 * again on the hop back to EXPLORE (a "drawing…" box for good). A measure of
 * 0 or less is the hidden state, not a size: the last real one is kept.
 */
function keepShown(set: (v: number) => void, v: number): void {
  if (v > 0) set(v);
}

/** How long a lane step waits for the lab to take a try before the next. */
const LANE_RETRY_MS = 60;

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
  strip: { flexDirection: 'row', gap: DOCK_KEY_GAP },
  nudgeRow: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  lockedNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, textAlign: 'center', paddingHorizontal: 6 },
  nudge: {
    minHeight: 34,
    minWidth: 76,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgePressed: { backgroundColor: '#23232a', borderColor: '#3a3a44' },
  laneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  laneFlex: { flex: 1 },
  laneStep: {
    width: 40,
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laneStepText: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, lineHeight: 24, color: colors.amber },
  /** The fold's window onto the glass (row 9). */
  peekClip: { overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  nudgeText: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
});
