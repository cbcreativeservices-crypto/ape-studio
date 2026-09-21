/**
 * Module — Harmony in Motion (spec §3 item 7, Phase 3), on the RACK (judge
 * panel 2026-09-17: three displays of one parameter were spread over ~700 px
 * below the ratio chips). One pinned glass, VIEW-switched — WAVES (A, B,
 * A+B), LISSAJOUS, SPECTRUM. BASE rides the lane: both tones climb while the
 * figure stays identical — "harmony is a ratio, not a frequency" as a thumb
 * gesture. DETUNE is the second lane (beats). RATIO is a sticky tray. PLAY
 * is a dock toggle.
 *
 * SOUND (spec §2, the Harmonograph idiom): a locked small-integer ratio is
 * rendered EXACTLY by the additive engine as harmonics n₁ and n₂ of the base;
 * a detuned pair needs two free sines (GEN_MODES.dual, engine ≥ 8) — on this
 * client beats are visual-only and the module says so.
 *
 * COLOUR STANDARD: every waveform on the ± amplitude ramp (WAVE_LEVEL_STOPS)
 * with a MIDLINE_BLUE zero line; spectrum bars carry the ramp base → tip at
 * the level the pair actually plays.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import type { DockParam } from '../../rack/rackTypes';
import type { RootStackParamList } from '../../../../navigation/types';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { CymaticsRackLayout } from './rackLayout';
import { P } from './shared';
import { useStopOnAudioMute } from '../../../../features/audio/useStopOnAudioMute';
import { useStopWhenSilenced } from '../../../../features/audio/useStopWhenSilenced';

const B_MIN = 55;
const B_MAX = 440;
const bFromPos = (v: number) => B_MIN * Math.pow(B_MAX / B_MIN, Math.max(0, Math.min(1, v)));
const posFromB = (b: number) => Math.log(Math.max(B_MIN, Math.min(B_MAX, b)) / B_MIN) / Math.log(B_MAX / B_MIN);
const DETUNE_MAX = 0.03;
/** The pair plays at −18 dBFS; on the meters' −60…0 window that is this fraction — the bars show THAT level. */
const LEVEL_FRAC = (60 - 18) / 60;

type Ratio = { id: string; n1: number; n2: number; label: string; interval: string; short: string };
const RATIOS: Ratio[] = [
  { id: 'unison', n1: 1, n2: 1, label: '1 : 1', interval: 'unison', short: 'unison' },
  { id: 'octave', n1: 1, n2: 2, label: '1 : 2', interval: 'octave', short: 'octave' },
  { id: 'fifth', n1: 2, n2: 3, label: '2 : 3', interval: 'perfect fifth', short: 'P5' },
  { id: 'fourth', n1: 3, n2: 4, label: '3 : 4', interval: 'perfect fourth', short: 'P4' },
  { id: 'majthird', n1: 4, n2: 5, label: '4 : 5', interval: 'major third', short: 'M3' },
  { id: 'minthird', n1: 5, n2: 6, label: '5 : 6', interval: 'minor third', short: 'm3' },
  { id: 'tritone', n1: 5, n2: 7, label: '5 : 7', interval: 'tritone (near)', short: 'tritone' },
];
type ViewId = 'waves' | 'lissajous' | 'spectrum';
const VIEWS: { id: ViewId; label: string; short: string; blurb: string }[] = [
  { id: 'waves', label: 'Wave addition', short: 'Waves', blurb: 'A, B and A + B, sines added point by point. A locked ratio repeats; a detuned pair swells and cancels — that envelope IS the beat.' },
  { id: 'lissajous', label: 'Lissajous figure', short: 'Lissa', blurb: 'x = A, y = B. A locked ratio closes into a stable figure; a detuned pair precesses at the beat rate.' },
  { id: 'spectrum', label: 'Spectrum', short: 'Spec', blurb: 'Two lines, nothing else. Consonance is a relationship between the lines — and a beat adds no line.' },
];

function ratioPayload(f0: number, n1: number, n2: number): number[] {
  const amps = new Array(12).fill(0);
  const phases = new Array(12).fill(0);
  if (n1 >= 1 && n1 <= 12) amps[n1 - 1] = 1;
  if (n2 >= 1 && n2 <= 12) amps[n2 - 1] = 1;
  return [f0, ...amps, ...phases];
}

