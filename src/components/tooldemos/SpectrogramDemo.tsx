/**
 * SpectrogramDemo — visual training demo for the Spectrogram tool (spec of
 * record docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §12; demo contract §4, user
 * ruling 2026-07-23: demos are visual/animated only — no audio path exists).
 *
 * Three scenes, switched via chips:
 *   1 SPEECH vs MUSIC — wavy, gapped harmonic bands vs sustained harmonic
 *     lines with transient verticals.
 *   2 FEEDBACK — a single-frequency streak that extends and brightens as the
 *     time sweep advances (ringing reads as a horizontal streak).
 *   3 FFT TRADE-OFF — the same signal analyzed with a big FFT (sharp
 *     frequency, smeared time) vs a small FFT (sharp time, smeared frequency).
 *
 * All spectrogram content is fixed, precomputed deterministic data (no
 * Math.random). Motion is RN core Animated only (native-driver transforms /
 * opacity on container Views over react-native-svg graphics). Nothing here is
 * or resembles a live measurement — the hosting ToolDemoScreen carries the
 * permanent TRAINING DEMO badge, and LedMeter is not used (spec §1.7).
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
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

/** Voiced speech segments (fractions of the time axis) with silent gaps. */
const SPEECH_SEGMENTS: ReadonlyArray<readonly [number, number]> = [
  [0.04, 0.3],
  [0.36, 0.62],
  [0.7, 0.96],
];
/** Fixed per-segment pitch-contour phases + per-harmonic jitter (seeded). */
const SEG_PHASE = [0.15, 0.55, 0.9] as const;
const HARM_JITTER = [0, 0.004, -0.003, 0.005, -0.002] as const;
const HARM_WIDTH = [3.2, 2.7, 2.3, 2, 1.8] as const;
const HARM_OPACITY = [0.95, 0.78, 0.6, 0.47, 0.36] as const;

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
const MUSIC_WIDTH = [3, 2.6, 2.2, 1.9, 1.7] as const;
const MUSIC_OPACITY = [0.95, 0.8, 0.62, 0.48, 0.38] as const;
const MUSIC_HITS = [0.12, 0.34, 0.55, 0.76, 0.9] as const;

/** Feedback scene: dim program material behind the ringing frequency. */
const FB_BANDS = [0.1, 0.27, 0.42, 0.66] as const;
const FB_TICKS = [0.18, 0.45, 0.83] as const;
const FB_STREAK_Y = Math.round(yForFreq(0.55)); // px from plot top (y is 1:1)

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
      'Speech draws stacked harmonics that bend with the pitch of the voice and break into syllable-sized bursts. ' +
      'Music holds steady horizontal harmonic lines, with vertical stripes marking each drum or note attack.',
  },
  {
    key: 'feedback',
    label: 'FEEDBACK',
    a11y: 'feedback ringing',
    caption:
      'Feedback rings at one exact frequency, so it shows as a single horizontal streak that grows brighter the ' +
      'longer it rings. Find the streak and you have read the feedback frequency straight off the display.',
  },
  {
    key: 'fft',
    label: 'FFT TRADE-OFF',
    a11y: 'FFT size trade-off',
    caption:
      'A big FFT resolves the two close tones as separate lines but smears each click across time. A small FFT ' +
      'pins the clicks sharply in time while the tones blur into one thick band — sharpening one axis smears the other.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Plot shell: bordered panel + measured, native-driven time sweep     */
/* ------------------------------------------------------------------ */

interface SweepPlotProps {
  sweep: Animated.Value;
  children: ReactNode;
  /** Extra animated overlay, given the measured plot width in px. */
  overlay?: (width: number) => ReactNode;
}

function SweepPlot({ sweep, children, overlay }: SweepPlotProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, width - 2)] });
  return (
    <View style={styles.plot} onLayout={onLayout}>
      {children}
      {width > 0 && overlay ? overlay(width) : null}
      {width > 0 ? (
        <Animated.View pointerEvents='none' style={[styles.playhead, { transform: [{ translateX }] }]} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

interface SceneProps {
  sweep: Animated.Value;
}

function SpeechMusicScene({ sweep }: SceneProps) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.plotLabel}>SPEECH</Text>
        <Text style={styles.plotLabel}>MUSIC</Text>
      </View>
      <View style={styles.plotRow}>
        <SweepPlot sweep={sweep}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
            {SPEECH_PATHS.map((d, i) => (
              <Path
                key={`sp${i}`}
                d={d}
                fill='none'
                stroke={colors.amber}
                strokeWidth={HARM_WIDTH[i] ?? 2}
                strokeOpacity={HARM_OPACITY[i] ?? 0.4}
                strokeLinecap='round'
              />
            ))}
          </Svg>
        </SweepPlot>
        <SweepPlot sweep={sweep}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
            {MUSIC_HITS.map((t, i) => (
              <Line
                key={`mh${i}`}
                x1={3 + t * (VB_HALF_W - 6)}
                y1={F_TOP}
                x2={3 + t * (VB_HALF_W - 6)}
                y2={F_BOTTOM}
                stroke={colors.orange}
                strokeWidth={2.5}
                strokeOpacity={0.3}
              />
            ))}
            {MUSIC_FREQS.map((f, i) => (
              <Line
                key={`mf${i}`}
                x1={3}
                y1={yForFreq(f)}
                x2={VB_HALF_W - 3}
                y2={yForFreq(f)}
                stroke={colors.amber}
                strokeWidth={MUSIC_WIDTH[i] ?? 2}
                strokeOpacity={MUSIC_OPACITY[i] ?? 0.4}
              />
            ))}
          </Svg>
        </SweepPlot>
      </View>
    </>
  );
}

