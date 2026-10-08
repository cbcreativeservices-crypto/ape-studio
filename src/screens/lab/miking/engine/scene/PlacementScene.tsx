/**
 * PlacementScene — ONE view (side or top) of the lesson's 3-D model, with the
 * mics on it (blueprint §5).
 *
 * DRAWING: the instrument, zones, envelopes, booms, mics and polar slices are
 * all drawn in MILLIMETRES under one transform (`xf`, a shared value), so a
 * pinch zooms everything together and nothing drifts off its anchor.
 *
 * INTERACTION (Gesture Handler, §5.2 and ruling §16.8):
 *   • PAN, one finger, manual activation: a touch ON a mic (or its aim ring)
 *     activates; anywhere else the pan FAILS at once, so taps and the page
 *     keep the touch. The pose lives in a shared value; every update runs
 *     `constrainMove` on the UI thread — a mic can never enter a solid — and
 *     React hears about it only when the finger lifts (`onCommit`).
 *   • PINCH zooms about the fingers (and pans with them), 1× to 5×; a double
 *     tap returns to 1×. The zoom steps of full screen still work (D35).
 *   • TAP names a part (page 1).
 * No animation loops (D8): nothing here moves unless a finger moves it.
 *
 * ACCESSIBILITY: the canvas carries `accessible` + a label describing the
 * scene in words (describeScene); every placement is also reachable with no
 * drag through the dock's faders.
 *
 * FULL SCREEN (§5.6): a React Native Modal is its own native root on Android,
 * so inside StageFullScreen the scene wraps itself in GestureHandlerRootView;
 * a drag that starts on a mic locks the full-screen scrollers (ScrollLock).
 */
import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import Animated, { useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import { StageInFullScreen, useStageTextScale, useStageZoom } from '../../../rack/stageAspect';
import { useScrollLock } from '../../../scrollLock';
import { GestureExclusionZone, STAGE_BAND_DP } from '../../../../../../modules/ape-gesture-exclusion';
import { MikingMicArt } from '../../../../../features/lab/micDrawings';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import type { CompiledScene, DocumentedZone, Envelope, MicBody, MicPattern, MicPose, MicSlot, Shape3, VariantId, Vec3, ViewBox, ViewId } from '../model/types.ts';
import { sdf } from '../geometry/sdf.ts';
import { KeepOutsAtRest } from './keepOuts.ts';
import { viewsOf } from '../model/types.ts';
import { copyOf } from '../model/copy.ts';
import { aimVec, angleBetween, clamp, sub } from '../geometry/vec.ts';
import { fitXform, project, unprojectDelta, zoomAbout, type ViewXform } from '../geometry/frame.ts';
import { guideFor, projected, type Guide } from '../geometry/guides.ts';
import { fmtLen } from '../model/units.ts';
import { assembly, CLIP_REACH, constrainMove, pinToSurface, type Blocked } from '../geometry/collision.ts';
import { deriveReadouts } from '../geometry/readouts.ts';
import { zonesAvailable } from '../geometry/zones.ts';
import { gain, isModelled } from '../physics/polar.ts';
import { micType } from '../../data/micTypes.ts';
import type { Rig } from './useRig.ts';
import { liveLine, withStop } from './readoutText.ts';
import { frustumOutline } from '../geometry/outline.ts';
import { refLabels } from './sceneWords.ts';
import { labelWidth } from './labelLayout.ts';
import { layoutArtLabels } from './artLabels.ts';
import { sceneFrame } from '../geometry/contentFrame.ts';
import type { LessonArt } from './sceneTypes.ts';

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
/** The IDEAL-model colour (charter: blue = SOURCED, amber = TRIAL, grey = ILLUSTRATIVE). */
const IDEAL = '#e8eaee';
const POLAR_R = 170; // mm: the drawn radius of an on-axis lobe (a drawing size, not a range)
const MAX_ZOOM = 5;
/** Below this fit scale (px per mm) no part label is drawn. Above it the
 *  level-of-detail layout (artLabels.ts) keeps only labels with clear space
 *  (2026-10-06: lowered from 0.12 — a timpani on a 250 pt glass had none). */
const LABEL_MIN_S = 0.06;
const PAD = 8;
/** The aim ring sits this far behind the mic's tail, at this radius (screen px). */
const RING_OFFSET_PX = 20;
const RING_R_PX = 12;

export type SceneOptions = {
  slots?: MicSlot[];
  showZones?: boolean;
  showPolar?: boolean;
  showEnvelopes?: boolean;
  /** Page 5: straight paths from this source to each mic (an OVERLAY). */
  pathsFrom?: Vec3 | null;
  /** Page 4: a floor monitor — drawn on the floor at `at`, facing `faces`;
   *  the dashed sight line runs from the mic to `src` (its baffle). */
  wedge?: { at: Vec3; faces: Vec3; src: Vec3; glyph?: 'wedge' | 'none' } | null;
  highlight?: string | null;
  onTapPart?: (partId: string) => void;
  /** Only these recommended starting points are drawn (a STARTING SETUPS
   *  drawing shows the setup's own zones, not every one in the lesson). */
  zoneIds?: readonly string[];
  /** STARTING SETUPS: each mic's aim line and its distance as a dimension,
   *  measured to the surface its starting point is read from. */
  guides?: boolean;
};

export type PlacementSceneProps = SceneOptions & {
  rig: Rig;
  art: LessonArt;
  view: ViewId;
  w: number;
  h: number;
  interactive?: boolean;
  mini?: boolean;
  /** A fixed transform (DualView aligns two views on x); default = fit. */
  baseXf?: ViewXform;
  /** A rectangle part labels must not cover (DualView's inset), in px. */
  avoid?: { x0: number; y0: number; x1: number; y1: number };
  /** A wider model box than the lesson's view (page 4's plan with a wedge). */
  boxOverride?: ViewBox;
  /** The art's part labels (off where the drawing is too small for them). */
  showLabels?: boolean;
  /** The live readout strip (one per stacked pair is enough). */
  showLive?: boolean;
  onCommit?: (slot: MicSlot) => void;
  accessibilityLabel: string;
};

const vOf = (view: ViewId, p: Vec3) => {
  'worklet';
  return view === 'side' ? p.y : p.z;
};

/* ── static paths ─────────────────────────────────────────────────────── */

function shapeOutline(shape: Shape3, view: ViewId): ReturnType<typeof Skia.Path.Make> | null {
  const p = Skia.Path.Make();
  switch (shape.kind) {
    case 'box': {
      const v0 = view === 'side' ? shape.min.y : shape.min.z;
      const v1 = view === 'side' ? shape.max.y : shape.max.z;
      p.addRect(Skia.XYWHRect(shape.min.x, v0, shape.max.x - shape.min.x, v1 - v0));
      return p;
    }
    case 'sweep': {
      if (view === 'top') {
        // Plan: the x-extent of the swept head, ±halfW.
        const xs = [shape.a0, shape.a1, (shape.a0 + shape.a1) / 2].flatMap((a) => [shape.pivot.x + shape.r0 * Math.cos(a), shape.pivot.x + shape.r1 * Math.cos(a)]);
        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);
        p.addRect(Skia.XYWHRect(x0, shape.pivot.z - shape.halfW, x1 - x0, shape.halfW * 2));
        return p;
      }
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const a = shape.a0 + ((shape.a1 - shape.a0) * i) / n;
        const x = shape.pivot.x + shape.r1 * Math.cos(a);
        const y = shape.pivot.y + shape.r1 * Math.sin(a);
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      for (let i = n; i >= 0; i--) {
        const a = shape.a0 + ((shape.a1 - shape.a0) * i) / n;
        p.lineTo(shape.pivot.x + shape.r0 * Math.cos(a), shape.pivot.y + shape.r0 * Math.sin(a));
      }
      p.close();
      return p;
    }
    case 'frustum': {
      const pts = frustumOutline(shape, view);
      pts.forEach((q, i) => (i === 0 ? p.moveTo(q.u, q.v) : p.lineTo(q.u, q.v)));
      p.close();
      return p;
    }
    case 'sector': {
      if (view === 'side') {
        // The slice's x-extent (arc samples and the centre), between y0 and y1.
        const xs: number[] = [];
        for (let i = 0; i <= 24; i++) {
          const a = shape.a0 + ((shape.a1 - shape.a0) * i) / 24;
          xs.push(shape.c.x + shape.r1 * Math.cos(a), shape.c.x + shape.r0 * Math.cos(a));
        }
        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);
        p.addRect(Skia.XYWHRect(x0, shape.y0, x1 - x0, shape.y1 - shape.y0));
        return p;
      }
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const a = shape.a0 + ((shape.a1 - shape.a0) * i) / n;
        const x = shape.c.x + shape.r1 * Math.cos(a);
        const z = shape.c.z + shape.r1 * Math.sin(a);
        if (i === 0) p.moveTo(x, z);
        else p.lineTo(x, z);
      }
      for (let i = n; i >= 0; i--) {
        const a = shape.a0 + ((shape.a1 - shape.a0) * i) / n;
        p.lineTo(shape.c.x + shape.r0 * Math.cos(a), shape.c.z + shape.r0 * Math.sin(a));
      }
      p.close();
      return p;
    }
    case 'cyl': {
      // The cylinder's silhouette in this view: a band of half-width r round
      // the projected axis (end-on, a circle).
      const au = shape.a.x;
      const av = view === 'side' ? shape.a.y : shape.a.z;
      const bu = shape.b.x;
      const bv = view === 'side' ? shape.b.y : shape.b.z;
      const L = Math.hypot(bu - au, bv - av);
      if (L < 1) {
        p.addCircle(au, av, shape.r);
        return p;
      }
      const nu = (-(bv - av) / L) * shape.r;
      const nv = ((bu - au) / L) * shape.r;
      p.moveTo(au + nu, av + nv);
      p.lineTo(bu + nu, bv + nv);
      p.lineTo(bu - nu, bv - nv);
      p.lineTo(au - nu, av - nv);
      p.close();
      return p;
    }
    case 'capsule': {
      // A limb, a string, a neck: the band of half-width r round the
      // projected segment, with round ends (added 2026-10-05 for the bowed
      // strings, so a tapped part on a capsule is outlined).
      const au = shape.a.x;
      const av = view === 'side' ? shape.a.y : shape.a.z;
      const bu = shape.b.x;
      const bv = view === 'side' ? shape.b.y : shape.b.z;
      const L = Math.hypot(bu - au, bv - av);
      if (L < 1) {
        p.addCircle(au, av, shape.r);
        return p;
      }
      const a0 = Math.atan2(bv - av, bu - au);
      // Round the far end (−90° … +90° about the axis), then the near end.
      for (let i = 0; i <= 10; i++) {
        const t = a0 - Math.PI / 2 + (Math.PI * i) / 10;
        const q = { u: bu + shape.r * Math.cos(t), v: bv + shape.r * Math.sin(t) };
        if (i === 0) p.moveTo(q.u, q.v);
        else p.lineTo(q.u, q.v);
      }
      for (let i = 0; i <= 10; i++) {
        const t = a0 + Math.PI / 2 + (Math.PI * i) / 10;
        p.lineTo(au + shape.r * Math.cos(t), av + shape.r * Math.sin(t));
      }
      p.close();
      return p;
    }
    case 'fan': {
      // The fan's silhouette: its rim and pivot, both faces, projected.
      const pts: { u: number; v: number }[] = [];
      const sides = shape.twoSided ? [1, -1] : [1];
      for (const sd of sides) {
        for (let i = 0; i <= 12; i++) {
          const a = -shape.ang + (2 * shape.ang * i) / 12;
          const ca = Math.cos(a) * sd;
          const sa = Math.sin(a);
          for (const w of [-shape.halfW, shape.halfW]) {
            const q = {
              x: shape.c.x + (shape.u.x * ca + shape.v.x * sa) * (shape.r + shape.round) + shape.axis.x * w,
              y: shape.c.y + (shape.u.y * ca + shape.v.y * sa) * (shape.r + shape.round) + shape.axis.y * w,
              z: shape.c.z + (shape.u.z * ca + shape.v.z * sa) * (shape.r + shape.round) + shape.axis.z * w,
            };
            pts.push({ u: q.x, v: view === 'side' ? q.y : q.z });
          }
        }
      }
      for (const w of [-shape.halfW, shape.halfW]) pts.push({ u: shape.c.x + shape.axis.x * w, v: (view === 'side' ? shape.c.y : shape.c.z) + (view === 'side' ? shape.axis.y : shape.axis.z) * w });
      // Convex hull (monotone chain).
      pts.sort((a, b) => a.u - b.u || a.v - b.v);
      const cr = (o: { u: number; v: number }, a: { u: number; v: number }, b: { u: number; v: number }) => (a.u - o.u) * (b.v - o.v) - (a.v - o.v) * (b.u - o.u);
      const lo: { u: number; v: number }[] = [];
      for (const q of pts) {
        while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
        lo.push(q);
      }
      const hi: { u: number; v: number }[] = [];
      for (let i = pts.length - 1; i >= 0; i--) {
        const q = pts[i];
        while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
        hi.push(q);
      }
      const hull = [...lo.slice(0, -1), ...hi.slice(0, -1)];
      hull.forEach((q, i) => (i === 0 ? p.moveTo(q.u, q.v) : p.lineTo(q.u, q.v)));
      p.close();
      return p;
    }
    case 'prism': {
      // Lab 4. No hinge: the plan polygon (top), its x-extent × [y0, y1]
      // (side). Hinged (a lid): the turned face polygon, in either view.
      const hg = shape.hinge;
      if (!hg && view === 'side') {
        const xs = shape.pts.map((q) => q[0]);
        p.addRect(Skia.XYWHRect(Math.min(...xs), shape.y0, Math.max(...xs) - Math.min(...xs), shape.y1 - shape.y0));
        return p;
      }
      const a = ((hg?.deg ?? 0) * Math.PI) / 180;
      shape.pts.forEach(([x, z], i) => {
        const dz = z - (hg?.z ?? 0);
        const vz = (hg?.z ?? 0) + dz * Math.cos(a);
        const vy = (hg?.y ?? shape.y0) - dz * Math.sin(a);
        const v = view === 'side' ? vy : hg ? vz : z;
        if (i === 0) p.moveTo(x, v);
        else p.lineTo(x, v);
      });
      p.close();
      return p;
    }
    default:
      return null;
  }
}

