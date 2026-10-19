/**
 * DjRack — a DJ Systems Lab screen on the Rack Unit (the CymaticsRackLayout /
 * MikingRack shape; owner rule: every page with a live display uses the rack).
 *
 *   STAGE  the shared booth (or a lesson's own drawing of it), PINNED on the
 *          glass, the read-only readouts on the bezel, FULL SCREEN on (a
 *          working surface: the dock comes along, everything zooms).
 *   WELL   the only scroller: the lesson's five steps — UNDERSTAND,
 *          EXPLORE, LISTEN & OBSERVE, PRACTICE, CHECK YOURSELF — and the
 *          in-flow NEXT / FINISH the rack draws at its end.
 *   DOCK   every real control of the page (the bezel is read-only).
 *
 * The glass is taller where the screen allows (the Miking rule): the booth's
 * knobs and faders are the lesson, and a 250 pt glass made them small.
 *
 * FULL SCREEN AS A WORKING SURFACE (second visual review 2026-10-18, #22;
 * D35), inside the DJ lab only — the shared rack is not changed. The stage
 * is rendered through `DjStageHost`, which in full screen:
 *   - reports no drawing shape, so 1× is the whole body (and every DJ screen
 *     shows the same zoom row: 1× 1.5× 2× 3×);
 *   - zoomed, locks the rack's two scrollers and draws a WINDOW exactly the
 *     size of the visible body where the rack's scroll has put it; the page
 *     renders into that window at that size, so its plots and readouts stay
 *     PINNED, and its Scene zooms only the gear (art/djZoom), opening on the
 *     part the learner last touched or dragged to (else the lesson's focus
 *     part); a drag moves the gear under the pinned plots.
 *
 * Bug fix 2026-10-19 (grader, screens 4 and 6): a tap or a 1× drag, then 2×
 * or 3×, showed black or a thin strip. The window must sit exactly where the
 * rack scrolled, and the rack scrolls to the last touch for the whole
 * opening; the host dropped that touch on every step (it told an opening
 * from a step by the time since its last unmount, which a step's new host
 * reads BEFORE the old one's cleanup runs). art/djZoom createZoomMemory
 * tells them apart by whether a host is still alive. The host also measures
 * where the rack really scrolled (art/djZoom alignedWindow) and moves the
 * window there if the prediction was off (the first step out of 1×, a quick
 * close and re-open).
 * Only the visible window is drawn, never the 3× box (the CanvasKit surface
 * the review saw run out on the web).
 *
 * Round 3 (grades screen 4): a Scene with `fill` covers the body at 1× (no
 * empty band above and below a wide drawing) and reports how far it can be
 * dragged; the host then lets the learner drag it at 1× too. A scene without
 * `fill` reports nothing at 1×, so its 1× is exactly as before.
 */
import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';
import { StageAspectReport, StageGlassWidth, StageInFullScreen, StageTextScale, StageZoom, useStageZoom } from '../rack/stageAspect';
import { useScrollLock } from '../scrollLock';
import {
  DjZoomContext,
  alignedWindow,
  anchorOf,
  createZoomMemory,
  keepInBox,
  regionCentreAt,
  scenePointAt,
  stepWindow,
  viewportFrom1x,
  type PanLimits,
  type SceneView,
  type Viewport,
} from './art/djZoom';

export type DjRackSpec = {
  render: (w: number, h: number) => ReactNode;
  bezel: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the page's teaching parameter. */
  initialParam: string;
  badge?: string;
  size?: StageSize;
};

/** Glass height on a tall phone: clamp(0.38 × window, 250, 350); a phone
 *  under 760 pt keeps the rack's own rule (the rack drops a size below 700). */
export function djGlassHeight(winH: number): number | undefined {
  if (!(winH >= 760)) return undefined;
  return Math.max(250, Math.min(350, Math.round(winH * 0.38)));
}

/* ── the full-screen host ─────────────────────────────────────────────── */

// The rack's own zoom ANCHOR (the last touch in the drawing, as a fraction of
// it; reset on every opening) decides where its scroll lands. The host keeps
// the same fraction from the same touches, so its window lands there too —
// and the scene part under the touch, so the next step opens on it. An
// opening is told from a zoom step by whether another host is still alive
// when this one first renders (art/djZoom createZoomMemory: a step's new host
// renders BEFORE the old one's cleanup runs).
const memory = createZoomMemory();
// where the full screen's body viewport sits on the page (read at 1×)
let viewport: Viewport | null = null;

function DjStageHost({ w, h, render }: { w: number; h: number; render: (w: number, h: number) => ReactNode }) {
  const full = useContext(StageInFullScreen);
  if (!full) return <>{render(w, h)}</>;
  return <FullHost w={w} h={h} render={render} />;
}

