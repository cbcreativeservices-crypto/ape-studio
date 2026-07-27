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

export type ToolId = 'signalgen' | 'rta' | 'spectrogram' | 'spl';

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

/** The tool's help content, or undefined for an unknown id. */
export function getToolLesson(id: ToolId): LessonContent | undefined {
  return TOOL_LESSONS[id];
}

/** Per-tool control help — the same two-tier popup as the labs. Returns a
 *  `help(key)` opener and the `sheet` element to render once at the screen root.
 *  Renders nothing (and help is a no-op) for an unknown tool id. */
export function useToolHelp(toolId: ToolId): { help: (key: string) => void; sheet: React.JSX.Element | null } {
  const lesson = getToolLesson(toolId);
  const [key, setKey] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const help = useCallback((k: string) => {
    setKey(k);
    setOpen(true);
  }, []);
  const sheet = lesson ? (
    <GuidedLessonSheet visible={open} lesson={lesson} controlKey={key} onClose={() => setOpen(false)} />
  ) : null;
  return { help, sheet };
}
