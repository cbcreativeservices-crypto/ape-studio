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
  DECAY_SPAN_S,
  LissajousGraph,
  STEREO_TEST_LR_RAD,
  eqResponseDb,
  combResponseDb,
  type EqBandSpec,
} from '../../features/lab/fxViz';
import type { CheckSpec } from './foundations/bits';
import { FxLabScreen, type FxLabConfig, type FxSourceSpec } from './FxLabScreen';
import type { DynSignal, FxSrc } from './fxAnim';
import { fmt2sig, snap2sig } from '../../features/lab/sliderMaps';
// Screen Guides (owner 2026-10-31): every effect lab is a CONCEPT lab (built-in
// test sources, badged teaching models, no mic, no real-world measurement), so
// each passes its per-tab guide and accuracy: false — the ⓘ takes the chip's spot.
import { equalizerScreenGuide } from './eq/equalizerScreenGuides';
import { delayScreenGuide } from './delayScreenGuides';
import { reverbScreenGuide } from './reverbScreenGuides';
import { chorusScreenGuide } from './chorusScreenGuides';
import { flangerScreenGuide } from './flangerScreenGuides';
import { phaserScreenGuide } from './phaserScreenGuides';
import { compressionScreenGuide } from './compressionScreenGuides';
import { gateScreenGuide } from './gateScreenGuides';
import { limiterScreenGuide } from './limiterScreenGuides';
import { distortionScreenGuide } from './distortionScreenGuides';
import { phaseScreenGuide } from './phaseScreenGuides';
import { stereoScreenGuide } from './stereoScreenGuides';

const P = FX_PARAM;
const ANALYTIC = 'DESIGNED RESPONSE — CALCULATED, NOT A MEASUREMENT';

/** Every lab generator is normalised to peak at −20 dBFS — the figure the
 *  dynamics captions have asserted since they were ratified. Naming it once
 *  lets the transfer curves MARK it instead of only describing it. */
const SOURCE_PEAK_DB = -20;

// Shared sources (`short` = the compact dock-key value).
const SRC_PINK = { label: 'PINK NOISE', short: 'PINK', gen: { mode: GEN_MODES.pink }, blurb: 'Steady broadband noise, equal energy per octave — the best source for HEARING a tone change.' };
const SRC_WHITE = { label: 'WHITE NOISE', short: 'WHITE', gen: { mode: GEN_MODES.white }, blurb: 'Equal energy per Hz — brighter than pink. The top octaves dominate, so high-end changes leap out.' };
const srcSine = (hz: number) => ({ label: `SINE ${hz} Hz`, short: `${hz} Hz`, gen: { mode: GEN_MODES.sine, frequency: hz }, steadyPeakDb: SOURCE_PEAK_DB });
// Stereo Imaging lab, engine 10 (stereo spread): two-channel versions of the
// lab sources whose L/R correlation matches the scope's model input (cos 1.1 =
// +0.45), plus the mono comparison. Labels + blurbs: NEW COPY — owner review.
const SRC_PINK_STEREO = {
  label: 'PINK NOISE · STEREO', short: 'ST PINK',
  gen: { mode: GEN_MODES.pink, stereoSpreadRad: STEREO_TEST_LR_RAD },
  blurb: 'Pink noise that differs between left and right — a real SIDE signal, so WIDTH has something to widen.',
};
const SRC_SINE_STEREO = {
  label: 'SINE 440 Hz · STEREO', short: 'ST 440',
  gen: { mode: GEN_MODES.sine, frequency: 440, stereoSpreadRad: STEREO_TEST_LR_RAD },
  blurb: 'The tone the scope draws: right lags left, so the channels differ and WIDTH moves the trace.',
};
const SRC_PINK_MONO = {
  label: 'PINK NOISE · MONO', short: 'MONO',
  gen: { mode: GEN_MODES.pink },
  monoCompare: true,
  blurb: 'The same noise in both channels: the SIDE is zero, so WIDTH has nothing to widen. Compare it with the stereo sources.',
};
const srcClick = (bpm: number) => ({ label: `CLICK ${bpm}`, short: `${bpm} BPM`, gen: { mode: GEN_MODES.click, clickBpm: bpm }, blurb: 'A dry click with silence between hits — echoes, tails and pumping have nowhere to hide.' });

/** What a dynamics hero draws coming IN, from the selected source (fix pass
 *  2026-10-16): the click's real tempo, a sine's steady level, or noise. */
/** `ping`: draw a CLICK as the real 5 ms ping, not the drum-hit model (the
 *  compressor, D41 J4 — see fxAnim DynSignal). */
function dynSignalOf(src?: FxSourceSpec, ping = false): DynSignal {
  const g = src?.gen;
  if (g?.mode === GEN_MODES.click) return { kind: 'hits', periodMs: 60000 / (g.clickBpm ?? 120), ...(ping ? { ping: true } : null) };
  if (g?.mode === GEN_MODES.sine) return { kind: 'steady' };
  return { kind: 'noise' };
}

/** The chorus scope's tone: the sine source's own pitch; with a noise source,
 *  440 Hz stands for one component of it (the hero says so on the glass). */
function chorusToneOf(src?: FxSourceSpec): { srcHz: number; srcIsNoise: boolean } {
  const g = src?.gen;
  if (g?.mode === GEN_MODES.sine && g.frequency) return { srcHz: g.frequency, srcIsNoise: false };
  return { srcHz: 440, srcIsNoise: true };
}

/** The selected source is a noise generator (PINK / WHITE). Distortion and
 *  Phase still DRAW a sine; this only switches their IN note (2026-10-31). */
function isNoiseSrc(src?: FxSourceSpec): boolean {
  const m = src?.gen?.mode;
  return m === GEN_MODES.pink || m === GEN_MODES.white;
}

/** What the delay / reverb / flanger / phaser heroes draw coming IN — the
 *  selected SOURCE as the generator makes it (fix wave 2026-10-16). */
function fxSrcOf(src?: FxSourceSpec): FxSrc {
  const g = src?.gen;
  if (g?.mode === GEN_MODES.click) return { kind: 'click', periodMs: 60000 / (g.clickBpm ?? 120) };
  if (g?.mode === GEN_MODES.burst) return { kind: 'burst', hz: g.frequency ?? 1000 };
  if (g?.mode === GEN_MODES.sine) return { kind: 'tone', hz: g.frequency ?? 1000 };
  return { kind: 'noise', color: g?.mode === GEN_MODES.white ? 'white' : 'pink' };
}

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

/** Bands 1–5 off: the EQ audition modules push up to six live bands and a
 *  reset clears only `enabled`, so without this an audition's bands stay in the
 *  sound while the curve draws band 0 alone. The screen says the curve is
 *  exactly the filter (the SignalChain lab's DEFAULTS do the same). */
export const EQ_OTHER_BANDS_OFF = [1, 2, 3, 4, 5].map((b) => ({ paramId: P.eqBand(b, 'type'), value: EQ_BAND_TYPES.off }));

