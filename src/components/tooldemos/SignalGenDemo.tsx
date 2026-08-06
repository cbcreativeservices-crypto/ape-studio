/**
 * SignalGenDemo — Tool 6 (Signal Generator) training demo.
 * Spec of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §4 (Demo mode),
 * Tool 6; user ruling Q4 (output levels: −20 dBFS default, −12 dBFS session
 * cap, confirm-to-unlock once per session) — 2026-07-23.
 *
 * VISUAL/ANIMATED ONLY — no audio path exists yet, and the hosting
 * ToolDemoScreen carries the permanent "TRAINING DEMO — NOT A LIVE
 * MEASUREMENT" badge. Nothing here is a live reading (spec §1.7: no LedMeter).
 * Animation is RN core Animated driving native-driver transforms/opacity over
 * static react-native-svg sketches; noise traces come from fixed seeded
 * arrays (never Math.random).
 *
 * Scenes: 1 SIGNAL SHAPES (sine/white/pink, time + spectrum) · 2 LOG SWEEP
 * (rising-frequency sine with position cursor) · 3 SAFE LEVELS (−20 dBFS
 * default, −12 dBFS cap, locked zone above).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { levelColor, WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { colors, fonts, radius } from '../../theme/tokens';

type SceneKey = 'shapes' | 'sweep' | 'levels';
type WaveKey = 'sine' | 'white' | 'pink';

// Taller displays (owner 2026-08-05, item 5): more room for the view + labels.
const PANEL_H = 452;
const PANE_VIZ_H = 118;
const SWEEP_VIZ_H = 168;
const LEVELS_H = 228;

const SCENES: { key: SceneKey; label: string }[] = [
  { key: 'shapes', label: 'SIGNAL SHAPES' },
  { key: 'sweep', label: 'LOG SWEEP' },
  { key: 'levels', label: 'SAFE LEVELS' },
];

const WAVES: { key: WaveKey; label: string }[] = [
  { key: 'sine', label: 'SINE' },
  { key: 'white', label: 'WHITE' },
  { key: 'pink', label: 'PINK' },
];

// Per-signal trace/button colours (owner 2026-08-05, item 1): sine = blue,
// white noise = white, pink noise = pink.
const WAVE_COLOR: Record<WaveKey, string> = {
  sine: colors.blue,
  white: '#f2f2f5',
  pink: '#ff8fae', // pink noise drawn pink — no token exists for this hue
};

const CAPTIONS: Record<WaveKey, string> = {
  sine: 'A sine tone is energy at one single frequency, so its spectrum is a lone spike. It is the cleanest signal for exercising one frequency at a time.',
  white:
    'White noise carries equal energy per hertz, so its spectrum sketches flat. It sounds hissy-bright because every higher octave spans twice as many hertz.',
  pink: 'Pink noise carries equal energy per octave, sloping down about 3 dB per octave. That balance mirrors hearing, so it is the standard for speaker and room checks.',
};

// "Log" explained (item 2): logarithmic = equal time per OCTAVE (each frequency
// doubling), matching how we hear pitch — so low frequencies get as much of the
// pass as the highs. Also names it a "frequency sweep" and its measurement use.
const SWEEP_INTRO =
  '"Log" is short for logarithmic: the tone spends equal time in every OCTAVE (each doubling of frequency), the way we hear pitch — so the lows get as much of the pass as the highs. A linear sweep instead races through the lows and lingers on the highs.';
const SWEEP_CAPTION =
  'Also called a frequency sweep: one glide from 20 Hz to 20 kHz exciting every frequency in order. It is the backbone of measurement — feed it to a speaker or room and capture the response to read frequency balance, resonances and (as a log sweep) the reverb decay / RT60.';

const LEVELS_INTRO =
  'Why the limit: the generator can produce full-scale energy at any frequency, and a hot tone straight into monitors or headphones can damage HEARING and blow SPEAKERS in an instant. So output opens at a safe −20 dBFS and is capped at −12 dBFS.';
const LEVELS_CAPTION =
  'To go louder than the −12 dBFS cap you must confirm an authorization (remove headphones / lower the monitors first). That unlock lasts for this session only, then re-locks — a deliberate speed bump so louder output is always a conscious choice, for your ears and your gear.';

// Chart metric-mark colours (owner 2026-08-05: graphs must have visible marks).
const GRID_C = '#33343d';
const ZERO_C = '#565a66';

// ---- Levels-scene geometry: 0 dBFS (top) … −60 dBFS (bottom) --------------
const DB_TOP = 14;
const DB_BOTTOM = LEVELS_H - 12;
const DB_TICKS = [0, -12, -20, -40, -60] as const;

function dbToY(db: number): number {
  return DB_TOP + (-db / 60) * (DB_BOTTOM - DB_TOP);
}
const Y_CAP = dbToY(-12);
const Y_DEFAULT = dbToY(-20);

// ---- Fixed seeded traces (deterministic LCG — spec forbids Math.random) ---
function lcgNoise(seed: number, n: number): number[] {
  let s = seed >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push((s / 0xffffffff) * 2 - 1);
  }
  return out;
}

/** Leaky-integrator tilt of a white trace — reads as pink's low-heavy wander. */
function pinkify(white: readonly number[]): number[] {
  let acc = 0;
  const out: number[] = [];
  for (const v of white) {
    acc = acc * 0.86 + v * 0.35;
    out.push(acc);
  }
  const peak = Math.max(0.001, ...out.map((v) => Math.abs(v)));
  return out.map((v) => v / peak);
}

