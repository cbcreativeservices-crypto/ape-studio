/**
 * Equalizer (the audible one-band FX lab, route EqLab, labId 'eq') —
 * "explain this screen" content (owner 2026-10-31, Screen Guide rollout;
 * standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + eqConfig in fxLabConfigs.tsx)
 * with three tabs, so the guides are keyed by the shell's tab id — the same
 * shape as the sibling effect labs (chorusScreenGuides.ts and others):
 *   explore — the rack: the animated EqFlow hero (fxAnim), the bezel
 *             (TYPE · FREQ · GAIN · Q), the dock (FREQ fader · TYPE · GAIN ·
 *             Q · SOURCE), the header ▶, LAB NOTES (DESIGNED RESPONSE + its
 *             caption, THE AUDIO PATH, two CHECK YOURSELF cards, ⓘ GUIDED
 *             LESSON);
 *   learn   — the reading page (the 'eq' guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts EQ, five
 *             questions). The SAME labId 'eq' check is rendered on the EQ Lab
 *             menu, so passing it in either place shows complete in both, and
 *             it is what completes the EQ Lab (trainingLabKeys tr_eq).
 *
 * Names are the on-screen names read from code; every TRY THIS number is what
 * the screen prints at that setting (the caption is eqConfig.heroCaption).
 * test/screenGuide_equalizer_20261031.test.ts pins the names and numbers.
 *
 * Wired in fxLabConfigs.tsx: eqConfig carries `guide: equalizerScreenGuide`
 * and `accuracy: false` (a concept lab: designed response, teaching model,
 * uncalibrated test audio — no live mic, no real-world measurement).
 *
 * Copy rules: plain language; KNOWLEDGE, never skills; no brand names; no
 * "N of total"; "suggest" never "recommend"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (LEARN, EXPLORE and — because labId 'eq'
 *  has an understanding check — CHECK). */
export type EqualizerScreenId = 'explore' | 'learn' | 'check';

