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
 * Scenes: 1 TAPS → FREQUENCY (period bracket ↔ Hz ↔ BPM), 2 STABILITY
 * (regular vs jittery pulse train → confidence from consistency), 3 FREQUENCY
 * vs PITCH (440 Hz mapped onto an A4 tuner needle with a cents scale).
 * Animation: RN core Animated only, transforms/opacity on native driver.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

const PANEL_PAD = 12;
const PAD_X = 16;
const PULSE_REST = 0.25;
const SWEEP_HOLD_MS = 400;

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
  const baseY = 72;

  return (
    <View>
      <View style={styles.readoutRow}>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>FREQ</Text>
          <Text style={styles.readoutBig}>{preset.hz} Hz</Text>
        </View>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>PERIOD</Text>
          <Text style={styles.readoutMid}>{preset.periodMs} ms</Text>
        </View>
        <View style={styles.readoutCell}>
          <Text style={styles.readoutLabel}>TEMPO</Text>
          <Text style={styles.readoutMid}>{preset.bpm} BPM</Text>
        </View>
      </View>

      <View style={styles.stage}>
        <Svg width={vizW} height={112}>
          {/* Period bracket over the first interval */}
          <Path d={`M ${bx0} 42 V 34 H ${bx1} V 42`} stroke={colors.textSub} strokeWidth={1.5} fill="none" />
          <SvgText
            x={(bx0 + bx1) / 2}
            y={26}
            fill={colors.textSub}
            fontFamily={fonts.mono}
            fontSize={12}
            textAnchor="middle"
          >
            {`T = ${preset.periodMs} ms`}
          </SvgText>
          {/* Timeline + tap marks */}
          <Line x1={PAD_X} y1={baseY} x2={PAD_X + usable} y2={baseY} stroke={colors.hairline} strokeWidth={2} />
          {times.map((t) => (
            <Circle key={t} cx={xForT(t)} cy={baseY} r={8} stroke={colors.steelBorder} strokeWidth={1.5} fill="#17171b" />
          ))}
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
                top: baseY - 7,
                opacity: p.v,
                transform: [{ scale: p.v.interpolate({ inputRange: [PULSE_REST, 1], outputRange: [1, 1.55] }) }],
              },
            ]}
          />
        ))}
        {/* Sweeping playhead */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.playhead,
            {
              left: PAD_X,
              top: 40,
              height: 54,
              transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [0, usable] }) }],
            },
          ]}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2 — STABILITY                                                 */
/* ------------------------------------------------------------------ */

const STAB_SPAN_MS = 2100;
/** Regular train: a steady 350 ms period. */
const REG_TIMES = [150, 500, 850, 1200, 1550, 1900] as const;
/** Jittery train: same nominal period + fixed seeded offsets (no Math.random). */
const JIT_TIMES = [150, 555, 810, 1270, 1490, 1930] as const;