/** Locked-ratio audio through the additive engine (engine ≥ 3); a detuned pair needs dual (engine ≥ 8). */
function useRatioTone(f0: number, n1: number, n2: number, detune: number) {
  const { requestAudioOutput } = useAudioOutputGate();
  const engineReady = ApeDsp.isAvailable() && ApeDsp.engineVersion() >= 2;
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;
  const dualReady = engineReady && ApeDsp.engineVersion() >= 8;
  const detuned = detune > 0.0005;
  const playable = detuned ? dualReady : additiveReady;
  const [running, setRunning] = useState(false);
  // Something else can silence this lab — backgrounding, shake-to-mute, the
  // idle auto-mute. Without this the transport stayed lit over silence.
  useStopOnAudioMute(setRunning);

  const gen = useRef(0);
  const params = useCallback(() => {
    if (detuned) return { mode: GEN_MODES.dual, frequency: f0 * n1, dual: { freqB: f0 * n2 * (1 + detune), levelB: 1 }, levelDb: -18 };
    return { mode: GEN_MODES.additive, additive: guardAdditiveForEngine(ratioPayload(f0, n1, n2)), levelDb: -18 };
  }, [f0, n1, n2, detune, detuned]);
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
  // Shake-to-mute (and the idle/background lock) silences the voices from
  // outside this screen; without this the transport would keep saying it is
  // playing. See useStopWhenSilenced.
  useStopWhenSilenced(running, stop);
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
  return { running, start, stop, playable, additiveReady, dualReady, engineReady, detuned };
}

const STOPS = WAVE_LEVEL_STOPS.map((s) => ({ offset: `${Math.round(s.offset * 100)}%`, color: s.color }));

function wavePath(f: (t: number) => number, w: number, y0: number, amp: number): string {
  const n = 180;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 8 + t * (w - 16);
    const y = y0 - f(t) * amp;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  return d;
}

/** Three ± waveforms on one glass, each on the amplitude ramp about its own MIDI-0 blue zero line. */
function WavesStage({ w, h, fA, fB, fSum, labels }: { w: number; h: number; fA: (t: number) => number; fB: (t: number) => number; fSum: (t: number) => number; labels: [string, string, string] }) {
  const rowH = h / 3;
  const amp = rowH * 0.36;
  const rows = useMemo(
    () => [
      { id: 'wA', f: fA, y0: rowH * 0.5, a: amp },
      { id: 'wB', f: fB, y0: rowH * 1.5, a: amp },
      { id: 'wS', f: fSum, y0: rowH * 2.5, a: amp * 1.15 },
    ],
    [fA, fB, fSum, rowH, amp],
  );
  const paths = useMemo(() => rows.map((r) => wavePath(r.f, w, r.y0, r.a)), [rows, w]);
  return (
    // ANNOUNCE THE STAGE (2026-09-18, design review #8). This module had no
    // accessibility labels anywhere, so the three stacked waveforms — the whole
    // demonstration that harmony is a RATIO — were silent.
    <View
      style={{ width: w, height: h }}
      accessible
      accessibilityLabel={`Three stacked waveforms: ${labels[0]}, ${labels[1]}, and their sum ${labels[2]}`}
    >
      <Svg width={w} height={h}>
        <Defs>
          {rows.map((r) => (
            <SvgGradient key={r.id} id={r.id} x1="0" y1={r.y0 - r.a} x2="0" y2={r.y0 + r.a} gradientUnits="userSpaceOnUse">
              {STOPS.map((s, k) => (
                <Stop key={k} offset={s.offset} stopColor={s.color} />
              ))}
            </SvgGradient>
          ))}
        </Defs>
        {rows.map((r) => (
          <Line key={r.id + 'z'} x1={8} y1={r.y0} x2={w - 8} y2={r.y0} stroke={MIDLINE_BLUE} strokeWidth={1} />
        ))}
        {rows.map((r, i) => (
          <Path key={r.id + 'p'} d={paths[i]} stroke={`url(#${r.id})`} strokeWidth={2} fill="none" />
        ))}
      </Svg>
      {rows.map((r, i) => (
        <Text key={r.id + 'l'} numberOfLines={1} style={[styles.lbl, { top: r.y0 - rowH * 0.5 + 4, maxWidth: w - 20 }]}>
          {labels[i]}
        </Text>
      ))}
    </View>
  );
}

