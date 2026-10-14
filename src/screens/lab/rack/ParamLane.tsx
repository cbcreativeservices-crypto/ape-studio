/**
 * ParamLane — the Rack Unit's one shared channel fader, pinned in the dock and
 * BOUND to whichever fader param the student selected ("tap the legend, ride
 * the fader"). DragSlider itself is untouched at its 30 call sites.
 *
 * THREADS (owner 2026-10-14: "the slider smoothly always moved with finger…
 * the slider is the main control… never causes the user any pause or
 * distraction"). The finger is tracked by a Gesture Handler PAN whose
 * callbacks are WORKLETS: they run on the UI thread and write the cap's
 * shared value (capV) there, so the cap follows the finger every frame
 * whatever the lab's JS is doing. (Until 2026-10-14 the lane used a
 * PanResponder: its callbacks run on the JS thread, so on a busy lab the cap
 * stalled with the page re-render — measured up to 160 px behind the finger
 * on the emulator.) The JS thread only hears about the touch:
 *   • the grab (jump to the finger) — delivered to the page at once;
 *   • moves — through laneFeed, which hands the page at most ONE value per
 *     ~16 ms (always the newest);
 *   • the release — with the value computed on the UI thread from WHERE THE
 *     FINGER LIFTED (the release event's own position), delivered at once.
 *     A flick to an end lands at the end; it used to land wherever the last
 *     move the JS thread got round to processing left it (3–42%).
 * The LEVEL lane's lit groove is drawn from capV too, so the fill and the cap
 * never separate mid-drag. At rest the cap is the page's own value, so a
 * stepped fader settles on its step.
 *
 * Touch math (laneEdgeGuard.ts, its touch functions are worklet-safe): a tap
 * jumps the cap to the finger (laneValueAt, inside the edge-guard insets); a
 * drag is anchored at the UNCLAMPED grab position (laneRawAt) so the cap waits
 * in an end zone until the finger reaches it, then rides under it. Positions
 * are the handler's own view-local x (e.x), which never re-bases when the
 * finger leaves the lane — and not the event's `translationX`: Android's pan
 * resets its translation origin when it ACTIVATES (the first move), which
 * would drop that first move from a quick flick. (On WEB — the browser
 * preview, where worklets run on the JS thread anyway — the ride and the lift
 * point come from the pan's raw pointer events instead: its web pan misses the
 * move that leaves the lane and the release itself.) One finger only
 * (maxPointers 1): a second finger on the lane cancels the ride rather than
 * moving it, and a finger elsewhere on the glass is never seen by this pan.
 *
 * RESKINNED AS HARDWARE (owner design pass 2026-09-11): "we are teaching
 * audio… part of learning is getting comfortable with how things LOOK and are
 * laid out." This one component is every rack lab's continuous control —
 * foundations, digital, EQ, meter, tube, wave, the FX family, modular, the
 * oscillator family and more all bind it — so this single file is where a
 * student's hands learn what a console fader looks like:
 *   • a recessed travel SLOT with printed tick stops, not a progress track;
 *   • a brushed-metal CAP with grip grooves and a coloured indicator line
 *     (the material language of PresetFader's cap and the mixing GearStrip),
 *     riding ABOVE the slot the way a real cap stands proud of the panel;
 *   • the label and mono readout printed on the faceplate, backed so they
 *     never vanish under the cap (design pass 2026-08-31, kept).
 *
 * The LEVEL ramp fill stays, per the owner's 2026-09-05 standard (LEVEL lanes
 * show the amplitude ramp) — but it now glows INSIDE the recessed slot, a lit
 * groove rather than a bar-meter face, so the lane cannot be misread as a
 * meter (the no-fake-meters rule is about what a thing CLAIMS to be).
 *
 * Owner ruling 2026-09-11 (mid design pass): DOUBLE-TAP RETURNS HOME — unity
 * for faders, centre for panners. The lane is parameter-agnostic, so "home"
 * is the bound param's declared `home` position; a param that declares none
 * simply has no double-tap behaviour (a delay time has no unity to return to,
 * and inventing one would be a lie).
 *
 * The lane lives OUTSIDE the scroll well, so scroll contention is structurally
 * gone; no scroll-lock plumbing needed here. The pan activates on the first
 * move (minDistance 0), before any native scroller's touch slop, and an active
 * Gesture Handler gesture cancels the JS responders under it. The lane wraps
 * itself in a GestureHandlerRootView: in FULL SCREEN it is mounted inside a
 * React Native Modal, which is its own native root on Android (App.tsx's root
 * note); nested inside the app's root the inner one is inert.
 *
 * EDGE GUARD (owner, Pixel 7 Pro, 2026-10-04: "when grabbing at extreme ends
 * wants to scroll (swipe gesture) to next screen"): the cap's travel is inset
 * inside the full-width lane so the cap never comes within 40 dp of either
 * window edge — the system back-gesture strips. See laneEdgeGuard.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import { fitValue } from '../../../theme/legibility';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { usePulseStyle } from '../../../features/lab/attentionPulse';
import { FALLBACK_INSETS, LANE_CAP_W, laneDragValue, laneRawAt, laneValueAt } from './laneEdgeGuard';
import { useEdgeGuard } from './useEdgeGuard';
import { createLaneFeed } from './laneFeed';
import { GestureExclusionZone } from '../../../../modules/ape-gesture-exclusion';

const DOUBLE_TAP_MS = 320;
/** The lane hands the page at most one value per this long (≈ one frame). */
const LANE_TICK_MS = 16;
/** A touch that travelled no further than this is a TAP (double-tap → home). */
const TAP_SLOP = 5;
/** A preview lane's cap waits at most this long for its commit to land. */
const HOLD_MS = 1500;
/** Gesture Handler's CANCELLED state (the system or a second finger took the
 *  touch): settle, but never count it as a tap. A plain number for the worklet. */