/** The view-rect a cylinder (a tube or slab, any axis) projects to (mm). */
function cylinderRect(sol: Extract<Shape3, { kind: 'tube' | 'slab' }>, view: ViewId): { u0: number; u1: number; v0: number; v1: number } {
  const r = sol.kind === 'slab' ? sol.r : sol.rOut;
  if (!sol.axis) return { u0: sol.x0, u1: sol.x1, v0: (view === 'side' ? sol.c.y : sol.c.z) - r, v1: (view === 'side' ? sol.c.y : sol.c.z) + r };
  const a = sol.axis;
  const ends = [sol.x0, sol.x1].map((t) => ({ x: sol.c.x + a.x * t, y: sol.c.y + a.y * t, z: sol.c.z + a.z * t }));
  const av = view === 'side' ? a.y : a.z;
  const eu = r * Math.sqrt(Math.max(0, 1 - a.x * a.x));
  const ev = r * Math.sqrt(Math.max(0, 1 - av * av));
  const us = ends.map((e) => e.x);
  const vs = ends.map((e) => (view === 'side' ? e.y : e.z));
  return { u0: Math.min(...us) - eu, u1: Math.max(...us) + eu, v0: Math.min(...vs) - ev, v1: Math.max(...vs) + ev };
}

function hatch(box: ViewBox): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  const span = box.u1 - box.u0 + (box.v1 - box.v0);
  for (let d = 0; d < span; d += 26) {
    p.moveTo(box.u0 + d, box.v0);
    p.lineTo(box.u0 + d - (box.v1 - box.v0), box.v1);
  }
  return p;
}

/** A zone's projection into a view: the distance band × the radial band. */
/** A zone's drawn shape in a view: the lesson's own (a rect or a ring
 *  sector round a rim), else the kick's head-band projection. */
function zonePath(z: DocumentedZone, view: ViewId, rig: Rig): ReturnType<typeof Skia.Path.Make> {
  const own = z.drawn?.[view];
  const p = Skia.Path.Make();
  if (own && 'cu' in own) {
    const n = 32;
    const at = (r: number, a: number) => ({ x: own.cu + r * Math.cos((a * Math.PI) / 180), y: own.cv + r * Math.sin((a * Math.PI) / 180) });
    for (let i = 0; i <= n; i++) {
      const q = at(own.r1, own.a0 + ((own.a1 - own.a0) * i) / n);
      if (i === 0) p.moveTo(q.x, q.y);
      else p.lineTo(q.x, q.y);
    }
    for (let i = n; i >= 0; i--) {
      const q = at(own.r0, own.a0 + ((own.a1 - own.a0) * i) / n);
      p.lineTo(q.x, q.y);
    }
    p.close();
    return p;
  }
  // A zone that carries its own polygons (the lesson's geometry computes them
  // from the same numbers): those, not the plane band.
  const polys = own ? undefined : z.draw?.[view];
  if (polys) {
    for (const g of polys) {
      g.poly.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
      p.close();
    }
    return p;
  }
  const r = zoneRect(z, view, rig);
  const rect = Skia.XYWHRect(r.u0, r.v0, Math.max(4, r.u1 - r.u0), r.v1 - r.v0);
  // `round`: the ellipse inside the rect (a band over a round head, from above).
  if (r.round) p.addOval(rect);
  else p.addRRect(Skia.RRectXY(rect, 10, 10));
  return p;
}

function zoneRect(z: DocumentedZone, view: ViewId, rig: Rig): { u0: number; u1: number; v0: number; v1: number; round?: boolean } {
  // An upright or tilted drum's zone brings its own projection (geometry.ts).
  const own = z.drawn?.[view];
  if (own && !('cu' in own)) return own;
  const m = rig.lesson.model;
  const s = m.surfaces.find((q) => q.id === z.refSurface)!;
  const a = s.point.x + s.normal.x * z.distance.min;
  const b = s.point.x + s.normal.x * z.distance.max;
  // The DISTANCE band, across the interior (inside) or the head (outside).
  // A radial condition ("slightly off-center", "on the edge") is not drawn
  // as a region — both views are sections, so a band would mislead; it is
  // READ (the bezel, the zone card) against the dashed reference line.
  const span = z.side === 'inside' ? m.interior.rIn : (m.parts.find((p) => p.solid?.kind === 'tube')?.solid as { rOut?: number } | undefined)?.rOut ?? m.interior.rIn;
  let v0 = -span;
  let v1 = span;
  if (z.requires?.mount === 'surface') {
    const part = m.parts.find((p) => p.id === micType(z.requires!.micTypeIds![0]).surfacePartId);
    if (part?.solid?.kind === 'box') {
      if (view === 'side') {
        v1 = part.solid.min.y;
        v0 = v1 - 40;
      } else {
        v0 = part.solid.min.z;
        v1 = part.solid.max.z;
      }
    }
  }
  return { u0: Math.min(a, b), u1: Math.max(a, b), v0, v1 };
}

/* ── the mic glyph ───────────────────────────────────────────────────── */

function MicGlyph({ pose, view, typeId, blocked, focus, xf }: { pose: SharedValue<MicPose>; view: ViewId; typeId: string; blocked: SharedValue<Blocked>; focus: boolean; xf: SharedValue<ViewXform> }) {
  const t = micType(typeId);
  const len = t.body.length.mm;
  const r = t.body.radius.mm;
  const surface = t.mount === 'surface';
  // A side-address body stands upright: its long extent shows from the side,
  // its depth from above.
  const cross = surface ? (view === 'side' ? r * 2 : (t.body.width?.mm ?? r * 2)) : t.address === 'side' && view === 'side' ? (t.body.width?.mm ?? r * 2) : r * 2;
  const transform = useDerivedValue(() => {
    const p = pose.value;
    const aim = aimVec(p.az, surface ? 0 : p.el);
    const bx = -aim.x;
    const by = view === 'side' ? -aim.y : -aim.z;
    const fore = Math.max(0.12, Math.sqrt(bx * bx + by * by));
    const ang = Math.atan2(by, bx) - Math.PI / 2;
    return [{ translateX: p.p.x }, { translateY: vOf(view, p.p) }, { rotate: ang }, { scaleY: fore }, { translateX: surface && view === 'side' ? -r : 0 }];
  });
  const redOpacity = useDerivedValue(() => (blocked.value ? 0.95 : 0));
  const ring = useDerivedValue(() => {
    const p = pose.value;
    const k = len + RING_OFFSET_PX / xf.value.s;
    const aim = aimVec(p.az, p.el);
    const tail = sub(p.p, { x: aim.x * k, y: aim.y * k, z: aim.z * k });
    return vec(tail.x, vOf(view, tail));
  });
  const ringR = useDerivedValue(() => RING_R_PX / xf.value.s);
  const ringW = useDerivedValue(() => 2.5 / xf.value.s);
  // A pop screen's gooseneck leaves the hoop on its LOWER side (side view) —
  // which local side that is depends on the mic's turn on the glass.
  const popFlip = useDerivedValue(() => {
    const p = pose.value;
    const aim = aimVec(p.az, p.el);
    const bx = -aim.x;
    const by = view === 'side' ? -aim.y : -aim.z;
    const ang = Math.atan2(by, bx) - Math.PI / 2;
    return [{ scaleX: Math.sin(ang) <= 0 ? 1 : -1 }];
  });
  return (
    <Group>
      <Group transform={transform}>
        {t.pop ? <PopGooseneck pop={t.pop} len={len} flip={popFlip} /> : null}
        <MikingMicArt art={t.art} r={r} len={len} cross={cross} />
        {t.pop ? <PopHoop pop={t.pop} /> : null}
        {/* Collision: a red outline + the scene's ✕ label (colour never alone). */}
        <Path path={outlineOf(len, cross)} style="stroke" strokeWidth={5} color={RED} opacity={redOpacity} />
      </Group>
      {!surface && focus ? (
        <>
          {/* The AIM ring behind the tail: drag it to turn the mic. */}
          <Circle c={ring} r={ringR} color="#ffffff" opacity={0.1} />
          <Circle c={ring} r={ringR} style="stroke" strokeWidth={ringW} color={AMBER} opacity={0.9} />
        </>
      ) : null}
    </Group>
  );
}

/**
 * A POP SCREEN (Lab 5; types.ts PopScreen), in the mic's local frame (front
 * at the origin, the body toward +y): the hoop `gap` mm ahead of the front,
 * seen edge-on as a thin ellipse (its tilt off parallel), a fine mesh across
 * it; and the gooseneck from the hoop's rim back to its clamp on the stand's
 * boom just behind the mic's tail — the same mount the collision model uses,
 * so the screen never floats. Drawn under the scene's one transform.
 */
