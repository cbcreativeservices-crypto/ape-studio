/**
 * Learn-mode content — Tool 2: Spectrum Analyzer / RTA.
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §10 (functional
 * purpose, core learning outcomes, Learn-view topics, required warnings) and
 * §15 Module 1 (RTA vs magnitude response). Authored 2026-07-23.
 *
 * Misconceptions are distilled from §10's core learning outcomes — the spec
 * lists them as outcomes rather than an explicit misunderstandings table.
 */
import type { ToolLearnContent } from './types';

export const RTA_LEARN: ToolLearnContent = {
  tool: 'rta',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body: 'Each bar shows how much acoustic energy arrived at the microphone in one frequency band over the last moment, low frequencies on the left, high on the right, level in dB vertically. The bands are fractional octaves (1/1 or 1/3 octave) on a logarithmic frequency axis, because that is closer to how hearing divides the spectrum than a linear one. Under the hood the analyzer runs a windowed FFT and sums the bins into bands, so what you see is already a processed summary, not the raw signal.',
    },
    {
      head: 'FREQUENCY REGIONS',
      body: 'Engineers read the display in regions rather than exact bands: sub-bass (below ~60 Hz), bass (~60–250 Hz), low mids (~250–500 Hz), midrange (~500 Hz–2 kHz), presence (~2–6 kHz), and air (~6 kHz up). These borders are approximate vocabulary, not physics — their job is to let you connect what you hear (boom, mud, harshness, sizzle) to where it lives on the axis. Practice naming the region before you look at the numbers; that link between ear and display is the whole point of the tool.',
    },
    {
      head: 'SMOOTHING, AVERAGING AND PEAK HOLD',
      body: 'Averaging combines several measurements over time, trading response speed for a steadier trace — long averaging is right for judging overall balance, short averaging for watching fast changes. Smoothing blurs the trace across neighboring frequencies so broad trends stand out; it changes only the drawing, never the sound. Peak hold keeps the highest level each band has reached, which catches transients the live trace has already dropped. All three change how the same signal looks, so note your settings before you conclude anything.',
    },
    {
      head: 'SCALE LOCK AND THE AUTO-SCALE TRAP',
      body: 'Auto-scale stretches the dB axis so the current trace fills the screen, which is convenient for a first look and misleading for everything after. On a stretched axis a 2 dB wiggle can look like a cliff, and two screenshots of the same signal can look completely different. Lock the scale before you compare anything — before/after an EQ change, between mic positions, or between saved traces — so that equal picture height means equal dB.',
    },
    {
      head: 'PINK NOISE VS MUSIC AS A SOURCE',
      body: 'Pink noise has equal energy per octave, so on a fractional-octave RTA it reads as a flat line — any tilt or bump you see came from the system, the room, or the mic position, not the source. Music has no such known shape: its spectrum changes second to second, so an RTA of music mostly shows you the mix, not the playback system. Use pink noise when you want to learn something about the system; use music when you want to study the material itself, and never confuse the two readings.',
    },
    {
      head: 'WHAT IT CANNOT TELL YOU',
      body: 'A single-microphone RTA shows energy at one point in the room and cannot separate the source spectrum from the loudspeaker, the room, and the mic position — they all arrive mixed together. It carries no phase or timing information, so it cannot show whether a dip is an absorption problem or a cancellation that EQ will never fix. It is therefore not a transfer-function measurement: magnitude response requires comparing the output against a reference of the input, which is a different, two-channel technique. Treat the RTA as a seeing tool, not a judging tool.',
    },
    {
      head: 'MEASUREMENT DISCIPLINE',
      body: 'Before trusting a trace, confirm the input is not clipping, the signal is comfortably above the noise floor, and the trace has settled under your averaging time. Record the mic position along with the trace — move the mic a foot and the low-frequency picture can change by many dB. When comparing, change one thing at a time and keep smoothing, averaging, and scale identical between traces; a comparison with mismatched settings is a comparison of settings, not of sound.',
    },
  ],
  misconceptions: [
    {
      claim: 'The RTA tells me how to EQ the room.',
      truth: 'The RTA shows where energy sits at one microphone position — it does not know why. A dip may be a phase cancellation that boosting cannot fill, and a bump at your mic may not exist two seats away, so an EQ decision needs listening, multiple positions, and often a transfer-function measurement, not one trace.',
    },
    {
      claim: 'The RTA shows the room’s frequency response.',
      truth: 'A single-channel RTA measures the combination of source spectrum, loudspeaker, room, and mic position all at once, with no way to separate them. Measuring the room or system itself means comparing what went in against what came out — a two-channel transfer function — which the RTA alone cannot do.',
    },
    {
      claim: 'A flat RTA trace means the system sounds right.',
      truth: 'Flat on pink noise only means each octave band carried equal energy at that one mic position. Preferred tonal targets in real rooms are usually not flat (most listeners prefer some high-frequency roll-off), and a trace that is flat in one seat can be far from flat in another.',
    },
    {
      claim: 'If the graph changed, the sound changed.',
      truth: 'Auto-scale, smoothing, averaging, and band resolution all reshape the picture without any change in the air. The same signal can look calm or dramatic depending on settings, which is why you lock the scale and match settings before reading a change as real.',
    },
    {
      claim: 'Two traces that look different prove the sound is different.',
      truth: 'Different smoothing, averaging, or scale settings will make identical signals draw different curves — the difference is in the display math, not the room. Only traces captured with matched settings, and ideally a locked scale, support a fair comparison; the tool warns you when saved settings disagree for exactly this reason.',
    },
    {
      claim: 'Music works just as well as pink noise for measurement.',
      truth: 'Measurement needs a source with a known spectrum so you can attribute what you see to the system. Pink noise provides that reference (equal energy per octave, so it reads flat); music’s spectrum is unknown and constantly moving, so with music you are largely watching the mix, not the system under test.',
    },
    {
      claim: 'One mic position represents the whole room.',
      truth: 'Room modes and reflections make the response vary strongly from seat to seat, especially at low frequencies, where moving the mic a small distance can swing a band by many dB. Professionals average or compare several positions before drawing conclusions about a space.',
    },
  ],
  warnings: [
    {
      text: 'This display shows frequency energy, not automatic EQ advice.',
      why: 'A feature on the trace can come from the source, the room, or the mic position — an EQ move made to fix the picture can easily make the sound worse.',
    },
    {
      text: 'Microphone position strongly affects the result.',
      why: 'Reflections and room modes create a different response at every point in the room, so a trace is only ever valid for the position where it was captured.',
    },
    {
      text: 'Auto-scale can exaggerate small changes.',
      why: 'Auto-scale stretches the dB axis to fill the screen, so a change of a couple of dB can look enormous until the scale is locked.',
    },
    {
      text: 'Do not compare traces with different smoothing or scale settings without caution.',
      why: 'Display settings reshape the curve, so mismatched-settings comparisons show differences in processing, not necessarily differences in sound.',
    },
    {
      text: 'Room response and source material both affect this display.',
      why: 'The trace is the source, system, and room multiplied together at one position — no single feature can be blamed on one of them without controlling the others.',
    },
  ],
  glossaryTerms: [
    'octave band',
    '1/3-octave band',
    'FFT',
    'windowing',
    'logarithmic frequency axis',
    'pink noise',
    'white noise',
    'averaging',
    'smoothing',
    'peak hold',
    'noise floor',
    'transfer function',
    'room mode',
  ],
  relatedConcepts: ['rta-vs-magnitude', 'coherence', 'measurement-integrity'],
};
