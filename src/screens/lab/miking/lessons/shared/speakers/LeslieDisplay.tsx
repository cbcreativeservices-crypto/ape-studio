/**
 * THE ROTARY CABINET DISPLAY — a LESSON DISPLAY the learner starts
 * (charter §5; the P10b classification "lesson display", owner 2026-10-02):
 * the moving rotors ARE the lesson. It is not a loop host: RUN plays ONE
 * finite timed stretch of the model clock (`withTiming`, RUN_WALL_S seconds
 * of wall time) and then pauses itself; PAUSE stops it where it is; it stops
 * when the page is covered or out of focus. Under reduced motion there is no
 * RUN: a speed change settles at once and STEP turns the rotors on by a
 * step, so every state is reachable by steps.
 *
 * ONE CLOCK: `clock` is model time (s). Each rotor follows a Ramp (rotor.ts)
 * read on the UI thread; a speed change starts a new ramp from the current
 * angle and speed, so nothing snaps. The true speeds are always printed; a
 * slowed drawing says "SLOWED ×4" (charter §5 honesty rule).
 *
 * WHAT IS DRAWN (speaker_leslie/SOURCES.md, simplifications register):
 *   • INSIDE VIEW — never open a real cabinet: a labelled schematic after the
 *     maker's internal-structure drawing: the horn rotor (one sounding bell and
 *     a capped balance bell) over the
 *     compression driver, the woofer facing down, the low rotor (a drum with
 *     one scoop opening), the crossover and amplifier. Rotor sizes, the
 *     louver layout and the scoop's shape are drawing defaults.
 *   • FRONT — the closed cabinet with its upper louvers and lower openings.
 *   • FROM ABOVE — both rotor levels in plan, with the mics round them; a mic
 *     lights while a horn bell (or the drum's opening) points at it.
 *   • the SPEED STRIP — both rotors' speeds against real time since the last
 *     change (linear ramps: a simplified picture), with a cursor.
 * Rotation direction: counter-clockwise from above — a drawing default,
 * never taught as fact.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, Skia, vec } from '@shopify/react-native-skia';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedReaction, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { InstrumentDynamicMic } from '../../../../../../features/lab/micDrawings';
import { fitXform, type ViewXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { CROSSOVER_HZ, LESLIE } from './speakerModel.ts';
import { ROTORS, RUN_WALL_S, TIME_BASES, angleAt, atRest, retarget, rpmAt, settled, wrap360, type Ramp, type RotorMode, type TimeBaseId } from './rotor.ts';
import { bellToMic, type LeslieMic } from './leslieMics.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const W2 = LESLIE.w.mm / 2;
const HALF_D = LESLIE.d.mm / 2;
const H = LESLIE.h.mm;
const WALL = 19;
const REACH = LESLIE.hornReach.mm;
const DRUM_R = LESLIE.drumR.mm;
const HORN_Y = LESLIE.hornY.mm;
const DRUM_Y = LESLIE.drumY.mm;
const SHELF_Y = LESLIE.shelfY.mm;
const LOWER_TOP = LESLIE.lowerTop.mm;
const PLINTH = LESLIE.plinth.mm;
const WOOD = ['#9a6034', '#6b3d1c', '#3c210e'];
const WOOD_CUT = ['#5c3417', '#c48f52', '#d9a766', '#9c6631'];
/** The drum's scoop: the opening's width (deg) — a drawing default. */
const SCOOP_DEG = 110;
/** A bell's throat and mouth widths (mm) — drawing defaults. */
const BELL_THROAT = 26;
const BELL_MOUTH = 92;
const HUB_R = 38;
/** The drum's height in elevation (drawing default 220). */
const DRUM_TOP = DRUM_Y - 110;
const DRUM_BOT = DRUM_Y + 110;
/** The board the woofer hangs from: the lower compartment's top. */
const WOOF_Y = LOWER_TOP;

/* ── the clock and the two rotors ── */
export type LeslieRig = {
  mode: RotorMode;
  setMode: (m: RotorMode) => void;
  running: boolean;
  run: () => void;
  pause: () => void;
  step: () => void;
  timeBase: TimeBaseId;
  setTimeBase: (id: TimeBaseId) => void;
  clock: SharedValue<number>;
  horn: SharedValue<Ramp>;
  drum: SharedValue<Ramp>;
  /** React mirrors (for words and the speed strip). */
  hornRamp: Ramp;
  drumRamp: Ramp;
  /** The horn has reached the FAST speed at least once (a credit event). */
  reachedFast: boolean;
  motion: boolean;
};

