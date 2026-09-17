/**
 * Module — Harmony in Motion (spec §3 item 7, Phase 3): frequency RATIOS made
 * visible and audible, kept honestly separate from plate modes. Two tones at
 * a locked ratio: their waves, their sum, the Lissajous figure they draw
 * together, their spectrum — and, when the pair is nearly a unison, BEATS.
 *
 * SOUND (spec §2, the Harmonograph idiom): a locked small-integer ratio is
 * rendered EXACTLY by the additive engine as harmonics n₁ and n₂ of a shared
 * base — heard end-to-end on engine ≥ 3. A detuned pair needs two free sines
 * (GEN_MODES.dual, engine ≥ 8); on this client beats are visual-only and the
 * module says so — never an untrue stand-in.
 *
 * COLOUR STANDARD: every waveform is drawn on the ± amplitude ramp
 * (WAVE_LEVEL_STOPS: MIDI-0 blue at the zero line → red at ± full scale) with
 * a MIDLINE_BLUE zero line; spectrum bars carry the ramp base → tip.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, Line, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ApeDsp, GEN_MODES } from '../../../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../../features/audio/audioOutputStore';
import { guardAdditiveForEngine } from '../../../../features/audio/speakerSafety';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS, rampColors } from '../../../../features/tools/levelColor';
import { formatHz, nearestNote } from '../../../../features/cymatics/music';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { RootStackParamList } from '../../../../navigation/types';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { P } from './shared';

const BASE_F0 = 110;
type Ratio = { id: string; n1: number; n2: number; label: string; interval: string; detune?: number };
const RATIOS: Ratio[] = [
  { id: 'unison', n1: 1, n2: 1, label: '1 : 1', interval: 'unison' },
  { id: 'octave', n1: 1, n2: 2, label: '1 : 2', interval: 'octave' },
  { id: 'fifth', n1: 2, n2: 3, label: '2 : 3', interval: 'perfect fifth' },
  { id: 'fourth', n1: 3, n2: 4, label: '3 : 4', interval: 'perfect fourth' },
  { id: 'majthird', n1: 4, n2: 5, label: '4 : 5', interval: 'major third' },
  { id: 'minthird', n1: 5, n2: 6, label: '5 : 6', interval: 'minor third' },
  { id: 'tritone', n1: 5, n2: 7, label: '5 : 7', interval: 'tritone (near)' },
  { id: 'beats', n1: 1, n2: 1, label: '1 : 1.02', interval: 'detuned unison → BEATS', detune: 0.02 },
];

function ratioPayload(n1: number, n2: number): number[] {
  const amps = new Array(12).fill(0);
  const phases = new Array(12).fill(0);
  if (n1 >= 1 && n1 <= 12) amps[n1 - 1] = 1;
  if (n2 >= 1 && n2 <= 12) amps[n2 - 1] = 1;
  return [BASE_F0, ...amps, ...phases];
}

/** Locked-ratio audio through the additive engine (engine ≥ 3); detune is visual-only. */
function useRatioTone(n1: number, n2: number, detuned: boolean) {
  const { requestAudioOutput } = useAudioOutputGate();
  const engineReady = ApeDsp.isAvailable() && ApeDsp.engineVersion() >= 2;
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;
  const dualReady = engineReady && ApeDsp.engineVersion() >= 8;
  const playable = detuned ? dualReady : additiveReady;
  const [running, setRunning] = useState(false);
  const gen = useRef(0);
  const params = useCallback(() => {
    if (detuned) return { mode: GEN_MODES.dual, frequency: BASE_F0 * n1, dual: { freqB: BASE_F0 * n2 * 1.02, levelB: 1 }, levelDb: -18 };
    return { mode: GEN_MODES.additive, additive: guardAdditiveForEngine(ratioPayload(n1, n2)), levelDb: -18 };
  }, [n1, n2, detuned]);
  const start = useCallback(async () => {
    if (!playable) return;
    const g = ++gen.current;
    const ok = await requestAudioOutput();
    if (!ok || g !== gen.current) return;
    ApeDsp.genSet(params());
    try {
      await ApeDsp.genStart();
      if (g !== gen.current) {
        void ApeDsp.genStop();
        return;
      }
      setRunning(true);
      noteAudioActivity();
    } catch {
      /* the engine reports through its gate */
    }
  }, [playable, requestAudioOutput, params]);
  const stop = useCallback(() => {
    gen.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);
  useEffect(() => {
    if (!running) return;
    if (!playable) {
      stop();
      return;
    }
    ApeDsp.genSet(params());
    noteAudioActivity();
  }, [running, playable, params, stop]);
  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, 500);
    return () => clearInterval(id);
  }, [running]);
  return { running, start, stop, playable, additiveReady, dualReady, engineReady };
}

const STOPS = WAVE_LEVEL_STOPS.map((s) => ({ offset: `${Math.round(s.offset * 100)}%`, color: s.color }));

