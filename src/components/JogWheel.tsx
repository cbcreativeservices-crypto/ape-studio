/**
 * JogWheel — an SSL-style dished jog wheel (owner 2026-08-01; rebuilt for
 * realism 2026-09-05 against the owner's hardware reference photos —
 * docs/design/JOG_WHEEL_REFERENCE_2026_09_05.md, blueprint
 * docs/design/JOG_WHEEL_BLUEPRINT_2026_09_05.md).
 *
 * `JogDial` is the SMALL wheel on the Dashboard — purely an OPENER (owner
 * 2026-08-06): a tap (on RELEASE) opens `JogOverlay`, the big centred wheel
 * that is the actual turn control. Once it is open, a NEW drag anywhere on the
 * overlay turns it (angle about the wheel centre); it steps topics in click
 * DETENTS with a Rigid haptic (no sound), spins endlessly (the topic index
 * wraps, no end-stops). The ✕, or any tap that is not a turning drag, commits
 * + closes. The open state sits on a light scrim so it reads as modal.
 *
 * THE OBJECT (Skia): a low, heavy, matte sandblasted-black puck standing proud
 * of the rack panel, seen very slightly from above so a crescent of cylinder
 * wall shows under the face, seated in a near-black collar with a soft contact
 * shadow falling down-right, carrying one concave finger dish. The light is
 * WORLD-FIXED — an overhead key 30° to the viewer's left, the app's global
 * convention — so the dish's dark occlusion crescent is always on its
 * upper-left inner wall and its thin lit lip on its lower-right rim at every
 * rotation angle: the dish geometry orbits with the spin but its shading is
 * computed relative to the light. No hot spot anywhere (a specular highlight
 * was removed 2026-08-05 because it read wrong): broad low-contrast diffuse
 * gradients + a static sandblast sparkle. The knob is the darkest object on
 * the panel. Rendering: two cached rasters (src/components/jogwheel/) drawn as
 * two Skia <Image> nodes; the only per-frame dependency on the spin is the
 * dish image's x/y, derived on the UI thread. Idle, it costs nothing.
 *
 * When Skia is unavailable (web without CanvasKit) the original three-layer
 * react-native-svg stack renders instead — never a blank.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type AccessibilityActionEvent,
} from 'react-native';
import { runSoon } from '../lib/afterInteractions';
import Reanimated, {
  Easing as REasing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';
import { useAnimationsAllowed } from '../features/settings/a11y';
import { JogSkiaStack } from './jogwheel/JogSkia';
import { getJogRasters, prewarmJogRasters } from './jogwheel/jogRaster';

/** Skia draws through CanvasKit on web; index.ts loads it before the app, so
 *  on the :8090 preview the Skia path is what renders. If it is ever missing
 *  the SVG stack below is the fallback rather than a blank (same guard shape
 *  as WaveformScreen). Native is always Skia. */
const SKIA_READY =
  Platform.OS !== 'web' ||
  (typeof globalThis !== 'undefined' && !!(globalThis as { CanvasKit?: unknown }).CanvasKit);

// 8 clicks per full turn (owner 2026-08-06, was 7): one more detent + haptic
// per rotation, so a full turn scrolls one topic further.
const DETENT_DEG = 360 / 8; // 45° per click
/** The big overlay wheel sits BELOW screen centre by this much (owner
 *  2026-08-06) so the topic title + % in the Current Topic container stay in
 *  view. The dial's angle math shifts its centre by the same amount so the
 *  dimple still tracks exactly under the finger. */
const OVERLAY_Y_OFFSET = 46;
/** Min time between topic switches (owner 2026-08-01) — slow enough to WATCH the
 *  topic change behind the wheel, and no rapid-fire haptic "vibration". Faster
 *  spins just drop the excess steps; the wheel keeps turning smoothly. */
const MIN_STEP_MS = 300;
/** Per-event angular delta (deg) above which the UI-thread spring engages to
 *  fill frames between touch events; below it, a direct set suffices and no
 *  animation object is created (owner 2026-08-16: engage only when needed). */
const FAST_SPIN_DEG = 1.5;
/** The stiff tracking spring (~20 ms response, velocity carried across
 *  retargets, clamped — never overshoots the finger). */
const TRACK_SPRING = { stiffness: 1800, damping: 90, mass: 1, overshootClamping: true };

// ── Motion additions (2026-09-05) ──────────────────────────────────────────
/** For this long after grant every move takes the spring path regardless of
 *  |d|, so the spring starts from the 50 ms glide's current value instead of
 *  the first move event snapping the remaining glide distance. */
const GRAB_GRACE_MS = 80;
/** Critically damped (ζ = 1, ~160 ms): a mechanical seat into the detent,
 *  never a bounce. */
