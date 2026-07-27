/**
 * fxLabConfigs — the 12 effect lab screens as FxLabScreen configs (v4 MASTER
 * §7 Labs 1–10, 12, 15). Each config is tuned for ONE thing: making its
 * concept visually unmistakable.
 *
 *   EQ          → the response curve (boost/cut/Q made visible)
 *   Delay       → the echo timeline (spacing = time, decay = feedback)
 *   Reverb      → the decay slope (RT60 is a TIME — where it crosses −60)
 *   Chorus      → dense fine comb + sweep range (long delay → close notches)
 *   Flanger     → wide comb sweeping (short delay → spread notches, the jet)
 *   Phaser      → few UNEVEN notches (the defining contrast vs flanger)
 *   Compression → transfer curve + LIVE measured GR
 *   Gate        → transfer curve with the floor + LIVE GR
 *   Limiter     → the hard ceiling + LIVE GR
 *   Distortion  → the reshaped wave (odd vs even asymmetry visible)
 *   Phase       → Lissajous + correlation (polarity vs phase)
 *   Stereo      → Lissajous + correlation (width, mono safety)
 *
 * Param values are conventional teaching points (guided-lesson content covers
 * the full ranges); every row long-presses into its control's lesson.
 */
import { FX, FX_PARAM, EQ_BAND_TYPES, GEN_MODES } from '../../../modules/ape-dsp';
import {
  ResponseCurveGraph,
  TransferCurveGraph,
  WaveshapeGraph,
  EchoTimelineGraph,
  DecayCurveGraph,
  LissajousGraph,
  eqResponseDb,
  combResponseDb,
  phaserResponseDb,
  type EqBandSpec,
} from '../../features/lab/fxViz';
import { FxLabScreen, type FxLabConfig } from './FxLabScreen';

const P = FX_PARAM;
const ANALYTIC = 'DESIGNED RESPONSE — ANALYTIC, NOT A MEASUREMENT';

// Shared sources.
const SRC_PINK = { label: 'PINK NOISE', gen: { mode: GEN_MODES.pink } };
const SRC_WHITE = { label: 'WHITE NOISE', gen: { mode: GEN_MODES.white } };
const srcSine = (hz: number) => ({ label: `SINE ${hz} Hz`, gen: { mode: GEN_MODES.sine, frequency: hz } });
const srcClick = (bpm: number) => ({ label: `CLICK ${bpm}`, gen: { mode: GEN_MODES.click, clickBpm: bpm } });

// ─────────────────────────────────────────────────────────── LAB 1 · EQ ──
const EQ_TYPE = P.eqBand(0, 'type');
const EQ_FREQ = P.eqBand(0, 'freq');
const EQ_Q = P.eqBand(0, 'q');
const EQ_GAIN = P.eqBand(0, 'gain');