function wavePath(f: (t: number) => number, w: number, h: number, amp: number): string {
  const n = 180;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 8 + t * (w - 16);
    const y = h / 2 - f(t) * amp;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d;
}

/** A ± waveform on the amplitude ramp, zero line in MIDI-0 blue. */
function Wave({ id, width, height, f, amp, label }: { id: string; width: number; height: number; f: (t: number) => number; amp: number; label: string }) {
  const d = useMemo(() => wavePath(f, width, height, amp), [f, width, height, amp]);
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id={id} x1="0" y1={height / 2 - amp} x2="0" y2={height / 2 + amp} gradientUnits="userSpaceOnUse">
            {STOPS.map((s, k) => (
              <Stop key={k} offset={s.offset} stopColor={s.color} />
            ))}
          </SvgGradient>
        </Defs>
        <Line x1={8} y1={height / 2} x2={width - 8} y2={height / 2} stroke={MIDLINE_BLUE} strokeWidth={1} />
        <Path d={d} stroke={`url(#${id})`} strokeWidth={2} fill="none" />
      </Svg>
      <Text style={[P.badge, { position: 'absolute', left: 8, bottom: 2, backgroundColor: 'rgba(11,11,16,0.75)', paddingHorizontal: 4, borderRadius: 3 }]}>{label}</Text>
    </View>
  );
}