const eqConfig: FxLabConfig = {
  labId: 'eq',
  guide: equalizerScreenGuide,
  accuracy: false,
  fxId: FX.eq,
  title: 'EQUALIZER LAB',
  subtitle: 'Boost · Cut · Q · Filter shapes',
  intro:
    'Shape the balance of frequencies and SEE the curve you are applying. One band, four ' +
    'controls — the response curve below is exactly the filter the audio runs through.',
  exploreCaption: 'Pick a filter shape, place it, and watch the curve — then play pink noise through it.',
  sources: [SRC_PINK, srcSine(440), SRC_WHITE],
  fixed: EQ_OTHER_BANDS_OFF,
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
        { label: 'HIGH-PASS', value: EQ_BAND_TYPES.highPass, blurb: 'CUTS everything below the frequency on a steady 12 dB-per-octave slope — not a set amount of cut. The rumble-and-mud eraser.' },
        { label: 'LOW-PASS', value: EQ_BAND_TYPES.lowPass, blurb: 'CUTS everything above the frequency on a steady slope — darkness on demand; add a high-pass and you get the "telephone" sound.' },
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
      return v[EQ_TYPE] === EQ_BAND_TYPES.highPass
        ? `High-pass at ${f}. GAIN and Q don't apply to the high-pass — the slope is fixed; only the cutoff moves.`
        : `Low-pass at ${f}. GAIN doesn't apply to a pass filter, but on the low-pass Q shapes the corner — a high Q adds a bump just before the cutoff.`;
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
        'A narrow (high-Q) cut takes out just the hum frequency (its overtones may need notches too) and leaves the neighboring bass alone. The shelf and the high-pass both take real bass with them.',
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
        'Pass filters CUT everything past the cutoff at a set slope — there is no amount to set. In this lab GAIN belongs to bells and shelves. (On the low-pass, Q shapes the corner; on the high-pass it does nothing.)',
      wrongHint: 'Switch to HIGH-PASS and tap through the GAIN values — watch the curve.',
    },
  ],
};
export const EqLabScreen = () => <FxLabScreen config={eqConfig} />;

// Rule book F3: 100% wet is the send/return setting. One line, shared by the
// delay and reverb MIX choices, so the insert-vs-send difference is stated.
const SEND_RETURN_WET =
  'The usual setting on an aux send/return: the dry signal stays on the channel and the return adds only the effect. Used as an insert, MIX does the blending instead.';

/** dB lost at f by one pass through the delay's in-loop one-pole low-pass.
 *  fxAnim's onePoleGain, written out here because fxAnim is the Skia-gated
 *  module: importing it would load Skia for this file too. A test pins the
 *  two to the same numbers. */
function onePoleLossDb(fcHz: number, fHz: number): number {
  const fs = 48000;
  const c = 1 - Math.exp((-2 * Math.PI * fcHz) / fs);
  const wv = (2 * Math.PI * fHz) / fs;
  const a = 1 - c;
  return -20 * Math.log10(c / Math.hypot(1 - a * Math.cos(wv), a * Math.sin(wv)));
}

/** DAMP's picture is honest but small (about 1 dB per repeat at the click's
 *  1 kHz at DARK 2k), so the number is said in words, never exaggerated. The
 *  first repeat is the raw input; damping acts on every pass after it. */
function delayDampPhrase(dampHz: number, feedback: number): string {
  if (dampHz >= 20000) return '';
  if (feedback <= 0) return ' REPEAT DAMPING needs FEEDBACK: the single repeat is not filtered.';
  return ` REPEAT DAMPING: each pass after the first loses ${onePoleLossDb(dampHz, 1000).toFixed(1)} dB at 1 kHz, the CLICK’s pitch, and higher frequencies lose more, so it is easier to hear on PINK.`;
}

