/**
 * RT60 / Reverb Decay Estimator — Learn-mode content.
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §13 (Tool 5 —
 * RT60 / Reverb Decay Estimator), 2026-07-23. Covers impulse-response anatomy,
 * the decay curve, T20/T30/EDT, per-band variation, and measurement discipline.
 */
import type { ToolLearnContent } from './types';

export const RT60_LEARN: ToolLearnContent = {
  tool: 'rt60',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body:
        'The impulse response is the room’s answer to a single short burst of sound, drawn as level over time. It has four regions: the direct sound (the first, tallest arrival straight from the source), early reflections (discrete peaks in the first tens of milliseconds from nearby surfaces), the late decay (a dense wash of overlapping reflections fading toward silence), and the noise floor (the level below which the room’s ordinary background sound hides everything). The decay view integrates that response into a smooth downward curve and fits a straight line to its slope. Every number this tool reports — RT60, T20, T30, EDT — is read off that fitted slope, not off the raw wiggles.',
    },
    {
      head: 'HOW TO READ THE DECAY CURVE',
      body:
        'RT60 is defined as the time it takes sound to decay by 60 dB after the source stops. In real rooms you almost never get a clean 60 dB of usable range above the noise floor, so the tool fits the slope over a smaller window — 20 dB for T20, 30 dB for T30 — and extrapolates: a T20 result multiplies the measured 20 dB decay time by three. EDT (early decay time) fits only the first 10 dB of decay, which tracks what listeners actually perceive as “liveness” better than the full tail. Always check the method label and the confidence status before trusting the number, because a T20 result and a true 60 dB measurement are not the same claim.',
    },
    {
      head: 'WHY IT CHANGES WITH FREQUENCY',
      body:
        'A room does not have one decay time — it has one per frequency band, because absorption, surface materials, and room geometry all act differently at different wavelengths. Typical untreated rooms hold onto low frequencies far longer than highs: carpet and curtains soak up 4 kHz but do almost nothing at 125 Hz. That is why the Bands view reports decay per octave band rather than a single figure, and why professionals quote RT60 at stated bands (for example, 500 Hz and 1 kHz) instead of quoting “the room’s RT60.” If a single number is shown, treat it as a summary of the mid bands, not a description of the bass.',
    },
    {
      head: 'MEASUREMENT DISCIPLINE',
      body:
        'Decay results depend on where the source and microphone are, so a serious measurement is several measurements: repeat from multiple positions and compare, rather than trusting one capture. The excitation matters as much as the position — a hand clap is weak, spectrally uneven, and different every time, so it may not put enough energy above the noise floor in the bands you care about; a balloon pop, a proper sweep, or a calibrated impulse source is more repeatable. Keep the room quiet during capture, because everything the mic hears becomes part of the “decay.” When two measurements disagree, that disagreement is information about the room and your method — do not silently average it away.',
    },
    {
      head: 'WHAT IT CANNOT TELL YOU',
      body:
        'Classical RT60 theory assumes a diffuse sound field, where reflections arrive densely and evenly from all directions — an assumption large halls approximate and small rooms often do not. In a small studio or bedroom, low-frequency behavior is dominated by individual room modes, so a low-band “RT60” is really describing how specific resonances ring, not statistical reverberation. This tool also cannot judge whether a decay time is good — that depends on the room’s purpose — and it does not measure frequency response, echo audibility, or absorption coefficients. Use it to compare (before vs after treatment, position A vs B), not to grade a room with one number.',
    },
  ],
  misconceptions: [
    {
      claim: 'RT60 is a single number that describes the whole room.',
      truth:
        'Decay time varies by frequency band because absorption and room geometry act differently at different wavelengths — a room can be dry at 4 kHz and boomy at 125 Hz at the same time. One number can only summarize a few mid bands, so professionals report decay per octave band.',
    },
    {
      claim: 'The tool measures the full 60 dB of decay.',
      truth:
        'Real rooms rarely offer 60 dB of decay above the background noise, so the tool fits the slope over 20 or 30 dB (T20/T30) and extrapolates — multiplying a T20 result by three assumes the decay stays linear, which is why the method label and quality status matter.',
    },
    {
      claim: 'One hand clap gives a reliable RT60.',
      truth:
        'A clap is weak, spectrally uneven, and impossible to repeat exactly, so it often fails to put enough energy above the noise floor in the low bands and gives a different answer every attempt. Repeatable excitation — a sweep, a balloon pop, or averaged repeats — is what makes a decay measurement trustworthy.',
    },
    {
      claim: 'Measuring from anywhere in the room gives the same result.',
      truth:
        'Source and microphone position shape which reflections and modes dominate the capture, so two positions in the same room can report noticeably different decay times. That is exactly why the discipline is to repeat from multiple positions and compare, not to trust one spot.',
    },
    {
      claim: 'Small rooms have an RT60 just like concert halls do.',
      truth:
        'RT60 theory assumes a diffuse field of dense, even reflections, which large halls approximate and small rooms often do not. In a small room the low bands are governed by individual room modes ringing, so a low-frequency “RT60” describes resonant behavior rather than true statistical reverberation.',
    },
    {
      claim: 'A longer visible tail on screen always means more reverb.',
      truth:
        'Once the decay falls near the noise floor, what you see is background noise, not room decay — the tail flattens out and appears to last forever. The tool marks the noise floor precisely so you can tell where real decay ends and noise begins.',
    },
  ],
  warnings: [
    {
      text: 'RT60 varies by frequency band.',
      why:
        'A single averaged number can hide a bass decay two or three times longer than the mids, which is usually the exact problem you are trying to find.',
    },
    {
      text: 'Result may be extrapolated from T20 or T30.',
      why:
        'Extrapolation assumes the decay stays linear beyond the measured range, so the reported RT60 is an estimate whose method must be known before it is trusted or compared.',
    },
    {
      text: 'Insufficient decay range detected.',
      why:
        'If the signal decays into the noise floor before the fit window is covered, the slope is fitted partly to noise and the resulting time is not meaningful.',
    },
    {
      text: 'High background noise may invalidate result.',
      why:
        'Background noise raises the floor and shortens the usable decay range, and any noise event during capture is mistaken for room energy in the curve.',
    },
    {
      text: 'Repeat measurements from multiple positions.',
      why:
        'Position changes which reflections and modes dominate the capture, so a single position tells you about that spot, not about the room.',
    },
    {
      text: 'A hand clap may not provide reliable measurement conditions.',
      why:
        'A clap is quiet, spectrally uneven, and unrepeatable, so it often cannot excite the low bands far enough above the noise floor for a valid fit.',
    },
    {
      text: 'Visible late energy may include noise.',
      why:
        'Near the noise floor the display shows background sound, not decay — reading the tail there overestimates how long the room actually rings.',
    },
  ],
  glossaryTerms: [
    'RT60',
    'reverberation time',
    'impulse response',
    'direct sound',
    'early reflections',
    'decay curve',
    'T20',
    'T30',
    'early decay time (EDT)',
    'noise floor',
    'octave band',
    'diffuse field',
    'room mode',
    'signal-to-noise ratio',
  ],
  relatedConcepts: [
    'impulse-response-basics',
    'rt60-t20-t30-edt',
    'why-delay-matters',
    'measurement-integrity',
  ],
};
