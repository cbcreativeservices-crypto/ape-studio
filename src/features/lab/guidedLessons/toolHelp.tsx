/**
 * toolHelp — per-control "what it does" help for the MEASUREMENT TOOLS (owner
 * request 2026-07-26). The tools aren't LabIds, so their content lives here as
 * LessonContent (the renderable shape the GuidedLessonSheet uses) and rides the
 * SAME two-tier popup as the labs: a small "what this control does / shows on
 * this screen" first, "Learn more" for the full stack.
 *
 * Honesty (§1.7): these describe what a control does and what a readout SHOWS —
 * they never claim a calibrated measurement (the tools already badge their own
 * dBFS/uncalibrated limits).
 */
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { GuidedLessonSheet } from './GuidedLessonSheet';
import type { LessonContent } from './types';

export type ToolId =
  | 'signalgen'
  | 'rta'
  | 'spectrogram'
  | 'spl'
  | 'waveform'
  | 'freqcounter'
  | 'rt60';

export const TOOL_LESSONS: Record<ToolId, LessonContent> = {
  // ── Signal Generator ──────────────────────────────────────────────────────
  signalgen: {
    name: 'Signal Generator',
    tagline: 'Make a known test signal.',
    whatItIs:
      'Produces precise, known signals — tones, noise, sweeps, clicks — so you can excite a ' +
      'system and see how it responds. Because the source is known, anything different at the ' +
      'output is the system, not the signal.',
    controls: [
      { key: 'signal', name: 'Signal type', definition: 'What waveform to generate: a pure sine (one frequency), noise colors (all frequencies at once), a sweep (a moving tone), or clicks/impulses (timing tests).' },
      { key: 'frequency', name: 'Frequency', definition: 'The pitch of the sine, in Hz — how many cycles per second. Sets which single frequency you’re sending.', range: '20 Hz – 20 kHz' },
      { key: 'sweep', name: 'Sweep', definition: 'Glides the frequency from a start to an end over a set time — one pass reveals a system’s whole frequency response. Repeat loops it.' },
      { key: 'click_tempo', name: 'Click tempo', definition: 'How often the click/impulse repeats (BPM). Clicks are for timing and echo/reverb tests — each one is a sharp, broadband event.' },
      { key: 'output_level', name: 'Output level', definition: 'How loud the generator runs, in dBFS. Kept well below 0 dBFS by default so nothing clips; a hard cap protects your ears and the speaker.' },
      { key: 'safety', name: 'Speaker safety', definition: 'A protective high-pass on the built-in speaker so very low tones don’t over-excurse the tiny driver. Shown honestly — it filters what you hear on the phone speaker.' },
      { key: 'status', name: 'Output status (readout)', definition: 'The level actually leaving the output after the safety cap — labeled dBFS · uncalibrated (never SPL). A CAP badge shows when the −12 dBFS hard cap is holding the level below what you asked for.' },
    ],
    commonMistakes: [
      'Blasting a low sine on the phone speaker — small drivers can’t reproduce it and distort or over-excurse; use headphones for true low end.',
      'Reading the output level as SPL — it is dBFS (digital full scale), not a calibrated sound-pressure level.',
      'Forgetting a sweep is MOVING — a single spectrum snapshot of a sweep is only that instant, not the whole response.',
    ],
    proTips: [
      'Pink noise + the RTA is the fastest way to see a system’s tonal balance.',
      'A click into the RT60 or Spectrogram shows a room’s decay and reflections.',
    ],
    formula: 'Sine: level in dBFS (0 = full scale). Sweep covers f_start → f_end in T seconds. Click repeats every 60/BPM seconds.',
  },

  // ── RTA (Real-Time Analyzer) ──────────────────────────────────────────────
  rta: {
    name: 'Real-Time Analyzer',
    tagline: 'Energy per frequency band, live.',
    whatItIs:
      'Splits the incoming sound into frequency bands and shows how much energy is in each, ' +
      'updating live — the tonal balance at a glance. Levels are dBFS (uncalibrated), so read ' +
      'the SHAPE across bands, not absolute loudness.',
    controls: [
      { key: 'banding', name: 'Band resolution', definition: 'How finely the spectrum is split: 1/1-octave is coarse and quick to read; 1/3-octave is finer, closer to how we hear tonal balance.' },
      { key: 'averaging', name: 'Averaging', definition: 'How much the bars are smoothed over time. More averaging steadies a jumpy display so you can read the trend; less reacts instantly.' },
      { key: 'peak', name: 'Peak (readout)', definition: 'The highest instantaneous sample level right now, in dBFS — can briefly exceed the RMS bars on transients.' },
      { key: 'peak_hold', name: 'Peak hold (readout)', definition: 'The maximum level seen since the last reset — catches brief peaks your eye would miss.' },
      { key: 'bands', name: 'Bands (readout)', definition: 'How many frequency bands are being displayed at the current resolution.' },
      { key: 'marks', name: 'What the display shows', definition: 'Each bar is one frequency band, low (left) → high (right); bar height is that band’s level. A thin cap floating above a bar is its peak-hold. Bars drawn GRAY are “not resolvable” — the FFT can’t reliably separate that low band at this window size, so the app dims them instead of faking a value.' },
    ],
    commonMistakes: [
      'Chasing a “flat” analyzer — flat is not the goal; the RTA informs, ears decide.',
      'Reading dBFS bands as room SPL — this is an uncalibrated phone mic, not an SPL meter.',
      'Trusting a jumpy display — raise averaging before judging tonal balance.',
    ],
    proTips: [
      'Feed pink noise and look for the overall tilt — a well-balanced system reads roughly even across bands with pink noise.',
      '1/3-octave for tonal decisions; 1/1-octave for a quick glance.',
    ],
    formula: 'Octave bands: center f_n, band edges f_n·2^(±1/2N) for 1/N-octave. Level per band = 10·log₁₀(Σ power) dBFS.',
  },

  // ── Spectrogram ───────────────────────────────────────────────────────────
  spectrogram: {
    name: 'Spectrogram',
    tagline: 'Frequency over TIME.',
    whatItIs:
      'A scrolling picture of frequency (vertical) versus time (horizontal), with brightness/ ' +
      'color as level. It shows how a sound evolves — sweeps, decays, harmonics appearing and ' +
      'fading — that a single spectrum can’t.',
    controls: [
      { key: 'db_range', name: 'dB range', definition: 'The span of levels mapped to the color scale. A narrow range shows faint detail (and more noise); a wide range shows only the strongest content.' },
      { key: 'obs_max', name: 'Observed max (readout)', definition: 'The loudest level seen — the top of the current color mapping, so colors stay meaningful as levels change.' },
      { key: 'peak', name: 'Peak (readout)', definition: 'The current instantaneous peak level in dBFS.' },
      { key: 'history', name: 'History (readout)', definition: 'How many time-columns are on screen — how far back in time the display reaches.' },
      { key: 'marks', name: 'What the display shows', definition: 'Time runs left→right (newest at the right edge); the VERTICAL axis is frequency (low at the bottom, high at the top); COLOR/brightness is level. A rising diagonal streak is a sweep climbing in pitch; horizontal lines are steady tones; faint trailing repeats after a bright onset are a room’s reflections.' },
    ],
    commonMistakes: [
      'Reading it like a waveform — vertical is FREQUENCY, not amplitude; brightness is level.',
      'Too wide a dB range hides the interesting quiet detail (reflections, tails); narrow it to reveal them.',
      'Forgetting it’s uncalibrated dBFS — the colors are relative levels, not SPL.',
    ],
    proTips: [
      'Send a slow sweep and watch the diagonal line — kinks or gaps are resonances or dead spots.',
      'A click shows a room’s reflections as faint repeats trailing the bright onset.',
    ],
    formula: 'Each column = one FFT of a short window; row = frequency bin (bin k → k·fs/N Hz); color = 10·log₁₀(power) dBFS.',
  },

  // ── SPL Meter ─────────────────────────────────────────────────────────────
  spl: {
    name: 'SPL Meter',
    tagline: 'How loud — weighted + timed.',
    whatItIs:
      'Estimates sound-pressure level with a frequency weighting and a time response, like a ' +
      'sound-level meter. On a phone it’s APPROXIMATE unless field-calibrated against a real ' +
      'meter — the tool says so, and shows the calibration state.',
    controls: [
      { key: 'weighting', name: 'Weighting (Z/A/C)', definition: 'Which frequency curve to apply before measuring: Z = flat (unweighted); A = de-emphasizes lows to match quiet-level hearing (the common one); C = nearly flat, for loud/peak levels.' },
      { key: 'response', name: 'Time response', definition: 'How fast the meter reacts: FAST (125 ms) follows quick changes; SLOW (1 s) averages for a steadier reading of continuous sound.' },
      { key: 'calibration', name: 'Calibration', definition: 'A one-time offset that aligns the phone reading to a reference meter. Until set, readings are “dBFS · uncalibrated approximate”; after, “dB SPL · field-calibrated (approximate)”.' },
      { key: 'reading', name: 'The big number (readout)', definition: 'The current weighted, time-averaged level — labeled like LAF (A-weighted, Fast) or LZS (Z, Slow). The unit says dB SPL only after calibration; otherwise dBFS · uncalibrated.' },
      { key: 'session_log', name: 'Session log', definition: 'Saved snapshots of the session average (Leq), the level averaged over the elapsed time — the single number that best summarizes “how loud was it overall.”' },
      { key: 'marks', name: 'What the display shows', definition: 'The eyebrow spells out the exact weighting × response in use (e.g. LAF = A-weighted, Fast); the large value is that level right now; the unit line is the honest calibration state. There is no chart — the number IS the measurement.' },
    ],
    commonMistakes: [
      'Treating an uncalibrated phone reading as a certified dB SPL — it is approximate; calibrate against a real meter first.',
      'Using A-weighting for loud peaks — A under-reads low-frequency energy; C or Z is more honest at high levels.',
      'Comparing FAST and SLOW numbers directly — they average differently; pick one and stay consistent.',
    ],
    proTips: [
      'A-weighting + SLOW is the standard for ambient/room-level checks.',
      'Field-calibrate once (steady pink noise against a reference) and the offset persists on the device.',
    ],
    formula: 'SPL ≈ 20·log₁₀(p/p₀), p₀ = 20 µPa. Weighting applies the A/C curve; FAST/SLOW set the integration time (125 ms / 1 s).',
  },

  // ── Waveform (oscilloscope-style envelope) ────────────────────────────────
  waveform: {
    name: 'Waveform',
    tagline: 'Pressure over time.',
    whatItIs:
      'Shows the signal’s amplitude over time — the classic “what the pressure is doing” view. ' +
      'Here it’s an envelope: each column summarizes ~50 ms of audio (its loudest positive and ' +
      'negative excursions), newest at the right, so several seconds fit on screen.',
    controls: [
      { key: 'envelope', name: 'Min/max envelope', definition: 'The tall filled shape: for each ~50 ms column, how far the wave swung up (top) and down (bottom). Its overall height is loudness over time.' },
      { key: 'rms', name: 'RMS band', definition: 'The fainter inner band — the average (root-mean-square) energy of each column. It tracks perceived loudness better than the raw peaks do.' },
      { key: 'clip', name: 'Clip ticks', definition: 'Red marks in the top lane flag columns where the input hit full scale (0 dBFS) and clipped — the measurement there is invalid, not just loud.' },
      { key: 'marks', name: 'What the display shows', definition: 'Time runs left→right (newest at the right edge); the centre line is silence (zero pressure); distance above/below it is how hard the air was pushed/pulled. The top strip is the clip lane — red ticks there mean overload.' },
    ],
    commonMistakes: [
      'Reading the envelope as the actual waveform shape — at this zoom each column is a 50 ms SUMMARY (min/max), not the individual cycles.',
      'Ignoring red clip ticks — once it clips, the shape is chopped and any level/analysis from that moment is unreliable; lower the input.',
      'Confusing this with the spectrogram — here the vertical axis is AMPLITUDE, not frequency.',
    ],
    proTips: [
      'Watch the RMS band vs the peaks — a big gap means lots of transients (percussive); a small gap means dense/compressed material.',
      'Clap or click and watch a single spike travel — a clean, sharp transient with no clip ticks is your goal for timing tests.',
    ],
    formula: 'Column = min/max of ~50 ms of samples; RMS = √(mean(x²)) over the column. Full scale = 0 dBFS; clip flagged at ≥ 3 samples at/over full scale.',
  },

  // ── Frequency Counter / Pitch ─────────────────────────────────────────────
  freqcounter: {
    name: 'Frequency Counter',
    tagline: 'How high — and how fast.',
    whatItIs:
      'Detects the pitch of a steady tone (or counts repeating events like clicks) and reports ' +
      'it with a confidence figure, so you can trust — or distrust — the number. Uncalibrated ' +
      'level, but the FREQUENCY itself is accurate for clear, steady signals.',
    controls: [
      { key: 'confidence', name: 'Confidence (readout)', definition: 'How sure the detector is that it found a real, single pitch (0–100%). Low confidence = noisy, chordal, or too quiet — don’t trust the Hz reading below it.' },
      { key: 'input_level', name: 'Input level (readout)', definition: 'How strong the incoming signal is, in dBFS. Too quiet and pitch detection gets unreliable (the STATUS reads LOW SIGNAL).' },
      { key: 'status', name: 'Status (readout)', definition: 'LISTENING = searching; STABLE = a confident, steady pitch is locked; LOW SIGNAL = too quiet to measure. It tells you whether to trust the current number.' },
      { key: 'events_sec', name: 'Events / sec (readout)', definition: 'In counter mode: how many repeating events (clicks, taps) are detected per second — a rate rather than a musical pitch.' },
      { key: 'period', name: 'Period (readout)', definition: 'The time for one cycle/event, in ms — the inverse of frequency (period = 1000 / Hz).' },
      { key: 'bpm', name: 'BPM (readout)', definition: 'The event rate expressed as beats per minute (events/sec × 60) — handy for tempo/click work.' },
      { key: 'stability', name: 'Stability (readout)', definition: 'How steady the detected rate/pitch is over recent readings — high stability means a reliable, unwavering source.' },
      { key: 'min', name: 'Min (readout)', definition: 'The lowest frequency seen since the last reset — the bottom of the range you’ve produced.' },
      { key: 'max', name: 'Max (readout)', definition: 'The highest frequency seen since the last reset — the top of the range.' },
      { key: 'marks', name: 'What the display shows', definition: 'The big number is the current frequency (Hz) or event rate; the smaller cells around it qualify it — confidence and input level tell you HOW MUCH to trust it, status tells you the detector’s state, min/max bracket the range.' },
    ],
    commonMistakes: [
      'Trusting the Hz when confidence is low — a noisy or chordal input produces a number, but not a meaningful one.',
      'Measuring a pitch that’s too quiet — raise the source or move the phone closer until STATUS leaves LOW SIGNAL.',
      'Expecting a musical pitch from clicks — use counter mode (events/period/BPM) for repeating impulses, pitch mode for tones.',
    ],
    proTips: [
      'Watch confidence, not just the Hz — a stable number at 90%+ confidence is trustworthy; a jumpy number at 20% is not.',
      'Period and frequency are two views of the same thing — 1000 / Hz = period in ms.',
    ],
    formula: 'Pitch via autocorrelation/YIN; frequency = 1 / period. Counter: events/sec, BPM = events/sec × 60, period(ms) = 1000 / (events/sec).',
  },

  // ── RT60 (reverb decay) ───────────────────────────────────────────────────
  rt60: {
    name: 'RT60 Reverb Time',
    tagline: 'How long a space rings.',
    whatItIs:
      'Measures how long sound takes to decay in a room. You make a sharp sound (a clap/click); ' +
      'the tool records the tail, plots the decay, and fits a straight line to estimate the time ' +
      'to fall 60 dB — RT60 — per octave band, because rooms decay differently at different pitches.',
    controls: [
      { key: 'rt60', name: 'RT60 (readout)', definition: 'The headline result: the time (seconds) for the sound to decay 60 dB. Short = a dry, treated room; long = a live, reflective space. It’s frequency-dependent, so it’s shown per band.' },
      { key: 'edt', name: 'EDT (readout)', definition: 'Early Decay Time — RT extrapolated from just the first 10 dB of decay. It tracks the room’s PERCEIVED liveness better than the full RT60, which is dominated by the late tail.' },
      { key: 't20', name: 'T20 (readout)', definition: 'RT60 estimated by fitting the −5 to −25 dB portion of the decay (×3). Robust when the noise floor is close — you only need 20 clean dB.' },
      { key: 't30', name: 'T30 (readout)', definition: 'RT60 estimated from the −5 to −35 dB portion (×2). More of the decay = more reliable, but it needs a quieter room / stronger source to see 30 clean dB.' },
      { key: 'r2', name: 'R² (readout)', definition: 'How straight the decay was — the fit quality (1.0 = perfectly straight line). Low R² means a noisy or non-exponential decay: treat the RT number with suspicion.' },
      { key: 'decay_range', name: 'Decay range (readout)', definition: 'How many clean dB of decay were captured above the noise floor. Too small and the fit can’t reach T20/T30 honestly — the tool tells you rather than guessing.' },
      { key: 'band', name: 'Octave band (readout)', definition: 'Which frequency band each row is for. Bass usually rings longer than treble, which is why RT60 is reported band-by-band, not as one number.' },
      { key: 'marks', name: 'What the display shows', definition: 'The curve is the decaying sound level over time (a Schroeder integration — a smooth downhill slope). The straight fit line laid over it is what the RT is measured from; where that line would cross −60 dB is the RT60. The flattening at the bottom is the noise floor — decay below it is unmeasurable, so the fit stops there.' },
    ],
    commonMistakes: [
      'Trusting an RT with low R² or tiny decay range — a noisy, short capture gives a number that isn’t real; re-capture with a sharper, louder source.',
      'Using one RT for the whole room — it changes with frequency; read the bands, don’t average them away.',
      'Weak source into a noisy room — you need a clean ~30–40 dB of decay above the noise floor for a trustworthy T30.',
      'Confusing EDT with RT60 — EDT (first 10 dB) is about perceived liveness; RT60/T30 is the full decay.',
    ],
    proTips: [
      'A balloon pop or sharp hand-clap is a great free impulse — loud, broadband, and short.',
      'If T20 and T30 disagree a lot, the decay isn’t a clean straight line — trust EDT/T20 and note the room is complex.',
    ],
    formula: 'Schroeder backward integration → decay curve; linear fit over −5…−25 dB (T20 ×3) or −5…−35 dB (T30 ×2) extrapolated to −60 dB. R² = fit straightness; RT60 is frequency-dependent.',
  },
};