const SETTLE_SPRING = { stiffness: 600, damping: 49, mass: 1, overshootClamping: true };
/** A release faster than this (deg/s) is a flick and coasts. */
const COAST_MIN_DPS = 180;
/** Constant deceleration of the coast (deg/s²). */
const COAST_DECEL = 2400;
const COAST_MAX_MS = 320;
const COAST_MIN_MS = 90;
/** A finger that paused this long before lifting is not a flick. */
const VEL_STALE_MS = 80;
const VEL_MIN_DT_MS = 4;
const VEL_CLAMP_DPS = 720;
/** The overlay comes up like a lamp on a panel: opacity 0→1, scale 0.97→1. */
const PRESENCE_IN_MS = 140;
const PRESENCE_OUT_MS = 110;
/** The dimple orbit radius of the SVG fallback (fraction of the box). */
const SVG_ORBIT = 0.24;
const SVG_REST_RAD = -Math.PI / 6;

/** How far an OUTSIDE press may slide and still count as a dismiss rather
 *  than a turn (owner 2026-09-20). A thumb landing on a dark screen rarely
 *  lands still; 8 px turned too many close-taps into a topic change. */
const DISMISS_SLOP = 22;

/** increment/decrement step one detent; activate (double-tap) and magicTap
 *  (two-finger double-tap) close the wheel — before these a screen-reader user
 *  had no way out of the full-screen adjustable surface except finding the ✕
 *  (tester report 2026-09-27, build 32: "Locked screen. Data wheel is froze."). */
const A11Y_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }, { name: 'magicTap' }];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/* ══ SVG FALLBACK (no CanvasKit) ═══════════════════════════════════════════ */

/** FIXED base of the wheel — rim + matte-black concave disc. */
function JogBase({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogBody" cx="50%" cy="50%" r="62%">
          <Stop offset="0" stopColor="#26262b" />
          <Stop offset="0.6" stopColor="#141418" />
          <Stop offset="0.86" stopColor="#0b0b0e" />
          <Stop offset="1" stopColor="#050506" />
        </RadialGradient>
        {/* Outer depth — a dark vignette hugging the rim so the knob reads as a
            raised object lifted off the background. */}
        <RadialGradient id="jogEdge" cx="50%" cy="50%" r="50%">
          <Stop offset="0.78" stopColor="#000000" stopOpacity="0" />
          <Stop offset="0.97" stopColor="#000000" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c - 1} fill="#08080a" />
      <Circle cx={c} cy={c} r={c - 3} fill="url(#jogBody)" />
      <Circle cx={c} cy={c} r={c - 1} fill="url(#jogEdge)" />
      <Circle cx={c} cy={c} r={c - 1} stroke="#34343a" strokeWidth={1} fill="none" opacity={0.6} />
    </Svg>
  );
}

/** FIXED depth shading — just soft cast shadows (owner 2026-08-05: the light
 *  gray specular highlight was removed; it read wrong). These do not orbit; only
 *  the physical dimple below moves. */
function JogLighting({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="jogSh" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={c} cy={size * 0.72} rx={size * 0.4} ry={size * 0.28} fill="url(#jogSh)" />
      <Ellipse cx={c} cy={size * 0.89} rx={size * 0.19} ry={size * 0.05} fill="#000000" opacity={0.34} />
    </Svg>
  );
}

/** The finger dimple — a CONCAVE dish the finger sits DOWN into (owner
 *  2026-08-05). Lit from the top: the near (top) inner wall is in shadow, light
 *  pools on the far (lower) wall, and a thin lip catches light on the far
 *  (lower) rim — the inverse of a raised bump. Its shading is authored in world
 *  orientation and the layer TRANSLATES along the orbit (never rotates), so
 *  the crescent stays on the upper side at every angle. */