const eqConfig: FxLabConfig = {
  labId: 'eq',
  fxId: FX.eq,
  title: 'EQUALIZER LAB',
  subtitle: 'Boost · Cut · Q · Filter shapes',
  intro:
    'Shape the balance of frequencies and SEE the curve you are applying. One band, four ' +
    'controls — the response curve below is exactly the filter the audio runs through.',
  exploreCaption: 'Pick a filter shape, place it, and watch the curve — then play pink noise through it.',
  sources: [SRC_PINK, srcSine(440), SRC_WHITE],
  params: [
    {
      label: 'FILTER TYPE', paramId: EQ_TYPE, lessonKey: 'filter_type',
      choices: [
        { label: 'PEAK (BELL)', value: EQ_BAND_TYPES.peak },
        { label: 'LOW SHELF', value: EQ_BAND_TYPES.lowShelf },
        { label: 'HIGH SHELF', value: EQ_BAND_TYPES.highShelf },
        { label: 'HIGH-PASS', value: EQ_BAND_TYPES.highPass },
        { label: 'LOW-PASS', value: EQ_BAND_TYPES.lowPass },
      ],
      initial: EQ_BAND_TYPES.peak,
    },
    {
      label: 'FREQUENCY', paramId: EQ_FREQ, lessonKey: 'frequency',
      choices: [100, 250, 500, 1000, 2000, 4000, 8000].map((f) => ({ label: f >= 1000 ? `${f / 1000}k` : `${f}`, value: f })),
      initial: 1000,
    },
    {
      label: 'GAIN', paramId: EQ_GAIN, lessonKey: 'gain',
      choices: [-12, -6, 0, 6, 12].map((g) => ({ label: `${g > 0 ? '+' : ''}${g} dB`, value: g })),
      initial: 6,
    },
    {
      label: 'Q (BANDWIDTH)', paramId: EQ_Q, lessonKey: 'q',
      choices: [
        { label: '0.7 WIDE', value: 0.7 },
        { label: '1.4', value: 1.4 },
        { label: '4', value: 4 },
        { label: '8 NARROW', value: 8 },
      ],
      initial: 1.4,
    },
  ],
  Hero: (v) => {
    const band: EqBandSpec = {
      type: v[EQ_TYPE] === EQ_BAND_TYPES.peak ? 'peak'
        : v[EQ_TYPE] === EQ_BAND_TYPES.lowShelf ? 'lowShelf'
        : v[EQ_TYPE] === EQ_BAND_TYPES.highShelf ? 'highShelf'
        : v[EQ_TYPE] === EQ_BAND_TYPES.lowPass ? 'lowPass' : 'highPass',
      freq: v[EQ_FREQ], q: v[EQ_Q], gainDb: v[EQ_GAIN],
    };
    return (
      <ResponseCurveGraph
        curves={[
          { at: () => 0, emphasis: 'ref' },
          { at: (f) => eqResponseDb([band], f), emphasis: 'main' },
        ]}
      />
    );
  },
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    `${v[EQ_GAIN] > 0 ? '+' : ''}${v[EQ_GAIN]} dB at ${v[EQ_FREQ] >= 1000 ? `${v[EQ_FREQ] / 1000} kHz` : `${v[EQ_FREQ]} Hz`}, Q ${v[EQ_Q]}. ` +
    (v[EQ_Q] >= 4 ? 'Narrow Q is surgical — musical moves want it wide.' : 'Wide Q = a broad, musical move.'),
};
export const EqLabScreen = () => <FxLabScreen config={eqConfig} />;

// ──────────────────────────────────────────────────────── LAB 2 · Delay ──
const delayConfig: FxLabConfig = {
  labId: 'delay',
  fxId: FX.delay,
  title: 'DELAY LAB',
  subtitle: 'Echoes · Feedback · Ping-pong',
  intro:
    'A delay repeats the signal after a set time. The timeline below IS the echo pattern: ' +
    'spacing = delay time, shrinking height = feedback, sides = ping-pong.',
  exploreCaption: 'Use the CLICK source — every click spawns the echo pattern you see below.',
  sources: [srcClick(90), SRC_PINK, srcSine(220)],
  params: [
    {
      label: 'DELAY TIME', paramId: P.timeMs, lessonKey: 'delay_time',
      choices: [
        { label: '80 ms SLAP', value: 80 },
        { label: '150 ms', value: 150 },
        { label: '375 ms', value: 375 },
        { label: '500 ms', value: 500 },
      ],
      initial: 375,
    },
    {
      label: 'FEEDBACK', paramId: P.delayFeedback, lessonKey: 'feedback',
      choices: [0, 0.25, 0.5, 0.75].map((f) => ({ label: `${f * 100}%`, value: f })),
      initial: 0.5,
    },
    {
      label: 'MIX', paramId: P.delayMix, lessonKey: 'wet_dry',
      choices: [
        { label: '25%', value: 0.25 },
        { label: '50%', value: 0.5 },
        { label: '100% WET', value: 1.0 },
      ],
      initial: 0.5,
    },
    {
      label: 'PING-PONG', paramId: P.pingpong, lessonKey: 'ping_pong',
      choices: [
        { label: 'OFF', value: 0 },
        { label: 'ON (L↔R)', value: 1 },
      ],
      initial: 0,
    },
    {
      label: 'REPEAT DAMPING', paramId: P.dampHz, lessonKey: 'filtering',
      choices: [
        { label: 'DARK 2k', value: 2000 },
        { label: 'TAPE 6k', value: 6000 },
        { label: 'OFF 20k', value: 20000 },
      ],
      initial: 6000,
    },
  ],
  Hero: (v) => (
    <EchoTimelineGraph timeMs={v[P.timeMs]} feedback={v[P.delayFeedback]} mix={v[P.delayMix]} pingpong={v[P.pingpong] > 0.5} />
  ),
  heroBadge: 'ECHO PATTERN — ANALYTIC (spacing = time · decay = feedback)',
  heroCaption: (v) =>
    `${v[P.timeMs]} ms between repeats; each repeat is ${Math.round(v[P.delayFeedback] * 100)}% of the last. ` +
    (v[P.delayFeedback] >= 0.75 ? 'High feedback — approaching runaway.' : `Quarter-note at ${Math.round(60000 / v[P.timeMs])} BPM.`),
};
export const DelayLabScreen = () => <FxLabScreen config={delayConfig} />;

