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
 *
 * ANIMATION (visual standards 2026-07-29): every config also authors `anim` —
 * the mapping from the CURRENT param values to its fxAnim signal-flow model
 * (the Skia animated hero: input wave → effect stage → transformed output).
 * The mapping hands over the SAME values that drive the DSP; the per-effect
 * transformation math lives in fxAnim (mirroring fxViz). On pre-Skia clients
 * the static heroes below render alone, exactly as before.
 *
 * RACK UNIT (2026-08-23): every config now also declares its faceplate —
 * exactly ONE param carries `fader` (the continuous teaching parameter the
 * lane pre-binds; range spans the taught chips), `bezel` names the legend
 * cells riding the display, `short` compacts dock-key labels, and configs
 * with >4 params fold 2–3 interacting ones into a `dockGroups` tray so the
 * dock stays ≤5 keys.
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
import type { CheckSpec } from './foundations/bits';
import { FxLabScreen, type FxLabConfig } from './FxLabScreen';

const P = FX_PARAM;
const ANALYTIC = 'DESIGNED RESPONSE — ANALYTIC, NOT A MEASUREMENT';

// Shared sources (`short` = the compact dock-key value).
const SRC_PINK = { label: 'PINK NOISE', short: 'PINK', gen: { mode: GEN_MODES.pink }, blurb: 'Steady broadband noise, equal energy per octave — the best source for HEARING a tone change.' };
const SRC_WHITE = { label: 'WHITE NOISE', short: 'WHITE', gen: { mode: GEN_MODES.white }, blurb: 'Equal energy per Hz — brighter than pink. The top octaves dominate, so high-end changes leap out.' };
const srcSine = (hz: number) => ({ label: `SINE ${hz} Hz`, short: `${hz} Hz`, gen: { mode: GEN_MODES.sine, frequency: hz } });
const srcClick = (bpm: number) => ({ label: `CLICK ${bpm}`, short: `${bpm} BPM`, gen: { mode: GEN_MODES.click, clickBpm: bpm }, blurb: 'A dry click with silence between hits — echoes, tails and pumping have nowhere to hide.' });

// Retrieval checks (learning pass 2026-08-31): the FX fleet was the app's
// sole zero-retrieval holdout — knobs and prose, never "prove you saw it".
// Two checks per lab, drawn from each lab's own captions and COMMON MISTAKES.
// All NEW COPY — owner review.

// ─────────────────────────────────────────────────────────── LAB 1 · EQ ──
const EQ_TYPE = P.eqBand(0, 'type');
const EQ_FREQ = P.eqBand(0, 'freq');
const EQ_Q = P.eqBand(0, 'q');
const EQ_GAIN = P.eqBand(0, 'gain');

/** The band the current param values describe — shared by the static hero
 *  and the animated hero so both ALWAYS show the same filter. */