function FullHost({ w, h, render }: { w: number; h: number; render: (w: number, h: number) => ReactNode }) {
  const zoom = useStageZoom();
  const glassW = useContext(StageGlassWidth);
  const lock = useScrollLock();
  const root = useRef<View>(null);
  // fixed for this step: where the rack scrolls (anchor) and what opens (at)
  const [carry] = useState(() => memory.begin());
  useEffect(() => {
    memory.mounted();
    return () => memory.unmounted();
  }, []);
  const anchor = carry.anchor;
  const zoomed = zoom > 1.001;
  useEffect(() => {
    if (!zoomed || !lock) return;
    lock(true);
    return () => lock(false);
  }, [zoomed, lock]);
  // what the page's Scene last drew (render coordinates), for reading a touch
  const view = useRef<SceneView | null>(null);
  // The window keeps the offset of its first size on this step (stepWindow),
  // as the mirror predicts it; once the box is laid out (and on every touch)
  // the host measures where the rack really scrolled and, if that differs,
  // moves the window there (art/djZoom alignedWindow).
  const first = useRef<{ x: number; y: number } | null>(null);
  const predicted = useMemo(() => {
    const sw = stepWindow(w, h, zoom, anchor, first.current);
    first.current = sw.first;
    return sw;
  }, [w, h, zoom, anchor]);
  const [measured, setMeasured] = useState<{ x: number; y: number } | null>(null);
  const win = useMemo(
    () => (measured ? { ...predicted, ...keepInBox(measured, w, h, predicted) } : predicted),
    [predicted, measured, w, h],
  );
  const winRef = useRef(win);
  winRef.current = win;
  const zoomedRef = useRef(zoomed);
  zoomedRef.current = zoomed;
  const geo = useRef({ w, h, zoom });
  geo.current = { w, h, zoom };
  // the box's page place: at 1× it gives the viewport's; zoomed, the scroll
  const realign = (px: number, py: number, mw: number) => {
    if (!alive.current || !(mw > 0)) return;
    const g = geo.current;
    if (!zoomedRef.current) {
      viewport = viewportFrom1x({ x: px, y: py }, mw);
      return;
    }
    const a = alignedWindow(viewport, { x: px, y: py }, g.w, g.h, g.zoom, winRef.current);
    if (a && (Math.abs(a.x - winRef.current.x) > 1 || Math.abs(a.y - winRef.current.y) > 1)) setMeasured(a);
  };
  const onRootLayout = () => {
    root.current?.measure((_x, _y, mw, _mh, px, py) => realign(px, py, mw));
  };
  const noteTouch = (e: { nativeEvent: { pageX: number; pageY: number } }) => {
    const { pageX: tx, pageY: ty } = e.nativeEvent;
    root.current?.measure((_x, _y, mw, mh, px, py) => {
      const a = anchorOf({ x: tx, y: ty }, { x: px, y: py }, { w: mw, h: mh });
      if (!a) return;
      const v = view.current;
      const ox = zoomedRef.current ? winRef.current.x : 0;
      const oy = zoomedRef.current ? winRef.current.y : 0;
      memory.touch(a, v ? scenePointAt({ x: tx - px - ox, y: ty - py - oy }, v) : null);
      if (zoomedRef.current) realign(px, py, mw);
    });
    return false;
  };
  // the learner's drag of the zoomed gear (relative to the opening camera)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const limits = useRef<PanLimits | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const tick = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const pending = useRef<{ x: number; y: number } | null>(null);
  // at 1× a drag pans only a drawing that fills (and overflows) the body
  const canPan = () => {
    if (zoomedRef.current) return true;
    const L = limits.current;
    return !!L && (L.maxX - L.minX > 1 || L.maxY - L.minY > 1);
  };
  const endDrag = () => {
    const v = view.current;
    if (v) memory.dragged(regionCentreAt(v, pending.current ?? panRef.current));
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6 && canPan(),
        onPanResponderGrant: () => {
          start.current = panRef.current;
          pending.current = null;
        },
        onPanResponderMove: (_e, g) => {
          const L = limits.current;
          const x = start.current.x + g.dx;
          const y = start.current.y + g.dy;
          pending.current = L ? { x: Math.max(L.minX, Math.min(L.maxX, x)), y: Math.max(L.minY, Math.min(L.maxY, y)) } : { x, y };
          if (tick.current == null) {
            tick.current = setTimeout(() => {
              tick.current = null;
              if (alive.current && pending.current) setPan(pending.current);
            }, 16);
          }
        },
        // the next zoom step opens on what the drag brought to the middle
        onPanResponderRelease: () => endDrag(),
        onPanResponderTerminate: () => endDrag(),
      }),
    [],
  );
  // one queued ~frame per drag value (a throttle, not a loop), cleared on unmount
  useEffect(
    () => () => {
      alive.current = false;
      if (tick.current != null) clearTimeout(tick.current);
    },
    [],
  );
  const ctx = useMemo(() => ({ z: zoomed ? zoom : 1, pan, limits, view, at: carry.at }), [zoomed, zoom, pan, carry]);
  return (
    <StageAspectReport.Provider value={null}>
      <View ref={root} style={{ width: w, height: h }} onStartShouldSetResponderCapture={noteTouch} onLayout={onRootLayout}>
        {zoomed ? (
          <View style={[styles.window, { left: win.x, top: win.y, width: win.w, height: win.h }]} {...responder.panHandlers}>
            <StageTextScale.Provider value={glassW > 0 ? Math.max(1, win.w / glassW) : 1}>
              <StageZoom.Provider value={1}>
                <DjZoomContext.Provider value={ctx}>{render(win.w, win.h)}</DjZoomContext.Provider>
              </StageZoom.Provider>
            </StageTextScale.Provider>
          </View>
        ) : (
          <View style={{ width: w, height: h }} {...responder.panHandlers}>
            <DjZoomContext.Provider value={ctx}>{render(w, h)}</DjZoomContext.Provider>
          </View>
        )}
      </View>
    </StageAspectReport.Provider>
  );
}

export function DjRack({ spec, children }: { spec: DjRackSpec; children: ReactNode }) {
  const { height: winH } = useWindowDimensions();
  const render = spec.render;
  return (
    <RackUnit
      params={spec.params}
      initialParam={spec.initialParam}
      stage={{
        size: spec.size ?? 'L',
        phoneHeight: djGlassHeight(winH),
        minWell: 120,
        fullScreen: true,
        badge: spec.badge,
        bezel: spec.bezel,
        hideDragTag: false,
        render: (w, h) => <DjStageHost w={w} h={h} render={render} />,
      }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  window: { position: 'absolute', overflow: 'hidden' },
});
