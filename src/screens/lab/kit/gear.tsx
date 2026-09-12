/**
 * gear.tsx — hardware-faithful lab controls (owner design pass 2026-09-11).
 *
 * WHY THIS EXISTS. The owner, looking at the mixing labs' console: "we are
 * teaching audio, and most audio equipment has fairly common controls and
 * layout. Our users are beginners — part of learning is getting comfortable
 * with how things LOOK and are LAID OUT… our console is switches and buttons,
 * functional, but it creates no familiarity with the gear." A stepper column
 * teaches the parameter; it does not teach the INSTRUMENT. When a student who
 * learned on these labs first stands at a real desk, the fader, the pan pot,
 * the illuminated MUTE and the tape strip at the bottom of the channel should
 * already be old friends.
 *
 * WHAT THIS IS NOT. Not decoration. Every control here is wired to the same
 * real state the steppers drove — nothing renders that is not live (the
 * no-fake-meters rule extends to controls: a knob that does nothing would be
 * a lie with a bezel). And it is not a museum piece: where hardware realism
 * and touch usability fight, usability wins and the loss is noted.
 *
 * ACCESSIBILITY IS NOT NEGOTIABLE HERE. The stepper console this replaces was
 * deliberately "steppers, not drags" (WCAG 2.5.7 — dragging must never be the
 * only way). That property SURVIVES: every dragging control also has visible
 * single-tap nudges, and is a screen-reader `adjustable` with real
 * increment/decrement actions. A blind student adjusts the same fader the
 * sighted student drags — same state, same steps, same announcements.
 *
 * THE RECOGNITION DETAILS this kit is careful about, because they are the
 * curriculum: the fader's dB scale is NOT linear — unity sits about 70% up
 * the travel and the bottom half compresses toward −∞, exactly like a real
 * 100 mm fader; the unity line is emphasised; pan is a rotary with a pointer
 * and an L/C/R arc; MUTE is a square illuminated button; the channel name
 * lives on a light "scribble strip" at the BOTTOM of the strip, where real
 * consoles put the tape.
 */