export const EQUALIZER_SCREEN_GUIDES: Record<EqualizerScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How one EQ band reshapes a sound: TYPE picks the shape, FREQ where it acts, GAIN how far it lifts or cuts, and Q how wide it reaches.',
      start: 'Set SOURCE to PINK NOISE and tap ▶. Sweep the FREQ fader from bottom to top and listen to the boost travel. Then switch Q between 0.7 WIDE and 8 NARROW.',
    },
    seeing: [
      'The moving picture is a model, not the SOURCE you hear: a test wave of three tones goes IN ▸, through the green EQ stage, and comes ▸ OUT reshaped. Compare IN with OUT.',
      'Under it, the EQ CURVE strip runs 20 Hz → 20 kHz, lows left, highs right. Its dots are the wave’s 150 Hz · 1k · 6k tones; each grows or shrinks in OUT by the curve’s gain there.',
      'TYPE, FREQ, GAIN and Q on the frame show your band’s settings.',
    ],
    control: [
      'Slide the FREQ fader to place the band anywhere from 100 Hz to 8 kHz.',
      'Tap TYPE to pick the shape: PEAK (BELL), LOW SHELF, HIGH SHELF, HIGH-PASS or LOW-PASS. Each comes with a one-line description.',
      'Tap GAIN for −12, −6, 0, +6 or +12 dB, and Q for 0.7 WIDE, 1.4, 4 or 8 NARROW.',
      'Tap SOURCE for PINK NOISE, SINE 440 Hz or WHITE NOISE, then ▶ at the top right (or tap the display) to hear it through the EQ. Change any control while it plays.',
      'Long-press a control for its GUIDED LESSON entry. Below the dock, LAB NOTES holds DESIGNED RESPONSE, THE AUDIO PATH and two CHECK YOURSELF cards.',
    ],
    changes: [
      'FREQ moves the filter; the dots show which tones it lifts or lowers.',
      'GAIN sets how far a bell or shelf rises or falls. HIGH-PASS and LOW-PASS ignore it — they cut on a fixed slope.',
      'Q sets a bell’s width, 0.7 broad to 8 narrow. On LOW-PASS a high Q adds a bump before the cutoff (where the cut starts); this HIGH-PASS ignores Q.',
      'The curve shows what the band is set to do, not what your speaker plays.',
    ],
    teaches: [
      'What one EQ band does — shape, frequency, gain and Q — seen and heard together. This band is parametric; a graphic band fixes frequency and width and moves only gain.',
      'Pass filters have no gain: they remove one end on a fixed slope.',
      'A shelf lifts or lowers everything below or above FREQ; a bell touches only the region around it.',
      'Narrow Q is surgical, for one problem tone; wide Q is a broad, musical move.',
    ],
    tryThis: [
      'Set Q to 8 NARROW: the bell turns thin and the caption under DESIGNED RESPONSE reads +6 dB at 1 kHz, Q 8.',
      'Switch TYPE to HIGH-PASS, then tap through GAIN: the curve does not move — a pass filter has no gain.',
      'Pick PINK NOISE, tap ▶ and sweep FREQ from bottom to top: you hear the boost travel from low to high. For the low end use headphones or full-range speakers: a phone speaker can’t reproduce deep bass.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words of EQ — filter type, frequency, gain, Q, bandwidth and slope — and which key on the EXPLORE rack each one names.',
      start: 'Read the Q entry first. Then open EXPLORE, play PINK NOISE and switch Q between 0.7 WIDE and 8 NARROW to hear what you just read.',
    },
    seeing: [
      'You’re on the LEARN tab: the Equalizer guided lesson as one page to read. Nothing here plays.',
      'First what an equalizer is, then CONTROLS: the display, TYPE, FREQ, GAIN and Q.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live rack) and CHECK (the questions that complete the lab).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet; long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'Nothing on this page moves; it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry is named for its key on EXPLORE: TYPE, FREQ, GAIN and Q.',
      'The ranges are the rack’s: FREQ 100 Hz to 8 kHz here (EQs reach about 20 Hz to 20 kHz), GAIN −12 to +12 dB, Q 0.7 WIDE to 8 NARROW.',
    ],
    teaches: [
      'The words for EQ: filter type, frequency, gain, Q, bandwidth, slope.',
      'Why a narrow-boost sweep finds a problem but the fix is usually a cut, and why a flat analyzer is not the goal.',
      'Q = center frequency ÷ bandwidth. Slopes of 6, 12, 18 or 24 dB per octave come from 1 to 4 poles (filter stages).',
    ],
    tryThis: [
      'Read the Q entry, then on EXPLORE play PINK NOISE and switch Q between 0.7 WIDE and 8 NARROW: tone against ring.',
      'Read the COMMON MISTAKES line on boosting, then on EXPLORE compare GAIN at +6 dB and −6 dB at the same FREQ.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    intro: {
      learning: 'The five ideas behind one EQ band, reviewed as questions: Q and width, clearing low rumble, graphic against parametric, slope, and cutting before boosting.',
      start: 'Answer each question in turn. Unsure? Switch to LEARN first and reread that idea under CONTROLS or FORMULA / CONCEPT, then come back.',
    },
    seeing: [
      'You’re on the CHECK tab: CHECK YOUR UNDERSTANDING for the Equalizer — five questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'The tabs under the title go to LEARN or EXPLORE at any time.',
    ],
    changes: [
      'The questions cover Q and width, clearing low rumble, graphic against parametric, slope, and cutting before boosting.',
      'Get all five right and the lab is complete; the card reads Lab complete. The EQ Lab menu asks the same five, so passing here completes the EQ Lab too.',
    ],
    teaches: [
      'How the Q number relates to how wide a band reaches, and which filter shape clears low rumble.',
      'What sets a graphic EQ band apart from a parametric one.',
      'What a dB-per-octave slope measures, and why engineers often cut before they boost.',
    ],
    tryThis: [
      'Before the Q question, switch to LEARN and reread the Q entry under CONTROLS.',
      'For the slope question, switch to LEARN and reread FORMULA / CONCEPT, where filter slopes are given in dB per octave.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function equalizerScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? EQUALIZER_SCREEN_GUIDES[mode] : undefined;
}