export function useLeslieRig({ motion, hidden, focused, start = 'slow' }: { motion: boolean; hidden: boolean; focused: boolean; start?: RotorMode }): LeslieRig {
  const clock = useSharedValue(0);
  // A rotor that starts in its chosen speed (settled), angles staggered so
  // the two levels do not look geared together.
  // Resting angles: the bells across the view, the drum's opening toward the
  // front-right — so a still picture shows both (drawing choices).
  const h0 = useMemo(() => ({ ...atRest(ROTORS.horn, 70), rpm0: start === 'stop' ? 0 : start === 'fast' ? ROTORS.horn.fastRpm : ROTORS.horn.slowRpm, rpm1: start === 'stop' ? 0 : start === 'fast' ? ROTORS.horn.fastRpm : ROTORS.horn.slowRpm }), [start]);
  const d0 = useMemo(() => ({ ...atRest(ROTORS.drum, 35), rpm0: start === 'stop' ? 0 : start === 'fast' ? ROTORS.drum.fastRpm : ROTORS.drum.slowRpm, rpm1: start === 'stop' ? 0 : start === 'fast' ? ROTORS.drum.fastRpm : ROTORS.drum.slowRpm }), [start]);
  const horn = useSharedValue<Ramp>(h0);
  const drum = useSharedValue<Ramp>(d0);
  const [hornRamp, setHornRamp] = useState<Ramp>(h0);
  const [drumRamp, setDrumRamp] = useState<Ramp>(d0);
  const [mode, setModeState] = useState<RotorMode>(start);
  const [running, setRunning] = useState(false);
  const [timeBase, setTimeBaseState] = useState<TimeBaseId>('x4');
  const [reachedFast, setReachedFast] = useState(false);
  const scale = TIME_BASES.find((b) => b.id === timeBase)!.scale;

  const pause = useCallback(() => {
    cancelAnimation(clock);
    setRunning(false);
  }, [clock]);
  const runFrom = useCallback(
    (sc: number) => {
      cancelAnimation(clock);
      setRunning(true);
      const t0 = clock.value;
      clock.value = withTiming(t0 + RUN_WALL_S * sc, { duration: RUN_WALL_S * 1000, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(setRunning, false);
      });
    },
    [clock],
  );
  const run = useCallback(() => {
    if (!motion) return;
    runFrom(scale);
  }, [motion, runFrom, scale]);

  const setMode = useCallback(
    (m: RotorMode) => {
      const t = clock.value;
      const nh = retarget(ROTORS.horn, horn.value, t, m);
      const nd = retarget(ROTORS.drum, drum.value, t, m);
      horn.value = nh;
      drum.value = nd;
      setHornRamp(nh);
      setDrumRamp(nd);
      setModeState(m);
      if (!motion) {
        // Reduced motion: the change settles at once (the strip still shows
        // how long it takes); STEP turns the rotors on from there.
        clock.value = t + Math.max(nh.dur, nd.dur);
        if (m === 'fast') setReachedFast(true);
      }
    },
    [clock, horn, drum, motion],
  );

  const step = useCallback(() => {
    const t = clock.value;
    const rpm = rpmAt(horn.value, t);
    // A step of about 45° of the horn (or a quarter second when it is still).
    clock.value = t + (rpm > 1 ? (45 / 360) * (60 / rpm) : 0.25);
  }, [clock, horn]);

  const setTimeBase = useCallback(
    (id: TimeBaseId) => {
      setTimeBaseState(id);
      if (running) runFrom(TIME_BASES.find((b) => b.id === id)!.scale);
    },
    [running, runFrom],
  );

  // The horn reaching full speed is the credit event (a reaction, a few
  // updates per run — never one per frame).
  useAnimatedReaction(
    () => horn.value.rpm1 === ROTORS.horn.fastRpm && settled(horn.value, clock.value),
    (now, prev) => {
      if (now && !prev) scheduleOnRN(setReachedFast, true);
    },
  );
  // Covered or out of focus: stop where it is.
  useEffect(() => {
    if ((hidden || !focused) && running) pause();
  }, [hidden, focused, running, pause]);
  useEffect(() => () => cancelAnimation(clock), []); // eslint-disable-line react-hooks/exhaustive-deps

  return { mode, setMode, running, run, pause, step, timeBase, setTimeBase, clock, horn, drum, hornRamp, drumRamp, reachedFast, motion };
}

/* ── the live speed text (no React work per frame on a phone) ── */
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function useSpeedText(rig: LeslieRig): SharedValue<string> {
  return useDerivedValue(() => {
    const t = rig.clock.value;
    const h = rpmAt(rig.horn.value, t);
    const d = rpmAt(rig.drum.value, t);
    return `HORN ${Math.round(h)} rpm · LOW ROTOR ${Math.round(d)} rpm`;
  });
}

function LiveSpeedNative({ rig, fs }: { rig: LeslieRig; fs: number }) {
  const text = useSpeedText(rig);
  const props = useAnimatedProps(() => ({ text: text.value, defaultValue: text.value }) as never, [text]);
  return <AnimatedTextInput editable={false} pointerEvents="none" underlineColorAndroid="transparent" animatedProps={props} style={[styles.live, { fontSize: fs }]} accessibilityElementsHidden importantForAccessibility="no" />;
}
function LiveSpeedWeb({ rig, fs }: { rig: LeslieRig; fs: number }) {
  const text = useSpeedText(rig);
  const [shown, setShown] = useState(() => text.value);
  useAnimatedReaction(
    () => text.value,
    (t, prev) => {
      if (t !== prev) scheduleOnRN(setShown, t);
    },
    [text],
  );
  return (
    <Text style={[styles.live, styles.liveWeb, { fontSize: fs }]} accessibilityElementsHidden importantForAccessibility="no">
      {shown}
    </Text>
  );
}
const LiveSpeed = Platform.OS === 'web' ? LiveSpeedWeb : LiveSpeedNative;

