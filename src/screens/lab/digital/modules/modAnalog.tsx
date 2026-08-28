/**
 * digital/modAnalog — Module 1 (The Analog Signal) + Module 2 (Sampling &
 * Sample Rate) of the Digital Audio Sampling & Conversion Lab.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): both modules render the RackUnit
 * frame themselves — DigitalModuleScreen gives rack modules the full height and
 * no host ScrollView. The hero viz PINS on the stage (height-parametric), its
 * honesty badge stays with it verbatim, readouts print on the bezel, the
 * teaching faders ride the dock lane, and only prose/secondary panels/checks
 * scroll in the well (which carries its own guided-lesson entry row).
 *
 * NO Skia in this file: the visuals load solely through
 * skiaGate.requireVizSignal(); pre-Skia clients render VizUnavailableCard
 * (§1.7) and every readout that needs the drawn-waveform math hides with it.
 *
 * ANTI-MISCONCEPTION CHARTER (owner's core requirement): nothing here draws
 * or implies staircase digital audio; sample dots are MEASUREMENTS of a
 * continuous signal; higher sample rate buys bandwidth, never "smoothness".
 *
 * ALIAS AUDIO (owner-approved — the lab's one real audio demo): mirrors
 * FoundationsCourseScreen's ApeDsp plumbing exactly — engine gate via
 * EngineGate state, audio-output mute gate (requestAudioOutput), generation
 * token, keepalive interval, stop on blur/unmount via `focused`. The badge
 * discloses it as a SYNTHESIZED PREDICTION of what an unfiltered converter
 * would produce.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApeDsp, GEN_MODES } from '../../../../../modules/ape-dsp';
import { GlassButton } from '../../../../components/GlassButton';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../../features/audio/audioOutputStore';
import { guardToneLevelForEngine } from '../../../../features/audio/speakerSafety';
import { DisplayGuideButton } from '../../../../features/lab/guidedLessons';
import { levelColor } from '../../../../features/tools/levelColor';
import { colors, fonts } from '../../../../theme/tokens';
import { EngineGate } from '../../../tools/EngineGate';
import type { EngineState } from '../../../../features/tools/engine/useDspEngine';
import { LabChip, CollapsibleSection } from '../../LabShell';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { Badge, MythReality, PanelCard, ReadoutGrid, dstyles } from '../bits';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { requireVizSignal, type VizSignalModule } from '../skiaGate';
import type { WaveKind } from '../vizSignal';
import type { DigitalModuleProps } from '../DigitalModuleScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers (pure math — no Skia; duplicated one-liners of the viz math
// so alias audio and readouts keep working on pre-Skia clients).

function fmtHz(f: number): string {
  if (f >= 1000) return `${Number((f / 1000).toFixed(2))} kHz`;
  return `${Math.round(f)} Hz`;
}

/** Compact ≤7-char frequency for the dock button. */
function fmtHzShort(f: number): string {
  if (f >= 1000) return `${Number((f / 1000).toFixed(1))}k`;
  return `${Math.round(f)}`;
}

/** Alias of input f sampled at fs: fold around the nearest multiple of fs. */
function aliasOf(f: number, fs: number): number {
  return Math.abs(f - Math.round(f / fs) * fs);
}

/** Low-pass magnitude for the drawn AA-filter model (12/24/48 dB per octave). */
function lpGain(f: number, cutoffHz: number, slopeDbOct: number): number {
  const order = slopeDbOct / 6;
  return 1 / Math.sqrt(1 + Math.pow(f / cutoffHz, 2 * order));
}

/** Slowed visual sweep rate — proportional to pitch, always slowed. */
function visHzFor(freqHz: number, lo: number, hi: number): number {
  const f = Math.max(lo, Math.min(hi, freqHz));
  return 0.5 + 1.25 * (Math.log(f / lo) / Math.log(hi / lo));
}

/** Guided-lesson entry row at the bottom of the rack well (rack modules own
 *  their well, so they carry the host's lessonRow themselves). */
function LessonRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={lessonStyles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
      <Text style={lessonStyles.text}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
    </Pressable>
  );
}
const lessonStyles = StyleSheet.create({
  row: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  text: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
});

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 1 — THE ANALOG SIGNAL

// Blurbs are SAMPLING-focused — this module is about what an ADC must capture.
const WAVE_CHIP_LIST: { key: WaveKind; label: string; blurb: string }[] = [
  { key: 'sine', label: 'SINE', blurb: 'One frequency, perfectly smooth — the easiest thing an ADC will ever be asked to capture.' },
  { key: 'square', label: 'SQUARE', blurb: 'Those vertical edges are high harmonics without end — a torture test for sample rate.' },
  { key: 'triangle', label: 'TRIANGLE', blurb: 'Corners, but gentle ones: some high content, far less than a square.' },
  { key: 'saw', label: 'SAW', blurb: 'A ramp with an instant reset — every harmonic present, edge and body at once.' },
  { key: 'impulse', label: 'IMPULSE', blurb: 'A single infinitely-sharp spike: ALL frequencies at once, for one instant. The ultimate edge case.' },
  { key: 'noise', label: 'WHITE NOISE', blurb: 'Random by definition — no repeating shape for the eye or the converter to lock onto.' },
];

/** Short dock-button value per wave. */
const WAVE_SHORT: Record<WaveKind, string> = {
  sine: 'SINE',
  square: 'SQUARE',
  triangle: 'TRI',
  saw: 'SAW',
  impulse: 'IMPULSE',
  noise: 'NOISE',
};

const F1_MIN = 60;
const F1_MAX = 2000;
const freq1Of = (v: number) => Math.round(F1_MIN * Math.pow(F1_MAX / F1_MIN, v));

const ANALOG_CHECK: CheckSpec = {
  question: 'One microsecond before the converter, at the preamp output — what exists on that wire?',
  options: [
    'A stream of binary numbers, ready to store',
    'A continuously varying voltage — an analog copy of the air pressure',
    'Discrete voltage steps, one per sample',
    'Nothing measurable until the converter clocks it',
  ],
  correctIdx: 1,
  reveal:
    'Analog all the way: the microphone and preamp produce a voltage that varies continuously in ' +
    'time and in level — infinitely many values between any two instants. No numbers exist ' +
    'anywhere until the analog-to-digital converter measures this voltage (Module 2).',
  wrongHint: 'Nothing digital exists yet — the converter has not measured anything.',
};

function AnalogHero({
  viz,
  width,
  height,
  focused,
  wave,
  freqHz,
  amp,
  inverted,
  noise,
  distortion,
  cycles,
}: {
  viz: VizSignalModule;
  width: number;
  height: number;
  focused: boolean;
  wave: WaveKind;
  freqHz: number;
  amp: number;
  inverted: boolean;
  noise: boolean;
  distortion: boolean;
  cycles: number;
}) {
  const visHz = wave === 'noise' ? 0.9 : visHzFor(freqHz, F1_MIN, F1_MAX);
  const phase = viz.usePhaseClock(focused, visHz);
  return (
    <viz.AnalogChainView
      width={width}
      height={height}
      phase={phase}
      wave={wave}
      amp={amp}
      polarity={inverted ? -1 : 1}
      noise={noise}
      distortion={distortion}
      cycles={cycles}
    />
  );
}

