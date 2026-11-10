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

/** The colour-bar / six-cards physics both screens share (one rewrite per
 *  shared line, Guided Lessons return 2026-11-08 decision 8: the lab's). */
const CHANGES: string[] = [
  'Each display colors its own scale: warmer near its top.',
  'LEVEL METER: PEAK (−3) tops RMS (−14). PEAK catches the biggest swings; RMS averages over time, so a short burst lifts it less.',
  'SPL METER reads sound in air (78 dB SPL); LEVEL METER reads dB below digital full scale: 0 or less.',
  'SPECTRUM (RTA): the low tone is the tallest, warmest bar; its harmonic, a weaker tone at 3× its frequency, is shorter, cooler.',
];

const TRY_BURST =
  'Find the short burst. In WAVEFORM it is the tallest, warmest bars, about 70% of the way across. In SPECTROGRAM it is a bright upright streak at the same point.';
const TRY_SPL =
  'Compare SPL METER’s 78 dB SPL with LEVEL METER’s PEAK −3. 78 is the bigger number but the cooler color, because each meter colors its own scale.';
const TRY_SCOPE =
  'In OSCILLOSCOPE, follow the trace: blue where it crosses the zero line, warmer toward every crest, top and bottom. Level is distance from zero, not direction.';

/** WHAT THIS TEACHES — the shared opening lines. */
const TEACH_RULE = 'Wherever an Academy display shows level or amplitude, cooler colors mean less and warmer colors mean more.';
const TEACH_TERMS = 'Amplitude is how big the swings are. Level is that size read as a number, counted in dB (decibels).';
const TEACH_VIEWS = 'A waveform shows amplitude over time, a spectrum strength across frequency, a spectrogram both at once.';
const TEACH_AID = 'This color scale is a learning aid; real equipment and software use many schemes.';

export const AMPLITUDE_SCREEN_GUIDES: Record<AmplitudeScreenId, ScreenGuide> = {
  // ── the lab (Labs menu → Audio Fundamentals → first lab) ────────────────────
  lab: {
    intro: {
      learning: 'How every Academy display uses one color language for level: cooler means less, warmer means more. Also how amplitude, level, peak, RMS and dB SPL differ.',
      start: 'Read the color bar from LOW to HIGH. Then scroll through SIX VIEWS · ONE SIGNAL and find the short burst in WAVEFORM. Then try CHECK YOURSELF.',
    },
    seeing: [
      'Read the color bar: LOW (dark blue) to HIGH (red), marked quiet → loud, less → more, and pp, mp, f, fff (music marks, very soft to very loud).',
      'SIX VIEWS · ONE SIGNAL: one example sound, drawn still in WAVEFORM, OSCILLOSCOPE, LEVEL METER, SPL METER, SPECTRUM (RTA) and SPECTROGRAM.',
      'Then LEARNING CONVENTION, BLUE = LESS / RED = MORE, and CHECK YOURSELF — THREE QUICK READS (once passed: ✓ ORIENTATION COMPLETE).',
    ],
    control: [
      'Scroll the page. Nothing here plays sound or uses your microphone.',
      'In CHECK YOURSELF, answer three questions by tapping one of two choices: two color swatches, then two pad grids, then two small spectrum displays. A wrong tap costs nothing: you get an amber hint and a small color ramp, and you try again.',
      'When all three are right, tap UNDERSTOOD — MARK REVIEWED. The lab gets its ✓ in the Labs menu and you see ✓ ORIENTATION COMPLETE.',
      'Passed the color check before, on any screen? Then the check is hidden. Tap MARK REVIEWED if the lab isn’t marked yet, or TEST YOURSELF AGAIN › to practice the questions.',
      'FINISH · SEE WHAT’S LEFT › at the bottom shows what you still have to do. ‹ leaves the lab.',
    ],
    changes: CHANGES,
    teaches: [
      TEACH_RULE,
      TEACH_TERMS,
      TEACH_VIEWS,
      'These colors are a learning aid; real equipment and software use many color schemes.',
    ],
    tryThis: [TRY_BURST, TRY_SPL, TRY_SCOPE],
  },

  // ── the one-time primer, drawn in place of a gated lab or tool ──────────────
  primer: {
    intro: {
      learning: 'The color language every level display in the Academy uses, including the one you chose: cooler means less, warmer means more, on each display’s own scale.',
      start: 'Read the color bar from LOW to HIGH. Look at the six cards in SIX VIEWS · ONE SIGNAL. Then answer CHECK YOURSELF and tap UNDERSTOOD — CONTINUE.',
    },
    seeing: [
      'This page opened in place of the lab or tool you chose. It shows until you pass its check once, so you know the level colors first.',
      'The color bar runs from LOW (dark blue) to HIGH (red), marked quiet → loud and less → more.',
      'SIX VIEWS · ONE SIGNAL: one example sound on six cards. Each is a still drawing, not a live reading.',
      'Below them: LEARNING CONVENTION, BLUE = LESS / RED = MORE, then CHECK YOURSELF.',
    ],
    control: [
      'Scroll the page. Nothing here plays sound or uses your microphone.',
      'In CHECK YOURSELF, answer three questions by tapping one of two choices: two color swatches, then two pad grids, then two small spectrum displays.',
      'A wrong tap costs nothing: a short amber hint and a small color ramp appear, and you try again.',
      'When all three are right, tap UNDERSTOOD — CONTINUE. The screen you chose opens right here, and this page won’t come back.',
      '‹ takes you back without finishing; this page shows again next time. The lab itself is marked reviewed only in Understanding Level & Amplitude.',
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
