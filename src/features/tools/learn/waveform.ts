/**
 * Learn-mode content — Tool 3: Waveform Viewer.
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §11 (Tool 3 —
 * Waveform Viewer), 2026-07-23. Data-only module; assembled by ./index.ts.
 */
import type { ToolLearnContent } from './types';

export const WAVEFORM_LEARN: ToolLearnContent = {
  tool: 'waveform',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body:
        'The waveform is a graph of amplitude over time: the horizontal axis is time, the vertical axis is signal level, and the trace swings above and below a center zero line just like an oscilloscope. Everything above the zero line is positive pressure or voltage, everything below is negative, and silence sits flat on the line itself. At normal zoom you are not seeing individual wave cycles — you are seeing an envelope, the outline of thousands of cycles per second compressed into each pixel column.',
    },
    {
      head: 'HOW TO READ IT',
      body:
        'Sharp vertical spikes are transients — drum hits, consonants, clicks — while wide sustained blocks are held notes, pads, or noise. The outer peak envelope shows the extremes the signal reaches; the denser inner band shows RMS energy, which tracks perceived loudness far better than peak height does. A big gap between the peak outline and the RMS band means a dynamic, spiky signal; a waveform that looks like a solid brick means heavy compression or limiting. Zoom in on time until you can see individual cycles before making any claim about the fine shape of the signal.',
    },
    {
      head: 'RECOGNIZING CLIPPING',
      body:
        'Clipping happens when the signal is driven past full scale and the tops and bottoms of the waveform are sliced flat. The visible symptoms are squared-off plateaus where smooth rounded peaks should be, and the tool marks runs of consecutive full-scale samples on the timeline. One isolated sample touching 0 dBFS is a full-scale peak, not proof of clipping — it is the flat runs that tell you information was destroyed. Once a peak has been flattened, the original shape is gone; turning the level down afterward makes it quieter but does not repair it.',
    },
    {
      head: 'VERTICAL ZOOM IS NOT GAIN',
      body:
        'Vertical zoom rescales the drawing, not the audio: the trace gets taller on screen while the signal level in dBFS stays exactly the same. Always read level from the amplitude axis and the measured peak values, never from how much of the display the waveform fills. This matters most in auto-normalized views, where the display stretches every signal to fit — two files at wildly different levels can look identical. When comparing anything, lock both views to the same fixed scale first.',
    },
    {
      head: 'WHAT IT CANNOT TELL YOU',
      body:
        'A waveform cannot tell you how loud something sounds: height shows peak amplitude, but perceived loudness depends on average energy, duration, and frequency content, which is why loudness is measured in LUFS or SPL, not pixels. It also cannot show frequency balance — a dense waveform could be sub bass, broadband noise, or a full mix, and they can look nearly the same. Phase relationships beyond a gross left-versus-right visual comparison are invisible here too. For spectral questions use the RTA or Spectrogram; the waveform is a time-domain inspection tool.',
    },
    {
      head: 'READING STEREO',
      body:
        'Left and right channels of real stereo material normally look different — different instruments, different room reflections, different levels — so do not treat a mismatch as an error by itself. Two channels that are pixel-identical mean dual mono, not stereo. A channel that looks like a mirror image of the other, flipped across the zero line, suggests a polarity inversion worth investigating. The waveform also exposes asymmetry around the zero line within one channel, which is common with sources like voice and brass and is not by itself a fault.',
    },
    {
      head: 'MEASUREMENT DISCIPLINE',
      body:
        'Freeze the display before drawing conclusions — judgments made on a moving trace are guesses. Note the channel mode, time zoom, and vertical scale with any snapshot you save, because a waveform picture without its scale is not evidence. Compare two signals only at matched scales and matched zoom, and say what you actually measured: peak level over a selection, clipped-sample runs, timing of transients — not "it looks loud."',
    },
  ],
  misconceptions: [
    {
      claim: 'A taller waveform means a louder sound.',
      truth:
        'Height shows peak amplitude, but the ear responds to average energy over time and to frequency content. A heavily limited signal of modest height can sound far louder than a spiky drum track that touches full scale, because its RMS energy is much higher. This is why loudness is measured in LUFS and SPL, not by eyeballing waveform height.',
    },
    {
      claim: 'Vertical zoom turns the signal up.',
      truth:
        'Zoom only changes how many pixels each dB occupies on screen. The signal level in dBFS is untouched — nothing you hear or record changes. Gain changes the signal; zoom changes the picture of it. Read level from the axis and the measured values, not from the size of the drawing.',
    },
    {
      claim: 'You can see frequency balance in a waveform.',
      truth:
        'The waveform is a time-domain display: it shows when energy happens and how much, but folds all frequencies into a single trace. A dense waveform could be rumbling bass or hissing noise and look almost identical. At extreme time zoom you can count cycles of a simple tone, but for any question about tonal balance you need the RTA or Spectrogram.',
    },
    {
      claim: 'If the waveform touches the top of the display, it is clipped.',
      truth:
        'A single sample reaching 0 dBFS is a full-scale peak — the loudest legal value, not necessarily distortion. Clipping is when the signal tried to go beyond full scale and got sliced flat, which shows up as runs of consecutive full-scale samples with squared-off tops. That is why the tool marks clipped-sample runs rather than flagging every peak.',
    },
    {
      claim: 'The zero line is just a cosmetic center line.',
      truth:
        'The zero line is the reference for zero amplitude — true silence sits exactly on it. A waveform that rides above or below it indicates DC offset, which wastes headroom and can cause clicks at edits. Asymmetry around the zero line is also real information: many natural sources, like voice, push more in one direction than the other.',
    },
    {
      claim: 'Left and right channels of a stereo file should look identical.',
      truth:
        'Real stereo content almost always differs between channels — that difference is what makes it stereo. Identical channels mean dual mono. What deserves attention is a channel that looks vertically flipped relative to the other, which suggests a polarity inversion, or one channel that is drastically lower, which suggests a routing or cabling problem.',
    },
    {
      claim: 'Two waveforms that look the same size are at the same level.',
      truth:
        'Only if both views use the same fixed vertical scale. Auto-normalized displays stretch each signal to fill the view, so a whisper and a scream can be drawn at identical height. Before comparing levels visually, confirm the scales match — and even then, trust the measured dBFS numbers over the picture.',
    },
  ],
  warnings: [
    {
      text: 'Vertical zoom changes display size, not audio level.',
      why: 'Students routinely reach for zoom when they mean gain — the trace grows, but the recorded level and available headroom have not changed at all.',
    },
    {
      text: 'Waveform height is not the same as perceived loudness.',
      why: 'Loudness perception follows average energy, duration, and frequency content, so judging loudness from peak height leads to wrong level decisions.',
    },
    {
      text: 'This view shows amplitude over time, not frequency balance.',
      why: 'A dense trace could be bass, noise, or a full mix — spectral questions need the RTA or Spectrogram, and pretending otherwise produces confident wrong answers.',
    },
    {
      text: 'Clipping detected.',
      why: 'Runs of full-scale samples mean the waveform has been flattened and information permanently destroyed — the fix is reducing level at the source, not after the fact.',
    },
    {
      text: 'Auto-normalized views can make different levels appear similar.',
      why: 'When every signal is stretched to fill the display, absolute level information is gone — comparisons are only valid at matched fixed scales.',
    },
  ],
  glossaryTerms: [
    'amplitude',
    'waveform',
    'transient',
    'envelope',
    'peak level',
    'RMS',
    'dBFS',
    'headroom',
    'clipping',
    'crest factor',
    'dynamic range',
    'zero crossing',
    'DC offset',
    'polarity',
  ],
  relatedConcepts: ['measurement-integrity'],
};