function JogDimple({ size }: { size: number }) {
  const c = size / 2;
  const dR = size * 0.12;
  // Finger dimple at 2 o'clock at rest (owner 2026-08-01). Orbit radius ~0.24·s;
  // 60° clockwise from top → (c + r·sin60, c − r·cos60).
  const dCx = c + size * SVG_ORBIT * 0.866;
  const dCy = c - size * SVG_ORBIT * 0.5;
  return (
    <Svg width={size} height={size}>
      <Defs>
        {/* Concave bowl: light pooled toward the far/lower wall, deep at the rim.
            Capped at #1c1c20 — a matte dish never reads wet. */}
        <RadialGradient id="jogDish" cx="50%" cy="66%" r="72%">
          <Stop offset="0" stopColor="#1c1c20" />
          <Stop offset="0.5" stopColor="#141416" />
          <Stop offset="1" stopColor="#040405" />
        </RadialGradient>
      </Defs>
      {/* Recessed outer ring — a hair of raised lip framing the dish. */}
      <Circle cx={dCx} cy={dCy} r={dR + size * 0.007} fill="#0a0a0d" />
      <Circle cx={dCx} cy={dCy} r={dR} fill="url(#jogDish)" />
      {/* Near-rim occlusion — the top inner wall shades the bowl (depth). */}
      <Ellipse cx={dCx} cy={dCy - dR * 0.52} rx={dR * 0.9} ry={dR * 0.44} fill="#000000" opacity={0.5} />
      {/* Faint light pooling on the far inner wall. */}
      <Ellipse cx={dCx} cy={dCy + dR * 0.48} rx={dR * 0.55} ry={dR * 0.24} fill="#ffffff" opacity={0.05} />
      {/* Thin lip glint on the LOWER outer edge (the far rim catching the light). */}
      <Ellipse cx={dCx} cy={dCy + dR * 0.98} rx={dR * 0.5} ry={dR * 0.11} fill="#6a6a76" opacity={0.5} />
    </Svg>
  );
}

// (Tick-ring experiment removed — owner 2026-08-16: the wheel stays a clean
// SSL-style dial; only the dimple marks rotation.)

/** The moving dimple layer of the SVG fallback. When `spin` is provided (the
 *  overlay) the dish TRANSLATES along its orbit on the UI thread via
 *  Reanimated — so it tracks the thumb with no bridge lag (owner 2026-08-05)
 *  and its shading stays world-fixed. The small dial passes no spin. */
function JogDimpleLayer({ size, spin }: { size: number; spin?: SharedValue<number> }) {
  const rho = size * SVG_ORBIT;
  const style = useAnimatedStyle(() => {
    const th = (((spin ? spin.value : 0) - 30) * Math.PI) / 180;
    return {
      transform: [
        { translateX: rho * (Math.cos(th) - Math.cos(SVG_REST_RAD)) },
        { translateY: rho * (Math.sin(th) - Math.sin(SVG_REST_RAD)) },
      ],
    };
  }, [rho, spin]);
  if (!spin) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <JogDimple size={size} />
      </View>
    );
  }
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <JogDimple size={size} />
    </Reanimated.View>
  );
}

function JogSvgStack({ size, spin }: { size: number; spin?: SharedValue<number> }) {
  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <JogBase size={size} />
      </View>
      {/* Fixed lighting sits above the disc but does NOT move. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <JogLighting size={size} />
      </View>
      {/* Only the dimple moves (UI-thread when driven by the overlay). */}
      <JogDimpleLayer size={size} spin={spin} />
    </>
  );
}

/* ══ THE KNOB ══════════════════════════════════════════════════════════════ */

/** One knob at one size: the Skia puck when CanvasKit/native Skia is there,
 *  the SVG stack otherwise. Memoised on (size, spin) so the Dashboard's live
 *  meter re-renders never reach the canvas. The view is S×S (the face centre
 *  is its centre — the overlay's angle math is unchanged); the Skia canvas
 *  bleeds past it to hold the wall, collar and contact shadow. */
const JogStack = memo(function JogStack({ size, spin }: { size: number; spin?: SharedValue<number> }) {
  const rasters = SKIA_READY ? getJogRasters(size) : null;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {rasters ? <JogSkiaStack rasters={rasters} spin={spin} /> : <JogSvgStack size={size} spin={spin} />}
    </View>
  );
});

/**
 * The small dial — purely an OPENER (owner 2026-08-06): a TAP opens the big
 * overlay wheel, which is the actual turn control. It does not turn anything
 * itself. No press animation: the Dashboard hides it in the same commit the
 * tap opens the wheel, and a real knob neither squashes nor depresses — the
 * honest feedback is the overlay coming up.
 *
 * Opens on RELEASE (onPress) only. It used to open on onPressIn too, promising
 * that the same press could turn the big wheel — it never could: the touch
 * stayed with this Pressable, the overlay's pan surface never saw it, and the
 * drag fell through to the Dashboard's ScrollView, so the page scrolled under
 * a wheel that would not turn (tester report 2026-09-27, build 32: "Locked
 * screen. Data wheel is froze."). Tap to open, then turn with a new drag.
 */
export function JogDial({
  size = 74,
  disabled = false,
  onOpen,
}: {
  size?: number;
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        onOpen();
      }}
      disabled={disabled}
      style={[styles.wrap, { width: size, height: size }, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel="Open the topic wheel"
    >
      <JogStack size={size} />
    </Pressable>
  );
}

