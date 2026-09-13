/**
 * HzCounterDemo — Frequency Counter & Tuner training demo (Tool 7).
 *
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md — Tool 7 "Frequency
 * Counter & Tuner" + §4 Demo mode; user ruling 2026-07-23: demos are
 * VISUAL/ANIMATED ONLY until an audio output path exists. The hosting screen
 * renders the permanent "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge; every
 * number shown here is scripted from fixed arrays — nothing is measured, and
 * per spec §5 + measurement-tools §1.7 no LedMeter / live-meter lookalikes.
 *
 * Scenes (design pass 2026-09-13, shared demo contract):
 *  1 TAPS → FREQUENCY — pulse train + the waveform that rate implies (one tap
 *    per cycle peak), linked FREQ/PERIOD/TEMPO readouts and a math strip whose
 *    values co-move with the depicted spacing.
 *  2 STABILITY — steady vs wobbly source: per-gap ms readouts, ghost on-time
 *    marks, and what an honest counter does with each (lock vs no lock).
 *  3 FREQUENCY vs PITCH — A4 cents gauge (±3¢ in-tune window) over an octave
 *    ladder A2 110 → A5 880 showing that each octave doubles the hertz.
 *
 * Amplitude colour standard: the implied waveform is tinted on the shared
 * levelColor ramp (drawn at a healthy ~55% of full scale — fixed reference,
 * never auto-ranging); its midline is MIDLINE_BLUE. Animation: RN core
 * Animated only, transforms/opacity of Views on the native driver — all SVG
 * geometry is static per scripted preset.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { levelColor, MIDLINE_BLUE } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';

const PANEL_PAD = 12;
const VIZ_PAD = 10;
const PAD_X = 16;
const PULSE_REST = 0.25;
const SWEEP_HOLD_MS = 400;

/** Shared demo-contract annotation colours. */
const SALMON = '#ff8d7a'; // incorrect / warning
const LEADER = 'rgba(255,255,255,.35)'; // callout leader lines
const GUIDE = 'rgba(255,255,255,.18)'; // dashed construction guides

/* ------------------------------------------------------------------ */
/* Scene 1 — TAPS → FREQUENCY                                          */
/* ------------------------------------------------------------------ */

/** Timeline span depicted by the sweep, in scripted milliseconds. */
const TAP_SPAN_MS = 2200;
const TAP_T0_MS = 150;

/** Fixed presets — readouts are precomputed from the depicted spacing. */
const TAP_PRESETS = [
  { periodMs: 500, hz: '2.00', bpm: '120' },
  { periodMs: 400, hz: '2.50', bpm: '150' },
  { periodMs: 625, hz: '1.60', bpm: '96' },
] as const;

const TAPS_SVG_H = 184;
const TAP_BASE_Y = 54;
const WAVE_MID_Y = 132;
const WAVE_AMP = 34;
/** The implied sine is drawn at a healthy operating level, not full scale, so
 *  the shared ramp tints it blue→green — never falsely "hot". Fixed reference. */
const WAVE_PEAK_LEVEL = 0.55;
const SINE_STOPS: ReadonlyArray<{ offset: number; color: string }> = [
  0, 0.08, 0.2, 0.32, 0.42, 0.5, 0.58, 0.68, 0.8, 0.92, 1,
].map((offset) => ({ offset, color: levelColor(Math.abs(1 - 2 * offset) * WAVE_PEAK_LEVEL) }));

