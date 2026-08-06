/**
 * SpectrogramDemo — visual training demo for the Spectrogram tool (spec of
 * record docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §12; demo contract §4, user
 * ruling 2026-07-23: demos are visual/animated only — no audio path exists).
 *
 * MOTION MODEL (owner 2026-08-05): a real spectrogram STREAMS — the freshest
 * column is painted at the RIGHT edge ("now") and every older column scrolls
 * LEFT. So the demo scrolls its content right→left continuously (two identical
 * copies translated by −width → seamless, no seam, no reset flash). There is no
 * sweeping playhead any more (it read as a vertical "event" and confused the
 * picture). Because sustained tones are horizontal they sit visually still while
 * transient verticals scroll by — which is exactly the lesson.
 *
 * Three scenes, switched via chips:
 *   1 SPEECH vs MUSIC — gapped, pitch-bent harmonic stacks (syllables) vs
 *     steady horizontal harmonic lines with vertical attack stripes.
 *   2 FEEDBACK — one sustained horizontal streak (the ring) sitting still over
 *     scrolling program material: sustained = horizontal, transient = vertical.
 *   3 FFT TRADE-OFF — big FFT (sharp freq / smeared time) vs small FFT (sharp
 *     time / smeared freq) on the same signal.
 *
 * Amplitude is drawn with the app MIDI level ramp (owner 2026-08-05, item 4):
 * loud = red → quiet = blue, via features/tools/levelColor. All content is fixed
 * precomputed data (no Math.random). Motion is RN core Animated only (native
 * transform). Nothing here is or resembles a live meter (spec §1.7).
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { levelColor } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';

/* ------------------------------------------------------------------ */
/* Fixed, deterministic scene data (computed once at module load)      */
/* ------------------------------------------------------------------ */

const VB_HALF_W = 150; // viewBox width of a half-width plot
const VB_FULL_W = 320; // viewBox width of the full-width plot
const VB_H = 148; // viewBox height == plot inner pixel height (1:1 in y)
const F_TOP = 8; // y of the highest drawn frequency
const F_BOTTOM = 140; // y of the lowest drawn frequency

/** Map a normalized frequency (0..1, 1 = top of plot) to a viewBox y. */
function yForFreq(f: number): number {
  return F_BOTTOM - f * (F_BOTTOM - F_TOP);
}

/** MIDI amplitude colour for a 0..1 loudness (1 = full scale/red, 0 = blue). */
const amp = (loud: number) => levelColor(loud);

/** Voiced speech segments (fractions of the time axis) with silent gaps. */
const SPEECH_SEGMENTS: ReadonlyArray<readonly [number, number]> = [
  [0.04, 0.3],
  [0.36, 0.62],
  [0.7, 0.96],
];
/** Fixed per-segment pitch-contour phases + per-harmonic jitter (seeded). */
const SEG_PHASE = [0.15, 0.55, 0.9] as const;
const HARM_JITTER = [0, 0.004, -0.003, 0.005, -0.002] as const;
const HARM_WIDTH = [3.4, 2.9, 2.4, 2.1, 1.9] as const;
/** Per-harmonic loudness → MIDI colour + opacity (fundamental loud, decaying). */
const HARM_LOUD = [0.96, 0.76, 0.58, 0.44, 0.32] as const;

function buildSpeechPaths(): string[] {
  const paths: string[] = [];
  for (let k = 1; k <= 5; k++) {
    const parts: string[] = [];
    SPEECH_SEGMENTS.forEach(([a, b], si) => {
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const t = a + ((b - a) * i) / steps;
        const f0 =
          0.135 + (HARM_JITTER[k - 1] ?? 0) + 0.026 * Math.sin(2 * Math.PI * (1.15 * t + (SEG_PHASE[si] ?? 0)));
        const x = 3 + t * (VB_HALF_W - 6);
        const y = yForFreq(Math.min(0.95, k * f0));
        parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    });
    paths.push(parts.join(' '));
  }
  return paths;
}
const SPEECH_PATHS = buildSpeechPaths();

/** Music: sustained harmonic stack + transient hits (fixed positions). */
const MUSIC_FREQS = [0.15, 0.3, 0.45, 0.6, 0.75] as const;
const MUSIC_WIDTH = [3.2, 2.8, 2.3, 2, 1.8] as const;
const MUSIC_LOUD = [0.95, 0.78, 0.6, 0.46, 0.34] as const;
const MUSIC_HITS = [0.12, 0.34, 0.55, 0.76, 0.9] as const;

