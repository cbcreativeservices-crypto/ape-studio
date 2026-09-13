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
 * Scenes: 1 SIGNAL SHAPES (sine/white/pink — the same signal drawn in TWO
 * views, time + spectrum, with paired callouts) · 2 LOG SWEEP (rising-
 * frequency sine, position cursor, rattle-hunting callout) · 3 SAFE LEVELS
 * (−20 dBFS default, −12 dBFS cap, locked zone, crest-factor compare strip).
 *
 * Design pass 2026-09-13: shared demo contract (rack-key scene tabs, recessed
 * glass plot panels, in-SVG leader-line callouts, structured WATCH FOR /
 * body / FIELD NOTE captions).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { levelColor, WAVE_LEVEL_STOPS } from '../../features/tools/levelColor';
import { colors, fonts, radius } from '../../theme/tokens';

type SceneKey = 'shapes' | 'sweep' | 'levels';
type WaveKey = 'sine' | 'white' | 'pink';

// Taller displays (owner 2026-08-05, item 5) + demo contract 2026-09-13:
// the plot is the hero — ≥190 tall in a recessed glass panel.
const PANEL_H = 452;
const PANE_VIZ_H = 190;
const SWEEP_VIZ_H = 196;
const LEVELS_H = 232;
const CREST_H = 70;

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
// Active-key background tints (~10% of the wave colour) for the sub-toggle.
const WAVE_TINT: Record<WaveKey, string> = {
  sine: 'rgba(47,155,255,0.10)',
  white: 'rgba(242,242,245,0.08)',
  pink: 'rgba(255,143,174,0.10)',
};

// In-SVG callout palette (demo contract): amber = the thing being taught,
// salmon = warning/limit, steel = neutral reference.
const CALL_AMBER = '#ffb400';
const CALL_SALMON = '#ff8d7a';
const CALL_STEEL = '#9aa3ad';
const LEADER = 'rgba(255,255,255,0.35)';

// ---- Structured captions (WATCH FOR / body / FIELD NOTE) ------------------
type SceneCaption = { watch: string; body: string; note?: string };

const SHAPE_CAPS: Record<WaveKey, SceneCaption> = {
  sine: {
    watch: 'ONE CYCLE IN TIME — ONE SPIKE IN SPECTRUM',
    body:
      'Both panels draw the same signal. In time it repeats one perfect cycle; in spectrum every bit of its energy stands at a single frequency, with no harmonics. That purity is the point: a sine exercises one frequency at a time, which is why it is the stimulus for distortion checks, crossover checks, and pinning a resonance to its exact frequency.',
    note: 'A system that behaves on a sine can still fail on music — a sine has no transients and no dynamics.',
  },
  white: {
    watch: 'JAGGED TIME TRACE — FLAT SPECTRUM LINE',
    body:
      'White noise is random moment to moment but statistically exact over time: equal energy per hertz, so the spectrum draws flat. But each higher octave spans twice as many hertz, so the very same signal sounds hissy-bright — and climbs about +3 dB per octave on a fractional-octave RTA.',
    note: '"Flat" depends on the display: white reads flat on a narrowband FFT but tilts upward on an RTA. Know your signal AND your display.',
  },
  pink: {
    watch: 'THE −3 dB PER OCTAVE SLOPE, AGAINST THE WHITE REFERENCE',
    body:
      'Pink noise trades equal-per-hertz for equal energy per octave, so its spectrum slopes down 3 dB each octave (the dashed line shows white, for contrast). That octave balance matches how hearing and fractional-octave analyzers are organized, so pink reads flat on an RTA — which is why pink, not white, is the working signal for loudspeaker tuning and room checks.',
    note: 'The slower, bigger swings in the time trace are pink’s signature — the low end carrying more of the energy.',
  },
};

const SWEEP_CAP: SceneCaption = {
  watch: 'THE CYCLES TIGHTEN LEFT TO RIGHT — AND THE RATTLE MARK',
  body:
    'One glide from 20 Hz to 20 kHz excites every frequency in order. Sweeps are how you find trouble that lives at one frequency: walk a sweep through a room and a rattle, buzz, or resonance sings out at the exact moment the sweep crosses its frequency — mark that spot and you have its frequency. Log sweeps are also the standard excitation for loudspeaker testing and impulse-response measurement.',
  note: 'A sweep is only the question — the measurement is in what comes back. Playing a sweep into a room proves nothing by itself.',
};

