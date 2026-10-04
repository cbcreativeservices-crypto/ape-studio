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
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import { StageInFullScreen, useStageTextScale } from '../../../rack/stageAspect';
import { useScrollLock } from '../../../scrollLock';
import { BoundaryMic, KickDynamicMic, SdcMic } from '../../../../../features/lab/micDrawings';
import type { DocumentedZone, MicPattern, MicPose, MicSlot, Shape3, VariantId, Vec3, ViewBox, ViewId } from '../model/types.ts';
import { aimVec, angleBetween, clamp, sub } from '../geometry/vec.ts';
import { fitXform, project, unprojectDelta, zoomAbout, type ViewXform } from '../geometry/frame.ts';
import { assembly, constrainMove, pinToSurface, type Blocked } from '../geometry/collision.ts';
import { deriveReadouts } from '../geometry/readouts.ts';
import { zonesAvailable } from '../geometry/zones.ts';
import { gain, isModelled } from '../physics/polar.ts';
import { fmtAngle, fmtLen } from '../model/units.ts';
import { micType } from '../../data/micTypes.ts';
import type { Rig } from './useRig.ts';
import type { LessonArt } from './sceneTypes.ts';

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const GREY = '#8a8f9c';
const POLAR_R = 170; // mm: the drawn radius of an on-axis lobe (a drawing size, not a range)
const MAX_ZOOM = 5;
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
  /** Page 4: a monitor wedge at this point. */
  wedge?: Vec3 | null;
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

function MountPath({ rig, slot, pose, view }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId }) {
  const scene = rig.scene;
  const body = rig.body[slot];
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
  return (
    <>
      <Path path={path} style="stroke" strokeWidth={16} strokeCap="round" color="#2a2c32" />
      <Path path={path} style="stroke" strokeWidth={6} strokeCap="round" color="#7c818c" opacity={0.7} />
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
  return (
    <>
      <Path path={path} color={BLUE} opacity={0.12} />
      <Path path={path} style="stroke" strokeWidth={3} color={BLUE} opacity={0.85} />
    </>
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
  const tone = z.kind === 'trial' ? AMBER : BLUE;
  const fill = useDerivedValue(() => (zoneSV.value === z.id ? 0.26 : 0.04));
  const edge = useDerivedValue(() => (zoneSV.value === z.id ? 1 : 0.45));
  return (
    <>
      <Path path={path} color={tone} opacity={fill} />
      <Path path={path} style="stroke" strokeWidth={z.kind === 'trial' ? 2.5 : 2.5} color={tone} opacity={edge}>
        {z.kind === 'trial' ? <DashPathEffect intervals={[14, 9]} /> : null}
      </Path>
    </>
  );
}

/* ── RN labels over the canvas, following the same transform ─────────── */

function SceneLabel({ xf, u, v, text, align, tone, scale, maxX }: { xf: SharedValue<ViewXform>; u: number; v: number; text: string; align: 'left' | 'center' | 'right'; tone?: string; scale: number; maxX: number }) {
  // Width from the text (Oswald ≈ 0.55 em per glyph), so a label can be kept
  // wholly inside the canvas instead of running off its edge.
  const W = Math.min(maxX - 4, Math.ceil(text.length * 9.5 * scale * 0.56) + 6);
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

function LiveReadout({ rig, slot, scale }: { rig: Rig; slot: MicSlot; scale: number }) {
  const pose = rig.pose[slot];
  const blocked = rig.blocked[slot];
  const ctx = rig.ctx[slot];
  const surfaceId = rig.surfaceId;
  const lineId = rig.lineId;
  const surfaceLabel = rig.lesson.model.surfaces.find((s) => s.id === surfaceId)?.label ?? '';
  const lineLabel = rig.lesson.model.lines.find((l) => l.id === lineId)?.label ?? '';
  const surface = rig.body[slot].mount === 'surface';
  const props = useAnimatedProps(() => {
    const r = deriveReadouts(ctx, pose.value, surfaceId, lineId);
    const b = blocked.value as { label: string } | null;
    const dist = `${slot} · ${fmtLen(Math.abs(r.distance))} ${r.distance >= 0 ? 'from' : 'behind'} ${surfaceLabel} · ${fmtLen(r.radial)} off ${lineLabel}${surface ? '' : ` · aim ${fmtAngle(r.offAxis)}`}`;
    const t = b ? `${dist} · ✕ ${b.label}` : dist;
    return { text: t, defaultValue: t } as never;
  });
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
  const base = useMemo(() => baseXf ?? fitXform(view, box, w, h, mini ? 2 : PAD), [baseXf, view, box, w, h, mini]);
  const xf = useSharedValue<ViewXform>(base);
  useEffect(() => {
    xf.value = base;
  }, [base, xf]);
  const textScale = useStageTextScale();
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
  const labels = useMemo(() => (mini || !showLabels ? [] : art.labels(view, variant)), [mini, showLabels, art, view, variant]);
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
              <Line p1={vec(rig.mics[0]?.pose.p.x ?? 0, vOf(view, rig.mics[0]?.pose.p ?? wedge))} p2={vec(wedge.x, vOf(view, wedge))} color={AMBER} strokeWidth={5} opacity={0.8}>
                <DashPathEffect intervals={[30, 20]} />
              </Line>
              <WedgeGlyph at={wedge} view={view} aimAt={rig.mics[0]?.pose.p ?? wedge} />
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
      {!mini && interactive && showLive ? (
        <View pointerEvents="none" style={styles.liveWrap}>
          {micsShown.map((m) => (
            // Keyed by the commit count: a move made from React (a fader, a zone
            // jump) re-seeds the text; a drag updates it on the UI thread.
            <LiveReadout key={`live:${m.slot}:${rig.version}`} rig={rig} slot={m.slot} scale={textScale} />
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

/** A floor monitor wedge (generic), drawn facing `aimAt`. */
function WedgeGlyph({ at, view, aimAt }: { at: Vec3; view: ViewId; aimAt: Vec3 }) {
  const u = at.x;
  const v = vOf(view, at);
  const ang = Math.atan2(vOf(view, aimAt) - v, aimAt.x - u);
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
  const grille = useMemo(() => {
    const p = Skia.Path.Make();
    if (view === 'top') p.addRRect(Skia.RRectXY(Skia.XYWHRect(120, -250, 28, 500), 8, 8));
    return p;
  }, [view]);
  return (
    <Group transform={[{ translateX: u }, { translateY: v }, { rotate: view === 'top' ? ang : 0 }]}>
      <Path path={cab} color="#24262c" />
      <Path path={cab} style="stroke" strokeWidth={6} color="#5d616c" />
      <Path path={grille} color="#0f1013" />
    </Group>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', left: 0, top: 0 },
  labelText: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
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
  viewTag: { position: 'absolute', right: 6, bottom: 4, color: colors.textMuted, fontFamily: fonts.oswaldMedium, letterSpacing: 1.2 },
});