/* ── static paths, built once ── */
type Built = ReturnType<typeof buildAll>;
let built: Built | null = null;
function slats(p: SkPath, u0: number, u1: number, v0: number, v1: number, horizontal: boolean, pitch = 20, slat = 9) {
  if (horizontal) for (let v = v0 + 4; v < v1 - 2; v += pitch) p.addRRect(Skia.RRectXY(Skia.XYWHRect(u0, v, u1 - u0, slat), 2, 2));
  else for (let u = u0 + 4; u < u1 - 2; u += pitch) p.addRRect(Skia.RRectXY(Skia.XYWHRect(u, v0, slat, v1 - v0), 2, 2));
  return p;
}
function buildAll() {
  // FRONT elevation (u = z, v = y).
  const body = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-W2, -H + 22, 2 * W2, H - 22 - PLINTH), 6, 6));
  const cap = make();
  cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-W2 - 9, -H, 2 * W2 + 18, 24), 5, 5));
  const plinth = make();
  plinth.addRect(Skia.XYWHRect(-W2 + 16, -PLINTH, 2 * W2 - 32, PLINTH));
  const lu = LESLIE.upperLouvers;
  const lo = LESLIE.lowerOpenings;
  const upperWin = make();
  upperWin.addRRect(Skia.RRectXY(Skia.XYWHRect(-300, lu.y0, 600, lu.y1 - lu.y0), 6, 6));
  const lowerWin = make();
  lowerWin.addRRect(Skia.RRectXY(Skia.XYWHRect(-300, lo.y0, 600, lo.y1 - lo.y0), 6, 6));
  const upperSlats = slats(make(), -300, 300, lu.y0, lu.y1, true);
  const lowerSlats = slats(make(), -300, 300, lo.y0, lo.y1, true);
  const panelLine = make();
  panelLine.addRRect(Skia.RRectXY(Skia.XYWHRect(-W2 + 34, lu.y1 + 40, 2 * W2 - 68, lo.y0 - lu.y1 - 80), 5, 5));
  // INSIDE (the same elevation, the front taken away in the drawing).
  const interior = make();
  interior.addRect(Skia.XYWHRect(-W2 + WALL, -H + 24, 2 * W2 - 2 * WALL, H - 24 - PLINTH));
  const shelves = make();
  shelves.addRect(Skia.XYWHRect(-W2 + WALL, SHELF_Y, 2 * W2 - 2 * WALL, WALL));
  // The lower compartment's top board, with the woofer's cut-out above the drum.
  const cut = LESLIE.woofer.mm / 2 - 12;
  shelves.addRect(Skia.XYWHRect(-W2 + WALL, LOWER_TOP, W2 - WALL - cut, WALL));
  shelves.addRect(Skia.XYWHRect(cut, LOWER_TOP, W2 - WALL - cut, WALL));
  const walls = make();
  walls.addRect(Skia.XYWHRect(-W2, -H + 22, WALL, H - 22 - PLINTH));
  walls.addRect(Skia.XYWHRect(W2 - WALL, -H + 22, WALL, H - 22 - PLINTH));
  // Compression driver under the horn rotor's hub.
  const driver = make();
  driver.addRRect(Skia.RRectXY(Skia.XYWHRect(-58, HORN_Y + 60, 116, 150), 10, 10));
  const throat = make();
  throat.addRect(Skia.XYWHRect(-14, HORN_Y + 18, 28, 46));
  // The woofer on the lower compartment's top board, facing DOWN into the
  // drum (its magnet above the board), after the maker's schematic.
  const wR = LESLIE.woofer.mm / 2;
  const woofer = make();
  woofer.moveTo(-wR + 12, WOOF_Y + WALL);
  woofer.cubicTo(-wR * 0.55, WOOF_Y - 20, -60, WOOF_Y - 64, -26, WOOF_Y - 78);
  woofer.lineTo(26, WOOF_Y - 78);
  woofer.cubicTo(60, WOOF_Y - 64, wR * 0.55, WOOF_Y - 20, wR - 12, WOOF_Y + WALL);
  woofer.close();
  const wMagnet = make();
  wMagnet.addRRect(Skia.RRectXY(Skia.XYWHRect(-78, WOOF_Y - 160, 156, 82), 8, 8));
  const wFrame = make();
  wFrame.moveTo(-wR, WOOF_Y - 4);
  wFrame.lineTo(-90, WOOF_Y - 150);
  wFrame.moveTo(wR, WOOF_Y - 4);
  wFrame.lineTo(90, WOOF_Y - 150);
  // Crossover, power amp, preamp on the left (after the maker's schematic).
  const chassis = make();
  for (let i = 0; i < 3; i++) chassis.addRRect(Skia.RRectXY(Skia.XYWHRect(-W2 + WALL + 12, SHELF_Y + WALL + 18 + i * 64, 150, 52), 5, 5));
  // The drum, in elevation.
  const drumTop = DRUM_TOP;
  const drumBot = DRUM_BOT;
  const drumBody = make();
  drumBody.addRect(Skia.XYWHRect(-DRUM_R, drumTop, 2 * DRUM_R, drumBot - drumTop));
  const drumTopOval = make();
  drumTopOval.addOval(Skia.XYWHRect(-DRUM_R, drumTop - 20, 2 * DRUM_R, 40));
  const drumBotOval = make();
  drumBotOval.addOval(Skia.XYWHRect(-DRUM_R, drumBot - 20, 2 * DRUM_R, 40));
  const spindle = make();
  spindle.addRect(Skia.XYWHRect(-6, drumBot, 12, -PLINTH - drumBot));

  // PLAN (u = z, v = x; the front at the bottom).
  const planWalls = (which: 'upper' | 'lower') => {
    const p = make();
    const open = which === 'upper' ? { fz: 300, sx: 200 } : { fz: 300, sx: 200 };
    // Solid wall pieces either side of each opening.
    p.addRect(Skia.XYWHRect(-W2, HALF_D - WALL, W2 - open.fz, WALL));
    p.addRect(Skia.XYWHRect(open.fz, HALF_D - WALL, W2 - open.fz, WALL));
    p.addRect(Skia.XYWHRect(-W2, -HALF_D, W2 - open.fz, WALL));
    p.addRect(Skia.XYWHRect(open.fz, -HALF_D, W2 - open.fz, WALL));
    p.addRect(Skia.XYWHRect(-W2, -HALF_D, WALL, HALF_D - open.sx));
    p.addRect(Skia.XYWHRect(-W2, open.sx, WALL, HALF_D - open.sx));
    p.addRect(Skia.XYWHRect(W2 - WALL, -HALF_D, WALL, HALF_D - open.sx));
    p.addRect(Skia.XYWHRect(W2 - WALL, open.sx, WALL, HALF_D - open.sx));
    const s = make();
    // Louver slats across each opening, seen in section (angled bars).
    for (let u = -open.fz + 6; u < open.fz - 4; u += 20) {
      s.moveTo(u, HALF_D - WALL);
      s.lineTo(u + 9, HALF_D);
      s.moveTo(u, -HALF_D + WALL);
      s.lineTo(u + 9, -HALF_D);
    }
    for (let v = -open.sx + 6; v < open.sx - 4; v += 20) {
      s.moveTo(-W2 + WALL, v);
      s.lineTo(-W2, v + 9);
      s.moveTo(W2 - WALL, v);
      s.lineTo(W2, v + 9);
    }
    return { walls: p, slats: s };
  };
  const planUpper = planWalls('upper');
  const planLower = planWalls('lower');
  const planFloor = make();
  planFloor.addRect(Skia.XYWHRect(-W2 + WALL, -HALF_D + WALL, 2 * W2 - 2 * WALL, 2 * HALF_D - 2 * WALL));
  // One horn bell, local: from the hub toward +v (screen down = the front at θ = 0).
  const bell = make();
  bell.moveTo(-BELL_THROAT / 2, HUB_R - 4);
  bell.cubicTo(-BELL_THROAT / 2, REACH * 0.55, -BELL_MOUTH * 0.32, REACH * 0.82, -BELL_MOUTH / 2, REACH);
  bell.lineTo(BELL_MOUTH / 2, REACH);
  bell.cubicTo(BELL_MOUTH * 0.32, REACH * 0.82, BELL_THROAT / 2, REACH * 0.55, BELL_THROAT / 2, HUB_R - 4);
  bell.close();
  const bells = make();
  bells.addPath(bell);
  const m = Skia.Matrix();
  m.rotate(Math.PI);
  const bell2 = bell.copy();
  bell2.transform(m);
  bells.addPath(bell2);
  const mouths = make();
  mouths.moveTo(-BELL_MOUTH / 2 + 4, REACH - 2);
  mouths.lineTo(BELL_MOUTH / 2 - 4, REACH - 2);
  // The other bell is the classic cabinet's blocked balance bell: its mouth
  // is drawn capped, not open (review Lab 1 M7).
  const plug = make();
  plug.addRRect(Skia.RRectXY(Skia.XYWHRect(-BELL_MOUTH / 2 + 2, -REACH, BELL_MOUTH - 4, 12), 4, 4));
  // The drum's scoop: an opening of SCOOP_DEG facing +v at φ = 0, and a
  // curved deflector inside (drawing default).
  const half = (SCOOP_DEG / 2) * (Math.PI / 180);
  const drumRim = make();
  drumRim.addArc(Skia.XYWHRect(-DRUM_R, -DRUM_R, 2 * DRUM_R, 2 * DRUM_R), 90 + SCOOP_DEG / 2, 360 - SCOOP_DEG);
  const deflector = make();
  deflector.moveTo(Math.sin(-half) * DRUM_R, Math.cos(half) * DRUM_R);
  deflector.cubicTo(-DRUM_R * 0.55, DRUM_R * 0.1, -DRUM_R * 0.15, -DRUM_R * 0.35, DRUM_R * 0.25, -DRUM_R * 0.2);
  deflector.cubicTo(DRUM_R * 0.55, -DRUM_R * 0.05, DRUM_R * 0.7, DRUM_R * 0.3, Math.sin(half) * DRUM_R, Math.cos(half) * DRUM_R);
  const scoopMouth = make();
  scoopMouth.moveTo(Math.sin(-half) * DRUM_R, Math.cos(half) * DRUM_R);
  scoopMouth.lineTo(Math.sin(half) * DRUM_R, Math.cos(half) * DRUM_R);
  return { body, cap, plinth, upperWin, lowerWin, upperSlats, lowerSlats, panelLine, interior, shelves, walls, driver, throat, woofer, wMagnet, wFrame, chassis, drumBody, drumTopOval, drumBotOval, drumTop, drumBot, spindle, planUpper, planLower, planFloor, bells, mouths, plug, drumRim, deflector, scoopMouth };
}
function getBuilt(): Built {
  return (built ??= buildAll());
}