/**
 * The big centred wheel — the ACTUAL turn control (owner 2026-08-06). Opened by
 * the small dial; once open, DRAG ANYWHERE on the overlay to turn (angle is
 * measured around the wheel's centre, so a straight drag on any side works), it
 * steps topic detents with a haptic, and the ✕ commits + closes. So does ANY
 * release that was not a turning drag — a tap on the wheel, a tap beside it,
 * or a straight swipe (a scroll attempt) away from it. It used to close only
 * on a still tap OUTSIDE the wheel, so a tap on the wheel did nothing and a
 * scroll attempt turned the topic and left it open (tester report 2026-09-27,
 * build 32: "Locked screen. Data wheel is froze."). A light scrim (0.35 black)
 * sits behind it so the open state reads as modal rather than a live
 * Dashboard that ignores you; the current-topic container still shows
 * through and updates as you turn. Mount it at the screen root so it isn't
 * clipped.
 *
 * Closing is the parent's job (`active` → false): JogOverlay holds no open
 * state of its own, so a parent may close it on blur / Android back simply by
 * running the same handler it passes as `onClose`; the `active` effect below
 * cancels any seat/coast animation and any pending click either way.
 *
 * Under the finger it behaves like a low-mass detented encoder: it is under
 * the finger the instant you touch it (the 50 ms glide, continued — not
 * cancelled — by the first move), tracks 1:1 with no visual notching, clicks
 * through eight Rigid detents per turn, and on release seats into the nearest
 * detent or, on a genuine flick, coasts at most one click further and clicks
 * as it seats — so wheel and topic always agree at rest.
 */
