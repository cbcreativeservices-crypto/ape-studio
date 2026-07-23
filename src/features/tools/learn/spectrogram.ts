/**
 * Learn-mode content — Tool 4: Spectrogram.
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §12 (Tool 4 —
 * Spectrogram: core learning outcomes, View 4 — Learn, required warnings)
 * and §15 Module 6 (Spectrogram Interpretation). Authored 2026-07-23.
 *
 * Data-only module: assembled by ./index.ts, no React, no logic.
 */
import type { ToolLearnContent } from './types';

export const SPECTROGRAM_LEARN: ToolLearnContent = {
  tool: 'spectrogram',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body:
        'A spectrogram is a moving picture of the spectrum: time runs horizontally, frequency runs vertically, and color or intensity shows how much energy is present at each point. Every vertical slice is one short spectrum measurement, and the display stacks thousands of them side by side as the signal scrolls past. This is the one display in the suite that answers the question "when did that frequency happen?" — the waveform shows when but not what frequency, and the RTA shows what frequency but not when.',
    },
    {
      head: 'COLOR IS RELATIVE',
      body:
        'The color scale maps a range of decibel values to a range of colors, and that mapping is set by the dynamic range control — it is not an absolute loudness reference. The same signal can look intense on a 40 dB scale and faint on a 90 dB scale without anything about the sound changing. Before you interpret color, check the scale; before you compare two spectrograms, confirm they were captured with the same dynamic range and floor settings. Reading level from color is only precise to a few dB even under ideal conditions.',
    },
    {
      head: 'THE TIME-FREQUENCY TRADE-OFF',
      body:
        'Each vertical slice comes from an FFT computed over a short window of audio, and the window length forces a trade: a long window separates nearby frequencies clearly but smears fast events across time, while a short window catches transients sharply but blurs frequencies together. There is no setting that gives you both at once — this is a mathematical limit, not a software flaw. That is why the tool offers presets like Speech, Low Frequency, Transient, and Feedback/Ringing: each one chooses the compromise appropriate to what you are trying to see.',
    },
    {
      head: 'THE NOISE FLOOR',
      body:
        'Rooms and electronics are never silent, so a real spectrogram always shows a faint haze of low-level background energy — that is the noise floor, not a defect in the display. Raising the dynamic range reveals more of it; lowering the range hides it below the display floor, but hiding it does not remove it. An apparently clean, black background usually means the floor is set above the noise, not that the noise is gone. Learning what your normal noise floor looks like is what lets you spot when something new — hum, HVAC, a buzzing fixture — has been added to it.',
    },
    {
      head: 'RECOGNIZING PATTERNS',
      body:
        'Feedback appears as a thin, unwavering horizontal line at a single frequency that persists and grows brighter over time — unlike musical notes, it does not start, stop, or move. Speech shows short bursts with stacked, gently bending harmonic bands during vowels, gaps between words, and broadband splashes of high-frequency energy on sibilants. Music tends to show steadier harmonic ladders that step with the melody, plus vertical stripes on drum hits — a transient is a brief event spread across many frequencies, so it draws a vertical line, while a sustained tone draws a horizontal one. Hum sits as a fixed line at 50 or 60 Hz, often with harmonics above it.',
    },
    {
      head: 'SPECTROGRAM VS RTA',
      body:
        'The RTA collapses recent audio into one live spectrum, usually averaged into octave or third-octave bands — good for judging overall tonal balance, but everything that happened is merged into a single curve. The spectrogram keeps the history: it shows narrower frequency detail and preserves exactly when each event occurred. Use the RTA to ask "what is the balance right now?" and the spectrogram to ask "what happened, at what frequency, and when?" They are different summaries of the same signal, not competing versions of one measurement.',
    },
    {
      head: 'MEASUREMENT DISCIPLINE',
      body:
        'Freeze the display before you try to read details — scrolling pixels invite guesses, and a frozen or saved snapshot lets you inspect a time and frequency region deliberately. Note the FFT preset, dynamic range, and frequency range with every snapshot, because a comparison between captures made with different settings is not a valid comparison. And remember that visible is not the same as audible or important: the display will happily show energy that no listener would ever notice, so let your ears and the measurement discipline decide what matters.',
    },
  ],
  misconceptions: [
    {
      claim: 'Brighter color means the sound is louder.',
      truth:
        'Color only shows level relative to the selected scale. The dynamic range setting decides which dB values map to which colors, so the same sound can look intense on a narrow scale and faint on a wide one. To judge actual level you need the scale settings — or an SPL tool, which measures loudness directly.',
    },
    {
      claim: 'The spectrogram and the RTA show the same thing.',
      truth:
        'They analyze the same signal but answer different questions. The RTA merges recent audio into one banded spectrum with no history, while the spectrogram preserves when each frequency occurred. A feedback ring and a sustained synth note can look similar on an RTA; the spectrogram separates them because it shows behavior over time.',
    },
    {
      claim: 'A bigger FFT is always better.',
      truth:
        'A longer FFT window improves frequency resolution but smears events in time, so transients blur into streaks. A shorter window does the opposite: crisp timing, blurry frequency. Neither is "better" — the right setting depends on whether you are chasing a narrow tone or a fast event, which is exactly what the presets encode.',
    },
    {
      claim: 'If I can see it on the spectrogram, I can hear it.',
      truth:
        'The display has no ears. It will render low-level energy that is completely masked by louder sounds, and energy far below anything a listener would notice. Visibility depends on the dynamic range setting, not on audibility — so the spectrogram tells you what is present, and your ears plus level measurements tell you what matters.',
    },
    {
      claim: 'A clean black background means the room is silent.',
      truth:
        'It usually means the display floor is set above the noise floor. Every real room and signal chain has continuous low-level energy; widen the dynamic range and the background haze reappears. The noise did not go anywhere — the display simply stopped drawing it.',
    },
    {
      claim: 'Feedback looks like a sudden burst of everything.',
      truth:
        'Feedback is the opposite of broadband: it is a single frequency ringing in a loop, so it appears as one thin horizontal line that holds steady and grows brighter. Broadband vertical splashes are transients like drum hits or handling noise. Learning this distinction is what makes the spectrogram a practical feedback-hunting tool.',
    },
  ],
  warnings: [
    {
      text: 'Color intensity is relative to the selected scale.',
      why:
        'The dynamic range control decides which dB values map to which colors, so identical audio can look dramatic or faint depending on settings — color is not an absolute level reading.',
    },
    {
      text: 'FFT/window settings affect time and frequency detail.',
      why:
        'The analysis window forces a trade-off: what looks like a smeared transient or a blurred pair of tones may be the settings, not the signal.',
    },
    {
      text: 'Noise floor may appear as low-level background energy.',
      why:
        'Real rooms and electronics are never silent; the faint haze at the bottom of the scale is expected and should not be mistaken for a problem with the signal or the tool.',
    },
    {
      text: 'Do not compare spectrograms with different dynamic range settings without caution.',
      why:
        'Changing the scale changes what is drawn and how bright it looks, so differences between two captures may reflect display settings rather than real acoustic change.',
    },
    {
      text: 'This view shows frequency over time, not waveform amplitude.',
      why:
        'A spectrogram is not an oscilloscope: it cannot show waveform shape, polarity, or instantaneous amplitude — use the Waveform Viewer for time-domain inspection.',
    },
  ],
  glossaryTerms: [
    'spectrogram',
    'FFT',
    'window function',
    'frequency resolution',
    'time resolution',
    'dynamic range',
    'noise floor',
    'feedback',
    'fundamental frequency',
    'harmonics',
    'transient',
    'sibilance',
  ],
  relatedConcepts: ['spectrogram-interpretation', 'measurement-integrity'],
};