export function AnalogModule(p: DigitalModuleProps) {
  const viz = useState(() => requireVizSignal())[0];
  const [wave, setWave] = useState<WaveKind>('sine');
  const [freqV, setFreqV] = useState(() => Math.log(220 / F1_MIN) / Math.log(F1_MAX / F1_MIN));
  const [ampV, setAmpV] = useState(0.72);
  const [inverted, setInverted] = useState(false);
  const [noiseOn, setNoiseOn] = useState(false);
  const [distOn, setDistOn] = useState(false);
  const [zoomV, setZoomV] = useState(0.5);

  const freq = freq1Of(freqV);
  const amp = 0.12 + ampV * 0.88;
  const cycles = 7 - zoomV * 6; // TIME ZOOM: 7 cycles (out) … 1 cycle (in)

  const stats = useMemo(
    () => (viz ? viz.computeWaveStats(wave, amp, noiseOn, distOn) : null),
    [viz, wave, amp, noiseOn, distOn],
  );

  const modsLabel =
    [inverted && 'Ø', noiseOn && 'NSE', distOn && 'DST'].filter(Boolean).join('·') || 'OFF';

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: freqV,
      onChange: setFreqV,
      format: () => (wave === 'noise' ? 'broadband' : `${freq} Hz`),
      formatShort: () => (wave === 'noise' ? 'BB' : fmtHzShort(freq)),
      helpKey: 'source',
    },
    {
      kind: 'fader',
      id: 'amp',
      label: 'AMP',
      value: ampV,
      onChange: setAmpV,
      format: () => `${amp.toFixed(2)} ×FS`,
      formatShort: () => amp.toFixed(2),
      tint: levelColor(ampV),
      helpKey: 'source',
    },
    {
      kind: 'fader',
      id: 'zoom',
      label: 'ZOOM',
      value: zoomV,
      onChange: setZoomV,
      format: () => `${cycles.toFixed(1)} cycles in view`,
      formatShort: () => `${cycles.toFixed(1)}cyc`,
      helpKey: 'waveform_view',
    },
    {
      kind: 'options',
      id: 'wave',
      label: 'WAVE',
      valueLabel: WAVE_SHORT[wave],
      options: WAVE_CHIP_LIST.map((c) => ({ id: c.key, label: c.label, blurb: c.blurb })),
      selectedId: wave,
      onSelect: (id) => setWave(id as WaveKind),
      sticky: true, // teaching collection — A/B shapes while the glass reacts
      helpKey: 'source',
    },
    {
      kind: 'group',
      id: 'mods',
      label: 'MODS',
      valueLabel: modsLabel,
      helpKey: 'source',
      render: () => (
        <View style={{ gap: 10 }}>
          <View style={dstyles.chipRow}>
            <LabChip
              label="POLARITY Ø INVERT"
              selected={inverted}
              onPress={() => setInverted(!inverted)}
              onLongPress={() => p.help('source')}
            />
            <LabChip label="ADD NOISE" selected={noiseOn} onPress={() => setNoiseOn(!noiseOn)} onLongPress={() => p.help('source')} />
            <LabChip
              label="ADD DISTORTION"
              selected={distOn}
              onPress={() => setDistOn(!distOn)}
              onLongPress={() => p.help('source')}
            />
          </View>
          {distOn ? <Badge text="DISTORTION = SOFT tanh BEND ON THE DRAWN VOLTAGE — A DISCLOSED MODEL OF GENTLE ANALOG OVERDRIVE" /> : null}
          {noiseOn ? <Badge text="NOISE = SMALL BROADBAND FUZZ (±0.05 FS) ADDED TO THE DRAWN VOLTAGE" /> : null}
        </View>
      ),
    },
  ];

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // the three phase-locked views ARE the lesson
        badge:
          'ILLUSTRATIVE MODEL — SLOWED FOR VISIBILITY · ONE EVENT, THREE PHASE-LOCKED VIEWS: PRESSURE → DIAPHRAGM → VOLTAGE · AMPLITUDE COLOR = MIDI LOUDNESS RAMP (blue quiet → red full scale)',
        onGuide: () => p.help('waveform_view'),
        bezel: [
          { k: 'FREQ', v: wave === 'noise' ? 'broadband' : `${freq} Hz`, helpKey: 'source' },
          { k: 'PERIOD', v: wave === 'noise' ? '—' : `${(1000 / freq).toFixed(2)} ms`, helpKey: 'waveform_view' },
          { k: 'PEAK', v: stats ? `${stats.peak.toFixed(2)} FS` : '—', helpKey: 'waveform_view' },
          { k: 'RMS', v: stats ? `${stats.rms.toFixed(2)} FS` : '—', helpKey: 'waveform_view' },
        ],
        render: (w, h) =>
          viz ? (
            <AnalogHero
              viz={viz}
              width={w}
              height={h}
              focused={p.focused}
              wave={wave}
              freqHz={freq}
              amp={amp}
              inverted={inverted}
              noise={noiseOn}
              distortion={distOn}
              cycles={cycles}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', padding: 12 }}>
              <VizUnavailableCard />
            </View>
          ),
      }}
    >
      <View style={{ gap: 12 }}>
        {/* Description FIRST, in a reveal toggle (owner 2026-08-05). */}
        <CollapsibleSection title="WHAT EXISTS ON THIS WIRE">
          <Text style={dstyles.body}>
            The microphone does not create binary information. Its diaphragm rides the arriving air
            pressure, and the capsule turns that motion into a continuously varying VOLTAGE — an
            analog of the pressure. Between any two instants there are infinitely many voltage
            values; nothing is divided into steps, frames, or numbers.
          </Text>
          <Text style={dstyles.body}>
            Everything in this module — the cone, the traveling pressure, the diaphragm, the trace —
            is one physical event seen three ways, locked to the same clock. This continuous voltage
            is what the analog-to-digital converter will measure in Module 2. Until that measurement
            happens, digital audio does not exist.
          </Text>
        </CollapsibleSection>

        <Badge text="PEAK · RMS · CREST COMPUTED FROM THE ACTUAL DRAWN WAVEFORM SAMPLES" />
        <ReadoutGrid
          help={p.help}
          helpKey="waveform_view"
          items={[
            { k: 'CREST FACTOR', v: stats ? `${stats.crestDb.toFixed(1)} dB` : '—' },
            { k: 'POLARITY', v: inverted ? 'INVERTED' : 'NORMAL' },
          ]}
        />
        <Badge text="SQUARE · SAW · TRIANGLE · IMPULSE ARE DRAWN BAND-LIMITED (12 HARMONICS) — HONEST SHAPES, NOT IDEALIZED CORNERS" />

        <MythReality
          myth="A microphone converts sound into digital data — ones and zeros come out of the mic."
          reality="A microphone creates a continuously varying voltage that mirrors air pressure. Everything on this screen is analog; numbers only appear when a converter measures this voltage — that story starts in Module 2."
        />
        <CheckQuestion spec={ANALOG_CHECK} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 2 — SAMPLING & SAMPLE RATE