export function JogOverlay({
  active,
  spin,
  onStep,
  onClose,
  disabled = false,
  a11yValueText,
}: {
  active: boolean;
  spin: SharedValue<number>;
  onStep: (dir: -1 | 1) => void;
  onClose: () => void;
  disabled?: boolean;
  /** What the adjustable element announces as its value (e.g. the previewed
   *  topic's name). Optional — without it a screen reader hears "Topic wheel,
   *  adjustable" and nothing about where the wheel is. */
  a11yValueText?: string;
}) {
  const { width, height } = useWindowDimensions();
  // 23% larger than before (owner 2026-08-01), still capped to fit the screen.
  const size = Math.round(Math.min(width * 0.62, height * 0.4) * 1.23);
  // Wheel centre in SCREEN coords — shifted down so the topic title + % stay
  // visible (owner 2026-08-06). Positioned by LAYOUT (absolute top/left), not a
  // transform (a transform offsets the visual but not the touch hit-area).
  const cx = width / 2;
  const cy = height / 2 + OVERLAY_Y_OFFSET;

  const DEAD_PX = 44; // ignore right at the centre (atan2 is unstable there)
  const DIMPLE_OFFSET = 30; // dimple drawn at 2 o'clock; +30 puts it under the finger
  const centerRef = useRef({ x: cx, y: cy });
  centerRef.current = { x: cx, y: cy };
  const lastAngle = useRef(0);
  const accum = useRef(0);
  // Continuous (unbounded) rotation target — finger deltas accumulate here so
  // the wheel never wraps/teleports; spin chases it (owner 2026-08-16 polish).
  const spinTarget = useRef(0);
  const inDead = useRef(false);
  const lastStepAt = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  // Tap-to-close (owner 2026-08-13; widened 2026-09-27): any release that was
  // not a turning drag dismisses the overlay — outside the wheel OR on it (a
  // tap on the wheel used to be ignored, which read as a frozen screen: tester
  // report 2026-09-27, build 32: "Locked screen. Data wheel is froze."). Drags
  // still turn it. Refs so the memoised PanResponder reads live values.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const grantRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  /** This gesture started OFF the wheel. Owner 2026-09-20: a press anywhere
   *  around the wheel must close it, so an outside press is a dismiss until
   *  it proves itself a drag — it does not glide the dimple, and it needs a
   *  frank slide (not an 8 px wobble) before it counts as turning. */
  const outsideRef = useRef(false);
  /** This outside gesture has shown itself to be a straight SWIPE away from /
   *  toward the wheel (radial travel past the slop before any real travel
   *  around it) — someone trying to scroll the page. It never turns the wheel;
   *  its release closes the overlay. Before this, a vertical swipe past 22 px
   *  counted as a turn, changed the topic and left the wheel open (tester
   *  report 2026-09-27, build 32: "Locked screen. Data wheel is froze."). */
  const swipeRef = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  // Read on EVERY render (the PanResponder is memoised with []): the reduce-
  // motion setting and the OS flag hydrate after first paint. SUBSCRIBED
  // (P10b 2026-10-02): the Settings modal's toggle re-renders the wheel, so the
  // ref is current even if nothing else re-renders it. Gesture-driven spin and
  // settle, not a loop — Low-Light does not apply.
  const motionAllowed = useAnimationsAllowed();
  const allowedRef = useRef(true);
  allowedRef.current = motionAllowed;
  // Motion state (2026-09-05).
  const grantAt = useRef(0);
  const springLive = useRef(false);
  const omega = useRef(0); // deg/s, EMA over touch events
  const velAccum = useRef(0); // deg since the last velocity sample
  const lastMoveAt = useRef(0);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearReleaseTimer = () => {
    if (releaseTimer.current != null) {
      clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }
  };

  // Presence: mounted lags `active` by the exit fade so the lamp goes down
  // instead of vanishing. `onClose` semantics are untouched — the commit
  // fires immediately, only the visual lingers.
  const [mounted, setMounted] = useState(active);
  const presence = useSharedValue(active ? 1 : 0);
  const wheelScale = useSharedValue(1);
  const rootStyle = useAnimatedStyle(() => ({ opacity: presence.value }), [presence]);
  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ scale: wheelScale.value }] }), [wheelScale]);

  const angleAt = (px: number, py: number) => {
    const { x, y } = centerRef.current;
    return (Math.atan2(py - y, px - x) * 180) / Math.PI;
  };
  /** Returns whether the step actually fired (false when closed, disabled or
   *  throttled) so the accessibility path only turns the wheel when the topic
   *  really moved — wheel and topic must agree at rest. */
  const step = (dir: -1 | 1): boolean => {
    // Guarded so a stale release timer can never reach the Dashboard after it
    // has committed on close.
    if (!activeRef.current || disabledRef.current) return false;
    const now = Date.now();
    if (now - lastStepAt.current < MIN_STEP_MS) return false; // throttle — slow enough to watch
    lastStepAt.current = now;
    onStepRef.current(dir);
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
    return true;
  };

  /**
   * Release of a confirmed drag: a detented knob cannot rest between detents.
   * Seat into the nearest one (silent when it seats back, one click + one
   * topic step when it falls forward past halfway), or — on a real flick —
   * coast at most ONE detent further at constant deceleration and click as
   * it seats. Detents are relative to the grab (`accum`), as they are while
   * dragging. No `withDecay` (frame-rate dependent) and no per-frame reaction:
   * the click fires from one JS timer as the wheel seats.
   */
  const settle = () => {
    const now = Date.now();
    const allowed = allowedRef.current;
    const w = now - lastMoveAt.current > VEL_STALE_MS ? 0 : omega.current;
    const s = allowed && Math.abs(w) >= COAST_MIN_DPS ? Math.sign(w) : 0;
    const coast = s ? Math.min(1.5 * DETENT_DEG, (w * w) / (2 * COAST_DECEL)) : 0;
    const pEnd = clamp(accum.current + s * coast, -DETENT_DEG, DETENT_DEG); // at most ONE crossing
    const k = Math.round(pEnd / DETENT_DEG); // −1, 0, +1: the detent it seats into
    const travel = k * DETENT_DEG - accum.current;
    const endpoint = spinTarget.current + travel;
    const dir: -1 | 1 = k < 0 ? -1 : 1;
    spinTarget.current = endpoint;
    accum.current = 0;
    springLive.current = false;
    if (Math.abs(travel) < 0.01) return; // already seated (a tap on the wheel, or an exact detent)
    if (!allowed) {
      spin.value = endpoint; // reduced motion: stop dead on the detent
      if (k !== 0) step(dir);
      return;
    }
    // The seat click must SURVIVE step()'s MIN_STEP_MS throttle: a lift within
    // ~190 ms of the previous detent used to schedule the click inside the
    // throttle window, so the wheel visibly seated into a new detent and the
    // topic never stepped (motion judge, 2026-09-05). Wait for the throttle to
    // open, then click — the wheel seats first, the click follows within 300 ms.
    const clickAt = (base: number) => Math.max(base, MIN_STEP_MS - (now - lastStepAt.current) + 5);
    if (s !== 0) {
      // Out-quad IS constant deceleration with initial slope ω: the release
      // is velocity-continuous and frame-rate independent.
      const duration = clamp((1000 * 2 * Math.abs(travel)) / Math.abs(w), COAST_MIN_MS, COAST_MAX_MS);
      spin.value = withTiming(endpoint, { duration, easing: REasing.out(REasing.quad) });
      if (k !== 0) releaseTimer.current = setTimeout(() => step(dir), clickAt(0.8 * duration));
    } else {
      spin.value = withSpring(endpoint, SETTLE_SPRING);
      if (k !== 0) releaseTimer.current = setTimeout(() => step(dir), clickAt(110));
    }
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Claim EVERY touch, disabled or not. The surface is only live while
        // open (the root's pointerEvents), and it covers the whole screen: if
        // it stops claiming when the deck drops to one topic while the wheel is
        // open, nothing under it gets the touch either and there is no way out
        // but the ✕ (tester report 2026-09-27, build 32: "Locked screen. Data
        // wheel is froze."). Disabled only means it will not TURN — a release
        // still closes it.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (_e, g) => {
          clearReleaseTimer();
          const a0 = angleAt(g.x0, g.y0);
          lastAngle.current = a0;
          accum.current = 0;
          lastStepAt.current = 0; // first detent applies immediately
          inDead.current = false;
          grantRef.current = { x: g.x0, y: g.y0 };
          movedRef.current = false;
          swipeRef.current = false;
          {
            const c = centerRef.current;
            outsideRef.current = Math.hypot(g.x0 - c.x, g.y0 - c.y) > sizeRef.current / 2;
          }
          // Disabled: nothing to turn, so no grab glide — the release closes.
          if (disabledRef.current) return;
          const now = Date.now();
          grantAt.current = now;
          lastMoveAt.current = now;
          omega.current = 0;
          velAccum.current = 0;
          springLive.current = false;
          // Elegant grab (owner 2026-08-16): the dimple GLIDES under the finger
          // (short eased turn along the nearest path) instead of teleporting.
          // Unwrap the target to the closest equivalent of the current spin so
          // the glide never takes the long way round. Whatever was running
          // (a settle, a coast) is simply replaced — no cancel, no jump.
          // An outside press is a dismiss until proven a drag — gliding the
          // dimple to meet a finger that is about to lift reads as the wheel
          // twitching at a tap meant to close it.
          if (outsideRef.current) return;
          const current = spin.value;
          let diff = (a0 + DIMPLE_OFFSET - current) % 360;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          spinTarget.current = current + diff;
          // 50ms (owner 2026-08-16: was 130 — read as sluggish): still no
          // teleport pop, but effectively instant.
          spin.value = withTiming(spinTarget.current, { duration: 50, easing: REasing.out(REasing.quad) });
        },
        onPanResponderMove: (_e, g) => {
          if (disabledRef.current || swipeRef.current) return;
          const now = Date.now();
          let promote = false;
          if (!movedRef.current) {
            if (outsideRef.current) {
              // Outside the wheel, only travel AROUND it is a turn. Split the
              // slide from the grant point into radial (toward / away from
              // the centre) and tangential (arc length round it) parts: a
              // straight swipe above or below the wheel — someone trying to
              // scroll — is almost all radial, and closes on release instead
              // of stepping the topic.
              const c = centerRef.current;
              const r0 = Math.hypot(grantRef.current.x - c.x, grantRef.current.y - c.y);
              const r1 = Math.hypot(g.moveX - c.x, g.moveY - c.y);
              let dA = angleAt(g.moveX, g.moveY) - angleAt(grantRef.current.x, grantRef.current.y);
              while (dA > 180) dA -= 360;
              while (dA < -180) dA += 360;
              const radial = Math.abs(r1 - r0);
              const tangential = (Math.abs(dA) * Math.PI * Math.min(r0, r1)) / 180;
              if (radial > DISMISS_SLOP && radial >= tangential) {
                swipeRef.current = true;
                return;
              }
              promote = tangential > DISMISS_SLOP && tangential > radial;
            } else {
              promote = Math.hypot(g.moveX - grantRef.current.x, g.moveY - grantRef.current.y) > 8;
            }
          }
          if (promote) {
            movedRef.current = true; // it's a drag (rotation), not a tap
            if (outsideRef.current) {
              // Promoted to a turn: run the grab glide now, the one the
              // outside press deferred, so the dimple still comes to the finger.
              const cur = spin.value;
              let dd = (angleAt(g.moveX, g.moveY) + DIMPLE_OFFSET - cur) % 360;
              if (dd > 180) dd -= 360;
              if (dd < -180) dd += 360;
              spinTarget.current = cur + dd;
              spin.value = withTiming(spinTarget.current, { duration: 50, easing: REasing.out(REasing.quad) });
              lastAngle.current = angleAt(g.moveX, g.moveY);
              accum.current = 0;
            }
            // One Soft tick as the grab is confirmed — never on grant, so a tap
            // on the wheel and a tap-outside-to-close stay silent.
            if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
          }
          // Not yet a turning drag: nothing turns and nothing steps, so a press
          // that lifts inside the slop is purely a close — it can never change
          // the topic on its way out.
          if (!movedRef.current) return;
          const { x, y } = centerRef.current;
          if (Math.hypot(g.moveX - x, g.moveY - y) < DEAD_PX) {
            inDead.current = true;
            return;
          }
          const a = angleAt(g.moveX, g.moveY);
          if (inDead.current) {
            inDead.current = false;
            lastAngle.current = a; // re-anchor detents without a jump
            lastMoveAt.current = now;
            velAccum.current = 0;
            return;
          }
          let d = a - lastAngle.current;
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          lastAngle.current = a;
          // Angular velocity (per touch event, not per frame): an EMA of the
          // delta since the last sample, clamped; sub-4 ms samples are pooled.
          velAccum.current += d;
          const dt = now - lastMoveAt.current;
          if (dt >= VEL_MIN_DT_MS) {
            const inst = clamp((velAccum.current / dt) * 1000, -VEL_CLAMP_DPS, VEL_CLAMP_DPS);
            omega.current = 0.5 * omega.current + 0.5 * inst;
            velAccum.current = 0;
            lastMoveAt.current = now;
          }
          // High-refresh tracking, ENGAGED ONLY WHEN NEEDED (owner 2026-08-16,
          // conserve app speed): slow/fine movement is already smooth at JS
          // event rate, so it gets a free direct set — no animation object at
          // all. Only FAST motion (big per-event delta, where 60Hz reads as
          // coarse on a high-refresh display) engages the stiff UI-thread
          // spring that fills the frames between events (~20ms response,
          // velocity carried across retargets, clamped — never overshoots the
          // finger). Two additions (2026-09-05): inside the grab grace window
          // the spring path CONTINUES the glide instead of snapping it, and
          // once engaged in a gesture the spring stays engaged (hysteresis) so
          // the end of a fast spin has no hitch. Nothing runs between gestures
          // or when the overlay is closed (it unmounts).
          spinTarget.current += d;
          const useSpring = springLive.current || Math.abs(d) >= FAST_SPIN_DEG || now - grantAt.current < GRAB_GRACE_MS;
          if (useSpring) {
            springLive.current = true;
            spin.value = withSpring(spinTarget.current, TRACK_SPRING);
          } else {
            spin.value = spinTarget.current;
          }
          accum.current += d;
          while (accum.current >= DETENT_DEG) {
            accum.current -= DETENT_DEG;
            step(1);
          }
          while (accum.current <= -DETENT_DEG) {
            accum.current += DETENT_DEG;
            step(-1);
          }
        },
        onPanResponderRelease: () => {
          if (movedRef.current) {
            settle();
            return;
          }
          // ANY release that was not a turning drag = dismiss: a tap on the
          // wheel, a tap beside it, a straight swipe (scroll attempt), or any
          // touch while disabled. Only a confirmed turn keeps it open (tester
          // report 2026-09-27, build 32: "Locked screen. Data wheel is froze.").
          if (activeRef.current) onCloseRef.current();
        },
        onPanResponderTerminate: () => {
          // The system took the touch mid-drag: still seat the wheel.
          if (movedRef.current) settle();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Open / close presence (2026-09-05). Instant under reduced motion.
  useEffect(() => {
    if (active) {
      clearReleaseTimer();
      springLive.current = false;
      setMounted(true);
      if (allowedRef.current) {
        presence.value = 0;
        wheelScale.value = 0.97;
        presence.value = withTiming(1, { duration: PRESENCE_IN_MS, easing: REasing.out(REasing.cubic) });
        wheelScale.value = withTiming(1, { duration: PRESENCE_IN_MS, easing: REasing.out(REasing.cubic) });
      } else {
        presence.value = 1;
        wheelScale.value = 1;
      }
      return;
    }
    // Close: nothing may keep moving or click after the Dashboard has
    // committed goTo(scrollIdxRef.current).
    cancelAnimation(spin);
    clearReleaseTimer();
    springLive.current = false;
    if (!mounted) return; // initial mount while closed — nothing to fade
    if (allowedRef.current) {
      wheelScale.value = withTiming(0.985, { duration: PRESENCE_OUT_MS, easing: REasing.in(REasing.quad) });
      presence.value = withTiming(0, { duration: PRESENCE_OUT_MS, easing: REasing.in(REasing.quad) }, (finished) => {
        'worklet';
        if (finished) runOnJS(setMounted)(false);
      });
    } else {
      presence.value = 0;
      setMounted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Pre-warm the big raster after the Dashboard's first paint, so the first
  // open never waits for a synchronous build (a window-size change is just a
  // new cache key).
  useEffect(() => {
    if (!SKIA_READY) return;
    // Idle, not a microtask (InteractionManager never waited — RN research
    // 2026-10-04); a 1 s ceiling keeps the first open warm.
    const task = runSoon(() => prewarmJogRasters(size), { idleTimeoutMs: 1000 });
    return () => task.cancel();
  }, [size]);

  // Unmount: no late click, no orphaned animation.
  useEffect(
    () => () => {
      clearReleaseTimer();
      cancelAnimation(spin);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const closeKey = () => {
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  };

  const onA11yAction = (e: AccessibilityActionEvent) => {
    const name = e.nativeEvent.actionName;
    // Double-tap / magic tap = the ✕ — works even while disabled, so the
    // screen-reader path always has a way out.
    if (name === 'activate' || name === 'magicTap') {
      if (activeRef.current) closeKey();
      return;
    }
    const dir: -1 | 1 | 0 = name === 'increment' ? 1 : name === 'decrement' ? -1 : 0;
    if (dir === 0) return;
    // Turn the wheel only when the topic actually stepped: a throttled or
    // disabled swipe used to advance spinTarget anyway, so the dimple drifted
    // a detent away from the topic it was showing.
    if (!step(dir)) return;
    spinTarget.current += dir * DETENT_DEG;
    spin.value = allowedRef.current ? withSpring(spinTarget.current, SETTLE_SPRING) : spinTarget.current;
  };

  if (!mounted) return null;
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, styles.overlay, rootStyle]} pointerEvents={active ? 'auto' : 'none'}>
      {/* The wheel is purely visual — the surface below drives it. Drawn FIRST
          (the pan surface and the ✕ are transparent, so order costs nothing
          visually) because react-native-web ignores pointerEvents on the Skia
          canvas: a later sibling in the tree would swallow drags that start on
          the wheel. */}
      <Reanimated.View
        pointerEvents="none"
        style={[styles.wheelBox, { left: cx - size / 2, top: cy - size / 2, width: size, height: size }, wheelStyle]}
      >
        <JogStack size={size} spin={spin} />
      </Reanimated.View>
      {/* Full-screen turn surface — drag anywhere to rotate the wheel; any
          release that was not a turn closes it. Live from the first frame of
          the open; inert during the exit fade (the root's pointerEvents). For
          assistive tech it is an adjustable control: increment/decrement step
          one detent, activate / magic tap close. */}
      <View
        {...pan.panHandlers}
        style={StyleSheet.absoluteFill}
        // Without `accessible` a <View> is not an element on iOS, so the role,
        // the label and the two actions below reached nothing (pass 5 · W17).
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Topic wheel"
        accessibilityValue={a11yValueText ? { text: a11yValueText } : undefined}
        accessibilityHint={Platform.OS === 'web' ? undefined : 'Swipe up or down to change topic. Double-tap to close.'}
        accessibilityActions={A11Y_ACTIONS}
        onAccessibilityAction={onA11yAction}
      />
      {/* ✕ commits the selection + closes; hit-area matches the visual. A
          later sibling, so higher z — it still wins taps on itself. */}
      <Pressable
        onPress={closeKey}
        hitSlop={18}
        style={[styles.closeKey, { left: cx + size / 2 - 18, top: cy - size / 2 - 12 }]}
        accessibilityRole="button"
        accessibilityLabel="Close the topic wheel"
      >
        <Text style={styles.closeX}>✕</Text>
      </Pressable>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  // A LIGHT scrim (was no dim, owner 2026-08-01): undimmed, the Dashboard
  // looked live while the full-screen surface swallowed every touch — it read
  // as a frozen screen (tester report 2026-09-27, build 32: "Locked screen.
  // Data wheel is froze."). 0.35 black says "modal" while the current-topic
  // container behind stays readable and still changes as you turn. It fades
  // with the root's presence opacity, and appears instantly under Reduce
  // Motion like the rest of the overlay.
  overlay: { alignItems: 'center', justifyContent: 'center', zIndex: 60, backgroundColor: 'rgba(0,0,0,0.35)' },
  wheelBox: { position: 'absolute', pointerEvents: 'none' },
  // ✕ close key at the wheel's top-right corner (owner 2026-08-06) — the one
  // control on the otherwise touch-transparent overlay, so a stuck-open wheel
  // can always be dismissed. Re-cut 2026-09-05 as a square matte console key
  // on the same light ladder as the knob (HUB_LIGHT rung 3 top rim, rung 5
  // bottom shadow, a 1.5 px contact shadow): nothing on a real transport
  // section is a round floating chip with a specular rim.
  closeKey: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1b1e',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    borderLeftColor: 'rgba(0,0,0,0.30)',
    borderRightColor: 'rgba(0,0,0,0.30)',
    borderBottomColor: 'rgba(0,0,0,0.45)',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 2,
  },
  closeX: { fontSize: 15, lineHeight: 18, color: '#d5d8de', fontWeight: '600' },
});