const WHITE_TRACES = [lcgNoise(0xc0ffee, 72), lcgNoise(0xbada55, 72)];
const PINK_TRACES = [pinkify(lcgNoise(0x5eed01, 72)), pinkify(lcgNoise(0x5eed02, 72))];

// ---- SVG path builders ----------------------------------------------------
function wavePath(samples: readonly number[], w: number, h: number): string {
  const mid = h / 2;
  const amp = h * 0.36;
  const step = w / (samples.length - 1);
  const parts: string[] = [`M 0 ${(mid - (samples[0] ?? 0) * amp).toFixed(1)}`];
  for (let i = 1; i < samples.length; i += 1) {
    parts.push(`L ${(i * step).toFixed(1)} ${(mid - (samples[i] ?? 0) * amp).toFixed(1)}`);
  }
  return parts.join(' ');
}

function sinePath(w: number, h: number, cycles: number): string {
  const mid = h / 2;
  const amp = h * 0.36;
  const parts: string[] = [];
  for (let x = 0; x <= w; x += 2) {
    const y = mid - Math.sin((x / w) * cycles * 2 * Math.PI) * amp;
    parts.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

/** Log chirp: instantaneous frequency rises exponentially left → right. */
function chirpPath(w: number, h: number): string {
  const mid = h / 2;
  const amp = h * 0.38;
  const r = 14; // frequency ratio across the width (visual, not literal 20→20k)
  const k = 2.5; // starting cycles-per-width
  const parts: string[] = [];
  for (let x = 0; x <= w; x += 1) {
    const t = x / Math.max(1, w);
    const phase = (2 * Math.PI * k * (Math.pow(r, t) - 1)) / Math.log(r);
    const y = mid - Math.sin(phase) * amp;
    parts.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`);
  }
  return parts.join(' ');
}

export function SignalGenDemo() {
  const [scene, setScene] = useState<SceneKey>('shapes');
  const [wave, setWave] = useState<WaveKey>('sine');
  const [vizW, setVizW] = useState(0);

  const scroll = useRef(new Animated.Value(0)).current; // scene 1: sine scroll
  const flick = useRef(new Animated.Value(0)).current; // scene 1: noise flicker
  const pulse = useRef(new Animated.Value(0)).current; // scene 1: spectrum pulse
  const cursor = useRef(new Animated.Value(0)).current; // scene 2: sweep cursor
  const fader = useRef(new Animated.Value(0)).current; // scene 3: −20 → −12 ride

  // Scene 1 — sine trace scrolls left by exactly one wavelength per loop.
  useEffect(() => {
    if (scene !== 'shapes' || wave !== 'sine') return undefined;
    scroll.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scroll, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [scene, wave, scroll]);

  // Scene 1 — two seeded noise traces cross-fade to suggest motion.
  useEffect(() => {
    if (scene !== 'shapes' || wave === 'sine') return undefined;
    flick.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 170, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(flick, { toValue: 0, duration: 170, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scene, wave, flick]);

  // Scene 1 — gentle breathing on the spectrum sketch.
  useEffect(() => {
    if (scene !== 'shapes') return undefined;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scene, pulse]);

  // Scene 2 — position cursor tracks one full sweep pass, then repeats.
  useEffect(() => {
    if (scene !== 'sweep') return undefined;
    cursor.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 1, duration: 3400, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scene, cursor]);

  // Scene 3 — the handle rises from the −20 default, stops dead at the −12
  // cap while the locked zone brightens, then settles back. Demonstrates the
  // rule; it is NOT a meter.
  useEffect(() => {
    if (scene !== 'levels') return undefined;
    fader.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(fader, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(fader, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scene, fader]);

  const w = vizW > 0 ? vizW : 320;
  const svgW = Math.max(80, Math.floor((w - 10) / 2) - 2); // two panes + gap + borders
  const lambda = svgW / 3; // one wavelength of the 3-cycle visible sine

  const sineD = useMemo(() => sinePath(svgW + svgW / 3, PANE_VIZ_H, 4), [svgW]);
  const noiseD = useMemo(
    () => ({
      white: WHITE_TRACES.map((t) => wavePath(t, svgW, PANE_VIZ_H)),
      pink: PINK_TRACES.map((t) => wavePath(t, svgW, PANE_VIZ_H)),
    }),
    [svgW]
  );
  const chirpW = w - 2;
  const chirpD = useMemo(() => chirpPath(chirpW, SWEEP_VIZ_H), [chirpW]);

  const caption = scene === 'shapes' ? CAPTIONS[wave] : scene === 'sweep' ? SWEEP_CAPTION : LEVELS_CAPTION;
  const accent = WAVE_COLOR[wave];
  const specOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  return (
    <View style={styles.root}>
      <View style={styles.chipRow}>
        {SCENES.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setScene(key)}
            accessibilityRole="button"
            accessibilityLabel={`${label} scene`}
            accessibilityState={{ selected: scene === key }}
            style={[styles.chip, scene === key && styles.chipActive]}
          >
            <Text style={[styles.chipText, scene === key && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.viz} onLayout={(e) => setVizW(Math.round(e.nativeEvent.layout.width))}>
        {scene === 'shapes' ? (
          <>
            <View style={styles.waveRow}>
              {WAVES.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setWave(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} waveform`}
                  accessibilityState={{ selected: wave === key }}
                  style={[styles.waveChip, wave === key && { borderColor: WAVE_COLOR[key] }]}
                >
                  <Text style={[styles.waveChipText, wave === key && { color: WAVE_COLOR[key] }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.paneRow}>
              {/* Time domain — amplitude vs time. Metric marks: 0 line + ±½ FS. */}
              <View style={styles.pane}>
                <Text style={styles.paneLabel}>TIME · AMPLITUDE</Text>
                <View style={[styles.paneViz, { height: PANE_VIZ_H }]}>
                  <Svg width={svgW} height={PANE_VIZ_H} style={StyleSheet.absoluteFill}>
                    {/* ±½ full-scale guide marks (dashed) + solid zero line. */}
                    <Line x1={0} y1={PANE_VIZ_H * 0.18} x2={svgW} y2={PANE_VIZ_H * 0.18} stroke={GRID_C} strokeWidth={1} strokeDasharray="3 5" />
                    <Line x1={0} y1={PANE_VIZ_H * 0.82} x2={svgW} y2={PANE_VIZ_H * 0.82} stroke={GRID_C} strokeWidth={1} strokeDasharray="3 5" />
                    <Line x1={0} y1={PANE_VIZ_H / 2} x2={svgW} y2={PANE_VIZ_H / 2} stroke={ZERO_C} strokeWidth={1} />
                  </Svg>
                  {wave === 'sine' ? (
                    <Animated.View
                      style={{
                        width: svgW + lambda,
                        transform: [{ translateX: scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -lambda] }) }],
                      }}
                    >
                      <Svg width={svgW + lambda} height={PANE_VIZ_H}>
                        <Path d={sineD} stroke={accent} strokeWidth={2} fill="none" />
                      </Svg>
                    </Animated.View>
                  ) : (
                    <>
                      <Animated.View
                        style={[StyleSheet.absoluteFill, { opacity: flick.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }) }]}
                      >
                        <Svg width={svgW} height={PANE_VIZ_H}>
                          <Path d={noiseD[wave][0]} stroke={accent} strokeWidth={1.5} fill="none" />
                        </Svg>
                      </Animated.View>
                      <Animated.View
                        style={[StyleSheet.absoluteFill, { opacity: flick.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) }]}
                      >
                        <Svg width={svgW} height={PANE_VIZ_H}>
                          <Path d={noiseD[wave][1]} stroke={accent} strokeWidth={1.5} fill="none" />
                        </Svg>
                      </Animated.View>
                    </>
                  )}
                </View>
                <Text style={styles.axisUnder}>time →</Text>
              </View>

              {/* Spectrum — how much energy sits at each frequency (level vs
                  frequency). Metric marks: amplitude gridlines + frequency ticks;
                  the shape is filled with the MIDI amplitude ramp (loud = red at
                  the top → quiet = blue toward the floor). */}
              <View style={styles.pane}>
                <Text style={styles.paneLabel}>SPECTRUM · LEVEL × FREQ</Text>
                <View style={[styles.paneViz, { height: PANE_VIZ_H }]}>
                  <Animated.View style={{ opacity: specOpacity }}>
                    <Svg width={svgW} height={PANE_VIZ_H}>
                      <Defs>
                        <LinearGradient id="specAmp" x1={0} y1={8} x2={0} y2={PANE_VIZ_H - 8} gradientUnits="userSpaceOnUse">
                          {[0, 0.25, 0.5, 0.75, 1].map((o) => (
                            <Stop key={o} offset={o} stopColor={levelColor(1 - o)} />
                          ))}
                        </LinearGradient>
                      </Defs>
                      {/* Amplitude gridlines (loud → quiet) + frequency gridlines. */}
                      {[0.25, 0.5, 0.75].map((f) => (
                        <Line key={`h${f}`} x1={2} y1={PANE_VIZ_H * f} x2={svgW - 2} y2={PANE_VIZ_H * f} stroke={GRID_C} strokeWidth={1} strokeDasharray="2 5" />
                      ))}
                      {[0.28, 0.56, 0.84].map((f) => (
                        <Line key={`v${f}`} x1={svgW * f} y1={8} x2={svgW * f} y2={PANE_VIZ_H - 8} stroke={GRID_C} strokeWidth={1} strokeDasharray="2 5" />
                      ))}
                      {/* Baseline (0 level). */}
                      <Line x1={2} y1={PANE_VIZ_H - 8} x2={svgW - 2} y2={PANE_VIZ_H - 8} stroke={ZERO_C} strokeWidth={1.2} />
                      {wave === 'sine' ? (
                        <>
                          <Line x1={svgW * 0.42} y1={PANE_VIZ_H - 8} x2={svgW * 0.42} y2={10} stroke="url(#specAmp)" strokeWidth={8} opacity={0.28} />
                          <Line x1={svgW * 0.42} y1={PANE_VIZ_H - 8} x2={svgW * 0.42} y2={10} stroke="url(#specAmp)" strokeWidth={3} />
                        </>
                      ) : wave === 'white' ? (
                        <>
                          <Rect x={2} y={PANE_VIZ_H * 0.3} width={svgW - 4} height={PANE_VIZ_H - 8 - PANE_VIZ_H * 0.3} fill="url(#specAmp)" opacity={0.22} />
                          <Line x1={2} y1={PANE_VIZ_H * 0.3} x2={svgW - 2} y2={PANE_VIZ_H * 0.3} stroke="url(#specAmp)" strokeWidth={3} />
                        </>
                      ) : (
                        <>
                          <Path
                            d={`M 2 ${(PANE_VIZ_H * 0.2).toFixed(1)} L ${svgW - 2} ${(PANE_VIZ_H * 0.72).toFixed(1)} L ${svgW - 2} ${PANE_VIZ_H - 8} L 2 ${PANE_VIZ_H - 8} Z`}
                            fill="url(#specAmp)"
                            opacity={0.22}
                          />
                          <Path
                            d={`M 2 ${(PANE_VIZ_H * 0.2).toFixed(1)} L ${svgW - 2} ${(PANE_VIZ_H * 0.72).toFixed(1)}`}
                            stroke="url(#specAmp)"
                            strokeWidth={3}
                            fill="none"
                          />
                        </>
                      )}
                    </Svg>
                  </Animated.View>
                </View>
                <View style={styles.freqAxisRow}>
                  <Text style={styles.axisUnder}>low</Text>
                  <Text style={styles.axisUnder}>freq →</Text>
                  <Text style={styles.axisUnder}>high</Text>
                </View>
              </View>
            </View>

            {/* MIDI amplitude legend (item 1): quiet = blue → loud = red. */}
            <View style={styles.legendRow}>
              <Text style={styles.legendCap}>QUIET</Text>
              <View style={styles.legendBar}>
                <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 10">
                  <Defs>
                    <LinearGradient id="ampLegend" x1={0} y1={0} x2={100} y2={0} gradientUnits="userSpaceOnUse">
                      {WAVE_LEVEL_STOPS.filter((s) => s.offset >= 0.5).map((s) => (
                        <Stop key={s.offset} offset={(s.offset - 0.5) * 2} stopColor={s.color} />
                      ))}
                    </LinearGradient>
                  </Defs>
                  <Rect x={0} y={0} width={100} height={10} rx={2} fill="url(#ampLegend)" />
                </Svg>
              </View>
              <Text style={styles.legendCap}>LOUD</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaMono}>energy at each frequency</Text>
              <Text style={[styles.metaMono, { color: accent }]}>
                {wave === 'sine' ? 'ONE FREQUENCY' : wave === 'white' ? 'FLAT' : '−3 dB/OCT'}
              </Text>
            </View>
          </>
        ) : null}

        {scene === 'sweep' ? (
          <>
            <Text style={styles.introText}>{SWEEP_INTRO}</Text>
            <Text style={styles.paneLabel}>SWEPT SINE — LOW TO HIGH</Text>
            <View style={[styles.sweepViz, { height: SWEEP_VIZ_H }]}>
              <Svg width={chirpW} height={SWEEP_VIZ_H}>
                <Defs>
                  {/* MIDI amplitude ramp about the zero line (item 2). */}
                  <LinearGradient id="sweepAmp" x1={0} y1={0} x2={0} y2={SWEEP_VIZ_H} gradientUnits="userSpaceOnUse">
                    {WAVE_LEVEL_STOPS.map((s) => (
                      <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                    ))}
                  </LinearGradient>
                </Defs>
                {/* Octave metric marks — each doubling of frequency (log spacing). */}
                {[0.2, 0.4, 0.6, 0.8].map((f) => (
                  <Line key={f} x1={chirpW * f} y1={6} x2={chirpW * f} y2={SWEEP_VIZ_H - 6} stroke={GRID_C} strokeWidth={1} strokeDasharray="2 6" />
                ))}
                <Line x1={0} y1={SWEEP_VIZ_H / 2} x2={chirpW} y2={SWEEP_VIZ_H / 2} stroke={ZERO_C} strokeWidth={1} />
                <Path d={chirpD} stroke="url(#sweepAmp)" strokeWidth={1.8} fill="none" />
              </Svg>
              <Animated.View
                style={[
                  styles.cursorWrap,
                  { transform: [{ translateX: cursor.interpolate({ inputRange: [0, 1], outputRange: [0, chirpW - 2] }) }] },
                ]}
              >
                <View style={styles.cursorTrail} />
                <View style={styles.cursorLine} />
              </Animated.View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaMono}>20 Hz</Text>
              <Text style={styles.axisMid}>LOG FREQUENCY · EQUAL TIME PER OCTAVE</Text>
              <Text style={styles.metaMono}>20 kHz</Text>
            </View>
          </>
        ) : null}

        {scene === 'levels' ? (
          <>
            <Text style={styles.introText}>{LEVELS_INTRO}</Text>
            <Text style={styles.paneLabel}>OUTPUT LEVEL — dBFS</Text>
            <View style={styles.levelsWrap}>
              <Svg width={w} height={LEVELS_H}>
                <Line x1={60} y1={DB_TOP} x2={60} y2={DB_BOTTOM} stroke={colors.steelBorder} strokeWidth={2} />
                {DB_TICKS.map((db) => (
                  <Line key={db} x1={52} y1={dbToY(db)} x2={60} y2={dbToY(db)} stroke={colors.steelBorder} strokeWidth={1.5} />
                ))}
                <Line x1={60} y1={Y_CAP} x2={w - 8} y2={Y_CAP} stroke={colors.red} strokeWidth={1.5} />
                <Line x1={60} y1={Y_DEFAULT} x2={w - 8} y2={Y_DEFAULT} stroke={colors.green} strokeWidth={1.5} />
              </Svg>

              {DB_TICKS.map((db) => (
                <Text key={db} style={[styles.dbLabel, { top: dbToY(db) - 8 }]}>
                  {db === 0 ? '0' : `−${-db}`}
                </Text>
              ))}

              <Animated.View
                style={[
                  styles.lockZone,
                  {
                    top: DB_TOP,
                    height: Y_CAP - DB_TOP,
                    opacity: fader.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                  },
                ]}
              >
                <Svg width={14} height={15} viewBox="0 0 14 15">
                  <Path d="M4 7 V4.5 a3 3 0 0 1 6 0 V7" stroke={colors.red} strokeWidth={1.6} fill="none" />
                  <Rect x={2.4} y={7} width={9.2} height={6.4} rx={1.6} fill={colors.red} opacity={0.85} />
                </Svg>
                <Text style={styles.lockText}>LOCKED</Text>
                <Text style={styles.lockHint} numberOfLines={1}>
                  CONFIRM TO UNLOCK · ONCE PER SESSION
                </Text>
              </Animated.View>

              <Text style={[styles.capLabel, { top: Y_CAP + 3 }]}>CAP −12 dBFS</Text>
              <Text style={[styles.defLabel, { top: Y_DEFAULT + 3 }]}>DEFAULT −20 dBFS</Text>

              <Animated.View
                style={[
                  styles.handle,
                  { transform: [{ translateY: fader.interpolate({ inputRange: [0, 1], outputRange: [Y_DEFAULT - 6, Y_CAP - 6] }) }] },
                ]}
              >
                <View style={styles.handleLine} />
              </Animated.View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.captionBox}>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    // minHeight (not fixed): scenes vary in height and the taller displays +
    // above-display explanations must grow the panel, not overflow it. Hosted in
    // a ScrollView, so growth is fine.
    minHeight: PANEL_H,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#18181c',
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,0.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSub },
  chipTextActive: { color: colors.amber },

  viz: { marginTop: 10 },

  waveRow: { flexDirection: 'row', gap: 6 },
  waveChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#101014',
  },
  waveChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub },

  paneRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  pane: { flex: 1 },
  paneLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel, marginBottom: 4 },
  paneViz: {
    borderWidth: 1,
    borderColor: '#232329',
    borderRadius: radius.cardSm,
    backgroundColor: '#0e0e11',
    overflow: 'hidden',
  },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 },
  metaMono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  axisMid: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },

  // Above-display explanation (items 2 & 3).
  introText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary, marginBottom: 8 },

  // Per-pane axis labels + MIDI amplitude legend (item 1).
  axisUnder: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, marginTop: 2 },
  freqAxisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  legendCap: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  legendBar: { flex: 1, height: 10, borderRadius: 2, overflow: 'hidden' },

  sweepViz: {
    borderWidth: 1,
    borderColor: '#232329',
    borderRadius: radius.cardSm,
    backgroundColor: '#0e0e11',
    overflow: 'hidden',
  },
  cursorWrap: { position: 'absolute', left: -14, top: 0, bottom: 0, width: 16, flexDirection: 'row' },
  cursorTrail: { width: 14, backgroundColor: 'rgba(255,198,77,0.10)' },
  cursorLine: { width: 2, backgroundColor: colors.amber },

  levelsWrap: { height: LEVELS_H },
  dbLabel: {
    position: 'absolute',
    left: 6,
    width: 38,
    textAlign: 'right',
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSub,
  },
  lockZone: {
    position: 'absolute',
    left: 60,
    right: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,75,58,0.5)',
    backgroundColor: 'rgba(255,75,58,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
  },
  lockText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.red },
  lockHint: { flexShrink: 1, fontFamily: fonts.barlowCondensedMedium, fontSize: 12, letterSpacing: 0.4, color: 'rgba(255,120,105,0.9)' },
  capLabel: { position: 'absolute', left: 82, fontFamily: fonts.mono, fontSize: 12, color: colors.red },
  defLabel: { position: 'absolute', left: 82, fontFamily: fonts.mono, fontSize: 12, color: colors.green },
  handle: {
    position: 'absolute',
    left: 45,
    top: 0,
    width: 30,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  handleLine: { height: 2, borderRadius: 1, backgroundColor: '#6d4a00' },

  captionBox: { minHeight: 60, marginTop: 8, justifyContent: 'center' },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
});