/** Feedback scene: dim program material behind the ringing frequency. */
const FB_BANDS = [0.1, 0.27, 0.42, 0.66] as const;
const FB_TICKS = [0.18, 0.45, 0.83] as const;
const FB_RING_F = 0.55;

/** FFT trade-off: two close tones + three clicks, same "signal" both sides. */
const FFT_TONES = [0.52, 0.585] as const;
const FFT_CLICKS = [0.22, 0.5, 0.78] as const;
const FFT_BAND_TOP = yForFreq(0.635);
const FFT_BAND_H = yForFreq(0.47) - FFT_BAND_TOP;

const SCENES = [
  {
    key: 'speechMusic',
    label: 'SPEECH vs MUSIC',
    a11y: 'speech versus music',
    caption:
      'The display streams right to left — the newest moment is always at the right edge. Speech draws stacked ' +
      'harmonics that bend with the pitch of the voice and break into syllable-sized bursts. Music holds steady ' +
      'horizontal harmonic lines (they sit still as time scrolls), with vertical stripes marking each attack.',
  },
  {
    key: 'feedback',
    label: 'FEEDBACK',
    a11y: 'feedback ringing',
    caption:
      'Feedback rings at one exact frequency, so it shows as a single HORIZONTAL streak that holds steady while the ' +
      'program material scrolls past beneath it. Sustained tone = horizontal line; passing transients = vertical ' +
      'stripes. Find the steady streak and you have read the feedback frequency straight off the display.',
  },
  {
    key: 'fft',
    label: 'FFT TRADE-OFF',
    a11y: 'FFT size trade-off',
    caption:
      'A big FFT resolves the two close tones as separate horizontal lines but smears each click across time. A small ' +
      'FFT pins the clicks sharply in time while the tones blur into one thick band — sharpening one axis smears the other.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Plot shell: bordered panel + seamless right→left streaming scroll    */
/* ------------------------------------------------------------------ */

interface ScrollPlotProps {
  scroll: Animated.Value;
  /** Renders one width-`w` copy of the spectrogram content (SVG). */
  strip: (w: number) => ReactNode;
}

/** Two identical copies side by side, translated 0 → −w over the loop: the left
 *  copy exits left exactly as the right copy arrives, so the scroll is seamless
 *  and needs no reset flash. New content therefore always enters at the right. */
function ScrollPlot({ scroll, strip }: ScrollPlotProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const translateX = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.max(1, w)] });
  return (
    <View style={styles.plot} onLayout={onLayout}>
      {w > 0 ? (
        <Animated.View style={[styles.scrollStrip, { width: w * 2, transform: [{ translateX }] }]}>
          <View style={{ width: w, height: '100%' }}>{strip(w)}</View>
          <View style={{ width: w, height: '100%' }}>{strip(w)}</View>
        </Animated.View>
      ) : null}
      {/* "Now" edge — the right edge is the freshest column. */}
      <View pointerEvents='none' style={styles.nowGlow} />
      <View pointerEvents='none' style={styles.nowEdge} />
      <Text style={styles.nowLabel}>NOW</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene strip renderers (one width-`w` copy each)                     */
/* ------------------------------------------------------------------ */

function speechStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
      {SPEECH_PATHS.map((d, i) => (
        <Path
          key={`sp${i}`}
          d={d}
          fill='none'
          stroke={amp(HARM_LOUD[i] ?? 0.3)}
          strokeWidth={HARM_WIDTH[i] ?? 2}
          strokeOpacity={0.92}
          strokeLinecap='round'
        />
      ))}
    </Svg>
  );
}

function musicStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Transient attacks — broadband verticals (loud, warm); these scroll. */}
      {MUSIC_HITS.map((t, i) => (
        <Line
          key={`mh${i}`}
          x1={3 + t * (VB_HALF_W - 6)}
          y1={F_TOP}
          x2={3 + t * (VB_HALF_W - 6)}
          y2={F_BOTTOM}
          stroke={amp(0.82)}
          strokeWidth={2.6}
          strokeOpacity={0.4}
        />
      ))}
      {/* Sustained harmonic lines — horizontal, sit still as time scrolls. */}
      {MUSIC_FREQS.map((f, i) => (
        <Line
          key={`mf${i}`}
          x1={3}
          y1={yForFreq(f)}
          x2={VB_HALF_W - 3}
          y2={yForFreq(f)}
          stroke={amp(MUSIC_LOUD[i] ?? 0.3)}
          strokeWidth={MUSIC_WIDTH[i] ?? 2}
          strokeOpacity={0.95}
        />
      ))}
    </Svg>
  );
}

function feedbackStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_FULL_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Passing transients — dim verticals; these are what visibly scroll. */}
      {FB_TICKS.map((t, i) => (
        <Line
          key={`ft${i}`}
          x1={3 + t * (VB_FULL_W - 6)}
          y1={F_TOP}
          x2={3 + t * (VB_FULL_W - 6)}
          y2={F_BOTTOM}
          stroke={amp(0.28)}
          strokeWidth={2}
          strokeOpacity={0.35}
        />
      ))}
      {/* Dim program material — quiet horizontal bands (cool colours). */}
      {FB_BANDS.map((f, i) => (
        <Line
          key={`fb${i}`}
          x1={3}
          y1={yForFreq(f)}
          x2={VB_FULL_W - 3}
          y2={yForFreq(f)}
          stroke={amp(0.22)}
          strokeWidth={2.5}
          strokeOpacity={0.5}
        />
      ))}
      {/* The ring — one sustained, loud, HORIZONTAL streak (glow + hot core). */}
      <Line
        x1={3}
        y1={yForFreq(FB_RING_F)}
        x2={VB_FULL_W - 3}
        y2={yForFreq(FB_RING_F)}
        stroke={amp(1)}
        strokeWidth={8}
        strokeOpacity={0.22}
        strokeLinecap='round'
      />
      <Line
        x1={3}
        y1={yForFreq(FB_RING_F)}
        x2={VB_FULL_W - 3}
        y2={yForFreq(FB_RING_F)}
        stroke={amp(1)}
        strokeWidth={3}
        strokeOpacity={0.98}
        strokeLinecap='round'
      />
    </Svg>
  );
}

function fftBigStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Clicks smeared wide across time (soft warm blur). */}
      {FFT_CLICKS.map((t, i) => (
        <Rect
          key={`bc${i}`}
          x={3 + t * (VB_HALF_W - 6) - 9}
          y={F_TOP}
          width={18}
          height={F_BOTTOM - F_TOP}
          fill={amp(0.7)}
          fillOpacity={0.16}
        />
      ))}
      {/* Two close tones crisply resolved (loud → red). */}
      {FFT_TONES.map((f, i) => (
        <Line
          key={`bt${i}`}
          x1={3}
          y1={yForFreq(f)}
          x2={VB_HALF_W - 3}
          y2={yForFreq(f)}
          stroke={amp(0.95)}
          strokeWidth={1.8}
          strokeOpacity={0.97}
        />
      ))}
    </Svg>
  );
}

function fftSmallStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Tones smeared into one thick band (medium loudness → orange/yellow). */}
      <Rect x={3} y={FFT_BAND_TOP} width={VB_HALF_W - 6} height={FFT_BAND_H} fill={amp(0.6)} fillOpacity={0.22} />
      <Line
        x1={3}
        y1={yForFreq(0.5525)}
        x2={VB_HALF_W - 3}
        y2={yForFreq(0.5525)}
        stroke={amp(0.72)}
        strokeWidth={4}
        strokeOpacity={0.4}
      />
      {/* Clicks crisply resolved in time (loud verticals; these scroll). */}
      {FFT_CLICKS.map((t, i) => (
        <Line
          key={`sc${i}`}
          x1={3 + t * (VB_HALF_W - 6)}
          y1={F_TOP}
          x2={3 + t * (VB_HALF_W - 6)}
          y2={F_BOTTOM}
          stroke={amp(0.92)}
          strokeWidth={2.2}
          strokeOpacity={0.97}
        />
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

interface SceneProps {
  scroll: Animated.Value;
}

function SpeechMusicScene({ scroll }: SceneProps) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.plotLabel}>SPEECH</Text>
        <Text style={styles.plotLabel}>MUSIC</Text>
      </View>
      <View style={styles.plotRow}>
        <ScrollPlot scroll={scroll} strip={speechStrip} />
        <ScrollPlot scroll={scroll} strip={musicStrip} />
      </View>
    </>
  );
}

