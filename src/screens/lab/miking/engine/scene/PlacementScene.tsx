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
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Paint, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { Wedge2WayTop } from '../../lessons/shared/wedge2Way';
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
import { assembly, CLIP_REACH, constrainMove, pinToSurface, POLE_RADIUS, type Blocked } from '../geometry/collision.ts';
import { elbowOf, gooseneckPts, heldElbowOf, heldFist } from '../geometry/arm.ts';
import { deriveReadouts } from '../geometry/readouts.ts';
import { zonesAvailable } from '../geometry/zones.ts';
import { gain, isModelled } from '../physics/polar.ts';
import { shotgunLobe } from '../physics/shotgun.ts';
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
  /** Only these suggested starting points are drawn (a STARTING SETUPS
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

function MicGlyph({ pose, view, typeId, blocked, focus, xf, hk = 1 }: { pose: SharedValue<MicPose>; view: ViewId; typeId: string; blocked: SharedValue<Blocked>; focus: boolean; xf: SharedValue<ViewXform>; /* lab6 group 2: hardwareScale */ hk?: number }) {
  const t = micType(typeId);
  const len = t.body.length.mm;
  const r = t.body.radius.mm;
  // lab6 group 1: a body reaching ahead of its reference point (a shotgun's tube).
  const fore = t.body.fore?.mm ?? 0;
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
    return [{ translateX: p.p.x }, { translateY: vOf(view, p.p) }, { rotate: ang }, { scale: hk }, { scaleY: fore }, { translateX: surface && view === 'side' ? -r : 0 }];
  });
  const redOpacity = useDerivedValue(() => (blocked.value ? 0.95 : 0));
  const ring = useDerivedValue(() => {
    const p = pose.value;
    const k = len * hk + RING_OFFSET_PX / xf.value.s;
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
        <MikingMicArt art={t.art} r={r} len={len} cross={cross} fore={fore} />
        {t.pop ? <PopHoop pop={t.pop} /> : null}
        {/* Collision: a red outline + the scene's ✕ label (colour never alone). */}
        <Path path={outlineOf(len, cross, fore)} style="stroke" strokeWidth={5} color={RED} opacity={redOpacity} />
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
function outlineOf(len: number, cross: number, fore = 0) {
  const k = `${len}:${cross}:${fore}`;
  let p = outlineCache.get(k);
  if (!p) {
    p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-cross / 2 - 4, -fore - 4, cross + 8, len + fore + 8), 8, 8));
    outlineCache.set(k, p);
  }
  return p;
}

/* ── per-mic overlays ────────────────────────────────────────────────── */

/*
 * THE TRIPOD'S TURN (owner 2026-10-10: "on M04a/b/c and M05 a leg runs
 * under the drum and the player's legs; on two-stand pages one stand's leg
 * crosses the other's hub"). A real tripod boom stand: three legs at 120°,
 * feet on a 250–350 mm radius, the hub collar about 190 mm up. The turn is
 * chosen, not fixed: every 10° of the 120° cycle, at the full 300 mm spread
 * and then (only if nothing clean is found) 275 and 250 mm, each leg is walked
 * from the hub to its foot and scored by how far it enters any solid of the
 * scene (the instrument, the player's keep-out — never the floor) and how
 * close it comes to another stand's base; the clean turn nearest to "two
 * legs straddling the boom, one back under the counterweight" wins.
 * Drawing only: the stand's base, the mic and every keep-out are unchanged.
 */
const TRIPOD_HUB = 190;
function tripodTurn(scene: CompiledScene, base: Vec3, others: readonly Vec3[], boomDir: { x: number; z: number } | null): { a0: number; R: number } {
  'worklet';
  // The preferred turn: two legs straddling the boom at ±60°, the third
  // straight back under the counterweight — no leg runs out under the boom
  // toward the instrument the mic is on (seen from the side it would cross
  // the instrument's foot).
  const pref = boomDir && (boomDir.x !== 0 || boomDir.z !== 0) ? Math.atan2(boomDir.z, boomDir.x) + Math.PI / 3 : Math.PI / 6;
  let best = { a0: pref, R: 300, pen: Infinity, off: Infinity };
  const radii = [300, 275, 250];
  for (let ri = 0; ri < radii.length; ri++) {
    const R = radii[ri];
    for (let k = 0; k < 12; k++) {
      const a0 = pref + (k * Math.PI) / 18;
      let pen = 0;
      for (let leg = 0; leg < 3; leg++) {
        const a = a0 + (leg * 2 * Math.PI) / 3;
        const cx = Math.cos(a);
        const cz = Math.sin(a);
        for (let t = 0.25; t <= 1.0001; t += 0.25) {
          // Seen from above a leg must not run under anything either: each
          // point on it is tested up a column to 1 m (an instrument's
          // overhanging head, a player's knees), not only at the leg itself.
          for (let hi = 0; hi < 4; hi++) {
            const lift = hi === 0 ? TRIPOD_HUB * (1 - t) + 8 : hi === 1 ? 250 : hi === 2 ? 600 : 1000;
            const q = { x: base.x + cx * R * t, y: base.y - lift, z: base.z + cz * R * t };
            for (let i = 0; i < scene.solids.length; i++) {
              const so = scene.solids[i];
              if (so.shape.kind === 'floor') continue;
              const d = sdf(so.shape, q) - 8;
              if (d < 0) pen += (hi === 0 ? 3 : 1) * (50 - d);
            }
          }
          const q = { x: base.x + cx * R * t, y: base.y - 8, z: base.z + cz * R * t };
          for (let j = 0; j < others.length; j++) {
            const dx = q.x - others[j].x;
            const dz = q.z - others[j].z;
            const dd = Math.sqrt(dx * dx + dz * dz);
            if (dd < 160) pen += 160 - dd;
            // …and not run across the other stand's own legs: keep out of its footprint.
            if (dd < R + 40 && t > 0.5) pen += 0.2 * (R + 40 - dd);
          }
        }
      }
      // The turn's distance from the preferred one (0 at k = 0, the cycle's ends).
      const off = Math.min(k, 12 - k);
      if (pen < best.pen - 1e-6 || (Math.abs(pen - best.pen) <= 1e-6 && off < best.off)) best = { a0, R, pen, off };
    }
    if (best.pen === 0) break;
  }
  return { a0: best.a0, R: best.R };
}

