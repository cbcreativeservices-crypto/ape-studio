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
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import Animated, { useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import { StageInFullScreen, useStageTextScale } from '../../../rack/stageAspect';
import { useScrollLock } from '../../../scrollLock';
import { GestureExclusionZone, STAGE_BAND_DP } from '../../../../../../modules/ape-gesture-exclusion';
import { BoundaryMic, KickDynamicMic, SdcMic } from '../../../../../features/lab/micDrawings';
import type { DocumentedZone, MicPattern, MicPose, MicSlot, Shape3, VariantId, Vec3, ViewBox, ViewId } from '../model/types.ts';
import { aimVec, angleBetween, clamp, sub } from '../geometry/vec.ts';
import { fitXform, project, unprojectDelta, zoomAbout, type ViewXform } from '../geometry/frame.ts';
import { assembly, constrainMove, pinToSurface, type Blocked } from '../geometry/collision.ts';
import { deriveReadouts } from '../geometry/readouts.ts';
import { zonesAvailable } from '../geometry/zones.ts';
import { gain, isModelled } from '../physics/polar.ts';
import { micType } from '../../data/micTypes.ts';
import type { Rig } from './useRig.ts';
import { liveLine, withStop } from './readoutText.ts';
import { refLabels } from './sceneWords.ts';
import { fitLabels, labelWidth } from './labelLayout.ts';
import type { LessonArt } from './sceneTypes.ts';

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const GREY = '#8a8f9c';
/** The IDEAL-model colour (charter: blue = SOURCED, amber = TRIAL, grey = ILLUSTRATIVE). */
const IDEAL = '#e8eaee';
const POLAR_R = 170; // mm: the drawn radius of an on-axis lobe (a drawing size, not a range)
const MAX_ZOOM = 5;
/** Below this fit scale (px per mm) no part label can sit by its part:
 *  hidden. Above it, colliding labels are culled (fitLabels). */
const LABEL_MIN_S = 0.12;
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
  wedge?: { at: Vec3; faces: Vec3; src: Vec3 } | null;
  highlight?: string | null;
  onTapPart?: (partId: string) => void;
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
    default:
      return null;
  }
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
function zoneRect(z: DocumentedZone, view: ViewId, rig: Rig): { u0: number; u1: number; v0: number; v1: number } {
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
  const cross = surface ? (view === 'side' ? r * 2 : (t.body.width?.mm ?? r * 2)) : r * 2;
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
  return (
    <Group>
      <Group transform={transform}>
        {t.art === 'boundary' ? (
          <BoundaryMic len={len} cross={cross} />
        ) : t.art === 'sdc' ? (
          <SdcMic r={r} len={len} />
        ) : (
          <KickDynamicMic r={r} len={len} />
        )}
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
    if (body.mount !== 'stand') return p;
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
    if (body.mount !== 'stand') return { jx: 0, jv: 0, fx: 0, fv: 0, joint: 0, stand: 0 };
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
  if (body.mount !== 'stand') return null;
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
function LobeTag({ pose, view, xf, scale, maxX, maxY }: { pose: SharedValue<MicPose>; view: ViewId; xf: SharedValue<ViewXform>; scale: number; maxX: number; maxY: number }) {
  const text = 'PATTERN SHAPE, NOT RANGE';
  const W = labelWidth(text, scale, maxX);
  const style = useAnimatedStyle(() => {
    const p = pose.value;
    const x = xf.value.ox + p.p.x * xf.value.s;
    const above = xf.value.oy + (vOf(view, p.p) - POLAR_R) * xf.value.s - 14 * scale;
    const below = xf.value.oy + (vOf(view, p.p) + POLAR_R) * xf.value.s + 2;
    const left = Math.max(2, Math.min(maxX - W - 2, x - W / 2));
    // Above the lobe, unless that lands in the top-right corner the glass's
    // inset owns — then below it.
    const inInset = left + W > maxX * 0.7 && above < maxY * 0.62;
    const y = inInset ? below : above;
    // No clean spot (the badge still says it): hidden rather than on top of
    // another label.
    const ok = y > 4 && y < maxY - 34;
    return { opacity: ok ? 1 : 0, transform: [{ translateX: left }, { translateY: y }] };
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

function ZoneBand({ z, rig, view, zoneSV }: { z: DocumentedZone; rig: Rig; view: ViewId; zoneSV: SharedValue<string | null> }) {
  const r = zoneRect(z, view, rig);
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(r.u0, r.v0, Math.max(4, r.u1 - r.u0), r.v1 - r.v0), 10, 10));
    return p;
  }, [r.u0, r.u1, r.v0, r.v1]);
  // One consistent style for every recommended starting point (owner ruling
  // 2026-10-04): the same blue band, the same solid edge.
  const tone = BLUE;
  const fill = useDerivedValue(() => (zoneSV.value === z.id ? 0.26 : 0.04));
  const edge = useDerivedValue(() => (zoneSV.value === z.id ? 1 : 0.45));
  return (
    <>
      <Path path={path} color={tone} opacity={fill} />
      <Path path={path} style="stroke" strokeWidth={2.5} color={tone} opacity={edge} />
    </>
  );
}

/* ── RN labels over the canvas, following the same transform ─────────── */

function SceneLabel({ xf, u, v, text, align, tone, scale, maxX }: { xf: SharedValue<ViewXform>; u: number; v: number; text: string; align: 'left' | 'center' | 'right'; tone?: string; scale: number; maxX: number }) {
  // Width from the text (Oswald ≈ 0.55 em per glyph), so a label can be kept
  // wholly inside the canvas instead of running off its edge.
  const W = labelWidth(text, scale, maxX);
  const style = useAnimatedStyle(() => {
    const x = xf.value.ox + u * xf.value.s;
    const y = xf.value.oy + v * xf.value.s;
    const left = align === 'left' ? x : align === 'right' ? x - W : x - W / 2;
    return { transform: [{ translateX: Math.max(2, Math.min(maxX - W - 2, left)) }, { translateY: y - 7 * scale }] };
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
  const surfaceId = rig.surfaceId;
  const lineId = rig.lineId;
  const words = useMemo(
    () => ({ slot, ...refLabels(rig), showAim: rig.body[slot].mount !== 'surface' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slot, rig.lesson, rig.surfaceId, rig.lineId, rig.body],
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

export function PlacementScene(props: PlacementSceneProps) {
  const inFull = useContext(StageInFullScreen);
  const body = <SceneBody {...props} />;
  // A Modal is its own native root on Android: a gesture inside full screen
  // needs its own Gesture Handler root (App.tsx:414-418).
  return inFull ? <GestureHandlerRootView style={{ width: props.w, height: props.h }}>{body}</GestureHandlerRootView> : body;
}

function SceneBody({ rig, art, view, w, h, interactive = true, mini = false, baseXf, boxOverride, showLabels = true, showLive = true, onCommit, accessibilityLabel, slots = ['A'], showZones = true, showPolar = true, showEnvelopes = true, pathsFrom = null, wedge = null, highlight = null, onTapPart }: PlacementSceneProps) {
  const model = rig.lesson.model;
  const box = boxOverride ?? model.views[view]!;
  const textScale = useStageTextScale();
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
  const live = slots;
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
          if (dr <= RING_R_PX + 8) return `${slot}.aim`;
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
            const el = (Math.atan2(-ay * Math.cos((st.az * Math.PI) / 180), -ax) * 180) / Math.PI;
            to = { p: st.p, az: st.az, el: clamp(el, -80, 80) };
          } else {
            const az = (Math.atan2(ay, -ax) * 180) / Math.PI;
            to = { p: st.p, az: clamp(az, -80, 80), el: st.el };
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
  }, [xf, hasA, hasB, poseA, poseB, lenA, lenB, rA, rB, surfA, surfB, interactive, mini, grab, startTouch, startPose, setLock, bodies, pins, view, scene, bounds, blockedA, blockedB, finish, pinchStart, pinchFocal, base, onTapPart, tapAt]);

  // ── what is drawn ──
  const zones = useMemo(() => {
    if (!showZones) return [];
    const ids = new Set<string>();
    for (const s of live) {
      const m = rig.mics.find((q) => q.slot === s);
      if (!m) continue;
      for (const z of zonesAvailable(rig.lesson.zones, variant, m.typeId, micType(m.typeId).mount)) ids.add(z.id);
    }
    return rig.lesson.zones.filter((z) => ids.has(z.id));
  }, [showZones, live, rig.mics, rig.lesson.zones, variant]);
  const ctxA = rig.ctx.A;
  const surfaceId = rig.surfaceId;
  const lineId = rig.lineId;
  const zoneA = useDerivedValue(() => deriveReadouts(ctxA, poseA.value, surfaceId, lineId).zoneId);
  const envelopes = useMemo(() => {
    if (!showEnvelopes) return [];
    return model.envelopes
      .filter((e) => !e.variants || e.variants.includes(variant))
      .map((e) => ({ id: e.id, path: shapeOutline(e.shape, view) }))
      .filter((e): e is { id: string; path: ReturnType<typeof Skia.Path.Make> } => !!e.path);
  }, [showEnvelopes, model.envelopes, variant, view]);
  const hatchPath = useMemo(() => hatch(box), [box]);
  // Part labels only where the drawing is big enough to carry them (a short
  // landscape glass drew them on top of each other); full screen always has them.
  const labels = useMemo(
    () => (mini || !showLabels || base.s < LABEL_MIN_S ? [] : fitLabels(art.labels(view, variant), base, textScale, w)),
    [mini, showLabels, art, view, variant, base, textScale, w],
  );
  const Instrument = art.Instrument;
  const highlightPath = useMemo(() => {
    if (!highlight) return null;
    const part = model.parts.find((p) => p.id === highlight);
    const region = model.regions.find((r) => r.partId === highlight);
    const p = Skia.Path.Make();
    const sol = part?.solid;
    if (sol && (sol.kind === 'slab' || sol.kind === 'tube')) {
      const r = sol.kind === 'slab' ? sol.r : sol.rOut;
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(sol.x0 - 14, -r - 14, sol.x1 - sol.x0 + 28, 2 * r + 28), 10, 10));
      return p;
    }
    if (sol) {
      const o = shapeOutline(sol, view);
      if (o) return o;
    }
    if (region) p.addCircle(region.anchor.x, view === 'side' ? region.anchor.y : region.anchor.z, 70);
    return region ? p : null;
  }, [highlight, model, view]);

  const micsShown = rig.mics.filter((m) => live.includes(m.slot) && m.on);

  const canvas = (
    <View style={{ width: w, height: h }}>
      {/* Android gesture nav: a mic dragged at the stage's edge must not start
          the system back gesture (modules/ape-gesture-exclusion; renders
          nothing on iOS, web and builds without the module). */}
      {!mini && interactive ? <GestureExclusionZone maxHeightDp={STAGE_BAND_DP} /> : null}
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={matrix}>
          <Instrument view={view} variant={variant} />
          {envelopes.map((e) => (
            <Group key={e.id} clip={e.path}>
              <Path path={hatchPath} style="stroke" strokeWidth={2} color={GREY} opacity={0.55} />
            </Group>
          ))}
          {envelopes.map((e) => (
            <Path key={`${e.id}:o`} path={e.path} style="stroke" strokeWidth={2.5} color={GREY} opacity={0.7} />
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
              <WedgeGlyph at={wedge.at} view={view} faces={wedge.faces} />
            </>
          ) : null}
          {micsShown.map((m) => (
            <MountPath key={`mount:${m.slot}`} rig={rig} slot={m.slot} pose={rig.pose[m.slot]} view={view} />
          ))}
          {showPolar
            ? micsShown.map((m) => <PolarSlice key={`polar:${m.slot}:${m.pattern}`} pose={rig.pose[m.slot]} view={view} pattern={m.pattern} />)
            : null}
          {micsShown.map((m) => (
            <MicGlyph key={`mic:${m.slot}:${m.typeId}`} pose={rig.pose[m.slot]} view={view} typeId={m.typeId} blocked={rig.blocked[m.slot]} focus={interactive && !mini} xf={xf} />
          ))}
        </Group>
      </Canvas>
      {labels.map((l) => (
        <SceneLabel key={l.id} xf={xf} u={l.u} v={l.v} text={l.text} align={l.align} tone={l.tone} scale={textScale} maxX={w} />
      ))}
      {showPolar && !mini && showLabels
        ? micsShown.filter((m) => isModelled(m.pattern)).slice(0, 1).map((m) => <LobeTag key={`lobe:${m.slot}`} pose={rig.pose[m.slot]} view={view} xf={xf} scale={textScale} maxX={w} maxY={h} />)
        : null}
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
          {view === 'side' ? 'SIDE · CUTAWAY' : 'TOP · CUTAWAY'}
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
  // Web: the backing hugs the words (a full-width band hid the head labels).
  liveWeb: { alignSelf: 'flex-start', maxWidth: '100%' },
  viewTag: { position: 'absolute', left: 6, bottom: 3, color: colors.textMuted, fontFamily: fonts.oswaldMedium, letterSpacing: 1.2 },
});

