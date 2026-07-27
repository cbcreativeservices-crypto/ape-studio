/**
 * sourceHelp — the shared "test signal" lesson (owner request 2026-07-26). The
 * SOURCE chips in the effect labs (SINE 440 Hz, PINK NOISE, CLICK, …) are the
 * same set across every lab, so their "what is this signal" help lives here
 * once and rides the SAME two-tier popup as every control. Each source TYPE is
 * one control keyed by its generator mode (see sourceKeyForGen in FxLabScreen).
 *
 * Honesty: describes what the signal IS and why you'd probe an effect with it —
 * never a measurement claim.
 */
import type { LessonContent } from './types';

export const SOURCE_LESSON: LessonContent = {
  name: 'Test Signal',
  tagline: 'What you feed the effect.',
  whatItIs:
    'The SOURCE is the known signal fed into the effect. Because you know exactly what goes IN, ' +
    'anything different coming OUT is the effect at work — which is why labs probe with simple, ' +
    'repeatable signals (a pure sine, broadband noise, sharp clicks) rather than music.',
  controls: [
    { key: 'sine', name: 'Sine', definition: 'A pure single-frequency tone with NO harmonics. The cleanest probe: any new tones or level change you hear are the effect, not the source.' },
    { key: 'pink', name: 'Pink noise', definition: 'Equal energy per octave (−3 dB/oct) — sounds tonally balanced and contains every frequency at once, so it reveals an effect’s whole frequency response in one listen.' },
    { key: 'white', name: 'White noise', definition: 'Equal energy per Hz — brighter/hissier than pink, also broadband. Good for hearing high-frequency behavior.' },
    { key: 'brown', name: 'Brown noise', definition: 'A darker broadband noise (−6 dB/oct) — lots of low end, a deep rumble. Useful for low-frequency effects.' },
    { key: 'blue', name: 'Blue noise', definition: 'A bright, high-tilted broadband noise (+3 dB/oct) — the opposite slope of pink.' },
    { key: 'violet', name: 'Violet noise', definition: 'The brightest noise (+6 dB/oct) — almost all high-frequency hiss.' },
    { key: 'click', name: 'Click', definition: 'A short, repeating impulse — a sharp broadband “tick”. Perfect for TIME effects: each click spawns the echo/decay pattern so you can see and hear the spacing.' },
    { key: 'burst', name: 'Tone burst', definition: 'A short tone that switches on and off — ideal for hearing how DYNAMICS (gates, compressors) react to a sound starting and stopping.' },
    { key: 'sweep', name: 'Sweep', definition: 'A tone that glides across the spectrum — one pass moves through every frequency, so you hear the effect change with pitch (great for comb filters and EQ).' },
    { key: 'additive', name: 'Harmonic tone', definition: 'A built-up musical waveform (many harmonics), richer than a sine — so you hear the effect act on real harmonic content, not just one frequency.' },
  ],
  commonMistakes: [
    'Judging an effect on music first — a known signal (sine / noise / click) shows what it’s doing far more clearly.',
    'Using a sine to hear a TIME effect — you can’t see echoes in a continuous tone; use CLICK for delay/reverb.',
    'Forgetting noise is broadband — it has no single pitch, so it exposes frequency-shaped effects (EQ, comb) at a glance.',
  ],
  proTips: [
    'Match the source to the concept: sine for pitch/harmonics, noise for frequency response, click for time.',
    'Pink noise into a spectrum view is the fastest way to SEE an effect’s tonal change.',
  ],
  formula: 'Sine = one frequency. Noise color = spectral tilt (white 0, pink −3, brown −6 dB/oct). Click/burst = broadband impulses in time. Sweep = frequency vs time.',
};