/** Static sine sketch whose peaks land exactly on the tap instants. */
function sinePath(usable: number, periodMs: number): string {
  const n = 160;
  const parts: string[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = (i / n) * TAP_SPAN_MS;
    const x = PAD_X + (t / TAP_SPAN_MS) * usable;
    const y = WAVE_MID_Y - WAVE_AMP * Math.cos((2 * Math.PI * (t - TAP_T0_MS)) / periodMs);
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

function TapsScene({ vizW }: { vizW: number }) {
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = TAP_PRESETS[presetIdx % TAP_PRESETS.length];
  const usable = vizW - PAD_X * 2;
  const xForT = (t: number) => PAD_X + (t / TAP_SPAN_MS) * usable;

  const times = useMemo(() => {
    const ts: number[] = [];
    for (let t = TAP_T0_MS; t <= TAP_SPAN_MS - TAP_T0_MS; t += preset.periodMs) ts.push(t);
    return ts;
  }, [preset.periodMs]);

  const pulses = useMemo(() => times.map((t) => ({ t, v: new Animated.Value(PULSE_REST) })), [times]);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sweep.setValue(0);
    pulses.forEach((p) => p.v.setValue(PULSE_REST));
    const pass = Animated.parallel([
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: TAP_SPAN_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(SWEEP_HOLD_MS),
      ]),
      ...pulses.map((p) =>
        Animated.sequence([
          Animated.delay(Math.max(0, p.t - 40)),
          Animated.timing(p.v, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.v, {
            toValue: PULSE_REST,
            duration: 340,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);
    const run = Animated.loop(pass, { iterations: 2 });
    run.start(({ finished }) => {
      if (finished) setPresetIdx((i) => (i + 1) % TAP_PRESETS.length);
    });
    return () => run.stop();
  }, [pulses, sweep]);

  const bx0 = xForT(times[0]);
  const bx1 = xForT(times[1]);
  const wavePeakY = WAVE_MID_Y - WAVE_AMP;
  const waveD = useMemo(() => sinePath(usable, preset.periodMs), [usable, preset.periodMs]);

  return (
    <View>
      {/* Linked instrument readouts — one measurement, three units. */}
      <View style={styles.readoutRow}>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>FREQ</Text>
          <View style={styles.readoutValRow}>
            <Text style={[styles.readoutVal, { color: colors.amber }]}>{preset.hz}</Text>
            <Text style={styles.readoutUnit}>Hz</Text>
          </View>
        </View>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>PERIOD</Text>
          <View style={styles.readoutValRow}>
            <Text style={styles.readoutVal}>{preset.periodMs}</Text>
            <Text style={styles.readoutUnit}>ms</Text>
          </View>
        </View>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>TEMPO</Text>
          <View style={styles.readoutValRow}>
            <Text style={styles.readoutVal}>{preset.bpm}</Text>
            <Text style={styles.readoutUnit}>BPM</Text>
          </View>
        </View>
      </View>

      <View style={styles.stage}>
        <Svg width={vizW} height={TAPS_SVG_H}>
          <Defs>
            <LinearGradient
              id="hzSineRamp"
              x1={0}
              y1={WAVE_MID_Y - WAVE_AMP}
              x2={0}
              y2={WAVE_MID_Y + WAVE_AMP}
              gradientUnits="userSpaceOnUse"
            >
              {SINE_STOPS.map((s) => (
                <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>

          {/* One period, shaded from the tap gap down through one wave cycle */}
          <Rect x={bx0} y={24} width={bx1 - bx0} height={146} fill="rgba(255,180,0,.05)" />
          <Line x1={bx0} y1={24} x2={bx0} y2={170} stroke={GUIDE} strokeWidth={1} strokeDasharray="3 4" />
          <Line x1={bx1} y1={24} x2={bx1} y2={170} stroke={GUIDE} strokeWidth={1} strokeDasharray="3 4" />

          {/* Period bracket over the first interval — the taught quantity */}
          <Path d={`M ${bx0} 32 V 24 H ${bx1} V 32`} stroke={colors.amber} strokeWidth={1.5} fill="none" />
          <SvgText
            x={(bx0 + bx1) / 2}
            y={16}
            fill={colors.amber}
            fontFamily={fonts.mono}
            fontSize={11.5}
            textAnchor="middle"
          >
            {`T = ${preset.periodMs} ms`}
          </SvgText>

          {/* Timeline + tap marks */}
          <Line x1={PAD_X} y1={TAP_BASE_Y} x2={PAD_X + usable} y2={TAP_BASE_Y} stroke={colors.hairline} strokeWidth={2} />
          {times.map((t) => (
            <Circle
              key={t}
              cx={xForT(t)}
              cy={TAP_BASE_Y}
              r={7}
              stroke={colors.steelBorder}
              strokeWidth={1.5}
              fill="#17171b"
            />
          ))}

          {/* The waveform this rate implies — ramp-tinted, MIDI-blue midline */}
          <SvgText x={PAD_X} y={181} fill={colors.textSub} fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1}>
            THE WAVE AT THIS RATE
          </SvgText>
          <Line
            x1={PAD_X}
            y1={WAVE_MID_Y}
            x2={PAD_X + usable}
            y2={WAVE_MID_Y}
            stroke={MIDLINE_BLUE}
            strokeWidth={1}
            opacity={0.75}
          />
          <Path d={waveD} stroke="url(#hzSineRamp)" strokeWidth={2} fill="none" />

          {/* Callout: each tap sits on a cycle peak */}
          <Line x1={bx1 + 2} y1={wavePeakY - 2} x2={bx1 + 9} y2={wavePeakY - 8} stroke={LEADER} strokeWidth={1} />
          <SvgText
            x={bx1 + 12}
            y={wavePeakY - 8}
            fill={colors.amber}
            fontFamily={fonts.oswaldSemiBold}
            fontSize={9.5}
            letterSpacing={1}
          >
            ONE TAP = ONE CYCLE
          </SvgText>
        </Svg>

        {/* Tap flashes — opacity/scale only, native driver */}
        {pulses.map((p) => (
          <Animated.View
            key={p.t}
            pointerEvents="none"
            style={[
              styles.tapDot,
              {
                left: xForT(p.t) - 7,
                top: TAP_BASE_Y - 7,
                opacity: p.v,
                transform: [{ scale: p.v.interpolate({ inputRange: [PULSE_REST, 1], outputRange: [1, 1.55] }) }],
              },
            ]}
          />
        ))}
        {/* Sweeping playhead across taps AND the implied wave */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.playhead,
            {
              left: PAD_X,
              top: 24,
              height: 146,
              transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, usable] }) }],
            },
          ]}
        />
      </View>

      {/* Math strip — the same values as the readouts, shown as the arithmetic */}
      <View style={styles.mathChip}>
        <Text style={styles.mathText}>
          1000 ÷ <Text style={styles.mathVal}>{preset.periodMs} ms</Text>
        </Text>
        <Text style={styles.mathText}>
          = <Text style={styles.mathVal}>{preset.hz} Hz</Text>
        </Text>
      </View>
      <View style={styles.mathChip}>
        <Text style={styles.mathText}>
          <Text style={styles.mathVal}>{preset.hz} Hz</Text> × 60
        </Text>
        <Text style={styles.mathText}>
          = <Text style={styles.mathVal}>{preset.bpm} BPM</Text>
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — STABILITY                                                 */
/* ------------------------------------------------------------------ */

const STAB_SPAN_MS = 2100;
/** Steady source: a constant 350 ms period → 1000/350 ≈ 2.86 Hz. */
const REG_TIMES = [150, 500, 850, 1200, 1550, 1900] as const;
/** Wobbly source: same nominal period + fixed seeded offsets (no Math.random). */
const JIT_TIMES = [150, 555, 810, 1270, 1490, 1930] as const;
/** Where the wobbly taps SHOULD have landed (the steady grid). */
const JIT_EXPECTED = [500, 850, 1200, 1550, 1900] as const;

const STRIP_SVG_H = 68;
const STRIP_MID_Y = 22;

function PulseStrip({
  vizW,
  times,
  pulses,
  sweep,
  accent,
  gapColor,
  calloutText,
  calloutColor,
  calloutGap,
  ghosts,
}: {
  vizW: number;
  times: readonly number[];
  pulses: { t: number; v: Animated.Value }[];
  sweep: Animated.Value;
  accent: string;
  gapColor: string;
  calloutText: string;
  calloutColor: string;
  /** Which inter-tap gap the callout's leader points at. */
  calloutGap: number;
  ghosts?: readonly number[];
}) {
  const usable = vizW - PAD_X * 2;
  const xForT = (t: number) => PAD_X + (t / STAB_SPAN_MS) * usable;
  const gaps = times.slice(1).map((t, i) => ({ mid: (xForT(t) + xForT(times[i])) / 2, ms: t - times[i] }));
  const co = gaps[Math.min(calloutGap, gaps.length - 1)];

  return (
    <View style={styles.stage}>
      <Svg width={vizW} height={STRIP_SVG_H}>
        {/* Ghost "on-time" marks — where a steady source would have landed */}
        {ghosts?.map((t) => (
          <Line
            key={`g${t}`}
            x1={xForT(t)}
            y1={STRIP_MID_Y - 10}
            x2={xForT(t)}
            y2={STRIP_MID_Y + 10}
            stroke={GUIDE}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        ))}
        {ghosts ? (
          <>
            <Line
              x1={xForT(ghosts[0]) + 1}
              y1={STRIP_MID_Y - 11}
              x2={xForT(ghosts[0]) + 7}
              y2={9}
              stroke={LEADER}
              strokeWidth={1}
            />
            <SvgText
              x={xForT(ghosts[0]) + 10}
              y={10}
              fill={colors.textSub}
              fontFamily={fonts.oswaldSemiBold}
              fontSize={9.5}
              letterSpacing={1}
            >
              ON-TIME MARKS
            </SvgText>
          </>
        ) : null}

        <Line x1={PAD_X} y1={STRIP_MID_Y} x2={PAD_X + usable} y2={STRIP_MID_Y} stroke={colors.hairline} strokeWidth={2} />
        {times.map((t) => (
          <Circle
            key={t}
            cx={xForT(t)}
            cy={STRIP_MID_Y}
            r={6}
            stroke={colors.steelBorder}
            strokeWidth={1.5}
            fill="#17171b"
          />
        ))}

        {/* The gaps, measured — the counter's actual raw data */}
        {gaps.map((g, i) => (
          <SvgText
            key={`ms${i}`}
            x={g.mid}
            y={44}
            fill={gapColor}
            fontFamily={fonts.mono}
            fontSize={10}
            textAnchor="middle"
            opacity={0.95}
          >
            {`${g.ms}`}
          </SvgText>
        ))}

        {/* Callout naming what the gap row shows */}
        <Line x1={co.mid} y1={47} x2={co.mid} y2={53} stroke={LEADER} strokeWidth={1} />
        <SvgText
          x={co.mid}
          y={63}
          fill={calloutColor}
          fontFamily={fonts.oswaldSemiBold}
          fontSize={9.5}
          letterSpacing={1}
          textAnchor="middle"
        >
          {calloutText}
        </SvgText>
      </Svg>

      {pulses.map((p) => (
        <Animated.View
          key={p.t}
          pointerEvents="none"
          style={[
            styles.stabDot,
            {
              backgroundColor: accent,
              left: xForT(p.t) - 6,
              top: STRIP_MID_Y - 6,
              opacity: p.v,
              transform: [{ scale: p.v.interpolate({ inputRange: [PULSE_REST, 1], outputRange: [1, 1.5] }) }],
            },
          ]}
        />
      ))}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.playhead,
          {
            left: PAD_X,
            top: 6,
            height: 32,
            transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, usable] }) }],
          },
        ]}
      />
    </View>
  );
}