function FeedbackScene({ scroll }: SceneProps) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.plotLabel}>
          RINGING AT ONE FREQUENCY <Text style={styles.monoInline}>2.4k</Text>
        </Text>
      </View>
      <View style={styles.plotRow}>
        <ScrollPlot scroll={scroll} strip={feedbackStrip} />
      </View>
    </>
  );
}

function FftScene({ scroll }: SceneProps) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.plotLabel}>
          BIG FFT <Text style={styles.monoInline}>8192</Text>
        </Text>
        <Text style={styles.plotLabel}>
          SMALL FFT <Text style={styles.monoInline}>256</Text>
        </Text>
      </View>
      <View style={styles.plotRow}>
        <ScrollPlot scroll={scroll} strip={fftBigStrip} />
        <ScrollPlot scroll={scroll} strip={fftSmallStrip} />
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.tradeLabel}>SHARP FREQ · SMEARED TIME</Text>
        <Text style={styles.tradeLabel}>SHARP TIME · SMEARED FREQ</Text>
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MIDI amplitude legend (item 4)                                      */
/* ------------------------------------------------------------------ */

function AmpLegend() {
  return (
    <View style={styles.legendRow}>
      <Text style={styles.legendCap}>QUIET</Text>
      <View style={styles.legendBar}>
        <Svg width='100%' height='100%' preserveAspectRatio='none' viewBox='0 0 100 10'>
          <Defs>
            <LinearGradient id='specAmp' x1='0' y1='0' x2='100' y2='0' gradientUnits='userSpaceOnUse'>
              {[0, 0.25, 0.5, 0.75, 1].map((s) => (
                <Stop key={s} offset={String(s)} stopColor={levelColor(s)} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={10} rx={2} fill='url(#specAmp)' />
        </Svg>
      </View>
      <Text style={styles.legendCap}>LOUD</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Demo component                                                      */
/* ------------------------------------------------------------------ */

export function SpectrogramDemo() {
  const [scene, setScene] = useState(0);
  const scroll = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scroll.setValue(0);
    // Linear, gapless loop: 0 → 1 maps to a full-width leftward shift. Because
    // the two strip copies are identical, value 1 is pixel-for-pixel value 0, so
    // the restart is invisible and the scroll never stutters.
    const anim = Animated.loop(
      Animated.timing(scroll, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [scene, scroll]);

  const current = SCENES[scene] ?? SCENES[0];

  return (
    <View style={styles.panel}>
      <View style={styles.chipRow}>
        {SCENES.map((s, i) => {
          const active = i === scene;
          return (
            <Pressable
              key={s.key}
              accessibilityRole='button'
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Show ${s.a11y} scene`}
              onPress={() => setScene(i)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {scene === 0 ? (
        <SpeechMusicScene scroll={scroll} />
      ) : scene === 1 ? (
        <FeedbackScene scroll={scroll} />
      ) : (
        <FftScene scroll={scroll} />
      )}

      <View style={styles.axisRow}>
        <Text style={styles.axisText}>FREQ ↑</Text>
        <Text style={styles.axisText}>◄ SCROLLS · TIME →</Text>
      </View>

      <AmpLegend />

      <Text style={styles.caption}>{current.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 392,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 8,
  },

  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,0.1)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSub },
  chipTextActive: { color: colors.amber },

  labelRow: { flexDirection: 'row', gap: 8 },
  plotLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.amberLabel,
  },
  monoInline: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0, color: colors.amber },
  tradeLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.textSub,
  },

  plotRow: { flexDirection: 'row', gap: 8, height: 150 },
  plot: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f1f24',
    backgroundColor: '#0a0a0d',
    overflow: 'hidden',
  },
  scrollStrip: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },

  // Right-edge "now" indicator — where the freshest column is painted.
  nowGlow: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  nowEdge: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.35)' },
  nowLabel: {
    position: 'absolute',
    top: 3,
    right: 4,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 0.5,
    color: 'rgba(230,230,235,0.7)',
  },

  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },

  // MIDI amplitude legend.
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendCap: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  legendBar: { flex: 1, height: 10, borderRadius: 2, overflow: 'hidden' },

  caption: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
});