/** The Lissajous figure — its own slow phase clock, so the precession never re-renders the rack. */
function LissajousStage({ w, h, n1, n2, detune, running }: { w: number; h: number; n1: number; n2: number; detune: number; running: boolean }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!running || detune <= 0.0005) return;
    const id = setInterval(() => setPhase((t) => (t + 0.05) % 1), 100);
    return () => clearInterval(id);
  }, [running, detune]);
  const R = Math.min(w, h) / 2 - 10;
  const d = useMemo(() => {
    const n = 720;
    let s = '';
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const x = w / 2 + R * Math.sin(n1 * t + phase * Math.PI);
      const y = h / 2 + R * Math.sin(n2 * (1 + detune) * t);
      s += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return s;
  }, [w, h, R, n1, n2, detune, phase]);
  return (
    <Svg width={w} height={h}>
      <Line x1={w / 2} y1={h / 2 - R} x2={w / 2} y2={h / 2 + R} stroke="#2a2b33" strokeWidth={1} />
      <Line x1={w / 2 - R} y1={h / 2} x2={w / 2 + R} y2={h / 2} stroke="#2a2b33" strokeWidth={1} />
      <Path d={d} stroke={colors.amber} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

function SpectrumStage({ w, h, f1, f2 }: { w: number; h: number; f1: number; f2: number }) {
  const lo = 40;
  const hi = 3000;
  const x = (f: number) => (Math.log(f / lo) / Math.log(hi / lo)) * (w - 40) + 20;
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 26, height: 1, backgroundColor: MIDLINE_BLUE }} />
      {[f1, f2].map((f, k) => (
        <View key={k} style={{ position: 'absolute', left: x(f) - 9, bottom: 26 }}>
          <LinearGradient colors={rampColors(LEVEL_FRAC, 4)} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={{ width: 18, height: (h - 60) * LEVEL_FRAC, borderRadius: 2 }} />
        </View>
      ))}
      {[f1, f2].map((f, k) => (
        <Text key={'t' + k} style={[styles.lbl, { left: x(f) - 30, width: 60, textAlign: 'center', bottom: 6 }]}>
          {formatHz(f)}
        </Text>
      ))}
    </View>
  );
}