function StabilityScene({ vizW }: { vizW: number }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const regPulses = useMemo(() => REG_TIMES.map((t) => ({ t, v: new Animated.Value(PULSE_REST) })), []);
  const jitPulses = useMemo(() => JIT_TIMES.map((t) => ({ t, v: new Animated.Value(PULSE_REST) })), []);

  useEffect(() => {
    const flashSeq = (p: { t: number; v: Animated.Value }) =>
      Animated.sequence([
        Animated.delay(Math.max(0, p.t - 40)),
        Animated.timing(p.v, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.v, {
          toValue: PULSE_REST,
          duration: 320,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    const run = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sweep, {
            toValue: 1,
            duration: STAB_SPAN_MS,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(SWEEP_HOLD_MS),
        ]),
        ...regPulses.map(flashSeq),
        ...jitPulses.map(flashSeq),
      ]),
    );
    run.start();
    return () => run.stop();
  }, [jitPulses, regPulses, sweep]);

  return (
    <View>
      <View style={styles.stripHeader}>
        <Text style={styles.stripLabel}>STEADY SOURCE</Text>
        <Text style={[styles.stripStat, { color: colors.green }]}>STABILITY 98%</Text>
      </View>
      <PulseStrip
        vizW={vizW}
        times={REG_TIMES}
        pulses={regPulses}
        sweep={sweep}
        accent={colors.green}
        gapColor={colors.green}
        calloutText="EVERY GAP = 350 ms"
        calloutColor={colors.amber}
        calloutGap={2}
      />
      <Text style={[styles.counterLine, { color: colors.green }]}>COUNTER LOCKS: 2.86 Hz · HIGH CONFIDENCE</Text>

      <View style={[styles.stripHeader, { marginTop: 12 }]}>
        <Text style={styles.stripLabel}>WOBBLY SOURCE</Text>
        <Text style={[styles.stripStat, { color: SALMON }]}>STABILITY 54%</Text>
      </View>
      <PulseStrip
        vizW={vizW}
        times={JIT_TIMES}
        pulses={jitPulses}
        sweep={sweep}
        accent={SALMON}
        gapColor={SALMON}
        calloutText="NO SINGLE PERIOD"
        calloutColor={SALMON}
        calloutGap={2}
        ghosts={JIT_EXPECTED}
      />
      <Text style={[styles.counterLine, { color: SALMON }]}>COUNTER HUNTS: NO STABLE LOCK · LOW CONFIDENCE</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — FREQUENCY vs PITCH                                        */
/* ------------------------------------------------------------------ */

/** Scripted cents positions — a fixed tour (sharp, flat, boundary, settle),
 *  not a measurement. All within the tuner's ±30¢ scale. */
const CENTS_STEPS = [18, -12, 6, 0, -3, 0] as const;
/**
 * The SHIPPING tuner (src/screens/tools/SkinnedTunerVu.tsx, owner 2026-09-10)
 * is a horizontal edgewise VU: a VERTICAL BLADE that travels sideways across a
 * printed ±30¢ scale — flat (♭) left, sharp (♯) right, a green ±5¢ in-tune zone
 * at centre. This demo mirrors that instrument. It previously drew the RETIRED
 * arc/needle "gas gauge," which is no longer anywhere in the app.
 */
const TUNER_MAX_CENTS = 30;
const IN_TUNE_CENTS = 5;
const STRIP_H = 120;
const STRIP_TOP = 22; // tick-zone top inside the window
const STRIP_BASE = 94; // baseline the ticks rise from; blade foot glow sits here
const BLADE_W = 3;

/** Octave ladder — log-spaced: equal steps because each octave DOUBLES Hz. */
const OCTAVE_NOTES = [
  { note: 'A2', hz: '110 Hz' },
  { note: 'A3', hz: '220 Hz' },
  { note: 'A4', hz: '440 Hz' },
  { note: 'A5', hz: '880 Hz' },
] as const;
const MAP_SVG_H = 90;
const MAP_AXIS_Y = 42;

function TunerScene({ vizW }: { vizW: number }) {
  const [stepIdx, setStepIdx] = useState(0);
  const rot = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0.35)).current;
  const cents = CENTS_STEPS[stepIdx % CENTS_STEPS.length];
  // The Hz readout must track the cents needle (F08): a source +12¢ from A4
  // reads 440·2^(12/1200) ≈ 443.1 Hz, not a static 440.0.
  const hz = 440 * Math.pow(2, cents / 1200);

  useEffect(() => {
    const anim = Animated.timing(rot, {
      toValue: cents,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      // NON-native: the blade drives translateX, and RN Animated's native driver
      // is a no-op on the 8090 web preview (tuner-vu lesson) — which desynced
      // the blade from the readout there. A single thin View is cheap in JS, and
      // this keeps blade and cents value in step on BOTH web and device.
      useNativeDriver: false,
    });
    anim.start();
    const id = setTimeout(() => setStepIdx((i) => (i + 1) % CENTS_STEPS.length), 1500);
    return () => {
      anim.stop();
      clearTimeout(id);
    };
  }, [cents, rot]);

  // Calm breathing highlight on the A4 anchor of the octave ladder.
  useEffect(() => {
    const run = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 0.95, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.35, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    run.start();
    return () => run.stop();
  }, [breathe]);

  const usable = vizW - PAD_X * 2;
  const cx = vizW / 2;
  const half = usable / 2;
  const xForCent = (c: number) => cx + (c / TUNER_MAX_CENTS) * half;
  const greenL = xForCent(-IN_TUNE_CENTS);
  const greenR = xForCent(IN_TUNE_CENTS);
  const bladeOffset = rot.interpolate({
    inputRange: [-TUNER_MAX_CENTS, TUNER_MAX_CENTS],
    outputRange: [-half, half],
  });

  const ticks = useMemo(() => {
    const out: { c: number; major: boolean }[] = [];
    for (let c = -TUNER_MAX_CENTS; c <= TUNER_MAX_CENTS; c += 5) {
      out.push({ c, major: c === -TUNER_MAX_CENTS || c === 0 || c === TUNER_MAX_CENTS });
    }
    return out;
  }, []);

  const centsText = cents > 0 ? `+${cents}` : `${cents}`;
  const inTune = Math.abs(cents) <= IN_TUNE_CENTS;
  const state = inTune ? 'IN TUNE' : cents < 0 ? 'FLAT' : 'SHARP';
  const stateColor = inTune ? colors.green : colors.amber;

  const mapUsable = vizW - PAD_X * 2;
  const mapX = (i: number) => PAD_X + (mapUsable * i) / (OCTAVE_NOTES.length - 1);
  const a4x = mapX(2);

  return (
    <View>
      <View style={styles.tunerHeader}>
        <Text style={styles.tunerHz}>{hz.toFixed(1)} Hz</Text>
        <Text style={styles.tunerArrow}>{'→'}</Text>
        <Text style={styles.tunerNote}>A4</Text>
      </View>

      {/* Edgewise cents strip — the SHIPPING tuner: a vertical blade travelling
          horizontally across a ±30¢ scale with a green ±5¢ zone. Replaces the
          retired arc/needle gauge (owner 2026-09-13). */}
      <View style={styles.tunerWindow}>
        <Svg width={vizW} height={STRIP_H}>
          {/* green in-tune zone — the only green on the face */}
          <Rect
            x={greenL}
            y={STRIP_TOP}
            width={greenR - greenL}
            height={STRIP_BASE - STRIP_TOP}
            fill={colors.green}
            opacity={0.14}
            rx={2}
          />
          <Line x1={greenL} y1={STRIP_TOP} x2={greenL} y2={STRIP_BASE} stroke={colors.green} strokeWidth={1.5} opacity={0.7} />
          <Line x1={greenR} y1={STRIP_TOP} x2={greenR} y2={STRIP_BASE} stroke={colors.green} strokeWidth={1.5} opacity={0.7} />

          {/* 1¢ fine ticks inside the zone (as the real face prints them) */}
          {Array.from({ length: 9 }, (_, k) => k - 4).map((c) => (
            <Line
              key={`f${c}`}
              x1={xForCent(c)}
              y1={STRIP_TOP}
              x2={xForCent(c)}
              y2={STRIP_TOP + 6}
              stroke={colors.green}
              strokeWidth={1}
              opacity={0.5}
            />
          ))}

          {/* 5¢ scale ticks; 0¢ is the amber centre */}
          {ticks.map((t) => (
            <Line
              key={t.c}
              x1={xForCent(t.c)}
              y1={t.major ? STRIP_TOP : STRIP_TOP + 4}
              x2={xForCent(t.c)}
              y2={STRIP_BASE}
              stroke={t.c === 0 ? colors.amber : t.major ? colors.textSub : colors.hairlineAlt}
              strokeWidth={t.c === 0 ? 2.5 : 1.5}
            />
          ))}

          {/* signed scale numbers */}
          {[-30, -15, 0, 15, 30].map((c) => (
            <SvgText
              key={`n${c}`}
              x={xForCent(c)}
              y={STRIP_BASE + 15}
              fill={c === 0 ? colors.amber : colors.textSub}
              fontFamily={fonts.mono}
              fontSize={11}
              textAnchor="middle"
            >
              {c > 0 ? `+${c}` : `${c}`}
            </SvgText>
          ))}

          {/* centred in-tune callout above the zone; flat/sharp at the ends */}
          <SvgText x={cx} y={11} fill={colors.amber} fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} textAnchor="middle">
            {`IN TUNE ±${IN_TUNE_CENTS} ¢`}
          </SvgText>
          <SvgText x={PAD_X} y={11} fill={colors.textSub} fontFamily={fonts.oswaldSemiBold} fontSize={9} letterSpacing={1}>
            ♭ FLAT
          </SvgText>
          <SvgText x={vizW - PAD_X} y={11} fill={colors.textSub} fontFamily={fonts.oswaldSemiBold} fontSize={9} letterSpacing={1} textAnchor="end">
            SHARP ♯
          </SvgText>
        </Svg>

        {/* Blade foot glow — a soft lamp at the blade's base, travelling with it
            (owner tuner request). Native-driver translateX only. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.bladeGlow, { left: cx - 11, top: STRIP_BASE - 13, transform: [{ translateX: bladeOffset }] }]}
        />
        {/* Blade — ALWAYS vertical, pure horizontal travel, exact per-cent
            registration (the real tuner's cardinal rule). */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.blade,
            {
              left: cx - BLADE_W / 2,
              top: STRIP_TOP,
              height: STRIP_BASE - STRIP_TOP,
              backgroundColor: stateColor,
              transform: [{ translateX: bladeOffset }],
            },
          ]}
        />
      </View>

      {/* live readout */}
      <View style={styles.tunerReadout}>
        <Text style={[styles.tunerCents, { color: stateColor }]}>{centsText}{' ¢'}</Text>
        <Text style={[styles.tunerState, { color: stateColor }]}>{state}</Text>
        <Text style={styles.refBadge}>REF A4 = 440 Hz</Text>
      </View>

      {/* Octave ladder — where frequencies land musically */}
      <Text style={styles.mapLabel}>WHERE Hz LANDS MUSICALLY</Text>
      <View style={styles.stage}>
        <Svg width={vizW} height={MAP_SVG_H}>
          {OCTAVE_NOTES.slice(0, -1).map((_, i) => {
            const x0 = mapX(i);
            const x1 = mapX(i + 1);
            const mid = (x0 + x1) / 2;
            return (
              <Path
                key={`arc${i}`}
                d={`M ${x0} ${MAP_AXIS_Y - 8} Q ${mid} 12 ${x1} ${MAP_AXIS_Y - 8}`}
                stroke="rgba(255,255,255,.22)"
                strokeWidth={1}
                fill="none"
              />
            );
          })}
          {OCTAVE_NOTES.slice(0, -1).map((_, i) => (
            <SvgText
              key={`x2${i}`}
              x={(mapX(i) + mapX(i + 1)) / 2}
              y={18}
              fill={colors.amber}
              fontFamily={fonts.mono}
              fontSize={11}
              textAnchor="middle"
            >
              ×2
            </SvgText>
          ))}
          <Line x1={PAD_X} y1={MAP_AXIS_Y} x2={PAD_X + mapUsable} y2={MAP_AXIS_Y} stroke={colors.hairline} strokeWidth={2} />
          {OCTAVE_NOTES.map((n, i) => {
            const isRef = n.note === 'A4';
            return (
              <Circle
                key={n.note}
                cx={mapX(i)}
                cy={MAP_AXIS_Y}
                r={isRef ? 5.5 : 5}
                stroke={isRef ? colors.amber : colors.steelBorder}
                strokeWidth={1.5}
                fill={isRef ? colors.amber : '#17171b'}
              />
            );
          })}
          {OCTAVE_NOTES.map((n, i) => {
            const isRef = n.note === 'A4';
            return (
              <SvgText
                key={`n${n.note}`}
                x={mapX(i)}
                y={64}
                fill={isRef ? colors.amber : colors.textPrimary}
                fontFamily={fonts.oswaldSemiBold}
                fontSize={11.5}
                letterSpacing={0.8}
                textAnchor="middle"
              >
                {n.note}
              </SvgText>
            );
          })}
          {OCTAVE_NOTES.map((n, i) => {
            const isRef = n.note === 'A4';
            return (
              <SvgText
                key={`h${n.note}`}
                x={mapX(i)}
                y={79}
                fill={isRef ? colors.amber : colors.textSub}
                fontFamily={fonts.mono}
                fontSize={10.5}
                textAnchor="middle"
              >
                {n.hz}
              </SvgText>
            );
          })}
        </Svg>
        {/* Breathing highlight on the tuner's anchor — opacity/scale only */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.anchorDot,
            {
              left: a4x - 6,
              top: MAP_AXIS_Y - 6,
              opacity: breathe,
              transform: [{ scale: breathe.interpolate({ inputRange: [0.35, 0.95], outputRange: [1, 1.35] }) }],
            },
          ]}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Demo shell                                                          */