// ──────────────────────────────────────────────────────── LAB 2 · Delay ──
const delayConfig: FxLabConfig = {
  labId: 'delay',
  guide: delayScreenGuide,
  accuracy: false,
  fxId: FX.delay,
  title: 'DELAY LAB',
  subtitle: 'Echoes · Feedback · Ping-pong',
  intro:
    'A delay repeats the signal after a set time. The timeline below IS the echo pattern: ' +
    'spacing = delay time, shrinking height = feedback, sides = ping-pong.',
  // NEW COPY 2026-10-16 (art fix wave) — owner review: says what the display is.
  exploreCaption:
    'Display: each click (gray) crosses the stage and its repeats follow it out — the gap is the delay TIME, each ' +
    'repeat smaller by the FEEDBACK. The ruler under OUT counts seconds since the click reached the stage. Use the CLICK source: a ' +
    'steady tone or noise hides its repeats.',
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
        { label: '100% WET', value: 1.0, blurb: SEND_RETURN_WET },
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
  anim: (v, src) => ({
    kind: 'delay',
    timeMs: v[P.timeMs],
    feedback: v[P.delayFeedback],
    mix: v[P.delayMix],
    pingpong: v[P.pingpong] > 0.5,
    dampHz: v[P.dampHz],
    src: fxSrcOf(src),
  }),
  heroBadge: 'ECHO PATTERN — CALCULATED (spacing = time · decay = feedback)',
  heroCaption: (v) =>
    `${v[P.timeMs]} ms between repeats; each repeat is ${Math.round(v[P.delayFeedback] * 100)}% of the last. ` +
    // A BPM is named only where it is a usual song tempo (≤ 240 BPM → TIME ≥ 250 ms);
    // 80 ms would read "750 BPM", which means nothing — that range is slapback.
    (v[P.delayFeedback] >= 0.75 ? 'High feedback — a long trail; runaway starts near 100%.'
      : v[P.timeMs] <= 150 ? 'Slapback range (about 60–150 ms) — a quick repeat just behind the source, not tied to the tempo.'
      : v[P.timeMs] < 250 ? 'A short echo — too quick to be a quarter-note at a usual song tempo.'
      : `That spacing = a quarter-note at ${Math.round(60000 / v[P.timeMs])} BPM — match the delay to the song's tempo and repeats land ON the beat.`) +
    delayDampPhrase(v[P.dampHz], v[P.delayFeedback]),
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
  guide: reverbScreenGuide,
  accuracy: false,
  fxId: FX.reverb,
  title: 'REVERB LAB',
  subtitle: 'RT60 · Pre-delay · Damping',
  intro:
    'Reverb is thousands of reflections blurring into a decaying wash. The graph below is the ' +
    'decay: RT60 is WHERE the slope crosses −60 dB — a time, not an amount.',
  // NEW COPY 2026-10-16 (art fix wave) — owner review: says what the display is.
  exploreCaption:
    'Display: level in decibels (dashed guides 30 dB apart), so a decay is a straight slope. Each click (gray) crosses the stage; after the ' +
    'pre-delay gap the reverb (amber) arrives and falls 60 dB in RT60 or sooner: HF DAMPING dulls the tail on every trip around ' +
    'the reverb, so this 1 kHz click fades fastest with DARK. A longer RT60 is a gentler slope, and the ' +
    'tails pile up into a wash. OUT redraws from the left each time a click reaches the stage; its ruler counts seconds since then.',
  // The burst names its pitch: the generator keeps the LAST frequency any lab
  // set, so a burst with none played whatever tone the previous lab left.
  sources: [srcClick(60), { label: 'BURST 1 kHz', short: 'BURST', gen: { mode: GEN_MODES.burst, frequency: 1000 } }, SRC_PINK],
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
      // Two significant figures below 1 s (slider pass 2026-10-14): a 0.1 s
      // snap stepped the low end of the lane in 25 % jumps.
      fader: { min: 0.4, max: 6, log: true, snap: snap2sig, format: (v) => `${fmt2sig(v)} s` },
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
        { label: '100% WET', value: 1.0, blurb: SEND_RETURN_WET },
      ],
      initial: 0.35,
    },
  ],
  bezel: [
    { k: 'RT60', paramId: P.rt60 },
    { k: 'PRE', paramId: P.preDelayMs },
    { k: 'MIX', paramId: P.reverbMix },
  ],
  // A FIXED 7.5 s window (D41 fix 2026-11-01), like the Delay graph's: a
  // window of 1.25 × RT60 held the slope and its marker still for every RT60
  // from 0.48 s to 6 s, so the RT60 fader moved nothing visible here.
  Hero: (v) => <DecayCurveGraph rt60={v[P.rt60]} preDelayMs={v[P.preDelayMs]} spanS={DECAY_SPAN_S} />,
  anim: (v, src) => ({
    kind: 'reverb',
    rt60: v[P.rt60],
    preDelayMs: v[P.preDelayMs],
    mix: v[P.reverbMix],
    dampHz: v[P.reverbDampHz],
    src: fxSrcOf(src),
  }),
  heroBadge: 'DECAY SLOPE — CALCULATED (RT60 = time to fall 60 dB)',
  heroCaption: (v) =>
    v[P.preDelayMs] === 0
      ? `No pre-delay: the wash starts with the dry hit, gluing the source to the tail. Then the tail falls 60 dB in ${v[P.rt60]} s.`
      : `${v[P.preDelayMs]} ms pre-delay separates the dry hit from the wash, then the tail falls 60 dB in ${v[P.rt60]} s.`,
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
// A comb repeats every 1/delay in LINEAR frequency, so on this log axis its
// notches crowd closer than a pixel above a few hundred Hz. `periodHz` makes
// the graph draw each column's true min..max (grading fix 2026-10-16: the
// 384-point sampling aliased a 20 ms comb into a random-height amber moiré).
// `markHz` marks a source tone on the axis (the chorus lab's 440 Hz sine).
function combSweepHero(centerMs: number, sweepMs: number, mix: number, fb: number, markHz?: number) {
  const lo = Math.max(centerMs - sweepMs, 0.05);
  const hi = centerMs + sweepMs;
  return (
    <ResponseCurveGraph
      dbRange={16}
      band={markHz ? { f: markHz, color: '#9a9ca8' } : undefined}
      curves={[
        { at: (f) => combResponseDb(lo, mix, fb, f), emphasis: 'ghost', periodHz: 1000 / lo },
        { at: (f) => combResponseDb(hi, mix, fb, f), emphasis: 'ghost', periodHz: 1000 / hi },
        { at: (f) => combResponseDb(centerMs, mix, fb, f), emphasis: 'main', periodHz: 1000 / centerMs },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────── LAB 4 · Chorus ──
const chorusConfig: FxLabConfig = {
  labId: 'chorus',
  guide: chorusScreenGuide,
  accuracy: false,
  fxId: FX.mod,
  title: 'CHORUS LAB',
  subtitle: 'Detuned voices · Thickening',
  intro:
    'Chorus mixes you with a slightly delayed, pitch-wobbling copy of yourself — like two ' +
    'players who can never be perfectly together. The long delay makes the comb notches so ' +
    'close they blur into shimmer, not a flanger’s sweeping “jet”.',
  // NEW COPY 2026-10-16 (grading fix) — owner review. The old line described
  // the comb graph, not the display above it, and named a CENTER control this
  // lab does not have (its delay key is DELAY).
  exploreCaption:
    'Display: gray = your voice, blue = the delayed copy, the bold glowing line = what you hear (the two mixed; ' +
    'its color shows its level). As the slow wobble (the LFO) drifts the delay, the copy slides and the sum swells ' +
    'and thins — that movement is the chorus. Compare VOICE DELAY on PINK NOISE: on a sine, each setting should sound the same.',
  sources: [srcSine(440), SRC_PINK],
  // EVERY PARAM OF A SHARED NODE MUST BE DECLARED HERE. `EffectChain::reset()`
  // only sets param 0 (enabled) to 0 — every other atomic keeps its last
  // written value for the life of the process (Effects.hpp:760). Chorus,
  // flanger and phaser are all FX.mod; phase and stereo are both FX.stereo. So
  // a lab that writes only a SUBSET of its node's params inherits the rest
  // from whichever lab touched them last. Worst case found 2026-09-12: leave
  // the flanger with MIX at 100%, open the PHASER, and mix_=1.0 makes the
  // output the pure all-pass — unity at every frequency, so no notches and no
  // audible phasing at all, while the hero above it draws textbook notches.
  fixed: [
    { paramId: P.modMode, value: 0 },
    { paramId: P.modFeedback, value: 0 },
  ],
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
  Hero: (v, src) => {
    const tone = chorusToneOf(src);
    return combSweepHero(v[P.centerMs], 6 * v[P.depth], v[P.modMix], 0, tone.srcIsNoise ? undefined : tone.srcHz);
  },
  anim: (v, src) => ({
    kind: 'mod',
    flavor: 'chorus',
    rateHz: v[P.rateHz],
    depth: v[P.depth],
    centerMs: v[P.centerMs],
    mix: v[P.modMix],
    feedback: 0,
    ...chorusToneOf(src),
  }),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    v[P.modMix] >= 1
      ? '100% wet removes the dry voice — nothing left to beat against: that is vibrato, not chorus.'
      : `~${v[P.centerMs]} ms voice → notches every ${Math.round(1000 / v[P.centerMs])} Hz — too fine to hear as a comb; you hear the BEATING instead. ` +
        'Amber = the comb now, dashed = where the LFO sweeps it; higher up the notches are closer than the screen can draw, so they fill a band. ' +
        'With the SINE source the gray line marks its 440 Hz, which swells and dips as the notches pass it.',
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
      wrongHint: 'Watch the blue copy slide against your gray voice on the display.',
    },
  ],
};
export const ChorusLabScreen = () => <FxLabScreen config={chorusConfig} />;

// ────────────────────────────────────────────────────── LAB 5 · Flanger ──
const flangerConfig: FxLabConfig = {
  labId: 'flanger',
  guide: flangerScreenGuide,
  accuracy: false,
  fxId: FX.mod,
  title: 'FLANGER LAB',
  subtitle: 'Sweeping comb · The jet',
  intro:
    'A flanger is a SHORT delay summed with the dry signal: evenly spaced comb notches whose ' +
    'spacing is 1/delay. The LFO moves the delay, so every notch sweeps together — the jet.',
  // NEW COPY 2026-10-16 (art fix wave) — owner review: says what the display is.
  exploreCaption:
    'Display: two spectrum analyzers — the noise going in, and coming out with the flanger’s evenly spaced notches ' +
    'sweeping as the LFO moves the delay (that sweep is the jet). Dotted line = the input, for comparison.',
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
      fader: { min: 0.5, max: 5, log: true, snap: snap2sig, format: (v) => `${fmt2sig(v)} ms` },
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
        { label: '50% EVEN', value: 0.5 },
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
  anim: (v, src) => ({
    kind: 'mod',
    flavor: 'flanger',
    rateHz: v[P.rateHz],
    depth: v[P.depth],
    centerMs: v[P.centerMs],
    mix: v[P.modMix],
    feedback: v[P.modFeedback],
    spectrum: src?.gen.mode === GEN_MODES.white ? 'white' : 'pink',
  }),
  heroBadge: ANALYTIC,
  heroCaption: (v) =>
    v[P.modMix] >= 1
      ? 'At 100% MIX there is no dry signal left to cancel against, so there are no deep notches — just a moving delay that wobbles the pitch. FDBK raises resonant peaks that ring at ±70%; at −70% that is the hollow, through-a-tube tone. Set MIX to 50% to bring back the dry signal the notches need.'
      : `Notches every ${Math.round(1 / (v[P.centerMs] / 1000))} Hz (spacing = 1/delay), sweeping between the dashed curves. ` +
        (v[P.modFeedback] >= 0.7
          ? 'High feedback lifts tall, narrow peaks between the notches — the comb starts to ring.'
          : v[P.modFeedback] <= -0.7
            ? 'Negative feedback at 50% MIX almost cancels the comb out — set MIX to 100% to hear the hollow tone.'
            : 'Evenly spaced — compare with the phaser.'),
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
        'The peaks between the notches grow tall and narrow and ring — the metallic jet builds toward runaway',
        'The effect gets quieter',
      ],
      correctIdx: 1,
      reveal:
        'Feedback re-circulates the delayed copy: the peaks between the notches grow taller and narrower, so the comb sounds sharper and more resonant: the metallic ring of 70% METALLIC. Rate is untouched — that is the LFO\u2019s job.',
      wrongHint: 'Step FDBK from 0% to 70% METALLIC and watch the peaks between the notches on OUT rise above the dotted input line.',
    },
  ],
};
export const FlangerLabScreen = () => <FxLabScreen config={flangerConfig} />;