const RATE_CHIPS = [8000, 16000, 22050, 32000, 44100, 48000, 96000, 192000];
const CYC_CHIPS = [4, 3, 2.5, 2, 1.7];
const SLOPE_CHIPS = [12, 24, 48];
const F2_MIN = 100;
const LEVEL_DB = -22;
/** Honest playable window for the generator demo (hearing + speaker safety). */
const PLAY_MIN_HZ = 40;
const PLAY_MAX_HZ = 16000;

type RateMode = { kind: 'abs'; fs: number } | { kind: 'cyc'; mult: number };
type PlayWhich = 'input' | 'alias';

const CHECK_ALIAS: CheckSpec = {
  question: 'fs = 48 kHz, no anti-alias filter. A 30 kHz tone reaches the sampler. What lands in the recording?',
  options: [
    'Nothing — 30 kHz is simply lost',
    '30 kHz, stored correctly',
    'An 18 kHz alias (|30k − 48k|)',
    'A 6 kHz alias (30k − 24k)',
  ],
  correctIdx: 2,
  reveal:
    '30 kHz is above Nyquist (24 kHz), so the sample points fit a lower sinusoid exactly: ' +
    '|30,000 − 48,000| = 18,000 Hz. Folded around Nyquist: 24k − (30k − 24k) = 18 kHz. Try it on ' +
    'the sweep slider and fold diagram above.',
  wrongHint: 'Fold around Nyquist: alias = |f − nearest multiple of fs|.',
};

