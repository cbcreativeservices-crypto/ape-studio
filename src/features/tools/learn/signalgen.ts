/**
 * Tone & Noise Generator — Learn-mode content.
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md, "Tool 6 — Tone &
 * Noise Generator" (functional purpose, required modes, misunderstandings,
 * required warnings, level ruling) plus the Tool 6 tutorials list
 * (Pink vs White, sine, log sweeps, safe levels, loudspeaker/room signals,
 * how noise excites frequencies). Authored 2026-07-23.
 */
import type { ToolLearnContent } from './types';

export const SIGNALGEN_LEARN: ToolLearnContent = {
  tool: 'signalgen',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body:
        'The generator is the one tool in this suite that produces sound instead of measuring it. Every serious measurement starts with a known input: you feed the system a signal whose properties you already understand, then read what came out with the RTA, SPL meter, or RT60 tool. The waveform preview and level readout here show what is being generated — never what the room or the system did to it. So many different signals exist because each one is engineered to answer a different question.',
    },
    {
      head: 'SINE TONES AND SWEEPS',
      body:
        'A sine wave is a single frequency with no harmonics — the purest possible stimulus, which is exactly why it is used for oscillator demonstrations, distortion and crossover checks, and hunting resonances one frequency at a time. A sweep moves that sine through a range instead of holding it still. A linear sweep advances at a constant number of Hz per second, so it lingers in the treble and races through the bass — useful for watching individual resonances ring. A logarithmic sweep spends equal time per octave, matching how hearing and loudspeaker specifications are organized, which is why log sweeps are the standard excitation for loudspeaker testing and impulse-response measurement.',
    },
    {
      head: 'THE NOISE FAMILY',
      body:
        'Noise “colors” name different spectral tilts of random signal. White noise has equal energy per Hz; pink falls 3 dB per octave, giving equal energy per octave; brown falls 6 dB per octave and lives mostly in the low end. Blue and violet noise rise 3 and 6 dB per octave respectively — included here as educational modes so you can hear the spectral balance tilt the other way. Random moment to moment, every one of these has a precisely defined long-term spectrum, and that statistical predictability is what makes noise a legitimate test signal.',
    },
    {
      head: 'EQUAL ENERGY PER HZ VS PER OCTAVE',
      body:
        'This distinction decides which noise you reach for. Each octave upward spans twice as many Hz as the one below it, so white noise — equal energy per Hz — packs twice the energy into each higher octave and sounds bright and hissy. Pink noise gives every octave the same total energy, which matches the log-frequency way we hear and analyze, so it reads flat on a fractional-octave RTA. That is why pink noise, not white, is the working signal for loudspeaker tuning, room excitation, and EQ education.',
    },
    {
      head: 'IMPULSES, CLICKS AND BURSTS',
      body:
        'An impulse is a single instant of sound containing energy at all frequencies at once — the textbook stimulus for timing and impulse-response demonstrations. A click track repeats that idea at a configurable BPM, which makes it the right signal for synchronization work and for hearing delay between sources. A tone burst is a short packet of sine cycles that starts and stops abruptly, revealing how a loudspeaker or a room handles transients in a way no steady tone can. Together they cover the time-domain questions that continuous signals cannot ask.',
    },
    {
      head: 'SAFE OUTPUT LEVELS',
      body:
        'This app defaults the generator output to −20 dBFS and enforces a hard cap at −12 dBFS; going above the cap requires a deliberate tap-through confirmation, and that unlock lasts only for the session. The rule exists because a continuous test signal delivers sustained power in a way music never does — a steady sine at a moderate reading works a driver far harder than program material peaking at the same level. More level does not mean a better measurement: you need enough signal to sit comfortably above the noise floor, and everything beyond that is pure risk. Start low, confirm what is connected downstream, then raise the level only as far as the measurement actually requires.',
    },
    {
      head: 'WHAT IT CANNOT TELL YOU',
      body:
        'The generator measures nothing — it can only ask the question, so pair it with the RTA for spectrum, the SPL meter for level, or the RT60 tool for decay to read the answer. Its level is digital (dBFS), which says nothing about acoustic level in the room until the entire downstream gain chain is accounted for. It is not a calibrated laboratory reference either: the actual output depends on the device converter, playback path, and volume settings, so any measurement that leans on its absolute accuracy must be labeled approximate. Keep test signals and music strictly separate in your thinking — conclusions drawn from statistically defined stimuli transfer to program material only with care. Before trusting any result excited by this tool, note the signal type, the output level, and the playback chain, because changing any of them changes the measurement.',
    },
  ],
  misconceptions: [
    {
      claim: 'Pink noise equals white noise.',
      truth:
        'They differ by definition and by sound. White noise carries equal energy per Hz, and since each higher octave spans twice as many Hz, its energy doubles per octave — it sounds bright. Pink noise carries equal energy per octave, matching log-frequency hearing and analysis, so it sounds balanced and reads flat on a fractional-octave RTA.',
    },
    {
      claim: 'Turning the generator louder makes measurements better.',
      truth:
        'A measurement only needs enough level to sit comfortably above the noise floor. Beyond that, extra level adds nothing to the data while raising the risk of driver damage, hearing damage, and distortion in the playback chain — distortion that then contaminates the very measurement you were trying to improve.',
    },
    {
      claim: 'Sine waves represent music.',
      truth:
        'A sine is one frequency with no harmonics, no transients, and no dynamics — the opposite of music, which is broadband and constantly changing. A system that behaves on a sine can still fail on program material, which is why complete testing also uses noise, sweeps, and bursts.',
    },
    {
      claim: 'Noise is random, therefore unusable.',
      truth:
        'Noise is random from moment to moment but statistically defined over time: its long-term average spectrum is known precisely. That predictable spectrum is exactly what makes pink noise the standard excitation for RTA work and loudspeaker tuning — randomness in the short term, certainty in the average.',
    },
    {
      claim: 'Sweeps measure rooms automatically.',
      truth:
        'A sweep is only the excitation half of a measurement — the measurement itself happens in the analysis of what comes back, and it is only as good as the microphone position, level, noise floor, and interpretation behind it. Playing a sweep into a room proves nothing by itself.',
    },
    {
      claim: 'White noise is flat, so it should read flat on the RTA.',
      truth:
        'White noise is flat per Hz, which looks flat on a narrowband FFT display. A fractional-octave RTA sums energy in bands that get wider as frequency rises, so white noise climbs about 3 dB per octave on it. Pink noise is the signal that reads flat on an RTA — a perfect demonstration of why you must know both your signal and your display.',
    },
    {
      claim: 'A tone at −20 dBFS is quiet, so it is safe.',
      truth:
        'dBFS describes digital level, not acoustic level — the same file value can be a whisper or painful depending on downstream gain. Worse, a continuous sine has a much lower crest factor than music, so it delivers far more sustained power to a driver than music peaking at the same reading. Digital level alone never guarantees safety.',
    },
  ],
  warnings: [
    {
      text: 'Very low frequencies can damage speakers.',
      why:
        'Below a driver’s usable range, large cone excursion produces very little audible sound, so a woofer can bottom out or overheat while nothing ever sounds loud.',
    },
    {
      text: 'High frequencies can damage hearing.',
      why:
        'Sustained high-frequency tones can injure hearing at levels that do not feel dramatic in the moment — damage can accumulate before discomfort ever registers.',
    },
    {
      text: 'Start at low volume.',
      why:
        'Until sound actually comes out, you do not know the downstream gain; starting low turns a wrong assumption into a surprise instead of a blown driver or an injury.',
    },
    {
      text: 'Never connect directly to power amplifiers without understanding gain structure.',
      why:
        'A power amplifier applies large fixed gain, so a healthy test level at its input can become full rated power at its output — delivered continuously, because test signals never pause.',
    },
    {
      text: 'Generator output is not a calibrated laboratory reference.',
      why:
        'The real output level and spectrum depend on the device’s converter, playback path, and volume settings, so any result that relies on absolute accuracy must be treated — and labeled — as approximate.',
    },
  ],
  glossaryTerms: [
    'sine wave',
    'oscillator',
    'white noise',
    'pink noise',
    'brown noise',
    'octave',
    'frequency sweep',
    'impulse',
    'tone burst',
    'crest factor',
    'dBFS',
    'gain structure',
    'noise floor',
    'headroom',
  ],
  relatedConcepts: ['measurement-integrity', 'rta-vs-magnitude'],
};
