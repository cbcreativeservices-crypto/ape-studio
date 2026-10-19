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
 *     lesson's focus part; a drag moves the gear under the pinned plots.
 * Only the visible window is drawn, never the 3× box (the CanvasKit surface
 * the review saw run out on the web).
 */
import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, View, useWindowDimensions } from 'react-native';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';
import { StageAspectReport, StageGlassWidth, StageInFullScreen, StageTextScale, StageZoom, useStageZoom } from '../rack/stageAspect';
import { useScrollLock } from '../scrollLock';
import { DjZoomContext, zoomWindow, type PanLimits } from './art/djZoom';

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
// the same fraction from the same touches, so its window lands there too. An
// opening is told from a zoom step by the gap since the host last unmounted
// (a step re-mounts it in the same commit).
let anchorMirror: { fx: number; fy: number } | null = null;
let lastUnmountAt = 0;

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
  const [anchor] = useState(() => {
    if (Date.now() - lastUnmountAt > 400) anchorMirror = null;
    return anchorMirror;
  });
  useEffect(
    () => () => {
      lastUnmountAt = Date.now();
    },
    [],
  );
  const zoomed = zoom > 1.001;
  useEffect(() => {
    if (!zoomed || !lock) return;
    lock(true);
    return () => lock(false);
  }, [zoomed, lock]);
  const noteTouch = (e: { nativeEvent: { pageX: number; pageY: number } }) => {
    const { pageX: tx, pageY: ty } = e.nativeEvent;
    root.current?.measure((_x, _y, mw, mh, px, py) => {
      if (mw > 0 && mh > 0) anchorMirror = { fx: Math.max(0, Math.min(1, (tx - px) / mw)), fy: Math.max(0, Math.min(1, (ty - py) / mh)) };
    });
    return false;
  };
  // The rack scrolls ONCE per zoom step, on the box's first size; the body
  // can grow afterwards (its hint line shrinks to one line), which grows the
  // box but not the scroll. So the window keeps the offset of its first
  // render on this step and takes the new size.
  const first = useRef<{ x: number; y: number } | null>(null);
  const win = useMemo(() => {
    const z0 = zoomWindow(w, h, zoom, anchor);
    if (!first.current) first.current = { x: z0.x, y: z0.y };
    return { ...z0, x: Math.min(first.current.x, Math.max(0, w - z0.w)), y: Math.min(first.current.y, Math.max(0, h - z0.h)) };
  }, [w, h, zoom, anchor]);
  // the learner's drag of the zoomed gear (relative to the opening camera)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const limits = useRef<PanLimits | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const alive = useRef(true);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
        onPanResponderGrant: () => {
          start.current = panRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const L = limits.current;
          const x = start.current.x + g.dx;
          const y = start.current.y + g.dy;
          pending.current = L ? { x: Math.max(L.minX, Math.min(L.maxX, x)), y: Math.max(L.minY, Math.min(L.maxY, y)) } : { x, y };
          if (raf.current == null) {
            raf.current = requestAnimationFrame(() => {
              raf.current = null;
              if (alive.current && pending.current) setPan(pending.current);
            });
          }
        },
      }),
    [],
  );
  // one queued frame per drag value (a throttle, not a loop)
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const ctx = useMemo(() => ({ z: zoomed ? zoom : 1, pan, limits }), [zoomed, zoom, pan]);
  return (
    <StageAspectReport.Provider value={null}>
      <View ref={root} style={{ width: w, height: h }} onStartShouldSetResponderCapture={noteTouch}>
        {zoomed ? (
          <View style={[styles.window, { left: win.x, top: win.y, width: win.w, height: win.h }]} {...responder.panHandlers}>
            <StageTextScale.Provider value={glassW > 0 ? Math.max(1, win.w / glassW) : 1}>
              <StageZoom.Provider value={1}>
                <DjZoomContext.Provider value={ctx}>{render(win.w, win.h)}</DjZoomContext.Provider>
              </StageZoom.Provider>
            </StageTextScale.Provider>
          </View>
        ) : (
          render(w, h)
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