const CHECK_AA: CheckSpec = {
  question: 'Why must the anti-aliasing filter sit BEFORE the sampler instead of after it?',
  options: [
    'It protects the microphone from ultrasonic damage',
    'After sampling, an alias is an ordinary in-band signal — no filter can tell it from real audio',
    'Filters only work on analog signals, never on digital ones',
    'It is cheaper to build the electronics that way',
  ],
  correctIdx: 1,
  reveal:
    'Once folded, an alias lands inside the audio band and is mathematically identical to a real ' +
    'recording at that frequency — the damage is permanent and unremovable. The only place to ' +
    'stop it is before the measurement happens.',
  wrongHint: 'Think about what the alias looks like AFTER it is already in the sampled data.',
};

/** The alias-audio tone — FoundationsCourseScreen's plumbing, mirrored:
 *  audio-output gate → genSet/genStart with generation token → keepalive →
 *  stop on blur/unmount. */
function useAliasTone(engineReady: boolean, focused: boolean) {
  const { requestAudioOutput } = useAudioOutputGate();
  const [playing, setPlaying] = useState<PlayWhich | null>(null);
  const genRef = useRef(0);

  const play = useCallback(
    (which: PlayWhich, freqHz: number) => {
      if (!engineReady) return;
      const gen = ++genRef.current;
      void (async () => {
        const ok = await requestAudioOutput();
        if (!ok || gen !== genRef.current) return;
        ApeDsp.genSet({
          mode: GEN_MODES.sine,
          frequency: freqHz,
          levelDb: guardToneLevelForEngine(LEVEL_DB, freqHz),
        });
        try {
          await ApeDsp.genStart();
          if (gen !== genRef.current) {
            void ApeDsp.genStop();
            return;
          }
          setPlaying(which);
          noteAudioActivity();
        } catch {
          /* engine start failure — buttons stay honest via playing=null */
        }
      })();
    },
    [engineReady, requestAudioOutput],
  );

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setPlaying(null);
  }, []);

  // Stop on blur and on unmount (host keeps modules mounted under pushes).
  useEffect(() => {
    if (!focused) stop();
  }, [focused, stop]);
  useEffect(() => () => stop(), [stop]);
  // Keepalive so the mute gate sees us as active while sounding.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(noteAudioActivity, 500);
    return () => clearInterval(id);
  }, [playing]);

  return { playing, play, stop };
}

function SamplingHero({
  viz,
  width,
  height,
  focused,
  freqHz,
  sampleRate,
  cyclesShown,
  showRecon,
  filterOn,
  cutoffHz,
  slopeDbOct,
}: {
  viz: VizSignalModule;
  width: number;
  height: number;
  focused: boolean;
  freqHz: number;
  sampleRate: number;
  cyclesShown: number;
  showRecon: boolean;
  filterOn: boolean;
  cutoffHz: number;
  slopeDbOct: number;
}) {
  // Slow sweep: the sample-clock cursor crosses the window every ~4.5 s.
  const phase = viz.usePhaseClock(focused, 0.22);
  return (
    <viz.SamplingView
      width={width}
      height={height}
      phase={phase}
      freqHz={freqHz}
      sampleRate={sampleRate}
      cyclesShown={cyclesShown}
      showRecon={showRecon}
      filterOn={filterOn}
      cutoffHz={cutoffHz}
      slopeDbOct={slopeDbOct}
    />
  );
}