function eqBandOf(v: Record<number, number>): EqBandSpec {
  return {
    type: v[EQ_TYPE] === EQ_BAND_TYPES.peak ? 'peak'
      : v[EQ_TYPE] === EQ_BAND_TYPES.lowShelf ? 'lowShelf'
      : v[EQ_TYPE] === EQ_BAND_TYPES.highShelf ? 'highShelf'
      : v[EQ_TYPE] === EQ_BAND_TYPES.lowPass ? 'lowPass' : 'highPass',
    freq: v[EQ_FREQ], q: v[EQ_Q], gainDb: v[EQ_GAIN],
  };
}

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
      // The continuous teaching fader: sweep the bell across the spectrum and
      // watch the curve (and the audio) move with it.
      label: 'FREQUENCY', short: 'FREQ', paramId: EQ_FREQ, lessonKey: 'frequency',
      choices: [100, 250, 500, 1000, 2000, 4000, 8000].map((f) => ({ label: f >= 1000 ? `${f / 1000}k` : `${f}`, value: f })),
      initial: 1000,
      fader: {
        min: 100, max: 8000, log: true, snap: Math.round,
        format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} kHz` : `${Math.round(v)} Hz`),
        formatShort: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`),
      },
    },
    {
      label: 'FILTER TYPE', short: 'TYPE', paramId: EQ_TYPE, lessonKey: 'filter_type',
      choices: [
        { label: 'PEAK (BELL)', value: EQ_BAND_TYPES.peak, blurb: 'Boost or cut a BAND around the frequency, leaving both sides alone — the surgical shape.' },
        { label: 'LOW SHELF', value: EQ_BAND_TYPES.lowShelf, blurb: 'Everything BELOW the frequency rises or falls together — a broad tilt of the low end.' },
        { label: 'HIGH SHELF', value: EQ_BAND_TYPES.highShelf, blurb: 'Everything ABOVE the frequency rises or falls together — air and sheen live here.' },
        { label: 'HIGH-PASS', value: EQ_BAND_TYPES.highPass, blurb: 'REMOVES everything below the frequency. Not a cut — a cliff. The rumble-and-mud eraser.' },
        { label: 'LOW-PASS', value: EQ_BAND_TYPES.lowPass, blurb: 'REMOVES everything above the frequency — darkness on demand; also what "telephone" sounds are made of.' },
      ],
      initial: EQ_BAND_TYPES.peak,
    },
    {
      label: 'GAIN', paramId: EQ_GAIN, lessonKey: 'gain',
      choices: [-12, -6, 0, 6, 12].map((g) => ({ label: `${g > 0 ? '+' : ''}${g} dB`, value: g })),
      initial: 6,
    },
    {
      label: 'Q (BANDWIDTH)', short: 'Q', paramId: EQ_Q, lessonKey: 'q',
      choices: [
        { label: '0.7 WIDE', value: 0.7 },
        { label: '1.4', value: 1.4 },
        { label: '4', value: 4 },
        { label: '8 NARROW', value: 8 },
      ],
      initial: 1.4,
    },
  ],
  bezel: [
    { k: 'TYPE', paramId: EQ_TYPE },
    { k: 'FREQ', paramId: EQ_FREQ },
    { k: 'GAIN', paramId: EQ_GAIN },
    { k: 'Q', paramId: EQ_Q },
  ],
  Hero: (v) => {
    const band = eqBandOf(v);
    return (
      <ResponseCurveGraph
        curves={[
          { at: () => 0, emphasis: 'ref' },
          { at: (f) => eqResponseDb([band], f), emphasis: 'main' },
        ]}
      />
    );
  },
  anim: (v) => ({ kind: 'eq', bands: [eqBandOf(v)] }),
  heroBadge: ANALYTIC,
  // Pass filters ignore GAIN (and HP ignores Q) — the caption used to keep
  // printing both anyway (fix 2026-08-31). NEW COPY — owner review.
  heroCaption: (v) => {
    const f = v[EQ_FREQ] >= 1000 ? `${v[EQ_FREQ] / 1000} kHz` : `${v[EQ_FREQ]} Hz`;
    if (v[EQ_TYPE] === EQ_BAND_TYPES.highPass || v[EQ_TYPE] === EQ_BAND_TYPES.lowPass) {
      return `${v[EQ_TYPE] === EQ_BAND_TYPES.highPass ? 'High-pass' : 'Low-pass'} at ${f}. GAIN and Q don't apply to a pass filter — the slope is fixed; only the cutoff moves.`;
    }
    return (
      `${v[EQ_GAIN] > 0 ? '+' : ''}${v[EQ_GAIN]} dB at ${f}, Q ${v[EQ_Q]}. ` +
      (v[EQ_Q] >= 4 ? 'Narrow Q is surgical — musical moves want it wide.' : 'Wide Q = a broad, musical move.')
    );
  },
  checks: [
    {
      question: 'You need to remove 60 Hz hum without touching the bass around it. Which move?',
      options: [
        'A narrow high-Q cut at 60 Hz',
        'A low shelf cut at 100 Hz',
        'A high-pass filter at 200 Hz',
      ],
      correctIdx: 0,
      reveal:
        'A narrow (high-Q) cut removes just the hum frequency and leaves the neighboring bass alone. The shelf and the high-pass both take real bass with them.',
      wrongHint: 'Set Q to 8 NARROW and watch how little of the curve moves.',
    },
    {
      question: 'A HIGH-PASS filter is set at 250 Hz. What does the GAIN control do to it?',
      options: [
        'Sets how deep the cut below 250 Hz is',
        'Nothing — a pass filter has a fixed slope; only the cutoff moves',
        'Boosts everything above 250 Hz',
      ],
      correctIdx: 1,
      reveal:
        'Pass filters REMOVE everything past the cutoff at a fixed slope — there is no amount to set. GAIN and Q belong to bells and shelves.',
      wrongHint: 'Switch to HIGH-PASS and tap through the GAIN values — watch the curve.',
    },
  ],
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
      label: 'DELAY TIME', short: 'TIME', paramId: P.timeMs, lessonKey: 'delay_time',
      choices: [
        { label: '80 ms SLAP', value: 80 },
        { label: '150 ms', value: 150 },
        { label: '375 ms', value: 375 },
        { label: '500 ms', value: 500 },
      ],
      initial: 375,
      // The teaching fader: ride the time and hear/see the spacing stretch.
      fader: { min: 80, max: 500, log: true, snap: Math.round, format: (v) => `${Math.round(v)} ms` },
    },
    {
      label: 'FEEDBACK', short: 'FDBK', paramId: P.delayFeedback, lessonKey: 'feedback',
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
        { label: 'ON (L↔︎R)', value: 1 },
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
  bezel: [
    { k: 'TIME', paramId: P.timeMs },
    { k: 'FDBK', paramId: P.delayFeedback },
    { k: 'MIX', paramId: P.delayMix },
  ],
  // Ping-pong + damping share one tray (the repeats' character) — dock ≤5.
  dockGroups: [
    {
      id: 'color', label: 'COLOR', paramIds: [P.pingpong, P.dampHz], lessonKey: 'filtering',
      valueLabel: (v) =>
        `${v[P.pingpong] > 0.5 ? 'PP·' : ''}${v[P.dampHz] >= 20000 ? 'OFF' : `${v[P.dampHz] / 1000}k`}`,
    },
  ],
  Hero: (v) => (
    <EchoTimelineGraph timeMs={v[P.timeMs]} feedback={v[P.delayFeedback]} mix={v[P.delayMix]} pingpong={v[P.pingpong] > 0.5} />
  ),
  anim: (v) => ({
    kind: 'delay',
    timeMs: v[P.timeMs],
    feedback: v[P.delayFeedback],
    mix: v[P.delayMix],
    pingpong: v[P.pingpong] > 0.5,
  }),
  heroBadge: 'ECHO PATTERN — ANALYTIC (spacing = time · decay = feedback)',
  heroCaption: (v) =>
    `${v[P.timeMs]} ms between repeats; each repeat is ${Math.round(v[P.delayFeedback] * 100)}% of the last. ` +
    (v[P.delayFeedback] >= 0.75 ? 'High feedback — approaching runaway.' : `That spacing = a quarter-note at ${Math.round(60000 / v[P.timeMs])} BPM — match the delay to the song's tempo and repeats land ON the beat.`),
  checks: [
    {
      question: 'You raise FEEDBACK from 25% to 75%. What changes?',
      options: [
        'The echoes get closer together',
        'Each echo is louder relative to the last, so the trail lasts far longer',
        'The first echo arrives sooner',
      ],
      correctIdx: 1,
      reveal:
        'Feedback re-feeds the output into the delay: each repeat is 75% of the one before, so the trail decays slowly. Spacing never changes — that is TIME, not feedback.',
      wrongHint: 'Watch the echo heights on the timeline, not their positions.',
    },
    {
      question: 'What separates a delay from a reverb?',
      options: [
        'Delay is distinct repeats; reverb is thousands of reflections blurred into a wash',
        'Delay works on drums, reverb on vocals',
        'Reverb is just a delay with more feedback',
      ],
      correctIdx: 0,
      reveal:
        'A delay hands back discrete copies you can count. Reverb is so many reflections so close together they fuse into a continuous decaying wash — related physics, different perception.',
      wrongHint: 'Play the click here, then in the Reverb lab — count what you hear.',
    },
  ],
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
      label: 'RT60 (DECAY TIME)', short: 'RT60', paramId: P.rt60, lessonKey: 'decay',
      choices: [
        { label: '0.4 s BOOTH', value: 0.4 },
        { label: '0.8 s ROOM', value: 0.8 },
        { label: '1.5 s HALL', value: 1.5 },
        { label: '3 s CHURCH', value: 3 },
        { label: '6 s CAVERN', value: 6 },
      ],
      initial: 1.5,
      // The teaching fader: booth → cavern on one log sweep, tail growing live.
      fader: { min: 0.4, max: 6, log: true, snap: (v) => Math.round(v * 10) / 10, format: (v) => `${v.toFixed(1)} s` },
    },
    {
      label: 'PRE-DELAY', short: 'PRE-DLY', paramId: P.preDelayMs, lessonKey: 'pre_delay',
      choices: [0, 20, 60].map((ms) => ({ label: `${ms} ms`, value: ms })),
      initial: 20,
    },
    {
      label: 'HF DAMPING', short: 'DAMP', paramId: P.reverbDampHz, lessonKey: 'hf_damping',
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
  bezel: [
    { k: 'RT60', paramId: P.rt60 },
    { k: 'PRE', paramId: P.preDelayMs },
    { k: 'MIX', paramId: P.reverbMix },
  ],
  Hero: (v) => <DecayCurveGraph rt60={v[P.rt60]} preDelayMs={v[P.preDelayMs]} />,
  anim: (v) => ({ kind: 'reverb', rt60: v[P.rt60], preDelayMs: v[P.preDelayMs], mix: v[P.reverbMix] }),
  heroBadge: 'DECAY SLOPE — ANALYTIC (RT60 = time to fall 60 dB)',
  heroCaption: (v) =>
    `${v[P.preDelayMs]} ms pre-delay separates the dry hit from the wash, then the tail falls 60 dB in ${v[P.rt60]} s.` +
    (v[P.preDelayMs] === 0 ? ' No pre-delay glues the source to the tail.' : ''),
  checks: [
    {
      question: 'RT60 = 2.0 s means…',
      options: [
        'The reverb is twice as loud as the dry signal',
        'The tail takes 2 seconds to fall 60 dB',
        '2 seconds pass before the reverb starts',
      ],
      correctIdx: 1,
      reveal:
        'RT60 is a TIME: how long the wash takes to decay 60 dB. It says nothing about how loud the reverb is (that is mix) or when it starts (that is pre-delay).',
      wrongHint: 'Look at the decay graph — RT60 is WHERE the slope crosses −60 dB.',
    },
    {
      question: 'A vocal drowns in its own reverb. Which control keeps the wash but pulls the voice forward?',
      options: [
        'Longer RT60',
        'PRE-DELAY — a gap before the wash starts, so the dry word lands first',
        'More high-frequency damping',
      ],
      correctIdx: 1,
      reveal:
        'Pre-delay separates the dry sound from its reverb in time — the consonants land clean before the wash arrives. Same amount of reverb, more clarity.',
      wrongHint: 'Raise PRE-DELAY and watch the gap open between the hit and the tail.',
    },
  ],
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
  exploreCaption: 'Solid amber = the comb right now; ghosts = where the LFO sweeps it. Drag CENTER to sweep the comb by hand.',
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
      // The teaching fader: lazy shimmer → seasick on one log sweep.
      fader: {
        min: 0.1, max: 3, log: true, snap: (v) => Math.round(v * 100) / 100,
        format: (v) => `${v.toFixed(2)} Hz`, formatShort: (v) => `${v.toFixed(2)}Hz`,
      },
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
      label: 'VOICE DELAY', short: 'DELAY', paramId: P.centerMs, lessonKey: 'delay',
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
  bezel: [
    { k: 'RATE', paramId: P.rateHz },
    { k: 'DEPTH', paramId: P.depth },
    { k: 'MIX', paramId: P.modMix },
  ],
  Hero: (v) => combSweepHero(v[P.centerMs], 6 * v[P.depth], v[P.modMix], 0),
  anim: (v) => ({
    kind: 'mod',
    flavor: 'chorus',
    rateHz: v[P.rateHz],
    depth: v[P.depth],
    centerMs: v[P.centerMs],
    mix: v[P.modMix],
    feedback: 0,
  }),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    v[P.modMix] >= 1
      ? '100% wet removes the dry voice — nothing left to beat against: that is vibrato, not chorus.'
      : `~${v[P.centerMs]} ms voice → notches every ${Math.round(1000 / v[P.centerMs])} Hz — too fine to hear as a comb; you hear the BEATING instead.`,
  checks: [
    {
      question: 'At 100% WET the chorus stops sounding like a chorus. Why?',
      options: [
        'The effect is bypassed at full wet',
        'With no dry voice left to beat against, only the wobbling copy remains — that is vibrato',
        'Full wet doubles the volume until it distorts',
      ],
      correctIdx: 1,
      reveal:
        'Chorus IS the interference between the steady dry voice and the detuned copy. Remove the dry voice and nothing is left to shimmer against — just one wobbling pitch: vibrato.',
      wrongHint: 'Tap MIX to 100% and read the caption under the display.',
    },
    {
      question: 'What actually creates the chorus effect?',
      options: [
        'A short delayed copy whose delay is slowly modulated, drifting against the dry signal',
        'Two copies panned hard left and right',
        'A bank of narrow EQ boosts',
      ],
      correctIdx: 0,
      reveal:
        'The copy sits a few tens of ms behind and its timing drifts — like two players who can never be perfectly together. The drift IS the shimmer.',
      wrongHint: 'Watch the ghost copy slide against the dry wave on the display.',
    },
  ],
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
      // The teaching fader FIRST: dragging the center delay by hand IS the
      // original tape flange — every notch slides together as you ride it.
      label: 'CENTER DELAY', short: 'CENTER', paramId: P.centerMs, lessonKey: 'manual',
      choices: [
        { label: '0.5 ms', value: 0.5 },
        { label: '2 ms', value: 2 },
        { label: '5 ms', value: 5 },
      ],
      initial: 2,
      fader: { min: 0.5, max: 5, log: true, snap: (v) => Math.round(v * 10) / 10, format: (v) => `${v} ms` },
    },
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
      label: 'FEEDBACK', short: 'FDBK', paramId: P.modFeedback, lessonKey: 'feedback',
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
  bezel: [
    { k: 'CENTER', paramId: P.centerMs },
    { k: 'RATE', paramId: P.rateHz },
    { k: 'FDBK', paramId: P.modFeedback },
  ],
  // The LFO pair shares one tray (rate × depth = the sweep) — dock ≤5.
  dockGroups: [
    {
      id: 'sweep', label: 'SWEEP', paramIds: [P.rateHz, P.depth], lessonKey: 'rate',
      valueLabel: (v) => `${v[P.rateHz]}·${Math.round(v[P.depth] * 100)}%`,
    },
  ],
  Hero: (v) => combSweepHero(v[P.centerMs], v[P.centerMs] * 0.85 * v[P.depth], v[P.modMix], v[P.modFeedback]),
  anim: (v) => ({
    kind: 'mod',
    flavor: 'flanger',
    rateHz: v[P.rateHz],
    depth: v[P.depth],
    centerMs: v[P.centerMs],
    mix: v[P.modMix],
    feedback: v[P.modFeedback],
  }),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    `Notches every ${Math.round(1 / (v[P.centerMs] / 1000))} Hz (spacing = 1/delay), sweeping between the ghosts. ` +
    (Math.abs(v[P.modFeedback]) >= 0.7 ? 'High feedback sharpens the notches into rings.' : 'Evenly spaced — compare with the phaser.'),
  checks: [
    {
      question: 'What makes a flanger\u2019s notches different from a phaser\u2019s?',
      options: [
        'A flanger\u2019s comb is EVENLY spaced (delay-based); a phaser has a few UNEVEN notches',
        'A flanger has fewer notches',
        'They are the same effect at different rates',
      ],
      correctIdx: 0,
      reveal:
        'A flanger\u2019s tiny delay cancels at every odd multiple of one frequency — an even comb. A phaser\u2019s all-pass stages put a handful of notches wherever the phase crosses — sparse and uneven. That difference IS the two effects.',
      wrongHint: 'Compare this comb with the Phaser lab\u2019s curve — count and space the notches.',
    },
    {
      question: 'You push flanger FEEDBACK toward the maximum. What happens?',
      options: [
        'The sweep gets faster',
        'The notches deepen and the peaks ring — the metallic jet builds toward runaway',
        'The effect gets quieter',
      ],
      correctIdx: 1,
      reveal:
        'Feedback re-circulates the delayed copy, sharpening the comb: deeper notches, resonant peaks, the classic metallic scream at the extreme. Rate is untouched — that is the LFO\u2019s job.',
      wrongHint: 'Step FDBK from 0% to −70% HOLLOW and watch the comb\u2019s teeth.',
    },
  ],
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
  exploreCaption: 'Count the notches: ≈ stages ÷ 2, unevenly spaced. For a pure manual sweep, set DEPTH to STATIC and drag CENTER yourself.',
  sources: [SRC_PINK, SRC_WHITE],
  fixed: [{ paramId: P.modMode, value: 2 }],
  params: [
    {
      // The teaching fader FIRST: drag the notch cluster up and down the
      // spectrum by hand (set DEPTH to STATIC for the pure manual sweep).
      label: 'CENTER', paramId: P.centerHz, lessonKey: 'center',
      choices: [
        { label: '400 Hz', value: 400 },
        { label: '1 kHz', value: 1000 },
        { label: '2 kHz', value: 2000 },
      ],
      initial: 1000,
      fader: { min: 400, max: 2000, log: true, snap: Math.round, format: (v) => `${Math.round(v)} Hz` },
    },
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
      label: 'DEPTH (SWEEP)', paramId: P.depth, lessonKey: 'depth',
      choices: [
        { label: 'STATIC', value: 0 },
        { label: '50%', value: 0.5 },
        { label: '100%', value: 1.0 },
      ],
      initial: 0.5,
    },
    {
      label: 'RESONANCE', short: 'RES', paramId: P.modFeedback, lessonKey: 'feedback',
      choices: [
        { label: '0%', value: 0 },
        { label: '30%', value: 0.3 },
        { label: '60%', value: 0.6 },
      ],
      initial: 0.3,
    },
  ],
  bezel: [
    { k: 'STAGES', paramId: P.stages },
    { k: 'CENTER', paramId: P.centerHz },
    { k: 'RES', paramId: P.modFeedback },
  ],
  // The LFO pair shares one tray (rate × depth = the sweep) — dock ≤5.
  dockGroups: [
    {
      id: 'sweep', label: 'SWEEP', paramIds: [P.rateHz, P.depth], lessonKey: 'rate',
      valueLabel: (v) => `${v[P.rateHz]}·${Math.round(v[P.depth] * 100)}%`,
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
  anim: (v) => ({
    kind: 'phaser',
    rateHz: v[P.rateHz],
    depth: v[P.depth],
    centerHz: v[P.centerHz],
    stages: v[P.stages],
    feedback: v[P.modFeedback],
  }),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    `${v[P.stages]} stages ≈ ${Math.floor(v[P.stages] / 2)} notches, UNEVENLY spaced (set by phase, not by a delay time) — a phaser is not a delay.`,
  checks: [
    {
      question: 'A 6-stage phaser gives you roughly how many notches?',
      options: ['6', '3 — about stages ÷ 2', '12'],
      correctIdx: 1,
      reveal:
        'Each PAIR of all-pass stages creates one notch where the shifted copy cancels the dry — so 6 stages ≈ 3 notches, unevenly spaced. More stages = a thicker sweep.',
      wrongHint: 'Tap through STAGES and count the dips in the curve.',
    },
    {
      question: 'A phaser shifts ____, while a flanger shifts ____.',
      options: ['time · phase', 'phase · time', 'pitch · level'],
      correctIdx: 1,
      reveal:
        'The phaser\u2019s all-pass stages rotate PHASE per frequency (few, uneven notches). The flanger delays in TIME (an even comb). Same family — different mechanism, different sound.',
      wrongHint: 'The intro line of each lab names its mechanism.',
    },
  ],
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
      label: 'THRESHOLD', short: 'THRESH', paramId: P.thresholdDb, lessonKey: 'threshold',
      choices: [-40, -30, -20, -10].map((t) => ({ label: `${t} dB`, value: t })),
      initial: -30,
      // The teaching fader: ride the threshold through the −20 dBFS source and
      // watch measured GR appear on the bezel the moment you cross it.
      fader: { min: -40, max: -10, snap: Math.round, format: (v) => `${Math.round(v)} dB` },
    },
    {
      label: 'RATIO', paramId: P.ratio, lessonKey: 'ratio',
      choices: [
        { label: '2:1 GLUE', value: 2, blurb: 'Gentle — 2 dB in over the threshold becomes 1 dB out. The transparent, mix-bus setting.' },
        { label: '4:1', value: 4, blurb: 'The workhorse — obvious control without obvious squash. Most channel compression lives here.' },
        { label: '8:1', value: 8, blurb: 'Heavy — the level barely rises past the threshold. You HEAR this one working.' },
        { label: '20:1 LIMIT', value: 20, blurb: 'Effectively a ceiling — at this ratio a compressor IS a limiter.' },
      ],
      initial: 4,
    },
    {
      label: 'ATTACK', paramId: P.attackMs, lessonKey: 'attack',
      choices: [
        { label: '0.5 ms FAST', value: 0.5, blurb: 'Clamps instantly — transients are caught, but the attack of a drum dulls.' },
        { label: '5 ms', value: 5, blurb: 'Quick but not instant — most of the transient survives.' },
        { label: '25 ms PUNCH', value: 25, blurb: 'The first 25 ms sneak through untouched — the hit stays, the tail is controlled. Punch.' },
        { label: '100 ms', value: 100, blurb: 'Slow — the compressor reacts to the body of the note, not the hit.' },
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
  bezel: [
    { k: 'THRESH', paramId: P.thresholdDb },
    { k: 'RATIO', paramId: P.ratio },
  ],
  // The time constants share one tray (attack × release = the envelope).
  dockGroups: [
    {
      id: 'env', label: 'ENV', paramIds: [P.attackMs, P.releaseMs], lessonKey: 'attack',
      valueLabel: (v) => `${v[P.attackMs]}·${v[P.releaseMs]}`,
    },
  ],
  Hero: (v) => (
    <TransferCurveGraph mode="compressor" thresholdDb={v[P.thresholdDb]} ratio={v[P.ratio]} makeupDb={v[P.makeupDb]} />
  ),
  anim: (v) => ({
    kind: 'dynamics',
    mode: 'compressor',
    thresholdDb: v[P.thresholdDb],
    ratio: v[P.ratio],
    rangeDb: -40,
    ceilingDb: -12,
    makeupDb: v[P.makeupDb],
  }),
  heroBadge: 'TRANSFER CURVE — ANALYTIC · GR METER — LIVE',
  heroCaption: (v) =>
    `Above ${v[P.thresholdDb]} dB, every ${v[P.ratio]} dB in becomes 1 dB out. The source peaks at −20 dBFS — ` +
    (v[P.thresholdDb] < -20 ? 'over the threshold, so it compresses.' : 'below the threshold, so nothing happens (drop the threshold).'),
  pollGr: 'comp',
  checks: [
    {
      question: 'The GR meter reads 0 dB while audio plays. What does that tell you?',
      options: [
        'The compressor is broken',
        'The signal is below the threshold — the compressor is not working yet',
        'The ratio is too high',
      ],
      correctIdx: 1,
      reveal:
        'No gain reduction = nothing crossed the threshold. A compressor only acts ABOVE it — drop the threshold into the signal and watch GR wake up.',
      wrongHint: 'Ride the THRESHOLD fader down through the source\u2019s level.',
    },
    {
      question: 'You want the drum\u2019s HIT to survive but its ring controlled. Which attack?',
      options: [
        '0.5 ms FAST — clamp everything instantly',
        '25 ms PUNCH — let the transient through, then clamp the tail',
        'Attack doesn\u2019t affect transients',
      ],
      correctIdx: 1,
      reveal:
        'Attack is how long the compressor waits before clamping. 25 ms lets the hit sneak through untouched — punch — while the ring after it gets controlled. Fast attack dulls the hit itself.',
      wrongHint: 'Open the ENV tray and A/B FAST against PUNCH on the click.',
    },
  ],
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
      label: 'THRESHOLD', short: 'THRESH', paramId: P.thresholdDb, lessonKey: 'threshold',
      choices: [-50, -35, -20].map((t) => ({ label: `${t} dB`, value: t })),
      initial: -35,
      // The teaching fader: sweep the cliff past the clicks and hear the gate
      // start opening/closing — GR live on the bezel.
      fader: { min: -50, max: -20, snap: Math.round, format: (v) => `${Math.round(v)} dB` },
    },
    {
      label: 'RANGE (FLOOR)', short: 'RANGE', paramId: P.rangeDb, lessonKey: 'range',
      choices: [
        { label: '−20 GENTLE', value: -20, blurb: 'Closed = 20 dB quieter, not silent — leakage ducks instead of vanishing. Natural on drums.' },
        { label: '−40', value: -40, blurb: 'Deep attenuation — the gate is clearly audible opening and closing.' },
        { label: '−70 SILENCE', value: -70, blurb: 'Closed = gone. Maximum isolation, and maximum chatter risk near the threshold.' },
      ],
      initial: -40,
    },
    {
      label: 'HOLD', paramId: P.holdMs, lessonKey: 'hold',
      choices: [0, 10, 100].map((ms) => ({ label: `${ms} ms`, value: ms })),
      initial: 10,
    },
    {
      label: 'RELEASE', short: 'RLS', paramId: P.releaseMs, lessonKey: 'release',
      choices: [
        { label: '20 ms CHATTER', value: 20 },
        { label: '100 ms', value: 100 },
        { label: '500 ms', value: 500 },
      ],
      initial: 100,
    },
  ],
  bezel: [
    { k: 'THRESH', paramId: P.thresholdDb },
    { k: 'RANGE', paramId: P.rangeDb },
  ],
  Hero: (v) => <TransferCurveGraph mode="gate" thresholdDb={v[P.thresholdDb]} rangeDb={v[P.rangeDb]} />,
  anim: (v) => ({
    kind: 'dynamics',
    mode: 'gate',
    thresholdDb: v[P.thresholdDb],
    ratio: 4,
    rangeDb: v[P.rangeDb],
    ceilingDb: -12,
    makeupDb: 0,
  }),
  heroBadge: 'TRANSFER CURVE — ANALYTIC · GR METER — LIVE',
  heroCaption: (v) =>
    `Below ${v[P.thresholdDb]} dB the output drops ${Math.abs(v[P.rangeDb])} dB toward the floor. ` +
    (v[P.rangeDb] <= -70 ? 'Full silence is abrupt — a partial floor usually sounds more natural.' : 'A partial floor keeps a little ambience.'),
  pollGr: 'gate',
  checks: [
    {
      question: 'A gate and a compressor both use a threshold. What\u2019s the difference?',
      options: [
        'A gate attenuates BELOW the threshold; a compressor acts ABOVE it',
        'A gate is just a faster compressor',
        'A compressor mutes; a gate squashes',
      ],
      correctIdx: 0,
      reveal:
        'Opposite sides of the line: the compressor turns loud things down; the gate turns quiet things down (leakage, hum, spill) and lets the loud signal through untouched.',
      wrongHint: 'Compare this transfer curve with the Compression lab\u2019s — which side bends?',
    },
    {
      question: 'The gate opens and closes rapidly on a decaying note — chatter. The honest fix?',
      options: [
        'A longer RELEASE (or HOLD) so the gate rides through the wobble',
        'More RANGE',
        'A higher threshold to cut the note off sooner',
      ],
      correctIdx: 0,
      reveal:
        'Chatter is the signal hovering at the threshold. HOLD keeps the gate open a minimum time; a longer release closes it gently instead of slamming on every wobble.',
      wrongHint: 'Set RELEASE to 20 ms CHATTER on the decaying source and listen to the name.',
    },
  ],
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
      // The teaching fader: push the ceiling down through the −20 dBFS source
      // and watch constant GR climb on the bezel.
      fader: { min: -45, max: -15, snap: Math.round, format: (v) => `${Math.round(v)} dB` },
    },
    {
      label: 'RELEASE', short: 'RLS', paramId: P.releaseMs, lessonKey: 'release',
      choices: [
        { label: '30 ms', value: 30 },
        { label: '120 ms', value: 120 },
        { label: '500 ms', value: 500 },
      ],
      initial: 120,
    },
  ],
  bezel: [
    { k: 'CEIL', paramId: P.ceilingDb },
    { k: 'RLS', paramId: P.releaseMs },
  ],
  Hero: (v) => <TransferCurveGraph mode="limiter" thresholdDb={v[P.ceilingDb]} ceilingDb={v[P.ceilingDb]} />,
  anim: (v) => ({
    kind: 'dynamics',
    mode: 'limiter',
    thresholdDb: v[P.ceilingDb],
    ratio: 20,
    rangeDb: -40,
    ceilingDb: v[P.ceilingDb],
    makeupDb: 0,
  }),
  heroBadge: 'TRANSFER CURVE — ANALYTIC · GR METER — LIVE',
  heroCaption: (v) =>
    `Output can NEVER exceed ${v[P.ceilingDb]} dB. Source at −20 dBFS → ${
      v[P.ceilingDb] < -20 ? `${Math.abs(v[P.ceilingDb] + 20)} dB of constant gain reduction (watch the meter)` : 'under the ceiling, untouched'
    }.`,
  pollGr: 'limiter',
  note: 'True-peak/inter-sample detection and lookahead are covered in the lesson (ⓘ) — this v1 limiter is a fast peak limiter.',
  checks: [
    {
      question: 'A limiter is best described as…',
      options: [
        'A compressor with a very high ratio — a ceiling nothing passes',
        'A volume control that works faster',
        'An EQ for loud frequencies',
      ],
      correctIdx: 0,
      reveal:
        'At ∞:1 the transfer curve goes flat at the ceiling: input can rise all it wants, output stays. That is the safety-net job — which is why it sits LAST in the chain.',
      wrongHint: 'Look at the transfer curve above the ceiling — it is horizontal.',
    },
    {
      question: 'The limiter\u2019s GR meter never moves. What does that mean?',
      options: [
        'The limiter is faulty',
        'Nothing is reaching the ceiling — it is doing exactly nothing, which is fine',
        'The ceiling is too low',
      ],
      correctIdx: 1,
      reveal:
        'A limiter that shows no GR is a safety net nobody fell into. It only acts at the ceiling; a healthy mix may never touch it — that is success, not failure.',
      wrongHint: 'Drop the ceiling into the signal and watch GR appear.',
    },
  ],
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
      // The teaching fader FIRST: push the wave into the clipper and watch the
      // flat-topping (and hear the grit) grow with every dB.
      label: 'DRIVE', paramId: P.driveDb, lessonKey: 'saturation',
      choices: [6, 12, 24, 36].map((d) => ({ label: `+${d} dB`, value: d })),
      initial: 12,
      fader: { min: 6, max: 36, snap: Math.round, format: (v) => `+${Math.round(v)} dB` },
    },
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
      label: 'OVERSAMPLING', short: 'OS', paramId: P.oversample, lessonKey: 'oversampling',
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
  bezel: [
    { k: 'TYPE', paramId: P.distType },
    { k: 'DRIVE', paramId: P.driveDb },
    { k: 'MIX', paramId: P.distMix },
  ],
  Hero: (v) => (
    <WaveshapeGraph
      type={v[P.distType] === 0 ? 'hard' : v[P.distType] === 1 ? 'soft' : 'tube'}
      driveDb={v[P.driveDb]}
      mix={v[P.distMix]}
    />
  ),
  anim: (v) => ({
    kind: 'distortion',
    type: v[P.distType] === 0 ? 'hard' : v[P.distType] === 1 ? 'soft' : 'tube',
    driveDb: v[P.driveDb],
    mix: v[P.distMix],
  }),
  heroBadge: 'WAVESHAPE — ANALYTIC (input dim · output amber, shape-normalized)',
  heroCaption: (v) =>
    v[P.distType] === 2
      ? 'Top and bottom clip DIFFERENTLY (asymmetric) → even harmonics — the “warm” tube signature.'
      : 'Top and bottom clip the SAME (symmetric) → odd harmonics only — hollow/harsh.',
  note: 'Bitcrush and sample-rate reduction are in the engine (hear them via the lesson’s theory); their quantization visual lands with the analyzer view.',
  checks: [
    {
      question: 'Distortion makes a pure sine tone sound "rich". What was added?',
      options: [
        'Volume',
        'New frequencies — harmonics created by bending the waveform',
        'Reverb tails',
      ],
      correctIdx: 1,
      reveal:
        'Clipping bends the wave shape, and a bent shape IS new harmonics — multiples of the input frequency that were not there before. Distortion is a frequency-creating effect.',
      wrongHint: 'Play the SINE source and watch the added partials in the display.',
    },
    {
      question: 'DRIVE and OUTPUT both change loudness. Why have both?',
      options: [
        'DRIVE sets how hard the wave hits the clipping stage (the tone); OUTPUT just compensates the level after',
        'They are the same control duplicated',
        'OUTPUT adds more harmonics than DRIVE',
      ],
      correctIdx: 0,
      reveal:
        'Drive is the sound: how hard you push into the curve decides how bent — how harmonic-rich — the wave gets. Output is housekeeping: bring the now-hotter signal back to a fair level so you judge tone, not loudness.',
      wrongHint: 'Raise DRIVE, lower OUTPUT — the loudness holds, the character doesn\u2019t.',
    },
  ],
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
      // The teaching fader FIRST: sweep the inter-channel delay and watch the
      // Lissajous ellipse tumble — phase as a frequency-dependent time shift.
      label: 'DELAY R (PHASE)', short: 'DLY R', paramId: PHASE_DLY, lessonKey: 'delay_one_channel',
      choices: [
        { label: '0 ms', value: 0 },
        { label: '0.5 ms', value: 0.5 },
        { label: '2 ms', value: 2 },
        { label: '10 ms', value: 10 },
      ],
      initial: 0,
      fader: { min: 0, max: 10, snap: (v) => Math.round(v * 10) / 10, format: (v) => `${v} ms` },
    },
    {
      label: 'POLARITY (R)', short: 'POL', paramId: PHASE_INV, lessonKey: 'invert_polarity',
      choices: [
        { label: 'NORMAL', value: 0 },
        { label: 'INVERTED Ø', value: 1 },
      ],
      initial: 0,
    },
    {
      label: 'MONO-FOLD', short: 'FOLD', paramId: P.monoFold, lessonKey: 'mono_fold',
      choices: [
        { label: 'STEREO', value: 0 },
        { label: 'MONO (L+R)', value: 1 },
      ],
      initial: 0,
    },
  ],
  bezel: [
    { k: 'POL', paramId: PHASE_INV },
    { k: 'DLY R', paramId: PHASE_DLY },
    { k: 'FOLD', paramId: P.monoFold },
  ],
  Hero: (v) => <LissajousGraph widthPct={100} invertR={v[PHASE_INV] > 0.5} delayRms={v[PHASE_DLY]} toneHz={440} />,
  anim: (v) => ({
    kind: 'stereo',
    flavor: 'phase',
    widthPct: 100,
    pan: 0,
    invertR: v[PHASE_INV] > 0.5,
    delayRms: v[PHASE_DLY],
    monoFold: v[P.monoFold] > 0.5,
  }),
  heroBadge: 'LISSAJOUS + CORRELATION — ANALYTIC (440 Hz model)',
  heroCaption: (v) =>
    v[PHASE_INV] > 0.5
      ? 'Correlation −1: fold to mono and it CANCELS. A polarity flip is 180° at ALL frequencies.'
      : v[PHASE_DLY] > 0
        ? `A ${v[PHASE_DLY]} ms delay shifts phase MORE at higher frequencies — in mono that combs, and no polarity flip can fix it.`
        : 'Identical channels: a vertical line, correlation +1.',
  checks: [
    {
      question: 'You press INVERT (Ø) and sum to MONO — silence. Why?',
      options: [
        'The channels are equal and opposite — added together they cancel exactly',
        'MONO always lowers the level',
        'The invert button mutes one side',
      ],
      correctIdx: 0,
      reveal:
        'Ø flips every value of one channel: +1 meets −1 everywhere, and the sum is zero. Real-world versions (miswired cable, doubled mic) cancel partially — the meter warns you before the club\u2019s mono PA does.',
      wrongHint: 'Press INVERT + MONO and watch the output flow flatline.',
    },
    {
      question: 'Polarity (Ø) and phase are often confused. What\u2019s the difference?',
      options: [
        'Ø flips the whole wave instantly; phase shift is a TIME/frequency relationship',
        'They are the same thing',
        'Phase only matters above 1 kHz',
      ],
      correctIdx: 0,
      reveal:
        'The Ø button multiplies by −1 — every frequency flips at once, no time involved. Phase shift is per-frequency timing offset. The button fixes a wiring problem; it cannot fix an alignment problem.',
      wrongHint: 'The lab\u2019s intro names the distinction — and the DELAY control is the phase side.',
    },
  ],
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
      // The teaching fader: mono → over-wide on one sweep, correlation live.
      fader: { min: 0, max: 200, snap: (v) => Math.round(v / 5) * 5, format: (v) => `${Math.round(v)}%` },
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
      label: 'BASS-MONO', short: 'BASS', paramId: P.bassMonoHz, lessonKey: 'bass_mono',
      choices: [
        { label: 'OFF', value: 0 },
        { label: '120 Hz', value: 120 },
      ],
      initial: 0,
    },
    {
      label: 'MONO-FOLD', short: 'FOLD', paramId: P.monoFold, lessonKey: 'mono_fold',
      choices: [
        { label: 'STEREO', value: 0 },
        { label: 'MONO CHECK', value: 1 },
      ],
      initial: 0,
    },
  ],
  bezel: [
    { k: 'WIDTH', paramId: P.widthPct },
    { k: 'PAN', paramId: P.pan },
    { k: 'FOLD', paramId: P.monoFold },
  ],
  Hero: (v) => <LissajousGraph widthPct={v[P.widthPct]} invertR={false} delayRms={0} toneHz={440} />,
  anim: (v) => ({
    kind: 'stereo',
    flavor: 'width',
    widthPct: v[P.widthPct],
    pan: v[P.pan],
    invertR: false,
    delayRms: 0,
    monoFold: v[P.monoFold] > 0.5,
  }),
  heroBadge: 'LISSAJOUS + CORRELATION — ANALYTIC (440 Hz model)',
  heroCaption: (v) =>
    v[P.monoFold] > 0.5
      ? 'MONO CHECK: everything wide is gone — only the MID survives the fold.'
      : v[P.widthPct] > 100
        ? 'Past 100% the SIDE outweighs the MID — huge on headphones, hollow in mono. Watch the correlation.'
        : v[P.widthPct] === 0
          ? 'Width 0 = pure MID: a vertical line, perfectly mono-safe.'
          : 'The classic trade: width vs mono safety.',
  checks: [
    {
      question: 'The correlation meter is pinned near −1. What happens on a mono system?',
      options: [
        'Nothing — mono ignores correlation',
        'The sides cancel — the mix collapses toward silence',
        'It gets louder',
      ],
      correctIdx: 1,
      reveal:
        'Near −1, whatever left does, right does the opposite — summed to mono (phone speaker, club PA, broadcast) they subtract. Impressive width on headphones can be an empty mix in mono; the meter is the early warning.',
      wrongHint: 'Push WIDTH to maximum and watch where the needle lives.',
    },
    {
      question: 'What does a stereo widener actually manipulate?',
      options: [
        'The MID/SIDE balance — turning up what differs between the channels',
        'The left channel\u2019s volume',
        'The reverb amount',
      ],
      correctIdx: 0,
      reveal:
        'Width = the ratio of SIDE (what differs between L and R) to MID (what they share). More side = wider — and less mono-safe. Every widener is walking that trade.',
      wrongHint: 'Watch the Lissajous cloud stretch sideways as WIDTH rises.',
    },
  ],
};
export const StereoLabScreen = () => <FxLabScreen config={stereoConfig} />;