// ─────────────────────────────────────────────────────── LAB 3 · Reverb ──
const reverbConfig: FxLabConfig = {
  labId: 'reverb',
  fxId: FX.reverb,
  title: 'REVERB LAB',
  subtitle: 'RT60 · Pre-delay · Damping',
  intro:
    'Reverb is thousands of reflections blurring into a decaying wash. The graph below is the ' +
    'decay: RT60 is WHERE the slope crosses −60 dB — a time, not an amount.',
  exploreCaption: 'Click or burst sources make the decay audible as a tail after each hit.',
  sources: [srcClick(60), { label: 'BURST', gen: { mode: GEN_MODES.burst } }, SRC_PINK],
  params: [
    {
      label: 'RT60 (DECAY TIME)', paramId: P.rt60, lessonKey: 'decay',
      choices: [
        { label: '0.4 s BOOTH', value: 0.4 },
        { label: '0.8 s ROOM', value: 0.8 },
        { label: '1.5 s HALL', value: 1.5 },
        { label: '3 s CHURCH', value: 3 },
        { label: '6 s CAVERN', value: 6 },
      ],
      initial: 1.5,
    },
    {
      label: 'PRE-DELAY', paramId: P.preDelayMs, lessonKey: 'pre_delay',
      choices: [0, 20, 60].map((ms) => ({ label: `${ms} ms`, value: ms })),
      initial: 20,
    },
    {
      label: 'HF DAMPING', paramId: P.reverbDampHz, lessonKey: 'hf_damping',
      choices: [
        { label: 'DARK 2k', value: 2000 },
        { label: 'NATURAL 5.5k', value: 5500 },
        { label: 'BRIGHT 12k', value: 12000 },
      ],
      initial: 5500,
    },
    {
      label: 'MIX', paramId: P.reverbMix, lessonKey: 'mix',
      choices: [
        { label: '35%', value: 0.35 },
        { label: '70%', value: 0.7 },
        { label: '100% WET', value: 1.0 },
      ],
      initial: 0.35,
    },
  ],
  Hero: (v) => <DecayCurveGraph rt60={v[P.rt60]} preDelayMs={v[P.preDelayMs]} />,
  heroBadge: 'DECAY SLOPE — ANALYTIC (RT60 = time to fall 60 dB)',
  heroCaption: (v) =>
    `${v[P.preDelayMs]} ms pre-delay separates the dry hit from the wash, then the tail falls 60 dB in ${v[P.rt60]} s.` +
    (v[P.preDelayMs] === 0 ? ' No pre-delay glues the source to the tail.' : ''),
};
export const ReverbLabScreen = () => <FxLabScreen config={reverbConfig} />;