function FeedbackScene({ sweep }: SceneProps) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.plotLabel}>
          RINGING AT ONE FREQUENCY <Text style={styles.monoInline}>2.4k</Text>
        </Text>
      </View>
      <View style={styles.plotRow}>
        <SweepPlot
          sweep={sweep}
          overlay={(width) => {
            const grow = sweep.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] });
            const shift = sweep.interpolate({ inputRange: [0, 1], outputRange: [-width / 2, 0] });
            const brighten = sweep.interpolate({ inputRange: [0, 1], outputRange: [0.18, 1] });
            return (
              <Animated.View
                pointerEvents='none'
                style={[styles.streakWrap, { opacity: brighten, transform: [{ translateX: shift }, { scaleX: grow }] }]}
              >
                <View style={styles.streakGlow} />
                <View style={styles.streakCore} />
              </Animated.View>
            );
          }}
        >
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_FULL_W} ${VB_H}`} preserveAspectRatio='none'>
            {FB_TICKS.map((t, i) => (
              <Line
                key={`ft${i}`}
                x1={3 + t * (VB_FULL_W - 6)}
                y1={F_TOP}
                x2={3 + t * (VB_FULL_W - 6)}
                y2={F_BOTTOM}
                stroke='#9a9aa2'
                strokeWidth={2}
                strokeOpacity={0.1}
              />
            ))}
            {FB_BANDS.map((f, i) => (
              <Line
                key={`fb${i}`}
                x1={3}
                y1={yForFreq(f)}
                x2={VB_FULL_W - 3}
                y2={yForFreq(f)}
                stroke='#9a9aa2'
                strokeWidth={2.5}
                strokeOpacity={0.18}
              />
            ))}
          </Svg>
        </SweepPlot>
      </View>
    </>
  );
}

function FftScene({ sweep }: SceneProps) {
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
        <SweepPlot sweep={sweep}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
            {/* Clicks smeared wide across time */}
            {FFT_CLICKS.map((t, i) => (
              <Rect
                key={`bc${i}`}
                x={3 + t * (VB_HALF_W - 6) - 9}
                y={F_TOP}
                width={18}
                height={F_BOTTOM - F_TOP}
                fill={colors.amber}
                fillOpacity={0.16}
              />
            ))}
            {/* Two close tones crisply resolved */}
            {FFT_TONES.map((f, i) => (
              <Line
                key={`bt${i}`}
                x1={3}
                y1={yForFreq(f)}
                x2={VB_HALF_W - 3}
                y2={yForFreq(f)}
                stroke={colors.amber}
                strokeWidth={1.6}
                strokeOpacity={0.95}
              />
            ))}
          </Svg>
        </SweepPlot>
        <SweepPlot sweep={sweep}>
          <Svg width='100%' height='100%' viewBox={`0 0 ${VB_HALF_W} ${VB_H}`} preserveAspectRatio='none'>
            {/* Tones smeared into one thick band */}
            <Rect x={3} y={FFT_BAND_TOP} width={VB_HALF_W - 6} height={FFT_BAND_H} fill={colors.amber} fillOpacity={0.2} />
            <Line
              x1={3}
              y1={yForFreq(0.5525)}
              x2={VB_HALF_W - 3}
              y2={yForFreq(0.5525)}
              stroke={colors.amber}
              strokeWidth={4}
              strokeOpacity={0.35}
            />
            {/* Clicks crisply resolved in time */}
            {FFT_CLICKS.map((t, i) => (
              <Line
                key={`sc${i}`}
                x1={3 + t * (VB_HALF_W - 6)}
                y1={F_TOP}
                x2={3 + t * (VB_HALF_W - 6)}
                y2={F_BOTTOM}
                stroke={colors.amber}
                strokeWidth={2}
                strokeOpacity={0.95}
              />
            ))}
          </Svg>
        </SweepPlot>
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.tradeLabel}>SHARP FREQ · SMEARED TIME</Text>
        <Text style={styles.tradeLabel}>SHARP TIME · SMEARED FREQ</Text>
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Demo component                                                      */
/* ------------------------------------------------------------------ */

export function SpectrogramDemo() {
  const [scene, setScene] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sweep.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(450),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scene, sweep]);

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
        <SpeechMusicScene sweep={sweep} />
      ) : scene === 1 ? (
        <FeedbackScene sweep={sweep} />
      ) : (
        <FftScene sweep={sweep} />
      )}

      <View style={styles.axisRow}>
        <Text style={styles.axisText}>FREQ ↑</Text>
        <Text style={styles.axisText}>TIME →</Text>
      </View>

      <Text style={styles.caption}>{current.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 352,
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
    color: colors.textMuted,
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
  playhead: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 0,
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,198,77,0.85)',
  },

  streakWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: FB_STREAK_Y - 6,
    height: 12,
    justifyContent: 'center',
  },
  streakGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    backgroundColor: 'rgba(255,75,58,0.3)',
  },
  streakCore: { height: 3, borderRadius: 1.5, backgroundColor: colors.red },

  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },

  caption: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
});