function PulseStrip({
  vizW,
  times,
  pulses,
  sweep,
  accent,
}: {
  vizW: number;
  times: readonly number[];
  pulses: { t: number; v: Animated.Value }[];
  sweep: Animated.Value;
  accent: string;
}) {
  const usable = vizW - PAD_X * 2;
  const xForT = (t: number) => PAD_X + (t / STAB_SPAN_MS) * usable;
  const midY = 23;

  return (
    <View style={styles.stage}>
      <Svg width={vizW} height={46}>
        <Line x1={PAD_X} y1={midY} x2={PAD_X + usable} y2={midY} stroke={colors.hairline} strokeWidth={2} />
        {times.map((t) => (
          <Circle key={t} cx={xForT(t)} cy={midY} r={6.5} stroke={colors.steelBorder} strokeWidth={1.5} fill="#17171b" />
        ))}
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
              top: midY - 6,
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
            top: 4,
            height: 38,
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
        <Text style={styles.stripLabel}>REGULAR TRAIN</Text>
        <Text style={[styles.stripStat, { color: colors.green }]}>STABILITY 98%</Text>
      </View>
      <PulseStrip vizW={vizW} times={REG_TIMES} pulses={regPulses} sweep={sweep} accent={colors.green} />
      <View style={[styles.stripHeader, { marginTop: 8 }]}>
        <Text style={styles.stripLabel}>JITTERY TRAIN</Text>
        <Text style={[styles.stripStat, { color: colors.orange }]}>STABILITY 54%</Text>
      </View>
      <PulseStrip vizW={vizW} times={JIT_TIMES} pulses={jitPulses} sweep={sweep} accent={colors.orange} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3 — FREQUENCY vs PITCH                                        */
/* ------------------------------------------------------------------ */

/** Scripted needle positions in cents — a fixed tour, not a measurement. */
const CENTS_STEPS = [12, -8, 4, 0, -3, 0] as const;
const GAUGE_H = 150;
const NEEDLE_LEN = 86;
/** ±50 cents maps to ±45° of needle travel. */
const DEG_PER_CENT = 0.9;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function TunerScene({ vizW }: { vizW: number }) {
  const [stepIdx, setStepIdx] = useState(0);
  const rot = useRef(new Animated.Value(0)).current;
  const cents = CENTS_STEPS[stepIdx % CENTS_STEPS.length];

  useEffect(() => {
    const anim = Animated.timing(rot, {
      toValue: cents,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    const id = setTimeout(() => setStepIdx((i) => (i + 1) % CENTS_STEPS.length), 1500);
    return () => {
      anim.stop();
      clearTimeout(id);
    };
  }, [cents, rot]);

  const cx = vizW / 2;
  const cy = GAUGE_H - 22;
  const arcStart = polar(cx, cy, 100, -45);
  const arcEnd = polar(cx, cy, 100, 45);

  const ticks = useMemo(() => {
    const out: { key: number; x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let c = -50; c <= 50; c += 10) {
      const deg = c * DEG_PER_CENT;
      const major = c === -50 || c === 0 || c === 50;
      const a = polar(cx, cy, major ? 88 : 93, deg);
      const b = polar(cx, cy, 100, deg);
      out.push({ key: c, x1: a.x, y1: a.y, x2: b.x, y2: b.y, major });
    }
    return out;
  }, [cx, cy]);

  const centsText = cents > 0 ? `+${cents}` : `${cents}`;
  const inTune = Math.abs(cents) <= 3;

  return (
    <View>
      <View style={styles.tunerHeader}>
        <Text style={styles.tunerHz}>440.0 Hz</Text>
        <Text style={styles.tunerArrow}>{'→'}</Text>
        <Text style={styles.tunerNote}>A4</Text>
      </View>
      <View style={{ height: GAUGE_H }}>
        <Svg width={vizW} height={GAUGE_H}>
          <Path
            d={`M ${arcStart.x} ${arcStart.y} A 100 100 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
            stroke={colors.steelBorder}
            strokeWidth={2}
            fill="none"
          />
          {ticks.map((t) => (
            <Line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.key === 0 ? colors.amber : t.major ? colors.textSub : colors.hairlineAlt}
              strokeWidth={t.key === 0 ? 2.5 : 1.5}
            />
          ))}
          {[-50, 0, 50].map((c) => {
            const p = polar(cx, cy, 114, c * DEG_PER_CENT);
            return (
              <SvgText
                key={c}
                x={p.x}
                y={p.y + 4}
                fill={colors.textSub}
                fontFamily={fonts.mono}
                fontSize={12}
                textAnchor="middle"
              >
                {c > 0 ? `+${c}` : `${c}`}
              </SvgText>
            );
          })}
        </Svg>
        {/* Needle — rotates about the pivot via a double-height container */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.needleBox,
            {
              left: cx - 1.5,
              top: cy - NEEDLE_LEN,
              height: NEEDLE_LEN * 2,
              transform: [
                {
                  rotate: rot.interpolate({
                    inputRange: [-50, 50],
                    outputRange: ['-45deg', '45deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.needle} />
        </Animated.View>
        <View pointerEvents="none" style={[styles.needleHub, { left: cx - 6, top: cy - 6 }]} />
        <View pointerEvents="none" style={styles.centsBadge}>
          <Text style={styles.readoutLabel}>CENTS</Text>
          <Text style={[styles.centsValue, { color: inTune ? colors.green : colors.amber }]}>{centsText}{'¢'}</Text>
        </View>
        <Text style={styles.refBadge}>REF A4 = 440 Hz</Text>
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
    caption:
      'Evenly spaced pulses define one period T — the time between taps. Frequency is its inverse (1000 / T ms), and BPM is the same idea counted per minute. Watch the readouts follow the depicted spacing.',
  },
  {
    key: 'stability',
    label: 'STABILITY',
    caption:
      'Both trains repeat, but only the top one repeats at the same interval every time. A frequency counter scores that consistency as stability — steady spacing earns high confidence, jitter earns low.',
  },
  {
    key: 'pitch',
    label: 'Hz vs PITCH',
    caption:
      'The same event, two readings: 440 Hz is the measured frequency, A4 is its musical name. Pitch is the musical interpretation of frequency — the needle shows deviation from the reference in cents.',
  },
] as const;

/** Frequency Counter & Tuner — scripted visual training demo (Tool 7). */
export function HzCounterDemo() {
  const [scene, setScene] = useState(0);
  const [panelW, setPanelW] = useState(0);
  const vizW = panelW > 0 ? panelW - PANEL_PAD * 2 : 300;

  const onLayout = (e: LayoutChangeEvent) => setPanelW(e.nativeEvent.layout.width);

  return (
    <View style={styles.root} onLayout={onLayout}>
      <View style={styles.chipRow}>
        {SCENES.map((s, i) => {
          const active = i === scene;
          return (
            <Pressable
              key={s.key}
              onPress={() => setScene(i)}
              accessibilityRole="button"
              accessibilityLabel={`Scene: ${s.label}`}
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.viz}>
        {scene === 0 ? <TapsScene vizW={vizW} /> : null}
        {scene === 1 ? <StabilityScene vizW={vizW} /> : null}
        {scene === 2 ? <TunerScene vizW={vizW} /> : null}
      </View>

      <Text style={styles.caption}>{SCENES[scene].caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 356,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: PANEL_PAD,
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#17171b',
  },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1f1a10' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSub },
  chipTextActive: { color: colors.amber },
  viz: { flex: 1, marginTop: 10 },
  caption: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
    minHeight: 57,
  },

  /* Shared stage bits */
  stage: { position: 'relative' },
  playhead: { position: 'absolute', width: 2, backgroundColor: colors.amber, opacity: 0.85, borderRadius: 1 },

  /* Scene 1 */
  readoutRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  readoutCell: { flex: 1 },
  readoutLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub },
  readoutBig: { fontFamily: fonts.mono, fontSize: 21, color: colors.amber, marginTop: 1 },
  readoutMid: { fontFamily: fonts.mono, fontSize: 17, color: colors.textPrimary, marginTop: 4 },
  tapDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.amber },

  /* Scene 2 */
  stripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 2 },
  stripLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub },
  stripStat: { fontFamily: fonts.mono, fontSize: 14 },
  stabDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },

  /* Scene 3 */
  tunerHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginBottom: 4 },
  tunerHz: { fontFamily: fonts.mono, fontSize: 24, color: colors.amber },
  tunerArrow: { fontFamily: fonts.barlowRegular, fontSize: 18, color: colors.textSub },
  tunerNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, letterSpacing: 1, color: colors.textPrimary },
  needleBox: { position: 'absolute', width: 3, alignItems: 'center' },
  needle: { width: 3, height: NEEDLE_LEN - 4, borderRadius: 1.5, backgroundColor: colors.amber },
  needleHub: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a30',
    borderWidth: 1,
    borderColor: colors.steelBorder,
  },
  centsBadge: { position: 'absolute', top: 0, right: 2, alignItems: 'flex-end' },
  centsValue: { fontFamily: fonts.mono, fontSize: 17, marginTop: 1 },
  refBadge: {
    position: 'absolute',
    top: 0,
    left: 2,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSub,
  },
});
