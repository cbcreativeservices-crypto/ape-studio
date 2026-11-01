/**
 * Noise Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: the five-slope chart, the COLOR / SLOPE / OUT
 *             readouts, the COLOR tray + SPKR dock keys, the header ▶, LAB
 *             NOTES (two CHECK YOURSELF questions);
 *   learn   — the reading page (the guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts NOISE).
 * No what's-left page exists in this lab (LabShell gets no `checkEnd`).
 *
 * Every name is the on-screen name in NoiseLabScreen.tsx (bezel keys, dock
 * labels, chip labels, section heads, the chart's tick labels). The chart has
 * NO dB scale printed on it, so no TRY THIS quotes a level off the chart —
 * only the SLOPE readout (dB/OCT, from the COLORS table) and what the lines
 * visibly do. OUT is not quoted either: on every engine with the native
 * high-pass (version ≥ 4) it reads −20 dBFS for all colors, on older ones the
 * guard lowers pink and brown, so a per-color OUT figure would be true on
 * one build only. SPKR + BROWN: the drawn line is −6·log2(f/1k) plus the
 * 2nd-order 150 Hz high-pass, whose slope reaches +6 dB per octave exactly
 * at the corner, so the brown line peaks at the amber marker and falls to
 * its left. test/screenGuide_noise_20261031.test.ts pins the names and that
 * maths.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type NoiseScreenId = 'explore' | 'learn' | 'check';

export const NOISE_SCREEN_GUIDES: Record<NoiseScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'Level per hertz against frequency: 20 Hz at the left, 20k at the right. Five straight lines, one per color, cross at the dot at 1 kHz.',
      'The selected line is bright; a faint trace on it shimmers while noise plays.',
      'Readouts: COLOR, SLOPE (tilt, dB per octave), OUT (level sent, dBFS). Badge: IDEALIZED SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT; with SPKR, PHONE SPEAKER OUTPUT — 150 Hz HPF ON plus the color.',
    ],
    control: [
      '▶ in the header plays the selected noise; ■ stops it. A tap on the chart does the same.',
      'COLOR key: WHITE, PINK, BROWN, BLUE or VIOLET, each chip in its own color, with a line on its character. The tray stays open to switch while noise plays. Long-press a chip for its lesson entry.',
      'SPKR key: the selected color as the phone speaker gets it, after a 150 Hz high-pass (faint amber line). The five straight lines dim; a bright curve is the filtered color. The key’s light shows it is on.',
      'Below the rack, LAB NOTES: WHAT YOU’RE SEEING, the speaker filter, OUTPUT LEVEL, two CHECK YOURSELF questions and the ⓘ GUIDED LESSON. ▴ HIDE DISPLAY gives them room; ⤢ FULL SCREEN enlarges the chart.',
    ],
    changes: [
      'Each octave up spans twice the hertz. WHITE (0 dB/OCT) has equal energy per hertz, so each octave up holds twice the energy: it sounds bright.',
      'PINK (−3 dB/OCT) cancels that doubling: every octave holds equal energy, so it sounds even.',
      'BROWN (−6) piles energy into the lows: rumble. BLUE (+3) and VIOLET (+6) tilt the other way, into hiss.',
      'Noise has no pitch: a color changes only the balance of low and high.',
    ],
    teaches: [
      'A noise color is a spectral slope in dB per octave: white 0, pink −3, brown −6, blue +3, violet +6.',
      'Why white sounds bright and pink balanced: hearing works in octaves, not equal slices of hertz.',
      'Why pink is the test noise for rooms and speakers: it reads flat on an octave-band analyzer (this per-hertz chart shows it at −3).',
      'Comes after Oscillators (pitched tones); Harmonics and FM Synthesis follow.',
    ],
    tryThis: [
      'Tap ▶ on PINK, then tap WHITE while it plays: SLOPE goes from −3 to 0 dB/OCT, the line goes flat, and the sound turns brighter and hissier.',
      'Step BROWN, PINK, WHITE, BLUE, VIOLET: the line tips from falling to rising and the sound slides from rumble to hiss. Every line still crosses the dot at 1 kHz.',
      'Pick BROWN and turn SPKR on: the line rises to the amber marker (150 Hz), then falls away to its left — the phone speaker gets far less of that rumble.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First, what the lab is. Then CONTROLS: the display, the five colors, Gray, and real-world noises such as HVAC, hum and buzz.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — slope, SNR and masking.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet over the rack.',
      'On EXPLORE, long-press COLOR, a color chip, SPKR or the COLOR or SLOPE readout — or tap the ⓘ after the readouts — to open just that entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'EXPLORE plays the five colors WHITE, PINK, BROWN, BLUE and VIOLET. The Gray and real-world entries are reading only, and this lab has no spectrogram: the lines that mention one describe another tool.',
      'The noise floor, SNR and masking lines are ideas to carry into other labs; this lab has no control for them.',
    ],
    teaches: [
      'The names and slopes of the noise colors, and the words noise floor, SNR and masking.',
      'Common mix-ups, such as expecting white noise to sound neutral.',
      'The reference behind EXPLORE and CHECK.',
    ],
    tryThis: [
      'Read the first COMMON MISTAKES line, then on EXPLORE play WHITE and switch to PINK: pink sounds the more even of the two.',
      'Read the Brown entry, then on EXPLORE play BROWN: SLOPE reads −6 dB/OCT and the sound is a low rumble.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab. Answer every one correctly to complete it.',
      'They ask why white noise sounds bright, how fast pink falls, which color is the rumble, and why pink is the standard test noise.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and the reason, and its number turns to ✓. Wrong: NOT QUITE — TRY ANOTHER, with the reason — pick again.',
      'There is no score, and a wrong answer costs nothing. The tabs under the title go to LEARN or EXPLORE.',
    ],
    changes: [
      'A right answer stays right while you stay on this tab. Leave before all are right and the questions start fresh, so look things up first.',
      'When every answer is right the page reads that the lab is complete, and it counts wherever this lab is required — it never needs taking twice.',
    ],
    teaches: [
      'It checks the core ideas: energy per hertz against energy per octave, and the slope of each color.',
      'Each explanation repeats the reason, so a wrong pick still teaches.',
    ],
    tryThis: [
      'Before you start, unsure of a slope? On EXPLORE tap each COLOR chip and read SLOPE: −3 for PINK, −6 for BROWN.',
      'Before you start, for the white-noise question: play WHITE then PINK on EXPLORE and listen to where the hiss sits.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function noiseScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? NOISE_SCREEN_GUIDES[mode] : undefined;
}