/* ── the front elevation: exterior or the inside view, rotors turning ── */
function FrontElevation({ rig, inside, mics }: { rig: LeslieRig; inside: boolean; mics: LeslieMic[] }) {
  const b = getBuilt();
  const hornA = useDerivedValue(() => (angleAt(rig.horn.value, rig.clock.value) * Math.PI) / 180);
  const drumA = useDerivedValue(() => (angleAt(rig.drum.value, rig.clock.value) * Math.PI) / 180);
  // Each bell: its tip's sideways offset (sin) and how much it faces the viewer (cos).
  const bellPaths = useDerivedValue(() => {
    const near = Skia.Path.Make();
    const far = Skia.Path.Make();
    const nearMouth = Skia.Path.Make();
    for (let i = 0; i < 2; i++) {
      const a = hornA.value + i * Math.PI;
      const s = Math.sin(a);
      const c = Math.cos(a);
      const p = c >= 0 ? near : far;
      const uh = HUB_R * s;
      const ut = REACH * s;
      p.moveTo(uh, HORN_Y - BELL_THROAT / 2);
      p.cubicTo(uh + (ut - uh) * 0.55, HORN_Y - BELL_THROAT / 2, uh + (ut - uh) * 0.82, HORN_Y - BELL_MOUTH * 0.32, ut, HORN_Y - BELL_MOUTH / 2);
      p.lineTo(ut, HORN_Y + BELL_MOUTH / 2);
      p.cubicTo(uh + (ut - uh) * 0.82, HORN_Y + BELL_MOUTH * 0.32, uh + (ut - uh) * 0.55, HORN_Y + BELL_THROAT / 2, uh, HORN_Y + BELL_THROAT / 2);
      p.close();
      if (c > 0.05) nearMouth.addOval(Skia.XYWHRect(ut - (BELL_MOUTH / 2) * c - 1, HORN_Y - BELL_MOUTH / 2 + 3, BELL_MOUTH * c + 2, BELL_MOUTH - 6));
    }
    return { near, far, nearMouth };
  });
  const nearBell = useDerivedValue(() => bellPaths.value.near);
  const farBell = useDerivedValue(() => bellPaths.value.far);
  const mouth = useDerivedValue(() => bellPaths.value.nearMouth);
  // The drum's opening, seen from the front while it faces this way.
  const scoop = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const a = drumA.value;
    const half = (SCOOP_DEG / 2) * (Math.PI / 180);
    // Visible part of the opening: the arc of angles facing the viewer (cos > 0).
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = 0; k <= 12; k++) {
      const ang = a - half + (2 * half * k) / 12;
      if (Math.cos(ang) <= 0) continue;
      const u = DRUM_R * Math.sin(ang);
      lo = Math.min(lo, u);
      hi = Math.max(hi, u);
    }
    if (hi > lo) p.addRRect(Skia.RRectXY(Skia.XYWHRect(lo, DRUM_TOP + 18, hi - lo, DRUM_BOT - DRUM_TOP - 36), 6, 6));
    return p;
  });
  const shaftHi = useDerivedValue(() => 0.5 + 0.5 * Math.cos(hornA.value * 4));
  return (
    <Group>
      <Path path={b.body} color="#000" opacity={0.5}>
        <BlurMask blur={18} style="normal" />
      </Path>
      <Path path={b.body}>
        <LinearGradient start={vec(-W2, -H)} end={vec(W2, 0)} colors={WOOD} />
      </Path>
      {inside ? (
        <>
          <Path path={b.interior}>
            <LinearGradient start={vec(0, -H)} end={vec(0, 0)} colors={['#120d09', '#1f1610', '#0c0806']} />
          </Path>
          <Path path={b.interior}>
            <RadialGradient c={vec(-W2 * 0.5, -H * 0.85)} r={H} colors={['rgba(255,214,160,0.08)', 'rgba(255,214,160,0)']} />
          </Path>
          {/* the far horn bell (facing away), the driver, the near bell */}
          <Path path={farBell}>
            <LinearGradient start={vec(-REACH, HORN_Y - 46)} end={vec(REACH, HORN_Y + 46)} colors={['#2c2e34', '#15161a', '#0a0a0c']} />
          </Path>
          <Path path={b.throat} color="#2a2c32" />
          <Path path={b.driver}>
            <LinearGradient start={vec(-58, HORN_Y + 60)} end={vec(58, HORN_Y + 210)} colors={['#8f949f', '#3e424b', '#1b1c20']} />
          </Path>
          <Path path={b.driver} style="stroke" strokeWidth={1.4} color="#08080a" />
          <Circle cx={0} cy={HORN_Y} r={HUB_R}>
            <RadialGradient c={vec(-12, HORN_Y - 12)} r={HUB_R * 1.4} colors={['#e3e6ec', '#8a8f99', '#3a3d45']} />
          </Circle>
          <Path path={nearBell}>
            <LinearGradient start={vec(-REACH, HORN_Y - 46)} end={vec(REACH, HORN_Y + 46)} colors={['#4a4e57', '#24262c', '#101114']} />
          </Path>
          <Path path={nearBell} style="stroke" strokeWidth={1.6} color="#08080a" />
          <Path path={mouth} color="#030304" />
          <Path path={mouth} style="stroke" strokeWidth={2.2} color="#9aa0ab" opacity={0.6} />
          <Circle cx={0} cy={HORN_Y} r={6} color="#d4d8e0" opacity={shaftHi} />
          {/* shelves, the woofer facing down, the electronics, the drum */}
          <Path path={b.shelves}>
            <LinearGradient start={vec(0, SHELF_Y)} end={vec(0, SHELF_Y + WALL)} colors={WOOD_CUT} />
          </Path>
          <Path path={b.wFrame} style="stroke" strokeWidth={9} strokeCap="round" color="#3a3d45" />
          <Path path={b.wFrame} style="stroke" strokeWidth={3} strokeCap="round" color="#9aa0ab" opacity={0.6} />
          <Path path={b.wMagnet}>
            <LinearGradient start={vec(-78, WOOF_Y - 160)} end={vec(78, WOOF_Y - 78)} colors={['#c8ccd4', '#5a5d66', '#26282e', '#111215']} />
          </Path>
          <Path path={b.wMagnet} style="stroke" strokeWidth={1.4} color="#08080a" />
          <Path path={b.woofer}>
            <LinearGradient start={vec(0, WOOF_Y - 78)} end={vec(0, WOOF_Y + WALL)} colors={['#14110e', '#2a241f', '#4f4740']} />
          </Path>
          <Path path={b.woofer} style="stroke" strokeWidth={2} color="#0d0b09" />
          <Path path={b.chassis}>
            <LinearGradient start={vec(-W2, SHELF_Y)} end={vec(-W2 + 180, SHELF_Y + 200)} colors={['#6b707b', '#33363d', '#1a1b20']} />
          </Path>
          <Path path={b.chassis} style="stroke" strokeWidth={1.2} color="#08080a" />
          <Path path={b.drumBody}>
            <LinearGradient start={vec(-DRUM_R, 0)} end={vec(DRUM_R, 0)} colors={['#3b2614', '#a06a38', '#6b4220', '#24160a']} positions={[0, 0.3, 0.7, 1]} />
          </Path>
          <Path path={scoop} color="#050403" />
          <Path path={scoop} style="stroke" strokeWidth={2} color="#c79a62" opacity={0.6} />
          <Path path={b.drumTopOval}>
            <LinearGradient start={vec(-DRUM_R, 0)} end={vec(DRUM_R, 0)} colors={['#c48f52', '#8a5426']} />
          </Path>
          <Path path={b.drumBotOval} style="stroke" strokeWidth={1.4} color="#08080a" />
          <Path path={b.drumBody} style="stroke" strokeWidth={1.4} color="#08080a" />
          <Path path={b.spindle} color="#9aa0ab" />
          <Path path={b.walls}>
            <LinearGradient start={vec(-W2, 0)} end={vec(-W2 + WALL, 0)} colors={WOOD_CUT} />
          </Path>
        </>
      ) : (
        <>
          <Path path={b.panelLine} style="stroke" strokeWidth={2.4} color="#2b170a" opacity={0.7} />
          <Path path={b.upperWin} color="#0a0705" />
          <Path path={b.upperSlats}>
            <LinearGradient start={vec(0, LESLIE.upperLouvers.y0)} end={vec(0, LESLIE.upperLouvers.y1)} colors={['#a06a38', '#5c3417']} />
          </Path>
          <Path path={b.lowerWin} color="#0a0705" />
          <Path path={b.lowerSlats}>
            <LinearGradient start={vec(0, LESLIE.lowerOpenings.y0)} end={vec(0, LESLIE.lowerOpenings.y1)} colors={['#a06a38', '#5c3417']} />
          </Path>
        </>
      )}
      <Path path={b.cap}>
        <LinearGradient start={vec(-W2, -H)} end={vec(W2, -H + 24)} colors={['#c48f52', '#7a4a20', '#3a220e']} />
      </Path>
      <Path path={b.plinth} color="#120c08" />
      <Path path={b.body} style="stroke" strokeWidth={2} color="#08080a" />
      {/* mics (end-on in this view, or beside the cabinet for side mics) */}
      {mics.map((mm) => (
        <ElevationMic key={mm.id} m={mm} />
      ))}
    </Group>
  );
}