/**
 * The mic's mount — a real boom stand, drawn from the SAME capsules the
 * collision uses (`assembly`), so the placement geometry and the keep-outs
 * are unchanged (art pass 2026-10-10; it was a single stick on a flat bar).
 * Real dimensions (mm), a common tripod boom stand:
 *   lower tube Ø 25, upper (height) tube Ø 19, a height clutch Ø 34 × 36
 *   with its wing knob ≈ 480 above the floor (lower on a short stand);
 *   a TRIPOD base: three legs Ø 14 from a collar near the bottom of the
 *   tube, braced from a sliding collar, spread ≈ Ø 400 on a short (kick /
 *   amp) stand to ≈ Ø 620 on a full one, rubber feet;
 *   the boom Ø 16 (Ø 22 on an overhead boom), its ratchet clutch Ø 46 with a
 *   T-handle at the joint, and the boom running ≈ 200 mm past the joint to
 *   a counterweight Ø 50 × 80 (the counterweight and the base are DRAWING
 *   only: the collision keeps the tubes it always had);
 *   at the mic: the boom's threaded end into the clip's swivel (Ø 24).
 * The cable runs taped along the boom (its run is ILLUSTRATIVE).
 */
function MountPath({ rig, slot, pose, view, hk = 1, others = [] }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId; /* lab6 group 2: hardwareScale */ hk?: number; /** The other shown mics (their stands' bases set this tripod's turn from above). */ others?: readonly MicSlot[] }) {
  const scene = rig.scene;
  const body = rig.body[slot];
  // The other stands' poses and bodies (plain data and shared values: safe in the worklet).
  const otherPoses = others.filter((o) => o !== slot && (rig.body[o].mount === 'stand' || rig.body[o].mount === 'boom')).map((o) => ({ pose: rig.pose[o], body: rig.body[o] }));
  // A STEREO BAR (owner 2026-10-10, E01's two-mic page): two floor-stand
  // mics whose stands would stand within 0.5 m of each other share ONE stand,
  // a bar across their clip points carrying both. The first slot draws the
  // shared stand; the partner draws nothing while they share. Each mic's own
  // pose, aim and keep-outs are unchanged (the collision model is per mic).
  const partnerSlot = body.mount === 'stand' ? others.find((o) => o !== slot && rig.body[o].mount === 'stand') : undefined;
  const partner = partnerSlot ? { pose: rig.pose[partnerSlot], body: rig.body[partnerSlot], lead: slot < partnerSlot } : null;
  const heavy = body.mount === 'boom';
  const lowerW = (heavy ? 32 : 25) * hk;
  const upperW = (heavy ? 25 : 19) * hk;
  const boomW = (heavy ? 22 : 16) * hk;
  const parts = useDerivedValue(() => {
    const boom = Skia.Path.Make();
    const upper = Skia.Path.Make();
    const lower = Skia.Path.Make();
    const legs = Skia.Path.Make();
    const braces = Skia.Path.Make();
    const feet = Skia.Path.Make();
    const counter = Skia.Path.Make();
    const counterRod = Skia.Path.Make();
    const knobs = Skia.Path.Make();
    const bar = Skia.Path.Make();
    const swivels = Skia.Path.Make();
    const out = { boom, upper, lower, legs, braces, feet, counter, counterRod, knobs, bar, swivels, jx: 0, jv: 0, jOn: 0, tx: 0, tv: 0, tOn: 0, cx: 0, cv: 0, cOn: 0, fx: 0, fv: 0, fOn: 0 };
    if (body.mount !== 'stand' && body.mount !== 'boom') return out;
    let segs = assembly(scene, pose.value, body);
    // The stereo bar (real dimensions, mm — a common bar: a flat bar 200–300
    // long, a swivel at each mic's clip, one centre mount on the boom's 5/8
    // thread). Shared only while it is realistic: the clips at most 350 mm
    // apart and 150 mm apart in height, the stands' bases within 500 mm.
    let shared = false;
    if (partner) {
      const os = assembly(scene, partner.pose.value, partner.body);
      let mb: (typeof segs)[number] | null = null;
      let ms: (typeof segs)[number] | null = null;
      let pb: (typeof segs)[number] | null = null;
      let ps: (typeof segs)[number] | null = null;
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].piece === 'boom' && !mb) mb = segs[i];
        if (segs[i].piece === 'stand') ms = segs[i];
      }
      for (let i = 0; i < os.length; i++) {
        if (os[i].piece === 'boom' && !pb) pb = os[i];
        if (os[i].piece === 'stand') ps = os[i];
      }
      if (mb && ms && pb && ps) {
        const ta = mb.a;
        const tb = pb.a;
        const clipGap = Math.sqrt((ta.x - tb.x) * (ta.x - tb.x) + (ta.y - tb.y) * (ta.y - tb.y) + (ta.z - tb.z) * (ta.z - tb.z));
        const baseGap = Math.sqrt((ms.b.x - ps.b.x) * (ms.b.x - ps.b.x) + (ms.b.z - ps.b.z) * (ms.b.z - ps.b.z));
        if (clipGap <= 350 && Math.abs(ta.y - tb.y) <= 150 && baseGap <= 500) {
          shared = true;
          if (!partner.lead) return out;
          const C = { x: (ta.x + tb.x) / 2, y: (ta.y + tb.y) / 2, z: (ta.z + tb.z) / 2 };
          const F = { x: (ms.b.x + ps.b.x) / 2, y: (ms.b.y + ps.b.y) / 2, z: (ms.b.z + ps.b.z) / 2 };
          const S = { x: F.x, y: (ms.a.y + ps.a.y) / 2, z: F.z };
          segs = [
            { a: C, b: S, r: mb.r, piece: 'boom' },
            { a: S, b: F, r: ms.r, piece: 'stand' },
          ];
          bar.moveTo(ta.x, vOf(view, ta));
          bar.lineTo(tb.x, vOf(view, tb));
          swivels.addCircle(ta.x, vOf(view, ta), 14 * hk);
          swivels.addCircle(tb.x, vOf(view, tb), 14 * hk);
        }
      }
    }
    let first = true;
    let lastA = { u: 0, v: 0 };
    let lastB = { u: 0, v: 0 };
    let hasBoom = false;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const au = s.a.x;
      const av = vOf(view, s.a);
      const bu = s.b.x;
      const bv = vOf(view, s.b);
      if (s.piece === 'boom') {
        boom.moveTo(au, av);
        boom.lineTo(bu, bv);
        if (first) {
          out.tx = au;
          out.tv = av;
          out.tOn = 1;
          first = false;
        }
        lastA = { u: au, v: av };
        lastB = { u: bu, v: bv };
        hasBoom = true;
      } else if (s.piece === 'stand') {
        out.fx = bu;
        out.fv = bv;
        out.fOn = 1;
        // The tripod's turn and spread (both views agree): its legs kept
        // out of the instrument, the player and the other stands
        // (tripodTurn; owner 2026-10-10).
        const others3: Vec3[] = [];
        for (let oi = 0; oi < (shared ? 0 : otherPoses.length); oi++) {
          const os = assembly(scene, otherPoses[oi].pose.value, otherPoses[oi].body);
          for (let j = 0; j < os.length; j++) if (os[j].piece === 'stand') others3.push(os[j].b);
        }
        // The boom's direction from the stand toward the mic, in plan (3-D, so
        // the side and top views turn the tripod the same way).
        let toward: { x: number; z: number } | null = null;
        for (let j = 0; j < segs.length; j++)
          if (segs[j].piece === 'boom') {
            toward = { x: segs[j].a.x - s.b.x, z: segs[j].a.z - s.b.z };
            break;
          }
        const turn = tripodTurn(scene, s.b, others3, toward);
        const R = turn.R * hk;
        const L = Math.sqrt((bu - au) * (bu - au) + (bv - av) * (bv - av));
        if (view === 'side' && L > 1) {
          // The upright: the outer (lower) tube from the base up to the
          // height clutch, the inner tube above it to the boom clutch.
          const ux = (au - bu) / L;
          const uy = (av - bv) / L;
          const clutchH = Math.min(480 * hk, L * 0.55);
          const cu = bu + ux * clutchH;
          const cv = bv + uy * clutchH;
          lower.moveTo(bu, bv);
          lower.lineTo(cu, cv);
          upper.moveTo(cu, cv);
          upper.lineTo(au, av);
          out.cx = cu;
          out.cv = cv;
          out.cOn = 1;
          // The tripod: legs from a collar on the tube to the floor, each at
          // its turned direction seen from the side (u = x), braces from a
          // sliding collar lower down to each leg's middle.
          const hubH = Math.min(TRIPOD_HUB * hk, clutchH * 0.7);
          const brH = hubH * 0.32;
          const hub = { u: bu, v: bv - hubH };
          for (let k = 0; k < 3; k++) {
            const a = turn.a0 + (k * 2 * Math.PI) / 3;
            const tx = bu + Math.cos(a) * R;
            legs.moveTo(hub.u, hub.v);
            legs.lineTo(tx, bv - 6 * hk);
            const mu = (hub.u + tx) / 2;
            const mv = (hub.v + bv) / 2;
            braces.moveTo(bu, bv - brH);
            braces.lineTo(mu, mv);
            feet.addRRect(Skia.RRectXY(Skia.XYWHRect(tx - 15 * hk, bv - 10 * hk, 30 * hk, 10 * hk), 4 * hk, 4 * hk));
          }
          knobs.addRRect(Skia.RRectXY(Skia.XYWHRect(cu - 17 * hk, cv - 18 * hk, 34 * hk, 36 * hk), 5 * hk, 5 * hk));
          knobs.addRRect(Skia.RRectXY(Skia.XYWHRect(cu + 15 * hk, cv - 6 * hk, 26 * hk, 12 * hk), 5 * hk, 5 * hk));
          knobs.addRRect(Skia.RRectXY(Skia.XYWHRect(bu - 15 * hk, bv - hubH - 12 * hk, 30 * hk, 24 * hk), 4 * hk, 4 * hk));
          knobs.addRRect(Skia.RRectXY(Skia.XYWHRect(bu - 13 * hk, bv - brH - 9 * hk, 26 * hk, 18 * hk), 4 * hk, 4 * hk));
        } else {
          // From above the upright is a point: the tripod's three legs splay
          // from the hub to their rubber feet (the braces to their middles),
          // and the Ø 25 tube seen end on is a small circle in its collar.
          for (let k = 0; k < 3; k++) {
            const a = turn.a0 + (k * 2 * Math.PI) / 3;
            const tx = bu + Math.cos(a) * R;
            const tz = bv + Math.sin(a) * R;
            legs.moveTo(bu + Math.cos(a) * 22 * hk, bv + Math.sin(a) * 22 * hk);
            legs.lineTo(tx, tz);
            braces.moveTo(bu, bv);
            braces.lineTo(bu + Math.cos(a) * R * 0.5, bv + Math.sin(a) * R * 0.5);
            feet.addCircle(tx, tz, 13 * hk);
          }
          knobs.addCircle(bu, bv, 22 * hk);
          knobs.addCircle(bu, bv, 12.5 * hk);
        }
      }
    }
    if (hasBoom) {
      out.jx = lastB.u;
      out.jv = lastB.v;
      out.jOn = 1;
      // The boom carries on past its clutch to the counterweight.
      const du = lastB.u - lastA.u;
      const dv = lastB.v - lastA.v;
      const dl = Math.sqrt(du * du + dv * dv);
      if (dl > 1) {
        const ex = du / dl;
        const ey = dv / dl;
        const tail = 200 * hk;
        counterRod.moveTo(lastB.u, lastB.v);
        counterRod.lineTo(lastB.u + ex * (tail - 40 * hk), lastB.v + ey * (tail - 40 * hk));
        const c0 = { u: lastB.u + ex * (tail - 80 * hk), v: lastB.v + ey * (tail - 80 * hk) };
        const nx = -ey * 25 * hk;
        const ny = ex * 25 * hk;
        counter.moveTo(c0.u + nx, c0.v + ny);
        counter.lineTo(c0.u + ex * 80 * hk + nx, c0.v + ey * 80 * hk + ny);
        counter.lineTo(c0.u + ex * 80 * hk - nx, c0.v + ey * 80 * hk - ny);
        counter.lineTo(c0.u - nx, c0.v - ny);
        counter.close();
      }
    }
    return out;
  });
  const boom = useDerivedValue(() => parts.value.boom);
  // From above, a mic on a LOW route (lowBoomRoute: M05's bottom mic) has its
  // boom drawn a lighter steel, so where it passes under a higher boom the
  // two read as two (owner 2026-10-10).
  const lowR = scene.boom.low;
  const lowOn = useDerivedValue(() => (view === 'top' && lowR && pose.value.p.y > lowR.minY ? 1 : 0));
  const upper = useDerivedValue(() => parts.value.upper);
  const lower = useDerivedValue(() => parts.value.lower);
  const legs = useDerivedValue(() => parts.value.legs);
  const braces = useDerivedValue(() => parts.value.braces);
  const feet = useDerivedValue(() => parts.value.feet);
  const counter = useDerivedValue(() => parts.value.counter);
  const counterRod = useDerivedValue(() => parts.value.counterRod);
  const knobs = useDerivedValue(() => parts.value.knobs);
  const bar = useDerivedValue(() => parts.value.bar);
  const swivels = useDerivedValue(() => parts.value.swivels);
  const jx = useDerivedValue(() => parts.value.jx);
  const jv = useDerivedValue(() => parts.value.jv);
  const jOn = useDerivedValue(() => parts.value.jOn);
  const tx = useDerivedValue(() => parts.value.tx);
  const tv = useDerivedValue(() => parts.value.tv);
  const tOn = useDerivedValue(() => parts.value.tOn);
  const handle = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const g = parts.value;
    if (!g.jOn) return p;
    p.moveTo(g.jx, g.jv);
    p.lineTo(g.jx + 30 * hk, g.jv - 38 * hk);
    return p;
  });
  if (body.mount !== 'stand' && body.mount !== 'boom') return null;
  const tube = (path: SharedValue<ReturnType<typeof Skia.Path.Make>>, w: number) => (
    <>
      <Path path={path} style="stroke" strokeWidth={w + 4 * hk} strokeCap="butt" color="#0b0c0f" />
      <Path path={path} style="stroke" strokeWidth={w} strokeCap="butt" color="#4d515b" />
      <Group transform={[{ translateX: -w * 0.16 }, { translateY: -w * 0.16 }]}>
        <Path path={path} style="stroke" strokeWidth={Math.max(2, w * 0.26)} strokeCap="butt" color="#d4d8e0" opacity={0.5} />
      </Group>
    </>
  );
  return (
    <>
      {/* The tripod base: legs, braces, rubber feet. */}
      <Path path={legs} style="stroke" strokeWidth={18 * hk} strokeCap="round" color="#0b0c0f" />
      <Path path={legs} style="stroke" strokeWidth={13 * hk} strokeCap="round" color="#3d4049" />
      <Path path={braces} style="stroke" strokeWidth={8 * hk} strokeCap="round" color="#0b0c0f" />
      <Path path={braces} style="stroke" strokeWidth={5 * hk} strokeCap="round" color="#5a5e68" />
      <Path path={feet} color="#121316" />
      {/* The upright: outer tube, inner (height) tube; the boom; the counterweight. */}
      {tube(lower, lowerW)}
      {tube(upper, upperW)}
      {tube(counterRod, boomW * 0.8)}
      <Path path={counter}>
        <LinearGradient start={vec(0, -40)} end={vec(0, 40)} colors={['#5a5e68', '#22242a', '#0b0b0d']} />
      </Path>
      <Path path={counter} style="stroke" strokeWidth={2 * hk} color="#0b0c0f" />
      {tube(boom, boomW)}
      <Path path={boom} style="stroke" strokeWidth={boomW * 0.7} strokeCap="butt" color="#9aa0ab" opacity={lowOn} />
      {/* The stereo bar across the two clips, a swivel at each (shared stand only). */}
      {tube(bar, 14 * hk)}
      <Path path={swivels} color="#121316" />
      <Path path={swivels} style="stroke" strokeWidth={2 * hk} color="#6c717c" />
      {/* The cable, taped along the boom (its run is ILLUSTRATIVE). */}
      <Group transform={[{ translateX: 0 }, { translateY: boomW * 0.6 }]}>
        <Path path={boom} style="stroke" strokeWidth={5 * hk} strokeCap="round" color="#0e0f12" />
        <Path path={boom} style="stroke" strokeWidth={1.6 * hk} strokeCap="round" color="#3d4049" />
      </Group>
      {/* Clutch collars and the height clutch's wing knob (side view), the hub (from above). */}
      <Path path={knobs} color="#16171b" />
      <Path path={knobs} style="stroke" strokeWidth={2 * hk} color="#6c717c" />
      {/* The boom clutch: a ratchet disc and its T-handle. */}
      <Group opacity={jOn}>
        <Path path={handle} style="stroke" strokeWidth={9 * hk} strokeCap="round" color="#16171b" />
        <Circle cx={jx} cy={jv} r={23 * hk} color="#16171b" />
        <Circle cx={jx} cy={jv} r={23 * hk} style="stroke" strokeWidth={2.4 * hk} color="#8a8f99" />
        <Circle cx={jx} cy={jv} r={14 * hk} style="stroke" strokeWidth={1.6 * hk} color="#3d4049" />
        <Circle cx={jx} cy={jv} r={5 * hk} color="#d4d8e0" />
      </Group>
      {/* At the mic: the boom's threaded end into the clip's swivel. */}
      <Group opacity={tOn}>
        <Circle cx={tx} cy={tv} r={12 * hk} color="#121316" />
        <Circle cx={tx} cy={tv} r={12 * hk} style="stroke" strokeWidth={2 * hk} color="#6c717c" />
        <Circle cx={tx} cy={tv} r={4 * hk} color="#9aa0ab" />
      </Group>
    </>
  );
}