import { useCallback, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { usePulseStyle } from '../../../features/lab/attentionPulse';
import { useScrollLock } from '../scrollLock';

/* ── shared hardware palette (quiet, engraved, amber-accented) ───────────── */

const PANEL = '#141418';
const GROOVE = '#0a0a0c';
const INK = '#8b8b95'; // engraved legends + ticks
const CAP_BODY = '#26262c';
const CAP_EDGE = '#3d3d46';
const TAPE = '#d9d3c2'; // scribble strip
const TAPE_INK = '#17171a';

/* ── the fader taper ─────────────────────────────────────────────────────────
 * Real long-throw faders do not spend their travel evenly: unity gain sits
 * roughly 70% of the way up, the top quarter covers the boost range, and the
 * whole bottom half is squeezed into the last few dB before −∞. Teaching a
 * LINEAR dB slot would build the wrong muscle memory, so the taper is
 * piecewise, with the same three regions a hardware fader has.             */

const FADER_MAX = 12;
const FADER_MIN = -60; // displayed as −∞, matching the audio engine's floor

/** dB → 0..1 travel fraction (1 = top of the slot). */
export function faderDbToFrac(db: number): number {
  if (db >= 0) return 0.7 + (db / FADER_MAX) * 0.3; //   0..+12 → top 30%
  if (db >= -20) return 0.34 + ((db + 20) / 20) * 0.36; // −20..0 → middle 36%
  return ((db - FADER_MIN) / 40) * 0.34; //             −60..−20 → bottom 34%
}

/** 0..1 travel fraction → dB (inverse of the above). */
export function faderFracToDb(f: number): number {
  const c = Math.max(0, Math.min(1, f));
  if (c >= 0.7) return ((c - 0.7) / 0.3) * FADER_MAX;
  if (c >= 0.34) return -20 + ((c - 0.34) / 0.36) * 20;
  return FADER_MIN + (c / 0.34) * 40;
}

/** Scale legend, spelled the way consoles print it: signs above unity, bare
 *  numbers below, ∞ at the bottom of travel. */
const FADER_TICKS: { db: number; label: string; unity?: boolean }[] = [
  { db: 12, label: '+12' },
  { db: 6, label: '+6' },
  { db: 0, label: '0', unity: true },
  { db: -6, label: '6' },
  { db: -12, label: '12' },
  { db: -20, label: '20' },
  { db: -30, label: '30' },
  { db: -40, label: '40' },
  { db: -60, label: '∞' },
];

const SLOT_H = 150; // pt of fader travel
const SLOT_TOP = 6; // breathing room above +12
const CAP_W = 34;
const CAP_H = 17;

/* ── GearFader — a vertical long-throw fader ─────────────────────────────── */

export function GearFader({
  name,
  valueDb,
  onChangeDb,
  stepDb = 2,
}: {
  name: string;
  valueDb: number;
  onChangeDb: (db: number) => void;
  /** Nudge/screen-reader step — kept at the stepper console's 2 dB so nothing
   *  a screen-reader user could reach before is unreachable now. */
  stepDb?: number;
}) {
  const frac = faderDbToFrac(valueDb);
  const capTop = SLOT_TOP + (1 - frac) * SLOT_H - CAP_H / 2;
  const label = valueDb <= FADER_MIN ? '−∞' : `${valueDb > 0 ? '+' : ''}${valueDb}`;
  const pulse = usePulseStyle();

  // Latest value for the responder without re-creating it per render — a
  // PanResponder rebuilt mid-gesture drops the gesture on the floor.
  const valueRef = useRef(valueDb);
  valueRef.current = valueDb;
  const onChangeRef = useRef(onChangeDb);
  onChangeRef.current = onChangeDb;
  const grabDb = useRef(0);

  const moved = useRef(false);
  /** ANY movement (either axis) — disqualifies the double-tap-to-unity path. */
  const slid = useRef(false);
  const lastTap = useRef(0);
  // Freeze the page scroller for the gesture's duration — the third leg of the
  // eqBits recipe, and the one whose absence sent this fader's vertical drags
  // to the page scroll on device (owner pass 2026-09-11: "faders want to
  // scroll screen instead of move"). The capture-claim and the termination
  // handoff are JS-side arguments; on glass the native scroll view does not
  // argue, it takes — unless it is disabled first.
  const ctxLock = useScrollLock();
  const lockRef = useRef(ctxLock);
  lockRef.current = ctxLock;

  const responder = useMemo(
    () =>
      PanResponder.create({
        // The eqBits VerticalFader recipe, proven inside a horizontal scroller
        // since 2026-08: claim at touch START, then hand the gesture to the
        // channel scroller ONLY when it turns out clearly horizontal. A
        // move-time claim was how the first cut worked, and it made the cap
        // feel greasy — the scroller and the fader raced for every touch.
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        // `g.dx`/`g.dy` are CUMULATIVE, so an unguarded predicate here can flip
        // true after the drag has committed: pull the cap down 100 pt, drift
        // 110 pt sideways without lifting, and the fader hands the gesture to
        // the channel scroller mid-adjustment. The handoff is only on offer
        // BEFORE the fader has committed to a vertical drag.
        onPanResponderTerminationRequest: (_e, g) =>
          !moved.current && Math.abs(g.dx) > Math.abs(g.dy) + 6,
        onPanResponderGrant: () => {
          lockRef.current?.(true);
          grabDb.current = valueRef.current;
          moved.current = false;
          slid.current = false;
        },
        onPanResponderMove: (_e, g) => {
          // ANY slide disqualifies the tap path. `moved` stays VERTICAL-only so
          // the termination guard above still lets an uncommitted sideways
          // swipe through to the scroller — a purely horizontal jiggle used to
          // be too small for the scroller to claim AND still counted as a tap,
          // so two of them threw away the learner's fader setting.
          if (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6) slid.current = true;
          if (Math.abs(g.dy) > 6) moved.current = true;
          if (!moved.current) return; // a resting finger is not a drag
          // Grab-relative, like the hardware: the cap follows the finger from
          // where it WAS, it never teleports under it.
          const f = faderDbToFrac(grabDb.current) - g.dy / SLOT_H;
          const db = Math.round(faderFracToDb(f));
          if (db !== valueRef.current) onChangeRef.current(db);
        },
        onPanResponderTerminate: () => lockRef.current?.(false),
        onPanResponderRelease: () => {
          lockRef.current?.(false);
          if (slid.current) return;
          // A single tap still does nothing — a real fader does not jump to
          // where a stray finger lands. A DOUBLE tap returns to unity (owner
          // ruling 2026-09-11), which is also real desk behaviour: automation
          // and reset-to-0 buttons exist because unity is the home everyone
          // keeps going back to.
          const now = Date.now();
          if (now - lastTap.current < 320) {
            lastTap.current = 0;
            if (valueRef.current !== 0) {
              onChangeRef.current(0);
              AccessibilityInfo.announceForAccessibility?.(`${name} fader unity, 0 dB`);
            }
          } else {
            lastTap.current = now;
          }
        },
      }),
    [name],
  );

  const nudge = useCallback(
    (delta: number) => {
      // Snap to the step grid. A plain +/- delta could never reach 0 dB from an
      // odd value a drag left behind (-7 walks -5, -3, -1, +1 straight over
      // unity), so a nudge-only user could not get home to the one value the
      // whole scale is built around.
      const raw = Math.round((valueRef.current + delta) / Math.max(stepDb, 0.01)) * Math.max(stepDb, 0.01);
      const next = Math.max(FADER_MIN, Math.min(FADER_MAX, raw));
      if (next !== valueRef.current) {
        onChangeRef.current(next);
        const l = next <= FADER_MIN ? 'minus infinity' : `${next}`;
        AccessibilityInfo.announceForAccessibility?.(`${name} fader ${l} dB`);
      }
    },
    [name, stepDb],
  );

  return (
    <View style={s.faderWrap}>
      {/* Fine-step detent buttons: the visible single-tap path (WCAG 2.5.7) —
          the drag is a convenience on top, never the only way in. */}
      <Pressable
        onPress={() => nudge(stepDb)}
        hitSlop={{ top: 10, bottom: 6, left: 24, right: 24 }}
        accessibilityRole="button"
        accessibilityLabel={`${name} fader up ${stepDb} dB, now ${label} dB`}
        style={s.nudge}
      >
        <Text style={s.nudgeGlyph}>▲</Text>
      </Pressable>

      <View style={s.faderBody}>
        {/* Printed scale, left of the slot, at true taper positions. */}
        {FADER_TICKS.map((t) => {
          const y = SLOT_TOP + (1 - faderDbToFrac(t.db)) * SLOT_H;
          return (
            <View key={t.db} pointerEvents="none">
              <View style={[s.tick, t.unity && s.tickUnity, { top: y }]} />
              <Text style={[s.tickLabel, t.unity && s.tickLabelUnity, { top: y - 4.5 }]}>{t.label}</Text>
            </View>
          );
        })}
        {/* The travel slot — a groove, not a track bar. */}
        <View style={s.slot} pointerEvents="none" />
        {/* The cap. Its centre line breathes per the app-wide slider-pulse
            standard, announcing "touch me" without a tooltip. */}
        <View style={[s.cap, { top: capTop }]} pointerEvents="none">
          <Animated.View style={[s.capLine, pulse]} />
        </View>
        {/* One transparent drag surface over the whole slot column. It is also
            the screen-reader control: role adjustable, real steps. */}
        <View
          {...responder.panHandlers}
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${name} fader`}
          accessibilityValue={{ text: `${label} dB` }}
          // RNW 0.21 drops the accessibilityValue OBJECT, and aria-valuenow is
          // REQUIRED on role=slider — so the numbers ride to the DOM here. The
          // repo pairs these at all 12 other sites; these two were the misses.
          aria-valuemin={FADER_MIN}
          aria-valuemax={FADER_MAX}
          aria-valuenow={valueDb}
          aria-valuetext={`${label} dB`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? stepDb : -stepDb)}
        />
      </View>

      <Pressable
        onPress={() => nudge(-stepDb)}
        hitSlop={{ top: 6, bottom: 10, left: 24, right: 24 }}
        accessibilityRole="button"
        accessibilityLabel={`${name} fader down ${stepDb} dB, now ${label} dB`}
        style={s.nudge}
      >
        <Text style={s.nudgeGlyph}>▼</Text>
      </Pressable>

      {/* Numeric truth stays on the desk (house rule): small, mono, honest. */}
      <Text style={s.readout} accessible={false}>
        {label} dB
      </Text>
    </View>
  );
}

/* ── GearKnob — a rotary pan pot (reusable for any −100..100 rotary) ─────── */

const KNOB_R = 21;
const KNOB_SVG = 74; // square canvas; knob centred with arc-tick margin
const POINTER_SWEEP = 135; // ± degrees, hard-left to hard-right

export function GearKnob({
  name,
  legend = 'PAN',
  value,
  onChange,
  step = 25,
  formatValue,
  onGestureActive,
}: {
  name: string;
  legend?: string;
  value: number; // −100..100, 0 = centre
  onChange: (v: number) => void;
  step?: number;
  formatValue?: (v: number) => string;
  /** Fires true at gesture start, false at end. The host uses this to FREEZE
   *  its own horizontal scroller for the gesture's duration. Owner device pass
   *  2026-09-11, second report: "the band still scrolls left and right" — a
   *  native scroll view does not honour a JS termination refusal, and the only
   *  argument it respects is scrollEnabled={false}, set before it can move.
   *  Exactly the lesson the vertical page scroller taught an hour earlier. */
  onGestureActive?: (active: boolean) => void;
}) {
  const fmt = formatValue ?? ((v: number) => (v === 0 ? 'C' : v < 0 ? `L${Math.abs(v)}` : `R${v}`));
  const pulse = usePulseStyle();
  const cx = KNOB_SVG / 2;
  const cy = KNOB_SVG / 2 + 2;
  const a = (value / 100) * POINTER_SWEEP * (Math.PI / 180);
  const px = cx + Math.sin(a) * (KNOB_R - 5);
  const py = cy - Math.cos(a) * (KNOB_R - 5);

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const grab = useRef(0);
  const lastTap = useRef(0);
  const moved = useRef(false);
  const bandW = useRef(KNOB_SVG); // measured band width, for the tap L/R split
  // Same page-scroll freeze as the fader — a pot turn is a vertical drag, and
  // the page scroller stole it on device exactly the same way.
  const ctxLock = useScrollLock();
  const lockRef = useRef(ctxLock);
  lockRef.current = ctxLock;
  const activeRef = useRef(onGestureActive);
  activeRef.current = onGestureActive;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true, // taps nudge (below), so claim
        onStartShouldSetPanResponderCapture: () => true,
        // Owner ruling 2026-09-11: the pan-pot band is OFF LIMITS to the
        // channel scroller — a sideways gesture that begins on this band must
        // never page the console. Real desks make the same promise: reaching
        // for a pan pot cannot shove the whole channel bay sideways.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          lockRef.current?.(true); // freeze the PAGE (vertical scroller)
          activeRef.current?.(true); // and the host freezes the CHANNEL ROW
          grab.current = valueRef.current;
          moved.current = false;
        },
        onPanResponderMove: (_e, g) => {
          if (Math.abs(g.dy) > 5 || Math.abs(g.dx) > 5) moved.current = true;
          if (!moved.current) return;
          // BOTH axes turn the pot: vertical drag is the DAW convention
          // (circular dragging on a 42 pt knob is miserable), and since the
          // band never scrolls (ruling above), a horizontal drag maps to pan
          // the way the ear expects — drag right, sound goes right. Full
          // travel in ~140 pt either way, quantised to 5.
          const raw = grab.current + ((g.dx - g.dy) / 140) * 200;
          const v = Math.max(-100, Math.min(100, Math.round(raw / 5) * 5));
          if (v !== valueRef.current) onChangeRef.current(v);
        },
        onPanResponderTerminate: () => {
          lockRef.current?.(false);
          activeRef.current?.(false);
        },
        onPanResponderRelease: (e) => {
          lockRef.current?.(false);
          activeRef.current?.(false);
          if (moved.current) return;
          // A DOUBLE tap snaps to centre (owner ruling 2026-09-11) — the pan
          // pot's home the way unity is the fader's. The first tap of the
          // pair still nudges; the second overrides it with centre, so the
          // net result is exactly centred.
          const now = Date.now();
          if (now - lastTap.current < 320) {
            lastTap.current = 0;
            if (valueRef.current !== 0) {
              onChangeRef.current(0);
              AccessibilityInfo.announceForAccessibility?.(`${name} pan centre`);
            }
            return;
          }
          lastTap.current = now;
          // A single TAP (no drag) nudges toward the tapped side — the visible
          // non-drag path, same 25-step the old arrow buttons used.
          const left = e.nativeEvent.locationX < bandW.current / 2;
          const v = Math.max(-100, Math.min(100, valueRef.current + (left ? -step : step)));
          if (v !== valueRef.current) {
            onChangeRef.current(v);
            AccessibilityInfo.announceForAccessibility?.(`${name} pan ${v === 0 ? 'centre' : v < 0 ? `left ${Math.abs(v)}` : `right ${v}`}`);
          }
        },
      }),
    [name, step],
  );

  return (
    // The WHOLE band is the control (owner ruling 2026-09-11): the responder
    // rides the full-width wrapper, not just the knob circle, so there is no
    // scrollable sliver beside the pot for a thumb to catch.
    <View
      style={s.knobWrap}
      onLayout={(e) => (bandW.current = e.nativeEvent.layout.width)}
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${name} ${legend.toLowerCase()}`}
      accessibilityValue={{ text: fmt(value) }}
      aria-valuemin={-100}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={fmt(value)}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      accessibilityHint="Drag up or down, or sideways, to turn. Tap the left or right side to nudge."
      onAccessibilityAction={(e) => {
        const d = e.nativeEvent.actionName === 'increment' ? step : -step;
        onChangeRef.current(Math.max(-100, Math.min(100, valueRef.current + d)));
      }}
    >
      {/* Legend and value share ONE row ABOVE the pot (owner device pass
          2026-09-11: "the pan position readout must be above — the finger
          covers it placed below"). This is the Rack Unit's own drag-tag law —
          the value a control is reporting must never sit under the hand that
          is setting it — and a pot is turned with the fingertip landing on
          the knob face, which is precisely where a readout beneath it lives.
          One row rather than two keeps the strip's height unchanged. */}
      <View style={s.knobHead} pointerEvents="none">
        <Text style={s.legend}>{legend}</Text>
        <Text style={s.knobValue} numberOfLines={1}>
          {fmt(value)}
        </Text>
      </View>
      <View pointerEvents="none">
        <Svg width={KNOB_SVG} height={KNOB_SVG}>
          {/* End-of-travel + centre detent ticks around the arc. */}
          {[-POINTER_SWEEP, -POINTER_SWEEP / 2, 0, POINTER_SWEEP / 2, POINTER_SWEEP].map((deg) => {
            const r = deg * (Math.PI / 180);
            const x1 = cx + Math.sin(r) * (KNOB_R + 3);
            const y1 = cy - Math.cos(r) * (KNOB_R + 3);
            const x2 = cx + Math.sin(r) * (KNOB_R + 7);
            const y2 = cy - Math.cos(r) * (KNOB_R + 7);
            return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={deg === 0 ? colors.amberLabel : INK} strokeWidth={deg === 0 ? 1.6 : 1} />;
          })}
          <Circle cx={cx} cy={cy} r={KNOB_R} fill={CAP_BODY} stroke={CAP_EDGE} strokeWidth={1.5} />
          <Circle cx={cx} cy={cy} r={KNOB_R - 8} fill="none" stroke="#1c1c21" strokeWidth={1} />
        </Svg>
        {/* Pointer as an overlay so it can breathe with the pulse standard. */}
        <Animated.View pointerEvents="none" style={[
            s.pointer,
            pulse,
            // left/top place the BOX and RN rotates it about its own centre, so
            // each offset must be half of ITS OWN dimension. Subtracting half
            // the WIDTH from `top` as well put the pointer's centre 4 pt down
            // the screen BEFORE rotation — so it sat inside its own radius at
            // the top of travel and canted off-axis at the ends, missing the
            // travel ticks it exists to be read against.
            { left: px - 1.5, top: py - s.pointer.height / 2, transform: [{ rotate: `${(value / 100) * POINTER_SWEEP}deg` }] },
          ]} />
        <Text style={[s.knobEnd, { left: 0 }]}>L</Text>
        <Text style={[s.knobEnd, { right: 0 }]}>R</Text>
      </View>
    </View>
  );
}