const LEVELS_CAP: SceneCaption = {
  watch: 'THE HANDLE RISES, THEN STOPS DEAD AT THE −12 CAP',
  body:
    'A test signal is not music: it never pauses. A sine at a moderate reading delivers far more sustained power to a driver — and to your ears — than music peaking at the same level, which is what the compare strip below shows. Passing the cap takes a deliberate confirmation that lasts one session, then re-locks. And dBFS is digital level only: how loud the room actually gets depends entirely on the gain chain downstream.',
  note: 'Field habit: start low, confirm what is connected downstream, then bring the level up only as far as the measurement needs.',
};

// Above-display explanations (owner 2026-08-05, items 2 & 3): "log" defined
// before the plot; the WHY of the limit before the scale.
const SWEEP_INTRO =
  '"Log" is short for logarithmic: the tone spends equal time in every OCTAVE (each doubling of frequency), the way we hear pitch — so the lows get as much of the pass as the highs. A linear sweep instead races through the lows and lingers on the highs.';
const LEVELS_INTRO =
  'Why the limit: the generator can produce full-scale energy at any frequency, and a hot tone straight into monitors or headphones can damage HEARING and blow SPEAKERS in an instant. So output opens at a safe −20 dBFS and is capped at −12 dBFS.';

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

// ---- Crest-factor compare strip (scene 3) ---------------------------------
// "Music" = a fixed burst-and-rest envelope on a carrier; "test tone" = an
// unbroken sine. BOTH peak at the same value — the teaching is that the tone
// spends ALL its time at the peak while music mostly rests (low crest factor
// of a sine vs program material). Deterministic, precomputed.
const CREST_ENV: ReadonlyArray<readonly [number, number]> = [
  [0, 0.12],
  [0.06, 0.9],
  [0.12, 0.28],
  [0.2, 0.62],
  [0.27, 0.14],
  [0.38, 1.0],
  [0.46, 0.3],
  [0.55, 0.55],
  [0.62, 0.12],
  [0.72, 0.8],
  [0.8, 0.22],
  [0.9, 0.5],
  [1, 0.1],
];
function crestEnvAt(t: number): number {
  for (let i = 1; i < CREST_ENV.length; i += 1) {
    const [t1, a1] = CREST_ENV[i];
    if (t <= t1) {
      const [t0, a0] = CREST_ENV[i - 1];
      const k = (t - t0) / (t1 - t0 || 1);
      return a0 + (a1 - a0) * k;
    }
  }
  return CREST_ENV[CREST_ENV.length - 1][1];
}
const MUSIC_TRACE: number[] = Array.from({ length: 160 }, (_, i) => {
  const t = i / 159;
  return crestEnvAt(t) * Math.sin(2 * Math.PI * 26 * t);
});

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
        Animated.timing(cursor, { toValue: 1, duration: 4600, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(600),
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
        Animated.delay(1200),
        Animated.timing(fader, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(fader, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
  const crestMusicD = useMemo(() => wavePath(MUSIC_TRACE, svgW, CREST_H), [svgW]);
  const crestToneD = useMemo(() => sinePath(svgW, CREST_H, 9), [svgW]);

  const cap = scene === 'shapes' ? SHAPE_CAPS[wave] : scene === 'sweep' ? SWEEP_CAP : LEVELS_CAP;
  const accent = WAVE_COLOR[wave];
  const specOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  // Spectrum-pane feature geometry (shared by draw + callouts).
  const spikeX = svgW * 0.42; // sine spike
  const flatY = PANE_VIZ_H * 0.3; // white's flat line (and pink's white ref)
  const crestAmp = CREST_H * 0.36;

  return (
    <View style={styles.root}>
      <View style={styles.chipRow} accessibilityRole="tablist">
        {SCENES.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setScene(key)}
            accessibilityRole="tab"
            accessibilityLabel={`${label} scene`}
            accessibilityState={{ selected: scene === key }}
            aria-selected={scene === key}
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
                  aria-pressed={wave === key}
                  style={[
                    styles.waveChip,
                    wave === key && { borderColor: WAVE_COLOR[key], backgroundColor: WAVE_TINT[key] },
                  ]}
                >
                  <Text style={[styles.waveChipText, wave === key && { color: WAVE_COLOR[key] }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {/* The linking idea of the whole demo: ONE signal, TWO views. */}
            <View style={styles.linkRow}>
              <View style={styles.linkLine} />
              <Text style={styles.linkText}>ONE SIGNAL · TWO VIEWS</Text>
              <View style={styles.linkLine} />
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
                  {/* Static callout overlay — sits above the animated trace.
                      The sine bracket is exactly one wavelength wide, so it
                      always frames one full cycle no matter the scroll phase. */}
                  <Svg width={svgW} height={PANE_VIZ_H} style={StyleSheet.absoluteFill} pointerEvents="none">
                    {wave === 'sine' ? (
                      <>
                        <Line x1={lambda} y1={20} x2={lambda * 2} y2={20} stroke={CALL_AMBER} strokeWidth={1} />
                        <Line x1={lambda} y1={20} x2={lambda} y2={26} stroke={CALL_AMBER} strokeWidth={1} />
                        <Line x1={lambda * 2} y1={20} x2={lambda * 2} y2={26} stroke={CALL_AMBER} strokeWidth={1} />
                        <SvgText x={lambda * 1.5} y={13} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                          ONE CYCLE
                        </SvgText>
                      </>
                    ) : wave === 'white' ? (
                      <SvgText x={6} y={14} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                        EVERY FREQ AT ONCE
                      </SvgText>
                    ) : (
                      <SvgText x={6} y={14} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                        LOW-HEAVY WANDER
                      </SvgText>
                    )}
                  </Svg>
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
                          <Line x1={spikeX} y1={PANE_VIZ_H - 8} x2={spikeX} y2={10} stroke="url(#specAmp)" strokeWidth={8} opacity={0.28} />
                          <Line x1={spikeX} y1={PANE_VIZ_H - 8} x2={spikeX} y2={10} stroke="url(#specAmp)" strokeWidth={3} />
                          {/* Callout: the paired feature — the whole signal is here. */}
                          <Line x1={spikeX + 4} y1={22} x2={spikeX + 22} y2={40} stroke={LEADER} strokeWidth={1} />
                          <SvgText x={spikeX + 25} y={44} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                            ONE SPIKE
                          </SvgText>
                        </>
                      ) : wave === 'white' ? (
                        <>
                          <Rect x={2} y={flatY} width={svgW - 4} height={PANE_VIZ_H - 8 - flatY} fill="url(#specAmp)" opacity={0.22} />
                          <Line x1={2} y1={flatY} x2={svgW - 2} y2={flatY} stroke="url(#specAmp)" strokeWidth={3} />
                          <Line x1={svgW / 2} y1={flatY - 16} x2={svgW / 2} y2={flatY - 4} stroke={LEADER} strokeWidth={1} />
                          <SvgText x={svgW / 2} y={flatY - 21} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                            FLAT — EQUAL PER Hz
                          </SvgText>
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
                          {/* Neutral reference: where WHITE would sit (flat). */}
                          <Line x1={2} y1={flatY} x2={svgW - 2} y2={flatY} stroke={CALL_STEEL} strokeWidth={1} strokeDasharray="3 4" opacity={0.7} />
                          <SvgText x={svgW - 4} y={flatY - 5} textAnchor="end" fontFamily={fonts.oswaldSemiBold} fontSize={9} letterSpacing={1} fill={CALL_STEEL}>
                            WHITE REF
                          </SvgText>
                          {/* Callout: the slope IS the lesson. */}
                          <Line x1={svgW * 0.5} y1={PANE_VIZ_H * 0.46} x2={svgW * 0.5 + 14} y2={PANE_VIZ_H * 0.46 - 18} stroke={LEADER} strokeWidth={1} />
                          <SvgText x={svgW * 0.5 + 17} y={PANE_VIZ_H * 0.46 - 21} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                            −3 dB/OCT
                          </SvgText>
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
              <Text style={styles.metaMono}>SPECTRAL RULE</Text>
              <Text style={[styles.metaMono, { color: accent, flexShrink: 1 }]} numberOfLines={1}>
                {wave === 'sine' ? 'ALL ENERGY AT ONE FREQUENCY' : wave === 'white' ? 'EQUAL ENERGY PER Hz — FLAT' : 'EQUAL PER OCTAVE — −3 dB/OCT'}
              </Text>
            </View>
          </>
        ) : null}

        {scene === 'sweep' ? (
          <>
            <Text style={styles.introText}>{SWEEP_INTRO}</Text>
            <Text style={styles.paneLabel}>SWEPT SINE — LOW TO HIGH</Text>
            <View style={[styles.paneViz, { height: SWEEP_VIZ_H }]}>
              <Svg width={chirpW} height={SWEEP_VIZ_H}>
                <Defs>
                  {/* MIDI amplitude ramp about the zero line (item 2). */}
                  <LinearGradient id="sweepAmp" x1={0} y1={0} x2={0} y2={SWEEP_VIZ_H} gradientUnits="userSpaceOnUse">
                    {WAVE_LEVEL_STOPS.map((s) => (
                      <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                    ))}
                  </LinearGradient>
                </Defs>
                {/* Log-axis metric marks — equal frequency RATIO per division. */}
                {[0.2, 0.4, 0.6, 0.8].map((f) => (
                  <Line key={f} x1={chirpW * f} y1={6} x2={chirpW * f} y2={SWEEP_VIZ_H - 22} stroke={GRID_C} strokeWidth={1} strokeDasharray="2 6" />
                ))}
                <Line x1={0} y1={SWEEP_VIZ_H / 2} x2={chirpW} y2={SWEEP_VIZ_H / 2} stroke={ZERO_C} strokeWidth={1} />
                <Path d={chirpD} stroke="url(#sweepAmp)" strokeWidth={1.8} fill="none" />
                {/* Neutral references: what the eye should read at each end. */}
                <SvgText x={6} y={13} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_STEEL}>
                  WIDE = LOW
                </SvgText>
                <Line x1={54} y1={16} x2={chirpW * 0.1} y2={26} stroke={LEADER} strokeWidth={1} />
                <SvgText x={chirpW - 6} y={13} textAnchor="end" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_STEEL}>
                  TIGHT = HIGH
                </SvgText>
                <Line x1={chirpW - 58} y1={16} x2={chirpW - 30} y2={26} stroke={LEADER} strokeWidth={1} />
                {/* The WHY of sweeping: trouble sings out at ONE spot. */}
                <Line x1={chirpW * 0.3} y1={10} x2={chirpW * 0.3} y2={SWEEP_VIZ_H - 18} stroke={CALL_AMBER} strokeWidth={1} strokeDasharray="4 4" />
                <SvgText x={chirpW * 0.3 + 6} y={SWEEP_VIZ_H - 8} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={9.5} letterSpacing={1} fill={CALL_AMBER}>
                  A RATTLE SINGS AT ONE EXACT SPOT
                </SvgText>
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
            <Text style={styles.paneLabel}>OUTPUT LEVEL — dBFS (DIGITAL, NOT ROOM LOUDNESS)</Text>
            <View style={[styles.paneViz, styles.levelsWrap]}>
              <Svg width={w - 2} height={LEVELS_H}>
                <Line x1={60} y1={DB_TOP} x2={60} y2={DB_BOTTOM} stroke={colors.steelBorder} strokeWidth={2} />
                {DB_TICKS.map((db) => (
                  <Line key={db} x1={52} y1={dbToY(db)} x2={60} y2={dbToY(db)} stroke={colors.steelBorder} strokeWidth={1.5} />
                ))}
                <Line x1={60} y1={Y_CAP} x2={w - 10} y2={Y_CAP} stroke={CALL_SALMON} strokeWidth={1.5} />
                <Line x1={60} y1={Y_DEFAULT} x2={w - 10} y2={Y_DEFAULT} stroke={colors.green} strokeWidth={1.5} />
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
                <Text style={styles.handleHint} numberOfLines={1}>
                  START LOW · RAISE SLOWLY
                </Text>
              </Animated.View>
            </View>

            {/* WHY the cap exists — crest factor. Same peak, very different
                sustained power: the tone never rests. Amplitude drawn on the
                shared MIDI ramp (colour itself teaches level). */}
            <Text style={[styles.paneLabel, { marginTop: 12 }]}>WHY THE CAP — A TONE NEVER RESTS</Text>
            <View style={styles.paneRow}>
              <View style={styles.pane}>
                <Text style={styles.crestTitleSteel}>MUSIC — PEAKS, THEN RESTS</Text>
                <View style={[styles.paneViz, { height: CREST_H }]}>
                  <Svg width={svgW} height={CREST_H}>
                    <Defs>
                      <LinearGradient id="crestAmpA" x1={0} y1={CREST_H / 2 - crestAmp} x2={0} y2={CREST_H / 2 + crestAmp} gradientUnits="userSpaceOnUse">
                        {WAVE_LEVEL_STOPS.map((s) => (
                          <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                        ))}
                      </LinearGradient>
                    </Defs>
                    <Line x1={0} y1={CREST_H / 2 - crestAmp} x2={svgW} y2={CREST_H / 2 - crestAmp} stroke={GRID_C} strokeWidth={1} strokeDasharray="3 4" />
                    <Line x1={0} y1={CREST_H / 2 + crestAmp} x2={svgW} y2={CREST_H / 2 + crestAmp} stroke={GRID_C} strokeWidth={1} strokeDasharray="3 4" />
                    <Line x1={0} y1={CREST_H / 2} x2={svgW} y2={CREST_H / 2} stroke={ZERO_C} strokeWidth={1} />
                    <Path d={crestMusicD} stroke="url(#crestAmpA)" strokeWidth={1.4} fill="none" />
                    <SvgText x={4} y={11} textAnchor="start" fontFamily={fonts.oswaldSemiBold} fontSize={8.5} letterSpacing={1} fill={CALL_STEEL}>
                      SAME PEAK
                    </SvgText>
                  </Svg>
                </View>
              </View>
              <View style={styles.pane}>
                <Text style={styles.crestTitleSalmon}>TEST TONE — NEVER PAUSES</Text>
                <View style={[styles.paneViz, { height: CREST_H }]}>
                  <Svg width={svgW} height={CREST_H}>
                    <Defs>
                      <LinearGradient id="crestAmpB" x1={0} y1={CREST_H / 2 - crestAmp} x2={0} y2={CREST_H / 2 + crestAmp} gradientUnits="userSpaceOnUse">
                        {WAVE_LEVEL_STOPS.map((s) => (
                          <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
                        ))}
                      </LinearGradient>
                    </Defs>
                    <Line x1={0} y1={CREST_H / 2 - crestAmp} x2={svgW} y2={CREST_H / 2 - crestAmp} stroke={GRID_C} strokeWidth={1} strokeDasharray="3 4" />
                    <Line x1={0} y1={CREST_H / 2 + crestAmp} x2={svgW} y2={CREST_H / 2 + crestAmp} stroke={GRID_C} strokeWidth={1} strokeDasharray="3 4" />
                    <Line x1={0} y1={CREST_H / 2} x2={svgW} y2={CREST_H / 2} stroke={ZERO_C} strokeWidth={1} />
                    <Path d={crestToneD} stroke="url(#crestAmpB)" strokeWidth={1.4} fill="none" />
                  </Svg>
                </View>
              </View>
            </View>
            <Text style={styles.crestNote}>
              Same peak reading — but the tone never rests, so it delivers far more sustained power to the driver (low crest factor).
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.captionBox}>
        <Text style={styles.watchFor}>WATCH FOR — {cap.watch}</Text>
        <Text style={styles.caption}>{cap.body}</Text>
        {cap.note ? (
          <Text style={styles.fieldNote}>FIELD NOTE: {cap.note}</Text>
        ) : null}
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

  // Rack-key scene tabs (shared demo contract 2026-09-13).
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,0.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  chipTextActive: { color: colors.amber },

  viz: { marginTop: 10 },

  // Sub-toggle keys share the rack-key geometry; active takes the wave colour.
  waveRow: { flexDirection: 'row', gap: 8 },
  waveChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  waveChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  linkLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.amberLabel },

  paneRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  pane: { flex: 1 },
  paneLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amberLabel, marginBottom: 4 },
  // Recessed glass instrumentation panel (shared demo contract).
  paneViz: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 6 },
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
    right: 6,
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
  // Cap = a limit → salmon (demo contract); default = safe → green.
  capLabel: { position: 'absolute', right: 10, fontFamily: fonts.mono, fontSize: 12, color: CALL_SALMON },
  defLabel: { position: 'absolute', right: 10, fontFamily: fonts.mono, fontSize: 12, color: colors.green },
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
  // Rides WITH the handle (same animated wrapper) — the field habit, in situ.
  handleHint: {
    position: 'absolute',
    left: 36,
    width: 160,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.amber,
  },

  crestTitleSteel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub, marginBottom: 4 },
  crestTitleSalmon: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: CALL_SALMON, marginBottom: 4 },
  crestNote: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, lineHeight: 15, color: colors.textSub, marginTop: 6 },

  // Structured caption (WATCH FOR / body / FIELD NOTE) — shared contract.
  captionBox: { minHeight: 60, marginTop: 12, gap: 4 },
  watchFor: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  fieldNote: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
});