function ElevationMic({ m }: { m: LeslieMic }) {
  // A side mic is drawn beside the cabinet aimed at it; a front/back mic is
  // seen end-on (its grille toward you), at its height.
  const side = Math.abs(m.z) > W2;
  if (side) {
    const ang = m.z > 0 ? -90 : 90;
    return (
      <Group transform={[{ translateX: m.z }, { translateY: m.y }, { rotate: (ang * Math.PI) / 180 }]}>
        <InstrumentDynamicMic r={16} len={157} />
      </Group>
    );
  }
  if (Math.abs(m.x) < HALF_D) return null;
  return (
    <Group>
      <Circle cx={m.z} cy={m.y} r={19} color="#000" opacity={0.5} />
      <Circle cx={m.z} cy={m.y} r={16}>
        <RadialGradient c={vec(m.z - 5, m.y - 5)} r={22} colors={['#a9aeb8', '#575c66', '#1e2025']} />
      </Circle>
      <Circle cx={m.z} cy={m.y} r={16} style="stroke" strokeWidth={2} color={m.x < 0 ? '#8a8f9c' : '#e3e7ef'} opacity={0.8}>
        {m.x < 0 ? <DashPathEffect intervals={[5, 4]} /> : null}
      </Circle>
    </Group>
  );
}