// ─────────────────────────────────────────── Mod trio hero (comb sweep) ──
function combSweepHero(centerMs: number, sweepMs: number, mix: number, fb: number) {
  const lo = Math.max(centerMs - sweepMs, 0.05);
  const hi = centerMs + sweepMs;
  return (
    <ResponseCurveGraph
      dbRange={16}
      curves={[
        { at: (f) => combResponseDb(lo, mix, fb, f), emphasis: 'ghost' },
        { at: (f) => combResponseDb(hi, mix, fb, f), emphasis: 'ghost' },
        { at: (f) => combResponseDb(centerMs, mix, fb, f), emphasis: 'main' },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────── LAB 4 · Chorus ──
const chorusConfig: FxLabConfig = {
  labId: 'chorus',
  fxId: FX.mod,
  title: 'CHORUS LAB',
  subtitle: 'Detuned voices · Thickening',
  intro:
    'Chorus mixes you with a slightly delayed, pitch-wobbling copy of yourself — like two ' +
    'players who can never be perfectly together. The long delay makes the comb notches so ' +
    'close they blur into shimmer instead of a jet.',
  exploreCaption: 'Solid amber = the comb right now; ghosts = where the LFO sweeps it.',
  sources: [srcSine(440), SRC_PINK],
  fixed: [{ paramId: P.modMode, value: 0 }],
  params: [
    {
      label: 'RATE', paramId: P.rateHz, lessonKey: 'rate',
      choices: [
        { label: '0.1 Hz', value: 0.1 },
        { label: '0.25 Hz', value: 0.25 },
        { label: '1 Hz', value: 1 },
        { label: '3 Hz SEASICK', value: 3 },
      ],
      initial: 0.25,
    },
    {
      label: 'DEPTH', paramId: P.depth, lessonKey: 'depth',
      choices: [
        { label: 'SUBTLE', value: 0.2 },
        { label: 'CLASSIC', value: 0.5 },
        { label: 'DEEP', value: 1.0 },
      ],
      initial: 0.5,
    },
    {
      label: 'VOICE DELAY', paramId: P.centerMs, lessonKey: 'delay',
      choices: [15, 20, 35].map((ms) => ({ label: `${ms} ms`, value: ms })),
      initial: 20,
    },
    {
      label: 'MIX', paramId: P.modMix, lessonKey: 'mix',
      choices: [
        { label: '30%', value: 0.3 },
        { label: '50%', value: 0.5 },
        { label: '100% = VIBRATO', value: 1.0 },
      ],
      initial: 0.5,
    },
  ],
  Hero: (v) => combSweepHero(v[P.centerMs], 6 * v[P.depth], v[P.modMix], 0),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    v[P.modMix] >= 1
      ? '100% wet removes the dry voice — nothing left to beat against: that is vibrato, not chorus.'
      : `~${v[P.centerMs]} ms voice → notches every ${Math.round(1000 / v[P.centerMs])} Hz — too fine to hear as a comb; you hear the BEATING instead.`,
};
export const ChorusLabScreen = () => <FxLabScreen config={chorusConfig} />;

// ────────────────────────────────────────────────────── LAB 5 · Flanger ──
const flangerConfig: FxLabConfig = {
  labId: 'flanger',
  fxId: FX.mod,
  title: 'FLANGER LAB',
  subtitle: 'Sweeping comb · The jet',
  intro:
    'A flanger is a SHORT delay summed with the dry signal: evenly spaced comb notches whose ' +
    'spacing is 1/delay. The LFO moves the delay, so every notch sweeps together — the jet.',
  exploreCaption: 'Pink noise makes the moving notches audible AND visible below.',
  sources: [SRC_PINK, SRC_WHITE],
  fixed: [{ paramId: P.modMode, value: 1 }],
  params: [
    {
      label: 'RATE', paramId: P.rateHz, lessonKey: 'rate',
      choices: [
        { label: '0.1 Hz', value: 0.1 },
        { label: '0.2 Hz JET', value: 0.2 },
        { label: '1 Hz', value: 1 },
        { label: '5 Hz WARBLE', value: 5 },
      ],
      initial: 0.2,
    },
    {
      label: 'DEPTH', paramId: P.depth, lessonKey: 'depth',
      choices: [
        { label: '30%', value: 0.3 },
        { label: '50%', value: 0.5 },
        { label: '90%', value: 0.9 },
      ],
      initial: 0.5,
    },
    {
      label: 'CENTER DELAY', paramId: P.centerMs, lessonKey: 'manual',
      choices: [
        { label: '0.5 ms', value: 0.5 },
        { label: '2 ms', value: 2 },
        { label: '5 ms', value: 5 },
      ],
      initial: 2,
    },
    {
      label: 'FEEDBACK', paramId: P.modFeedback, lessonKey: 'feedback',
      choices: [
        { label: '0%', value: 0 },
        { label: '40%', value: 0.4 },
        { label: '70% METALLIC', value: 0.7 },
        { label: '−70% HOLLOW', value: -0.7 },
      ],
      initial: 0.4,
    },
    {
      label: 'MIX', paramId: P.modMix, lessonKey: 'mix',
      choices: [
        { label: '50% DEEPEST', value: 0.5 },
        { label: '100%', value: 1.0 },
      ],
      initial: 0.5,
    },
  ],
  Hero: (v) => combSweepHero(v[P.centerMs], v[P.centerMs] * 0.85 * v[P.depth], v[P.modMix], v[P.modFeedback]),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    `Notches every ${Math.round(1 / (v[P.centerMs] / 1000))} Hz (spacing = 1/delay), sweeping between the ghosts. ` +
    (Math.abs(v[P.modFeedback]) >= 0.7 ? 'High feedback sharpens the notches into rings.' : 'Evenly spaced — compare with the phaser.'),
};
export const FlangerLabScreen = () => <FxLabScreen config={flangerConfig} />;

// ─────────────────────────────────────────────────────── LAB 6 · Phaser ──
const phaserConfig: FxLabConfig = {
  labId: 'phaser',
  fxId: FX.mod,
  title: 'PHASER LAB',
  subtitle: 'All-pass stages · Uneven notches',
  intro:
    'A phaser shifts PHASE, not time: all-pass stages create a few notches where the shifted ' +
    'copy cancels the dry. Compare the sparse, UNEVEN notches below with the flanger’s even ' +
    'comb — that difference is the whole lesson.',
  exploreCaption: 'Count the notches: ≈ stages ÷ 2, unevenly spaced.',
  sources: [SRC_PINK, SRC_WHITE],
  fixed: [{ paramId: P.modMode, value: 2 }],
  params: [
    {
      label: 'STAGES', paramId: P.stages, lessonKey: 'stages',
      choices: [2, 4, 6, 8].map((s) => ({ label: `${s}`, value: s })),
      initial: 4,
    },
    {
      label: 'RATE', paramId: P.rateHz, lessonKey: 'rate',
      choices: [
        { label: '0.1 Hz', value: 0.1 },
        { label: '0.3 Hz', value: 0.3 },
        { label: '1 Hz', value: 1 },
        { label: '3 Hz', value: 3 },
      ],
      initial: 0.3,
    },
    {
      label: 'CENTER', paramId: P.centerHz, lessonKey: 'center',
      choices: [
        { label: '400 Hz', value: 400 },
        { label: '1 kHz', value: 1000 },
        { label: '2 kHz', value: 2000 },
      ],
      initial: 1000,
    },
    {
      label: 'DEPTH (SWEEP)', paramId: P.depth, lessonKey: 'depth',
      choices: [
        { label: 'STATIC', value: 0 },
        { label: '50%', value: 0.5 },
        { label: '100%', value: 1.0 },
      ],
      initial: 0.5,
    },
    {
      label: 'RESONANCE', paramId: P.modFeedback, lessonKey: 'feedback',
      choices: [
        { label: '0%', value: 0 },
        { label: '30%', value: 0.3 },
        { label: '60%', value: 0.6 },
      ],
      initial: 0.3,
    },
  ],
  Hero: (v) => (
    <ResponseCurveGraph
      dbRange={16}
      curves={[
        { at: (f) => phaserResponseDb(v[P.centerHz] * Math.pow(2, -2 * v[P.depth]), v[P.stages], 0.5, f), emphasis: 'ghost' },
        { at: (f) => phaserResponseDb(v[P.centerHz] * Math.pow(2, 2 * v[P.depth]), v[P.stages], 0.5, f), emphasis: 'ghost' },
        { at: (f) => phaserResponseDb(v[P.centerHz], v[P.stages], 0.5, f), emphasis: 'main' },
      ]}
    />
  ),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    `${v[P.stages]} stages ≈ ${Math.floor(v[P.stages] / 2)} notches, UNEVENLY spaced (set by phase, not by a delay time) — a phaser is not a delay.`,
};
export const PhaserLabScreen = () => <FxLabScreen config={phaserConfig} />;

// ────────────────────────────────────────────────── LAB 7 · Compression ──
const compConfig: FxLabConfig = {
  labId: 'compression',
  fxId: FX.comp,
  title: 'COMPRESSION LAB',
  subtitle: 'Threshold · Ratio · Attack · Release',
  intro:
    'Above the threshold, gain is reduced by the ratio — the bend in the transfer curve below. ' +
    'The GR meter is LIVE: it shows the real gain reduction the engine is applying right now.',
  exploreCaption: 'Push the source over the threshold and watch measured GR appear.',
  sources: [srcSine(440), SRC_PINK, srcClick(120)],
  params: [
    {
      label: 'THRESHOLD', paramId: P.thresholdDb, lessonKey: 'threshold',
      choices: [-40, -30, -20, -10].map((t) => ({ label: `${t} dB`, value: t })),
      initial: -30,
    },
    {
      label: 'RATIO', paramId: P.ratio, lessonKey: 'ratio',
      choices: [
        { label: '2:1 GLUE', value: 2 },
        { label: '4:1', value: 4 },
        { label: '8:1', value: 8 },
        { label: '20:1 LIMIT', value: 20 },
      ],
      initial: 4,
    },
    {
      label: 'ATTACK', paramId: P.attackMs, lessonKey: 'attack',
      choices: [
        { label: '0.5 ms FAST', value: 0.5 },
        { label: '5 ms', value: 5 },
        { label: '25 ms PUNCH', value: 25 },
        { label: '100 ms', value: 100 },
      ],
      initial: 5,
    },
    {
      label: 'RELEASE', paramId: P.releaseMs, lessonKey: 'release',
      choices: [
        { label: '30 ms', value: 30 },
        { label: '120 ms', value: 120 },
        { label: '500 ms', value: 500 },
      ],
      initial: 120,
    },
    {
      label: 'MAKEUP', paramId: P.makeupDb, lessonKey: 'makeup_gain',
      choices: [
        { label: '0 dB', value: 0 },
        { label: '+6 dB', value: 6 },
      ],
      initial: 0,
    },
  ],
  Hero: (v) => (
    <TransferCurveGraph mode="compressor" thresholdDb={v[P.thresholdDb]} ratio={v[P.ratio]} makeupDb={v[P.makeupDb]} />
  ),
  heroBadge: 'TRANSFER CURVE — ANALYTIC · GR METER — LIVE',
  heroCaption: (v) =>
    `Above ${v[P.thresholdDb]} dB, every ${v[P.ratio]} dB in becomes 1 dB out. The source peaks at −20 dBFS — ` +
    (v[P.thresholdDb] < -20 ? 'over the threshold, so it compresses.' : 'below the threshold, so nothing happens (drop the threshold).'),
  pollGr: 'comp',
};
export const CompressionLabScreen = () => <FxLabScreen config={compConfig} />;

// ───────────────────────────────────────────────────────── LAB 8 · Gate ──
const gateConfig: FxLabConfig = {
  labId: 'gate',
  fxId: FX.gate,
  title: 'GATE LAB',
  subtitle: 'Threshold · Hold · Release · Chatter',
  intro:
    'A gate mutes what falls BELOW the threshold — the cliff in the curve below. With the ' +
    'click source you hear it open on every hit and close in the silence between.',
  exploreCaption: 'CLICK source: the gate opens per hit — tune Hold/Release until it stops chattering.',
  sources: [srcClick(90), SRC_PINK],
  params: [
    {
      label: 'THRESHOLD', paramId: P.thresholdDb, lessonKey: 'threshold',
      choices: [-50, -35, -20].map((t) => ({ label: `${t} dB`, value: t })),
      initial: -35,
    },
    {
      label: 'RANGE (FLOOR)', paramId: P.rangeDb, lessonKey: 'range',
      choices: [
        { label: '−20 GENTLE', value: -20 },
        { label: '−40', value: -40 },
        { label: '−70 SILENCE', value: -70 },
      ],
      initial: -40,
    },
    {
      label: 'HOLD', paramId: P.holdMs, lessonKey: 'hold',
      choices: [0, 10, 100].map((ms) => ({ label: `${ms} ms`, value: ms })),
      initial: 10,
    },
    {
      label: 'RELEASE', paramId: P.releaseMs, lessonKey: 'release',
      choices: [
        { label: '20 ms CHATTER', value: 20 },
        { label: '100 ms', value: 100 },
        { label: '500 ms', value: 500 },
      ],
      initial: 100,
    },
  ],
  Hero: (v) => <TransferCurveGraph mode="gate" thresholdDb={v[P.thresholdDb]} rangeDb={v[P.rangeDb]} />,
  heroBadge: 'TRANSFER CURVE — ANALYTIC · GR METER — LIVE',
  heroCaption: (v) =>
    `Below ${v[P.thresholdDb]} dB the output drops ${Math.abs(v[P.rangeDb])} dB toward the floor. ` +
    (v[P.rangeDb] <= -70 ? 'Full silence is abrupt — a partial floor usually sounds more natural.' : 'A partial floor keeps a little ambience.'),
  pollGr: 'gate',
};
export const GateLabScreen = () => <FxLabScreen config={gateConfig} />;

// ────────────────────────────────────────────────────── LAB 9 · Limiter ──
const limiterConfig: FxLabConfig = {
  labId: 'limiter',
  fxId: FX.limiter,
  title: 'LIMITER LAB',
  subtitle: 'Brickwall · Ceiling · GR',
  intro:
    'A limiter is a compressor with an infinite ratio: NOTHING passes the ceiling — the flat ' +
    'shelf in the curve. The live GR meter shows exactly how hard you are hitting it.',
  exploreCaption: 'The source peaks at −20 dBFS — ceilings below that engage the brickwall.',
  sources: [srcSine(440), SRC_PINK],
  params: [
    {
      label: 'CEILING', paramId: P.ceilingDb, lessonKey: 'ceiling',
      choices: [
        { label: '−15 dB', value: -15 },
        { label: '−25 dB', value: -25 },
        { label: '−35 dB', value: -35 },
        { label: '−45 dB SQUASH', value: -45 },
      ],
      initial: -25,
    },
    {
      label: 'RELEASE', paramId: P.releaseMs, lessonKey: 'release',
      choices: [
        { label: '30 ms', value: 30 },
        { label: '120 ms', value: 120 },
        { label: '500 ms', value: 500 },
      ],
      initial: 120,
    },
  ],
  Hero: (v) => <TransferCurveGraph mode="limiter" thresholdDb={v[P.ceilingDb]} ceilingDb={v[P.ceilingDb]} />,
  heroBadge: 'TRANSFER CURVE — ANALYTIC · GR METER — LIVE',
  heroCaption: (v) =>
    `Output can NEVER exceed ${v[P.ceilingDb]} dB. Source at −20 dBFS → ${
      v[P.ceilingDb] < -20 ? `${Math.abs(v[P.ceilingDb] + 20)} dB of constant gain reduction (watch the meter)` : 'under the ceiling, untouched'
    }.`,
  pollGr: 'limiter',
  note: 'True-peak/inter-sample detection and lookahead are covered in the lesson (ⓘ) — this v1 limiter is a fast peak limiter.',
};
export const LimiterLabScreen = () => <FxLabScreen config={limiterConfig} />;

// ─────────────────────────────────────────────────── LAB 10 · Distortion ──
const distConfig: FxLabConfig = {
  labId: 'distortion',
  fxId: FX.dist,
  title: 'DISTORTION LAB',
  subtitle: 'Clipping · Odd vs Even · Aliasing',
  intro:
    'Distortion reshapes the wave — and the SHAPE decides the harmonics. Symmetric clipping ' +
    '(same on top and bottom) makes only ODD harmonics; the tube’s asymmetry adds EVEN ones. ' +
    'Watch the wave change below.',
  exploreCaption: 'Sine source: what you hear as “grit” is the new harmonic series of the reshaped wave.',
  sources: [srcSine(220), SRC_PINK],
  params: [
    {
      label: 'TYPE', paramId: P.distType, lessonKey: 'hard_clip',
      choices: [
        { label: 'HARD CLIP', value: 0 },
        { label: 'SOFT (TANH)', value: 1 },
        { label: 'TUBE (ASYM)', value: 2 },
      ],
      initial: 0,
    },
    {
      label: 'DRIVE', paramId: P.driveDb, lessonKey: 'saturation',
      choices: [6, 12, 24, 36].map((d) => ({ label: `+${d} dB`, value: d })),
      initial: 12,
    },
    {
      label: 'OVERSAMPLING', paramId: P.oversample, lessonKey: 'oversampling',
      choices: [
        { label: 'ON (CLEAN)', value: 1 },
        { label: 'OFF — HEAR ALIASING', value: 0 },
      ],
      initial: 1,
    },
    {
      label: 'MIX', paramId: P.distMix, lessonKey: 'mix',
      choices: [
        { label: '100%', value: 1 },
        { label: '50% PARALLEL', value: 0.5 },
      ],
      initial: 1,
    },
  ],
  Hero: (v) => (
    <WaveshapeGraph type={v[P.distType] === 0 ? 'hard' : v[P.distType] === 1 ? 'soft' : 'tube'} driveDb={v[P.driveDb]} />
  ),
  heroBadge: 'WAVESHAPE — ANALYTIC (input dim · output amber, shape-normalized)',
  heroCaption: (v) =>
    v[P.distType] === 2
      ? 'Top and bottom clip DIFFERENTLY (asymmetric) → even harmonics — the “warm” tube signature.'
      : 'Top and bottom clip the SAME (symmetric) → odd harmonics only — hollow/harsh.',
  note: 'Bitcrush and sample-rate reduction are in the engine (hear them via the lesson’s theory); their quantization visual lands with the analyzer view.',
};
export const DistortionLabScreen = () => <FxLabScreen config={distConfig} />;

// ─────────────────────────────────────────────────────── LAB 12 · Phase ──
const PHASE_INV = P.invertR;
const PHASE_DLY = P.delayRms;
const phaseConfig: FxLabConfig = {
  labId: 'phase',
  fxId: FX.stereo,
  title: 'PHASE LAB',
  subtitle: 'Polarity vs Phase · Cancellation',
  intro:
    'POLARITY flips the whole wave (180° at every frequency). PHASE is a frequency-dependent ' +
    'time shift. They are not the same — the Lissajous and correlation below make the ' +
    'difference visible; mono-fold makes it audible.',
  exploreCaption: 'Sine + INVERT + MONO-FOLD = silence. That is total cancellation — the core demo.',
  sources: [srcSine(440), SRC_PINK],
  fixed: [{ paramId: P.widthPct, value: 100 }],
  params: [
    {
      label: 'POLARITY (R)', paramId: PHASE_INV, lessonKey: 'invert_polarity',
      choices: [
        { label: 'NORMAL', value: 0 },
        { label: 'INVERTED Ø', value: 1 },
      ],
      initial: 0,
    },
    {
      label: 'DELAY R (PHASE)', paramId: PHASE_DLY, lessonKey: 'delay_one_channel',
      choices: [
        { label: '0 ms', value: 0 },
        { label: '0.5 ms', value: 0.5 },
        { label: '2 ms', value: 2 },
        { label: '10 ms', value: 10 },
      ],
      initial: 0,
    },
    {
      label: 'MONO-FOLD', paramId: P.monoFold, lessonKey: 'mono_fold',
      choices: [
        { label: 'STEREO', value: 0 },
        { label: 'MONO (L+R)', value: 1 },
      ],
      initial: 0,
    },
  ],
  Hero: (v) => <LissajousGraph widthPct={100} invertR={v[PHASE_INV] > 0.5} delayRms={v[PHASE_DLY]} toneHz={440} />,
  heroBadge: 'LISSAJOUS + CORRELATION — ANALYTIC (440 Hz model)',
  heroCaption: (v) =>
    v[PHASE_INV] > 0.5
      ? 'Correlation −1: fold to mono and it CANCELS. A polarity flip is 180° at ALL frequencies.'
      : v[PHASE_DLY] > 0
        ? `A ${v[PHASE_DLY]} ms delay shifts phase MORE at higher frequencies — in mono that combs, and no polarity flip can fix it.`
        : 'Identical channels: a vertical line, correlation +1.',
};
export const PhaseLabScreen = () => <FxLabScreen config={phaseConfig} />;

// ────────────────────────────────────────────────────── LAB 15 · Stereo ──
const stereoConfig: FxLabConfig = {
  labId: 'stereo',
  fxId: FX.stereo,
  title: 'STEREO IMAGING LAB',
  subtitle: 'Width · M/S · Mono safety',
  intro:
    'Width scales the SIDE (difference) signal against the MID. Wider sounds bigger — until ' +
    'you fold to mono and the sides vanish. The correlation meter is the safety gauge.',
  exploreCaption: 'Widen, then hit MONO-FOLD: what survives is what a mono listener gets.',
  sources: [SRC_PINK, srcSine(440)],
  params: [
    {
      label: 'WIDTH', paramId: P.widthPct, lessonKey: 'width',
      choices: [
        { label: '0% MONO', value: 0 },
        { label: '50%', value: 50 },
        { label: '100%', value: 100 },
        { label: '200% OVER', value: 200 },
      ],
      initial: 100,
    },
    {
      label: 'PAN', paramId: P.pan, lessonKey: 'pan',
      choices: [
        { label: 'L', value: -1 },
        { label: 'CENTER', value: 0 },
        { label: 'R', value: 1 },
      ],
      initial: 0,
    },
    {
      label: 'BASS-MONO', paramId: P.bassMonoHz, lessonKey: 'bass_mono',
      choices: [
        { label: 'OFF', value: 0 },
        { label: '120 Hz', value: 120 },
      ],
      initial: 0,
    },
    {
      label: 'MONO-FOLD', paramId: P.monoFold, lessonKey: 'mono_fold',
      choices: [
        { label: 'STEREO', value: 0 },
        { label: 'MONO CHECK', value: 1 },
      ],
      initial: 0,
    },
  ],
  Hero: (v) => <LissajousGraph widthPct={v[P.widthPct]} invertR={false} delayRms={0} toneHz={440} />,
  heroBadge: 'LISSAJOUS + CORRELATION — ANALYTIC (440 Hz model)',
  heroCaption: (v) =>
    v[P.monoFold] > 0.5
      ? 'MONO CHECK: everything wide is gone — only the MID survives the fold.'
      : v[P.widthPct] > 100
        ? 'Past 100% the SIDE outweighs the MID — huge on headphones, hollow in mono. Watch the correlation.'
        : v[P.widthPct] === 0
          ? 'Width 0 = pure MID: a vertical line, perfectly mono-safe.'
          : 'The classic trade: width vs mono safety.',
};
export const StereoLabScreen = () => <FxLabScreen config={stereoConfig} />;