const CANCELLED: number = State.CANCELLED;
/** The amplitude ramp across the WHOLE slot (blue at 0 → red at full). The
 *  lit groove clips it at the cap, so the tip is always levelColor(cap) —
 *  the same picture rampColors(v) drew stretched over a v-wide fill, but
 *  drawn once and clipped on the UI thread instead of re-rendered per value. */
const FULL_RAMP = rampColors(1, 11);
/** A plain boolean the worklets can read (react-native-web: the browser preview). */
const IS_WEB = Platform.OS === 'web';

export function ParamLane({
  label,
  value,
  readout: pageReadout,
  onChange,
  onCommit,
  format,
  onDragActive,
  tint,
  level,
  home,
}: {
  label: string;
  /** 0..1 lane position. */
  value: number;
  /** Formatted value string (mono, right side of the lane). */
  readout: string;
  onChange: (v: number) => void;
  /** A PREVIEW lane (rackTypes `onCommit`): called once with the value the
   *  finger let go at; `onChange` then only previews. */
  onCommit?: (v: number) => void;
  /** The param's own words for a value — printed live on a preview lane. */
  format?: (v: number) => string;
  /** True while the finger is riding the lane — drives the in-glass drag tag. */
  onDragActive?: (active: boolean) => void;
  /** Thumb/fill tint (default amber). */
  tint?: string;
  /** This lane sets a LEVEL (level, input/drive, gain, amplitude…): fill =
   *  the amplitude ramp climbing to the level's colour, thumb + readout in
   *  that colour. Overrides `tint`. */
  level?: boolean;
  /** The param's neutral position (0..1): unity for a gain, centre for a pan.
   *  Double-tap returns here (owner ruling 2026-09-11). Omit for params that
   *  have no honest home. */
  home?: number;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onActiveRef = useRef(onDragActive);
  onActiveRef.current = onDragActive;
  const homeRef = useRef(home);
  homeRef.current = home;
  const labelRef = useRef(label);
  labelRef.current = label;
  const lastTapRef = useRef(0);
  const pulseStyle = usePulseStyle();

  // Edge guard: the cap's travel insets, from the lane's measured frame in
  // its window (laneEdgeGuard.ts). The dock fallback holds until measured.
  const { ref: laneRef, ins, measure: measureEdges } = useEdgeGuard({ capW: CAP_W, fallback: FALLBACK_INSETS });

  // The touch geometry, readable on the UI thread: the lane's outer width
  // (onLayout) and the edge-guard insets (measured on the JS side, copied).
  const laneW = useSharedValue(0);
  const insL = useSharedValue(ins.l);
  const insR = useSharedValue(ins.r);
  useEffect(() => {
    insL.value = ins.l;
    insR.value = ins.r;
  }, [ins, insL, insR]);

  // The CAP: written by the gesture worklets on the UI thread while a finger
  // is on the lane; the page's own value at rest.
  const capV = useSharedValue(Math.max(0, Math.min(1, value)));
  const travelW = useSharedValue(0);
  // One touch's UI-thread state: where it went down (lane-local x), the
  // unclamped anchor there, whether the lane was measured when it went down,
  // whether it travelled past the tap slop, and whether onEnd already
  // delivered the release.
  const grabX = useSharedValue(0);
  const base = useSharedValue(0);
  const armed = useSharedValue(false);
  const moved = useSharedValue(false);
  const ended = useSharedValue(false);
  const touching = useSharedValue(false);
  // Web only: the grabbing pointer and its latest x (see IS_WEB below).
  const touchId = useSharedValue(-1);
  const liftX = useSharedValue(0);
  const dragging = useRef(false);
  const [rest, setRest] = useState(0);
  // A PREVIEW lane (`onCommit` given): the page does not re-render while the
  // finger moves, so the lane prints the bound param's own words for the
  // finger's value itself, and commits once on release.
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const formatRef = useRef(format);
  formatRef.current = format;
  const [live, setLive] = useState<string | null>(null);
  // A preview lane's commit can land LATER than the release: the miking rig
  // glides a far move over a few frames and commits when the mic arrives.
  // The cap holds where the finger let go until the page's value moves (or
  // HOLD_MS passes) — it used to snap back to the old value for the whole
  // glide and then jump forward, so a flick read as lost (live emulator
  // retest 2026-10-14).
  const valueRef = useRef(value);
  valueRef.current = value;
  const held = useRef<{ from: number; t: ReturnType<typeof setTimeout> } | null>(null);
  const releaseHold = useRef(() => {
    if (held.current) clearTimeout(held.current.t);
    held.current = null;
  }).current;
  const feed = useRef(
    createLaneFeed({
      deliver: (v) => {
        onChangeRef.current(v);
        if (onCommitRef.current && formatRef.current) setLive(formatRef.current(v));
      },
      // One tick about a frame long (16 ms), once per burst of moves — never
      // a chain (nothing re-schedules itself); the release cancels it and
      // delivers at once. (A timer, not a rAF: a rAF with a cancel reads as a
      // loop to the motion ratchets — patternP10 / P10b.)
      schedule: (cb) => setTimeout(cb, LANE_TICK_MS),
      cancel: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    }),
  ).current;
  /** The finger is gone (lifted, or the touch was taken): deliver what is
   *  pending, commit a preview lane, hand the cap back to the page. */
  const settle = useRef(() => {
    feed.end();
    const last = feed.latest();
    if (onCommitRef.current && last != null) {
      releaseHold();
      held.current = {
        from: valueRef.current,
        t: setTimeout(() => {
          held.current = null;
          setRest((n) => n + 1);
        }, HOLD_MS),
      };
      onCommitRef.current(last);
    }
    dragging.current = false;
    setLive(null);
    setRest((n) => n + 1);
    onActiveRef.current?.(false);
  }).current;
  // An UNMOUNT mid-drag (the bound fader vanished, the page changed under the
  // finger) fires no release: settle here, so the pending value is delivered
  // now rather than by a dangling timer, a preview lane still commits what
  // its preview already moved, and the rack's drag state clears.
  // []-deps: unmount only (the G6 rule — `settle` is created once).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    if (dragging.current) settle();
    releaseHold();
  }, []);
  // At rest the cap is the page's value. `touching` closes the gap between a
  // touch-down on the UI thread and its grant reaching the JS thread; `held`
  // keeps a preview lane's cap at the release until its commit lands.
  useEffect(() => {
    if (dragging.current || touching.value) return;
    if (held.current && value === held.current.from) return;
    releaseHold();
    capV.value = Math.max(0, Math.min(1, value));
  }, [value, rest, capV, touching, releaseHold]);
  const capStyle = useAnimatedStyle(() => ({ left: capV.value * Math.max(0, travelW.value - CAP_W) }));
  // The LEVEL lane's lit groove follows the CAP (capV), not the page value,
  // so the fill and the cap never separate mid-drag. The ramp spans the
  // slot's inner width (travel less the slot's pads and 1 dp borders) and the
  // fill clips it.
  const fillStyle = useAnimatedStyle(() => ({ width: `${capV.value * 100}%` }));
  const rampStyle = useAnimatedStyle(() => ({ width: Math.max(0, travelW.value - 2 * SLOT_PAD - 2) }));

  // ── The JS side of a touch (called from the worklets via scheduleOnRN) ──
  /** Touch-down: the cap already jumped on the UI thread; tell the page now. */
  const onGrant = useRef((v: number | null) => {
    releaseHold();
    onActiveRef.current?.(true);
    dragging.current = true;
    if (v != null) feed.grant(v);
  }).current;
  /** A move: the newest value, delivered on the feed's next tick. */
  const onMove = useRef((v: number) => {
    if (dragging.current) feed.move(v);
  }).current;
  /** The finger left the lane. `final` is the value where it LIFTED
   *  (computed on the UI thread from the release event), or null when the
   *  touch was a tap or was taken (cancel): then the last value stands. */
  const onRelease = useRef((final: number | null, wasMoved: boolean, cancelled: boolean) => {
    if (!dragging.current) return; // already settled (an unmount mid-drag)
    if (final != null) feed.move(final);
    settle();
    // Double-tap → home (owner ruling 2026-09-11: unity for faders, centre
    // for panners). Tap semantics on this lane have always been "jump to the
    // finger", so the first tap of the pair jumps and the second snaps home —
    // the net result is home, which is the point.
    if (!wasMoved && !cancelled) {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS && homeRef.current != null) {
        onChangeRef.current(homeRef.current);
        onCommitRef.current?.(homeRef.current);
        AccessibilityInfo.announceForAccessibility?.(`${labelRef.current} reset to home`);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }
  }).current;

  // ── The finger, on the UI thread ──
  const gesture = useMemo(() => {
    /** The value with the finger at lane-local `x` (anchored at the grab). */
    const valueAtX = (x: number): number => {
      'worklet';
      const dx = x - grabX.value;
      if (Math.abs(dx) > TAP_SLOP) moved.value = true;
      return laneDragValue(base.value, dx, laneW.value, { l: insL.value, r: insR.value });
    };
    /** Ride: the cap to the finger now; the page on the feed's next tick. */
    const rideTo = (x: number) => {
      'worklet';
      const v = valueAtX(x);
      if (v !== capV.value) {
        capV.value = v;
        scheduleOnRN(onMove, v);
      }
    };
    const pan = Gesture.Pan()
      // Grant on touch-down like the old capture-claim: no travel needed to
      // begin, and a finger that wanders off the lane keeps riding it.
      .minDistance(0)
      .maxPointers(1)
      .shouldCancelWhenOutside(false)
      .onBegin((e) => {
        'worklet';
        touching.value = true;
        moved.value = false;
        ended.value = false;
        liftX.value = e.x;
        const w = laneW.value;
        armed.value = w > 0;
        if (w > 0) {
          const g = { l: insL.value, r: insR.value };
          const v = laneValueAt(e.x, w, g);
          grabX.value = e.x;
          // Anchor the drag UNCLAMPED (laneRawAt): a grab in an end zone
          // must not leave the cap riding ahead of the finger.
          base.value = laneRawAt(e.x, w, g);
          capV.value = v;
          scheduleOnRN(onGrant, v);
        } else {
          scheduleOnRN(onGrant, null);
        }
      })
      .onUpdate((e) => {
        'worklet';
        if (!armed.value || IS_WEB) return;
        rideTo(e.x);
      })
      .onEnd((e, success) => {
        'worklet';
        // A completed drag: the FINAL value is where the finger lifted.
        if (!success || !armed.value) return;
        const v = valueAtX(IS_WEB ? liftX.value : e.x);
        capV.value = v;
        ended.value = true;
        scheduleOnRN(onRelease, v, moved.value, false);
      })
      .onFinalize((e) => {
        'worklet';
        touching.value = false;
        const wasArmed = armed.value;
        armed.value = false;
        // A completed drag already released in onEnd.
        if (ended.value) return;
        const cancelled = e.state === CANCELLED;
        // A FLICK whose lift arrived before the pan activated (a busy UI
        // thread batches the moves — Harmonograph, live emulator retest
        // 2026-10-14): the finger still travelled, so land where it lifted.
        // It used to settle as a tap at the touch-down point.
        if (wasArmed && !cancelled && !IS_WEB && Math.abs(e.x - grabX.value) > TAP_SLOP) {
          const v = valueAtX(e.x);
          capV.value = v;
          scheduleOnRN(onRelease, v, true, false);
          return;
        }
        // A tap (the pan never activated) or a taken touch: settle with the
        // last value.
        scheduleOnRN(onRelease, null, moved.value, cancelled);
      });
    // WEB (the owner's browser preview; worklets run on the JS thread there):
    // Gesture Handler's web pan does not track the pointer on the move that
    // LEAVES the lane, nor on the release — a mouse flick past an end landed
    // short. Its raw pointer events carry the true position, so on web the
    // ride and the lift point come from them. Native reads e.x (above).
    if (IS_WEB) {
      pan
        .onTouchesDown((e) => {
          'worklet';
          const t = e.changedTouches[0];
          if (t) touchId.value = t.id;
        })
        .onTouchesMove((e) => {
          'worklet';
          for (const t of e.changedTouches) {
            if (t.id !== touchId.value) continue;
            liftX.value = t.x;
            if (armed.value) rideTo(t.x);
          }
        })
        .onTouchesUp((e) => {
          'worklet';
          for (const t of e.changedTouches) if (t.id === touchId.value) liftX.value = t.x;
        });
    }
    return pan;
  }, [armed, base, capV, ended, grabX, insL, insR, laneW, liftX, moved, touchId, touching, onGrant, onMove, onRelease]);

  const v = Math.max(0, Math.min(1, value));
  const readout = live ?? pageReadout;
  const c = level ? levelColor(v) : (tint ?? colors.amber);

  return (
    <GestureHandlerRootView style={styles.root}>
    <GestureDetector gesture={gesture}>
    <View
      ref={laneRef}
      style={styles.lane}
      onLayout={(e) => {
        laneW.value = e.nativeEvent.layout.width;
        measureEdges();
      }}
      // `accessible` IS REQUIRED ON iOS (2026-09-17, bug-hunt pass 4). React
      // Native's AccessibilityProps defaults it to FALSE on a View, and iOS
      // drives `isAccessibilityElement` from that prop and nothing else — so
      // everything below, all of which is correct and carefully done, did not
      // exist to VoiceOver. This is the one continuous control of every rack
      // lab in the app (foundations, digital, EQ, meter, tube, wave, FX,
      // modular, oscillator), so the omission silently removed the faders from
      // all of them on iOS. Nine of the codebase's fifteen `adjustable` sites
      // already set it; this was not one.
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}: ${readout}`}
      // The label carries the reading, which VoiceOver/TalkBack do announce —
      // but RNW 0.21 needs aria-valuenow on role=slider, and this is the ONE
      // fader shared by the foundations, digital, EQ, meter, tube, wave, FX,
      // modular and oscillator labs, so the gap propagated everywhere.
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100), text: readout }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-valuetext={readout}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === 'increment' ? 0.05 : -0.05;
        const next = Math.max(0, Math.min(1, v + step));
        onChangeRef.current(next);
        onCommitRef.current?.(next);
      }}
    >
      {/* The recessed travel slot. It stays EMPTY behind the cap on an
          ordinary parameter lane — a fader's slot is a groove the cap slides
          in, not a gauge that fills up. Painting it to the cap position (which
          this did until 2026-09-12) put a progress bar back on the faceplate
          and swallowed the whole reskin: the owner's device read was "fader
          seems to be the same from before", and they were right — the bar was
          the loudest thing on the lane, so the cap read as its edge marker.

          The ONE exception is a LEVEL lane, where the amplitude ramp inside
          the groove is the owner's 2026-09-05 standard and carries real
          information (how hot, in the app-wide colour language) rather than
          restating the cap's position. */}
      {/* Android gesture nav (next build): the whole lane is excluded from the
          system back gesture (48 dp of the 200 dp per-edge allowance).
          Renders nothing on iOS, web and the current store builds — the
          inset travel below is what protects those. */}
      <GestureExclusionZone />
      {/* The cap's TRAVEL: the lane less the edge-guard insets. Slot, scale
          and cap all live inside it, so their percentage geometry is
          unchanged — only the span they share is inset from a window edge. */}
      <View pointerEvents="none" style={[styles.travel, { left: ins.l, right: ins.r }]} onLayout={(e) => (travelW.value = e.nativeEvent.layout.width)}>
      <View pointerEvents="none" style={styles.slot}>
        {/* LEVEL lane only: the lit groove, its width from the CAP (capV on
            the UI thread), clipping one full-slot ramp so its tip is the
            cap's level colour. */}
        {level ? (
          <Animated.View style={[styles.slotFill, fillStyle]}>
            <Animated.View style={[styles.rampSpan, rampStyle]}>
              <LinearGradient colors={FULL_RAMP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </Animated.View>
        ) : null}
      </View>

      {/* Printed tick stops at 0 / ¼ / ½ / ¾ / full travel — the faceplate
          detail that says "fader", engraved, not interactive.

          They mark the CAP's travel, not the SLOT's. Those are different
          lanes (the cap is inset by half its width, the slot by SLOT_PAD), so
          aligning to the slot put the scale up to 4 px away from the pointer
          at each end and dead-on only at centre. It was invisible until
          2026-09-12: the old fill tip landed exactly on the slot ticks, so
          the scale was calibrated to the bar — and then the bar went away,
          leaving the cap as the only thing to read against it. A panel scale
          marks where the cap stops; the slot is allowed to overrun it. */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <View
          key={f}
          pointerEvents="none"
          style={[styles.stop, { left: `${f * 100}%`, marginLeft: CAP_W / 2 - f * CAP_W - 0.5 }]}
        />
      ))}

      {/* The cap: brushed metal, grip grooves, coloured indicator line that
          breathes per the app-wide pulse standard. It overhangs the slot the
          way a real cap stands proud of the panel. */}
      <Animated.View pointerEvents="none" style={[styles.cap, capStyle]}>
        <LinearGradient colors={['#3c3c44', '#26262c', '#303038']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.grip} />
        <Animated.View style={[styles.capLine, { backgroundColor: c }, pulseStyle]} />
        <View style={[styles.grip, { right: 5, left: undefined }]} />
      </Animated.View>
      </View>

      {/* Backed chips (design pass 2026-08-31): at the lane's ends the cap
          sat under same-hue text — the label and value vanished into it. */}
      <Text pointerEvents="none" style={[styles.laneLabel, styles.textBacked]} numberOfLines={1}>
        {label}
      </Text>
      <Text pointerEvents="none" style={[styles.laneValue, styles.textBacked, { color: c }]} {...fitValue(12.5)}>
        {readout}
      </Text>
    </View>
    </GestureDetector>
    </GestureHandlerRootView>
  );
}

const CAP_W = LANE_CAP_W;
const SLOT_PAD = 9; // slot inset from the lane ends

const styles = StyleSheet.create({
  lane: {
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    borderTopColor: '#3a3a42', // caught light on the top edge — panel, not card
    backgroundColor: '#141418',
    overflow: 'hidden',
    justifyContent: 'center',
    // Web: riding the fader must never double as a text-selection gesture.
    userSelect: 'none',
  },
  travel: { position: 'absolute', top: 0, bottom: 0 },
  slot: {
    position: 'absolute',
    left: SLOT_PAD,
    right: SLOT_PAD,
    top: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  slotFill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', opacity: 0.8 },
  rampSpan: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  // The lane's own Gesture Handler root: sized by the lane, never flex:1
  // (the root's default), so the dock's layout is unchanged.
  root: { alignSelf: 'stretch' },
  stop: { position: 'absolute', top: 32, width: 1, height: 5, backgroundColor: '#8b8b95', opacity: 0.45 },
  cap: {
    position: 'absolute',
    top: 6,
    width: CAP_W,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3d3d46',
    overflow: 'hidden',
    justifyContent: 'center',
    // The one element on the lane that stands proud of the panel.
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  grip: { position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  capLine: { alignSelf: 'center', width: 2.5, height: 24, borderRadius: 1.25 },
  laneLabel: {
    position: 'absolute',
    left: 10,
    top: 3,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textSub,
    maxWidth: '46%',
  },
  laneValue: {
    position: 'absolute',
    right: 10,
    top: 3,
    fontFamily: fonts.mono,
    fontSize: 12.5,
    // A long readout shrinks/ends in "…" inside its own half — it never runs
    // over the lane's name (C12 "1 of 5 · the tangent presses…" sat on STEP).
    maxWidth: '50%',
  },
  textBacked: { backgroundColor: 'rgba(15,15,18,0.72)', paddingHorizontal: 4, borderRadius: 4, overflow: 'hidden' },
});