export function HarmonyModule({ help, focused }: CymaticsModuleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ratioId, setRatioId] = useState('fifth');
  const [base, setBase] = useState(110);
  const [detune, setDetune] = useState(0);
  const [view, setView] = useState<ViewId>('waves');
  const ratio = RATIOS.find((r) => r.id === ratioId)!;
  const f1 = base * ratio.n1;
  const f2 = base * ratio.n2 * (1 + detune);
  const tone = useRatioTone(base, ratio.n1, ratio.n2, detune);
  const beatHz = Math.abs(f2 - f1);

  // Two cycles of the slower tone across the strip so the ratio is readable;
  // a detuned pair is drawn over ~2.5 beats so the envelope shows.
  const cycles = 2;
  const kA = cycles * (ratio.n1 / Math.min(ratio.n1, ratio.n2));
  const kB = cycles * ((ratio.n2 * (1 + detune)) / Math.min(ratio.n1, ratio.n2));
  const beatWindow = tone.detuned ? 2.5 / Math.max(0.2, beatHz) : 0;
  const fA = useCallback((t: number) => (beatWindow ? Math.sin(2 * Math.PI * f1 * t * beatWindow) : Math.sin(2 * Math.PI * kA * t)), [kA, f1, beatWindow]);
  const fB = useCallback((t: number) => (beatWindow ? Math.sin(2 * Math.PI * f2 * t * beatWindow) : Math.sin(2 * Math.PI * kB * t)), [kB, f2, beatWindow]);
  const fSum = useCallback((t: number) => (fA(t) + fB(t)) / 2, [fA, fB]);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'base',
      label: 'BASE',
      value: posFromB(base),
      onChange: (v) => setBase(Math.round(bFromPos(v))),
      format: () => `${formatHz(base)} · ${nearestNote(base).label} — both tones climb, the figure stays`,
      formatShort: () => `${Math.round(base)}Hz`,
      home: posFromB(110),
      helpKey: 'ratio',
    },
    {
      kind: 'fader',
      id: 'detune',
      label: 'DETUNE',
      value: detune / DETUNE_MAX,
      onChange: (v) => setDetune(Math.round(Math.max(0, Math.min(1, v)) * DETUNE_MAX * 1000) / 1000),
      format: () => (detune > 0.0005 ? `+${(detune * 100).toFixed(1)} % on B → beats at ${beatHz.toFixed(1)} Hz` : 'locked — no beats'),
      formatShort: () => (detune > 0.0005 ? `+${(detune * 100).toFixed(1)}%` : 'lock'),
      home: 0,
      helpKey: 'beats',
    },
    {
      kind: 'options',
      id: 'ratio',
      label: 'RATIO',
      valueLabel: ratio.label.replace(/ /g, ''),
      options: RATIOS.map((r) => ({ id: r.id, label: `${r.label} — ${r.interval}`, blurb: `${r.n1} : ${r.n2}. Played exactly as harmonics ${r.n1} and ${r.n2} of the base.` })),
      selectedId: ratioId,
      onSelect: setRatioId,
      sticky: true,
      helpKey: 'ratio',
    },
    { kind: 'options', id: 'view', label: 'VIEW', valueLabel: VIEWS.find((v) => v.id === view)!.short, options: VIEWS.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })), selectedId: view, onSelect: (id) => setView(id as ViewId), sticky: true, helpKey: 'lissajous' },
    ...(tone.playable ? [{ kind: 'toggle', id: 'play', label: 'PLAY', value: tone.running, onToggle: () => (tone.running ? tone.stop() : void tone.start()) } as DockParam] : []),
  ];

  return (
    <CymaticsRackLayout
      rack={{
        size: 'L',
        badge: view === 'spectrum' ? 'CALCULATED — two lines, at the level the pair plays' : view === 'lissajous' ? 'CALCULATED — the Harmonograph’s geometry' : 'CALCULATED — sines added point by point, amplitude on the Academy ramp',
        onHelp: help,
        onGuide: () => help(view === 'lissajous' ? 'lissajous' : 'ratio'),
        initialParam: 'base',
        bezel: [
          { k: 'A', v: `${formatHz(f1)} ${nearestNote(f1).label}`, helpKey: 'ratio', flex: 1.2 },
          { k: 'B', v: `${formatHz(f2)} ${nearestNote(f2).label}`, helpKey: 'ratio', flex: 1.2 },
          { k: 'INTERVAL', v: tone.detuned ? 'detuned' : ratio.short, helpKey: 'ratio', flex: 1.2 },
          { k: 'BEAT', v: tone.detuned ? `${beatHz.toFixed(1)} Hz` : '—', tint: tone.detuned ? colors.amber : undefined, helpKey: 'beats' },
        ],
        stage: (w, h) =>
          view === 'waves' ? (
            <WavesStage w={w} h={h} fA={fA} fB={fB} fSum={fSum} labels={[`A · ${formatHz(f1)}`, `B · ${formatHz(f2)}`, tone.detuned ? `A + B over ${beatWindow.toFixed(2)} s — the envelope is the beat` : 'A + B']} />
          ) : view === 'lissajous' ? (
            <LissajousStage w={w} h={h} n1={ratio.n1} n2={ratio.n2} detune={detune} running={focused} />
          ) : (
            <SpectrumStage w={w} h={h} f1={f1} f2={f2} />
          ),
        params,
      }}
      caption="Ride BASE: both tones climb and the figure does not change — harmony is the ratio. Then ride DETUNE and watch the beat appear."
    >
      <Text style={P.body}>
        Musical harmony is about <Text style={P.strong}>ratios</Text> between frequencies, not about any one frequency. Two tones at a small-integer
        ratio line up again and again; detune them slightly and they drift in and out of step — you hear that as <Text style={P.strong}>beats</Text>.
        Ratios draw stable figures and sound consonant; plate modes are a different subject (they are inharmonic), so the two are never mixed here.
      </Text>
      <Text style={P.caption}>
        {!tone.engineReady
          ? 'Sound needs the native engine.'
          : tone.detuned
            ? tone.dualReady
              ? 'PLAY: two free sines summed in one channel — the beats you see are the beats you hear.'
              : 'A detuned pair is SHOWN only — this build’s sound engine plays one locked pair at a time, not two free tones. Set DETUNE back to lock to hear the ratio.'
            : tone.additiveReady
              ? `PLAY renders the pair EXACTLY: harmonics ${ratio.n1} and ${ratio.n2} of ${formatHz(base)} through the additive engine.`
              : 'Locked ratios need the additive engine (engine 3).'}
      </Text>
      {tone.detuned ? (
        <View style={P.card}>
          <Text style={P.strong}>Beat frequency = |f₂ − f₁| = {beatHz.toFixed(1)} Hz</Text>
          <Text style={P.body}>
            The two waves slide in and out of step {beatHz.toFixed(1)} times a second: loud where they agree, silent where they cancel. A beat is a
            slow swell in loudness — it is <Text style={P.strong}>not</Text> a third tone (that needs a nonlinear element). Tuners use it: zero beats = in tune.
          </Text>
        </View>
      ) : null}
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
    </CymaticsRackLayout>
  );
}

const styles = StyleSheet.create({
  lbl: { position: 'absolute', left: 10, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(11,11,16,0.7)', paddingHorizontal: 4, borderRadius: 3 },
});