export function SamplingModule(p: DigitalModuleProps) {
  const viz = useState(() => requireVizSignal())[0];
  const [rateMode, setRateMode] = useState<RateMode>({ kind: 'abs', fs: 48000 });
  const [freqV, setFreqV] = useState(() => Math.log(1000 / F2_MIN) / Math.log(30000 / F2_MIN));
  const [zoomV, setZoomV] = useState(0.3);
  const [recon, setRecon] = useState(false);
  const [filterOn, setFilterOn] = useState(false);
  const [cutV, setCutV] = useState(0.85);
  const [slope, setSlope] = useState(24);

  // Input frequency — the NYQUIST SWEEP fader. Range adapts so the sweep can
  // actually cross Nyquist at studio rates (96k/192k get the honest caption).
  const fMax = rateMode.kind === 'abs' ? Math.min(rateMode.fs * 0.75, 30000) : 8000;
  const f = Math.round(F2_MIN * Math.pow(fMax / F2_MIN, freqV));
  const fs = rateMode.kind === 'abs' ? rateMode.fs : f * rateMode.mult;
  const nyq = fs / 2;
  const spc = fs / f;
  const alias = aliasOf(f, fs);
  const aliased = f > nyq * (1 + 1e-9);
  const cutoffHz = (0.3 + 0.68 * cutV) * nyq;
  const gainAtInput = filterOn ? lpGain(f, cutoffHz, slope) : 1;
  const attenDb = -20 * Math.log10(Math.max(gainAtInput, 1e-6));
  const sweepBlocked = rateMode.kind === 'abs' && fMax < nyq;

  // ZOOM: individual-samples-visible → looks-continuous (dots merge).
  const nShownTarget = 12 + zoomV * 408;
  const cycles = Math.min(60, Math.max(0.3, nShownTarget / spc));
  const nShown = Math.round(cycles * spc);

  // Alias-audio engine gate — same probe FoundationsCourseScreen uses.
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const tone = useAliasTone(engineReady, p.focused);
  const { playing, play, stop } = tone;

  // Retune LIVE while sounding: hold PLAY PREDICTED ALIAS and sweep the input
  // through Nyquist — the pitch folds back down (phase-continuous genSet).
  useEffect(() => {
    if (!playing) return;
    const target = playing === 'input' ? f : alias;
    if (target < PLAY_MIN_HZ || target > PLAY_MAX_HZ) {
      stop();
      return;
    }
    ApeDsp.genSet({ frequency: target, levelDb: guardToneLevelForEngine(LEVEL_DB, target) });
    noteAudioActivity();
  }, [playing, f, alias, stop]);

  const canInput = f >= PLAY_MIN_HZ && f <= PLAY_MAX_HZ;
  const canAlias = alias >= PLAY_MIN_HZ && alias <= PLAY_MAX_HZ;

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: freqV,
      onChange: setFreqV,
      format: () => `${fmtHz(f)} — sweep through Nyquist`,
      formatShort: () => fmtHzShort(f),
      helpKey: 'nyquist',
    },
    {
      kind: 'fader',
      id: 'zoom',
      label: 'ZOOM',
      value: zoomV,
      onChange: setZoomV,
      format: () => `${nShown} samples · ${cycles.toFixed(cycles < 3 ? 2 : 1)} cycles in view`,
      formatShort: () => `${nShown}smp`,
      helpKey: 'samples_per_cycle',
    },
    {
      kind: 'group',
      id: 'rate',
      label: 'RATE',
      valueLabel: rateMode.kind === 'abs' ? `${rateMode.fs / 1000}k` : `${rateMode.mult}/CYC`,
      helpKey: 'sample_rate',
      render: () => (
        <View style={{ gap: 10 }}>
          <View style={dstyles.chipRow}>
            {RATE_CHIPS.map((r) => (
              <LabChip
                key={r}
                label={`${r / 1000}k`}
                selected={rateMode.kind === 'abs' && rateMode.fs === r}
                onPress={() => setRateMode({ kind: 'abs', fs: r })}
                onLongPress={() => p.help('sample_rate')}
              />
            ))}
          </View>
          <View style={dstyles.chipRow}>
            {CYC_CHIPS.map((m) => (
              <LabChip
                key={m}
                label={`${m} /CYC`}
                selected={rateMode.kind === 'cyc' && rateMode.mult === m}
                onPress={() => setRateMode({ kind: 'cyc', mult: m })}
                onLongPress={() => p.help('samples_per_cycle')}
              />
            ))}
          </View>
          <Badge text="DEMO MODES: SAMPLE RATE SET RELATIVE TO THE INPUT FREQUENCY — FOR VISUALIZATION, NOT A REAL CONVERTER SETTING" />
        </View>
      ),
    },
    {
      kind: 'toggle',
      id: 'recon',
      label: 'RECON',
      value: recon,
      onToggle: () => setRecon(!recon),
      helpKey: 'nyquist',
    },
  ];

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // the sampling scene is the star
        badge:
          'EVERY DOT IS A MEASUREMENT OF THE CONTINUOUS SIGNAL — NOT A BLOCK OF SOUND. BELOW NYQUIST THE DOTS DESCRIBE IT COMPLETELY.',
        onGuide: () => p.help('sample_rate'),
        bezel: [
          {
            k: 'FS',
            v: rateMode.kind === 'abs' ? fmtHz(fs) : `${fmtHz(fs)} (${rateMode.mult}×f)`,
            helpKey: 'sample_rate',
          },
          { k: 'INPUT', v: fmtHz(f), helpKey: 'nyquist' },
          { k: 'NYQUIST', v: fmtHz(nyq), helpKey: 'nyquist' },
          { k: 'READS AS', v: fmtHz(alias), tint: aliased ? '#ff6b5e' : undefined, helpKey: 'aliasing' },
        ],
        render: (w, h) =>
          viz ? (
            <SamplingHero
              viz={viz}
              width={w}
              height={h}
              focused={p.focused}
              freqHz={f}
              sampleRate={fs}
              cyclesShown={cycles}
              showRecon={recon}
              filterOn={filterOn}
              cutoffHz={cutoffHz}
              slopeDbOct={slope}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', padding: 12 }}>
              <VizUnavailableCard />
            </View>
          ),
      }}
    >
      <View style={{ gap: 12 }}>
        {recon && !aliased ? (
          <Badge text="RECONSTRUCTION OF A PURE SINE IS THE SINE ITSELF — THE CURVE THROUGH THE DOTS IS EXACT BAND-LIMITED MATH, NOT SMOOTHING" />
        ) : null}
        {sweepBlocked ? (
          <Text style={dstyles.caption}>
            At {fmtHz(fs)} the sweep tops out below Nyquist ({fmtHz(nyq)}) — pick 8–48 kHz or a
            per-cycle demo mode to cross it.
          </Text>
        ) : null}
        <ReadoutGrid
          help={p.help}
          helpKey="sample_rate"
          items={[
            { k: 'INTERVAL', v: `${(1e6 / fs).toFixed(3)} µs` },
            { k: 'SAMPLES / CYCLE', v: spc.toFixed(2), helpKey: 'samples_per_cycle' },
            { k: 'f / NYQUIST', v: `${(f / nyq).toFixed(2)}×`, helpKey: 'nyquist' },
            { k: '24-BIT STEREO', v: `${((fs * 48) / 1e6).toFixed(3)} Mb/s` },
          ]}
        />

        <PanelCard>
          <Text style={dstyles.eyebrow}>NYQUIST & THE FOLD</Text>
          <Text style={dstyles.body}>
            Nyquist is half the sample rate — the highest frequency the sampled data can represent.
            Sweep the input upward: below Nyquist the dots track it; above, the same dots fit a
            LOWER-frequency sinusoid exactly (bright curve above), computed as |f − nearest multiple
            of fs|. The diagram shows the whole axis folding at Nyquist.
          </Text>
          {viz ? <viz.FoldView width={p.width} freqHz={f} sampleRate={fs} /> : <VizUnavailableCard />}
          <DisplayGuideButton onPress={() => p.help('aliasing')} />
        </PanelCard>

        <PanelCard>
          <Text style={dstyles.eyebrow}>ALIAS AUDIO — HEAR THE FOLD</Text>
          <Text style={dstyles.body}>
            Play the input tone, then the alias the math predicts for it. Hold PLAY PREDICTED ALIAS
            and ride the FREQ lane up through Nyquist — the pitch folds back down while the
            input keeps rising.
          </Text>
          {!engineReady ? (
            <EngineGate state={gate} />
          ) : (
            <View style={{ gap: 8 }}>
              <GlassButton
                label={playing === 'input' ? 'STOP' : `PLAY INPUT — ${fmtHz(f)}`}
                tint="green"
                height={46}
                fontSize={13.5}
                disabled={!canInput}
                onPress={() => (playing === 'input' ? stop() : play('input', f))}
              />
              <GlassButton
                label={playing === 'alias' ? 'STOP' : `PLAY PREDICTED ALIAS — ${fmtHz(alias)}`}
                tint={aliased ? 'gold' : 'green'}
                height={46}
                fontSize={13.5}
                disabled={!canAlias}
                onPress={() => (playing === 'alias' ? stop() : play('alias', alias))}
              />
              {!aliased ? (
                <Text style={dstyles.caption}>
                  Below Nyquist the predicted alias IS the input — both buttons play the same tone.
                </Text>
              ) : null}
              {!canInput || !canAlias ? (
                <Text style={dstyles.caption}>
                  Tones outside ~{PLAY_MIN_HZ} Hz–{fmtHz(PLAY_MAX_HZ)} are gated off (generator and
                  hearing range) — the math readouts above stay live.
                </Text>
              ) : null}
            </View>
          )}
          <Badge text="SYNTHESIZED PREDICTION — THE GENERATOR PLAYS THE TONE THE MATH PREDICTS; A REAL CONVERTER WITHOUT AN ANTI-ALIAS FILTER WOULD PRODUCE IT" />
        </PanelCard>

        <PanelCard>
          <Text style={dstyles.eyebrow}>ANTI-ALIASING FILTER</Text>
          <Text style={dstyles.body}>
            A low-pass BEFORE the sampler removes content above Nyquist so it can never fold down.
            Filter off: an above-Nyquist input reaches the sampler and the alias appears in the
            sampled data above. Filter on: the input is attenuated before measurement — the alias is
            gone, and honest cost: real signal near the cutoff is attenuated too.
          </Text>
          <View style={dstyles.chipRow}>
            <LabChip
              label="FILTER OFF"
              selected={!filterOn}
              onPress={() => setFilterOn(false)}
              onLongPress={() => p.help('aa_filter')}
            />
            <LabChip
              label="FILTER ON"
              selected={filterOn}
              onPress={() => setFilterOn(true)}
              onLongPress={() => p.help('aa_filter')}
            />
            {SLOPE_CHIPS.map((s) => (
              <LabChip
                key={s}
                label={`${s} dB/OCT`}
                selected={filterOn && slope === s}
                onPress={() => {
                  setSlope(s);
                  setFilterOn(true);
                }}
                onLongPress={() => p.help('aa_filter')}
              />
            ))}
          </View>
          <DragSlider
            value={cutV}
            onChange={setCutV}
            label="CUTOFF"
            readout={`${fmtHz(cutoffHz)} · ${(cutoffHz / nyq).toFixed(2)}×Nyquist`}
            onHelp={() => p.help('aa_filter')}
          />
          {viz ? (
            <viz.AAFilterView
              width={p.width}
              sampleRate={fs}
              cutoffHz={cutoffHz}
              slopeDbOct={slope}
              freqHz={f}
              filterOn={filterOn}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <ReadoutGrid
            help={p.help}
            helpKey="aa_filter"
            items={[
              { k: 'CUTOFF', v: fmtHz(cutoffHz) },
              { k: 'SLOPE', v: `${slope} dB/oct` },
              { k: 'INPUT ATTEN', v: filterOn ? `−${attenDb.toFixed(1)} dB` : '0 dB (off)' },
            ]}
          />
          <Badge text="MAGNITUDE-ROLLOFF MODEL — SHOWS ROLLOFF ONLY (NOT PASSBAND RIPPLE · STOPBAND DEPTH · PHASE)" />
        </PanelCard>

        <MythReality
          myth="More samples per second makes the waveform smoother — 192 kHz audio has smoother curves than 48 kHz."
          reality="Below Nyquist the samples uniquely describe ONE band-limited signal, and reconstruction returns exactly that signal — turn on RECONSTRUCTED at 3 samples per cycle and watch the curve hug the original. A higher sample rate buys BANDWIDTH (a higher Nyquist), not smoothness."
        />
        <CheckQuestion spec={CHECK_ALIAS} />
        <CheckQuestion spec={CHECK_AA} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}