// ─────────────────────────────────────────────────────── LAB 6 · Phaser ──
/** The phaser's response with RES, as the engine runs it (Effects.hpp
 *  ModEffect, mode 2): mix 0.5 of dry + N first-order (bilinear) all-passes,
 *  A = e^(jφ), φ = −2N·atan(tan(πf/fs) / tan(πfc/fs)), the cascade's previous
 *  output fed back ×RES: y = A·x / (1 − RES·A·e^(−jω)) — the animated
 *  analyser on the glass draws the same law. */
function phaserResDb(fc: number, stages: number, fb: number, f: number): number {
  const fs = 48000;
  const phi = -2 * stages * Math.atan(Math.tan((Math.PI * Math.min(f, 23000)) / fs) / Math.tan((Math.PI * fc) / fs));
  const wv = (2 * Math.PI * f) / fs;
  const ar = Math.cos(phi), ai = Math.sin(phi);
  const dr = 1 - fb * Math.cos(phi - wv), di = -fb * Math.sin(phi - wv);
  const den = Math.max(dr * dr + di * di, 1e-12);
  const yr = (ar * dr + ai * di) / den, yi = (ai * dr - ar * di) / den;
  const hr = 0.5 + 0.5 * yr, hi = 0.5 * yi;
  return 10 * Math.log10(Math.max(hr * hr + hi * hi, 1e-12));
}
const phaserConfig: FxLabConfig = {
  labId: 'phaser',
  guide: phaserScreenGuide,
  accuracy: false,
  fxId: FX.mod,
  title: 'PHASER LAB',
  subtitle: 'All-pass stages · Uneven notches',
  intro:
    'A phaser shifts PHASE, not time: all-pass stages (filters that shift phase without changing level) create a few notches where the shifted ' +
    'copy cancels the dry. Compare the sparse, UNEVEN notches below with the flanger’s even ' +
    'comb — that difference is the whole lesson.',
  // NEW COPY 2026-10-16 (art fix wave) — owner review: says what the display is.
  exploreCaption:
    'Display: the noise’s spectrum going in and coming out — a few UNEVEN notches (≈ stages ÷ 2) sweep as the LFO ' +
    'moves the all-pass corner; RES feeds the output back, lifting resonant peaks between the notches. For a pure manual sweep, set DEPTH to STATIC and drag CENTER yourself.',
  sources: [SRC_PINK, SRC_WHITE],
  // EVERY PARAM OF A SHARED NODE MUST BE DECLARED HERE. `EffectChain::reset()`
  // only sets param 0 (enabled) to 0 — every other atomic keeps its last
  // written value for the life of the process (Effects.hpp:760). Chorus,
  // flanger and phaser are all FX.mod; phase and stereo are both FX.stereo. So
  // a lab that writes only a SUBSET of its node's params inherits the rest
  // from whichever lab touched them last. Worst case found 2026-09-12: leave
  // the flanger with MIX at 100%, open the PHASER, and mix_=1.0 makes the
  // output the pure all-pass — unity at every frequency, so no notches and no
  // audible phasing at all, while the hero above it draws textbook notches.
  fixed: [
    { paramId: P.modMode, value: 2 },
    // 0.5 is the value this lab's Hero and anim already assume — declaring it
    // makes the assumption true instead of hoping the last lab agreed.
    { paramId: P.modMix, value: 0.5 },
  ],
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
  // RES is drawn too (fix wave 2026-10-16): the engine feeds the cascade's
  // output back (Effects.hpp), so RES lifts the peaks between the notches (and
  // makes the notches shallower) — the curve used to ignore it, and moving RES
  // changed nothing here.
  Hero: (v) => (
    <ResponseCurveGraph
      dbRange={16}
      curves={[
        { at: (f) => phaserResDb(v[P.centerHz] * Math.pow(2, -2 * v[P.depth]), v[P.stages], v[P.modFeedback], f), emphasis: 'ghost' },
        { at: (f) => phaserResDb(v[P.centerHz] * Math.pow(2, 2 * v[P.depth]), v[P.stages], v[P.modFeedback], f), emphasis: 'ghost' },
        { at: (f) => phaserResDb(v[P.centerHz], v[P.stages], v[P.modFeedback], f), emphasis: 'main' },
      ]}
    />
  ),
  anim: (v, src) => ({
    kind: 'phaser',
    rateHz: v[P.rateHz],
    depth: v[P.depth],
    centerHz: v[P.centerHz],
    stages: v[P.stages],
    feedback: v[P.modFeedback],
    spectrum: src?.gen.mode === GEN_MODES.white ? 'white' : 'pink',
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
  guide: compressionScreenGuide,
  accuracy: false,
  fxId: FX.comp,
  title: 'COMPRESSION LAB',
  subtitle: 'Threshold · Ratio · Attack · Release',
  intro:
    'Above the threshold, gain is reduced by the ratio — the bend in the transfer curve below. ' +
    'The GR meter is LIVE: it shows the real gain reduction being applied to the sound right now.',
  // NEW COPY 2026-10-16 (grading fix) — owner review.
  exploreCaption:
    'Push the source over the threshold and watch measured GR appear. On the display the sound flows left → right ' +
    'through COMP; each CLICK is a 5 ms spike, and the dotted outline is the hit untouched. The amber strip under OUT is the ' +
    'gain reduction on each click: RATIO and THRESH change how deep it hangs.',
  // A steady source holds GR still, so the ATK/REL tray has nothing to show.
  exploreCaptionBySource: {
    'SINE 440 Hz': 'SINE 440 Hz source: a steady tone at −20 dBFS. Push it over the threshold and GR settles at one value and stays there; the dotted outline is the signal untouched. ATK/REL only show clearly on a transient: choose CLICK 120.',
    'PINK NOISE': 'PINK NOISE source: a steady hiss peaking near −20 dBFS, with no hits, so GR hovers around one value; the dotted outline is the signal untouched. ATK/REL only show clearly on a transient: choose CLICK 120.',
  },
  // CLICK FIRST (owner 2026-09-11). A steady 440 Hz sine against a fixed
  // threshold produces CONSTANT gain reduction, so the GR meter lights and then
  // sits perfectly still — correct behaviour that reads as a broken meter, and
  // did: "ladder does not animate or move". The click gives the reduction
  // something to do, so a student who presses play sees the compressor working
  // on the first try. The lab already assumed it — its own attack question says
  // "A/B FAST against PUNCH on the click" — the default just never matched.
  // The sine stays one tap away; it is the better source for hearing STEADY
  // reduction, which is a different lesson.
  sources: [srcClick(120), srcSine(440), SRC_PINK],
  params: [
    {
      label: 'THRESHOLD', short: 'THRESH', paramId: P.thresholdDb, lessonKey: 'threshold',
      // Down to -50 (owner 2026-09-11). The old floor of -40 capped how far the
      // learner could push the threshold INTO the signal, which capped how much
      // gain reduction they could ever produce — and the GR ladder along with
      // it. A lower threshold means more of the source sits above it, so the
      // reduction deepens and the meter has more to show.
      choices: [-50, -40, -30, -20, -10].map((t) => ({ label: `${t} dB`, value: t })),
      // −40, not −30 (D41 fix 2026-11-01). The CLICK 120 default is a 5 ms
      // ping: at ATTACK 5 ms the engine's detector peaks at only −32.7 dBFS
      // on it, so at −30 the live GR sat at 0.0 on first play — the opposite
      // of what the click default above exists for. At −40 GR kicks ~5.5 dB
      // on each hit and falls back to 0.0 (Effects.hpp DynamicsEffect,
      // re-run sample by sample in test/screenGuide_compression_20261031).
      initial: -40,
      // The teaching fader: ride the threshold through the −20 dBFS source and
      // watch measured GR appear on the bezel the moment you cross it.
      // The fader spans the chips, so its floor moves with them.
      fader: { min: -50, max: -10, snap: Math.round, format: (v) => `${Math.round(v)} dB` },
    },
    {
      label: 'RATIO', paramId: P.ratio, lessonKey: 'ratio',
      choices: [
        { label: '2:1 GLUE', value: 2, blurb: 'Gentle — 2 dB in over the threshold becomes 1 dB out. Transparent — a common gentle mix-bus starting point.' },
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
        { label: '25 ms PUNCH', value: 25, blurb: 'The clamp builds slowly (a 25 ms time constant), so most of the hit gets through before it bites — the tail is controlled. Punch.' },
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
      // "ATK/REL 5/120ms" — the readout names both times and their unit
      // ("ENV 5·120" was shorthand; art grading 2026-10-16).
      id: 'env', label: 'ATK/REL', paramIds: [P.attackMs, P.releaseMs], lessonKey: 'attack',
      valueLabel: (v) => `${v[P.attackMs]}/${v[P.releaseMs]}ms`,
    },
  ],
  Hero: (v, src) => (
    <TransferCurveGraph
      mode="compressor"
      thresholdDb={v[P.thresholdDb]}
      ratio={v[P.ratio]}
      makeupDb={v[P.makeupDb]}
      sourcePeakDb={src?.steadyPeakDb}
    />
  ),
  anim: (v, src) => ({
    kind: 'dynamics',
    mode: 'compressor',
    thresholdDb: v[P.thresholdDb],
    ratio: v[P.ratio],
    rangeDb: -40,
    ceilingDb: -12,
    makeupDb: v[P.makeupDb],
    attackMs: v[P.attackMs],
    releaseMs: v[P.releaseMs],
    holdMs: 0, // a compressor has no hold
    // The REAL click (D41 J4, 2026-11-01): with the 90 ms drum-hit model the
    // drawing clamped ~14 dB of GR while the live meter kicked ~5.5 dB on the
    // same settings. Drawn as the generator's 5 ms ping, the drawing runs the
    // engine's detector on the engine's input: its GR peak now equals the
    // meter's. What is DRAWN is the output, though, and at ATTACK 5 ms the
    // spike only drops ~1 dB (GR peaks as the click ends, after its loudest
    // moment) — the guide says so in words.
    signal: dynSignalOf(src, true),
  }),
  heroBadge: 'TRANSFER CURVE — CALCULATED · GR METER — LIVE',
  heroCaption: (v) =>
    `Above ${v[P.thresholdDb]} dB, every ${v[P.ratio]} dB in becomes 1 dB out. The source peaks at −20 dBFS — ` +
    (v[P.thresholdDb] < -20
      ? 'over the threshold, so a steady tone compresses. A short CLICK 120 is sensed lower than its peak (the attack time smooths it), so it can stay under: the live GR readout shows what really happens. On SINE 440 the curve marks the tone’s peak at SOURCE; GR reads a little less, because the level sensor rides just under the peak (further under with a slow ATTACK and fast RELEASE).'
      : 'below the threshold, so nothing happens (drop the threshold).'),
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
        'Attack sets how fast the compressor clamps — it is a time constant, not a wait. At 25 ms the gain reduction builds slowly, so most of the hit gets through — punch — while the ring after it gets controlled. Fast attack dulls the hit itself.',
      wrongHint: 'Open the ATK/REL tray and A/B FAST against PUNCH on the click.',
    },
  ],
};
export const CompressionLabScreen = () => <FxLabScreen config={compConfig} />;

// ───────────────────────────────────────────────────────── LAB 8 · Gate ──
const gateConfig: FxLabConfig = {
  labId: 'gate',
  guide: gateScreenGuide,
  accuracy: false,
  fxId: FX.gate,
  title: 'GATE LAB',
  subtitle: 'Threshold · Hold · Release · Chatter',
  intro:
    'A gate turns down what falls BELOW the threshold — the cliff in the curve below. With the ' +
    'click source you hear it open on every hit and close in the silence between.',
  // NEW COPY 2026-10-16 (grading fix) — owner review.
  exploreCaption:
    'CLICK source (90 BPM): the gate opens on each hit. The sound is only a 5 ms click, so RANGE, HOLD and RELEASE barely change ' +
    'what you hear: to hear those three, choose PINK NOISE. The sound flows ' +
    'left → right, so a hit’s start leads and its tail trails; the dotted outline is the hit untouched, the gap is what the gate took.',
  exploreCaptionBySource: {
    'PINK NOISE': 'PINK NOISE source: a steady hiss. Set THRESH above its level and the gate shuts; below it, the gate stays open.',
  },
  // Audit decision 2 (2026-11-05): the words that make PINK NOISE worth choosing.
  captionExtra: (_v, src) =>
    src.label === 'PINK NOISE'
      ? 'Set THRESH near its level and the gate should flutter (chatter): hear RANGE, HOLD and RELEASE there.'
      : '',
  sources: [srcClick(90), SRC_PINK],
  // The gate's ATTACK is written, not inherited (D41 fix 2026-11-01). The
  // engine default (Effects.hpp DynamicsEffect `attackMs_{10.0}`) is slower
  // than the lab's 5 ms click: its detector peaked at only −37.6 dBFS, so at
  // the default THRESH −35 the gate never opened (GR sat at |RANGE|) while the
  // intro, the caption and the drawing all said it opens on every hit. At
  // 1 ms the detector reaches ≈ −24.6 dBFS and the gate opens on each hit.
  fixed: [{ paramId: P.attackMs, value: 1 }],
  params: [
    {
      label: 'THRESHOLD', short: 'THRESH', paramId: P.thresholdDb, lessonKey: 'threshold',
      // Same minus sign as RANGE beside it on the bezel.
      choices: [-50, -35, -20].map((t) => ({ label: `−${Math.abs(t)} dB`, value: t })),
      initial: -35,
      // The teaching fader: sweep the cliff past the clicks and hear the gate
      // start opening/closing — GR live on the bezel.
      fader: { min: -50, max: -20, snap: Math.round, format: (v) => `−${Math.abs(Math.round(v))} dB` },
    },
    {
      label: 'RANGE (FLOOR)', short: 'RANGE', paramId: P.rangeDb, lessonKey: 'range',
      choices: [
        { label: '−20 dB GENTLE', value: -20, blurb: 'Closed = 20 dB quieter, not silent — leakage ducks instead of vanishing. Natural on drums.' },
        { label: '−40 dB', value: -40, blurb: 'Deep attenuation — the gate is clearly audible opening and closing.' },
        { label: '−70 dB SILENCE', value: -70, blurb: 'Closed = gone. Maximum isolation, and maximum chatter risk near the threshold.' },
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
  Hero: (v) => (
    // NO sourcePeakDb. A gate acts on what a hit DECAYS TO, which a peak
    // marker cannot express: with the source peak at -20 and this lab's
    // thresholds at -50/-35/-20, `dbIn < thresholdDb` is false everywhere the
    // fader can reach, so the marker sat permanently inert while asserting
    // "your source is above the threshold, nothing happens" — the opposite of
    // what the live ladder reads on every burst.
    <TransferCurveGraph mode="gate" thresholdDb={v[P.thresholdDb]} rangeDb={v[P.rangeDb]} />
  ),
  anim: (v, src) => ({
    kind: 'dynamics',
    mode: 'gate',
    thresholdDb: v[P.thresholdDb],
    ratio: 4,
    rangeDb: v[P.rangeDb],
    ceilingDb: -12,
    makeupDb: 0,
    // The gate attack the engine RUNS: this lab exposes no ATTACK control,
    // but `fixed` above writes param 3 = 1 ms on every start (D41 fix
    // 2026-11-01). Before that the engine's 10 ms default stood and the drawing
    // said 10 to match it. Keep the two in lockstep: the drawing depicts the
    // engine, so change the `fixed` value and this one together.
    attackMs: 1,
    releaseMs: v[P.releaseMs],
    holdMs: v[P.holdMs],
    signal: dynSignalOf(src),
  }),
  heroBadge: 'TRANSFER CURVE — CALCULATED · GR METER — LIVE',
  heroCaption: (v) =>
    `Below −${Math.abs(v[P.thresholdDb])} dB the output drops ${Math.abs(v[P.rangeDb])} dB toward the floor. ` +
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
      wrongHint: 'Chatter is a level hovering at the threshold. On CLICK 90 at THRESH −50 dB, compare RLS 20 ms CHATTER with 500 ms: which keeps the gate from closing between hits?',
    },
  ],
};
export const GateLabScreen = () => <FxLabScreen config={gateConfig} />;

// ────────────────────────────────────────────────────── LAB 9 · Limiter ──
const limiterConfig: FxLabConfig = {
  labId: 'limiter',
  guide: limiterScreenGuide,
  accuracy: false,
  fxId: FX.limiter,
  title: 'LIMITER LAB',
  subtitle: 'Brickwall · Ceiling · GR',
  intro:
    'A limiter is a compressor with a very high (here infinite) ratio: the ceiling caps the output — the flat ' +
    'shelf in the curve. The live GR meter shows exactly how hard you are hitting it.',
  // NEW COPY 2026-10-16 (grading fix) — owner review.
  exploreCaption:
    'The source peaks at −20 dBFS — ceilings below that engage the brickwall. The dotted outline on the display is the ' +
    'signal before the limiter.',
  // RLS cannot show on a steady source (see `sources` below). The source order
  // is a recorded decision, so the words say where to go instead.
  exploreCaptionBySource: {
    'SINE 440 Hz': 'The source peaks at −20 dBFS — ceilings below that engage the brickwall. The dotted outline on the display is the signal before the limiter. A steady tone holds GR still, so RLS has nothing to recover from: it only shows on a transient. Choose CLICK 120.',
    'PINK NOISE': 'PINK NOISE source: a steady hiss peaking near −20 dBFS — ceilings below that engage the brickwall. The dotted outline on the display is the signal before the limiter. With no hits, GR hovers around one value, so RLS only shows clearly on a transient: choose CLICK 120.',
  },
  // SINE stays first: the ratified caption above and this lab's "constant gain
  // reduction" lesson both depend on a steady tone, and CEILING is expressible
  // on it. But RELEASE is NOT — a steady tone holds the peak follower at a
  // constant envelope, so GR never recovers and the release chips move nothing.
  // A transient is now one tap away, which is what RELEASE needs to be visible.
  sources: [srcSine(440), srcClick(120), SRC_PINK],
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
  Hero: (v, src) => (
    <TransferCurveGraph mode="limiter" thresholdDb={v[P.ceilingDb]} ceilingDb={v[P.ceilingDb]} sourcePeakDb={src?.steadyPeakDb} />
  ),
  anim: (v, src) => ({
    kind: 'dynamics',
    mode: 'limiter',
    thresholdDb: v[P.ceilingDb],
    ratio: 20,
    rangeDb: -40,
    ceilingDb: v[P.ceilingDb],
    makeupDb: 0,
    // "this lab’s limiter is a fast peak limiter" (the lab's own note) — the
    // ceiling is not negotiable, so the attack is effectively instant.
    // The `aA` line in Effects.hpp DynamicsEffect::processStereo (currently
    // :385) forces 0.1 ms in LimiterMode regardless of param 3, so
    // that is what the drawing depicts.
    attackMs: 0.1,
    releaseMs: v[P.releaseMs],
    holdMs: 0, // a limiter has no hold
    signal: dynSignalOf(src),
  }),
  heroBadge: 'TRANSFER CURVE — CALCULATED · GR METER — LIVE',
  heroCaption: (v) =>
    `Peaks are turned down to about ${v[P.ceilingDb]} dB. This limiter cannot look ahead, so a sharp hit can slip a few dB over first, and peaks between samples can poke above too (see ⓘ). Source at −20 dBFS → ${
      v[P.ceilingDb] < -20
        ? `${Math.abs(v[P.ceilingDb] + 20)} dB over: on a steady tone, that much constant gain reduction; on a CLICK, GR jumps on each hit and falls back at the RLS speed (watch the meter)`
        : 'under the ceiling, untouched'
    }.`,
  pollGr: 'limiter',
  note: 'True-peak (inter-sample) detection and lookahead are covered in the lesson (ⓘ) — this lab’s limiter is a fast peak limiter.',
  checks: [
    {
      question: 'A limiter is best described as…',
      options: [
        'A compressor with a very high ratio — peaks held at a ceiling',
        'A volume control that works faster',
        'An EQ for loud frequencies',
      ],
      correctIdx: 0,
      reveal:
        'At ∞:1 the transfer curve goes flat at the ceiling: input can rise all it wants, output stays. That is the safety-net job — which is why it most often sits LAST in the chain.',
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
/** The one source that shows OVERSAMPLING (audit decision 4, 2026-11-05). The
 *  generator's own sine, so no native change. 5 kHz at 48 kHz: the harmonics
 *  past Nyquist fold onto 3, 7, 13 kHz, none of them multiples of 5 kHz. On the
 *  engine's path (Effects.hpp shapeOversampled, re-run sample by sample in
 *  test/dec_A03) HARD CLIP's folded tones total −29 dBFS OFF, −46 dBFS ON at
 *  +24 dB, and −14 / −36 dBFS at +36 dB. Computed, not heard. */
const DIST_OS_HZ = 5000;
const SRC_SINE_5K = {
  ...srcSine(DIST_OS_HZ),
  label: 'SINE 5 kHz',
  short: '5 kHz',
  blurb: 'A high tone: its harmonics soon pass the top of the audio range, so OVERSAMPLING can be heard on it.',
};

/** Under the rack: the only place the OS key shows, since neither drawing
 *  takes it. Which source reveals it, and what OFF should do. */
function distOsCaption(v: Record<number, number>, src: FxSourceSpec): string {
  if (src.gen.frequency !== DIST_OS_HZ) return 'OVERSAMPLING barely shows on this source: choose SINE 5 kHz to hear it.';
  return v[P.oversample] > 0.5
    ? 'OS ON (CLEAN): most harmonics past the top of the audio range are filtered out. Now try OS OFF (ALIASING) on HARD CLIP at DRIVE +36 dB.'
    : 'OS OFF (ALIASING): harmonics past the top of the audio range fold back as new tones that are not harmonics of 5 kHz, so this should sound rougher than ON (CLEAN) once DRIVE clips the wave.';
}

const distConfig: FxLabConfig = {
  labId: 'distortion',
  guide: distortionScreenGuide,
  accuracy: false,
  fxId: FX.dist,
  title: 'DISTORTION LAB',
  subtitle: 'Clipping · Odd vs Even · Aliasing',
  intro:
    'Distortion reshapes the wave — and the SHAPE decides the harmonics. Symmetric clipping ' +
    '(same on top and bottom) makes only ODD harmonics; an asymmetric stage (like many single-ended tube stages) adds EVEN ones. ' +
    'Watch the wave change below.',
  exploreCaption: 'Sine source: what you hear as “grit” is the new harmonic series of the reshaped wave.',
  sources: [srcSine(220), SRC_SINE_5K, SRC_PINK],
  captionExtra: distOsCaption,
  params: [
    {
      // The teaching fader FIRST: push the wave into the clipper and watch the
      // flat-topping (and hear the grit) grow with every dB.
      label: 'DRIVE', paramId: P.driveDb, lessonKey: 'saturation',
      choices: [6, 12, 24, 36].map((d) => ({ label: `+${d} dB`, value: d })),
      // Owner 2026-10-16: +24 dB, so the first screen already shows (and
      // plays) the −20 dBFS sine clipping (+4 dB over the 0 dBFS ceiling);
      // +12 dB lifts it only to −8 dBFS, clean gain.
      initial: 24,
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
        { label: 'OFF (ALIASING)', value: 0 },
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
  anim: (v, src) => ({
    kind: 'distortion',
    type: v[P.distType] === 0 ? 'hard' : v[P.distType] === 1 ? 'soft' : 'tube',
    driveDb: v[P.driveDb],
    mix: v[P.distMix],
    srcIsNoise: isNoiseSrc(src),
  }),
  heroBadge: 'WAVESHAPE — TRUE LEVEL: input −20 dBFS (dim) · input × drive before the clip (dashed) · output (amber) · dashed bounds = 0 dBFS',
  heroCaption: (v) => {
    // True level (round 3): the −20 dBFS sine × DRIVE only reaches the 0 dBFS
    // ceiling past +20 dB, so the caption must not claim clipping below it.
    const peak = SOURCE_PEAK_DB + v[P.driveDb];
    // At exactly +20 dB the peak is 1.0 and the hard clipper (x > 1) still
    // cuts nothing, so 0 dBFS belongs to this branch too.
    if (v[P.distType] === 0 && peak <= 0)
      return `DRIVE +${Math.round(v[P.driveDb])} dB lifts the −20 dBFS sine to ${Math.round(peak)} dBFS — ${peak < 0 ? 'still under' : 'right at'} the 0 dBFS ceiling, so the hard clipper has nothing to cut yet: so far DRIVE is just gain. Push past +20 dB to flatten the tops.`;
    return v[P.distType] === 2
      ? 'Top and bottom clip DIFFERENTLY (asymmetric) → even harmonics join the odd ones — the “warm” sound of many tube stages.'
      : 'Top and bottom clip the SAME (symmetric) → odd harmonics only — hollow/harsh.';
  },
  note: 'Bitcrush and sample-rate reduction are real effects, but this lab does not draw them — the lesson (ⓘ) explains how they work.',
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
      wrongHint: 'Play the SINE source, raise DRIVE and watch its round tops bend flat — that bent shape IS the new harmonics. Then listen for the added buzz.',
    },
    {
      question: 'DRIVE and MIX both change how distorted it sounds. What does each actually do?',
      options: [
        'DRIVE sets how hard the wave hits the clipping stage (how harmonic-rich it gets); MIX blends that distorted signal back with the clean one',
        'They are the same control duplicated',
        'MIX adds more harmonics than DRIVE',
      ],
      correctIdx: 0,
      reveal:
        'Drive is the sound: how hard you push into the curve decides how bent — how harmonic-rich — the wave gets. MIX is the blend: 50% PARALLEL adds the clean, undriven signal back to the clipped one. Here, at DRIVE +24 dB, the clean copy sits about 20 dB under the distorted one, so the result is about 5 dB quieter and nearly as gritty. In a real mix the distorted copy is turned down until it sits under the clean one.',
      wrongHint: 'Raise DRIVE for more harmonics and watch the tops flatten, then switch MIX to 50% PARALLEL — the wave gets smaller, but DRIVE still decides the grit.',
    },
  ],
};
export const DistortionLabScreen = () => <FxLabScreen config={distConfig} />;

// ─────────────────────────────────────────────────────── LAB 12 · Phase ──
const PHASE_INV = P.invertR;
const PHASE_DLY = P.delayRms;
const phaseConfig: FxLabConfig = {
  labId: 'phase',
  guide: phaseScreenGuide,
  accuracy: false,
  fxId: FX.stereo,
  title: 'PHASE LAB',
  subtitle: 'Polarity vs Phase · Cancellation',
  intro:
    'POLARITY flips the whole wave (180° at every frequency). PHASE is a frequency-dependent ' +
    'time shift. They are not the same — the Lissajous and correlation below make the ' +
    'difference visible; mono-fold makes it audible.',
  exploreCaption: 'Sine + POL INVERTED Ø + FOLD MONO (L+R) = silence. That is total cancellation — the two channels erase each other.',
  sources: [srcSine(440), SRC_PINK],
  // EVERY PARAM OF A SHARED NODE MUST BE DECLARED HERE. `EffectChain::reset()`
  // only sets param 0 (enabled) to 0 — every other atomic keeps its last
  // written value for the life of the process (Effects.hpp:760). Chorus,
  // flanger and phaser are all FX.mod; phase and stereo are both FX.stereo. So
  // a lab that writes only a SUBSET of its node's params inherits the rest
  // from whichever lab touched them last. Worst case found 2026-09-12: leave
  // the flanger with MIX at 100%, open the PHASER, and mix_=1.0 makes the
  // output the pure all-pass — unity at every frequency, so no notches and no
  // audible phasing at all, while the hero above it draws textbook notches.
  fixed: [
    { paramId: P.widthPct, value: 100 },
    { paramId: P.pan, value: 0 },
    { paramId: P.bassMonoHz, value: 0 },
  ],
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
      // 0 ms IS the neutral state here — the two channels time-aligned. One of
      // only two teaching faders in the whole effect set with an honest home.
      fader: { min: 0, max: 10, snap: (v) => Math.round(v * 10) / 10, format: (v) => `${v} ms`, home: 0 },
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
  anim: (v, src) => ({
    kind: 'stereo',
    flavor: 'phase',
    widthPct: 100,
    pan: 0,
    invertR: v[PHASE_INV] > 0.5,
    delayRms: v[PHASE_DLY],
    monoFold: v[P.monoFold] > 0.5,
    srcIsNoise: isNoiseSrc(src),
  }),
  heroBadge: 'LISSAJOUS + CORRELATION — CALCULATED (440 Hz model)',
  // Delay captions scoped 2026-10-31 (two verifiers): on the 440 Hz model the
  // meter reads cos(2π·440·τ), negated when flipped — inverted it is −1.00
  // again at 2.3 ms and +0.99 at 1.1 ms — so a delay caption never claims a
  // value; the comb and "no flip fixes it" belong to full-range sound.
  heroCaption: (v) =>
    v[PHASE_INV] > 0.5 && v[PHASE_DLY] > 0
      ? `Flipped AND delayed ${v[PHASE_DLY]} ms: on this 440 Hz tone the CORRELATION now depends on the delay. On full-range sound like PINK NOISE, some frequencies cancel in mono and others add.`
      : v[PHASE_INV] > 0.5
      ? 'Correlation −1: fold to mono and it CANCELS. A polarity flip is 180° at ALL frequencies.'
      : v[PHASE_DLY] > 0
        ? `A ${v[PHASE_DLY]} ms delay shifts phase MORE at higher frequencies. On full-range sound like PINK NOISE that combs in mono, and no polarity flip fixes every frequency at once. On this one 440 Hz tone, a flip helps only at some delays.`
        : 'Identical channels: a vertical line, correlation +1.',
  checks: [
    {
      question: 'You set POL to INVERTED Ø and FOLD to MONO (L+R) — silence. Why?',
      options: [
        'The channels are equal and opposite — added together they cancel exactly',
        'MONO always lowers the level',
        'POL INVERTED mutes one side',
      ],
      correctIdx: 0,
      reveal:
        'Ø flips every value of one channel: +1 meets −1 everywhere, and the sum is zero. Real-world versions (miswired cable, doubled mic) cancel partially — the meter warns you before the club\u2019s mono PA does.',
      wrongHint: 'Set POL to INVERTED Ø and FOLD to MONO (L+R), then watch the OUT side of the flow go flat.',
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
        'The Ø button multiplies by −1 — every frequency flips at once, no time involved. Phase shift is a per-frequency timing offset. The button fixes a polarity problem (a miswired cable, two mics facing each other); it cannot fix an alignment problem.',
      wrongHint: 'The lab\u2019s intro names the distinction — and the DLY R fader is the phase side.',
    },
  ],
};
export const PhaseLabScreen = () => <FxLabScreen config={phaseConfig} />;

/** The Stereo Imaging caption's second half: what BASS-MONO really does (the
 *  engine high-passes the SIDE at the crossover, so only content below it
 *  changes, and only while a SIDE exists), then PAN (LissajousGraph takes no
 *  pan: it draws the width stage alone). Empty when both are at rest. */
function stereoCaptionExtras(v: Record<number, number>): string {
  const bass = !(v[P.bassMonoHz] > 0)
    ? ''
    : v[P.monoFold] > 0.5 || v[P.widthPct] === 0
      ? ' BASS-MONO changes nothing here: the SIDE is already gone.'
      : ` BASS-MONO ${v[P.bassMonoHz]} Hz: only content below ${v[P.bassMonoHz]} Hz changes, so nothing changes on the 440 Hz tone. Use PINK NOISE · STEREO on headphones; a phone speaker will not reproduce it.`;
  const pan = v[P.pan] !== 0 ? ' The goniometer above draws the width before the pan; the stage shows PAN.' : '';
  return bass + pan;
}

// ────────────────────────────────────────────────────── LAB 15 · Stereo ──
const stereoConfig: FxLabConfig = {
  labId: 'stereo',
  guide: stereoScreenGuide,
  accuracy: false,
  fxId: FX.stereo,
  title: 'STEREO IMAGING LAB',
  subtitle: 'Width · M/S · Mono safety',
  intro:
    'Width scales the SIDE (difference) signal against the MID. Wider sounds bigger — until ' +
    'you fold to mono and the sides vanish. The correlation meter is the safety gauge.',
  exploreCaption: 'Widen, then hit MONO-FOLD: what survives is what a mono listener gets.',
  sources: [SRC_PINK, srcSine(440)],
  // Engine 10 (next-build queue item 11): every source above is MONO (L = R),
  // so the side is zero and WIDTH changes nothing you can hear. A build that
  // can render the stereo spread offers genuinely two-channel sources — the
  // SAME stereo test signal the scope and the flow draw (R lags L by
  // STEREO_TEST_LR_RAD, correlation +0.45) — and keeps a mono one as the
  // "nothing to widen" comparison. Older builds keep the list above.
  stereoSources: [SRC_PINK_STEREO, SRC_SINE_STEREO, SRC_PINK_MONO],
  // See the note on the other shared-node configs: FX.stereo is shared with the
  // PHASE lab, so leaving POLARITY out let an INVERTED Ø from that lab follow
  // the student here, where it silently makes WIDTH act anti-phase.
  fixed: [
    { paramId: P.invertR, value: 0 },
    { paramId: P.delayRms, value: 0 },
  ],
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
      // 100% is the stereo image as recorded — neither narrowed nor widened.
      // The other honest home in the set.
      fader: { min: 0, max: 200, snap: (v) => Math.round(v / 5) * 5, format: (v) => `${Math.round(v)}%`, home: 100 },
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
    { k: 'BASS', paramId: P.bassMonoHz },
    { k: 'FOLD', paramId: P.monoFold },
  ],
  // The MONO comparison source draws as it sounds: L = R, a vertical line at
  // every width (engine 10). Every other source is the stereo test tone.
  Hero: (v, src) => (
    <LissajousGraph widthPct={v[P.widthPct]} invertR={false} delayRms={0} toneHz={440} inputLrRad={src?.monoCompare ? 0 : STEREO_TEST_LR_RAD} />
  ),
  anim: (v, src) => ({
    kind: 'stereo',
    flavor: 'width',
    widthPct: v[P.widthPct],
    pan: v[P.pan],
    invertR: false,
    delayRms: 0,
    monoFold: v[P.monoFold] > 0.5,
    monoIn: src?.monoCompare === true,
    bassMonoHz: v[P.bassMonoHz],
  }),
  heroBadge: 'GONIOMETER + CORRELATION — 440 Hz STEREO TEST TONE (model)',
  // Owner 2026-10-24: with PINK · MONO selected these hold only for the stereo
  // sources, so they are hidden (badge, the >100% caption, both checks' hints:
  // under MONO the goniometer stays a vertical line at every width).
  monoCompareHides: { badge: true, caption: (v) => v[P.monoFold] <= 0.5 && v[P.widthPct] > 100, wrongHintChecks: [0, 1] },
  heroCaption: (v) =>
    (v[P.monoFold] > 0.5
      ? 'MONO CHECK: L and R are added, so the SIDE cancels and only the MID is heard. The goniometer above still draws the signal before the fold.'
      : v[P.widthPct] > 100
        ? 'Past 100% the SIDE is boosted above its natural balance with the MID — huge on headphones, hollow in mono. Watch the correlation.'
        : v[P.widthPct] === 0
          ? 'Width 0 = pure MID: a vertical line, perfectly mono-safe.'
          : 'The classic trade: width vs mono safety.') + stereoCaptionExtras(v),
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
      wrongHint: 'Push WIDTH to 200%: the needle crosses zero to −0.20. The further it travels toward −1, the more of the mix cancels in mono.',
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
      wrongHint: 'Watch the goniometer’s vertical line open out sideways as WIDTH rises.',
    },
  ],
};
export const StereoLabScreen = () => <FxLabScreen config={stereoConfig} />;