/* ------------------------------------------------------------------ */

const SCENES = [
  {
    key: 'taps',
    label: 'TAPS → Hz',
    watch: 'ALL THREE READOUTS MOVE TOGETHER WHEN THE SPACING CHANGES',
    body:
      'Every repeating event hides one number: the period T — the gap from one tap to the next. Frequency is simply its inverse (1000 ÷ T in ms), and BPM is the same rate counted per minute, so the three readouts are one measurement wearing three units. The wave under the taps is that same clock as sound: one tap per cycle peak.',
    note: 'Tap mode measures YOUR tapping — give it 8–10 taps so the average dilutes your timing error.',
  },
  {
    key: 'stability',
    label: 'STABILITY',
    watch: 'THE GAP NUMBERS — IDENTICAL ON TOP, SCATTERED BELOW',
    body:
      'A counter never reads frequency directly: it times the gaps between events and checks that they agree. The steady source repeats every 350 ms, so the counter locks 2.86 Hz with high confidence. The wobbly source misses its on-time marks — the gaps share no single period, so an honest counter reports low stability instead of inventing a number.',
    note: 'A jumpy readout is the tool being honest, not broken — steady the source before trusting the number.',
  },
  {
    key: 'pitch',
    label: 'Hz vs PITCH',
    watch: 'THE Hz READOUT AND THE CENTS NEEDLE TELL ONE STORY',
    body:
      'Frequency is measured physics — cycles per second. Pitch is the musical name laid on top of it, anchored to a reference: here A4 = 440 Hz, and the needle reads the gap between them in cents (hundredths of a semitone). The ladder below shows how the map works: every octave up doubles the hertz — A2 110 to A5 880.',
    note: 'Everything reading about 8 ¢ flat? Check the reference first — 440 vs 442 differs by roughly 8 cents.',
  },
] as const;