/**
 * lab6 group 1 — a hand-held BOOM POLE ('pole' mount), drawn from the SAME
 * capsules the collision uses (`assembly`): the pole as a slim carbon tube
 * from the mic's tail to the operator's hands, and — when the lesson's art
 * draws one (`LessonArt.PoleOperator`) — the operator, standing behind the
 * hands, facing the mic. The figure is static and only MOVES with the hands
 * (a transform), so dragging the mic stays on the UI thread.
 */
function PoleMount({ rig, slot, pose, view, Operator, hk = 1 }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId; Operator?: LessonArt['PoleOperator']; /* lab6 group 2: hardwareScale */ hk?: number }) {
  const scene = rig.scene;
  const body = rig.body[slot];
  const geo = useDerivedValue(() => {
    if (body.mount !== 'pole') return { ax: 0, av: 0, bx: 0, bv: 0, ux: 1, uz: 0 };
    const segs = assembly(scene, pose.value, body);
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece !== 'boom') continue;
      const a = segs[i].a;
      const b = segs[i].b;
      const hx = b.x - a.x;
      const hz = b.z - a.z;
      const hl = Math.sqrt(hx * hx + hz * hz) || 1;
      return { ax: a.x, av: vOf(view, a), bx: b.x, bv: vOf(view, b), ux: hx / hl, uz: hz / hl };
    }
    return { ax: 0, av: 0, bx: 0, bv: 0, ux: 1, uz: 0 };
  });
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    p.moveTo(geo.value.ax, geo.value.av);
    p.lineTo(geo.value.bx, geo.value.bv);
    return p;
  });
  // The operator: side view — feet on the floor under the hands, mirrored to
  // face the mic; plan — at the hands, turned along the pole.
  const yFloor = scene.yFloor;
  const xfOp = useDerivedValue(() => {
    const g = geo.value;
    if (view === 'side') return [{ translateX: g.bx }, { translateY: yFloor }, { scaleX: g.ux >= 0 ? 1 : -1 }];
    return [{ translateX: g.bx }, { translateY: g.bv }, { rotate: Math.atan2(g.uz, g.ux) }];
  });
  if (body.mount !== 'pole') return null;
  return (
    <>
      {Operator ? (
        <Group transform={xfOp}>
          <Operator view={view} />
        </Group>
      ) : null}
      <Path path={path} style="stroke" strokeWidth={(POLE_RADIUS * 2 + 4) * hk} strokeCap="round" color="#060608" />
      <Path path={path} style="stroke" strokeWidth={POLE_RADIUS * 2 * hk} strokeCap="round" color="#2b2e35" />
      <Group transform={[{ translateX: -1.2 }, { translateY: -1.8 }]}>
        <Path path={path} style="stroke" strokeWidth={3} strokeCap="round" color="#c9ced8" opacity={0.45} />
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
  // Lab 7 group 1: a desk ARM is drawn as two segments through a raised
  // elbow, a GOOSENECK as a curve up from its base into the mic's tail
  // (geometry/arm.ts) — from the same two end points as the capsule.
  const style = body.armStyle;
  const elbow = body.elbow;
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!geo.value.on) return p;
    if (style === 'deskArm' && elbow) {
      const segs = assembly(scene, pose.value, body);
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].piece !== 'arm') continue;
        const e = elbowOf(segs[i].b, segs[i].a, elbow.a, elbow.b);
        p.moveTo(geo.value.bx, geo.value.bv);
        p.lineTo(e.x, vOf(view, e));
        p.lineTo(geo.value.ax, geo.value.av);
      }
      return p;
    }
    if (style === 'gooseneck') {
      const segs = assembly(scene, pose.value, body);
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].piece !== 'arm') continue;
        const q = gooseneckPts(segs[i].b, segs[i].a, aimVec(pose.value.az, pose.value.el));
        p.moveTo(q[0].x, vOf(view, q[0]));
        p.cubicTo(q[1].x, vOf(view, q[1]), q[2].x, vOf(view, q[2]), q[3].x, vOf(view, q[3]));
      }
      return p;
    }
    // Lab 7b group 1: a HELD mic — the shoulder (the grip) to a lowered
    // elbow to the fist a little up the handle (geometry/arm.ts).
    if (style === 'held' && elbow) {
      const segs = assembly(scene, pose.value, body);
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].piece !== 'arm') continue;
        const f = heldFist(segs[i].a, aimVec(pose.value.az, pose.value.el));
        const e = heldElbowOf(segs[i].b, f, elbow.a, elbow.b);
        p.moveTo(geo.value.bx, geo.value.bv);
        p.lineTo(e.x, vOf(view, e));
        // The sleeve stops at the wrist, short of the fist (clash sweep
        // 2026-10-10: faded, the sleeve showed through the fist drawn over it).
        const fu = f.x;
        const fv = vOf(view, f);
        const eu = e.x;
        const ev = vOf(view, e);
        const fl = Math.sqrt((fu - eu) * (fu - eu) + (fv - ev) * (fv - ev));
        const cut = fl > 170 ? 85 / fl : 0;
        p.lineTo(fu + (eu - fu) * cut, fv + (ev - fv) * cut);
      }
      return p;
    }
    p.moveTo(geo.value.ax, geo.value.av);
    p.lineTo(geo.value.bx, geo.value.bv);
    return p;
  });
  const jaw = useDerivedValue(() => [{ translateX: geo.value.bx }, { translateY: geo.value.bv }]);
  // Art pass 2026-10-10: a DESK SPRING ARM drawn as the real thing, from the
  // SAME grip, elbow and tail (geometry and keep-outs unchanged). Real
  // dimensions (mm), a common broadcast arm: each section two parallel tubes
  // Ø 10 on 24 centres, a coil spring Ø 9 riding 34 above it between its
  // anchors; the elbow a hinge block Ø 38 with its tension knob; a swivel
  // Ø 40 on the riser post at the grip; at the mic end the 5/8 in thread
  // and a SHOCK MOUNT — a rigid frame round the mic, the mic's cradle rings
  // hung in elastic cord (rings ≈ 30 mm wider than the body, at ¼ and ⅗ of
  // its length); the cable clipped along the lower tube.
  const desk = useDerivedValue(() => {
    const tubes = Skia.Path.Make();
    const springs = Skia.Path.Make();
    const cable = Skia.Path.Make();
    const frame = Skia.Path.Make();
    const elastic = Skia.Path.Make();
    const out = { tubes, springs, cable, frame, elastic, ex: 0, ev: 0, mx: 0, mv: 0 };
    if (style !== 'deskArm' || !elbow || !geo.value.on) return out;
    const segs = assembly(scene, pose.value, body);
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece !== 'arm') continue;
      const e = elbowOf(segs[i].b, segs[i].a, elbow.a, elbow.b);
      const G = { u: geo.value.bx, v: geo.value.bv };
      const E = { u: e.x, v: vOf(view, e) };
      const T = { u: geo.value.ax, v: geo.value.av };
      out.ex = E.u;
      out.ev = E.v;
      const section = (P: { u: number; v: number }, Q: { u: number; v: number }) => {
        const du = Q.u - P.u;
        const dv = Q.v - P.v;
        const L = Math.sqrt(du * du + dv * dv);
        if (L < 1) return;
        const tu = du / L;
        const tv = dv / L;
        // The normal on the raised (upper, −v) side.
        let nu = tv;
        let nv = -tu;
        if (nv > 0) {
          nu = -nu;
          nv = -nv;
        }
        for (const k of [-12, 12]) {
          tubes.moveTo(P.u + nu * k, P.v + nv * k);
          tubes.lineTo(Q.u + nu * k, Q.v + nv * k);
        }
        // The spring: a coil seen side-on, from 12 % to 70 % of the section, with its hooks.
        const s0 = 0.12 * L;
        const s1 = 0.7 * L;
        const off = 34;
        springs.moveTo(P.u + tu * (s0 - 14) + nu * 12, P.v + tv * (s0 - 14) + nv * 12);
        springs.lineTo(P.u + tu * s0 + nu * off, P.v + tv * s0 + nv * off);
        const n = Math.max(6, Math.floor((s1 - s0) / 7));
        for (let j = 1; j <= n; j++) {
          const t = s0 + ((s1 - s0) * j) / n;
          const w = j % 2 ? 5 : -5;
          springs.lineTo(P.u + tu * t + nu * (off + w), P.v + tv * t + nv * (off + w));
        }
        springs.lineTo(P.u + tu * (s1 + 18) + nu * 12, P.v + tv * (s1 + 18) + nv * 12);
        cable.moveTo(P.u - nu * 20, P.v - nv * 20);
        cable.lineTo(Q.u - nu * 20, Q.v - nv * 20);
      };
      section(G, E);
      section(E, T);
      // The shock mount round the mic body: two cradle rings seen edge-on,
      // the frame's side bar, elastic cord from frame to ring.
      const aim = aimVec(pose.value.az, pose.value.el);
      const au = aim.x;
      const av = view === 'side' ? aim.y : aim.z;
      const al = Math.sqrt(au * au + av * av) || 1;
      const xu = au / al;
      const xv = av / al;
      const pu = -xv;
      const pv = xu;
      const R = body.radius + 15;
      const Lb = body.length;
      out.mx = T.u + xu * Lb * 0.4;
      out.mv = T.v + xv * Lb * 0.4;
      for (const f of [0.25, 0.6]) {
        const cu = T.u + xu * Lb * f * al;
        const cv = T.v + xv * Lb * f * al;
        for (const sg of [-1, 1]) {
          elastic.moveTo(cu + pu * sg * (R + 12) - xu * 14, cv + pv * sg * (R + 12) - xv * 14);
          elastic.lineTo(cu + pu * sg * (R - 2), cv + pv * sg * (R - 2));
          elastic.lineTo(cu + pu * sg * (R + 12) + xu * 14, cv + pv * sg * (R + 12) + xv * 14);
        }
      }
      // Frame bar on the outside of the rings, from the thread mount at the tail.
      const fb = Skia.Path.Make();
      fb.moveTo(T.u + pu * (R + 12) - xu * 10, T.v + pv * (R + 12) - xv * 10);
      fb.lineTo(T.u + pu * (R + 12) + xu * Lb * 0.66 * al, T.v + pv * (R + 12) + xv * Lb * 0.66 * al);
      fb.moveTo(T.u - pu * (R + 12) - xu * 10, T.v - pv * (R + 12) - xv * 10);
      fb.lineTo(T.u - pu * (R + 12) + xu * Lb * 0.66 * al, T.v - pv * (R + 12) + xv * Lb * 0.66 * al);
      elastic.addPath(fb);
      // The cradle rings, edge-on, square to the mic's axis.
      for (const f of [0.25, 0.6]) {
        const cu = T.u + xu * Lb * f * al;
        const cv = T.v + xv * Lb * f * al;
        const ring = Skia.Path.Make();
        ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-6, -R, 12, 2 * R), 5, 5));
        ring.transform(Skia.Matrix().translate(cu, cv).rotate(Math.atan2(xv, xu)));
        frame.addPath(ring);
      }
    }
    return out;
  });
  const dTubes = useDerivedValue(() => desk.value.tubes);
  const dSprings = useDerivedValue(() => desk.value.springs);
  const dCable = useDerivedValue(() => desk.value.cable);
  const dFrame = useDerivedValue(() => desk.value.frame);
  const dElastic = useDerivedValue(() => desk.value.elastic);
  const dEx = useDerivedValue(() => desk.value.ex);
  const dEv = useDerivedValue(() => desk.value.ev);
  const tailXf = useDerivedValue(() => [{ translateX: geo.value.ax }, { translateY: geo.value.av }]);
  const on = useDerivedValue(() => geo.value.on);
  const red = useDerivedValue(() => geo.value.far * 0.9);
  if (body.mount !== 'clip') return null;
  if (style === 'held') {
    // A long-sleeved arm (the shared figure's shirt and skin tones): a dark
    // contour, the sleeve, a rim light along its lit edge; red when the hand
    // cannot reach. The fist is drawn over the handle (HeldFistGlyph). From
    // the side the holder usually stands beyond the person the mic serves:
    // the arm is drawn a little faded there (a 2-D drawing has no depth).
    // Faded as ONE layer: the contour, sleeve and rim light never show
    // through each other (clash sweep 2026-10-10).
    return (
      <Group layer={view === 'side' ? <Paint opacity={0.62} /> : undefined}>
      <Group opacity={on}>
        <Path path={path} style="stroke" strokeWidth={96} strokeCap="round" strokeJoin="round" color="#12151c" />
        <Path path={path} style="stroke" strokeWidth={90} strokeCap="round" strokeJoin="round" color="#55617b" />
        <Group transform={[{ translateX: -6 }, { translateY: -9 }]}>
          <Path path={path} style="stroke" strokeWidth={30} strokeCap="round" strokeJoin="round" color="#76839e" opacity={0.75} />
        </Group>
        <Path path={path} style="stroke" strokeWidth={98} strokeCap="round" strokeJoin="round" color="#ff6b5e" opacity={red} />
      </Group>
      </Group>
    );
  }
  if (style === 'deskArm') {
    return (
      <Group opacity={on}>
        {/* The cable, clipped along under the lower tube of each section. */}
        <Path path={dCable} style="stroke" strokeWidth={6} strokeCap="round" color="#0e0f12" />
        {/* Two parallel tubes per section: a dark edge, satin black, a rim light. */}
        <Path path={dTubes} style="stroke" strokeWidth={13} strokeCap="round" color="#060608" />
        <Path path={dTubes} style="stroke" strokeWidth={9.5} strokeCap="round" color="#2e3138" />
        <Group transform={[{ translateX: -1 }, { translateY: -1.5 }]}>
          <Path path={dTubes} style="stroke" strokeWidth={2.4} strokeCap="round" color="#c9ced8" opacity={0.45} />
        </Group>
        {/* The springs (steel coils) above each section. */}
        <Path path={dSprings} style="stroke" strokeWidth={3.6} strokeJoin="round" color="#0b0c0f" />
        <Path path={dSprings} style="stroke" strokeWidth={2.2} strokeJoin="round" color="#b4b9c3" />
        <Path path={path} style="stroke" strokeWidth={30} strokeCap="round" strokeJoin="round" color="#ff6b5e" opacity={red} />
        {/* The swivel on the riser post at the grip. */}
        <Group transform={jaw}>
          <Path path={Skia.Path.Make().addRRect(Skia.RRectXY(Skia.XYWHRect(-20, -14, 40, 34), 6, 6))} color="#16171b" />
          <Path path={Skia.Path.Make().addRRect(Skia.RRectXY(Skia.XYWHRect(-20, -14, 40, 34), 6, 6))} style="stroke" strokeWidth={2} color="#6c717c" />
          <Circle cx={0} cy={-2} r={7} color="#3d4049" />
          <Circle cx={0} cy={-2} r={3} color="#d4d8e0" />
        </Group>
        {/* The elbow hinge and its tension knob. */}
        <Circle cx={dEx} cy={dEv} r={19} color="#16171b" />
        <Circle cx={dEx} cy={dEv} r={19} style="stroke" strokeWidth={2.4} color="#8a8f99" />
        <Circle cx={dEx} cy={dEv} r={9} color="#3d4049" />
        <Circle cx={dEx} cy={dEv} r={3.5} color="#d4d8e0" />
        {/* The shock mount: elastic cord and the frame bars, then the cradle rings. */}
        <Path path={dElastic} style="stroke" strokeWidth={6} strokeJoin="round" color="#0b0c0f" />
        <Path path={dElastic} style="stroke" strokeWidth={3.4} strokeJoin="round" color="#3a3d45" />
        <Path path={dFrame} color="#1b1c20" />
        <Path path={dFrame} style="stroke" strokeWidth={1.6} color="#6c717c" />
        {/* The 5/8 in thread mount at the arm's end. */}
        <Group transform={tailXf}>
          <Circle cx={0} cy={0} r={13} color="#121316" />
          <Circle cx={0} cy={0} r={13} style="stroke" strokeWidth={2} color="#8a8f99" />
          <Circle cx={0} cy={0} r={5} color="#c8ccd4" />
        </Group>
      </Group>
    );
  }
  if (style === 'gooseneck') {
    // (The desk arm has its own drawing above; this branch keeps the gooseneck.)
    const goose: boolean = true;
    const w = goose ? 12 : 20;
    return (
      <Group opacity={on}>
        <Path path={path} style="stroke" strokeWidth={w + 5} strokeCap="round" strokeJoin="round" color="#0b0c0f" />
        <Path path={path} style="stroke" strokeWidth={w} strokeCap="round" strokeJoin="round" color={goose ? '#2a2c32' : '#3d4049'} />
        {goose ? (
          // The neck's ribs: short dark bands along the flexible tube.
          <Path path={path} style="stroke" strokeWidth={w} strokeCap="butt" color="#0c0d10" opacity={0.75}>
            <DashPathEffect intervals={[1.6, 3.4]} />
          </Path>
        ) : (
          // The springs, riding just above each segment.
          <Group transform={[{ translateX: 0 }, { translateY: -14 }]}>
            <Path path={path} style="stroke" strokeWidth={3.2} strokeJoin="round" color="#8a8f99" opacity={0.85}>
              <DashPathEffect intervals={[2.2, 2.2]} />
            </Path>
          </Group>
        )}
        <Group transform={[{ translateX: -1.2 }, { translateY: -1.8 }]}>
          <Path path={path} style="stroke" strokeWidth={Math.max(2, w * 0.24)} strokeCap="round" strokeJoin="round" color="#d4d8e0" opacity={0.45} />
        </Group>
        <Path path={path} style="stroke" strokeWidth={w + 2} strokeCap="round" strokeJoin="round" color="#ff6b5e" opacity={red} />
        {/* The swivel at the grip (the clamp's post top or the neck's base). */}
        <Group transform={jaw}>
          <Circle cx={0} cy={0} r={goose ? 8 : 10} color="#16171b" />
          <Circle cx={0} cy={0} r={goose ? 8 : 10} style="stroke" strokeWidth={2} color="#8a8f99" />
          <Circle cx={0} cy={0} r={3} color="#d4d8e0" />
        </Group>
      </Group>
    );
  }
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