/** A section header with a tap-for-help ⓘ — the tools' control-group help
 *  affordance (each tool passes its own header text style so the look is
 *  unchanged). */
export function HelpHead({
  title,
  onHelp,
  style,
}: {
  title: string;
  onHelp: () => void;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={helpHeadStyles.row}>
      <Text style={style}>{title}</Text>
      <Pressable onPress={onHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title} — what it does`}>
        <Text style={helpHeadStyles.info}>ⓘ</Text>
      </Pressable>
    </View>
  );
}

const helpHeadStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  info: { color: '#ffc64d', fontSize: 13, marginTop: 1 },
});

/** "ⓘ WHAT THE DISPLAY SHOWS" — placed by each tool near its chart/readouts to
 *  open the whole-tool guide (readouts + reference marks + concept). */
export function DisplayGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="What the display shows — readouts and reference marks explained"
      style={guideStyles.btn}
    >
      <Text style={guideStyles.text}>ⓘ WHAT THE DISPLAY SHOWS</Text>
    </Pressable>
  );
}

const guideStyles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: 'rgba(255,198,77,.07)',
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  text: { color: '#ffc64d', fontSize: 11, letterSpacing: 0.8, fontWeight: '600' },
});

/** Derive a readout's help key from its on-screen label (e.g. "PEAK HOLD" →
 *  "peak_hold", "OBS MAX" → "obs_max") — matches the readout control keys above,
 *  so a StatCell can wire long-press-for-help with no per-cell key. */
export const readoutKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** The tool's help content, or undefined for an unknown id. */
export function getToolLesson(id: ToolId): LessonContent | undefined {
  return TOOL_LESSONS[id];
}

/** Per-tool control help — the same two-tier popup as the labs.
 *  • help(key)  — focused: a control's or readout's "what it does / what it shows".
 *  • helpAll()  — the whole-tool DISPLAY GUIDE: what the display shows + every
 *                 readout + reference mark + concept (opens with no focus).
 *  • sheet      — render once at the screen root.
 *  No-op / null for an unknown tool id. */
export function useToolHelp(toolId: ToolId): {
  help: (key: string) => void;
  helpAll: () => void;
  sheet: React.JSX.Element | null;
} {
  const lesson = getToolLesson(toolId);
  const [key, setKey] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const help = useCallback((k: string) => {
    setKey(k);
    setOpen(true);
  }, []);
  const helpAll = useCallback(() => {
    setKey(undefined);
    setOpen(true);
  }, []);
  const sheet = lesson ? (
    <GuidedLessonSheet visible={open} lesson={lesson} controlKey={key} onClose={() => setOpen(false)} />
  ) : null;
  return { help, helpAll, sheet };
}