/* ── one plan panel (the horn level or the drum level) ── */
function PlanPanel({ rig, level, mics }: { rig: LeslieRig; level: 'upper' | 'lower'; mics: LeslieMic[] }) {
  const b = getBuilt();
  const w = level === 'upper' ? b.planUpper : b.planLower;
  const rot = useDerivedValue(() => [{ rotate: (-(angleAt(level === 'upper' ? rig.horn.value : rig.drum.value, rig.clock.value)) * Math.PI) / 180 }]);
  return (
    <Group>
      <Path path={b.planFloor} color={level === 'upper' ? '#17110c' : '#140e0a'} />
      <Path path={w.walls}>
        <LinearGradient start={vec(-W2, -HALF_D)} end={vec(W2, HALF_D)} colors={WOOD_CUT} />
      </Path>
      <Path path={w.walls} style="stroke" strokeWidth={1.2} color="#08080a" />
      <Path path={w.slats} style="stroke" strokeWidth={5} strokeCap="round" color="#a06a38" />
      {level === 'upper' ? (
        <>
          <Group transform={rot}>
            <Path path={b.bells}>
              <LinearGradient start={vec(-40, -REACH)} end={vec(40, REACH)} colors={['#5a5e68', '#2a2c32', '#121316']} />
            </Path>
            <Path path={b.bells} style="stroke" strokeWidth={2} color="#08080a" />
            <Path path={b.mouths} style="stroke" strokeWidth={7} strokeCap="round" color="#030304" />
            <Path path={b.mouths} style="stroke" strokeWidth={2} color="#9aa0ab" opacity={0.7} />
            <Path path={b.plug}>
              <LinearGradient start={vec(-30, -REACH)} end={vec(30, -REACH + 12)} colors={['#8a8f99', '#4a4e57', '#24262b']} />
            </Path>
            <Path path={b.plug} style="stroke" strokeWidth={1.4} color="#08080a" />
          </Group>
          <Circle cx={0} cy={0} r={HUB_R}>
            <RadialGradient c={vec(-12, -12)} r={HUB_R * 1.4} colors={['#e3e6ec', '#8a8f99', '#3a3d45']} />
          </Circle>
          <Circle cx={0} cy={0} r={HUB_R} style="stroke" strokeWidth={1.4} color="#08080a" />
        </>
      ) : (
        <Group transform={rot}>
          <Circle cx={0} cy={0} r={DRUM_R}>
            <RadialGradient c={vec(-DRUM_R * 0.3, -DRUM_R * 0.35)} r={DRUM_R * 1.5} colors={['#a06a38', '#6b4220', '#2a190b']} />
          </Circle>
          <Path path={b.deflector} style="stroke" strokeWidth={9} strokeCap="round" color="#2a190b" />
          <Path path={b.deflector} style="stroke" strokeWidth={3} strokeCap="round" color="#d9a766" opacity={0.6} />
          <Path path={b.drumRim} style="stroke" strokeWidth={10} color="#3b2614" />
          <Path path={b.drumRim} style="stroke" strokeWidth={2.4} color="#d9a766" opacity={0.7} />
          <Circle cx={0} cy={0} r={10} color="#9aa0ab" />
        </Group>
      )}
      {mics.filter((m) => m.level === level).map((m) => (
        <PlanMic key={m.id} m={m} rig={rig} level={level} />
      ))}
    </Group>
  );
}

function PlanMic({ m, rig, level }: { m: LeslieMic; rig: LeslieRig; level: 'upper' | 'lower' }) {
  // u = z, v = x. The drawing's front points up the screen at rotation 0 and
  // (sin α, −cos α) after rotate(α): turn it to face `aim` = (z, x) on screen.
  const ang = Math.atan2(m.aim.z, -m.aim.x);
  // Lit while a horn bell (or the drum's opening) points at it.
  const lit = useDerivedValue(() => {
    const deg = angleAt(level === 'upper' ? rig.horn.value : rig.drum.value, rig.clock.value);
    if (level === 'upper') return bellToMic(deg, m) < 25 ? 1 : 0;
    const a = (deg * Math.PI) / 180;
    const c = (Math.cos(a) * m.x + Math.sin(a) * m.z) / (Math.hypot(m.x, m.z) || 1);
    return c > Math.cos((40 * Math.PI) / 180) ? 1 : 0;
  });
  return (
    <Group>
      <Circle cx={m.z} cy={m.x} r={34} color={AMBER} opacity={0.12} />
      <Group opacity={lit}>
        <Circle cx={m.z} cy={m.x} r={34} style="stroke" strokeWidth={6} color={AMBER} />
      </Group>
      <Group transform={[{ translateX: m.z }, { translateY: m.x }, { rotate: ang }]}>
        <InstrumentDynamicMic r={16} len={157} />
      </Group>
    </Group>
  );
}