export function HarmonyModule({ width, help }: CymaticsModuleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ratioId, setRatioId] = useState('fifth');
  const ratio = RATIOS.find((r) => r.id === ratioId)!;
  const detuned = !!ratio.detune;
  const f1 = BASE_F0 * ratio.n1;
  const f2 = BASE_F0 * ratio.n2 * (1 + (ratio.detune ?? 0));
  const tone = useRatioTone(ratio.n1, ratio.n2, detuned);
  const [phaseT, setPhaseT] = useState(0);
  // Lissajous / beat envelope idle animation runs on a slow JS tick (no meter,
  // no per-frame state churn — 6 Hz is plenty for a still figure to breathe).
  useEffect(() => {
    if (!detuned && ratioId !== 'unison') return;
    const id = setInterval(() => setPhaseT((t) => (t + 0.04) % 1), 160);
    return () => clearInterval(id);
  }, [detuned, ratioId]);

  // Two cycles of the SLOWER tone across the strip so the ratio is readable.
  const cycles = 2;
  const kA = cycles * (ratio.n1 / Math.min(ratio.n1, ratio.n2));
  const kB = cycles * ((ratio.n2 * (1 + (ratio.detune ?? 0))) / Math.min(ratio.n1, ratio.n2));
  const waveA = useCallback((t: number) => Math.sin(2 * Math.PI * kA * t), [kA]);
  const waveB = useCallback((t: number) => Math.sin(2 * Math.PI * kB * t), [kB]);
  const waveSum = useCallback((t: number) => (Math.sin(2 * Math.PI * kA * t) + Math.sin(2 * Math.PI * kB * t)) / 2, [kA, kB]);
  // Beats: 2 % detune → the sum over a longer window shows the envelope.
  const beatHz = Math.abs(f2 - f1);
  const beatWindow = 2.5 / (beatHz || 1); // seconds → ~2.5 beats
  const beatSum = useCallback((t: number) => (Math.sin(2 * Math.PI * f1 * t * beatWindow) + Math.sin(2 * Math.PI * f2 * t * beatWindow)) / 2, [f1, f2, beatWindow]);

  const lissajous = useMemo(() => {
    const n = 720;
    const R = Math.min(width * 0.36, 130);
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const x = R + 6 + R * Math.sin(ratio.n1 * t + phaseT * Math.PI);
      const y = R + 6 + R * Math.sin((ratio.n2 * (1 + (ratio.detune ?? 0)) / 1) * t);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return { d, size: 2 * R + 12 };
  }, [ratio, width, phaseT]);

  const stripW = width - 26;

  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Musical harmony is about <Text style={P.strong}>ratios</Text> between frequencies, not about any one frequency. Two tones at a small-
        integer ratio line up again and again; detune them slightly and they drift in and out of step — you hear that as <Text style={P.strong}>beats</Text>.
        This module keeps that idea honest: ratios draw stable figures and sound consonant; plate modes are a different subject (they are inharmonic), so the two are never mixed here.
      </Text>

      <Text style={P.h}>PICK A RATIO</Text>
      <View style={P.chips}>
        {RATIOS.map((r) => (
          <LabChip key={r.id} label={r.label} selected={ratioId === r.id} onPress={() => setRatioId(r.id)} onLongPress={() => help(r.detune ? 'beats' : 'ratio')} />
        ))}
      </View>
      <View style={[P.card, { borderColor: 'rgba(255,198,77,.5)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={P.strong}>
              {ratio.label} — {ratio.interval}
            </Text>
            <Text style={P.caption}>
              {formatHz(f1)} ({nearestNote(f1).label}) and {formatHz(f2)} ({nearestNote(f2).label}
              {detuned ? ` ${nearestNote(f2).centsLabel}` : ''})
            </Text>
          </View>
          <Pressable
            onPress={() => (tone.running ? tone.stop() : void tone.start())}
            disabled={!tone.playable}
            style={[styles.play, !tone.playable && { opacity: 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel={tone.running ? 'Stop the pair' : 'Play the pair'}
          >
            <Text style={styles.playText}>{tone.running ? '■ STOP' : '▶ PLAY'}</Text>
          </Pressable>
        </View>
        <Text style={P.caption}>
          {!tone.engineReady
            ? 'Sound needs the native engine.'
            : detuned
              ? tone.dualReady
                ? 'Two free sines summed in one channel — the beats you see are the beats you hear.'
                : 'Beats are SHOWN only — this build’s sound engine plays one locked pair at a time, not two free tones.'
              : tone.additiveReady
                ? `Played EXACTLY: harmonics ${ratio.n1} and ${ratio.n2} of ${BASE_F0} Hz through the additive engine.`
                : 'Locked ratios need the additive engine (engine 3).'}
        </Text>
      </View>

      <Text style={P.h}>WAVE ADDITION</Text>
      <View style={[P.card, { padding: 6, gap: 4 }]}>
        <Wave id="wA" width={stripW} height={64} f={waveA} amp={24} label={`A · ${formatHz(f1)}`} />
        <Wave id="wB" width={stripW} height={64} f={waveB} amp={24} label={`B · ${formatHz(f2)}`} />
        <Wave id="wS" width={stripW} height={84} f={detuned ? beatSum : waveSum} amp={34} label={detuned ? `A + B over ${beatWindow.toFixed(2)} s — the envelope IS the beat` : 'A + B'} />
        <Text style={P.badge}>CALCULATED — SINES ADDED POINT BY POINT · AMPLITUDE ON THE ACADEMY RAMP</Text>
      </View>
      {detuned ? (
        <View style={P.card}>
          <Text style={P.strong}>Beat frequency = |f₂ − f₁| = {beatHz.toFixed(1)} Hz</Text>
          <Text style={P.body}>
            The two waves slide in and out of step {beatHz.toFixed(1)} times a second: loud where they agree, silent where they cancel. A beat is a
            slow swell in loudness — it is <Text style={P.strong}>not</Text> a third tone (that needs a nonlinear element). Tuners use it: zero beats = in tune.
          </Text>
        </View>
      ) : null}

      <Text style={P.h}>LISSAJOUS FIGURE</Text>
      <View style={[P.card, { alignItems: 'center' }]}>
        <Svg width={lissajous.size} height={lissajous.size}>
          <Path d={lissajous.d} stroke="#ffc64d" strokeWidth={1.6} fill="none" />
        </Svg>
        <Text style={P.caption}>
          x = A, y = B. A locked ratio closes into a stable figure with {ratio.n2} lobes across and {ratio.n1} down; a detuned pair precesses — the figure
          rolls over at the beat rate.
        </Text>
        <Text style={P.badge}>CALCULATED · THE HARMONOGRAPH’S SAME GEOMETRY</Text>
      </View>

      <Text style={P.h}>SPECTRUM</Text>
      <View style={[P.card, { paddingBottom: 6 }]}>
        <View style={{ height: 70, position: 'relative' }}>
          {[f1, f2].map((f, k) => {
            const x = (Math.log(f / 80) / Math.log(1200 / 80)) * (stripW - 24) + 12;
            return (
              <View key={k} style={{ position: 'absolute', left: x - 8, bottom: 0, alignItems: 'center' }}>
                <LinearGradient colors={rampColors(0.8, 4)} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={{ width: 16, height: 52, borderRadius: 2 }} />
                <Text style={[P.badge, { marginTop: 2 }]}>{formatHz(f)}</Text>
              </View>
            );
          })}
        </View>
        <Text style={P.caption}>Two lines, nothing else. Consonance is a relationship between the lines, not a property of either one — and a beat adds no line.</Text>
      </View>

      <Text style={P.h}>DRIVE THE SIMULATION</Text>
      <Text style={P.body}>
        A linear plate driven by two tones simply superposes both responses — each tone finds (or fails to find) its own mode. In the Plate
        Studio, DRIVE › SECOND TONE adds a 2:1, 3:2 or 4:3 partner; in the Liquid Studio a second frequency is how the quasiperiodic
        “superlattice” patterns are made.
      </Text>
      <View style={P.chips}>
        <LabChip label="Plate studio · second tone ›" selected={false} onPress={() => navigation.navigate('CymaticsPlateStudio', {})} />
        <LabChip label="Liquid studio · two frequencies ›" selected={false} onPress={() => navigation.navigate('CymaticsLiquidStudio', {})} />
        <LabChip label="Harmonograph lab ›" selected={false} onPress={() => navigation.navigate('HarmonographLab' as never)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  play: { borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)', paddingHorizontal: 14, paddingVertical: 9 },
  playText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.amber },
});