function PopHoop({ pop }: { pop: NonNullable<ReturnType<typeof micType>['pop']> }) {
  const g = pop.gap.mm;
  const R = pop.r.mm;
  const ry = Math.max(7, R * Math.sin((pop.tilt.mm * Math.PI) / 180));
  const hoop = useMemo(() => {
    const p = Skia.Path.Make();
    p.addOval(Skia.XYWHRect(-R, -g - ry, 2 * R, 2 * ry));
    return p;
  }, [g, R, ry]);
  const mesh = useMemo(() => {
    const p = Skia.Path.Make();
    for (let x = -R + 9; x < R; x += 9) {
      const h = ry * Math.sqrt(Math.max(0, 1 - (x / R) * (x / R)));
      p.moveTo(x, -g - h);
      p.lineTo(x, -g + h);
    }
    return p;
  }, [g, R, ry]);
  return (
    <Group>
      <Path path={hoop} color="#0b0c10" opacity={0.55} />
      <Group clip={hoop}>
        <Path path={mesh} style="stroke" strokeWidth={1.1} color="#9aa0ab" opacity={0.35} />
      </Group>
      <Path path={hoop} style="stroke" strokeWidth={6} color="#08090b" />
      <Path path={hoop} style="stroke" strokeWidth={3.6} color="#3d414b" />
      <Group transform={[{ translateX: -1.2 }, { translateY: -1.6 }]}>
        <Path path={hoop} style="stroke" strokeWidth={1.2} color="#d4d8e0" opacity={0.45} />
      </Group>
    </Group>
  );
}

function PopGooseneck({ pop, len, flip }: { pop: NonNullable<ReturnType<typeof micType>['pop']>; len: number; flip: SharedValue<{ scaleX: number }[]> }) {
  const g = pop.gap.mm;
  const R = pop.r.mm;
  const neck = useMemo(() => {
    const p = Skia.Path.Make();
    // From the hoop's rim (local −x) round the side of the mic to a clamp on
    // the boom, just behind the tail.
    p.moveTo(-R * 0.92, -g + 3);
    p.cubicTo(-R * 1.25, -g * 0.35, -R * 1.05, len * 0.55, -14, len + 26);
    return p;
  }, [g, R, len]);
  return (
    <Group transform={flip}>
      <Path path={neck} style="stroke" strokeWidth={8} strokeCap="round" color="#0b0c0f" />
      <Path path={neck} style="stroke" strokeWidth={5} strokeCap="round" color="#4d515b" />
      <Group transform={[{ translateX: -1 }, { translateY: -1.4 }]}>
        <Path path={neck} style="stroke" strokeWidth={1.4} strokeCap="round" color="#d4d8e0" opacity={0.45} />
      </Group>
      {/* The clamp on the boom. */}
      <Circle cx={-14} cy={len + 26} r={9} color="#16171b" />
      <Circle cx={-14} cy={len + 26} r={9} style="stroke" strokeWidth={2} color="#8a8f99" />
    </Group>
  );
}

const outlineCache = new Map<string, ReturnType<typeof Skia.Path.Make>>();
function outlineOf(len: number, cross: number) {
  const k = `${len}:${cross}`;
  let p = outlineCache.get(k);
  if (!p) {
    p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross / 2 - 4, -4, cross + 8, len + 8), 8, 8));
    outlineCache.set(k, p);
  }
  return p;
}

/* ── per-mic overlays ────────────────────────────────────────────────── */

/** The stand's static parts, built once (mm; translated to the foot). */
const STAND_ART = (() => {
  let made: { baseSide: ReturnType<typeof Skia.Path.Make>; hubSide: ReturnType<typeof Skia.Path.Make>; baseTop: ReturnType<typeof Skia.Path.Make> } | null = null;
  return () => {
    if (!made) {
      const baseSide = Skia.Path.Make();
      baseSide.addRRect(Skia.RRectXY(Skia.XYWHRect(-58, -11, 116, 11), 5, 5));
      const hubSide = Skia.Path.Make();
      hubSide.addRRect(Skia.RRectXY(Skia.XYWHRect(-13, -26, 26, 17), 4, 4));
      // Seen from above: a TRIPOD base (three legs and a hub) — never a plain
      // disc, which next to the head read as the port (geometry fix 2026-10-04).
      const baseTop = Skia.Path.Make();
      for (let k = 0; k < 3; k++) {
        const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
        baseTop.moveTo(0, 0);
        baseTop.lineTo(Math.cos(a) * 70, Math.sin(a) * 70);
      }
      made = { baseSide, hubSide, baseTop };
    }
    return made;
  };
})();

/**
 * The mic's mount, drawn from the SAME capsules the collision uses
 * (`assembly`): boom and stand as satin tubes with a rim light, the clutch at
 * the boom joint, a weighted base where the stand meets the floor (side
 * view), and the cable taped along the boom. The base and the cable are
 * drawing only (ILLUSTRATIVE): the collision keeps the tubes it always had.
 */
function MountPath({ rig, slot, pose, view }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId }) {
  const scene = rig.scene;
  const body = rig.body[slot];
  const art = STAND_ART();
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (body.mount !== 'stand' && body.mount !== 'boom') return p;
    const segs = assembly(scene, pose.value, body);
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece === 'body') continue;
      p.moveTo(segs[i].a.x, vOf(view, segs[i].a));
      p.lineTo(segs[i].b.x, vOf(view, segs[i].b));
    }
    return p;
  });
  // The boom joint and the stand's foot, from the same capsules.
  const geo = useDerivedValue(() => {
    if (body.mount !== 'stand' && body.mount !== 'boom') return { jx: 0, jv: 0, fx: 0, fv: 0, joint: 0, stand: 0 };
    const segs = assembly(scene, pose.value, body);
    let jx = 0;
    let jv = 0;
    let fx = 0;
    let fv = 0;
    let joint = 0;
    let stand = 0;
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece === 'boom') {
        jx = segs[i].b.x;
        jv = vOf(view, segs[i].b);
        joint = 1;
      } else if (segs[i].piece === 'stand') {
        fx = segs[i].b.x;
        fv = vOf(view, segs[i].b);
        stand = 1;
      }
    }
    return { jx, jv, fx, fv, joint, stand };
  });
  const jx = useDerivedValue(() => geo.value.jx);
  const jv = useDerivedValue(() => geo.value.jv);
  const jOn = useDerivedValue(() => geo.value.joint);
  const footXf = useDerivedValue(() => [{ translateX: geo.value.fx }, { translateY: geo.value.fv }]);
  const footOn = useDerivedValue(() => geo.value.stand);
  if (body.mount !== 'stand' && body.mount !== 'boom') return null;
  return (
    <>
      {/* The weighted base under the stand. */}
      <Group transform={footXf} opacity={footOn}>
        {view === 'side' ? (
          <>
            <Path path={art.baseSide}>
              <LinearGradient start={vec(0, -11)} end={vec(0, 0)} colors={['#5b5f69', '#1d1e23']} />
            </Path>
            <Path path={art.hubSide} color="#2a2c32" />
          </>
        ) : (
          <>
            <Path path={art.baseTop} style="stroke" strokeWidth={13} strokeCap="round" color="#0b0c0f" opacity={0.9} />
            <Path path={art.baseTop} style="stroke" strokeWidth={8} strokeCap="round" color="#4d515b" />
            <Circle cx={0} cy={0} r={13} color="#2a2c32" />
          </>
        )}
      </Group>
      {/* Tubes: a dark edge, the satin body, a rim light toward the upper left. */}
      <Path path={path} style="stroke" strokeWidth={17} strokeCap="round" color="#0b0c0f" />
      <Path path={path} style="stroke" strokeWidth={12.5} strokeCap="round" color="#4d515b" />
      <Group transform={[{ translateX: -1.6 }, { translateY: -2.2 }]}>
        <Path path={path} style="stroke" strokeWidth={3.5} strokeCap="round" color="#d4d8e0" opacity={0.5} />
      </Group>
      {/* The cable, taped along the boom (its run is ILLUSTRATIVE). */}
      <Group transform={[{ translateX: 0 }, { translateY: 9 }]}>
        <Path path={path} style="stroke" strokeWidth={5} strokeCap="round" color="#0e0f12" />
        <Path path={path} style="stroke" strokeWidth={1.6} strokeCap="round" color="#3d4049" />
      </Group>
      {/* The clutch at the boom joint. */}
      <Group opacity={jOn}>
        <Circle cx={jx} cy={jv} r={13} color="#16171b" />
        <Circle cx={jx} cy={jv} r={13} style="stroke" strokeWidth={2.4} color="#8a8f99" />
        <Circle cx={jx} cy={jv} r={4.5} color="#d4d8e0" />
      </Group>
    </>
  );
}

/**
 * A RIM CLAMP's arm, from the mic's tail to its grip on the hoop — the same
 * capsule `assembly` uses (the clamp's look is ILLUSTRATIVE: a jaw on the
 * hoop, a short swivel arm). Red when the hoop is out of the clamp's reach.
 */
function ClampArm({ rig, slot, pose, view }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId }) {
  const scene = rig.scene;
  const body = rig.body[slot];
  const geo = useDerivedValue(() => {
    const segs = assembly(scene, pose.value, body);
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece !== 'arm') continue;
      const a = segs[i].a;
      const b = segs[i].b;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      return { ax: a.x, av: vOf(view, a), bx: b.x, bv: vOf(view, b), on: 1, far: Math.sqrt(dx * dx + dy * dy + dz * dz) > (body.reach ?? CLIP_REACH) ? 1 : 0 };
    }
    return { ax: 0, av: 0, bx: 0, bv: 0, on: 0, far: 0 };
  });
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!geo.value.on) return p;
    p.moveTo(geo.value.ax, geo.value.av);
    p.lineTo(geo.value.bx, geo.value.bv);
    return p;
  });
  const jaw = useDerivedValue(() => [{ translateX: geo.value.bx }, { translateY: geo.value.bv }]);
  const on = useDerivedValue(() => geo.value.on);
  const red = useDerivedValue(() => geo.value.far * 0.9);
  if (body.mount !== 'clip') return null;
  // Lab 6 group 6: a BOOM POLE (MicType.clip.arm) is drawn its own thickness —
  // a satin carbon tube with a rim light — and has no jaw: the operator's
  // hands, in the lesson's art, hold its end.
  const pole = body.armR != null;
  const w = pole ? body.armR! * 2 : 7;
  return (
    <Group opacity={on}>
      <Path path={path} style="stroke" strokeWidth={w + 4} strokeCap="round" color="#0b0c0f" />
      <Path path={path} style="stroke" strokeWidth={w} strokeCap="round" color={pole ? '#3a3d45' : '#4d515b'} />
      <Group transform={[{ translateX: -1 }, { translateY: -1.5 }]}>
        <Path path={path} style="stroke" strokeWidth={pole ? Math.max(2, w * 0.22) : 2} strokeCap="round" color="#d4d8e0" opacity={0.5} />
      </Group>
      <Path path={path} style="stroke" strokeWidth={w + 2} strokeCap="round" color="#ff6b5e" opacity={red} />
      {/* The jaw gripping the hoop. */}
      {pole ? null : (
        <Group transform={jaw}>
          <Circle cx={0} cy={0} r={9} color="#16171b" />
          <Circle cx={0} cy={0} r={9} style="stroke" strokeWidth={2} color="#8a8f99" />
          <Circle cx={0} cy={0} r={3} color="#d4d8e0" />
        </Group>
      )}
    </Group>
  );
}

