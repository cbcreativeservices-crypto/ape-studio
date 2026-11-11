/**
 * Oscillator Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: the traveling wave strip + the 12 recipe bars, the
 *             WAVE / F0 / VIEW readouts, the WAVE / F0 / SPKR dock keys, the
 *             header ▶, LAB NOTES (two CHECK YOURSELF questions);
 *   learn   — the reading page (the guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts OSCILLATOR).
 * No what's-left page exists in this lab (LabShell gets no `checkEnd`).
 *
 * Every name is the on-screen name in OscillatorLabScreen.tsx (bezel keys,
 * dock labels, wave labels, section heads). Every number in TRY THIS is what
 * the screen draws at that setting, worked from harmonicModel.buildPreset
 * (the bars are the linear amplitudes, bar 1 = 1) and speakerSafety's
 * 2nd-order 150 Hz high-pass (the SPKR view multiplies each bar by its gain):
 *   SQUARE  bars 2,4,…,12 = 0 · TRIANGLE bar 3 = 1/9 · PULSE 25 % bars 4,8,12
 *   = 0, bar 2 = 0.707 · SPKR at F0 110: bar 1 × 0.474 (−6.5 dB) = 0.47,
 *   bar 2 = 0.5 × 0.907 = 0.45 → "about the height of bar 2"; at 880 Hz every
 *   gain is above 0.999.
 * The strip draws 3 cycles across 1.5 × the glass width, so the glass shows
 * TWO cycles at a time. test/screenGuide_oscillator_20261031.test.ts pins the
 * names and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type OscillatorScreenId = 'explore' | 'learn' | 'check';

export const OSCILLATOR_SCREEN_GUIDES: Record<OscillatorScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'Every classic wave is a recipe of harmonics: which multiples of the fundamental are present, and how strong, sets the timbre, while F0 alone sets the pitch.',
      start: 'Tap ▶, then open WAVE and switch between SINE, SQUARE and SAW while it plays. Watch the bars change and listen: the tone color shifts, but the pitch stays put.',
    },
    seeing: [
      'On top, the wave: two cycles traveling left to right, colored by level — redder toward full scale.',
      'Below: its recipe. Bars 1 to 12 are the first twelve harmonics; a bar’s height is how strong that harmonic is next to bar 1, the fundamental.',
      'Readouts: WAVE, F0 (the fundamental), VIEW (IDEAL or SPEAKER). Badge: ANALYTIC MODEL — NOT A MEASUREMENT; with SPKR on, PHONE SPEAKER OUTPUT — 150 Hz HPF APPLIED.',
    ],
    control: [
      '▶ in the header plays the wave you see; ■ stops it. A tap on the display does the same.',
      'Tap WAVE for SINE, SQUARE, TRIANGLE, SAW or PULSE 25%, each with a one-line description. The tray stays open, so you can switch while it plays. Long-press a choice for its lesson entry.',
      'Tap F0 for 110, 220, 440 or 880 Hz — each step one octave higher.',
      'Tap SPKR to see the signal after the phone speaker’s 150 Hz high-pass, which cuts deep lows; an amber line marks the filter’s effect on each bar. Its light shows it’s on.',
      'Below the rack, LAB NOTES: what you’re seeing, THE SOUND, two CHECK YOURSELF questions and the ⓘ GUIDED LESSON. ▴ HIDE DISPLAY gives them room; ⤢ FULL SCREEN enlarges the display.',
    ],
    changes: [
      'Each bar is a sine at a whole-number multiple of F0; added up, they make the shape.',
      'Change WAVE: the bars change, so the shape and the sound (timbre) change; the pitch stays.',
      'Change F0 (IDEAL view): only the pitch moves; the picture stays two cycles, drawn slowed down so you can see it.',
      'SPKR: the speaker filter shrinks the lowest bars, most at 110 Hz. Phone speakers lose that bass, SPKR on or off.',
    ],
    teaches: [
      'Every repeating sound is a stack of sines (Fourier). The classic waves differ only in which ones, and how strong.',
      'Sine: one. Square: odd at 1/n. Triangle: odd at 1/n², far softer. Saw: all at 1/n. Pulse 25%: every 4th gone.',
      'Digital waves must leave out harmonics above half the sample rate (Nyquist), or they fold back as aliasing.',
      'Even with a weak fundamental, you still hear the pitch, from the harmonics.',
    ],
    tryThis: [
      'Pick SQUARE: bars 2, 4, 6, 8, 10 and 12 go empty — odd harmonics only. Then TRIANGLE: the same bars are empty, and bar 3 drops to 1/9 of bar 1.',
      'Pick PULSE 25%: bars 4, 8 and 12 go empty — the duty cycle cancels every 4th harmonic — and bar 2 stands at about 0.7 of bar 1.',
      'On SAW set F0 to 110 Hz and turn SPKR on: bar 1 shrinks to about the height of bar 2 (the filter takes about 6.5 dB at 110 Hz). At 880 Hz the bars barely move.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words for oscillators — fundamental, harmonic, duty cycle, band-limiting, Nyquist and aliasing — and how FM and AM differ.',
      start: 'Read the PULSE 25% and TRIANGLE entries. Then open EXPLORE, pick PULSE 25% and see bars 4, 8 and 12 go empty while F0 stays put.',
    },
    seeing: [
      'You’re on the LEARN tab: this lab’s guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the wave.',
      'First, what the lab is. Then CONTROLS: the display, each wave (SINE, SQUARE, SAW, TRIANGLE, PULSE 25%), F0, Noise, FM and AM.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet over the rack.',
      'On EXPLORE, long-press WAVE, F0, SPKR, a WAVE choice or a readout — or tap the ⓘ after the readouts — to open just that entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'FM, AM, noise and the band-limiting ON/OFF tip are here to read only. EXPLORE has just WAVE, F0 and SPKR, and LAB NOTES says so for FM and AM. The Noise lab covers noise.',
      'The FORMULA / CONCEPT line gathers AM, FM and aliasing into one place.',
    ],
    teaches: [
      'The words for oscillators: fundamental, harmonic, duty cycle, band-limiting, Nyquist, aliasing.',
      'The common mix-ups, such as FM against AM, and what duty cycle does and does not change.',
      'FM sweeps a wave’s frequency; AM sweeps its level. They are two different kinds of modulation.',
    ],
    tryThis: [
      'Read the PULSE 25% entry, then on EXPLORE pick PULSE 25%: bars 4, 8 and 12 are empty, and F0 — the pitch — has not moved.',
      'Read the TRIANGLE entry, then on EXPLORE switch between TRIANGLE and SQUARE: the same bars are lit, but the triangle’s fall away far faster.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of harmonic recipes: which wave holds every harmonic, why a triangle sounds softer than a square, what duty cycle changes, and why harmonics above Nyquist are left out.',
      start: 'Read each question and tap an answer. Unsure? Use the tabs to look the idea up on LEARN or to try the waves on EXPLORE, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab. Get every one right to complete the lab.',
      'They ask which wave holds every harmonic, why a triangle sounds softer than a square, what a pulse’s duty cycle changes, and why harmonics above Nyquist are left out.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and the reason, and its number turns to ✓. Wrong: NOT QUITE — TRY ANOTHER, with the reason — pick again.',
      'There is no score, and a wrong answer costs nothing. The tabs under the title go to LEARN or EXPLORE.',
    ],
    changes: [
      'Answers already right stay right if you switch to LEARN or EXPLORE and come back; leaving the lab before the last one starts the check over.',
      'Get all four right and the check is passed; the page says so. A pass is kept: you never need to take the check twice.',
    ],
    teaches: [
      'A wave’s tone depends on which harmonics it holds and on how strong each one is.',
      'Why a wave can be missing some harmonics, and why a digital oscillator leaves the highest ones out.',
    ],
    tryThis: [
      'For the triangle question, read the TRIANGLE and SQUARE entries under CONTROLS on LEARN. On EXPLORE, long-press a choice in the WAVE tray for its entry.',
      'For the duty-cycle question, read the PULSE 25% entry under CONTROLS on LEARN, or long-press PULSE 25% in the WAVE tray on EXPLORE.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function oscillatorScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? OSCILLATOR_SCREEN_GUIDES[mode] : undefined;
}