/** Frequency Counter & Tuner — scripted visual training demo (Tool 7). */
export function HzCounterDemo() {
  const [scene, setScene] = useState(0);
  const [panelW, setPanelW] = useState(0);
  const vizW = panelW > 0 ? panelW - PANEL_PAD * 2 - VIZ_PAD * 2 : 300;

  const onLayout = (e: LayoutChangeEvent) => setPanelW(e.nativeEvent.layout.width);
  const active = SCENES[scene];

  return (
    <View style={styles.root} onLayout={onLayout}>
      <View style={styles.chipRow} accessibilityRole="tablist">
        {SCENES.map((s, i) => {
          const isActive = i === scene;
          return (
            <Pressable
              key={s.key}
              onPress={() => setScene(i)}
              accessibilityRole="tab"
              accessibilityLabel={`Scene: ${s.label}`}
              accessibilityState={{ selected: isActive }}
              aria-selected={isActive}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.viz}>
        {scene === 0 ? <TapsScene vizW={vizW} /> : null}
        {scene === 1 ? <StabilityScene vizW={vizW} /> : null}
        {scene === 2 ? <TunerScene vizW={vizW} /> : null}
      </View>

      <View style={styles.captionBlock}>
        <Text style={styles.watchFor}>WATCH FOR — {active.watch}</Text>
        <Text style={styles.captionBody}>{active.body}</Text>
        <Text style={styles.fieldNote}>FIELD NOTE: {active.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: PANEL_PAD,
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  chipTextActive: { color: colors.amber },

  /* Recessed glass instrument panel — the viz is the hero. */
  viz: {
    marginTop: 10,
    minHeight: 300,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
    padding: VIZ_PAD,
  },

  /* Structured caption */
  captionBlock: { marginTop: 10, gap: 5 },
  watchFor: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber },
  captionBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  fieldNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },

  /* Shared stage bits */
  stage: { position: 'relative' },
  playhead: { position: 'absolute', width: 2, backgroundColor: colors.amber, opacity: 0.85, borderRadius: 1 },

  /* Scene 1 */
  readoutRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  readoutCell: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.06)',
    backgroundColor: 'rgba(255,255,255,.03)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  readoutLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub },
  readoutValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  readoutVal: { fontFamily: fonts.mono, fontSize: 19, color: colors.textPrimary },
  readoutUnit: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  tapDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.amber },
  mathChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.06)',
    backgroundColor: 'rgba(255,255,255,.03)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  mathText: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  mathVal: { color: colors.amber },

  /* Scene 2 */
  stripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  stripLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub },
  stripStat: { fontFamily: fonts.mono, fontSize: 13 },
  stabDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  counterLine: { fontFamily: fonts.mono, fontSize: 12, paddingHorizontal: 2, marginTop: 2 },

  /* Scene 3 — edgewise cents strip (mirrors SkinnedTunerVu) */
  tunerHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginBottom: 6 },
  tunerHz: { fontFamily: fonts.mono, fontSize: 24, color: colors.amber },
  tunerArrow: { fontFamily: fonts.barlowRegular, fontSize: 18, color: colors.textSub },
  tunerNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, letterSpacing: 1, color: colors.textPrimary },
  tunerWindow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },
  blade: { position: 'absolute', width: BLADE_W, borderRadius: 1.5 },
  bladeGlow: { position: 'absolute', width: 22, height: 15, borderRadius: 11, backgroundColor: colors.amber, opacity: 0.26 },
  tunerReadout: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6, paddingHorizontal: 2 },
  tunerCents: { fontFamily: fonts.mono, fontSize: 20 },
  tunerState: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },
  refBadge: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub, marginLeft: 'auto' },
  mapLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: colors.textSub,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  anchorDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.amber },
});