function PolarSlice({ pose, view, pattern }: { pose: SharedValue<MicPose>; view: ViewId; pattern: MicPattern }) {
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!isModelled(pattern)) return p;
    const ps = pose.value;
    const aim = aimVec(ps.az, ps.el);
    const cu = ps.p.x;
    const cv = vOf(view, ps.p);
    for (let i = 0; i <= 90; i++) {
      const phi = (i / 90) * Math.PI * 2;
      const d = view === 'side' ? { x: Math.cos(phi), y: Math.sin(phi), z: 0 } : { x: Math.cos(phi), y: 0, z: Math.sin(phi) };
      const g = Math.abs(gain(pattern, angleBetween(aim, d))) * POLAR_R;
      const u = cu + g * Math.cos(phi);
      const v = cv + g * Math.sin(phi);
      if (i === 0) p.moveTo(u, v);
      else p.lineTo(u, v);
    }
    p.close();
    return p;
  });
  if (!isModelled(pattern)) return null;
  // IDEAL, not sourced: drawn in the neutral "ideal model" white, dashed —
  // never the zone blue, which means SOURCED (review M4).
  return (
    <>
      <Path path={path} color={IDEAL} opacity={0.06} />
      <Path path={path} style="stroke" strokeWidth={2.5} color={IDEAL} opacity={0.7}>
        <DashPathEffect intervals={[10, 7]} />
      </Path>
    </>
  );
}

/** The lobe's in-canvas tag, following the mic (UI thread; no React work). */
/** A kept part label's place, for the lobe tag to step round (opt-in). */
type LabelBox = { u: number; v: number; W: number; align: 'left' | 'center' | 'right' };

function LobeTag({ pose, view, xf, scale, maxX, maxY, labelBoxes = null, shown, avoid = null }: { pose: SharedValue<MicPose>; view: ViewId; xf: SharedValue<ViewXform>; scale: number; maxX: number; maxY: number; labelBoxes?: LabelBox[] | null; shown: SharedValue<number>; avoid?: { x0: number; y0: number; x1: number; y1: number } | null }) {
  const text = 'PATTERN SHAPE, NOT RANGE';
  const W = labelWidth(text, scale, maxX);
  const H = 9.5 * scale * 1.25;
  const style = useAnimatedStyle(() => {
    const p = pose.value;
    const c = xf.value;
    const x = c.ox + p.p.x * c.s;
    const above = c.oy + (vOf(view, p.p) - POLAR_R) * c.s - 14 * scale;
    const below = c.oy + (vOf(view, p.p) + POLAR_R) * c.s + 2;
    const left = Math.max(2, Math.min(maxX - W - 2, x - W / 2));
    // Above the lobe, unless that lands in the top-right corner the glass's
    // inset owns — then below it.
    const inInset = left + W > maxX * 0.7 && above < maxY * 0.62;
    // A lesson whose labels yield to the mic also keeps this tag off them.
    const hitsLabel = (y: number) => {
      if (!labelBoxes) return false;
      for (const b of labelBoxes) {
        const bx = c.ox + b.u * c.s;
        const bl = Math.max(2, Math.min(maxX - b.W - 2, b.align === 'left' ? bx : b.align === 'right' ? bx - b.W : bx - b.W / 2));
        const bt = c.oy + b.v * c.s - 7 * scale;
        if (left < bl + b.W && left + W > bl && y < bt + H && y + H > bt) return true;
      }
      return false;
    };
    // The caller's keep-off rect (DualView's inset, wherever it sits).
    const hitsAvoid = (yy: number) => !!avoid && left < avoid.x1 && left + W > avoid.x0 && yy < avoid.y1 && yy + H > avoid.y0;
    let y = inInset ? below : above;
    if (hitsLabel(y) || hitsAvoid(y)) y = y === above ? below : above;
    if (hitsAvoid(y)) y = -1000;
    // No clean spot (the badge still says it): hidden rather than on top of
    // another label. A mic tilted well down seen from the side (a hand
    // drum's, aimed at a head) has its body, handle and boom rising out of
    // the lobe, and the part labels sit beside it: no clean spot either.
    const steep = view === 'side' && Math.abs(p.el) > 30;
    const ok = !steep && y > 4 && y < maxY - 34 && !hitsLabel(y) && !(y === above && inInset);
    // Shown while a mic moves, never at rest (the badge under the display
    // says it once: owner ruling 2026-10-05, less on the drawing).
    return { opacity: ok ? shown.value : 0, transform: [{ translateX: left }, { translateY: y }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.label, { width: W }, style]}>
      <Text style={[styles.labelText, { fontSize: 9 * scale, textAlign: 'center', color: '#d9dde5' }]} {...fitValue(9 * scale)}>
        {text}
      </Text>
    </Animated.View>
  );
}

function PathsOverlay({ rig, view, from }: { rig: Rig; view: ViewId; from: Vec3 }) {
  const a = rig.pose.A;
  const b = rig.pose.B;
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.moveTo(from.x, vOf(view, from));
    p.lineTo(a.value.p.x, vOf(view, a.value.p));
    p.moveTo(from.x, vOf(view, from));
    p.lineTo(b.value.p.x, vOf(view, b.value.p));
    return p;
  });
  return (
    <>
      <Path path={path} style="stroke" strokeWidth={4} color={AMBER} opacity={0.9}>
        <DashPathEffect intervals={[18, 10]} />
      </Path>
      <Circle cx={from.x} cy={vOf(view, from)} r={14} color={AMBER} />
    </>
  );
}

/**
 * A STARTING SETUP's guides (geometry/guides.ts): the AIM — a dashed amber
 * line from the mic's front along its axis, with an arrowhead — and the
 * DIMENSION — a fine white line from the front to the point its distance is
 * measured to, with a tick at each end. Ticks and arrowhead keep their screen
 * size at every zoom (built from the transform's scale each frame).
 */
function SetupGuide({ g, view, xf, dashMm, drawDim }: { g: Guide; view: ViewId; xf: SharedValue<ViewXform>; dashMm: number; drawDim: boolean }) {
  const f = { u: g.front.x, v: vOf(view, g.front) };
  const t = { u: g.foot.x, v: vOf(view, g.foot) };
  const e = { u: g.aimEnd.x, v: vOf(view, g.aimEnd) };
  const aimPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(f.u, f.v);
    p.lineTo(e.u, e.v);
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.u, f.v, e.u, e.v]);
  const marks = useDerivedValue(() => {
    const s = xf.value.s;
    const p = Skia.Path.Make();
    // The arrowhead at the aim's end (10 px).
    const au = e.u - f.u;
    const av = e.v - f.v;
    const al = Math.sqrt(au * au + av * av);
    if (al > 1e-6) {
      const ux = au / al;
      const uy = av / al;
      const k = 10 / s;
      p.moveTo(e.u, e.v);
      p.lineTo(e.u - ux * k - uy * k * 0.55, e.v - uy * k + ux * k * 0.55);
      p.moveTo(e.u, e.v);
      p.lineTo(e.u - ux * k + uy * k * 0.55, e.v - uy * k - ux * k * 0.55);
    }
    return p;
  });
  const dim = useDerivedValue(() => {
    const s = xf.value.s;
    const p = Skia.Path.Make();
    if (!drawDim) return p;
    const du = t.u - f.u;
    const dv = t.v - f.v;
    const l = Math.sqrt(du * du + dv * dv);
    if (l < 1e-6) return p;
    const nx = -dv / l;
    const ny = du / l;
    const k = 7 / s;
    p.moveTo(f.u, f.v);
    p.lineTo(t.u, t.v);
    p.moveTo(f.u - nx * k, f.v - ny * k);
    p.lineTo(f.u + nx * k, f.v + ny * k);
    p.moveTo(t.u - nx * k, t.v - ny * k);
    p.lineTo(t.u + nx * k, t.v + ny * k);
    return p;
  });
  const w2 = useDerivedValue(() => 2 / xf.value.s);
  const w4 = useDerivedValue(() => 4.5 / xf.value.s);
  return (
    <>
      <Path path={aimPath} style="stroke" strokeWidth={w4} color="#000" opacity={0.45} />
      <Path path={aimPath} style="stroke" strokeWidth={w2} color={AMBER} opacity={0.95}>
        <DashPathEffect intervals={[dashMm, dashMm * 0.7]} />
      </Path>
      <Path path={marks} style="stroke" strokeWidth={w2} strokeCap="round" color={AMBER} />
      <Path path={dim} style="stroke" strokeWidth={w4} color="#000" opacity={0.5} />
      <Path path={dim} style="stroke" strokeWidth={w2} strokeCap="round" color="#f2f4f8" />
    </>
  );
}

/** The dimension's distance, in words beside its middle (or beside the mic
 *  when the dimension is seen end-on in this view). */
function GuideLabel({ xf, u, v, nx, ny, W, H, text, scale, maxX, maxY }: { xf: SharedValue<ViewXform>; u: number; v: number; nx: number; ny: number; W: number; H: number; text: string; scale: number; maxX: number; maxY: number }) {
  const style = useAnimatedStyle(() => {
    const c = xf.value;
    const cx = c.ox + u * c.s + nx * (W / 2 + 6);
    const cy = c.oy + v * c.s + ny * (H / 2 + 6);
    const left = Math.max(2, Math.min(maxX - W - 2, cx - W / 2));
    const top = Math.max(2, Math.min(maxY - H - 2, cy - H / 2));
    return { transform: [{ translateX: left }, { translateY: top }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.label, styles.guideLabel, { width: W }, style]}>
      <Text style={[styles.labelText, { fontSize: 9.5 * scale, textAlign: 'center', color: '#f2f4f8' }]} {...fitValue(9.5 * scale)}>
        {text}
      </Text>
    </Animated.View>
  );
}

function ZoneBand({ z, rig, view, zoneSV }: { z: DocumentedZone; rig: Rig; view: ViewId; zoneSV: SharedValue<string | null> }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const path = useMemo(() => zonePath(z, view, rig), [z, view, rig.lesson, rig.variant]);
  // One consistent style for every recommended starting point (owner ruling
  // 2026-10-04): the same blue band, the same solid edge.
  const tone = BLUE;
  const fill = useDerivedValue(() => (zoneSV.value === z.id ? 0.26 : 0.03));
  const edge = useDerivedValue(() => (zoneSV.value === z.id ? 1 : 0.32));
  return (
    <>
      <Path path={path} color={tone} opacity={fill} />
      <Path path={path} style="stroke" strokeWidth={2.5} color={tone} opacity={edge} />
    </>
  );
}

/* ── RN labels over the canvas, following the same transform ─────────── */

/** The mics a label yields to (LessonArt.labelsYieldToMic): each pose and
 *  its body length (mm), so the label can tell when a mic sits under it. */
type MicYield = { poses: SharedValue<MicPose>[]; lens: number[]; surf: boolean[] } | null;

function SceneLabel({ xf, u, v, text, align, tone, scale, maxX, yieldTo = null, view }: { xf: SharedValue<ViewXform>; u: number; v: number; text: string; align: 'left' | 'center' | 'right'; tone?: string; scale: number; maxX: number; yieldTo?: MicYield; view: ViewId }) {
  // Width from the text (Oswald ≈ 0.55 em per glyph), so a label can be kept
  // wholly inside the canvas instead of running off its edge.
  const W = labelWidth(text, scale, maxX);
  const H = 9.5 * scale * 1.25;
  const style = useAnimatedStyle(() => {
    const x = xf.value.ox + u * xf.value.s;
    const y = xf.value.oy + v * xf.value.s;
    const left = Math.max(2, Math.min(maxX - W - 2, align === 'left' ? x : align === 'right' ? x - W : x - W / 2));
    const top = y - 7 * scale;
    // A mic under the words: the label steps back (the mic, its lobe and the
    // readout it drives are the lesson; the part's name can wait).
    let opacity = 1;
    if (yieldTo) {
      for (let i = 0; i < yieldTo.poses.length; i++) {
        const p = yieldTo.poses[i].value;
        const aim = aimVec(p.az, yieldTo.surf[i] ? 0 : p.el);
        const fx = xf.value.ox + p.p.x * xf.value.s;
        const fy = xf.value.oy + (view === 'side' ? p.p.y : p.p.z) * xf.value.s;
        const tx = fx - aim.x * yieldTo.lens[i] * xf.value.s;
        const ty = fy - (view === 'side' ? aim.y : aim.z) * yieldTo.lens[i] * xf.value.s;
        // Sample the body from front to tail against the label's box (+ a margin).
        for (let k = 0; k <= 6; k++) {
          const sx = fx + ((tx - fx) * k) / 6;
          const sy = fy + ((ty - fy) * k) / 6;
          if (sx > left - 10 && sx < left + W + 10 && sy > top - 10 && sy < top + H + 10) opacity = 0.14;
        }
      }
    }
    return { opacity, transform: [{ translateX: left }, { translateY: top }] };
  });
  const color = tone === 'illustrative' ? '#aab0bd' : tone === 'muted' ? colors.textMuted : colors.amberLabel;
  return (
    <Animated.View pointerEvents="none" style={[styles.label, { width: W }, style]}>
      <Text style={[styles.labelText, { fontSize: 9.5 * scale, textAlign: align, color }]} {...fitValue(9.5 * scale)}>
        {text}
      </Text>
    </Animated.View>
  );
}

/** Thin leaders from a part to its label where the label had to move off it
 *  (labelLayout: `leader`). Drawn INSIDE the scene's transform — under the
 *  zones, the stands and the mics — with the label's end worked out in
 *  screen px each frame, so both ends stay attached at every zoom. */
function LeaderLines({ labels, xf, scale, maxX }: { labels: { u: number; v: number; text: string; align: 'left' | 'center' | 'right'; leader?: { u: number; v: number } }[]; xf: SharedValue<ViewXform>; scale: number; maxX: number }) {
  const items = useMemo(() => labels.filter((l) => l.leader).map((l) => ({ u: l.u, v: l.v, align: l.align, W: labelWidth(l.text, scale, maxX), au: l.leader!.u, av: l.leader!.v })), [labels, scale, maxX]);
  const H = 9.5 * scale * 1.25;
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const c = xf.value;
    for (const it of items) {
      const x = c.ox + it.u * c.s;
      const left = Math.max(2, Math.min(maxX - it.W - 2, it.align === 'left' ? x : it.align === 'right' ? x - it.W : x - it.W / 2));
      const top = c.oy + it.v * c.s - 7 * scale;
      const ax = c.ox + it.au * c.s;
      const ay = c.oy + it.av * c.s;
      const ex = Math.max(left + 3, Math.min(left + it.W - 3, ax));
      const ey = Math.max(top + 2, Math.min(top + H - 2, ay));
      // Back into mm (the group's transform draws them).
      p.moveTo(it.au, it.av);
      p.lineTo((ex - c.ox) / c.s, (ey - c.oy) / c.s);
      p.addCircle(it.au, it.av, 2.4 / c.s);
    }
    return p;
  }, [items]);
  const halo = useDerivedValue(() => 3 / xf.value.s);
  const line = useDerivedValue(() => 1.1 / xf.value.s);
  if (!items.length) return null;
  return (
    <>
      <Path path={path} style="stroke" strokeWidth={halo} color="#000" opacity={0.5} />
      <Path path={path} style="stroke" strokeWidth={line} color={colors.amberLabel} opacity={0.8} />
    </>
  );
}

