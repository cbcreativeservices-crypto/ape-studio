/**
 * Understanding Level & Amplitude — "explain this screen" content (owner
 * 2026-10-31, the Screen Guide rollout to Audio Fundamentals; pattern:
 * wave/waveScreenGuides.ts).
 *
 * This lab is ONE scrolling page, reached two ways, so it has two guides:
 *   lab    — AmplitudeLabScreen: the lab itself, the FIRST lab in Audio
 *            Fundamentals (opened from the Labs menu). It is also the lab
 *            home, so AMPLITUDE_HOME_GUIDE is this guide.
 *   primer — AmplitudeOrientationGatePage: the one-time colour-language
 *            primer drawn IN PLACE of a level-drawing tool or lab until the
 *            orientation is complete; UNDERSTOOD — CONTINUE swaps straight
 *            into the screen the learner chose.
 * Both draw AmplitudeColorBody (same colour bar, six cards, check); they
 * differ in the header, the final button and what it records.
 *
 * Every line was written against AmplitudeOrientation.tsx: names are the
 * on-screen names (card titles, labels, buttons) and every number in TRY THIS
 * is what the page draws (the burst at env(t) t = 0.7 in WAVEFORM and
 * SPECTROGRAM; SPL METER 78 dB SPL on its 40–100 scale = levelColor(0.633),
 * yellow-green, vs PEAK −3 = levelColor(0.9375), orange; the OSCILLOSCOPE
 * stroke is WAVE_LEVEL_STOPS, symmetric about the zero line).
 * PEAK −3 / RMS −14 are ILLUSTRATIVE values (the page's own comment), not
 * derived from the drawn signal, so the guide never gives their gap as a
 * property of that signal, and never counts lit segments (MeterBar rounds).
 * The lab page has TWO states: not done (CHECK YOURSELF + UNDERSTOOD — MARK
 * REVIEWED) and done (✓ ORIENTATION COMPLETE, MARK REVIEWED while the lab is
 * unreviewed, TEST YOURSELF AGAIN ›) — the done state is what anyone who
 * passed the primer sees. The primer only ever shows the not-done state (the
 * gate swaps to the chosen screen once the flag is set).
 * Change a label, number or the check → update this file;
 * test/screenGuide_amplitude_20261031.test.ts pins the shape and the names.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Neither screen has a Rack Unit, so every step sits as a bottom card.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never skills;
 * no gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

export type AmplitudeScreenId = 'lab' | 'primer';

/** The colour-bar / six-cards physics both screens share. */
const CHANGES: string[] = [
  'Each display colors its own scale: nearer its top, warmer.',
  'PEAK (−3) tops RMS (−14): PEAK catches the biggest swings; RMS averages strength over time, so a short burst lifts it less.',
  'SPL METER reads sound in air (78 dB SPL); LEVEL METER counts dB below a signal’s maximum: 0 or less.',
  'SPECTRUM (RTA): the low tone is the tallest, warmest bar; its harmonic (a weaker tone at 3× the pitch) is shorter and cooler.',
];

const TRY_BURST =
  'Find the short burst: in WAVEFORM it is the tallest, warmest bars, about 70% of the way across; in SPECTROGRAM, a bright upright streak at the same point.';
const TRY_SPL =
  'Compare SPL METER 78 dB SPL with LEVEL METER PEAK −3: 78 is the bigger number but the cooler color. Each meter colors its own scale.';
const TRY_SCOPE =
  'In OSCILLOSCOPE follow the trace: blue where it crosses the zero line, warmer toward every crest, top and bottom. Level is distance from zero, not direction.';

/** WHAT THIS TEACHES — the shared opening lines. */
const TEACH_RULE = 'Wherever an Academy display shows level or amplitude, cooler colors mean less and warmer colors mean more.';
const TEACH_TERMS = 'Amplitude is how big the swings are; level is that size read as a number, counted in dB (decibels).';
const TEACH_VIEWS = 'A waveform shows amplitude over time, a spectrum strength across frequency, a spectrogram both at once.';
const TEACH_AID = 'This color scale is an Academy learning aid; real equipment and software use many schemes.';

export const AMPLITUDE_SCREEN_GUIDES: Record<AmplitudeScreenId, ScreenGuide> = {
  // ── the lab (Labs menu → Audio Fundamentals → first lab) ────────────────────
  lab: {
    seeing: [
      'The color bar: LOW (dark blue) to HIGH (red), marked quiet → loud, less → more, and pp, mp, f, fff (music marks: very soft to very loud).',
      'SIX VIEWS · ONE SIGNAL: WAVEFORM, OSCILLOSCOPE, LEVEL METER, SPL METER, SPECTRUM (RTA) and SPECTROGRAM — still drawings of one example sound.',
      'Then LEARNING CONVENTION, BLUE = LESS / RED = MORE, and CHECK YOURSELF — THREE QUICK READS (once passed: ✓ ORIENTATION COMPLETE).',
    ],
    control: [
      'Scroll the page. Nothing here makes sound or uses the microphone.',
      'CHECK YOURSELF: three questions. Tap one of two choices — two color swatches, then two pad grids, then two small spectrum displays. A wrong tap costs nothing: an amber hint and a small color ramp appear; try again.',
      'UNDERSTOOD — MARK REVIEWED unlocks when all three are right. It marks this lab reviewed (its ✓ in the Labs menu) and shows ✓ ORIENTATION COMPLETE.',
      'Passed the color check before, here or on another screen? Then there is no check: MARK REVIEWED marks the lab if not yet marked; TEST YOURSELF AGAIN › replays the questions for practice.',
      'FINISH · SEE WHAT’S LEFT › at the bottom shows what is still to do. ‹ leaves the lab.',
    ],
    changes: CHANGES,
    teaches: [
      TEACH_RULE,
      TEACH_TERMS,
      TEACH_VIEWS,
      'The first lab in Audio Fundamentals; Foundations of Sound comes next and uses these colors.',
    ],
    tryThis: [TRY_BURST, TRY_SPL, TRY_SCOPE],
  },

  // ── the one-time primer, drawn in place of a gated lab or tool ──────────────
  primer: {
    seeing: [
      'This page opened in place of the lab or tool you chose. It shows until you pass its check once, so you know the level colors first.',
      'The color bar: LOW (dark blue) to HIGH (red), marked quiet → loud and less → more.',
      'SIX VIEWS · ONE SIGNAL: six cards draw one example sound. Below them: LEARNING CONVENTION, BLUE = LESS / RED = MORE, and CHECK YOURSELF.',
      'Every card is a still drawing, not a live reading.',
    ],
    control: [
      'Scroll the page. Nothing here makes sound or uses the microphone.',
      'CHECK YOURSELF: three questions. Tap one of two choices — two color swatches, then two pad grids, then two small spectrum displays.',
      'A wrong tap costs nothing: a short amber hint and a small color ramp appear, and you try again.',
      'UNDERSTOOD — CONTINUE unlocks when all three are right, and opens the screen you chose right here. This page does not come back after that.',
      '‹ goes back without marking anything; the page shows again next time. The lab credit is earned in Understanding Level & Amplitude itself.',
    ],
    changes: CHANGES,
    teaches: [
      TEACH_RULE,
      TEACH_TERMS,
      TEACH_VIEWS,
      TEACH_AID,
    ],
    tryThis: [TRY_BURST, TRY_SPL, TRY_SCOPE],
  },
};

/** The lab is one page: its home IS its lab screen. */
export const AMPLITUDE_HOME_GUIDE: ScreenGuide = AMPLITUDE_SCREEN_GUIDES.lab;