/** Lab 7b group 1: the fist round a HELD mic's handle, drawn over the mic
 *  (the hand closes on it): skin tones, knuckles toward the viewer. */
function HeldFistGlyph({ rig, slot, pose, view }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId }) {
  const body = rig.body[slot];
  const scene = rig.scene;
  const geo = useDerivedValue(() => {
    const segs = assembly(scene, pose.value, body);
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece !== 'arm') continue;
      const f = heldFist(segs[i].a, aimVec(pose.value.az, pose.value.el));
      return { u: f.x, v: vOf(view, f), on: 1 };
    }
    return { u: 0, v: 0, on: 0 };
  });
  const tf = useDerivedValue(() => [{ translateX: geo.value.u }, { translateY: geo.value.v }]);
  const on = useDerivedValue(() => geo.value.on);
  if (body.mount !== 'clip' || body.armStyle !== 'held') return null;
  return (
    <Group layer={view === 'side' ? <Paint opacity={0.62} /> : undefined}>
    <Group opacity={on} transform={tf}>
      <Circle cx={0} cy={0} r={42} color="#2a201a" />
      <Circle cx={0} cy={0} r={38}>
        <RadialGradient c={vec(-12, -14)} r={52} colors={['#c3ab98', '#a28977', '#7d6656', '#5a4639']} />
      </Circle>
      {[-18, -6, 6, 18].map((k) => (
        <Line key={k} p1={vec(k, -24)} p2={vec(k + 2, 22)} color="#2a201a" strokeWidth={2.4} opacity={0.55} />
      ))}
    </Group>
    </Group>
  );
}