/* ── keep-outs: shown on approach, never at rest ─────────────────────── */

/** A mic within this distance (mm) of a keep-out starts to show it. */
const NEAR_MM = 110;
/** How long a keep-out stays after the mic stops moving (ms). */
const HOLD_MS = 900;
/** The soft "you are getting close" tint: a light neutral, no hatch. */
const NEAR_TINT = '#d9dee8';

export type EnvelopeDrawn = { id: string; label: string; shape: Shape3; clearance: number; path: ReturnType<typeof Skia.Path.Make>; top: { u: number; v0: number } };

/** "the player’s hands" → "✕ KEEP CLEAR · PLAYER’S HANDS" (plain words). */
export function keepClearText(label: string): string {
  return `✕ KEEP CLEAR · ${label.replace(/^the /i, '').toUpperCase()}`;
}

/** How close (0 far … 1 touching) the shown mics' assemblies are to a shape. */
function nearness(scene: CompiledScene, shape: Shape3, clearance: number, poses: MicPose[], bodies: MicBody[]): number {
  'worklet';
  let best = 1e9;
  for (let m = 0; m < poses.length; m++) {
    const segs = assembly(scene, poses[m], bodies[m]);
    for (let i = 0; i < segs.length; i++) {
      const sg = segs[i];
      if (sg.piece === 'arm') continue;
      const dx = sg.b.x - sg.a.x;
      const dy = sg.b.y - sg.a.y;
      const dz = sg.b.z - sg.a.z;
      const n = Math.min(16, Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy + dz * dz) / 40)));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const d = sdf(shape, { x: sg.a.x + dx * t, y: sg.a.y + dy * t, z: sg.a.z + dz * t }) - sg.r - clearance;
        if (d < best) best = d;
      }
    }
  }
  return clamp(1 - best / NEAR_MM, 0, 1);
}

/**
 * ONE keep-out (a model envelope) in this view. Owner ruling 2026-10-05
 * ("too complicated… distraction"): not drawn at rest. While a mic moves
 * (`gate`), it fades in softly as the mic comes within NEAR_MM — a light
 * tint and outline, no hatch — and shows clearly in red, hatched, with its
 * plain-word reason, when the move is STOPPED by it. It fades out when the
 * mic leaves or stops moving. `pinned` (a tapped part on the meet / where-it-
 * sits pages) shows it softly at rest. The collision is unchanged: this is
 * drawing only.
 */
function EnvelopeMark({ e, rig, slots, gate, hatchPath, fadeMs, pinned }: { e: EnvelopeDrawn; rig: Rig; slots: MicSlot[]; gate: SharedValue<number>; hatchPath: ReturnType<typeof Skia.Path.Make>; fadeMs: number; pinned: boolean }) {
  const scene = rig.scene;
  const poseA = rig.pose.A;
  const poseB = rig.pose.B;
  const blockedA = rig.blocked.A;
  const blockedB = rig.blocked.B;
  const bodyA = rig.body.A;
  const bodyB = rig.body.B;
  const useA = slots.includes('A');
  const useB = slots.includes('B');
  const { shape, clearance, id } = e;
  const near = useDerivedValue(() => {
    const poses: MicPose[] = [];
    const bodies: MicBody[] = [];
    if (useA) {
      poses.push(poseA.value);
      bodies.push(bodyA);
    }
    if (useB) {
      poses.push(poseB.value);
      bodies.push(bodyB);
    }
    return poses.length ? nearness(scene, shape, clearance, poses, bodies) : 0;
  });
  const hit = useSharedValue(0);
  useAnimatedReaction(
    () => ((useA && blockedA.value?.partId === id) || (useB && blockedB.value?.partId === id) ? 1 : 0),
    (h, prev) => {
      if (h !== prev) hit.value = withTiming(h, { duration: fadeMs });
    },
    [useA, useB, id, fadeMs],
  );
  const soft = useDerivedValue(() => (pinned ? 1 : gate.value * near.value) * (1 - hit.value));
  const strong = useDerivedValue(() => gate.value * hit.value);
  const softFill = useDerivedValue(() => soft.value * 0.12);
  const softEdge = useDerivedValue(() => soft.value * 0.6);
  const hitFill = useDerivedValue(() => strong.value * 0.16);
  const hitHatch = useDerivedValue(() => strong.value * 0.4);
  const hitEdge = useDerivedValue(() => strong.value * 0.95);
  return (
    <>
      <Path path={e.path} color={NEAR_TINT} opacity={softFill} />
      <Path path={e.path} style="stroke" strokeWidth={2.5} color={NEAR_TINT} opacity={softEdge}>
        <DashPathEffect intervals={[16, 10]} />
      </Path>
      <Path path={e.path} color={RED} opacity={hitFill} />
      <Group clip={e.path}>
        <Path path={hatchPath} style="stroke" strokeWidth={2} color={RED} opacity={hitHatch} />
      </Group>
      <Path path={e.path} style="stroke" strokeWidth={3.5} color={RED} opacity={hitEdge} />
    </>
  );
}