/* ── GearButton — a square illuminated latching switch ───────────────────── */

export function GearButton({
  label,
  engaged,
  onPress,
  ledColor = colors.red,
  a11y,
}: {
  label: string;
  engaged: boolean;
  onPress: () => void;
  /** MUTE keeps the DAW-red convention; polarity and generic switches amber. */
  ledColor?: string;
  a11y: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: engaged }}
      // RNW maps `selected` to aria-selected, which is not valid on
      // role=button — a toggle announces its state through aria-pressed, as the
      // other 145 toggle sites in this repo do.
      aria-pressed={engaged}
      accessibilityLabel={a11y}
      hitSlop={{ top: 5, bottom: 5, left: 4, right: 4 }}
      style={[s.gearBtn, engaged && { borderColor: ledColor, backgroundColor: '#1c1418' }]}
    >
      <View style={[s.led, engaged && { backgroundColor: ledColor, shadowColor: ledColor, shadowOpacity: 0.9, shadowRadius: 4 }]} />
      <Text style={[s.gearBtnText, engaged && { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/* ── ScribbleStrip — the tape at the BOTTOM of a real channel ────────────── */

/** Solo lighting states (owner ruling 2026-09-11): tapping the tape toggles
 *  SOLO. The soloed channel's tape glows amber; while ANY solo is active,
 *  every other channel's tape turns light blue — one glance at the desk says
 *  which channel is speaking and which are being held out of the way. */
export type ScribbleSolo = 'soloed' | 'others-soloed' | 'none';

export function ScribbleStrip({
  name,
  solo = 'none',
  onToggleSolo,
}: {
  name: string;
  solo?: ScribbleSolo;
  /** Present = the tape is a SOLO switch. Absent = plain tape (labs whose
   *  audio model has no solo must not render a switch that does nothing). */
  onToggleSolo?: () => void;
}) {
  const body = (
    <View
      style={[
        s.tape,
        solo === 'soloed' && s.tapeSoloed,
        solo === 'others-soloed' && s.tapeOthers,
      ]}
    >
      <Text style={s.tapeText} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
  if (!onToggleSolo) {
    return <View accessible={false /* the strip's controls each carry the name already */}>{body}</View>;
  }
  return (
    <Pressable
      onPress={onToggleSolo}
      hitSlop={{ top: 5, bottom: 8, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityState={{ selected: solo === 'soloed' }}
      aria-pressed={solo === 'soloed'}
      accessibilityLabel={`${name} solo ${solo === 'soloed' ? 'on — tap to turn off' : 'off — tap to solo this channel'}`}
    >
      {body}
    </Pressable>
  );
}

/* ── StripFrame — the channel's panel ────────────────────────────────────── */

export function StripFrame({ children }: { children: React.ReactNode }) {
  return <View style={s.frame}>{children}</View>;
}

export const STRIP_WIDTH = 96;

/* ── styles ──────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  frame: {
    width: STRIP_WIDTH,
    // Web: a fader drag must never double as a text-selection gesture — the
    // first preview drag highlighted the printed dB scale like a paragraph.
    userSelect: 'none',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderTopColor: '#34343c', // caught light on the top edge — panel, not card
    backgroundColor: PANEL,
    paddingVertical: 8,
    paddingHorizontal: 7,
    gap: 7,
    alignItems: 'stretch',
  },

  faderWrap: { alignItems: 'stretch', gap: 2 },
  faderBody: { height: SLOT_TOP * 2 + SLOT_H, marginHorizontal: 0 },
  slot: {
    position: 'absolute',
    left: STRIP_WIDTH / 2 + 2,
    top: SLOT_TOP,
    width: 6,
    height: SLOT_H,
    borderRadius: 3,
    backgroundColor: GROOVE,
    borderWidth: 1,
    borderColor: '#000',
  },
  tick: { position: 'absolute', left: 26, width: 16, height: 1, backgroundColor: INK, opacity: 0.55 },
  // Owner 2026-09-11: the printed unity mark dimmed 79% — it is a reference on
  // the scale, not a light. The CAP's amber line keeps full brightness; that
  // one is the moving part. 0.95 × 0.21 ≈ 0.2.
  tickUnity: { backgroundColor: colors.amberLabel, opacity: 0.2, height: 2, left: 22, width: 20 },
  tickLabel: { position: 'absolute', left: 2, width: 22, textAlign: 'right', color: INK, fontFamily: fonts.mono, fontSize: 7.5 },
  tickLabelUnity: { color: colors.amberLabel },
  cap: {
    position: 'absolute',
    left: STRIP_WIDTH / 2 + 5 - CAP_W / 2,
    width: CAP_W,
    height: CAP_H,
    borderRadius: 3,
    backgroundColor: CAP_BODY,
    borderWidth: 1,
    borderColor: CAP_EDGE,
    justifyContent: 'center',
    // Lifted off the panel — the one control on the strip that casts a shadow,
    // because it is the one control that physically stands proud of it.
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  capLine: { height: 2.5, marginHorizontal: 3, borderRadius: 1, backgroundColor: colors.amber },
  nudge: { alignItems: 'center', paddingVertical: 2 },
  nudgeGlyph: { color: INK, fontSize: 9 },
  readout: { textAlign: 'center', color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 10.5, marginTop: 1 },

  knobWrap: { alignSelf: 'stretch', alignItems: 'center', gap: 1 },
  /** Legend left, live value right — one row, above the pot, clear of the
   *  hand. Space-between rather than centred so the value sits at the strip's
   *  edge, the furthest point on this row from a fingertip on the knob face. */
  knobHead: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  legend: { color: INK, fontFamily: fonts.panelSemiBold, fontSize: 8, letterSpacing: 2 },
  knobValue: { color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 10.5 },
  pointer: { position: 'absolute', width: 3, height: 11, borderRadius: 1.5, backgroundColor: colors.amber },
  knobEnd: { position: 'absolute', bottom: 6, color: INK, fontFamily: fonts.panelSemiBold, fontSize: 8 },

  gearBtn: {
    minHeight: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3a3a42',
    backgroundColor: '#1a1a1f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  led: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3a3a42' },
  gearBtnText: { color: INK, fontFamily: fonts.panelSemiBold, fontSize: 9.5, letterSpacing: 1 },

  tape: { height: 22, borderRadius: 3, backgroundColor: TAPE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  /** SOLO engaged: amber, glowing lightly (owner: "glowing lightly" — a soft
   *  halo, not a strobe; reduced-motion users get the identical static glow). */
  tapeSoloed: {
    backgroundColor: colors.amber,
    shadowColor: colors.amber,
    shadowOpacity: 0.75,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  /** Another channel is soloed: this one steps back in light blue. */
  tapeOthers: { backgroundColor: '#a9c8e8' },
  tapeText: { color: TAPE_INK, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2 },
});