function PolarSlice({ pose, view, pattern, shotgun = false, hk = 1 }: { pose: SharedValue<MicPose>; view: ViewId; pattern: MicPattern; shotgun?: boolean; /* lab6 group 2: hardwareScale */ hk?: number }) {
  // lab6 group 1: a SHORT SHOTGUN — its base pattern below the tube's
  // transition, and the narrower lobe it tends toward at high frequencies
  // (engine/physics/shotgun.ts): a simplified picture, drawn inside the base.
  const high = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!shotgun) return p;
    const ps = pose.value;
    const aim = aimVec(ps.az, ps.el);
    const cu = ps.p.x;
    const cv = vOf(view, ps.p);
    for (let i = 0; i <= 120; i++) {
      const phi = (i / 120) * Math.PI * 2;
      const d = view === 'side' ? { x: Math.cos(phi), y: Math.sin(phi), z: 0 } : { x: Math.cos(phi), y: 0, z: Math.sin(phi) };
      const g = shotgunLobe(angleBetween(aim, d), 'high') * POLAR_R * 1.35 * hk;
      const u = cu + g * Math.cos(phi);
      const v = cv + g * Math.sin(phi);
      if (i === 0) p.moveTo(u, v);
      else p.lineTo(u, v);
    }
    p.close();
    return p;
  });
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
      const g = Math.abs(gain(pattern, angleBetween(aim, d))) * POLAR_R * hk;
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
      {shotgun ? (
        <>
          <Path path={high} color={IDEAL} opacity={0.1} />
          <Path path={high} style="stroke" strokeWidth={2.5} color={IDEAL} opacity={0.85}>
            <DashPathEffect intervals={[4, 5]} />
          </Path>
        </>
      ) : null}
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
  // One consistent style for every suggested starting point (owner ruling
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
    const own = art.labels(view, variant).filter((l) => !(micsOn && l.id === 'player' && l.text === 'PLAYER') && (!l.withMics || rig.mics.some((m) => live.includes(m.slot) && m.on && l.withMics!.includes(m.typeId))));
    // The view's tag in the bottom-left corner ("SIDE · CUTAWAY") is words
    // too: a label never sits on it.
    const tagText = model.viewTags?.[view] ?? viewTag;
    const tagFs = Math.max(9, 9 * textScale);
    const tag = { x0: 0, y0: h - tagFs * 1.4 - 4, x1: 8 + tagText.length * (tagFs * 0.6 + 1.2), y1: h };
    // Level of detail (artLabels.ts): only labels that find clear space — off
    // the drawing, off each other, on the glass below the live strip.
    // The mics' stands and booms as lines (px) the labels keep off (owner
    // 2026-10-10, M05: WAIST and OPEN FOOT sat on the low stand): each boom
    // with its counterweight's run past the clutch, each upright, and (from
    // the side) the tripod's spread along the floor.
    const px = (q: Vec3) => ({ x: base.ox + q.x * base.s, y: base.oy + (view === 'side' ? q.y : q.z) * base.s });
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const m of rig.mics) {
      if (!live.includes(m.slot) || !m.on) continue;
      const body = rig.body[m.slot];
      if (body.mount !== 'stand' && body.mount !== 'boom') continue;
      const sg = assembly(rig.scene, m.pose, body);
      let lastBoom: (typeof sg)[number] | null = null;
      for (const g of sg) {
        if (g.piece !== 'boom' && g.piece !== 'stand') continue;
        const a = px(g.a);
        const b2 = px(g.b);
        lines.push({ x1: a.x, y1: a.y, x2: b2.x, y2: b2.y });
        if (g.piece === 'boom') lastBoom = g;
        // From the side, the tripod's two outer legs: hub (190 mm up) to the feet.
        if (g.piece === 'stand' && view === 'side')
          for (const sx of [-1, 1]) lines.push({ x1: b2.x, y1: b2.y - 190 * base.s, x2: b2.x + sx * 260 * base.s, y2: b2.y - 2 });
      }
      if (lastBoom) {
        // As MountPath draws it: 200 mm on the glass along the boom's
        // projected direction, past the clutch.
        const a = px(lastBoom.a);
        const b2 = px(lastBoom.b);
        const l = Math.hypot(b2.x - a.x, b2.y - a.y) || 1;
        const k = (200 * base.s) / l;
        lines.push({ x1: b2.x, y1: b2.y, x2: b2.x + (b2.x - a.x) * k, y2: b2.y + (b2.y - a.y) * k });
      }
    }
    return layoutArtLabels(art, view, variant, authoredBox, base, labelScale, w, h, { avoid, obstacles: [...(obstacles ?? []), tag, ...guideData.map((g) => g.rect)], minY: reserveTop + 1, labels: own, model, lines });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the rect by value (DualView makes a new object each render)
  }, [mini, showLabels, showZones, zones, art, view, variant, base, labelScale, textScale, viewTag, w, h, reserveTop, authoredBox, model, micsOn, rig.mics, live, guideData, avoid?.x0, avoid?.y0, avoid?.x1, avoid?.y1]);
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
          {/* From above, the lowest mount first: a higher boom passes OVER a lower one. */}
          {(view === 'top' ? [...micsShown].sort((a, b) => b.pose.p.y - a.pose.p.y) : micsShown).map((m) => (
            <MountPath key={`mount:${m.slot}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} hk={model.hardwareScale ?? 1} others={micsShown.map((q) => q.slot)} />
          ))}
          {micsShown.map((m) => (
            <PoleMount key={`pole:${m.slot}:${m.typeId}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} Operator={art.PoleOperator} hk={model.hardwareScale ?? 1} />
          ))}
          {micsShown.map((m) => (
            <ClampArm key={`clamp:${m.slot}:${m.typeId}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} />
          ))}
          {showPolar
            ? micsShown.map((m) => <PolarSlice key={`polar:${m.slot}:${m.pattern}:${m.typeId}`} pose={rig.pose[m.slot]} view={view} pattern={m.pattern} shotgun={micType(m.typeId).lobe === 'shotgun'} hk={model.hardwareScale ?? 1} />)
            : null}
          {guideData.map((d) => (
            <SetupGuide key={`guide:${d.slot}`} g={d.g} view={view} xf={xf} dashMm={10 / base.s} drawDim={!d.short} />
          ))}
          {micsShown.map((m) => (
            <MicGlyph key={`mic:${m.slot}:${m.typeId}`} pose={rig.pose[m.slot]} view={view} typeId={m.typeId} blocked={rig.blocked[m.slot]} focus={interactive && !mini} xf={xf} hk={model.hardwareScale ?? 1} />
          ))}
          {micsShown.map((m) => (
            <HeldFistGlyph key={`fist:${m.slot}:${m.typeId}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} />
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
  if (view === 'top') {
    // from above: the 2-way wedge at true size (lessons/shared/wedge2Way.tsx)
    const a = Math.atan2(faces.z, faces.x);
    return (
      <Group transform={[{ translateX: at.x }, { translateY: vOf(view, at) }, { rotate: a }]}>
        <Wedge2WayTop shadow />
      </Group>
    );
  }
  return <WedgeSide at={at} view={view} faces={faces} />;
}

/** The wedge's side profile (the elevation views). */
function WedgeSide({ at, view, faces }: { at: Vec3; view: ViewId; faces: Vec3 }) {
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