/* ── the speed strip: both rotors against real time since the last change ── */
const STRIP_S = 9;
/** The strip's rpm scale: headroom above the fastest speed for its key row. */
const RPM_TOP = 500;
function SpeedStrip({ rig, w, h, x0, y0 }: { rig: LeslieRig; w: number; h: number; x0: number; y0: number }) {
  const padL = 34;
  const gw = w - padL - 10;
  const gh = h - 18;
  const yOf = (rpm: number) => y0 + 4 + gh - (rpm / RPM_TOP) * gh;
  const xOf = (s: number) => x0 + padL + (Math.min(STRIP_S, Math.max(0, s)) / STRIP_S) * gw;
  const curves = useMemo(() => {
    const mk = (r: Ramp) => {
      const p = make();
      for (let i = 0; i <= 90; i++) {
        const s = (STRIP_S * i) / 90;
        const rpm = rpmAt(r, r.t0 + s);
        if (i === 0) p.moveTo(xOf(s), yOf(rpm));
        else p.lineTo(xOf(s), yOf(rpm));
      }
      return p;
    };
    return { horn: mk(rig.hornRamp), drum: mk(rig.drumRamp) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig.hornRamp, rig.drumRamp, w, h, x0, y0]);
  const grid = useMemo(() => {
    const p = make();
    for (const rpm of [0, 100, 200, 300, 400]) {
      p.moveTo(x0 + padL, yOf(rpm));
      p.lineTo(x0 + padL + gw, yOf(rpm));
    }
    for (let s = 0; s <= STRIP_S; s += 1) {
      p.moveTo(xOf(s), y0 + 4);
      p.lineTo(xOf(s), y0 + 4 + gh);
    }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, x0, y0]);
  // (Worklet: plain numbers only.)
  const left = x0 + padL;
  const cursorX = useDerivedValue(() => left + (Math.min(STRIP_S, Math.max(0, rig.clock.value - rig.horn.value.t0)) / STRIP_S) * gw);
  const p1 = useDerivedValue(() => vec(cursorX.value, y0 + 4));
  const p2 = useDerivedValue(() => vec(cursorX.value, y0 + 4 + gh));
  return (
    <Group>
      <Rect x={x0} y={y0} width={w} height={h} color="#0c0c0f" />
      <Path path={grid} style="stroke" strokeWidth={1} color="#26272e" />
      <Path path={curves.drum} style="stroke" strokeWidth={2.4} color={BLUE} />
      <Path path={curves.horn} style="stroke" strokeWidth={2.4} color={AMBER} />
      <Line p1={p1} p2={p2} color="#e8eaee" strokeWidth={1.4} opacity={0.8}>
        <DashPathEffect intervals={[4, 3]} />
      </Line>
    </Group>
  );
}

/* ── taps and highlights on the elevations (orient page) ── */
type Rect4 = { u0: number; u1: number; v0: number; v1: number };
/** The parts a learner can tap, per elevation (u = z, v = y), outermost last. */
export function leslieRegions(view: 'inside' | 'front'): { id: string; r: Rect4 }[] {
  const wR = LESLIE.woofer.mm / 2;
  if (view === 'front') {
    return [
      { id: 'les.upper', r: { u0: -300, u1: 300, v0: LESLIE.upperLouvers.y0, v1: LESLIE.upperLouvers.y1 } },
      { id: 'les.lower', r: { u0: -300, u1: 300, v0: LESLIE.lowerOpenings.y0, v1: LESLIE.lowerOpenings.y1 } },
      { id: 'les.cabinet', r: { u0: -W2 - 9, u1: W2 + 9, v0: -H, v1: 0 } },
    ];
  }
  return [
    { id: 'les.driver', r: { u0: -58, u1: 58, v0: HORN_Y + 60, v1: HORN_Y + 210 } },
    { id: 'les.horn', r: { u0: -REACH, u1: REACH, v0: HORN_Y - BELL_MOUTH / 2, v1: HORN_Y + BELL_MOUTH / 2 } },
    { id: 'les.xo', r: { u0: -W2 + WALL + 12, u1: -W2 + WALL + 162, v0: SHELF_Y + WALL + 18, v1: SHELF_Y + WALL + 18 + 180 } },
    { id: 'les.woofer', r: { u0: -wR, u1: wR, v0: WOOF_Y - 160, v1: WOOF_Y + WALL + 4 } },
    { id: 'les.drum', r: { u0: -DRUM_R, u1: DRUM_R, v0: DRUM_TOP - 20, v1: DRUM_BOT + 20 } },
    { id: 'les.cabinet', r: { u0: -W2 - 9, u1: W2 + 9, v0: -H, v1: 0 } },
  ];
}
export function leslieHit(view: 'inside' | 'front', u: number, v: number, tol: number): string | null {
  for (const g of leslieRegions(view)) if (u >= g.r.u0 - tol && u <= g.r.u1 + tol && v >= g.r.v0 - tol && v <= g.r.v1 + tol) return g.id;
  return null;
}

/* ── the display ── */
export type LeslieView = 'inside' | 'front' | 'plan';

export function LeslieDisplay({ w, h, rig, view, mics = [], accessibilityLabel, showStrip = true, highlight = null, onTapPart }: { w: number; h: number; rig: LeslieRig; view: LeslieView; mics?: LeslieMic[]; accessibilityLabel: string; showStrip?: boolean; highlight?: string | null; onTapPart?: (id: string) => void }) {
  const ts = useStageTextScale();
  const fs = Math.max(9, 9.5 * ts);
  const stripH = showStrip ? Math.round(Math.max(64, Math.min(110, h * 0.26))) : 0;
  const top = Math.round(fs * 1.6 + 6);
  const gh = h - stripH - top;
  // The plan shows the cabinet and the close mics round it (a mic's front is
  // its position; its body reaches ≈ 170 mm behind).
  const close = mics.filter((m) => m.level !== 'room');
  const ext = (sel: (m: LeslieMic) => number, half: number) => Math.max(half + 70, ...close.map((m) => Math.abs(sel(m)) + 190));
  const ez = ext((m) => m.z, W2);
  const ex = ext((m) => m.x, HALF_D) + (mics.some((m) => m.level === 'room') ? 120 : 0);
  const sideMics = mics.some((m) => Math.abs(m.z) > W2);
  const wide = view === 'inside' ? 470 : sideMics ? ez - W2 : 90;
  const frontBox = { u0: -W2 - wide, u1: W2 + wide, v0: -H - 60, v1: 40 };
  const planBox = { u0: -ez, u1: ez, v0: -ex, v1: ex + 60 };
  // Two plan panels: stacked on a tall glass, side by side on a wide one —
  // whichever draws them larger.
  const stackS = Math.min(w / (planBox.u1 - planBox.u0), gh / 2 / (planBox.v1 - planBox.v0));
  const sideS = Math.min(w / 2 / (planBox.u1 - planBox.u0), gh / (planBox.v1 - planBox.v0));
  const stacked = stackS > sideS;
  const xfs = useMemo(() => {
    if (view === 'plan') {
      const pw = stacked ? w : w / 2;
      const ph = stacked ? gh / 2 : gh;
      const f = fitXform('top', planBox, pw, ph, 4);
      const oy0 = top + ph / 2 - ((planBox.v0 + planBox.v1) / 2) * f.s;
      const mk = (i: number): ViewXform => ({ view: 'top', s: f.s, ox: (stacked ? 0 : i * pw) + pw / 2, oy: oy0 + (stacked ? i * ph : 0) });
      return [mk(0), mk(1)];
    }
    const f = fitXform('side', frontBox, w, gh, 4);
    return [{ ...f, oy: f.oy + top }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, w, gh, top, ez, ex, wide, stacked]);
  const slowed = TIME_BASES.find((b) => b.id === rig.timeBase)!;
  const room = mics.some((m) => m.level === 'room');
  const labels: StaticLabel[][] = useMemo(() => {
    if (view === 'plan') {
      return [
        [
          { id: 'u', text: 'UPPER · HORN ROTOR', short: 'HORN', u: 0, v: -HALF_D - 40, align: 'center', tone: 'amber' },
          { id: 'f', text: 'FRONT ↓', u: 0, v: HALF_D + 50, align: 'center', tone: 'muted' },
        ],
        [
          { id: 'l', text: 'LOWER · LOW ROTOR', short: 'LOW ROTOR', u: 0, v: -HALF_D - 40, align: 'center', tone: 'blue' },
          { id: 'f2', text: room ? 'FRONT ↓ · A PAIR ≈ 2 m OUT' : 'FRONT ↓', short: 'FRONT ↓', u: 0, v: HALF_D + 50, align: 'center', tone: 'muted' },
        ],
      ];
    }
    const out: StaticLabel[] = view === 'inside'
      ? [
          { id: 'horn', text: 'HORN ROTOR (TWO BELLS)', short: 'HORN ROTOR', u: W2 + 10, v: HORN_Y - 10, align: 'left', tone: 'amber' },
          { id: 'driver', text: 'HORN DRIVER', short: 'DRIVER', u: 70, v: HORN_Y + 140, align: 'left', tone: 'muted' },
          { id: 'woofer', text: 'WOOFER, FACING DOWN', short: 'WOOFER', u: W2 + 10, v: WOOF_Y - 70, align: 'left', tone: 'muted' },
          { id: 'xo', text: `CROSSOVER ${CROSSOVER_HZ} Hz · AMP`, short: `${CROSSOVER_HZ} Hz · AMP`, u: -W2 - 10, v: SHELF_Y + 110, align: 'right', tone: 'muted' },
          { id: 'drum', text: 'LOW ROTOR (DRUM)', short: 'LOW ROTOR', u: W2 + 10, v: DRUM_Y, align: 'left', tone: 'blue' },
          { id: 'never', text: 'INSIDE VIEW · NEVER OPEN THE CABINET', short: 'INSIDE VIEW · NEVER OPEN IT', u: 0, v: -H - 30, align: 'center', tone: 'illustrative' },
        ]
      : [
          { id: 'ul', text: 'UPPER LOUVERS', short: 'UPPER', u: W2 + 10, v: (LESLIE.upperLouvers.y0 + LESLIE.upperLouvers.y1) / 2, align: 'left', tone: 'amber' },
          { id: 'lo', text: 'LOWER OPENINGS', short: 'LOWER', u: W2 + 10, v: (LESLIE.lowerOpenings.y0 + LESLIE.lowerOpenings.y1) / 2, align: 'left', tone: 'blue' },
        ];
    return [out];
  }, [view, room]);
  const xfMain = xfs[0];
  const hiRect = view !== 'plan' && highlight ? leslieRegions(view).find((g) => g.id === highlight)?.r ?? null : null;
  const hiPath = useMemo(() => {
    if (!hiRect) return null;
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(hiRect.u0 - 12, hiRect.v0 - 12, hiRect.u1 - hiRect.u0 + 24, hiRect.v1 - hiRect.v0 + 24), 14, 14));
    return p;
  }, [hiRect]);
  const onPress = (x: number, y: number) => {
    if (!onTapPart || view === 'plan') return;
    const id = leslieHit(view, (x - xfMain.ox) / xfMain.s, (y - xfMain.oy) / xfMain.s, 14 / xfMain.s);
    if (id) onTapPart(id);
  };
  return (
    <Pressable disabled={!onTapPart} onPress={(e) => onPress(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
    <View pointerEvents="none" style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        {view === 'plan' ? (
          <>
            {(['upper', 'lower'] as const).map((lvl, i) => (
              <Group key={lvl} transform={[{ translateX: xfs[i].ox }, { translateY: xfs[i].oy }, { scale: xfs[i].s }]}>
                <PlanPanel rig={rig} level={lvl} mics={mics} />
              </Group>
            ))}
          </>
        ) : (
          <Group transform={[{ translateX: xfMain.ox }, { translateY: xfMain.oy }, { scale: xfMain.s }]}>
            <FrontElevation rig={rig} inside={view === 'inside'} mics={mics} />
            {hiPath ? <Path path={hiPath} style="stroke" strokeWidth={3.5 / xfMain.s} color={AMBER} /> : null}
          </Group>
        )}
        {showStrip ? <SpeedStrip rig={rig} w={w} h={stripH} x0={0} y0={h - stripH} /> : null}
      </Canvas>
      {labels.map((ls, i) => (
        <StaticLabels key={i} labels={ls} xf={xfs[Math.min(i, xfs.length - 1)]} scale={ts} w={w} />
      ))}
      <View pointerEvents="none" style={styles.topRow}>
        <LiveSpeed rig={rig} fs={fs} />
        <Text style={[styles.tag, { fontSize: fs }]} {...fitValue(fs)}>
          {rig.motion ? slowed.label : 'STEPPED'}
        </Text>
      </View>
      {showStrip ? (
        <View pointerEvents="none" style={[styles.stripKey, { top: h - stripH + 2 }]}>
          <Text style={[styles.key, { fontSize: fs, color: AMBER }]}>HORN</Text>
          <Text style={[styles.key, { fontSize: fs, color: BLUE }]}>LOW ROTOR</Text>
          <Text style={[styles.key, { fontSize: fs, color: colors.textMuted }]}>{`rpm · 0–${STRIP_S} s since the change`}</Text>
        </View>
      ) : null}
      {showStrip ? (
        <>
          <Text pointerEvents="none" style={[styles.axis, { fontSize: fs, top: h - stripH + 4 + (stripH - 18) * (1 - 400 / RPM_TOP) - fs * 0.6 }]}>400</Text>
          <Text pointerEvents="none" style={[styles.axis, { fontSize: fs, top: h - stripH + 4 + (stripH - 18) - fs * 0.6 }]}>0</Text>
        </>
      ) : null}
    </View>
    </Pressable>
  );
}

/** The rotors' state in words (screen readers; the well's summary). */
export function leslieWords(rig: LeslieRig): string {
  const t = rig.clock.value;
  const h = Math.round(rpmAt(rig.horn.value, t));
  const d = Math.round(rpmAt(rig.drum.value, t));
  const ha = Math.round(wrap360(angleAt(rig.horn.value, t)));
  return `Horn rotor ${h} rpm, low rotor ${d} rpm; a horn bell points ${ha < 45 || ha > 315 ? 'to the front' : ha < 135 ? 'to the right' : ha < 225 ? 'to the back' : 'to the left'}.`;
}

/** The ramp times as words (for the well): from the sourced table. */
export function rampWords(): string {
  const h = ROTORS.horn;
  const d = ROTORS.drum;
  return `Horn: ${h.slowRpm} rpm slow, ${h.fastRpm} rpm fast; ${h.riseS} s to speed up, ${h.fallS} s to slow down. Low rotor: ${d.slowRpm} rpm slow, ${d.fastRpm} rpm fast; ${d.riseS} s up, ${d.fallS} s down.`;
}

const styles = StyleSheet.create({
  topRow: { position: 'absolute', left: 4, right: 4, top: 3, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  live: { color: '#e8eaee', fontFamily: fonts.oswaldMedium, letterSpacing: 0.3, padding: 0, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(12,12,15,0.72)', borderRadius: 6, includeFontPadding: false, flexShrink: 1 },
  liveWeb: { alignSelf: 'flex-start' },
  tag: { color: AMBER, fontFamily: fonts.oswaldMedium, letterSpacing: 1, backgroundColor: 'rgba(12,12,15,0.72)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  stripKey: { position: 'absolute', left: 36, right: 6, flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  key: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
  axis: { position: 'absolute', left: 2, width: 28, textAlign: 'right', color: colors.textMuted, fontFamily: fonts.oswaldMedium },
});
