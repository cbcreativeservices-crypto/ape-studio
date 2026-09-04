/**
 * Learn-mode content — Frequency Counter & Tuner ('hzcounter').
 *
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md, section
 * "Tool 7 — Frequency Counter & Tuner" (merged-tool ruling 2026-07-23),
 * including its ten-tutorial list, common student misunderstandings, and
 * required warnings. Data-only module assembled by ./index.ts.
 */
import type { ToolLearnContent } from './types';

export const HZCOUNTER_LEARN: ToolLearnContent = {
  tool: 'hzcounter',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body:
        'This is one measurement engine with two faces. Counter mode shows the raw repetition rate — a large frequency in hertz, with period, minimum, maximum, and average — while Tuner mode interprets the same estimate musically as a note name, octave, and a needle showing cent deviation from the chosen reference. Around the main readout sit a confidence meter, a stability indicator, signal quality, and the active input, and those small displays decide whether the big number deserves your trust. Read them first, the frequency second.',
    },
    {
      head: 'FREQUENCY IS NOT PITCH',
      body:
        'Frequency is physics: how many times per second a waveform repeats, measured in hertz. Pitch is perception: your auditory system\'s judgment of how high or low a sound sits, which usually tracks the fundamental frequency but is also shaped by level, timbre, and context. This tool can only measure frequency; it then maps that number onto note names using a tuning system and a reference pitch. The distinction is worth memorizing: frequency is measured, pitch is heard.',
    },
    {
      head: 'HOW THE TUNER FINDS THE NOTE',
      body:
        'The engine looks for periodicity — the repeating cycle length in the incoming signal — using autocorrelation-style pitch detection, then converts that period to a fundamental frequency. That is harder than it sounds, because most musical notes carry harmonics at two, three, and four times the fundamental, and on many instruments a harmonic is stronger than the fundamental itself; the detector must reject those or it reads an octave high. Once it has the fundamental, the tuner finds the nearest note in the reference tuning and expresses the difference in cents — hundredths of an equal-tempered semitone. The needle is simply that cent value drawn as an angle: centered means within a few cents of the target.',
    },
    {
      head: 'REFERENCE PITCH IS A CHOICE',
      body:
        'The note grid is anchored to a reference frequency for A4, and A4 = 440 Hz is only the most widely adopted convention, standardized internationally in the twentieth century. Many orchestras tune to 441–443 Hz for a slightly brighter ensemble sound, historical and alternative references such as 432 and 435 Hz exist, and this tool offers 432 through 444 plus a custom value. Changing the reference does not change the measured frequency at all — it changes which note name and cent deviation that frequency maps to. If every note reads consistently about 8 cents flat, check the reference before blaming the instrument: 440 versus 442 is roughly an 8-cent difference.',
    },
    {
      head: 'CONFIDENCE, STABILITY, AND NOISE',
      body:
        'Confidence is the engine\'s own estimate of how clearly one period stands out in the signal; stability is how consistent successive estimates are over time. Both collapse in noisy environments, because the detector must pick one repeating cycle out of everything the microphone hears — ventilation, other instruments, room reflections — and competing periodicities pull the estimate around. A reading that jumps between values, or a needle that swings while confidence is low, is the tool honestly reporting that there is no single stable answer, not a malfunction. Get closer to the source, wait for a sustained tone past its attack, and only trust readings taken at high confidence and high stability.',
    },
    {
      head: 'ACOUSTIC, VIBRATION, OPTICAL — AND TAP',
      body:
        'Acoustic mode uses the microphone and covers the audible range within the phone mic\'s limits. Vibration mode uses the accelerometer, which samples only a few hundred times per second — good for motors, fans, turntable speed, and cabinet-resonance demonstrations in the low tens of hertz, and physically incapable of measuring audio-band frequencies. Optical mode measures frame-to-frame brightness changes from the camera, so it can never resolve a rate above half the camera\'s frame rate; faster events alias into false low readings, the same effect that makes wagon wheels appear to spin backward on film. Tap mode needs no sensor at all: it times the intervals between your taps and converts the average interval to Hz and BPM — which means it measures your tapping, inherits your timing error, and gets more accurate the more taps it averages.',
    },
    {
      head: 'MEASUREMENT DISCIPLINE',
      body:
        'This tool reports one dominant repetition rate with a confidence attached — never a certainty, and never more than one answer at a time. Note the conditions that shaped a reading — input method, distance, background noise, and the reference pitch in use — because a number without its context cannot be checked or compared later. When the display warns of low confidence, clipping, or multiple tones, treat the reading as unusable rather than close enough. An honest "no stable pitch" is a better measurement result than a confident-looking wrong number.',
    },
  ],
  misconceptions: [
    {
      claim: 'Frequency equals note.',
      truth:
        'A note name is a label, not a physical property. The engine measures frequency in hertz; which note that frequency belongs to depends on the tuning system and the reference pitch — 440 Hz is A4 under A = 440 equal temperament, but the same 440 Hz reads about 8 cents flat if the reference is 442. Frequency is measured; the note is an interpretation layered on top.',
    },
    {
      claim: '440 Hz is the only tuning.',
      truth:
        'A4 = 440 Hz is a twentieth-century convention, not a law of nature. Many orchestras tune to 441–443 Hz, period ensembles use references such as 415 or 430 Hz, and this tool supports 432 through 444 plus a custom value. That is exactly why the tuner always displays its current reference — a reading only means something relative to the reference it was made against.',
    },
    {
      claim: 'Background noise doesn\'t matter.',
      truth:
        'The pitch detector has to find one repeating cycle in everything the microphone picks up. Noise and competing tones add rival periodicities, which drags confidence down and makes the estimate jump or lock onto the wrong source. In a noisy room the tuner is not merely a bit less accurate — it can be confidently wrong, which is why the confidence meter and noise warnings exist.',
    },
    {
      claim: 'The strongest harmonic is always the fundamental.',
      truth:
        'On many instruments — low piano strings, brass, the human voice — the second or third harmonic carries more energy than the fundamental. A naive detector that grabs the strongest peak reads an octave or more too high. That is why the engine uses period-based detection with harmonic rejection instead of simply picking the tallest spectral peak.',
    },
    {
      claim: 'The camera can measure any frequency.',
      truth:
        'The camera samples brightness once per frame, so it obeys the same sampling limit as any digital system: it can only resolve rates below half its frame rate. At 60 frames per second that ceiling is 30 Hz; anything faster aliases and shows up as a false low reading — the film-era wagon-wheel effect. Optical mode is for slow flashes, markers on rotating machinery, and strobes, not for audio-rate measurement.',
    },
    {
      claim: 'The accelerometer measures audio.',
      truth:
        'Phone accelerometers typically sample a few hundred times per second, which caps usable measurement in the low tens of hertz. That makes vibration mode excellent for demonstrating motors, fans, turntable speed, and structural resonance — and physically incapable of measuring a 440 Hz tone. It demonstrates vibration; it is not a substitute for a dedicated vibration analyzer.',
    },
    {
      claim: 'A tuner can tune a chord.',
      truth:
        'Pitch detection here is monophonic: it looks for one dominant period. A chord contains several simultaneous fundamentals, so the detector either locks onto one of them more or less at random or reports no stable pitch. Tune strings one at a time — the multiple-tones warning is the tool telling you it heard more than it can resolve.',
    },
    {
      claim: 'If the needle touches center for a moment, the note is in tune.',
      truth:
        'The attack of a note is pitch-unstable — a plucked string starts slightly sharp and settles as it decays, and wind players drift while setting the embouchure. A momentary center crossing during that motion means nothing. Judge tuning from the sustained part of the note, held long enough for both the pitch and the confidence display to settle.',
    },
  ],
  warnings: [
    {
      text: 'Low confidence',
      why:
        'The engine cannot clearly identify one repeating cycle in the signal, so the displayed frequency is a weak guess that may be far off — improve the signal before trusting the number.',
    },
    {
      text: 'No stable pitch',
      why:
        'The input has no single steady repetition rate — noise, speech, percussion, and chords all lack one — and reporting a number anyway would be inventing a measurement.',
    },
    {
      text: 'Background noise detected',
      why:
        'Competing sounds add rival periodicities that can pull the estimate away from your source, so the reading may reflect the room instead of the thing you are measuring.',
    },
    {
      text: 'Signal clipped',
      why:
        'Clipping flattens the waveform peaks and creates distortion harmonics that were never in the source, which can fool the detector into reporting a wrong fundamental — lower the level or move back.',
    },
    {
      text: 'Multiple tones detected',
      why:
        'The detector is monophonic; with several simultaneous tones it can only lock onto one of them arbitrarily, so isolate a single source before reading.',
    },
    {
      text: 'Frequency outside measurable range',
      why:
        'Every input method has hard limits set by its sensor, and beyond them the tool would be extrapolating rather than measuring — no number is shown because none would be honest.',
    },
    {
      text: 'Camera frame rate exceeded',
      why:
        'The rate being measured is at or above half the camera\'s frame rate, so the reading would alias to a false low value instead of degrading gracefully.',
    },
    {
      text: 'Lighting inadequate',
      why:
        'Optical mode measures brightness changes between frames; without enough light and contrast the variation drowns in sensor noise and the detected rate becomes unreliable.',
    },
    {
      text: 'Optical measurement approximate',
      why:
        'Frame timing, exposure, and rolling shutter all add error the tool cannot fully correct, so optical readings are estimates for demonstration and rough checks, not calibrated results.',
    },
    {
      text: 'Vibration measurement hardware limited',
      why:
        'The phone accelerometer\'s sample rate and noise floor limit both the frequency range and the accuracy — it demonstrates vibration behavior but is not a dedicated vibration analyzer.',
    },
  ],
  glossaryTerms: [
    'frequency',
    'pitch',
    'hertz',
    'period',
    'fundamental',
    'harmonic',
    'octave',
    'cent',
    'equal temperament',
    'reference pitch',
    'beat frequency',
    'aliasing',
    'autocorrelation',
    'beats per minute',
  ],
  relatedConcepts: ['measurement-integrity'],
};