/** The stopped keep-out's reason, in plain words, over its top edge. */
function EnvelopeReason({ e, rig, slots, gate, xf, scale, maxX, maxY }: { e: EnvelopeDrawn; rig: Rig; slots: MicSlot[]; gate: SharedValue<number>; xf: SharedValue<ViewXform>; scale: number; maxX: number; maxY: number }) {
  const text = keepClearText(e.label);
  const W = labelWidth(text, scale, maxX);
  const H = 9.5 * scale * 1.25;
  const blockedA = rig.blocked.A;
  const blockedB = rig.blocked.B;
  const useA = slots.includes('A');
  const useB = slots.includes('B');
  const id = e.id;
  const { u, v0 } = e.top;
  const style = useAnimatedStyle(() => {
    const on = (useA && blockedA.value?.partId === id) || (useB && blockedB.value?.partId === id);
    const c = xf.value;
    const x = c.ox + u * c.s;
    let y = c.oy + v0 * c.s - H - 4;
    if (y < 4) y = c.oy + v0 * c.s + 4;
    y = Math.max(4, Math.min(maxY - H - 22, y));
    const left = Math.max(2, Math.min(maxX - W - 2, x - W / 2));
    return { opacity: on ? gate.value : 0, transform: [{ translateX: left }, { translateY: y }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.label, styles.reason, { width: W }, style]}>
      <Text style={[styles.labelText, { fontSize: 9.5 * scale, textAlign: 'center', color: '#ffb3ab' }]} {...fitValue(9.5 * scale)}>
        {text}
      </Text>
    </Animated.View>
  );
}

/* ── the live readout (no React work during a drag) ──────────────────── */

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/**
 * WHY TWO PATHS (stale-readout fix, 2026-10-04). The native path is the
 * Reanimated live-number idiom: an animated TextInput whose `text` prop is
 * written on the UI thread (Reanimated 4.5.1's own PerformanceMonitor does
 * exactly this; so do vizMeters/SplMeter here). React re-renders nothing
 * during a drag (blueprint §5.1).
 *
 * On WEB that idiom only works for a single-line input: Reanimated's DOM
 * updater (js-reanimated/index.ts, `updatePropsDOM`) writes `.value` only when
 * the node is an `<input>`; any other node gets `setAttribute('text', …)`,
 * which a `<textarea>` ignores. This strip is MULTILINE (it wraps at 390 pt),
 * RN-web renders it as a `<textarea>`, and so it kept its first value forever:
 * "A · ≈ 6 cm" over a bezel reading 25 cm. On web every worklet runs on the JS
 * thread anyway, so the web path mirrors the same string into React state
 * through a reaction — one string, one formatter (readoutText.liveLine), both
 * platforms.
 */
function useLiveText(rig: Rig, slot: MicSlot) {
  const pose = rig.pose[slot];
  const blocked = rig.blocked[slot];
  const ctx = rig.ctx[slot];
  const { surfaceId, lineId } = rig.refOf(slot);
  const words = useMemo(
    () => ({ slot, ...refLabels(rig, slot), showAim: rig.body[slot].mount !== 'surface' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot, rig.lesson, surfaceId, lineId, rig.body],
  );
  return useDerivedValue(() => liveLine(withStop(deriveReadouts(ctx, pose.value, surfaceId, lineId), blocked.value), words), [ctx, pose, blocked, surfaceId, lineId, words]);
}

function LiveReadoutNative({ rig, slot, scale }: { rig: Rig; slot: MicSlot; scale: number }) {
  const text = useLiveText(rig, slot);
  const props = useAnimatedProps(() => ({ text: text.value, defaultValue: text.value }) as never, [text]);
  return (
    <AnimatedTextInput
      editable={false}
      multiline
      scrollEnabled={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      animatedProps={props}
      style={[styles.live, { fontSize: Math.max(9, 9.5 * scale) }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

function LiveReadoutWeb({ rig, slot, scale }: { rig: Rig; slot: MicSlot; scale: number }) {
  const text = useLiveText(rig, slot);
  const [shown, setShown] = useState(() => text.value);
  useAnimatedReaction(
    () => text.value,
    (t, prev) => {
      if (t !== prev) scheduleOnRN(setShown, t);
    },
    [text],
  );
  return (
    <Text style={[styles.live, styles.liveWeb, { fontSize: Math.max(9, 9.5 * scale) }]} accessibilityElementsHidden importantForAccessibility="no">
      {shown}
    </Text>
  );
}

const LiveReadout = Platform.OS === 'web' ? LiveReadoutWeb : LiveReadoutNative;

/** Height (pt) of the live strip's band: 2 lines per mic on a phone-width
 *  glass (a stop reason wraps the line), 1 on a wide one. Fixed per layout,
 *  so the fit never jumps while a finger drags. DualView parks its inset
 *  under the same band. */
export function liveReserve(count: number, w: number, textScale: number): number {
  if (!count) return 0;
  const fs = Math.max(9, 9.5 * textScale);
  const lines = w < 560 ? 2 : 1;
  // + 10: the head labels sit just above the view box, inside the fit's pad.
  return Math.ceil(10 + count * (lines * fs * 1.25 + 6));
}

/* ── the scene ───────────────────────────────────────────────────────── */

/**
 * The instrument's drawing, memoised by (view, variant) — its only props.
 * Every fader move and zone jump re-renders the page, and the instrument is
 * by far the largest subtree on the glass (hundreds of Skia nodes): without
 * this it was rebuilt on every move (measured 2026-10-06 in the web preview:
 * most of the 60–350 ms a dock-fader move cost; the "sliders not working"
 * report). One wrapper per art component, shared by every scene.
 */
const memoCache = new WeakMap<LessonArt['Instrument'], LessonArt['Instrument']>();
export function memoArt(C: LessonArt['Instrument']): LessonArt['Instrument'] {
  let m = memoCache.get(C);
  if (!m) {
    m = memo(C) as unknown as LessonArt['Instrument'];
    memoCache.set(C, m);
  }
  return m;
}

export function PlacementScene(props: PlacementSceneProps) {
  const inFull = useContext(StageInFullScreen);
  const body = <SceneBody {...props} />;
  // A Modal is its own native root on Android: a gesture inside full screen
  // needs its own Gesture Handler root (App.tsx:414-418).
  return inFull ? <GestureHandlerRootView style={{ width: props.w, height: props.h }}>{body}</GestureHandlerRootView> : body;
}

function SceneBody({ rig, art, view, w, h, interactive = true, mini = false, baseXf, avoid, boxOverride, showLabels = true, showLive = true, onCommit, accessibilityLabel, slots = ['A'], showZones = true, showPolar = true, showEnvelopes = true, pathsFrom = null, wedge = null, highlight = null, onTapPart, zoneIds, guides = false }: PlacementSceneProps) {
  const model = rig.lesson.model;
  // With no mic on the drawing (the parts, the instrument alone) the scene
  // fits the instrument's own CONTENT FRAME, not the generous authored box
  // (owner 2026-10-06: "too small, there is more room"); with mics, the
  // authored box, inside which a mic may be moved (geometry/contentFrame.ts).
  const anyMic = slots.length > 0 || !!wedge || !!pathsFrom;
  const authoredBox = viewsOf(model, rig.variant)[view]!;
  const box = boxOverride ?? sceneFrame(rig.lesson.model, rig.variant, view, anyMic) ?? authoredBox;
  const textScale = useStageTextScale();
  // Part labels keep the size they have at the full screen's 1× while a zoom
  // step enlarges the drawing, so more of them find clear space as the
  // learner zooms in (level of detail, owner 2026-10-06); never under 9 pt.
  const labelScale = Math.max(1, textScale / useStageZoom());
  const viewTag = copyOf(rig.lesson).viewTag[view];
  // The live strip owns a band at the top: the drawing is fitted BELOW it, so
  // the strip never sits on the heads or their labels (layout pass 2026-10-04).
  const liveCount = !mini && interactive && showLive ? rig.mics.filter((m) => slots.includes(m.slot) && m.on).length : 0;
  // (A caller that passes `baseXf` — DualView's full-screen pair — fits the
  // same band itself, so the tag and the strip sit in it either way.)
  const reserveTop = liveReserve(liveCount, w, textScale);
  const base = useMemo(() => {
    if (baseXf) return baseXf;
    const f = fitXform(view, box, w, h - reserveTop, mini ? 2 : PAD);
    return { ...f, oy: f.oy + reserveTop };
  }, [baseXf, view, box, w, h, mini, reserveTop]);
  const xf = useSharedValue<ViewXform>(base);
  useEffect(() => {
    xf.value = base;
  }, [base, xf]);
  const lock = useScrollLock();
  const setLock = useCallback((v: boolean) => lock?.(v), [lock]);
  const variant: VariantId = rig.variant;

  const matrix = useDerivedValue(() => [{ translateX: xf.value.ox }, { translateY: xf.value.oy }, { scale: xf.value.s }]);

  // ── the drag ──
  const grab = useSharedValue('');
  const startPose = useSharedValue<MicPose>({ p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 });
  const startTouch = useSharedValue({ x: 0, y: 0 });
  const pinchStart = useSharedValue<ViewXform>(base);
  const pinchFocal = useSharedValue({ x: 0, y: 0 });
  const scene = rig.scene;
  const bounds = rig.bounds;
  const bodies = rig.body;
  const pins = rig.pin;
  const poseA = rig.pose.A;
  const poseB = rig.pose.B;
  const blockedA = rig.blocked.A;
  const blockedB = rig.blocked.B;
  const lenA = bodies.A.length;
  const lenB = bodies.B.length;
  const rA = bodies.A.radius;
  const rB = bodies.B.radius;
  const surfA = bodies.A.mount === 'surface';
  const surfB = bodies.B.mount === 'surface';
  // Plain data for the worklets: the model's aim home (the guitars), or null.
  const home = model.aimHome ? { az: model.aimHome.az, el: model.aimHome.el } : null;
  const live = slots;
  const azLimit = model.aimAzLimit ?? 80;
  const hasB = live.includes('B');
  const hasA = live.includes('A');

  const finish = useCallback(
    (slot: string) => {
      const s = (slot.charAt(0) === 'B' ? 'B' : 'A') as MicSlot;
      rig.commit(s);
      onCommit?.(s);
    },
    [rig, onCommit],
  );
  const tapAt = useCallback(
    (x: number, y: number) => {
      if (!onTapPart) return;
      const cur = xf.value;
      const u = (x - cur.ox) / cur.s;
      const v = (y - cur.oy) / cur.s;
      const id = art.hitTest(view, variant, u, v, 22 / cur.s);
      if (id) onTapPart(id);
    },
    [onTapPart, xf, art, view, variant],
  );

  const gesture = useMemo(() => {
    const hitMic = (tx: number, ty: number): string => {
      'worklet';
      const cur = xf.value;
      const test = (slot: string, ps: MicPose, len: number, r: number, surf: boolean): string => {
        const aim = aimVec(ps.az, surf ? 0 : ps.el);
        const f = project(cur, ps.p);
        const tail = { x: ps.p.x - aim.x * len, y: ps.p.y - aim.y * len, z: ps.p.z - aim.z * len };
        const t = project(cur, tail);
        if (!surf) {
          const kk = len + RING_OFFSET_PX / cur.s;
          const ringP = { x: ps.p.x - aim.x * kk, y: ps.p.y - aim.y * kk, z: ps.p.z - aim.z * kk };
          const rg = project(cur, ringP);
          const dr = Math.sqrt((tx - rg.sx) * (tx - rg.sx) + (ty - rg.sy) * (ty - rg.sy));
          // A model with an aim home (the guitars): a mic seen nearly END-ON
          // has its ring on top of its body — the touch MOVES it (aim it in
          // the other view or with the dock).
          const endOn = !!home && Math.sqrt((rg.sx - f.sx) * (rg.sx - f.sx) + (rg.sy - f.sy) * (rg.sy - f.sy)) < RING_R_PX * 2 + 8;
          if (dr <= RING_R_PX + 8 && !endOn) return `${slot}.aim`;
        }
        const vx = t.sx - f.sx;
        const vy = t.sy - f.sy;
        const ll = vx * vx + vy * vy;
        let k = ll > 1e-9 ? ((tx - f.sx) * vx + (ty - f.sy) * vy) / ll : 0;
        k = clamp(k, 0, 1);
        const dx = tx - (f.sx + vx * k);
        const dy = ty - (f.sy + vy * k);
        return Math.sqrt(dx * dx + dy * dy) <= Math.max(22, r * cur.s + 6) ? slot : '';
      };
      if (hasB) {
        const b = test('B', poseB.value, lenB, rB, surfB);
        if (b) return b;
      }
      if (hasA) return test('A', poseA.value, lenA, rA, surfA);
      return '';
    };

    const pan = Gesture.Pan()
      .enabled(interactive && !mini)
      .maxPointers(1)
      .manualActivation(true)
      .onTouchesDown((e, mgr) => {
        'worklet';
        const t = e.changedTouches[0];
        if (!t || e.numberOfTouches > 1) {
          mgr.fail();
          return;
        }
        const hit = hitMic(t.x, t.y);
        if (!hit) {
          mgr.fail();
          return;
        }
        grab.value = hit;
        startTouch.value = { x: t.x, y: t.y };
        startPose.value = hit.charAt(0) === 'B' ? poseB.value : poseA.value;
        mgr.activate();
      })
      .onStart(() => {
        'worklet';
        scheduleOnRN(setLock, true);
      })
      .onUpdate((e) => {
        'worklet';
        const g = grab.value;
        if (!g) return;
        const isB = g.charAt(0) === 'B';
        const sv = isB ? poseB : poseA;
        const body = isB ? bodies.B : bodies.A;
        const pin = isB ? pins.B : pins.A;
        const st = startPose.value;
        const cur = xf.value;
        let to: MicPose;
        if (g.length > 1) {
          // AIM: the ring sits behind the mic, so the mic points AWAY from the finger.
          const f = project(cur, st.p);
          const ax = f.sx - e.x;
          const ay = f.sy - e.y;
          if (Math.abs(ax) + Math.abs(ay) < 2) return;
          if (view === 'side') {
            // |cos az| and its sign keep a mic turned to face +x (az near
            // 180°, a mic behind an open-backed cabinet) tilting the right way;
            // for |az| < 90° this is the original formula.
            const c = Math.cos((st.az * Math.PI) / 180);
            const el = (Math.atan2(-ay * Math.abs(c), c < 0 ? ax : -ax) * 180) / Math.PI;
            to = { p: st.p, az: st.az, el: clamp(el, -80, 80) };
          } else if (home) {
            // Turn about the model's aim home (unwrapped toward the current aim).
            let az = (Math.atan2(ay, -ax) * 180) / Math.PI;
            while (az - st.az > 180) az -= 360;
            while (az - st.az < -180) az += 360;
            to = { p: st.p, az: clamp(az, home.az - 80, home.az + 80), el: st.el };
          } else {
            let az = (Math.atan2(ay, -ax) * 180) / Math.PI;
            // Unwrap toward the current aim, then hold the model's limit
            // (±80° unless the lesson allows a mic to face the other way).
            while (az - st.az > 180) az -= 360;
            while (az - st.az < -180) az += 360;
            to = { p: st.p, az: clamp(az, -azLimit, azLimit), el: st.el };
          }
        } else {
          const d = unprojectDelta(cur, e.x - startTouch.value.x, e.y - startTouch.value.y);
          to = { p: { x: st.p.x + d.x, y: st.p.y + d.y, z: st.p.z + d.z }, az: st.az, el: st.el };
          if (pin) to = pinToSurface(to, pin.top, body, pin.halfWidth);
        }
        const r = constrainMove(scene, body, sv.value, to, bounds);
        sv.value = r.pose;
        (isB ? blockedB : blockedA).value = r.blocked;
      })
      .onFinalize(() => {
        'worklet';
        const g = grab.value;
        if (!g) return;
        grab.value = '';
        scheduleOnRN(setLock, false);
        scheduleOnRN(finish, g);
      });

    const pinch = Gesture.Pinch()
      .enabled(!mini)
      .onStart((e) => {
        'worklet';
        pinchStart.value = xf.value;
        pinchFocal.value = { x: e.focalX, y: e.focalY };
      })
      .onUpdate((e) => {
        'worklet';
        const s0 = pinchStart.value;
        const k = clamp(e.scale, base.s / s0.s, (base.s * MAX_ZOOM) / s0.s);
        xf.value = zoomAbout(s0, k, pinchFocal.value.x, pinchFocal.value.y, e.focalX - pinchFocal.value.x, e.focalY - pinchFocal.value.y);
      });

    const reset = Gesture.Tap()
      .enabled(!mini)
      .numberOfTaps(2)
      .onEnd(() => {
        'worklet';
        xf.value = base;
      });
    const tap = Gesture.Tap()
      .enabled(!mini && !!onTapPart)
      .onEnd((e) => {
        'worklet';
        scheduleOnRN(tapAt, e.x, e.y);
      });
    return Gesture.Simultaneous(pinch, Gesture.Exclusive(pan, reset, tap));
  }, [xf, hasA, hasB, poseA, poseB, lenA, lenB, rA, rB, surfA, surfB, interactive, mini, grab, startTouch, startPose, setLock, bodies, pins, view, scene, bounds, blockedA, blockedB, finish, pinchStart, pinchFocal, base, onTapPart, tapAt, azLimit, home?.az, home?.el]);

  // ── what is drawn ──
  const zoneKey = zoneIds ? zoneIds.join('|') : '';
  const zones = useMemo(() => {
    if (!showZones) return [];
    if (zoneKey) {
      const only = zoneKey.split('|');
      return rig.lesson.zones.filter((z) => only.includes(z.id));
    }
    const ids = new Set<string>();
    for (const s of live) {
      const m = rig.mics.find((q) => q.slot === s);
      if (!m) continue;
      for (const z of zonesAvailable(rig.lesson.zones, variant, m.typeId, micType(m.typeId).mount)) ids.add(z.id);
    }
    return rig.lesson.zones.filter((z) => ids.has(z.id));
  }, [showZones, live, rig.mics, rig.lesson.zones, variant, zoneKey]);
  const ctxA = rig.ctx.A;
  const surfaceId = rig.surfaceId;
  const lineId = rig.lineId;
  const zoneA = useDerivedValue(() => deriveReadouts(ctxA, poseA.value, surfaceId, lineId).zoneId);
  // Keep-outs (owner ruling 2026-10-05): built for every scene that may show
  // them, DRAWN only on approach / on a stop (EnvelopeMark). A mini inset
  // never shows them.
  const envelopes = useMemo<EnvelopeDrawn[]>(() => {
    if (!showEnvelopes || mini) return [];
    const out: EnvelopeDrawn[] = [];
    const add = (id: string, label: string, shape: Shape3, clearance: number) => {
      const path = shapeOutline(shape, view);
      if (!path) return;
      const b = path.getBounds();
      out.push({ id, label, shape, clearance, path, top: { u: b.x + b.width / 2, v0: b.y } });
    };
    for (const e of model.envelopes as Envelope[]) {
      if (e.variants && !e.variants.includes(variant)) continue;
      add(e.id, e.label, e.shape, e.clearance ?? 0);
    }
    // A moving PART that is a path through the air (the bow's, a hand's) is a
    // keep-out too: the lesson art used to hatch it at rest.
    for (const p of model.parts) {
      if (!p.moving || !p.solid || !/’s path$/.test(p.label)) continue;
      if (p.variants && !p.variants.includes(variant)) continue;
      add(p.id, p.label, p.solid, p.clearance?.mm ?? 0);
    }
    return out;
  }, [showEnvelopes, mini, model.envelopes, model.parts, variant, view]);
  const hatchPath = useMemo(() => hatch(box), [box]);
  // The gate: 1 while a mic moves (a drag here, a fader, a jump, the other
  // view's drag), held HOLD_MS after it stops, then faded out. Nothing is
  // drawn at rest. Reduced motion / Low-Light: no fades, the same holds.
  const motion = useDecorativeMotion();
  const fadeIn = motion ? 160 : 0;
  const fadeOut = motion ? 420 : 0;
  const gate = useSharedValue(0);
  useAnimatedReaction(
    () => {
      const a = poseA.value;
      const b = poseB.value;
      return { g: grab.value !== '', k: `${a.p.x}|${a.p.y}|${a.p.z}|${a.az}|${a.el}|${b.p.x}|${b.p.y}|${b.p.z}|${b.az}|${b.el}` };
    },
    (cur, prev) => {
      if (!prev) return;
      if (cur.g) {
        if (!prev.g) gate.value = withTiming(1, { duration: fadeIn });
        return;
      }
      if (prev.g || cur.k !== prev.k) gate.value = withSequence(withTiming(1, { duration: fadeIn }), withDelay(HOLD_MS, withTiming(0, { duration: fadeOut })));
    },
    [fadeIn, fadeOut],
  );
  const lobeOpacity = useDerivedValue(() => gate.value);
  const micsOn = rig.mics.some((m) => live.includes(m.slot) && m.on);
  // STARTING SETUPS: each mic's dimension and aim (geometry/guides.ts), from
  // the committed poses (the setups drawing is not dragged). The dimension's
  // words sit beside its middle, on the side away from the drawing's centre.
  const guideKey = guides && !mini ? rig.mics.filter((m) => live.includes(m.slot) && m.on).map((m) => `${m.slot}:${m.pose.p.x},${m.pose.p.y},${m.pose.p.z},${m.pose.az},${m.pose.el}:${rig.refOf(m.slot).surfaceId}`).join(';') : '';
  const guideData = useMemo(() => {
    if (!guideKey) return [];
    const cu = (box.u0 + box.u1) / 2;
    const cv = (box.v0 + box.v1) / 2;
    const raw = rig.mics
      .filter((m) => live.includes(m.slot) && m.on)
      .map((m) => {
        const s = model.surfaces.find((q) => q.id === rig.refOf(m.slot).surfaceId);
        if (!s) return null;
        const g = guideFor(s, m.pose);
        const pr = projected(g, view);
        const text = fmtLen(g.distance);
        const W = labelWidth(text, textScale, w);
        const H = 9.5 * textScale * 1.25;
        // The label's anchor (mm) and the screen direction it steps out to.
        const mu = (pr.u0 + pr.u1) / 2;
        const mv = (pr.v0 + pr.v1) / 2;
        const short = pr.len * base.s < 18;
        let nx = pr.len > 1e-6 ? -(pr.v1 - pr.v0) / pr.len : 0;
        let ny = pr.len > 1e-6 ? (pr.u1 - pr.u0) / pr.len : -1;
        if (nx * (mu - cu) + ny * (mv - cv) < 0) {
          nx = -nx;
          ny = -ny;
        }
        const au = short ? pr.u0 : mu;
        const av = short ? pr.v0 : mv;
        const px = base.ox + au * base.s + nx * (W / 2 + 6);
        const py = base.oy + av * base.s + ny * (H / 2 + 6);
        return { slot: m.slot, g, pr, short, text, W, H, au, av, nx, ny, rect: { x0: px - W / 2, x1: px + W / 2, y0: py - H / 2, y1: py + H / 2 } };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
    // A pair's two dimensions side by side (the piano's spaced pair): a label
    // that would sit on the other's steps to the far side of its own line;
    // if it still collides and says the same, it is not printed twice.
    const hits = (a: { x0: number; x1: number; y0: number; y1: number }, b: typeof a) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    const out: (typeof raw[number] & { hide?: boolean })[] = [];
    for (const d of raw) {
      let cur: typeof raw[number] & { hide?: boolean } = d;
      if (out.some((o) => !o.hide && hits(o.rect, cur.rect))) {
        const nx = -d.nx;
        const ny = -d.ny;
        const px = base.ox + d.au * base.s + nx * (d.W / 2 + 6);
        const py = base.oy + d.av * base.s + ny * (d.H / 2 + 6);
        const flipped = { ...d, nx, ny, rect: { x0: px - d.W / 2, x1: px + d.W / 2, y0: py - d.H / 2, y1: py + d.H / 2 } };
        if (!out.some((o) => !o.hide && hits(o.rect, flipped.rect))) cur = flipped;
        else if (out.some((o) => !o.hide && o.text === d.text)) cur = { ...d, hide: true };
      }
      out.push(cur);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- by the poses' key
  }, [guideKey, view, box, base, textScale, w, model.surfaces]);
  // Part labels only where the drawing is big enough to carry them (a short
  // landscape glass drew them on top of each other); full screen always has them.
  const labels = useMemo(() => {
    if (mini || !showLabels || base.s < (model.labelMinScale ?? LABEL_MIN_S)) return [];
    // The lesson's own keep-off rectangles (its zones), in px at the fit.
    const obstacles = showZones && art.labelObstacles ? art.labelObstacles(view, variant, zones.map((z) => z.id)).map((r) => ({ x0: base.ox + r.u0 * base.s, x1: base.ox + r.u1 * base.s, y0: base.oy + r.v0 * base.s, y1: base.oy + r.v1 * base.s })) : undefined;
    // With mics on the drawing (placement, two mics), a bare "PLAYER" over
    // the drawn figure only adds words to the picture (clarity pass
    // 2026-10-05); an off-glass pointer ("← PLAYER") stays.
    const own = art.labels(view, variant).filter((l) => !(micsOn && l.id === 'player' && l.text === 'PLAYER'));
    // The view's tag in the bottom-left corner ("SIDE · CUTAWAY") is words
    // too: a label never sits on it.
    const tagText = model.viewTags?.[view] ?? viewTag;
    const tagFs = Math.max(9, 9 * textScale);
    const tag = { x0: 0, y0: h - tagFs * 1.4 - 4, x1: 8 + tagText.length * (tagFs * 0.6 + 1.2), y1: h };
    // Level of detail (artLabels.ts): only labels that find clear space — off
    // the drawing, off each other, on the glass below the live strip.
    return layoutArtLabels(art, view, variant, authoredBox, base, labelScale, w, h, { avoid, obstacles: [...(obstacles ?? []), tag, ...guideData.map((g) => g.rect)], minY: reserveTop + 1, labels: own, model });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the rect by value (DualView makes a new object each render)
  }, [mini, showLabels, showZones, zones, art, view, variant, base, labelScale, textScale, viewTag, w, h, reserveTop, authoredBox, model, micsOn, guideData, avoid?.x0, avoid?.y0, avoid?.x1, avoid?.y1]);
  const Instrument = memoArt(art.Instrument);
  const highlightPath = useMemo(() => {
    if (!highlight) return null;
    const part = model.parts.find((p) => p.id === highlight);
    // A part that cannot be seen from this view (a marimba's tubes under its
    // bars, from above) gets no marker here: it would ring the part in front.
    if (part?.hiddenIn?.includes(view)) return null;
    const region = model.regions.find((r) => r.partId === highlight);
    const p = Skia.Path.Make();
    // A named part drawn as several solids (the resonator tubes, in groups):
    // ring the solids themselves, never a point where the part meets another.
    if (part && !part.solid) {
      const kids = model.parts.filter((q) => q.id.startsWith(`${part.id}.`) && q.solid && (!q.variants || q.variants.includes(variant)) && !q.hiddenIn?.includes(view));
      for (const k of kids) {
        const o = shapeOutline(k.solid!, view);
        if (o) p.addPath(o);
      }
      if (kids.length) return p;
    }
    const sol = part?.solid;
    if (sol && (sol.kind === 'slab' || sol.kind === 'tube')) {
      const q = cylinderRect(sol, view);
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(q.u0 - 14, q.v0 - 14, q.u1 - q.u0 + 28, q.v1 - q.v0 + 28), 10, 10));
      return p;
    }
    if (sol) {
      const o = shapeOutline(sol, view);
      if (o) return o;
    }
    if (region) p.addCircle(region.anchor.x, view === 'side' ? region.anchor.y : region.anchor.z, 70);
    return region ? p : null;
  }, [highlight, model, view, variant]);

  const micsShown = rig.mics.filter((m) => live.includes(m.slot) && m.on);
  const labelBoxes = useMemo<LabelBox[] | null>(() => (art.labelsYieldToMic ? labels.map((l) => ({ u: l.u, v: l.v, W: labelWidth(l.text, labelScale, w), align: l.align })) : null), [art.labelsYieldToMic, labels, labelScale, w]);
  // The mics the part labels step back from (opt-in per lesson).
  const shownKey = micsShown.map((m) => `${m.slot}:${m.typeId}`).join(',');
  const yieldTo = useMemo<MicYield>(
    () => (art.labelsYieldToMic ? { poses: micsShown.map((m) => rig.pose[m.slot]), lens: micsShown.map((m) => micType(m.typeId).body.length.mm), surf: micsShown.map((m) => micType(m.typeId).mount === 'surface') } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- by the shown mics' slots and types
    [art.labelsYieldToMic, shownKey, rig.pose],
  );

  const canvas = (
    <View style={{ width: w, height: h }}>
      {/* Android gesture nav: a mic dragged at the stage's edge must not start
          the system back gesture (modules/ape-gesture-exclusion; renders
          nothing on iOS, web and builds without the module). */}
      {!mini && interactive ? <GestureExclusionZone maxHeightDp={STAGE_BAND_DP} /> : null}
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={matrix}>
          {/* The art's own keep-out shapes stay off this drawing (keepOuts.ts). */}
          <KeepOutsAtRest.Provider value={false}>
            <Instrument view={view} variant={variant} />
          </KeepOutsAtRest.Provider>
          <LeaderLines labels={labels} xf={xf} scale={labelScale} maxX={w} />
          {envelopes.map((e) => (
            <EnvelopeMark key={e.id} e={e} rig={rig} slots={micsShown.map((m) => m.slot)} gate={gate} hatchPath={hatchPath} fadeMs={fadeIn} pinned={highlight === e.id} />
          ))}
          {zones.map((z) => (
            <ZoneBand key={z.id} z={z} rig={rig} view={view} zoneSV={zoneA} />
          ))}
          {highlightPath ? <Path path={highlightPath} style="stroke" strokeWidth={7} color={AMBER} /> : null}
          {pathsFrom ? <PathsOverlay rig={rig} view={view} from={pathsFrom} /> : null}
          {wedge ? (
            <>
              <Line p1={vec(rig.mics[0]?.pose.p.x ?? 0, vOf(view, rig.mics[0]?.pose.p ?? wedge.src))} p2={vec(wedge.src.x, vOf(view, wedge.src))} color={AMBER} strokeWidth={5} opacity={0.8}>
                <DashPathEffect intervals={[30, 20]} />
              </Line>
              {wedge.glyph !== 'none' ? <WedgeGlyph at={wedge.at} view={view} faces={wedge.faces} /> : <Circle cx={wedge.src.x} cy={vOf(view, wedge.src)} r={16} style="stroke" strokeWidth={5} color={AMBER} />}
            </>
          ) : null}
          {micsShown.map((m) => (
            <MountPath key={`mount:${m.slot}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} />
          ))}
          {micsShown.map((m) => (
            <ClampArm key={`clamp:${m.slot}:${m.typeId}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} />
          ))}
          {showPolar
            ? micsShown.map((m) => <PolarSlice key={`polar:${m.slot}:${m.pattern}`} pose={rig.pose[m.slot]} view={view} pattern={m.pattern} />)
            : null}
          {guideData.map((d) => (
            <SetupGuide key={`guide:${d.slot}`} g={d.g} view={view} xf={xf} dashMm={10 / base.s} drawDim={!d.short} />
          ))}
          {micsShown.map((m) => (
            <MicGlyph key={`mic:${m.slot}:${m.typeId}`} pose={rig.pose[m.slot]} view={view} typeId={m.typeId} blocked={rig.blocked[m.slot]} focus={interactive && !mini} xf={xf} />
          ))}
        </Group>
      </Canvas>
      {labels.map((l) => (
        <SceneLabel key={l.id} xf={xf} u={l.u} v={l.v} text={l.text} align={l.align} tone={l.tone} scale={labelScale} maxX={w} yieldTo={yieldTo} view={view} />
      ))}
      {guideData.filter((d) => !d.hide).map((d) => (
        <GuideLabel key={`gl:${d.slot}`} xf={xf} u={d.au} v={d.av} nx={d.nx} ny={d.ny} W={d.W} H={d.H} text={d.text} scale={textScale} maxX={w} maxY={h} />
      ))}
      {showPolar && !mini && showLabels
        ? micsShown.filter((m) => isModelled(m.pattern)).slice(0, 1).map((m) => <LobeTag key={`lobe:${m.slot}`} pose={rig.pose[m.slot]} view={view} xf={xf} scale={textScale} maxX={w} maxY={h} labelBoxes={labelBoxes} shown={lobeOpacity} avoid={avoid ?? null} />)
        : null}
      {envelopes.map((e) => (
        <EnvelopeReason key={`why:${e.id}`} e={e} rig={rig} slots={micsShown.map((m) => m.slot)} gate={gate} xf={xf} scale={textScale} maxX={w} maxY={h} />
      ))}
      {!mini && interactive && showLive ? (
        <View pointerEvents="none" style={styles.liveWrap}>
          {micsShown.map((m) => (
            // Driven by the pose shared value on every path (drag, fader, zone
            // jump, type change): no remount needed (see useLiveText).
            <LiveReadout key={`live:${m.slot}`} rig={rig} slot={m.slot} scale={textScale} />
          ))}
        </View>
      ) : null}
      {!mini ? (
        <Text pointerEvents="none" style={[styles.viewTag, { fontSize: Math.max(9, 9 * textScale) }]}>
          {rig.lesson.model.viewTags?.[view] ?? viewTag}
        </Text>
      ) : null}
    </View>
  );
  if (mini) return canvas;
  return <GestureDetector gesture={gesture}>{canvas}</GestureDetector>;
}

/** A floor monitor wedge (generic), standing on the floor at `at`, its
 *  sloped baffle facing `faces` (plan: rotated; side: mirrored). */
function WedgeGlyph({ at, view, faces }: { at: Vec3; view: ViewId; faces: Vec3 }) {
  const u = at.x;
  const v = vOf(view, at);
  const ang = Math.atan2(faces.z, faces.x);
  const flip = view === 'side' && faces.x < 0 ? -1 : 1;
  const cab = useMemo(() => {
    const p = Skia.Path.Make();
    if (view === 'top') {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(-150, -280, 300, 560), 18, 18));
    } else {
      p.moveTo(-170, 0);
      p.lineTo(170, 0);
      p.lineTo(170, -120);
      p.lineTo(-60, -330);
      p.lineTo(-170, -330);
      p.close();
    }
    return p;
  }, [view]);
  // Seen from above, a floor wedge shows its short top panel (back, −x) and
  // its large sloped baffle (front, +x, facing the mic) behind a perforated
  // grille; a hand recess in the top. Generic: no brand, no claimed size.
  const parts = useMemo(() => {
    const grille = Skia.Path.Make();
    const holes = Skia.Path.Make();
    const recess = Skia.Path.Make();
    const corners = Skia.Path.Make();
    const driver = Skia.Path.Make();
    if (view === 'top') {
      grille.addRRect(Skia.RRectXY(Skia.XYWHRect(-40, -258, 176, 516), 14, 14));
      for (let x = -26; x < 128; x += 20) for (let z = -244; z < 250; z += 20) holes.addCircle(x, z, 4.2);
      recess.addRRect(Skia.RRectXY(Skia.XYWHRect(-128, -70, 50, 140), 14, 14));
      for (const [cx, cz] of [
        [-150, -280],
        [150, -280],
        [-150, 280],
        [150, 280],
      ] as const)
        corners.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 22, cz - 22, 44, 44), 9, 9));
      driver.addCircle(48, -70, 118);
    } else {
      grille.moveTo(160, -128);
      grille.lineTo(-52, -318);
    }
    return { grille, holes, recess, corners, driver };
  }, [view]);
  return (
    <Group transform={[{ translateX: u }, { translateY: v }, { rotate: view === 'top' ? ang : 0 }, { scaleX: flip }]}>
      <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
        <Path path={cab} color="#000" opacity={0.6}>
          <BlurMask blur={22} style="normal" />
        </Path>
      </Group>
      <Path path={cab}>
        <LinearGradient start={vec(-150, -280)} end={vec(150, 280)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      {view === 'top' ? (
        <>
          <Path path={parts.grille} color="#0c0d10" />
          <Path path={parts.driver} style="stroke" strokeWidth={5} color="#2a2c32" opacity={0.9} />
          <Path path={parts.holes} color="#4a4e57" opacity={0.9} />
          <Path path={parts.grille}>
            <RadialGradient c={vec(-20, -200)} r={420} colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']} />
          </Path>
          <Path path={parts.grille} style="stroke" strokeWidth={3} color="#5d616c" />
          <Path path={parts.recess} color="#0e0f12" />
          <Path path={parts.recess} style="stroke" strokeWidth={2} color="#4a4e57" />
          <Path path={parts.corners} color="#101114" />
          <Path path={parts.corners} style="stroke" strokeWidth={2} color="#6c717c" />
        </>
      ) : (
        <Path path={parts.grille} style="stroke" strokeWidth={14} color="#0c0d10" />
      )}
      <Path path={cab} style="stroke" strokeWidth={4} color="#70747f" opacity={0.9} />
    </Group>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', left: 0, top: 0 },
  guideLabel: { backgroundColor: 'rgba(8,8,10,0.72)', borderRadius: 4 },
  // A dark halo keeps a label legible where it crosses a boom or a hoop
  // (the drawing stays visible around it — no opaque backing).
  labelText: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } },
  liveWrap: { position: 'absolute', left: 4, right: 4, top: 4, gap: 2 },
  live: {
    color: '#e8eaee',
    fontFamily: fonts.oswaldMedium,
    letterSpacing: 0.3,
    padding: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(12,12,15,0.72)',
    borderRadius: 6,
    includeFontPadding: false,
  },
  // A stopped keep-out's reason: a dark backing so it reads over any art.
  reason: { backgroundColor: 'rgba(12,12,15,0.78)', borderRadius: 5, paddingVertical: 1 },
  // Web: the backing hugs the words (a full-width band hid the head labels).
  liveWeb: { alignSelf: 'flex-start', maxWidth: '100%' },
  viewTag: { position: 'absolute', left: 6, bottom: 3, color: colors.textMuted, fontFamily: fonts.oswaldMedium, letterSpacing: 1.2 },
});

